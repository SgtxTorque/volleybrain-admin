# CC-LINEUP-BUILDER-V2.md
# Lynx Web Admin — Lineup Builder V2 & Coach Nav Restructure
# PHASED EXECUTION SPEC

**Type:** Build  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`  
**Reference:** `LINEUP-BUILDER-INVESTIGATION-REPORT.md` (commit 19b0c36)

---

## OVERVIEW

Rebuild the volleyball Lineup Builder from a hardcoded-dark, vertically-scrolling modal into a **fixed-height, no-scroll, split-view layout** with full light/dark theme support. Rename the "Game Day" nav group to "Compete." Add DB columns for formation persistence and per-set lineups.

**The V2 layout is three zones that fill 100vh (minus the app header):**

```
┌──────────────────────────────────────────────────────────────────┐
│ HEADER BAR (fixed)                                               │
│ [Team Name] [vs Opponent] [Formation: 5-1 ▼] [Set: 1 2 3 +]   │
│ [Starters: 4/6] [Status: ⚠ Incomplete]        [Save] [Close]  │
├─────────────────────────────────────┬────────────────────────────┤
│ COURT VIEW (fixed, ~62% width)      │ RIGHT PANEL (~38% width)   │
│                                     │ [Roster] [Rotations] [Subs]│
│         ── NET ──                   │ [Analytics]                │
│  ┌──────┐ ┌──────┐ ┌──────┐       │                            │
│  │ OH   │ │ MB   │ │ OPP  │       │ (this panel scrolls        │
│  │ Photo│ │ Photo│ │ Photo│       │  internally only)           │
│  │ #7   │ │ #12  │ │ #9   │       │                            │
│  └──────┘ └──────┘ └──────┘       │                            │
│     ╌╌╌╌ ATTACK LINE ╌╌╌╌         │                            │
│  ┌──────┐ ┌──────┐ ┌──────┐       │                            │
│  │ MB   │ │ S    │ │ OH 🏐│       │                            │
│  │ Photo│ │ Photo│ │ Photo│       │                            │
│  │ #3   │ │ #1   │ │ #5   │       │                            │
│  └──────┘ └──────┘ └──────┘       │                            │
│                                     │                            │
├─────────────────────────────────────┴────────────────────────────┤
│ CONTROL BAR (fixed)                                              │
│ [◀ Rot] [1] [2] [3] [4] [5] [6] [▶ Rot] [▶ Animate]           │
│ [Copy to all sets] [Auto-Fill] [Clear]           [Lineup Valid ✓]│
└──────────────────────────────────────────────────────────────────┘
```

**KEY DESIGN RULES:**
- Page NEVER scrolls. Court, header, and control bar are fixed. Only the right panel scrolls internally.
- NO secondary left sidebar nav inside the tool. The left side is ALL court.
- Player cards on court are compact: ~120px tall, showing photo thumbnail, jersey #, position badge, first name.
- Right panel tabs: Roster (drag source, with Starters/Bench/All filter), Rotations (mini 2x3 grid thumbnails of all 6 rotations), Substitutions (planned subs with counter), Analytics (future — show placeholder).
- Control bar is the "remote control": rotation nav (1-6), animate button, system dropdown, set tabs, quick actions.
- Bench players live in the Roster tab (right panel), NOT in a separate bottom strip.
- ALL colors use the theme system. ZERO hardcoded hex/rgba for backgrounds, borders, or text. Position role colors (OH red, S teal, MB blue, etc.) may stay hardcoded — they are semantic, not theme-dependent.
- Must work in both light and dark mode from day one.

---

## PHASE 1: FOUNDATION (Nav Rename + DB Migrations)
**Commit message prefix:** `feat(lineup-v2): phase 1 —`

### 1A. Rename "Game Day" → "Compete"

**File: `src/MainApp.jsx`**

Find all nav group definitions with label `'Game Day'` and change to `'Compete'`. There are 3 locations:

1. **Admin nav group** (~line 917): `{ id: 'game', label: 'Game Day' }` → `{ id: 'game', label: 'Compete' }`
2. **Coach nav group** (~line 963): `{ id: 'gameday', label: 'Game Day' }` → `{ id: 'gameday', label: 'Compete' }`
3. **Team Manager nav group** (~line 1036): `{ id: 'gameday', label: 'Game Day' }` → `{ id: 'gameday', label: 'Compete' }`

**File: `src/pages/standings/TeamStandingsPage.jsx`**
- Find all `breadcrumb="Game Day"` or `breadcrumb` props containing "Game Day" and replace with `"Compete"`

**File: `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`**
- Same — update breadcrumb text from "Game Day" to "Compete"

**File: `src/pages/gameprep/GamePrepPage.jsx`**
- Check for any breadcrumb or title referencing "Game Day" and update

**File: `src/components/layout/LynxSidebar.jsx`**
- Check the icon mapping at line ~24. `gameprep: Zap` — no text change needed, but verify the icon still makes sense for "Compete". If not, suggest `Swords` or `Target` from lucide-react as alternatives. Keep `Zap` if `Swords`/`Target` aren't imported.

### 1B. Database Migrations

Create a new file `src/lib/migrations/lineup-v2-migrations.sql` with the following SQL. This is a **reference file only** — it will NOT auto-run. The developer will execute it manually in Supabase SQL Editor.

```sql
-- ============================================
-- LINEUP BUILDER V2 — DATABASE MIGRATIONS
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add columns to game_lineups
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS formation_type TEXT;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS set_number INTEGER DEFAULT 1;
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE game_lineups ADD COLUMN IF NOT EXISTS position_role TEXT;

