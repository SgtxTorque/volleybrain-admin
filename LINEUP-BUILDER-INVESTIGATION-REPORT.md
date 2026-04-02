# LINEUP BUILDER V2 — INVESTIGATION REPORT

## 1. Executive Summary

The VolleyBrain web admin portal contains **3 distinct Lineup Builder implementations** spanning 3,472 lines of code, a **checkpoint-driven Game Prep system** (3,500+ lines across 16 files), and a mature **practice scheduling system** fully integrated into the existing `schedule_events` infrastructure. The navigation system uses react-router-dom with a sidebar + contextual top bar pattern, and the "Game Day" nav group appears in admin, coach, and team manager roles.

The current `AdvancedLineupBuilder.jsx` (1,257 lines) is a full-featured modal with multi-formation support (5-1, 6-2, 4-2, 6-6), HTML5 native drag-and-drop, rotation visualization, per-set lineups, libero management, and substitution tracking. However, it is **fully hardcoded dark mode** with zero theme system integration — every color is inline hex/rgba. The simpler `LineupPanel.jsx` (150 lines) is used during live game day in the `GameDayCommandCenter`, and the legacy `LineupBuilder.jsx` (302 lines) in the schedule page uses a click-assign grid instead of drag-and-drop.

The database schema has significant gaps: `game_lineups` stores only per-event data (not per-set), formation type (5-1, 6-2) is **never persisted**, there are no `formations`, `lineup_templates`, or `substitutions` tables, and set-level scores are not stored (only final tallies). RLS scoping is missing on game_lineups and game_player_stats. These gaps must be addressed before building a V2 lineup builder.

---

## 2. Current Lineup Builder Architecture

### 2.1 File Map

| File | Location | Lines | Purpose |
|------|----------|-------|---------|
| AdvancedLineupBuilder.jsx | src/components/games/ | 1,257 | Full-featured modal lineup editor with rotations, sets, subs, libero |
| LineupPanel.jsx | src/pages/gameprep/ | 150 | Compact sidebar for game day court + bench display |
| LineupBuilder.jsx | src/pages/schedule/ | 302 | Simple modal for position-based lineup assignment |
| CourtPlayerCard.jsx | src/pages/gameprep/ | 184 | Reusable player card for court visualization with stats overlay |
| GameComponents.jsx | src/components/games/ | 1,399 | Shared SPORT_CONFIGS (8 sports), game cards, stats modal |
| GameDayHelpers.jsx | src/pages/gameprep/ | 180 | Constants, theme, icons, action bar for game day mode |

### 2.2 Component Tree

```
AdvancedLineupBuilder (modal, triggered from GamePrepPage)
├── Formation Selector (dropdown: 5-1, 6-2, 4-2, 6-6)
├── Set Tabs (1-5, with copy-to-all)
├── Court Display
│   ├── Front Row: [P4, P3, P2] (left to right)
│   │   └── CourtSlot (drop target) → PlayerCard or EmptySlot
│   ├── Attack Line (separator)
│   └── Back Row: [P5, P6, P1] (left to right, P1 = serve)
│       └── CourtSlot (drop target) → PlayerCard or EmptySlot
├── Rotation Controls (prev/next/reset, volleyball only)
├── Roster Sidebar (draggable player cards with RSVP status)
├── Libero Selector (toggle grid)
├── Substitutions Panel ({ positionId: benchPlayerId })
└── Save/Clear/Auto-fill Actions

LineupPanel (sidebar, embedded in GameDayCommandCenter)
├── Court Grid (front + back rows)
│   └── CourtPlayerCard (with live stats overlay)
├── Bench Players (draggable)
├── Libero Selector (pre-game only)
└── Rotation Counter (display only, no controls)

LineupBuilder (modal, triggered from SchedulePage)
├── Position Grid (3 cols, click to assign)
├── Player Dropdown (per position)
├── Libero Toggle
└── Save/Clear Actions
```

### 2.3 State Management

