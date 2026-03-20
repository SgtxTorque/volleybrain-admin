# INVESTIGATION REPORT: Web Catchup — Mobile Parity & UX Audit

**Date:** March 19, 2026
**Web repo:** `SgtxTorque/volleybrain-admin` — branch `feat/desktop-dashboard-redesign`
**Mobile repo:** `SgtxTorque/Volleybrain-Mobile3` — branch `navigation-cleanup-complete`
**Investigator:** Claude Code (Opus 4.6)

---

## 1. Executive Summary

The VolleyBrain web admin portal is architecturally sound but functionally behind the mobile app in three critical areas: **role support** (missing Team Manager entirely), **engagement systems** (zero quest/XP implementation), and **user-facing notifications** (admin-only push config, no inbox). The dashboard shell, widget grid system, and responsive design tokens are stable and production-ready — new features can be layered in without structural rework.

The **single biggest risk** is that a user with only a `team_manager` role who logs into web today will silently fall through to the admin dashboard (the default fallback), seeing data and navigation they shouldn't have access to. The `isPlayer` boolean is also hardcoded to `null`, meaning no user can ever organically land on the player dashboard — it only works via admin/coach preview mode.

The recommended execution order is: (1) fix the role detection chain and add TM support, (2) add route guards to unprotected pages, (3) port the quest/XP engine data layer, (4) build the notification inbox, (5) fill dashboard card gaps per role. The mobile engines (quest-engine, leaderboard-engine, xp-boost-engine) are 80-100% portable to web as vanilla JS — no rewrite needed, just TypeScript stripping.

---

## 2. Role Detection Map

### Web: `src/MainApp.jsx` — `loadRoleContext()` (lines 898-939)

| File | Line | What it does | TM Status | Notes |
|------|------|-------------|-----------|-------|
| `src/contexts/AuthContext.jsx` | 34 | `isAdmin` state init (`false`) | N/A | Only checks `league_admin` |
| `src/contexts/AuthContext.jsx` | 87 | Sets `isAdmin` from `user_roles` | Missing | Only matches `'league_admin'` |
| `src/contexts/AuthContext.jsx` | 76 | Sets `isPlatformAdmin` from `profiles.is_platform_admin` | N/A | Platform-level flag |
| `src/MainApp.jsx` | 900-902 | Queries `user_roles` table | Missing | No `team_staff` query |
| `src/MainApp.jsx` | 906-908 | Queries `coaches` table with `team_coaches` join | Missing | Only coach detection |
| `src/MainApp.jsx` | 910-912 | Queries `players` via `parent_account_id` | N/A | Parent detection |
| `src/MainApp.jsx` | 914 | `const playerSelf = null` | N/A | **BROKEN** — hardcoded null |
| `src/MainApp.jsx` | 918 | `isAdmin: roles?.some(r => r.role === 'league_admin' \|\| r.role === 'admin')` | Missing | Checks both strings |
| `src/MainApp.jsx` | 919 | `isCoach: !!coachLink` | N/A | Presence check on coaches table |
| `src/MainApp.jsx` | 921 | `isParent: roles + children.length > 0` | N/A | Requires both |
| `src/MainApp.jsx` | 923 | `isPlayer: !!playerSelf` | N/A | Always `false` (null) |
| `src/MainApp.jsx` | 927-935 | `setActiveView()` priority: admin > coach > parent > player | Missing | No `team_manager` case |
| `src/MainApp.jsx` | 941-961 | `getAvailableViews()` — returns admin, coach, parent, player | Missing | No `team_manager` view |
| `src/MainApp.jsx` | 774-779 | Dashboard routing ternary chain | Missing | Unrecognized `activeView` falls to admin |

### Mobile: `lib/permissions.ts` + `lib/permissions-context.tsx`

| File | Line | What it does | Web Equivalent |
|------|------|-------------|----------------|
| `lib/permissions.ts` | 3 | `UserRole` type: `league_admin, head_coach, assistant_coach, team_manager, parent, player` | Web only has 4 roles |
| `lib/permissions.ts` | 33-37 | Queries `team_staff` table for `teamAssignments` | **NOT ON WEB** |
| `lib/permissions.ts` | 84 | `manageTeam`: admin OR `team_manager` staff role | Web: admin OR coach only |
| `lib/permissions.ts` | 101 | `viewTeamPayments`: admin OR `team_manager` | Web: admin only |
| `lib/permissions.ts` | 105 | `sendTeamBlasts`: admin OR `team_manager` | Web: admin OR coach only |
| `lib/permissions.ts` | 109 | `createTeamInviteCodes`: admin OR `team_manager` | **NOT ON WEB** |
| `lib/permissions.ts` | 136 | `moderateChat`: admin OR `team_manager` | Web: no TM |
| `lib/permissions-context.tsx` | 13 | `isTeamManager` boolean | **NOT ON WEB** |
| `lib/permissions-context.tsx` | 162-167 | Role booleans: isAdmin, isCoach, isTeamManager, isParent, isPlayer | Web missing isTeamManager, isPlayer broken |

