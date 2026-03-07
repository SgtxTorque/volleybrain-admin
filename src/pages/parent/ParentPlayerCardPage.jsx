import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import PageShell from '../../components/pages/PageShell'
import ParentPlayerHero from './ParentPlayerHero'
import ParentPlayerTabs from './ParentPlayerTabs'

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
function ParentPlayerCardPage({ playerId, roleContext, showToast, seasonId: propSeasonId }) {
  const { isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [player, setPlayer] = useState(null)
  const [teamAssignments, setTeamAssignments] = useState([])
  const [seasonStats, setSeasonStats] = useState(null)
  const [recentGames, setRecentGames] = useState([])
  const [badges, setBadges] = useState([])
  const [badgesInProgress, setBadgesInProgress] = useState([])
  const [skills, setSkills] = useState(null)
  const [sportName, setSportName] = useState('volleyball')
  const [evalHistory, setEvalHistory] = useState([])
  const [coachFeedback, setCoachFeedback] = useState([])
  const [playerGoals, setPlayerGoals] = useState([])

  useEffect(() => { if (playerId) loadAllData() }, [playerId])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([loadPlayerData(), loadBadges(), loadRecentGames(), loadSkills(), loadDevelopmentData()])
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
      const { data } = await supabase.from('player_badges').select('*').eq('player_id', playerId).order('awarded_at', { ascending: false })
      setBadges(data || [])
      try {
        const { data: p } = await supabase.from('player_achievement_progress').select('*').eq('player_id', playerId)
        setBadgesInProgress(p || [])
      } catch { setBadgesInProgress([]) }
    } catch { setBadges([]) }
  }

  async function loadRecentGames() {
    try {
      const { data } = await supabase
        .from('game_player_stats')
        .select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(10)
      setRecentGames(data || [])
    } catch { setRecentGames([]) }
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full" />
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

  const playerName = `${p.first_name || 'Player'} ${p.last_name || ''}`.trim()
  const subtitle = `${posInfo.full}${jerseyNumber ? ` #${jerseyNumber}` : ''} - ${teamName}`

  return (
    <PageShell title={playerName} breadcrumb="My Players" subtitle={subtitle}>
      <div className="w-full space-y-0">
        <ParentPlayerHero
          player={player}
          posInfo={posInfo}
          posColor={posColor}
          teamName={teamName}
          teamColor={teamColor}
          seasonName={seasonName}
          jerseyNumber={jerseyNumber}
          overallRating={overallRating}
          badges={badges}
          perGameStats={perGameStats}
          sc={sc}
        />
        <ParentPlayerTabs
          sc={sc}
          skills={skills}
          getSkillValue={getSkillValue}
          seasonStats={seasonStats}
          gamesPlayed={gamesPlayed}
          transformedGames={transformedGames}
          perGameStats={perGameStats}
          trends={trends}
          badges={badges}
          badgesInProgress={badgesInProgress}
          evalHistory={evalHistory}
          coachFeedback={coachFeedback}
          playerGoals={playerGoals}
        />
      </div>
    </PageShell>
  )
}

export { ParentPlayerCardPage }