**AdvancedLineupBuilder state:**
```javascript
// Data loading
const [roster, setRoster] = useState([])           // All team players
const [rsvps, setRsvps] = useState({})             // { playerId: status }
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)

// Lineup state
const [formation, setFormation] = useState(null)   // '5-1', '6-2', '4-2', '6-6'
const [lineup, setLineup] = useState({})           // { positionId: playerId }
const [liberoId, setLiberoId] = useState(null)     // Libero player ID
const [subs, setSubs] = useState({})               // { positionId: benchPlayerId }

// Multi-set support
const [currentSet, setCurrentSet] = useState(1)
const [setLineups, setSetLineups] = useState({})   // { setNum: { posId: playerId } }
const [totalSets, setTotalSets] = useState(3)

// Rotation (volleyball only)
const [currentRotation, setCurrentRotation] = useState(0)  // 0-5

// UI
const [selectedPlayer, setSelectedPlayer] = useState(null)
const [draggedPlayer, setDraggedPlayer] = useState(null)
```

**Key difference between implementations:**
- Advanced: `lineup` stored as **Object** `{ positionId: playerId }`
- Simple (LineupBuilder.jsx): `lineup` stored as **Array** `[{ event_id, player_id, rotation_order, is_starter, is_libero }]`
- LineupPanel: **Stateless** — all data via props from GameDayCommandCenter

### 2.4 Drag & Drop Implementation

**Type:** HTML5 Native Drag & Drop (no library — no react-dnd, @dnd-kit, etc.)

```javascript
// Drag Start (roster sidebar)
function handleDragStart(e, player) {
  e.dataTransfer.setData('playerId', player.id)
  setDraggedPlayer(player)
}

// Drop on Position (court slots)
onDrop={(e) => {
  e.preventDefault()
  const pid = e.dataTransfer.getData('playerId')
  if (pid) handleDrop(posId, pid)
}}

// Handle Drop Logic
function handleDrop(positionId, playerId) {
  let newLineup = { ...lineup }
  // Remove from any existing position
  Object.keys(newLineup).forEach(key => {
    if (newLineup[key] === playerId) delete newLineup[key]
  })
  // For ROTATED view, map visual position to original position
  const rotationOrder = [1, 2, 3, 4, 5, 6]
  const posIndex = rotationOrder.indexOf(positionId)
  const originalIndex = (posIndex + currentRotation) % 6
  const originalPosition = rotationOrder[originalIndex]
  newLineup[originalPosition] = playerId
  setLineup(newLineup)
}
```

### 2.5 Rotation Logic

Players rotate **clockwise** around the court. Lineup is always stored at "original positions" (P1-P6), displayed with rotation offset.

```javascript
// Visual position calculation
function getPlayerAtPosition(visualPositionId) {
  const rotationOrder = [1, 2, 3, 4, 5, 6]
  const posIndex = rotationOrder.indexOf(visualPositionId)
  const sourceIndex = (posIndex + currentRotation) % 6
  return lineup[rotationOrder[sourceIndex]]
}

// Rotation controls
function nextRotation() { setCurrentRotation(prev => (prev + 1) % 6) }
function prevRotation() { setCurrentRotation(prev => (prev - 1 + 6) % 6) }
function resetRotation() { setCurrentRotation(0) }
```

**Server Position:** P1 is ALWAYS the serving position (marked with green badge + volleyball emoji).

### 2.6 Save/Load Flow

**Load (on mount):**
1. Fetch `team_players` with `players(*)` join for roster
2. Fetch `event_rsvps` for RSVP status per player
3. Fetch existing `game_lineups` records
4. Parse into `{ positionId: playerId }` map
5. Mark libero if found (is_libero = true)

**Save (on button click):**
```javascript
// 1. Delete all existing for this event
await supabase.from('game_lineups').delete().eq('event_id', event.id)

// 2. Insert one record per position
records.push({
  event_id: event.id,
  player_id: playerId,
  rotation_order: parseInt(positionId),  // 1-6
  is_starter: true,
  is_libero: playerId === liberoId,
  position: pos?.name  // 'P1', 'P2', etc.
})

// 3. Add libero as separate record if not in starting lineup
if (liberoId && !Object.values(lineup).includes(liberoId)) {
  records.push({
    event_id: event.id, player_id: liberoId,
    rotation_order: null, is_starter: false,
    is_libero: true, position: 'L'
  })
}

await supabase.from('game_lineups').insert(records)
```

### 2.7 Sport Configurations

**Two separate SPORT_CONFIGS exist:**

**1. AdvancedLineupBuilder.SPORT_CONFIGS** (formation-aware):
```javascript
{
  volleyball: {
    name: 'Volleyball', icon: '🏐', starterCount: 6,
    hasRotations: true, rotationCount: 6, hasLibero: true, hasSets: true, maxSets: 5,
    formations: {
      '5-1': { name: '5-1 Offense', positions: [
        { id: 1, name: 'P1', label: 'Right Back (Serve)', role: 'OH', color: '#EF4444', row: 'back' },
        // ... 6 positions with roles + colors
      ]},
      '6-2': { ... }, '4-2': { ... }, '6-6': { ... }
    }
  },
  basketball: { starterCount: 5, hasRotations: false, ... },
  soccer: { starterCount: 11, hasRotations: false, ... }
}
```

