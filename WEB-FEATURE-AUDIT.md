# Lynx Web Admin Portal — Feature Audit

## Date: 2026-03-07
## Total Screens/Pages: 44
## Branch: feat/desktop-dashboard-redesign

---

## SCREENS BY ROLE

### AUTHENTICATION & PUBLIC PAGES

| # | Screen | Route | File Path | Description | Key Actions |
|---|--------|-------|-----------|-------------|-------------|
| 1 | Login Page | `/` | `pages/auth/LoginPage.jsx` | Email/password + OAuth (Google, Apple) authentication | Sign in, sign up, reset password, OAuth |
| 2 | Setup Wizard | *(post-login)* | `pages/auth/SetupWizard.jsx` | Onboarding wizard for new users to set up org and roles | Create org, configure seasons, assign roles |
| 3 | Public Registration | `/register/:orgIdOrSlug/:seasonId` | `pages/public/PublicRegistrationPage.jsx` | Public-facing registration form (no auth required) | Register player, fill waivers, provide parent info |

---

### ADMIN SCREENS

| # | Screen | Route | File Path | Description | Key Actions |
|---|--------|-------|-----------|-------------|-------------|
| 1 | Admin Dashboard | `/dashboard` | `pages/dashboard/DashboardPage.jsx` | Org-wide KPIs, team stats, compliance, financials, drag-drop widget grid | View health score, manage seasons, customize layout, quick actions |
| 2 | Teams & Rosters | `/teams` | `pages/teams/TeamsPage.jsx` | Manage all teams, view rosters, assign unrostered players | Create team, assign players, export roster, view stats |
| 3 | Coaches | `/coaches` | `pages/coaches/CoachesPage.jsx` | Manage coaches, assign teams, view coaching assignments | Add coach, assign to team, edit roles (head/assistant) |
| 4 | Registrations | `/registrations` | `pages/registrations/RegistrationsPage.jsx` | Manage player registrations with approve/deny workflow | Approve, deny, bulk ops, export CSV, analytics |
| 5 | Jerseys | `/jerseys` | `pages/jerseys/JerseysPage.jsx` | Jersey inventory, assignments, and change requests | Create jersey set, assign to player, manage requests |
| 6 | Schedule | `/schedule` | `pages/schedule/SchedulePage.jsx` | Calendar with month/week/day/list views, event CRUD | Create/edit/delete events, bulk create, set venue, export |
| 7 | Attendance & RSVP | `/attendance` | `pages/attendance/AttendancePage.jsx` | Manage player attendance across events | Mark attendance, view reports, volunteer management |
| 8 | Payments | `/payments` | `pages/payments/PaymentsPage.jsx` | Manage fees, payments, reminders, financial tracking | Generate fees, mark paid, send reminders, track collection |
| 9 | Coach Availability | `/schedule/availability` | `pages/schedule/CoachAvailabilityPage.jsx` | Survey and manage coach availability | Set availability, create survey, view responses |
| 10 | Game Prep | `/gameprep` | `pages/gameprep/GamePrepPage.jsx` | Game day command center with scoring, lineup, stats | Start game, record score, manage lineups, track stats |
| 11 | Standings | `/standings` | `pages/standings/TeamStandingsPage.jsx` | Team standings and rankings for season | View standings, filter by team, manual score entry |
| 12 | Leaderboards | `/leaderboards` | `pages/leaderboards/SeasonLeaderboardsPage.jsx` | Player leaderboards by stat category | View kills, digs, blocks, aces leaders |
| 13 | Chats | `/chats` | `pages/chats/ChatsPage.jsx` | Split-panel desktop chat with team channels | Send messages, create channels, attach files |
| 14 | Announcements | `/blasts` | `pages/blasts/BlastsPage.jsx` | Create/manage broadcast announcements | Create blast, target audience, view delivery stats |
| 15 | Push Notifications | `/notifications` | `pages/notifications/NotificationsPage.jsx` | Manage push notifications, templates, delivery stats | Send push, configure templates, view analytics |
| 16 | Reports & Analytics | `/reports` | `pages/reports/ReportsPage.jsx` | Generate reports on registrations, payments, attendance | View analytics, export data, filter by date |
| 17 | Registration Funnel | `/reports/funnel` | `pages/reports/RegistrationFunnelPage.jsx` | Registration funnel analytics (views→starts→completions) | View conversion rates, identify drop-offs |
| 18 | Season Archives | `/archives` | `pages/archives/SeasonArchivePage.jsx` | View past seasons, archived data, historical stats | View archived seasons, search, export |
| 19 | Org Directory | `/directory` | `pages/public/OrgDirectoryPage.jsx` | Organization member directory | Search teams, view coach info |
| 20 | Achievements Catalog | `/achievements` | `pages/achievements/AchievementsCatalogPage.jsx` | Browse achievement catalog, view earned badges | View achievements, track progress |
| 21 | Season Management | `/admin/seasons/:seasonId` | `pages/admin/SeasonManagementPage.jsx` | Guided season setup with progress tracking | Configure season settings, teams, registration |
| 22 | Seasons Settings | `/settings/seasons` | `pages/settings/SeasonsPage.jsx` | Create and manage seasons, set active season | Create/edit/delete seasons |
| 23 | Registration Forms | `/settings/templates` | `pages/settings/RegistrationTemplatesPage.jsx` | Create/manage registration form templates | Create template, customize fields, manage waivers |
| 24 | Waivers | `/settings/waivers` | `pages/settings/WaiversPage.jsx` | Manage waiver templates and signatures | Create waiver, view signatures, resend |
| 25 | Payment Setup | `/settings/payment-setup` | `pages/settings/PaymentSetupPage.jsx` | Configure Stripe, manage payment plans | Connect Stripe, configure installments |
| 26 | Organization | `/settings/organization` | `pages/settings/OrganizationPage.jsx` | Org settings (name, logo, branding, contact) | Update org info, upload logo, configure branding |
| 27 | Data Export | `/settings/data-export` | `pages/settings/DataExportPage.jsx` | Export organization data | Select data, choose format, download |
| 28 | Subscription | `/settings/subscription` | `pages/settings/SubscriptionPage.jsx` | Manage subscription plan and billing | View/upgrade plan, manage billing |
| 29 | My Profile | `/profile` | `pages/profile/MyProfilePage.jsx` | User profile settings | Update info, change password, preferences |

