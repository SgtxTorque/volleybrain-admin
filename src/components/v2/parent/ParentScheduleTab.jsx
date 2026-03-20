// =============================================================================
// ParentScheduleTab — V2 schedule rows with child tags and RSVP buttons
// Props-only.
// =============================================================================

export default function ParentScheduleTab({
  events = [],
  children = [],
  onRsvp,
  onEventClick,
}) {
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Find which child is on this event's team
  const getChildForEvent = (evt) => {
    return children.find(c => c.team?.id === evt.team_id)
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {events.slice(0, 8).map((evt, i) => {
        const eventDate = new Date(evt.event_date)
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
        const dayNum = eventDate.getDate()
        const isToday = eventDate.toDateString() === new Date().toDateString()
        const child = getChildForEvent(evt)

        return (
          <div
            key={evt.id || i}
            onClick={() => onEventClick?.(evt)}
            style={{
              display: 'flex', gap: 14, padding: '12px 24px',
              borderBottom: i < events.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Date block */}
            <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                {dayName}
              </div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: isToday ? 'var(--v2-sky)' : 'var(--v2-navy)',
              }}>
                {dayNum}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                {evt.title || evt.event_type}
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                {formatTime(evt.event_time || evt.start_time)}
                {evt.location && ` · ${evt.location}`}
              </div>
            </div>

            {/* Child tag */}
            {child && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: 'rgba(75,185,236,0.08)',
                color: 'var(--v2-sky)',
                padding: '3px 8px', borderRadius: 6,
                flexShrink: 0,
              }}>
                {child.first_name}
              </span>
            )}

            {/* RSVP button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRsvp?.(evt) }}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: '5px 12px', borderRadius: 8,
                background: 'var(--v2-navy)', color: '#FFFFFF',
                border: 'none', cursor: 'pointer',
                flexShrink: 0,
                transition: 'opacity 0.15s ease',
              }}
            >
              RSVP
            </button>
          </div>
        )
      })}

      {events.length === 0 && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontSize: 13, color: 'var(--v2-text-muted)',
        }}>
          No upcoming events
        </div>
      )}
    </div>
  )
}
