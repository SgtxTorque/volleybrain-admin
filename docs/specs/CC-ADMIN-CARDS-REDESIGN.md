# CC-ADMIN-CARDS-REDESIGN — Admin Dashboard Card Internals + Default Layout

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-WIDGET-LIBRARY (completed)

---

## CONTEXT

Carlos arranged his admin dashboard using the widget grid editor and exported the layout. He also provided detailed feedback on every card's internals. This spec:
1. Hardcodes Carlos's layout as the admin dashboard default
2. Redesigns card internals per his feedback
3. Adds placeholder widgets to the widget library
4. Converts the Team Wall card into a Filter Card

---

## RULES

1. Read every file before modifying
2. Archive before replace
3. Preserve all Supabase data fetching
4. Commit after each phase
5. TSC verify after each phase
6. No file over 500 lines
7. Tailwind only — Lynx color tokens

---

## PHASE 0: Archive + Set Default Layout

### Step 0.1: Archive

```bash
mkdir -p src/_archive/admin-cards-$(date +%Y%m%d)
cp src/components/dashboard/OrgHealthHero.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/FinancialSummaryCard.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/AdminQuickActions.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/ComplianceCards.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/SeasonJourneyList.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/AdminActionChecklist.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/KPIRow.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/UpcomingEventsCard.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
cp src/components/dashboard/TeamWallPreviewCard.jsx src/_archive/admin-cards-$(date +%Y%m%d)/
# Archive the admin dashboard orchestrator
grep -r "adminWidgets\|DashboardGrid" src/ --include="*.jsx" -l | head -5
# Archive that file
# Also archive the widget registry
cp src/components/layout/widgetRegistry.js src/_archive/admin-cards-$(date +%Y%m%d)/
```

### Step 0.2: Hardcode Carlos's layout as admin default

Find the admin dashboard file where `adminWidgets` or the default layout is defined. Replace the default layout values with Carlos's exported JSON:

```js
const ADMIN_DEFAULT_LAYOUT = [
  { i: "welcome-banner", x: 0, y: 0, w: 8, h: 4 },
  { i: "notifications", x: 12, y: 0, w: 10, h: 5 },
  { i: "org-health-hero", x: 0, y: 4, w: 12, h: 12 },
  { i: "setup-tracker", x: 16, y: 5, w: 6, h: 4 },
  { i: "calendar-strip", x: 12, y: 5, w: 4, h: 32 },
  { i: "season-journey", x: 16, y: 9, w: 6, h: 20 },
  { i: "org-financials", x: 0, y: 16, w: 12, h: 10 },
  { i: "quick-actions-top", x: 0, y: 26, w: 12, h: 5 },
  { i: "people-compliance", x: 0, y: 31, w: 12, h: 6 },
  { i: "kpi-row", x: 16, y: 29, w: 6, h: 6 },
  { i: "all-teams-table", x: 16, y: 35, w: 6, h: 10 },
  { i: "org-wall-preview", x: 8, y: 0, w: 4, h: 1 },
  { i: "org-action-items", x: 0, y: 37, w: 1, h: 1 },
];
```

Update each widget's `defaultLayout` to match these values. Also update the `useState` initializer in `DashboardGrid` or the admin dashboard so it uses this as the starting layout.

**Note:** `org-wall-preview` (w:4, h:1) and `org-action-items` (w:1, h:1) are very small — Carlos is likely hiding or minimizing these. Keep them in the layout but they'll be redesigned or replaced later.

**Commit:** `git add -A && git commit -m "phase 0: archive + hardcode Carlos's admin layout as default"`

---

## PHASE 1: Organization Health Card Redesign

### Step 1.1: Read current OrgHealthHero

```bash
cat src/components/dashboard/OrgHealthHero.jsx
```

### Step 1.2: Redesign internals

Carlos's specific requests:

**Header:**
- Remove "Organization Health" title from next to the circle graph
- Move "BLACK HORNETS ATHLETICS" up to the top of the card, center-aligned
- Increase font size and brighten it: `text-r-xl font-extrabold text-white text-center`

**Circle Graph:**
- The health score number inside the ring must be the **focal point** — make it much larger: `text-r-5xl font-extrabold text-white`
- Move "Needs Attention" label INSIDE the circle, below the number: `text-r-xs text-amber-400` (or `text-green-400` if healthy)
- Remove the separate "Needs Attention" section header to the right

