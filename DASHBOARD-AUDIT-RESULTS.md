# DASHBOARD-AUDIT-RESULTS.md
## Complete Codebase Audit — VolleyBrain Web Admin Portal
**Generated:** 2026-03-20
**Purpose:** Full inventory of dashboard components, hooks, routes, widgets, and data layer before v2 redesign.

---

## PHASE 1: Route Map

### Router Architecture

The app uses **react-router-dom v6** with a two-tier routing system:

1. **App.jsx** — Top-level router (public vs. authenticated)
2. **MainApp.jsx** — Authenticated routes with role-based rendering
3. **src/lib/routes.js** — Central route ↔ page ID mapping (187 lines)

### Public Routes (App.jsx)

| Path | Component | Auth Required | Status |
|------|-----------|---------------|--------|
| `/register/:orgIdOrSlug/:seasonId` | `PublicRegistrationPage` | No | Accessible |
| `/*` | `AuthenticatedApp` | Yes | Gate |

### Auth Flow (App.jsx)

- Unauthenticated: `LandingPage` → `LoginPage` (login/signup modes)
- Authenticated + needs onboarding: `SetupWizard`
- Authenticated: `MainApp`
- Wrapped in `ThemeProvider > AuthProvider > JourneyProvider`

### Platform Mode Routes (MainApp.jsx, lines 1110-1132)

| Path | Component | Guard | Status |
|------|-----------|-------|--------|
| `/platform/overview` | `PlatformOverview` | `isPlatformAdmin` | Accessible |
| `/platform/organizations/:orgId` | `PlatformOrgDetail` | `isPlatformAdmin` | Accessible |
| `/platform/organizations` | `PlatformOrganizations` | `isPlatformAdmin` | Accessible |
| `/platform/users` | `PlatformUsersPage` | `isPlatformAdmin` | Accessible |
| `/platform/subscriptions` | `PlatformSubscriptionsPage` | `isPlatformAdmin` | Accessible |
| `/platform/analytics` | `PlatformAnalyticsPage` | `isPlatformAdmin` | Accessible |
| `/platform/support` | `PlatformSupport` | `isPlatformAdmin` | Accessible |
| `/platform/audit` | `PlatformAuditLog` | `isPlatformAdmin` | Accessible |
| `/platform/settings` | `PlatformSettings` | `isPlatformAdmin` | Accessible |
| `/platform/admin` | `PlatformAdminPage` | `isPlatformAdmin` | Accessible |
| `/platform` | Redirect → `/platform/overview` | `isPlatformAdmin` | Redirect |

### Org Mode Routes (MainApp.jsx, lines 1135+)

All org-mode routes are wrapped in:
`OrgBrandingProvider > SportProvider > SeasonProvider > ParentTutorialProvider`

#### Role Guard: `RouteGuard` component (`src/components/auth/RouteGuard.jsx`)
- Props: `allow` (array of role strings), `activeView` (current role)
- If role not in `allow`, redirects to `/dashboard`

| Path | Component | Role Guard | Status |
|------|-----------|------------|--------|
| `/dashboard` | Role-based dashboard (see Phase 2) | None | Accessible |
| `/teams` | `TeamsPage` | None | Accessible |
| `/teams/:teamId` | `TeamWallPage` | None | Accessible |
| `/coaches` | `CoachesPage` | admin | Accessible |
| `/staff` | `StaffPage` | admin | Accessible |
| `/team-hubs` | `TeamHubsPage` | None | Accessible |
| `/registrations` | `RegistrationsPage` | admin | Accessible |
| `/jerseys` | `JerseysPage` | admin | Accessible |
| `/schedule` | `SchedulePage` | admin, coach, team_manager | Accessible |
| `/schedule/availability` | `CoachAvailabilityPage` | admin, coach | Accessible |
| `/attendance` | `AttendancePage` | admin, coach, team_manager | Accessible |
| `/payments` | `PaymentsPage` | admin, team_manager | Accessible |
| `/roster` | `RosterManagerPage` | admin, coach, team_manager | Accessible |
| `/gameprep` | `GamePrepPage` | admin, coach | Accessible |
| `/standings` | `TeamStandingsPage` | None | Accessible |
| `/leaderboards` | `SeasonLeaderboardsPage` | None | Accessible |
| `/chats` | `ChatsPage` | None | Accessible |
| `/blasts` | `BlastsPage` | admin, coach, team_manager | Accessible |
| `/notifications` | `NotificationsPage` | admin | Accessible |
| `/reports` | `ReportsPage` | admin | Accessible |
| `/reports/funnel` | `RegistrationFunnelPage` | admin | Accessible |
| `/archives` | `SeasonArchivePage` | None | Accessible |
| `/directory` | `OrgDirectoryPage` | None | Accessible |
| `/admin/seasons` | `SeasonManagementPage` | admin | Accessible |
| `/admin/seasons/:seasonId` | `SeasonManagementPage` | admin | Accessible |
| `/settings/seasons` | `SeasonsPage` | admin | Accessible |
| `/settings/templates` | `RegistrationTemplatesPage` | admin | Accessible |
| `/settings/waivers` | `WaiversPage` | admin | Accessible |
| `/settings/payment-setup` | `PaymentSetupPage` | admin | Accessible |
| `/settings/organization` | `OrganizationPage` | admin | Accessible |
| `/settings/venues` | `VenueManagerPage` | admin | Accessible |
| `/settings/data-export` | `DataExportPage` | admin | Accessible |
| `/settings/subscription` | `SubscriptionPage` | admin | Accessible |
| `/stats` | `PlayerStatsPage` | None | Accessible |
| `/achievements` | `AchievementsCatalog` | None | Accessible |
| `/profile` | `MyProfilePage` | None | Accessible |
| `/messages` | `ParentMessagesPage` | parent | **Stub (81 lines)** |
| `/invite` | `InviteFriendsPage` | parent | **Stub (84 lines)** |
| `/my-stuff` | `MyStuffPage` | parent | Accessible |
| `/parent/register` | `ParentRegistrationHub` | parent | Accessible |
| `/parent/player/:playerId` | `PlayerProfilePage` | parent | Accessible |
| `/parent/player/:playerId/profile` | `PlayerProfilePage` | parent | Accessible |
| `/claim-account` | `ClaimAccountPage` | None | Accessible |

### Dynamic Route Handling (src/lib/routes.js)

- `player-{id}` → `/parent/player/{id}`
- `player-profile-{id}` → `/parent/player/{id}/profile`
- `teamwall-{id}` → `/teams/{id}`
- `season-management` → `/admin/seasons` or `/admin/seasons/{seasonId}`

---

## PHASE 2: Dashboard Pages

### 2.1 Admin Dashboard — `DashboardPage.jsx`

**Path:** `src/pages/dashboard/DashboardPage.jsx`
**Line Count:** ~1,564 lines
**Route:** `/dashboard` (when `activeView === 'admin'`)

#### 2a. Layout Structure
- **Top-level:** `DashboardContainer` (max-width wrapper with padding)
- **Filter bar:** Season selector, Sport selector, Team filter (not in grid, always at top)
- **Empty state:** For brand-new organizations with no data
- **Widget grid:** `DashboardGridLayout` — 24-column react-grid-layout
- **Edit FAB:** `EditLayoutButton` floating action button at bottom

#### 2b. Components Rendered

| Component | File Path | Grid Position | Props | Conditional? |
|-----------|-----------|---------------|-------|-------------|
| `WelcomeBanner` | `components/shared/WelcomeBanner.jsx` | 0×0, 8w×4h | role, userName, isDark | No |
| `AdminNotificationsCard` | `components/dashboard/AdminNotificationsCard.jsx` | 10×0, 10w×4h | notifications, onNavigate | No |
| `OrgHealthHero` | `components/dashboard/OrgHealthHero.jsx` | 0×4, 8w×12h | stats, season, onNavigate | No |
| `AdminSetupTracker` | `components/dashboard/AdminSetupTracker.jsx` | 8×4, 5w×4h | stats, onNavigate | No |
| `CalendarStripCard` | `components/coach/CalendarStripCard.jsx` | 13×4, 4w×12h | events, onNavigate | No |
| `SeasonJourneyList` | `components/dashboard/SeasonJourneyList.jsx` | 17×4, 5w×17h | seasonJourney data | No |
| `OrgFinancials` | `components/dashboard/OrgFinancials.jsx` | 0×16, 8w×10h | monthlyPayments, stats | No |
| `AdminQuickActions` | `components/dashboard/AdminQuickActions.jsx` | 8×16, 8w×6h | onNavigate, stats | No |
| `PeopleComplianceRow` | `components/dashboard/PeopleComplianceRow.jsx` | 0×26, 8w×7h | stats | No |
| `OrgKpiRow` | `components/dashboard/OrgKpiRow.jsx` | 8×22, 5w×9h | stats | No |
| `AllTeamsTable` | `components/dashboard/AllTeamsTable.jsx` | 13×16, 6w×8h | teamsData, teamStats | No |

#### 2c. Data Fetching

**Context Hooks:**
- `useSeason()` — selectedSeason, seasons, allSeasons, selectSeason
- `useSport()` — selectedSport, selectSport
- `useTheme()` — isDark, accent colors
- `useOrgBranding()` — orgName, orgLogo

**Supabase Queries (in `loadDashboardData()`, ~400 lines):**

