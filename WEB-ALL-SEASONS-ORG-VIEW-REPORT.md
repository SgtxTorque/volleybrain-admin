# WEB-ALL-SEASONS-ORG-VIEW-REPORT

**Date:** 2026-03-22
**Branch:** main
**Classification:** Investigation only — no files modified

---

## Phase 1: Season-Filtered Query Catalog

### Summary
- **Total files with season-filtered queries:** ~42
- **Total unique Supabase tables queried with season scope:** ~15
- **Queries that can work unfiltered:** 4
- **Queries that require season scope:** ~38

### Complete Query Catalog

| File | Line(s) | Table Queried | Filter Used | Data Type | Can Work Unfiltered? |
|------|---------|---------------|-------------|-----------|---------------------|
| **CONTEXT** |
| `contexts/SeasonContext.jsx` | 41-44 | `seasons` | `.eq('organization_id', org.id)` | All org seasons | YES — loads all |
| **DASHBOARD** |
| `pages/dashboard/DashboardPage.jsx` | 131-150 | `teams`, `players`, `payments` | `.in('season_id', seasonIds)` | Global stats across all seasons | YES — already aggregates |
| `pages/dashboard/DashboardPage.jsx` | 251-254 | `teams` | `.eq('season_id', seasonId)` | Current season teams | NO — per-season detail |
| `pages/dashboard/DashboardPage.jsx` | 269-272 | `players` | `.eq('season_id', seasonId)` | Current season players | NO — per-season detail |
| `pages/dashboard/DashboardPage.jsx` | 322-325 | `payments` | `.eq('season_id', seasonId)` | Current season payments | NO — per-season detail |
| `pages/dashboard/DashboardPage.jsx` | 362-369 | `schedule_events` | `.eq('season_id', seasonId)` | Upcoming events | NO — per-season detail |
| **PEOPLE MANAGEMENT** |
| `pages/teams/TeamsPage.jsx` | 64-66 | `teams` | `.eq('season_id', selectedSeason.id)` | Season teams with roster | NO — rosters are season-specific |
| `pages/teams/TeamsPage.jsx` | 100-111 | `players`, `team_players` | `.eq('season_id', selectedSeason.id)` | Unrostered + rostered players | NO |
| `pages/coaches/CoachesPage.jsx` | 57-60 | `coaches` | `.eq('season_id', selectedSeason.id)` | Season coaches | YES — org-wide coach view useful |
| `pages/coaches/CoachesPage.jsx` | 79 | `teams` | `.eq('season_id', selectedSeason.id)` | Team assignment dropdown | NO — assignment is per-season |
| `pages/staff/StaffPage.jsx` | 52-69 | `staff_members`, `teams` | `.eq('season_id', selectedSeason.id)` | Staff/volunteers | NO — assignments are per-season |
| **REGISTRATIONS & PAYMENTS** |
| `pages/registrations/RegistrationsPage.jsx` | 79-84 | `players` | `.eq('season_id', selectedSeason.id)` | Registration pipeline | YES — retention analysis useful |
| `pages/payments/PaymentsPage.jsx` | 31-42 | `players`, `payments` | `.eq('season_id', seasonId)` | Payment tracking | YES — financial history useful |
| `lib/fee-calculator.js` | 255-383 | `payments`, `players` | `.eq('season_id', season.id)` | Fee generation logic | NO — must be per-season |
| **SCHEDULE & EVENTS** |
| `pages/schedule/SchedulePage.jsx` | 78-84 | `schedule_events` | `.eq('season_id', selectedSeason.id)` | Calendar events | NO — calendar is per-season |
| `pages/schedule/CoachAvailabilityPage.jsx` | — | `schedule_events` | `.eq('season_id', selectedSeason.id)` | Coach availability | NO — per-season planning |
| `pages/attendance/AttendancePage.jsx` | 45-55 | `teams`, `schedule_events` | `.eq('season_id', selectedSeason.id)` | Attendance tracking | NO — events are per-season |
| **GAME DAY & STATS** |
| `pages/gameprep/GamePrepPage.jsx` | 64-68 | `teams` | `.eq('season_id', selectedSeason.id)` | Game day lineup | NO — inherently per-game/season |
| `pages/standings/TeamStandingsPage.jsx` | 52-78 | `teams`, `team_standings` | `.eq('season_id', selectedSeason.id)` | Win/loss records | NO — standings reset each season |
| `pages/leaderboards/SeasonLeaderboardsPage.jsx` | — | `teams` | `.eq('season_id', selectedSeason.id)` | Stat leaderboards | NO — per-season |
| `pages/stats/PlayerStatsPage.jsx` | — | — | — | Player statistics | NO — per-season stats |
| **COMMUNICATION** |
| `pages/chats/ChatsPage.jsx` | 87-94 | `chat_channels` | `.eq('season_id', selectedSeason.id)` | Team chat channels | NO — channels per-season |
| `pages/blasts/BlastsPage.jsx` | 43-59 | `teams`, `messages` | `.eq('season_id', selectedSeason.id)` | Announcements | YES — history across seasons useful |
| **UNIFORMS** |
| `pages/jerseys/JerseysPage.jsx` | 83-99 | `registrations`, `teams` | `.eq('season_id', selectedSeason.id)` | Jersey assignments | NO — per-season inventory |
| **ARCHIVES** |
| `pages/archives/SeasonArchivePage.jsx` | 160+ | `teams`, `schedule_events`, `payments` | `.eq('season_id', s.id)` | Historical data | YES — explicitly cross-season |
| **NOTIFICATIONS** |
| `pages/notifications/NotificationsPage.jsx` | 77-80 | `teams` | `.eq('season_id', selectedSeason.id)` | Push notification targets | NO — targets per-season teams |
| **ACHIEVEMENTS** |
| `pages/achievements/AchievementsCatalogPage.jsx` | 114 | `player_achievement_progress` | `.eq('season_id', selectedSeason.id)` | Achievement progress | NO — tracked per-season |
| **REPORTS** |
| `pages/reports/ReportsPage.jsx` | 96-99 | `seasons`, `sports` | `.eq('organization_id', org.id)` | Report filters | YES — already loads all |
| `pages/reports/RegistrationFunnelPage.jsx` | — | — | has season selector | Funnel analytics | YES — cross-season analysis |
| **SETTINGS** |
| `pages/settings/DataExportPage.jsx` | — | — | season filter | Bulk export | YES — export all data |
| `pages/settings/WaiversPage.jsx` | — | — | org-scoped | Waiver templates | YES — org-wide |
| **ROLE DASHBOARDS** |
| `pages/roles/CoachDashboard.jsx` | 115+ | `players`, `schedule_events` | `.eq('season_id', selectedSeason.id)` | Coach data | NO — coaches work per-season |
| `pages/roles/ParentDashboard.jsx` | — | registrations | auto-discovers seasons | Parent data | N/A — doesn't use season selector |
| `pages/roles/PlayerDashboard.jsx` | 115-151 | `players` | `.eq('season_id', selectedSeason.id)` | Player stats | NO — per-season |
| **COMPONENTS** |
| `components/parent/PriorityCardsEngine.jsx` | 156 | `schedule_events` | `.eq('season_id', seasonId)` | Parent action items | NO — per-season tasks |
| `hooks/useTeamManagerData.js` | 30-115 | `payments`, `schedule_events`, `players` | `.eq('season_id', selectedSeason.id)` | Team metrics | NO — per-season |

