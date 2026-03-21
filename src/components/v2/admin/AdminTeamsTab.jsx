// =============================================================================
// AdminTeamsTab — V2 teams table for admin dashboard body tabs
// Props-only. Enhanced with player avatar stack.
// =============================================================================

export default function AdminTeamsTab({
  teamsData = [],
  teamStats = {},
  onTeamClick,
  onViewAll,
}) {
  const getHealth = (team) => {
    const stats = teamStats[team.id] || {}
    const playerCount = stats.playerCount || 0
    const maxPlayers = team.max_players || 12
    const fillPct = maxPlayers > 0 ? playerCount / maxPlayers : 0

    if (fillPct >= 0.8) return { dot: 'var(--v2-green)', label: 'Good', bg: 'rgba(16,185,129,0.1)', color: '#059669' }
    if (fillPct >= 0.5) return { dot: 'var(--v2-amber)', label: 'Attention', bg: 'rgba(245,158,11,0.1)', color: '#D97706' }
    return { dot: 'var(--v2-coral)', label: 'Critical', bg: 'rgba(239,68,68,0.1)', color: '#DC2626' }
  }

  // Generate gradient colors from team name for avatar circles
  const getAvatarGradient = (index) => {
    const gradients = [
      'linear-gradient(135deg, #4BB9EC, #2563EB)',
      'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      'linear-gradient(135deg, #EC4899, #DB2777)',
      'linear-gradient(135deg, #22C55E, #059669)',
      'linear-gradient(135deg, #F59E0B, #D97706)',
      'linear-gradient(135deg, #EF4444, #DC2626)',
    ]
    return gradients[index % gradients.length]
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 100px 90px 80px 80px 90px',
        gap: 8, padding: '10px 24px',
        background: 'var(--v2-surface)',
        borderBottom: '1px solid var(--v2-border-subtle)',
      }}>
        {['', 'Team', 'Players', 'Roster', 'Record', 'Unpaid', 'Status'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
            textAlign: i >= 3 ? 'center' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Data rows */}
      {teamsData.slice(0, 10).map((team, i) => {
        const stats = teamStats[team.id] || {}
        const health = getHealth(team)
        const playerCount = stats.playerCount || 0
        const maxPlayers = team.max_players || 12
        const record = stats.record || '0-0'

        // Build avatar stack (placeholder initials since we don't have player data per team)
        const avatarCount = Math.min(playerCount, 5)
        const overflow = playerCount > 5 ? playerCount - 5 : 0

        return (
          <div
            key={team.id}
            onClick={() => onTeamClick?.(team.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 100px 90px 80px 80px 90px',
              gap: 8, padding: '12px 24px',
              borderBottom: i < teamsData.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Health dot */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: health.dot,
              }} />
            </div>

            {/* Team info */}
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                {team.name}
              </div>
              {team.age_group && (
                <div style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                  {team.age_group}
                </div>
              )}
            </div>

            {/* Player avatar stack */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', marginLeft: 4 }}>
                {Array.from({ length: avatarCount }).map((_, j) => (
                  <div key={j} style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: getAvatarGradient(j),
                    border: '2px solid var(--v2-white)',
                    marginLeft: j > 0 ? -8 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#FFF',
                    position: 'relative', zIndex: avatarCount - j,
                  }}>
                    {/* Placeholder initials */}
                  </div>
                ))}
                {overflow > 0 && (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--v2-surface)',
                    border: '2px solid var(--v2-white)',
                    marginLeft: -8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'var(--v2-text-muted)',
                    position: 'relative', zIndex: 0,
                  }}>
                    +{overflow}
                  </div>
                )}
              </div>
            </div>

            {/* Roster */}
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--v2-text-muted)' }}>
              {playerCount}/{maxPlayers}
            </div>

            {/* Record */}
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
              {record}
            </div>

            {/* Unpaid */}
            <div style={{
              textAlign: 'center', fontSize: 12, fontWeight: 600,
              color: 'var(--v2-text-muted)',
            }}>
              —
            </div>

            {/* Status badge */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                background: health.bg, color: health.color,
                padding: '3px 10px', borderRadius: 6,
              }}>
                {health.label}
              </span>
            </div>
          </div>
        )
      })}

      {teamsData.length === 0 && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontSize: 13, color: 'var(--v2-text-muted)',
        }}>
          No teams created yet
        </div>
      )}
    </div>
  )
}