| Table | Operation | Purpose |
|-------|-----------|---------|
| `teams` | select | Fetch all teams with max_players, color |
| `team_players` | select (count) | Rostered player count per team |
| `players` | select | All players with registrations |
| `payments` | select | Financial summary by method & fee type |
| `schedule_events` | select | Upcoming events (limit 10, future only) |
| `player_season_stats` | select | Top 10 players by points |
| `team_coaches` | select (count) | Coach assignment counts |
| `waivers` + `waiver_signatures` | select | Unsigned waiver counts |
| `games` | select | Team win/loss records |
| `coach_challenges` | select | Engagement data |
| `shoutouts` | select | Engagement data |
| `team_posts` | select | Engagement data |

**Key State:**
- `stats` — aggregate KPIs (teams, payments, registrations, pending, pastDue, etc.)
- `upcomingEvents` — list of upcoming schedule_events
- `monthlyPayments` — time-series payment data for charts
- `teamsData` — all teams in season
- `teamStats` — per-team player counts & records
- `perSeasonTeamCounts`, `perSeasonPlayerCounts` — season journey data

#### 2d. Navigation
- `onNavigate()` prop → navigates to: registrations, payments, seasons, schedule, teams, coaches, waivers
- Team filter selector changes data scoping
- Season selector reloads all data

---

### 2.2 Coach Dashboard — `CoachDashboard.jsx`

**Path:** `src/pages/roles/CoachDashboard.jsx`
**Line Count:** ~881 lines
**Route:** `/dashboard` (when `activeView === 'coach'`)

#### 2a. Layout Structure
- **Top-level:** `DashboardContainer` with full-width scrollable content
- **Filter bar:** Season + Team selectors (progressive disclosure — only when multiple)
- **Widget grid:** `DashboardGridLayout` — 24-column with spacers/dividers
- **Edit FAB:** `EditLayoutButton`

#### 2b. Components Rendered

| Component | File Path | Grid Position | Props | Conditional? |
|-----------|-----------|---------------|-------|-------------|
| `WelcomeBanner` | `components/shared/WelcomeBanner.jsx` | 1×0, 8w×3h | role=coach, userName | No |
| `CoachTools` | `components/coach/CoachTools.jsx` | 1×3, 5w×7h | onNavigate, actions | No |
| `CoachActionItemsCard` | `components/coach/CoachActionItemsCard.jsx` | 7×0, 9w×4h | needsAttentionItems | No |
| `CoachHeroCarousel` | `components/coach/CoachHeroCarousel.jsx` | 7×4, 9w×12h | nextGame, nextEvent, checklistState | No |
| `CoachNotifications` | `components/coach/CoachNotifications.jsx` | 17×0, 6w×6h | notifications | No |
| `SquadRosterCard` | `components/coach/SquadRosterCard.jsx` | 1×10, 5w×9h | roster, selectedTeam | No |
| `AlsoThisWeekCard` | `components/coach/AlsoThisWeekCard.jsx` | 7×16, 20w×4h | upcomingEvents | No |
| `CalendarStripCard` | `components/coach/CalendarStripCard.jsx` | 7×20, 24w×10h | events | No |
| `TopPlayersCard` | `components/coach/TopPlayersCard.jsx` | 1×19, 20w×11h | topPlayers, roster | No |
| `ChallengesCard` | `components/coach/ChallengesCard.jsx` | 17×6, 27w×8h | activeChallenges | No |
| `AchievementsCard` | `components/coach/AchievementsCard.jsx` | 20×6, 27w×8h | achievements | No |

**Modals:**
- `EventDetailModal` — Event info popup
- `CoachBlastModal` — Send team announcement
- `WarmupTimerModal` — Countdown timer (5, 10, 15, 20 min presets)
- `PlayerCardExpanded` — Player detail view
- `GiveShoutoutModal` — Multi-step shoutout creation

#### 2c. Data Fetching

**Context Hooks:**
- `useAuth()` — profile, user
- `useSeason()` — selectedSeason, seasons, selectSeason
- `useSport()` — selectedSport
- `useTheme()` — isDark
- `roleContext.coachInfo.team_coaches` — assigned teams

**Supabase Queries:**

| Table | Operation | Purpose |
|-------|-----------|---------|
| `teams` | select | Coach's team assignments |
| `team_players` | select | Roster with player profiles |
| `schedule_events` | select | Upcoming events (today forward, limit 10) |
| `event_rsvps` | select | Event attendance counts |
| `player_season_stats` | select | Top 5 players by total_points |
| `shoutouts` | select | Weekly shoutout count (7 days) |
| `coach_challenges` | select | Active challenges with participants |
| `chat_channels` + `chat_messages` | select | Unread message count |
| `game_lineups` | select | Lineup tracking |
| `player_game_stats` | select | Individual game performance |

**Key State:**
- `teams` — coach-assigned teams
- `selectedTeam` — active team context
- `roster` — team roster with photos/jerseys
- `upcomingEvents` — schedule list
- `teamRecord` — {wins, losses, recentForm}
- `topPlayers` — top 5 season performers
- `activeChallenges` — team challenges with progress
- `needsAttentionItems` — pending stats, RSVPs, missing jerseys
- `checklistState` — auto-computed: lineupSet, rsvpsReviewed, statsEntered, reminderSent

#### 2d. Navigation
- `onNavigate()` → schedule, gameprep, teams, attendance, coaches, chats, registrations, payments
- Team selector switches `selectedTeam`
- Season selector (only if multiple seasons)

---

### 2.3 Parent Dashboard — `ParentDashboard.jsx`

**Path:** `src/pages/roles/ParentDashboard.jsx`
**Line Count:** ~659 lines
**Route:** `/dashboard` (when `activeView === 'parent'`)

#### 2a. Layout Structure
- **Top-level:** `DashboardContainer` with vertical spacing
- **Orphan banner:** Unclaimed player banner (conditional)
- **Filter bar:** Season + Player switcher (progressive disclosure)
- **Widget grid:** `DashboardGridLayout` — 23-column layout
- **Edit FAB:** `EditLayoutButton`

#### 2b. Components Rendered

| Component | File Path | Grid Position | Props | Conditional? |
|-----------|-----------|---------------|-------|-------------|
| `WelcomeBanner` | `components/shared/WelcomeBanner.jsx` | 0×0, 11w×4h | role=parent, userName | No |
| `ParentTopBanner` | `components/parent/ParentTopBanner.jsx` | 11×0, 11w×4h | alerts, openRegistrations, onboarding | No |
| `ActionRequired` (PriorityCards) | `components/parent/PriorityCardsEngine.jsx` | 0×5, 9w×7h | priorityItems | If items exist |
| `ParentChildHero` | `pages/roles/ParentChildHero.jsx` | 10×5, 8w×7h | child data, XP level | No |
| `EngagementProgressCard` | `components/parent/EngagementProgressCard.jsx` | 19×5, 4w×6h | level, XP progress | No |
| `AchievementsCard` (badges) | `components/coach/AchievementsCard.jsx` | 19×11, 4w×6h | badges grid (6 + overflow) | No |
| `NextEventCard` | `components/parent/NextEventCard.jsx` | 0×12, 9w×9h | next event detail | No |
| `CalendarStripCard` | `components/coach/CalendarStripCard.jsx` | 10×12, 8w×9h | events | No |
| `TeamHubCard` | inline | 19×17, 4w×9h | team wall link or empty | No |
| `QuickLinksCard` | `components/parent/QuickLinksCard.jsx` | 0×21, 4w×9h | navigation links (12 shortcuts) | No |
| `BalanceDueCard` | inline | 5×21, 4w×8h | payment status | No |
| `SeasonRecordCard` | `components/parent/SeasonRecordCard.jsx` | 10×21, 4w×8h | team W-L record | No |
| `GiveShoutoutCard` | `components/shared/GiveShoutoutCard.jsx` | 14×21, 4w×8h | shoutout CTA | No |
| `ChatPreviewCard` | `components/shared/ChatPreviewCard.jsx` | 19×26, 4w×8h | chat preview | No |

**Modals:**
- `EventDetailModal` — Event info
- `PaymentOptionsModal` — Payment UI
- `AddChildModal` — Add linked player
- `ReRegisterModal` — Season re-registration
- `AlertDetailModal` — Alert detail
- `ActionItemsSidebar` — Slide-out action items panel
- `QuickRsvpModal` — Quick RSVP popup

#### 2c. Data Fetching

**Context Hooks:**
- `useAuth()` — profile
- `useOrgBranding()` — orgName
- `useSport()` — selectedSport
- `useTheme()` — isDark
- `useParentTutorial()` — checklist tracking
- `usePriorityItems()` — scans for action items

**Supabase Queries:**

| Table | Operation | Purpose |
|-------|-----------|---------|
| `players` | select | Children with team_players, seasons |
| `teams` | select | Team info for each child |
| `schedule_events` | select | Upcoming events (future, limit 10) |
| `payments` | select | Unpaid fees per child |
| `announcements` | select | Org-wide alerts (active, desc) |
| `player_achievements` | select | Badges per child (limit 8) |
| `xp_ledger` | select | Total XP for level calculation |
| `seasons` | select | Open seasons for registration prompts |

**Key State:**
- `registrationData` — child players with team, registration, season
- `teams` — unique teams from children
- `upcomingEvents` — filtered to active child's team
- `paymentSummary` — {totalDue, totalPaid, unpaidItems}
- `childAchievements` — badges for active child
- `teamRecord` — {wins, losses, lastResult}
- `xpData` — {level, currentXp, xpToNext}
- `activeChildIdx` — selected child index
- `alerts` — org announcements

#### 2d. Navigation
- `onNavigate()` → achievements, waivers, chats, schedule, standings, leaderboards, etc.
- Season switcher (if multiple seasons)
- Child switcher (if multiple children)
- Priority actions trigger modals

---

### 2.4 Player Dashboard — `PlayerDashboard.jsx`