**2. GameComponents.SPORT_CONFIGS** (stats-focused, 8 sports):
```javascript
{
  volleyball: {
    positions: [{ id: 1, name: 'P1', label: 'Position 1 (Serve)' }, ...],
    starterCount: 6, hasLibero: true,
    statGroups: [
      { name: 'Attacking', stats: ['kills', 'attacks', 'attack_errors'], color: '#EF4444' },
      { name: 'Serving', stats: ['aces', 'serves', 'service_errors'], color: '#8B5CF6' },
      // ... 5 groups
    ],
    statCategories: ['kills', 'attacks', 'attack_errors', 'aces', ...],
    icon: '🏐'
  },
  basketball: { ... }, soccer: { ... }, baseball: { ... },
  softball: { ... }, football: { ... }, hockey: { ... }
}
```

**Conflict:** Two separate formation/position sources with different structures. AdvancedLineupBuilder has custom positions per formation (with roles + colors), while GameComponents has generic positions per sport (no roles).

---

## 3. Game Prep Page Architecture

### 3.1 Component Tree

```
GamePrepPage (672 lines)
├── Team Selector (dropdown)
├── Tab Bar: Upcoming | Results
├── GameCard (x N games, 263 lines)
│   ├── Checkpoint Progress Strip (mini dots)
│   ├── Current Checkpoint Hero Card (large card + action button)
│   ├── Secondary Checkpoint Cards (smaller grid)
│   └── Quick Action Buttons
├── GameJourneyPanel (353 lines, right sidebar)
│   ├── Checkpoint Progress Steps
│   ├── Game Notes
│   └── Previous Matchup History
├── AdvancedLineupBuilder (modal, 1,257 lines)
├── GameDayCommandCenter (full-screen overlay, 302 lines)
│   ├── GameDayHero (93 lines, matchup + record)
│   ├── LineupPanel (150 lines, court + bench)
│   │   └── CourtPlayerCard (184 lines)
│   ├── ScorePanel → Scoreboard (164 lines, tap targets)
│   ├── AttendancePanel (79 lines)
│   ├── GameDayStats (120 lines, quick stats + picker)
│   ├── ActionBar (mode-based: Pre-Game/Live/Post-Game)
│   └── PostGameSummary (215 lines, victory/defeat modal)
├── GamePrepCompletionModal (751 lines, 4-step wizard)
│   ├── Step 1: Format Selector
│   ├── Step 2: SetScoreInput (152 lines) or PeriodScoreInput (36 lines)
│   ├── Step 3: Attendance Toggles
│   └── Step 4: Confirm Summary
├── QuickScoreModal (445 lines)
│   ├── Format + Score Entry
│   └── Quick Stars (player shoutouts)
├── QuickAttendanceModal (194 lines)
├── GameDetailModal (completed game results)
└── StatsEntryModal (per-player stat grid)
```

### 3.2 User Flow (game selection → lineup → game day)

```
1. Open GamePrepPage → Select team from dropdown
   └─→ loadTeams() → teams WHERE season_id IN (selected)
       loadGames() → schedule_events WHERE team_id = X, event_type = 'game'
       loadLineupStatuses() → game_lineups.event_id IN (gameIds)
       loadRoster() → team_players + players(*)

2. Click Game Card → See checkpoint progress
   └─→ computeCheckpoints(game, { rsvpData, hasLineup, attendanceData })
       getCurrentCheckpoint(checkpoints) → highlight next action

3. Click "Set Lineup" → AdvancedLineupBuilder modal opens
   └─→ Load roster + RSVPs + existing lineup
       Drag-drop to 6 court positions, select libero
       Save → INSERT game_lineups → Card updates to "Ready"

4. Click "Game Day" → GameDayCommandCenter (full-screen)
   └─→ Pre-Game mode: lineup + attendance
       Live mode: tap-to-score, rotations, subs
       Post-Game mode: final scores → PostGameSummary

5. Click "Complete" → QuickScoreModal or GamePrepCompletionModal
   └─→ Enter set/period scores → UPDATE schedule_events
       Optional: Quick Stars → INSERT shoutouts
       Optional: Enter Stats → StatsEntryModal
```

