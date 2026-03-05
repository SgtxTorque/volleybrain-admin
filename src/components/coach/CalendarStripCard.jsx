// =============================================================================
// CalendarStripCard — Week-view calendar strip with day selection + event list
// Reference: mobile app's DayStripCalendar component
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

  // Compute the week's days
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

  // Auto-select today on mount
  const activeDayIdx = selectedDayIdx !== null ? selectedDayIdx : weekDays.findIndex(d => d.isToday)
  const activeDay = weekDays[activeDayIdx >= 0 ? activeDayIdx : 0]

  // Events for selected day
  const dayEvents = events.filter(e => e.event_date === activeDay?.dateStr)

  // Events-per-day lookup for dots
  const eventDaySet = useMemo(() => {
    const set = new Set()
    events.forEach(e => set.add(e.event_date))
    return set
  }, [events])

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  const monthLabel = weekDays[3]?.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-r-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {monthLabel}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setWeekOffset(w => w - 1); setSelectedDayIdx(null) }}
            className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => { setWeekOffset(0); setSelectedDayIdx(null) }}
            className={`px-2 py-0.5 rounded-lg text-r-xs font-bold ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            Today
          </button>
          <button onClick={() => { setWeekOffset(w => w + 1); setSelectedDayIdx(null) }}
            className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Strip */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map((day, idx) => {
          const isActive = idx === (activeDayIdx >= 0 ? activeDayIdx : 0)
          const hasEvent = eventDaySet.has(day.dateStr)
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDayIdx(idx)}
              className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                isActive
                  ? 'bg-lynx-sky text-white'
                  : day.isToday
                    ? isDark ? 'bg-lynx-sky/10 text-lynx-sky' : 'bg-lynx-sky/10 text-lynx-sky'
                    : isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-r-xs font-bold uppercase">{day.dayName}</span>
              <span className={`text-r-lg font-bold ${isActive ? '' : ''}`}>{day.dayNum}</span>
              {hasEvent && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white' : 'bg-lynx-sky'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Day Events */}
      <div className={`min-h-[60px] ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100'} pt-3`}>
        {dayEvents.length === 0 ? (
          <p className={`text-r-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No events on this day</p>
        ) : (
          <div className="space-y-2">
            {dayEvents.slice(0, 3).map(event => (
              <button
                key={event.id}
                onClick={() => onEventSelect?.(event)}
                className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-r-lg">{event.event_type === 'game' ? '🏐' : '⚡'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-r-base font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {event.event_type === 'game' && event.opponent_name
                      ? `vs ${event.opponent_name}`
                      : event.title || event.event_type}
                  </p>
                  <p className={`text-r-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatTime12(event.event_time)}{event.venue_name ? ` · ${event.venue_name}` : ''}
                  </p>
                </div>
              </button>
            ))}
            {dayEvents.length > 3 && (
              <button
                onClick={() => onNavigate?.('schedule')}
                className="text-r-sm font-semibold text-lynx-sky hover:brightness-110"
              >
                +{dayEvents.length - 3} more events →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`mt-3 pt-2 ${isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100'}`}>
        <button onClick={() => onNavigate?.('schedule')} className="text-r-sm font-semibold text-lynx-sky hover:brightness-110 flex items-center gap-1">
          View Full Schedule <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
