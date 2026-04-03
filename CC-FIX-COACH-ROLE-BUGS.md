# CC-FIX-COACH-ROLE-BUGS.md

## Overview
Two coach role bugs, one spec:

1. **Coach Dashboard player row navigates to parent route** — clicking a player on the coach roster tab sends the user to `/parent/player/{id}` which can trigger re-renders and session issues. Should open a coach-appropriate view instead.
2. **URL-based role elevation** — typing an admin URL (like `/registrations`) auto-elevates a coach to admin because `loadRoleContext()` always resets `activeView` to the highest role on mount. The selected role needs to persist in localStorage.

---

## FIX 1: Coach Player Row Navigation

**File:** `src/pages/roles/CoachDashboard.jsx`

Find around line 888 where CoachRosterTab is rendered:

```javascript
<CoachRosterTab roster={roster} rsvpCounts={rsvpCounts}
  nextEventId={nextEvent?.id}
  onPlayerClick={(player) => onNavigate?.(`player-${player.id}`)} />
```

The `player-{id}` route resolves to `/parent/player/{id}` in `src/lib/routes.js` — a parent-specific page. Coaches should not navigate to parent routes.

**Replace the onPlayerClick handler with:**

```javascript
<CoachRosterTab roster={roster} rsvpCounts={rsvpCounts}
  nextEventId={nextEvent?.id}
  onPlayerClick={(player) => onNavigate?.(`roster`)} />
```

This sends the coach to the Roster Manager page where they can use the proper three-dot menu to view player profiles. The Roster Manager already has the correct `PlayerDevelopmentCard` slide-out panel.

**Alternative (if you want per-player deep link):** If a `player-profile-{id}` or `stats-{id}` route exists in `routes.js` that renders a coach-appropriate page, use that instead. Check `routes.js` for available coach-friendly player routes first. The key requirement: do NOT navigate to any `/parent/*` route from the coach context.

---

## FIX 2: Persist Active Role in localStorage

**File:** `src/MainApp.jsx`

### Change 1: Save role selection when user switches roles

Find the role switcher onClick handler. It likely looks something like:

```javascript
onClick={() => {
  setActiveView(view.id)
  navigate('/dashboard')
}}
```

**Add localStorage persistence:**

```javascript
onClick={() => {
  setActiveView(view.id)
  localStorage.setItem('lynx_active_view', view.id)
  navigate('/dashboard')
}}
```

Search for ALL places where `setActiveView` is called from the role switcher UI and add the localStorage write. The role switcher might be in a dropdown component, a modal, or inline in MainApp. Find it by searching for `setActiveView` near role/view switching UI elements.

### Change 2: Respect saved role in loadRoleContext()

Find the `loadRoleContext()` function (around lines 835-890). At the end, where it determines which role to set as active, it currently does something like:

```javascript
if (roles?.some(r => r.role === 'league_admin' || r.role === 'admin')) {
  setActiveView('admin')
} else if (coachLink) {
  setActiveView('coach')
} else if (teamManagerStaff) {
  setActiveView('team_manager')
} else if (children?.length > 0) {
  setActiveView('parent')
} else {
  setActiveView('player')
}
```

**Replace with:**

```javascript
// Build list of available roles for this user
const availableRoles = []
if (roles?.some(r => r.role === 'league_admin' || r.role === 'admin')) availableRoles.push('admin')
if (coachLink) availableRoles.push('coach')
if (teamManagerStaff) availableRoles.push('team_manager')
if (children?.length > 0) availableRoles.push('parent')
if (availableRoles.length === 0) availableRoles.push('player')

// Check if user previously selected a role (persists across refresh)
const savedView = localStorage.getItem('lynx_active_view')
if (savedView && availableRoles.includes(savedView)) {
  setActiveView(savedView)
} else {
  // Default to highest privilege role
  setActiveView(availableRoles[0])
}
```

### Change 3: Clear saved role on logout

Find the logout/signout function and add:

```javascript
localStorage.removeItem('lynx_active_view')
```

Search for `signOut`, `handleLogout`, `handleSignOut`, or similar. Make sure the localStorage is cleared before or after the Supabase signout call.

---

## Verification

1. `npm run build` — zero errors
2. **Test role persistence:**
   - Log in as Carlos (has admin + coach roles)
   - Switch to Coach via the role switcher
   - Hard refresh (Ctrl+Shift+R) — should stay in Coach role, NOT auto-elevate to Admin
   - Type `/registrations` in address bar — should redirect to dashboard (RouteGuard blocks coach)
   - Switch back to Admin — confirm admin pages work normally
   - Log out — log back in — should default to Admin (highest role, no saved preference after logout)

3. **Test player row click:**
   - Switch to Coach role
   - Go to Dashboard → Roster tab
   - Click a player row — should navigate to the Roster Manager page (NOT to a parent route, NOT to the setup wizard)

4. **Regression check:**
   - Log in as a user with only one role — should still work normally (no localStorage to read, falls through to default)
   - Role switcher should still work for switching between roles during a session

## Commit
```
git add src/pages/roles/CoachDashboard.jsx src/MainApp.jsx
git commit -m "[fix] Coach: fix player row navigation to parent route; persist active role in localStorage to prevent URL elevation"
```
