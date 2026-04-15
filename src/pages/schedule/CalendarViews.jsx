import { useState } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { getEventColor, formatTime, formatTime12 } from './scheduleHelpers'
import { Clock, MapPin, Trophy, Target, Award, Users, Calendar } from 'lucide-react'
import EventCard from '../../components/pages/EventCard'
import TeamLogo from '../../components/TeamLogo'

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
  game:       { bg: 'bg-[#10284C]',         text: 'text-white',        dot: 'bg-[#10284C]',    darkBg: 'bg-[#10284C]',       darkText: 'text-white' },
  practice:   { bg: 'bg-emerald-500/20',     text: 'text-emerald-800',  dot: 'bg-emerald-500',  darkBg: 'bg-emerald-500/20',  darkText: 'text-emerald-300' },
  tournament: { bg: 'bg-purple-500/20',      text: 'text-purple-800',   dot: 'bg-purple-500',   darkBg: 'bg-purple-500/20',   darkText: 'text-purple-300' },
  team_event: { bg: 'bg-sky-500/20',         text: 'text-sky-800',      dot: 'bg-sky-500',      darkBg: 'bg-sky-500/20',      darkText: 'text-sky-300' },
  other:      { bg: 'bg-slate-200',          text: 'text-slate-700',    dot: 'bg-slate-400',    darkBg: 'bg-slate-700/40',    darkText: 'text-slate-300' },
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
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
            <TeamLogo team={event.teams} size={14} />
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
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => {
                        const type = event.event_type || 'other'
                        const isGame = type === 'game'
                        const isTournament = type === 'tournament'
                        const isPractice = type === 'practice'
                        const teamColor = event.teams?.color || '#6366F1'

                        const pillBg = isGame
                          ? (isDark ? 'bg-[#10284C]' : 'bg-[#10284C]')
                          : isPractice
                            ? (isDark ? 'bg-emerald-900/40' : 'bg-emerald-500/15')
                            : isTournament
                              ? (isDark ? 'bg-purple-900/40' : 'bg-purple-500/15')
                              : (isDark ? 'bg-white/[0.06]' : 'bg-slate-100')

                        const pillText = isGame
                          ? 'text-white'
                          : isPractice
                            ? (isDark ? 'text-emerald-300' : 'text-emerald-800')
                            : isTournament
                              ? (isDark ? 'text-purple-300' : 'text-purple-800')
                              : (isDark ? 'text-slate-300' : 'text-slate-700')

                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition hover:brightness-110 ${pillBg}`}
                          >
                            {event.teams && <TeamLogo team={event.teams} size={12} className="shrink-0" />}
                            {!event.teams && <div className="w-[3px] h-3 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />}
                            <span className={`text-[10px] font-bold truncate ${pillText}`}>
                              {event.title || event.event_type}
                            </span>
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
          { label: 'Practice', color: '#10B981' },
          { label: 'Game', bg: 'bg-[#10284C]', textColor: 'text-white' },
          { label: 'Tournament', color: '#8B5CF6' },
          { label: 'Team Event', color: '#3B82F6' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.bg ? (
              <div className={`w-4 h-3 rounded-sm ${item.bg}`} />
            ) : (
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: `${item.color}30` }}>
                <div className="w-[3px] h-full rounded-l-sm" style={{ backgroundColor: item.color }} />
              </div>
            )}
            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// WEEK VIEW — Swim-lane timeline (teams as rows, days as columns)
// ============================================
export function WeekView({ events, currentDate, onSelectEvent, teams }) {
  const { isDark } = useTheme()
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  const isToday = (day) => {
    const today = new Date()
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear()
  }

  const isWeekend = (day) => day.getDay() === 0 || day.getDay() === 6

  // Group events by team
  const teamRows = []
  const teamMap = {}
  events.forEach(e => {
    const teamId = e.team_id || 'no-team'
    if (!teamMap[teamId]) {
      const team = e.teams || teams.find(t => t.id === e.team_id)
      teamMap[teamId] = { id: teamId, name: team?.name || 'All Teams', color: team?.color || '#6366F1', events: [] }
    }
    teamMap[teamId].events.push(e)
  })
  Object.values(teamMap).sort((a, b) => a.name.localeCompare(b.name)).forEach(t => teamRows.push(t))

  const getTeamDayEvents = (teamRow, day) => {
    return teamRow.events.filter(e => {
      const ed = new Date(e.start_time)
      return ed.getDate() === day.getDate() && ed.getMonth() === day.getMonth() && ed.getFullYear() === day.getFullYear()
    })
  }

  const weekEventCount = events.filter(e => {
    const ed = new Date(e.start_time)
    return ed >= weekDays[0] && ed <= new Date(weekDays[6].getFullYear(), weekDays[6].getMonth(), weekDays[6].getDate(), 23, 59, 59)
  }).length

  return (
    <div>
      <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}>
        {/* Day column headers */}
        <div className={`grid border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}
          style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}>
          <div className={`p-3 flex items-center ${isDark ? 'bg-white/[0.02]' : 'bg-[#F5F6F8]'}`}>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Team</span>
          </div>
          {weekDays.map((day, i) => (
            <div key={i} className={`p-3 text-center transition-colors ${
              isToday(day) ? (isDark ? 'bg-[#4BB9EC]/[0.06]' : 'bg-[#4BB9EC]/[0.04]') : isWeekend(day) ? (isDark ? 'bg-white/[0.01]' : 'bg-slate-50/50') : ''
            }`}>
              <div className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-xl font-black ${isToday(day) ? 'text-[#4BB9EC]' : (isDark ? 'text-white' : 'text-[#10284C]')}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Team swim lanes */}
        <div className="max-h-[600px] overflow-y-auto">
          {teamRows.map(teamRow => (
            <div key={teamRow.id}
              className={`grid border-b ${isDark ? 'border-white/[0.04]' : 'border-[#E8ECF2]/60'}`}
              style={{ gridTemplateColumns: '160px repeat(7, 1fr)' }}>
              {/* Team label */}
              <div className={`p-3 flex items-center gap-2 ${isDark ? 'bg-white/[0.02]' : 'bg-[#F5F6F8]'}`}>
                <TeamLogo team={teamRow} size={18} className="shrink-0" />
                <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                  {teamRow.name}
                </span>
              </div>
              {/* Day cells */}
              {weekDays.map((day, i) => {
                const dayEvents = getTeamDayEvents(teamRow, day)
                return (
                  <div key={i} className={`p-1.5 min-h-[80px] border-l ${isDark ? 'border-white/[0.04]' : 'border-[#E8ECF2]/60'} ${
                    isToday(day) ? (isDark ? 'bg-[#4BB9EC]/[0.03]' : 'bg-[#4BB9EC]/[0.02]') : isWeekend(day) ? (isDark ? 'bg-white/[0.01]' : 'bg-slate-50/30') : ''
                  }`}>
                    {dayEvents.map(event => {
                      const type = event.event_type || 'other'
                      const isGame = type === 'game'
                      const isTournament = type === 'tournament'
                      const isPractice = type === 'practice'
                      const teamColor = event.teams?.color || '#6366F1'

                      const cellBg = isGame
                        ? (isDark ? 'bg-[#10284C]' : 'bg-[#10284C]')
                        : isPractice
                          ? (isDark ? 'bg-emerald-900/30' : 'bg-emerald-500/15')
                          : isTournament
                            ? (isDark ? 'bg-purple-900/30' : 'bg-purple-500/15')
                            : (isDark ? 'bg-white/[0.06]' : 'bg-slate-100')

                      const cellText = isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')
                      const cellMuted = isGame ? 'text-white/60' : (isDark ? 'text-slate-400' : 'text-slate-500')

                      return (
                        <div key={event.id}
                          onClick={() => onSelectEvent(event)}
                          className={`p-2 mb-1.5 rounded-lg cursor-pointer transition-all hover:brightness-110 flex gap-1.5 ${cellBg}`}
                        >
                          <div className="w-[3px] rounded-full shrink-0 self-stretch" style={{ backgroundColor: teamColor }} />
                          <div className="min-w-0 flex-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                            }`}>
                              {type}
                            </span>
                            <div className={`text-sm font-bold truncate ${cellText}`}>
                              {event.title || event.event_type}
                            </div>
                            {event.venue_name && (
                              <div className={`text-[10px] truncate ${cellMuted}`}>
                                {event.venue_name}
                              </div>
                            )}
                            {event.event_time && (
                              <div className={`text-[10px] ${cellMuted}`}>
                                {formatTime12(event.event_time)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
          {teamRows.length === 0 && (
            <div className={`p-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm font-semibold">No events this week</p>
              <p className="text-xs mt-1 opacity-70">Try navigating to another week to find scheduled events.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer stats + legend */}
      <div className="flex items-center justify-between mt-4 px-1">
        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {weekEventCount} event{weekEventCount !== 1 ? 's' : ''} this week
        </span>
        <div className="flex items-center gap-4">
          {[
            { label: 'Practice', color: '#4BB9EC' },
            { label: 'Game', color: '#10284C' },
            { label: 'Tournament', color: '#8B5CF6' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DAY VIEW — Single-day with Stack-style event cards
// ============================================
export function DayView({ events, currentDate, onSelectEvent, teams }) {
  const { isDark } = useTheme()
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.start_time)
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear()
  }).sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''))

  return (
    <div className="space-y-4">
      {dayEvents.length === 0 ? (
        <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
          <div className="text-3xl mb-2">📅</div>
          <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No events scheduled for this day</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Select a different day or check the month view for upcoming events.</p>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
          <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
            {dayEvents.map(event => {
              const type = event.event_type || 'other'
              const isGame = type === 'game'
              const isTournament = type === 'tournament'
              const colors = EVENT_COLORS[type] || EVENT_COLORS.other

              return (
                <div key={event.id}
                  className={`relative px-4 py-3 flex items-center gap-4 cursor-pointer transition-all ${
                    isGame
                      ? (isDark ? 'bg-[#10284C] hover:bg-[#162d52]' : 'bg-gradient-to-r from-[#10284C] to-[#1a3a6b] text-white hover:brightness-110')
                      : isTournament
                        ? (isDark ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100')
                        : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                  }`}
                  onClick={() => onSelectEvent(event)}
                >
                  {event.teams && <TeamLogo team={event.teams} size={14} className="shrink-0" />}
                  {!event.teams && <div className={`w-1 self-stretch rounded-full shrink-0 ${colors.border}`} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                      }`}>
                        {event.teams?.name || 'All Teams'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        isGame ? 'text-white/50' : (isDark ? 'text-slate-500' : 'text-slate-400')
                      }`}>
                        {type}
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold tracking-tight ${
                      isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')
                    }`}>
                      {event.title || event.event_type}
                    </h3>
                    <div className={`flex items-center gap-3 mt-0.5 text-xs ${
                      isGame ? 'text-white/60' : (isDark ? 'text-slate-500' : 'text-slate-400')
                    }`}>
                      <span>{formatTime12(event.event_time)}{event.end_time ? ` — ${formatTime12(event.end_time)}` : ''}</span>
                      {(event.venue_name || event.location) && (
                        <span>📍 {event.venue_name || event.location}</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0 ${
                    isGame
                      ? 'bg-white/10 text-white'
                      : colors.badge
                  }`}>
                    {type}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// LIST VIEW — "The Stack" — Day-grouped rich event cards
// ============================================
export function ListView({ events, onSelectEvent, teams, currentDate }) {
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

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayEvents]) => {
        const dateObj = new Date(date)
        const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()

        return (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-base font-black tracking-tight italic uppercase ${
                isToday ? (isDark ? 'text-white' : 'text-[#10284C]') : (isDark ? 'text-slate-500' : 'text-slate-400')
              }`} style={{ fontFamily: 'var(--v2-font)' }}>
                {dayLabel}
              </h2>
              {isToday && (
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
                  isDark ? 'bg-[#FFD700] text-[#10284C]' : 'bg-[#22C55E] text-white'
                }`}>Today</span>
              )}
              <span className={`text-xs font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
            </div>

            <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
              <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                {dayEvents.map(event => {
                  const type = event.event_type || 'other'
                  const isGame = type === 'game'
                  const isTournament = type === 'tournament'
                  const colors = EVENT_COLORS[type] || EVENT_COLORS.other

                  return (
                    <div key={event.id}
                      className={`relative px-4 py-3 flex items-center gap-4 cursor-pointer transition-all ${
                        isGame
                          ? (isDark ? 'bg-[#10284C] hover:bg-[#162d52]' : 'bg-gradient-to-r from-[#10284C] to-[#1a3a6b] text-white hover:brightness-110')
                          : isTournament
                            ? (isDark ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100')
                            : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                      }`}
                      onClick={() => onSelectEvent(event)}
                    >
                      {event.teams && <TeamLogo team={event.teams} size={14} className="shrink-0" />}
                      {!event.teams && <div className={`w-1 self-stretch rounded-full shrink-0 ${colors.border}`} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                          }`}>
                            {event.teams?.name || 'All Teams'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${
                            isGame ? 'text-white/50' : (isDark ? 'text-slate-500' : 'text-slate-400')
                          }`}>
                            {type}
                          </span>
                        </div>
                        <h3 className={`text-sm font-bold tracking-tight ${
                          isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')
                        }`}>
                          {event.title || event.event_type}
                        </h3>
                        <div className={`flex items-center gap-3 mt-0.5 text-xs ${
                          isGame ? 'text-white/60' : (isDark ? 'text-slate-500' : 'text-slate-400')
                        }`}>
                          <span>{formatTime12(event.event_time)}{event.end_time ? ` — ${formatTime12(event.end_time)}` : ''}</span>
                          {(event.venue_name || event.location) && (
                            <span>📍 {event.venue_name || event.location}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0 ${
                        isGame
                          ? 'bg-white/10 text-white'
                          : colors.badge
                      }`}>
                        {type}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
