// =============================================================================
// PlayerChallengesTab — V2 challenge rows with progress bars
// Props-only.
// =============================================================================

export default function PlayerChallengesTab({
  challenges = [],
}) {
  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {challenges.length > 0 ? (
        challenges.map((ch, i) => {
          const pct = ch.target > 0 ? Math.min(100, (ch.progress / ch.target) * 100) : 0
          const isComplete = pct >= 100

          return (
            <div
              key={ch.id || i}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderBottom: i < challenges.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: isComplete ? 'rgba(255,215,0,0.12)' : 'rgba(75,185,236,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {ch.icon || (isComplete ? '✅' : '🎯')}
              </div>

              {/* Info + progress bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.90)' }}>
                    {ch.name}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isComplete ? '#FFD700' : 'rgba(255,255,255,0.40)',
                  }}>
                    {ch.progress}/{ch.target}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: isComplete ? '#FFD700' : '#4BB9EC',
                    width: `${pct}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>

                {ch.xpReward && (
                  <div style={{ fontSize: 10, color: '#FFD700', fontWeight: 700, marginTop: 4 }}>
                    +{ch.xpReward} XP
                  </div>
                )}
              </div>
            </div>
          )
        })
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🎯</span>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>
            No active challenges — check back soon!
          </div>
        </div>
      )}
    </div>
  )
}
