# INVESTIGATION REPORT: Program Creation UX Overhaul
## Date: 2026-04-11
## Repo: SgtxTorque/volleybrain-admin (main branch)

## Summary

The current program creation flow uses a modal with a text input for name, an optional sport grid selector, a free-text emoji icon field, a numeric `display_order` input, and an `is_active` checkbox. The sport grid already exists in `ProgramFormModal.jsx` (dynamically loaded from the `sports` table via `useSport()`) and in `SetupWizard.jsx` (hardcoded 8-sport grid). There is no duplicate prevention, no drag-to-reorder, and the `display_order` field defaults to 0 for all new programs. The existing `react-grid-layout` library is installed but only used for dashboard widgets — a simpler list-based DnD approach (or CSS-only reorder) would be more appropriate for program ordering.

---

## Area 1: Current Program Creation Flow

### 1. Component that handles program creation

- **ProgramsPage**: `src/pages/settings/ProgramsPage.jsx` (223 lines) — manages program list, modal state, and CRUD operations
- **ProgramFormModal**: `src/pages/settings/ProgramFormModal.jsx` (182 lines) — the modal form component

### 2. Form fields

| Field | Type | Required | Default | Line (ProgramFormModal) |
|-------|------|----------|---------|------------------------|
| `name` | text input | Yes (red *) | `''` | 58-68 |
| `sport_id` | visual grid selector | No | `null` | 72-110 |
| `icon` | text input (emoji) | No | `''` | 113-125 |
| `description` | textarea (2 rows) | No | `''` | 127-137 |
| `display_order` | number input | No | `0` | 139-149 |
| `is_active` | checkbox | No | `true` | 150-159 |

### 3. Modal, inline form, or separate page?

**Modal** — fixed overlay (`fixed inset-0 bg-black/70`), max-w-lg (512px), centered. Opened by clicking "New Program" button in ProgramsPage header or empty state.

### 4. Insert payload

```javascript
// ProgramsPage.jsx:47-68
const cleaned = {
  name: form.name.trim(),
  sport_id: form.sport_id || null,
  icon: form.icon || null,
  description: form.description?.trim() || null,
  is_active: form.is_active,
  display_order: form.display_order || 0,
}

// For CREATE — adds organization_id:
await supabase.from('programs').insert({
  organization_id: organization.id,
  ...cleaned,
})

// For UPDATE — no organization_id:
await supabase.from('programs').update(cleaned).eq('id', editing.id)
```

### 5. Existing validation

- **Name required**: `missingName = !form.name?.trim()` — Submit button disabled when empty (line 35, 171)
- **No duplicate check**: No validation for duplicate program names or duplicate `sport_id` values
- **No max length**: No character limits on name or description
- **String trimming**: Name and description are `.trim()`'d before insert

### 6. After creation

```javascript
// ProgramsPage.jsx:73-78
showToast('Program created!', 'success')  // Toast notification
setShowModal(false)                        // Close modal
loadPrograms()                             // Refetch list from DB
refreshPrograms()                          // Update ProgramContext globally
```

On error: toast with error message, modal stays open.

---

## Area 2: Sports Table and Data

### 1. Sports table schema

From `DATABASE_SCHEMA.md`:
```
sports:
  id (uuid, PK)
  name
  icon
  description
  positions (jsonb — array of position names)
  stats_config (jsonb — stat categories for this sport)
  created_at
```

The code also references `color_primary`, `color_secondary`, `color_accent` columns (used in ProgramsPage line 167, ProgramFormModal line 96, ProgramContext line 52). These exist in the actual table but aren't documented in the schema file.

### 2. Sports currently available

**SetupWizard hardcoded list (8 sports):**

| Sport | Emoji | Color |
|-------|-------|-------|
| Volleyball | `🏐` | #FFB800 |
| Basketball | `🏀` | #EF6C00 |
| Soccer | `⚽` | #2E7D32 |
| Baseball | `⚾` | #C62828 |
| Softball | `🥎` | #E91E63 |
| Football | `🏈` | #6A1B9A |
| Lacrosse | `🥍` | #00838F |
| Other / Multiple | `🏐` | #546E7A |

**SetupSectionContent expanded list (12 sports):**

| Sport | Emoji |
|-------|-------|
| Volleyball | `volleyball` (Lucide ref) |
| Basketball | `🏀` |
| Soccer | `⚽` |
| Baseball | `⚾` |
| Softball | `🥎` |
| Flag Football | `🏈` |
| Swimming | `🏊` |
| Track & Field | `🏃` |
| Tennis | `🎾` |
| Golf | `⛳` |
| Cheerleading | `📣` |
| Gymnastics | `🤸` |