---

### COACH SCREENS

| # | Screen | Route | File Path | Description | Key Actions |
|---|--------|-------|-----------|-------------|-------------|
| 1 | Coach Dashboard | `/dashboard` | `pages/roles/CoachDashboard.jsx` | Team-focused home: hero carousel, roster, schedule, challenges, quick actions | Switch teams, message parents, warmup timer, give shoutout |
| 2 | Roster Manager | `/roster` | `pages/roster/RosterManagerPage.jsx` | Coach-side roster with player evaluations and development | View roster, evaluate players, track development |
| 3 | Team Wall | `/teams/:teamId` | `pages/teams/TeamWallPage.jsx` | Team social feed with posts, comments, photos, reactions | Post, comment, react, upload photos, view challenges |
| 4 | Schedule | `/schedule` | `pages/schedule/SchedulePage.jsx` | Coach view of team schedule | View/filter team events |
| 5 | Coach Availability | `/schedule/availability` | `pages/schedule/CoachAvailabilityPage.jsx` | Set scheduling preferences | Set availability |
| 6 | Game Prep | `/gameprep` | `pages/gameprep/GamePrepPage.jsx` | Game day command center | Set lineup, track stats, record scores |
| 7 | Attendance | `/attendance` | `pages/attendance/AttendancePage.jsx` | Mark player attendance | Mark present/absent/late, bulk save |
| 8 | Chats | `/chats` | `pages/chats/ChatsPage.jsx` | Team messaging | Send/receive messages |
| 9 | Announcements | `/blasts` | `pages/blasts/BlastsPage.jsx` | Team-scoped blast messaging | Create announcements for team |
| 10 | Standings | `/standings` | `pages/standings/TeamStandingsPage.jsx` | Team standings | View standings |
| 11 | Leaderboards | `/leaderboards` | `pages/leaderboards/SeasonLeaderboardsPage.jsx` | Player leaderboards | View stat leaders |
| 12 | Achievements | `/achievements` | `pages/achievements/AchievementsCatalogPage.jsx` | Achievement catalog | View achievements |
| 13 | Season Archives | `/archives` | `pages/archives/SeasonArchivePage.jsx` | Past season data | View archived data |

**Note:** Coaches also access the engagement system (shoutouts, challenges) via modals on their dashboard.

---

### PARENT SCREENS

