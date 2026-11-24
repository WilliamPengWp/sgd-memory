import { SGD_QUESTIONS, SgdQuestion } from '../data/sgdQuestions';
import { WfdItem, mergeAllWfdQuestions } from '../data/wfdData';
import {
  RS_QUESTIONS,
  RsQuestion,
  RTS_QUESTIONS,
  RtsQuestion,
  RA_QUESTIONS,
  RaQuestion,
} from '../data/speakingData';
import { FIB_ITEMS, FibItem, WRITING_PROMPTS, WritingPrompt } from '../data/rwData';
import {
  CustomImportedWfd,
  DeckRegistration,
  DeckType,
  SrsCard,
  computeCardRetention,
  computeForgettingCurveSummary,
  isCardDue,
  makeCardKey,
  todayStr,
} from './srs';
import { resolvePublicAsset } from './speech';

export interface LivePredictionPayload {
  syncedAt: string;
  weekLabel: string;
  counts: {
    wfd: number;
    rs: number;
    ra: number;
    swt: number;
    we: number;
  };
  wfd: Array<{
    id: number;
    text: string;
    isNew?: boolean;
    distractors?: [string, string];
  }>;
  rs: Array<{
    id: number;
    chunkA: string;
    chunkB: string;
    isNew?: boolean;
  }>;
  ra: Array<{
    id: number;
    title: string;
    plainText: string;
    markedText: string;
    isNew?: boolean;
  }>;
  swt: Array<{
    id: string;
    type: 'SWT';
    title: string;
    sourceText: string;
    keywords: string[];
    isNew?: boolean;
  }>;
  we: Array<{
    id: string;
    type: 'WE';
    title: string;
    sourceText: string;
    keywords: string[];
    isNew?: boolean;
  }>;
}

export interface IndexedWritingPrompt extends WritingPrompt {
  numericId: number;
  isNewPrediction?: boolean;
}

export interface UnifiedQuestionBank {
  weekLabel: string;
  syncedAt: string | null;
  totalPredictionsCount: number;
  wfd: WfdItem[];
  rs: RsQuestion[];
  ra: RaQuestion[];
  sgd: SgdQuestion[];
  rts: RtsQuestion[];
  fib: FibItem[];
  writing: IndexedWritingPrompt[];
}

export interface DailyQueueEntry {
  uid: string;
  deck: DeckType;
  itemId: number;
  reason: 'rescue' | 'prediction' | 'daily';
  retentionPct?: number;
}

export interface DailyStreamState {
  date: string;
  queue: DailyQueueEntry[];
  completedUids: string[];
  scoresByUid: Record<string, number>;
}

const DAILY_STREAM_STORAGE_KEY = 'pte60-daily-stream-v1';

