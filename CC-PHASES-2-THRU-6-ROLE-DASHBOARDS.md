# CC-PHASES-2-THRU-6-ROLE-DASHBOARDS.md
## Lynx Web Admin — V2 Dashboard Redesign: Phases 2–6
### All Five Role Dashboard Conversions

**Branch:** `feat/v2-dashboard-redesign`
**Prereq:** Phase 0 (dead code cleanup) COMPLETE + Phase 1 (shared components) COMPLETE
**Rule:** We are swapping the presentation layer of each dashboard page. Every data hook, Supabase query, context provider, modal, and service layer call stays EXACTLY as-is. We reuse existing fetched state and pass it to new v2 components as props.

---

## MASTER EXECUTION CONTRACT

Each Phase (2 through 6) targets ONE dashboard page file. Within each Phase, CC executes numbered sub-phases. After EACH sub-phase:

1. Run build verification: `npm run build` (or `npx vite build --mode development` if build script not available)
2. If build fails, STOP. Fix the error. Do not proceed.
3. `git add` + `git commit` with message format: `feat(v2): Phase X.Y — Description`
4. Move to next sub-phase

**After completing ALL sub-phases in a Phase, CC must produce a PHASE REPORT in this format:**

```
## Phase X Complete — [Role] Dashboard

### Files Modified
- list every file touched with a 1-line summary of what changed

### Files Created
- list every new file

### Components Removed from Dashboard Render
- list every component no longer rendered (file NOT deleted, just not imported/used in this page)

### Components Added to Dashboard Render
- list every v2 component now rendered

### Data Wiring Verification
- For each data source (hook, context, state variable): confirm it still loads, confirm which v2 component now receives it

### Risk Flags
- Any unexpected issues encountered
- Any TODOs or incomplete wiring
- Any console warnings introduced

### Build Status
- Pass/Fail + any warnings
```

CC posts this report as a comment or outputs it before moving to the next Phase.

---

## GLOBAL GUARDRAILS — APPLY TO ALL PHASES

### Files NEVER to modify (across all phases):
- `src/hooks/useAppNavigate.js`
- `src/hooks/useTeamManagerData.js`
- `src/contexts/AuthContext.jsx`
- `src/contexts/SeasonContext.jsx`
- `src/contexts/SportContext.jsx`
- `src/contexts/ThemeContext.jsx`
- `src/contexts/OrgBrandingContext.jsx`
- `src/contexts/ParentTutorialContext.jsx`
- `src/lib/routes.js`
- `src/lib/supabaseClient.js`
- Any file in `src/lib/` (service layers)
- Any file in `src/components/v2/` (shared components are LOCKED after Phase 1)
- Any Supabase migration, RLS policy, or database file

### Files NEVER to delete (across all phases):
- Any component file. We REMOVE components from dashboard render, we do NOT delete their files. They may be used on other pages or could return later.

### Imports NEVER to remove from dashboard pages:
- `supabase` client import
- Any `useAuth`, `useSeason`, `useSport`, `useTheme`, `useOrgBranding` context hook
- Any `useAppNavigate` hook
- The `loadDashboardData()` or equivalent data-fetching function (admin)
- The inline data-fetching `useEffect` blocks (coach, parent, player)

### Pattern to follow in EVERY dashboard page:
1. Keep all existing `import` statements for contexts, hooks, supabase, and data utilities
2. REMOVE imports for old layout components (`DashboardGridLayout`, `EditLayoutButton`, `WidgetLibraryPanel`, `SpacerWidget`, `DashboardContainer`)
3. REMOVE imports for components no longer rendered on this dashboard (but DO NOT delete the files)
4. ADD imports from `src/components/v2/` barrel
5. Keep ALL existing state declarations (`useState`, `useRef`, etc.)
6. Keep ALL existing `useEffect` data-fetching blocks unchanged
7. Keep ALL existing handler functions (`onNavigate`, modal toggles, etc.)
8. Keep ALL existing modal components and their render logic
9. REPLACE only the JSX return — swap old layout tree with v2 layout tree
10. Wire existing state variables into v2 component props

---

# ═══════════════════════════════════════════════════
# PHASE 2 — ADMIN DASHBOARD
# ═══════════════════════════════════════════════════

**File:** `src/pages/dashboard/DashboardPage.jsx` (~1,564 lines)
**Route:** `/dashboard` when `activeView === 'admin'`

## Phase 2 Scope

Replace the `DashboardGridLayout`-based render with the v2 fixed layout using shared components, plus 2 admin-specific components (SeasonCarousel, SeasonStepper).

### What stays UNTOUCHED inside DashboardPage.jsx:
- `loadDashboardData()` function (~400 lines of Supabase queries)
- All `useState` declarations (stats, upcomingEvents, monthlyPayments, teamsData, teamStats, perSeasonTeamCounts, perSeasonPlayerCounts, etc.)
- All `useEffect` blocks
- All context hook calls (useSeason, useSport, useTheme, useOrgBranding, useAuth)
- The `onNavigate` handler function
- Empty state logic (brand-new org with no data)
- All modal components that exist in the file

### What changes:
- Remove: DashboardGridLayout, EditLayoutButton, SpacerWidget imports and usage
- Remove from render: WelcomeBanner, AdminNotificationsCard, OrgHealthHero (as standalone card), OrgKpiRow, PeopleComplianceRow, OrgWallPreview, LiveActivity, DashboardFilterCard imports from render (keep files)
- Add: TopBar, HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot, WeeklyLoad, OrgHealthCard, ThePlaybook, MilestoneCard, MascotNudge, V2DashboardLayout from v2 barrel
- Add: 2 new admin-specific components (SeasonCarousel, SeasonStepper)

---

### Sub-phase 2.1 — SeasonCarousel (Admin-specific)

**File:** `src/components/v2/admin/SeasonCarousel.jsx` (NEW)

**Props:**
```jsx
SeasonCarousel.propTypes = {
  seasons: PropTypes.array.isRequired,           // from allSeasons or season journey data
  perSeasonTeamCounts: PropTypes.object,         // { seasonId: count }
  perSeasonPlayerCounts: PropTypes.object,       // { seasonId: count }
  selectedSeasonId: PropTypes.string,
  onSeasonSelect: PropTypes.func.isRequired,     // calls selectSeason()
  onViewAll: PropTypes.func,
};
```

**Structure (from admin mockup):**
```
Section header: "Active Seasons" + "View All →" link
Horizontal scrollable flex container, gap 14px, no scrollbar
Each season card: min-width 240px, flex 1
  ├── Status badge — "Mid-Season" / "Registration Open" / "Setup Phase"
  │   green/blue/amber background + dark text, 10px, weight 700, uppercase
  ├── Season name — 15px, weight 700, navy
  ├── Meta — "4 teams · 17 players" — 12px, text-secondary
  ├── Progress bar — 4px, green/sky/amber fill based on status
  │   Right-aligned: "9/10" progress text
  └── Footer — flex, space-between
      Stats: "Health 85% · $12.4k collected" — 11px muted, values in secondary weight 600
      Arrow: "→" in sky color
```

Card hover: shadow elevation + translateY(-1px). Click: calls `onSeasonSelect(season.id)`.