### 3.3 Game Checkpoints System

**6 Sequential Checkpoints** (`src/lib/gameCheckpoints.js`, 132 lines):

| # | Checkpoint | Icon | Phase | Table | Status States |
|---|-----------|------|-------|-------|--------------|
| 1 | RSVP | 📋 | prep | event_rsvps | not_started, in_progress, done, skipped |
| 2 | Lineup | 📐 | prep | game_lineups | not_started, in_progress, done, warning, skipped |
| 3 | Attendance | ✋ | gameday | event_attendance | not_started, done, skipped |
| 4 | Game | 🏐 | gameday | schedule_events.game_status | not_started, in_progress, warning, done |
| 5 | Scores | 📊 | postgame | schedule_events (our_score, etc.) | not_started, warning, done |
| 6 | Stats | ⭐ | postgame | schedule_events.stats_entered | not_started, done (optional) |

**Core functions:**
- `computeCheckpoints(game, data)` → returns `{ rsvp: { status, detail }, lineup: {...}, ... }`
- `getCurrentCheckpoint(checkpoints)` → finds first warning or first not_started required checkpoint
- `getCompletionPercent(checkpoints)` → % of required checkpoints done

**Game Status Progression:**
```
schedule_events.game_status: scheduled → in_progress → completed
schedule_events.game_result: null → win | loss | tie
schedule_events.stats_entered: false → true (optional)
```

---

## 4. Navigation Structure

### 4.1 Nav Groups by Role

All nav groups defined in `src/MainApp.jsx` (lines 1021-1200).

**Admin:**
```
Dashboard | Teams & Rosters | Registration | Payments | Schedule & Events |
Game Day [gameprep, standings, leaderboards, achievements] |
Communication | Reports | Settings
```

**Coach:**
```
Dashboard | My Teams (dynamic) | Schedule & Events |
Game Day [gameprep, standings, leaderboards, achievements] |
Communication | My Stuff
```

**Team Manager:**
```
Dashboard | My Teams (dynamic) | Schedule & Events |
Game Day [standings, leaderboards, achievements] |  ← NOTE: no gameprep
Communication | Team Ops | My Stuff
```

**Parent:** No "Game Day" group. **Player:** No "Game Day" group.

### 4.2 Sidebar Rendering

**File:** `src/components/layout/LynxSidebar.jsx` (518 lines)
- Renders nav groups + items
- State: `expandedGroups` (Set of group IDs)
- Auto-expands group containing active page
- Chevron rotates 90° when expanded
- Calls `onNavigate(itemId, item)` on click

### 4.3 Top Nav / Horizontal Tab Bar

**File:** `src/components/v2/TopBar.jsx`
- Receives `navLinks` from MainApp
- Shows contextual links based on current page
- Contextual maps (MainApp lines 915-969):
  - `gameprep` → shows: [schedule, attendance, standings]
  - `standings` → shows: [leaderboards, achievements, reports]

### 4.4 Routing Map

**System:** react-router-dom (URL-based routing)
**File:** `src/lib/routes.js`

| Nav ID | Route Path |
|--------|-----------|
| gameprep | /gameprep |
| standings | /standings |
| leaderboards | /leaderboards |
| achievements | /achievements |
| schedule | /schedule |
| attendance | /attendance |

### 4.5 Files to Change for Nav Rename ("Game Day" → "Compete")

**Primary — `src/MainApp.jsx`:**
- Line ~1052: Admin group `{ id: 'game', label: 'Game Day' }` → `'Compete'`
- Line ~1100: Coach group `{ id: 'gameday', label: 'Game Day' }` → `'Compete'`
- Line ~1184: TM group `{ id: 'gameday', label: 'Game Day' }` → `'Compete'`

**Secondary — Breadcrumb text:**
- `src/pages/leaderboards/SeasonLeaderboardsPage.jsx:583`
- `src/pages/standings/TeamStandingsPage.jsx:242, 259, 276`

**To add new sub-items** (e.g., "Practice Hub", "Lineups"):
1. Add to items array in MainApp.jsx nav groups
2. Add routes in `src/lib/routes.js`
3. Add `<Route>` in RoutedContent (MainApp.jsx)
4. Create new page components
5. Update contextual nav maps if needed

---

## 5. Theme System

### 5.1 CSS Custom Properties

**Set by ThemeContext.jsx on `:root`:**

