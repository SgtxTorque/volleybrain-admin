# CC-SIDEBAR-NAV-FULLWIDTH.md

## CONTEXT

Three problems to solve in this spec, in order:

1. **Kill the top nav bar.** Move every nav item, the role switcher, notifications, theme toggle, platform admin links, and sign out into the `LynxSidebar`. The `<HorizontalNavBar>` component in `MainApp.jsx` gets removed from the render tree entirely. The sidebar becomes the only navigation surface.

2. **Full-width layout.** Every page currently has `max-w-[1440px] mx-auto` centering it in a narrow column. Content needs to fill the full available width edge-to-edge, left-aligned, starting right after the sidebar. The reference image shows content dense and filling the viewport — not floating in a centered island.

3. **Dashboard scale-up.** The dashboard cards, hero sections, and grid layouts need to be larger and more spacious — matching the reference mockup density where cards are bold and fill the screen.

**Do NOT touch:**
- Any Supabase queries or data fetching
- Page routing or `getPathForPage()` logic
- Auth context, theme context, or any context providers
- Any component not mentioned in this spec
- The `_archive/` folder

---

## WORKING RULES

1. **Read every file before modifying it.** No assumptions.
2. **Archive before replace.** Copy `MainApp.jsx` and `LynxSidebar.jsx` to `src/_archive/` before editing.
3. **Never delete files.** Only modify or add.
4. **Preserve all functionality.** Role switching, notifications, theme toggle, sign out, platform admin links — all must work from the sidebar. Nothing gets lost.
5. **No file over 600 lines.** Split into sub-components if needed.
6. **Commit after each phase.**
7. **Test all four roles** (admin, coach, parent, player) render without errors after each phase.

---

## PHASE 0 — Archive

```bash
cp src/MainApp.jsx src/_archive/MainApp-pre-sidebar.jsx
cp src/components/layout/LynxSidebar.jsx src/_archive/components/layout/LynxSidebar-pre-sidebar.jsx
git add -A && git commit -m "phase 0: archive before sidebar-nav overhaul"
```

---

## PHASE 1 — Expand LynxSidebar to Hold All Nav + Utilities

**Goal:** `LynxSidebar` becomes the complete navigation and utility surface for the app. It must handle all four roles' nav groups, plus the user section at the bottom with role switcher, notifications, theme toggle, and sign out.

**Read first:**
- `src/components/layout/LynxSidebar.jsx` (full file)
- `src/MainApp.jsx` lines 97–500 (NavDropdown, UserProfileDropdown, HorizontalNavBar, all nav group definitions)
- `src/constants/icons.js` (available icon names)
- `src/lib/routes.js` (path mappings)

**Changes to `LynxSidebar.jsx`:**

### New props interface:
```jsx
<LynxSidebar
  // Identity
  orgName="Black Hornets VBC"
  orgInitials="BH"
  orgLogo={null}
  teamName=""        // coach only
  teamSub=""         // coach only

  // Navigation — pass the full role nav groups from MainApp
  navGroups={[...]}  // array of group objects (see structure below)
  activePage=""      // current page id from useCurrentPageId()
  activePathname=""  // from useLocation().pathname
  directTeamWallId={null}
  onNavigate={(id, item) => {}}

  // User / utility
  profile={profile}
  activeView="admin"
  availableViews={[...]}
  onSwitchRole={(viewId) => {}}
  onToggleTheme={() => {}}
  onSignOut={() => {}}
  onNavigateToProfile={() => {}}
  isDark={false}
  notificationCount={0}
  onOpenNotifications={() => {}}

  // Platform admin (only shown if isPlatformAdmin)
  isPlatformAdmin={false}
  onPlatformAnalytics={() => {}}
  onPlatformSubscriptions={() => {}}
  onPlatformAdmin={() => {}}
/>
```

### navGroups structure — passed from MainApp, same data as current nav groups:
```js
// Single item (no dropdown)
{ id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' }

// Group with children
{ id: 'people', label: 'People', type: 'group', icon: 'users', items: [
  { id: 'teams', label: 'Teams & Rosters', icon: 'teams' },
  { id: 'coaches', label: 'Coaches', icon: 'coaches' },
]}

// Dynamic items (coach teams, parent children)
{ id: 'myteams', label: 'My Teams', type: 'group', icon: 'teams', items: [
  { id: 'teamwall-abc123', label: 'Black Hornets Elite ⭐', icon: 'teamwall', teamId: 'abc123' },
]}
```

### Sidebar structure (top to bottom):

**1. Logo row (h-16, always visible)**
- Collapsed: Lynx paw icon centered (w-7 h-7, `text-lynx-sky`)
- Expanded: paw icon + "Lynx" wordmark

**2. Org/team identity block**
- Same as current — org logo or initials badge + name + sub text

**3. Nav items — groups with expand/collapse sub-items**
When the sidebar is collapsed (64px): only top-level group icons visible
When the sidebar is expanded (228px): group labels visible + sub-items appear below each group inline (always expanded, not a dropdown — the sidebar itself is the dropdown)

Each group renders as:
- Group header row: icon + label (bold, `text-slate-300`, `text-[11px] uppercase tracking-wider` for section-style groups, OR a clickable nav row for single items)
- Sub-items: indented (pl-4), smaller text, same active/hover pattern as current NavItem

For `type: 'single'` items — render as a standard NavItem row (no children)
For `type: 'group'` items — render group header (not clickable) + child NavItem rows below it

Active state:
- Active item: `bg-lynx-sky/15 text-lynx-sky` + left 3px accent bar
- Active group header: `text-lynx-sky`

Add these ICON_MAP entries that are currently missing:
```js
'user-cog': UserCog,
'building': Building2,
'file-text': FileText,
'credit-card': CreditCard,
'pie-chart': PieChart,
'trending-up': TrendingUp,
'download': Download,
'check-square': CheckSquare,
'calendar-check': CalendarCheck,
'bar-chart': BarChart3,
'message': MessageCircle,
'user': User,
```
Import these from `lucide-react`.

**4. Divider + Utilities section (above user row)**

Platform admin links (only if `isPlatformAdmin`):
- Platform Analytics → `onPlatformAnalytics()`
- Platform Subscriptions → `onPlatformSubscriptions()`
- Platform Admin → `onPlatformAdmin()`
Each as a NavItem with icon, label, active state

Notifications row:
- Bell icon + "Notifications" label + red badge if `notificationCount > 0`
- Calls `onOpenNotifications()` on click

**5. Bottom user row (h-auto, pinned to bottom)**
Always visible collapsed: avatar circle (40px) with initial
Expanded shows:
- Avatar + display name + role label
- "My Profile" link → `onNavigateToProfile()`
- "Switch Role" section: list of `availableViews` — active one has checkmark + sky text
- Divider
- Theme toggle button (moon/sun icon + "Dark Mode" / "Light Mode" label)
- Sign out button (red text, LogOut icon)

The user section should be in a sub-panel that appears above the bottom row when hovering/expanded. Use a `<details>` or a hover-triggered sub-panel. Simplest approach: render all user options inline in the expanded sidebar below a divider, collapsed to just the avatar circle.

**Commit:**
```bash
git add -A && git commit -m "phase 1: LynxSidebar full nav + utilities"
```

---

## PHASE 2 — Wire Full Nav Groups from MainApp into LynxSidebar

**Goal:** Move the nav group definitions out of `HorizontalNavBar` and pass them into `LynxSidebar` from the main app render. `HorizontalNavBar` is NOT removed yet in this phase — it still renders. We're just wiring the sidebar to have the correct data.

**Read first:**
- `src/MainApp.jsx` lines 500–640 (all four role nav group definitions)
- `src/MainApp.jsx` lines 1075–1120 (the main return/render)
- `src/lib/routes.js`

