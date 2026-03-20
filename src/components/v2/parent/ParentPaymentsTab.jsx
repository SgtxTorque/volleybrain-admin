// =============================================================================
// ParentPaymentsTab — V2 payment summary for parent dashboard tabs
// Props-only.
// =============================================================================

export default function ParentPaymentsTab({
  paymentSummary = {},
  onPayNow,
  onViewAll,
}) {
  const { totalDue = 0, totalPaid = 0, unpaidItems = [] } = paymentSummary

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: totalDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          borderRadius: 10, padding: 16, textAlign: 'center',
        }}>
          <div style={{
            fontSize: 24, fontWeight: 800,
            color: totalDue > 0 ? 'var(--v2-coral)' : 'var(--v2-green)',
          }}>
            ${totalDue.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            {totalDue > 0 ? 'Balance Due' : 'All Paid!'}
          </div>
        </div>
        <div style={{
          flex: 1, background: 'rgba(16,185,129,0.08)',
          borderRadius: 10, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-green)' }}>
            ${totalPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Paid
          </div>
        </div>
      </div>

      {/* Unpaid items */}
      {unpaidItems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10 }}>
            Outstanding
          </div>
          {unpaidItems.slice(0, 5).map((item, i) => (
            <div key={item.id || i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < unpaidItems.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                  {item.fee_type ? item.fee_type.charAt(0).toUpperCase() + item.fee_type.slice(1) : 'Fee'}
                </div>
                {item.due_date && (
                  <div style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                    Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-coral)' }}>
                ${(item.amount || 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {totalDue > 0 && (
        <button
          onClick={onPayNow}
          style={{
            width: '100%', padding: 10, borderRadius: 10,
            fontSize: 12, fontWeight: 700,
            background: 'var(--v2-sky)', color: 'var(--v2-navy)',
            border: 'none', cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
        >
          Pay Balance Now →
        </button>
      )}
    </div>
  )
}
