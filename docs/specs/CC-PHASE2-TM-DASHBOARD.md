# CC-PHASE2-TM-DASHBOARD.md
## Execution Spec: Phase 2 — Team Manager Dashboard + Setup Wizard

**Date:** March 19, 2026
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `feat/desktop-dashboard-redesign`
**Prereq:** Phase 0 and Phase 1 must be complete. Read `INVESTIGATION-REPORT-WEB-CATCHUP.md`.

---

## WHAT THIS PHASE DOES

Builds the Team Manager web experience:
1. Replace the TM placeholder with a real dashboard
2. Build the TM setup wizard (create org > season > team > invite code)
3. Build the Invite Code modal
4. Port `useTeamManagerData` hook from mobile

After this phase, a Team Manager can sign up on web, create their team, and see a fully functional operations dashboard.

---

## WHAT THIS PHASE DOES NOT DO

- Does NOT modify Admin, Coach, Parent, or Player dashboards
- Does NOT port quest/XP engines
- Does NOT add new pages beyond TM dashboard and setup
- Does NOT touch the widget grid system (TM dashboard uses fixed layout, not widgets)
- Does NOT add mobile-specific patterns (haptics, scroll animations, ambient closers)

---

## RULES

1. Read every file before modifying.
2. Make the minimum change needed.
3. Follow the existing design system: `text-r-*` tokens, `lynx-*` colors, `rounded-[14px]` cards, `border-lynx-silver` borders.
4. Use `useTheme()` for dark mode support on every component.
5. Do not invent new patterns. Reuse existing web patterns (PageShell, card styles from CoachDashboard or ParentDashboard).
6. Run `npm run build` after each sub-phase. Zero errors.
7. Commit after each sub-phase: `[phase-2] Phase 2.X: description`
8. If blocked, STOP and report.

---

## TM DASHBOARD DESIGN PHILOSOPHY

**Primary job (one sentence):** See your team's operational health and take action on payments, roster, RSVP, and communication.

**Primary CTA:** Send payment reminders / Mark attendance / Send blast

**What TM needs to answer at a glance:**
- Who hasn't paid?
- Who hasn't RSVP'd to the next event?
- How full is my roster?
- What's coming up next?

**Desktop layout:** Fixed sections (NOT widget grid). The TM dashboard is simpler than admin/coach. It doesn't need drag-and-drop customization. Use the 3-zone approach:

```
┌─────────────────────────────────────────────────┐
│  GREETING + TEAM IDENTITY BAR                   │
├────────────────────┬────────────────────────────┤
│                    │                            │
│  OPERATIONAL       │  QUICK ACTIONS             │
│  CARDS             │  + UPCOMING EVENTS         │
│  (payment health,  │  + INVITE CODE             │
│   RSVP summary,    │                            │
│   roster status)   │                            │
│                    │                            │
├────────────────────┴────────────────────────────┤
│  TEAM ACTIVITY FEED (optional, lower priority)  │
└─────────────────────────────────────────────────┘
```

Left/center area: ~60% width. Right area: ~40% width.

---

## PHASE 2.1: Port `useTeamManagerData` Hook

**Create:** `src/hooks/useTeamManagerData.js`

Port from mobile `hooks/useTeamManagerData.ts` (237 lines). This hook fetches:
- Payment health (overdue count, overdue amount, pending, collected)
- Next event RSVP (event title, date, confirmed/maybe/no-response counts)
- Registration status (open/closed, filled, capacity, pending)
- Roster count

**Porting rules:**
1. Strip TypeScript types. Convert to plain JS.
2. Replace mobile's `useSeason()` with web's `useSeason()` from `src/contexts/SeasonContext.jsx` — check the import path and exported hook name.
3. Supabase queries should be identical (same tables, same columns). The `supabase` import on web is from `src/lib/supabase.js`.
4. The hook signature should be: `useTeamManagerData(teamId)` — same as mobile.
5. Return the same data shape as mobile.

**Read mobile file first:** `hooks/useTeamManagerData.ts`
**Read web's SeasonContext:** `src/contexts/SeasonContext.jsx` — find the hook name (`useSeason`) and what it returns (`workingSeason`).

