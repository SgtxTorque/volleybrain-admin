# CC-WIDGET-PERSISTENCE — Save Dashboard Layouts to Supabase

**Spec Author:** Claude Opus 4.6
**Date:** March 7, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Supabase Project:** `uqpjvbiuokwpldjvxiby`

---

## CONTEXT

Dashboard widget layouts currently reset on page refresh. Carlos has arranged all four dashboards (Admin, Coach, Parent, Player) using the drag-and-drop grid editor, but those arrangements are lost when the browser refreshes. This spec adds Supabase persistence so layouts save per user and load automatically.

---

## RULES

1. Read every file before modifying
2. Commit after each phase
3. TSC verify after each phase
4. Do not break existing grid functionality
5. Schema changes via SQL migration (not raw queries)

---

## PHASE 1: Create Database Table

### Step 1.1: Create the table

Create a Supabase migration or run SQL to create the `user_dashboard_layouts` table:

```sql
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,  -- 'admin', 'coach', 'parent', 'player'
  layout JSONB NOT NULL,  -- the react-grid-layout positions array
  active_widgets JSONB,  -- array of widget IDs currently on the grid
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)  -- one layout per user per role
);

-- Enable RLS
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own layouts
CREATE POLICY "Users can read own layouts"
  ON user_dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layouts"
  ON user_dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layouts"
  ON user_dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own layouts"
  ON user_dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_dashboard_layouts_user_role ON user_dashboard_layouts(user_id, role);
```

### Step 1.2: Add the migration file

Save the SQL to `supabase/migrations/` with a timestamped filename:

```bash
mkdir -p supabase/migrations
echo "[SQL above]" > supabase/migrations/$(date +%Y%m%d%H%M%S)_create_dashboard_layouts.sql
```

### Step 1.3: Run the migration

```bash
# If using Supabase CLI:
npx supabase db push
# Or if running locally:
npx supabase migration up
# Or just apply directly if those don't work — check the project's existing migration pattern first:
grep -r "supabase" package.json | head -5
find supabase -name "*.sql" | head -10
```

If the project doesn't use Supabase CLI migrations, check how other tables were created and follow the same pattern. The table may need to be created directly in the Supabase dashboard SQL editor — in that case, log the SQL and note it needs to be run manually.

**Commit:** `git add -A && git commit -m "phase 1: user_dashboard_layouts table with RLS"`

---

## PHASE 2: Create Layout Service

### Step 2.1: Create a layout persistence service

`src/lib/layoutService.js`

```js
import { supabase } from './supabase';  // adjust import path to match existing pattern

/**
 * Save a dashboard layout for the current user + role.
 * Upserts — creates if new, updates if exists.
 */
export async function saveLayout(role, layout, activeWidgets) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .upsert({
      user_id: user.id,
      role,
      layout: layout,
      active_widgets: activeWidgets,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,role',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save layout:', error);
    return null;
  }
  return data;
}

/**
 * Load the saved layout for the current user + role.
 * Returns null if no saved layout exists (use defaults).
 */
export async function loadLayout(role) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_dashboard_layouts')
    .select('layout, active_widgets')
    .eq('user_id', user.id)
    .eq('role', role)
    .single();

  if (error) {
    // No saved layout — not an error, just use defaults
    if (error.code === 'PGRST116') return null;
    console.error('Failed to load layout:', error);
    return null;
  }
  return data;
}

/**
 * Delete the saved layout (reset to defaults).
 */
export async function resetLayout(role) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_dashboard_layouts')
    .delete()
    .eq('user_id', user.id)
    .eq('role', role);
}
```

### Step 2.2: Check the existing Supabase import pattern

```bash
grep -r "from.*supabase\|import.*supabase" src/lib/ --include="*.js" --include="*.jsx" --include="*.ts" | head -5
```

Match the import path and client setup used elsewhere in the codebase.

**Commit:** `git add -A && git commit -m "phase 2: layout persistence service — save, load, reset"`

---

## PHASE 3: Wire Into DashboardGrid

### Step 3.1: Read the DashboardGrid component

```bash
cat src/components/layout/DashboardGrid.jsx
```

### Step 3.2: Add load on mount

When the DashboardGrid mounts, check for a saved layout:

```jsx
import { saveLayout, loadLayout, resetLayout } from '../../lib/layoutService';

// Add role prop to DashboardGrid
export default function DashboardGrid({
  widgets,
  editMode,
  onLayoutChange,
  role,  // 'admin', 'coach', 'parent', 'player'
  columns = 24,
  rowHeight = 20,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [layouts, setLayouts] = useState(null);
  const [activeWidgets, setActiveWidgets] = useState(widgets);

  // Load saved layout on mount
  useEffect(() => {
    async function load() {
      const saved = await loadLayout(role);
      if (saved) {
        // Use saved layout
        setLayouts({ lg: saved.layout });
        // If saved has active_widgets, filter widgets to only those
        if (saved.active_widgets) {
          const savedIds = new Set(saved.active_widgets);
          setActiveWidgets(widgets.filter(w => savedIds.has(w.id)));
        }
      } else {
        // Use defaults from widgets prop
        const defaultLayout = widgets.map(w => ({
          i: w.id,
          x: w.defaultLayout.x,
          y: w.defaultLayout.y,
          w: w.defaultLayout.w,
          h: w.defaultLayout.h,
          minW: w.minW || 2,
          minH: w.minH || 2,
        }));
        setLayouts({ lg: defaultLayout });
        setActiveWidgets(widgets);
      }
      setIsLoading(false);
    }
    load();
  }, [role]);  // reload if role changes

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-40 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // ... rest of the component
}
```

### Step 3.3: Add auto-save when editing

Save the layout automatically when the user clicks "Done Editing":

