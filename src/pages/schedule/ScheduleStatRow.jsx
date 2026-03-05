// =============================================================================
// ScheduleStatRow — role-aware stat cards for schedule overview
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Trophy, CalendarDays, BarChart3, CalendarCheck } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-[14px] p-5 ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-4xl font-extrabold tabular-nums leading-none ${valueColor || (isDark ? 'text-white' : 'text-slate-900')}`}>
            {value}
          </p>
          <p className="text-sm font-bold uppercase tracking-wider mt-1 text-slate-400">
            {label}
          </p>
          {(sub || pill) && (
            <div className="flex items-center gap-2 mt-1.5">
              {sub && <span className="text-sm text-slate-500">{sub}</span>}
              {pill && <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ScheduleStatRow({ events = [], activeView }) {
  const isParent = activeView === 'parent'
  const isPlayer = activeView === 'player'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()
  const monthEvents = events.filter(e => {
    const d = new Date(e.event_date + 'T00:00:00')
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })
  const monthGames = monthEvents.filter(e => e.event_type === 'game')
  const monthPractices = monthEvents.filter(e => e.event_type === 'practice')

  // Next event
  const upcoming = events
    .filter(e => new Date(e.event_date + 'T00:00:00') >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
  const nextEvent = upcoming[0]
  const isToday = nextEvent && new Date(nextEvent.event_date + 'T00:00:00').getTime() === today.getTime()
  const nextLabel = isToday ? 'TODAY' : nextEvent ? new Date(nextEvent.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
  const nextSub = nextEvent ? `${nextEvent.title || nextEvent.event_type}${nextEvent.event_time ? ' · ' + formatTimeShort(nextEvent.event_time) : ''}` : null

  function formatTimeShort(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hr = parseInt(h)
    return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  }

  if (isParent || isPlayer) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={CalendarDays}
          label="Next Event"
          value={nextLabel}
          sub={nextSub}
          valueColor={isToday ? 'text-lynx-sky' : undefined}
          iconColor="#4BB9EC"
        />
        <StatCard
          icon={BarChart3}
          label="This Month"
          value={monthEvents.length}
          sub={monthGames.length > 0 ? `${monthGames.length} game${monthGames.length > 1 ? 's' : ''}` : null}
          iconColor="#8B5CF6"
        />
        <StatCard
          icon={CalendarCheck}
          label="Upcoming"
          value={upcoming.length}
          sub={`${upcoming.filter(e => e.event_type === 'game').length} games`}
          iconColor="#22C55E"
        />
      </div>
    )
  }

  // Coach/Admin: 4 cards
  const wins = events.filter(e => e.event_type === 'game' && e.result === 'win').length
  const losses = events.filter(e => e.event_type === 'game' && e.result === 'loss').length
  const totalGames = wins + losses
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Trophy}
        label="Season Record"
        value={totalGames > 0 ? `${wins}-${losses}` : '0-0'}
        sub={totalGames > 0 ? `${winRate}% win rate` : 'No games played'}
        valueColor={wins > losses ? 'text-emerald-500' : wins < losses ? 'text-red-500' : undefined}
        iconColor={wins >= losses ? '#22C55E' : '#EF4444'}
      />
      <StatCard
        icon={CalendarDays}
        label="Next Event"
        value={nextLabel}
        sub={nextSub}
        valueColor={isToday ? 'text-lynx-sky' : undefined}
        iconColor="#4BB9EC"
      />
      <StatCard
        icon={BarChart3}
        label="This Month"
        value={monthEvents.length}
        sub={`${monthGames.length} game${monthGames.length !== 1 ? 's' : ''} · ${monthPractices.length} practice${monthPractices.length !== 1 ? 's' : ''}`}
        iconColor="#8B5CF6"
      />
      <StatCard
        icon={CalendarCheck}
        label="Upcoming"
        value={upcoming.length}
        sub={`${upcoming.filter(e => e.event_type === 'game').length} games remaining`}
        iconColor="#F59E0B"
      />
    </div>
  )
}
