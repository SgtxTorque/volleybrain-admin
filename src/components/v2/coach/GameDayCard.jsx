// =============================================================================
// GameDayCard — V2 dark navy "Next Game" card for coach sidebar
// Props-only.
// =============================================================================

export default function GameDayCard({
  overline = 'Next Game',
  countdownText,
  matchup,
  details,
  confirmed,
  pending,
  seasonRecord,
  ctaLabel = 'Start Game Day Mode →',
  onCtaClick,
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--v2-navy) 0%, var(--v2-midnight) 100%)',
      borderRadius: 16,
      padding: 24,
      fontFamily: 'var(--v2-font)',
      color: '#FFFFFF',
    }}>
      {/* Overline */}
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--v2-sky)',
        marginBottom: 8,
      }}>
        {overline}
      </div>

      {/* Countdown badge */}
      {countdownText && (
        <span style={{
          display: 'inline-block',
          background: 'rgba(75,185,236,0.15)',
          color: 'var(--v2-sky)',
          fontSize: 11, fontWeight: 700,
          padding: '4px 10px', borderRadius: 6,
          marginBottom: 12,
        }}>
          {countdownText}
        </span>
      )}

      {/* Matchup */}
      {matchup && (
        <div style={{
          fontSize: 20, fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: 6,
        }}>
          {matchup}
        </div>
      )}

      {/* Details */}
      {details && (
        <div style={{
          fontSize: 12.5,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: 16,
        }}>
          {details}
        </div>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
        {confirmed != null && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{confirmed}</div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Confirmed
            </div>
          </div>
        )}
        {pending != null && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: pending > 0 ? 'var(--v2-coral)' : undefined }}>
              {pending}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Pending
            </div>
          </div>
        )}
        {seasonRecord && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-green)' }}>
              {seasonRecord}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Record
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onCtaClick}
        style={{
          width: '100%', padding: 11, borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          background: 'var(--v2-sky)', color: 'var(--v2-navy)',
          border: 'none', cursor: 'pointer',
          transition: 'opacity 0.15s ease',
        }}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
