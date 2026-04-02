// ============================================
// CONSOLIDATED SPORT CONFIGURATIONS
// Single source of truth for all sport configs.
// Merges formation-aware data (from AdvancedLineupBuilder)
// with stats data (from GameComponents).
// ============================================

// Volleyball formations — extracted for direct access
export const VOLLEYBALL_FORMATIONS = {
  '5-1': {
    name: '5-1 Offense',
    description: '1 setter runs all rotations',
    positions: [
      { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'OH', color: '#EF4444', row: 'back' },
      { id: 2, name: 'P2', label: 'Right Front', role: 'OPP', color: '#6366F1', row: 'front' },
      { id: 3, name: 'P3', label: 'Middle Front', role: 'MB', color: '#F59E0B', row: 'front' },
      { id: 4, name: 'P4', label: 'Left Front', role: 'OH', color: '#EF4444', row: 'front' },
      { id: 5, name: 'P5', label: 'Left Back', role: 'MB', color: '#F59E0B', row: 'back' },
      { id: 6, name: 'P6', label: 'Middle Back', role: 'S', color: '#10B981', row: 'back' },
    ],
  },
  '6-2': {
    name: '6-2 Offense',
    description: '2 setters, setter always back row',
    positions: [
      { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'S', color: '#10B981', row: 'back' },
      { id: 2, name: 'P2', label: 'Right Front', role: 'OH', color: '#EF4444', row: 'front' },
      { id: 3, name: 'P3', label: 'Middle Front', role: 'MB', color: '#F59E0B', row: 'front' },
      { id: 4, name: 'P4', label: 'Left Front', role: 'OH', color: '#EF4444', row: 'front' },
      { id: 5, name: 'P5', label: 'Left Back', role: 'MB', color: '#F59E0B', row: 'back' },
      { id: 6, name: 'P6', label: 'Middle Back', role: 'S', color: '#10B981', row: 'back' },
    ],
  },
  '4-2': {
    name: '4-2 Simple',
    description: 'Simple rotation for beginners',
    positions: [
      { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'S', color: '#10B981', row: 'back' },
      { id: 2, name: 'P2', label: 'Right Front', role: 'H', color: '#EF4444', row: 'front' },
      { id: 3, name: 'P3', label: 'Middle Front', role: 'H', color: '#EF4444', row: 'front' },
      { id: 4, name: 'P4', label: 'Left Front', role: 'S', color: '#10B981', row: 'front' },
      { id: 5, name: 'P5', label: 'Left Back', role: 'H', color: '#EF4444', row: 'back' },
      { id: 6, name: 'P6', label: 'Middle Back', role: 'H', color: '#EF4444', row: 'back' },
    ],
  },
  '6-6': {
    name: '6-6 Recreational',
    description: 'Everyone rotates all positions',
    positions: [
      { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'P1', color: '#3B82F6', row: 'back' },
      { id: 2, name: 'P2', label: 'Right Front', role: 'P2', color: '#10B981', row: 'front' },
      { id: 3, name: 'P3', label: 'Middle Front', role: 'P3', color: '#F59E0B', row: 'front' },
      { id: 4, name: 'P4', label: 'Left Front', role: 'P4', color: '#EF4444', row: 'front' },
      { id: 5, name: 'P5', label: 'Left Back', role: 'P5', color: '#8B5CF6', row: 'back' },
      { id: 6, name: 'P6', label: 'Middle Back', role: 'P6', color: '#EC4899', row: 'back' },
    ],
  },
}

