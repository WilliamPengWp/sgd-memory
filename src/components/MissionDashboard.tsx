import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Download,
  Upload,
  RotateCcw,
  Flame,
  Brain,
  PlusCircle,
  MessageSquareHeart,
  Blocks,
} from 'lucide-react';
import {
  SrsCard,
  ReviewHistoryEntry,
  DeckType,
  computeDeckStats,
  estimateSkillReadiness,
  getRecentActivity,
  computeForgettingCurveSummary,
  exportStudioBackup,
  importStudioBackup,
} from '../utils/srs';

export type NavTab = 'mission' | 'wfd' | 'roleplay' | 'speaking' | 'readwrite' | 'blueprint';
export type SpeakingSubTab = 'sgd' | 'rs' | 'rts' | 'di' | 'ra';
export type ReadWriteSubTab = 'fib' | 'writing';

interface MissionDashboardProps {
  cardsMap: Record<string, SrsCard>;
  history: ReviewHistoryEntry[];
  onNavigate: (tab: NavTab, subTab?: SpeakingSubTab | ReadWriteSubTab) => void;
  onOpenFireflyModal: () => void;
  onReloadStorage: () => void;
  onResetAll: () => void;
}

/* Visual Ebbinghaus Forgetting Curve SVG (R(t) = exp(-t / S)) */
const EbbinghausCurveChart: React.FC<{
  strong: number;
  golden: number;
  fading: number;
  avgRetention: number;
}> = ({ strong, golden, fading, avgRetention }) => {
  return (
    <div>
      <svg
        viewBox="0 0 540 200"
        style={{
          width: '100%',
          height: 'auto',
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Golden Review Zone Band (60% - 82%) */}
        <rect x="46" y="48" width="470" height="44" fill="hsla(38, 92%, 56%, 0.08)" />
        <text x="54" y="64" fill="hsl(38, 92%, 68%)" fontSize="10" fontWeight="600">
          黃金複習區 (60%–82%：此時複習 1 次 = 死背 10 次！)
        </text>

        {/* Axes */}
        <line x1="46" y1="22" x2="46" y2="170" stroke="hsla(200,20%,85%,0.2)" strokeWidth="1" />
        <line x1="46" y1="170" x2="516" y2="170" stroke="hsla(200,20%,85%,0.2)" strokeWidth="1" />

        <text x="12" y="30" fill="hsl(200,12%,65%)" fontSize="10">100%</text>
        <text x="16" y="88" fill="hsl(38,92%,65%)" fontSize="10">65%</text>
        <text x="18" y="166" fill="hsl(200,12%,55%)" fontSize="10">20%</text>

        <text x="46" y="188" fill="hsl(200,12%,60%)" fontSize="10">剛學完</text>
        <text x="155" y="188" fill="hsl(200,12%,60%)" fontSize="10">Day 1</text>
        <text x="275" y="188" fill="hsl(200,12%,60%)" fontSize="10">Day 3</text>
        <text x="395" y="188" fill="hsl(200,12%,60%)" fontSize="10">Day 7</text>
        <text x="485" y="188" fill="hsl(200,12%,60%)" fontSize="10">Day 21</text>

        {/* 1. Unreviewed Raw Decay Curve (Coral Dashed) */}
        <path
          d="M 46 26 Q 110 115, 240 154 T 510 166"
          fill="none"
          stroke="hsl(4, 78%, 60%)"
          strokeWidth="2"
          strokeDasharray="5 4"
        />

        {/* 2. 1st Review Boost Curve (Amber) */}
        <path
          d="M 46 26 Q 115 68, 160 82 L 160 26 Q 235 64, 280 78 L 280 26 Q 360 52, 400 66 L 400 26 Q 465 40, 512 46"
          fill="none"
          stroke="hsl(162, 68%, 46%)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Review Boost Nodes */}
        <circle cx="160" cy="26" r="4.5" fill="hsl(38, 92%, 58%)" />
        <circle cx="280" cy="26" r="4.5" fill="hsl(38, 92%, 58%)" />
        <circle cx="400" cy="26" r="4.5" fill="hsl(162, 76%, 58%)" />
      </svg>

      <div className="grid-4" style={{ marginTop: '0.75rem' }}>
        <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>平均記憶留存</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'hsl(162,76%,64%)' }}>
            {avgRetention}%
          </div>
        </div>
        <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🟢 穩固記憶</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800 }}>{strong} 題</div>
        </div>
        <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'hsl(38,92%,68%)' }}>🟡 黃金複習點</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {golden} 題
          </div>
        </div>
        <div style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'hsl(4,86%,72%)' }}>🔴 瀕臨遺忘</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-coral)' }}>
            {fading} 題
          </div>
        </div>
      </div>
    </div>
  );
};

