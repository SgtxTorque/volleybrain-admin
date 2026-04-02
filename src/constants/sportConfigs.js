// ============================================
// CONSOLIDATED SPORT CONFIGURATIONS
// Single source of truth for all sport configs.
// Merges formation-aware data (from AdvancedLineupBuilder)
// with stats data (from GameComponents).
// Extended for multi-sport lineup builder.
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

// Basketball formations
const BASKETBALL_FORMATIONS = {
  'standard': {
    name: 'Standard',
    description: 'Default 5-position setup',
    positions: [
      { id: 1, name: 'PG', label: 'Point Guard', role: 'PG', color: '#3B82F6', zone: 'backcourt-center' },
      { id: 2, name: 'SG', label: 'Shooting Guard', role: 'SG', color: '#10B981', zone: 'backcourt-right' },
      { id: 3, name: 'SF', label: 'Small Forward', role: 'SF', color: '#F59E0B', zone: 'frontcourt-right' },
      { id: 4, name: 'PF', label: 'Power Forward', role: 'PF', color: '#EF4444', zone: 'frontcourt-left' },
      { id: 5, name: 'C', label: 'Center', role: 'C', color: '#8B5CF6', zone: 'paint' },
    ],
  },
}

// Baseball/Softball formations
const BASEBALL_FORMATIONS = {
  'standard': {
    name: 'Standard 9',
    description: 'Standard 9-position defense',
    positions: [
      { id: 1, name: 'P', label: 'Pitcher', role: 'P', color: '#EF4444', zone: 'mound' },
      { id: 2, name: 'C', label: 'Catcher', role: 'C', color: '#8B5CF6', zone: 'home' },
      { id: 3, name: '1B', label: 'First Base', role: '1B', color: '#3B82F6', zone: 'first' },
      { id: 4, name: '2B', label: 'Second Base', role: '2B', color: '#10B981', zone: 'second' },
      { id: 5, name: 'SS', label: 'Shortstop', role: 'SS', color: '#06B6D4', zone: 'short' },
      { id: 6, name: '3B', label: 'Third Base', role: '3B', color: '#F59E0B', zone: 'third' },
      { id: 7, name: 'LF', label: 'Left Field', role: 'LF', color: '#84CC16', zone: 'left-field' },
      { id: 8, name: 'CF', label: 'Center Field', role: 'CF', color: '#22C55E', zone: 'center-field' },
      { id: 9, name: 'RF', label: 'Right Field', role: 'RF', color: '#14B8A6', zone: 'right-field' },
    ],
  },
}