| Property | Light | Dark |
|----------|-------|------|
| --bg-primary | #F5F7FA | #0A1B33 |
| --bg-secondary | #FFFFFF | #1A2332 |
| --bg-tertiary | #F0F3F7 | #232F3E |
| --border-color | #DFE4EA | #2A3545 |
| --text-primary | #10284C | #ffffff |
| --text-secondary | #5A6B7F | #CBD5E1 |
| --text-muted | #5A6B7F | #94A3B8 |
| --accent-primary | #4BB9EC | #4BB9EC |
| --navbar-bg | #10284C | #10284C |

**V2 tokens (`src/styles/v2-tokens.css`):**
- `--v2-navy: #10284C`, `--v2-midnight: #0B1628`, `--v2-sky: #4BB9EC`, `--v2-gold: #FFD700`
- `--v2-surface: #F5F6F8`, `--v2-white: #FFFFFF`, `--v2-card-bg: #FFFFFF`
- `--v2-green: #22C55E`, `--v2-red: #EF4444`, `--v2-amber: #F59E0B`, `--v2-purple: #8B5CF6`
- `--v2-text-primary: #10284C`, `--v2-text-secondary: #64748B`, `--v2-text-muted: #94A3B8`
- `--v2-radius: 14px`, `--v2-font: 'Inter Variable', ...`

**Dark mode override** (`.v2-player-dark` class):
- `--v2-surface: #060E1A`, `--v2-card-bg: #132240`, `--v2-white: #0D1B2F`

### 5.2 Tailwind Tokens

**`tailwind.config.js` — `lynx` color palette:**
```
lynx-navy: #10284C        lynx-sky: #4BB9EC (primary accent)
lynx-deep: #2A9BD4        lynx-ice: #E8F4FD
lynx-slate: #5A6B7F       lynx-silver: #E8ECF2
lynx-cloud: #F6F8FB       lynx-frost: #F0F2F5
lynx-midnight: #0A1628    lynx-charcoal: #1A2744
lynx-graphite: #232F3E    lynx-border-dark: #2A3545
```

### 5.3 useTheme / useThemeClasses API

**`useTheme()` returns:**
```javascript
{
  theme: 'light' | 'dark',
  isDark: boolean,
  toggleTheme: () => void,
  accentColor: 'lynx',
  accent: { primary: '#4BB9EC', light: '#E8F4FD', dark: '#2A9BD4' },
  // Spread of currentTheme: bg, bgSecondary, border, text, textSecondary, etc.
}
```

**`useThemeClasses()` returns:**
```javascript
{
  pageBg: 'bg-lynx-midnight' | 'bg-lynx-cloud',
  cardBg: 'bg-lynx-charcoal' | 'bg-white',
  border: 'border-lynx-border-dark' | 'border-lynx-silver',
  text: 'text-white' | 'text-lynx-navy',
  textSecondary: 'text-slate-300' | 'text-lynx-slate',
  input: 'bg-lynx-graphite border-lynx-border-dark text-white ...' | 'bg-white border-lynx-silver ...',
  card: 'bg-lynx-charcoal border-lynx-border-dark' | 'bg-white border-lynx-silver',
  hoverBg: 'hover:bg-lynx-graphite' | 'hover:bg-lynx-frost',
  // ... more compound classes
}
```

### 5.4 Current Lineup Builder Theme Issues

**AdvancedLineupBuilder.jsx is FULLY HARDCODED DARK — zero theme system integration.**

**Hardcoded colors found (partial list):**
- Backgrounds: `rgba(15,20,35,0.7)`, `rgba(30,40,60,0.5)`, `rgba(15,20,35,0.8)`, `#0a0a0f`
- Borders: `rgba(16,40,76,0.30)`, `rgba(16,40,76,0.25)`, `rgba(16,40,76,0.20)`
- Text: `text-white` (30+ times), `text-slate-400`, `text-slate-300`, `text-slate-500`
- Gradients: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)`
- Position colors: `#FF6B6B` (OH), `#4ECDC4` (S), `#45B7D1` (MB), `#96CEB4` (OPP), `#FFEAA7` (L), `#DDA0DD` (DS), `#FF9F43` (RS)

**GameDayHelpers.jsx `useGameDayTheme()` also hardcoded dark:**
```javascript
{ pageBg: '#0a0a0f', cardBg: 'rgba(30,41,59,0.5)', textPrimary: '#ffffff', isDark: true, ... }
```

