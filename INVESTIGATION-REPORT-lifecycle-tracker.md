# INVESTIGATION REPORT: Lifecycle Tracker — Dashboard Architecture
**Date:** 2026-04-12
**Branch:** main
**Latest commit:** 3bb682c — docs: investigation report — waiver data verification

---

## 1. Existing Season Journey Stepper

### Component Details

**Three separate journey/stepper systems exist:**

#### A. SeasonStepper (the horizontal stepper in ProgramPage)
- **File:** `src/components/v2/admin/SeasonStepper.jsx`
- **Lines:** 105
- **Props:** `seasonName`, `steps`, `completedCount`, `totalCount`, `onNavigate`
- **Used in:** `src/pages/programs/ProgramPage.jsx` (lines 1182-1191) — NOT DashboardPage
- **Visibility condition:** Admin only, hidden when all steps complete (`setupComplete < setupTotal`)

#### B. SeasonWorkflowTracker (10-step workflow for Season Management)
- **File:** `src/pages/admin/SeasonWorkflowTracker.jsx`
- **Lines:** 113
- **Props:** `stepCompletion = {}`, `activeStep`, `onStepClick`
- **Used in:** `src/pages/admin/SeasonManagementPage.jsx` (at `/admin/seasons/:seasonId`)
- **Not used on the dashboard.**

#### C. GettingStartedGuide (day-zero onboarding in DashboardPage)
- **File:** `src/pages/dashboard/DashboardPage.jsx` (lines 58-296, inline)
- **Lines:** ~240 (part of DashboardPage)
- **Props:** `onNavigate`
- **Used in:** DashboardPage, rendered when no season exists

### Step Completion Logic

#### SeasonStepper (ProgramPage) — 5 Steps

| Step | Completion Check | Data Source |
|------|-----------------|-------------|
| Add Teams | `teams.length > 0` | ProgramPage's `teams` state |
| Add Players | `totalPlayers > 0` | ProgramPage's player count |
| Create Schedule | `events.length > 0` | ProgramPage's events data |
| Open Registration | `registrations.length > 0` | ProgramPage's registrations |
| Set Up Payments | `payments.length > 0` | ProgramPage's payments |

All checks are simple `length > 0` counts. Status is computed inline as `'done'`, `'current'` (first incomplete), or `'upcoming'`. Data is passed as props from ProgramPage (not queried inside the component).

#### SeasonWorkflowTracker (SeasonManagementPage) — 10 Steps

| Step | Completion Check | Data Source |
|------|-----------------|-------------|
| Create Season | Always 100% (season exists) | Implicit |
| Open Registration | `season.registration_open OR totalPlayers > 0` | Season record + players table |
| Manage Registrations | `(totalPlayers - pendingRegs) / totalPlayers * 100` | players + registrations tables |
| Collect Payments | `totalCollected / totalExpected * 100` | payments table |
| Assign Teams | `rosteredPlayers / totalPlayers * 100` | team_players table |
| Assign Coaches | `teamsWithCoach / totalTeams * 100` | team_coaches table |
| Set Positions | Always 100% (not implemented) | N/A |
| Create Schedule | `teamsWithEvents / totalTeams * 100` | schedule_events table |
| Uniforms/Jerseys | Always 100% (separate tracking) | N/A |
| Verify & Launch | Average of all other steps | Derived |

Completion is expressed as percentage (0-100), not binary. Queries run in `SeasonManagementPage.loadStepCompletion()` on season change.

#### GettingStartedGuide (DashboardPage) — 7 Steps

| Step | Completion Check | Data Source |
|------|-----------------|-------------|
| Create Org | `Boolean(organization?.id)` | AuthContext |
| Org Setup | `organization?.settings?.setup_complete` OR `journeyCompletedSteps.includes('org_setup')` | AuthContext + JourneyContext |
| Create Season | `journeyCompletedSteps.includes('create_season')` | JourneyContext |
| Add Teams | `journeyCompletedSteps.includes('add_teams')` | JourneyContext |
| Add Coaches | `journeyCompletedSteps.includes('add_coaches')` | JourneyContext |
| Create Schedule | `journeyCompletedSteps.includes('create_schedule')` | JourneyContext |
| Open Registration | `journeyCompletedSteps.includes('open_registration')` | JourneyContext |

Steps are tracked via `JourneyContext.completedSteps` (manually marked via `completeStep(stepId)`), persisted to `profile.onboarding_data`. Only `create_org` and `org_setup` use actual data checks; the rest rely on manual marking.

