# CC-STAFF-PORTAL-REDESIGN.md
# Staff Portal Redesign — Unified Coaches + Staff/Volunteers Page

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/coaches/CoachesPage.jsx` (992 lines)
5. `src/pages/staff/StaffPage.jsx` (442 lines)
6. `src/pages/coaches/EmailCoachesModal.jsx` (191 lines)
7. `src/pages/coaches/InviteCoachModal.jsx` (249 lines)
8. `src/MainApp.jsx` — routing at lines 701-702, nav items at lines 903-904

## SCOPE
Merge the Coach Directory and Staff & Volunteers pages into a single **Staff Portal** page. The new page loads data from BOTH `coaches` and `staff_members` Supabase tables and presents all org personnel in one unified view with tabs to filter by type (All, Head Coaches, Assistants, Staff, Volunteers).

Two view modes: **Grid** (Roster Board photo cards) and **List** (compact rows with detail panel on the right).

**This is a structural redesign that merges two pages.** The old `/coaches` and `/staff` routes should BOTH point to the new unified page. The old page files are NOT deleted — they remain in the codebase as reference. The new page is built as a new file.

---

## ELEMENT PRESERVATION CONTRACT

**Every interactive element from BOTH existing pages must survive in the unified page. They can be MOVED, RESTYLED, or COMBINED. They CANNOT be removed.**

### From CoachesPage — Action Buttons:
- **Export** (`exportCoachesCSV`) — CSV export of coaches
- **Email All** (`setShowEmailBlast`) — opens EmailCoachesModal
- **Invite** (`setShowInviteCoach`) — opens InviteCoachModal
- **Add Coach** (`setShowAddModal` with `editingCoach=null`) — opens CoachFormModal

### From CoachesPage — Filters:
- **Season/Sport filter bar** (SeasonFilterBar)
- **Search** (`searchTerm` / `setSearchTerm`)
- **Status filter** (`filterStatus` — active/inactive/all)

### From CoachesPage — Card/Row Interactions:
- **Coach card click → view detail** (`setSelectedCoachForDetail`)
- **Edit coach** (`setEditingCoach` + `setShowAddModal`)
- **Assign to team** (`setAssigningCoach`)
- **Toggle status** (active/inactive via `toggleCoachStatus`)
- **Delete coach** (`deleteCoach`)
- **3-dot menu** per card/row with: View Detail, Edit, Assign Teams, Toggle Status, Delete

### From CoachesPage — Modals:
1. `CoachFormModal` (inline component) — add/edit coach with 4-step form
2. `AssignTeamsModal` (inline component) — team assignment
3. `CoachDetailModal` (inline component) — full detail view
4. `EmailCoachesModal` — bulk email
5. `InviteCoachModal` — send invite

### From CoachesPage — Data Functions:
- `loadCoaches()` — from `coaches` table + `team_coaches` join
- `saveCoach()` — insert/update `coaches`
- `deleteCoach()` — delete from `coaches`
- `toggleCoachStatus()` — update status
- `saveAssignments()` — manage `team_coaches`
- `exportCoachesCSV()` — CSV export

### From StaffPage — Action Buttons:
- **Add Staff** (`setShowAddModal`) — opens StaffFormModal

### From StaffPage — Filters:
- **Season/Sport filter bar** (SeasonFilterBar)
- **Search** (`searchTerm` / `setSearchTerm`)
- **Role filter** (`filterRole` — Board Member, Team Parent, Scorekeeper, etc.)

### From StaffPage — Card/Row Interactions:
- **Edit staff** (`setEditingStaff` + `setShowAddModal`)
- **Toggle status** (active/inactive via `toggleStaffStatus`)
- **Delete staff** (`deleteStaff`)

### From StaffPage — Modals:
1. `StaffFormModal` (inline component) — add/edit staff member

### From StaffPage — Data Functions:
- `loadStaff()` — from `staff_members` table
- `saveStaff()` — insert/update `staff_members`
- `deleteStaff()` — delete from `staff_members`
- `toggleStaffStatus()` — update status

### Stat Overview (combine from both):
- Total Active (coaches + staff combined)
- # Head Coaches (from coaches where assignment role = head)
- # Assistants (from coaches where assignment role = assistant)
- # Staff/Volunteers (from staff_members)
- BG Checks status (combined compliance from both tables)
- # Assigned to teams (coaches with team_coaches entries + staff with team assignments)

---

## PHASE 1: Create the Unified StaffPortalPage

**File:** `src/pages/staff-portal/StaffPortalPage.jsx` (NEW)
**Edit contract:** New file. Loads data from BOTH `coaches` and `staff_members` tables. Renders unified view.

### Layout:
```
┌───────────────────────────────────────────────────────────────────┐
│  NAVY HEADER BAR (dark bg, full width)                            │
│  Overview stats: Total Active | Coaches | Staff | Assigned | BG   │
├───────────────────────────────────────────────────────────────────┤
│  Filter row: [Season/Sport] [Search...] [Type tabs] [Grid/List] [Actions] │
├─────────────────────────────────────────────┬─────────────────────┤
│  MAIN CONTENT (flex-1)                      │ DETAIL PANEL        │
│                                             │ (~340px, shows when │
│  Grid view: Photo cards in 3-col grid       │  person selected)   │
│  -OR-                                       │                     │
│  List view: Compact rows                    │ Photo + name        │
│                                             │ Role + team         │
│                                             │ Contact info        │
│                                             │ Credentials         │
│                                             │ Team assignments    │
│                                             │ Quick actions       │
└─────────────────────────────────────────────┴─────────────────────┘
```

### A. Navy Overview Header:
A dark navy bar at the very top of the content area (below PageShell header) with overview stats in white text:
```jsx
<div className="bg-[#10284C] rounded-2xl p-6 mb-6 flex items-center gap-8" style={{ fontFamily: 'var(--v2-font)' }}>
  {overviewStats.map(stat => (
    <div key={stat.label} className="text-center">
      <div className="text-2xl font-black text-white">{stat.value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{stat.label}</div>
    </div>
  ))}
</div>
```

### B. Type tabs (from Roster Board):
```jsx
// Tabs: All | Head Coaches | Assistants | Staff | Volunteers
const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'head_coach', label: 'Head Coaches' },
  { key: 'assistant', label: 'Assistants' },
  { key: 'staff', label: 'Staff' },
  { key: 'volunteer', label: 'Volunteers' },
]
```

### C. Combined data loading:
Load from BOTH tables and normalize into a unified array:
```javascript
// Each person in the unified list has:
{
  id: string,
  source: 'coach' | 'staff',  // which table they came from
  firstName: string,
  lastName: string,
  fullName: string,
  email: string,
  phone: string,
  role: string,  // 'Head Coach', 'Assistant', 'Board Member', 'Scorekeeper', etc.
  roleCategory: string,  // 'head_coach', 'assistant', 'staff', 'volunteer'
  status: 'active' | 'inactive',
  teams: [{ id, name, color }],
  backgroundCheck: string,  // 'not_started', 'pending', 'cleared', 'failed'
  photoUrl: string | null,
  // Original data preserved for edit/delete operations
  _raw: originalRecord,
}
```

### D. Grid View (Roster Board style):
Photo cards in a responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile):
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
  {filteredPeople.map(person => (
    <PersonCard key={person.id} person={person} isSelected={...} onClick={...} onMenu={...} />
  ))}
  {/* Add New Staff card (dashed border) */}
  <button onClick={() => setShowAddModal(true)} className="...dashed border card...">
    <Plus /> Add Staff Member
  </button>
</div>
```

Each card (inspired by Roster Board):
- Photo area (or initials avatar) with role pill badge overlaid in top-right ("HEAD COACH", "TEAM PARENT", etc.)
- Name bold below photo
- Team name(s) below name
- Compliance dot + status at bottom (green = Fully Compliant, amber = Review Required)
- Team color bar at bottom edge of card
- 3-dot menu
- **Selected state:** light sky-blue background + navy border (from War Room)

### E. List View:
Compact rows in a table-like layout:
- Avatar, Name + role, Team assignment pills, Contact (email/phone), BG check status, 3-dot menu
- Clicking a row selects it and opens the right detail panel

### F. View toggle (Grid/List):
Two icon buttons to switch between grid and list:
```jsx
<div className="flex items-center gap-1 p-1 rounded-lg bg-[#F5F6F8]">
  <button onClick={() => setViewMode('grid')} className={...}><Grid className="w-4 h-4" /></button>
  <button onClick={() => setViewMode('list')} className={...}><List className="w-4 h-4" /></button>
</div>
```

### G. Action buttons:
Place in the filter row on the right side:
- **Export** (exports coaches + staff combined)
- **Email All** (opens EmailCoachesModal, targets coaches only for now)
- **Invite** (opens InviteCoachModal)
- **+ Add Person** dropdown with: Add Coach, Add Staff Member (opens the appropriate form modal)