```jsx
const handleDoneEditing = async () => {
  // Save current layout to Supabase
  const currentLayout = layouts.lg || [];
  const currentWidgetIds = activeWidgets.map(w => w.id);
  await saveLayout(role, currentLayout, currentWidgetIds);
  // Show confirmation toast
  console.log('Layout saved!');
};
```

Wire this to the "Done Editing" button. When the user exits edit mode, the layout persists.

Also save when "Export Layout" is clicked (in addition to copying to clipboard).

### Step 3.4: Update the "Reset" button

The "Reset" button should:
1. Delete the saved layout from Supabase
2. Restore the default layout from the widget props
3. Show confirmation: "Layout reset to defaults"

```jsx
const handleReset = async () => {
  await resetLayout(role);
  // Restore defaults
  const defaultLayout = widgets.map(w => ({
    i: w.id,
    x: w.defaultLayout.x,
    y: w.defaultLayout.y,
    w: w.defaultLayout.w,
    h: w.defaultLayout.h,
    minW: w.minW || 2,
    minH: w.minH || 2,
  }));
  setLayouts({ lg: defaultLayout });
  setActiveWidgets(widgets);
};
```

### Step 3.5: Handle widget add/remove persistence

When a widget is added or removed via the library panel, the active widget list changes. This should be included in the save:

```jsx
const handleAddWidget = (widgetDef) => {
  // ... existing add logic ...
  // The new widget list will be saved when "Done Editing" is clicked
};

const handleRemoveWidget = (widgetId) => {
  // ... existing remove logic ...
  // Will be saved when "Done Editing" is clicked
};
```

### Step 3.6: Pass role prop from each dashboard

Find each dashboard file (Admin, Coach, Parent, Player) and pass the `role` prop to DashboardGrid:

```bash
grep -r "DashboardGrid" src/ --include="*.jsx" -l
```

For each file, add `role="admin"` / `role="coach"` / `role="parent"` / `role="player"` to the DashboardGrid component.

### Step 3.7: Add a save confirmation toast

When the layout saves, show a brief toast notification. Check if the app has an existing toast system:

```bash
grep -r "toast\|Toast\|Toaster\|notification" src/ --include="*.jsx" -l | head -10
```

If a toast system exists, use it. If not, add a simple fade-in/fade-out message:

```jsx
const [showSaveToast, setShowSaveToast] = useState(false);

const handleDoneEditing = async () => {
  await saveLayout(role, layouts.lg, activeWidgets.map(w => w.id));
  setShowSaveToast(true);
  setTimeout(() => setShowSaveToast(false), 2500);
};

// In the render:
{showSaveToast && (
  <div className="fixed bottom-20 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg font-bold text-r-sm animate-fadeIn">
    ✓ Layout saved
  </div>
)}
```

**Commit:** `git add -A && git commit -m "phase 3: wire persistence — load on mount, save on done editing, reset deletes saved"`

---

## PHASE 4: Verify

### Step 4.1: Test the full save/load cycle

For each role (Admin, Coach, Parent, Player):

1. Open the dashboard — should load default layout (no saved layout yet)
2. Click "Edit Layout"
3. Move some cards around, resize a few, add a widget from the library
4. Click "Done Editing" — should see "Layout saved" toast
5. **Refresh the page** — layout should persist exactly as arranged
6. Move more cards, click "Done Editing" again — saves update
7. Refresh — updated layout persists
8. Click "Edit Layout" → "Reset" → "Done Editing" — should return to defaults
9. Refresh — defaults load (saved layout was deleted)

### Step 4.2: Test role isolation

1. Arrange admin dashboard, save
2. Switch to coach role — coach dashboard should have ITS default (or saved) layout, NOT the admin layout
3. Arrange coach dashboard differently, save
4. Switch back to admin — admin layout is still the admin arrangement
5. Each role has independent saved layouts

### Step 4.3: Test new user experience

Log in as a different user (or clear the layout for the current user). The dashboard should load with the hardcoded defaults — no errors, no empty screen.

### Step 4.4: Check RLS

Verify that one user cannot see another user's layouts:

```bash
# In Supabase SQL editor or via the app:
# User A saves a layout
# User B should NOT be able to read User A's layout
# The RLS policies enforce this
```

```bash
npx tsc --noEmit
npm run build
```

**Commit:** `git add -A && git commit -m "phase 4: persistence verified — save/load/reset works across all roles"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 1 | Database table | `user_dashboard_layouts` with RLS |
| 2 | Layout service | save, load, reset functions |
| 3 | Wire to DashboardGrid | Load on mount, save on done editing, reset, toast |
| 4 | Verify | Full save/load cycle, role isolation, RLS |

**Total phases:** 4

---

## NOTES FOR CC

- **The table uses UPSERT with `onConflict: 'user_id,role'`.** This means each user gets exactly one layout per role. Saving always overwrites the previous layout.
- **Loading returns null if no saved layout exists.** This is not an error — it means the user hasn't customized yet and should see defaults.
- **The layout column stores the react-grid-layout position array** as JSONB: `[{ i: "widget-id", x: 0, y: 0, w: 12, h: 6 }, ...]`
- **The active_widgets column stores the list of widget IDs** currently on the grid: `["welcome-banner", "org-health-hero", "season-journey", ...]`. This tracks which widgets were added/removed.
- **Save happens on "Done Editing" click, NOT on every drag.** Saving on every drag would spam the database. One save at the end of an editing session.
- **The skeleton loader** prevents a flash of default layout before the saved layout loads. The grid shows a pulse animation for ~200ms while the Supabase query runs.
- **RLS is critical.** Users must only access their own layouts. The policies use `auth.uid() = user_id`.
- **Check the existing Supabase client setup** before creating a new one. The project already has a configured Supabase client — use that same import.
