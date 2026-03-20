// =============================================================================
// ShoutoutCard — V2 warm amber "Latest Shoutout" card for coach sidebar
// Props-only.
// =============================================================================

export default function ShoutoutCard({
  quote,
  fromLabel,
}) {
  if (!quote) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF0 100%)',
      borderRadius: 16,
      padding: 24,
      fontFamily: 'var(--v2-font)',
      border: '1px solid rgba(245,158,11,0.15)',
    }}>
      {/* Star + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--v2-amber)',
        }}>
          Latest Shoutout
        </span>
      </div>

      {/* Quote */}
      <div style={{
        fontSize: 14, fontWeight: 500,
        fontStyle: 'italic',
        color: 'var(--v2-text-primary)',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        &ldquo;{quote}&rdquo;
      </div>

      {/* Attribution */}
      {fromLabel && (
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: 'var(--v2-text-muted)',
        }}>
          {fromLabel}
        </div>
      )}
    </div>
  )
}
