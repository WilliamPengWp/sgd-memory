import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Compass,
  Blocks,
  MessageSquareHeart,
  Mic,
  PenTool,
  Map,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  PlusCircle,
} from 'lucide-react';
import { SGD_QUESTIONS } from './data/sgdQuestions';
import { mergeAllWfdQuestions } from './data/wfdData';
import { RS_QUESTIONS, RTS_QUESTIONS, DI_QUESTIONS, RA_QUESTIONS } from './data/speakingData';
import { FIB_ITEMS } from './data/rwData';
import {
  DeckRegistration,
  DeckType,
  Rating,
  SrsCard,
  ReviewHistoryEntry,
  CustomImportedWfd,
  applySm2Rating,
  appendHistory,
  computeDeckStats,
  loadAllCards,
  loadHistory,
  loadWeeklyChecks,
  loadCustomWfdItems,
  addCustomWfdBatch,
  makeCardKey,
  resetAllStudioProgress,
  saveAllCards,
  saveWeeklyChecks,
  createInitialCard,
} from './utils/srs';
import { AccentPreference, stopSpeaking } from './utils/speech';
import {
  PlayerProfile,
  loadPlayerProfile,
  savePlayerProfile,
  awardPlayerXp,
  computeLevelInfo,
  playGameSfx,
} from './utils/gamification';
import {
  getRawLocalGeminiKey,
  setStoredGeminiKey,
  probeServerCapabilities,
  isServerAiEnabled,
} from './utils/aiEngine';
import {
  MissionDashboard,
  NavTab,
  SpeakingSubTab,
  ReadWriteSubTab,
} from './components/MissionDashboard';
import { WfdLab } from './components/WfdLab';
import { LiveRoleplayArena } from './components/LiveRoleplayArena';
import { SpeakingLab } from './components/SpeakingLab';
import { ReadWriteLab } from './components/ReadWriteLab';
import { StrategyBlueprint } from './components/StrategyBlueprint';

