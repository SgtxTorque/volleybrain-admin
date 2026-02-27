import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  User, Users, DollarSign, ClipboardList, MessageCircle, Calendar, 
  Check, X, Edit, Trash2, Plus, Eye, Download, Upload, Settings,
  BarChart3, Target, Bell, Lock, Unlock, Globe, CreditCard,
  Mail, Phone, MapPin, Home, AlertTriangle, Shirt, Star, Award,
  TrendingUp, FileText, ChevronRight, RefreshCw, Save
} from '../../constants/icons'

// ============================================
// CONSTANTS
// ============================================
export const positionColors = {
  // Volleyball
  'OH': '#FF6B6B', 'S': '#4ECDC4', 'MB': '#45B7D1', 'OPP': '#96CEB4',
  'L': '#FFEAA7', 'DS': '#DDA0DD', 'RS': '#FF9F43',
  // Basketball
  'PG': '#4ECDC4', 'SG': '#FF6B6B', 'SF': '#45B7D1', 'PF': '#96CEB4', 'C': '#FFEAA7',
  // Soccer
  'GK': '#FFEAA7', 'DEF': '#45B7D1', 'MID': '#4ECDC4', 'FWD': '#FF6B6B',
  // Baseball/Softball
  'P': '#4ECDC4', 'CA': '#FFEAA7', 'INF': '#45B7D1', 'OF': '#96CEB4',
}

export const positionNames = {
  // Volleyball
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 'RS': 'Right Side',
  // Basketball
  'PG': 'Point Guard', 'SG': 'Shooting Guard', 'SF': 'Small Forward', 
  'PF': 'Power Forward', 'C': 'Center',
  // Soccer
  'GK': 'Goalkeeper', 'DEF': 'Defender', 'MID': 'Midfielder', 'FWD': 'Forward',
  // Baseball/Softball
  'P': 'Pitcher', 'CA': 'Catcher', 'INF': 'Infielder', 'OF': 'Outfielder',
}

// Icon mapping for action buttons and contact rows
export const getIconComponent = (iconName, size = "w-4 h-4") => {
  const iconMap = {
    user: User, users: Users, clipboard: ClipboardList, dollar: DollarSign,
    shirt: Shirt, mail: Mail, phone: Phone, smartphone: Phone, map: MapPin,
    home: Home, calendar: Calendar, message: MessageCircle, 'alert-triangle': AlertTriangle,
    check: Check, x: X, edit: Edit, trash: Trash2, plus: Plus, eye: Eye,
    download: Download, upload: Upload, settings: Settings, 'bar-chart': BarChart3,
    target: Target, bell: Bell, lock: Lock, unlock: Unlock, globe: Globe,
    'credit-card': CreditCard, star: Star, award: Award, trending: TrendingUp,
    file: FileText, refresh: RefreshCw, save: Save,
  }
  const IconComp = iconMap[iconName]
  return IconComp ? <IconComp className={size} /> : <span>{iconName}</span>
}

// ============================================
// HELPER COMPONENTS
// ============================================
export function InfoBox({ label, value, highlight }) {
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-medium ${highlight ? 'text-[var(--accent-primary)]' : 'text-white'}`}>{value || '—'}</div>
    </div>
  )
}

export function ActionButton({ label, icon, onClick, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-900 text-gray-300 hover:bg-slate-700 hover:text-white',
    primary: 'bg-[var(--accent-primary)] text-white hover:brightness-110',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
  }
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${variants[variant]}`}>
      {getIconComponent(icon, "w-4 h-4")} {label}
    </button>
  )
}

export function PlayerWaiverBadge({ label, signed }) {
  return (
    <div className={`rounded-lg p-2 text-center ${signed ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
      <div className={`flex items-center justify-center ${signed ? 'text-emerald-400' : 'text-red-400'}`}>
        {signed ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

export function ContactRow({ icon, label, value, link }) {
  const content = (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-500 text-sm flex items-center gap-2">{getIconComponent(icon, "w-4 h-4")} {label}</span>
      <span className={`text-white ${link ? 'hover:text-[var(--accent-primary)]' : ''}`}>{value || '—'}</span>
    </div>
  )
  return link && value ? <a href={link}>{content}</a> : content
}

export function DocumentRow({ label, url }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-400">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:underline text-sm">View →</a>
      ) : (
        <span className="text-slate-600 text-sm">Not uploaded</span>
      )}
    </div>
  )
}

// ============================================
// SKILL BAR COMPONENT
// ============================================
function SkillBar({ label, value, maxValue = 10, onChange, editable = false }) {
  const percentage = (value / maxValue) * 100
  const getColor = (val) => {
    if (val <= 3) return '#EF4444' // Red
    if (val <= 5) return '#F59E0B' // Amber
    if (val <= 7) return '#10B981' // Green
    return '#8B5CF6' // Purple for elite
  }
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {editable ? (
            <select 
              value={value || 0}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-white text-sm"
            >
              {[...Array(11)].map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-bold" style={{ color: getColor(value) }}>{value || 0}</span>
          )}
          <span className="text-xs text-slate-500">/ {maxValue}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: getColor(value) }}
        />
      </div>
    </div>
  )
}

// ============================================
// SKILL RADAR CHART (Simple CSS-based)
// ============================================
function SkillRadar({ skills, skillTemplates }) {
  if (!skills || !skillTemplates || skillTemplates.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No skill data available</p>
      </div>
    )
  }

  const maxValue = 10
  const centerX = 100
  const centerY = 100
  const radius = 80

  // Calculate points for the radar
  const points = skillTemplates.map((template, i) => {
    const angle = (Math.PI * 2 * i) / skillTemplates.length - Math.PI / 2
    const value = skills[template.skill_key] || 0
    const distance = (value / maxValue) * radius
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
      labelX: centerX + Math.cos(angle) * (radius + 20),
      labelY: centerY + Math.sin(angle) * (radius + 20),
      label: template.skill_name,
      value: value
    }
  })

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')

  // Background grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(scale => (
    <circle
      key={scale}
      cx={centerX}
      cy={centerY}
      r={radius * scale}
      fill="none"
      stroke="#334155"
      strokeWidth="1"
      opacity="0.5"
    />
  ))

  // Grid lines from center to each point
  const gridLines = skillTemplates.map((_, i) => {
    const angle = (Math.PI * 2 * i) / skillTemplates.length - Math.PI / 2
    return (
      <line
        key={i}
        x1={centerX}
        y1={centerY}
        x2={centerX + Math.cos(angle) * radius}
        y2={centerY + Math.sin(angle) * radius}
        stroke="#334155"
        strokeWidth="1"
        opacity="0.5"
      />
    )
  })

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 200 200" className="w-64 h-64">
        {/* Background grid */}
        {gridCircles}
        {gridLines}
        
        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(var(--accent-primary-rgb, 249, 115, 22), 0.3)"
          stroke="var(--accent-primary)"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="var(--accent-primary)"
          />
        ))}
        
        {/* Labels */}
        {points.map((point, i) => (
          <text
            key={i}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-400 text-[8px] font-medium"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ============================================
// BADGE DISPLAY COMPONENT
// ============================================
function BadgeDisplay({ badge }) {
  const badgeIcons = {
    'mvp': '🏆', 'player_of_week': '⭐', 'most_improved': '📈',
    'hardest_worker': '💪', 'team_spirit': '🤝', 'leadership': '👑',
    'perfect_attendance': '✅', 'sportsmanship': '🎖️', 'rookie': '🌟',
    'veteran': '🎯', 'clutch': '🔥', 'defensive': '🛡️',
  }
  
  return (
    <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl">
        {badgeIcons[badge.badge_type] || '🏅'}
      </div>
      <div className="flex-1">
        <p className="text-white font-semibold">{badge.badge_name}</p>
        <p className="text-slate-500 text-xs">
          {badge.awarded_at ? new Date(badge.awarded_at).toLocaleDateString() : ''}
          {badge.notes && ` • ${badge.notes}`}
        </p>
      </div>
    </div>
  )
}

// ============================================
// GOAL CARD COMPONENT
// ============================================
function GoalCard({ goal, onUpdate, editable }) {
  const statusColors = {
    active: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    paused: 'bg-amber-500/20 text-amber-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  }
  
  const progress = goal.target_value 
    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
    : null

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-white font-semibold">{goal.title}</h4>
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[goal.status]}`}>
            {goal.status}
          </span>
        </div>
        {editable && goal.status === 'active' && (
          <button 
            onClick={() => onUpdate(goal.id, { status: 'completed', completed_at: new Date().toISOString() })}
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            <Check className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {goal.description && (
        <p className="text-slate-400 text-sm mb-3">{goal.description}</p>
      )}
      
      {progress !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Progress</span>
            <span className="text-white">{goal.current_value} / {goal.target_value}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {goal.target_date && (
        <p className="text-slate-500 text-xs mt-2">
          Target: {new Date(goal.target_date).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

// ============================================
// COACH NOTE COMPONENT
// ============================================
function CoachNote({ note }) {
  const typeColors = {
    general: 'border-slate-600',
    praise: 'border-emerald-500',
    improvement: 'border-amber-500',
    concern: 'border-red-500',
    behavior: 'border-purple-500',
  }
  
  return (
    <div className={`bg-slate-900 rounded-xl p-4 border-l-4 ${typeColors[note.note_type] || typeColors.general}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-slate-500 uppercase">{note.note_type}</span>
        <span className="text-xs text-slate-600">
          {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
        </span>
      </div>
      <p className="text-slate-300 text-sm">{note.content}</p>
    </div>
  )
}

// ============================================
// PLAYER CARD (Compact view)
// ============================================
export function PlayerCard({ player, context = 'roster', teamColor, onClick, showPhoto = true, size = 'medium' }) {
  const posColor = player.position ? positionColors[player.position] || '#EAB308' : '#EAB308'
  const cardColor = teamColor || posColor

  // Context-specific data
  const getContextInfo = () => {
    switch (context) {
      case 'registration':
        return [
          { label: 'Status', value: player.registration_status || player.status, color: getStatusColor(player.registration_status || player.status) },
          { label: 'Waiver', value: player.waiver_signed ? '✓ Signed' : '⚠️ Pending', color: player.waiver_signed ? '#4ECDC4' : '#FF6B6B' },
          { label: 'Jersey', value: player.jersey_number ? `#${player.jersey_number}` : 'Not Set' }
        ]
      case 'payment':
        return [
          { label: 'Balance', value: player.balance ? `$${player.balance}` : '$0', color: player.balance > 0 ? '#FF6B6B' : '#4ECDC4' },
          { label: 'Last Paid', value: player.last_paid_date || 'Never' },
          { label: 'Plan', value: player.payment_plan || 'N/A' }
        ]
      case 'attendance':
        return [
          { label: 'RSVP', value: player.rsvp_status || 'Pending', color: player.rsvp_status === 'yes' ? '#4ECDC4' : player.rsvp_status === 'no' ? '#FF6B6B' : '#FFB347' },
          { label: 'Rate', value: player.attendance_rate ? `${player.attendance_rate}%` : 'N/A' },
          { label: 'Last', value: player.last_attendance || 'N/A' }
        ]
      case 'jersey':
        return [
          { label: 'Number', value: player.jersey_number ? `#${player.jersey_number}` : 'None', color: cardColor },
          { label: 'Size', value: player.uniform_size_jersey || 'N/A' },
          { label: 'Prefs', value: [player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean).join(', ') || 'None' }
        ]
      default: // roster
        return [
          { label: 'POS', value: player.position || '—', color: posColor },
          { label: 'GRD', value: player.grade || '—' },
          { label: 'JRS', value: player.jersey_number ? `#${player.jersey_number}` : '—', color: cardColor }
        ]
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'new': '#FFB347', 'pending': '#FFB347', 'submitted': '#FFB347',
      'approved': '#4ECDC4', 'rostered': '#4ECDC4', 'active': '#4ECDC4', 'assigned': '#4ECDC4',
      'denied': '#FF6B6B', 'withdrawn': '#FF6B6B', 'inactive': '#FF6B6B'
    }
    return colors[status?.toLowerCase()] || '#6B7280'
  }

  const contextInfo = getContextInfo()
  const sizeClasses = {
    small: 'w-32 h-40',
    medium: 'w-40 h-48',
    large: 'w-48 h-56'
  }

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${sizeClasses[size]}`}
      style={{ background: `linear-gradient(135deg, ${cardColor}30 0%, #0a0a0a 100%)` }}
    >
      {/* Position badge */}
      {player.position && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: posColor, color: '#000' }}>
          {player.position}
        </div>
      )}

      {/* Jersey number */}
      {player.jersey_number && (
        <div className="absolute top-2 right-2 text-2xl font-black" style={{ color: cardColor, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          {player.jersey_number}
        </div>
      )}

      {/* Photo/Silhouette */}
      <div className="flex justify-center pt-8 pb-2">
        {showPhoto && player.photo_url ? (
          <img src={player.photo_url} alt="" className="w-16 h-16 rounded-full border-2 object-cover" style={{ borderColor: posColor + '60' }} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#1a1a2e] border-2 flex items-center justify-center" style={{ borderColor: cardColor + '40' }}>
            <span className="flex items-center justify-center"><User className="w-6 h-6 text-slate-600" /></span>
          </div>
        )}
      </div>

      {/* Name bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-3 py-2">
        <div className="text-white font-bold text-sm truncate">{player.first_name} {player.last_name?.charAt(0)}.</div>
        
        {/* Context info row */}
        <div className="flex justify-between mt-1">
          {contextInfo.map((info, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] text-slate-500">{info.label}</div>
              <div className="text-xs font-semibold" style={{ color: info.color || '#fff' }}>{info.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: posColor }} />
    </div>
  )
}

// ============================================
// PLAYER CARD EXPANDED (Full detail modal)
// Role-aware with Development, Goals, Stats, Badges, Notes
// ============================================
export function PlayerCardExpanded({ 
  player, 
  visible, 
  onClose, 
  onNavigate, 
  context = 'roster',
  viewerRole = 'admin', // 'admin', 'coach', 'parent'
  isOwnChild = false,   // For parent viewing own child
  seasonId = null,
  sport = 'volleyball'
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [playerData, setPlayerData] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [payments, setPayments] = useState([])
  const [teamAssignments, setTeamAssignments] = useState([])
  
  // Development data
  const [skillTemplates, setSkillTemplates] = useState([])
  const [playerSkills, setPlayerSkills] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [goals, setGoals] = useState([])
  const [badges, setBadges] = useState([])
  const [coachNotes, setCoachNotes] = useState([])
  const [gameStats, setGameStats] = useState([])
  
  // Edit states
  const [isEditingSkills, setIsEditingSkills] = useState(false)
  const [editedSkills, setEditedSkills] = useState({})
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddEvaluation, setShowAddEvaluation] = useState(false)
  const [showAddBadge, setShowAddBadge] = useState(false)

  // Define tabs based on role
  const getTabs = () => {
    const allTabs = [
      { id: 'overview', label: 'Overview', icon: '👤', roles: ['admin', 'coach', 'parent'] },
      { id: 'development', label: 'Development', icon: '📊', roles: ['admin', 'coach'], parentOwn: true },
      { id: 'goals', label: 'Goals', icon: '🎯', roles: ['admin', 'coach'], parentOwn: true },
      { id: 'stats', label: 'Stats', icon: '📈', roles: ['admin', 'coach', 'parent'] },
      { id: 'badges', label: 'Badges', icon: '🏆', roles: ['admin', 'coach', 'parent'] },
      { id: 'notes', label: 'Notes', icon: '📝', roles: ['admin', 'coach'] },
      { id: 'contact', label: 'Contact', icon: '📞', roles: ['admin', 'coach'], parentOwn: true },
      { id: 'medical', label: 'Medical', icon: '🏥', roles: ['admin', 'coach'], parentOwn: true },
      { id: 'registration', label: 'Registration', icon: '📋', roles: ['admin'], parentOwn: true },
      { id: 'payments', label: 'Payments', icon: '💳', roles: ['admin'], parentOwn: true },
    ]
    
    return allTabs.filter(tab => {
      if (tab.roles.includes(viewerRole)) return true
      if (viewerRole === 'parent' && tab.parentOwn && isOwnChild) return true
      return false
    })
  }

  const tabs = getTabs()
  const canEdit = viewerRole === 'admin' || viewerRole === 'coach'

  useEffect(() => {
    if (visible && player?.id) {
      loadAllData()
    }
  }, [visible, player?.id])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([
        loadPlayerData(),
        loadSkillTemplates(),
        loadPlayerSkills(),
        loadEvaluations(),
        loadGoals(),
        loadBadges(),
        loadGameStats(),
        canEdit ? loadCoachNotes() : Promise.resolve(),
      ])
    } catch (err) {
      console.error('Error loading player data:', err)
    }
    setLoading(false)
  }

  async function loadPlayerData() {
    const { data: fullPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('id', player.id)
      .single()
    setPlayerData(fullPlayer)

    const { data: regs } = await supabase
      .from('registrations')
      .select('*, seasons(name)')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
    setRegistrations(regs || [])

    const { data: pays } = await supabase
      .from('payments')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
    setPayments(pays || [])

    const { data: teams } = await supabase
      .from('team_players')
      .select('*, teams(id, name, color, seasons(name))')
      .eq('player_id', player.id)
    setTeamAssignments(teams || [])
  }

  async function loadSkillTemplates() {
    const { data } = await supabase
      .from('sport_skill_templates')
      .select('*')
      .eq('sport_name', sport)
      .eq('is_active', true)
      .order('display_order')
    setSkillTemplates(data || [])
  }

  async function loadPlayerSkills() {
    // Try to get season-specific skills first
    let query = supabase
      .from('player_skills')
      .select('*')
      .eq('player_id', player.id)
    
    if (seasonId) {
      query = query.eq('season_id', seasonId)
    }
    
    const { data } = await query.order('updated_at', { ascending: false }).limit(1)
    
    if (data && data[0]) {
      // Merge old column-based skills with new JSONB skills_data
      const skills = {
        passing: data[0].passing,
        serving: data[0].serving,
        hitting: data[0].hitting,
        blocking: data[0].blocking,
        setting: data[0].setting,
        defense: data[0].defense,
        ...(data[0].skills_data || {})
      }
      setPlayerSkills(skills)
      setEditedSkills(skills)
    }
  }

  async function loadEvaluations() {
    const { data } = await supabase
      .from('player_evaluations')
      .select('*, profiles(full_name)')
      .eq('player_id', player.id)
      .order('evaluation_date', { ascending: false })
    setEvaluations(data || [])
  }

  async function loadGoals() {
    let query = supabase
      .from('player_goals')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
    
    if (seasonId) {
      query = query.eq('season_id', seasonId)
    }
    
    const { data } = await query
    setGoals(data || [])
  }

  async function loadBadges() {
    const { data } = await supabase
      .from('player_badges')
      .select('*')
      .eq('player_id', player.id)
      .order('awarded_at', { ascending: false })
    setBadges(data || [])
  }

  async function loadCoachNotes() {
    const { data } = await supabase
      .from('player_coach_notes')
      .select('*, profiles(full_name)')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
    setCoachNotes(data || [])
  }

  async function loadGameStats() {
    const { data } = await supabase
      .from('player_game_stats')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setGameStats(data || [])
  }

  async function saveSkills() {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('player_skills')
        .select('id')
        .eq('player_id', player.id)
        .eq('season_id', seasonId)
        .single()

      const skillData = {
        player_id: player.id,
        season_id: seasonId,
        sport: sport,
        skills_data: editedSkills,
        // Also update legacy columns for volleyball
        ...(sport === 'volleyball' ? {
          passing: editedSkills.passing || 0,
          serving: editedSkills.serving || 0,
          hitting: editedSkills.hitting || 0,
          blocking: editedSkills.blocking || 0,
          setting: editedSkills.setting || 0,
          defense: editedSkills.defense || 0,
        } : {}),
        updated_at: new Date().toISOString()
      }

      if (existing) {
        await supabase.from('player_skills').update(skillData).eq('id', existing.id)
      } else {
        await supabase.from('player_skills').insert(skillData)
      }

      setPlayerSkills(editedSkills)
      setIsEditingSkills(false)
    } catch (err) {
      console.error('Error saving skills:', err)
    }
  }

  async function resetSkills() {
    if (!confirm('Reset all skills to 0? This cannot be undone.')) return
    
    const resetData = {}
    skillTemplates.forEach(t => { resetData[t.skill_key] = 0 })
    setEditedSkills(resetData)
  }

  async function importPreviousSeasonSkills() {
    // Find most recent skills from a different season
    const { data } = await supabase
      .from('player_skills')
      .select('*')
      .eq('player_id', player.id)
      .neq('season_id', seasonId)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (data && data[0]) {
      const imported = data[0].skills_data || {
        passing: data[0].passing,
        serving: data[0].serving,
        hitting: data[0].hitting,
        blocking: data[0].blocking,
        setting: data[0].setting,
        defense: data[0].defense,
      }
      setEditedSkills(imported)
      alert('Imported skills from previous season!')
    } else {
      alert('No previous season skills found.')
    }
  }

  async function addGoal(goalData) {
    try {
      await supabase.from('player_goals').insert({
        player_id: player.id,
        season_id: seasonId,
        ...goalData,
      })
      loadGoals()
      setShowAddGoal(false)
    } catch (err) {
      console.error('Error adding goal:', err)
    }
  }

  async function updateGoal(goalId, updates) {
    try {
      await supabase.from('player_goals').update(updates).eq('id', goalId)
      loadGoals()
    } catch (err) {
      console.error('Error updating goal:', err)
    }
  }

  async function addCoachNote(noteData) {
    try {
      await supabase.from('player_coach_notes').insert({
        player_id: player.id,
        season_id: seasonId,
        ...noteData,
      })
      loadCoachNotes()
      setShowAddNote(false)
    } catch (err) {
      console.error('Error adding note:', err)
    }
  }

  async function addBadge(badgeData) {
    try {
      await supabase.from('player_badges').insert({
        player_id: player.id,
        awarded_at: new Date().toISOString(),
        ...badgeData,
      })
      loadBadges()
      setShowAddBadge(false)
    } catch (err) {
      console.error('Error adding badge:', err)
    }
  }

  if (!visible || !player) return null

  const p = playerData || player
  const posColor = p.position ? positionColors[p.position] || '#EAB308' : '#EAB308'
  const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalOwed = payments.filter(p => !p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)

  // Calculate overall skill average
  const skillAverage = playerSkills 
    ? Math.round(Object.values(playerSkills).filter(v => typeof v === 'number').reduce((a,b) => a+b, 0) / 
        Math.max(1, Object.values(playerSkills).filter(v => typeof v === 'number').length))
    : null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 text-center" style={{ background: `linear-gradient(180deg, ${posColor}30 0%, #141414 100%)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl">×</button>
          
          {/* Photo */}
          <div className="flex justify-center mb-4">
            {p.photo_url ? (
              <img src={p.photo_url} alt="" className="w-24 h-24 rounded-full border-4 object-cover" style={{ borderColor: posColor + '60' }} />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#1a1a2e] border-4 flex items-center justify-center" style={{ borderColor: posColor + '40' }}>
                <User className="w-10 h-10 text-slate-600" />
              </div>
            )}
          </div>

          {/* Name & Jersey */}
          {p.jersey_number && <div className="text-slate-400 text-sm">#{p.jersey_number}</div>}
          <h2 className="text-2xl font-bold text-white">{p.first_name} {p.last_name}</h2>
          
          {/* Position & Team */}
          <div className="flex items-center justify-center gap-3 mt-2">
            {p.position && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: posColor, color: '#000' }}>
                {positionNames[p.position] || p.position}
              </span>
            )}
            {teamAssignments[0]?.teams?.name && (
              <span className="text-slate-400">{teamAssignments[0].teams.name}</span>
            )}
          </div>

          {/* Quick stats row */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{p.grade || '—'}</div>
              <div className="text-xs text-slate-500">Grade</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: posColor }}>{p.position || '—'}</div>
              <div className="text-xs text-slate-500">Position</div>
            </div>
            {skillAverage !== null && (
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--accent-primary)]">{skillAverage}</div>
                <div className="text-xs text-slate-500">Skill Avg</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{badges.length}</div>
              <div className="text-xs text-slate-500">Badges</div>
            </div>
            {(viewerRole === 'admin' || (viewerRole === 'parent' && isOwnChild)) && (
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: totalOwed > 0 ? '#FF6B6B' : '#4ECDC4' }}>
                  ${totalOwed > 0 ? totalOwed : totalPaid}
                </div>
                <div className="text-xs text-slate-500">{totalOwed > 0 ? 'Owed' : 'Paid'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' 
                  : 'text-slate-500 hover:text-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoBox label="School" value={p.school} />
                    <InfoBox label="Experience" value={p.experience_level || p.experience} />
                    <InfoBox label="Jersey Size" value={p.uniform_size_jersey} />
                    <InfoBox label="Shorts Size" value={p.uniform_size_shorts} />
                    <InfoBox label="Jersey Prefs" value={[p.jersey_pref_1, p.jersey_pref_2, p.jersey_pref_3].filter(Boolean).join(', ')} />
                    <InfoBox label="Status" value={p.status} />
                  </div>

                  {/* Team Assignments */}
                  {teamAssignments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Team Assignments</h4>
                      {teamAssignments.map(ta => (
                        <div key={ta.id} className="bg-slate-900 rounded-lg p-3 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ta.teams?.color || '#EAB308' }} />
                            <span className="text-white">{ta.teams?.name}</span>
                          </div>
                          <span className="text-slate-500 text-sm">{ta.teams?.seasons?.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions - role aware */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {canEdit && <ActionButton label="Add Evaluation" icon="clipboard" onClick={() => setShowAddEvaluation(true)} />}
                      {canEdit && <ActionButton label="Award Badge" icon="award" onClick={() => setShowAddBadge(true)} />}
                      <ActionButton label="View Stats" icon="bar-chart" onClick={() => setActiveTab('stats')} />
                    </div>
                  </div>
                </div>
              )}

              {/* DEVELOPMENT TAB */}
              {activeTab === 'development' && (
                <div className="space-y-6">
                  {/* Skills Section */}
                  <div className="bg-slate-900 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-[var(--accent-primary)]" />
                        Skill Ratings
                      </h4>
                      {canEdit && (
                        <div className="flex gap-2">
                          {isEditingSkills ? (
                            <>
                              <ActionButton label="Save" icon="save" variant="primary" onClick={saveSkills} />
                              <ActionButton label="Cancel" icon="x" onClick={() => { setIsEditingSkills(false); setEditedSkills(playerSkills || {}) }} />
                            </>
                          ) : (
                            <>
                              <ActionButton label="Edit" icon="edit" onClick={() => setIsEditingSkills(true)} />
                              <ActionButton label="Reset" icon="refresh" variant="danger" onClick={resetSkills} />
                              <ActionButton label="Import Previous" icon="download" onClick={importPreviousSeasonSkills} />
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Skill Radar */}
                    {!isEditingSkills && (
                      <SkillRadar skills={playerSkills} skillTemplates={skillTemplates} />
                    )}

                    {/* Skill Bars (shown during edit or as detail) */}
                    <div className={`mt-4 ${isEditingSkills ? '' : 'grid grid-cols-2 gap-x-6'}`}>
                      {skillTemplates.map(template => (
                        <SkillBar
                          key={template.skill_key}
                          label={template.skill_name}
                          value={isEditingSkills ? (editedSkills[template.skill_key] || 0) : (playerSkills?.[template.skill_key] || 0)}
                          editable={isEditingSkills}
                          onChange={(val) => setEditedSkills(prev => ({ ...prev, [template.skill_key]: val }))}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Evaluation History */}
                  <div className="bg-slate-900 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Evaluation History</h4>
                      {canEdit && (
                        <ActionButton label="Add Evaluation" icon="plus" onClick={() => setShowAddEvaluation(true)} />
                      )}
                    </div>
                    
                    {evaluations.length === 0 ? (
                      <p className="text-slate-500 text-sm">No evaluations recorded yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {evaluations.map(ev => (
                          <div key={ev.id} className="bg-slate-800 rounded-lg p-3 border-l-4 border-[var(--accent-primary)]">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-white font-medium capitalize">{ev.evaluation_type.replace('_', ' ')}</span>
                                {ev.is_initial && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Initial</span>}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-[var(--accent-primary)]">{ev.overall_score}/10</div>
                                <div className="text-xs text-slate-500">{new Date(ev.evaluation_date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            {ev.notes && <p className="text-slate-400 text-sm mt-2">{ev.notes}</p>}
                            {ev.profiles?.full_name && (
                              <p className="text-slate-600 text-xs mt-2">By: {ev.profiles.full_name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GOALS TAB */}
              {activeTab === 'goals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-[var(--accent-primary)]" />
                      Player Goals
                    </h4>
                    {canEdit && (
                      <ActionButton label="Add Goal" icon="plus" variant="primary" onClick={() => setShowAddGoal(true)} />
                    )}
                  </div>

                  {/* Active Goals */}
                  <div>
                    <h5 className="text-sm font-semibold text-slate-400 uppercase mb-3">Active Goals</h5>
                    {goals.filter(g => g.status === 'active').length === 0 ? (
                      <p className="text-slate-500 text-sm">No active goals.</p>
                    ) : (
                      <div className="space-y-3">
                        {goals.filter(g => g.status === 'active').map(goal => (
                          <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} editable={canEdit} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Goals */}
                  {goals.filter(g => g.status === 'completed').length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-sm font-semibold text-slate-400 uppercase mb-3">Completed Goals ✓</h5>
                      <div className="space-y-3">
                        {goals.filter(g => g.status === 'completed').map(goal => (
                          <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} editable={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STATS TAB */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
                    Game Statistics
                  </h4>
                  
                  {gameStats.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                      <p className="text-slate-500">No game stats recorded yet.</p>
                    </div>
                  ) : (
                    <>
                      {/* Aggregate Stats */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-slate-900 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white">
                            {gameStats.reduce((sum, g) => sum + (g.kills || 0), 0)}
                          </div>
                          <div className="text-xs text-slate-500">Total Kills</div>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white">
                            {gameStats.reduce((sum, g) => sum + (g.aces || 0), 0)}
                          </div>
                          <div className="text-xs text-slate-500">Total Aces</div>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white">
                            {gameStats.reduce((sum, g) => sum + (g.digs || 0), 0)}
                          </div>
                          <div className="text-xs text-slate-500">Total Digs</div>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white">
                            {gameStats.reduce((sum, g) => sum + (g.blocks || 0), 0)}
                          </div>
                          <div className="text-xs text-slate-500">Total Blocks</div>
                        </div>
                      </div>

                      {/* Recent Games */}
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-slate-400 uppercase mb-3">Recent Games</h5>
                        <div className="space-y-2">
                          {gameStats.slice(0, 5).map(game => (
                            <div key={game.id} className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                              <div className="text-slate-400 text-sm">
                                {game.created_at ? new Date(game.created_at).toLocaleDateString() : 'Game'}
                              </div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-white">{game.kills || 0} K</span>
                                <span className="text-white">{game.aces || 0} A</span>
                                <span className="text-white">{game.digs || 0} D</span>
                                <span className="text-white">{game.blocks || 0} B</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* BADGES TAB */}
              {activeTab === 'badges' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      Badges & Awards
                    </h4>
                    {canEdit && (
                      <ActionButton label="Award Badge" icon="plus" variant="primary" onClick={() => setShowAddBadge(true)} />
                    )}
                  </div>

                  {badges.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                      <p className="text-slate-500">No badges earned yet.</p>
                      <p className="text-slate-600 text-sm">Keep working hard!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {badges.map(badge => (
                        <BadgeDisplay key={badge.id} badge={badge} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES TAB (Coach only) */}
              {activeTab === 'notes' && canEdit && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
                      Coach Notes
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-2">Private</span>
                    </h4>
                    <ActionButton label="Add Note" icon="plus" variant="primary" onClick={() => setShowAddNote(true)} />
                  </div>

                  {coachNotes.length === 0 ? (
                    <p className="text-slate-500 text-sm">No notes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {coachNotes.map(note => (
                        <CoachNote key={note.id} note={note} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  {/* Primary Parent */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Primary Contact</h4>
                    <div className="space-y-2">
                      <ContactRow icon="user" label="Name" value={p.parent_name} />
                      <ContactRow icon="mail" label="Email" value={p.parent_email} link={`mailto:${p.parent_email}`} />
                      <ContactRow icon="phone" label="Phone" value={p.parent_phone} link={`tel:${p.parent_phone}`} />
                    </div>
                  </div>

                  {/* Secondary Parent */}
                  {p.parent_2_name && (
                    <div className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Secondary Contact</h4>
                      <div className="space-y-2">
                        <ContactRow icon="user" label="Name" value={p.parent_2_name} />
                        <ContactRow icon="mail" label="Email" value={p.parent_2_email} link={`mailto:${p.parent_2_email}`} />
                        <ContactRow icon="phone" label="Phone" value={p.parent_2_phone} link={`tel:${p.parent_2_phone}`} />
                      </div>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-400 uppercase mb-3">🚨 Emergency Contact</h4>
                    <div className="space-y-2">
                      <ContactRow icon="user" label="Name" value={p.emergency_contact_name || p.emergency_name} />
                      <ContactRow icon="phone" label="Phone" value={p.emergency_contact_phone || p.emergency_phone} link={`tel:${p.emergency_contact_phone || p.emergency_phone}`} />
                      <ContactRow icon="users" label="Relation" value={p.emergency_contact_relation || p.emergency_relation} />
                    </div>
                  </div>

                  {p.address && (
                    <div className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Address</h4>
                      <p className="text-white">{p.address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* MEDICAL TAB */}
              {activeTab === 'medical' && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-red-400 uppercase mb-3">⚠️ Medical Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-slate-500">Medical Conditions</label>
                        <p className="text-white">{p.medical_conditions || p.medical_notes || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Allergies</label>
                        <p className="text-white">{p.allergies || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Medications</label>
                        <p className="text-white">{p.medications || 'None reported'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Documents</h4>
                    <div className="space-y-2">
                      <DocumentRow label="Birth Certificate" url={p.birth_certificate_url} />
                      <DocumentRow label="Medical Form" url={p.medical_form_url} />
                    </div>
                  </div>
                </div>
              )}

              {/* REGISTRATION TAB */}
              {activeTab === 'registration' && (
                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Waiver Status</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <PlayerWaiverBadge label="Liability" signed={p.waiver_liability} />
                      <PlayerWaiverBadge label="Photo Release" signed={p.waiver_photo} />
                      <PlayerWaiverBadge label="Code of Conduct" signed={p.waiver_conduct} />
                    </div>
                    {p.waiver_signed_by && (
                      <div className="mt-3 text-sm text-slate-500">
                        Signed by: {p.waiver_signed_by} on {p.waiver_signed_date ? new Date(p.waiver_signed_date).toLocaleDateString() : 'N/A'}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Registration History</h4>
                    {registrations.length === 0 ? (
                      <p className="text-slate-500 text-sm">No registrations found</p>
                    ) : (
                      registrations.map(reg => (
                        <div key={reg.id} className="bg-slate-900 rounded-lg p-3 mb-2 flex items-center justify-between">
                          <div>
                            <span className="text-white">{reg.seasons?.name || 'Unknown Season'}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              reg.status === 'rostered' ? 'bg-emerald-500/20 text-emerald-400' :
                              reg.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                              reg.status === 'pending' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                              'bg-gray-500/20 text-slate-400'
                            }`}>
                              {reg.status}
                            </span>
                          </div>
                          <span className="text-slate-500 text-sm">
                            {reg.submitted_at ? new Date(reg.submitted_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* PAYMENTS TAB */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-400">${totalPaid}</div>
                      <div className="text-xs text-emerald-400">Total Paid</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">${totalOwed}</div>
                      <div className="text-xs text-red-400">Outstanding</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{payments.length}</div>
                      <div className="text-xs text-slate-400">Transactions</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Payment History</h4>
                    {payments.length === 0 ? (
                      <p className="text-slate-500 text-sm">No payments found</p>
                    ) : (
                      payments.map(pay => (
                        <div key={pay.id} className="bg-slate-900 rounded-lg p-3 mb-2 flex items-center justify-between">
                          <div>
                            <span className="text-white">{pay.fee_name || pay.fee_type}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                              pay.paid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {pay.paid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">${pay.amount}</div>
                            <div className="text-slate-500 text-xs">{pay.paid_date || 'Pending'}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ADD GOAL MODAL */}
        {showAddGoal && (
          <AddGoalModal onClose={() => setShowAddGoal(false)} onSave={addGoal} />
        )}

        {/* ADD NOTE MODAL */}
        {showAddNote && (
          <AddNoteModal onClose={() => setShowAddNote(false)} onSave={addCoachNote} />
        )}

        {/* ADD EVALUATION MODAL */}
        {showAddEvaluation && (
          <AddEvaluationModal 
            onClose={() => setShowAddEvaluation(false)} 
            playerId={player.id}
            seasonId={seasonId}
            skillTemplates={skillTemplates}
            onSave={() => { loadEvaluations(); setShowAddEvaluation(false); }}
          />
        )}

        {/* ADD BADGE MODAL */}
        {showAddBadge && (
          <AddBadgeModal onClose={() => setShowAddBadge(false)} onSave={addBadge} />
        )}
      </div>
    </div>
  )
}

// ============================================
// ADD GOAL MODAL
// ============================================
function AddGoalModal({ onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('skill')
  const [targetValue, setTargetValue] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title,
      description,
      category,
      target_value: targetValue ? parseInt(targetValue) : null,
      target_date: targetDate || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-white mb-4">Add Goal</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Goal Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              placeholder="e.g., Improve serving accuracy"
            />
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              rows={3}
              placeholder="Details about this goal..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              >
                <option value="skill">Skill</option>
                <option value="fitness">Fitness</option>
                <option value="mental">Mental</option>
                <option value="team">Team</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Target Value (optional)</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                placeholder="e.g., 90"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Target Date (optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-medium">Add Goal</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD NOTE MODAL
// ============================================
function AddNoteModal({ onClose, onSave }) {
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState('general')

  const handleSave = () => {
    if (!content.trim()) return
    onSave({ content, note_type: noteType })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-white mb-4">Add Coach Note</h3>
        <p className="text-red-400 text-sm mb-4">🔒 This note is private and only visible to coaches/admins.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
            >
              <option value="general">General</option>
              <option value="praise">Praise</option>
              <option value="improvement">Area for Improvement</option>
              <option value="concern">Concern</option>
              <option value="behavior">Behavior</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Note *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              rows={4}
              placeholder="Write your note here..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-medium">Save Note</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD EVALUATION MODAL
// ============================================
function AddEvaluationModal({ onClose, playerId, seasonId, skillTemplates, onSave }) {
  const [evaluationType, setEvaluationType] = useState('tryout')
  const [overallScore, setOverallScore] = useState(5)
  const [skills, setSkills] = useState({})
  const [notes, setNotes] = useState('')
  const [isInitial, setIsInitial] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await supabase.from('player_evaluations').insert({
        player_id: playerId,
        season_id: seasonId,
        evaluation_type: evaluationType,
        evaluation_date: new Date().toISOString().split('T')[0],
        overall_score: overallScore,
        skills: skills,
        notes: notes,
        is_initial: isInitial,
      })
      onSave()
    } catch (err) {
      console.error('Error saving evaluation:', err)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Add Evaluation</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Type</label>
              <select
                value={evaluationType}
                onChange={(e) => setEvaluationType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              >
                <option value="tryout">Tryout</option>
                <option value="mid_season">Mid-Season</option>
                <option value="end_season">End of Season</option>
                <option value="practice">Practice Eval</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">Overall Score</label>
              <select
                value={overallScore}
                onChange={(e) => setOverallScore(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isInitial"
              checked={isInitial}
              onChange={(e) => setIsInitial(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isInitial" className="text-sm text-slate-400">This is the initial evaluation for this player</label>
          </div>

          {/* Skill Ratings */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Skill Ratings</label>
            <div className="bg-slate-900 rounded-lg p-4 space-y-3">
              {skillTemplates.map(template => (
                <div key={template.skill_key} className="flex items-center justify-between">
                  <span className="text-slate-300">{template.skill_name}</span>
                  <select
                    value={skills[template.skill_key] || 0}
                    onChange={(e) => setSkills(prev => ({ ...prev, [template.skill_key]: parseInt(e.target.value) }))}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                  >
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm text-slate-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              rows={3}
              placeholder="Evaluation notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Evaluation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADD BADGE MODAL
// ============================================
function AddBadgeModal({ onClose, onSave }) {
  const [badgeType, setBadgeType] = useState('player_of_week')
  const [customName, setCustomName] = useState('')
  const [notes, setNotes] = useState('')

  // Predefined badge types with names and icons
  const badgeOptions = [
    { type: 'mvp', name: '🏆 MVP', description: 'Most Valuable Player' },
    { type: 'player_of_week', name: '⭐ Player of the Week', description: 'Outstanding weekly performance' },
    { type: 'most_improved', name: '📈 Most Improved', description: 'Showed the most growth' },
    { type: 'hardest_worker', name: '💪 Hardest Worker', description: 'Best effort and dedication' },
    { type: 'team_spirit', name: '🤝 Team Spirit', description: 'Best teammate attitude' },
    { type: 'leadership', name: '👑 Leadership', description: 'Demonstrated great leadership' },
    { type: 'perfect_attendance', name: '✅ Perfect Attendance', description: 'Never missed a practice or game' },
    { type: 'sportsmanship', name: '🎖️ Sportsmanship', description: 'Exemplary sportsmanship' },
    { type: 'clutch', name: '🔥 Clutch Player', description: 'Performs under pressure' },
    { type: 'defensive', name: '🛡️ Defensive Player', description: 'Outstanding defense' },
    { type: 'offensive', name: '⚡ Offensive Player', description: 'Outstanding offense' },
    { type: 'rookie', name: '🌟 Rising Star', description: 'Outstanding new player' },
    { type: 'custom', name: '🏅 Custom Badge', description: 'Create your own badge' },
  ]

  const selectedBadge = badgeOptions.find(b => b.type === badgeType)

  const handleSave = () => {
    const badge = badgeOptions.find(b => b.type === badgeType)
    const badgeName = badgeType === 'custom' 
      ? customName.trim() || 'Custom Badge'
      : badge?.name?.replace(/^[^\s]+\s/, '') || badgeType // Remove emoji prefix
    
    onSave({
      badge_type: badgeType,
      badge_name: badgeName,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-2">🏆 Award Badge</h3>
        <p className="text-slate-400 text-sm mb-4">Recognize this player's achievement!</p>
        
        <div className="space-y-4">
          {/* Badge Type Selection */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Select Badge</label>
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
              {badgeOptions.map(badge => (
                <button
                  key={badge.type}
                  onClick={() => setBadgeType(badge.type)}
                  className={`p-3 rounded-xl text-left transition ${
                    badgeType === badge.type 
                      ? 'bg-[var(--accent-primary)]/20 border-2 border-[var(--accent-primary)]' 
                      : 'bg-slate-900 border-2 border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="text-lg">{badge.name.split(' ')[0]}</div>
                  <div className="text-sm text-white font-medium">{badge.name.replace(/^[^\s]+\s/, '')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Badge Name (only if custom selected) */}
          {badgeType === 'custom' && (
            <div>
              <label className="text-sm text-slate-400">Custom Badge Name *</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                placeholder="e.g., Best Server"
              />
            </div>
          )}

          {/* Selected Badge Preview */}
          {selectedBadge && (
            <div className="bg-slate-900 rounded-xl p-4 text-center">
              <div className="text-4xl mb-2">{selectedBadge.name.split(' ')[0]}</div>
              <div className="text-white font-semibold">
                {badgeType === 'custom' ? (customName || 'Custom Badge') : selectedBadge.name.replace(/^[^\s]+\s/, '')}
              </div>
              <div className="text-slate-500 text-sm">{selectedBadge.description}</div>
            </div>
          )}
          
          {/* Notes */}
          <div>
            <label className="text-sm text-slate-400">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
              rows={2}
              placeholder="e.g., Game vs Eagles - 15 kills!"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={badgeType === 'custom' && !customName.trim()}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-medium disabled:opacity-50"
          >
            Award Badge
          </button>
        </div>
      </div>
    </div>
  )
}
