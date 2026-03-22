# WEB-AUDIT-REPORT.md — Lynx Web Admin Full Audit Report

**Date:** 2026-03-22
**Auditor:** Claude Code (Opus 4.6)
**Codebase:** volleybrain-admin (React 18.2 + Vite 5)
**Scope:** 169 page files, 148 components, 65 routes, 5 roles

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 18 |
| MEDIUM | 16 |
| LOW | 13 |
| INFO | 8 |
| **Total** | **59** |

**Key findings:**
- **4 CRITICAL security/architecture issues** including unprotected platform admin and leaked credentials
- **~70+ orphaned files** containing ~8,000-10,000 lines of dead code in active `src/` directories
- **3 entire component directories** (`components/dashboard/`, `components/coach/`, `components/player/`) are 100% dead code
- **Player role is non-functional** for real users (`playerSelf = null` hardcoded)
- **110+ spec files** littering the repo root
- **reference/ directory** contains an entire mobile app repo with .env credentials committed to git
- Multiple broken navigation paths, prop mismatches, and unguarded admin routes

---

## Phase 1: Route & Navigation Audit

### 1A. Route Completeness Check

| Route Path | Component | File | Lines | Status | Notes |
|---|---|---|---|---|---|
| `/dashboard` | DashboardPage / CoachDashboard / TeamManagerDashboard / TeamManagerSetup / ParentDashboard / PlayerDashboard | Multiple | 967-998 | Live | Role-switched via `activeView` |
| `/teams/:teamId` | TeamWallPage | `src/pages/teams/TeamWallPage.jsx` | 841 | Live | Wrapper extracts teamId |
| `/team-hubs` | TeamHubSelectorPage | `src/pages/teams/TeamHubSelectorPage.jsx` | 186 | Live | Orphaned -- no nav points here |
| `/parent/player/:playerId/profile` | PlayerProfilePage | `src/pages/parent/PlayerProfilePage.jsx` | 354 | Live | Dynamic parent route |
| `/parent/player/:playerId` | ParentPlayerCardPage | `src/pages/parent/ParentPlayerCardPage.jsx` | 444 | Live | Dynamic parent route |
| `/messages` | ParentMessagesPage | `src/pages/parent/ParentMessagesPage.jsx` | 383 | Live | Orphaned -- no nav item |
| `/invite` | InviteFriendsPage | `src/pages/parent/InviteFriendsPage.jsx` | 305 | Live | Orphaned -- no nav item |
| `/my-stuff` | MyStuffPage | `src/pages/parent/MyStuffPage.jsx` | 666 | Live | Parent-only guard blocks player |
| `/parent/register` | ParentRegistrationHub | `src/pages/parent/ParentRegistrationHub.jsx` | 625 | Live | Parent-only guard |
| `/claim-account` | ClaimAccountPage | `src/pages/parent/ClaimAccountPage.jsx` | 215 | Live | No guard -- orphaned utility |
| `/roster` | RosterManagerPage | `src/pages/roster/RosterManagerPage.jsx` | 440 | Live | Guard: admin, coach, team_manager |
| `/teams` | TeamsPage | `src/pages/teams/TeamsPage.jsx` | 521 | Live | **NO guard** |
| `/coaches` | CoachesPage | `src/pages/coaches/CoachesPage.jsx` | 975 | Live | Guard: admin, coach |
| `/staff` | StaffPage | `src/pages/staff/StaffPage.jsx` | 425 | Live | Guard: admin |
| `/registrations` | RegistrationsPage | `src/pages/registrations/RegistrationsPage.jsx` | 474 | Live | Guard: admin |
| `/jerseys` | JerseysPage | `src/pages/jerseys/JerseysPage.jsx` | 1397 | Live | Guard: admin |
| `/schedule` | SchedulePage | `src/pages/schedule/SchedulePage.jsx` | 420 | Live | No guard (multi-role) |
| `/schedule/availability` | CoachAvailabilityPage | `src/pages/schedule/CoachAvailabilityPage.jsx` | 499 | Live | Guard: admin, coach |
| `/attendance` | AttendancePage | `src/pages/attendance/AttendancePage.jsx` | 405 | Live | Guard: admin, coach, team_manager |
| `/payments` | ParentPaymentsPage / PaymentsPage | Multiple | 555/454 | Live | **NO guard** -- role-switched |
| `/gameprep` | GamePrepPage | `src/pages/gameprep/GamePrepPage.jsx` | 623 | Live | Guard: admin, coach |
| `/standings` | TeamStandingsPage | `src/pages/standings/TeamStandingsPage.jsx` | 534 | Live | No guard (public data) |
| `/leaderboards` | SeasonLeaderboardsPage | `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | 646 | Live | No guard (public data) |
| `/chats` | ChatsPage | `src/pages/chats/ChatsPage.jsx` | 447 | Live | No guard (all roles) |
| `/blasts` | BlastsPage | `src/pages/blasts/BlastsPage.jsx` | 683 | Live | Guard: admin, coach, team_manager |
| `/notifications` | NotificationsPage | `src/pages/notifications/NotificationsPage.jsx` | 687 | Live | Guard: admin |
| `/reports` | ReportsPage | `src/pages/reports/ReportsPage.jsx` | 580 | Live | Guard: admin |
| `/reports/funnel` | RegistrationFunnelPage | `src/pages/reports/RegistrationFunnelPage.jsx` | 400 | Live | Guard: admin |
| `/archives` | SeasonArchivePage | `src/pages/archives/SeasonArchivePage.jsx` | 255 | Live | No guard (historical) |
| `/directory` | OrgDirectoryPage | `src/pages/public/OrgDirectoryPage.jsx` | 916 | Live | No guard (public) |
| `/achievements` | AchievementsCatalogPage | `src/pages/achievements/AchievementsCatalogPage.jsx` | 485 | Live | No guard (scoped by player) |
| `/stats` | PlayerStatsPage | `src/pages/stats/PlayerStatsPage.jsx` | 740 | Live | No guard (scoped by player) |
| `/stats/:playerId` | PlayerStatsPage | `src/pages/stats/PlayerStatsPage.jsx` | 740 | Live | URL param ignored |
| `/admin/seasons/:seasonId` | SeasonManagementPage | `src/pages/admin/SeasonManagementPage.jsx` | 431 | Live | Guard: admin. Orphaned (programmatic) |
| `/admin/seasons` | SeasonManagementPage | `src/pages/admin/SeasonManagementPage.jsx` | 431 | Live | Guard: admin |
| `/settings/*` (8 routes) | Various settings pages | `src/pages/settings/` | 298-622 | Live | Guard: admin |
| `/profile` | MyProfilePage | `src/pages/profile/MyProfilePage.jsx` | 142 | Live | No guard (self-service) |
| `/platform/admin` | PlatformAdminPage | RoutedContent copy | 890 | **Dead Code** | Never renders (appMode switch) |
| `/platform/analytics` | PlatformAnalyticsPage | RoutedContent copy | 741 | **Dead Code** | Never renders |
| `/platform/subscriptions` | PlatformSubscriptionsPage | RoutedContent copy | 688 | **Dead Code** | Never renders |

**Platform Mode Routes (PlatformShell -- 10 routes, ALL unguarded):**

| Route Path | Component | Lines | Status |
|---|---|---|---|
| `/platform/overview` | PlatformOverview | 406 | Live -- NO guard |
| `/platform/organizations` | PlatformOrganizations | 790 | Live -- NO guard |
| `/platform/organizations/:orgId` | PlatformOrgDetail | 892 | Live -- NO guard |
| `/platform/users` | PlatformUsersPage | 1025 | Live -- NO guard |
| `/platform/subscriptions` | PlatformSubscriptionsPage | 688 | Live -- NO guard |
| `/platform/analytics` | PlatformAnalyticsPage | 741 | Live -- NO guard |
| `/platform/support` | PlatformSupport | 927 | Live -- NO guard |
| `/platform/audit` | PlatformAuditLog | 494 | Live -- NO guard |
| `/platform/settings` | PlatformSettings | 517 | Live -- NO guard |
| `/platform/admin` | PlatformAdminPage | 890 | Live -- NO guard |

---

### 1B. Nav Item -> Route Mapping (Per Role)

#### Admin Nav (28 items) -- All OK
All 28 admin nav items resolve to valid routes with correct guards. No issues.

#### Coach Nav (13 items) -- All OK
All 13 coach nav items resolve correctly. Dynamic `teamwall-{id}` items work via `getPathForPage` pattern matching.

#### Parent Nav (9 items) -- 1 ISSUE

| Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|
| Team Hub | `team-hub` | **No ROUTES entry** | **BROKEN** -- falls to `/dashboard` |

#### Player Nav (7 items) -- 2 ISSUES

| Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|
| My Team (group) | `teamwall-{id}` | `roleContext.playerInfo` always null | **BROKEN** -- always empty |
| Profile & Stats | `my-stuff` | `/my-stuff` (parent-only guard) | **BROKEN** -- player blocked |

#### Team Manager Nav (12 items) -- All OK
All items resolve. Note: team_manager sees full admin PaymentsPage at `/payments`.

#### Orphaned Routes (route exists, no nav points to it)

| Route | Component | Guard | Risk |
|---|---|---|---|
| `/team-hubs` | TeamHubSelectorPage | admin | Low |
| `/messages` | ParentMessagesPage | parent | Low |
| `/invite` | InviteFriendsPage | parent | Low |
| `/claim-account` | ClaimAccountPage | None | Medium |
| `/admin/seasons` | SeasonManagementPage | admin | Low |
| `/platform/*` (10 routes) | Platform pages | **None** | **HIGH** |

---

### 1C. RouteGuard Security Audit

#### FINDING 1.1 -- CRITICAL: Platform Mode Has NO Auth Protection
- **Category:** SECURITY
- **Location:** `src/MainApp.jsx` lines 784-793, 1100-1132
- **Description:** Any authenticated user can access all 10 `/platform/*` routes by simply navigating to the URL. The `appMode` state auto-switches based on URL path with no `isPlatformAdmin` check. `isPlatformAdmin` is only used to show/hide the "Enter Platform Mode" button -- UI-only protection, trivially bypassed.
- **Impact:** Parents, coaches, players, and team managers can access all platform admin pages including user management, org management, analytics, audit logs, and settings.
- **Fix:** Add `isPlatformAdmin` check to the `appMode` switching logic. Redirect non-platform-admins who navigate to `/platform/*` back to `/dashboard`.

#### FINDING 1.2 -- HIGH: `loadRoleContext()` ReferenceError
- **Category:** NAVIGATION
- **Location:** `src/MainApp.jsx` line 665
- **Description:** `RoutedContent` function references `loadRoleContext()` in the TeamManagerSetup `onComplete` callback. But `loadRoleContext` is defined inside the `MainApp` function (line 806), and `RoutedContent` is a sibling function defined before `MainApp`. This will cause a `ReferenceError` at runtime when a team manager completes setup.
- **Fix:** Move `loadRoleContext` to a shared scope or pass it as a prop.

#### FINDING 1.3 -- MEDIUM: `/teams` Has No RouteGuard
- **Category:** SECURITY
- **Location:** `src/MainApp.jsx` line 695
- **Description:** `/teams` renders `TeamsPage` (admin team management with create/edit/delete/roster/CSV export) with no RouteGuard. Any role can access by URL.
- **Fix:** Add `RouteGuard allow={['admin']}`.

#### FINDING 1.4 -- MEDIUM: `/payments` Has No RouteGuard
- **Category:** SECURITY
- **Location:** `src/MainApp.jsx` lines 703-707
- **Description:** `/payments` has no RouteGuard. Switches between ParentPaymentsPage (parent) and PaymentsPage (all others). Coach/player/team_manager see the full admin financial page.
- **Fix:** Add RouteGuard or role-conditional rendering for coach/player.

#### FINDING 1.5 -- MEDIUM: Player `my-stuff` Blocked by Parent Guard
- **Category:** NAVIGATION / UX
- **Location:** `src/MainApp.jsx` line 687, playerNavGroups line 1020
- **Description:** Player nav includes "Profile & Stats" (`my-stuff`) but `/my-stuff` has `RouteGuard allow={['parent']}`. Player is silently redirected to `/dashboard`.
- **Fix:** Either add `'player'` to the RouteGuard or create a separate player profile page.

#### FINDING 1.6 -- LOW: Dead Platform Routes in RoutedContent
- **Category:** DEAD-CODE
- **Location:** `src/MainApp.jsx` lines 756-758
- **Description:** Three platform routes in RoutedContent (`/platform/admin`, `/platform/analytics`, `/platform/subscriptions`) with `RouteGuard allow={['admin']}` never render because `appMode='platform'` switches to PlatformShell first.
- **Fix:** Remove the dead routes from RoutedContent.

---

## Phase 2: File & Import Audit

### 2A. Orphaned Files

#### Tier 1: `src/components/dashboard/` -- ENTIRE DIRECTORY ORPHANED (~19 files)
The live `DashboardPage.jsx` imports from `components/v2/`, not `components/dashboard/`. Every file in this directory is only consumed via dead `widgetComponents.jsx` chain or archive files.

**Files include:** AdminActionChecklist, AdminNotificationsCard, AdminQuickActions, AdminSetupTracker, AllTeamsTable, DashboardFilterCard, LiveActivity (324 lines), OrgActionItems, OrgFinancials, OrgHealthHero, OrgKpiRow, OrgUpcomingEvents, OrgWallPreview, PaymentSummaryCard, PeopleComplianceRow, PlaceholderWidget, RegistrationStatsCard, SeasonJourneyList (218 lines), SeasonJourneyRow, TeamSnapshot, UpcomingEventsCard

#### Tier 2: `src/components/coach/` -- ENTIRE DIRECTORY ORPHANED (~26 files)
The live `CoachDashboard.jsx` imports from `components/v2/coach/`, not `components/coach/`.

**Files include:** AchievementsCard, AlsoThisWeekCard, CalendarStripCard, ChallengesCard, CoachActionItems, CoachActionItemsCard, CoachCommandStrip (154 lines), CoachGameDayHeroV2 (297 lines), CoachHeroCarousel (156 lines), CoachJourneyTracker (85 lines), CoachNotifications (181 lines), CoachPerformanceGrid, CoachRosterPanel, CoachScheduleCard, CoachSeasonJourneyCard, CoachStatMiniCards, CoachTools, CoachWorkflowButtons (58 lines), GameDayChecklist, GameDayJourneyCard, IdleHeroCard, PracticeHeroCard, RotatingPanel (43 lines), SeasonSetupHeroCard, SquadRosterCard, TeamHealthCard, TeamReadinessCard, TeamWallPreviewCard, TopPlayersCard

#### Tier 3: `src/components/player/` -- ENTIRE DIRECTORY ORPHANED (~6 files)
The live `PlayerDashboard.jsx` imports from `components/v2/player/`.

**Files:** DailyChallengeCard, LastGameCard, PlayerHeroCard, PlayerProfileSidebar, ScoutingReportCard, TrophyCaseCard

#### Tier 4: Widget System Chain ORPHANED (~8 files, ~1,500 lines)

| File | Lines |
|---|---|
| `src/components/layout/DashboardGrid.jsx` | 518 |
| `src/components/layout/DashboardGrids.jsx` | 49 |
| `src/components/layout/DashboardLayout.jsx` | 35 |
| `src/components/layout/EditLayoutButton.jsx` | ~30 |
| `src/components/layout/WidgetLibraryPanel.jsx` | ~120 |
| `src/components/layout/widgetComponents.jsx` | 167 |
| `src/components/layout/widgetRegistry.js` | 638 |
| `src/components/layout/SpacerWidget.jsx` | ~20 |

#### Tier 5: Individual Orphaned Files

| File | Lines | Reason |
|---|---|---|
| `src/pages/achievements/TrackedAchievementsWidget.jsx` | 387 | Zero external importers |
| `src/pages/public/TeamWallPage.jsx` | 1,132 | Superseded by `pages/teams/TeamWallPage.jsx` |
| `src/components/layout/LiveActivitySidebar.jsx` | 183 | Zero imports |
| `src/components/journey/JourneyTimeline.jsx` | 334 | Archive-only imports |
| `src/components/engagement/ChallengeCard.jsx` | 166 | Zero imports |
| `src/components/engagement/ChallengeDetailModal.jsx` | 241 | Zero imports |
| `src/components/engagement/AchievementCelebrationModal.jsx` | 181 | Zero imports |
| `src/components/engagement/HexBadge.jsx` | 77 | Zero imports |
| `src/components/engagement/LevelBadge.jsx` | 38 | Zero imports |
| `src/components/games/GameStatsEntryModal.jsx` | 541 | Zero imports |
| `src/components/games/GameScoringModal.jsx` | 847 | Zero imports |
| `src/components/parent/ParentHeroCard.jsx` | ~80 | Zero imports |
| `src/components/parent/ParentTopBanner.jsx` | ~40 | Zero imports |
| `src/components/parent/ParentEventCard.jsx` | ~80 | Zero imports |
| `src/components/parent/EngagementProgressCard.jsx` | ~60 | Orphaned chain only |
| `src/components/parent/NextEventCard.jsx` | ~80 | Orphaned chain only |
| `src/components/parent/ParentJourneyCard.jsx` | ~80 | Orphaned chain only |
| `src/components/parent/QuickLinksCard.jsx` | ~80 | Orphaned chain only |
| `src/components/parent/SeasonRecordCard.jsx` | ~60 | Orphaned chain only |
| `src/pages/roles/ParentChildHero.jsx` | 163 | Orphaned chain only |

**TOTAL ORPHANED: ~70+ files, ~8,000-10,000 lines of dead code**

---

### 2B. Duplicate / Overlapping Files

#### FINDING 2.1 -- DashboardGrid Cluster
- **`components/layout/DashboardGrid.jsx`** (518 lines) -- ORPHANED. Old react-grid-layout drag-drop.
- **`components/layout/DashboardGrids.jsx`** (49 lines) -- ORPHANED. Simple CSS grid utilities.
- **`components/widgets/dashboard/DashboardGrid.jsx`** -- Does not exist (already deleted).
- **Recommendation:** DELETE both. Superseded by V2 dashboard layout.

#### FINDING 2.2 -- TeamWallPage Cluster
- **`pages/teams/TeamWallPage.jsx`** (840 lines) -- ACTIVE. Modern refactored version with extracted components.
- **`pages/public/TeamWallPage.jsx`** (1,132 lines) -- ORPHANED. Older monolithic version. Exported but never imported.
- **Recommendation:** DELETE the public version.

#### FINDING 2.3 -- LineupBuilder Cluster
- **`components/games/AdvancedLineupBuilder.jsx`** (1,207 lines) -- ACTIVE. Full game-day lineup tool with court visualization.
- **`pages/schedule/LineupBuilder.jsx`** (302 lines) -- ACTIVE. Quick lineup picker for schedule context.
- **Recommendation:** KEEP BOTH. Different use cases. Consider renaming schedule version to `QuickLineupModal.jsx`.

#### FINDING 2.4 -- VenueManager Cluster
- **`pages/settings/VenueManagerPage.jsx`** (298 lines) -- ACTIVE. Full CRUD settings page.
- **`pages/schedule/VenueManagerModal.jsx`** (79 lines) -- ACTIVE. Inline modal for schedule page.
- **Recommendation:** KEEP BOTH. Different contexts.

#### FINDING 2.5 -- Season Pages Cluster
- **`pages/settings/SeasonsPage.jsx`** (311 lines) -- ACTIVE. List/CRUD view (manage all seasons).
- **`pages/admin/SeasonManagementPage.jsx`** (430 lines) -- ACTIVE. Single-season workflow deep-dive.
- **Recommendation:** KEEP BOTH. Complementary list/detail pattern.

#### FINDING 2.6 -- Coach Dashboard Cluster
- **`pages/roles/CoachDashboard.jsx`** (997 lines) -- ACTIVE. Live V2 coach dashboard.
- **`components/coach/CoachCenterDashboard.jsx`** -- Does not exist (only commented-out archive references).
- **Recommendation:** No action needed.

---

### 2C. Misplaced Files

| File | Current Location | Verdict |
|---|---|---|
| `pages/roster/SeasonSetupWizard.jsx` | roster/ | Acceptable -- imported by co-located RosterManagerPage |
| `pages/schedule/LineupBuilder.jsx` | schedule/ | Correct -- used by SchedulePage |
| `pages/schedule/VenueManagerModal.jsx` | schedule/ | Correct -- schedule-specific modal |
| `pages/achievements/AchievementCard.jsx` | pages/ | Could move to components/achievements/ |
| `pages/achievements/AchievementDetailModal.jsx` | pages/ | Could move to components/achievements/ |
| `pages/gameprep/GameCard.jsx` | pages/ | Could move to components/games/ |
| `pages/gameprep/GameDayHelpers.jsx` | pages/ | Could move to lib/ |
| `pages/chats/MessageBubble.jsx` | pages/ | Could move to components/chats/ |
| `pages/parent/PlayerProfileConstants.jsx` | pages/ | Could move to constants/ or lib/ |

**Note:** Most "misplaced" files follow a co-location pattern. Priority should be orphan deletion first.

---

### 2D. Monster Files (500+ lines)

| File | Lines | Split Recommendation |
|---|---|---|
| `src/pages/settings/SetupSectionContent.jsx` | 1,525 | **HIGH** -- 16 form sections, each self-contained |
| `src/pages/jerseys/JerseysPage.jsx` | 1,396 | Extract JerseyAssignmentModal, JerseyRequestsTable |
| `src/components/games/GameComponents.jsx` | 1,341 | Extract sportConfigs.js, GameStatsModal |
| `src/MainApp.jsx` | 1,209 | Route definitions could move to routes.jsx |
| `src/components/games/AdvancedLineupBuilder.jsx` | 1,207 | Extract CourtVisualization, sportPositionConfigs |
| `src/pages/schedule/EventDetailModal.jsx` | 1,198 | Extract section components |
| `src/pages/public/TeamWallPage.jsx` | 1,132 | **DELETE** (orphaned) |
| `src/pages/roles/CoachDashboard.jsx` | 997 | Extract inline EventDetailModal |
| `src/pages/coaches/CoachesPage.jsx` | 974 | Extract CoachInviteFlow |
| `src/pages/dashboard/DashboardPage.jsx` | 966 | Data loading could move to custom hook |
| `src/components/games/GameScoringModal.jsx` | 847 | **DELETE** (orphaned) |
| `src/pages/teams/TeamWallPage.jsx` | 840 | Already well-split |
| `src/pages/roles/ParentDashboard.jsx` | 777 | Data loading could extract to hook |
| `src/pages/schedule/BulkEventWizard.jsx` | 755 | Extract step components |
| `src/pages/stats/PlayerStatsPage.jsx` | 739 | Extract StatsTable, StatsChartPanel |

---

## Phase 3: Cross-Role Behavior Audit

### 3A. Shared Routes Per-Role Behavior

#### FINDING 3.1 -- CRITICAL: playerSelf Hardcoded to null
- **Category:** ARCHITECTURE
- **Location:** `src/MainApp.jsx` line 830
- **Description:** `const playerSelf = null` with TODO comment: "needs profile_id linkage -- players table has no profile_id column". This causes `roleContext.isPlayer` to always be false, `roleContext.playerInfo` to always be null. Player view is only available as admin/coach preview mode.
- **Impact:** The entire player role is non-functional for real player users. Multiple nav items, dashboard features, and page data loading break under this condition.
- **Fix:** Add `profile_id` column to `players` table and implement the lookup.

#### FINDING 3.2 -- HIGH: Coach/TM/Player See Admin PaymentsPage
- **Category:** SECURITY
- **Location:** `src/MainApp.jsx` lines 703-707
- **Description:** The `/payments` route only switches for `activeView === 'parent'`. All other roles (coach, team_manager, player) see the full admin `PaymentsPage` with financial data, payment controls, and admin actions. Team manager nav actively directs to this page.
- **Fix:** Add role-specific rendering or RouteGuard.

#### FINDING 3.3 -- HIGH: Player Sees ALL Chat Channels
- **Category:** SECURITY
- **Location:** `src/pages/chats/ChatsPage.jsx` line 167
- **Description:** Channel filtering only applies to parent, coach, and team_manager roles. The player role is NOT included in the filter condition, so a player sees all channels (same as admin).
- **Fix:** Add player role to the channel filtering logic.

#### FINDING 3.4 -- HIGH: Player "Profile & Stats" Blocked by Parent Guard
- **Category:** NAVIGATION
- **Location:** `src/MainApp.jsx` line 687, playerNavGroups line 1020
- **Description:** Player nav "Profile & Stats" maps to `/my-stuff` which has `RouteGuard allow={['parent']}`. Player is silently redirected to dashboard.
- **Fix:** Add `'player'` to guard or create separate player profile route.

#### FINDING 3.5 -- HIGH: Player "My Team" Nav Always Empty
- **Category:** NAVIGATION
- **Location:** `src/MainApp.jsx` lines 1006-1012
- **Description:** Player "My Team" nav group maps `roleContext?.playerInfo?.team_players` which is always null (playerSelf is null). Results in empty nav group.
- **Fix:** Blocked by FINDING 3.1 (playerSelf must be implemented first).

#### FINDING 3.6 -- HIGH: "team-hub" Not in ROUTES Map
- **Category:** NAVIGATION
- **Location:** `src/MainApp.jsx` line 993, `src/lib/routes.js`
- **Description:** Parent nav uses `id: 'team-hub'` (singular) but ROUTES map has `'team-hubs'` (plural). `getPathForPage('team-hub')` returns `/dashboard` (fallback). When parent's first child has no teams, clicking "Team Hub" silently redirects to dashboard.
- **Fix:** Change nav ID to `'team-hubs'` or add `'team-hub'` to ROUTES map. Also note that `/team-hubs` is admin-only guarded.

#### FINDING 3.7 -- MEDIUM: Unknown activeView Renders Admin Dashboard
- **Category:** SECURITY
- **Location:** `src/MainApp.jsx` line 669
- **Description:** The final `else` branch of the dashboard ternary renders `<DashboardPage />` (admin dashboard) for any unknown `activeView` value.
- **Fix:** Add explicit fallback or error state.

#### FINDING 3.8 -- MEDIUM: SchedulePage Loads All Events for All Roles
- **Category:** UX
- **Location:** `src/pages/schedule/SchedulePage.jsx` lines 77-84
- **Description:** `loadEvents()` queries all `schedule_events` for the season with no team-based filtering. Parents and players see events for teams they're not on.
- **Fix:** Filter by team membership for parent/player roles.

#### FINDING 3.9 -- LOW: playerName Renders "undefined's"
- **Category:** UX
- **Location:** `src/MainApp.jsx` line 722
- **Description:** When `roleContext?.children` is empty (for admin/coach roles), the achievements page title shows "undefined's Achievements".
- **Fix:** Add null check with fallback text.

#### FINDING 3.10 -- LOW: /stats/:playerId Ignores URL Params
- **Category:** NAVIGATION
- **Location:** `src/MainApp.jsx` lines 734-736
- **Description:** The `:playerId` URL parameter is defined in the route but `PlayerStatsPage` doesn't use `useParams()`. It relies entirely on the `playerId` prop.
- **Fix:** Either use `useParams()` in the component or remove the dynamic route.

---

## Phase 4: Architecture & Code Health

### 4A. `src/_archive/` Directory

#### FINDING 4.1 -- HIGH: _archive/ is 100% Dead Code (~140 files)
- **Category:** DEAD-CODE
- **Location:** `src/_archive/`
- **Description:** 17 subdirectories containing ~140 files (136 .jsx/.js + 4 .ttf binary fonts). NOT in `.gitignore`. Tracked by git. Zero active files import from `_archive/`.
- **Contents include:** admin-cards, admin-rework, coach-final, dashboard-polish, fonts, grid-system, inner-pages-v2, pages-redesign, pages-wave2, parent-player, responsive-layout, role-access, stub-buildout, widget-grid, widget-library, widget-ux
- **Fix:** Delete entirely and add to `.gitignore`.

### 4B. `src_backup/` Directory

#### FINDING 4.2 -- MEDIUM: src_backup/ Still Exists with Broken .gitignore
- **Category:** ARCHITECTURE
- **Location:** `src_backup/`, `.gitignore`
- **Description:** 11 files (ancient pre-redesign backups). `.gitignore` entry is `src_backup/NUL` (broken -- Windows device name artifact). Should be `src_backup/`.
- **Fix:** Fix `.gitignore` entry and delete directory.

### 4C. CC Spec Files

#### FINDING 4.3 -- HIGH: 110+ Spec Files Littering Repo Root
- **Category:** ARCHITECTURE
- **Location:** Repo root
- **Description:** ~69 `CC-*.md` files, ~8 `CC-V2-*.md`, ~5 `CC-PHASE*.md`, ~11 `TEAMWALL_*.md`, ~3 `INVESTIGATION-*.md`, and various other spec/doc files. Total ~110+ non-essential .md files.
- **Fix:** Move to `docs/specs/` directory or delete. Keep only README.md, CLAUDE.md, and DATABASE_SCHEMA.md.

### 4D. `reference/` Directory

#### FINDING 4.4 -- CRITICAL: .env With Supabase Credentials in Git
- **Category:** SECURITY
- **Location:** `reference/mobile-app/.env`
- **Description:** Live Supabase anon key committed to git in plaintext. While anon keys are client-side by nature, having them committed alongside the full mobile source is a hygiene problem.
- **Fix:** Add `reference/` to `.gitignore`, `git rm -r --cached reference/`, rotate credentials if pushed to remote.

#### FINDING 4.5 -- CRITICAL: Nested Git Repo in Web Repo
- **Category:** ARCHITECTURE
- **Location:** `reference/mobile-app/.git/`
- **Description:** The entire mobile app repository (including `.git/` with packfile) is tracked inside the web repo. This single packfile likely accounts for most of the repo bloat (~90MB).
- **Fix:** Remove `reference/` from git tracking.

#### FINDING 4.6 -- CRITICAL: reference/ Not in .gitignore
- **Category:** ARCHITECTURE
- **Location:** `reference/`
- **Description:** 90MB of reference materials (PNG screenshots, ZIP files, entire mobile app clone, v0 design mockups) tracked by git.
- **Fix:** Add to `.gitignore` and remove from git tracking.

### 4E. Import Health

- **Imports from _archive/src_backup/reference:** CLEAN -- zero matches.
- **Broken imports:** CLEAN -- spot-checked MainApp.jsx, all resolve.
- **Unused imports in LynxSidebar.jsx (LOW):** 5 unused destructured variables: `activePathname`, `orgInitials`, `orgLogo`, `teamName`, `teamSub`.

### 4F. Context & Hook Audit

| Context | Provided In | Consumers | Severity |
|---|---|---|---|
| `AuthContext` | App.jsx | 158+ files | None -- core |
| `ThemeContext` | App.jsx | 158+ files | None -- core |
| `SeasonContext` | MainApp.jsx | 35+ files | None -- working |
| `SportContext` | MainApp.jsx | 10+ files | None -- working |
| `JourneyContext` | App.jsx (AuthenticatedApp) | ~10 files | **MEDIUM** -- global but sparse |
| `ParentTutorialContext` | MainApp.jsx | 5 files | **MEDIUM** -- runs for all roles |
| `OrgBrandingContext` | MainApp.jsx | 4 files | **MEDIUM** -- global but sparse |

**FINDING 4.7 -- MEDIUM: JourneyContext Globally Provided, Sparsely Consumed**
- Makes Supabase calls for all authenticated users but only admin setup uses it.

**FINDING 4.8 -- MEDIUM: ParentTutorialContext Runs for All Roles**
- Makes Supabase calls (`loadTutorialState`, `loadChecklistData`) even for non-parent users.

**FINDING 4.9 -- MEDIUM: OrgBrandingContext Wraps Entire App**
- Only 4 components consume it. Low overhead but unnecessary for most pages.

**Custom Hooks:** All 4 hooks (`useAppNavigate`, `useCurrentPageId`, `useDocumentTitle`, `useTeamManagerData`) are actively consumed. No dead hooks.

---

## Phase 5: Button & Action Audit

### 5A. Dashboard Action Buttons

#### FINDING 5.1 -- HIGH: GiveShoutoutModal Missing `visible` Prop
- **Category:** UX
- **Location:** `src/pages/roles/CoachDashboard.jsx` line ~986
- **Description:** CoachDashboard conditionally renders `GiveShoutoutModal` without passing the `visible` prop. The modal's `useEffect` depends on `visible` to reset state and load data. Since `visible` is undefined, the modal opens but never loads its recipient list or category data. Also missing `onSuccess` callback -- no success feedback after sending.
- **Fix:** Pass `visible={showShoutoutModal}` and `onSuccess` callback.

#### FINDING 5.2 -- HIGH: `player-card-{id}` Route Broken in ParentDashboard
- **Category:** NAVIGATION
- **Location:** `src/pages/roles/ParentDashboard.jsx`
- **Description:** KidCards `onViewPlayerCard` calls `onNavigate('player-card-{id}')`. `getPathForPage` matches `startsWith('player-')`, strips `player-`, leaving `card-{id}`, generating `/parent/player/card-{id}` -- a nonexistent route.
- **Fix:** Use `onNavigate('player-profile-{id}')` or add handling for `player-card-` prefix.

#### FINDING 5.3 -- HIGH: BodyTabs Prop Mismatch in PlayerDashboard
- **Category:** UX
- **Location:** `src/pages/roles/PlayerDashboard.jsx` lines 249-254
- **Description:** Tabs use `key` property but BodyTabs expects `id`. Passes `activeTab` but BodyTabs expects `activeTabId`. No tab is ever visually highlighted. Content renders correctly but tab indicator never appears.
- **Fix:** Change `key` to `id` and `activeTab` to `activeTabId`.

#### FINDING 5.4 -- HIGH: BodyTabs Prop Mismatch in TeamManagerDashboard
- **Category:** UX
- **Location:** `src/pages/roles/TeamManagerDashboard.jsx` lines 112-117
- **Description:** Same issue as PlayerDashboard -- `key` instead of `id`, `activeTab` instead of `activeTabId`.
- **Fix:** Same as above.

#### FINDING 5.5 -- HIGH: FloatingHelpButton "Help Center" and "Contact Support" are No-Ops
- **Category:** UX
- **Location:** `src/components/parent/ParentOnboarding.jsx`
- **Description:** Both buttons just close the menu (`onClick={() => setShowMenu(false)}`) without navigating or triggering any action.
- **Fix:** Implement help center link and support contact flow, or remove the buttons.

#### FINDING 5.6 -- MEDIUM: `onNavigate('teamwall', { teamId })` Doesn't Resolve
- **Category:** NAVIGATION
- **Location:** `src/pages/dashboard/DashboardPage.jsx` (AdminTeamsTab)
- **Description:** `getPathForPage('teamwall', { teamId })` doesn't handle `'teamwall'` with params. Falls to `/dashboard`. Should be `onNavigate('teamwall-' + teamId)`.
- **Fix:** Use `onNavigate(\`teamwall-${teamId}\`)` pattern.

#### FINDING 5.7 -- MEDIUM: `onNavigate('teamwall')` in ParentDashboard
- **Category:** NAVIGATION
- **Location:** `src/pages/roles/ParentDashboard.jsx`
- **Description:** "Team Hub" button calls `onNavigate('teamwall')` without team ID. Falls to `/dashboard`.
- **Fix:** Include team ID in the navigation call.

#### FINDING 5.8 -- MEDIUM: ParentChecklistWidget Imported But Never Rendered
- **Category:** DEAD-CODE
- **Location:** `src/MainApp.jsx` line 44
- **Description:** `ParentChecklistWidget` (aliased as `ParentJourneyBar`) is imported but never placed in the JSX tree.
- **Fix:** Either render it or remove the import.

#### FINDING 5.9 -- MEDIUM: FloatingHelpButton and FloatingChatButton Overlap
- **Category:** UX
- **Location:** `src/components/parent/ParentOnboarding.jsx`, `src/components/layout/FloatingChatButton.jsx`
- **Description:** Both positioned at `fixed bottom-6 right-6`. FloatingHelpButton (z-50) covers FloatingChatButton (z-40) for parent view.
- **Fix:** Offset one of the buttons.

### 5B. Modal & Drawer Connections

- **GamePrepPage modals:** All properly wired (GameStatsModal, GameDetailModal, QuickAttendanceModal, QuickScoreModal).
- **SchedulePage modals:** PosterModal properly wired.
- **RegistrationsPage modals:** Deny/BulkDeny properly wired.
- **ParentDashboard modals:** EventDetailModal, PaymentOptionsModal, QuickRsvpModal, ActionItemsSidebar all properly wired.

#### FINDING 5.10 -- LOW: AddChildModal and ReRegisterModal Unreachable
- **Category:** DEAD-CODE
- **Location:** `src/pages/roles/ParentDashboard.jsx`
- **Description:** Both modals are rendered in JSX but their `show*` states are never set to `true` from any UI element.
- **Fix:** Wire them to UI elements or remove.

#### FINDING 5.11 -- LOW: WarmupTimerModal Unreachable Dead Code
- **Category:** DEAD-CODE
- **Location:** `src/pages/roles/CoachDashboard.jsx` lines 170-244
- **Description:** Fully implemented modal but `setShowWarmupTimer(true)` is never called. Feature was removed from UI during V2 redesign.
- **Fix:** Delete the modal code.

### 5C. Floating Components

#### FINDING 5.12 -- MEDIUM: FloatingChatButton Inflated Unread Count
- **Category:** UX
- **Location:** `src/components/layout/FloatingChatButton.jsx`
- **Description:** Counts ALL messages in last 24 hours from other users across ALL channels, not just channels the user is a member of. Shows inflated badge counts.
- **Fix:** Filter by user's channel membership.

#### FINDING 5.13 -- MEDIUM: BlastAlertChecker Possible Column Mismatch
- **Category:** UX
- **Location:** `src/components/layout/BlastAlertChecker.jsx`
- **Description:** Queries `.eq('profile_id', user.id)` but blast creation uses `recipient_id` as the column name. May never find pending blasts.
- **Fix:** Verify column name against schema and fix.

#### FINDING 5.14 -- LOW: BlastAlertChecker No Polling
- **Category:** UX
- **Location:** `src/components/layout/BlastAlertChecker.jsx`
- **Description:** Only checks on mount. New blasts during session won't appear until refresh.
- **Fix:** Add polling or Supabase realtime subscription.

---

## Full Issue Inventory

### CRITICAL (4)

| # | Finding | Category | Location |
|---|---|---|---|
| 1.1 | Platform mode has no auth protection | SECURITY | MainApp.jsx:784-793 |
| 3.1 | playerSelf hardcoded to null | ARCHITECTURE | MainApp.jsx:830 |
| 4.4 | .env with Supabase credentials in git | SECURITY | reference/mobile-app/.env |
| 4.5 | Nested git repo tracked in web repo | ARCHITECTURE | reference/mobile-app/.git/ |

### HIGH (18)

| # | Finding | Category | Location |
|---|---|---|---|
| 1.2 | loadRoleContext() ReferenceError | NAVIGATION | MainApp.jsx:665 |
| 1.3 | /teams has no RouteGuard | SECURITY | MainApp.jsx:695 |
| 2.1 | components/dashboard/ fully orphaned (~19 files) | ORPHAN | src/components/dashboard/ |
| 2.2 | components/coach/ fully orphaned (~26 files) | ORPHAN | src/components/coach/ |
| 2.3 | components/player/ fully orphaned (~6 files) | ORPHAN | src/components/player/ |
| 2.4 | Widget system chain orphaned (~8 files) | ORPHAN | src/components/layout/ |
| 2.5 | 20+ individual orphaned files | ORPHAN | Various |
| 3.2 | Coach/TM/Player see admin PaymentsPage | SECURITY | MainApp.jsx:703-707 |
| 3.3 | Player sees ALL chat channels | SECURITY | ChatsPage.jsx:167 |
| 3.4 | Player "Profile & Stats" blocked | NAVIGATION | MainApp.jsx:687 |
| 3.5 | Player "My Team" always empty | NAVIGATION | MainApp.jsx:1006-1012 |
| 3.6 | "team-hub" not in ROUTES map | NAVIGATION | MainApp.jsx:993 |
| 4.1 | _archive/ is 100% dead code (~140 files) | DEAD-CODE | src/_archive/ |
| 4.3 | 110+ spec files in repo root | ARCHITECTURE | Repo root |
| 5.1 | GiveShoutoutModal missing visible prop | UX | CoachDashboard.jsx |
| 5.2 | player-card-{id} route broken | NAVIGATION | ParentDashboard.jsx |
| 5.3 | BodyTabs prop mismatch (Player) | UX | PlayerDashboard.jsx |
| 5.4 | BodyTabs prop mismatch (TeamManager) | UX | TeamManagerDashboard.jsx |

### MEDIUM (16)

| # | Finding | Category | Location |
|---|---|---|---|
| 1.4 | /payments has no RouteGuard | SECURITY | MainApp.jsx:703 |
| 1.5 | Player my-stuff blocked by parent guard | NAVIGATION | MainApp.jsx:687 |
| 3.7 | Unknown activeView renders admin dashboard | SECURITY | MainApp.jsx:669 |
| 3.8 | SchedulePage loads all events for all roles | UX | SchedulePage.jsx:77 |
| 4.2 | src_backup/ broken .gitignore entry | ARCHITECTURE | .gitignore |
| 4.7 | JourneyContext globally provided, sparse | ARCHITECTURE | JourneyContext.jsx |
| 4.8 | ParentTutorialContext runs for all roles | ARCHITECTURE | ParentTutorialContext.jsx |
| 4.9 | OrgBrandingContext wraps entire app | ARCHITECTURE | OrgBrandingContext.jsx |
| 5.5 | FloatingHelpButton no-ops | UX | ParentOnboarding.jsx |
| 5.6 | onNavigate('teamwall', {teamId}) broken | NAVIGATION | DashboardPage.jsx |
| 5.7 | onNavigate('teamwall') no team ID | NAVIGATION | ParentDashboard.jsx |
| 5.8 | ParentChecklistWidget never rendered | DEAD-CODE | MainApp.jsx:44 |
| 5.9 | FloatingHelpButton overlaps FloatingChatButton | UX | ParentOnboarding.jsx |
| 5.12 | FloatingChatButton inflated unread count | UX | FloatingChatButton.jsx |
| 5.13 | BlastAlertChecker column mismatch | UX | BlastAlertChecker.jsx |
| A13 | TeamManager AttentionStrip props mismatch | UX | TeamManagerDashboard.jsx |

### LOW (13)

| # | Finding | Category | Location |
|---|---|---|---|
| 1.6 | Dead platform routes in RoutedContent | DEAD-CODE | MainApp.jsx:756-758 |
| 3.9 | playerName renders "undefined's" | UX | MainApp.jsx:722 |
| 3.10 | /stats/:playerId ignores URL params | NAVIGATION | MainApp.jsx:734 |
| 4.2b | src_backup/ still exists (11 dead files) | DEAD-CODE | src_backup/ |
| 4.10 | 5 unused vars in LynxSidebar | DEAD-CODE | LynxSidebar.jsx:108 |
| 5.10 | AddChildModal/ReRegisterModal unreachable | DEAD-CODE | ParentDashboard.jsx |
| 5.11 | WarmupTimerModal unreachable dead code | DEAD-CODE | CoachDashboard.jsx |
| 5.14 | BlastAlertChecker no polling | UX | BlastAlertChecker.jsx |
| A2 | MascotNudge "Not now" is no-op | UX | CoachDashboard.jsx |
| A9 | Player "Start Drill" is no-op | UX | PlayerDashboard.jsx |
| B5 | AddChildModal/ReRegisterModal unreachable | DEAD-CODE | ParentDashboard.jsx |
| C4 | SetupHelper/FloatingChatButton overlap | UX | Components |
| C7 | BlastAlertChecker no polling | UX | BlastAlertChecker.jsx |

### INFO (8)

| # | Finding | Category | Location |
|---|---|---|---|
| A10 | Player sidebar widgets always empty | UX | PlayerDashboard.jsx |
| A11 | PlayerChallengesTab always empty | UX | PlayerDashboard.jsx |
| C2 | FloatingChatButton renders for all roles | UX | MainApp.jsx |
| C5 | SetupHelper hides when complete | UX | SetupHelper.jsx |
| C8 | SpotlightOverlay targeting disabled | UX | ParentOnboarding.jsx |
| C13 | JourneyCelebrations confetti is placeholder | UX | JourneyCelebrations.jsx |
| C14 | JourneyCelebrations only badge type | UX | JourneyCelebrations.jsx |
| 3A-5b | Only first child's achievements shown | UX | MainApp.jsx:720 |

---

## Recommended Fix Plan

### Phase 0: Emergency Security (Immediate)
1. Add `reference/` to `.gitignore` and remove from git tracking
2. Add `isPlatformAdmin` guard to platform mode routing
3. Add RouteGuard to `/teams` and `/payments` routes
4. Fix `.gitignore` entry for `src_backup/`

### Phase 1: Dead Code Cleanup (~8,000-10,000 lines)
1. Delete `src/_archive/` directory and add to `.gitignore`
2. Delete `src/components/dashboard/` (entire directory)
3. Delete `src/components/coach/` (entire directory)
4. Delete `src/components/player/` (entire directory)
5. Delete widget system chain in `src/components/layout/`
6. Delete individual orphaned files (engagement, games, parent, pages)
7. Delete `src/pages/public/TeamWallPage.jsx` (1,132 lines)
8. Move/delete 110+ spec files from repo root

### Phase 2: Navigation Fixes
1. Fix `team-hub` vs `team-hubs` route ID mismatch
2. Fix `player-card-{id}` route pattern in ParentDashboard
3. Fix `onNavigate('teamwall')` calls to include team ID
4. Fix `loadRoleContext()` scope issue in RoutedContent
5. Remove dead platform routes from RoutedContent
6. Fix player `my-stuff` RouteGuard or create player profile route

### Phase 3: Prop & Component Fixes
1. Fix BodyTabs `key` -> `id` and `activeTab` -> `activeTabId` in PlayerDashboard and TeamManagerDashboard
2. Fix GiveShoutoutModal `visible` prop and `onSuccess` callback in CoachDashboard
3. Fix FloatingHelpButton no-op buttons
4. Fix FloatingHelpButton/FloatingChatButton overlap
5. Fix FloatingChatButton unread count filtering
6. Remove ParentChecklistWidget unused import
7. Remove WarmupTimerModal dead code

### Phase 4: Role Behavior
1. Add player channel filtering in ChatsPage
2. Add team-based event filtering in SchedulePage for parent/player
3. Fix `playerName` "undefined's" text
4. Fix `activeView` fallback rendering
5. Implement `playerSelf` lookup (requires DB schema change)

### Phase 5: Architecture
1. Conditionally load JourneyContext, ParentTutorialContext, OrgBrandingContext
2. Split monster files (SetupSectionContent, JerseysPage, GameComponents)
3. Verify BlastAlertChecker column name
4. Clean up unused variables in LynxSidebar