### Critical Mismatches

1. **`team_staff` table never queried on web** — TM detection impossible
2. **`isPlayer` hardcoded to `null`** — player dashboard unreachable organically
3. **`isAdmin` check inconsistency** — AuthContext checks `'league_admin'` only; MainApp checks both `'league_admin'` and `'admin'`
4. **No `assistant_coach` distinction on web** — all coaches treated equally
5. **No `team_manager` in any web file** — zero references found

---

## 3. Route Access Matrix

### Routes WITH RouteGuard (22 total)

| Route Path | Line | Current Allow | TM Should Access? | Change Needed | Risk |
|-----------|------|--------------|-------------------|---------------|------|
| `/roster` | 795 | `['admin', 'coach']` | Yes (view only) | Add `'team_manager'` | Low |
| `/coaches` | 799 | `['admin', 'coach']` | No | None | None |
| `/registrations` | 800 | `['admin']` | No | None | None |
| `/jerseys` | 801 | `['admin']` | No | None | None |
| `/gameprep` | 810 | `['admin', 'coach']` | No | None | None |
| `/blasts` | 814 | `['admin', 'coach']` | Yes | Add `'team_manager'` | Low |
| `/notifications` | 815 | `['admin']` | No | None | None |
| `/reports` | 816 | `['admin']` | No | None | None |
| `/reports/funnel` | 817 | `['admin']` | No | None | None |
| `/admin/seasons/:seasonId` | 841 | `['admin']` | No | None | None |
| `/admin/seasons` | 842 | `['admin']` | No | None | None |
| `/settings/seasons` | 845 | `['admin']` | No | None | None |
| `/settings/templates` | 846 | `['admin']` | No | None | None |
| `/settings/waivers` | 847 | `['admin']` | No | None | None |
| `/settings/payment-setup` | 848 | `['admin']` | No | None | None |
| `/settings/organization` | 849 | `['admin']` | No | None | None |
| `/settings/data-export` | 850 | `['admin']` | No | None | None |
| `/settings/subscription` | 851 | `['admin']` | No | None | None |
| `/settings/venues` | 852 | `['admin']` | No | None | None |
| `/platform/admin` | 858 | `['admin']` | No | None | None |
| `/platform/analytics` | 859 | `['admin']` | No | None | None |
| `/platform/subscriptions` | 860 | `['admin']` | No | None | None |

### Routes WITHOUT RouteGuard (Need Protection)

| Route Path | Line | Component | Should Have Guard? | Recommended Allow | Risk |
|-----------|------|-----------|-------------------|-------------------|------|
| `/attendance` | 804 | AttendancePage | **YES** | `['admin', 'coach', 'team_manager']` | Medium |
| `/schedule/availability` | 803 | CoachAvailabilityPage | **YES** | `['admin', 'coach']` | Low |
| `/messages` | 788 | ParentMessagesPage | **YES** | `['parent']` | Low |
| `/invite` | 789 | InviteFriendsPage | **YES** | `['parent']` | Low |
| `/my-stuff` | 790 | MyStuffPage | **YES** | `['parent']` | Low |
| `/parent/register` | 791 | ParentRegistrationHub | **YES** | `['parent']` | Low |

### Routes Safe Without Guard (Role-Filtered Internally)

| Route Path | Line | Reason |
|-----------|------|--------|
| `/teams` | 798 | Accessible to all, data scoped by role |
| `/schedule` | 802 | Shows role-filtered data |
| `/standings` | 811 | Public data |
| `/leaderboards` | 812 | Public data |
| `/chats` | 813 | Scoped by channel membership |
| `/archives` | 818 | Public data |
| `/directory` | 819 | Public org directory |
| `/profile` | 855 | User's own profile |

---

## 4. Sidebar Nav Analysis

### Current Nav Groups (MainApp.jsx)

**Admin (lines 968-1008)** — 7 groups, 25 items:
- Dashboard (single)
- People: Teams & Rosters, Coaches
- Operations: Registrations, Jerseys, Schedule, Attendance & RSVP, Payments, Coach Availability
- Game Day: Game Prep, Standings, Leaderboards
- Communication: Chats, Announcements, Push Notifications
- Insights: Reports & Analytics, Registration Funnel, Season Archives, Org Directory
- Setup: Seasons, Registration Forms, Waivers, Payment Setup, Venues, Organization, Data Export, Subscription

