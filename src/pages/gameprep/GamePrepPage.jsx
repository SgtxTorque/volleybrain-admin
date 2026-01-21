import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, Users, MapPin, Clock, Check, AlertTriangle, ChevronRight, 
  BarChart3, Target, X, Phone, AlertCircle, Star
} from '../../constants/icons'

// Volleyball icon component
function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
    </svg>
  )
}

// Helper function
function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

const ROTATION_CONFIGS = {
  '5-1': {
    name: '5-1',
    description: '1 setter runs all rotations',
    hasLibero: true,
    liberoOptional: true,
    positions: ['OH', 'OH', 'MB', 'MB', 'S', 'OPP'],
    typical: 'Competitive teams, 12U+'
  },
  '6-2': {
    name: '6-2',
    description: '2 setters, setter always back row',
    hasLibero: true,
    liberoOptional: true,
    positions: ['OH', 'OH', 'MB', 'MB', 'S', 'S'],
    typical: 'Intermediate teams'
  },
  '4-2': {
    name: '4-2',
    description: '2 setters, simpler rotation',
    hasLibero: false,
    liberoOptional: true,
    positions: ['OH', 'OH', 'MB', 'MB', 'S', 'S'],
    typical: 'Younger/beginner teams'
  },
  '6-6': {
    name: '6-6',
    description: 'Rec style, everyone rotates all positions',
    hasLibero: false,
    liberoOptional: false,
    positions: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
    typical: 'Recreational leagues'
  }
}

// Position colors
const POSITION_COLORS = {
  'OH': '#EF4444',   // Red
  'MB': '#F59E0B',   // Amber
  'S': '#10B981',    // Emerald
  'OPP': '#6366F1',  // Indigo
  'RS': '#8B5CF6',   // Violet
  'L': '#EC4899',    // Pink
  'DS': '#14B8A6',   // Teal
  'UT': '#64748B',   // Slate
  'P1': '#3B82F6',   // Blue (for 6-6)
  'P2': '#10B981',
  'P3': '#F59E0B',
  'P4': '#EF4444',
  'P5': '#8B5CF6',
  'P6': '#EC4899',
}

// Court position coordinates (percentages) - HALF COURT ONLY
const COURT_POSITIONS = {
  // Front row (near net) - positions 4, 3, 2
  4: { x: 18, y: 22, label: 'P4', zone: 'front-left', defaultPos: 'OH' },
  3: { x: 50, y: 22, label: 'P3', zone: 'front-center', defaultPos: 'MB' },
  2: { x: 82, y: 22, label: 'P2', zone: 'front-right', defaultPos: 'OPP' },
  // Back row - positions 5, 6, 1
  5: { x: 18, y: 68, label: 'P5', zone: 'back-left', defaultPos: 'MB' },
  6: { x: 50, y: 68, label: 'P6', zone: 'back-center', defaultPos: 'S' },
  1: { x: 82, y: 68, label: 'P1', zone: 'back-right', defaultPos: 'OH' },
}

// ============================================
// VOLLEYBALL COURT SVG COMPONENT - HALF COURT
// Matches reference: orange court, net at top, our side only
// ============================================
function VolleyballCourt({ children, isDark, showServeIndicator, servingPosition, compact = false }) {
  // Orange volleyball court colors (like reference image)
  const courtOrange = '#F97316'
  const courtOrangeDark = '#EA580C'
  const lineColor = '#FFFFFF'
  const netColor = '#FEF3C7'
  const bgColor = isDark ? '#1E293B' : '#334155'
  
  const height = compact ? 180 : 220
  
  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: compact ? '380px' : '480px' }}>
      <svg viewBox="0 0 400 240" className="w-full" style={{ height }}>
        {/* Background */}
        <rect x="0" y="0" width="400" height="240" fill={bgColor} />
        
        {/* Court glow effect */}
        <defs>
          <filter id="courtGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feFlood floodColor={courtOrange} floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* NET at top - with posts */}
        {/* Left post */}
        <rect x="35" y="15" width="8" height="55" fill="#1F2937" rx="2" />
        <rect x="33" y="12" width="12" height="6" fill="#374151" rx="1" />
        {/* Right post */}
        <rect x="357" y="15" width="8" height="55" fill="#1F2937" rx="2" />
        <rect x="355" y="12" width="12" height="6" fill="#374151" rx="1" />
        
        {/* Net cable top */}
        <line x1="39" y1="20" x2="361" y2="20" stroke="#F8FAFC" strokeWidth="2" />
        {/* Net mesh area */}
        <rect x="39" y="20" width="322" height="45" fill="url(#netPattern)" opacity="0.9" />
        {/* Net pattern */}
        <defs>
          <pattern id="netPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={netColor} />
            <line x1="0" y1="0" x2="8" y2="8" stroke="#D4A574" strokeWidth="0.5" />
            <line x1="8" y1="0" x2="0" y2="8" stroke="#D4A574" strokeWidth="0.5" />
          </pattern>
        </defs>
        {/* Net bottom cable */}
        <line x1="39" y1="65" x2="361" y2="65" stroke="#E5E7EB" strokeWidth="2" />
        {/* Net tape at top */}
        <rect x="39" y="18" width="322" height="6" fill="#F8FAFC" opacity="0.9" />
        {/* Red antenna markers */}
        <rect x="39" y="10" width="2" height="55" fill="#EF4444" />
        <rect x="359" y="10" width="2" height="55" fill="#EF4444" />
        
        {/* Court surface with glow */}
        <rect x="45" y="75" width="310" height="155" rx="4" fill={courtOrange} filter="url(#courtGlow)" />
        
        {/* Court pink/magenta border glow */}
        <rect x="45" y="75" width="310" height="155" rx="4" fill="none" stroke="#EC4899" strokeWidth="3" opacity="0.6" />
        
        {/* Court outline */}
        <rect x="50" y="80" width="300" height="145" fill="none" stroke={lineColor} strokeWidth="2" />
        
        {/* Attack line (3m line) */}
        <line x1="50" y1="130" x2="350" y2="130" stroke={lineColor} strokeWidth="2" opacity="0.7" />
        
        {/* Position zone indicators - subtle */}
        <text x="78" y="110" fontSize="11" fill={lineColor} opacity="0.4" textAnchor="middle" fontWeight="500">P4</text>
        <text x="200" y="110" fontSize="11" fill={lineColor} opacity="0.4" textAnchor="middle" fontWeight="500">P3</text>
        <text x="322" y="110" fontSize="11" fill={lineColor} opacity="0.4" textAnchor="middle" fontWeight="500">P2</text>
        <text x="78" y="195" fontSize="11" fill={lineColor} opacity="0.4" textAnchor="middle" fontWeight="500">P5</text>
        <text x="200" y="195" fontSize="11" fill={lineColor} opacity="0.4" textAnchor="middle" fontWeight="500">P6</text>
        <text x="322" y="195" fontSize="11" fill={lineColor} opacity="0.4" textAnchor="middle" fontWeight="500">P1</text>
        
        {/* Serving position indicator */}
        {showServeIndicator && servingPosition === 1 && (
          <circle cx="340" cy="215" r="10" fill="#10B981" opacity="0.5" />
        )}
      </svg>
      
      {/* Player positions overlay */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  )
}