export const MissionDashboard: React.FC<MissionDashboardProps> = ({
  cardsMap,
  history,
  onNavigate,
  onOpenFireflyModal,
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
  const curveSummary = computeForgettingCurveSummary(cardsMap);
  const activity = getRecentActivity(history, 14);
  const maxAct = Math.max(...activity.map((d) => d.count), 1);

  const handleRescueJump = () => {
    const first = curveSummary.rescueQueue[0];
    if (!first) {
      onNavigate('wfd');
      return;
    }
    if (first.deck === 'wfd') onNavigate('wfd');
    else if (first.deck === 'fib') onNavigate('readwrite', 'fib');
    else onNavigate('speaking', first.deck as SpeakingSubTab);
  };

  const handleExport = () => {
    const json = exportStudioBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pte60-memory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('已匯出完整記憶曲線與機經備份！');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importStudioBackup(String(reader.result || ''));
      if (ok) {
        onReloadStorage();
        setBackupMsg('記憶曲線與進度還原成功！');
      } else {
        setBackupMsg('JSON 格式無效');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const funQuests: Array<{
    key: DeckType | 'roleplay' | 'writing';
    badge: string;
    title: string;
    desc: string;
    dueLabel: string;
    onGo: () => void;
  }> = [
    {
      key: 'wfd',
      badge: '🧩 遊戲闖關 · L+W 命脈',
      title: `WFD 聽音拼積木 ＆ 腦洞記憶梗 (${wfdStats.total} 句最新預測)`,
      desc: '免打字單手點積木連擊，搭配爆笑畫面記憶法，不知不覺背完 11 月預測＋螢火蟲高頻題！',
      dueLabel: `待刷 ${wfdStats.due}`,
      onGo: () => onNavigate('wfd'),
    },
    {
      key: 'roleplay',
      badge: '🎭 真人對談 · 治癒枯燥',
      title: '澳洲室友／教授／Tech Lead 真人感多輪語音對戲',
      desc: '偷吃冰箱便當抓包、半夜練團交涉、雪梨早會救火！直接開口對話拿 AI 口說評分與 XP！',
      dueLabel: '+80 XP',
      onGo: () => onNavigate('roleplay'),
    },
    {
      key: 'sgd',
      badge: '🖼️ 圖音記憶 · 原版升級',
      title: 'SGD 41 題原版 AI 圖音卡 ＋ 即時語音評分官',
      desc: '完整保留你的 41 組三人討論圖音卡，新增即時語音轉文字與流利度 WPM 測分！',
      dueLabel: `待複習 ${sgdStats.due}`,
      onGo: () => onNavigate('speaking', 'sgd'),
    },
    {
      key: 'rs',
      badge: '🎙️ 11月週預測 · S+L 雙拿',
      title: `RS 35 題最新週預測（半句意群減負法）＋ RA 新題`,
      desc: '只唸綠色前半意群也能穩破 60 分！內建即時語音辨識檢查每個字的發音清晰度。',
      dueLabel: `已學 ${rsStats.reviewed + raStats.reviewed + rtsStats.reviewed + diStats.reviewed}`,
      onGo: () => onNavigate('speaking', 'rs'),
    },
    {
      key: 'fib',
      badge: '⚡ 快問快答 · 閱讀 60%',
      title: 'FIB 黃金固定搭配秒殺 ＋ 寫作 AI 雙審防呆沙盒',
      desc: '新制 RA 不再救閱讀、FIB 不再救寫作！靠高頻搭配詞與 5 關防呆檢核穩守 R48 / W51。',
      dueLabel: `待刷 ${fibStats.due}`,
      onGo: () => onNavigate('readwrite', 'fib'),
    },
  ];

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
      {/* Top Action Banner */}
      <section className="surface-card" style={{ padding: '1.35rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span className="tag tag-jade">🇦🇺 Competent 門檻：L47 / R48 / W51 / S54</span>
              <span className="tag tag-amber">🔥 已載入 2026/11 最新週預測＋螢火蟲核心機經</span>
            </div>
            <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.4rem', fontWeight: 800 }}>
              把無聊刷題變成「拼積木連擊 ＋ 澳洲真人語音對戲」！
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              每次只要 3～5 分鐘破一小關，系統自動用 <strong>艾賓浩斯遺忘曲線 $R(t)=e^{'{-t/S}'}$</strong>{' '}
              幫你在快忘記的瞬間精準推題。
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            <button
              id="btn-hero-play-bricks"
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate('wfd')}
            >
              <Blocks size={16} />
              玩 WFD 積木連擊
            </button>
            <button
              id="btn-hero-play-roleplay"
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('roleplay')}
            >
              <MessageSquareHeart size={16} color="var(--accent-jade)" />
              找澳洲室友語音對戲
            </button>
          </div>
        </div>

        {/* 4-Skill Competent Readiness Bars */}
        <div className="grid-4" style={{ marginTop: '1.2rem' }}>
          {skills.map((sk) => {
            const pct = Math.min(100, Math.max(14, Math.round(((sk.estimatedBand - 30) / 35) * 100)));
            const minPct = Math.round(((sk.dhaMin - 30) / 35) * 100);
            const safe = sk.estimatedBand >= sk.safeTarget;
            return (
              <div
                key={sk.skill}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 0.95rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{sk.labelZh}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: safe ? 'hsl(162,76%,64%)' : 'var(--text-primary)' }}>
                    ~{sk.estimatedBand}
                  </span>
                </div>
                <div style={{ position: 'relative', height: '7px', background: 'hsla(200,20%,88%,0.08)', borderRadius: '999px', margin: '0.5rem 0 0.4rem' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: safe ? 'var(--accent-jade)' : 'var(--accent-ocean)' }} />
                  <div style={{ position: 'absolute', left: `${minPct}%`, top: -3, bottom: -3, width: 2, background: 'var(--accent-amber)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>門檻 {sk.dhaMin}</span>
                  <span>目標 {sk.safeTarget}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="dashboard-split">
        {/* Left: Addictive Micro-Quests */}
        <section className="surface-card">
          <div className="section-header">
            <div>
              <span className="eyebrow">MICRO-QUESTS · 每次 5 分鐘無痛闖關</span>
              <h2 className="section-title">選擇你現在最想玩的練習模式</h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.76rem', padding: '0.38rem 0.75rem' }}
              onClick={onOpenFireflyModal}
            >
              <PlusCircle size={14} color="var(--accent-jade)" />
              匯入螢火蟲題庫
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {funQuests.map((q) => (
              <div
                key={q.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.95rem 1.05rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span className="tag tag-ocean">{q.badge}</span>
                    <span className="tag tag-amber">{q.dueLabel}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', marginBottom: '0.2rem' }}>{q.title}</div>
                  <div style={{ fontSize: '0.79rem', color: 'var(--text-secondary)' }}>{q.desc}</div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.48rem 0.9rem', fontSize: '0.8rem' }}
                  onClick={q.onGo}
                >
                  開玩
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Ebbinghaus Forgetting Curve Lab + 14-day Heatmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <section className="surface-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span className="eyebrow">EBBINGHAUS MEMORY ENGINE</span>
                <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.02rem' }}>
                  <Brain size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} color="var(--accent-jade)" />
                  艾賓浩斯記憶衰減與黃金複習曲線
                </h3>
              </div>

              {(curveSummary.goldenCount > 0 || curveSummary.fadingCount > 0) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '0.36rem 0.75rem', fontSize: '0.76rem' }}
                  onClick={handleRescueJump}
                >
                  <Flame size={13} />
                  搶救衰退記憶
                </button>
              )}
            </div>

            <EbbinghausCurveChart
              strong={curveSummary.strongCount}
              golden={curveSummary.goldenCount}
              fading={curveSummary.fadingCount}
              avgRetention={curveSummary.averageRetention}
            />
          </section>

          <section className="surface-card">
            <span className="eyebrow">14-DAY ACTIVITY · 打卡熱力圖與跨裝置同步</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '84px', marginTop: '0.65rem' }}>
              {activity.map((pt, idx) => {
                const h = pt.count > 0 ? Math.max(12, Math.round((pt.count / maxAct) * 100)) : 4;
                const isToday = idx === activity.length - 1;
                return (
                  <div
                    key={pt.date}
                    title={`${pt.date}: ${pt.count} 題`}
                    style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 3 }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${h}%`,
                        borderRadius: '3px',
                        background: pt.count > 0 ? 'var(--accent-jade)' : 'hsla(200,20%,88%,0.08)',
                      }}
                    />
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: isToday ? 'var(--accent-jade)' : 'var(--text-muted)' }}>
                      {Number(pt.date.slice(8))}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.38rem 0.7rem' }} onClick={handleExport}>
                <Download size={13} />
                匯出備份
              </button>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.38rem 0.7rem' }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={13} />
                匯入備份
              </button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: '0.74rem', marginLeft: 'auto', color: 'var(--text-muted)' }} onClick={onResetAll}>
                <RotateCcw size={13} />
                重置
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
            </div>
            {backupMsg && <div style={{ fontSize: '0.75rem', color: 'var(--accent-jade)', marginTop: '0.45rem' }}>{backupMsg}</div>}
          </section>
        </div>
      </div>
    </div>
  );
};