---

## Phase 2: Page Classification

### Category A — Full "All Seasons" Support (16 pages)

These pages should show aggregated/unfiltered data when "All Seasons" is selected.

| Page | File | Reason | Handling |
|------|------|--------|---------|
| Dashboard (hero/global stats) | `pages/dashboard/DashboardPage.jsx` | Hero card already aggregates across all seasons | Already works — global stats ignore selected season |
| Coaches | `pages/coaches/CoachesPage.jsx` | Coaches are org-wide resources; viewing all coaches is useful | Drop season filter; add season column |
| Payments | `pages/payments/PaymentsPage.jsx` | Financial history is best viewed cross-season | Drop season filter; add season column; show totals |
| Registrations | `pages/registrations/RegistrationsPage.jsx` | Retention analysis requires cross-season view | Drop season filter; add season column |
| Reports | `pages/reports/ReportsPage.jsx` | Already has its own season selector; designed for analysis | Add "All" to its existing dropdown |
| Registration Funnel | `pages/reports/RegistrationFunnelPage.jsx` | Cross-season funnel comparison is valuable | Add "All" option |
| Data Export | `pages/settings/DataExportPage.jsx` | Exports should support all data | Add "All Seasons" checkbox |
| Seasons (settings) | `pages/settings/SeasonsPage.jsx` | Already lists all seasons | No change needed |
| Organization (settings) | `pages/settings/OrganizationPage.jsx` | Org-wide settings, not season-scoped | No change needed |
| Payment Setup | `pages/settings/PaymentSetupPage.jsx` | Org-wide payment config | No change needed |
| Waivers | `pages/settings/WaiversPage.jsx` | Templates are org-wide; signatures span seasons | Show all signatures with season label |
| Registration Templates | `pages/settings/RegistrationTemplatesPage.jsx` | Templates are reusable across seasons | No change needed |
| Venue Manager | `pages/settings/VenueManagerPage.jsx` | Venues exist across seasons | No change needed |
| Platform Admin | `pages/platform/PlatformAdminPage.jsx` | Super-admin is cross-org/season | No change needed |
| Org Directory | `pages/public/OrgDirectoryPage.jsx` | Public view, not season-scoped | No change needed |
| My Profile | `pages/profile/MyProfilePage.jsx` | Personal profile is global | No change needed |