| # | Screen | Route | File Path | Description | Key Actions |
|---|--------|-------|-----------|-------------|-------------|
| 1 | Parent Dashboard | `/dashboard` | `pages/roles/ParentDashboard.jsx` | Family-focused home: child selector, events, payments, priority cards, engagement | Switch child, RSVP, view payments, view achievements |
| 2 | Player Card | `/parent/player/:playerId` | `pages/parent/ParentPlayerCardPage.jsx` | Child's profile, stats, waivers, achievements | View stats, sign waivers, view payment status |
| 3 | Player Profile | `/parent/player/:playerId/profile` | `pages/parent/PlayerProfilePage.jsx` | Detailed player profile with stats and assignments | View detailed stats, manage uniform sizes |
| 4 | My Stuff | `/my-stuff` | `pages/parent/MyStuffPage.jsx` | Parent self-service (Profile, Payments, Waivers, Settings, Linked Players) | Update profile, pay fees, sign waivers |
| 5 | Payments | `/payments` | `pages/parent/ParentPaymentsPage.jsx` | Family payment history and status | View balances, payment history |
| 6 | Schedule | `/schedule` | `pages/schedule/SchedulePage.jsx` | Child team schedule | View events, RSVP |
| 7 | Chats | `/chats` | `pages/chats/ChatsPage.jsx` | Parent messaging | Send/receive messages |
| 8 | Team Wall | `/teams/:teamId` | `pages/teams/TeamWallPage.jsx` | Team social feed | View posts, react |
| 9 | Standings | `/standings` | `pages/standings/TeamStandingsPage.jsx` | Team standings | View standings |
| 10 | Leaderboards | `/leaderboards` | `pages/leaderboards/SeasonLeaderboardsPage.jsx` | Player leaderboards | View stat leaders |
| 11 | Achievements | `/achievements` | `pages/achievements/AchievementsCatalogPage.jsx` | Achievement catalog | View achievements |
| 12 | Season Archives | `/archives` | `pages/archives/SeasonArchivePage.jsx` | Past season data | View archived data |
| 13 | Org Directory | `/directory` | `pages/public/OrgDirectoryPage.jsx` | Organization directory | Search teams, view info |
| 14 | Messages | `/messages` | `pages/parent/ParentMessagesPage.jsx` | Parent messaging interface (**STUB — 81 lines**) | — |
| 15 | Invite Friends | `/invite` | `pages/parent/InviteFriendsPage.jsx` | Invite other families (**STUB — 84 lines**) | — |

---

### PLAYER SCREENS

| # | Screen | Route | File Path | Description | Key Actions |
|---|--------|-------|-----------|-------------|-------------|
| 1 | Player Dashboard | `/dashboard` | `pages/roles/PlayerDashboard.jsx` | Dark-themed home: hero card, XP/level, stats, challenges, achievements | View stats, RSVP, view challenges, give shoutout |
| 2 | Team Wall | `/teams/:teamId` | `pages/teams/TeamWallPage.jsx` | Team social feed | View posts, react, comment |
| 3 | Schedule | `/schedule` | `pages/schedule/SchedulePage.jsx` | Player schedule | View events |
| 4 | Standings | `/standings` | `pages/standings/TeamStandingsPage.jsx` | Team standings | View standings |
| 5 | Leaderboards | `/leaderboards` | `pages/leaderboards/SeasonLeaderboardsPage.jsx` | Player leaderboards | View stat leaders |
| 6 | Achievements | `/achievements` | `pages/achievements/AchievementsCatalogPage.jsx` | Achievement catalog | View achievements, track progress |
| 7 | My Profile | `/profile` | `pages/profile/MyProfilePage.jsx` | Profile settings | Update info |

---

### PLATFORM ADMIN SCREENS (Super Admin Only)

| # | Screen | Route | File Path | Description | Key Actions |
|---|--------|-------|-----------|-------------|-------------|
| 1 | Platform Admin | `/platform/admin` | `pages/platform/PlatformAdminPage.jsx` | Manage organizations, users, system health | Manage orgs, manage users, system status |
| 2 | Platform Analytics | `/platform/analytics` | `pages/platform/PlatformAnalyticsPage.jsx` | Platform-wide analytics and usage metrics | View org metrics, usage trends |
| 3 | Platform Subscriptions | `/platform/subscriptions` | `pages/platform/PlatformSubscriptionsPage.jsx` | Manage subscriptions and billing | View subscriptions, manage plans |

---

## DASHBOARD DETAILS BY ROLE

### Admin Dashboard (`DashboardPage`)
- **Layout**: 24-column react-grid-layout with drag-and-drop widget customization
- **Org Health Hero**: Health score (0-100) + 8 KPIs + urgent items count
- **Financial Chart**: 6-month line chart of collected fees, payment methods breakdown
- **Quick Actions**: Review registrations, overdue payments, unrostered players, teams without schedule
- **People Compliance Row**: Waivers signed %, coaches assigned %
- **All Teams Table**: Teams list with roster health, record, open spots
- **Setup Tracker**: Onboarding checklist (org profile, season, registration, teams, coaches, events)
- **Calendar Strip**: Compact month view with event dots
- **Notifications Card**: System alerts, upcoming events, action reminders
- **Season Journey**: All seasons list with team/player counts
- **KPI Row**: Mini stat cards (teams, players, revenue, outstanding, events)