-- 2. Backfill team_id from schedule_events
UPDATE game_lineups gl
SET team_id = se.team_id
FROM schedule_events se
WHERE gl.event_id = se.id
AND gl.team_id IS NULL;

-- 3. Default formation_type for existing records
UPDATE game_lineups SET formation_type = '5-1' WHERE formation_type IS NULL;

-- 4. Create lineup_templates table
CREATE TABLE IF NOT EXISTS lineup_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  formation_type TEXT DEFAULT '5-1',
  sport TEXT DEFAULT 'volleyball',
  positions JSONB NOT NULL DEFAULT '[]',
  libero_id UUID,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS for lineup_templates
ALTER TABLE lineup_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lineup templates for their org teams"
  ON lineup_templates FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN seasons s ON t.season_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Coaches and admins can manage lineup templates"
  ON lineup_templates FOR ALL
  USING (
    created_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_coaches WHERE coach_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

-- 6. Index for performance
CREATE INDEX IF NOT EXISTS idx_game_lineups_event_set
  ON game_lineups(event_id, set_number);
CREATE INDEX IF NOT EXISTS idx_lineup_templates_team
  ON lineup_templates(team_id);
```

### 1C. Consolidate SPORT_CONFIGS

**Problem:** Two separate `SPORT_CONFIGS` exist — one in `AdvancedLineupBuilder.jsx` (formation-aware, 4 formations) and one in `GameComponents.jsx` (stats-focused, 8 sports). They define positions differently.

**Action:** Create a single source of truth.

**Create file: `src/constants/sportConfigs.js`**

Move the formation-aware config from `AdvancedLineupBuilder.jsx` (lines ~63-168) into this new file. Merge in the `statGroups` and `statCategories` from `GameComponents.jsx`. Export as:

```javascript
export const SPORT_CONFIGS = { ... }
export const VOLLEYBALL_FORMATIONS = { ... }  // extracted for direct access
export function getFormationPositions(sport, formationType) { ... }
export function getSportConfig(sport) { ... }
```

**Then update imports:**
- `src/components/games/AdvancedLineupBuilder.jsx` — import from new file, remove inline config
- `src/components/games/GameComponents.jsx` — import from new file, remove inline config

Do NOT change any logic — just move the data to a shared location and update imports.

### Phase 1 Verification

After completing Phase 1:
1. Run `grep -rn "Game Day" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules` — should return 0 results (except maybe inline comments)
2. Verify the app still renders by checking imports aren't broken: `grep -rn "SPORT_CONFIGS" src/ --include="*.jsx" --include="*.js" | grep -v _archive` — all should point to the new shared file
3. Verify no `import.*SPORT_CONFIGS.*from.*AdvancedLineupBuilder` or `from.*GameComponents` remain for config access

**Commit:** `feat(lineup-v2): phase 1 — rename Game Day to Compete, add DB migration SQL, consolidate SPORT_CONFIGS`

---

## PHASE 2: LINEUP BUILDER V2 SHELL (Layout + Theme)
**Commit message prefix:** `feat(lineup-v2): phase 2 —`

### 2A. Create the V2 Component Structure

Create these new files:

**`src/components/games/lineup-v2/LineupBuilderV2.jsx`** — Main container (the full-screen overlay)

This is the parent component. It:
- Renders as `fixed inset-0 z-[60]` (same as current AdvancedLineupBuilder)
- Uses `useTheme()` and `useThemeClasses()` for ALL styling
- Has three zones: HeaderBar, MainContent (court + right panel), ControlBar
- MainContent uses CSS grid or flex: `grid-template-columns: 1fr 380px` (court gets remaining space, right panel is fixed 380px)
- All three zones are `flex-shrink-0` or fixed height. Only the right panel's tab content area scrolls (`overflow-y: auto`)
- Receives same props as current AdvancedLineupBuilder: `{ event, team, sport, onClose, onSave, showToast }`

**`src/components/games/lineup-v2/CourtView.jsx`** — Court visualization (left panel)

This component:
- Renders the volleyball court with 6 position slots arranged in proper formation
- Front row: positions rendered left to right as P4 (Left Front), P3 (Middle Front), P2 (Right Front)
- Back row: P5 (Left Back), P6 (Middle Back), P1 (Right Back / Serve)
- Shows "NET" label at top, "ATTACK LINE" dashed separator between rows
- Each position slot is a drop target (HTML5 native drag-and-drop, same pattern as current)
- When a player is assigned: show compact card with photo thumbnail (48x48 rounded), jersey number, first name, position role badge (OH/MB/S/OPP/L colored pill)
- When empty: show dashed border placeholder with position label and role badge
- Serving position (P1) gets a volleyball emoji indicator
- The court background should use theme tokens: `isDark ? 'bg-lynx-charcoal' : 'bg-white'` with subtle grid lines
- Position role badge colors stay hardcoded (they are semantic): OH `#EF4444`, S `#10B981`, MB `#F59E0B`, OPP `#6366F1`, L `#FFEAA7`, DS `#DDA0DD`
- Court should have subtle zone numbers (large, watermarked, low opacity) in each zone: 4, 3, 2 (front) and 5, 6, 1 (back) — same pattern as current builder
- Court fits entirely in its container — NO scrolling

**`src/components/games/lineup-v2/RightPanel.jsx`** — Tabbed right panel

This component:
- Has 4 tabs: Roster, Rotations, Substitutions, Analytics
- Tab bar is fixed at top of the panel (never scrolls)
- Tab content area below scrolls independently (`overflow-y: auto`, `flex: 1`)
- Uses theme classes for background, borders, text

**Tab: Roster**
- Shows team roster as draggable player cards
- Filter toggle at top: `All` | `Starters` | `Bench` (pill buttons)
- Each player card shows: photo (40x40), jersey #, name, position, RSVP status indicator (green dot = going, amber = maybe, red = no)
- Players already on court show a checkmark or "On Court" badge and are slightly dimmed
- Draggable via HTML5 native drag (same `onDragStart` pattern as current)
- Search/filter input at top (optional, nice-to-have)

**Tab: Rotations**
- Shows all 6 rotations as mini court thumbnails in a 3x2 grid
- Each thumbnail is a small 2x3 grid showing player jersey numbers in their positions for that rotation
- Active rotation is highlighted with accent border (`var(--accent-primary)`)
- Clicking a rotation thumbnail navigates to that rotation (updates `currentRotation` state)
- Below the grid: "Rotation Details" section showing the selected rotation's player names, positions, and any notes
- Label each rotation: "Rot 1: Neutral", "Rot 2", etc. (user can name them later — for now just "Rotation 1" through "Rotation 6")

**Tab: Substitutions**
- Header: "Substitution Plan" with counter `X/12 SUB COUNT` (volleyball gets 12 subs per set in USAV rules — make this configurable)
- List of planned substitutions, each showing: rotation #, OUT player (#number, name) → IN player (#number, name), status badge (Planned/Confirmed)
- "+ Add Substitution" button that opens inline form: select rotation, select OUT player (from starters), select IN player (from bench), add
- "Available Bench" section below showing bench players with their number, name, and position

**Tab: Analytics**
- Placeholder for now: "Analytics coming soon" with a chart icon
- Brief text: "Player performance data, matchup insights, and lineup efficiency will appear here once game data is available."
- Use muted text styling

**`src/components/games/lineup-v2/ControlBar.jsx`** — Bottom control strip

This component:
- Fixed at bottom of the overlay
- Left side: Rotation navigation — `[◀]` `[1] [2] [3] [4] [5] [6]` `[▶]` with active rotation highlighted, plus an `[▶ Animate]` button (plays through rotations with CSS transitions — can be a future feature, for now just tooltip "Coming soon")
- Center: System dropdown (5-1 Offense, 6-2, 4-2, 6-6) — reuse the formation selector from current builder
- Right side: `[Copy to all sets]` `[Auto-Fill]` `[Clear]` buttons, and a status pill showing "Lineup Valid ✓" (green) or "Incomplete X/6" (amber)
- Background: use theme tokens — `isDark ? 'bg-lynx-midnight border-t border-lynx-border-dark' : 'bg-white border-t border-lynx-silver'`
- Height: 56-64px, compact

**`src/components/games/lineup-v2/HeaderBar.jsx`** — Top header strip

This component:
- Left: Close button (X), Team name (bold), "vs" opponent name
- Center: Set tabs `[1] [2] [3] [+]` with active set highlighted. "Copy to all sets" as a subtle link/button near the set tabs
- Right: Starters counter `4/6`, formation system badge (e.g., "5-1 Offense"), lineup status indicator, `[Save Lineup]` primary button
- Background: same theme pattern as ControlBar
- Height: 56-64px

**`src/components/games/lineup-v2/index.js`** — Barrel export

```javascript
export { default as LineupBuilderV2 } from './LineupBuilderV2'
```

### 2B. Theme Implementation Rules

Every component in `lineup-v2/` MUST follow these rules:

1. Import `useTheme` and/or `useThemeClasses` from `../../contexts/ThemeContext`
2. For backgrounds: use `tc.cardBg`, `tc.pageBg`, or `isDark ? 'specific-dark' : 'specific-light'` using Tailwind tokens
3. For borders: use `tc.border` or `isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'`
4. For text: use `tc.text`, `tc.textSecondary`, `tc.textMuted`
5. For interactive states: use `tc.hoverBg`
6. For the court surface specifically: use a custom class that respects theme — NOT a hardcoded dark background
7. For accent/active states: use `var(--accent-primary)` / `#4BB9EC` (this is the same in both themes)
8. NO `rgba()` inline styles for backgrounds or borders. NO `text-white` hardcoded. NO `#0a0a0f` or any dark hex.
9. Position role colors (OH, S, MB, OPP, L, DS) CAN stay as hardcoded hex — they need to be vibrant against both light and dark backgrounds
10. Use the CSS variable `--v2-radius: 14px` for border-radius consistency

### 2C. Wire Into App (But Don't Replace Yet)

**File: `src/components/games/lineup-v2/LineupBuilderV2.jsx`**

For this phase, the V2 builder should load with static/mock data so we can verify the layout and theme work. Use this approach:

- Accept the same props as AdvancedLineupBuilder (`event`, `team`, `sport`, `onClose`, `onSave`, `showToast`)
- On mount, call the SAME data loading functions (roster, RSVPs, existing lineups) from the current builder — copy the `loadData()` function
- Render the layout with real roster data
- Drag-and-drop should work (copy the handlers from current builder)
- Save should work (copy the `saveLineup()` function)

Essentially: the V2 is a new LAYOUT wrapping the same LOGIC. Don't rewrite the logic yet — move it into the new visual structure.

**File: `src/pages/gameprep/GamePrepPage.jsx`**

Add a temporary toggle to switch between V1 and V2 builders:

```javascript
// At the top of the component, add:
const [useV2Builder, setUseV2Builder] = useState(true) // default to V2

// Where AdvancedLineupBuilder is rendered (~line 448), wrap in conditional:
{showLineupBuilder && selectedGame && selectedTeam && (
  useV2Builder ? (
    <LineupBuilderV2
      event={selectedGame}
      team={selectedTeam}
      sport={sport}
      onClose={() => { setShowLineupBuilder(false); loadGames() }}
      onSave={() => loadGames()}
      showToast={showToast}
    />
  ) : (
    <AdvancedLineupBuilder
      event={selectedGame}
      team={selectedTeam}
      sport={sport}
      onClose={() => { setShowLineupBuilder(false); loadGames() }}
      onSave={() => loadGames()}
      showToast={showToast}
    />
  )
)}
```

Add the import at the top:
```javascript
import { LineupBuilderV2 } from '../../components/games/lineup-v2'
```

### Phase 2 Verification

After completing Phase 2:
1. Open the app in light mode → navigate to Game Prep → click "Set Lineup" on any game → V2 builder should open
2. Verify: no page scroll. Court fills left side. Right panel tabs work. Control bar is pinned to bottom.
3. Toggle to dark mode → same check. All text readable, no white-on-white or dark-on-dark issues.
4. Drag a player from roster to a court position → should work
5. Click through rotation numbers in control bar → court should update
6. Click Save → should save to DB (same as V1)
7. Close and reopen → lineup should load from DB
8. Check each right panel tab renders (Roster with players, Rotations with mini grids, Subs with empty state, Analytics with placeholder)

**Commit:** `feat(lineup-v2): phase 2 — V2 lineup builder shell with split-view layout and full theme support`

---

## PHASE 3: DATA WIRING + FORMATION PERSISTENCE
**Commit message prefix:** `feat(lineup-v2): phase 3 —`

### 3A. Persist Formation Type

**In `LineupBuilderV2.jsx`:**

When saving the lineup, include `formation_type` in every record:

```javascript
records.push({
  event_id: event.id,
  player_id: playerId,
  rotation_order: parseInt(positionId),
  is_starter: true,
  is_libero: playerId === liberoId,
  position: pos?.name,
  formation_type: formation,  // NEW: '5-1', '6-2', etc.
  set_number: currentSet,     // NEW: which set this lineup is for
  team_id: team.id,           // NEW: direct team reference
  position_role: pos?.role    // NEW: 'OH', 'S', 'MB', etc.
})
```

When loading, read `formation_type` from existing records to restore the formation selector:

```javascript
if (existingLineup?.length > 0) {
  // Restore formation from saved data
  const savedFormation = existingLineup[0]?.formation_type
  if (savedFormation && formations[savedFormation]) {
    setFormation(savedFormation)
  }
  // ... rest of lineup parsing
}
```

### 3B. Per-Set Lineup Storage

Update the save/load to support per-set lineups:

**Save:** Delete only records for the current set, then insert:
```javascript
await supabase.from('game_lineups')
  .delete()
  .eq('event_id', event.id)
  .eq('set_number', currentSet)
```

**Load:** Group loaded records by set_number:
```javascript
const grouped = {}
existingLineup.forEach(l => {
  const setNum = l.set_number || 1
  if (!grouped[setNum]) grouped[setNum] = {}
  if (l.rotation_order) grouped[setNum][l.rotation_order] = l.player_id
  if (l.is_libero) setLiberoId(l.player_id)
})
setSetLineups(grouped)
setLineup(grouped[1] || {})
```

### 3C. System Conflict Detection

Add lineup validation logic that checks for conflicts. Display as a warning banner at the top of the court view (same pattern as the mockup screenshots).

```javascript
function validateLineup(lineup, formation, roster) {
  const errors = []
  const warnings = []
  const positions = formations[formation]?.positions || []
  
  // Check: correct number of starters
  const starterCount = Object.keys(lineup).length
  if (starterCount > 0 && starterCount < 6) {
    warnings.push(`Lineup incomplete: ${starterCount}/6 starters assigned`)
  }
  
  // Check: duplicate players
  const playerIds = Object.values(lineup)
  const dupes = playerIds.filter((id, i) => playerIds.indexOf(id) !== i)
  if (dupes.length > 0) {
    errors.push('Duplicate player detected in lineup')
  }
  
  // Check: multiple setters in 5-1 system
  if (formation === '5-1') {
    const setterPositions = Object.entries(lineup).filter(([posId, playerId]) => {
      const player = roster.find(p => p.id === playerId)
      return player?.position?.toUpperCase() === 'S'
    })
    if (setterPositions.length > 1) {
      errors.push(`Multiple Setters active in a 5-1 system. Ensure only one primary setter.`)
    }
  }
  
  // Check: RSVP status
  Object.values(lineup).forEach(playerId => {
    const rsvp = rsvps[playerId]
    if (rsvp === 'no' || rsvp === 'not_attending') {
      warnings.push(`${roster.find(p => p.id === playerId)?.first_name} RSVP'd "No" but is in the lineup`)
    }
  })
  
  return { errors, warnings, isValid: errors.length === 0 }
}
```

Display errors as a red/amber banner between the HeaderBar and the Court:
```jsx
{validation.errors.length > 0 && (
  <div className={`mx-4 mt-2 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium
    ${isDark ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'}`}>
    <TriangleAlert className="w-4 h-4 flex-shrink-0" />
    {validation.errors[0]}
  </div>
)}
```

### 3D. Remove V1/V2 Toggle

Once Phase 3 is complete, remove the `useV2Builder` toggle from `GamePrepPage.jsx`. Make V2 the only builder. Keep the old `AdvancedLineupBuilder.jsx` file in place (don't delete) but remove its import from `GamePrepPage.jsx`.

Also update the import in `src/pages/schedule/EventDetailModal.jsx` if it uses AdvancedLineupBuilder — check and switch to V2.

### Phase 3 Verification

After completing Phase 3:
1. Create a lineup with 5-1 formation → save → close → reopen → formation should be "5-1" (not reset to default)
2. Set lineup for Set 1, switch to Set 2, set different lineup → save → reopen → both sets should have their own lineups
3. Place two setters in a 5-1 lineup → red warning banner should appear
4. Place a player who RSVP'd "No" → amber warning should appear
5. Test in both light and dark modes
6. Verify the old AdvancedLineupBuilder is no longer imported/used anywhere active (it can remain as a file)

**Commit:** `feat(lineup-v2): phase 3 — formation persistence, per-set lineups, conflict detection, replace V1`

---

## PHASE 4: LINEUP TEMPLATES
**Commit message prefix:** `feat(lineup-v2): phase 4 —`

### 4A. Template CRUD

**In `LineupBuilderV2.jsx` or a new `src/components/games/lineup-v2/TemplateManager.jsx`:**

Add "Save as Template" and "Load Template" functionality.

**Save as Template:**
- Button in HeaderBar or as a dropdown option next to Save
- Opens a small modal/popover: template name input, checkbox "Set as default for this team"
- Saves to `lineup_templates` table:
  ```javascript
  await supabase.from('lineup_templates').insert({
    team_id: team.id,
    organization_id: team.organization_id,  // if available
    name: templateName,
    formation_type: formation,
    sport: sport,
    positions: Object.entries(lineup).map(([posId, playerId]) => ({
      position_id: parseInt(posId),
      player_id: playerId,
      role: formations[formation]?.positions?.find(p => p.id === parseInt(posId))?.role
    })),
    libero_id: liberoId,
    is_default: isDefault,
    created_by: user.id
  })
  ```

**Load Template:**
- Dropdown in HeaderBar showing saved templates for this team
- On select: populate `lineup` state from template's `positions` JSONB
- Set formation from template's `formation_type`
- Validate: if a player in the template is no longer on the roster, show warning and skip that position

**Default Template:**
- On lineup builder open, if no existing lineup for this event, check for a default template and auto-load it
- Show a toast: "Loaded default template: [name]"

### Phase 4 Verification

1. Create a lineup → "Save as Template" with name "Main Rotation" → success toast
2. Clear lineup → "Load Template" → select "Main Rotation" → lineup populates correctly
3. Save a template as default → open builder for a NEW game (no existing lineup) → default should auto-load
4. Remove a player from the roster → load a template that included them → warning for missing player, other positions still load
5. Verify templates are team-scoped (Template saved for Team A doesn't show for Team B)

**Commit:** `feat(lineup-v2): phase 4 — lineup templates (save, load, default)`

---

## PHASE 5: POLISH + GAME DAY INTEGRATION
**Commit message prefix:** `feat(lineup-v2): phase 5 —`

### 5A. Update LineupPanel for Game Day

**File: `src/pages/gameprep/LineupPanel.jsx`**

Update this component to use theme classes (currently 150 lines, likely has some hardcoded dark styles from GameDayHelpers). Ensure it reads from the new per-set lineup data if available.

### 5B. Update GameDayCommandCenter

**File: `src/pages/gameprep/GameDayCommandCenter.jsx`**

Ensure it works with the V2 lineup data shape. If LineupPanel reads from `game_lineups`, verify it handles the new `set_number` and `formation_type` columns gracefully.

### 5C. Update GameDayHelpers Theme

**File: `src/pages/gameprep/GameDayHelpers.jsx`**

Replace the hardcoded `useGameDayTheme()` function (which returns hardcoded dark values) with proper theme system integration. Either:
- Remove `useGameDayTheme()` entirely and have callers use `useThemeClasses()` directly
- Or update it to delegate to the real theme system

### 5D. Rotation Animation (Nice-to-Have)

If time allows, add CSS transitions to the court view so that when the coach cycles through rotations, player cards animate smoothly to their new positions. This is the "drift and slide" effect you described.

Implementation: use `transform` + `transition` on the player card containers. When rotation changes, calculate new x/y positions and apply as inline transforms with `transition: transform 400ms ease`.

### 5E. Final Test Report

Create `LINEUP-BUILDER-V2-TEST-REPORT.md` in repo root documenting:

```markdown
# Lineup Builder V2 — Test Report

