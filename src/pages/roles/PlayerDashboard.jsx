import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, Users, Trophy, Star, TrendingUp, Award, Target,
  ChevronRight, BarChart3, Zap, Shield, Clock, MapPin, Eye, X
} from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'

// ═══════════════════════════════════════════════════════════════════════════════
// NEW: Import Achievement Widgets
// ═══════════════════════════════════════════════════════════════════════════════
import { 
  RecentAchievementsWidget, 
  TrackedAchievementsWidget 
} from '../achievements'

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
  return new Date(dateStr).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
}

// ============================================
// SKILLS RADAR CHART
// ============================================
function SkillsRadarChart({ stats, maxValues }) {
  const tc = useThemeClasses()
  
  // Define the 6 skills to show
  const skills = [
    { key: 'kills', label: 'Attacking', color: '#EF4444' },
    { key: 'aces', label: 'Serving', color: '#8B5CF6' },
    { key: 'assists', label: 'Setting', color: '#10B981' },
    { key: 'digs', label: 'Defense', color: '#3B82F6' },
    { key: 'blocks', label: 'Blocking', color: '#F59E0B' },
    { key: 'points', label: 'Points', color: '#EC4899' },
  ]
  
  // Calculate normalized values (0-100)
  const values = skills.map(skill => {
    const val = stats?.[`total_${skill.key}`] || 0
    const max = maxValues?.[skill.key] || 1
    return Math.min((val / max) * 100, 100)
  })
  
  // Generate polygon points
  const centerX = 100
  const centerY = 100
  const radius = 80
  const angleStep = (Math.PI * 2) / skills.length
  
  const points = values.map((val, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = (val / 100) * radius
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    }
  })
  
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ')
  
  // Grid lines
  const gridLevels = [25, 50, 75, 100]
  
  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-full max-w-[250px] mx-auto">
        {/* Grid circles */}
        {gridLevels.map(level => {
          const r = (level / 100) * radius
          const gridPoints = skills.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2
            return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`
          }).join(' ')
          return (
            <polygon
              key={level}
              points={gridPoints}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          )
        })}
        
        {/* Axis lines */}
        {skills.map((skill, i) => {
          const angle = angleStep * i - Math.PI / 2
          return (
            <line
              key={skill.key}
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          )
        })}
        
        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="var(--accent-primary)"
          fillOpacity="0.3"
          stroke="var(--accent-primary)"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={skills[i].color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
        
        {/* Labels */}
        {skills.map((skill, i) => {
          const angle = angleStep * i - Math.PI / 2
          const labelRadius = radius + 20
          const x = centerX + labelRadius * Math.cos(angle)
          const y = centerY + labelRadius * Math.sin(angle)
          return (
            <text
              key={skill.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] fill-current opacity-60"
            >
              {skill.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ icon: Icon, label, value, subValue, color, rank, compact, isError }) {
  const tc = useThemeClasses()
  
  if (compact) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-3 relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" style={{ color: isError ? '#EF4444' : color }} />
            <span className={`text-[10px] ${tc.textMuted} uppercase tracking-wide`}>{label}</span>
          </div>
          {rank && rank <= 5 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              rank <= 3 ? 'bg-amber-500/20 text-amber-400' : `${tc.cardBgAlt} ${tc.textMuted}`
            }`}>
              #{rank}
            </span>
          )}
        </div>
        <p className={`text-xl font-bold ${isError && value > 0 ? 'text-red-400' : ''}`} style={!isError ? { color } : {}}>
          {value}
        </p>
      </div>
    )
  }
  
  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 relative overflow-hidden`}>
      {/* Background accent */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-6 -mt-6"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-start justify-between relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" style={{ color }} />
            <span className={`text-xs ${tc.textMuted} uppercase tracking-wide`}>{label}</span>
          </div>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {subValue && <p className={`text-xs ${tc.textMuted}`}>{subValue}</p>}
        </div>
        
        {rank && (
          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
            rank <= 3 ? 'bg-amber-500/20 text-amber-400' : `${tc.cardBgAlt} ${tc.textMuted}`
          }`}>
            #{rank}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// GAME PERFORMANCE ROW
