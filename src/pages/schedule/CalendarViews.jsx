import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { getEventColor, formatTime, formatTime12 } from './scheduleHelpers'
import { Clock, MapPin, Trophy, Target, Award, Users, Calendar } from 'lucide-react'
import EventCard from '../../components/pages/EventCard'

// Event type color config for The Stack & all views
const EVENT_COLORS = {
  practice:   { border: 'bg-[#4BB9EC]', badge: 'bg-[#4BB9EC]/10 text-[#4BB9EC]', icon: '#4BB9EC' },
  game:       { border: 'bg-[#F59E0B]', badge: 'bg-[#F59E0B]/10 text-[#F59E0B]', icon: '#F59E0B' },
  tournament: { border: 'bg-[#8B5CF6]', badge: 'bg-[#8B5CF6]/10 text-[#8B5CF6]', icon: '#8B5CF6' },
  meeting:    { border: 'bg-[#22C55E]', badge: 'bg-[#22C55E]/10 text-[#22C55E]', icon: '#22C55E' },
  team_event: { border: 'bg-[#3B82F6]', badge: 'bg-[#3B82F6]/10 text-[#3B82F6]', icon: '#3B82F6' },
  other:      { border: 'bg-slate-400', badge: 'bg-slate-400/10 text-slate-400', icon: '#94A3B8' },
}

