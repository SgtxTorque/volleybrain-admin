// =============================================================================
// CoachAttendanceTab — V2 attendance data per event for coach dashboard tabs
// Props-only.
// =============================================================================

export default function CoachAttendanceTab({
  upcomingEvents = [],
  rsvpCounts = {},
  rosterSize = 0,
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

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {upcomingEvents.slice(0, 8).map((evt, i) => {
        const rsvp = rsvpCounts[evt.id] || {}
        const going = rsvp.going || 0
        const pending = Math.max(0, rosterSize - (rsvp.total || 0))
        const pct = rosterSize > 0 ? Math.round((going / rosterSize) * 100) : 0
        const eventDate = new Date(evt.event_date)
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
        const dayNum = eventDate.getDate()

        return (
          <div
            key={evt.id || i}
            onClick={() => onEventClick?.(evt)}
            style={{
              display: 'flex', gap: 14, padding: '14px 24px',
              borderBottom: i < upcomingEvents.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Date */}
            <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>{dayName}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--v2-text-primary)' }}>{dayNum}</div>
            </div>

            {/* Event info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)', marginBottom: 2 }}>
                {evt.title || evt.event_type}
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                {formatTime(evt.event_time || evt.start_time)}
                {evt.location && ` · ${evt.location}`}
              </div>
            </div>

            {/* RSVP bar */}
            <div style={{ width: 100, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: 'var(--v2-green)' }}>{going}</span>
                <span style={{ color: 'var(--v2-text-muted)' }}>{pending > 0 ? `${pending} pending` : 'All in'}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--v2-surface)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: pct >= 80 ? 'var(--v2-green)' : pct >= 50 ? 'var(--v2-amber)' : 'var(--v2-coral)',
                  width: `${Math.min(pct, 100)}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          </div>
        )
      })}

      {upcomingEvents.length === 0 && (
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