export async function fetchWeeklyPredictionBank(): Promise<LivePredictionPayload | null> {
  try {
    const apiResp = await fetch('./api/predictions', { cache: 'no-store' });
    if (apiResp.ok) {
      const data = await apiResp.json();
      if (data && Array.isArray(data.wfd)) return data as LivePredictionPayload;
    }
  } catch {
    // Fall back to static bundle snapshot (GitHub Pages / offline)
  }

  try {
    const staticUrl = resolvePublicAsset('predictions-latest.json');
    const staticResp = await fetch(staticUrl, { cache: 'no-cache' });
    if (staticResp.ok) {
      const data = await staticResp.json();
      if (data && Array.isArray(data.wfd)) return data as LivePredictionPayload;
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function triggerServerPredictionSync(): Promise<LivePredictionPayload | null> {
  try {
    const resp = await fetch('./api/predictions/sync', { method: 'POST' });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.payload) return data.payload as LivePredictionPayload;
    }
  } catch {
    // Fallback to static snapshot refresh on static hosting
  }
  return fetchWeeklyPredictionBank();
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildUnifiedBank(
  live: LivePredictionPayload | null,
  customWfd: CustomImportedWfd[]
): UnifiedQuestionBank {
  // 1. WFD: Curated (with Chinese mnemonics) + Custom + Live Weekly Predictions (deduplicated)
  const baseWfd = mergeAllWfdQuestions(customWfd);
  const seenWfd = new Set(baseWfd.map((x) => normalizeKey(x.text)));
  const liveWfdMapped: WfdItem[] = [];

  if (live?.wfd) {
    for (const item of live.wfd) {
      const nk = normalizeKey(item.text);
      if (!nk || seenWfd.has(nk)) continue;
      seenWfd.add(nk);
      liveWfdMapped.push({
        id: item.id,
        text: item.text,
        textZh: item.isNew ? '🔥 本週最新預測機經句（建議搭配單字積木與首字母記憶）' : '⚡ 當週高頻預測題庫真題',
        freqTag: item.isNew ? '🔥 11月新預測' : '⚡ 螢火蟲超高頻',
        trapNote: '注意句首大寫、單複數 -s、過去分詞 -ed 與句尾句號。',
        mnemonic: '先聽整句畫面意群，再用單字積木秒排結構！',
        distractors: item.distractors && item.distractors.length === 2 ? item.distractors : ['were', 'has'],
      });
    }
  }
  const allWfd = [...baseWfd, ...liveWfdMapped];

  // 2. RS: Curated + Live Weekly Predictions
  const seenRs = new Set(RS_QUESTIONS.map((q) => normalizeKey(`${q.chunkA} ${q.chunkB}`)));
  const liveRsMapped: RsQuestion[] = [];
  if (live?.rs) {
    for (const item of live.rs) {
      const nk = normalizeKey(`${item.chunkA} ${item.chunkB}`);
      if (!nk || seenRs.has(nk)) continue;
      seenRs.add(nk);
      liveRsMapped.push({
        id: item.id,
        chunkA: item.chunkA,
        chunkB: item.chunkB,
        textZh: item.isNew ? '🔥 本週最新 RS 預測真題' : '⚡ 當週 RS 預測題庫',
        tip: '穩穩唸出前半色塊意群、零停頓不回頭改字，流利度直接拿滿！',
      });
    }
  }
  const allRs = [...RS_QUESTIONS, ...liveRsMapped];

  // 3. RA: Curated + Live Weekly Predictions
  const seenRa = new Set(RA_QUESTIONS.map((q) => normalizeKey(q.plainText.slice(0, 60))));
  const liveRaMapped: RaQuestion[] = [];
  if (live?.ra) {
    for (const item of live.ra) {
      const nk = normalizeKey(item.plainText.slice(0, 60));
      if (!nk || seenRa.has(nk)) continue;
      seenRa.add(nk);
      liveRaMapped.push({
        id: item.id,
        title: item.isNew ? `${item.title} (🔥 本週新預測)` : item.title,
        plainText: item.plainText,
        markedText: item.markedText,
        traps: '跟著「/」斜線意群自然換氣，遇到長難字直接平穩滑過勿卡頓。',
      });
    }
  }
  const allRa = [...RA_QUESTIONS, ...liveRaMapped];

  // 4. Writing (SWT + WE): Curated + Live Weekly Predictions
  const curatedWriting: IndexedWritingPrompt[] = WRITING_PROMPTS.filter(
    (w) => w.type === 'SWT' || w.type === 'WE'
  ).map((w, idx) => ({
    ...w,
    numericId: 5001 + idx,
  }));

  const seenWriting = new Set(
    curatedWriting.map((w) => normalizeKey(w.sourceTextOrTranscript.slice(0, 60)))
  );
  const liveWriting: IndexedWritingPrompt[] = [];

  if (live?.swt) {
    live.swt.forEach((item, idx) => {
      const nk = normalizeKey(item.sourceText.slice(0, 60));
      if (!nk || seenWriting.has(nk)) return;
      seenWriting.add(nk);
      liveWriting.push({
        id: item.id,
        numericId: 5101 + idx,
        type: 'SWT',
        title: item.isNew ? `${item.title} (🔥 本週新預測)` : item.title,
        timeMinutes: 10,
        minWords: 5,
        maxWords: 75,
        sweetSpot: '45–65 字（嚴格只能 1 個句號！）',
        sourceTextOrTranscript: item.sourceText,
        keywords: item.keywords.length > 0 ? item.keywords : ['however', 'therefore'],
        scaffoldGuide: '用 1 個完整長句串聯核心因果（中間只用 `, while` 或 `, and therefore`，結尾唯一句號）。',
        sampleHighScore: '',
        isNewPrediction: item.isNew,
      });
    });
  }

  if (live?.we) {
    live.we.forEach((item, idx) => {
      const nk = normalizeKey(item.sourceText.slice(0, 60));
      if (!nk || seenWriting.has(nk)) return;
      seenWriting.add(nk);
      liveWriting.push({
        id: item.id,
        numericId: 6101 + idx,
        type: 'WE',
        title: item.isNew ? `${item.title} (🔥 本週新預測)` : item.title,
        timeMinutes: 20,
        minWords: 200,
        maxWords: 300,
        sweetSpot: '220–265 字（分 4 段，零拼寫錯誤）',
        sourceTextOrTranscript: item.sourceText,
        keywords: item.keywords.length > 0 ? item.keywords : ['benefits', 'challenges'],
        scaffoldGuide: '四段式：1.改寫題目表態 → 2.核心優點＋實例 → 3.讓步挑戰＋解法 → 4.總結立場。',
        sampleHighScore: '',
        isNewPrediction: item.isNew,
      });
    });
  }

  const allWriting = [...curatedWriting, ...liveWriting];
  const totalPredictionsCount =
    allWfd.length + allRs.length + allRa.length + SGD_QUESTIONS.length + RTS_QUESTIONS.length + FIB_ITEMS.length + allWriting.length;

  return {
    weekLabel: live?.weekLabel || '2026 當週最新預測',
    syncedAt: live?.syncedAt || null,
    totalPredictionsCount,
    wfd: allWfd,
    rs: allRs,
    ra: allRa,
    sgd: SGD_QUESTIONS,
    rts: RTS_QUESTIONS,
    fib: FIB_ITEMS,
    writing: allWriting,
  };
}

export function buildUnifiedRegistrations(bank: UnifiedQuestionBank): DeckRegistration[] {
  return [
    { deck: 'wfd', ids: bank.wfd.map((q) => q.id) },
    { deck: 'rs', ids: bank.rs.map((q) => q.id) },
    { deck: 'ra', ids: bank.ra.map((q) => q.id) },
    { deck: 'sgd', ids: bank.sgd.map((q) => q.id) },
    { deck: 'rts', ids: bank.rts.map((q) => q.id) },
    { deck: 'fib', ids: bank.fib.map((q) => q.id) },
    { deck: 'writing', ids: bank.writing.map((q) => q.numericId) },
  ];
}

function itemExistsInBank(bank: UnifiedQuestionBank, deck: DeckType, itemId: number): boolean {
  switch (deck) {
    case 'wfd':
      return bank.wfd.some((x) => x.id === itemId);
    case 'rs':
      return bank.rs.some((x) => x.id === itemId);
    case 'ra':
      return bank.ra.some((x) => x.id === itemId);
    case 'sgd':
      return bank.sgd.some((x) => x.id === itemId);
    case 'rts':
      return bank.rts.some((x) => x.id === itemId);
    case 'fib':
      return bank.fib.some((x) => x.id === itemId);
    case 'writing':
      return bank.writing.some((x) => x.numericId === itemId);
    default:
      return false;
  }
}

function pickNextCandidatesForDeck(
  deck: DeckType,
  ids: number[],
  cardsMap: Record<string, SrsCard>,
  alreadyPickedKeys: Set<string>,
  count: number
): DailyQueueEntry[] {
  const out: DailyQueueEntry[] = [];
  if (count <= 0) return out;

  // First: seen & due cards not yet in rescue list
  for (const id of ids) {
    if (out.length >= count) break;
    const key = makeCardKey(deck, id);
    if (alreadyPickedKeys.has(key)) continue;
    const card = cardsMap[key];
    if (card && (card.repetitions > 0 || card.lastReview) && isCardDue(card)) {
      alreadyPickedKeys.add(key);
      out.push({
        uid: `${key}-${todayStr()}`,
        deck,
        itemId: id,
        reason: 'rescue',
        retentionPct: computeCardRetention(card),
      });
    }
  }

  // Second: unseen cards (prioritizing new weekly predictions & high-frequency order)
  for (const id of ids) {
    if (out.length >= count) break;
    const key = makeCardKey(deck, id);
    if (alreadyPickedKeys.has(key)) continue;
    const card = cardsMap[key];
    const isUnseen = !card || (card.repetitions === 0 && !card.lastReview);
    if (isUnseen) {
      alreadyPickedKeys.add(key);
      out.push({
        uid: `${key}-${todayStr()}`,
        deck,
        itemId: id,
        reason: id >= 2000 || id <= 35 ? 'prediction' : 'daily',
      });
    }
  }

  // Fallback: lowest-interval cards if user has seen everything
  if (out.length < count) {
    const remaining = ids
      .filter((id) => !alreadyPickedKeys.has(makeCardKey(deck, id)))
      .sort((a, b) => {
        const ca = cardsMap[makeCardKey(deck, a)];
        const cb = cardsMap[makeCardKey(deck, b)];
        return (ca?.interval ?? 0) - (cb?.interval ?? 0);
      });
    for (const id of remaining) {
      if (out.length >= count) break;
      const key = makeCardKey(deck, id);
      alreadyPickedKeys.add(key);
      out.push({
        uid: `${key}-${todayStr()}`,
        deck,
        itemId: id,
        reason: 'daily',
      });
    }
  }

  return out;
}

export function generateDailyStream(
  cardsMap: Record<string, SrsCard>,
  bank: UnifiedQuestionBank,
  dailyTotal = 15
): DailyStreamState {
  const today = todayStr();
  const pickedKeys = new Set<string>();
  const rescueEntries: DailyQueueEntry[] = [];

  // 1. Ebbinghaus Forgetting Curve Rescue (up to 6 most urgent fading/golden items)
  const curve = computeForgettingCurveSummary(cardsMap);
  for (const card of curve.rescueQueue) {
    if (rescueEntries.length >= 6) break;
    if (!itemExistsInBank(bank, card.deck, card.itemId)) continue;
    const key = makeCardKey(card.deck, card.itemId);
    pickedKeys.add(key);
    rescueEntries.push({
      uid: `${key}-${today}`,
      deck: card.deck,
      itemId: card.itemId,
      reason: 'rescue',
      retentionPct: computeCardRetention(card),
    });
  }

  // Count how many of each deck we already pulled via rescue
  const countByDeck = (d: DeckType) => rescueEntries.filter((e) => e.deck === d).length;

  // Target PTE 60 High-ROI Daily Blueprint (15 items, ~15–18 mins):
  // 5 WFD + 4 RS + 1 SGD + 1 RTS + 2 FIB + 1 RA + 1 Writing (SWT/WE alternating by date)
  const targets: Array<{ deck: DeckType; target: number; ids: number[] }> = [
    { deck: 'ra', target: 1, ids: bank.ra.map((x) => x.id) },
    { deck: 'wfd', target: 5, ids: bank.wfd.map((x) => x.id) },
    { deck: 'rs', target: 4, ids: bank.rs.map((x) => x.id) },
    { deck: 'sgd', target: 1, ids: bank.sgd.map((x) => x.id) },
    { deck: 'rts', target: 1, ids: bank.rts.map((x) => x.id) },
    { deck: 'fib', target: 2, ids: bank.fib.map((x) => x.id) },
    { deck: 'writing', target: 1, ids: bank.writing.map((x) => x.numericId) },
  ];

  const freshEntries: DailyQueueEntry[] = [];
  for (const t of targets) {
    const needed = Math.max(0, t.target - countByDeck(t.deck));
    const slotsLeft = dailyTotal - (rescueEntries.length + freshEntries.length);
    const take = Math.min(needed, slotsLeft);
    if (take > 0) {
      freshEntries.push(...pickNextCandidatesForDeck(t.deck, t.ids, cardsMap, pickedKeys, take));
    }
  }

  // Top up with WFD / RS if still below dailyTotal
  if (rescueEntries.length + freshEntries.length < dailyTotal) {
    const rem = dailyTotal - (rescueEntries.length + freshEntries.length);
    freshEntries.push(
      ...pickNextCandidatesForDeck(
        'wfd',
        bank.wfd.map((x) => x.id),
        cardsMap,
        pickedKeys,
        rem
      )
    );
  }

  // Interleave into an engaging, zero-fatigue flow:
  // Warmup RA -> Rescue & WFD/RS/FIB/SGD rhythm -> Writing finisher at the end
  const combined = [...rescueEntries, ...freshEntries];
  const warmups = combined.filter((x) => x.deck === 'ra');
  const writings = combined.filter((x) => x.deck === 'writing');
  const middle = combined.filter((x) => x.deck !== 'ra' && x.deck !== 'writing');

  // Spread WFD and RS so identical tasks don't clump 5 in a row
  const wfdList = middle.filter((x) => x.deck === 'wfd');
  const rsList = middle.filter((x) => x.deck === 'rs');
  const otherList = middle.filter((x) => x.deck !== 'wfd' && x.deck !== 'rs');

  const interleavedMiddle: DailyQueueEntry[] = [];
  const maxLen = Math.max(wfdList.length, rsList.length, otherList.length);
  for (let i = 0; i < maxLen; i++) {
    if (wfdList[i]) interleavedMiddle.push(wfdList[i]);
    if (rsList[i]) interleavedMiddle.push(rsList[i]);
    if (otherList[i]) interleavedMiddle.push(otherList[i]);
  }

  const orderedQueue = [...warmups, ...interleavedMiddle, ...writings].slice(0, dailyTotal);

  const nextState: DailyStreamState = {
    date: today,
    queue: orderedQueue,
    completedUids: [],
    scoresByUid: {},
  };
  saveDailyStream(nextState);
  return nextState;
}

export function saveDailyStream(state: DailyStreamState): void {
  try {
    localStorage.setItem(DAILY_STREAM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

export function loadOrBuildDailyStream(
  cardsMap: Record<string, SrsCard>,
  bank: UnifiedQuestionBank
): DailyStreamState {
  const today = todayStr();
  try {
    const raw = localStorage.getItem(DAILY_STREAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyStreamState;
      if (
        parsed &&
        parsed.date === today &&
        Array.isArray(parsed.queue) &&
        parsed.queue.length > 0 &&
        parsed.queue.every((q) => itemExistsInBank(bank, q.deck, q.itemId))
      ) {
        return {
          ...parsed,
          completedUids: Array.isArray(parsed.completedUids) ? parsed.completedUids : [],
          scoresByUid: parsed.scoresByUid || {},
        };
      }
    }
  } catch {
    // Rebuild cleanly
  }
  return generateDailyStream(cardsMap, bank, 15);
}

export function appendBonusQuestions(
  current: DailyStreamState,
  cardsMap: Record<string, SrsCard>,
  bank: UnifiedQuestionBank,
  focusDeck?: DeckType,
  count = 5
): DailyStreamState {
  const pickedKeys = new Set(current.queue.map((q) => makeCardKey(q.deck, q.itemId)));
  const stamp = Date.now();
  let added: DailyQueueEntry[] = [];

  if (focusDeck) {
    const idsMap: Record<DeckType, number[]> = {
      wfd: bank.wfd.map((x) => x.id),
      rs: bank.rs.map((x) => x.id),
      ra: bank.ra.map((x) => x.id),
      sgd: bank.sgd.map((x) => x.id),
      rts: bank.rts.map((x) => x.id),
      fib: bank.fib.map((x) => x.id),
      writing: bank.writing.map((x) => x.numericId),
      di: [],
    };
    added = pickNextCandidatesForDeck(focusDeck, idsMap[focusDeck] || [], cardsMap, pickedKeys, count);
  } else {
    // High-ROI 5-pack: 2 WFD + 2 RS + 1 SGD/FIB
    added = [
      ...pickNextCandidatesForDeck('wfd', bank.wfd.map((x) => x.id), cardsMap, pickedKeys, 2),
      ...pickNextCandidatesForDeck('rs', bank.rs.map((x) => x.id), cardsMap, pickedKeys, 2),
      ...pickNextCandidatesForDeck('sgd', bank.sgd.map((x) => x.id), cardsMap, pickedKeys, 1),
    ];
  }

  const withUniqueUids = added.map((entry, idx) => ({
    ...entry,
    uid: `${entry.deck}:${entry.itemId}-${stamp}-${idx}`,
  }));

  const updated: DailyStreamState = {
    ...current,
    queue: [...current.queue, ...withUniqueUids],
  };
  saveDailyStream(updated);
  return updated;
}
