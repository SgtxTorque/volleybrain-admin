import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

// ============================================
// MULTI-SPORT DISPLAY CONFIG
// ============================================
const SPORT_DISPLAY = {
  volleyball: {
    positions: {
      'OH': { full: 'Outside Hitter', color: '#FF6B6B' }, 'Outside Hitter': { full: 'Outside Hitter', color: '#FF6B6B' },
      'S': { full: 'Setter', color: '#4ECDC4' }, 'Setter': { full: 'Setter', color: '#4ECDC4' },
      'MB': { full: 'Middle Blocker', color: '#45B7D1' }, 'Middle Blocker': { full: 'Middle Blocker', color: '#45B7D1' },
      'OPP': { full: 'Opposite', color: '#96CEB4' }, 'Opposite': { full: 'Opposite', color: '#96CEB4' }, 'Opposite/Right Side': { full: 'Opposite', color: '#96CEB4' },
      'L': { full: 'Libero', color: '#FFEAA7' }, 'Libero': { full: 'Libero', color: '#FFEAA7' }, 'Libero/DS': { full: 'Libero/DS', color: '#FFEAA7' },
      'DS': { full: 'Defensive Specialist', color: '#DDA0DD' }, 'Defensive Specialist': { full: 'Defensive Specialist', color: '#DDA0DD' },
      'RS': { full: 'Right Side', color: '#FF9F43' }, 'Right Side': { full: 'Right Side', color: '#FF9F43' },
    },
    primaryStats: [
      { key: 'kills', label: 'Kills', short: 'K', icon: '⚡', color: '#F59E0B' },
      { key: 'digs', label: 'Digs', short: 'D', icon: '💎', color: '#06B6D4' },
      { key: 'aces', label: 'Aces', short: 'A', icon: '🎯', color: '#EC4899' },
      { key: 'blocks', label: 'Blocks', short: 'B', icon: '🛡️', color: '#6366F1' },
      { key: 'assists', label: 'Assists', short: 'AST', icon: '🤝', color: '#10B981' },
    ],
    skills: ['serve', 'pass', 'attack', 'block', 'dig', 'set'],
    detailSections: [
      { title: 'Attacking', stats: [
        { key: 'hit_percentage', label: 'Hit %', format: 'pct3' },
        { key: 'attack_attempts', label: 'Attempts' },
        { key: 'attack_errors', label: 'Errors', color: 'text-red-400' },
      ]},
      { title: 'Passing & Defense', stats: [
        { key: 'pass_rating', label: 'Pass Rating' },
        { key: 'serve_receive_pct', label: 'Serve Rcv', format: 'pct' },
      ]},
    ],
    trends: [
      { key: 'kills', label: 'Kills Trend', color: '#F59E0B' },
      { key: 'digs', label: 'Digs Trend', color: '#06B6D4' },
    ],
    icon: '🏐',
  },
  basketball: {
    positions: {
      'PG': { full: 'Point Guard', color: '#FF6B6B' }, 'Point Guard': { full: 'Point Guard', color: '#FF6B6B' },
      'SG': { full: 'Shooting Guard', color: '#4ECDC4' }, 'Shooting Guard': { full: 'Shooting Guard', color: '#4ECDC4' },
      'SF': { full: 'Small Forward', color: '#45B7D1' }, 'Small Forward': { full: 'Small Forward', color: '#45B7D1' },
      'PF': { full: 'Power Forward', color: '#96CEB4' }, 'Power Forward': { full: 'Power Forward', color: '#96CEB4' },
      'C': { full: 'Center', color: '#FF9F43' }, 'Center': { full: 'Center', color: '#FF9F43' },
    },
    primaryStats: [
      { key: 'points', label: 'Points', short: 'PTS', icon: '🏀', color: '#F59E0B', calc: (s) => ((s.fgm || 0) - (s.three_pm || 0)) * 2 + (s.three_pm || 0) * 3 + (s.ftm || 0) },
      { key: 'rebounds', label: 'Rebounds', short: 'REB', icon: '📊', color: '#06B6D4' },
      { key: 'assists', label: 'Assists', short: 'AST', icon: '🤝', color: '#10B981' },
      { key: 'steals', label: 'Steals', short: 'STL', icon: '🖐️', color: '#8B5CF6' },
      { key: 'blocks', label: 'Blocks', short: 'BLK', icon: '🛡️', color: '#6366F1' },
    ],
    skills: ['shooting', 'passing', 'dribbling', 'rebounding', 'defense', 'speed'],
    detailSections: [
      { title: 'Shooting', stats: [
        { key: 'fg_pct', label: 'FG%', format: 'pct', calc: (s) => s.fga > 0 ? ((s.fgm / s.fga) * 100) : null },
        { key: 'three_pct', label: '3P%', format: 'pct', calc: (s) => s.three_pa > 0 ? ((s.three_pm / s.three_pa) * 100) : null },
        { key: 'ft_pct', label: 'FT%', format: 'pct', calc: (s) => s.fta > 0 ? ((s.ftm / s.fta) * 100) : null },
      ]},
      { title: 'Other', stats: [
        { key: 'turnovers', label: 'Turnovers', color: 'text-red-400' },
        { key: 'fouls', label: 'Fouls' },
      ]},
    ],
    trends: [
      { key: 'points', label: 'Points Trend', color: '#F59E0B' },
      { key: 'rebounds', label: 'Rebounds Trend', color: '#06B6D4' },
    ],
    icon: '🏀',
  },
  soccer: {
    positions: {
      'GK': { full: 'Goalkeeper', color: '#FFEAA7' }, 'Goalkeeper': { full: 'Goalkeeper', color: '#FFEAA7' },
      'Defender': { full: 'Defender', color: '#4ECDC4' }, 'Midfielder': { full: 'Midfielder', color: '#FF6B6B' },
      'Forward': { full: 'Forward', color: '#EF4444' },
    },
    primaryStats: [
      { key: 'goals', label: 'Goals', short: 'G', icon: '⚽', color: '#F59E0B' },
      { key: 'assists', label: 'Assists', short: 'A', icon: '🤝', color: '#10B981' },
      { key: 'shots', label: 'Shots', short: 'SH', icon: '🎯', color: '#06B6D4' },
      { key: 'saves', label: 'Saves', short: 'SV', icon: '🧤', color: '#8B5CF6' },
      { key: 'fouls', label: 'Fouls', short: 'F', icon: '🟡', color: '#EF4444' },
    ],
    skills: ['shooting', 'passing', 'dribbling', 'speed', 'defense', 'stamina'],
    detailSections: [
      { title: 'Attacking', stats: [
        { key: 'shot_pct', label: 'Shot %', format: 'pct', calc: (s) => s.shots > 0 ? ((s.goals / s.shots) * 100) : null },
        { key: 'shots_on_target', label: 'On Target' },
      ]},
      { title: 'Discipline', stats: [
        { key: 'yellow_cards', label: 'Yellows', color: 'text-amber-400' },
        { key: 'red_cards', label: 'Reds', color: 'text-red-400' },
      ]},
    ],
    trends: [
      { key: 'goals', label: 'Goals Trend', color: '#F59E0B' },
      { key: 'assists', label: 'Assists Trend', color: '#10B981' },
    ],
    icon: '⚽',
  },
  baseball: {
    positions: {
      'Pitcher': { full: 'Pitcher', color: '#FF6B6B' }, 'Catcher': { full: 'Catcher', color: '#4ECDC4' },
      'First Base': { full: 'First Base', color: '#45B7D1' }, 'Second Base': { full: 'Second Base', color: '#96CEB4' },
      'Shortstop': { full: 'Shortstop', color: '#DDA0DD' }, 'Third Base': { full: 'Third Base', color: '#FF9F43' },
      'Outfield': { full: 'Outfield', color: '#10B981' },
    },
    primaryStats: [
      { key: 'hits', label: 'Hits', short: 'H', icon: '⚾', color: '#F59E0B' },
      { key: 'runs', label: 'Runs', short: 'R', icon: '🏃', color: '#10B981' },
      { key: 'rbis', label: 'RBIs', short: 'RBI', icon: '📊', color: '#06B6D4' },
      { key: 'home_runs', label: 'HRs', short: 'HR', icon: '💪', color: '#EF4444' },
      { key: 'stolen_bases', label: 'SBs', short: 'SB', icon: '⚡', color: '#8B5CF6' },
    ],
    skills: ['hitting', 'fielding', 'throwing', 'speed', 'batting_eye', 'power'],
    detailSections: [
      { title: 'Batting', stats: [
        { key: 'batting_avg', label: 'AVG', format: 'avg', calc: (s) => s.at_bats > 0 ? (s.hits / s.at_bats) : null },
        { key: 'at_bats', label: 'AB' },
        { key: 'strikeouts', label: 'K', color: 'text-red-400' },
      ]},
      { title: 'On Base', stats: [
        { key: 'obp', label: 'OBP', format: 'avg', calc: (s) => (s.at_bats + (s.walks || 0)) > 0 ? ((s.hits + (s.walks || 0)) / (s.at_bats + (s.walks || 0))) : null },
        { key: 'walks', label: 'BB' },
      ]},
    ],
    trends: [
      { key: 'hits', label: 'Hits Trend', color: '#F59E0B' },
      { key: 'runs', label: 'Runs Trend', color: '#10B981' },
    ],
    icon: '⚾',
  },
  football: {
    positions: {
      'Quarterback': { full: 'Quarterback', color: '#FF6B6B' }, 'Running Back': { full: 'Running Back', color: '#4ECDC4' },
      'Wide Receiver': { full: 'Wide Receiver', color: '#45B7D1' }, 'Tight End': { full: 'Tight End', color: '#96CEB4' },
      'Offensive Line': { full: 'Offensive Line', color: '#FF9F43' }, 'Defensive Line': { full: 'Defensive Line', color: '#DDA0DD' },
      'Linebacker': { full: 'Linebacker', color: '#FFEAA7' }, 'Defensive Back': { full: 'Defensive Back', color: '#8B5CF6' },
      'Kicker': { full: 'Kicker', color: '#10B981' }, 'Rusher': { full: 'Rusher', color: '#EF4444' }, 'Center': { full: 'Center', color: '#FF9F43' },
    },
    primaryStats: [
      { key: 'passing_yards', label: 'Pass Yds', short: 'PY', icon: '🏈', color: '#F59E0B' },
      { key: 'rushing_yards', label: 'Rush Yds', short: 'RY', icon: '🏃', color: '#06B6D4' },
      { key: 'receiving_yards', label: 'Rec Yds', short: 'RCY', icon: '🙌', color: '#10B981' },
      { key: 'total_tds', label: 'TDs', short: 'TD', icon: '⚡', color: '#EF4444', calc: (s) => (s.passing_tds || 0) + (s.rushing_tds || 0) + (s.receiving_tds || 0) },
      { key: 'tackles', label: 'Tackles', short: 'TKL', icon: '🛡️', color: '#8B5CF6' },
    ],
    skills: ['arm_strength', 'speed', 'agility', 'catching', 'tackling', 'awareness'],
    detailSections: [
      { title: 'Passing', stats: [
        { key: 'comp_pct', label: 'Comp %', format: 'pct', calc: (s) => s.pass_attempts > 0 ? ((s.completions / s.pass_attempts) * 100) : null },
        { key: 'pass_attempts', label: 'Attempts' },
        { key: 'interceptions', label: 'INTs', color: 'text-red-400' },
      ]},
      { title: 'Rushing', stats: [
        { key: 'ypc', label: 'Yds/Carry', calc: (s) => s.rush_attempts > 0 ? (s.rushing_yards / s.rush_attempts).toFixed(1) : null },
        { key: 'rush_attempts', label: 'Carries' },
      ]},
    ],
    trends: [
      { key: 'passing_yards', label: 'Pass Yds Trend', color: '#F59E0B' },
      { key: 'rushing_yards', label: 'Rush Yds Trend', color: '#06B6D4' },
    ],
    icon: '🏈',
  },
  hockey: {
    positions: {
      'Goalie': { full: 'Goalie', color: '#FFEAA7' }, 'Defense': { full: 'Defense', color: '#4ECDC4' },
      'Center': { full: 'Center', color: '#96CEB4' }, 'Wing': { full: 'Wing', color: '#FF6B6B' },
    },
    primaryStats: [
      { key: 'goals', label: 'Goals', short: 'G', icon: '🏒', color: '#F59E0B' },
      { key: 'assists', label: 'Assists', short: 'A', icon: '🤝', color: '#10B981' },
      { key: 'shots', label: 'Shots', short: 'SH', icon: '🎯', color: '#06B6D4' },
      { key: 'saves', label: 'Saves', short: 'SV', icon: '🧤', color: '#8B5CF6' },
      { key: 'plus_minus', label: '+/-', short: '+/-', icon: '📊', color: '#EF4444' },
    ],
    skills: ['skating', 'shooting', 'passing', 'checking', 'defense', 'speed'],
    detailSections: [
      { title: 'Offense', stats: [
        { key: 'shot_pct', label: 'Shot %', format: 'pct', calc: (s) => s.shots > 0 ? ((s.goals / s.shots) * 100) : null },
        { key: 'power_play_goals', label: 'PP Goals' },
      ]},
      { title: 'Goaltending', stats: [
        { key: 'save_pct', label: 'Save %', format: 'pct', calc: (s) => s.shots_against > 0 ? ((s.saves / s.shots_against) * 100) : null },
        { key: 'shots_against', label: 'Shots Against' },
      ]},
    ],
    trends: [
      { key: 'goals', label: 'Goals Trend', color: '#F59E0B' },
      { key: 'assists', label: 'Assists Trend', color: '#10B981' },
    ],
    icon: '🏒',
  },
}

