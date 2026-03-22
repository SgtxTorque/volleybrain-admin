# CC-PHASE0-ROLE-FOUNDATION.md
## Execution Spec: Phase 0 — Role Foundation Fix

**Date:** March 19, 2026
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `feat/desktop-dashboard-redesign`
**Prereq:** Read `INVESTIGATION-REPORT-WEB-CATCHUP.md` first. That report is your source of truth for line numbers and file locations.

---

## WHAT THIS PHASE DOES

Fixes the role detection chain so the web app correctly identifies ALL six roles (admin, coach, team_manager, parent, player). Adds Team Manager to the role switcher, dashboard routing, sidebar nav, and route guards. Fixes the `isPlayer` bug. Adds RouteGuard to 6 unprotected routes.

This is the foundation everything else builds on. Nothing else ships until this is solid.

---

## WHAT THIS PHASE DOES NOT DO

- Does NOT build a Team Manager dashboard page (Phase 2)
- Does NOT port quest/XP engines (Phase 3)
- Does NOT redesign any existing dashboard
- Does NOT add new components or widgets
- Does NOT touch the design system, fonts, or styling
- Does NOT refactor anything that already works

---

## RULES

1. Read every file before modifying it.
2. Make the MINIMUM change needed. No bonus refactors.
3. Do not rename variables, restructure files, or "improve" code style.
4. Do not touch any file not listed in this spec.
5. After each phase, run `npm run build` (or the project's build command) and confirm zero errors.
6. Commit after each phase with the message format: `[phase-0] Phase X.Y: description`
7. If you encounter something unexpected, STOP and report it. Do not guess your way through.
8. Every RouteGuard `allow` array must match the permission matrix below exactly. Do not add roles "just in case."
9. Do not change any existing dashboard component's rendering logic.
10. The hardcoded hex cleanup (Phase 9 from the report) is NOT in scope. Do not fix colors you see along the way.

---

## PERMISSION MATRIX (source of truth)

This is what mobile enforces. Web must match.

| Feature | admin | coach | team_manager | parent | player |
|---------|-------|-------|-------------|--------|--------|
| Roster view/edit | Yes | Yes | Yes | No | No |
| Schedule view/edit | Yes | Yes | Yes | No | No |
| Attendance | Yes | Yes | Yes | No | No |
| Payments view | Yes | Yes (scoped) | Yes (scoped) | Yes (own) | No |
| Blasts / Announcements | Yes | Yes | Yes | No | No |
| Chat | Yes | Yes | Yes | Yes | No |
| Standings | Yes | Yes | Yes | Yes | Yes |
| Leaderboards | Yes | Yes | Yes | Yes | Yes |
| Achievements | Yes | Yes | Yes | Yes | Yes |
| Game Prep | Yes | Yes | **No** | No | No |
| Coaches page | Yes | Yes | **No** | No | No |
| Registrations mgmt | Yes | No | No | No | No |
| Jerseys mgmt | Yes | No | No | No | No |
| Settings pages | Yes | No | No | No | No |
| Reports/Analytics | Yes | No | No | No | No |
| Notifications mgmt | Yes | No | No | No | No |
| Platform admin | Yes | No | No | No | No |
| Parent messages | No | No | No | Yes | No |
| Parent my-stuff | No | No | No | Yes | No |
| Parent registration | No | No | No | Yes | No |
| Invite friends | No | No | No | Yes | No |

---

## PHASE 0.1: Fix `loadRoleContext()` — Add TM detection + fix isPlayer

**File:** `src/MainApp.jsx`
**Location:** The `loadRoleContext()` function (starts around line 898)

**Current code does:**
1. Queries `user_roles` for admin/parent detection
2. Queries `coaches` table for coach detection
3. Queries `players` via `parent_account_id` for parent children
4. Sets `playerSelf = null` (hardcoded — broken)
5. Sets roleContext with isAdmin, isCoach, isParent, isPlayer
6. Sets activeView priority: admin > coach > parent > player

**Changes needed:**

### Change 1: Add `team_staff` query (after the `coaches` query, before the `children` query)

Add a query to detect Team Manager assignments:

```javascript
const { data: teamManagerStaff } = await supabase
  .from('team_staff')
  .select('team_id, staff_role, is_active, teams(id, name, color, season_id)')
  .eq('user_id', profile.id)
  .eq('staff_role', 'team_manager')
  .eq('is_active', true)
```

### Change 2: Fix `playerSelf` detection (replace `const playerSelf = null`)

Replace the hardcoded null with an actual query:

```javascript
const { data: playerSelf } = await supabase
  .from('players')
  .select('*, team_players(team_id, jersey_number, teams(id, name, color, season_id))')
  .eq('profile_id', profile.id)
  .maybeSingle()
```

Note: This uses `profile_id` to find if the logged-in user IS a player (not parent_account_id, which finds their children). If the `players` table does not have a `profile_id` column, check the schema and use the correct column. If no column links a profile to a player self-record, log this in your commit message and leave `playerSelf = null` with a `// TODO: needs profile_id linkage` comment.

### Change 3: Add `isTeamManager` to roleContext object

In the `setRoleContext({...})` call, add:

```javascript
isTeamManager: teamManagerStaff && teamManagerStaff.length > 0,
teamManagerInfo: teamManagerStaff || [],
```

### Change 4: Fix `isPlayer` in roleContext

Change from:
```javascript
isPlayer: !!playerSelf
```
To:
```javascript
isPlayer: !!playerSelf,
playerInfo: playerSelf,
```

### Change 5: Add TM to `setActiveView()` priority chain

Current priority: admin > coach > parent > player

New priority: admin > coach > team_manager > parent > player

After the `else if (coachLink)` block and before the `else if (children?.length > 0)` block, add:

```javascript
} else if (teamManagerStaff && teamManagerStaff.length > 0) {
  setActiveView('team_manager')
```

**Commit:** `[phase-0] Phase 0.1: fix loadRoleContext — add TM detection, fix isPlayer`

---

## PHASE 0.2: Add TM to `getAvailableViews()`

**File:** `src/MainApp.jsx`
**Location:** The `getAvailableViews()` function (starts around line 941)

Add a Team Manager entry after the coach entry and before the parent entry:

```javascript
if (roleContext?.isTeamManager) {
  const teamNames = roleContext.teamManagerInfo?.map(ts => ts.teams?.name).filter(Boolean).join(', ')
  views.push({ id: 'team_manager', label: 'Team Manager', icon: 'clipboard', description: teamNames || 'Team operations' })
}
```

**Commit:** `[phase-0] Phase 0.2: add team_manager to getAvailableViews`

---

## PHASE 0.3: Add TM to dashboard routing

**File:** `src/MainApp.jsx`
**Location:** The `RoutedContent` function, dashboard routing ternary chain (around line 775)

The current chain is:
```javascript
activeView === 'admin' ? <DashboardPage ... /> :
activeView === 'coach' ? <CoachDashboard ... /> :
activeView === 'parent' ? <ParentDashboard ... /> :
activeView === 'player' ? <PlayerDashboard ... /> :
<DashboardPage ... />
```

Add a `team_manager` case. Since we're NOT building the TM dashboard in this phase, route TM to a **temporary placeholder** that clearly identifies itself. Do NOT route TM to CoachDashboard or DashboardPage as a shortcut.

Add between the coach and parent cases:

```javascript
activeView === 'team_manager' ? <TeamManagerPlaceholder /> :
```

Then, at the TOP of the `RoutedContent` function (inside it, before the return), add:

```javascript
function TeamManagerPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-r-3xl font-bold text-lynx-navy dark:text-white mb-2">Team Manager Dashboard</div>
        <p className="text-r-base text-slate-500 dark:text-slate-400">Coming soon. Your team operations hub is being built.</p>
        <p className="text-r-sm text-slate-400 dark:text-slate-500 mt-4">Role detected successfully. Nav and permissions are active.</p>
      </div>
    </div>
  )
}
```

This placeholder confirms the role is working without pretending to be a real dashboard. It will be replaced in Phase 2.

**Commit:** `[phase-0] Phase 0.3: add team_manager dashboard routing with placeholder`

---

## PHASE 0.4: Add Team Manager nav group

**File:** `src/MainApp.jsx`
**Location:** After the existing nav group definitions (adminNavGroups, coachNavGroups, parentNavGroups, playerNavGroups)

Add:

```javascript
const teamManagerNavGroups = [
  { id: 'dashboard', label: 'Dashboard', type: 'single' },
  { id: 'myteams', label: 'My Teams', type: 'group', icon: 'teams', items: [
    { id: 'roster', label: 'Roster Manager', icon: 'users' },
    ...(roleContext?.teamManagerInfo?.map(ts => ({
      id: `teamwall-${ts.team_id}`,
      label: ts.teams?.name || 'Team',
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

Then find where nav groups are passed to `LynxSidebar` or `HorizontalNavBar` based on `activeView`. There should be a conditional like:

```javascript
const navGroups = activeView === 'admin' ? adminNavGroups : 
                  activeView === 'coach' ? coachNavGroups : ...
```

Add the `team_manager` case:

```javascript
activeView === 'team_manager' ? teamManagerNavGroups :
```

**Commit:** `[phase-0] Phase 0.4: add teamManagerNavGroups and wire to sidebar`

---

## PHASE 0.5: Add RouteGuards to unprotected routes + add TM to existing guards

**File:** `src/MainApp.jsx`
**Location:** The `RoutedContent` function, route definitions

### Part A: Add RouteGuard to 6 unprotected routes

Wrap these routes with RouteGuard:

```jsx
{/* /attendance — currently unguarded */}
<Route path="/attendance" element={
  <RouteGuard allow={['admin', 'coach', 'team_manager']} activeView={activeView}>
    <AttendancePage showToast={showToast} />
  </RouteGuard>
} />

{/* /schedule/availability — currently unguarded */}
<Route path="/schedule/availability" element={
  <RouteGuard allow={['admin', 'coach']} activeView={activeView}>
    <CoachAvailabilityPage ... />
  </RouteGuard>
} />

{/* /messages — currently unguarded */}
<Route path="/messages" element={
  <RouteGuard allow={['parent']} activeView={activeView}>
    <ParentMessagesPage ... />
  </RouteGuard>
} />

{/* /invite — currently unguarded */}
<Route path="/invite" element={
  <RouteGuard allow={['parent']} activeView={activeView}>
    <InviteFriendsPage ... />
  </RouteGuard>
} />

{/* /my-stuff — currently unguarded */}
<Route path="/my-stuff" element={
  <RouteGuard allow={['parent']} activeView={activeView}>
    <MyStuffPage ... />
  </RouteGuard>
} />

{/* /parent/register — currently unguarded */}
<Route path="/parent/register" element={
  <RouteGuard allow={['parent']} activeView={activeView}>
    <ParentRegistrationHub ... />
  </RouteGuard>
} />
```

**IMPORTANT:** Keep all existing props on these Route elements. Do not remove `roleContext`, `showToast`, or any other prop that's already being passed. Just wrap the element in `<RouteGuard>`.

### Part B: Add `'team_manager'` to existing RouteGuards where TM should have access

Per the permission matrix, add `'team_manager'` to these existing RouteGuards:

| Route | Current allow | New allow |
|-------|-------------|-----------|
| `/roster` | `['admin', 'coach']` | `['admin', 'coach', 'team_manager']` |
| `/blasts` | `['admin', 'coach']` | `['admin', 'coach', 'team_manager']` |

**Do NOT add `'team_manager'` to these routes (TM should NOT access them):**
- `/coaches` — coach management, not TM
- `/gameprep` — game day operations, coach-only
- `/registrations`, `/jerseys`, `/notifications`, `/reports`, `/reports/funnel` — admin-only
- All `/settings/*` routes — admin-only
- All `/platform/*` routes — admin-only
- All `/admin/*` routes — admin-only

**Commit:** `[phase-0] Phase 0.5: add RouteGuards to 6 unprotected routes, add TM to roster and blasts guards`

---

## PHASE 0.6: Verification

Run the build:
```bash
npm run build
```

If it fails, fix only the build errors introduced by this phase. Do not fix pre-existing issues.

Then verify by tracing these scenarios mentally through the code:

### Scenario 1: TM-only user logs in
- `loadRoleContext()` queries `team_staff` → finds record → `isTeamManager = true`
- `setActiveView('team_manager')` fires (admin and coach are false)
- `getAvailableViews()` returns `[{ id: 'team_manager', label: 'Team Manager', ... }]`
- Dashboard routing hits `activeView === 'team_manager'` → renders `TeamManagerPlaceholder`
- Sidebar receives `teamManagerNavGroups`
- RouteGuards: TM can access `/roster`, `/blasts`, `/attendance`, `/schedule`, `/standings`, `/leaderboards`, `/chats`, `/achievements`
- RouteGuards: TM is blocked from `/gameprep`, `/coaches`, `/registrations`, all `/settings/*`, all `/admin/*`

### Scenario 2: Admin + TM user logs in
- `isAdmin = true`, `isTeamManager = true`
- `setActiveView('admin')` fires (admin wins priority)
- Role switcher shows both Admin and Team Manager views
- User can switch to TM view → sidebar changes to TM groups, dashboard shows placeholder

### Scenario 3: Coach + TM user logs in
- `isCoach = true`, `isTeamManager = true`
- `setActiveView('coach')` fires (coach wins over TM)
- Role switcher shows both Coach and Team Manager
- User can switch to TM view

### Scenario 4: Player user logs in (isPlayer fix)
- `playerSelf` query finds record → `isPlayer = true`
- `setActiveView('player')` fires
- Player dashboard renders (previously unreachable)

**Report back with:**
```
## PHASE 0 VERIFICATION

### Build: PASS / FAIL
### Files changed: [list]
### Lines changed: [approximate count]

### Scenario 1 (TM-only): VERIFIED / ISSUE: [describe]
### Scenario 2 (Admin+TM): VERIFIED / ISSUE: [describe]
### Scenario 3 (Coach+TM): VERIFIED / ISSUE: [describe]
### Scenario 4 (Player fix): VERIFIED / ISSUE: [describe]

### Unexpected issues found: NONE / [describe]
### Pre-existing issues noticed but NOT fixed: [list]
```

**Commit:** `[phase-0] Phase 0.6: verification pass complete`

---

## CC PROMPT

```
Read CC-PHASE0-ROLE-FOUNDATION.md in the repo root. Also read INVESTIGATION-REPORT-WEB-CATCHUP.md for context and line numbers.

This is Phase 0 of the web catch-up. It fixes the role detection chain and adds Team Manager support to routing, nav, and route guards. It also fixes the isPlayer bug.

Execute each sub-phase (0.1 through 0.6) in order. Commit after each sub-phase. Do NOT expand scope. Do NOT refactor. Do NOT fix styling or design system issues. Do NOT build the TM dashboard — this phase uses a placeholder only.

If the build breaks, fix only what this phase introduced. If you encounter something unexpected, STOP and report it.

After Phase 0.6, output the verification report as specified in the spec.
```
