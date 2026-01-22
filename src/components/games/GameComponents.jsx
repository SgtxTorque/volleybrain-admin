import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, MapPin, Clock, Users, ChevronRight, Check, X,
  Edit, BarChart3, ClipboardList
} from '../../constants/icons'

// ============================================
// SPORT CONFIGURATIONS
// ============================================
const SPORT_CONFIGS = {
  volleyball: {
    positions: [
      { id: 1, name: 'P1', label: 'Position 1 (Serve)' },
      { id: 2, name: 'P2', label: 'Position 2 (RS)' },
      { id: 3, name: 'P3', label: 'Position 3 (Middle)' },
      { id: 4, name: 'P4', label: 'Position 4 (OH)' },
      { id: 5, name: 'P5', label: 'Position 5 (Middle)' },
      { id: 6, name: 'P6', label: 'Position 6 (Setter)' },
    ],
    starterCount: 6,
    hasLibero: true,
    statCategories: ['kills', 'assists', 'digs', 'blocks', 'aces', 'errors'],
    icon: '🏐'
  },
  basketball: {
    positions: [
      { id: 1, name: 'PG', label: 'Point Guard' },
      { id: 2, name: 'SG', label: 'Shooting Guard' },
      { id: 3, name: 'SF', label: 'Small Forward' },
      { id: 4, name: 'PF', label: 'Power Forward' },
      { id: 5, name: 'C', label: 'Center' },
    ],
    starterCount: 5,
    hasLibero: false,
    statCategories: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers'],
    icon: '🏀'
  },
  soccer: {
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper' },
      { id: 2, name: 'LB', label: 'Left Back' },
      { id: 3, name: 'CB', label: 'Center Back' },
      { id: 4, name: 'CB', label: 'Center Back' },
      { id: 5, name: 'RB', label: 'Right Back' },
      { id: 6, name: 'LM', label: 'Left Mid' },
      { id: 7, name: 'CM', label: 'Center Mid' },
      { id: 8, name: 'CM', label: 'Center Mid' },
      { id: 9, name: 'RM', label: 'Right Mid' },
      { id: 10, name: 'ST', label: 'Striker' },
      { id: 11, name: 'ST', label: 'Striker' },
    ],
    starterCount: 11,
    hasLibero: false,
    statCategories: ['goals', 'assists', 'shots', 'saves', 'fouls'],
    icon: '⚽'
  },
  baseball: {
    positions: [
      { id: 1, name: 'P', label: 'Pitcher' },
      { id: 2, name: 'C', label: 'Catcher' },
      { id: 3, name: '1B', label: 'First Base' },
      { id: 4, name: '2B', label: 'Second Base' },
      { id: 5, name: 'SS', label: 'Shortstop' },
      { id: 6, name: '3B', label: 'Third Base' },
      { id: 7, name: 'LF', label: 'Left Field' },
      { id: 8, name: 'CF', label: 'Center Field' },
      { id: 9, name: 'RF', label: 'Right Field' },
    ],
    starterCount: 9,
    hasLibero: false,
    hasBattingOrder: true,
    statCategories: ['at_bats', 'hits', 'runs', 'rbis', 'strikeouts', 'walks'],
    icon: '⚾'
  },
  softball: {
    positions: [
      { id: 1, name: 'P', label: 'Pitcher' },
      { id: 2, name: 'C', label: 'Catcher' },
      { id: 3, name: '1B', label: 'First Base' },
      { id: 4, name: '2B', label: 'Second Base' },
      { id: 5, name: 'SS', label: 'Shortstop' },
      { id: 6, name: '3B', label: 'Third Base' },
      { id: 7, name: 'LF', label: 'Left Field' },
      { id: 8, name: 'CF', label: 'Center Field' },
      { id: 9, name: 'RF', label: 'Right Field' },
    ],
    starterCount: 9,
    hasLibero: false,
    hasBattingOrder: true,
    statCategories: ['at_bats', 'hits', 'runs', 'rbis', 'strikeouts', 'walks'],
    icon: '🥎'
  },
  football: {
    positions: [
      { id: 1, name: 'QB', label: 'Quarterback' },
      { id: 2, name: 'RB', label: 'Running Back' },
      { id: 3, name: 'WR', label: 'Wide Receiver' },
      { id: 4, name: 'WR', label: 'Wide Receiver' },
      { id: 5, name: 'TE', label: 'Tight End' },
      { id: 6, name: 'OL', label: 'Offensive Line' },
    ],
    starterCount: 11,
    hasLibero: false,
    statCategories: ['passing_yards', 'rushing_yards', 'touchdowns', 'receptions'],
    icon: '🏈'
  },
  hockey: {
    positions: [
      { id: 1, name: 'G', label: 'Goalie' },
      { id: 2, name: 'LD', label: 'Left Defense' },
      { id: 3, name: 'RD', label: 'Right Defense' },
      { id: 4, name: 'LW', label: 'Left Wing' },
      { id: 5, name: 'C', label: 'Center' },
      { id: 6, name: 'RW', label: 'Right Wing' },
    ],
    starterCount: 6,
    hasLibero: false,
    statCategories: ['goals', 'assists', 'shots', 'saves', 'penalties'],
    icon: '🏒'
  }
}

