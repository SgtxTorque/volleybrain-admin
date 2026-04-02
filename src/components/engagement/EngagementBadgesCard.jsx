// =============================================================================
// EngagementBadgesCard — Shared badges grid card for all role dashboards
// =============================================================================

export default function EngagementBadgesCard({ earnedCount = 0, totalCount = 0, badges = [], onNavigateAchievements }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 14, border: '1px solid #E8ECF2',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#334155', textTransform: 'uppercase' }}>
          Badges
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>
          {earnedCount}/{totalCount}
        </span>
      </div>

      {/* Badge grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 32px)',
        gap: 4, justifyContent: 'center',
      }}>
        {badges.slice(0, 10).map((badge, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 6,
            background: '#162D50', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {badge.imageUrl || badge.badge_image_url ? (
              <img
                src={badge.imageUrl || badge.badge_image_url}
                alt={badge.name || ''}
                style={{ width: 32, height: 32, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <span style={{ fontSize: 16 }}>{badge.icon || '🏅'}</span>
            )}
          </div>
        ))}
        {badges.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', textAlign: 'center',
            fontSize: 11, color: '#94A3B8', padding: '8px 0',
          }}>
            No badges earned yet
          </div>
        )}
      </div>

      {/* View all link */}
      {badges.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button
            onClick={onNavigateAchievements}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, color: '#3B82F6', padding: 0,
            }}
          >
            View all →
          </button>
        </div>
      )}
    </div>
  )
}
