// =============================================================================
// FinancialSnapshot — V2 dark navy financial card
// Used by Admin (Financial Snapshot) and Parent (Family Balance).
// Props-only.
// =============================================================================

export default function FinancialSnapshot({
  overline,
  heading,
  headingSub,
  projectedRevenue,
  collectedPct,
  receivedAmount,
  receivedLabel = 'Received',
  outstandingAmount,
  outstandingLabel = 'Outstanding',
  breakdown,
  dueDateText,
  primaryAction,
  secondaryAction,
}) {
  const fmtDollar = (val) => {
    const n = Number(val || 0)
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return (
    <div style={{
      background: 'linear-gradient(160deg, #0f2847 0%, var(--v2-midnight) 100%)',
      color: '#FFFFFF',
      borderRadius: 'var(--v2-radius)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--v2-font)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 160, height: 160,
        background: 'radial-gradient(circle, rgba(75,185,236,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Overline */}
      {overline && (
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--v2-sky)',
          marginBottom: 6, position: 'relative',
        }}>
          {overline}
        </div>
      )}

      {/* Heading */}
      {heading && (
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {heading}
          </div>
          {headingSub && (
            <div style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>
              {headingSub}
            </div>
          )}
        </div>
      )}

      {/* Progress bar (if projected revenue) */}
      {projectedRevenue != null && (
        <div style={{ marginBottom: 18, position: 'relative' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6,
          }}>
            <span>Target: ${fmtDollar(projectedRevenue)}</span>
            <span>{collectedPct != null ? `${collectedPct}%` : ''}</span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'var(--v2-sky)',
              width: `${Math.min(collectedPct || 0, 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Big numbers */}
      <div style={{ display: 'flex', gap: 20, marginBottom: breakdown || dueDateText ? 18 : 0, position: 'relative' }}>
        {receivedAmount && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{receivedAmount}</div>
            <div style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em',
            }}>
              {receivedLabel}
            </div>
          </div>
        )}
        {outstandingAmount && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-coral)' }}>
              {outstandingAmount}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em',
            }}>
              {outstandingLabel}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 14, marginBottom: 14, position: 'relative',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.05em',
          }}>
            Breakdown
          </div>
          {breakdown.map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '5px 0', alignItems: 'center',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                {row.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                {typeof row.amount === 'number' ? `$${fmtDollar(row.amount)}` : row.amount}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Due date text */}
      {dueDateText && (
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.5)',
          marginBottom: 14, position: 'relative',
        }}>
          {dueDateText}
        </div>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              style={{
                flex: 1, padding: 10, borderRadius: 10,
                fontSize: 12, fontWeight: 700,
                border: primaryAction.variant === 'danger'
                  ? '1px solid rgba(239,68,68,0.15)'
                  : '1px solid transparent',
                background: primaryAction.variant === 'danger'
                  ? 'rgba(239,68,68,0.2)'
                  : 'var(--v2-green)',
                color: primaryAction.variant === 'danger'
                  ? 'var(--v2-coral)'
                  : 'var(--v2-navy)',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                flex: 1, padding: 10, borderRadius: 10,
                fontSize: 12, fontWeight: 700,
                border: 'none',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
