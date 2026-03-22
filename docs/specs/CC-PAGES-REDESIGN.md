# CC-PAGES-REDESIGN — Inner Pages Visual Redesign (Admin, Coach, Parent)

**Spec Author:** Claude Opus 4.6
**Date:** March 4, 2026
**Branch:** `feat/desktop-dashboard-redesign` (continue on existing branch)
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-WEB-DASHBOARD-OVERHAUL (completed), CC-SIDEBAR-NAV-FULLWIDTH (completed)

---

## CONTEXT

The Lynx web admin has new dashboards (admin + coach) and a new sidebar navigation. The dashboards look good but the **inner pages** — Teams, Payments, Registrations, Roster, Schedule, Game Day, and all Parent pages — are still on the old visual style. They need to match the new dashboard design language: stat rows, filter bars, status chips, health bars, full-width layout, Tele-Grotesk typography, Lynx color tokens.

Additionally:
- The **Coach Dashboard layout** needs tweaking — the Game Day Hero card is too wide (should be ~55% width, not full-width), with Notifications and Squad cards stacked to its right, and the Game Day Journey card below the hero.
- The **Sidebar** needs two refinements — nav category groups collapsed by default (expand on click, bold titles), and profile/role-switcher pill buttons moved to the top.
- The **Parent Dashboard** needs a full redesign matching the admin/coach energy, with sidebar + full-width treatment.
- The **Game Day Command Center** and related game-day UI should use dark theme styling.

### Reference Documents (already read by CC)
- `admin-pages-mockup.html` — Admin: Teams, Payments, Registrations visual reference
- `coach-pages-mockup.html` — Coach: Roster, Schedule, Game Day visual reference
- `LYNX-UX-PHILOSOPHY.md` — Cross-platform experience guide
- Coach dashboard reference screenshot (tablet mockup with Next Match hero left, Notifications + Squad right, Game Day Journey below)

---

## RULES (non-negotiable for every phase)

1. **Read every file before modifying it** — no assumptions about file contents
2. **Archive before replace** — copy any file being fully replaced to `src/_archive/` with timestamp suffix before overwriting
3. **Never delete files** — only add or modify
4. **Preserve all Supabase data fetching** — extract existing queries and reuse them; never remove data logic
5. **Schema-first** — check `supabase/schema.sql` or infer from existing queries before touching data logic
6. **No file over 500 lines** — if a file exceeds 500 lines after changes, split into sub-components
7. **Web admin mockups as source of truth for visual design** — existing codebase as source of truth for data/auth
8. **Commit after each phase** with descriptive message
9. **TSC verify** (`npx tsc --noEmit`) after each phase — fix all errors before committing
10. **Test all four roles** render without console errors after each phase
11. **Tailwind only** — use existing Lynx color tokens from `tailwind.config.js` (`lynx-navy`, `lynx-sky`, `lynx-gold`). No hardcoded hex colors. No inline styles except for truly dynamic values (percentages, calculated widths).
12. **One CC session at a time** on the same repo
13. **Do not remove existing card components or features** — tweak layout, sizing, and arrangement. Add new components as needed. Do not delete content that exists in cards.
14. **SchedulePage.jsx stays as one shared file** — use `roleContext` prop for role-based visibility. Only split if it exceeds 500 lines after changes.

---

## DESIGN SYSTEM REFERENCE

These patterns are established in the dashboard components. All pages must match:

### Page Shell
```jsx
<div className="w-full px-6 py-6">
  <PageHeader title="" subtitle="" actions={[]} />
  <StatRow cards={[...]} />
  <MainContent />
</div>
```
No `max-w-*` on page containers. No `mx-auto`. Content is left-aligned, full-width.

### Stat Row
- 4 cards (3 for parent-facing pages)
- Big number: `text-[32px] font-extrabold`
- Label: `text-[11px] font-bold uppercase tracking-wider text-slate-400`
- Sub-text: `text-xs text-slate-500`
- Optional pill badge inline with sub-text

### Filter Bar
- Background: `bg-slate-50`
- Lives inside the card, above the table
- Contains: search input + filter chips + action buttons
- Search input: `rounded-lg border border-slate-200` with search icon left-positioned

### Tables
- Header: `bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400`
- Rows: `border-b border-slate-100` (no outer border on rows)
- Hover: `hover:bg-slate-50`
- Last row: no bottom border

### Status Chips
- Small pill shape, always color-coded:
  - Good/Paid/Signed: `bg-emerald-500/12 text-emerald-500`
  - Warning/Partial/Pending: `bg-amber-500/12 text-amber-500`
  - Critical/Overdue/Unpaid: `bg-red-500/12 text-red-500`
  - Active/Info: `bg-lynx-sky/15 text-lynx-sky`

### Cards
- `bg-white rounded-[14px] border border-slate-200`
- Card header: `px-5 py-4 border-b border-slate-200` with uppercase title

### Action Buttons
- Ghost: `bg-white border border-slate-200 text-slate-500 hover:border-lynx-sky hover:text-lynx-sky`
- Primary: `bg-lynx-sky text-lynx-navy font-bold`
- Danger: `bg-red-500/10 text-red-500 border border-red-500/20`
- 3-dot overflow: `w-[30px] h-[30px] rounded-lg border border-slate-200`

### XP/Power Bars (for eval scores)
- `h-[5px] rounded-full bg-slate-200` track
- Fill color by tier: sky-to-gold gradient (excellent), solid sky (good), teal (average), gray (below average)
- Never plain numbers alone. Never radar charts.

