import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { 
  X, ChevronRight, TrendingUp, Target, Award, FileText,
  User, BarChart3, Calendar, MessageCircle
} from 'lucide-react'

// ============================================
// CONSTANTS
// ============================================
const positionColors = {
  'OH': '#FF6B6B', 'S': '#4ECDC4', 'MB': '#45B7D1', 'OPP': '#96CEB4',
  'L': '#FFEAA7', 'DS': '#DDA0DD', 'RS': '#FF9F43',
}

const positionNames = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 'RS': 'Right Side',
}

// Badge definitions with icons and colors
const badgeDefinitions = {
  'ace_sniper': { name: 'Ace Sniper', icon: '🏐', color: '#F59E0B', rarity: 'Rare' },
  'kill_shot': { name: 'Kill Shot', icon: '⚡', color: '#EF4444', rarity: 'Epic' },
  'heart_breaker': { name: 'Heart Breaker', icon: '💜', color: '#EC4899', rarity: 'Rare' },
  'ground_zero': { name: 'Ground Zero', icon: '💎', color: '#06B6D4', rarity: 'Uncommon' },
  'iron_fortress': { name: 'Iron Fortress', icon: '🛡️', color: '#6366F1', rarity: 'Legendary' },
  'puppet_master': { name: 'Puppet Master', icon: '🎭', color: '#F59E0B', rarity: 'Epic' },
  'ace_master': { name: 'Ace Master', icon: '🎯', color: '#10B981', rarity: 'Rare' },
  'dig_machine': { name: 'Dig Machine', icon: '💪', color: '#8B5CF6', rarity: 'Uncommon' },
  'mvp': { name: 'MVP', icon: '⭐', color: '#EF4444', rarity: 'Legendary' },
  'team_player': { name: 'Team Player', icon: '🤝', color: '#3B82F6', rarity: 'Common' },
}

// Rarity colors for badge borders
const rarityColors = {
  'Common': '#6B7280',
  'Uncommon': '#10B981',
  'Rare': '#3B82F6',
  'Epic': '#8B5CF6',
  'Legendary': '#F59E0B',
}

// ============================================
// THEME HELPER - Get colors based on light/dark mode
// ============================================
function useCardTheme() {
  const { isDark } = useTheme()
  
  return {
    // Backgrounds
    modalBg: isDark ? '#0f172a' : '#ffffff',
    cardBg: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
    headerBg: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)',
    
    // Text colors
    textPrimary: isDark ? '#ffffff' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    
    // Borders
    border: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.8)',
    borderLight: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.8)',
    
    // Skill bar backgrounds
    skillBarBg: isDark ? '#334155' : '#e2e8f0',
    
    // Tab styling
    tabActive: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)',
    tabHover: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 1)',
    
    isDark,
  }
}

// ============================================
// MINI BAR CHART COMPONENT
// ============================================
function MiniBarChart({ data, color = '#F59E0B', label, theme }) {
  const maxValue = Math.max(...(data || []).map(d => d.value), 1)
  
  if (!data || data.length === 0) {
    return (
      <div style={{ backgroundColor: theme?.cardBg || 'rgba(30, 41, 59, 0.5)' }} className="rounded-xl p-4">
        <span className="text-xs uppercase tracking-wider" style={{ color: theme?.textMuted || '#64748b' }}>
          {label}
        </span>
        <div className="flex items-center justify-center h-16">
          <span style={{ color: theme?.textMuted || '#64748b' }} className="text-sm">No data yet</span>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ backgroundColor: theme?.cardBg || 'rgba(30, 41, 59, 0.5)' }} className="rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider" style={{ color: theme?.textMuted || '#64748b' }}>{label}</span>
        <span className="text-xs" style={{ color: theme?.textMuted || '#64748b' }}>Last {data.length} games</span>
      </div>
      <div className="flex items-end gap-1 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full rounded-t transition-all"
              style={{ 
                height: `${(d.value / maxValue) * 100}%`,
                backgroundColor: color,
                minHeight: '4px'
              }}
            />
            <span className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// SKILL BAR COMPONENT
// ============================================
function SkillBar({ label, value, maxValue = 100, theme }) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs uppercase w-16" style={{ color: theme?.textMuted || '#64748b' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme?.skillBarBg || '#334155' }}>
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: '#F59E0B'
          }}
        />
      </div>
      <span className="text-sm font-bold w-8 text-right" style={{ color: theme?.textPrimary || '#ffffff' }}>{value || 0}</span>
    </div>
  )
}