**Coach (lines 1010-1037)** — 5 groups, dynamic team items:
- Dashboard (single)
- My Teams: Roster Manager, *[dynamic team wall links from `roleContext.coachInfo.team_coaches`]*
- Schedule (single)
- Game Day: Game Prep, Attendance, Standings, Leaderboards
- Communication: Team Chat, Announcements
- My Stuff: My Availability, Season Archives, Org Directory

**Parent (lines 1039-1061)** — 5 groups, dynamic child items:
- Home (single)
- My Players: *[dynamic child links from `roleContext.children`]*
- Social: Chat, Team Hub
- Payments (single)
- My Stuff: My Stuff, Registration, Archives, Directory

**Player (lines 1063-1081)** — 4 groups, dynamic team items:
- Home (single)
- My Team: *[dynamic team wall links from `roleContext.playerInfo.team_players`]*
- Schedule (single)
- Achievements (single)
- My Stuff: My Stats, Leaderboards, Standings, Profile & Stats

### Proposed Team Manager Nav Group

Based on mobile TM permissions (`lib/permissions.ts` lines 82-136):

```javascript
const teamManagerNavGroups = [
  { id: 'dashboard', label: 'Dashboard', type: 'single' },
  { id: 'myteams', label: 'My Teams', type: 'group', icon: 'teams', items: [
    { id: 'roster', label: 'Roster Manager', icon: 'users' },
    // Dynamic from team_staff query:
    ...(roleContext?.teamManagerInfo?.map(ts => ({
      id: `teamwall-${ts.team_id}`,
      label: ts.teams?.name,
      icon: 'users',
      teamId: ts.team_id,
    })) || [])
  ]},
  { id: 'schedule', label: 'Schedule', type: 'single' },
  { id: 'gameday', label: 'Game Day', type: 'group', icon: 'gameprep', items: [
    { id: 'attendance', label: 'Attendance', icon: 'check-square' },
    { id: 'standings', label: 'Standings', icon: 'star' },
    { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
  ]},
  { id: 'communication', label: 'Communication', type: 'group', icon: 'chats', items: [
    { id: 'chats', label: 'Team Chat', icon: 'message' },
    { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
  ]},
  { id: 'operations', label: 'Team Ops', type: 'group', icon: 'settings', items: [
    { id: 'payments', label: 'Payments', icon: 'dollar' },
  ]},
  { id: 'mystuff', label: 'My Stuff', type: 'group', icon: 'user', items: [
    { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
    { id: 'org-directory', label: 'Org Directory', icon: 'building' },
  ]},
]
```

### LynxSidebar Architecture

**File:** `src/components/layout/LynxSidebar.jsx` (370 lines)

The sidebar is fully **props-based** (line 120). It receives `navGroups` and iterates to render `NavItem` (single) or `CollapsibleGroupHeader` + sub-items (group). Adding a new role's nav group requires only:
1. Define the array in MainApp.jsx
2. Pass it when `activeView === 'team_manager'`

No sidebar component changes needed.

---

## 5. Dashboard Comparison (Per Role)

### Admin Dashboard

| Mobile Card | Web Equivalent | Parity | Priority |
|------------|---------------|--------|----------|
| MissionControlHero | OrgHealthHero + WelcomeBanner | Adapted | High |
| AdminAttentionStrip | AdminNotificationsCard | Adapted | High |
| AdminFinancialChart | OrgFinancials | Match | High |
| AdminTeamHealthCards | AllTeamsTable | Adapted (cards -> table) | Medium |
| OrgHealthChart | OrgHealthHero | Match | High |
| AdminActionPills | AdminQuickActions | Match | High |
| OrgPulseFeed | **MISSING** | Missing | Low |
| AdminTrophyBar | **MISSING** | Missing | Low |
| AdminAmbientCloser | **MISSING** | Skip (mobile-only) | Skip |
| Search Bar | Command Palette (Cmd+K) | Adapted | Medium |

### Coach Dashboard