**Data mapping:**
- `seasons` array comes from `allSeasons` context or season journey data already computed in `loadDashboardData()`
- Team/player counts from `perSeasonTeamCounts` / `perSeasonPlayerCounts` already in state
- Season status derived from season.status field (already exists in data)
- Progress = count of completed setup steps (from `AdminSetupTracker` logic already in stats)

**Commit:** `feat(v2): Phase 2.1 — SeasonCarousel component`

---

### Sub-phase 2.2 — SeasonStepper (Admin-specific)

**File:** `src/components/v2/admin/SeasonStepper.jsx` (NEW)

**Props:**
```jsx
SeasonStepper.propTypes = {
  seasonName: PropTypes.string.isRequired,       // "Spring Soccer 2026"
  steps: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,          // "Open Reg", "Teams", etc.
    status: PropTypes.oneOf(['done', 'current', 'upcoming']).isRequired,
  })).isRequired,
  completedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
};
```

**Structure (from admin mockup):**
```
White card, 14px radius, padding 20px 24px, card shadow, border
├── Header — flex, space-between
│   ├── Title: "Season Journey · Spring Soccer 2026" — 13px, weight 700
│   └── Count: "9 of 10 Complete" — 12px, weight 700, green
└── Stepper track — flex, align-center
    Each step: flex column, align-center, flex 1, relative
    ├── Dot — 24px circle
    │   done: green bg, white checkmark
    │   current: sky bg, white play icon, 4px sky glow ring
    │   upcoming: surface bg, muted text, 2px #E2E8F0 border
    ├── Connecting line — absolute, between dots
    │   done: green, upcoming: #E2E8F0
    └── Label — 9.5px, weight 600, uppercase, muted (current: sky, weight 700)
```

**Data mapping:**
- Step data derived from `stats` object in `loadDashboardData()` — same logic as current `AdminSetupTracker` which already computes step completion. CC should examine `AdminSetupTracker.jsx` props to understand the step data shape, then transform to the flat array format above.

**Commit:** `feat(v2): Phase 2.2 — SeasonStepper component`

---

### Sub-phase 2.3 — Admin Tab Content Components

**File:** `src/components/v2/admin/AdminTeamsTab.jsx` (NEW)

A thin wrapper that renders `AllTeamsTable` data in the v2 columned table format from the mockup.

**Props:**
```jsx
AdminTeamsTab.propTypes = {
  teamsData: PropTypes.array.isRequired,         // same teamsData from DashboardPage state
  teamStats: PropTypes.object.isRequired,        // same teamStats from DashboardPage state
  onTeamClick: PropTypes.func,                   // navigate to team detail
  onViewAll: PropTypes.func,
};
```

**Structure (from admin mockup team-table):**
```
Table header row: grid 6 columns (28px dot, 1fr team, 90px roster, 80px record, 80px unpaid, 90px status)
  All header labels: 10px, weight 700, uppercase, muted, surface bg

Data rows (cap at 6-8, sorted by health):
  Each: same 6-column grid, 12px 24px padding, border-bottom, hover highlight, cursor pointer
  ├── Health dot — 8px circle: green (good), amber (attention), red (critical)
  ├── Team info — name (13.5px weight 600) + coach name (12px muted)
  ├── Roster — "18/18" center, muted weight 500
  ├── Record — "2-0" center, weight 600
  ├── Unpaid — number center, red if > 0
  └── Status badge — "Good" / "Attention" / "Critical"
      green/amber/red bg, 11px weight 700 uppercase
```

**Data mapping:**
- `teamsData` and `teamStats` are ALREADY computed in `DashboardPage.jsx`. This component just renders them differently.
- Health status derived from: unpaid count, roster fill %, coach assigned. Same logic as current `AllTeamsTable`.

Also create placeholder shells for tabs that will be wired later:

**File:** `src/components/v2/admin/AdminRegistrationsTab.jsx` (NEW) — Renders registration stats from `stats.pendingRegistrations`, `stats.totalPlayers`, etc. For now, a simple layout showing pending count + recent applicants list using data already in stats.

**File:** `src/components/v2/admin/AdminPaymentsTab.jsx` (NEW) — Renders payment data from `stats` and `monthlyPayments`. Collected vs outstanding summary + overdue items list.

**File:** `src/components/v2/admin/AdminScheduleTab.jsx` (NEW) — Renders `upcomingEvents` array from state as a list. Reuses `CalendarStripCard` inside the tab if beneficial, or renders a simpler event list.

Each tab component receives its data via props from the parent DashboardPage. Zero direct Supabase queries.

**Commit:** `feat(v2): Phase 2.3 — Admin tab content components`

---

### Sub-phase 2.4 — DashboardPage.jsx Render Swap

**File:** `src/pages/dashboard/DashboardPage.jsx` (MODIFY)

This is the big one. Replace the JSX return tree.

**Step-by-step instructions for CC:**

1. **Read the entire file first.** Identify:
   - All imports (keep context/hook/supabase imports, remove grid layout imports)
   - The `loadDashboardData()` function (DO NOT MODIFY)
   - All useState/useEffect blocks (DO NOT MODIFY)
   - The JSX return statement (THIS IS WHAT WE REPLACE)
   - Any modals rendered (KEEP ALL MODALS)

2. **Update imports.** At the top:
   ```jsx
   // REMOVE these imports:
   // - DashboardGridLayout (or DashboardGrid)
   // - EditLayoutButton
   // - WidgetLibraryPanel
   // - SpacerWidget
   // - DashboardContainer (if used as wrapper)
   // - WelcomeBanner (data moves to HeroCard)
   // - AdminNotificationsCard (moves to bell)
   // - OrgHealthHero (data splits to HeroCard + OrgHealthCard)
   // - OrgKpiRow (data merges into HeroCard stats)
   // - PeopleComplianceRow (data into Registrations tab)
   // - OrgWallPreview (removed from dashboard)
   // - LiveActivity / LiveActivitySidebar (removed)
   // - DashboardFilterCard (replaced by SeasonCarousel)

   // ADD these imports:
   import { TopBar, HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot, WeeklyLoad, OrgHealthCard, ThePlaybook, MilestoneCard, MascotNudge, V2DashboardLayout } from '../../components/v2';
   import SeasonCarousel from '../../components/v2/admin/SeasonCarousel';
   import SeasonStepper from '../../components/v2/admin/SeasonStepper';
   import AdminTeamsTab from '../../components/v2/admin/AdminTeamsTab';
   import AdminRegistrationsTab from '../../components/v2/admin/AdminRegistrationsTab';
   import AdminPaymentsTab from '../../components/v2/admin/AdminPaymentsTab';
   import AdminScheduleTab from '../../components/v2/admin/AdminScheduleTab';
   ```

3. **Add tab state** (near other useState declarations):
   ```jsx
   const [activeTab, setActiveTab] = useState('teams');
   ```

