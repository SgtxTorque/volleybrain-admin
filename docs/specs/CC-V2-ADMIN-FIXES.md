# CC-V2-ADMIN-FIXES.md
## Lynx Web Admin — V2 Admin Dashboard Bug Fixes
### Post-Investigation Fix Spec

**Branch:** `main` (fixes go directly to main since v2 is already merged)
**Reference:** `V2-ADMIN-INVESTIGATION-REPORT.md` in repo root
**Rule:** Fix ONLY what is listed below. Do not refactor, reorganize, or "improve" anything else. Every fix is surgical. Build-verify-commit after each sub-phase.

---

## SCOPE BOUNDARIES — READ FIRST

### DO touch:
- `src/pages/dashboard/DashboardPage.jsx` (empty state fix, TopBar wiring, data fixes)
- `src/components/v2/admin/AdminTeamsTab.jsx` (team row click fix)
- `src/components/layout/LynxSidebar.jsx` (settings button fix)
- `src/lib/routes.js` (ONLY if adding a 'settings' route alias — see Fix 5)

### DO NOT touch:
- Any file in `src/hooks/` or `src/contexts/` (especially SeasonContext)
- Any Supabase query inside `loadDashboardData()` — zero query changes
- Any other dashboard page (CoachDashboard, ParentDashboard, PlayerDashboard, TeamManagerDashboard)
- Any shared v2 component in `src/components/v2/` (TopBar.jsx, HeroCard.jsx, etc. are LOCKED)
- Any modal component
- Any service layer file

### DO NOT add:
- New npm dependencies
- New files (all fixes are modifications to existing files)

---

## Fix 1: Empty State Race Condition (CRITICAL)

**File:** `src/pages/dashboard/DashboardPage.jsx`

**Problem:** Two race conditions cause the "Your dashboard is waiting!" empty state to appear incorrectly:
- Scenario A: `setLoading(false)` fires prematurely via the `else if (!seasonLoading)` branch before data loads
- Scenario B: Clicking a season card calls `selectSeason()` which does NOT set loading=true, creating a 1-frame gap where stats are stale, and seasons with 0 teams trigger the empty state

**Fix — 3 changes, all in DashboardPage.jsx:**

### Change 1a: Add immediate loading on season switch

Find the useEffect that calls `loadDashboardData()` (around line 139). ADD a separate useEffect ABOVE it that immediately sets loading when the season changes:

```jsx
// Immediately show loading state when season changes (prevents stale data flash)
useEffect(() => {
  if (selectedSeason?.id) {
    setLoading(true);
  }
}, [selectedSeason?.id]);
```

Place this BEFORE the existing useEffect that calls `loadDashboardData()`. This ensures loading is true before the data fetch begins, closing the 1-frame gap.

### Change 1b: Remove the premature setLoading(false) else branch

In the existing useEffect that calls `loadDashboardData()`, REMOVE the `else if` branch:

BEFORE:
```jsx
useEffect(() => {
  if (selectedSeason?.id) {
    loadDashboardData()
  } else if (!seasonLoading) {
    setLoading(false)
  }
}, [selectedSeason?.id, seasonLoading, filterTeam])
```

AFTER:
```jsx
useEffect(() => {
  if (selectedSeason?.id) {
    loadDashboardData()
  }
}, [selectedSeason?.id, seasonLoading, filterTeam])
```

The `GettingStartedGuide` early return at line 581 already handles the "no season" case. The `else if` was redundant and caused premature loading=false.

### Change 1c: Fix the inline empty state conditional

Find the inline empty state (around line 609) that checks `totalTeams === 0`. This condition is wrong because a season can legitimately have 0 teams without the org being new.

BEFORE:
```jsx
{totalTeams === 0 && (
  <div style={{ padding: '64px 32px', textAlign: 'center' ... }}>
    ...Your dashboard is waiting!...
  </div>
)}
```

AFTER:
```jsx
{totalTeams === 0 && !selectedSeason && (
  <div style={{ padding: '64px 32px', textAlign: 'center' ... }}>
    ...Your dashboard is waiting!...
  </div>
)}
```

