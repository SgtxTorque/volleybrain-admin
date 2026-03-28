# CC-SMART-NAV-REDESIGN.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

Two connected changes to navigation:
1. **Smart Contextual Top Bar** — The top bar shows the current page + 3-4 related pages based on where you are. Currently the TopBar is only rendered on the Dashboard page with hardcoded links. This change makes it render on ALL pages with contextual links.
2. **Collapsible Accordion Sidebar** — Category headers are clickable. Clicking expands/collapses the group's items. The group containing the active page is auto-expanded. All other groups are collapsed by default.

Also reorganizes the admin nav groups for better categorization.

**Files touched:**
- `src/MainApp.jsx` — Phase 1 (nav group reorganization), Phase 3 (TopBar rendering on all pages)
- `src/components/layout/LynxSidebar.jsx` — Phase 2 (accordion behavior)
- `src/components/v2/TopBar.jsx` — Phase 3 (accept contextual links)
- `src/pages/dashboard/DashboardPage.jsx` — Phase 3 (remove hardcoded TopBar, use shared one)

---

## PHASE 1 — Reorganize Admin Nav Groups

### File: `src/MainApp.jsx`

**Replace the `adminNavGroups` array** (around lines 898-954) with:

```js
  const adminNavGroups = [
    { id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' },

    // --- TEAMS & ROSTERS ---
    { id: 'teams-rosters', label: 'Teams & Rosters', type: 'group', icon: 'shield', items: [
      { id: 'teams', label: 'Team Management', icon: 'shield' },
      { id: 'coaches', label: 'Staff Portal', icon: 'users' },
      { id: 'jerseys', label: 'Jersey Management', icon: 'shirt', hasBadge: true },
    ]},

    // --- REGISTRATION ---
    { id: 'registration', label: 'Registration', type: 'group', icon: 'clipboard', items: [
      { id: 'registrations', label: 'Registrations', icon: 'clipboard' },
      { id: 'templates', label: 'Registration Forms', icon: 'file-text' },
      { id: 'registration-funnel', label: 'Registration Funnel', icon: 'trending-up' },
    ]},

    // --- PAYMENTS ---
    { id: 'money', label: 'Payments', type: 'group', icon: 'dollar', items: [
      { id: 'payments', label: 'Payment Admin', icon: 'dollar' },
      { id: 'paymentsetup', label: 'Payment Setup', icon: 'credit-card' },
    ]},

    // --- SCHEDULE & EVENTS ---
    { id: 'scheduling', label: 'Schedule & Events', type: 'group', icon: 'calendar', items: [
      { id: 'schedule', label: 'Schedule', icon: 'calendar' },
      { id: 'attendance', label: 'Attendance & RSVP', icon: 'check-square' },
      { id: 'coach-availability', label: 'Coach Availability', icon: 'calendar-check' },
    ]},

    // --- GAME DAY ---
    { id: 'game', label: 'Game Day', type: 'group', icon: 'gameprep', items: [
      { id: 'gameprep', label: 'Game Prep', icon: 'target' },
      { id: 'standings', label: 'Standings', icon: 'star' },
      { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
    ]},

    // --- COMMUNICATION ---
    { id: 'communication', label: 'Communication', type: 'group', icon: 'chats', items: [
      { id: 'chats', label: 'Chats', icon: 'message' },
      { id: 'blasts', label: 'Announcements', icon: 'megaphone' },
      { id: 'notifications', label: 'Push Notifications', icon: 'bell' },
    ]},

    // --- REPORTS ---
    { id: 'insights', label: 'Reports', type: 'group', icon: 'reports', items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'pie-chart' },
      { id: 'season-archives', label: 'Season Archives', icon: 'trophy' },
      { id: 'org-directory', label: 'Org Directory', icon: 'building' },
    ]},

    // --- SETTINGS ---
    { id: 'setup', label: 'Settings', type: 'group', icon: 'settings', items: [
      { id: 'seasons', label: 'Season Management', icon: 'calendar' },
      { id: 'waivers', label: 'Waivers', icon: 'file-text' },
      { id: 'venues', label: 'Venues', icon: 'map-pin' },
      { id: 'organization', label: 'Organization', icon: 'building' },
      { id: 'data-export', label: 'Data Export', icon: 'download' },
      { id: 'subscription', label: 'Subscription', icon: 'credit-card' },
    ]},
  ]
```

**What changed:**
- Jersey Management moved from Registration & Payments → Teams & Rosters
- Registration Forms + Registration Funnel moved from Settings/Reports → Registration
- Payment Setup moved from Settings → Payments
- "Registration & Payments" split into separate Registration and Payments groups
- "Reports & Insights" simplified to "Reports" (Registration Funnel moved out)

### Verification

- Sidebar shows the new groupings
- All nav items still navigate correctly
- No broken links

### Commit message
```
refactor(nav): reorganize admin nav groups — teams/registration/payments/schedule/gameday/communication/reports/settings
```

---

## PHASE 2 — Collapsible Accordion Sidebar

### File: `src/components/layout/LynxSidebar.jsx`

**Change 1: Add state for expanded groups.**

At the top of the `LynxSidebar` function (around line 238, after `const isPlayer = activeView === 'player'`), add:

```jsx
  // Accordion state — track which groups are expanded
  // Auto-expand the group containing the active page
  const getActiveGroupId = () => {
    for (const group of navGroups) {
      if (group.type === 'group' && group.items) {
        for (const item of group.items) {
          if (item.id === activePage || (item.teamId && directTeamWallId === item.teamId) || (item.playerId && activePage === `player-${item.playerId}`)) {
            return group.id
          }
        }
      }
    }
    return null
  }

  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // Auto-expand active group when activePage changes
  useEffect(() => {
    const activeGroupId = getActiveGroupId()
    if (activeGroupId) {
      setExpandedGroups(prev => {
        const next = new Set(prev)
        next.add(activeGroupId)
        return next
      })
    }
  }, [activePage, directTeamWallId])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }
```

**Change 2: Add `useEffect` to the imports** if not already present. Check line 8 — it should already have `useEffect`.

**Change 3: Replace the nav group rendering.**

Find the `<nav>` section (around lines 278-316) that renders groups. Replace the entire `{navGroups.map((group) => { ... })}` block inside the `<nav>` with:

```jsx
        {navGroups.map((group) => {
          if (group.type === 'single') {
            const singleItem = { ...group, icon: group.icon || group.id }
            const active = activePage === group.id && !directTeamWallId
            return (
              <NavItem
                key={group.id}
                item={singleItem}
                isActive={active}
                onNavigate={onNavigate}
                isPlayer={isPlayer}
              />
            )
          }

          // Collapsible group
          const isExpanded = expandedGroups.has(group.id)
          const hasActiveChild = (group.items || []).some(item =>
            item.id === activePage ||
            (item.teamId && directTeamWallId === item.teamId) ||
            (item.playerId && activePage === `player-${item.playerId}`)
          )
          const GroupIcon = ICON_MAP[group.icon] || ICON_MAP[group.id] || LayoutDashboard

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="v2-sidebar-btn"
                data-player={isPlayer || undefined}
                style={{
                  width: '100%', justifyContent: 'flex-start', paddingLeft: 12, gap: 10,
                  ...(hasActiveChild && !isExpanded ? {
                    color: isPlayer ? 'var(--v2-gold)' : 'var(--v2-navy)',
                    fontWeight: 700,
                  } : {}),
                }}
              >
                <GroupIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span style={{
                  flex: 1, textAlign: 'left',
                  fontSize: 12.5, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {group.label}
                </span>
                <ChevronRight style={{
                  width: 12, height: 12, flexShrink: 0,
                  transition: 'transform 0.15s ease',
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  opacity: 0.4,
                }} />
              </button>
              {isExpanded && (
                <div style={{ paddingLeft: 8, overflow: 'hidden' }}>
                  {(group.items || []).map(item => (
                    <NavItem
                      key={item.id + (item.teamId || '') + (item.playerId || '')}
                      item={item}
                      isActive={isItemActive(item)}
                      onNavigate={onNavigate}
                      isPlayer={isPlayer}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
```

**What changed:**
- Section headers replaced with clickable group buttons that expand/collapse
- Each group button shows the group icon, label, and a chevron that rotates when expanded
- Child items are indented and only visible when expanded
- The group containing the active page auto-expands
- Groups with an active child but collapsed show the group label in navy/bold as a hint
- Old section header `<div>` with `fontSize: 9, fontWeight: 900` is removed

### Verification

- Sidebar loads with only Dashboard visible and the active group expanded
- Clicking a group header expands it, clicking again collapses it
- Multiple groups can be open simultaneously
- Navigating to a page auto-expands its parent group
- Group with active child shows navy text even when collapsed
- Chevron rotates when expanded

### Commit message
```
feat(sidebar): collapsible accordion nav groups with auto-expand for active page
```

---

## PHASE 3 — Smart Contextual Top Bar on All Pages

### Step 1: Add contextual nav link mapping to MainApp.jsx

Add this constant ABOVE the `adminNavGroups` definition (around line 896):

```js
  // Contextual top bar links — what shows in the top bar based on current page
  const CONTEXTUAL_NAV = {
    dashboard:     ['schedule', 'registrations', 'payments', 'teams'],
    teams:         ['coaches', 'jerseys', 'registrations'],
    coaches:       ['teams', 'jerseys', 'schedule'],
    registrations: ['templates', 'registration-funnel', 'payments'],
    payments:      ['paymentsetup', 'registrations', 'reports'],
    schedule:      ['attendance', 'coach-availability', 'gameprep'],
    attendance:    ['schedule', 'gameprep', 'chats'],
    gameprep:      ['schedule', 'attendance', 'standings'],
    standings:     ['leaderboards', 'gameprep', 'reports'],
    leaderboards:  ['standings', 'gameprep', 'reports'],
    chats:         ['blasts', 'notifications', 'schedule'],
    blasts:        ['chats', 'notifications'],
    notifications: ['chats', 'blasts'],
    reports:       ['registration-funnel', 'season-archives', 'org-directory'],
    seasons:       ['organization', 'venues', 'waivers'],
    organization:  ['seasons', 'paymentsetup', 'venues'],
    jerseys:       ['teams', 'coaches', 'registrations'],
    templates:     ['registrations', 'waivers', 'registration-funnel'],
    waivers:       ['templates', 'registrations', 'organization'],
    paymentsetup:  ['payments', 'registrations', 'organization'],
    venues:        ['schedule', 'organization', 'seasons'],
  }

  // Page ID to label mapping for top bar display
  const PAGE_LABELS = {
    dashboard: 'Dashboard', teams: 'Teams', coaches: 'Staff', registrations: 'Registrations',
    payments: 'Payments', schedule: 'Schedule', attendance: 'Attendance', gameprep: 'Game Prep',
    standings: 'Standings', leaderboards: 'Leaderboards', chats: 'Chats', blasts: 'Announcements',
    notifications: 'Notifications', reports: 'Reports', seasons: 'Seasons', organization: 'Settings',
    jerseys: 'Jerseys', templates: 'Reg Forms', waivers: 'Waivers', paymentsetup: 'Pay Setup',
    venues: 'Venues', 'coach-availability': 'Availability', 'registration-funnel': 'Funnel',
    'season-archives': 'Archives', 'org-directory': 'Directory', 'data-export': 'Export',
    subscription: 'Subscription',
  }
```

### Step 2: Render TopBar in MainApp instead of DashboardPage

Find where the TopBar import exists in DashboardPage. We'll move it to MainApp instead.

