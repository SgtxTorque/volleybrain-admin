# CC-PLAYER-CARD-CRASH-FIX.md
# Emergency Fix — Player Card Page Crash
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

The Player Card page crashes on load with 3 errors. Fix all three. Do NOT do any redesign work — just make the page load again.

---

## GUARDRAILS

- **Read the file before changing anything.** Open `src/pages/parent/ParentPlayerCardPage.jsx` and understand the current state.
- **Do not change layout, styling, or features.** Only fix the three errors below.
- **Wrap all new queries in try/catch** so they fail silently to empty arrays if the query shape is wrong.
- **Write report to:** `CC-PLAYER-CARD-CRASH-FIX-REPORT.md` in the project root.
- **Commit after fixing.**

---

## BUG 1: `overallRating is not defined` (line 642)

**Error:** `ReferenceError: overallRating is not defined at ParentPlayerCardPage.jsx:642:70`

**Likely cause:** A variable was renamed during the redesign. The OVR rating was previously stored as `ovrRating` (or similar) and something in the render references `overallRating` which doesn't exist.

**Fix:** Find line 642. Find where the OVR value is computed (search for the formula: `vals.reduce((a, b) => a + b, 0) / vals.length`). Check what variable name it's stored in. Then find every reference to `overallRating` and `ovrRating` in the file. Make sure they all use the same name. If the computed variable is `ovrRating`, change line 642 to use `ovrRating`. If it's `overallRating`, make sure the computation assigns to `overallRating`.

---

## BUG 2: Shoutouts query 400 error

**Error:** `Failed to load resource: the server responded with a status of 400` on the shoutouts query.

**URL shows:** `shoutouts?select=*,giver:profiles!giver_id(...)`

**Likely cause:** The FK relationship name `profiles!giver_id` is incorrect. Supabase requires the exact FK constraint name for explicit joins.

**Fix:** Wrap the shoutouts query in a try/catch block. If it fails, set shoutouts to an empty array and log a warning. The page should not crash because shoutouts failed to load:

```javascript
try {
  const { data: shoutoutData } = await supabase
    .from('shoutouts')
    .select('*')
    .eq('receiver_id', playerId)
    .order('created_at', { ascending: false })
    .limit(5)
  setShoutouts(shoutoutData || [])
} catch (err) {
  console.warn('Shoutouts query failed:', err.message)
  setShoutouts([])
}
```

Remove the `profiles!giver_id` join for now — just fetch raw shoutout data without the join. The giver name can be resolved later. Getting the page to load is priority.

---

## BUG 3: game_player_stats query 400 error

**Error:** `Failed to load resource: the server responded with a status of 400` on game_player_stats query.

**URL shows:** `game_player_stats?select=*,schedule_events!event_id(...)&order=created_at.desc&limit=10`

**Likely causes:**
- The FK name `schedule_events!event_id` may be incorrect
- The column `created_at` may not exist on `game_player_stats` (the order clause)
- The `limit=10` may have been added to a query that previously didn't have it

**Fix:** Find the game_player_stats query in the file. Compare it to the ORIGINAL query that existed before the redesign (the investigation reported it at line 280). Restore the original query shape if it was changed. If a new query was added, wrap it in try/catch:

```javascript
try {
  const { data: gameStatsData } = await supabase
    .from('game_player_stats')
    .select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
    .eq('player_id', playerId)
  // ... process data
} catch (err) {
  console.warn('Game stats query failed:', err.message)
  // set appropriate empty state
}
```

If the FK join fails, try without the explicit FK name:
```javascript
.select('*, schedule_events(event_date, opponent_name, our_score, their_score)')
```

If `order('created_at')` fails, try `order('event_id')` or remove the order clause entirely.

---

## VERIFICATION

After fixing all three:

1. `npm run build 2>&1 | tail -20` — must compile clean
2. The page must load without crashing
3. Open browser console — no 400 errors, no ReferenceErrors
4. If shoutouts or game stats queries still fail silently, that's OK — the page shows empty states instead of crashing

**Commit:** `fix: resolve PlayerCard crash — overallRating reference + query error handling`
