# CC-WIDGET-GRID-FIX — Grid Editor UX Fixes

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-WIDGET-GRID (completed)

---

## CONTEXT

Carlos is testing the drag-and-drop grid editor and hit three issues:
1. **No visual grid overlay** — he can't see the grid columns/rows so dragging feels blind
2. **Resize handles aren't working** — cards can be dragged but not resized
3. **Cards snap back to original position** — likely a state or compaction issue

---

## RULES

1. Read every file before modifying
2. Commit after each phase
3. TSC verify after each phase
4. This is a FIX-ONLY spec — no new features, no layout changes

---

## PHASE 1: Diagnose and Fix All Three Issues

### Step 1.1: Read the DashboardGrid component

```bash
cat src/components/layout/DashboardGrid.jsx
```

Also read:
```bash
cat node_modules/react-grid-layout/css/styles.css
cat node_modules/react-resizable/css/styles.css
```

Check if the CSS files are actually being imported. If they're imported in the component file but the bundler isn't picking them up, they need to be imported in `src/index.css` or the main App entry point instead.

### Step 1.2: Fix Issue 1 — Add visual grid overlay in edit mode

When `editMode` is true, render a visible grid behind the cards so Carlos can see the 12-column structure.

Add this CSS to `src/index.css`:

```css
/* Grid overlay — visible only in edit mode */
.dashboard-grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px; /* must match the margin prop on ResponsiveGridLayout */
}

.dashboard-grid-overlay .grid-col {
  background: repeating-linear-gradient(
    to bottom,
    rgba(75, 185, 236, 0.04) 0px,
    rgba(75, 185, 236, 0.04) 40px,    /* rowHeight */
    rgba(75, 185, 236, 0.08) 40px,
    rgba(75, 185, 236, 0.08) 41px      /* 1px line every rowHeight */
  );
  border-left: 1px dashed rgba(75, 185, 236, 0.12);
  border-right: 1px dashed rgba(75, 185, 236, 0.12);
}

/* Column number labels at the top */
.dashboard-grid-overlay .grid-col::before {
  content: attr(data-col);
  display: block;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: rgba(75, 185, 236, 0.3);
  padding-top: 4px;
}
```

In `DashboardGrid.jsx`, when `editMode` is true, render the overlay BEHIND the grid:

```jsx
{editMode && (
  <div className="dashboard-grid-overlay">
    {Array.from({ length: 12 }, (_, i) => (
      <div key={i} className="grid-col" data-col={i + 1} />
    ))}
  </div>
)}
```

The parent container of the grid must have `position: relative` so the overlay positions correctly.

### Step 1.3: Fix Issue 2 — Resize handles not showing

This is almost certainly a CSS import issue. react-grid-layout requires both:
- `react-grid-layout/css/styles.css`
- `react-resizable/css/styles.css`

**Check if these are imported.** If they're imported inside `DashboardGrid.jsx`, the bundler might not process them. Move the imports to `src/index.css` or the main entry file (`src/main.jsx` / `src/App.jsx`):

```jsx
// In src/main.jsx or src/App.jsx (whichever is the entry point)
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

Also check that `isResizable={editMode}` is being passed to `ResponsiveGridLayout`. If it's set to `true` but handles still don't show, the issue is likely:

**a)** The resize handle CSS is hidden by Tailwind's preflight (Tailwind resets all styles). Add explicit resize handle styles to `src/index.css`:

```css
/* Force resize handles to be visible */
.react-grid-item > .react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 10;
}

.react-grid-item > .react-resizable-handle::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 8px;
  height: 8px;
  border-right: 2px solid rgba(75, 185, 236, 0.5);
  border-bottom: 2px solid rgba(75, 185, 236, 0.5);
}

.react-grid-item > .react-resizable-handle.react-resizable-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

/* Make all four corners resizable for easier use */
.react-grid-item > .react-resizable-handle.react-resizable-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
}
.react-grid-item > .react-resizable-handle.react-resizable-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
}
.react-grid-item > .react-resizable-handle.react-resizable-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
}
```

**b)** Also enable all four resize handles in the grid config:

```jsx
<ResponsiveGridLayout
  ...
  isResizable={editMode}
  resizeHandles={['se', 'sw', 'ne', 'nw']}  // all four corners
  ...
