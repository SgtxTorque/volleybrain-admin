# CC-WEB-ALL-SEASONS-ORG-VIEW-EXECUTE.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main
# Reference: WEB-ALL-SEASONS-ORG-VIEW-REPORT.md

---

## CRITICAL RULES

- **Pre-read `CC-LYNX-RULES.md` and `AGENTS.md`** before starting if they exist in this repo.
- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

This spec implements the "All Seasons" org-wide view for admins on the web admin. The product principle: **Season is a FILTER, not a GATE. Admin sees the whole org by default.**

This is Part 1 of 2. This spec covers:
- Phase 1: SeasonContext sentinel value
- Phase 2: UI selectors (FilterBar + Header)
- Phase 3: Dashboard "All Seasons" mode
- Phase 4: Category C pages (season-required guards)
- Phase 5: Category A pages (drop season filter when sentinel active)
- Phase 6: Final verification

Part 2 (separate spec) will handle Category B pages that need season columns, grouping, and enhanced UI.

---

## PHASE 1 — SeasonContext Sentinel

**Goal:** Introduce an `ALL_SEASONS` sentinel object so "All Seasons" is a first-class state, distinct from null.

### File: `src/contexts/SeasonContext.jsx`

**Change 1: Add sentinel constant and helper (near top of file, after imports).**

Add these exports before the context creation:
```js
/** Sentinel object representing "All Seasons" org-wide view. Admin only. */
export const ALL_SEASONS = Object.freeze({ id: 'all', name: 'All Seasons', isSentinel: true })

/** Check if a season value is the "All Seasons" sentinel */
export function isAllSeasons(season) {
  return season?.id === 'all'
}
```

**Change 2: Update `selectSeason` function.**

Find the current `selectSeason` function (should have the null guard we added in the previous spec). Replace it with:

```js
function selectSeason(season) {
  // Accept the "All Seasons" sentinel
  if (season?.id === 'all') {
    setSelectedSeason(ALL_SEASONS)
    localStorage.setItem('vb_selected_season', 'all')
    return
  }
  // Guard: if null is passed but seasons exist, keep current selection
  if (!season && seasons.length > 0) {
    console.warn('[SeasonContext] Attempted to set season to null while seasons exist. Ignoring.')
    return
  }
  setSelectedSeason(season)
  if (season?.id) {
    localStorage.setItem('vb_selected_season', season.id)
  }
}
```

**Change 3: Update initialization to restore sentinel from localStorage.**

Find the initialization logic that checks `localStorage.getItem('vb_selected_season')` (around lines 50-54). It currently tries to find a matching season by ID and falls back to the first active season. Update the logic so that:

1. Read `storedId` from `localStorage.getItem('vb_selected_season')`
2. **NEW:** If `storedId === 'all'`, set `selectedSeason = ALL_SEASONS` and return (skip the find step)
3. Otherwise, proceed with existing logic: `seasons.find(s => s.id === storedId)` etc.

**Change 4: Protect sport filter effect from resetting sentinel.**

Find the effect that runs when the sport filter changes (around lines 27-36). This effect likely resets `selectedSeason` when seasons are re-filtered. Add a guard at the top:

```js
// Don't reset if user is in "All Seasons" mode
if (isAllSeasons(selectedSeason)) return
```

### Files to change:
1. `src/contexts/SeasonContext.jsx`

### Verification:
```bash
# Confirm sentinel exported
grep -n "ALL_SEASONS\|isAllSeasons" src/contexts/SeasonContext.jsx

# Confirm selectSeason handles sentinel
grep -A 15 "function selectSeason" src/contexts/SeasonContext.jsx

# Confirm localStorage restore handles 'all'
grep -B 2 -A 5 "vb_selected_season" src/contexts/SeasonContext.jsx
```

### Commit message:
```
feat: add ALL_SEASONS sentinel to SeasonContext

- Exported ALL_SEASONS constant and isAllSeasons() helper
- selectSeason() now accepts sentinel, stores 'all' in localStorage
- Initialization restores sentinel from localStorage on page load
- Sport filter effect skips reset when sentinel is active
```

---

## PHASE 2 — UI Selectors

**Goal:** Add "All Seasons" option back to SeasonFilterBar (admin only) and to HeaderSeasonSelector (admin only).

### File 1: `src/components/pages/SeasonFilterBar.jsx`

**Change 1: Import sentinel and role context.**

At the top of the file, add:
```js
import { ALL_SEASONS, isAllSeasons } from '../../contexts/SeasonContext'
```