**In `src/MainApp.jsx`**, add the TopBar import near the top imports:

```js
import TopBar from './components/v2/TopBar'
```

**In MainApp.jsx**, find the content wrapper (around line 1181-1183). Add TopBar rendering BEFORE the `<Breadcrumb />`:

Find:
```jsx
            <Breadcrumb />
```

Replace with:
```jsx
            {activeView === 'admin' && (
              <TopBar
                roleLabel="Lynx Admin"
                navLinks={[
                  { label: PAGE_LABELS[page] || page, pageId: page, isActive: true, onClick: () => {} },
                  ...(CONTEXTUAL_NAV[page] || []).map(linkId => ({
                    label: PAGE_LABELS[linkId] || linkId,
                    pageId: linkId,
                    isActive: false,
                    onClick: () => navigate(getPathForPage(linkId)),
                  })),
                ]}
                searchPlaceholder="Search..."
                onSearchClick={() => document.dispatchEvent(new CustomEvent('command-palette-open'))}
                hasNotifications={false}
                onNotificationClick={() => navigate(getPathForPage('notifications'))}
                avatarInitials={`${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`}
                onSettingsClick={() => navigate(getPathForPage('organization'))}
                onThemeToggle={toggleTheme}
                isDark={isDark}
                availableRoles={getAvailableViews().map(v => ({ id: v.id, label: `Lynx ${v.label}`, subtitle: v.description }))}
                activeRoleId={activeView}
                onRoleSwitch={(viewId) => { setActiveView(viewId); navigate('/dashboard') }}
              />
            )}
            <Breadcrumb />
```

### Step 3: Remove TopBar from DashboardPage

**In `src/pages/dashboard/DashboardPage.jsx`**, find the TopBar rendering (around lines 1044-1066). Remove the entire `<TopBar ... />` block. Also remove the TopBar import at the top of the file:

Find and remove:
```js
import TopBar from '../../components/v2/TopBar'
```

And remove the `<TopBar ... />` JSX block (lines ~1046-1066).

### Verification

- **Dashboard page:** Top bar shows "Dashboard" (active) + Schedule, Registrations, Payments, Teams
- **Schedule page:** Top bar shows "Schedule" (active) + Attendance, Availability, Game Prep
- **Registrations page:** Top bar shows "Registrations" (active) + Reg Forms, Funnel, Payments
- **Payments page:** Top bar shows "Payments" (active) + Pay Setup, Registrations, Reports
- **Chats page:** Top bar shows "Chats" (active) + Announcements, Notifications, Schedule
- **Settings pages:** Top bar shows the current setting (active) + sibling settings
- **Clicking a top bar link:** Navigates to that page
- **Role switcher:** Still works in the top bar
- **Search (Cmd+K):** Still works

### Commit message
```
feat(nav): smart contextual top bar on all pages with related page links
```

---

## POST-EXECUTION QA CHECKLIST

1. **Sidebar groups:** Collapsed by default. Active page's group auto-expands.
2. **Sidebar accordion:** Click group header to expand/collapse. Chevron rotates.
3. **Sidebar reorganized:** Teams & Rosters, Registration, Payments, Schedule & Events, Game Day, Communication, Reports, Settings.
4. **Jersey Management:** Under Teams & Rosters (not Registration & Payments).
5. **Registration Forms + Funnel:** Under Registration (not Settings/Reports).
6. **Payment Setup:** Under Payments (not Settings).
7. **Top bar:** Shows on every page (admin view only). Current page highlighted. 3-4 contextual related pages.
8. **Top bar contextual:** Links change based on which page you're on.
9. **Top bar actions:** Search, theme toggle, notifications, settings gear, avatar all work.
10. **Role switcher:** Works in both sidebar and top bar.
11. **All nav items still navigate correctly.** No broken routes.
12. **Coach/Parent/Player nav groups:** Unchanged (only admin reorganized).
