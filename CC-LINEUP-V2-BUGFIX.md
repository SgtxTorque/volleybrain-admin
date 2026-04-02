# CC-LINEUP-V2-BUGFIX.md
# Lynx Web Admin — Lineup Builder V2 Bugfix & Polish
# EXECUTION SPEC

**Type:** Bugfix + Polish  
**Branch:** `feat/v2-dashboard-redesign` (same branch, on top of existing commits)  
**Run with:** `--dangerously-skip-permissions`  
**Context:** QA revealed multiple layout, interaction, and logic issues after the initial 5-phase build. This spec fixes all of them.

---

## ISSUES TO FIX (in priority order)

### ISSUE 1: Header bar is cut off / hidden behind the app top bar
**Problem:** The lineup builder header (team name, set tabs, save button, formation badge, etc.) is being obscured by the main Lynx top navigation bar. On all monitor sizes, the content at the top of the lineup builder is not visible.

**Root cause:** The lineup builder uses `fixed inset-0` which puts it at the very top of the viewport, but the Lynx app has a top nav bar that sits on top of it, or the header content doesn't account for the nav bar height.

**Fix:** The lineup builder overlay needs to either:
- Use `z-[60]` or higher to sit above the app nav, AND render its own self-contained header that is fully visible, OR
- Account for the app top nav height by adding `top-[var(--nav-height)]` or a fixed pixel offset

Investigate how the old `AdvancedLineupBuilder` handled this (it was also `fixed inset-0 z-[60]`). The V2 builder should render as a true full-screen takeover — the app nav should NOT be visible while the builder is open. If the app nav is bleeding through, increase z-index or ensure the builder's background is opaque and covers the entire viewport.

**Verify:** On 13", 24", 27", and large monitors, the header bar with team name, set tabs, formation badge, and save button must be fully visible and not obscured.

---

### ISSUE 2: Court and player cards are too small
**Problem:** The court visualization with player cards is tiny on all screen sizes, including 27" and 43" monitors. Player photos are barely legible. The circle avatar crops out most of the player photo.

**Fix — Player cards on court:**
- Remove the circle avatar crop. Player photos should fill the entire card as a background image, similar to the mockup reference (the "Stephanie #99 Outside Hitter 2" card style).
- Card layout should be: full photo as card background (object-cover), with a gradient overlay at the bottom (dark gradient fading up from bottom), and on top of that gradient: jersey number (large, bold), first name, and position role badge.
- Minimum card size: **140px wide × 180px tall** on desktop. Scale proportionally.
- If no photo, show a gradient placeholder (same as existing pattern) with the jersey number large and centered.

**Fix — Court sizing:**
- The court container should use more of the available vertical space. Currently it appears the court is not expanding to fill its flex container.
- The court should take `flex: 1` and the cards within should size relative to the court container, not use tiny fixed pixel values.
- Front row and back row should each take roughly 40% of the court height, with the NET and ATTACK LINE taking the remaining 20%.
- Add `min-height: 0` on the court flex container to prevent flex overflow issues.

**Reference:** Look at the uploaded mockup image showing "Stephanie #99 Outside Hitter 2" — the player photo IS the card. Number and name overlay at the bottom with a dark gradient. Position role as a small badge. This is the target aesthetic.

---

### ISSUE 3: Right panel too narrow, needs more player info
**Problem:** The right panel at 380px is cramped. Player cards in the roster list show only number and name, with no stats.

**Fix:**
- Increase right panel width from `380px` to `420px` (or use `min-width: 420px; max-width: 480px` with flex)
- Update roster player cards to show: photo (48x48), jersey number, full name, position, AND their overall rating if available (from `player_skill_ratings` or computed stats)
- If top stats are available (kills/game, aces/game, digs/game), show the top 2-3 as small stat pills next to the player name
- This requires updating the roster data fetch to JOIN with stats data. Check if the current `loadData()` function already pulls stats — if not, add a supplementary query

---