**Path:** `src/pages/roles/PlayerDashboard.jsx`
**Line Count:** ~374 lines
**Route:** `/dashboard` (when `activeView === 'player'`)

#### 2a. Layout Structure
- **Top-level:** Dark background container (`bg-#0D1B3E`), overflow-y-auto
- **Admin preview banner** (if admin is previewing a player)
- **Multi-team selector** (if on multiple teams)
- **Widget grid:** `DashboardGridLayout` — 24-column, always dark theme

#### 2b. Components Rendered

| Component | File Path | Grid Position | Props | Conditional? |
|-----------|-----------|---------------|-------|-------------|
| `PlayerHeroCard` | `components/player/PlayerHeroCard.jsx` | 0×0, 14w×10h | player profile, name, OVR, XP | No |
| `TrophyCaseCard` | `components/player/TrophyCaseCard.jsx` | 14×0, 10w×10h | achievement showcase | No |
| `StreakWidget` | inline | 0×10, 14w×3h | streak days | If streak >= 2 |
| `ScoutingReportCard` | `components/player/ScoutingReportCard.jsx` | 14×y, 10w×14h | coach eval + skill ratings | No |
| `NextEventCard` | `components/parent/NextEventCard.jsx` | 0×y, 14w×6h | next game/practice | If events exist |
| `ShoutoutWidget` | inline | 0×y, 14w×4h | recent shoutout | If shoutout exists |
| `TodayXpCard` | inline | 0×y, 7w×5h | daily XP earned | No |
| `LastGameCard` | `components/player/LastGameCard.jsx` | 7×y, 7w×5h | previous game stats | No |
| `TeamChatCard` | inline | 0×y, 7w×3h | team chat link | No |
| `DailyChallengeCard` | `components/player/DailyChallengeCard.jsx` | 7×y, 7w×5h | active challenge | No |

**Admin Preview Mode:**
- `AdminPlayerSelector` modal — search & select any player on the team
- "Viewing as {name}" banner with "Switch Player" button

#### 2c. Data Fetching

**Supabase Queries:**

| Table | Operation | Purpose |
|-------|-----------|---------|
| `players` | select | Player profile with team_players, jerseys, positions |
| `team_players` | select | Teams joined |
| `player_season_stats` | select | Season totals (kills, aces, digs, blocks, assists, points) |
| `game_player_stats` | select | Individual game performance (limit 5 most recent) |
| `player_skill_ratings` | select | Coach skill eval (most recent) |
| `schedule_events` | select | Upcoming events (future, limit 5) |
| `player_achievements` | select | Badges earned |

**Key State:**
- `playerData` — player profile with teams
- `seasonStats` — season aggregates
- `gameStats` — recent 5 games
- `badges` — achievements list
- `upcomingEvents` — next 5 events
- `rankings` — per-stat rank positions
- `skillRatings` — coach eval data
- `overallRating` — computed score (40-99)
- `level` — computed from XP
- `xpProgress` — % to next level

#### 2d. Navigation
- `onNavigate('chats')` — team chat
- Team selector (if on multiple teams)

---

### 2.5 Team Manager Dashboard — `TeamManagerDashboard.jsx`

**Path:** `src/pages/roles/TeamManagerDashboard.jsx`
**Line Count:** ~440 lines
**Route:** `/dashboard` (when `activeView === 'team_manager'`)

#### 2a. Layout Structure
- **Top-level:** `DashboardContainer` with vertical spacing
- **Layout:** 2-column grid (1fr + 340px right sidebar)
- **NO widget grid** — fixed card positions, not draggable

#### 2b. Components Rendered

| Component | Location | Props | Notes |
|-----------|----------|-------|-------|
| Getting Started Checklist | inline | 4 steps with checkmarks | Dismissible via localStorage |
| Team Identity Bar | inline | team name, color, player count | Refresh button |
| PaymentHealthCard | left column, inline | overdueCount, pendingCount, collectedAmount | From `useTeamManagerData` |
| RsvpSummaryCard | left column, inline | next event RSVP progress | From `useTeamManagerData` |
| RosterStatusCard | left column, inline | roster fill %, capacity | From `useTeamManagerData` |
| Quick Actions (6 buttons) | right column, 2-col grid | Attendance, Send Blast, Schedule, Team Chat, Payments, Invite Code | 6 action buttons |
| Upcoming Events | right column | 3-event preview | From `useTeamManagerData` |

**Modals:**
- `InviteCodeModal` — Share team invite code

#### 2c. Data Fetching

Uses dedicated hook: `useTeamManagerData(teamId)` from `src/hooks/useTeamManagerData.js`

**Supabase Queries (via hook):**

| Table | Operation | Purpose |
|-------|-----------|---------|
| `payments` | select | Payment health (overdue, pending, paid) |
| `team_players` | select | Active roster for player ID scoping |
| `schedule_events` | select | Upcoming events (limit 5) |
| `event_rsvps` | select | RSVP status for next event |
| `teams` | select | Team info (max_players, color) |
| `players` | select (count) | Pending registrations |

**Key State (from hook):**
- `paymentHealth` — {overdueCount, overdueAmount, pendingCount, collectedAmount}
- `nextEventRsvp` — {eventType, title, eventDate, confirmed, maybe, declined, noResponse}
- `registrationStatus` — {capacity, filled, isOpen, pendingCount}
- `rosterCount` — number of players
- `upcomingEvents` — next 5 events

#### 2d. Navigation
- `onNavigate()` → roster, schedule, payments, attendance, blasts, chats
- Quick action buttons trigger navigation or modal

---

### 2.6 DashboardWidgetsExample.jsx (Reference Only)

**Path:** `src/pages/dashboard/DashboardWidgetsExample.jsx`
**Line Count:** ~201 lines
**Status:** Reference/example file — NOT a live dashboard
**Purpose:** Demonstrates how to import and arrange widget components by role

---

## PHASE 3: Widget/Component Inventory

### Admin Dashboard Components (`src/components/dashboard/`)

| Component | Path | Description | Data Source | Tables | Interactive | Role | State | Lines |
|-----------|------|-------------|------------|--------|-------------|------|-------|-------|
| `AdminActionChecklist` | `dashboard/AdminActionChecklist.jsx` | Onboarding checklist with checkable steps | Props: stats | None directly | Checkmarks | Admin | Functional | ~80 |
| `AdminNotificationsCard` | `dashboard/AdminNotificationsCard.jsx` | Notification feed with dismiss/read | Props: notifications, onNavigate | None directly | Dismiss, navigate | Admin | Functional | ~120 |
| `AdminQuickActions` | `dashboard/AdminQuickActions.jsx` | 2×2 grid of quick action buttons | Props: onNavigate, stats | None directly | Navigate buttons | Admin | Functional | ~100 |
| `AdminSetupTracker` | `dashboard/AdminSetupTracker.jsx` | Setup progress checklist with % | Props: stats, onNavigate | None directly | Navigate to incomplete items | Admin | Functional | ~130 |
| `AllTeamsTable` | `dashboard/AllTeamsTable.jsx` | Data table of all teams with player counts | Props: teamsData, teamStats | None directly | Row click → team detail | Admin | Functional | ~150 |
| `DashboardFilterCard` | `dashboard/DashboardFilterCard.jsx` | Season/Sport/Team filter dropdowns | Context: Season, Sport | None directly | Filter selectors | Admin | Functional | ~90 |
| `LiveActivity` | `dashboard/LiveActivity.jsx` | Real-time activity feed | Props: recentActivity | None directly | Scrollable feed | Admin | Functional | ~80 |
| `OrgActionItems` | `dashboard/OrgActionItems.jsx` | Action items needing attention | Props: stats, onNavigate | None directly | Navigate to items | Admin | Functional | ~100 |
| `OrgFinancials` | `dashboard/OrgFinancials.jsx` | Financial data visualization (collections bar, breakdown) | Props: monthlyPayments, stats | None directly | None | Admin | Functional | ~200 |
| `OrgHealthHero` | `dashboard/OrgHealthHero.jsx` | Organization health score + KPI grid | Props: stats, season, onNavigate | None directly | Navigate to detail | Admin | Functional | ~250 |
| `OrgKpiRow` | `dashboard/OrgKpiRow.jsx` | KPI metric cards row | Props: stats | None directly | None | Admin | Functional | ~80 |
| `OrgSidebar` | `dashboard/OrgSidebar.jsx` | Legacy org sidebar (org card + journey + attention + actions) | Props: stats, onNavigate | None directly | Quick actions, navigate | Admin | **Legacy/Unused** | ~200 |
| `OrgUpcomingEvents` | `dashboard/OrgUpcomingEvents.jsx` | Upcoming events list | Props: events, onNavigate | None directly | Click event | Admin | Functional | ~100 |
| `OrgWallPreview` | `dashboard/OrgWallPreview.jsx` | Organization wall/feed preview | Props: posts | None directly | View post | Admin | Functional | ~100 |
| `PaymentSummaryCard` | `dashboard/PaymentSummaryCard.jsx` | Payment summary metrics | Props: stats | None directly | None | Admin | Functional | ~80 |
| `PeopleComplianceRow` | `dashboard/PeopleComplianceRow.jsx` | HR/compliance stat cards | Props: stats | None directly | None | Admin | Functional | ~100 |
| `PlaceholderWidget` | `dashboard/PlaceholderWidget.jsx` | Generic placeholder for unbuilt widgets | Props: label | None | None | Any | Placeholder | ~30 |
| `RegistrationStatsCard` | `dashboard/RegistrationStatsCard.jsx` | Registration funnel metrics | Props: stats | None directly | None | Admin | Functional | ~80 |
| `SeasonJourneyList` | `dashboard/SeasonJourneyList.jsx` | Season progression timeline | Props: seasonJourney data | None directly | None | Admin | Functional | ~150 |
| `SeasonJourneyRow` | `dashboard/SeasonJourneyRow.jsx` | Single season row in journey list | Props: season data | None directly | None | Admin | Functional | ~60 |
| `TeamSnapshot` | `dashboard/TeamSnapshot.jsx` | Team snapshot card | Props: team data | None directly | Click → team | Admin | Functional | ~80 |
| `UpcomingEventsCard` | `dashboard/UpcomingEventsCard.jsx` | Compact events card | Props: events | None directly | Click event | Admin | Functional | ~80 |