**What to do in `MainApp.jsx`:**

Move the nav group definitions (`adminNavGroups`, `coachNavGroups`, `parentNavGroups`, `playerNavGroups`) OUT of `HorizontalNavBar` and into the `MainApp` component's scope (just above the `return`). Pass them down through `HorizontalNavBar` as before (so it still works), AND pass them into the LynxSidebar instances on each role dashboard.

The `getNavItems()` function should also move to `MainApp` scope and export as a value:
```js
const currentNavGroups = getNavItems() // computed from activeView
```

Pass `currentNavGroups` as a prop to `HorizontalNavBar` (so it keeps working) AND into whatever mechanism feeds `LynxSidebar`.

**Important:** The `onNavigate` handler in `HorizontalNavBar` handles special cases:
- `teamId` → `navigate('/teams/${teamId}')`
- `playerId` → `navigate('/parent/player/${playerId}')`
- `team-hub` → navigate to first child's team wall
- default → `navigate(getPathForPage(itemId))`

This exact same handler must be passed to `LynxSidebar` as `onNavigate`. Do not duplicate the logic — extract it into a named function `handleNavigation(id, item)` at `MainApp` scope and pass it to both.

**Commit:**
```bash
git add -A && git commit -m "phase 2: nav groups wired into sidebar from MainApp"
```

---

## PHASE 3 — Remove HorizontalNavBar, Sidebar Becomes Full Shell

**Goal:** Delete `<HorizontalNavBar>` from the render tree. The sidebar is now the only nav. Adjust the main content area to account for the sidebar width (no top padding for nav bar, left margin for sidebar).

**Read first:**
- `src/MainApp.jsx` lines 1075–1140 (full render return)
- Current `LynxSidebar` — confirm it now has all nav + utilities from Phase 1–2

**Changes to `MainApp.jsx` render:**

**Before:**
```jsx
<div className="flex flex-col min-h-screen ...">
  <HorizontalNavBar ... />
  <div className="flex-1 relative z-10 px-4 ... max-w-[1440px] mx-auto ...">
    <Breadcrumb />
    <ErrorBoundary>
      <RoutedContent ... />
    </ErrorBoundary>
  </div>
</div>
```

**After:**
```jsx
<div className="flex min-h-screen ...">
  {/* Sidebar — fixed left, always present */}
  <LynxSidebar
    navGroups={currentNavGroups}
    activePage={page}
    activePathname={location.pathname}
    directTeamWallId={directTeamWallId}
    onNavigate={handleNavigation}
    orgName={organization?.name || 'My Club'}
    orgInitials={(organization?.name || 'MC').substring(0, 2).toUpperCase()}
    orgLogo={organization?.logo_url}
    profile={profile}
    activeView={activeView}
    availableViews={getAvailableViews()}
    onSwitchRole={(viewId) => { setActiveView(viewId); navigate('/dashboard'); }}
    onToggleTheme={toggleTheme}
    onSignOut={signOut}
    onNavigateToProfile={() => navigate('/profile')}
    isDark={isDark}
    notificationCount={unreadCount}
    onOpenNotifications={() => navigate('/notifications')}
    isPlatformAdmin={isPlatformAdmin}
    onPlatformAnalytics={() => navigate('/platform/analytics')}
    onPlatformSubscriptions={() => navigate('/platform/subscriptions')}
    onPlatformAdmin={() => navigate('/platform/admin')}
  />

  {/* Main content — offset by sidebar width (64px) */}
  <div className="flex-1 min-h-screen pl-16">
    <main className="w-full h-full">
      <Breadcrumb />
      <ErrorBoundary>
        <RoutedContent ... />
      </ErrorBoundary>
    </main>
  </div>
</div>
```

Key points:
- `pl-16` on the content div = 64px left padding to clear the collapsed sidebar
- NO `max-w-[1440px]` — content goes full width
- NO `mx-auto` — content is left-aligned
- NO top padding for nav bar — that 64px (h-16) is gone
- The sidebar is `position: fixed` so it doesn't affect document flow — the `pl-16` is what clears it
- Remove `<HorizontalNavBar>` component from the JSX entirely
- Keep `<JourneyCelebrations />`, `<OrgBackgroundLayer />`, `<SpotlightOverlay />` in place

**The `unreadCount`:** Find where notifications are currently tracked (likely in `NotificationDropdown` or a hook). Extract the unread count and pass it up to `MainApp` scope, then into `LynxSidebar` as `notificationCount`. If this requires significant refactoring, use `0` as a placeholder and add a TODO comment.

**Commit:**
```bash
git add -A && git commit -m "phase 3: remove top nav bar, sidebar-only navigation"
```

---

## PHASE 4 — Full-Width Page Layout

**Goal:** Every page except the dashboard role pages should fill the full available width with proper padding — NOT centered in a narrow island.

**The problem:** When `mainLocation.pathname !== '/dashboard'`, the current code applies:
```js
'px-4 sm:px-6 lg:px-8 py-6 overflow-auto max-w-[1440px] mx-auto w-full animate-slide-up'
```
This centers content in a narrow max-width column. Remove `max-w-[1440px]` and `mx-auto`.

**Read first:**
- `src/MainApp.jsx` — find the conditional className block (around line 1105)

**New layout logic:**
```jsx
// All pages — full width, left-aligned, proper padding
<div className="flex-1 min-h-screen pl-16">
  <div className="w-full h-full px-6 py-6 overflow-auto animate-slide-up">
    <Breadcrumb />
    <ErrorBoundary>
      <RoutedContent ... />
    </ErrorBoundary>
  </div>
</div>
```

Exception — dashboard pages and team wall pages still get `overflow-hidden` and no extra padding (they manage their own layout):
```jsx
const isDashboardPage = mainLocation.pathname === '/dashboard'
const isTeamWallPage = mainLocation.pathname.startsWith('/teams/')

<div className={`w-full h-full ${
  isDashboardPage || isTeamWallPage
    ? 'overflow-hidden'
    : 'px-6 py-6 overflow-auto animate-slide-up'
}`}>
```

**Commit:**
```bash
git add -A && git commit -m "phase 4: full-width page layout, remove max-w centering"
```

---

## PHASE 5 — Dashboard Scale-Up + Left Alignment

**Goal:** Make dashboard content larger, bolder, and left-aligned — matching the reference image. Currently cards are small and centered. They need to fill the space.

**Reference image analysis:**
- Content starts immediately at the left edge (after sidebar)
- Hero card spans full width, tall (~260px minimum)
- Journey tracker cards are large, bold text
- KPI cards are big with large numbers
- Everything has generous padding inside cards but no wasted space outside them

**Read first:**
- `src/pages/dashboard/DashboardPage.jsx` (full admin dashboard)
- `src/pages/roles/CoachDashboard.jsx` (full coach dashboard)
- `src/pages/roles/ParentDashboard.jsx` (full parent dashboard)
- `src/pages/roles/PlayerDashboard.jsx`

**Changes — all dashboard pages:**

**Remove any centering wrappers.** Any `max-w-*` or `mx-auto` inside dashboard page files — remove them. Content should go `w-full`.

**Increase card padding.** Change `p-4` → `p-6`, `p-5` → `p-7` on major card containers.

**Scale up the hero cards:**
- Admin `OrgHealthHero`: minimum height `280px`, health score ring larger (`w-36 h-36`, score text `text-6xl`)
- Coach `CoachGameDayHeroV2`: minimum height `240px`, matchup title `text-4xl font-black`, record numbers `text-6xl`

**Scale up KPI numbers:**
- Admin KPI row (Players, Families, Coaches, Teams cards): number text `text-5xl font-black`
- Journey tracker percentage: `text-3xl font-black`

**Scale up season journey cards:**
- Each sport card: minimum height `180px`
- Sport name: `text-xl font-bold`
- Step dots: `w-10 h-10`

**Dashboard content wrapper — remove padding constraints:**
In `DashboardPage.jsx` and each role dashboard, find the outer wrapper div and ensure:
- `w-full` — full width
- `px-6 py-6` — consistent padding (not `px-4` or `px-8`)
- NO `max-w-*` — never
- NO `mx-auto` — never

**Parent dashboard — apply LynxSidebar:**
`ParentDashboard.jsx` is still using the old 3-column layout (`ParentLeftSidebar` + `ParentCenterDashboard` + `ParentRightPanel`). In this phase, wrap it in the same full-width pattern as admin/coach — but do NOT rebuild the parent dashboard components yet. Just:
1. Remove any outer `max-w-*`/`mx-auto` wrappers
2. Ensure `w-full` on the outer container

**Commit:**
```bash
git add -A && git commit -m "phase 5: dashboard scale-up and left alignment"
```

---

## PHASE 6 — Parity Check + Polish

**Verify each item:**

- [ ] All four roles load without console errors
- [ ] Top nav bar is completely gone — no `<header>` element visible
- [ ] Sidebar collapses to 64px (icons only), expands to 228px on hover with labels
- [ ] All admin nav items present in sidebar: Dashboard, People (Teams & Rosters, Coaches), Operations (Registrations, Jerseys, Schedule, Attendance & RSVP, Payments, Coach Availability), Game Day (Game Prep, Standings, Leaderboards), Communication (Chats, Announcements, Push Notifications), Insights (Reports & Analytics, Registration Funnel, Season Archives, Org Directory), Setup (Seasons, Registration Forms, Waivers, Payment Setup, Organization, Data Export, Subscription)
- [ ] All coach nav items present: Dashboard, My Teams (Roster Manager, team walls), Schedule, Game Day (Game Prep, Attendance, Standings, Leaderboards), Communication (Team Chat, Announcements), My Stuff (My Availability, Season Archives, Org Directory)
- [ ] All parent nav items present: Home, My Players (per-child dynamic), Social (Chat, Team Hub), Payments, My Stuff (My Stuff, Archives, Directory)
- [ ] All player nav items present: Home, My Team (dynamic team walls), Schedule, Achievements, My Stuff (Leaderboards, Standings, Profile & Stats)
- [ ] Role switching works from sidebar user section
- [ ] Theme toggle works from sidebar
- [ ] Sign out works from sidebar
- [ ] Notifications accessible from sidebar
- [ ] Platform admin links visible (when applicable) in sidebar
- [ ] Pages fill full width — no narrow centered column
- [ ] Dashboard cards are large and left-aligned
- [ ] No VolleyBrain references anywhere in modified files

**Final commit:**
```bash
git add -A && git commit -m "phase 6: parity check and nav polish complete"
```

---

## EXECUTION ORDER

| Phase | What | Primary Files |
|-------|------|---------------|
| 0 | Archive | `_archive/` copies |
| 1 | Expand LynxSidebar with all nav + utilities | `LynxSidebar.jsx` |
| 2 | Wire nav groups from MainApp into sidebar | `MainApp.jsx` |
| 3 | Remove HorizontalNavBar, sidebar is only nav | `MainApp.jsx` |
| 4 | Full-width page layout | `MainApp.jsx` |
| 5 | Dashboard scale-up + left alignment | Dashboard page files |
| 6 | Parity check + polish | All modified files |

**Start CC with:**
```
Read CC-SIDEBAR-NAV-FULLWIDTH.md in the project root. Also read CLAUDE.md if it exists. Start with Phase 0.
```

**Between phases:**
```
Phase [X] is done. Read CC-SIDEBAR-NAV-FULLWIDTH.md and continue with Phase [X+1].
```

**If something breaks:**
```
Stop. Do not continue to the next phase. Fix only the specific breakage. Commit the fix. Then continue.
```