**To make theme-aware:** Use `useThemeClasses()` hook, replace all hardcoded colors with theme classes/tokens. Position colors can stay hardcoded (semantic, not theme-dependent).

---

## 6. Database Schema

### 6.1 game_lineups

| Column | Type | Operations | Notes |
|--------|------|-----------|-------|
| event_id | UUID/FK | SELECT, INSERT, DELETE | → schedule_events.id |
| player_id | UUID/FK | SELECT, INSERT | → players.id |
| rotation_order | INTEGER | SELECT, INSERT | 1-6 for starters, null for libero-only |
| is_starter | BOOLEAN | SELECT, INSERT | true for starters, false for bench |
| is_libero | BOOLEAN | SELECT, INSERT | true for libero designation |

**Operations:**
- SELECT: `select('*').eq('event_id', event.id)`
- INSERT: batch insert (delete-then-insert pattern)
- DELETE: `delete().eq('event_id', event.id)` — full replace
- COUNT: `select('*', { count: 'exact', head: true }).eq('event_id', id)`

**Gaps:**
- No `formation_type` column (5-1, 6-2, etc. not persisted)
- No `set_number` column (per-event only, not per-set)
- No `team_id` column (must join through schedule_events)
- No `position` column consistently used (only in some insert paths)
- No RLS org_id scoping

### 6.2 schedule_events (game-relevant columns)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| event_type | ENUM | 'game', 'practice', 'tournament', 'meeting', 'other' |
| event_date | DATE | Game date |
| event_time | TIME | Start time |
| team_id | UUID/FK | → teams.id |
| season_id | UUID/FK | → seasons.id |
| opponent_name | TEXT | Opposing team name |
| our_score | INTEGER | Final score (set wins for volleyball) |
| opponent_score | INTEGER | Opponent final score |
| game_status | TEXT | 'scheduled', 'in_progress', 'completed' |
| game_result | TEXT | 'win', 'loss', 'tie', null |
| stats_entered | BOOLEAN | Whether player stats recorded |
| stats_entered_at | TIMESTAMP | When stats were entered |
| stats_entered_by | UUID/FK | Who entered stats |
| completed_at | TIMESTAMP | When game was marked complete |
| completed_by | UUID/FK | Who completed the game |
| title | TEXT | Event title |
| location | TEXT | Venue location |
| venue_name | TEXT | Venue name |

### 6.3 event_rsvps

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| event_id | UUID/FK | → schedule_events.id |
| player_id | UUID/FK | → players.id |
| status | TEXT | 'yes'/'attending', 'no'/'not_attending', 'maybe', 'pending' |
| responded_at | TIMESTAMP | When RSVP was created |
| updated_at | TIMESTAMP | Last status change |

### 6.4 team_players / players

**team_players:**

| Column | Type | Notes |
|--------|------|-------|
| team_id | UUID/FK | → teams.id |
| player_id | UUID/FK | → players.id |
| jersey_number | INTEGER | Player's jersey # for this team |
| position | TEXT | Player's position on this team |

**players (relevant columns):**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| first_name | TEXT | Player first name |
| last_name | TEXT | Player last name |
| photo_url | TEXT | Full Supabase storage URL |
| jersey_number | INTEGER | Default jersey # |
| position | TEXT | Default position |
| grade | TEXT | School grade |
| status | TEXT | Active/inactive |

### 6.5 Game stats / scores tables

**game_player_stats:**

| Column | Type | Notes |
|--------|------|-------|
| event_id | UUID/FK | → schedule_events.id |
| player_id | UUID/FK | → players.id |
| team_id | UUID/FK | → teams.id |
| kills | INTEGER | Stat counter |
| aces | INTEGER | Stat counter |
| blocks | INTEGER | Stat counter |
| digs | INTEGER | Stat counter |
| assists | INTEGER | Stat counter |
| service_errors | INTEGER | Stat counter |
| points | INTEGER | Computed: kills + aces + blocks |
| created_by | UUID/FK | Who recorded stats |

**No separate `game_sets` table** — set scores stored as JSON or inline fields on schedule_events, not in a normalized table.

### 6.6 Missing Tables (what we need to create)

| Table | Purpose | Priority |
|-------|---------|----------|
| **lineup_templates** | Reusable lineup presets per team (formation + player assignments) | High |
| **game_set_lineups** | Per-set lineup tracking (set_number + player positions) | High |
| **substitutions** | Sub history per game (in_player, out_player, set, rotation) | Medium |
| **game_sets** | Normalized set-level scores (set_number, our_score, their_score) | Medium |
| **formations** | Formation definitions (if we want coach-customizable formations) | Low |

