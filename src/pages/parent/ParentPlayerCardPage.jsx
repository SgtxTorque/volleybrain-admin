import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import SpiderChart from '../../components/charts/SpiderChart'
import { Target, TrendingUp } from '../../constants/icons'
// badgeDefinitions removed — BadgesTab now uses V2 achievements system

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
      { key: 'kills', label: 'Kills', short: 'K', icon: '\u26A1', color: '#F59E0B' },
      { key: 'digs', label: 'Digs', short: 'D', icon: '\u{1F48E}', color: '#06B6D4' },
      { key: 'aces', label: 'Aces', short: 'A', icon: '\u{1F3AF}', color: '#EC4899' },
      { key: 'blocks', label: 'Blocks', short: 'B', icon: '\u{1F6E1}\uFE0F', color: '#6366F1' },
      { key: 'assists', label: 'Assists', short: 'AST', icon: '\u{1F91D}', color: '#10B981' },
    ],
    skills: ['serving', 'passing', 'hitting', 'blocking', 'defense', 'setting'],
    skillLabels: { serving: 'Serve', passing: 'Pass', hitting: 'Attack', blocking: 'Block', defense: 'Dig', setting: 'Set' },
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
    icon: '\u{1F3D0}',
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
      { key: 'points', label: 'Points', short: 'PTS', icon: '\u{1F3C0}', color: '#F59E0B', calc: (s) => ((s.fgm || 0) - (s.three_pm || 0)) * 2 + (s.three_pm || 0) * 3 + (s.ftm || 0) },
      { key: 'rebounds', label: 'Rebounds', short: 'REB', icon: '\u{1F4CA}', color: '#06B6D4' },
      { key: 'assists', label: 'Assists', short: 'AST', icon: '\u{1F91D}', color: '#10B981' },
      { key: 'steals', label: 'Steals', short: 'STL', icon: '\u{1F590}\uFE0F', color: '#8B5CF6' },
      { key: 'blocks', label: 'Blocks', short: 'BLK', icon: '\u{1F6E1}\uFE0F', color: '#6366F1' },
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
    icon: '\u{1F3C0}',
  },
  soccer: {
    positions: {
      'GK': { full: 'Goalkeeper', color: '#FFEAA7' }, 'Goalkeeper': { full: 'Goalkeeper', color: '#FFEAA7' },
      'Defender': { full: 'Defender', color: '#4ECDC4' }, 'Midfielder': { full: 'Midfielder', color: '#FF6B6B' },
      'Forward': { full: 'Forward', color: '#EF4444' },
    },
    primaryStats: [
      { key: 'goals', label: 'Goals', short: 'G', icon: '\u26BD', color: '#F59E0B' },
      { key: 'assists', label: 'Assists', short: 'A', icon: '\u{1F91D}', color: '#10B981' },
      { key: 'shots', label: 'Shots', short: 'SH', icon: '\u{1F3AF}', color: '#06B6D4' },
      { key: 'saves', label: 'Saves', short: 'SV', icon: '\u{1F9E4}', color: '#8B5CF6' },
      { key: 'fouls', label: 'Fouls', short: 'F', icon: '\u{1F7E1}', color: '#EF4444' },
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
    icon: '\u26BD',
  },
  baseball: {
    positions: {
      'Pitcher': { full: 'Pitcher', color: '#FF6B6B' }, 'Catcher': { full: 'Catcher', color: '#4ECDC4' },
      'First Base': { full: 'First Base', color: '#45B7D1' }, 'Second Base': { full: 'Second Base', color: '#96CEB4' },
      'Shortstop': { full: 'Shortstop', color: '#DDA0DD' }, 'Third Base': { full: 'Third Base', color: '#FF9F43' },
      'Outfield': { full: 'Outfield', color: '#10B981' },
    },
    primaryStats: [
      { key: 'hits', label: 'Hits', short: 'H', icon: '\u26BE', color: '#F59E0B' },
      { key: 'runs', label: 'Runs', short: 'R', icon: '\u{1F3C3}', color: '#10B981' },
      { key: 'rbis', label: 'RBIs', short: 'RBI', icon: '\u{1F4CA}', color: '#06B6D4' },
      { key: 'home_runs', label: 'HRs', short: 'HR', icon: '\u{1F4AA}', color: '#EF4444' },
      { key: 'stolen_bases', label: 'SBs', short: 'SB', icon: '\u26A1', color: '#8B5CF6' },
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
    icon: '\u26BE',
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
      { key: 'passing_yards', label: 'Pass Yds', short: 'PY', icon: '\u{1F3C8}', color: '#F59E0B' },
      { key: 'rushing_yards', label: 'Rush Yds', short: 'RY', icon: '\u{1F3C3}', color: '#06B6D4' },
      { key: 'receiving_yards', label: 'Rec Yds', short: 'RCY', icon: '\u{1F64C}', color: '#10B981' },
      { key: 'total_tds', label: 'TDs', short: 'TD', icon: '\u26A1', color: '#EF4444', calc: (s) => (s.passing_tds || 0) + (s.rushing_tds || 0) + (s.receiving_tds || 0) },
      { key: 'tackles', label: 'Tackles', short: 'TKL', icon: '\u{1F6E1}\uFE0F', color: '#8B5CF6' },
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
    icon: '\u{1F3C8}',
  },
  hockey: {
    positions: {
      'Goalie': { full: 'Goalie', color: '#FFEAA7' }, 'Defense': { full: 'Defense', color: '#4ECDC4' },
      'Center': { full: 'Center', color: '#96CEB4' }, 'Wing': { full: 'Wing', color: '#FF6B6B' },
    },
    primaryStats: [
      { key: 'goals', label: 'Goals', short: 'G', icon: '\u{1F3D2}', color: '#F59E0B' },
      { key: 'assists', label: 'Assists', short: 'A', icon: '\u{1F91D}', color: '#10B981' },
      { key: 'shots', label: 'Shots', short: 'SH', icon: '\u{1F3AF}', color: '#06B6D4' },
      { key: 'saves', label: 'Saves', short: 'SV', icon: '\u{1F9E4}', color: '#8B5CF6' },
      { key: 'plus_minus', label: '+/-', short: '+/-', icon: '\u{1F4CA}', color: '#EF4444' },
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
    icon: '\u{1F3D2}',
  },
}

// Aliases
SPORT_DISPLAY['flag football'] = SPORT_DISPLAY.football
SPORT_DISPLAY['flagfootball'] = SPORT_DISPLAY.football
SPORT_DISPLAY['softball'] = { ...SPORT_DISPLAY.baseball, icon: '\u{1F94E}' }

function getSportDisplay(sportName) {
  const key = (sportName || 'volleyball').toLowerCase().trim()
  return SPORT_DISPLAY[key] || SPORT_DISPLAY[key.replace(/\s+/g, '')] || SPORT_DISPLAY.volleyball
}

// ============================================
// MAIN COMPONENT
// ============================================
function ParentPlayerCardPage({ playerId, roleContext, showToast, seasonId: propSeasonId, activeView }) {
  const { isDark } = useTheme()
  const isCoachOrAdmin = activeView === 'coach' || activeView === 'admin'

  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState(null)
  const [teamAssignments, setTeamAssignments] = useState([])
  const [seasonStats, setSeasonStats] = useState(null)
  const [recentGames, setRecentGames] = useState([])
  const [badges, setBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])
  const [skills, setSkills] = useState(null)
  const [sportName, setSportName] = useState('')
  const [evalHistory, setEvalHistory] = useState([])
  const [coachFeedback, setCoachFeedback] = useState([])
  const [playerGoals, setPlayerGoals] = useState([])
  const [shoutouts, setShoutouts] = useState([])
  const [challenges, setChallenges] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { if (playerId) loadAllData() }, [playerId])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([loadPlayerData(), loadBadges(), loadRecentGames(), loadSkills(), loadDevelopmentData(), loadEngagement()])
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
        .select('*, teams(id, name, color, season_id, seasons(id, name, sports(name, icon)))')
        .eq('player_id', playerId)
      setTeamAssignments(teams || [])
      const sport = teams?.[0]?.teams?.seasons?.sports?.name || fullPlayer?.sport || ''
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
      // V2: Query achievements catalog + player's earned achievements
      const [achResult, earnedResult, progressResult] = await Promise.all([
        supabase.from('achievements').select('*').eq('is_active', true).order('display_order'),
        supabase.from('player_achievements').select('achievement_id, earned_at, stat_value_at_unlock').eq('player_id', playerId),
        supabase.from('player_achievement_progress').select('achievement_id, current_value, target_value').eq('player_id', playerId),
      ])
      const allAchievements = achResult.data || []
      const earnedList = earnedResult.data || []
      const progressList = progressResult.data || []

      const earnedSet = new Set(earnedList.map(e => e.achievement_id))
      const earnedMap = Object.fromEntries(earnedList.map(e => [e.achievement_id, e]))
      const progressMap = Object.fromEntries(progressList.map(p => [p.achievement_id, p]))

      const earned = allAchievements.filter(a => earnedSet.has(a.id)).map(a => ({ ...a, _earned: earnedMap[a.id] }))
      const inProgress = allAchievements.filter(a => !earnedSet.has(a.id)).map(a => ({ ...a, _progress: progressMap[a.id] || null }))

      setBadges(earned)
      setBadgesInProgress(inProgress)
    } catch (err) {
      console.error('Error loading V2 badges:', err)
      setBadges([])
      setBadgesInProgress([])
    }
  }

  async function loadRecentGames() {
    try {
      // Try with explicit FK first
      const { data, error } = await supabase
        .from('game_player_stats')
        .select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) {
        // Fallback: try without explicit FK name
        console.warn('game_player_stats FK join failed, trying implicit:', error.message)
        const { data: fallbackData } = await supabase
          .from('game_player_stats')
          .select('*')
          .eq('player_id', playerId)
          .limit(10)
        setRecentGames(fallbackData || [])
      } else {
        setRecentGames(data || [])
      }
    } catch (err) {
      console.warn('Game stats query failed:', err?.message)
      setRecentGames([])
    }
  }

  async function loadSkills() {
    try {
      const { data, error } = await supabase
        .from('player_skills')
        .select('*')
        .eq('player_id', playerId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()
      if (error) console.warn('player_skills query:', error.message)
      setSkills(data || null)
    } catch (err) {
      console.warn('player_skills load error:', err)
      setSkills(null)
    }
  }

  async function loadDevelopmentData() {
    try {
      const { data: evals } = await supabase
        .from('player_evaluations')
        .select('evaluation_date, evaluation_type, overall_score, skills')
        .eq('player_id', playerId)
        .order('evaluation_date', { ascending: true })
      setEvalHistory(evals || [])

      const { data: feedback } = await supabase
        .from('player_coach_notes')
        .select('content, note_type, created_at')
        .eq('player_id', playerId)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(10)
      setCoachFeedback(feedback || [])

      const { data: goals } = await supabase
        .from('player_goals')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
      setPlayerGoals(goals || [])
    } catch (err) {
      console.error('Error loading development data:', err)
    }
  }

  async function loadEngagement() {
    try {
      const { data: shoutoutData } = await supabase
        .from('shoutouts')
        .select('*')
        .eq('receiver_id', playerId)
        .order('created_at', { ascending: false })
        .limit(5)
      setShoutouts(shoutoutData || [])
    } catch (err) {
      console.warn('Shoutouts query failed:', err?.message)
      setShoutouts([])
    }
    try {
      const { data: challengeData } = await supabase
        .from('challenge_participants')
        .select('*, challenge:coach_challenges(*)')
        .eq('player_id', playerId)
        .order('opted_in_at', { ascending: false })
      setChallenges(challengeData || [])
    } catch (err) {
      console.warn('Challenges query failed:', err?.message)
      setChallenges([])
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Not found state
  if (!player) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">?</span>
        </div>
        <h2 className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-4`}>Player Not Found</h2>
      </div>
    )
  }

  // Computed values
  const sc = getSportDisplay(sportName)
  const p = player
  const tp = teamAssignments[0]
  const posInfo = sc.positions[p.position] || { full: p.position || 'Player', color: '#F59E0B' }
  const posColor = posInfo.color
  const teamName = tp?.teams?.name || 'No Team'
  const teamColor = tp?.teams?.color || '#F59E0B'
  const seasonName = tp?.teams?.seasons?.name || ''
  const jerseyNumber = tp?.jersey_number || p.jersey_number

  const getSkillValue = (v) => (v == null) ? 0 : (v <= 10 ? v * 10 : v)
  const overallRating = (() => {
    if (!skills) return null
    const vals = sc.skills.map(s => skills[s]).filter(v => v != null)
    if (!vals.length) return null
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return avg <= 10 ? Math.round(avg * 10) : Math.round(avg)
  })()

  const transformedGames = recentGames.map(g => ({
    date: g.schedule_events?.event_date || g.game_date || null,
    opponent: g.schedule_events?.opponent_name || g.opponent_name || 'Unknown',
    result: (g.schedule_events?.our_score || g.our_score || 0) > (g.schedule_events?.their_score || g.their_score || 0) ? 'W' : 'L',
    score: `${g.schedule_events?.our_score || g.our_score || 0}-${g.schedule_events?.their_score || g.their_score || 0}`,
    raw: g,
    statValues: sc.primaryStats.map(stat => stat.calc ? stat.calc(g) : (g[stat.key] || 0)),
  }))

  const gamesPlayed = seasonStats?.games_played || transformedGames.length || 0
  const perGameStats = gamesPlayed > 0 ? sc.primaryStats.map(stat => {
    let total = stat.calc
      ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0))
      : (seasonStats?.[stat.key] || transformedGames.reduce((s, g) => s + (g.raw[stat.key] || 0), 0))
    return { ...stat, value: (total / gamesPlayed).toFixed(1), total }
  }) : null

  const trends = sc.trends.map(t => ({
    ...t,
    data: transformedGames.length > 0
      ? transformedGames.slice(0, 6).reverse().map(g => {
          const calcFn = sc.primaryStats.find(s => s.key === t.key)?.calc
          return { value: calcFn ? calcFn(g.raw) : (g.raw[t.key] || 0) }
        })
      : []
  }))

  const TABS = [
    { id: 'overview', label: 'Overview' }, { id: 'stats', label: 'Stats' },
    { id: 'development', label: 'Development' }, { id: 'badges', label: 'Badges' }, { id: 'games', label: 'Games' },
  ]

  // OVR color
  const ovrColor = overallRating >= 80 ? '#22C55E' : overallRating >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex" style={{ height: 'calc(100vh - var(--v2-topbar-height, 56px))', fontFamily: 'var(--v2-font, inherit)' }}>
      {/* ═══════ LEFT COLUMN — IDENTITY CARD ═══════ */}
      <div className="w-[380px] flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: 'linear-gradient(180deg, #0B1628 0%, #162D50 100%)' }}>
        {/* Photo */}
        <div className="relative w-full" style={{ minHeight: 280 }}>
          {p.photo_url ? (
            <>
              <img src={p.photo_url} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0B1628 0%, transparent 50%)' }} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${posColor}30, #0B1628)` }}>
              <div className="text-center">
                <span className="text-8xl font-black" style={{ color: posColor }}>{jerseyNumber || '?'}</span>
                <p className="text-lg font-bold mt-2 text-slate-400">{p.first_name?.[0]}{p.last_name?.[0]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Name + Info */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: teamColor, color: '#fff' }}>
              {seasonName ? `${seasonName} ` : ''}{teamName}
            </span>
            {overallRating !== null && (
              <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center" style={{ borderColor: ovrColor, boxShadow: `0 0 16px ${ovrColor}30` }}>
                <span className="text-lg font-extrabold" style={{ color: ovrColor }}>{overallRating}</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-extrabold uppercase" style={{ color: '#FFD700', letterSpacing: '-0.03em' }}>
            {p.first_name || 'Player'}
          </h1>
          <h2 className="text-3xl font-extrabold uppercase -mt-1 text-white" style={{ letterSpacing: '-0.03em' }}>
            {p.last_name || ''}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {posInfo.full} <span className="mx-2">&bull;</span> #{jerseyNumber || '-'}
          </p>

          {/* Per-game stats */}
          {perGameStats && (
            <div className="grid grid-cols-3 gap-3 mt-5">
              {perGameStats.slice(0, 3).map(stat => (
                <div key={stat.key} className="text-center rounded-xl py-3 px-2" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>{stat.value}</span>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{stat.label}/G</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Bars */}
        <div className="px-6 mt-6 pb-6 flex-1">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-3">Skill Ratings</h4>
          {skills && sc.skills.some(s => skills[s] != null) ? (
            <div className="space-y-2.5">
              {sc.skills.map(s => {
                const val = getSkillValue(skills[s])
                return (
                  <div key={s} className="flex items-center gap-2.5">
                    <span className="text-[10px] uppercase w-16 font-bold tracking-wider text-slate-500 truncate">{sc.skillLabels?.[s] || s}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, backgroundColor: '#4BB9EC' }} />
                    </div>
                    <span className="text-sm font-extrabold text-white w-7 text-right" style={{ letterSpacing: '-0.03em' }}>{val || 0}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <Target className="w-7 h-7 text-[#4BB9EC] mb-2" />
              <p className="text-xs text-slate-500">Skills not rated yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ RIGHT COLUMN — TABS ═══════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB]">
        {/* Tab bar */}
        <div className="flex border-b border-[#E8ECF2] bg-white flex-shrink-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all duration-200 ${activeTab === tab.id ? 'bg-[#4BB9EC]/10 text-[#4BB9EC] border-b-2 border-[#4BB9EC]' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab sc={sc} skills={skills} getSkillValue={getSkillValue} seasonStats={seasonStats} gamesPlayed={gamesPlayed} transformedGames={transformedGames} perGameStats={perGameStats} trends={trends} badges={badges} badgesInProgress={badgesInProgress} overallRating={overallRating} />}
          {activeTab === 'stats' && <StatsTab sc={sc} seasonStats={seasonStats} gamesPlayed={gamesPlayed} transformedGames={transformedGames} perGameStats={perGameStats} trends={trends} skills={skills} evalHistory={evalHistory} />}
          {activeTab === 'development' && <DevelopmentTab sc={sc} skills={skills} getSkillValue={getSkillValue} evalHistory={evalHistory} coachFeedback={coachFeedback} playerGoals={playerGoals} transformedGames={transformedGames} seasonStats={seasonStats} gamesPlayed={gamesPlayed} isCoachOrAdmin={isCoachOrAdmin} showToast={showToast} />}
          {activeTab === 'badges' && <BadgesTab badges={badges} badgesInProgress={badgesInProgress} shoutouts={shoutouts} challenges={challenges} />}
          {activeTab === 'games' && <GamesTab sc={sc} transformedGames={transformedGames} seasonStats={seasonStats} gamesPlayed={gamesPlayed} seasonName={seasonName} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// HELPER SUB-COMPONENTS
// ═══════════════════════════════════════════════
function formatStatValue(value, format) {
  if (value === null || value === undefined) return '-'
  if (format === 'pct3') return value ? `.${Math.round(value * 1000)}` : '-'
  if (format === 'pct') return typeof value === 'number' ? `${Math.round(value)}%` : '-'
  if (format === 'avg') return typeof value === 'number' ? value.toFixed(3).replace(/^0/, '') : '-'
  return value
}

function MiniBarChart({ data, color = '#F59E0B', label }) {
  const maxValue = Math.max(...(data || []).map(d => d.value), 1)
  if (!data || data.length === 0) return (
    <div className="rounded-xl p-4 bg-white border border-[#E8ECF2]">
      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">{label}</span>
      <div className="flex items-center justify-center h-16"><span className="text-sm text-slate-400">No data yet</span></div>
    </div>
  )
  return (
    <div className="rounded-xl p-4 bg-white border border-[#E8ECF2]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">{label}</span>
        <span className="text-xs text-slate-400">Last {data.length} games</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t transition-all" style={{ height: `${(d.value / maxValue) * 100}%`, backgroundColor: color, minHeight: '4px' }} />
            <span className="text-[10px] text-slate-400">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════
function OverviewTab({ sc, skills, getSkillValue, seasonStats, gamesPlayed, transformedGames, perGameStats, trends, badges, badgesInProgress, overallRating }) {
  return (
    <div className="space-y-5">
      {/* Season Progress Tiles */}
      {perGameStats && (
        <div className="grid grid-cols-4 gap-3">
          {perGameStats.slice(0, 4).map(stat => (
            <div key={stat.key} className="bg-white rounded-xl border border-[#E8ECF2] p-4 text-center">
              <span className="text-2xl font-extrabold text-[#10284C]" style={{ letterSpacing: '-0.03em' }}>{stat.value}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{stat.label}/G</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Games */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Recent Games</h4>
        {transformedGames.length > 0 ? transformedGames.slice(0, 3).map((game, i) => (
          <div key={i} className={`flex items-center gap-3 py-3 ${i < 2 ? 'border-b border-[#E8ECF2]' : ''}`}>
            <span className="text-xs w-12 text-slate-400">{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{game.result}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#10284C] truncate">{game.opponent}</p>
              <p className="text-xs text-slate-400">{game.score}</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">{game.statValues.slice(0, 3).map((val, si) => <span key={si} style={{ color: sc.primaryStats[si]?.color }}>{val}</span>)}</div>
          </div>
        )) : <p className="text-sm text-center py-4 text-slate-400">No games played yet</p>}
      </div>

      {/* Elite Specialty + Status */}
      <div className="grid grid-cols-3 gap-3">
        {/* Elite Specialty Card */}
        <div className="col-span-2 rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0B1628, #1E3A5F)' }}>
          <p className="text-[10px] uppercase tracking-wider font-bold text-sky-400 mb-2">Elite Specialty</p>
          {(() => {
            if (!perGameStats || perGameStats.length === 0) return <p className="text-sm text-slate-400">Play more games to unlock your specialty</p>
            const top = [...perGameStats].sort((a, b) => parseFloat(b.value) - parseFloat(a.value))[0]
            const titles = { kills: 'Offensive Weapon', digs: 'Defensive Anchor', aces: 'Serving Machine', blocks: 'Wall of Steel', assists: 'Floor General', points: 'Scoring Machine', rebounds: 'Board Crasher', steals: 'Ball Hawk', goals: 'Goal Machine', shots: 'Sharpshooter', hits: 'Contact Hitter', tackles: 'Defensive Force' }
            const title = titles[top.key] || `${top.label} Specialist`
            return (
              <>
                <h3 className="text-xl font-extrabold uppercase" style={{ letterSpacing: '-0.02em' }}>{title}</h3>
                <p className="text-sm text-slate-300 mt-2">Averaging {top.value} {top.label.toLowerCase()} per game this season. {top.total > 0 ? `${top.total} total across ${gamesPlayed} games.` : ''}</p>
              </>
            )
          })()}
        </div>

        {/* Status Cards */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-[#E8ECF2] p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Badges</p>
            <span className="text-2xl font-extrabold text-[#10284C]">{badges.length}</span>
            <p className="text-[10px] text-slate-400">earned</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E8ECF2] p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Rating Tier</p>
            <span className="text-lg font-extrabold" style={{ color: overallRating >= 80 ? '#22C55E' : overallRating >= 50 ? '#F59E0B' : '#EF4444' }}>
              {overallRating ? (overallRating >= 80 ? 'Elite' : overallRating >= 60 ? 'Pro' : overallRating >= 40 ? 'Rising' : 'Prospect') : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Trends */}
      {trends.length > 0 && trends[0].data.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {trends.map(t => <MiniBarChart key={t.key} data={t.data} color={t.color} label={t.label} />)}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// TAB: STATS
// ═══════════════════════════════════════════════
function StatsTab({ sc, seasonStats, gamesPlayed, transformedGames, perGameStats, trends, skills, evalHistory }) {
  const [gameFilter, setGameFilter] = useState('')
  const [gameSort, setGameSort] = useState('desc')

  return (
    <div className="space-y-5">
      {/* Season Totals */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Season Totals</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(sc.primaryStats.length + 1, 6)}, 1fr)` }}>
          <div className="text-center">
            <p className="text-xs uppercase mb-1 text-slate-400">Games {sc.icon}</p>
            <p className="text-3xl font-bold text-[#10284C]">{seasonStats?.games_played || transformedGames.length}</p>
          </div>
          {sc.primaryStats.map(stat => {
            const val = stat.calc ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0)) : (seasonStats?.[stat.key] || 0)
            return <div key={stat.key} className="text-center"><p className="text-xs uppercase mb-1 text-slate-400">{stat.label} <span>{stat.icon}</span></p><p className="text-3xl font-bold" style={{ color: stat.color }}>{val}</p></div>
          })}
        </div>
      </div>

      {/* Spider Graph + Phase Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E8ECF2] p-5 flex flex-col items-center">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 self-start">Skill Radar</h4>
          {skills && sc.skills.some(s => skills[s] != null) ? (
            <>
              <SpiderChart
                data={sc.skills.map(s => ({ label: sc.skillLabels?.[s] || s, value: skills[s] || 0 }))}
                compareData={evalHistory.length >= 2 ? (() => {
                  const first = evalHistory[0]
                  const s = typeof first.skills === 'string' ? JSON.parse(first.skills) : first.skills
                  if (!s) return undefined
                  return sc.skills.map(sk => ({ label: sc.skillLabels?.[sk] || sk, value: s[sk] || 0 }))
                })() : undefined}
                maxValue={10} size={220} color="#4BB9EC" compareColor="#94A3B8" isDark={false}
              />
              {evalHistory.length >= 2 && (
                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#4BB9EC] rounded inline-block" /> Current</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-400 rounded inline-block" /> Baseline</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <Target className="w-8 h-8 text-[#4BB9EC] mx-auto mb-2" />
              <p className="text-xs text-slate-400">Skills not rated yet</p>
            </div>
          )}
        </div>

        {sc.detailSections.map((section, si) => (
          <div key={si} className="bg-white rounded-xl border border-[#E8ECF2] p-5">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">{section.title}</h4>
            <div className="space-y-4">
              {section.stats.map(stat => {
                const val = stat.calc && seasonStats ? stat.calc(seasonStats) : (seasonStats?.[stat.key] ?? null)
                return (
                  <div key={stat.key}>
                    <p className="text-xs uppercase text-slate-400 mb-0.5">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color || 'text-[#10284C]'}`}>{formatStatValue(val, stat.format)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Per Game Averages */}
      {perGameStats && (
        <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Per Game Averages</h4>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sc.primaryStats.length}, 1fr)` }}>
            {perGameStats.map(stat => <div key={stat.key}><p className="text-xs uppercase mb-1 text-slate-400">{stat.label}</p><p className="text-2xl font-bold text-[#10284C]">{stat.value}</p><p className="text-xs text-slate-400">per game</p></div>)}
          </div>
        </div>
      )}

      {/* Game-by-Game Breakdown */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Game-by-Game Breakdown</h4>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search opponent..." value={gameFilter} onChange={e => setGameFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-[#E8ECF2] rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#4BB9EC]" />
            <button onClick={() => setGameSort(s => s === 'desc' ? 'asc' : 'desc')} className="px-2.5 py-1.5 text-xs border border-[#E8ECF2] rounded-lg text-slate-500 hover:text-slate-700">
              {gameSort === 'desc' ? 'Latest' : 'Oldest'}
            </button>
          </div>
        </div>
        {(() => {
          let games = [...transformedGames]
          if (gameFilter) games = games.filter(g => g.opponent.toLowerCase().includes(gameFilter.toLowerCase()))
          if (gameSort === 'asc') games = games.reverse()
          return games.length > 0 ? (
            <>
              <div className="flex items-center gap-4 py-2 text-[10px] uppercase font-bold border-b border-[#E8ECF2] text-slate-400">
                <span className="w-14">Date</span><span className="w-8"></span><span className="flex-1">Opponent</span>
                <div className="flex gap-3 w-48 justify-end">{sc.primaryStats.map(stat => <span key={stat.key} className="w-8 text-center">{stat.short}</span>)}</div>
              </div>
              {games.map((game, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0 border-[#E8ECF2]">
                  <span className="text-xs w-14 text-slate-400">{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{game.result}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#10284C]">{game.opponent}</p><p className="text-xs text-slate-400">{game.score}</p></div>
                  <div className="flex gap-3 w-48 justify-end text-sm font-bold">{game.statValues.map((val, si) => <span key={si} className="w-8 text-center" style={{ color: sc.primaryStats[si]?.color }}>{val}</span>)}</div>
                </div>
              ))}
            </>
          ) : <p className="text-sm text-center py-4 text-slate-400">{gameFilter ? 'No matching games' : 'No games played yet'}</p>
        })()}
      </div>

      {/* Trends */}
      {trends.length > 0 && trends[0].data.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {trends.map(t => <MiniBarChart key={t.key} data={t.data} color={t.color} label={t.label} />)}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// TAB: DEVELOPMENT
// ═══════════════════════════════════════════════
function DevelopmentTab({ sc, skills, getSkillValue, evalHistory, coachFeedback, playerGoals, transformedGames, seasonStats, gamesPlayed, isCoachOrAdmin, showToast }) {
  const parseSkills = (ev) => {
    const s = typeof ev.skills === 'string' ? JSON.parse(ev.skills) : ev.skills
    if (!s) return []
    return Object.entries(s).filter(([, v]) => v != null).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), value: typeof v === 'number' ? (v <= 10 ? v : v / 10) : 0 }))
  }

  // Growth trajectory
  const growthPct = (() => {
    if (evalHistory.length < 2) return null
    const first = parseSkills(evalHistory[0])
    const last = parseSkills(evalHistory[evalHistory.length - 1])
    if (!first.length || !last.length) return null
    const avgFirst = first.reduce((s, d) => s + d.value, 0) / first.length
    const avgLast = last.reduce((s, d) => s + d.value, 0) / last.length
    if (avgFirst === 0) return null
    return Math.round(((avgLast - avgFirst) / avgFirst) * 100)
  })()

  // Last game performance spider data
  const lastGame = transformedGames?.[0]
  const gameSpiderData = (() => {
    if (!lastGame || !seasonStats) return []
    return sc.primaryStats.map(stat => {
      const gameVal = stat.calc ? stat.calc(lastGame.raw) : (lastGame.raw[stat.key] || 0)
      const seasonTotal = stat.calc ? stat.calc(seasonStats) : (seasonStats[stat.key] || 0)
      const gp = seasonStats.games_played || 1
      const seasonAvg = seasonTotal / gp
      const normalized = seasonAvg > 0 ? Math.min(10, Math.max(0, (gameVal / seasonAvg) * 5)) : (gameVal > 0 ? 7 : 0)
      return { label: stat.short || stat.label, value: normalized }
    })
  })()

  return (
    <div className="space-y-5">
      {/* Side-by-side spider charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Skill Progression — Chart Left, Eval Timeline Right */}
        <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Skill Progression</h4>
            {growthPct !== null && <span className={`text-xs font-bold ${growthPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{growthPct >= 0 ? '+' : ''}{growthPct}% Growth</span>}
          </div>

          <div className="flex gap-6">
            {/* LEFT — Spider Chart */}
            <div className="flex flex-col items-center flex-shrink-0">
              {evalHistory.length >= 2 ? (() => {
                const latest = evalHistory[evalHistory.length - 1]
                const earliest = evalHistory[0]
                const latestData = parseSkills(latest)
                const earliestData = parseSkills(earliest)
                return latestData.length >= 3 ? (
                  <>
                    <SpiderChart data={latestData} compareData={earliestData.length === latestData.length ? earliestData : undefined} maxValue={10} size={280} color="#4BB9EC" compareColor="#F59E0B" isDark={false} />
                    <div className="flex items-center gap-3 mt-4">
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4BB9EC]/10 border border-[#4BB9EC]/30">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4BB9EC]" />
                        <span className="text-xs font-semibold text-[#4BB9EC]">Latest: {new Date(latest.evaluation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                        <span className="text-xs font-semibold text-[#F59E0B]">Baseline: {new Date(earliest.evaluation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </span>
                    </div>
                  </>
                ) : <p className="text-center py-4 text-slate-400 text-sm">Not enough skill data to chart</p>
              })() : evalHistory.length === 1 ? (
                <>
                  {(() => { const chartData = parseSkills(evalHistory[0]); return chartData.length >= 3 ? <SpiderChart data={chartData} maxValue={10} size={280} color="#4BB9EC" isDark={false} /> : null })()}
                  <p className="text-xs mt-2 text-slate-400">One evaluation so far. Comparison shows after the next.</p>
                </>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <TrendingUp className="w-8 h-8 text-[#4BB9EC] mb-2" />
                  <p className="text-sm font-semibold text-[#10284C]">No evaluations yet</p>
                  <p className="text-xs mt-1 text-slate-400">Skill progression appears once your coach evaluates skills.</p>
                </div>
              )}
              {isCoachOrAdmin && (
                <button onClick={() => showToast?.('Evaluation workflow coming soon', 'info')}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#10284C] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition">
                  Evaluate Player
                </button>
              )}
            </div>

            {/* RIGHT — Evaluation Timeline */}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">Evaluation History</h5>
              {evalHistory.length > 0 ? (
                <div className="space-y-0">
                  {evalHistory.slice(-6).reverse().map((ev, i) => (
                    <div key={i} className={`flex items-center gap-3 py-2.5 ${i < Math.min(evalHistory.length, 6) - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[#4BB9EC]' : 'bg-slate-300'}`} />
                      <span className="text-xs text-slate-400 w-24 flex-shrink-0">
                        {new Date(ev.evaluation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {(ev.evaluation_type || 'Eval').replace(/_/g, ' ')}
                      </span>
                      {ev.overall_score != null && (
                        <span className="text-sm font-bold text-[#10284C] ml-auto">
                          {typeof ev.overall_score === 'number' ? ev.overall_score.toFixed(1) : ev.overall_score}/10
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4">No evaluations recorded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Last Game Performance — Chart Left, Stat Table Right */}
        {lastGame && gameSpiderData.length >= 3 && (
          <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Last Game Performance</h4>
              <span className="text-xs font-semibold text-slate-500">vs {lastGame.opponent} &bull; {lastGame.result} {lastGame.score}</span>
            </div>

            <div className="flex gap-6">
              {/* LEFT — Spider Chart */}
              <div className="flex flex-col items-center flex-shrink-0">
                <SpiderChart data={gameSpiderData} maxValue={10} size={280} color="#10B981" isDark={false} />
                <div className="flex items-center gap-3 mt-4">
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-xs font-semibold text-[#10B981]">Game output</span>
                  </span>
                  <span className="text-xs text-slate-400">5.0 = season avg</span>
                </div>
              </div>

              {/* RIGHT — Game Stat Table */}
              <div className="flex-1 min-w-0">
                <div className="mb-3">
                  <p className="text-sm font-bold text-[#10284C]">{lastGame.opponent}</p>
                  <p className="text-xs text-slate-400">
                    {lastGame.date ? new Date(lastGame.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                    {' \u00B7 '}{lastGame.result === 'W' ? 'Win' : 'Loss'} {lastGame.score}
                  </p>
                </div>

                <div className="space-y-0">
                  {sc.primaryStats.map((stat, i) => {
                    const gameVal = stat.calc ? stat.calc(lastGame.raw) : (lastGame.raw[stat.key] || 0)
                    const seasonTotal = stat.calc ? stat.calc(seasonStats) : (seasonStats?.[stat.key] || 0)
                    const seasonAvg = gamesPlayed > 0 ? seasonTotal / gamesPlayed : 0
                    const diff = gameVal - seasonAvg
                    return (
                      <div key={stat.key} className={`flex items-center justify-between py-2.5 ${i < sc.primaryStats.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <span className="text-sm text-slate-500">{stat.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-[#10284C]">{gameVal}</span>
                          {seasonAvg > 0 && (
                            <span className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(1)} vs avg
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {isCoachOrAdmin && (
                  <button onClick={() => showToast?.('Stat entry workflow coming soon', 'info')}
                    className="mt-4 w-full px-4 py-2 rounded-lg bg-[#10284C] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition text-center">
                    Enter / Edit Stats
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coach Intelligence */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Coach Intelligence</h4>
        {coachFeedback.length > 0 ? (
          <div className="space-y-3">
            {coachFeedback.map((note, i) => (
              <div key={i} className="p-3 rounded-lg border border-[#E8ECF2]">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${note.note_type === 'skill' ? 'bg-[#4BB9EC]/10 text-[#4BB9EC]' : note.note_type === 'behavior' ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'}`}>{note.note_type}</span>
                  <span className="text-[10px] text-slate-400">{note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                </div>
                <p className="text-sm text-slate-700">{note.content}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-center py-4 text-slate-400">No coach feedback shared yet</p>}
      </div>

      {/* Strategic Objectives */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Strategic Objectives</h4>
        {playerGoals.length > 0 ? (
          <div className="space-y-3">
            {playerGoals.map((goal, i) => {
              const progress = goal.current_value && goal.target_value ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0
              return (
                <div key={i} className="p-3 rounded-lg border border-[#E8ECF2]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#10284C]">{goal.title}</span>
                    {goal.status === 'completed' && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase">Done</span>}
                    {goal.status === 'in_progress' && <span className="text-[10px] bg-[#4BB9EC]/10 text-[#4BB9EC] px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                  </div>
                  {goal.description && <p className="text-xs text-slate-500 mb-2">{goal.description}</p>}
                  {goal.target_value && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#4BB9EC] transition-all" style={{ width: `${progress}%` }} /></div>
                      <span className="text-xs font-mono text-slate-500">{goal.current_value || 0}/{goal.target_value}</span>
                    </div>
                  )}
                  {goal.target_date && <p className="text-[10px] mt-1 text-slate-400">Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                </div>
              )
            })}
          </div>
        ) : <p className="text-sm text-center py-4 text-slate-400">No goals set yet</p>}
      </div>

    </div>
  )
}

// ═══════════════════════════════════════════════
// TAB: BADGES
// ═══════════════════════════════════════════════
function BadgesTab({ badges, badgesInProgress, shoutouts, challenges }) {
  return (
    <div className="space-y-5">
      {/* Earned Badges */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Earned ({badges.length})</h4>
        {badges.length > 0 ? (
          <div className="grid grid-cols-4 gap-5">
            {badges.map((b, i) => {
              const badge = badgeDefinitions[b.badge_id] || { name: b.badge_id, icon: '\u{1F3C5}', color: '#6B7280', rarity: 'Common' }
              const rColor = rarityColors[badge.rarity] || '#6B7280'
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${badge.color}20`, border: `2px solid ${rColor}`, boxShadow: `0 0 20px ${rColor}30` }}>{badge.icon}</div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#10284C] text-center">{badge.name}</span>
                  <span className="text-[10px] text-slate-400">{badge.rarity}</span>
                  {b.awarded_at && <span className="text-[10px] text-slate-400">Earned {new Date(b.awarded_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>}
                </div>
              )
            })}
          </div>
        ) : <p className="text-sm text-center py-8 text-slate-400">No badges earned yet</p>}
      </div>

      {/* In Progress */}
      {badgesInProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">In Progress</h4>
          <div className="grid grid-cols-2 gap-4">
            {badgesInProgress.map((b, i) => {
              const badge = badgeDefinitions[b.badge_id] || { name: b.badge_id, icon: '\u{1F3C5}', color: '#6B7280' }
              const pct = b.target ? Math.min((b.progress / b.target) * 100, 100) : (b.target_value ? Math.min(((b.current_value || 0) / b.target_value) * 100, 100) : 0)
              const prog = b.progress ?? b.current_value ?? 0
              const tgt = b.target ?? b.target_value ?? 0
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl p-4 bg-slate-50">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${badge.color}20` }}>{badge.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium uppercase text-sm text-[#10284C]">{badge.name}</p>
                    <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-2 rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: badge.color }} /></div><span className="text-xs text-slate-400">{prog}/{tgt}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Shoutouts */}
      {shoutouts.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Recent Shoutouts</h4>
          <div className="space-y-3">
            {shoutouts.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-xl">{s.category_emoji || '\u{1F31F}'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#10284C]">{s.category || 'Shoutout'}</p>
                  {s.message && <p className="text-xs text-slate-500 italic mt-0.5">"{s.message}"</p>}
                  <p className="text-[10px] text-slate-400 mt-0.5">From {s.giver?.first_name || 'Coach'} {s.giver?.last_name || ''} &bull; {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Challenges</h4>
          <div className="space-y-3">
            {challenges.map((c, i) => {
              const ch = c.challenge || c
              const pct = ch.target_value ? Math.min(((c.current_value || 0) / ch.target_value) * 100, 100) : 0
              return (
                <div key={i} className="p-3 rounded-lg border border-[#E8ECF2]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#10284C]">{ch.title || 'Challenge'}</span>
                    {c.completed && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase">Complete</span>}
                    {ch.xp_reward && !c.completed && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-bold">+{ch.xp_reward} XP</span>}
                  </div>
                  {ch.description && <p className="text-xs text-slate-500 mb-2">{ch.description}</p>}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-200"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.completed ? '#22C55E' : '#4BB9EC' }} /></div>
                    <span className="text-xs text-slate-400">{c.current_value || 0}/{ch.target_value || '?'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Badge Rarity Guide */}
      <div className="bg-white rounded-xl border border-[#E8ECF2] p-4">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Badge Rarity Guide</h4>
        <div className="flex items-center gap-4">
          {Object.entries(rarityColors).map(([tier, color]) => (
            <div key={tier} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-semibold text-slate-500">{tier}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
// TAB: GAMES
// ═══════════════════════════════════════════════
function GamesTab({ sc, transformedGames, seasonStats, gamesPlayed, seasonName }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('desc')

  let games = [...transformedGames]
  if (filter === 'wins') games = games.filter(g => g.result === 'W')
  if (filter === 'losses') games = games.filter(g => g.result === 'L')
  if (sort === 'asc') games = games.reverse()

  // Performance grade
  const getGrade = (game) => {
    if (!transformedGames.length) return null
    const avgPerStat = sc.primaryStats.map((stat, si) => {
      const sum = transformedGames.reduce((s, g) => s + (g.statValues[si] || 0), 0)
      return sum / transformedGames.length
    })
    let aboveAvg = 0
    game.statValues.forEach((val, si) => { if (val >= avgPerStat[si]) aboveAvg++ })
    if (aboveAvg >= 4) return { grade: 'A+', color: '#22C55E' }
    if (aboveAvg >= 3) return { grade: 'A', color: '#22C55E' }
    if (aboveAvg >= 2) return { grade: 'B', color: '#4BB9EC' }
    if (aboveAvg >= 1) return { grade: 'C', color: '#F59E0B' }
    return { grade: 'D', color: '#EF4444' }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-[#10284C]">{gamesPlayed} Games Played {seasonName ? `\u00B7 ${seasonName} Season` : ''}</h4>
        <div className="flex items-center gap-2">
          {['all', 'wins', 'losses'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === f ? 'bg-[#4BB9EC] text-white' : 'bg-white border border-[#E8ECF2] text-slate-500 hover:text-slate-700'}`}>
              {f === 'all' ? 'All' : f === 'wins' ? 'Wins' : 'Losses'}
            </button>
          ))}
          <button onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} className="px-2.5 py-1.5 text-xs border border-[#E8ECF2] rounded-lg text-slate-500 hover:text-slate-700 bg-white">
            {sort === 'desc' ? 'Latest' : 'Oldest'}
          </button>
        </div>
      </div>

      {/* Game Cards */}
      {games.length > 0 ? (
        <div className="space-y-2">
          {games.map((game, i) => {
            const gradeInfo = getGrade(game)
            return (
              <div key={i} className="flex items-center gap-4 bg-white rounded-xl border border-[#E8ECF2] p-4">
                <div className="w-16 text-center">
                  <p className="text-xs text-slate-400">{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</p>
                  <p className="text-[10px] text-slate-300">VS</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#10284C] truncate">{game.opponent}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${game.result === 'W' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{game.result}</span>
                    <span className="text-xs text-slate-400">{game.score}</span>
                  </div>
                </div>
                <div className="flex gap-3 text-sm font-bold">
                  {game.statValues.slice(0, 3).map((val, si) => (
                    <div key={si} className="text-center w-10">
                      <span style={{ color: sc.primaryStats[si]?.color }}>{val}</span>
                      <p className="text-[8px] uppercase text-slate-400">{sc.primaryStats[si]?.short}</p>
                    </div>
                  ))}
                </div>
                {gradeInfo && (
                  <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: gradeInfo.color }}>
                    <span className="text-xs font-extrabold" style={{ color: gradeInfo.color }}>{gradeInfo.grade}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : <p className="text-sm text-center py-8 text-slate-400">{filter !== 'all' ? `No ${filter} recorded` : 'No games played yet'}</p>}
    </div>
  )
}

export { ParentPlayerCardPage }
