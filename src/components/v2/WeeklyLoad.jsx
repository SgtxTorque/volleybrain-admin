// =============================================================================
// WeeklyLoad — V2 side-card with day-by-day event list
// Props-only.
// =============================================================================

export default function WeeklyLoad({
  title = 'Weekly Load',
  dateRange,
  events = [],
  variant = 'light',
}) {
  const isDark = variant === 'dark'

  return (
    <div style={{
      background: isDark ? 'var(--v2-card-bg)' : 'var(--v2-white)',
      borderRadius: 'var(--v2-radius)',
      boxShadow: isDark ? 'none' : 'var(--v2-card-shadow)',
      border: `1px solid ${isDark ? 'var(--v2-border-subtle)' : 'var(--v2-border-subtle)'}`,
      padding: '18px 20px',
      fontFamily: 'var(--v2-font)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--v2-text-muted)',
        }}>
          {title}
        </span>
        {dateRange && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--v2-sky)',
          }}>
            {dateRange}
          </span>
        )}
      </div>

      {/* Event rows */}
      {events.map((event, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 12, padding: '10px 0',
            borderBottom: i < events.length - 1
              ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--v2-border-subtle)'}`
              : 'none',
          }}
        >
          {/* Day column */}
          <div style={{ width: 42, textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              color: 'var(--v2-text-muted)',
            }}>
              {event.dayName}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 800,
              color: event.isToday
                ? (isDark ? 'var(--v2-gold)' : 'var(--v2-sky)')
                : 'var(--v2-text-primary)',
            }}>
              {event.dayNum}
            </div>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: 'var(--v2-text-primary)',
            }}>
              {event.title}
            </div>
            {event.meta && (
              <div style={{
                fontSize: 11.5, color: 'var(--v2-text-muted)',
                marginTop: 2,
              }}>
                {event.meta}
              </div>
            )}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div style={{
          fontSize: 13, color: 'var(--v2-text-muted)',
          textAlign: 'center', padding: '16px 0',
        }}>
          No events this week
        </div>
      )}
    </div>
  )
}
