# CC-LINEUP-MULTISPORT.md
# Lynx Web Admin — Multi-Sport Lineup Builder Extension
# PHASED EXECUTION SPEC

**Type:** Feature Extension  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`  
**Prerequisite:** All lineup V2 bugfix rounds (R1-R3) must be complete and stable. The volleyball lineup builder must be fully functional.

---

## READ FIRST
1. CLAUDE.md
2. LINEUP-BUILDER-INVESTIGATION-REPORT.md
3. `src/constants/sportConfigs.js` — the consolidated sport configs from Phase 1 of the original lineup spec
4. `src/components/games/lineup-v2/` — all existing V2 lineup components
5. This spec

---

## OVERVIEW

Extend the existing Lineup Builder V2 to support **Basketball**, **Baseball/Softball**, **Soccer**, and **Football (tackle + flag)**. The builder shell (HeaderBar, RightPanel, ControlBar, save/load, templates) stays the same. The sport-specific pieces — court visualization, position configs, time periods, substitution rules, and formation systems — are provided by a **sport adapter layer**.

**Core principle:** The lineup builder renders based on `sport` prop (which comes from the team's season sport). A volleyball coach ONLY sees volleyball. A basketball coach ONLY sees basketball. There is no sport picker inside the lineup builder — it's determined by context.

**Architecture:**

```
LineupBuilderV2.jsx (unchanged shell)
├── HeaderBar.jsx (minor changes: time period labels adapt per sport)
├── CourtView.jsx → SportFieldView.jsx (RENAMED: renders sport-specific field)
│   ├── VolleyballCourt.jsx (extracted from current CourtView)
│   ├── BasketballCourt.jsx (new)
│   ├── BaseballDiamond.jsx (new)
│   ├── SoccerPitch.jsx (new)
│   └── FootballField.jsx (new)
├── RightPanel.jsx (minor changes: tabs adapt per sport)
├── ControlBar.jsx (adapts: rotation controls only for volleyball)
└── Sport Adapter: src/constants/sportConfigs.js (extended)
```

**What adapts per sport:**

| Feature | Volleyball | Basketball | Baseball/Softball | Soccer | Football |
|---------|-----------|------------|-------------------|--------|----------|
| Playing surface | Court (6 zones) | Half-court | Diamond | Full pitch | Field (2 sides) |
| Starter count | 6 | 5 | 9 | 5-11 (varies) | 11 per side |
| Time periods | Sets (1-5) | Quarters (1-4) | Innings (1-7) | Halves (1-2) | Quarters (1-4) |
| Time period label | "Set" | "Quarter" | "Inning" | "Half" | "Quarter" |
| Rotations | Yes (1-6, clockwise) | No | No | No | No |
| Formations | 5-1, 6-2, 4-2, 6-6 | Man, Zone, Motion | Standard | 4-4-2, 4-3-3, 3-5-2, etc. | Offensive/Defensive schemes |
| Sub rules | 12/set (paired) | Unlimited (dead ball) | Permanent (re-entry varies) | 3-5 or unlimited | Platoon (offense/defense separate) |
| Libero | Yes | No | No | No | No |
| Batting order | No | No | Yes (1-9) | No | No |
| Depth chart | No | No | No | No | Yes (starter + backup per position) |
| Multiple units | No | No | No | No | Yes (Offense, Defense, Special Teams) |

---

## PHASE 1: Sport Adapter Layer + Field Component Refactor
**Commit message prefix:** `feat(lineup-multisport): phase 1 —`

### 1A. Extend sportConfigs.js

**File: `src/constants/sportConfigs.js`**

Add complete configurations for each sport. The existing volleyball config stays. Add:

```javascript
export const SPORT_CONFIGS = {
  volleyball: {
    // ... existing config (unchanged)
  },

  basketball: {
    name: 'Basketball',
    icon: '🏀',
    starterCount: 5,
    fieldType: 'basketball-court',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
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
      type: 'unlimited',       // unlimited, paired, permanent, platoon
      maxPerPeriod: null,       // null = unlimited
      reEntry: true,            // can a subbed-out player return?
      deadBallOnly: true,       // subs only on dead balls?
    },
    positions: [
      { id: 'pg', name: 'PG', label: 'Point Guard', color: '#3B82F6', zone: 'backcourt-center' },
      { id: 'sg', name: 'SG', label: 'Shooting Guard', color: '#10B981', zone: 'backcourt-right' },
      { id: 'sf', name: 'SF', label: 'Small Forward', color: '#F59E0B', zone: 'frontcourt-right' },
      { id: 'pf', name: 'PF', label: 'Power Forward', color: '#EF4444', zone: 'frontcourt-left' },
      { id: 'c', name: 'C', label: 'Center', color: '#8B5CF6', zone: 'paint' },
    ],
    formations: {
      'standard': {
        name: 'Standard',
        description: 'Default 5-position setup',
        positions: null, // uses default positions above
      },
    },
  },

  baseball: {
    name: 'Baseball',
    icon: '⚾',
    starterCount: 9,
    fieldType: 'baseball-diamond',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasBattingOrder: true,
    hasDepthChart: false,
    hasMultipleUnits: false,
    timePeriod: {
      name: 'Inning',
      namePlural: 'Innings',
      abbrev: 'Inn',
      count: 6,       // youth default
      max: 9,
    },
    subRules: {
      type: 'permanent',
      maxPerPeriod: null,
      reEntry: false,          // standard rules: no re-entry once subbed
      deadBallOnly: true,
    },
    positions: [
      { id: 'p', name: 'P', label: 'Pitcher', color: '#EF4444', zone: 'mound' },
      { id: 'c', name: 'C', label: 'Catcher', color: '#8B5CF6', zone: 'home' },
      { id: '1b', name: '1B', label: 'First Base', color: '#3B82F6', zone: 'first' },
      { id: '2b', name: '2B', label: 'Second Base', color: '#10B981', zone: 'second' },
      { id: '3b', name: '3B', label: 'Third Base', color: '#F59E0B', zone: 'third' },
      { id: 'ss', name: 'SS', label: 'Shortstop', color: '#06B6D4', zone: 'short' },
      { id: 'lf', name: 'LF', label: 'Left Field', color: '#84CC16', zone: 'left-field' },
      { id: 'cf', name: 'CF', label: 'Center Field', color: '#22C55E', zone: 'center-field' },
      { id: 'rf', name: 'RF', label: 'Right Field', color: '#14B8A6', zone: 'right-field' },
    ],
    formations: {
      'standard': { name: 'Standard 9', description: 'Standard 9-position defense' },
    },
    battingOrder: {
      slots: 9,
      hasDH: true,   // Designated Hitter option
    },
  },

  softball: {
    name: 'Softball',
    icon: '🥎',
    // Inherits most of baseball config
    starterCount: 9,
    fieldType: 'baseball-diamond',  // same diamond, just cosmetic differences
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
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
      reEntry: true,           // many youth softball leagues allow re-entry
      deadBallOnly: true,
    },
    positions: [
      // Same as baseball
      { id: 'p', name: 'P', label: 'Pitcher', color: '#EF4444', zone: 'mound' },
      { id: 'c', name: 'C', label: 'Catcher', color: '#8B5CF6', zone: 'home' },
      { id: '1b', name: '1B', label: 'First Base', color: '#3B82F6', zone: 'first' },
      { id: '2b', name: '2B', label: 'Second Base', color: '#10B981', zone: 'second' },
      { id: '3b', name: '3B', label: 'Third Base', color: '#F59E0B', zone: 'third' },
      { id: 'ss', name: 'SS', label: 'Shortstop', color: '#06B6D4', zone: 'short' },
      { id: 'lf', name: 'LF', label: 'Left Field', color: '#84CC16', zone: 'left-field' },
      { id: 'cf', name: 'CF', label: 'Center Field', color: '#22C55E', zone: 'center-field' },
      { id: 'rf', name: 'RF', label: 'Right Field', color: '#14B8A6', zone: 'right-field' },
    ],
    formations: {
      'standard': { name: 'Standard 9', description: 'Standard 9-position defense' },
    },
    battingOrder: {
      slots: 9,
      hasDH: false,
    },
  },

  soccer: {
    name: 'Soccer',
    icon: '⚽',
    starterCount: 11,       // default, overridden by formatSize
    fieldType: 'soccer-pitch',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
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
      maxPerGame: 5,           // competitive default, configurable
      reEntry: false,          // competitive: no re-entry. Rec: yes
      deadBallOnly: false,
    },
    // Format sizes for youth soccer
    formatSizes: {
      '5v5':  { starters: 5,  gk: true, label: '5v5 (U6-U8)' },
      '6v6':  { starters: 6,  gk: true, label: '6v6 (Indoor)' },
      '7v7':  { starters: 7,  gk: true, label: '7v7 (U9-U10)' },
      '8v8':  { starters: 8,  gk: true, label: '8v8 (U11-U12)' },
      '9v9':  { starters: 9,  gk: true, label: '9v9 (U13)' },
      '10v10': { starters: 10, gk: true, label: '10v10' },
      '11v11': { starters: 11, gk: true, label: '11v11 (U14+)' },
    },
    // Positions are dynamic based on formation
    // Base positions for 11v11:
    positions: [
      { id: 'gk', name: 'GK', label: 'Goalkeeper', color: '#F59E0B', zone: 'goal' },
      { id: 'lb', name: 'LB', label: 'Left Back', color: '#3B82F6', zone: 'defense-left' },
      { id: 'cb1', name: 'CB', label: 'Center Back', color: '#3B82F6', zone: 'defense-center-left' },
      { id: 'cb2', name: 'CB', label: 'Center Back', color: '#3B82F6', zone: 'defense-center-right' },
      { id: 'rb', name: 'RB', label: 'Right Back', color: '#3B82F6', zone: 'defense-right' },
      { id: 'lm', name: 'LM', label: 'Left Mid', color: '#10B981', zone: 'midfield-left' },
      { id: 'cm1', name: 'CM', label: 'Center Mid', color: '#10B981', zone: 'midfield-center-left' },
      { id: 'cm2', name: 'CM', label: 'Center Mid', color: '#10B981', zone: 'midfield-center-right' },
      { id: 'rm', name: 'RM', label: 'Right Mid', color: '#10B981', zone: 'midfield-right' },
      { id: 'ls', name: 'LS', label: 'Left Striker', color: '#EF4444', zone: 'attack-left' },
      { id: 'rs', name: 'RS', label: 'Right Striker', color: '#EF4444', zone: 'attack-right' },
    ],
    formations: {
      '4-4-2': {
        name: '4-4-2',
        description: '4 defenders, 4 midfielders, 2 forwards',
        lines: { defense: 4, midfield: 4, attack: 2 },
        forSize: '11v11',
      },
      '4-3-3': {
        name: '4-3-3',
        description: '4 defenders, 3 midfielders, 3 forwards',
        lines: { defense: 4, midfield: 3, attack: 3 },
        forSize: '11v11',
      },
      '3-5-2': {
        name: '3-5-2',
        description: '3 defenders, 5 midfielders, 2 forwards',
        lines: { defense: 3, midfield: 5, attack: 2 },
        forSize: '11v11',
      },
      '4-2-3-1': {
        name: '4-2-3-1',
        description: '4 defenders, 2 holding mids, 3 attacking mids, 1 striker',
        lines: { defense: 4, holding: 2, attacking: 3, striker: 1 },
        forSize: '11v11',
      },
      '3-2-1': {
        name: '3-2-1',
        description: 'Standard 7v7',
        lines: { defense: 3, midfield: 2, attack: 1 },
        forSize: '7v7',
      },
      '2-3-1': {
        name: '2-3-1',
        description: 'Attacking 7v7',
        lines: { defense: 2, midfield: 3, attack: 1 },
        forSize: '7v7',
      },
      '2-1-2': {
        name: '2-1-2',
        description: 'Standard 6v6',
        lines: { defense: 2, midfield: 1, attack: 2 },
        forSize: '6v6',
      },
      '1-2-1': {
        name: '1-2-1',
        description: 'Standard 5v5',
        lines: { defense: 1, midfield: 2, attack: 1 },
        forSize: '5v5',
      },
      '2-1-1': {
        name: '2-1-1',
        description: 'Defensive 5v5',
        lines: { defense: 2, midfield: 1, attack: 1 },
        forSize: '5v5',
      },
    },
  },

  football: {
    name: 'Football',
    icon: '🏈',
    starterCount: 11,
    fieldType: 'football-field',
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
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
      type: 'platoon',          // full-unit substitution on change of possession
      maxPerPeriod: null,
      reEntry: true,
      deadBallOnly: true,
    },
    // Positions per unit
    offensePositions: [
      { id: 'qb', name: 'QB', label: 'Quarterback', color: '#EF4444', zone: 'backfield-center' },
      { id: 'rb1', name: 'RB', label: 'Running Back', color: '#F59E0B', zone: 'backfield-left' },
      { id: 'rb2', name: 'RB', label: 'Running Back', color: '#F59E0B', zone: 'backfield-right' },
      { id: 'wr1', name: 'WR', label: 'Wide Receiver', color: '#3B82F6', zone: 'split-left' },
      { id: 'wr2', name: 'WR', label: 'Wide Receiver', color: '#3B82F6', zone: 'split-right' },
      { id: 'te', name: 'TE', label: 'Tight End', color: '#10B981', zone: 'line-right-end' },
      { id: 'lt', name: 'LT', label: 'Left Tackle', color: '#6B7280', zone: 'line-left-tackle' },
      { id: 'lg', name: 'LG', label: 'Left Guard', color: '#6B7280', zone: 'line-left-guard' },
      { id: 'c', name: 'C', label: 'Center', color: '#8B5CF6', zone: 'line-center' },
      { id: 'rg', name: 'RG', label: 'Right Guard', color: '#6B7280', zone: 'line-right-guard' },
      { id: 'rt', name: 'RT', label: 'Right Tackle', color: '#6B7280', zone: 'line-right-tackle' },
    ],
    defensePositions: [
      { id: 'de1', name: 'DE', label: 'Defensive End', color: '#EF4444', zone: 'dline-left' },
      { id: 'dt1', name: 'DT', label: 'Defensive Tackle', color: '#EF4444', zone: 'dline-left-center' },
      { id: 'dt2', name: 'DT', label: 'Defensive Tackle', color: '#EF4444', zone: 'dline-right-center' },
      { id: 'de2', name: 'DE', label: 'Defensive End', color: '#EF4444', zone: 'dline-right' },
      { id: 'olb1', name: 'OLB', label: 'Outside LB', color: '#F59E0B', zone: 'lb-left' },
      { id: 'mlb', name: 'MLB', label: 'Middle LB', color: '#F59E0B', zone: 'lb-center' },
      { id: 'olb2', name: 'OLB', label: 'Outside LB', color: '#F59E0B', zone: 'lb-right' },
      { id: 'cb1', name: 'CB', label: 'Cornerback', color: '#3B82F6', zone: 'secondary-left' },
      { id: 'cb2', name: 'CB', label: 'Cornerback', color: '#3B82F6', zone: 'secondary-right' },
      { id: 'fs', name: 'FS', label: 'Free Safety', color: '#10B981', zone: 'secondary-deep-left' },
      { id: 'ss', name: 'SS', label: 'Strong Safety', color: '#10B981', zone: 'secondary-deep-right' },
    ],
    specialTeamsPositions: [
      { id: 'k', name: 'K', label: 'Kicker', color: '#8B5CF6', zone: 'kicker' },
      { id: 'p', name: 'P', label: 'Punter', color: '#8B5CF6', zone: 'punter' },
      { id: 'ls', name: 'LS', label: 'Long Snapper', color: '#6B7280', zone: 'snapper' },
      { id: 'h', name: 'H', label: 'Holder', color: '#6B7280', zone: 'holder' },
      { id: 'kr', name: 'KR', label: 'Kick Returner', color: '#3B82F6', zone: 'returner' },
      { id: 'pr', name: 'PR', label: 'Punt Returner', color: '#3B82F6', zone: 'punt-returner' },
    ],
    formations: {
      offense: {
        'i-formation': { name: 'I-Formation', description: 'QB under center, FB and RB stacked' },
        'shotgun': { name: 'Shotgun', description: 'QB in shotgun, 1 RB' },
        'spread': { name: 'Spread', description: '4 WR, 1 RB, shotgun' },
        'single-back': { name: 'Single Back', description: '1 RB, 2 TE' },
      },
      defense: {
        '4-3': { name: '4-3 Defense', description: '4 DL, 3 LB' },
        '3-4': { name: '3-4 Defense', description: '3 DL, 4 LB' },
        'nickel': { name: 'Nickel', description: '4 DL, 2 LB, 5 DB' },
        'dime': { name: 'Dime', description: '4 DL, 1 LB, 6 DB' },
      },
    },
  },

  flag_football: {
    name: 'Flag Football',
    icon: '🏳️',
    starterCount: 5,         // default, overridden by formatSize
    fieldType: 'football-field',   // same field, smaller
    hasRotations: false,
    rotationCount: 0,
    hasLibero: false,
    hasBattingOrder: false,
    hasDepthChart: false,
    hasMultipleUnits: false,    // in youth flag, most kids play both ways
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
      '7v7': { starters: 7, label: '7v7 (Competitive)' },
      '6v6': { starters: 6, label: '6v6 (Indoor)' },
    },
    positions: [
      { id: 'qb', name: 'QB', label: 'Quarterback', color: '#EF4444', zone: 'backfield' },
      { id: 'c', name: 'C', label: 'Center', color: '#8B5CF6', zone: 'line-center' },
      { id: 'wr1', name: 'WR', label: 'Wide Receiver', color: '#3B82F6', zone: 'split-left' },
      { id: 'wr2', name: 'WR', label: 'Wide Receiver', color: '#3B82F6', zone: 'split-right' },
      { id: 'rb', name: 'RB', label: 'Running Back', color: '#F59E0B', zone: 'backfield-right' },
    ],
    formations: {
      'standard': { name: 'Standard', description: '2 WR, 1 C, 1 QB, 1 RB' },
      'trips-left': { name: 'Trips Left', description: '3 receivers left side' },
      'trips-right': { name: 'Trips Right', description: '3 receivers right side' },
    },
  },
}
```

### 1B. Rename CourtView to SportFieldView

**Rename** `src/components/games/lineup-v2/CourtView.jsx` → `src/components/games/lineup-v2/SportFieldView.jsx`

This component becomes a **router** that renders the sport-specific field:

```jsx
import VolleyballCourt from './fields/VolleyballCourt'
import BasketballCourt from './fields/BasketballCourt'
import BaseballDiamond from './fields/BaseballDiamond'
import SoccerPitch from './fields/SoccerPitch'
import FootballField from './fields/FootballField'

