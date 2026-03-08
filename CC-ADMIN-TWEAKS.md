# CC-ADMIN-TWEAKS — Admin Dashboard Card Fixes Round 2

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-ADMIN-CARDS-REDESIGN (completed), CC-FONT-SWAP (completed or in flight)

---

## CONTEXT

Carlos reviewed the admin dashboard after CC-ADMIN-CARDS-REDESIGN and has specific fixes for each card. This is a targeted fix spec — no new features, just adjustments to existing cards.

---

## RULES

1. Read every file before modifying
2. Commit after each phase
3. TSC verify after each phase
4. Do NOT change card grid positions — only change internals

---

## PHASE 1: Org Health Hero Card Fixes

Read: `src/components/dashboard/OrgHealthHero.jsx`

### Fix 1.1: Needs Attention items — right-align the quantities

The bullet points and text labels are currently sitting next to the circle graph. Move the entire needs-attention list to the RIGHT side of the card. The quantity badges (1, 42, 2, 4) should be right-aligned at the card edge. The bullet + text label sits to the left of the badge. The list should NOT overlap or crowd the circle graph.

Layout:
```
┌──────────────────────────────────────────────┐
│         BLACK HORNETS ATHLETICS               │
│                                              │
│    ┌──────────┐         Pending reg    ● [1] │
│    │    74     │        Overdue pay    ● [42] │
│    │  Needs    │     Unrostered plyr   ● [2]  │
│    │ Attention │      No schedule      ● [4]  │
│    └──────────┘                              │
│                                              │
│  KPI stat cards (2 rows × 5 cols)            │
└──────────────────────────────────────────────┘
```

### Fix 1.2: Reduce "NEEDS ATTENTION" text size

The text "NEEDS ATTENTION" currently bleeds into the circle graph. Reduce it:
- If it's inside the circle: make it `text-r-xs` and ensure it fits below the number
- If it's a label near the graph: make it smaller so there's clear separation from the ring

### Fix 1.3: Expand KPI stat cards to 2 rows × 5 columns

Currently there are 8 KPI pills in 2×4. Add 2 more to make a 2×5 grid:

**Row 1:** Teams | Players | Collected | Waivers | Open Spots
**Row 2:** Events | Coaches | Outstanding | Overdue | Pending Reg

Choose the 10 most useful KPIs. Some new ones to add:
- **Open Spots** — total roster spots unfilled across all teams (teams not full)
- **Pending Reg** — registrations awaiting approval
- Or: **Uniforms** — players without jersey numbers assigned
- Pick a 4th that makes sense based on what data is available

Each KPI: icon + big number + 1-word label. Increase the font size of the number and the icon size inside each pill. Use `text-r-lg font-extrabold` for the number, `text-r-xs` for the label. Icons should be `w-5 h-5`.

Grid: `grid grid-cols-5 gap-2` for each row, fitting within the card width.

**Commit:** `git add -A && git commit -m "phase 1: org health — right-align needs-attention, smaller label, 2x5 KPI grid"`

---

## PHASE 2: Financial Summary Card Fixes

Read: `src/components/dashboard/FinancialSummaryCard.jsx`

### Fix 2.1: Add category breakdown table

Below the bar graph and above the buttons, add a breakdown row showing collected vs owed PER CATEGORY.

Read the existing Supabase payment queries to find what payment categories/types exist. Common ones: Registration Fees, Uniforms, Monthly Dues, Court Fees, Tournament Fees, etc.

For each category, show:
- Amount on top: `$1,000/$3,200` format — collected/total — `text-r-base font-bold`
- Category title underneath: `text-r-xs text-slate-500`
- Same visual style as the KPI stat pills in the hero card

Layout: horizontal row of category breakdowns, as many as fit. If there are more than 5 categories, scroll horizontally or wrap to 2 rows.

```
┌──────────────────────────────────────────────┐
│  $ FINANCIALS                                │
│  $1,875.01              $4,155.15            │
│  Collected              Outstanding          │
│  ████████████░░░░░░░░░░░░░░░░░░░░           │
│                                              │
│  $1,000    $500     $200     $175            │
│  /$3,200   /$800    /$600    /$555           │
│  Regist.   Uniforms  Dues   Courts           │
│                                              │
│  [Reminders (42)]  [Payments >]              │
└──────────────────────────────────────────────┘
```

