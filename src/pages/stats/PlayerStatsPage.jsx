import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// ============================================
// INLINE ICONS
// ============================================
const ChevronLeftIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const TrendingUpIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)

const TrendingDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
)

const StarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
)

const CalendarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const AwardIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
)

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

const TargetIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

// ============================================
// STAT CATEGORIES CONFIG
// ============================================
const VOLLEYBALL_STATS = {
  serving: {
    label: 'Serving',
    icon: '🏐',
    color: '#10B981',
    stats: [
      { key: 'aces', label: 'Aces', highlight: true },
      { key: 'serves', label: 'Serves' },
      { key: 'service_errors', label: 'Errors', negative: true },
    ]
  },
  attacking: {
    label: 'Attacking',
    icon: '💥',
    color: '#EF4444',
    stats: [
      { key: 'kills', label: 'Kills', highlight: true },
      { key: 'attacks', label: 'Attempts' },
      { key: 'attack_errors', label: 'Errors', negative: true },
    ]
  },
  blocking: {
    label: 'Blocking',
    icon: '🛡️',
    color: '#6366F1',
    stats: [
      { key: 'blocks', label: 'Blocks', highlight: true },
      { key: 'block_assists', label: 'Assists' },
    ]
  },
  defense: {
    label: 'Defense',
    icon: '🏃',
    color: '#F59E0B',
    stats: [
      { key: 'digs', label: 'Digs', highlight: true },
    ]
  },
  setting: {
    label: 'Setting',
    icon: '🙌',
    color: '#8B5CF6',
    stats: [
      { key: 'assists', label: 'Assists', highlight: true },
    ]
  },
  receiving: {
    label: 'Receiving',
    icon: '📥',
    color: '#EC4899',
    stats: [
      { key: 'receptions', label: 'Receptions', highlight: true },
      { key: 'reception_errors', label: 'Errors', negative: true },
    ]
  },
}

// ============================================
// MINI LINE CHART COMPONENT
// ============================================
function MiniLineChart({ data, color, height = 60 }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  if (!data || data.length < 2) {
    return (
      <div className={`flex items-center justify-center ${tc.textMuted} text-xs`} style={{ height }}>
        Not enough data
      </div>
    )
  }
  
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  
  const width = 100
  const padding = 5
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2
  
  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {/* Area fill */}
      <polygon 
        points={areaPoints} 
        fill={`${color}20`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {data.map((value, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth
        const y = padding + chartHeight - ((value - min) / range) * chartHeight
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="white"
            stroke={color}
            strokeWidth="2"
          />
        )
      })}
    </svg>
  )
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ label, value, trend, trendValue, color, icon, size = 'normal' }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'
  
  if (size === 'large') {
    return (
      <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-3xl">{icon}</span>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositive ? 'bg-emerald-100 text-emerald-700' :
              isNegative ? 'bg-red-100 text-red-700' :
              `${tc.cardBgAlt} ${tc.textMuted}`
            }`}>
              {isPositive ? <TrendingUpIcon className="w-3 h-3" /> : isNegative ? <TrendingDownIcon className="w-3 h-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <p className={`text-4xl font-bold ${tc.text}`} style={{ color }}>{value}</p>
        <p className={`${tc.textMuted} mt-1`}>{label}</p>
      </div>
    )
  }
  
  return (
    <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-lg">{icon}</span>
        {trend && (
          <span className={`text-xs ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : tc.textMuted}`}>
            {isPositive ? '↑' : isNegative ? '↓' : '–'} {trendValue}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${tc.text}`}>{value}</p>
      <p className={`text-xs ${tc.textMuted}`}>{label}</p>
    </div>
  )
}

