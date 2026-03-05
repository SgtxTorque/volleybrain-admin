// =============================================================================
// ScheduleUpcomingStrip — horizontal scrolling upcoming games cards
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Share2 } from '../../constants/icons'
import { formatGameDay, formatGameDate, formatGameTime } from './scheduleHelpers'

export default function ScheduleUpcomingStrip({
  allUpcomingGames,
  upcomingGames,
  teams,
  onSelectEvent,
  onShareGame,
}) {
  const { isDark } = useTheme()

  if (!allUpcomingGames?.length) return null

  return (
    <div className={`rounded-[14px] border overflow-hidden ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
      <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">🔥</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Upcoming Games</span>
        </div>
        {upcomingGames?.length > 0 && (
          <button
            onClick={() => onShareGame(allUpcomingGames[0])}
            className="flex items-center gap-1.5 text-xs font-semibold text-lynx-sky hover:underline"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Next Game
          </button>
        )}
      </div>
      <div className="p-3 flex gap-3 overflow-x-auto">
        {allUpcomingGames.slice(0, 5).map(game => {
          const gameTeam = game.teams || teams.find(t => t.id === game.team_id)
          const teamCol = gameTeam?.color || '#6366F1'
          const isToday = formatGameDay(game.event_date) === 'TODAY'
          const isTomorrow = formatGameDay(game.event_date) === 'TOMORROW'
          return (
            <button
              key={game.id}
              onClick={() => onSelectEvent(game)}
              className={`flex-shrink-0 rounded-xl p-3 text-left transition-all border-2 hover:shadow-md ${
                isToday
                  ? 'border-amber-400 shadow-amber-100'
                  : isTomorrow
                    ? (isDark ? 'border-slate-600 hover:border-slate-500' : 'border-blue-200 hover:border-blue-300')
                    : (isDark ? 'border-white/[0.06] hover:border-slate-600' : 'border-slate-200 hover:border-slate-300')
              }`}
              style={{
                minWidth: 180,
                background: isToday
                  ? (isDark ? `${teamCol}15` : `${teamCol}08`)
                  : isDark ? 'rgba(30,41,59,0.5)' : '#fff'
              }}
            >
              {/* Day badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isToday ? 'bg-amber-400 text-amber-900' : isTomorrow ? 'bg-blue-100 text-blue-700' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {formatGameDay(game.event_date)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onShareGame(game) }}
                  className={`p-1 rounded-md transition ${isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'}`}
                  title="Share game"
                >
                  <Share2 className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                </button>
              </div>
              {/* Opponent */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: teamCol }} />
                <div>
                  <div className={`text-sm font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    vs. {game.opponent_name || game.opponent || 'TBD'}
                  </div>
                  {gameTeam?.name && (
                    <div className="text-xs font-bold text-slate-400">{gameTeam.name}</div>
                  )}
                </div>
              </div>
              {/* Date + Time */}
              <div className="text-[11px] font-semibold text-slate-400">
                {formatGameDate(game.event_date)} • {formatGameTime(game.event_time)}
              </div>
              {game.venue_name && (
                <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">📍 {game.venue_name}{game.court_number ? ` · ${game.court_number}` : ''}</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
