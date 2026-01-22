import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// ============================================
// INLINE ICONS
// ============================================
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const TrophyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

const AlertIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

// ============================================
// SPORT SCORING CONFIGURATIONS
// ============================================
const SCORING_CONFIGS = {
  volleyball: {
    name: 'Volleyball',
    icon: '🏐',
    formats: [
      {
        id: 'best_of_3',
        name: 'Best of 3 Sets',
        description: 'Youth/Recreational - First to win 2 sets',
        setsToWin: 2,
        maxSets: 3,
        setScores: [25, 25, 15], // Points needed for each set
        winByTwo: true,
        caps: [30, 30, 20], // Max points (cap) for each set, null = no cap
      },
      {
        id: 'best_of_5',
        name: 'Best of 5 Sets',
        description: 'Competitive/High School - First to win 3 sets',
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
        setsToWin: null, // No match winner
        maxSets: 2,
        setScores: [25, 25],
        winByTwo: true,
        caps: [30, 30],
        noMatchWinner: true,
      },
      {
        id: 'rally_scoring',
        name: 'Rally to 21',
        description: 'Quick format - Sets to 21',
        setsToWin: 2,
        maxSets: 3,
        setScores: [21, 21, 15],
        winByTwo: true,
        caps: [25, 25, 20],
      },
    ],
  },
  basketball: {
    name: 'Basketball',
    icon: '🏀',
    formats: [
      {
        id: 'four_quarters',
        name: '4 Quarters',
        description: 'Standard game with 4 quarters',
        periods: 4,
        periodName: 'Quarter',
        periodAbbr: 'Q',
        hasOvertime: true,
        overtimeName: 'OT',
      },
      {
        id: 'two_halves',
        name: '2 Halves',
        description: 'College/simplified format',
        periods: 2,
        periodName: 'Half',
        periodAbbr: 'H',
        hasOvertime: true,
        overtimeName: 'OT',
      },
    ],
  },
  soccer: {
    name: 'Soccer',
    icon: '⚽',
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
    formats: [
      {
        id: 'six_innings',
        name: '6 Innings',
        description: 'Youth baseball (Little League)',
        periods: 6,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasExtras: true,
        extrasName: 'Extra Innings',
      },
      {
        id: 'seven_innings',
        name: '7 Innings',
        description: 'Middle/High school',
        periods: 7,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasExtras: true,
        extrasName: 'Extra Innings',
      },
      {
        id: 'nine_innings',
        name: '9 Innings',
        description: 'Standard baseball',
        periods: 9,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasExtras: true,
        extrasName: 'Extra Innings',
      },
    ],
  },
  softball: {
    name: 'Softball',
    icon: '🥎',
    formats: [
      {
        id: 'five_innings',
        name: '5 Innings',
        description: 'Youth softball',
        periods: 5,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasExtras: true,
      },
      {
        id: 'seven_innings',
        name: '7 Innings',
        description: 'Standard softball',
        periods: 7,
        periodName: 'Inning',
        periodAbbr: 'Inn',
        hasExtras: true,
      },
    ],
  },
  football: {
    name: 'Football',
    icon: '🏈',
    formats: [
      {
        id: 'four_quarters',
        name: '4 Quarters',
        description: 'Standard game',
        periods: 4,
        periodName: 'Quarter',
        periodAbbr: 'Q',
        hasOvertime: true,
        overtimeName: 'OT',
      },
    ],
  },
  hockey: {
    name: 'Hockey',
    icon: '🏒',
    formats: [
      {
        id: 'three_periods',
        name: '3 Periods',
        description: 'Standard hockey game',
        periods: 3,
        periodName: 'Period',
        periodAbbr: 'P',
        hasOvertime: true,
        overtimeName: 'OT',
      },
    ],
  },
}