### Coach Components (`src/components/coach/`)

| Component | Path | Description | Data Source | Tables | Role | State | Lines |
|-----------|------|-------------|------------|--------|------|-------|-------|
| `AchievementsCard` | `coach/AchievementsCard.jsx` | Team achievements grid | Props: badges | player_achievements | Coach, Parent | Functional | ~100 |
| `AlsoThisWeekCard` | `coach/AlsoThisWeekCard.jsx` | Week overview of upcoming events | Props: events | None directly | Coach | Functional | ~80 |
| `CalendarStripCard` | `coach/CalendarStripCard.jsx` | Mini horizontal calendar with event dots | Props: events, onNavigate | None directly | Coach, Parent, Admin | Functional | ~200 |
| `ChallengesCard` | `coach/ChallengesCard.jsx` | Active challenges list with progress bars | Props: challenges | coach_challenges | Coach | Functional | ~150 |
| `CoachActionItems` | `coach/CoachActionItems.jsx` | Coach action items list | Props: items | None directly | Coach | Functional | ~80 |
| `CoachActionItemsCard` | `coach/CoachActionItemsCard.jsx` | Card wrapper for action items | Props: needsAttentionItems | None directly | Coach | Functional | ~100 |
| `CoachCenterDashboard` | `coach/CoachCenterDashboard.jsx` | Legacy center column layout | Props: various | None directly | Coach | **Legacy** | ~200 |
| `CoachCommandStrip` | `coach/CoachCommandStrip.jsx` | Command strip bar | Props: actions | None directly | Coach | Functional | ~80 |
| `CoachGameDayHero` | `coach/CoachGameDayHero.jsx` | Game day hero card (v1) | Props: nextGame | None directly | Coach | **Superseded by V2** | ~150 |
| `CoachGameDayHeroV2` | `coach/CoachGameDayHeroV2.jsx` | Game day hero card (v2) | Props: nextGame, checklist | None directly | Coach | Functional | ~200 |
| `CoachHeroCarousel` | `coach/CoachHeroCarousel.jsx` | Rotating hero (game day → practice → idle) | Props: nextGame, nextEvent | None directly | Coach | Functional | ~250 |
| `CoachJourneyTracker` | `coach/CoachJourneyTracker.jsx` | Coach journey/progress tracker | Props: journey data | None directly | Coach | Functional | ~100 |
| `CoachLeftSidebar` | `coach/CoachLeftSidebar.jsx` | Legacy coach sidebar | Props: stats, roster | None directly | Coach | **Legacy/Unused** | ~300 |
| `CoachNotifications` | `coach/CoachNotifications.jsx` | Coach notification feed | Props: notifications | None directly | Coach | Functional | ~100 |
| `CoachPerformanceGrid` | `coach/CoachPerformanceGrid.jsx` | Performance stat grid | Props: stats | None directly | Coach | Functional | ~100 |
| `CoachRosterPanel` | `coach/CoachRosterPanel.jsx` | Roster panel for coach | Props: roster | None directly | Coach | Functional | ~120 |
| `CoachScheduleCard` | `coach/CoachScheduleCard.jsx` | Schedule preview card | Props: events | None directly | Coach | Functional | ~100 |
| `CoachSeasonJourneyCard` | `coach/CoachSeasonJourneyCard.jsx` | Season journey tracking | Props: journey | None directly | Coach | Functional | ~100 |
| `CoachStatMiniCards` | `coach/CoachStatMiniCards.jsx` | Mini stat cards | Props: stats | None directly | Coach | Functional | ~80 |
| `CoachTools` | `coach/CoachTools.jsx` | Quick action toolbar | Props: onAction callbacks | None directly | Coach | Functional | ~120 |
| `CoachWorkflowButtons` | `coach/CoachWorkflowButtons.jsx` | Workflow action buttons | Props: actions | None directly | Coach | Functional | ~80 |
| `GameDayChecklist` | `coach/GameDayChecklist.jsx` | Pre-game checklist | Props: checklistState | None directly | Coach | Functional | ~100 |
| `GameDayJourneyCard` | `coach/GameDayJourneyCard.jsx` | Game day journey tracker | Props: journey | None directly | Coach | Functional | ~80 |
| `IdleHeroCard` | `coach/IdleHeroCard.jsx` | No-events hero state | Props: onNavigate | None directly | Coach | Functional | ~60 |
| `PracticeHeroCard` | `coach/PracticeHeroCard.jsx` | Practice-day hero | Props: event | None directly | Coach | Functional | ~100 |
| `RotatingPanel` | `coach/RotatingPanel.jsx` | Auto-rotating content panel | Props: children, interval | None directly | Coach | Functional | ~60 |
| `SeasonSetupHeroCard` | `coach/SeasonSetupHeroCard.jsx` | Season setup hero | Props: onNavigate | None directly | Coach | Functional | ~80 |
| `SquadRosterCard` | `coach/SquadRosterCard.jsx` | Team roster card with avatars | Props: roster, selectedTeam | None directly | Coach | Functional | ~150 |
| `TeamHealthCard` | `coach/TeamHealthCard.jsx` | Team health metrics | Props: health data | None directly | Coach | Functional | ~100 |
| `TeamReadinessCard` | `coach/TeamReadinessCard.jsx` | Team readiness score | Props: readiness data | None directly | Coach | Functional | ~100 |
| `TeamWallPreviewCard` | `coach/TeamWallPreviewCard.jsx` | Team wall feed preview | Props: posts | None directly | Coach | Functional | ~100 |
| `TopPlayersCard` | `coach/TopPlayersCard.jsx` | Top performers leaderboard | Props: topPlayers, roster | None directly | Coach | Functional | ~150 |

### Parent Components (`src/components/parent/`)

| Component | Path | Description | Data Source | Tables | Role | State | Lines |
|-----------|------|-------------|------------|--------|------|-------|-------|
| `ActionItemsSidebar` | `parent/ActionItemsSidebar.jsx` | Slide-out sidebar for action items | Props: items, onAction | None directly | Parent | Functional | ~150 |
| `EngagementProgressCard` | `parent/EngagementProgressCard.jsx` | XP level + progress bar | Props: level, xp, xpProgress | None directly | Parent | Functional | ~80 |
| `NextEventCard` | `parent/NextEventCard.jsx` | Hero card with sport-specific bg, auto-rotates between game/practice | Props: event, events, onNavigate, onRsvp | None directly | Parent, Player | Functional | ~205 |
| `ParentCenterDashboard` | `parent/ParentCenterDashboard.jsx` | Legacy center column layout | Props: various | None directly | Parent | **Legacy** | ~200 |
| `ParentEventCard` | `parent/ParentEventCard.jsx` | Event card for parent view | Props: event | None directly | Parent | Functional | ~80 |
| `ParentHeroCard` | `parent/ParentHeroCard.jsx` | Parent hero identity card | Props: profile | None directly | Parent | Functional | ~100 |
| `ParentJourneyCard` | `parent/ParentJourneyCard.jsx` | Parent onboarding journey tracker | Props: journey | None directly | Parent | Functional | ~80 |
| `ParentLeftSidebar` | `parent/ParentLeftSidebar.jsx` | Legacy parent sidebar | Props: stats, children | None directly | Parent | **Legacy/Unused** | ~310 |
| `ParentOnboarding` | `parent/ParentOnboarding.jsx` | Spotlight overlay + checklist + help button | Context: ParentTutorial | None directly | Parent | Functional | ~200 |
| `ParentRightPanel` | `parent/ParentRightPanel.jsx` | Legacy right panel | Props: various | None directly | Parent | **Legacy** | ~150 |
| `ParentTopBanner` | `parent/ParentTopBanner.jsx` | Alert/registration/onboarding banner | Props: alerts, registrations | None directly | Parent | Functional | ~150 |
| `PriorityCardsEngine` | `parent/PriorityCardsEngine.jsx` | Scans for action items (payments, waivers, RSVPs, games) | Hook + Supabase | payments, waivers, waiver_signatures, schedule_events, event_rsvps | Parent | Functional | ~300 |
| `QuickLinksCard` | `parent/QuickLinksCard.jsx` | 2×6 navigation grid (12 shortcuts) | Static LINKS array | None | Parent | Functional | ~63 |
| `SeasonRecordCard` | `parent/SeasonRecordCard.jsx` | Big W/L display with last game | Props: selectedTeam._record | None directly | Parent | Functional | ~45 |

### Player Components (`src/components/player/`)

