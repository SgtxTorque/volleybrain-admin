// =============================================================================
// EngagementActivityCard — Shared activity card with configurable rows
// Props:
//   activities = [{ icon, label, count, bg, color }]
//   nextBadgeHint = string (optional)
//   title = string (default "Your Activity")
// =============================================================================

export default function EngagementActivityCard({ activities = [], nextBadgeHint, title = 'Your Activity' }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14,
      padding: 14, border: '1px solid #E8ECF2',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#0F6E56', textTransform: 'uppercase' }}>
          {title}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#085041',
          background: '#E1F5EE', borderRadius: 10, padding: '2px 8px',
        }}>
          Week
        </span>
      </div>

      {/* Activity rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {activities.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F8FAFC', borderRadius: 8, padding: '6px 8px',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: row.bg || '#E6F1FB', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, flexShrink: 0,
            }}>
              {row.icon}
            </div>
            <span style={{ fontSize: 12, color: '#334155', fontWeight: 500, flex: 1 }}>
              {row.label}
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              {row.count}
            </span>
          </div>
        ))}
      </div>

      {/* Next badge nudge */}
      {nextBadgeHint && (
        <div style={{
          marginTop: 8, background: '#FAEEDA', borderRadius: 8,
          padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>⭐</span>
          <span style={{ fontSize: 11, color: '#633806', fontWeight: 600, lineHeight: 1.3 }}>
            {nextBadgeHint}
          </span>
        </div>
      )}
    </div>
  )
}
