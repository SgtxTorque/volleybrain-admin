// =============================================================================
// BadgeShowcase — V2 badge list for parent dashboard sidebar
// Props-only.
// =============================================================================

export default function BadgeShowcase({
  badges = [],
}) {
  if (badges.length === 0) return null

  const tierColors = {
    legendary: '#D4A017',
    epic: '#7C3AED',
    rare: '#2E8BC0',
    common: 'var(--v2-text-muted)',
  }

  const tierBg = {
    legendary: 'rgba(255,215,0,0.1)',
    epic: 'rgba(139,92,246,0.1)',
    rare: 'rgba(75,185,236,0.1)',
    common: 'var(--v2-surface)',
  }

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      fontFamily: 'var(--v2-font)',
      border: '1px solid var(--v2-border-subtle)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--v2-text-muted)',
        marginBottom: 14,
      }}>
        Badge Showcase
      </div>

      {/* Badge rows */}
      {badges.slice(0, 6).map((badge, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: i < badges.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
          }}
        >
          {/* Icon */}
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: tierBg[badge.tier] || tierBg.common,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            overflow: 'hidden',
          }}>
            {badge.imageUrl ? (
              <img src={badge.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
            ) : null}
            <span style={{ display: badge.imageUrl ? 'none' : 'block' }}>{badge.emoji || '🏅'}</span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
              {badge.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
              {badge.childName && <span>{badge.childName}</span>}
              {badge.childName && badge.earnedDate && ' · '}
              {badge.earnedDate}
            </div>
          </div>

          {/* Tier */}
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            color: tierColors[badge.tier] || tierColors.common,
            flexShrink: 0,
          }}>
            {badge.tier || 'common'}
          </span>
        </div>
      ))}
    </div>
  )
}
