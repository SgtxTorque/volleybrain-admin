// =============================================================================
// TMAttendanceTab — V2 RSVP summary for team manager dashboard body tabs
// Props-only. Shows next event info, RSVP stacked bar, legend, CTA.
// =============================================================================

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TMAttendanceTab({ data, loading, onNavigate }) {
  if (loading) return (
    <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13, fontFamily: 'var(--v2-font)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {!data ? (
        <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--v2-text-muted)' }}>No upcoming events</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              background: data.eventType === 'game' ? 'rgba(245,158,11,0.1)' : 'rgba(75,185,236,0.08)',
              color: data.eventType === 'game' ? 'var(--v2-amber)' : 'var(--v2-sky)',
              padding: '3px 8px', borderRadius: 6,
            }}>
              {data.eventType}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-text-primary)' }}>{data.title}</span>
            <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>{formatEventDate(data.eventDate)}</span>
          </div>

          {/* RSVP bar */}
          <div style={{ height: 8, borderRadius: 4, background: 'var(--v2-surface)', overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
            {data.confirmed > 0 && <div style={{ height: '100%', background: '#10B981', width: `${(data.confirmed / data.totalRoster) * 100}%` }} />}
            {data.maybe > 0 && <div style={{ height: '100%', background: '#F59E0B', width: `${(data.maybe / data.totalRoster) * 100}%` }} />}
            {data.declined > 0 && <div style={{ height: '100%', background: '#EF4444', width: `${(data.declined / data.totalRoster) * 100}%` }} />}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Confirmed {data.confirmed}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} /> Maybe {data.maybe}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} /> Declined {data.declined}
            </span>
            {data.noResponse > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--v2-text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--v2-surface)', display: 'inline-block' }} /> No Response {data.noResponse}
              </span>
            )}
          </div>

          {/* CTA */}
          <button onClick={() => onNavigate?.('attendance')} style={{
            width: '100%', padding: 10, borderRadius: 10,
            fontSize: 12, fontWeight: 700,
            background: 'var(--v2-navy)', color: '#FFFFFF',
            border: 'none', cursor: 'pointer',
          }}>
            Take Attendance &rarr;
          </button>
        </>
      )}
    </div>
  )
}