**sportConfigs.js** also defines configs for Hockey (`🏒`) and Flag Football (`🏳️`).

### 3. Existing sport grid/selector components

Two embedded sport selectors exist (not standalone):

1. **SetupWizard.jsx** (lines 680-730): Hardcoded 8-sport grid, 2-column layout, single-select, used during first-run setup
2. **ProgramFormModal.jsx** (lines 72-110): Dynamic grid loaded from `useSport()` context, 2-3 column responsive layout, single-select, includes "No Sport" option

No standalone `SportSelector` component exists.

### 4. Icon format

**Emoji only** — stored as unicode strings in the database `icon` column and rendered as `<span className="text-xl">{sport.icon}</span>`. No Lucide icons, SVGs, or image URLs are used for sport icons.

### 5. Reuse assessment

The **ProgramFormModal sport grid** (lines 72-110) is the best reuse candidate because:
- It's dynamic (loads from `useSport()` context, not hardcoded)
- It's responsive (2-3 column grid)
- It's theme-aware (uses `tc` classes and `isDark`)
- It includes a "No Sport" option

However, it's embedded inline in the modal and would need extraction into a standalone `SportGridSelector` component.

---

## Area 3: Existing Programs and Duplicate Detection

### 1. Where programs are loaded

**ProgramContext.jsx** (lines 48-56) — global state:
```javascript
const { data } = await supabase
  .from('programs')
  .select('*, sport:sports(id, name, icon, color_primary, code)')
  .eq('organization_id', organization.id)
  .eq('is_active', true)
  .order('display_order', { ascending: true })
```

**ProgramsPage.jsx** (lines 26-34) — settings page (includes inactive):
```javascript
const { data } = await supabase
  .from('programs')
  .select('*, sport:sports(id, name, icon, color_primary), seasons:seasons(count)')
  .eq('organization_id', organization.id)
  .order('display_order', { ascending: true })
```

### 2. Data available per program

```javascript
{
  id: UUID,
  name: string,
  sport_id: UUID | null,
  organization_id: UUID,
  icon: string | null (emoji),
  description: string | null,
  is_active: boolean,
  display_order: number,
  sport: { id, name, icon, color_primary, code } | null,  // joined
  seasons: [{ count: number }],                             // aggregate (ProgramsPage only)
}
```

### 3. Sidebar program rendering

**LynxSidebar.jsx** — `ProgramsSidebarSection` (lines 270-465):
- Uses `useProgram()` to get `programs` array (already sorted by `display_order`)
- Displays: `program.icon || program.sport?.icon || '📋'` + `program.name`
- Nested seasons shown under each program, sorted by status priority
- Orphaned seasons (no `program_id`) shown separately with warning icon

### 4. Program management page

**ProgramsPage.jsx** at `/settings/programs`:
- Navy header with total count, active/inactive split
- "New Program" button (top right)
- Vertical card list, each showing: icon, name, sport, season count, description, active badge
- Per-card actions: Edit (pencil) + Delete (trash)
- Delete guarded: checks for seasons before allowing deletion

### 5. Duplicate prevention feasibility

Easy to implement. From loaded programs:
```javascript
const usedSportIds = new Set(
  programs.filter(p => p.sport_id && p.id !== editingProgram?.id).map(p => p.sport_id)
)
```
Then in the sport grid, check `usedSportIds.has(sport.id)` to grey out already-used sports.

---

## Area 4: Display Order and Reorder

### 1. How display_order is set during creation

**Manual number input** in ProgramFormModal.jsx (lines 139-149) — a bare `<input type="number">` field. Default value is `0` for all new programs. No auto-increment logic exists.

The SetupWizard also sets `display_order: 0` for starter programs (lines 309, 325, 342).

### 2. How display_order is used in queries

All program queries use `ORDER BY display_order ASC`:
- `ProgramContext.jsx:56`: `.order('display_order', { ascending: true })`
- `ProgramsPage.jsx:32`: `.order('display_order', { ascending: true })`
- `RegistrationCartPage.jsx:1547`: `.order('display_order', { ascending: true })`
- `PlayerComponents.jsx:620`: `.order('display_order')`

### 3. Drag-and-drop library

**`react-grid-layout` v2.2.2** is installed in package.json. However, it's a 2D grid layout library designed for dashboard widget grids, NOT a simple list reorder library. It's used only in the archived `DashboardGrid.jsx`.

No other DnD libraries are installed:
- react-beautiful-dnd: NOT installed
- @dnd-kit: NOT installed
- react-sortable-hoc: NOT installed

### 4. Reorder save pattern

A batch update would look like:
```javascript
const promises = reorderedPrograms.map((prog, index) =>
  supabase.from('programs').update({ display_order: index + 1 }).eq('id', prog.id)
)
await Promise.all(promises)
showToast('Programs reordered!', 'success')
loadPrograms()
refreshPrograms()
```

### 5. Existing reorder patterns

The archived `DashboardGrid.jsx` has an edit-mode toggle + drag-to-rearrange + persist pattern:
- Edit mode toggle enables/disables dragging
- On exit from edit mode, layout is saved to Supabase
- Toast confirmation shown on save
- Data reloaded after save

This pattern could be adapted, but `react-grid-layout` is overkill for a simple vertical list reorder. A simpler approach would be:
- **Option A**: CSS-based with up/down arrow buttons (no new dependency)
- **Option B**: Install `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, modern DnD — ~15KB)
- **Option C**: Native HTML5 drag-and-drop (no dependency, but less polished)

---

## Area 5: SetupWizard Sport Selector (Reuse Candidate)

### 1. Sport grid layout

**File**: `src/pages/auth/SetupWizard.jsx` (lines 680-704)

```jsx
<div className="grid grid-cols-2 gap-3 mb-6">
  {sports.map(sport => (
    <button className="p-4 rounded-[14px] text-left transition-all"
      style={{
        background: selected ? `${sport.color}20` : '#FAFBFC',
        border: selected ? `2px solid ${sport.color}` : '2px solid #E8ECF2',
      }}>
      <span className="text-3xl block mb-1">{sport.emoji}</span>
      <span className="text-sm font-bold">{sport.name}</span>
    </button>
  ))}
</div>
```

- 2-column grid, 3-unit gap, rounded-[14px] cards
- Selected: semi-transparent color tint + colored border
- Unselected: light gray bg (#FAFBFC) + gray border (#E8ECF2)

### 2. Available sports

8 sports (hardcoded): Volleyball, Basketball, Soccer, Baseball, Softball, Football, Lacrosse, Other/Multiple

### 3. Single-select or multi-select?

**Single-select** — `const [selectedSport, setSelectedSport] = useState(null)`. Clicking a sport replaces the previous selection.

### 4. Storage

- State: `selectedSport` (string ID like `'volleyball'`)
- Saved to: `organizations.settings.enabled_sports` (array) and creates a starter program in the `programs` table
- If "Other" selected: custom program name input appears, `sport_id` set to null

### 5. Reusability assessment

**Partially reusable, but building new is better.** The SetupWizard grid:
- Uses hardcoded sport list (not from DB)
- Is deeply embedded in the wizard step flow
- Has wizard-specific state management
- Doesn't support disabled/greyed-out sports

The **ProgramFormModal** sport grid (lines 72-110) is a better starting point:
- Dynamic (loads from `useSport()` context)
- Already used in program creation context
- Responsive (2-3 columns)
- Theme-aware

**Recommendation**: Extract the ProgramFormModal sport grid into a new `SportGridSelector` component, then enhance it with:
- Disabled state for already-used sports (greyed out + checkmark)
- "Custom" tile at the end
- Sport-specific colors for selected state (instead of uniform cyan)

### 6. Icon source

**Hardcoded** in SetupWizard. **Dynamic from DB** in ProgramFormModal (via `useSport()` which queries `sports` table).

---

## Area 6: Program Page Layout

### 1. Current page layout

**ProgramsPage.jsx** (`/settings/programs`) — 223 lines:
- **Header**: Navy card with title, subtitle, total/active/inactive counts
- **Program list**: Vertical card stack with left color border (sport color)
- **Each card**: Icon (2em), name (bold), sport name, season count, description (truncated), inactive badge
- **Empty state**: Layers icon + text + "Create Program" CTA
- **Loading**: Centered spinner

### 2. Add Program button

Two locations:
1. **PageShell actions** (line 113): `<Plus /> New Program` button in top-right header
2. **Empty state** (line 153): `Create Program` button in center of empty state card

### 3. Actions per program

| Action | UI Element | Handler |
|--------|-----------|---------|
| Edit | Pencil icon button | `openEdit(program)` → opens ProgramFormModal with data |
| Delete | Trash icon button | `handleDelete(program)` → checks seasons → confirm → delete |

**Missing**: No reorder, no archive, no inline toggle, no quick-navigate to program detail.

### 4. Edit UX

**Modal-based** — same `ProgramFormModal` component used for create and edit. Pre-fills form with existing program data. Edit title changes to "Edit Program", submit button says "Save Changes".

### 5. What needs to change

| Keep | Change |
|------|--------|
| Overview header design | Sport grid selector (replace text name input with sport tiles) |
| Empty state component | Duplicate prevention (grey out used sports) |
| Delete with season guard | Custom program option (tile + name input + icon picker) |
| Toast notifications | Kill display_order dropdown (replace with drag-to-reorder) |
| Theme support | Add drag handles to program list |
| Modal structure | Icon picker (replace free-text emoji input with curated grid) |
| Program card rendering | Auto-fill program name from sport selection |

---

## Area 7: Toast System

### 1. System type

**Custom React component** — no external library. Built from scratch with:
- `src/components/ui/Toast.jsx` (135 lines)
- `useToast` hook (in same file or ui barrel export)

### 2. How it's called

```javascript
// Import
import { ToastContainer, useToast } from './components/ui'

