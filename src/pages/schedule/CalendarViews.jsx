import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { getEventColor, formatTime } from './scheduleHelpers'
import EventCard from '../../components/pages/EventCard'

// Brand type styles for event pills (full background tinting, NOT just left border)
const EVENT_TYPE_STYLES = {
  game:       { bg: 'bg-amber-100/80',   text: 'text-amber-800',   dot: 'bg-amber-500',   darkBg: 'bg-amber-900/30',   darkText: 'text-amber-300' },
  practice:   { bg: 'bg-emerald-100/70',  text: 'text-emerald-800', dot: 'bg-emerald-500',  darkBg: 'bg-emerald-900/30',  darkText: 'text-emerald-300' },
  tournament: { bg: 'bg-purple-100/70',   text: 'text-purple-800',  dot: 'bg-purple-500',   darkBg: 'bg-purple-900/30',   darkText: 'text-purple-300' },
  team_event: { bg: 'bg-sky-100/70',      text: 'text-sky-800',     dot: 'bg-sky-500',      darkBg: 'bg-sky-900/30',      darkText: 'text-sky-300' },
  other:      { bg: 'bg-slate-100',       text: 'text-slate-700',   dot: 'bg-slate-400',    darkBg: 'bg-slate-700/40',    darkText: 'text-slate-300' },
}

function getTypeStyle(eventType) {
  return EVENT_TYPE_STYLES[eventType] || EVENT_TYPE_STYLES.other
}

