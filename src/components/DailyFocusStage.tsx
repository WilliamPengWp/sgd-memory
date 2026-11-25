import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  DailyQueueEntry,
  DailyStreamState,
  UnifiedQuestionBank,
  IndexedWritingPrompt,
} from '../utils/dailyPlanner';
import { DeckType, Rating } from '../utils/srs';
import { AccentPreference, resolvePublicAsset, speakEnglish, stopSpeaking } from '../utils/speech';
import { buildWordBricks, scoreWfdAttempt, WordBrickTile } from '../data/wfdData';
import { lintWritingResponse, WritingLintReport } from '../data/rwData';
import { callGeminiWritingOrSpeakingCoach, AiCoachDiagnosis } from '../utils/aiEngine';
import { AiSpeechScorerBox } from './AiSpeechScorerBox';

interface DailyFocusStageProps {
  stream: DailyStreamState;
  bank: UnifiedQuestionBank;
  retentionAvg: number;
  accent: AccentPreference;
  speechRate: number;
  onCompleteItem: (entry: DailyQueueEntry, rating: Rating, scoreEarned?: number) => void;
  onAddBonus: (focusDeck?: DeckType) => void;
  onOpenDrawer: () => void;
}

const TASK_META: Record<DeckType, { code: string; nameZh: string }> = {
  wfd: { code: 'WFD', nameZh: '聽寫句子 · 聽寫雙向核心' },
  rs: { code: 'RS', nameZh: '原句重複 · 聽說雙向核心' },
  sgd: { code: 'SGD', nameZh: '三人討論摘要 · 2025 新題型' },
  rts: { code: 'RTS', nameZh: '情境回應 · 第一人稱口說' },
  ra: { code: 'RA', nameZh: '朗讀短文 · 口說暖身與閱讀供分' },
  fib: { code: 'FIB', nameZh: '學術黃金搭配 · 讀寫克漏字' },
  writing: { code: 'WRITE', nameZh: '寫作防呆與 AI 雙審批改' },
  di: { code: 'DI', nameZh: '圖表描述' },
};

