# CLAUDE.md — VolleyBrain Web Admin Portal

## CRITICAL CONTEXT

This is the **web admin portal** for VolleyBrain, a dual-platform youth sports management app.
- **This repo**: `volleybrain-admin` — React/Vite web app (admin portal)
- **Sister repo**: `volleybrain-mobile3` — React Native/Expo mobile app
- **Shared backend**: Supabase (project ID: `uqpjvbiuokwpldjvxiby`)
- **Both apps share the same database** — any schema changes affect both platforms

## OWNER CONTEXT

- Carlos cannot code — all implementation is done via Claude Code
- Carlos is the director of Black Hornets Volleyball Club in Dallas
- Organization ID: `b213e885-093f-47d8-afca-b305a75b3274`
- User ID: `8e9894f6-59d7-47a1-8dc4-c2271a5e9275`

## TECH STACK

- React 18.2 + Vite 5
- Tailwind CSS 3.4
- Supabase JS 2.39
- Lucide React icons 0.294
- react-router-dom 6.21 (**INSTALLED but NOT USED** — see Phase 1 task)
- No TypeScript — all .jsx files

## PROJECT STRUCTURE

```
src/
├── App.jsx                    # Entry point, auth check, public route handling
├── MainApp.jsx                # Main layout, nav, page routing (2000 lines)
├── main.jsx                   # Vite entry
├── index.css                  # Global styles + Tailwind
│
├── contexts/                  # React Context providers
│   ├── AuthContext.jsx        # Auth state, user profile, admin check
│   ├── ThemeContext.jsx       # Dark/light mode, accent colors
│   ├── SeasonContext.jsx      # Global season selector
│   ├── SportContext.jsx       # Sport type context
│   ├── JourneyContext.jsx     # Onboarding journey tracking
│   ├── OrgBrandingContext.jsx # Organization branding (logo, colors)
│   └── ParentTutorialContext.jsx # Parent onboarding tutorial steps
│
├── lib/                       # Utility libraries
│   ├── supabase.js            # Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
│   ├── csv-export.js          # CSV export helper
│   ├── email-service.js       # Email sending
│   ├── fee-calculator.js      # Fee calculation logic
│   ├── registration-prefill.js # Pre-fill registration forms
│   └── stripe-checkout.js     # Stripe (not fully wired)
│
├── constants/
│   ├── icons.js               # Lucide icon re-exports + custom VolleyballIcon
│   └── theme.js               # Theme constants
│
├── components/
│   ├── ui/                    # Reusable UI: Toast, Badge, Cards, MetricCard, ProgressRing, Icon
│   ├── layout/                # Nav helpers, header components, blast alert checker
│   ├── games/                 # Game components: LineupBuilder, Scoring, Stats, Detail modals
│   ├── players/               # PlayerComponents, PlayerCardExpanded
│   ├── journey/               # JourneyTimeline onboarding
│   ├── parent/                # ParentOnboarding (spotlight, checklist, help button)
│   └── widgets/               # Dashboard widgets for coach, parent, player roles
│
├── pages/
│   ├── auth/                  # LoginPage, SetupWizard
│   ├── dashboard/             # DashboardPage (admin), CoachDashboard, DashboardWidgetsExample
│   ├── roles/                 # Role-specific dashboards: ParentDashboard, CoachDashboard, PlayerDashboard
│   ├── teams/                 # TeamsPage, TeamWallPage
│   ├── registrations/         # RegistrationsPage (bulk ops, filters, approve/deny)
│   ├── payments/              # PaymentsPage
│   ├── coaches/               # CoachesPage
│   ├── schedule/              # SchedulePage (4200 lines!), CoachAvailabilityPage, poster/share modals
│   ├── attendance/            # AttendancePage
│   ├── chats/                 # ChatsPage (split-panel desktop chat)
│   ├── blasts/                # BlastsPage (announcements)
│   ├── notifications/         # NotificationsPage (push notification management)
│   ├── gameprep/              # GamePrepPage, GameDayCommandCenter
│   ├── standings/             # TeamStandingsPage
│   ├── leaderboards/          # SeasonLeaderboardsPage
│   ├── stats/                 # PlayerStatsPage, SeasonLeaderboardsPage
│   ├── achievements/          # AchievementsCatalog, cards, detail, tracked widget
│   ├── jerseys/               # JerseysPage
│   ├── reports/               # ReportsPage, RegistrationFunnelPage
│   ├── archives/              # SeasonArchivePage
│   ├── parent/                # PlayerProfilePage, ParentPlayerCard, ParentPayments, Messages, InviteFriends
│   ├── profile/               # MyProfilePage
│   ├── public/                # PublicRegistrationPage, OrgDirectoryPage, TeamWallPage (public)
│   ├── settings/              # Organization, Seasons, Waivers, PaymentSetup, RegTemplates, DataExport, Subscription
│   └── platform/              # PlatformAdmin, PlatformAnalytics, PlatformSubscriptions (super admin)
```

