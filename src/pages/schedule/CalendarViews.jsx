import { useState, useRef } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { getEventColor, formatTime } from './scheduleHelpers'

// ============================================
// EVENT TOOLTIP — Hover preview card
// ============================================
function EventTooltip({ event, isDark, style }) {
  const typeColor = getEventColor(event.event_type)
  const teamColor = event.teams?.color || typeColor

  return (
    <div
      className="absolute z-50 w-64 shadow-2xl pointer-events-none"
      style={{
        ...style,
        background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)',
        borderRadius: 16,
        animation: 'tooltipIn .15s ease-out',
      }}
    >
      <style>{`@keyframes tooltipIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: teamColor }} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: isDark ? 'white' : '#1a1a1a' }}>
              {event.title || event.event_type}
            </p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: typeColor + '20', color: typeColor }}>
              {event.event_type}
            </span>
          </div>
        </div>
        <div className="space-y-1.5 text-[12px]" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}>
          <p>
            {formatTime(event.start_time)}{event.end_time ? ` - ${formatTime(event.end_time)}` : ''}
          </p>
          {event.venue_name && (
            <p>📍 {event.venue_name}{event.court_number ? ` (Court ${event.court_number})` : ''}</p>
          )}
          {event.teams?.name && (
            <p style={{ color: teamColor, fontWeight: 600 }}>{event.teams.name}</p>
          )}
          {event.rsvp_count != null && (
            <p>✅ {event.rsvp_count} RSVP{event.rsvp_count !== 1 ? 's' : ''}</p>
          )}
          {event.notes && (
            <p className="truncate" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)' }}>{event.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// useEventTooltip — Shared hover hook
// ============================================
function useEventTooltip() {
  const [tooltip, setTooltip] = useState(null)
  const timeoutRef = useRef(null)

  const showTooltip = (event, e) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      event,
      style: {
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 280),
        position: 'fixed',
      },
    })
  }

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => setTooltip(null), 100)
  }

  return { tooltip, showTooltip, hideTooltip }
}

// ============================================
// MONTH VIEW — Calendar grid
// ============================================
export function MonthView({ events, currentDate, onSelectEvent, onSelectDate, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { tooltip, showTooltip, hideTooltip } = useEventTooltip()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []
  for (let i = 0; i < startPadding; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

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
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      {/* Day headers */}
      <div className={`grid grid-cols-7 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className={`p-3 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
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
                  ? (isDark ? 'bg-[var(--accent-primary)]/5' : 'bg-[var(--accent-primary)]/5')
                  : `${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} cursor-pointer`
              } ${past && day ? 'opacity-60' : ''}`}
              onClick={() => day && onSelectDate(new Date(year, month, day))}
            >
              {day && (
                <>
                  <div className={`text-sm font-bold mb-1 ${
                    today
                      ? 'w-7 h-7 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center shadow-sm'
                      : tc.text
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const teamColor = event.teams?.color
                      const typeColor = getEventColor(event.event_type)
                      const accentColor = teamColor || typeColor
                      const teamName = event.teams?.name
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                          onMouseEnter={(e) => showTooltip(event, e)}
                          onMouseLeave={hideTooltip}
                          className="text-xs px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:brightness-110 transition font-medium"
                          style={{
                            backgroundColor: accentColor + (isDark ? '22' : '15'),
                            color: typeColor,
                            borderLeft: `4px solid ${accentColor}`
                          }}
                        >
                          {teamName && <span className="font-bold opacity-70" style={{ color: accentColor }}>{teamName.length <= 6 ? teamName : teamName.substring(0, 3)} · </span>}
                          {formatTime(event.start_time)} {event.title || event.event_type}
                          {event.court_number && <span className="opacity-50"> · Ct {event.court_number}</span>}
                        </div>
                      )
                    })}
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
      {tooltip && <EventTooltip event={tooltip.event} isDark={isDark} style={tooltip.style} />}
    </div>
  )
}

// ============================================
// WEEK VIEW — Hourly grid
// ============================================
export function WeekView({ events, currentDate, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { tooltip, showTooltip, hideTooltip } = useEventTooltip()
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  const hours = []
  for (let h = 6; h <= 22; h++) {
    hours.push(h)
  }

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
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      {/* Day headers */}
      <div className={`grid grid-cols-8 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="p-3 text-center text-sm font-medium"></div>
        {weekDays.map((day, i) => (
          <div key={i} className={`p-3 text-center ${isToday(day) ? 'bg-[var(--accent-primary)]/10' : ''}`}>
            <div className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className={`text-lg font-extrabold ${isToday(day) ? 'text-[var(--accent-primary)]' : tc.text}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className={`grid grid-cols-8 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <div className={`p-2 text-xs text-right pr-3 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
            </div>
            {weekDays.map((day, i) => {
              const hourEvents = getEventsForDayHour(day, hour)
              return (
                <div key={i} className={`p-1 min-h-[50px] border-l ${isDark ? 'border-slate-700/50' : 'border-slate-100'} ${isToday(day) ? 'bg-[var(--accent-primary)]/5' : ''}`}>
                  {hourEvents.map(event => {
                    const teamColor = event.teams?.color
                    const typeColor = getEventColor(event.event_type)
                    const accentColor = teamColor || typeColor
                    return (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        onMouseEnter={(e) => showTooltip(event, e)}
                        onMouseLeave={hideTooltip}
                        className="text-xs p-1.5 rounded-md truncate cursor-pointer hover:brightness-110 mb-1 font-medium transition"
                        style={{
                          backgroundColor: accentColor + (isDark ? '25' : '18'),
                          color: typeColor,
                          borderLeft: `3px solid ${accentColor}`
                        }}
                      >
                        {event.teams?.name && <span className="font-bold opacity-70" style={{ color: accentColor }}>{event.teams.name.length <= 6 ? event.teams.name : event.teams.name.substring(0, 3)} · </span>}
                        {event.title || event.event_type}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {tooltip && <EventTooltip event={tooltip.event} isDark={isDark} style={tooltip.style} />}
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
  for (let h = 6; h <= 22; h++) {
    hours.push(h)
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
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
              <div className={`w-20 p-3 text-sm text-right shrink-0 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div className="flex-1 p-2 min-h-[60px]">
                {hourEvents.map(event => {
                  const teamColor = event.teams?.color
                  const typeColor = getEventColor(event.event_type)
                  const accentColor = teamColor || typeColor
                  return (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={`p-3 rounded-xl cursor-pointer hover:brightness-105 mb-2 transition ${isDark ? '' : 'shadow-sm'}`}
                    style={{
                      backgroundColor: accentColor + (isDark ? '15' : '12'),
                      borderLeft: `4px solid ${accentColor}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${tc.text}`}>{event.title || event.event_type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: typeColor + '25', color: typeColor }}>
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
                      <div className="text-sm font-medium mt-1" style={{ color: event.teams.color }}>{event.teams.name}</div>
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
// LIST VIEW — Chronological grouped list
// ============================================
export function ListView({ events, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { tooltip, showTooltip, hideTooltip } = useEventTooltip()
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  // Group by date
  const grouped = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${tc.textMuted}`}>
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                onMouseEnter={(e) => showTooltip(event, e)}
                onMouseLeave={hideTooltip}
                className={`rounded-xl p-4 cursor-pointer transition-all border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-[var(--accent-primary)]/30'
                    : 'bg-white border-slate-200 hover:border-[var(--accent-primary)]/40 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-12 rounded-full"
                      style={{ backgroundColor: event.teams?.color || getEventColor(event.event_type) }}
                    />
                    <div>
                      <p className={`font-bold text-sm ${tc.text}`}>{event.title || event.event_type}</p>
                      <p className={`text-sm ${tc.textMuted}`}>
                        {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : 'TBD'}
                        {event.venue_name && ` • 📍 ${event.venue_name}`}
                        {event.court_number && ` (${event.court_number})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: getEventColor(event.event_type) + '20', color: getEventColor(event.event_type) }}>
                      {event.event_type}
                    </span>
                    {event.teams?.name && (
                      <p className="text-xs font-semibold" style={{ color: event.teams.color }}>{event.teams.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {tooltip && <EventTooltip event={tooltip.event} isDark={isDark} style={tooltip.style} />}
    </div>
  )
}
