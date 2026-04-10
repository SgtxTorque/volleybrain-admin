// =============================================================================
// ParentPaymentsTab — V2 payment summary for parent dashboard tabs
// Props-only. Shows all fees grouped by child.
// =============================================================================

import { useState } from 'react'
import { parseLocalDate } from '../../../lib/date-helpers'

export default function ParentPaymentsTab({
  paymentSummary = {},
  children = [],
  onPayNow,
  onViewAll,
}) {
  const { totalDue = 0, totalPaid = 0, unpaidItems = [] } = paymentSummary
  const [showAll, setShowAll] = useState(false)

  // Build player name lookup from children data
  const playerNameMap = {}
  for (const child of children) {
    if (child.id) playerNameMap[child.id] = `${child.first_name || ''} ${child.last_name || ''}`.trim()
  }

  // Group unpaid items by player
  const grouped = {}
  for (const item of unpaidItems) {
    const pid = item.player_id || 'unknown'
    if (!grouped[pid]) grouped[pid] = { name: playerNameMap[pid] || 'Player', items: [] }
    grouped[pid].items.push(item)
  }
  const groups = Object.values(grouped)
  const hasMultipleChildren = groups.length > 1

  // Decide how many to show
  const COLLAPSE_THRESHOLD = 8
  const shouldCollapse = unpaidItems.length > COLLAPSE_THRESHOLD && !showAll
  const visibleGroups = groups // always show all groups, limit items within if needed

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{
          flex: 1, background: totalDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          borderRadius: 10, padding: 16, textAlign: 'center',
        }}>
          <div style={{
            fontSize: 24, fontWeight: 800,
            color: totalDue > 0 ? 'var(--v2-coral)' : 'var(--v2-green)',
          }}>
            ${totalDue.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            {totalDue > 0 ? 'Balance Due' : 'All Paid!'}
          </div>
        </div>
        <div style={{
          flex: 1, background: 'rgba(16,185,129,0.08)',
          borderRadius: 10, padding: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-green)' }}>
            ${totalPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginTop: 2 }}>
            Paid
          </div>
        </div>
      </div>

      {/* Unpaid items grouped by child */}
      {unpaidItems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', marginBottom: 10 }}>
            Outstanding ({unpaidItems.length} item{unpaidItems.length !== 1 ? 's' : ''})
          </div>

          {visibleGroups.map((group) => {
            const items = shouldCollapse ? group.items.slice(0, 3) : group.items
            return (
              <div key={group.name} style={{ marginBottom: hasMultipleChildren ? 14 : 0 }}>
                {hasMultipleChildren && (
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--v2-text-primary)',
                    marginBottom: 6, paddingBottom: 4,
                    borderBottom: '1px solid var(--v2-border-subtle)',
                  }}>
                    {group.name}
                  </div>
                )}
                {items.map((item, i) => (
                  <div key={item.id || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < items.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                        {!hasMultipleChildren && playerNameMap[item.player_id] ? `${playerNameMap[item.player_id]} — ` : ''}
                        {item.fee_type ? item.fee_type.charAt(0).toUpperCase() + item.fee_type.slice(1) : 'Fee'}
                      </div>
                      {item.due_date && (
                        <div style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                          Due {parseLocalDate(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-coral)' }}>
                      ${(item.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          {shouldCollapse && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                width: '100%', padding: 8, marginTop: 6,
                background: 'none', border: '1px dashed var(--v2-border-subtle)',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                color: 'var(--v2-sky)', cursor: 'pointer',
              }}
            >
              Show all {unpaidItems.length} items
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {totalDue > 0 && (
          <button
            onClick={onPayNow}
            style={{
              flex: 1, padding: 10, borderRadius: 10,
              fontSize: 12, fontWeight: 700,
              background: 'var(--v2-sky)', color: 'var(--v2-navy)',
              border: 'none', cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            Pay Balance Now
          </button>
        )}
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              padding: '10px 16px', borderRadius: 10,
              fontSize: 12, fontWeight: 600,
              background: 'none', color: 'var(--v2-text-muted)',
              border: '1px solid var(--v2-border-subtle)', cursor: 'pointer',
            }}
          >
            View full breakdown
          </button>
        )}
      </div>
    </div>
  )
}
