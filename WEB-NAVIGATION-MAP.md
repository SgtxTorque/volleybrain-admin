# WEB-NAVIGATION-MAP.md — Lynx Web Admin Complete Navigation Map

**Date:** 2026-03-22 | **Routes:** 65 | **Nav Items:** 69 | **Roles:** 5

---

## Route Registry

Every route in the app with its component, file path, RouteGuard, and accessible roles.

### Org Mode Routes (RoutedContent)

| Route Path | Component | File | Guard | Accessible Roles |
|---|---|---|---|---|
| `/dashboard` | DashboardPage / CoachDashboard / TeamManagerDashboard / TeamManagerSetup / ParentDashboard / PlayerDashboard | Multiple (role-switched) | None | All (role-conditional rendering) |
| `/teams` | TeamsPage | `src/pages/teams/TeamsPage.jsx` | **NONE** | All (should be admin-only) |
| `/teams/:teamId` | TeamWallPage | `src/pages/teams/TeamWallPage.jsx` | None | All (team-scoped) |
| `/team-hubs` | TeamHubSelectorPage | `src/pages/teams/TeamHubSelectorPage.jsx` | admin | Admin only |
| `/coaches` | CoachesPage | `src/pages/coaches/CoachesPage.jsx` | admin, coach | Admin, Coach |
| `/staff` | StaffPage | `src/pages/staff/StaffPage.jsx` | admin | Admin only |
| `/registrations` | RegistrationsPage | `src/pages/registrations/RegistrationsPage.jsx` | admin | Admin only |
| `/jerseys` | JerseysPage | `src/pages/jerseys/JerseysPage.jsx` | admin | Admin only |
| `/schedule` | SchedulePage | `src/pages/schedule/SchedulePage.jsx` | None | All (multi-role) |
| `/schedule/availability` | CoachAvailabilityPage | `src/pages/schedule/CoachAvailabilityPage.jsx` | admin, coach | Admin, Coach |
| `/attendance` | AttendancePage | `src/pages/attendance/AttendancePage.jsx` | admin, coach, team_manager | Admin, Coach, TM |
| `/payments` | ParentPaymentsPage / PaymentsPage | Multiple (role-switched) | **NONE** | All (should scope by role) |
| `/gameprep` | GamePrepPage | `src/pages/gameprep/GamePrepPage.jsx` | admin, coach | Admin, Coach |
| `/standings` | TeamStandingsPage | `src/pages/standings/TeamStandingsPage.jsx` | None | All |
| `/leaderboards` | SeasonLeaderboardsPage | `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | None | All |
| `/chats` | ChatsPage | `src/pages/chats/ChatsPage.jsx` | None | All |
| `/blasts` | BlastsPage | `src/pages/blasts/BlastsPage.jsx` | admin, coach, team_manager | Admin, Coach, TM |
| `/notifications` | NotificationsPage | `src/pages/notifications/NotificationsPage.jsx` | admin | Admin only |
| `/reports` | ReportsPage | `src/pages/reports/ReportsPage.jsx` | admin | Admin only |
| `/reports/funnel` | RegistrationFunnelPage | `src/pages/reports/RegistrationFunnelPage.jsx` | admin | Admin only |
| `/archives` | SeasonArchivePage | `src/pages/archives/SeasonArchivePage.jsx` | None | All |
| `/directory` | OrgDirectoryPage | `src/pages/public/OrgDirectoryPage.jsx` | None | All |
| `/achievements` | AchievementsCatalogPage | `src/pages/achievements/AchievementsCatalogPage.jsx` | None | All |
| `/stats` | PlayerStatsPage | `src/pages/stats/PlayerStatsPage.jsx` | None | All |
| `/stats/:playerId` | PlayerStatsPage | `src/pages/stats/PlayerStatsPage.jsx` | None | All (param ignored) |
| `/roster` | RosterManagerPage | `src/pages/roster/RosterManagerPage.jsx` | admin, coach, team_manager | Admin, Coach, TM |
| `/admin/seasons` | SeasonManagementPage | `src/pages/admin/SeasonManagementPage.jsx` | admin | Admin only |
| `/admin/seasons/:seasonId` | SeasonManagementPage | `src/pages/admin/SeasonManagementPage.jsx` | admin | Admin only |
| `/settings/seasons` | SeasonsPage | `src/pages/settings/SeasonsPage.jsx` | admin | Admin only |
| `/settings/templates` | RegistrationTemplatesPage | `src/pages/settings/RegistrationTemplatesPage.jsx` | admin | Admin only |
| `/settings/waivers` | WaiversPage | `src/pages/settings/WaiversPage.jsx` | admin | Admin only |
| `/settings/payment-setup` | PaymentSetupPage | `src/pages/settings/PaymentSetupPage.jsx` | admin | Admin only |
| `/settings/organization` | OrganizationPage | `src/pages/settings/OrganizationPage.jsx` | admin | Admin only |
| `/settings/venues` | VenueManagerPage | `src/pages/settings/VenueManagerPage.jsx` | admin | Admin only |
| `/settings/data-export` | DataExportPage | `src/pages/settings/DataExportPage.jsx` | admin | Admin only |
| `/settings/subscription` | SubscriptionPage | `src/pages/settings/SubscriptionPage.jsx` | admin | Admin only |
| `/profile` | MyProfilePage | `src/pages/profile/MyProfilePage.jsx` | None | All |
| `/my-stuff` | MyStuffPage | `src/pages/parent/MyStuffPage.jsx` | **parent** | Parent only |
| `/parent/register` | ParentRegistrationHub | `src/pages/parent/ParentRegistrationHub.jsx` | parent | Parent only |
| `/parent/player/:playerId` | ParentPlayerCardPage | `src/pages/parent/ParentPlayerCardPage.jsx` | None | All (no ownership check) |
| `/parent/player/:playerId/profile` | PlayerProfilePage | `src/pages/parent/PlayerProfilePage.jsx` | None | All (no ownership check) |
| `/messages` | ParentMessagesPage | `src/pages/parent/ParentMessagesPage.jsx` | parent | Parent only |
| `/invite` | InviteFriendsPage | `src/pages/parent/InviteFriendsPage.jsx` | parent | Parent only |
| `/claim-account` | ClaimAccountPage | `src/pages/parent/ClaimAccountPage.jsx` | **NONE** | All |

### Platform Mode Routes (PlatformShell -- ALL UNGUARDED)

| Route Path | Component | File | Guard | Accessible Roles |
|---|---|---|---|---|
| `/platform/overview` | PlatformOverview | `src/pages/platform/PlatformOverview.jsx` | **NONE** | Any authenticated user |
| `/platform/organizations` | PlatformOrganizations | `src/pages/platform/PlatformOrganizations.jsx` | **NONE** | Any authenticated user |
| `/platform/organizations/:orgId` | PlatformOrgDetail | `src/pages/platform/PlatformOrgDetail.jsx` | **NONE** | Any authenticated user |
| `/platform/users` | PlatformUsersPage | `src/pages/platform/PlatformUsers.jsx` | **NONE** | Any authenticated user |
| `/platform/subscriptions` | PlatformSubscriptionsPage | `src/pages/platform/PlatformSubscriptionsPage.jsx` | **NONE** | Any authenticated user |
| `/platform/analytics` | PlatformAnalyticsPage | `src/pages/platform/PlatformAnalyticsPage.jsx` | **NONE** | Any authenticated user |
| `/platform/support` | PlatformSupport | `src/pages/platform/PlatformSupport.jsx` | **NONE** | Any authenticated user |
| `/platform/audit` | PlatformAuditLog | `src/pages/platform/PlatformAuditLog.jsx` | **NONE** | Any authenticated user |
| `/platform/settings` | PlatformSettings | `src/pages/platform/PlatformSettings.jsx` | **NONE** | Any authenticated user |
| `/platform/admin` | PlatformAdminPage | `src/pages/platform/PlatformAdminPage.jsx` | **NONE** | Any authenticated user |

### Public Routes (App.jsx -- no auth required)

| Route Path | Component | File |
|---|---|---|
| `/register/:orgIdOrSlug/:seasonId` | PublicRegistrationPage | `src/pages/public/PublicRegistrationPage.jsx` |

### Dead Routes (defined but never render)

| Route Path | Component | Reason |
|---|---|---|
| `/platform/admin` (RoutedContent) | PlatformAdminPage | appMode switches to PlatformShell first |
| `/platform/analytics` (RoutedContent) | PlatformAnalyticsPage | appMode switches to PlatformShell first |
| `/platform/subscriptions` (RoutedContent) | PlatformSubscriptionsPage | appMode switches to PlatformShell first |

---

## Sidebar Navigation Items (Per Role)

### Admin (28 items across 8 groups)

| Group | Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|---|
| **Overview** | Dashboard | `dashboard` | `/dashboard` | OK |
| **People** | Team Management | `teams` | `/teams` | OK |
| | Coach Directory | `coaches` | `/coaches` | OK |
| | Staff & Volunteers | `staff` | `/staff` | OK |
| **Operations** | Registrations | `registrations` | `/registrations` | OK |
| | Payment Admin | `payments` | `/payments` | OK |
| | Jersey Management | `jerseys` | `/jerseys` | OK |
| | Schedule | `schedule` | `/schedule` | OK |
| | Attendance & RSVP | `attendance` | `/attendance` | OK |
| | Coach Availability | `coach-availability` | `/schedule/availability` | OK |
| **Game Day** | Game Prep | `gameprep` | `/gameprep` | OK |
| | Standings | `standings` | `/standings` | OK |
| | Leaderboards | `leaderboards` | `/leaderboards` | OK |
| **Communication** | Chats | `chats` | `/chats` | OK |
| | Announcements | `blasts` | `/blasts` | OK |
| | Push Notifications | `notifications` | `/notifications` | OK |
| **Insights** | Reports & Analytics | `reports` | `/reports` | OK |
| | Registration Funnel | `registration-funnel` | `/reports/funnel` | OK |
| | Season Archives | `season-archives` | `/archives` | OK |
| | Org Directory | `org-directory` | `/directory` | OK |
| **Setup** | Season Management | `seasons` | `/settings/seasons` | OK |
| | Registration Forms | `templates` | `/settings/templates` | OK |
| | Waivers | `waivers` | `/settings/waivers` | OK |
| | Payment Setup | `paymentsetup` | `/settings/payment-setup` | OK |
| | Venues | `venues` | `/settings/venues` | OK |
| | Organization | `organization` | `/settings/organization` | OK |
| | Data Export | `data-export` | `/settings/data-export` | OK |
| | Subscription | `subscription` | `/settings/subscription` | OK |

### Coach (13 items across 6 groups)

| Group | Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|---|
| **Overview** | Dashboard | `dashboard` | `/dashboard` | OK |
| **My Teams** | (dynamic teams) | `teamwall-{id}` | `/teams/{id}` | OK |
| | Roster Manager | `roster` | `/roster` | OK |
| **Schedule** | Schedule | `schedule` | `/schedule` | OK |
| | Game Prep | `gameprep` | `/gameprep` | OK |
| | Attendance | `attendance` | `/attendance` | OK |
| **Competitions** | Standings | `standings` | `/standings` | OK |
| | Leaderboards | `leaderboards` | `/leaderboards` | OK |
| **Communication** | Team Chat | `chats` | `/chats` | OK |
| | Announcements | `blasts` | `/blasts` | OK |
| **More** | My Availability | `coach-availability` | `/schedule/availability` | OK |
| | Season Archives | `season-archives` | `/archives` | OK |
| | Org Directory | `org-directory` | `/directory` | OK |

### Parent (9 items across 5 groups)

| Group | Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|---|
| **Overview** | Home | `dashboard` | `/dashboard` | OK |
| **My Kids** | (dynamic children) | `player-{id}` | `/parent/player/{id}` | OK |
| **Actions** | Chat | `chats` | `/chats` | OK |
| | Team Hub | `team-hub` | **BROKEN** -- not in ROUTES | BROKEN |
| | Payments | `payments` | `/payments` | OK |
| | My Stuff | `my-stuff` | `/my-stuff` | OK |
| | Registration | `parent-register` | `/parent/register` | OK |
| **More** | Archives | `season-archives` | `/archives` | OK |
| | Directory | `org-directory` | `/directory` | OK |

### Player (7 items across 5 groups)

| Group | Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|---|
| **Overview** | Home | `dashboard` | `/dashboard` | OK |
| **My Team** | (dynamic teams) | `teamwall-{id}` | `/teams/{id}` | **EMPTY** (playerInfo null) |
| **Schedule** | Schedule | `schedule` | `/schedule` | OK |
| **Achievements** | Achievements | `achievements` | `/achievements` | OK |
| | My Stats | `stats` | `/stats` | OK |
| **Competitions** | Leaderboards | `leaderboards` | `/leaderboards` | OK |
| | Standings | `standings` | `/standings` | OK |
| **Profile** | Profile & Stats | `my-stuff` | `/my-stuff` | **BLOCKED** (parent guard) |

### Team Manager (12 items across 6 groups)

| Group | Nav Item | Nav ID | Resolves To | Status |
|---|---|---|---|---|
| **Overview** | Dashboard | `dashboard` | `/dashboard` | OK |
| **My Teams** | (dynamic teams) | `teamwall-{id}` | `/teams/{id}` | OK |
| | Roster Manager | `roster` | `/roster` | OK |
| **Operations** | Schedule | `schedule` | `/schedule` | OK |
| | Attendance | `attendance` | `/attendance` | OK |
| | Payments | `payments` | `/payments` | OK (sees admin PaymentsPage) |
| **Competitions** | Standings | `standings` | `/standings` | OK |
| | Leaderboards | `leaderboards` | `/leaderboards` | OK |
| **Communication** | Team Chat | `chats` | `/chats` | OK |
| | Announcements | `blasts` | `/blasts` | OK |
| **More** | Season Archives | `season-archives` | `/archives` | OK |
| | Org Directory | `org-directory` | `/directory` | OK |

---

## Orphaned Routes (exist but no nav item points to them)

| Route | Component | Guard | How Accessible |
|---|---|---|---|
| `/team-hubs` | TeamHubSelectorPage | admin | Direct URL only |
| `/messages` | ParentMessagesPage | parent | Direct URL only |
| `/invite` | InviteFriendsPage | parent | Direct URL only |
| `/claim-account` | ClaimAccountPage | None | Direct URL only |
| `/admin/seasons` | SeasonManagementPage | admin | Programmatic (from dashboard) |
| `/admin/seasons/:seasonId` | SeasonManagementPage | admin | Programmatic |
| `/profile` | MyProfilePage | None | Sidebar profile button |
| `/stats/:playerId` | PlayerStatsPage | None | Dynamic variant via links |
| `/parent/player/:playerId` | ParentPlayerCardPage | None | Dynamic via parent dashboard |
| `/parent/player/:playerId/profile` | PlayerProfilePage | None | Dynamic via parent dashboard |
| `/parent/register` | ParentRegistrationHub | parent | Parent nav item |
| `/platform/*` (10 routes) | Platform pages | **NONE** | Direct URL (security risk) |

## Missing Routes (nav items that point to non-existent destinations)

| Role | Nav Item | Nav ID | Expected Route | Actual Behavior |
|---|---|---|---|---|
| Parent | Team Hub | `team-hub` | `/team-hubs` (?) | Falls to `/dashboard` (not in ROUTES map) |
| Player | Profile & Stats | `my-stuff` | `/my-stuff` | Blocked by parent-only RouteGuard |
| Player | My Team (group) | `teamwall-{id}` | `/teams/{id}` | Always empty (playerInfo is null) |

---

## Role Access Matrix

Shows which role can access each page via the sidebar navigation (Nav), via direct URL (URL), or not at all (-).

| Page | Admin | Coach | TM | Parent | Player |
|---|---|---|---|---|---|
| Dashboard | Nav | Nav | Nav | Nav | Nav |
| Teams | Nav | - | - | - | - |
| Team Wall | Nav (via team) | Nav (via team) | Nav (via team) | URL only | - (empty nav) |
| Team Hub Selector | URL | - | - | - | - |
| Coaches | Nav | Nav | - | - | - |
| Staff | Nav | - | - | - | - |
| Registrations | Nav | - | - | - | - |
| Jerseys | Nav | - | - | - | - |
| Schedule | Nav | Nav | Nav | Nav* | Nav |
| Coach Availability | Nav | Nav | - | - | - |
| Attendance | Nav | Nav | Nav | - | - |
| Payments | Nav | URL** | Nav** | Nav | - |
| Game Prep | Nav | Nav | - | - | - |
| Standings | Nav | Nav | Nav | Nav* | Nav |
| Leaderboards | Nav | Nav | Nav | - | Nav |
| Chats | Nav | Nav | Nav | Nav | URL*** |
| Blasts | Nav | Nav | Nav | - | - |
| Notifications | Nav | - | - | - | - |
| Reports | Nav | - | - | - | - |
| Reg Funnel | Nav | - | - | - | - |
| Archives | Nav | Nav | Nav | Nav | - |
| Directory | Nav | Nav | Nav | Nav | - |
| Achievements | Nav* | - | - | Nav* | Nav |
| Stats | Nav* | - | - | - | Nav |
| Roster | Nav | Nav | Nav | - | - |
| Seasons (settings) | Nav | - | - | - | - |
| Templates | Nav | - | - | - | - |
| Waivers | Nav | - | - | - | - |
| Payment Setup | Nav | - | - | - | - |
| Organization | Nav | - | - | - | - |
| Venues | Nav | - | - | - | - |
| Data Export | Nav | - | - | - | - |
| Subscription | Nav | - | - | - | - |
| Profile | Sidebar | Sidebar | Sidebar | Sidebar | Sidebar |
| My Stuff | - | - | - | Nav | Blocked |
| Parent Register | - | - | - | Nav | - |
| Claim Account | URL | URL | URL | URL | URL |
| Messages | - | - | - | URL | - |
| Invite | - | - | - | URL | - |
| Platform (all) | URL**** | URL**** | URL**** | URL**** | URL**** |

**Legend:**
- Nav = Reachable via sidebar navigation
- URL = Reachable via direct URL only (no nav item)
- Blocked = Route exists but guard prevents access
- `-` = Not accessible
- `*` = With caveats (limited data, shows first child only, etc.)
- `**` = Sees full admin PaymentsPage (security concern)
- `***` = Sees ALL channels (security concern)
- `****` = SECURITY RISK: No platform admin check

---

## Route ID to URL Path Mapping

From `src/lib/routes.js`:

| Route ID | URL Path |
|---|---|
| `dashboard` | `/dashboard` |
| `teams` | `/teams` |
| `coaches` | `/coaches` |
| `staff` | `/staff` |
| `team-hubs` | `/team-hubs` |
| `registrations` | `/registrations` |
| `jerseys` | `/jerseys` |
| `schedule` | `/schedule` |
| `attendance` | `/attendance` |
| `payments` | `/payments` |
| `coach-availability` | `/schedule/availability` |
| `roster` | `/roster` |
| `gameprep` | `/gameprep` |
| `standings` | `/standings` |
| `leaderboards` | `/leaderboards` |
| `chats` | `/chats` |
| `blasts` | `/blasts` |
| `notifications` | `/notifications` |
| `reports` | `/reports` |
| `registration-funnel` | `/reports/funnel` |
| `season-archives` | `/archives` |
| `org-directory` | `/directory` |
| `season-management` | `/admin/seasons` |
| `seasons` | `/settings/seasons` |
| `templates` | `/settings/templates` |
| `waivers` | `/settings/waivers` |
| `paymentsetup` | `/settings/payment-setup` |
| `organization` | `/settings/organization` |
| `venues` | `/settings/venues` |
| `data-export` | `/settings/data-export` |
| `subscription` | `/settings/subscription` |
| `stats` | `/stats` |
| `achievements` | `/achievements` |
| `my-profile` | `/profile` |
| `messages` | `/messages` |
| `invite` | `/invite` |
| `my-stuff` | `/my-stuff` |
| `parent-register` | `/parent/register` |
| `claim-account` | `/claim-account` |
| `platform-overview` | `/platform/overview` |
| `platform-organizations` | `/platform/organizations` |
| `platform-users` | `/platform/users` |
| `platform-subscriptions` | `/platform/subscriptions` |
| `platform-analytics` | `/platform/analytics` |
| `platform-support` | `/platform/support` |
| `platform-audit` | `/platform/audit` |
| `platform-settings` | `/platform/settings` |
| `platform-admin` | `/platform/admin` |

### Dynamic Route Patterns

| Pattern | URL Generated | Handler |
|---|---|---|
| `player-{playerId}` | `/parent/player/{playerId}` | `getPathForPage` startsWith check |
| `player-profile-{playerId}` | `/parent/player/{playerId}/profile` | `getPathForPage` startsWith check |
| `teamwall-{teamId}` | `/teams/{teamId}` | `getPathForPage` startsWith check |
| `season-management` + params | `/admin/seasons/{seasonId}` | `getPathForPage` params check |

### Missing from ROUTES Map (used in nav but not defined)

| Nav ID | Used By | Expected Route | Actual Behavior |
|---|---|---|---|
| `team-hub` | Parent nav | Unknown | Falls to `/dashboard` |
