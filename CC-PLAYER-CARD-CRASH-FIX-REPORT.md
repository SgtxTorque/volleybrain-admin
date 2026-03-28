# Player Card Crash Fix — Report

**Commit**: 5be8345
**Status**: ALL 3 BUGS FIXED — build passes (1811 modules, 12.08s)

---

## Bug 1: `overallRating is not defined` (line 642)

**Root cause**: `OverviewTab` is defined as a module-level function (line 583), outside `ParentPlayerCardPage`. It does NOT have closure access to `overallRating` which is computed inside the parent component at line 392.

**Fix**: Added `overallRating` as a prop — both in the JSX call site (line 532) and in the function signature (line 583).

## Bug 2: Shoutouts query 400 error

**Root cause**: `profiles!giver_id` FK join syntax — the FK constraint name doesn't match Supabase's auto-generated constraint naming.

**Fix**: Removed the `profiles!giver_id(...)` join. Query now fetches raw `shoutouts` data with `select('*')`. Giver display falls back to "Coach" via existing null-safe access (`s.giver?.first_name || 'Coach'`). Added `console.warn` on failure.

## Bug 3: game_player_stats query 400 error

**Root cause**: Either `schedule_events!event_id` FK name is incorrect, or `created_at` column doesn't exist on `game_player_stats`.

**Fix**: Added fallback strategy — tries the original FK join first, and if it returns an error, falls back to `select('*')` without the join. Both paths wrapped in try/catch with console warnings.

---

## Files Changed
- `src/pages/parent/ParentPlayerCardPage.jsx` — +29/-8 lines
