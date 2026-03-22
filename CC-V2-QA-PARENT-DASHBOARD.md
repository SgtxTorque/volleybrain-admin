# CC-V2-QA-PARENT-DASHBOARD.md
## Lynx Web Admin — V2 Parent Dashboard Fixes
### QA Feedback Round

**Branch:** `main`
**Rule:** Fix what is listed. Build-verify-commit after each numbered fix. Do not touch admin or coach dashboards.

---

## SCOPE BOUNDARIES

### DO touch:
- `src/pages/roles/ParentDashboard.jsx` (data wiring, layout, tab fixing)
- `src/components/v2/parent/KidCards.jsx` (redesign to horizontal scroll)
- `src/components/v2/parent/ParentScheduleTab.jsx` (fix tab rendering)
- `src/components/v2/parent/ParentPaymentsTab.jsx` (fix tab rendering)
- `src/components/v2/parent/ParentFormsTab.jsx` (fix tab rendering)
- `src/components/v2/parent/ParentReportCardTab.jsx` (fix tab rendering)
- `src/components/v2/FinancialSnapshot.jsx` (fix floating point display — shared component, be careful)

### DO NOT touch:
- Any context, hook, or service layer file
- MainApp.jsx, routes.js
- Admin dashboard (DashboardPage.jsx)
- Coach dashboard (CoachDashboard.jsx)
- Player dashboard, Team Manager dashboard
- Any file in `src/lib/`

### QUERY RULES:
- You MAY expand existing queries in ParentDashboard.jsx to fetch more columns
- You MAY add new queries inside existing useEffect blocks
- All new queries MUST be wrapped in try/catch
- Do NOT modify existing queries — only add to selects or add parallel queries

---

## Fix 1: Financial Snapshot Floating Point Bug (CRITICAL)

**File:** `src/components/v2/FinancialSnapshot.jsx` AND/OR `src/pages/roles/ParentDashboard.jsx`

**Problem:** The Financial Snapshot shows "570.0099999999999" for the Paid amount. This is a JavaScript floating-point precision error. Dollar amounts must be formatted to exactly 2 decimal places.

**Fix:**

Find everywhere in FinancialSnapshot.jsx and ParentDashboard.jsx where dollar amounts are displayed. Apply proper formatting:

