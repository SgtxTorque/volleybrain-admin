// =============================================================================
// TeamSwitcher — V2 horizontal pill row for coach team selection
// Props-only.
// =============================================================================

export default function TeamSwitcher({
  teams = [],
  selectedTeamId,
  onTeamSelect,
}) {
  if (teams.length <= 1) return null

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '16px 24px',
      fontFamily: 'var(--v2-font)',
      overflowX: 'auto',
    }}>
      {teams.map(team => {
        const isActive = team.id === selectedTeamId
        return (
          <button
            key={team.id}
            onClick={() => onTeamSelect?.(team)}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: isActive ? '1px solid var(--v2-navy)' : '1px solid var(--v2-border-subtle)',
              background: isActive ? 'var(--v2-navy)' : '#FFFFFF',
              color: isActive ? '#FFFFFF' : 'var(--v2-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = 'var(--v2-surface)'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = '#FFFFFF'
            }}
          >
            {team.name}
            {team.playerCount != null && (
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 700,
                opacity: 0.6,
              }}>
                ({team.playerCount})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
