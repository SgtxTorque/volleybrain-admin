# Lynx Web Admin — Feature Inventory
## Date: 2026-03-22
## Branch: main (commit c4bdc5a)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total page-level components** | 46 |
| **LIVE (fully functional)** | 45 |
| **PARTIAL (some features stubbed)** | 1 |
| **STUB (placeholder only)** | 0 |
| **BROKEN** | 0 |
| **DEAD (orphaned)** | 0 |

The codebase is remarkably complete. Nearly every page is LIVE with real Supabase data, full CRUD operations, and working modals. The only PARTIAL page is `SubscriptionPage` (Stripe billing portal not wired). Two pages previously noted as stubs in CLAUDE.md — `ParentMessagesPage` (382 lines) and `InviteFriendsPage` (305 lines) — are actually fully functional.

---

## Page-by-Page Inventory

### Auth (`src/pages/auth/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| LoginPage | `auth/LoginPage.jsx` | 297 | LIVE | Email/password login & signup, Google/Apple OAuth, password reset, mode toggle |
| LandingPage | `auth/LandingPage.jsx` | 385 | LIVE | Public marketing page: hero, feature cards, role previews, CTA buttons |
| SetupWizard | `auth/SetupWizard.jsx` | 748 | LIVE | 7-step onboarding: role selection, org creation, invite code, confetti celebration |

### Dashboard (`src/pages/dashboard/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| DashboardPage | `dashboard/DashboardPage.jsx` | 1197 | LIVE | Admin command center: global stats, season carousel, stepper nav, 5 body tabs (action items, teams, registrations, payments, schedules), financial snapshot, org health sidebar |

### Role Dashboards (`src/pages/roles/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| CoachDashboard | `roles/CoachDashboard.jsx` | 919 | LIVE | Team switcher, roster/schedule/stats/gameprep/engagement tabs, hero stats, blast/shoutout modals, weekly metrics |
| ParentDashboard | `roles/ParentDashboard.jsx` | 500+ | LIVE | Kid cards, priority scanner (unpaid fees, unsigned waivers, missing RSVPs), schedule/payments/forms/report-card/achievements tabs |
| PlayerDashboard | `roles/PlayerDashboard.jsx` | 500+ | LIVE | Badges, challenges, stats, skills tabs, leaderboard sidebar, shoutout feed, admin preview selector |
| TeamManagerDashboard | `roles/TeamManagerDashboard.jsx` | 300+ | LIVE | Getting started checklist, hero stats, roster/payments/schedule/attendance tabs, invite code modal |

### Teams (`src/pages/teams/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| TeamsPage | `teams/TeamsPage.jsx` | 561 | LIVE | Team CRUD, roster management, coach assignment, CSV export, unrostered player alert |
| TeamWallPage | `teams/TeamWallPage.jsx` | 1100+ | LIVE | Instagram-style 3-column social hub: posts, comments (threaded), emoji reactions, photo gallery, shoutouts, challenges, roster sidebar |

### Operations

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| RegistrationsPage | `registrations/RegistrationsPage.jsx` | 487 | LIVE | View/filter/search registrations, approve/deny (individual & bulk), auto-generate fees, CSV export |
| PaymentsPage | `payments/PaymentsPage.jsx` | 484 | LIVE | Player/family view, mark paid/unpaid, add fees, blast overdue, backfill fees, send reminders, CSV export |
| CoachesPage | `coaches/CoachesPage.jsx` | 993 | LIVE | Full coach CRUD, 4-step form, credentials/certifications, compliance tracking, team assignment, CSV export |
| StaffPage | `staff/StaffPage.jsx` | 443 | LIVE | Staff/volunteer CRUD, 8 role types, background check tracking, team assignment |
| SchedulePage | `schedule/SchedulePage.jsx` | 464 | LIVE | Event CRUD (single & series), 4 calendar views (month/week/day/list), team & type filters, iCal export, season poster, game day share card, venue manager |
| CoachAvailabilityPage | `schedule/CoachAvailabilityPage.jsx` | 511 | LIVE | Calendar availability (available/unavailable/tentative), recurring patterns, conflict detection, admin can view any coach |
| AttendancePage | `attendance/AttendancePage.jsx` | 425 | LIVE | Event RSVP grid (going/no/maybe/pending), inline mark, volunteer assignment (line judge, scorekeeper) |
| JerseysPage | `jerseys/JerseysPage.jsx` | 1427 | LIVE | Auto-assign (respects preferences), manual assign, size tracking, league report, order history |