**Needs Attention Items:**
- Keep the list of items (Pending registrations, Overdue payments, etc.) but they are now just a list below or beside the ring, not under a separate header
- Each item is **clickable** — clicking navigates to the relevant page (registrations, payments, roster, schedule)
- If more than 5 items: show first 5 + "View All →" link
- Items still have colored dots (red/amber) and count badges

**KPI Stat Pills:**
- Move to the **middle** of the card vertically
- Resize to fit cleanly — no overlapping
- Arrange in a clean 2-row × 4-col grid that fits within the card width
- Each pill: icon + number (bold) + label (muted), all fitting in a compact cell

**Overall card layout (top to bottom):**
```
┌──────────────────────────────────────┐
│    BLACK HORNETS ATHLETICS           │  ← center, bright, large
│                                      │
│         ┌──────────┐                 │
│         │    74     │   • Pending    │  ← ring left/center,
│         │  Needs    │     reg (1)    │    items to the right
│         │ Attention │   • Overdue    │
│         └──────────┘     pay (42)    │
│                         • Unrostered │
│                           (2)        │
│                         • No sched   │
│                           (4)        │
│  ┌────┬────┬────┬────┐              │
│  │ 4  │ 17 │$1.8│100%│              │  ← KPI pills, compact
│  │Team│Play│Coll│Waiv│              │
│  ├────┼────┼────┼────┤              │
│  │ 0  │ 5  │$4.1│ 42 │              │
│  │Evt │Cch │Out │Over│              │
│  └────┴────┴────┴────┘              │
└──────────────────────────────────────┘
```

### Step 1.3: Implement

Rewrite `OrgHealthHero.jsx` with the new internal layout. Preserve all data fetching and prop inputs. The dark navy gradient background stays.

### Step 1.4: Verify — card renders correctly at its grid size (12×12 in 24-col units).

**Commit:** `git add -A && git commit -m "phase 1: org health card — centered org name, focal score, clickable needs-attention, clean KPI grid"`

---

## PHASE 2: Financial Summary Card Redesign

### Step 2.1: Read current FinancialSummaryCard

```bash
cat src/components/dashboard/FinancialSummaryCard.jsx
```

### Step 2.2: Redesign internals

Carlos's specific requests:

**Horizontal Bar Graph:**
- A single horizontal stacked bar, nearly end-to-end of the card width
- About the same height/size as the Send Reminders button
- Left portion: **green** (collected)
- Right portion: **red** (outstanding/owed)
- Large dollar amounts sitting **on top of** the graph, at each end:
  - Left: `$1,875.01` in green, `text-r-2xl font-extrabold text-green-500`
  - Right: `$4,155.15` in red, `text-r-2xl font-extrabold text-red-500`
- Below each dollar amount, same column alignment: "Collected" / "Outstanding" as labels

**Breakdown Table (below the bar graph):**
- A row of category breakdowns showing what's been collected out of what's owed per category
- Categories: Registration, Uniforms, Monthly Dues, Court Fees, etc. (derive from actual payment data — read the Supabase query to see what categories exist)
- Each category: amount on top (bold), category name below (muted)
- Format: `$1,000 / $10,000` or just the collected amount with the total
- Arrange horizontally if space allows, or in a compact grid

**Buttons:**
- "Send Reminders (42)" button — **shorten to half the width** (not full-width anymore)
- Add a **second button** next to it in a different color: "Payment Manager →" in `bg-lynx-navy text-white` or similar dark button
- Both buttons side by side: `grid grid-cols-2 gap-3`

**Card header:** "FINANCIALS" with a `$` icon — every card must have a clear header

### Step 2.3: Implement

Rewrite `FinancialSummaryCard.jsx`. Preserve all data fetching. The bar graph is a simple div with two colored sections (percentage-based widths).

### Step 2.4: Verify at grid size 12×10.

**Commit:** `git add -A && git commit -m "phase 2: financials card — horizontal bar graph, category breakdown, dual action buttons"`

---

## PHASE 3: Quick Actions + Notifications + Calendar Strip

### Step 3.1: Quick Actions — resize buttons to fit

