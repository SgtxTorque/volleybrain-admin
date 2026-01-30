import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Calendar, MapPin, Clock, Users, ChevronRight, Check, X,
  Edit, BarChart3, ClipboardList, AlertTriangle, Save, Loader2, Trophy, ArrowRight
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
    // Define groups for visual separation (with descriptions for percentage calculations)
    statGroups: [
      { name: 'Attacking', stats: ['kills', 'attacks', 'attack_errors'], color: '#EF4444', description: 'Hit% = (Kills - Errors) ÷ Attempts' },
      { name: 'Serving', stats: ['aces', 'serves', 'service_errors'], color: '#8B5CF6', description: 'Srv% = Successful ÷ Total' },
      { name: 'Defense', stats: ['digs', 'reception_errors'], color: '#3B82F6' },
      { name: 'Setting', stats: ['assists'], color: '#10B981' },
      { name: 'Blocking', stats: ['blocks'], color: '#F59E0B' }
    ],
    // Flat list matches group order exactly
    statCategories: ['kills', 'attacks', 'attack_errors', 'aces', 'serves', 'service_errors', 'digs', 'reception_errors', 'assists', 'blocks'],
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
    // Points auto-calculated from FG + 3P + FT
    statCategories: ['fgm', 'fga', 'three_pm', 'three_pa', 'ftm', 'fta', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls'],
    // Calculated: points = (fgm - three_pm)*2 + three_pm*3 + ftm
    // Calculated: fg_pct = fgm / fga
    // Calculated: three_pct = three_pm / three_pa
    // Calculated: ft_pct = ftm / fta
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
    statCategories: ['goals', 'assists', 'shots', 'shots_on_target', 'saves', 'shots_against', 'fouls', 'yellow_cards', 'red_cards'],
    // Calculated: shot_pct = goals / shots
    // Calculated: save_pct = saves / shots_against
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
    statCategories: ['at_bats', 'hits', 'runs', 'rbis', 'doubles', 'triples', 'home_runs', 'walks', 'strikeouts', 'stolen_bases'],
    // Calculated: batting_avg = hits / at_bats
    // Calculated: obp = (hits + walks) / (at_bats + walks)
    // Calculated: slg = (hits + doubles + triples*2 + home_runs*3) / at_bats
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
    statCategories: ['at_bats', 'hits', 'runs', 'rbis', 'doubles', 'triples', 'home_runs', 'walks', 'strikeouts', 'stolen_bases'],
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
    statCategories: ['pass_attempts', 'completions', 'passing_yards', 'passing_tds', 'interceptions', 'rush_attempts', 'rushing_yards', 'rushing_tds', 'receptions', 'targets', 'receiving_yards', 'receiving_tds', 'tackles', 'sacks'],
    // Calculated: comp_pct = completions / pass_attempts
    // Calculated: yards_per_carry = rushing_yards / rush_attempts
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
    statCategories: ['goals', 'assists', 'shots', 'saves', 'shots_against', 'plus_minus', 'penalty_minutes', 'power_play_goals', 'short_handed_goals'],
    // Calculated: shot_pct = goals / shots
    // Calculated: save_pct = saves / shots_against
    icon: '🏒'
  }
}

// Get sport config with fallback
function getSportConfig(sport) {
  const key = sport?.toLowerCase()?.replace(/\s+/g, '') || 'volleyball'
  return SPORT_CONFIGS[key] || SPORT_CONFIGS.volleyball
}