| Component | Path | Description | Data Source | Tables | Role | State | Lines |
|-----------|------|-------------|------------|--------|------|-------|-------|
| `DailyChallengeCard` | `player/DailyChallengeCard.jsx` | Active challenge with progress | Props: challenge | None directly | Player | Functional | ~80 |
| `LastGameCard` | `player/LastGameCard.jsx` | Previous game stat summary | Props: gameStats | None directly | Player | Functional | ~100 |
| `PlayerCenterFeed` | `player/PlayerCenterFeed.jsx` | Legacy player center feed | Props: various | event_rsvps | Player | **Legacy** | ~200 |
| `PlayerHeroCard` | `player/PlayerHeroCard.jsx` | Dark hero: name huge, OVR badge, XP bar, tier | Props: viewingPlayer, level, xp, overallRating | None directly | Player | Functional | ~95 |
| `PlayerProfileSidebar` | `player/PlayerProfileSidebar.jsx` | Player profile sidebar (parent viewing child) | Props: player, stats | None directly | Parent | Functional | ~260 |
| `PlayerSocialPanel` | `player/PlayerSocialPanel.jsx` | Social/feed panel for player | Props: various | None directly | Player | **Legacy** | ~150 |
| `ScoutingReportCard` | `player/ScoutingReportCard.jsx` | Coach evaluation + skill ratings | Props: skillRatings, overallRating | None directly | Player | Functional | ~180 |
| `TrophyCaseCard` | `player/TrophyCaseCard.jsx` | Achievement showcase grid | Props: badges | None directly | Player | Functional | ~120 |

### Shared Components (`src/components/shared/`)

| Component | Path | Description | Data Source | Tables | Role | State | Lines |
|-----------|------|-------------|------------|--------|------|-------|-------|
| `ChatPreviewCard` | `shared/ChatPreviewCard.jsx` | Chat preview widget for dashboards | Props: selectedTeam | chat_channels, chat_messages | Parent, Player | Functional | ~120 |
| `GiveShoutoutCard` | `shared/GiveShoutoutCard.jsx` | Compact shoutout sending widget | Props: selectedTeam | team_players, shoutout_categories | Coach, Parent | Functional | ~215 |
| `WelcomeBanner` | `shared/WelcomeBanner.jsx` | Role-specific welcome greeting | Props: role, userName, isDark | None | All | Functional | ~60 |

### Layout Components (`src/components/layout/`)

| Component | Path | Description | Role | State | Lines |
|-----------|------|-------------|------|-------|-------|
| `AdminLeftSidebar` | `layout/AdminLeftSidebar.jsx` | Org identity + stats + attention + quick actions | Admin | **Legacy/Unused in main layout** | ~253 |
| `BlastAlertChecker` | `layout/BlastAlertChecker.jsx` | Checks for unread blast alerts | All | Functional | ~80 |
| `DashboardContainer` | `layout/DashboardContainer.jsx` | Max-width wrapper with padding | All | Functional | ~30 |
| `DashboardGrid` | `layout/DashboardGrid.jsx` | react-grid-layout drag-and-drop grid (24-col, 20px row) | All | Functional | ~300 |
| `DashboardGrids` | `layout/DashboardGrids.jsx` | Standard responsive grid layouts (HeroGrid, TwoColGrid, etc.) | All | Functional | ~50 |
| `DashboardLayout` | `layout/DashboardLayout.jsx` | Dashboard layout wrapper | All | Functional | ~40 |
| `EditLayoutButton` | `layout/EditLayoutButton.jsx` | FAB for toggling edit mode | All | Functional | ~40 |
| `FloatingChatButton` | `layout/FloatingChatButton.jsx` | Floating chat action button | All | Functional | ~50 |
| `HeaderComponents` | `layout/HeaderComponents.jsx` | Season/Sport/Coach Team/Child selectors | All | Functional | ~300 |
| `JourneyCelebrations` | `layout/JourneyCelebrations.jsx` | Journey milestone celebrations | All | Functional | ~80 |
| `LiveActivitySidebar` | `layout/LiveActivitySidebar.jsx` | Live activity feed sidebar | Admin | Functional | ~100 |
| `LynxSidebar` | `layout/LynxSidebar.jsx` | **PRIMARY SIDEBAR** — collapsible nav (64px → 228px) | All | Functional | ~400 |
| `NavIcon` | `layout/NavIcon.jsx` | Icon resolver for sidebar nav items | All | Functional | ~60 |
| `SidebarHelpers` | `layout/SidebarHelpers.jsx` | Theme toggle, accent picker, jersey badge | All | Functional | ~120 |
| `SpacerWidget` | `layout/SpacerWidget.jsx` | Visual spacer/divider for grid layouts | All | Functional | ~20 |
| `WidgetLibraryPanel` | `layout/WidgetLibraryPanel.jsx` | Slide-out panel for adding widgets | All | Functional | ~150 |
| `widgetComponents` | `layout/widgetComponents.jsx` | Widget key → component resolver (componentMap) | All | Functional | ~168 |

---

## PHASE 4: Hooks and Data Layer

### Custom Hooks

#### `useAppNavigate` — `src/hooks/useAppNavigate.js` (55 lines)
- **Purpose:** Drop-in replacement for old `setPage()` — maps page IDs to URL paths
- **Tables:** None
- **Parameters:** None (reads from react-router)
- **Returns:** `appNavigate(pageId, item?)` callback
- **Consumers:** MainApp.jsx, all dashboard pages
- **Real-time:** No
- **Error handling:** Falls back to `/dashboard`

#### `useCurrentPageId` — `src/hooks/useAppNavigate.js` (inline)
- **Purpose:** Get current page ID from URL (for nav highlighting)
- **Tables:** None
- **Parameters:** None
- **Returns:** page ID string
- **Consumers:** MainApp.jsx (nav highlighting)

#### `useDocumentTitle` — `src/hooks/useAppNavigate.js` (inline)
- **Purpose:** Update document.title based on current route
- **Tables:** None
- **Parameters:** None
- **Returns:** Nothing (side effect only)
- **Consumers:** MainApp.jsx

#### `useTeamManagerData` — `src/hooks/useTeamManagerData.js` (143 lines)
- **Purpose:** Fetches operational data for Team Manager dashboard
- **Tables:** `payments`, `team_players`, `schedule_events`, `event_rsvps`, `teams`, `players`
- **Parameters:** `teamId`
- **Returns:** `{ paymentHealth, nextEventRsvp, registrationStatus, rosterCount, upcomingEvents, loading, refresh }`
- **Consumers:** `TeamManagerDashboard.jsx`
- **Real-time:** No (manual refresh via `refresh()`)
- **Error handling:** try/catch with console.error, graceful degradation

### Context Hooks (used by dashboards)

#### `useAuth` — `src/contexts/AuthContext.jsx`
- **Tables:** `profiles`, `user_roles`, `organizations`
- **Returns:** `{ user, profile, organization, isAdmin, loading, needsOnboarding, completeOnboarding, signOut }`
- **Consumers:** All pages
- **Real-time:** No
- **Critical:** YES — if this breaks, everything breaks

#### `useSeason` — `src/contexts/SeasonContext.jsx`
- **Tables:** `seasons`
- **Returns:** `{ seasons, allSeasons, selectedSeason, selectSeason, loading }`
- **Consumers:** Most pages (data filtering)
- **Real-time:** No
- **Storage:** React state (NOT URL-based), persisted to localStorage
- **Critical:** YES — most queries depend on selectedSeason

#### `useSport` — `src/contexts/SportContext.jsx`
- **Tables:** `sports`
- **Returns:** `{ sports, selectedSport, selectSport, loading }`
- **Consumers:** Admin dashboard, schedule pages
- **Real-time:** No
- **Storage:** React state, persisted to localStorage

#### `useTheme` — `src/contexts/ThemeContext.jsx`
- **Tables:** None
- **Returns:** `{ isDark, accent, colors, changeAccent, toggleTheme, useThemeClasses }`
- **Consumers:** All components
- **Critical:** YES — controls all styling

#### `useOrgBranding` — `src/contexts/OrgBrandingContext.jsx`
- **Tables:** None (reads from AuthContext organization.settings)
- **Returns:** `{ orgName, orgLogo, orgColors, orgTagline, orgBanner, hasCustomBranding, getAccentStyles }`
- **Consumers:** Dashboards, sidebars, headers

#### `useParentTutorial` — `src/contexts/ParentTutorialContext.jsx`
- **Tables:** None (localStorage-based)
- **Returns:** `{ checklist, markComplete, loadChecklistData, isComplete }`
- **Consumers:** `ParentDashboard.jsx`, `ParentOnboarding.jsx`

### Hooks Defined Inline in Dashboard Pages

#### `usePriorityItems` — `src/components/parent/PriorityCardsEngine.jsx` (exported)
- **Tables:** `payments`, `waivers`, `waiver_signatures`, `schedule_events`, `event_rsvps`
- **Parameters:** `{ children, teamIds, seasonId, organizationId }`
- **Returns:** `{ items, loading, scan }`
- **Consumers:** `ParentDashboard.jsx`
- **Real-time:** No
- **Error handling:** Each query individually try/caught with `console.warn`

---

## PHASE 5: Widget Registry

### Widget Resolution System

**File:** `src/components/layout/widgetComponents.jsx` (168 lines)

The app uses a **componentKey-based widget registry**. Each dashboard defines widgets with either:
1. `component: <JSX>` — inline React element
2. `componentKey: 'ComponentName'` — resolved via `widgetComponents.jsx` → `componentMap`

### Component Map (all registered widget keys)