Read `AdminQuickActions.jsx`. The buttons inside are getting cut off at the card edges.

Fix:
- Buttons should be in a responsive flex/grid that wraps within the card
- At card width 12 (out of 24), there's room for 3 buttons per row (2 rows of 3)
- Each button: icon + label + counter badge, all fitting within the button without clipping
- Use `flex-wrap` or `grid grid-cols-3 gap-2` and ensure text doesn't overflow: `truncate` or reduce font if needed
- Counter badges: `absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-r-xs font-bold`

### Step 3.2: Notifications — auto-cycling single line

Read `CoachNotificationsCard.jsx` (or the admin version if separate).

Redesign for admin:
- This is now **org-wide** notifications, not just team
- Shows **one notification at a time**, full sentence
- Auto-cycles through the last 5-8 notifications
- Cycle speed: fast enough to know it rotates (~4-5 seconds per notification), slow enough to read
- Smooth transition: fade or slide between notifications
- Each notification: emoji + description + time ago
- Examples: "📋 1 pending registration awaiting approval · 2h ago", "💰 Anderson family made a payment of $225 · 4h ago", "🏐 Spring 2026 schedule updated · 1d ago"

Implementation:
```jsx
const [currentIndex, setCurrentIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentIndex(prev => (prev + 1) % notifications.length);
  }, 4500); // 4.5 seconds per notification
  return () => clearInterval(interval);
}, [notifications.length]);
```

Use `transition-opacity duration-500` for a smooth fade between notifications.

### Step 3.3: Calendar Strip — org-wide schedule + button fix

Read the `CalendarStripCard` component (or find it):
```bash
find src -name "*Calendar*" -o -name "*calendar*" | head -10
```

Changes:
- Should show **full org schedule** by default (all teams, all events) — only filtered if admin uses the filter card
- Move "View Full Schedule" to **below** the calendar strip days/events area
- Style it as a **dark button**: `bg-lynx-navy text-white rounded-lg px-4 py-2 text-r-sm font-bold w-full`
- The card at 4×32 is tall and narrow — make sure the week days stack vertically if the card is narrow, or show a compact view

### Step 3.4: Verify all three cards render correctly at their grid sizes.

**Commit:** `git add -A && git commit -m "phase 3: quick actions fit, notifications auto-cycle, calendar strip org-wide + dark button"`

---

## PHASE 4: Season Journey Card Redesign

### Step 4.1: Read current SeasonJourneyList

```bash
cat src/components/dashboard/SeasonJourneyList.jsx
```

### Step 4.2: Redesign internals

Carlos's specific requests:

**Header:**
- "SEASON JOURNEY" header stays
- Move "View More" / "+N more seasons" to **top right**, aligned with the header (not at the bottom)

**Data accuracy:**
- Each season card currently shows "4 teams · 17 players" for every season — this is wrong. Each season must pull its OWN team count and player count from the database. Verify the Supabase query is filtering by season ID.

**Sport icons instead of initials:**
- Replace "VO", "BA", "SO" text badges with actual sport icons/emojis:
  - Volleyball → 🏐
  - Basketball → 🏀
  - Soccer → ⚽
  - Football → 🏈
  - Baseball → ⚾
  - Any other sport → use whatever icon fits, or fall back to the sport's first 2 letters
- The icon should be in a colored circle matching the sport's theme color

**Replace progress bars with step trackers:**
- Remove the colored percentage progress bar
- Replace with a numbered step tracker (like a mini journey): small circles/dots, numbered, green for completed steps, gray for incomplete
- Show as: "5/7 steps" instead of "67%"
- The step count comes from the Season Management workflow (10 steps defined in CC-ADMIN-DASHBOARD-REWORK Phase 4)

**"Continue →" label:**
- Next to "Continue →", show what the next incomplete step is: "Order jerseys → Continue ›"
- This tells the admin exactly what they'll be working on when they click

**Remove percentage number.** Use step fraction instead (5/7, 3/10, etc.)

### Step 4.3: Implement

Rewrite `SeasonJourneyList.jsx`. Make sure each season card queries its own data (or receives it as a prop from the parent that fetches per-season).

### Step 4.4: Verify — each season shows correct counts, sport icons, step trackers, next-step labels.