const EVENT_ICONS = {
  practice: Target,
  game: Trophy,
  tournament: Award,
  meeting: Users,
  team_event: Users,
  other: Calendar,
}

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
    <div>
      {/* Calendar grid */}
      <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}>
        {/* Day-of-week headers */}
        <div className={`grid grid-cols-7 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className={`p-3 text-center text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
          ))}
        </div>
        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day)
            const todayCell = isToday(day)
            const past = isPast(day)
            return (
              <div
                key={i}
                className={`min-h-[110px] p-2 border-b border-r transition-colors ${
                  isDark ? 'border-white/[0.04]' : 'border-[#E8ECF2]/60'
                } ${!day
                  ? (isDark ? 'bg-[#0B1628]/40' : 'bg-slate-50/50')
                  : todayCell
                    ? (isDark ? 'bg-[#4BB9EC]/[0.06] border-l-2 border-l-[#4BB9EC]' : 'bg-[#4BB9EC]/[0.04] border-l-2 border-l-[#4BB9EC]')
                    : `${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#F5F6F8]'} cursor-pointer`
                } ${past && day ? 'opacity-50' : ''}`}
                onClick={() => day && onSelectDate(new Date(year, month, day))}
              >
                {day && (
                  <>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-sm font-black ${
                        todayCell
                          ? 'w-7 h-7 bg-[#4BB9EC] text-white rounded-full flex items-center justify-center shadow-sm'
                          : (isDark ? 'text-white' : 'text-[#10284C]')
                      }`}>
                        {day}
                      </span>
                      {todayCell && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#4BB9EC]">Today</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const type = event.event_type || 'other'
                        const colors = EVENT_COLORS[type] || EVENT_COLORS.other
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                            className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs font-semibold truncate cursor-pointer transition hover:brightness-110 ${
                              isDark ? 'bg-white/[0.04] text-slate-300' : 'bg-[#F5F6F8] text-[#10284C]'
                            }`}
                          >
                            <div className={`w-0.5 h-3.5 rounded-full shrink-0 ${colors.border}`} />
                            <span className="truncate">{event.title || event.event_type}</span>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className={`text-[10px] font-bold px-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend footer */}
      <div className="flex items-center justify-center gap-6 mt-4">
        {[
          { label: 'Practice', color: '#4BB9EC' },
          { label: 'Game', color: '#F59E0B' },
          { label: 'Tournament', color: '#8B5CF6' },
          { label: 'Team Event', color: '#3B82F6' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
          </div>
        ))}
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
// LIST VIEW — "The Stack" — Day-grouped rich event cards
// ============================================
export function ListView({ events, onSelectEvent, teams }) {
  const { isDark } = useTheme()
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const grouped = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  const today = new Date()
  today.setHours(0,0,0,0)

  // Weekly date strip
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    const dayEvents = events.filter(e => {
      const ed = new Date(e.start_time)
      return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
    })
    weekDays.push({ date: d, hasEvents: dayEvents.length > 0, eventTypes: [...new Set(dayEvents.map(e => e.event_type))] })
  }

  return (
    <div className="space-y-8">
      {/* Weekly date strip */}
      <div className={`sticky top-0 z-10 flex items-center gap-1 p-2 rounded-2xl border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}>
        {weekDays.map((wd, i) => {
          const isWdToday = wd.date.getDate() === today.getDate() && wd.date.getMonth() === today.getMonth() && wd.date.getFullYear() === today.getFullYear()
          return (
            <div key={i} className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
              isWdToday
                ? (isDark ? 'bg-white/[0.1]' : 'bg-[#10284C] text-white')
                : ''
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                isWdToday ? (isDark ? 'text-white' : 'text-white/70') : (isDark ? 'text-slate-500' : 'text-slate-400')
              }`}>
                {wd.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-xl font-black ${
                isWdToday ? (isDark ? 'text-white' : 'text-white') : (isDark ? 'text-white' : 'text-[#10284C]')
              }`}>
                {wd.date.getDate()}
              </span>
              {wd.hasEvents && (
                <div className="flex gap-0.5 mt-1">
                  {wd.eventTypes.slice(0, 3).map((type, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (EVENT_COLORS[type] || EVENT_COLORS.other).icon }} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Day groups */}
      <div className="space-y-12">
        {Object.entries(grouped).map(([date, dayEvents]) => {
          const dateObj = new Date(date)
          const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()

          return (
            <div key={date}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className={`text-2xl font-black tracking-tighter italic uppercase ${
                  isToday ? (isDark ? 'text-white' : 'text-[#10284C]') : (isDark ? 'text-slate-500' : 'text-slate-400')
                }`} style={{ fontFamily: 'var(--v2-font)' }}>
                  {dayLabel}
                </h2>
                {isToday && (
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                    isDark ? 'bg-[#FFD700] text-[#10284C]' : 'bg-[#22C55E] text-white'
                  }`}>Today</span>
                )}
              </div>

              {/* Event cards */}
              <div className="space-y-3">
                {dayEvents.map(event => {
                  const type = event.event_type || 'other'
                  const colors = EVENT_COLORS[type] || EVENT_COLORS.other
                  const EventIcon = EVENT_ICONS[type] || EVENT_ICONS.other

                  return (
                    <div key={event.id}
                      className={`group relative rounded-[14px] overflow-hidden transition-all cursor-pointer ${
                        isDark
                          ? 'bg-[#132240] hover:bg-[#1a2d50] shadow-lg'
                          : 'bg-white hover:shadow-[0_2px_8px_rgba(16,40,76,0.08)] border border-[#E8ECF2]'
                      }`}
                      onClick={() => onSelectEvent(event)}
                    >
                      {/* Left color border */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.border}`} />

                      <div className="p-5 pl-6 flex items-center justify-between gap-6">
                        {/* Left: Icon + Info */}
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-[#F5F6F8]'
                          }`}>
                            <EventIcon className="w-5 h-5" style={{ color: colors.icon }} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black tracking-widest uppercase text-[#4BB9EC]">
                                {event.teams?.name || 'All Teams'}
                              </span>
                              <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                              <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {type}
                              </span>
                            </div>
                            <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                              {event.title || event.event_type}
                            </h3>
                            <div className={`flex items-center gap-4 mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime12(event.event_time)}{event.end_time ? ` — ${formatTime12(event.end_time)}` : ''}
                              </span>
                              {(event.venue_name || event.location) && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {event.venue_name || event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: RSVP + Type badge */}
                        <div className="flex items-center gap-5 shrink-0">
                          {event.rsvpCount !== undefined && (
                            <div className="text-right">
                              <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>RSVP</div>
                              <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                                {event.rsvpCount || 0}/{event.rsvpTotal || '—'}
                              </div>
                            </div>
                          )}
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${colors.badge}`}>
                            {type}
                          </span>
                        </div>
                      </div>
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