### Typography
- Font: Tele-Grotesk (already installed in `/public/fonts/`)
- Big numbers: `font-extrabold` (weight 800)
- Labels: `font-bold` (weight 700)
- Section labels: `text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500`

---

## PHASE 0: Archive Snapshot

**Goal:** Back up every file that will be modified in this spec.

```bash
# Create timestamped archive directory
mkdir -p src/_archive/pages-redesign-$(date +%Y%m%d)

# Archive all target files
cp src/pages/teams/TeamsPage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/TeamsPage.jsx
cp src/pages/payments/PaymentsPage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/PaymentsPage.jsx
cp src/pages/registrations/RegistrationsPage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/RegistrationsPage.jsx
cp src/pages/roster/RosterManagerPage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/RosterManagerPage.jsx
cp src/pages/schedule/SchedulePage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/SchedulePage.jsx
cp src/pages/gameprep/GameDayCommandCenter.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/GameDayCommandCenter.jsx
cp src/pages/parent/PlayerProfilePage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/PlayerProfilePage.jsx
cp src/pages/teams/TeamWallPage.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/TeamWallPage.jsx
cp src/pages/roles/ParentDashboard.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/ParentDashboard.jsx
cp src/components/layout/LynxSidebar.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/LynxSidebar.jsx

# Archive coach dashboard layout files
cp src/components/coach/CoachGameDayHeroV2.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/CoachGameDayHeroV2.jsx
cp src/components/coach/CoachNotificationsCard.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/CoachNotificationsCard.jsx
cp src/components/coach/CoachRosterCard.jsx src/_archive/pages-redesign-$(date +%Y%m%d)/CoachRosterCard.jsx

# Also archive any coach dashboard parent that orchestrates layout
# Read the file first to find which component renders the coach dashboard grid
```

**Verification:** `ls -la src/_archive/pages-redesign-*/` confirms all files backed up.

**Commit:** `git add -A && git commit -m "phase 0: archive snapshot for pages-redesign spec"`

---

## PHASE 1: Sidebar Refinements

**Goal:** Two changes to `LynxSidebar.jsx`:
1. Profile avatar + role switcher pill buttons move to the TOP of the sidebar (above nav groups)
2. Nav category groups are collapsed by default, expand on click, with bold category titles

### Step 1.1: Read the sidebar
```bash
cat src/components/layout/LynxSidebar.jsx
```
Understand the current structure: where nav groups are rendered, where the profile/avatar lives, how role switching works, how the expanded/collapsed states work.

### Step 1.2: Move profile + role switcher to top

Currently the profile avatar is at the bottom of the sidebar. Move it to the top, immediately below the Lynx logo.

**Profile section (top of sidebar, below logo):**
- User avatar (existing component — just move it)
- Below avatar: role switcher as horizontal pill buttons
- Pill button styling: `px-3 py-1 rounded-full text-[11px] font-bold` — active pill gets `bg-lynx-sky/15 text-lynx-sky`, inactive gets `text-slate-500 hover:text-slate-300`
- If sidebar is collapsed (64px), show only the avatar; pills hide. If expanded (228px), show avatar + name + pills.
- A thin divider (`border-b border-white/8`) separates profile section from nav groups below

### Step 1.3: Collapsible nav category groups

Read the existing nav group structure. Each group has a category label and child nav items.

**Behavior:**
- Each category title is rendered as a clickable row: bold text (`font-bold text-[11px] uppercase tracking-wider`), with a chevron icon on the right that rotates 90° when expanded
- Default state on mount: ALL groups collapsed (children hidden)
- The group containing the currently active route should auto-expand on mount
- Use local React state (`useState` with an object or Set tracking which groups are open)
- When sidebar is collapsed (64px mode), categories are not shown — only individual nav icons remain visible as they are now
- Smooth height transition: `transition-all duration-200 ease-in-out` with `overflow-hidden` and dynamic `max-height`

### Step 1.4: Verify
```bash
npx tsc --noEmit
```
Test: Load each role (Admin, Coach, Parent, Player). Confirm:
- Profile avatar + role pills visible at top of sidebar
- Role switching works from the pill buttons
- Nav groups collapsed by default, expand on click
- Active route's group auto-expands
- Collapsed sidebar (64px) still works — icons only, no broken layout

**Commit:** `git add -A && git commit -m "phase 1: sidebar — profile/role-switcher to top, collapsible nav groups"`

---

## PHASE 2: Coach Dashboard Layout Tweak

**Goal:** Rearrange the existing coach dashboard cards to match the reference screenshot layout. Do NOT rebuild components — only change their arrangement and sizing.

### Reference Layout (from screenshot):
```
┌──────────────────────────────┬──────────────────────┐
│  Game Day Hero (~55% width)  │  Notifications Card  │
│  - Next Match info           │  (with Lynx cub)     │
│  - Live badge / countdown    ├──────────────────────┤
│  - Court info, quick stats   │  Squad Card          │
│                              │  (player list, 1-20  │
│                              │   rows, auto-sizes)  │
├──────────────────────────────┤                      │
│  Game Day Journey Card       │                      │
│  (numbered step tracker,     │                      │
│   clickable steps, no bg)    │                      │
└──────────────────────────────┴──────────────────────┘
│  Remaining cards below in existing order             │
│  (CoachStatsCard, CoachToolsCard, etc.)              │
└──────────────────────────────────────────────────────┘
```

### Step 2.1: Read the coach dashboard layout file
```bash
# Find which file orchestrates the coach dashboard layout
grep -r "CoachGameDayHero" src/ --include="*.jsx" -l
grep -r "CoachNotificationsCard" src/ --include="*.jsx" -l
grep -r "CoachRosterCard" src/ --include="*.jsx" -l
```
Read the parent file that renders these cards together. Understand the current grid/flex layout.

