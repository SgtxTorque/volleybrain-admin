// =============================================================================
// AttentionStrip — V2 attention/alert banner with pulsing dot
// Props-only. Variants: urgent (red), warning (amber), info (sky).
// =============================================================================

export default function AttentionStrip({
  message = '',
  ctaLabel,
  onClick,
  variant = 'urgent',
  isExpanded = false,
  expandedContent,
}) {
  const themes = {
    urgent: {
      bg: '#FEF2F2', borderColor: 'var(--v2-red)', dotColor: 'var(--v2-red)',
      hoverBg: '#FEE2E2',
    },
    warning: {
      bg: '#FFFBEB', borderColor: 'var(--v2-amber)', dotColor: 'var(--v2-amber)',
      hoverBg: '#FEF3C7',
    },
    info: {
      bg: '#EFF6FF', borderColor: 'var(--v2-sky)', dotColor: 'var(--v2-sky)',
      hoverBg: '#DBEAFE',
    },
  }

  const t = themes[variant] || themes.urgent

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: t.bg,
        borderLeft: `3px solid ${t.borderColor}`,
        borderRadius: 'var(--v2-radius)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        fontFamily: 'var(--v2-font)',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = t.hoverBg }}
      onMouseLeave={e => e.currentTarget.style.background = t.bg}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left — dot + message */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="v2-attention-dot" style={{
            width: 8, height: 8, borderRadius: '50%',
            background: t.dotColor, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 13.5, fontWeight: 600,
            color: 'var(--v2-text-primary)',
          }}>
            {message}
          </span>
        </div>

        {/* CTA */}
        {ctaLabel && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: 'var(--v2-sky)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            marginLeft: 12,
          }}>
            {ctaLabel}
          </span>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && expandedContent && (
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          marginTop: 12,
          paddingTop: 12,
        }}>
          {expandedContent}
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes v2-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .v2-attention-dot {
          animation: v2-pulse 2s infinite;
        }
      `}</style>
    </div>
  )
}
