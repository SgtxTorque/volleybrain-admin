# CC-WIDGET-GRID-FIX-2 — Grid Editor Fine Control

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-WIDGET-GRID-FIX (completed)

---

## CONTEXT

Carlos is testing the grid editor and hit more issues:
1. Moving one card causes ALL other cards to shift down — compaction and collision prevention aren't fully disabled
2. Needs finer grid resolution — 12 columns is too coarse for precise placement
3. Cards won't shrink small enough — minW constraints are too large
4. Needs visual overlap warnings when cards are on top of each other

---

## RULES

1. Read every file before modifying
2. This is the shared `DashboardGrid.jsx` component + CSS only
3. Commit after each phase
4. TSC verify after each phase
5. Test all three dashboards (Admin, Coach, Parent) after changes

---

## PHASE 1: Fix All Grid Behavior Issues

### Step 1.1: Read the current DashboardGrid component

```bash
cat src/components/layout/DashboardGrid.jsx
```

### Step 1.2: Switch to 24-column grid

Change the default `columns` prop from 12 to 24. This doubles the horizontal resolution.

In `DashboardGrid.jsx`:
```jsx
// Change default
columns = 24

// Update breakpoints
cols={{ lg: 24, md: 24, sm: 12, xs: 6 }}
```

### Step 1.3: Update ALL widget defaultLayout values across all three dashboards

Since we doubled the columns from 12 to 24, every widget's `x` and `w` values need to double to maintain the same visual layout:

```
Old: { x: 0, y: 0, w: 7, h: 9 }    →  New: { x: 0, y: 0, w: 14, h: 9 }
Old: { x: 7, y: 0, w: 5, h: 9 }    →  New: { x: 14, y: 0, w: 10, h: 9 }
Old: { x: 0, y: 0, w: 12, h: 2 }   →  New: { x: 0, y: 0, w: 24, h: 2 }
Old: { x: 0, y: 0, w: 6, h: 5 }    →  New: { x: 0, y: 0, w: 12, h: 5 }
```

**Rule: multiply every `x` and `w` value by 2. Leave `y` and `h` unchanged.**

Also multiply every `minW` and `maxW` by 2:
```
Old: minW: 4  →  New: minW: 4   (keep minW LOW — 4 out of 24 = very narrow, which is what Carlos wants)
Old: minW: 6  →  New: minW: 4   (lower these so cards can shrink more)
Old: maxW: 12 →  New: maxW: 24
```

Actually — **set ALL minW values to 2** across every widget on every dashboard. This means any card can shrink down to 2/24 = 8.3% of the screen width. Carlos can decide what's too small.

**Set ALL minH values to 1.** Let Carlos shrink cards vertically as small as he wants too.

Find all three dashboard files that define widget arrays:
```bash
grep -r "defaultLayout" src/ --include="*.jsx" -l
```
Read each file and update every widget's x, w, minW, maxW values.

### Step 1.4: Completely disable compaction and collision in edit mode

In `DashboardGrid.jsx`, update the `ResponsiveGridLayout` props:

```jsx
<ResponsiveGridLayout
  className="layout"
  layouts={layouts}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
  cols={{ lg: 24, md: 24, sm: 12, xs: 6 }}
  rowHeight={rowHeight}
  isDraggable={editMode}
  isResizable={editMode}
  onLayoutChange={handleLayoutChange}
  draggableHandle=".widget-drag-handle"
  compactType={null}
  preventCollision={false}
  allowOverlap={true}
  margin={[12, 12]}
  containerPadding={[0, 0]}
  useCSSTransforms={true}
  resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}
>
```

Key changes:
- `compactType={null}` — NO auto-compaction ever in edit mode
- `preventCollision={false}` — cards CAN overlap (Carlos positions them manually)
- `allowOverlap={true}` — explicitly allow overlapping (some versions of the library need this)
- `resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's']}` — ALL eight edges/corners are resize handles, not just corners

**For non-edit mode (normal viewing):**
When `editMode` is false, use `compactType="vertical"` so the layout compacts normally for viewing.

```jsx
compactType={editMode ? null : 'vertical'}
preventCollision={editMode ? false : true}
allowOverlap={editMode ? true : false}
```

### Step 1.5: Add overlap warning visuals

Detect when two cards overlap and highlight them with a red border.

Add overlap detection logic:

```jsx
// Inside DashboardGrid component
const [overlappingItems, setOverlappingItems] = useState(new Set());

const detectOverlaps = useCallback((layout) => {
  const overlaps = new Set();
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      const a = layout[i];
      const b = layout[j];
      // Check if rectangles overlap
      if (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      ) {
        overlaps.add(a.i);
        overlaps.add(b.i);
      }
    }
  }
  setOverlappingItems(overlaps);
}, []);

// Call detectOverlaps in onLayoutChange
const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
  setLayouts(allLayouts);
  if (editMode) {
    detectOverlaps(currentLayout);
  }
  if (onLayoutChange) {
    onLayoutChange(allLayouts);
  }
}, [onLayoutChange, editMode, detectOverlaps]);
```

Apply red border to overlapping cards:

```jsx
<div
  key={widget.id}
  className={`relative group ${
    editMode
      ? overlappingItems.has(widget.id)
        ? 'ring-2 ring-red-500 ring-offset-2 rounded-xl'   // RED = overlapping
        : 'ring-2 ring-lynx-sky/20 ring-offset-2 rounded-xl' // blue = normal
      : ''
  }`}
>
```

Also add a warning in the edit mode banner when overlaps exist:

```jsx
{editMode && overlappingItems.size > 0 && (
  <span className="text-red-500 font-bold text-r-sm ml-4">
    ⚠️ {overlappingItems.size / 2} overlapping cards
  </span>
)}
```

### Step 1.6: Update the grid overlay for 24 columns

The grid overlay CSS needs to render 24 columns instead of 12:

```jsx
{editMode && (
  <div className="dashboard-grid-overlay" style={{ gridTemplateColumns: 'repeat(24, 1fr)' }}>
    {Array.from({ length: 24 }, (_, i) => (
      <div key={i} className="grid-col" data-col={i + 1} />
    ))}
  </div>
)}
```

Also update the CSS in `src/index.css`:
```css
.dashboard-grid-overlay {
  ...
  grid-template-columns: repeat(24, 1fr);
  gap: 12px; /* match the updated margin */
}
```

Since 24 column labels would be too crowded, only show labels on every 4th column:
```css
.dashboard-grid-overlay .grid-col::before {
  content: attr(data-col);
  display: block;
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  color: rgba(75, 185, 236, 0.25);
  padding-top: 2px;
}
/* Hide labels on columns that aren't multiples of 4 */
.dashboard-grid-overlay .grid-col:not(:nth-child(4n))::before {
  visibility: hidden;
}
```

### Step 1.7: Reduce row height for finer vertical control

Change `rowHeight` from 40 to 20. This means each row unit is 20px instead of 40px, giving Carlos twice the vertical resolution. A card that was `h: 9` (360px) is now `h: 18` (360px) — same visual size, but Carlos can adjust in 20px increments instead of 40px.

**Update all widget defaultLayout `y` and `h` values:** multiply by 2 to maintain the same visual positions:

```
Old: { y: 0, h: 2 }   →  New: { y: 0, h: 4 }
Old: { y: 2, h: 9 }   →  New: { y: 4, h: 18 }
Old: { y: 4, h: 5 }   →  New: { y: 8, h: 10 }
```

**Rule: multiply every `y` and `h` value by 2.** Also multiply `minH` and `maxH` by 2. Then set all `minH` to 2 (= 40px minimum height, very small).

### Step 1.8: Verify

```bash
npx tsc --noEmit
```

Test as Admin:
- Enter edit mode
- Grid shows 24 columns (finer grid lines)
- Drag a card — OTHER cards do NOT move
- Cards CAN overlap — overlapping cards get red borders
- Warning shows in edit banner when overlaps exist
- Resize a card to very small (2 columns wide) — it allows it
- Quick Actions card can shrink to 2 columns wide
- Resize from any edge or corner, not just bottom-right
- Dimension labels update as you resize (e.g. "4×6" in 24-col units)
- Export Layout still works
- Reset still works
- Exit edit mode — cards compact vertically, no overlaps in view mode

Test as Coach and Parent — same checks.

**Commit:** `git add -A && git commit -m "phase 1: 24-col grid, free placement, overlap warnings, all-edge resize, lower minimums"`

---

## NOTES FOR CC

- **The column change from 12→24 requires updating EVERY widget's x, w, minW, maxW across ALL three dashboards.** Do not miss any. Search for `defaultLayout` in every file.
- **The row height change from 40→20 requires updating EVERY widget's y, h, minH, maxH across ALL three dashboards.**
- **The formula is simple: multiply all x, y, w, h, minW, minH, maxW, maxH by 2.** Then set all minW to 2 and all minH to 2.
- **`allowOverlap={true}` may not exist in all versions of react-grid-layout.** Check the installed version. If it's not supported, `preventCollision={false}` alone should allow overlapping. Test to confirm.
- **The overlap detection runs on every layout change.** It's O(n²) but n is small (< 20 widgets) so performance is fine.
- **In non-edit mode, compaction is STILL vertical** so the dashboard looks normal when not editing.
