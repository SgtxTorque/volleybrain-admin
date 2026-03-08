# CC-ADMIN-DASHBOARD-REWORK — Admin Dashboard Layout Rework + Season Management

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign` (continue on existing branch)
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-PAGES-REDESIGN (completed), CC-DASHBOARD-POLISH (in flight or queued)
**Mobile Reference Repo:** `SgtxTorque/volleybrain-mobile3` (clone to `/tmp/mobile-ref` if not already there)

---

## CONTEXT

Carlos reviewed the admin dashboard on a 27" 1440p monitor and identified major layout and functionality changes needed. The key themes:

1. The **Org Health Hero card** needs the same game-day hero treatment as the coach screen — tall, image-capable, prominent
2. The **4 Season Journey cards** should move from a horizontal row to a **vertical list to the right** of the hero, resized and compacted
3. A **dedicated Season Management page** is needed — one page where an admin handles EVERYTHING for a specific season (registration, payments, assignments, schedules, uniforms) with a guided workflow tracker
4. The **Org Health score calculation** needs to be transparent and based on actual tracker completion across all seasons
5. **Needs Attention** items should expand to cover ALL org-wide blockers (uniforms, schedules, etc.) — calculated from incomplete steps across all season trackers
6. An **admin setup wizard tracker** (power bar style) should sit below the header if setup isn't complete
7. A **detailed action items checklist** for knocking out pending/past-due/deadline tasks
8. **Quick action buttons** with counter badges
9. **Font sizes bumped up 3 sizes** across the admin dashboard

---

## RULES (same as all prior specs)

1. **Read every file before modifying it** — no assumptions
2. **Archive before replace** — copy to `src/_archive/` with timestamp
3. **Never delete files** — only add or modify
4. **Preserve all Supabase data fetching** — extract and reuse
5. **Schema-first** — check existing queries before touching data
6. **No file over 500 lines** — split into sub-components
7. **Commit after each phase**
8. **TSC verify** (`npx tsc --noEmit`) after each phase
9. **Test all four roles** render without console errors after each phase
10. **Tailwind only** — Lynx color tokens
11. **Do not remove existing features** — tweak, resize, rearrange, add

---

## PHASE 0: Archive + Read Current State

```bash
# Archive current admin dashboard files
mkdir -p src/_archive/admin-rework-$(date +%Y%m%d)
cp src/components/dashboard/OrgHealthHero.jsx src/_archive/admin-rework-$(date +%Y%m%d)/
cp src/components/dashboard/SeasonJourneyRow.jsx src/_archive/admin-rework-$(date +%Y%m%d)/
cp src/components/dashboard/KPIRow.jsx src/_archive/admin-rework-$(date +%Y%m%d)/
cp src/components/dashboard/ActionItemsCard.jsx src/_archive/admin-rework-$(date +%Y%m%d)/
cp src/components/dashboard/ComplianceCards.jsx src/_archive/admin-rework-$(date +%Y%m%d)/
cp src/components/dashboard/UpcomingEventsCard.jsx src/_archive/admin-rework-$(date +%Y%m%d)/

# Find and archive the admin dashboard layout orchestrator
grep -r "OrgHealthHero\|SeasonJourneyRow" src/ --include="*.jsx" -l
# Archive that file too

# Read all current admin dashboard components
cat src/components/dashboard/OrgHealthHero.jsx
cat src/components/dashboard/SeasonJourneyRow.jsx
cat src/components/dashboard/KPIRow.jsx
cat src/components/dashboard/ActionItemsCard.jsx
cat src/components/dashboard/ComplianceCards.jsx

# Read the admin dashboard layout file
# (whatever file renders these components together)

# Clone mobile repo if not already done
if [ ! -d /tmp/mobile-ref ]; then
  git clone https://github.com/SgtxTorque/volleybrain-mobile3.git /tmp/mobile-ref
fi