## Test Matrix

| Test | Light Mode | Dark Mode | Status |
|------|-----------|-----------|--------|
| Builder opens full-screen, no page scroll | | | |
| Court shows 6 position slots in correct arrangement | | | |
| Drag player from roster to court position | | | |
| Remove player from position (click X) | | | |
| Auto-fill populates available players | | | |
| Clear removes all assignments | | | |
| Rotation nav (1-6) updates court positions | | | |
| Formation dropdown (5-1, 6-2, 4-2, 6-6) changes position roles | | | |
| Set tabs (1, 2, 3) maintain separate lineups | | | |
| Copy to all sets | | | |
| Save lineup persists to DB | | | |
| Reopen loads saved lineup (including formation) | | | |
| Libero assignment works | | | |
| RSVP status visible on roster cards | | | |
| System conflict warning (multiple setters in 5-1) | | | |
| RSVP warning (player said No but in lineup) | | | |
| Roster tab: filter All/Starters/Bench | | | |
| Rotations tab: mini grid of all 6 rotations | | | |
| Substitutions tab: add planned sub | | | |
| Analytics tab: placeholder renders | | | |
| Save as template | | | |
| Load template | | | |
| Default template auto-loads for new game | | | |
| Right panel scrolls independently | | | |
| Control bar is always visible | | | |
| Header bar is always visible | | | |
| No hardcoded colors (grep verification) | | | |

