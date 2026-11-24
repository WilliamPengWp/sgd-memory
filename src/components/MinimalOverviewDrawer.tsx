import React, { useState } from 'react';
import { X, RefreshCw, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DeckType,
  SrsCard,
  computeForgettingCurveSummary,
  estimateSkillReadiness,
} from '../utils/srs';
import { UnifiedQuestionBank } from '../utils/dailyPlanner';
import { AccentPreference } from '../utils/speech';
import { getRawLocalGeminiKey, setStoredGeminiKey } from '../utils/aiEngine';

interface MinimalOverviewDrawerProps {
  open: boolean;
  onClose: () => void;
  cardsMap: Record<string, SrsCard>;
  bank: UnifiedQuestionBank;
  syncingBank: boolean;
  onSyncPredictionsNow: () => void;
  onAddFocusedPack: (deck: DeckType, count: number) => void;
  onRebuildTodayPlan: () => void;
  onImportCustomWfd: (rawText: string) => number;
  accent: AccentPreference;
  onChangeAccent: (a: AccentPreference) => void;
  speechRate: number;
  onChangeSpeechRate: (r: number) => void;
}

export const MinimalOverviewDrawer: React.FC<MinimalOverviewDrawerProps> = ({
  open,
  onClose,
  cardsMap,
  bank,
  syncingBank,
  onSyncPredictionsNow,
  onAddFocusedPack,
  onRebuildTodayPlan,
  onImportCustomWfd,
  accent,
  onChangeAccent,
  speechRate,
  onChangeSpeechRate,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pasteBox, setPasteBox] = useState('');
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const [geminiKey, setGeminiKey] = useState(() => getRawLocalGeminiKey());
  const [keySavedMsg, setKeySavedMsg] = useState(false);

  if (!open) return null;

  const readiness = estimateSkillReadiness(cardsMap);
  const curve = computeForgettingCurveSummary(cardsMap);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel animate-slide-left" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>學習總覽與預測題庫</h2>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              目標：澳洲技術移民 Competent (55–60)
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-content">
          {/* 1. Weekly Prediction Auto-Sync Box */}
          <section className="drawer-section">
            <div className="drawer-section-title">本週預測題庫（自動更新）</div>
            <div className="prediction-status-card">
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{bank.weekLabel}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                共收錄 {bank.totalPredictionsCount} 題（WFD {bank.wfd.length} · RS {bank.rs.length} · SGD {bank.sgd.length} · RA {bank.ra.length} · 寫作 {bank.writing.length}）
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                雲端排程每週一、四自動抓取最新預測並寫入資料庫
                {bank.syncedAt ? ` · 上次同步 ${bank.syncedAt.slice(0, 10)}` : ''}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.38rem 0.75rem' }}
                  disabled={syncingBank}
                  onClick={onSyncPredictionsNow}
                >
                  <RefreshCw size={13} className={syncingBank ? 'spin' : ''} />
                  {syncingBank ? '正在同步最新預測…' : '立即更新預測題庫'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.78rem', padding: '0.38rem 0.65rem' }}
                  onClick={() => {
                    onRebuildTodayPlan();
                    onClose();
                  }}
                >
                  重新產生今日題單
                </button>
              </div>
            </div>
          </section>

          {/* 2. Ebbinghaus Retention & 4-Skill Readiness */}
          <section className="drawer-section">
            <div className="drawer-section-title">
              艾賓浩斯記憶保留率 · 平均 {curve.averageRetention}%
            </div>
            <div className="curve-mini-row">
              <div className="curve-stat">
                <strong>{curve.strongCount}</strong>
                <span>記憶穩固</span>
              </div>
              <div className="curve-stat">
                <strong>{curve.goldenCount}</strong>
                <span>黃金複習期</span>
              </div>
              <div className="curve-stat">
                <strong>{curve.fadingCount}</strong>
                <span>今日搶救</span>
              </div>
            </div>

            <div className="skills-list">
              {readiness.map((s) => {
                const pct = Math.min(100, Math.round((s.estimatedBand / 70) * 100));
                const passed = s.estimatedBand >= s.dhaMin;
                return (
                  <div key={s.skill} className="skill-row">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>{s.labelZh}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: passed ? 'var(--accent-jade)' : 'var(--text-secondary)' }}>
                        預估 {s.estimatedBand}（門檻 {s.dhaMin}）
                      </span>
                    </div>
                    <div className="skill-bar-track">
                      <div
                        className="skill-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: passed ? 'var(--accent-jade)' : 'var(--accent-amber)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Quick Add Specific Task Pack */}
          <section className="drawer-section">
            <div className="drawer-section-title">想針對單一題型加練？</div>
            <div className="quick-pack-grid">
              {(
                [
                  { deck: 'wfd' as DeckType, count: 5, label: '+5 題 WFD 聽寫' },
                  { deck: 'rs' as DeckType, count: 5, label: '+5 題 RS 重複' },
                  { deck: 'sgd' as DeckType, count: 3, label: '+3 題 SGD 討論' },
                  { deck: 'rts' as DeckType, count: 3, label: '+3 題 RTS 情境' },
                  { deck: 'fib' as DeckType, count: 5, label: '+5 題 FIB 搭配' },
                  { deck: 'writing' as DeckType, count: 1, label: '+1 題 寫作批改' },
                ] as const
              ).map((p) => (
                <button
                  key={p.deck}
                  type="button"
                  className="pack-pill"
                  onClick={() => {
                    onAddFocusedPack(p.deck, p.count);
                    onClose();
                  }}
                >
                  <Plus size={13} />
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* 4. Voice & Optional Advanced Settings */}
          <section className="drawer-section">
            <div className="drawer-section-title">發音與語速</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="select-pill"
                style={{ flex: 1 }}
                value={accent}
                onChange={(e) => onChangeAccent(e.target.value as AccentPreference)}
              >
                <option value="en-AU">🇦🇺 澳洲口音 (en-AU)</option>
                <option value="en-GB">🇬🇧 英國口音 (en-GB)</option>
                <option value="en-US">🇺🇸 美國口音 (en-US)</option>
              </select>
              <select
                className="select-pill"
                value={String(speechRate)}
                onChange={(e) => onChangeSpeechRate(Number(e.target.value))}
              >
                <option value="0.88">0.88x 慢速</option>
                <option value="1">1.0x 原速</option>
                <option value="1.12">1.12x 實戰</option>
              </select>
            </div>

            <button
              type="button"
              className="text-link-subtle"
              style={{ marginTop: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              進階：手動貼上螢火蟲機經 ／ 自訂 Gemini 金鑰
            </button>

            {showAdvanced && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    貼上螢火蟲／黑科技預測句（每行一句，自動去重加入排程）：
                  </div>
                  <textarea
                    className="text-area-clean"
                    rows={3}
                    placeholder="貼上英文預測句子…"
                    value={pasteBox}
                    onChange={(e) => setPasteBox(e.target.value)}
                  />
                  {pasteMsg && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--accent-jade)', marginTop: '0.25rem' }}>
                      {pasteMsg}
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '0.4rem', fontSize: '0.76rem', padding: '0.34rem 0.7rem' }}
                    onClick={() => {
                      if (!pasteBox.trim()) return;
                      const added = onImportCustomWfd(pasteBox);
                      setPasteBox('');
                      setPasteMsg(`✓ 已新增 ${added} 句自訂預測題`);
                    }}
                  >
                    匯入預測句
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    自訂 Gemini API Key（選填，系統已預設內建雲端 AI 評分）：
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="password"
                      className="text-input-clean"
                      style={{ padding: '0.42rem 0.65rem', fontSize: '0.8rem' }}
                      placeholder="AIzaSy...（可留空）"
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        setKeySavedMsg(false);
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        setStoredGeminiKey(geminiKey);
                        setKeySavedMsg(true);
                      }}
                    >
                      {keySavedMsg ? '已儲存' : '儲存'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};