### Rendering Location

- **SeasonStepper** renders at the bottom of the BodyTabs in ProgramPage (`/programs/:programId`), below tab content. Conditionally rendered: admin only, hides when all 5 steps are done.
- **SeasonWorkflowTracker** renders at the top of SeasonManagementPage (`/admin/seasons/:seasonId`), above step content.
- **GettingStartedGuide** renders as the **entire dashboard content** when no season is selected (`!seasonLoading && !selectedSeason`). It replaces the full V2DashboardLayout, not just a section.

---

## 2. Dashboard Page Architecture

### File: `src/pages/dashboard/DashboardPage.jsx` — 1,715 lines

Only file in `src/pages/dashboard/`.

### Layout Hierarchy

```
DashboardPage (export)
├─ [Early return] GettingStartedGuide          // When !selectedSeason
├─ [Early return] SkeletonDashboard             // When loading
├─ [Early return] Empty state (brand new org)   // When totalTeams === 0 && !selectedSeason
│
└─ V2DashboardLayout                            // Main active dashboard
   ├─ mainContent:
   │   ├─ HeroCard (org stats: teams, players, coaches, programs, revenue, actions)
   │   ├─ MascotNudge (waiver reminder, conditional)
   │   ├─ AttentionStrip (action items: pending regs, overdue payments, etc.)
   │   └─ Program Cards Grid (one card per program, replaces old BodyTabs)
   │       └─ ProgramCard × N (stats, action items, season statuses)
   │
   ├─ sideContent:
   │   ├─ FinancialSnapshot (revenue breakdown by fee type)
   │   ├─ ThePlaybook (quick actions: New Program, Reg Link, Blast, Reports, Settings)
   │   ├─ WeeklyLoad (upcoming events list)
   │   └─ [Engagement Cards] (see below)
   │
   └─ engagementContent:
       ├─ EngagementLevelCard (admin XP/level)
       ├─ EngagementActivityCard (weekly blasts, regs, revenue)
       ├─ EngagementBadgesCard (earned/total badges)
       └─ EngagementTeamPulseCard (active/drifting/inactive players)
```

### Tab System

**Status: COMMENTED OUT (lines 1500-1598)**

The old tab system existed with 5 tabs:
- `action-items` (badge: `actionCount || 0`)
- `teams` (AdminTeamsTab)
- `registrations` (badge: `stats.pending || 0`)
- `payments` (AdminPaymentsTab)
- `schedules` (AdminScheduleTab)

**Current state:**
- `activeTab` state variable still initialized to `'teams'` (line 349)
- `setActiveTab` setter exists
- Only used by AttentionStrip "REVIEW NOW" click → `setActiveTab('action-items')` (line 1398)
- **BodyTabs component replaced by Program Cards Grid in Phase 3 redesign**
- Comment at line 1425: "Phase 3: SeasonCarousel + BodyTabs moved to ProgramPage"

**Tab content components still exist as separate files** (can be reused):
- `src/components/v2/admin/AdminTeamsTab.jsx`
- `src/components/v2/admin/AdminRegistrationsTab.jsx`
- `src/components/v2/admin/AdminPaymentsTab.jsx`
- `src/components/v2/admin/AdminScheduleTab.jsx`

### Data Fetched on Mount

**Global Per-Season Stats (useEffect, lines 398-524):**

| # | Table | Filters | State Variable | Used By |
|---|-------|---------|---------------|---------|
| 1 | teams | season_id in allSeasons | perSeasonTeamCounts | Hero, ProgramCards |
| 2 | players | season_id in allSeasons, with registrations | perSeasonPlayerCounts, pendingRegsBySeason | Hero, AttentionStrip |
| 3 | payments | season_id in allSeasons | allPaymentsRaw, globalStats | FinancialSnapshot, Hero |
| 4 | team_coaches | team_id in all teams | globalCoachCount | Hero |

**Season-Scoped Data (loadDashboardData, lines 550-1149):**