**Commit:** `git add -A && git commit -m "phase 4: season journey — sport icons, step trackers, per-season data, next-step labels"`

---

## PHASE 5: People & Compliance Card + Setup Tracker

### Step 5.1: People & Compliance

Read `ComplianceCards.jsx`. The internal white cards are getting cut off.

Fix:
- The 4 sub-cards (Players, Parents, Coaches, Organization) need to fit within the card at size 12×6
- Use `grid grid-cols-4 gap-2` with cards that don't overflow
- Each sub-card: compact — icon + title + 2-3 metric rows
- Metric rows: label left, value right (e.g. "Registered 17/48")
- Progress bars thin: `h-1.5`
- If the card is resized smaller, sub-cards should wrap to 2×2 grid

### Step 5.2: Setup Tracker

The setup tracker should **disappear** (not render at all) when all steps are complete. Read the component:
```bash
grep -r "AdminSetupTracker\|SetupTracker" src/components/ --include="*.jsx" -l
cat [found file]
```

Verify it has conditional rendering:
```jsx
if (allStepsComplete) return null;
```

If not, add it. The tracker widget should return `null` (render nothing) when all setup steps are done. The grid will naturally reflow.

### Step 5.3: Verify

**Commit:** `git add -A && git commit -m "phase 5: compliance cards fit, setup tracker conditional"`

---

## PHASE 6: Filter Card + Placeholder Widgets

### Step 6.1: Create a Filter Card widget

Carlos wants the Team Wall Preview spot (currently `org-wall-preview`) to become a **Filter Card** that controls what data the entire dashboard shows.

Create: `src/components/dashboard/DashboardFilterCard.jsx`

**Visual:**
- Compact card with filter dropdowns/pills
- Season selector: dropdown with all seasons
- Sport selector: dropdown or pills (Volleyball, Basketball, Soccer, All)
- Team selector: dropdown with all teams (filtered by season + sport selection)
- When filters change, the dashboard data refreshes to show only data matching the filters

**Implementation:**
- The filter state should live in the admin dashboard orchestrator (parent component)
- Pass filter values down to all widgets via `sharedProps`
- Each widget that supports filtering reads the filter values from props and adjusts its queries/display
- If no filters selected (all defaults): show org-wide data

**Register in widget registry:**
```js
{
  id: 'dashboard-filters',
  label: 'Dashboard Filters',
  description: 'Season, sport, and team filters that control all dashboard data',
  category: WIDGET_CATEGORIES.OVERVIEW,
  roles: ['admin'],
  defaultSize: { w: 4, h: 4 },
  minSize: { w: 2, h: 2 },
  componentKey: 'DashboardFilterCard',
  icon: '🔍',
}
```

### Step 6.2: Add Placeholder Widget type

Create: `src/components/dashboard/PlaceholderWidget.jsx`

A blank card that Carlos can add as many times as he wants to reserve space on the grid.

**Visual:**
- Light gray dashed border, empty center
- Text: "Reserved Space" or custom label
- In edit mode: shows an "Edit Label" button to name the placeholder
- Purpose: Carlos uses these to block out space for future cards

**Register in widget registry — allow multiple instances:**
```js
{
  id: 'placeholder',  // When adding, append a unique suffix: placeholder-1, placeholder-2, etc.
  label: 'Placeholder',
  description: 'Empty card to reserve space — add as many as you want',
  category: WIDGET_CATEGORIES.OVERVIEW,
  roles: ['admin', 'coach', 'parent'],
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 2, h: 2 },
  componentKey: 'PlaceholderWidget',
  icon: '⬜',
  allowMultiple: true,  // special flag — library panel allows adding multiple instances
}
```

In the widget library panel (`WidgetLibraryPanel.jsx`), update the add logic: if `allowMultiple` is true, clicking "Add" always creates a new instance with a unique ID (e.g. `placeholder-1`, `placeholder-2`, etc.) instead of checking if it's already on the grid.

### Step 6.3: Replace `org-wall-preview` with `dashboard-filters` in the default layout

In the admin default layout, change:
```js
{ i: "org-wall-preview", x: 8, y: 0, w: 4, h: 1 }
```
to:
```js
{ i: "dashboard-filters", x: 8, y: 0, w: 4, h: 4 }
```