4. **Replace the JSX return.** The new structure:

   ```jsx
   return (
     <>
       <TopBar
         roleLabel="Lynx Admin"
         navLinks={[
           { label: 'Dashboard', pageId: 'dashboard', isActive: true },
           { label: 'Analytics', pageId: 'reports' },
           { label: 'Schedule', pageId: 'schedule' },
           { label: 'Roster', pageId: 'roster' },
         ]}
         searchPlaceholder="Search roster, teams..."
         onSearchClick={() => { /* trigger existing CommandPalette open */ }}
         hasNotifications={stats.pendingRegistrations > 0 || stats.pastDue > 0}
         notificationCount={(stats.pendingRegistrations || 0) + (stats.pastDue || 0)}
         onNotificationClick={() => appNavigate('notifications')}
         avatarInitials={profile?.first_name?.[0] + profile?.last_name?.[0] || 'A'}
         avatarGradient="linear-gradient(135deg, var(--v2-sky), var(--v2-navy))"
         onSettingsClick={() => appNavigate('organization')}
         onThemeToggle={toggleTheme}
         isDark={isDark}
       />

       <V2DashboardLayout
         mainContent={
           <>
             {/* HERO CARD */}
             <HeroCard
               orgLine={orgName || 'Your Organization'}
               greeting={`You've got ${stats.pastDue + stats.pendingRegistrations || 0} items to knock out, ${profile?.first_name || 'Admin'}. Let's go.`}
               subLine={`${selectedSeason?.name || 'Current Season'} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
               stats={[
                 { value: stats.totalTeams || 0, label: 'Teams' },
                 { value: stats.totalPlayers || 0, label: 'Players' },
                 { value: stats.totalCoaches || 0, label: 'Coaches' },
                 { value: stats.pastDue || 0, label: 'Overdue', color: 'red' },
                 { value: stats.totalCollected ? `$${(stats.totalCollected / 1000).toFixed(1)}k` : '$0', label: 'Collected', color: 'green' },
                 { value: stats.pendingRegistrations || 0, label: 'Pending', color: 'sky' },
               ]}
             />

             {/* ATTENTION STRIP — only show if there are action items */}
             {(stats.pastDue > 0 || stats.pendingRegistrations > 0 || stats.needsAttention?.length > 0) && (
               <AttentionStrip
                 message={`${(stats.pastDue || 0) + (stats.pendingRegistrations || 0)} items need action`}
                 ctaLabel="REVIEW NOW →"
                 onClick={() => appNavigate('registrations')}
               />
             )}

             {/* SEASON CAROUSEL */}
             <SeasonCarousel
               seasons={allSeasons || []}
               perSeasonTeamCounts={perSeasonTeamCounts}
               perSeasonPlayerCounts={perSeasonPlayerCounts}
               selectedSeasonId={selectedSeason?.id}
               onSeasonSelect={(id) => selectSeason(allSeasons.find(s => s.id === id))}
               onViewAll={() => appNavigate('season-management')}
             />

             {/* SEASON STEPPER — for selected season */}
             <SeasonStepper
               seasonName={selectedSeason?.name || ''}
               steps={/* derive from stats setup tracker data */[]}
               completedCount={stats.setupComplete || 0}
               totalCount={stats.setupTotal || 10}
             />

             {/* BODY TABS */}
             <BodyTabs
               tabs={[
                 { id: 'teams', label: 'Teams & Health' },
                 { id: 'registrations', label: 'Registrations' },
                 { id: 'payments', label: 'Payments' },
                 { id: 'schedules', label: 'Schedules' },
               ]}
               activeTabId={activeTab}
               onTabChange={setActiveTab}
               footerLink={activeTab === 'teams' ? { label: `View all ${teamsData?.length || 0} teams →`, onClick: () => appNavigate('teams') } : undefined}
             >
               {activeTab === 'teams' && (
                 <AdminTeamsTab teamsData={teamsData} teamStats={teamStats} onTeamClick={(id) => appNavigate('teamwall', { id })} onViewAll={() => appNavigate('teams')} />
               )}
               {activeTab === 'registrations' && (
                 <AdminRegistrationsTab stats={stats} onNavigate={appNavigate} />
               )}
               {activeTab === 'payments' && (
                 <AdminPaymentsTab stats={stats} monthlyPayments={monthlyPayments} onNavigate={appNavigate} />
               )}
               {activeTab === 'schedules' && (
                 <AdminScheduleTab events={upcomingEvents} onNavigate={appNavigate} />
               )}
             </BodyTabs>

             {/* MASCOT NUDGE */}
             <MascotNudge
               message={<>Hey {profile?.first_name}! I noticed <strong>{stats.unsignedWaivers || 0} players</strong> haven't turned in their medical forms. Want me to ping their parents?</>}
               primaryAction={{ label: 'Yes, send reminders', onClick: () => appNavigate('waivers') }}
               secondaryAction={{ label: 'Not now', onClick: () => {} }}
             />
           </>
         }

         sideContent={
           <>
             {/* FINANCIAL SNAPSHOT */}
             <FinancialSnapshot
               overline="Financial Snapshot"
               heading={selectedSeason?.name || 'Current Season'}
               headingSub="Revenue Overview"
               projectedRevenue={stats.projectedRevenue || null}
               collectedPct={stats.totalExpected ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0}
               receivedAmount={`$${(stats.totalCollected || 0).toLocaleString()}`}
               receivedLabel="Received"
               outstandingAmount={`$${(stats.totalOutstanding || 0).toLocaleString()}`}
               outstandingLabel="Outstanding"
               breakdown={[
                 { label: 'Registration', amount: `$${(stats.registrationRevenue || 0).toLocaleString()}`, color: 'var(--v2-green)' },
                 { label: 'Uniforms', amount: `$${(stats.uniformRevenue || 0).toLocaleString()}`, color: 'var(--v2-sky)' },
                 { label: 'Monthly Dues', amount: `$${(stats.duesRevenue || 0).toLocaleString()}`, color: 'var(--v2-purple)' },
                 { label: 'Tournament Fees', amount: `$${(stats.tournamentRevenue || 0).toLocaleString()}`, color: 'var(--v2-amber)' },
               ]}
               primaryAction={{ label: 'Send Reminders', onClick: () => appNavigate('payments'), variant: 'danger' }}
               secondaryAction={{ label: 'View Ledger', onClick: () => appNavigate('payments') }}
             />

             {/* WEEKLY LOAD */}
             <WeeklyLoad
               title="Weekly Load"
               dateRange={/* compute from upcomingEvents date range */`This Week`}
               events={(upcomingEvents || []).slice(0, 5).map(evt => ({
                 dayName: new Date(evt.event_date).toLocaleDateString('en-US', { weekday: 'short' }),
                 dayNum: new Date(evt.event_date).getDate(),
                 isToday: new Date(evt.event_date).toDateString() === new Date().toDateString(),
                 title: evt.title || evt.event_type,
                 meta: `${evt.location || 'TBD'} · ${evt.start_time || ''}`,
               }))}
             />

             {/* ORG HEALTH */}
             <OrgHealthCard
               metrics={[
                 { label: 'Roster Fill', value: `${stats.totalPlayers || 0}/${stats.totalCapacity || 0}`, percentage: stats.totalCapacity ? Math.round((stats.totalPlayers / stats.totalCapacity) * 100) : 0, color: 'sky' },
                 { label: 'Payments', value: `${stats.paymentPct || 0}%`, percentage: stats.paymentPct || 0, color: 'green' },
                 { label: 'Overdue', value: String(stats.pastDue || 0), percentage: Math.min((stats.pastDue || 0) * 5, 100), color: 'red', isAlert: (stats.pastDue || 0) > 0 },
                 { label: 'Registrations', value: String(stats.pendingRegistrations || 0), percentage: Math.min((stats.pendingRegistrations || 0) * 10, 100), color: 'purple' },
                 { label: 'Teams Active', value: String(stats.totalTeams || 0), percentage: Math.min((stats.totalTeams || 0) * 10, 100), color: 'amber' },
               ]}
             />

             {/* THE PLAYBOOK */}
             <ThePlaybook
               actions={[
                 { emoji: '📅', label: 'Create Event', onClick: () => appNavigate('schedule'), isPrimary: true },
                 { emoji: '📢', label: 'Send Blast', onClick: () => appNavigate('blasts') },
                 { emoji: '👤', label: 'Add Player', onClick: () => appNavigate('registrations') },
                 { emoji: '✅', label: 'Approve Regs', onClick: () => appNavigate('registrations') },
                 { emoji: '📊', label: 'Reports', onClick: () => appNavigate('reports') },
                 { emoji: '🔗', label: 'Reg Link', onClick: () => appNavigate('registration-templates') },
               ]}
             />

             {/* MILESTONE */}
             <MilestoneCard
               trophy="🏆"
               title="Gold Tier Admin · Level 12"
               subtitle="Top 5% of regional efficiency"
               xpCurrent={4990}
               xpTarget={5200}
               variant="gold"
             />
           </>
         }
       />

       {/* KEEP ALL EXISTING MODALS — render them exactly as before */}
       {/* ... existing modal JSX stays here unchanged ... */}
     </>
   );
   ```

**CRITICAL NOTES FOR CC:**

1. The JSX above is a TEMPLATE showing the structure. CC must adapt the actual prop values to match the real variable names in `DashboardPage.jsx`. The state variables may be named slightly differently (e.g., `stats.totalTeams` might be `stats.teams` or `stats.teamCount`). **CC MUST read the actual loadDashboardData() function and state declarations to get the correct names.**

2. The SeasonStepper `steps` prop needs to be derived from whatever data `AdminSetupTracker` currently receives. CC should look at how `AdminSetupTracker` is called to determine the step data shape.

3. The FinancialSnapshot `breakdown` data (registrationRevenue, uniformRevenue, etc.) may not exist as separate fields in stats. CC should check `OrgFinancials.jsx` to see how it breaks down payment data, and derive the same breakdown for the new component. If the breakdown data isn't readily available, use `monthlyPayments` data grouped by fee_type, or pass `breakdown={null}` to skip the breakdown section.

4. The MilestoneCard shows hardcoded data for now (Gold Tier, Level 12, 4990/5200 XP). Admin gamification is NEW — there's no existing data source. Hardcode placeholder values that look correct. A TODO comment should mark this for future wiring.

5. The MascotNudge message should be contextual. CC can use the same `needsAttentionItems` logic to pick the most relevant nudge. If too complex for now, use a generic message based on stats.

6. **CommandPalette integration:** The existing `CommandPalette` component is rendered somewhere in `MainApp.jsx` with a keyboard shortcut. The TopBar's `onSearchClick` should trigger the same open mechanism. CC should find how CommandPalette is currently toggled (likely a state in MainApp or a global event) and wire the same trigger. If it's too tightly coupled, use a simple `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))` workaround.

7. **Empty state:** The current DashboardPage has empty state logic for new orgs. KEEP this. Wrap the entire v2 layout in the same conditional: if org has no data, show existing empty state; otherwise show v2 layout.

**Testing after this sub-phase:**
- Load `/dashboard` as admin
- Verify hero card shows org name, greeting, 6 stats
- Verify season carousel shows seasons (if multiple exist)
- Verify body tabs switch between 4 tabs
- Verify Teams & Health tab shows team rows
- Verify sidebar cards render (financial snapshot, weekly load, org health, playbook, milestone)
- Verify all navigation actions work (clicking playbook items, tab footer links, etc.)
- Verify no console errors
- Verify existing modals still open (if triggered)

**Commit:** `feat(v2): Phase 2.4 — Admin dashboard render swap`

---

### Sub-phase 2.5 — Admin Cleanup + Breadcrumb Suppression

1. Remove the `DashboardContainer` wrapper if it was wrapping the old grid (the v2 layout has its own padding)
2. Remove the filter bar (season/sport/team selectors) from above the content — season context now comes from SeasonCarousel click
3. Remove the `EditLayoutButton` FAB render
4. Suppress `Breadcrumb` on the dashboard route for admin (if breadcrumb is rendered in `MainApp.jsx`, add a condition to hide it when on `/dashboard` — OR just leave it for now if it's non-intrusive)
5. Verify the `app-wrapper` div in `MainApp.jsx` has `margin-left: 60px` to account for the slim sidebar (it should from Phase 1 sidebar rework, but verify)

**Commit:** `feat(v2): Phase 2.5 — Admin cleanup and polish`

---

# ═══════════════════════════════════════════════════
# PHASE 3 — COACH DASHBOARD
# ═══════════════════════════════════════════════════

**File:** `src/pages/roles/CoachDashboard.jsx` (~881 lines)
**Route:** `/dashboard` when `activeView === 'coach'`

## Phase 3 Scope

Replace the grid layout with v2 fixed layout. Add TeamSwitcher and GameDayCard (coach-specific sidebar component).

### What stays UNTOUCHED:
- All Supabase queries (teams, roster, events, RSVPs, stats, shoutouts, challenges, chat)
- All useState declarations (teams, selectedTeam, roster, upcomingEvents, teamRecord, topPlayers, activeChallenges, needsAttentionItems, checklistState)
- All useEffect data-fetching blocks
- All modal components (EventDetailModal, CoachBlastModal, WarmupTimerModal, PlayerCardExpanded, GiveShoutoutModal)
- Team selection logic
- Season selection logic

---

### Sub-phase 3.1 — TeamSwitcher (Coach-specific)

**File:** `src/components/v2/coach/TeamSwitcher.jsx` (NEW)

**Props:**
```jsx
TeamSwitcher.propTypes = {
  teams: PropTypes.array.isRequired,             // coach's assigned teams
  selectedTeamId: PropTypes.string,
  onTeamSelect: PropTypes.func.isRequired,
};
```

**Structure (from coach mockup):**
```
Flex row, gap 10px
Each pill:
  padding 8px 18px, radius 10px, 13px weight 600
  Inactive: white bg, text-secondary, 1px border-subtle. Hover: surface bg
  Active: navy bg, white text, navy border
