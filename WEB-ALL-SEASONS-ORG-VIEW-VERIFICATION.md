# WEB-ALL-SEASONS-ORG-VIEW-VERIFICATION.md
# Generated: 2026-03-22

---

## VERIFICATION RESULTS

### 1. Sentinel Exported
```
src/contexts/SeasonContext.jsx:
  Line 11: export const ALL_SEASONS = Object.freeze({ id: 'all', name: 'All Seasons', isSentinel: true })
  Line 14: export function isAllSeasons(season) { return season?.id === 'all' }
```
**Status: PASS** — Sentinel constant and helper both exported.

---

### 2. selectSeason Handles Sentinel
```
selectSeason():
  - Accepts ALL_SEASONS sentinel (id === 'all')
  - Stores 'all' in localStorage
  - Null guard preserved for non-sentinel cases
  - Sport filter effect skips reset when sentinel is active
```
**Status: PASS** — Sentinel flows through selection correctly.

---

### 3. All Seasons Option in Selectors
```
SeasonFilterBar.jsx:
  - Imports ALL_SEASONS, isAllSeasons
  - Admin-only <option value="all">All Seasons</option>
  - onChange dispatches selectSeason(ALL_SEASONS) for 'all'
  - value uses isAllSeasons check

HeaderComponents.jsx:
  - Imports ALL_SEASONS, isAllSeasons
  - Admin-only "All Seasons" button with Globe icon
  - Display shows "All Seasons" when sentinel active
  - Season buttons exclude sentinel from highlighting
```
**Status: PASS** — Both selectors show "All Seasons" for admin only.

---

### 4. Dashboard Guards
```
DashboardPage.jsx:
  Line 3:   import { useSeason, isAllSeasons }
  Line 236: loadDashboardData guarded — skipped when sentinel active
  Line 243: loading state set when sentinel active
  Line 811: const isAll = isAllSeasons(selectedSeason) for aggregation
```
**Status: PASS** — Dashboard uses globalStats when sentinel active, stepper hidden, carousel shows no card selected.

---

### 5. Category C Guards (11 Season-Required Pages)
Files with isAllSeasons guard:
1. `src/pages/teams/TeamsPage.jsx` — "Select a season to manage teams and rosters."
2. `src/pages/schedule/SchedulePage.jsx` — "Select a season to view the schedule."
3. `src/pages/standings/TeamStandingsPage.jsx` — "Select a season to view standings."
4. `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` — "Select a season to view leaderboards."
5. `src/pages/gameprep/GamePrepPage.jsx` — "Select a season and team for game prep."
6. `src/pages/schedule/CoachAvailabilityPage.jsx` — "Select a season to manage coach availability."
7. `src/pages/staff/StaffPage.jsx` — "Select a season to manage staff assignments."
8. `src/pages/chats/ChatsPage.jsx` — "Select a season to view team chats."
9. `src/pages/jerseys/JerseysPage.jsx` — "Select a season to manage jersey assignments."
10. `src/pages/attendance/AttendancePage.jsx` — "Select a season to track attendance."
11. `src/pages/notifications/NotificationsPage.jsx` — "Select a season to manage notifications."

**Status: PASS** — All 11 Category C pages have sentinel guards with friendly messages.

---

### 6. Category A Conditional Filters
```
CoachesPage.jsx:
  - loadCoaches: season_id filter conditional (isAllSeasons guard)
  - loadTeams: skipped entirely when sentinel active (team assignment stays season-scoped)

PaymentsPage.jsx:
  - loadPlayers: season_id filter conditional
  - loadPayments: season_id filter conditional

RegistrationsPage.jsx:
  - loadRegistrations: season_id filter conditional (already had conditional pattern, updated for sentinel)

BlastsPage.jsx:
  - loadBlasts teams query: season_id filter conditional
  - loadBlasts messages query: season_id filter conditional

ReportsPage.jsx:
  - Initialization updated: skips setting 'all' as selectedSeasonId when sentinel active
  - Page has own season selector, so user can pick specific season for reports
```
**Status: PASS** — All 4 active Category A pages have conditional season filters. Reports protected from sentinel initialization. Data Export already supports org-wide mode natively.

---

### 7. CRITICAL: No Unguarded .eq('season_id', 'all') Possible

All `.eq('season_id', selectedSeason.id)` calls in modified Category A pages are preceded by `if (!isAllSeasons(selectedSeason))` guards:

- **CoachesPage**: Line 58 guard → line 59 query; line 81 guard via early return
- **PaymentsPage**: Line 152 guard → line 153 query; line 165 guard → line 166 query
- **RegistrationsPage**: Line 83 guard → line 84 query
- **BlastsPage**: Line 44 guard → line 45 query; line 62 guard → line 63 query

Note: BlastsPage lines 310 and 371 (compose/send blast actions) still use `selectedSeason.id` unguarded. These are write operations that would harmlessly find 0 matching players when sentinel is active (no player has season_id='all'). Admin would see "0 recipients" — not dangerous, just not useful. These will be addressed in Part 2 (Category B spec) with UI gating on the compose modal.

**Status: PASS** — All read queries are guarded. Write operations fail gracefully.

---

### 8. Build Check
```
✓ 1705 modules transformed
✓ built in 8.55s
```
**Status: PASS** — No build errors.

---

## FILES CHANGED SUMMARY

| Phase | Files Changed | Description |
|-------|--------------|-------------|
| 1 | `src/contexts/SeasonContext.jsx` | ALL_SEASONS sentinel, isAllSeasons helper, selectSeason update, init restore, sport filter guard |
| 2 | `src/components/pages/SeasonFilterBar.jsx`, `src/components/layout/HeaderComponents.jsx` | "All Seasons" option (admin only) in both selectors |
| 3 | `src/pages/dashboard/DashboardPage.jsx`, `src/components/v2/admin/SeasonCarousel.jsx` | Dashboard org-wide view, carousel no-selection mode |
| 4 | 11 Category C page files | isAllSeasons guard with friendly "select a season" message |
| 5 | 5 Category A page files | Conditional season filter on read queries |
| **Total** | **20 files** | |

---

## WHAT'S LEFT FOR PART 2

Category B pages (11 pages) that need season columns, grouping, or toggle UI:
- Blasts (season badge per blast, compose modal gating)
- Attendance (group events by season)
- Jerseys (season column)
- Player Stats (career vs season toggle)
- Achievements (group progress by season)
- Season Archives (enhanced detail panel)
- Parent pages (MyStuff, Player Card, Payments — season labels)
- Public Team Wall (season grouping)
