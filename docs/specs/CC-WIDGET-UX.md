# CC-WIDGET-UX — Widget Library Labels, Categories, Sizing, Journeys, Switchers

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-GLOBAL-FIXES (completed or in flight)

---

## CONTEXT

Carlos needs clarity on which widgets belong to which role, proper sizing when adding widgets, journey trackers for every role, and season/player switching for parents and coaches.

---

## RULES

1. Read every file before modifying
2. Archive before replace
3. Commit after each phase
4. TSC verify after each phase
5. No file over 500 lines

---

## PHASE 0: Archive

```bash
mkdir -p src/_archive/widget-ux-$(date +%Y%m%d)
cp src/components/layout/widgetRegistry.js src/_archive/widget-ux-$(date +%Y%m%d)/
cp src/components/layout/WidgetLibraryPanel.jsx src/_archive/widget-ux-$(date +%Y%m%d)/
cp src/components/layout/DashboardGrid.jsx src/_archive/widget-ux-$(date +%Y%m%d)/
```

**Commit:** `git add -A && git commit -m "phase 0: archive for widget UX improvements"`

---

## PHASE 1: Role Badge Pills + Category Reorganization

### Step 1.1: Update widget registry — add role display info

Read: `src/components/layout/widgetRegistry.js`

**Change the category system.** Replace the current generic categories with role-first categories:

```js
export const WIDGET_CATEGORIES = {
  ADMIN: 'Admin Widgets',
  COACH: 'Coach Widgets',
  PARENT: 'Parent & Family Widgets',
  PLAYER: 'Player Widgets',
  SHARED: 'Shared Widgets',
};
```

**Update every widget entry** to use the new categories:
- Widgets used by only one role → that role's category
- Widgets used by 2+ roles → `SHARED`

Examples:
```js
// Admin-only
{ id: 'org-health-hero', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'season-journey', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'setup-tracker', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'org-financials', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'quick-actions-admin', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'people-compliance', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'all-teams-table', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'kpi-row', category: WIDGET_CATEGORIES.ADMIN, ... }
{ id: 'action-checklist', category: WIDGET_CATEGORIES.ADMIN, ... }

// Coach-only
{ id: 'gameday-hero', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'squad-roster', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'coach-tools', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'also-this-week', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'team-readiness', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'top-players', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'coach-stats', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'season-setup-hero', category: WIDGET_CATEGORIES.COACH, ... }
{ id: 'practice-hero', category: WIDGET_CATEGORIES.COACH, ... }

// Parent-only
{ id: 'athlete-cards', category: WIDGET_CATEGORIES.PARENT, ... }
{ id: 'action-required-parent', category: WIDGET_CATEGORIES.PARENT, ... }
{ id: 'next-event', category: WIDGET_CATEGORIES.PARENT, ... }
{ id: 'season-record', category: WIDGET_CATEGORIES.PARENT, ... }
{ id: 'balance-due', category: WIDGET_CATEGORIES.PARENT, ... }
{ id: 'engagement-progress', category: WIDGET_CATEGORIES.PARENT, ... }
{ id: 'quick-links', category: WIDGET_CATEGORIES.PARENT, ... }

// Player-only
{ id: 'player-hero', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'overall-rating', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'trophy-case', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'scouting-report', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'streak', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'today-xp', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'last-game', category: WIDGET_CATEGORIES.PLAYER, ... }
{ id: 'daily-challenge', category: WIDGET_CATEGORIES.PLAYER, ... }

// Shared (multiple roles)
{ id: 'welcome-banner', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'calendar-strip', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'upcoming-events', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'notifications', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'team-chat', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'team-wall-preview', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'achievements', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'challenges', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'spacer', category: WIDGET_CATEGORIES.SHARED, ... }
{ id: 'placeholder', category: WIDGET_CATEGORIES.SHARED, ... }
```

### Step 1.2: Add role badge colors to registry

Add a `roleColors` mapping:

```js
export const ROLE_BADGE_COLORS = {
  admin: { bg: 'bg-blue-500/15', text: 'text-blue-500', label: 'ADMIN' },
  coach: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', label: 'COACH' },
  parent: { bg: 'bg-amber-500/15', text: 'text-amber-500', label: 'PARENT' },
  player: { bg: 'bg-purple-500/15', text: 'text-purple-500', label: 'PLAYER' },
};
```

### Step 1.3: Update WidgetLibraryPanel to show role badges

Read: `src/components/layout/WidgetLibraryPanel.jsx`

For each widget entry in the library panel, add role badge pills next to the label:

```jsx
<div className="flex items-center gap-1.5 flex-wrap">
  <span className="text-white font-bold text-r-sm">{widget.label}</span>
  {widget.roles.map(role => (
    <span
      key={role}
      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${ROLE_BADGE_COLORS[role].bg} ${ROLE_BADGE_COLORS[role].text}`}
    >
      {ROLE_BADGE_COLORS[role].label}
    </span>
  ))}
