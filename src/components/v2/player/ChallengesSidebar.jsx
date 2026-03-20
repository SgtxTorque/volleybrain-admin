// =============================================================================
// ChallengesSidebar — V2 compact challenge list for player sidebar
// Props-only. Dark variant.
// =============================================================================

export default function ChallengesSidebar({
  challenges = [],
}) {
  if (challenges.length === 0) return null

  return (
    <div style={{
      background: '#132240',
      borderRadius: 16,
      padding: 20,
      fontFamily: 'var(--v2-font)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'rgba(255,255,255,0.40)',
        marginBottom: 14,
      }}>
        Active Challenges
      </div>

      {/* Challenge rows */}
      {challenges.slice(0, 5).map((ch, i) => {
        const pct = ch.target > 0 ? Math.min(100, (ch.progress / ch.target) * 100) : 0

        return (
          <div
            key={ch.id || i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < Math.min(challenges.length, 5) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: pct >= 100 ? 'rgba(255,215,0,0.10)' : 'rgba(75,185,236,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {ch.icon || '🎯'}
            </div>

            {/* Info + bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
                  {ch.name}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#FFD700' }}>
                  +{ch.xpReward || 0} XP
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: pct >= 100 ? '#FFD700' : '#4BB9EC',
                  width: `${pct}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>

              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>
                {ch.progress}/{ch.target}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