// Format stat key to display label
function formatStatLabel(key) {
  const labels = {
    // Volleyball
    kills: 'K', attacks: 'ATT', attack_errors: 'AE', aces: 'A', serves: 'SRV', service_errors: 'SE', 
    assists: 'AST', digs: 'D', blocks: 'BLK', errors: 'ERR',
    receptions: 'REC', reception_errors: 'RE',
    // Basketball
    fgm: 'FGM', fga: 'FGA', three_pm: '3PM', three_pa: '3PA', 
    ftm: 'FTM', fta: 'FTA', points: 'PTS', rebounds: 'REB', 
    steals: 'STL', turnovers: 'TO', fouls: 'PF',
    // Soccer
    goals: 'G', shots: 'SH', shots_on_target: 'SOT', saves: 'SV', 
    shots_against: 'SA', yellow_cards: 'YC', red_cards: 'RC',
    // Baseball/Softball
    at_bats: 'AB', hits: 'H', runs: 'R', rbis: 'RBI', doubles: '2B', triples: '3B',
    home_runs: 'HR', walks: 'BB', strikeouts: 'SO', stolen_bases: 'SB',
    // Football
    pass_attempts: 'ATT', completions: 'CMP', passing_yards: 'YDS', passing_tds: 'TD',
    interceptions: 'INT', rush_attempts: 'CAR', rushing_yards: 'YDS', rushing_tds: 'TD',
    fb_receptions: 'REC', targets: 'TGT', receiving_yards: 'YDS', receiving_tds: 'TD', tackles: 'TKL', sacks: 'SCK',
    // Hockey
    plus_minus: '+/-', penalty_minutes: 'PIM', power_play_goals: 'PPG', short_handed_goals: 'SHG'
  }
  return labels[key] || key.toUpperCase().slice(0, 3)
}

// Get full stat name for tooltip
function getStatFullName(key) {
  const names = {
    // Volleyball
    kills: 'Kills', attacks: 'Attack Attempts', attack_errors: 'Attack Errors', 
    aces: 'Service Aces', serves: 'Serve Attempts', service_errors: 'Service Errors',
    assists: 'Assists', digs: 'Digs', blocks: 'Blocks', errors: 'Errors',
    receptions: 'Passes/Receptions', reception_errors: 'Passing Errors',
    // Basketball
    fgm: 'Field Goals Made', fga: 'Field Goals Attempted', 
    three_pm: '3-Pointers Made', three_pa: '3-Pointers Attempted',
    ftm: 'Free Throws Made', fta: 'Free Throws Attempted',
    points: 'Points', rebounds: 'Rebounds', steals: 'Steals', 
    turnovers: 'Turnovers', fouls: 'Personal Fouls',
    // Soccer
    goals: 'Goals', shots: 'Shots', shots_on_target: 'Shots on Target',
    saves: 'Saves', shots_against: 'Shots Against', 
    yellow_cards: 'Yellow Cards', red_cards: 'Red Cards',
    // Baseball/Softball
    at_bats: 'At Bats', hits: 'Hits', runs: 'Runs', rbis: 'RBIs',
    doubles: 'Doubles', triples: 'Triples', home_runs: 'Home Runs',
    walks: 'Walks', strikeouts: 'Strikeouts', stolen_bases: 'Stolen Bases',
    // Football
    pass_attempts: 'Pass Attempts', completions: 'Completions', 
    passing_yards: 'Passing Yards', passing_tds: 'Passing TDs',
    interceptions: 'Interceptions', rush_attempts: 'Rush Attempts',
    rushing_yards: 'Rushing Yards', rushing_tds: 'Rushing TDs',
    fb_receptions: 'Receptions', targets: 'Targets',
    receiving_yards: 'Receiving Yards', receiving_tds: 'Receiving TDs',
    tackles: 'Tackles', sacks: 'Sacks',
    // Hockey
    plus_minus: 'Plus/Minus', penalty_minutes: 'Penalty Minutes',
    power_play_goals: 'Power Play Goals', short_handed_goals: 'Short Handed Goals'
  }
  return names[key] || key.replace(/_/g, ' ')
}

