// =============================================================================
// EngagementLevelCard — Shared level/XP hero card for all role dashboards
// =============================================================================

export default function EngagementLevelCard({ levelInfo, tierName, xp, onNavigateAchievements }) {
  const level = levelInfo?.level || 1
  const progress = levelInfo?.progress || 0
  const xpToNext = levelInfo?.nextLevelXp || 1000
  const displayXp = xp || 0

  const fmtXp = (n) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : n

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0B1628, #162D50)',
        borderRadius: 14,
        padding: 14,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        background: 'radial-gradient(circle, rgba(75,185,236,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '1.5px solid #4BB9EC',
          background: 'rgba(75,185,236,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          ⭐
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>
            {tierName || 'Rising Star'}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.3 }}>
            Level {level} — {fmtXp(displayXp)} / {fmtXp(xpToNext)} XP
          </div>
        </div>
      </div>

      {/* XP Progress bar */}
      <div style={{
        height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)',
        marginBottom: 8, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: '#4BB9EC',
          width: `${Math.min(progress, 100)}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Trophy case link */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={onNavigateAchievements}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, color: '#FFD700',
            padding: 0,
          }}
        >
          Trophy case →
        </button>
      </div>
    </div>
  )
}