### ISSUE 4: Action buttons (Copy/Auto-Fill/Clear/Valid) should move into court area
**Problem:** "Copy to all sets", "Auto-Fill", "Clear", and "Lineup Valid" are in the bottom control bar, which is hard to find and feels disconnected from the court.

**Fix:** Move these action buttons into the court section. Place them in a horizontal row, centered, at the TOP of the court area (between the header bar and the NET label). They should be compact pill buttons.

Layout of the court area should become:
```
┌─────────────────────────────────────────┐
│ [Copy to all sets] [Auto-Fill] [Clear]  │  ← action buttons, centered
│              [Lineup Valid ✓]           │  ← status pill, centered below
│                                         │
│              ── NET ──                  │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ Player │ │ Player │ │ Player │     │  ← front row (larger cards)
│  │  Card  │ │  Card  │ │  Card  │     │
│  └────────┘ └────────┘ └────────┘     │
│           ╌╌ ATTACK LINE ╌╌           │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ Player │ │ Player │ │ Player │     │  ← back row (larger cards)
│  │  Card  │ │  Card  │ │  Card  │     │
│  └────────┘ └────────┘ └────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

Remove these buttons from `ControlBar.jsx` and add them to `CourtView.jsx`.

---

### ISSUE 5: Bottom control bar is hard to find and underutilized
**Problem:** The control bar at the very bottom is barely noticeable. The rotation controls are tiny and their purpose is unclear. There's wasted space below the court.

**Fix:**
- **Rotation controls:** Make the rotation number buttons larger (at least 36x36px each, currently they appear much smaller). Add a clear label: "ROTATION" before the number buttons. The active rotation should have a prominent highlight (accent color fill, not just a subtle border change).
- **Add "Court Rating" display:** Calculate and show the average overall rating of the 6 players currently on the court. Display as a large number with label: "Court Rating: 8.2" or similar. Place this in the control bar or in a new section between the court and the control bar.
- **Consider moving the formation dropdown** up to the header bar if it's not already there, so the control bar can be more focused on rotation + court-level info.
- **If the control bar ends up feeling empty after moving action buttons to the court:** Add dynamic content like a mini rotation preview (showing what the next rotation looks like), or the court rating, or the libero swap indicator.

---

### ISSUE 6: Cannot remove players from court
**Problem:** Once a player is placed on a court position, there is no way to remove them. Dragging off doesn't work. No X button or remove action visible.

**Fix:** Add a remove button to each filled court position card. When a player card is shown on the court:
- Show a small X button in the top-right corner of the card (appears on hover on desktop)
- Clicking X calls `removeFromPosition(positionId)` which already exists in the code
- The X button should be subtle (semi-transparent background) so it doesn't dominate the card, but clearly clickable

Also investigate: the original `AdvancedLineupBuilder` had remove functionality — check if `removeFromPosition()` is wired up in the V2 `CourtView.jsx`. If the function exists but isn't connected to a click handler, add the handler.

---

### ISSUE 7: Cannot swap players between court positions
**Problem:** Dragging a player from one court position to another court position doesn't work. Can only drag from roster to court.

**Fix:** Make court position cards draggable as well as being drop targets. When a player card on the court is dragged to another court position:
1. If the target position is empty → move the player there (remove from source, place at target)
2. If the target position has a player → swap the two players

Update `handleDrop()` in `LineupBuilderV2.jsx` to handle the swap case:
```javascript
function handleDrop(targetPositionId, incomingPlayerId) {
  const newLineup = { ...lineup }
  
  // Find if incoming player is already on court (swap scenario)
  const sourcePositionId = Object.keys(newLineup).find(
    key => newLineup[key] === incomingPlayerId
  )
  
  // Find who is currently at the target position
  const targetPlayerId = newLineup[targetPositionId]
  
  // Remove incoming player from source position
  if (sourcePositionId) {
    if (targetPlayerId) {
      // SWAP: put target player at source position
      newLineup[sourcePositionId] = targetPlayerId
    } else {
      // MOVE: just remove from source
      delete newLineup[sourcePositionId]
    }
  }
  
  // Place incoming player at target
  newLineup[targetPositionId] = incomingPlayerId
  
  setLineup(newLineup)
  setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
}
```

Also make the court player cards draggable:
```jsx
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData('playerId', player.id)
    setDraggedPlayer(player)
  }}
  // ... existing drop target handlers