# Read mobile admin home components
find /tmp/mobile-ref/src -name "*Admin*" -o -name "*admin*" | head -20
# Read those files for mobile treatment reference
```

**Commit:** `git add -A && git commit -m "phase 0: archive admin dashboard files for rework"`

---

## PHASE 1: Admin Font Size Bump (3 sizes up)

**Goal:** Bump all font sizes across the admin dashboard by 3 Tailwind sizes.

### Step 1.1: Apply size bump to ALL admin dashboard components

| Current | New | Context |
|---------|-----|---------|
| `text-[10px]` / `text-[11px]` | `text-sm` (14px) | Micro labels |
| `text-xs` (12px) | `text-base` (16px) | Sub-labels, meta |
| `text-sm` (14px) | `text-lg` (18px) | Body text, table cells |
| `text-base` (16px) | `text-xl` (20px) | Card titles |
| `text-lg` (18px) | `text-2xl` (24px) | Section headers |
| `text-xl` / `text-2xl` | `text-3xl` (30px) | Page headers |
| `text-[32px]` | `text-5xl` (48px) | Stat card big numbers |
| `text-[56px]` | `text-7xl` (72px) | Hero numbers |

Apply to:
- `OrgHealthHero.jsx`
- `SeasonJourneyRow.jsx`
- `KPIRow.jsx`
- `ActionItemsCard.jsx`
- `ComplianceCards.jsx`
- `UpcomingEventsCard.jsx`
- `TeamsTable.jsx`
- `FinancialSummaryCard.jsx`
- `TeamWallPreviewCard.jsx`
- The admin dashboard layout file itself
- Any admin page components (TeamsPage stat rows, PaymentsPage stat rows, RegistrationsPage stat rows)

**Do not change relative hierarchy** — smaller stays smaller than bigger, just shift everything up.

### Step 1.2: Verify
```bash
npx tsc --noEmit
```
Check admin dashboard at 1440p — all text comfortably readable.

**Commit:** `git add -A && git commit -m "phase 1: admin dashboard font sizes bumped 3 sizes for 1440p"`

---

## PHASE 2: Org Health Hero Card — Game Day Treatment

**Goal:** The Org Health Hero card needs the same tall, prominent treatment as the coach's Game Day Hero.

### Step 2.1: Read current OrgHealthHero

```bash
cat src/components/dashboard/OrgHealthHero.jsx
```

### Step 2.2: Redesign the hero

The Org Health Hero should feel like the admin's "command center at a glance" — the same visual weight as the coach's game day hero.

**New visual treatment:**
- **Dark navy gradient background** matching coach hero: `bg-gradient-to-br from-[#0B1628] via-[#122240] to-[#0B1628]` with subtle dot-grid pattern overlay
- **Increased height** — 50% taller than current, let the content breathe
- `rounded-2xl p-8 mb-5`
- **Layout inside the hero (two sections):**

**Left side (~60%):**
- Org name: `text-sm text-white/40 uppercase tracking-wider`
- "Organization Health" title: `text-3xl font-extrabold text-white`
- The health score ring (conic gradient) — keep the existing ring but make it larger
- Health score number inside the ring: `text-5xl font-extrabold text-white`
- Below the ring: KPI pills row (players, families, coaches, teams) — existing data, but styled for dark background with `bg-white/10 text-white/80` pills

**Right side (~40%):**
- **Needs Attention / Urgent Actions** section — white text on dark background
- Title: "NEEDS ATTENTION" in `text-sm font-bold uppercase tracking-wider text-amber-400`
- List of ALL org-wide blockers — not just a few. Calculate from incomplete steps across ALL season trackers:
  - Players without uniforms
  - Schedules not set for active seasons
  - Overdue payments (count)
  - Unsigned waivers (count)
  - Unrostered players (count)
  - Incomplete evaluations
  - Any other incomplete tracker steps across all seasons
- Each item: amber dot + description + count badge
- If nothing needs attention: green checkmark + "All systems go" in green

### Step 2.3: Org Health Score Calculation

**Document and implement a transparent calculation.** The health score should be derived from actual completion metrics across the org:

```
Health Score = weighted average of:
  - Registration completion (all players registered + approved): 15%
  - Payment collection rate (% of billed amount collected): 20%
  - Waiver completion (% of waivers signed): 15%
  - Roster assignment (% of players rostered to teams): 10%
  - Schedule completeness (% of teams with schedules set): 10%
  - Evaluation completion (% of players evaluated): 10%
  - Uniform assignment (% of players with jersey numbers): 5%
  - Coach assignment (% of teams with assigned coaches): 5%
  - Compliance (background checks, certifications current): 10%
```

Each component scores 0–100. Weighted average produces the final score.

**Read existing queries** to see what data is already being fetched. Add any additional queries needed. The score should update in real-time based on actual database state.

**Needs Attention items** should be derived from the same data — any component scoring below 80% generates a needs-attention item, and any component scoring below 50% is flagged as urgent (red instead of amber).

### Step 2.4: Verify hero renders with correct data and dark treatment.

**Commit:** `git add -A && git commit -m "phase 2: org health hero — dark game-day treatment, transparent health score, expanded needs-attention"`

---

## PHASE 3: Season Journey Cards — Vertical List + Compact Design

**Goal:** Move the 4 season journey tracker cards from a horizontal row to a vertical list to the right of the hero card, resized and compacted.

### Step 3.1: Read current SeasonJourneyRow

```bash
cat src/components/dashboard/SeasonJourneyRow.jsx
```

### Step 3.2: New layout

The admin dashboard top section becomes:

```
┌────────────────────────────────────┬────────────────────────────┐
│  ORG HEALTH HERO (dark, ~60%)      │  SEASON JOURNEY LIST       │
│  - Health ring + score             │  (vertical, ~40%)          │
│  - KPI pills                       │                            │
│  - Needs Attention                 │  ┌────────────────────────┐│
│                                    │  │ Spring 2026 · VB  72%  ││
│                                    │  │ ████████░░░░  Continue →││
│                                    │  │ Blocker: 3 payments due ││
│                                    │  ├────────────────────────┤│
│                                    │  │ Spring 2026 · BK  45%  ││
│                                    │  │ █████░░░░░░░  Continue →││
│                                    │  │ Blocker: No schedule    ││
│                                    │  ├────────────────────────┤│
│                                    │  │ Summer 2026 · VB  10%  ││
│                                    │  │ █░░░░░░░░░░░  Continue →││
│                                    │  │ Blocker: 0 registered   ││
│                                    │  ├────────────────────────┤│
│                                    │  │ + 2 more seasons        ││
│                                    │  └────────────────────────┘│
└────────────────────────────────────┴────────────────────────────┘
```

### Step 3.3: Redesign SeasonJourneyRow → SeasonJourneyList

Create or refactor: `src/components/dashboard/SeasonJourneyList.jsx`

**Each season card (compact):**
- White card, standard border, `rounded-xl p-4` — stacked vertically
- **Row 1:** Season name + Sport badge (e.g. "Spring 2026" + "VB" sky pill) — left. Completion percentage — right, `text-xl font-extrabold`, colored by threshold (green ≥ 75, amber ≥ 40, red < 40)
- **Row 2:** Power bar / progress tracker — resized to fit. The full journey steps from the current card but compressed:
  - If there's room: show mini step indicators (small dots or abbreviated labels)
  - If resizing makes text unreadable: instead show just the power bar + "Blocker: {what's blocking}" + "N items to handle"
- **Row 3:** "Continue →" button that navigates to the **Season Management Page** (Phase 4)

**List behavior:**
- Show up to 6 season cards in the vertical list
- If more than 6: show "+N more seasons" link that expands or navigates to a full seasons list
- Cards are sorted by urgency (lowest completion first) so the most-needing-attention season is at top

**"Continue →" button navigation:**
- Currently goes to settings/season page. Change to navigate to the new **Season Management Page** (built in Phase 4) with that season's ID pre-loaded.
- If the Season Management Page doesn't exist yet (Phase 4 hasn't run), keep the current navigation as fallback.

