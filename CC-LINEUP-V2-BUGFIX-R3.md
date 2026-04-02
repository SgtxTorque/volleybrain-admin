# CC-LINEUP-V2-BUGFIX-R3.md
# Lynx Web Admin — Lineup Builder V2 Bugfix Round 3
# EXECUTION SPEC

**Type:** Bugfix + Feature  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`  
**Context:** R2 addressed layout and sizing. This round fixes substitution persistence, court reflection, adds formation phase views to the Rotations tab, and updates the contextual top nav for Compete and Practice sections.

---

## ISSUE 1: Substitutions Do Not Persist to Database

**Problem:** Planned substitutions are stored only in React component state. When the coach saves the lineup, leaves, and returns, all subs are gone. The `saveLineup()` function only writes to `game_lineups` and has no mechanism for saving the substitution plan.

**Fix — Option A (Recommended): Store subs as JSONB on a lineup metadata record**

Add a `lineup_metadata` JSONB column to the `game_lineups` table, or create a single metadata record per event+set that holds the sub plan. The simplest approach: store the planned subs array as JSONB on a special record.

Create a migration SQL (add to `src/lib/migrations/lineup-v2-subs-migration.sql`):
```sql
-- Add planned_subs column to store substitution plans per event per set
-- We'll store this on a single "metadata" row per event+set
CREATE TABLE IF NOT EXISTS game_lineup_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL DEFAULT 1,
  team_id UUID REFERENCES teams(id),
  planned_subs JSONB DEFAULT '[]',
  /*
    [
      {
        "id": "uuid",
        "starterPlayerId": "uuid",
        "subPlayerId": "uuid",
        "outRotation": 3,
        "inRotation": 6,       // null = does not return
        "positionId": 1
      }
    ]
  */
  bench_order JSONB DEFAULT '[]',  -- For 6-6: ordered list of player IDs for bench queue
  notes TEXT,                       -- Coach notes for this set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, set_number)
);

ALTER TABLE game_lineup_metadata ENABLE ROW LEVEL SECURITY;