| Mobile Card | Web Equivalent | Parity | Priority |
|------------|---------------|--------|----------|
| Compact Greeting | WelcomeBanner | Adapted | High |
| DynamicMessageBar | **MISSING** | Missing | High |
| GameDayHeroCard | CoachHeroCarousel | Match | High |
| ManagerPaymentCard | **MISSING** | Missing (TM only) | Medium |
| ManagerAvailabilityCard | **MISSING** | Missing (TM only) | Medium |
| ManagerRosterCard | **MISSING** | Missing (TM only) | Medium |
| MomentumCardsRow | **MISSING** | Missing | Medium |
| SquadFacesRow | SquadRosterCard | Adapted | High |
| SmartNudgeCard | **MISSING** | Missing | Medium |
| CoachEngagementCard | **MISSING** | Missing | Low |
| ActionGrid2x2 | CoachTools | Adapted | High |
| CoachPulseFeed | **MISSING** | Missing | Low |
| CoachTrophyCase | AchievementsCard | Match | Low |
| TeamStatsChart | TopPlayersCard | Adapted | Medium |
| AmbientCloser | **MISSING** | Skip (mobile-only) | Skip |

### Parent Dashboard

| Mobile Card | Web Equivalent | Parity | Priority |
|------------|---------------|--------|----------|
| FamilyHeroCard | ParentChildHero | Match | High |
| ParentPaymentNudge | BalanceDue | Match | High |
| ParentAttentionStrip | ActionRequired | Match | High |
| FamilyKidCard | ParentChildHero (integrated) | Match | High |
| ParentEventHero | NextEventCard | Match | High |
| ParentMomentumRow | **MISSING** | Missing | Medium |
| FamilyPulseFeed | **MISSING** | Missing | Low |
| ParentTeamHubCard | TeamHubCard | Match | High |
| ParentTrophyBar | **MISSING** | Missing | Low |
| RegistrationCard | **MISSING** | Missing | Low |
| ParentAmbientCloser | **MISSING** | Skip (mobile-only) | Skip |
| ParentJourneyCard | ParentJourneyCard | Match | High |

### Player Dashboard

| Mobile Card | Web Equivalent | Parity | Priority |
|------------|---------------|--------|----------|
| PlayerIdentityHero | PlayerHeroCard | Match | High |
| CompetitiveNudge | **MISSING** | Missing | High |
| PlayerQuickLinks | **MISSING** | Missing | Medium |
| PlayerQuestEntryCard | **MISSING** | Missing | High |
| PlayerChallengeCard | DailyChallengeCard | Adapted | High |
| PlayerLeaderboardPreview | **MISSING** | Missing | Medium |
| PlayerPropsSection | ShoutoutCard | Match | High |
| PlayerTeamHubCard | **MISSING** | Missing | Medium |
| PlayerContinueTraining | **MISSING** | Missing | Low |
| NextUpCard | NextEventCard | Match | High |
| PlayerMomentumRow | **MISSING** | Missing | High |
| LastGameStats | LastGameCard | Match | High |
| PlayerTrophyCase | TrophyCaseCard | Match | High |
| PlayerTeamActivity | **MISSING** | Missing | Low |
| PlayerAmbientCloser | **MISSING** | Skip (mobile-only) | Skip |
| Streak Widget | Streak badge (conditional) | Adapted | High |
| TodayXP | TodayXPCard | Match | High |
| ScoutingReport | ScoutingReportCard | Match | High |

### Summary: Dashboard Card Gaps by Priority

| Role | Critical Missing | Total Gaps | Most Important Add |
|------|-----------------|------------|-------------------|
| **Player** | 7 cards | 9 total | CompetitiveNudge, QuestEntry, MomentumRow |
| **Coach** | 3 cards + 3 TM cards | 8 total | DynamicMessageBar, MomentumCards |
| **Parent** | 1 card | 4 total | ParentMomentumRow |
| **Admin** | 0 cards | 2 total | OrgPulseFeed |

---

## 6. Feature Gap Register