### Step 2.2: Restructure the top section

Change the top of the coach dashboard to a CSS Grid layout:

```
grid-template-columns: 55% 1fr
grid-template-rows: auto auto
```

- **Top-left (col 1, row 1):** `CoachGameDayHeroV2` — constrain width to the first column. The hero should NOT span full width anymore.
- **Top-right (col 2, row 1):** `CoachNotificationsCard` — stacks into the right column
- **Bottom-left (col 1, row 2):** Game Day Journey card (see Step 2.3)
- **Right column (col 2, row 1–2):** `CoachRosterCard` (the Squad card) — spans both rows of the right column using `row-span-2`, auto-sizes height based on player count

The Squad card (`CoachRosterCard`) must:
- Show player rows in list format (photo, name, status dot)
- Dynamically resize: minimum height for 1 player, grows up to 20 player rows
- No fixed height — uses `min-h-fit` and grows naturally
- If more than ~12 players visible, the card body scrolls internally with `max-h-[600px] overflow-y-auto`

### Step 2.3: Game Day Journey card

Read the existing `SeasonJourneyRow.jsx` for reference on the step-tracker visual pattern.

Create a new component: `src/components/coach/GameDayJourneyCard.jsx`

**Visual:**
- Card with no colored background (white card, standard border)
- Title: "Game Day Journey" with subtitle "A dynamic journey progress tracker"
- 6 numbered steps in a horizontal row: `1 History` → `2 Progress Journey` → `3 Attendance` → `4 Progress Tracker` → `5 Steps` → `6 Report`
- Each step is a numbered circle with a label below
- Step circles: `w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold`
  - Completed: `bg-lynx-sky/15 border-lynx-sky text-lynx-sky`
  - Current: `bg-lynx-sky text-white border-lynx-sky` (filled)
  - Upcoming: `border-slate-300 text-slate-400`
- Connecting lines between circles: `h-[2px]` — completed sections are `bg-lynx-sky`, upcoming are `bg-slate-200`
- **Each step is clickable** — clicking a step navigates to the corresponding game-day sub-view (RSVP check, lineup builder, attendance, score entry, stats, post-game report)
- The click handler should call a prop function: `onStepClick(stepIndex)` — the parent dashboard wires this to navigate or scroll to the relevant section

**Step labels should map to actual game-day workflow phases.** Read the existing `GameDayCommandCenter.jsx` to identify the actual phases used there, and use those same labels. The 6 steps in the reference image are placeholder names — use the real workflow step names from the codebase.

### Step 2.4: Wire it all together

In the coach dashboard layout file:
- Import `GameDayJourneyCard`
- Restructure the top grid as described
- All other cards below the top grid remain in their current order — do not move or remove them
- The `onStepClick` handler for the journey card should navigate to `/gameday` or the appropriate route

### Step 2.5: Verify
```bash
npx tsc --noEmit
```
Test coach dashboard:
- Hero card is ~55% width, not full-bleed
- Notifications card is top-right
- Squad card is below notifications, right column, auto-sizing
- Game Day Journey is below hero, left column
- All existing cards below are unchanged
- No console errors
- Responsive: on smaller screens, stack to single column

**Commit:** `git add -A && git commit -m "phase 2: coach dashboard layout — hero 55%, notifications+squad right, journey below hero"`

---

## PHASE 3: Admin Pages — Teams & Roster

**Goal:** Redesign `TeamsPage.jsx` to match `admin-pages-mockup.html` visual style.

### Step 3.1: Read the existing file
```bash
cat src/pages/teams/TeamsPage.jsx
wc -l src/pages/teams/TeamsPage.jsx
```
This file is ~1292 lines. It has 3 view modes (list, cards, compact) and an unrostered players panel. Map out:
- All Supabase queries (preserve every one)
- State management (filters, view modes, search)
- Conditional rendering logic (admin vs coach views)
- Any modals or drawers

### Step 3.2: Plan the split

If the file is over 500 lines, it must be split. Likely sub-components:
- `src/pages/teams/TeamsStatRow.jsx` — 4 stat cards (Total Teams, Rostered Players, Open Spots, Avg Team Health)
- `src/pages/teams/TeamsTableView.jsx` — filter bar + table with health bars, avatar groups, status chips
- `src/pages/teams/TeamsCardView.jsx` — card grid view (preserve existing)
- `src/pages/teams/TeamsCompactView.jsx` — compact list view (preserve existing)
- `src/pages/teams/UnrosteredAlert.jsx` — amber-bordered alert card with unrostered player(s)
- `TeamsPage.jsx` stays as the orchestrator: page header, stat row, view toggle, renders active view, unrostered alert

### Step 3.3: Build the stat row

`TeamsStatRow.jsx`:
- 4 cards in a `grid grid-cols-4 gap-3`
- **Total Teams:** big number = team count, sub = "Across N sports"
- **Rostered Players:** big number = rostered count, sub = "of {total} registered", amber pill if any unrostered
- **Open Spots:** big number = total max roster minus total rostered, sub = "Across all teams"
- **Avg Team Health:** big number colored by threshold (green ≥ 75, amber ≥ 40, red < 40), sub = status pill

Data: derive all values from existing Supabase queries already in TeamsPage. Extract the query logic into the parent and pass computed values as props.

### Step 3.4: Redesign the table view