// ============================================
function GamePerformanceRow({ game, stats }) {
  const tc = useThemeClasses()
  const gameDate = game?.event_date ? new Date(game.event_date) : (stats?.created_at ? new Date(stats.created_at) : new Date())
  const isWin = game?.game_result === 'win'
  const isLoss = game?.game_result === 'loss'
  const hasResult = game?.game_result
  
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl ${tc.cardBgAlt}`}>
      {/* Date */}
      <div className="text-center w-12">
        <p className={`text-xs ${tc.textMuted}`}>{gameDate.toLocaleDateString('en-US', { month: 'short' })}</p>
        <p className={`text-lg font-bold ${tc.text}`}>{gameDate.getDate()}</p>
      </div>
      
      {/* Result */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
        hasResult ? (isWin ? 'bg-emerald-500' : isLoss ? 'bg-red-500' : 'bg-slate-500') : 'bg-slate-600'
      }`}>
        {hasResult ? (isWin ? 'W' : isLoss ? 'L' : 'T') : '—'}
      </div>
      
      {/* Opponent */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${tc.text} truncate`}>
          {game?.opponent_name ? `vs ${game.opponent_name}` : 'Game'}
        </p>
        <p className={`text-xs ${tc.textMuted}`}>
          {game?.our_sets_won !== undefined && game?.our_sets_won !== null
            ? `${game.our_sets_won}-${game.opponent_sets_won}` 
            : game?.our_score !== undefined && game?.our_score !== null
              ? `${game.our_score}-${game.opponent_score}`
              : 'Score N/A'}
        </p>
      </div>
      
      {/* Stats */}
      <div className="flex gap-3 text-center">
        <div>
          <p className={`text-xs ${tc.textMuted}`}>K</p>
          <p className={`font-bold ${stats?.kills > 0 ? 'text-red-400' : tc.textMuted}`}>{stats?.kills || 0}</p>
        </div>
        <div>
          <p className={`text-xs ${tc.textMuted}`}>A</p>
          <p className={`font-bold ${stats?.aces > 0 ? 'text-purple-400' : tc.textMuted}`}>{stats?.aces || 0}</p>
        </div>
        <div>
          <p className={`text-xs ${tc.textMuted}`}>D</p>
          <p className={`font-bold ${stats?.digs > 0 ? 'text-blue-400' : tc.textMuted}`}>{stats?.digs || 0}</p>
        </div>
        <div>
          <p className={`text-xs ${tc.textMuted}`}>B</p>
          <p className={`font-bold ${stats?.blocks > 0 ? 'text-amber-400' : tc.textMuted}`}>{stats?.blocks || 0}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADMIN PLAYER SELECTOR
// ============================================
function AdminPlayerSelector({ players, selectedPlayerId, onSelect, onClose }) {
  const tc = useThemeClasses()
  const [search, setSearch] = useState('')
  
  const filtered = players.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.jersey_number?.toString().includes(search)
  )
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col`}>
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${tc.text}`}>View as Player</h2>
            <p className={`text-sm ${tc.textMuted}`}>Select a player to preview their dashboard</p>
          </div>
          <button onClick={onClose} className={`p-2 ${tc.hoverBg} rounded-lg`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            placeholder="Search by name or jersey #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full px-4 py-2 rounded-xl ${tc.cardBgAlt} border ${tc.border} ${tc.text} placeholder:${tc.textMuted}`}
          />
        </div>
        
        <div className="flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-2">
            {filtered.map(player => (
              <button
                key={player.id}
                onClick={() => onSelect(player)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                  selectedPlayerId === player.id 
                    ? 'bg-[var(--accent-primary)]/20 border-2 border-[var(--accent-primary)]' 
                    : `${tc.cardBgAlt} hover:bg-white/5`
                }`}
              >
                {player.photo_url ? (
                  <img src={player.photo_url} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                    {player.jersey_number || `${player.first_name?.[0]}${player.last_name?.[0]}`}
                  </div>
                )}
                <div className="text-left flex-1">
                  <p className={`font-medium ${tc.text}`}>
                    {player.first_name} {player.last_name}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>
                    #{player.jersey_number} • {player.position || 'Player'}
                  </p>
                </div>
                {selectedPlayerId === player.id && (
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <Users className={`w-12 h-12 mx-auto ${tc.textMuted} mb-2`} />
                <p className={tc.textMuted}>No players found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PLAYER DASHBOARD
// ============================================
function PlayerDashboard({ roleContext, navigateToTeamWall, onNavigate, showToast, onPlayerChange }) {
  const tc = useThemeClasses()
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  
  // State
  const [loading, setLoading] = useState(true)
  const [playerData, setPlayerData] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [badges, setBadges] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [rankings, setRankings] = useState({})
  const [maxStats, setMaxStats] = useState({})
  
  // Admin preview mode
  const [isAdminPreview, setIsAdminPreview] = useState(false)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)
  const [allPlayers, setAllPlayers] = useState([])
  const [previewPlayer, setPreviewPlayer] = useState(null)
  
  // Determine if user is admin (can preview as any player)
  const isAdmin = roleContext?.role === 'admin' || roleContext?.role === 'head_coach'
  
  // The player we're viewing (either the logged-in player or preview player)
  const viewingPlayer = previewPlayer || roleContext?.playerInfo
  
  useEffect(() => {
    if (isAdmin && selectedSeason?.id) {
      loadAllPlayers()
    }
  }, [isAdmin, selectedSeason?.id])
  
  useEffect(() => {
    if (viewingPlayer?.id) {
      loadPlayerDashboard(viewingPlayer)
    } else {
      setLoading(false)
    }
  }, [viewingPlayer?.id, selectedSeason?.id])
  
  async function loadAllPlayers() {
    if (!selectedSeason?.id) return
    
    try {
      const { data } = await supabase
        .from('players')
        .select(`
          id, first_name, last_name, jersey_number, photo_url, position,
          team_players(team_id, teams(id, name, season_id))
        `)
        .eq('team_players.teams.season_id', selectedSeason.id)
      
      if (data) {
        // Filter to players in current season
        const seasonPlayers = data.filter(p => p.team_players?.length > 0)
        setAllPlayers(seasonPlayers)
        
        // Auto-select first player for admin preview if none selected
        if (!previewPlayer && seasonPlayers.length > 0) {
          setPreviewPlayer(seasonPlayers[0])
          setIsAdminPreview(true)
          onPlayerChange?.(seasonPlayers[0])  // Notify MainApp
        }
      }
    } catch (err) {
      console.error('Error loading players:', err)
    }
  }
  
  function handleSelectPreviewPlayer(player) {
    setPreviewPlayer(player)
    setIsAdminPreview(true)
    setShowPlayerSelector(false)
    onPlayerChange?.(player)  // Notify MainApp
  }
  
  async function loadPlayerDashboard(player) {
    setLoading(true)
    
    try {
      // Load player's team memberships
      const { data: teamData } = await supabase
        .from('team_players')
        .select('*, teams(*)')
        .eq('player_id', player.id)
      
      setPlayerData({
        ...player,
        teams: teamData?.map(tp => tp.teams).filter(Boolean) || []
      })
      
      // Load season stats
      if (selectedSeason?.id) {
        const { data: stats } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', player.id)
          .eq('season_id', selectedSeason.id)
          .maybeSingle()
        
        setSeasonStats(stats)
        
        // Load recent game stats
        const { data: gameData } = await supabase
          .from('game_player_stats')
          .select('*, event:event_id(*)')
          .eq('player_id', player.id)
          .order('created_at', { ascending: false })
          .limit(5)
        
        setGameStats(gameData || [])
        
        // Load rankings (compare to other players)
        await loadRankings(player.id)
        
        // Load max stats for radar chart scaling
        await loadMaxStats()
      }
      
      // Load upcoming events
      const teamIds = teamData?.map(tp => tp.team_id).filter(Boolean) || []
      if (teamIds.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: events } = await supabase
          .from('schedule_events')
          .select('*, teams(*)')
          .in('team_id', teamIds)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5)
        
        setUpcomingEvents(events || [])
      }
      
      // Load badges/achievements
      const { data: badgeData } = await supabase
        .from('player_achievements')
        .select('*')
        .eq('player_id', player.id)
        .order('earned_at', { ascending: false })
      
      setBadges(badgeData || [])
      
    } catch (err) {
      console.error('Error loading player dashboard:', err)
    }
    
    setLoading(false)
  }
  
  async function loadRankings(playerId) {
    if (!selectedSeason?.id) return
    
    try {
      // Get all player stats for the season
      const { data: allStats } = await supabase
        .from('player_season_stats')
        .select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points')
        .eq('season_id', selectedSeason.id)
      
      if (!allStats) return
      
      // Calculate rankings for each stat
      const stats = ['kills', 'aces', 'digs', 'blocks', 'assists', 'points']
      const newRankings = {}
      
      stats.forEach(stat => {
        const sorted = [...allStats].sort((a, b) => (b[`total_${stat}`] || 0) - (a[`total_${stat}`] || 0))
        const rank = sorted.findIndex(s => s.player_id === playerId) + 1
        if (rank > 0) newRankings[stat] = rank
      })
      
      setRankings(newRankings)
    } catch (err) {
      console.error('Error loading rankings:', err)
    }
  }
  
  async function loadMaxStats() {
    if (!selectedSeason?.id) return
    
    try {
      // Get max values for each stat for radar chart scaling
      const { data } = await supabase
        .from('player_season_stats')
        .select('total_kills, total_aces, total_digs, total_blocks, total_assists, total_points')
        .eq('season_id', selectedSeason.id)
      
      if (data && data.length > 0) {
        setMaxStats({
          kills: Math.max(...data.map(d => d.total_kills || 0), 1),
          aces: Math.max(...data.map(d => d.total_aces || 0), 1),
          digs: Math.max(...data.map(d => d.total_digs || 0), 1),
          blocks: Math.max(...data.map(d => d.total_blocks || 0), 1),
          assists: Math.max(...data.map(d => d.total_assists || 0), 1),
          points: Math.max(...data.map(d => d.total_points || 0), 1),
        })
      }
    } catch (err) {
      console.error('Error loading max stats:', err)
    }
  }
  
  // Get display info
  const displayName = viewingPlayer 
    ? `${viewingPlayer.first_name} ${viewingPlayer.last_name}`
    : 'Player'
  
  const teams = playerData?.teams || []
  const primaryTeam = teams[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-3 rounded-full animate-spin border-zinc-700 border-t-amber-400" />
          <p className={`mt-4 ${tc.textMuted}`}>Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (!viewingPlayer && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <VolleyballIcon className={`w-16 h-16 ${tc.textMuted} mb-4`} />
        <h2 className={`text-xl font-bold ${tc.text} mb-2`}>Player Dashboard</h2>
        <p className={tc.textMuted}>Player account not linked yet.</p>
        <p className={`text-sm ${tc.textMuted} mt-1`}>Contact your league admin to set up your player profile.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Player Photo */}
          {viewingPlayer?.photo_url ? (
            <img 
              src={viewingPlayer.photo_url} 
              alt={displayName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[var(--accent-primary)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/20 flex items-center justify-center text-2xl font-bold text-[var(--accent-primary)]">
              {viewingPlayer?.jersey_number || viewingPlayer?.first_name?.[0]}
            </div>
          )}
          
          <div>
            <h1 className={`text-2xl font-bold ${tc.text}`}>{displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {viewingPlayer?.jersey_number && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold">
                  #{viewingPlayer.jersey_number}
                </span>
              )}
              {viewingPlayer?.position && (
                <span className={`text-sm ${tc.textMuted}`}>{viewingPlayer.position}</span>
              )}
              {primaryTeam && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${primaryTeam.color || '#6366F1'}20`,
                    color: primaryTeam.color || '#6366F1'
                  }}
                >
                  {primaryTeam.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Admin Preview Toggle */}
        {isAdmin && (
          <button
            onClick={() => setShowPlayerSelector(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${tc.cardBg} border ${tc.border} hover:border-[var(--accent-primary)]/50 transition`}
          >
            <Eye className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className={`text-sm ${tc.text}`}>
              {isAdminPreview ? 'Switch Player' : 'Preview as Player'}
            </span>
          </button>
        )}
      </div>
      
      {/* Admin Preview Banner */}
      {isAdminPreview && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
          <Eye className="w-5 h-5 text-amber-400" />
          <p className="text-sm text-amber-400 flex-1">
            Viewing as <span className="font-bold">{displayName}</span> (Admin Preview)
          </p>
          <button
            onClick={() => setShowPlayerSelector(true)}
            className="text-xs px-3 py-1 rounded-lg bg-amber-500/30 text-amber-400 hover:bg-amber-500/40 transition"
          >
            Change Player
          </button>
        </div>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Games */}
        <div className="lg:col-span-2 space-y-6">
          {/* Season Stats */}
          <div>
            <h2 className={`text-lg font-bold ${tc.text} mb-4 flex items-center gap-2`}>
              <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
              Season Stats
              {selectedSeason && (
                <span className={`text-sm font-normal ${tc.textMuted}`}>• {selectedSeason.name}</span>
              )}
            </h2>
            
            {seasonStats ? (
              <div className="space-y-4">
                {/* ATTACKING GROUP */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>Attacking</span>
                    {seasonStats.hit_percentage !== null && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        seasonStats.hit_percentage >= 0.3 ? 'bg-emerald-500/20 text-emerald-400' :
                        seasonStats.hit_percentage >= 0.2 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {(seasonStats.hit_percentage * 100).toFixed(1)}% Hit
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <StatCard icon={Zap} label="Kills" value={seasonStats.total_kills || 0} color="#EF4444" rank={rankings.kills} compact />
                    <StatCard icon={TrendingUp} label="Attempts" value={seasonStats.total_attacks || 0} color="#F87171" compact />
                    <StatCard icon={X} label="Errors" value={seasonStats.total_attack_errors || 0} color="#FCA5A5" compact isError />
                    <StatCard icon={Trophy} label="Points" value={seasonStats.total_points || 0} color="#FBBF24" rank={rankings.points} compact />
                  </div>
                </div>

                {/* SERVING GROUP */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>Serving</span>
                    {seasonStats.serve_percentage !== null && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        seasonStats.serve_percentage >= 0.9 ? 'bg-emerald-500/20 text-emerald-400' :
                        seasonStats.serve_percentage >= 0.8 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {(seasonStats.serve_percentage * 100).toFixed(1)}% Srv
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard icon={Target} label="Aces" value={seasonStats.total_aces || 0} color="#8B5CF6" rank={rankings.aces} compact />
                    <StatCard icon={Zap} label="Serves" value={seasonStats.total_serves || 0} color="#A78BFA" compact />
                    <StatCard icon={X} label="Errors" value={seasonStats.total_service_errors || 0} color="#C4B5FD" compact isError />
                  </div>
                </div>

                {/* DEFENSE GROUP */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>Defense & Setting</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <StatCard icon={Shield} label="Digs" value={seasonStats.total_digs || 0} color="#3B82F6" rank={rankings.digs} compact />
                    <StatCard icon={Shield} label="Blocks" value={seasonStats.total_blocks || 0} color="#F59E0B" rank={rankings.blocks} compact />
                    <StatCard icon={Users} label="Assists" value={seasonStats.total_assists || 0} color="#10B981" rank={rankings.assists} compact />
                    <StatCard icon={X} label="Pass Err" value={seasonStats.total_reception_errors || 0} color="#60A5FA" compact isError />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-8 text-center`}>
                <BarChart3 className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
                <p className={tc.textMuted}>No stats recorded yet</p>
                <p className={`text-sm ${tc.textMuted} mt-1`}>Stats will appear after games are completed</p>
              </div>
            )}
          </div>
          
          {/* Recent Performances */}
          <div>
            <h2 className={`text-lg font-bold ${tc.text} mb-4 flex items-center gap-2`}>
              <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
              Recent Games
            </h2>
            
            {gameStats.length > 0 ? (
              <div className="space-y-2">
                {gameStats.map(gs => (
                  <GamePerformanceRow key={gs.id} game={gs.event} stats={gs} />
                ))}
              </div>
            ) : (
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-8 text-center`}>
                <Calendar className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
                <p className={tc.textMuted}>No game performances yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Skills, Achievements, Schedule */}
        <div className="space-y-6">
          {/* Skills Radar */}
          {seasonStats && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
              <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                <Target className="w-4 h-4 text-[var(--accent-primary)]" />
                Skills Overview
              </h3>
              <SkillsRadarChart stats={seasonStats} maxValues={maxStats} />
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              UPGRADED: Achievements Section using new widgets
              ═══════════════════════════════════════════════════════════════ */}
          {viewingPlayer?.id && (
            <>
              {/* Tracked Achievements - What player is working toward */}
              <TrackedAchievementsWidget 
                playerId={viewingPlayer.id}
                onViewAll={() => onNavigate?.('achievements')}
                maxItems={3}
              />
              
              {/* Recent Achievements - Recently earned badges */}
              <RecentAchievementsWidget 
                playerId={viewingPlayer.id}
                onViewAll={() => onNavigate?.('achievements')}
                maxItems={4}
              />
            </>
          )}
          
          {/* Upcoming Schedule */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${tc.text} flex items-center gap-2`}>
                <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                Upcoming
              </h3>
              <button 
                onClick={() => onNavigate?.('schedule')}
                className="text-xs text-[var(--accent-primary)] hover:underline"
              >
                View All →
              </button>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const eventDate = new Date(event.event_date)
                  const isToday = eventDate.toDateString() === new Date().toDateString()
                  
                  return (
                    <div key={event.id} className={`flex items-center gap-3 p-2 rounded-lg ${tc.cardBgAlt}`}>
                      <div 
                        className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold"
                        style={{ 
                          backgroundColor: `${event.teams?.color || '#6366F1'}20`,
                          color: event.teams?.color || '#6366F1'
                        }}
                      >
                        <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-sm">{eventDate.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${tc.text} truncate`}>
                            {event.event_type === 'game' ? `🏐 vs ${event.opponent_name || 'TBD'}` : 
                             event.event_type === 'practice' ? '🏋️ Practice' : event.title}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {event.event_time && formatTime12(event.event_time)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className={`w-10 h-10 mx-auto ${tc.textMuted} mb-2`} />
                <p className={`text-sm ${tc.textMuted}`}>No upcoming events</p>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {teams[0] && (
              <button
                onClick={() => navigateToTeamWall?.(teams[0].id)}
                className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 text-center hover:border-[var(--accent-primary)]/50 transition`}
              >
                <Users className={`w-6 h-6 mx-auto mb-2 ${tc.textMuted}`} />
                <p className={`text-sm font-medium ${tc.text}`}>Team Hub</p>
              </button>
            )}
            <button
              onClick={() => onNavigate?.('leaderboards')}
              className={`${tc.cardBg} border ${tc.border} rounded-xl p-4 text-center hover:border-[var(--accent-primary)]/50 transition`}
            >
              <Trophy className={`w-6 h-6 mx-auto mb-2 ${tc.textMuted}`} />
              <p className={`text-sm font-medium ${tc.text}`}>Leaderboards</p>
            </button>
          </div>
        </div>
      </div>
      
      {/* Player Selector Modal */}
      {showPlayerSelector && (
        <AdminPlayerSelector
          players={allPlayers}
          selectedPlayerId={previewPlayer?.id}
          onSelect={handleSelectPreviewPlayer}
          onClose={() => setShowPlayerSelector(false)}
        />
      )}
    </div>
  )
}

export { PlayerDashboard }
