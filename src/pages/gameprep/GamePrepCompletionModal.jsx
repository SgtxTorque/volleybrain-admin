import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import SetScoreInput from './SetScoreInput'
import PeriodScoreInput from './PeriodScoreInput'

// ============================================
// MULTI-SPORT SCORING CONFIGURATIONS
// ============================================
const SCORING_CONFIGS = {
  volleyball: {
    name: 'Volleyball',
    icon: '🏐',
    type: 'sets',
    formats: [
      {
        id: 'best_of_3',
        name: 'Best of 3 Sets',
        description: 'Youth/Recreational - First to win 2 sets',
        setsToWin: 2,
        maxSets: 3,
        setScores: [25, 25, 15],
        winByTwo: true,
        caps: [30, 30, 20],
      },
      {
        id: 'best_of_5',
        name: 'Best of 5 Sets',
        description: 'Competitive - First to win 3 sets',
        setsToWin: 3,
        maxSets: 5,
        setScores: [25, 25, 25, 25, 15],
        winByTwo: true,
        caps: [30, 30, 30, 30, 20],
      },
      {
        id: 'two_sets',
        name: '2 Sets (No Winner)',
        description: 'Recreational - Play 2 sets, no match winner',
        setsToWin: null,
        maxSets: 2,
        setScores: [25, 25],
        winByTwo: true,
        caps: [30, 30],
        noMatchWinner: true,
      },
    ],
  },
  basketball: {
    name: 'Basketball',
    icon: '🏀',
    type: 'periods',
    formats: [
      {
        id: 'four_quarters',
        name: '4 Quarters',
        description: 'Standard game with 4 quarters',
        periods: 4,
        periodName: 'Quarter',
        periodAbbr: 'Q',
        hasOvertime: true,
      },
      {
        id: 'two_halves',
        name: '2 Halves',
        description: 'College/Youth format',
        periods: 2,
        periodName: 'Half',
        periodAbbr: 'H',
        hasOvertime: true,
      },
    ],
  },
  soccer: {
    name: 'Soccer',
    icon: '⚽',
    type: 'periods',
    formats: [
      {
        id: 'two_halves',
        name: '2 Halves',
        description: 'Standard soccer match',
        periods: 2,
        periodName: 'Half',
        periodAbbr: 'H',
        hasOvertime: false,
        allowTie: true,
      },
      {
        id: 'four_quarters',
        name: '4 Quarters',
        description: 'Youth format with quarters',
        periods: 4,
        periodName: 'Quarter',
        periodAbbr: 'Q',
        hasOvertime: false,
        allowTie: true,
      },
    ],
  },
  baseball: {
    name: 'Baseball',
    icon: '⚾',
    type: 'periods',
    formats: [
      {
        id: 'six_innings',
        name: '6 Innings',
        description: 'Youth baseball (Little League)',
        periods: 6,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasOvertime: true,
        overtimeName: 'Extra',
      },
      {
        id: 'seven_innings',
        name: '7 Innings',
        description: 'Middle/High school',
        periods: 7,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasOvertime: true,
      },
    ],
  },
  softball: {
    name: 'Softball',
    icon: '🥎',
    type: 'periods',
    formats: [
      {
        id: 'five_innings',
        name: '5 Innings',
        description: 'Youth softball',
        periods: 5,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasOvertime: true,
      },
      {
        id: 'seven_innings',
        name: '7 Innings',
        description: 'Standard softball',
        periods: 7,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasOvertime: true,
      },
    ],
  },
  football: {
    name: 'Football',
    icon: '🏈',
    type: 'periods',
    formats: [
      {
        id: 'four_quarters',
        name: '4 Quarters',
        description: 'Standard game',
        periods: 4,
        periodName: 'Quarter',
        periodAbbr: 'Q',
        hasOvertime: true,
      },
    ],
  },
  hockey: {
    name: 'Hockey',
    icon: '🏒',
    type: 'periods',
    formats: [
      {
        id: 'three_periods',
        name: '3 Periods',
        description: 'Standard hockey game',
        periods: 3,
        periodName: 'Period',
        periodAbbr: 'P',
        hasOvertime: true,
      },
    ],
  },
}

