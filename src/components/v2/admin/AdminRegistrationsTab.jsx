// =============================================================================
// AdminRegistrationsTab — V2 registrations summary for admin dashboard tabs
// Props-only. Compact 1x6 stat chips + view all.
// =============================================================================

export default function AdminRegistrationsTab({
  stats = {},
  onNavigate,
}) {
  const items = [
    { label: 'Total', value: stats.totalRegistrations || 0, color: 'var(--v2-text-primary)', bg: 'var(--v2-surface)' },
    { label: 'Pending', value: stats.pending || 0, color: (stats.pending || 0) > 0 ? '#D97706' : 'var(--v2-text-muted)', bg: (stats.pending || 0) > 0 ? 'rgba(245,158,11,0.08)' : 'var(--v2-surface)' },
    { label: 'Approved', value: stats.approved || 0, color: 'var(--v2-green)', bg: 'rgba(16,185,129,0.08)' },
    { label: 'Rostered', value: stats.rostered || stats.rosteredPlayers || 0, color: 'var(--v2-sky)', bg: 'rgba(75,185,236,0.08)' },
    { label: 'Waitlisted', value: stats.waitlisted || 0, color: 'var(--v2-purple)', bg: 'rgba(139,92,246,0.08)' },
    { label: 'Denied', value: stats.denied || 0, color: 'var(--v2-coral)', bg: 'rgba(239,68,68,0.08)' },
  ]

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Compact 1x6 stat chips */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            flex: '1 1 0',
            minWidth: 80,
            background: item.bg,
            borderRadius: 10, padding: '12px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2, letterSpacing: '0.03em' }}>
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

      {/* Registration funnel visual */}
      <div style={{
        padding: 16, background: 'var(--v2-surface)', borderRadius: 10,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10, letterSpacing: '0.04em' }}>
          Registration Funnel
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'Submitted', count: stats.totalRegistrations || 0, color: 'var(--v2-text-primary)' },
            { label: 'Approved', count: stats.approved || 0, color: 'var(--v2-green)' },
            { label: 'Rostered', count: stats.rostered || stats.rosteredPlayers || 0, color: 'var(--v2-sky)' },
          ].map((step, i) => {
            const total = stats.totalRegistrations || 1
            const pct = Math.max(4, (step.count / total) * 100)
            return (
              <div key={i} style={{ flex: `${pct} 0 0`, minWidth: 40 }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: step.color, opacity: 0.7,
                  marginBottom: 4,
                }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: step.color, textAlign: 'center' }}>
                  {step.count}
                </div>
                <div style={{ fontSize: 9, color: 'var(--v2-text-muted)', textAlign: 'center' }}>
                  {step.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
