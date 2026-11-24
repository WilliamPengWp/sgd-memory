export type DeckType = 'wfd' | 'sgd' | 'rs' | 'rts' | 'di' | 'ra' | 'fib' | 'writing';
export type Rating = 'forgot' | 'hard' | 'easy';

export interface SrsCard {
  cardKey: string;
  deck: DeckType;
  itemId: number;
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReview: string; // YYYY-MM-DD
  lastReview: string | null;
  lastReviewTs?: number | null; // epoch ms for hour-level Ebbinghaus decay
  stabilityHours?: number; // S in R(t) = exp(-t / S)
}

export interface ReviewHistoryEntry {
  cardKey: string;
  deck: DeckType;
  itemId: number;
  rating: Rating;
  date: string;
  ts: number;
}

export interface CustomImportedWfd {
  id: number; // >= 10001
  text: string;
  textZh: string;
  sourceTag: string;
}

const LEGACY_SGD_CARDS_KEY = 'sgd-memory-cards';
const LEGACY_SGD_HISTORY_KEY = 'sgd-memory-history';

const STUDIO_CARDS_KEY = 'pte60-studio-cards-v1';
const STUDIO_HISTORY_KEY = 'pte60-studio-history-v1';
const STUDIO_WEEKLY_KEY = 'pte60-studio-weekly-checks-v1';
const CUSTOM_WFD_KEY = 'pte60-custom-firefly-wfd-v1';

const QUALITY_MAP: Record<Rating, number> = {
  forgot: 1,
  hard: 3,
  easy: 5,
};

export function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setDate(dt.getDate() + Math.max(1, Math.round(days)));
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function makeCardKey(deck: DeckType, itemId: number): string {
  return `${deck}:${itemId}`;
}

export function createInitialCard(deck: DeckType, itemId: number): SrsCard {
  return {
    cardKey: makeCardKey(deck, itemId),
    deck,
    itemId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: todayStr(),
    lastReview: null,
    lastReviewTs: null,
    stabilityHours: 0,
  };
}