**Commit:** `[phase-2] Phase 2.1: port useTeamManagerData hook from mobile`

---

## PHASE 2.2: Build Team Manager Dashboard Page

**Create:** `src/pages/roles/TeamManagerDashboard.jsx`

**Structure:**

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTeamManagerData } from '../../hooks/useTeamManagerData'
import { supabase } from '../../lib/supabase'
// Reuse existing shared components:
import WelcomeBanner from '../../components/shared/WelcomeBanner'
```

**The dashboard must include these sections:**

### A) Team Identity Bar (top)
- Team name, team color swatch, sport icon, season name
- Roster count: "12 players"
- Data source: `roleContext.teamManagerInfo[0]` (first team) — passed as prop from MainApp

### B) Operational Cards (center-left, stacked vertically)

**Payment Health Card:**
- Overdue count + amount (red if > 0)
- Pending count
- Total collected
- CTA button: "Send Reminders" → navigates to `/payments`
- Pattern: reuse card styling from `src/components/coach/TeamHealthCard.jsx` or similar

**RSVP Summary Card:**
- Next event name + date + type badge (game/practice)
- Confirmed / Maybe / No Response counts with progress bar
- CTA: "View Event" → navigates to `/schedule`
- If no upcoming event: show empty state "No upcoming events"

**Roster Status Card:**
- Player count
- If registration is open: filled / capacity with progress bar + pending count
- CTA: "View Roster" → navigates to `/roster`

### C) Right Panel (sidebar)

**Quick Actions Grid:**
Reuse the pill/button pattern from existing dashboards. Actions:
- "Mark Attendance" → `/attendance`
- "Send Blast" → `/blasts`
- "View Schedule" → `/schedule`
- "Team Chat" → `/chats`
- "View Payments" → `/payments`
- "Share Invite Code" → opens InviteCodeModal

**Upcoming Events:**
Show next 3 events (same query pattern as CoachDashboard's upcoming events). Each shows: event type icon, title, date, time.

### D) Multi-Team Handling

If TM manages multiple teams (future, currently limited to 1):
- Add a team selector dropdown at the top
- Dashboard data re-fetches when team changes

For now, default to the first team in `roleContext.teamManagerInfo`.

**Styling rules:**
- All cards: `rounded-[14px]`, `border-lynx-silver` (light) / `border-white/[0.06]` (dark)
- All text sizes: `text-r-*` tokens only
- All colors: `lynx-*` tokens only. No hardcoded hex.
- Dark mode: use `useTheme()` → `isDark` for all conditional styling
- Responsive: use `grid grid-cols-1 lg:grid-cols-[1fr_340px]` for the 2-column layout

**Commit:** `[phase-2] Phase 2.2: build TeamManagerDashboard page`

---

## PHASE 2.3: Wire TM Dashboard Into MainApp

**File:** `src/MainApp.jsx`

1. Import the new dashboard:
```javascript
import TeamManagerDashboard from './pages/roles/TeamManagerDashboard'
```

2. Replace the `TeamManagerPlaceholder` (from Phase 0) in the dashboard routing:
```javascript
activeView === 'team_manager' ? <TeamManagerDashboard roleContext={roleContext} showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /> :
```

3. Delete the `TeamManagerPlaceholder` function (it was temporary from Phase 0).

**Commit:** `[phase-2] Phase 2.3: wire TeamManagerDashboard into MainApp routing`

---

## PHASE 2.4: Build Invite Code Modal

**Create:** `src/components/team-manager/InviteCodeModal.jsx`

Port from mobile `components/InviteCodeModal.tsx` (167 lines), adapted for web:

- Modal overlay: use the existing web modal pattern (check how `GiveShoutoutModal.jsx` or `ChallengeDetailModal.jsx` does it — `fixed inset-0 bg-black/60 flex items-center justify-center`)
- Show the invite code in large text
- "Copy Code" button → `navigator.clipboard.writeText(code)` (web API, not expo-clipboard)
- "Share Link" button → copy a join URL like `https://thelynxapp.com/join?code=XXXX`
- Show team name in the modal header
- Close button (X) in top right

