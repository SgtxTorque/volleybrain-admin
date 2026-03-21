# V2 Admin Dashboard — Investigation Report

Generated: 2026-03-21

---

## 1. Critical: Empty State Bug

### Current Conditional (exact code)

**File:** `src/pages/dashboard/DashboardPage.jsx`

**Early returns (lines 581–587):**
```jsx
if (!seasonLoading && !selectedSeason) {
  return <GettingStartedGuide onNavigate={onNavigate} />
}

if (seasonLoading || loading) {
  return <SkeletonDashboard />
}
```

**Inline empty state (lines 609–627):**
```jsx
{totalTeams === 0 && (
  <div style={{ padding: '64px 32px', textAlign: 'center', fontFamily: 'var(--v2-font)' }}>
    <img src="/images/laptoplynx.png" alt="Lynx" style={{ width: 128, height: 128, margin: '0 auto 24px', opacity: 0.8 }} />
    <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--v2-text-primary)', marginBottom: 8 }}>Your dashboard is waiting!</h3>
    <p style={{ color: 'var(--v2-text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
      Start by setting up your season, creating teams, and opening registration. Your dashboard will come alive as data flows in.
    </p>
    <button onClick={() => onNavigate?.('seasons')} ...>Set Up Your First Season</button>
  </div>
)}
```

**V2 layout conditional (line 630):**
```jsx
{totalTeams > 0 && (
  <V2DashboardLayout ... />
)}
```

**Where `totalTeams` comes from (line 561):**
```jsx
const totalTeams = stats.teams || 0
```

### Root Cause Analysis

There are **two distinct race conditions** causing this bug:

#### Scenario A: Initial page load flash

On initial load, `loading` starts as `true` (line 100), so the skeleton shows. However, the `useEffect` at lines 139–145 has an `else if` branch that can prematurely set `loading = false`:

```jsx
useEffect(() => {
  if (selectedSeason?.id) {
    loadDashboardData()
  } else if (!seasonLoading) {
    setLoading(false)   // <-- PREMATURE: fires if SeasonContext finishes before selectedSeason is set
  }
}, [selectedSeason?.id, seasonLoading, filterTeam])
```

If `seasonLoading` transitions to `false` in a render cycle before `selectedSeason` is populated, the `else if` branch fires, setting `loading = false`. Then on the next render, `loading = false` and `stats.teams = 0` (initial empty state), so the empty state shows. When `selectedSeason` later populates, `loadDashboardData()` eventually runs and corrects the display — but not before a visible flash.

The previous fix (changing line 585 from `if (seasonLoading)` to `if (seasonLoading || loading)`) mitigates this somewhat, but the premature `setLoading(false)` on line 143 is still the underlying issue.

#### Scenario B: Clicking a season card with fewer/no teams

When clicking a season card in SeasonCarousel, the sequence is:

1. `onSeasonSelect(id)` fires (DashboardPage line 664–668):
   ```jsx
   onSeasonSelect={(id) => {
     const season = (allSeasons || seasons || []).find(s => s.id === id)
     if (season) selectSeason(season)
   }}
   ```
2. `selectSeason(season)` in SeasonContext (line 71–76) calls `setSelectedSeason(season)` directly. **It does NOT set any loading state.**
3. React re-renders DashboardPage. At this moment:
   - `loading = false` (previous season's load completed)
   - `seasonLoading = false`
   - `stats` still contains **OLD season's data**
   - Line 585 early return does NOT trigger → render continues to the main return
4. The render briefly shows the old season's data with the new season's name (stale data flash).
5. The `useEffect` at line 139 detects `selectedSeason?.id` changed → calls `loadDashboardData()`.
6. `loadDashboardData()` calls `setLoading(true)` at line 148 → skeleton shows.
7. When data loads: if the new season has 0 teams, `stats.teams = 0` → `totalTeams = 0` → **empty state renders permanently**.

**The core issue:** There is no `setLoading(true)` between when `selectSeason()` fires and when `loadDashboardData()` runs. This creates a 1-frame gap where stale data renders. And for seasons with 0 teams, the empty state ("Your dashboard is waiting!") appears — which is wrong because the empty state is designed for brand-new orgs with no setup at all, not for seasons that simply have no teams yet.

### Recommended Fix (do not apply)

**Fix 1 — Eliminate the stale data gap:** Add a `useEffect` that immediately sets `loading = true` when `selectedSeason?.id` changes, BEFORE the data fetch:

```jsx
useEffect(() => {
  if (selectedSeason?.id) {
    setLoading(true)  // Immediately show skeleton on season switch
  }
}, [selectedSeason?.id])
```

**Fix 2 — Separate the empty state logic from the "no teams" check:** The inline empty state at line 609 should NOT use `totalTeams === 0` as its sole condition. A season can legitimately have 0 teams without being a "brand new org." Replace with:

```jsx
{totalTeams === 0 && !selectedSeason && (
  // Only show for orgs with no season at all
)}
```

Or better: remove the inline empty state entirely, since `GettingStartedGuide` already handles the "no season" case at line 581.

**Fix 3 — Remove the premature `setLoading(false)` else branch:**

```jsx
useEffect(() => {
  if (selectedSeason?.id) {
    loadDashboardData()
  }
  // Remove: else if (!seasonLoading) { setLoading(false) }
  // The GettingStartedGuide already handles the no-season case at line 581
}, [selectedSeason?.id, seasonLoading, filterTeam])
```

---

## 2. Sidebar Accessibility

### Current State

**File:** `src/components/layout/LynxSidebar.jsx`

Each sidebar `NavItem` button **DOES have a `title` attribute** (line 52):
```jsx
<button
  onClick={() => onNavigate?.(item.id, item)}
  className="v2-sidebar-btn"
  data-active={isActive || undefined}
  data-player={isPlayer || undefined}
  title={item.label}         // ← Native browser tooltip IS present
  ...
>
```

The bottom utility buttons also have `title` attributes:
- Platform Mode button: `title="Platform Mode"` (line 180)
- Settings button: `title="Settings"` (line 193)
- Sign Out button: `title="Sign Out"` (line 202)

**Verdict:** Native `title` tooltips **exist and work**. Hovering over any icon shows its label as a browser-native tooltip. However, these tooltips have a ~500ms delay and no custom styling — they use the OS-default tooltip appearance.

### Recommended Fix

The current implementation is functional. For improved UX, consider:

- **Option A (minimal):** No change needed — `title` attributes already provide basic discoverability.
- **Option B (polish):** Add a custom tooltip component with instant-show on hover, positioned to the right of the sidebar. This could be a lightweight CSS-only tooltip using `::after` pseudo-elements. No library needed.

**Severity: Low** — this is a polish issue, not a functional bug.

---

## 3. Navigation Audit

### TopBar Status

**FINDING: The TopBar component (`src/components/v2/TopBar.jsx`) is defined but NOT rendered anywhere.**

It is exported from `src/components/v2/index.js` (line 1), and DashboardPage imports from that barrel file, but DashboardPage does not use TopBar. MainApp.jsx does not render TopBar either.

The TopBar component accepts `navLinks`, `onSearchClick`, `onNotificationClick`, `onSettingsClick`, `onAvatarClick`, `onThemeToggle` — but since it's never rendered, **none of these are functional.**

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| **TopBar — Dashboard link** | Not rendered | N/A | N/A | TopBar is dead code — not rendered anywhere |
| **TopBar — Analytics link** | Not rendered | N/A | N/A | Dead code |
| **TopBar — Schedule link** | Not rendered | N/A | N/A | Dead code |
| **TopBar — Roster link** | Not rendered | N/A | N/A | Dead code |
| **TopBar — Search trigger** | Not rendered | N/A | N/A | Dead code. CommandPalette works via Cmd/Ctrl+K independently |
| **TopBar — Notification bell** | Not rendered | N/A | N/A | Dead code |
| **TopBar — Settings gear** | Not rendered | N/A | N/A | Dead code |
| **TopBar — Avatar** | Not rendered | N/A | N/A | Dead code |
| **TopBar — Theme toggle** | Not rendered | N/A | N/A | Dead code |

### HeroCard

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| Stat cell: Teams | None (`cursor: 'default'`) | N/A | N/A | Not clickable — hover effect only, no onClick |
| Stat cell: Players | None | N/A | N/A | Not clickable |
| Stat cell: Coaches | None | N/A | N/A | Not clickable |
| Stat cell: Overdue | None | N/A | N/A | Not clickable |
| Stat cell: Collected | None | N/A | N/A | Not clickable |
| Stat cell: Pending | None | N/A | N/A | Not clickable |

### Attention Strip

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| "REVIEW NOW →" | `onNavigate?.('registrations')` | `/registrations` | YES | Navigates to registrations page |

### Season Carousel

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| Season card click | `onSeasonSelect(season.id)` → `selectSeason(season)` | N/A (no page nav) | N/A | Calls SeasonContext.selectSeason — changes active season, does NOT navigate. Causes empty state bug (see Investigation 1). |
| "View All →" | `onNavigate?.('season-management')` | `/admin/seasons` | YES | Route exists in routes.js line 42 |

### Season Stepper

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| Step dots/labels | None | N/A | N/A | NOT clickable — purely visual progress indicator |

### Body Tabs

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| Tab: "Teams & Health" | `setActiveTab('teams')` | N/A (tab switch) | N/A | Works — switches tab content |
| Tab: "Registrations" | `setActiveTab('registrations')` | N/A (tab switch) | N/A | Works — shows AdminRegistrationsTab |
| Tab: "Payments" | `setActiveTab('payments')` | N/A (tab switch) | N/A | Works — shows AdminPaymentsTab |
| Tab: "Schedules" | `setActiveTab('schedules')` | N/A (tab switch) | N/A | Works — shows AdminScheduleTab |
| Footer: "View all X teams →" | `onNavigate?.('teams')` | `/teams` | YES | Only shows when activeTab === 'teams' |
| Team row click | `onNavigate?.('teamwall', { id })` | **BROKEN** → `/dashboard` | **NO** | `handleNavigation('teamwall', { id })` — item has `id` not `teamId`, so `item?.teamId` is undefined. Falls through to `getPathForPage('teamwall')` which isn't in ROUTES, returns `/dashboard`. **BUG: Team clicks navigate to dashboard instead of team wall.** |
| "View All Registrations →" | `onNavigate?.('registrations')` | `/registrations` | YES | Works |
| "View All Payments →" | `onNavigate?.('payments')` | `/payments` | YES | Works |
| "View Full Schedule →" | `onNavigate?.('schedule')` | `/schedule` | YES | Works |
| Schedule event row click | `onNavigate?.('schedule')` | `/schedule` | YES | Works — all rows navigate to schedule |

### Sidebar Cards (right column)

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| Financial: "Send Reminders" | `onNavigate?.('payments')` | `/payments` | YES | Works |
| Financial: "View Ledger" | `onNavigate?.('payments')` | `/payments` | YES | Both buttons go to same page |
| WeeklyLoad event rows | None | N/A | N/A | NOT clickable — no onClick handler on event rows |
| OrgHealthCard bars | None | N/A | N/A | NOT clickable — no onClick handler on metric rows |
| Playbook: "Create Event" | `onNavigate?.('schedule')` | `/schedule` | YES | Works |
| Playbook: "Send Blast" | `onNavigate?.('blasts')` | `/blasts` | YES | Works |
| Playbook: "Add Player" | `onNavigate?.('registrations')` | `/registrations` | YES | Works |
| Playbook: "Approve Regs" | `onNavigate?.('registrations')` | `/registrations` | YES | Works |
| Playbook: "Reports" | `onNavigate?.('reports')` | `/reports` | YES | Works |
| Playbook: "Reg Link" | `onNavigate?.('registration-templates')` | **BROKEN** → `/dashboard` | **NO** | `'registration-templates'` is NOT in routes.js. The correct pageId is `'templates'` which maps to `/settings/templates`. **BUG.** |
| MilestoneCard | None | N/A | N/A | NOT clickable |

### Mascot Nudge

| Element | Handler/onClick | Target Route | Route Exists? | Notes |
|---------|----------------|--------------|---------------|-------|
| Primary: "Yes, send reminders" | `onNavigate?.('waivers')` | `/settings/waivers` | YES | Works |
| Secondary: "Not now" | `() => {}` (no-op) | N/A | N/A | Dismisses nudge (does nothing — no dismiss state tracked, nudge remains) |

### Sidebar Nav (left — LynxSidebar)

The sidebar renders `navGroups` provided by MainApp.jsx. For admin view, these are the items:

| Icon | Label (title attr) | pageId | Route | Route Exists? | Active State |
|------|--------------------|--------|-------|---------------|-------------|
| LayoutDashboard | Dashboard | `dashboard` | `/dashboard` | YES | Highlights when `activePage === 'dashboard'` — WORKS |
| — | *separator* | — | — | — | — |
| Shield | Team Management | `teams` | `/teams` | YES | Works |
| UserCog | Coach Directory | `coaches` | `/coaches` | YES | Works |
| Users | Staff & Volunteers | `staff` | `/staff` | YES | Works |
| — | *separator* | — | — | — | — |
| ClipboardList | Registrations | `registrations` | `/registrations` | YES | Works |
| DollarSign | Payment Admin | `payments` | `/payments` | YES | Works |
| Shirt | Jersey Management | `jerseys` | `/jerseys` | YES | Has dot badge |
| — | *separator* | — | — | — | — |
| Calendar | Schedule | `schedule` | `/schedule` | YES | Works |
| CheckSquare | Attendance & RSVP | `attendance` | `/attendance` | YES | Works |
| CalendarCheck | Coach Availability | `coach-availability` | `/schedule/availability` | YES | Works |
| — | *separator* | — | — | — | — |
| Target | Game Prep | `gameprep` | `/gameprep` | YES | Works |
| Star | Standings | `standings` | `/standings` | YES | Works |
| BarChart3 | Leaderboards | `leaderboards` | `/leaderboards` | YES | Works |
| — | *separator* | — | — | — | — |
| MessageCircle | Chats | `chats` | `/chats` | YES | Works |
| Megaphone | Announcements | `blasts` | `/blasts` | YES | Works |
| Bell | Push Notifications | `notifications` | `/notifications` | YES | Works |
| — | *separator* | — | — | — | — |
| PieChart | Reports & Analytics | `reports` | `/reports` | YES | Works |
| TrendingUp | Registration Funnel | `registration-funnel` | `/reports/funnel` | YES | Works |
| Trophy | Season Archives | `season-archives` | `/archives` | YES | Works |
| Building2 | Org Directory | `org-directory` | `/directory` | YES | Works |
| — | *separator* | — | — | — | — |
| Calendar | Season Management | `seasons` | `/settings/seasons` | YES | Works |
| ClipboardList | Registration Forms | `templates` | `/settings/templates` | YES | Works |
| FileText | Waivers | `waivers` | `/settings/waivers` | YES | Works |
| CreditCard | Payment Setup | `paymentsetup` | `/settings/payment-setup` | YES | Works |
| MapPin | Venues | `venues` | `/settings/venues` | YES | Works |
| Building2 | Organization | `organization` | `/settings/organization` | YES | Works |
| Download | Data Export | `data-export` | `/settings/data-export` | YES | Works |
| CreditCard | Subscription | `subscription` | `/settings/subscription` | YES | Works |
| — | *bottom utilities separator* | — | — | — | — |
| Shield | Platform Mode | (special) | (special) | YES | Only shows for platform admins |
| Settings | Settings | `settings` | **BROKEN** → `/dashboard` | **NO** | `'settings'` pageId is NOT in routes.js. Falls back to `/dashboard`. **BUG.** |
| LogOut | Sign Out | (calls signOut) | N/A | N/A | Works — calls auth signOut |

---

## 4. Data Wiring Verification

### HeroCard Stats

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `stats[0]` — Teams: `stats.teams \|\| 0` | `stats.teams` set on line 480 as `teamIds.length` | YES | Counts teams filtered by team selector |
| `stats[1]` — Players: `totalPlayers` | `stats.totalRegistrations \|\| 0` (line 560) | YES | Total registrations for season |
| `stats[2]` — Coaches: `stats.coachCount \|\| 0` | Set line 499 from distinct coach IDs | YES | Unique coaches across season teams |
| `stats[3]` — Overdue: `overdueCount \|\| 0` | `Math.ceil(stats.pastDue / 100)` (line 575) | **QUESTIONABLE** | `overdueCount` divides pastDue dollar amount by 100 to estimate count of overdue payments. This is an approximation, not an actual count. If average payment is $200, this underestimates. |
| `stats[4]` — Collected: `$X.Xk` | `stats.totalCollected` (line 644) | YES | Sum of paid payment amounts |
| `stats[5]` — Pending: `stats.pending \|\| 0` | Set line 494 from pending registrations | YES | Count of pending/submitted/new registrations |

### SeasonCarousel

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `seasons` | `allSeasons \|\| seasons \|\| []` | YES | All seasons from SeasonContext (not filtered by sport) |
| `perSeasonTeamCounts` | Fetched in separate useEffect (lines 107–132) | YES | Per-season team counts from `teams` table |
| `perSeasonPlayerCounts` | Same useEffect | YES | Per-season player counts from `players` table |
| `selectedSeasonId` | `selectedSeason?.id` | YES | From SeasonContext |
| `onSeasonSelect` | Calls `selectSeason(season)` | YES | Triggers season switch (but causes bug — see Investigation 1) |
| `onViewAll` | `onNavigate?.('season-management')` | YES | Route exists |

### SeasonStepper

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `steps[0]` — Org Profile | `organization?.name ? 'done' : 'upcoming'` | YES | Checks if org name exists |
| `steps[1]` — Season | `selectedSeason ? 'done' : 'upcoming'` | YES | Always 'done' when stepper shows (since selectedSeason must exist) |
| `steps[2]` — Open Reg | Season status or registration count | YES | Correct logic |
| `steps[3]` — Teams | `stats.teams > 0` | YES | Correct |
| `steps[4]` — Coaches | `stats.coachCount > 0` | YES | Correct |
| `steps[5]` — Schedule | `upcomingEvents.length > 0` | **PARTIAL** | Only checks UPCOMING events. A season with past-only events would show 'upcoming' status even though schedule was set up. |
| `completedCount` | `setupSteps.filter(s => s.status === 'done').length` | YES | Correct |
| Stepper visibility | `setupComplete < 6` | YES | Hides when all 6 steps complete |

### AdminTeamsTab

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `teamsData` | State from line 95 | YES | Array of team objects with `id`, `name`, `color`, `max_players` |
| `teamStats` | State from line 96 | YES | Map of teamId → `{ playerCount, record }` |
| Health dot logic | `playerCount / maxPlayers` ratio | YES | green ≥80%, amber ≥50%, red <50% — correct |
| Unpaid column | **HARDCODED TO 0** | **BUG** | Lines 96–99 in AdminTeamsTab.jsx: `color: 0 > 0 ? ... : ...` and value is literal `0`. Per-team unpaid data is never passed. |

### FinancialSnapshot

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `projectedRevenue` | `stats.totalExpected \|\| null` | YES | Sum of all payment amounts (paid + unpaid) |
| `collectedPct` | `Math.round((totalCollected / totalExpected) * 100)` | YES | Correct calculation |
| `receivedAmount` | `$${(stats.totalCollected).toLocaleString()}` | YES | Correct |
| `outstandingAmount` | `$${(stats.pastDue).toLocaleString()}` | YES | Correct — pastDue = sum of unpaid |
| Breakdown: Registration | `paymentsByType.registration` reduce | YES | Correct grouping |
| Breakdown: Uniforms | `paymentsByType.uniform` reduce | YES | Correct |
| Breakdown: Monthly Dues | `paymentsByType.monthly` reduce | YES | Correct |
| Breakdown: Other | `paymentsByType.other` reduce | YES | Catchall for non-standard fee types |
| `primaryAction` — Send Reminders | `onNavigate?.('payments')` | YES | Route exists |
| `secondaryAction` — View Ledger | `onNavigate?.('payments')` | YES | Both go to same page (no separate ledger view) |

### WeeklyLoad

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `events` | `upcomingEvents.slice(0, 5)` mapped | YES | Up to 5 events |
| `dayName` | `toLocaleDateString('en-US', { weekday: 'short' })` | YES | Correct |
| `dayNum` | `.getDate()` | YES | Correct |
| `isToday` | `toDateString() === new Date().toDateString()` | YES | Correct |
| `title` | `evt.title \|\| evt.event_type \|\| 'Event'` | YES | Reasonable fallback chain |
| `meta` | `location · time` | **MINOR** | Uses `evt.event_time \|\| evt.start_time` — if both are null, shows `"TBD · "` with trailing separator |
| `dateRange` | Hardcoded `"This Week"` | **INCORRECT** | Always says "This Week" regardless of whether events are from this week, next week, or next month. Should derive from actual event dates. |

### OrgHealthCard

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| Roster Fill | `rosteredPlayers/totalPlayers`, `rosterPct` | YES | Correct |
| Payments | `paymentPct%` | YES | Collection rate percentage |
| Overdue | `overdueCount`, `min(overdueCount*5, 100)` | **QUESTIONABLE** | Bar percentage uses `overdueCount * 5` which is arbitrary. 20+ overdue items = 100% bar. Not a real percentage. |
| Registrations | `pending count`, `min(pending*10, 100)` | **QUESTIONABLE** | Same arbitrary scaling: 10+ pending = 100% bar. |
| Teams Active | `teams count`, `min(teams*10, 100)` | **QUESTIONABLE** | Same: 10+ teams = 100% bar. These bars aren't meaningful percentages — just scaled indicators. |

### AttentionStrip

| Prop | Source Variable | Correct? | Notes |
|------|----------------|----------|-------|
| `message` | `${actionCount} item(s) need(s) action` | YES | actionCount = pending + overdueCount |
| `ctaLabel` | `"REVIEW NOW →"` | YES | Static label |
| `onClick` | `onNavigate?.('registrations')` | **PARTIAL** | Always navigates to registrations, even if the action items are overdue payments rather than pending registrations |
| Visibility | `actionCount > 0` | YES | Only shows when there are items |

---

## 5. Console Errors & Warnings

Cannot run the app in this investigation-only session. Based on code analysis, these are **predicted** console issues:

1. **`player_season_stats` table may not exist** — line 291 queries it; will produce a Supabase 404 if table doesn't exist. Error is caught by the `try/catch` at line 527 but would log at line 528.
2. **`games` table may not exist** — line 406 queries it inside a `try/catch` (line 404). Comment says "games table may not exist." Would produce console error on line 423.
3. **`waivers.organization_id` column may not exist** — lines 371–387 have explicit catch for this case. Comment says "Waivers table may not have org_id column."
4. **Chunk size warning** — Vite build emits `"Some chunks are larger than 500 kB"` warning (known, not a bug).
5. **React key warning potential** — several `.map()` calls use array index as key (SeasonCarousel events, OrgHealthCard metrics, etc.) — this is acceptable for static lists but may warn if items reorder.

---

## 6. Other Issues Found

### Critical

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 1 | **Team row click broken** | DashboardPage.jsx:694 | `onNavigate?.('teamwall', { id })` passes `{ id }` but `handleNavigation` checks for `item.teamId` (not `item.id`). Falls through to `getPathForPage('teamwall')` which isn't in routes.js → navigates to `/dashboard`. Team rows are NOT navigable. |
| 2 | **"Reg Link" Playbook button broken** | DashboardPage.jsx:773 | Uses `onNavigate?.('registration-templates')` but routes.js has `'templates'` not `'registration-templates'`. Navigates to `/dashboard` instead of `/settings/templates`. |
| 3 | **Settings sidebar button broken** | LynxSidebar.jsx:192 | Uses `onNavigate?.('settings', { id: 'settings' })` but `'settings'` is not in routes.js. Navigates to `/dashboard`. |

### Medium

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 4 | **TopBar is dead code** | `src/components/v2/TopBar.jsx` | TopBar is defined, exported, but never rendered. 216 lines of unused code. No search trigger, no notification bell, no settings gear, no theme toggle in the UI (those are only accessible via sidebar and keyboard shortcuts). |
| 5 | **AdminTeamsTab "Unpaid" column hardcoded to 0** | AdminTeamsTab.jsx:96–99 | The Unpaid column always shows `0`. Per-team unpaid payment data is never computed or passed. The color conditional `0 > 0` is always false. |
| 6 | **MascotNudge "Not now" does nothing** | DashboardPage.jsx:712 | `secondaryAction: { label: 'Not now', onClick: () => {} }` — the no-op means the nudge never dismisses. It persists until unsigned waivers reach 0. |
| 7 | **WeeklyLoad "This Week" label hardcoded** | DashboardPage.jsx:744 | `dateRange="This Week"` is static text. Events may span multiple weeks. Label should derive from actual event date range. |
| 8 | **Attention Strip always links to registrations** | DashboardPage.jsx:654 | Even when the action items are overdue payments (not pending registrations), clicking "REVIEW NOW →" goes to `/registrations` instead of `/payments`. |
| 9 | **overdueCount is an approximation** | DashboardPage.jsx:575 | `Math.ceil(stats.pastDue / 100)` divides dollar amount by 100 to estimate payment count. This is inaccurate — it should count unpaid payment records directly. |

### Low

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 10 | **OrgHealthCard bar percentages are arbitrary** | DashboardPage.jsx:759–761 | "Overdue", "Registrations", and "Teams Active" bars use `min(value * N, 100)` with arbitrary multipliers. Not real percentages. Misleading visualization. |
| 11 | **FinancialSnapshot both buttons go to same page** | DashboardPage.jsx:737–738 | "Send Reminders" and "View Ledger" both navigate to `/payments`. No separate ledger view exists. |
| 12 | **HeroCard stats not clickable** | HeroCard.jsx:132 | Stats have `cursor: 'default'` and hover effects but no onClick. Users may expect stats to be clickable drill-downs. |
| 13 | **WeeklyLoad events not clickable** | WeeklyLoad.jsx:41–87 | Event rows have no onClick handler. Users may expect clicking an event to navigate to event detail or schedule page. |
| 14 | **V2DashboardLayout responsive breakpoint** | V2DashboardLayout.jsx:57–68 | At `max-width: 1100px`, sidebar cards grid into 2 columns. First child spans full width. This works but sidebar cards at ~340px × 2 = 680px may be tight on 1100px screens. |

---

## 7. Role Switch Test Results

Based on code analysis of all 5 dashboard files:

| Role | Loads? | Issues |
|------|--------|--------|
| **Admin** | YES (with bugs) | Empty state bug on season switch (Investigation 1). Team row clicks broken. "Reg Link" broken. Settings button broken. |
| **Coach** | YES | All imports valid. Loading + empty state guards present. No broken navigation detected in code review. Uses `handleNavigation` same as admin — team wall links should work via `item.teamId` in nav items. |
| **Parent** | YES | All imports valid. Loading + empty state guards present. Modals properly guarded. KidCards, schedule/payment/forms tabs all safe with empty data. |
| **Player** | YES | All imports valid. Loading guard + "not linked" state. Admin preview banner properly guarded. All v2 player components handle empty arrays safely. |
| **Team Manager** | YES | All imports valid. Per-tab loading guards. Checklist logic safe. InviteCodeModal properly guarded. Inline sub-components (PaymentHealthCard, RsvpSummaryCard, RosterStatusCard) all have loading returns. |

**Returning to Admin after role switch:** Should work — `activeView` state change triggers re-render of admin nav groups. DashboardPage's `useEffect` re-runs if `selectedSeason?.id` or `seasonLoading` changed during the switch. Potential flash of empty state if data refetches (same bug as Investigation 1).

---

## Summary of All Bugs Found

| # | Severity | Bug | Fix Complexity |
|---|----------|-----|----------------|
| 1 | **CRITICAL** | Empty state shows on season switch (no `setLoading(true)` between `selectSeason` and `loadDashboardData`) | Low — add useEffect to set loading on season change |
| 2 | **CRITICAL** | Empty state shows for seasons with 0 teams even when org has data | Low — change conditional or remove inline empty state |
| 3 | **HIGH** | Team row click in AdminTeamsTab navigates to `/dashboard` (item.id vs item.teamId mismatch) | Low — fix param name |
| 4 | **HIGH** | "Reg Link" Playbook button navigates to `/dashboard` (wrong pageId) | Low — change `'registration-templates'` to `'templates'` |
| 5 | **HIGH** | Settings sidebar button navigates to `/dashboard` (pageId not in routes) | Low — add `'settings'` to routes.js or change to `'organization'` |
| 6 | **MEDIUM** | TopBar component is dead code (216 lines never rendered) | Low — delete or integrate |
| 7 | **MEDIUM** | AdminTeamsTab "Unpaid" column hardcoded to 0 | Medium — need to compute per-team unpaid |
| 8 | **MEDIUM** | MascotNudge "Not now" button does nothing | Low — add dismiss state |
| 9 | **LOW** | overdueCount is approximated from dollar amounts, not actual count | Low — count unpaid records instead |
| 10 | **LOW** | Various UX polish items (WeeklyLoad date label, OrgHealthCard bar scaling, etc.) | Low each |
