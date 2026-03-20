// =============================================================================
// KidCards — V2 child player cards for parent dashboard
// Props-only.
// =============================================================================

export default function KidCards({
  children = [],
  selectedChildId,
  onChildSelect,
}) {
  const gradients = [
    'linear-gradient(135deg, #4BB9EC, #2E8BC0)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #F43F5E, #E11D48)',
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: children.length === 1 ? '1fr' : 'repeat(2, 1fr)',
      gap: 14,
      padding: '16px 24px',
      fontFamily: 'var(--v2-font)',
    }}>
      {children.map((child, i) => {
        const isSelected = child.id === selectedChildId
        const initials = child.initials || `${child.firstName?.[0] || ''}${child.lastName?.[0] || ''}`.toUpperCase()
        const gradient = child.avatarGradient || gradients[i % gradients.length]

        return (
          <div
            key={child.id}
            onClick={() => onChildSelect?.(child.id)}
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: 20,
              border: isSelected ? '2px solid var(--v2-sky)' : '1px solid var(--v2-border-subtle)',
              boxShadow: isSelected ? '0 4px 12px rgba(75,185,236,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Top — avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#FFFFFF',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
                  {child.firstName} {child.lastName}
                </div>
                {child.teamName && (
                  <div style={{ fontSize: 12, color: 'var(--v2-text-secondary)' }}>
                    {child.teamName}
                  </div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8, marginBottom: 12,
            }}>
              <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-green)' }}>
                  {child.attendance || '—'}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                  Attend
                </div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-text-primary)' }}>
                  {child.record || '—'}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                  Record
                </div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--v2-surface)', borderRadius: 8, padding: '8px 4px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-text-primary)' }}>
                  {child.nextEvent || '—'}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                  Next
                </div>
              </div>
            </div>

            {/* Badge/Streak chip */}
            {child.badgeOrStreak && (
              <div>{child.badgeOrStreak}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
