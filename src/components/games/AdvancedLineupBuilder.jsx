import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// ============================================
// INLINE ICONS
// ============================================
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const ChevronLeftIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const RotateIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

const SaveIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

// ============================================
// SPORT CONFIGURATIONS
// ============================================
const SPORT_CONFIGS = {
  volleyball: {
    name: 'Volleyball',
    icon: '🏐',
    starterCount: 6,
    hasRotations: true,
    rotationCount: 6,
    hasLibero: true,
    hasSets: true,
    maxSets: 5,
    formations: {
      '5-1': {
        name: '5-1 Offense',
        description: '1 setter runs all rotations',
        positions: [
          { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'OH', color: '#EF4444', row: 'back' },
          { id: 2, name: 'P2', label: 'Right Front', role: 'OPP', color: '#6366F1', row: 'front' },
          { id: 3, name: 'P3', label: 'Middle Front', role: 'MB', color: '#F59E0B', row: 'front' },
          { id: 4, name: 'P4', label: 'Left Front', role: 'OH', color: '#EF4444', row: 'front' },
          { id: 5, name: 'P5', label: 'Left Back', role: 'MB', color: '#F59E0B', row: 'back' },
          { id: 6, name: 'P6', label: 'Middle Back', role: 'S', color: '#10B981', row: 'back' },
        ],
      },
      '6-2': {
        name: '6-2 Offense',
        description: '2 setters, setter always back row',
        positions: [
          { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'S', color: '#10B981', row: 'back' },
          { id: 2, name: 'P2', label: 'Right Front', role: 'OH', color: '#EF4444', row: 'front' },
          { id: 3, name: 'P3', label: 'Middle Front', role: 'MB', color: '#F59E0B', row: 'front' },
          { id: 4, name: 'P4', label: 'Left Front', role: 'OH', color: '#EF4444', row: 'front' },
          { id: 5, name: 'P5', label: 'Left Back', role: 'MB', color: '#F59E0B', row: 'back' },
          { id: 6, name: 'P6', label: 'Middle Back', role: 'S', color: '#10B981', row: 'back' },
        ],
      },
      '4-2': {
        name: '4-2 Simple',
        description: 'Simple rotation for beginners',
        positions: [
          { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'S', color: '#10B981', row: 'back' },
          { id: 2, name: 'P2', label: 'Right Front', role: 'H', color: '#EF4444', row: 'front' },
          { id: 3, name: 'P3', label: 'Middle Front', role: 'H', color: '#EF4444', row: 'front' },
          { id: 4, name: 'P4', label: 'Left Front', role: 'S', color: '#10B981', row: 'front' },
          { id: 5, name: 'P5', label: 'Left Back', role: 'H', color: '#EF4444', row: 'back' },
          { id: 6, name: 'P6', label: 'Middle Back', role: 'H', color: '#EF4444', row: 'back' },
        ],
      },
      '6-6': {
        name: '6-6 Recreational',
        description: 'Everyone rotates all positions',
        positions: [
          { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'P1', color: '#3B82F6', row: 'back' },
          { id: 2, name: 'P2', label: 'Right Front', role: 'P2', color: '#10B981', row: 'front' },
          { id: 3, name: 'P3', label: 'Middle Front', role: 'P3', color: '#F59E0B', row: 'front' },
          { id: 4, name: 'P4', label: 'Left Front', role: 'P4', color: '#EF4444', row: 'front' },
          { id: 5, name: 'P5', label: 'Left Back', role: 'P5', color: '#8B5CF6', row: 'back' },
          { id: 6, name: 'P6', label: 'Middle Back', role: 'P6', color: '#EC4899', row: 'back' },
        ],
      },
    },
  },
  basketball: {
    name: 'Basketball',
    icon: '🏀',
    starterCount: 5,
    hasRotations: false,
    hasLibero: false,
    hasSets: false,
    formations: {
      'standard': {
        name: 'Standard',
        positions: [
          { id: 1, name: 'PG', label: 'Point Guard', role: 'PG', color: '#3B82F6' },
          { id: 2, name: 'SG', label: 'Shooting Guard', role: 'SG', color: '#10B981' },
          { id: 3, name: 'SF', label: 'Small Forward', role: 'SF', color: '#F59E0B' },
          { id: 4, name: 'PF', label: 'Power Forward', role: 'PF', color: '#EF4444' },
          { id: 5, name: 'C', label: 'Center', role: 'C', color: '#8B5CF6' },
        ],
      },
    },
  },
  soccer: {
    name: 'Soccer',
    icon: '⚽',
    starterCount: 11,
    hasRotations: false,
    hasLibero: false,
    hasSets: false,
    formations: {
      '4-4-2': {
        name: '4-4-2',
        positions: [
          { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B' },
          { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6' },
          { id: 3, name: 'CB1', label: 'Center Back', role: 'DEF', color: '#3B82F6' },
          { id: 4, name: 'CB2', label: 'Center Back', role: 'DEF', color: '#3B82F6' },
          { id: 5, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6' },
          { id: 6, name: 'LM', label: 'Left Mid', role: 'MID', color: '#10B981' },
          { id: 7, name: 'CM1', label: 'Center Mid', role: 'MID', color: '#10B981' },
          { id: 8, name: 'CM2', label: 'Center Mid', role: 'MID', color: '#10B981' },
          { id: 9, name: 'RM', label: 'Right Mid', role: 'MID', color: '#10B981' },
          { id: 10, name: 'ST1', label: 'Striker', role: 'FWD', color: '#EF4444' },
          { id: 11, name: 'ST2', label: 'Striker', role: 'FWD', color: '#EF4444' },
        ],
      },
    },
  },
}

// ============================================
// PLAYER CARD COMPONENT
// ============================================
function PlayerCard({ 
  player, 
  position, 
  isServing, 
  isLibero, 
  isSelected,
  showRsvp = true,
  rsvpStatus,
  compact = false,
  onClick,
  onRemove,
  draggable = false,
  onDragStart,
  onDragEnd
}) {
  const rsvpColors = {
    yes: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    attending: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    no: 'bg-red-100 text-red-700 border-red-300',
    not_attending: 'bg-red-100 text-red-700 border-red-300',
    maybe: 'bg-amber-100 text-amber-700 border-amber-300',
    pending: 'bg-slate-100 text-slate-600 border-slate-300',
  }
  
  const rsvpLabels = {
    yes: 'Going', attending: 'Going',
    no: 'No', not_attending: 'No',
    maybe: 'Maybe', pending: 'Pending'
  }
  
  const positionColors = {
    'OH': '#FF6B6B', 'S': '#4ECDC4', 'MB': '#45B7D1', 'OPP': '#96CEB4',
    'L': '#FFEAA7', 'DS': '#DDA0DD', 'RS': '#FF9F43', 'H': '#EF4444'
  }
  const posColor = positionColors[player.position] || positionColors[position?.role] || '#6366F1'

  // Compact mode - for sidebar roster list
  if (compact) {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={`flex items-center gap-4 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
          isSelected ? 'border-[#4BB9EC]' : 'border-transparent hover:border-[#4BB9EC]/20'
        } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ background: 'rgba(15,20,35,0.7)' }}
      >
        {/* Photo with position badge */}
        <div className="relative">
          {player.photo_url ? (
            <img
              src={player.photo_url}
              className="w-14 h-14 rounded-xl object-cover object-top"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: posColor + '30' }}
            >
              <span className="text-2xl font-bold" style={{ color: posColor }}>
                {player.jersey_number || '?'}
              </span>
            </div>
          )}
          {/* Position badge */}
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900"
            style={{ backgroundColor: position?.color || posColor }}
          >
            {player.position || position?.role || '?'}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-lg truncate">
            #{player.jersey_number} {player.first_name}
          </p>
          <p className="text-base text-slate-500">{player.position || position?.role || 'Player'}</p>
        </div>

        {showRsvp && rsvpStatus && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${rsvpColors[rsvpStatus] || rsvpColors.pending}`}>
            {rsvpLabels[rsvpStatus] || 'Pending'}
          </span>
        )}
      </div>
    )
  }

  // Full card mode - for court positions (Game Day style)
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden transition-all hover:shadow-xl group h-[160px] ${
        isServing ? 'ring-2 ring-emerald-400 ring-offset-2' :
        isLibero ? 'ring-2 ring-pink-400 ring-offset-2' :
        isSelected ? 'ring-2 ring-[#4BB9EC] ring-offset-2' : ''
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{ minWidth: '130px' }}
    >
      {/* Full bleed photo background */}
      {player.photo_url ? (
        <img
          src={player.photo_url}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${posColor}40 0%, #1e293b 100%)`
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-black" style={{ color: posColor + '80' }}>
              {player.jersey_number || '?'}
            </span>
          </div>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)'
        }}
      />

      {/* Position badge - top left */}
      {position && (
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-md text-base font-bold text-white shadow-lg"
          style={{ backgroundColor: position.color }}
        >
          {position.role || position.name}
        </div>
      )}

      {/* Jersey number - top right */}
      <div className="absolute top-3 right-3 text-white text-3xl font-black opacity-90">
        #{player.jersey_number || '?'}
      </div>

      {/* Serving badge */}
      {isServing && (
        <div className="absolute top-3 right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
          🏐
        </div>
      )}

      {/* Libero badge */}
      {isLibero && !isServing && (
        <div className="absolute top-3 right-10 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-base font-bold">
          L
        </div>
      )}

      {/* Player info - bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-amber-400 text-lg font-semibold leading-tight">
          {player.first_name}
        </p>
        <p className="text-white text-2xl font-black uppercase leading-tight tracking-tight">
          {player.last_name?.toUpperCase() || ''}
        </p>

        {/* RSVP status */}
        {showRsvp && (
          <div className="mt-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${rsvpColors[rsvpStatus] || rsvpColors.pending}`}>
              {rsvpLabels[rsvpStatus] || 'Pending'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// EMPTY POSITION SLOT - Card Style
// ============================================
function EmptySlot({ position, isServing, onDrop, onDragOver }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={onDrop}
      className={`relative rounded-xl border-2 border-dashed transition-all hover:border-[#4BB9EC]/50 h-[160px] flex flex-col items-center justify-center ${
        isServing ? 'border-emerald-400/50' : 'border-slate-600/50'
      }`}
      style={{ background: isServing ? 'rgba(16,185,129,0.05)' : 'rgba(30,40,60,0.3)', minWidth: '130px' }}
    >
      {/* Position badge - top left */}
      <div
        className="absolute top-3 left-3 px-3 py-1 rounded-md text-base font-bold text-white"
        style={{ backgroundColor: position.color }}
      >
        {position.role || position.name}
      </div>

      {/* Serving indicator - STAYS at P1 */}
      {isServing && (
        <div className="absolute top-3 right-3 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
          🏐
        </div>
      )}

      {/* Empty state content */}
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center opacity-50"
          style={{ backgroundColor: position.color + '30' }}
        >
          <UserIcon className="w-6 h-6" style={{ color: position.color }} />
        </div>
        <p className="text-base text-slate-400 font-medium">{position.label || 'Drag player here'}</p>
      </div>
    </div>
  )
}

// ============================================
// PLAYER STATS MODAL
// ============================================
function PlayerStatsModal({ player, onClose }) {
  const stats = {
    skill_rating: player.skill_rating || Math.floor(Math.random() * 30) + 70,
    serve_rating: player.serve_rating || Math.floor(Math.random() * 30) + 70,
    attack_rating: player.attack_rating || Math.floor(Math.random() * 30) + 70,
    defense_rating: player.defense_rating || Math.floor(Math.random() * 30) + 70,
  }
  
  function StatBar({ label, value, color }) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-lg">
          <span className="text-slate-400">{label}</span>
          <span className="font-semibold" style={{ color }}>{value}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(30,40,60,0.5)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-5" onClick={onClose}>
      <div className="rounded-xl w-full max-w-sm overflow-hidden shadow-2xl" style={{ background: '#0a0a0f', border: '1px solid rgba(16,40,76,0.30)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-7 text-white text-center">
          {player.photo_url ? (
            <img src={player.photo_url} className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-white/20 flex items-center justify-center text-5xl font-bold">
              {player.jersey_number || '?'}
            </div>
          )}
          <h3 className="text-3xl font-bold mt-4">{player.first_name} {player.last_name}</h3>
          <p className="text-white/70">#{player.jersey_number} &bull; {player.position || 'Player'}</p>
        </div>

        {/* Stats */}
        <div className="p-7 space-y-5">
          <h4 className="font-semibold text-white mb-5">Skill Ratings</h4>
          <StatBar label="Overall" value={stats.skill_rating} color="#6366F1" />
          <StatBar label="Serving" value={stats.serve_rating} color="#10B981" />
          <StatBar label="Attacking" value={stats.attack_rating} color="#EF4444" />
          <StatBar label="Defense" value={stats.defense_rating} color="#3B82F6" />
        </div>

        <div className="p-5" style={{ borderTop: '1px solid rgba(16,40,76,0.20)' }}>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl text-slate-300 font-medium transition hover:text-white"
            style={{ background: 'rgba(30,40,60,0.5)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN LINEUP BUILDER
// ============================================
function AdvancedLineupBuilder({ event, team, sport = 'volleyball', onClose, onSave, showToast }) {
  const { user } = useAuth()
  
  // Data
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Lineup state
  const [formation, setFormation] = useState(null)
  const [lineup, setLineup] = useState({}) // { positionId: playerId }
  const [liberoId, setLiberoId] = useState(null)
  const [subs, setSubs] = useState({}) // { positionId: benchPlayerId }
  
  // Multi-set support
  const [currentSet, setCurrentSet] = useState(1)
  const [setLineups, setSetLineups] = useState({})
  const [totalSets, setTotalSets] = useState(3)
  
  // Rotation
  const [currentRotation, setCurrentRotation] = useState(0)
  
  // UI
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  
  const sportConfig = SPORT_CONFIGS[sport] || SPORT_CONFIGS.volleyball
  const formations = sportConfig.formations
  const defaultFormation = Object.keys(formations)[0]
  
  useEffect(() => {
    loadData()
    setFormation(defaultFormation)
  }, [event.id, team.id])
  
  async function loadData() {
    setLoading(true)
    
    try {
      // Load roster
      const { data: players } = await supabase
        .from('team_players')
        .select('*, players(*)')
        .eq('team_id', team.id)
      
      const rosterData = (players || [])
        .map(tp => ({ 
          ...tp.players, 
          team_jersey: tp.jersey_number, 
          team_position: tp.position,
          jersey_number: tp.jersey_number || tp.players?.jersey_number
        }))
        .filter(Boolean)
        .sort((a, b) => (a.jersey_number || 99) - (b.jersey_number || 99))
      
      setRoster(rosterData)
      
      // Load RSVPs
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('player_id, status')
        .eq('event_id', event.id)
      
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r.status })
      setRsvps(rsvpMap)
      
      // Load existing lineup
      const { data: existingLineup } = await supabase
        .from('game_lineups')
        .select('*')
        .eq('event_id', event.id)
      
      if (existingLineup?.length > 0) {
        const lineupMap = {}
        existingLineup.forEach(l => {
          if (l.rotation_order) lineupMap[l.rotation_order] = l.player_id
          if (l.is_libero) setLiberoId(l.player_id)
        })
        setLineup(lineupMap)
        setSetLineups({ 1: lineupMap })
      }
      
    } catch (err) {
      console.error('Error loading data:', err)
    }
    
    setLoading(false)
  }
  
  // Next rotation (right arrow) - increases rotation number, players move clockwise
  function nextRotation() {
    if (!sportConfig.hasRotations) return
    setCurrentRotation(prev => (prev + 1) % sportConfig.rotationCount)
  }
  
  // Previous rotation (left arrow) - decreases rotation number
  function prevRotation() {
    if (!sportConfig.hasRotations) return
    setCurrentRotation(prev => (prev - 1 + sportConfig.rotationCount) % sportConfig.rotationCount)
  }
  
  function resetRotation() {
    setCurrentRotation(0)
  }
  
  // Get which player is in which position after rotation
  // Volleyball rotates CLOCKWISE: Player at P1 moves to P6, P2 to P1, etc.
  function getPlayerAtPosition(positionId) {
    // When rotation increases, players move clockwise
    // Position 1 (after 1 rotation) shows player who was at position 2
    // Position 2 (after 1 rotation) shows player who was at position 3
    // etc.
    const rotationOrder = [1, 2, 3, 4, 5, 6]
    const posIndex = rotationOrder.indexOf(positionId)
    
    // After N rotations clockwise, position X shows player from position (X + N) % 6
    const sourceIndex = (posIndex + currentRotation) % 6
    const sourcePosition = rotationOrder[sourceIndex]
    
    return lineup[sourcePosition]
  }
  
  function handleDrop(positionId, playerId) {
    // Remove player from any existing position
    const newLineup = { ...lineup }
    Object.keys(newLineup).forEach(key => {
      if (newLineup[key] === playerId) delete newLineup[key]
    })
    
    // For rotated view, we need to figure out the ORIGINAL position
    // If visual position is X and rotation is N, original position is (X + N) % 6
    const rotationOrder = [1, 2, 3, 4, 5, 6]
    const posIndex = rotationOrder.indexOf(positionId)
    const originalIndex = (posIndex + currentRotation) % 6
    const originalPosition = rotationOrder[originalIndex]
    
    newLineup[originalPosition] = playerId
    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
  }
  
  function handleDragStart(e, player) {
    e.dataTransfer.setData('playerId', player.id)
    setDraggedPlayer(player)
  }
  
  function handleDragEnd() {
    setDraggedPlayer(null)
  }
  
  function removeFromPosition(positionId) {
    const rotationOrder = [1, 2, 3, 4, 5, 6]
    const posIndex = rotationOrder.indexOf(positionId)
    const originalIndex = (posIndex + currentRotation) % 6
    const originalPosition = rotationOrder[originalIndex]
    
    const newLineup = { ...lineup }
    delete newLineup[originalPosition]
    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
  }
  
  function autoFillLineup() {
    const available = roster.filter(p => {
      const status = rsvps[p.id]
      return status === 'yes' || status === 'attending' || !status
    })
    
    const newLineup = {}
    const positions = formations[formation]?.positions || []
    
    positions.slice(0, sportConfig.starterCount).forEach((pos, i) => {
      if (available[i]) {
        newLineup[pos.id] = available[i].id
      }
    })
    
    setLineup(newLineup)
    setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
    showToast?.('Lineup auto-filled!', 'success')
  }
  
  function clearLineup() {
    setLineup({})
    setLiberoId(null)
    setSubs({})
    setSetLineups(prev => ({ ...prev, [currentSet]: {} }))
  }
  
  function copyLineupToAllSets() {
    const allSets = {}
    for (let i = 1; i <= totalSets; i++) {
      allSets[i] = { ...lineup }
    }
    setSetLineups(allSets)
    showToast?.(`Lineup copied to all ${totalSets} sets`, 'success')
  }
  
  function switchSet(setNum) {
    setSetLineups(prev => ({ ...prev, [currentSet]: lineup }))
    setCurrentSet(setNum)
    setLineup(setLineups[setNum] || {})
    setCurrentRotation(0)
  }
  
  async function saveLineup() {
    setSaving(true)
    
    try {
      await supabase.from('game_lineups').delete().eq('event_id', event.id)
      
      const records = []
      const positions = formations[formation]?.positions || []
      
      Object.entries(lineup).forEach(([positionId, playerId]) => {
        const pos = positions.find(p => p.id === parseInt(positionId))
        records.push({
          event_id: event.id,
          player_id: playerId,
          rotation_order: parseInt(positionId),
          is_starter: true,
          is_libero: playerId === liberoId,
          position: pos?.name
        })
      })
      
      if (liberoId && !Object.values(lineup).includes(liberoId)) {
        records.push({
          event_id: event.id,
          player_id: liberoId,
          rotation_order: null,
          is_starter: false,
          is_libero: true,
          position: 'L'
        })
      }
      
      if (records.length > 0) {
        const { error } = await supabase.from('game_lineups').insert(records)
        if (error) throw error
      }
      
      showToast?.('Lineup saved!', 'success')
      onSave?.()
      onClose()
      
    } catch (err) {
      console.error('Error saving:', err)
      showToast?.('Error saving lineup', 'error')
    }
    
    setSaving(false)
  }
  
  const startersCount = Object.keys(lineup).length
  const benchPlayers = roster.filter(p => !Object.values(lineup).includes(p.id) && p.id !== liberoId)
  const currentFormation = formations[formation]
  const positions = currentFormation?.positions || []

  return (
    <div className="fixed inset-0 flex flex-col z-[60] overflow-hidden" style={{
      background: '#0a0a0f',
      backgroundImage: 'linear-gradient(rgba(16,40,76,0.06) 1px,transparent 1px), linear-gradient(90deg,rgba(16,40,76,0.06) 1px,transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      {/* Header */}
      <div className="px-7 py-5" style={{ background: 'rgba(10,10,15,0.9)', borderBottom: '1px solid rgba(16,40,76,0.25)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/5 rounded-xl transition"
            >
              <XIcon className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-4xl">{sportConfig.icon}</span>
                THE WAR ROOM
              </h1>
              <p className="text-slate-500 text-lg">
                {team.name} vs {event.opponent_name || 'TBD'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Formation selector */}
            <select
              value={formation || ''}
              onChange={(e) => setFormation(e.target.value)}
              className="px-5 py-3 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#4BB9EC]"
              style={{ background: 'rgba(15,20,35,0.8)', border: '1px solid rgba(16,40,76,0.30)', color: '#e2e8f0' }}
            >
              {Object.entries(formations).map(([key, f]) => (
                <option key={key} value={key}>{f.name}</option>
              ))}
            </select>

            {/* Starters count */}
            <div className="px-5 py-3 rounded-xl text-center min-w-[80px]" style={{ background: 'rgba(15,20,35,0.8)', border: '1px solid rgba(16,40,76,0.20)' }}>
              <p className="text-base text-slate-500">Starters</p>
              <p className={`text-2xl font-bold ${startersCount >= sportConfig.starterCount ? 'text-emerald-400' : 'text-amber-400'}`}>{startersCount}/{sportConfig.starterCount}</p>
            </div>

            {/* Save button */}
            <button
              onClick={saveLineup}
              disabled={saving || startersCount === 0}
              className="px-7 py-3.5 bg-[#10284C] hover:bg-lynx-sky text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-3"
            >
              <SaveIcon className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Lineup'}
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 p-7 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Set Selector */}
              {sportConfig.hasSets && (
                <div className="rounded-xl p-5" style={{ background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(16,40,76,0.25)' }}>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-slate-400 font-medium">Set:</span>
                    {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNum => (
                      <button
                        key={setNum}
                        onClick={() => switchSet(setNum)}
                        className={`w-12 h-12 rounded-xl font-bold text-2xl transition ${
                          currentSet === setNum
                            ? 'bg-[#10284C] text-[#4BB9EC] shadow-lg shadow-[#10284C]/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        style={currentSet !== setNum ? { background: 'rgba(30,40,60,0.5)' } : {}}
                      >
                        {setNum}
                      </button>
                    ))}
                    {totalSets < 5 && (
                      <button
                        onClick={() => setTotalSets(prev => prev + 1)}
                        className="w-12 h-12 rounded-xl text-slate-500 hover:text-slate-300 transition text-4xl"
                        style={{ background: 'rgba(30,40,60,0.5)' }}
                      >
                        +
                      </button>
                    )}
                    <button
                      onClick={copyLineupToAllSets}
                      className="ml-4 px-5 py-3 text-slate-400 hover:text-white rounded-xl text-lg font-medium transition"
                      style={{ background: 'rgba(30,40,60,0.5)' }}
                    >
                      Copy to all sets
                    </button>
                  </div>
                </div>
              )}
              
              {/* Rotation Controls */}
              {sportConfig.hasRotations && (
                <div className="rounded-xl p-5" style={{ background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(16,40,76,0.25)' }}>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={prevRotation}
                      className="p-4 rounded-xl text-slate-400 hover:text-white transition"
                      style={{ background: 'rgba(30,40,60,0.5)' }}
                      title="Previous Rotation"
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={resetRotation}
                        className="p-4 rounded-xl text-slate-400 hover:text-white transition"
                        style={{ background: 'rgba(30,40,60,0.5)' }}
                        title="Reset to Rotation 1"
                      >
                        <RotateIcon className="w-5 h-5" />
                      </button>

                      <div className="px-7 py-3 rounded-xl" style={{ background: 'rgba(16,40,76,0.2)', border: '1px solid rgba(16,40,76,0.4)' }}>
                        <span className="text-[#4BB9EC] font-bold text-2xl">
                          Rotation {currentRotation + 1} / {sportConfig.rotationCount}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={nextRotation}
                      className="p-4 rounded-xl text-slate-400 hover:text-white transition"
                      style={{ background: 'rgba(30,40,60,0.5)' }}
                      title="Next Rotation"
                    >
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-center text-base text-slate-500 mt-3">
                    Click arrows to cycle through rotations &bull; 🏐 Server always at P1
                  </p>
                </div>
              )}
              
              {/* Court Layout - Volleyball */}
              {sport === 'volleyball' && (
                <div className="rounded-xl p-7" style={{ background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(16,40,76,0.25)' }}>
                  {/* Net indicator */}
                  <div className="text-center mb-7">
                    <div className="inline-block px-8 py-3 rounded-lg text-lg font-bold tracking-wider" style={{ background: 'linear-gradient(90deg, rgba(51,65,85,0.5), rgba(71,85,105,0.5), rgba(51,65,85,0.5))', color: 'rgba(255,255,255,0.4)' }}>
                      ━━━ NET ━━━
                    </div>
                  </div>

                  {/* Front Row - P4, P3, P2 */}
                  <div className="grid grid-cols-3 gap-4 mb-7">
                    {[4, 3, 2].map(posId => {
                      const pos = positions.find(p => p.id === posId)
                      const playerId = getPlayerAtPosition(posId)
                      const player = roster.find(p => p.id === playerId)
                      
                      return (
                        <div 
                          key={posId}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const pid = e.dataTransfer.getData('playerId')
                            if (pid) handleDrop(posId, pid)
                          }}
                        >
                          {player ? (
                            <div className="group relative">
                              <PlayerCard
                                player={player}
                                position={pos}
                                isServing={false}
                                isLibero={player.id === liberoId}
                                rsvpStatus={rsvps[player.id]}
                                onClick={() => setSelectedPlayer(player)}
                              />
                              <button
                                onClick={() => removeFromPosition(posId)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow opacity-0 group-hover:opacity-100 transition"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <EmptySlot position={pos} isServing={false} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Attack Line */}
                  <div className="flex items-center gap-4 my-5">
                    <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: 'rgba(249,115,22,0.4)' }} />
                    <span className="text-base text-orange-400 font-bold tracking-wider">ATTACK LINE</span>
                    <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: 'rgba(249,115,22,0.4)' }} />
                  </div>
                  
                  {/* Back Row - P5, P6, P1 */}
                  <div className="grid grid-cols-3 gap-4">
                    {[5, 6, 1].map(posId => {
                      const pos = positions.find(p => p.id === posId)
                      const playerId = getPlayerAtPosition(posId)
                      const player = roster.find(p => p.id === playerId)
                      const isServing = posId === 1 // P1 is ALWAYS the serving position
                      
                      return (
                        <div 
                          key={posId}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const pid = e.dataTransfer.getData('playerId')
                            if (pid) handleDrop(posId, pid)
                          }}
                        >
                          {player ? (
                            <div className="group relative">
                              <PlayerCard
                                player={player}
                                position={pos}
                                isServing={isServing}
                                isLibero={player.id === liberoId}
                                rsvpStatus={rsvps[player.id]}
                                onClick={() => setSelectedPlayer(player)}
                              />
                              <button
                                onClick={() => removeFromPosition(posId)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow opacity-0 group-hover:opacity-100 transition"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <EmptySlot position={pos} isServing={isServing} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Generic Grid for other sports */}
              {sport !== 'volleyball' && (
                <div className="rounded-xl p-7" style={{ background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(16,40,76,0.25)' }}>
                  <div className={`grid gap-4 ${
                    sportConfig.starterCount <= 5 ? 'grid-cols-3' :
                    sportConfig.starterCount <= 9 ? 'grid-cols-3' :
                    'grid-cols-4'
                  }`}>
                    {positions.map(pos => {
                      const playerId = lineup[pos.id]
                      const player = roster.find(p => p.id === playerId)
                      
                      return (
                        <div 
                          key={pos.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const pid = e.dataTransfer.getData('playerId')
                            if (pid) handleDrop(pos.id, pid)
                          }}
                        >
                          {player ? (
                            <div className="group relative">
                              <PlayerCard
                                player={player}
                                position={pos}
                                rsvpStatus={rsvps[player.id]}
                                onClick={() => setSelectedPlayer(player)}
                              />
                              <button
                                onClick={() => removeFromPosition(pos.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow opacity-0 group-hover:opacity-100 transition"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <EmptySlot position={pos} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Libero Selector */}
              {sportConfig.hasLibero && (
                <div className="rounded-xl p-7" style={{ background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(16,40,76,0.25)' }}>
                  <h3 className="font-semibold text-white mb-5 flex items-center gap-3">
                    <span className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-base text-white font-bold">L</span>
                    Libero (Defensive Specialist)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {roster.map(player => (
                      <button
                        key={player.id}
                        onClick={() => setLiberoId(liberoId === player.id ? null : player.id)}
                        className={`px-5 py-3 rounded-xl text-lg font-medium transition ${
                          liberoId === player.id
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                            : 'text-slate-300 hover:bg-pink-500/20 hover:text-pink-400'
                        }`}
                        style={liberoId !== player.id ? { background: 'rgba(30,40,60,0.5)' } : {}}
                      >
                        #{player.jersey_number} {player.first_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Substitutions Panel */}
              {startersCount > 0 && (
                <div className="rounded-xl p-7" style={{ background: 'rgba(15,20,35,0.7)', border: '1px solid rgba(16,40,76,0.25)' }}>
                  <h3 className="font-semibold text-white mb-5 flex items-center gap-3">
                    <RotateIcon className="w-5 h-5 text-amber-500" />
                    Substitutions
                  </h3>
                  <p className="text-lg text-slate-500 mb-5">Set which bench players will sub in for each starter</p>

                  <div className="space-y-4">
                    {positions.map(pos => {
                      const starterId = lineup[pos.id]
                      const starter = roster.find(p => p.id === starterId)
                      if (!starter) return null

                      const subId = subs[pos.id]
                      const availableForSub = benchPlayers.filter(p =>
                        !Object.values(subs).includes(p.id) || subs[pos.id] === p.id
                      )

                      return (
                        <div key={pos.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(30,40,60,0.4)' }}>
                          {/* Position badge */}
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: pos.color }}
                          >
                            {pos.name}
                          </span>

                          {/* Starter info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">
                              #{starter.jersey_number} {starter.first_name}
                            </p>
                            <p className="text-base text-slate-500">{pos.label}</p>
                          </div>

                          {/* Arrow */}
                          <span className="text-slate-500">→</span>

                          {/* Sub selector */}
                          <select
                            value={subId || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                setSubs(prev => ({ ...prev, [pos.id]: e.target.value }))
                              } else {
                                setSubs(prev => {
                                  const newSubs = { ...prev }
                                  delete newSubs[pos.id]
                                  return newSubs
                                })
                              }
                            }}
                            className="px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#4BB9EC] min-w-[140px]"
                            style={{ background: 'rgba(15,20,35,0.8)', border: '1px solid rgba(16,40,76,0.30)', color: '#e2e8f0' }}
                          >
                            <option value="">No sub</option>
                            {availableForSub.map(p => (
                              <option key={p.id} value={p.id}>
                                #{p.jersey_number} {p.first_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>

                  {/* Active subs summary */}
                  {Object.keys(subs).length > 0 && (
                    <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(16,40,76,0.20)' }}>
                      <p className="text-base font-semibold text-slate-400 mb-3">Active Substitutions:</p>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(subs).map(([posId, subId]) => {
                          const pos = positions.find(p => p.id === parseInt(posId))
                          const starter = roster.find(p => p.id === lineup[parseInt(posId)])
                          const sub = roster.find(p => p.id === subId)
                          if (!starter || !sub) return null

                          return (
                            <span
                              key={posId}
                              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-base font-medium"
                            >
                              {pos?.name}: #{starter.jersey_number} → #{sub.jersey_number}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Roster Sidebar */}
          <div className="w-80 flex flex-col shadow-lg" style={{ background: 'rgba(15,20,35,0.8)', borderLeft: '1px solid rgba(16,40,76,0.25)' }}>
            <div className="p-5" style={{ borderBottom: '1px solid rgba(16,40,76,0.20)', background: 'rgba(10,10,15,0.5)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-xl">Roster</h3>
                <div className="flex gap-3">
                  <button
                    onClick={autoFillLineup}
                    className="px-4 py-2 bg-[#10284C] text-[#4BB9EC] rounded-lg text-base font-medium hover:bg-[#10284C]/80 transition shadow border border-[#10284C]"
                  >
                    Auto-Fill
                  </button>
                  <button
                    onClick={clearLineup}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-base font-medium hover:bg-red-600 transition shadow"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-base text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Going
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Maybe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> No
                </span>
              </div>
            </div>

            {/* Available Players */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-base text-slate-500 mb-3 font-medium">Drag players to positions</p>
              {benchPlayers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CheckIcon className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                  <p className="font-medium text-xl">All players assigned!</p>
                </div>
              ) : (
                benchPlayers.map(player => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    rsvpStatus={rsvps[player.id]}
                    compact
                    draggable
                    onDragStart={(e) => handleDragStart(e, player)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedPlayer(player)}
                  />
                ))
              )}
            </div>

            {/* In Lineup Summary */}
            {startersCount > 0 && (
              <div className="p-5" style={{ borderTop: '1px solid rgba(16,40,76,0.20)', background: 'rgba(16,185,129,0.08)' }}>
                <p className="text-base text-emerald-400 font-semibold mb-3">In Lineup ({startersCount}/{sportConfig.starterCount})</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(lineup).map(([posId, playerId]) => {
                    const player = roster.find(p => p.id === playerId)
                    const pos = positions.find(p => p.id === parseInt(posId))
                    if (!player) return null

                    return (
                      <span
                        key={posId}
                        className="px-3 py-1 rounded-lg text-base font-medium text-white shadow-sm"
                        style={{ backgroundColor: pos?.color || '#6366F1' }}
                      >
                        {pos?.name}: #{player.jersey_number}
                      </span>
                    )
                  })}
                  {liberoId && (
                    <span className="px-3 py-1 rounded-lg bg-pink-500 text-white text-base font-medium shadow-sm">
                      L: #{roster.find(p => p.id === liberoId)?.jersey_number}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Player Stats Modal */}
      {selectedPlayer && (
        <PlayerStatsModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

export { AdvancedLineupBuilder, SPORT_CONFIGS }