| Feature | Mobile Status | Web Status | Parity | Desktop Approach | Priority | Dependencies | Files Affected |
|---------|--------------|------------|--------|-----------------|----------|-------------|----------------|
| **Team Manager Role** | Complete (dashboard, setup wizard, permissions) | Zero implementation | Missing | New dashboard page + nav group + role detection | Critical | `team_staff` table query | MainApp.jsx, AuthContext.jsx, new TMDashboard |
| **Quest System (Daily)** | `quest-engine.ts` (1056 lines), 3 daily quests | None | Missing | Full page + dashboard widget | High | Quest tables exist in Supabase | New QuestsPage.jsx, quest hooks |
| **Quest System (Weekly)** | Weekly quests with bonus tracking | None | Missing | Same page as daily | High | Same as daily | Same files |
| **Quest System (Team)** | `team-quest-engine.ts` (297 lines) | None | Missing | Coach dashboard panel + team page | High | Team quest tables | Same files |
| **XP Boost Engine** | `xp-boost-engine.ts` (170 lines), game/practice multipliers | None | Missing | Background engine, badge on dashboard | Medium | xp_boost_events table | New lib/xp-boost-engine.js |
| **XP Leaderboard** | `leaderboard-engine.ts` (333 lines), weekly rankings + tiers | Stat-based leaderboard only | Conflicting | Add XP tab to existing leaderboard page | High | league_standings table | SeasonLeaderboardsPage.jsx |
| **Coach Engagement Dashboard** | `coach-engagement.tsx` (741 lines), 6 sections | None | Missing | Full page: player breakdown, quest rates, streaks | Medium | Quest data, profiles.total_xp | New CoachEngagementPage.jsx |
| **Notification Inbox** | `notification-inbox.tsx`, user-facing inbox | Admin push config only | Missing | Dropdown inbox in header + notification page | High | player_notifications table | New NotificationInbox.jsx, MainApp.jsx |
| **Shoutout Received Flow** | `ShoutoutReceivedModal.tsx`, carousel + celebration | Give + display only, no received | Partial | Toast notification + inbox entry | Medium | Shoutout unseen tracking | New ShoutoutReceivedModal.jsx |
| **Shoutout Profile Stats** | `ShoutoutProfileSection.tsx`, given/received counts | None | Missing | Profile page section | Low | shoutouts table | MyProfilePage.jsx |
| **Journey/Skill Modules** | `skill-module.tsx` (803 lines), 3-step progression | None | Missing | Full page with tip/drill/quiz flow | Low | Journey tables | New SkillModulePage.jsx |
| **Journey Path (World Map)** | `journey.tsx` (759 lines), Mario-style map | None | Missing | Skip for web (mobile-optimized) | Skip | N/A | N/A |
| **Role-Specific Empty States** | 3 components (NoTeam, NoOrg, PendingApproval) with CTAs | Generic EmptyState (40 lines) | Partial | Enhance EmptyState with role variants | Medium | None | EmptyState.jsx, page files |
| **TM Setup Wizard** | `team-manager-setup.tsx` (809 lines), 4-step flow | SetupWizard has TM option but creates admin role | Conflicting | Add TM-specific setup flow | Medium | team_staff table, team_invite_codes | SetupWizard.jsx or new page |
| **Invite Code System** | `InviteCodeModal.tsx`, generate + share codes | None | Missing | Modal accessible from TM dashboard | Medium | team_invite_codes table | New InviteCodeModal.jsx |

---

## 7. Database Table Usage

| Supabase Table | Used by Mobile? | Used by Web? | Gap | Risk |
|---------------|----------------|-------------|-----|------|
| `user_roles` | Yes | Yes | None | None |
| `profiles` | Yes | Yes | Web doesn't update `total_xp`, `player_level` | Low |
| `team_staff` | Yes (TM detection) | **NO** | Critical — TM role invisible | High |
| `team_invite_codes` | Yes (TM invites) | **NO** | TM can't generate codes | Medium |
| `daily_quests` | Yes (quest engine) | **NO** | No quest UI | Medium |
| `weekly_quests` | Yes (quest engine) | **NO** | No quest UI | Medium |
| `team_quests` | Yes (team quests) | **NO** | No team quest UI | Medium |
| `team_quest_contributions` | Yes (team quests) | **NO** | No contribution tracking | Medium |
| `xp_ledger` | Yes (XP awards) | **NO** | No XP tracking | Medium |
| `xp_boost_events` | Yes (XP multipliers) | **NO** | No boost system | Low |
| `league_standings` | Yes (weekly leaderboard) | **NO** | Web uses `player_season_stats` instead | Medium |
| `quest_bonus_tracking` | Yes (daily/weekly bonuses) | **NO** | No bonus tracking | Low |
| `early_bird_claims` | Yes (RSVP XP bonus) | **NO** | No early bird system | Low |
| `player_notifications` | Yes (user inbox) | **NO** | No user notification inbox | High |
| `player_guardians` | Yes (parent detection) | **NO** | Web uses `players.parent_account_id` | Low |
| `notifications` | No | Yes (admin config) | Different purpose | None |
| `notification_templates` | No (hardcoded) | Yes (DB-driven) | Different approach | None |
| `shoutouts` | Yes | Yes | Match | None |
| `shoutout_categories` | Yes | Yes | Match | None |
| `team_posts` | Yes | Yes | Match | None |
| `post_reactions` | Yes | Yes | Match | None |
| `achievements` | Yes | Yes | Match | None |
| `player_achievements` | Yes | Yes | Match | None |
| `coach_challenges` | Yes | Yes | Match | None |
| `schedule_events` | Yes | Yes | Match | None |
| `payments` | Yes | Yes | Match | None |
| `chat_channels` | Yes | Yes | Match | None |

