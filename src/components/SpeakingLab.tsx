import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  Repeat,
  MessageSquare,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { SGD_QUESTIONS, SgdQuestion } from '../data/sgdQuestions';
import {
  RS_QUESTIONS,
  RTS_QUESTIONS,
  DI_QUESTIONS,
  RA_QUESTIONS,
  DiQuestion,
} from '../data/speakingData';
import { DeckType, Rating, SrsCard, isCardDue, makeCardKey } from '../utils/srs';
import { AccentPreference, resolvePublicAsset, speakEnglish, stopSpeaking } from '../utils/speech';
import { MicStudioBar } from './MicStudioBar';
import { SpeakingSubTab } from './MissionDashboard';

interface SpeakingLabProps {
  activeSubTab: SpeakingSubTab;
  onChangeSubTab: (sub: SpeakingSubTab) => void;
  cardsMap: Record<string, SrsCard>;
  onRateCard: (deck: DeckType, itemId: number, rating: Rating) => void;
  accent: AccentPreference;
  speechRate: number;
}

/* --- SVG Chart Renderer for DI --- */
const DiChartSvg: React.FC<{ item: DiQuestion }> = ({ item }) => {
  const maxVal = Math.max(...item.series.map((s) => s.value), 50);

  if (item.chartType === 'bar') {
    return (
      <svg
        viewBox="0 0 520 230"
        style={{
          width: '100%',
          height: 'auto',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <text x="24" y="28" fill="hsl(195,20%,92%)" fontSize="13" fontWeight="700">
          {item.title}
        </text>
        <line x1="48" y1="185" x2="490" y2="185" stroke="hsla(200,20%,85%,0.2)" strokeWidth="1" />
        {item.series.map((bar, i) => {
          const slotW = 420 / item.series.length;
          const barW = Math.min(48, slotW * 0.56);
          const x = 62 + i * slotW + (slotW - barW) / 2;
          const barH = Math.round((bar.value / maxVal) * 125);
          const y = 185 - barH;
          const colors = [
            'hsl(162, 68%, 45%)',
            'hsl(197, 82%, 54%)',
            'hsl(38, 92%, 56%)',
            'hsl(178, 60%, 46%)',
            'hsl(12, 76%, 60%)',
          ];
          return (
            <g key={bar.label}>
              <rect x={x} y={y} width={barW} height={barH} rx="5" fill={colors[i % colors.length]} />
              <text
                x={x + barW / 2}
                y={y - 7}
                textAnchor="middle"
                fill="hsl(195,20%,94%)"
                fontSize="11"
                fontWeight="700"
              >
                {bar.value}
                {item.unit}
              </text>
              <text
                x={x + barW / 2}
                y="205"
                textAnchor="middle"
                fill="hsl(200,12%,70%)"
                fontSize="11"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  if (item.chartType === 'line') {
    const pts = item.series.map((pt, i) => {
      const x = 80 + (i * 360) / Math.max(1, item.series.length - 1);
      const y = 180 - Math.round((pt.value / maxVal) * 120);
      return { ...pt, x, y };
    });
    const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <svg
        viewBox="0 0 520 230"
        style={{
          width: '100%',
          height: 'auto',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <text x="24" y="28" fill="hsl(195,20%,92%)" fontSize="13" fontWeight="700">
          {item.title}
        </text>
        <line x1="56" y1="185" x2="475" y2="185" stroke="hsla(200,20%,85%,0.2)" strokeWidth="1" />
        <polyline
          fill="none"
          stroke="hsl(162, 68%, 46%)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={poly}
        />
        {pts.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="5.5" fill="hsl(197, 82%, 56%)" />
            <text
              x={p.x}
              y={p.y - 11}
              textAnchor="middle"
              fill="hsl(195,20%,95%)"
              fontSize="11"
              fontWeight="700"
            >
              {p.value}
              {item.unit}
            </text>
            <text x={p.x} y="206" textAnchor="middle" fill="hsl(200,12%,70%)" fontSize="11">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // Horizontal proportion breakdown for Pie / Share category
  return (
    <svg
      viewBox="0 0 520 230"
      style={{
        width: '100%',
        height: 'auto',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <text x="24" y="28" fill="hsl(195,20%,92%)" fontSize="13" fontWeight="700">
        {item.title}
      </text>
      {item.series.map((s, i) => {
        const y = 52 + i * 32;
        const w = Math.round((s.value / 45) * 290);
        const palette = [
          'hsl(162, 68%, 45%)',
          'hsl(197, 82%, 54%)',
          'hsl(38, 92%, 56%)',
          'hsl(178, 55%, 46%)',
          'hsl(4, 72%, 60%)',
        ];
        return (
          <g key={s.label}>
            <text x="28" y={y + 15} fill="hsl(200,12%,75%)" fontSize="12">
              {s.label}
            </text>
            <rect x="120" y={y + 2} width={w} height="18" rx="4" fill={palette[i % palette.length]} />
            <text
              x={128 + w}
              y={y + 15}
              fill="hsl(195,20%,95%)"
              fontSize="11.5"
              fontWeight="700"
            >
              {s.value}
              {item.unit}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* --- Preserved & Upgraded SGD 41-Card Component --- */
const SgdDeckView: React.FC<{
  cardsMap: Record<string, SrsCard>;
  onRate: (id: number, rating: Rating) => void;
}> = ({ cardsMap, onRate }) => {
  const [filterMode, setFilterMode] = useState<'due' | 'all'>('due');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showZhMap, setShowZhMap] = useState<Record<number, boolean>>({});
  const [showScaffold, setShowScaffold] = useState(false);

  // Auto-sequential 3-speaker MP3 playback state (from original sgd-memory)
  const [seqState, setSeqState] = useState<{
    phase: 'idle' | 'countdown' | 'playing' | 'gap' | 'done';
    speakerIdx: number;
    countdown: number;
  }>({ phase: 'idle', speakerIdx: 0, countdown: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const singleAudioRef = useRef<HTMLAudioElement | null>(null);
  const [singlePlayingId, setSinglePlayingId] = useState<number | null>(null);
  const cancelSeqRef = useRef(false);

  const pool: SgdQuestion[] = SGD_QUESTIONS.filter((q) => {
    if (filterMode === 'all') return true;
    const c = cardsMap[makeCardKey('sgd', q.id)];
    return !c || isCardDue(c);
  });

  useEffect(() => {
    if (index >= pool.length && pool.length > 0) setIndex(0);
  }, [pool.length, index]);

  const current = pool[index];

  const stopAllSgdAudio = useCallback(() => {
    cancelSeqRef.current = true;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (singleAudioRef.current) {
      singleAudioRef.current.pause();
      singleAudioRef.current = null;
    }
    setSinglePlayingId(null);
    setSeqState({ phase: 'idle', speakerIdx: 0, countdown: 0 });
  }, []);

  useEffect(() => {
    stopAllSgdAudio();
    setFlipped(false);
    setShowZhMap({});
    setShowScaffold(false);
    return () => stopAllSgdAudio();
  }, [current?.id, stopAllSgdAudio]);

  const startAutoSequence = useCallback(
    async (question: SgdQuestion) => {
      stopAllSgdAudio();
      cancelSeqRef.current = false;

      const waitSec = (secs: number, phase: 'countdown' | 'gap', spIdx: number) =>
        new Promise<void>((resolve) => {
          let rem = secs;
          setSeqState({ phase, speakerIdx: spIdx, countdown: rem });
          const iv = window.setInterval(() => {
            if (cancelSeqRef.current) {
              window.clearInterval(iv);
              resolve();
              return;
            }
            rem -= 1;
            if (rem <= 0) {
              window.clearInterval(iv);
              resolve();
            } else {
              setSeqState({ phase, speakerIdx: spIdx, countdown: rem });
            }
          }, 1000);
        });

      const playMp3 = (url: string) =>
        new Promise<void>((resolve) => {
          const a = new Audio(url);
          audioRef.current = a;
          a.onended = () => resolve();
          a.onerror = () => resolve();
          a.play().catch(() => resolve());
        });

      await waitSec(2, 'countdown', 0);
      if (cancelSeqRef.current) return;

      for (let i = 0; i < question.speakers.length; i++) {
        if (cancelSeqRef.current) return;
        setSeqState({ phase: 'playing', speakerIdx: i, countdown: 0 });
        await playMp3(resolvePublicAsset(question.speakers[i].audio));
        if (cancelSeqRef.current) return;
        if (i < question.speakers.length - 1) {
          await waitSec(2, 'gap', i + 1);
        }
      }
      if (!cancelSeqRef.current) {
        setSeqState({ phase: 'done', speakerIdx: 0, countdown: 0 });
      }
    },
    [stopAllSgdAudio]
  );

  const handleFlipCard = useCallback(() => {
    if (!current || flipped) return;
    setFlipped(true);
    startAutoSequence(current);
  }, [current, flipped, startAutoSequence]);

  const toggleSingleSpeakerAudio = (spId: number, audioPath: string) => {
    stopAllSgdAudio();
    if (singlePlayingId === spId) return;
    const a = new Audio(resolvePublicAsset(audioPath));
    singleAudioRef.current = a;
    setSinglePlayingId(spId);
    a.onended = () => setSinglePlayingId(null);
    a.onerror = () => setSinglePlayingId(null);
    a.play().catch(() => setSinglePlayingId(null));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ') {
        e.preventDefault();
        handleFlipCard();
      } else if (flipped && current) {
        if (e.key === '1') onRate(current.id, 'forgot');
        else if (e.key === '2') onRate(current.id, 'hard');
        else if (e.key === '3') onRate(current.id, 'easy');
      }
      if (e.key === 'ArrowRight' && pool.length > 1) {
        setIndex((p) => (p + 1) % pool.length);
      } else if (e.key === 'ArrowLeft' && pool.length > 1) {
        setIndex((p) => (p - 1 + pool.length) % pool.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleFlipCard, flipped, current, onRate, pool.length]);

  if (!current) {
    return (
      <div className="surface-card" style={{ textAlign: 'center', padding: '2.8rem 1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem' }}>今日到期的 SGD 討論卡已全數完成！</h3>
        <p style={{ margin: '0 0 1.2rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          原版 41 題視覺與音檔記憶卡已與 SM-2 同步保存。
        </p>
        <button
          id="btn-sgd-view-all"
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFilterMode('all');
            setIndex(0);
          }}
        >
          瀏覽全部 41 題 SGD 圖音庫
        </button>
      </div>
    );
  }

  const dueCount = SGD_QUESTIONS.filter((q) => isCardDue(cardsMap[makeCardKey('sgd', q.id)])).length;

  return (
    <div>
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
            id="btn-sgd-due"
            type="button"
            className={`btn ${filterMode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.38rem 0.78rem', fontSize: '0.78rem' }}
            onClick={() => {
              setFilterMode('due');
              setIndex(0);
            }}
          >
            今日到期 ({dueCount})
          </button>
          <button
            id="btn-sgd-all"
            type="button"
            className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.38rem 0.78rem', fontSize: '0.78rem' }}
            onClick={() => {
              setFilterMode('all');
              setIndex(0);
            }}
          >
            全部 41 題
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            id="btn-sgd-prev"
            type="button"
            className="btn btn-ghost"
            onClick={() => setIndex((p) => (p - 1 + pool.length) % pool.length)}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Q{current.id} · {index + 1} / {pool.length}
          </span>
          <button
            id="btn-sgd-next"
            type="button"
            className="btn btn-ghost"
            onClick={() => setIndex((p) => (p + 1) % pool.length)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!flipped ? (
        <div
          id="sgd-front-card"
          className="surface-card"
          style={{ cursor: 'pointer', maxWidth: '680px', margin: '0 auto' }}
          onClick={handleFlipCard}
        >
          <div className="sgd-cover-frame">
            <img src={resolvePublicAsset(current.image)} alt={current.topic} />
          </div>
          <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem 0.4rem' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem', textTransform: 'capitalize' }}>
              {current.topic}
            </h3>
            <p style={{ margin: '0 0 0.65rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {current.topicZh}
            </p>
            <span className="tag tag-ocean">
              點擊卡片或按 Space 翻面並自動連播三位講者音檔
            </span>
          </div>
        </div>
      ) : (
        <div className="surface-card animate-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div className="sgd-speaker-strip">
            {current.speakers.map((sp) => (
              <div key={sp.id} className="sgd-speaker-thumb">
                <img src={resolvePublicAsset(sp.image)} alt={`Speaker ${sp.id}`} />
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    background: 'rgba(0,0,0,0.65)',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Speaker {sp.id}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'capitalize' }}>
                Q{current.id}. {current.topic}{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.88rem' }}>
                  {current.topicZh}
                </span>
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {seqState.phase !== 'idle' && seqState.phase !== 'done' ? (
                <button
                  id="btn-sgd-stop-seq"
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
                  onClick={stopAllSgdAudio}
                >
                  <Square size={13} />
                  {seqState.phase === 'countdown' || seqState.phase === 'gap'
                    ? `倒數 ${seqState.countdown}s · 停止`
                    : `播放 S${seqState.speakerIdx + 1} · 停止`}
                </button>
              ) : (
                <button
                  id="btn-sgd-replay-seq"
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
                  onClick={() => startAutoSequence(current)}
                >
                  <Play size={13} />
                  連播三人音檔
                </button>
              )}

              <button
                id="btn-sgd-toggle-scaffold"
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem' }}
                onClick={() => setShowScaffold((v) => !v)}
              >
                {showScaffold ? '收合串講骨架' : '2分鐘高分串講骨架'}
              </button>
            </div>
          </div>

          {/* Speakers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            {current.speakers.map((sp, idx) => {
              const isSeqActive =
                (seqState.phase === 'playing' && seqState.speakerIdx === idx) ||
                (seqState.phase === 'gap' && seqState.speakerIdx === idx);
              const isSingleActive = singlePlayingId === sp.id;
              const zhVisible = !!showZhMap[sp.id];

              return (
                <div
                  key={sp.id}
                  className={`sgd-speaker-row ${isSeqActive || isSingleActive ? 'playing' : ''}`}
                >
                  <button
                    id={`btn-sgd-sp-${sp.id}`}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      width: '36px',
                      height: '36px',
                      padding: 0,
                      borderRadius: '999px',
                      flexShrink: 0,
                    }}
                    onClick={() => toggleSingleSpeakerAudio(sp.id, sp.audio)}
                    title={`播放第 ${sp.id} 位講者`}
                  >
                    {isSingleActive ? <Square size={13} /> : <Volume2 size={15} />}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: '0.94rem', cursor: 'pointer' }}
                      onClick={() => setShowZhMap((m) => ({ ...m, [sp.id]: !m[sp.id] }))}
                    >
                      {sp.text}
                    </div>
                    {zhVisible ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', marginTop: '0.3rem' }}>
                        {sp.textZh}
                      </div>
                    ) : (
                      <button
                        type="button"
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          padding: '0.2rem 0 0',
                        }}
                        onClick={() => setShowZhMap((m) => ({ ...m, [sp.id]: true }))}
                      >
                        顯示中文
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2026 Anti-Human-Review Natural Connection Scaffold */}
          {showScaffold && (
            <div
              className="animate-in"
              style={{
                padding: '0.95rem 1.05rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid hsla(162, 68%, 45%, 0.28)',
                marginBottom: '1rem',
                fontSize: '0.86rem',
                lineHeight: 1.65,
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'hsl(162, 76%, 64%)', fontWeight: 700, marginBottom: '0.3rem' }}>
                ✓ 通過 AI + 真人雙審的 90 秒自然串聯講法（零萬用廢話、直接串起三句）：
              </div>
              <div>
                “The group discussion centered on <strong>{current.topic}</strong>, where three students shared distinct perspectives.{' '}
                Initially, {current.speakers[0]?.text.charAt(0).toLowerCase()}
                {current.speakers[0]?.text.slice(1)}.{' '}
                In contrast, {current.speakers[1]?.text.charAt(0).toLowerCase()}
                {current.speakers[1]?.text.slice(1)}.{' '}
                Meanwhile, {current.speakers[2]?.text.charAt(0).toLowerCase()}
                {current.speakers[2]?.text.slice(1)}.{' '}
                Overall, each speaker prioritized different practical factors regarding {current.topic}.”
              </div>
            </div>
          )}

          {/* 2-Min Real Exam Mic Practice */}
          <MicStudioBar
            idPrefix={`sgd-${current.id}`}
            prepSeconds={10}
            recordSeconds={120}
            label="SGD 實戰錄音 (10s準備 + 120s作答)"
            resetTrigger={current.id}
          />

          <div className="srs-rate-grid">
            <button
              id="btn-sgd-rate-forgot"
              type="button"
              className="btn-rate forgot"
              onClick={() => onRate(current.id, 'forgot')}
            >
              <span>Forgot (1)</span>
              <small>今日重背</small>
            </button>
            <button
              id="btn-sgd-rate-hard"
              type="button"
              className="btn-rate hard"
              onClick={() => onRate(current.id, 'hard')}
            >
              <span>Hard (2)</span>
              <small>縮短間隔</small>
            </button>
            <button
              id="btn-sgd-rate-easy"
              type="button"
              className="btn-rate easy"
              onClick={() => onRate(current.id, 'easy')}
            >
              <span>Easy (3)</span>
              <small>熟練推進</small>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            快捷鍵：<span className="kbd">Space</span> 翻卡 · <span className="kbd">1 / 2 / 3</span> 評分 ·{' '}
            <span className="kbd">← / →</span> 切換題目
          </div>
        </div>
      )}
    </div>
  );
};

export const SpeakingLab: React.FC<SpeakingLabProps> = ({
  activeSubTab,
  onChangeSubTab,
  cardsMap,
  onRateCard,
  accent,
  speechRate,
}) => {
  const [rsIdx, setRsIdx] = useState(0);
  const [rsRevealed, setRsRevealed] = useState(false);

  const [rtsIdx, setRtsIdx] = useState(0);
  const [rtsShowSample, setRtsShowSample] = useState(false);

  const [diIdx, setDiIdx] = useState(0);
  const [diShowSample, setDiShowSample] = useState(false);

  const [raIdx, setRaIdx] = useState(0);
  const [raShowSlashes, setRaShowSlashes] = useState(true);

  useEffect(() => {
    stopSpeaking();
    setRsRevealed(false);
    setRtsShowSample(false);
    setDiShowSample(false);
  }, [activeSubTab, rsIdx, rtsIdx, diIdx, raIdx]);

  const rsItem = RS_QUESTIONS[rsIdx % RS_QUESTIONS.length];
  const rtsItem = RTS_QUESTIONS[rtsIdx % RTS_QUESTIONS.length];
  const diItem = DI_QUESTIONS[diIdx % DI_QUESTIONS.length];
  const raItem = RA_QUESTIONS[raIdx % RA_QUESTIONS.length];

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <span className="eyebrow">SPEAKING ≥ 54 (四科門檻最高) + LISTENING 交叉供分艙</span>
          <h2 className="section-title">口說實戰記憶艙（流利度 100% 純 AI 評分）</h2>
        </div>
      </div>

      {/* 5 Speaking Task Sub-tabs */}
      <div className="subtab-bar">
        <button
          id="subtab-speaking-sgd"
          type="button"
          className={`subtab-btn ${activeSubTab === 'sgd' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('sgd')}
        >
          <Users size={15} />
          SGD 小組討論 (41題原版)
        </button>
        <button
          id="subtab-speaking-rs"
          type="button"
          className={`subtab-btn ${activeSubTab === 'rs' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('rs')}
        >
          <Repeat size={15} />
          RS 復述句子 (半句減負)
        </button>
        <button
          id="subtab-speaking-rts"
          type="button"
          className={`subtab-btn ${activeSubTab === 'rts' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('rts')}
        >
          <MessageSquare size={15} />
          RTS 情境回答 (2025新題)
        </button>
        <button
          id="subtab-speaking-di"
          type="button"
          className={`subtab-btn ${activeSubTab === 'di' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('di')}
        >
          <BarChart3 size={15} />
          DI 圖表 + RL 雙審骨架
        </button>
        <button
          id="subtab-speaking-ra"
          type="button"
          className={`subtab-btn ${activeSubTab === 'ra' ? 'active' : ''}`}
          onClick={() => onChangeSubTab('ra')}
        >
          <BookOpen size={15} />
          RA 意群斷句朗讀
        </button>
      </div>

      {/* 1. SGD View */}
      {activeSubTab === 'sgd' && (
        <SgdDeckView
          cardsMap={cardsMap}
          onRate={(id, rating) => onRateCard('sgd', id, rating)}
        />
      )}

      {/* 2. RS Repeat Sentence View */}
      {activeSubTab === 'rs' && rsItem && (
        <div className="surface-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="tag tag-jade">RS #{rsItem.id}</span>
              <span className="tag tag-ocean">供分：Speaking + Listening</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRsIdx((p) => (p - 1 + RS_QUESTIONS.length) % RS_QUESTIONS.length)}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {rsIdx + 1} / {RS_QUESTIONS.length}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRsIdx((p) => (p + 1) % RS_QUESTIONS.length)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                步驟 1：盲聽原句 → 步驟 2：立刻錄音復述（長句只講綠色前半意群也能穩拿 60+！）
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                切忌「嗯、啊」猶豫或回頭重唸——流利度 5 分遠比多湊兩個單字重要！
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                id="btn-rs-play"
                type="button"
                className="btn btn-primary"
                onClick={() => speakEnglish(`${rsItem.chunkA} ${rsItem.chunkB}`, accent, speechRate)}
              >
                <Volume2 size={16} />
                播放考場原句
              </button>
              <button
                id="btn-rs-reveal"
                type="button"
                className="btn btn-secondary"
                onClick={() => setRsRevealed((v) => !v)}
              >
                <Eye size={15} />
                {rsRevealed ? '遮蔽文字盲測' : '顯示意群切分'}
              </button>
            </div>
          </div>

          {rsRevealed && (
            <div
              className="animate-in"
              style={{
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '1.12rem', fontWeight: 700, lineHeight: 1.6, marginBottom: '0.45rem' }}>
                <span
                  style={{
                    background: 'var(--accent-jade-soft)',
                    color: 'hsl(162, 76%, 66%)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '6px',
                  }}
                >
                  {rsItem.chunkA}
                </span>{' '}
                <span style={{ color: 'var(--text-secondary)' }}>/ {rsItem.chunkB}</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                {rsItem.textZh}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)' }}>💡 {rsItem.tip}</div>
            </div>
          )}

          <MicStudioBar
            idPrefix={`rs-${rsItem.id}`}
            prepSeconds={0}
            recordSeconds={15}
            label="RS 15秒復述錄音"
            resetTrigger={rsItem.id}
          />

          <div className="srs-rate-grid">
            <button
              type="button"
              className="btn-rate forgot"
              onClick={() => {
                onRateCard('rs', rsItem.id, 'forgot');
                setRsIdx((p) => (p + 1) % RS_QUESTIONS.length);
              }}
            >
              <span>Forgot 卡詞</span>
              <small>重練意群</small>
            </button>
            <button
              type="button"
              className="btn-rate hard"
              onClick={() => {
                onRateCard('rs', rsItem.id, 'hard');
                setRsIdx((p) => (p + 1) % RS_QUESTIONS.length);
              }}
            >
              <span>Hard 僅穩前半</span>
              <small>已達 60 分線</small>
            </button>
            <button
              type="button"
              className="btn-rate easy"
              onClick={() => {
                onRateCard('rs', rsItem.id, 'easy');
                setRsIdx((p) => (p + 1) % RS_QUESTIONS.length);
              }}
            >
              <span>Easy 全句順暢</span>
              <small>拉長間隔</small>
            </button>
          </div>
        </div>
      )}

      {/* 3. RTS Respond to a Situation View */}
      {activeSubTab === 'rts' && rtsItem && (
        <div className="surface-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="tag tag-amber">2025/8 新題型 · AI+真人雙審</span>
              <span className="tag tag-neutral">RTS #{rtsItem.id} · {rtsItem.titleZh}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRtsIdx((p) => (p - 1 + RTS_QUESTIONS.length) % RTS_QUESTIONS.length)}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {rtsIdx + 1} / {RTS_QUESTIONS.length}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRtsIdx((p) => (p + 1) % RTS_QUESTIONS.length)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
              <strong style={{ fontSize: '0.98rem' }}>{rtsItem.title}</strong>
              <button
                id="btn-rts-play-prompt"
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => speakEnglish(rtsItem.prompt, accent, speechRate)}
              >
                <Volume2 size={14} />
                朗讀題目情境
              </button>
            </div>
            <p style={{ margin: '0 0 0.45rem', fontSize: '0.93rem', lineHeight: 1.6 }}>{rtsItem.prompt}</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{rtsItem.promptZh}</p>
          </div>

          <div
            style={{
              padding: '0.95rem 1.05rem',
              borderRadius: 'var(--radius-md)',
              background: 'hsla(162, 68%, 43%, 0.08)',
              border: '1px solid hsla(162, 68%, 43%, 0.22)',
              marginBottom: '1rem',
              fontSize: '0.83rem',
            }}
          >
            <div style={{ fontWeight: 700, color: 'hsl(162, 76%, 64%)', marginBottom: '0.35rem' }}>
              第一人稱 3 步自然破題結構（開場直接喊「{rtsItem.addressTo}」切勿用第三人稱描述！）：
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {rtsItem.keyPoints.map((kp, idx) => (
                <li key={idx}>{kp}</li>
              ))}
            </ol>
          </div>

          <MicStudioBar
            idPrefix={`rts-${rtsItem.id}`}
            prepSeconds={10}
            recordSeconds={40}
            label="RTS 考場模擬 (10s準備 + 40s第一人稱回答)"
            resetTrigger={rtsItem.id}
          />

          <div style={{ marginTop: '0.85rem' }}>
            <button
              id="btn-rts-sample"
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.82rem' }}
              onClick={() => setRtsShowSample((v) => !v)}
            >
              {rtsShowSample ? '隱藏高分自然示範回答' : '檢視並試聽 35 秒高分自然示範回答'}
            </button>

            {rtsShowSample && (
              <div
                className="animate-in"
                style={{
                  marginTop: '0.7rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.88rem',
                }}
              >
                <p style={{ margin: '0 0 0.6rem', lineHeight: 1.65 }}>{rtsItem.sampleResponse}</p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => speakEnglish(rtsItem.sampleResponse, accent, speechRate)}
                >
                  <Volume2 size={14} />
                  聽示範語氣與語速
                </button>
              </div>
            )}
          </div>

          <div className="srs-rate-grid">
            <button
              type="button"
              className="btn-rate forgot"
              onClick={() => {
                onRateCard('rts', rtsItem.id, 'forgot');
                setRtsIdx((p) => (p + 1) % RTS_QUESTIONS.length);
              }}
            >
              <span>Forgot 卡住</span>
              <small>重練結構</small>
            </button>
            <button
              type="button"
              className="btn-rate hard"
              onClick={() => {
                onRateCard('rts', rtsItem.id, 'hard');
                setRtsIdx((p) => (p + 1) % RTS_QUESTIONS.length);
              }}
            >
              <span>Hard 稍有停頓</span>
              <small>短期複習</small>
            </button>
            <button
              type="button"
              className="btn-rate easy"
              onClick={() => {
                onRateCard('rts', rtsItem.id, 'easy');
                setRtsIdx((p) => (p + 1) % RTS_QUESTIONS.length);
              }}
            >
              <span>Easy 自然講滿30s</span>
              <small>推進間隔</small>
            </button>
          </div>
        </div>
      )}

      {/* 4. DI Describe Image View */}
      {activeSubTab === 'di' && diItem && (
        <div className="surface-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="tag tag-amber">AI + 真人雙審 Content</span>
              <span className="tag tag-neutral">DI #{diItem.id}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDiIdx((p) => (p - 1 + DI_QUESTIONS.length) % DI_QUESTIONS.length)}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {diIdx + 1} / {DI_QUESTIONS.length}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDiIdx((p) => (p + 1) % DI_QUESTIONS.length)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <DiChartSvg item={diItem} />
          </div>

          <div
            style={{
              padding: '0.95rem 1.05rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem',
              fontSize: '0.83rem',
            }}
          >
            <div style={{ fontWeight: 700, color: 'hsl(162, 76%, 64%)', marginBottom: '0.35rem' }}>
              2026 防雙審 4 句真實數據骨架（25秒內在圖上圈出「標題、最高、最低、趨勢」直接唸）：
            </div>
            <div>1. <strong>開場標題</strong>：This chart illustrates <em>[圖表標題]</em>.</div>
            <div>2. <strong>最高數據</strong>：Looking at the main figures, {diItem.keyHighest}.</div>
            <div>3. <strong>最低與對比</strong>：In contrast, {diItem.keyLowest}.</div>
            <div>4. <strong>整體結論</strong>：Overall, {diItem.keyTrend}.</div>
          </div>

          <MicStudioBar
            idPrefix={`di-${diItem.id}`}
            prepSeconds={25}
            recordSeconds={40}
            label="DI 考場模擬 (25s看圖 + 40s描述)"
            resetTrigger={diItem.id}
          />

          <div style={{ marginTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.82rem' }}
              onClick={() => setDiShowSample((v) => !v)}
            >
              {diShowSample ? '隱藏完整 35 秒滿分範例稿' : '展開完整範例稿並試聽標準語速'}
            </button>
            {diShowSample && (
              <div
                className="animate-in"
                style={{
                  marginTop: '0.7rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.88rem',
                }}
              >
                <p style={{ margin: '0 0 0.6rem', lineHeight: 1.65 }}>{diItem.safeSpeech}</p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => speakEnglish(diItem.safeSpeech, accent, speechRate)}
                >
                  <Volume2 size={14} />
                  播放滿分範例音檔
                </button>
              </div>
            )}
          </div>

          <div className="srs-rate-grid">
            <button
              type="button"
              className="btn-rate forgot"
              onClick={() => {
                onRateCard('di', diItem.id, 'forgot');
                setDiIdx((p) => (p + 1) % DI_QUESTIONS.length);
              }}
            >
              <span>Forgot 卡頓</span>
              <small>重練轉折</small>
            </button>
            <button
              type="button"
              className="btn-rate hard"
              onClick={() => {
                onRateCard('di', diItem.id, 'hard');
                setDiIdx((p) => (p + 1) % DI_QUESTIONS.length);
              }}
            >
              <span>Hard 數字略慢</span>
              <small>短期複習</small>
            </button>
            <button
              type="button"
              className="btn-rate easy"
              onClick={() => {
                onRateCard('di', diItem.id, 'easy');
                setDiIdx((p) => (p + 1) % DI_QUESTIONS.length);
              }}
            >
              <span>Easy 32秒流暢</span>
              <small>推進間隔</small>
            </button>
          </div>
        </div>
      )}

      {/* 5. RA Read Aloud View */}
      {activeSubTab === 'ra' && raItem && (
        <div className="surface-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="tag tag-jade">RA #{raItem.id} · {raItem.title}</span>
              <span className="tag tag-neutral">新制純供分 Speaking（勿用一句流！）</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRaIdx((p) => (p - 1 + RA_QUESTIONS.length) % RA_QUESTIONS.length)}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {raIdx + 1} / {RA_QUESTIONS.length}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRaIdx((p) => (p + 1) % RA_QUESTIONS.length)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '1.3rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              marginBottom: '0.9rem',
              fontSize: '1.05rem',
              lineHeight: 1.85,
            }}
          >
            {raShowSlashes ? raItem.markedText : raItem.plainText}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>💡 {raItem.traps}</span>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                onClick={() => setRaShowSlashes((v) => !v)}
              >
                {raShowSlashes ? '切換考場純文字視角' : '顯示 / 意群換氣斜線'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                onClick={() => speakEnglish(raItem.plainText, accent, speechRate)}
              >
                <Volume2 size={14} />
                試聽示範朗讀
              </button>
            </div>
          </div>

          <MicStudioBar
            idPrefix={`ra-${raItem.id}`}
            prepSeconds={35}
            recordSeconds={40}
            label="RA 考場模擬 (35s默讀切意群 + 40s朗讀)"
            resetTrigger={raItem.id}
          />

          <div className="srs-rate-grid">
            <button
              type="button"
              className="btn-rate forgot"
              onClick={() => {
                onRateCard('ra', raItem.id, 'forgot');
                setRaIdx((p) => (p + 1) % RA_QUESTIONS.length);
              }}
            >
              <span>Forgot 重唸或卡詞</span>
              <small>需重練斷句</small>
            </button>
            <button
              type="button"
              className="btn-rate hard"
              onClick={() => {
                onRateCard('ra', raItem.id, 'hard');
                setRaIdx((p) => (p + 1) % RA_QUESTIONS.length);
              }}
            >
              <span>Hard 生詞微卡</span>
              <small>短期複習</small>
            </button>
            <button
              type="button"
              className="btn-rate easy"
              onClick={() => {
                onRateCard('ra', raItem.id, 'easy');
                setRaIdx((p) => (p + 1) % RA_QUESTIONS.length);
              }}
            >
              <span>Easy 節奏平穩</span>
              <small>推進間隔</small>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
