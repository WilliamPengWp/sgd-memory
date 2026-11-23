import React, { useState, useCallback, useMemo } from 'react';
import {
  Compass,
  Headphones,
  Mic,
  PenTool,
  Map,
} from 'lucide-react';
import { SGD_QUESTIONS } from './data/sgdQuestions';
import { WFD_QUESTIONS } from './data/wfdData';
import { RS_QUESTIONS, RTS_QUESTIONS, DI_QUESTIONS, RA_QUESTIONS } from './data/speakingData';
import { FIB_ITEMS } from './data/rwData';
import {
  DeckRegistration,
  DeckType,
  Rating,
  SrsCard,
  ReviewHistoryEntry,
  applySm2Rating,
  appendHistory,
  computeDeckStats,
  loadAllCards,
  loadHistory,
  loadWeeklyChecks,
  makeCardKey,
  resetAllStudioProgress,
  saveAllCards,
  saveWeeklyChecks,
} from './utils/srs';
import { AccentPreference, stopSpeaking } from './utils/speech';
import {
  MissionDashboard,
  NavTab,
  SpeakingSubTab,
  ReadWriteSubTab,
} from './components/MissionDashboard';
import { WfdLab } from './components/WfdLab';
import { SpeakingLab } from './components/SpeakingLab';
import { ReadWriteLab } from './components/ReadWriteLab';
import { StrategyBlueprint } from './components/StrategyBlueprint';