export const SPORT_CONFIGS = {
  volleyball: {
    name: 'Volleyball',
    icon: '🏐',
    starterCount: 6,
    hasRotations: true,
    rotationCount: 6,
    hasLibero: true,
    hasSets: true,
    maxSets: 5,
    formations: VOLLEYBALL_FORMATIONS,
    // Simple position list for stats entry
    positions: [
      { id: 1, name: 'P1', label: 'Position 1 (Serve)' },
      { id: 2, name: 'P2', label: 'Position 2 (RS)' },
      { id: 3, name: 'P3', label: 'Position 3 (Middle)' },
      { id: 4, name: 'P4', label: 'Position 4 (OH)' },
      { id: 5, name: 'P5', label: 'Position 5 (Middle)' },
      { id: 6, name: 'P6', label: 'Position 6 (Setter)' },
    ],
    statGroups: [
      { name: 'Attacking', stats: ['kills', 'attacks', 'attack_errors'], color: '#EF4444', description: 'Hit% = (Kills - Errors) ÷ Attempts' },
      { name: 'Serving', stats: ['aces', 'serves', 'service_errors'], color: '#8B5CF6', description: 'Srv% = Successful ÷ Total' },
      { name: 'Defense', stats: ['digs', 'reception_errors'], color: '#3B82F6' },
      { name: 'Setting', stats: ['assists'], color: '#10B981' },
      { name: 'Blocking', stats: ['blocks'], color: '#F59E0B' },
    ],
    statCategories: ['kills', 'attacks', 'attack_errors', 'aces', 'serves', 'service_errors', 'digs', 'reception_errors', 'assists', 'blocks'],
  },
  basketball: {
    name: 'Basketball',
    icon: '🏀',
    starterCount: 5,
    hasRotations: false,
    hasLibero: false,
    hasSets: false,
    formations: {
      'standard': {
        name: 'Standard',
        positions: [
          { id: 1, name: 'PG', label: 'Point Guard', role: 'PG', color: '#3B82F6' },
          { id: 2, name: 'SG', label: 'Shooting Guard', role: 'SG', color: '#10B981' },
          { id: 3, name: 'SF', label: 'Small Forward', role: 'SF', color: '#F59E0B' },
          { id: 4, name: 'PF', label: 'Power Forward', role: 'PF', color: '#EF4444' },
          { id: 5, name: 'C', label: 'Center', role: 'C', color: '#8B5CF6' },
        ],
      },
    },
    positions: [
      { id: 1, name: 'PG', label: 'Point Guard' },
      { id: 2, name: 'SG', label: 'Shooting Guard' },
      { id: 3, name: 'SF', label: 'Small Forward' },
      { id: 4, name: 'PF', label: 'Power Forward' },
      { id: 5, name: 'C', label: 'Center' },
    ],
    statCategories: ['fgm', 'fga', 'three_pm', 'three_pa', 'ftm', 'fta', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls'],
  },
  soccer: {
    name: 'Soccer',
    icon: '⚽',
    starterCount: 11,
    hasRotations: false,
    hasLibero: false,
    hasSets: false,
    formations: {
      '4-4-2': {
        name: '4-4-2',
        positions: [
          { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B' },
          { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6' },
          { id: 3, name: 'CB1', label: 'Center Back', role: 'DEF', color: '#3B82F6' },
          { id: 4, name: 'CB2', label: 'Center Back', role: 'DEF', color: '#3B82F6' },
          { id: 5, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6' },
          { id: 6, name: 'LM', label: 'Left Mid', role: 'MID', color: '#10B981' },
          { id: 7, name: 'CM1', label: 'Center Mid', role: 'MID', color: '#10B981' },
          { id: 8, name: 'CM2', label: 'Center Mid', role: 'MID', color: '#10B981' },
          { id: 9, name: 'RM', label: 'Right Mid', role: 'MID', color: '#10B981' },
          { id: 10, name: 'ST1', label: 'Striker', role: 'FWD', color: '#EF4444' },
          { id: 11, name: 'ST2', label: 'Striker', role: 'FWD', color: '#EF4444' },
        ],
      },
    },
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
    statCategories: ['goals', 'assists', 'shots', 'shots_on_target', 'saves', 'shots_against', 'fouls', 'yellow_cards', 'red_cards'],
  },
  baseball: {
    name: 'Baseball',
    icon: '⚾',
    starterCount: 9,
    hasRotations: false,
    hasLibero: false,
    hasBattingOrder: true,
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
    statCategories: ['at_bats', 'hits', 'runs', 'rbis', 'doubles', 'triples', 'home_runs', 'walks', 'strikeouts', 'stolen_bases'],
  },
  softball: {
    name: 'Softball',
    icon: '🥎',
    starterCount: 9,
    hasRotations: false,
    hasLibero: false,
    hasBattingOrder: true,
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
    statCategories: ['at_bats', 'hits', 'runs', 'rbis', 'doubles', 'triples', 'home_runs', 'walks', 'strikeouts', 'stolen_bases'],
  },
  football: {
    name: 'Football',
    icon: '🏈',
    starterCount: 11,
    hasRotations: false,
    hasLibero: false,
    positions: [
      { id: 1, name: 'QB', label: 'Quarterback' },
      { id: 2, name: 'RB', label: 'Running Back' },
      { id: 3, name: 'WR', label: 'Wide Receiver' },
      { id: 4, name: 'WR', label: 'Wide Receiver' },
      { id: 5, name: 'TE', label: 'Tight End' },
      { id: 6, name: 'OL', label: 'Offensive Line' },
    ],
    statCategories: ['pass_attempts', 'completions', 'passing_yards', 'passing_tds', 'interceptions', 'rush_attempts', 'rushing_yards', 'rushing_tds', 'receptions', 'targets', 'receiving_yards', 'receiving_tds', 'tackles', 'sacks'],
  },
  hockey: {
    name: 'Hockey',
    icon: '🏒',
    starterCount: 6,
    hasRotations: false,
    hasLibero: false,
    positions: [
      { id: 1, name: 'G', label: 'Goalie' },
      { id: 2, name: 'LD', label: 'Left Defense' },
      { id: 3, name: 'RD', label: 'Right Defense' },
      { id: 4, name: 'LW', label: 'Left Wing' },
      { id: 5, name: 'C', label: 'Center' },
      { id: 6, name: 'RW', label: 'Right Wing' },
    ],
    statCategories: ['goals', 'assists', 'shots', 'saves', 'shots_against', 'plus_minus', 'penalty_minutes', 'power_play_goals', 'short_handed_goals'],
  },
}

// Get sport config with fallback
export function getSportConfig(sport) {
  const key = sport?.toLowerCase()?.replace(/\s+/g, '') || 'volleyball'
  return SPORT_CONFIGS[key] || SPORT_CONFIGS.volleyball
}

// Get positions for a specific formation
export function getFormationPositions(sport, formationType) {
  const config = getSportConfig(sport)
  if (!config.formations) return config.positions || []
  const formation = config.formations[formationType]
  return formation ? formation.positions : (config.positions || [])
}