const FIELD_COMPONENTS = {
  'volleyball-court': VolleyballCourt,
  'basketball-court': BasketballCourt,
  'baseball-diamond': BaseballDiamond,
  'soccer-pitch': SoccerPitch,
  'football-field': FootballField,
}

export default function SportFieldView({ sport, sportConfig, ...props }) {
  const FieldComponent = FIELD_COMPONENTS[sportConfig.fieldType]
  if (!FieldComponent) return <div>Unsupported sport</div>
  return <FieldComponent sportConfig={sportConfig} {...props} />
}
```

**Extract current volleyball code** from CourtView.jsx into `src/components/games/lineup-v2/fields/VolleyballCourt.jsx`. This should be a direct extraction — no logic changes, just moving the code.

Update all imports of `CourtView` to use `SportFieldView` in `LineupBuilderV2.jsx`.

### 1C. Adapt HeaderBar for Sport-Specific Time Periods

**File: `src/components/games/lineup-v2/HeaderBar.jsx`**

Replace hardcoded "Set" labels with dynamic labels from `sportConfig.timePeriod`:

```jsx
// Instead of: "Set 1", "Set 2", "Set 3"
// Use: `${sportConfig.timePeriod.name} ${num}` → "Quarter 1", "Inning 1", "Half 1"

