import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

// ============================================
// CONSTANTS
// ============================================
const positionColors = {
  'OH': '#FF6B6B', 'Outside Hitter': '#FF6B6B',
  'S': '#4ECDC4', 'Setter': '#4ECDC4',
  'MB': '#45B7D1', 'Middle Blocker': '#45B7D1',
  'OPP': '#96CEB4', 'Opposite': '#96CEB4',
  'L': '#FFEAA7', 'Libero': '#FFEAA7',
  'DS': '#DDA0DD', 'Defensive Specialist': '#DDA0DD',
  'RS': '#FF9F43', 'Right Side': '#FF9F43',
}

const positionNames = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 'RS': 'Right Side',
}

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

const rarityColors = {
  'Common': '#6B7280', 'Uncommon': '#10B981', 'Rare': '#3B82F6', 'Epic': '#8B5CF6', 'Legendary': '#F59E0B',
}

// ============================================
// SUB-COMPONENTS
// ============================================
function SkillBar({ label, value, maxValue = 100, isDark }) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs uppercase w-16 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: '#F59E0B' }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{value || 0}</span>
    </div>
  )
}

function MiniBarChart({ data, color = '#F59E0B', label, isDark }) {
  const maxValue = Math.max(...(data || []).map(d => d.value), 1)
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
        <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <div className="flex items-center justify-center h-16">
          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No data yet</span>
        </div>
      </div>
    )
  }
  return (
    <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Last {data.length} games</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t transition-all" style={{ height: `${(d.value / maxValue) * 100}%`, backgroundColor: color, minHeight: '4px' }} />
            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BadgeIcon({ badgeId, size = 'md', showLabel = false, earnedDate, isDark }) {
  const badge = badgeDefinitions[badgeId] || { name: badgeId, icon: '🏅', color: '#6B7280', rarity: 'Common' }
  const rarityColor = rarityColors[badge.rarity] || '#6B7280'
  const sizeClasses = { sm: 'w-10 h-10 text-lg', md: 'w-14 h-14 text-2xl', lg: 'w-20 h-20 text-4xl' }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-xl flex items-center justify-center`}
        style={{ backgroundColor: `${badge.color}20`, border: `2px solid ${rarityColor}`, boxShadow: `0 0 20px ${rarityColor}40` }}>
        {badge.icon}
      </div>
      {showLabel && (
        <>
          <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{badge.name}</span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{badge.rarity}</span>
          {earnedDate && <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Earned {earnedDate}</span>}
        </>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
function ParentPlayerCardPage({ playerId, roleContext, showToast, seasonId: propSeasonId }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [player, setPlayer] = useState(null)
  const [teamAssignments, setTeamAssignments] = useState([])
  const [seasonStats, setSeasonStats] = useState(null)
  const [recentGames, setRecentGames] = useState([])
  const [badges, setBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])
  const [skills, setSkills] = useState(null)
  const [seasonId, setSeasonId] = useState(propSeasonId || null)

  useEffect(() => {
    if (playerId) loadAllData()
  }, [playerId])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([
        loadPlayerData(),
        loadBadges(),
        loadRecentGames(),
        loadSkills(),
      ])
    } catch (err) {
      console.error('Error loading player card data:', err)
    }
    setLoading(false)
  }

  async function loadPlayerData() {
    try {
      const { data: fullPlayer } = await supabase.from('players').select('*').eq('id', playerId).single()
      setPlayer(fullPlayer)

      const { data: teams } = await supabase
        .from('team_players')
        .select('*, teams(id, name, color, season_id, seasons(id, name))')
        .eq('player_id', playerId)
      setTeamAssignments(teams || [])

      // Derive season_id and load season stats
      const sid = propSeasonId || fullPlayer?.season_id || teams?.[0]?.teams?.season_id
      if (sid) {
        setSeasonId(sid)
        const { data: stats } = await supabase
          .from('player_season_stats')
          .select('*')
          .eq('player_id', playerId)
          .eq('season_id', sid)
          .single()
        setSeasonStats(stats || null)
      }
    } catch (err) {
      console.error('Error loading player:', err)
    }
  }

  async function loadBadges() {
    try {
      const { data } = await supabase.from('player_badges').select('*').eq('player_id', playerId).order('earned_at', { ascending: false })
      setBadges(data || [])
      try {
        const { data: progress } = await supabase.from('player_achievement_progress').select('*').eq('player_id', playerId)
        setBadgesInProgress(progress || [])
      } catch { setBadgesInProgress([]) }
    } catch { setBadges([]) }
  }

  async function loadRecentGames() {
    try {
      const { data } = await supabase
        .from('game_player_stats')
        .select('*, schedule_events(event_date, opponent_name, our_score, their_score)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(10)
      const games = (data || []).map(g => ({
        date: g.schedule_events?.event_date || g.game_date || null,
        opponent: g.schedule_events?.opponent_name || g.opponent_name || 'Unknown',
        result: (g.schedule_events?.our_score || g.our_score || 0) > (g.schedule_events?.their_score || g.their_score || 0) ? 'W' : 'L',
        score: `${g.schedule_events?.our_score || g.our_score || 0}-${g.schedule_events?.their_score || g.their_score || 0}`,
        kills: g.kills || 0, digs: g.digs || 0, aces: g.aces || 0, blocks: g.blocks || 0, assists: g.assists || 0,
      }))
      setRecentGames(games)
    } catch { setRecentGames([]) }
  }

  async function loadSkills() {
    try {
      const { data } = await supabase.from('player_skills').select('*').eq('player_id', playerId).order('created_at', { ascending: false }).limit(1).single()
      setSkills(data || null)
    } catch { setSkills(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">😕</span>
        <h2 className={`text-xl font-bold ${tc.text} mt-4`}>Player Not Found</h2>
      </div>
    )
  }

  const p = player
  const tp = teamAssignments[0]
  const posColor = positionColors[p.position] || '#F59E0B'
  const teamName = tp?.teams?.name || 'No Team'
  const teamColor = tp?.teams?.color || '#F59E0B'
  const seasonName = tp?.teams?.seasons?.name || ''
  const jerseyNumber = tp?.jersey_number || p.jersey_number

  // Skills
  const getSkillValue = (v) => (v === null || v === undefined) ? 0 : (v <= 10 ? v * 10 : v)
  const calculateOverallRating = () => {
    if (!skills) return null
    const vals = [skills.serve, skills.pass, skills.attack, skills.block, skills.dig, skills.set].filter(v => v != null)
    if (!vals.length) return null
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg)
  }
  const overallRating = calculateOverallRating()

  // Per-game stats
  const gamesPlayed = seasonStats?.games_played || recentGames.length || 0
  const calcPG = (total) => gamesPlayed > 0 ? (total / gamesPlayed).toFixed(1) : '0'
  const perGameStats = gamesPlayed > 0 ? {
    kills: calcPG(seasonStats?.kills || recentGames.reduce((s, g) => s + g.kills, 0)),
    digs: calcPG(seasonStats?.digs || recentGames.reduce((s, g) => s + g.digs, 0)),
    aces: calcPG(seasonStats?.aces || recentGames.reduce((s, g) => s + g.aces, 0)),
    blocks: calcPG(seasonStats?.blocks || recentGames.reduce((s, g) => s + g.blocks, 0)),
    assists: calcPG(seasonStats?.assists || recentGames.reduce((s, g) => s + g.assists, 0)),
  } : null

  // Trends
  const killsTrend = recentGames.length > 0 ? recentGames.slice(0, 6).reverse().map(g => ({ value: g.kills })) : []
  const digsTrend = recentGames.length > 0 ? recentGames.slice(0, 6).reverse().map(g => ({ value: g.digs })) : []

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats' },
    { id: 'badges', label: 'Badges' },
    { id: 'games', label: 'Games' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-0">
      {/* ═══ HERO HEADER ═══ */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-t-2xl overflow-hidden`}>
        <div className="relative flex" style={{ minHeight: '280px' }}>
          {/* Photo */}
          <div className="w-[280px] shrink-0 relative overflow-hidden">
            {p.photo_url ? (
              <>
                <img src={p.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0" style={{
                  background: isDark
                    ? 'linear-gradient(to right, transparent 60%, rgba(15, 23, 42, 0.8) 100%)'
                    : 'linear-gradient(to right, transparent 60%, rgba(255, 255, 255, 0.9) 100%)'
                }} />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: isDark ? `linear-gradient(135deg, ${posColor}40, #1e293b)` : `linear-gradient(135deg, ${posColor}30, #f1f5f9)` }}>
                <div className="text-center">
                  <span className="text-8xl font-black" style={{ color: posColor }}>{jerseyNumber || '?'}</span>
                  <p className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 p-6 flex flex-col justify-between relative">
            <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${posColor}${isDark ? '20' : '15'}, transparent 50%)` }} />
            <div className="relative">
              {/* Season/Team badge */}
              <div className="flex items-start justify-between mb-4">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: teamColor, color: '#fff' }}>
                  {seasonName ? `${seasonName} ` : ''}{teamName}
                </span>
                {/* Overall rating */}
                {overallRating !== null && (
                  <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: posColor }}>
                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{overallRating}</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <h1 className="text-4xl font-black text-amber-400 uppercase tracking-tight">{p.first_name || 'Player'}</h1>
              <h2 className={`text-4xl font-black uppercase tracking-tight -mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.last_name || ''}</h2>

              {/* Position & Jersey */}
              <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {positionNames[p.position] || p.position || 'Player'} <span className="mx-2">•</span> #{jerseyNumber || '—'}
              </p>

              {/* Badge icons */}
              {badges.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {badges.slice(0, 4).map((b, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`, border: `2px solid ${badgeDefinitions[b.badge_id]?.color || '#6B7280'}` }}>
                      {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Per-Game Stats Bar */}
        {perGameStats && (
          <div className={`flex justify-around py-3 border-t ${tc.border} ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/80'}`}>
            {Object.entries(perGameStats).map(([key, value]) => (
              <div key={key} className="text-center">
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
                <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{key}/G</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ TABS + CONTENT ═══ */}
      <div className={`${tc.cardBg} border border-t-0 ${tc.border} rounded-b-2xl overflow-hidden`}>
        <div className={`flex border-b ${tc.border}`}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : `${tc.textMuted} hover:${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`
              }`}
              style={activeTab === tab.id ? { borderColor: '#F59E0B' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Left: Skills + Season Progress */}
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Skills</h4>
                  {skills ? (
                    <div className="space-y-3">
                      <SkillBar label="Serve" value={getSkillValue(skills.serve)} isDark={isDark} />
                      <SkillBar label="Pass" value={getSkillValue(skills.pass)} isDark={isDark} />
                      <SkillBar label="Attack" value={getSkillValue(skills.attack)} isDark={isDark} />
                      <SkillBar label="Block" value={getSkillValue(skills.block)} isDark={isDark} />
                      <SkillBar label="Dig" value={getSkillValue(skills.dig)} isDark={isDark} />
                      <SkillBar label="Set" value={getSkillValue(skills.set)} isDark={isDark} />
                    </div>
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No skill ratings yet</p>
                  )}
                </div>

                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Season Progress</h4>
                  {(seasonStats || gamesPlayed > 0) ? (
                    <div className="space-y-2.5">
                      {[
                        { icon: '✅', color: 'emerald', label: `${seasonStats?.games_played || gamesPlayed} Games Played` },
                        { icon: '⚡', color: 'amber', label: `${seasonStats?.kills || recentGames.reduce((s, g) => s + g.kills, 0)} Total Kills` },
                        { icon: '💎', color: 'cyan', label: `${seasonStats?.digs || recentGames.reduce((s, g) => s + g.digs, 0)} Total Digs` },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full bg-${item.color}-500/20 flex items-center justify-center`}>
                            <span className="text-xs">{item.icon}</span>
                          </div>
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No season stats yet</p>
                  )}
                </div>
              </div>

              {/* Middle: Recent Games + Kills Trend */}
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recent Games</h4>
                  {recentGames.length > 0 ? (
                    recentGames.slice(0, 3).map((game, i) => (
                      <div key={i} className={`flex items-center gap-2 py-2.5 last:border-0 border-b ${tc.border}`}>
                        <span className={`text-xs w-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                        }`}>{game.result}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{game.opponent}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.score}</p>
                        </div>
                        <div className="flex gap-2 text-xs font-bold">
                          <span className="text-amber-400">{game.kills}</span>
                          <span className="text-cyan-400">{game.digs}</span>
                          <span className="text-purple-400">{game.aces}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No games played yet</p>
                  )}
                </div>
                <MiniBarChart data={killsTrend} color="#F59E0B" label="Kills Trend" isDark={isDark} />
              </div>

              {/* Right: Badges + Progress */}
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Badges</h4>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{badges.length} earned</span>
                  </div>
                  {badges.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {badges.slice(0, 6).map((b, i) => (
                        <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`, border: `2px solid ${badgeDefinitions[b.badge_id]?.color || '#6B7280'}` }}>
                          {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No badges earned yet</p>
                  )}

                  {badgesInProgress.length > 0 && (
                    <>
                      <h5 className={`text-xs uppercase mt-4 mb-2 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>In Progress</h5>
                      {badgesInProgress.slice(0, 2).map((b, i) => (
                        <div key={i} className="flex items-center gap-3 py-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20` }}>
                            {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                          </div>
                          <div className="flex-1">
                            <p className={`text-xs font-semibold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {badgeDefinitions[b.badge_id]?.name || b.badge_id}
                            </p>
                            <div className={`h-1.5 rounded-full mt-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <div className="h-full rounded-full" style={{ width: `${(b.progress / b.target) * 100}%`, backgroundColor: badgeDefinitions[b.badge_id]?.color || '#6B7280' }} />
                            </div>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{b.progress}/{b.target}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Digs Trend (fills remaining space) */}
                <MiniBarChart data={digsTrend} color="#06B6D4" label="Digs Trend" isDark={isDark} />
              </div>
            </div>
          )}

          {/* ═══ STATS ═══ */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Season Totals */}
              <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Season Totals</h4>
                <div className="grid grid-cols-6 gap-4">
                  {[
                    { label: 'Games', value: seasonStats?.games_played || recentGames.length, icon: '🏐' },
                    { label: 'Kills', value: seasonStats?.kills || 0, icon: '⚡', color: '#F59E0B' },
                    { label: 'Digs', value: seasonStats?.digs || 0, icon: '💎', color: '#06B6D4' },
                    { label: 'Aces', value: seasonStats?.aces || 0, icon: '🎯', color: '#EC4899' },
                    { label: 'Blocks', value: seasonStats?.blocks || 0, icon: '🛡️', color: '#6366F1' },
                    { label: 'Assists', value: seasonStats?.assists || 0, icon: '🤝', color: '#F59E0B' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <p className={`text-xs uppercase mb-1 flex items-center justify-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {stat.label} <span>{stat.icon}</span>
                      </p>
                      <p className="text-3xl font-bold" style={{ color: stat.color || (isDark ? '#fff' : '#1e293b') }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attacking & Defense */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Attacking</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Hit %</p>
                      <p className="text-2xl font-bold text-amber-400">{seasonStats?.hit_percentage ? `.${Math.round(seasonStats.hit_percentage * 1000)}` : '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Attempts</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{seasonStats?.attack_attempts || 0}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Errors</p>
                      <p className="text-2xl font-bold text-red-400">{seasonStats?.attack_errors || 0}</p>
                    </div>
                  </div>
                </div>
                <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Passing & Defense</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pass Rating</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{seasonStats?.pass_rating || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Serve Rcv</p>
                      <p className="text-2xl font-bold text-emerald-400">{seasonStats?.serve_receive_pct ? `${Math.round(seasonStats.serve_receive_pct)}%` : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per Game Averages */}
              {perGameStats && (
                <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Per Game Averages</h4>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(perGameStats).map(([key, value]) => (
                      <div key={key}>
                        <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{key}</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>per game</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend Charts */}
              {recentGames.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <MiniBarChart data={killsTrend} color="#F59E0B" label="Kills Trend" isDark={isDark} />
                  <MiniBarChart data={digsTrend} color="#06B6D4" label="Digs Trend" isDark={isDark} />
                </div>
              )}
            </div>
          )}

          {/* ═══ BADGES ═══ */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Earned ({badges.length})
                </h4>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-4 gap-6">
                    {badges.map((b, i) => (
                      <BadgeIcon key={i} badgeId={b.badge_id} size="lg" showLabel isDark={isDark}
                        earnedDate={b.earned_at ? new Date(b.earned_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : null} />
                    ))}
                  </div>
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No badges earned yet</p>
                )}
              </div>

              {badgesInProgress.length > 0 && (
                <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>In Progress</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {badgesInProgress.map((b, i) => (
                      <div key={i} className={`flex items-center gap-4 rounded-xl p-4 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20` }}>
                          {badgeDefinitions[b.badge_id]?.icon || '🏅'}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium uppercase text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {badgeDefinitions[b.badge_id]?.name || b.badge_id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <div className="h-full rounded-full" style={{ width: `${(b.progress / b.target) * 100}%`, backgroundColor: badgeDefinitions[b.badge_id]?.color || '#6B7280' }} />
                            </div>
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{b.progress}/{b.target}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ GAMES ═══ */}
          {activeTab === 'games' && (
            <div className={`rounded-xl p-5 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Game Log</h4>
              {recentGames.length > 0 ? (
                <>
                  {/* Header */}
                  <div className={`flex items-center gap-4 py-2 text-xs uppercase font-semibold border-b ${tc.border} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="w-12">Date</span>
                    <span className="w-8"></span>
                    <span className="flex-1">Opponent</span>
                    <div className="flex gap-4 w-40 justify-end">
                      <span>K</span><span>D</span><span>A</span><span>B</span><span>AST</span>
                    </div>
                  </div>
                  {/* Rows */}
                  {recentGames.map((game, i) => (
                    <div key={i} className={`flex items-center gap-4 py-3 border-b last:border-0 ${tc.border}`}>
                      <span className={`text-sm w-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                      }`}>{game.result}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{game.opponent}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.score}</p>
                      </div>
                      <div className={`flex gap-4 w-40 justify-end text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="text-amber-400">{game.kills}</span>
                        <span className="text-cyan-400">{game.digs}</span>
                        <span className="text-purple-400">{game.aces}</span>
                        <span className="text-blue-400">{game.blocks}</span>
                        <span className="text-green-400">{game.assists}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No games played yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { ParentPlayerCardPage }