Also ensure the component has access to the user's role. Check if it already receives `role` as a prop or imports from AuthContext. If not, add:
```js
import { useAuth } from '../../contexts/AuthContext'
```
And inside the component:
```js
const { profile } = useAuth()
const role = profile?.role
```

(Adapt variable names to match whatever AuthContext exports — check the existing imports in this file first.)

**Change 2: Add "All Seasons" option (admin only).**

In the season `<select>` element, add the "All Seasons" option as the first item, gated to admin:

```jsx
<select value={isAllSeasons(selectedSeason) ? 'all' : (selectedSeason?.id || '')} onChange={handleSeasonChange}>
  {role === 'admin' && <option value="all">All Seasons</option>}
  {seasons.map(s => (
    <option key={s.id} value={s.id}>{s.name}</option>
  ))}
</select>
```

**Change 3: Update onChange handler.**

Find the `onChange` handler for the season select. Update it to handle the "all" value:

```js
function handleSeasonChange(e) {
  const value = e.target.value
  if (value === 'all') {
    selectSeason(ALL_SEASONS)
    return
  }
  const season = allSeasons.find(s => s.id === value)
  selectSeason(season || null)
}
```

(Use `allSeasons` not `seasons` in the find, since `seasons` might be sport-filtered. Check which array the component currently uses and match it.)

### File 2: `src/components/layout/HeaderComponents.jsx`

**Change 1: Import sentinel.**
```js
import { ALL_SEASONS, isAllSeasons } from '../../contexts/SeasonContext'
```

**Change 2: Add "All Seasons" to header dropdown (admin only).**

Find the HeaderSeasonSelector component (around lines 79-135). It likely renders a list of seasons as buttons or options. Add an "All Seasons" option at the top, gated to admin role.

Check how the component gets the role — if it's passed as a prop, use it. If not, import from AuthContext same as above.

When "All Seasons" is selected in the header:
- The display text should show "All Seasons"
- Clicking it calls `selectSeason(ALL_SEASONS)`

When displaying the current selection, check for the sentinel:
```jsx
{isAllSeasons(selectedSeason) ? 'All Seasons' : selectedSeason?.name}
```

### Files to change:
1. `src/components/pages/SeasonFilterBar.jsx`
2. `src/components/layout/HeaderComponents.jsx`

### Verification:
```bash
# Confirm "All Seasons" option exists in both components
grep -n "All Seasons\|ALL_SEASONS" src/components/pages/SeasonFilterBar.jsx
grep -n "All Seasons\|ALL_SEASONS" src/components/layout/HeaderComponents.jsx

# Confirm admin-only gating
grep -n "role.*admin\|admin.*role" src/components/pages/SeasonFilterBar.jsx
grep -n "role.*admin\|admin.*role" src/components/layout/HeaderComponents.jsx

# Confirm isAllSeasons import
grep -n "isAllSeasons" src/components/pages/SeasonFilterBar.jsx
grep -n "isAllSeasons" src/components/layout/HeaderComponents.jsx
```

### Commit message:
```
feat: add "All Seasons" option to season selectors (admin only)

- SeasonFilterBar shows "All Seasons" as first option for admin role
- HeaderSeasonSelector shows "All Seasons" for admin role
- Both use ALL_SEASONS sentinel instead of null
- Non-admin roles (coach, parent, player, TM) do not see the option
```

---

## PHASE 3 — Dashboard "All Seasons" Mode

**Goal:** When admin has "All Seasons" active, the dashboard shows org-wide aggregated data using existing globalStats, hides the season stepper, and shows no card selected in the carousel.

### File 1: `src/pages/dashboard/DashboardPage.jsx`

**Change 1: Import sentinel helper.**
```js
import { isAllSeasons } from '../../contexts/SeasonContext'
```

**Change 2: Skip `loadDashboardData()` when sentinel is active.**

Find where `loadDashboardData()` is called (likely in a useEffect that depends on `selectedSeason`). Add a guard:

```js
// In the useEffect that calls loadDashboardData:
if (isAllSeasons(selectedSeason)) {
  // Don't load per-season data — dashboard will use globalStats instead
  return
}
// ... existing loadDashboardData() call
```

**Change 3: Dashboard body — use globalStats when sentinel is active.**

Find the section that renders the dashboard content (after the GettingStartedGuide check, around line 782+). The dashboard currently shows per-season data in tabs. When the sentinel is active, the dashboard should:

