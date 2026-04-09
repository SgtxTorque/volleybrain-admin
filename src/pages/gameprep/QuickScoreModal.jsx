import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'

const VOLLEYBALL_FORMATS = [
  { id: 'best_of_3', name: 'Best of 3', setsToWin: 2, maxSets: 3, setScores: [25, 25, 15], caps: [30, 30, 20] },
  { id: 'best_of_5', name: 'Best of 5', setsToWin: 3, maxSets: 5, setScores: [25, 25, 25, 25, 15], caps: [30, 30, 30, 30, 20] },
]

const BASKETBALL_FORMATS = [
  { id: 'four_quarters', name: '4 Quarters', periods: 4, periodName: 'Quarter', periodAbbr: 'Q', hasOvertime: true },
  { id: 'two_halves', name: '2 Halves', periods: 2, periodName: 'Half', periodAbbr: 'H', hasOvertime: true },
]

export default function QuickScoreModal({ event, team, roster, sport = 'volleyball', onClose, onComplete, showToast }) {
  const { isDark } = useTheme()
  const { user } = useAuth()

  const sportLower = sport?.toLowerCase() || ''
  const isSetBased = sportLower === 'volleyball' || sportLower === ''
  const formats = isSetBased ? VOLLEYBALL_FORMATS : BASKETBALL_FORMATS

  const [saving, setSaving] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(formats[0])
  const [setScores, setSetScores] = useState([])
  const [periodScores, setPeriodScores] = useState([])
  const [quickStars, setQuickStars] = useState({})

  // Restore format from previous game if available
  useEffect(() => {
    if (event?.scoring_format) {
      const found = formats.find(f => f.id === event.scoring_format)
      if (found) { setSelectedFormat(found); return }
    }
    setSelectedFormat(formats[0])
  }, [event?.id, isSetBased])

  // Initialize scores when format changes
  useEffect(() => {
    if (isSetBased) {
      setSetScores(Array(selectedFormat.maxSets).fill(null).map(() => ({ our: 0, their: 0 })))
    } else {
      setPeriodScores(Array(selectedFormat.periods).fill(null).map(() => ({ our: 0, their: 0 })))
    }
  }, [selectedFormat])

  function updateSet(idx, side, value) {
    const val = Math.max(0, Math.min(99, parseInt(value) || 0))
    setSetScores(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [side]: val }
      return updated
    })
  }

  function updatePeriod(idx, side, value) {
    const val = Math.max(0, Math.min(999, parseInt(value) || 0))
    setPeriodScores(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [side]: val }
      return updated
    })
  }

  // --- Volleyball result calculation ---
  function calculateSetResult() {
    let ourSetsWon = 0
    let theirSetsWon = 0
    let ourTotal = 0
    let theirTotal = 0

    setScores.forEach((set) => {
      ourTotal += set.our || 0
      theirTotal += set.their || 0
      if (set.our > 0 || set.their > 0) {
        if (set.our > set.their) ourSetsWon++
        else if (set.their > set.our) theirSetsWon++
      }
    })

    let result = 'in_progress'
    if (ourSetsWon >= selectedFormat.setsToWin) result = 'win'
    else if (theirSetsWon >= selectedFormat.setsToWin) result = 'loss'

    return { result, ourSetsWon, theirSetsWon, ourTotal, theirTotal, diff: ourTotal - theirTotal }
  }

  // --- Period-based result calculation (basketball etc.) ---
  function calculatePeriodResult() {
    let ourTotal = 0
    let theirTotal = 0
    let hasAnyScore = false

    periodScores.forEach((p) => {
      ourTotal += p.our || 0
      theirTotal += p.their || 0
      if (p.our > 0 || p.their > 0) hasAnyScore = true
    })

    let result = 'in_progress'
    if (hasAnyScore && ourTotal !== theirTotal) {
      result = ourTotal > theirTotal ? 'win' : 'loss'
    } else if (hasAnyScore && ourTotal === theirTotal) {
      result = 'tie'
    }

    return { result, ourTotal, theirTotal, diff: ourTotal - theirTotal, hasAnyScore }
  }

  const match = isSetBased ? calculateSetResult() : calculatePeriodResult()
  const canSave = isSetBased
    ? (match.result === 'win' || match.result === 'loss')
    : (match.hasAnyScore && match.result !== 'in_progress')

  function getSetsToShow() {
    if (match.result === 'win' || match.result === 'loss') {
      return match.ourSetsWon + match.theirSetsWon
    }
    let played = 0
    setScores.forEach((s, i) => { if (s.our > 0 || s.their > 0) played = i + 1 })
    return Math.min(Math.max(played + 1, 2), selectedFormat.maxSets)
  }

  function toggleStar(playerId) {
    setQuickStars(prev => ({ ...prev, [playerId]: !prev[playerId] }))
  }

  async function save() {
    setSaving(true)
    try {
      let updateData

      if (isSetBased) {
        // Volleyball save — unchanged
        updateData = {
          game_status: 'completed',
          scoring_format: selectedFormat.id,
          our_score: match.ourTotal,
          opponent_score: match.theirTotal,
          point_differential: match.diff,
          game_result: match.result,
          set_scores: setScores,
          our_sets_won: match.ourSetsWon,
          opponent_sets_won: match.theirSetsWon,
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        }
      } else {
        // Period-based save (basketball, soccer, etc.) — follows GamePrepCompletionModal pattern
        updateData = {
          game_status: 'completed',
          scoring_format: selectedFormat.id,
          our_score: match.ourTotal,
          opponent_score: match.theirTotal,
          point_differential: match.diff,
          game_result: match.result,
          period_scores: periodScores,
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        }
      }

      const { error } = await supabase
        .from('schedule_events')
        .update(updateData)
        .eq('id', event.id)

      if (error) throw error

      // Create shoutouts for starred players
      const starredIds = Object.entries(quickStars).filter(([, v]) => v).map(([id]) => id)
      if (starredIds.length > 0) {
        const starredPlayers = roster.filter(p => starredIds.includes(p.id))
        const names = starredPlayers.map(p => p.first_name).join(', ')
        const shoutouts = starredPlayers.map(p => ({
          from_user_id: user?.id,
          to_player_id: p.id,
          team_id: team?.id,
          category: 'game_star',
          message: `Game star vs ${event.opponent_name || 'opponent'}`,
          season_id: event.season_id,
        }))
        await supabase.from('shoutouts').insert(shoutouts).catch(() => {})

        // Post to team wall
        await supabase.from('team_posts').insert({
          team_id: team?.id,
          author_id: user?.id,
          content: `⭐ Game Stars: ${names} stood out vs ${event.opponent_name || 'opponent'}!`,
          post_type: 'shoutout',
        }).catch(() => {})
      }

      const message = match.result === 'win' ? 'Victory! Game saved.' : match.result === 'tie' ? 'Tie game saved.' : 'Game completed and saved.'
      showToast?.(message, 'success')
      onComplete?.()
      onClose()
    } catch (err) {
      console.error('Error saving game:', err)
      showToast?.('Error saving game', 'error')
    }
    setSaving(false)
  }

  const setsToShow = isSetBased ? getSetsToShow() : 0

  // Result display text
  const resultLabel = isSetBased
    ? `${match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSS' : 'In Progress'} ${match.ourSetsWon}-${match.theirSetsWon}`
    : `${match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSS' : match.result === 'tie' ? 'TIE' : 'In Progress'}`

  const scoreSummary = isSetBased
    ? `${match.ourTotal}-${match.theirTotal} total · ${match.diff > 0 ? '+' : ''}${match.diff} diff`
    : `${match.ourTotal} - ${match.theirTotal} · ${match.diff > 0 ? '+' : ''}${match.diff} diff`

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Enter Scores</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              vs {event?.opponent_name} · {new Date((event?.event_date || '') + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-lynx-frost'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format Selector */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Format:</span>
            <div className="flex gap-2">
              {formats.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFormat(f)}
                  className={`px-3 py-1.5 rounded-[10px] text-sm font-semibold transition ${
                    selectedFormat.id === f.id
                      ? 'bg-lynx-sky text-white'
                      : isDark
                        ? 'bg-lynx-graphite text-slate-300 hover:bg-white/10'
                        : 'bg-lynx-frost text-lynx-slate hover:bg-slate-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Score Inputs */}
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-3 items-center">
              <div />
              <div className={`text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                {team?.name?.split(' ').pop() || 'Us'}
              </div>
              <div className={`text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                {event?.opponent_name?.split(' ').pop() || 'Them'}
              </div>
            </div>

            {isSetBased ? (
              /* Volleyball set inputs */
              setScores.slice(0, setsToShow).map((set, idx) => {
                const ourWon = set.our > set.their && (set.our > 0 || set.their > 0)
                const theirWon = set.their > set.our && (set.our > 0 || set.their > 0)
                return (
                  <div key={idx} className="grid grid-cols-[1fr_80px_80px] gap-3 items-center">
                    <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>
                      Set {idx + 1} {idx === selectedFormat.maxSets - 1 ? '(deciding)' : ''}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={set.our || ''}
                      onChange={e => updateSet(idx, 'our', e.target.value)}
                      className={`text-center text-lg font-bold rounded-lg py-2 outline-none transition ${
                        ourWon
                          ? 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/40'
                          : isDark
                            ? 'bg-lynx-graphite text-white border border-lynx-border-dark focus:border-lynx-sky'
                            : 'bg-lynx-frost text-lynx-navy border border-lynx-silver focus:border-lynx-sky'
                      }`}
                      placeholder="0"
                    />
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={set.their || ''}
                      onChange={e => updateSet(idx, 'their', e.target.value)}
                      className={`text-center text-lg font-bold rounded-lg py-2 outline-none transition ${
                        theirWon
                          ? 'bg-red-500/20 text-red-500 border-2 border-red-500/40'
                          : isDark
                            ? 'bg-lynx-graphite text-white border border-lynx-border-dark focus:border-lynx-sky'
                            : 'bg-lynx-frost text-lynx-navy border border-lynx-silver focus:border-lynx-sky'
                      }`}
                      placeholder="0"
                    />
                  </div>
                )
              })
            ) : (
              /* Period-based inputs (basketball, soccer, etc.) */
              periodScores.map((period, idx) => {
                const periodLabel = selectedFormat.periodAbbr
                  ? `${selectedFormat.periodAbbr}${idx + 1}`
                  : `P${idx + 1}`
                const ourWon = period.our > period.their && (period.our > 0 || period.their > 0)
                const theirWon = period.their > period.our && (period.our > 0 || period.their > 0)
                return (
                  <div key={idx} className="grid grid-cols-[1fr_80px_80px] gap-3 items-center">
                    <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>
                      {periodLabel}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={period.our || ''}
                      onChange={e => updatePeriod(idx, 'our', e.target.value)}
                      className={`text-center text-lg font-bold rounded-lg py-2 outline-none transition ${
                        ourWon
                          ? 'bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/40'
                          : isDark
                            ? 'bg-lynx-graphite text-white border border-lynx-border-dark focus:border-lynx-sky'
                            : 'bg-lynx-frost text-lynx-navy border border-lynx-silver focus:border-lynx-sky'
                      }`}
                      placeholder="0"
                    />
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={period.their || ''}
                      onChange={e => updatePeriod(idx, 'their', e.target.value)}
                      className={`text-center text-lg font-bold rounded-lg py-2 outline-none transition ${
                        theirWon
                          ? 'bg-red-500/20 text-red-500 border-2 border-red-500/40'
                          : isDark
                            ? 'bg-lynx-graphite text-white border border-lynx-border-dark focus:border-lynx-sky'
                            : 'bg-lynx-frost text-lynx-navy border border-lynx-silver focus:border-lynx-sky'
                      }`}
                      placeholder="0"
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Result Display */}
          {(match.ourTotal > 0 || match.theirTotal > 0) && (
            <div className={`rounded-xl p-4 text-center ${
              match.result === 'win' ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' :
              match.result === 'loss' ? isDark ? 'bg-red-500/10' : 'bg-red-50' :
              match.result === 'tie' ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' :
              isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'
            }`}>
              <p className={`text-2xl font-bold ${
                match.result === 'win' ? 'text-emerald-500' :
                match.result === 'loss' ? 'text-red-500' :
                match.result === 'tie' ? 'text-amber-500' :
                isDark ? 'text-white' : 'text-lynx-navy'
              }`}>
                {resultLabel}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                {scoreSummary}
              </p>
            </div>
          )}

          {/* Quick Stars */}
          {roster.length > 0 && (
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                Quick Stars (optional)
              </h4>
              <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Who stood out? They'll get a shoutout on the Team Wall.
              </p>
              <div className="flex flex-wrap gap-2">
                {roster
                  .sort((a, b) => (a.jersey_number || 999) - (b.jersey_number || 999))
                  .map(player => {
                    const starred = quickStars[player.id]
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleStar(player.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                          starred
                            ? 'bg-amber-400/20 border-amber-400/50 text-amber-500'
                            : isDark
                              ? 'bg-lynx-graphite border-lynx-border-dark text-slate-400 hover:border-amber-400/30'
                              : 'bg-lynx-frost border-lynx-silver text-lynx-slate hover:border-amber-400/30'
                        }`}
                      >
                        {starred ? '⭐ ' : ''}{player.first_name}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex justify-between`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-[10px] font-medium text-sm transition ${
              isDark ? 'bg-lynx-graphite text-slate-300 hover:bg-white/10' : 'bg-lynx-frost text-lynx-slate hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !canSave}
            className="px-5 py-2.5 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white font-semibold text-sm transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </div>
    </div>
  )
}