// Instead of: [1] [2] [3] [+]
// Render: sportConfig.timePeriod.count number of period buttons
// Max: sportConfig.timePeriod.max
```

### 1D. Adapt ControlBar for Sport-Specific Controls

**File: `src/components/games/lineup-v2/ControlBar.jsx`**

The control bar should conditionally render based on sport capabilities:

```jsx
// Rotation controls: ONLY show if sportConfig.hasRotations === true
{sportConfig.hasRotations && (
  <RotationControls ... />
)}

// Formation selector: always show, but options come from sportConfig.formations
// For football: show unit tabs (Offense | Defense | Special Teams) INSTEAD of formation dropdown

// For soccer: show format size selector (5v5, 7v7, 8v8, etc.) alongside formation
{sportConfig.formatSizes && (
  <FormatSizeSelector sizes={sportConfig.formatSizes} ... />
)}
```

### 1E. Adapt RightPanel

**File: `src/components/games/lineup-v2/RightPanel.jsx`**

Conditional tabs based on sport:

```jsx
const tabs = [
  { id: 'roster', label: 'Roster' },                                    // all sports
  sportConfig.hasRotations && { id: 'rotations', label: 'Rotations' },  // volleyball only
  { id: 'subs', label: sportConfig.hasMultipleUnits ? 'Depth Chart' : 'Subs' },
  sportConfig.hasBattingOrder && { id: 'batting', label: 'Batting Order' },  // baseball/softball
  { id: 'analytics', label: 'Analytics' },                              // all sports
].filter(Boolean)
```

**For baseball/softball — Batting Order tab:**
A drag-to-reorder list of 9 (or 10 with DH) slots. Each slot shows the player and their batting position (1-9). Coach drags players from roster to batting slots. The batting order is separate from field positions — a player can be #3 in the batting order and play shortstop.

**For football — Depth Chart tab (replaces Subs):**
Shows each position with starter and backup(s). Like the depth chart reference image you shared. Coach can set 1st string and 2nd string for each position.

### Phase 1 Verification

1. Open lineup builder for a volleyball team → sees volleyball court (unchanged behavior)
2. `sportConfigs.js` exports configs for all 6 sports
3. `SportFieldView` renders `VolleyballCourt` for volleyball teams
4. HeaderBar shows "Set" for volleyball, would show "Quarter" for basketball (not testable until Phase 2 field component exists)
5. ControlBar hides rotation controls when `hasRotations === false`
6. No regression on existing volleyball functionality
7. `npm run build` passes

**Commit:** `feat(lineup-multisport): phase 1 — sport adapter layer, field component refactor, config extension`

---

## PHASE 2: Basketball Court
**Commit message prefix:** `feat(lineup-multisport): phase 2 —`

### Create `src/components/games/lineup-v2/fields/BasketballCourt.jsx`

**Visual layout:** A half-court viewed from above. SVG or CSS-drawn with:
- Three-point arc
- Free throw line and lane/paint area
- Center circle (at top edge)
- Basket at bottom center
- 5 position drop zones arranged in standard positions:
  - PG: top of key
  - SG: right wing (outside 3-point line)
  - SF: right corner/wing
  - PF: left high post / elbow area
  - C: low post / paint area

**Theme-aware:** Court surface uses `isDark ? 'hardwood-dark' : 'hardwood-light'` — use warm brown/amber tones for the court surface (not the generic page background), with white/cream lines. This should LOOK like a basketball court.

**Key differences from volleyball:**
- No NET or ATTACK LINE labels
- No rotation controls (ControlBar hides them)
- 5 positions instead of 6
- Time periods are "Quarters" (4 by default)
- Unlimited subs — the Subs tab becomes a simple "Bench" list with the ability to plan per-quarter lineups
- Formation selector shows offensive sets if needed (or just "Standard" for youth)

**Player cards:** Same photo-card treatment as volleyball. Drag from roster to position slots.

**Verify:** Open lineup builder for a basketball team → sees half-court with 5 positions. Can drag players. Can set per-quarter lineups. Header shows "Q1", "Q2", etc.

**Commit:** `feat(lineup-multisport): phase 2 — basketball court with quarter-based lineups`

---

## PHASE 3: Baseball/Softball Diamond
**Commit message prefix:** `feat(lineup-multisport): phase 3 —`

### Create `src/components/games/lineup-v2/fields/BaseballDiamond.jsx`

**Visual layout:** A baseball diamond viewed from above/behind home plate. SVG or CSS-drawn with:
- Diamond infield (bases at corners)
- Pitcher's mound (center)
- Home plate area with catcher position
- Outfield arc
- Foul lines extending to outfield
- 9 position drop zones at their standard field locations:
  - P: pitcher's mound
  - C: behind home plate
  - 1B: near first base
  - 2B: between first and second
  - SS: between second and third
  - 3B: near third base
  - LF: left field
  - CF: center field
  - RF: right field

**Theme-aware:** Diamond surface uses green (grass) for outfield and tan/brown for infield dirt. Lines in white/chalk. Should LOOK like a baseball field.

**Key differences from volleyball:**
- **Batting order** is the primary lineup feature, not field positions. The RightPanel Batting Order tab is essential.
- **Per-inning lineups**: coaches may change field positions by inning (e.g., a player pitches inning 1-3, then plays outfield innings 4-6)
- **Pitching rotation**: the Subs tab should highlight pitcher changes as a distinct action
- No rotations
- Time periods are "Innings" (6 by default for youth, configurable up to 9)
- DH option: if enabled, adds a 10th batting slot where the DH bats for the pitcher

**Batting Order tab layout:**
```
BATTING ORDER
┌──────────────────────────────┐
│ 1. [Photo] #7 Sarah  — SS   │
│ 2. [Photo] #12 Maya  — CF   │
│ 3. [Photo] #3 Emma   — 1B   │
│ 4. [Photo] #1 Ava    — P    │
│ 5. [Photo] #9 Sophia — 3B   │
│ 6. [Photo] #5 Mia    — LF   │
│ 7. [Photo] #14 Char  — 2B   │
│ 8. [Photo] #10 Play  — RF   │
│ 9. [Photo] #2 Chloe  — C    │
│ DH: [Photo] #11 Test — DH   │
└──────────────────────────────┘
[Drag to reorder]
```

**Verify:** Open lineup builder for a baseball/softball team → sees diamond. Can assign players to field positions. Can set batting order via drag-and-drop. Can set per-inning lineups. DH toggle works.

**Commit:** `feat(lineup-multisport): phase 3 — baseball/softball diamond with batting order`

---

## PHASE 4: Soccer Pitch
**Commit message prefix:** `feat(lineup-multisport): phase 4 —`

### Create `src/components/games/lineup-v2/fields/SoccerPitch.jsx`

**Visual layout:** A full soccer pitch viewed from above (or half-pitch oriented vertically). SVG or CSS-drawn with:
- Full pitch outline
- Center circle
- Penalty areas at each end
- Goal areas
- Position drop zones that dynamically arrange based on formation

**Format size selector:** Before the coach can set a formation, they choose the game format (5v5, 7v7, 8v8, 9v9, 11v11). This determines:
- How many position slots appear
- Which formations are available
- The goalkeeper is always present (1 GK + the rest as outfield players)

**Dynamic position generation from formation:**

When a coach selects "4-4-2" for 11v11:
- GK: 1 (always)
- Defense line: 4 (LB, CB, CB, RB)
- Midfield line: 4 (LM, CM, CM, RM)
- Attack line: 2 (LS, RS)

When they select "3-2-1" for 7v7:
- GK: 1
- Defense: 3
- Midfield: 2
- Attack: 1

The position slots arrange on the pitch in horizontal lines corresponding to their line (defense, midfield, attack), evenly spaced.

**Key differences:**
- Formation is the PRIMARY control. It determines everything about the field layout.
- Time periods are "Halves" (2)
- Subs are limited (3-5 per game in competitive, unlimited in rec — make this a setting on the event or team)
- Per-half lineups

**Verify:** Open lineup builder for a soccer team → sees pitch. Format size selector shows options. Selecting 7v7 shows 7 positions. Selecting "3-2-1" formation arranges positions correctly. Can set per-half lineups.

**Commit:** `feat(lineup-multisport): phase 4 — soccer pitch with format sizes and dynamic formations`

---

## PHASE 5: Football Field (Tackle + Flag)
**Commit message prefix:** `feat(lineup-multisport): phase 5 —`

### Create `src/components/games/lineup-v2/fields/FootballField.jsx`

This is the most complex because it has **multiple units**.

**Visual layout:** A football field section (roughly the 50-to-endzone area). SVG or CSS-drawn with:
- Yard lines (every 5 yards)
- Hash marks
- End zone
- Line of scrimmage
- Position slots arranged by unit

**Unit tabs (tackle football only):**
The ControlBar or HeaderBar gets **unit tabs**: `[Offense] [Defense] [Special Teams]`

Clicking a tab switches the entire field view and position set:
- **Offense tab:** Shows offensive line (5), QB, RBs, WRs, TE — 11 positions total
- **Defense tab:** Shows DL, LBs, DBs — 11 positions total
- **Special Teams tab:** Shows K, P, LS, H, KR, PR — key specialists

Each unit has its own lineup. This means the save function stores lineup data per unit per quarter.

**Depth chart (tackle football):**
In the RightPanel "Depth Chart" tab, each position shows 1st string and 2nd string:
```
QB
  1st: #4 Evans — Jr
  2nd: #9 Motley — Sr