## CURRENT NAVIGATION SYSTEM (IMPORTANT)

**The app does NOT use react-router-dom for navigation.** Despite it being installed in package.json.

All page navigation happens via `useState` in `MainApp.jsx`:
```javascript
const [page, setPage] = useState('dashboard')  // Line ~1776
```

Pages render conditionally:
```javascript
{page === 'dashboard' && activeView === 'admin' && <DashboardPage onNavigate={setPage} />}
{page === 'registrations' && <RegistrationsPage showToast={showToast} />}
// ... etc for all 25+ pages
```

Navigation is organized into dropdown menus in `HorizontalNavBar` (line ~1430):
- **Admin**: Dashboard | People (Teams, Coaches) | Operations (Registrations, Jerseys, Schedule, Attendance, Payments, Coach Availability) | Game Day (Game Prep, Standings, Leaderboards) | Communication (Chats, Announcements, Push Notifications) | Insights (Reports, Registration Funnel, Season Archives, Org Directory) | Setup (Seasons, Registration Forms, Waivers, Payment Setup, Organization, Data Export, Subscription)
- **Coach**: Dashboard | My Teams (dynamic team list) | Schedule | My Availability | Game Day | Attendance | Communication | Insights
- **Parent**: Home | My Players (dynamic child list) | Schedule | Standings | Leaderboards | Achievements | Chats | Payments | Archives | Directory
- **Player**: Home | My Teams (dynamic) | Schedule | Standings | Leaderboards | Achievements

Role switching happens via a role selector in the header. The current role is stored in `activeView` state.

## DESIGN SYSTEM

- **Theme**: CSS custom property `--accent-primary` for brand color, dark/light mode toggle
- **Card style**: iOS-inspired glassmorphism with `backdrop-blur`, `border-white/[0.06]` in dark mode
- **Layout**: 3-column grid on dashboard, split-panel for chat, data tables for admin pages
- **Patterns**: Toast notifications for feedback, modals for detail/edit views, dropdown menus for nav

## SUPABASE TABLES USED BY WEB

Key tables queried in the web codebase (see DATABASE_SCHEMA.md for full schema):

**Core**: organizations, profiles, seasons, sports, teams, players, team_players, team_coaches, coaches, user_roles
**Schedule**: schedule_events (aliased as 'schedule' in some queries), event_rsvps, event_volunteers
**Payments**: payments, payment_plans, payment_plan_installments, registration_fees
**Chat**: chat_channels, channel_members, chat_messages, message_attachments, message_reactions
**Blasts**: messages, message_recipients, announcements, announcement_reads
**Team Wall**: team_posts, post_reactions (note: web uses 'post_reactions', mobile might use 'team_post_reactions')
**Game**: games, game_sets, game_stats, game_lineups, game_lineup_players
**Jerseys**: jerseys, jersey_assignments, jersey_change_requests
**Waivers**: waivers, waiver_signatures
**Achievements**: achievements, player_achievements, achievement_categories, player_achievement_progress
**Notifications**: admin_notifications, notification_templates, push_subscriptions
**Registration**: registration_templates, registration_custom_fields

## KNOWN ISSUES

1. **No URL routing** — useState page switching, no bookmarks, no browser back/forward
2. **RLS disabled** — Security concern for production
3. **SchedulePage.jsx is 4,200 lines** — needs splitting into components
4. **OrganizationPage.jsx is 2,400 lines** — needs splitting into tabs
5. **ParentMessagesPage.jsx is 81 lines** — stub/placeholder
6. **InviteFriendsPage.jsx is 84 lines** — stub/placeholder
7. **src_backup/ folder** in repo — should be removed
8. **90MB supabase.exe** in repo — should be gitignored
9. **post_reactions vs team_post_reactions** — web uses 'post_reactions' table name, verify which actually exists in Supabase
10. **Toast.jsx is 28 lines** — minimal implementation, needs upgrade

## PHASE 1 TASK: URL ROUTING

The immediate priority is implementing react-router-dom to replace useState page switching.
See WEB_BETA_GAMEPLAN.md for the full phased plan.
