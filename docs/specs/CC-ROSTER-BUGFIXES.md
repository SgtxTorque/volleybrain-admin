# CC-ROSTER-BUGFIXES.md
## Roster Manager — Two Bug Fixes

**Read `src/pages/roster/RosterManagerPage.jsx` completely before making changes.**

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-bugfix checkpoint"
```

---

## BUG 1: Evaluation flow shows no players after clicking "Start Evaluation"

### Symptoms
- Overview tab shows 12 players correctly ✅
- Evaluate tab shows "All roster (12)" in the setup screen ✅
- After clicking "Start Evaluation →", no player appears for evaluation ❌

### Root Cause

The `startEvaluation()` function builds `evalPlayers` from the `roster` array. But the roster items are **enriched objects** with this structure:

```js
{
  id: "team_player_uuid",        // team_players.id
  player_id: "player_uuid",
  jersey_number: 7,
  joined_at: "...",
  players: {                      // <-- nested player data from Supabase join
    id: "player_uuid",
    first_name: "Sarah",
    last_name: "Johnson",
    photo_url: "...",
    position: "OH",
    grade: "8",
    ...
  },
  player: { ... },               // <-- alias set during enrichment: tp.players
  skills: { ... } | null,
  evalCount: 0,
  waiverSigned: false,
  positions: null,
  isNew: true,
}
```

The evaluation card component is probably trying to access `player.first_name`, `player.photo_url`, etc. directly on the roster item. But those fields live inside `roster[i].players` (or `roster[i].player`).

### Fix

**Step 1:** Find the `startEvaluation()` function. It likely does something like:

```js
function startEvaluation() {
  const players = roster.map(p => p)  // or similar
  setEvalPlayers(players)
  setEvalMode('evaluate')
}
```

Change it to explicitly extract player data and merge with team_players data:

```js
function startEvaluation() {
  // Build flat player objects from the enriched roster
  const players = roster
    .filter(tp => tp.player_id && (tp.players || tp.player))
    .map(tp => {
      const p = tp.players || tp.player
      return {
        id: tp.player_id,
        player_id: tp.player_id,
        first_name: p.first_name,
        last_name: p.last_name,
        photo_url: p.photo_url,
        position: p.position || tp.positions?.primary_position || null,
        grade: p.grade,
        jersey_number: tp.jersey_number || p.jersey_number,
        // Keep enrichment data available
        skills: tp.skills,
        evalCount: tp.evalCount,
      }
    })

  if (players.length === 0) {
    showToast?.('No players found to evaluate', 'error')
    return
  }

  setEvalPlayers(players)
  setEvalStep('evaluate')  // or whatever state controls showing the eval card
  setCurrentEvalIndex(0)
}
```

**Step 2:** Find the evaluation card rendering (where it shows the player photo, name, jersey#, ratings). Verify it accesses player fields correctly:

```jsx
// It should use evalPlayers[currentEvalIndex] directly:
const currentPlayer = evalPlayers[currentEvalIndex]

// And access fields as:
currentPlayer.first_name  // NOT currentPlayer.player.first_name
currentPlayer.photo_url   // NOT currentPlayer.player.photo_url
currentPlayer.jersey_number
currentPlayer.position
```

**Step 3:** Also check the "Selected (N)" mode. If the coach selects specific players via checkboxes in the Overview table, the selected player data needs the same flattening treatment:

```js
// If there's a selectedPlayers state for bulk evaluation:
const selectedForEval = selectedPlayers.map(tp => {
  const p = tp.players || tp.player
  return {
    id: tp.player_id,
    first_name: p.first_name,
    last_name: p.last_name,
    photo_url: p.photo_url,
    position: p.position || tp.positions?.primary_position || null,
    grade: p.grade,
    jersey_number: tp.jersey_number || p.jersey_number,
    skills: tp.skills,
    evalCount: tp.evalCount,
  }
})
```

**Step 4:** After the fix, verify that:
- Clicking "Start Evaluation" with "All roster" shows the first player
- Player name, photo, jersey #, and position display correctly
- "Save & Next" advances to the next player
- The save function uses `currentPlayer.id` (which is the player_id) correctly for the Supabase insert

---

## BUG 2: Season Setup wizard doesn't persist progress

### Symptoms
- Coach starts Season Setup, gets to the Evaluation step (step 5)
- Navigates away from the Roster Manager page
- Returns to Roster Manager → Season Setup is back at step 1

### Root Cause

The wizard step is stored in React component state only. When the component unmounts (navigate away), state is lost.

### Fix

**Step 1:** Find the wizard step state variable. It's likely:

```js
const [setupStep, setSetupStep] = useState(1)
```

Change it to persist to localStorage with a key scoped to the team and season:

```js
// Generate a storage key scoped to this team + season
const setupStorageKey = selectedTeam?.id && selectedSeason?.id
  ? `lynx_setup_${selectedTeam.id}_${selectedSeason.id}`
  : null

