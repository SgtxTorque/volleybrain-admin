// =============================================================================
// TMRosterTab — V2 roster status for team manager dashboard body tabs
// Props-only. Shows fill bar, status badge, pending count, CTA.
// =============================================================================

export default function TMRosterTab({ data, rosterCount, loading, onNavigate }) {
  if (loading) return (
    <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13, fontFamily: 'var(--v2-font)' }}>
      Loading...
    </div>
  )
  if (!data) return null

  const fillPercent = data.capacity > 0 ? Math.min(100, (data.filled / data.capacity) * 100) : 0

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--v2-text-primary)' }}>{rosterCount}</div>
          <div style={{ fontSize: 13, color: 'var(--v2-text-muted)' }}>
            {data.capacity > 0 ? `of ${data.capacity} spots filled` : 'players rostered'}
          </div>
        </div>
        {data.pendingCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            background: 'rgba(245,158,11,0.1)', color: 'var(--v2-amber)',
            padding: '4px 10px', borderRadius: 6,
          }}>
            {data.pendingCount} pending
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          background: data.isOpen ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          color: data.isOpen ? 'var(--v2-green)' : 'var(--v2-coral)',
          padding: '4px 10px', borderRadius: 6,
        }}>
          {data.isOpen ? 'Open' : 'Full'}
        </span>
      </div>

      {data.capacity > 0 && (
        <div style={{ height: 8, borderRadius: 4, background: 'var(--v2-surface)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: fillPercent >= 90 ? 'var(--v2-amber)' : 'var(--v2-sky)',
            width: `${fillPercent}%`, transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      <button onClick={() => onNavigate?.('roster')} style={{
        width: '100%', padding: 10, borderRadius: 10,
        fontSize: 12, fontWeight: 700, marginTop: 16,
        background: 'var(--v2-navy)', color: '#FFFFFF',
        border: 'none', cursor: 'pointer',
      }}>
        View Full Roster &rarr;
      </button>
    </div>
  )
}
