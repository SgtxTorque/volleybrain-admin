# INVESTIGATION REPORT: Parent + Coach First-Login Experience
**Date:** April 12, 2026

---

## Parent First-Login

### Welcome Tour (7 Cards)

The parent welcome tour is implemented in `src/contexts/ParentTutorialContext.jsx` (lines 9–52) and rendered by `src/components/parent/ParentOnboarding.jsx` (SpotlightOverlay component, 471 lines total).

| Card # | Step ID | Title | Body Text | Links To | Actionable? |
|--------|---------|-------|-----------|----------|-------------|
| 1 | `welcome` | Welcome to Lynx! 🎉 | Let's get you set up so you can stay connected with your child's team. This quick tour will show you everything you need. | none | NO — just "Let's Go!" button to advance |
| 2 | `view_dashboard` | Your Dashboard 🏠 | This is your home base! You'll see upcoming events, your child's info, and quick actions all in one place. | none | NO — informational only |
| 3 | `find_player_card` | Your Child's Player Card 🪪 | Find your child's player card showing their photo, jersey number, team info, and achievements. Tap it to see more details or update their info. | none | NO — informational only |
| 4 | `check_payments` | Payment Status 💳 | Check the top bar to see your balance due. Tap it to make payments or view payment history. | none | NO — informational only |
| 5 | `view_schedule` | Team Schedule 📅 | Find all practices and games on the Schedule page. Tap any event to see details and RSVP to let the coach know you're attending. | none | NO — informational only |
| 6 | `team_hub` | Team Hub & Chat 💬 | Stay connected with coaches and other parents through the Team Hub. Get updates, chat with the team, and never miss important announcements. | none | NO — informational only |
| 7 | `complete` | You're All Set! 🏐 | You now know the basics. Keep exploring to discover more features like stats, achievements, and volunteering! | none | NO — "Get Started!" dismisses |

**Critical finding: NONE of the 7 cards link to any page or trigger any action.** They are purely informational read-through cards. No card says "do this first" or "start here." No card links to a specific action. The tour is a passive slideshow.

### Trigger
- **When:** Auto-opens on first login for parent role
- **Detection:** Reads `profile.parent_tutorial_data` from the `profiles` table (ParentTutorialContext.jsx:139)
  - Checks `has_seen_tutorial` (boolean), `skipped` (boolean), and `completed_steps` (array)
  - Auto-starts if ALL of: `!hasSeenTutorial && !skipped && completedSteps.length === 0` (line 149)
- **Storage:** Persisted to `profiles.parent_tutorial_data` (JSON column) via Supabase update
- **Scope:** Per-profile, NOT per-season — the tutorial state is global

### Dismissible
- **Yes** — X button (top-right) calls `skipTutorial()` which sets `skipped: true`
- **Does NOT come back** unless the user clicks "🎓 Replay Tutorial" from the expanded checklist, or "🎓 Take the Tour" from the FloatingHelpButton (? button, bottom-right)
- Completing the tour (clicking through all 7 cards) sets `has_seen_tutorial: true`

---

### Getting Started Checklist (6 Steps)

Defined in `src/contexts/ParentTutorialContext.jsx` lines 56–105. Rendered by `ParentJourneyBar` in `src/components/parent/ParentOnboarding.jsx` lines 161–389.

