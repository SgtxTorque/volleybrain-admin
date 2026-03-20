// =============================================================================
// CoachStatsTab — V2 top players stats table for coach dashboard tabs
// Props-only.
// =============================================================================

export default function CoachStatsTab({
  topPlayers = [],
  roster = [],
  onPlayerClick,
}) {
  const getPlayerName = (playerId) => {
    const p = roster.find(r => r.id === playerId)
    if (p) return `${p.first_name} ${p.last_name}`
    return '—'
  }

  const getInitials = (playerId) => {
    const p = roster.find(r => r.id === playerId)
    if (p) return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase()
    return '—'
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 60px 60px 60px 60px 60px 60px',
        gap: 4, padding: '10px 24px',
        background: 'var(--v2-surface)',
        borderBottom: '1px solid var(--v2-border-subtle)',
      }}>
        {['Player', 'PTS', 'K', 'A', 'D', 'B', 'ACE'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
            textAlign: i > 0 ? 'center' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Player rows */}
      {topPlayers.map((tp, i) => (
        <div
          key={tp.player_id || i}
          onClick={() => {
            const p = roster.find(r => r.id === tp.player_id)
            if (p) onPlayerClick?.(p)
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 60px 60px 60px 60px 60px',
            gap: 4, padding: '10px 24px',
            borderBottom: i < topPlayers.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Player */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 800,
              color: i < 3 ? 'var(--v2-sky)' : 'var(--v2-text-muted)',
              width: 18,
            }}>
              #{i + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
              {getPlayerName(tp.player_id)}
            </span>
          </div>

          {/* Stats */}
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
            {tp.total_points || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_kills || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_assists || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_digs || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_blocks || 0}
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--v2-text-muted)' }}>
            {tp.total_aces || 0}
          </div>
        </div>
      ))}

      {topPlayers.length === 0 && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontSize: 13, color: 'var(--v2-text-muted)',
        }}>
          No player stats yet
        </div>
      )}
    </div>
  )
}
