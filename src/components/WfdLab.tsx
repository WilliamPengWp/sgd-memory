import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Volume2,
  Check,
  ChevronLeft,
  ChevronRight,
  Blocks,
  Crosshair,
  Keyboard,
  Flame,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import {
  WfdItem,
  mergeAllWfdQuestions,
  buildFirstLetterHint,
  buildWordBricks,
  buildSniperCloze,
  scoreWfdAttempt,
  WfdDiffToken,
  WordBrickTile,
} from '../data/wfdData';
import {
  SrsCard,
  Rating,
  CustomImportedWfd,
  isCardDue,
  makeCardKey,
  computeCardRetention,
} from '../utils/srs';
import { AccentPreference, speakEnglish } from '../utils/speech';
import { playGameSfx } from '../utils/gamification';

interface WfdLabProps {
  cardsMap: Record<string, SrsCard>;
  customWfd: CustomImportedWfd[];
  onRateCard: (itemId: number, rating: Rating) => void;
  onEarnXp: (xp: number, combo?: number) => void;
  onOpenFireflyModal: () => void;
  accent: AccentPreference;
  speechRate: number;
  soundEnabled: boolean;
}

type WfdGameMode = 'bricks' | 'cloze' | 'dictation';

export const WfdLab: React.FC<WfdLabProps> = ({
  cardsMap,
  customWfd,
  onRateCard,
  onEarnXp,
  onOpenFireflyModal,
  accent,
  speechRate,
  soundEnabled,
}) => {
  const allQuestions = useMemo(() => mergeAllWfdQuestions(customWfd), [customWfd]);

  const [filterTag, setFilterTag] = useState<'DUE' | 'ALL' | 'NEW11' | 'FIREFLY' | 'CUSTOM'>('DUE');
  const [gameMode, setGameMode] = useState<WfdGameMode>('bricks');
  const [index, setIndex] = useState(0);
  const [combo, setCombo] = useState(0);

  // Word Bricks Game State
  const [brickBoard, setBrickBoard] = useState<{
    targetTokens: string[];
    shuffledPool: WordBrickTile[];
  }>({ targetTokens: [], shuffledPool: [] });
  const [placedUids, setPlacedUids] = useState<string[]>([]);
  const [wrongUid, setWrongUid] = useState<string | null>(null);
  const [brickMistakes, setBrickMistakes] = useState(0);

  // Sniper Cloze State
  const [clozeInputs, setClozeInputs] = useState<Record<number, string>>({});
  const [clozeChecked, setClozeChecked] = useState(false);

  // Boss Dictation State
  const [typedText, setTypedText] = useState('');
  const [dictChecked, setDictChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const pool: WfdItem[] = useMemo(() => {
    return allQuestions.filter((q) => {
      if (filterTag === 'DUE') return isCardDue(cardsMap[makeCardKey('wfd', q.id)]);
      if (filterTag === 'NEW11') return q.freqTag === '🔥 11月新預測';
      if (filterTag === 'FIREFLY') return q.freqTag === '⚡ 螢火蟲超高頻';
      if (filterTag === 'CUSTOM') return q.freqTag === '📥 自訂機經';
      return true;
    });
  }, [allQuestions, filterTag, cardsMap]);

  useEffect(() => {
    if (index >= pool.length && pool.length > 0) {
      setIndex(0);
    }
  }, [pool.length, index]);

  const current = pool[index];

  const initQuestion = useCallback(
    (item?: WfdItem) => {
      if (!item) return;
      setBrickBoard(buildWordBricks(item));
      setPlacedUids([]);
      setWrongUid(null);
      setBrickMistakes(0);
      setClozeInputs({});
      setClozeChecked(false);
      setTypedText('');
      setDictChecked(false);
      setShowHint(false);
    },
    []
  );

  useEffect(() => {
    initQuestion(current);
  }, [current?.id, gameMode, initQuestion]);

  const handlePlay = useCallback(() => {
    if (!current) return;
    setIsPlaying(true);
    speakEnglish(current.text, accent, speechRate, () => setIsPlaying(false));
  }, [current, accent, speechRate]);

  // Tap a word brick in order!
  const handleTapBrick = (tile: WordBrickTile) => {
    const nextTargetIdx = placedUids.length;
    const expectedWord = brickBoard.targetTokens[nextTargetIdx];
    if (!expectedWord) return;

    if (tile.word.toLowerCase() === expectedWord.toLowerCase()) {
      const nextPlaced = [...placedUids, tile.uid];
      setPlacedUids(nextPlaced);
      setWrongUid(null);

      if (nextPlaced.length === brickBoard.targetTokens.length) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        playGameSfx('win', soundEnabled);
        onEarnXp(18 + Math.min(20, nextCombo * 3), nextCombo);
      } else {
        playGameSfx('tap', soundEnabled);
      }
    } else {
      setWrongUid(tile.uid);
      setBrickMistakes((m) => m + 1);
      setCombo(0);
      playGameSfx('wrong', soundEnabled);
      window.setTimeout(() => setWrongUid(null), 450);
    }
  };

  const handleRateAndNext = (rating: Rating) => {
    if (!current) return;
    onRateCard(current.id, rating);
    if (rating === 'easy') onEarnXp(10, combo + 1);
    if (filterTag !== 'DUE' && pool.length > 1) {
      setIndex((p) => (p + 1) % pool.length);
    } else {
      initQuestion(current);
    }
  };

  if (!current) {
    return (
      <div className="surface-card animate-in" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem' }}>此篩選分類目前已全數刷完！</h2>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          你可以切換至「全部預測句庫 ({allQuestions.length} 句)」或點右上角匯入更多螢火蟲每週新題。
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFilterTag('ALL');
              setIndex(0);
            }}
          >
            切換全部 {allQuestions.length} 句題庫
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenFireflyModal}>
            <PlusCircle size={15} />
            貼上匯入螢火蟲新預測
          </button>
        </div>
      </div>
    );
  }

  const cardState = cardsMap[makeCardKey('wfd', current.id)];
  const retention = cardState ? computeCardRetention(cardState) : 0;
  const bricksCompleted =
    brickBoard.targetTokens.length > 0 && placedUids.length === brickBoard.targetTokens.length;
  const clozeSegments = buildSniperCloze(current.text);
  const diffResult = dictChecked ? scoreWfdAttempt(current.text, typedText) : null;

  return (
    <div className="animate-in" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header & Deck Filter */}
      <div className="section-header">
        <div>
          <span className="eyebrow">GAMIFIED WFD PLAYGROUND · 拒絕死背枯燥！三階闖關鎖死長期記憶</span>
          <h2 className="section-title">WFD 預測機經遊樂場（內建 {allQuestions.length} 句高頻真題）</h2>
        </div>

        <button
          id="btn-wfd-import-firefly"
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
          onClick={onOpenFireflyModal}
        >
          <PlusCircle size={14} color="var(--accent-jade)" />
          匯入螢火蟲／每週新題
        </button>
      </div>

      {/* Category Filter Strip */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.95rem' }}>
        {[
          { id: 'DUE', label: `⏳ 待複習/新題 (${allQuestions.filter((q) => isCardDue(cardsMap[makeCardKey('wfd', q.id)])).length})` },
          { id: 'NEW11', label: '🔥 2026/11 最新週預測' },
          { id: 'FIREFLY', label: '⚡ 螢火蟲超高頻必考' },
          { id: 'ALL', label: `📚 全部 (${allQuestions.length})` },
          ...(customWfd.length > 0 ? [{ id: 'CUSTOM', label: `📥 自訂匯入 (${customWfd.length})` }] : []),
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={`btn ${filterTag === f.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.36rem 0.78rem', fontSize: '0.76rem' }}
            onClick={() => {
              setFilterTag(f.id as typeof filterTag);
              setIndex(0);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3 Game Modes */}
      <div className="subtab-bar">
        <button
          id="btn-wfd-game-bricks"
          type="button"
          className={`subtab-btn ${gameMode === 'bricks' ? 'active' : ''}`}
          onClick={() => setGameMode('bricks')}
        >
          <Blocks size={15} />
          Stage 1 · 聽音拼積木（單手爽刷零壓力）
        </button>
        <button
          id="btn-wfd-game-cloze"
          type="button"
          className={`subtab-btn ${gameMode === 'cloze' ? 'active' : ''}`}
          onClick={() => setGameMode('cloze')}
        >
          <Crosshair size={15} />
          Stage 2 · 魔王詞狙擊（專殺難拼字）
        </button>
        <button
          id="btn-wfd-game-dictation"
          type="button"
          className={`subtab-btn ${gameMode === 'dictation' ? 'active' : ''}`}
          onClick={() => setGameMode('dictation')}
        >
          <Keyboard size={15} />
          Stage 3 · 考場盲打 Boss 戰
        </button>
      </div>

      <div className="surface-card" style={{ padding: '1.45rem' }}>
        {/* Card Metadata + Retention + Combo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span className="tag tag-amber">{current.freqTag}</span>
            <span className="tag tag-neutral">#{current.id}</span>
            {retention > 0 ? (
              <span className={retention >= 75 ? 'tag tag-jade' : 'tag tag-coral'}>
                🧠 記憶留存 {retention}%
              </span>
            ) : (
              <span className="tag tag-ocean">✨ 新解鎖題</span>
            )}
            {combo >= 2 && (
              <span className="tag tag-coral">
                <Flame size={13} />
                {combo} 連擊 Combo!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((p) => (p - 1 + pool.length) % pool.length)}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {index + 1} / {pool.length}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((p) => (p + 1) % pool.length)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Audio Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.9rem',
            padding: '1rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            marginBottom: '0.95rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button id="btn-wfd-play" type="button" className="btn btn-primary" onClick={handlePlay}>
              <Volume2 size={18} />
              {isPlaying ? '播放中…' : '點此聽考場發音'}
            </button>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{current.textZh}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                共 {current.text.split(/\s+/).length} 個字 · 內含 2 個單複數／同音陷阱積木！
              </div>
            </div>
          </div>

          {gameMode === 'bricks' && placedUids.length > 0 && !bricksCompleted && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.76rem' }}
              onClick={() => setPlacedUids([])}
            >
              <RotateCcw size={13} />
              重排積木
            </button>
          )}
        </div>

        {/* Funny Visual Mnemonic Story Banner */}
        <div className="mnemonic-banner">
          <strong>🤣 腦洞秒記畫面：</strong>
          {current.mnemonic}
        </div>

        {/* GAME MODE 1: WORD BRICKS COMBO */}
        {gameMode === 'bricks' && (
          <div>
            <div className="brick-answer-zone">
              {placedUids.length === 0 && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  👆 聽完發音後，依序點擊下方單字積木組出完整句子（小心避開 2 個干擾陷阱字！）
                </span>
              )}
              {placedUids.map((uid) => {
                const tile = brickBoard.shuffledPool.find((t) => t.uid === uid);
                if (!tile) return null;
                return (
                  <span key={uid} className="word-brick placed">
                    {tile.word}
                  </span>
                );
              })}
              {bricksCompleted && <span style={{ fontWeight: 800, color: 'var(--accent-jade)' }}>.</span>}
            </div>

            {!bricksCompleted ? (
              <div className="brick-pool-zone">
                {brickBoard.shuffledPool.map((tile) => {
                  const used = placedUids.includes(tile.uid);
                  if (used) return null;
                  const isShaking = wrongUid === tile.uid;
                  return (
                    <button
                      key={tile.uid}
                      type="button"
                      className={`word-brick ${isShaking ? 'shake' : ''}`}
                      onClick={() => handleTapBrick(tile)}
                    >
                      {tile.word}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                className="animate-in"
                style={{
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid hsla(162,68%,45%,0.32)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'hsl(162,76%,66%)', marginBottom: '0.3rem' }}>
                  🎉 完美拼出整句！（失誤 {brickMistakes} 次）· 寫入艾賓浩斯記憶曲線：
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {current.text}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                  ⚠️ 考場陷阱提醒：{current.trapNote}
                </div>

                <div className="srs-rate-grid">
                  <button
                    type="button"
                    className="btn-rate forgot"
                    onClick={() => handleRateAndNext('forgot')}
                  >
                    <span>Forgot 還不熟</span>
                    <small>幾小時後重現</small>
                  </button>
                  <button
                    type="button"
                    className="btn-rate hard"
                    onClick={() => handleRateAndNext('hard')}
                  >
                    <span>Hard 剛才有卡</span>
                    <small>明日黃金點複習</small>
                  </button>
                  <button
                    type="button"
                    className="btn-rate easy"
                    onClick={() => handleRateAndNext('easy')}
                  >
                    <span>Easy 秒殺 (+XP)</span>
                    <small>推進長期間隔</small>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GAME MODE 2: SNIPER CLOZE (3 Key Academic Words) */}
        {gameMode === 'cloze' && (
          <div>
            <div
              style={{
                padding: '1.2rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                lineHeight: 2.2,
                fontSize: '1.02rem',
                marginBottom: '0.9rem',
              }}
            >
              {clozeSegments.map((seg) => {
                if (!seg.isBlank) {
                  return <span key={seg.index}>{seg.rawWord} </span>;
                }
                const val = clozeInputs[seg.index] || '';
                const isHit = val.trim().toLowerCase() === seg.cleanAnswer.toLowerCase();
                return (
                  <span key={seg.index} style={{ display: 'inline-block', margin: '0 0.25rem' }}>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setClozeInputs((prev) => ({ ...prev, [seg.index]: e.target.value }))
                      }
                      placeholder={`${seg.cleanAnswer[0]}___ (${seg.cleanAnswer.length})`}
                      style={{
                        width: `${Math.max(95, seg.cleanAnswer.length * 11)}px`,
                        padding: '0.22rem 0.5rem',
                        borderRadius: '6px',
                        background: 'var(--bg-surface-elevated)',
                        border: `1px solid ${
                          !clozeChecked
                            ? 'var(--border-strong)'
                            : isHit
                              ? 'var(--accent-jade)'
                              : 'var(--accent-coral)'
                        }`,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                      }}
                    />
                  </span>
                );
              })}
            </div>

            {!clozeChecked ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setClozeChecked(true);
                  playGameSfx('combo', soundEnabled);
                  onEarnXp(15, combo + 1);
                }}
              >
                <Check size={15} />
                核對魔王詞拼寫
              </button>
            ) : (
              <div
                className="animate-in"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>正確全句：{current.text}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>💡 {current.trapNote}</div>
                <div className="srs-rate-grid">
                  <button type="button" className="btn-rate forgot" onClick={() => handleRateAndNext('forgot')}>
                    <span>Forgot 拼錯</span>
                    <small>加強記憶</small>
                  </button>
                  <button type="button" className="btn-rate hard" onClick={() => handleRateAndNext('hard')}>
                    <span>Hard 小漏詞尾</span>
                    <small>短期複習</small>
                  </button>
                  <button type="button" className="btn-rate easy" onClick={() => handleRateAndNext('easy')}>
                    <span>Easy 全對</span>
                    <small>拉長間隔</small>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GAME MODE 3: FULL EXAM BOSS DICTATION */}
        {gameMode === 'dictation' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.76rem' }}
                onClick={() => setShowHint((v) => !v)}
              >
                {showHint ? '隱藏首字母骨架' : '偷看首字母骨架'}
              </button>
            </div>

            {showHint && (
              <div
                style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.86rem',
                  marginBottom: '0.75rem',
                }}
              >
                {buildFirstLetterHint(current.text)}
              </div>
            )}

            <textarea
              className="text-area"
              style={{ minHeight: '86px' }}
              placeholder="Boss 戰：盲聽打出完整英文句子（記得句首大寫＋句尾句號）…"
              value={typedText}
              onChange={(e) => {
                setTypedText(e.target.value);
                if (dictChecked) setDictChecked(false);
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setDictChecked(true);
                  playGameSfx('win', soundEnabled);
                  onEarnXp(25, combo + 1);
                }}
              >
                <Check size={15} />
                提交考場計分比對
              </button>
            </div>

            {dictChecked && diffResult && (
              <div
                className="animate-in"
                style={{
                  marginTop: '1rem',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  <span className={diffResult.percentage >= 85 ? 'tag tag-jade' : 'tag tag-amber'}>
                    命中 {diffResult.matchedCount}/{diffResult.totalCount} ({diffResult.percentage}%)
                  </span>
                  <span className={diffResult.capitalOk ? 'tag tag-jade' : 'tag tag-coral'}>
                    {diffResult.capitalOk ? '✓ 大寫正確' : '✗ 句首未大寫'}
                  </span>
                  <span className={diffResult.periodOk ? 'tag tag-jade' : 'tag tag-coral'}>
                    {diffResult.periodOk ? '✓ 標點正確' : '✗ 漏句尾句號'}
                  </span>
                </div>

                <div style={{ marginBottom: '0.6rem' }}>
                  {diffResult.tokens.map((tok: WfdDiffToken, i: number) => (
                    <span key={i} className={`diff-word ${tok.status}`}>
                      {tok.word}
                    </span>
                  ))}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>標準答案：{current.text}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginTop: '0.3rem' }}>
                  💡 {current.trapNote}
                </div>

                <div className="srs-rate-grid">
                  <button type="button" className="btn-rate forgot" onClick={() => handleRateAndNext('forgot')}>
                    <span>Forgot 重練</span>
                    <small>今日重現</small>
                  </button>
                  <button type="button" className="btn-rate hard" onClick={() => handleRateAndNext('hard')}>
                    <span>Hard 小瑕疵</span>
                    <small>短期複習</small>
                  </button>
                  <button type="button" className="btn-rate easy" onClick={() => handleRateAndNext('easy')}>
                    <span>Easy 滿分通過</span>
                    <small>推進長期記憶</small>
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