| # | Table | Filters | State Variable | Used By |
|---|-------|---------|---------------|---------|
| 5 | teams | season_id = selected | teamsData | ProgramCards, Hero |
| 6 | team_players | team_id in teams | actualRosteredCount | AttentionStrip |
| 7 | players | season_id = selected, with registrations | registrationPlayers | ProgramCards |
| 8 | team_players | team_id = filtered | teamPlayerIds | Unrostered count |
| 9 | payments | season_id = selected | stats.collected/outstanding | FinancialSnapshot |
| 10 | schedule_events | team_id in teams, future | upcomingEvents | WeeklyLoad |
| 11 | player_season_stats | season_id, with player/team | topPlayers | (unused in current layout) |
| 12 | team_coaches | team_id in teams | coachCount | Hero |
| 13 | coaches | id in coach IDs, with profiles | coachesData | (unused in current layout) |
| 14 | waiver_templates | org_id, is_active | activeWaivers | MascotNudge |
| 15 | waiver_signatures | waiver_id, season_id, NOT signed | unsignedWaivers | AttentionStrip |
| 16 | team_players | all | allPlayers for unrostered | AttentionStrip |
| 17 | schedule_events | per team, scores | perTeamStats (W/L record) | ProgramCards |
| 18 | payments | season_id, with player names | recentPaymentsNamed | (unused in current layout) |
| 19 | player_achievements | player_id = user.id | adminBadges | EngagementBadgesCard |
| 20 | achievements | is_active, count | totalAchievements | EngagementBadgesCard |
| 21 | messages | sender_id = user, this week | weeklyBlasts | EngagementActivityCard |
| 22 | players | season_id, this week | weeklyRegs | EngagementActivityCard |
| 23 | payments | paid, this week | weeklyRevenue | EngagementActivityCard |
| 24 | team_players | all roster | allPlayers2 for pulse | EngagementTeamPulseCard |
| 25 | xp_ledger | player_id in roster | adminPulseData | EngagementTeamPulseCard |
| 26 | player_achievement_progress | player_id = user | nextBadgeProgress | EngagementActivityCard |

**Total: ~26 Supabase queries on full dashboard load**

---

## 3. Data Layer

### Tracker Data Availability