// Get shorter display name for column headers (more readable than abbreviations)
function getStatShortName(key) {
  const names = {
    // Volleyball - clearer names within groups
    kills: 'Kills', attacks: 'Attempts', attack_errors: 'Errors', 
    aces: 'Aces', serves: 'Attempts', service_errors: 'Errors',
    assists: 'Assists', digs: 'Digs', blocks: 'Blocks', 
    reception_errors: 'Errors', receptions: 'Passes',
    // Basketball
    fgm: 'FG Made', fga: 'FG Att', three_pm: '3P Made', three_pa: '3P Att',
    ftm: 'FT Made', fta: 'FT Att', points: 'Points', rebounds: 'Reb',
    steals: 'Steals', turnovers: 'TO', fouls: 'Fouls',
    // Soccer
    goals: 'Goals', shots: 'Shots', shots_on_target: 'On Target',
    saves: 'Saves', shots_against: 'Shots Ag', yellow_cards: 'Yellow', red_cards: 'Red',
    // Baseball/Softball
    at_bats: 'AB', hits: 'Hits', runs: 'Runs', rbis: 'RBI',
    doubles: '2B', triples: '3B', home_runs: 'HR',
    walks: 'Walks', strikeouts: 'K', stolen_bases: 'SB',
    // Football
    pass_attempts: 'Pass Att', completions: 'Comp', passing_yards: 'Pass Yds', passing_tds: 'Pass TD',
    interceptions: 'INT', rush_attempts: 'Rush Att', rushing_yards: 'Rush Yds', rushing_tds: 'Rush TD',
    targets: 'Targets', receiving_yards: 'Rec Yds', receiving_tds: 'Rec TD',
    tackles: 'Tackles', sacks: 'Sacks',
    // Hockey
    plus_minus: '+/-', penalty_minutes: 'PIM', power_play_goals: 'PPG', short_handed_goals: 'SHG'
  }
  return names[key] || key.replace(/_/g, ' ')
}

// Get emoji icon for stat
function getStatIcon(key) {
  const icons = {
    // Volleyball
    kills: '💥', attacks: '🎯', attack_errors: '❌', aces: '🎯', serves: '🏐', service_errors: '❌',
    assists: '🤝', digs: '🛡️', blocks: '🧱', errors: '❌',
    receptions: '🙌', reception_errors: '❌',
    // Basketball
    fgm: '🏀', fga: '🎯', three_pm: '3️⃣', three_pa: '🎯',
    ftm: '🎯', fta: '🎯', points: '🏆', rebounds: '📊',
    steals: '🏃', turnovers: '↩️', fouls: '🚫',
    // Soccer
    goals: '⚽', shots: '🎯', shots_on_target: '🎯', saves: '🧤',
    shots_against: '⚽', yellow_cards: '🟨', red_cards: '🟥',
    // Baseball/Softball
    at_bats: '⚾', hits: '💥', runs: '🏃', rbis: '📊', doubles: '2️⃣', triples: '3️⃣',
    home_runs: '🏠', walks: '🚶', strikeouts: 'K', stolen_bases: '🏃',
    // Football
    pass_attempts: '🏈', completions: '✅', passing_yards: '📏', passing_tds: '🎉',
    interceptions: '❌', rush_attempts: '🏃', rushing_yards: '📏', rushing_tds: '🎉',
    targets: '🎯', receiving_yards: '📏', receiving_tds: '🎉', tackles: '💪', sacks: '💥',
    // Hockey
    plus_minus: '📊', penalty_minutes: '⏱️', power_play_goals: '⚡', short_handed_goals: '🛡️'
  }
  return icons[key] || '📊'
}

// ============================================
// STATS PENDING BADGE
// ============================================
function StatsPendingBadge({ onClick, variant = 'badge', gamesCount = 1 }) {
  const tc = useThemeClasses()

  if (variant === 'badge') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick?.() }}
        className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition flex items-center gap-1"
      >
        <AlertTriangle className="w-3 h-3" />
        Stats
      </button>
    )
  }

  if (variant === 'banner') {
    return (
      <button
        onClick={onClick}
        className={`w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between hover:bg-amber-500/20 transition`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-amber-400">
              {gamesCount === 1 ? '1 Game Needs Stats' : `${gamesCount} Games Need Stats`}
            </p>
            <p className={`text-sm ${tc.textMuted}`}>Tap to enter player stats</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-amber-400" />
      </button>
    )
  }

  return null
}

