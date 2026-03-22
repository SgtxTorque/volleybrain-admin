# CC-FIX-TM-COMPLETE.md
## Execution Spec: Fix ALL Team Manager Issues — Complete Polish Pass

**Date:** March 20, 2026
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `main`
**Prereq:** Read `INVESTIGATION-REPORT-WEB-CATCHUP.md` and `INVESTIGATION-TM-SETUP-FIX.md`

---

## WHAT THIS DOES

Fixes every known TM issue in one pass. No more whack-a-mole.

---

## WHAT THIS DOES NOT DO

- Does NOT touch Admin, Coach, Parent, or Player dashboards
- Does NOT port quest/XP engines
- Does NOT redesign the sidebar or shell
- Does NOT change any existing pages that work correctly

---

## RULES

1. Read every file before modifying.
2. Make the MINIMUM change needed.
3. Run `npm run build` after each phase. Zero errors.
4. Commit after each phase: `[tm-fix] Phase X: description`
5. Do NOT refactor, restyle, or "improve" anything outside the listed scope.
6. Do NOT change how existing admin/coach/parent flows work.
7. If you encounter something unexpected, STOP and report.
8. Test mentally that your changes do not break any EXISTING user flow (admin signup, coach signup, parent signup).

---

## KNOWN ISSUES TO FIX

| # | Issue | Severity |
|---|-------|----------|
| 1 | Double wizard — SetupWizard asks for team name, then TeamManagerSetup asks again | High |
| 2 | TeamManagerSetup shows "Organization" step — TMs should never see this word | High |
| 3 | No team type selector (recreational/competitive) in team creation | Medium |
| 4 | "Go to Dashboard" button on completion screen doesn't work | High |
| 5 | No stepper/checklist on TM dashboard for new TMs (what to do next) | High |
| 6 | Error handling missing on some inserts (already partially fixed) | Medium |
| 7 | Database constraints need documentation | Low |

---

## PHASE 1: Fix the Double Wizard Problem

**Problem:** SetupWizard's `createIndependentTeam()` creates an org and shows a "Name your team" step. Then TeamManagerSetup shows a SECOND 4-step wizard asking for team details again. The TM names their team twice.

**Solution:** Simplify SetupWizard's TM path. When a user selects "Coach / Team Manager":

1. SetupWizard should ONLY create the micro-org and user_role, then mark onboarding complete
2. It should NOT ask for a team name (TeamManagerSetup handles that)
3. After onboarding, the user lands on TeamManagerSetup which is the REAL team creation flow

**File:** `src/pages/auth/SetupWizard.jsx`

**Changes to `createIndependentTeam()`:**

The function currently:
- Shows "Name your team" input
- Creates org with that team name
- Creates user_role
- Updates profiles
- Navigates to completion screen

