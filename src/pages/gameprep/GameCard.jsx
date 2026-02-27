import { Calendar, MapPin, Clock, BarChart3, Check } from '../../constants/icons'

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function isToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

function isTomorrow(dateStr) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return new Date(dateStr).toDateString() === tomorrow.toDateString()
}

// ============================================
// GAME CARD COMPONENT
// ============================================
function GameCard({ game, team, status, isSelected, onClick, onPrepClick, onCompleteClick, onGameDayClick, onEnterStats }) {
  const gameDate = new Date(game.event_date)
  const today = isToday(game.event_date)
  const tomorrow = isTomorrow(game.event_date)
  const isCompleted = game.game_status === 'completed'
  const isPast = gameDate < new Date() && !today
  const needsStats = isCompleted && !game.stats_entered

  return (
    <div
      className="relative overflow-hidden rounded-2xl transition-all cursor-pointer"
      style={{
        background: 'rgba(15,20,35,0.7)',
        border: isSelected
          ? '2px solid rgba(59,130,246,0.5)'
          : '1px solid rgba(59,130,246,0.12)',
        boxShadow: isSelected ? '0 0 30px rgba(59,130,246,0.15)' : 'none',
      }}
      onClick={onClick}
    >
      {/* Top color bar */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${team?.color || '#3B82F6'}, transparent)` }}
      />

      <div className="p-4">
        {/* Date badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {today && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
              🔴 TODAY
            </span>
          )}
          {tomorrow && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
              TOMORROW
            </span>
          )}
          {isPast && !isCompleted && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              ⏰ NEEDS SCORE
            </span>
          )}
          {isCompleted && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              game.game_result === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
              game.game_result === 'loss' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              {game.game_result === 'win' ? '🏆 WIN' : game.game_result === 'loss' ? 'LOSS' : 'TIE'}
            </span>
          )}
          {needsStats && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 animate-pulse">
              📊 Stats Pending
            </span>
          )}
        </div>

        {/* Opponent */}
        <h3 className="text-lg font-bold text-white mb-1">
          vs {game.opponent_name || 'TBD'}
        </h3>

        {/* Score if completed */}
        {isCompleted && (
          <div className="mb-2">
            {/* Set-based scoring (volleyball) */}
            {game.set_scores && game.our_sets_won !== undefined ? (
              <>
                <p className={`text-2xl font-bold ${
                  game.game_result === 'win' ? 'text-emerald-400' :
                  game.game_result === 'loss' ? 'text-red-400' : 'text-white'
                }`}>
                  {game.our_sets_won} - {game.opponent_sets_won}
                </p>
                <p className={`text-sm text-slate-400`}>
                  {game.set_scores
                    .filter(s => s && (s.our > 0 || s.their > 0))
                    .map((s, i) => `${s.our}-${s.their}`)
                    .join(', ')}
                </p>
              </>
            ) : (
              /* Simple score (other sports or legacy) */
              <p className={`text-2xl font-bold ${
                game.game_result === 'win' ? 'text-emerald-400' :
                game.game_result === 'loss' ? 'text-red-400' : 'text-white'
              }`}>
                {game.our_score} - {game.opponent_score}
              </p>
            )}
          </div>
        )}

        {/* Details */}
        <div className={`flex flex-wrap gap-3 text-sm text-slate-400 mb-4`}>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(game.event_date)}
          </span>
          {game.event_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime12(game.event_time)}
            </span>
          )}
          {game.location_type && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {game.location_type === 'home' ? '🏠 Home' : '✈️ Away'}
            </span>
          )}
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
            {status.icon} {status.label}
          </span>

          {!isCompleted && (
            <div className="flex items-center gap-2">
              {/* Game Day Mode Button - Only for today's games or games with lineups */}
              {(today || status.hasLineup) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGameDayClick?.()
                  }}
                  className="px-3 py-2 rounded-xl font-semibold text-sm transition-all
                             bg-gradient-to-r from-slate-800 to-slate-700 text-amber-400
                             hover:shadow-lg hover:shadow-amber-500/20 border border-amber-500/30
                             flex items-center gap-1.5"
                >
                  🏐 Game Day
                </button>
              )}

              {/* Standard Prep/Complete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isPast) {
                    onCompleteClick?.()
                  } else {
                    onPrepClick()
                  }
                }}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  isPast
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-[var(--accent-primary)] to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                {isPast ? '✓ Complete' : status.hasLineup ? 'Edit Lineup →' : 'Set Lineup →'}
              </button>
            </div>
          )}

          {/* Completed game actions */}
          {isCompleted && (
            <div className="flex items-center gap-2">
              {needsStats && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEnterStats?.(game)
                  }}
                  className="px-3 py-2 rounded-xl font-semibold text-sm transition-all
                             bg-gradient-to-r from-amber-500 to-orange-500 text-white
                             hover:shadow-lg hover:shadow-amber-500/25 flex items-center gap-1.5"
                >
                  <BarChart3 className="w-4 h-4" /> Enter Stats
                </button>
              )}
              {game.stats_entered && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Stats ✓
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameCard
