# CC-WEB-ROLE-ACCESS.md
## Lynx Web Admin -- Remove Admin Gate + Add Route Guards
### For Claude Code Execution

**Repo:** volleybrain-admin
**Branch:** feat/desktop-dashboard-redesign
**Backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**Date:** March 7, 2026

---

## RULES

1. **Read CLAUDE.md** in the project root before doing anything.
2. **Read `src/App.jsx` and `src/MainApp.jsx` FULLY** before modifying. These are the two most critical files in the app.
3. **Archive before replace** -- copy originals to `src/_archive/role-access/`.
4. **Do NOT touch:** `src/contexts/*`, `src/lib/*`, dashboard files, page files. Only App.jsx, MainApp.jsx, and one new component.
5. **Commit after each phase.**
6. **Test all 4 roles** render without errors after each phase.

---

## CONTEXT

The web admin currently has a hard `!isAdmin` gate in `App.jsx` (line 43) that blocks ALL non-admin users with an "Access Denied" screen. This means coaches, parents, and players cannot use the web at all.

RLS policies have already been applied in Supabase (role-scoped, March 7 2026), so the database layer is secure. This spec opens the front door (App.jsx) and adds route-level guards (MainApp.jsx) so that non-admin users can access the web but only see pages appropriate to their role.

The app already has a full role system: `activeView` state, `roleContext` object (isAdmin, isCoach, isParent, isPlayer), `getAvailableViews()`, and role-specific nav groups in LynxSidebar. The role switcher UI works. The dashboards are role-aware. The ONLY thing blocking non-admins is the hard gate in App.jsx.

---

## PHASE 1: Remove Admin Gate in App.jsx

**File:** `src/App.jsx`

**Current code (lines 42-50):**
```jsx
      {needsOnboarding ? (
        <SetupWizard onComplete={completeOnboarding} />
      ) : !isAdmin ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
          <div className="text-center">
            <span className="text-5xl">🔒</span>
            <h2 className="text-xl font-bold mt-4" style={{ color: colors.text }}>Access Denied</h2>
            <p className="mt-2" style={{ color: colors.textSecondary }}>Admin access required</p>
          </div>
        </div>
      ) : (
        <MainApp />
      )}
```

**Replace with:**
```jsx
      {needsOnboarding ? (
        <SetupWizard onComplete={completeOnboarding} />
      ) : (
        <MainApp />
      )}
```

That's it. Remove the entire `!isAdmin` ternary branch. The `isAdmin` import can stay in the destructuring since other code may reference it later, but the gate itself is gone.

**Why this is safe:** MainApp.jsx already has `activeView` which determines what nav items, dashboard, and content each role sees. The sidebar only shows nav links appropriate to the user's role. And RLS policies in Supabase enforce data access at the database level regardless of what the frontend does.

**Commit:** `"Remove admin-only gate in App.jsx -- all authenticated roles can now access web"`

---

## PHASE 2: Create RouteGuard Component

**Create file:** `src/components/auth/RouteGuard.jsx`

```jsx
import { Navigate } from 'react-router-dom'

/**
 * RouteGuard -- wraps routes that should only be accessible to certain roles.
 * If the user's activeView doesn't match any of the allowed roles,
 * they get redirected to /dashboard.
 *
 * Usage:
 *   <RouteGuard allow={['admin']}>
 *     <SettingsPage />
 *   </RouteGuard>
 *
 *   <RouteGuard allow={['admin', 'coach']}>
 *     <GamePrepPage />
 *   </RouteGuard>
 */
export default function RouteGuard({ allow, activeView, children }) {
  if (!allow || allow.length === 0) return children
  if (allow.includes(activeView)) return children
  return <Navigate to="/dashboard" replace />
}
```

**Commit:** `"Add RouteGuard component for role-based route protection"`

---

## PHASE 3: Wrap Admin-Only Routes in MainApp.jsx

**File:** `src/MainApp.jsx` -- inside the `RoutedContent` function.

1. Import RouteGuard at the top:
```jsx
import RouteGuard from './components/auth/RouteGuard'
```

2. Wrap admin-only routes. These are the routes that should ONLY be accessible when `activeView === 'admin'`:

```jsx
{/* Admin-only: Settings */}
<Route path="/settings/seasons" element={<RouteGuard allow={['admin']} activeView={activeView}><SeasonsPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/templates" element={<RouteGuard allow={['admin']} activeView={activeView}><RegistrationTemplatesPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/waivers" element={<RouteGuard allow={['admin']} activeView={activeView}><WaiversPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/payment-setup" element={<RouteGuard allow={['admin']} activeView={activeView}><PaymentSetupPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/organization" element={<RouteGuard allow={['admin']} activeView={activeView}><OrganizationPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/data-export" element={<RouteGuard allow={['admin']} activeView={activeView}><DataExportPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/subscription" element={<RouteGuard allow={['admin']} activeView={activeView}><SubscriptionPage showToast={showToast} /></RouteGuard>} />
<Route path="/settings/venues" element={<RouteGuard allow={['admin']} activeView={activeView}><VenueManagerPage showToast={showToast} /></RouteGuard>} />

{/* Admin-only: Season Management */}
<Route path="/admin/seasons/:seasonId" element={<RouteGuard allow={['admin']} activeView={activeView}><SeasonManagementPage showToast={showToast} onNavigate={...} /></RouteGuard>} />
<Route path="/admin/seasons" element={<RouteGuard allow={['admin']} activeView={activeView}><SeasonManagementPage showToast={showToast} onNavigate={...} /></RouteGuard>} />

{/* Admin-only: Registrations, Push Notifications, Reports */}
<Route path="/registrations" element={<RouteGuard allow={['admin']} activeView={activeView}><RegistrationsPage showToast={showToast} /></RouteGuard>} />
<Route path="/notifications" element={<RouteGuard allow={['admin']} activeView={activeView}><NotificationsPage showToast={showToast} /></RouteGuard>} />
<Route path="/reports" element={<RouteGuard allow={['admin']} activeView={activeView}><ReportsPage showToast={showToast} /></RouteGuard>} />
<Route path="/reports/funnel" element={<RouteGuard allow={['admin']} activeView={activeView}><RegistrationFunnelPage showToast={showToast} /></RouteGuard>} />

{/* Platform admin: super-admin only */}
<Route path="/platform/admin" element={<RouteGuard allow={['admin']} activeView={activeView}><PlatformAdminPage showToast={showToast} /></RouteGuard>} />
<Route path="/platform/analytics" element={<RouteGuard allow={['admin']} activeView={activeView}><PlatformAnalyticsPage showToast={showToast} /></RouteGuard>} />
<Route path="/platform/subscriptions" element={<RouteGuard allow={['admin']} activeView={activeView}><PlatformSubscriptionsPage showToast={showToast} /></RouteGuard>} />
```

3. Wrap admin+coach routes (accessible to both):
```jsx
{/* Admin + Coach: Game Prep, Coaches, Roster */}
<Route path="/gameprep" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><GamePrepPage showToast={showToast} /></RouteGuard>} />
<Route path="/coaches" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><CoachesPage showToast={showToast} /></RouteGuard>} />
<Route path="/roster" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><RosterManagerPage ... /></RouteGuard>} />
<Route path="/blasts" element={<RouteGuard allow={['admin', 'coach']} activeView={activeView}><BlastsPage ... /></RouteGuard>} />
```

4. Leave these routes UNGUARDED (all roles need them):
```jsx
{/* All roles */}
/dashboard         -- role-aware via activeView
/schedule          -- all roles view events
/attendance        -- coaches and admins (already role-filtered in component)
/payments          -- role-aware (admin sees all, parent sees own)
/chats             -- all roles (COPPA-gated for parents)
/standings         -- all roles
/leaderboards      -- all roles
/achievements      -- all roles
/archives          -- all roles
/directory         -- all roles
/teams/:teamId     -- team wall, all roles
/profile           -- all roles
/my-stuff          -- parent
/parent/*          -- parent routes
/stats             -- player
/claim-account     -- parent
/parent/register   -- parent
```

**Important:** Pass `activeView` to `RoutedContent` if it isn't already (check the existing props -- it likely already is based on the current code).

**Commit:** `"Add RouteGuard to admin-only and admin+coach routes in MainApp.jsx"`

---

## PHASE 4: Verification

1. Log in as your admin account. Verify:
   - Dashboard loads (admin view)
   - Can navigate to /settings/*, /registrations, /reports, /platform/*
   - Role switcher still works (switch to coach, parent, player views)
   - When switched to parent view, navigating to /settings/* redirects to /dashboard
   - When switched to coach view, /gameprep works, /settings/* redirects to /dashboard
2. Run `npm run build` -- zero errors.
3. If possible, create a test parent account and verify they land on the parent dashboard and cannot access admin routes.

**Commit:** `"Role access verified -- admin gate removed, route guards active"`

---

## DONE

After these 4 phases:
- Any authenticated user with a role in the org can access the web
- Their `activeView` determines their navigation and dashboard
- Admin-only routes redirect non-admins to /dashboard
- RLS in Supabase enforces data access at the database level
- The sidebar already hides nav items per role, so users won't even see links to pages they can't access
