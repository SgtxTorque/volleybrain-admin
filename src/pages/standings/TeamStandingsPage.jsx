import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Trophy, TrendingUp, TrendingDown, Minus, Target, Calendar, ChevronRight, ChevronDown } from 'lucide-react'

// ============================================
// TEAM STANDINGS PAGE
// For independent teams: Shows own season record
// For leagues: Would show full league table (future)
// ============================================

export default function TeamStandingsPage() {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { user, profile } = useAuth()
  const { selectedSeason } = useSeason()
  
  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState(null)
  const [recentGames, setRecentGames] = useState([])
  const [streakInfo, setStreakInfo] = useState({ type: null, count: 0 })
  
  // Team selection (like GamePrepPage)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  
  // Load teams when season changes
  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
    }
  }, [selectedSeason?.id])
  
  // Load standings when team changes
  useEffect(() => {
    if (selectedTeam?.id && selectedSeason?.id) {
      loadStandings()
      loadRecentGames()
    }
  }, [selectedTeam?.id, selectedSeason?.id])
  
  async function loadTeams() {
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('season_id', selectedSeason.id)
        .order('name')
      
      setTeams(data || [])
      if (data?.length > 0) {
        setSelectedTeam(data[0])
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error('Error loading teams:', err)
      setLoading(false)
    }
  }
  
  async function loadStandings() {
    setLoading(true)
    try {
      // Get standings from team_standings table
      const { data: standingsData } = await supabase
        .from('team_standings')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('season_id', selectedSeason.id)
        .single()
      
      if (standingsData) {
        setStandings(standingsData)
      } else {
        // Calculate from games if no standings record exists
        const { data: games } = await supabase
          .from('schedule_events')
          .select('*')
          .eq('team_id', selectedTeam.id)
          .eq('season_id', selectedSeason.id)
          .eq('event_type', 'game')
          .eq('game_status', 'completed')
        
        if (games && games.length > 0) {
          const wins = games.filter(g => g.game_result === 'win').length
          const losses = games.filter(g => g.game_result === 'loss').length
          const ties = games.filter(g => g.game_result === 'tie').length
          const totalPoints = games.reduce((sum, g) => sum + (g.our_score || 0), 0)
          const opponentPoints = games.reduce((sum, g) => sum + (g.opponent_score || 0), 0)
          
          setStandings({
            wins,
            losses,
            ties,
            games_played: games.length,
            win_percentage: games.length > 0 ? (wins / games.length) * 100 : 0,
            points_for: totalPoints,
            points_against: opponentPoints,
            point_differential: totalPoints - opponentPoints
          })
        } else {
          setStandings({
            wins: 0,
            losses: 0,
            ties: 0,
            games_played: 0,
            win_percentage: 0,
            points_for: 0,
            points_against: 0,
            point_differential: 0
          })
        }
      }
    } catch (err) {
      console.error('Error loading standings:', err)
    }
    setLoading(false)
  }
  
  async function loadRecentGames() {
    try {
      const { data: games } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('season_id', selectedSeason.id)
        .eq('event_type', 'game')
        .eq('game_status', 'completed')
        .order('event_date', { ascending: false })
        .limit(10)
      
      setRecentGames(games || [])
      
      // Calculate streak
      if (games && games.length > 0) {
        const firstResult = games[0].game_result
        let streak = 1
        for (let i = 1; i < games.length; i++) {
          if (games[i].game_result === firstResult) {
            streak++
          } else {
            break
          }
        }
        setStreakInfo({ type: firstResult, count: streak })
      }
    } catch (err) {
      console.error('Error loading recent games:', err)
    }
  }
  
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  if (loading) {
    return (
      <div className={`min-h-screen ${tc.pageBg} p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className={`h-8 rounded w-48 ${tc.cardBgAlt}`} />
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className={`h-32 rounded-xl ${tc.cardBgAlt}`} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const winPct = standings?.win_percentage || 0
  const isWinning = winPct >= 50
  
  // No team selected state
  if (!selectedTeam) {
    return (
      <div className={`min-h-screen ${tc.pageBg} p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className={`${tc.cardBg} rounded-xl border ${tc.border} p-12 text-center`}>
            <span className="text-6xl">📊</span>
            <h2 className={`text-xl font-bold ${tc.text} mt-4`}>No Team Selected</h2>
            <p className={tc.textMuted}>Select a team to view standings</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen ${tc.pageBg} p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: selectedTeam?.color || 'var(--accent-primary)' }}
            >
              🏆
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${tc.text}`}>Team Standings</h1>
              <p className={tc.textMuted}>{selectedTeam?.name} • {selectedSeason?.name}</p>
            </div>
          </div>
          
          {/* Team Selector */}
          {teams.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl ${tc.cardBg} border ${tc.border} hover:border-[var(--accent-primary)] transition`}
              >
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedTeam?.color || '#888' }}
                />
                <span className={tc.text}>{selectedTeam?.name}</span>
                <ChevronDown className={`w-4 h-4 ${tc.textMuted}`} />
              </button>
              
              {showTeamDropdown && (
                <div className={`absolute right-0 mt-2 w-56 ${tc.cardBg} border ${tc.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
                  {teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team)
                        setShowTeamDropdown(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'} ${
                        team.id === selectedTeam?.id ? 'bg-[var(--accent-primary)]/20' : ''
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color || '#888' }}
                      />
                      <span className={tc.text}>{team.name}</span>
                      {team.id === selectedTeam?.id && (
                        <span className="ml-auto text-[var(--accent-primary)]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Season Record Card */}
        <div className={`${tc.cardBg} rounded-xl border ${tc.border} overflow-hidden`}>
          <div 
            className="p-6"
            style={{ 
              background: `linear-gradient(135deg, ${selectedTeam?.color || 'var(--accent-primary)'}33, transparent)` 
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-lg font-semibold ${tc.text}`}>Season Record</h2>
                <p className={tc.textMuted}>{standings?.games_played || 0} games played</p>
              </div>
              {streakInfo.type && streakInfo.count > 1 && (
                <div className={`px-4 py-2 rounded-xl ${
                  streakInfo.type === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
                  streakInfo.type === 'loss' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  <span className="text-lg font-bold">
                    {streakInfo.count} {streakInfo.type === 'win' ? 'W' : streakInfo.type === 'loss' ? 'L' : 'T'} Streak
                  </span>
                </div>
              )}
            </div>
            
            {/* Big Record Display */}
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-4 text-6xl font-black">
                <span className="text-emerald-400">{standings?.wins || 0}</span>
                <span className={tc.textMuted}>-</span>
                <span className="text-red-400">{standings?.losses || 0}</span>
                {(standings?.ties || 0) > 0 && (
                  <>
                    <span className={tc.textMuted}>-</span>
                    <span className="text-amber-400">{standings.ties}</span>
                  </>
                )}
              </div>
              <p className={`mt-2 text-lg ${tc.textMuted}`}>
                {standings?.wins || 0}W - {standings?.losses || 0}L{(standings?.ties || 0) > 0 ? ` - ${standings.ties}T` : ''}
              </p>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-t ${tc.border}`}>
            {/* Win Percentage */}
            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className={`text-xs ${tc.textMuted}`}>Win %</span>
              </div>
              <p className={`text-2xl font-bold ${isWinning ? 'text-emerald-400' : 'text-red-400'}`}>
                {winPct.toFixed(1)}%
              </p>
            </div>
            
            {/* Points For */}
            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className={`text-xs ${tc.textMuted}`}>Points For</span>
              </div>
              <p className={`text-2xl font-bold ${tc.text}`}>
                {standings?.points_for || 0}
              </p>
            </div>
            
            {/* Points Against */}
            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className={`text-xs ${tc.textMuted}`}>Points Against</span>
              </div>
              <p className={`text-2xl font-bold ${tc.text}`}>
                {standings?.points_against || 0}
              </p>
            </div>
            
            {/* Point Differential */}
            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <div className="flex items-center gap-2 mb-2">
                {(standings?.point_differential || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs ${tc.textMuted}`}>Point Diff</span>
              </div>
              <p className={`text-2xl font-bold ${
                (standings?.point_differential || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {(standings?.point_differential || 0) >= 0 ? '+' : ''}{standings?.point_differential || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Results */}
        <div className={`${tc.cardBg} rounded-xl border ${tc.border} p-6`}>
          <h3 className={`text-lg font-semibold ${tc.text} mb-4`}>Recent Results</h3>
          
          {recentGames.length > 0 ? (
            <div className="space-y-3">
              {recentGames.map(game => (
                <div 
                  key={game.id}
                  className={`p-4 rounded-xl border ${
                    game.game_result === 'win' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    game.game_result === 'loss' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Result indicator */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                        game.game_result === 'win' ? 'bg-emerald-500' :
                        game.game_result === 'loss' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`}>
                        {game.game_result === 'win' ? 'W' : game.game_result === 'loss' ? 'L' : 'T'}
                      </div>
                      
                      <div>
                        <p className={`font-semibold ${tc.text}`}>vs {game.opponent_name || 'TBD'}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3 h-3" />
                          <span className={tc.textMuted}>{formatDate(game.event_date)}</span>
                          {game.location_type && (
                            <span className={tc.textMuted}>
                              • {game.location_type === 'home' ? '🏠 Home' : '✈️ Away'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {/* Set-based score */}
                      {game.set_scores && game.our_sets_won !== undefined ? (
                        <>
                          <p className={`text-2xl font-bold ${
                            game.game_result === 'win' ? 'text-emerald-400' : 
                            game.game_result === 'loss' ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {game.our_sets_won} - {game.opponent_sets_won}
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>
                            {game.set_scores
                              .filter(s => s && (s.our > 0 || s.their > 0))
                              .map(s => `${s.our}-${s.their}`)
                              .join(', ')}
                          </p>
                        </>
                      ) : (
                        <p className={`text-2xl font-bold ${
                          game.game_result === 'win' ? 'text-emerald-400' : 
                          game.game_result === 'loss' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {game.our_score} - {game.opponent_score}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-5xl">📊</span>
              <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>No Games Completed Yet</h3>
              <p className={tc.textMuted}>Complete some games to see your standings!</p>
            </div>
          )}
        </div>
        
        {/* Monthly Breakdown (if enough games) */}
        {recentGames.length >= 3 && (
          <div className={`${tc.cardBg} rounded-xl border ${tc.border} p-6`}>
            <h3 className={`text-lg font-semibold ${tc.text} mb-4`}>Form Guide</h3>
            <div className="flex items-center gap-2">
              {recentGames.slice(0, 5).reverse().map((game, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                    game.game_result === 'win' ? 'bg-emerald-500' :
                    game.game_result === 'loss' ? 'bg-red-500' :
                    'bg-amber-500'
                  }`}
                  title={`vs ${game.opponent_name}: ${game.our_score}-${game.opponent_score}`}
                >
                  {game.game_result === 'win' ? 'W' : game.game_result === 'loss' ? 'L' : 'T'}
                </div>
              ))}
              <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
              <span className={`text-sm ${tc.textMuted}`}>Latest →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// STANDINGS WIDGET (for dashboards)
// ============================================
export function StandingsWidget({ teamId, seasonId, teamName, teamColor }) {
  const tc = useThemeClasses()
  const [standings, setStandings] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (teamId && seasonId) {
      loadStandings()
    }
  }, [teamId, seasonId])
  
  async function loadStandings() {
    try {
      const { data } = await supabase
        .from('team_standings')
        .select('*')
        .eq('team_id', teamId)
        .eq('season_id', seasonId)
        .single()
      
      if (data) {
        setStandings(data)
      } else {
        // Calculate from games
        const { data: games } = await supabase
          .from('schedule_events')
          .select('game_result, our_score, opponent_score')
          .eq('team_id', teamId)
          .eq('season_id', seasonId)
          .eq('event_type', 'game')
          .eq('game_status', 'completed')
        
        if (games) {
          const wins = games.filter(g => g.game_result === 'win').length
          const losses = games.filter(g => g.game_result === 'loss').length
          const pd = games.reduce((sum, g) => sum + ((g.our_score || 0) - (g.opponent_score || 0)), 0)
          setStandings({ wins, losses, games_played: games.length, point_differential: pd })
        }
      }
    } catch (err) {
      console.error('Error loading standings:', err)
    }
    setLoading(false)
  }
  
  if (loading) {
    return (
      <div className={`${tc.cardBg} rounded-xl border ${tc.border} p-6 animate-pulse`}>
        <div className={`h-6 rounded w-32 mb-4 ${tc.cardBgAlt}`} />
        <div className={`h-12 rounded w-24 ${tc.cardBgAlt}`} />
      </div>
    )
  }
  
  if (!standings || standings.games_played === 0) {
    return (
      <div className={`${tc.cardBg} rounded-xl border ${tc.border} p-6`}>
        <h3 className={`font-semibold ${tc.text} mb-2`}>📊 Season Record</h3>
        <p className={tc.textMuted}>No games completed yet</p>
      </div>
    )
  }
  
  return (
    <div className={`${tc.cardBg} rounded-xl border ${tc.border} overflow-hidden`}>
      <div 
        className="p-4"
        style={{ backgroundColor: `${teamColor}22` }}
      >
        <h3 className={`font-semibold ${tc.text}`}>📊 Season Record</h3>
        <p className={`text-xs ${tc.textMuted}`}>{teamName}</p>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-3xl font-black">
              <span className="text-emerald-400">{standings.wins}</span>
              <span className={tc.textMuted}> - </span>
              <span className="text-red-400">{standings.losses}</span>
            </p>
            <p className={`text-xs ${tc.textMuted}`}>W - L</p>
          </div>
          <div className={`px-3 py-2 rounded-xl ${
            (standings.point_differential || 0) >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            <p className={`text-lg font-bold ${
              (standings.point_differential || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(standings.point_differential || 0) >= 0 ? '+' : ''}{standings.point_differential || 0}
            </p>
            <p className={`text-xs ${tc.textMuted}`}>Point Diff</p>
          </div>
        </div>
      </div>
    </div>
  )
}
