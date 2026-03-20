// =============================================================================
// MascotNudge — V2 mascot avatar with message and action buttons
// Props-only.
// =============================================================================

export default function MascotNudge({
  emoji = '🐱',
  message,
  primaryAction,
  secondaryAction,
  variant = 'light',
}) {
  const isDark = variant === 'dark'

  return (
    <div style={{
      background: isDark ? 'var(--v2-card-bg)' : 'var(--v2-white)',
      borderRadius: 'var(--v2-radius)',
      boxShadow: isDark ? 'none' : 'var(--v2-card-shadow)',
      border: `1px solid var(--v2-border-subtle)`,
      padding: 20,
      display: 'flex',
      gap: 16,
      fontFamily: 'var(--v2-font)',
    }}>
      {/* Mascot avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: isDark
            ? 'rgba(255,215,0,0.06)'
            : 'linear-gradient(135deg, var(--v2-navy), var(--v2-midnight))',
          border: isDark ? '1px solid rgba(255,215,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          {emoji}
        </div>
        {/* Green dot */}
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 12, height: 12, borderRadius: '50%',
          background: 'var(--v2-green)',
          border: `2px solid ${isDark ? 'var(--v2-card-bg)' : 'var(--v2-white)'}`,
        }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Message */}
        <div style={{
          fontSize: 13.5, fontWeight: 500,
          color: 'var(--v2-text-primary)',
          lineHeight: 1.45,
          marginBottom: 12,
        }}>
          {message}
        </div>

        {/* Actions */}
        {(primaryAction || secondaryAction) && (
          <div style={{ display: 'flex', gap: 8 }}>
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  background: isDark ? 'var(--v2-gold)' : 'var(--v2-navy)',
                  color: isDark ? 'var(--v2-midnight)' : '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  background: 'transparent',
                  color: 'var(--v2-text-secondary)',
                  border: '1px solid var(--v2-border-subtle)',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