// ============================================
// PLAYER ICON COMPONENT (Draggable)
// ============================================
function PlayerIcon({ 
  player, 
  position, 
  isServing, 
  isLibero, 
  isCaptain,
  hasRsvp,
  rsvpStatus,
  isDark,
  onClick,
  onDragStart,
  onDragEnd,
  isOnCourt,
  size = 'normal' // 'normal' | 'small' | 'roster'
}) {
  const tc = isDark ? {
    bg: 'bg-slate-800',
    border: 'border-slate-600',
    text: 'text-white',
    muted: 'text-slate-400'
  } : {
    bg: 'bg-white',
    border: 'border-slate-200',
    text: 'text-slate-900',
    muted: 'text-slate-500'
  }

  const posColor = POSITION_COLORS[player?.primary_position] || '#6366F1'
  const sizeClasses = {
    normal: 'w-14 h-14',
    small: 'w-10 h-10',
    roster: 'w-12 h-12'
  }

  const noRsvp = !hasRsvp || rsvpStatus === 'pending' || rsvpStatus === 'no'
  const dimmed = noRsvp && isOnCourt

  return (
    <div
      draggable={!isOnCourt || true}
      onDragStart={(e) => onDragStart?.(e, player)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(player)}
      className={`
        relative cursor-pointer transition-all duration-200
        ${dimmed ? 'opacity-50' : 'opacity-100'}
        hover:scale-110 hover:z-50
        ${isServing ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}
      `}
      style={{ touchAction: 'none' }}
    >
      {/* Player photo/avatar */}
      <div 
        className={`
          ${sizeClasses[size]} rounded-xl overflow-hidden border-2 shadow-lg
          ${tc.bg} relative
        `}
        style={{ borderColor: posColor }}
      >
        {player?.photo_url ? (
          <img 
            src={player.photo_url} 
            alt={player.first_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: posColor }}
          >
            {player?.first_name?.[0]}{player?.last_name?.[0]}
          </div>
        )}
        
        {/* No RSVP overlay */}
        {noRsvp && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <X className="w-6 h-6 text-red-500" />
          </div>
        )}
        
        {/* Jersey number badge */}
        <div 
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
          style={{ backgroundColor: posColor }}
        >
          {player?.jersey_number || '?'}
        </div>
        
        {/* Captain star */}
        {isCaptain && (
          <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs shadow">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
        )}
        
        {/* Libero badge */}
        {isLibero && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-[10px] text-white shadow font-bold">
            L
          </div>
        )}
        
        {/* Serving indicator */}
        {isServing && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 animate-bounce">
            <VolleyballIcon className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Player name (on roster view) */}
      {size === 'roster' && (
        <div className="mt-1 text-center">
          <p className={`text-xs font-medium ${tc.text} truncate max-w-[60px]`}>
            {player?.first_name}
          </p>
          <p className={`text-[10px] ${tc.muted}`}>
            {player?.primary_position || 'UT'}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// GAME PLAYER CARD MODAL (Not registration info)
// ============================================
function GamePlayerCard({ player, onClose, isDark }) {
  const tc = isDark ? {
    bg: 'bg-slate-900',
    cardBg: 'bg-slate-800',
    text: 'text-white',
    muted: 'text-slate-400',
    border: 'border-slate-700'
  } : {
    bg: 'bg-white',
    cardBg: 'bg-slate-50',
    text: 'text-slate-900',
    muted: 'text-slate-500',
    border: 'border-slate-200'
  }
  
  const posColor = POSITION_COLORS[player?.primary_position] || '#6366F1'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`${tc.bg} rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with photo */}
        <div 
          className="relative h-32 flex items-end p-4"
          style={{ background: `linear-gradient(135deg, ${posColor}40, ${posColor}20)` }}
        >
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className={`w-8 h-8 rounded-full ${tc.cardBg} flex items-center justify-center`}>
              ✕
            </button>
          </div>
          <div className="flex items-end gap-4">
            {player?.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={player.first_name}
                className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg"
                style={{ backgroundColor: posColor }}
              >
                {player?.first_name?.[0]}{player?.last_name?.[0]}
              </div>
            )}
            <div className="mb-2">
              <h2 className={`text-2xl font-bold ${tc.text}`}>
                {player?.first_name} {player?.last_name}
              </h2>
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: posColor }}
                >
                  {player?.primary_position || 'UT'}
                </span>
                <span className={`text-lg font-bold ${tc.text}`}>#{player?.jersey_number || '?'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game-relevant info only */}
        <div className="p-4 space-y-4">
          {/* Contact (Guardian) */}
          <div className={`${tc.cardBg} rounded-xl p-3`}>
            <h3 className={`text-xs uppercase ${tc.muted} mb-2 flex items-center gap-2`}><Phone className="w-4 h-4" />Emergency Contact</h3>
            <p className={tc.text}>{player?.parent_name || player?.guardian_name || 'Not provided'}</p>
            <p className={`text-sm ${tc.muted}`}>{player?.parent_phone || 'No phone'}</p>
          </div>
          
          {/* Medical */}
          {(player?.medical_conditions || player?.allergies) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <h3 className="text-xs uppercase text-red-400 mb-2">⚠️ Medical Alert</h3>
              {player?.medical_conditions && (
                <p className={tc.text}>{player.medical_conditions}</p>
              )}
              {player?.allergies && (
                <p className={`text-sm ${tc.muted}`}>Allergies: {player.allergies}</p>
              )}
            </div>
          )}
          
          {/* Stats preview */}
          <div className={`${tc.cardBg} rounded-xl p-3`}>
            <h3 className={`text-xs uppercase ${tc.muted} mb-2 flex items-center gap-2`}><BarChart3 className="w-4 h-4" />Season Stats</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-bold" style={{ color: posColor }}>{player?.stats?.kills || 0}</p>
                <p className={`text-[10px] ${tc.muted}`}>Kills</p>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: posColor }}>{player?.stats?.aces || 0}</p>
                <p className={`text-[10px] ${tc.muted}`}>Aces</p>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: posColor }}>{player?.stats?.digs || 0}</p>
                <p className={`text-[10px] ${tc.muted}`}>Digs</p>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: posColor }}>{player?.stats?.blocks || 0}</p>
                <p className={`text-[10px] ${tc.muted}`}>Blocks</p>
              </div>
            </div>
          </div>
          
          {/* Ratings */}
          <div className={`${tc.cardBg} rounded-xl p-3`}>
            <h3 className={`text-xs uppercase ${tc.muted} mb-2`}>Skill Ratings</h3>
            <div className="space-y-2">
              {[
                { label: 'Overall', value: player?.skill_rating || 50 },
                { label: 'Serve', value: player?.serve_rating || 50 },
                { label: 'Attack', value: player?.attack_rating || 50 },
                { label: 'Defense', value: player?.defense_rating || 50 },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className={`text-xs ${tc.muted} w-16`}>{stat.label}</span>
                  <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${stat.value}%`, backgroundColor: posColor }}
                    />
                  </div>
                  <span className={`text-xs ${tc.text} w-8`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ROTATION VISUALIZER (Animated)
// ============================================
function RotationVisualizer({ currentRotation, rotationType, players, isDark, onRotationChange }) {
  const [isAnimating, setIsAnimating] = useState(false)
  
  const rotationLabels = {
    1: 'Rotation 1 (Serve)',
    2: 'Rotation 2',
    3: 'Rotation 3',
    4: 'Rotation 4',
    5: 'Rotation 5',
    6: 'Rotation 6'
  }
  
  function animateRotation(direction) {
    setIsAnimating(true)
    setTimeout(() => {
      const newRot = direction === 'next' 
        ? (currentRotation % 6) + 1 
        : currentRotation === 1 ? 6 : currentRotation - 1
      onRotationChange(newRot)
      setIsAnimating(false)
    }, 300)
  }
  
  const tc = isDark ? {
    bg: 'bg-slate-800',
    text: 'text-white',
    muted: 'text-slate-400'
  } : {
    bg: 'bg-white',
    text: 'text-slate-900',
    muted: 'text-slate-500'
  }

  return (
    <div className={`${tc.bg} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => animateRotation('prev')}
          className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center hover:bg-slate-500 transition"
        >
          ←
        </button>
        
        <div className="text-center">
          <h3 className={`font-bold ${tc.text}`}>{rotationLabels[currentRotation]}</h3>
          <p className={`text-xs ${tc.muted}`}>
            {currentRotation === 1 && ' Serving'}
            {rotationType} Rotation
          </p>
        </div>
        
        <button 
          onClick={() => animateRotation('next')}
          className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center hover:bg-slate-500 transition"
        >
          →
        </button>
      </div>
      
      {/* Rotation indicator dots */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5, 6].map(rot => (
          <button
            key={rot}
            onClick={() => onRotationChange(rot)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentRotation === rot 
                ? 'bg-[var(--accent-primary)] scale-125' 
                : 'bg-slate-500 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
      
      {/* Animation overlay */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <div className="flex items-center justify-center"><VolleyballIcon className="w-12 h-12 animate-spin" /></div>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN LINEUP BUILDER COMPONENT
// ============================================
function LineupBuilder({ event, team, onClose, showToast }) {
  const { user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [positions, setPositions] = useState({}) // { courtPosition: player }
  const [rotationType, setRotationType] = useState('5-1')
  const [useLibero, setUseLibero] = useState(true)
  const [liberoPlayer, setLiberoPlayer] = useState(null)
  const [currentSet, setCurrentSet] = useState(1)
  const [totalSets, setTotalSets] = useState(3)
  const [currentRotation, setCurrentRotation] = useState(1)
  const [captain, setCaptain] = useState(null)
  const [coCaptain, setCoCaptain] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  const [lineupId, setLineupId] = useState(null)
  const [previousResults, setPreviousResults] = useState([])
  const [activeTab, setActiveTab] = useState('lineup') // 'lineup', 'sets', 'history'
  
  useEffect(() => {
    loadData()
  }, [event?.id, team?.id])
  
  async function loadData() {
    setLoading(true)
    try {
      // Load team roster with positions
      const { data: players } = await supabase
        .from('team_players')
        .select(`
          player_id,
          jersey_number,
          position,
          players (
            id, first_name, last_name, photo_url, jersey_number,
            parent_name, parent_phone, medical_conditions, allergies,
            player_positions (primary_position, secondary_position, skill_rating, serve_rating, attack_rating, defense_rating, is_captain, can_play_libero)
          )
        `)
        .eq('team_id', team.id)
      
      const enrichedRoster = (players || []).map(tp => ({
        ...tp.players,
        jersey_number: tp.jersey_number || tp.players?.jersey_number,
        primary_position: tp.players?.player_positions?.[0]?.primary_position || tp.position || 'UT',
        secondary_position: tp.players?.player_positions?.[0]?.secondary_position,
        skill_rating: tp.players?.player_positions?.[0]?.skill_rating || 50,
        serve_rating: tp.players?.player_positions?.[0]?.serve_rating || 50,
        attack_rating: tp.players?.player_positions?.[0]?.attack_rating || 50,
        defense_rating: tp.players?.player_positions?.[0]?.defense_rating || 50,
        is_captain: tp.players?.player_positions?.[0]?.is_captain,
        can_play_libero: tp.players?.player_positions?.[0]?.can_play_libero,
      }))
      
      setRoster(enrichedRoster)
      
      // Load RSVPs for this event
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('player_id, status')
        .eq('event_id', event.id)
      
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r.status })
      setRsvps(rsvpMap)
      
      // Load existing lineup if any
      const { data: existingLineup } = await supabase
        .from('game_lineups')
        .select('*, lineup_positions(*)')
        .eq('event_id', event.id)
        .eq('team_id', team.id)
        .maybeSingle()
      
      if (existingLineup) {
        setLineupId(existingLineup.id)
        setRotationType(existingLineup.rotation_type || '5-1')
        setUseLibero(existingLineup.use_libero)
        setTotalSets(existingLineup.total_sets || 3)
        
        // Set captain
        if (existingLineup.captain_player_id) {
          setCaptain(enrichedRoster.find(p => p.id === existingLineup.captain_player_id))
        }
        
        // Load positions for current set/rotation
        const posMap = {}
        existingLineup.lineup_positions
          ?.filter(lp => lp.set_number === currentSet && lp.rotation_number === currentRotation)
          .forEach(lp => {
            const player = enrichedRoster.find(p => p.id === lp.player_id)
            if (player) posMap[lp.court_position] = player
          })
        setPositions(posMap)
      }
      
      // Load previous game results vs same opponent
      if (event.opponent_name) {
        const { data: history } = await supabase
          .from('game_results')
          .select('*')
          .eq('team_id', team.id)
          .ilike('opponent_name', `%${event.opponent_name}%`)
          .order('recorded_at', { ascending: false })
          .limit(5)
        
        setPreviousResults(history || [])
      }
      
    } catch (err) {
      console.error('Error loading lineup data:', err)
      showToast?.('Error loading lineup data', 'error')
    }
    setLoading(false)
  }
  
  // Drag handlers
  function handleDragStart(e, player) {
    setDraggedPlayer(player)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  function handleDrop(e, courtPosition) {
    e.preventDefault()
    if (!draggedPlayer) return
    
    // Check RSVP status
    const rsvpStatus = rsvps[draggedPlayer.id]
    if (!rsvpStatus || rsvpStatus === 'pending' || rsvpStatus === 'no') {
      const confirmPlace = window.confirm(
        `⚠️ ${draggedPlayer.first_name} has not confirmed attendance.\n\nRSVP Status: ${rsvpStatus || 'No response'}\n\nPlace anyway?`
      )
      if (!confirmPlace) {
        setDraggedPlayer(null)
        return
      }
    }
    
    // Remove from any existing position
    const newPositions = { ...positions }
    Object.keys(newPositions).forEach(pos => {
      if (newPositions[pos]?.id === draggedPlayer.id) {
        delete newPositions[pos]
      }
    })
    
    // Place in new position
    newPositions[courtPosition] = draggedPlayer
    setPositions(newPositions)
    setDraggedPlayer(null)
  }
  
  function removeFromCourt(courtPosition) {
    const newPositions = { ...positions }
    delete newPositions[courtPosition]
    setPositions(newPositions)
  }
  
  // Auto-fill lineup based on positions and ratings
  function autoFillLineup() {
    const config = ROTATION_CONFIGS[rotationType]
    const availablePlayers = roster.filter(p => {
      const rsvp = rsvps[p.id]
      return rsvp === 'attending' || rsvp === 'yes'
    })
    
    const newPositions = {}
    const usedPlayers = new Set()
    
    // For 6-6, just fill positions 1-6 with highest rated available
    if (rotationType === '6-6') {
      const sorted = [...availablePlayers].sort((a, b) => (b.skill_rating || 50) - (a.skill_rating || 50))
      sorted.slice(0, 6).forEach((player, idx) => {
        newPositions[idx + 1] = player
      })
    } else {
      // Try to match positions
      config.positions.forEach((posNeeded, idx) => {
        const courtPos = idx + 1
        
        // Find best available player for this position
        const candidates = availablePlayers
          .filter(p => !usedPlayers.has(p.id))
          .sort((a, b) => {
            const aMatch = a.primary_position === posNeeded ? 100 : (a.secondary_position === posNeeded ? 50 : 0)
            const bMatch = b.primary_position === posNeeded ? 100 : (b.secondary_position === posNeeded ? 50 : 0)
            return (bMatch + (b.skill_rating || 50)) - (aMatch + (a.skill_rating || 50))
          })
        
        if (candidates[0]) {
          newPositions[courtPos] = candidates[0]
          usedPlayers.add(candidates[0].id)
        }
      })
    }
    
    setPositions(newPositions)
    showToast?.('Lineup auto-filled!', 'success')
  }
  
  // Save lineup
  async function saveLineup(publish = false) {
    setSaving(true)
    try {
      // Create or update lineup record
      const lineupData = {
        event_id: event.id,
        team_id: team.id,
        rotation_type: rotationType,
        use_libero: useLibero,
        libero_player_id: liberoPlayer?.id,
        total_sets: totalSets,
        captain_player_id: captain?.id,
        co_captain_player_id: coCaptain?.id,
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
        created_by: user?.id,
        updated_at: new Date().toISOString()
      }
      
      let savedLineupId = lineupId
      
      if (lineupId) {
        await supabase.from('game_lineups').update(lineupData).eq('id', lineupId)
      } else {
        const { data: newLineup } = await supabase
          .from('game_lineups')
          .insert(lineupData)
          .select()
          .single()
        savedLineupId = newLineup.id
        setLineupId(savedLineupId)
      }
      
      // Save positions
      // First delete existing positions for this set/rotation
      await supabase
        .from('lineup_positions')
        .delete()
        .eq('lineup_id', savedLineupId)
        .eq('set_number', currentSet)
        .eq('rotation_number', currentRotation)
      
      // Insert new positions
      const positionRecords = Object.entries(positions).map(([pos, player]) => ({
        lineup_id: savedLineupId,
        set_number: currentSet,
        rotation_number: currentRotation,
        court_position: parseInt(pos),
        player_id: player.id,
        is_serving: currentRotation === 1 && parseInt(pos) === 1,
        is_libero_in: player.id === liberoPlayer?.id
      }))
      
      if (positionRecords.length > 0) {
        await supabase.from('lineup_positions').insert(positionRecords)
      }
      
      showToast?.(publish ? 'Lineup published!' : 'Lineup saved!', 'success')
      
    } catch (err) {
      console.error('Error saving lineup:', err)
      showToast?.('Error saving lineup', 'error')
    }
    setSaving(false)
  }
  
  // Get players on bench (not on court)
  const benchPlayers = roster.filter(p => 
    !Object.values(positions).find(cp => cp?.id === p.id)
  )
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`${tc.cardBg} rounded-2xl p-8 text-center`}>
          <div className="animate-spin w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className={tc.text}>Loading lineup builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
      <div className={`${tc.cardBg} rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col`}>
        {/* Header - Compact */}
        <div className={`p-3 border-b ${tc.border} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${tc.text}`}>Game Prep: {event?.title || 'vs TBD'}</h2>
              <p className={`text-xs ${tc.textMuted}`}>
                {event?.event_date && new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {event?.event_time && ` • ${event.event_time}`}
                {' • '}{team?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-full ${tc.hoverBg} flex items-center justify-center text-lg`}>
            ✕
          </button>
        </div>
        
        {/* Tabs - Compact */}
        <div className={`flex border-b ${tc.border} flex-shrink-0`}>
          {[
            { id: 'lineup', label: 'Lineup', icon: 'volleyball' },
            { id: 'sets', label: 'Sets', icon: 'clipboard' },
            { id: 'history', label: 'History', icon: 'bar-chart' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : `${tc.textMuted} ${tc.hoverBg}`
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content - Fills remaining space */}
        <div className="flex-1 overflow-auto p-3">
          {activeTab === 'lineup' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Court Section - takes up most space */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                {/* Rotation Controls - Compact inline */}
                <div className={`${tc.cardBgAlt} rounded-xl p-3 flex flex-wrap items-center gap-3`}>
                  <div className="flex items-center gap-2">
                    <label className={`text-xs ${tc.textMuted}`}>Type:</label>
                    <select 
                      value={rotationType}
                      onChange={e => setRotationType(e.target.value)}
                      className={`px-2 py-1.5 rounded-lg text-sm ${tc.input}`}
                    >
                      {Object.entries(ROTATION_CONFIGS).map(([key, config]) => (
                        <option key={key} value={key}>{config.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {ROTATION_CONFIGS[rotationType].liberoOptional && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input 
                        type="checkbox" 
                        checked={useLibero}
                        onChange={e => setUseLibero(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={tc.text}>Libero</span>
                    </label>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <label className={`text-xs ${tc.textMuted}`}>Sets:</label>
                    <select 
                      value={totalSets}
                      onChange={e => setTotalSets(parseInt(e.target.value))}
                      className={`px-2 py-1.5 rounded-lg text-sm ${tc.input}`}
                    >
                      <option value={3}>Best of 3</option>
                      <option value={5}>Best of 5</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={autoFillLineup}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition ml-auto"
                  >
                    ✨ Auto-Fill
                  </button>
                </div>
                
                {/* Rotation Navigator - Compact */}
                <div className={`${tc.cardBgAlt} rounded-xl p-2 flex items-center justify-between`}>
                  <button 
                    onClick={() => setCurrentRotation(r => r === 1 ? 6 : r - 1)}
                    className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center hover:brightness-110 transition text-sm"
                  >
                    ←
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map(rot => (
                      <button
                        key={rot}
                        onClick={() => setCurrentRotation(rot)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          currentRotation === rot 
                            ? 'bg-[var(--accent-primary)] text-white scale-110' 
                            : `${tc.cardBg} ${tc.textMuted} hover:bg-[var(--accent-primary)]/20`
                        }`}
                      >
                        {rot === 1 ? 'practice' : rot}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setCurrentRotation(r => r === 6 ? 1 : r + 1)}
                    className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center hover:brightness-110 transition text-sm"
                  >
                    →
                  </button>
                </div>
                
                {/* The Court - Compact */}
                <div className={`${tc.cardBgAlt} rounded-xl p-3`}>
                  <VolleyballCourt isDark={isDark} showServeIndicator={true} servingPosition={currentRotation === 1 ? 1 : null} compact={true}>
                    {/* Render court positions */}
                    {Object.entries(COURT_POSITIONS).map(([pos, coords]) => {
                      const player = positions[pos]
                      const isServing = currentRotation === 1 && parseInt(pos) === 1
                      // Get the expected position abbreviation for this slot based on rotation type
                      const rotConfig = ROTATION_CONFIGS[rotationType]
                      const posIndex = parseInt(pos) - 1
                      const expectedPos = rotConfig.positions[posIndex] || coords.defaultPos || 'UT'
                      const posColor = POSITION_COLORS[expectedPos] || '#6366F1'
                      
                      return (
                        <div
                          key={pos}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                            draggedPlayer ? 'ring-2 ring-dashed ring-[var(--accent-primary)] rounded-xl' : ''
                          }`}
                          style={{ 
                            left: `${coords.x}%`, 
                            top: `${coords.y}%`,
                          }}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, parseInt(pos))}
                        >
                          {player ? (
                            <div className="relative">
                              <PlayerIcon
                                player={player}
                                position={pos}
                                isServing={isServing}
                                isLibero={player.id === liberoPlayer?.id}
                                isCaptain={player.id === captain?.id}
                                hasRsvp={!!rsvps[player.id]}
                                rsvpStatus={rsvps[player.id]}
                                isDark={isDark}
                                onClick={setSelectedPlayer}
                                onDragStart={handleDragStart}
                                isOnCourt={true}
                                size="small"
                              />
                              <button
                                onClick={() => removeFromCourt(pos)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            /* Empty slot shows position abbreviation */
                            <div 
                              className="w-11 h-11 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-solid transition-all"
                              style={{ 
                                borderColor: posColor,
                                backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)'
                              }}
                            >
                              <span className="text-xs font-bold" style={{ color: posColor }}>{expectedPos}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </VolleyballCourt>
                </div>
                
                {/* Captains - Compact inline */}
                <div className={`${tc.cardBgAlt} rounded-xl p-3`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${tc.text}`}>Captains:</span>
                    <select 
                      value={captain?.id || ''}
                      onChange={e => setCaptain(roster.find(p => p.id === e.target.value))}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm ${tc.input}`}
                    >
                      <option value="">Captain...</option>
                      {roster.map(p => (
                        <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name}</option>
                      ))}
                    </select>
                    <select 
                      value={coCaptain?.id || ''}
                      onChange={e => setCoCaptain(roster.find(p => p.id === e.target.value))}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm ${tc.input}`}
                    >
                      <option value="">Co-Captain...</option>
                      {roster.filter(p => p.id !== captain?.id).map(p => (
                        <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Roster Panel - Compact */}
              <div className="flex flex-col gap-3">
                <div className={`${tc.cardBgAlt} rounded-xl p-3 flex-1`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${tc.text} text-sm`}>Roster ({roster.length})</h3>
                    <span className={`text-xs ${tc.textMuted}`}>Drag to court</span>
                  </div>
                  
                  {/* Legend - Compact */}
                  <div className="flex gap-2 mb-2 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500">✓</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">?</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500"><X className="w-4 h-4" /></span>
                  </div>
                  
                  {/* Players grid - Compact */}
                  <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto">
                    {roster.length === 0 ? (
                      <div className={`col-span-4 text-center py-4 ${tc.textMuted} text-sm`}>
                        No players on roster
                      </div>
                    ) : benchPlayers.length === 0 ? (
                      <div className={`col-span-4 text-center py-4 ${tc.textMuted} text-sm`}>
                        All players on court
                      </div>
                    ) : (
                      benchPlayers.map(player => {
                        const rsvpStatus = rsvps[player.id]
                        const isGoing = rsvpStatus === 'attending' || rsvpStatus === 'yes'
                        const isPending = !rsvpStatus || rsvpStatus === 'pending'
                        const posColor = POSITION_COLORS[player.primary_position] || '#6366F1'
                        
                        return (
                          <div 
                            key={player.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, player)}
                            onClick={() => setSelectedPlayer(player)}
                            className={`relative cursor-grab active:cursor-grabbing ${!isGoing ? 'opacity-60' : ''}`}
                          >
                            <div 
                              className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition hover:scale-105 ${tc.cardBg}`}
                              style={{ borderColor: posColor }}
                            >
                              {player.photo_url ? (
                                <img src={player.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: posColor }}>
                                  {player.jersey_number || '?'}
                                </div>
                              )}
                              <span className={`text-[10px] font-medium ${tc.text} mt-0.5 truncate w-full text-center px-1`}>
                                {player.first_name?.slice(0, 6)}
                              </span>
                            </div>
                            {/* RSVP badge */}
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                              isGoing ? 'bg-emerald-500 text-white' : 
                              isPending ? 'bg-amber-500 text-white' : 
                              'bg-red-500 text-white'
                            }`}>
                              {isGoing ? '✓' : isPending ? '?' : '✕'}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                
                {/* On Court Summary - Compact */}
                <div className={`${tc.cardBgAlt} rounded-xl p-3`}>
                  <h3 className={`font-semibold ${tc.text} text-sm mb-2`}>On Court ({Object.keys(positions).length}/6)</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map(pos => {
                      const player = positions[pos]
                      const coords = COURT_POSITIONS[pos]
                      const rotConfig = ROTATION_CONFIGS[rotationType]
                      const expectedPos = rotConfig.positions[pos - 1] || coords?.defaultPos || 'UT'
                      
                      return (
                        <div key={pos} className={`flex items-center gap-1.5 p-1.5 rounded-lg ${tc.cardBg}`}>
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white`}
                            style={{ backgroundColor: POSITION_COLORS[player?.primary_position || expectedPos] || '#6366F1' }}
                          >
                            {pos}
                          </span>
                          <span className={`flex-1 text-xs truncate ${player ? tc.text : tc.textMuted}`}>
                            {player ? `#${player.jersey_number} ${player.first_name}` : expectedPos}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'sets' && (
            <div className="space-y-4">
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}><ClipboardList className="w-5 h-5" />Set-by-Set Planning</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNum => (
                    <div 
                      key={setNum}
                      className={`${tc.cardBg} rounded-xl p-4 cursor-pointer transition ${
                        currentSet === setNum ? 'ring-2 ring-[var(--accent-primary)]' : ''
                      }`}
                      onClick={() => setCurrentSet(setNum)}
                    >
                      <h4 className={`font-bold ${tc.text} mb-2`}>Set {setNum}</h4>
                      <p className={`text-xs ${tc.textMuted}`}>
                        {currentSet === setNum ? 'Currently editing' : 'Click to edit'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={`${tc.cardBgAlt} rounded-xl p-4 text-center`}>
                <span className="text-4xl">🚧</span>
                <p className={`${tc.text} mt-2`}>Advanced set planning coming soon!</p>
                <p className={`text-sm ${tc.textMuted}`}>Plan different lineups for each set, manage substitutions</p>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}><BarChart3 className="w-5 h-5" />Previous Results vs {event?.opponent_name || 'Opponents'}</h3>
                {previousResults.length > 0 ? (
                  <div className="space-y-3">
                    {previousResults.map(result => (
                      <div key={result.id} className={`${tc.cardBg} rounded-xl p-4 flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                          result.result === 'win' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {result.result === 'win' ? 'W' : 'L'}
                        </div>
                        <div className="flex-1">
                          <p className={tc.text}>vs {result.opponent_name}</p>
                          <p className={`text-sm ${tc.textMuted}`}>
                            {new Date(result.recorded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${tc.text}`}>
                            {result.sets_won}-{result.sets_lost}
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>Sets</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12" />
                    <p className={`${tc.textMuted} mt-2`}>No previous games against this opponent</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions - Compact */}
        <div className={`p-3 border-t ${tc.border} flex items-center justify-between flex-shrink-0`}>
          <span className={`text-sm ${tc.textMuted}`}>Set {currentSet} • Rot {currentRotation}</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg ${tc.cardBg} border ${tc.border} ${tc.text} text-sm font-medium hover:opacity-80 transition`}
            >
              Close
            </button>
            <button
              onClick={() => saveLineup(false)}
              disabled={saving}
              className={`px-4 py-1.5 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 transition disabled:opacity-50`}
            >
              {saving ? '...' : '💾 Draft'}
            </button>
            <button
              onClick={() => saveLineup(true)}
              disabled={saving || Object.keys(positions).length < 6}
              className={`px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-50`}
            >
              Publish
            </button>
          </div>
        </div>
      </div>
      
      {/* Player Card Modal */}
      {selectedPlayer && (
        <GamePlayerCard 
          player={selectedPlayer} 
          onClose={() => setSelectedPlayer(null)}
          isDark={isDark}
        />
      )}
    </div>
  )
}

// Export for use in main app
// Usage: <LineupBuilder event={event} team={team} onClose={() => {}} showToast={showToast} />

// ============================================
// GAME PREP PAGE
// Lists upcoming games with lineup status
// ============================================

function GamePrepPage({ showToast }) {
  const { organization } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [lineupStatuses, setLineupStatuses] = useState({})

  useEffect(() => {
    loadTeams()
  }, [selectedSeason?.id])

  useEffect(() => {
    if (selectedTeam) loadGames()
  }, [selectedTeam])

  async function loadTeams() {
    if (!selectedSeason?.id) return
    
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
      const { data: gamesData } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(20)
      
      setGames(gamesData || [])
      
      // Load lineup statuses for these games
      if (gamesData?.length > 0) {
        const eventIds = gamesData.map(g => g.id)
        const { data: lineups } = await supabase
          .from('game_lineups')
          .select('event_id, is_published, rotation_type')
          .in('event_id', eventIds)
        
        const statusMap = {}
        lineups?.forEach(l => {
          statusMap[l.event_id] = {
            hasLineup: true,
            isPublished: l.is_published,
            rotationType: l.rotation_type
          }
        })
        setLineupStatuses(statusMap)
      }
      
    } catch (err) {
      console.error('Error loading games:', err)
    }
    setLoading(false)
  }

  function getLineupStatus(gameId) {
    const status = lineupStatuses[gameId]
    if (!status) return { label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/20' }
    if (status.isPublished) return { label: 'Published', color: 'text-emerald-500', bg: 'bg-emerald-500/20' }
    return { label: 'Draft', color: 'text-amber-500', bg: 'bg-amber-500/20' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}><VolleyballIcon className="w-7 h-7 inline mr-2" />Game Prep</h1>
          <p className={tc.textSecondary}>Build lineups and prepare for upcoming games</p>
        </div>
      </div>

      {/* Team Selector */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-4`}>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-medium ${
                selectedTeam?.id === team.id
                  ? 'text-white shadow-lg'
                  : `${tc.cardBgAlt} ${tc.textSecondary} ${tc.hoverBg}`
              }`}
              style={selectedTeam?.id === team.id ? { backgroundColor: team.color } : {}}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
              {team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Games List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map(game => {
            const status = getLineupStatus(game.id)
            const gameDate = new Date(game.event_date)
            const isToday = gameDate.toDateString() === new Date().toDateString()
            const isTomorrow = gameDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
            
            return (
              <div 
                key={game.id}
                className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5 hover:border-[var(--accent-primary)]/50 transition cursor-pointer`}
                onClick={() => setSelectedGame(game)}
              >
                <div className="flex items-start gap-4">
                  {/* Date */}
                  <div 
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white"
                    style={{ backgroundColor: selectedTeam?.color || '#6366F1' }}
                  >
                    <span className="text-xs uppercase">{gameDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="text-2xl font-bold">{gameDate.getDate()}</span>
                  </div>
                  
                  {/* Game Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${tc.text}`}>
                        {game.title || `vs ${game.opponent_name || 'TBD'}`}
                      </h3>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-500">TODAY</span>
                      )}
                      {isTomorrow && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500">TOMORROW</span>
                      )}
                    </div>
                    <p className={`text-sm ${tc.textMuted}`}>
                      {game.event_time && formatTime12(game.event_time)}
                      {game.venue_name && ` • ${game.venue_name}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      {lineupStatuses[game.id]?.rotationType && (
                        <span className={`text-xs ${tc.textMuted}`}>
                          {lineupStatuses[game.id].rotationType}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action */}
                  <button 
                    className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-medium hover:brightness-110 transition"
                    onClick={(e) => { e.stopPropagation(); setSelectedGame(game); }}
                  >
                    {lineupStatuses[game.id] ? 'Edit' : 'Prep'} →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-12 text-center`}>
          <span className="text-6xl"><VolleyballIcon className="w-16 h-16" /></span>
          <h2 className={`text-xl font-bold ${tc.text} mt-4`}>No Upcoming Games</h2>
          <p className={tc.textMuted}>Schedule some games to start prepping!</p>
        </div>
      )}

      {/* Past Games Section */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
        <h2 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
          <BarChart3 className="w-5 h-5" /> Recent Game Results
        </h2>
        <div className="text-center py-6">
          <span className="text-4xl">🚧</span>
          <p className={`${tc.textMuted} mt-2`}>Game results will appear here after you record scores</p>
        </div>
      </div>

      {/* Lineup Builder Modal */}
      {selectedGame && selectedTeam && (
        <LineupBuilder
          event={selectedGame}
          team={selectedTeam}
          onClose={() => { setSelectedGame(null); loadGames(); }}
          showToast={showToast}
        />
      )}
    </div>
  )
}



export { GamePrepPage }