>
```

---

### ISSUE 8: Serving indicator (volleyball) follows the player instead of the position
**Problem:** The volleyball/serve indicator stays with Ava (#1) when she rotates away from P1. It should stay at whatever position is P1 (Right Back / Serve), since the server is always the player in P1.

**Fix:** The serving indicator must be tied to the POSITION, not the PLAYER. In `CourtView.jsx`, the volleyball emoji/serve badge should render based on `position.id === 1` (P1 is always the serving position), NOT based on which player was originally at P1.

Find the code that renders the serve indicator and change:
```jsx
// WRONG — tied to player or original position
{player.originalPosition === 1 && <ServingBadge />}

// CORRECT — tied to the visual position being P1
{position.id === 1 && <ServingBadge />}
```

Since rotations work by remapping which player appears at which visual position, the serve indicator should always appear at the P1 slot (Right Back), regardless of which player is currently showing there.

---

### ISSUE 9: Subs tab is non-functional
**Problem:** The Substitutions tab in the right panel doesn't load bench players or allow planning substitutions.

**Fix:** The Subs tab needs to:
1. Show all bench players (roster players NOT in the current lineup and NOT the libero)
2. Allow the coach to plan a substitution: select a rotation number (1-6), select the player coming OUT (from starters), select the player coming IN (from bench)
3. Display planned subs as a list with: rotation #, OUT player → IN player, [Remove] button
4. Track sub count against the limit (USAV: 12 subs per set for most levels, 18 for some — make this configurable, default 12)
5. When viewing a specific rotation, show if any subs are planned for that rotation

**Implementation in `RightPanel.jsx` (Subs tab):**
```jsx
// State for planned subs
const [plannedSubs, setPlannedSubs] = useState([])
// { id, rotation, outPlayerId, inPlayerId }

// Bench players = roster minus starters minus libero
const benchPlayers = roster.filter(p => 
  !Object.values(lineup).includes(p.id) && p.id !== liberoId
)