## Color Audit
Run: `grep -rn "rgba\|#[0-9a-fA-F]\{6\}\|text-white\|text-slate\|bg-\[" src/components/games/lineup-v2/ --include="*.jsx"`
Expected: Only position role colors (OH, S, MB, OPP, L, DS) should appear as hardcoded hex.

## Files Created
(list all new files)

## Files Modified  
(list all modified files with summary of changes)

## DB Changes
(list all schema changes applied)
```

Fill in the test results. Run the color audit grep and include the output.

### Phase 5 Verification

1. Full end-to-end: Open Game Prep → select game → Set Lineup → V2 opens → set formation → assign players → save → enter Game Day mode → lineup appears in LineupPanel
2. Toggle light/dark mode in settings → reopen builder → everything renders correctly in both modes
3. Run color audit grep → verify no unauthorized hardcoded colors in lineup-v2/ folder

**Commit:** `feat(lineup-v2): phase 5 — game day integration, theme polish, test report`

---

## FILES SUMMARY

### New Files
| File | Phase |
|------|-------|
| `src/constants/sportConfigs.js` | 1 |
| `src/lib/migrations/lineup-v2-migrations.sql` | 1 |
| `src/components/games/lineup-v2/LineupBuilderV2.jsx` | 2 |
| `src/components/games/lineup-v2/CourtView.jsx` | 2 |
| `src/components/games/lineup-v2/RightPanel.jsx` | 2 |
| `src/components/games/lineup-v2/ControlBar.jsx` | 2 |
| `src/components/games/lineup-v2/HeaderBar.jsx` | 2 |
| `src/components/games/lineup-v2/index.js` | 2 |
| `src/components/games/lineup-v2/TemplateManager.jsx` | 4 |
| `LINEUP-BUILDER-V2-TEST-REPORT.md` | 5 |

### Modified Files
| File | Phase | Changes |
|------|-------|---------|
| `src/MainApp.jsx` | 1, 2 | Nav rename, V2 import |
| `src/pages/gameprep/GamePrepPage.jsx` | 2, 3 | V2 toggle (then remove toggle) |
| `src/components/games/AdvancedLineupBuilder.jsx` | 1 | Remove SPORT_CONFIGS (import from shared) |
| `src/components/games/GameComponents.jsx` | 1 | Remove SPORT_CONFIGS (import from shared) |
| `src/pages/standings/TeamStandingsPage.jsx` | 1 | Breadcrumb text |
| `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | 1 | Breadcrumb text |
| `src/pages/gameprep/LineupPanel.jsx` | 5 | Theme support |
| `src/pages/gameprep/GameDayCommandCenter.jsx` | 5 | V2 data shape compatibility |
| `src/pages/gameprep/GameDayHelpers.jsx` | 5 | Replace hardcoded theme |

