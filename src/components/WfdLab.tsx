import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Eye, Check, ChevronLeft, ChevronRight, Sparkles, Keyboard } from 'lucide-react';
import {
  WFD_QUESTIONS,
  buildFirstLetterHint,
  scoreWfdAttempt,
  WfdDiffToken,
} from '../data/wfdData';
import { SrsCard, Rating, isCardDue, makeCardKey } from '../utils/srs';
import { AccentPreference, speakEnglish } from '../utils/speech';

interface WfdLabProps {
  cardsMap: Record<string, SrsCard>;
  onRateCard: (itemId: number, rating: Rating) => void;
  accent: AccentPreference;
  speechRate: number;
}

type WfdPracticeMode = 'dictation' | 'first-letter' | 'flashcard';

export const WfdLab: React.FC<WfdLabProps> = ({
  cardsMap,
  onRateCard,
  accent,
  speechRate,
}) => {
  const [filterMode, setFilterMode] = useState<'due' | 'all'>('due');
  const [practiceMode, setPracticeMode] = useState<WfdPracticeMode>('dictation');
  const [index, setIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [firstLetterScratch, setFirstLetterScratch] = useState('');
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const pool = WFD_QUESTIONS.filter((q) => {
    if (filterMode === 'all') return true;
    const card = cardsMap[makeCardKey('wfd', q.id)];
    return !card || isCardDue(card);
  });

  useEffect(() => {
    if (index >= pool.length && pool.length > 0) {
      setIndex(0);
    }
  }, [pool.length, index]);

  const current = pool[index];

  const resetCardState = useCallback(() => {
    setTypedText('');
    setFirstLetterScratch('');
    setChecked(false);
    setShowHint(false);
  }, []);

  useEffect(() => {
    resetCardState();
  }, [current?.id, practiceMode, resetCardState]);

  const handlePlay = useCallback(() => {
    if (!current) return;
    setIsPlaying(true);
    speakEnglish(current.text, accent, speechRate, () => setIsPlaying(false));
  }, [current, accent, speechRate]);

  const handleRate = (rating: Rating) => {
    if (!current) return;
    onRateCard(current.id, rating);
    resetCardState();
    if (filterMode === 'all' && pool.length > 1) {
      setIndex((prev) => (prev + 1) % pool.length);
    }
  };

  if (!current) {
    return (
      <div className="surface-card animate-in" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem' }}>今日到期的 WFD 聽寫卡已全部完成！</h2>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          SM-2 演算法已將熟練句子排入未來複習日程。你也可以切換至「全部 40 題庫」自由刷題。
        </p>
        <button
          id="btn-wfd-switch-all"
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setFilterMode('all');
            setIndex(0);
          }}
        >
          切換至全部 40 句題庫繼續練習
        </button>
      </div>
    );
  }

  const cardState = cardsMap[makeCardKey('wfd', current.id)];
  const diffResult = checked ? scoreWfdAttempt(current.text, typedText) : null;
  const firstLetterHint = buildFirstLetterHint(current.text);

  return (
    <div className="animate-in" style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Mode & Filter Controls */}
      <div className="section-header">
        <div>
          <span className="eyebrow">TIER S1 ENGINE · LISTENING + WRITING 雙科命脈</span>
          <h2 className="section-title">WFD 聽寫句子記憶艙</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            id="btn-wfd-filter-due"
            type="button"
            className={`btn ${filterMode === 'due' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.42rem 0.8rem', fontSize: '0.78rem' }}
            onClick={() => {
              setFilterMode('due');
              setIndex(0);
            }}
          >
            今日到期 ({WFD_QUESTIONS.filter((q) => isCardDue(cardsMap[makeCardKey('wfd', q.id)])).length})
          </button>
          <button
            id="btn-wfd-filter-all"
            type="button"
            className={`btn ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.42rem 0.8rem', fontSize: '0.78rem' }}
            onClick={() => {
              setFilterMode('all');
              setIndex(0);
            }}
          >
            全部題庫 ({WFD_QUESTIONS.length})
          </button>
        </div>
      </div>

      {/* Practice Mode Selector */}
      <div className="subtab-bar">
        <button
          id="btn-wfd-mode-dictation"
          type="button"
          className={`subtab-btn ${practiceMode === 'dictation' ? 'active' : ''}`}
          onClick={() => setPracticeMode('dictation')}
        >
          <Keyboard size={15} />
          實戰盲聽打字（考場計分比對）
        </button>
        <button
          id="btn-wfd-mode-firstletter"
          type="button"
          className={`subtab-btn ${practiceMode === 'first-letter' ? 'active' : ''}`}
          onClick={() => setPracticeMode('first-letter')}
        >
          <Sparkles size={15} />
          首字母速記法（瞬間記憶訓練）
        </button>
        <button
          id="btn-wfd-mode-flashcard"
          type="button"
          className={`subtab-btn ${practiceMode === 'flashcard' ? 'active' : ''}`}
          onClick={() => setPracticeMode('flashcard')}
        >
          <Eye size={15} />
          通勤閃卡模式（免打字快速刷）
        </button>
      </div>

      {/* Main Card */}
      <div className="surface-card" style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="tag tag-ocean">WFD #{current.id}</span>
            <span className="tag tag-neutral">{current.category}</span>
            <span className="tag tag-neutral">{current.text.split(/\s+/).length} words</span>
            {cardState && cardState.repetitions > 0 && (
              <span className="tag tag-jade">間隔 {cardState.interval} 天</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              id="btn-wfd-prev"
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((prev) => (prev - 1 + pool.length) % pool.length)}
              disabled={pool.length <= 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {index + 1} / {pool.length}
            </span>
            <button
              id="btn-wfd-next"
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((prev) => (prev + 1) % pool.length)}
              disabled={pool.length <= 1}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Audio Trigger Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            marginBottom: '1.15rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              id="btn-wfd-play-audio"
              type="button"
              className="btn btn-primary"
              onClick={handlePlay}
            >
              <Volume2 size={18} />
              {isPlaying ? '播放中…' : '播放句子音檔'}
            </button>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                先閉眼聽意群並速記每個字首字母（如 <code>S m s t a b t d o F</code>）
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                考場音檔只播 1 次 · 可在右上角切換澳洲 / 英國 / 美國口音與語速
              </div>
            </div>
          </div>

          {practiceMode !== 'flashcard' && (
            <button
              id="btn-wfd-toggle-hint"
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.42rem 0.75rem' }}
              onClick={() => setShowHint((v) => !v)}
            >
              {showHint ? '隱藏首字母骨架' : '顯示首字母提示'}
            </button>
          )}
        </div>

        {/* Optional First-letter Hint Banner */}
        {(showHint || practiceMode === 'first-letter') && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'hsla(197, 82%, 54%, 0.08)',
              border: '1px solid hsla(197, 82%, 54%, 0.22)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '0.73rem', color: 'hsl(197, 88%, 70%)', marginBottom: '0.25rem' }}>
              首字母記憶錨點（考場可在擦寫板先秒寫首字母，再回頭補全單字）：
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', letterSpacing: '0.03em' }}>
              {firstLetterHint}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              語意提示：{current.textZh}
            </div>
          </div>
        )}

        {/* Mode 1 & 2: Dictation Input & Partial Credit Diff */}
        {practiceMode !== 'flashcard' && (
          <div>
            {practiceMode === 'first-letter' && (
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  id="input-wfd-scratch"
                  type="text"
                  className="text-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                  placeholder="步驟 1（選填）：邊聽邊在這裡快速敲下每個單字的首字母筆記…"
                  value={firstLetterScratch}
                  onChange={(e) => setFirstLetterScratch(e.target.value)}
                />
              </div>
            )}

            <textarea
              id="textarea-wfd-answer"
              className="text-area"
              style={{ minHeight: '88px', fontFamily: 'var(--font-sans)' }}
              placeholder="輸入你聽到的完整英文句子（注意句首大寫與句尾句號 . ）…"
              value={typedText}
              onChange={(e) => {
                setTypedText(e.target.value);
                if (checked) setChecked(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  setChecked(true);
                }
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                按 <span className="kbd">Ctrl + Enter</span> 或點擊右側按鈕對答案
              </span>
              <button
                id="btn-wfd-check"
                type="button"
                className="btn btn-primary"
                onClick={() => setChecked(true)}
              >
                <Check size={16} />
                批改並檢視計分細節
              </button>
            </div>

            {checked && diffResult && (
              <div
                className="animate-in"
                style={{
                  marginTop: '1.25rem',
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <span
                      className={
                        diffResult.percentage >= 85
                          ? 'tag tag-jade'
                          : diffResult.percentage >= 60
                            ? 'tag tag-amber'
                            : 'tag tag-coral'
                      }
                      style={{ fontSize: '0.84rem' }}
                    >
                      命中 {diffResult.matchedCount} / {diffResult.totalCount} 字 ({diffResult.percentage}%)
                    </span>
                    <span className={diffResult.capitalOk ? 'tag tag-jade' : 'tag tag-coral'}>
                      {diffResult.capitalOk ? '✓ 句首大寫' : '✗ 句首未大寫'}
                    </span>
                    <span className={diffResult.periodOk ? 'tag tag-jade' : 'tag tag-coral'}>
                      {diffResult.periodOk ? '✓ 句尾句號' : '✗ 漏打句尾句號 .'}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  {diffResult.tokens.map((tok: WfdDiffToken, i: number) => (
                    <span key={`${tok.word}-${i}`} className={`diff-word ${tok.status}`}>
                      {tok.word}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  標準答案：{current.text}
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  中文翻譯：{current.textZh}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'hsl(38, 95%, 68%)',
                    background: 'var(--accent-amber-soft)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  💡 考場防錯筆記：{current.trapNote}
                </div>

                <div className="srs-rate-grid">
                  <button
                    id="btn-wfd-rate-forgot"
                    type="button"
                    className="btn-rate forgot"
                    onClick={() => handleRate('forgot')}
                  >
                    <span>Forgot 重背</span>
                    <small>今日稍後重現</small>
                  </button>
                  <button
                    id="btn-wfd-rate-hard"
                    type="button"
                    className="btn-rate hard"
                    onClick={() => handleRate('hard')}
                  >
                    <span>Hard 有漏字</span>
                    <small>縮短複習間隔</small>
                  </button>
                  <button
                    id="btn-wfd-rate-easy"
                    type="button"
                    className="btn-rate easy"
                    onClick={() => handleRate('easy')}
                  >
                    <span>Easy 全對秒殺</span>
                    <small>拉長 SM-2 間隔</small>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Commute Flashcard Mode */}
        {practiceMode === 'flashcard' && (
          <div>
            {!checked ? (
              <button
                id="btn-wfd-reveal-card"
                type="button"
                onClick={() => setChecked(true)}
                style={{
                  width: '100%',
                  padding: '2.4rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px dashed var(--border-strong)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  點擊翻面檢視完整英文與拼寫陷阱
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  中文語意提示：{current.textZh}
                </div>
              </button>
            ) : (
              <div
                className="animate-in"
                style={{
                  padding: '1.35rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <p style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700 }}>{current.text}</p>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {current.textZh}
                </p>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'hsl(38, 95%, 68%)',
                    background: 'var(--accent-amber-soft)',
                    padding: '0.55rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  💡 拼寫與單複數陷阱：{current.trapNote}
                </div>

                <div className="srs-rate-grid">
                  <button
                    id="btn-wfd-flash-forgot"
                    type="button"
                    className="btn-rate forgot"
                    onClick={() => handleRate('forgot')}
                  >
                    <span>Forgot 陌生</span>
                    <small>今日重刷</small>
                  </button>
                  <button
                    id="btn-wfd-flash-hard"
                    type="button"
                    className="btn-rate hard"
                    onClick={() => handleRate('hard')}
                  >
                    <span>Hard 需強化</span>
                    <small>短期複習</small>
                  </button>
                  <button
                    id="btn-wfd-flash-easy"
                    type="button"
                    className="btn-rate easy"
                    onClick={() => handleRate('easy')}
                  >
                    <span>Easy 熟悉</span>
                    <small>推進間隔</small>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
