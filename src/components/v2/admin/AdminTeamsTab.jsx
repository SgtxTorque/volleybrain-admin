// =============================================================================
// AdminTeamsTab — V2 teams table for admin dashboard body tabs
// Props-only.
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

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr 90px 80px 80px 90px',
        gap: 8, padding: '10px 24px',
        background: 'var(--v2-surface)',
        borderBottom: '1px solid var(--v2-border-subtle)',
      }}>
        {['', 'Team', 'Roster', 'Record', 'Unpaid', 'Status'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
            textAlign: i >= 2 ? 'center' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Data rows */}
      {teamsData.slice(0, 8).map((team, i) => {
        const stats = teamStats[team.id] || {}
        const health = getHealth(team)
        const playerCount = stats.playerCount || 0
        const maxPlayers = team.max_players || 12
        const record = stats.record || '0-0'

        return (
          <div
            key={team.id}
            onClick={() => onTeamClick?.(team.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 90px 80px 80px 90px',
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
              color: 0 > 0 ? 'var(--v2-coral)' : 'var(--v2-text-muted)',
            }}>
              0
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