// ============================================
// GAME HISTORY ROW
// ============================================
function GameHistoryRow({ game, stats, onClick }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const gameDate = new Date(game.event_date)
  const isWin = game.game_result === 'win'
  const isLoss = game.game_result === 'loss'
  
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 ${tc.cardBg} rounded-xl border ${tc.border} hover:border-indigo-300 hover:shadow-md transition cursor-pointer`}
    >
      {/* Date */}
      <div className="text-center min-w-[60px]">
        <p className={`text-xs ${tc.textMuted} uppercase`}>{gameDate.toLocaleDateString('en-US', { month: 'short' })}</p>
        <p className={`text-2xl font-bold ${tc.text}`}>{gameDate.getDate()}</p>
      </div>
      
      {/* Result badge */}
      <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
        isWin ? 'bg-emerald-100 text-emerald-700' :
        isLoss ? 'bg-red-100 text-red-700' :
        `${tc.cardBgAlt} ${tc.textMuted}`
      }`}>
        {isWin ? 'W' : isLoss ? 'L' : 'T'}
      </div>
      
      {/* Opponent */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${tc.text} truncate`}>vs {game.opponent_name || 'Unknown'}</p>
        <p className={`text-xs ${tc.textMuted}`}>
          {game.our_score !== null ? `${game.our_score} - ${game.opponent_score}` : 'No score'}
        </p>
      </div>
      
      {/* Key stats */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-emerald-600">{stats?.aces || 0}</p>
          <p className={`text-[10px] ${tc.textMuted}`}>Aces</p>
        </div>
        <div>
          <p className="text-lg font-bold text-red-600">{stats?.kills || 0}</p>
          <p className={`text-[10px] ${tc.textMuted}`}>Kills</p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-600">{stats?.digs || 0}</p>
          <p className={`text-[10px] ${tc.textMuted}`}>Digs</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">{stats?.blocks || 0}</p>
          <p className={`text-[10px] ${tc.textMuted}`}>Blocks</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SKILL RATING BAR
// ============================================
function SkillRatingBar({ label, value, color, maxValue = 100 }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const percentage = (value / maxValue) * 100
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={tc.textMuted}>{label}</span>
        <span className="font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} overflow-hidden`}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ============================================