```

**Commit:** `feat(v2): Phase 3.1 — TeamSwitcher component`

---

### Sub-phase 3.2 — GameDayCard (Coach sidebar)

**File:** `src/components/v2/coach/GameDayCard.jsx` (NEW)

The dark navy "Next Game" card for the coach right sidebar.

**Props:**
```jsx
GameDayCard.propTypes = {
  overline: PropTypes.string,                    // "Next Game"
  countdownText: PropTypes.string,               // "⏱ 5d 2h 33m"
  matchup: PropTypes.string,                     // "Black Hornets Elite vs. North Dallas FC"
  details: PropTypes.string,                     // "Saturday, Mar 22 · Home Arena · 10:00 AM"
  confirmed: PropTypes.number,
  pending: PropTypes.number,
  seasonRecord: PropTypes.string,                // "4-1"
  ctaLabel: PropTypes.string,                    // "Start Game Day Mode →"
  onCtaClick: PropTypes.func,
};
```

**Structure (from coach mockup gameday-card):**
```
Dark navy gradient card (same treatment as FinancialSnapshot)
├── Overline: "Next Game" — 10px, weight 700, sky
├── Countdown badge — inline-block, sky bg 15% opacity, sky text, 11px weight 700, radius 6px
├── Matchup — 20px, weight 800, -0.02em tracking
├── Details — 12.5px, rgba(255,255,255,0.5)
├── Meta row — flex, gap 20px
│   Each: value (16px weight 800) + label (10px uppercase muted)
│   Pending value: red color
│   Season record: green color
└── CTA button — full width, sky bg, navy text, 11px padding, 10px radius, 13px weight 700
```

**Commit:** `feat(v2): Phase 3.2 — GameDayCard component`

---

### Sub-phase 3.3 — ShoutoutCard (Coach sidebar)

**File:** `src/components/v2/coach/ShoutoutCard.jsx` (NEW)

**Props:**
```jsx
ShoutoutCard.propTypes = {
  quote: PropTypes.string,
  fromLabel: PropTypes.string,                   // "— You, 2 days ago"
};
```

**Structure (from coach mockup):** Warm amber gradient card (like milestone), with star icon, title "Latest Shoutout", italic quote text, attribution line.

**Commit:** `feat(v2): Phase 3.3 — ShoutoutCard component`

---

### Sub-phase 3.4 — Coach Tab Content Components

**File:** `src/components/v2/coach/CoachRosterTab.jsx` (NEW)

Renders roster data in the v2 columned table format from coach mockup.

**Structure:** Grid: 40px avatar, 1fr player, 70px pos, 70px goals, 80px attendance, 90px RSVP status. Each row shows player avatar (gradient circle with initials), name + jersey/position, stats, and RSVP badge (Going/Pending/No RSVP).

Also create shells for:
- `src/components/v2/coach/CoachAttendanceTab.jsx` — attendance data per event
- `src/components/v2/coach/CoachStatsTab.jsx` — wraps TopPlayersCard data in table format
- `src/components/v2/coach/CoachGamePrepTab.jsx` — pre-game checklist using checklistState

All receive data via props. Zero direct queries.

**Commit:** `feat(v2): Phase 3.4 — Coach tab content components`

---

### Sub-phase 3.5 — CoachDashboard.jsx Render Swap

**File:** `src/pages/roles/CoachDashboard.jsx` (MODIFY)

Same pattern as Phase 2.4 but for coach:

1. Remove grid layout imports, add v2 imports
2. Add `const [activeTab, setActiveTab] = useState('roster');`
3. Replace JSX return:

```
TopBar (roleLabel="Lynx Coach", navLinks: Dashboard/Game Day/Stats/Chat)
V2DashboardLayout
  mainContent:
    HeroCard (4 stats: Roster count, Attendance %, Record, No RSVP count)
      orgLine = team name + season
      greeting = contextual (game day / practice / idle) — reuse CoachHeroCarousel state machine logic
      subLine = date + location
    TeamSwitcher (teams, selectedTeam, onTeamSelect)
    AttentionStrip (from needsAttentionItems)
    BodyTabs (Roster / Attendance / Stats / Game Prep)
      Roster: CoachRosterTab with roster data
      Attendance: CoachAttendanceTab
      Stats: CoachStatsTab with topPlayers
      Game Prep: CoachGamePrepTab with checklistState
    MascotNudge (contextual — RSVP reminders)

  sideContent:
    GameDayCard (next game data from upcomingEvents[0] if game type)
    WeeklyLoad (upcoming events for this team)
    ThePlaybook (Attendance, Lineup, Shoutout, Enter Stats, Message, Challenge)
    ShoutoutCard (most recent shoutout)
    MilestoneCard (variant="sky", placeholder XP data)

  Modals: keep all existing modals
