# CC-V2-QA-ROUND2B-PAYMENTS.md
## Lynx Web Admin — V2 Admin Payments Tab Redesign
### Actionable Collections View

**Branch:** `main`
**Rule:** This spec redesigns the admin Payments body tab into a working collections dashboard. It touches the payments tab component and the admin dashboard data wiring. Build-verify-commit after each fix.

---

## SCOPE BOUNDARIES

### DO touch:
- `src/components/v2/admin/AdminPaymentsTab.jsx` (full redesign)
- `src/pages/dashboard/DashboardPage.jsx` (payments data wiring — expanded query, new state)

### DO NOT touch:
- Any other tab component (AdminTeamsTab, AdminRegistrationsTab, AdminScheduleTab)
- Any shared v2 component
- Any context, hook, or service layer file
- MainApp.jsx, routes.js
- Any other dashboard page
- The payments PAGE (`/payments`) — this is about the dashboard tab only

### QUERY RULES:
- You MAY expand the existing payments query in `loadDashboardData()` to fetch more columns
- You MAY add a NEW query to get family-level payment rollups
- All new queries MUST be wrapped in try/catch
- Do NOT modify any existing query — only add new selects or new parallel queries

---

## THE CONCEPT

The Payments tab is a **collections worklist**. It answers the question: "Who owes money, how much, and what do I need to do about it?"

The view is organized by FAMILY (parent), not by individual line items. Each row represents one family's total obligation. When that family is fully paid, the row disappears from the list (or moves to a "Recently Paid" collapsed section).

---

## Fix 1: Payments Data Query

**File:** `src/pages/dashboard/DashboardPage.jsx`

**What to fetch:** A family-level payments rollup for the selected season. Each entry represents one parent/family with:
- Parent name (who's responsible for paying)
- Total amount due (sum of all unpaid line items for this family)
- Line items breakdown (registration fee, uniform fee, monthly dues, tournament fee, etc.)
- Payment method (Stripe / Manual / Not yet paid)
- Payment status (Paid / Partial / Overdue / Pending Approval)
- Due date (earliest upcoming due date across their line items)
- Last payment date (most recent payment received)

**Query approach:**

1. Fetch all payments for the selected season:
```javascript
let paymentDetails = [];
try {
  const { data } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      status,
      payment_method,
      fee_type,
      due_date,
      paid_at,
      created_at,
      player_id,
      players (
        id, first_name, last_name,
        parent_id,
        profiles:parent_id (id, first_name, last_name, email, phone)
      )
    `)
    .eq('season_id', selectedSeason.id)
    .order('due_date', { ascending: true });
  paymentDetails = data || [];
} catch (err) {
  console.warn('Payment details query failed:', err);
}
```

**IMPORTANT:** The `parent_id` FK on `players` may not exist or may be named differently. CC MUST check the schema first (check SCHEMA_REFERENCE.csv or the actual table). If the join fails, try an alternative approach:
- Query payments with player info
- Separately query parent/profile info
- Join in JavaScript

2. After fetching, group by parent/family in JavaScript:

```javascript
// Group payments by parent_id (or player's parent profile id)
const familyPayments = {};
paymentDetails.forEach(payment => {
  const parentId = payment.players?.profiles?.id || payment.players?.parent_id || payment.player_id;
  const parentName = payment.players?.profiles
    ? `${payment.players.profiles.first_name} ${payment.players.profiles.last_name}`
    : 'Unknown';

  if (!familyPayments[parentId]) {
    familyPayments[parentId] = {
      parentId,
      parentName,
      parentEmail: payment.players?.profiles?.email || '',
      parentPhone: payment.players?.profiles?.phone || '',
      children: [],
      lineItems: [],
      totalDue: 0,
      totalPaid: 0,
      earliestDueDate: null,
      lastPaymentDate: null,
      needsApproval: false,
    };
  }

  const family = familyPayments[parentId];

  // Track children
  const childName = `${payment.players?.first_name || ''} ${payment.players?.last_name || ''}`.trim();
  if (childName && !family.children.includes(childName)) {
    family.children.push(childName);
  }

  // Track line items
  family.lineItems.push({
    id: payment.id,
    feeType: payment.fee_type || 'Other',
    amount: payment.amount || 0,
    status: payment.status,
    method: payment.payment_method,
    dueDate: payment.due_date,
    paidAt: payment.paid_at,
  });

  // Aggregate totals
  if (payment.status === 'paid' || payment.status === 'captured') {
    family.totalPaid += (payment.amount || 0);
    if (payment.paid_at) {
      const paidDate = new Date(payment.paid_at);
      if (!family.lastPaymentDate || paidDate > new Date(family.lastPaymentDate)) {
        family.lastPaymentDate = payment.paid_at;
      }
    }
  } else {
    family.totalDue += (payment.amount || 0);
    if (payment.due_date) {
      const dueDate = new Date(payment.due_date);
      if (!family.earliestDueDate || dueDate < new Date(family.earliestDueDate)) {
        family.earliestDueDate = payment.due_date;
      }
    }
  }

  // Check for manual payments needing approval
  if (payment.payment_method === 'manual' && payment.status === 'pending_approval') {
    family.needsApproval = true;
  }
});