-- Same RLS pattern as game_lineups
CREATE POLICY "Users can view lineup metadata for their org" ON game_lineup_metadata
  FOR SELECT USING (
    event_id IN (
      SELECT se.id FROM schedule_events se
      JOIN teams t ON se.team_id = t.id
      JOIN seasons s ON t.season_id = s.id
      WHERE s.organization_id IN (
        SELECT current_organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Coaches can manage lineup metadata" ON game_lineup_metadata
  FOR ALL USING (
    event_id IN (
      SELECT se.id FROM schedule_events se
      JOIN team_coaches tc ON se.team_id = tc.team_id
      WHERE tc.coach_id = auth.uid()
    )
    OR public.is_platform_admin()
  );

CREATE INDEX IF NOT EXISTS idx_lineup_metadata_event ON game_lineup_metadata(event_id, set_number);
```

**Update `saveLineup()` in `LineupBuilderV2.jsx`:**

After saving the lineup positions to `game_lineups`, also save the metadata:
```javascript
// Save planned subs
await supabase.from('game_lineup_metadata').upsert({
  event_id: event.id,
  set_number: currentSet,
  team_id: team.id,
  planned_subs: JSON.stringify(plannedSubs),
  bench_order: JSON.stringify(benchOrder || []),
  updated_at: new Date().toISOString(),
}, { onConflict: 'event_id,set_number' })
```

**Update `loadData()` in `LineupBuilderV2.jsx`:**

After loading the lineup positions, also load metadata:
```javascript
const { data: metadata } = await supabase
  .from('game_lineup_metadata')
  .select('*')
  .eq('event_id', event.id)

if (metadata?.length > 0) {
  const metaBySet = {}
  metadata.forEach(m => {
    metaBySet[m.set_number] = {
      plannedSubs: JSON.parse(m.planned_subs || '[]'),
      benchOrder: JSON.parse(m.bench_order || '[]'),
    }
  })
  // Restore subs for current set
  setPlannedSubs(metaBySet[1]?.plannedSubs || [])
}
```

**Verify:** Create subs → save lineup → leave page → return → subs are still there.

---

## ISSUE 2: Substitutions Do Not Reflect on Court View

**Problem:** When viewing different rotations, the court always shows the original starters regardless of planned subs. The `getEffectiveLineup()` function is either missing or not being used by `CourtView.jsx`.

**Fix:** 

**Step 1:** Verify `getEffectiveLineup()` exists in `LineupBuilderV2.jsx`. If it doesn't, add it:

```javascript
function getEffectiveLineup(baseLineup, plannedSubs, currentRotation) {
  const effective = { ...baseLineup }
  
  for (const sub of plannedSubs) {
    const subIsActive = (
      currentRotation >= sub.outRotation &&
      (sub.inRotation === null || currentRotation < sub.inRotation)
    )
    
    if (subIsActive) {
      // Find which position the starter occupies and replace with sub player
      const posKey = Object.keys(effective).find(
        key => effective[key] === sub.starterPlayerId
      )
      if (posKey) {
        effective[posKey] = sub.subPlayerId
      }
    }
  }
  
  return effective
}
```

**Step 2:** In the render, pass the effective lineup to `CourtView` instead of the raw lineup:

```javascript
// Where CourtView is rendered, compute effective lineup:
const effectiveLineup = getEffectiveLineup(lineup, plannedSubs, currentRotation + 1)
// Note: currentRotation is 0-indexed internally but subs use 1-indexed rotation numbers

<CourtView
  lineup={effectiveLineup}  // NOT raw lineup
  // ... other props
/>
```

**Step 3:** Add a visual indicator on court cards for subbed-in players. In `CourtView.jsx`, check if the player at a position differs from the base lineup:

```javascript
const isSubbedIn = baseLineup[positionId] !== effectiveLineup[positionId]

// On the player card, if subbed in, show a swap icon or amber left border:
{isSubbedIn && (
  <div className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] px-1 rounded font-bold">
    SUB
  </div>
)}
```

**Verify:** Plan a sub at R3. View R1 → original starter shown. View R3 → sub player shown with "SUB" badge. View R6 (if return set) → original starter back.

---

## ISSUE 3: Rotation Tab — Add Formation Phase Views

**Problem:** The Rotations tab only shows "All Rotations" (the basic 6 rotation thumbnails). The coach wants to see formation-specific court views: Serve Receive, Offense (Attack), and Defense positioning for each rotation.

**Context:** In volleyball, players don't just stand in their rotational positions. Depending on the game phase, they shift into specific positions:
- **Base/Home:** Standard rotational positions (what we currently show)
- **Serve Receive:** Players shift into passing lanes (libero replaces a middle, passers spread to cover the court). The arrangement depends on the rotation number and formation.
- **Offense/Attack:** After serve receive, players transition to their attacking positions (setter goes to target, hitters approach)
- **Defense:** Positions shift for blocking and floor defense based on where the attack is coming from

**Fix — Add formation phase sections to the Rotations tab in `RightPanel.jsx`:**

The Rotations tab should have sub-sections:

```
ALL ROTATIONS (existing)
[Rot 1] [Rot 2] [Rot 3] [Rot 4] [Rot 5] [Rot 6]

SERVE RECEIVE
[Rot 1] [Rot 2] [Rot 3] [Rot 4] [Rot 5] [Rot 6]

OFFENSE
[Rot 1] [Rot 2] [Rot 3] [Rot 4] [Rot 5] [Rot 6]

DEFENSE
[Rot 1] [Rot 2] [Rot 3] [Rot 4] [Rot 5] [Rot 6]
```

Each section shows 6 mini court thumbnails in a 3×2 grid, same as the current "All Rotations" view. The difference is WHERE the player markers are positioned within each thumbnail.

**Define the position maps for 5-1 formation:**

Create a new file `src/constants/formationPhases.js`:

```javascript
// ============================================
// FORMATION PHASE POSITIONS
// For each formation, rotation, and phase, define where players should be
// Positions are given as grid coordinates: [row, col] where
// row 0-1 = front row (0=left, 1=center, 2=right)
// row 2-3 = back row
// The "id" corresponds to the role/position in the lineup
// ============================================

// 5-1 Offense — Serve Receive positions
// In serve receive, the libero replaces the middle blocker in the back row
// The 3 passers (typically OH, OH, Libero) form a W or 3-person receive pattern
// Non-passers tuck to the net or sideline to stay out of the way

export const FORMATION_PHASES = {
  '5-1': {
    serve_receive: {
      // Rotation 1: S is at P1 (right back, serving)
      // After serve, SR pattern: OH at left-back, Libero middle-back, OH right
      // MB tucks to net, OPP tucks to right-front, S stays right-back
      1: {
        label: 'Rotation 1',
        // positions: { playerId mapping not needed — use role-based placement }
        // Instead, define which roles go where in the mini court:
        slots: [
          // Front row (left to right): roles that are in front
          { role: 'MB', position: 'front-left', label: 'M2' },
          { role: 'OPP', position: 'front-center', label: 'R' },
          { role: 'OH', position: 'front-right', label: 'H1' },
          // Back row (left to right):
          { role: 'OH2', position: 'back-left', label: 'H2' },
          { role: 'L', position: 'back-center', label: 'L' },
          { role: 'S', position: 'back-right', label: 'S1' },
        ]
      },
      2: {
        label: 'Rotation 2',
        slots: [
          { role: 'OPP', position: 'front-left', label: 'R' },
          { role: 'OH', position: 'front-center', label: 'H1' },
          { role: 'MB', position: 'front-right', label: 'M1' },
          { role: 'L', position: 'back-left', label: 'L' },
          { role: 'S', position: 'back-center', label: 'S1' },
          { role: 'OH2', position: 'back-right', label: 'H2' },
        ]
      },
      // ... rotations 3-6 following standard 5-1 serve receive patterns
      // CC should define all 6 rotations following standard volleyball positioning rules
    },
    offense: {
      // After serve receive, players transition to attack positions
      // Setter goes to target (usually position 2.5 area — right of center front)
      // Hitters approach from their hitting zones
      // Middle reads for quick attack
      1: { /* ... */ },
      // ... all 6 rotations
    },
    defense: {
      // Base defense positions
      // Depends on blocking scheme (rotate/swing/dedicated)
      // Standard: blockers at net, back row in defensive positions
      1: { /* ... */ },
      // ... all 6 rotations
    },
  },
  '6-2': {
    // Same structure, different positioning
    serve_receive: { /* ... */ },
    offense: { /* ... */ },
    defense: { /* ... */ },
  },
}
```

**IMPORTANT FOR CC:** The exact positions for each rotation in each phase are well-documented in volleyball coaching resources. CC should define all 6 rotations for 5-1 serve receive, offense, and defense using standard volleyball positioning conventions:
- In 5-1 serve receive: the back-row middle is replaced by the libero. The 3 passers form a W. Front-row players tuck to stay legal.
- In 5-1 offense: setter targets zone 2.5, opposite hits zone 2, outside hits zone 4, middle hits zone 3.
- In 5-1 defense: standard base 6 defense or rotational defense.
- For 6-2: same concept but the back-row setter sets, front-row setter hits.
- For 4-2 and 6-6: simpler positioning (4-2 front-row setter, 6-6 equal positioning).

If CC can't determine exact positions, use the reference image shared by the user (the strength-and-power-for-volleyball.com diagram) as the template for rotation 1 serve receive, and rotate from there.

**Clicking a formation phase thumbnail:** When the coach clicks a serve receive or offense thumbnail, the main court view should shift the player cards to those positions as a visual cue. This means:
1. Add a `courtPhase` state: `'base' | 'serve_receive' | 'offense' | 'defense'`
2. When a phase thumbnail is clicked, set the phase
3. `CourtView` receives the phase and adjusts player card positions accordingly
4. Add a banner above the court: "Viewing: Serve Receive — Rotation 3" (with a [Back to Base] button)

For V1, the position adjustments can be approximate — showing the right ROLES in the right AREAS of the court. Pixel-perfect serve receive formations can be refined later.

**Verify:** Rotations tab shows 4 sections. Serve receive thumbnails show different positioning than base rotations. Clicking a serve receive thumbnail shifts the court view.

---

## ISSUE 4: Update Contextual Top Nav for Compete and Practice

**Problem:** The horizontal top nav bar (shown below the main app nav) doesn't update correctly when navigating to Compete or Practice section pages. The contextual links should reflect the section the coach is in.

**Fix in `src/MainApp.jsx`:**

Find the contextual nav mapping (the investigation report said it's around lines 915-969). Look for where `gameprep` maps to contextual links. Update or add mappings for:

**Compete section pages:**
```javascript
// When on any Compete page, show these contextual links:
const competeContextNav = ['gameprep', 'attendance', 'standings', 'leaderboards']

// Mapping:
'gameprep': { links: competeContextNav, label: 'Game Prep' },
'standings': { links: competeContextNav, label: 'Standings' },
'leaderboards': { links: competeContextNav, label: 'Leaderboards' },
'attendance': { links: competeContextNav, label: 'Attendance' },
```

**Practice section pages:**
```javascript
// When on any Practice page, show these contextual links:
const practiceContextNav = ['drills', 'practice-plans']

// Mapping:
'drills': { links: practiceContextNav, label: 'Drill Library' },
'practice-plans': { links: practiceContextNav, label: 'Practice Plans' },
```

Find the exact pattern used for the contextual nav and replicate it. The key is that when a coach navigates to `/drills`, the top nav should show "Drill Library" and "Practice Plans" as peer links. When on `/gameprep`, it should show "Game Prep", "Attendance", "Standings", "Leaderboards".

Also verify: when the lineup builder is open (full-screen overlay), does the top nav still show? Based on the R2 fix, it should. If it does, the contextual links should still be from the Compete section.

**Verify:** Navigate to Game Prep → top nav shows Compete section links. Navigate to Drills → top nav shows Practice section links. Navigate to Dashboard → top nav shows default links (if any).

---

## EXECUTION ORDER

1. Issue 1 — Subs persistence (DB migration + save/load) — **run the migration SQL manually after CC creates the file**
2. Issue 2 — Subs reflect on court (getEffectiveLineup + visual indicator)
3. Issue 4 — Top nav contextual links (quick fix, touches MainApp.jsx)
4. Issue 3 — Formation phase views (largest task, new constants file + Rotations tab update + court phase state)

---

## VERIFICATION CHECKLIST

- [ ] Create planned subs → save lineup → leave → return → subs are preserved
- [ ] View rotation where sub is active → court shows substitute player with "SUB" badge
- [ ] View rotation before sub → original starter shown
- [ ] View rotation after return → original starter is back
- [ ] Rotations tab shows 4 sections: All Rotations, Serve Receive, Offense, Defense
- [ ] Serve receive thumbnails show different player positioning than base
- [ ] Clicking a serve receive thumbnail shifts the main court view
- [ ] Court shows "Viewing: Serve Receive — Rotation X" banner with back button
- [ ] Top nav updates when navigating to Compete pages (Game Prep, Standings, etc.)
- [ ] Top nav updates when navigating to Practice pages (Drills, Practice Plans)
- [ ] All above works in light and dark mode

**Commit:** `feat(lineup-v2): R3 — sub persistence, court reflection, formation phases, contextual nav`

---

## IMPORTANT NOTES

1. The `game_lineup_metadata` table migration SQL must be run manually in Supabase SQL Editor BEFORE testing sub persistence.
2. Formation phase position data (serve receive, offense, defense for each rotation) is volleyball-specific. For other sports, this section of the Rotations tab should be hidden or show a "Coming soon" message.
3. The formation phases are APPROXIMATE for V1 — the exact positioning can be refined with coach input. Getting the right ROLES in the right AREAS is more important than pixel-perfect placement.
4. Do NOT break existing rotation functionality while adding phase views. The base "All Rotations" section must continue to work exactly as it does now.