| Step # | ID | Title | Description | Completion Check | Links To | Actionable? |
|--------|----|-------|-------------|-----------------|----------|-------------|
| 1 | `complete_registration` | Complete Registration | Your player is registered and on a team | `data.isRegistered` — checks if player has `team_players` entries | `null` (no navigation) | NO — not clickable |
| 2 | `add_player_photo` | Add Player Photo | Upload a photo for the player card | `data.hasPhoto` — checks `player.photo_url` | `null` (no navigation) | NO — not clickable |
| 3 | `make_payment` | Pay Registration Fee | Complete your registration payment | `data.paymentComplete` — checks if `totalDue <= 0 || totalPaid > 0` | `payments` page | YES |
| 4 | `view_schedule` | Check Team Schedule | View upcoming practices and games | `data.hasViewedSchedule` — checks `completedSteps.includes('view_schedule')` | `schedule` page | YES |
| 5 | `first_rsvp` | RSVP to an Event | Let the coach know if you're attending | `data.hasRsvpd` — queries `event_rsvps` for player_id | `schedule` page | YES |
| 6 | `join_team_hub` | Visit Team Hub | Check out your team's page | `data.hasVisitedTeamHub` — checks `completedSteps.includes('join_team_hub')` | navigateToTeamWall (special handler) | YES |

**Key observations:**
- Steps 1–2 have `navTo: null` — they are NOT clickable/actionable from the checklist. The parent has no way to complete them directly from the checklist.
- Step 1 ("Complete Registration") checks if the player is on a team (`team_players` join). A parent who registered but is awaiting admin approval/team assignment will see this as incomplete. **This is misleading** — the parent can't do anything about it.
- Step 2 ("Add Player Photo") has no navigation — the photo upload is on the dashboard hero KidCards component, but the checklist doesn't navigate there.
- Steps 3–5 properly navigate to relevant pages.
- Step 6 uses a special `onTeamHub` callback.

### Completion Tracking
- **Storage:** `profile.parent_tutorial_data.completed_steps` (array of step IDs) in the `profiles` table
- **Persistence:** Yes, persists across sessions (Supabase)
- **Season reset:** NO — `parent_tutorial_data` has no season scoping. Same data is used regardless of which season is active.
- Steps 4 and 6 are tracked via `completeStep()` calls (localStorage-backed `completed_steps`), while steps 1, 2, 3, 5 are data-driven (real-time checks on DB data).

### Auto-hide
The `ParentJourneyBar` returns `null` (hides) when all 6 steps are complete (line 174: `if (isAllComplete) return null`).

---

### First-Login Flow (step-by-step)

1. **Parent registers** via `/register/:orgIdOrSlug` → auth account + profile created with `onboarding_completed: true` (set during registration flow in PublicRegistrationPage.jsx:824 and RegistrationCartPage.jsx)
2. **Parent logs in** → `AuthContext` checks `profile.onboarding_completed`
   - If `true` (normal path for parents who registered): skips `SetupWizard`, goes directly to `MainApp`
   - If `false` (edge case — no `user_roles` found): shows `SetupWizard` (role selection → parent path → auto-detects children → success)
3. **MainApp renders** → `ParentTutorialProvider` wraps the app (MainApp.jsx:1597)
   - Loads `parent_tutorial_data` from profile
   - If `!hasSeenTutorial && !skipped && completedSteps.length === 0`: sets `isActive: true`
4. **SpotlightOverlay renders** (MainApp.jsx:1605, gated by `activeView === 'parent'`)
   - Full-screen dark overlay with centered modal card
   - 7-step tour auto-plays (user clicks Next/Back/Skip)
5. **After tour completes/skips** → dashboard visible:
   - **HeroCard** — greeting ("Good morning, Carlos."), stats (Kids, This Week events, Due amount, Badges)
   - **MascotNudge** — contextual message (badges earned, balance due, or "Everything looks great!")
   - **AttentionStrip** — red strip if priority items exist (unpaid fees, unsigned waivers, pending RSVPs)
   - **ParentJourneyBar** — Getting Started checklist (if not all complete)
   - **KidCards** — horizontal scroll of child player cards
   - **BodyTabs** — Schedule, Payments, Forms & Waivers, Report Card
   - **Side panel** — Financial Snapshot, The Playbook (quick actions), Team Chat + Team Hub buttons
6. **FloatingHelpButton** (?) appears bottom-right (MainApp.jsx:1707) — offers "Take the Tour", "Help Center", "Contact Support"

### Empty States