### Commit:
```bash
git add src/pages/staff-portal/StaffPortalPage.jsx
git commit -m "Phase 1: StaffPortalPage — unified coaches + staff with grid/list views"
```

---

## PHASE 2: Build the PersonCard Component

**File:** `src/pages/staff-portal/PersonCard.jsx` (NEW)
**Edit contract:** New file only.

### Component:
The Roster Board grid card. Receives a unified person object. Shows photo/avatar, name, role pill, team, compliance status, 3-dot menu. Selected state with sky-blue tint + navy border.

```jsx
export default function PersonCard({ person, isSelected, onClick, onEdit, onAssign, onToggleStatus, onDelete, onDetail }) {
  // Card with:
  // - Photo area (200px tall) with role pill badge overlay
  // - Name (extrabold) + team name below
  // - Compliance dot + status label
  // - Team color bottom bar
  // - 3-dot menu dropdown
  // - Selected state styling
}
```

### Commit:
```bash
git add src/pages/staff-portal/PersonCard.jsx
git commit -m "Phase 2: PersonCard component — Roster Board style staff card"
```

---

## PHASE 3: Build the PersonDetailPanel Component

**File:** `src/pages/staff-portal/PersonDetailPanel.jsx` (NEW)
**Edit contract:** New file only.

### Component:
The right-column detail panel (from Compliance Dashboard concept). Shows when a person is selected. Receives person data as props.

Sections:
1. **Header:** Large photo/avatar + full name + staff ID/role + close button
2. **Action alert** (if needed): "BG Check expires in X days" — amber warning
3. **Credentials checklist:** Background check, waivers, conduct — each with status icon (green check / amber pending / red missing) and action button
4. **Team assignments:** List of team pills with colors. "Assign to Team" button.
5. **Contact info:** Email, phone
6. **Quick actions:** Edit, Assign to Team, Toggle Active/Inactive, Email, Delete — as styled buttons

All action buttons connect to parent-provided callbacks (onEdit, onAssign, etc.).

### Commit:
```bash
git add src/pages/staff-portal/PersonDetailPanel.jsx
git commit -m "Phase 3: PersonDetailPanel — right-column staff detail panel"
```

---

## PHASE 4: Migrate Modal Components

**File:** `src/pages/staff-portal/StaffPortalPage.jsx` (MODIFY)
**Edit contract:** Import and render all modals from both existing pages. Do NOT rewrite the modals — import them from their existing locations.

### Changes:
- Import `CoachFormModal`, `AssignTeamsModal`, `CoachDetailModal` from CoachesPage (these are inline in CoachesPage — extract them to shared files OR copy them into the new page)
- Import `StaffFormModal` from StaffPage (also inline — same approach)
- Import `EmailCoachesModal` from `../coaches/EmailCoachesModal`
- Import `InviteCoachModal` from `../coaches/InviteCoachModal`

**IMPORTANT:** The CoachFormModal, AssignTeamsModal, CoachDetailModal, and StaffFormModal are currently defined INSIDE their respective page files (not separate files). To use them in the new StaffPortalPage, you have two options:

**Option A (preferred):** Extract them into shared files under `src/pages/staff-portal/modals/`:
- `CoachFormModal.jsx`
- `AssignTeamsModal.jsx`
- `CoachDetailModal.jsx`
- `StaffFormModal.jsx`

Copy them exactly as-is from the old pages. Do not modify their internal logic.

**Option B:** Import the old page files and use the modals from there (messier, not recommended).

Wire up the add flow:
- "Add Coach" opens CoachFormModal with coach-specific fields
- "Add Staff" opens StaffFormModal with staff-specific fields
- Both save to their respective tables and refresh the unified list

### Commit:
```bash
git add src/pages/staff-portal/
git commit -m "Phase 4: Migrate all modals to StaffPortal — coach form, staff form, assign teams, email, invite"
```

---

## PHASE 5: Update Routing + Navigation

**File:** `src/MainApp.jsx` + `src/lib/routes.js`
**Edit contract:** Update routes and nav items. MINIMAL changes. Do not reorganize other routes.