### Game Day (`src/pages/gameprep/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| GamePrepPage | `gameprep/GamePrepPage.jsx` | 637 | LIVE | Upcoming/results tabs, team selector, stats pending banner, 7 modals (lineup, completion, stats, detail, game day, quick score, quick attendance) |
| GameDayCommandCenter | `gameprep/GameDayCommandCenter.jsx` | 500+ | LIVE | Full-screen overlay: pre-game/in-game/post-game modes, lineup builder with rotation, live scoring with set tracking, stat entry (kills/aces/blocks/digs/assists/errors), attendance |

### Insights

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| TeamStandingsPage | `standings/TeamStandingsPage.jsx` | 451 | LIVE | W-L-T record, win %, points for/against, recent form guide, team selector |
| SeasonLeaderboardsPage | `leaderboards/SeasonLeaderboardsPage.jsx` | 671 | LIVE | 8 stat categories, grid + list views, rank badges (gold/silver/bronze), team filter, season MVPs |
| PlayerStatsPage | `stats/PlayerStatsPage.jsx` | 739 | LIVE | 3 tabs (overview/game log/skills), season totals, per-game averages, trend charts, hitting/serve %, coach skill ratings |
| AchievementsCatalogPage | `achievements/AchievementsCatalogPage.jsx` | 481 | LIVE | 5 categories, 3 types (badges/emblems/calling cards), track/untrack, progress bars, admin preview mode |
| ReportsPage | `reports/ReportsPage.jsx` | 579 | LIVE | 11 report types, column picker, multi-filter, CSV/PDF/email export, saved presets |
| RegistrationFunnelPage | `reports/RegistrationFunnelPage.jsx` | 399 | LIVE | Funnel analytics (views -> starts -> submitted -> approved -> paid), pipeline table, trends tab |
| SeasonArchivePage | `archives/SeasonArchivePage.jsx` | 254 | LIVE | Historical season browser, multi-org support, completion metrics |

### Communication

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| ChatsPage | `chats/ChatsPage.jsx` | 477 | LIVE | Split-panel chat, conversation list with search/filter, unread badges, COPPA consent gating |
| BlastsPage | `blasts/BlastsPage.jsx` | 720 | LIVE | Announcement broadcast, multi-target (all/team/coaches), read receipt tracking, filter by type/priority |
| NotificationsPage | `notifications/NotificationsPage.jsx` | 699 | LIVE | 3 tabs (dashboard/history/templates), manual send, 10 notification types, status tracking |

### Parent (`src/pages/parent/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| PlayerProfilePage | `parent/PlayerProfilePage.jsx` | 354 | LIVE | Registration/uniform/medical/waivers/history tabs, edit/save all sections |
| MyStuffPage | `parent/MyStuffPage.jsx` | 665 | LIVE | 5 tabs: Profile (avatar upload), Payments, Waivers, Settings (notifications), Linked Players |
| ParentPlayerCardPage | `parent/ParentPlayerCardPage.jsx` | 443 | LIVE | Multi-sport player card: OVR rating, per-game stats, trends, badges, coach feedback |
| ParentPaymentsPage | `parent/ParentPaymentsPage.jsx` | 555 | LIVE | Stripe checkout, manual payment (Venmo/Zelle/CashApp), processing fees, payment history |
| ParentMessagesPage | `parent/ParentMessagesPage.jsx` | 382 | LIVE | Announcements/team updates/action required tabs, team filter, read tracking, 3 card types |
| InviteFriendsPage | `parent/InviteFriendsPage.jsx` | 305 | LIVE | Referral link copy, social share (Facebook/Twitter/WhatsApp/Email/SMS), tier tracking (Bronze/Silver/Gold) |