</div>
```

So "Engagement Progress" would show: **Engagement Progress** `PARENT` `PLAYER`
And "Organization Health" would show: **Organization Health** `ADMIN`

### Step 1.4: Sort categories in the library panel

The library should show the CURRENT role's category first, then shared, then other roles:

```jsx
const categoryOrder = {
  admin: [WIDGET_CATEGORIES.ADMIN, WIDGET_CATEGORIES.SHARED, WIDGET_CATEGORIES.COACH, WIDGET_CATEGORIES.PARENT, WIDGET_CATEGORIES.PLAYER],
  coach: [WIDGET_CATEGORIES.COACH, WIDGET_CATEGORIES.SHARED, WIDGET_CATEGORIES.ADMIN, WIDGET_CATEGORIES.PARENT, WIDGET_CATEGORIES.PLAYER],
  parent: [WIDGET_CATEGORIES.PARENT, WIDGET_CATEGORIES.SHARED, WIDGET_CATEGORIES.ADMIN, WIDGET_CATEGORIES.COACH, WIDGET_CATEGORIES.PLAYER],
  player: [WIDGET_CATEGORIES.PLAYER, WIDGET_CATEGORIES.SHARED, WIDGET_CATEGORIES.ADMIN, WIDGET_CATEGORIES.COACH, WIDGET_CATEGORIES.PARENT],
};
```

### Step 1.5: Verify library panel shows role badges and role-first categories.

**Commit:** `git add -A && git commit -m "phase 1: widget library — role badge pills, role-first categories"`

---

## PHASE 2: Fix Widget Add Sizing

### Step 2.1: Read DashboardGrid add logic

```bash
cat src/components/layout/DashboardGrid.jsx
```

Find the `handleAddWidget` function.

### Step 2.2: Ensure widgets add at their defaultSize, not tiny

The `handleAddWidget` should use the widget's `defaultSize` from the registry, not a minimal size:

```jsx
const handleAddWidget = (widgetDef) => {
  const maxY = layouts.lg?.reduce((max, item) => Math.max(max, item.y + item.h), 0) || 0;

  const newLayoutItem = {
    i: widgetDef.id,
    x: 0,
    y: maxY + 2,  // Add some gap below existing content
    w: widgetDef.defaultSize.w,   // Use the FULL default width
    h: widgetDef.defaultSize.h,   // Use the FULL default height
    minW: widgetDef.minSize.w,
    minH: widgetDef.minSize.h,
  };
  // ... rest of add logic
};
```

### Step 2.3: Bump up default sizes for small widgets

Read through the registry and ensure no widget has a `defaultSize` smaller than `{ w: 6, h: 4 }` (which is 25% width × 80px height). Any widget currently defaulting smaller than that should be increased.

Specific minimums:
- Any card widget: at least `{ w: 8, h: 6 }` (33% width, 120px)
- Hero cards: at least `{ w: 14, h: 10 }` (58% width, 200px)
- Full-width widgets (welcome banner, action items): `{ w: 24, h: 4 }` minimum
- Spacers can stay small: `{ w: 2, h: 2 }`

### Step 2.4: Verify — adding a widget from the library places it at a usable size, not a tiny pill.

**Commit:** `git add -A && git commit -m "phase 2: widgets add at full default size, bumped minimums"`

---

## PHASE 3: Journey Widgets for Every Role

### Step 3.1: Parent Season Onboarding Journey

Create: `src/components/parent/ParentJourneyCard.jsx`

A step tracker for parents at the start of a season:

**Steps:**
1. Register child(ren) for the season
2. Sign waivers
3. Complete payment (or set up payment plan)
4. Submit emergency contact info
5. RSVP to first event
6. Join team chat
7. Review schedule

**Visual:**
- Card header: "SEASON ONBOARDING" with a progress count (e.g. "4/7 complete")
- Numbered step circles in a horizontal row (like the coach game day journey)
- Completed steps: green filled circles with checkmark
- Current/next step: sky blue filled, pulsing subtly
- Incomplete steps: gray outline
- Below the step row: "Next: Sign waivers" with a "Handle >" button that navigates to the right page
- When all 7 steps are complete: card shows celebration message and then stops rendering (progressive disclosure)

**Data:** Check against actual database state:
- Step 1: any active registration for this season?
- Step 2: waiver_signatures table — signed for all registered children?
- Step 3: payments table — all invoices paid or payment plan active?
- Step 4: profiles table — emergency_contact fields filled?
- Step 5: event_rsvps table — RSVP for at least one event?
- Step 6: chat_messages table — parent sent at least one message?
- Step 7: implied complete if other steps done

Register in widget registry:
```js
{
  id: 'parent-journey',
  label: 'Season Onboarding',
  description: 'Parent onboarding steps — register, pay, sign waivers, RSVP, join chat',
  category: WIDGET_CATEGORIES.PARENT,
  roles: ['parent'],
  defaultSize: { w: 24, h: 5 },
  minSize: { w: 8, h: 3 },
  componentKey: 'ParentJourneyCard',
  icon: '🗺️',
},
```

### Step 3.2: Coach Season Prep Journey

Create: `src/components/coach/CoachSeasonJourneyCard.jsx`

This is DIFFERENT from the Game Day Journey (which tracks game-day tasks). This tracks season-level prep:

**Steps:**
1. Review assigned roster
2. Complete player evaluations
3. Set all positions
4. Assign jersey numbers / order uniforms
5. Introduce yourself in team chat
6. Build first game lineup
7. Create a practice plan
8. Review and confirm schedule

**Visual:** Same step-tracker pattern as parent journey. Shows next step + "Handle >" button.

**Data:** Check against real database state per step.

Register:
```js
{
  id: 'coach-season-journey',
  label: 'Season Prep',
  description: 'Coach season preparation — roster, evals, positions, uniforms, lineup, schedule',
  category: WIDGET_CATEGORIES.COACH,
  roles: ['coach'],
  defaultSize: { w: 24, h: 5 },
  minSize: { w: 8, h: 3 },
  componentKey: 'CoachSeasonJourneyCard',
  icon: '🗺️',
},
```

### Step 3.3: Verify both journey cards render with real step completion data. "Handle >" navigates to the correct page for each step.

**Commit:** `git add -A && git commit -m "phase 3: journey widgets — parent onboarding + coach season prep"`

---

## PHASE 4: Season/Player Switching for Parents and Coaches

### Step 4.1: Parent — Child Switcher

Parents with multiple children need to switch which child's data they're viewing.

Read the current parent dashboard:
```bash
cat src/pages/roles/ParentDashboard.jsx
```

Check if a child switcher already exists (the athlete cards may serve this purpose — clicking one selects it). If so, verify:
- Clicking an athlete card sets a `selectedChildId` state
- ALL cards below update to show that child's data
- The selected card gets a visual indicator (blue border, checkmark)

If the child switcher doesn't exist, create a persistent bar above the dashboard grid:

```jsx
// Above DashboardGrid, not inside it (not a widget — fixed UI)
{children.length > 1 && (
  <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
    {children.map(child => (
      <button
        key={child.id}
        onClick={() => setSelectedChildId(child.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all whitespace-nowrap ${
          selectedChildId === child.id
            ? 'border-lynx-sky bg-lynx-sky/10 text-lynx-sky font-bold'
            : 'border-slate-200 text-slate-500 hover:border-slate-300'
        }`}
      >
        <span className="font-bold">{child.first_name}</span>
        <span className="text-r-xs text-slate-400">{child.team_name}</span>
      </button>
    ))}
  </div>
)}
```

**Pass `selectedChildId` through `sharedProps`** so every widget filters to that child.

Single-child parents: no switcher renders (progressive disclosure).

### Step 4.2: Parent — Season Switcher

If the parent has children across multiple seasons, add a season filter dropdown above the child switcher:

```jsx
{availableSeasons.length > 1 && (
  <select
    value={selectedSeasonId}
    onChange={e => setSelectedSeasonId(e.target.value)}
    className="mb-3 px-3 py-2 rounded-lg border border-slate-200 text-r-sm"
  >
    {availableSeasons.map(s => (
      <option key={s.id} value={s.id}>{s.name}</option>
    ))}
  </select>
)}
```

Changing the season filters which children are shown (only those registered for that season) and which events/payments are displayed.

### Step 4.3: Coach — Team/Season Switcher

Coaches may coach multiple teams across multiple seasons/sports.

Read the coach dashboard to find existing selectors:
```bash
grep -r "team.*selector\|season.*selector\|TeamSelect\|SeasonSelect" src/ --include="*.jsx" -l
```

The switcher should be a row of dropdowns/pills above the grid (not a widget):

```jsx
<div className="flex gap-3 mb-4 items-center">
  {coachSeasons.length > 1 && (
    <select value={selectedSeasonId} onChange={...} className="...">
      {coachSeasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  )}
  {coachTeams.length > 1 && (
    <div className="flex gap-2">
      {coachTeams
        .filter(t => !selectedSeasonId || t.season_id === selectedSeasonId)
        .map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={`px-4 py-2 rounded-xl border-2 ... ${
              selectedTeamId === team.id ? 'active styles' : 'inactive styles'
            }`}
          >
            {team.name}
          </button>
        ))}
    </div>
  )}
</div>
```

**Critical:** The query for `coachTeams` must filter by `coach_id = currentUser.id`. Coaches NEVER see teams they don't coach.

**Pass `selectedTeamId` and `selectedSeasonId` through `sharedProps`** so every widget filters accordingly.

Single-team, single-season coaches: no switcher renders.

### Step 4.4: Verify

Test as Parent with multiple children:
- Child switcher shows all children
- Clicking a child updates all dashboard cards
- Season switcher filters children and data by season

Test as Coach with multiple teams:
- Team switcher shows only their teams
- Season switcher shows only seasons they have teams in
- Selecting a team updates all dashboard cards
- Cannot see other coaches' teams

**Commit:** `git add -A && git commit -m "phase 4: child switcher for parents, team/season switcher for coaches"`

---

## PHASE 5: Wire All Widget Navigation

### Step 5.1: Audit every widget with clickable elements

Go through EVERY widget component and verify that all clickable links/buttons navigate to the correct page:

**Parent widgets:**
- Parent Journey "Handle >" per step:
  - Register → `/registration`
  - Sign waivers → `/waivers` or waiver signing page
  - Payment → `/payments`
  - Emergency contacts → `/profile/emergency` or profile settings
  - RSVP → `/schedule`
  - Join chat → `/chat`
  - Review schedule → `/schedule`
- "Pay Now" buttons → `/payments`
- "RSVP" buttons → appropriate event page or inline RSVP action
- "Directions" → opens Google Maps with venue address (external link)
- "VIEW HUB" → `/team-wall` or team hub page
- "Open Chat" → `/chat`
- Quick Links: View Full Schedule → `/schedule`, Payment History → `/payments`, Team Roster → `/roster`

**Coach widgets:**
- Coach Season Journey "Handle >" per step:
  - Review roster → `/roster`
  - Evaluations → `/roster?mode=evaluate`
  - Set positions → `/roster`
  - Jersey numbers → `/roster`
  - Chat → `/chat`
  - Build lineup → `/gameday` or lineup builder
  - Practice plan → (may not exist yet — show placeholder or navigate to schedule)
  - Schedule → `/schedule`
- "START GAME DAY MODE" → `/gameday`
- "Full Roster >" → `/roster`
- Quick Actions → each to its correct page
- "View Full Schedule" → `/schedule`
- "Create Challenge" → `/challenges` or challenge creation flow

**Player widgets:**
- "I'M READY" → RSVP action for next event
- "Team Chat" → `/chat`
- Badge clicks → achievement detail modal or page

**Admin widgets:**
- Already audited in CC-GLOBAL-FIXES, but double-check

### Step 5.2: Fix any broken navigation found.

**Commit:** `git add -A && git commit -m "phase 5: all widget navigation verified and wired correctly"`

---

## PHASE 6: Parity Check

```bash
npx tsc --noEmit
npm run build
```

Test all roles:
- Widget library shows role badges on every widget
- Categories organized by role (current role first, then shared, then others)
- Adding a widget places it at full default size, not tiny
- Parent journey tracks real onboarding steps
- Coach season journey tracks real prep steps
- Parent child switcher works (multi-child families)
- Coach team/season switcher works (multi-team coaches)
- All widget buttons navigate to correct pages
- No console errors

**Commit:** `git add -A && git commit -m "phase 6: widget UX parity check — all roles verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive | Backup files |
| 1 | Role badges + categories | Colored role pills on every widget, role-first category sorting |
| 2 | Widget add sizing | Full default size on add, bumped minimums |
| 3 | Journey widgets | Parent onboarding journey, Coach season prep journey |
| 4 | Switchers | Child switcher (parent), Team/season switcher (coach) |
| 5 | Navigation wiring | All widget buttons verified and fixed |
| 6 | Parity check | All roles tested |

**Total phases:** 7 (0–6)

---

## NOTES FOR CC

- **Role badge pills are tiny (9px uppercase)** — they sit inline next to the widget label in the library panel. Colors: Admin=blue, Coach=green, Parent=amber, Player=purple.
- **Category ordering puts the CURRENT role first.** If you're on the admin dashboard, admin widgets show at top. If on coach, coach widgets show first.
- **Journey widgets check REAL database state** for each step. Don't fake completion — query the actual tables (registrations, waiver_signatures, payments, profiles, event_rsvps, chat_messages, etc.)
- **Switchers are NOT widgets.** They're fixed UI controls above the DashboardGrid that filter everything below. They don't appear in the widget library.
- **Progressive disclosure on switchers:** If a parent has 1 child, no child switcher. If a coach has 1 team in 1 season, no switcher. Only render when there are multiple options.
- **Coach team query MUST filter by coach_id.** This is a security requirement, not just UX.