**Recommended `lineup_templates` schema:**
```sql
CREATE TABLE IF NOT EXISTS lineup_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  name TEXT NOT NULL,
  formation_type TEXT,  -- '5-1', '6-2', '4-2', '6-6'
  sport TEXT DEFAULT 'volleyball',
  positions JSONB,      -- [{ position_id, player_id, role }]
  libero_id UUID,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Recommended `game_lineups` additions:**
```sql
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS formation_type TEXT;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS set_number INTEGER DEFAULT 1;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS position_role TEXT;  -- 'OH', 'S', 'MB', etc.
```

---

## 7. Practice/Drill Status

### 7.1 What Exists

**Practices are fully integrated into the schedule system** (40+ references across codebase):

- `schedule_events` with `event_type = 'practice'` — same table as games
- Full RSVP tracking via `event_rsvps`
- Attendance tracking via `event_attendance`
- Calendar color coding (green for practices)
- `BulkPracticeModal.jsx` — create recurring practices
- Coach availability tracking for practices
- Practice counts in reports and dashboards
- Achievement system tracks "practices attended" (Rain or Shine badge)

**Key query pattern:**
```javascript
const { data } = await supabase
  .from('schedule_events')
  .select('*, teams(name, color)')
  .eq('event_type', 'practice')
  .eq('team_id', teamId)
  .gte('event_date', todayStr)
```

### 7.2 What Needs to Be Built

1. **Drill Library** — catalog of drills with name, description, duration, difficulty, skill focus
2. **Practice Plans** — assign ordered drills to a practice event
3. **Drill Performance Tracking** — per-player metrics during drills
4. **Practice Notes** — coach notes specific to practice sessions
5. **Skill Development** — link drills to skill categories, track improvement

**No new database tables needed for basic practice management** — the existing `schedule_events` infrastructure handles scheduling, RSVPs, and attendance. New tables would only be needed for drill library and practice plans.

---

## 8. Reusable Components

### 8.1 Player Card Patterns

| Component | File | Use Case | Features |
|-----------|------|----------|----------|
| PlayerCard | components/players/PlayerComponents.jsx:384 | Roster display | Photo, jersey #, position badge, context-specific data |
| PlayerCardExpanded | components/players/PlayerCardExpanded.jsx:228 | Detail modal | Hero photo, tabs (Overview/Stats/Badges/Games), skill radar |
| CourtPlayerCard | pages/gameprep/CourtPlayerCard.jsx | Court position | Position badge, serving indicator, live stats, "hot player" pulse |
| BenchPlayerCard | pages/gameprep/LineupPanel.jsx:9 | Bench sidebar | Draggable, RSVP indicator, compact layout |
| CoachRosterTab row | components/v2/coach/CoachRosterTab.jsx:48 | Table row | Avatar (32x32), name, jersey, parent, phone, position |

**Position color system (consistent across components):**
```javascript
const positionColors = {
  'OH': '#FF6B6B', 'S': '#4ECDC4', 'MB': '#45B7D1', 'OPP': '#96CEB4',
  'L': '#FFEAA7', 'DS': '#DDA0DD', 'RS': '#FF9F43', 'H': '#EF4444'
}
```

### 8.2 Photo Loading Patterns

**Source:** `players.photo_url` — stores full Supabase Storage public URL directly in database.

**Standard pattern:**
```javascript
{player.photo_url ? (
  <img src={player.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
) : (
  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600
    flex items-center justify-center text-white font-bold">
    {player.jersey_number || initials}
  </div>
)}
```

**No dynamic URL generation** — photos are stored as full URLs, no `getPublicUrl()` calls needed. Uploads happen in separate components (SetupSectionContent, AttachmentUploader, NewPostModal).

### 8.3 Drag & Drop Patterns

**Only HTML5 native drag-and-drop used** — no react-dnd, @dnd-kit, or other libraries.

**Pattern:**
```javascript
// Draggable source
<div draggable onDragStart={(e) => e.dataTransfer.setData('playerId', player.id)}>

// Drop target
<div onDrop={(e) => { e.preventDefault(); handleDrop(e.dataTransfer.getData('playerId')) }}
     onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}>
