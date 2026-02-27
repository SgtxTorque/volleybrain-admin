import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Check, Award } from '../../constants/icons'

// Volleyball Set Score Input Component
function SetScoreInput({ setNumber, ourScore, theirScore, targetScore, cap, winByTwo, onOurScoreChange, onTheirScoreChange, isDecidingSet, ourTeamName, theirTeamName }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [ourInput, setOurInput] = useState(ourScore > 0 ? String(ourScore) : '')
  const [theirInput, setTheirInput] = useState(theirScore > 0 ? String(theirScore) : '')
  
  useEffect(() => {
    setOurInput(ourScore > 0 ? String(ourScore) : '')
  }, [ourScore])
  
  useEffect(() => {
    setTheirInput(theirScore > 0 ? String(theirScore) : '')
  }, [theirScore])
  
  function isSetComplete() {
    if (ourScore < targetScore && theirScore < targetScore) return false
    if (winByTwo) {
      const diff = Math.abs(ourScore - theirScore)
      if (cap && (ourScore >= cap || theirScore >= cap)) return diff >= 1
      return diff >= 2 && (ourScore >= targetScore || theirScore >= targetScore)
    }
    return ourScore >= targetScore || theirScore >= targetScore
  }
  
  const complete = isSetComplete()
  const ourWon = complete && ourScore > theirScore
  const theyWon = complete && theirScore > ourScore
  
  return (
    <div className={`p-4 rounded-xl border-2 transition ${
      ourWon ? 'bg-emerald-500/10 border-emerald-500/50' :
      theyWon ? 'bg-red-500/10 border-red-500/50' :
      isDark ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isDecidingSet ? 'text-amber-400' : tc.text}`}>
            Set {setNumber}
          </span>
          {isDecidingSet && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
              Deciding
            </span>
          )}
        </div>
        <span className={`text-xs ${tc.textMuted}`}>
          First to {targetScore} {winByTwo ? '(win by 2)' : ''} {cap ? `• Cap: ${cap}` : ''}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className={`text-xs ${tc.textMuted} font-medium mb-1 block truncate`}>{ourTeamName || 'Us'}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOurScoreChange(Math.max(0, ourScore - 1))}
              className={`w-10 h-10 rounded-xl font-bold transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
            >-</button>
            <input
              type="text"
              inputMode="numeric"
              value={ourInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setOurInput(val)
                onOurScoreChange(val === '' ? 0 : parseInt(val, 10))
              }}
              placeholder="0"
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${isDark ? 'bg-slate-800' : 'bg-white'} ${
                ourWon ? 'border-emerald-400 text-emerald-400' : isDark ? 'border-slate-600 text-white focus:border-purple-500' : 'border-slate-300 text-slate-900 focus:border-purple-500'
              }`}
            />
            <button
              type="button"
              onClick={() => onOurScoreChange(ourScore + 1)}
              className="w-10 h-10 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition"
            >+</button>
          </div>
        </div>
        
        <div className={`text-2xl ${tc.textMuted} font-bold`}>-</div>
        
        <div className="flex-1">
          <label className={`text-xs ${tc.textMuted} font-medium mb-1 block text-right truncate`}>{theirTeamName || 'Opponent'}</label>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onTheirScoreChange(Math.max(0, theirScore - 1))}
              className={`w-10 h-10 rounded-xl font-bold transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'}`}
            >-</button>
            <input
              type="text"
              inputMode="numeric"
              value={theirInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setTheirInput(val)
                onTheirScoreChange(val === '' ? 0 : parseInt(val, 10))
              }}
              placeholder="0"
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${isDark ? 'bg-slate-800' : 'bg-white'} ${
                theyWon ? 'border-red-400 text-red-400' : isDark ? 'border-slate-600 text-white focus:border-purple-500' : 'border-slate-300 text-slate-900 focus:border-purple-500'
              }`}
            />
            <button
              type="button"
              onClick={() => onTheirScoreChange(theirScore + 1)}
              className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition"
            >+</button>
          </div>
        </div>
      </div>
      
      {(ourWon || theyWon) && (
        <div className={`mt-3 text-center text-sm font-medium ${ourWon ? 'text-emerald-400' : 'text-red-400'}`}>
          ✓ {ourWon ? `${ourTeamName || 'We'} won this set!` : `${theirTeamName || 'They'} won this set`}
        </div>
      )}
    </div>
  )
}

// Multi-sport scoring configurations
const SCORING_CONFIGS = {
  volleyball: {
    name: 'Volleyball', icon: '🏐', isSetBased: true,
    formats: [
      { id: 'best_of_3', name: 'Best of 3 Sets', description: 'First to win 2 sets', setsToWin: 2, maxSets: 3, setScores: [25, 25, 15], winByTwo: true, caps: [30, 30, 20] },
      { id: 'best_of_5', name: 'Best of 5 Sets', description: 'First to win 3 sets', setsToWin: 3, maxSets: 5, setScores: [25, 25, 25, 25, 15], winByTwo: true, caps: [30, 30, 30, 30, 20] },
      { id: 'two_sets', name: '2 Sets (No Winner)', description: 'Play 2 sets, no match winner', setsToWin: null, maxSets: 2, setScores: [25, 25], winByTwo: true, caps: [30, 30], noMatchWinner: true },
    ],
  },
  basketball: {
    name: 'Basketball', icon: '🏀', isSetBased: false,
    formats: [
      { id: 'four_quarters', name: '4 Quarters', description: 'Standard game', periods: 4, periodAbbr: 'Q', hasOvertime: true },
      { id: 'two_halves', name: '2 Halves', description: 'College/Youth format', periods: 2, periodAbbr: 'H', hasOvertime: true },
    ],
  },
  soccer: {
    name: 'Soccer', icon: '⚽', isSetBased: false,
    formats: [
      { id: 'two_halves', name: '2 Halves', description: 'Standard match', periods: 2, periodAbbr: 'H', allowTie: true },
      { id: 'four_quarters', name: '4 Quarters', description: 'Youth format', periods: 4, periodAbbr: 'Q', allowTie: true },
    ],
  },
  baseball: {
    name: 'Baseball', icon: '⚾', isSetBased: false,
    formats: [
      { id: 'six_innings', name: '6 Innings', description: 'Youth baseball', periods: 6, periodAbbr: 'Inn', hasOvertime: true },
      { id: 'seven_innings', name: '7 Innings', description: 'Middle/High school', periods: 7, periodAbbr: 'Inn', hasOvertime: true },
    ],
  },
  softball: {
    name: 'Softball', icon: '🥎', isSetBased: false,
    formats: [
      { id: 'five_innings', name: '5 Innings', description: 'Youth softball', periods: 5, periodAbbr: 'Inn', hasOvertime: true },
      { id: 'seven_innings', name: '7 Innings', description: 'Standard', periods: 7, periodAbbr: 'Inn', hasOvertime: true },
    ],
  },
  football: {
    name: 'Football', icon: '🏈', isSetBased: false,
    formats: [{ id: 'four_quarters', name: '4 Quarters', description: 'Standard game', periods: 4, periodAbbr: 'Q', hasOvertime: true }],
  },
  hockey: {
    name: 'Hockey', icon: '🏒', isSetBased: false,
    formats: [{ id: 'three_periods', name: '3 Periods', description: 'Standard game', periods: 3, periodAbbr: 'P', hasOvertime: true }],
  },
}

function GameCompletionModal({ event, team, roster, sport = 'volleyball', onClose, onComplete, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { user } = useAuth()
  
  const sportConfig = SCORING_CONFIGS[sport] || SCORING_CONFIGS.volleyball
  const isSetBased = sportConfig.isSetBased
  
  const [step, setStep] = useState(1) // 1: Format, 2: Score, 3: Attendance, 4: Badges, 5: Confirm
  const [selectedFormat, setSelectedFormat] = useState(sportConfig.formats[0])
  const [setScores, setSetScores] = useState([])
  const [periodScores, setPeriodScores] = useState([])
  const [attendance, setAttendance] = useState({})
  const [badges, setBadges] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  
  const gameBadges = [
    { id: 'game_mvp', name: 'Game MVP', icon: '🏆' },
    { id: 'defensive_player', name: 'Defensive Player', icon: '🛡️' },
    { id: 'best_server', name: 'Ace Machine', icon: '🎯' },
    { id: 'team_spirit', name: 'Team Spirit', icon: '💪' },
    { id: 'most_improved', name: 'Most Improved', icon: '📈' },
    { id: 'clutch_player', name: 'Clutch Player', icon: '⭐' },
  ]
  
  useEffect(() => {
    if (isSetBased) {
      setSetScores(Array(selectedFormat.maxSets).fill(null).map(() => ({ our: 0, their: 0 })))
    } else {
      setPeriodScores(Array(selectedFormat.periods).fill(null).map(() => ({ our: 0, their: 0 })))
    }
  }, [selectedFormat, isSetBased])
  
  useEffect(() => {
    const initial = {}
    roster.forEach(p => { initial[p.id] = 'present' })
    setAttendance(initial)
  }, [roster])
  
  // Calculate set-based result (volleyball)
  function calculateSetBasedResult() {
    if (selectedFormat.noMatchWinner) {
      const ourTotal = setScores.reduce((sum, s) => sum + (s.our || 0), 0)
      const theirTotal = setScores.reduce((sum, s) => sum + (s.their || 0), 0)
      return { result: 'none', ourSetsWon: 0, theirSetsWon: 0, ourTotalPoints: ourTotal, theirTotalPoints: theirTotal, pointDifferential: ourTotal - theirTotal }
    }
    
    let ourSetsWon = 0, theirSetsWon = 0, ourTotalPoints = 0, theirTotalPoints = 0
    setScores.forEach((set, idx) => {
      const target = selectedFormat.setScores[idx], cap = selectedFormat.caps?.[idx]
      const ourScore = set.our || 0, theirScore = set.their || 0
      ourTotalPoints += ourScore
      theirTotalPoints += theirScore
      
      let complete = false
      if (ourScore >= target || theirScore >= target) {
        if (selectedFormat.winByTwo) {
          const diff = Math.abs(ourScore - theirScore)
          complete = (cap && (ourScore >= cap || theirScore >= cap)) ? diff >= 1 : diff >= 2
        } else complete = true
      }
      if (complete) { if (ourScore > theirScore) ourSetsWon++; else theirSetsWon++ }
    })
    
    let result = 'in_progress'
    if (ourSetsWon >= selectedFormat.setsToWin) result = 'win'
    else if (theirSetsWon >= selectedFormat.setsToWin) result = 'loss'
    
    return { result, ourSetsWon, theirSetsWon, ourTotalPoints, theirTotalPoints, pointDifferential: ourTotalPoints - theirTotalPoints }
  }
  
  // Calculate period-based result
  function calculatePeriodBasedResult() {
    let ourTotal = 0, theirTotal = 0
    periodScores.forEach(p => { ourTotal += p.our || 0; theirTotal += p.their || 0 })
    
    let result = 'in_progress'
    if (ourTotal > theirTotal) result = 'win'
    else if (theirTotal > ourTotal) result = 'loss'
    else if (selectedFormat.allowTie && ourTotal === theirTotal && ourTotal > 0) result = 'tie'
    else if (ourTotal > 0 || theirTotal > 0) result = ourTotal === theirTotal ? 'tie' : 'in_progress'
    
    return { result, ourTotalPoints: ourTotal, theirTotalPoints: theirTotal, pointDifferential: ourTotal - theirTotal }
  }
  
  const matchResult = isSetBased ? calculateSetBasedResult() : calculatePeriodBasedResult()
  
  function getSetsToShow() {
    if (!isSetBased) return 0
    const { ourSetsWon, theirSetsWon } = matchResult
    if (matchResult.result === 'win' || matchResult.result === 'loss') return ourSetsWon + theirSetsWon
    let setsPlayed = 0
    setScores.forEach((set, idx) => { if (set.our > 0 || set.their > 0) setsPlayed = idx + 1 })
    return Math.min(Math.max(setsPlayed + 1, 2), selectedFormat.maxSets)
  }
  
  function updateSetScore(idx, team, val) { setSetScores(prev => { const u = [...prev]; u[idx] = { ...u[idx], [team]: val }; return u }) }
  function updatePeriodScore(idx, team, val) { setPeriodScores(prev => { const u = [...prev]; u[idx] = { ...u[idx], [team]: val }; return u }) }
  function addOvertime() { setPeriodScores(prev => [...prev, { our: 0, their: 0 }]) }
  
  function toggleAttendance(playerId) {
    const current = attendance[playerId] || 'present'
    const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present'
    setAttendance({ ...attendance, [playerId]: next })
  }
  
  function toggleBadge(playerId, badgeType) {
    const exists = badges.find(b => b.playerId === playerId && b.badgeType === badgeType)
    if (exists) setBadges(badges.filter(b => !(b.playerId === playerId && b.badgeType === badgeType)))
    else setBadges([...badges, { playerId, badgeType }])
  }
  
  function getPlayerBadges(playerId) { return badges.filter(b => b.playerId === playerId) }
  
  async function completeGame() {
    setSaving(true)
    try {
      const updateData = {
        game_status: 'completed',
        scoring_format: selectedFormat.id,
        our_score: matchResult.ourTotalPoints,
        opponent_score: matchResult.theirTotalPoints,
        point_differential: matchResult.pointDifferential,
        game_result: matchResult.result === 'win' ? 'win' : matchResult.result === 'loss' ? 'loss' : matchResult.result === 'tie' ? 'tie' : null,
        completed_at: new Date().toISOString(),
        completed_by: user?.id,
        notes: notes || null
      }
      
      if (isSetBased) {
        updateData.set_scores = setScores
        updateData.our_sets_won = matchResult.ourSetsWon
        updateData.opponent_sets_won = matchResult.theirSetsWon
      } else {
        updateData.period_scores = periodScores
      }
      
      await supabase.from('schedule_events').update(updateData).eq('id', event.id)
      
      // Save attendance
      await supabase.from('event_attendance').delete().eq('event_id', event.id)
      const attendanceRecords = Object.entries(attendance).map(([playerId, status]) => ({
        event_id: event.id, player_id: playerId, status, recorded_at: new Date().toISOString(), recorded_by: user?.id
      }))
      if (attendanceRecords.length > 0) await supabase.from('event_attendance').insert(attendanceRecords)
      
      // Award badges
      for (const badge of badges) {
        await supabase.from('player_badges').insert({
          player_id: badge.playerId, badge_id: badge.badgeType, earned_at: new Date().toISOString(),
          awarded_by: user?.id, context: `Game vs ${event.opponent_name || 'opponent'} - ${matchResult.result}`, event_id: event.id
        })
      }
      
      showToast?.(`Game completed! ${matchResult.result === 'win' ? '🎉 Victory!' : ''}`, 'success')
      onComplete?.()
      onClose()
    } catch (err) {
      console.error('Error completing game:', err)
      showToast?.('Error completing game', 'error')
    }
    setSaving(false)
  }
  
  const presentCount = Object.values(attendance).filter(s => s === 'present' || s === 'late').length
  const canComplete = matchResult.result === 'win' || matchResult.result === 'loss' || matchResult.result === 'tie' || selectedFormat.noMatchWinner
  const steps = ['Format', 'Score', 'Attendance', 'Badges', 'Confirm']

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${tc.cardBg} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} ${
          matchResult.result === 'win' ? 'bg-emerald-500/20' : matchResult.result === 'loss' ? 'bg-red-500/20' : ''
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sportConfig.icon}</span>
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>Complete Game</h2>
              <p className={tc.textMuted}>{team?.name} vs {event.opponent_name || 'TBD'}</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            {steps.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i + 1)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                  step === i + 1 ? 'bg-[var(--accent-primary)] text-white' : step > i + 1 ? 'bg-emerald-500/20 text-emerald-400' : `${tc.cardBgAlt} ${tc.textMuted}`
                }`}
              >
                {step > i + 1 ? '✓ ' : ''}{s}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Step 1: Format */}
          {step === 1 && (
            <div className="space-y-4">
              <p className={tc.textMuted}>Select scoring format for {sportConfig.name}</p>
              <div className="space-y-2">
                {sportConfig.formats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format)}
                    className={`w-full p-4 rounded-xl text-left transition border-2 ${
                      selectedFormat.id === format.id ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : `${tc.border} hover:border-slate-500`
                    }`}
                  >
                    <p className={`font-semibold ${tc.text}`}>{format.name}</p>
                    <p className={`text-sm ${tc.textMuted}`}>{format.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 2: Score */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Match status */}
              <div className={`p-4 rounded-xl text-center ${
                matchResult.result === 'win' ? 'bg-emerald-500/20' : matchResult.result === 'loss' ? 'bg-red-500/20' : tc.cardBgAlt
              }`}>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className={`text-xs ${tc.textMuted} mb-1`}>{team?.name}</p>
                    <p className="text-4xl font-bold text-[var(--accent-primary)]">{isSetBased ? matchResult.ourSetsWon : matchResult.ourTotalPoints}</p>
                    {isSetBased && <p className={`text-xs ${tc.textMuted} mt-1`}>{matchResult.ourTotalPoints} pts</p>}
                  </div>
                  <div className="text-center">
                    {matchResult.result === 'win' && <span className="text-emerald-400 font-bold">🏆 VICTORY!</span>}
                    {matchResult.result === 'loss' && <span className="text-red-400 font-medium">Defeat</span>}
                    {matchResult.result === 'tie' && <span className="text-amber-400 font-medium">Tie</span>}
                    {matchResult.result === 'in_progress' && <span className={tc.textMuted}>In Progress</span>}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs ${tc.textMuted} mb-1`}>{event.opponent_name}</p>
                    <p className="text-4xl font-bold text-red-400">{isSetBased ? matchResult.theirSetsWon : matchResult.theirTotalPoints}</p>
                    {isSetBased && <p className={`text-xs ${tc.textMuted} mt-1`}>{matchResult.theirTotalPoints} pts</p>}
                  </div>
                </div>
                <p className={`text-sm ${tc.textMuted} mt-2`}>
                  Point Differential: <span className={matchResult.pointDifferential > 0 ? 'text-emerald-400' : matchResult.pointDifferential < 0 ? 'text-red-400' : ''}>
                    {matchResult.pointDifferential > 0 ? '+' : ''}{matchResult.pointDifferential}
                  </span>
                </p>
              </div>
              
              {/* Set Summary */}
              {isSetBased && setScores.some(s => s.our > 0 || s.their > 0) && (
                <div className={`${tc.cardBgAlt} rounded-xl p-3`}>
                  <div className="flex flex-wrap gap-3">
                    {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                      if (set.our === 0 && set.their === 0) return null
                      const ourWon = set.our > set.their
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={tc.textMuted}>Set {idx + 1}:</span>
                          <span className={`font-bold ${ourWon ? 'text-emerald-400' : 'text-red-400'}`}>{set.our}-{set.their}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Set inputs (volleyball) */}
              {isSetBased && (
                <div className="space-y-4">
                  {setScores.slice(0, getSetsToShow()).map((set, idx) => (
                    <SetScoreInput
                      key={idx}
                      setNumber={idx + 1}
                      ourScore={set.our || 0}
                      theirScore={set.their || 0}
                      targetScore={selectedFormat.setScores[idx]}
                      cap={selectedFormat.caps?.[idx]}
                      winByTwo={selectedFormat.winByTwo}
                      isDecidingSet={idx === selectedFormat.maxSets - 1}
                      ourTeamName={team?.name}
                      theirTeamName={event.opponent_name}
                      onOurScoreChange={(val) => updateSetScore(idx, 'our', val)}
                      onTheirScoreChange={(val) => updateSetScore(idx, 'their', val)}
                    />
                  ))}
                </div>
              )}
              
              {/* Period inputs (other sports) */}
              {!isSetBased && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    {periodScores.map((period, idx) => (
                      <div key={idx} className={`p-3 rounded-xl ${idx >= selectedFormat.periods ? 'bg-amber-500/10 border border-amber-500/30' : tc.cardBgAlt}`}>
                        <div className={`text-center text-xs font-medium mb-2 ${idx >= selectedFormat.periods ? 'text-amber-400' : tc.textMuted}`}>
                          {idx >= selectedFormat.periods ? 'OT' : `${selectedFormat.periodAbbr}${idx + 1}`}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={period.our || ''}
                          onChange={(e) => updatePeriodScore(idx, 'our', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                          placeholder="0"
                          className={`w-full h-10 text-center font-bold rounded-lg border ${tc.border} bg-transparent ${tc.text} mb-2`}
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={period.their || ''}
                          onChange={(e) => updatePeriodScore(idx, 'their', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                          placeholder="0"
                          className={`w-full h-10 text-center font-bold rounded-lg border border-red-500/30 bg-transparent text-red-400`}
                        />
                      </div>
                    ))}
                  </div>
                  {selectedFormat.hasOvertime && matchResult.ourTotalPoints === matchResult.theirTotalPoints && matchResult.ourTotalPoints > 0 && (
                    <button onClick={addOvertime} className={`w-full py-2 border-2 border-dashed border-amber-500/50 rounded-xl text-amber-400 hover:bg-amber-500/10 transition text-sm`}>
                      + Add Overtime
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Attendance */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className={tc.textMuted}>Mark who played</p>
                <span className={`px-3 py-1 rounded-full text-sm ${presentCount >= 6 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {presentCount} present
                </span>
              </div>
              <div className="space-y-2">
                {roster.map(player => {
                  const status = attendance[player.id] || 'present'
                  return (
                    <div key={player.id} onClick={() => toggleAttendance(player.id)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition ${
                        status === 'present' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                        status === 'late' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-red-500/10 border border-red-500/30'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                          {player.jersey_number || '?'}
                        </div>
                        <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        status === 'present' ? 'bg-emerald-500 text-white' : status === 'late' ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'
                      }`}>
                        {status === 'present' ? '✓ Present' : status === 'late' ? '⏰ Late' : '✗ Absent'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Step 4: Badges */}
          {step === 4 && (
            <div className="space-y-4">
              <p className={tc.textMuted}>Award badges (optional)</p>
              <div className={`p-3 rounded-xl ${tc.cardBgAlt}`}>
                <div className="flex flex-wrap gap-2">
                  {gameBadges.map(b => <span key={b.id} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{b.icon} {b.name}</span>)}
                </div>
              </div>
              <div className="space-y-3">
                {roster.filter(p => attendance[p.id] === 'present' || attendance[p.id] === 'late').map(player => {
                  const playerBadges = getPlayerBadges(player.id)
                  return (
                    <div key={player.id} className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-600 text-white' : 'bg-slate-300 text-slate-700'}`}>{player.jersey_number || '?'}</div>
                        <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                        {playerBadges.length > 0 && <span className="text-xs text-[var(--accent-primary)]">{playerBadges.length} badge(s)</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gameBadges.map(badge => {
                          const awarded = playerBadges.some(b => b.badgeType === badge.id)
                          return (
                            <button key={badge.id} onClick={() => toggleBadge(player.id, badge.id)}
                              className={`px-2 py-1 rounded-lg text-xs transition ${awarded ? 'bg-[var(--accent-primary)] text-white' : `${tc.cardBg} ${tc.textMuted} ${tc.hoverBg}`}`}>
                              {badge.icon} {badge.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-6xl">{matchResult.result === 'win' ? '🏆' : matchResult.result === 'loss' ? '📊' : '🤝'}</span>
                <h3 className={`text-2xl font-bold ${tc.text} mt-4`}>
                  {isSetBased ? `${matchResult.ourSetsWon} - ${matchResult.theirSetsWon}` : `${matchResult.ourTotalPoints} - ${matchResult.theirTotalPoints}`}
                </h3>
                <p className={tc.textMuted}>{team?.name} vs {event.opponent_name}</p>
              </div>
              
              <div className={`p-4 rounded-xl ${tc.cardBgAlt} space-y-3`}>
                <div className="flex justify-between"><span className={tc.textMuted}>Format</span><span className={tc.text}>{selectedFormat.name}</span></div>
                {isSetBased && (
                  <>
                    <div className="flex justify-between"><span className={tc.textMuted}>Sets</span><span className={tc.text}>{matchResult.ourSetsWon} - {matchResult.theirSetsWon}</span></div>
                    <div className={`pt-2 border-t ${tc.border}`}>
                      {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                        if (set.our === 0 && set.their === 0) return null
                        return <div key={idx} className="flex justify-between text-sm"><span className={tc.textMuted}>Set {idx + 1}</span><span className={set.our > set.their ? 'text-emerald-400' : 'text-red-400'}>{set.our}-{set.their}</span></div>
                      })}
                    </div>
                  </>
                )}
                <div className="flex justify-between"><span className={tc.textMuted}>Total Points</span><span className={tc.text}>{matchResult.ourTotalPoints} - {matchResult.theirTotalPoints}</span></div>
                <div className="flex justify-between"><span className={tc.textMuted}>Point Diff</span><span className={matchResult.pointDifferential > 0 ? 'text-emerald-400' : matchResult.pointDifferential < 0 ? 'text-red-400' : tc.text}>{matchResult.pointDifferential > 0 ? '+' : ''}{matchResult.pointDifferential}</span></div>
                <div className="flex justify-between"><span className={tc.textMuted}>Result</span><span className={matchResult.result === 'win' ? 'text-emerald-400 font-bold' : matchResult.result === 'loss' ? 'text-red-400' : tc.text}>{matchResult.result?.toUpperCase() || 'N/A'}</span></div>
                <div className="flex justify-between"><span className={tc.textMuted}>Attendance</span><span className={tc.text}>{presentCount}</span></div>
                <div className="flex justify-between"><span className={tc.textMuted}>Badges</span><span className={tc.text}>{badges.length}</span></div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Game Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." rows={2} className={`w-full px-4 py-3 rounded-xl ${tc.input} resize-none`} />
              </div>
              
              {!canComplete && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm">
                  ⚠️ Game must have a winner before completing.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${tc.border} flex justify-between`}>
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text}`}>
            {step > 1 ? '← Back' : 'Cancel'}
          </button>
          {step < 5 ? (
            <button onClick={() => setStep(step + 1)} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">
              Next →
            </button>
          ) : (
            <button onClick={completeGame} disabled={saving || !canComplete} className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-50">
              {saving ? 'Completing...' : '✓ Complete Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameCompletionModal
