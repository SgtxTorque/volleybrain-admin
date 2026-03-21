// =============================================================================
// AdminPaymentsTab — V2 family-level collections worklist for admin dashboard
// Props-only. Summary row + family table + monthly trend + footer.
// =============================================================================

export default function AdminPaymentsTab({
  stats = {},
  monthlyPayments = [],
  paymentFamilies = [],
  onNavigate,
}) {
  const totalCollected = stats.totalCollected || 0
  const totalOutstanding = stats.pastDue || 0
  const totalExpected = stats.totalExpected || 0
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
  const overdueCount = paymentFamilies.filter(f =>
    f.earliestDueDate && new Date(f.earliestDueDate) < new Date()
  ).length

  const getStatus = (family) => {
    if (family.needsApproval) return { label: 'Needs Approval', bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' }
    if (family.totalDue === 0 && family.totalPaid > 0) return { label: 'Paid', bg: 'rgba(16,185,129,0.1)', color: '#059669' }
    if (family.earliestDueDate && new Date(family.earliestDueDate) < new Date()) return { label: 'Overdue', bg: 'rgba(239,68,68,0.1)', color: '#DC2626' }
    if (family.totalPaid > 0 && family.totalDue > 0) return { label: 'Partial', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' }
    return { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' }
  }

  const feeTypeColors = {
    registration: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
    uniform: { bg: 'rgba(75,185,236,0.1)', color: '#2E8BC0' },
    monthly: { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
    dues: { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
    tournament: { bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
  }
  const defaultFeeColor = { bg: 'var(--v2-surface)', color: 'var(--v2-text-muted)' }

  const methodBadge = (method) => {
    if (method === 'stripe') return { label: 'Stripe', bg: 'rgba(75,185,236,0.1)', color: '#2E8BC0' }
    if (method === 'manual') return { label: 'Manual', bg: 'rgba(245,158,11,0.1)', color: '#D97706' }
    if (method === 'zelle') return { label: 'Zelle', bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' }
    if (method === 'venmo') return { label: 'Venmo', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' }
    if (method === 'cashapp') return { label: 'Cash App', bg: 'rgba(16,185,129,0.1)', color: '#059669' }
    if (method === 'cash' || method === 'check' || method === 'cash_check') return { label: 'Cash/Check', bg: 'rgba(245,158,11,0.1)', color: '#D97706' }
    return null
  }

  const formatDueDate = (family) => {
    if (!family.earliestDueDate) return '—'
    const due = new Date(family.earliestDueDate)
    const now = new Date()
    const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24))
    if (diffDays > 0) return `Overdue ${diffDays}d`
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Deduplicate line items by fee type, showing unpaid amounts
  const getUnpaidLineItems = (family) => {
    const byType = {}
    for (const item of family.lineItems) {
      if (item.paid) continue
      const type = item.feeType || 'Other'
      if (!byType[type]) byType[type] = 0
      byType[type] += item.amount
    }
    return Object.entries(byType).map(([type, amount]) => ({ type, amount }))
  }

  // Determine primary payment method for the family
  const getPrimaryMethod = (family) => {
    const methods = family.lineItems.map(i => i.method).filter(Boolean)
    if (methods.length === 0) return null
    // Most common method
    const counts = {}
    for (const m of methods) { counts[m] = (counts[m] || 0) + 1 }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Summary row */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 20,
        background: 'var(--v2-surface)', borderRadius: 10, padding: '16px 20px',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Collected', value: `$${totalCollected.toLocaleString()}`, color: 'var(--v2-green)' },
          { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, color: 'var(--v2-coral)' },
          { label: 'Collection Rate', value: `${collectionRate}%`, color: collectionRate >= 75 ? 'var(--v2-green)' : collectionRate >= 50 ? '#D97706' : 'var(--v2-coral)' },
          { label: 'Overdue', value: overdueCount, color: overdueCount > 0 ? 'var(--v2-coral)' : 'var(--v2-text-muted)' },
        ].map((m, i) => (
          <div key={i} style={{ flex: '1 1 0', minWidth: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2, letterSpacing: '0.03em' }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Family payments table */}
      {paymentFamilies.length === 0 ? (
        <div style={{
          padding: '28px 16px', textAlign: 'center', marginBottom: 20,
          background: 'rgba(16,185,129,0.06)', borderRadius: 10,
          border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>&#10003;</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-green)' }}>
            All payments are current
          </div>
          <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 2 }}>
            No outstanding balances for this season.
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 140px 100px 1fr 80px 100px 90px',
            gap: 8, padding: '10px 12px',
            background: 'var(--v2-surface)',
            borderRadius: '10px 10px 0 0',
            borderBottom: '1px solid var(--v2-border-subtle)',
          }}>
            {['Family', 'Players', 'Amount Due', 'Line Items', 'Method', 'Status', 'Due Date'].map((h, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--v2-text-muted)', letterSpacing: '0.05em',
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Family rows */}
          {paymentFamilies.slice(0, 10).map((family, i) => {
            const status = getStatus(family)
            const unpaidItems = getUnpaidLineItems(family)
            const primaryMethod = getPrimaryMethod(family)
            const mBadge = primaryMethod ? methodBadge(primaryMethod) : null
            const isOverdue = family.earliestDueDate && new Date(family.earliestDueDate) < new Date()

            return (
              <div
                key={family.parentKey || i}
                onClick={() => onNavigate?.('payments')}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 140px 100px 1fr 80px 100px 90px',
                  gap: 8, padding: '12px 12px',
                  borderBottom: i < Math.min(paymentFamilies.length, 10) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Family */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {family.parentName}
                  </div>
                  {family.parentEmail && (
                    <div style={{ fontSize: 11, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {family.parentEmail}
                    </div>
                  )}
                </div>

                {/* Players */}
                <div style={{ fontSize: 12.5, color: 'var(--v2-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {family.children.join(', ') || '—'}
                </div>

                {/* Amount Due */}
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: isOverdue ? '#DC2626' : family.totalDue > 0 ? 'var(--v2-text-primary)' : 'var(--v2-green)',
                }}>
                  ${family.totalDue.toLocaleString()}
                </div>

                {/* Line Items */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 0 }}>
                  {unpaidItems.length > 0 ? unpaidItems.map((item, j) => {
                    const fc = feeTypeColors[item.type.toLowerCase()] || defaultFeeColor
                    return (
                      <span key={j} style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: fc.bg, color: fc.color, whiteSpace: 'nowrap',
                      }}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} ${item.amount.toLocaleString()}
                      </span>
                    )
                  }) : (
                    <span style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>—</span>
                  )}
                </div>

                {/* Method */}
                <div>
                  {mBadge ? (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: mBadge.bg, color: mBadge.color,
                    }}>
                      {mBadge.label}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: status.bg, color: status.color, whiteSpace: 'nowrap',
                  }}>
                    {status.label}
                  </span>
                </div>

                {/* Due Date */}
                <div style={{
                  fontSize: 12, fontWeight: isOverdue ? 700 : 500,
                  color: isOverdue ? '#DC2626' : 'var(--v2-text-muted)',
                }}>
                  {formatDueDate(family)}
                </div>
              </div>
            )
          })}

          {paymentFamilies.length > 10 && (
            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                +{paymentFamilies.length - 10} more families
              </span>
            </div>
          )}
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

      {/* Footer action */}
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
        View All Payments &rarr;
      </button>
    </div>
  )
}
