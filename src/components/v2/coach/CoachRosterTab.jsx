// =============================================================================
// CoachRosterTab — V2 roster table for coach dashboard body tabs
// Props-only. Enriched columns: Avatar, Player, Parent, Contact, Pos, RSVP.
// =============================================================================

export default function CoachRosterTab({
  roster = [],
  rsvpCounts = {},
  nextEventId,
  onPlayerClick,
}) {
  const getInitials = (p) => {
    const f = p.first_name?.[0] || ''
    const l = p.last_name?.[0] || ''
    return (f + l).toUpperCase()
  }

  const gradients = [
    'linear-gradient(135deg, #4BB9EC, #2E8BC0)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #F43F5E, #E11D48)',
  ]

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 140px 120px 50px 70px 80px',
        gap: 8, padding: '10px 24px',
        background: 'var(--v2-surface)',
        borderBottom: '1px solid var(--v2-border-subtle)',
      }}>
        {['', 'Player', 'Parent', 'Contact', 'Pos', '#', 'RSVP'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
            textAlign: i >= 4 ? 'center' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Player rows */}
      {roster.slice(0, 15).map((player, i) => (
        <div
          key={player.id || i}
          onClick={() => onPlayerClick?.(player)}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 140px 120px 50px 70px 80px',
            gap: 8, padding: '10px 24px',
            borderBottom: i < Math.min(roster.length, 15) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: gradients[i % gradients.length],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#FFFFFF',
          }}>
            {player.photo_url ? (
              <img src={player.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              getInitials(player)
            )}
          </div>

          {/* Player name + jersey */}
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
              {player.first_name} {player.last_name}
            </div>
            {player.jersey_number && (
              <div style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                #{player.jersey_number}
              </div>
            )}
          </div>

          {/* Parent */}
          <div style={{ fontSize: 13, color: 'var(--v2-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.parent_name || '—'}
          </div>

          {/* Contact */}
          <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.parent_phone || player.parent_email || '—'}
          </div>

          {/* Position */}
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--v2-text-muted)' }}>
            {player.position || '—'}
          </div>

          {/* Jersey */}
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
            {player.jersey_number || '—'}
          </div>

          {/* RSVP status */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(16,185,129,0.1)', color: '#059669',
            }}>
              —
            </span>
          </div>
        </div>
      ))}

      {roster.length === 0 && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontSize: 13, color: 'var(--v2-text-muted)',
        }}>
          No players on roster
        </div>
      )}
    </div>
  )
}