// Aliases
SPORT_DISPLAY['flag football'] = SPORT_DISPLAY.football
SPORT_DISPLAY['flagfootball'] = SPORT_DISPLAY.football
SPORT_DISPLAY['softball'] = { ...SPORT_DISPLAY.baseball, icon: '🥎' }

function getSportDisplay(sportName) {
  const key = (sportName || 'volleyball').toLowerCase().trim()
  return SPORT_DISPLAY[key] || SPORT_DISPLAY[key.replace(/\s+/g, '')] || SPORT_DISPLAY.volleyball
}

// ============================================
// BADGE DEFINITIONS
// ============================================
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
const rarityColors = { 'Common': '#6B7280', 'Uncommon': '#10B981', 'Rare': '#3B82F6', 'Epic': '#8B5CF6', 'Legendary': '#F59E0B' }

// ============================================
// SUB-COMPONENTS
// ============================================
function SkillBar({ label, value, maxValue = 100, isDark }) {
  const pct = Math.min((value / maxValue) * 100, 100)
  const displayLabel = label.replace(/_/g, ' ')
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs uppercase w-20 font-semibold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{displayLabel}</span>
      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }} />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{value || 0}</span>
    </div>
  )
}

function MiniBarChart({ data, color = '#F59E0B', label, isDark }) {
  const tc = useThemeClasses()
  const maxValue = Math.max(...(data || []).map(d => d.value), 1)
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-xl p-4 ${tc.cardBgAlt}`}>
        <span className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
        <div className="flex items-center justify-center h-16">
          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No data yet</span>
        </div>
      </div>
    )
  }
  return (
    <div className={`rounded-xl p-4 ${tc.cardBgAlt}`}>
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
  const rColor = rarityColors[badge.rarity] || '#6B7280'
  const sizeClasses = { sm: 'w-10 h-10 text-lg', md: 'w-14 h-14 text-2xl', lg: 'w-20 h-20 text-4xl' }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-xl flex items-center justify-center`}
        style={{ backgroundColor: `${badge.color}20`, border: `2px solid ${rColor}`, boxShadow: `0 0 20px ${rColor}40` }}>
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