// Convert to array, filter out fully paid families (paid within last 24h stay visible)
const now = new Date();
const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

const paymentFamilies = Object.values(familyPayments)
  .filter(family => {
    // Keep if has outstanding balance
    if (family.totalDue > 0) return true;
    // Keep if needs approval
    if (family.needsApproval) return true;
    // Keep Stripe payments for 24h after capture
    const recentStripePayment = family.lineItems.some(item =>
      item.method === 'stripe' && item.paidAt && new Date(item.paidAt) > twentyFourHoursAgo
    );
    if (recentStripePayment) return true;
    // Otherwise, fully paid — hide
    return false;
  })
  .sort((a, b) => {
    // Sort: overdue first (earliest due date), then pending approval, then by amount due desc
    const aOverdue = a.earliestDueDate && new Date(a.earliestDueDate) < now;
    const bOverdue = b.earliestDueDate && new Date(b.earliestDueDate) < now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (a.needsApproval && !b.needsApproval) return -1;
    if (!a.needsApproval && b.needsApproval) return 1;
    return (b.totalDue || 0) - (a.totalDue || 0);
  });
```

3. Store in state:
```javascript
const [paymentFamilies, setPaymentFamilies] = useState([]);
```

Set it at the end of `loadDashboardData()` after the grouping logic runs.

4. Pass to AdminPaymentsTab:
```jsx
<AdminPaymentsTab
  stats={stats}
  monthlyPayments={monthlyPayments}
  paymentFamilies={paymentFamilies}
  onNavigate={appNavigate}
/>
```

**Commit:** `feat(v2): payments family rollup query for admin tab`

---

## Fix 2: AdminPaymentsTab Redesign

**File:** `src/components/v2/admin/AdminPaymentsTab.jsx` (full redesign)

**New layout:**

```
Summary row (compact, single horizontal line):
  Collected: $1,875  |  Outstanding: $4,155  |  Collection Rate: 31%  |  Overdue: 42
  (same data as before, just compressed to one row)

↓

Family payments table:
  Header: FAMILY | PLAYERS | AMOUNT DUE | LINE ITEMS | METHOD | STATUS | DUE DATE
  
  Rows (one per family, sorted by urgency):
    ├── Family: Parent name (14px weight 600) + email (12px muted below)
    ├── Players: Child names comma-separated (13px)
    ├── Amount Due: "$650.00" (14px weight 700, red if overdue)
    ├── Line Items: Compact pills — "Registration $400" "Uniform $150" "Dues $100"
    │   Each pill: 11px, rounded, light bg matching fee type color
    ├── Method: "Stripe" (sky pill) / "Manual" (amber pill) / "—" (not yet paid)
    ├── Status: 
    │   "Paid" — green badge (for recently-paid Stripe, visible for 24h)
    │   "Overdue" — red badge + red text on amount
    │   "Pending" — amber badge
    │   "Needs Approval" — purple badge with action affordance
    │   "Partial" — blue badge (some items paid, some outstanding)
    └── Due Date: "Mar 15" or "Overdue 6d" (red text if past due)

  If row needs approval: show a subtle "Approve" button or link on the row
  
  Cap at 10 rows, footer: "View All Payments →"

↓