function buildRegistrations(customWfd: CustomImportedWfd[]): DeckRegistration[] {
  const allWfd = mergeAllWfdQuestions(customWfd);
  return [
    { deck: 'sgd', ids: SGD_QUESTIONS.map((q) => q.id) },
    { deck: 'wfd', ids: allWfd.map((q) => q.id) },
    { deck: 'rs', ids: RS_QUESTIONS.map((q) => q.id) },
    { deck: 'rts', ids: RTS_QUESTIONS.map((q) => q.id) },
    { deck: 'di', ids: DI_QUESTIONS.map((q) => q.id) },
    { deck: 'ra', ids: RA_QUESTIONS.map((q) => q.id) },
    { deck: 'fib', ids: FIB_ITEMS.map((q) => q.id) },
  ];
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('mission');
  const [speakingSub, setSpeakingSub] = useState<SpeakingSubTab>('sgd');
  const [rwSub, setRwSub] = useState<ReadWriteSubTab>('fib');

  const [accent, setAccent] = useState<AccentPreference>('en-AU');
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const [customWfd, setCustomWfd] = useState<CustomImportedWfd[]>(() => loadCustomWfdItems());
  const [cardsMap, setCardsMap] = useState<Record<string, SrsCard>>(() =>
    loadAllCards(buildRegistrations(loadCustomWfdItems()))
  );
  const [history, setHistory] = useState<ReviewHistoryEntry[]>(() => loadHistory());
  const [weeklyChecks, setWeeklyChecks] = useState<Record<string, boolean>>(() =>
    loadWeeklyChecks()
  );
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());

  const [cloudReady, setCloudReady] = useState(false);
  const [serverAiActive, setServerAiActive] = useState(false);
  const hydratedFromCloudRef = useRef(false);

  // Modals
  const [showFireflyModal, setShowFireflyModal] = useState(false);
  const [fireflyPaste, setFireflyPaste] = useState('');
  const [fireflyTag, setFireflyTag] = useState('螢火蟲當週預測');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const [showAiModal, setShowAiModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getRawLocalGeminiKey());

  // Probe Oracle Server AI & Cloud PostgreSQL Sync on mount
  useEffect(() => {
    (async () => {
      const caps = await probeServerCapabilities();
      setServerAiActive(caps.serverAi);
      if (caps.cloudSync) {
        try {
          const resp = await fetch('./api/sync?profile=william', { cache: 'no-store' });
          if (resp.ok) {
            const data = await resp.json();
            if (data.found) {
              const cloudHistLen = Array.isArray(data.history) ? data.history.length : 0;
              const localHistLen = loadHistory().length;
              if (cloudHistLen >= localHistLen) {
                if (Array.isArray(data.customWfd)) {
                  localStorage.setItem('pte60-custom-firefly-wfd-v1', JSON.stringify(data.customWfd));
                  setCustomWfd(data.customWfd);
                }
                if (data.cards && typeof data.cards === 'object') {
                  const merged = {
                    ...loadAllCards(buildRegistrations(data.customWfd || [])),
                    ...data.cards,
                  };
                  saveAllCards(merged);
                  setCardsMap(merged);
                }
                if (Array.isArray(data.history)) {
                  localStorage.setItem('pte60-studio-history-v1', JSON.stringify(data.history));
                  setHistory(data.history);
                }
                if (data.weekly && typeof data.weekly === 'object') {
                  saveWeeklyChecks(data.weekly);
                  setWeeklyChecks(data.weekly);
                }
                if (data.player && typeof data.player === 'object' && typeof data.player.xp === 'number') {
                  savePlayerProfile(data.player);
                  setProfile(data.player);
                }
              }
            }
          }
          hydratedFromCloudRef.current = true;
          setCloudReady(true);
        } catch {
          // Offline fallback
        }
      }
    })();
  }, []);

  // Auto-push state changes to Oracle PostgreSQL (debounced 900ms)
  useEffect(() => {
    if (!cloudReady || !hydratedFromCloudRef.current) return;
    const t = window.setTimeout(() => {
      fetch('./api/sync?profile=william', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsMap,
          history,
          weekly: weeklyChecks,
          customWfd,
          player: profile,
        }),
      }).catch(() => {});
    }, 900);
    return () => window.clearTimeout(t);
  }, [cloudReady, cardsMap, history, weeklyChecks, customWfd, profile]);

  const handleEarnXp = useCallback((xp: number, combo = 1) => {
    setProfile((prev) => awardPlayerXp(prev, xp, combo));
  }, []);

  const toggleSound = () => {
    setProfile((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      savePlayerProfile(next);
      return next;
    });
  };

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

  const handleRateCard = useCallback(
    (deck: DeckType, itemId: number, rating: Rating) => {
      setCardsMap((prev) => {
        const key = makeCardKey(deck, itemId);
        const cur = prev[key] ?? createInitialCard(deck, itemId);
        const updatedCard = applySm2Rating(cur, rating);
        const nextMap = { ...prev, [key]: updatedCard };
        saveAllCards(nextMap);
        return nextMap;
      });
      const nextHist = appendHistory(deck, itemId, rating);
      setHistory(nextHist);
      handleEarnXp(rating === 'easy' ? 14 : 8);
    },
    [handleEarnXp]
  );

  const handleReloadStorage = useCallback(() => {
    const cWfd = loadCustomWfdItems();
    setCustomWfd(cWfd);
    setCardsMap(loadAllCards(buildRegistrations(cWfd)));
    setHistory(loadHistory());
    setWeeklyChecks(loadWeeklyChecks());
    setProfile(loadPlayerProfile());
  }, []);

  const handleResetAll = useCallback(() => {
    if (window.confirm('確定要重置記憶進度嗎？建議重置前先匯出 JSON 備份。')) {
      resetAllStudioProgress();
      handleReloadStorage();
    }
  }, [handleReloadStorage]);

  const handleToggleWeekly = useCallback(
    (id: string) => {
      setWeeklyChecks((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        saveWeeklyChecks(next);
        return next;
      });
      playGameSfx('tap', profile.soundEnabled);
      handleEarnXp(20);
    },
    [profile.soundEnabled, handleEarnXp]
  );

  const handleRunFireflyImport = () => {
    if (!fireflyPaste.trim()) return;
    const beforeCount = customWfd.length;
    const mergedCustom = addCustomWfdBatch(fireflyPaste, fireflyTag || '螢火蟲自訂匯入');
    const addedCount = mergedCustom.length - beforeCount;
    setCustomWfd(mergedCustom);

    const nextCards = loadAllCards(buildRegistrations(mergedCustom));
    saveAllCards(nextCards);
    setCardsMap(nextCards);
    setFireflyPaste('');
    playGameSfx('win', profile.soundEnabled);
    setImportFeedback(`成功解析並匯入 ${addedCount} 句新預測題！已加入積木闖關與艾賓浩斯記憶曲線。`);
  };

  const levelInfo = computeLevelInfo(profile.xp);

  const dueCounts = useMemo(() => {
    const wfd = computeDeckStats(cardsMap, 'wfd').due;
    const sgd = computeDeckStats(cardsMap, 'sgd').due;
    const fib = computeDeckStats(cardsMap, 'fib').due;
    return { wfd, sgd, fib };
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
              <div className="brand-title">PTE 60 Quest</div>
              <div className="brand-subtitle">{levelInfo.title}</div>
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
              記憶曲線總部
            </button>

            <button
              id="nav-tab-wfd"
              type="button"
              className={`nav-tab ${activeTab === 'wfd' ? 'active' : ''}`}
              onClick={() => handleNavigate('wfd')}
            >
              <Blocks size={15} />
              WFD 積木遊樂場
              {dueCounts.wfd > 0 && <span className="nav-badge">{dueCounts.wfd}</span>}
            </button>

            <button
              id="nav-tab-roleplay"
              type="button"
              className={`nav-tab ${activeTab === 'roleplay' ? 'active' : ''}`}
              onClick={() => handleNavigate('roleplay')}
            >
              <MessageSquareHeart size={15} />
              真人語音對戲
            </button>

            <button
              id="nav-tab-speaking"
              type="button"
              className={`nav-tab ${activeTab === 'speaking' ? 'active' : ''}`}
              onClick={() => handleNavigate('speaking')}
            >
              <Mic size={15} />
              口說＋AI評分
              {dueCounts.sgd > 0 && <span className="nav-badge">{dueCounts.sgd}</span>}
            </button>

            <button
              id="nav-tab-readwrite"
              type="button"
              className={`nav-tab ${activeTab === 'readwrite' ? 'active' : ''}`}
              onClick={() => handleNavigate('readwrite')}
            >
              <PenTool size={15} />
              讀寫防呆艙
            </button>

            <button
              id="nav-tab-blueprint"
              type="button"
              className={`nav-tab ${activeTab === 'blueprint' ? 'active' : ''}`}
              onClick={() => handleNavigate('blueprint')}
            >
              <Map size={15} />
              22題戰略
            </button>
          </nav>

          {/* Right Status & Controls */}
          <div className="voice-bar">
            <div className="xp-pill" title={`${levelInfo.subtitle} (${profile.xp} XP)`}>
              <Flame size={14} color="var(--accent-amber)" />
              <span>{profile.xp} XP</span>
              <div className="xp-mini-bar">
                <div className="xp-mini-fill" style={{ width: `${levelInfo.progressPct}%` }} />
              </div>
            </div>

            <select
              id="select-global-accent"
              aria-label="英語發音口音選擇"
              className="select-pill"
              value={accent}
              onChange={(e) => setAccent(e.target.value as AccentPreference)}
            >
              <option value="en-AU">🇦🇺 澳音</option>
              <option value="en-GB">🇬🇧 英音</option>
              <option value="en-US">🇺🇸 美音</option>
            </select>

            <select
              id="select-global-speed"
              aria-label="語音播放速度"
              className="select-pill"
              value={String(speechRate)}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
            >
              <option value="0.88">0.88x</option>
              <option value="1">1.0x</option>
              <option value="1.12">1.12x</option>
            </select>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.35rem' }}
              onClick={toggleSound}
              title={profile.soundEnabled ? '關閉遊戲音效' : '開啟遊戲音效'}
            >
              {profile.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              id="btn-header-ai-settings"
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.32rem 0.65rem', fontSize: '0.74rem' }}
              onClick={() => setShowAiModal(true)}
            >
              <Sparkles size={13} color="var(--accent-jade)" />
              {serverAiActive || isServerAiEnabled() ? '☁️ 雲端AI已連線' : 'AI 設定'}
            </button>
          </div>
        </div>
      </header>

      <main className="main-container">
        {activeTab === 'mission' && (
          <MissionDashboard
            cardsMap={cardsMap}
            history={history}
            onNavigate={handleNavigate}
            onOpenFireflyModal={() => {
              setImportFeedback(null);
              setShowFireflyModal(true);
            }}
            onReloadStorage={handleReloadStorage}
            onResetAll={handleResetAll}
          />
        )}

        {activeTab === 'wfd' && (
          <WfdLab
            cardsMap={cardsMap}
            customWfd={customWfd}
            onRateCard={(id, rating) => handleRateCard('wfd', id, rating)}
            onEarnXp={handleEarnXp}
            onOpenFireflyModal={() => {
              setImportFeedback(null);
              setShowFireflyModal(true);
            }}
            accent={accent}
            speechRate={speechRate}
            soundEnabled={profile.soundEnabled}
          />
        )}

        {activeTab === 'roleplay' && (
          <LiveRoleplayArena
            soundEnabled={profile.soundEnabled}
            onEarnXp={handleEarnXp}
            onOpenAiSettings={() => setShowAiModal(true)}
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

      {/* Modal 1: Firefly / Weekly Prediction Batch Importer */}
      {showFireflyModal && (
        <div className="modal-backdrop" onClick={() => setShowFireflyModal(false)}>
          <div className="modal-panel animate-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                <PlusCircle size={17} style={{ verticalAlign: 'middle', marginRight: 6 }} color="var(--accent-jade)" />
                一鍵匯入螢火蟲／黑科技／猩際每週預測機經
              </h3>
              <button type="button" className="btn btn-ghost" onClick={() => setShowFireflyModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              直接從螢火蟲 PDF、微信週報或網頁複製整段題目貼在下方（即使混雜題號如{' '}
              <code>#131500</code> 或隔行中文翻譯都能自動清洗識別！），系統會立即轉成<strong>單字積木遊戲卡</strong>並納入艾賓浩斯曲線。
            </p>

            <input
              type="text"
              className="text-input"
              style={{ marginBottom: '0.65rem', padding: '0.55rem 0.85rem', fontSize: '0.84rem' }}
              value={fireflyTag}
              onChange={(e) => setFireflyTag(e.target.value)}
              placeholder="來源標籤（例如：螢火蟲 12月換題季新題）"
            />

            <textarea
              className="text-area"
              style={{ minHeight: '150px', fontSize: '0.84rem' }}
              placeholder={`範例貼上格式：\n#131500 His appointment to the Minister of Culture is seen as a demotion.\n他被任命為文化部長被視為降職。\n2. Statistical results should be expressed in different ways.`}
              value={fireflyPaste}
              onChange={(e) => setFireflyPaste(e.target.value)}
            />

            {importFeedback && (
              <div style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'hsl(162,76%,64%)' }}>
                ✓ {importFeedback}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowFireflyModal(false)}>
                關閉
              </button>
              <button type="button" className="btn btn-primary" onClick={handleRunFireflyImport}>
                立即轉為遊戲關卡＋加入記憶曲線
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Optional Gemini 2.5 API Key Settings */}
      {showAiModal && (
        <div className="modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="modal-panel animate-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🤖 AI 口說評分與真人對談引擎設定</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAiModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.9rem' }}>
              <p style={{ margin: '0 0 0.5rem' }}>
                1. <strong>免金鑰內建引擎（預設已開啟）</strong>：使用瀏覽器即時語音轉文字 (Web Speech STT) ＋ 聲學語速流利度演算法，零設定即可測算 PTE 口說分數並進行劇情對戲。
              </p>
              <p style={{ margin: 0 }}>
                2. <strong>進階 Gemini 2.5 真人雙審與無限自由對談（選填）</strong>：填入你在 Google AI Studio 免費申請的 API Key（僅保存在你個人瀏覽器 <code>localStorage</code>，絕不上傳任何第三方伺服器），即可解鎖 NPC 無限自由接話與寫作／口說逐句地道改寫！
              </p>
            </div>

            <input
              type="password"
              className="text-input"
              placeholder="貼上 Gemini API Key (AIzaSy...)"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setGeminiKeyInput('');
                  setStoredGeminiKey('');
                  setShowAiModal(false);
                }}
              >
                清除金鑰
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setStoredGeminiKey(geminiKeyInput);
                  setShowAiModal(false);
                }}
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
