// =============================================================================
// LeaderboardCard — V2 sidebar leaderboard for player dashboard
// Props-only. Dark variant.
// =============================================================================

export default function LeaderboardCard({
  teamName = '',
  entries = [],
}) {
  if (entries.length === 0) return null

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
        {teamName ? `${teamName} Leaderboard` : 'Leaderboard'}
      </div>

      {/* Entries */}
      {entries.map((entry, i) => (
        <div
          key={entry.rank || i}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: entry.isCurrentPlayer ? '10px 20px' : '10px 0',
            margin: entry.isCurrentPlayer ? '0 -20px' : 0,
            borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            background: entry.isCurrentPlayer ? 'rgba(255,215,0,0.06)' : 'transparent',
            borderLeft: entry.isCurrentPlayer ? '2px solid #FFD700' : '2px solid transparent',
          }}
        >
          {/* Rank */}
          <span style={{
            fontSize: 14, fontWeight: 800, width: 24, textAlign: 'center',
            color: entry.rank === 1 || entry.isCurrentPlayer ? '#FFD700' : 'rgba(255,255,255,0.30)',
          }}>
            {entry.rank}
          </span>

          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: entry.avatarGradient || 'linear-gradient(135deg, #4BB9EC, #4BB9EC88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#FFFFFF',
            flexShrink: 0,
          }}>
            {entry.initials}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: entry.isCurrentPlayer ? '#FFD700' : 'rgba(255,255,255,0.90)',
            }}>
              {entry.name}
            </div>
            {entry.detail && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>
                {entry.detail}
              </div>
            )}
          </div>

          {/* XP */}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFD700', flexShrink: 0 }}>
            {entry.xp.toLocaleString()} XP
          </span>
        </div>
      ))}
    </div>
  )
}
