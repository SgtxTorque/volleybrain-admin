// =============================================================================
// AdminRegistrationsTab — V2 registrations summary for admin dashboard tabs
// Props-only.
// =============================================================================

export default function AdminRegistrationsTab({
  stats = {},
  onNavigate,
}) {
  const items = [
    { label: 'Total Registrations', value: stats.totalRegistrations || 0, color: 'var(--v2-text-primary)' },
    { label: 'Pending Review', value: stats.pending || 0, color: stats.pending > 0 ? 'var(--v2-amber)' : 'var(--v2-text-muted)' },
    { label: 'Approved', value: stats.approved || 0, color: 'var(--v2-green)' },
    { label: 'Rostered', value: stats.rostered || stats.rosteredPlayers || 0, color: 'var(--v2-sky)' },
    { label: 'Waitlisted', value: stats.waitlisted || 0, color: 'var(--v2-purple)' },
    { label: 'Denied/Withdrawn', value: stats.denied || 0, color: 'var(--v2-coral)' },
  ]

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Summary grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background: 'var(--v2-surface)',
            borderRadius: 10, padding: '14px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      {stats.capacity > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-text-muted)', marginBottom: 6 }}>
            <span>Capacity</span>
            <span>{stats.totalRegistrations || 0} / {stats.capacity}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--v2-surface)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'var(--v2-sky)',
              width: `${Math.min(100, ((stats.totalRegistrations || 0) / stats.capacity) * 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => onNavigate?.('registrations')}
        style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700,
          background: 'var(--v2-navy)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
          transition: 'opacity 0.15s ease',
        }}
      >
        View All Registrations →
      </button>
    </div>
  )
}
