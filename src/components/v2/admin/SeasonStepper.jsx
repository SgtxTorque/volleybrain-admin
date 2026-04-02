// =============================================================================
// SeasonStepper — Season journey progress stepper for admin dashboard
// Props-only.
// =============================================================================

export default function SeasonStepper({
  seasonName = '',
  steps = [],
  completedCount = 0,
  totalCount = 0,
  onNavigate,
}) {
  if (steps.length === 0) return null

  return (
    <div style={{
      background: 'var(--v2-white)',
      borderRadius: 'var(--v2-radius)',
      boxShadow: 'var(--v2-card-shadow)',
      border: '1px solid var(--v2-border-subtle)',
      padding: '12px 16px',
      fontFamily: 'var(--v2-font)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-text-primary)' }}>
          Season Journey · {seasonName}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: completedCount >= totalCount ? 'var(--v2-green)' : 'var(--v2-sky)',
        }}>
          {completedCount} of {totalCount} Complete
        </span>
      </div>

      {/* Stepper track */}
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
        {steps.map((step, i) => {
          const isDone = step.status === 'done'
          const isCurrent = step.status === 'current'
          const isClickable = !isDone && step.page && onNavigate

          return (
            <div
              key={i}
              onClick={() => isClickable && onNavigate?.(step.page)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', position: 'relative',
                cursor: isClickable ? 'pointer' : 'default',
              }}
              title={isDone ? `${step.label} — Complete` : step.page ? `Go to ${step.label}` : step.label}
            >
              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: 10, left: '50%', right: '-50%',
                  height: 2,
                  background: isDone ? 'var(--v2-green)' : '#E2E8F0',
                  zIndex: 0,
                }} />
              )}

              {/* Dot */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#FFFFFF',
                zIndex: 1,
                background: isDone
                  ? 'var(--v2-green)'
                  : isCurrent
                    ? 'var(--v2-sky)'
                    : 'var(--v2-surface)',
                border: !isDone && !isCurrent ? '2px solid #E2E8F0' : 'none',
                boxShadow: isCurrent ? '0 0 0 4px rgba(75,185,236,0.2)' : 'none',
                transition: 'transform 0.15s ease',
                ...(isClickable ? {} : {}),
              }}
              onMouseEnter={e => { if (isClickable) e.currentTarget.style.transform = 'scale(1.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                {isDone ? '✓' : isCurrent ? '▸' : ''}
              </div>

              {/* Label */}
              <div style={{
                fontSize: 9, fontWeight: isCurrent ? 700 : 600,
                textTransform: 'uppercase',
                color: isCurrent ? 'var(--v2-sky)' : 'var(--v2-text-muted)',
                marginTop: 4, textAlign: 'center',
                maxWidth: 70,
              }}>
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