**No registered players:**
- ParentDashboard.jsx lines 590–618
- Shows: 🏐 emoji + "Welcome!" + "You haven't registered any players yet." + "Get started by registering for an open season below."
- Lists open seasons (queries `seasons` where `registration_open = true`) with "Register →" links

**Has players but no events:**
- Schedule tab shows empty state (handled by `ParentScheduleTab`)
- Hero stats show "This Week: 0"
- MascotNudge shows "Everything looks great! Enjoy the season."

**Has players but no payments:**
- Payments tab shows paid status; Financial Snapshot shows "✓ All Paid"

---

## Coach First-Login

### Welcome Tour: NONE
There is **no welcome tour modal** for coaches. Coaches do not get the `ParentTutorialProvider` or `SpotlightOverlay`. The `activeView === 'parent'` gate on SpotlightOverlay (MainApp.jsx:1605) explicitly excludes coaches.

### Coach Marks (Tooltip Spotlights)
Defined in `src/contexts/CoachMarkContext.jsx`. Coach role has ONE coach-mark group:

| Group | ID | Target | Title | Body |
|-------|----|--------|-------|------|
| `coach.dashboard_first_load` | `coach_dashboard_home` | `[data-coachmark="coach-home"]` | Welcome, Coach! | This is your command center. Schedule, roster, and game day — all here. |

**NOTE:** This is a single tooltip that fires once (on first dashboard load). It targets a `data-coachmark="coach-home"` element. It is stored in `localStorage` (keyed by profile ID) and synced to `profile.onboarding_data.coach_marks_seen`. **However**, I did NOT find `data-coachmark="coach-home"` anywhere in the CoachDashboard.jsx — the tooltip may silently skip because its target element doesn't exist on the page.

### CoachLifecycleTracker (Getting Started Checklist)
Defined in `src/components/v2/coach/CoachLifecycleTracker.jsx` (346 lines). Rendered on CoachDashboard.jsx:912–925.

**5 steps:**

| Step # | ID | Title | Description | Completion Check | CTA | Actionable? |
|--------|----|-------|-------------|-----------------|-----|-------------|
| 1 | `review_roster` | Review your roster | "{N} players waiting to meet you." / "Check who's on your team." | `localStorage` flag `rosterViewed` (set when CTA clicked) | "View Roster" → switches to roster tab | YES |
| 2 | `check_schedule` | Check the schedule | "{N} upcoming events this season." / "See what's coming up." | `localStorage` flag `scheduleViewed` (set when CTA clicked) | "View Schedule" → switches to schedule tab | YES |
| 3 | `set_lineup` | Set your lineup | Build a starting lineup for your next game. | `lineupSet` prop (checks `game_lineups` for next game) | "Build Lineup" → switches to gameprep tab | YES |
| 4 | `take_attendance` | Take attendance at your first event | One tap per player. Families get notified automatically. | `attendanceTaken` prop (checks if avg attendance > 0) | "Take Attendance" → switches to roster tab | YES (blocked until step 2 complete) |
| 5 | `send_shoutout` | Send your first shoutout | Recognize a player's effort — they earn XP and a badge! | `shoutoutsSent > 0` prop | "Give Shoutout" → opens GiveShoutoutModal | YES |

**Key differences from parent checklist:**
- ALL 5 steps are actionable with CTA buttons
- Steps 1 & 2 use `localStorage` per team (key: `lynx-coach-tracker-{teamId}`) — view-based completion
- Steps 3–5 are data-driven (real-time Supabase query results)
- Step 4 is BLOCKED until step 2 is complete (shows lock icon + "Unlocks at your next scheduled event")
- Coach can DISMISS the entire tracker (X button → stores `lynx-coach-tracker-dismissed-{teamId}` in localStorage)
- Tracker auto-hides when all 5 steps are complete
- Shows toasts on step completion (e.g. "✅ Review your roster — done!")
- Has a progress bar with percentage

### Empty States