| Step | Data Needed | Already Available? | Additional Query Needed |
|------|------------|-------------------|------------------------|
| Season created | Season exists for this org | YES — `selectedSeason` from SeasonContext | None |
| Teams created | teams count > 0 | YES — `stats.teams` or `perSeasonTeamCounts` | None |
| Coaches assigned | team_coaches for these teams | YES — `coachCount` (query #12) or `globalCoachCount` (query #4) | None |
| Players added | players count > 0 | YES — `stats.totalRegistrations` or `perSeasonPlayerCounts` | None |
| Registration open | reg template published OR registrations exist | PARTIAL — `registrationPlayers` has registration data; no direct `registration_open` flag query | May need `registration_templates` query for "link published" |
| Schedule built | events count > 0 | YES — `upcomingEvents.length` (query #10) | None |
| Registrations processed | registrations with status='approved' | PARTIAL — `stats.pending` exists (derived from registrations); would need `stats.approved` | Minor derivation from existing query #7 |
| Payments collected | payments.paid > 0 | YES — `stats.collected` (query #9) | None |
| Announcement sent | blasts count > 0 | YES — `weeklyBlasts` (query #21) but only counts this week | May need all-time blast count for season |
| Waivers signed | waiver_signatures count | YES — `stats.unsignedWaivers` (query #15) | None |

### Season Scoping

**Season filter from SeasonContext:**
- `selectedSeason` — current season object or `null` (all seasons)
- `isAllSeasons(selectedSeason)` — boolean check for "All Seasons" mode
- When "All Seasons": uses pre-aggregated `globalStats`, skips `loadDashboardData()`
- When single season: runs full `loadDashboardData()` with season-scoped queries
- Season change triggers data reload via `useEffect` dependency

**The tracker should scope to `selectedSeason`** since it's per-season lifecycle tracking. When "All Seasons" is selected, the tracker could either show aggregate progress or prompt the user to select a specific season.

---

## 4. Coach Dashboard

### Architecture

**Separate component — NOT DashboardPage.jsx**

- **File:** `src/pages/roles/CoachDashboard.jsx`
- **Lines:** 1,081
- **Route:** `/dashboard` when `activeView === 'coach'` (MainApp.jsx lines 709-710)
- **Props:** `roleContext`, `navigateToTeamWall`, `showToast`, `onNavigate`, `activeView`, `availableViews`, `onSwitchRole`

### Coach Dashboard Layout

```
CoachDashboard
├─ V2DashboardLayout
│   ├─ mainContent:
│   │   ├─ HeroCard (greeting + 4 stats: roster, attendance%, W-L, no-RSVP)
│   │   ├─ TeamSwitcher (horizontal pill selector for assigned teams)
│   │   ├─ MascotNudge (RSVP reminder, conditional)
│   │   ├─ AttentionStrip (pending stats, RSVPs, missing jerseys)
│   │   └─ BodyTabs (5 tabs — ACTIVE, unlike admin dashboard)
│   │       ├─ Roster (CoachRosterTab)
│   │       ├─ Schedule (CoachScheduleTab)
│   │       ├─ Stats & Evals (CoachStatsTab)
│   │       ├─ Game Prep (CoachGamePrepTab)
│   │       └─ Engagement (CoachEngagementTab)
│   │
│   ├─ engagementContent:
│   │   ├─ CoachLevelCard
│   │   ├─ CoachActivityCard
│   │   ├─ CoachBadgesCard
│   │   └─ TeamPulseCard
│   │
│   └─ sideContent:
│       ├─ GameDayCard (next game matchup)
│       ├─ WeeklyLoad (this week's events)
│       ├─ ThePlaybook (6 quick actions)
│       └─ ShoutoutCard (weekly summary)
│
└─ Modals: EventDetail, PlayerCard, CoachBlast, GiveShoutout
```

### Existing Onboarding

**NO dedicated coach onboarding exists.** When a coach has no assigned teams, they see a simple "No Teams Assigned" empty state (lines 821-832). No checklist, wizard, or getting-started flow.

### Tracker Data Sources

| Step | Table | Query Pattern | Exists in CoachDashboard? |
|------|-------|--------------|--------------------------|
| Review Roster | team_players | count per team | YES — `roster` state (line 257-283) |
| Check Schedule | schedule_events | upcoming for team | YES — `upcomingEvents` (line 292-309) |
| Set Lineup | game_lineups | count for next game | YES — `lineupSetForNextGame` (line 557-568) |
| Take Attendance | event_rsvps | RSVP counts | YES — `rsvpCounts` (line 292-309) |
| Send Shoutout | shoutouts | count this week | YES — `weeklyShoutouts` (line 331-340) |
| Enter Stats | schedule_events | stats_entered flag | YES — `pendingStats` (line 321) |
| Review Eval | player_skill_ratings | ratings per player | YES — `evalData` (line 587-601) |

**All coach tracker steps can use data already fetched by CoachDashboard.** No additional queries needed. The data just needs to be passed as props or computed into completion status.

---

## 5. Existing Onboarding System

### Setup Wizard Overlap

**FirstRunSetupPage** (`src/pages/setup/FirstRunSetupPage.jsx`, ~400+ lines)

5 sequential setup steps:
1. Identity (name, logo, colors)
2. Contact (email, phone, address)
3. Sports & Programs (sports, age groups)
4. Money Stuff (payment methods)
5. Fee Structure (registration, uniform, monthly fees + discounts)

**Completion:** Sets `organization.settings.setup_complete = true` + awards `org_setup` badge via JourneyContext.

**Overlap with Lifecycle Tracker:**
- The setup wizard covers **org-level** configuration (identity, contact, sports, payments, fees)
- The lifecycle tracker covers **season-level** operational steps (teams, players, schedule, registrations)
- **Minimal overlap** — the wizard is a prerequisite to the tracker. The tracker begins where the wizard ends.
- The wizard's "org_setup" step maps to the GettingStartedGuide's second step

**They serve different purposes:**
- Setup Wizard = one-time org configuration (15-30 minutes)
- Lifecycle Tracker = per-season operational checklist (ongoing)
- The tracker should NOT replace the wizard

### 3-Tier Dashboard

| Tier | Condition | What Renders |
|------|-----------|-------------|
| Day Zero | `!foundationDone` (setup not complete) | GettingStartedGuide: Welcome hero + "Set up your club" CTA + Setup Roadmap stepper |
| Foundation Ready | `foundationDone && (!totalTeams || !selectedSeason)` | GettingStartedGuide: "Create your first season" hero + Setup Progress stepper + 4 EmptyStateCTA cards |
| Active Dashboard | `totalTeams > 0 && selectedSeason` | V2DashboardLayout: HeroCard + AttentionStrip + ProgramCards + FinancialSnapshot + Engagement |

**Foundation flags:**
```javascript
orgSetupComplete = org has name + contact_email + sports.length > 0
paymentSetupComplete = org has stripe OR venmo/zelle/cashapp
foundationReady = orgSetupComplete && paymentSetupComplete
```

**Tracker interaction:** The tracker would only appear in Tier 3 (Active Dashboard). In Tier 1-2, the GettingStartedGuide handles onboarding. The tracker replaces the need for GettingStartedGuide's "Setup Progress" stepper in Tier 2 once the concept is unified.

### Coach Marks

**CoachMarkContext** (`src/contexts/CoachMarkContext.jsx`, 236 lines)
**CoachMarkTooltip** (`src/components/ui/CoachMarkTooltip.jsx`, 245 lines)

Existing coach mark groups:
- `admin.dashboard_first_load` — 3 marks: setup CTA, roadmap, sidebar nav
- `admin.setup_first_load` — marks for FirstRunSetupPage
- `admin.first_season` — marks for first season creation
- `admin.first_team` — marks for first team creation
- `admin.first_coach_invite` — marks for first coach invite
- `coach.dashboard_first_load` — marks for coach first login

**Features:** Spotlight overlay, sequential tooltips (1 of N), auto-scroll, persistence to localStorage + `profile.onboarding_data.coach_marks_seen`.

**Conflict risk:** LOW. Coach marks target specific DOM elements via `[data-coachmark="..."]` selectors. The tracker could add its own `data-coachmark` attributes for new first-time tooltips. Existing marks won't fire once `setup_complete` is true.

---

## 6. Component Dependencies

### State Management

**Pure React Context API — no Redux, no Zustand.**

Contexts used on admin dashboard:
- `AuthContext` — org, profile, user
- `SeasonContext` — seasons, selection, loading
- `SportContext` — sports, selection
- `ThemeContext` — dark mode, accent color
- `OrgBrandingContext` — org name/logo
- `ProgramContext` — programs, selection
- `JourneyContext` — completed steps, badges
- `CoachMarkContext` — tooltip overlay system

**How the tracker should share state:** Create tracker completion data as local state derived from existing dashboard queries. No new context needed — the tracker tab can receive data as props from DashboardPage, following the same pattern as ProgramCards.

### Navigation Pattern

**Two patterns coexist:**

1. **React Router (preferred for new code):**
   ```javascript
   const navigate = useNavigate()
   navigate('/settings/seasons')
   navigate(`/programs/${programId}`)
   ```

2. **Legacy page ID (via onNavigate prop):**
   ```javascript
   onNavigate?.('teams')
   onNavigate?.('registrations')
   ```
   Maps through `getPathForPage(pageId)` in `src/lib/routes.js` (34+ page ID → URL mappings).

**Tracker CTA buttons should use React Router directly** for consistency with Phase 3 patterns. Page ID → URL mapping available via `ROUTES` export from `src/lib/routes.js`.

### Toast System

**File:** `src/components/ui/Toast.jsx` (135 lines)

**API:**
```javascript
const { toasts, showToast, removeToast } = useToast()
showToast(message, type, duration)
// type: 'success' | 'error' | 'warning' | 'info'
// duration: ms (default 4000)
```

**Features:** Stacking (max 5), auto-dismiss with progress bar, hover-to-pause, slide-in/out animations.

**Usage:** `showToast` is passed as a prop through the component tree. DashboardPage receives it from MainApp via `<DashboardPage showToast={showToast} />`. The tracker can use the same `showToast` prop for step completion celebrations.

### Financial Card

**Component:** `FinancialSnapshot` (`src/components/v2/FinancialSnapshot.jsx`, 232 lines)
**Props:** `overline`, `heading`, `headingSub`, `projectedRevenue`, `collectedPct`, `receivedAmount`, `outstandingAmount`, `breakdown[]`, `primaryAction`, `secondaryAction`

**Independence:** Fully self-contained, data passed as props. Does NOT need to update when tracker's "Set Up Payments" step completes — it always reflects current payment data from the dashboard's existing queries.

---

## 7. Risk Analysis

### Bundle Size

**Build not run** (to comply with read-only investigation rules). However:
- The tracker would be a single new component (~200-400 lines estimated)
- It renders within the existing V2DashboardLayout — no new layout framework
- No new dependencies needed (uses existing Lucide icons, Tailwind classes)
- **Estimated impact:** < 10KB gzipped
- **Code-splitting opportunity:** The tracker tab content could be lazy-loaded via `React.lazy()` if needed, but at ~400 lines it's not worth the complexity

### Query Count

- **Current admin dashboard queries:** ~26 Supabase calls on full load
- **Additional tracker queries needed:** 0-2
  - Most tracker steps can derive completion from existing dashboard data
  - May need: `registration_templates` (to check if reg link exists), `messages` count all-time (not just this week)
- **Net new queries:** ~1-2 after deduplication
- **Risk:** LOW — the tracker is a view layer on existing data, not a new data source

### Season Journey Removal

**SeasonStepper can be safely removed from ProgramPage:**
- Used ONLY in `ProgramPage.jsx` (lines 1182-1191)
- Pure UI component, no global state dependencies
- No other components reference it
- Conditionally rendered — removing it won't break the page
- **Safe to remove:** YES

**GettingStartedGuide:**
- Inline in DashboardPage (lines 58-296)
- Functions as Tier 1-2 content
- Should be **preserved** for day-zero flow
- The tracker supplements Tier 3, not replaces Tier 1-2

**SeasonWorkflowTracker:**
- Used in SeasonManagementPage (separate route `/admin/seasons`)
- The tracker would serve a different purpose (dashboard tab vs. dedicated management page)
- Can coexist; no need to remove

### Mobile Parity

- **"Season Journey" text appears in ParentPlayerTabs.jsx** (line 312) — but this is a "Season Journey" section showing player evaluation history, NOT the same feature
- **Mobile app (volleybrain-mobile3)** is a separate repo; cannot verify its components from here
- **Parity log entry needed:** YES — the Lifecycle Tracker is a web-only feature that could later be ported to mobile. Should be documented in PARITY-LOG.

### Feature Flag

- **Recommended:** NO — The tracker is an enhancement to the existing dashboard, not a risky experiment. It replaces/upgrades the commented-out BodyTabs system.
- **Existing flags:** 19 flags in `src/config/feature-flags.js`
  - 3 enabled: `coachAvailability`, `jerseys`, `registrationFunnel`
  - 16 disabled: gamePrep, standings, leaderboards, achievements, engagement, etc.
- **Pattern:** Flags control nav visibility, not component rendering. Routes still exist when disabled.
- **If flag desired:** Add `lifecycleTracker: true` to FEATURE_FLAGS — trivial

---

## 8. Recommendations for Execution Spec

### Approach

**Hybrid: Enhance existing dashboard + build new tab component**

1. **Admin Tracker** — Add as a new tab/section in DashboardPage's V2DashboardLayout `mainContent`, positioned above or alongside the Program Cards Grid. Use existing dashboard data (no new queries for most steps). Derive completion status from `stats`, `perSeasonTeamCounts`, `upcomingEvents`, etc.

2. **Coach Tracker** — Add as a new section in CoachDashboard, positioned above BodyTabs (between TeamSwitcher and AttentionStrip). Use existing CoachDashboard data (`roster`, `upcomingEvents`, `lineupSetForNextGame`, `weeklyShoutouts`, etc.).

3. **Do NOT replace** the GettingStartedGuide (Tier 1-2) or the SeasonWorkflowTracker (/admin/seasons page). The Lifecycle Tracker lives at Tier 3 and serves a different purpose.

4. **Optionally replace** the SeasonStepper in ProgramPage with a link to the new tracker, or leave it as a quick-glance summary.

### Estimated Phases

**Phase 1: Admin Lifecycle Tracker (core)**
- New component: `LifecycleTracker.jsx` (~300-400 lines)
- Integrate into DashboardPage's mainContent
- 7-10 steps with data-driven completion
- Visual: card-based checklist with progress ring, CTA buttons, step descriptions
- Toast celebrations on step completion

**Phase 2: Coach Lifecycle Tracker**
- New component: `CoachLifecycleTracker.jsx` (~200-300 lines)
- Integrate into CoachDashboard above BodyTabs
- 5-7 steps derived from existing coach data
- Per-team scoping (respects TeamSwitcher selection)

**Phase 3: Polish & Coach Marks**
- Add `data-coachmark` targets to tracker steps
- Define new coach mark groups for tracker first-view
- Add confetti/celebration modal for all-steps-complete
- Persistence: track completion in `profile.onboarding_data` or derive purely from data

### Key Risks to Mitigate

1. **DashboardPage.jsx is already 1,715 lines.** The tracker component MUST be a separate file imported into DashboardPage, not inline code. Extract to `src/components/v2/admin/LifecycleTracker.jsx`.

2. **Query count is already ~26.** The tracker should derive completion from existing state variables, NOT add 7-10 new queries. Pass data as props: `teams`, `stats`, `upcomingEvents`, `coachCount`, etc.

3. **Season scoping ambiguity.** When "All Seasons" is selected, the tracker has no single season to track. Solution: either (a) hide the tracker in "All Seasons" mode with a prompt to select a season, or (b) show aggregate progress across all seasons. Option (a) is simpler and more useful.
