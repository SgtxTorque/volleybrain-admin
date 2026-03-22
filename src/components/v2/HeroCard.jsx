// =============================================================================
// HeroCard — V2 base hero card for all role dashboards
// Props-only. Role-specific variants compose this in Phase 2-6.
// =============================================================================

export default function HeroCard({
  orgLine,
  greeting = '',
  subLine,
  mascotEmoji = '/images/mascots/waving.png',
  stats,
  levelBadge,
  xpBar,
  streakBadge,
  variant = 'light',
  className = '',
}) {
  const isPlayer = variant === 'player'
  const bgGradient = isPlayer
    ? 'linear-gradient(145deg, #132240, var(--v2-midnight))'
    : 'linear-gradient(145deg, var(--v2-navy) 0%, var(--v2-midnight) 100%)'

  const colorMap = {
    green: 'var(--v2-green)',
    red: 'var(--v2-coral)',
    sky: 'var(--v2-sky)',
    gold: 'var(--v2-gold)',
    amber: 'var(--v2-amber)',
    purple: 'var(--v2-purple)',
  }

  return (
    <div
      className={`v2-hero ${className}`}
      data-variant={variant}
      style={{
        background: bgGradient,
        borderRadius: 'var(--v2-radius)',
        padding: '28px 32px 24px',
        color: '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
        border: isPlayer ? '1px solid rgba(255,255,255,0.06)' : 'none',
        fontFamily: 'var(--v2-font)',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 200, height: 200,
        background: isPlayer
          ? 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(75,185,236,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ---- Top Row ---- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        {/* Left content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Org line or level badge */}
          {isPlayer && levelBadge ? (
            <div style={{ marginBottom: 8 }}>{levelBadge}</div>
          ) : orgLine ? (
            <div style={{
              fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--v2-sky)',
              marginBottom: 8,
            }}>
              {orgLine}
            </div>
          ) : null}

          {/* Greeting */}
          <div style={{
            fontSize: 22, fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {greeting}
          </div>

          {/* Sub line */}
          {subLine && (
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.5)',
              marginTop: 6,
            }}>
              {subLine}
            </div>
          )}
        </div>

        {/* Mascot */}
        <div style={{
          width: 72, height: 72, borderRadius: 16,
          background: isPlayer ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.06)',
          border: isPlayer ? '1px solid rgba(255,215,0,0.1)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, flexShrink: 0, marginLeft: 16,
          overflow: 'hidden',
        }}>
          {mascotEmoji && (mascotEmoji.startsWith('/') || mascotEmoji.startsWith('http')) ? (
            <img
              src={mascotEmoji}
              alt="Lynx mascot"
              style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover' }}
            />
          ) : (
            mascotEmoji
          )}
        </div>
      </div>

      {/* ---- XP Bar slot (player only) ---- */}
      {isPlayer && xpBar && (
        <div style={{ marginTop: 16 }}>{xpBar}</div>
      )}

      {/* ---- Stats Grid ---- */}
      {stats && stats.length > 0 && (
        <div
          className="v2-hero-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
            gap: 2,
            marginTop: 20,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {stats.map((stat, i) => {
            const Tag = stat.onClick ? 'button' : 'div'
            return (
              <Tag
                key={i}
                onClick={stat.onClick || undefined}
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.15s ease',
                  cursor: stat.onClick ? 'pointer' : 'default',
                  border: 'none', color: 'inherit', font: 'inherit',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  if (stat.onClick) e.currentTarget.style.transform = 'scale(1.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <div style={{
                  fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em',
                  color: stat.color ? (colorMap[stat.color] || '#FFFFFF') : '#FFFFFF',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
                  marginTop: 2,
                }}>
                  {stat.label}
                </div>
              </Tag>
            )
          })}
        </div>
      )}

      {/* ---- Streak badge slot (player only) ---- */}
      {isPlayer && streakBadge && (
        <div style={{ marginTop: 12 }}>{streakBadge}</div>
      )}

      {/* ---- Responsive ---- */}
      <style>{`
        @media (max-width: 700px) {
          .v2-hero-stats { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
