import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import {
  DeckType,
  Rating,
  SrsCard,
  ReviewHistoryEntry,
  CustomImportedWfd,
  applySm2Rating,
  appendHistory,
  computeForgettingCurveSummary,
  loadAllCards,
  loadHistory,
  loadCustomWfdItems,
  addCustomWfdBatch,
  makeCardKey,
  saveAllCards,
  createInitialCard,
  todayStr,
} from './utils/srs';
import { AccentPreference, stopSpeaking } from './utils/speech';
import {
  PlayerProfile,
  loadPlayerProfile,
  savePlayerProfile,
  awardPlayerXp,
} from './utils/gamification';
import { probeServerCapabilities } from './utils/aiEngine';
import {
  LivePredictionPayload,
  DailyQueueEntry,
  DailyStreamState,
  fetchWeeklyPredictionBank,
  triggerServerPredictionSync,
  buildUnifiedBank,
  buildUnifiedRegistrations,
  loadOrBuildDailyStream,
  generateDailyStream,
  saveDailyStream,
  appendBonusQuestions,
} from './utils/dailyPlanner';
import { DailyFocusStage } from './components/DailyFocusStage';
import { MinimalOverviewDrawer } from './components/MinimalOverviewDrawer';

export const App: React.FC = () => {
  const [accent, setAccent] = useState<AccentPreference>('en-AU');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncingBank, setSyncingBank] = useState(false);

  const [livePredictions, setLivePredictions] = useState<LivePredictionPayload | null>(null);
  const [customWfd, setCustomWfd] = useState<CustomImportedWfd[]>(() => loadCustomWfdItems());

  const bank = useMemo(
    () => buildUnifiedBank(livePredictions, customWfd),
    [livePredictions, customWfd]
  );

  const [cardsMap, setCardsMap] = useState<Record<string, SrsCard>>(() =>
    loadAllCards(buildUnifiedRegistrations(buildUnifiedBank(null, loadCustomWfdItems())))
  );
  const [history, setHistory] = useState<ReviewHistoryEntry[]>(() => loadHistory());
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());

  const [dailyStream, setDailyStream] = useState<DailyStreamState>(() =>
    loadOrBuildDailyStream(cardsMap, bank)
  );

  const [cloudReady, setCloudReady] = useState(false);
  const hydratedFromCloudRef = useRef(false);

  // 1. Load Weekly Prediction Bank + Hydrate Cloud Progress on Mount
  useEffect(() => {
    (async () => {
      const [predPayload, caps] = await Promise.all([
        fetchWeeklyPredictionBank(),
        probeServerCapabilities(),
      ]);

      let activeBank = buildUnifiedBank(predPayload, loadCustomWfdItems());
      if (predPayload) {
        setLivePredictions(predPayload);
      }

      let mergedCards = loadAllCards(buildUnifiedRegistrations(activeBank));
      let cloudDaily: DailyStreamState | null = null;

      if (caps.cloudSync) {
        try {
          const resp = await fetch('./api/sync?profile=william', { cache: 'no-store' });
          if (resp.ok) {
            const data = await resp.json();
            if (data.found) {
              if (Array.isArray(data.customWfd) && data.customWfd.length > 0) {
                localStorage.setItem('pte60-custom-firefly-wfd-v1', JSON.stringify(data.customWfd));
                setCustomWfd(data.customWfd);
                activeBank = buildUnifiedBank(predPayload, data.customWfd);
              }
              if (data.cards && typeof data.cards === 'object') {
                mergedCards = {
                  ...loadAllCards(buildUnifiedRegistrations(activeBank)),
                  ...data.cards,
                };
                saveAllCards(mergedCards);
              }
              if (Array.isArray(data.history) && data.history.length >= loadHistory().length) {
                localStorage.setItem('pte60-studio-history-v1', JSON.stringify(data.history));
                setHistory(data.history);
              }
              if (data.player && typeof data.player.xp === 'number') {
                savePlayerProfile(data.player);
                setProfile(data.player);
              }
              if (
                data.weekly &&
                data.weekly._dailyStream &&
                data.weekly._dailyStream.date === todayStr()
              ) {
                cloudDaily = data.weekly._dailyStream as DailyStreamState;
              }
            }
          }
          hydratedFromCloudRef.current = true;
          setCloudReady(true);
        } catch {
          // Offline / local fallback
        }
      }

      setCardsMap(mergedCards);

      const localDaily = loadOrBuildDailyStream(mergedCards, activeBank);
      if (
        cloudDaily &&
        Array.isArray(cloudDaily.queue) &&
        cloudDaily.completedUids.length >= localDaily.completedUids.length
      ) {
        saveDailyStream(cloudDaily);
        setDailyStream(cloudDaily);
      } else {
        setDailyStream(localDaily);
      }
    })();
  }, []);

  // 2. Auto-push Progress & Daily Stream to Oracle PostgreSQL (debounced)
  useEffect(() => {
    if (!cloudReady || !hydratedFromCloudRef.current) return;
    const t = window.setTimeout(() => {
      fetch('./api/sync?profile=william', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsMap,
          history,
          weekly: { _dailyStream: dailyStream },
          customWfd,
          player: profile,
        }),
      }).catch(() => {});
    }, 850);
    return () => window.clearTimeout(t);
  }, [cloudReady, cardsMap, history, dailyStream, customWfd, profile]);

  const handleCompleteItem = useCallback(
    (entry: DailyQueueEntry, rating: Rating, scoreEarned?: number) => {
      stopSpeaking();
      setCardsMap((prev) => {
        const key = makeCardKey(entry.deck, entry.itemId);
        const cur = prev[key] ?? createInitialCard(entry.deck, entry.itemId);
        const updated = applySm2Rating(cur, rating);
        const nextMap = { ...prev, [key]: updated };
        saveAllCards(nextMap);
        return nextMap;
      });

      const nextHist = appendHistory(entry.deck, entry.itemId, rating);
      setHistory(nextHist);
      setProfile((prev) => awardPlayerXp(prev, rating === 'easy' ? 14 : 8, 1));

      setDailyStream((prev) => {
        const completedUids = prev.completedUids.includes(entry.uid)
          ? prev.completedUids
          : [...prev.completedUids, entry.uid];
        const scoresByUid =
          typeof scoreEarned === 'number'
            ? { ...prev.scoresByUid, [entry.uid]: scoreEarned }
            : prev.scoresByUid;
        const next = { ...prev, completedUids, scoresByUid };
        saveDailyStream(next);
        return next;
      });
    },
    []
  );

  const handleAddBonus = useCallback(
    (focusDeck?: DeckType, count = 5) => {
      setDailyStream((prev) => appendBonusQuestions(prev, cardsMap, bank, focusDeck, count));
    },
    [cardsMap, bank]
  );

  const handleRebuildTodayPlan = useCallback(() => {
    const fresh = generateDailyStream(cardsMap, bank, 15);
    setDailyStream(fresh);
  }, [cardsMap, bank]);

  const handleSyncPredictionsNow = useCallback(async () => {
    setSyncingBank(true);
    const updated = await triggerServerPredictionSync();
    if (updated) {
      setLivePredictions(updated);
      const nextBank = buildUnifiedBank(updated, customWfd);
      const nextCards = loadAllCards(buildUnifiedRegistrations(nextBank));
      saveAllCards(nextCards);
      setCardsMap(nextCards);
    }
    setSyncingBank(false);
  }, [customWfd]);

  const handleImportCustomWfd = useCallback(
    (rawText: string) => {
      const before = customWfd.length;
      const mergedCustom = addCustomWfdBatch(rawText, '自訂預測匯入');
      setCustomWfd(mergedCustom);
      const nextBank = buildUnifiedBank(livePredictions, mergedCustom);
      const nextCards = loadAllCards(buildUnifiedRegistrations(nextBank));
      saveAllCards(nextCards);
      setCardsMap(nextCards);
      return mergedCustom.length - before;
    },
    [customWfd.length, livePredictions]
  );

  const completedCount = dailyStream.completedUids.length;
  const totalCount = Math.max(1, dailyStream.queue.length);
  const progressPct = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const retentionAvg = useMemo(
    () => computeForgettingCurveSummary(cardsMap).averageRetention,
    [cardsMap]
  );

  return (
    <div className="app-shell">
      {/* Ultra-Clean Top Header */}
      <header className="clean-header">
        <div className="clean-header-inner">
          <div className="header-left">
            <span className="brand-dot" />
            <span className="brand-name">PTE 60</span>
            <span className="header-divider">/</span>
            <span className="today-label">
              今日排程 <strong>{Math.min(completedCount, totalCount)}</strong> / {totalCount}
            </span>
          </div>

          <div className="header-progress-track" aria-hidden="true">
            <div className="header-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="header-right">
            <button
              type="button"
              className="btn-drawer-trigger"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal size={14} />
              <span>進度 · 預測題庫</span>
            </button>
          </div>
        </div>
      </header>

      {/* Single-Card Daily Practice Stream */}
      <main className="clean-main">
        <DailyFocusStage
          stream={dailyStream}
          bank={bank}
          retentionAvg={retentionAvg}
          accent={accent}
          speechRate={speechRate}
          onCompleteItem={handleCompleteItem}
          onAddBonus={(deck) => handleAddBonus(deck, 5)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      </main>

      {/* Subtle Slide-Over Drawer for Stats, Weekly Prediction Sync & Settings */}
      <MinimalOverviewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cardsMap={cardsMap}
        bank={bank}
        syncingBank={syncingBank}
        onSyncPredictionsNow={handleSyncPredictionsNow}
        onAddFocusedPack={(deck, count) => handleAddBonus(deck, count)}
        onRebuildTodayPlan={handleRebuildTodayPlan}
        onImportCustomWfd={handleImportCustomWfd}
        accent={accent}
        onChangeAccent={setAccent}
        speechRate={speechRate}
        onChangeSpeechRate={setSpeechRate}
      />
    </div>
  );
};

export default App;
