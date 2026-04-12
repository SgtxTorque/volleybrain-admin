// =============================================================================
// BodyTabs — V2 tab container shell
// Props-only. Tab content wired per-role in Phases 2-6.
// =============================================================================

export default function BodyTabs({
  tabs = [],
  activeTabId = '',
  onTabChange,
  children,
  footerLink,
  variant = 'light',
}) {
  const isDark = variant === 'dark'

  return (
    <div style={{
      background: isDark ? 'var(--v2-card-bg)' : 'var(--v2-white)',
      borderRadius: 'var(--v2-radius)',
      boxShadow: isDark ? 'none' : 'var(--v2-card-shadow)',
      border: `1px solid ${isDark ? 'var(--v2-border-subtle)' : 'var(--v2-border-subtle)'}`,
      overflow: 'hidden',
      fontFamily: 'var(--v2-font)',
    }}>
      {/* ---- Tab Navigation ---- */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--v2-border-subtle)'}`,
        padding: '0 24px',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              style={{
                padding: '14px 0',
                marginRight: 28,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderBottom: `2px solid ${isActive
                  ? (isDark ? 'var(--v2-gold)' : 'var(--v2-navy)')
                  : 'transparent'
                }`,
                background: 'transparent',
                cursor: 'pointer',
                color: isActive
                  ? (isDark ? 'var(--v2-gold)' : 'var(--v2-navy)')
                  : 'var(--v2-text-muted)',
                transition: 'color 0.15s ease, border-color 0.15s ease',
                whiteSpace: 'nowrap',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {tab.label}
              {tab.badge != null && tab.badge !== false && tab.badge !== 0 && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: tab.badgeColor || (isDark ? 'var(--v2-gold)' : 'var(--v2-navy)'),
                  color: isDark ? 'var(--v2-midnight)' : '#FFFFFF',
                  fontSize: 10, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {tab.badgeIcon || tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ---- Tab Content ---- */}
      <div>
        {children}
      </div>

      {/* ---- Footer Link ---- */}
      {footerLink && (
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'var(--v2-border-subtle)'}`,
          textAlign: 'center',
        }}>
          <button
            onClick={footerLink.onClick}
            style={{
              fontSize: 12, fontWeight: 600,
              color: 'var(--v2-sky)',
              background: 'transparent', border: 'none',
              cursor: 'pointer',
            }}
          >
            {footerLink.label}
          </button>
        </div>
      )}
    </div>
  )
}