### Step 6.4: All cards need headers

Carlos said every card needs a header identifying what it is. Go through every card component on the admin dashboard and ensure each one has a header section:
- Header style: `text-r-xs font-bold uppercase tracking-wider text-slate-500` with an icon
- If a card already has a header, verify it's visible and styled consistently
- If a card is missing a header, add one

Cards to check:
- OrgHealthHero ← has org name as header
- FinancialSummaryCard ← "FINANCIALS"
- AdminQuickActions ← "QUICK ACTIONS"
- ComplianceCards ← "PEOPLE & COMPLIANCE"
- SeasonJourneyList ← "SEASON JOURNEY"
- AdminActionChecklist ← "ACTION ITEMS"
- KPIRow ← "KPI STATS"
- TeamsTable ← "ALL TEAMS"
- CalendarStripCard ← "CALENDAR"
- NotificationsCard ← "NOTIFICATIONS"
- AdminSetupTracker ← "SETUP TRACKER"
- DashboardFilterCard ← "FILTERS"
- WelcomeBanner ← no header needed (it IS the header)

### Step 6.5: Verify
```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 6: filter card, placeholder widgets, card headers on all admin cards"`

---

## PHASE 7: Parity Check

### Step 7.1: Full admin dashboard test

- Default layout matches Carlos's exported JSON
- Org Health: centered org name, large focal score, clickable needs-attention, clean KPI grid
- Financials: horizontal bar graph (green/red), category breakdown, dual buttons
- Quick Actions: buttons fit without clipping
- Notifications: auto-cycles one line at a time, org-wide
- Calendar Strip: org-wide schedule, dark "View Full Schedule" button below
- Season Journey: sport icons, step trackers, correct per-season data, next-step labels, "View More" top-right
- Compliance: sub-cards fit without clipping
- Setup Tracker: disappears when all steps complete
- Filter Card: filters season/sport/team, affects dashboard data
- All cards have headers
- No console errors

### Step 7.2: Other roles unaffected

Coach and Parent dashboards should not be broken by these admin-specific changes. Quick test each.

```bash
npx tsc --noEmit
npm run build
```

**Commit:** `git add -A && git commit -m "phase 7: admin dashboard parity check — all cards verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + default layout | Hardcode Carlos's exported grid positions |
| 1 | Org Health Card | Centered name, focal score, clickable items, clean KPIs |
| 2 | Financial Summary | Horizontal bar graph, category breakdown, dual buttons |
| 3 | Quick Actions + Notifications + Calendar | Buttons fit, auto-cycle notifications, org-wide calendar |
| 4 | Season Journey | Sport icons, step trackers, per-season data, next-step labels |
| 5 | Compliance + Setup Tracker | Cards fit, tracker conditional |
| 6 | Filter Card + Placeholders + Headers | New filter widget, placeholder widgets, headers on all cards |
| 7 | Parity check | Full admin test |

**Total phases:** 8 (0–7)

---

## NOTES FOR CC

- **Carlos's layout JSON is the source of truth for card positions.** Use it exactly as provided.
- **The Org Health score number must be the visual focal point** of the card — biggest text, center of the ring, impossible to miss.
- **Needs Attention items are clickable links.** Each one navigates to the relevant page (registrations page, payments page, roster page, schedule page).
- **The financial bar graph is a simple stacked div**, not a charting library. Green section width = collected/total %, red section = outstanding/total %. CSS only.
- **Notifications auto-cycle** with `setInterval` + `useState`. Use opacity fade transition between items. 4.5 second interval.
- **Season Journey must pull PER-SEASON data.** If the current query returns the same counts for every season, it's broken. Fix the query to filter by `season_id`.
- **Sport icons:** Map sport name strings to emojis. If the sport field contains "volleyball" → 🏐, "basketball" → 🏀, etc. Case-insensitive matching.
- **Placeholder widgets support multiple instances.** The widget library's "Add" button for placeholders creates a new unique ID each time (placeholder-1, placeholder-2, etc.).
- **The Filter Card controls dashboard-wide data.** This requires the admin dashboard orchestrator to maintain filter state and pass it to all widgets. Existing Supabase queries may need filter parameters added.