### Public (`src/pages/public/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| PublicRegistrationPage | `public/PublicRegistrationPage.jsx` | 400+ | LIVE | Multi-child registration, shared parent info, custom fields, waivers, fee preview, funnel tracking |
| OrgDirectoryPage | `public/OrgDirectoryPage.jsx` | 915 | LIVE | Organization discovery: search, filter by state/sport, sort, detail slide-over with seasons/contact |
| TeamWallPage (public) | `public/TeamWallPage.jsx` | 900+ | LIVE | Public-facing team wall with posts, reactions, comments (same feature set minus admin controls) |

### Settings (`src/pages/settings/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| OrganizationPage | `settings/OrganizationPage.jsx` | 813 | LIVE | 16 expandable setup sections (branding, contact, legal, payments, sports, etc.) |
| SeasonsPage | `settings/SeasonsPage.jsx` | 1000+ | LIVE | Season CRUD: fees, discounts, registration windows, early-bird pricing, capacity/waitlist |
| WaiversPage | `settings/WaiversPage.jsx` | 150+ | LIVE | Template CRUD, signature tracking, send history, versioning |
| PaymentSetupPage | `settings/PaymentSetupPage.jsx` | 400+ | LIVE | Manual methods (Venmo/Zelle/CashApp) + Stripe config, processing fees, test connection |
| RegistrationTemplatesPage | `settings/RegistrationTemplatesPage.jsx` | 400+ | LIVE | Template CRUD, field toggles, waiver assignment, custom questions, clone/delete |
| DataExportPage | `settings/DataExportPage.jsx` | 500+ | LIVE | CSV/JSON export by category, season filter, progress tracking, row counts |
| SubscriptionPage | `settings/SubscriptionPage.jsx` | 500+ | **PARTIAL** | Plan display (Free/Starter/Pro/Enterprise), feature comparison, pricing. **Missing:** Stripe billing portal, invoice history, upgrade/downgrade flow, cancel subscription |

### Platform Admin (`src/pages/platform/`)

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| PlatformAdminPage | `platform/PlatformAdminPage.jsx` | 889 | LIVE | Super-admin: overview stats, org management (search/suspend/delete), user management (suspend/grant admin), audit log |

### Other

| Page | File | Lines | Status | What it actually does |
|------|------|-------|--------|----------------------|
| MyProfilePage | `profile/MyProfilePage.jsx` | 141 | LIVE | Profile info, emergency contact, password/email change, org memberships, delete account |
| RosterManagerPage | `roster/RosterManagerPage.jsx` | 400+ | LIVE | Coach roster: team selector, roster health metrics, search/sort, inline jersey/position editing, evaluation mode with 9-skill ratings |

---

## Feature Status by Category

### Game Day: LIVE
- **GamePrepPage**: Full game orchestration with lineup builder, scoring, stats, attendance
- **GameDayCommandCenter**: Full-screen overlay with pre-game/in-game/post-game modes
- **Lineup Builder**: Drag-drop, 6-position rotation, libero designation, save to Supabase
- **Scoring**: Live set-by-set scoring with undo, point history
- **Stats**: Per-player stat entry (kills, aces, blocks, digs, assists, errors)
- **Post-Game**: Summary generation, badge awards