`TeamsTableView.jsx`:
- Wrapped in a card (`bg-white rounded-[14px] border border-slate-200`)
- Filter bar at top: search input + sport filter chips (All Sports, then one chip per sport found in data) + view mode toggle buttons (List/Cards/Compact) right-aligned
- Table columns: Team (color dot + bold name), Sport (colored pill — Volleyball=sky, Basketball=amber, Soccer=green), Coach, Roster (avatar group with overflow +N), Record (bold W-L), Health (thin 6px bar with percentage), Status (chip), Wall (sky link "View →"), Actions (3-dot button)
- Health bar colors: green ≥ 75%, amber ≥ 40%, red < 40%
- Table styling per design system (see above)

### Step 3.5: Unrostered alert card

`UnrosteredAlert.jsx`:
- Only renders when unrostered players exist (progressive disclosure)
- Card with `border-l-[3px] border-amber-500`
- Header: warning icon + "{N} Player(s) Unrostered" in amber + "Assign to Team" ghost button
- Body: list of unrostered players with avatar, name, registration info, and primary "Assign" button per player

### Step 3.6: Wire it all in TeamsPage.jsx

- Remove old inline JSX that's been extracted to sub-components
- Page shell: `<div className="w-full px-6 py-6">`
- Page header with title "Teams & Roster", subtitle with season + team count + player count, Export + New Team buttons
- `<TeamsStatRow>` below header
- Card containing filter bar + active view (table/cards/compact)
- `<UnrosteredAlert>` below the main card (conditional)
- All Supabase data fetching stays in TeamsPage and passes data down as props
- All existing functionality preserved: create team modal, edit team, roster assignment, view mode toggle

### Step 3.7: Verify
```bash
npx tsc --noEmit
```
Test as Admin:
- Stat row renders with real data
- Teams table shows all teams with health bars, avatars, status chips
- Filter by sport works
- Search works
- All 3 view modes work
- Unrostered alert shows/hides based on data
- No console errors
- New Team button and team management still work

**Commit:** `git add -A && git commit -m "phase 3: TeamsPage redesign — stat row, health bars, avatar groups, unrostered alert"`

---

## PHASE 4: Admin Pages — Payments

**Goal:** Redesign `PaymentsPage.jsx` to match `admin-pages-mockup.html` Payments tab.

### Step 4.1: Read the existing file
```bash
cat src/pages/payments/PaymentsPage.jsx
wc -l src/pages/payments/PaymentsPage.jsx
```
This is ~1368 lines with two view modes: family view and individual view. Map out:
- Supabase queries for payment data
- Family grouping logic
- Individual payment list
- Overdue blast functionality
- Any modals (record payment, send reminder, payment details)

### Step 4.2: Plan the split

Likely sub-components:
- `src/pages/payments/PaymentsStatRow.jsx` — 4 stat cards
- `src/pages/payments/FamilyPaymentList.jsx` — family-grouped payment rows
- `src/pages/payments/IndividualPaymentList.jsx` — individual invoice table
- `src/pages/payments/FamilyPaymentRow.jsx` — single family row with status, amount, progress
- `PaymentsPage.jsx` orchestrates

### Step 4.3: Build stat row

`PaymentsStatRow.jsx`:
- **Total Collected:** big number in green, sub = "of ${billed} billed", progress bar showing collection percentage
- **Outstanding:** big number in red, sub = amber pill with overdue invoice count
- **Families Overdue:** big number in amber, sub = "of {total} total families"
- **Collection Rate:** big number (percentage), pill colored by threshold

### Step 4.4: Family payment list

`FamilyPaymentList.jsx`:
- Inside a card with filter bar: search + filter chips (All, Overdue, Partial, Paid) + "Blast All Overdue" danger button right-aligned
- Each family is a row: family avatar (gradient, first letter), family name (bold), player names + team (smaller text), status chip, amount owed (big, colored — red for overdue, amber for partial, green for paid), payment sub-text ("$X paid · N invoices" or "All invoices paid"), Details ghost button
- Rows are `FamilyPaymentRow` components
- Clicking "Details" expands an inline detail panel (or opens the existing detail modal — preserve whichever pattern exists)

### Step 4.5: Admin vs Parent view

`PaymentsPage.jsx` already handles role-based rendering. Preserve this:
- **Admin view:** sees all families, overdue blast button, record payment button, full financial overview
- **Parent view:** sees only their own family, no admin controls, no other family data visible
- The parent view is addressed in Phase 9, but the role-conditional logic must not break during this phase

### Step 4.6: Wire and verify
```bash
npx tsc --noEmit
```
Test as Admin:
- Stat row with real financial data
- Family list renders with correct status chips and amounts
- Filters work (All, Overdue, Partial, Paid)
- Search works
- Overdue blast button present and functional
- Record payment still works
- No console errors

Test as Parent:
- Only own family visible
- No admin controls
- Payment amounts correct

**Commit:** `git add -A && git commit -m "phase 4: PaymentsPage redesign — stat row, family list, status chips, filter bar"`

---

## PHASE 5: Admin Pages — Registrations

**Goal:** Redesign `RegistrationsPage.jsx` to match `admin-pages-mockup.html` Registrations tab.

### Step 5.1: Read the existing file
```bash
cat src/pages/registrations/RegistrationsPage.jsx
wc -l src/pages/registrations/RegistrationsPage.jsx
```
This is ~1583 lines. It has a pending approval workflow and status filters. Map out queries and modals.

### Step 5.2: Plan the split

