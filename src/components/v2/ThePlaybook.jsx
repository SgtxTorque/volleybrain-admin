// =============================================================================
// ThePlaybook — V2 side-card with grid of action buttons
// Props-only.
// =============================================================================

export default function ThePlaybook({
  title = 'The Playbook',
  actions = [],
  columns = 3,
  variant = 'light',
}) {
  const isDark = variant === 'dark'

  return (
    <div style={{
      background: isDark ? 'var(--v2-card-bg)' : 'var(--v2-white)',
      borderRadius: 'var(--v2-radius)',
      boxShadow: isDark ? 'none' : 'var(--v2-card-shadow)',
      border: `1px solid var(--v2-border-subtle)`,
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

      {/* Action grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 10,
      }}>
        {actions.map((action, i) => {
          const isPrimary = action.isPrimary

          const baseBg = isPrimary
            ? (isDark ? 'rgba(255,215,0,0.1)' : 'var(--v2-navy)')
            : (isDark ? 'rgba(255,255,255,0.03)' : 'var(--v2-surface)')

          const baseBorder = isPrimary
            ? (isDark ? '1px solid rgba(255,215,0,0.15)' : '1px solid transparent')
            : (isDark ? '1px solid var(--v2-border-subtle)' : '1px solid transparent')

          const labelColor = isPrimary
            ? (isDark ? 'var(--v2-gold)' : '#FFFFFF')
            : (isDark ? 'var(--v2-text-secondary)' : 'var(--v2-text-secondary)')

          const hoverBg = isPrimary
            ? (isDark ? 'rgba(255,215,0,0.15)' : 'var(--v2-navy)')
            : (isDark ? 'rgba(255,255,255,0.06)' : 'var(--v2-white)')

          return (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
                padding: '16px 8px', borderRadius: 12,
                background: baseBg,
                border: baseBorder,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--v2-font)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = hoverBg
                if (!isPrimary && !isDark) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = baseBg
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <span style={{ fontSize: 20 }}>{action.emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: labelColor,
              }}>
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