| Component Key | Actual Component | File Path | Built? |
|---------------|-----------------|-----------|--------|
| `WelcomeBanner` | WelcomeBanner | `shared/WelcomeBanner.jsx` | Yes |
| `ChatPreviewCard` | ChatPreviewCard | `shared/ChatPreviewCard.jsx` | Yes |
| `GiveShoutoutCard` | GiveShoutoutCard | `shared/GiveShoutoutCard.jsx` | Yes |
| `OrgHealthHero` | OrgHealthHero | `dashboard/OrgHealthHero.jsx` | Yes |
| `AdminSetupTracker` | AdminSetupTracker | `dashboard/AdminSetupTracker.jsx` | Yes |
| `AdminActionChecklist` | AdminActionChecklist | `dashboard/AdminActionChecklist.jsx` | Yes |
| `AdminQuickActions` | AdminQuickActions | `dashboard/AdminQuickActions.jsx` | Yes |
| `OrgKpiRow` | OrgKpiRow | `dashboard/OrgKpiRow.jsx` | Yes |
| `AllTeamsTable` | AllTeamsTable | `dashboard/AllTeamsTable.jsx` | Yes |
| `OrgActionItems` | OrgActionItems | `dashboard/OrgActionItems.jsx` | Yes |
| `OrgUpcomingEvents` | OrgUpcomingEvents | `dashboard/OrgUpcomingEvents.jsx` | Yes |
| `PeopleComplianceRow` | PeopleComplianceRow | `dashboard/PeopleComplianceRow.jsx` | Yes |
| `OrgFinancials` | OrgFinancials | `dashboard/OrgFinancials.jsx` | Yes |
| `OrgWallPreview` | OrgWallPreview | `dashboard/OrgWallPreview.jsx` | Yes |
| `SeasonJourneyList` | SeasonJourneyList | `dashboard/SeasonJourneyList.jsx` | Yes |
| `AdminNotificationsCard` | AdminNotificationsCard | `dashboard/AdminNotificationsCard.jsx` | Yes |
| `DashboardFilterCard` | DashboardFilterCard | `dashboard/DashboardFilterCard.jsx` | Yes |
| `PlaceholderWidget` | PlaceholderWidget | `dashboard/PlaceholderWidget.jsx` | Yes (placeholder) |
| `SpacerWidget` | SpacerWidget | `layout/SpacerWidget.jsx` | Yes |
| `CoachGameDayHeroV2` | CoachGameDayHeroV2 | `coach/CoachGameDayHeroV2.jsx` | Yes |
| `CoachHeroCarousel` | CoachHeroCarousel | `coach/CoachHeroCarousel.jsx` | Yes |
| `PracticeHeroCard` | PracticeHeroCard | `coach/PracticeHeroCard.jsx` | Yes |
| `SeasonSetupHeroCard` | SeasonSetupHeroCard | `coach/SeasonSetupHeroCard.jsx` | Yes |
| `IdleHeroCard` | IdleHeroCard | `coach/IdleHeroCard.jsx` | Yes |
| `CoachNotifications` | CoachNotifications | `coach/CoachNotifications.jsx` | Yes |
| `SquadRosterCard` | SquadRosterCard | `coach/SquadRosterCard.jsx` | Yes |
| `CoachTools` | CoachTools | `coach/CoachTools.jsx` | Yes |
| `AlsoThisWeekCard` | AlsoThisWeekCard | `coach/AlsoThisWeekCard.jsx` | Yes |
| `CalendarStripCard` | CalendarStripCard | `coach/CalendarStripCard.jsx` | Yes |
| `CoachActionItemsCard` | CoachActionItemsCard | `coach/CoachActionItemsCard.jsx` | Yes |
| `TeamHealthCard` | TeamHealthCard | `coach/TeamHealthCard.jsx` | Yes |
| `TeamReadinessCard` | TeamReadinessCard | `coach/TeamReadinessCard.jsx` | Yes |
| `TopPlayersCard` | TopPlayersCard | `coach/TopPlayersCard.jsx` | Yes |
| `ChallengesCard` | ChallengesCard | `coach/ChallengesCard.jsx` | Yes |
| `TeamWallPreviewCard` | TeamWallPreviewCard | `coach/TeamWallPreviewCard.jsx` | Yes |
| `GameDayJourneyCard` | GameDayJourneyCard | `coach/GameDayJourneyCard.jsx` | Yes |
| `AchievementsCard` | AchievementsCard | `coach/AchievementsCard.jsx` | Yes |
| `ParentChildHero` | ParentChildHero | `pages/roles/ParentChildHero.jsx` | Yes |
| `NextEventCard` | NextEventCard | `parent/NextEventCard.jsx` | Yes |
| `SeasonRecordCard` | SeasonRecordCard | `parent/SeasonRecordCard.jsx` | Yes |
| `EngagementProgressCard` | EngagementProgressCard | `parent/EngagementProgressCard.jsx` | Yes |
| `QuickLinksCard` | QuickLinksCard | `parent/QuickLinksCard.jsx` | Yes |
| `ParentJourneyCard` | ParentJourneyCard | `parent/ParentJourneyCard.jsx` | Yes |
| `CoachSeasonJourneyCard` | CoachSeasonJourneyCard | `coach/CoachSeasonJourneyCard.jsx` | Yes |
| `PlayerHeroCard` | PlayerHeroCard | `player/PlayerHeroCard.jsx` | Yes |
| `ScoutingReportCard` | ScoutingReportCard | `player/ScoutingReportCard.jsx` | Yes |
| `TrophyCaseCard` | TrophyCaseCard | `player/TrophyCaseCard.jsx` | Yes |
| `LastGameCard` | LastGameCard | `player/LastGameCard.jsx` | Yes |
| `DailyChallengeCard` | DailyChallengeCard | `player/DailyChallengeCard.jsx` | Yes |

**Fallback:** Any unregistered `componentKey` renders `WidgetPlaceholder` with "Component not built yet".

### Old Widget Registry (`src/components/widgets/`)

These are legacy widget files from an earlier architecture (pre-grid-layout):

| Widget | File | Description | Currently Used? |
|--------|------|-------------|----------------|
| `TeamRecordWidget` | `widgets/coach/TeamRecordWidget.jsx` | Team W-L record | Only in DashboardWidgetsExample |
| `TopPlayerWidget` | `widgets/coach/TopPlayerWidget.jsx` | Top player stats | Only in DashboardWidgetsExample |
| `ChildStatsWidget` | `widgets/parent/ChildStatsWidget.jsx` | Child stats | Only in DashboardWidgetsExample |
| `TeamStandingsWidget` | `widgets/parent/TeamStandingsWidget.jsx` | Standings | Only in DashboardWidgetsExample |
| `ChildAchievementsWidget` | `widgets/parent/ChildAchievementsWidget.jsx` | Child badges | Only in DashboardWidgetsExample |
| `MyStatsWidget` | `widgets/player/MyStatsWidget.jsx` | Player stats | Only in DashboardWidgetsExample |
| `MyBadgesWidget` | `widgets/player/MyBadgesWidget.jsx` | Player badges | Only in DashboardWidgetsExample |
| `DashboardGrid` | `widgets/dashboard/DashboardGrid.jsx` | Old grid system | Superseded by layout/DashboardGrid.jsx |
| `DashboardWidgets` | `widgets/dashboard/DashboardWidgets.jsx` | Old widget defs | Superseded by layout/widgetComponents.jsx |

---

## PHASE 6: Shared UI Components

### UI Components (`src/components/ui/`)

| Component | Path | Description | Used By | Lines |
|-----------|------|-------------|---------|-------|
| `Badge` | `ui/Badge.jsx` | Status/count badge pill | Multiple pages | ~40 |
| `Breadcrumb` | `ui/Breadcrumb.jsx` | URL-based breadcrumb navigation | MainApp layout | ~80 |
| `Cards` | `ui/Cards.jsx` | Reusable card containers | Multiple pages | ~60 |
| `CommandPalette` | `ui/CommandPalette.jsx` | Cmd/Ctrl+K global search with fuzzy match | MainApp (global) | ~300 |
| `EmptyState` | `ui/EmptyState.jsx` | Reusable empty/no-data state with icon + message | Multiple pages | ~40 |
| `ErrorBoundary` | `ui/ErrorBoundary.jsx` | React error boundary with fallback UI | MainApp wraps routes | ~60 |
| `Icon` | `ui/Icon.jsx` | Dynamic Lucide icon resolver | Sidebar, nav | ~40 |
| `MetricCard` | `ui/MetricCard.jsx` | Stat metric card with label + value | Dashboards | ~50 |
| `ProgressRing` | `ui/ProgressRing.jsx` | SVG circular progress indicator | Dashboards | ~40 |
| `Skeleton` | `ui/Skeleton.jsx` | Shimmer loading placeholders | All pages during load | ~80 |
| `Toast` | `ui/Toast.jsx` | Stacking toast notifications with progress bar | MainApp (global) | ~100 |

---

## PHASE 7: Supabase Table Usage Map

### Tables Queried by Dashboard Components

| Table Name | Queried By | Operation | Dashboard(s) |
|------------|-----------|-----------|-------------|
| `profiles` | AuthContext | select, upsert, update | All |
| `user_roles` | AuthContext, RouteGuard | select, insert | All |
| `organizations` | AuthContext, settings pages | select, update | Admin |
| `seasons` | SeasonContext, SeasonsPage | select, insert, update | Admin |
| `sports` | SportContext | select | Admin |
| `teams` | DashboardPage, CoachDashboard, ParentDashboard, useTeamManagerData | select | All |
| `team_players` | DashboardPage, CoachDashboard, useTeamManagerData, GiveShoutoutCard | select | All |
| `team_coaches` | DashboardPage, CoachDashboard | select | Admin, Coach |
| `players` | DashboardPage, ParentDashboard, PlayerDashboard, useTeamManagerData | select | All |
| `schedule_events` | DashboardPage, CoachDashboard, ParentDashboard, PlayerDashboard, useTeamManagerData, PriorityCardsEngine | select | All |
| `event_rsvps` | CoachDashboard, useTeamManagerData, PriorityCardsEngine | select | Coach, TM, Parent |
| `payments` | DashboardPage, ParentDashboard, useTeamManagerData, PriorityCardsEngine | select | Admin, Parent, TM |
| `waivers` | DashboardPage, PriorityCardsEngine | select | Admin, Parent |
| `waiver_signatures` | DashboardPage, PriorityCardsEngine | select | Admin, Parent |
| `player_season_stats` | DashboardPage, CoachDashboard | select | Admin, Coach |
| `player_achievements` | ParentDashboard, PlayerDashboard | select | Parent, Player |
| `xp_ledger` | ParentDashboard | select | Parent |
| `games` | DashboardPage | select | Admin |
| `game_player_stats` | PlayerDashboard | select | Player |
| `player_skill_ratings` | PlayerDashboard | select | Player |
| `coach_challenges` | CoachDashboard, DashboardPage | select | Admin, Coach |
| `shoutouts` | CoachDashboard, DashboardPage, GiveShoutoutCard | select, insert | Coach, Parent |
| `shoutout_categories` | GiveShoutoutCard | select (via service) | Coach, Parent |
| `team_posts` | DashboardPage | select | Admin |
| `chat_channels` | CoachDashboard, ChatPreviewCard | select | Coach, Parent |
| `chat_messages` | CoachDashboard, ChatPreviewCard | select | Coach, Parent |
| `announcements` | ParentDashboard | select | Parent |
| `challenge_participants` | challenge-service | select, insert, update | Coach, Player |