### Engagement: LIVE
- **Shoutouts**: Give (4-step modal), card display, XP awards (+10 giver, +15 receiver), achievement checks
- **Challenges**: Create (type/metric/target/reward), opt-in, progress tracking, completion with XP
- **Achievements**: 5 categories, 3 types, 5 rarities, track/untrack, progress bars, celebration modal
- **XP System**: 20 levels (exponential curve), 4 tiers (Bronze/Silver/Gold/Diamond), xp_ledger persistence

### Chat: LIVE
- Real-time split-panel messaging with conversation list
- Team/DM channels, unread badges, search/filter
- COPPA consent gating for parents
- Channel creation (team chat, player chat)

### Registration: LIVE
- **Public flow**: Multi-child, shared parent info, custom fields, waivers, fee preview, funnel tracking
- **Admin**: Approve/deny (individual & bulk), auto-generate fees, CSV export
- **Waitlist**: Status management (new/pending/approved/waitlisted/withdrawn/denied)

### Payments: LIVE
- Player & family views, mark paid/unpaid, add ad-hoc fees
- Stripe checkout integration (parent-facing)
- Manual methods: Venmo, Zelle, CashApp
- Blast overdue families, send reminders, backfill fees
- Processing fee pass-through (2.9% + $0.30)

### Schedule: LIVE
- 4 calendar views (month/week/day/list)
- Single event & series CRUD, bulk event wizard
- Team & type filters, iCal export, print, season poster
- Coach availability tracking with conflict detection
- Venue management

### Reports: LIVE
- 11 report types across 3 categories (people, financial, operations)
- Column picker, multi-filter, sort
- CSV/PDF/email export, saved presets
- Registration funnel analytics (views -> starts -> submitted -> approved -> paid)

### Player Features: LIVE
- **Player stats**: Season totals, per-game averages, trend charts, game log
- **Skill ratings**: 9 skills rated by coaches (1-100 scale)
- **Player card**: Multi-sport, OVR rating, badges, development history
- **Achievements catalog**: Browse, track, progress bars
- **Evaluations**: 5 eval types (tryout/pre-season/mid-season/end-season/ad-hoc)

### Parent Features: LIVE
- **Dashboard**: Kid cards, priority scanner, schedule/payments/forms tabs
- **Payments**: Stripe + manual methods, payment history
- **Messages**: Announcements/team updates/action required with read tracking
- **Invite Friends**: Referral system with social share, tier tracking
- **My Stuff**: Profile, payments, waivers, settings, linked players

### Coach Features: LIVE
- **Dashboard**: Team switcher, roster/schedule/stats/gameprep/engagement tabs
- **Roster management**: Health metrics, search/sort, inline editing
- **Evaluation mode**: 9-skill rating with notes, previous comparison
- **Availability**: Calendar with recurring patterns, conflict detection

### Team Manager Features: LIVE
- **Dashboard**: Getting started checklist, hero stats, 4 body tabs
- **Setup wizard**: Roster -> events -> invite parents -> payments
- **Invite codes**: Generate and share team invite codes

### Platform Admin: LIVE
- Organization management (search, suspend, delete, detail slide-over)
- User management (suspend, grant/revoke super-admin)
- Audit log (100-item action history)
- Subscription management (assign plans, generate invoices)

---

## Database CRUD Matrix