- `src/pages/registrations/RegistrationsStatRow.jsx` — 4 stat cards
- `src/pages/registrations/RegistrationsTable.jsx` — filter bar + table
- `src/pages/registrations/RegistrationRow.jsx` — single player row (or keep inline if simple enough)
- `RegistrationsPage.jsx` orchestrates

### Step 5.3: Build stat row

`RegistrationsStatRow.jsx`:
- **Total Registered:** big number, sub = "This season"
- **Pending Approval:** big number in amber (if > 0), amber pill "Needs review"
- **Waivers Signed:** big number in green, sub = "X% complete"
- **Returning Players:** big number, sub = "N new this season"

### Step 5.4: Registrations table

`RegistrationsTable.jsx`:
- Card with filter bar: search + filter chips (All, Pending with red notification dot, Approved, Rostered)
- Table columns: Player (avatar + name + jersey/position/grade meta), Team (bold or "Unassigned" in muted), Waiver (chip: Signed=green, Unsigned=red), Payment (chip: Paid=green, Partial=amber, Unpaid=red), Status (chip: Rostered=sky, Approved=green, Pending=amber), Actions
- **Pending rows get amber background highlight:** `bg-amber-50` on the entire row
- Pending rows have inline Approve (primary) and Deny (danger) buttons in the actions column
- Non-pending rows have a 3-dot overflow menu
- Export CSV and Add Player buttons in page header

### Step 5.5: Wire and verify
```bash
npx tsc --noEmit
```
Test as Admin:
- Stat row with real data
- Pending registrations highlighted in amber
- Approve/Deny buttons work
- Filter chips filter correctly
- Search works
- Export CSV works
- No console errors

**Commit:** `git add -A && git commit -m "phase 5: RegistrationsPage redesign — stat row, pending highlights, inline approve/deny"`

---

## PHASE 6: Coach Pages — Roster Manager

**Goal:** Redesign `RosterManagerPage.jsx` to match `coach-pages-mockup.html` Roster tab.

### Step 6.1: Read the existing file
```bash
cat src/pages/roster/RosterManagerPage.jsx
wc -l src/pages/roster/RosterManagerPage.jsx
```
~1224 lines. Has evaluate mode and setup mode. Map out all sub-views and modals.

### Step 6.2: Plan the split

- `src/pages/roster/RosterStatRow.jsx` — 4 stat cards
- `src/pages/roster/RosterTable.jsx` — filter bar + player table
- `src/pages/roster/RosterPlayerRow.jsx` — single player row with jersey, position badge, eval bar
- `src/pages/roster/RosterEvalMode.jsx` — inline evaluation form (preserve existing)
- `RosterManagerPage.jsx` orchestrates, team selector dropdown at top

### Step 6.3: Build stat row

`RosterStatRow.jsx`:
- **Roster Size:** big number, sub = "of {max} max"
- **Waivers Signed:** big number in green, sub = "X% complete"
- **RSVP'd Today:** big number in sky, sub = "N no response" (only shows if there's an event today; otherwise this card shows next event RSVP status)
- **Evaluations Due:** big number in amber, sub = "Due this week"

### Step 6.4: Roster table

`RosterTable.jsx`:
- Card with filter bar: search + position filter chips (All, OH, S, MB, L/DS — derived from positions in data) + "Sort by Jersey" button right-aligned
- Table columns:
  - **# (Jersey):** `text-[22px] font-extrabold text-slate-400 w-8 text-center` — large, prominent jersey number
  - **Player:** photo (40px rounded-lg) + name (bold) + email/subtitle
  - **Position:** color-coded badge — OH=sky, S=gold, MB=green, L=purple, DS=red, RS=amber. Badge is `w-7 h-7 rounded-md text-[11px] font-extrabold` with tinted background
  - **Grade:** muted text
  - **Waiver:** checkmark chip (green) or missing (red)
  - **Payment:** status chip
  - **Eval:** XP power bar — `h-[5px] rounded-full` with score number next to it. Bar fill colored by tier. If no eval yet, show em-dash in muted text.
  - **RSVP:** status chip (Yes=green, No=red, ?=amber)
  - **Actions:** 3-dot overflow

- **Inline jersey/position editing:** Clicking on jersey number or position badge should trigger the existing inline edit behavior. Preserve whatever modal/popover/inline-edit pattern currently exists.
- Team selector dropdown in the page header (coach may manage multiple teams)

### Step 6.5: Preserve evaluate mode

Read the existing evaluate mode code. It should still be accessible (via "Evaluate All" button in page header). The visual style should get the same card/table treatment, but the actual form fields and save logic must not change.

### Step 6.6: Verify
```bash
npx tsc --noEmit
```
Test as Coach:
- Stat row with real data
- Roster table with jersey numbers, position badges, eval bars
- Position filter chips work
- Inline jersey/position edit works
- Evaluate mode works
- Team selector works (if coach has multiple teams)
- No console errors

**Commit:** `git add -A && git commit -m "phase 6: RosterManagerPage redesign — large jerseys, position badges, eval XP bars"`

---

## PHASE 7: Coach Pages — Schedule (Shared)

**Goal:** Redesign `SchedulePage.jsx` with the new visual style. This is a shared file — Admin, Coach, and Parent all use it via `roleContext`.

### Step 7.1: Read the existing file
```bash
cat src/pages/schedule/SchedulePage.jsx
wc -l src/pages/schedule/SchedulePage.jsx
```
~900 lines. Has month/week/day/list views. Map out role-conditional logic.

### Step 7.2: Plan the approach

Keep it as one file. If it exceeds 500 lines, extract:
- `src/pages/schedule/ScheduleStatRow.jsx`
- `src/pages/schedule/ScheduleListView.jsx`
- `src/pages/schedule/ScheduleEventRow.jsx`
Month/week views are preserved but NOT redesigned in this spec (future scope).