---

## 8. Design System Drift Report

### LYNX-UX-PHILOSOPHY.md Key Rules

- Progressive disclosure (empty sections collapse, not placeholder)
- 3-column spatial layout (left=identity, center=active work, right=context)
- Colors: Navy #10284C, Sky #4BB9EC, Gold #FFD700
- Typography: Tele-Grotesk (per doc) — **NOT USED ON WEB**
- Cards: glassmorphism, rounded-2xl, consistent shadows

### Compliance Spot-Check (5 Pages)

| Page | `text-r-*` Tokens | `lynx-*` Colors | Glassmorphism | `rounded-2xl` | Score |
|------|-------------------|-----------------|---------------|---------------|-------|
| DashboardPage.jsx (Admin) | 95% | 80% — hardcoded `#0D1B3E`, `#F0F3F7` at line 1501-1516 | Yes | Yes | 85% |
| CoachDashboard.jsx | 90% | 90% — uses `bg-lynx-charcoal`, `text-lynx-sky` | Yes | Yes | 90% |
| ParentDashboard.jsx | 85% | 85% — some `bg-slate-*` raw tokens | Yes | Yes | 85% |
| PlayerDashboard.jsx | 80% | 75% — hardcoded `#0D1B3E` at line 41-42, `style={{ background: '#0D1B3E' }}` | Yes | Yes | 80% |
| DashboardGrid.jsx | 90% | 70% — `bg-[#4BB9EC]` at line 406, `rgba(75,185,236,0.12)` in CSS | Yes | Yes | 75% |

### Specific Deviations Found

1. **DashboardPage.jsx line 1501-1516**: `text-[#0D1B3E]/60` and `bg-[#F0F3F7]` — should use `text-lynx-navy/60` and `bg-lynx-cloud`
2. **DashboardGrid.jsx line 406**: `bg-[#4BB9EC]` — should use `bg-lynx-sky`
3. **PlayerDashboard.jsx lines 41-42**: `background: '#0D1B3E'` inline style — should use `bg-lynx-navy`
4. **WidgetLibraryPanel.jsx line 45**: `bg-[#0A1628]` — should use `bg-lynx-midnight`
5. **index.css line 46**: `rgba(75, 185, 236, 0.12)` — should use Tailwind `border-lynx-sky/12`

### Typography Status

| Config | Expected | Actual | Impact |
|--------|----------|--------|--------|
| `tailwind.config.js` line 91 | `Tele-Grotesk` (per UX doc) | `Inter` + system-ui fallback | Acceptable divergence |
| `index.css` lines 1-8 | Tele-Grotesk @font-face | Inter Variable .ttf | Web-safe choice |
| Mobile codebase | Tele-Grotesk throughout | N/A | Creates visual diff mobile vs web |

### Assessment: 80-85% compliant

The design system is well-adopted. ~10-15 hardcoded hex colors scattered across components. Typography uses Inter (practical) instead of Tele-Grotesk (branded). New features will inherit correct tokens from existing patterns. Cleanup is incremental, not blocking.

---

## 9. Shell Health Assessment

### Q1: Is the current web shell stable enough to receive new roles and features?

**YES.** The shell architecture is solid:
- `LynxSidebar.jsx` is fully props-based (line 120) — adding `teamManagerNavGroups` requires zero sidebar changes
- `DashboardContainer.jsx` is a lightweight wrapper (13 lines) — provides responsive padding only
- `RouteGuard.jsx` is simple and extensible — just add `'team_manager'` to `allow` arrays
- Dashboard routing (MainApp.jsx line 774-779) is a ternary chain — adding a `team_manager` case is one line

**One fix needed first:** Add `team_staff` query to `loadRoleContext()` and add `isTeamManager` to the roleContext object.

### Q2: Is the responsive/sizing system working?

**YES.** The responsive system is fully active and working:
- `text-r-*` clamp-based tokens defined in `tailwind.config.js` lines 100-119
- `gap-r-*` responsive spacing tokens used in `DashboardGrids.jsx`
- React-grid-layout handles breakpoints (lg/md/sm/xs) automatically
- `ResizeObserver` in `DashboardGrid.jsx` (line 34-60) handles container width changes
- No "everything is too big" problem — clamp scaling works correctly

### Q3: Is the design system being followed?

**Mostly (80-85%).** The core design language is consistent:
- Glassmorphism card pattern uniformly applied
- `lynx-*` color tokens widely used
- `rounded-2xl` standard for cards
- ~10-15 instances of hardcoded hex colors (cosmetic, not structural)
- Typography divergence (Inter vs Tele-Grotesk) is acceptable for web

