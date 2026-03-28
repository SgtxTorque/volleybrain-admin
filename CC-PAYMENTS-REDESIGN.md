# CC-PAYMENTS-REDESIGN.md
# Payments Page Redesign — The Split Desk + Priority Queue Zones

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/payments/PaymentsPage.jsx` (483 lines)
5. `src/pages/payments/PaymentCards.jsx` (245 lines)
6. `src/pages/payments/PaymentsModals.jsx` (280 lines)
7. `src/pages/payments/PaymentsStatRow.jsx` (91 lines)

## SCOPE
Redesign the Payments page into a 2-column Split Desk layout with a navy financial overview header, Priority Queue zone grouping, and an inline family detail panel. The page must handle orgs processing thousands of payments, so the list view must be fast, scannable, and support quick bulk actions for manual payment processing.

**Design fusion:**
- **From The Split Desk (Concept 3):** 2-column layout. Left: family account list with avatar, balance, collection progress bar, status badges. Right: family detail panel with pending payment card, action buttons (Approve Payment, Reject/Flag), player accounts with fee breakdown, payment timeline, system activity log.
- **From Priority Queue (Concept 4):** Zone-based grouping of families by urgency. Zone 1: Critical Priority (severely overdue). Zone 2: Needs Follow-Up (missed installment, pending manual check). Zone 3: On Track (autopay active, current). Zone 4: Fully Paid. The zones become a sort/group mode, NOT a separate view. The admin can toggle between "All Accounts" (flat list sorted by balance) and "Priority Queue" (grouped by zone).

**New addition — Navy Financial Overview Header:**
A dark navy (#10284C) full-width bar at the top with org-wide financial stats: Total Billed, Total Collected, Outstanding Balance, Collection Rate %, Overdue Count, Avg Days Overdue. This gives the admin an instant financial snapshot before diving into individual accounts.

---

## ELEMENT PRESERVATION CONTRACT

**Every element below MUST survive. MOVED and RESTYLED = OK. REMOVED = NOT OK.**

### Action Buttons:
- **Blast Overdue** (`setShowBlastModal`) — opens BlastReminderModal to send reminders to all overdue families
- **Backfill Fees** (`handleBackfillFees`) — generates fees for existing players missing them
- **Export** (`exportToCSV`) — CSV export of all payments
- **+ Add Fee** (`setShowAddModal`) — opens AddFeeModal to add a fee to a player

### Filters & Search:
- **Season/Sport filter bar** (SeasonFilterBar)
- **Search** (`searchQuery` / `setSearchQuery`) — search by player or parent name
- **Status filter tabs** (All / Unpaid / Paid) (`statusFilter` / `setStatusFilter`)
- **View mode toggle** (Individual / Family) (`viewMode` / `setViewMode`)

### Per-Family/Player Interactions:
- **Expand/collapse** family row to see individual fee line items
- **Mark Paid** per payment (`setShowMarkPaidModal`) — opens MarkPaidModal with payment method, date, reference
- **Mark Unpaid** per payment (`handleMarkUnpaid`) — reverts a paid payment
- **Delete payment** (`setShowDeleteModal`) — opens DeletePaymentModal with confirmation
- **Send Reminder** per family/player (`setShowReminderModal`) — opens SendReminderModal with email/text/notification options
- **Notification bell** per family row — quick reminder trigger

### Modals (DO NOT TOUCH render blocks):
1. `MarkPaidModal` — mark payment as paid with method/date/reference
2. `DeletePaymentModal` — confirm deletion
3. `SendReminderModal` — send reminder via email/text/notification
4. `BlastReminderModal` — send bulk reminders to all overdue families
5. `AddFeeModal` — add fee to a player

### Data Functions (DO NOT MODIFY):
- `loadPayments()`, `loadPlayers()` — Supabase reads
- `handleMarkPaid()`, `handleMarkUnpaid()`, `handleDeletePayment()`, `handleAddPayment()` — payment mutations
- `handleBackfillFees()` / `generateFeesForExistingPlayers()` — fee generation
- `handleSendReminder()`, `handleSendBlast()` — notification triggers
- `exportToCSV()` — CSV export
- All family grouping logic, amount calculations, filter logic

---

## PHASE 1: Navy Financial Overview Header + Page Layout Restructure

**File:** `src/pages/payments/PaymentsPage.jsx`
**Edit contract:** Add the navy header. Restructure into 2-column layout. Move existing elements into new positions. Do not change data loading.

### New Layout:
```
┌───────────────────────────────────────────────────────────────────┐
│  PageShell Header: "Payment Admin" + subtitle                     │
│  SeasonFilterBar                                                  │
├───────────────────────────────────────────────────────────────────┤
│  NAVY FINANCIAL OVERVIEW BAR (dark navy, rounded-2xl, full width) │
│  ┌──────┬──────────┬───────────┬──────────┬─────────┬──────────┐  │
│  │BILLED│COLLECTED │OUTSTANDING│COLLECTION│ OVERDUE │AVG DAYS  │  │
│  │$8,150│ $1,875   │ $6,275    │  23%     │  18     │  34      │  │
│  └──────┴──────────┴───────────┴──────────┴─────────┴──────────┘  │
├───────────────────────────────────────────────────────────────────┤
│  Filter row: [Search...] [All|Unpaid|Paid] [Individual|Family]    │
│  [Sort: Priority Queue ▼] [Blast Overdue] [Backfill] [Export] [+] │
├────────────────────────────────────────────┬──────────────────────┤
│  FAMILY LIST (flex-1, scrollable)          │ FAMILY DETAIL (~380px)│
│                                            │ (shows when family   │
│  Priority Queue mode:                      │  is selected)        │
│  ── ZONE 1: CRITICAL (red dot) ────       │                      │
│    Johnson Family  $850  25% ██░ OVERDUE   │ Account header       │
│  ── ZONE 2: NEEDS FOLLOW-UP (amber) ──    │ Pending payment card  │
│    Park Family     $1,800 PENDING APPROVAL │ [Approve] [Reject]   │
│    Chen Family     $450   60% █████░       │ Player accounts +    │
│  ── ZONE 3: ON TRACK (green) ──────       │  fee breakdown       │
│    Martinez Family $1,240 75% ██████░      │ Payment timeline     │
│  ── ZONE 4: FULLY PAID (84) ───────       │ System activity      │
│    Okafor Family   $0    100% ████████     │                      │
│                                            │                      │
│  -OR- Flat list mode (current behavior)    │                      │
├────────────────────────────────────────────┴──────────────────────┤
│  Bulk Action Bar (when families selected):                        │
│  [✓ 3 families selected] [Send Reminder] [Export Ledger]          │
└───────────────────────────────────────────────────────────────────┘
```

### A. Navy Financial Overview Header:
```jsx
<div className="bg-[#10284C] rounded-2xl p-6 mb-6" style={{ fontFamily: 'var(--v2-font)' }}>
  <div className="grid grid-cols-6 gap-6">
    {financialStats.map(stat => (
      <div key={stat.label} className="text-center">
        <div className={`text-2xl font-black ${stat.color || 'text-white'}`} style={{ letterSpacing: '-0.03em' }}>
          {stat.value}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mt-1">{stat.label}</div>
      </div>
    ))}
  </div>
