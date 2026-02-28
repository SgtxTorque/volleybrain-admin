// =============================================================================
// LiveActivity — Right sidebar matching v0 live-activity.tsx
// Scrollable feed of recent activity items with colored icon avatars
// =============================================================================

import React from 'react'
import { DollarSign, ClipboardCheck, FileCheck, Trophy, Calendar, ArrowRight, ChevronRight, Medal } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const ACTIVITY_CONFIG = {
  payment: {
    Icon: DollarSign,
    bgLight: 'bg-amber-100',
    bgDark: 'bg-amber-500/15',
    textLight: 'text-amber-600',
    textDark: 'text-amber-400',
  },
  registration: {
    Icon: ClipboardCheck,
    bgLight: 'bg-teal-100',
    bgDark: 'bg-teal-500/15',
    textLight: 'text-teal-600',
    textDark: 'text-teal-400',
  },
  waiver: {
    Icon: FileCheck,
    bgLight: 'bg-emerald-100',
    bgDark: 'bg-emerald-500/15',
    textLight: 'text-emerald-600',
    textDark: 'text-emerald-400',
  },
  game: {
    Icon: Trophy,
    bgLight: 'bg-purple-100',
    bgDark: 'bg-purple-500/15',
    textLight: 'text-purple-600',
    textDark: 'text-purple-400',
  },
}

function timeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatEventDate(dateStr) {
  if (!dateStr) return { weekday: '', day: '', month: '' }
  const date = new Date(dateStr + 'T00:00:00')
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  }
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function UpcomingEventsHero({ events, onNavigate, isDark }) {
  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            Upcoming Events
          </span>
        </div>
        <button
          onClick={() => onNavigate('schedule')}
          className="flex items-center gap-1 text-xs font-bold transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {events && events.length > 0 ? (
        <div className="flex flex-col gap-2">
          {events.slice(0, 3).map((event, i) => {
            const isGame = event.event_type === 'game'
            const isTournament = event.event_type === 'tournament'
            const teamColor = event.teams?.color || '#0d9488'
            const d = formatEventDate(event.event_date)
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            const evtDate = new Date(event.event_date + 'T00:00:00')
            const daysUntil = Math.ceil((evtDate - now) / 86400000)

            return (
              <button
                key={event.id || i}
                onClick={() => onNavigate('schedule')}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                  isDark
                    ? 'bg-lynx-charcoal border border-white/[0.06] hover:border-white/[0.12]'
                    : 'bg-white border border-lynx-silver hover:border-slate-300 hover:shadow'
                }`}
              >
                {/* Date badge */}
                <div className="text-center w-10 flex-shrink-0">
                  <div className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d.weekday}</div>
                  <div className={`text-xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{d.day}</div>
                  <div className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d.month}</div>
                </div>

                {/* Color bar */}
                <div
                  className="w-1 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isGame ? '#f59e0b' : isTournament ? '#8b5cf6' : '#3b82f6' }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isGame
                        ? isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'
                        : isTournament
                          ? isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'
                          : isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {isGame ? 'GAME' : isTournament ? 'TOURNEY' : 'PRACTICE'}
                    </span>
                    {(event.opponent_name || event.opponent) && (
                      <span className={`text-xs font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        vs {event.opponent_name || event.opponent}
                      </span>
                    )}
                    {daysUntil === 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-500'}`}>TODAY</span>}
                    {daysUntil === 1 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>TOMORROW</span>}
                  </div>
                  <div className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                    {formatTime12(event.event_time)}{event.location && ` · ${event.location}`}{event.venue_name && !event.location && ` · ${event.venue_name}`}
                  </div>
                  <div className="text-[11px] font-bold mt-0.5 truncate" style={{ color: teamColor }}>
                    {event.teams?.name || event.title || ''}
                  </div>
                </div>

                <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className={`rounded-xl px-4 py-6 text-center ${
          isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
        }`}>
          <Calendar className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>No upcoming events</p>
        </div>
      )}
    </div>
  )
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'] // gold, silver, bronze

function LeaderboardCard({ players, onNavigate, isDark }) {
  if (!players || players.length === 0) return null

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            Leaderboard
          </span>
        </div>
        <button
          onClick={() => onNavigate('leaderboards')}
          className="flex items-center gap-1 text-xs font-bold transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className={`rounded-xl overflow-hidden ${
        isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
      }`}>
        {players.slice(0, 10).map((entry, i) => {
          const player = entry.player
          if (!player) return null
          const teamColor = entry.team?.color || '#0d9488'
          const isTop3 = i < 3

          return (
            <div
              key={entry.id || i}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                i > 0 ? (isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100') : ''
              }`}
            >
              {/* Rank */}
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  isTop3
                    ? 'text-white'
                    : isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}
                style={isTop3 ? { backgroundColor: RANK_COLORS[i] } : undefined}
              >
                {i + 1}
              </span>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {player.first_name} {player.last_name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold truncate" style={{ color: teamColor }}>
                    {entry.team?.name || '—'}
                  </span>
                  {player.position && (
                    <>
                      <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{player.position}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Points */}
              <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {entry.total_points || 0}
              </span>
              <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                pts
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LiveActivity({ activities, upcomingEvents, topPlayers, onNavigate }) {
  const { isDark } = useTheme()

  return (
    <aside className={`flex w-[330px] shrink-0 flex-col gap-4 overflow-y-auto border-l py-8 pl-6 pr-6 ${
      isDark ? 'border-white/[0.06] bg-lynx-midnight' : 'border-lynx-silver/50 bg-lynx-cloud'
    }`}>
      {/* Upcoming Events Hero */}
      {upcomingEvents && onNavigate && (
        <UpcomingEventsHero events={upcomingEvents} onNavigate={onNavigate} isDark={isDark} />
      )}

      {/* Leaderboard */}
      {topPlayers && topPlayers.length > 0 && onNavigate && (
        <LeaderboardCard players={topPlayers} onNavigate={onNavigate} isDark={isDark} />
      )}

      <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
        Live Activity
      </h3>

      <div className="flex flex-col">
        {activities && activities.length > 0 ? (
          activities.slice(0, 15).map((activity, i) => {
            const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.registration
            const Icon = config.Icon

            return (
              <div
                key={i}
                className={`flex items-start gap-3 py-4 ${
                  i > 0 ? (isDark ? 'border-t border-white/[0.06]' : 'border-t border-lynx-silver') : ''
                }`}
              >
                {/* Icon Avatar */}
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  isDark ? config.bgDark : config.bgLight
                }`}>
                  <Icon className={`h-3.5 w-3.5 ${isDark ? config.textDark : config.textLight}`} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activity.action}
                    {activity.highlight && (
                      <span> &mdash; {activity.highlight}</span>
                    )}
                  </p>
                  <p className={`mt-0.5 truncate text-sm ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                    {activity.name}
                    {activity.name && activity.timestamp && ' · '}
                    {activity.timestamp && timeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-8 text-center">
            <ClipboardCheck className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>No recent activity</p>
          </div>
        )}
      </div>
    </aside>
  )
}
