import { Calendar, ChevronRight, Users, Star, Trophy } from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'
import { formatTime12, countdownText } from '../../lib/date-helpers'

/**
 * CoachRosterPanel — Right panel (330px) "Team At A Glance"
 * Order: Season Record → Upcoming Events (3) → Top Players → Active Challenges → Squad Roster (capped at 6)
 */
export default function CoachRosterPanel({
  roster,
  selectedTeam,
  teamRecord,
  winRate,
  topPlayers,
  upcomingEvents,
  rsvpCounts,
  activeChallenges,
  onNavigate,
  navigateToTeamWall,
  onPlayerSelect,
  onEventSelect,
}) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'

  return (
    <aside className={`hidden lg:flex w-[330px] shrink-0 flex-col ${isDark ? 'bg-lynx-midnight border-l border-lynx-border-dark' : 'bg-white border-l border-lynx-silver/50'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* 1. Season Record */}
      <div className={`${cardBg} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Season Record</h3>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="text-center">
            <div className="text-3xl font-black text-emerald-500">{teamRecord?.wins || 0}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Wins</div>
          </div>
          <div className={`text-2xl font-bold ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>-</div>
          <div className="text-center">
            <div className="text-3xl font-black text-red-500">{teamRecord?.losses || 0}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Losses</div>
          </div>
        </div>
        <p className={`text-xs text-center ${secondaryText}`}>{winRate || 0}% win rate</p>
        {/* Recent Form */}
        {teamRecord?.recentForm?.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${secondaryText} mb-2`}>Recent Form</p>
            <div className="flex gap-1.5 justify-center">
              {teamRecord.recentForm.map((g, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    g.result === 'win'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                      : g.result === 'loss'
                        ? 'bg-red-500/15 text-red-500 border border-red-500/25'
                        : 'bg-slate-100 text-slate-400 border border-lynx-silver'
                  }`}
                >
                  {g.result === 'win' ? 'W' : g.result === 'loss' ? 'L' : 'T'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Upcoming Events (3 max, with RSVP summary) */}
      <div className={`${cardBg} rounded-xl shadow-sm`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-lynx-sky" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Upcoming</h3>
          </div>
          <button
            onClick={() => onNavigate?.('schedule')}
            className="text-xs text-lynx-sky font-semibold hover:text-lynx-deep"
          >
            Schedule →
          </button>
        </div>
        <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.slice(0, 3).map(event => {
              const isGame = event.event_type === 'game'
              const isToday = countdownText(event.event_date) === 'TODAY'
              const rsvp = rsvpCounts?.[event.id]
              return (
                <button
                  key={event.id}
                  onClick={() => onEventSelect?.(event)}
                  className={`w-full px-4 py-3 flex items-center gap-3 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'} cursor-pointer text-left`}
                >
                  <div className="text-center min-w-[36px]">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-lg font-black ${isToday ? 'text-red-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                      {new Date(event.event_date + 'T00:00:00').getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isGame ? 'text-red-500 bg-red-500/10' : 'text-lynx-sky bg-lynx-sky/10'
                    }`}>
                      {isGame ? 'GAME' : 'PRACTICE'}
                    </span>
                    <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isGame && event.opponent_name ? `vs ${event.opponent_name}` : ''}
                      {event.event_time ? (isGame && event.opponent_name ? ' · ' : '') + formatTime12(event.event_time) : ''}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    {rsvp && (
                      <>
                        <span className="text-[10px] font-bold text-emerald-500">{rsvp.going}✓</span>
                        {rsvp.declined > 0 && (
                          <span className="text-[10px] font-bold text-red-400">{rsvp.declined}✗</span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              )
            })
          ) : (
            <div className="p-8 text-center">
              <Calendar className={`w-10 h-10 mx-auto ${isDark ? 'text-slate-500' : 'text-slate-300'} mb-2`} />
              <p className="text-sm text-slate-400">No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Top Players Leaderboard */}
      <div className={`${cardBg} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Top Players</h3>
          </div>
          <button
            onClick={() => onNavigate?.('leaderboards')}
            className="text-xs text-lynx-sky font-semibold hover:text-lynx-deep"
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
                  className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'}`}
                >
                  <span className={`text-sm font-black w-5 text-center ${
                    i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-400'
                  }`}>
                    {i + 1}
                  </span>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-lynx-ice text-lynx-sky">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
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
                    <div className={`text-center px-1.5 py-0.5 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
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
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-300'} mt-1`}>Complete games and enter stats</p>
          </div>
        )}
      </div>

      {/* 4. Active Challenges */}
      <ActiveChallengesCard
        challenges={activeChallenges}
        isDark={isDark}
        cardBg={cardBg}
        secondaryText={secondaryText}
        onNavigate={onNavigate}
      />

      {/* 5. Squad Roster (capped at 6) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-lynx-sky" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Squad Roster</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">{roster.length}</span>
            <button
              onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
              className="text-xs text-lynx-sky font-semibold hover:text-lynx-deep"
            >
              Full Roster →
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          {roster.length > 0 ? (
            <>
              {roster.slice(0, 6).map(player => (
                <button
                  key={player.id}
                  onClick={() => onPlayerSelect?.(player)}
                  className={`w-full flex items-center gap-3 p-3 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'} rounded-xl cursor-pointer text-left border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'} last:border-0`}
                >
                  {player.photo_url ? (
                    <img
                      src={player.photo_url}
                      alt=""
                      className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-16 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 text-white bg-lynx-sky"
                    >
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
                      {player.first_name} {player.last_name}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{player.position || 'Player'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-400">Active</span>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'} flex-shrink-0`}>
                    #{player.jersey_number || '—'}
                  </span>
                </button>
              ))}
              {roster.length > 6 && (
                <button
                  onClick={() => navigateToTeamWall?.(selectedTeam?.id)}
                  className={`w-full text-center py-3 text-xs font-semibold text-lynx-sky hover:text-lynx-deep`}
                >
                  View All ({roster.length}) →
                </button>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <Users className={`w-10 h-10 mx-auto ${isDark ? 'text-slate-500' : 'text-slate-300'} mb-2`} />
              <p className="text-sm text-slate-400">No players on roster</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

/**
 * ActiveChallengesCard — Shows active challenges with progress, or empty prompt
 */
function ActiveChallengesCard({ challenges, isDark, cardBg, secondaryText, onNavigate }) {
  // Compute time remaining for a challenge
  function timeRemaining(endsAt) {
    if (!endsAt) return ''
    const now = new Date()
    const end = new Date(endsAt)
    const diffMs = end - now
    if (diffMs <= 0) return 'Ended'
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Ends today'
    if (days === 1) return 'Ends tomorrow'
    return `Ends in ${days} days`
  }

  if (!challenges || challenges.length === 0) {
    return (
      <div className={`${cardBg} rounded-xl shadow-sm p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🏆</span>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Challenges</h3>
        </div>
        <div className="text-center py-3">
          <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-1`}>No active challenges</p>
          <p className={`text-xs ${secondaryText} mb-3`}>Challenges keep players engaged and push performance.</p>
          <button
            onClick={() => onNavigate?.('gameprep')}
            className="px-4 py-2 rounded-[10px] text-xs font-bold text-white bg-lynx-sky hover:bg-lynx-deep"
          >
            Create Challenge +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${cardBg} rounded-xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Challenges</h3>
        </div>
        <button
          onClick={() => onNavigate?.('gameprep')}
          className="text-xs text-lynx-sky font-semibold hover:text-lynx-deep"
        >
          Create + →
        </button>
      </div>
      <div className="space-y-3">
        {challenges.map(ch => {
          const progress = ch.totalParticipants > 0
            ? Math.round((ch.completedCount / ch.totalParticipants) * 100)
            : 0
          return (
            <div key={ch.id}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{ch.title}</p>
                {ch.xp_reward > 0 && (
                  <span className="text-[10px] font-bold text-amber-500 ml-2 flex-shrink-0">+{ch.xp_reward} XP</span>
                )}
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
                <div
                  className="h-full rounded-full bg-lynx-sky transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">
                  {ch.completedCount}/{ch.totalParticipants} completed
                </span>
                <span className="text-[10px] text-slate-400">{timeRemaining(ch.ends_at)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
