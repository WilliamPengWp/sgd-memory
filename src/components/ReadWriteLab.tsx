import React, { useState, useEffect } from 'react';
import {
  BookCheck,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  FIB_ITEMS,
  WRITING_PROMPTS,
  lintWritingResponse,
} from '../data/rwData';
import { Rating, SrsCard, isCardDue, makeCardKey } from '../utils/srs';
import { AccentPreference, speakEnglish, stopSpeaking } from '../utils/speech';
import { callGeminiWritingOrSpeakingCoach, getStoredGeminiKey } from '../utils/aiEngine';
import { ReadWriteSubTab } from './MissionDashboard';

interface ReadWriteLabProps {
  activeSubTab: ReadWriteSubTab;
  onChangeSubTab: (sub: ReadWriteSubTab) => void;
  cardsMap: Record<string, SrsCard>;
  onRateFib: (itemId: number, rating: Rating) => void;
  accent: AccentPreference;
  speechRate: number;
}

export const ReadWriteLab: React.FC<ReadWriteLabProps> = ({
  activeSubTab,
  onChangeSubTab,
  cardsMap,
  onRateFib,
  accent,
  speechRate,
}) => {
  // FIB state
  const [fibFilter, setFibFilter] = useState<'due' | 'all'>('due');
  const [fibIdx, setFibIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);

  // Writing Sandbox state
  const [promptId, setPromptId] = useState<string>(WRITING_PROMPTS[0].id);
  const [draft, setDraft] = useState('');
  const [showSample, setShowSample] = useState(false);
  const [timerSec, setTimerSec] = useState<number>(WRITING_PROMPTS[0].timeMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [aiEssayFeedback, setAiEssayFeedback] = useState<{
    estimatedBand: number;
    strengthsZh: string;
    fixesZh: string;
    upgradedSample: string;
  } | null>(null);
  const [loadingEssayAi, setLoadingEssayAi] = useState(false);

  const fibPool = FIB_ITEMS.filter((item) => {
    if (fibFilter === 'all') return true;
    const c = cardsMap[makeCardKey('fib', item.id)];
    return !c || isCardDue(c);
  });

  useEffect(() => {
    if (fibIdx >= fibPool.length && fibPool.length > 0) setFibIdx(0);
  }, [fibPool.length, fibIdx]);

  const currentFib = fibPool[fibIdx];

  useEffect(() => {
    setSelectedOpt(null);
  }, [currentFib?.id]);

  const activePrompt = WRITING_PROMPTS.find((p) => p.id === promptId) ?? WRITING_PROMPTS[0];

  useEffect(() => {
    stopSpeaking();
    setDraft('');
    setShowSample(false);
    setTimerRunning(false);
    setTimerSec(activePrompt.timeMinutes * 60);
  }, [activePrompt.id, activePrompt.timeMinutes]);

  useEffect(() => {
    if (!timerRunning) return;
    const iv = window.setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [timerRunning]);

  const lint = lintWritingResponse(activePrompt, draft);

  const formatMmSs = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <span className="eyebrow">2025/8 新制補位關鍵 · READING ≥ 48 & WRITING ≥ 51</span>
          <h2 className="section-title">閱讀雙填空 ＆ 寫作零失誤防呆沙盒</h2>
        </div>
      </div>

      <div className="subtab-bar">
        <button
          id="subtab-rw-fib"
          type="button"
          className={`subtab-btn ${activeSubTab === 'fib' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('fib')}
        >
          <BookCheck size={15} />
          FIB 閱讀黃金固定搭配庫 (佔閱讀 60%)
        </button>
        <button
          id="subtab-rw-writing"
          type="button"
          className={`subtab-btn ${activeSubTab === 'writing' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('writing')}
        >
          <FileCheck2 size={15} />
          SWT / SST / WE 寫作即時防呆沙盒
        </button>
      </div>

      {/* Subtab 1: Reading FIB Collocation Trainer */}
      {activeSubTab === 'fib' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.9rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                id="btn-fib-due"
                type="button"
                className={`btn ${fibFilter === 'due' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.38rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => {
                  setFibFilter('due');
                  setFibIdx(0);
                }}
              >
                今日到期 ({FIB_ITEMS.filter((i) => isCardDue(cardsMap[makeCardKey('fib', i.id)])).length})
              </button>
              <button
                id="btn-fib-all"
                type="button"
                className={`btn ${fibFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.38rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => {
                  setFibFilter('all');
                  setFibIdx(0);
                }}
              >
                全部 {FIB_ITEMS.length} 組高頻搭配
              </button>
            </div>

            {currentFib && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setFibIdx((p) => (p - 1 + fibPool.length) % fibPool.length)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {fibIdx + 1} / {fibPool.length}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setFibIdx((p) => (p + 1) % fibPool.length)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {!currentFib ? (
            <div className="surface-card" style={{ textAlign: 'center', padding: '2.8rem 1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem' }}>今日到期的 FIB 固定搭配卡已全部複習完畢！</h3>
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '0.75rem' }}
                onClick={() => {
                  setFibFilter('all');
                  setFibIdx(0);
                }}
              >
                瀏覽全部固定搭配題庫
              </button>
            </div>
          ) : (
            <div className="surface-card">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="tag tag-ocean">FIB #{currentFib.id}</span>
                <span className="tag tag-amber">{currentFib.signalType}</span>
              </div>

              <div
                style={{
                  padding: '1.35rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  fontSize: '1.08rem',
                  lineHeight: 1.75,
                  marginBottom: '1.1rem',
                }}
              >
                {currentFib.sentenceBefore}
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: '115px',
                    textAlign: 'center',
                    padding: '0.08rem 0.6rem',
                    margin: '0 0.25rem',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    borderBottom: '2px solid var(--accent-jade)',
                    background: selectedOpt
                      ? selectedOpt === currentFib.answer
                        ? 'var(--accent-jade-soft)'
                        : 'var(--accent-coral-soft)'
                      : 'hsla(200,20%,90%,0.06)',
                    color: selectedOpt
                      ? selectedOpt === currentFib.answer
                        ? 'hsl(162,76%,66%)'
                        : 'hsl(4,86%,72%)'
                      : 'var(--text-muted)',
                  }}
                >
                  {selectedOpt ?? '________'}
                </span>
                {currentFib.sentenceAfter}
              </div>

              {/* 4 Dropdown-style Options */}
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                {currentFib.options.map((opt) => {
                  const isChosen = selectedOpt === opt;
                  const isRight = opt === currentFib.answer;
                  let borderColor = 'var(--border-default)';
                  let bg = 'var(--bg-surface-elevated)';

                  if (selectedOpt) {
                    if (isRight) {
                      borderColor = 'var(--accent-jade)';
                      bg = 'var(--accent-jade-soft)';
                    } else if (isChosen) {
                      borderColor = 'var(--accent-coral)';
                      bg = 'var(--accent-coral-soft)';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      id={`btn-fib-opt-${opt}`}
                      type="button"
                      className="btn"
                      style={{
                        justifyContent: 'space-between',
                        padding: '0.8rem 1rem',
                        background: bg,
                        border: `1px solid ${borderColor}`,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.92rem',
                      }}
                      onClick={() => setSelectedOpt(opt)}
                    >
                      <span>{opt}</span>
                      {selectedOpt && isRight && <CheckCircle2 size={16} color="var(--accent-jade)" />}
                    </button>
                  );
                })}
              </div>

              {selectedOpt && (
                <div
                  className="animate-in"
                  style={{
                    padding: '1.1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.98rem', color: 'hsl(162, 76%, 64%)' }}>
                      黃金詞組：{currentFib.collocation}（{currentFib.collocationZh}）
                    </strong>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.76rem' }}
                      onClick={() =>
                        speakEnglish(
                          `${currentFib.sentenceBefore}${currentFib.answer}${currentFib.sentenceAfter}`,
                          accent,
                          speechRate
                        )
                      }
                    >
                      <Volume2 size={14} />
                      發音記憶
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {currentFib.explanation}
                  </p>

                  <div className="srs-rate-grid">
                    <button
                      type="button"
                      className="btn-rate forgot"
                      onClick={() => {
                        onRateFib(currentFib.id, 'forgot');
                        setSelectedOpt(null);
                      }}
                    >
                      <span>Forgot 選錯</span>
                      <small>今日重現</small>
                    </button>
                    <button
                      type="button"
                      className="btn-rate hard"
                      onClick={() => {
                        onRateFib(currentFib.id, 'hard');
                        setSelectedOpt(null);
                        if (fibFilter === 'all' && fibPool.length > 1) {
                          setFibIdx((p) => (p + 1) % fibPool.length);
                        }
                      }}
                    >
                      <span>Hard 二選一猶豫</span>
                      <small>短期強化</small>
                    </button>
                    <button
                      type="button"
                      className="btn-rate easy"
                      onClick={() => {
                        onRateFib(currentFib.id, 'easy');
                        setSelectedOpt(null);
                        if (fibFilter === 'all' && fibPool.length > 1) {
                          setFibIdx((p) => (p + 1) % fibPool.length);
                        }
                      }}
                    >
                      <span>Easy 秒殺搭配</span>
                      <small>拉長間隔</small>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Writing Zero-Error Form & Double-Review Linter Sandbox */}
      {activeSubTab === 'writing' && (
        <div className="dashboard-split">
          <div className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <select
                id="select-writing-prompt"
                className="select-pill"
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', flex: 1 }}
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
              >
                {WRITING_PROMPTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  className={timerSec < 120 ? 'tag tag-coral' : 'tag tag-ocean'}
                  style={{ fontSize: '0.85rem', padding: '0.35rem 0.7rem' }}
                >
                  <Clock size={14} />
                  {formatMmSs(timerSec)}
                </span>
                <button
                  id="btn-writing-timer-toggle"
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                  onClick={() => setTimerRunning((r) => !r)}
                >
                  <Play size={13} />
                  {timerRunning ? '暫停' : '開始計時'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSec(activePrompt.timeMinutes * 60);
                  }}
                  title="重置計時器"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Prompt / Transcript Box */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '0.9rem',
                fontSize: '0.9rem',
                lineHeight: 1.65,
              }}
            >
              {activePrompt.type === 'SST' && (
                <div style={{ marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="tag tag-amber">SST 實戰請先點右側聽音檔做筆記，寫完再對照逐字稿</span>
                  <button
                    id="btn-sst-play-lecture"
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem' }}
                    onClick={() => speakEnglish(activePrompt.sourceTextOrTranscript, accent, speechRate)}
                  >
                    <Volume2 size={14} />
                    播放 60s 演講音檔
                  </button>
                </div>
              )}
              <div>{activePrompt.sourceTextOrTranscript}</div>
            </div>

            {/* Scaffold Guide */}
            <div
              style={{
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'hsla(162, 68%, 43%, 0.08)',
                border: '1px solid hsla(162, 68%, 43%, 0.22)',
                marginBottom: '0.9rem',
                fontSize: '0.8rem',
                whiteSpace: 'pre-line',
              }}
            >
              {activePrompt.scaffoldGuide}
            </div>

            <textarea
              id="textarea-writing-sandbox"
              className="text-area"
              style={{ minHeight: activePrompt.type === 'WE' ? '240px' : '140px' }}
              placeholder={`在此作答 ${activePrompt.type}（目標區間：${activePrompt.sweetSpot}）… 右側面板會即時掃描格式與雙審風險！`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                id="btn-writing-fill-sample"
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.42rem 0.8rem' }}
                onClick={() => setShowSample((s) => !s)}
              >
                {showSample ? '收合高分無模板範文' : '檢視高分無模板示範答案'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.78rem' }}
                onClick={() => setDraft(activePrompt.sampleHighScore)}
              >
                帶入範文測試檢查器
              </button>
            </div>

            {showSample && (
              <div
                className="animate-in"
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.65,
                }}
              >
                {activePrompt.sampleHighScore}
              </div>
            )}
          </div>

          {/* Right Panel: Real-time PTE Form & Human-Review Gate Linter */}
          <div className="surface-card">
            <span className="eyebrow">REAL-TIME PTE FORM & CONTENT GATE</span>
            <h3 style={{ margin: '0.2rem 0 0.85rem', fontSize: '1.05rem' }}>
              新制寫作 5 道零失誤防呆檢核
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '0.65rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800 }}>
                  {lint.wordCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  目前字數 ({activePrompt.minWords}–{activePrompt.maxWords})
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800 }}>
                  {lint.sentenceCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  完整句數 {activePrompt.type === 'SWT' ? '(必為 1)' : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {lint.checks.map((chk, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    background: chk.ok ? 'var(--accent-jade-soft)' : 'var(--accent-coral-soft)',
                    border: `1px solid ${
                      chk.ok ? 'hsla(162, 68%, 45%, 0.28)' : 'hsla(4, 78%, 61%, 0.28)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.84rem' }}>
                    {chk.ok ? (
                      <CheckCircle2 size={15} color="var(--accent-jade)" />
                    ) : (
                      <AlertTriangle size={15} color="var(--accent-coral)" />
                    )}
                    <span>{chk.label}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.22rem', opacity: 0.9 }}>{chk.detail}</div>
                </div>
              ))}
            </div>

            {/* Optional Gemini 2.5 Deep Essay Double-Review */}
            <div style={{ marginTop: '0.9rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.82rem' }}
                disabled={!draft.trim() || loadingEssayAi}
                onClick={async () => {
                  if (!getStoredGeminiKey()) {
                    window.alert('請先點擊頁面右上角「AI 設定」填入免費 Google AI Studio Gemini API Key，即可啟動真人雙審級寫作精批！');
                    return;
                  }
                  setLoadingEssayAi(true);
                  const res = await callGeminiWritingOrSpeakingCoach({
                    taskType: `PTE Academic ${activePrompt.type}`,
                    promptText: activePrompt.sourceTextOrTranscript,
                    userAnswer: draft,
                  });
                  setAiEssayFeedback(res);
                  setLoadingEssayAi(false);
                }}
              >
                <Sparkles size={15} />
                {loadingEssayAi ? 'Gemini 雙審批改中…' : '呼叫 AI 雙審考官精批與地道改寫'}
              </button>

              {aiEssayFeedback && (
                <div
                  className="animate-in"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.95rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid hsla(197,82%,54%,0.3)',
                    fontSize: '0.81rem',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'hsl(197,88%,72%)', marginBottom: '0.25rem' }}>
                    🤖 AI 雙審預估寫作：{aiEssayFeedback.estimatedBand} / 90
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>👍 優點：{aiEssayFeedback.strengthsZh}</div>
                  <div style={{ marginBottom: '0.35rem', color: 'var(--accent-amber)' }}>
                    🔧 修正建議：{aiEssayFeedback.fixesZh}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    ✨ 升級改寫：{aiEssayFeedback.upgradedSample}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.8rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
              }}
            >
              <strong>為什麼這 5 關這麼重要？</strong>
              <br />
              2025/8 新制取消了 FIB 對寫作的供分，全場寫作只剩 7–8 道題。只要確定{' '}
              <code>Form 過關 + 零拼錯 + 嵌入題目關鍵詞</code>，就算詞彙樸實也能穩拿 56–62 分！
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