Monthly Trend chart (keep existing — it's good context)
```

**Summary row styling:**
```
Flex row, gap 24px, padding 16px 24px, surface background, border-radius 10px, margin-bottom 16px
Each metric: value (18px weight 800) + label (10px uppercase muted) stacked vertically
Collected: green value
Outstanding: red value  
Collection Rate: navy value + small progress bar
Overdue: red value
```

**Table styling (match Teams & Health pattern):**
```
Header: grid columns, surface bg, 10px uppercase muted labels
Rows: same grid, 12px 24px padding, border-bottom, hover highlight, cursor pointer
  Click row → navigate to /payments (or deep link to family detail if route exists)
```

**Grid template:**
```css
grid-template-columns: 180px 140px 100px 1fr 80px 100px 90px;
```

**Line items pills:**
```
display: inline-flex, flex-wrap: wrap, gap: 4px
Each pill: padding 2px 8px, border-radius 6px, font-size 10px, font-weight 600
  Registration: green-tinted bg
  Uniform: sky-tinted bg  
  Dues: purple-tinted bg
  Tournament: amber-tinted bg
  Other: gray-tinted bg
```

**Status logic:**
```javascript
const getStatus = (family) => {
  if (family.needsApproval) return { label: 'Needs Approval', color: 'purple' };
  if (family.totalDue === 0 && family.totalPaid > 0) return { label: 'Paid', color: 'green' };
  if (family.earliestDueDate && new Date(family.earliestDueDate) < new Date()) return { label: 'Overdue', color: 'red' };
  if (family.totalPaid > 0 && family.totalDue > 0) return { label: 'Partial', color: 'blue' };
  return { label: 'Pending', color: 'amber' };
};
```

**"Needs Approval" row behavior:**
When a manual payment needs approval, show a small "Approve" button on the row. Clicking it should either:
- Navigate to `/payments` with context to approve that specific payment
- OR call an existing approval function if one exists in the payment service layer

Check if there's an existing approval flow. If there's a function like `approvePayment(paymentId)` in the service layer, wire it. If not, just navigate to `/payments` and note that inline approval is deferred.

**Empty state:** If `paymentFamilies` is empty, show: "All payments are current ✓" with a subtle checkmark.

**Commit:** `feat(v2): admin payments tab family-level collections view`

---

## Fix 3: Stripe Auto-Clear Behavior

**Problem:** When a Stripe payment is captured, the family row should remain visible for 24 hours showing "Paid" status, then disappear from the list.

**This is already handled in the query grouping logic (Fix 1):**
```javascript
// Keep Stripe payments for 24h after capture
const recentStripePayment = family.lineItems.some(item =>
  item.method === 'stripe' && item.paidAt && new Date(item.paidAt) > twentyFourHoursAgo
);
```

**No additional code needed.** The 24h window is computed on each data load. After 24 hours, the filter excludes the family, and the row disappears on the next dashboard load.

**Verify this works by checking:** If there are any Stripe-paid families in the data, they should show with green "Paid" status. After 24h (or if `paid_at` is > 24h ago), they should not appear.

**No commit needed — covered by Fix 1.**

---

## EXECUTION ORDER

1. Fix 1 — Payments family rollup query (data layer)
2. Fix 2 — AdminPaymentsTab redesign (presentation)
3. Verify Stripe auto-clear logic

Build and verify after each fix. Push after both are committed.

---

## POST-FIX VERIFICATION

1. Click the Payments tab in the admin body section
2. Verify summary row shows Collected, Outstanding, Collection Rate, Overdue in one line
3. Verify family list shows rows sorted by urgency (overdue first)
4. Verify each row shows: parent name, children, amount due, line item pills, method, status badge, due date
5. Verify overdue families have red text and "Overdue Xd" in the due date column
6. Verify fully-paid families are NOT in the list (unless Stripe-paid within last 24h)
7. Verify "View All Payments →" footer navigates to /payments
8. Verify monthly trend chart still renders below the list
9. Click a row — should navigate to /payments
10. Switch to Coach/Parent/Player dashboards — verify no regressions
11. No console errors

Report results.

---

## KNOWN LIMITATIONS (do not fix now):
- Inline "Approve" button for manual payments may not work if no approval API exists — just navigate to /payments for now
- Line item fee_type values depend on what's stored in the payments table. If fee_type is null for some payments, they'll show as "Other"
- The 24h Stripe auto-clear is client-side only (computed on load). If the user doesn't refresh, old "Paid" rows persist until next load. This is acceptable.