// ============================================
// BADGE ICON COMPONENT
// ============================================
function BadgeIcon({ badgeId, size = 'md', showLabel = false, earnedDate, theme }) {
  const badge = badgeDefinitions[badgeId] || { name: badgeId, icon: '🏅', color: '#6B7280', rarity: 'Common' }
  const rarityColor = rarityColors[badge.rarity] || '#6B7280'
  
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
  }
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center`}
        style={{ 
          backgroundColor: `${badge.color}20`,
          border: `2px solid ${rarityColor}`,
          boxShadow: `0 0 20px ${rarityColor}40`
        }}
      >
        {badge.icon}
      </div>
      {showLabel && (
        <>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme?.textPrimary || '#ffffff' }}>
            {badge.name}
          </span>
          <span className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>{badge.rarity}</span>
          {earnedDate && <span className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>Earned {earnedDate}</span>}
        </>
      )}
    </div>
  )
}

// ============================================
// GAME LOG ROW COMPONENT
// ============================================
function GameLogRow({ game, stats, theme }) {
  const isWin = game.result === 'W'
  
  return (
    <div 
      className="flex items-center gap-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${theme?.borderLight || 'rgba(51, 65, 85, 0.3)'}` }}
    >
      {/* Date */}
      <div className="text-sm w-12" style={{ color: theme?.textMuted || '#64748b' }}>
        {game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
      </div>
      
      {/* Result Badge */}
      <div 
        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
          isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        {game.result}
      </div>
      
      {/* Opponent */}
      <div className="flex-1">
        <p className="font-semibold" style={{ color: theme?.textPrimary || '#ffffff' }}>{game.opponent}</p>
        <p className="text-xs" style={{ color: theme?.textMuted || '#64748b' }}>{game.score}</p>
      </div>
      
      {/* Stats */}
      <div className="flex gap-3">
        <div className="text-center">
          <span className="text-amber-400 font-bold">{stats?.kills || game.kills || 0}</span>
          <p className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>K</p>
        </div>
        <div className="text-center">
          <span className="text-cyan-400 font-bold">{stats?.digs || game.digs || 0}</span>
          <p className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>D</p>
        </div>
        <div className="text-center">
          <span className="text-purple-400 font-bold">{stats?.aces || game.aces || 0}</span>
          <p className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>A</p>
        </div>
        <div className="text-center">
          <span className="text-blue-400 font-bold">{stats?.blocks || game.blocks || 0}</span>
          <p className="text-[10px]" style={{ color: theme?.textMuted || '#64748b' }}>B</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN PLAYER CARD EXPANDED COMPONENT
// ============================================
export function PlayerCardExpanded({ 
  player, 
  visible, 
  onClose, 
  context = 'roster',
  viewerRole = 'admin',
  isOwnChild = false,
  seasonId = null,
  sport = 'volleyball'
}) {
  const theme = useCardTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Player data states
  const [playerData, setPlayerData] = useState(null)
  const [teamAssignments, setTeamAssignments] = useState([])
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [badges, setBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])
  const [skills, setSkills] = useState(null)
  const [coachNotes, setCoachNotes] = useState([])
  const [recentGames, setRecentGames] = useState([])

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats' },
    { id: 'badges', label: 'Badges' },
    { id: 'games', label: 'Games' },
  ]

  useEffect(() => {
    if (visible && player?.id) {
      loadAllData()
    }
  }, [visible, player?.id, seasonId])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([
        loadPlayerData(),
        loadSeasonStats(),
        loadBadges(),
        loadRecentGames(),
        loadSkills(),
        viewerRole !== 'parent' ? loadCoachNotes() : Promise.resolve(),
      ])
    } catch (err) {
      console.error('Error loading player data:', err)
    }
    setLoading(false)
  }

  async function loadPlayerData() {
    try {
      const { data: fullPlayer, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', player.id)
        .single()
      
      if (error) console.error('Error loading player:', error)
      setPlayerData(fullPlayer || player)

      const { data: teams } = await supabase
        .from('team_players')
        .select('*, teams(id, name, color, seasons(name))')
        .eq('player_id', player.id)
      setTeamAssignments(teams || [])
    } catch (err) {
      console.error('Error in loadPlayerData:', err)
      setPlayerData(player)
    }
  }

  async function loadSeasonStats() {
    if (!seasonId) {
      setSeasonStats(null)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('player_season_stats')
        .select('*')
        .eq('player_id', player.id)
        .eq('season_id', seasonId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading season stats:', error)
      }
      setSeasonStats(data || null)
    } catch (err) {
      console.error('Error in loadSeasonStats:', err)
      setSeasonStats(null)
    }
  }

  async function loadBadges() {
    try {
      const { data, error } = await supabase
        .from('player_badges')
        .select('*')
        .eq('player_id', player.id)
        .order('earned_at', { ascending: false })
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading badges:', error)
      }
      setBadges(data || [])
      
      // Try to load in-progress achievements
      try {
        const { data: progressData } = await supabase
          .from('player_achievement_progress')
          .select('*')
          .eq('player_id', player.id)
        setBadgesInProgress(progressData || [])
      } catch {
        setBadgesInProgress([])
      }
    } catch (err) {
      console.error('Error in loadBadges:', err)
      setBadges([])
    }
  }

  async function loadRecentGames() {
    try {
      const { data, error } = await supabase
        .from('game_player_stats')
        .select('*, schedule_events(event_date, opponent_name, our_score, their_score)')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.error('Error loading game stats:', error)
        setGameStats([])
        setRecentGames([])
        return
      }
      
      setGameStats(data || [])
      
      // Transform into display format
      const games = (data || []).map(g => ({
        date: g.schedule_events?.event_date || g.game_date || null,
        opponent: g.schedule_events?.opponent_name || g.opponent_name || 'Unknown',
        result: (g.schedule_events?.our_score || g.our_score || 0) > (g.schedule_events?.their_score || g.their_score || 0) ? 'W' : 'L',
        score: `${g.schedule_events?.our_score || g.our_score || 0}-${g.schedule_events?.their_score || g.their_score || 0}`,
        kills: g.kills || 0,
        digs: g.digs || 0,
        aces: g.aces || 0,
        blocks: g.blocks || 0,
        assists: g.assists || 0,
      }))
      setRecentGames(games)
    } catch (err) {
      console.error('Error in loadRecentGames:', err)
      setGameStats([])
      setRecentGames([])
    }
  }

  async function loadSkills() {
    try {
      const { data, error } = await supabase
        .from('player_skills')
        .select('*')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading skills:', error)
      }
      setSkills(data || null)
    } catch (err) {
      console.error('Error in loadSkills:', err)
      setSkills(null)
    }
  }

  async function loadCoachNotes() {
    try {
      const { data, error } = await supabase
        .from('player_coach_notes')
        .select('*')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading coach notes:', error)
      }
      setCoachNotes(data || [])
    } catch (err) {
      console.error('Error in loadCoachNotes:', err)
      setCoachNotes([])
    }
  }

  if (!visible || !player) return null

  const p = playerData || player
  const posColor = p.position ? positionColors[p.position] || '#F59E0B' : '#F59E0B'
  const teamName = teamAssignments[0]?.teams?.name || 'No Team'
  const seasonName = teamAssignments[0]?.teams?.seasons?.name || ''
  
  // Calculate overall rating from skills (handle 1-10 or 1-100 scale)
  const calculateOverallRating = () => {
    if (!skills) return null
    const skillValues = [
      skills.serve, skills.pass, skills.attack, 
      skills.block, skills.dig, skills.set
    ].filter(v => v !== null && v !== undefined)
    
    if (skillValues.length === 0) return null
    
    const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length
    // If skills are on 1-10 scale, multiply by 10
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg)
  }
  
  const overallRating = calculateOverallRating()

  // Calculate per game averages from real stats
  const gamesPlayed = seasonStats?.games_played || recentGames.length || 0
  const calculatePerGame = (total) => {
    if (!gamesPlayed || gamesPlayed === 0) return '0'
    return (total / gamesPlayed).toFixed(1)
  }
  
  const perGameStats = gamesPlayed > 0 ? {
    kills: calculatePerGame(seasonStats?.kills || recentGames.reduce((sum, g) => sum + (g.kills || 0), 0)),
    digs: calculatePerGame(seasonStats?.digs || recentGames.reduce((sum, g) => sum + (g.digs || 0), 0)),
    aces: calculatePerGame(seasonStats?.aces || recentGames.reduce((sum, g) => sum + (g.aces || 0), 0)),
    blocks: calculatePerGame(seasonStats?.blocks || recentGames.reduce((sum, g) => sum + (g.blocks || 0), 0)),
    assists: calculatePerGame(seasonStats?.assists || recentGames.reduce((sum, g) => sum + (g.assists || 0), 0)),
  } : null

  // Find top stat for header display
  const findTopStat = () => {
    if (seasonStats) {
      const stats = {
        kills: seasonStats.kills || 0,
        digs: seasonStats.digs || 0,
        aces: seasonStats.aces || 0,
        blocks: seasonStats.blocks || 0,
      }
      const entries = Object.entries(stats).filter(([_, v]) => v > 0)
      if (entries.length === 0) return ['—', 0]
      return entries.sort((a, b) => b[1] - a[1])[0]
    }
    
    // Calculate from recent games if no season stats
    if (recentGames.length > 0) {
      const totals = recentGames.reduce((acc, g) => ({
        kills: acc.kills + (g.kills || 0),
        digs: acc.digs + (g.digs || 0),
        aces: acc.aces + (g.aces || 0),
        blocks: acc.blocks + (g.blocks || 0),
      }), { kills: 0, digs: 0, aces: 0, blocks: 0 })
      
      const entries = Object.entries(totals).filter(([_, v]) => v > 0)
      if (entries.length === 0) return ['—', 0]
      return entries.sort((a, b) => b[1] - a[1])[0]
    }
    
    return ['—', 0]
  }
  
  const topStat = findTopStat()

  // Build trend data from real games
  const killsTrend = recentGames.length > 0 
    ? recentGames.slice(0, 6).reverse().map(g => ({ value: g.kills || 0 }))
    : []
  const digsTrend = recentGames.length > 0 
    ? recentGames.slice(0, 6).reverse().map(g => ({ value: g.digs || 0 }))
    : []
    
  // Scale skills for display (handle both 1-10 and 1-100 scales)
  const getSkillValue = (value) => {
    if (value === null || value === undefined) return 0
    return value <= 10 ? value * 10 : value
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl flex flex-col"
        style={{ backgroundColor: theme.modalBg }}
      >
        {/* ═══════════════════════════════════════════════════
            HERO HEADER SECTION - Full Bleed Photo
            ═══════════════════════════════════════════════════ */}
        <div className="relative flex" style={{ minHeight: '280px' }}>
          {/* HERO Photo - Left Side Full Bleed */}
          <div className="w-[280px] shrink-0 relative overflow-hidden">
            {p.photo_url ? (
              <>
                <img 
                  src={p.photo_url} 
                  alt="" 
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                {/* Gradient overlay for text readability on photo edge */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: theme.isDark
                      ? 'linear-gradient(to right, transparent 60%, rgba(15, 23, 42, 0.8) 100%)'
                      : 'linear-gradient(to right, transparent 60%, rgba(255, 255, 255, 0.9) 100%)'
                  }}
                />
              </>
            ) : (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ 
                  background: theme.isDark 
                    ? `linear-gradient(135deg, ${posColor}40 0%, #1e293b 100%)` 
                    : `linear-gradient(135deg, ${posColor}30 0%, #f1f5f9 100%)` 
                }}
              >
                <div className="text-center">
                  <span className="text-8xl font-black" style={{ color: posColor }}>
                    {p.jersey_number || '?'}
                  </span>
                  <p className="text-sm font-bold mt-2" style={{ color: theme.textMuted }}>
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Player Info - Right Side */}
          <div className="flex-1 p-6 flex flex-col justify-between relative">
            {/* Background gradient accent */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(135deg, ${posColor}${theme.isDark ? '20' : '15'} 0%, transparent 50%)`,
              }}
            />
            
            {/* Content */}
            <div className="relative">
              {/* Top Row: Team Badge + Close */}
              <div className="flex items-start justify-between mb-4">
                <span 
                  className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ backgroundColor: posColor, color: '#000' }}
                >
                  {seasonName ? `${seasonName.split(' ')[0]} ` : ''}{teamName}
                </span>
                
                <div className="flex items-center gap-4">
                  {/* Top Stat - Large Display */}
                  {topStat[1] > 0 && (
                    <div className="text-right">
                      <span className="text-6xl font-black text-amber-400 leading-none">{topStat[1]}</span>
                      <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: theme.textMuted }}>{topStat[0]}</p>
                    </div>
                  )}
                  
                  {/* Close Button */}
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition"
                    style={{ backgroundColor: theme.cardBg }}
                  >
                    <X className="w-5 h-5" style={{ color: theme.textMuted }} />
                  </button>
                </div>
              </div>
              
              {/* Name */}
              <div>
                <h1 className="text-4xl font-black text-amber-400 uppercase tracking-tight">
                  {p.first_name || 'Player'}
                </h1>
                <h2 className="text-4xl font-black uppercase tracking-tight -mt-1" style={{ color: theme.textPrimary }}>
                  {p.last_name || ''}
                </h2>
                
                {/* Position & Jersey */}
                <p style={{ color: theme.textSecondary }} className="mt-2">
                  {positionNames[p.position] || p.position || 'Player'}
                  <span className="mx-2">•</span>
                  #{p.jersey_number || '—'}
                </p>
                
                {/* Badge Icons Row */}
                {badges.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {badges.slice(0, 4).map((b, i) => (
                      <div 
                        key={i}
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`,
                          border: `2px solid ${badgeDefinitions[b.badge_id]?.color || '#6B7280'}`,
                        }}
                      >
                        {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Overall Rating */}
              <div className="flex items-end justify-between">
                <div />
                {overallRating !== null && (
                  <div 
                    className="w-16 h-16 rounded-xl border-2 flex items-center justify-center"
                    style={{ borderColor: posColor }}
                  >
                    <span className="text-2xl font-black" style={{ color: theme.textPrimary }}>{overallRating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Per-Game Stats Bar */}
          {perGameStats && (
            <div 
              className="flex justify-around py-3"
              style={{ 
                borderTop: `1px solid ${theme.borderLight}`,
                backgroundColor: theme.headerBg 
              }}
            >
              <div className="text-center">
                <span className="text-xl font-bold" style={{ color: theme.textPrimary }}>{perGameStats.kills}</span>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Kills/G</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold" style={{ color: theme.textPrimary }}>{perGameStats.digs}</span>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Digs/G</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold" style={{ color: theme.textPrimary }}>{perGameStats.aces}</span>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Aces/G</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold" style={{ color: theme.textPrimary }}>{perGameStats.blocks}</span>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Blocks/G</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold" style={{ color: theme.textPrimary }}>{perGameStats.assists}</span>
                <p className="text-[10px] uppercase" style={{ color: theme.textMuted }}>Assists/G</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            TABS
            ═══════════════════════════════════════════════════ */}
        <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-3 text-sm font-medium transition"
              style={{ 
                color: activeTab === tab.id ? '#F59E0B' : theme.textMuted,
                backgroundColor: activeTab === tab.id ? theme.tabActive : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════
            TAB CONTENT
            ═══════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ═══ OVERVIEW TAB ═══ */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-3 gap-4">
                  {/* Left Column: Skills + Milestones */}
                  <div className="space-y-4">
                    {/* Skills */}
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-4">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Skills</h4>
                      {skills ? (
                        <div className="space-y-3">
                          <SkillBar label="Serve" value={getSkillValue(skills.serve)} theme={theme} />
                          <SkillBar label="Pass" value={getSkillValue(skills.pass)} theme={theme} />
                          <SkillBar label="Attack" value={getSkillValue(skills.attack)} theme={theme} />
                          <SkillBar label="Block" value={getSkillValue(skills.block)} theme={theme} />
                          <SkillBar label="Dig" value={getSkillValue(skills.dig)} theme={theme} />
                          <SkillBar label="Set" value={getSkillValue(skills.set)} theme={theme} />
                        </div>
                      ) : (
                        <p style={{ color: theme.textMuted }} className="text-sm text-center py-4">
                          No skill ratings yet
                        </p>
                      )}
                    </div>
                    
                    {/* Season Milestones */}
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-4">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Season Progress</h4>
                      {seasonStats ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <span className="text-emerald-400 text-xs">✓</span>
                            </div>
                            <span style={{ color: theme.textPrimary }} className="text-sm">
                              {seasonStats.games_played || 0} Games Played
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <span className="text-amber-400 text-xs">⚡</span>
                            </div>
                            <span style={{ color: theme.textPrimary }} className="text-sm">
                              {seasonStats.kills || 0} Total Kills
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <span className="text-cyan-400 text-xs">💎</span>
                            </div>
                            <span style={{ color: theme.textPrimary }} className="text-sm">
                              {seasonStats.digs || 0} Total Digs
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: theme.textMuted }} className="text-sm text-center py-4">
                          No season stats yet
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Middle Column: Recent Games + Trend */}
                  <div className="space-y-4">
                    {/* Recent Games */}
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-4">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Recent Games</h4>
                      {recentGames.length > 0 ? (
                        recentGames.slice(0, 3).map((game, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-2 py-2 last:border-0"
                            style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                          >
                            <span className="text-xs w-8" style={{ color: theme.textMuted }}>
                              {game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </span>
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              game.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {game.result}
                            </span>
                            <div className="flex-1">
                              <p style={{ color: theme.textPrimary }} className="text-sm font-medium">{game.opponent}</p>
                              <p style={{ color: theme.textMuted }} className="text-xs">{game.score}</p>
                            </div>
                            <div className="flex gap-2 text-xs">
                              <span className="text-amber-400 font-bold">{game.kills || 0}</span>
                              <span className="text-cyan-400 font-bold">{game.digs || 0}</span>
                              <span className="text-purple-400 font-bold">{game.aces || 0}</span>
                              <span className="text-blue-400 font-bold">{game.blocks || 0}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: theme.textMuted }} className="text-sm text-center py-4">
                          No games played yet
                        </p>
                      )}
                    </div>
                    
                    {/* Kills Trend */}
                    <MiniBarChart data={killsTrend} color="#F59E0B" label="Kills Trend" theme={theme} />
                  </div>
                  
                  {/* Right Column: Badges + Notes */}
                  <div className="space-y-4">
                    {/* Badges */}
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>Badges</h4>
                        <span className="text-xs" style={{ color: theme.textMuted }}>{badges.length} earned</span>
                      </div>
                      
                      {badges.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {badges.slice(0, 6).map((b, i) => (
                            <div 
                              key={i}
                              className="aspect-square rounded-xl flex items-center justify-center text-2xl"
                              style={{ 
                                backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`,
                                border: `2px solid ${badgeDefinitions[b.badge_id]?.color || '#6B7280'}`,
                              }}
                            >
                              {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: theme.textMuted }} className="text-sm text-center py-4">
                          No badges earned yet
                        </p>
                      )}
                      
                      {/* In Progress */}
                      {badgesInProgress.length > 0 && (
                        <>
                          <h5 className="text-xs uppercase mt-4 mb-2" style={{ color: theme.textMuted }}>In Progress</h5>
                          {badgesInProgress.slice(0, 2).map((b, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                                style={{ 
                                  backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`,
                                }}
                              >
                                {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                              </div>
                              <div className="flex-1">
                                <p style={{ color: theme.textPrimary }} className="text-xs font-medium uppercase">
                                  {badgeDefinitions[b.badge_id]?.name || b.badge_id}
                                </p>
                                <div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: theme.skillBarBg }}>
                                  <div 
                                    className="h-full rounded-full"
                                    style={{ 
                                      width: `${(b.progress / b.target) * 100}%`,
                                      backgroundColor: badgeDefinitions[b.badge_id]?.color || '#6B7280'
                                    }}
                                  />
                                </div>
                              </div>
                              <span className="text-xs" style={{ color: theme.textMuted }}>{b.progress}/{b.target}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    
                    {/* Coach Notes */}
                    {viewerRole !== 'parent' && (
                      <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-4">
                        <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Coach Notes</h4>
                        {coachNotes.length > 0 ? (
                          coachNotes.slice(0, 2).map((note, i) => (
                            <div 
                              key={i} 
                              className="py-2 last:border-0"
                              style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                            >
                              <p className="text-xs mb-1" style={{ color: theme.textMuted }}>
                                {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p style={{ color: theme.textPrimary }} className="text-sm">{note.content || note.note}</p>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: theme.textMuted }} className="text-sm text-center py-4">No notes yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ STATS TAB ═══ */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  {/* Season Totals */}
                  <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                    <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Season Totals</h4>
                    <div className="grid grid-cols-6 gap-4">
                      {[
                        { label: 'Games', value: seasonStats?.games_played || recentGames.length || 0, icon: '🏐' },
                        { label: 'Kills', value: seasonStats?.kills || 0, icon: '⚡', color: '#F59E0B' },
                        { label: 'Digs', value: seasonStats?.digs || 0, icon: '💎', color: '#06B6D4' },
                        { label: 'Aces', value: seasonStats?.aces || 0, icon: '🎯', color: '#EC4899' },
                        { label: 'Blocks', value: seasonStats?.blocks || 0, icon: '🛡️', color: '#6366F1' },
                        { label: 'Assists', value: seasonStats?.assists || 0, icon: '🤝', color: '#F59E0B' },
                      ].map((stat, i) => (
                        <div key={i} className="text-center">
                          <p className="text-xs uppercase mb-1 flex items-center justify-center gap-1" style={{ color: theme.textMuted }}>
                            {stat.label} <span>{stat.icon}</span>
                          </p>
                          <p className="text-3xl font-bold" style={{ color: stat.color || theme.textPrimary }}>
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Attacking & Defense */}
                  <div className="grid grid-cols-2 gap-4">
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Attacking</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs uppercase mb-1" style={{ color: theme.textMuted }}>Hit %</p>
                          <p className="text-2xl font-bold text-amber-400">
                            {seasonStats?.hit_percentage ? `.${Math.round(seasonStats.hit_percentage * 1000)}` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase mb-1" style={{ color: theme.textMuted }}>Attempts</p>
                          <p className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                            {seasonStats?.attack_attempts || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase mb-1" style={{ color: theme.textMuted }}>Errors</p>
                          <p className="text-2xl font-bold text-red-400">
                            {seasonStats?.attack_errors || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Passing & Defense</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase mb-1" style={{ color: theme.textMuted }}>Pass Rating</p>
                          <p className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
                            {seasonStats?.pass_rating || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase mb-1" style={{ color: theme.textMuted }}>Serve Receive</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {seasonStats?.serve_receive_pct ? `${Math.round(seasonStats.serve_receive_pct)}%` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Per Game Averages */}
                  {perGameStats && (
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Per Game Averages</h4>
                      <div className="grid grid-cols-5 gap-4">
                        {Object.entries(perGameStats).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs uppercase mb-1" style={{ color: theme.textMuted }}>{key}</p>
                            <p className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{value}</p>
                            <p className="text-xs" style={{ color: theme.textMuted }}>per game</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Trend Charts */}
                  {recentGames.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <MiniBarChart data={killsTrend} color="#F59E0B" label="Kills Trend" theme={theme} />
                      <MiniBarChart data={digsTrend} color="#06B6D4" label="Digs Trend" theme={theme} />
                    </div>
                  )}
                </div>
              )}

              {/* ═══ BADGES TAB ═══ */}
              {activeTab === 'badges' && (
                <div className="space-y-6">
                  {/* Earned Badges */}
                  <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                    <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>
                      Earned ({badges.length})
                    </h4>
                    {badges.length > 0 ? (
                      <div className="grid grid-cols-4 gap-6">
                        {badges.map((b, i) => (
                          <BadgeIcon 
                            key={i} 
                            badgeId={b.badge_id} 
                            size="lg" 
                            showLabel 
                            earnedDate={b.earned_at ? new Date(b.earned_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : null}
                            theme={theme}
                          />
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: theme.textMuted }} className="text-center py-8">No badges earned yet</p>
                    )}
                  </div>
                  
                  {/* In Progress */}
                  {badgesInProgress.length > 0 && (
                    <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                      <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>In Progress</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {badgesInProgress.map((b, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-4 rounded-xl p-4"
                            style={{ backgroundColor: theme.isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)' }}
                          >
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                              style={{ 
                                backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`,
                              }}
                            >
                              {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                            </div>
                            <div className="flex-1">
                              <p style={{ color: theme.textPrimary }} className="font-medium uppercase text-sm">
                                {badgeDefinitions[b.badge_id]?.name || b.badge_id}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: theme.skillBarBg }}>
                                  <div 
                                    className="h-full rounded-full"
                                    style={{ 
                                      width: `${(b.progress / b.target) * 100}%`,
                                      backgroundColor: badgeDefinitions[b.badge_id]?.color || '#6B7280'
                                    }}
                                  />
                                </div>
                                <span className="text-xs" style={{ color: theme.textMuted }}>{b.progress}/{b.target}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ GAMES TAB ═══ */}
              {activeTab === 'games' && (
                <div style={{ backgroundColor: theme.cardBg }} className="rounded-xl p-5">
                  <h4 className="text-xs uppercase tracking-wider mb-4" style={{ color: theme.textMuted }}>Game Log</h4>
                  
                  {recentGames.length > 0 ? (
                    <>
                      {/* Header Row */}
                      <div 
                        className="flex items-center gap-4 py-2 text-xs uppercase"
                        style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textMuted }}
                      >
                        <span className="w-12">Date</span>
                        <span className="w-8"></span>
                        <span className="flex-1">Opponent</span>
                        <div className="flex gap-3 w-32 justify-end">
                          <span>K</span>
                          <span>D</span>
                          <span>A</span>
                          <span>B</span>
                        </div>
                      </div>
                      
                      {/* Game Rows */}
                      {recentGames.map((game, i) => (
                        <GameLogRow key={i} game={game} theme={theme} />
                      ))}
                    </>
                  ) : (
                    <p style={{ color: theme.textMuted }} className="text-center py-8">No games played yet</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerCardExpanded
