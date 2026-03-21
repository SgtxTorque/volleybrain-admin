# V2 Crash Investigation — getAvailableViews

## Error

```
ReferenceError: getAvailableViews is not defined
    at MainApp.jsx:660:163
```

Site-down blocker. The entire dashboard is crashed — no role/view can render.

## Root Cause

**Commit:** `abb30b8` — `feat(v2): role switcher in TopBar brand label`

**The bug is a scoping error.** The commit added `availableViews={getAvailableViews()}` to all 6 dashboard component instances inside the `RoutedContent` function (lines 660–669). However, `getAvailableViews` is defined inside `MainApp()` at line 861 — a **different function scope**. `RoutedContent` is an independent function component defined at line 650, **not** nested inside `MainApp`. Therefore, `getAvailableViews` is simply not in scope.

### Crash Site (lines 655–670)

```javascript
// Line 650 — RoutedContent is a SEPARATE function, not inside MainApp
function RoutedContent({ activeView, roleContext, showToast, selectedPlayerForView, setSelectedPlayerForView }) {
  const navigate = useNavigate()
  const location = useLocation()
  const navigateToTeamWall = (teamId) => navigate(`/teams/${teamId}`)

  return (
    <div key={location.pathname} className="animate-page-in">
    <Routes>
      {/* Dashboard — role-dependent */}
      <Route path="/dashboard" element={
        activeView === 'admin' ? <DashboardPage onNavigate={...} activeView={activeView} availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); navigate('/dashboard') }} /> :
        activeView === 'coach' ? <CoachDashboard ... availableViews={getAvailableViews()} onSwitchRole={(viewId) => { setActiveView(viewId); navigate('/dashboard') }} /> :
        // ... same pattern for all 6 dashboard instances
      } />
```

**Second hidden crash:** The same lines also reference `setActiveView` inside `onSwitchRole` lambdas. `setActiveView` is also local to `MainApp`, not passed to `RoutedContent`. If the first crash were somehow bypassed, clicking any role in the dropdown would throw a second `ReferenceError`.

## What getAvailableViews Was Supposed To Be

`getAvailableViews` builds the list of available role views based on the current user's roles. It returns an array like:

```javascript
[
  { id: 'admin',        label: 'Admin',        icon: 'shield',     description: 'Full league management' },
  { id: 'coach',        label: 'Coach',        icon: 'user-cog',   description: 'Team A, Team B' },
  { id: 'team_manager', label: 'Team Manager', icon: 'clipboard',  description: 'Team operations' },
  { id: 'parent',       label: 'Parent',       icon: 'users',      description: 'Ava, Max' },
  { id: 'player',       label: 'Player',       icon: 'volleyball', description: 'Preview player view' },
]
```

## Where Available Roles Are Currently Computed

**Line 861 inside `MainApp()`:**

```javascript
const getAvailableViews = () => {
  const views = []
  if (roleContext?.isAdmin) {
    views.push({ id: 'admin', label: 'Admin', icon: 'shield', description: 'Full league management' })
  }
  if (roleContext?.isCoach) {
    const teamNames = roleContext.coachInfo?.team_coaches?.map(tc => tc.teams?.name).filter(Boolean).join(', ')
    views.push({ id: 'coach', label: 'Coach', icon: 'user-cog', description: teamNames || 'Team management' })
  }
  if (roleContext?.isTeamManager) {
    const teamNames = roleContext.teamManagerInfo?.map(ts => ts.teams?.name).filter(Boolean).join(', ')
    views.push({ id: 'team_manager', label: 'Team Manager', icon: 'clipboard', description: teamNames || 'Team operations' })
  }
  if (roleContext?.isParent && roleContext.children?.length > 0) {
    const childNames = roleContext.children.map(c => c.first_name).join(', ')
    views.push({ id: 'parent', label: 'Parent', icon: 'users', description: childNames })
  }
  if (roleContext?.isPlayer) {
    views.push({ id: 'player', label: 'Player', icon: 'volleyball', description: roleContext.playerInfo?.first_name })
  }
  if ((roleContext?.isAdmin || roleContext?.isCoach) && !roleContext?.isPlayer) {
    views.push({ id: 'player', label: 'Player', icon: 'volleyball', description: 'Preview player view' })
  }
  return views
}
```

This function depends on `roleContext`, which IS available in `RoutedContent` (passed as a prop). But the function itself is not.