// ── Hover Popup for event pills ──
function EventHoverPopup({ event, position }) {
  const type = event.event_type || 'other'
  const ts = getTypeStyle(type)

  return (
    <div
      className="absolute z-50 w-72 rounded-[14px] bg-white border border-slate-200 shadow-xl p-4 pointer-events-none"
      style={{ top: position.top, left: position.left }}
    >
      <div className={`h-[3px] rounded-full mb-3 ${ts.dot}`} />
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${ts.bg} ${ts.text}`}>
          {type}
        </span>
        {event.teams?.name && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
            {event.teams.name}
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-slate-900 mb-1">{event.title || event.event_type}</p>
      <p className="text-r-xs text-slate-500">
        {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
      </p>
      {event.venue_name && (
        <p className="text-r-xs text-slate-500 mt-0.5">📍 {event.venue_name}{event.court_number ? ` · Ct ${event.court_number}` : ''}</p>
      )}
      {event.opponent_name && (
        <p className="text-r-xs font-semibold text-amber-700 mt-1">vs. {event.opponent_name}</p>
      )}
    </div>
  )
}

// ── Branded Event Pill (used in Month + Week views) ──
function EventPill({ event, onClick, compact }) {
  const { isDark } = useTheme()
  const [hovered, setHovered] = useState(false)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const type = event.event_type || 'other'
  const ts = getTypeStyle(type)

  function handleMouseEnter(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setPopupPos({ top: -8, left: rect.width + 8 })
    setHovered(true)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onClick(event) }}
        className={`text-xs px-1.5 py-1 rounded-md truncate cursor-pointer transition font-semibold
          ${isDark ? `${ts.darkBg} ${ts.darkText}` : `${ts.bg} ${ts.text}`}
          hover:brightness-110`}
      >
        {!compact && event.teams?.name && (
          <span className="font-bold opacity-70">{event.teams.name.length <= 6 ? event.teams.name : event.teams.name.substring(0, 3)} · </span>
        )}
        {compact ? (event.title || event.event_type) : `${formatTime(event.start_time)} ${event.title || event.event_type}`}
        {!compact && event.court_number && <span className="opacity-50"> · Ct {event.court_number}</span>}
      </div>
      {hovered && !compact && <EventHoverPopup event={event} position={popupPos} />}
    </div>
  )
}

// ============================================
// MONTH VIEW — Calendar grid
// ============================================
export function MonthView({ events, currentDate, onSelectEvent, onSelectDate, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []
  for (let i = 0; i < startPadding; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const getEventsForDay = (day) => {
    if (!day) return []
    const dayStart = new Date(year, month, day)
    const dayEnd = new Date(year, month, day, 23, 59, 59)
    return events.filter(e => {
      const eventDate = new Date(e.start_time)
      return eventDate >= dayStart && eventDate <= dayEnd
    })
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const isPast = (day) => {
    if (!day) return false
    const today = new Date()
    today.setHours(0,0,0,0)
    return new Date(year, month, day) < today
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver shadow-sm'}`}>
      <div className={`grid grid-cols-7 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className={`p-3 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const today = isToday(day)
          const past = isPast(day)
          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 border-b border-r transition-colors ${
                isDark ? 'border-slate-700/50' : 'border-slate-100'
              } ${!day
                ? (isDark ? 'bg-slate-900/30' : 'bg-slate-50/50')
                : today
                  ? 'bg-sky-50/60'
                  : `${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-lynx-cloud'} cursor-pointer`
              } ${past && day ? 'opacity-60' : ''}`}
              onClick={() => day && onSelectDate(new Date(year, month, day))}
            >
              {day && (
                <>
                  <div className={`text-sm font-bold mb-1 ${
                    today
                      ? 'w-7 h-7 bg-lynx-sky text-white rounded-full flex items-center justify-center shadow-sm'
                      : tc.text
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <EventPill key={event.id} event={event} onClick={onSelectEvent} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className={`text-xs font-medium ${tc.textMuted}`}>+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// WEEK VIEW — Hourly grid
// ============================================
export function WeekView({ events, currentDate, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  const hours = []
  for (let h = 6; h <= 22; h++) hours.push(h)

  const getEventsForDayHour = (day, hour) => {
    return events.filter(e => {
      const eventDate = new Date(e.start_time)
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getHours() === hour
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear()
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver shadow-sm'}`}>
      <div className={`grid grid-cols-8 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
        <div className="p-3 text-center text-sm font-medium"></div>
        {weekDays.map((day, i) => (
          <div key={i} className={`p-3 text-center ${isToday(day) ? 'bg-sky-50/60' : ''}`}>
            <div className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className={`text-lg font-extrabold ${isToday(day) ? 'text-lynx-sky' : tc.text}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className={`grid grid-cols-8 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <div className={`p-2 text-xs text-right pr-3 font-medium ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
              {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
            </div>
            {weekDays.map((day, i) => {
              const hourEvents = getEventsForDayHour(day, hour)
              return (
                <div key={i} className={`p-1 min-h-[50px] border-l ${isDark ? 'border-slate-700/50' : 'border-slate-100'} ${isToday(day) ? 'bg-sky-50/30' : ''}`}>
                  {hourEvents.map(event => (
                    <div key={event.id} className="mb-1">
                      <EventPill event={event} onClick={onSelectEvent} />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// DAY VIEW — Single-day hourly timeline
// ============================================
export function DayView({ events, currentDate, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.start_time)
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear()
  })

  const hours = []
  for (let h = 6; h <= 22; h++) hours.push(h)

  return (
    <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver shadow-sm'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
        <h3 className={`text-lg font-bold ${tc.text}`}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <p className={`text-sm ${tc.textMuted}`}>{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(e => new Date(e.start_time).getHours() === hour)
          return (
            <div key={hour} className={`flex border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <div className={`w-20 p-3 text-sm text-right shrink-0 font-medium ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div className="flex-1 p-2 min-h-[60px]">
                {hourEvents.map(event => {
                  const type = event.event_type || 'other'
                  const ts = getTypeStyle(type)
                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={`p-3 rounded-xl cursor-pointer hover:brightness-105 mb-2 transition ${isDark ? ts.darkBg : `${ts.bg} shadow-sm`}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm ${isDark ? ts.darkText : ts.text}`}>{event.title || event.event_type}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isDark ? `${ts.darkBg} ${ts.darkText}` : `${ts.bg} ${ts.text}`}`}>
                          {event.event_type}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 ${tc.textMuted}`}>
                        {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : 'TBD'}
                      </div>
                      {event.venue_name && (
                        <div className={`text-sm mt-1 ${tc.textMuted}`}>📍 {event.venue_name}{event.court_number ? ` (${event.court_number})` : ''}</div>
                      )}
                      {event.teams?.name && (
                        <div className="text-sm font-semibold mt-1 text-sky-600">{event.teams.name}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// LIST VIEW — Chronological grouped list using EventCard
// ============================================
export function ListView({ events, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const grouped = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  const today = new Date()
  today.setHours(0,0,0,0)

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayEvents]) => {
        const dateObj = new Date(date)
        const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              {isToday && <div className="w-1 h-5 rounded-full bg-lynx-sky" />}
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-lynx-sky' : tc.textMuted}`}>
                {isToday ? 'Today — ' : ''}
                {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            {dayEvents.map(event => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  date_display: formatTime(event.start_time),
                  time_display: event.end_time ? formatTime(event.end_time) : '',
                  venue: event.venue_name || '',
                  team_name: event.teams?.name || '',
                }}
                onClick={() => onSelectEvent(event)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