// ============================================
// SET SCORE INPUT (Volleyball)
// ============================================
function SetScoreInput({ setNumber, ourScore, theirScore, targetScore, cap, winByTwo, onOurScoreChange, onTheirScoreChange, isDecidingSet, isComplete }) {
  const ourWon = isSetComplete(ourScore, theirScore, targetScore, cap, winByTwo) && ourScore > theirScore
  const theyWon = isSetComplete(ourScore, theirScore, targetScore, cap, winByTwo) && theirScore > ourScore
  
  return (
    <div className={`p-4 rounded-2xl border-2 transition ${
      ourWon ? 'bg-emerald-50 border-emerald-300' :
      theyWon ? 'bg-red-50 border-red-300' :
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isDecidingSet ? 'text-amber-600' : 'text-slate-700'}`}>
            Set {setNumber}
          </span>
          {isDecidingSet && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              Deciding Set
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          First to {targetScore} {winByTwo ? '(win by 2)' : ''} {cap ? `• Cap: ${cap}` : ''}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Our score */}
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block">Us</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOurScoreChange(Math.max(0, ourScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
            >
              -
            </button>
            <input
              type="number"
              value={ourScore}
              onChange={(e) => onOurScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-20 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${
                ourWon ? 'border-emerald-400 bg-emerald-100 text-emerald-700' : 'border-slate-200 focus:border-indigo-400'
              }`}
              min="0"
            />
            <button
              onClick={() => onOurScoreChange(ourScore + 1)}
              className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="text-2xl text-slate-300 font-bold">vs</div>
        
        {/* Their score */}
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block text-right">Them</label>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => onTheirScoreChange(Math.max(0, theirScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
            >
              -
            </button>
            <input
              type="number"
              value={theirScore}
              onChange={(e) => onTheirScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-20 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${
                theyWon ? 'border-red-400 bg-red-100 text-red-700' : 'border-slate-200 focus:border-indigo-400'
              }`}
              min="0"
            />
            <button
              onClick={() => onTheirScoreChange(theirScore + 1)}
              className="w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition"
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* Set winner indicator */}
      {(ourWon || theyWon) && (
        <div className={`mt-3 text-center text-sm font-medium ${ourWon ? 'text-emerald-600' : 'text-red-600'}`}>
          <CheckIcon className="w-4 h-4 inline mr-1" />
          {ourWon ? 'We won this set!' : 'They won this set'}
        </div>
      )}
    </div>
  )
}