### Category B — Works With Clarification (11 pages)

These pages can show unfiltered data but need season labels, grouping, or toggle options.

| Page | File | Reason | Handling Needed |
|------|------|--------|----------------|
| Blasts/Announcements | `pages/blasts/BlastsPage.jsx` | Can show all blast history | Add season column/badge to each blast |
| Attendance | `pages/attendance/AttendancePage.jsx` | All-time attendance useful for analysis | Group events by season; add season label |
| Jerseys | `pages/jerseys/JerseysPage.jsx` | Jersey number history across seasons | Add season column; group by season |
| Notifications | `pages/notifications/NotificationsPage.jsx` | Org-wide but can include season-specific | Add optional season filter |
| Player Stats | `pages/stats/PlayerStatsPage.jsx` | Could show "career stats" aggregated | Add "Career" vs "Season" toggle |
| Achievements | `pages/achievements/AchievementsCatalogPage.jsx` | Catalog is org-wide; progress per-season | Show all badges; group progress by season |
| Season Archives | `pages/archives/SeasonArchivePage.jsx` | Already shows all past seasons | Enhance detail panel |
| MyStuff (parent) | `pages/parent/MyStuffPage.jsx` | Parents want cross-season payment view | Add season column to payments tab |
| Parent Player Card | `pages/parent/ParentPlayerCardPage.jsx` | Can show career view | Add season tabs or "All Time" toggle |
| Parent Payments | `pages/parent/ParentPaymentsPage.jsx` | Parents want full payment picture | Show all with season labels |
| Public Team Wall | `pages/public/TeamWallPage.jsx` | Could show all-time posts | Add season grouping |

### Category C — Inherently Season-Scoped (13 pages)

When "All Seasons" is active, show: "Select a specific season to view [feature]"

| Page | File | Reason | Message |
|------|------|--------|---------|
| Dashboard (detail tabs) | `pages/dashboard/DashboardPage.jsx` | Per-season teams/regs/payments tabs | Hide detail tabs; show global view only |
| Teams | `pages/teams/TeamsPage.jsx` | Rosters change per season; can't manage across | "Select a season to manage teams" |
| Schedule | `pages/schedule/SchedulePage.jsx` | Calendar is per-season | "Select a season to view schedule" |
| Standings | `pages/standings/TeamStandingsPage.jsx` | W-L records reset each season | "Select a season to view standings" |
| Leaderboards | `pages/leaderboards/SeasonLeaderboardsPage.jsx` | Stats are per-season | "Select a season to view leaderboards" |
| Game Prep | `pages/gameprep/GamePrepPage.jsx` | Lineup management is per-game | "Select a season and team for game prep" |
| Coach Availability | `pages/schedule/CoachAvailabilityPage.jsx` | Availability is per-season | "Select a season to manage availability" |
| Season Management | `pages/admin/SeasonManagementPage.jsx` | Setup wizard for one season | "Select a season to continue setup" |
| Team Hub Selector | `pages/teams/TeamHubSelectorPage.jsx` | Team Hub content is per-season | "Select a season to browse team hubs" |
| Staff | `pages/staff/StaffPage.jsx` | Staff assignments are per-season | "Select a season to manage staff" |
| Chats | `pages/chats/ChatsPage.jsx` | Chat channels are per-season team | "Select a season to view team chats" |
| Coach Dashboard | `pages/roles/CoachDashboard.jsx` | Coaches work with one season | Lock to single season |
| Player Dashboard | `pages/roles/PlayerDashboard.jsx` | Players view one season's stats | Lock to single season |

