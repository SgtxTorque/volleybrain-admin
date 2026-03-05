import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, ChevronRight } from '../../constants/icons'
import { CHECKPOINTS, getCompletionPercent } from '../../lib/gameCheckpoints'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

export default function GameJourneyPanel({
  game,
  team,
  roster,
  checkpoints,
  currentCheckpoint,
  onClose,
  onOpenLineup,
  onOpenCompletion,
  onOpenStats,
  onOpenGameDay,
  onOpenDetail,
  onOpenAttendance,
  onOpenQuickScore,
  showToast,
}) {
  const { isDark } = useTheme()
  const [previousMatchup, setPreviousMatchup] = useState(null)
  const [gameNote, setGameNote] = useState(game?.description || game?.notes || '')
  const [savingNote, setSavingNote] = useState(false)

  const completion = checkpoints ? getCompletionPercent(checkpoints) : 0

  useEffect(() => {
    if (game?.opponent_name) loadPreviousMatchup()
  }, [game?.id])

  async function loadPreviousMatchup() {
    try {
      const { data } = await supabase
        .from('schedule_events')
        .select('id, event_date, opponent_name, game_result, our_score, opponent_score, our_sets_won, opponent_sets_won, set_scores')
        .eq('team_id', game.team_id)
        .eq('event_type', 'game')
        .eq('game_status', 'completed')
        .ilike('opponent_name', game.opponent_name)
        .neq('id', game.id)
        .order('event_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      setPreviousMatchup(data)
    } catch { setPreviousMatchup(null) }
  }

  async function saveNote() {
    setSavingNote(true)
    try {
      await supabase
        .from('schedule_events')
        .update({ description: gameNote })
        .eq('id', game.id)
      showToast?.('Note saved', 'success')
    } catch {
      showToast?.('Failed to save note', 'error')
    }
    setSavingNote(false)
  }

  const statusColors = {
    done: 'bg-lynx-sky text-white',
    in_progress: 'bg-amber-400 text-white',
    warning: 'bg-red-400 text-white',
    skipped: isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-300 text-slate-600',
    not_started: isDark ? 'bg-lynx-graphite text-slate-400 border border-lynx-border-dark' : 'bg-lynx-frost text-lynx-slate border border-lynx-silver',
  }

  const statusLabels = {
    done: 'Done',
    in_progress: 'In Progress',
    warning: 'Action Needed',
    skipped: 'Skipped',
    not_started: 'Not Started',
  }

  function getCheckpointAction(cpId) {
    switch (cpId) {
      case 'rsvp': return { label: 'View RSVPs', action: null }
      case 'lineup': return { label: checkpoints?.lineup?.status === 'done' ? 'Edit Lineup' : 'Set Lineup', action: onOpenLineup }
      case 'attend': return { label: 'Take Attendance', action: onOpenAttendance }
      case 'game': return { label: 'Launch Game Day', action: onOpenGameDay }
      case 'scores': return { label: 'Enter Scores', action: onOpenQuickScore || onOpenCompletion }
      case 'stats': return { label: 'Enter Stats', action: onOpenStats }
      default: return { label: 'View', action: null }
    }
  }

  const cardBg = isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'
  const innerBg = isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        className={`w-[800px] max-w-full h-full overflow-y-auto shadow-2xl ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Close button */}
        <div className="sticky top-0 z-10 flex justify-end p-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-lynx-frost text-lynx-slate'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 space-y-6 -mt-2">
          {/* Game Header */}
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
              vs {game?.opponent_name || 'TBD'}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              {formatDate(game?.event_date)} · {formatTime12(game?.event_time)} · {game?.location_type === 'home' ? 'Home' : 'Away'}
            </p>
            <p className="text-sm text-lynx-sky font-medium mt-0.5">{team?.name}</p>
          </div>

          {/* Checkpoint Progress Bar */}
          <div className={`${cardBg} rounded-xl p-4`}>
            {/* Dot tracker */}
            <div className="flex items-center justify-between mb-3">
              {CHECKPOINTS.map((cp, idx) => {
                const state = checkpoints?.[cp.id]
                const isCurrent = currentCheckpoint === cp.id
                return (
                  <div key={cp.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-4 h-4 rounded-full transition-all ${
                        state?.status === 'done' ? 'bg-lynx-sky' :
                        state?.status === 'in_progress' ? 'bg-amber-400' :
                        state?.status === 'warning' ? 'bg-red-400 animate-pulse' :
                        state?.status === 'skipped' ? 'bg-slate-400' :
                        isDark ? 'border-2 border-slate-600' : 'border-2 border-slate-300'
                      } ${isCurrent ? 'ring-2 ring-lynx-sky/40 ring-offset-2 ring-offset-transparent' : ''}`} />
                      <span className={`text-xs font-semibold ${
                        state?.status === 'done' ? 'text-lynx-sky' :
                        state?.status === 'warning' ? 'text-red-400' :
                        isCurrent ? (isDark ? 'text-white' : 'text-lynx-navy') :
                        isDark ? 'text-slate-600' : 'text-slate-400'
                      }`}>{cp.label}</span>
                    </div>
                    {idx < CHECKPOINTS.length - 1 && (
                      <div className={`flex-1 h-px mx-1 ${
                        state?.status === 'done' || state?.status === 'skipped' ? 'bg-lynx-sky/40' : isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
            {/* Progress bar */}
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div
                className="h-2 rounded-full bg-lynx-sky transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className={`text-xs mt-1.5 text-right font-semibold ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{completion}%</p>
          </div>

          {/* Current Checkpoint Hero Card */}
          {currentCheckpoint && checkpoints?.[currentCheckpoint] && (() => {
            const cp = CHECKPOINTS.find(c => c.id === currentCheckpoint)
            const state = checkpoints[currentCheckpoint]
            const action = getCheckpointAction(currentCheckpoint)
            return (
              <div className={`rounded-xl p-5 border-2 border-lynx-sky/30 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{cp?.icon}</span>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{cp?.label}</h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{state.detail}</p>
                  </div>
                </div>
                {action.action && (
                  <button
                    onClick={action.action}
                    className="mt-3 px-5 py-2.5 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white font-semibold text-sm transition flex items-center gap-2"
                  >
                    {action.label} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })()}

          {/* Checkpoint Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {CHECKPOINTS.filter(cp => cp.id !== currentCheckpoint).map(cp => {
              const state = checkpoints?.[cp.id]
              const action = getCheckpointAction(cp.id)
              return (
                <div key={cp.id} className={`${cardBg} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cp.icon}</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{cp.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${statusColors[state?.status || 'not_started']}`}>
                      {statusLabels[state?.status || 'not_started']}
                    </span>
                  </div>
                  <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                    {state?.detail || ''}
                  </p>
                  {cp.optional && (
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Optional</span>
                  )}
                  {action.action && (
                    <button
                      onClick={action.action}
                      className={`text-xs font-semibold text-lynx-sky hover:text-lynx-deep transition flex items-center gap-1`}
                    >
                      {action.label} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Game Notes */}
          <div className={`${cardBg} rounded-xl p-4`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              Game Notes
            </h4>
            <textarea
              value={gameNote}
              onChange={(e) => setGameNote(e.target.value)}
              placeholder="Add a note about this game..."
              rows={3}
              className={`w-full rounded-lg p-3 text-sm resize-none ${
                isDark
                  ? 'bg-lynx-graphite text-white placeholder-slate-500 border border-lynx-border-dark focus:border-lynx-sky'
                  : 'bg-lynx-frost text-lynx-navy placeholder-slate-400 border border-lynx-silver focus:border-lynx-sky'
              } outline-none transition`}
            />
            {gameNote !== (game?.description || game?.notes || '') && (
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="mt-2 px-4 py-1.5 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            )}
          </div>

          {/* Previous Matchup */}
          {previousMatchup && (
            <div className={`${cardBg} rounded-xl p-4`}>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                Previous Matchup
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                    vs {previousMatchup.opponent_name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                    {formatDate(previousMatchup.event_date)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    previousMatchup.game_result === 'win' ? 'bg-emerald-500/20 text-emerald-500' :
                    previousMatchup.game_result === 'loss' ? 'bg-red-500/20 text-red-500' :
                    isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {previousMatchup.game_result === 'win' ? 'W' : previousMatchup.game_result === 'loss' ? 'L' : 'T'}
                    {' '}
                    {previousMatchup.our_sets_won != null
                      ? `${previousMatchup.our_sets_won}-${previousMatchup.opponent_sets_won}`
                      : `${previousMatchup.our_score}-${previousMatchup.opponent_score}`
                    }
                  </span>
                  {previousMatchup.set_scores && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {previousMatchup.set_scores
                        .filter(s => s && (s.our > 0 || s.their > 0))
                        .map(s => `${s.our}-${s.their}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`${cardBg} rounded-xl p-4`}>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              Quick Actions
            </h4>
            <div className="flex gap-3">
              <button
                onClick={onOpenGameDay}
                className="flex-1 py-2.5 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white text-sm font-semibold transition"
              >
                🏐 Command Center
              </button>
              {game?.game_status === 'completed' && (
                <button
                  onClick={onOpenDetail}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition border ${
                    isDark ? 'border-lynx-border-dark text-slate-300 hover:bg-white/5' : 'border-lynx-silver text-lynx-slate hover:bg-lynx-frost'
                  }`}
                >
                  Full Game Detail
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