**No teams assigned** (CoachDashboard.jsx:821–834):
- Shows: Shield icon + "No Teams Assigned" + "Contact your league administrator to get started."
- No actionable button, no link to help.

**Loading takes too long** (CoachDashboard.jsx:805–818, after 5 seconds):
- Shows: "Having trouble loading your dashboard. This may mean your account setup isn't complete."
- Two buttons: "Retry" (reloads data) | "Contact your club director" (navigates to dashboard)

**Has teams but no roster:**
- CoachRosterTab renders its own empty state
- The lifecycle tracker shows: "Check who's on your team." (step 1)

**Has teams + roster but no schedule:**
- CoachScheduleTab shows empty
- Lifecycle tracker: "See what's coming up for your team." (step 2)
- Side panel WeeklyLoad shows no events

**Has teams + roster + schedule but no games:**
- No GameDayCard rendered (gated by `nextGame`)
- Lifecycle tracker: Step 3 "Build Lineup" is available but may not be actionable without a game event

### Onboarding Gap
The coach gets:
- **1 tooltip** that may not fire (target element missing)
- **CoachLifecycleTracker** — this IS good, with 5 actionable steps
- **NO welcome tour** (unlike parents)
- **NO floating help button** (the `FloatingHelpButton` is gated to `activeView === 'parent'` in MainApp.jsx:1707)
- If no teams are assigned, the coach sees a dead end with no actionable path forward

---

## New Season Experience

### Parent: What happens when a new season starts