```

**Existing implementations:**
1. AdvancedLineupBuilder — roster sidebar → court positions (6 zones)
2. LineupPanel — bench → court positions (real-time game day)
3. DashboardGrid — react-grid-layout for widget drag (different pattern, library-based)

---

## 9. Recommendations

### 9.1 Files to Modify (with line ranges)

| File | Lines | Changes |
|------|-------|---------|
| src/components/games/AdvancedLineupBuilder.jsx | 1-1257 | Major rewrite: fixed-height layout, theme support, split-view |
| src/pages/gameprep/CourtPlayerCard.jsx | 1-184 | Theme support, updated styling |
| src/pages/gameprep/GameDayHelpers.jsx | 1-180 | Replace hardcoded theme with useThemeClasses |
| src/pages/gameprep/LineupPanel.jsx | 1-150 | Theme support, updated to match V2 design |
| src/MainApp.jsx | ~1052, ~1100, ~1184 | Rename "Game Day" → "Compete" (3 locations) |
| src/pages/standings/TeamStandingsPage.jsx | ~242, ~259, ~276 | Update breadcrumb text |
| src/pages/leaderboards/SeasonLeaderboardsPage.jsx | ~583 | Update breadcrumb text |

### 9.2 Files to Create

| File | Purpose |
|------|---------|
| src/components/games/LineupBuilderV2.jsx | New fixed-height, split-view lineup builder |
| src/components/games/CourtView.jsx | Extracted court visualization (left panel) |
| src/components/games/LineupTabs.jsx | Right panel: Roster, Subs, Notes, History tabs |
| src/components/games/ControlBar.jsx | Bottom bar: formation, rotation, set, save |
| src/components/games/FormationSelector.jsx | Formation picker with visual preview |

### 9.3 DB Migrations Needed

```sql
-- 1. Add formation_type to game_lineups
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS formation_type TEXT;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS set_number INTEGER DEFAULT 1;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS position_role TEXT;

-- 2. Create lineup_templates table
CREATE TABLE IF NOT EXISTS lineup_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  formation_type TEXT DEFAULT '5-1',
  sport TEXT DEFAULT 'volleyball',
  positions JSONB NOT NULL DEFAULT '[]',
  libero_id UUID REFERENCES players(id),
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create game_sets table (optional, for normalized set scores)
CREATE TABLE IF NOT EXISTS game_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  our_score INTEGER DEFAULT 0,
  their_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 9.4 Suggested Phase Breakdown

**Phase 1: Foundation (Nav + DB)**
- Rename "Game Day" → "Compete" in 3 nav locations + breadcrumbs
- Run DB migrations (formation_type, set_number, lineup_templates)
- No visual changes yet

**Phase 2: Lineup Builder V2 Shell**
- Create new `LineupBuilderV2.jsx` with fixed-height, no-scroll layout
- Left panel: court view (reuse rotation logic from AdvancedLineupBuilder)
- Right panel: tabbed roster/subs/notes
- Bottom bar: formation selector, rotation controls, set tabs, save
- Theme-aware using `useThemeClasses()`

**Phase 3: Wire Data + Replace**
- Connect V2 builder to existing Supabase queries (same game_lineups table)
- Add formation_type persistence
- Add per-set lineup storage
- Replace AdvancedLineupBuilder import in GamePrepPage
- Keep legacy builders alive for fallback

**Phase 4: Lineup Templates**
- Add lineup_templates CRUD
- "Save as Template" button in builder
- "Load Template" dropdown
- Default template per team

**Phase 5: Polish + Game Day Integration**
- Update LineupPanel for game day mode
- Update GameDayCommandCenter integration
- Add substitution tracking
- Performance optimization (memo, virtualization if needed)

### 9.5 Risk Areas / Dependencies

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Two SPORT_CONFIGS objects | Confusion, divergent position definitions | Consolidate into single source in engagement-constants or new file |
| game_lineups schema changes | Mobile app may read this table | Use IF NOT EXISTS, additive changes only |
| Hardcoded dark theme | V2 builder must support both modes | Use useThemeClasses exclusively, no inline hex colors |
| Per-set lineup storage | Breaking change if set_number column required | Default set_number to 1, backward compatible |
| Formation not persisted | Existing lineups won't have formation_type | Default to '5-1' for existing records |
| GameDayCommandCenter coupling | Tightly coupled to current lineup state shape | Ensure V2 builder exports same state interface |
| React hooks ordering | Large component with many useState/useEffect | Plan hooks carefully, avoid conditional hooks |