### Changes in `src/lib/routes.js`:
- Change the label for `/coaches` route to "Staff Portal" (or keep both routes pointing to new page)
- Add: `'staff-portal': '/staff-portal'` if creating new route
- OR: Have both `/coaches` and `/staff` render the same `StaffPortalPage` component

### Changes in `src/MainApp.jsx`:
**Route changes (around lines 701-702):**
```jsx
// BEFORE:
<Route path="/coaches" element={<RouteGuard allow={['admin', 'coach']}><CoachesPage showToast={showToast} /></RouteGuard>} />
<Route path="/staff" element={<RouteGuard allow={['admin']}><StaffPage showToast={showToast} /></RouteGuard>} />

// AFTER:
<Route path="/coaches" element={<RouteGuard allow={['admin', 'coach']}><StaffPortalPage showToast={showToast} /></RouteGuard>} />
<Route path="/staff" element={<RouteGuard allow={['admin']}><StaffPortalPage showToast={showToast} /></RouteGuard>} />
```

Both routes render the same component. Coach role users see the same page but may have limited actions (no staff management).

**Nav items (around lines 903-904):**
Consolidate into one nav item:
```jsx
// BEFORE:
{ id: 'coaches', label: 'Coach Directory', icon: 'user-cog' },
{ id: 'staff', label: 'Staff & Volunteers', icon: 'users' },

// AFTER:
{ id: 'coaches', label: 'Staff Portal', icon: 'users' },
// Remove the separate staff nav item
```

**Import:**
Add `import { StaffPortalPage } from './pages/staff-portal/StaffPortalPage'` and keep the old imports in case they're used elsewhere.

### Commit:
```bash
git add src/MainApp.jsx src/lib/routes.js
git commit -m "Phase 5: Route both /coaches and /staff to unified StaffPortalPage"
```

---

## PHASE 6: Final Integration + Verification

**Edit contract:** Fix any build errors, verify all flows.

### Verification:
- [ ] Build passes
- [ ] Navigating to /coaches shows StaffPortalPage
- [ ] Navigating to /staff shows StaffPortalPage
- [ ] Nav sidebar shows single "Staff Portal" item
- [ ] Navy header shows correct combined stats
- [ ] Type tabs filter correctly (All / Head Coaches / Assistants / Staff / Volunteers)
- [ ] Grid view shows photo cards with role pills
- [ ] List view shows compact rows
- [ ] Clicking a card/row opens the detail panel on the right
- [ ] Selected card gets sky-blue highlight + navy border
- [ ] Search filters across all people (coaches + staff)
- [ ] Season/Sport filter works
- [ ] "Add Coach" opens CoachFormModal, saves to coaches table
- [ ] "Add Staff" opens StaffFormModal, saves to staff_members table
- [ ] Edit coach works (opens form, saves, refreshes)
- [ ] Edit staff works (same)
- [ ] Assign to team works (for coaches)
- [ ] Toggle active/inactive works (both types)
- [ ] Delete works (both types, with confirmation)
- [ ] Export CSV works (combined export)
- [ ] Email All opens EmailCoachesModal
- [ ] Invite opens InviteCoachModal
- [ ] Detail panel shows correct credentials/compliance
- [ ] 3-dot menu works on cards and rows
- [ ] Dark mode works on all elements
- [ ] Responsive layout works (grid collapses, detail panel hides on narrow screens)
- [ ] Coach role users can access the page (RouteGuard allow=['admin', 'coach'])
- [ ] Old CoachesPage.jsx and StaffPage.jsx are NOT deleted (kept as reference)

### Commit:
```bash
git add -A
git commit -m "Phase 6: StaffPortal final integration and verification"
```

---

## FINAL PUSH

After ALL phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## Staff Portal Redesign Report
- Phases completed: X/6
- New files created: StaffPortalPage.jsx, PersonCard.jsx, PersonDetailPanel.jsx, modals/*.jsx
- Files modified: MainApp.jsx, routes.js
- Old files preserved: CoachesPage.jsx, StaffPage.jsx (not deleted)
- Total lines: +X / -Y
- Build status: PASS/FAIL
- Combined data loading works: YES/NO
- Grid view works: YES/NO
- List view works: YES/NO
- Detail panel works: YES/NO
- All modals work: YES/NO
- Type tabs filter correctly: YES/NO
- Search works: YES/NO
- Export works: YES/NO
- Routing works (/coaches and /staff both render StaffPortal): YES/NO
- Nav consolidated: YES/NO
- Dark mode works: YES/NO
```