```javascript
// WRONG:
`$${amount}`
// or
`$${amount.toLocaleString()}`

// RIGHT:
`$${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
```

Check EVERY dollar amount in FinancialSnapshot.jsx:
- `receivedAmount` prop display
- `outstandingAmount` prop display
- `projectedRevenue` display
- Breakdown category amounts
- Any computed values

Also check where ParentDashboard.jsx computes and passes these values. The formatting should happen at the DISPLAY level (in the component), not at the data level, so all consumers benefit.

**IMPORTANT:** FinancialSnapshot is a SHARED component used by Admin and Parent. Make sure the formatting fix doesn't break the Admin financial snapshot. Test both after this change.

**Commit:** `fix(v2): financial snapshot dollar formatting — fix floating point`

---

## Fix 2: Kid Cards — Horizontal Scroll Redesign

**File:** `src/components/v2/parent/KidCards.jsx`

**Problem:** The 2-column grid layout breaks when a parent has many children across multiple sports/teams. The screenshot shows 11 kids filling the entire page with cards. This needs to be a horizontal scrollable row (same treatment as the Season Carousel on the admin page).

**Fix — Full redesign:**

**New layout:**
```
Section header: "My Players" (left) + scroll arrows (right)
Horizontal scrollable row, gap 14px, no visible scrollbar
  Each kid card: min-width 280px, max-width 320px, flex-shrink 0
```

**Each kid card (enhanced):**
```
┌──────────────────────────────────┐
│  [Photo]  Name                   │
│           Team Name              │
│           Sport · Season         │
│                          [Status]│
│                                  │
│  Attend.   Record    Next Event  │
│   94%       3-2        Sat       │
│                                  │
│  🏅 Badge or 🔥 Streak chip     │
└──────────────────────────────────┘
```

Where:
- **Photo:** If player has `photo_url`, show it as a 44px circle. Otherwise show gradient circle with initials (existing behavior).
- **Name:** Player first + last name (15px, weight 700)
- **Team:** Team name (12px, text-secondary)
- **Sport · Season:** Sport name + season name (11px, text-muted). Helps distinguish when same player is on multiple teams across sports.
- **Status pill:** Registration status badge — "Active" (green), "Pending" (amber), etc. Small pill in top-right corner of the card.
- **Stats row:** Same 3-stat grid as current (Attend, Record, Next), keep as-is
- **Badge/Streak:** Keep as-is

**Scroll arrows (same pattern as Season Carousel):**
```jsx
const scrollRef = useRef(null);
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(true);

const handleScroll = () => {
  const el = scrollRef.current;
  if (!el) return;
  setCanScrollLeft(el.scrollLeft > 0);
  setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
};

const scrollBy = (direction) => {
  scrollRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
};
```

Arrow buttons: 32px circles at left/right edges, white bg, shadow, chevron icon. Only show when scrollable in that direction.

**Selected card highlight:** Clicking a card should highlight it (sky border, light sky bg tint) and filter the body tabs below to that child's data. Keep the existing `selectedChildId` / `onChildSelect` logic.

**Single-child case:** If only 1 child, show a single card without scroll arrows. Card can be wider (full width).

**Data source:** The `registrationData` array in ParentDashboard already has the child/player data. Check what fields are available:
- Player name, team, photo_url
- If sport name and season name aren't in the current data, add them to the query (or show just the team name)

**Commit:** `feat(v2): kid cards horizontal scroll with enhanced info`

---

## Fix 3: Body Tabs — Fix Tab Switching (CRITICAL)

**File:** `src/pages/roles/ParentDashboard.jsx`

**Problem:** None of the body tab buttons work when clicked. The tabs don't switch. This means Schedule, Payments, Forms & Waivers, and Report Card are all inaccessible.

**Diagnose:**

1. Open ParentDashboard.jsx and find where BodyTabs is rendered
2. Check the `onTabChange` prop — is it wired to `setActiveTab`?
3. Check if `activeTab` state exists — `const [activeTab, setActiveTab] = useState('schedule')`
4. Check if the tab content renders conditionally based on `activeTab`:
   ```jsx
   {activeTab === 'schedule' && <ParentScheduleTab ... />}
   {activeTab === 'payments' && <ParentPaymentsTab ... />}
   ```
5. If any of these are missing or broken, fix them

**Common causes:**
- `onTabChange` not wired: `<BodyTabs onTabChange={setActiveTab}>` may be missing or `onTabChange` is a no-op
- Tab IDs don't match: the `tabs` array has IDs like `'schedule'` but the conditional checks for something else
- Tab content components crash silently (ErrorBoundary catches the error but shows nothing)
- The BodyTabs component itself might have a bug in how it calls `onTabChange`

**Fix whatever is broken.** Make sure:
- All 4 tabs switch on click: Schedule, Payments, Forms & Waivers, Report Card
- Each tab shows its content component
- If a tab content component crashes, wrap it in a try/catch or show a fallback

**Also check that each tab content component receives the correct props:**

**Schedule tab:**
- `events` — from `upcomingEvents` state
- `children` — from `registrationData` (to show child name tags per event)
- `onRsvp` — wire to existing QuickRsvpModal open handler

**Payments tab:**
- `paymentSummary` — from `paymentSummary` state
- Payment line items — from payment data in state

**Forms & Waivers tab:**
- Waiver data — from `usePriorityItems` hook results (waiver items)
- Per-child waiver completion status

**Report Card tab:**
- Per-child achievements/stats — from `childAchievements` state
- Season stats if available

If any tab content component doesn't receive data and renders empty, that's acceptable for now. The critical fix is making the tabs SWITCH.

**Commit:** `fix(v2): parent body tabs switching and content wiring`

---

## Fix 4: Financial Snapshot — Family-Appropriate Treatment

**File:** `src/pages/roles/ParentDashboard.jsx`

**Problem:** The Financial Snapshot card shows broken numbers and doesn't have family-relevant content. It should show what the family owes, what's been paid, and clear status.

**Fix:**

The FinancialSnapshot component is shared and already supports the right props. The issue is what ParentDashboard passes to it.

Find where FinancialSnapshot is rendered in ParentDashboard.jsx and update the props:

```jsx
<FinancialSnapshot
  overline="Family Balance"
  heading={`${selectedSeason?.name || 'Current Season'}`}
  headingSub="Season Fees"
  projectedRevenue={null}  // Parents don't see projected revenue
  collectedPct={
    paymentSummary.totalDue > 0
      ? Math.round((paymentSummary.totalPaid / (paymentSummary.totalPaid + paymentSummary.totalDue)) * 100)
      : 100
  }
  receivedAmount={`$${Number(paymentSummary.totalPaid || 0).toFixed(2)}`}
  receivedLabel="Paid"
  outstandingAmount={`$${Number(paymentSummary.totalDue || 0).toFixed(2)}`}
  outstandingLabel="Outstanding"
  breakdown={null}  // OR if you have per-child or per-fee-type breakdown, pass it
  dueDateText={
    paymentSummary.totalDue > 0
      ? `Next payment due ${paymentSummary.nextDueDate || 'soon'}`
      : null
  }
  primaryAction={
    paymentSummary.totalDue > 0
      ? { label: 'Pay Balance Now →', onClick: () => onNavigate?.('payments'), variant: 'success' }
      : null
  }
  secondaryAction={
    paymentSummary.totalDue > 0
      ? { label: 'View Details', onClick: () => onNavigate?.('payments') }
      : null
  }
/>
```

**If fully paid:** When `paymentSummary.totalDue === 0`, the card should show a "Paid in Full" state:
- Collected percentage: 100%
- Received amount in green
- Outstanding: "$0.00"
- No action buttons needed
- Maybe a small "✓ All Paid" badge

Check what `paymentSummary` contains. The ParentDashboard data fetching computes `{ totalDue, totalPaid, unpaidItems }`. Use these directly.

**Commit:** `feat(v2): parent financial snapshot family treatment`

---

## Fix 5: Navigation Links in TopBar

**File:** `src/pages/roles/ParentDashboard.jsx`

**Problem:** The TopBar nav links (Home, Schedule, Payments) need to actually navigate. Check if they're wired correctly.

**Fix:**

Find where TopBar is rendered. Verify the `navLinks` prop has correct pageIds:

```jsx
<TopBar
  roleLabel="Lynx Parent"
  navLinks={[
    { label: 'Home', pageId: 'dashboard', isActive: true },
    { label: 'Schedule', pageId: 'schedule' },
    { label: 'Payments', pageId: 'payments' },
  ]}
  ...
/>
```

Verify each `pageId` exists in `routes.js`. The nav links should work the same way as admin TopBar links.

**Commit:** `fix(v2): parent topbar navigation links` (only if broken)

---

## Fix 6: Progress Card — Child Name Fix

**File:** `src/pages/roles/ParentDashboard.jsx`

**Problem:** The milestone/progress card at bottom right says "Sister's Progress" — it's using the literal player name "Sister" instead of the actual child's name. Also shows "0 / 1,000 XP".

**Fix:**

Find where MilestoneCard is rendered. The title should use the selected child's actual name or show family-level progress:

```jsx
<MilestoneCard
  trophy="🏅"
  title={`${selectedChild?.first_name || 'Family'}'s Progress`}
  subtitle={`${xpData?.level ? `Level ${xpData.level}` : 'Getting started'}`}
  xpCurrent={xpData?.currentXp || 0}
  xpTarget={xpData?.xpToNext || 1000}
  variant="gold"
  onClick={() => onNavigate?.('achievements')}
/>
```

The `selectedChild` should come from the currently selected kid card (or the first child if none selected). Check what state variable holds the active child reference.

The "Sister" name issue means the test data has players literally named "Sister 1", "Sister 2". That's test data, not a code bug. But the code should still be pulling from the actual player name field, not hardcoding anything.

**Commit:** `fix(v2): parent milestone card uses child name`

---

## EXECUTION ORDER

1. Fix 1 — Floating point formatting (blocks visual QA of everything else)
2. Fix 2 — Kid cards horizontal scroll (major layout fix)
3. Fix 3 — Body tabs switching (critical functionality)
4. Fix 4 — Financial snapshot family treatment
5. Fix 5 — TopBar navigation (verify and fix if needed)
6. Fix 6 — Progress card child name

Build and verify after EACH fix. Push after all are committed.

---

## POST-FIX VERIFICATION

1. Load `/dashboard` as Parent
2. Financial snapshot shows properly formatted dollar amounts (no floating point mess)
3. Kid cards scroll horizontally with arrows, each card shows player photo/name/team/sport
4. Clicking a kid card highlights it
5. All 4 body tabs switch on click: Schedule, Payments, Forms & Waivers, Report Card
6. Schedule tab shows events with child name tags and RSVP buttons
7. Payments tab shows payment info
8. Financial snapshot shows "Paid" vs "Outstanding" with correct family totals
9. Progress card shows actual child name, not "Sister"
10. TopBar nav links work (Home, Schedule, Payments)
11. Switch to Admin — verify admin dashboard still works, financial snapshot formatting is correct
12. Switch to Coach — verify coach dashboard still works
13. No console errors on any role

Report results.