// Soccer formations (11v11 + smaller formats)
const SOCCER_FORMATIONS = {
  '4-4-2': {
    name: '4-4-2',
    description: '4 defenders, 4 midfielders, 2 forwards',
    lines: { defense: 4, midfield: 4, attack: 2 },
    forSize: '11v11',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'CB1', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center-left' },
      { id: 4, name: 'CB2', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center-right' },
      { id: 5, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 6, name: 'LM', label: 'Left Mid', role: 'MID', color: '#10B981', zone: 'midfield-left' },
      { id: 7, name: 'CM1', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center-left' },
      { id: 8, name: 'CM2', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center-right' },
      { id: 9, name: 'RM', label: 'Right Mid', role: 'MID', color: '#10B981', zone: 'midfield-right' },
      { id: 10, name: 'ST1', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-left' },
      { id: 11, name: 'ST2', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-right' },
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    description: '4 defenders, 3 midfielders, 3 forwards',
    lines: { defense: 4, midfield: 3, attack: 3 },
    forSize: '11v11',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'CB1', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center-left' },
      { id: 4, name: 'CB2', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center-right' },
      { id: 5, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 6, name: 'LCM', label: 'Left Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-left' },
      { id: 7, name: 'CM', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center' },
      { id: 8, name: 'RCM', label: 'Right Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-right' },
      { id: 9, name: 'LW', label: 'Left Wing', role: 'FWD', color: '#EF4444', zone: 'attack-left' },
      { id: 10, name: 'ST', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-center' },
      { id: 11, name: 'RW', label: 'Right Wing', role: 'FWD', color: '#EF4444', zone: 'attack-right' },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    description: '3 defenders, 5 midfielders, 2 forwards',
    lines: { defense: 3, midfield: 5, attack: 2 },
    forSize: '11v11',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LCB', label: 'Left CB', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'CB', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center' },
      { id: 4, name: 'RCB', label: 'Right CB', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 5, name: 'LWB', label: 'Left Wing Back', role: 'MID', color: '#10B981', zone: 'midfield-far-left' },
      { id: 6, name: 'LCM', label: 'Left Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-left' },
      { id: 7, name: 'CM', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center' },
      { id: 8, name: 'RCM', label: 'Right Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-right' },
      { id: 9, name: 'RWB', label: 'Right Wing Back', role: 'MID', color: '#10B981', zone: 'midfield-far-right' },
      { id: 10, name: 'ST1', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-left' },
      { id: 11, name: 'ST2', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-right' },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    description: '4 defenders, 2 holding mids, 3 attacking mids, 1 striker',
    lines: { defense: 4, holding: 2, attacking: 3, striker: 1 },
    forSize: '11v11',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'CB1', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center-left' },
      { id: 4, name: 'CB2', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center-right' },
      { id: 5, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 6, name: 'CDM1', label: 'Holding Mid', role: 'MID', color: '#10B981', zone: 'holding-left' },
      { id: 7, name: 'CDM2', label: 'Holding Mid', role: 'MID', color: '#10B981', zone: 'holding-right' },
      { id: 8, name: 'LAM', label: 'Left Att Mid', role: 'MID', color: '#10B981', zone: 'attacking-left' },
      { id: 9, name: 'CAM', label: 'Center Att Mid', role: 'MID', color: '#10B981', zone: 'attacking-center' },
      { id: 10, name: 'RAM', label: 'Right Att Mid', role: 'MID', color: '#10B981', zone: 'attacking-right' },
      { id: 11, name: 'ST', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-center' },
    ],
  },
  // Smaller format formations
  '3-2-1': {
    name: '3-2-1',
    description: 'Standard 7v7',
    lines: { defense: 3, midfield: 2, attack: 1 },
    forSize: '7v7',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'CB', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center' },
      { id: 4, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 5, name: 'LM', label: 'Left Mid', role: 'MID', color: '#10B981', zone: 'midfield-left' },
      { id: 6, name: 'RM', label: 'Right Mid', role: 'MID', color: '#10B981', zone: 'midfield-right' },
      { id: 7, name: 'ST', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-center' },
    ],
  },
  '2-3-1': {
    name: '2-3-1',
    description: 'Attacking 7v7',
    lines: { defense: 2, midfield: 3, attack: 1 },
    forSize: '7v7',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 4, name: 'LM', label: 'Left Mid', role: 'MID', color: '#10B981', zone: 'midfield-left' },
      { id: 5, name: 'CM', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center' },
      { id: 6, name: 'RM', label: 'Right Mid', role: 'MID', color: '#10B981', zone: 'midfield-right' },
      { id: 7, name: 'ST', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-center' },
    ],
  },
  '2-1-2': {
    name: '2-1-2',
    description: 'Standard 6v6',
    lines: { defense: 2, midfield: 1, attack: 2 },
    forSize: '6v6',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 4, name: 'CM', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center' },
      { id: 5, name: 'LS', label: 'Left Striker', role: 'FWD', color: '#EF4444', zone: 'attack-left' },
      { id: 6, name: 'RS', label: 'Right Striker', role: 'FWD', color: '#EF4444', zone: 'attack-right' },
    ],
  },
  '1-2-1': {
    name: '1-2-1',
    description: 'Standard 5v5',
    lines: { defense: 1, midfield: 2, attack: 1 },
    forSize: '5v5',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'CB', label: 'Center Back', role: 'DEF', color: '#3B82F6', zone: 'defense-center' },
      { id: 3, name: 'LM', label: 'Left Mid', role: 'MID', color: '#10B981', zone: 'midfield-left' },
      { id: 4, name: 'RM', label: 'Right Mid', role: 'MID', color: '#10B981', zone: 'midfield-right' },
      { id: 5, name: 'ST', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-center' },
    ],
  },
  '2-1-1': {
    name: '2-1-1',
    description: 'Defensive 5v5',
    lines: { defense: 2, midfield: 1, attack: 1 },
    forSize: '5v5',
    positions: [
      { id: 1, name: 'GK', label: 'Goalkeeper', role: 'GK', color: '#F59E0B', zone: 'goal' },
      { id: 2, name: 'LB', label: 'Left Back', role: 'DEF', color: '#3B82F6', zone: 'defense-left' },
      { id: 3, name: 'RB', label: 'Right Back', role: 'DEF', color: '#3B82F6', zone: 'defense-right' },
      { id: 4, name: 'CM', label: 'Center Mid', role: 'MID', color: '#10B981', zone: 'midfield-center' },
      { id: 5, name: 'ST', label: 'Striker', role: 'FWD', color: '#EF4444', zone: 'attack-center' },
    ],
  },
}

// Football offense/defense formations
const FOOTBALL_OFFENSE_FORMATIONS = {
  'i-formation': { name: 'I-Formation', description: 'QB under center, FB and RB stacked' },
  'shotgun': { name: 'Shotgun', description: 'QB in shotgun, 1 RB' },
  'spread': { name: 'Spread', description: '4 WR, 1 RB, shotgun' },
  'single-back': { name: 'Single Back', description: '1 RB, 2 TE' },
}
const FOOTBALL_DEFENSE_FORMATIONS = {
  '4-3': { name: '4-3 Defense', description: '4 DL, 3 LB' },
  '3-4': { name: '3-4 Defense', description: '3 DL, 4 LB' },
  'nickel': { name: 'Nickel', description: '4 DL, 2 LB, 5 DB' },
  'dime': { name: 'Dime', description: '4 DL, 1 LB, 6 DB' },
}

// Football position sets per unit
const FOOTBALL_OFFENSE_POSITIONS = [
  { id: 1, name: 'QB', label: 'Quarterback', role: 'QB', color: '#EF4444', zone: 'backfield-center' },
  { id: 2, name: 'RB1', label: 'Running Back', role: 'RB', color: '#F59E0B', zone: 'backfield-left' },
  { id: 3, name: 'RB2', label: 'Running Back', role: 'RB', color: '#F59E0B', zone: 'backfield-right' },
  { id: 4, name: 'WR1', label: 'Wide Receiver', role: 'WR', color: '#3B82F6', zone: 'split-left' },
  { id: 5, name: 'WR2', label: 'Wide Receiver', role: 'WR', color: '#3B82F6', zone: 'split-right' },
  { id: 6, name: 'TE', label: 'Tight End', role: 'TE', color: '#10B981', zone: 'line-right-end' },
  { id: 7, name: 'LT', label: 'Left Tackle', role: 'OL', color: '#6B7280', zone: 'line-left-tackle' },
  { id: 8, name: 'LG', label: 'Left Guard', role: 'OL', color: '#6B7280', zone: 'line-left-guard' },
  { id: 9, name: 'C', label: 'Center', role: 'C', color: '#8B5CF6', zone: 'line-center' },
  { id: 10, name: 'RG', label: 'Right Guard', role: 'OL', color: '#6B7280', zone: 'line-right-guard' },
  { id: 11, name: 'RT', label: 'Right Tackle', role: 'OL', color: '#6B7280', zone: 'line-right-tackle' },
]
const FOOTBALL_DEFENSE_POSITIONS = [
  { id: 1, name: 'DE1', label: 'Defensive End', role: 'DL', color: '#EF4444', zone: 'dline-left' },
  { id: 2, name: 'DT1', label: 'Defensive Tackle', role: 'DL', color: '#EF4444', zone: 'dline-left-center' },
  { id: 3, name: 'DT2', label: 'Defensive Tackle', role: 'DL', color: '#EF4444', zone: 'dline-right-center' },
  { id: 4, name: 'DE2', label: 'Defensive End', role: 'DL', color: '#EF4444', zone: 'dline-right' },
  { id: 5, name: 'OLB1', label: 'Outside LB', role: 'LB', color: '#F59E0B', zone: 'lb-left' },
  { id: 6, name: 'MLB', label: 'Middle LB', role: 'LB', color: '#F59E0B', zone: 'lb-center' },
  { id: 7, name: 'OLB2', label: 'Outside LB', role: 'LB', color: '#F59E0B', zone: 'lb-right' },
  { id: 8, name: 'CB1', label: 'Cornerback', role: 'DB', color: '#3B82F6', zone: 'secondary-left' },
  { id: 9, name: 'CB2', label: 'Cornerback', role: 'DB', color: '#3B82F6', zone: 'secondary-right' },
  { id: 10, name: 'FS', label: 'Free Safety', role: 'DB', color: '#10B981', zone: 'secondary-deep-left' },
  { id: 11, name: 'SS', label: 'Strong Safety', role: 'DB', color: '#10B981', zone: 'secondary-deep-right' },
]
const FOOTBALL_SPECIAL_TEAMS_POSITIONS = [
  { id: 1, name: 'K', label: 'Kicker', role: 'K', color: '#8B5CF6', zone: 'kicker' },
  { id: 2, name: 'P', label: 'Punter', role: 'P', color: '#8B5CF6', zone: 'punter' },
  { id: 3, name: 'LS', label: 'Long Snapper', role: 'LS', color: '#6B7280', zone: 'snapper' },
  { id: 4, name: 'H', label: 'Holder', role: 'H', color: '#6B7280', zone: 'holder' },
  { id: 5, name: 'KR', label: 'Kick Returner', role: 'KR', color: '#3B82F6', zone: 'returner' },
  { id: 6, name: 'PR', label: 'Punt Returner', role: 'PR', color: '#3B82F6', zone: 'punt-returner' },
]

// Flag football formations
const FLAG_FOOTBALL_FORMATIONS = {
  'standard': {
    name: 'Standard',
    description: '2 WR, 1 C, 1 QB, 1 RB',
    positions: [
      { id: 1, name: 'QB', label: 'Quarterback', role: 'QB', color: '#EF4444', zone: 'backfield' },
      { id: 2, name: 'C', label: 'Center', role: 'C', color: '#8B5CF6', zone: 'line-center' },
      { id: 3, name: 'WR1', label: 'Wide Receiver', role: 'WR', color: '#3B82F6', zone: 'split-left' },
      { id: 4, name: 'WR2', label: 'Wide Receiver', role: 'WR', color: '#3B82F6', zone: 'split-right' },
      { id: 5, name: 'RB', label: 'Running Back', role: 'RB', color: '#F59E0B', zone: 'backfield-right' },
    ],
  },
  'trips-left': { name: 'Trips Left', description: '3 receivers left side' },
  'trips-right': { name: 'Trips Right', description: '3 receivers right side' },
}

// ============================================
// MAIN SPORT CONFIGS
// ============================================
export const SPORT_CONFIGS = {
  volleyball: {
    name: 'Volleyball',
    icon: '🏐',
    starterCount: 6,
    fieldType: 'volleyball-court',
    hasRotations: true,
    rotationCount: 6,
    hasLibero: true,
    hasSets: true,
    maxSets: 5,
    hasBattingOrder: false,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Set',
      namePlural: 'Sets',
      abbrev: 'S',
      count: 3,
      max: 5,
    },
    subRules: {
      type: 'paired',
      maxPerPeriod: 12,
      reEntry: true,
      deadBallOnly: true,
    },
    formations: VOLLEYBALL_FORMATIONS,
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
    fieldType: 'basketball-court',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: false,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Quarter',
      namePlural: 'Quarters',
      abbrev: 'Q',
      count: 4,
      max: 4,
    },
    subRules: {
      type: 'unlimited',
      maxPerPeriod: null,
      reEntry: true,
      deadBallOnly: true,
    },
    formations: BASKETBALL_FORMATIONS,
    positions: [
      { id: 1, name: 'PG', label: 'Point Guard' },
      { id: 2, name: 'SG', label: 'Shooting Guard' },
      { id: 3, name: 'SF', label: 'Small Forward' },
      { id: 4, name: 'PF', label: 'Power Forward' },
      { id: 5, name: 'C', label: 'Center' },
    ],
    statCategories: ['fgm', 'fga', 'three_pm', 'three_pa', 'ftm', 'fta', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls'],
  },

  baseball: {
    name: 'Baseball',
    icon: '⚾',
    starterCount: 9,
    fieldType: 'baseball-diamond',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: true,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Inning',
      namePlural: 'Innings',
      abbrev: 'Inn',
      count: 6,
      max: 9,
    },
    subRules: {
      type: 'permanent',
      maxPerPeriod: null,
      reEntry: false,
      deadBallOnly: true,
    },
    battingOrder: {
      slots: 9,
      hasDH: true,
    },
    formations: BASEBALL_FORMATIONS,
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
    fieldType: 'baseball-diamond',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: true,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Inning',
      namePlural: 'Innings',
      abbrev: 'Inn',
      count: 6,
      max: 7,
    },
    subRules: {
      type: 'permanent',
      maxPerPeriod: null,
      reEntry: true,
      deadBallOnly: true,
    },
    battingOrder: {
      slots: 9,
      hasDH: false,
    },
    formations: BASEBALL_FORMATIONS,
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

  soccer: {
    name: 'Soccer',
    icon: '⚽',
    starterCount: 11,
    fieldType: 'soccer-pitch',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: false,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Half',
      namePlural: 'Halves',
      abbrev: 'H',
      count: 2,
      max: 2,
    },
    subRules: {
      type: 'limited',
      maxPerPeriod: null,
      maxPerGame: 5,
      reEntry: false,
      deadBallOnly: false,
    },
    formatSizes: {
      '5v5':  { starters: 5,  gk: true, label: '5v5 (U6-U8)' },
      '6v6':  { starters: 6,  gk: true, label: '6v6 (Indoor)' },
      '7v7':  { starters: 7,  gk: true, label: '7v7 (U9-U10)' },
      '8v8':  { starters: 8,  gk: true, label: '8v8 (U11-U12)' },
      '9v9':  { starters: 9,  gk: true, label: '9v9 (U13)' },
      '10v10': { starters: 10, gk: true, label: '10v10' },
      '11v11': { starters: 11, gk: true, label: '11v11 (U14+)' },
    },
    formations: SOCCER_FORMATIONS,
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

  football: {
    name: 'Football',
    icon: '🏈',
    starterCount: 11,
    fieldType: 'football-field',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: false,
    hasDepthChart: true,
    hasMultipleUnits: true,
    units: ['offense', 'defense', 'special_teams'],
    timePeriod: {
      name: 'Quarter',
      namePlural: 'Quarters',
      abbrev: 'Q',
      count: 4,
      max: 4,
    },
    subRules: {
      type: 'platoon',
      maxPerPeriod: null,
      reEntry: true,
      deadBallOnly: true,
    },
    offensePositions: FOOTBALL_OFFENSE_POSITIONS,
    defensePositions: FOOTBALL_DEFENSE_POSITIONS,
    specialTeamsPositions: FOOTBALL_SPECIAL_TEAMS_POSITIONS,
    formations: {
      offense: FOOTBALL_OFFENSE_FORMATIONS,
      defense: FOOTBALL_DEFENSE_FORMATIONS,
    },
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

  flag_football: {
    name: 'Flag Football',
    icon: '🏳️',
    starterCount: 5,
    fieldType: 'football-field',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: false,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Half',
      namePlural: 'Halves',
      abbrev: 'H',
      count: 2,
      max: 2,
    },
    subRules: {
      type: 'unlimited',
      maxPerPeriod: null,
      reEntry: true,
      deadBallOnly: true,
    },
    formatSizes: {
      '5v5': { starters: 5, label: '5v5 (NFL FLAG Standard)' },
      '6v6': { starters: 6, label: '6v6 (Indoor)' },
      '7v7': { starters: 7, label: '7v7 (Competitive)' },
    },
    formations: FLAG_FOOTBALL_FORMATIONS,
    positions: [
      { id: 1, name: 'QB', label: 'Quarterback' },
      { id: 2, name: 'C', label: 'Center' },
      { id: 3, name: 'WR', label: 'Wide Receiver' },
      { id: 4, name: 'WR', label: 'Wide Receiver' },
      { id: 5, name: 'RB', label: 'Running Back' },
    ],
    statCategories: ['pass_attempts', 'completions', 'passing_yards', 'passing_tds', 'interceptions', 'rush_attempts', 'rushing_yards', 'rushing_tds', 'receptions', 'targets', 'receiving_yards', 'receiving_tds', 'tackles', 'flag_pulls'],
  },

  hockey: {
    name: 'Hockey',
    icon: '🏒',
    starterCount: 6,
    fieldType: 'hockey-rink',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasSets: false,
    hasBattingOrder: false,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Period',
      namePlural: 'Periods',
      abbrev: 'P',
      count: 3,
      max: 3,
    },
    subRules: {
      type: 'unlimited',
      maxPerPeriod: null,
      reEntry: true,
      deadBallOnly: false,
    },
    formations: {
      'standard': {
        name: 'Standard',
        positions: [
          { id: 1, name: 'G', label: 'Goalie', role: 'G', color: '#F59E0B' },
          { id: 2, name: 'LD', label: 'Left Defense', role: 'D', color: '#3B82F6' },
          { id: 3, name: 'RD', label: 'Right Defense', role: 'D', color: '#3B82F6' },
          { id: 4, name: 'LW', label: 'Left Wing', role: 'FWD', color: '#10B981' },
          { id: 5, name: 'C', label: 'Center', role: 'C', color: '#8B5CF6' },
          { id: 6, name: 'RW', label: 'Right Wing', role: 'FWD', color: '#EF4444' },
        ],
      },
    },
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
  const key = sport?.toLowerCase()?.replace(/[\s-]+/g, '_') || 'volleyball'
  return SPORT_CONFIGS[key] || SPORT_CONFIGS[sport?.toLowerCase()?.replace(/\s+/g, '')] || SPORT_CONFIGS.volleyball
}

// Get positions for a specific formation
export function getFormationPositions(sport, formationType) {
  const config = getSportConfig(sport)
  if (!config.formations) return config.positions || []
  const formation = config.formations[formationType]
  return formation?.positions || config.positions || []
}

// Get positions for a football unit
export function getUnitPositions(unit) {
  const config = SPORT_CONFIGS.football
  switch (unit) {
    case 'offense': return config.offensePositions
    case 'defense': return config.defensePositions
    case 'special_teams': return config.specialTeamsPositions
    default: return config.offensePositions
  }
}

// Get formations filtered by format size (for soccer)
export function getFormationsForSize(sport, formatSize) {
  const config = getSportConfig(sport)
  if (!config.formations) return {}
  return Object.fromEntries(
    Object.entries(config.formations).filter(([, f]) => !f.forSize || f.forSize === formatSize)
  )
}
