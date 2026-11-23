import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Flame,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  SrsCard,
  ReviewHistoryEntry,
  DeckType,
  computeDeckStats,
  estimateSkillReadiness,
  getRecentActivity,
  getUpcomingForecast,
  exportStudioBackup,
  importStudioBackup,
} from '../utils/srs';

export type NavTab = 'mission' | 'wfd' | 'speaking' | 'readwrite' | 'blueprint';
export type SpeakingSubTab = 'sgd' | 'rs' | 'rts' | 'di' | 'ra';
export type ReadWriteSubTab = 'fib' | 'writing';

interface MissionDashboardProps {
  cardsMap: Record<string, SrsCard>;
  history: ReviewHistoryEntry[];
  onNavigate: (tab: NavTab, subTab?: SpeakingSubTab | ReadWriteSubTab) => void;
  onReloadStorage: () => void;
  onResetAll: () => void;
}

export const MissionDashboard: React.FC<MissionDashboardProps> = ({
  cardsMap,
  history,
  onNavigate,
  onReloadStorage,
  onResetAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const wfdStats = computeDeckStats(cardsMap, 'wfd');
  const sgdStats = computeDeckStats(cardsMap, 'sgd');
  const rsStats = computeDeckStats(cardsMap, 'rs');
  const rtsStats = computeDeckStats(cardsMap, 'rts');
  const diStats = computeDeckStats(cardsMap, 'di');
  const raStats = computeDeckStats(cardsMap, 'ra');
  const fibStats = computeDeckStats(cardsMap, 'fib');

  const skills = estimateSkillReadiness(cardsMap);
  const activity = getRecentActivity(history, 14);
  const forecast = getUpcomingForecast(cardsMap, 7);

  const maxAct = Math.max(...activity.map((d) => d.count), 1);
  const maxForecast = Math.max(...forecast.map((d) => d.count), 1);
  const todayReviews = activity[activity.length - 1]?.count ?? 0;

  const sprintModules: Array<{
    key: DeckType | 'writing';
    code: string;
    title: string;
    subtitle: string;
    weightTag: string;
    due: number;
    reviewed: number;
    total: number;
    targetMin: string;
    onGo: () => void;
  }> = [
    {
      key: 'wfd',
      code: 'WFD',
      title: '聽寫句子記憶艙',
      subtitle: '首字母盲打＋高頻預測 40 句（全場最高投報）',
      weightTag: 'L + W 核武',
      due: wfdStats.due,
      reviewed: wfdStats.reviewed,
      total: wfdStats.total,
      targetMin: '20 min',
      onGo: () => onNavigate('wfd'),
    },
    {
      key: 'rs',
      code: 'RS',
      title: '復述句子（半句意群減負法）',
      subtitle: '穩抓前半 50%–60% 意群零猶豫，雙拿口說與聽力',
      weightTag: 'S + L 雙供分',
      due: rsStats.due,
      reviewed: rsStats.reviewed,
      total: rsStats.total,
      targetMin: '15 min',
      onGo: () => onNavigate('speaking', 'rs'),
    },
    {
      key: 'sgd',
      code: 'SGD',
      title: '原版 41 題三人討論圖音卡',
      subtitle: '已無損保留你的 AI 記憶圖、三位講者音檔與複習紀錄',
      weightTag: 'S + L 2025新題',
      due: sgdStats.due,
      reviewed: sgdStats.reviewed,
      total: sgdStats.total,
      targetMin: '15 min',
      onGo: () => onNavigate('speaking', 'sgd'),
    },
    {
      key: 'fib',
      code: 'FIB',
      title: '閱讀雙填空黃金固定搭配',
      subtitle: '新制 RA 不再救閱讀，靠 20 組高頻學術搭配穩過 R48→58',
      weightTag: 'R 佔比 60%',
      due: fibStats.due,
      reviewed: fibStats.reviewed,
      total: fibStats.total,
      targetMin: '12 min',
      onGo: () => onNavigate('readwrite', 'fib'),
    },
    {
      key: 'rts',
      code: 'RTS / DI / RA',
      title: '口說防雙審骨架與斷句實戰',
      subtitle: '第一人稱情境對話＋SVG 圖表數據骨架＋意群斜線朗讀',
      weightTag: 'S 門檻 54 最高',
      due: rtsStats.due + diStats.due + raStats.due,
      reviewed: rtsStats.reviewed + diStats.reviewed + raStats.reviewed,
      total: rtsStats.total + diStats.total + raStats.total,
      targetMin: '10 min',
      onGo: () => onNavigate('speaking', 'rts'),
    },
    {
      key: 'writing',
      code: 'SWT / WE / SST',
      title: '寫作零失誤防呆檢核沙盒',
      subtitle: '新制寫作僅 7–8 題供分！即時檢查唯一句號、字數與拼寫陷阱',
      weightTag: 'W 門檻 51 保底',
      due: 1,
      reviewed: 0,
      total: 4,
      targetMin: '10 min',
      onGo: () => onNavigate('readwrite', 'writing'),
    },
  ];

  const handleExport = () => {
    const json = exportStudioBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pte60-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('已下載進度備份 JSON（可在手機與電腦間同步匯入）');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importStudioBackup(String(reader.result || ''));
      if (ok) {
        onReloadStorage();
        setBackupMsg('進度匯入成功！');
      } else {
        setBackupMsg('備份檔案格式無效，請確認選擇正確的 JSON 檔案。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
      {/* Hero Strategy Strip */}
      <section className="surface-card" style={{ padding: '1.4rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem' }}>
              <span className="tag tag-jade">
                <ShieldCheck size={13} />
                澳洲技術移民 Competent English (2025/8/7 新制)
              </span>
              <span className="tag tag-neutral">ACS 軟體職評免英文</span>
            </div>
            <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
              鎖定 10 項高投報題型，穩拿 58–60 分安全過線
            </h1>
            <p style={{ margin: 0, fontSize: '0.87rem', color: 'var(--text-secondary)' }}>
              官方最低門檻為 <strong>L47 / R48 / W51 / S54</strong>。已為你過濾掉 9 項低投報選擇與排序題，將平日
              75 分鐘集中在 <strong>WFD、RS、原版 41 題 SGD、閱讀雙 FIB 與寫作防呆骨架</strong>。
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button
              id="btn-hero-start-sprint"
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (wfdStats.due > 0) onNavigate('wfd');
                else if (sgdStats.due > 0) onNavigate('speaking', 'sgd');
                else onNavigate('speaking', 'rs');
              }}
            >
              <Flame size={16} />
              啟動今日最高權重複習
              <ArrowRight size={15} />
            </button>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              今日已完成 {todayReviews} 次記憶評分
            </span>
          </div>
        </div>

        {/* 4-Skill Competent Threshold Bars */}
        <div className="grid-4" style={{ marginTop: '1.35rem' }}>
          {skills.map((sk) => {
            const pct = Math.min(100, Math.max(12, Math.round(((sk.estimatedBand - 30) / 35) * 100)));
            const minMarkerPct = Math.round(((sk.dhaMin - 30) / 35) * 100);
            const passed = sk.estimatedBand >= sk.dhaMin;
            const safe = sk.estimatedBand >= sk.safeTarget;

            return (
              <div
                key={sk.skill}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{sk.labelZh}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: safe
                        ? 'hsl(162, 76%, 62%)'
                        : passed
                          ? 'var(--accent-amber)'
                          : 'var(--text-primary)',
                    }}
                  >
                    ~{sk.estimatedBand}
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    height: '8px',
                    background: 'hsla(200,20%,88%,0.08)',
                    borderRadius: '999px',
                    margin: '0.55rem 0 0.45rem',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: safe ? 'var(--accent-jade)' : 'var(--accent-ocean)',
                      transition: 'width 0.35s ease',
                    }}
                  />
                  {/* DHA Competent Floor Marker */}
                  <div
                    title={`移民局最低門檻 ${sk.dhaMin} 分`}
                    style={{
                      position: 'absolute',
                      left: `${minMarkerPct}%`,
                      top: '-3px',
                      bottom: '-3px',
                      width: '2px',
                      background: 'var(--accent-amber)',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>門檻 {sk.dhaMin}</span>
                  <span>安全線 {sk.safeTarget}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {sk.drivers}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Split: Left = Daily 75m Task Queue, Right = SRS Analytics & Backup */}
      <div className="dashboard-split">
        <section className="surface-card">
          <div className="section-header">
            <div>
              <span className="eyebrow">DAILY ENGINEER WORKFLOW · 平日 60–90 分鐘</span>
              <h2 className="section-title">今日高投報備考佇列（依新制供分權重排序）</h2>
            </div>
            <button
              id="btn-view-22-matrix"
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.78rem' }}
              onClick={() => onNavigate('blueprint')}
            >
              <Sparkles size={14} />
              查看 22 題斷捨離全表
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {sprintModules.map((mod, idx) => {
              const progressPct = mod.total > 0 ? Math.round((mod.reviewed / mod.total) * 100) : 0;
              return (
                <div
                  key={mod.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.95rem 1.05rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                        }}
                      >
                        0{idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                        {mod.code} · {mod.title}
                      </span>
                      <span className="tag tag-jade">{mod.weightTag}</span>
                      <span className="tag tag-neutral">{mod.targetMin}</span>
                    </div>
                    <p style={{ margin: '0.28rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {mod.subtitle}
                    </p>
                    {mod.key !== 'writing' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="progress-track" style={{ maxWidth: '180px', height: '5px' }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${progressPct}%`, background: 'var(--accent-jade)' }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          已學 {mod.reviewed}/{mod.total}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {mod.key !== 'writing' && (
                      <span className={mod.due > 0 ? 'tag tag-amber' : 'tag tag-jade'}>
                        {mod.due > 0 ? `待複習 ${mod.due}` : '今日已清倉'}
                      </span>
                    )}
                    <button
                      id={`btn-go-module-${mod.key}`}
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.48rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={mod.onGo}
                    >
                      進入練習
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: SRS Activity + Upcoming + Backup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <section className="surface-card">
            <span className="eyebrow">SPACED REPETITION · 過去 14 天記憶熱度</span>
            <h3 style={{ margin: '0.2rem 0 0.9rem', fontSize: '1rem', fontWeight: 700 }}>
              SM-2 每日複習分佈
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '5px',
                height: '112px',
                padding: '0.5rem 0.25rem 0',
              }}
            >
              {activity.map((pt, i) => {
                const barH = pt.count > 0 ? Math.max(10, Math.round((pt.count / maxAct) * 100)) : 0;
                const isToday = i === activity.length - 1;
                return (
                  <div
                    key={pt.date}
                    title={`${pt.date}: 共 ${pt.count} 題 (Easy ${pt.easy} / Hard ${pt.hard} / Forgot ${pt.forgot})`}
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {pt.count > 0 ? (
                        <div
                          style={{
                            width: '100%',
                            height: `${barH}%`,
                            borderRadius: '4px 4px 2px 2px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {pt.easy > 0 && (
                            <div
                              style={{
                                height: `${(pt.easy / pt.count) * 100}%`,
                                background: 'var(--accent-jade)',
                                minHeight: 2,
                              }}
                            />
                          )}
                          {pt.hard > 0 && (
                            <div
                              style={{
                                height: `${(pt.hard / pt.count) * 100}%`,
                                background: 'var(--accent-amber)',
                                minHeight: 2,
                              }}
                            />
                          )}
                          {pt.forgot > 0 && (
                            <div
                              style={{
                                height: `${(pt.forgot / pt.count) * 100}%`,
                                background: 'var(--accent-coral)',
                                minHeight: 2,
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '2px',
                            background: 'hsla(200,20%,88%,0.08)',
                            borderRadius: '2px',
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontFamily: 'var(--font-mono)',
                        color: isToday ? 'var(--accent-jade)' : 'var(--text-muted)',
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {Number(pt.date.slice(8))}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '0.75rem',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-jade)' }} />
                Easy 熟練
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-amber)' }} />
                Hard 模糊
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-coral)' }} />
                Forgot 重背
              </span>
            </div>
          </section>

          <section className="surface-card">
            <span className="eyebrow">UPCOMING · 未來 7 天已學卡片到期預報</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '86px',
                marginTop: '0.8rem',
              }}
            >
              {forecast.map((f, idx) => {
                const h = f.count > 0 ? Math.max(14, Math.round((f.count / maxForecast) * 100)) : 4;
                const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
                const dow = dayNames[new Date(`${f.date}T00:00:00`).getDay()];
                return (
                  <div
                    key={f.date}
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {f.count > 0 ? f.count : ''}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${h}%`,
                        borderRadius: '4px 4px 2px 2px',
                        background: idx === 0 ? 'var(--accent-amber)' : 'var(--accent-ocean)',
                        opacity: f.count > 0 ? 0.85 : 0.15,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: idx === 0 ? 'var(--accent-amber)' : 'var(--text-muted)',
                        fontWeight: idx === 0 ? 700 : 500,
                      }}
                    >
                      {idx === 0 ? '今日' : `週${dow}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="surface-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={15} color="var(--accent-jade)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>跨裝置進度備份與還原</span>
            </div>
            <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              系統已自動相容並保留原 <code>sgd-memory-cards</code> 本地進度；亦支援匯出 JSON 同步至手機。
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                id="btn-export-json"
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                onClick={handleExport}
              >
                <Download size={14} />
                匯出備份
              </button>
              <button
                id="btn-import-json"
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                匯入備份
              </button>
              <button
                id="btn-reset-all"
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.76rem', marginLeft: 'auto', color: 'var(--text-muted)' }}
                onClick={onResetAll}
              >
                <RotateCcw size={13} />
                重置
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </div>
            {backupMsg && (
              <p style={{ margin: '0.6rem 0 0', fontSize: '0.76rem', color: 'var(--accent-jade)' }}>{backupMsg}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