### Step 7.3: Build stat row

`ScheduleStatRow.jsx` — role-aware:
- **Coach/Admin:**
  - Season Record: W-L (green/red colored), sub = "X% win rate"
  - Next Event: "TODAY" in sky (or date), sub = opponent + time
  - This Month: count, sub = "N games · N practices"
  - Avg Attendance: percentage in green, sub = "X of Y per event"
- **Parent (3 cards):**
  - Next Event: "TODAY" or date, sub = event name + time
  - This Month: count
  - My RSVPs: "N of M responded"

### Step 7.4: List view redesign

**List view is the default for all roles.**

Structure inside a card:
- **TODAY section** (conditional — only if there's an event today):
  - Highlighted header: `bg-lynx-sky/6 border-b-2 border-lynx-sky` with "● TODAY — {day name}, {date}" in sky, bold, uppercase
  - Today's events render with light sky background tint `bg-lynx-sky/[0.04]`
  - Game events show: date block (month small + day large), type icon, event title + "GAME DAY" red pill badge, meta (time, location, home/away), RSVP count (right), **"⚡ Open Game Day"** gold button (coach/admin only)
  - Practice events show: date block, type icon, title "Practice", meta, RSVP count, "Manage" ghost button (coach/admin) or nothing (parent)

- **Upcoming section:**
  - Section header: `bg-slate-50 border-y border-slate-200` with "UPCOMING" muted label
  - Event rows same format as today, without the highlight
  - Games show RSVP count + "Send RSVP" button if RSVPs not sent yet

- **Parent-specific:**
  - No "Open Game Day" button
  - No "Send RSVP" / "Manage" buttons
  - Instead: RSVP Yes/No buttons per event (if RSVP is open for that event)
  - Child switcher strip at top of page (only for multi-child parents) — horizontal pills with child names, selecting one filters events to that child's team

- **Admin-specific:**
  - Has + Practice, Bulk Add, + Game buttons in header
  - Can see all teams' events (team filter in filter bar)

### Step 7.5: View toggle

Below the stat row, above the card:
- Horizontal button group: List (active by default, sky background), Month, Week
- List view gets the full redesign described above
- Month and Week views: preserved as-is, no redesign — just ensure they render without errors in the new page shell

### Step 7.6: Verify
```bash
npx tsc --noEmit
```
Test as Coach: list view, today highlight, RSVP counts, Open Game Day button
Test as Admin: team filter, bulk add, all event types
Test as Parent: RSVP buttons, child switcher (if multi-child), no admin controls
Month/week views: still render, not broken

**Commit:** `git add -A && git commit -m "phase 7: SchedulePage redesign — today highlight, event rows, RSVP, role-aware"`

---

## PHASE 8: Coach Pages — Game Day Command Center

**Goal:** Redesign `GameDayCommandCenter.jsx` to match `coach-pages-mockup.html` Game Day tab. This is the big one — 1280 lines, must be split. **Game Day UI uses dark theme.**

### Step 8.1: Read the existing file
```bash
cat src/pages/gameprep/GameDayCommandCenter.jsx
wc -l src/pages/gameprep/GameDayCommandCenter.jsx
```
Map out all sections: hero, lineup builder, score entry, attendance, stats. Identify all state, queries, modals.

### Step 8.2: Split into sub-components

- `src/pages/gameprep/GameDayHero.jsx` — dark navy hero card with matchup, record, form badges, live badge
- `src/pages/gameprep/LineupPanel.jsx` — 6-slot rotation grid, set selector tabs, save button
- `src/pages/gameprep/ScorePanel.jsx` — live score display, set-by-set scores, score entry
- `src/pages/gameprep/AttendancePanel.jsx` — player checklist with Here/Absent/? status
- `src/pages/gameprep/GameDayStats.jsx` — quick stats entry (if exists in current code)
- `GameDayCommandCenter.jsx` stays as the orchestrator

### Step 8.3: Game Day Hero (dark theme)

`GameDayHero.jsx`:
- **Dark card:** `bg-gradient-to-br from-[#0B1628] via-[#122240] to-[#0B1628]` with subtle dot-grid pattern overlay (`radial-gradient` pseudo-element)
- `rounded-2xl p-7 mb-5`
- Two-column flex inside: left info, right record
- **Left side:**
  - Live badge: `bg-red-500/20 border border-red-500/40 text-red-300` with pulsing red dot
  - Team name small: `text-xs text-white/40 uppercase tracking-wider`
  - Matchup title: `text-[32px] font-extrabold text-white`
  - Meta row: date, time, location, Home/Away pill in `bg-lynx-sky/15 text-lynx-sky`
- **Right side:**
  - "Season Record" label small muted
  - Record big: `text-[56px] font-extrabold` — W in green, dash in white/20, L in red
  - Win rate sub-text
  - Form badges row: W = `bg-emerald-500/20 text-emerald-300`, L = `bg-red-500/20 text-red-300`, each `w-[26px] h-[26px] rounded-md text-[11px] font-extrabold`

### Step 8.4: Lineup Panel (dark theme)

`LineupPanel.jsx`:
- Card with header: "Set 1 Lineup" + Set 2/Set 3 ghost buttons + Save primary button
- Info bar below header: "Rotation order — tap a slot to swap player"
- **6-slot grid** (`grid grid-cols-3 gap-2`) on dark navy background:
  - Each slot: `bg-gradient-to-br from-lynx-navy via-[#122240] to-lynx-navy border border-white/8 rounded-xl p-3.5 text-center cursor-pointer hover:border-lynx-sky`
  - Slot shows: position label (sky, small uppercase), player icon, player name (white bold), jersey number (white/40)
  - Empty slots: dashed border, muted, "+" icon
  - Clicking a slot opens existing player picker (preserve whatever modal/dropdown exists)
- Set tabs switch the lineup data — preserve existing set-switching logic

### Step 8.5: Score Panel

`ScorePanel.jsx`:
- Card with header: "Live Score" + "In Progress" red chip
- Center area: 3-column grid — Home team (name + big set count in green), "vs" divider, Away team (name + big set count in red)
- Below: set-by-set score boxes in a horizontal row — completed sets show scores, current/next set highlighted in sky
- "Enter Scores" gold button in page header triggers existing score entry flow

### Step 8.6: Attendance Panel

`AttendancePanel.jsx`:
- Card with header: "Attendance" + "X / Y" count in green
- Player list: each row is avatar (colored by status — green=here, red=absent, amber=unknown) + name + status chip
- Status chips are clickable to toggle (Here → Absent → ? → Here cycle, or whatever the existing pattern is)
- Preserve existing attendance save logic

### Step 8.7: Layout in GameDayCommandCenter.jsx

```
Page header: "Game Day Command Center" + "Black Hornets Elite · {date}" + action buttons
GameDayHero (full width)
Two-column grid:
  Left: LineupPanel
  Right: ScorePanel + AttendancePanel (stacked)
Below: GameDayStats (if exists), any other existing sections
```

### Step 8.8: Verify
```bash
npx tsc --noEmit
```
Test as Coach:
- Hero renders with real game data (or graceful empty state if no game today)
- Lineup grid shows 6 slots with real player data
- Set switching works
- Score display shows real scores
- Attendance list shows real roster with statuses
- All save/update operations work
- Dark theme looks correct — no white-on-white or invisible text
- No console errors

**Commit:** `git add -A && git commit -m "phase 8: GameDayCommandCenter split + redesign — dark theme, lineup grid, score panel, attendance"`

---

## PHASE 9: Parent Pages — Dashboard + Inner Pages

**Goal:** Full parent dashboard redesign + inner page visual updates. The parent dashboard is currently on the old 3-column layout and needs the sidebar + full-width treatment plus the same energy as admin/coach dashboards.

### Step 9.1: Read existing parent files
```bash
cat src/pages/roles/ParentDashboard.jsx
wc -l src/pages/roles/ParentDashboard.jsx
cat src/pages/parent/PlayerProfilePage.jsx
wc -l src/pages/parent/PlayerProfilePage.jsx
cat src/pages/teams/TeamWallPage.jsx
wc -l src/pages/teams/TeamWallPage.jsx
```

### Step 9.2: Parent Dashboard redesign

The parent dashboard should feel warm, encouraging, and child-focused — matching the LYNX-UX-PHILOSOPHY emotional layer.

**Layout:** Full-width, single page shell (`w-full px-6 py-6`), no 3-column layout.

**Sections in priority order (vertical scroll):**

1. **Welcome header** — "Welcome to the Den, {parentName}" with season context subtitle. No stat row for parents — they don't need KPIs.

2. **Child Hero Card(s):**
   - Single child: full-width player trading card aesthetic — photo, name, jersey, team, position, XP bar for overall eval
   - Multiple children: horizontal scroll of player cards, each one clickable to set context for the rest of the page
   - Card style: dark navy gradient background (like the player trading card aesthetic from mobile), rounded-2xl, player photo left, stats right with XP power bars

3. **"You Got Stuff To Do" Action Card** (conditional — progressive disclosure):
   - Only renders when parent has outstanding items: unpaid balances, un-RSVPed events, unsigned waivers, unread coach DMs, missing emergency contacts
   - Amber-tinted card with pulse animation on the badge count
   - List of action items, each tappable/clickable to resolve
   - **If zero items: this card does not exist.** No placeholder. No "All caught up!" message.

4. **Upcoming Events Card:**
   - Next 3 events for the selected child
   - Each event: date block + title + time/location + RSVP button (Yes/No)
   - Game events highlighted differently from practices

5. **Team Hub Preview:**
   - Latest post from team wall (if any)
   - "View Team Hub →" link

6. **Balance Card** (conditional):
   - Only renders if parent owes money (amount > 0)
   - Big red amount owed, progress bar, "Pay Now" button
   - **If balance is zero: card does not exist.** Progressive disclosure.

7. **Player Achievements:**
   - Recent badges/achievements for selected child
   - Rarity tier visuals (Common gray → Rare blue → Epic purple → Legendary gold pulse)

### Step 9.3: Parent Payments view

The parent view of `PaymentsPage.jsx` should already be handled by the Phase 4 role-conditional logic. Verify it works:
- Family balance hero card (big red amount if owed)
- Invoice list for their family only
- Pay button
- Payment history
- No admin controls visible

If the parent view needs additional work beyond what Phase 4 delivered, add it here.

### Step 9.4: Parent Player Profile

`PlayerProfilePage.jsx` (~985 lines) — read and assess. Key updates:
- Page shell: full-width, no max-w
- Player info section: trading card aesthetic with XP power bars for skills
- Achievement/badge section with rarity tier visuals
- Stats displayed as power bars, never plain numbers
- If over 500 lines, split into sub-components

### Step 9.5: Parent Team Wall

`TeamWallPage.jsx` (~1283 lines) — read and assess:
- Page shell: full-width
- Post cards with the new card styling (rounded-[14px], border)
- Photo grids and lightbox should already work (confirmed in repo — router points to teams/ version)
- Shoutout cards styled per new design language
- If over 500 lines, split

### Step 9.6: Verify
```bash
npx tsc --noEmit
```
Test as Parent:
- Dashboard renders with child card(s)
- Multi-child: horizontal scroll, context switching works
- "You Got Stuff To Do" shows only when items exist, disappears when resolved
- Balance card conditional rendering
- Events show RSVP buttons
- Team hub preview works
- Player profile renders with XP bars
- Team wall renders with posts
- No console errors
- No admin data leaking (no other family financial data, no admin controls)

**Commit:** `git add -A && git commit -m "phase 9: parent dashboard full redesign + inner page visual updates"`

---

## PHASE 10: Parity Check + Polish

**Goal:** Final sweep across all four roles. No new features — just consistency, error cleanup, and visual polish.

### Step 10.1: Full role test
```bash
# Start the dev server
npm run dev
```

For each role (Admin, Coach, Parent, Player):
1. Log in and verify dashboard renders
2. Navigate to every page in the sidebar
3. Check for console errors
4. Verify no VolleyBrain references remain in visible UI text (grep for "VolleyBrain", "volleybrain", "Volley Brain" in all .jsx files)
5. Verify sidebar: profile at top, role pills work, nav groups collapse/expand, active group auto-opens
6. Verify no `max-w-*` or `mx-auto` on any page-level container

### Step 10.2: VolleyBrain reference sweep
```bash
grep -ri "volleybrain" src/ --include="*.jsx" --include="*.js" --include="*.tsx" --include="*.ts" -l
grep -ri "volley brain" src/ --include="*.jsx" --include="*.js" -l
```
Replace any found references with "Lynx" in the appropriate context.

### Step 10.3: Visual consistency pass

Check every redesigned page for:
- Stat card numbers are `text-[32px] font-extrabold`
- Labels are `text-[11px] font-bold uppercase tracking-wider`
- Status chips use consistent color coding across all pages
- Filter bars have `bg-slate-50` background
- Table headers match the design system
- Cards use `rounded-[14px]`
- No hardcoded hex colors — all use Tailwind classes or Lynx tokens

### Step 10.4: Responsive spot check

On each redesigned page, resize the browser to:
- 1440px (standard desktop) — should look great
- 1024px (small laptop) — grids should gracefully stack or shrink
- 768px (tablet) — two-column layouts should become single-column

No mobile optimization needed (that's the mobile app's job), but the web shouldn't break at common widths.

### Step 10.5: Console error sweep
```bash
# With dev server running, check for any remaining errors
# Fix any TypeScript errors
npx tsc --noEmit
```

### Step 10.6: Final commit
```bash
git add -A && git commit -m "phase 10: parity check — all roles tested, VolleyBrain refs removed, visual consistency verified"
```

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Files Modified/Created |
|-------|-------|----------------------|
| 0 | Archive snapshot | `src/_archive/pages-redesign-*` |
| 1 | Sidebar refinements | `LynxSidebar.jsx` |
| 2 | Coach dashboard layout tweak | Coach dashboard layout file, new `GameDayJourneyCard.jsx` |
| 3 | Admin: Teams page | `TeamsPage.jsx` → split into `TeamsStatRow`, `TeamsTableView`, `UnrosteredAlert` |
| 4 | Admin: Payments page | `PaymentsPage.jsx` → split into `PaymentsStatRow`, `FamilyPaymentList`, `FamilyPaymentRow` |
| 5 | Admin: Registrations page | `RegistrationsPage.jsx` → split into `RegistrationsStatRow`, `RegistrationsTable` |
| 6 | Coach: Roster Manager | `RosterManagerPage.jsx` → split into `RosterStatRow`, `RosterTable`, `RosterPlayerRow` |
| 7 | Schedule (shared) | `SchedulePage.jsx` → possible split into `ScheduleStatRow`, `ScheduleListView`, `ScheduleEventRow` |
| 8 | Coach: Game Day Command Center | `GameDayCommandCenter.jsx` → split into `GameDayHero`, `LineupPanel`, `ScorePanel`, `AttendancePanel` |
| 9 | Parent: Dashboard + inner pages | `ParentDashboard.jsx`, `PlayerProfilePage.jsx`, `TeamWallPage.jsx` |
| 10 | Parity check + polish | All files — sweep for errors, consistency, branding |

**Total phases:** 11 (0–10)
**Estimated CC execution time:** This is a large spec. Each phase should be committed independently so Carlos can review progress and pause if needed.

---

## NOTES FOR CC

- **Do not guess file contents.** Read every file before modifying. The codebase has been through multiple specs and the structure may not match assumptions.
- **Supabase queries are sacred.** Every data fetch that exists must survive. Extract them cleanly when splitting files.
- **The mockup HTML files are visual references, not code to copy.** They use Plus Jakarta Sans as a stand-in — the real app uses Tele-Grotesk. They use vanilla CSS — the real app uses Tailwind.
- **Progressive disclosure is a core principle.** Empty sections don't show placeholders — they don't render at all. Conditional rendering everywhere.
- **Role-based visibility is non-negotiable.** Parents never see other families' financial data. Parents never see admin bulk controls. Test after every phase.
- **The 500-line rule is real.** If a file exceeds 500 lines after your changes, split it before committing.
- **Game Day is dark.** The Game Day Command Center and its sub-components use dark navy backgrounds with light text. This is the one area where dark theming is mandatory in this spec.
