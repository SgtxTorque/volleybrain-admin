// =============================================================================
// CoachEngagementTab — V2 engagement summary for coach dashboard
// Shows active challenges, recent shoutouts, and team engagement stats.
// Props-only.
// =============================================================================

export default function CoachEngagementTab({
  activeChallenges = [],
  weeklyShoutouts = 0,
  weeklyEngagement = {},
  onGiveShoutout,
  onCreateChallenge,
  onNavigate,
}) {
  return (
    <div style={{ fontFamily: 'var(--v2-font)', padding: '16px 24px' }}>

      {/* Engagement stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { label: 'Shoutouts', value: weeklyShoutouts, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Challenges', value: weeklyEngagement.challenges || 0, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
          { label: 'Wall Posts', value: weeklyEngagement.posts || 0, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            background: s.bg, borderRadius: 10, padding: '12px 8px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2, letterSpacing: '0.03em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Active Challenges */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          color: 'var(--v2-text-muted)', letterSpacing: '0.04em', marginBottom: 10,
        }}>
          Active Challenges
        </div>

        {activeChallenges.length === 0 ? (
          <div style={{
            padding: '20px 16px', textAlign: 'center',
            background: 'var(--v2-surface)', borderRadius: 10,
            fontSize: 13, color: 'var(--v2-text-muted)',
          }}>
            No active challenges
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeChallenges.map((ch, i) => {
              const pct = ch.totalParticipants > 0 ? Math.round((ch.completedCount / ch.totalParticipants) * 100) : 0
              const daysLeft = ch.ends_at ? Math.max(0, Math.ceil((new Date(ch.ends_at) - new Date()) / (1000 * 60 * 60 * 24))) : null
              return (
                <div key={ch.id || i} style={{
                  background: 'var(--v2-surface)', borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
                      {ch.title}
                    </div>
                    {daysLeft !== null && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: daysLeft <= 2 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: daysLeft <= 2 ? '#DC2626' : '#D97706',
                      }}>
                        {daysLeft}d left
                      </span>
                    )}
                  </div>
                  {ch.description && (
                    <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginBottom: 8 }}>
                      {ch.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--v2-border-subtle)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: pct >= 80 ? 'var(--v2-green)' : pct >= 50 ? 'var(--v2-amber)' : 'var(--v2-sky)',
                        width: `${pct}%`, transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-text-muted)', whiteSpace: 'nowrap' }}>
                      {ch.completedCount}/{ch.totalParticipants}
                    </span>
                  </div>
                  {ch.xp_reward > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--v2-gold)', fontWeight: 700, marginTop: 4 }}>
                      +{ch.xp_reward} XP reward
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onGiveShoutout}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            fontSize: 12, fontWeight: 700,
            background: 'rgba(245,158,11,0.1)', color: '#D97706',
            border: 'none', cursor: 'pointer',
          }}
        >
          Give Shoutout
        </button>
        <button
          onClick={onCreateChallenge}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            fontSize: 12, fontWeight: 700,
            background: 'rgba(239,68,68,0.1)', color: '#DC2626',
            border: 'none', cursor: 'pointer',
          }}
        >
          Create Challenge
        </button>
      </div>
    </div>
  )
}
