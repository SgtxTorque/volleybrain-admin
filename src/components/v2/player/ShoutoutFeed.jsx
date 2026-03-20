// =============================================================================
// ShoutoutFeed — V2 recent shoutouts for player sidebar
// Props-only. Dark variant.
// =============================================================================

export default function ShoutoutFeed({
  shoutouts = [],
}) {
  if (shoutouts.length === 0) return null

  return (
    <div style={{
      background: '#132240',
      borderRadius: 16,
      padding: 20,
      fontFamily: 'var(--v2-font)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'rgba(255,255,255,0.40)',
        marginBottom: 14,
      }}>
        Recent Shoutouts
      </div>

      {/* Shoutout rows */}
      {shoutouts.slice(0, 4).map((s, i) => (
        <div
          key={i}
          style={{
            padding: '10px 0',
            borderBottom: i < Math.min(shoutouts.length, 4) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4BB9EC', marginBottom: 4 }}>
            {s.from}
          </div>
          <div style={{
            fontSize: 13, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.80)',
            lineHeight: 1.4,
          }}>
            "{s.quote}"
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
            {s.date}
          </div>
        </div>
      ))}
    </div>
  )
}