### Service Layer Tables (used by dashboard widgets indirectly)

| Table Name | Service File | Operations |
|------------|-------------|------------|
| `shoutouts` | `lib/shoutout-service.js` | insert, select |
| `xp_ledger` | `lib/shoutout-service.js`, `lib/achievement-engine.js` | insert, select |
| `coach_challenges` | `lib/challenge-service.js` | insert, select, update |
| `challenge_participants` | `lib/challenge-service.js` | insert, select, update |
| `achievements` | `lib/achievement-engine.js` | select |
| `player_achievements` | `lib/achievement-engine.js` | select, upsert |
| `player_achievement_progress` | `lib/achievement-engine.js` | upsert |
| `game_stats` | `lib/achievement-engine.js` | select |
| `team_posts` | `lib/challenge-service.js`, `lib/engagement-events.js` | insert |

---

## PHASE 8: Current Sidebar Navigation

### Primary Sidebar: `LynxSidebar.jsx`

**File:** `src/components/layout/LynxSidebar.jsx` (~400 lines)
**Type:** Collapsible sidebar, 64px → 228px on hover
**Position:** Fixed left-0 top-0, z-40

**Features:**
- Profile avatar + org name (visible on hover)
- Role pill switcher (multi-role accounts)
- Dark/light mode toggle
- Search trigger (⌘K)
- Collapsible nav groups with auto-expand
- Badge counters on nav items
- Notification bell with badge
- Platform Mode button (super admin)
- Sign Out button

### Navigation Structure by Role

#### Admin Nav (MainApp.jsx lines 892-949)

| Group | Items | Route | Badge? | Built? |
|-------|-------|-------|--------|--------|
| Dashboard | (single) | `/dashboard` | No | Yes |
| **Club Management** | | | | |
| | Team Management | `/teams` | No | Yes |
| | Coach Directory | `/coaches` | No | Yes |
| | Staff & Volunteers | `/staff` | No | Yes |
| **Registration & Payments** | | | | |
| | Registrations | `/registrations` | Yes (pending count) | Yes |
| | Payment Admin | `/payments` | No | Yes |
| | Jersey Management | `/jerseys` | Yes (needs assignment) | Yes |
| **Scheduling** | | | | |
| | Schedule | `/schedule` | No | Yes |
| | Attendance & RSVP | `/attendance` | No | Yes |
| | Coach Availability | `/schedule/availability` | No | Yes |
| **Game Day** | | | | |
| | Game Prep | `/gameprep` | No | Yes |
| | Standings | `/standings` | No | Yes |
| | Leaderboards | `/leaderboards` | No | Yes |
| **Communication** | | | | |
| | Chats | `/chats` | No | Yes |
| | Announcements | `/blasts` | No | Yes |
| | Push Notifications | `/notifications` | No | Yes |
| **Reports & Insights** | | | | |
| | Reports & Analytics | `/reports` | No | Yes |
| | Registration Funnel | `/reports/funnel` | No | Yes |
| | Season Archives | `/archives` | No | Yes |
| | Org Directory | `/directory` | No | Yes |
| **Settings** | | | | |
| | Season Management | `/admin/seasons` | No | Yes |
| | Registration Forms | `/settings/templates` | No | Yes |
| | Waivers | `/settings/waivers` | No | Yes |
| | Payment Setup | `/settings/payment-setup` | No | Yes |
| | Venues | `/settings/venues` | No | Yes |
| | Organization | `/settings/organization` | No | Yes |
| | Data Export | `/settings/data-export` | No | Yes |
| | Subscription | `/settings/subscription` | No | Yes |

#### Coach Nav (MainApp.jsx lines 951-978)

| Group | Items | Route | Badge? | Built? |
|-------|-------|-------|--------|--------|
| Dashboard | (single) | `/dashboard` | No | Yes |
| **My Teams** | Roster Manager | `/roster` | No | Yes |
| | _[Dynamic team items]_ | `/teams/{teamId}` | No | Yes |
| Schedule | (single) | `/schedule` | No | Yes |
| **Game Day** | | | | |
| | Game Prep | `/gameprep` | No | Yes |
| | Attendance | `/attendance` | No | Yes |
| | Standings | `/standings` | No | Yes |
| | Leaderboards | `/leaderboards` | No | Yes |
| **Communication** | | | | |
| | Team Chat | `/chats` | No | Yes |
| | Announcements | `/blasts` | No | Yes |
| **My Stuff** | | | | |
| | My Availability | `/schedule/availability` | No | Yes |
| | Season Archives | `/archives` | No | Yes |
| | Org Directory | `/directory` | No | Yes |

#### Parent Nav (MainApp.jsx lines 980-1002)

| Group | Items | Route | Badge? | Built? |
|-------|-------|-------|--------|--------|
| Home | (single) | `/dashboard` | No | Yes |
| **My Players** | _[Dynamic child items]_ | `/parent/player/{childId}` | No | Yes |
| **Social** | | | | |
| | Chat | `/chats` | No | Yes |
| | Team Hub | `/teams/{teamId}` | No | Yes |
| Payments | (single) | `/payments` | No | Yes |
| **My Stuff** | | | | |
| | My Stuff | `/my-stuff` | No | Yes |
| | Registration | `/parent/register` | No | Yes |
| | Archives | `/archives` | No | Yes |
| | Directory | `/directory` | No | Yes |

#### Player Nav (MainApp.jsx lines 1004-1022)

| Group | Items | Route | Badge? | Built? |
|-------|-------|-------|--------|--------|
| Home | (single) | `/dashboard` | No | Yes |
| **My Team** | _[Dynamic team items]_ | `/teams/{teamId}` | No | Yes |
| Schedule | (single) | `/schedule` | No | Yes |
| Achievements | (single) | `/achievements` | No | Yes |
| **My Stuff** | | | | |
| | My Stats | `/stats` | No | Yes |
| | Leaderboards | `/leaderboards` | No | Yes |
| | Standings | `/standings` | No | Yes |
| | Profile & Stats | `/profile` | No | Yes |

#### Team Manager Nav (MainApp.jsx lines 1024-1052)

| Group | Items | Route | Badge? | Built? |
|-------|-------|-------|--------|--------|
| Dashboard | (single) | `/dashboard` | No | Yes |
| **My Teams** | Roster Manager | `/roster` | No | Yes |
| | _[Dynamic team items]_ | `/teams/{teamId}` | No | Yes |
| Schedule | (single) | `/schedule` | No | Yes |
| **Game Day** | Attendance, Standings, Leaderboards | various | No | Yes |
| **Communication** | Team Chat, Announcements | various | No | Yes |
| **Team Ops** | Payments | `/payments` | No | Yes |
| **My Stuff** | Season Archives, Org Directory | various | No | Yes |

### Legacy Sidebars (exist but NOT rendered in current layout)

| Sidebar | File | Width | Status |
|---------|------|-------|--------|
| `AdminLeftSidebar` | `layout/AdminLeftSidebar.jsx` | 240px | **Unused** — replaced by LynxSidebar |
| `CoachLeftSidebar` | `coach/CoachLeftSidebar.jsx` | 240px | **Unused** — replaced by LynxSidebar |
| `ParentLeftSidebar` | `parent/ParentLeftSidebar.jsx` | 310px | **Unused** — replaced by LynxSidebar |
| `OrgSidebar` | `dashboard/OrgSidebar.jsx` | 360px | **Unused** — replaced by LynxSidebar |
| `PlayerProfileSidebar` | `player/PlayerProfileSidebar.jsx` | 260px | Used on PlayerProfilePage (parent view) |

---

## PHASE 9: Current Top Bar / Header

### Architecture

There is **NO traditional top bar**. The layout is:

1. **Left sidebar** (`LynxSidebar`): 64px fixed, 228px on hover
2. **Main content**: `flex-1`, offset by `pl-16`
3. **Breadcrumb**: Top of content area (URL-based)
4. **Page-level filters**: Inline with content (not global)

### Header Selector Components (`src/components/layout/HeaderComponents.jsx`)

| Selector | Type | Context | Status |
|----------|------|---------|--------|
| `HeaderSportSelector` | Dropdown | `useSport()` | Built, used in some pages |
| `HeaderSeasonSelector` | Dropdown | `useSeason()` | Built, used in some pages |
| `HeaderCoachTeamSelector` | Dropdown | Props (teams) | Built, not in sidebar |
| `HeaderChildSelector` | Dropdown | Props (children) | Built, not in sidebar |
| `AccentColorPicker` | Dropdown (in SidebarHelpers) | `useTheme()` | Built, not wired into sidebar |