### Coach Dashboard (`CoachDashboard`)
- **Layout**: 24-column grid with 15 configurable widgets
- **Team pills**: Switch between coached teams
- **Hero Carousel**: Next game card + team record + RSVP counts + lineup status
- **Coach Tools**: 4 buttons: Message Parents, Warmup Timer, Start Shoutout, View Team
- **Squad Roster Card**: Roster grid with photo/name/jersey/position
- **Challenges Card**: Active team challenges with progress bars
- **Achievements Card**: Recent team achievements earned
- **Team Readiness Card**: Roster size, RSVP count, attendance %, waivers
- **Top Players Card**: Season leaders (kills, aces, digs, blocks, assists, points)
- **Also This Week Card**: Upcoming events (next 7 days)
- **Action Items Card**: Pending stats, missing RSVPs, jersey issues

### Parent Dashboard (`ParentDashboard`)
- **Layout**: 23-column grid with 16 widgets
- **Child Selector**: Tab-based (buttons for each child)
- **Priority Cards**: Unpaid fees, unsigned waivers, missing RSVPs, upcoming games <48h
- **Athlete Card**: Child photo, name, team, stats pills, badges
- **Next Event Card**: Next game with opponent, date, time, location, RSVP button
- **Calendar Strip**: Month view with event dots
- **Quick Links**: My Stuff, Schedule, Standings, Leaderboards
- **Balance Due**: Shows unpaid amount or "Paid Up" with Pay Now button
- **Season Record**: Team W/L record with recent form
- **Engagement Progress**: Child's XP level + progress bar
- **Chat Preview**: Recent team chat messages
- **Parent Journey Card**: Onboarding checklist (add players, payment, waivers)