### Q4: Does the web follow its own UX philosophy doc?

**Partially:**
- **Each dashboard has a primary job:** Yes — Admin=org health, Coach=team readiness, Parent=family actions, Player=personal progress
- **Priority stack:** Yes — all dashboards have hero → actions → details ordering
- **Drill-downs vs inline:** Mostly yes — modals for detail, navigation for full pages
- **3-column layout:** Not consistently applied — dashboards use widget grid which is flexible but not rigidly 3-column

### Q5: What is the single biggest structural problem on web right now?

**The role detection chain is incomplete.** Specifically:
1. `isPlayer` is hardcoded to `null` — no user can ever organically reach the player dashboard
2. No `team_staff` query — Team Managers are invisible to the system
3. Unrecognized `activeView` values fall through to the admin dashboard — a TM user would see admin UI with no access

This means every feature that depends on correct role detection (dashboards, nav, route guards, data scoping) is potentially broken for two out of six roles. Fixing this is the foundation everything else builds on.

---

## 10. Risk Register

| # | Risk | Severity (1-5) | Likelihood (1-5) | Impact Description | Mitigation |
|---|------|----------------|-------------------|-------------------|------------|
| 1 | TM user logs into web, sees admin dashboard | 5 | 4 | Data exposure, wrong navigation, confusing UX | Add `team_staff` query to `loadRoleContext()`, add TM dashboard fallback |
| 2 | `activeView='team_manager'` set but no dashboard handles it | 4 | 3 | Falls through to admin DashboardPage (wrong content) | Add `team_manager` case to dashboard ternary chain |
| 3 | TM navigates to `/gameprep` — not blocked | 3 | 3 | TM accesses coach-only game prep features | Add `'team_manager'` to RouteGuard where appropriate, NOT to game prep |
| 4 | Quest engine writes to `daily_quests` — web reads nothing | 2 | 5 | No conflict (web doesn't read), but missed engagement data | Port quest engine to web as lib module |
| 5 | Coach switches to TM view via role switcher | 4 | 2 | No `teamManagerNavGroups` defined — sidebar breaks or shows empty | Define nav groups before enabling TM in role switcher |
| 6 | Simultaneous mobile+web — both write to same tables | 2 | 3 | Shoutouts/challenges could double-count XP if both fire at once | XP ledger entries are idempotent by source_id, low risk |
| 7 | Widget grid — no default layout for TM role | 3 | 4 | `layoutService.js` returns null, grid renders empty | Add default TM layout or fall back to coach layout |
| 8 | `isPlayer` hardcoded null — player dashboard unreachable | 3 | 5 | Player role users can't access their dashboard | Fix `playerSelf` query in `loadRoleContext()` |
| 9 | 6 routes lack RouteGuard — accessible to wrong roles | 3 | 3 | `/attendance`, `/messages`, `/my-stuff` etc. accessible to all | Add RouteGuard wrappers to unprotected routes |
| 10 | Empty states show nothing — users hit dead ends | 2 | 4 | Pages render empty when no data, no guidance to user | Enhance EmptyState with role-specific variants and CTAs |

---

## 11. Recommended Execution Order

### Phase 0: Role Foundation (MUST DO FIRST)
**What:** Fix `loadRoleContext()` to query `team_staff`, add `isTeamManager` boolean, fix `isPlayer` (remove hardcoded null), add `'team_manager'` to `getAvailableViews()` and dashboard routing
**Depends on:** Nothing
**Enables:** Everything else (TM dashboard, route guards, nav, features)
**Scope:** S (3-4 files, ~50 lines changed)
**Risk:** Low — additive changes only

### Phase 1: Route Guards + Nav Groups
**What:** Add RouteGuard to 6 unprotected routes, define `teamManagerNavGroups`, add to sidebar rendering logic
**Depends on:** Phase 0
**Enables:** Secure TM web access, correct navigation
**Scope:** S (MainApp.jsx + RouteGuard additions)
**Risk:** Low

### Phase 2: TM Dashboard (Minimum Viable)
**What:** Create `TeamManagerDashboard.jsx` with payment health, roster count, next event, quick actions. Port `useTeamManagerData` hook logic.
**Depends on:** Phase 0, Phase 1
**Enables:** TM users can log in and see relevant data
**Scope:** M (1 new page, 1 new hook, widget definitions)
**Risk:** Low

### Phase 3: Quest/XP Engine Data Layer
**What:** Port `quest-engine.ts`, `team-quest-engine.ts`, `xp-boost-engine.ts`, `leaderboard-engine.ts` to web as vanilla JS. Create React hooks (`useQuestEngine`, `useWeeklyQuests`, `useTeamQuests`).
**Depends on:** Nothing (parallel with Phase 2)
**Enables:** Quest UI, XP leaderboard, engagement dashboard
**Scope:** M (4 engine files to port, 4 hooks to create)
**Risk:** Low — engines are 80-100% portable

### Phase 4: Notification Inbox
**What:** Create user-facing notification inbox (dropdown in header + page). Read from `player_notifications` table. Add unseen badge count.
**Depends on:** Nothing (parallel with Phase 3)
**Enables:** Users see quest/engagement/system notifications
**Scope:** M (1 new component, 1 new page, header integration)
**Risk:** Low

### Phase 5: Quest UI + XP Leaderboard
**What:** Create `QuestsPage.jsx` with daily/weekly/team sections. Add XP tab to `SeasonLeaderboardsPage.jsx`. Add quest dashboard widgets per role.
**Depends on:** Phase 3
**Enables:** Full quest/XP engagement loop on web
**Scope:** L (1 new page, 1 modified page, 4 dashboard widgets)
**Risk:** Medium — UI complexity

### Phase 6: Dashboard Card Gaps
**What:** Add missing dashboard cards per role priority: Player (CompetitiveNudge, QuestEntry, MomentumRow), Coach (DynamicMessageBar, MomentumCards), Parent (MomentumRow), Admin (PulseFeed)
**Depends on:** Phase 3, Phase 5
**Enables:** Dashboard parity with mobile
**Scope:** L (10-15 new widget components)
**Risk:** Low

### Phase 7: Shoutout Received Flow + Empty States
**What:** Add shoutout received celebration (toast/modal), unseen tracking (localStorage instead of AsyncStorage). Enhance EmptyState with role-specific variants.
**Depends on:** Nothing (parallel)
**Enables:** Complete engagement loop, better empty page UX
**Scope:** S-M (2-3 new components, EmptyState enhancement)
**Risk:** Low

### Phase 8: Coach Engagement Dashboard
**What:** Create `CoachEngagementPage.jsx` with 6 sections: team summary, inactive alerts, player breakdown, streak leaderboard, journey progress, quest completion rates.
**Depends on:** Phase 3, Phase 5
**Enables:** Coach visibility into player engagement
**Scope:** M (1 new page, 1 hook)
**Risk:** Low

### Phase 9: Design System Cleanup
**What:** Replace ~10-15 hardcoded hex colors with `lynx-*` tokens. Fix `bg-[#4BB9EC]` → `bg-lynx-sky`, `#0D1B3E` → `bg-lynx-navy`, etc.
**Depends on:** Nothing (parallel, anytime)
**Enables:** Consistent styling for all new features
**Scope:** S (find-and-replace across 5-8 files)
**Risk:** None

---

## 12. Open Questions

1. **Should TM have access to Game Prep on web?** Mobile doesn't give TM access to game prep. But some club TMs might want to set lineups. Carlos to decide.

2. **Should web support TM team creation (setup wizard)?** Mobile lets TM create micro-orgs and teams. Web currently only has admin org creation. Should TM be able to create teams from web, or is that mobile-only?

3. **Should the web leaderboard add an XP tab alongside stats, or replace the stat leaderboard?** Currently `SeasonLeaderboardsPage.jsx` is stat-based (kills, aces, etc.) while mobile leaderboard is XP-based. Should web have both views?

4. **Is Tele-Grotesk licensed for web?** The UX philosophy doc says both platforms should use Tele-Grotesk, but web uses Inter. If the font is available for web, we should switch. If not, Inter is acceptable.

5. **Should `isPlayer` auto-detect via `players` table?** Mobile auto-detects player role via `checkPlayerSelf()`. The web has `playerSelf = null` hardcoded. Should we replicate mobile's auto-detection, or does Carlos want player view limited to admin/coach preview?

6. **What is the TM team limit for web?** Mobile has a free tier limit of 1 team per TM. Should web enforce the same limit?

7. **Should the notification inbox show system notifications or only engagement notifications?** Mobile `player_notifications` covers quests, streaks, XP, leaderboard. Web `notifications` table covers admin push (game reminders, payments). Should the inbox merge both or keep them separate?

8. **Which dashboard cards should be widgets (draggable) vs fixed sections?** Current architecture makes all dashboard content draggable via react-grid-layout. Some mobile cards (like attention strips, greeting banners) might be better as fixed elements above the widget grid.

---

*Report generated by Claude Code (Opus 4.6) on March 19, 2026. All findings are based on code inspection of both repositories at the specified branches. No code was modified during this investigation.*
