// =============================================================================
// SeasonCarousel — Horizontal scrollable season cards for admin dashboard
// Props-only.
// =============================================================================

export default function SeasonCarousel({
  seasons = [],
  perSeasonTeamCounts = {},
  perSeasonPlayerCounts = {},
  selectedSeasonId,
  onSeasonSelect,
  onViewAll,
}) {
  if (seasons.length === 0) return null

  const getStatusBadge = (season) => {
    const s = season.status?.toLowerCase() || ''
    if (s === 'active' || s === 'in_progress') return { label: 'Mid-Season', bg: 'rgba(16,185,129,0.12)', color: '#059669', barColor: 'var(--v2-green)' }
    if (s === 'open' || s === 'registration') return { label: 'Registration Open', bg: 'rgba(75,185,236,0.12)', color: '#0284C7', barColor: 'var(--v2-sky)' }
    if (s === 'setup' || s === 'draft') return { label: 'Setup Phase', bg: 'rgba(245,158,11,0.12)', color: '#D97706', barColor: 'var(--v2-amber)' }
    if (s === 'completed' || s === 'archived') return { label: 'Completed', bg: 'rgba(100,116,139,0.12)', color: '#64748B', barColor: '#94A3B8' }
    return { label: s || 'Active', bg: 'rgba(75,185,236,0.12)', color: '#0284C7', barColor: 'var(--v2-sky)' }
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--v2-text-muted)',
        }}>
          Active Seasons
        </span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--v2-sky)',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}
          >
            View All →
          </button>
        )}
      </div>

      {/* Scrollable container */}
      <div
        className="v2-season-carousel"
        style={{
          display: 'flex', gap: 14, overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {seasons.map(season => {
          const badge = getStatusBadge(season)
          const teamCount = perSeasonTeamCounts[season.id] || 0
          const playerCount = perSeasonPlayerCounts[season.id] || 0
          const isSelected = season.id === selectedSeasonId

          return (
            <div
              key={season.id}
              onClick={() => onSeasonSelect?.(season.id)}
              style={{
                minWidth: 240, flex: '1 0 240px',
                background: 'var(--v2-white)',
                borderRadius: 'var(--v2-radius)',
                boxShadow: isSelected ? '0 0 0 2px var(--v2-sky)' : 'var(--v2-card-shadow)',
                border: '1px solid var(--v2-border-subtle)',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = isSelected
                  ? '0 0 0 2px var(--v2-sky), 0 4px 16px rgba(0,0,0,0.1)'
                  : '0 4px 16px rgba(0,0,0,0.1)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = isSelected ? '0 0 0 2px var(--v2-sky)' : 'var(--v2-card-shadow)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {/* Status badge */}
              <span style={{
                display: 'inline-block',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                background: badge.bg, color: badge.color,
                padding: '3px 8px', borderRadius: 6,
                marginBottom: 10,
              }}>
                {badge.label}
              </span>

              {/* Season name */}
              <div style={{
                fontSize: 15, fontWeight: 700, color: 'var(--v2-navy)',
                marginBottom: 4,
              }}>
                {season.name}
              </div>

              {/* Meta */}
              <div style={{
                fontSize: 12, color: 'var(--v2-text-secondary)',
                marginBottom: 12,
              }}>
                {teamCount} team{teamCount !== 1 ? 's' : ''} · {playerCount} player{playerCount !== 1 ? 's' : ''}
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: 'var(--v2-surface)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: badge.barColor,
                    width: `${Math.min(Math.max(teamCount * 10 + playerCount * 2, 10), 100)}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                  {teamCount > 0 && <><span style={{ fontWeight: 600, color: 'var(--v2-text-secondary)' }}>{teamCount}</span> teams</>}
                </span>
                <span style={{ fontSize: 14, color: 'var(--v2-sky)' }}>→</span>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .v2-season-carousel::-webkit-scrollbar { display: none; }
        .v2-season-carousel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
