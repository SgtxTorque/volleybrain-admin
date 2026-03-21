// =============================================================================
// AdminPaymentsTab — V2 payments summary for admin dashboard tabs
// Props-only. Compact 3-card row + recent payments list + monthly trend.
// =============================================================================

export default function AdminPaymentsTab({
  stats = {},
  monthlyPayments = [],
  recentPayments = [],
  onNavigate,
}) {
  const totalCollected = stats.totalCollected || 0
  const totalExpected = stats.totalExpected || 0
  const pastDue = stats.pastDue || 0
  const pct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* 3-card compact row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: 'rgba(16,185,129,0.08)',
          borderRadius: 10, padding: '14px 12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-green)' }}>
            ${totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Collected
          </div>
        </div>
        <div style={{
          flex: 1, background: 'rgba(239,68,68,0.08)',
          borderRadius: 10, padding: '14px 12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-coral)' }}>
            ${pastDue.toLocaleString()}
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Outstanding
          </div>
        </div>
        <div style={{
          flex: 1, background: 'var(--v2-surface)',
          borderRadius: 10, padding: '14px 12px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 20, fontWeight: 800,
            color: pct >= 75 ? 'var(--v2-green)' : pct >= 50 ? '#D97706' : 'var(--v2-coral)',
          }}>
            {pct}%
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Collection Rate
          </div>
        </div>
      </div>

      {/* Recent payments list */}
      {recentPayments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 8, letterSpacing: '0.04em' }}>
            Recent Payments
          </div>
          {recentPayments.slice(0, 8).map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < Math.min(recentPayments.length, 8) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                  {p.lineItem} · {p.date}
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: 'var(--v2-green)',
                flexShrink: 0, marginLeft: 12,
              }}>
                {p.amount}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Monthly trend */}
      {monthlyPayments.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10, letterSpacing: '0.04em' }}>
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
