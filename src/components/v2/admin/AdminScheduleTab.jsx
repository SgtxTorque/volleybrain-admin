// =============================================================================
// AdminScheduleTab — V2 upcoming events list for admin dashboard tabs
// Props-only.
// =============================================================================

import { parseLocalDate } from '../../../lib/date-helpers'

export default function AdminScheduleTab({
  events = [],
  onNavigate,
}) {
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const typeColors = {
    practice: 'var(--v2-sky)',
    game: 'var(--v2-coral)',
    tournament: 'var(--v2-purple)',
    meeting: 'var(--v2-amber)',
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {events.slice(0, 8).map((evt, i) => {
        const eventDate = parseLocalDate(evt.event_date)
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
        const dayNum = eventDate.getDate()
        const monthName = eventDate.toLocaleDateString('en-US', { month: 'short' })
        const isToday = eventDate.toDateString() === new Date().toDateString()
        const typeColor = typeColors[evt.event_type?.toLowerCase()] || 'var(--v2-sky)'

        return (
          <div
            key={i}
            onClick={() => onNavigate?.('schedule')}
            style={{
              display: 'flex', gap: 14, padding: '14px 24px',
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
                color: isToday ? 'var(--v2-sky)' : 'var(--v2-text-primary)',
              }}>
                {dayNum}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--v2-text-muted)', textTransform: 'uppercase' }}>
                {monthName}
              </div>
            </div>

            {/* Event info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                  {evt.title || evt.event_type}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                {evt.teams?.name && <span>{evt.teams.name} · </span>}
                {formatTime(evt.event_time || evt.start_time)}
                {evt.location && <span> · {evt.location}</span>}
              </div>
            </div>

            {/* Type badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: typeColor, flexShrink: 0,
            }}>
              {evt.event_type || 'Event'}
            </span>
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

      {/* Action */}
      {events.length > 0 && (
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--v2-border-subtle)' }}>
          <button
            onClick={() => onNavigate?.('schedule')}
            style={{
              width: '100%', padding: 10, borderRadius: 10,
              fontSize: 12, fontWeight: 700,
              background: 'var(--v2-navy)', color: '#FFFFFF',
              border: 'none', cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            View Full Schedule →
          </button>
        </div>
      )}
    </div>
  )
}
