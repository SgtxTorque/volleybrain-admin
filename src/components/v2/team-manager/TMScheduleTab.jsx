// =============================================================================
// TMScheduleTab — V2 schedule list for team manager dashboard body tabs
// Props-only. Shows upcoming events with date, type badge, time, location.
// =============================================================================

function formatTime12(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const typeColors = {
  game: { bg: 'rgba(239,68,68,0.08)', color: '#DC2626' },
  practice: { bg: 'rgba(59,130,246,0.08)', color: '#2563EB' },
  meeting: { bg: 'rgba(139,92,246,0.08)', color: '#7C3AED' },
  tournament: { bg: 'rgba(245,158,11,0.08)', color: '#D97706' },
  tryout: { bg: 'rgba(16,185,129,0.08)', color: '#059669' },
}

export default function TMScheduleTab({ events = [], loading, onNavigate }) {
  if (loading) return (
    <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13, fontFamily: 'var(--v2-font)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--v2-font)' }}>
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 24px', fontSize: 13, color: 'var(--v2-text-muted)' }}>
          No upcoming events
        </div>
      ) : (
        <>
          {events.slice(0, 5).map((event, i) => {
            const evDate = new Date(event.event_date + 'T00:00:00')
            const evtType = event.event_type || 'event'
            const tc = typeColors[evtType] || { bg: 'var(--v2-surface)', color: 'var(--v2-text-muted)' }

            return (
              <div key={event.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 24px',
                borderBottom: i < Math.min(events.length, 5) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
              }}>
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                    {evDate.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-navy)' }}>{evDate.getDate()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                    {event.title || event.event_type}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                    {formatTime12(event.event_time)}{event.location ? ` \u00B7 ${event.location}` : ''}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  color: tc.color, background: tc.bg,
                  padding: '3px 8px', borderRadius: 6,
                }}>
                  {evtType}
                </span>
              </div>
            )
          })}

          {events.length > 0 && (
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
        </>
      )}
    </div>
  )
}