function formatStatValue(value, format) {
  if (value === null || value === undefined) return '—'
  if (format === 'pct3') return value ? `.${Math.round(value * 1000)}` : '—'
  if (format === 'pct') return typeof value === 'number' ? `${Math.round(value)}%` : '—'
  if (format === 'avg') return typeof value === 'number' ? value.toFixed(3).replace(/^0/, '') : '—'
  return value
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
  const [sportName, setSportName] = useState('volleyball')

  useEffect(() => { if (playerId) loadAllData() }, [playerId])

  async function loadAllData() {
    setLoading(true)
    try { await Promise.all([loadPlayerData(), loadBadges(), loadRecentGames(), loadSkills()]) }
    catch (err) { console.error('Error loading player card data:', err) }
    setLoading(false)
  }

  async function loadPlayerData() {
    try {
      const { data: fullPlayer } = await supabase.from('players').select('*').eq('id', playerId).single()
      setPlayer(fullPlayer)
      const { data: teams } = await supabase
        .from('team_players')
        .select('*, teams(id, name, color, season_id, seasons(id, name, sports(name, icon)))')
        .eq('player_id', playerId)
      setTeamAssignments(teams || [])
      const sport = teams?.[0]?.teams?.seasons?.sports?.name || fullPlayer?.sport || 'volleyball'
      setSportName(sport)
      const sid = propSeasonId || fullPlayer?.season_id || teams?.[0]?.teams?.season_id
      if (sid) {
        const { data: stats } = await supabase.from('player_season_stats').select('*').eq('player_id', playerId).eq('season_id', sid).single()
        setSeasonStats(stats || null)
      }
    } catch (err) { console.error('Error loading player:', err) }
  }

  async function loadBadges() {
    try {
      const { data } = await supabase.from('player_badges').select('*').eq('player_id', playerId).order('earned_at', { ascending: false })
      setBadges(data || [])
      try { const { data: p } = await supabase.from('player_achievement_progress').select('*').eq('player_id', playerId); setBadgesInProgress(p || []) }
      catch { setBadgesInProgress([]) }
    } catch { setBadges([]) }
  }

  async function loadRecentGames() {
    try {
      const { data } = await supabase.from('game_player_stats').select('*, schedule_events(event_date, opponent_name, our_score, their_score)').eq('player_id', playerId).order('created_at', { ascending: false }).limit(10)
      setRecentGames(data || [])
    } catch { setRecentGames([]) }
  }

  async function loadSkills() {
    try { const { data } = await supabase.from('player_skills').select('*').eq('player_id', playerId).order('created_at', { ascending: false }).limit(1).single(); setSkills(data || null) }
    catch { setSkills(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" /></div>
  if (!player) return <div className="text-center py-12"><span className="text-6xl">😕</span><h2 className={`text-xl font-bold ${tc.text} mt-4`}>Player Not Found</h2></div>

  // ── Sport config ──
  const sc = getSportDisplay(sportName)
  const p = player
  const tp = teamAssignments[0]
  const posInfo = sc.positions[p.position] || { full: p.position || 'Player', color: '#F59E0B' }
  const posColor = posInfo.color
  const teamName = tp?.teams?.name || 'No Team'
  const teamColor = tp?.teams?.color || '#F59E0B'
  const seasonName = tp?.teams?.seasons?.name || ''
  const jerseyNumber = tp?.jersey_number || p.jersey_number

  // ── Skills ──
  const getSkillValue = (v) => (v == null) ? 0 : (v <= 10 ? v * 10 : v)
  const overallRating = (() => {
    if (!skills) return null
    const vals = sc.skills.map(s => skills[s]).filter(v => v != null)
    if (!vals.length) return null
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg)
  })()

  // ── Transform games ──
  const transformedGames = recentGames.map(g => {
    const game = {
      date: g.schedule_events?.event_date || g.game_date || null,
      opponent: g.schedule_events?.opponent_name || g.opponent_name || 'Unknown',
      result: (g.schedule_events?.our_score || g.our_score || 0) > (g.schedule_events?.their_score || g.their_score || 0) ? 'W' : 'L',
      score: `${g.schedule_events?.our_score || g.our_score || 0}-${g.schedule_events?.their_score || g.their_score || 0}`,
      raw: g,
      statValues: sc.primaryStats.map(stat => stat.calc ? stat.calc(g) : (g[stat.key] || 0)),
    }
    return game
  })

  // ── Per-game averages ──
  const gamesPlayed = seasonStats?.games_played || transformedGames.length || 0
  const perGameStats = gamesPlayed > 0 ? sc.primaryStats.map(stat => {
    let total = stat.calc
      ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0))
      : (seasonStats?.[stat.key] || transformedGames.reduce((s, g) => s + (g.raw[stat.key] || 0), 0))
    return { ...stat, value: (total / gamesPlayed).toFixed(1), total }
  }) : null

  // ── Trends ──
  const trends = sc.trends.map(t => ({
    ...t,
    data: transformedGames.length > 0
      ? transformedGames.slice(0, 6).reverse().map(g => {
          const calcFn = sc.primaryStats.find(s => s.key === t.key)?.calc
          return { value: calcFn ? calcFn(g.raw) : (g.raw[t.key] || 0) }
        })
      : []
  }))

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
          <div className="w-[280px] shrink-0 relative overflow-hidden">
            {p.photo_url ? (
              <>
                <img src={p.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to right, transparent 60%, rgba(15,23,42,0.8) 100%)' : 'linear-gradient(to right, transparent 60%, rgba(255,255,255,0.9) 100%)' }} />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: isDark ? `linear-gradient(135deg, ${posColor}40, #1e293b)` : `linear-gradient(135deg, ${posColor}30, #f1f5f9)` }}>
                <div className="text-center">
                  <span className="text-8xl font-black" style={{ color: posColor }}>{jerseyNumber || '?'}</span>
                  <p className={`text-sm font-bold mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{p.first_name?.[0]}{p.last_name?.[0]}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 p-6 flex flex-col justify-between relative">
            <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${posColor}${isDark ? '20' : '15'}, transparent 50%)` }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: teamColor, color: '#fff' }}>
                  {seasonName ? `${seasonName} ` : ''}{teamName}
                </span>
                {overallRating !== null && (
                  <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: posColor }}>
                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{overallRating}</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-black text-amber-400 uppercase tracking-tight">{p.first_name || 'Player'}</h1>
              <h2 className={`text-4xl font-black uppercase tracking-tight -mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.last_name || ''}</h2>
              <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{posInfo.full} <span className="mx-2">•</span> #{jerseyNumber || '—'}</p>
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
        {perGameStats && (
          <div className={`flex justify-around py-3 border-t ${tc.border} ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/80'}`}>
            {perGameStats.map(stat => (
              <div key={stat.key} className="text-center">
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</span>
                <p className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}/G</p>
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
              className={`flex-1 py-3.5 text-sm font-semibold transition ${activeTab === tab.id ? 'text-amber-500 border-b-2 border-amber-500' : `${tc.textMuted}`}`}
              style={activeTab === tab.id ? { borderColor: '#F59E0B' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ OVERVIEW ═══ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${tc.cardBgAlt}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Skills</h4>
                  {skills && sc.skills.some(s => skills[s] != null) ? (
                    <div className="space-y-3">{sc.skills.map(s => <SkillBar key={s} label={s} value={getSkillValue(skills[s])} isDark={isDark} />)}</div>
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No skill ratings yet</p>
                  )}
                </div>
                <div className={`rounded-xl p-4 ${tc.cardBgAlt}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Season Progress</h4>
                  {(seasonStats || gamesPlayed > 0) ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><span className="text-xs">✅</span></div>
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{seasonStats?.games_played || gamesPlayed} Games Played</span>
                      </div>
                      {sc.primaryStats.slice(0, 2).map(stat => {
                        const total = stat.calc ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0)) : (seasonStats?.[stat.key] || transformedGames.reduce((s, g) => s + (g.raw[stat.key] || 0), 0))
                        return (
                          <div key={stat.key} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}><span className="text-xs">{stat.icon}</span></div>
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{total} Total {stat.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No season stats yet</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${tc.cardBgAlt}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recent Games</h4>
                  {transformedGames.length > 0 ? transformedGames.slice(0, 3).map((game, i) => (
                    <div key={i} className={`flex items-center gap-2 py-2.5 last:border-0 border-b ${tc.border}`}>
                      <span className={`text-xs w-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{game.result}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{game.opponent}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.score}</p>
                      </div>
                      <div className="flex gap-2 text-xs font-bold">
                        {game.statValues.slice(0, 3).map((val, si) => <span key={si} style={{ color: sc.primaryStats[si]?.color }}>{val}</span>)}
                      </div>
                    </div>
                  )) : <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No games played yet</p>}
                </div>
                {trends[0] && <MiniBarChart data={trends[0].data} color={trends[0].color} label={trends[0].label} isDark={isDark} />}
              </div>
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${tc.cardBgAlt}`}>
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
                  ) : <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No badges earned yet</p>}
                  {badgesInProgress.length > 0 && (
                    <>
                      <h5 className={`text-xs uppercase mt-4 mb-2 font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>In Progress</h5>
                      {badgesInProgress.slice(0, 2).map((b, i) => (
                        <div key={i} className="flex items-center gap-3 py-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20` }}>{badgeDefinitions[b.badge_id]?.icon || '🏅'}</div>
                          <div className="flex-1">
                            <p className={`text-xs font-semibold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{badgeDefinitions[b.badge_id]?.name || b.badge_id}</p>
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
                {trends[1] && <MiniBarChart data={trends[1].data} color={trends[1].color} label={trends[1].label} isDark={isDark} />}
              </div>
            </div>
          )}

          {/* ═══ STATS ═══ */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className={`rounded-xl p-5 ${tc.cardBgAlt}`}>
                <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Season Totals</h4>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(sc.primaryStats.length + 1, 6)}, 1fr)` }}>
                  <div className="text-center">
                    <p className={`text-xs uppercase mb-1 flex items-center justify-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Games {sc.icon}</p>
                    <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{seasonStats?.games_played || transformedGames.length}</p>
                  </div>
                  {sc.primaryStats.map(stat => {
                    const val = stat.calc ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0)) : (seasonStats?.[stat.key] || 0)
                    return (
                      <div key={stat.key} className="text-center">
                        <p className={`text-xs uppercase mb-1 flex items-center justify-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label} <span>{stat.icon}</span></p>
                        <p className="text-3xl font-bold" style={{ color: stat.color }}>{val}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {sc.detailSections.map((section, si) => (
                  <div key={si} className={`rounded-xl p-5 ${tc.cardBgAlt}`}>
                    <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{section.title}</h4>
                    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(section.stats.length, 3)}, 1fr)` }}>
                      {section.stats.map(stat => {
                        const val = stat.calc && seasonStats ? stat.calc(seasonStats) : (seasonStats?.[stat.key] ?? null)
                        return (
                          <div key={stat.key}>
                            <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color || (isDark ? 'text-white' : 'text-slate-900')}`}>{formatStatValue(val, stat.format)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {perGameStats && (
                <div className={`rounded-xl p-5 ${tc.cardBgAlt}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Per Game Averages</h4>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sc.primaryStats.length}, 1fr)` }}>
                    {perGameStats.map(stat => (
                      <div key={stat.key}>
                        <p className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>per game</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {transformedGames.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {trends.map(t => <MiniBarChart key={t.key} data={t.data} color={t.color} label={t.label} isDark={isDark} />)}
                </div>
              )}
            </div>
          )}

          {/* ═══ BADGES ═══ */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className={`rounded-xl p-5 ${tc.cardBgAlt}`}>
                <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Earned ({badges.length})</h4>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-4 gap-6">
                    {badges.map((b, i) => <BadgeIcon key={i} badgeId={b.badge_id} size="lg" showLabel isDark={isDark} earnedDate={b.earned_at ? new Date(b.earned_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : null} />)}
                  </div>
                ) : <p className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No badges earned yet</p>}
              </div>
              {badgesInProgress.length > 0 && (
                <div className={`rounded-xl p-5 ${tc.cardBgAlt}`}>
                  <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>In Progress</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {badgesInProgress.map((b, i) => (
                      <div key={i} className={`flex items-center gap-4 rounded-xl p-4 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20` }}>{badgeDefinitions[b.badge_id]?.icon || '🏅'}</div>
                        <div className="flex-1">
                          <p className={`font-medium uppercase text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{badgeDefinitions[b.badge_id]?.name || b.badge_id}</p>
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
            <div className={`rounded-xl p-5 ${tc.cardBgAlt}`}>
              <h4 className={`text-xs uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Game Log</h4>
              {transformedGames.length > 0 ? (
                <>
                  <div className={`flex items-center gap-4 py-2 text-xs uppercase font-semibold border-b ${tc.border} ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="w-12">Date</span><span className="w-8"></span><span className="flex-1">Opponent</span>
                    <div className="flex gap-3 w-48 justify-end">
                      {sc.primaryStats.map(stat => <span key={stat.key} className="w-8 text-center">{stat.short}</span>)}
                    </div>
                  </div>
                  {transformedGames.map((game, i) => (
                    <div key={i} className={`flex items-center gap-4 py-3 border-b last:border-0 ${tc.border}`}>
                      <span className={`text-sm w-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{game.result}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{game.opponent}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{game.score}</p>
                      </div>
                      <div className="flex gap-3 w-48 justify-end text-sm font-bold">
                        {game.statValues.map((val, si) => <span key={si} className="w-8 text-center" style={{ color: sc.primaryStats[si]?.color }}>{val}</span>)}
                      </div>
                    </div>
                  ))}
                </>
              ) : <p className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No games played yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { ParentPlayerCardPage }
