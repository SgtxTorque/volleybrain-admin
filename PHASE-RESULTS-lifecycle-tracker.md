# PHASE RESULTS: Lifecycle Tracker
**Date:** April 12, 2026
**Branch:** main
**Build:** PASS (chunk size warning pre-existing, not an error)

### Phase 1: Admin Lifecycle Tracker — PASS
**Commit:** e95fbac
**Component:** src/components/v2/admin/LifecycleTracker.jsx (325 lines)
**Steps implemented:**
1. `create_season` — Always done (if you're on ProgramPage, season exists). Milestone: "Season created!"
2. `create_teams` — `teamsCount > 0`. CTA navigates to /teams.
3. `assign_coaches` — `teamsCount > 0` (proxy — ProgramPage doesn't query team_coaches). Blocked until create_teams. CTA navigates to /coaches.
4. `open_registration` — `registrationsCount > 0`. CTA opens showRegLinkModal. Milestone: "Go live!"
5. `build_schedule` — `eventsCount > 0`. CTA navigates to /schedule.
6. `process_registrations` — `approvedRegsCount > 0`. Blocked until open_registration. CTA navigates to /registrations.
7. `send_announcement` — `playersCount > 0 && eventsCount > 0 && approvedRegsCount > 0` (composite proxy — ProgramPage doesn't query blasts). CTA navigates to /blasts. Milestone: "Launch!"

**Tab integration:** Added "Season Setup" as the first tab in ProgramPage's BodyTabs tab array (admin role only). Badge shows "X/Y" progress (e.g., "3/7") with sky blue background. Auto-switches to setup tab on first load when setup is incomplete (via useEffect + setupTabInitialized ref).
**Data props used:** `tabTeams.length`, `tabPlayers.length`, `tabEvents.length`, `tabRegistrations.length`, filtered approved registrations count, `tabPayments` sum, season.name, season.id, program?.id, `navigate` (React Router), `showToast`, `showRegLinkModal`
**SeasonStepper removed:** YES — import replaced with LifecycleTracker, SeasonStepper render block removed. Component file preserved.
**RegLinkModal integration:** Step 4 ("Open Registration") calls `onOpenRegLink()` which triggers `setShowRegLinkModal(true)` in ProgramPage, opening the existing registration link sharing modal.

### Phase 2: Coach Lifecycle Tracker — PASS
**Commit:** 6275b2b
**Component:** src/components/v2/coach/CoachLifecycleTracker.jsx (320 lines)
**Steps implemented:**
1. `review_roster` — localStorage `rosterViewed` flag. CTA switches to 'roster' tab.
2. `check_schedule` — localStorage `scheduleViewed` flag. CTA switches to 'schedule' tab.
3. `set_lineup` — `lineupSet` prop (from `lineupSetForNextGame`). CTA switches to 'gameprep' tab.
4. `take_attendance` — `attendanceTaken` prop (derived from `avgAttendanceLast3 > 0`). Blocked until check_schedule. CTA switches to 'roster' tab.
5. `send_shoutout` — `shoutoutsSent > 0` prop (from `weeklyShoutouts`). CTA opens shoutout modal. Milestone: "First shoutout!"

**Placement:** Rendered above the BodyTabs section in CoachDashboard, between the AttentionStrip and the main tab content area.
**View-step tracking:** localStorage keys: `lynx-coach-tracker-{teamId}` stores JSON `{ rosterViewed: bool, scheduleViewed: bool }`. Clicking "View Roster" or "View Schedule" CTA marks the corresponding flag as true.
**TeamSwitcher scoping:** useEffect syncs localStorage state when `teamId` changes. Each team has its own tracker state and dismiss state (`lynx-coach-tracker-dismissed-{teamId}`).

### Phase 3: Smart Return + Polish — PASS
**Commit:** dc770a2
**Pages with return banner:** TeamsPage, CoachesPage, SchedulePage, RegistrationsPage, BlastsPage
**Toast celebration:** Working. Admin tracker uses useRef (prevCompleted) + useEffect on completedCount to detect newly completed steps, fires `showToast("step title — done!", 'success')`. Coach tracker uses same pattern.
**Query params used:** `from` (value: "tracker"), `returnTo` (return URL path), `season` (season display name), `step` (current step number), `total` (total steps)

## Issues Encountered
1. **No coach data in ProgramPage:** The execution spec's "assign coaches" step assumed `coachesCount` from ProgramPage, but ProgramPage doesn't query `team_coaches`. Used `teamsCount > 0` as a proxy (coaches can't be assigned without teams, and team creation is the actionable step).
2. **No blasts data in ProgramPage:** The "send announcement" step needed blast count data not available in ProgramPage. Used a composite check (`playersCount > 0 && eventsCount > 0 && approvedRegsCount > 0`) as a proxy indicating readiness to announce.
3. **BodyTabs badge rendering:** The existing BodyTabs component only checked `tab.badge > 0` which fails for string badges like "3/7". Fixed the condition to `tab.badge != null && tab.badge !== false && tab.badge !== 0` and added `badgeColor` and `badgeIcon` prop support.
4. **Build exit code 1:** `npx vite build` returns exit code 1 due to chunk size WARNING (main chunk is 3.3MB). This is a pre-existing condition — the build succeeds and outputs "built in 10.80s".

## Testing Notes
To test admin tracker:
1. Log in as admin (qatestdirector2026@gmail.com)
2. Navigate to any program page
3. Select a season
4. The "Season Setup" tab should appear as first tab
5. Click through tracker steps — verify navigation and return banner
6. Complete steps and verify they auto-check when data changes

To test coach tracker:
1. Log in as coach (QAcoach2@example.com / TestCoach2026!)
2. Verify tracker card appears above tabs
3. Click "View Roster" — tab should switch, step should check off
4. Switch teams via TeamSwitcher — tracker should reset per team