AND change the v2 layout conditional from:

```jsx
{totalTeams > 0 && (
  <V2DashboardLayout ... />
)}
```

TO:

```jsx
{(totalTeams > 0 || selectedSeason) && (
  <V2DashboardLayout ... />
)}
```

This means: if a season is selected, ALWAYS show the v2 layout (even if that season has 0 teams). The empty state only shows when there is genuinely no season at all (which the GettingStartedGuide already covers, so the inline empty state may never fire — that's fine, it's a safety net).

**Testing after this fix:**
- Load `/dashboard` as admin — should show v2 layout immediately, no empty state flash
- Click each season card in the carousel — should show loading skeleton briefly, then v2 layout with that season's data (even if 0 teams)
- Click a season with 0 teams — should show v2 layout with empty teams tab, NOT the empty state
- Refresh the page — should load correctly without empty state flash

**Commit:** `fix(v2): empty state race condition on season switch`

---

## Fix 2: Wire TopBar into Admin Dashboard

**File:** `src/pages/dashboard/DashboardPage.jsx`

**Problem:** TopBar component exists and is imported but never rendered. The admin dashboard has no top bar, no search trigger, no notification bell, no theme toggle in the main content area.

**Fix:**

The TopBar should render ABOVE the V2DashboardLayout, inside the app-wrapper but outside the dashboard padding. Find where the v2 layout renders and add TopBar before it.

Look at the JSX return. It should currently have something like:

```jsx
return (
  <>
    {/* early returns handled above */}
    {/* empty state or v2 layout */}
  </>
)
```

Add TopBar rendering. The TopBar component is already imported from the v2 barrel. Wire it like this:

```jsx
<TopBar
  roleLabel="Lynx Admin"
  navLinks={[
    { label: 'Dashboard', pageId: 'dashboard', isActive: true },
    { label: 'Schedule', pageId: 'schedule' },
    { label: 'Registrations', pageId: 'registrations' },
    { label: 'Payments', pageId: 'payments' },
  ]}
  searchPlaceholder="Search roster, teams..."
  onSearchClick={() => {
    // Trigger CommandPalette via keyboard event simulation
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  }}
  hasNotifications={(stats.pending || 0) + overdueCount > 0}
  notificationCount={(stats.pending || 0) + overdueCount}
  onNotificationClick={() => onNavigate?.('notifications')}
  avatarInitials={`${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`}
  avatarGradient="linear-gradient(135deg, var(--v2-sky), var(--v2-navy))"
  onSettingsClick={() => onNavigate?.('organization')}
  onThemeToggle={toggleTheme}
  isDark={isDark}
/>
```

**IMPORTANT:** Check if `toggleTheme` is available. It comes from `useTheme()`. If DashboardPage.jsx already destructures `useTheme()`, verify `toggleTheme` (or `toggle` or whatever the function is named) is included. If not, add it to the destructure.

**IMPORTANT:** Check if `profile` is available. It comes from `useAuth()`. Should already be destructured.

**IMPORTANT:** The TopBar should render in ALL cases where the user is on the admin dashboard — both when the v2 layout shows AND when the inline empty state shows. Place it above both conditionals.

**IMPORTANT:** Verify the `onSearchClick` approach works. The CommandPalette in MainApp.jsx listens for Cmd/Ctrl+K. If dispatching a synthetic keyboard event doesn't trigger it, look at how CommandPalette is opened (there may be a state variable in MainApp or a global event) and use that mechanism instead. If you can't determine the mechanism from DashboardPage.jsx's scope, use the keyboard dispatch as a fallback — it should work.

**Nav links:** I changed "Analytics" to "Registrations" and added "Payments" because those are the most-used admin pages. "Analytics" mapped to 'reports' which is fine but Registrations and Payments are higher-traffic for admins. The navLinks in the mockup showed Dashboard/Analytics/Schedule/Roster, but real-world admin flow is more Dashboard/Schedule/Registrations/Payments. Use whichever set you find — the important thing is the pageIds map to real routes.

**Testing:**
- Load admin dashboard — TopBar should appear at top, sticky
- Verify brand label says "Lynx Admin"
- Verify nav links are clickable and navigate to correct pages
- Verify search trigger opens CommandPalette (or at minimum doesn't error)
- Verify notification bell navigates to /notifications
- Verify settings gear navigates to /settings/organization
- Verify theme toggle switches between light and dark

**Commit:** `feat(v2): wire TopBar into admin dashboard`

---

## Fix 3: Team Row Click Broken

**File:** `src/pages/dashboard/DashboardPage.jsx` (where AdminTeamsTab is rendered)

**Problem:** `onNavigate?.('teamwall', { id })` passes `{ id }` but the `handleNavigation` function (or `onNavigate` which wraps `appNavigate`) looks for `item.teamId`. The route 'teamwall' expects a teamId parameter.

**Fix:**

Find where AdminTeamsTab receives its `onTeamClick` (or equivalent) prop. It should be something like:

```jsx
onTeamClick={(id) => onNavigate?.('teamwall', { id })}
```

Change to:

```jsx
onTeamClick={(teamId) => onNavigate?.('teamwall', { teamId })}
```

OR if `appNavigate` is used directly:

```jsx
onTeamClick={(teamId) => appNavigate('teamwall', { teamId })}
```

Verify by checking `src/lib/routes.js` for how 'teamwall' is handled. It likely expects `item.teamId` to construct `/teams/${teamId}`. The fix is simply renaming the parameter from `id` to `teamId` in the object passed to the navigation function.

**Also check AdminTeamsTab.jsx** — verify the component calls `onTeamClick(team.id)` when a row is clicked. If it's not passing the team ID at all, that needs fixing too.

**Testing:**
- Click a team row in the Teams & Health tab
- Should navigate to `/teams/{teamId}` (the team wall page)
- Should NOT navigate to `/dashboard`

**Commit:** `fix(v2): team row click navigates to team wall`

---

## Fix 4: "Reg Link" Playbook Button Broken

**File:** `src/pages/dashboard/DashboardPage.jsx`

**Problem:** The Playbook "Reg Link" action uses pageId `'registration-templates'` which doesn't exist in routes.js. The correct pageId is `'templates'` which maps to `/settings/templates`.

**Fix:**

Find the ThePlaybook actions array (around line 770). Find the "Reg Link" entry:

```jsx
{ emoji: '🔗', label: 'Reg Link', onClick: () => onNavigate?.('registration-templates') }
```

Change to:

```jsx
{ emoji: '🔗', label: 'Reg Link', onClick: () => onNavigate?.('templates') }
```

**Testing:**
- Click "Reg Link" in The Playbook sidebar card
- Should navigate to `/settings/templates`
- Should NOT navigate to `/dashboard`

**Commit:** `fix(v2): Reg Link playbook button uses correct route`

---

## Fix 5: Settings Sidebar Button Broken

**File:** `src/components/layout/LynxSidebar.jsx`

**Problem:** The Settings button at the bottom of the sidebar uses `onNavigate?.('settings', { id: 'settings' })` but `'settings'` is not in routes.js. It falls back to `/dashboard`.

**Fix:**

Find the Settings button in the sidebar bottom section (around line 192). Change the navigation call:

BEFORE:
```jsx
onNavigate?.('settings', { id: 'settings' })
```

AFTER:
```jsx
onNavigate?.('organization')
```

The `'organization'` pageId maps to `/settings/organization` which is the main settings page for admins. This is the most logical destination for a "Settings" icon click.

**DO NOT modify routes.js.** The fix is in the sidebar, not in the routing table.

**Testing:**
- Click the Settings icon (gear) at the bottom of the sidebar
- Should navigate to `/settings/organization`
- Should NOT navigate to `/dashboard`

**Commit:** `fix(v2): settings sidebar button navigates to organization page`

---

## Fix 6: MascotNudge "Not now" Dismiss

**File:** `src/pages/dashboard/DashboardPage.jsx`

**Problem:** The MascotNudge "Not now" secondary action is `onClick: () => {}` — a no-op. The nudge never dismisses.

**Fix:**

Add a dismiss state and wire it:

1. Near the other useState declarations, add:
```jsx
const [nudgeDismissed, setNudgeDismissed] = useState(false);
```

2. Find where MascotNudge is rendered. Wrap it in the dismiss conditional:

BEFORE:
```jsx
<MascotNudge
  message={...}
  primaryAction={...}
  secondaryAction={{ label: 'Not now', onClick: () => {} }}
/>
```

AFTER:
```jsx
{!nudgeDismissed && (
  <MascotNudge
    message={...}
    primaryAction={...}
    secondaryAction={{ label: 'Not now', onClick: () => setNudgeDismissed(true) }}
  />
)}
```

Note: This dismiss is session-only (resets on page refresh). That's fine for now. Persistent dismiss (localStorage) can be added later as polish.

**Testing:**
- Click "Not now" on the MascotNudge
- Nudge should disappear
- Refresh page — nudge should reappear (session-only dismiss is expected)

**Commit:** `fix(v2): MascotNudge dismiss button works`

---

## Fix 7: Attention Strip Navigation Target

**File:** `src/pages/dashboard/DashboardPage.jsx`

**Problem:** The AttentionStrip "REVIEW NOW →" always navigates to `/registrations` even when the action items are overdue payments.

**Fix:**

Find where AttentionStrip is rendered. Make the onClick target dynamic based on what's driving the action count:

BEFORE:
```jsx
<AttentionStrip
  message={`${actionCount} item(s) need(s) action`}
  ctaLabel="REVIEW NOW →"
  onClick={() => onNavigate?.('registrations')}
/>
```

AFTER:
```jsx
<AttentionStrip
  message={`${actionCount} item(s) need(s) action`}
  ctaLabel="REVIEW NOW →"
  onClick={() => {
    if (overdueCount > 0) {
      onNavigate?.('payments');
    } else {
      onNavigate?.('registrations');
    }
  }}
/>
```

This prioritizes payments if there are overdue items (more urgent), falls back to registrations otherwise.

**Testing:**
- With overdue payments: clicking "REVIEW NOW →" should go to `/payments`
- With only pending registrations (no overdue): should go to `/registrations`

**Commit:** `fix(v2): attention strip navigates to most urgent action`

---

## EXECUTION ORDER

Execute fixes in this exact order:
1. Fix 1 (empty state) — most critical, unblocks testing of everything else
2. Fix 2 (TopBar) — adds major missing UI element
3. Fix 3 (team row click)
4. Fix 4 (Reg Link)
5. Fix 5 (Settings button)
6. Fix 6 (MascotNudge dismiss)
7. Fix 7 (Attention Strip target)

Build and verify after EACH fix. Push after all 7 are committed.

---

## POST-FIX VERIFICATION

After all 7 fixes are committed and pushed:

1. Load `/dashboard` as admin — v2 layout with TopBar visible, no empty state flash
2. Click through ALL season cards — each loads correctly, no empty state
3. Click a team row — navigates to team wall
4. Click "Reg Link" in Playbook — navigates to /settings/templates
5. Click Settings gear in sidebar — navigates to /settings/organization
6. Click "Not now" on MascotNudge — nudge disappears
7. Click "REVIEW NOW" on AttentionStrip — navigates to payments or registrations based on context
8. Verify search trigger in TopBar opens CommandPalette
9. Verify notification bell in TopBar works
10. Verify theme toggle works
11. Switch to Coach/Parent/Player/Team Manager — verify no regressions
12. Switch back to Admin — verify dashboard still works

Report results. If all pass, we're clean.

---

## KNOWN DEFERRED ITEMS (do NOT fix now)

These were identified in the investigation but are polish, not bugs:
- AdminTeamsTab "Unpaid" column hardcoded to 0 (needs per-team payment query — separate spec)
- OrgHealthCard bar percentages are arbitrary scaling (design decision, not a bug)
- WeeklyLoad "This Week" label hardcoded (minor polish)
- overdueCount approximated from dollar amounts (needs query refactor — separate spec)
- FinancialSnapshot both buttons go to same page (no separate ledger view exists yet)
- HeroCard stats not clickable (design decision — can add later)
- WeeklyLoad events not clickable (design decision — can add later)
