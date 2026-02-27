import { Calendar, ChevronRight, Users, Star, Trophy } from '../../constants/icons'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch {
    return timeStr
  }
}

function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff <= 7) return `${diff}d`
  return `${Math.ceil(diff / 7)}w`
}

/**
 * CoachRosterPanel — Right sidebar (300px)
 * Order: Season Record → Top Players → Squad Roster → Upcoming Events
 */
export default function CoachRosterPanel({
  roster,
  selectedTeam,
  teamRecord,
  winRate,
  topPlayers,
  upcomingEvents,
  rsvpCounts,
  onNavigate,
  navigateToTeamWall,
  onPlayerSelect,
}) {
  return (
    <aside className="hidden lg:flex w-[330px] shrink-0 flex-col border-l border-slate-200/50 bg-white overflow-y-auto p-5 space-y-5 h-full">

      {/* 1. Season Record */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Season Record</h3>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="text-center">
            <div className="text-3xl font-black text-emerald-500">{teamRecord?.wins || 0}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Wins</div>
          </div>
          <div className="text-2xl font-bold text-slate-300">-</div>
          <div className="text-center">
            <div className="text-3xl font-black text-red-500">{teamRecord?.losses || 0}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Losses</div>
          </div>
        </div>
        <p className="text-xs text-center text-slate-400">{winRate || 0}% win rate</p>
        {/* Recent Form */}
        {teamRecord?.recentForm?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Form</p>
            <div className="flex gap-1.5 justify-center">
              {teamRecord.recentForm.map((g, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    g.result === 'win'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                      : g.result === 'loss'
                        ? 'bg-red-500/15 text-red-500 border border-red-500/25'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'T'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Players Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Players</h3>
          </div>
          <button
            onClick={() => onNavigate?.('leaderboards')}
            className="text-xs text-[#2C5F7C] font-semibold hover:opacity-80"
          >
            View All →
          </button>
        </div>
        {topPlayers.length > 0 ? (
          <div className="space-y-1">
            {topPlayers.map((stat, i) => {
              const player = roster.find(p => p.id === stat.player_id)
              if (!player) return null
              const ppg = stat.games_played > 0 ? (stat.total_points / stat.games_played).toFixed(1) : '0'
              return (
                <div
                  key={stat.player_id}
                  onClick={() => onPlayerSelect?.(player)}
                  className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-50"
                >
                  <span className={`text-sm font-black w-5 text-center ${
                    i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-400'
                  }`}>
                    {i + 1}
                  </span>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-blue-50 text-blue-600">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {player.first_name} {player.last_name?.[0]}.
                    </p>
                    <p className="text-[10px] text-slate-400">#{player.jersey_number || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <div className="text-center">
                      <p className="font-bold text-red-500">{stat.total_kills || 0}</p>
                      <p className="text-slate-400">K</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-emerald-500">{stat.total_aces || 0}</p>
                      <p className="text-slate-400">A</p>
                    </div>
                    <div className="text-center px-1.5 py-0.5 rounded-lg bg-amber-50">
                      <p className="font-bold text-amber-500">{ppg}</p>
                      <p className="text-slate-400">PPG</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-400">No stats recorded yet</p>
            <p className="text-[10px] text-slate-300 mt-1">Complete games and enter stats</p>
          </div>
        )}
      </div>

      {/* 3. Squad Roster */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Squad Roster</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{roster.length}</span>
            <button
              onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
              className="text-xs text-[#2C5F7C] font-semibold hover:opacity-80"
            >
              Full Roster →
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          {roster.length > 0 ? (
            roster.map(player => (
              <button
                key={player.id}
                onClick={() => onPlayerSelect?.(player)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer text-left border-b border-slate-100 last:border-0"
              >
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt=""
                    className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-16 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                    style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}
                  >
                    {player.first_name?.[0]}{player.last_name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {player.first_name} {player.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{player.position || 'Player'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-400">Active</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-slate-800 flex-shrink-0">
                  #{player.jersey_number || '—'}
                </span>
              </button>
            ))
          ) : (
            <div className="py-10 text-center">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No players on roster</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Upcoming Events */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming</h3>
          </div>
          <button
            onClick={() => onNavigate?.('schedule')}
            className="text-xs text-[#2C5F7C] font-semibold hover:opacity-80"
          >
            Schedule →
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.slice(0, 4).map(event => {
              const isGame = event.event_type === 'game'
              const isToday = countdownText(event.event_date) === 'TODAY'
              return (
                <div key={event.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer">
                  <div className="text-center min-w-[36px]">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-lg font-black ${isToday ? 'text-red-500' : 'text-slate-900'}`}>
                      {new Date(event.event_date + 'T00:00:00').getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isGame ? 'text-red-500 bg-red-500/10' : 'text-blue-500 bg-blue-500/10'
                    }`}>
                      {isGame ? 'GAME' : 'PRACTICE'}
                    </span>
                    <p className="text-xs mt-0.5 truncate text-slate-500">
                      {isGame && event.opponent_name ? `vs ${event.opponent_name}` : ''}
                      {event.event_time ? (isGame && event.opponent_name ? ' · ' : '') + formatTime12(event.event_time) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {rsvpCounts?.[event.id] && (
                      <span className="text-[10px] font-bold text-emerald-500">{rsvpCounts[event.id].going}✓</span>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No upcoming events</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
