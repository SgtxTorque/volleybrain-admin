import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import PageShell from '../../components/pages/PageShell'

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
  const { isDark } = useTheme()

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center text-slate-400 text-r-xs" style={{ height }}>
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
  const { isDark } = useTheme()
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'

  if (size === 'large') {
    return (
      <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-r-2xl">{icon}</span>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-r-xs font-bold ${
              isPositive ? 'bg-emerald-100 text-emerald-700' :
              isNegative ? 'bg-red-100 text-red-700' :
              `${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'} text-slate-400`
            }`}>
              {isPositive ? <TrendingUpIcon className="w-3 h-3" /> : isNegative ? <TrendingDownIcon className="w-3 h-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <p className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ color }}>{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</p>
      </div>
    )
  }

  return (
    <div className={`${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'} rounded-[14px] p-4`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-r-lg">{icon}</span>
        {trend && (
          <span className={`text-r-xs font-bold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-400'}`}>
            {isPositive ? '↑' : isNegative ? '↓' : '-'} {trendValue}
          </span>
        )}
      </div>
      <p className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

// ============================================
// GAME HISTORY ROW
// ============================================
function GameHistoryRow({ game, stats, onClick }) {
  const { isDark } = useTheme()
  const gameDate = new Date(game.event_date)
  const isWin = game.game_result === 'win'
  const isLoss = game.game_result === 'loss'

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F5F6F8]'} hover:border-[#4BB9EC]/50 hover:shadow-md transition cursor-pointer`}
    >
      {/* Date */}
      <div className="text-center min-w-[60px]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{gameDate.toLocaleDateString('en-US', { month: 'short' })}</p>
        <p className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{gameDate.getDate()}</p>
      </div>

      {/* Result badge */}
      <div className={`px-3 py-1 rounded-lg text-r-sm font-bold ${
        isWin ? 'bg-emerald-100 text-emerald-700' :
        isLoss ? 'bg-red-100 text-red-700' :
        `${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'} text-slate-400`
      }`}>
        {isWin ? 'W' : isLoss ? 'L' : 'T'}
      </div>

      {/* Opponent */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} truncate text-sm`}>vs {game.opponent_name || 'Unknown'}</p>
        <p className="text-r-xs text-slate-400">
          {game.our_score !== null ? `${game.our_score} - ${game.opponent_score}` : 'No score'}
        </p>
      </div>

      {/* Key stats */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="text-r-lg font-bold text-emerald-600">{stats?.aces || 0}</p>
          <p className="text-[10px] text-slate-400">Aces</p>
        </div>
        <div>
          <p className="text-r-lg font-bold text-red-600">{stats?.kills || 0}</p>
          <p className="text-[10px] text-slate-400">Kills</p>
        </div>
        <div>
          <p className="text-r-lg font-bold text-lynx-sky">{stats?.digs || 0}</p>
          <p className="text-[10px] text-slate-400">Digs</p>
        </div>
        <div>
          <p className="text-r-lg font-bold text-amber-600">{stats?.blocks || 0}</p>
          <p className="text-[10px] text-slate-400">Blocks</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SKILL RATING BAR
// ============================================
function SkillRatingBar({ label, value, color, maxValue = 100 }) {
  const { isDark } = useTheme()
  const percentage = (value / maxValue) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
        <span className="font-extrabold" style={{ color }}>{value}</span>
      </div>
      <div className={`h-2.5 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'} overflow-hidden`}>
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
  const { isDark } = useTheme()
  const { selectedSeason } = useSeason()
  const { organization } = useAuth()

  const [player, setPlayer] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameHistory, setGameHistory] = useState([])
  const [skillRatings, setSkillRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (playerId) {
      loadPlayerData()
    } else {
      setLoading(false)
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
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {playerId ? 'Player not found' : 'No Stats to Display'}
          </p>
          <p className="text-slate-400 text-r-sm mt-2">
            {playerId
              ? 'This player may have been removed or is no longer in this season.'
              : 'Stats will appear here after your coach records game results.'}
          </p>
        </div>
      </div>
    )
  }

  const playerName = `${player.first_name} ${player.last_name}`
  const subtitleParts = []
  if (player.jersey_number) subtitleParts.push(`#${player.jersey_number}`)
  if (player.position) subtitleParts.push(player.position)
  if (selectedSeason) subtitleParts.push(selectedSeason.name)
  const subtitleText = subtitleParts.join(' / ')

  const backAction = onBack ? (
    <button
      onClick={onBack}
      className={`p-2 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'} rounded-xl transition`}
    >
      <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
    </button>
  ) : null

  return (
    <PageShell
      title={playerName}
      breadcrumb="Stats"
      subtitle={subtitleText}
      actions={
        <div className="flex items-center gap-4">
          {backAction}
          {/* Player photo */}
          {player.photo_url ? (
            <img src={player.photo_url} className="w-12 h-12 rounded-xl object-cover shadow" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-lynx-navy-subtle flex items-center justify-center text-white text-lg font-extrabold shadow">
              {player.jersey_number || '?'}
            </div>
          )}
          {/* Quick stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xl font-extrabold text-[#4BB9EC]">{seasonStats?.games_played || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Games</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-emerald-500">{seasonStats?.total_points || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Points</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-amber-500">{seasonStats?.total_aces || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aces</p>
            </div>
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {['overview', 'game-log', 'skills'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
              activeTab === tab
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : `text-slate-400 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#F5F6F8]'}`
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            {tab === 'overview' ? '📊 Overview' :
             tab === 'game-log' ? '📅 Game Log' :
             '⭐ Skills'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Season Totals */}
          <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
            <h2 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2`} style={{ fontFamily: 'var(--v2-font)' }}>
              <CalendarIcon className="w-5 h-5 text-lynx-sky" />
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
          <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
            <h2 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2`} style={{ fontFamily: 'var(--v2-font)' }}>
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
            <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2 text-sm`}>
                🏐 Aces Progress
              </h3>
              <MiniLineChart data={getStatHistory('aces')} color="#10B981" height={100} />
              <p className="text-r-xs text-slate-400 mt-2 text-center">Last {gameHistory.length} games</p>
            </div>

            {/* Kills Trend */}
            <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2 text-sm`}>
                💥 Kills Progress
              </h3>
              <MiniLineChart data={getStatHistory('kills')} color="#EF4444" height={100} />
              <p className="text-r-xs text-slate-400 mt-2 text-center">Last {gameHistory.length} games</p>
            </div>

            {/* Digs Trend */}
            <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2 text-sm`}>
                🏃 Digs Progress
              </h3>
              <MiniLineChart data={getStatHistory('digs')} color="#F59E0B" height={100} />
              <p className="text-r-xs text-slate-400 mt-2 text-center">Last {gameHistory.length} games</p>
            </div>

            {/* Blocks Trend */}
            <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2 text-sm`}>
                🛡️ Blocks Progress
              </h3>
              <MiniLineChart data={getStatHistory('blocks')} color="#6366F1" height={100} />
              <p className="text-r-xs text-slate-400 mt-2 text-center">Last {gameHistory.length} games</p>
            </div>
          </div>

          {/* Percentages */}
          <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
            <h2 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2`} style={{ fontFamily: 'var(--v2-font)' }}>
              <AwardIcon className="w-5 h-5 text-amber-500" />
              Efficiency Ratings
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400 text-r-sm">Hitting Percentage</span>
                  <span className={`font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'} text-sm`}>
                    {((seasonStats?.hitting_percentage || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={`h-3 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'} overflow-hidden`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600"
                    style={{ width: `${Math.max(0, (seasonStats?.hitting_percentage || 0) * 100 + 50)}%` }}
                  />
                </div>
                <p className="text-r-xs text-slate-400 mt-1">(Kills - Errors) / Attempts</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400 text-r-sm">Serve Percentage</span>
                  <span className={`font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'} text-sm`}>
                    {((seasonStats?.serve_percentage || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className={`h-3 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'} overflow-hidden`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{ width: `${(seasonStats?.serve_percentage || 0) * 100}%` }}
                  />
                </div>
                <p className="text-r-xs text-slate-400 mt-1">(Serves - Errors) / Serves</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Log Tab */}
      {activeTab === 'game-log' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>Game History</h2>
            <span className="text-r-sm text-slate-400">{gameHistory.length} games</span>
          </div>

          {gameHistory.length === 0 ? (
            <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-12 text-center`}>
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-r-sm">No game stats recorded yet</p>
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
          <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
            <h2 className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-4 flex items-center gap-2`} style={{ fontFamily: 'var(--v2-font)' }}>
              <StarIcon className="w-5 h-5 text-amber-500" />
              Coach Skill Ratings
            </h2>

            {skillRatings ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} text-sm`}>Technical Skills</h4>
                  <SkillRatingBar label="Serving" value={skillRatings.serving_rating || 50} color="#10B981" />
                  <SkillRatingBar label="Passing" value={skillRatings.passing_rating || 50} color="#3B82F6" />
                  <SkillRatingBar label="Setting" value={skillRatings.setting_rating || 50} color="#8B5CF6" />
                  <SkillRatingBar label="Attacking" value={skillRatings.attacking_rating || 50} color="#EF4444" />
                  <SkillRatingBar label="Blocking" value={skillRatings.blocking_rating || 50} color="#6366F1" />
                  <SkillRatingBar label="Defense" value={skillRatings.defense_rating || 50} color="#F59E0B" />
                </div>

                <div className="space-y-4">
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} text-sm`}>Intangibles</h4>
                  <SkillRatingBar label="Hustle" value={skillRatings.hustle_rating || 50} color="#EC4899" />
                  <SkillRatingBar label="Coachability" value={skillRatings.coachability_rating || 50} color="#14B8A6" />
                  <SkillRatingBar label="Teamwork" value={skillRatings.teamwork_rating || 50} color="#4BB9EC" />

                  {/* Overall */}
                  <div className={`mt-6 p-4 ${isDark ? 'bg-[#4BB9EC]/10' : 'bg-[#4BB9EC]/10'} rounded-xl`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${isDark ? 'text-[#4BB9EC]' : 'text-[#10284C]'} text-sm`}>Overall Rating</span>
                      <span className="text-3xl font-extrabold text-[#4BB9EC]">{skillRatings.overall_rating || 50}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-400 text-r-sm">No skill ratings yet</p>
                <p className="text-r-xs text-slate-400 mt-1">Coach hasn't submitted ratings for this season</p>
              </div>
            )}
          </div>

          {/* Coach Notes */}
          {skillRatings?.coach_notes && (
            <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-6 shadow-sm`}>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-[#10284C]'} mb-3 text-sm`}>📝 Coach Notes</h3>
              <p className="text-slate-400 whitespace-pre-wrap text-r-sm">{skillRatings.coach_notes}</p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}

export { PlayerStatsPage }