**The invite code should come from the `team_invite_codes` table.** Check if the team already has an active code:

```javascript
const { data: existingCode } = await supabase
  .from('team_invite_codes')
  .select('code')
  .eq('team_id', teamId)
  .eq('is_active', true)
  .maybeSingle()
```

If no code exists, generate one and insert it (same pattern as mobile's `generateInviteCode` function in `app/team-manager-setup.tsx`).

**If the `team_invite_codes` table does not exist in the database**, log this as a blocker and skip the modal. Use a placeholder that says "Invite codes coming soon" instead.

**Commit:** `[phase-2] Phase 2.4: build InviteCodeModal for TM`

---

## PHASE 2.5: Build TM Setup Wizard Flow

**Goal:** When a TM user logs in with no teams assigned, show a guided setup flow instead of the dashboard.

**How to detect:** In the dashboard routing, check:
```javascript
activeView === 'team_manager' && (!roleContext?.teamManagerInfo || roleContext.teamManagerInfo.length === 0)
```

If true, render the setup flow instead of the dashboard.

**Create:** `src/pages/team-manager/TeamManagerSetup.jsx`

Port the 4-step flow from mobile `app/team-manager-setup.tsx` (809 lines), adapted for desktop:

### Step 1: Team Info
- Team name (text input)
- Sport selector (dropdown: Volleyball, Basketball, Soccer, Baseball, Football, Swimming)
- Age group (dropdown: 10U through 18U, Open)
- Team color picker (preset swatches)

### Step 2: Season Info
- Season name (auto-filled: "Spring 2026" based on current date, same logic as mobile's `getDefaultSeasonName()`)
- Start date + End date (date pickers)

### Step 3: Organization
- If user already belongs to an org: show it, let them add team to existing org
- If no org: create a micro-org automatically (name = team name + " Club", same as mobile)

### Step 4: Confirmation + Invite Code
- Summary of what was created
- Generated invite code displayed prominently
- "Copy Code" and "Share" buttons
- "Go to Dashboard" button → navigates to `/dashboard`

**Database operations (same as mobile):**
1. Create org (if needed): `organizations` table insert
2. Create season: `seasons` table insert with `organization_id`
3. Create team: `teams` table insert with `season_id`
4. Create staff assignment: `team_staff` table insert with `staff_role: 'team_manager'`
5. Create user_role: `user_roles` table insert with `role: 'team_manager'`
6. Generate invite code: `team_invite_codes` table insert (if table exists)

**After creation, refresh roleContext** so the dashboard loads with the new team data. Call whatever refresh mechanism exists (check if `loadRoleContext` is exposed or if there's a refresh function on AuthContext).

**Styling:**
- Full-page centered card (not a modal), similar to `SetupWizard.jsx` pattern
- Step indicator at top (Step 1 of 4, Step 2 of 4, etc.)
- One step visible at a time, "Next" and "Back" buttons
- Use `lynx-*` tokens, `text-r-*` sizes, `rounded-[14px]` cards
- Dark mode support via `useTheme()`

**Commit:** `[phase-2] Phase 2.5: build TeamManagerSetup wizard`

---

## PHASE 2.6: Wire Setup Flow Into Routing

**File:** `src/MainApp.jsx`

Import and add the setup flow to the dashboard routing:

```javascript
import TeamManagerSetup from './pages/team-manager/TeamManagerSetup'
```

Update the `team_manager` case in the dashboard ternary:

```javascript
activeView === 'team_manager' ? (
  roleContext?.teamManagerInfo?.length > 0
    ? <TeamManagerDashboard roleContext={roleContext} showToast={showToast} ... />
    : <TeamManagerSetup roleContext={roleContext} showToast={showToast} onComplete={() => { /* refresh roleContext */ }} />
) :
```

Check how the existing `SetupWizard` handles post-setup refresh (line ~169 in `SetupWizard.jsx`). Use the same pattern for `onComplete`.

**Commit:** `[phase-2] Phase 2.6: wire TM setup flow into dashboard routing`

---

## PHASE 2.7: Verification

Run the build:
```bash
npm run build
```

**Trace these scenarios:**

### Scenario 1: Brand new TM user (no team)
- Signs up → selects Team Manager role → completes SetupWizard
- `loadRoleContext()` runs → `team_staff` query returns empty → `isTeamManager = true` (from `user_roles`) but `teamManagerInfo = []`
- Dashboard routing: `teamManagerInfo.length === 0` → renders `TeamManagerSetup`
- User completes 4-step setup → org/season/team/staff created → `onComplete` refreshes context
- Dashboard routing: `teamManagerInfo.length > 0` → renders `TeamManagerDashboard`

**Wait:** Check if `isTeamManager` is detected from `user_roles` table or `team_staff` table. If it's only from `team_staff`, a new TM with no team_staff record yet won't have `isTeamManager = true`. This is a chicken-and-egg problem. 

**Resolution:** In Phase 0, `isTeamManager` was set based on `team_staff` query. But the signup flow may insert into `user_roles` with `role: 'team_manager'` BEFORE `team_staff` exists. So `loadRoleContext()` needs to check BOTH:

```javascript
isTeamManager: (teamManagerStaff && teamManagerStaff.length > 0) || roles?.some(r => r.role === 'team_manager'),
```

**If Phase 0 only checks `team_staff`:** Fix it here. Add the `user_roles` fallback. This is a legitimate correction, not scope creep.

### Scenario 2: Existing TM with team
- Logs in → `team_staff` returns their team → dashboard renders with operational cards
- Payment health, RSVP, roster data loads correctly
- Quick actions navigate to correct pages
- Invite code modal opens and shows/generates code

### Scenario 3: TM clicks "Share Invite Code"
- Modal opens → code displayed → "Copy" writes to clipboard → "Share Link" copies URL
- If no code exists, one is generated and inserted

### Scenario 4: TM navigates via sidebar
- Roster → RosterManagerPage loads (scoped to their team? or all teams? Log scoping issue if present)
- Schedule → SchedulePage loads
- Payments → PaymentsPage loads (not ParentPaymentsPage)
- Chats → ChatsPage loads with channel management

**Report back with:**
```
## PHASE 2 VERIFICATION

### Build: PASS / FAIL
### New files created: [list]
### Files modified: [list]
### Total lines added: [count]

### Scenario 1 (New TM, no team): VERIFIED / ISSUE
### Scenario 2 (Existing TM): VERIFIED / ISSUE
### Scenario 3 (Invite code): VERIFIED / ISSUE
### Scenario 4 (Sidebar navigation): VERIFIED / ISSUE

### isTeamManager detection: user_roles / team_staff / BOTH
### Chicken-and-egg resolved: YES / NO / N/A

### Data scoping issues found:
[list pages where TM sees org-wide data instead of team-scoped]

### Tables used: [list all Supabase tables touched by new code]
### Tables that may not exist: [list any tables referenced that could be missing]

### Unexpected issues: NONE / [describe]
```

**Commit:** `[phase-2] Phase 2.7: verification pass complete`

---

## CC PROMPT

```
Read CC-PHASE2-TM-DASHBOARD.md in the repo root. Also read INVESTIGATION-REPORT-WEB-CATCHUP.md for context.

This is Phase 2 — building the Team Manager dashboard, setup wizard, and invite code modal. Phase 0 and Phase 1 are already complete.

Execute sub-phases 2.1 through 2.7 in order. Commit after each.

CRITICAL RULES:
- Follow the existing design system exactly: text-r-* tokens, lynx-* colors, rounded-[14px], useTheme() for dark mode.
- Reuse existing web patterns and components. Do not invent new styling.
- Port mobile logic but adapt for desktop layout (wider viewport, mouse interaction, no haptics).
- If a Supabase table doesn't exist, log it and use a graceful fallback. Do NOT crash.
- The TM dashboard uses FIXED layout, not the widget grid system.

If you encounter something unexpected, STOP and report it.
```
