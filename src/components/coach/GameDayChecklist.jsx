import { Check } from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * GameDayChecklist — Dynamic prep checklist for next event
 * Auto-populates based on event type (game vs practice).
 */
export default function GameDayChecklist({
  nextEvent,
  checklistState,
  onToggleManual,
  roster,
  rsvpCounts,
}) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'
  const primaryText = isDark ? 'text-white' : 'text-slate-900'

  if (!nextEvent) {
    return (
      <div className={`${cardBg} rounded-xl shadow-sm p-5 h-full flex flex-col items-center justify-center`}>
        <p className="text-2xl mb-2">🎉</p>
        <p className={`text-sm font-semibold ${primaryText}`}>No upcoming events</p>
        <p className={`text-xs ${secondaryText} mt-1`}>Enjoy the break!</p>
      </div>
    )
  }

  const isGame = nextEvent.event_type === 'game'
  const rsvp = rsvpCounts?.[nextEvent.id]
  const rsvpPercent = roster?.length > 0 ? ((rsvp?.total || 0) / roster.length) * 100 : 0

  const items = isGame ? [
    { key: 'lineupSet', label: 'Lineup set for this game', checked: checklistState?.lineupSet },
    { key: 'rsvpsReviewed', label: `RSVPs reviewed (${rsvp?.total || 0}/${roster?.length || 0})`, checked: checklistState?.rsvpsReviewed },
    { key: 'lastGameStatsEntered', label: 'Stats entered from last game', checked: checklistState?.lastGameStatsEntered },
    { key: 'parentReminderSent', label: 'Parent reminder sent', checked: checklistState?.parentReminderSent, manual: true },
  ] : [
    { key: 'rsvpsReviewed', label: `RSVPs reviewed (${rsvp?.total || 0}/${roster?.length || 0})`, checked: checklistState?.rsvpsReviewed },
    { key: 'lastGameStatsEntered', label: 'Last game stats reviewed', checked: checklistState?.lastGameStatsEntered },
    { key: 'parentReminderSent', label: 'Practice focus set', checked: checklistState?.parentReminderSent, manual: true },
  ]

  const completed = items.filter(i => i.checked).length
  const total = items.length
  const allDone = completed === total

  return (
    <div className={`${cardBg} rounded-xl shadow-sm p-4 h-full flex flex-col ${allDone ? 'ring-1 ring-emerald-500/25' : ''}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[1.2px] mb-3 ${secondaryText}`}>
        {isGame ? 'Game Day Checklist' : 'Practice Checklist'}
      </p>

      <div className="flex-1 space-y-2">
        {items.map(item => (
          <button
            key={item.key}
            onClick={item.manual ? () => onToggleManual?.(item.key) : undefined}
            className={`w-full flex items-center gap-2.5 text-left ${item.manual ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {item.checked ? (
              <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-emerald-500" />
              </div>
            ) : (
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${isDark ? 'border border-white/[0.12] bg-white/[0.04]' : 'border border-slate-200 bg-slate-50'}`}>
                <span className="w-3 h-3" />
              </div>
            )}
            <span className={`text-xs ${item.checked ? 'line-through opacity-50' : ''} ${primaryText}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold ${allDone ? 'text-emerald-500' : secondaryText}`}>
            {allDone ? 'Ready! ✅' : `${completed}/${total} ready`}
          </span>
        </div>
        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
          <div
            className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : 'bg-lynx-sky'}`}
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}
