# CC-FIX-ALL-SEASONS-NO-SPORT-LEAK.md
# CRITICAL FIX: "All Seasons + No Sport" Unfiltered Query Leak

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `WHY-DATA-LEAKS-REPORT.md` (root cause analysis)

## PRIORITY: EMERGENCY. This is a data privacy violation affecting production.

## THE ONE THING THIS SPEC DOES

When "All Seasons" is selected and no sport filter is active, every affected page must filter by `.in('season_id', allSeasons.map(s => s.id))` instead of applying NO filter. The `allSeasons` array is already org-scoped by SeasonContext. This is the SAME pattern already used when a sport IS selected.

## WHAT NOT TO DO
- Do NOT add `.eq('organization_id', ...)` to any query. Most tables don't have that column.
- Do NOT change SeasonContext, AuthContext, or any context provider.
- Do NOT change any select fields, sort order, or query structure.
- Do NOT touch any JSX, layout, or UI code.
- The ONLY change per page is adding the `allSeasons` fallback in the existing if/else chain.

---

## THE FIX PATTERN

Every affected page has a variation of this pattern:

```javascript
// CURRENT (BROKEN):
if (!isAllSeasons(selectedSeason)) {
  query = query.eq('season_id', selectedSeason.id)        // Specific season → safe
} else if (selectedSport?.id) {
  const sportSeasonIds = allSeasons.filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  if (sportSeasonIds.length === 0) { /* return empty */ }
  query = query.in('season_id', sportSeasonIds)            // Sport filter → safe
}
// IMPLICIT ELSE: All Seasons + no sport → NO FILTER → LEAKS ALL DATA
```

```javascript
// FIXED:
if (!isAllSeasons(selectedSeason)) {
  query = query.eq('season_id', selectedSeason.id)        // Specific season → safe
} else if (selectedSport?.id) {
  const sportSeasonIds = allSeasons.filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  if (sportSeasonIds.length === 0) { /* return empty */ }
  query = query.in('season_id', sportSeasonIds)            // Sport filter → safe
} else {
  // ALL SEASONS + NO SPORT → filter by ALL of this org's season IDs
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) {
    // New org with no seasons — return empty, not all data
    setDataToEmpty()  // whatever the page's empty state setter is
    return
  }
  query = query.in('season_id', orgSeasonIds)              // Org-scoped → safe
}
```

That's it. The else clause is the fix. Everything else stays identical.

---

## PHASE 1: Fix All 12 Pages

### How to find every instance:

```bash
grep -rn "isAllSeasons\|!isAllSeasons\|selectedSeason.*all" src/pages/ --include="*.jsx" | grep -v _archive | grep -v "// "
```

For EACH match, read the surrounding if/else chain. If there is NO else clause that handles "All Seasons + no sport" with an `allSeasons` filter, add one.

### Specific files to fix (from the investigation report):

**Verify `allSeasons` is available in each file.** It comes from `useSeason()`:
```javascript
const { selectedSeason, allSeasons, isAllSeasons } = useSeason()
```
If `allSeasons` is not destructured, add it to the existing `useSeason()` call.

### File-by-file:

**1. `src/pages/registrations/RegistrationsPage.jsx`**
Table: `players`
Find the `loadRegistrations` function. Add the else clause with `.in('season_id', orgSeasonIds)`.
Also check if there's a second query (single player lookup) that needs the same fix.

**2. `src/pages/teams/TeamsPage.jsx`**
Tables: `teams`, `players`
Find `loadTeams` and any player queries. Add the else clause.

**3. `src/pages/coaches/CoachesPage.jsx`**
Tables: `coaches`, `teams`
Find `loadCoaches` and `loadTeams`. Add the else clause.

**4. `src/pages/payments/PaymentsPage.jsx`**
Tables: `players`, `payments`
Find `loadPayments` and `loadPlayers`. Add the else clause.

**5. `src/pages/schedule/SchedulePage.jsx`**
Tables: `schedule_events`, `teams`
Find `loadEvents` and `loadTeams`. Add the else clause.

**6. `src/pages/attendance/AttendancePage.jsx`**
Tables: `teams`, `schedule_events`
Find all data loading functions. Add the else clause.

**7. `src/pages/blasts/BlastsPage.jsx`**
Tables: `teams`, `messages`
Find data loading functions. Add the else clause.

**8. `src/pages/jerseys/JerseysPage.jsx`**
Tables: `teams` (3 queries)
Find all team/player queries. Add the else clause.

**9. `src/pages/notifications/NotificationsPage.jsx`**
Tables: `teams`
Find team queries. Add the else clause.

**10. `src/pages/staff-portal/StaffPortalPage.jsx`**
Tables: `coaches`, `teams`
Find data loading functions. Add the else clause.

**11. `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`**
Tables: `teams`
Find team queries. Add the else clause.

**12. `src/pages/schedule/CoachAvailabilityPage.jsx`**
Tables: `coaches`
Find coach queries. Add the else clause.

### ALSO check these files that may have the same pattern:
```bash
# Find any other page that uses isAllSeasons or checks for 'all' season
grep -rln "isAllSeasons\|selectedSeason.*===.*'all'" src/pages/ --include="*.jsx" | grep -v _archive
```

Fix ANY file that has the vulnerable pattern, even if not in the 12 listed above.

---

## PHASE 2: Verify the Fix

### Build:
```bash
npm run build
```
Must pass.

### Critical test (Carlos will do this manually, but CC should describe the test):
1. Log in as Account A (Black Hornets) — "All Seasons" + "All Sports" selected
2. Go to Registrations → should see ONLY Black Hornets registrations
3. Go to Teams → should see ONLY Black Hornets teams
4. Go to Payments → should see ONLY Black Hornets payments
5. Log out
6. Log in as Account B (Real Test Athletics) — "All Seasons" + "All Sports"
7. Go to Registrations → should see ONLY Real Test registrations (or empty if new org)
8. Go to Teams → should see ONLY Real Test teams (or empty)
9. Verify NO data from Black Hornets appears anywhere

### Console check:
- ZERO `season_id=eq.all` errors (the sentinel should never reach Supabase)
- ZERO 400 errors from missing columns
- ZERO unfiltered queries (no query without a season_id or organization_id filter)

### Commit:
```bash
git add [all fixed files]
git commit -m "CRITICAL SECURITY: Add allSeasons fallback filter — closes All Seasons + no sport data leak"
git push origin main
```

---

## REPORT
```
## Data Leak Fix Report
- Files fixed: [count]/12+
- Pattern applied: .in('season_id', allSeasons.map(s => s.id)) in else clause
- Additional files found beyond the 12 listed: [count, list]
- Build: PASS/FAIL
- Any query still missing the else clause: YES (list) / NO
```
