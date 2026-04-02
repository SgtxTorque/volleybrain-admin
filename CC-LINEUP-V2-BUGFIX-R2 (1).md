# CC-LINEUP-V2-BUGFIX-R2.md
# Lynx Web Admin — Lineup Builder V2 Bugfix Round 2
# EXECUTION SPEC

**Type:** Bugfix  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`  
**Context:** Round 1 bugfixes addressed some issues but several remain. This spec fixes the remaining problems.

---

## ISSUE 1: Header still cutting off the app top nav

**Problem:** The lineup builder overlay is now hiding the app's top navigation bar (Lynx Coach, Game Prep, Attendance, Standings, Leaderboards). Before the fix, the top nav was hiding the lineup builder header. Now it's the reverse — the lineup builder covers the top nav. Neither is correct.

**What we actually want:** The lineup builder should render BELOW the app top nav, not on top of it and not behind it. The app top nav stays visible and functional. The lineup builder fills the remaining viewport height beneath it.

**Fix:** Change the lineup builder from `fixed inset-0` to positioning that respects the app top nav:

```jsx
// INSTEAD of: fixed inset-0 z-[60]
// USE: fixed top-[TOPNAV_HEIGHT] left-0 right-0 bottom-0 z-[50]
```

To find the correct top offset:
1. Inspect `src/MainApp.jsx` or the layout wrapper to find the top nav bar height. It's likely 56px or 64px. Check the rendered HTML or look for a CSS variable.
2. If there's no CSS variable, measure it: look for the nav bar component and check its `h-14` (56px) or `h-16` (64px) or explicit pixel height.
3. Apply that as the `top` value on the lineup builder container.

Alternatively, if the lineup builder is rendered INSIDE the app layout (not as a portal), change it from `fixed` to `absolute` and let it fill its parent container naturally.

**The key principle:** The Lynx top nav bar and sidebar should remain visible. The lineup builder fills the CONTENT area, not the entire viewport. Look at how other full-screen modals work in the app (like GameDayCommandCenter) — follow that same pattern.

**Verify:** Both the app top nav AND the lineup builder header (team name, set tabs, formation, save button) are fully visible simultaneously.

---

## ISSUE 2: Player cards and court still too small

**Problem:** The cards got the photo treatment (good), but they're still too small. Need to be 50% larger than current size.

**Fix:** Find the card width/height values in `CourtView.jsx` and increase them by 50%.

If current card size is approximately:
- Width: ~130px → change to **195px**
- Height: ~170px → change to **255px**

If using different values, multiply whatever the current values are by 1.5.

Also ensure:
- The court container itself expands to accommodate the larger cards. If the court has a max-width constraint, increase it or remove it.
- The gap between cards should scale proportionally (if currently 12px gap, make it 16-18px)
- On smaller screens (13" laptop), if cards overflow, reduce to 1.3x instead of 1.5x using a media query or responsive sizing (e.g., `clamp(160px, 15vw, 250px)` for width)

**Verify:** Cards are visibly larger and legible on a 24" monitor without squinting. Photos fill the card and player info is easy to read.

---

## ISSUE 3: Control bar cut off on the left side

**Problem:** The bottom control bar content is being clipped on the left edge. The rotation numbers and controls are partially hidden.

**Fix:** The control bar is likely being affected by the sidebar width. Check if the lineup builder's `left` position accounts for the sidebar. If using `left-0`, the control bar starts behind the sidebar.

Two approaches:
1. If the lineup builder should fill the full viewport (over the sidebar): ensure the control bar has sufficient left padding (e.g., `pl-[60px]` or `pl-[var(--v2-sidebar-width)]`) to clear the sidebar, OR
2. If the lineup builder should sit next to the sidebar: set `left-[60px]` or `left-[var(--v2-sidebar-width)]` on the builder container

Use the same approach as the top nav fix — the builder should respect the existing app chrome (sidebar + top nav) and fill the content area.

**Verify:** All control bar content (rotation label, all 6 number buttons, arrows) is fully visible with nothing clipped.

---

## ISSUE 4: Position role badges move with the position, not the player

**Problem:** When Sophia #9 is placed at P1 (Setter position in 5-1), her card shows "S" badge. After 2 rotations, she moves to a different position, but her badge changes to "MB" — it's showing the POSITION's role instead of the PLAYER's role.

**Current behavior (wrong):** The badge shows whatever role is defined for that court position slot (P1=OH, P2=OPP, P3=MB, etc. depending on formation).

**Correct behavior:** The badge on a player card should show THAT PLAYER's assigned role — the role they had when they were placed on the court. When a player is dropped onto a position, their role is captured. When they rotate to a different physical position on the court, their role badge should follow them.

**Fix in `CourtView.jsx`:**

The position role badge must come from the PLAYER's data, not from the formation position definition. There are two approaches:

**Approach A (Recommended): Store the player's role when they're placed**

When a player is dropped onto a court position, record their role in the lineup state:
```javascript
// Instead of lineup = { positionId: playerId }
// Use lineup = { positionId: { playerId, role } }
// OR keep lineup as is but maintain a separate roleMap:
const [playerRoles, setPlayerRoles] = useState({})  // { playerId: 'S' }