### Step 3.4: Update admin dashboard layout

In the admin dashboard layout file:
- The top section becomes a 2-column grid: `grid-template-columns: 60% 40%` (or `3fr 2fr`)
- Left: Org Health Hero
- Right: Season Journey List (vertical stack)
- Below: rest of dashboard content

### Step 3.5: Verify

**Commit:** `git add -A && git commit -m "phase 3: season journey cards — vertical list right of hero, compact design, blocker labels"`

---

## PHASE 4: Season Management Page

**Goal:** Create a dedicated page where an admin handles EVERYTHING for a specific season on one screen, with a guided workflow tracker.

### Step 4.1: Plan the page

Route: `/admin/seasons/:seasonId` (or whatever routing pattern the app uses)

This page is the admin's one-stop shop for a single season. It auto-populates with that season's data and walks them through everything needed to get players to first practice.

### Step 4.2: Season Management Workflow Steps

The full lifecycle of admin tasks to get a season running:

```
1. CREATE SEASON        → Season name, sport, dates, age groups (done via wizard)
2. OPEN REGISTRATION    → Set registration window, fees, forms, waivers
3. MANAGE REGISTRATIONS → Approve/deny applications, review player info
4. COLLECT PAYMENTS     → Track payments, send reminders, handle overdue
5. ASSIGN TEAMS         → Create teams, assign players to teams
6. ASSIGN COACHES       → Assign coaches to teams
7. SET POSITIONS        → Ensure coaches have set player positions
8. CREATE SCHEDULE      → Games, practices, events for each team
9. UNIFORMS/JERSEYS     → Assign jersey numbers to all players
10. VERIFY & LAUNCH     → Final check — everything ready for first practice
```

Each step has a completion status (0–100%) derived from actual data.

### Step 4.3: Page layout

