import {
  CalendarCheck2, CalendarX2, Trash2, AlertTriangle, Repeat,
} from '../../constants/icons'
import { DAY_NAMES_FULL, MONTH_NAMES, REASONS, formatDateNice } from './availabilityHelpers'

// ============================================
// AVAILABILITY SIDEBAR
// Sidebar panels: upcoming unavailable, recurring patterns,
// quick actions (coach), conflict summary (admin)
// ============================================
export default function AvailabilitySidebar({
  cardCls, tc, isDark, isAdmin, isCoach, tableExists,
  upcomingUnavailable, recurringPatterns, monthStats,
  currentMonth, calendarDays, getEffectiveStatus, eventsMap,
  selectedCoach, removeAvailability, markThisWeek, clearMonth,
}) {
  return (
    <div className="col-span-12 lg:col-span-4 space-y-4">
      {/* Upcoming Unavailable */}
      <div className={cardCls + ' overflow-hidden'}>
        <div className={`px-5 py-3 border-b ${tc.border}`}>
          <h3 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted}`}>
            Upcoming Unavailable
          </h3>
        </div>
        <div className="p-3">
          {upcomingUnavailable.length === 0 ? (
            <div className="py-6 text-center">
              <CalendarCheck2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className={`text-r-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>All clear!</p>
              <p className={`text-r-xs ${tc.textMuted}`}>No upcoming unavailable dates</p>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingUnavailable.slice(0, 8).map((item, idx) => (
                <div
                  key={item.dateStr + idx}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-lynx-cloud'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.status === 'unavailable' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-r-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {formatDateNice(item.dateStr)}
                    </p>
                    {item.reason && (
                      <p className={`text-r-xs ${tc.textMuted} capitalize`}>
                        {REASONS.find(r => r.value === item.reason)?.icon} {item.reason}
                        {item.isRecurring && ' (recurring)'}
                      </p>
                    )}
                  </div>
                  {isCoach && !item.isRecurring && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAvailability(item.dateStr) }}
                      className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-red-50'}`}
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recurring Patterns */}
      {recurringPatterns.length > 0 && (
        <div className={cardCls + ' overflow-hidden'}>
          <div className={`px-5 py-3 border-b ${tc.border}`}>
            <h3 className={`text-r-xs font-bold uppercase tracking-wider ${tc.textMuted}`}>
              <Repeat className="w-4 h-4 inline mr-1" />
              Recurring Patterns
            </h3>
          </div>
          <div className="p-3 space-y-1">
            {recurringPatterns.map(p => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  isDark ? 'bg-white/[0.03]' : 'bg-lynx-cloud'
                }`}
              >
                <Repeat className="w-4 h-4 text-lynx-sky shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-r-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Every {DAY_NAMES_FULL[p.recurring_day_of_week]}
                  </p>
                  {p.reason && (
                    <p className={`text-r-xs ${tc.textMuted} capitalize`}>{p.reason}</p>
                  )}
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  p.status === 'unavailable' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - Coach only */}
      {isCoach && tableExists && (
        <div className={cardCls + ' p-5'}>
          <h3 className={`text-r-xs font-bold uppercase tracking-wider mb-4 ${tc.textMuted}`}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button
              onClick={markThisWeek}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-r-sm font-medium transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                  : 'bg-lynx-cloud text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CalendarX2 className="w-5 h-5 text-red-400" />
              Mark This Week Unavailable
            </button>
            <button
              onClick={clearMonth}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-r-sm font-medium transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                  : 'bg-lynx-cloud text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-5 h-5 text-slate-400" />
              Clear All for {MONTH_NAMES[currentMonth]}
            </button>
          </div>
        </div>
      )}

      {/* Admin Conflict Summary */}
      {isAdmin && monthStats.conflicts > 0 && (
        <div className={`rounded-[14px] overflow-hidden border ${
          isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className={`px-5 py-3 border-b ${isDark ? 'border-amber-500/10' : 'border-amber-200'}`}>
            <h3 className={`text-r-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Scheduling Conflicts
            </h3>
          </div>
          <div className="p-4">
            <p className={`text-r-sm ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
              {monthStats.conflicts} day{monthStats.conflicts > 1 ? 's' : ''} where {selectedCoach?.first_name || 'this coach'} is unavailable but has scheduled events.
            </p>
            <div className="mt-3 space-y-1">
              {calendarDays.filter(d => d.isCurrentMonth).map(d => {
                const status = getEffectiveStatus(d.dateStr)
                const dayEvents = eventsMap[d.dateStr] || []
                if (!status || status.status !== 'unavailable' || dayEvents.length === 0) return null
                return (
                  <div key={d.dateStr} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isDark ? 'bg-white/[0.04]' : 'bg-white/60'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className={`text-r-xs font-medium ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                      {formatDateNice(d.dateStr)}
                    </span>
                    <span className={`text-r-xs ${isDark ? 'text-amber-400/60' : 'text-amber-600'}`}>
                      - {dayEvents.map(e => e.event_type === 'game' ? 'Game' : 'Practice').join(', ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
