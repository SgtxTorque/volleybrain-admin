// =============================================================================
// OrgHealthCard — V2 admin sidebar card with colored progress bars
// Props-only.
// =============================================================================

export default function OrgHealthCard({
  title = 'Org Health',
  metrics = [],
}) {
  const colorMap = {
    sky: 'var(--v2-sky)',
    green: 'var(--v2-green)',
    red: 'var(--v2-coral)',
    purple: 'var(--v2-purple)',
    amber: 'var(--v2-amber)',
  }

  return (
    <div style={{
      background: 'var(--v2-white)',
      borderRadius: 'var(--v2-radius)',
      boxShadow: 'var(--v2-card-shadow)',
      border: '1px solid var(--v2-border-subtle)',
      padding: '18px 20px',
      fontFamily: 'var(--v2-font)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--v2-text-muted)',
        marginBottom: 14,
      }}>
        {title}
      </div>

      {/* Metric rows */}
      {metrics.map((metric, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 0',
          }}
        >
          {/* Label */}
          <div style={{
            width: 90, flexShrink: 0,
            fontSize: 12.5, fontWeight: 500,
            color: 'var(--v2-text-secondary)',
          }}>
            {metric.label}
          </div>

          {/* Bar */}
          <div style={{
            flex: 1,
            height: 5, borderRadius: 3,
            background: 'var(--v2-surface)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: colorMap[metric.color] || 'var(--v2-sky)',
              width: `${Math.min(metric.percentage, 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Value */}
          <div style={{
            width: 46, textAlign: 'right', flexShrink: 0,
            fontSize: 12.5, fontWeight: 700,
            color: metric.isAlert ? 'var(--v2-coral)' : 'var(--v2-text-primary)',
          }}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}