`src/pages/admin/SeasonManagementPage.jsx`

**Top section:**
- Season name + sport badge + date range
- Overall progress power bar (weighted completion of all 10 steps)
- Current step highlighted: "Next: Collect Payments — ~15 min to complete"

**Workflow tracker:**
- Horizontal journey bar across the top (like a stepped progress bar)
- Each step is numbered, labeled, and shows completion % or checkmark
- Completed steps: green fill
- Current step: sky blue, pulsing subtly
- Future steps: gray outline
- Clicking any step scrolls to / reveals that step's content below

**Main content area:**
- Shows the CURRENT step's interface by default
- Each step section uses the EXISTING pages/components but **auto-filtered to this season:**
  - Step 3 (Manage Registrations) → renders `RegistrationsTable` filtered to this season
  - Step 4 (Collect Payments) → renders `FamilyPaymentList` filtered to this season's families
  - Step 5 (Assign Teams) → renders team assignment UI filtered to this season
  - Step 8 (Create Schedule) → renders `ScheduleListView` filtered to this season's teams
  - etc.
- **"Want to handle X next?"** prompt at the bottom of each step section — suggests the next incomplete step

### Step 4.4: Build the page

Since this page is a new orchestrator that reuses existing components, it should:
- Accept `seasonId` from route params
- Fetch season data + compute step completion from existing Supabase queries
- Render the workflow tracker at top
- Render the active step's content below using existing components with season filter props
- Add navigation to this page from:
  - Season Journey List "Continue →" buttons (Phase 3)
  - Sidebar nav (under a "Seasons" category)

**If the file would exceed 500 lines**, split the workflow tracker into `src/pages/admin/SeasonWorkflowTracker.jsx` and each step section into its own component.

### Step 4.5: Verify
```bash
npx tsc --noEmit
```
Test:
- Navigate to season management from dashboard "Continue →"
- Workflow tracker shows correct completion per step
- Clicking a step shows that step's content
- Content is filtered to the correct season
- "Handle X next?" prompt works
- No console errors

**Commit:** `git add -A && git commit -m "phase 4: season management page — guided workflow, auto-filtered step content"`

---

## PHASE 5: Admin Setup Wizard Tracker + Action Items + Quick Actions

**Goal:** Three new sections for the admin dashboard.

### Step 5.1: Admin Setup Wizard Tracker

If an admin hasn't completed the initial org setup (creating first season, adding first team, etc.), a tracker bar sits immediately below the welcome banner header.

Create: `src/components/dashboard/AdminSetupTracker.jsx`

**Visual:**
- Full-width, not in a card — sits as a prominent banner below the welcome header
- Power bar showing overall completion: `h-3 rounded-full` — fill is `bg-lynx-sky`, track is `bg-slate-200`
- To the right of the power bar: "Next: {step name} · ~{time estimate}"
- Steps in the setup wizard:
  1. Create organization profile
  2. Set up first season
  3. Open registration
  4. Add first team
  5. Assign first coach
  6. Create first schedule event
- **Conditional rendering:** Once ALL steps are complete, this tracker disappears permanently (progressive disclosure). Check each step's completion against actual data.

### Step 5.2: Detailed Action Items Checklist

Create: `src/components/dashboard/AdminActionChecklist.jsx`

Sits below the hero + season journey section, full width.

**Visual:**
- Card with header: "ACTION ITEMS" + count badge
- Horizontal space allows more detail than the compact "Needs Attention" in the hero
- Each item is a row with:
  - Priority indicator (red dot = past due, amber dot = upcoming deadline, sky dot = pending)
  - Description: specific and detailed — "3 families overdue on Spring VB payments ($1,350 total)"
  - Deadline or age: "Due Mar 10" or "5 days overdue"
  - Action button: "Handle →" navigates to the relevant page/section
- Categories of items to include:
  - Pending registrations awaiting approval
  - Overdue payments (with amounts)
  - Unsigned waivers
  - Unrostered players
  - Teams without schedules
  - Players without jersey numbers
  - Incomplete evaluations
  - Expiring coach certifications
  - Any other incomplete tracker steps
- Sorted by urgency: past due first, then upcoming deadlines, then pending
- If empty: "All clear — the org is running smooth" (motivational, match mobile app tone)

### Step 5.3: Quick Actions with Counter Badges

Create or update: `src/components/dashboard/AdminQuickActions.jsx`

- Grid of action buttons, task-oriented
- Each button has:
  - Icon
  - Label
  - **Counter badge** (red circle with number) if there are pending items for that action