RB
  1st: #45 Rogers — Sr
  2nd: #34 McMillian — So
```

**Flag football:** Much simpler:
- 5v5 or 7v7 format (format size selector, same pattern as soccer)
- No separate offense/defense units (kids play both ways)
- No depth chart
- Standard positions: QB, C, WR, WR, RB (for 5v5)
- Time periods are "Halves" (2)
- Unlimited subs

The field view for flag football is a simplified football field with fewer position slots and no unit tabs.

**Verify:** Open for tackle football team → sees field with unit tabs. Offense shows 11 positions. Switch to Defense → different 11 positions. Switch to Special Teams → specialist positions. Depth chart tab works. Open for flag football team → simplified field, no unit tabs, 5 or 7 positions based on format.

**Commit:** `feat(lineup-multisport): phase 5 — football field with units, depth chart, flag football`

---

## PHASE 6: Save/Load Adaptation + DB
**Commit message prefix:** `feat(lineup-multisport): phase 6 —`

### 6A. Adapt Save/Load for All Sports

The `game_lineups` table already has `formation_type`, `set_number`, `position_role`, and `team_id`. Extend it:

**Migration SQL** (`src/lib/migrations/lineup-multisport-migrations.sql`):
```sql
-- Add columns for multi-sport support
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS unit TEXT;           -- 'offense', 'defense', 'special_teams' (football only)
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS batting_order INTEGER; -- 1-9 (baseball/softball only)
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS format_size TEXT;     -- '5v5', '7v7', '11v11' (soccer/flag only)