Change it to:
- Skip the "Name your team" step entirely for TMs
- Auto-create a micro-org with a generic name (user's display name + "'s Organization" or just "My Club")
- Create user_role with `team_manager`
- Update profiles
- Navigate directly to `/dashboard` (which will show TeamManagerSetup since no team_staff exists yet)

**Specifically:**
- In the `WIZARD_STEPS` or step routing logic, when the user selects `team_manager`, skip the "team name" step
- The org name should be auto-generated: `${profile.full_name || 'My'} Club` — the TM never sees or inputs this
- Remove the "Name your team" UI step from the TM path (keep it for org directors if they use it)
- After org + role creation, call `completeOnboarding()` and navigate to `/dashboard`

**IMPORTANT:** Do NOT change the Org Director path (`createOrganization()`). Only modify the TM path.

**Commit:** `[tm-fix] Phase 1: simplify SetupWizard TM path — skip team name, auto-create micro-org`

---

## PHASE 2: Redesign TeamManagerSetup — Remove "Organization" Step

**Problem:** TeamManagerSetup has 4 steps: Team Info → Season → Organization → Confirmation. Step 3 ("Organization") shows "Your team will be added to your existing organization" which is confusing for TMs. TMs don't think in terms of organizations.

**Solution:** Remove the Organization step entirely. The wizard becomes 3 steps:

1. **Create Your Team** — Team name, sport, age group, team color, team type (rec/competitive)
2. **Season Info** — Season name (auto-filled), start date, end date
3. **You're All Set!** — Confirmation with invite code + "Go to Dashboard" button

**File:** `src/pages/team-manager/TeamManagerSetup.jsx`

**Changes:**
1. Remove the Organization step/screen entirely
2. The org ID comes from `organization?.id` (already created by SetupWizard)
3. If somehow `organization?.id` is null, create the micro-org silently (same pattern as Phase 1) — but this should never happen since SetupWizard already created it
4. Add **team type selector** to Step 1: radio buttons or cards for "Recreational" and "Competitive"
5. Include `team_type` in the teams insert: `team_type: selectedTeamType` (default to `'competitive'`)
6. Update step numbering: "Step 1 of 3", "Step 2 of 3", "Step 3 of 3"

**Team Type UI (Step 1):**
Add after the Team Color section:

```
TEAM TYPE
[Recreational]  [Competitive]
```

Use the same card-style selector as the Sport selector. Default to "Competitive" pre-selected.

**Commit:** `[tm-fix] Phase 2: redesign TeamManagerSetup — remove org step, add team type selector`

---

## PHASE 3: Fix "Go to Dashboard" Button

**Problem:** The completion screen's "Go to Dashboard" button doesn't navigate.

**File:** `src/pages/team-manager/TeamManagerSetup.jsx`

**Investigate:** Read the button's onClick handler. It likely calls a function that tries to refresh roleContext and then navigate, but one of those fails silently.

**Fix:** The button should:
1. Call `window.location.href = '/dashboard'` as a hard navigation (not React Router navigate)
2. This forces a full page reload which re-runs `loadRoleContext()` with the new team_staff data

OR if the `onComplete` prop exists and works:
1. Call `onComplete()` which should refresh roleContext
2. Then the dashboard routing will detect `teamManagerInfo.length > 0` and show the real dashboard

**Check which approach the code uses and fix accordingly.** If `onComplete` is not wired or doesn't refresh properly, use the hard navigation as a reliable fallback.

**Commit:** `[tm-fix] Phase 3: fix Go to Dashboard button on completion screen`

---

## PHASE 4: Add Welcome Stepper/Checklist to TM Dashboard

**Problem:** When a TM lands on their dashboard for the first time, they see empty cards (0 payments, 0 players, no events). There's no guidance on what to do next.

**Solution:** Add a collapsible "Getting Started" checklist card at the TOP of the TM dashboard (above Payment Health). This card only shows when the TM has incomplete setup steps.

**File:** `src/pages/roles/TeamManagerDashboard.jsx`

**The checklist items:**

| Step | Label | How to detect completion | CTA |
|------|-------|------------------------|-----|
| 1 | Add players to roster | `rosterCount > 0` | "Add Players" → `/roster` |
| 2 | Create first event | Check if any `schedule_events` exist for the team | "Create Event" → `/schedule` |
| 3 | Invite parents | Check if invite code was shared (or just show always until roster > 2) | "Share Invite Code" → open InviteCodeModal |
| 4 | Set up payments | Check if any `payments` records exist for the season | "Set Up Fees" → `/payments` |

**Design:**
- Card with title "Getting Started" and subtitle "Complete these steps to get your team running"
- Each item: checkbox icon (empty or checked), label, estimated time ("~2 min"), and a CTA link
- When all items are complete, the card collapses to a single line: "Setup complete! ✓" with option to dismiss
- Use `lynx-*` tokens, `text-r-*` sizes, `rounded-[14px]` card, dark mode support
- Store dismissed state in localStorage: `tm_setup_dismissed_${teamId}`

**Data fetching:** Add a simple check in `useTeamManagerData` or inline in the dashboard:
```javascript
const { data: eventCount } = await supabase
  .from('schedule_events')
  .select('id', { count: 'exact', head: true })
  .eq('team_id', teamId)

const hasEvents = (eventCount || 0) > 0
```

**IMPORTANT:** This checklist is a CARD on the existing dashboard, NOT a separate page or wizard. The dashboard still shows Payment Health, RSVP, Roster Status, Quick Actions below it.

**Commit:** `[tm-fix] Phase 4: add Getting Started checklist to TM dashboard`

---

## PHASE 5: Verify Error Handling Is Complete

**File:** `src/pages/team-manager/TeamManagerSetup.jsx`

Check that EVERY Supabase operation in `handleCreate()` has proper error handling:

```javascript
const { data, error } = await supabase.from('table').insert({...})
if (error) throw error
```

If any insert is missing the `{ error }` destructure and throw, add it. This is what caused the silent failures before.

Also check `src/pages/auth/SetupWizard.jsx` — verify the error handling fixes from earlier are still intact after the Phase 1 changes.

**Commit:** `[tm-fix] Phase 5: verify all error handling complete`

---

## PHASE 6: Verification

Run:
```bash
npm run build
```

**Trace these scenarios mentally through the code:**

### Scenario 1: Brand new TM signup
1. User signs up → SetupWizard appears
2. Selects "Coach / Team Manager"
3. SetupWizard auto-creates micro-org + user_role (team_manager) + updates profiles
4. Navigates to /dashboard
5. `loadRoleContext()`: isTeamManager = true (from user_roles), teamManagerInfo = [] (no team_staff yet)
6. Dashboard routing: shows TeamManagerSetup (3-step wizard)
7. User completes: team name, sport, age group, color, type → season name, dates → confirmation + invite code
8. "Go to Dashboard" works → TM dashboard loads with Getting Started checklist

### Scenario 2: Existing TM with team
1. Logs in → loadRoleContext → isTeamManager = true, teamManagerInfo has team
2. Dashboard shows real TM dashboard with data cards + Getting Started checklist (if incomplete)

### Scenario 3: Existing admin (Carlos's account)
1. Logs in → loadRoleContext → isAdmin = true
2. Admin dashboard loads as normal — NOTHING CHANGED

### Scenario 4: Existing parent/coach
1. Logs in → their dashboard loads as normal — NOTHING CHANGED

**Report:**
```
## TM COMPLETE FIX VERIFICATION

### Build: PASS / FAIL
### Files changed: [list]
### Total lines changed: [count]

### Scenario 1 (New TM signup): VERIFIED / ISSUE
### Scenario 2 (Existing TM): VERIFIED / ISSUE
### Scenario 3 (Existing admin): VERIFIED / ISSUE
### Scenario 4 (Existing parent/coach): VERIFIED / ISSUE

### SetupWizard TM path: team name step removed? YES / NO
### TeamManagerSetup: org step removed? YES / NO
### Team type selector added? YES / NO
### Go to Dashboard button works? YES / NO
### Getting Started checklist renders? YES / NO
### All error handling present? YES / NO

### Unexpected issues: NONE / [describe]
```

**Commit:** `[tm-fix] Phase 6: verification complete`

---

## DATABASE CONSTRAINTS REFERENCE (already fixed in Supabase)

These were fixed directly in the Supabase SQL Editor. Document here for reference:

| Table | Constraint | Original Values | Fixed Values |
|-------|-----------|----------------|-------------|
| `user_roles` | `user_roles_role_check` | league_admin, head_coach, assistant_coach, parent, player | Added `team_manager` |
| `teams` | `teams_team_type_check` | recreational, competitive | Added `NULL` allowance |
| `teams` | `team_type` default | `'development'` (invalid) | Changed to `'competitive'` |
| `team_staff` | RLS | Blocked TM inserts | Temporarily disabled (needs proper policy) |
| `team_staff` | `team_staff_staff_role_check` | head_coach, assistant_coach, team_admin | Added `team_manager` |

**TODO (future):** Re-enable RLS on `team_staff` with a policy that allows TMs to insert their own staff record during setup.

---

## CC PROMPT

```
Read CC-FIX-TM-COMPLETE.md in the repo root.

This fixes ALL known Team Manager issues in one pass. Execute Phases 1-6 in order, committing after each.

CRITICAL RULES:
- Do NOT touch admin, coach, parent, or player flows. Only modify TM-related files.
- Do NOT change SetupWizard's Org Director path (createOrganization). Only change the TM path.
- Follow existing design system: text-r-* tokens, lynx-* colors, rounded-[14px], useTheme() for dark mode.
- Every Supabase insert MUST have error handling: const { error } = ... if (error) throw error
- The Getting Started checklist is a CARD on the dashboard, not a separate page.
- Test mentally that existing user flows (admin, coach, parent) still work after your changes.

If you encounter something unexpected, STOP and report.
```
