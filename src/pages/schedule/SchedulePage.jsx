import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, Calendar, MapPin, Clock, Edit, Trash2, Check, X,
  ChevronLeft, ChevronRight, BarChart3, Star, CheckSquare, ClipboardList, User,
  Phone, Mail, Award, Share2, Download, Image
} from '../../constants/icons'
import { PlayerCard, PlayerCardExpanded } from '../../components/players'
import { ClickableCoachName, CoachDetailModal } from '../../pages/coaches/CoachesPage'
import { getSportConfig, SPORT_CONFIGS } from '../../components/games/GameComponents'
import SchedulePosterModal from './SchedulePosterModal'
import GameDayShareModal from './GameDayShareModal'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
      <path d="M2 12a15.3 15.3 0 0 0 10 4 15.3 15.3 0 0 0 10-4" />
    </svg>
  )
}

// ============================================
// LINEUP BUILDER - Sport-Aware Implementation
// ============================================
function LineupBuilder({ event, team, onClose, showToast, onSave, sport = 'volleyball' }) {
  const tc = useThemeClasses()
  const { user } = useAuth()
  const [roster, setRoster] = useState([])
  const [lineup, setLineup] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [liberoId, setLiberoId] = useState(null)
  
  // Get sport-specific configuration
  const sportConfig = getSportConfig(sport)
  const positions = sportConfig.positions
  const starterCount = sportConfig.starterCount
  const hasLibero = sportConfig.hasLibero
  
  useEffect(() => {
    loadData()
  }, [event.id, team.id])
  
  async function loadData() {
    setLoading(true)
    
    // Load team roster
    const { data: players } = await supabase
      .from('team_players')
      .select('*, players(*)')
      .eq('team_id', team.id)
    
    const rosterData = (players || []).map(tp => tp.players).filter(Boolean)
    setRoster(rosterData)
    
    // Load existing lineup for this event
    const { data: existingLineup } = await supabase
      .from('game_lineups')
      .select('*')
      .eq('event_id', event.id)
    
    if (existingLineup?.length > 0) {
      setLineup(existingLineup)
      const libero = existingLineup.find(l => l.is_libero)
      if (libero) setLiberoId(libero.player_id)
    }
    
    setLoading(false)
  }
  
  function getPlayerInPosition(positionNum) {
    const entry = lineup.find(l => l.rotation_order === positionNum && l.is_starter)
    if (!entry) return null
    return roster.find(p => p.id === entry.player_id)
  }
  
  function assignPosition(positionNum, playerId) {
    // Remove player from any existing position
    let newLineup = lineup.filter(l => l.player_id !== playerId)
    
    // Remove any player currently in this position
    newLineup = newLineup.filter(l => !(l.rotation_order === positionNum && l.is_starter))
    
    // Add player to new position
    if (playerId) {
      newLineup.push({
        event_id: event.id,
        player_id: playerId,
        rotation_order: positionNum,
        is_starter: true,
        is_libero: playerId === liberoId
      })
    }
    
    setLineup(newLineup)
  }
  
  function toggleLibero(playerId) {
    if (liberoId === playerId) {
      setLiberoId(null)
      setLineup(lineup.map(l => ({ ...l, is_libero: false })))
    } else {
      setLiberoId(playerId)
      setLineup(lineup.map(l => ({ ...l, is_libero: l.player_id === playerId })))
    }
  }
  
  function isPlayerAssigned(playerId) {
    return lineup.some(l => l.player_id === playerId && l.is_starter)
  }
  
  async function saveLineup() {
    setSaving(true)
    
    // Delete existing lineup
    await supabase.from('game_lineups').delete().eq('event_id', event.id)
    
    // Insert new lineup
    if (lineup.length > 0) {
      const { error } = await supabase.from('game_lineups').insert(
        lineup.map(l => ({
          event_id: event.id,
          player_id: l.player_id,
          rotation_order: l.rotation_order,
          is_starter: l.is_starter,
          is_libero: l.is_libero || false
        }))
      )
      
      if (error) {
        showToast?.('Error saving lineup', 'error')
        setSaving(false)
        return
      }
    }
    
    showToast?.('Lineup saved!', 'success')
    onSave?.()
    setSaving(false)
    onClose()
  }
  
  const starters = lineup.filter(l => l.is_starter)
  const availablePlayers = roster.filter(p => !isPlayerAssigned(p.id))

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-xl font-bold ${tc.text}`}>{sportConfig.icon} Lineup Builder</h2>
            <p className={tc.textMuted}>{team.name} vs {event.opponent_name || 'TBD'} • {sport}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Position Slots - Generic for all sports */}
            <div>
              <h3 className={`font-semibold ${tc.text} mb-4`}>Starting Lineup ({starters.length}/{starterCount})</h3>
              
              {/* Position Grid - Adaptive based on number of positions */}
              <div className={`grid gap-3 ${
                positions.length <= 6 ? 'grid-cols-3' : 
                positions.length <= 9 ? 'grid-cols-3' : 
                'grid-cols-4'
              }`}>
                {positions.map(pos => {
                  const player = getPlayerInPosition(pos.id)
                  return (
                    <div 
                      key={pos.id}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                        player ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]' : `${tc.cardBgAlt} border-slate-600 hover:border-slate-400`
                      }`}
                      onClick={() => {
                        if (player) assignPosition(pos.id, null)
                      }}
                    >
                      {player ? (
                        <>
                          <span className="font-bold text-white text-lg">#{player.jersey_number || '?'}</span>
                          <span className="text-xs text-slate-300 truncate w-full text-center px-1">{player.first_name}</span>
                          {hasLibero && player.id === liberoId && <span className="text-[10px] text-amber-400">LIBERO</span>}
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 font-semibold">{pos.name}</span>
                          <span className="text-[10px] text-slate-500 text-center px-1">{pos.label}</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              
              <p className={`text-xs ${tc.textMuted} mt-3`}>Click a filled position to remove player</p>
              
              {/* Starters count */}
              <div className={`mt-4 p-3 rounded-xl ${tc.cardBgAlt} flex items-center justify-between`}>
                <span className={tc.text}>Starters: {starters.length}/{starterCount}</span>
                {starters.length >= starterCount && <span className="text-emerald-400 text-sm">✓ Lineup complete</span>}
              </div>
            </div>
            
            {/* Available Players */}
            <div>
              <h3 className={`font-semibold ${tc.text} mb-4`}>Available Players ({availablePlayers.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {roster.map(player => {
                  const assigned = isPlayerAssigned(player.id)
                  const isLibero = player.id === liberoId
                  
                  return (
                    <div 
                      key={player.id}
                      className={`p-3 rounded-xl flex items-center justify-between transition ${
                        assigned 
                          ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30' 
                          : `${tc.cardBgAlt} hover:bg-slate-700/50`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <img src={player.photo_url} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                            {player.jersey_number || '?'}
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${tc.text}`}>
                            {player.first_name} {player.last_name}
                            {isLibero && <span className="ml-2 text-xs text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded">LIBERO</span>}
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>
                            #{player.jersey_number} • {player.position || 'No position'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Libero toggle - only for sports that have it */}
                        {hasLibero && (
                          <button
                            onClick={() => toggleLibero(player.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              isLibero ? 'bg-amber-500 text-black' : `${tc.cardBg} ${tc.textMuted} hover:text-amber-400`
                            }`}
                            title="Toggle Libero"
                          >
                            L
                          </button>
                        )}
                        
                        {/* Position assignment dropdown */}
                        {!assigned && (
                          <select
                            onChange={e => {
                              if (e.target.value) assignPosition(parseInt(e.target.value), player.id)
                            }}
                            className={`px-2 py-1 rounded text-sm ${tc.input}`}
                            defaultValue=""
                          >
                            <option value="">Assign...</option>
                            {positions.map(pos => (
                              <option key={pos.id} value={pos.id} disabled={!!getPlayerInPosition(pos.id)}>
                                {pos.name} {getPlayerInPosition(pos.id) ? '(filled)' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {assigned && (
                          <span className="text-xs text-[var(--accent-primary)]">
                            {positions.find(p => p.id === lineup.find(l => l.player_id === player.id)?.rotation_order)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {roster.length === 0 && (
                  <p className={`text-center py-8 ${tc.textMuted}`}>No players on roster</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className={`p-4 border-t ${tc.border} flex justify-between`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text}`}>
            Cancel
          </button>
          <button 
            onClick={saveLineup}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Lineup'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// GAME COMPLETION MODAL - MULTI-SPORT SCORING
// ============================================

// Volleyball Set Score Input Component
function SetScoreInput({ setNumber, ourScore, theirScore, targetScore, cap, winByTwo, onOurScoreChange, onTheirScoreChange, isDecidingSet, ourTeamName, theirTeamName }) {
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
    <div className={`p-4 rounded-2xl border-2 transition ${
      ourWon ? 'bg-emerald-500/10 border-emerald-500/50' :
      theyWon ? 'bg-red-500/10 border-red-500/50' :
      'bg-slate-800/50 border-slate-600'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isDecidingSet ? 'text-amber-400' : 'text-white'}`}>
            Set {setNumber}
          </span>
          {isDecidingSet && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
              Deciding
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">
          First to {targetScore} {winByTwo ? '(win by 2)' : ''} {cap ? `• Cap: ${cap}` : ''}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs text-slate-400 font-medium mb-1 block truncate">{ourTeamName || 'Us'}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOurScoreChange(Math.max(0, ourScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
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
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 bg-slate-800 focus:outline-none ${
                ourWon ? 'border-emerald-400 text-emerald-400' : 'border-slate-600 text-white focus:border-purple-500'
              }`}
            />
            <button
              type="button"
              onClick={() => onOurScoreChange(ourScore + 1)}
              className="w-10 h-10 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition"
            >+</button>
          </div>
        </div>
        
        <div className="text-2xl text-slate-500 font-bold">-</div>
        
        <div className="flex-1">
          <label className="text-xs text-slate-400 font-medium mb-1 block text-right truncate">{theirTeamName || 'Opponent'}</label>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => onTheirScoreChange(Math.max(0, theirScore - 1))}
              className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition"
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
              className={`w-16 h-12 text-center text-2xl font-bold rounded-xl border-2 bg-slate-800 focus:outline-none ${
                theyWon ? 'border-red-400 text-red-400' : 'border-slate-600 text-white focus:border-purple-500'
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
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
              <div className={`p-4 rounded-2xl text-center ${
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
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
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
                  {gameBadges.map(b => <span key={b.id} className="px-2 py-1 rounded-full bg-slate-700 text-xs">{b.icon} {b.name}</span>)}
                </div>
              </div>
              <div className="space-y-3">
                {roster.filter(p => attendance[p.id] === 'present' || attendance[p.id] === 'late').map(player => {
                  const playerBadges = getPlayerBadges(player.id)
                  return (
                    <div key={player.id} className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm">{player.jersey_number || '?'}</div>
                        <p className={`font-medium ${tc.text}`}>{player.first_name} {player.last_name}</p>
                        {playerBadges.length > 0 && <span className="text-xs text-[var(--accent-primary)]">{playerBadges.length} badge(s)</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gameBadges.map(badge => {
                          const awarded = playerBadges.some(b => b.badgeType === badge.id)
                          return (
                            <button key={badge.id} onClick={() => toggleBadge(player.id, badge.id)}
                              className={`px-2 py-1 rounded-lg text-xs transition ${awarded ? 'bg-[var(--accent-primary)] text-white' : `${tc.cardBg} ${tc.textMuted} hover:bg-slate-600`}`}>
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
                    <div className="pt-2 border-t border-slate-700">
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

// Helper functions
function getEventColor(type) {
  const colors = {
    practice: '#10B981',
    game: '#F59E0B',
    tournament: '#8B5CF6',
    team_event: '#3B82F6',
    other: '#6B7280'
  }
  return colors[type] || colors.other
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function SchedulePage({ showToast, activeView, roleContext }) {
  const journey = useJourney()
  const parentTutorial = useParentTutorial()
  const { organization } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month') // month, week, day, list
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedEventType, setSelectedEventType] = useState('all')
  
  // Parent view restrictions
  const isParentView = activeView === 'parent'
  const isPlayerView = activeView === 'player'
  const parentChildIds = roleContext?.children?.map(c => c.id) || []
  
  // Complete "view_schedule" step for parents when they visit this page
  useEffect(() => {
    if (isParentView) {
      parentTutorial?.completeStep?.('view_schedule')
    }
  }, [isParentView])
  
  // Modals
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showBulkPractice, setShowBulkPractice] = useState(false)
  const [showBulkGames, setShowBulkGames] = useState(false)
  const [showVenueManager, setShowVenueManager] = useState(false)
  const [showAvailabilitySurvey, setShowAvailabilitySurvey] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showPosterModal, setShowPosterModal] = useState(false)
  const [showGameDayCard, setShowGameDayCard] = useState(null) // event object or null
  const [allUpcomingGames, setAllUpcomingGames] = useState([])

  useEffect(() => {
    if (selectedSeason?.id) {
      loadEvents()
      loadTeams()
      loadVenues()
    }
  }, [selectedSeason?.id, currentDate])

  async function loadEvents() {
    if (!selectedSeason?.id) {
      console.log('loadEvents: No season selected')
      return
    }
    setLoading(true)
    
    // Get date range based on view
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Format as YYYY-MM-DD for date comparison
    const startDate = startOfMonth.toISOString().split('T')[0]
    const endDate = endOfMonth.toISOString().split('T')[0]
    
    console.log('loadEvents: Querying with', {
      season_id: selectedSeason.id,
      startDate,
      endDate
    })
    
    const { data, error } = await supabase
      .from('schedule_events')
      .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')
      .eq('season_id', selectedSeason.id)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
    
    console.log('loadEvents: Result', { data, error, count: data?.length })
    
    if (error) console.error('Error loading events:', error)
    
    // Transform data to add computed start_time for calendar views
    const transformedData = (data || []).map(event => ({
      ...event,
      // Combine event_date and event_time into a start_time for calendar compatibility
      start_time: event.event_date && event.event_time 
        ? `${event.event_date}T${event.event_time}` 
        : event.event_date,
      // Also create end_time timestamp if end_time exists
      end_time_full: event.event_date && event.end_time 
        ? `${event.event_date}T${event.end_time}` 
        : null
    }))
    
    setEvents(transformedData)
    setLoading(false)
  }

  async function loadTeams() {
    if (!selectedSeason?.id) return
    const { data } = await supabase
      .from('teams')
      .select('id, name, color, logo_url')
      .eq('season_id', selectedSeason.id)
      .order('name')
    setTeams(data || [])
  }

  async function loadVenues() {
    if (!organization?.id) return
    // Load from org settings or a venues table
    const savedVenues = organization.settings?.venues || []
    setVenues(savedVenues)
  }

  async function saveVenues(newVenues) {
    const newSettings = { ...organization.settings, venues: newVenues }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setVenues(newVenues)
    showToast('Venues saved!', 'success')
  }

  async function createEvent(eventData) {
    try {
      const { error } = await supabase.from('schedule_events').insert({
        ...eventData,
        season_id: selectedSeason.id,
        created_at: new Date().toISOString()
      })
      if (error) throw error
      showToast('Event created!', 'success')
      journey?.completeStep('create_schedule')
      loadEvents()
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  async function createBulkEvents(eventsData, notify = false) {
    try {
      const events = eventsData.map(e => ({
        ...e,
        season_id: selectedSeason.id,
        created_at: new Date().toISOString()
      }))
      const { error } = await supabase.from('schedule_events').insert(events)
      if (error) throw error
      showToast(`${events.length} events created!`, 'success')
      journey?.completeStep('create_schedule')
      loadEvents()
      // TODO: If notify, trigger notification to families
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  async function updateEvent(eventId, eventData) {
    try {
      const { error } = await supabase
        .from('schedule_events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('id', eventId)
      if (error) throw error
      showToast('Event updated!', 'success')
      loadEvents()
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  async function deleteEvent(eventId) {
    if (!confirm('Delete this event?')) return
    try {
      const { error } = await supabase.from('schedule_events').delete().eq('id', eventId)
      if (error) throw error
      showToast('Event deleted', 'success')
      setSelectedEvent(null)
      loadEvents()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  // Filter events - show org-wide events (null team_id) always, plus team-specific events
  const filteredEvents = events.filter(e => {
    // If "All Teams" selected, show everything
    if (selectedTeam === 'all') {
      // Just filter by event type if needed
      if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false
      return true
    }
    
    // If specific team selected, show: team's events + org-wide events (null team_id)
    if (e.team_id !== selectedTeam && e.team_id !== null) return false
    if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false
    return true
  })

  // Navigation helpers
  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  function goToToday() {
    setCurrentDate(new Date())
  }

  // Generate iCal export
  function exportToICal() {
    const icsEvents = filteredEvents.map(event => {
      const start = new Date(event.start_time)
      const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60 * 60 * 1000)
      
      const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      
      return `BEGIN:VEVENT
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${event.title || event.event_type}
DESCRIPTION:${event.description || ''}
LOCATION:${event.venue_name || ''} ${event.venue_address || ''}
END:VEVENT`
    }).join('\n')

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VolleyBrain//Schedule//EN
${icsEvents}
END:VCALENDAR`

    const blob = new Blob([ical], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `volleybrain-schedule-${selectedSeason?.name || 'calendar'}.ics`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Calendar exported!', 'success')
  }

  // Load upcoming games for the hero strip
  useEffect(() => {
    if (selectedSeason?.id) loadAllUpcoming()
  }, [selectedSeason?.id, selectedTeam])

  async function loadAllUpcoming() {
    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('schedule_events')
      .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')
      .eq('season_id', selectedSeason.id)
      .eq('event_type', 'game')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
      .limit(6)
    const { data } = await query
    setAllUpcomingGames(data || [])
  }

  if (!selectedSeason) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={tc.textMuted}>Please select a season from the sidebar</p>
      </div>
    )
  }

  const sportIcon = selectedSeason?.sports?.icon || '🏐'
  const upcomingGames = filteredEvents.filter(e => e.event_type === 'game' && new Date(e.event_date) >= new Date())

  function formatGameDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date(); today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    if (d.getTime() === today.getTime()) return 'TODAY'
    if (d.getTime() === tomorrow.getTime()) return 'TOMORROW'
    return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  }

  function formatGameDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatGameTime(timeStr) {
    if (!timeStr) return 'TBD'
    const [h,m] = timeStr.split(':'); const hr = parseInt(h)
    return `${hr>12?hr-12:hr===0?12:hr}:${m} ${hr>=12?'PM':'AM'}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {sportIcon}
            </div>
            <div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${tc.text}`}>Schedule</h1>
              <p className={`text-sm ${tc.textMuted}`}>{selectedSeason.name} • {filteredEvents.length} events this month</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Share & Export dropdown — available to ALL roles */}
          <div className="relative">
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isDark 
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Share2 className="w-4 h-4" /> Share & Export ▾
            </button>
            {showShareMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl z-30 border overflow-hidden ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500 bg-slate-900/50' : 'text-slate-400 bg-slate-50'}`}>
                  Generate
                </div>
                <button onClick={() => { setShowPosterModal(true); setShowShareMenu(false) }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                  <span className="text-lg">📋</span>
                  <div>
                    <div className="font-semibold text-sm">Season Poster</div>
                    <div className={`text-xs ${tc.textMuted}`}>Branded schedule graphic</div>
                  </div>
                </button>
                {upcomingGames.length > 0 && (
                  <button onClick={() => { setShowGameDayCard(upcomingGames[0]); setShowShareMenu(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span className="text-lg">🏟️</span>
                    <div>
                      <div className="font-semibold text-sm">Game Day Card</div>
                      <div className={`text-xs ${tc.textMuted}`}>Share next game on social</div>
                    </div>
                  </button>
                )}
                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-t ${isDark ? 'text-slate-500 bg-slate-900/50 border-slate-700' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                  Export
                </div>
                <button onClick={() => { exportToICal(); setShowShareMenu(false) }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="font-semibold text-sm">Export to Calendar</div>
                    <div className={`text-xs ${tc.textMuted}`}>iCal (.ics) for Google/Apple</div>
                  </div>
                </button>
                <button onClick={() => { window.print(); setShowShareMenu(false) }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                  <span className="text-lg">🖨️</span>
                  <div>
                    <div className="font-semibold text-sm">Print Schedule</div>
                    <div className={`text-xs ${tc.textMuted}`}>Print or save as PDF</div>
                  </div>
                </button>
              </div>
            )}
          </div>
          {/* Add Events — admin/coach only */}
          {!isParentView && !isPlayerView && (
            <div className="relative">
              <button 
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="bg-[var(--accent-primary)] text-white font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 flex items-center gap-2 text-sm shadow-sm"
              >
                ➕ Add Events ▾
              </button>
              {showQuickActions && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-30 border overflow-hidden ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <button onClick={() => { setShowAddEvent(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span>📝</span> Single Event
                  </button>
                  <button onClick={() => { setShowBulkPractice(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span>🔄</span> Recurring Practice
                  </button>
                  <button onClick={() => { setShowBulkGames(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <VolleyballIcon className="w-4 h-4" /> Bulk Add Games
                  </button>
                  <button onClick={() => { setShowVenueManager(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <span>📍</span> Manage Venues
                  </button>
                  <button onClick={() => { setShowAvailabilitySurvey(true); setShowQuickActions(false) }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? 'text-white hover:bg-slate-700' : 'text-slate-800 hover:bg-slate-50'}`}>
                    <BarChart3 className="w-5 h-5" /> Availability Survey
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ UPCOMING GAMES STRIP ═══ */}
      {allUpcomingGames.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Upcoming Games</span>
            </div>
            {upcomingGames.length > 0 && (
              <button 
                onClick={() => setShowGameDayCard(allUpcomingGames[0])}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Next Game
              </button>
            )}
          </div>
          <div className="p-3 flex gap-3 overflow-x-auto">
            {allUpcomingGames.slice(0, 5).map((game, i) => {
              const gameTeam = game.teams || teams.find(t => t.id === game.team_id)
              const teamCol = gameTeam?.color || '#6366F1'
              const isToday = formatGameDay(game.event_date) === 'TODAY'
              const isTomorrow = formatGameDay(game.event_date) === 'TOMORROW'
              return (
                <button 
                  key={game.id} 
                  onClick={() => setSelectedEvent(game)}
                  className={`flex-shrink-0 rounded-xl p-3 text-left transition-all border-2 hover:shadow-md ${
                    isToday 
                      ? 'border-amber-400 shadow-amber-100' 
                      : isTomorrow
                        ? (isDark ? 'border-slate-600 hover:border-slate-500' : 'border-blue-200 hover:border-blue-300')
                        : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300')
                  }`}
                  style={{ 
                    minWidth: 180,
                    background: isToday 
                      ? (isDark ? `${teamCol}15` : `${teamCol}08`) 
                      : isDark ? 'rgba(30,41,59,0.5)' : '#fff'
                  }}
                >
                  {/* Day badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isToday ? 'bg-amber-400 text-amber-900' : isTomorrow ? 'bg-blue-100 text-blue-700' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {formatGameDay(game.event_date)}
                    </span>
                    {/* Share button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowGameDayCard(game) }}
                      className={`p-1 rounded-md transition ${isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'}`}
                      title="Share game"
                    >
                      <Share2 className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>
                  </div>
                  {/* Opponent */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: teamCol }} />
                    <div>
                      <div className={`text-sm font-extrabold ${tc.text} leading-tight`}>
                        vs. {game.opponent_name || game.opponent || 'TBD'}
                      </div>
                      {gameTeam?.name && (
                        <div className={`text-xs font-bold ${tc.textMuted}`}>{gameTeam.name}</div>
                      )}
                    </div>
                  </div>
                  {/* Date + Time */}
                  <div className={`text-[11px] font-semibold ${tc.textMuted}`}>
                    {formatGameDate(game.event_date)} • {formatGameTime(game.event_time)}
                  </div>
                  {game.venue_name && (
                    <div className={`text-[10px] ${tc.textMuted} mt-0.5 truncate max-w-[160px]`}>📍 {game.venue_name}{game.court_number ? ` · ${game.court_number}` : ''}</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
            <option value="all">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium border ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
            <option value="all">All Types</option>
            <option value="practice">Practices</option>
            <option value="game">Games</option>
            <option value="tournament">Tournaments</option>
            <option value="team_event">Team Events</option>
            <option value="other">Other</option>
          </select>
          {/* Event type legend dots */}
          <div className="hidden sm:flex items-center gap-3 ml-2">
            {[
              { type: 'practice', label: 'Practice', color: '#10B981' },
              { type: 'game', label: 'Game', color: '#F59E0B' },
              { type: 'tournament', label: 'Tourney', color: '#8B5CF6' },
            ].map(t => (
              <div key={t.type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className={`text-xs font-medium ${tc.textMuted}`}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            {['month', 'week', 'day', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                  view === v 
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                    : `${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`
                }`}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className={`flex items-center justify-between rounded-xl p-3 border ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button onClick={prevMonth} className={`p-2 rounded-lg transition font-semibold text-sm ${
          isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
        }`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className={`text-lg font-extrabold ${tc.text}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToToday} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}>
            Today
          </button>
        </div>
        <button onClick={nextMonth} className={`p-2 rounded-lg transition font-semibold text-sm ${
          isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
        }`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading schedule...</div>
      ) : view === 'month' ? (
        <MonthView 
          events={filteredEvents} 
          currentDate={currentDate} 
          onSelectEvent={setSelectedEvent}
          onSelectDate={(date) => { setCurrentDate(date); setView('day') }}
          teams={teams}
        />
      ) : view === 'week' ? (
        <WeekView 
          events={filteredEvents} 
          currentDate={currentDate}
          onSelectEvent={setSelectedEvent}
          teams={teams}
        />
      ) : view === 'day' ? (
        <DayView 
          events={filteredEvents} 
          currentDate={currentDate}
          onSelectEvent={setSelectedEvent}
          teams={teams}
        />
      ) : (
        <ListView 
          events={filteredEvents}
          onSelectEvent={setSelectedEvent}
          teams={teams}
        />
      )}

      {/* Event Count */}
      <div className={`text-center text-sm ${tc.textMuted}`}>
        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} this month
      </div>

      {/* Modals */}
      {showAddEvent && (
        <AddEventModal
          teams={teams}
          venues={venues}
          onClose={() => setShowAddEvent(false)}
          onCreate={createEvent}
        />
      )}

      {showBulkPractice && (
        <BulkPracticeModal
          teams={teams}
          venues={venues}
          onClose={() => setShowBulkPractice(false)}
          onCreate={createBulkEvents}
        />
      )}

      {showBulkGames && (
        <BulkGamesModal
          teams={teams}
          venues={venues}
          onClose={() => setShowBulkGames(false)}
          onCreate={createBulkEvents}
        />
      )}

      {showVenueManager && (
        <VenueManagerModal
          venues={venues}
          onClose={() => setShowVenueManager(false)}
          onSave={saveVenues}
        />
      )}

      {showAvailabilitySurvey && (
        <AvailabilitySurveyModal
          teams={teams}
          organization={organization}
          onClose={() => setShowAvailabilitySurvey(false)}
          showToast={showToast}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          teams={teams}
          venues={venues}
          onClose={() => setSelectedEvent(null)}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
          activeView={activeView}
          selectedSeason={selectedSeason}
          parentChildIds={parentChildIds}
          showToast={showToast}
          onShareGameDay={(evt) => { setSelectedEvent(null); setShowGameDayCard(evt) }}
          parentTutorial={parentTutorial}
        />
      )}

      {/* Season Poster Modal */}
      {showPosterModal && (
        <SchedulePosterModal
          season={selectedSeason}
          team={selectedTeam !== 'all' ? teams.find(t => t.id === selectedTeam) : teams[0]}
          organization={organization}
          events={events}
          onClose={() => setShowPosterModal(false)}
          showToast={showToast}
        />
      )}

      {/* Game Day Share Card */}
      {showGameDayCard && (
        <GameDayShareModal
          event={showGameDayCard}
          team={teams.find(t => t.id === showGameDayCard.team_id) || teams[0]}
          organization={organization}
          season={selectedSeason}
          onClose={() => setShowGameDayCard(null)}
          showToast={showToast}
        />
      )}

      {/* Click outside to close menus */}
      {(showQuickActions || showShareMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowQuickActions(false); setShowShareMenu(false) }} />
      )}
    </div>
  )
}
// Export added at end
// ============================================
// CALENDAR VIEWS
// ============================================
function MonthView({ events, currentDate, onSelectEvent, onSelectDate, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = []
  for (let i = 0; i < startPadding; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getEventsForDay = (day) => {
    if (!day) return []
    const dayStart = new Date(year, month, day)
    const dayEnd = new Date(year, month, day, 23, 59, 59)
    return events.filter(e => {
      const eventDate = new Date(e.start_time)
      return eventDate >= dayStart && eventDate <= dayEnd
    })
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const isPast = (day) => {
    if (!day) return false
    const today = new Date()
    today.setHours(0,0,0,0)
    return new Date(year, month, day) < today
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      {/* Day headers */}
      <div className={`grid grid-cols-7 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className={`p-3 text-center text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const today = isToday(day)
          const past = isPast(day)
          return (
            <div 
              key={i} 
              className={`min-h-[100px] p-2 border-b border-r transition-colors ${
                isDark ? 'border-slate-700/50' : 'border-slate-100'
              } ${!day 
                ? (isDark ? 'bg-slate-900/30' : 'bg-slate-50/50') 
                : today 
                  ? (isDark ? 'bg-[var(--accent-primary)]/5' : 'bg-[var(--accent-primary)]/5')
                  : `${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} cursor-pointer`
              } ${past && day ? 'opacity-60' : ''}`}
              onClick={() => day && onSelectDate(new Date(year, month, day))}
            >
              {day && (
                <>
                  <div className={`text-sm font-bold mb-1 ${
                    today 
                      ? 'w-7 h-7 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center shadow-sm' 
                      : tc.text
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => {
                      const teamColor = event.teams?.color
                      const typeColor = getEventColor(event.event_type)
                      // Use team color for background/border when available, fall back to event type color
                      const accentColor = teamColor || typeColor
                      const teamName = event.teams?.name
                      return (
                        <div 
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                          className="text-xs px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:brightness-110 transition font-medium"
                          style={{ 
                            backgroundColor: accentColor + (isDark ? '22' : '15'),
                            color: typeColor,
                            borderLeft: `4px solid ${accentColor}`
                          }}
                        >
                          {teamName && <span className="font-bold opacity-70" style={{ color: accentColor }}>{teamName.length <= 6 ? teamName : teamName.substring(0, 3)} · </span>}
                          {formatTime(event.start_time)} {event.title || event.event_type}
                          {event.court_number && <span className="opacity-50"> · Ct {event.court_number}</span>}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className={`text-xs font-medium ${tc.textMuted}`}>+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ events, currentDate, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push(day)
  }

  const hours = []
  for (let h = 6; h <= 22; h++) {
    hours.push(h)
  }

  const getEventsForDayHour = (day, hour) => {
    return events.filter(e => {
      const eventDate = new Date(e.start_time)
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getHours() === hour
    })
  }

  const isToday = (day) => {
    const today = new Date()
    return day.getDate() === today.getDate() && 
           day.getMonth() === today.getMonth() && 
           day.getFullYear() === today.getFullYear()
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      {/* Day headers */}
      <div className={`grid grid-cols-8 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="p-3 text-center text-sm font-medium"></div>
        {weekDays.map((day, i) => (
          <div key={i} className={`p-3 text-center ${isToday(day) ? 'bg-[var(--accent-primary)]/10' : ''}`}>
            <div className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className={`text-lg font-extrabold ${isToday(day) ? 'text-[var(--accent-primary)]' : tc.text}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => (
          <div key={hour} className={`grid grid-cols-8 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <div className={`p-2 text-xs text-right pr-3 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'pm' : 'am'}
            </div>
            {weekDays.map((day, i) => {
              const hourEvents = getEventsForDayHour(day, hour)
              return (
                <div key={i} className={`p-1 min-h-[50px] border-l ${isDark ? 'border-slate-700/50' : 'border-slate-100'} ${isToday(day) ? 'bg-[var(--accent-primary)]/5' : ''}`}>
                  {hourEvents.map(event => {
                    const teamColor = event.teams?.color
                    const typeColor = getEventColor(event.event_type)
                    const accentColor = teamColor || typeColor
                    return (
                      <div 
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className="text-xs p-1.5 rounded-md truncate cursor-pointer hover:brightness-110 mb-1 font-medium transition"
                        style={{ 
                          backgroundColor: accentColor + (isDark ? '25' : '18'),
                          color: typeColor,
                          borderLeft: `3px solid ${accentColor}`
                        }}
                      >
                        {event.teams?.name && <span className="font-bold opacity-70" style={{ color: accentColor }}>{event.teams.name.length <= 6 ? event.teams.name : event.teams.name.substring(0, 3)} · </span>}
                        {event.title || event.event_type}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ events, currentDate, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.start_time)
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear()
  })

  const hours = []
  for (let h = 6; h <= 22; h++) {
    hours.push(h)
  }

  return (
    <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <h3 className={`text-lg font-bold ${tc.text}`}>
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <p className={`text-sm ${tc.textMuted}`}>{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(e => new Date(e.start_time).getHours() === hour)
          return (
            <div key={hour} className={`flex border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <div className={`w-20 p-3 text-sm text-right shrink-0 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <div className="flex-1 p-2 min-h-[60px]">
                {hourEvents.map(event => {
                  const teamColor = event.teams?.color
                  const typeColor = getEventColor(event.event_type)
                  const accentColor = teamColor || typeColor
                  return (
                  <div 
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={`p-3 rounded-xl cursor-pointer hover:brightness-105 mb-2 transition ${isDark ? '' : 'shadow-sm'}`}
                    style={{ 
                      backgroundColor: accentColor + (isDark ? '15' : '12'),
                      borderLeft: `4px solid ${accentColor}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${tc.text}`}>{event.title || event.event_type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: typeColor + '25', color: typeColor }}>
                        {event.event_type}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 ${tc.textMuted}`}>
                      {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : 'TBD'}
                    </div>
                    {event.venue_name && (
                      <div className={`text-sm mt-1 ${tc.textMuted}`}>📍 {event.venue_name}{event.court_number ? ` (${event.court_number})` : ''}</div>
                    )}
                    {event.teams?.name && (
                      <div className="text-sm font-medium mt-1" style={{ color: event.teams.color }}>{event.teams.name}</div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ListView({ events, onSelectEvent, teams }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  
  // Group by date
  const grouped = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${tc.textMuted}`}>
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`rounded-xl p-4 cursor-pointer transition-all border ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 hover:border-[var(--accent-primary)]/30' 
                    : 'bg-white border-slate-200 hover:border-[var(--accent-primary)]/40 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-1.5 h-12 rounded-full"
                      style={{ backgroundColor: event.teams?.color || getEventColor(event.event_type) }}
                    />
                    <div>
                      <p className={`font-bold text-sm ${tc.text}`}>{event.title || event.event_type}</p>
                      <p className={`text-sm ${tc.textMuted}`}>
                        {formatTime(event.start_time)} - {event.end_time ? formatTime(event.end_time) : 'TBD'}
                        {event.venue_name && ` • 📍 ${event.venue_name}`}
                        {event.court_number && ` (${event.court_number})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: getEventColor(event.event_type) + '20', color: getEventColor(event.event_type) }}>
                      {event.event_type}
                    </span>
                    {event.teams?.name && (
                      <p className="text-xs font-semibold" style={{ color: event.teams.color }}>{event.teams.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && (
        <div className={`rounded-2xl p-12 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className="text-5xl">🗓️</span>
          <h3 className={`text-lg font-bold mt-4 ${tc.text}`}>No events this month</h3>
          <p className={`mt-2 ${tc.textMuted}`}>Create your first event to get started</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// ADD SINGLE EVENT MODAL
// ============================================
function AddEventModal({ teams, venues, onClose, onCreate }) {
  const [form, setForm] = useState({
    team_id: '',
    event_type: 'practice',
    title: '',
    description: '',
    start_date: '',
    start_time: '18:00',
    end_time: '19:00',
    venue_name: '',
    venue_address: '',
    court_number: '',
    location_type: 'home',
    opponent_name: '',
    arrival_time: '',
    notify_families: false
  })

  function handleVenueSelect(venueName) {
    const venue = venues.find(v => v.name === venueName)
    setForm({ ...form, venue_name: venue?.name || venueName, venue_address: venue?.address || '' })
  }

  async function handleSubmit() {
    if (!form.start_date || !form.start_time) {
      alert('Please enter date and time')
      return
    }
    
    // Build arrival_time as full timestamp if provided
    let arrivalTimestamp = null
    if (form.arrival_time) {
      arrivalTimestamp = `${form.start_date}T${form.arrival_time}:00`
    }
    
    // Use your schema: event_date (date) + event_time (time) + end_time (time)
    const eventData = {
      team_id: form.team_id || null,
      event_type: form.event_type,
      title: form.title || form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1),
      notes: form.description,  // Your schema uses 'notes' not 'description'
      event_date: form.start_date,  // DATE format: YYYY-MM-DD
      event_time: form.start_time,  // TIME format: HH:MM
      end_time: form.end_time || null,  // TIME format: HH:MM
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      court_number: form.court_number || null,
      location_type: form.location_type,
      opponent_name: form.opponent_name,
      arrival_time: arrivalTimestamp  // TIMESTAMP format: YYYY-MM-DDTHH:MM:SS
    }
    
    const success = await onCreate(eventData)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <h2 className="text-xl font-semibold text-white">Add Event</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Event Type</label>
              <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                <option value="practice">Practice</option>
                <option value="game">Game</option>
                <option value="tournament">Tournament</option>
                <option value="team_event">Team Event</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Team (optional)</label>
              <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                <option value="">All Teams / Org-wide</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder={form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Venue</label>
            <select value={form.venue_name} onChange={e => handleVenueSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-2">
              <option value="">Select saved venue or enter below</option>
              {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
            </select>
            <input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})}
              placeholder="Venue name"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-2" />
            <input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})}
              placeholder="Address"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            <input type="text" value={form.court_number} onChange={e => setForm({...form, court_number: e.target.value})}
              placeholder="Court / Field # (optional)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mt-2" />
          </div>

          {form.event_type === 'game' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Location Type</label>
                  <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="home">Home</option>
                    <option value="away">Away</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Opponent</label>
                  <input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})}
                    placeholder="Opponent team name"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Arrival Time (optional)</label>
                <input type="time" value={form.arrival_time} onChange={e => setForm({...form, arrival_time: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-2">Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Additional details..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white min-h-[80px]" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl">
            <input type="checkbox" checked={form.notify_families} onChange={e => setForm({...form, notify_families: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Create Event</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BULK PRACTICE MODAL (RECURRING)
// ============================================
function BulkPracticeModal({ teams, venues, onClose, onCreate }) {
  const [form, setForm] = useState({
    team_id: '',
    start_time: '18:00',
    end_time: '19:30',
    start_date: '',
    end_date: '',
    notify_families: true
  })
  
  // Track day configurations with their own venues
  const [dayConfigs, setDayConfigs] = useState([])
  const [preview, setPreview] = useState([])
  const [showPreviewEdit, setShowPreviewEdit] = useState(false)

  const dayOptions = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ]

  function toggleDay(dayValue) {
    const existing = dayConfigs.find(d => d.day === dayValue)
    if (existing) {
      setDayConfigs(dayConfigs.filter(d => d.day !== dayValue))
    } else {
      setDayConfigs([...dayConfigs, { 
        day: dayValue, 
        venue_name: '', 
        venue_address: '',
        court_number: '',
        start_time: form.start_time,
        end_time: form.end_time
      }])
    }
  }

  function updateDayConfig(dayValue, field, value) {
    setDayConfigs(dayConfigs.map(d => 
      d.day === dayValue ? { ...d, [field]: value } : d
    ))
  }

  function handleVenueSelectForDay(dayValue, venueName) {
    const venue = venues.find(v => v.name === venueName)
    setDayConfigs(dayConfigs.map(d => 
      d.day === dayValue ? { 
        ...d, 
        venue_name: venue?.name || venueName, 
        venue_address: venue?.address || '' 
      } : d
    ))
  }

  function applyVenueToAllDays(venueName) {
    const venue = venues.find(v => v.name === venueName)
    setDayConfigs(dayConfigs.map(d => ({
      ...d,
      venue_name: venue?.name || venueName,
      venue_address: venue?.address || ''
    })))
  }

  function generatePreview() {
    if (!form.start_date || !form.end_date || dayConfigs.length === 0) {
      setPreview([])
      return
    }

    const events = []
    // Parse as LOCAL dates to avoid UTC timezone offset shifting days
    const [sy, sm, sd] = form.start_date.split('-').map(Number)
    const [ey, em, ed] = form.end_date.split('-').map(Number)
    const start = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayConfig = dayConfigs.find(dc => dc.day === d.getDay())
      if (dayConfig) {
        events.push({
          id: `${d.getTime()}`,
          date: new Date(d),
          dayName: dayOptions.find(opt => opt.value === d.getDay())?.label,
          venue_name: dayConfig.venue_name,
          venue_address: dayConfig.venue_address,
          court_number: dayConfig.court_number || '',
          start_time: dayConfig.start_time || form.start_time,
          end_time: dayConfig.end_time || form.end_time
        })
      }
    }
    setPreview(events)
  }

  useEffect(() => {
    generatePreview()
  }, [form.start_date, form.end_date, dayConfigs])

  function updatePreviewItem(id, field, value) {
    setPreview(preview.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function removePreviewItem(id) {
    setPreview(preview.filter(p => p.id !== id))
  }

  async function handleSubmit() {
    if (preview.length === 0) {
      alert('No practices to create. Please select days and date range.')
      return
    }

    const eventsData = preview.map(p => {
      // Format date as YYYY-MM-DD using LOCAL time (not UTC via toISOString)
      const y = p.date.getFullYear()
      const m = String(p.date.getMonth() + 1).padStart(2, '0')
      const dd = String(p.date.getDate()).padStart(2, '0')
      const eventDate = `${y}-${m}-${dd}`
      
      return {
        team_id: form.team_id || null,
        event_type: 'practice',
        title: 'Practice',
        notes: '',  // Your schema uses 'notes' not 'description'
        event_date: eventDate,  // DATE format: YYYY-MM-DD
        event_time: p.start_time || form.start_time,  // TIME format: HH:MM
        end_time: p.end_time || form.end_time,  // TIME format: HH:MM
        venue_name: p.venue_name || '',
        venue_address: p.venue_address || '',
        court_number: p.court_number || null,
        location_type: 'home'
      }
    })

    const success = await onCreate(eventsData, form.notify_families)
    if (success) onClose()
  }

  const selectedDays = dayConfigs.map(d => d.day)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Recurring Practice</h2>
            <p className="text-sm text-slate-400">Schedule practices with per-day venue control</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Team Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Team</label>
            <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
              <option value="">All Teams / Org-wide</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">First Practice</label>
              <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Last Practice</label>
              <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>

          {/* Default Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Default Start Time</label>
              <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Default End Time</label>
              <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">Practice Days</label>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    selectedDays.includes(day.value)
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-Day Venue Configuration */}
          {dayConfigs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white">Venue per Day</h4>
                {venues.length > 0 && (
                  <select 
                    onChange={e => e.target.value && applyVenueToAllDays(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white"
                  >
                    <option value="">Apply to all days...</option>
                    {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-3">
                {dayConfigs.sort((a, b) => a.day - b.day).map(dc => (
                  <div key={dc.day} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    <div className="w-24 font-medium text-white">
                      {dayOptions.find(d => d.value === dc.day)?.label}
                    </div>
                    <select 
                      value={dc.venue_name}
                      onChange={e => handleVenueSelectForDay(dc.day, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select venue...</option>
                      {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                    </select>
                    <input 
                      type="text"
                      placeholder="Ct #"
                      value={dc.court_number || ''}
                      onChange={e => updateDayConfig(dc.day, 'court_number', e.target.value)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white text-center"
                    />
                    <input 
                      type="time" 
                      value={dc.start_time || form.start_time}
                      onChange={e => updateDayConfig(dc.day, 'start_time', e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                      type="time" 
                      value={dc.end_time || form.end_time}
                      onChange={e => updateDayConfig(dc.day, 'end_time', e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Preview: {preview.length} practices</h4>
                <button 
                  onClick={() => setShowPreviewEdit(!showPreviewEdit)}
                  className="text-xs text-[var(--accent-primary)] hover:text-yellow-300"
                >
                  {showPreviewEdit ? 'Hide Details' : 'Edit Individual Practices'}
                </button>
              </div>
              
              {showPreviewEdit ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {preview.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg text-sm">
                      <span className="w-20 text-slate-400">{p.date.toLocaleDateString()}</span>
                      <span className="w-16 text-white">{p.dayName?.slice(0, 3)}</span>
                      <select 
                        value={p.venue_name}
                        onChange={e => {
                          const venue = venues.find(v => v.name === e.target.value)
                          updatePreviewItem(p.id, 'venue_name', venue?.name || '')
                          updatePreviewItem(p.id, 'venue_address', venue?.address || '')
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="">No venue</option>
                        {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                      <button onClick={() => removePreviewItem(p.id)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.slice(0, 15).map((p, i) => (
                    <div key={p.id} className="text-sm text-slate-400 flex justify-between">
                      <span>{p.dayName} - {p.date.toLocaleDateString()}</span>
                      <span className="text-slate-500">{p.venue_name || 'No venue'}</span>
                    </div>
                  ))}
                  {preview.length > 15 && (
                    <div className="text-sm text-slate-500">...and {preview.length - 15} more</div>
                  )}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl">
            <input type="checkbox" checked={form.notify_families} onChange={e => setForm({...form, notify_families: e.target.checked})}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800">
          <span className="text-slate-400">
            {preview.length > 0 ? `${preview.length} practices will be created` : 'Select days and date range'}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
            <button onClick={handleSubmit} disabled={preview.length === 0}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50">
              Create {preview.length} Practices
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BULK GAMES MODAL
// ============================================
function BulkGamesModal({ teams, venues, onClose, onCreate }) {
  const [games, setGames] = useState([
    { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', court_number: '', location_type: 'home' }
  ])
  const [notifyFamilies, setNotifyFamilies] = useState(true)

  function addRow() {
    setGames([...games, { team_id: '', date: '', time: '10:00', opponent: '', venue_name: '', court_number: '', location_type: 'home' }])
  }

  function removeRow(index) {
    setGames(games.filter((_, i) => i !== index))
  }

  function updateRow(index, field, value) {
    const updated = [...games]
    updated[index][field] = value
    setGames(updated)
  }

  async function handleSubmit() {
    const validGames = games.filter(g => g.date && g.time)
    if (validGames.length === 0) {
      alert('Please enter at least one game with date and time')
      return
    }

    const eventsData = validGames.map(g => {
      const venue = venues.find(v => v.name === g.venue_name)
      
      // Calculate end time (2 hours after start)
      const [hours, minutes] = g.time.split(':')
      const endHours = (parseInt(hours) + 2) % 24
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`

      return {
        team_id: g.team_id || null,
        event_type: 'game',
        title: g.opponent ? `vs ${g.opponent}` : 'Game',
        notes: '',
        event_date: g.date,  // DATE format: YYYY-MM-DD
        event_time: g.time,  // TIME format: HH:MM
        end_time: endTime,   // TIME format: HH:MM
        opponent_name: g.opponent,
        venue_name: g.venue_name,
        venue_address: venue?.address || '',
        court_number: g.court_number || null,
        location_type: g.location_type
      }
    })

    const success = await onCreate(eventsData, notifyFamilies)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Bulk Add Games</h2>
            <p className="text-sm text-slate-400">Enter multiple games at once</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="pb-3 pr-2">Team</th>
                  <th className="pb-3 pr-2">Date</th>
                  <th className="pb-3 pr-2">Time</th>
                  <th className="pb-3 pr-2">Opponent</th>
                  <th className="pb-3 pr-2">Venue</th>
                  <th className="pb-3 pr-2">Ct #</th>
                  <th className="pb-3 pr-2">H/A</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, i) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2">
                      <select value={game.team_id} onChange={e => updateRow(i, 'team_id', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="">All</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="date" value={game.date} onChange={e => updateRow(i, 'date', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="time" value={game.time} onChange={e => updateRow(i, 'time', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="text" value={game.opponent} onChange={e => updateRow(i, 'opponent', e.target.value)}
                        placeholder="Opponent"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <select value={game.venue_name} onChange={e => updateRow(i, 'venue_name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="">Select venue</option>
                        {venues.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                      </select>
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="text" value={game.court_number || ''} onChange={e => updateRow(i, 'court_number', e.target.value)}
                        placeholder="#"
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm text-center" />
                    </td>
                    <td className="pb-2 pr-2">
                      <select value={game.location_type} onChange={e => updateRow(i, 'location_type', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm">
                        <option value="home">Home</option>
                        <option value="away">Away</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </td>
                    <td className="pb-2">
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-300 p-2"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button onClick={addRow} className="mt-4 px-4 py-2 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-[var(--accent-primary)]/30 w-full">
            + Add Another Game
          </button>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl mt-4">
            <input type="checkbox" checked={notifyFamilies} onChange={e => setNotifyFamilies(e.target.checked)}
              className="w-5 h-5 rounded" />
            <span className="text-white">Notify all families after creating</span>
          </label>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800">
          <span className="text-slate-400">
            {games.filter(g => g.date && g.time).length} valid game{games.filter(g => g.date && g.time).length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">
              Create Games
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// VENUE MANAGER MODAL
// ============================================
function VenueManagerModal({ venues, onClose, onSave }) {
  const [localVenues, setLocalVenues] = useState([...venues])
  const [newVenue, setNewVenue] = useState({ name: '', address: '', notes: '' })

  function addVenue() {
    if (!newVenue.name) return
    setLocalVenues([...localVenues, { ...newVenue }])
    setNewVenue({ name: '', address: '', notes: '' })
  }

  function removeVenue(index) {
    setLocalVenues(localVenues.filter((_, i) => i !== index))
  }

  function handleSave() {
    onSave(localVenues)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Manage Venues</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm">Save frequently used locations for quick selection</p>
          
          {/* Existing venues */}
          <div className="space-y-2">
            {localVenues.map((venue, i) => (
              <div key={i} className="bg-slate-900 rounded-xl p-4 flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{venue.name}</p>
                  {venue.address && <p className="text-sm text-slate-400">{venue.address}</p>}
                  {venue.notes && <p className="text-xs text-slate-500 mt-1">{venue.notes}</p>}
                </div>
                <button onClick={() => removeVenue(i)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Add new venue */}
          <div className="border-t border-slate-700 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Add New Venue</h4>
            <div className="space-y-3">
              <input type="text" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})}
                placeholder="Venue name (e.g., Main Gym)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <input type="text" value={newVenue.address} onChange={e => setNewVenue({...newVenue, address: e.target.value})}
                placeholder="Address"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <input type="text" value={newVenue.notes} onChange={e => setNewVenue({...newVenue, notes: e.target.value})}
                placeholder="Notes (e.g., Court 2, Park at back)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              <button onClick={addVenue} disabled={!newVenue.name}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600 disabled:opacity-50">
                + Add Venue
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save Venues</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// AVAILABILITY SURVEY MODAL
// ============================================
function AvailabilitySurveyModal({ teams, organization, onClose, showToast }) {
  const [step, setStep] = useState('create') // create, view
  const [surveys, setSurveys] = useState([])
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  
  // Create form
  const [form, setForm] = useState({
    title: 'Practice Availability',
    team_id: '',
    slots: [
      { day: 'Monday', time: '5:00 PM - 7:00 PM' },
      { day: 'Tuesday', time: '6:00 PM - 8:00 PM' },
      { day: 'Wednesday', time: '5:00 PM - 7:00 PM' },
    ],
    deadline: ''
  })

  useEffect(() => {
    loadSurveys()
  }, [])

  async function loadSurveys() {
    // Load from organization settings
    const existingSurveys = organization.settings?.availability_surveys || []
    setSurveys(existingSurveys)
  }

  function addSlot() {
    setForm({ ...form, slots: [...form.slots, { day: '', time: '' }] })
  }

  function removeSlot(index) {
    setForm({ ...form, slots: form.slots.filter((_, i) => i !== index) })
  }

  function updateSlot(index, field, value) {
    const updated = [...form.slots]
    updated[index][field] = value
    setForm({ ...form, slots: updated })
  }

  async function createSurvey() {
    const newSurvey = {
      id: Date.now().toString(),
      ...form,
      created_at: new Date().toISOString(),
      responses: [],
      status: 'active'
    }

    const updatedSurveys = [...surveys, newSurvey]
    const newSettings = { ...organization.settings, availability_surveys: updatedSurveys }
    
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    
    setSurveys(updatedSurveys)
    showToast('Survey created! Share the link with families.', 'success')
    setSelectedSurvey(newSurvey)
    setStep('view')
  }

  async function deleteSurvey(surveyId) {
    if (!confirm('Delete this survey and all responses?')) return
    const updatedSurveys = surveys.filter(s => s.id !== surveyId)
    const newSettings = { ...organization.settings, availability_surveys: updatedSurveys }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setSurveys(updatedSurveys)
    setSelectedSurvey(null)
    showToast('Survey deleted', 'success')
  }

  function copyShareLink(surveyId) {
    // In production, this would be a real shareable URL
    const link = `${window.location.origin}/availability/${organization.id}/${surveyId}`
    navigator.clipboard.writeText(link)
    showToast('Link copied to clipboard!', 'success')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Availability Survey</h2>
            <p className="text-sm text-slate-400">Collect availability from families</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>

        {step === 'create' ? (
          <div className="p-6 space-y-6">
            {/* Existing surveys */}
            {surveys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Existing Surveys</h3>
                <div className="space-y-2">
                  {surveys.map(survey => (
                    <div key={survey.id} className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{survey.title}</p>
                        <p className="text-sm text-slate-400">{survey.responses?.length || 0} responses</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedSurvey(survey); setStep('view') }}
                          className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-white hover:bg-slate-600">
                          View Results
                        </button>
                        <button onClick={() => copyShareLink(survey.id)}
                          className="px-3 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/30">
                          Copy Link
                        </button>
                        <button onClick={() => deleteSurvey(survey.id)}
                          className="px-3 py-1 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create new survey */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-medium text-white mb-4">Create New Survey</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Survey Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Team (optional)</label>
                  <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                    <option value="">All Teams</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Time Slot Options</label>
                  <div className="space-y-2">
                    {form.slots.map((slot, i) => (
                      <div key={i} className="flex gap-2">
                        <select value={slot.day} onChange={e => updateSlot(i, 'day', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                          <option value="">Select day</option>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input type="text" value={slot.time} onChange={e => updateSlot(i, 'time', e.target.value)}
                          placeholder="e.g., 5:00 PM - 7:00 PM"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-300 px-2"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={addSlot}
                      className="w-full px-4 py-2 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-[var(--accent-primary)]/30">
                      + Add Time Slot
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Response Deadline (optional)</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // View survey results
          <div className="p-6">
            <button onClick={() => setStep('create')} className="text-slate-400 hover:text-white mb-4 flex items-center gap-2">
              ← Back to surveys
            </button>
            
            {selectedSurvey && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedSurvey.title}</h3>
                  <p className="text-sm text-slate-400">{selectedSurvey.responses?.length || 0} responses received</p>
                </div>

                {/* Results heatmap */}
                <div className="bg-slate-900 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-4">Availability Summary</h4>
                  <div className="space-y-3">
                    {selectedSurvey.slots.map((slot, i) => {
                      const available = selectedSurvey.responses?.filter(r => r.available?.includes(i)).length || 0
                      const notAvailable = selectedSurvey.responses?.filter(r => r.notAvailable?.includes(i)).length || 0
                      const total = selectedSurvey.responses?.length || 1
                      const percentage = Math.round((available / total) * 100)
                      
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-40 text-sm text-white">
                            {slot.day} {slot.time}
                          </div>
                          <div className="flex-1 bg-slate-700 rounded-full h-6 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: percentage >= 70 ? '#10B981' : percentage >= 40 ? '#F59E0B' : '#EF4444'
                              }}
                            />
                          </div>
                          <div className="w-24 text-right text-sm">
                            <span className="text-emerald-400">{available}✓</span>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-red-400">{notAvailable}✗</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Individual responses */}
                {selectedSurvey.responses?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Individual Responses</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedSurvey.responses.map((response, i) => (
                        <div key={i} className="bg-slate-900 rounded-lg p-3 text-sm">
                          <p className="text-white font-medium">{response.name}</p>
                          <p className="text-slate-400 text-xs">
                            Available: {response.available?.map(idx => selectedSurvey.slots[idx]?.day).join(', ') || 'None'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => copyShareLink(selectedSurvey.id)}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30">
                    📋 Copy Share Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Close</button>
          {step === 'create' && (
            <button onClick={createSurvey} disabled={form.slots.length === 0}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50">
              Create Survey
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// EVENT DETAIL MODAL (VIEW/EDIT)
// ============================================
function EventDetailModal({ event, teams, venues, onClose, onUpdate, onDelete, activeView, showToast, selectedSeason, parentChildIds = [], onShareGameDay, parentTutorial }) {
  const { isAdmin: hasAdminRole, profile, user } = useAuth()
  // Use activeView if provided, otherwise fall back to admin role check
  const isAdminView = activeView ? (activeView === 'admin' || activeView === 'coach') : hasAdminRole
  const isCoachView = activeView === 'coach'
  const isParentView = activeView === 'parent'
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [showGameCompletion, setShowGameCompletion] = useState(false)
  const [lineupCount, setLineupCount] = useState(0)
  
  // Rich data
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [volunteers, setVolunteers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedCoach, setSelectedCoach] = useState(null)
  
  // View controls
  const [showPhotos, setShowPhotos] = useState(true)
  const [availableParents, setAvailableParents] = useState([])
  const [volunteerAssignModal, setVolunteerAssignModal] = useState(null)
  
  const [form, setForm] = useState({
    team_id: event.team_id || '',
    event_type: event.event_type || 'practice',
    title: event.title || '',
    description: event.description || '',
    start_date: event.event_date || (event.start_time ? new Date(event.start_time).toISOString().split('T')[0] : ''),
    start_time: event.event_time || (event.start_time ? new Date(event.start_time).toTimeString().slice(0, 5) : ''),
    end_time: event.end_time || '',
    venue_name: event.venue_name || '',
    venue_address: event.venue_address || '',
    court_number: event.court_number || '',
    location_type: event.location_type || 'home',
    opponent_name: event.opponent_name || ''
  })

  useEffect(() => {
    if (event?.id) loadEventData()
  }, [event?.id])

  async function loadEventData() {
    setLoading(true)
    try {
      // Load team roster if team is assigned
      if (event.team_id) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('*, players(id, first_name, last_name, jersey_number, position, photo_url, grade, status)')
          .eq('team_id', event.team_id)
        setRoster(teamPlayers?.map(tp => tp.players).filter(Boolean) || [])

        // Load coaches for this team
        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('*, coaches(id, first_name, last_name, email, phone)')
          .eq('team_id', event.team_id)
        // Merge coach data with role from team_coaches join table
        setCoaches(teamCoaches?.map(tc => tc.coaches ? { ...tc.coaches, role: tc.role } : null).filter(Boolean) || [])
      }

      // Load RSVPs for this event
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', event.id)
      
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
      setRsvps(rsvpMap)

      // Load volunteers for this event
      const { data: volunteerData } = await supabase
        .from('event_volunteers')
        .select('*, profiles(id, full_name, email)')
        .eq('event_id', event.id)
      setVolunteers(volunteerData || [])

      // Load lineup count for games
      if (event.event_type === 'game') {
        const { count } = await supabase
          .from('game_lineups')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('is_starter', true)
        setLineupCount(count || 0)
      }

      // Load available parents for volunteer assignment
      const { data: parentsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, email')
        .order('first_name')
      setAvailableParents(parentsData || [])

    } catch (err) {
      console.error('Error loading event data:', err)
    }
    setLoading(false)
  }

  async function updateRsvp(playerId, status) {
    const existing = rsvps[playerId]
    
    if (existing) {
      await supabase.from('event_rsvps')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('event_rsvps').insert({
        event_id: event.id,
        player_id: playerId,
        status,
        responded_at: new Date().toISOString()
      })
    }
    
    // Refresh RSVPs
    const { data: rsvpData } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', event.id)
    
    const rsvpMap = {}
    rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
    setRsvps(rsvpMap)
    
    // Complete parent journey step for first RSVP
    if (activeView === 'parent') {
      parentTutorial?.completeStep?.('first_rsvp')
    }
  }

  async function removeVolunteer(volunteerId) {
    await supabase.from('event_volunteers').delete().eq('id', volunteerId)
    setVolunteers(volunteers.filter(v => v.id !== volunteerId))
  }

  async function assignVolunteer(role, position, profileId) {
    // Check if slot is taken
    const existing = volunteers.find(v => v.role === role && v.position === position)
    if (existing) return

    const { data, error } = await supabase
      .from('event_volunteers')
      .insert({
        event_id: event.id,
        profile_id: profileId,
        role,
        position
      })
      .select('*, profiles(id, full_name, email)')
      .single()

    if (!error && data) {
      setVolunteers([...volunteers, data])
    }
  }

  async function handleSave() {
    const success = await onUpdate(event.id, {
      team_id: form.team_id || null,
      event_type: form.event_type,
      title: form.title,
      description: form.description,
      event_date: form.start_date,
      event_time: form.start_time,
      end_time: form.end_time,
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      court_number: form.court_number || null,
      location_type: form.location_type,
      opponent_name: form.opponent_name
    })
    if (success) {
      setIsEditing(false)
      loadEventData()
    }
  }

  // RSVP counts
  const rsvpCounts = {
    yes: Object.values(rsvps).filter(r => r.status === 'yes').length,
    no: Object.values(rsvps).filter(r => r.status === 'no').length,
    maybe: Object.values(rsvps).filter(r => r.status === 'maybe').length,
    pending: roster.length - Object.keys(rsvps).length
  }

  // Volunteer helpers
  const getVolunteer = (role, position) => volunteers.find(v => v.role === role && v.position === position)
  const isGame = event.event_type === 'game'

  const tabs = [
    { id: 'details', label: 'Details', icon: 'clipboard' },
    { id: 'roster', label: `Roster (${roster.length})`, icon: 'users' },
    { id: 'rsvp', label: `RSVPs`, icon: '✓', badge: rsvpCounts.pending > 0 ? rsvpCounts.pending : null },
    ...(isGame ? [{ id: 'volunteers', label: 'Volunteers', icon: '🙋' }] : []),
    { id: 'coaches', label: `Coaches (${coaches.length})`, icon: 'user-cog' },
    ...(isGame && isAdminView ? [{ id: 'gameprep', label: 'Game Prep', icon: 'volleyball' }] : [])
  ]

  const teamColor = event.teams?.color || '#EAB308'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between" style={{ borderLeftColor: teamColor, borderLeftWidth: 4 }}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{event.event_type === 'game' ? '🏐' : event.event_type === 'practice' ? '🏃' : event.event_type === 'tournament' ? '🏆' : '📅'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{event.title || (event.event_type === 'game' ? `vs ${event.opponent_name || 'TBD'}` : event.event_type)}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: getEventColor(event.event_type) + '30', color: getEventColor(event.event_type) }}>
                  {event.event_type}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
                {event.event_time && ` • ${formatTime12(event.event_time)}`}
                {event.teams?.name && ` • ${event.teams.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Share Game Day Card — for games/tournaments */}
            {(event.event_type === 'game' || event.event_type === 'tournament') && onShareGameDay && (
              <button
                onClick={() => onShareGameDay(event)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/30 transition text-xs font-bold"
                title="Share Game Day Card"
              >
                🏟️ Share
              </button>
            )}
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className={`p-2 rounded-lg transition ${showPhotos ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              title={showPhotos ? 'Hide Photos' : 'Show Photos'}
            >
              📷
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl p-2">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' 
                  : 'text-slate-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading event details...</div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                isEditing ? (
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Event Type</label>
                        <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                          <option value="practice">Practice</option>
                          <option value="game">Game</option>
                          <option value="tournament">Tournament</option>
                          <option value="team_event">Team Event</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Team</label>
                        <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                          <option value="">All Teams</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Title</label>
                      <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                        placeholder="e.g., Week 3 Practice"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Date</label>
                        <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                        <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">End Time</label>
                        <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Venue</label>
                        <input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Address</label>
                        <input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Court / Field #</label>
                      <input type="text" value={form.court_number} onChange={e => setForm({...form, court_number: e.target.value})}
                        placeholder="e.g., Court 3, Field A"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>

                    {form.event_type === 'game' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Opponent</label>
                          <input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Location Type</label>
                          <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                            <option value="home">Home</option>
                            <option value="away">Away</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Notes</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white min-h-[80px]" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Event Info */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase">Event Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <DetailItem label="Date" value={event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'} />
                          <DetailItem label="Time" value={event.event_time ? `${formatTime12(event.event_time)}${event.end_time ? ` - ${formatTime12(event.end_time)}` : ''}` : 'TBD'} />
                        </div>
                        {event.venue_name && <DetailItem label="Venue" value={event.venue_name} />}
                        {event.venue_address && <DetailItem label="Address" value={event.venue_address} />}
                        {event.court_number && <DetailItem label="Court / Field" value={event.court_number} />}
                        {event.teams?.name && <DetailItem label="Team" value={event.teams.name} highlight={teamColor} />}
                        {event.opponent_name && <DetailItem label="Opponent" value={event.opponent_name} />}
                        {event.location_type && isGame && <DetailItem label="Location" value={event.location_type.charAt(0).toUpperCase() + event.location_type.slice(1)} />}
                      </div>

                      {event.description && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">Notes</h4>
                          <p className="text-white text-sm">{event.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Quick Stats */}
                    <div className="space-y-4">
                      {/* RSVP Summary */}
                      <div className="bg-slate-900 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase">RSVP Summary</h4>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-xs text-[var(--accent-primary)] hover:underline"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-emerald-400">{rsvpCounts.yes}</div>
                            <div className="text-xs text-emerald-400">Going</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-red-400">{rsvpCounts.no}</div>
                            <div className="text-xs text-red-400">No</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-[var(--accent-primary)]">{rsvpCounts.maybe}</div>
                            <div className="text-xs text-[var(--accent-primary)]">Maybe</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-slate-400">{rsvpCounts.pending}</div>
                            <div className="text-xs text-slate-400">Pending</div>
                          </button>
                        </div>
                      </div>

                      {/* Volunteers Summary (Games only) */}
                      {isGame && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Volunteers</h4>
                          <div className="space-y-2">
                            <VolunteerSlot 
                              role="Line Judge" 
                              volunteer={getVolunteer('line_judge', 'primary')} 
                              icon="🚩"
                              onClick={() => setActiveTab('volunteers')}
                            />
                            <VolunteerSlot 
                              role="Scorekeeper" 
                              volunteer={getVolunteer('scorekeeper', 'primary')} 
                              icon="clipboard"
                              onClick={() => setActiveTab('volunteers')}
                            />
                          </div>
                        </div>
                      )}

                      {/* Coaches */}
                      {coaches.length > 0 && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Coaches</h4>
                          <div className="space-y-2">
                            {coaches.map(coach => (
                              <div key={coach.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800">
                                {showPhotos && coach.photo_url ? (
                                  <img src={coach.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">Coach</div>
                                )}
                                <div>
                                  <ClickableCoachName 
                                    coach={coach}
                                    onCoachSelect={setSelectedCoach}
                                    className="text-white text-sm"
                                  />
                                  <div className="text-xs text-slate-500">{coach.role || 'Coach'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Roster Tab */}
              {activeTab === 'roster' && (
                <div>
                  {roster.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10" />
                      <p className="text-slate-400 mt-4">No players on roster</p>
                      {!event.team_id && <p className="text-slate-500 text-sm mt-2">Assign a team to see roster</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {roster.map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          context="attendance"
                          teamColor={teamColor}
                          showPhoto={showPhotos}
                          size="small"
                          onClick={() => setSelectedPlayer(player)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RSVP Tab */}
              {activeTab === 'rsvp' && (
                <div>
                  {/* RSVP Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-400">{rsvpCounts.yes}</div>
                      <div className="text-sm text-emerald-400">Going</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-red-400">{rsvpCounts.no}</div>
                      <div className="text-sm text-red-400">Can't Go</div>
                    </div>
                    <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-[var(--accent-primary)]">{rsvpCounts.maybe}</div>
                      <div className="text-sm text-[var(--accent-primary)]">Maybe</div>
                    </div>
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-slate-400">{rsvpCounts.pending}</div>
                      <div className="text-sm text-slate-400">Pending</div>
                    </div>
                  </div>

                  {/* Player RSVP List */}
                  {roster.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      {!event.team_id ? 'Assign a team to manage RSVPs' : 'No players on roster'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roster.map(player => {
                        const rsvp = rsvps[player.id]
                        // Parents can only RSVP for their own children
                        const canRsvp = !isParentView || parentChildIds.includes(player.id)
                        const isOwnChild = parentChildIds.includes(player.id)
                        
                        return (
                          <div key={player.id} className={`bg-slate-900 rounded-xl p-3 flex items-center justify-between ${isParentView && isOwnChild ? 'ring-2 ring-[var(--accent-primary)]/50' : ''}`}>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                              {showPhotos && (
                                player.photo_url ? (
                                  <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-500"><User className="w-6 h-6" /></div>
                                )
                              )}
                              {player.jersey_number && (
                                <span className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold" style={{ backgroundColor: teamColor + '30', color: teamColor }}>
                                  {player.jersey_number}
                                </span>
                              )}
                              <div>
                                <div className="text-white font-medium">
                                  {player.first_name} {player.last_name}
                                  {isParentView && isOwnChild && <span className="ml-2 text-xs text-[var(--accent-primary)]">(Your child)</span>}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {player.position && <span className="mr-2">{player.position}</span>}
                                  {player.grade && <span>Grade {player.grade}</span>}
                                </div>
                              </div>
                            </div>
                            {canRsvp ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateRsvp(player.id, 'yes')}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    rsvp?.status === 'yes' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                                  }`}
                                >
                                  ✓ Yes
                                </button>
                                <button
                                  onClick={() => updateRsvp(player.id, 'no')}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    rsvp?.status === 'no' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                                  }`}
                                >
                                  ✗ No
                                </button>
                                <button
                                  onClick={() => updateRsvp(player.id, 'maybe')}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    rsvp?.status === 'maybe' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)]'
                                  }`}
                                >
                                  ? Maybe
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  rsvp?.status === 'yes' ? 'bg-emerald-500/20 text-emerald-400' :
                                  rsvp?.status === 'no' ? 'bg-red-500/20 text-red-400' :
                                  rsvp?.status === 'maybe' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-slate-700/50 text-slate-500'
                                }`}>
                                  {rsvp?.status === 'yes' ? '✓ Going' :
                                   rsvp?.status === 'no' ? '✗ Not Going' :
                                   rsvp?.status === 'maybe' ? '? Maybe' :
                                   'Pending'}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Volunteers Tab */}
              {activeTab === 'volunteers' && isGame && (
                <div className="space-y-6">
                  {/* Current user's volunteer status */}
                  {!isAdminView && user?.id && (
                    <div className={`p-4 rounded-xl ${volunteers.some(v => v.profile_id === user.id) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'}`}>
                      {volunteers.some(v => v.profile_id === user.id) ? (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-6 h-6" />
                          <div>
                            <p className="text-emerald-400 font-medium">You're signed up!</p>
                            <p className="text-emerald-400/70 text-sm">
                              {volunteers.find(v => v.profile_id === user.id)?.role === 'line_judge' ? 'Line Judge' : 'Scorekeeper'}
                              {' - '}
                              {volunteers.find(v => v.profile_id === user.id)?.position === 'primary' ? 'Primary' : 'Backup'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🙋</span>
                          <div>
                            <p className="text-[var(--accent-primary)] font-medium">Volunteers needed!</p>
                            <p className="text-[var(--accent-primary)]/70 text-sm">Click a slot below to sign up</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Line Judge */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🚩</span> Line Judge
                    </h4>
                    <div className="space-y-2">
                      {['primary', 'backup_1', 'backup_2'].map(position => {
                        const volunteer = getVolunteer('line_judge', position)
                        const isAssigning = volunteerAssignModal?.role === 'line_judge' && volunteerAssignModal?.position === position
                        const isCurrentUser = volunteer?.profile_id === user?.id
                        const userAlreadyVolunteering = volunteers.some(v => v.profile_id === user?.id)
                        
                        return (
                          <div key={position} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <span className={position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500'}>
                                {position === 'primary' ? <Star className="w-4 h-4" /> : ''}
                              </span>
                              <span className="text-slate-400 text-sm w-20">{position === 'primary' ? 'Primary' : position.replace('_', ' ').replace('backup', 'Backup')}</span>
                              {volunteer ? (
                                <span className={isCurrentUser ? 'text-emerald-400 font-medium' : 'text-white'}>
                                  {isCurrentUser ? 'You' : (volunteer.profiles?.full_name || 'Volunteer')}
                                </span>
                              ) : isAdminView ? (
                                isAssigning ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      autoFocus
                                      onChange={(e) => {
                                        if (e.target.value) assignVolunteer('line_judge', position, e.target.value)
                                        setVolunteerAssignModal(null)
                                      }}
                                      onBlur={() => setVolunteerAssignModal(null)}
                                      className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                    >
                                      <option value="">Select parent...</option>
                                      {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id)).map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name || `${parent.first_name} ${parent.last_name}`}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => setVolunteerAssignModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setVolunteerAssignModal({ role: 'line_judge', position })} className="text-[var(--accent-primary)] hover:underline text-sm">+ Assign</button>
                                )
                              ) : (
                                <button
                                  onClick={() => assignVolunteer('line_judge', position, user?.id)}
                                  disabled={userAlreadyVolunteering}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${userAlreadyVolunteering ? 'bg-gray-500/20 text-slate-500 cursor-not-allowed' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-yellow-400/30'}`}
                                >
                                  {userAlreadyVolunteering ? 'Open' : '🙋 Sign Up'}
                                </button>
                              )}
                            </div>
                            {volunteer && (isAdminView || isCurrentUser) && (
                              <button onClick={() => removeVolunteer(volunteer.id)} className="text-red-400 hover:text-red-300 text-sm">
                                {isCurrentUser ? 'Cancel' : 'Remove'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Scorekeeper */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" /> Scorekeeper
                    </h4>
                    <div className="space-y-2">
                      {['primary', 'backup_1', 'backup_2'].map(position => {
                        const volunteer = getVolunteer('scorekeeper', position)
                        const isAssigning = volunteerAssignModal?.role === 'scorekeeper' && volunteerAssignModal?.position === position
                        const isCurrentUser = volunteer?.profile_id === user?.id
                        const userAlreadyVolunteering = volunteers.some(v => v.profile_id === user?.id)
                        
                        return (
                          <div key={position} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <span className={position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500'}>
                                {position === 'primary' ? <Star className="w-4 h-4" /> : ''}
                              </span>
                              <span className="text-slate-400 text-sm w-20">{position === 'primary' ? 'Primary' : position.replace('_', ' ').replace('backup', 'Backup')}</span>
                              {volunteer ? (
                                <span className={isCurrentUser ? 'text-emerald-400 font-medium' : 'text-white'}>
                                  {isCurrentUser ? 'You' : (volunteer.profiles?.full_name || 'Volunteer')}
                                </span>
                              ) : isAdminView ? (
                                isAssigning ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      autoFocus
                                      onChange={(e) => {
                                        if (e.target.value) assignVolunteer('scorekeeper', position, e.target.value)
                                        setVolunteerAssignModal(null)
                                      }}
                                      onBlur={() => setVolunteerAssignModal(null)}
                                      className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                    >
                                      <option value="">Select parent...</option>
                                      {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id)).map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name || `${parent.first_name} ${parent.last_name}`}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => setVolunteerAssignModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setVolunteerAssignModal({ role: 'scorekeeper', position })} className="text-[var(--accent-primary)] hover:underline text-sm">+ Assign</button>
                                )
                              ) : (
                                <button
                                  onClick={() => assignVolunteer('scorekeeper', position, user?.id)}
                                  disabled={userAlreadyVolunteering}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${userAlreadyVolunteering ? 'bg-gray-500/20 text-slate-500 cursor-not-allowed' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-yellow-400/30'}`}
                                >
                                  {userAlreadyVolunteering ? 'Open' : '🙋 Sign Up'}
                                </button>
                              )}
                            </div>
                            {volunteer && (isAdminView || isCurrentUser) && (
                              <button onClick={() => removeVolunteer(volunteer.id)} className="text-red-400 hover:text-red-300 text-sm">
                                {isCurrentUser ? 'Cancel' : 'Remove'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm text-center">
                    {isAdminView ? 'Assign parents to volunteer slots above.' : 'Thank you for volunteering! Your help makes our league possible.'}
                  </p>
                </div>
              )}

              {/* Coaches Tab */}
              {activeTab === 'coaches' && (
                <div>
                  {coaches.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-4xl">Coach</span>
                      <p className="text-slate-400 mt-4">No coaches assigned</p>
                      {!event.team_id && <p className="text-slate-500 text-sm mt-2">Assign a team to see coaches</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coaches.map(coach => (
                        <div key={coach.id} className="bg-slate-900 rounded-xl p-4 flex items-center gap-4">
                          {showPhotos && coach.photo_url ? (
                            <img src={coach.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">Coach</div>
                          )}
                          <div className="flex-1">
                            <ClickableCoachName 
                              coach={coach}
                              onCoachSelect={setSelectedCoach}
                              className="text-white font-semibold text-lg"
                            />
                            <div className="text-slate-400 text-sm">{coach.role || 'Coach'}</div>
                            <div className="flex gap-4 mt-2">
                              {coach.email && (
                                <a href={`mailto:${coach.email}`} className="text-[var(--accent-primary)] hover:underline text-sm">Email</a>
                              )}
                              {coach.phone && (
                                <a href={`tel:${coach.phone}`} className="text-[var(--accent-primary)] hover:underline text-sm">Call</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Game Prep Tab - For coaches/admins on games */}
              {activeTab === 'gameprep' && isGame && (
                <div className="space-y-4">
                  {/* Game Status Banner */}
                  {event.game_status === 'completed' ? (
                    <div className={`p-4 rounded-xl ${
                      event.game_result === 'win' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                      event.game_result === 'loss' ? 'bg-red-500/20 border border-red-500/30' :
                      'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl mr-2">
                            {event.game_result === 'win' ? '🏆' : event.game_result === 'loss' ? '📊' : '🤝'}
                          </span>
                          <span className={`text-lg font-bold ${
                            event.game_result === 'win' ? 'text-emerald-400' :
                            event.game_result === 'loss' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {event.game_result === 'win' ? 'VICTORY' : event.game_result === 'loss' ? 'DEFEAT' : 'TIE'}
                          </span>
                        </div>
                        <div className="text-right">
                          {/* Set-based scoring (volleyball) */}
                          {event.set_scores && event.our_sets_won !== undefined ? (
                            <>
                              <p className="text-3xl font-bold text-white">
                                {event.our_sets_won} - {event.opponent_sets_won}
                              </p>
                              <p className="text-sm text-slate-300">
                                {event.set_scores
                                  .filter(s => s && (s.our > 0 || s.their > 0))
                                  .map((s, i) => `${s.our}-${s.their}`)
                                  .join(', ')}
                              </p>
                              <p className="text-xs text-slate-400">{event.our_score} total pts</p>
                            </>
                          ) : (
                            <>
                              <p className="text-3xl font-bold text-white">
                                {event.our_score} - {event.opponent_score}
                              </p>
                              <p className="text-xs text-slate-400">Final Score</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⏰</span>
                          <div>
                            <p className="text-amber-400 font-semibold">Game Scheduled</p>
                            <p className="text-slate-400 text-sm">Ready for game day</p>
                          </div>
                        </div>
                        {isAdminView && (
                          <button
                            onClick={() => setShowGameCompletion(true)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
                          >
                            🏁 Complete Game
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions for Game Day */}
                  {event.game_status !== 'completed' && (
                    <div className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Game Day Prep</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setShowLineupBuilder(true)}
                          className={`flex items-center gap-3 p-4 rounded-xl transition text-left ${
                            lineupCount >= 6 
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30' 
                              : 'bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30'
                          }`}
                        >
                          <ClipboardList className="w-7 h-7" />
                          <div>
                            <p className="text-white font-semibold">Set Lineup</p>
                            <p className="text-slate-400 text-xs">
                              {lineupCount >= 6 ? `✓ ${lineupCount} starters set` : `${lineupCount}/6 positions filled`}
                            </p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('rsvp')}
                          className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition text-left"
                        >
                          <span className="text-2xl">✓</span>
                          <div>
                            <p className="text-white font-semibold">Check Attendance</p>
                            <p className="text-slate-400 text-xs">{rsvpCounts.yes} confirmed, {rsvpCounts.pending} pending</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('roster')}
                          className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition text-left"
                        >
                          <Users className="w-7 h-7" />
                          <div>
                            <p className="text-white font-semibold">View Roster</p>
                            <p className="text-slate-400 text-xs">{roster.length} players</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('volunteers')}
                          className="flex items-center gap-3 p-4 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition text-left"
                        >
                          <span className="text-2xl">🙋</span>
                          <div>
                            <p className="text-white font-semibold">Volunteers</p>
                            <p className="text-slate-400 text-xs">{volunteers.length} assigned</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Game Info Summary */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">📍 Game Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-xs">Opponent</p>
                        <p className="text-white font-semibold text-lg">{event.opponent_name || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Location</p>
                        <p className="text-white font-semibold">{event.location_type === 'home' ? '🏠 Home' : event.location_type === 'away' ? '✈️ Away' : '🏟️ Neutral'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Venue</p>
                        <p className="text-white">{event.venue_name || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Time</p>
                        <p className="text-white">{event.event_time ? formatTime12(event.event_time) : 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coach Notes */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">📝 Game Notes</h4>
                    <p className="text-slate-300 text-sm">{event.description || event.notes || 'No notes added'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex justify-between">
          <button onClick={() => onDelete(event.id)} className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl">
            🗑️ Delete Event
          </button>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Close</button>
                <button onClick={() => setIsEditing(true)} className="px-6 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit className="w-4 h-4 inline mr-1" />Edit Event</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Player Card Expanded Modal */}
{selectedPlayer && (
  <PlayerCardExpanded
    player={selectedPlayer}
    visible={!!selectedPlayer}
    onClose={() => setSelectedPlayer(null)}
    context="roster"
    viewerRole="admin"
    seasonId={selectedSeason?.id}
    sport={selectedSeason?.sport || 'volleyball'}
    isOwnChild={false}
  />
)}

      {/* Coach Detail Modal */}
      {selectedCoach && (
        <CoachDetailModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
        />
      )}

      {/* Lineup Builder Modal */}
      {showLineupBuilder && event.team_id && (
        <LineupBuilder
          event={event}
          team={teams?.find(t => t.id === event.team_id) || { id: event.team_id, name: event.teams?.name }}
          onClose={() => setShowLineupBuilder(false)}
          showToast={showToast}
          sport={selectedSeason?.sport || selectedSeason?.sports?.name || 'volleyball'}
          onSave={async () => {
            // Refresh lineup count
            const { count } = await supabase
              .from('game_lineups')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('is_starter', true)
            setLineupCount(count || 0)
          }}
        />
      )}
      
      {/* Game Completion Modal */}
      {showGameCompletion && event.team_id && (
        <GameCompletionModal
          event={event}
          team={teams?.find(t => t.id === event.team_id) || { id: event.team_id, name: event.teams?.name }}
          roster={roster}
          onClose={() => setShowGameCompletion(false)}
          onComplete={() => {
            onUpdate?.(event.id, { game_status: 'completed' })
            onClose()
          }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// Helper components for Rich Event Modal
function DetailItem({ label, value, highlight }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-white font-medium" style={highlight ? { color: highlight } : {}}>{value || '—'}</div>
    </div>
  )
}

function VolunteerSlot({ role, volunteer, icon, onClick }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-slate-400 text-sm">{role}</span>
      </div>
      {volunteer ? (
        <span className="text-emerald-400 text-sm">{volunteer.profiles?.full_name || 'Assigned'}</span>
      ) : (
        <button 
          onClick={onClick}
          className="text-[var(--accent-primary)] text-sm hover:underline"
        >
          Need Volunteer →
        </button>
      )}
    </div>
  )
}

// Export
export { SchedulePage, getEventColor, formatTime, formatTime12 }