- Buttons:
  - "Approve Registrations" (badge: pending count)
  - "Record Payments" (badge: overdue count)
  - "Assign Players" (badge: unrostered count)
  - "Send Reminders" (badge: overdue families count)
  - "Create Schedule" (badge: teams without schedule count)
  - "View Reports"
- Clicking each button navigates to the appropriate page

### Step 5.4: Updated admin dashboard layout (top to bottom)

```
┌─────────────────────────────────────────────────────────────────────┐
│  WELCOME BANNER (from CC-DASHBOARD-POLISH)                          │
├─────────────────────────────────────────────────────────────────────┤
│  SETUP WIZARD TRACKER (conditional — only if setup incomplete)      │
│  [████████████░░░░░░░] Next: Open Registration · ~10 min           │
├────────────────────────────────────┬────────────────────────────────┤
│  ORG HEALTH HERO (dark, ~60%)      │  SEASON JOURNEY LIST (~40%)   │
│  - Health ring + score             │  - Vertical stack of seasons  │
│  - KPI pills                       │  - Compact with power bars    │
│  - Needs Attention (org-wide)      │  - "Continue →" per season    │
├────────────────────────────────────┴────────────────────────────────┤
│  ACTION ITEMS CHECKLIST (full width, detailed)                      │
│  - Past due items (red)                                              │
│  - Upcoming deadlines (amber)                                        │
│  - Pending items (sky)                                               │
│  - "Handle →" per item                                               │
├─────────────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS (grid with counter badges)                            │
├─────────────────────────────────────────────────────────────────────┤
│  (existing cards below: Teams Table, Financial Summary, etc.)        │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 5.5: Wire into admin dashboard layout

Update the admin dashboard layout file to render in this new order. Existing cards below quick actions stay in their current order — don't remove them.

### Step 5.6: Verify
```bash
npx tsc --noEmit
```
Test as Admin:
- Welcome banner shows
- Setup tracker shows if incomplete, hides if complete
- Hero has dark treatment with needs-attention
- Season journey list vertical on right
- Action items checklist with real data, sorted by urgency
- Quick actions with counter badges
- All existing cards still render below
- No console errors

**Commit:** `git add -A && git commit -m "phase 5: admin setup tracker, action items checklist, quick actions with badges"`

---

## PHASE 6: Parity Check

**Goal:** Final sweep of admin dashboard.

### Step 6.1: Check at 1440p
- All text readable (3 sizes up applied)
- Hero card is tall and prominent with dark treatment
- Season journey list is compact and scrollable on the right
- "Continue →" buttons navigate to Season Management Page
- Health score displays with transparent calculation
- Needs attention shows ALL org-wide blockers
- Action items are specific and detailed
- Quick action badges show correct counts
- Setup tracker conditional rendering works

### Step 6.2: TSC + build
```bash
npx tsc --noEmit
npm run build
```

### Step 6.3: Test all four roles still work (admin changes shouldn't break others)

**Commit:** `git add -A && git commit -m "phase 6: admin dashboard parity check — all verified at 1440p"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + read state | Backup current files |
| 1 | Font size bump (3 sizes) | All admin dashboard text larger |
| 2 | Org Health Hero — dark treatment | Game-day hero style, transparent health calc, expanded needs-attention |
| 3 | Season Journey — vertical list | Horizontal → vertical, compact, blocker labels, right of hero |
| 4 | Season Management Page (NEW) | Dedicated page per season, guided workflow, auto-filtered content |
| 5 | Setup tracker + action items + quick actions | Three new dashboard sections |
| 6 | Parity check | Final 1440p sweep |

**Total phases:** 7 (0–6)

---

## NOTES FOR CC

- **The Season Management Page is new.** It doesn't exist yet. Build it as a new route and page. It reuses existing components (RegistrationsTable, FamilyPaymentList, ScheduleListView, etc.) but filters them to one season.
- **Health score calculation must be transparent and data-driven.** Derive it from actual completion metrics, not hardcoded or random.
- **"Needs Attention" in the hero = summary.** "Action Items Checklist" below = detailed version with handle buttons. They pull from the same data but at different detail levels.
- **The setup wizard tracker is conditional.** If the admin has completed all initial setup steps, it doesn't render. Don't show a "Complete!" state — just remove it.
- **Season Journey "Continue →" must navigate to the Season Management Page** once Phase 4 is built. If navigating before Phase 4 completes, fall back to the existing settings/season route.
- **Counter badges on quick actions** are live counts derived from Supabase queries. They should update when the dashboard data refreshes.
- **This spec does NOT touch coach or parent dashboards.** Those are handled by CC-DASHBOARD-POLISH. This is admin-only.