| Table | Insert | Select | Update | Delete | Primary Files |
|-------|--------|--------|--------|--------|--------------|
| **Core** | | | | | |
| organizations | YES | YES | YES | — | SetupWizard, TeamManagerSetup |
| profiles | — | YES | YES | — | AuthContext, JourneyContext |
| seasons | YES | YES | YES | — | SeasonsPage, TeamManagerSetup |
| sports | — | YES | — | — | MainApp |
| teams | YES | YES | YES | — | TeamsPage, TeamManagerSetup |
| players | YES | YES | YES | — | PublicRegistrationPage, ParentRegistrationHub |
| team_players | YES | YES | — | — | TeamsPage, MainApp |
| team_coaches | YES | YES | YES | — | TeamsPage, CoachesPage |
| coaches | YES | YES | YES | YES | CoachesPage |
| user_roles | YES | YES | — | — | SetupWizard, MainApp |
| **Schedule** | | | | | |
| schedule_events | YES | YES | YES | — | SchedulePage, GameComponents |
| event_rsvps | YES | YES | YES | — | AttendancePage, EventDetailModal |
| event_volunteers | YES | YES | — | YES | AttendancePage, EventDetailModal |
| event_attendance | YES | YES | — | — | QuickAttendanceModal, GameCompletionModal |
| coach_availability | YES | YES | — | YES | CoachAvailabilityPage |
| **Payments** | | | | | |
| payments | YES | YES | YES | — | PaymentsPage, fee-calculator |
| **Chat** | | | | | |
| chat_channels | YES | YES | — | — | TeamsPage, NewChatModal |
| channel_members | YES | YES | — | — | TeamsPage, NewChatModal |
| chat_messages | YES | YES | — | — | ChatThread |
| **Blasts** | | | | | |
| messages | YES | YES | YES | — | BlastsPage, CoachDashboard |
| message_recipients | YES | YES | YES | — | BlastsPage, BlastAlertChecker |
| **Team Wall** | | | | | |
| team_posts | YES | YES | YES | — | NewPostModal, shoutout-service, challenge-service |
| post_reactions | YES | YES | — | — | ReactionBar, TeamWallPage |
| team_post_comments | YES | YES | YES | — | CommentSection |
| **Game** | | | | | |
| game_lineups | YES | YES | — | — | LineupBuilder, GameDayCommandCenter |
| game_player_stats | YES | YES | — | YES | GameComponents, GameDayCommandCenter |
| **Waivers** | | | | | |
| waiver_templates | YES | YES | YES | — | WaiversPage |
| waiver_signatures | YES | YES | — | — | MyStuffPage, PlayerProfileWaivers |
| **Engagement** | | | | | |
| shoutouts | YES | YES | — | — | shoutout-service, QuickScoreModal |
| coach_challenges | YES | YES | YES | — | challenge-service |
| challenge_participants | YES | YES | YES | — | challenge-service |
| xp_ledger | YES | YES | — | — | shoutout-service, challenge-service, achievement-engine |
| player_tracked_achievements | YES | YES | YES | YES | AchievementsCatalogPage |
| **Notifications** | | | | | |
| admin_notifications | YES | YES | — | YES | MainApp, PlayerProfilePage |
| notification_templates | — | YES | YES | — | NotificationsPage |
| **Registration** | | | | | |
| registrations | YES | YES | — | — | PublicRegistrationPage, TeamsPage |
| registration_templates | YES | YES | YES | — | RegistrationTemplatesPage |
| registration_funnel_events | YES | YES | — | — | PublicRegistrationPage |
| **Platform** | | | | | |
| platform_admin_actions | YES | YES | — | — | PlatformAdminPage, PlatformUsers |
| platform_subscriptions | YES | YES | YES | — | PlatformSubscriptionsPage |
| platform_invoices | YES | YES | — | — | PlatformSubscriptionsPage |
| **Player Data** | | | | | |
| player_skill_ratings | YES | YES | YES | — | RosterManagerPage |
| player_evaluations | YES | YES | — | — | RosterManagerPage |
| player_badges | YES | YES | — | — | GameCompletionModal |
| staff_members | YES | YES | YES | — | StaffPage |
| venues | YES | YES | YES | — | VenueManagerModal |

---

## Roadmap Cross-Reference