```

**CRITICAL: Coach hero greeting logic.** The current `CoachHeroCarousel` has a state machine: game today? practice today? idle? CC should extract this logic (likely a series of conditionals checking upcomingEvents for today/tomorrow) and use it to set the hero greeting and subLine. The carousel COMPONENT is no longer rendered, but its LOGIC is reused inline.

**Testing:**
- Load `/dashboard` as coach
- Verify team switcher shows assigned teams, switching updates all data
- Verify hero card shows correct contextual greeting
- Verify body tabs show roster data with correct columns
- Verify sidebar shows next game card with countdown
- Verify all modals still work
- Verify no console errors

**Commit:** `feat(v2): Phase 3.5 — Coach dashboard render swap`

---

### Sub-phase 3.6 — Coach Cleanup

Same pattern as 2.5: remove old filter bar, edit FAB, DashboardContainer if present.

**Commit:** `feat(v2): Phase 3.6 — Coach cleanup and polish`

---

# ═══════════════════════════════════════════════════
# PHASE 4 — PARENT DASHBOARD
# ═══════════════════════════════════════════════════

**File:** `src/pages/roles/ParentDashboard.jsx` (~659 lines)
**Route:** `/dashboard` when `activeView === 'parent'`

## Phase 4 Scope

Replace grid layout with v2, add KidCards component, wire family-oriented data.

### What stays UNTOUCHED:
- All Supabase queries (players/children, teams, events, payments, announcements, achievements, XP)
- All useState declarations (registrationData, teams, upcomingEvents, paymentSummary, childAchievements, teamRecord, xpData, activeChildIdx, alerts)
- usePriorityItems hook call
- All modals (EventDetailModal, PaymentOptionsModal, AddChildModal, ReRegisterModal, AlertDetailModal, ActionItemsSidebar, QuickRsvpModal)
- useParentTutorial context

---

### Sub-phase 4.1 — KidCards (Parent-specific)

**File:** `src/components/v2/parent/KidCards.jsx` (NEW)

**Props:**
```jsx
KidCards.propTypes = {
  children: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    teamName: PropTypes.string,
    age: PropTypes.number,
    avatarGradient: PropTypes.string,            // CSS gradient for avatar
    initials: PropTypes.string,
    attendance: PropTypes.string,                // "94%"
    record: PropTypes.string,                    // "2-0"
    nextEvent: PropTypes.string,                 // "Sat" or "Mon"
    badgeOrStreak: PropTypes.node,               // badge chip or streak chip
  })).isRequired,
  selectedChildId: PropTypes.string,
  onChildSelect: PropTypes.func,                 // clicking a card filters tabs
};
```

**Structure (from parent mockup kid-cards):**
```
Grid: repeat(2, 1fr), gap 14px  (single column if only 1 child)

Each kid card: white bg, 14px radius, padding 20px, shadow, border, hover elevation
├── Top — flex, align-center, gap 14px, mb 14px
│   ├── Avatar — 44x44px, radius 12px, gradient bg, initials 16px weight 800 white
│   └── Name (15px weight 700) + Team (12px text-secondary)
├── Stats grid — repeat(3, 1fr), gap 8px, mb 12px
│   Each: centered, surface bg, 8px radius, 8px 4px padding
│   Value: 15px weight 800 (green for attendance)
│   Label: 9px weight 600 uppercase muted
└── Badge/Streak chip
    Badge: purple-tinted bg, purple text, 12px weight 600, emoji + text
    Streak: amber-tinted bg, amber text, fire emoji + text
```

**Commit:** `feat(v2): Phase 4.1 — KidCards component`

---

### Sub-phase 4.2 — Parent Tab Content Components

**File:** `src/components/v2/parent/ParentScheduleTab.jsx` (NEW)

Schedule rows with child name tags and RSVP buttons (from parent mockup).

**Structure:**
```
Each row: flex, gap 14px, py 12px, border-bottom, align-center
├── Date block — 48px, center. Day name (10px uppercase muted) + Day num (20px weight 800 navy, today: sky)
├── Info — flex 1. Title (14px weight 600) + Meta (12px muted)
├── Child tag — sky bg 8% opacity, sky text, 11px weight 600, radius 6px, "Ava" / "Lucas"
└── RSVP button
    Going: green bg, dark green text, "✓ Going"
    Pending: navy bg, white text, "RSVP" — click triggers existing QuickRsvpModal
```

Also create:
- `src/components/v2/parent/ParentPaymentsTab.jsx` — from paymentSummary data
- `src/components/v2/parent/ParentFormsTab.jsx` — from usePriorityItems waiver data
- `src/components/v2/parent/ParentReportCardTab.jsx` — from achievements + stats

**Commit:** `feat(v2): Phase 4.2 — Parent tab content components`

---

### Sub-phase 4.3 — BadgeShowcase (Parent sidebar)

**File:** `src/components/v2/parent/BadgeShowcase.jsx` (NEW)

**Props:**
```jsx
BadgeShowcase.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.shape({
    emoji: PropTypes.string,
    name: PropTypes.string.isRequired,
    childName: PropTypes.string,
    earnedDate: PropTypes.string,
    tier: PropTypes.oneOf(['common', 'rare', 'epic', 'legendary']),
  })).isRequired,
};
```

**Structure (from parent mockup badge showcase):** Rows with 40px emoji icon, name + child/date meta, tier badge (colored label).

**Commit:** `feat(v2): Phase 4.3 — BadgeShowcase component`

---

### Sub-phase 4.4 — ParentDashboard.jsx Render Swap

**File:** `src/pages/roles/ParentDashboard.jsx` (MODIFY)

```
TopBar (roleLabel="Lynx Parent", navLinks: Dashboard/Schedule/Payments/Chat)
V2DashboardLayout
  mainContent:
    HeroCard (4 stats: Kids, Events this week, Amount due, Badges earned)
      orgLine = "The [LastName] Family" — derive from profile
      greeting = contextual child events message
      subLine = org name + season
    KidCards (registrationData mapped to kid card format)
    AttentionStrip (from usePriorityItems)
    BodyTabs (Schedule / Payments / Forms & Waivers / Report Card)
    MascotNudge (badge celebration or payment reminder)

  sideContent:
    FinancialSnapshot (configured as Family Balance — green "Pay Balance Now" CTA)
    BadgeShowcase (childAchievements)
    ThePlaybook (RSVP, Pay Now, Forms, Message, Report Card, Badges)
    MilestoneCard (variant="gold", xpData from state)

  Modals: keep ALL existing modals
```

**CRITICAL: Child data mapping.** The current `registrationData` contains child players with team info. CC must map this to the KidCards format:
- `firstName`, `lastName` from player record
- `teamName` from associated team
- `attendance` — may need to compute from events data or use a placeholder
- `record` from `teamRecord` state
- `badgeOrStreak` from `childAchievements`

**CRITICAL: Family name in hero.** Use `profile?.last_name` to construct "The [LastName] Family". NEVER use a hardcoded family name. If last_name is null, fall back to the user's first name or "Your Family".

**Testing:**
- Load `/dashboard` as parent
- Verify kid cards show for each child (or 1 if single child)
- Verify clicking a kid card filters body tab content (or just highlights — depends on implementation)
- Verify RSVP buttons in schedule tab trigger existing modal
- Verify Family Balance shows payment data
- Verify badge showcase shows achievements
- No console errors

**Commit:** `feat(v2): Phase 4.4 — Parent dashboard render swap`

---

### Sub-phase 4.5 — Parent Cleanup

Remove old filter bar, edit FAB, DashboardContainer, orphan banner (move to attention strip if needed).

**Commit:** `feat(v2): Phase 4.5 — Parent cleanup and polish`

---

# ═══════════════════════════════════════════════════
# PHASE 5 — PLAYER DASHBOARD
# ═══════════════════════════════════════════════════

**File:** `src/pages/roles/PlayerDashboard.jsx` (~374 lines)
**Route:** `/dashboard` when `activeView === 'player'`

## Phase 5 Scope

Replace grid layout with v2 DARK mode layout. Gold accent system. Enhanced hero card.

### VISUAL SHIFT
The entire player dashboard is dark:
- Page background: `#060E1A` (via `.v2-player-dark` class from tokens)
- Card backgrounds: `#132240`
- Accent: gold `#FFD700` instead of sky blue
- Sidebar: midnight bg, gold logo, gold active state

### What stays UNTOUCHED:
- All Supabase queries (player profile, teams, season stats, game stats, skill ratings, events, achievements)
- All useState (playerData, seasonStats, gameStats, badges, upcomingEvents, rankings, skillRatings, overallRating, level, xpProgress)
- Admin preview mode logic
- Multi-team selector logic

---

### Sub-phase 5.1 — Player Tab Content Components

**File:** `src/components/v2/player/PlayerBadgesTab.jsx` (NEW)

3-column badge grid from player mockup.

**Structure:**
```
Grid: repeat(3, 1fr), gap 12px
Each badge card: rgba(255,255,255,0.03) bg, 12px radius, 18px 14px padding, center, border-subtle
  Hover: rgba(255,255,255,0.06), translateY(-2px)
  ├── Icon — 32px emoji, mb 8px
  ├── Name — 12.5px, weight 700, text-primary
  └── Tier — 10px, weight 700, uppercase
      Epic: purple, Rare: blue, Common: muted

  Locked badges: dashed border, 50% opacity, lock emoji, "Locked" text
```

Also create:
- `src/components/v2/player/PlayerChallengesTab.jsx` — challenge rows with progress bars
- `src/components/v2/player/PlayerStatsTab.jsx` — season stats display
- `src/components/v2/player/PlayerSkillsTab.jsx` — skill ratings from coach evals

**Commit:** `feat(v2): Phase 5.1 — Player tab content components`

---

### Sub-phase 5.2 — LeaderboardCard (Player sidebar)

**File:** `src/components/v2/player/LeaderboardCard.jsx` (NEW)

**Props:**
```jsx
LeaderboardCard.propTypes = {
  teamName: PropTypes.string,
  entries: PropTypes.arrayOf(PropTypes.shape({
    rank: PropTypes.number.isRequired,
    initials: PropTypes.string.isRequired,
    avatarGradient: PropTypes.string,
    name: PropTypes.string.isRequired,
    detail: PropTypes.string,                    // "Striker · 7 goals"
    xp: PropTypes.number.isRequired,
    isCurrentPlayer: PropTypes.bool,
  })).isRequired,
};
```

**Structure (from player mockup leaderboard):**
```
Side card (dark variant)
Each row: flex, align-center, gap 12px, py 10px, border-bottom
  isCurrentPlayer: gold-tinted bg, gold border, margin -20px with 20px padding
  ├── Rank — 14px weight 800, muted (gold for #1 and current player)
  ├── Avatar — 32x32 gradient circle, initials
  ├── Info — name (13px weight 600) + detail (11px muted)
  └── XP — 13px weight 700, gold
```

**Commit:** `feat(v2): Phase 5.2 — LeaderboardCard component`

---

### Sub-phase 5.3 — ChallengesSidebar (Player sidebar)

**File:** `src/components/v2/player/ChallengesSidebar.jsx` (NEW)

Compact challenge list with progress bars for the sidebar (from player mockup).

**Structure:** Side card (dark). Each row: icon (40px rounded, tinted bg), name + XP reward meta, progress bar + count text.

**Commit:** `feat(v2): Phase 5.3 — ChallengesSidebar component`

---

### Sub-phase 5.4 — ShoutoutFeed (Player sidebar)

**File:** `src/components/v2/player/ShoutoutFeed.jsx` (NEW)

**Props:**
```jsx
ShoutoutFeed.propTypes = {
  shoutouts: PropTypes.arrayOf(PropTypes.shape({
    from: PropTypes.string.isRequired,
    quote: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
  })).isRequired,
};
```

**Structure:** Side card (dark). Each row: from label (11px sky), italic quote (13px text-primary), date (10px muted).

**Commit:** `feat(v2): Phase 5.4 — ShoutoutFeed component`

---

### Sub-phase 5.5 — PlayerDashboard.jsx Render Swap

**File:** `src/pages/roles/PlayerDashboard.jsx` (MODIFY)

**CRITICAL:** Wrap entire page in `<div className="v2-player-dark">` to activate dark tokens.

```
<div className="v2-player-dark">
  TopBar (roleLabel="Lynx Player", navLinks: Dashboard/Stats/Badges/Leaderboard)
    — dark variant: gold brand, dark backdrop
  V2DashboardLayout variant="dark"
    mainContent:
      HeroCard variant="player"
        levelBadge = <span>LVL {level} badge + "Gold Tier · {teamName}"</span>
        greeting = "What's up, {firstName}. You're on fire."
        subLine = "{seasonStats.goals} goals · {seasonStats.assists} assists · {attendance}% attendance"
        mascotEmoji = "🐱"
        xpBar = gold XP bar from xpProgress state
        streakBadge = streak counter if streak >= 2
        stats = NONE (player hero uses XP bar instead of stat grid)

      BodyTabs variant="dark" (Badges / Challenges / Season Stats / Skills)
        — active tab: gold underline, gold text
        Badges: PlayerBadgesTab with badges data
        Challenges: PlayerChallengesTab
        Season Stats: PlayerStatsTab with seasonStats + gameStats
        Skills: PlayerSkillsTab with skillRatings

      MascotNudge variant="dark" (challenge progress nudge)

    sideContent:
      LeaderboardCard (rankings data from state)
      ChallengesSidebar (activeChallenges or derived from existing data)
      WeeklyLoad variant="dark" (title="Upcoming", upcomingEvents)
      ShoutoutFeed (shoutouts from existing query)
      ThePlaybook variant="dark" columns={2} (RSVP, Start Drill, My Stats, Leaderboard)

    Modals: keep admin preview mode, multi-team selector
</div>
```

**CRITICAL: Player hero is structurally different.** It does NOT use the stat grid. Instead it shows:
- Level badge + tier label (top, where orgLine normally goes)
- XP bar (between greeting and streak, where stats normally go)
- Streak badge (below XP bar)

The HeroCard base component should handle this via the `variant="player"` path + the `levelBadge`, `xpBar`, `streakBadge` slot props defined in Phase 1.

**CRITICAL: Admin preview mode.** The current player dashboard has logic for admins to preview as a specific player. This MUST survive. The admin preview banner and `AdminPlayerSelector` modal should still render when `isAdminPreview` is true.

