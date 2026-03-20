// =============================================================================
// AdminPaymentsTab — V2 payments summary for admin dashboard tabs
// Props-only.
// =============================================================================

export default function AdminPaymentsTab({
  stats = {},
  monthlyPayments = [],
  onNavigate,
}) {
  const totalCollected = stats.totalCollected || 0
  const totalExpected = stats.totalExpected || 0
  const pastDue = stats.pastDue || 0
  const pct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Collected vs outstanding */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: 'rgba(16,185,129,0.08)',
          borderRadius: 10, padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-green)' }}>
            ${totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Collected
          </div>
        </div>
        <div style={{
          flex: 1, background: 'rgba(239,68,68,0.08)',
          borderRadius: 10, padding: '16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-coral)' }}>
            ${pastDue.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Outstanding
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-text-muted)', marginBottom: 6 }}>
          <span>Collection Rate</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--v2-surface)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: pct >= 75 ? 'var(--v2-green)' : pct >= 50 ? 'var(--v2-amber)' : 'var(--v2-coral)',
            width: `${Math.min(pct, 100)}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Monthly trend */}
      {monthlyPayments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10 }}>
            Monthly Trend
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
            {monthlyPayments.map((m, i) => {
              const maxVal = Math.max(...monthlyPayments.map(x => x.value || 0), 1)
              const heightPct = ((m.value || 0) / maxVal) * 100
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', borderRadius: 3,
                    background: 'var(--v2-sky)',
                    height: `${Math.max(heightPct, 4)}%`,
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--v2-text-muted)' }}>{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={() => onNavigate?.('payments')}
        style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700,
          background: 'var(--v2-navy)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
          transition: 'opacity 0.15s ease',
        }}
      >
        View All Payments →
      </button>
    </div>
  )
}