---

## Phase 3: State Layer Audit

### SeasonContext Changes Needed

**File:** `src/contexts/SeasonContext.jsx`

**Current state shape:**
```js
{
  seasons: Season[],        // Sport-filtered list
  allSeasons: Season[],     // All org seasons
  selectedSeason: Season | null,
  selectSeason: (season) => void,
  loading: boolean,
  refreshSeasons: (selectId?) => Promise<void>
}
```

**Recommended sentinel approach:**
```js
// Export sentinel constant
export const ALL_SEASONS = { id: 'all', name: 'All Seasons', isSentinel: true }

// Helper for consumers
export function isAllSeasons(season) { return season?.id === 'all' }
```

**Changes to `selectSeason` (line 71):**
- Current null guard rejects null when seasons exist
- Must accept the sentinel: check `season?.id === 'all'` before null guard
- Store `'all'` in localStorage when sentinel selected

**Changes to initialization (line 50-54):**
- On load, check if `localStorage.getItem('vb_selected_season') === 'all'`
- If so, set `selectedSeason = ALL_SEASONS` sentinel
- Otherwise use existing fallback chain

**Changes to sport filter effect (line 27-36):**
- If `selectedSeason` is sentinel, don't reset on sport change

### SeasonFilterBar Changes Needed

**File:** `src/components/pages/SeasonFilterBar.jsx`

