# CC-REGISTRATIONS-REDESIGN.md
# Registrations Page Redesign — The War Room + Mission Control Fusion

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css` (design system)
4. `src/pages/registrations/RegistrationsPage.jsx` (486 lines)
5. `src/pages/registrations/RegistrationsTable.jsx` (323 lines)
6. `src/pages/registrations/RegistrationsStatRow.jsx` (83 lines)
7. `src/pages/registrations/PlayerDetailModal.jsx` (481 lines)
8. `src/pages/registrations/RegistrationModals.jsx` (91 lines)
9. `src/pages/registrations/RegistrationAnalytics.jsx` (351 lines)

## SCOPE
Redesign Registrations from a flat full-width table into a 3-column "War Room" layout with expandable player rows inspired by Mission Control. No new features. No new data queries. Every existing interactive element is preserved and repositioned.

**Design fusion:**
- **From The War Room (Concept 1):** 3-column layout. Narrow left column for season/filter context. Wide center column for the registration list. Right column for player detail (appears when a row is selected).
- **From Mission Control (Concept 3):** Expandable rows that reveal financial breakdown + quick actions inline. Stat cards at the top with editorial treatment.
- **Selected row highlight:** When a player row is clicked, it gets a light sky-blue background with a navy left border (like the War Room mockup). The right column populates with that player's detail.

---

## ELEMENT PRESERVATION CONTRACT

**Every interactive element below MUST survive. They can be MOVED and RESTYLED. They CANNOT be removed.**

### Action Buttons:
- **Table/Analytics view toggle** (`viewMode` / `setViewMode`) — switch between table and analytics view
- **Approve All (N) button** (`bulkApproveAllPending`) — bulk approve all pending registrations
- **Export CSV button** (`exportToCSV`) — export registrations to CSV
- **Bulk export** (`bulkExport`) — export selected registrations

### Filters & Search:
- **Season/Sport filter bar** (SeasonFilterBar component)
- **Search input** (`searchQuery` / `setSearchQuery`) — search players/parents
- **Status tabs** (All/Pending/Approved/Rostered/Waitlist/Denied with counts + dot on Pending)

### Table Interactions:
- **Checkbox selection** per row (`selectedIds` / `toggleSelect`) — individual selection
- **Select all checkbox** (`toggleSelectAll`) — header checkbox
- **Bulk action bar** (appears when items selected): Approve (N), Waitlist, Deny, Export buttons
- **Player name click** → opens PlayerDetailModal (`setSelectedPlayer`)
- **Edit player** → opens PlayerDetailModal in edit mode (`setEditMode(true)`)
- **Approve button** per pending row (`approveRegistration`)
- **Deny button** per pending row → opens DenyRegistrationModal (`setShowDenyModal`)
- **3-dot actions menu** per row (existing MoreHorizontal menu)

### Table Columns (all must remain visible in center column):
- Checkbox, Player (name + age + grade), Parent, Contact, Waiver status, Registration status, Actions

### Modals (DO NOT TOUCH render blocks):
1. `PlayerDetailModal` — full player detail with edit capability
2. `DenyRegistrationModal` — single deny with reason
3. `BulkDenyModal` — bulk deny selected

### Data Functions (DO NOT MODIFY):
- `loadRegistrations()`, `loadStats()` — Supabase reads
- `approveRegistration()`, `denyRegistration()`, `bulkApproveSelected()`, `bulkApproveAllPending()`, `bulkDenySelected()`, `bulkMoveToWaitlist()` — status mutations
- `exportToCSV()`, `bulkExport()` — CSV export
- All filtering/sorting logic, status counting

---

## PHASE 1: Convert RegistrationsPage to 3-Column War Room Layout

**File:** `src/pages/registrations/RegistrationsPage.jsx`
**Edit contract:** Restructure the page layout from full-width to 3-column. Move existing elements into the new column structure. Do not change data loading or any function logic.

### New Layout Structure:

```
┌──────────────────────────────────────────────────────────────┐
│  Header: "Registrations" title + subtitle                     │
│  Season/Sport filter bar                                      │
├──────────┬───────────────────────────────┬───────────────────┤
│ LEFT     │  CENTER                       │ RIGHT             │
│ ~220px   │  flex-1                       │ ~340px            │
│          │                               │ (shows when       │
│ Stat     │  Search + Status tabs         │  player selected) │
│ overview │  + Bulk action bar            │                   │
│ cards    │                               │ Player Dossier:   │
│ (stacked │  Registration table           │ - Avatar + name   │
│ vertical)│  (with expandable rows)       │ - DOB, jersey,    │
│          │                               │   position        │
│ Action   │                               │ - Document        │
│ buttons: │                               │   checklist       │
│ Table/   │                               │ - Payment ledger  │
│ Analytics│                               │ - Quick actions    │
│ toggle   │                               │                   │
│ Export   │                               │                   │
│ Approve  │                               │                   │
│ All      │                               │                   │
└──────────┴───────────────────────────────┴───────────────────┘
```

### Implementation:

**A. Page-level grid:**
```jsx
<div className="flex gap-6" style={{ fontFamily: 'var(--v2-font)' }}>
  {/* Left Column — Context & Actions */}
  <div className="w-[220px] shrink-0 space-y-4">
    {/* Stat overview cards (stacked vertical) */}
    {/* Action buttons */}
  </div>
  
  {/* Center Column — Registration List */}
  <div className="flex-1 min-w-0">
    {/* Search + Status tabs + Bulk bar */}
    {/* Table or Analytics view */}
  </div>
  
  {/* Right Column — Player Dossier (conditional) */}
  {selectedPlayerForDossier && (
    <div className="w-[340px] shrink-0">
      {/* Player detail panel */}
    </div>
  )}
