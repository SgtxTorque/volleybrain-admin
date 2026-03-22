# CC-WIDGET-GRID — Drag-and-Drop Dashboard Layout System

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign` (continue on existing branch)
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-RESPONSIVE-LAYOUT (completed)

---

## CONTEXT

Carlos needs to physically arrange dashboard cards himself rather than going back and forth describing layouts in text. This spec adds `react-grid-layout` to all three dashboards (Admin, Coach, Parent), wrapping every existing card as a draggable/resizable widget.

**This is an experiment-first approach:**
- No database persistence yet — layouts save to browser memory (React state) during the session
- Carlos arranges each dashboard how he wants it
- Once he's happy, we'll read the coordinates and hardcode them as defaults in a follow-up spec
- Database persistence (per-user saved layouts) comes later

---

## RULES

1. **Read every file before modifying it**
2. **Archive before replace** — copy to `src/_archive/`
3. **Preserve all existing card components** — do NOT modify card internals. Only wrap them in grid items.
4. **Preserve all data fetching** — nothing changes about how data flows
5. **Commit after each phase**
6. **TSC verify** after each phase
7. **Test all four roles** after each phase
8. **No file over 500 lines** — split if needed

---

## PHASE 0: Install react-grid-layout + Archive

```bash
npm install react-grid-layout
npm install --save-dev @types/react-grid-layout

# Archive dashboard layout files
mkdir -p src/_archive/widget-grid-$(date +%Y%m%d)
grep -r "OrgHealthHero\|AdminSetupTracker\|AdminActionChecklist" src/ --include="*.jsx" -l
grep -r "CoachGameDayHero\|CoachNotificationsCard\|CoachRosterCard" src/ --include="*.jsx" -l
cat src/pages/roles/ParentDashboard.jsx > /dev/null
# Archive each dashboard orchestrator file found
```

**Commit:** `git add -A && git commit -m "phase 0: install react-grid-layout + archive dashboard files"`

---

## PHASE 1: Shared DashboardGrid Component

**Goal:** Build a reusable grid wrapper that any dashboard can use.

### Step 1.1: Create the shared component

Create: `src/components/layout/DashboardGrid.jsx`

**Note:** A file named `DashboardGrid.jsx` may already exist from the responsive layout spec (it had grid helper components). Read it first. If it exists, either rename the old one to `DashboardGridHelpers.jsx` or integrate into the same file. The new component is fundamentally different — it's a react-grid-layout powered drag-and-drop system.

```jsx
import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * DashboardGrid — wraps dashboard cards in a draggable/resizable grid.
 *
 * Props:
 * - widgets: Array of { id, component, defaultLayout, minW, minH, label }
 * - editMode: boolean — when true, cards are draggable/resizable
 * - onLayoutChange: callback with new layout (for future persistence)
 * - columns: number of grid columns (default 12)
 * - rowHeight: pixel height per row unit (default 40)
 */
