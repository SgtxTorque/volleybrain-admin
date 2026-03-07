// =============================================================================
// CalendarStripCard — Week-view calendar strip with day selection + event list
// Horizontal day strip, "View Full Schedule" button below strip, events below
// =============================================================================

import { useState, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

function formatTime12(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarStripCard({ events = [], onNavigate, onEventSelect }) {
  const { isDark } = useTheme()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDayIdx, setSelectedDayIdx] = useState(null)

  const weekDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7)

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return {
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayName: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
      }
    })
  }, [weekOffset])

  const activeDayIdx = selectedDayIdx !== null ? selectedDayIdx : weekDays.findIndex(d => d.isToday)
  const activeDay = weekDays[activeDayIdx >= 0 ? activeDayIdx : 0]

  const dayEvents = events.filter(e => e.event_date === activeDay?.dateStr)

  const eventDaySet = useMemo(() => {
    const set = new Set()
    events.forEach(e => set.add(e.event_date))
    return set
  }, [events])

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  const monthLabel = weekDays[3]?.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4 h-full flex flex-col overflow-hidden`}>
      {/* Header — compact for narrow card */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {monthLabel}
          </h3>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => { setWeekOffset(w => w - 1); setSelectedDayIdx(null) }}
            className={`p-0.5 rounded ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setWeekOffset(0); setSelectedDayIdx(null) }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            Today
          </button>
          <button onClick={() => { setWeekOffset(w => w + 1); setSelectedDayIdx(null) }}
            className={`p-0.5 rounded ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Day Strip — horizontal row */}
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {weekDays.map((day, idx) => {
          const isActive = idx === (activeDayIdx >= 0 ? activeDayIdx : 0)
          const hasEvent = eventDaySet.has(day.dateStr)
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center py-1 rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-lynx-sky text-white'
                  : day.isToday
                    ? 'bg-lynx-sky/10 text-lynx-sky'
                    : isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-[9px] font-bold uppercase leading-tight">{day.dayName}</span>
              <span className="text-xs font-bold leading-tight">{day.dayNum}</span>
              {hasEvent && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-lynx-sky'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* "View Full Schedule" button — between strip and events */}
      <button
        onClick={() => onNavigate?.('schedule')}
        className="w-full py-2 rounded-lg bg-lynx-navy text-white text-r-sm font-bold hover:brightness-125 transition-colors text-center mb-2"
      >
        View Full Schedule
      </button>

      {/* Day Events */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100'} pt-2`}>
        {dayEvents.length === 0 ? (
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No events on this day</p>
        ) : (
          <div className="space-y-1.5">
            {dayEvents.slice(0, 3).map(event => (
              <button
                key={event.id}
                onClick={() => onEventSelect?.(event)}
                className={`w-full text-left flex items-start gap-2 p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-sm">{event.event_type === 'game' ? '🏐' : '⚡'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {event.event_type === 'game' && event.opponent_name
                      ? `vs ${event.opponent_name}`
                      : event.title || event.event_type}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatTime12(event.event_time)}
                  </p>
                </div>
              </button>
            ))}
            {dayEvents.length > 3 && (
              <p className={`text-[10px] font-semibold ${isDark ? 'text-lynx-sky' : 'text-lynx-sky'} text-center`}>
                +{dayEvents.length - 3} more
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
