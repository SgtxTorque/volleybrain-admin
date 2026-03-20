// =============================================================================
// ParentFormsTab — V2 forms & waivers tab for parent dashboard
// Props-only.
// =============================================================================

export default function ParentFormsTab({
  priorityItems = [],
  onAction,
  onNavigate,
}) {
  const waiverItems = priorityItems.filter(i => i.actionType === 'waiver')

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {waiverItems.length > 0 ? (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 12 }}>
            Pending Forms
          </div>
          {waiverItems.map((item, i) => (
            <div
              key={i}
              onClick={() => onAction?.(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 0',
                borderBottom: i < waiverItems.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon || '📝'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                  {item.description}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--v2-amber)',
              }}>
                Sign →
              </span>
            </div>
          ))}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>✅</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-green)' }}>
            All forms complete!
          </div>
          <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 4 }}>
            No pending waivers or forms to sign.
          </div>
        </div>
      )}

      {/* View all waivers link */}
      <button
        onClick={() => onNavigate?.('waivers')}
        style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700, marginTop: 16,
          background: 'var(--v2-navy)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
        }}
      >
        View All Waivers →
      </button>
    </div>
  )
}
