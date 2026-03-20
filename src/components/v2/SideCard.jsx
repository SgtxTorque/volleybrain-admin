// =============================================================================
// SideCard — V2 thin wrapper for sidebar cards
// Avoids repeating container styles across WeeklyLoad, ThePlaybook, etc.
// Props-only.
// =============================================================================

export default function SideCard({
  children,
  variant = 'light',
  className = '',
}) {
  const isDark = variant === 'dark'

  return (
    <div
      className={className}
      style={{
        background: isDark ? 'var(--v2-card-bg)' : 'var(--v2-white)',
        borderRadius: 'var(--v2-radius)',
        boxShadow: isDark ? 'none' : 'var(--v2-card-shadow)',
        border: '1px solid var(--v2-border-subtle)',
        padding: '18px 20px',
        fontFamily: 'var(--v2-font)',
      }}
    >
      {children}
    </div>
  )
}