function handleDrop(positionId, playerId) {
  // ... existing logic
  
  // Capture the role from the position they're dropped onto
  const position = positions.find(p => p.id === positionId)
  setPlayerRoles(prev => ({ ...prev, [playerId]: position.role }))
}
```

Then when rendering the card at any rotation:
```jsx
// Show the player's assigned role, not the current position's role
const playerRole = playerRoles[player.id] || player.position || ''
<span className="role-badge" style={{ backgroundColor: ROLE_COLORS[playerRole] }}>
  {playerRole}
</span>
```

**Approach B: Use the player's position from the roster data**

If `player.position` exists in the roster data (from `team_players.position`), just always show that:
```jsx
const playerRole = player.position || ''
```

This is simpler but less accurate if a coach places a player in a different role than their default.

**Go with Approach A** — it's more accurate because the coach explicitly chose which position slot to place the player in, and that initial role assignment should stick through rotations.

**Verify:** Place Sophia at P1 (S position). Rotate twice. Sophia's card should still show "S" badge, not whatever role belongs to the position she's now physically sitting in.

---

## ISSUE 5: Roster tab missing player stats, overall score, and position

**Problem:** The roster cards in the right panel only show photo, jersey number, and name. No position, no overall rating, no stats.

**Fix in `RightPanel.jsx` (Roster tab):**

Update each roster player card to show:
```
┌──────────────────────────────────────┐
│ [Photo 48x48]  #7 Sarah Johnson      │
│                 OH · Overall: 8.2     │
│                 On Court              │
└──────────────────────────────────────┘
```

Fields to display:
- Photo (already shown)
- Jersey number + full name (already shown)
- **Position** from `team_players.position` or `players.position` — show as text (e.g., "OH", "S", "MB")
- **Overall rating** — if available from `player_skill_ratings` or computed from evaluations. This might require an additional query.
- **"On Court" badge** (already shown) — keep this

**Data check:** Look at what data is currently fetched in the `loadData()` function in `LineupBuilderV2.jsx`. The roster query likely joins `team_players` with `players`. Check if `position` is already available on the player objects. If so, just display it.

For overall rating: check if `player_skill_ratings` is accessible. If the roster query doesn't include ratings, add a supplementary fetch:
```javascript
const { data: ratings } = await supabase
  .from('player_skill_ratings')
  .select('player_id, overall_rating')
  .in('player_id', roster.map(p => p.id))