- **No "New season available!" notification or banner.** There is no code that detects a new season and alerts the parent.
- **Season scoping:** ParentDashboard queries players scoped to `organization.id` via `seasons.organization_id`. If a new season is created and the parent's children are registered in it, the data auto-updates.
- **Getting Started checklist does NOT reset.** The `parent_tutorial_data` on the `profiles` table has no season_id scoping. Steps like "Complete Registration" and "Pay Registration Fee" are checked against ALL children data, not season-specific data. The checklist may show as "complete" even though the parent hasn't registered for the new season.
- **The parent must re-register.** There is no auto-enrollment. If `registrationData.length === 0` (no players in current org's seasons), the parent sees the "Welcome!" empty state with open season links.
- **Open seasons widget:** The empty state shows seasons where `registration_open = true`, with "Register →" links. But this only shows when the parent has ZERO registered players — if they have a child from a previous season, they won't see it.
- **The welcome tour does NOT re-trigger** for a new season (stored globally on profile, not per-season).

### Coach: What happens when a new season starts

- **Season scoping:** CoachDashboard derives `coachSeasonIds` from `coachTeamAssignments` → teams → season_id. The coach only sees seasons they're assigned to via `team_coaches`.
- **CoachLifecycleTracker partially resets.** It uses `localStorage` keyed by team_id (`lynx-coach-tracker-{teamId}`). If the coach gets a NEW team in the new season, the tracker will start fresh for that team. If assigned to the same team, it stays completed.
- **No "New season!" guidance.** No banner, notification, or special state for the start of a new season.
- **The coach must be re-invited** (or their team_coaches assignment must carry over) to see the new season's teams.
- **The coach mark tooltip** (`coach_dashboard_home`) fires only once ever (stored per-profile, not per-season).

### Checklist Reset Summary
| Component | Storage | Season-scoped? | Resets for new season? |
|-----------|---------|----------------|----------------------|
| Parent Welcome Tour | `profiles.parent_tutorial_data` | NO | NO |
| Parent Getting Started | `profiles.parent_tutorial_data` + live DB checks | Partially — live checks are scoped to current org seasons | Partially — data-driven steps (1,2,3,5) reset if new registration needed; view-based steps (4,6) do NOT reset |
| Coach Lifecycle Tracker | `localStorage` per team_id | YES (by team) | YES — new team = fresh tracker; same team = stays completed |
| Coach Marks | `localStorage` + `profiles.onboarding_data.coach_marks_seen` | NO | NO |

---

## Season End Experience

**There is NO end-of-season experience.** Zero code handles season end in any user-facing way.

- No season recap, stats summary, or "Season Complete!" celebration
- No archive prompt or "Your season has ended" banner
- No notification that a season ended
- The `SeasonArchivePage` exists but is behind a feature flag (`archives: false` in `src/config/feature-flags.js:37`) — it is disabled
- The `JourneyContext` has a `season_complete` badge (JourneyContext.jsx:160) that fires when all journey steps are completed, but this is about admin setup steps, not season lifecycle
- When a season ends, the data just stops updating. Events pass their dates, and the dashboard gradually empties out. For parents, the schedule tab shows fewer events. For coaches, the "upcoming events" list shrinks to zero.
- **The season just... stops.**

---

## Gaps & Recommendations

| # | Gap | Severity | Who | Recommendation |
|---|-----|----------|-----|---------------|
| 1 | **Welcome tour is 100% passive** — 7 cards with zero actionable links. No "start here" or "do this first." | HIGH | Parent | Rewrite cards to include a CTA on each: Card 3 → "Upload Photo Now", Card 4 → "View Payments", Card 5 → "Open Schedule", etc. Or replace the tour with a "first 3 things to do" card. |
| 2 | **Checklist step 1 "Complete Registration" is misleading** — parent already registered to get here. It checks `team_players` which depends on admin approval. Parent can't do anything about it. | HIGH | Parent | Rename to "Get Assigned to a Team" or remove it. Or add a message: "Waiting for admin to assign your player to a team." |
| 3 | **Checklist step 2 "Add Player Photo" has no navigation** — `navTo: null`. Parent doesn't know where to go. | MEDIUM | Parent | Add navigation to the KidCards section or open a photo upload modal directly. |
| 4 | **Coach has NO welcome tour** — only 1 tooltip (that may not fire) + lifecycle tracker. No help button. | HIGH | Coach | Add a 3-card welcome tour for coaches OR ensure the `data-coachmark="coach-home"` target exists so the tooltip fires. Also enable FloatingHelpButton for coaches. |
| 5 | **Coach "No Teams" state is a dead end** — no link to help, no way to contact admin, no "invite code" option. | HIGH | Coach | Add "Enter invite code" button or "Contact your admin" link with the admin's email. Show a re-check button. |
| 6 | **Coach mark tooltip target missing** — `[data-coachmark="coach-home"]` doesn't exist in CoachDashboard.jsx. The tooltip silently skips. | MEDIUM | Coach | Add `data-coachmark="coach-home"` attribute to the HeroCard or dashboard wrapper. |
| 7 | **No new-season notification** — returning parents/coaches get no indication a new season started. | HIGH | Both | Add a "New Season Available!" banner or notification when admin creates a new season with registration open. |
| 8 | **Parent checklist doesn't reset per season** — `parent_tutorial_data` is profile-global. Returning parents see stale completion data. | HIGH | Parent | Add `season_id` to `parent_tutorial_data` and reset when season changes, or derive all steps from live data. |
| 9 | **No end-of-season experience** — season just fades out with no recap, stats summary, or transition prompt. | MEDIUM | Both | Add a "Season Recap" card when season status changes to 'completed': record, stats highlights, achievements earned. Prompt re-registration for next season. |
| 10 | **Season Archives feature-flagged OFF** — even if admin wanted to show season history, it's disabled. | LOW | Admin | Consider enabling archives for basic use (view-only past season data). |
| 11 | **Open seasons only visible when parent has ZERO players** — if parent has a child from last season, they don't see new season registration links. | HIGH | Parent | Show "Open Registrations" banner/card even when parent has existing children, especially if the current season is ending/ended. |
| 12 | **FloatingHelpButton only for parents** — coaches and players get no help access. | MEDIUM | Coach/Player | Enable FloatingHelpButton for all non-admin roles, or add help link to sidebar. |
