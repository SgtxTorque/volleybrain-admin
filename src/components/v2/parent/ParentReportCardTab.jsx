// =============================================================================
// ParentReportCardTab — V2 achievements + stats for parent dashboard tabs
// Props-only.
// =============================================================================

export default function ParentReportCardTab({
  achievements = [],
  xpData = {},
  teamRecord = {},
  childName = '',
  onViewAll,
}) {
  const tierColors = {
    legendary: { bg: 'rgba(255,215,0,0.1)', color: '#D4A017' },
    epic: { bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
    rare: { bg: 'rgba(75,185,236,0.1)', color: '#2E8BC0' },
    common: { bg: 'var(--v2-surface)', color: 'var(--v2-text-muted)' },
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* XP + Level */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 20,
        background: 'var(--v2-surface)', borderRadius: 12, padding: 16,
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v2-purple)' }}>
            Lv.{xpData.level || 1}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
            Level
          </div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v2-text-primary)' }}>
            {teamRecord.wins || 0}-{teamRecord.losses || 0}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
            Record
          </div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--v2-amber)' }}>
            {achievements.length}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
            Badges
          </div>
        </div>
      </div>

      {/* XP Progress */}
      {xpData.xpToNext > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--v2-text-muted)', marginBottom: 6 }}>
            <span>XP Progress</span>
            <span>{xpData.currentXp || 0} / {xpData.xpToNext}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--v2-surface)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'var(--v2-purple)',
              width: `${Math.min(100, ((xpData.currentXp || 0) / xpData.xpToNext) * 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Badges */}
      {achievements.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10 }}>
            Recent Badges
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {achievements.slice(0, 6).map((ach, i) => {
              const badge = ach.achievements || {}
              const tier = tierColors[badge.rarity] || tierColors.common
              return (
                <div key={ach.id || i} style={{
                  textAlign: 'center', background: tier.bg,
                  borderRadius: 10, padding: '12px 8px',
                }}>
                  <div style={{ fontSize: 24, display: 'flex', justifyContent: 'center', marginBottom: 4, height: 32 }}>
                    {badge.icon_url || badge.badge_image_url ? (
                      <img src={badge.badge_image_url || badge.icon_url} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline' }} />
                    ) : null}
                    <span style={{ display: (badge.icon_url || badge.badge_image_url) ? 'none' : 'inline' }}>{badge.icon || '🏅'}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
                    {badge.name || 'Badge'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: tier.color, marginTop: 2 }}>
                    {badge.rarity || 'common'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🏅</span>
          <div style={{ fontSize: 13, color: 'var(--v2-text-muted)' }}>
            No badges earned yet — keep playing!
          </div>
        </div>
      )}

      {/* View all */}
      <button
        onClick={onViewAll}
        style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700, marginTop: 16,
          background: 'var(--v2-navy)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
        }}
      >
        View All Achievements →
      </button>
    </div>
  )
}
