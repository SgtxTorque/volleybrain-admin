// =============================================================================
// MilestoneCard — V2 XP progress card
// Variants: gold (admin), sky (coach), standard (parent/player).
// Props-only.
// =============================================================================

export default function MilestoneCard({
  trophy = '🏆',
  title,
  subtitle,
  xpCurrent,
  xpTarget,
  variant = 'gold',
  onClick,
}) {
  const pct = xpTarget > 0 ? Math.min((xpCurrent / xpTarget) * 100, 100) : 0

  const themes = {
    gold: {
      bg: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '1px solid rgba(245,158,11,0.15)',
      trackBg: 'rgba(245,158,11,0.2)',
      fillColor: 'var(--v2-gold)',
      shadow: 'none',
    },
    sky: {
      bg: 'var(--v2-white)',
      border: '1px solid var(--v2-border-subtle)',
      trackBg: 'rgba(75,185,236,0.15)',
      fillColor: 'var(--v2-sky)',
      shadow: 'var(--v2-card-shadow)',
    },
    standard: {
      bg: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '1px solid rgba(245,158,11,0.15)',
      trackBg: 'rgba(245,158,11,0.2)',
      fillColor: 'var(--v2-gold)',
      shadow: 'none',
    },
  }

  const t = themes[variant] || themes.gold

  return (
    <div
      onClick={onClick}
      style={{
        background: t.bg,
        borderRadius: 'var(--v2-radius)',
        padding: '18px 20px',
        border: t.border,
        boxShadow: t.shadow,
        fontFamily: 'var(--v2-font)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = t.shadow } }}
    >
      {/* Top row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 24 }}>{trophy}</span>
        <div>
          <div style={{
            fontSize: 12.5, fontWeight: 700,
            color: 'var(--v2-text-primary)',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 11,
              color: 'var(--v2-text-secondary)',
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* XP bar */}
      <div style={{
        height: 4, borderRadius: 2,
        background: t.trackBg,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: t.fillColor,
          width: `${pct}%`,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* XP text */}
      <div style={{
        fontSize: 10.5,
        color: 'var(--v2-text-muted)',
        textAlign: 'right',
        marginTop: 4,
      }}>
        {xpCurrent.toLocaleString()} / {xpTarget.toLocaleString()} XP
      </div>
    </div>
  )
}