// Hook
const { toasts, showToast, removeToast } = useToast()

// Call signature
showToast(message, type, duration)
// message: string (required)
// type: 'success' | 'error' | 'warning' | 'info' (default: 'success')
// duration: number in ms (default: 4000)
```

### 3. Example usages

```javascript
// ProgramsPage.jsx:73 — success after creation
showToast('Program created!', 'success')

// ProgramsPage.jsx:60 — error on update failure
showToast(`Error updating program: ${error.message}`, 'error')

// JerseysPage.jsx:284 — info notification
showToast('All players have jerseys assigned', 'info')
```

Toast features: stacking (up to 5), slide-in/out animations (350ms/300ms), progress bar, hover-pause, manual close button. Types are color-coded: success (emerald), error (red), warning (amber), info (sky).

---

## Recommended Approach

### Sport Grid Selector
**Build a new `SportGridSelector` component** by extracting and enhancing the ProgramFormModal grid (lines 72-110). It should:
- Accept `sports`, `selectedSportId`, `onSelect`, `usedSportIds`, `showCustom` props
- Load sports dynamically from `useSport()` context
- Grey out + overlay checkmark on sports with IDs in `usedSportIds`
- Include a "Custom" tile at the end that triggers a name input + icon picker
- Use sport-specific `color_primary` for selected state (not uniform cyan)

### Duplicate Prevention
- On ProgramFormModal mount, compute `usedSportIds` from existing programs (exclude the currently-editing program)
- Pass to `SportGridSelector` to visually disable used sports
- Make them non-clickable with reduced opacity + "Already created" tooltip

### Custom Program
- "Custom" tile opens: program name text input + curated icon picker grid (12-16 emoji options like 🏆🎯⭐🏅🎪🏋️🤼🏊🎾⛳📣🤸🏒🥊🏑🏄)
- No need for a full emoji keyboard — just a simple grid of pre-selected emoji

### Display Order / Reorder
**Recommended: Up/Down arrow buttons (no new dependency)**
- Add up/down arrow buttons to each program card in the list
- On click: swap `display_order` values with adjacent program, batch update to Supabase
- Simpler than drag-and-drop, zero new dependencies, works on mobile
- If drag-and-drop is strongly preferred: install `@dnd-kit/core` + `@dnd-kit/sortable` (~15KB, modern, accessible)
- Do NOT use `react-grid-layout` — it's a 2D grid system, overkill for vertical list reorder

### Toast
- Already works perfectly. Use existing `showToast('Volleyball program created!', 'success')` pattern.

### Estimated complexity
- **3-4 files modified**, **1 new file** created
- **Medium complexity** — mostly UI restructuring, no schema changes, no new dependencies needed

---

## Files That Will Need Changes

| File | Changes |
|------|---------|
| `src/pages/settings/ProgramFormModal.jsx` | **Major rewrite**: Replace name input with sport grid selector as primary flow. Auto-fill name from sport. Replace free-text emoji input with curated icon picker grid. Remove `display_order` number input. Add duplicate sport prevention. Add "Custom" program flow. |
| `src/pages/settings/ProgramsPage.jsx` | **Moderate changes**: Add reorder UI (up/down arrows or drag handles) to program cards. Pass `usedSportIds` to modal. Add batch reorder save function. |
| `src/components/ui/SportGridSelector.jsx` | **New file**: Extracted sport grid with disabled state, custom tile, sport-specific colors. Reusable by ProgramFormModal and potentially other components. |
| `src/pages/settings/ProgramFormModal.jsx` → icon section | **Replace**: Free-text emoji input → curated icon picker grid (12-16 options). Only shown for "Custom" programs (sport-linked programs auto-use sport icon). |
| `src/contexts/ProgramContext.jsx` | **No changes needed** — already provides `programs` array with `sport_id` for duplicate detection. |
| `src/components/layout/LynxSidebar.jsx` | **No changes needed** — already renders programs in `display_order` order. |
