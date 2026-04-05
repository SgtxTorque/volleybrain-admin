// =============================================================================
// CoachScheduleTab — V2 schedule list for coach dashboard body tabs
// Shows all upcoming events: practices, games, meetings, tournaments.
// Props-only.
// =============================================================================

import { parseLocalDate } from '../../../lib/date-helpers'

export default function CoachScheduleTab({
  upcomingEvents = [],
  rsvpCounts = {},
  rosterSize = 0,
  onEventClick,
  onNavigate,
}) {
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const typeColors = {
    game: { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', label: 'Game' },
    practice: { bg: 'rgba(59,130,246,0.08)', color: '#2563EB', label: 'Practice' },
    meeting: { bg: 'rgba(139,92,246,0.08)', color: '#7C3AED', label: 'Meeting' },
    tournament: { bg: 'rgba(245,158,11,0.08)', color: '#D97706', label: 'Tournament' },
    tryout: { bg: 'rgba(16,185,129,0.08)', color: '#059669', label: 'Tryout' },
  }

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '50px 1fr 80px 120px 100px',
        gap: 8, padding: '10px 24px',
        background: 'var(--v2-surface)',
        borderBottom: '1px solid var(--v2-border-subtle)',
      }}>
        {['Date', 'Event', 'Type', 'Location', 'RSVP'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Event rows */}
      {upcomingEvents.slice(0, 10).map((evt, i) => {
        const rsvp = rsvpCounts[evt.id] || {}
        const going = rsvp.going || 0
        const pending = Math.max(0, rosterSize - (rsvp.total || 0))
        const eventDate = parseLocalDate(evt.event_date)
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
        const dayNum = eventDate.getDate()
        const evtType = evt.event_type || 'event'
        const tc = typeColors[evtType] || { bg: 'var(--v2-surface)', color: 'var(--v2-text-muted)', label: evtType.replace('_', ' ') }

        return (
          <div
            key={evt.id || i}
            onClick={() => onEventClick?.(evt)}
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 80px 120px 100px',
              gap: 8, padding: '12px 24px',
              borderBottom: i < Math.min(upcomingEvents.length, 10) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Date */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>{dayName}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-text-primary)' }}>{dayNum}</div>
            </div>

            {/* Event name + time */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                {evt.title || evt.event_type?.replace('_', ' ') || 'Event'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                {formatTime(evt.event_time || evt.start_time)}
              </div>
            </div>

            {/* Type badge */}
            <div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                background: tc.bg, color: tc.color, textTransform: 'capitalize',
              }}>
                {tc.label}
              </span>
            </div>

            {/* Location */}
            <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {evt.location || 'TBD'}
            </div>

            {/* RSVP summary */}
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--v2-green)' }}>{going}</span>
              <span style={{ color: 'var(--v2-text-muted)' }}> going</span>
              {pending > 0 && (
                <span style={{ color: 'var(--v2-text-muted)' }}> · {pending} ?</span>
              )}
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

      {/* Footer */}
      {upcomingEvents.length > 0 && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--v2-border-subtle)' }}>
          <button
            onClick={() => onNavigate?.('schedule')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: 'var(--v2-sky)',
            }}
          >
            View Full Schedule &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
