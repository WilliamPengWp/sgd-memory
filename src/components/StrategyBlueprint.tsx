import React, { useState } from 'react';
import { CheckSquare, Square, Filter } from 'lucide-react';
import { PTE_22_TASKS, EIGHT_WEEK_PLAN } from '../data/strategyData';

interface StrategyBlueprintProps {
  weeklyChecks: Record<string, boolean>;
  onToggleCheck: (id: string) => void;
}

export const StrategyBlueprint: React.FC<StrategyBlueprintProps> = ({
  weeklyChecks,
  onToggleCheck,
}) => {
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const filteredTasks = PTE_22_TASKS.filter((t) => {
    if (tierFilter === 'ALL') return true;
    return t.tier.startsWith(tierFilter);
  });

  const totalMilestones = EIGHT_WEEK_PLAN.reduce((acc, w) => acc + w.tasks.length, 0);
  const completedMilestones = EIGHT_WEEK_PLAN.reduce(
    (acc, w) => acc + w.tasks.filter((t) => weeklyChecks[t.id]).length,
    0
  );

  const tierTagClass = (tier: string) => {
    if (tier.startsWith('S')) return 'tag tag-coral';
    if (tier.startsWith('A')) return 'tag tag-amber';
    if (tier.startsWith('B')) return 'tag tag-jade';
    return 'tag tag-neutral';
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
      {/* 8-Week Interactive Roadmap */}
      <section className="surface-card">
        <div className="section-header">
          <div>
            <span className="eyebrow">SOFTWARE ENGINEER ROADMAP · 6–8 週執行進度追蹤</span>
            <h2 className="section-title">上班族平日 75m ／ 週末 2.5h 里程碑打卡表</h2>
          </div>
          <span className="tag tag-jade" style={{ fontSize: '0.8rem' }}>
            已完成 {completedMilestones} / {totalMilestones} 項里程碑
          </span>
        </div>

        <div className="grid-2">
          {EIGHT_WEEK_PLAN.map((wk) => (
            <div
              key={wk.week}
              style={{
                padding: '1.05rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.65rem',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-jade)', fontWeight: 700 }}>
                    {wk.week}
                  </span>
                  <h3 style={{ margin: '0.1rem 0 0', fontSize: '0.96rem' }}>{wk.phaseTitle}</h3>
                </div>
                <span className="tag tag-ocean">{wk.focusBadge}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {wk.tasks.map((task) => {
                  const done = !!weeklyChecks[task.id];
                  return (
                    <button
                      key={task.id}
                      id={`chk-milestone-${task.id}`}
                      type="button"
                      onClick={() => onToggleCheck(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.55rem',
                        textAlign: 'left',
                        padding: '0.45rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: done ? 'hsla(162,68%,43%,0.08)' : 'transparent',
                        color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                        textDecoration: done ? 'line-through' : 'none',
                        fontSize: '0.82rem',
                      }}
                    >
                      {done ? (
                        <CheckSquare size={16} color="var(--accent-jade)" style={{ flexShrink: 0, marginTop: 2 }} />
                      ) : (
                        <Square size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                      )}
                      <span>{task.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Complete 22 Task Matrix */}
      <section className="surface-card">
        <div className="section-header">
          <div>
            <span className="eyebrow">2025/8/7 PEARSON OFFICIAL SCORE GUIDE · 全 22 題型斷捨離</span>
            <h2 className="section-title">PTE Academic 60 分戰略級別與考場 SOP 全表</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <Filter size={14} color="var(--text-muted)" />
            {[
              { id: 'ALL', label: '全部 22 題' },
              { id: 'S', label: 'S 核武必背 (4)' },
              { id: 'A', label: 'A 骨架穩拿 (8)' },
              { id: 'B', label: 'B 順手白撿 (2)' },
              { id: 'C', label: 'C 策略放生 (8)' },
            ].map((f) => (
              <button
                key={f.id}
                id={`btn-filter-tier-${f.id}`}
                type="button"
                className={`btn ${tierFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.76rem' }}
                onClick={() => setTierFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>戰略級別</th>
                <th>縮寫 / 題型名稱</th>
                <th>題數</th>
                <th>新制供分</th>
                <th>AI+真人雙審</th>
                <th>55–60 分考場實戰口訣與新制變動</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.code}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={tierTagClass(t.tier)}>{t.tier}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.code}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.nameZh}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {t.count}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="tag tag-ocean">{t.skills}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {t.humanReview ? (
                      <span className="tag tag-amber">雙審 Content</span>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>純 AI</span>
                    )}
                  </td>
                  <td>
                    {t.changed2025 && (
                      <div style={{ fontSize: '0.76rem', color: 'hsl(38, 95%, 68%)', marginBottom: '0.2rem', fontWeight: 600 }}>
                        ⚡ {t.changed2025}
                      </div>
                    )}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{t.sop60}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