## Complete Role-Switching Data Flow

1. **`MainApp`** (line 773) owns `activeView` state and `setActiveView` setter
2. **`MainApp`** defines `getAvailableViews()` at line 861 — reads from `roleContext` state
3. **`MainApp`** renders `<RoutedContent>` at ~line 1190 and passes: `activeView`, `roleContext`, `showToast`, `selectedPlayerForView`, `setSelectedPlayerForView`
4. **`MainApp`** does NOT pass `getAvailableViews` or `setActiveView` to `RoutedContent`
5. **`RoutedContent`** (line 650) is a separate function component that renders dashboard pages via React Router
6. The crashing commit added `availableViews={getAvailableViews()}` and `onSwitchRole={(viewId) => { setActiveView(viewId); ... }}` inside `RoutedContent` — both reference `MainApp`-scoped variables that aren't in scope

## Recommended Fix

Pass `getAvailableViews` and `setActiveView` from `MainApp` into `RoutedContent` as props.

### Step 1: Add props to RoutedContent signature (line 650)

```javascript
// BEFORE
function RoutedContent({ activeView, roleContext, showToast, selectedPlayerForView, setSelectedPlayerForView }) {

// AFTER
function RoutedContent({ activeView, roleContext, showToast, selectedPlayerForView, setSelectedPlayerForView, getAvailableViews, setActiveView }) {
```

### Step 2: Pass them from MainApp where RoutedContent is rendered (~line 1190)

Find where `<RoutedContent` is rendered in `MainApp` and add the two new props:

```jsx
<RoutedContent
  activeView={activeView}
  roleContext={roleContext}
  showToast={showToast}
  selectedPlayerForView={selectedPlayerForView}
  setSelectedPlayerForView={setSelectedPlayerForView}
  getAvailableViews={getAvailableViews}   // ADD
  setActiveView={setActiveView}            // ADD
/>
```

No other changes needed — the `getAvailableViews()` calls and `setActiveView` references inside `RoutedContent` will then resolve correctly.

## Domino Check

Files touched by the crashing commit (`abb30b8`):

| File | Status |
|------|--------|
| `src/MainApp.jsx` | **BROKEN** — `getAvailableViews` and `setActiveView` not in scope in `RoutedContent` |
| `src/components/v2/TopBar.jsx` | OK — new `availableRoles`, `activeRoleId`, `onRoleSwitch` props added correctly |
| `src/components/layout/LynxSidebar.jsx` | OK — `<RoleSwitcher>` JSX removed from render, component definition still exists (unused) |
| `src/pages/dashboard/DashboardPage.jsx` | OK — receives new props (`activeView`, `availableViews`, `onSwitchRole`) and passes to `<TopBar>` |
| `src/pages/roles/CoachDashboard.jsx` | OK — receives new props, adds `<TopBar>`, imports `TopBar` |
| `src/pages/roles/ParentDashboard.jsx` | OK — receives new props, adds `<TopBar>`, imports `TopBar` |
| `src/pages/roles/PlayerDashboard.jsx` | OK — receives new props, adds `<TopBar>`, imports `useTheme` and `TopBar` |
| `src/pages/roles/TeamManagerDashboard.jsx` | OK — receives new props, adds `<TopBar>`, imports `useTheme` and `TopBar` |

Files touched by the prior commit (`ff354f7`):

| File | Status |
|------|--------|
| `src/components/v2/MilestoneCard.jsx` | OK — null safety added correctly |
| `src/pages/dashboard/DashboardPage.jsx` | OK — coaches query FK alias fixed |

## Other Issues Found

1. **`setActiveView` also out of scope** — Same scoping problem. Used in `onSwitchRole` lambdas inside `RoutedContent` but defined in `MainApp`. Would crash on role switch click even if `getAvailableViews` were fixed alone.

2. **`loadRoleContext` also out of scope** — Line 665: `<TeamManagerSetup ... onComplete={() => loadRoleContext()} />`. This was already present before the crashing commit, so it's a pre-existing issue that may have been silently failing or was never triggered.

3. **Dead code in LynxSidebar** — The `RoleSwitcher` function component (lines 64–185) is still defined but no longer rendered. Not a crash risk, just dead code.

4. **`TopBar` role dropdown always renders white background** — Even in player dark mode (`isDark=true`), the role dropdown uses `background: '#FFFFFF'` hardcoded. This is a cosmetic issue, not a crash.
