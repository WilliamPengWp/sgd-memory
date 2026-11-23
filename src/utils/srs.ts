export type DeckType = 'wfd' | 'sgd' | 'rs' | 'rts' | 'di' | 'ra' | 'fib';
export type Rating = 'forgot' | 'hard' | 'easy';

export interface SrsCard {
  cardKey: string; // e.g. "sgd:1", "wfd:12"
  deck: DeckType;
  itemId: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string; // YYYY-MM-DD
  lastReview: string | null;
}

export interface ReviewHistoryEntry {
  cardKey: string;
  deck: DeckType;
  itemId: number;
  rating: Rating;
  date: string;
  ts: number;
}

// Legacy keys from original sgd-memory for 100% lossless migration & sync
const LEGACY_SGD_CARDS_KEY = 'sgd-memory-cards';
const LEGACY_SGD_HISTORY_KEY = 'sgd-memory-history';

const STUDIO_CARDS_KEY = 'pte60-studio-cards-v1';
const STUDIO_HISTORY_KEY = 'pte60-studio-history-v1';
const STUDIO_WEEKLY_KEY = 'pte60-studio-weekly-checks-v1';

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
  };
}

export function applySm2Rating(card: SrsCard, rating: Rating): SrsCard {
  const q = QUALITY_MAP[rating];
  const today = todayStr();

  if (q < 3) {
    return {
      ...card,
      repetitions: 0,
      interval: 0,
      nextReview: today,
      lastReview: today,
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

  return {
    ...card,
    easeFactor: nextEase,
    interval: nextInterval,
    repetitions: nextReps,
    nextReview: addDays(today, nextInterval),
    lastReview: today,
  };
}

export function isCardDue(card: SrsCard): boolean {
  return card.nextReview <= todayStr();
}

export interface DeckRegistration {
  deck: DeckType;
  ids: number[];
}

export function loadAllCards(registrations: DeckRegistration[]): Record<string, SrsCard> {
  const map: Record<string, SrsCard> = {};

  // 1. Hydrate legacy sgd-memory-cards first so existing GitHub Pages users keep 100% progress
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
    // Ignore malformed legacy storage
  }

  // 2. Hydrate unified studio cards (overrides or extends legacy)
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
    // Ignore malformed studio storage
  }

  // 3. Ensure every registered item has a card
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

  // Keep legacy sgd-memory-cards synchronized for full compatibility
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
    // Migrate legacy sgd-memory-history if studio history doesn't exist yet
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
  mastered: number; // interval >= 14 days
}

export function computeDeckStats(cardsMap: Record<string, SrsCard>, deck: DeckType): DeckStats {
  const today = todayStr();
  const list = Object.values(cardsMap).filter((c) => c.deck === deck);
  let reviewed = 0;
  let due = 0;
  let newCount = 0;
  let mastered = 0;

  for (const c of list) {
    if (c.repetitions === 0) {
      newCount++;
    } else {
      reviewed++;
      if (c.interval >= 14) mastered++;
    }
    if (c.nextReview <= today) {
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
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const ds = `${y}-${m}-${d}`;
    const stats = byDate.get(ds) ?? { count: 0, easy: 0, hard: 0, forgot: 0 };
    result.push({ date: ds, ...stats });
  }
  return result;
}

export function getUpcomingForecast(cardsMap: Record<string, SrsCard>, days = 7): Array<{ date: string; count: number }> {
  const all = Object.values(cardsMap).filter((c) => c.repetitions > 0);
  const now = new Date();
  const out: Array<{ date: string; count: number }> = [];

  for (let i = 0; i < days; i++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + i);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const ds = `${y}-${m}-${d}`;
    const count =
      i === 0
        ? all.filter((c) => c.nextReview <= ds).length
        : all.filter((c) => c.nextReview === ds).length;
    out.push({ date: ds, count });
  }
  return out;
}

/**
 * Estimates readiness towards Australian Competent English (post-2025/8/7):
 * Speaking >= 54 (Target 60), Writing >= 51 (Target 58), Reading >= 48 (Target 58), Listening >= 47 (Target 58)
 * Weighted strictly by Pearson's 2025/2026 Cross-Scoring Matrix!
 */
export interface SkillReadiness {
  skill: 'Speaking' | 'Writing' | 'Reading' | 'Listening';
  labelZh: string;
  dhaMin: number; // Home Affairs Competent floor
  safeTarget: number; // 58-60 buffer target
  estimatedBand: number; // 35..65 scale based on mastered/reviewed SRS coverage
  drivers: string;
}

export function estimateSkillReadiness(cardsMap: Record<string, SrsCard>): SkillReadiness[] {
  const ratio = (deck: DeckType) => {
    const s = computeDeckStats(cardsMap, deck);
    if (s.total === 0) return 0;
    // Reviewed gives 65% weight, mastered gives remaining 35%
    return Math.min(1, (s.reviewed / s.total) * 0.65 + (s.mastered / s.total) * 0.35);
  };

  const wfd = ratio('wfd');
  const rs = ratio('rs');
  const sgd = ratio('sgd');
  const rts = ratio('rts');
  const di = ratio('di');
  const ra = ratio('ra');
  const fib = ratio('fib');

  // Baseline engineer starting score ~40, full deck mastery pushes safely to ~62-64
  const speakingScore = Math.round(41 + (rs * 0.32 + ra * 0.2 + sgd * 0.2 + di * 0.16 + rts * 0.12) * 23);
  const writingScore = Math.round(40 + (wfd * 0.65 + fib * 0.35) * 22);
  const readingScore = Math.round(41 + fib * 21);
  const listeningScore = Math.round(40 + (wfd * 0.45 + rs * 0.32 + sgd * 0.23) * 23);

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
      version: 2,
      exportedAt: new Date().toISOString(),
      cards: localStorage.getItem(STUDIO_CARDS_KEY),
      history: localStorage.getItem(STUDIO_HISTORY_KEY),
      weekly: localStorage.getItem(STUDIO_WEEKLY_KEY),
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
