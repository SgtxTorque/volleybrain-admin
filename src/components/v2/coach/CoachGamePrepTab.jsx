// =============================================================================
// CoachGamePrepTab — V2 pre-game checklist for coach dashboard tabs
// Props-only.
// =============================================================================

import { parseLocalDate } from '../../../lib/date-helpers'

export default function CoachGamePrepTab({
  checklistState = {},
  onToggleItem,
  nextEvent,
  onNavigate,
}) {
  const items = [
    {
      key: 'lineupSet',
      label: 'Set lineup for next game',
      detail: nextEvent?.event_type === 'game'
        ? `${nextEvent.title || 'Game'} — ${parseLocalDate(nextEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
        : 'No upcoming game',
      page: 'gameprep',
    },
    {
      key: 'rsvpsReviewed',
      label: 'Review RSVPs',
      detail: 'Check who has confirmed for the next event',
      page: 'schedule',
    },
    {
      key: 'lastGameStatsEntered',
      label: 'Enter last game stats',
      detail: 'Record stats from the most recent completed game',
      page: 'gameprep',
    },
    {
      key: 'parentReminderSent',
      label: 'Send parent reminder',
      detail: 'Remind parents about upcoming event logistics',
      manual: true,
    },
  ]

  const completedCount = items.filter(it => checklistState[it.key]).length

  return (
    <div style={{ padding: '16px 24px', fontFamily: 'var(--v2-font)' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--v2-surface)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: completedCount === items.length ? 'var(--v2-green)' : 'var(--v2-sky)',
            width: `${(completedCount / items.length) * 100}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-text-muted)' }}>
          {completedCount}/{items.length}
        </span>
      </div>

      {/* Checklist */}
      {items.map((item, i) => {
        const done = !!checklistState[item.key]
        return (
          <div
            key={item.key}
            onClick={() => {
              if (item.manual) {
                onToggleItem?.(item.key)
              } else if (!done && item.page) {
                onNavigate?.(item.page)
              }
            }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 0',
              borderBottom: i < items.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
              cursor: item.manual || !done ? 'pointer' : 'default',
              opacity: done ? 0.6 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              border: done ? 'none' : '2px solid var(--v2-border-subtle)',
              background: done ? 'var(--v2-green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}>
              {done && (
                <span style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 800 }}>✓</span>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 600,
                color: 'var(--v2-text-primary)',
                textDecoration: done ? 'line-through' : 'none',
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 2 }}>
                {item.detail}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
