import {
  ChevronLeft, ChevronRight, AlertTriangle, Info, Repeat, CalendarCheck2,
} from '../../constants/icons'
import { DAY_NAMES, MONTH_NAMES, REASONS, formatTime12 } from './availabilityHelpers'

// ============================================
// AVAILABILITY CALENDAR
// Calendar grid with month nav, day cells, legend
// ============================================
export default function AvailabilityCalendar({
  cardCls, tc, isDark, isCoach,
  currentMonth, currentYear, today,
  calendarDays, loading,
  getEffectiveStatus, eventsMap, selectedDates,
  prevMonth, nextMonth, goToToday, handleDayClick,
  markSelectedDates, clearSelectedDates,
}) {
  return (
    <div className="col-span-12 lg:col-span-8 space-y-4">
      <div className={cardCls + ' overflow-hidden'}>
        {/* Month Navigation */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${tc.border}`}>
          <button
            onClick={prevMonth}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'}`}
          >
            <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
          </button>
          <div className="text-center">
            <h2 className={`text-r-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button onClick={goToToday} className="text-r-xs text-lynx-sky hover:underline font-medium">
              Today
            </button>
          </div>
          <button
            onClick={nextMonth}
            className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'}`}
          >
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map(d => (
            <div key={d} className={`py-3 text-center text-r-xs font-bold uppercase tracking-wider ${tc.textMuted}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const status = day.isCurrentMonth ? getEffectiveStatus(day.dateStr) : null
              const dayEvents = eventsMap[day.dateStr] || []
              const isToday = day.dateStr === today
              const isSelected = selectedDates.has(day.dateStr)
              const hasConflict = status && status.status === 'unavailable' && dayEvents.length > 0

              return (
                <div
                  key={day.dateStr}
                  onClick={(e) => handleDayClick(day, e)}
                  className={[
                    'relative min-h-[80px] sm:min-h-[90px] p-1.5 sm:p-2 border-b border-r select-none transition-transform duration-150',
                    tc.border,
                    !day.isCurrentMonth ? 'opacity-30' : (isCoach ? 'cursor-pointer hover:scale-105 hover:z-10' : ''),
                    status?.status === 'unavailable' ? (isDark ? 'bg-red-500/15' : 'bg-red-500/10') : '',
                    status?.status === 'tentative' ? (isDark ? 'bg-amber-500/15' : 'bg-amber-500/10') : '',
                    isSelected ? 'outline outline-2 outline-lynx-sky -outline-offset-2' : '',
                    isToday ? 'ring-2 ring-inset ring-lynx-sky rounded-xl' : '',
                    idx % 7 === 0 ? 'border-l' : '',
                    idx < 7 ? 'border-t' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Date Number */}
                  <div className="flex items-start justify-between">
                    <span className={`text-r-sm font-semibold ${
                      isToday ? 'text-lynx-sky'
                      : day.isCurrentMonth ? (isDark ? 'text-white' : 'text-slate-800')
                      : tc.textMuted
                    }`}>
                      {day.date}
                    </span>

                    {/* Status + Conflict indicators */}
                    <div className="flex items-center gap-0.5">
                      {status?.isRecurring && <Repeat className="w-3 h-3 text-slate-400" />}
                      {hasConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Scheduling conflict" />}
                      {status?.status === 'unavailable' && !status?.isRecurring && (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      )}
                      {status?.status === 'tentative' && !status?.isRecurring && (
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Reason label */}
                  {status?.reason && day.isCurrentMonth && (
                    <p className={`text-[10px] mt-0.5 truncate ${
                      status.status === 'unavailable' ? 'text-red-500' : 'text-amber-600'
                    }`}>
                      {REASONS.find(r => r.value === status.reason)?.icon} {status.reason}
                    </p>
                  )}

                  {/* Event dots */}
                  {dayEvents.length > 0 && day.isCurrentMonth && (
                    <div className="flex flex-wrap gap-0.5 mt-auto pt-1">
                      {dayEvents.slice(0, 3).map((evt, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-0.5"
                          title={`${evt.event_type}: ${evt.title || ''} ${evt.event_time ? formatTime12(evt.event_time) : ''}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: evt.teams?.color || (evt.event_type === 'game' ? '#F59E0B' : '#8B5CF6') }}
                          />
                          <span className={`text-[9px] hidden sm:inline truncate max-w-[50px] ${tc.textMuted}`}>
                            {evt.event_type === 'game' ? 'Game' : 'Prac'}
                          </span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className={`text-[9px] ${tc.textMuted}`}>+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className={`px-6 py-3 border-t ${tc.border} flex flex-wrap items-center gap-4`}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-500" />
            <span className={`text-r-xs ${tc.textMuted}`}>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={`text-r-xs ${tc.textMuted}`}>Unavailable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className={`text-r-xs ${tc.textMuted}`}>Tentative</span>
          </div>
          <div className={`w-px h-4 ${tc.border}`} />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className={`text-r-xs ${tc.textMuted}`}>Game</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className={`text-r-xs ${tc.textMuted}`}>Practice</span>
          </div>
          {isCoach && (
            <>
              <div className={`w-px h-4 ${tc.border}`} />
              <span className={`text-r-xs ${tc.textMuted}`}>
                <Info className="w-3 h-3 inline mr-1" />
                Click to toggle, Shift+Click for range
              </span>
            </>
          )}
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedDates.size > 0 && isCoach && (
        <div className={`flex items-center gap-3 p-4 rounded-[14px] border ${
          isDark ? 'bg-lynx-sky/10 border-lynx-sky/20' : 'bg-lynx-sky/5 border-lynx-sky/20'
        }`}>
          <CalendarCheck2 className="w-5 h-5 text-lynx-sky shrink-0" />
          <span className={`text-r-sm font-medium flex-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={markSelectedDates}
            className="px-4 py-2 rounded-lg text-r-sm font-bold text-white bg-lynx-navy hover:brightness-110 transition"
          >
            Mark Selected
          </button>
          <button
            onClick={clearSelectedDates}
            className={`px-3 py-2 rounded-lg text-r-sm font-medium transition ${
              isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
