// =============================================================================
// PlayerProfileConstants — sport positions, uniform configs, size options
// Extracted from PlayerProfilePage.jsx
// =============================================================================

export const SPORT_POSITIONS = {
  volleyball: ['Outside Hitter', 'Middle Blocker', 'Setter', 'Libero', 'Opposite', 'Defensive Specialist', 'Right Side'],
  basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield'],
  softball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield'],
  football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Defensive Back', 'Kicker'],
  'flag football': ['Quarterback', 'Running Back', 'Wide Receiver', 'Center', 'Rusher', 'Defensive Back'],
  hockey: ['Goalie', 'Defense', 'Center', 'Wing'],
}

export const SPORT_UNIFORM_PIECES = {
  volleyball:      { top: 'Jersey', bottom: 'Shorts', extras: [] },
  basketball:      { top: 'Jersey', bottom: 'Shorts', extras: [] },
  soccer:          { top: 'Jersey', bottom: 'Shorts', extras: ['Socks'] },
  baseball:        { top: 'Jersey', bottom: 'Pants', extras: ['Cap'] },
  softball:        { top: 'Jersey', bottom: 'Pants', extras: ['Cap'] },
  football:        { top: 'Jersey', bottom: 'Pants', extras: [] },
  'flag football': { top: 'Jersey', bottom: 'Shorts', extras: [] },
  hockey:          { top: 'Jersey', bottom: 'Breezers', extras: ['Socks'] },
  lacrosse:        { top: 'Jersey', bottom: 'Shorts', extras: [] },
  wrestling:       { top: 'Singlet', bottom: null, extras: ['Headgear'] },
  swimming:        { top: 'Swimsuit', bottom: null, extras: ['Cap'] },
  cheerleading:    { top: 'Top', bottom: 'Skirt', extras: [] },
  track:           { top: 'Singlet', bottom: 'Shorts', extras: [] },
  tennis:          { top: 'Shirt', bottom: 'Shorts/Skirt', extras: [] },
  golf:            { top: 'Polo', bottom: null, extras: ['Cap'] },
}

export const SIZE_OPTIONS = {
  standard: [
    { group: 'Youth', options: [
      { value: 'YXS', label: 'Youth XS' }, { value: 'YS', label: 'Youth S' }, { value: 'YM', label: 'Youth M' },
      { value: 'YL', label: 'Youth L' }, { value: 'YXL', label: 'Youth XL' },
    ]},
    { group: 'Adult', options: [
      { value: 'AS', label: 'Adult S' }, { value: 'AM', label: 'Adult M' }, { value: 'AL', label: 'Adult L' },
      { value: 'AXL', label: 'Adult XL' }, { value: 'A2XL', label: 'Adult 2XL' },
    ]},
  ],
  hat: [
    { group: 'Fitted', options: [
      { value: 'S/M', label: 'S/M' }, { value: 'M/L', label: 'M/L' }, { value: 'L/XL', label: 'L/XL' },
    ]},
    { group: 'Adjustable', options: [
      { value: 'Youth-Adj', label: 'Youth Adjustable' }, { value: 'Adult-Adj', label: 'Adult Adjustable' },
    ]},
  ],
  socks: [
    { group: 'Sizes', options: [
      { value: 'YS', label: 'Youth S (1-4)' }, { value: 'YM', label: 'Youth M (4-8)' },
      { value: 'AS', label: 'Adult S (5-7)' }, { value: 'AM', label: 'Adult M (7-10)' },
      { value: 'AL', label: 'Adult L (10-13)' },
    ]},
  ],
  oneSize: [
    { group: 'Sizes', options: [
      { value: 'Youth', label: 'Youth' }, { value: 'Adult', label: 'Adult' },
    ]},
  ],
}

export function getSizeOptionsForPiece(pieceName) {
  const lower = pieceName.toLowerCase()
  if (lower === 'cap' || lower === 'hat') return SIZE_OPTIONS.hat
  if (lower === 'socks') return SIZE_OPTIONS.socks
  if (lower === 'headgear') return SIZE_OPTIONS.oneSize
  return SIZE_OPTIONS.standard
}

export function getUniformConfig(sport) {
  return SPORT_UNIFORM_PIECES[sport?.toLowerCase()] || SPORT_UNIFORM_PIECES.volleyball
}
