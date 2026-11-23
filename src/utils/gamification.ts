export interface PlayerProfile {
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  bestCombo: number;
  soundEnabled: boolean;
}

const PROFILE_KEY = 'pte60-player-profile-v2';

export interface LevelInfo {
  level: number;
  title: string;
  subtitle: string;
  currentXp: number;
  nextLevelXp: number;
  progressPct: number;
}

const LEVEL_TIERS: Array<{ minXp: number; title: string; subtitle: string }> = [
  { minXp: 0, title: 'Lv.1 台北刷題新手', subtitle: '剛買好機經準備啟程' },
  { minXp: 150, title: 'Lv.2 意群斷句學徒', subtitle: '嘴巴開始跟上 AI 節奏' },
  { minXp: 400, title: 'Lv.3 ACS 職評通關者', subtitle: 'Software Engineer 261313 認證入手' },
  { minXp: 800, title: 'Lv.4 墨爾本 Flat White 熟客', subtitle: '日常情境對答如流' },
  { minXp: 1400, title: 'Lv.5 雪梨 Tech Lead', subtitle: 'WFD 首字母秒殺高手' },
  { minXp: 2200, title: 'Lv.6 Competent 穩過大師', subtitle: '四科突破 58+ 安全緩衝線' },
  { minXp: 3200, title: 'Lv.7 澳洲 EOI 獲邀傳奇', subtitle: '準備訂機票飛往南半球！' },
];

export function getTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerProfile;
      return {
        xp: parsed.xp ?? 0,
        streakDays: parsed.streakDays ?? 1,
        lastActiveDate: parsed.lastActiveDate ?? null,
        bestCombo: parsed.bestCombo ?? 0,
        soundEnabled: parsed.soundEnabled ?? true,
      };
    }
  } catch {
    // Ignore
  }
  return {
    xp: 0,
    streakDays: 0,
    lastActiveDate: null,
    bestCombo: 0,
    soundEnabled: true,
  };
}

export function savePlayerProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function awardPlayerXp(
  prev: PlayerProfile,
  gainedXp: number,
  currentCombo = 1
): PlayerProfile {
  const today = getTodayIso();
  let nextStreak = prev.streakDays;

  if (prev.lastActiveDate !== today) {
    if (prev.lastActiveDate) {
      const last = new Date(`${prev.lastActiveDate}T00:00:00`);
      const now = new Date(`${today}T00:00:00`);
      const diffDays = Math.round((now.getTime() - last.getTime()) / 86400000);
      nextStreak = diffDays === 1 ? prev.streakDays + 1 : 1;
    } else {
      nextStreak = 1;
    }
  }

  const updated: PlayerProfile = {
    ...prev,
    xp: prev.xp + Math.max(1, Math.round(gainedXp)),
    streakDays: Math.max(1, nextStreak),
    lastActiveDate: today,
    bestCombo: Math.max(prev.bestCombo, currentCombo),
  };
  savePlayerProfile(updated);
  return updated;
}

export function computeLevelInfo(xp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (xp >= LEVEL_TIERS[i].minXp) idx = i;
  }
  const cur = LEVEL_TIERS[idx];
  const next = LEVEL_TIERS[idx + 1];
  if (!next) {
    return {
      level: idx + 1,
      title: cur.title,
      subtitle: cur.subtitle,
      currentXp: xp,
      nextLevelXp: cur.minXp,
      progressPct: 100,
    };
  }
  const span = next.minXp - cur.minXp;
  const into = xp - cur.minXp;
  return {
    level: idx + 1,
    title: cur.title,
    subtitle: cur.subtitle,
    currentXp: xp,
    nextLevelXp: next.minXp,
    progressPct: Math.min(100, Math.round((into / span) * 100)),
  };
}

/* Zero-dependency crisp Web Audio sound synthesizer for addictive tactile feedback */
let sharedAudioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playGameSfx(
  type: 'tap' | 'combo' | 'wrong' | 'win',
  enabled = true
): void {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'tap') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.065);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.linearRampToValueAtTime(155, now + 0.14);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  } else if (type === 'combo' || type === 'win') {
    const notes = type === 'win' ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t0 = now + i * 0.065;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.11, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.19);
    });
  }
}
