# CC-ADMIN-DASHBOARD-UX-ROUND2.md
# Admin Dashboard — UX Round 2: Clickability, Attention Detail, Financial Breakdown

## READ FIRST
1. `CLAUDE.md`
2. `src/pages/dashboard/DashboardPage.jsx` (widget layout + data loading)
3. `src/components/dashboard/OrgHealthHero.jsx` (header KPIs)
4. `src/components/dashboard/OrgFinancials.jsx` (financial snapshot)
5. `src/components/dashboard/SeasonJourneyList.jsx` (season cards)
6. `src/components/dashboard/SeasonJourneyRow.jsx` (horizontal stepper)

## SCOPE
5 targeted UX improvements. No structural rewrites. Each fix is independent.

---

## FIX 1 — Header KPI Stats: Make Clickable

**Problem:** The KPI cells in the dark hero header (Teams: 9, Players: 37, Coaches: 5, etc.) are static. Admin should be able to click each one to navigate to the relevant page.

**File:** `src/components/dashboard/OrgHealthHero.jsx`

### Changes:

**A. Add `onClick` and `page` props to KpiCell:**
```jsx
function KpiCell({ label, value, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/[0.04] transition-colors ${onClick ? 'hover:bg-white/[0.08] cursor-pointer' : ''}`}
    >
      {Icon && <Icon className="w-5 h-5 text-slate-500 shrink-0" />}
      <div className="min-w-0">
        <p className="text-white text-r-lg font-extrabold tabular-nums leading-tight">{value}</p>
        <p className="text-r-xs text-slate-500 truncate leading-tight">{label}</p>
      </div>
    </button>
  )
}
```

**B. Wire each KpiCell with its navigation target** (around lines 144-153):
```jsx
<KpiCell icon={Shield} label="Teams" value={kpis.teams || 0} onClick={() => onNavigate?.('teams')} />
<KpiCell icon={Users} label="Players" value={kpis.players || 0} onClick={() => onNavigate?.('registrations')} />
<KpiCell icon={DollarSign} label="Collected" value={`$${((kpis.revenueCollected || 0) / 1000).toFixed(1)}k`} onClick={() => onNavigate?.('payments')} />
<KpiCell icon={FileText} label="Waivers" value={`${kpis.waiverPct || 0}%`} onClick={() => onNavigate?.('waivers')} />
<KpiCell icon={Shirt} label="Open Spots" value={kpis.openSpots || 0} onClick={() => onNavigate?.('roster')} />
<KpiCell icon={Calendar} label="Events" value={kpis.eventsMonth || 0} onClick={() => onNavigate?.('schedule')} />
<KpiCell icon={UserCheck} label="Coaches" value={kpis.coaches || 0} onClick={() => onNavigate?.('coaches')} />
<KpiCell icon={DollarSign} label="Outstand." value={`$${((kpis.outstanding || 0) / 1000).toFixed(1)}k`} onClick={() => onNavigate?.('payments')} />
<KpiCell icon={AlertCircle} label="Overdue" value={kpis.overduePayments || 0} onClick={() => onNavigate?.('payments')} />
<KpiCell icon={ClipboardList} label="Pending" value={kpis.pendingReg || 0} onClick={() => onNavigate?.('registrations')} />
```

**C. The ACTION ITEMS count (the "130" in red from screenshot 2):** This value is part of the KPI grid. Make sure clicking it navigates to a full action items view. If there isn't a dedicated action items page, clicking it should open an expanded view. See Fix 2 below for the full action items list.

**Test:** Click each KPI cell. Verify it navigates to the correct page.

---

## FIX 2 — Action Items: Full Clickable List When Clicked

**Problem:** The header shows "130 action items" but clicking it has nowhere to go. The "3 items need action" strip (screenshot 1-2) shows a collapsed summary but there's no way to see ALL action items as a full clickable list with enough detail to know what each one is.

**Files:** `src/pages/dashboard/DashboardPage.jsx`, `src/components/dashboard/OrgHealthHero.jsx`

### Changes:

**A. Add an "Action Items" tab to the body tabs.** The dashboard body area currently has tabs like "Teams & Health", "Registrations", "Payments", "Schedules". Add a new first tab: **"Action Items"** (or "Needs Attention").

In `DashboardPage.jsx`, find where the body tabs are defined. The dashboard is widget-based, but looking at screenshot 2, there ARE tabs at the bottom ("Teams & Health", "Registrations", "Payments", "Schedules"). Find where these are rendered and add a new tab at position 0.

If tabs are inside a widget component, find that component and add the tab there.

If the entire dashboard is the widget grid with no separate tab system below it, then create one. The simplest approach: add a new widget to `adminWidgets` that renders the full action items list as a dedicated panel. Position it prominently.

**B. Build an ActionItemsList component** (can be inline in DashboardPage or a new file). This is a full, scrollable, clickable list of every action item across all seasons:

```jsx
function ActionItemsList({ actionItems, onNavigate, isDark }) {
  if (!actionItems || actionItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-3xl mb-2">✅</span>
        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>All clear!</p>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No items need your attention.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {actionItems.map((item, idx) => (
        <button
          key={item.id || idx}
          onClick={() => onNavigate?.(item.page)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
            isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            item.severity === 'critical' ? 'bg-red-500' :
            item.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {item.label}
            </p>
            {item.detail && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {item.detail}
              </p>
            )}
          </div>
          <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
        </button>
      ))}
    </div>
  )
}
```

Each row shows: severity dot (red/amber/blue), the label ("5 pending registrations awaiting approval"), the detail text, and a chevron. Clicking navigates to the relevant page.

**C. Wire the Action Items KPI cell** in OrgHealthHero to scroll to or focus this panel, OR navigate to a route that shows the full list. Simplest: add a `scrollToActionItems` callback or use `onNavigate?.('action-items')` and handle it in the dashboard to scroll/focus.

**D. The "REVIEW NOW" link** in the attention strip (screenshot 1) should also open this full action items view.

**Test:** Click the action items count in the header. Verify the full list appears. Click each item in the list. Verify navigation to the correct page.

---

## FIX 3 — Season Card Attention Pill: Make More Visible + Show What Needs Attention

**Problem:** The attention pills on season cards (from previous spec) exist but are too subtle. A card with 87 items gives no indication of WHAT those items are.

**File:** `src/components/dashboard/SeasonJourneyList.jsx`

### Changes:

**A. Make the pill more prominent.** Change from the current small red dot + number to a bolder design:
```jsx
{actionCount > 0 && (
  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500 text-white shrink-0 shadow-sm">
    ⚠ {actionCount}
  </span>
)}
```

This uses a solid red background with white text instead of the subtle `bg-red-500/15 text-red-500`. The warning emoji adds visual weight.

**B. Add a hover tooltip or expandable detail** showing what the items are. The simplest approach: pass per-season action item DETAILS (not just counts) and show them on hover or click.

Update the props to accept `actionDetails` per season:
```jsx
// Shape: { [seasonId]: [{ label: 'Pending Registrations', count: 5 }, { label: 'Unrostered Players', count: 82 }] }
```

Add a hover/click expandable on the pill:
```jsx
{actionCount > 0 && (
  <div className="relative group shrink-0">
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500 text-white shadow-sm cursor-pointer">
      ⚠ {actionCount}
    </span>
    {/* Hover tooltip showing breakdown */}
    <div className="absolute right-0 top-full mt-1 w-52 rounded-xl shadow-lg border z-50 p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
      style={{ background: isDark ? '#1a2d44' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
      {actionDetails?.map((item, i) => (
        <div key={i} className={`flex items-center justify-between py-1.5 px-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <span>{item.label}</span>
          <span className="font-bold text-red-500">{item.count}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

**C. In DashboardPage.jsx**, compute `perSeasonActionDetails` (not just counts):
```javascript
const [perSeasonActionDetails, setPerSeasonActionDetails] = useState({})
// Shape: { [seasonId]: [{ label: 'Pending Registrations', count: 5 }, ...] }
```

Pass it to SeasonJourneyList:
```jsx
component: <SeasonJourneyList 
  ...existing props...
  actionCounts={perSeasonActionCounts}
  actionDetails={perSeasonActionDetails}
  onNavigate={onNavigate} 
/>
```

**Test:** Hover over a season card's attention pill. Verify tooltip shows breakdown (e.g., "Pending Registrations: 1, Unrostered Players: 82"). Verify the pill is visually prominent (solid red, easy to spot at a glance).

---

## FIX 4 — Financial Snapshot: Show Collected/Total Per Category

**Problem:** The financial breakdown shows category amounts ($4,450, $1,150, etc.) but it's unclear if those are collected amounts, total amounts, or what. Carlos wants it to show collected vs total: "Registration - $XXXX/$4,450".

**File:** `src/components/dashboard/OrgFinancials.jsx`

### Changes:

**Update the category breakdown section** (around lines 69-82). Change from showing just `cat.collected` to showing `collected/total`:

```jsx
{categories.map(cat => {
  const pct = cat.total > 0 ? Math.round((cat.collected / cat.total) * 100) : 0
  return (
    <div key={cat.label} className="text-center">
      <p className={`text-[10px] font-bold uppercase tracking-[1px] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        {cat.label}
      </p>
      <p className={`text-sm font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
        ${cat.collected.toLocaleString()}
        <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {' '}/ ${cat.total.toLocaleString()}
        </span>
      </p>
      {/* Mini progress bar */}
      <div className={`w-full h-1 rounded-full mt-1 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${pct}%`, 
            backgroundColor: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' 
          }}
        />
      </div>
    </div>
  )
})}
```

Each category now shows: "Registration" label, "$1,875 / $4,450" (collected out of total), and a tiny progress bar colored green/amber/red based on collection percentage.

**Test:** Verify each category shows collected/total format. Verify the mini progress bars render correctly. Verify the numbers match the data.

---

## FIX 5 — Journey Stepper Steps: Make Clickable

**Problem:** The horizontal journey stepper (Org Profile > Season > Open Reg > Teams > Coaches > Schedule) shows progress but the steps are not clickable. Admin should be able to click on the NEXT step (or any incomplete step) to navigate to the page where they can complete it.

**Files:** `src/components/dashboard/SeasonJourneyRow.jsx` (horizontal stepper), `src/components/dashboard/SeasonJourneyList.jsx` (compact card dots)

### Changes:

**A. In SeasonJourneyRow.jsx**, add navigation targets to each step:

```javascript
const JOURNEY_STEPS = [
  { id: 'setup', label: 'Setup', page: 'organization' },
  { id: 'tryouts', label: 'Tryouts', page: 'schedule' },
  { id: 'rosters', label: 'Rosters', page: 'roster' },
  { id: 'season', label: 'Season', page: 'seasons' },
  { id: 'playoffs', label: 'Playoffs', page: 'standings' },
  { id: 'wrapup', label: 'Wrap-up', page: 'season-archives' },
]
```

Then make each step dot/circle clickable (only for incomplete steps):
```jsx
{JOURNEY_STEPS.map((step, idx) => {
  const isDone = idx < activeIdx
  const isActive = idx === activeIdx
  const isClickable = !isDone // Can click active and upcoming steps
  
  return (
    <button
      key={step.id}
      onClick={() => isClickable && onNavigate?.(step.page)}
      className={`flex flex-col items-center gap-1 ${isClickable ? 'cursor-pointer group' : 'cursor-default'}`}
      title={isDone ? `${step.label} — Complete` : `Go to ${step.label}`}
    >
      {/* ... existing circle rendering ... */}
      {/* Add hover effect for clickable steps */}
    </button>
  )
})}
```

Add a subtle hover effect: for active/upcoming steps, `group-hover:scale-110 transition-transform` on the circle.

**B. In SeasonJourneyList.jsx**, add the same navigation to the compact dot stepper. The small dots (line ~100) currently have `title={step.label}` but no onClick. Add:

```javascript
const JOURNEY_STEPS = [
  { id: 'org-profile', label: 'Org Profile', page: 'organization' },
  { id: 'create-season', label: 'Create Season', page: 'seasons' },
  { id: 'registration', label: 'Registration', page: 'registrations' },
  { id: 'create-teams', label: 'Create Teams', page: 'teams' },
  { id: 'assign-coaches', label: 'Assign Coaches', page: 'coaches' },
  { id: 'roster-players', label: 'Roster Players', page: 'roster' },
  { id: 'order-jerseys', label: 'Order Jerseys', page: 'jerseys' },
  { id: 'build-schedule', label: 'Build Schedule', page: 'schedule' },
  { id: 'setup-payments', label: 'Setup Payments', page: 'paymentsetup' },
  { id: 'go-live', label: 'Go Live', page: 'season-management' },
]
```

Make the dots clickable:
```jsx
<button
  key={step.id}
  onClick={() => !completedSteps[idx] && onNavigate?.(step.page)}
  className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold transition-transform ${
    !completedSteps[idx] ? 'hover:scale-125 cursor-pointer' : 'cursor-default'
  } ${
    completedSteps[idx]
      ? 'bg-emerald-500 text-white'
      : idx === nextStepIdx
        ? 'bg-amber-500 text-white'
        : isDark ? 'bg-white/[0.08] text-slate-500' : 'bg-slate-200 text-slate-400'
  }`}
  title={completedSteps[idx] ? `${step.label} ✓` : `Go to: ${step.label}`}
/>
```

**Test:** Click an incomplete step in the horizontal stepper. Verify navigation to the correct page. Click a completed step. Verify nothing happens. Click the amber "next step" dot. Verify navigation.

---

## EXECUTION ORDER
1. Fix 1 (clickable KPIs) — smallest, most self-contained
2. Fix 5 (clickable stepper) — small, two files
3. Fix 4 (financial breakdown collected/total) — small, one file
4. Fix 3 (better attention pills with tooltip) — medium
5. Fix 2 (full action items list) — largest, new component + tab

## COMMIT
```bash
git add -A
git commit -m "Admin dashboard UX round 2: clickable KPIs, action items list, financial breakdown, stepper nav, attention pills"
git push
```

## VERIFICATION CHECKLIST
- [ ] `npm run dev` starts without errors
- [ ] Each header KPI cell is clickable and navigates to the correct page
- [ ] Clicking action items count opens a full clickable list
- [ ] Each action item in the list navigates to the correct page
- [ ] Season card attention pills are visually prominent (solid red)
- [ ] Hovering attention pill shows breakdown tooltip
- [ ] Financial breakdown shows "$collected / $total" per category
- [ ] Mini progress bars render under each financial category
- [ ] Journey stepper steps are clickable for incomplete steps
- [ ] Completed steps are not clickable
- [ ] Clicking an incomplete step navigates to the correct page