### Season Context Management
- **Storage:** `SeasonContext` (React state, NOT URL-based)
- **Persistence:** localStorage (`vb_selected_season`)
- **Flow:** Global across all pages, switching doesn't change URL

### Role Switching
- **Location:** Role pills in LynxSidebar (visible on hover)
- **Available roles:** Computed from `user_roles` table: admin, coach, team_manager, parent, player
- **On switch:** `setActiveView(viewId); navigate('/dashboard')`
- **Admin/Coach preview:** Can preview player view even without player record

### Notification System
- **Bell icon** in LynxSidebar footer
- **Badge count:** Currently hardcoded to 0
- **Click handler:** `navigate('/notifications')`
- **NotificationsPage exists** at `/notifications` for push notification management

### Search / Command Palette
- **Trigger:** Search button in sidebar + ⌘K global shortcut
- **Component:** `CommandPalette` (`src/components/ui/CommandPalette.jsx`)
- **Features:** Fuzzy search across pages, players, teams; recent searches; keyboard navigation

### Theme Toggle
- Moon/Sun icon in LynxSidebar
- Toggles `isDark` via `ThemeContext`
- CSS custom property `--accent-primary` for brand color

---

## PHASE 10: Summary and Flags

### Components That Are Fully Functional

| Component | Dashboard | Notes |
|-----------|-----------|-------|
| `DashboardPage` (Admin) | Admin | 1,564 lines, comprehensive, loads all org data |
| `CoachDashboard` | Coach | 881 lines, widget grid, team-scoped |
| `ParentDashboard` | Parent | 659 lines, widget grid, multi-child support |
| `PlayerDashboard` | Player | 374 lines, always dark, admin preview mode |
| `TeamManagerDashboard` | Team Manager | 440 lines, fixed layout (no grid) |
| `LynxSidebar` | All | Primary nav, 5 role structures |
| `DashboardGrid` (layout) | All | react-grid-layout, 24-col, drag-and-drop |
| `widgetComponents` (resolver) | All | Maps 49 componentKeys to components |
| `WelcomeBanner` | All | Role-specific greeting |
| `CalendarStripCard` | Coach, Parent, Admin | Mini calendar with event dots |
| `NextEventCard` | Parent, Player | Auto-rotating game/practice hero |
| `PlayerHeroCard` | Player | Always-dark hero with OVR badge, XP |
| `GiveShoutoutCard` | Coach, Parent | Full shoutout flow (player + category + send) |
| `ChatPreviewCard` | Parent, Player | Chat widget |
| `PriorityCardsEngine` | Parent | Scans payments, waivers, RSVPs, games |
| `useTeamManagerData` | Team Manager | Dedicated operational data hook |
| `useAppNavigate` | All | URL-based navigation |
| `CommandPalette` | All | Global search with fuzzy match |

### Components That Are Partially Built

| Component | Issue | Location |
|-----------|-------|----------|
| `ParentMessagesPage` | Stub — 81 lines, placeholder UI | `pages/parent/ParentMessagesPage.jsx` |
| `InviteFriendsPage` | Stub — 84 lines, placeholder UI | `pages/parent/InviteFriendsPage.jsx` |
| `NotificationsPage` | Built but notification count hardcoded to 0 | `pages/notifications/NotificationsPage.jsx` |
| `AccentColorPicker` | Built but not wired into sidebar | `layout/SidebarHelpers.jsx` |
| `JerseyNavBadge` | Built but not integrated into LynxSidebar | `layout/SidebarHelpers.jsx` |
| `HeaderCoachTeamSelector` | Built but not placed in any header | `layout/HeaderComponents.jsx` |
| `HeaderChildSelector` | Built but not placed in any header | `layout/HeaderComponents.jsx` |

### Components That Are Dead Code / Legacy

| Component | Reason | Location |
|-----------|--------|----------|
| `OrgSidebar` | Replaced by LynxSidebar | `dashboard/OrgSidebar.jsx` |
| `AdminLeftSidebar` | Replaced by LynxSidebar | `layout/AdminLeftSidebar.jsx` |
| `CoachLeftSidebar` | Replaced by LynxSidebar | `coach/CoachLeftSidebar.jsx` |
| `ParentLeftSidebar` | Replaced by LynxSidebar | `parent/ParentLeftSidebar.jsx` |
| `CoachCenterDashboard` | Replaced by widget grid | `coach/CoachCenterDashboard.jsx` |
| `ParentCenterDashboard` | Replaced by widget grid | `parent/ParentCenterDashboard.jsx` |
| `ParentRightPanel` | Replaced by widget grid | `parent/ParentRightPanel.jsx` |
| `PlayerCenterFeed` | Replaced by widget grid | `player/PlayerCenterFeed.jsx` |
| `PlayerSocialPanel` | Replaced by widget grid | `player/PlayerSocialPanel.jsx` |
| `CoachGameDayHero` (v1) | Superseded by CoachGameDayHeroV2 | `coach/CoachGameDayHero.jsx` |
| `DashboardWidgetsExample` | Reference/example only, not routed | `pages/dashboard/DashboardWidgetsExample.jsx` |
| `DashboardGrid` (widgets/) | Superseded by layout/DashboardGrid.jsx | `widgets/dashboard/DashboardGrid.jsx` |
| `DashboardWidgets` (widgets/) | Superseded by layout/widgetComponents.jsx | `widgets/dashboard/DashboardWidgets.jsx` |
| `TeamRecordWidget` | Only used in DashboardWidgetsExample | `widgets/coach/TeamRecordWidget.jsx` |
| `TopPlayerWidget` | Only used in DashboardWidgetsExample | `widgets/coach/TopPlayerWidget.jsx` |
| `ChildStatsWidget` | Only used in DashboardWidgetsExample | `widgets/parent/ChildStatsWidget.jsx` |
| `TeamStandingsWidget` | Only used in DashboardWidgetsExample | `widgets/parent/TeamStandingsWidget.jsx` |
| `ChildAchievementsWidget` | Only used in DashboardWidgetsExample | `widgets/parent/ChildAchievementsWidget.jsx` |
| `MyStatsWidget` | Only used in DashboardWidgetsExample | `widgets/player/MyStatsWidget.jsx` |
| `MyBadgesWidget` | Only used in DashboardWidgetsExample | `widgets/player/MyBadgesWidget.jsx` |

### Components That Are Broken

No components identified as currently broken. All dashboard pages render without console errors per the existing test runs.

### Data Hooks That Are Critical (DO NOT DELETE)

| Hook/Context | Why Critical | Consumers |
|-------------|-------------|-----------|
| `useAuth` (AuthContext) | All authentication, user profile, organization, role detection | Every page |
| `useSeason` (SeasonContext) | Season scoping — most queries depend on selectedSeason | Most pages |
| `useTheme` (ThemeContext) | All styling — isDark, accent colors | Every component |
| `useAppNavigate` | URL-based navigation for all pages | MainApp, all pages |
| `useCurrentPageId` | Sidebar active item highlighting | MainApp |
| `useDocumentTitle` | Browser tab titles | MainApp |
| `useTeamManagerData` | Team Manager dashboard data | TeamManagerDashboard |
| `usePriorityItems` | Parent action items scanning | ParentDashboard |
| `useOrgBranding` (OrgBrandingContext) | Organization branding (logo, colors) | Dashboards, sidebars |
| `useSport` (SportContext) | Sport filtering | Admin dashboard, schedule |

### Data Hooks That Are Unused

| Hook | Location | Notes |
|------|----------|-------|
| No dedicated `src/hooks/` files are unused | — | Only 2 hook files exist and both are actively consumed |

### Legacy Components Safe to Delete in v2

The following components exist but are not rendered in the current layout. They could be safely removed during a v2 redesign:

1. `src/components/dashboard/OrgSidebar.jsx`
2. `src/components/layout/AdminLeftSidebar.jsx`
3. `src/components/coach/CoachLeftSidebar.jsx`
4. `src/components/parent/ParentLeftSidebar.jsx`
5. `src/components/coach/CoachCenterDashboard.jsx`
6. `src/components/parent/ParentCenterDashboard.jsx`
7. `src/components/parent/ParentRightPanel.jsx`
8. `src/components/player/PlayerCenterFeed.jsx`
9. `src/components/player/PlayerSocialPanel.jsx`
10. `src/components/coach/CoachGameDayHero.jsx` (v1, superseded by V2)
11. `src/pages/dashboard/DashboardWidgetsExample.jsx`
12. All files in `src/components/widgets/` (superseded by `layout/widgetComponents.jsx` + `layout/DashboardGrid.jsx`)

---

## Appendix: File Count Summary

| Directory | File Count | Primary Purpose |
|-----------|-----------|----------------|
| `src/components/dashboard/` | 22 files | Admin dashboard widgets |
| `src/components/coach/` | 32 files | Coach dashboard widgets |
| `src/components/parent/` | 14 files | Parent dashboard widgets |
| `src/components/player/` | 8 files | Player dashboard widgets |
| `src/components/shared/` | 3 files | Cross-role widgets |
| `src/components/layout/` | 17 files | Layout infrastructure |
| `src/components/ui/` | 11 files | Shared UI primitives |
| `src/components/widgets/` | 9 files | **Legacy** widget system |
| `src/hooks/` | 2 files | Custom hooks |
| `src/contexts/` | 7 files | React context providers |
| `src/pages/dashboard/` | 2 files | Admin dashboard + example |
| `src/pages/roles/` | 5+ files | Role-specific dashboards |

**Total dashboard-related files:** ~130+