// ============================================
// PERIOD SCORE INPUT (Basketball, Soccer, etc.)
// ============================================
function PeriodScoreInput({ periodNumber, periodName, periodAbbr, ourScore, theirScore, onOurScoreChange, onTheirScoreChange, isOvertime }) {
  return (
    <div className={`p-3 rounded-xl border ${isOvertime ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
      <div className="text-center mb-2">
        <span className={`text-sm font-semibold ${isOvertime ? 'text-amber-700' : 'text-slate-600'}`}>
          {isOvertime ? 'OT' : `${periodAbbr}${periodNumber}`}
        </span>
      </div>
      
      <div className="space-y-2">
        <input
          type="number"
          value={ourScore}
          onChange={(e) => onOurScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-10 text-center text-lg font-bold rounded-lg border-2 border-indigo-200 bg-indigo-50 text-indigo-700 focus:outline-none focus:border-indigo-400"
          min="0"
          placeholder="Us"
        />
        <input
          type="number"
          value={theirScore}
          onChange={(e) => onTheirScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-10 text-center text-lg font-bold rounded-lg border-2 border-red-200 bg-red-50 text-red-700 focus:outline-none focus:border-red-400"
          min="0"
          placeholder="Them"
        />
      </div>
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function isSetComplete(ourScore, theirScore, targetScore, cap, winByTwo) {
  if (ourScore < targetScore && theirScore < targetScore) return false
  
  if (winByTwo) {
    const diff = Math.abs(ourScore - theirScore)
    if (cap && (ourScore >= cap || theirScore >= cap)) {
      return diff >= 1 // At cap, just need to be ahead
    }
    return diff >= 2 && (ourScore >= targetScore || theirScore >= targetScore)
  }
  
  return ourScore >= targetScore || theirScore >= targetScore
}

function getSetWinner(ourScore, theirScore, targetScore, cap, winByTwo) {
  if (!isSetComplete(ourScore, theirScore, targetScore, cap, winByTwo)) return null
  return ourScore > theirScore ? 'us' : 'them'
}

function calculateMatchResult(setScores, format) {
  if (format.noMatchWinner) {
    // For formats with no winner, just calculate totals
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
    const targetScore = format.setScores[idx]
    const cap = format.caps?.[idx]
    const winner = getSetWinner(set.our || 0, set.their || 0, targetScore, cap, format.winByTwo)
    
    if (winner === 'us') ourSetsWon++
    if (winner === 'them') theirSetsWon++
    
    ourTotalPoints += set.our || 0
    theirTotalPoints += set.their || 0
  })
  
  let result = 'in_progress'
  if (ourSetsWon >= format.setsToWin) result = 'win'
  else if (theirSetsWon >= format.setsToWin) result = 'loss'
  
  return {
    result,
    ourSetsWon,
    theirSetsWon,
    ourTotalPoints,
    theirTotalPoints,
    pointDifferential: ourTotalPoints - theirTotalPoints,
  }
}

function calculatePeriodResult(periodScores, format) {
  let ourTotal = 0
  let theirTotal = 0
  
  periodScores.forEach(p => {
    ourTotal += p.our || 0
    theirTotal += p.their || 0
  })
  
  let result = 'in_progress'
  if (ourTotal > theirTotal) result = 'win'
  else if (theirTotal > ourTotal) result = 'loss'
  else if (format.allowTie) result = 'tie'
  
  return {
    result,
    ourTotalPoints: ourTotal,
    theirTotalPoints: theirTotal,
    pointDifferential: ourTotal - theirTotal,
  }
}

// ============================================
// MAIN GAME SCORING MODAL
// ============================================
function GameScoringModal({ event, team, sport = 'volleyball', onClose, onSave, showToast }) {
  const sportConfig = SCORING_CONFIGS[sport] || SCORING_CONFIGS.volleyball
  const isSetBasedSport = sport === 'volleyball'
  
  const [selectedFormat, setSelectedFormat] = useState(sportConfig.formats[0])
  const [setScores, setSetScores] = useState([]) // For volleyball: [{our: 0, their: 0}, ...]
  const [periodScores, setPeriodScores] = useState([]) // For other sports
  const [hasOvertime, setHasOvertime] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Initialize scores based on format
  useEffect(() => {
    loadExistingScores()
  }, [event.id])
  
  useEffect(() => {
    if (isSetBasedSport) {
      // Initialize set scores
      const initialSets = Array(selectedFormat.maxSets).fill(null).map(() => ({ our: 0, their: 0 }))
      setSetScores(initialSets)
    } else {
      // Initialize period scores
      const initialPeriods = Array(selectedFormat.periods).fill(null).map(() => ({ our: 0, their: 0 }))
      setPeriodScores(initialPeriods)
    }
  }, [selectedFormat])
  
  async function loadExistingScores() {
    setLoading(true)
    
    try {
      const { data } = await supabase
        .from('schedule_events')
        .select('our_score, opponent_score, set_scores, period_scores, scoring_format')
        .eq('id', event.id)
        .single()
      
      if (data) {
        // Find matching format
        if (data.scoring_format) {
          const format = sportConfig.formats.find(f => f.id === data.scoring_format)
          if (format) setSelectedFormat(format)
        }
        
        // Load set scores
        if (data.set_scores && Array.isArray(data.set_scores)) {
          setSetScores(data.set_scores)
        }
        
        // Load period scores
        if (data.period_scores && Array.isArray(data.period_scores)) {
          setPeriodScores(data.period_scores)
          if (data.period_scores.length > selectedFormat.periods) {
            setHasOvertime(true)
          }
        }
      }
    } catch (err) {
      console.error('Error loading scores:', err)
    }
    
    setLoading(false)
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
    setHasOvertime(true)
  }
  
  // Calculate current match status
  const matchResult = isSetBasedSport 
    ? calculateMatchResult(setScores, selectedFormat)
    : calculatePeriodResult(periodScores, selectedFormat)
  
  // Determine how many sets to show (volleyball)
  function getSetsToShow() {
    if (!isSetBasedSport) return 0
    
    const { ourSetsWon, theirSetsWon } = matchResult
    
    // Always show at least 2 sets
    let setsNeeded = 2
    
    // If match is decided, show only played sets
    if (matchResult.result === 'win' || matchResult.result === 'loss') {
      setsNeeded = ourSetsWon + theirSetsWon
    } else {
      // Show sets based on what's been played + 1
      let setsPlayed = 0
      setScores.forEach((set, idx) => {
        if (set.our > 0 || set.their > 0) setsPlayed = idx + 1
      })
      setsNeeded = Math.min(Math.max(setsPlayed + 1, 2), selectedFormat.maxSets)
    }
    
    return setsNeeded
  }
  
  async function handleSave(markComplete = false) {
    setSaving(true)
    
    try {
      const updateData = {
        scoring_format: selectedFormat.id,
        our_score: matchResult.ourTotalPoints,
        opponent_score: matchResult.theirTotalPoints,
        point_differential: matchResult.pointDifferential,
      }
      
      if (isSetBasedSport) {
        updateData.set_scores = setScores
        updateData.our_sets_won = matchResult.ourSetsWon
        updateData.opponent_sets_won = matchResult.theirSetsWon
      } else {
        updateData.period_scores = periodScores
      }
      
      if (markComplete) {
        updateData.game_result = matchResult.result === 'win' ? 'win' : 
                                  matchResult.result === 'loss' ? 'loss' : 
                                  matchResult.result === 'tie' ? 'tie' : null
        updateData.game_status = 'completed'
      }
      
      const { error } = await supabase
        .from('schedule_events')
        .update(updateData)
        .eq('id', event.id)
      
      if (error) throw error
      
      showToast?.(markComplete ? 'Game completed!' : 'Scores saved!', 'success')
      onSave?.()
      if (markComplete) onClose()
      
    } catch (err) {
      console.error('Error saving:', err)
      showToast?.('Error saving scores', 'error')
    }
    
    setSaving(false)
  }
  
  const canComplete = matchResult.result === 'win' || matchResult.result === 'loss' || 
                      matchResult.result === 'tie' || selectedFormat.noMatchWinner

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{sportConfig.icon}</span>
              <div>
                <h2 className="text-xl font-bold">Game Scoring</h2>
                <p className="text-white/70 text-sm">
                  {team.name} vs {event.opponent_name || 'TBD'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Format selector */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Scoring Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {sportConfig.formats.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format)}
                      className={`p-3 rounded-xl text-left transition border-2 ${
                        selectedFormat.id === format.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-slate-800">{format.name}</p>
                      <p className="text-xs text-slate-500">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Match status */}
              <div className={`p-4 rounded-2xl text-center ${
                matchResult.result === 'win' ? 'bg-emerald-100' :
                matchResult.result === 'loss' ? 'bg-red-100' :
                matchResult.result === 'tie' ? 'bg-amber-100' :
                'bg-slate-100'
              }`}>
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Us</p>
                    <p className="text-4xl font-bold text-indigo-600">
                      {isSetBasedSport ? matchResult.ourSetsWon : matchResult.ourTotalPoints}
                    </p>
                    {isSetBasedSport && (
                      <p className="text-xs text-slate-500 mt-1">{matchResult.ourTotalPoints} pts</p>
                    )}
                  </div>
                  
                  <div className="text-center">
                    {matchResult.result === 'win' && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <TrophyIcon className="w-6 h-6" />
                        <span className="font-bold">VICTORY!</span>
                      </div>
                    )}
                    {matchResult.result === 'loss' && (
                      <span className="text-red-600 font-medium">Defeat</span>
                    )}
                    {matchResult.result === 'tie' && (
                      <span className="text-amber-600 font-medium">Tie Game</span>
                    )}
                    {matchResult.result === 'in_progress' && (
                      <span className="text-slate-500 text-sm">In Progress</span>
                    )}
                    {matchResult.result === 'none' && (
                      <span className="text-slate-500 text-sm">No Winner</span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Them</p>
                    <p className="text-4xl font-bold text-red-600">
                      {isSetBasedSport ? matchResult.theirSetsWon : matchResult.theirTotalPoints}
                    </p>
                    {isSetBasedSport && (
                      <p className="text-xs text-slate-500 mt-1">{matchResult.theirTotalPoints} pts</p>
                    )}
                  </div>
                </div>
                
                {/* Point differential */}
                <div className="mt-2 text-sm">
                  <span className="text-slate-500">Point Differential: </span>
                  <span className={`font-semibold ${
                    matchResult.pointDifferential > 0 ? 'text-emerald-600' :
                    matchResult.pointDifferential < 0 ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {matchResult.pointDifferential > 0 ? '+' : ''}{matchResult.pointDifferential}
                  </span>
                </div>
              </div>
              
              {/* Set scores (Volleyball) */}
              {isSetBasedSport && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Set Scores</h3>
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
                        onOurScoreChange={(val) => updateSetScore(idx, 'our', val)}
                        onTheirScoreChange={(val) => updateSetScore(idx, 'their', val)}
                      />
                    )
                  })}
                </div>
              )}
              
              {/* Period scores (Other sports) */}
              {!isSetBasedSport && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">
                    {selectedFormat.periodName} Scores
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    {/* Team labels */}
                    <div className="flex flex-col justify-end pb-2">
                      <span className="text-xs text-indigo-600 font-medium">Us</span>
                      <span className="text-xs text-red-600 font-medium mt-4">Them</span>
                    </div>
                    
                    {/* Period inputs */}
                    {periodScores.map((period, idx) => (
                      <PeriodScoreInput
                        key={idx}
                        periodNumber={idx + 1}
                        periodName={selectedFormat.periodName}
                        periodAbbr={selectedFormat.periodAbbr}
                        ourScore={period.our || 0}
                        theirScore={period.their || 0}
                        onOurScoreChange={(val) => updatePeriodScore(idx, 'our', val)}
                        onTheirScoreChange={(val) => updatePeriodScore(idx, 'their', val)}
                        isOvertime={idx >= selectedFormat.periods}
                      />
                    ))}
                  </div>
                  
                  {/* Add overtime */}
                  {selectedFormat.hasOvertime && matchResult.ourTotalPoints === matchResult.theirTotalPoints && (
                    <button
                      onClick={addOvertime}
                      className="w-full py-2 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:bg-amber-50 transition text-sm font-medium"
                    >
                      + Add Overtime
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition disabled:opacity-50"
              >
                Save Draft
              </button>
              
              <button
                onClick={() => handleSave(true)}
                disabled={saving || !canComplete}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <CheckIcon className="w-4 h-4" />
                {saving ? 'Saving...' : 'Complete Game'}
              </button>
            </div>
          </div>
          
          {!canComplete && !selectedFormat.noMatchWinner && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertIcon className="w-3 h-3" />
              Match must have a winner before completing (or save as draft)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export { GameScoringModal, SCORING_CONFIGS }