### Preserved Files (No Delete)
| File | Reason |
|------|--------|
| `src/components/games/AdvancedLineupBuilder.jsx` | Keep as fallback reference, no longer imported |
| `src/pages/schedule/LineupBuilder.jsx` | Used by schedule page, separate scope |

---

## IMPORTANT RULES FOR CC

1. **Every phase gets its own commit** with the specified prefix
2. **NEVER hardcode colors** in lineup-v2/ components. Use theme hooks. The ONLY exception is position role colors (OH, S, MB, etc.)
3. **Test both light and dark modes** — if you can't visually test, at minimum grep for hardcoded color values
4. **Keep the old AdvancedLineupBuilder.jsx intact** — don't delete or modify its render logic (only the SPORT_CONFIGS extraction in Phase 1)
5. **HTML5 native drag-and-drop only** — do NOT introduce react-dnd, @dnd-kit, or any new drag library
6. **No new npm dependencies** unless absolutely unavoidable. The current stack (React 18.2, Vite 5, Tailwind, Supabase) should handle everything.
7. **Follow existing patterns** for Supabase queries, error handling, and toast notifications
8. **Use Inter Variable font** — it's already loaded globally. Don't add font imports.
9. **14px border radius** (`rounded-[14px]` or `var(--v2-radius)`) for cards and panels
10. **Run `grep -rn "Game Day" src/ --include="*.jsx" --include="*.js" | grep -v _archive` after Phase 1** to verify the rename is complete
