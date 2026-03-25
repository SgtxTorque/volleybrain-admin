// =============================================================================
// GameDayHero — dark navy matchup hero card with gradient + record
// =============================================================================

import { Icons, GAME_MODES } from './GameDayHelpers'

export default function GameDayHero({ event, team, mode, seasonRecord }) {
  const wins = seasonRecord?.wins ?? 0
  const losses = seasonRecord?.losses ?? 0
  const totalGames = wins + losses
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
  const recentForm = seasonRecord?.recentForm || [] // ['W','W','L','W','L']

  const eventDate = event?.event_date
    ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '—'
  const eventTime = event?.event_time
    ? (() => { const [h,m] = event.event_time.split(':'); const hr = parseInt(h); return `${hr>12?hr-12:hr===0?12:hr}:${m} ${hr>=12?'PM':'AM'}` })()
    : 'TBD'
  const isHome = event?.is_home_game !== false
  const isLive = mode === GAME_MODES.LIVE

  return (
    <div
      className="relative rounded-2xl p-7 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0B1628 0%, #162D50 50%, #0B1628 100%)',
      }}
    >
      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative flex items-start justify-between">
        {/* Left — matchup info */}
        <div className="flex-1">
          {isLive && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-sm font-extrabold uppercase tracking-wider text-red-300">Live</span>
            </div>
          )}
          {!isLive && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 mb-3">
              <span className="text-sm font-extrabold uppercase tracking-wider text-amber-400">Pre-Game</span>
            </div>
          )}

          <p className="text-sm text-white/40 uppercase tracking-wider font-bold mb-1">{team?.name || 'Your Team'}</p>
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            vs. {event?.opponent_name || event?.opponent || 'TBD'}
          </h2>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-base text-white/50">📅 {eventDate}</span>
            <span className="text-base text-white/50">🕐 {eventTime}</span>
            {event?.venue_name && <span className="text-base text-white/50">📍 {event.venue_name}</span>}
            <span className={`text-sm font-extrabold uppercase px-2.5 py-1 rounded-md ${
              isHome ? 'bg-lynx-sky/15 text-lynx-sky' : 'bg-amber-500/15 text-amber-400'
            }`}>
              {isHome ? 'Home' : 'Away'}
            </span>
          </div>
        </div>

        {/* Right — season record */}
        <div className="text-right ml-8 shrink-0">
          <p className="text-sm font-bold uppercase tracking-wider text-white/30 mb-1">Season Record</p>
          <div className="text-6xl font-extrabold leading-none tabular-nums">
            <span className="text-emerald-400">{wins}</span>
            <span className="text-white/20">-</span>
            <span className="text-red-400">{losses}</span>
          </div>
          {totalGames > 0 && (
            <p className="text-base text-white/40 mt-1">{winRate}% win rate</p>
          )}
          {recentForm.length > 0 && (
            <div className="flex justify-end gap-1 mt-2">
              {recentForm.slice(-5).map((r, i) => (
                <span key={i} className={`w-[26px] h-[26px] rounded-md text-sm font-extrabold inline-flex items-center justify-center ${
                  r === 'W' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>{r}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