1. **Season Carousel:** Still render, but no card highlighted. Find where `selectedSeasonId` is passed to SeasonCarousel. When `isAllSeasons(selectedSeason)`, pass `selectedSeasonId={null}` or `selectedSeasonId="all"` (depending on how the carousel handles highlighting — check Phase 4 of the investigation report).

2. **Season Journey/Stepper:** Hide entirely. Find the Season Journey component render. Wrap it with:
   ```jsx
   {!isAllSeasons(selectedSeason) && (
     <SeasonJourney ... />
   )}
   ```

3. **Dashboard tabs (Action Items, Teams & Health, Registrations, Payments, Schedule):** When sentinel is active, the tabs should display aggregated org-wide data. The investigation report says `globalStats` already contains cross-season aggregates. For each tab:
   - **Action Items:** Use summed `perSeasonActionCounts` across all seasons instead of per-season count.
   - **Teams & Health:** Show total team count from globalStats.
   - **Registrations:** Show total pending/approved from globalStats.
   - **Payments:** Show total collected/outstanding from globalStats.
   - **Schedule:** Show next upcoming events across all seasons (or hide if not available in globalStats).

   To implement this, find where each tab's data is sourced. Add conditional checks:
   ```js
   const isAll = isAllSeasons(selectedSeason)
   
   // Example for action items count:
   const actionItemsCount = isAll
     ? Object.values(perSeasonActionCounts).reduce((sum, n) => sum + n, 0)
     : (perSeasonActionCounts[selectedSeason?.id] || 0)
   ```

   Apply this pattern to every metric that currently reads from per-season data. Use globalStats values where they exist. If globalStats doesn't have a specific metric, use the summed `perSeasonActionCounts` or similar existing cross-season data.

**Change 4: Prevent GettingStartedGuide from showing for sentinel.**

The investigation report says this should already work since the sentinel is truthy (`!selectedSeason` is false when selectedSeason is the sentinel object). But verify the condition at line 782 and confirm the sentinel won't accidentally trigger the welcome screen.