// Initialize from localStorage
const [setupStep, setSetupStep] = useState(() => {
  if (!setupStorageKey) return 1
  try {
    const saved = localStorage.getItem(setupStorageKey)
    return saved ? parseInt(saved, 10) : 1
  } catch { return 1 }
})

// Persist step changes to localStorage
useEffect(() => {
  if (setupStorageKey && setupStep > 0) {
    try { localStorage.setItem(setupStorageKey, String(setupStep)) }
    catch {}
  }
}, [setupStep, setupStorageKey])
```

**Step 2:** Also persist any per-step data that the coach has already confirmed. At minimum:
- Step 1 (Review Roster): confirmed players — persist as JSON array of confirmed player IDs
- Step 2 (Positions): assignments made — these save to DB directly, so no need to persist locally
- Step 3 (Jerseys): same, saves to DB
- Step 4 (Waivers): same, saves to DB
- Step 5 (Evaluation): this launches eval mode which has its own state

So really only the step number needs persistence. Steps 2-4 write to the database directly, so the data is already persisted. Step 1 confirmations are cosmetic (green checkmarks).

For Step 1 confirmations, persist as well:

```js
const confirmStorageKey = setupStorageKey ? `${setupStorageKey}_confirmed` : null

const [confirmedPlayers, setConfirmedPlayers] = useState(() => {
  if (!confirmStorageKey) return new Set()
  try {
    const saved = localStorage.getItem(confirmStorageKey)
    return saved ? new Set(JSON.parse(saved)) : new Set()
  } catch { return new Set() }
})

useEffect(() => {
  if (confirmStorageKey) {
    try { localStorage.setItem(confirmStorageKey, JSON.stringify([...confirmedPlayers])) }
    catch {}
  }
}, [confirmedPlayers, confirmStorageKey])
```

**Step 3:** When the wizard reaches the final "Confirmation" step (step 6), clean up localStorage:

```js
function completeSetup() {
  // Clear wizard progress — it's done
  if (setupStorageKey) {
    try {
      localStorage.removeItem(setupStorageKey)
      localStorage.removeItem(`${setupStorageKey}_confirmed`)
    } catch {}
  }
  setViewMode('overview')
  showToast?.('Roster setup complete!', 'success')
}
```

**Step 4:** Handle the edge case where the coach switches teams. The `setupStorageKey` changes, and the step should reset or load the new team's progress:

```js
useEffect(() => {
  if (setupStorageKey) {
    try {
      const saved = localStorage.getItem(setupStorageKey)
      setSetupStep(saved ? parseInt(saved, 10) : 1)
      const savedConfirmed = localStorage.getItem(`${setupStorageKey}_confirmed`)
      setConfirmedPlayers(savedConfirmed ? new Set(JSON.parse(savedConfirmed)) : new Set())
    } catch {
      setSetupStep(1)
      setConfirmedPlayers(new Set())
    }
  }
}, [setupStorageKey])
```

---

## VERIFICATION

After both fixes:

1. **Evaluation flow:**
   - [ ] Navigate to Roster Manager → Evaluate tab
   - [ ] "All roster (12)" is visible
   - [ ] Click "Start Evaluation →"
   - [ ] First player appears with photo, name, jersey #, position
   - [ ] Rating circles (1-5) are clickable for each skill
   - [ ] "Save & Next →" advances to player 2
   - [ ] After all players: evaluation completes, data saved to DB

2. **Season Setup persistence:**
   - [ ] Start Season Setup → advance to step 3 (Jerseys)
   - [ ] Navigate to Dashboard (or any other page)
   - [ ] Navigate back to Roster Manager → click Season Setup
   - [ ] Wizard resumes at step 3, not step 1
   - [ ] Completing the wizard clears the saved state
   - [ ] Starting setup for a different team starts fresh at step 1

```bash
git add -A && git commit -m "Fix: Evaluation player loading + Season Setup persistence" && git push
```

## DO NOT

- **DO NOT** change loadTeams or loadRoster — those were just fixed and are working
- **DO NOT** change the Overview tab — it's working correctly
- **DO NOT** change any other page or component
- **DO NOT** restructure the roster data model — just flatten the data when passing to evaluation