export const DailyFocusStage: React.FC<DailyFocusStageProps> = ({
  stream,
  bank,
  retentionAvg,
  accent,
  speechRate,
  onCompleteItem,
  onAddBonus,
  onOpenDrawer,
}) => {
  const completedSet = useMemo(() => new Set(stream.completedUids), [stream.completedUids]);
  const currentEntry = useMemo(
    () => stream.queue.find((q) => !completedSet.has(q.uid)) || null,
    [stream.queue, completedSet]
  );

  const currentIdx = stream.completedUids.length + 1;
  const totalCount = stream.queue.length;

  // Per-card transient interaction states
  const [attempted, setAttempted] = useState(false);
  const [latestScore, setLatestScore] = useState<number | undefined>(undefined);
  const [revealHint, setRevealHint] = useState(false);

  // WFD states
  const [wfdMode, setWfdMode] = useState<'bricks' | 'type'>('bricks');
  const [pickedBricks, setPickedBricks] = useState<WordBrickTile[]>([]);
  const [wfdTyped, setWfdTyped] = useState('');
  const [wfdSubmitted, setWfdSubmitted] = useState(false);

  // FIB state
  const [fibChoice, setFibChoice] = useState<string | null>(null);

  // SGD audio player ref (reused across s1 -> s2 -> s3 so mobile browsers never block chained playback)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seqTimerRef = useRef<number | null>(null);
  const [playingAudioSrc, setPlayingAudioSrc] = useState<string | null>(null);
  const [sgdSeqStep, setSgdSeqStep] = useState<number | null>(null);

  // Writing states
  const [writingDraft, setWritingDraft] = useState('');
  const [writingLint, setWritingLint] = useState<WritingLintReport | null>(null);
  const [writingCoach, setWritingCoach] = useState<AiCoachDiagnosis | null>(null);
  const [writingLoading, setWritingLoading] = useState(false);

  const stopAllAudio = () => {
    stopSpeaking();
    if (seqTimerRef.current) {
      window.clearTimeout(seqTimerRef.current);
      seqTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
    }
    setPlayingAudioSrc(null);
    setSgdSeqStep(null);
  };

  // Reset card states whenever currentEntry changes
  useEffect(() => {
    stopAllAudio();
    setAttempted(false);
    setLatestScore(undefined);
    setRevealHint(false);
    setPickedBricks([]);
    setWfdTyped('');
    setWfdSubmitted(false);
    setFibChoice(null);
    setWritingDraft('');
    setWritingLint(null);
    setWritingCoach(null);
    setWritingLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEntry?.uid]);

  const playMp3 = (relPath: string, fallbackText?: string) => {
    if (playingAudioSrc === relPath) {
      stopAllAudio();
      return;
    }
    stopAllAudio();
    const el = audioRef.current ?? new Audio();
    audioRef.current = el;
    el.src = resolvePublicAsset(relPath);
    setPlayingAudioSrc(relPath);
    el.onended = () => setPlayingAudioSrc(null);
    el.onerror = () => {
      setPlayingAudioSrc(null);
      if (fallbackText) speakEnglish(fallbackText, accent, speechRate);
    };
    el.play().catch(() => {
      setPlayingAudioSrc(null);
      if (fallbackText) speakEnglish(fallbackText, accent, speechRate);
    });
  };

  const playSgdSpeakersSequence = (speakers: Array<{ id: number; audio: string; text: string }>) => {
    if (sgdSeqStep !== null) {
      stopAllAudio();
      return;
    }
    if (speakers.length === 0) return;
    stopAllAudio();

    const el = audioRef.current ?? new Audio();
    audioRef.current = el;

    const playStep = (idx: number) => {
      if (idx >= speakers.length) {
        setPlayingAudioSrc(null);
        setSgdSeqStep(null);
        return;
      }
      const sp = speakers[idx];
      setSgdSeqStep(idx + 1);
      setPlayingAudioSrc(sp.audio);
      el.src = resolvePublicAsset(sp.audio);
      el.onended = () => {
        seqTimerRef.current = window.setTimeout(() => playStep(idx + 1), 320);
      };
      el.onerror = () => {
        speakEnglish(sp.text, accent, speechRate, () => playStep(idx + 1));
      };
      el.play().catch(() => {
        speakEnglish(sp.text, accent, speechRate, () => playStep(idx + 1));
      });
    };

    playStep(0);
  };

  // All done screen!
  if (!currentEntry) {
    const scoreValues = Object.values(stream.scoresByUid);
    const avgAiScore =
      scoreValues.length > 0
        ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
        : null;

    return (
      <section className="focus-stage">
        <div className="focus-card completion-card animate-in">
          <div className="completion-badge">
            <CheckCircle2 size={28} color="var(--accent-jade)" />
          </div>
          <h1 className="completion-title">今日練習已全部完成</h1>
          <p className="completion-sub">
            今天已穩紮穩打完成 {stream.queue.length} 題高投報排程，艾賓浩斯記憶曲線已同步更新。
          </p>

          <div className="completion-metrics">
            <div className="metric-box">
              <div className="metric-val">{stream.queue.length} 題</div>
              <div className="metric-lbl">今日完成</div>
            </div>
            <div className="metric-box">
              <div className="metric-val">{avgAiScore ? `${avgAiScore} / 90` : '達標'}</div>
              <div className="metric-lbl">AI 平均評分</div>
            </div>
            <div className="metric-box">
              <div className="metric-val">{retentionAvg}%</div>
              <div className="metric-lbl">記憶保留率</div>
            </div>
          </div>

          <div className="completion-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAddBonus()}
            >
              <Plus size={16} />
              再加練 5 題
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenDrawer}
            >
              查看進度與本週預測題庫
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Resolve question payload
  const wfdItem =
    currentEntry.deck === 'wfd' ? bank.wfd.find((x) => x.id === currentEntry.itemId) : undefined;
  const rsItem =
    currentEntry.deck === 'rs' ? bank.rs.find((x) => x.id === currentEntry.itemId) : undefined;
  const raItem =
    currentEntry.deck === 'ra' ? bank.ra.find((x) => x.id === currentEntry.itemId) : undefined;
  const sgdItem =
    currentEntry.deck === 'sgd' ? bank.sgd.find((x) => x.id === currentEntry.itemId) : undefined;
  const rtsItem =
    currentEntry.deck === 'rts' ? bank.rts.find((x) => x.id === currentEntry.itemId) : undefined;
  const fibItem =
    currentEntry.deck === 'fib' ? bank.fib.find((x) => x.id === currentEntry.itemId) : undefined;
  const writingItem: IndexedWritingPrompt | undefined =
    currentEntry.deck === 'writing'
      ? bank.writing.find((x) => x.numericId === currentEntry.itemId)
      : undefined;

  // WFD bricks memoized per card
  const wfdPuzzle = useMemo(
    () => (wfdItem ? buildWordBricks(wfdItem) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wfdItem?.id]
  );

  const meta = TASK_META[currentEntry.deck];

  const handleFinishWithRating = (rating: Rating) => {
    onCompleteItem(currentEntry, rating, latestScore);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Writing automatic lint + AI Coach double-marking
  const handleSubmitWriting = async () => {
    if (!writingItem || !writingDraft.trim()) return;
    const lint = lintWritingResponse(writingItem, writingDraft);
    setWritingLint(lint);
    setAttempted(true);
    setWritingLoading(true);
    const diagnosis = await callGeminiWritingOrSpeakingCoach({
      taskType: writingItem.type,
      promptText: writingItem.sourceTextOrTranscript,
      userAnswer: writingDraft,
    });
    setWritingCoach(diagnosis);
    setLatestScore(diagnosis.estimatedBand);
    setWritingLoading(false);
  };

  return (
    <section className="focus-stage">
      <article className="focus-card animate-in" key={currentEntry.uid}>
        {/* Minimal Card Header */}
        <div className="focus-card-header">
          <div className="focus-task-left">
            <span className="task-pill">
              {writingItem ? writingItem.type : meta.code}
            </span>
            <span className="task-subtitle">
              {writingItem ? writingItem.title : meta.nameZh}
            </span>
          </div>

          <div className="focus-task-right">
            {currentEntry.reason === 'rescue' && (
              <span className="reason-pill rescue">
                記憶搶救{currentEntry.retentionPct ? ` · ${currentEntry.retentionPct}%` : ''}
              </span>
            )}
            {currentEntry.reason === 'prediction' && (
              <span className="reason-pill prediction">本週預測題庫</span>
            )}
            <span className="step-counter">
              {currentIdx} / {totalCount}
            </span>
          </div>
        </div>

        {/* ================= 1. WFD CARD ================= */}
        {wfdItem && wfdPuzzle && (
          <div className="card-body-stack">
            <div className="audio-prompt-row">
              <button
                type="button"
                className="btn btn-audio-hero"
                onClick={() => speakEnglish(wfdItem.text, accent, speechRate)}
              >
                <Volume2 size={18} />
                播放聽寫句子
              </button>

              <div className="mode-seg">
                <button
                  type="button"
                  className={wfdMode === 'bricks' ? 'active' : ''}
                  onClick={() => {
                    setWfdMode('bricks');
                    setWfdSubmitted(false);
                  }}
                >
                  單字積木
                </button>
                <button
                  type="button"
                  className={wfdMode === 'type' ? 'active' : ''}
                  onClick={() => {
                    setWfdMode('type');
                    setWfdSubmitted(false);
                  }}
                >
                  鍵盤默寫
                </button>
              </div>
            </div>

            {wfdMode === 'bricks' ? (
              <div className="wfd-bricks-zone">
                <div className="brick-answer-tray">
                  {pickedBricks.length === 0 ? (
                    <span className="tray-placeholder">點擊下方單字積木拼出聽到的句子（內含 2 個干擾陷阱詞）…</span>
                  ) : (
                    pickedBricks.map((b) => (
                      <button
                        key={b.uid}
                        type="button"
                        className="brick-chip selected"
                        onClick={() => {
                          if (wfdSubmitted) return;
                          setPickedBricks((prev) => prev.filter((x) => x.uid !== b.uid));
                        }}
                      >
                        {b.word}
                      </button>
                    ))
                  )}
                </div>

                <div className="brick-pool">
                  {wfdPuzzle.shuffledPool.map((tile) => {
                    const isUsed = pickedBricks.some((x) => x.uid === tile.uid);
                    return (
                      <button
                        key={tile.uid}
                        type="button"
                        disabled={isUsed || wfdSubmitted}
                        className={`brick-chip ${isUsed ? 'used' : ''}`}
                        onClick={() => {
                          const next = [...pickedBricks, tile];
                          setPickedBricks(next);
                          if (next.length === wfdPuzzle.targetTokens.length) {
                            const attemptSentence = `${next.map((x) => x.word).join(' ')}.`;
                            const diff = scoreWfdAttempt(wfdItem.text, attemptSentence);
                            setLatestScore(Math.round(20 + (diff.percentage / 100) * 70));
                            setWfdSubmitted(true);
                            setAttempted(true);
                          }
                        }}
                      >
                        {tile.word}
                      </button>
                    );
                  })}
                </div>

                {pickedBricks.length > 0 && !wfdSubmitted && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="text-link-subtle"
                      onClick={() => setPickedBricks([])}
                    >
                      <RotateCcw size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      重排
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const attemptSentence = `${pickedBricks.map((x) => x.word).join(' ')}.`;
                        const diff = scoreWfdAttempt(wfdItem.text, attemptSentence);
                        setLatestScore(Math.round(20 + (diff.percentage / 100) * 70));
                        setWfdSubmitted(true);
                        setAttempted(true);
                      }}
                    >
                      對答案
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="wfd-type-zone">
                <input
                  type="text"
                  className="text-input-clean"
                  placeholder="輸入剛才聽到的完整英文句子（注意字首大寫與句尾句號）…"
                  value={wfdTyped}
                  onChange={(e) => setWfdTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && wfdTyped.trim()) {
                      const diff = scoreWfdAttempt(wfdItem.text, wfdTyped);
                      setLatestScore(Math.round(20 + (diff.percentage / 100) * 70));
                      setWfdSubmitted(true);
                      setAttempted(true);
                    }
                  }}
                />
                {!wfdSubmitted && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!wfdTyped.trim()}
                      onClick={() => {
                        const diff = scoreWfdAttempt(wfdItem.text, wfdTyped);
                        setLatestScore(Math.round(20 + (diff.percentage / 100) * 70));
                        setWfdSubmitted(true);
                        setAttempted(true);
                      }}
                    >
                      批改拼寫
                    </button>
                  </div>
                )}
              </div>
            )}

            {wfdSubmitted && (() => {
              const userStr =
                wfdMode === 'bricks'
                  ? `${pickedBricks.map((x) => x.word).join(' ')}.`
                  : wfdTyped;
              const diff = scoreWfdAttempt(wfdItem.text, userStr);
              return (
                <div className="result-callout animate-in">
                  <div className="result-headline">
                    <strong>
                      命中 {diff.matchedCount} / {diff.totalCount} 字 ({diff.percentage}%)
                    </strong>
                    {!diff.capitalOk && <span className="warn-inline">· 記得句首大寫</span>}
                    {!diff.periodOk && <span className="warn-inline">· 記得句尾句號</span>}
                  </div>
                  <div className="diff-tokens-line">
                    {diff.tokens
                      .filter((t) => t.status !== 'extra')
                      .map((t, idx) => (
                        <span key={idx} className={`diff-word ${t.status}`}>
                          {t.word}{' '}
                        </span>
                      ))}
                  </div>
                  <div className="note-muted">{wfdItem.textZh}</div>
                  <div className="note-tip">💡 {wfdItem.trapNote}</div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ================= 2. RS CARD ================= */}
        {rsItem && (
          <div className="card-body-stack">
            <div className="audio-prompt-row">
              <button
                type="button"
                className="btn btn-audio-hero"
                onClick={() => speakEnglish(`${rsItem.chunkA} ${rsItem.chunkB}`, accent, speechRate)}
              >
                <Volume2 size={18} />
                播放考題原音
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRevealHint((v) => !v)}
              >
                {revealHint ? <EyeOff size={15} /> : <Eye size={15} />}
                {revealHint ? '隱藏原句' : '查看意群提示'}
              </button>
            </div>

            {(revealHint || attempted) && (
              <div className="passage-box animate-in">
                <div style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                  <span className="chunk-highlight">{rsItem.chunkA}</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{rsItem.chunkB}</span>
                </div>
                <div className="note-muted" style={{ marginTop: '0.35rem' }}>
                  {rsItem.textZh} · {rsItem.tip}
                </div>
              </div>
            )}

            <AiSpeechScorerBox
              idPrefix={`rs-${rsItem.id}`}
              taskLabel="Repeat Sentence (RS)"
              recordSeconds={15}
              expectedKeywordsOrWords={`${rsItem.chunkA} ${rsItem.chunkB}`.split(/\s+/)}
              isVerbatimTask={true}
              promptSummary={`${rsItem.chunkA} ${rsItem.chunkB}`}
              resetTrigger={currentEntry.uid}
              onScored={(band) => {
                setLatestScore(band);
                setAttempted(true);
              }}
            />
          </div>
        )}

        {/* ================= 3. RA CARD ================= */}
        {raItem && (
          <div className="card-body-stack">
            <div className="passage-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  斜線 <code>/</code> 為自然換氣點 · 穩定順讀即可
                </span>
                <button
                  type="button"
                  className="text-link-subtle"
                  onClick={() => speakEnglish(raItem.plainText, accent, speechRate)}
                >
                  <Volume2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  聽示範發音
                </button>
              </div>
              <p className="ra-passage-text">{raItem.markedText}</p>
              <div className="note-muted" style={{ marginTop: '0.5rem' }}>
                提示：{raItem.traps}
              </div>
            </div>

            <AiSpeechScorerBox
              idPrefix={`ra-${raItem.id}`}
              taskLabel="Read Aloud (RA)"
              recordSeconds={40}
              expectedKeywordsOrWords={raItem.plainText.split(/\s+/)}
              isVerbatimTask={true}
              promptSummary={raItem.plainText}
              resetTrigger={currentEntry.uid}
              onScored={(band) => {
                setLatestScore(band);
                setAttempted(true);
              }}
            />
          </div>
        )}

        {/* ================= 4. SGD CARD ================= */}
        {sgdItem && (
          <div className="card-body-stack">
            <div className="sgd-topic-banner">
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>討論主題</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {sgdItem.topic} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({sgdItem.topicZh})</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-audio-hero"
                  onClick={() => playSgdSpeakersSequence(sgdItem.speakers)}
                >
                  <Volume2 size={16} />
                  {sgdSeqStep !== null
                    ? `播放中（講者 ${sgdSeqStep} / ${sgdItem.speakers.length} · 點擊停止）`
                    : '播放三人討論音檔'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRevealHint((v) => !v)}
                >
                  {revealHint ? '收起講者記憶卡' : '查看 3 位講者重點'}
                </button>
              </div>
            </div>

            {(revealHint || attempted) && (
              <div className="sgd-speakers-grid animate-in">
                {sgdItem.speakers.map((sp) => {
                  const isPlayingThis = playingAudioSrc === sp.audio;
                  return (
                    <div
                      key={sp.id}
                      className="sgd-speaker-mini"
                      style={
                        isPlayingThis
                          ? { borderColor: 'var(--accent-jade)', background: 'var(--accent-jade-soft)' }
                          : undefined
                      }
                      onClick={() => playMp3(sp.audio, sp.text)}
                    >
                      <img
                        src={resolvePublicAsset(sp.image)}
                        alt={`Speaker ${sp.id}`}
                        className="sgd-thumb"
                        loading="lazy"
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {isPlayingThis ? '🔊 ' : ''}
                          {sp.text}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {sp.textZh}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <AiSpeechScorerBox
              idPrefix={`sgd-${sgdItem.id}`}
              taskLabel="Summarize Group Discussion (SGD)"
              recordSeconds={60}
              expectedKeywordsOrWords={sgdItem.speakers
                .map((s) => s.text)
                .join(' ')
                .split(/\s+/)
                .filter((w) => w.length >= 5)}
              isVerbatimTask={false}
              promptSummary={`Topic: ${sgdItem.topic}. ${sgdItem.speakers.map((s) => s.text).join('. ')}`}
              resetTrigger={currentEntry.uid}
              onScored={(band) => {
                setLatestScore(band);
                setAttempted(true);
              }}
            />
          </div>
        )}

        {/* ================= 5. RTS CARD ================= */}
        {rtsItem && (
          <div className="card-body-stack">
            <div className="passage-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>{rtsItem.titleZh}</strong>
                <button
                  type="button"
                  className="text-link-subtle"
                  onClick={() => speakEnglish(rtsItem.prompt, accent, speechRate)}
                >
                  <Volume2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  播放情境音檔
                </button>
              </div>
              <p style={{ margin: '0 0 0.45rem', fontSize: '0.94rem', lineHeight: 1.6 }}>
                {rtsItem.prompt}
              </p>
              <div className="note-muted">{rtsItem.promptZh}</div>
              <div className="rts-steps">
                <span>開口建議：<strong>{rtsItem.addressTo},</strong></span>
                {rtsItem.keyPoints.map((kp, idx) => (
                  <div key={idx}>• {kp}</div>
                ))}
              </div>
            </div>

            <AiSpeechScorerBox
              idPrefix={`rts-${rtsItem.id}`}
              taskLabel="Respond to a Situation (RTS)"
              recordSeconds={40}
              expectedKeywordsOrWords={rtsItem.prompt.split(/\s+/).filter((w) => w.length >= 5)}
              isVerbatimTask={false}
              promptSummary={rtsItem.prompt}
              resetTrigger={currentEntry.uid}
              onScored={(band) => {
                setLatestScore(band);
                setAttempted(true);
              }}
            />
          </div>
        )}

        {/* ================= 6. FIB CARD ================= */}
        {fibItem && (
          <div className="card-body-stack">
            <div className="passage-box" style={{ fontSize: '1.05rem', lineHeight: 1.75 }}>
              <span>{fibItem.sentenceBefore}</span>
              <span
                className={`fib-blank ${
                  fibChoice
                    ? fibChoice === fibItem.answer
                      ? 'correct'
                      : 'wrong'
                    : ''
                }`}
              >
                {fibChoice || '________'}
              </span>
              <span>{fibItem.sentenceAfter}</span>
            </div>

            <div className="fib-options-grid">
              {fibItem.options.map((opt) => {
                let cls = 'fib-option-btn';
                if (fibChoice) {
                  if (opt === fibItem.answer) cls += ' correct';
                  else if (opt === fibChoice) cls += ' wrong';
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={Boolean(fibChoice)}
                    className={cls}
                    onClick={() => {
                      setFibChoice(opt);
                      setLatestScore(opt === fibItem.answer ? 75 : 42);
                      setAttempted(true);
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {fibChoice && (
              <div className="result-callout animate-in">
                <div className="result-headline">
                  <strong>
                    {fibChoice === fibItem.answer ? '✓ 答對了！' : `正解：${fibItem.answer}`}
                  </strong>{' '}
                  · 黃金搭配：<code>{fibItem.collocation}</code>（{fibItem.collocationZh}）
                </div>
                <div className="note-muted" style={{ marginTop: '0.25rem' }}>
                  {fibItem.explanation}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 7. WRITING (SWT / WE) CARD ================= */}
        {writingItem && (
          <div className="card-body-stack">
            <div className="passage-box">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                目標：{writingItem.sweetSpot}
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.65 }}>
                {writingItem.sourceTextOrTranscript}
              </p>
              <div className="note-tip" style={{ marginTop: '0.6rem' }}>
                結構提示：{writingItem.scaffoldGuide}
              </div>
            </div>

            <div>
              <textarea
                className="text-area-clean"
                rows={writingItem.type === 'WE' ? 8 : 4}
                placeholder={
                  writingItem.type === 'SWT'
                    ? '在此寫下 1 個完整長句摘要（45–65 字，全文嚴格只能有 1 個句號）…'
                    : '在此寫下 200–300 字四段式短文…'
                }
                value={writingDraft}
                onChange={(e) => setWritingDraft(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.55rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  字數：{writingDraft.trim() ? writingDraft.trim().split(/\s+/).length : 0} / {writingItem.maxWords}
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!writingDraft.trim() || writingLoading}
                  onClick={handleSubmitWriting}
                >
                  <Sparkles size={15} />
                  {writingLoading ? 'AI 雙審批改中…' : '提交 AI 評分與批改'}
                </button>
              </div>
            </div>

            {writingLint && (
              <div className="result-callout animate-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {writingCoach && (
                    <span className="ai-band-inline">
                      AI 預估：{writingCoach.estimatedBand} / 90
                    </span>
                  )}
                  <span style={{ fontSize: '0.83rem', color: writingLint.formPassed ? 'var(--accent-jade)' : 'var(--accent-amber)' }}>
                    {writingLint.formPassed ? '✓ 格式與防呆檢查全數通過' : '⚠️ 請留意下方格式紅線'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.81rem' }}>
                  {writingLint.checks.map((c, idx) => (
                    <div key={idx} style={{ color: c.ok ? 'var(--text-secondary)' : 'var(--accent-amber)' }}>
                      {c.ok ? '✓' : '✗'} {c.label}：{c.detail}
                    </div>
                  ))}
                </div>

                {writingCoach && (
                  <div className="ai-coach-notes" style={{ marginTop: '0.65rem' }}>
                    <div>✓ {writingCoach.strengthsZh}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      → {writingCoach.fixesZh}
                    </div>
                    {writingCoach.upgradedSample && (
                      <div className="ai-sample-quote">
                        參考高分寫法：“{writingCoach.upgradedSample}”
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= CLEAN SRS NEXT FOOTER ================= */}
        <footer className="focus-card-footer">
          {!attempted ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem 1rem',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '0.79rem', color: 'var(--text-muted)' }}>
                完成上方作答後自動解鎖記憶排程評分
              </span>
              <button
                type="button"
                className="text-link-subtle"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setAttempted(true)}
              >
                已口頭練過，直接評分下一題 →
              </button>
            </div>
          ) : (
            <div className="srs-rating-bar animate-in">
              <button
                type="button"
                className="srs-btn again"
                onClick={() => handleFinishWithRating('forgot')}
              >
                再練一次
                <span>稍後搶救</span>
              </button>
              <button
                type="button"
                className="srs-btn hard"
                onClick={() => handleFinishWithRating('hard')}
              >
                有點卡
                <span>縮短間隔</span>
              </button>
              <button
                type="button"
                className="srs-btn easy"
                onClick={() => handleFinishWithRating('easy')}
              >
                順暢 · 下一題 <ArrowRight size={15} />
              </button>
            </div>
          )}
        </footer>
      </article>
    </section>
  );
};