const DECK_REGISTRATIONS: DeckRegistration[] = [
  { deck: 'sgd', ids: SGD_QUESTIONS.map((q) => q.id) },
  { deck: 'wfd', ids: WFD_QUESTIONS.map((q) => q.id) },
  { deck: 'rs', ids: RS_QUESTIONS.map((q) => q.id) },
  { deck: 'rts', ids: RTS_QUESTIONS.map((q) => q.id) },
  { deck: 'di', ids: DI_QUESTIONS.map((q) => q.id) },
  { deck: 'ra', ids: RA_QUESTIONS.map((q) => q.id) },
  { deck: 'fib', ids: FIB_ITEMS.map((q) => q.id) },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('mission');
  const [speakingSub, setSpeakingSub] = useState<SpeakingSubTab>('sgd');
  const [rwSub, setRwSub] = useState<ReadWriteSubTab>('fib');

  const [accent, setAccent] = useState<AccentPreference>('en-AU');
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const [cardsMap, setCardsMap] = useState<Record<string, SrsCard>>(() =>
    loadAllCards(DECK_REGISTRATIONS)
  );
  const [history, setHistory] = useState<ReviewHistoryEntry[]>(() => loadHistory());
  const [weeklyChecks, setWeeklyChecks] = useState<Record<string, boolean>>(() =>
    loadWeeklyChecks()
  );

  const handleNavigate = useCallback(
    (tab: NavTab, subTab?: SpeakingSubTab | ReadWriteSubTab) => {
      stopSpeaking();
      setActiveTab(tab);
      if (tab === 'speaking' && subTab) {
        setSpeakingSub(subTab as SpeakingSubTab);
      } else if (tab === 'readwrite' && subTab) {
        setRwSub(subTab as ReadWriteSubTab);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleRateCard = useCallback((deck: DeckType, itemId: number, rating: Rating) => {
    setCardsMap((prev) => {
      const key = makeCardKey(deck, itemId);
      const cur = prev[key];
      if (!cur) return prev;
      const updatedCard = applySm2Rating(cur, rating);
      const nextMap = { ...prev, [key]: updatedCard };
      saveAllCards(nextMap);
      return nextMap;
    });
    const nextHist = appendHistory(deck, itemId, rating);
    setHistory(nextHist);
  }, []);

  const handleReloadStorage = useCallback(() => {
    setCardsMap(loadAllCards(DECK_REGISTRATIONS));
    setHistory(loadHistory());
    setWeeklyChecks(loadWeeklyChecks());
  }, []);

  const handleResetAll = useCallback(() => {
    if (window.confirm('確定要重置所有記憶進度嗎？此操作無法復原（建議先匯出備份 JSON）。')) {
      resetAllStudioProgress();
      handleReloadStorage();
    }
  }, [handleReloadStorage]);

  const handleToggleWeekly = useCallback((id: string) => {
    setWeeklyChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveWeeklyChecks(next);
      return next;
    });
  }, []);

  const dueCounts = useMemo(() => {
    const wfd = computeDeckStats(cardsMap, 'wfd').due;
    const sgd = computeDeckStats(cardsMap, 'sgd').due;
    const rs = computeDeckStats(cardsMap, 'rs').due;
    const fib = computeDeckStats(cardsMap, 'fib').due;
    return {
      wfd,
      speaking: sgd + rs,
      rw: fib,
    };
  }, [cardsMap]);

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="top-header-inner">
          <div
            className="brand-group"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavigate('mission')}
          >
            <div className="brand-mark">P60</div>
            <div>
              <div className="brand-title">PTE 60 Studio</div>
              <div className="brand-subtitle">澳洲技術移民 · SGD + 全科高投報記憶艙</div>
            </div>
          </div>

          <nav className="nav-tabs" aria-label="主要學習艙導覽">
            <button
              id="nav-tab-mission"
              type="button"
              className={`nav-tab ${activeTab === 'mission' ? 'active' : ''}`}
              onClick={() => handleNavigate('mission')}
            >
              <Compass size={15} />
              今日任務
            </button>

            <button
              id="nav-tab-wfd"
              type="button"
              className={`nav-tab ${activeTab === 'wfd' ? 'active' : ''}`}
              onClick={() => handleNavigate('wfd')}
            >
              <Headphones size={15} />
              WFD 聽寫
              {dueCounts.wfd > 0 && <span className="nav-badge">{dueCounts.wfd}</span>}
            </button>

            <button
              id="nav-tab-speaking"
              type="button"
              className={`nav-tab ${activeTab === 'speaking' ? 'active' : ''}`}
              onClick={() => handleNavigate('speaking')}
            >
              <Mic size={15} />
              口說實戰 (含SGD)
              {dueCounts.speaking > 0 && <span className="nav-badge">{dueCounts.speaking}</span>}
            </button>

            <button
              id="nav-tab-readwrite"
              type="button"
              className={`nav-tab ${activeTab === 'readwrite' ? 'active' : ''}`}
              onClick={() => handleNavigate('readwrite')}
            >
              <PenTool size={15} />
              讀寫保分
              {dueCounts.rw > 0 && <span className="nav-badge">{dueCounts.rw}</span>}
            </button>

            <button
              id="nav-tab-blueprint"
              type="button"
              className={`nav-tab ${activeTab === 'blueprint' ? 'active' : ''}`}
              onClick={() => handleNavigate('blueprint')}
            >
              <Map size={15} />
              22題戰略＆課表
            </button>
          </nav>

          <div className="voice-bar">
            <select
              id="select-global-accent"
              aria-label="英語發音口音選擇"
              className="select-pill"
              value={accent}
              onChange={(e) => setAccent(e.target.value as AccentPreference)}
            >
              <option value="en-AU">🇦🇺 澳洲口音</option>
              <option value="en-GB">🇬🇧 英國口音</option>
              <option value="en-US">🇺🇸 美國口音</option>
            </select>

            <select
              id="select-global-speed"
              aria-label="語音播放速度"
              className="select-pill"
              value={String(speechRate)}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
            >
              <option value="0.85">0.85x 慢速</option>
              <option value="1">1.0x 原速</option>
              <option value="1.12">1.12x 考場快語速</option>
            </select>
          </div>
        </div>
      </header>

      <main className="main-container">
        {activeTab === 'mission' && (
          <MissionDashboard
            cardsMap={cardsMap}
            history={history}
            onNavigate={handleNavigate}
            onReloadStorage={handleReloadStorage}
            onResetAll={handleResetAll}
          />
        )}

        {activeTab === 'wfd' && (
          <WfdLab
            cardsMap={cardsMap}
            onRateCard={(id, rating) => handleRateCard('wfd', id, rating)}
            accent={accent}
            speechRate={speechRate}
          />
        )}

        {activeTab === 'speaking' && (
          <SpeakingLab
            activeSubTab={speakingSub}
            onChangeSubTab={setSpeakingSub}
            cardsMap={cardsMap}
            onRateCard={handleRateCard}
            accent={accent}
            speechRate={speechRate}
          />
        )}

        {activeTab === 'readwrite' && (
          <ReadWriteLab
            activeSubTab={rwSub}
            onChangeSubTab={setRwSub}
            cardsMap={cardsMap}
            onRateFib={(id, rating) => handleRateCard('fib', id, rating)}
            accent={accent}
            speechRate={speechRate}
          />
        )}

        {activeTab === 'blueprint' && (
          <StrategyBlueprint
            weeklyChecks={weeklyChecks}
            onToggleCheck={handleToggleWeekly}
          />
        )}
      </main>
    </div>
  );
};

export default App;