// ============================================
// GAME COMPLETE MODAL - Enter score & prompt for stats
// ============================================
function GameCompleteModal({ 
  game, 
  team, 
  sport = 'volleyball',
  onClose, 
  onComplete,
  onEnterStats,
  showToast 
}) {
  const tc = useThemeClasses()
  const { profile } = useAuth()
  const sportConfig = getSportConfig(sport)
  
  const [ourScore, setOurScore] = useState(game?.our_score || '')
  const [opponentScore, setOpponentScore] = useState(game?.opponent_score || '')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState('score') // 'score' | 'prompt'
  const [gameResult, setGameResult] = useState(null)

  const handleSaveScore = async () => {
    if (!ourScore || !opponentScore) {
      showToast?.('Please enter both scores', 'error')
      return
    }

    setSaving(true)
    try {
      const ourNum = parseInt(ourScore)
      const oppNum = parseInt(opponentScore)
      const result = ourNum > oppNum ? 'win' : ourNum < oppNum ? 'loss' : 'tie'
      
      const { error } = await supabase
        .from('schedule_events')
        .update({
          game_status: 'completed',
          our_score: ourNum,
          opponent_score: oppNum,
          game_result: result,
          completed_at: new Date().toISOString(),
          completed_by: profile?.id
        })
        .eq('id', game.id)

      if (error) throw error
      
      setGameResult({ won: result === 'win', score: `${ourNum}-${oppNum}`, opponent: game.opponent_name })
      setStep('prompt')
      onComplete?.({ ...game, our_score: ourNum, opponent_score: oppNum, game_result: result })
    } catch (err) {
      console.error('Error completing game:', err)
      showToast?.('Error saving score', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEnterStatsNow = () => {
    onEnterStats?.(game)
    onClose()
  }

  const handleSkipStats = () => {
    showToast?.('Game completed! You can enter stats later from the game card.', 'info')
    onClose()
  }

  const gameDate = game?.event_date ? new Date(game.event_date) : null

  // Step 1: Enter Score
  if (step === 'score') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md`} onClick={e => e.stopPropagation()}>
          <div className={`p-5 border-b ${tc.border}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{sportConfig.icon}</span>
              <div>
                <h2 className={`text-xl font-bold ${tc.text}`}>Complete Game</h2>
                <p className={tc.textMuted}>
                  vs {game.opponent_name} • {gameDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className={`text-sm ${tc.textMuted} mb-4`}>Enter the final score:</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Our Score */}
              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  value={ourScore}
                  onChange={(e) => setOurScore(e.target.value)}
                  className={`w-20 h-20 text-3xl font-bold text-center rounded-xl ${tc.cardBgAlt} ${tc.text} border-2 ${tc.border} focus:border-[var(--accent-primary)] outline-none`}
                  placeholder="0"
                  autoFocus
                />
                <p className={`text-sm ${tc.textMuted} mt-2`}>{team?.name || 'Us'}</p>
              </div>
              
              <span className={`text-2xl ${tc.textMuted}`}>—</span>
              
              {/* Opponent Score */}
              <div className="text-center">
                <input
                  type="number"
                  min="0"
                  value={opponentScore}
                  onChange={(e) => setOpponentScore(e.target.value)}
                  className={`w-20 h-20 text-3xl font-bold text-center rounded-xl ${tc.cardBgAlt} ${tc.text} border-2 ${tc.border} focus:border-[var(--accent-primary)] outline-none`}
                  placeholder="0"
                />
                <p className={`text-sm ${tc.textMuted} mt-2`}>{game.opponent_name}</p>
              </div>
            </div>
          </div>

          <div className={`p-5 border-t ${tc.border} flex gap-3`}>
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl border ${tc.border} ${tc.text} font-medium`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveScore}
              disabled={saving || !ourScore || !opponentScore}
              className="flex-1 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Score'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Stats Prompt
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md overflow-hidden`}>
        {/* Celebration Header */}
        <div className={`p-6 ${gameResult?.won ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20' : 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20'}`}>
          <div className="text-center">
            <div className="text-5xl mb-3">{gameResult?.won ? '🎉' : sportConfig.icon}</div>
            <h2 className={`text-2xl font-bold ${tc.text}`}>
              {gameResult?.won ? 'Victory!' : 'Game Complete!'}
            </h2>
            <p className={tc.textSecondary}>
              vs {gameResult?.opponent} • {gameResult?.score}
            </p>
          </div>
        </div>

        {/* Stats Prompt */}
        <div className="p-6">
          <div className={`${tc.cardBgAlt} rounded-xl p-4 mb-4`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h3 className={`font-semibold ${tc.text}`}>Enter Player Stats?</h3>
                <p className={`text-sm ${tc.textMuted} mt-1`}>
                  Track {sportConfig.statCategories.slice(0, 3).join(', ')}, and more. Stats power leaderboards!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleEnterStatsNow}
              className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              Enter Stats Now
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleSkipStats}
              className={`w-full py-2.5 rounded-xl border ${tc.border} ${tc.textMuted} font-medium ${tc.hoverBg} transition text-sm`}
            >
              I'll Do It Later
            </button>
          </div>
          
          <p className={`text-xs ${tc.textMuted} text-center mt-4`}>
            💡 Games needing stats will show an alert badge
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// STATS ENTRY MODAL - Grid entry for all players
// ============================================
function StatsEntryModal({ 
  // New interface
  game, 
  teamId, 
  seasonId,
  sport = 'volleyball',
  // Old interface (backward compatibility)
  event,
  team,
  roster,
  // Common
  onClose, 
  onSave,
  showToast 
}) {
  const { profile } = useAuth()
  const tc = useThemeClasses()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState({})
  const [existingStats, setExistingStats] = useState(false)
  const firstInputRef = useRef(null)

  // Support both old and new prop names
  const actualGame = game || event
  const actualTeamId = teamId || team?.id
  const actualSeasonId = seasonId || actualGame?.season_id

  const sportConfig = getSportConfig(sport)
  const statColumns = sportConfig.statCategories.map(key => ({
    key,
    label: formatStatLabel(key),
    fullName: getStatFullName(key),
    shortName: getStatShortName(key),
    icon: getStatIcon(key)
  }))

  useEffect(() => {
    loadPlayers()
  }, [actualTeamId, actualGame?.id, roster])

  useEffect(() => {
    if (players.length > 0 && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [players])

  const loadPlayers = async () => {
    // If roster is passed directly (old interface), use it
    if (roster && roster.length > 0) {
      const playerList = roster.map(p => ({
        id: p.id || p.player_id,
        first_name: p.first_name,
        last_name: p.last_name,
        photo_url: p.photo_url,
        jersey_number: p.jersey_number,
        position: p.position
      }))
      setPlayers(playerList)
      initializeStats(playerList)
      setLoading(false)
      return
    }

    // Otherwise load from team_players
    if (!actualTeamId) {
      setLoading(false)
      return
    }

    try {
      const { data: teamPlayers, error: playersError } = await supabase
        .from('team_players')
        .select(`
          player_id,
          jersey_number,
          position,
          players(id, first_name, last_name, photo_url)
        `)
        .eq('team_id', actualTeamId)
        .order('jersey_number', { ascending: true })

      if (playersError) throw playersError

      const playerList = (teamPlayers || []).map(tp => ({
        id: tp.players.id,
        first_name: tp.players.first_name,
        last_name: tp.players.last_name,
        photo_url: tp.players.photo_url,
        jersey_number: tp.jersey_number,
        position: tp.position
      }))

      setPlayers(playerList)
      initializeStats(playerList)
    } catch (err) {
      console.error('Error loading players:', err)
      showToast?.('Error loading roster', 'error')
    } finally {
      setLoading(false)
    }
  }

  const initializeStats = async (playerList) => {
    const initialStats = {}
    playerList.forEach(p => {
      initialStats[p.id] = {}
      sportConfig.statCategories.forEach(cat => {
        initialStats[p.id][cat] = 0
      })
    })

    // Check for existing stats
    if (actualGame?.id) {
      const { data: existingData } = await supabase
        .from('game_player_stats')
        .select('*')
        .eq('event_id', actualGame.id)

      if (existingData && existingData.length > 0) {
        setExistingStats(true)
        existingData.forEach(stat => {
          if (initialStats[stat.player_id]) {
            sportConfig.statCategories.forEach(cat => {
              if (stat[cat] !== undefined) {
                initialStats[stat.player_id][cat] = stat[cat] || 0
              }
            })
          }
        })
      }
    }

    setStats(initialStats)
  }

  const handleStatChange = (playerId, statKey, value) => {
    const numValue = parseInt(value) || 0
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [statKey]: Math.max(0, numValue)
      }
    }))
  }

  const handleKeyDown = (e, playerId, statKey, playerIndex, statIndex) => {
    const playerIds = players.map(p => p.id)
    
    if (e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault()
      if (statIndex < statColumns.length - 1) {
        const nextInput = document.querySelector(`input[data-player="${playerId}"][data-stat="${statColumns[statIndex + 1].key}"]`)
        nextInput?.focus()
        nextInput?.select()
      } else if (playerIndex < players.length - 1) {
        const nextInput = document.querySelector(`input[data-player="${playerIds[playerIndex + 1]}"][data-stat="${statColumns[0].key}"]`)
        nextInput?.focus()
        nextInput?.select()
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (statIndex > 0) {
        const prevInput = document.querySelector(`input[data-player="${playerId}"][data-stat="${statColumns[statIndex - 1].key}"]`)
        prevInput?.focus()
        prevInput?.select()
      }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      if (playerIndex < players.length - 1) {
        const nextInput = document.querySelector(`input[data-player="${playerIds[playerIndex + 1]}"][data-stat="${statKey}"]`)
        nextInput?.focus()
        nextInput?.select()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (playerIndex > 0) {
        const prevInput = document.querySelector(`input[data-player="${playerIds[playerIndex - 1]}"][data-stat="${statKey}"]`)
        prevInput?.focus()
        prevInput?.select()
      }
    }
  }

  const calculateTotals = () => {
    const totals = {}
    statColumns.forEach(col => { totals[col.key] = 0 })
    Object.values(stats).forEach(playerStats => {
      statColumns.forEach(col => {
        totals[col.key] += playerStats[col.key] || 0
      })
    })
    return totals
  }

  const handleSave = async () => {
    if (!actualGame?.id || !actualTeamId) {
      showToast?.('Missing game information', 'error')
      return
    }

    setSaving(true)
    try {
      const entries = players.map(player => {
        const entry = {
          event_id: actualGame.id,
          player_id: player.id,
          team_id: actualTeamId,
          season_id: actualSeasonId,
          sport: sport,
          entered_by: profile?.id
        }
        sportConfig.statCategories.forEach(cat => {
          entry[cat] = stats[player.id]?.[cat] || 0
        })
        return entry
      })

      if (existingStats) {
        await supabase.from('game_player_stats').delete().eq('event_id', actualGame.id)
      }

      const { error: insertError } = await supabase.from('game_player_stats').insert(entries)
      if (insertError) throw insertError

      await supabase
        .from('schedule_events')
        .update({
          stats_entered: true,
          stats_entered_at: new Date().toISOString(),
          stats_entered_by: profile?.id
        })
        .eq('id', actualGame.id)

      showToast?.('Stats saved!', 'success')
      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving stats:', err)
      showToast?.('Error saving stats', 'error')
    } finally {
      setSaving(false)
    }
  }

  const totals = calculateTotals()
  const gameDate = actualGame?.event_date ? new Date(actualGame.event_date) : null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">
              {sportConfig.icon}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>Enter Game Stats</h2>
              <p className={tc.textMuted}>
                vs {actualGame?.opponent_name} • {gameDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {existingStats && <span className="text-amber-400 ml-2">(Editing)</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 ${tc.hoverBg} rounded-lg transition`}>
            <X className={`w-5 h-5 ${tc.textMuted}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
              <p className={tc.textSecondary}>No players on roster</p>
            </div>
          ) : (
            <>
              <div className={`${tc.cardBgAlt} rounded-xl p-3 mb-4 text-sm ${tc.textMuted}`}>
                💡 Use <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Tab</kbd> or arrow keys to navigate. Stats grouped by: 
                <span className="text-red-400 ml-1">Attacking</span> → 
                <span className="text-purple-400">Serving</span> → 
                <span className="text-blue-400">Defense</span> → 
                <span className="text-emerald-400">Setting</span> → 
                <span className="text-amber-400">Blocking</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {/* Group headers row */}
                    {sportConfig.statGroups && (
                      <tr className={`border-b ${tc.border}`}>
                        <th className="w-48"></th>
                        {sportConfig.statGroups.map(group => (
                          <th 
                            key={group.name}
                            colSpan={group.stats.length}
                            className="text-center py-2 px-1 text-xs font-bold uppercase tracking-wider"
                            style={{ color: group.color, borderBottom: `2px solid ${group.color}` }}
                          >
                            {group.name}
                          </th>
                        ))}
                      </tr>
                    )}
                    {/* Stat column headers */}
                    <tr className={`border-b ${tc.border}`}>
                      <th className={`text-left py-3 px-2 ${tc.textMuted} font-medium text-sm w-48`}>Player</th>
                      {statColumns.map((col, idx) => {
                        // Find which group this stat belongs to
                        const group = sportConfig.statGroups?.find(g => g.stats.includes(col.key))
                        const isFirstInGroup = group && group.stats[0] === col.key
                        const isLastInGroup = group && group.stats[group.stats.length - 1] === col.key
                        
                        return (
                          <th 
                            key={col.key} 
                            className={`text-center py-2 px-1 ${tc.textMuted} font-medium text-xs w-16 cursor-help ${
                              isFirstInGroup ? 'border-l border-white/10' : ''
                            } ${isLastInGroup ? 'border-r border-white/10' : ''}`}
                            title={col.fullName}
                            style={group ? { backgroundColor: `${group.color}10` } : {}}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm">{col.icon}</span>
                              <span className="leading-tight text-[10px]">{col.shortName}</span>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, playerIndex) => (
                      <tr key={player.id} className={`border-b ${tc.border} hover:bg-white/5`}>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            {player.photo_url ? (
                              <img src={player.photo_url} alt={player.first_name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-primary)]">
                                {player.first_name?.[0]}{player.last_name?.[0]}
                              </div>
                            )}
                            <div>
                              <div className={`font-medium ${tc.text} text-sm`}>
                                {player.jersey_number && <span className={`${tc.textMuted} mr-1`}>#{player.jersey_number}</span>}
                                {player.first_name} {player.last_name?.[0]}.
                              </div>
                            </div>
                          </div>
                        </td>
                        {statColumns.map((col, statIndex) => (
                          <td key={col.key} className="py-2 px-1 text-center">
                            <input
                              ref={playerIndex === 0 && statIndex === 0 ? firstInputRef : null}
                              type="number"
                              min="0"
                              data-player={player.id}
                              data-stat={col.key}
                              value={stats[player.id]?.[col.key] || 0}
                              onChange={(e) => handleStatChange(player.id, col.key, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, player.id, col.key, playerIndex, statIndex)}
                              onFocus={(e) => e.target.select()}
                              className={`w-14 text-center py-2 rounded-lg ${tc.cardBgAlt} ${tc.text} border ${tc.border} focus:border-[var(--accent-primary)] outline-none transition text-sm font-medium`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--accent-primary)]/10">
                      <td className={`py-3 px-2 font-bold ${tc.text}`}>Team Totals</td>
                      {statColumns.map(col => (
                        <td key={col.key} className="py-3 px-1 text-center font-bold text-[var(--accent-primary)]">
                          {totals[col.key]}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${tc.border} flex items-center justify-between`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-xl border ${tc.border} ${tc.text} font-medium`}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || players.length === 0}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 disabled:opacity-50 transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Stats'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// GAME CARD - Single game display
// ============================================
function GameCard({ 
  game, 
  team, 
  sport = 'volleyball',
  viewerRole = 'parent',
  playerIds = [],
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
  const needsStats = isCompleted && !game.stats_entered
  
  const sportConfig = getSportConfig(sport)
  const canComplete = (viewerRole === 'coach' || viewerRole === 'admin') && !isCompleted
  const canEditStats = (viewerRole === 'coach' || viewerRole === 'admin') && isCompleted
  
  const gameDate = new Date(game.event_date)
  const dateStr = gameDate.toLocaleDateString('en-US', { 
    weekday: compact ? 'short' : 'long', 
    month: 'short', 
    day: 'numeric' 
  })
  
  const formatTime = (timeStr) => {
    if (!timeStr) return 'TBD'
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
  
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

  // Compact view
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
          
          <div className="text-right flex flex-col items-end gap-1">
            {isCompleted ? (
              <>
                <p className={`text-lg font-bold ${resultStyle.text}`}>
                  {game.our_score}-{game.opponent_score}
                </p>
                {/* Stats Needed Badge */}
                {needsStats && canEditStats && (
                  <StatsPendingBadge onClick={() => onEditStats?.(game)} />
                )}
              </>
            ) : isUpcoming ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                Upcoming
              </span>
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
      {/* Header */}
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
        
        <div className="flex items-center gap-2">
          {/* Stats Needed Badge */}
          {needsStats && canEditStats && (
            <StatsPendingBadge onClick={() => onEditStats?.(game)} />
          )}
          
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
      </div>
      
      {/* Score display */}
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
          Details
        </button>
        
        {viewerRole === 'parent' && isUpcoming && onRSVP && (
          <button
            onClick={() => onRSVP?.(game)}
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            RSVP
          </button>
        )}
        
        {canComplete && !isUpcoming && (
          <button
            onClick={() => onComplete?.(game)}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            🏁 Complete
          </button>
        )}
        
        {canEditStats && (
          <button
            onClick={() => onEditStats?.(game)}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
              needsStats 
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {needsStats ? 'Add Stats' : 'Edit Stats'}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// TEAM GAMES WIDGET
// ============================================
function TeamGamesWidget({
  teamIds = [],
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
  const [gamesNeedingStats, setGamesNeedingStats] = useState([])
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
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, color')
        .in('id', teamIds)
      
      const teamsMap = {}
      teamsData?.forEach(t => { teamsMap[t.id] = t })
      setTeams(teamsMap)
      
      const today = new Date().toISOString().split('T')[0]
      
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
      
      const { data: recent } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('event_type', 'game')
        .in('team_id', teamIds)
        .or(`game_status.eq.completed,event_date.lt.${today}`)
        .order('event_date', { ascending: false })
        .limit(maxRecent)
      
      setRecentGames(recent || [])
      
      // Find games needing stats
      const needStats = (recent || []).filter(g => g.game_status === 'completed' && !g.stats_entered)
      setGamesNeedingStats(needStats)
      
    } catch (err) {
      console.error('Error loading games:', err)
    }
    
    setLoading(false)
  }
  
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
        </div>
      </div>
    )
  }
  
  const hasGames = upcomingGames.length > 0 || recentGames.length > 0
  const isCoach = viewerRole === 'coach' || viewerRole === 'admin'

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
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
      
      {/* Stats Needed Alert Banner */}
      {isCoach && gamesNeedingStats.length > 0 && (
        <div className="p-3 border-b border-amber-500/30 bg-amber-500/10">
          <StatsPendingBadge 
            variant="banner" 
            gamesCount={gamesNeedingStats.length}
            onClick={() => {
              setActiveTab('recent')
              // If there's an onEditStats handler and only one game needs stats, open it directly
              if (gamesNeedingStats.length === 1 && onEditStats) {
                onEditStats(gamesNeedingStats[0])
              }
            }}
          />
        </div>
      )}
      
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
            className={`flex-1 py-2 text-sm font-medium transition relative ${
              activeTab === 'recent'
                ? 'border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : tc.textMuted
            }`}
          >
            Results ({recentGames.length})
            {isCoach && gamesNeedingStats.length > 0 && (
              <span className="absolute top-1 right-4 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      )}
      
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

// Export
export { 
  GameCard, 
  TeamGamesWidget, 
  GameCompleteModal,
  StatsEntryModal,
  StatsEntryModal as GameStatsModal, // Backward compatibility alias
  StatsPendingBadge,
  getSportConfig,
  SPORT_CONFIGS 
}