// Get sport config with fallback
function getSportConfig(sport) {
  const key = sport?.toLowerCase()?.replace(/\s+/g, '') || 'volleyball'
  return SPORT_CONFIGS[key] || SPORT_CONFIGS.volleyball
}

// ============================================
// GAME CARD - Single game display
// ============================================
function GameCard({ 
  game, 
  team, 
  sport = 'volleyball',
  viewerRole = 'parent', // 'parent', 'coach', 'admin'
  playerIds = [], // For parents - their children's IDs
  onViewDetails,
  onComplete,
  onEditStats,
  onRSVP,
  compact = false
}) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const isCompleted = game.game_status === 'completed'
  const isUpcoming = !isCompleted && new Date(game.event_date) >= new Date(new Date().setHours(0,0,0,0))
  const isPast = !isCompleted && new Date(game.event_date) < new Date(new Date().setHours(0,0,0,0))
  
  const sportConfig = getSportConfig(sport)
  const canComplete = (viewerRole === 'coach' || viewerRole === 'admin') && !isCompleted
  const canEditStats = (viewerRole === 'coach' || viewerRole === 'admin') && isCompleted
  
  // Format date
  const gameDate = new Date(game.event_date)
  const dateStr = gameDate.toLocaleDateString('en-US', { 
    weekday: compact ? 'short' : 'long', 
    month: 'short', 
    day: 'numeric' 
  })
  
  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD'
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
  
  // Result styling
  const getResultStyle = () => {
    if (!isCompleted) return {}
    switch (game.game_result) {
      case 'win': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' }
      case 'loss': return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' }
      case 'tie': return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' }
      default: return { bg: tc.cardBgAlt, border: tc.border, text: tc.text }
    }
  }
  
  const resultStyle = getResultStyle()

  // Compact view for sidebars
  if (compact) {
    return (
      <div 
        onClick={() => onViewDetails?.(game)}
        className={`p-3 rounded-xl cursor-pointer transition hover:scale-[1.02] ${
          isCompleted ? `${resultStyle.bg} border ${resultStyle.border}` : `${tc.cardBgAlt} border ${tc.border} hover:border-[var(--accent-primary)]/50`
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Team color indicator */}
            <div 
              className="w-1.5 h-12 rounded-full"
              style={{ backgroundColor: team?.color || 'var(--accent-primary)' }}
            />
            <div>
              <p className={`font-semibold ${tc.text} text-sm`}>
                vs {game.opponent_name || 'TBD'}
              </p>
              <p className={`text-xs ${tc.textMuted}`}>
                {dateStr} • {formatTime(game.event_time)}
              </p>
            </div>
          </div>
          
          {/* Score or status */}
          <div className="text-right">
            {isCompleted ? (
              <>
                <p className={`text-lg font-bold ${resultStyle.text}`}>
                  {game.our_score}-{game.opponent_score}
                </p>
                <p className={`text-xs ${resultStyle.text}`}>
                  {game.game_result === 'win' ? 'W' : game.game_result === 'loss' ? 'L' : 'T'}
                </p>
              </>
            ) : isUpcoming ? (
              <>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  Upcoming
                </span>
              </>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                No Result
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Full card view
  return (
    <div className={`rounded-2xl overflow-hidden border ${
      isCompleted ? `${resultStyle.bg} ${resultStyle.border}` : `${tc.cardBg} ${tc.border}`
    }`}>
      {/* Header with team color */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ backgroundColor: isCompleted ? 'transparent' : (team?.color || 'var(--accent-primary)') + '20' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{sportConfig.icon}</span>
          <div>
            <p className={`text-xs ${tc.textMuted}`}>{team?.name || 'Team'}</p>
            <p className={`font-bold ${tc.text}`}>vs {game.opponent_name || 'TBD'}</p>
          </div>
        </div>
        
        {/* Game status badge */}
        {isCompleted ? (
          <div className={`px-3 py-1 rounded-full font-semibold ${resultStyle.text} ${resultStyle.bg}`}>
            {game.game_result === 'win' ? '🏆 WIN' : game.game_result === 'loss' ? 'LOSS' : '🤝 TIE'}
          </div>
        ) : isUpcoming ? (
          <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
            ⏰ Upcoming
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-400 text-sm font-medium">
            Needs Completion
          </div>
        )}
      </div>
      
      {/* Score display for completed games */}
      {isCompleted && (
        <div className="px-4 py-3 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className={`text-3xl font-bold ${tc.text}`}>{game.our_score}</p>
            <p className={`text-xs ${tc.textMuted}`}>{team?.name || 'Us'}</p>
          </div>
          <span className={`text-xl ${tc.textMuted}`}>-</span>
          <div className="text-center">
            <p className={`text-3xl font-bold ${tc.text}`}>{game.opponent_score}</p>
            <p className={`text-xs ${tc.textMuted}`}>{game.opponent_name}</p>
          </div>
        </div>
      )}
      
      {/* Game details */}
      <div className={`px-4 py-3 border-t ${tc.border}`}>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${tc.textMuted}`} />
            <span className={tc.text}>{dateStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${tc.textMuted}`} />
            <span className={tc.text}>{formatTime(game.event_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${tc.textMuted}`} />
            <span className={tc.text}>
              {game.location_type === 'home' ? '🏠 Home' : game.location_type === 'away' ? '✈️ Away' : '🏟️ Neutral'}
            </span>
          </div>
        </div>
        
        {game.venue_name && (
          <p className={`text-sm ${tc.textMuted} mt-2`}>📍 {game.venue_name}</p>
        )}
      </div>
      
      {/* Action buttons */}
      <div className={`px-4 py-3 border-t ${tc.border} flex flex-wrap gap-2`}>
        <button
          onClick={() => onViewDetails?.(game)}
          className={`flex-1 px-3 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text} text-sm font-medium hover:brightness-110 transition flex items-center justify-center gap-2`}
        >
          <ChevronRight className="w-4 h-4" />
          View Details
        </button>
        
        {/* Parent: RSVP button for upcoming games */}
        {viewerRole === 'parent' && isUpcoming && onRSVP && (
          <button
            onClick={() => onRSVP?.(game)}
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            RSVP
          </button>
        )}
        
        {/* Coach/Admin: Complete game for past uncompleted games */}
        {canComplete && !isUpcoming && (
          <button
            onClick={() => onComplete?.(game)}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            🏁 Complete
          </button>
        )}
        
        {/* Coach/Admin: Edit stats for completed games */}
        {canEditStats && (
          <button
            onClick={() => onEditStats?.(game)}
            className="flex-1 px-3 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// TEAM GAMES WIDGET - List of games for sidebar
// ============================================
function TeamGamesWidget({
  teamIds = [], // Array of team IDs to show games for
  seasonId,
  sport = 'volleyball',
  viewerRole = 'parent',
  playerIds = [],
  onViewDetails,
  onComplete,
  onEditStats,
  onRSVP,
  maxUpcoming = 3,
  maxRecent = 3,
  showTitle = true,
  title = 'Games'
}) {
  const tc = useThemeClasses()
  const [loading, setLoading] = useState(true)
  const [upcomingGames, setUpcomingGames] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [teams, setTeams] = useState({})
  const [activeTab, setActiveTab] = useState('upcoming')
  
  useEffect(() => {
    if (teamIds.length > 0 && seasonId) {
      loadGames()
    }
  }, [teamIds, seasonId])
  
  async function loadGames() {
    setLoading(true)
    
    try {
      // Load teams info
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, color')
        .in('id', teamIds)
      
      const teamsMap = {}
      teamsData?.forEach(t => { teamsMap[t.id] = t })
      setTeams(teamsMap)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Load upcoming games
      const { data: upcoming } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('event_type', 'game')
        .in('team_id', teamIds)
        .gte('event_date', today)
        .neq('game_status', 'completed')
        .order('event_date')
        .order('event_time')
        .limit(maxUpcoming)
      
      setUpcomingGames(upcoming || [])
      
      // Load recent/completed games
      const { data: recent } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('event_type', 'game')
        .in('team_id', teamIds)
        .or(`game_status.eq.completed,event_date.lt.${today}`)
        .order('event_date', { ascending: false })
        .limit(maxRecent)
      
      setRecentGames(recent || [])
      
    } catch (err) {
      console.error('Error loading games:', err)
    }
    
    setLoading(false)
  }
  
  // Calculate record from recent games
  const record = recentGames.reduce((acc, g) => {
    if (g.game_result === 'win') acc.wins++
    else if (g.game_result === 'loss') acc.losses++
    else if (g.game_result === 'tie') acc.ties++
    return acc
  }, { wins: 0, losses: 0, ties: 0 })
  
  if (loading) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-6 ${tc.cardBgAlt} rounded w-1/3`} />
          <div className={`h-20 ${tc.cardBgAlt} rounded`} />
          <div className={`h-20 ${tc.cardBgAlt} rounded`} />
        </div>
      </div>
    )
  }
  
  const hasGames = upcomingGames.length > 0 || recentGames.length > 0

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
      {/* Header */}
      {showTitle && (
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <h3 className={`font-semibold ${tc.text} flex items-center gap-2`}>
            🏆 {title}
          </h3>
          {hasGames && (
            <span className={`text-sm ${tc.textMuted}`}>
              {record.wins}W - {record.losses}L{record.ties > 0 ? ` - ${record.ties}T` : ''}
            </span>
          )}
        </div>
      )}
      
      {/* Tabs */}
      {hasGames && (
        <div className={`flex border-b ${tc.border}`}>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 text-sm font-medium transition ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : tc.textMuted
            }`}
          >
            Upcoming ({upcomingGames.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 text-sm font-medium transition ${
              activeTab === 'recent'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : tc.textMuted
            }`}
          >
            Results ({recentGames.length})
          </button>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {!hasGames ? (
          <div className="text-center py-8">
            <span className="text-4xl">🏆</span>
            <p className={`${tc.textMuted} mt-2`}>No games scheduled</p>
          </div>
        ) : activeTab === 'upcoming' ? (
          upcomingGames.length === 0 ? (
            <div className="text-center py-6">
              <p className={tc.textMuted}>No upcoming games</p>
            </div>
          ) : (
            upcomingGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                team={teams[game.team_id]}
                sport={sport}
                viewerRole={viewerRole}
                playerIds={playerIds}
                onViewDetails={onViewDetails}
                onComplete={onComplete}
                onRSVP={onRSVP}
                compact={true}
              />
            ))
          )
        ) : (
          recentGames.length === 0 ? (
            <div className="text-center py-6">
              <p className={tc.textMuted}>No recent games</p>
            </div>
          ) : (
            recentGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                team={teams[game.team_id]}
                sport={sport}
                viewerRole={viewerRole}
                playerIds={playerIds}
                onViewDetails={onViewDetails}
                onComplete={onComplete}
                onEditStats={onEditStats}
                compact={true}
              />
            ))
          )
        )}
      </div>
    </div>
  )
}

// ============================================
// GAME STATS MODAL - Enter/edit player stats
// ============================================
function GameStatsModal({ event, team, roster, sport = 'volleyball', onClose, onSave, showToast }) {
  const tc = useThemeClasses()
  const { user } = useAuth()
  const sportConfig = getSportConfig(sport)
  
  const [stats, setStats] = useState({}) // { playerId: { statName: value } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadExistingStats()
  }, [event.id])
  
  async function loadExistingStats() {
    setLoading(true)
    
    // Load existing stats for this game
    const { data } = await supabase
      .from('game_player_stats')
      .select('*')
      .eq('event_id', event.id)
    
    // Convert to state format
    const statsMap = {}
    roster.forEach(p => {
      statsMap[p.id] = {}
      sportConfig.statCategories.forEach(cat => {
        const existing = data?.find(s => s.player_id === p.id && s.stat_type === cat)
        statsMap[p.id][cat] = existing?.value || 0
      })
    })
    
    setStats(statsMap)
    setLoading(false)
  }
  
  function updateStat(playerId, statType, value) {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [statType]: parseInt(value) || 0
      }
    }))
  }
  
  async function saveStats() {
    setSaving(true)
    
    try {
      // Delete existing stats for this game
      await supabase
        .from('game_player_stats')
        .delete()
        .eq('event_id', event.id)
      
      // Insert new stats
      const records = []
      Object.entries(stats).forEach(([playerId, playerStats]) => {
        Object.entries(playerStats).forEach(([statType, value]) => {
          if (value > 0) {
            records.push({
              event_id: event.id,
              player_id: playerId,
              stat_type: statType,
              value: value,
              recorded_by: user?.id
            })
          }
        })
      })
      
      if (records.length > 0) {
        const { error } = await supabase.from('game_player_stats').insert(records)
        if (error) throw error
      }
      
      showToast?.('Stats saved!', 'success')
      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving stats:', err)
      showToast?.('Error saving stats', 'error')
    }
    
    setSaving(false)
  }
  
  // Format stat name for display
  const formatStatName = (stat) => {
    return stat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${tc.cardBg} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-xl font-bold ${tc.text}`}>📊 Game Stats</h2>
            <p className={tc.textMuted}>{team?.name} vs {event.opponent_name} • {sportConfig.icon} {sport}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Stats Table */}
        <div className="p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tc.border}`}>
                  <th className={`text-left py-3 px-2 ${tc.text} font-semibold sticky left-0 ${tc.cardBg}`}>Player</th>
                  {sportConfig.statCategories.map(stat => (
                    <th key={stat} className={`text-center py-3 px-2 ${tc.text} font-medium text-sm`}>
                      {formatStatName(stat)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map(player => (
                  <tr key={player.id} className={`border-b ${tc.border} hover:${tc.hoverBg}`}>
                    <td className={`py-2 px-2 sticky left-0 ${tc.cardBg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tc.cardBgAlt}`}>
                          {player.jersey_number || '?'}
                        </span>
                        <span className={`${tc.text} font-medium`}>
                          {player.first_name} {player.last_name?.charAt(0)}.
                        </span>
                      </div>
                    </td>
                    {sportConfig.statCategories.map(stat => (
                      <td key={stat} className="py-2 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={stats[player.id]?.[stat] || 0}
                          onChange={e => updateStat(player.id, stat, e.target.value)}
                          className={`w-14 px-2 py-1 rounded text-center ${tc.input} text-sm`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${tc.border} flex justify-between`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text}`}>
            Cancel
          </button>
          <button 
            onClick={saveStats}
            disabled={saving || loading}
            className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Stats'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Export components and config
export { 
  GameCard, 
  TeamGamesWidget, 
  GameStatsModal,
  getSportConfig,
  SPORT_CONFIGS 
}
