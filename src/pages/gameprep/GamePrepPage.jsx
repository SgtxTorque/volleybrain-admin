import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, Users, MapPin, Clock, Check, X, ChevronRight, ChevronLeft,
  BarChart3, Star, Trophy, ClipboardList, Edit, Eye, EyeOff
} from '../../constants/icons'
import { getSportConfig, GameStatsModal } from '../../components/games/GameComponents'
import { AdvancedLineupBuilder } from '../../components/games/AdvancedLineupBuilder'
import { GameDetailModal } from '../../components/games/GameDetailModal'

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
function GameCard({ game, team, status, isSelected, onClick, onPrepClick, onCompleteClick }) {
  const tc = useThemeClasses()
  const gameDate = new Date(game.event_date)
  const today = isToday(game.event_date)
  const tomorrow = isTomorrow(game.event_date)
  const isCompleted = game.game_status === 'completed'
  const isPast = gameDate < new Date() && !today
  
  return (
    <div 
      className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
        isSelected 
          ? 'border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20' 
          : `${tc.border} hover:border-slate-500`
      } ${tc.cardBg}`}
      onClick={onClick}
    >
      {/* Top color bar */}
      <div 
        className="h-1.5"
        style={{ backgroundColor: team?.color || 'var(--accent-primary)' }}
      />
      
      <div className="p-4">
        {/* Date badges */}
        <div className="flex items-center gap-2 mb-3">
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
        </div>
        
        {/* Opponent */}
        <h3 className={`text-lg font-bold ${tc.text} mb-1`}>
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
                  game.game_result === 'loss' ? 'text-red-400' : tc.text
                }`}>
                  {game.our_sets_won} - {game.opponent_sets_won}
                </p>
                <p className={`text-sm ${tc.textMuted}`}>
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
                game.game_result === 'loss' ? 'text-red-400' : tc.text
              }`}>
                {game.our_score} - {game.opponent_score}
              </p>
            )}
          </div>
        )}
        
        {/* Details */}
        <div className={`flex flex-wrap gap-3 text-sm ${tc.textMuted} mb-4`}>
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
        
        {/* Status & Action */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
            {status.icon} {status.label}
          </span>
          
          {!isCompleted && (
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
              {isPast ? '✓ Complete Game' : status.hasLineup ? 'Edit Lineup →' : 'Set Lineup →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
// ============================================
// GAME COMPLETION MODAL
// ============================================
// ============================================
// VOLLEYBALL SET SCORE INPUT
// ============================================
function SetScoreInput({ setNumber, ourScore, theirScore, targetScore, cap, winByTwo, onOurScoreChange, onTheirScoreChange, isDecidingSet, ourTeamName, theirTeamName }) {
  // Local state for controlled inputs
  const [ourInput, setOurInput] = useState(ourScore > 0 ? String(ourScore) : '')
  const [theirInput, setTheirInput] = useState(theirScore > 0 ? String(theirScore) : '')
  
  // Sync with props when they change externally (like +/- buttons)
  useEffect(() => {
    setOurInput(ourScore > 0 ? String(ourScore) : '')
  }, [ourScore])
  
  useEffect(() => {
    setTheirInput(theirScore > 0 ? String(theirScore) : '')
  }, [theirScore])
  
  // Check if set is complete
  function isSetComplete() {
    if (ourScore < targetScore && theirScore < targetScore) return false
    
    if (winByTwo) {
      const diff = Math.abs(ourScore - theirScore)
      if (cap && (ourScore >= cap || theirScore >= cap)) {
        return diff >= 1
      }
      return diff >= 2 && (ourScore >= targetScore || theirScore >= targetScore)
    }
    
    return ourScore >= targetScore || theirScore >= targetScore
  }
  
  const complete = isSetComplete()
  const ourWon = complete && ourScore > theirScore
  const theyWon = complete && theirScore > ourScore
  
  function handleOurInputChange(e) {
    const val = e.target.value.replace(/\D/g, '')
    setOurInput(val)
    onOurScoreChange(val === '' ? 0 : parseInt(val, 10))
  }
  
  function handleTheirInputChange(e) {
    const val = e.target.value.replace(/\D/g, '')
    setTheirInput(val)
    onTheirScoreChange(val === '' ? 0 : parseInt(val, 10))
  }
  
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
              Deciding
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
          <label className="text-xs text-slate-600 font-medium mb-1 block truncate">{ourTeamName || 'Us'}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOurScoreChange(Math.max(0, ourScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={ourInput}
              onChange={handleOurInputChange}
              onBlur={() => setOurInput(ourScore > 0 ? String(ourScore) : '')}
              placeholder="0"
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${
                ourWon ? 'border-emerald-400 bg-emerald-100 text-emerald-700' : 'border-slate-200 focus:border-indigo-400'
              }`}
            />
            <button
              type="button"
              onClick={() => onOurScoreChange(ourScore + 1)}
              className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="text-2xl text-slate-300 font-bold">-</div>
        
        {/* Their score */}
        <div className="flex-1">
          <label className="text-xs text-slate-600 font-medium mb-1 block text-right truncate">{theirTeamName || 'Opponent'}</label>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onTheirScoreChange(Math.max(0, theirScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={theirInput}
              onChange={handleTheirInputChange}
              onBlur={() => setTheirInput(theirScore > 0 ? String(theirScore) : '')}
              placeholder="0"
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none ${
                theyWon ? 'border-red-400 bg-red-100 text-red-700' : 'border-slate-200 focus:border-indigo-400'
              }`}
            />
            <button
              type="button"
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
          ✓ {ourWon ? `${ourTeamName || 'We'} won this set!` : `${theirTeamName || 'They'} won this set`}
        </div>
      )}
    </div>
  )
}

// ============================================
// PERIOD SCORE INPUT (Basketball, Soccer, etc.)
// ============================================
function PeriodScoreInput({ periodNumber, periodAbbr, ourScore, theirScore, onOurScoreChange, onTheirScoreChange, isOvertime }) {
  return (
    <div className={`p-3 rounded-xl border-2 ${isOvertime ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
      <div className="text-center mb-2">
        <span className={`text-sm font-semibold ${isOvertime ? 'text-amber-700' : 'text-slate-600'}`}>
          {isOvertime ? 'OT' : `${periodAbbr}${periodNumber}`}
        </span>
      </div>
      
      <div className="space-y-2">
        <input
          type="number"
          value={ourScore || ''}
          onChange={(e) => onOurScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-10 text-center text-lg font-bold rounded-lg border-2 border-indigo-200 bg-indigo-50 text-indigo-700 focus:outline-none focus:border-indigo-400"
          min="0"
          placeholder="0"
        />
        <input
          type="number"
          value={theirScore || ''}
          onChange={(e) => onTheirScoreChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full h-10 text-center text-lg font-bold rounded-lg border-2 border-red-200 bg-red-50 text-red-700 focus:outline-none focus:border-red-400"
          min="0"
          placeholder="0"
        />
      </div>
    </div>
  )
}

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
function GameCompletionModal({ event, team, roster, sport = 'volleyball', onClose, onComplete, showToast }) {
  const tc = useThemeClasses()
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-6 text-center ${
          matchResult.result === 'win' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
          matchResult.result === 'loss' ? 'bg-gradient-to-r from-red-500 to-red-600' :
          matchResult.result === 'tie' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
          'bg-gradient-to-r from-indigo-500 to-purple-600'
        } text-white`}>
          <span className="text-4xl">{sportConfig.icon}</span>
          <h2 className="text-xl font-bold mt-2">Complete Game</h2>
          <p className="text-white/80">{team?.name} vs {event.opponent_name}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step indicator */}
          <div className="flex gap-2">
            {['Format', 'Score', 'Attendance', 'Confirm'].map((label, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx + 1)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  step === idx + 1 
                    ? 'bg-indigo-500 text-white' 
                    : step > idx + 1 
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > idx + 1 ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>
          
          {/* Step 1: Format Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Select Scoring Format for {sportConfig.name}</h3>
              <div className="space-y-2">
                {sportConfig.formats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format)}
                    className={`w-full p-4 rounded-xl text-left transition border-2 ${
                      selectedFormat.id === format.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-800">{format.name}</p>
                    <p className="text-sm text-slate-500">{format.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
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
              <div className={`p-4 rounded-2xl text-center ${
                matchResult.result === 'win' ? 'bg-emerald-100' :
                matchResult.result === 'loss' ? 'bg-red-100' :
                matchResult.result === 'tie' ? 'bg-amber-100' :
                'bg-slate-100'
              }`}>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1 truncate max-w-[100px]">{team?.name || 'Us'}</p>
                    <p className="text-4xl font-bold text-indigo-600">
                      {isSetBased ? matchResult.ourSetsWon : matchResult.ourTotalPoints}
                    </p>
                    {isSetBased && (
                      <p className="text-xs text-slate-500 mt-1">{matchResult.ourTotalPoints} pts</p>
                    )}
                  </div>
                  
                  <div className="text-center">
                    {matchResult.result === 'win' && <span className="text-emerald-600 font-bold">🏆 VICTORY!</span>}
                    {matchResult.result === 'loss' && <span className="text-red-600 font-medium">Defeat</span>}
                    {matchResult.result === 'tie' && <span className="text-amber-600 font-medium">Tie Game</span>}
                    {matchResult.result === 'in_progress' && <span className="text-slate-500 text-sm">In Progress</span>}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1 truncate max-w-[100px]">{event.opponent_name || 'Opponent'}</p>
                    <p className="text-4xl font-bold text-red-600">
                      {isSetBased ? matchResult.theirSetsWon : matchResult.theirTotalPoints}
                    </p>
                    {isSetBased && (
                      <p className="text-xs text-slate-500 mt-1">{matchResult.theirTotalPoints} pts</p>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mt-2">
                  Point Differential: <span className={`font-semibold ${
                    matchResult.pointDifferential > 0 ? 'text-emerald-600' :
                    matchResult.pointDifferential < 0 ? 'text-red-600' : ''
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
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                          if (set.our === 0 && set.their === 0) return null
                          const ourWon = set.our > set.their
                          return (
                            <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg">
                              <span className="text-slate-600 font-medium">Set {idx + 1}:</span>
                              <span className={`font-bold ${ourWon ? 'text-emerald-600' : 'text-red-600'}`}>
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
                    <div className="flex-1 text-center text-sm font-medium text-indigo-600">{team?.name || 'Us'}</div>
                    <div className="flex-1 text-center text-sm font-medium text-red-600">{event.opponent_name || 'Opponent'}</div>
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
              <h3 className="font-semibold text-slate-800">Mark Attendance ({presentCount} present)</h3>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {roster.map(player => {
                  const isPresent = attendance[player.id] === 'present'
                  return (
                    <div
                      key={player.id}
                      onClick={() => toggleAttendance(player.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                        isPresent 
                          ? 'bg-emerald-50 border-2 border-emerald-300' 
                          : 'bg-red-50 border-2 border-red-300'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        isPresent ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        {isPresent ? '✓' : '✗'}
                      </span>
                      <span className="text-slate-800">
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
              <h3 className="font-semibold text-slate-800">Confirm & Complete</h3>
              
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Sport</span>
                  <span className="font-semibold text-slate-800">{sportConfig.icon} {sportConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Format</span>
                  <span className="font-semibold text-slate-800">{selectedFormat.name}</span>
                </div>
                {isSetBased && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Final Score (sets)</span>
                      <span className="font-semibold text-slate-800">{matchResult.ourSetsWon} - {matchResult.theirSetsWon}</span>
                    </div>
                    {/* Set-by-set breakdown */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500 block mb-2">Set Breakdown:</span>
                      <div className="space-y-1">
                        {setScores.slice(0, getSetsToShow()).map((set, idx) => {
                          if (set.our === 0 && set.their === 0) return null
                          const ourWon = set.our > set.their
                          return (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-600">Set {idx + 1}</span>
                              <span className={`font-semibold ${ourWon ? 'text-emerald-600' : 'text-red-600'}`}>
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
                  <span className="text-slate-600">{isSetBased ? 'Total Points' : 'Final Score'}</span>
                  <span className="font-semibold text-slate-800">{matchResult.ourTotalPoints} - {matchResult.theirTotalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Point Differential</span>
                  <span className={`font-semibold ${
                    matchResult.pointDifferential > 0 ? 'text-emerald-600' :
                    matchResult.pointDifferential < 0 ? 'text-red-600' : 'text-slate-800'
                  }`}>
                    {matchResult.pointDifferential > 0 ? '+' : ''}{matchResult.pointDifferential}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Result</span>
                  <span className={`font-bold ${
                    matchResult.result === 'win' ? 'text-emerald-600' :
                    matchResult.result === 'loss' ? 'text-red-600' : 
                    matchResult.result === 'tie' ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {matchResult.result === 'win' ? '🏆 VICTORY' :
                     matchResult.result === 'loss' ? 'DEFEAT' :
                     matchResult.result === 'tie' ? 'TIE' :
                     matchResult.result === 'none' ? 'No Winner' : 'IN PROGRESS'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Attendance</span>
                  <span className="font-semibold text-slate-800">{presentCount} / {roster.length}</span>
                </div>
              </div>
              
              {!canComplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
                  ⚠️ Game must have a winner (or tie if allowed) before completing. Go back to enter scores.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between bg-slate-50">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-2.5 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition"
          >
            {step > 1 ? '← Back' : 'Cancel'}
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={completeGame}
              disabled={saving || !canComplete}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : '✓ Complete Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN GAME PREP PAGE
// ============================================
function GamePrepPage({ showToast }) {
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [games, setGames] = useState([])
  const [pastGames, setPastGames] = useState([])
  const [lineupStatuses, setLineupStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [showGameCompletion, setShowGameCompletion] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showGameDetail, setShowGameDetail] = useState(false)
  const [roster, setRoster] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')
  
  const sport = selectedSeason?.sport || selectedSeason?.sports?.name || 'volleyball'
  const sportConfig = getSportConfig(sport)

  useEffect(() => {
    if (selectedSeason?.id) loadTeams()
  }, [selectedSeason])

  useEffect(() => {
    if (selectedTeam) {
      loadGames()
      loadRoster()
    }
  }, [selectedTeam])

  async function loadTeams() {
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('season_id', selectedSeason.id)
        .order('name')
      
      setTeams(data || [])
      if (data?.length > 0) setSelectedTeam(data[0])
    } catch (err) {
      console.error('Error loading teams:', err)
    }
  }

  async function loadGames() {
    if (!selectedTeam?.id) return
    setLoading(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Load upcoming games
      const { data: upcomingData } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .gte('event_date', today)
        .neq('game_status', 'completed')
        .order('event_date')
        .order('event_time')
        .limit(20)
      
      setGames(upcomingData || [])
      
      // Load past/completed games
      const { data: pastData } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .or(`game_status.eq.completed,event_date.lt.${today}`)
        .order('event_date', { ascending: false })
        .limit(10)
      
      setPastGames(pastData || [])
      
      // Load lineup statuses
      const allGames = [...(upcomingData || []), ...(pastData || [])]
      if (allGames.length > 0) {
        const eventIds = allGames.map(g => g.id)
        const { data: lineups } = await supabase
          .from('game_lineups')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('is_starter', true)
        
        const statusMap = {}
        lineups?.forEach(l => {
          statusMap[l.event_id] = { hasLineup: true }
        })
        setLineupStatuses(statusMap)
      }
      
    } catch (err) {
      console.error('Error loading games:', err)
    }
    setLoading(false)
  }

  async function loadRoster() {
    if (!selectedTeam?.id) return
    
    const { data } = await supabase
      .from('team_players')
      .select('*, players(*)')
      .eq('team_id', selectedTeam.id)
    
    const rosterData = (data || [])
      .map(tp => ({ ...tp.players, team_jersey: tp.jersey_number, team_position: tp.position }))
      .filter(Boolean)
    
    setRoster(rosterData)
  }

  function getLineupStatus(game) {
    const status = lineupStatuses[game.id]
    const isCompleted = game.game_status === 'completed'
    
    if (isCompleted) {
      return { 
        label: game.game_result === 'win' ? 'Win' : game.game_result === 'loss' ? 'Loss' : 'Completed',
        text: game.game_result === 'win' ? 'text-emerald-400' : game.game_result === 'loss' ? 'text-red-400' : 'text-slate-400',
        bg: game.game_result === 'win' ? 'bg-emerald-500/20' : game.game_result === 'loss' ? 'bg-red-500/20' : 'bg-slate-500/20',
        icon: game.game_result === 'win' ? '🏆' : '📊',
        hasLineup: true
      }
    }
    
    if (!status?.hasLineup) {
      return { label: 'Not Started', text: 'text-slate-400', bg: 'bg-slate-500/20', icon: '📋', hasLineup: false }
    }
    
    return { label: 'Ready', text: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '✓', hasLineup: true }
  }

  // Calculate record
  const record = pastGames.reduce((acc, g) => {
    if (g.game_result === 'win') acc.wins++
    else if (g.game_result === 'loss') acc.losses++
    return acc
  }, { wins: 0, losses: 0 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text} flex items-center gap-3`}>
            <span className="text-4xl">{sportConfig.icon}</span>
            Game Prep
          </h1>
          <p className={tc.textMuted}>Build lineups and track game results</p>
        </div>
        
        {/* Record */}
        {(record.wins > 0 || record.losses > 0) && (
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl px-6 py-3`}>
            <p className={`text-xs ${tc.textMuted} mb-1`}>Season Record</p>
            <p className="text-2xl font-bold">
              <span className="text-emerald-400">{record.wins}</span>
              <span className={tc.textMuted}> - </span>
              <span className="text-red-400">{record.losses}</span>
            </p>
          </div>
        )}
      </div>

      {/* Team Selector */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-2`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-semibold ${
                selectedTeam?.id === team.id
                  ? 'text-white shadow-lg'
                  : `${tc.text} hover:bg-slate-700/50`
              }`}
              style={selectedTeam?.id === team.id ? { 
                backgroundColor: team.color,
                boxShadow: `0 4px 20px ${team.color}40`
              } : {}}
            >
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: team.color }}
              />
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2.5 rounded-xl font-semibold transition ${
            activeTab === 'upcoming'
              ? 'bg-[var(--accent-primary)] text-white'
              : `${tc.cardBg} ${tc.text} hover:brightness-110`
          }`}
        >
          📅 Upcoming ({games.length})
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-5 py-2.5 rounded-xl font-semibold transition ${
            activeTab === 'results'
              ? 'bg-[var(--accent-primary)] text-white'
              : `${tc.cardBg} ${tc.text} hover:brightness-110`
          }`}
        >
          📊 Results ({pastGames.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {activeTab === 'upcoming' && (
            games.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    team={selectedTeam}
                    status={getLineupStatus(game)}
                    isSelected={selectedGame?.id === game.id}
                    onClick={() => setSelectedGame(game)}
                    onPrepClick={() => {
                      setSelectedGame(game)
                      setShowLineupBuilder(true)
                    }}
                    onCompleteClick={() => {
                      setSelectedGame(game)
                      setShowGameCompletion(true)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-12 text-center`}>
                <span className="text-6xl">{sportConfig.icon}</span>
                <h2 className={`text-xl font-bold ${tc.text} mt-4`}>No Upcoming Games</h2>
                <p className={tc.textMuted}>Schedule games from the Schedule page to start prepping!</p>
              </div>
            )
          )}
          
          {activeTab === 'results' && (
            pastGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    team={selectedTeam}
                    status={getLineupStatus(game)}
                    isSelected={selectedGame?.id === game.id}
                    onClick={() => {
                      setSelectedGame(game)
                      if (game.game_status === 'completed') {
                        setShowGameDetail(true)
                      } else {
                        setShowGameCompletion(true)
                      }
                    }}
                    onPrepClick={() => {
                      setSelectedGame(game)
                      if (game.game_status === 'completed') {
                        setShowGameDetail(true)
                      } else {
                        setShowGameCompletion(true)
                      }
                    }}
                    onCompleteClick={() => {
                      setSelectedGame(game)
                      setShowGameCompletion(true)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-12 text-center`}>
                <span className="text-6xl">📊</span>
                <h2 className={`text-xl font-bold ${tc.text} mt-4`}>No Game Results Yet</h2>
                <p className={tc.textMuted}>Complete games to see results here</p>
              </div>
            )
          )}
        </>
      )}

      {/* Modals */}
      {showLineupBuilder && selectedGame && selectedTeam && (
        <AdvancedLineupBuilder
          event={selectedGame}
          team={selectedTeam}
          sport={sport}
          onClose={() => {
            setShowLineupBuilder(false)
            loadGames()
          }}
          onSave={() => loadGames()}
          showToast={showToast}
        />
      )}
      
      {showGameCompletion && selectedGame && selectedTeam && (
        <GameCompletionModal
          event={selectedGame}
          team={selectedTeam}
          roster={roster}
          sport={sport}
          onClose={() => {
            setShowGameCompletion(false)
            loadGames()
          }}
          onComplete={() => loadGames()}
          showToast={showToast}
        />
      )}
      
      {showStatsModal && selectedGame && selectedTeam && (
        <GameStatsModal
          event={selectedGame}
          team={selectedTeam}
          roster={roster}
          sport={sport}
          onClose={() => setShowStatsModal(false)}
          onSave={() => loadGames()}
          showToast={showToast}
        />
      )}
      
      {showGameDetail && selectedGame && selectedTeam && (
        <GameDetailModal
          game={selectedGame}
          team={selectedTeam}
          isAdmin={true}
          onClose={() => setShowGameDetail(false)}
          onEditStats={(game) => {
            setShowGameDetail(false)
            setShowStatsModal(true)
          }}
        />
      )}
    </div>
  )
}

export { GamePrepPage }