</div>
```

Financial stats to show:
- Total Billed (sum of all payment amounts)
- Total Collected (sum of paid payments) — in green
- Outstanding (total - collected) — in red/coral if > 0
- Collection Rate (collected/total as %) — green if >80%, amber if 50-80%, red if <50%
- Overdue Families (count of families with unpaid overdue fees) — in red
- Avg Days Overdue (average age of overdue payments) — or "0" if none

### B. Sort mode toggle — "Priority Queue":
Add a dropdown/toggle next to the filter tabs:
```jsx
<select value={sortMode} onChange={e => setSortMode(e.target.value)}
  className="...V2 select styling...">
  <option value="balance">Sort: Highest Balance</option>
  <option value="priority">Sort: Priority Queue</option>
  <option value="name">Sort: Family Name</option>
  <option value="recent">Sort: Most Recent Activity</option>
</select>
```

When `sortMode === 'priority'`, group the family list by zone (see Phase 2).
When any other sort mode, show a flat list sorted accordingly (current behavior).

### C. 2-column layout:
```jsx
<div className="flex gap-6">
  <div className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
    {/* Family list */}
  </div>
  {selectedFamily && (
    <div className="w-[380px] shrink-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
      {/* Family detail panel */}
    </div>
  )}
</div>
```

### Commit:
```bash
git add src/pages/payments/PaymentsPage.jsx
git commit -m "Phase 1: Payments navy header, 2-column layout, priority queue sort mode"
```

---

## PHASE 2: Priority Queue Zone Grouping

**File:** `src/pages/payments/PaymentsPage.jsx` (add zone calculation logic)
**Edit contract:** Add zone classification function. Do not change existing payment data loading.

### Zone Classification Logic:
```javascript
function classifyFamily(family) {
  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalPaid = family.payments.filter(p => p.paid).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const total = totalOwed + totalPaid
  
  if (totalOwed === 0 && family.payments.length > 0) return 'paid'        // Zone 4: Fully Paid
  
  // Check for severely overdue (30+ days)
  const hasOverdue30 = family.payments.some(p => !p.paid && p.due_date && daysSince(p.due_date) > 30)
  if (hasOverdue30) return 'critical'                                       // Zone 1: Critical
  
  // Check for pending manual payment or missed installment
  const hasPending = family.payments.some(p => !p.paid && p.payment_method === 'manual')
  const hasOverdue = family.payments.some(p => !p.paid && p.due_date && daysSince(p.due_date) > 0)
  if (hasPending || hasOverdue) return 'followup'                          // Zone 2: Needs Follow-Up
  
  return 'ontrack'                                                          // Zone 3: On Track
}
```

### Zone rendering (when sortMode === 'priority'):
```jsx
const ZONES = [
  { key: 'critical', label: 'ZONE 1: CRITICAL PRIORITY', color: 'text-red-500', dot: 'bg-red-500' },
  { key: 'followup', label: 'ZONE 2: NEEDS FOLLOW-UP', color: 'text-amber-500', dot: 'bg-amber-500' },
  { key: 'ontrack', label: 'ZONE 3: ON TRACK', color: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
  { key: 'paid', label: 'ZONE 4: FULLY PAID', color: 'text-slate-400', dot: 'bg-slate-400' },
]

// Group families by zone
const zoneGroups = ZONES.map(zone => ({
  ...zone,
  families: sortedFamilies.filter(f => classifyFamily(f) === zone.key)
}))
```

Each zone header:
```jsx
<div className="flex items-center gap-2 mt-6 mb-3">
  <div className={`w-2 h-2 rounded-full ${zone.dot}`} />
  <span className={`text-xs font-black uppercase tracking-widest ${zone.color}`}>{zone.label}</span>
  <span className="text-xs font-bold text-slate-400">({zone.families.length})</span>
  <div className="flex-1 h-px bg-slate-200" />
  {zone.key === 'paid' && zone.families.length > 5 && (
    <button className="text-xs font-bold text-[#4BB9EC]">Show All ↓</button>
  )}
</div>
```

Zone 4 (Fully Paid) collapses to show only first 3 families by default with a "Show All" toggle (since this could be hundreds of families).

### Commit:
```bash
git add src/pages/payments/PaymentsPage.jsx
git commit -m "Phase 2: Priority Queue zone classification and grouped rendering"
```

---

## PHASE 3: Redesign Family Account Cards

**File:** `src/pages/payments/PaymentCards.jsx`
**Edit contract:** Restyle the family and individual payment cards. Keep all click handlers, expand/collapse, and action triggers.

### Family Card (Split Desk style):
```jsx
<div className={`rounded-[14px] transition-all cursor-pointer ${
  isSelected
    ? 'bg-[#4BB9EC]/[0.06] border-2 border-[#10284C]'
    : (isDark ? 'bg-[#132240] border border-white/[0.06] hover:bg-[#1a2d50]' : 'bg-white border border-[#E8ECF2] hover:shadow-md')
} ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
  <div className="p-4 flex items-center gap-4">
    {/* Avatar circle with initial */}
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
      isOverdue ? 'bg-red-500/10 text-red-500 ring-2 ring-red-500/20' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'
    }`}>{initial}</div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm">{family.parentName} Family</span>
        {isOverdue && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-500 text-white">Overdue</span>}
        {hasPendingApproval && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white">Action Required</span>}
      </div>
      <div className="text-xs text-slate-400">{playerCount} player{playerCount !== 1 ? 's' : ''} · {teamNames}</div>
    </div>
    
    {/* Balance + Progress */}
    <div className="text-right shrink-0">
      <div className="font-black text-sm">${balance.toFixed(2)}</div>
      <div className="text-[10px] text-slate-400 uppercase">Balance</div>
    </div>
    
    <div className="w-16 shrink-0">
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
        <div className={`h-full rounded-full ${collectionPercent === 100 ? 'bg-[#22C55E]' : collectionPercent > 50 ? 'bg-[#4BB9EC]' : 'bg-red-500'}`}
          style={{ width: `${collectionPercent}%` }} />
      </div>
      <div className={`text-[10px] font-bold text-right mt-0.5 ${collectionPercent === 100 ? 'text-[#22C55E]' : 'text-slate-400'}`}>
        {collectionPercent === 100 ? 'FULLY PAID' : `${collectionPercent}% COLLECTED`}
      </div>
    </div>
  </div>
</div>
```

Keep the expand/collapse to show individual fee line items below.
Keep all per-payment action buttons (Mark Paid, Mark Unpaid, Delete, Send Reminder).

### Commit:
```bash
git add src/pages/payments/PaymentCards.jsx
git commit -m "Phase 3: Payment family cards with Split Desk styling, progress bars, zone badges"
```

---

## PHASE 4: Build the Family Detail Panel

**File:** `src/pages/payments/FamilyDetailPanel.jsx` (NEW)
**Edit contract:** New file. Receives family data as props. Renders the right-column detail panel.

### Sections (from Split Desk mockup):
1. **Account Header:** Family name, email, phone, edit button
2. **Pending Payment Card** (if any manual payment awaiting approval): Payment method label, reference #, date, amount. Two action buttons: "Approve Payment" (green) + "Reject / Flag" (outline).
3. **Player Accounts:** For each player in the family: avatar + name + team + jersey. Below: fee line items with amounts. Total per player.
4. **Payment Timeline:** Vertical timeline showing payment history (paid dates, pending installments, future installments). Green dot = paid, amber = pending, gray = future.
5. **System Activity:** Recent actions on this account (reminders sent, payments processed, notes). Small text, timestamp.

Action buttons connect to parent callbacks: `onApprovePaid`, `onRejectFlag`, `onSendReminder`, `onEditFamily`, `onAddFee`.

### Commit:
```bash
git add src/pages/payments/FamilyDetailPanel.jsx
git commit -m "Phase 4: FamilyDetailPanel — Split Desk right column with pending approval, timeline, activity"
```

---

## PHASE 5: Wire Detail Panel + Bulk Selection Bar + Final Integration

**File:** `src/pages/payments/PaymentsPage.jsx`
**Edit contract:** Import FamilyDetailPanel, add selection state, wire bulk actions.

### Changes:
- Add `selectedFamily` state for the detail panel
- Add `selectedFamilyIds` Set state for bulk checkbox selection
- When a family card is clicked, populate `selectedFamily` for the right panel
- Add checkbox per family card for bulk selection
- Bulk action bar at bottom when families are selected: "[N] families selected" + "Send Reminder" + "Export Ledger"
- Wire bulk "Send Reminder" to the existing BlastReminderModal
- Wire bulk "Export Ledger" to export selected families' payments

### Verification:
- [ ] Build passes
- [ ] Navy financial header shows correct org-wide stats
- [ ] Priority Queue mode groups families into 4 zones correctly
- [ ] Zone 4 (Fully Paid) collapses with Show All toggle
- [ ] Flat sort modes work (balance, name, recent)
- [ ] Family cards show balance, progress bar, status badges
- [ ] Overdue families have red left border
- [ ] Clicking a family highlights it and shows detail panel
- [ ] Detail panel shows account info, pending payments, player breakdown, timeline
- [ ] "Approve Payment" and "Reject/Flag" buttons work in detail panel
- [ ] Expand/collapse individual fee line items still works
- [ ] Mark Paid modal opens and functions correctly
- [ ] Mark Unpaid reverts payment
- [ ] Delete payment with confirmation works
- [ ] Send Reminder modal works (per-family and per-player)
- [ ] Blast Overdue modal works
- [ ] Backfill Fees works
- [ ] Export CSV works
- [ ] Add Fee modal works
- [ ] Individual vs Family view toggle works
- [ ] Search filters correctly
- [ ] Status filter tabs (All/Unpaid/Paid) work
- [ ] Bulk selection checkboxes work
- [ ] Bulk action bar appears with correct count
- [ ] Bulk Send Reminder + Export work
- [ ] Season/Sport filter works
- [ ] Dark mode works on all new elements
- [ ] Performance: page handles 100+ families without lag (list is scrollable, not all rendered at once)
- [ ] All 5 modals still open and function

### Commit:
```bash
git add src/pages/payments/PaymentsPage.jsx src/pages/payments/PaymentCards.jsx src/pages/payments/FamilyDetailPanel.jsx
git commit -m "Phase 5: Wire detail panel, bulk selection, final integration"
```

---

## FINAL PUSH

After ALL phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## Payments Redesign Report
- Phases completed: X/5
- New files: FamilyDetailPanel.jsx
- Files modified: PaymentsPage.jsx, PaymentCards.jsx
- Total lines: +X / -Y
- Build status: PASS/FAIL
- Navy header works: YES/NO
- Priority Queue zones: YES/NO
- Split Desk detail panel: YES/NO
- Bulk selection: YES/NO
- All modals work: YES/NO
- Zone collapsing (Zone 4): YES/NO
- Dark mode: YES/NO
- Performance (100+ families): YES/NO
```