>
```

### Step 1.4: Fix Issue 3 — Cards snapping back to original position

This happens when the layout state is being overwritten on re-render. Common causes:

**a) The layouts state is being re-initialized every render.** Check if the `useState` initializer is inside the component body without proper memoization. The initial layout should only be computed once:

```jsx
// WRONG — reinitializes every render if widgets prop changes
const [layouts, setLayouts] = useState(() => {
  return { lg: widgets.map(w => ({ ... })) };
});

// If the widgets array is recreated every render (common with inline JSX),
// the useState initializer runs once but the COMPONENT might remount.
```

**Fix:** Make sure the parent dashboard is NOT recreating the widgets array on every render. The widgets array should be defined with `useMemo`:

```jsx
// In the dashboard file
const adminWidgets = useMemo(() => [
  { id: 'welcome-banner', component: <WelcomeBanner .../>, ... },
  { id: 'org-health-hero', component: <OrgHealthHero .../>, ... },
  // ...
], [/* dependencies that actually change */]);
```

**b) `compactType="vertical"` might be forcing cards back.** Vertical compaction means the grid pushes all cards up to fill empty space. If Carlos drags a card down, compaction pushes it back up.

**Fix:** Change to `compactType={null}` in edit mode so cards stay exactly where they're dropped:

```jsx
<ResponsiveGridLayout
  ...
  compactType={editMode ? null : 'vertical'}
  ...
>
```

This way in edit mode, cards don't auto-compact. In normal view mode, they still compact vertically (no gaps).

**c) The `onLayoutChange` callback might be triggering a re-render that resets state.** Check if the callback is recreated every render (missing `useCallback`). Also check if the parent component re-renders when `onLayoutChange` fires, which could reset the widget array.

### Step 1.5: Add card dimension labels in edit mode

When in edit mode, show the current size of each card on the drag handle:

```jsx
{editMode && (
  <div className="widget-drag-handle ...">
    <span className="...">⠿ {widget.label}</span>
    <span className="text-r-xs text-lynx-sky/50 font-mono">
      {/* Get current dimensions from layout state */}
      {currentW}×{currentH}
    </span>
  </div>
)}
```

This shows something like "7×9" on each card so Carlos knows the grid units while dragging.

To get the current dimensions, read from the layouts state:

```jsx
const currentLayout = layouts.lg?.find(l => l.i === widget.id);
const currentW = currentLayout?.w || widget.defaultLayout.w;
const currentH = currentLayout?.h || widget.defaultLayout.h;
```

### Step 1.6: Add a subtle blue border to each card in edit mode

So Carlos can clearly see the card boundaries:

```jsx
<div
  key={widget.id}
  className={`relative group ${editMode ? 'ring-2 ring-lynx-sky/20 ring-offset-2 rounded-xl' : ''}`}
>
```

### Step 1.7: Verify

```bash
npx tsc --noEmit
```

Test as Admin:
- Click "Edit Layout"
- **Grid overlay visible** — 12 columns with faint blue dashed lines and row markers
- **Cards have blue borders** showing their boundaries
- **Drag handle shows card name + current dimensions** (e.g. "Organization Health 7×9")
- **Resize handles visible** — blue corner indicators on all four corners of each card
- **Drag a card** — it stays where you drop it (no snapping back)
- **Resize a card** — it grows/shrinks and shows updated dimensions
- **Export Layout** — copies JSON to clipboard
- **Reset** — returns to default
- **Done Editing** — overlay disappears, borders disappear, handles disappear

**Commit:** `git add -A && git commit -m "phase 1: grid editor UX — visible overlay, resize handles, snap-back fix, dimension labels"`

---

## PHASE 2: Verify Coach + Parent Grids

The fixes from Phase 1 are in the shared `DashboardGrid` component, so they should apply to all three dashboards. Verify:

### Step 2.1: Test Coach dashboard edit mode
- Grid overlay shows
- All cards draggable
- All cards resizable
- No snap-back
- Dimensions shown on handles

### Step 2.2: Test Parent dashboard edit mode
- Same checks
- Conditional cards (balance, action items) still appear/disappear correctly

### Step 2.3: Fix any role-specific issues found

```bash
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 2: verified grid editor works on coach + parent dashboards"`

---

## NOTES FOR CC

- The three issues are likely: (1) missing CSS, (2) CSS overridden by Tailwind preflight, (3) state management causing re-renders. Fix all three.
- `compactType={null}` in edit mode is critical — otherwise vertical compaction fights the user's drag.
- The grid overlay is purely visual (pointer-events: none) — it doesn't interfere with dragging.
- Test at Carlos's resolution (1440p / 27" monitor) if possible, or at least at 1440px browser width.