- Add `<option value="all">All Seasons</option>` back at top
- Update onChange: when value is `"all"`, call `selectSeason(ALL_SEASONS)` instead of `selectSeason(null)`
- Gate "All Seasons" option to admin role only (coach shouldn't see it)

### HeaderSeasonSelector Changes Needed

**File:** `src/components/layout/HeaderComponents.jsx` (lines 79-135)

- Add sentinel option at top of dropdown list
- Show "All Seasons" as selected when `selectedSeason?.id === 'all'`
- Gate to admin role (if possible — check if role prop is available)

### SeasonCarousel Changes Needed

**File:** `src/components/v2/admin/SeasonCarousel.jsx`

- When `selectedSeasonId === 'all'`, no individual card is highlighted
- Clicking any card switches to that specific season
- Consider adding a small "Viewing: All Seasons" indicator above or deselecting the "Selected" pill from all cards
- Per-season action count badges remain visible on each card (useful for comparison)

### localStorage Strategy

| Action | localStorage Value |
|--------|-------------------|
| User selects specific season | Store season UUID |
| User selects "All Seasons" | Store `'all'` |
| User logs in | Clear (existing behavior) |
| App loads, finds `'all'` | Restore sentinel object |
| App loads, finds UUID | Restore matching season |
| App loads, finds nothing | Default to active season |

**Recommendation for admin default:** Start with active season (existing behavior). Don't default to "All Seasons" initially — let admins opt in. Consider making it default once they've used it and it's stored in localStorage.

---

## Phase 4: Dashboard in "All Seasons" Mode

### Carousel Behavior
- No card highlighted when "All Seasons" is active
- All cards remain visible with their per-season stats and action count badges
- Clicking a card switches to that season's filtered view
- Section header stays "Active Seasons"

### Season Stepper / Journey Bar
- **Hide entirely** when "All Seasons" is active
- Stepper is inherently single-season (tracks setup progress for one season)
- Show it only when a specific season is selected

### Action Items
- In "All Seasons" mode, the attention strip should show **aggregated** counts across all seasons
- The data is already available in `globalStats.actionCount` (computed at lines 212-219)
- Use `perSeasonActionCounts` (already computed) to aggregate
- Individual action item categories should sum across seasons

### Dashboard Tabs Behavior

| Tab | "All Seasons" Behavior |
|-----|----------------------|
| Teams & Health | Show org-wide team count + aggregate health metrics from `globalStats` |
| Registrations | Show total pending/approved across all seasons |
| Payments | Show total collected/outstanding from `globalStats` |
| Schedule | Show next N events across all seasons |
| Action Items | Sum `perSeasonActionCounts` across all seasons |

**Key insight:** The dashboard's `loadDashboardData()` (line 244) currently queries `.eq('season_id', seasonId)`. When sentinel is active:
- **Option A:** Skip `loadDashboardData()` entirely; use `globalStats` for all displayed data
- **Option B:** Modify to use `.in('season_id', allSeasonIds)` when sentinel active
- **Recommended:** Option A — global stats are already computed separately and cover all seasons

### GettingStartedGuide Condition

**Current (line 782):**
```js
if (!seasonLoading && !selectedSeason) {
  return <GettingStartedGuide onNavigate={onNavigate} />
}
```

**With sentinel:** No change needed. `selectedSeason` will be the sentinel object (truthy), so guide won't show. Guide only shows when `selectedSeason === null`, which only happens if org truly has zero seasons.

**Secondary empty state (line 873):**
```js
{totalTeams === 0 && !selectedSeason && (...)}
```
Same — sentinel is truthy, won't trigger.

---

## Phase 5: Role-Specific Behavior

### Role Compatibility Table

| Role | Sees "All Seasons"? | Default State | Concerns |
|------|---------------------|---------------|----------|
| **Admin** | YES | Active season (opt-in to "All") | Primary user of org-wide view |
| **Coach** | NO | Active season or assigned season | Coaches work one season at a time |
| **Parent** | NO (N/A) | Auto-discovers via registrations | ParentDashboard doesn't use season selector |
| **Player** | NO | Active season | Players view current season stats |
| **Team Manager** | NO | Assigned team's season | Scoped to one team |

### Implementation Notes

- **SeasonFilterBar** already gates rendering to admin + coach only (line 12: `if (role && role !== 'admin' && role !== 'coach') return null`)
- "All Seasons" option should only appear for admin role: `{role === 'admin' && <option value="all">All Seasons</option>}`
- **SeasonContext does NOT know the user's role** — it only imports `organization` from AuthContext (line 16)
- To make "All Seasons" admin-only in the context, the guard would need role info. Alternatively, keep the guard role-agnostic and only control visibility in the UI components.

### Coach Dashboard (`pages/roles/CoachDashboard.jsx`)
- Uses `selectedSeason?.id` guard at line 310 to load data
- If sentinel were passed, `.eq('season_id', 'all')` would return zero results
- **Recommendation:** Don't expose "All Seasons" to coaches — filter it out of SeasonFilterBar when `role === 'coach'`

### Parent Dashboard (`pages/roles/ParentDashboard.jsx`)
- Does NOT use `useSeason()` for data loading
- Loads registrations directly tied to parent's children
- Already effectively shows "all seasons" by auto-discovering all registrations
- **No changes needed**

### Player Dashboard (`pages/roles/PlayerDashboard.jsx`)
- Uses `selectedSeason?.id` at line 151 for data loading
- Single-season focused
- **No changes needed** — don't expose "All Seasons"

---

## Estimated Scope

### Total Files to Modify

| Category | File Count | Complexity |
|----------|-----------|------------|
| State layer (SeasonContext) | 1 | Medium |
| UI selectors (FilterBar, Header) | 2 | Low |
| Dashboard (carousel, stepper, tabs) | 2 | High |
| Category A pages (drop season filter) | 6 active pages | Medium each |
| Category B pages (add season column) | 5-6 pages | Medium each |
| Category C pages (add friendly message) | 6 pages | Low each |
| **Total** | **~22 files** | |

### Total Queries to Update
- **Category A queries:** ~8 (drop `.eq('season_id', ...)` when sentinel)
- **Category B queries:** ~6 (conditional filter + add season to response)
- **Category C queries:** 0 (just add guard before query)
- **Dashboard queries:** ~4 (skip `loadDashboardData` when sentinel; use globalStats)
- **Total:** ~18 queries

### Complexity Assessment

| Phase | Scope | Complexity | Risk |
|-------|-------|-----------|------|
| State layer (sentinel + localStorage) | SeasonContext.jsx | **Medium** | Low — well-isolated |
| UI selectors | FilterBar + Header | **Low** | Low — UI-only changes |
| Dashboard "All" mode | DashboardPage.jsx | **High** | Medium — complex conditionals |
| Category A pages | 6 pages | **Medium** | Low — straightforward filter removal |
| Category B pages | 6 pages | **Medium** | Medium — need season column UI |
| Category C pages | 6 pages | **Low** | Low — just add guard message |

### Recommended Execution Order

1. **SeasonContext + sentinel** — foundation for everything else
2. **SeasonFilterBar + HeaderSelector** — enable UI toggle
3. **Dashboard "All Seasons" mode** — the primary admin view
4. **Category C pages** — quick wins, add friendly guards
5. **Category A pages** — enable unfiltered queries
6. **Category B pages** — enhance with season columns/grouping