**Testing:**
- Load `/dashboard` as player
- Verify ENTIRE page is dark (bg #060E1A)
- Verify sidebar is midnight with gold logo and gold active states
- Verify topbar is dark with gold brand text
- Verify hero shows LVL badge, gold XP bar, streak counter
- Verify badge grid shows 3-column layout with locked badges dashed
- Verify leaderboard highlights current player
- Verify challenge progress bars render
- Verify shoutout feed shows recent shoutouts
- Switch to admin role, then use admin preview to view as player — verify it still works
- No console errors

**Commit:** `feat(v2): Phase 5.5 — Player dashboard render swap`

---

### Sub-phase 5.6 — Player Cleanup

Remove old grid layout remnants, verify dark mode doesn't leak when switching roles.

**IMPORTANT TEST:** After player cleanup, switch from player role to admin role. Verify admin dashboard is NOT dark. The `.v2-player-dark` class must only exist on the player dashboard's wrapping div, not on a parent that persists across role switches.

**Commit:** `feat(v2): Phase 5.6 — Player cleanup and dark mode isolation`

---

# ═══════════════════════════════════════════════════
# PHASE 6 — TEAM MANAGER DASHBOARD
# ═══════════════════════════════════════════════════

**File:** `src/pages/roles/TeamManagerDashboard.jsx` (~440 lines)
**Route:** `/dashboard` when `activeView === 'team_manager'`

## Phase 6 Scope

Lightest touch. Team Manager already uses fixed 2-column layout (no grid). Restyle to match v2 visual language using shared components.

### What stays UNTOUCHED:
- `useTeamManagerData(teamId)` hook — all data from this hook
- All useState (gettingStartedDismissed, etc.)
- InviteCodeModal
- Team assignment logic from roleContext

---

### Sub-phase 6.1 — TeamManagerDashboard.jsx Restyle

**File:** `src/pages/roles/TeamManagerDashboard.jsx` (MODIFY)

This is a single sub-phase because the changes are lighter. The Team Manager page already has a structured layout, so we're reskinning, not restructuring.

1. Add v2 imports
2. Replace the JSX return:

```
TopBar (roleLabel="Lynx Team Manager", navLinks: Dashboard/Roster/Schedule/Payments)
V2DashboardLayout
  mainContent:
    HeroCard
      orgLine = team name + season
      greeting = "Your team is looking good, {firstName}."
      subLine = "{rosterCount} players · {upcomingEvents[0]?.title || 'No upcoming events'}"
      stats = [
        { value: rosterCount, label: 'Roster' },
        { value: registrationStatus.capacity, label: 'Capacity' },
        { value: paymentHealth.overdueCount, label: 'Overdue', color: 'red' },
        { value: nextEventRsvp?.confirmed || 0, label: 'RSVPs', color: 'green' },
      ]

    AttentionStrip (if overdue payments or pending registrations)

    {/* Getting Started Checklist — keep existing, just restyle card wrapper */}
    {!gettingStartedDismissed && <SideCard>...existing checklist content restyled...</SideCard>}

    BodyTabs (Roster / Payments / Schedule / Attendance)
      Roster: RosterStatusCard data in table format (can reuse a simplified version of CoachRosterTab or create inline)
      Payments: PaymentHealthCard data in list format
      Schedule: upcomingEvents list
      Attendance: RSVP summary data

    MascotNudge (contextual — roster fill, payment reminders)

  sideContent:
    FinancialSnapshot (configured for team-level: collected vs overdue from paymentHealth)
    WeeklyLoad (upcomingEvents from hook)
    ThePlaybook (Attendance, Send Blast, Schedule, Team Chat, Payments, Invite Code)
      — Invite Code onClick: open existing InviteCodeModal
    MilestoneCard (placeholder — Team Manager gamification is new)

  Modals: InviteCodeModal
```

**Data mapping from useTeamManagerData:**
- `paymentHealth` → FinancialSnapshot (receivedAmount = collectedAmount, outstandingAmount = overdueAmount + pendingAmount)
- `nextEventRsvp` → HeroCard stats (confirmed RSVPs)
- `registrationStatus` → HeroCard stats (capacity, roster fill)
- `rosterCount` → HeroCard stats
- `upcomingEvents` → WeeklyLoad

**Testing:**
- Load `/dashboard` as team_manager
- Verify hero card shows team-level stats
- Verify body tabs switch correctly
- Verify The Playbook "Invite Code" button opens existing modal
- Verify financial snapshot shows team payment health
- No console errors

**Commit:** `feat(v2): Phase 6.1 — Team Manager dashboard restyle`

---

### Sub-phase 6.2 — Team Manager Cleanup

Remove old layout wrappers, verify Getting Started checklist still dismisses via localStorage.

**Commit:** `feat(v2): Phase 6.2 — Team Manager cleanup and polish`

---

# ═══════════════════════════════════════════════════
# POST-PHASE 6 — CROSS-ROLE QA CHECKLIST
# ═══════════════════════════════════════════════════

After all 5 role dashboards are converted, CC must run this verification pass:

### Build Verification
- [ ] `npm run build` passes with zero errors
- [ ] `npm run build` produces zero new warnings that weren't present before Phase 2

### Role Switching
- [ ] Log in as a multi-role user
- [ ] Switch Admin → Coach → Parent → Player → Team Manager → Admin
- [ ] At each switch: dashboard loads, correct layout renders, no flash of wrong layout
- [ ] Player dark mode does NOT persist when switching to another role
- [ ] Sidebar active states update correctly per role

### Data Integrity (per role)
- [ ] **Admin:** stats load, season carousel shows seasons, team table populates, financial snapshot shows numbers
- [ ] **Coach:** team switcher works, roster populates, next game card shows data, switching teams updates all content
- [ ] **Parent:** kid cards show children, RSVP buttons work, payment data shows, badge showcase populates
- [ ] **Player:** XP bar fills, leaderboard shows rankings, badge grid populates, challenges show progress, dark mode is consistent
- [ ] **Team Manager:** payment health shows, roster count correct, upcoming events populate, invite code modal opens

### Navigation
- [ ] All Playbook actions navigate to correct pages
- [ ] TopBar nav links navigate correctly
- [ ] Sidebar icon clicks navigate correctly
- [ ] Body tab footer "View all" links work
- [ ] Search trigger opens CommandPalette
- [ ] Notification bell navigates to notifications page

### Modals
- [ ] Admin: all existing modals still open
- [ ] Coach: EventDetailModal, CoachBlastModal, WarmupTimerModal, PlayerCardExpanded, GiveShoutoutModal
- [ ] Parent: EventDetailModal, PaymentOptionsModal, AddChildModal, ReRegisterModal, AlertDetailModal, ActionItemsSidebar, QuickRsvpModal
- [ ] Player: AdminPlayerSelector (admin preview mode)
- [ ] Team Manager: InviteCodeModal

### Console
- [ ] Zero `Error` entries in console across all 5 roles
- [ ] Note any new warnings (acceptable: React key warnings in development)

### Responsive (quick check)
- [ ] Resize to <1100px: sidebar column collapses to grid
- [ ] Resize to <700px: sidebar hides, single column layout, nav links hidden

### Final Report
CC produces a FINAL SUMMARY report:

```
## V2 Dashboard Redesign — Phases 2-6 Complete

### Total Files Modified: X
### Total Files Created: X
### Total Commits: X

### Components Removed from Dashboard Renders (files still exist):
- [list per role]

### Components Added (v2 shared + role-specific):
- [list]

### Known TODOs:
- MilestoneCard data is placeholder (gamification system not yet built)
- MascotNudge messages are semi-hardcoded (AI nudge engine not yet built)
- FinancialSnapshot breakdown may show $0 for some categories if payment data doesn't have fee_type breakdown
- [any other TODOs]

### Risk Flags:
- [anything unexpected]

### Build Status: Pass/Fail
### Console Errors: 0 / [count]
```

---

## APPENDIX: FILE CREATION SUMMARY

### Phase 2 creates:
- `src/components/v2/admin/SeasonCarousel.jsx`
- `src/components/v2/admin/SeasonStepper.jsx`
- `src/components/v2/admin/AdminTeamsTab.jsx`
- `src/components/v2/admin/AdminRegistrationsTab.jsx`
- `src/components/v2/admin/AdminPaymentsTab.jsx`
- `src/components/v2/admin/AdminScheduleTab.jsx`

### Phase 3 creates:
- `src/components/v2/coach/TeamSwitcher.jsx`
- `src/components/v2/coach/GameDayCard.jsx`
- `src/components/v2/coach/ShoutoutCard.jsx`
- `src/components/v2/coach/CoachRosterTab.jsx`
- `src/components/v2/coach/CoachAttendanceTab.jsx`
- `src/components/v2/coach/CoachStatsTab.jsx`
- `src/components/v2/coach/CoachGamePrepTab.jsx`

### Phase 4 creates:
- `src/components/v2/parent/KidCards.jsx`
- `src/components/v2/parent/ParentScheduleTab.jsx`
- `src/components/v2/parent/ParentPaymentsTab.jsx`
- `src/components/v2/parent/ParentFormsTab.jsx`
- `src/components/v2/parent/ParentReportCardTab.jsx`
- `src/components/v2/parent/BadgeShowcase.jsx`

### Phase 5 creates:
- `src/components/v2/player/PlayerBadgesTab.jsx`
- `src/components/v2/player/PlayerChallengesTab.jsx`
- `src/components/v2/player/PlayerStatsTab.jsx`
- `src/components/v2/player/PlayerSkillsTab.jsx`
- `src/components/v2/player/LeaderboardCard.jsx`
- `src/components/v2/player/ChallengesSidebar.jsx`
- `src/components/v2/player/ShoutoutFeed.jsx`

### Phase 6 creates:
- No new files (Team Manager reuses shared components)

### Total new files: 27 role-specific components
### Total modified files: 5 dashboard pages

### Files NOT deleted: Every removed-from-render component file survives for reuse on other pages.