-- Add to lineup_metadata for sport-specific data
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS batting_order JSONB DEFAULT '[]';
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS depth_chart JSONB DEFAULT '{}';
ALTER TABLE game_lineup_metadata ADD COLUMN IF NOT EXISTS format_size TEXT;
```

### 6B. Update saveLineup / loadData

In `LineupBuilderV2.jsx`, the save and load functions must include the new columns:

```javascript
// On save, include sport-specific data:
records.push({
  event_id: event.id,
  player_id: playerId,
  rotation_order: positionIndex,
  is_starter: true,
  position: position.name,
  formation_type: formation,
  set_number: currentPeriod,    // renamed from currentSet for clarity
  team_id: team.id,
  position_role: position.name,
  sport: sport,
  unit: currentUnit || null,     // football only
  batting_order: battingSlot || null,  // baseball only
  format_size: formatSize || null,     // soccer/flag only
})
```

### Phase 6 Verification

1. Save a basketball lineup (5 players, Q1) → reopen → loads correctly
2. Save a baseball lineup with batting order → reopen → positions AND batting order load
3. Save a soccer lineup with 7v7 format and 3-2-1 formation → reopen → format and formation restore
4. Save a football lineup for offense AND defense → reopen → both units load with correct positions
5. All sports save templates correctly
6. No regression on volleyball save/load

**Commit:** `feat(lineup-multisport): phase 6 — multi-sport save/load with DB migrations`

---

## FILES SUMMARY

### New Files
| Phase | File |
|-------|------|
| 1 | `src/components/games/lineup-v2/SportFieldView.jsx` |
| 1 | `src/components/games/lineup-v2/fields/VolleyballCourt.jsx` (extracted) |
| 2 | `src/components/games/lineup-v2/fields/BasketballCourt.jsx` |
| 3 | `src/components/games/lineup-v2/fields/BaseballDiamond.jsx` |
| 4 | `src/components/games/lineup-v2/fields/SoccerPitch.jsx` |
| 5 | `src/components/games/lineup-v2/fields/FootballField.jsx` |
| 6 | `src/lib/migrations/lineup-multisport-migrations.sql` |

### Modified Files
| Phase | File | Changes |
|-------|------|---------|
| 1 | `src/constants/sportConfigs.js` | Add configs for all sports |
| 1 | `src/components/games/lineup-v2/LineupBuilderV2.jsx` | Use SportFieldView, pass sportConfig |
| 1 | `src/components/games/lineup-v2/HeaderBar.jsx` | Dynamic time period labels |
| 1 | `src/components/games/lineup-v2/ControlBar.jsx` | Conditional rotation, format size selector |
| 1 | `src/components/games/lineup-v2/RightPanel.jsx` | Conditional tabs (batting order, depth chart) |
| 1 | `src/components/games/lineup-v2/CourtView.jsx` | RENAMED to SportFieldView.jsx |

---

## IMPORTANT RULES FOR CC

1. **The lineup builder MUST render based on the `sport` prop** — no sport picker inside the builder. The sport comes from `team.sport` or `season.sport`.
2. **Volleyball functionality must NOT regress.** After all phases, every volleyball feature must still work exactly as before.
3. **Each field component is self-contained** — it receives `sportConfig`, `lineup`, `roster`, `onDrop`, `onRemove`, `draggedPlayer` as props and renders its own field visualization with drop targets.
4. **Theme-aware always** — all new field components must use `useThemeClasses()`. Field surfaces should look like their real sport surface (hardwood for basketball, grass for soccer, etc.) while still respecting light/dark mode for UI chrome.
5. **Sport surface colors are allowed as hardcoded** — basketball hardwood amber, soccer grass green, baseball grass/dirt, football field green. These are semantic like volleyball position colors. But ALL UI elements (cards, borders, text, panels) use theme tokens.
6. **No new npm dependencies.** All field visualizations use SVG, CSS, or HTML elements.
7. **Test with the sport that the team is configured for** — if you need to test basketball, you need a team/season set up with basketball as the sport.
8. **Football has TWO sub-sports** — `football` (tackle, 11v11, units) and `flag_football` (5v5-7v7, no units). Check for both when rendering.
9. **Run migration SQL manually** after Phase 6 creates the file.
10. **Phase order matters** — Phase 1 (adapter layer) must be done first. Phases 2-5 (individual sports) can technically be done in any order, but do them in the listed order. Phase 6 (save/load) should be last.
