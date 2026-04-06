import React from 'react'
import { Calendar, MapPin, Clock, BarChart3, Check, Share2 } from '../../constants/icons'
import { CHECKPOINTS } from '../../lib/gameCheckpoints'

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
  if (!dateStr) return ''
  // Append T00:00:00 to date-only strings to force local time interpretation (not UTC)
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function isToday(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  return date.toDateString() === new Date().toDateString()
}

function isTomorrow(dateStr) {
  if (!dateStr) return false
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  return date.toDateString() === tomorrow.toDateString()
}

// ============================================
// GAME CARD COMPONENT
// ============================================
function GameCard({ game, team, status, isSelected, isDark, onClick, onPrepClick, onCompleteClick, onGameDayClick, onEnterStats, onShareResults, checkpoints, currentCheckpoint }) {
  const gameDate = new Date(game.event_date?.includes?.('T') ? game.event_date : (game.event_date || '') + 'T00:00:00')
  const today = isToday(game.event_date)
  const tomorrow = isTomorrow(game.event_date)
  const isCompleted = game.game_status === 'completed'
  const isPast = gameDate < new Date() && !today
  const needsStats = isCompleted && !game.stats_entered

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all cursor-pointer border ${
        isSelected
          ? isDark ? 'bg-lynx-charcoal border-lynx-sky/50 shadow-lg shadow-lynx-sky/10' : 'bg-white border-lynx-sky/50 shadow-lg shadow-lynx-sky/10'
          : isDark ? 'bg-lynx-charcoal border-lynx-border-dark hover:border-lynx-sky/30' : 'bg-white border-lynx-silver hover:border-lynx-sky/30'
      }`}
      onClick={onClick}
    >
      {/* Top color bar */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${team?.color || '#4BB9EC'}, transparent)` }}
      />

      <div className="p-4">
        {/* Date badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {today && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
              TODAY
            </span>
          )}
          {tomorrow && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
              TOMORROW
            </span>
          )}
          {isPast && !isCompleted && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
              NEEDS SCORE
            </span>
          )}
          {isCompleted && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              game.game_result === 'win' ? 'bg-emerald-500/20 text-emerald-500' :
              game.game_result === 'loss' ? 'bg-red-500/20 text-red-500' :
              isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}>
              {game.game_result === 'win' ? 'WIN' : game.game_result === 'loss' ? 'LOSS' : 'TIE'}
            </span>
          )}
          {needsStats && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold animate-pulse ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
              Stats Pending
            </span>
          )}
        </div>

        {/* Opponent */}
        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
          vs {game.opponent_name || 'TBD'}
        </h3>

        {/* Checkpoint Tracker Strip */}
        {checkpoints && (
          <div className="flex items-center gap-1 mb-3 overflow-x-auto">
            {CHECKPOINTS.map((cp, idx) => {
              const state = checkpoints[cp.id]
              const isCurrent = currentCheckpoint === cp.id
              return (
                <React.Fragment key={cp.id}>
                  {idx > 0 && (
                    <div className={`w-3 h-px ${state?.status === 'done' || state?.status === 'skipped' ? 'bg-lynx-sky/50' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  )}
                  <div className="flex flex-col items-center gap-0.5" title={`${cp.label}: ${state?.detail || ''}`}>
                    <div className={`w-3 h-3 rounded-full transition-all ${
                      state?.status === 'done' ? 'bg-lynx-sky' :
                      state?.status === 'in_progress' ? 'bg-amber-400' :
                      state?.status === 'warning' ? 'bg-red-400 animate-pulse' :
                      state?.status === 'skipped' ? 'bg-slate-400' :
                      isDark ? 'border-2 border-slate-600' : 'border-2 border-slate-300'
                    } ${isCurrent ? 'ring-2 ring-lynx-sky/40 ring-offset-1 ring-offset-transparent' : ''}`} />
                    <span className={`text-[8px] font-medium ${
                      state?.status === 'done' ? 'text-lynx-sky' :
                      state?.status === 'warning' ? 'text-red-400' :
                      isCurrent ? (isDark ? 'text-white' : 'text-lynx-navy') :
                      isDark ? 'text-slate-600' : 'text-slate-400'
                    } ${state?.status === 'skipped' ? 'line-through' : ''}`}>
                      {cp.label}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Score if completed */}
        {isCompleted && (
          <div className="mb-2">
            {game.set_scores && game.our_sets_won !== undefined ? (
              <>
                <p className={`text-2xl font-bold ${
                  game.game_result === 'win' ? 'text-emerald-500' :
                  game.game_result === 'loss' ? 'text-red-500' : isDark ? 'text-white' : 'text-lynx-navy'
                }`}>
                  {game.our_sets_won} - {game.opponent_sets_won}
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                  {game.set_scores
                    .filter(s => s && (s.our > 0 || s.their > 0))
                    .map((s, i) => `${s.our}-${s.their}`)
                    .join(', ')}
                </p>
              </>
            ) : (
              <p className={`text-2xl font-bold ${
                game.game_result === 'win' ? 'text-emerald-500' :
                game.game_result === 'loss' ? 'text-red-500' : isDark ? 'text-white' : 'text-lynx-navy'
              }`}>
                {game.our_score} - {game.opponent_score}
              </p>
            )}
          </div>
        )}

        {/* Details */}
        <div className={`flex flex-wrap gap-3 text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
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
              {game.location_type === 'home' ? 'Home' : 'Away'}
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
              {(today || status.hasLineup) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onGameDayClick?.()
                  }}
                  className={`px-3 py-2 rounded-[10px] font-semibold text-sm transition-all flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/20'
                      : 'bg-amber-50 text-amber-600 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  🏐 Game Day
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isPast) {
                    onCompleteClick?.()
                  } else {
                    onPrepClick()
                  }
                }}
                className={`px-4 py-2 rounded-[10px] font-semibold text-sm transition-all ${
                  isPast
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-lynx-sky hover:bg-lynx-deep text-white'
                }`}
              >
                {isPast ? 'Complete' : status.hasLineup ? 'Edit Lineup' : 'Set Lineup'}
              </button>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2">
              {needsStats && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEnterStats?.(game)
                  }}
                  className="px-3 py-2 rounded-[10px] font-semibold text-sm transition-all bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5"
                >
                  <BarChart3 className="w-4 h-4" /> Enter Stats
                </button>
              )}
              {game.stats_entered && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Stats
                </span>
              )}
              {onShareResults && (
                <button
                  onClick={(e) => { e.stopPropagation(); onShareResults(game) }}
                  className="px-3 py-2 rounded-[10px] font-semibold text-sm transition-all bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameCard
