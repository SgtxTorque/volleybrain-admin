// =============================================================================
// TMPaymentsTab — V2 payment health for team manager dashboard body tabs
// Props-only. Shows 3-stat grid, overdue highlight, send reminders CTA.
// =============================================================================

export default function TMPaymentsTab({ data, loading, onNavigate }) {
  if (loading) return (
    <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13, fontFamily: 'var(--v2-font)' }}>
      Loading...
    </div>
  )
  if (!data) return null

  const hasOverdue = data.overdueCount > 0
  const total = (data.collectedAmount || 0) + (data.overdueAmount || 0) + (data.pendingAmount || 0)
  const collectionPercent = total > 0 ? Math.round((data.collectedAmount / total) * 100) : 0

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{
          padding: 14, borderRadius: 10, textAlign: 'center',
          background: hasOverdue ? 'rgba(239,68,68,0.08)' : 'var(--v2-surface)',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: hasOverdue ? 'var(--v2-coral)' : 'var(--v2-text-primary)' }}>{data.overdueCount}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>Overdue</div>
          {hasOverdue && <div style={{ fontSize: 11, color: 'var(--v2-coral)', fontWeight: 600 }}>${data.overdueAmount.toLocaleString()}</div>}
        </div>
        <div style={{ padding: 14, borderRadius: 10, textAlign: 'center', background: 'var(--v2-surface)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-text-primary)' }}>{data.pendingCount}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>Pending</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, textAlign: 'center', background: 'rgba(16,185,129,0.08)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-green)' }}>${data.collectedAmount.toLocaleString()}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>Collected</div>
        </div>
      </div>

      {/* Collection progress bar */}
      {total > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--v2-text-muted)' }}>Collection Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-text-primary)' }}>{collectionPercent}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--v2-surface)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: collectionPercent >= 80 ? 'var(--v2-green)' : 'var(--v2-sky)',
              width: `${collectionPercent}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {hasOverdue && (
        <button onClick={() => onNavigate?.('payments')} style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700,
          background: 'var(--v2-coral)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
        }}>
          Send Reminders
        </button>
      )}
    </div>
  )
}
