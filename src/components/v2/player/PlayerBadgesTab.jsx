// =============================================================================
// PlayerBadgesTab — V2 3-column badge grid for player dashboard
// Props-only. Dark mode aware via parent .v2-player-dark class.
// =============================================================================

export default function PlayerBadgesTab({
  badges = [],
  lockedBadges = [],
}) {
  const tierColors = {
    legendary: '#FFD700',
    epic: '#A855F7',
    rare: '#4BB9EC',
    common: 'rgba(255,255,255,0.40)',
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {badges.length > 0 || lockedBadges.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {/* Earned badges */}
          {badges.map((badge, i) => (
            <div
              key={badge.id || i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: '18px 14px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'default',
                transition: 'background 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 32, display: 'flex', justifyContent: 'center', marginBottom: 8, height: 40 }}>
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }} />
                ) : null}
                <span style={{ display: badge.imageUrl ? 'none' : 'inline' }}>{badge.icon || '🏅'}</span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.90)', marginBottom: 4 }}>
                {badge.name || 'Badge'}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: tierColors[badge.rarity] || tierColors.common,
              }}>
                {badge.rarity || 'common'}
              </div>
            </div>
          ))}

          {/* Locked badges */}
          {lockedBadges.map((badge, i) => (
            <div
              key={`locked-${i}`}
              style={{
                background: 'rgba(255,255,255,0.01)',
                borderRadius: 12,
                padding: '18px 14px',
                textAlign: 'center',
                border: '1px dashed rgba(255,255,255,0.08)',
                opacity: 0.5,
              }}
            >
              <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🔒</span>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.40)', marginBottom: 4 }}>
                {badge.name || 'Locked'}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)' }}>
                Locked
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🏅</span>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)' }}>
            No badges earned yet — keep grinding!
          </div>
        </div>
      )}
    </div>
  )
}