// ============================================
// GAME COMPLETION MODAL WITH MULTI-SPORT SUPPORT
// ============================================
function GamePrepCompletionModal({ event, team, roster, sport = 'volleyball', onClose, onComplete, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { user } = useAuth()

  const sportConfig = SCORING_CONFIGS[sport] || SCORING_CONFIGS.volleyball
  const isSetBased = sportConfig.type === 'sets'

  const [step, setStep] = useState(1)
  const [selectedFormat, setSelectedFormat] = useState(sportConfig.formats[0])
  const [setScores, setSetScores] = useState([])
  const [periodScores, setPeriodScores] = useState([])
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)

  // Initialize scores when format changes
  useEffect(() => {
    if (isSetBased) {
      const initialSets = Array(selectedFormat.maxSets).fill(null).map(() => ({ our: 0, their: 0 }))
      setSetScores(initialSets)
    } else {
      const initialPeriods = Array(selectedFormat.periods).fill(null).map(() => ({ our: 0, their: 0 }))
      setPeriodScores(initialPeriods)
    }
  }, [selectedFormat, isSetBased])

  useEffect(() => {
    // Initialize attendance
    const initial = {}
    roster.forEach(p => { initial[p.id] = 'present' })
    setAttendance(initial)
  }, [roster])

  // Calculate match result for SET-BASED sports (volleyball)
  function calculateSetBasedResult() {
    if (selectedFormat.noMatchWinner) {
      const ourTotal = setScores.reduce((sum, s) => sum + (s.our || 0), 0)
      const theirTotal = setScores.reduce((sum, s) => sum + (s.their || 0), 0)
      return {
        result: 'none',
        ourSetsWon: 0,
        theirSetsWon: 0,
        ourTotalPoints: ourTotal,
        theirTotalPoints: theirTotal,
        pointDifferential: ourTotal - theirTotal,
      }
    }

    let ourSetsWon = 0
    let theirSetsWon = 0
    let ourTotalPoints = 0
    let theirTotalPoints = 0

    setScores.forEach((set, idx) => {
      const targetScore = selectedFormat.setScores[idx]
      const cap = selectedFormat.caps?.[idx]
      const ourScore = set.our || 0
      const theirScore = set.their || 0
      ourTotalPoints += ourScore
      theirTotalPoints += theirScore

      let complete = false
      if (ourScore >= targetScore || theirScore >= targetScore) {
        if (selectedFormat.winByTwo) {
          const diff = Math.abs(ourScore - theirScore)
          if (cap && (ourScore >= cap || theirScore >= cap)) {
            complete = diff >= 1
          } else {
            complete = diff >= 2
          }
        } else {
          complete = true
        }
      }

      if (complete) {
        if (ourScore > theirScore) ourSetsWon++
        else theirSetsWon++
      }
    })

    let result = 'in_progress'
    if (ourSetsWon >= selectedFormat.setsToWin) result = 'win'
    else if (theirSetsWon >= selectedFormat.setsToWin) result = 'loss'

    return {
      result,
      ourSetsWon,
      theirSetsWon,
      ourTotalPoints,
      theirTotalPoints,
      pointDifferential: ourTotalPoints - theirTotalPoints,
    }
  }

  // Calculate match result for PERIOD-BASED sports (basketball, soccer, etc.)
  function calculatePeriodBasedResult() {
    let ourTotal = 0
    let theirTotal = 0

    periodScores.forEach(p => {
      ourTotal += p.our || 0
      theirTotal += p.their || 0
    })

    let result = 'in_progress'
    if (ourTotal > theirTotal) result = 'win'
    else if (theirTotal > ourTotal) result = 'loss'
    else if (selectedFormat.allowTie && ourTotal === theirTotal && ourTotal > 0) result = 'tie'
    else if (ourTotal > 0 || theirTotal > 0) result = ourTotal === theirTotal ? 'tie' : 'in_progress'

    return {
      result,
      ourTotalPoints: ourTotal,
      theirTotalPoints: theirTotal,
      pointDifferential: ourTotal - theirTotal,
    }
  }

  const matchResult = isSetBased ? calculateSetBasedResult() : calculatePeriodBasedResult()

  // Determine how many sets to show
  function getSetsToShow() {
    if (!isSetBased) return 0
    const { ourSetsWon, theirSetsWon } = matchResult

    if (matchResult.result === 'win' || matchResult.result === 'loss') {
      return ourSetsWon + theirSetsWon
    }

    let setsPlayed = 0
    setScores.forEach((set, idx) => {
      if (set.our > 0 || set.their > 0) setsPlayed = idx + 1
    })
    return Math.min(Math.max(setsPlayed + 1, 2), selectedFormat.maxSets)
  }

  function updateSetScore(setIndex, team, value) {
    setSetScores(prev => {
      const updated = [...prev]
      updated[setIndex] = { ...updated[setIndex], [team]: value }
      return updated
    })
  }

  function updatePeriodScore(periodIndex, team, value) {
    setPeriodScores(prev => {
      const updated = [...prev]
      updated[periodIndex] = { ...updated[periodIndex], [team]: value }
      return updated
    })
  }

  function addOvertime() {
    setPeriodScores(prev => [...prev, { our: 0, their: 0 }])
  }

  function toggleAttendance(playerId) {
    const current = attendance[playerId] || 'present'
    const next = current === 'present' ? 'absent' : 'present'
    setAttendance({ ...attendance, [playerId]: next })
  }

  async function completeGame() {
    setSaving(true)

    try {
      const updateData = {
        game_status: 'completed',
        scoring_format: selectedFormat.id,
        our_score: matchResult.ourTotalPoints,
        opponent_score: matchResult.theirTotalPoints,
        point_differential: matchResult.pointDifferential,
        game_result: matchResult.result === 'win' ? 'win' :
                     matchResult.result === 'loss' ? 'loss' :
                     matchResult.result === 'tie' ? 'tie' : null,
        completed_at: new Date().toISOString(),
        completed_by: user?.id
      }

      if (isSetBased) {
        updateData.set_scores = setScores
        updateData.our_sets_won = matchResult.ourSetsWon
        updateData.opponent_sets_won = matchResult.theirSetsWon
      } else {
        updateData.period_scores = periodScores
      }

      await supabase
        .from('schedule_events')
        .update(updateData)
        .eq('id', event.id)

      // Save attendance
      await supabase.from('event_attendance').delete().eq('event_id', event.id)

      const attendanceRecords = Object.entries(attendance).map(([playerId, status]) => ({
        event_id: event.id,
        player_id: playerId,
        status,
        recorded_by: user?.id
      }))

      if (attendanceRecords.length > 0) {
        await supabase.from('event_attendance').insert(attendanceRecords)
      }

      const message = matchResult.result === 'win' ? '🏆 Victory!' : 'Game completed'
      showToast?.(message, 'success')
      onComplete?.()
      onClose()

    } catch (err) {
      console.error('Error completing game:', err)
      showToast?.('Error completing game', 'error')
    }

    setSaving(false)
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const canComplete = matchResult.result === 'win' || matchResult.result === 'loss' ||
                      matchResult.result === 'tie' || selectedFormat.noMatchWinner

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} text-center`}>
          <span className="text-4xl">{sportConfig.icon}</span>
          <h2 className={`text-xl font-bold mt-2 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Complete Game</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{team?.name} vs {event.opponent_name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step indicator */}
          <div className="flex gap-2">
            {['Format', 'Score', 'Attendance', 'Confirm'].map((label, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition ${
                  step === idx + 1
                    ? 'bg-lynx-sky text-white'
                    : step > idx + 1
                    ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-lynx-graphite text-slate-400' : 'bg-lynx-frost text-lynx-slate'
                }`}
              >
                {step > idx + 1 ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>

          {/* Step 1: Format Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Select Scoring Format for {sportConfig.name}</h3>
              <div className="space-y-2">
                {sportConfig.formats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format)}
                    className={`w-full p-4 rounded-xl text-left transition border-2 ${
                      selectedFormat.id === format.id
                        ? isDark ? 'border-lynx-sky bg-lynx-sky/10' : 'border-lynx-sky bg-lynx-ice'
                        : isDark ? 'border-lynx-border-dark hover:border-slate-500' : 'border-lynx-silver hover:border-slate-300'
                    }`}
                  >
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{format.name}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{format.description}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Sets to {format.setScores.slice(0, -1).join(', ')}, deciding set to {format.setScores[format.setScores.length - 1]}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Scores */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Match status */}
              <div className={`p-4 rounded-xl text-center ${
                matchResult.result === 'win' ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' :
                matchResult.result === 'loss' ? isDark ? 'bg-red-500/10' : 'bg-red-50' :
                matchResult.result === 'tie' ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' :
                isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'
              }`}>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className={`text-xs mb-1 truncate max-w-[100px] ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{team?.name || 'Us'}</p>
                    <p className="text-4xl font-bold text-lynx-sky">
                      {isSetBased ? matchResult.ourSetsWon : matchResult.ourTotalPoints}
                    </p>
                    {isSetBased && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{matchResult.ourTotalPoints} pts</p>
                    )}
                  </div>

                  <div className="text-center">
                    {matchResult.result === 'win' && <span className="text-emerald-500 font-bold">VICTORY!</span>}
                    {matchResult.result === 'loss' && <span className="text-red-500 font-medium">Defeat</span>}
                    {matchResult.result === 'tie' && <span className="text-amber-500 font-medium">Tie Game</span>}
                    {matchResult.result === 'in_progress' && <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>In Progress</span>}
                  </div>

                  <div className="text-center">
                    <p className={`text-xs mb-1 truncate max-w-[100px] ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{event.opponent_name || 'Opponent'}</p>
                    <p className="text-4xl font-bold text-red-500">
                      {isSetBased ? matchResult.theirSetsWon : matchResult.theirTotalPoints}
                    </p>
                    {isSetBased && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{matchResult.theirTotalPoints} pts</p>
                    )}
                  </div>
                </div>

                <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                  Point Differential: <span className={`font-semibold ${
                    matchResult.pointDifferential > 0 ? 'text-emerald-500' :
                    matchResult.pointDifferential < 0 ? 'text-red-500' : ''
                  }`}>
                    {matchResult.pointDifferential > 0 ? '+' : ''}{matchResult.pointDifferential}
                  </span>
                </p>
              </div>

              {/* SET-BASED scoring (Volleyball) */}
              {isSetBased && (
                <div className="space-y-4">
                  {/* Set Summary - clean display */}
                  {setScores.some(s => s.our > 0 || s.their > 0) && (
                    <div className={`${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'} rounded-xl p-3`}>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                          if (set.our === 0 && set.their === 0) return null
                          const ourWon = set.our > set.their
                          return (
                            <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${isDark ? 'bg-lynx-charcoal' : 'bg-white'}`}>
                              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-lynx-slate'}`}>Set {idx + 1}:</span>
                              <span className={`font-bold ${ourWon ? 'text-emerald-500' : 'text-red-500'}`}>
                                {set.our} - {set.their}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                    const isDecidingSet = idx === selectedFormat.maxSets - 1
                    return (
                      <SetScoreInput
                        key={idx}
                        setNumber={idx + 1}
                        ourScore={set.our || 0}
                        theirScore={set.their || 0}
                        targetScore={selectedFormat.setScores[idx]}
                        cap={selectedFormat.caps?.[idx]}
                        winByTwo={selectedFormat.winByTwo}
                        isDecidingSet={isDecidingSet}
                        ourTeamName={team?.name}
                        theirTeamName={event.opponent_name}
                        onOurScoreChange={(val) => updateSetScore(idx, 'our', val)}
                        onTheirScoreChange={(val) => updateSetScore(idx, 'their', val)}
                      />
                    )
                  })}
                </div>
              )}

              {/* PERIOD-BASED scoring (Basketball, Soccer, etc.) */}
              {!isSetBased && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-2 px-2">
                    <div className="w-12" />
                    <div className="flex-1 text-center text-sm font-medium text-lynx-sky">{team?.name || 'Us'}</div>
                    <div className="flex-1 text-center text-sm font-medium text-red-500">{event.opponent_name || 'Opponent'}</div>
                  </div>

                  <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    {periodScores.map((period, idx) => (
                      <PeriodScoreInput
                        key={idx}
                        periodNumber={idx + 1}
                        periodAbbr={selectedFormat.periodAbbr}
                        ourScore={period.our}
                        theirScore={period.their}
                        onOurScoreChange={(val) => updatePeriodScore(idx, 'our', val)}
                        onTheirScoreChange={(val) => updatePeriodScore(idx, 'their', val)}
                        isOvertime={idx >= selectedFormat.periods}
                      />
                    ))}
                  </div>

                  {/* Add overtime */}
                  {selectedFormat.hasOvertime && matchResult.ourTotalPoints === matchResult.theirTotalPoints && matchResult.ourTotalPoints > 0 && (
                    <button
                      onClick={addOvertime}
                      className="w-full py-2 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:bg-amber-50 transition text-sm font-medium"
                    >
                      + Add {selectedFormat.overtimeName || 'Overtime'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Attendance */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Mark Attendance ({presentCount} present)</h3>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {roster.map(player => {
                  const isPresent = attendance[player.id] === 'present'
                  return (
                    <div
                      key={player.id}
                      onClick={() => toggleAttendance(player.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border-2 ${
                        isPresent
                          ? isDark ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
                          : isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        isPresent ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        {isPresent ? '✓' : '✗'}
                      </span>
                      <span className={isDark ? 'text-white' : 'text-lynx-navy'}>
                        #{player.jersey_number} {player.first_name} {player.last_name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Confirm & Complete</h3>

              {/* Summary */}
              <div className={`${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'} rounded-xl p-4 space-y-3`}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Sport</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{sportConfig.icon} {sportConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Format</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{selectedFormat.name}</span>
                </div>
                {isSetBased && (
                  <>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Final Score (sets)</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{matchResult.ourSetsWon} - {matchResult.theirSetsWon}</span>
                    </div>
                    {/* Set-by-set breakdown */}
                    <div className={`pt-2 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`}>
                      <span className={`text-xs block mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Set Breakdown:</span>
                      <div className="space-y-1">
                        {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                          if (set.our === 0 && set.their === 0) return null
                          const ourWon = set.our > set.their
                          return (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Set {idx + 1}</span>
                              <span className={`font-semibold ${ourWon ? 'text-emerald-500' : 'text-red-500'}`}>
                                {set.our} - {set.their}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>{isSetBased ? 'Total Points' : 'Final Score'}</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{matchResult.ourTotalPoints} - {matchResult.theirTotalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Point Differential</span>
                  <span className={`font-semibold ${
                    matchResult.pointDifferential > 0 ? 'text-emerald-500' :
                    matchResult.pointDifferential < 0 ? 'text-red-500' : isDark ? 'text-white' : 'text-lynx-navy'
                  }`}>
                    {matchResult.pointDifferential > 0 ? '+' : ''}{matchResult.pointDifferential}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Result</span>
                  <span className={`font-bold ${
                    matchResult.result === 'win' ? 'text-emerald-500' :
                    matchResult.result === 'loss' ? 'text-red-500' :
                    matchResult.result === 'tie' ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-lynx-slate'
                  }`}>
                    {matchResult.result === 'win' ? 'VICTORY' :
                     matchResult.result === 'loss' ? 'DEFEAT' :
                     matchResult.result === 'tie' ? 'TIE' :
                     matchResult.result === 'none' ? 'No Winner' : 'IN PROGRESS'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Attendance</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{presentCount} / {roster.length}</span>
                </div>
              </div>

              {!canComplete && (
                <div className={`${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'} border rounded-xl p-4 text-sm`}>
                  Game must have a winner (or tie if allowed) before completing. Go back to enter scores.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex justify-between`}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className={`px-6 py-2.5 rounded-[10px] font-medium transition ${
              isDark ? 'bg-lynx-graphite text-slate-300 hover:bg-white/10' : 'bg-lynx-frost text-lynx-slate hover:bg-slate-200'
            }`}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white font-semibold transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={completeGame}
              disabled={saving || !canComplete}
              className="px-6 py-2.5 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Complete Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GamePrepCompletionModal