// Sub form: rotation picker, out player dropdown (starters), in player dropdown (bench)
// On save: add to plannedSubs array
// Display as list with remove option
// Show counter: X/12 SUBS USED
```

Note: For V2, planned subs are UI-only state (stored in component state, saved with the lineup). If the `game_lineups` table doesn't have a substitutions column, store planned subs as part of a JSONB field or defer DB persistence to a follow-up. The important thing is the UI works.

---

### ISSUE 10: 6-6 Recreational rotation logic is wrong
**Problem:** In 6-6 (recreational/free substitution) rotation, the current code rotates all 6 players in a circle like standard volleyball. But 6-6 works differently:

**How 6-6 actually works:**
- When the team wins the serve back (side-out), players rotate clockwise as normal
- BUT: the player rotating OUT of P1 (who just served and is now moving to P6... no, the player at P1 rotates to... actually, in rec 6-6, the player who was serving LEAVES the court entirely
- Specifically: Player at P1 serves. After side-out, P2→P1, P3→P2, P4→P3, P5→P4, P6→P5. The player who was at P1 exits the court. The NEXT player in line from the bench enters at P6.
- This creates a continuous rotation through the entire roster, not just the 6 on the court.

**Fix:** Add special rotation logic for 6-6 formation:

```javascript
function rotateRecreational() {
  // In 6-6, when rotating:
  // 1. Player at P1 leaves the court (goes to end of bench queue)
  // 2. Everyone shifts: P2→P1, P3→P2, P4→P3, P5→P4, P6→P5
  // 3. Next bench player enters at P6
  
  const newLineup = { ...lineup }
  const exitingPlayerId = newLineup[1]  // Player leaving P1
  
  // Shift everyone clockwise
  newLineup[1] = newLineup[2]  // P2 → P1
  newLineup[2] = newLineup[3]  // P3 → P2
  newLineup[3] = newLineup[4]  // P4 → P3
  newLineup[4] = newLineup[5]  // P5 → P4
  newLineup[5] = newLineup[6]  // P6 → P5
  
  // Next bench player enters at P6
  const benchQueue = getBenchQueue()  // Ordered list of bench players
  const nextPlayer = benchQueue[0]
  if (nextPlayer) {
    newLineup[6] = nextPlayer.id
  } else {
    delete newLineup[6]  // No one available
  }
  
  // Exiting player goes to end of bench queue
  // (This is implicit — they're just no longer in the lineup)
  
  setLineup(newLineup)
  setSetLineups(prev => ({ ...prev, [currentSet]: newLineup }))
}
```

The bench queue order matters in 6-6. Add a concept of "bench order" — when in 6-6 mode, the roster panel should show bench players in a specific order that represents who goes in next. Allow drag-to-reorder on the bench list.

When `formation === '6-6'`:
- Use `rotateRecreational()` instead of the standard rotation offset math
- Show the bench as an ordered queue with "Next In" indicator on the first bench player
- The rotation counter shows how many rotations have happened (not 1-6, since it can go beyond 6)
- Hide the libero section (no libero in 6-6 rec)

---

## EXECUTION ORDER

Fix these in this order (dependencies flow downward):

1. **Issue 1** (header visibility) — must fix first so you can see the rest of the UI
2. **Issue 2** (court/card sizing) — visual foundation
3. **Issue 3** (right panel width + stats) — visual foundation
4. **Issue 4** (move action buttons to court) — layout change
5. **Issue 5** (control bar improvements) — layout change
6. **Issue 6** (remove players) — interaction fix
7. **Issue 7** (swap players) — interaction fix
8. **Issue 8** (serve indicator) — logic fix
9. **Issue 10** (6-6 rotation) — logic fix
10. **Issue 9** (subs tab) — feature completion

---

## VERIFICATION

After all fixes:

1. Open lineup builder on 13" laptop → header fully visible, court fills space, cards legible
2. Open on 27" monitor → same checks, cards scale up appropriately
3. Player cards show full photo as background with name/number/position overlaid
4. Right panel shows player stats alongside name
5. Action buttons (Copy/Auto-Fill/Clear/Valid) are at top of court area
6. Control bar has large, clear rotation buttons with "ROTATION" label
7. Click X on a court player card → player removed, returns to roster
8. Drag player from P4 to P2 (both occupied) → players swap positions
9. Drag player from P4 to empty P3 → player moves
10. Volleyball serve indicator stays at P1 position through all rotations
11. Subs tab shows bench players, can plan subs for specific rotations
12. Select 6-6 formation → rotate → P1 player exits, bench player enters at P6
13. 6-6 bench shows ordered queue with "Next In" indicator
14. All of the above works in both light and dark mode

**Commit:** `fix(lineup-v2): QA bugfixes — layout, sizing, interactions, 6-6 rotation, subs tab`

---

## IMPORTANT RULES

1. **Do NOT rewrite the entire component** — make targeted fixes to existing files
2. **Maintain theme compliance** — any new elements must use `useThemeClasses()`, no hardcoded colors
3. **Test the serve indicator** by clicking through rotations 1→2→3→4→5→6 — the volleyball should ALWAYS be at the P1 position slot
4. **For the player card photo treatment:** use `object-cover` on the img tag, with the card as a positioned container and the info overlay as `absolute bottom-0` with a gradient background
5. **The 6-6 rotation logic is fundamentally different** from 5-1/6-2/4-2 — do NOT try to use the same rotation offset math. It needs its own function.