```

If `player_skill_ratings` doesn't have an `overall_rating` column, check `player_evaluations` or compute an average from individual skill scores. If no rating data exists at all for a player, just show the position without a rating number.

**Also update** the roster card to show the player's position with a colored dot or small badge matching the position color system (OH=red, S=teal, etc.).

**Verify:** Roster cards show position and overall rating (when available) alongside name and number.

---

## ISSUE 6: Bottom control bar needs space for future content

**Problem:** The control bar area at the bottom was requested to have room for future dynamic content (like the mockup shows: bench players, substitution timeline, court rating). Currently it's a thin strip.

**Fix:** Increase the control bar area height. Instead of a single 56px strip, create a two-section bottom area:

```
┌──────────────────────────────────────────────────────┐
│ CONTROL BAR (60px)                                    │
│ ROTATION [1][2][3][4][5][6] [>]    [Formation ▼]     │
├──────────────────────────────────────────────────────┤
│ EXPANSION AREA (120px, reserved for future content)   │
│                                                       │
│ (Empty for now — will house bench strip,              │
│  substitution timeline, court rating, etc.)           │
│                                                       │
└──────────────────────────────────────────────────────┘
```

Total bottom area: ~180px. The expansion area should be a placeholder container with a subtle top border, using theme-appropriate background. No content yet — just the reserved space so the layout is ready.

Use the mockup reference (Image 3 from the uploads — the dark bar showing "BENCH / AVAILABLE", bench player photos, and "SUBSTITUTION TIMELINE" with R1-R6 dots) as the target layout for this area. Don't build the content yet, but size the container to match.

**Verify:** Bottom area is taller, with a clear division between control bar and expansion area. The expansion area is visible but empty/placeholder.

---

## ISSUE 7: Substitutions must be paired (out AND back in) and reflected on the court

**Problem:** Currently the subs tab lets you set a single sub (e.g., #11 Test out → #12 Maya in at R3), but volleyball substitutions are PAIRED. When Player A is subbed out for Player B, the rules require that Player A can ONLY come back in for Player B (and vice versa). The coach needs to specify both the "out" rotation and the "back in" rotation. And when viewing a rotation where a sub is active, the court should show the substituted player, not the original starter.

**How volleyball subs actually work:**
- Rotation 1: #11 Test is on court at P1 (OH)
- Rotation 3: Coach subs #11 Test OUT, #12 Maya comes IN at that same position
- Rotation 3-5: #12 Maya is on court in #11's spot
- Rotation 6: #11 Test comes BACK IN, #12 Maya goes back to bench
- This is ONE substitution pair. It counts as 2 of the 12 allowed subs (one out, one back in).

**Fix — Substitution data model:**

Update the planned subs state to store pairs:
```javascript
const [plannedSubs, setPlannedSubs] = useState([])
// Each sub is a PAIR:
// {
//   id: uuid,
//   starterPlayerId: 'player-11',     // The starter who leaves
//   subPlayerId: 'player-12',         // The bench player who enters
//   outRotation: 3,                   // Rotation when the sub happens
//   inRotation: 6,                    // Rotation when the starter returns (null = stays out)
//   positionId: 1,                    // Which court position this affects
// }
```

**Fix — Subs tab UI:**

When the coach creates a sub, the form should ask:
1. Which starter is coming OUT? (dropdown of current starters)
2. Who is coming IN from the bench? (dropdown of bench players)
3. At which rotation does the sub happen? (rotation picker, 1-6)
4. At which rotation does the starter come BACK IN? (rotation picker, 1-6, or "Does not return this set")

Display each planned sub as:
```
┌──────────────────────────────────────────────────┐
│  R3  #11 Test → #12 Maya                    [x] │
│  R6  #12 Maya → #11 Test (return)                │
│                                         2/12 subs│
└──────────────────────────────────────────────────┘
```

Each paired sub counts as 2 toward the sub limit. Show the count: `2/12 SUBS` (not 1/12).

If the coach selects "Does not return this set", it's only 1 sub used, and the bench player stays in for the remainder of the set.

**Fix — Court reflects active subs per rotation:**

This is the critical piece. When the coach views a specific rotation, the court must show who is ACTUALLY on the court at that rotation, accounting for all planned subs.

Add a function that computes the effective lineup for any given rotation:
```javascript
function getEffectiveLineup(baseLineup, plannedSubs, currentRotation) {
  const effective = { ...baseLineup }
  
  for (const sub of plannedSubs) {
    // Is this sub active at the current rotation?
    const subIsActive = (
      currentRotation >= sub.outRotation && 
      (sub.inRotation === null || currentRotation < sub.inRotation)
    )
    
    if (subIsActive) {
      // Find which position the starter is at and replace with sub player
      const positionId = Object.keys(effective).find(
        key => effective[key] === sub.starterPlayerId
      )
      if (positionId) {
        effective[positionId] = sub.subPlayerId
      }
    }
  }
  
  return effective
}
```

The court view should use `getEffectiveLineup()` instead of the raw `lineup` state when rendering players. This way:
- At Rotation 1-2: Court shows #11 Test in their position
- At Rotation 3-5: Court shows #12 Maya in that position (with a visual indicator that this is a sub, like a small swap icon or different border)
- At Rotation 6: Court shows #11 Test back in their position

**Visual indicator for subbed-in players:** When a bench player is on the court due to a sub, show a small swap icon (↔) or a colored border (amber) on their card to indicate they're not the original starter.

**Fix — Subs tab badge:**

The Subs tab already shows a badge (the ① in the screenshot). Update it to show the count of active sub PAIRS, and make the badge amber if any subs are planned, green if all subs have return rotations set.

**Verify:**
1. Create a sub: #11 out for #12 at R3, #11 returns at R6
2. View Rotation 1 → #11 is on court
3. View Rotation 3 → #12 is on court (with swap indicator), #11 is NOT on court
4. View Rotation 6 → #11 is back on court, #12 is back on bench
5. Sub counter shows 2/12
6. Create a sub with "Does not return" → counter shows 1/12
7. Subs tab shows both the out and return as a paired entry

---

## EXECUTION ORDER

1. Issue 1 — Header/nav positioning (fixes the fundamental layout)
2. Issue 3 — Control bar clipping (related to the same positioning fix)
3. Issue 2 — Card sizing (50% larger)
4. Issue 6 — Bottom area expansion
5. Issue 4 — Position role badges follow the player
6. Issue 5 — Roster stats and position display
7. Issue 7 — Substitution pairing and court reflection

---

## VERIFICATION CHECKLIST

After all fixes:
- [ ] App top nav (Lynx Coach, Game Prep, etc.) is fully visible
- [ ] Lineup builder header (team, set tabs, save) is fully visible below the app nav
- [ ] Sidebar is visible (if that's the intended behavior) or properly accounted for
- [ ] Control bar is fully visible, nothing clipped on left or right
- [ ] Player cards on court are approximately 50% larger than the previous build
- [ ] Player photos fill the card with name/number/role overlaid at bottom
- [ ] Bottom area has reserved expansion space (~120px) below the control bar
- [ ] Position role badges follow the PLAYER through rotations (Sophia stays "S" everywhere)
- [ ] Roster cards show position and overall rating
- [ ] All above works in both light and dark mode
- [ ] Subs are created as pairs (out rotation + return rotation)
- [ ] Court shows the substituted player at the correct rotations
- [ ] Subbed-in players have a visual indicator (swap icon or colored border)
- [ ] Sub counter counts each pair as 2 subs (out + in = 2 of 12)
- [ ] "Does not return" option counts as 1 sub
- [ ] Viewing different rotations correctly swaps players on/off court per the sub plan

**Commit:** `fix(lineup-v2): R2 — layout positioning, card sizing, role badges follow player, roster stats, paired substitutions with court reflection`