If the condition is `!selectedSeason`, it's fine — sentinel is truthy.
If the condition checks `selectedSeason?.id`, verify that `'all'` is treated as truthy (it is, since it's a non-empty string).

### File 2: `src/components/v2/admin/SeasonCarousel.jsx`

**Change 1: Import sentinel helper.**
```js
import { isAllSeasons } from '../../contexts/SeasonContext'
```

**Change 2: No card highlighted when sentinel is active.**

Find where the carousel determines which card is selected (likely comparing `season.id === selectedSeasonId`). When the parent passes the sentinel state, no card should match. There are two ways to handle this:

**Option A:** The parent (DashboardPage) passes `selectedSeasonId={null}` when sentinel is active. The carousel's existing comparison `season.id === null` won't match any card. This is the simplest.

**Option B:** Pass `selectedSeasonId="all"` and let the carousel explicitly skip highlighting: `const isSelected = selectedSeasonId !== 'all' && season.id === selectedSeasonId`

Use whichever approach is cleaner given the carousel's existing code.

**Change 3 (optional): Add "Viewing: All Seasons" indicator.**

If the carousel has a header or title area (like "Active Seasons"), consider adding a small indicator when in org-wide mode:
```jsx
{isAllSeasons(selectedSeason) && (
  <span style={{ fontSize: 12, color: 'var(--v2-sky)', fontWeight: 600, marginLeft: 8 }}>
    Viewing all seasons
  </span>
)}
```

This is a nice-to-have, not required. Use judgment.

### Files to change:
1. `src/pages/dashboard/DashboardPage.jsx`
2. `src/components/v2/admin/SeasonCarousel.jsx`

### Verification:
```bash
# Confirm isAllSeasons imported and used in dashboard
grep -n "isAllSeasons" src/pages/dashboard/DashboardPage.jsx

# Confirm loadDashboardData is guarded
grep -B 3 -A 3 "loadDashboardData" src/pages/dashboard/DashboardPage.jsx | head -30

# Confirm season stepper is hidden for sentinel
grep -B 2 -A 2 "SeasonJourney\|season.*journey\|season.*stepper" src/pages/dashboard/DashboardPage.jsx

# Confirm carousel handles sentinel
grep -n "isAllSeasons\|ALL_SEASONS" src/components/v2/admin/SeasonCarousel.jsx
```

### Commit message:
```
feat: dashboard "All Seasons" org-wide view

- Dashboard uses globalStats when "All Seasons" is active
- Per-season data loading skipped (loadDashboardData guarded)
- Season Journey/stepper hidden in org-wide mode
- Carousel shows no card selected when viewing all seasons
- Action items, teams, registrations, payments tabs show aggregated data
```

---

## PHASE 4 — Category C Pages (Season-Required Guards)

**Goal:** 13 pages that are inherently season-scoped need a friendly message when "All Seasons" is active, instead of breaking or showing empty data.

### Pattern for ALL Category C pages:

Import the helper at the top of each file:
```js
import { isAllSeasons } from '../../contexts/SeasonContext'
// OR adjust path depth as needed:
import { isAllSeasons } from '../../../contexts/SeasonContext'
```

Then, near the top of the component's render (after hooks, before main content), add:
```jsx
if (isAllSeasons(selectedSeason)) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      textAlign: 'center',
      color: 'var(--v2-text-secondary, #64748B)',
    }}>
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
        {/* Use the specific message for each page — see table below */}
      </p>
      <p style={{ fontSize: 13, color: 'var(--v2-text-tertiary, #94A3B8)' }}>
        Use the season selector in the header to choose a specific season.
      </p>
    </div>
  )
}
```

### Page-Specific Messages

Apply the pattern above to each of these files. Use the exact message listed.

| # | Page | File | Message (first `<p>`) |
|---|------|------|-----------------------|
| 1 | Teams | `src/pages/teams/TeamsPage.jsx` | Select a season to manage teams and rosters. |
| 2 | Schedule | `src/pages/schedule/SchedulePage.jsx` | Select a season to view the schedule. |
| 3 | Standings | `src/pages/standings/TeamStandingsPage.jsx` | Select a season to view standings. |
| 4 | Leaderboards | `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | Select a season to view leaderboards. |
| 5 | Game Prep | `src/pages/gameprep/GamePrepPage.jsx` | Select a season and team for game prep. |
| 6 | Coach Availability | `src/pages/schedule/CoachAvailabilityPage.jsx` | Select a season to manage coach availability. |
| 7 | Staff | `src/pages/staff/StaffPage.jsx` | Select a season to manage staff assignments. |
| 8 | Chats | `src/pages/chats/ChatsPage.jsx` | Select a season to view team chats. |
| 9 | Jerseys | `src/pages/jerseys/JerseysPage.jsx` | Select a season to manage jersey assignments. |
| 10 | Attendance | `src/pages/attendance/AttendancePage.jsx` | Select a season to track attendance. |
| 11 | Notifications | `src/pages/notifications/NotificationsPage.jsx` | Select a season to manage notifications. |

**Note:** Coach Dashboard and Player Dashboard (also Category C) don't need this guard because non-admin roles won't see "All Seasons" in the selector. But if you want extra safety, add the guard there too — it won't hurt.

**Also note:** Some of these pages may already have a `!selectedSeason` guard that shows a similar message. In that case, update the existing guard to also check for sentinel:

Change:
```js
if (!selectedSeason) { ... }
```
To:
```js
if (!selectedSeason || isAllSeasons(selectedSeason)) { ... }
```

And update the message text to match the table above (removing any "from the sidebar" language if it still exists).

### Files to change:
1. `src/pages/teams/TeamsPage.jsx`
2. `src/pages/schedule/SchedulePage.jsx`
3. `src/pages/standings/TeamStandingsPage.jsx`
4. `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`
5. `src/pages/gameprep/GamePrepPage.jsx`
6. `src/pages/schedule/CoachAvailabilityPage.jsx`
7. `src/pages/staff/StaffPage.jsx`
8. `src/pages/chats/ChatsPage.jsx`
9. `src/pages/jerseys/JerseysPage.jsx`
10. `src/pages/attendance/AttendancePage.jsx`
11. `src/pages/notifications/NotificationsPage.jsx`

### Verification:
```bash
# Confirm isAllSeasons guard exists in all Category C pages
for file in teams/TeamsPage schedule/SchedulePage standings/TeamStandingsPage leaderboards/SeasonLeaderboardsPage gameprep/GamePrepPage schedule/CoachAvailabilityPage staff/StaffPage chats/ChatsPage jerseys/JerseysPage attendance/AttendancePage notifications/NotificationsPage; do
  echo "=== $file ==="
  grep -n "isAllSeasons" "src/pages/$file.jsx" || echo "MISSING"
done
```

### Commit message:
```
feat: add "All Seasons" guard to 11 season-required pages

- Teams, Schedule, Standings, Leaderboards, Game Prep, Coach
  Availability, Staff, Chats, Jerseys, Attendance, and Notifications
  now show friendly "select a season" message when org-wide view is
  active instead of breaking or showing empty states
```

---

## PHASE 5 — Category A Pages (Unfiltered Queries)

**Goal:** 6 active pages should show data across all seasons when the sentinel is active.

### Pattern for Category A pages:

Import the helper:
```js
import { isAllSeasons } from '../../contexts/SeasonContext'
```

Then, in each data-fetching query that filters by `season_id`, make the filter conditional:

```js
let query = supabase.from('table_name').select('*')

// Only filter by season when a specific season is selected
if (selectedSeason && !isAllSeasons(selectedSeason)) {
  query = query.eq('season_id', selectedSeason.id)
}
```

This pattern drops the season filter entirely when the sentinel is active, returning all rows across all seasons.

### Page-Specific Instructions

**Page 1: Coaches** (`src/pages/coaches/CoachesPage.jsx`)
- Find the coaches query (around line 57-60): `.eq('season_id', selectedSeason.id)`
- Make the `.eq` conditional using the pattern above
- The team assignment dropdown (line 79) should remain season-scoped — don't change that query. When "All Seasons" is active, the assignment dropdown can be hidden or disabled since you can't assign a coach to a team without knowing which season.
- **Remove** any existing `if (!selectedSeason)` early return / empty state guard that would block rendering when sentinel is active. The sentinel is truthy, so `if (!selectedSeason)` should pass, but check for `if (!selectedSeason?.id)` patterns which would fail on the sentinel since `'all'` is a truthy string. If you find `if (!selectedSeason?.id)`, update to: `if (!selectedSeason || isAllSeasons(selectedSeason))` for guards that should block, or just `if (!selectedSeason)` for guards that should allow the sentinel through.

**Page 2: Payments** (`src/pages/payments/PaymentsPage.jsx`)
- Find the payments/players query (around line 31-42): `.eq('season_id', seasonId)`
- Make the `.eq` conditional
- Remove/update any `!selectedSeason` guard that blocks rendering

**Page 3: Registrations** (`src/pages/registrations/RegistrationsPage.jsx`)
- Find the players/registrations query (around line 79-84): `.eq('season_id', selectedSeason.id)`
- Make the `.eq` conditional
- Remove/update any blocking guard

**Page 4: Blasts** (`src/pages/blasts/BlastsPage.jsx`)
- Find the teams/messages query (around line 43-59): `.eq('season_id', selectedSeason.id)`
- Make the `.eq` conditional
- Remove/update any blocking guard

**Page 5: Reports** (`src/pages/reports/ReportsPage.jsx`)
- The investigation says this already loads all seasons (line 96-99). Check if it has any season-scoped queries that should be made conditional. If it already works org-wide, no changes needed. Verify and leave a comment.

**Page 6: Data Export** (`src/pages/settings/DataExportPage.jsx`)
- Check if it has a season filter. If so, make it conditional. If it already exports all data, no changes needed.

### Important: Guard against `.eq('season_id', 'all')`

The most dangerous mistake CC could make is letting a query run with `.eq('season_id', 'all')`. This would match zero rows (no season has ID 'all') and show empty data — silently wrong. Every query modification MUST use the conditional pattern (skip the `.eq` entirely), NOT pass the sentinel ID to the query.

**Bad (will break):**
```js
query.eq('season_id', selectedSeason.id)  // passes 'all' as season_id
```

**Good:**
```js
if (!isAllSeasons(selectedSeason)) {
  query = query.eq('season_id', selectedSeason.id)
}
```

### Files to change:
1. `src/pages/coaches/CoachesPage.jsx`
2. `src/pages/payments/PaymentsPage.jsx`
3. `src/pages/registrations/RegistrationsPage.jsx`
4. `src/pages/blasts/BlastsPage.jsx`
5. `src/pages/reports/ReportsPage.jsx` (verify, may not need changes)
6. `src/pages/settings/DataExportPage.jsx` (verify, may not need changes)

### Verification:
```bash
# CRITICAL: Ensure no query passes 'all' as a season_id
grep -rn "season_id.*selectedSeason" src/pages/coaches/CoachesPage.jsx src/pages/payments/PaymentsPage.jsx src/pages/registrations/RegistrationsPage.jsx src/pages/blasts/BlastsPage.jsx

# Confirm isAllSeasons is used as a guard before each season-filtered query
for file in coaches/CoachesPage payments/PaymentsPage registrations/RegistrationsPage blasts/BlastsPage; do
  echo "=== $file ==="
  grep -n "isAllSeasons" "src/pages/$file.jsx" || echo "MISSING"
done

# Look for any remaining unguarded .eq('season_id', selectedSeason.id) in modified files
grep -n "\.eq.*season_id.*selectedSeason\.id" src/pages/coaches/CoachesPage.jsx src/pages/payments/PaymentsPage.jsx src/pages/registrations/RegistrationsPage.jsx src/pages/blasts/BlastsPage.jsx
# If this returns results, those queries need the conditional guard
```

### Commit message:
```
feat: enable org-wide data view for Coaches, Payments, Registrations, Blasts

- Season filter is conditionally applied — dropped when "All Seasons"
  is active, allowing cross-season data to load
- Guards updated so sentinel state passes through to page rendering
- Reports and Data Export verified (already org-wide or no changes needed)
```

---

## PHASE 6 — Final Verification

Run these checks after all phases are committed:

```bash
echo "=== 1. Sentinel exported ==="
grep -n "ALL_SEASONS\|isAllSeasons" src/contexts/SeasonContext.jsx

echo ""
echo "=== 2. selectSeason handles sentinel ==="
grep -A 20 "function selectSeason" src/contexts/SeasonContext.jsx

echo ""
echo "=== 3. All Seasons option in selectors ==="
grep -n "All Seasons\|ALL_SEASONS" src/components/pages/SeasonFilterBar.jsx src/components/layout/HeaderComponents.jsx

echo ""
echo "=== 4. Dashboard guards ==="
grep -n "isAllSeasons" src/pages/dashboard/DashboardPage.jsx

echo ""
echo "=== 5. Category C guards (should be 11 files) ==="
grep -rln "isAllSeasons" src/pages/teams/ src/pages/schedule/ src/pages/standings/ src/pages/leaderboards/ src/pages/gameprep/ src/pages/staff/ src/pages/chats/ src/pages/jerseys/ src/pages/attendance/ src/pages/notifications/ 2>/dev/null | wc -l

echo ""
echo "=== 6. Category A conditional filters ==="
grep -rn "isAllSeasons" src/pages/coaches/CoachesPage.jsx src/pages/payments/PaymentsPage.jsx src/pages/registrations/RegistrationsPage.jsx src/pages/blasts/BlastsPage.jsx

echo ""
echo "=== 7. CRITICAL: No unguarded .eq('season_id', 'all') possible ==="
# This checks that isAllSeasons guard appears BEFORE any season_id filter in modified files
for file in src/pages/coaches/CoachesPage.jsx src/pages/payments/PaymentsPage.jsx src/pages/registrations/RegistrationsPage.jsx src/pages/blasts/BlastsPage.jsx; do
  echo "--- $file ---"
  grep -n "season_id\|isAllSeasons" "$file" | head -10
done

echo ""
echo "=== 8. Build check ==="
npm run build 2>&1 | tail -20
```

Produce `WEB-ALL-SEASONS-ORG-VIEW-VERIFICATION.md` with all output.

### Commit message:
```
docs: add All Seasons org-wide view verification report
```

---

## FILES CHANGED SUMMARY

| Phase | File | Change |
|-------|------|--------|
| 1 | `src/contexts/SeasonContext.jsx` | ALL_SEASONS sentinel, isAllSeasons helper, selectSeason update, init restore, sport filter guard |
| 2 | `src/components/pages/SeasonFilterBar.jsx` | "All Seasons" option (admin only), onChange handler |
| 2 | `src/components/layout/HeaderComponents.jsx` | "All Seasons" option (admin only), display text |
| 3 | `src/pages/dashboard/DashboardPage.jsx` | Skip loadDashboardData for sentinel, use globalStats, hide stepper, aggregate tab data |
| 3 | `src/components/v2/admin/SeasonCarousel.jsx` | No card highlighted for sentinel |
| 4 | 11 Category C page files | isAllSeasons guard with friendly message |
| 5 | 4-6 Category A page files | Conditional season filter on queries |
| **Total** | **~20 files** | |

---

## WHAT'S LEFT FOR PART 2

Category B pages (11 pages) that need season columns, grouping, or toggle UI:
- Blasts (season badge per blast)
- Attendance (group events by season)
- Jerseys (season column)
- Player Stats (career vs season toggle)
- Achievements (group progress by season)
- Season Archives (enhanced detail panel)
- Parent pages (MyStuff, Player Card, Payments — season labels)
- Public Team Wall (season grouping)

These are UI enhancements, not functional blockers. The org-wide view works without them — data just won't have season labels in the Category B pages yet.