// MAIN PLAYER STATS PAGE
// ============================================
function PlayerStatsPage({ playerId, teamId, onBack, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { selectedSeason } = useSeason()

  const [player, setPlayer] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameHistory, setGameHistory] = useState([])
  const [skillRatings, setSkillRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  useEffect(() => {
    if (playerId) {
      loadPlayerData()
    }
  }, [playerId, teamId, selectedSeason?.id])
  
  async function loadPlayerData() {
    setLoading(true)
    
    try {
      // Load player info
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()
      
      setPlayer(playerData)
      
      // Load season stats
      if (selectedSeason?.id) {
        const { data: stats } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', playerId)
          .eq('season_id', selectedSeason.id)
          .single()
        
        setSeasonStats(stats)
        
        // Load skill ratings
        const { data: ratings } = await supabase
          .from('player_skill_ratings')
          .select('*')
          .eq('player_id', playerId)
          .eq('season_id', selectedSeason.id)
          .single()
        
        setSkillRatings(ratings)
      }
      
      // Load game history with stats
      const { data: games } = await supabase
        .from('schedule_events')
        .select(`
          id, event_date, event_type, opponent_name, location,
          our_score, opponent_score, game_result,
          game_player_stats!inner(*)
        `)
        .eq('game_player_stats.player_id', playerId)
        .eq('event_type', 'game')
        .order('event_date', { ascending: false })
        .limit(20)
      
      // Map games with their stats
      const gamesWithStats = (games || []).map(game => ({
        ...game,
        stats: game.game_player_stats?.[0] || {}
      }))
      
      setGameHistory(gamesWithStats)
      
    } catch (err) {
      console.error('Error loading player data:', err)
    }
    
    setLoading(false)
  }
  
  // Calculate trends (comparing recent 5 games to previous 5)
  function calculateTrend(statKey) {
    if (gameHistory.length < 4) return { trend: null, value: null }
    
    const recent = gameHistory.slice(0, Math.min(5, Math.floor(gameHistory.length / 2)))
    const previous = gameHistory.slice(Math.min(5, Math.floor(gameHistory.length / 2)), Math.min(10, gameHistory.length))
    
    const recentAvg = recent.reduce((sum, g) => sum + (g.stats?.[statKey] || 0), 0) / recent.length
    const prevAvg = previous.reduce((sum, g) => sum + (g.stats?.[statKey] || 0), 0) / previous.length
    
    if (prevAvg === 0) return { trend: null, value: null }
    
    const change = ((recentAvg - prevAvg) / prevAvg) * 100
    
    return {
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      value: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
    }
  }
  
  // Get stat history for chart
  function getStatHistory(statKey) {
    return gameHistory
      .slice()
      .reverse()
      .map(g => g.stats?.[statKey] || 0)
  }
  
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${tc.pageBg}`}>
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }
  
  if (!player) {
    return (
      <div className={`flex-1 flex items-center justify-center ${tc.pageBg}`}>
        <p className={tc.textMuted}>Player not found</p>
      </div>
    )
  }

  return (
    <div className={`flex-1 ${tc.pageBg} overflow-y-auto`}>
      {/* Header */}
      <div className={`${tc.cardBg} border-b ${tc.border} sticky top-0 z-10`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} rounded-xl transition`}
              >
                <ChevronLeftIcon className={`w-5 h-5 ${tc.textMuted}`} />
              </button>
            )}
            
            {/* Player photo & basic info */}
            <div className="flex items-center gap-4">
              {player.photo_url ? (
                <img src={player.photo_url} className="w-16 h-16 rounded-xl object-cover shadow" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow">
                  {player.jersey_number || '?'}
                </div>
              )}
              
              <div>
                <h1 className={`text-2xl font-bold ${tc.text}`}>
                  {player.first_name} {player.last_name}
                </h1>
                <p className={tc.textMuted}>
                  #{player.jersey_number} • {player.position || 'Player'}
                  {selectedSeason && ` • ${selectedSeason.name}`}
                </p>
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="ml-auto flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{seasonStats?.games_played || 0}</p>
                <p className={`text-xs ${tc.textMuted}`}>Games</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{seasonStats?.total_points || 0}</p>
                <p className={`text-xs ${tc.textMuted}`}>Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{seasonStats?.total_aces || 0}</p>
                <p className={`text-xs ${tc.textMuted}`}>Aces</p>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {['overview', 'game-log', 'skills'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  activeTab === tab
                    ? 'bg-[var(--accent-primary)] text-white'
                    : `${tc.cardBgAlt} ${tc.textMuted} ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`
                }`}
              >
                {tab === 'overview' ? '📊 Overview' : 
                 tab === 'game-log' ? '📅 Game Log' : 
                 '⭐ Skills'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Season Totals */}
            <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
              <h2 className={`text-lg font-bold ${tc.text} mb-4 flex items-center gap-2`}>
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                Season Totals
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(VOLLEYBALL_STATS).map(([catKey, category]) => {
                  const mainStat = category.stats.find(s => s.highlight)
                  const value = seasonStats?.[`total_${mainStat?.key}`] || 0
                  const { trend, value: trendValue } = calculateTrend(mainStat?.key)
                  
                  return (
                    <StatCard
                      key={catKey}
                      label={mainStat?.label || category.label}
                      value={value}
                      icon={category.icon}
                      color={category.color}
                      trend={trend}
                      trendValue={trendValue}
                    />
                  )
                })}
              </div>
            </div>
            
            {/* Per Game Averages */}
            <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
              <h2 className={`text-lg font-bold ${tc.text} mb-4 flex items-center gap-2`}>
                <TargetIcon className="w-5 h-5 text-emerald-500" />
                Per Game Averages
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Aces/Game" value={seasonStats?.aces_per_game?.toFixed(1) || '0.0'} icon="🏐" color="#10B981" />
                <StatCard label="Kills/Game" value={seasonStats?.kills_per_game?.toFixed(1) || '0.0'} icon="💥" color="#EF4444" />
                <StatCard label="Blocks/Game" value={seasonStats?.blocks_per_game?.toFixed(1) || '0.0'} icon="🛡️" color="#6366F1" />
                <StatCard label="Digs/Game" value={seasonStats?.digs_per_game?.toFixed(1) || '0.0'} icon="🏃" color="#F59E0B" />
                <StatCard label="Assists/Game" value={seasonStats?.assists_per_game?.toFixed(1) || '0.0'} icon="🙌" color="#8B5CF6" />
                <StatCard label="Points/Game" value={seasonStats?.points_per_game?.toFixed(1) || '0.0'} icon="⭐" color="#EC4899" />
              </div>
            </div>
            
            {/* Progress Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Aces Trend */}
              <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
                <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                  🏐 Aces Progress
                </h3>
                <MiniLineChart data={getStatHistory('aces')} color="#10B981" height={100} />
                <p className={`text-xs ${tc.textMuted} mt-2 text-center`}>Last {gameHistory.length} games</p>
              </div>
              
              {/* Kills Trend */}
              <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
                <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                  💥 Kills Progress
                </h3>
                <MiniLineChart data={getStatHistory('kills')} color="#EF4444" height={100} />
                <p className={`text-xs ${tc.textMuted} mt-2 text-center`}>Last {gameHistory.length} games</p>
              </div>
              
              {/* Digs Trend */}
              <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
                <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                  🏃 Digs Progress
                </h3>
                <MiniLineChart data={getStatHistory('digs')} color="#F59E0B" height={100} />
                <p className={`text-xs ${tc.textMuted} mt-2 text-center`}>Last {gameHistory.length} games</p>
              </div>
              
              {/* Blocks Trend */}
              <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
                <h3 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                  🛡️ Blocks Progress
                </h3>
                <MiniLineChart data={getStatHistory('blocks')} color="#6366F1" height={100} />
                <p className={`text-xs ${tc.textMuted} mt-2 text-center`}>Last {gameHistory.length} games</p>
              </div>
            </div>
            
            {/* Percentages */}
            <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
              <h2 className={`text-lg font-bold ${tc.text} mb-4 flex items-center gap-2`}>
                <AwardIcon className="w-5 h-5 text-amber-500" />
                Efficiency Ratings
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={tc.textMuted}>Hitting Percentage</span>
                    <span className={`font-bold ${tc.text}`}>
                      {((seasonStats?.hitting_percentage || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={`h-4 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} overflow-hidden`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600"
                      style={{ width: `${Math.max(0, (seasonStats?.hitting_percentage || 0) * 100 + 50)}%` }}
                    />
                  </div>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>(Kills - Errors) / Attempts</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={tc.textMuted}>Serve Percentage</span>
                    <span className={`font-bold ${tc.text}`}>
                      {((seasonStats?.serve_percentage || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={`h-4 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'} overflow-hidden`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${(seasonStats?.serve_percentage || 0) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>(Serves - Errors) / Serves</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Game Log Tab */}
        {activeTab === 'game-log' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${tc.text}`}>Game History</h2>
              <span className={`text-sm ${tc.textMuted}`}>{gameHistory.length} games</span>
            </div>
            
            {gameHistory.length === 0 ? (
              <div className={`${tc.cardBg} rounded-xl p-12 border ${tc.border} text-center`}>
                <CalendarIcon className={`w-12 h-12 ${tc.textMuted} mx-auto mb-4`} />
                <p className={tc.textMuted}>No game stats recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gameHistory.map(game => (
                  <GameHistoryRow
                    key={game.id}
                    game={game}
                    stats={game.stats}
                    onClick={() => {/* Could open detailed game stats modal */}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Coach Ratings */}
            <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
              <h2 className={`text-lg font-bold ${tc.text} mb-4 flex items-center gap-2`}>
                <StarIcon className="w-5 h-5 text-amber-500" />
                Coach Skill Ratings
              </h2>
              
              {skillRatings ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className={`font-semibold ${tc.text}`}>Technical Skills</h4>
                    <SkillRatingBar label="Serving" value={skillRatings.serving_rating || 50} color="#10B981" />
                    <SkillRatingBar label="Passing" value={skillRatings.passing_rating || 50} color="#3B82F6" />
                    <SkillRatingBar label="Setting" value={skillRatings.setting_rating || 50} color="#8B5CF6" />
                    <SkillRatingBar label="Attacking" value={skillRatings.attacking_rating || 50} color="#EF4444" />
                    <SkillRatingBar label="Blocking" value={skillRatings.blocking_rating || 50} color="#6366F1" />
                    <SkillRatingBar label="Defense" value={skillRatings.defense_rating || 50} color="#F59E0B" />
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className={`font-semibold ${tc.text}`}>Intangibles</h4>
                    <SkillRatingBar label="Hustle" value={skillRatings.hustle_rating || 50} color="#EC4899" />
                    <SkillRatingBar label="Coachability" value={skillRatings.coachability_rating || 50} color="#14B8A6" />
                    <SkillRatingBar label="Teamwork" value={skillRatings.teamwork_rating || 50} color="#4BB9EC" />
                    
                    {/* Overall */}
                    <div className={`mt-6 p-4 ${isDark ? 'bg-white/5' : 'bg-gradient-to-r from-indigo-50 to-purple-50'} rounded-xl`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>Overall Rating</span>
                        <span className="text-3xl font-bold text-indigo-600">{skillRatings.overall_rating || 50}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-center py-8 ${tc.textMuted}`}>
                  <UserIcon className={`w-12 h-12 ${tc.textMuted} mx-auto mb-4`} />
                  <p>No skill ratings yet</p>
                  <p className="text-sm mt-1">Coach hasn't submitted ratings for this season</p>
                </div>
              )}
            </div>
            
            {/* Coach Notes */}
            {skillRatings?.coach_notes && (
              <div className={`${tc.cardBg} rounded-xl p-6 border ${tc.border} shadow-sm`}>
                <h3 className={`font-semibold ${tc.text} mb-3`}>📝 Coach Notes</h3>
                <p className={`${tc.textMuted} whitespace-pre-wrap`}>{skillRatings.coach_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { PlayerStatsPage }