export default function DashboardGrid({
  widgets,
  editMode = false,
  onLayoutChange,
  columns = 12,
  rowHeight = 40,
}) {
  // Layout state — initialized from widget defaultLayout values
  const [layouts, setLayouts] = useState(() => {
    const lg = widgets.map(w => ({
      i: w.id,
      x: w.defaultLayout.x,
      y: w.defaultLayout.y,
      w: w.defaultLayout.w,
      h: w.defaultLayout.h,
      minW: w.minW || 2,
      minH: w.minH || 2,
      maxW: w.maxW || 12,
      maxH: w.maxH || 20,
    }));
    return { lg };
  });

  const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  }, [onLayoutChange]);

  return (
    <div className="relative">
      {/* Edit mode toggle banner */}
      {editMode && (
        <div className="sticky top-0 z-50 bg-amber-50 border-b-2 border-amber-400 px-4 py-2 flex items-center justify-between mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 font-bold text-r-base">✏️ Edit Mode</span>
            <span className="text-amber-600 text-r-sm">Drag cards to rearrange. Drag edges to resize.</span>
          </div>
          <button
            onClick={() => {
              // Log current layout to console so Carlos can read it
              console.log('=== CURRENT LAYOUT ===');
              console.log(JSON.stringify(layouts.lg, null, 2));
              console.log('=== END LAYOUT ===');
              alert('Layout logged to browser console (F12 → Console tab). Copy the JSON to save it.');
            }}
            className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-r-sm font-bold hover:bg-amber-600 transition-colors"
          >
            📋 Export Layout
          </button>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: columns, md: columns, sm: 6, xs: 4 }}
        rowHeight={rowHeight}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {widgets.map(widget => (
          <div key={widget.id} className="relative group">
            {/* Drag handle — only visible in edit mode */}
            {editMode && (
              <div className="widget-drag-handle absolute top-0 left-0 right-0 h-8 bg-lynx-sky/10 border-b border-lynx-sky/20 rounded-t-xl flex items-center justify-between px-3 cursor-grab active:cursor-grabbing z-10">
                <span className="text-r-xs font-bold text-lynx-sky uppercase tracking-wider">
                  ⠿ {widget.label || widget.id}
                </span>
                <span className="text-r-xs text-slate-400">
                  {/* Show current grid dimensions */}
                </span>
              </div>
            )}
            {/* The actual card component */}
            <div className={`h-full overflow-auto ${editMode ? 'pt-8' : ''}`}>
              {widget.component}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
```

### Step 1.2: Add CSS for react-grid-layout

The library needs its CSS imported. Add to `src/index.css` or the main entry point:

```css
/* react-grid-layout overrides */
.react-grid-item {
  transition: all 200ms ease;
}
.react-grid-item.react-draggable-dragging {
  transition: none;
  z-index: 100;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  opacity: 0.9;
}
.react-grid-placeholder {
  background: rgba(75, 185, 236, 0.15) !important;
  border: 2px dashed rgba(75, 185, 236, 0.4) !important;
  border-radius: 14px !important;
}
.react-resizable-handle {
  background: none !important;
}
.react-resizable-handle::after {
  border-color: rgba(75, 185, 236, 0.4) !important;
}
```

### Step 1.3: Verify
```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 1: DashboardGrid component with react-grid-layout + edit mode + export"`

---

## PHASE 2: Admin Dashboard — Widget Grid

**Goal:** Wrap every card on the admin dashboard in the DashboardGrid widget system.

### Step 2.1: Read the admin dashboard layout file

```bash
grep -r "OrgHealthHero\|AdminSetupTracker" src/ --include="*.jsx" -l
# Read the orchestrator file
```

Identify every card/component currently rendered on the admin dashboard. Map each to a widget.

### Step 2.2: Define admin widgets

Each existing card becomes a widget with an ID, label, default layout position, and min/max constraints.

**Grid is 12 columns. Row height is 40px.** So a card that's `w: 12, h: 6` is full-width and 240px tall. A card that's `w: 7, h: 8` is ~58% width and 320px tall.

```jsx
const adminWidgets = [
  {
    id: 'welcome-banner',
    label: 'Welcome Banner',
    component: <WelcomeBanner role="admin" ... />,
    defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
    minW: 6, minH: 1, maxH: 3,
  },
  {
    id: 'setup-tracker',
    label: 'Setup Tracker',
    component: <AdminSetupTracker ... />,
    defaultLayout: { x: 0, y: 2, w: 12, h: 2 },
    minW: 6, minH: 1, maxH: 3,
  },
  {
    id: 'org-health-hero',
    label: 'Organization Health',
    component: <OrgHealthHero ... />,
    defaultLayout: { x: 0, y: 4, w: 7, h: 9 },
    minW: 5, minH: 6, maxH: 14,
  },
  {
    id: 'season-journey-list',
    label: 'Season Journey',
    component: <SeasonJourneyList ... />,
    defaultLayout: { x: 7, y: 4, w: 5, h: 9 },
    minW: 3, minH: 4, maxH: 16,
  },
  {
    id: 'action-checklist',
    label: 'Action Items',
    component: <AdminActionChecklist ... />,
    defaultLayout: { x: 0, y: 13, w: 12, h: 5 },
    minW: 4, minH: 3, maxH: 10,
  },
  {
    id: 'quick-actions',
    label: 'Quick Actions',
    component: <AdminQuickActions ... />,
    defaultLayout: { x: 0, y: 18, w: 12, h: 4 },
    minW: 4, minH: 3, maxH: 6,
  },
  // ... continue for every remaining card on the admin dashboard
  // KPI row cards, Teams table, Financial summary, Compliance cards,
  // Upcoming events, Team wall preview, etc.
  // READ the dashboard file to get the complete list
];
```

**Important:** Map EVERY card currently on the admin dashboard. Don't skip any. If there are KPI stat cards that are currently in a row, each one can either be an individual widget OR the entire row can be one widget. For stat card rows, wrap the entire `<StatGrid>` / `<KPIGrid>` as a single widget — it's easier to drag as one unit.

### Step 2.3: Add edit mode toggle

Add an "Edit Layout" button to the admin dashboard. This can be:
- A floating button in the bottom-right corner: `fixed bottom-6 right-6 z-40`
- Styled: `bg-lynx-sky text-white rounded-full px-4 py-2 shadow-lg font-bold`
- Clicking it toggles `editMode` state
- When edit mode is on, the button text changes to "Done Editing"
- When "Export Layout" is clicked in the edit mode banner, the current layout JSON is logged to the browser console AND copied to clipboard if possible

### Step 2.4: Replace the admin dashboard's current JSX layout

The current admin dashboard renders cards in a specific order with grid classes. Replace that entire layout section with:

```jsx
const [editMode, setEditMode] = useState(false);

return (
  <DashboardContainer>
    <DashboardGrid
      widgets={adminWidgets}
      editMode={editMode}
      onLayoutChange={(layouts) => {
        // Store in state for now — no persistence
        console.log('Layout changed:', layouts);
      }}
    />
    <button
      onClick={() => setEditMode(!editMode)}
      className="fixed bottom-6 right-6 z-40 bg-lynx-sky text-white rounded-full px-5 py-2.5 shadow-lg font-bold text-r-sm hover:bg-lynx-sky/90 transition-colors"
    >
      {editMode ? '✓ Done Editing' : '✏️ Edit Layout'}
    </button>
  </DashboardContainer>
);
```

### Step 2.5: Pass data props correctly

The widget components still need their data props. The admin dashboard currently fetches data and passes it to cards. This must continue working. Each widget's `component` field should receive its props:

```jsx
{
  id: 'org-health-hero',
  component: <OrgHealthHero healthScore={healthScore} kpis={kpis} needsAttention={needsAttention} />,
  ...
}
```

Read the current dashboard to see exactly which props each component receives and preserve all of them.

### Step 2.6: Verify

```bash
npx tsc --noEmit
```

Test as Admin:
- Dashboard renders with all cards in default positions
- Click "Edit Layout" → cards show drag handles and blue labels
- Drag a card → it moves, other cards reflow
- Resize a card by dragging its edge → it grows/shrinks
- Click "Export Layout" → JSON appears in browser console
- Click "Done Editing" → handles disappear, cards stay in new positions
- Refresh page → layout resets to defaults (no persistence yet, that's expected)
- All card data still displays correctly
- No console errors

**Commit:** `git add -A && git commit -m "phase 2: admin dashboard — react-grid-layout widget system with edit mode"`

---

## PHASE 3: Coach Dashboard — Widget Grid

**Goal:** Same treatment as admin, but for the coach dashboard.

### Step 3.1: Read the coach dashboard layout file

```bash
grep -r "CoachGameDayHero\|CoachNotificationsCard" src/ --include="*.jsx" -l
# Read the orchestrator file
```

### Step 3.2: Define coach widgets

Map every card on the coach dashboard:

```jsx
const coachWidgets = [
  {
    id: 'welcome-banner',
    label: 'Welcome Banner',
    component: <WelcomeBanner role="coach" ... />,
    defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
    minW: 6, minH: 1, maxH: 3,
  },
  {
    id: 'gameday-hero',
    label: 'Game Day Hero',
    component: <CoachGameDayHeroV2 ... />,
    defaultLayout: { x: 0, y: 2, w: 7, h: 8 },
    minW: 5, minH: 5, maxH: 12,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    component: <CoachNotificationsCard ... />,
    defaultLayout: { x: 7, y: 2, w: 5, h: 4 },
    minW: 3, minH: 3, maxH: 8,
  },
  {
    id: 'squad',
    label: 'Squad',
    component: <CoachRosterCard ... />,
    defaultLayout: { x: 7, y: 6, w: 5, h: 10 },
    minW: 3, minH: 4, maxH: 18,
  },
  {
    id: 'gameday-journey',
    label: 'Game Day Journey',
    component: <GameDayJourneyCard ... />,
    defaultLayout: { x: 0, y: 10, w: 7, h: 3 },
    minW: 4, minH: 2, maxH: 5,
  },
  {
    id: 'also-this-week',
    label: 'Also This Week',
    component: <AlsoThisWeekCard ... />,  // if this exists from DASHBOARD-POLISH
    defaultLayout: { x: 0, y: 13, w: 7, h: 2 },
    minW: 3, minH: 1, maxH: 3,
  },
  {
    id: 'calendar-strip',
    label: 'Calendar Strip',
    component: <CalendarStripCard ... />,  // if this exists
    defaultLayout: { x: 0, y: 15, w: 6, h: 6 },
    minW: 4, minH: 4, maxH: 8,
  },
  {
    id: 'action-items',
    label: 'Action Items',
    component: <CoachActionItemsCard ... />,  // if this exists
    defaultLayout: { x: 6, y: 15, w: 6, h: 6 },
    minW: 3, minH: 3, maxH: 8,
  },
  // ... continue for ALL remaining coach cards:
  // CoachStatsCard, CoachToolsCard, CoachActionsCard (quick actions),
  // CoachScheduleCard, ChallengesCard, TopPlayersCard,
  // TeamReadinessCard, CoachWallPreviewCard, TeamHealthCard,
  // any other cards that exist
  // READ the file to get the complete list
];
```

**Important:** Some cards from CC-DASHBOARD-POLISH may not exist yet (AlsoThisWeekCard, CalendarStripCard, CoachActionItemsCard, TeamHealthCard, TeamReadinessCard). If they don't exist in the codebase, **skip them** — only wrap components that actually exist. Add a comment noting which widgets are placeholders for future components.

### Step 3.3: Add edit mode toggle (same pattern as admin)

### Step 3.4: Replace coach dashboard layout with DashboardGrid

Same pattern as admin — preserve all data fetching and prop passing.

### Step 3.5: Handle team/season selectors

The coach dashboard has team/season selector filters above the cards. These should NOT be inside the grid — they're fixed controls that filter the data. Keep them above the `<DashboardGrid>`:

```jsx
return (
  <DashboardContainer>
    {/* Selectors — not draggable, always at top */}
    <TeamSeasonSelectors ... />

    {/* Draggable grid */}
    <DashboardGrid
      widgets={coachWidgets}
      editMode={editMode}
      ...
    />

    <EditLayoutButton editMode={editMode} setEditMode={setEditMode} />
  </DashboardContainer>
);
```

### Step 3.6: Verify

Test as Coach: same checks as admin — drag, resize, export, data integrity.

**Commit:** `git add -A && git commit -m "phase 3: coach dashboard — react-grid-layout widget system"`

---

## PHASE 4: Parent Dashboard — Widget Grid

**Goal:** Same treatment for parent dashboard.

### Step 4.1: Read ParentDashboard.jsx

```bash
cat src/pages/roles/ParentDashboard.jsx
```

### Step 4.2: Define parent widgets

```jsx
const parentWidgets = [
  {
    id: 'welcome-banner',
    label: 'Welcome Banner',
    component: <WelcomeBanner role="parent" ... />,
    defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
    minW: 6, minH: 1, maxH: 3,
  },
  {
    id: 'child-cards',
    label: 'My Players',
    component: <ChildPlayerCards ... />,  // whatever component renders the child hero cards
    defaultLayout: { x: 0, y: 2, w: 12, h: 4 },
    minW: 6, minH: 3, maxH: 6,
  },
  {
    id: 'action-required',
    label: 'Action Required',
    component: <ActionRequiredCard ... />,  // or whatever the "You Got Stuff To Do" component is
    defaultLayout: { x: 0, y: 6, w: 12, h: 4 },
    minW: 4, minH: 2, maxH: 8,
  },
  {
    id: 'upcoming-events',
    label: 'Upcoming Events',
    component: <UpcomingEventsCard ... />,
    defaultLayout: { x: 0, y: 10, w: 6, h: 5 },
    minW: 4, minH: 3, maxH: 8,
  },
  {
    id: 'team-hub',
    label: 'Team Hub',
    component: <TeamHubPreview ... />,
    defaultLayout: { x: 6, y: 10, w: 6, h: 5 },
    minW: 3, minH: 3, maxH: 8,
  },
  {
    id: 'achievements',
    label: 'Achievements',
    component: <AchievementsCard ... />,
    defaultLayout: { x: 0, y: 15, w: 6, h: 4 },
    minW: 3, minH: 2, maxH: 6,
  },
  {
    id: 'balance-due',
    label: 'Balance Due',
    component: <BalanceDueCard ... />,
    defaultLayout: { x: 6, y: 15, w: 6, h: 4 },
    minW: 3, minH: 3, maxH: 6,
  },
  // ... any other parent cards
  // READ the file to get complete list
];
```

**Conditional widgets:** Some parent cards are conditional (balance only shows if > $0, action required only shows if there are items). The widget array should be filtered dynamically:

```jsx
const parentWidgets = useMemo(() => {
  const widgets = [
    // always-visible widgets...
  ];
  if (hasOutstandingBalance) {
    widgets.push({ id: 'balance-due', ... });
  }
  if (actionItems.length > 0) {
    widgets.push({ id: 'action-required', ... });
  }
  return widgets;
}, [hasOutstandingBalance, actionItems]);
```

### Step 4.3: Child switcher stays outside the grid

Like the coach team selector, the child switcher (for multi-child parents) stays above the grid as a fixed control.

### Step 4.4: Verify

Test as Parent: drag, resize, export, data integrity, conditional cards show/hide correctly.

**Commit:** `git add -A && git commit -m "phase 4: parent dashboard — react-grid-layout widget system"`

---

## PHASE 5: Shared Edit Mode Button + Export Enhancement

**Goal:** Polish the edit mode experience so it's easy for Carlos to use.

### Step 5.1: Create shared EditLayoutButton component

`src/components/layout/EditLayoutButton.jsx`

Consolidate the edit mode button used across all three dashboards:

```jsx
export default function EditLayoutButton({ editMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-lynx-sky text-white rounded-full px-5 py-3 shadow-xl font-bold text-r-sm hover:bg-lynx-sky/90 transition-all hover:scale-105"
    >
      {editMode ? '✓ Done' : '✏️ Edit Layout'}
    </button>
  );
}
```

### Step 5.2: Enhance Export Layout

When "Export Layout" is clicked in edit mode, instead of just console.log:

1. Log the JSON to console (for CC to read later)
2. Copy the JSON to clipboard via `navigator.clipboard.writeText()`
3. Show a toast/notification: "Layout copied! Paste it to Carlos or save for later."
4. Also show the current layout as a readable summary in the edit banner:
   - "org-health-hero: 7 cols × 9 rows (position 0,4)"
   - "season-journey-list: 5 cols × 9 rows (position 7,4)"
   - etc.

This helps Carlos see the grid units without opening the console.

### Step 5.3: Add "Reset to Default" button

In edit mode, add a "Reset" button next to "Export Layout" that resets the grid back to the original `defaultLayout` values. This way Carlos can experiment freely knowing he can always reset.

### Step 5.4: Verify

**Commit:** `git add -A && git commit -m "phase 5: shared EditLayoutButton + enhanced export + reset to default"`

---

## PHASE 6: Card Internal Overflow Handling

**Goal:** When Carlos resizes a card smaller, the content inside should handle it gracefully — scroll, truncate, or hide secondary content.

### Step 6.1: Add overflow handling to all card components

For each card component on all three dashboards, ensure:

- The card's outermost div has `overflow-hidden` or `overflow-auto`
- If the card has a header + body, the header is sticky/fixed height and the body scrolls
- Long text truncates with `truncate` or `line-clamp-2` rather than breaking the layout
- Tables inside cards get `overflow-x-auto` for horizontal scroll
- Stat numbers and labels don't wrap — they stay on one line with `whitespace-nowrap`
- If a card is resized very small, essential info (title + primary number) should still be visible even if secondary content is hidden

### Step 6.2: Test by resizing cards to minimum sizes

In edit mode, drag each card to its minimum size. Verify:
- No text overlaps or breaks outside the card
- Cards scroll internally if content doesn't fit
- Nothing crashes or produces errors

### Step 6.3: Verify
```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 6: card overflow handling for small resize states"`

---

## PHASE 7: Parity Check

**Goal:** All three dashboards work with the grid system. No regressions.

### Step 7.1: Test each role

**Admin:**
- Dashboard loads with default layout
- Edit mode: drag, resize, export all work
- Reset returns to default
- All data displays correctly
- "Continue →" on seasons still works

**Coach:**
- Dashboard loads, team selectors work
- Edit mode works
- All cards show real data
- Game day hero, squad, notifications all present

**Parent:**
- Dashboard loads, child switcher works
- Conditional cards (balance, action items) appear/disappear correctly
- Edit mode works

**Player:**
- Player dashboard should NOT have edit mode (or if it does, it should be harmless)

### Step 7.2: Non-edit mode regression check

When NOT in edit mode:
- Cards should NOT be draggable
- Cards should NOT show resize handles
- Cards should NOT show the drag handle bar
- Layout should look identical to before this spec (same default positions)
- The only new UI element is the "Edit Layout" floating button

### Step 7.3: TSC + build
```bash
npx tsc --noEmit
npm run build
```

### Step 7.4: Final commit
```bash
git add -A && git commit -m "phase 7: parity check — all roles verified, edit mode toggle clean"
```

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Install + archive | react-grid-layout installed |
| 1 | DashboardGrid component | Shared draggable/resizable grid wrapper with edit mode |
| 2 | Admin dashboard | All admin cards wrapped as widgets |
| 3 | Coach dashboard | All coach cards wrapped as widgets |
| 4 | Parent dashboard | All parent cards wrapped as widgets (conditional handling) |
| 5 | Edit mode polish | Shared button, export to clipboard, reset to default |
| 6 | Card overflow | Graceful handling when cards are resized small |
| 7 | Parity check | All roles tested, no regressions |

**Total phases:** 8 (0–7)

---

## HOW CARLOS USES THIS

1. Open the dashboard (admin, coach, or parent)
2. Click "✏️ Edit Layout" button (bottom right corner)
3. A yellow "Edit Mode" banner appears at the top
4. **Drag cards** by grabbing the blue handle bar at the top of each card
5. **Resize cards** by dragging the bottom-right corner
6. Cards reflow automatically when you move things
7. When happy with the layout, click "📋 Export Layout" — the grid JSON copies to clipboard
8. Click "✓ Done" to exit edit mode
9. Paste the JSON to Claude — it becomes the new default layout in the next spec
10. Click "Reset" at any time to go back to the starting layout

---

## NOTES FOR CC

- **react-grid-layout docs:** https://github.com/react-grid-layout/react-grid-layout — read them if unfamiliar
- **Every existing card component is wrapped, not modified.** The card internals don't change at all. Only the layout orchestrator file changes.
- **Widget IDs must be unique strings** — use kebab-case names that match the component purpose
- **The grid uses 12 columns** (standard responsive grid). Width units: 1 = 1/12 of container. Height units: 1 = 40px.
- **Default layouts should approximate the current card arrangement.** Don't try to improve the layout — just match what's currently rendering. Carlos will rearrange.
- **Conditional widgets (parent dashboard):** The widget array must be dynamic. If a card shouldn't render (zero balance, no action items), don't include it in the widgets array. react-grid-layout handles the reflow when items are added/removed.
- **Data fetching stays in the dashboard orchestrator.** Each widget's `component` field receives its data as props from the parent. Don't move queries into individual widgets.
- **The "Export Layout" JSON format** should be the standard react-grid-layout format: `[{ i: "widget-id", x: 0, y: 0, w: 6, h: 4 }, ...]`. This is what we'll hardcode as defaults later.
- **No database persistence in this spec.** Layouts reset on page refresh. That's intentional — this is for experimentation.