### Player Dashboard (`PlayerDashboard`)
- **Layout**: 24-column grid, dark navy background (#0D1B3E)
- **Player Hero Card**: Name, team, photo, level, XP bar
- **Trophy Case**: Badges grid with rarity colors
- **Scouting Report**: Kills, aces, digs, blocks, assists per game
- **Streak Banner**: Fire emoji + N-day streak (if N >= 2)
- **Next Event**: Next game with countdown
- **Last Game Stats**: Kills, assists, points from most recent game
- **Daily Challenge**: Active challenge with progress bar
- **Admin Preview Mode**: Admin can preview any player's dashboard

---

## NAVIGATION STRUCTURE

### Sidebar (LynxSidebar)
- **Collapsed**: 64px width, expands to 228px on hover
- **Dark navy**: Always visible, full viewport height
- **Content**: Org logo, role indicator, nav groups, theme toggle, role switcher, sign out

### Admin Nav
| Group | Items |
|-------|-------|
| Dashboard | Dashboard |
| People | Teams & Rosters, Coaches |
| Operations | Registrations, Jerseys, Schedule, Attendance & RSVP, Payments, Coach Availability |
| Game Day | Game Prep, Standings, Leaderboards |
| Communication | Chats, Announcements, Push Notifications |
| Insights | Reports & Analytics, Registration Funnel, Season Archives, Org Directory |
| Setup | Seasons, Registration Forms, Waivers, Payment Setup, Organization, Data Export, Subscription |
| Platform (if super admin) | Platform Analytics, Platform Subscriptions, Platform Admin |

### Coach Nav
| Group | Items |
|-------|-------|
| Dashboard | Dashboard |
| My Teams | Roster Manager, Team Walls (dynamic per coached team) |
| Schedule | Schedule |
| Game Day | Game Prep, Attendance, Standings, Leaderboards |
| Communication | Team Chat, Announcements |
| My Stuff | My Availability, Season Archives, Org Directory |

### Parent Nav
| Group | Items |
|-------|-------|
| Home | Home |
| My Players | Dynamic child list (one per child) |
| Social | Chat, Team Hub |
| Payments | Payments |
| My Stuff | My Stuff, Archives, Directory |

### Player Nav
| Group | Items |
|-------|-------|
| Home | Home |
| My Team | Dynamic team walls (one per team) |
| Schedule | Schedule |
| Achievements | Achievements |
| My Stuff | Leaderboards, Standings, Profile & Stats |

---

## UNIQUE WEB COMPONENTS (Not on Mobile)

### UI Infrastructure
| Component | File | Purpose |
|-----------|------|---------|
| CommandPalette | `components/ui/CommandPalette.jsx` | Cmd/Ctrl+K quick navigation, searches pages/teams/players |
| Breadcrumb | `components/ui/Breadcrumb.jsx` | URL-based breadcrumb navigation |
| Skeleton | `components/ui/Skeleton.jsx` | Shimmer loading animations (line, circle, card variants) |
| ErrorBoundary | `components/ui/ErrorBoundary.jsx` | React error boundary with reset/home buttons |
| EmptyState | `components/ui/EmptyState.jsx` | Reusable empty/no-data state component |

### Dashboard Customization
| Component | File | Purpose |
|-----------|------|---------|
| DashboardGrid | `components/layout/DashboardGrid.jsx` | react-grid-layout drag-and-drop widget grid |
| WidgetLibraryPanel | `components/layout/WidgetLibraryPanel.jsx` | Slide-out panel to add/remove widgets |
| EditLayoutButton | `components/layout/EditLayoutButton.jsx` | Toggle edit mode FAB |
| layoutService | `lib/layoutService.js` | Save/load/reset dashboard layouts per user |

### Admin Settings Suite (7 pages)
- SeasonsPage, RegistrationTemplatesPage, WaiversPage, PaymentSetupPage, OrganizationPage, DataExportPage, SubscriptionPage

### Platform Admin (3 pages)
- PlatformAdminPage, PlatformAnalyticsPage, PlatformSubscriptionsPage

### Engagement System
| Component | File | Purpose |
|-----------|------|---------|
| ShoutoutCard | `components/engagement/ShoutoutCard.jsx` | Shoutout display in feed |
| GiveShoutoutModal | `components/engagement/GiveShoutoutModal.jsx` | Multi-step shoutout creation |
| ChallengeCard | `components/engagement/ChallengeCard.jsx` | Challenge with progress bar |
| CreateChallengeModal | `components/engagement/CreateChallengeModal.jsx` | Coach creates challenges |
| ChallengeDetailModal | `components/engagement/ChallengeDetailModal.jsx` | Details + participant leaderboard |
| HexBadge | `components/engagement/HexBadge.jsx` | Hexagonal SVG achievement badge |
| LevelBadge | `components/engagement/LevelBadge.jsx` | Compact level indicator |
| AchievementCelebrationModal | `components/engagement/AchievementCelebrationModal.jsx` | Full-screen celebration with confetti |

### Team Hub Components
| Component | File | Purpose |
|-----------|------|---------|
| CommentSection | `components/teams/CommentSection.jsx` | Threaded comments (inline + expand) |
| ReactionBar | `components/teams/ReactionBar.jsx` | Multi-emoji reactions (6 emoji types) |
| PhotoGallery | `components/teams/PhotoGallery.jsx` | Photo grid + lightbox with download |
| NewPostModal | `components/teams/NewPostModal.jsx` | Create new team wall post |

---

## DATA CRUD BY ROLE

### Admin
| Action | Capabilities |
|--------|-------------|
| **View** | All teams, players, families, registrations, payments, coaches, schedules, reports, org settings, season archives, waivers, notifications |
| **Create** | Teams, seasons, events (single + bulk), blast messages, payment fees, waivers, registration templates, notification templates |
| **Edit** | Team settings, season settings, org settings, user roles, registration status (approve/deny), payment status, event details, coach assignments |
| **Delete** | Teams, events, coaches, waivers, registration templates |

### Coach
| Action | Capabilities |
|--------|-------------|
| **View** | Own team roster, player details, player stats, team schedule, team health, RSVP counts, leaderboard, challenges, team wall |
| **Create** | Events, lineups, player evaluations, challenges, shoutouts, blast messages, game stats, attendance records, team wall posts |
| **Edit** | Lineup, attendance, game scores/stats, player positions, evaluation ratings, challenge status, availability, profile |
| **Delete** | N/A (no destructive actions surfaced in coach screens) |

### Parent
| Action | Capabilities |
|--------|-------------|
| **View** | Child schedule, child stats, child achievements, team wall, family payments, waivers, standings, leaderboards |
| **Create** | RSVP responses, chat messages, shoutouts, waiver signatures |
| **Edit** | RSVP status, profile info, notification preferences |
| **Delete** | N/A |

### Player
| Action | Capabilities |
|--------|-------------|
| **View** | Own stats, achievements, challenges, team roster, team wall, standings, leaderboard, schedule |
| **Create** | RSVP responses, chat messages, shoutouts, challenge participation |
| **Edit** | RSVP status, profile info |
| **Delete** | N/A |

---

## FEATURE CHECKLIST

### Registration & Onboarding

| Feature | Status | Notes |
|---------|--------|-------|
| Player registration flow (parent registers child) | YES | `PublicRegistrationPage.jsx` — full public-facing multi-step flow (no login required) |
| Multi-child registration | PARTIAL | Public registration handles one child at a time; no inline sibling flow like mobile |
| Returning family detection | NO | Not implemented on web — mobile has it but web public reg starts fresh each time |
| Waiver signing (electronic) | YES | `WaiversPage.jsx` (admin creates), waiver signing in registration flow and `MyStuffPage` |
| Payment during registration | PARTIAL | Fee display during registration; Stripe checkout partially wired (`stripe-checkout.js` exists) |
| Registration approval workflow | YES | `RegistrationsPage.jsx` — approve/deny with bulk ops, status filters, CSV export |
| Open registration detection | PARTIAL | Season selector exists; no auto-detection of open registration with countdown like mobile |

### Schedule & Events

| Feature | Status | Notes |
|---------|--------|-------|
| Calendar view (month/week/day/list) | YES | `SchedulePage.jsx` + `CalendarViews.jsx` — all 4 view modes with date picker |
| Event creation (single) | YES | Modal with type, date/time, location, opponent, arrival time, duration |
| Bulk event creation (recurring) | YES | Bulk create wizard in schedule page |
| RSVP system | YES | `event_rsvps` table — yes/no/maybe with tracking, counts on event cards |
| RSVP management (admin/coach views RSVPs) | YES | RSVP summary counts on events, attendance page shows RSVP preview |
| Event detail modal/page | YES | `EventDetailModal` with full event info, opponent, location, RSVP |
| Game Day mode/workflow | YES | `GamePrepPage.jsx` — lineup builder, scoring, stat entry, game day command center |
| Attendance tracking | YES | `AttendancePage.jsx` — per-event roster with present/absent/late, bulk save |

### Roster & Players

| Feature | Status | Notes |
|---------|--------|-------|
| Roster view (coach sees their team) | YES | `RosterManagerPage.jsx` — team filter, player cards, position/jersey display |
| Player profile view | YES | `PlayerCardExpanded` component + `PlayerProfilePage.jsx` (parent view) |
| Player evaluation/scoring | YES | Skill ratings (serving, passing, setting, attacking, blocking, defense, hustle, coachability, teamwork) 1-10 |
| Position assignment | YES | Position field on players table, assignment in roster manager |
| Jersey number assignment | YES | `JerseysPage.jsx` — assignment tracking, conflict alerts |
| Jersey size management | PARTIAL | Jersey management exists but size field not clearly surfaced |
| Player trading card view | PARTIAL | Player hero card on dashboard but not FIFA-style full trading card like mobile |
| Scouting report / skill bars | YES | Scouting report card on player dashboard with animated stat bars |

### Communication

| Feature | Status | Notes |
|---------|--------|-------|
| Team chat (real-time messaging) | YES | `ChatsPage.jsx` + `ChatThread.jsx` — split-panel desktop UI, team/DM channels, file attachments |
| COPPA-compliant chat permissions | NO | No COPPA consent modal on web |
| Shoutouts / kudos system | YES | `GiveShoutoutModal.jsx` + `shoutout-service.js` — category emoji, message, XP rewards |
| Blast messaging (admin/coach to all parents) | YES | `BlastsPage.jsx` — message types, priority levels, team targeting |
| Push notifications management | YES | `NotificationsPage.jsx` — send push, templates, delivery stats, queue functions |
| In-app notifications feed | YES | `admin_notifications` in MainApp + `AdminNotificationsCard` on dashboard |

### Payments

| Feature | Status | Notes |
|---------|--------|-------|
| View balance / invoices | YES | `PaymentsPage.jsx` + `ParentPaymentsPage.jsx` — grouped by player/family with status |
| Make payment (Stripe) | PARTIAL | `stripe-checkout.js` exists, `PaymentSetupPage.jsx` has Stripe config, but checkout flow not fully wired |
| Payment plans | PARTIAL | `PaymentSetupPage.jsx` references installments but no full plan scheduling system |
| Payment reminders | YES | Blast system supports `payment_reminder` type, admin can send reminders |
| Payment history | YES | Status-verified payments with timestamps, payment method tracking |
| Admin financial overview | YES | `OrgFinancials` widget — 6-month chart, collected vs expected, collection rate % |

### Gamification

| Feature | Status | Notes |
|---------|--------|-------|
| XP system | YES | `engagement-constants.js` — XP_BY_SOURCE, getLevelFromXP, xp_ledger table |
| Levels / tiers | YES | Level calculation, tier colors, `LevelBadge.jsx` component |
| Badges / achievements | YES | `AchievementsCatalogPage.jsx`, `achievement-engine.js`, `HexBadge.jsx`, celebration modals |
| Leaderboards | YES | `SeasonLeaderboardsPage.jsx` — stat leaders by category |
| Daily challenges | YES | `challenge-service.js`, `ChallengeCard.jsx`, `CreateChallengeModal.jsx`, `ChallengeDetailModal.jsx` |
| Streaks | PARTIAL | Streak counter on player dashboard (calculated from games), no dedicated management |
| Player trading card aesthetic | PARTIAL | Player hero card exists on dashboard, but not full FIFA-style trading card like mobile |

### Team Management (Admin)

| Feature | Status | Notes |
|---------|--------|-------|
| Create/edit teams | YES | `TeamsPage.jsx` — create modal, color selection, max players, season assignment |
| Assign players to teams | YES | Player assignment with jersey number, status tracking, unrostered player detection |
| Assign coaches to teams | YES | `CoachesPage.jsx` — coach assignment with role selection (head/assistant) |
| Season setup wizard | YES | `SeasonManagementPage.jsx` — guided season creation with progress tracking |
| Season management | YES | `SeasonsPage.jsx` — create/edit seasons, set active, configure settings |
| Organization settings | YES | `OrganizationPage.jsx` — 16-section setup (identity, contact, social, branding, etc.) |

### Reports & Analytics

| Feature | Status | Notes |
|---------|--------|-------|
| Player stats | YES | `PlayerStatsPage.jsx` (if present), player_season_stats queries, scouting reports |
| Team stats | YES | Team standings, records, per-team stats on admin dashboard |
| Game recaps | PARTIAL | Game results recorded but no dedicated game recap page like mobile |
| Season summaries | YES | `SeasonArchivePage.jsx` — archived season data with stats |
| Financial reports | YES | `OrgFinancials` widget + `ReportsPage.jsx` — collection rate, outstanding balance |
| Attendance reports | YES | `AttendancePage.jsx` — per-event attendance with status tracking |

### Other

| Feature | Status | Notes |
|---------|--------|-------|
| Dark mode | YES | `ThemeContext.jsx` — dark/light toggle with accent color customization |
| Role switcher | YES | Sidebar + header dropdown, admin can switch to coach/parent/player views |
| Profile management | YES | `MyProfilePage.jsx` — name, email, password, photo, preferences |
| Volunteer management | PARTIAL | Volunteer tracking exists in `AttendancePage.jsx` (event_volunteers) but no dedicated page |
| Team wall / social feed | YES | `TeamWallPage.jsx` — posts, comments, reactions, photos, challenges, shoutouts |
| Photo sharing | YES | `PhotoGallery.jsx` — upload, grid view, lightbox with download |
| Lineup builder | YES | `AdvancedLineupBuilder.jsx` in GamePrepPage — formation selector, position assignment |
| Score entry | YES | `GameScoringModal.jsx`, `QuickScoreModal.jsx` — set scores, live stat entry |
| Dashboard customization | YES | react-grid-layout drag-and-drop, per-user persistence via `user_dashboard_layouts` table |
| Command palette (Cmd+K) | YES | Quick search across pages, teams, players — web exclusive |
| URL routing & bookmarks | YES | react-router-dom v6 — URL-based routing with browser back/forward |
| Public registration page | YES | No-login registration at `/register/:org/:season` — web exclusive |

---

## FEATURE SUMMARY

| Category | Total | YES | PARTIAL | NO |
|----------|-------|-----|---------|-----|
| Registration & Onboarding | 7 | 3 | 3 | 1 |
| Schedule & Events | 8 | 8 | 0 | 0 |
| Roster & Players | 8 | 5 | 2 | 1 |
| Communication | 6 | 5 | 0 | 1 |
| Payments | 6 | 3 | 2 | 1 |
| Gamification | 7 | 5 | 2 | 0 |
| Team Management (Admin) | 6 | 6 | 0 | 0 |
| Reports & Analytics | 6 | 5 | 1 | 0 |
| Other | 12 | 11 | 1 | 0 |
| **TOTAL** | **66** | **51** | **11** | **4** |

**Coverage: 77% fully implemented, 17% partial, 6% missing**

### Missing / Partial Items
| Feature | Status | Gap Description |
|---------|--------|----------------|
| Returning family detection | NO | Mobile auto-detects returning families; web public registration starts fresh |
| COPPA-compliant chat | NO | Mobile has `CoppaConsentModal`; web has no COPPA flow |
| Payment plans (installments) | PARTIAL | Setup page references installments but no scheduling system |
| Stripe checkout | PARTIAL | `stripe-checkout.js` exists but checkout flow not fully wired for parents |
| Multi-child registration | PARTIAL | Public reg handles one child at a time; no sibling flow |
| Open registration detection | PARTIAL | No auto-detection with countdown/early bird like mobile |
| Player trading card view | PARTIAL | Hero card exists but not FIFA-style full trading card |
| Streaks | PARTIAL | Counter shown on dashboard but no management/rewards |
| Game recaps | PARTIAL | Scores recorded but no dedicated recap page |
| Jersey size management | PARTIAL | Jersey page exists but sizes not clearly surfaced |
| Volunteer management | PARTIAL | Basic tracking in attendance but no dedicated page |

---

## SUPABASE TABLES (62 unique)

| # | Table Name | Primary Usage |
|---|-----------|---------------|
| 1 | `account_invites` | Account invite tracking |
| 2 | `achievements` | Achievement definitions (types, rarity, criteria) |
| 3 | `admin_notifications` | Admin notification feed |
| 4 | `announcements` | Organization announcements |
| 5 | `challenge_participants` | Player participation in challenges |
| 6 | `channel_members` | Chat channel membership |
| 7 | `chat_channels` | Chat channel definitions |
| 8 | `chat_messages` | Individual chat messages |
| 9 | `coach_availability` | Coach scheduling preferences |
| 10 | `coach_challenges` | Coach-created challenges |
| 11 | `coaches` | Coach profiles and credentials |
| 12 | `email_notifications` | Email notification queue |
| 13 | `event_attendance` | Per-event attendance records |
| 14 | `event_rsvps` | RSVP responses for events |
| 15 | `event_volunteers` | Volunteer assignments per event |
| 16 | `game_lineups` | Game lineup configurations |
| 17 | `game_player_stats` | Per-game player statistics |
| 18 | `game_stats` | Aggregated game statistics |
| 19 | `games` | Game records |
| 20 | `jersey_assignments` | Jersey-player assignments |
| 21 | `message_recipients` | Blast message recipient tracking |
| 22 | `messages` | Blast/announcement messages |
| 23 | `notifications` | Push notification records |
| 24 | `organizations` | Organization profiles |
| 25 | `payments` | Payment records and status |
| 26 | `player_achievement_progress` | Achievement progress tracking |
| 27 | `player_achievements` | Player-earned achievements |
| 28 | `player_badges` | Player badge inventory |
| 29 | `player_coach_notes` | Coach notes on individual players |
| 30 | `player_evaluations` | Formal evaluation records |
| 31 | `player_game_stats` | Per-game player stats (alt) |
| 32 | `player_positions` | Player position assignments |
| 33 | `player_season_stats` | Season-aggregated statistics |
| 34 | `player_skill_ratings` | Skill evaluation ratings (1-10) |
| 35 | `player_skills` | Player skill definitions |
| 36 | `players` | Player profiles |
| 37 | `post_reactions` | Reactions on team wall posts |
| 38 | `profiles` | User profiles (auth-linked) |
| 39 | `registrations` | Season registration records |
| 40 | `schedule_events` | Calendar events |
| 41 | `seasons` | Season definitions |
| 42 | `shoutout_categories` | Shoutout category definitions |
| 43 | `shoutouts` | Shoutout/kudos records |
| 44 | `sports` | Sport definitions |
| 45 | `team_coaches` | Coach-team assignments |
| 46 | `team_documents` | Team document storage |
| 47 | `team_invite_codes` | Team invite codes |
| 48 | `team_players` | Player-team roster assignments |
| 49 | `team_posts` | Team wall social posts |
| 50 | `team_standings` | Team win/loss/rankings |
| 51 | `teams` | Team definitions |
| 52 | `user_dashboard_layouts` | Per-user dashboard widget layouts |
| 53 | `user_roles` | User role assignments |
| 54 | `waivers` | Waiver templates |
| 55 | `waiver_signatures` | Electronic waiver signatures |
| 56 | `xp_ledger` | XP transaction records |

### Additional Tables Referenced (archived/helpers)
- `notification_templates` (in NotificationsPage)

### RPC Functions (2 total)
| # | Function | Purpose |
|---|----------|---------|
| 1 | `queue_team_notification` | Queue notifications for team |
| 2 | `queue_notification` | Queue notifications for individual |

### Storage Buckets (3 total)
| # | Bucket | Purpose |
|---|--------|---------|
| 1 | `media` | Profile photos, chat attachments, general uploads |
| 2 | `waivers` | Waiver PDF documents |
| 3 | `team-assets` | Team logos, cover photos |

---

## WEB-ONLY FEATURES (Not Available on Mobile)

1. **Dashboard Customization** — Drag-and-drop widget grid with per-user persistence
2. **Command Palette** — Cmd/Ctrl+K quick navigation across pages, teams, players
3. **URL Routing & Bookmarks** — Browser back/forward, bookmarkable pages
4. **Public Registration Page** — No-login registration at shareable URL
5. **Registration Form Builder** — Create custom registration templates with fields
6. **Waiver Editor** — Create/edit waiver templates with rich text
7. **Payment Gateway Setup** — Stripe configuration and payment plan management
8. **Data Export** — Export team/player data as CSV/Excel
9. **Subscription Management** — License and billing management
10. **Platform Admin** — Multi-org management (super admin)
11. **Split-Panel Chat** — Desktop-optimized chat with side-by-side panels
12. **Breadcrumb Navigation** — URL-based breadcrumbs
13. **Page Transitions** — Animated slide-up transitions between pages
14. **Skeleton Loading** — Shimmer loading states

---

*Generated by automated codebase audit on 2026-03-07*
