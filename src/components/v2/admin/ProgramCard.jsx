// ============================================
// ProgramCard — Enriched mini-dashboard card for the admin dashboard
// Shows program health at a glance: counts, financials, roster, action items, season statuses
// ============================================

export default function ProgramCard({ program, stats, actionItems, seasonStatuses, onClick }) {
  const sportIcon = program?.icon || program?.sport?.icon || '📁'
  const sportName = program?.name || 'Program'
  const sportColor = program?.sport?.color_primary || '#4BB9EC'

  // Format currency
  const fmtCurrency = (val) => {
    if (!val || val === 0) return '$0'
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`
    return `$${Math.round(val)}`
  }

  // Roster fill bar color
  const getRosterColor = (pct) => {
    if (pct < 30) return '#F44336'
    if (pct <= 70) return '#FF9800'
    return '#4CAF50'
  }

  const hasActionItems = actionItems?.total > 0

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-background-primary, #FFFFFF)',
        border: '0.5px solid var(--color-border-tertiary, #E8ECF2)',
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        position: 'relative',
        fontFamily: 'var(--v2-font, Inter, system-ui, sans-serif)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-secondary, #CBD5E1)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-tertiary, #E8ECF2)' }}
    >
      {/* Action items badge — top right */}
      {hasActionItems && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: '#FFF3E0', color: '#E65100',
          fontSize: 11, fontWeight: 700, padding: '2px 8px',
          borderRadius: 10, lineHeight: '18px',
        }}>
          {actionItems.total} action item{actionItems.total !== 1 ? 's' : ''}
        </div>
      )}

      {/* Icon + name + counts */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${sportColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {sportIcon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 700,
            color: 'var(--v2-text-primary, #10284C)',
            lineHeight: '20px', marginBottom: 2,
          }}>
            {sportName}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--v2-text-muted, #8C96A8)',
            lineHeight: '16px',
          }}>
            {stats?.seasonCount || 0} season{(stats?.seasonCount || 0) !== 1 ? 's' : ''} · {stats?.teamCount || 0} team{(stats?.teamCount || 0) !== 1 ? 's' : ''} · {stats?.playerCount || 0} player{(stats?.playerCount || 0) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Financial metrics — 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{
          background: 'var(--color-background-secondary, #F6F8FB)',
          borderRadius: 8, padding: 8, textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#4CAF50', lineHeight: '20px' }}>
            {fmtCurrency(stats?.collected)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--v2-text-muted, #8C96A8)', fontWeight: 500, marginTop: 1 }}>
            Collected
          </div>
        </div>
        <div style={{
          background: 'var(--color-background-secondary, #F6F8FB)',
          borderRadius: 8, padding: 8, textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F44336', lineHeight: '20px' }}>
            {fmtCurrency(stats?.outstanding)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--v2-text-muted, #8C96A8)', fontWeight: 500, marginTop: 1 }}>
            Outstanding
          </div>
        </div>
        <div style={{
          background: 'var(--color-background-secondary, #F6F8FB)',
          borderRadius: 8, padding: 8, textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--v2-text-primary, #10284C)', lineHeight: '20px' }}>
            {stats?.collectionPct || 0}%
          </div>
          <div style={{ fontSize: 10, color: 'var(--v2-text-muted, #8C96A8)', fontWeight: 500, marginTop: 1 }}>
            Collection
          </div>
        </div>
      </div>

      {/* Roster fill bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--v2-text-muted, #8C96A8)' }}>
            Roster fill
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--v2-text-secondary, #5A6578)' }}>
            {stats?.rosterFilled || 0} / {stats?.rosterTotal || 0} spots
          </span>
        </div>
        <div style={{
          height: 6, borderRadius: 3,
          background: 'var(--color-background-secondary, #E8ECF2)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${Math.min(stats?.rosterFillPct || 0, 100)}%`,
            background: getRosterColor(stats?.rosterFillPct || 0),
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Action item pills */}
      <div style={{
        borderTop: '1px solid var(--color-border-tertiary, #E8ECF2)',
        paddingTop: 10, marginBottom: 10,
      }}>
        {!hasActionItems && !(actionItems?.eventsThisWeek > 0) ? (
          <div style={{ fontSize: 12, color: 'var(--v2-text-muted, #8C96A8)', fontStyle: 'italic' }}>
            No urgent items
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(actionItems?.pendingRegs || 0) > 0 && (
              <span style={{
                background: '#FFF3E0', color: '#E65100',
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
              }}>
                {actionItems.pendingRegs} pending reg{actionItems.pendingRegs !== 1 ? 's' : ''}
              </span>
            )}
            {(actionItems?.overduePayments || 0) > 0 && (
              <span style={{
                background: '#FFEBEE', color: '#C62828',
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
              }}>
                {actionItems.overduePayments} overdue
              </span>
            )}
            {(actionItems?.eventsThisWeek || 0) > 0 && (
              <span style={{
                background: '#E3F2FD', color: '#1565C0',
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
              }}>
                {actionItems.eventsThisWeek} event{actionItems.eventsThisWeek !== 1 ? 's' : ''} this week
              </span>
            )}
          </div>
        )}
      </div>

      {/* Season status badges + "Open →" */}
      <div style={{
        borderTop: '1px solid var(--color-border-tertiary, #E8ECF2)',
        paddingTop: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(seasonStatuses?.active || 0) > 0 && (
            <span style={{
              background: '#4CAF50', color: '#FFFFFF',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            }}>
              {seasonStatuses.active} active
            </span>
          )}
          {(seasonStatuses?.upcoming || 0) > 0 && (
            <span style={{
              background: '#FF9800', color: '#FFFFFF',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            }}>
              {seasonStatuses.upcoming} upcoming
            </span>
          )}
          {(seasonStatuses?.draft || 0) > 0 && (
            <span style={{
              background: 'var(--color-background-secondary, #E8ECF2)',
              color: 'var(--v2-text-muted, #8C96A8)',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            }}>
              {seasonStatuses.draft} draft
            </span>
          )}
          {(seasonStatuses?.completed || 0) > 0 && (
            <span style={{
              background: 'var(--color-background-secondary, #E8ECF2)',
              color: 'var(--v2-text-muted, #8C96A8)',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            }}>
              {seasonStatuses.completed} completed
            </span>
          )}
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#4BB9EC',
          whiteSpace: 'nowrap', marginLeft: 8,
        }}>
          Open →
        </span>
      </div>
    </div>
  )
}