export function applySm2Rating(card: SrsCard, rating: Rating): SrsCard {
  const q = QUALITY_MAP[rating];
  const today = todayStr();
  const nowTs = Date.now();

  if (q < 3) {
    return {
      ...card,
      repetitions: 0,
      interval: 0,
      nextReview: today,
      lastReview: today,
      lastReviewTs: nowTs,
      stabilityHours: 8, // Decays quickly so user rescues it within hours
    };
  }

  const nextReps = card.repetitions + 1;
  let nextInterval =
    card.repetitions === 0
      ? 1
      : card.repetitions === 1
        ? 3
        : Math.round(card.interval * card.easeFactor);

  if (rating === 'hard') {
    nextInterval = Math.max(1, Math.round(nextInterval * 0.6));
  }

  const nextEase = Math.max(
    1.3,
    card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // Ebbinghaus stability S in hours: calibrated so at nextInterval days R(t) ~ 72% (Golden Review Point!)
  // Since exp(-24 * nextInterval / S) = 0.72 => S ~ (24 * nextInterval) / 0.33
  const nextStabilityHours = Math.max(
    18,
    Math.round((nextInterval * 24) / (rating === 'easy' ? 0.28 : 0.38))
  );

  return {
    ...card,
    easeFactor: nextEase,
    interval: nextInterval,
    repetitions: nextReps,
    nextReview: addDays(today, nextInterval),
    lastReview: today,
    lastReviewTs: nowTs,
    stabilityHours: nextStabilityHours,
  };
}

/**
 * Ebbinghaus Retention Formula: R(t) = exp(-elapsedHours / S) * 100
 */
export function computeCardRetention(card: SrsCard, nowTs = Date.now()): number {
  if (card.repetitions === 0 && !card.lastReview && !card.lastReviewTs) {
    return 0; // Unseen
  }
  const stability =
    card.stabilityHours && card.stabilityHours > 0
      ? card.stabilityHours
      : Math.max(16, (card.interval || 1) * 24 * 2.8);

  let elapsedHours = 4;
  if (card.lastReviewTs) {
    elapsedHours = Math.max(0.1, (nowTs - card.lastReviewTs) / 3600000);
  } else if (card.lastReview) {
    const dt = new Date(`${card.lastReview}T12:00:00`).getTime();
    elapsedHours = Math.max(1, (nowTs - dt) / 3600000);
  }

  const r = Math.exp(-elapsedHours / stability) * 100;
  return Math.max(5, Math.min(100, Math.round(r)));
}

export interface ForgettingCurveSummary {
  strongCount: number; // R >= 82%
  goldenCount: number; // 58% <= R < 82% (Best moment to review!)
  fadingCount: number; // 0 < R < 58% (Urgent rescue!)
  unseenCount: number;
  averageRetention: number;
  rescueQueue: SrsCard[]; // Sorted lowest retention first
}

export function computeForgettingCurveSummary(
  cardsMap: Record<string, SrsCard>
): ForgettingCurveSummary {
  const now = Date.now();
  let strongCount = 0;
  let goldenCount = 0;
  let fadingCount = 0;
  let unseenCount = 0;
  let sumR = 0;
  let seenTotal = 0;
  const rescueCandidates: Array<{ card: SrsCard; r: number }> = [];

  for (const card of Object.values(cardsMap)) {
    const r = computeCardRetention(card, now);
    if (r === 0) {
      unseenCount++;
      continue;
    }
    seenTotal++;
    sumR += r;
    if (r >= 82) {
      strongCount++;
    } else if (r >= 58) {
      goldenCount++;
      rescueCandidates.push({ card, r });
    } else {
      fadingCount++;
      rescueCandidates.push({ card, r });
    }
  }

  rescueCandidates.sort((a, b) => a.r - b.r);

  return {
    strongCount,
    goldenCount,
    fadingCount,
    unseenCount,
    averageRetention: seenTotal > 0 ? Math.round(sumR / seenTotal) : 100,
    rescueQueue: rescueCandidates.map((x) => x.card),
  };
}

export function isCardDue(card?: SrsCard): boolean {
  if (!card) return true;
  if (card.nextReview <= todayStr()) return true;
  const r = computeCardRetention(card);
  return r > 0 && r < 76;
}

export interface DeckRegistration {
  deck: DeckType;
  ids: number[];
}

export function loadAllCards(registrations: DeckRegistration[]): Record<string, SrsCard> {
  const map: Record<string, SrsCard> = {};

  try {
    const legacyRaw = localStorage.getItem(LEGACY_SGD_CARDS_KEY);
    if (legacyRaw) {
      const legacyArr = JSON.parse(legacyRaw) as Array<{
        questionId: number;
        easeFactor: number;
        interval: number;
        repetitions: number;
        nextReview: string;
        lastReview: string | null;
      }>;
      for (const c of legacyArr) {
        if (typeof c.questionId === 'number') {
          const key = makeCardKey('sgd', c.questionId);
          map[key] = {
            cardKey: key,
            deck: 'sgd',
            itemId: c.questionId,
            easeFactor: c.easeFactor ?? 2.5,
            interval: c.interval ?? 0,
            repetitions: c.repetitions ?? 0,
            nextReview: c.nextReview ?? todayStr(),
            lastReview: c.lastReview ?? null,
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  try {
    const studioRaw = localStorage.getItem(STUDIO_CARDS_KEY);
    if (studioRaw) {
      const storedMap = JSON.parse(studioRaw) as Record<string, SrsCard>;
      for (const [key, card] of Object.entries(storedMap)) {
        if (card && card.cardKey) {
          map[key] = card;
        }
      }
    }
  } catch {
    // Ignore
  }

  for (const reg of registrations) {
    for (const id of reg.ids) {
      const key = makeCardKey(reg.deck, id);
      if (!map[key]) {
        map[key] = createInitialCard(reg.deck, id);
      }
    }
  }

  return map;
}

export function saveAllCards(cardsMap: Record<string, SrsCard>): void {
  localStorage.setItem(STUDIO_CARDS_KEY, JSON.stringify(cardsMap));

  const sgdLegacy = Object.values(cardsMap)
    .filter((c) => c.deck === 'sgd')
    .sort((a, b) => a.itemId - b.itemId)
    .map((c) => ({
      questionId: c.itemId,
      easeFactor: c.easeFactor,
      interval: c.interval,
      repetitions: c.repetitions,
      nextReview: c.nextReview,
      lastReview: c.lastReview,
    }));
  localStorage.setItem(LEGACY_SGD_CARDS_KEY, JSON.stringify(sgdLegacy));
}

export function loadHistory(): ReviewHistoryEntry[] {
  try {
    const studioRaw = localStorage.getItem(STUDIO_HISTORY_KEY);
    if (studioRaw) {
      return JSON.parse(studioRaw) as ReviewHistoryEntry[];
    }
    const legacyRaw = localStorage.getItem(LEGACY_SGD_HISTORY_KEY);
    if (legacyRaw) {
      const legacyArr = JSON.parse(legacyRaw) as Array<{
        questionId: number;
        rating: Rating;
        date: string;
        ts: number;
      }>;
      const migrated: ReviewHistoryEntry[] = legacyArr.map((h) => ({
        cardKey: makeCardKey('sgd', h.questionId),
        deck: 'sgd',
        itemId: h.questionId,
        rating: h.rating,
        date: h.date,
        ts: h.ts,
      }));
      localStorage.setItem(STUDIO_HISTORY_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // Ignore
  }
  return [];
}

export function appendHistory(deck: DeckType, itemId: number, rating: Rating): ReviewHistoryEntry[] {
  const history = loadHistory();
  const entry: ReviewHistoryEntry = {
    cardKey: makeCardKey(deck, itemId),
    deck,
    itemId,
    rating,
    date: todayStr(),
    ts: Date.now(),
  };
  const updated = [...history, entry];
  localStorage.setItem(STUDIO_HISTORY_KEY, JSON.stringify(updated));

  if (deck === 'sgd') {
    try {
      const raw = localStorage.getItem(LEGACY_SGD_HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ questionId: itemId, rating, date: entry.date, ts: entry.ts });
      localStorage.setItem(LEGACY_SGD_HISTORY_KEY, JSON.stringify(arr));
    } catch {
      // Ignore
    }
  }
  return updated;
}

export interface DeckStats {
  deck: DeckType;
  total: number;
  reviewed: number;
  due: number;
  newCount: number;
  mastered: number;
}

export function computeDeckStats(cardsMap: Record<string, SrsCard>, deck: DeckType): DeckStats {
  const list = Object.values(cardsMap).filter((c) => c.deck === deck);
  let reviewed = 0;
  let due = 0;
  let newCount = 0;
  let mastered = 0;

  for (const c of list) {
    if (c.repetitions === 0 && !c.lastReview) {
      newCount++;
    } else {
      reviewed++;
      if (c.interval >= 14) mastered++;
    }
    if (isCardDue(c)) {
      due++;
    }
  }

  return {
    deck,
    total: list.length,
    reviewed,
    due,
    newCount,
    mastered,
  };
}

export interface DailyActivityPoint {
  date: string;
  count: number;
  easy: number;
  hard: number;
  forgot: number;
}

export function getRecentActivity(history: ReviewHistoryEntry[], days = 14): DailyActivityPoint[] {
  const byDate = new Map<string, { count: number; easy: number; hard: number; forgot: number }>();
  for (const h of history) {
    const cur = byDate.get(h.date) ?? { count: 0, easy: 0, hard: 0, forgot: 0 };
    cur.count++;
    cur[h.rating]++;
    byDate.set(h.date, cur);
  }

  const now = new Date();
  const result: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - i);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const stats = byDate.get(ds) ?? { count: 0, easy: 0, hard: 0, forgot: 0 };
    result.push({ date: ds, ...stats });
  }
  return result;
}

export function getUpcomingForecast(cardsMap: Record<string, SrsCard>, days = 7): Array<{ date: string; count: number }> {
  const all = Object.values(cardsMap).filter((c) => c.repetitions > 0 || !!c.lastReview);
  const now = new Date();
  const out: Array<{ date: string; count: number }> = [];

  for (let i = 0; i < days; i++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + i);
    const ds = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const count =
      i === 0
        ? all.filter((c) => isCardDue(c)).length
        : all.filter((c) => c.nextReview === ds).length;
    out.push({ date: ds, count });
  }
  return out;
}

export interface SkillReadiness {
  skill: 'Speaking' | 'Writing' | 'Reading' | 'Listening';
  labelZh: string;
  dhaMin: number;
  safeTarget: number;
  estimatedBand: number;
  drivers: string;
}

export function estimateSkillReadiness(cardsMap: Record<string, SrsCard>): SkillReadiness[] {
  const ratio = (deck: DeckType) => {
    const s = computeDeckStats(cardsMap, deck);
    if (s.total === 0) return 0;
    return Math.min(1, (s.reviewed / s.total) * 0.7 + (s.mastered / s.total) * 0.3);
  };

  const wfd = ratio('wfd');
  const rs = ratio('rs');
  const sgd = ratio('sgd');
  const rts = ratio('rts');
  const di = ratio('di');
  const ra = ratio('ra');
  const fib = ratio('fib');

  const speakingScore = Math.round(42 + (rs * 0.32 + ra * 0.2 + sgd * 0.2 + di * 0.16 + rts * 0.12) * 23);
  const writingScore = Math.round(41 + (wfd * 0.65 + fib * 0.35) * 22);
  const readingScore = Math.round(42 + fib * 21);
  const listeningScore = Math.round(41 + (wfd * 0.45 + rs * 0.32 + sgd * 0.23) * 23);

  return [
    {
      skill: 'Speaking',
      labelZh: '口說 Speaking',
      dhaMin: 54,
      safeTarget: 60,
      estimatedBand: speakingScore,
      drivers: 'RS + RA + SGD + DI + RTS',
    },
    {
      skill: 'Writing',
      labelZh: '寫作 Writing',
      dhaMin: 51,
      safeTarget: 58,
      estimatedBand: writingScore,
      drivers: 'WFD (主力) + SWT + WE + SST',
    },
    {
      skill: 'Reading',
      labelZh: '閱讀 Reading',
      dhaMin: 48,
      safeTarget: 58,
      estimatedBand: readingScore,
      drivers: 'FIB-RW + FIB-R + SWT + HIW',
    },
    {
      skill: 'Listening',
      labelZh: '聽力 Listening',
      dhaMin: 47,
      safeTarget: 58,
      estimatedBand: listeningScore,
      drivers: 'WFD + RS + SGD + SST + HIW',
    },
  ];
}

/* Custom Firefly / Prediction Importer */
export function loadCustomWfdItems(): CustomImportedWfd[] {
  try {
    const raw = localStorage.getItem(CUSTOM_WFD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomWfdBatch(rawPaste: string, tag = '螢火蟲自訂匯入'): CustomImportedWfd[] {
  const existing = loadCustomWfdItems();
  let nextId = existing.length > 0 ? Math.max(...existing.map((x) => x.id)) + 1 : 10001;

  const lines = rawPaste
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const added: CustomImportedWfd[] = [];
  for (let i = 0; i < lines.length; i++) {
    // Strip leading numbering like "1.", "#131500", "Q12", "WFD #88"
    const cleaned = lines[i]
      .replace(/^(WFD|RS)?\s*[#Q]?\d+[\s.:：\-)]*/i, '')
      .trim();

    // Check if mostly English sentence (>= 4 words)
    const englishWords = cleaned.match(/[a-zA-Z']+/g) || [];
    if (englishWords.length >= 4) {
      // Check if next line is Chinese translation
      let zh = '自訂預測機經句（建議搭配積木模式與首字母記憶）';
      if (i + 1 < lines.length && /[\u4e00-\u9fff]/.test(lines[i + 1])) {
        zh = lines[i + 1].trim();
        i++;
      }
      const normalizedSentence = cleaned.endsWith('.') || cleaned.endsWith('?') ? cleaned : `${cleaned}.`;
      if (!existing.some((e) => e.text.toLowerCase() === normalizedSentence.toLowerCase())) {
        added.push({
          id: nextId++,
          text: normalizedSentence.charAt(0).toUpperCase() + normalizedSentence.slice(1),
          textZh: zh,
          sourceTag: tag,
        });
      }
    }
  }

  const merged = [...added, ...existing];
  localStorage.setItem(CUSTOM_WFD_KEY, JSON.stringify(merged));
  return merged;
}

export function loadWeeklyChecks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STUDIO_WEEKLY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveWeeklyChecks(checks: Record<string, boolean>): void {
  localStorage.setItem(STUDIO_WEEKLY_KEY, JSON.stringify(checks));
}

export function exportStudioBackup(): string {
  return JSON.stringify(
    {
      version: 3,
      exportedAt: new Date().toISOString(),
      cards: localStorage.getItem(STUDIO_CARDS_KEY),
      history: localStorage.getItem(STUDIO_HISTORY_KEY),
      weekly: localStorage.getItem(STUDIO_WEEKLY_KEY),
      customWfd: localStorage.getItem(CUSTOM_WFD_KEY),
    },
    null,
    2
  );
}

export function importStudioBackup(jsonText: string): boolean {
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed.cards) localStorage.setItem(STUDIO_CARDS_KEY, parsed.cards);
    if (parsed.history) localStorage.setItem(STUDIO_HISTORY_KEY, parsed.history);
    if (parsed.weekly) localStorage.setItem(STUDIO_WEEKLY_KEY, parsed.weekly);
    if (parsed.customWfd) localStorage.setItem(CUSTOM_WFD_KEY, parsed.customWfd);
    return true;
  } catch {
    return false;
  }
}

export function resetAllStudioProgress(): void {
  localStorage.removeItem(STUDIO_CARDS_KEY);
  localStorage.removeItem(STUDIO_HISTORY_KEY);
  localStorage.removeItem(LEGACY_SGD_CARDS_KEY);
  localStorage.removeItem(LEGACY_SGD_HISTORY_KEY);
}
