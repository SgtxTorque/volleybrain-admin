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

  const typeConfig = {
    practice:   { color: '#4BB9EC', bg: 'rgba(75,185,236,0.1)' },
    game:       { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    tournament: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    meeting:    { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    team_event: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    other:      { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {events.length === 0 ? (
        <div style={{
          padding: '32px 16px', textAlign: 'center',
          fontSize: 13, color: 'var(--v2-text-muted)',
        }}>
          No upcoming events
        </div>
      ) : (
        <div style={{
          borderRadius: 10,
          border: '0.5px solid var(--v2-border-subtle, rgba(148,163,184,0.2))',
          overflow: 'hidden', marginBottom: 16,
        }}>
          {events.slice(0, 8).map((evt, i) => {
            const eventDate = parseLocalDate(evt.event_date)
            const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
            const dayNum = eventDate.getDate()
            const monthName = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
            const isToday = eventDate.toDateString() === new Date().toDateString()
            const type = (evt.event_type || 'other').toLowerCase()
            const isGame = type === 'game'
            const config = typeConfig[type] || typeConfig.other

            return (
              <div
                key={evt.id || i}
                onClick={() => onNavigate?.('schedule')}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  borderBottom: i < Math.min(events.length, 8) - 1 ? '1px solid var(--v2-border-subtle, rgba(148,163,184,0.15))' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  background: isGame ? 'var(--v2-navy, #10284C)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isGame) e.currentTarget.style.background = 'var(--v2-surface)' }}
                onMouseLeave={e => { if (!isGame) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Left accent bar */}
                <div style={{
                  width: 3, flexShrink: 0,
                  background: config.color,
                  borderRadius: '3px 0 0 3px',
                }} />

                {/* Date column */}
                <div style={{
                  width: 48, textAlign: 'center', flexShrink: 0,
                  padding: '10px 4px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    color: isGame ? 'rgba(255,255,255,0.5)' : 'var(--v2-text-muted)',
                  }}>
                    {dayName}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 800, lineHeight: 1.1,
                    color: isToday ? '#4BB9EC' : isGame ? '#FFFFFF' : 'var(--v2-text-primary)',
                  }}>
                    {dayNum}
                  </div>
                  <div style={{
                    fontSize: 8, fontWeight: 600, letterSpacing: '0.05em',
                    color: isGame ? 'rgba(255,255,255,0.4)' : 'var(--v2-text-muted)',
                  }}>
                    {monthName}
                  </div>
                </div>

                {/* Event details */}
                <div style={{ flex: 1, minWidth: 0, padding: '10px 8px' }}>
                  {/* Team name + event type small labels */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: isGame ? '#4BB9EC' : '#4BB9EC',
                    }}>
                      {evt.teams?.name || 'All Teams'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      color: isGame ? 'rgba(255,255,255,0.4)' : 'var(--v2-text-muted)',
                    }}>
                      {type}
                    </span>
                  </div>

                  {/* Event title */}
                  <div style={{
                    fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
                    color: isGame ? '#FFFFFF' : 'var(--v2-text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {evt.title || evt.event_type}
                  </div>

                  {/* Time + location */}
                  <div style={{
                    fontSize: 11, marginTop: 1,
                    color: isGame ? 'rgba(255,255,255,0.5)' : 'var(--v2-text-muted)',
                  }}>
                    {formatTime(evt.event_time || evt.start_time)}
                    {evt.end_time && ` — ${formatTime(evt.end_time)}`}
                    {(evt.venue_name || evt.location) && ` · ${evt.venue_name || evt.location}`}
                  </div>
                </div>

                {/* Event type badge pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 6,
                    background: isGame ? 'rgba(255,255,255,0.1)' : config.bg,
                    color: isGame ? '#FFFFFF' : config.color,
                    whiteSpace: 'nowrap',
                  }}>
                    {type}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {events.length > 8 && (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
            +{events.length - 8} more events
          </span>
        </div>
      )}

      {/* Action */}
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
        View Full Schedule &rarr;
      </button>
    </div>
  )
}