| Feature | Status | Details |
|---------|--------|---------|
| Game Day Command Center | **EXISTS** | `GameDayCommandCenter.jsx` — fully functional with lineup, scoring, stats, attendance |
| Challenge System | **EXISTS** | `challenge-service.js` + `CreateChallengeModal.jsx` — create, join, progress, complete, XP awards |
| Player Evaluations | **EXISTS** | `RosterEvalMode.jsx` — 9-skill form, 5 eval types (tryout/pre/mid/end/ad-hoc), previous comparison |
| Bulk Events | **EXISTS** | `BulkEventWizard.jsx` + `BulkPracticeModal.jsx` + `BulkGamesModal.jsx` — recurring & series creation |
| Season Setup Wizard | **EXISTS** | `SeasonSetupWizard.jsx` — 6 steps: roster, positions, jerseys, waivers, evaluation, confirmation |
| Native Registration | **EXISTS** | `PublicRegistrationPage.jsx` — multi-child, shared info, custom fields, waivers, fee preview, funnel tracking |
| Tryouts | **PARTIAL** | Tryout eval type exists in `RosterEvalMode.jsx`. No dedicated tryout management UI |
| Volunteer Management | **MINIMAL** | `event_volunteers` table used in `AttendancePage` and `EventDetailModal`. No dedicated volunteer page |
| Practice Plans | **DOES NOT EXIST** | No practice plan builder or drill library |
| Tournaments | **DOES NOT EXIST** | No tournament bracket or management UI |
| Voice Stat Entry | **DOES NOT EXIST** | No Whisper API or voice-to-text integration |
| Video | **DOES NOT EXIST** | No video upload or playback features |
| AI Insights | **DOES NOT EXIST** | No AI-powered analytics or predictions |
| College Recruiting | **DOES NOT EXIST** | No recruiting features |
| Marketplace | **DOES NOT EXIST** | No store or e-commerce features |

---

## Unmerged Branch Work

| Branch | Unmerged Commits | Description |
|--------|-----------------|-------------|
| `feat/v2-dashboard-redesign` | 0 | Fully merged into main. No unmerged work. |

Only one non-main branch exists and it has been fully merged. The main branch contains all work.

---

## Surprises

### Things that exist but we might not know about

1. **ParentMessagesPage is NOT a stub** — CLAUDE.md says "81 lines — stub/placeholder" but it's actually 382 lines with 3 tabs (Announcements, Team Updates, Action Required), team filtering, read tracking, and 3 card types. Fully functional.

2. **InviteFriendsPage is NOT a stub** — CLAUDE.md says "84 lines — stub/placeholder" but it's actually 305 lines with referral link copy, social sharing (5 platforms), referral tier tracking (Bronze/Silver/Gold), and progress bars. Fully functional.

3. **RosterManagerPage** exists at `src/pages/roster/` with evaluation mode, roster health metrics, inline jersey/position editing, and a 6-step SeasonSetupWizard. This is a coach-specific roster management tool separate from the admin TeamsPage.

4. **Engagement system is production-complete** — Shoutouts, challenges, achievements, and XP are fully wired end-to-end: UI modals -> service layer -> Supabase persistence -> XP ledger -> level-up detection -> auto-post to team wall.

5. **Multi-sport support** exists in ParentPlayerCardPage (volleyball, basketball, soccer, baseball, football, hockey) with sport-specific stat displays.

6. **Registration funnel tracking** is fully instrumented — `PublicRegistrationPage` fires funnel events (page_view, form_started, step_completed, submitted) to `registration_funnel_events` table, consumed by `RegistrationFunnelPage` analytics.

7. **Platform admin subsystem** is more extensive than a single page — includes `PlatformSubscriptionsPage`, `PlatformOrgDetail`, `PlatformOrganizations`, `PlatformUsers`, and `PlatformSupport` as sub-components.

### Things marked as "done" that are actually incomplete

1. **SubscriptionPage** — Plan cards and pricing display work, but Stripe billing portal integration is a stub. No real upgrade/downgrade, invoice history, or cancel subscription flows.

2. **Stripe payments** — Parent-facing Stripe checkout (`ParentPaymentsPage`) has session creation code but the Stripe integration in `PaymentSetupPage` settings is partially configured. The `stripe-checkout.js` lib exists but isn't fully wired.