</div>
```

**B. Left column — Stat cards (compact, stacked):**
Move the 4 stat cards from the current horizontal row into a vertical stack in the left column. Make them compact:
```jsx
<div className={`rounded-[14px] p-4 ${isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} shadow-sm`}>
  <div className={`text-[10px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
    Total Registered
  </div>
  <div className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`}>38</div>
  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This season</div>
</div>
```

Below the stats, place the action buttons (Table/Analytics toggle, Approve All, Export CSV) as stacked buttons:
```jsx
<div className="space-y-2 pt-4">
  <button className="w-full ...">Table View</button>
  <button className="w-full ...">Analytics</button>
  <hr />
  <button className="w-full ... bg-[#22C55E] text-white">Approve All (8)</button>
  <button className="w-full ...">Export CSV</button>
</div>
```

**C. Center column — the registration table** stays here, taking up the majority of the width. The search bar, status filter tabs, and bulk action bar all render above the table in the center column.

**D. Right column — Player Dossier panel:**
Add new state: `selectedPlayerForDossier`. When a player row is clicked (NOT the checkbox, NOT approve/deny — the row itself or the player name), populate this state. The right column renders a detail panel inspired by The War Room's "Player Dossier":
- Player avatar + full name + family name
- DOB, jersey number (if assigned), position
- Document checklist (waiver status with green check / amber pending / red missing)
- Payment summary (total commitment, amount paid, balance)
- Quick action buttons: Approve, Deny, Edit, View Full Profile (opens PlayerDetailModal)

**Important:** The right column is an INLINE panel, NOT a replacement for PlayerDetailModal. The full modal still opens when "View Full Profile" is clicked or when the player name link is clicked (existing behavior). The dossier is a quick-glance preview.

**E. Responsive:** On screens narrower than 1200px, collapse to 2-column (hide left column, merge its content above center). On screens narrower than 900px, collapse to single column (hide dossier, keep it in the modal-only flow).

### Commit:
```bash
git add src/pages/registrations/RegistrationsPage.jsx
git commit -m "Phase 1: Registrations 3-column War Room layout with stat sidebar and player dossier"
```

---

## PHASE 2: Redesign Registration Table Rows — Selected State + Expandable Detail

**File:** `src/pages/registrations/RegistrationsTable.jsx`
**Edit contract:** Restyle table rows. Add selected-row highlight. Add expandable row detail. Keep all existing column data, click handlers, and bulk selection logic.

### Changes:

**A. Selected row highlight:**
When a row is clicked (the row background, not a specific button), it becomes the "active" row for the right-column dossier. The selected row gets:
```jsx
className={`... ${
  isSelectedForDossier
    ? (isDark ? 'bg-[#4BB9EC]/10 border-l-3 border-l-[#10284C]' : 'bg-[#4BB9EC]/[0.06] border-l-3 border-l-[#10284C]')
    : ''
}`}
```
Light sky-blue tint background + navy left border on the selected row. Only one row can be selected at a time (for the dossier). This is separate from the checkbox multi-selection (which is for bulk actions).

**B. Pending row styling:**
Keep the existing amber tint for pending rows, but make it more refined:
```jsx
// Pending rows: subtle amber left border instead of full background
isPending && !isSelectedForDossier ? 'border-l-3 border-l-amber-400' : ''
```

**C. Expandable row detail (Mission Control style):**
Add a small expand/collapse chevron on each row. When expanded, the row reveals an inline panel below it with:
- **Financial breakdown:** Registration fee, uniform kit, travel levy — line items with amounts
- **Quick actions:** Approve, Deny, Waitlist, Edit, Message Parent — as small pill buttons

This is the Mission Control concept's expandable card, applied to each row. The expand state is per-row (`expandedRowId`).

```jsx
{isExpanded && (
  <tr>
    <td colSpan={7}>
      <div className={`px-8 py-4 flex gap-8 ${isDark ? 'bg-[#0D1B2F]' : 'bg-[#F5F6F8]'}`}>
        {/* Financial Breakdown */}
        <div className="flex-1">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Financial Breakdown</h4>
          {/* Fee line items */}
        </div>
        {/* Quick Actions */}
        <div className="w-[200px] shrink-0">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="...">Approve</button>
            <button className="...">Deny</button>
            <button className="...">Waitlist</button>
            <button className="...">Edit</button>
          </div>
        </div>
      </div>
    </td>
  </tr>
)}
```

**D. Row hover:** Subtle background shift on hover (slightly darker in dark mode, slightly blue-tinted in light mode).

**E. Status/Waiver chips:** Keep existing StatusChip and WaiverChip components but ensure they use the V2 pill styling (rounded-full, proper size).

### Commit:
```bash
git add src/pages/registrations/RegistrationsTable.jsx
git commit -m "Phase 2: Registration rows with selected highlight, expandable detail, and Mission Control quick actions"
```

---

## PHASE 3: Restyle Status Tabs + Search + Bulk Action Bar

**File:** `src/pages/registrations/RegistrationsTable.jsx`
**Edit contract:** Restyle the filter tabs, search input, and bulk action bar. Keep all filter logic and handlers.

### Changes:

**A. Status tabs:** V2 pill-style tabs with count badges:
```jsx
<div className="flex items-center gap-1 p-1 rounded-xl bg-[#F5F6F8]">
  {tabs.map(tab => (
    <button key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
        activeTab === tab.key
          ? 'bg-white text-[#10284C] shadow-sm'
          : 'text-slate-400 hover:text-[#10284C]'
      }`}>
      {tab.label}
      {tab.count > 0 && (
        <span className={`ml-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full text-[10px] font-black ${
          tab.dot ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
        }`}>{tab.count}</span>
      )}
    </button>
  ))}
</div>
```

**B. Search input:** V2 styled with icon:
```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <input
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search players or parents..."
    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isDark
        ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder:text-slate-500 focus:border-[#4BB9EC]/30'
        : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'
    }`}
    style={{ fontFamily: 'var(--v2-font)' }}
  />
</div>
```

**C. Bulk action bar:** When checkboxes are selected, show a sticky bar at the top of the table with selection count and action buttons. V2 styled:
```jsx
{selectedIds.size > 0 && (
  <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-3 rounded-xl mb-3 ${
    isDark ? 'bg-[#10284C] border border-[#4BB9EC]/20' : 'bg-[#10284C] text-white'
  }`}>
    <span className="text-sm font-bold">{selectedIds.size} selected</span>
    <div className="flex items-center gap-2">
      <button onClick={bulkApprove} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#22C55E] text-white">
        Approve ({selectedPendingCount})
      </button>
      <button onClick={() => setShowBulkDenyModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white">
        Deny
      </button>
      <button onClick={bulkMoveToWaitlist} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white">
        Waitlist
      </button>
      <button onClick={bulkExport} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white">
        Export
      </button>
    </div>
  </div>
)}
```

### Commit:
```bash
git add src/pages/registrations/RegistrationsTable.jsx
git commit -m "Phase 3: V2 status tabs, search input, and bulk action bar styling"
```

---

## PHASE 4: Build the Right-Column Player Dossier Component

**File:** `src/pages/registrations/PlayerDossierPanel.jsx` (NEW)
**Edit contract:** New file only. A standalone component that receives player data and renders a detail panel for the right column.

### Component:
```jsx
export default function PlayerDossierPanel({ player, registration, onClose, onApprove, onDeny, onEdit, onViewFull, isDark }) {
  // Renders:
  // - Header: avatar circle + player name + family name + close X
  // - Info grid: DOB, Jersey #, Position (2-col grid of small cards)
  // - Document Checklist: waiver status items with green/amber/red indicators
  // - Payment Ledger: total commitment, line items, payment status
  // - Quick Actions: Approve, Deny, Edit, View Full Profile buttons
}
```

**Visual treatment:** Match The War Room mockup's right column. Navy header label "PLAYER DOSSIER", large avatar, clean info cards, document checklist with left-colored bars (green=complete, amber=pending, red=missing), payment card with dark navy background showing the total.

**This component does NOT make any Supabase queries.** It receives all data as props from RegistrationsPage. The data is already loaded in the registrations array.

### Commit:
```bash
git add src/pages/registrations/PlayerDossierPanel.jsx
git commit -m "Phase 4: PlayerDossierPanel component for War Room right column"
```

---

## PHASE 5: Wire Dossier Panel + Final Integration

**File:** `src/pages/registrations/RegistrationsPage.jsx`
**Edit contract:** Import PlayerDossierPanel, add the dossier state, wire the row click to populate it, render it in the right column.

### Changes:
- Add `const [dossierPlayer, setDossierPlayer] = useState(null)` state
- Pass `onRowSelect={setDossierPlayer}` to RegistrationsTable
- In RegistrationsTable, when a row body is clicked (not checkbox, not action buttons), call `onRowSelect(player)`
- Render `<PlayerDossierPanel>` in the right column when `dossierPlayer` is set
- Wire the dossier's action buttons to existing functions (approve, deny, edit, view full)
- Verify the full PlayerDetailModal still opens correctly from "View Full Profile" and from player name clicks

### Verification:
- [ ] Build passes
- [ ] 3-column layout renders correctly
- [ ] Left column shows stat cards + action buttons
- [ ] Center column shows search + tabs + table
- [ ] Clicking a row highlights it (sky-blue bg + navy left border) and populates right column
- [ ] Right column shows player dossier with correct data
- [ ] Dossier Approve/Deny/Edit buttons work
- [ ] "View Full Profile" opens the full PlayerDetailModal
- [ ] Checkbox selection still works independently of row selection
- [ ] Bulk action bar appears when checkboxes selected
- [ ] Bulk Approve/Deny/Waitlist/Export all work
- [ ] Status tabs filter correctly
- [ ] Search filters correctly
- [ ] Export CSV works
- [ ] Analytics view still works (switch from Table to Analytics)
- [ ] Responsive: narrows gracefully below 1200px and 900px
- [ ] Dark mode works on all new elements
- [ ] All 3 modals still open and function (PlayerDetail, DenyRegistration, BulkDeny)

### Commit:
```bash
git add src/pages/registrations/RegistrationsPage.jsx src/pages/registrations/RegistrationsTable.jsx
git commit -m "Phase 5: Wire PlayerDossierPanel, row selection highlight, final integration"
```

---

## FINAL PUSH

After ALL phases pass verification:
```bash
git push origin main
```

## FINAL REPORT
```
## Registrations Redesign Report
- Phases completed: X/5
- New files created: PlayerDossierPanel.jsx
- Files modified: RegistrationsPage.jsx, RegistrationsTable.jsx
- Total lines: +X / -Y
- Build status: PASS/FAIL
- 3-column layout works: YES/NO
- Row selection + dossier works: YES/NO
- Expandable rows work: YES/NO
- Bulk actions work: YES/NO
- All modals work: YES/NO
- Dark mode works: YES/NO
- Responsive works: YES/NO
```