If payment categories don't exist in the database schema, derive them from invoice descriptions or line item types. Read the queries first to understand the data structure.

### Fix 2.2: Button colors

Change the "Payments >" button color from black to `bg-lynx-navy text-white`. Not pure black — the Lynx navy (#0B1628).

**Commit:** `git add -A && git commit -m "phase 2: financials — category breakdown, navy button color"`

---

## PHASE 3: Calendar Strip — Back to Horizontal

Read the CalendarStripCard component:
```bash
find src -name "*Calendar*" -o -name "*calendar*" | head -10
cat [found file]
```

### Fix 3.1: Change from vertical to horizontal layout

The calendar strip is currently showing days stacked vertically (SUN 1, MON 2, etc. going downward). Change back to HORIZONTAL — days in a row left to right:

```
SUN  MON  TUE  WED  [THU]  FRI  SAT
 1    2    3    4    [5]    6    7
```

Current day highlighted with `bg-lynx-sky text-white rounded-lg`.

The card is narrow (4 columns wide in the 24-col grid), so the horizontal strip should be compact. Each day: abbreviated name on top, number below, in a tight grid. If they don't fit horizontally at this width, use `text-r-xs` and reduce padding.

### Fix 3.2: Layout order — top to bottom

1. Month header with navigation arrows + "Today" button
2. Horizontal calendar strip (the 7 days)
3. "View Full Schedule" button — `bg-lynx-navy text-white rounded-lg w-full py-2 text-r-sm font-bold`
4. Events for selected day (below the button)
   - If no events: "No events on this day"
   - If events: show up to 3, then "+X more"

The button goes BETWEEN the strip and the events, not at the very bottom.

### Fix 3.3: Button color

"View Full Schedule" button: `bg-lynx-navy text-white` — navy, not black.

**Commit:** `git add -A && git commit -m "phase 3: calendar strip — horizontal layout, button below strip, navy color"`

---

## PHASE 4: KPI Stats + All Teams + Quick Actions Fit

### Fix 4.1: KPI Stats — resize to fit card

Read `KPIRow.jsx` or the KPI stats component. The stat cards inside need to fit within the card without clipping. At grid size 6×6 (24-col units), the card is small-ish.

- Use `grid grid-cols-2 gap-2` for the 4 KPI cards inside
- Each card: compact padding `p-2`, number `text-r-xl font-extrabold`, label `text-r-xs`
- Icons: `w-4 h-4`
- Cards should not overflow the parent

### Fix 4.2: All Teams — reduce font sizes to fit

Read `TeamsTable.jsx` or the teams table component. The text is too large and columns are getting cut off.

- Table header: `text-r-xs font-bold uppercase`
- Team name: `text-r-sm font-bold`
- Record, Players, Health, Status: `text-r-sm`
- Health bars: keep thin `h-1.5`
- Status chip: `text-r-xs`
- Make sure the "Status" column doesn't get cut off — reduce overall text sizes so all columns fit
- Add `overflow-x-auto` on the table wrapper as a safety net

### Fix 4.3: Quick Actions — verify buttons fit

Read `AdminQuickActions.jsx`. After CC-ADMIN-CARDS-REDESIGN, the buttons should already fit. Verify they do. If any label text is still clipped:
- Use `text-r-xs` for button labels
- Use `truncate` on label text
- Counter badges: `w-4 h-4 text-[10px]` if they need to be smaller

**Commit:** `git add -A && git commit -m "phase 4: KPI stats fit, teams table readable, quick actions verified"`

---

## PHASE 5: Remove Filter Card + Connect Header Filters + Welcome Banner Dynamic

### Fix 5.1: Remove the Filter Card widget from admin dashboard

Carlos realized the filter dropdowns already exist in the top header bar (Spring 2026 · Active | All Sports | All Teams). The separate Filter Card between the welcome banner and notifications is redundant.

Remove `dashboard-filters` from the admin default layout. In the admin widget list, remove it from the initial active widgets.

Update the default layout — remove this entry:
```js
{ i: "dashboard-filters", ... }
```

### Fix 5.2: Wire up the header filters to the dashboard

Read the admin dashboard orchestrator file. Find where the header filter dropdowns (Season, Sport, Team) are rendered.

These filters must:
1. Default to "All" (org-wide view)
2. When changed, update a shared filter state
3. Pass the filter state to ALL dashboard widgets via `sharedProps`
4. Each widget that supports filtering adjusts its data accordingly

If the filters are already in the header (from CC-SIDEBAR-NAV-FULLWIDTH), they may just need to be wired to state that propagates down. Check what's currently connected vs what's just visual.

```bash
# Find the filter components
grep -r "All Sports\|All Teams\|Spring 2026" src/ --include="*.jsx" -l | head -10
```

### Fix 5.3: Welcome Banner — dynamic season from filter

Read `WelcomeBanner.jsx` (or the shared welcome component):
```bash
find src -name "*Welcome*" -o -name "*welcome*" | head -10
cat [found file]
```

The sub-line currently shows "Spring 2026 · Thursday, March 5". The "Spring 2026" part should update based on the active filter selection:
- If filtered to "Spring 2026": shows "Spring 2026 · Thursday, March 5"
- If filtered to "Summer 2026": shows "Summer 2026 · Thursday, March 5"
- If filtered to "All": shows the current/active season name, or "All Seasons · Thursday, March 5"

The welcome banner should receive the active filter state from props and display the selected season.

**Commit:** `git add -A && git commit -m "phase 5: remove filter card, wire header filters to dashboard, dynamic welcome banner"`

---

## PHASE 6: Season Journey — Enlarge Everything Inside

Read `SeasonJourneyList.jsx`:
```bash
cat src/components/dashboard/SeasonJourneyList.jsx
```

### Fix 6.1: Increase all internal text sizes

Everything inside the season journey cards is too small. Increase WITHOUT changing the card's grid size:

- Season name: `text-r-lg font-extrabold` (was likely `text-r-base` or smaller)
- Teams/players count: `text-r-sm` (was likely `text-r-xs`)
- Step tracker dots: `w-4 h-4` (was likely `w-2.5` or `w-3`) — make them bigger and more visible
- Step fraction (6/10): `text-r-base font-bold`
- "Order Jerseys" next-step label: `text-r-sm font-semibold text-amber-500`
- "Continue ›": `text-r-sm font-bold text-lynx-sky`
- "+4 more" link: `text-r-sm font-bold text-lynx-sky`
- Sport icon circles: `w-8 h-8` with `text-lg` emoji (was likely smaller)

### Fix 6.2: Verify per-season data is correct

The screenshot still shows "4 teams · 17 players" for every season. This is WRONG — each season should show its own counts.

Check the data source. Read the Supabase query that populates the season list:
```bash
grep -r "season" src/components/dashboard/SeasonJourneyList.jsx | head -20
```

If the query is fetching org-wide totals instead of per-season totals, fix the query to group by season_id. Each season card should show:
- Team count: number of teams IN THAT SEASON
- Player count: number of players registered FOR THAT SEASON

**Commit:** `git add -A && git commit -m "phase 6: season journey — enlarged internals, fix per-season data"`

---

## PHASE 7: Verify

```bash
npx tsc --noEmit
```

Test as Admin:
- Org Health: needs-attention right-aligned, smaller label, 2×5 KPI grid with 10 stats
- Financials: category breakdown visible, navy button colors
- Calendar: horizontal strip, button below strip before events, navy button
- KPI Stats: fit in card without clipping
- All Teams: readable, nothing cut off
- Filter card gone, header filters connected
- Welcome banner shows filtered season
- Season journey: larger text, correct per-season data
- No console errors

Test Coach + Parent — not broken by admin changes.

**Commit:** `git add -A && git commit -m "phase 7: admin tweaks parity check — all fixes verified"`

---

## NOTES FOR CC

- **Do NOT change card grid positions.** Only change what's inside the cards.
- **Navy color is `bg-lynx-navy` (#0B1628)**, not black. Use the Tailwind token.
- **The header filter dropdowns already exist visually** — they just need to be wired to state that propagates to widgets. Read the code to see what's connected vs decorative.
- **Per-season data in Season Journey is a data bug.** The query needs to filter/group by season_id. This is critical — fix it.
- **The category breakdown in Financials** depends on what payment categories exist in the database. Read the schema/queries first. If no categories exist, group by invoice description or payment type field.
