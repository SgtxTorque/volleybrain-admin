# CC-RESPONSIVE-LAYOUT — Responsive Design System for All Dashboards

**Spec Author:** Claude Opus 4.6
**Date:** March 5, 2026
**Branch:** `feat/desktop-dashboard-redesign` (continue on existing branch)
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-ADMIN-DASHBOARD-REWORK (completed), CC-PAGES-REDESIGN (completed)

---

## CONTEXT

After multiple spec executions, the dashboards have all the right content and cards but the sizing is broken. On a 27" 1440p monitor, everything is too large — the hero card is massive, text is oversized, cards stretch edge-to-edge with no breathing room. The root cause: there's no responsive design system. Cards have no max-width/max-height constraints, text uses fixed Tailwind sizes that don't adapt to viewport, and grids stretch endlessly.

This spec builds the responsive foundation:
1. **Viewport-relative typography** — text scales smoothly between min and max sizes using CSS `clamp()`
2. **Card max constraints** — every card type has a max-height and cards within grids have proportional widths
3. **Responsive breakpoints** — layouts adapt at 768px (tablet), 1024px (laptop), 1440px (desktop), 1920px+ (ultrawide)
4. **Consistent spacing scale** — padding and gaps use a proportional system
5. **Season Management Page navigation fix** — "Continue →" passes the correct season ID

This spec touches ALL dashboards (Admin, Coach, Parent) and ALL redesigned pages. It is a CSS/layout-only spec — no new features, no new components, no data changes.

---

## RULES

1. **Read every file before modifying it**
2. **Archive before replace** — copy to `src/_archive/`
3. **Preserve all functionality** — this is layout/sizing only, no logic changes
4. **Commit after each phase**
5. **TSC verify** after each phase
6. **Test all four roles** after each phase
7. **Tailwind only** — extend the config, don't write raw CSS except in `index.css` for custom utilities

---

## PHASE 0: Archive + Audit Current Sizes

```bash
mkdir -p src/_archive/responsive-layout-$(date +%Y%m%d)

# Archive tailwind config and global CSS
cp tailwind.config.js src/_archive/responsive-layout-$(date +%Y%m%d)/
cp src/index.css src/_archive/responsive-layout-$(date +%Y%m%d)/ 2>/dev/null

# Archive all dashboard layout files
# Find the main orchestrator files for each dashboard
grep -r "OrgHealthHero\|AdminSetupTracker\|AdminActionChecklist" src/ --include="*.jsx" -l
grep -r "CoachGameDayHero\|CoachNotificationsCard\|CoachRosterCard" src/ --include="*.jsx" -l
grep -r "ParentDashboard\|ParentHero\|ChildCard" src/ --include="*.jsx" -l
# Archive each one found

# Audit current text sizes across the codebase
echo "=== TEXT SIZE AUDIT ==="
grep -roh "text-\[[0-9]*px\]\|text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl\|text-3xl\|text-4xl\|text-5xl\|text-6xl\|text-7xl" src/components/ src/pages/ --include="*.jsx" | sort | uniq -c | sort -rn

# Audit current max-width/max-height usage
echo "=== MAX CONSTRAINT AUDIT ==="
grep -roh "max-w-\S*\|max-h-\S*" src/components/ src/pages/ --include="*.jsx" | sort | uniq -c | sort -rn

# Audit current grid/flex patterns
echo "=== GRID AUDIT ==="
grep -roh "grid-cols-\S*\|grid-template\S*" src/components/ src/pages/ --include="*.jsx" | sort | uniq -c | sort -rn
```

**Commit:** `git add -A && git commit -m "phase 0: archive + audit current sizing for responsive layout spec"`

---

## PHASE 1: Tailwind Config — Responsive Typography Scale + Custom Utilities

**Goal:** Define a responsive typography system using CSS `clamp()` so text scales smoothly between screen sizes without manual breakpoint classes.

### Step 1.1: Read current tailwind.config.js

```bash
cat tailwind.config.js
```

### Step 1.2: Add responsive font size utilities

Extend `tailwind.config.js` → `theme.extend.fontSize` with clamp-based sizes:

```js
fontSize: {
  // Responsive scale: clamp(min, preferred, max)
  // min = readable on 1024px laptop
  // preferred = scales with viewport
  // max = caps out so it doesn't get huge on ultrawide

  'r-xs':     ['clamp(0.6875rem, 0.6rem + 0.25vw, 0.8125rem)', { lineHeight: '1.4' }],   // 11px → 13px
  'r-sm':     ['clamp(0.75rem, 0.65rem + 0.3vw, 0.9375rem)', { lineHeight: '1.4' }],      // 12px → 15px
  'r-base':   ['clamp(0.875rem, 0.75rem + 0.35vw, 1.0625rem)', { lineHeight: '1.5' }],    // 14px → 17px
  'r-lg':     ['clamp(1rem, 0.85rem + 0.4vw, 1.25rem)', { lineHeight: '1.4' }],            // 16px → 20px
  'r-xl':     ['clamp(1.125rem, 0.95rem + 0.5vw, 1.5rem)', { lineHeight: '1.3' }],         // 18px → 24px
  'r-2xl':    ['clamp(1.375rem, 1.1rem + 0.7vw, 1.875rem)', { lineHeight: '1.2' }],        // 22px → 30px
  'r-3xl':    ['clamp(1.75rem, 1.4rem + 0.9vw, 2.5rem)', { lineHeight: '1.1' }],           // 28px → 40px
  'r-4xl':    ['clamp(2.25rem, 1.8rem + 1.2vw, 3.25rem)', { lineHeight: '1' }],            // 36px → 52px
  'r-5xl':    ['clamp(3rem, 2.4rem + 1.5vw, 4.5rem)', { lineHeight: '1' }],                // 48px → 72px

  // Keep existing fixed sizes as fallbacks — don't remove them
},
```

**What this achieves:** On a 1024px laptop, `text-r-base` is 14px. On a 1440p monitor, it's about 16px. On a 1920px ultrawide, it caps at 17px. Everything scales smoothly — no jarring jumps at breakpoints.

### Step 1.3: Add responsive spacing utilities

Extend `theme.extend.spacing`:

```js
spacing: {
  'r-1': 'clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem)',    // 4px → 6px
  'r-2': 'clamp(0.5rem, 0.4rem + 0.25vw, 0.75rem)',       // 8px → 12px
  'r-3': 'clamp(0.75rem, 0.6rem + 0.35vw, 1rem)',          // 12px → 16px
  'r-4': 'clamp(1rem, 0.8rem + 0.5vw, 1.5rem)',            // 16px → 24px
  'r-6': 'clamp(1.5rem, 1.2rem + 0.75vw, 2.25rem)',        // 24px → 36px
  'r-8': 'clamp(2rem, 1.6rem + 1vw, 3rem)',                // 32px → 48px
},
```

### Step 1.4: Add max-width/max-height design tokens

Extend `theme.extend`:

```js
maxWidth: {
  'card-sm': '320px',
  'card-md': '480px',
  'card-lg': '640px',
  'card-xl': '800px',
  'dashboard': '1600px',    // Overall dashboard max-width to prevent ultrawide stretching
},
maxHeight: {
  'hero': '380px',          // Hero cards max height
  'hero-sm': '280px',       // Smaller hero variants
  'card': '500px',          // Standard card max
  'card-sm': '320px',       // Compact cards
  'card-tall': '700px',     // Tall cards like squad list
},
```

### Step 1.5: Verify config is valid
```bash
npx tailwindcss --help  # or just run the dev server to check config parses
npm run dev &
sleep 5
kill %1
npx tsc --noEmit
```

**Commit:** `git add -A && git commit -m "phase 1: responsive typography + spacing + constraint tokens in tailwind config"`

---

## PHASE 2: Dashboard Container + Grid System

**Goal:** Every dashboard gets a max-width container and a consistent grid system that prevents cards from stretching infinitely.

### Step 2.1: Create a shared dashboard layout wrapper

Create: `src/components/layout/DashboardContainer.jsx`

```jsx
/**
 * Wraps all dashboard content with consistent max-width,
 * padding, and responsive behavior.
 */
export default function DashboardContainer({ children, className = '' }) {
  return (
    <div className={`w-full max-w-dashboard mx-auto px-r-4 py-r-4 ${className}`}>
      {children}
    </div>
  );
}
```

**Key:** `max-w-dashboard` (1600px) prevents content from stretching across a 2560px ultrawide. On a 1440p monitor (2560px wide), the content is centered with comfortable margins. On a 1024px laptop, `max-w-dashboard` has no effect since the viewport is already smaller.

`px-r-4` uses the responsive spacing so padding scales with viewport.

### Step 2.2: Define standard grid patterns

Create: `src/components/layout/DashboardGrid.jsx`

```jsx
/**
 * Standard grid layouts used across dashboards.
 * Handles responsive breakpoints automatically.
 */

// Hero + sidebar (60/40 split, stacks on small screens)
export function HeroGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-r-4 ${className}`}>
      {children}
    </div>
  );
}

// Two equal columns (stacks on small screens)
export function TwoColGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-r-4 ${className}`}>
      {children}
    </div>
  );
}

// Three columns (stacks to 2+1 on medium, full stack on small)
export function ThreeColGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-r-4 ${className}`}>
      {children}
    </div>
  );
}

// Four stat cards (2x2 on medium, 4 across on large)
export function StatGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-r-3 ${className}`}>
      {children}
    </div>
  );
}

// KPI row (scrolls horizontally on small screens)
export function KPIGrid({ children, className = '' }) {
  return (
    <div className={`flex gap-r-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible ${className}`}>
      {children}
    </div>
  );
}
```

### Step 2.3: Apply DashboardContainer to all three dashboards

Find the admin, coach, and parent dashboard layout files. Wrap each dashboard's content in `<DashboardContainer>`.

**Admin dashboard:**
```bash
# Find the file
grep -r "OrgHealthHero\|AdminSetupTracker" src/ --include="*.jsx" -l
# Read it, then wrap content in DashboardContainer
```

**Coach dashboard:**
```bash
grep -r "CoachGameDayHero" src/ --include="*.jsx" -l
# Read it, wrap in DashboardContainer
```

**Parent dashboard:**
```bash
cat src/pages/roles/ParentDashboard.jsx
# Wrap in DashboardContainer
```

### Step 2.4: Apply grid components to dashboard layouts

Replace inline grid classes with the shared grid components:

**Admin dashboard top section:**
- Replace whatever grid wraps hero + season list with `<HeroGrid>`
- Replace stat card grids with `<StatGrid>` or `<KPIGrid>`

**Coach dashboard top section:**
- Hero + notifications/squad: use `<HeroGrid>`
- Calendar strip + action items: use `<TwoColGrid>`

**Parent dashboard:**
- Child cards: horizontal scroll (keep as-is, but constrain individual card widths)
- Action items + events: use `<TwoColGrid>`

### Step 2.5: Verify
```bash
npx tsc --noEmit
```
Check: dashboards have breathing room on 1440p, content doesn't stretch to edges on ultrawide, stacks gracefully on narrow.

**Commit:** `git add -A && git commit -m "phase 2: dashboard container + responsive grid system applied to all dashboards"`

---

## PHASE 3: Card Constraints — Max Heights + Proportional Sizing

**Goal:** Every card type gets max-height and max-width constraints so nothing grows out of control.

### Step 3.1: Hero cards (Admin + Coach)

**Admin Org Health Hero:**
- Add: `max-h-hero` (380px max height)
- If the current height is bigger than 380px, it means there's too much padding or the content is too spread out. Tighten internal padding: `p-r-6` instead of fixed large padding.
- The health ring should be `w-40 h-40` max (not growing with viewport)
- KPI pills row: keep compact, `text-r-sm`

**Coach Game Day Hero:**
- Add: `max-h-hero` (380px)
- Internal layout: flex row, left side 60%, right side 40%
- If game image is present: background-image with gradient overlay, `object-cover`
- Journey tracker inside: compact, `text-r-xs` labels, `w-7 h-7` step circles

### Step 3.2: Season Journey List (admin right column)

Each season card in the vertical list:
- `max-h-[80px]` per card — keep them compact
- Season name: `text-r-base font-bold`
- Percentage: `text-r-xl font-extrabold`
- Progress bar: `h-2` (thin)
- Blocker text: `text-r-xs`
- The list container: `max-h-card-tall` (700px) with `overflow-y-auto` if needed

### Step 3.3: Stat cards

All stat cards across all dashboards:
- Fixed internal sizing (don't let them stretch vertically):
  - `min-h-[100px] max-h-[140px]`
  - Big number: `text-r-3xl font-extrabold`
  - Label: `text-r-xs font-bold uppercase tracking-wider`
  - Sub-text: `text-r-sm`
  - Pill badges: `text-r-xs`

### Step 3.4: Notifications card (coach)

- `max-h-card-sm` (320px) — internal scroll if more than 5 items
- Each notification row: `text-r-sm`, compact padding `py-2 px-4`

### Step 3.5: Squad/Roster card (coach)

- `max-h-card-tall` (700px) — internal scroll for overflow
- Player rows: `h-14` fixed height per row (enough for portrait photo + name + stats)
- Photos: `w-10 h-10 rounded-xl` — not growing with viewport

### Step 3.6: Action Items cards (admin + coach)

- Each item row: `py-3` padding, `text-r-base` for description, `text-r-sm` for sub-text
- Card: no max-height (it should show all items), but individual rows are compact

### Step 3.7: Quick Actions grid

- Buttons: `min-h-[80px] max-h-[100px]` each
- Icon: fixed `w-8 h-8`
- Label: `text-r-sm font-bold`
- Counter badge: `w-5 h-5 text-r-xs`

### Step 3.8: Teams table, Payments table, Registrations table

- Table header cells: `text-r-xs font-bold uppercase`
- Table body cells: `text-r-sm`
- Row height: `py-3` (not growing unbounded)
- Jersey numbers in roster: `text-r-2xl font-extrabold` (big but capped)

### Step 3.9: Apply all constraints

Go through every component modified in previous specs and apply the appropriate constraints. This is the bulk of the work — methodically go file by file.

### Step 3.10: Verify
```bash
npx tsc --noEmit
```
Check at 1440p: hero cards are ~350-380px tall (not 600+), stat cards are compact, tables are readable, nothing is giant.

**Commit:** `git add -A && git commit -m "phase 3: card constraints — max heights, proportional sizing, compact internals"`

---

## PHASE 4: Typography Migration — Replace Fixed Sizes with Responsive

**Goal:** Replace all fixed text sizes (`text-[11px]`, `text-xs`, `text-3xl`, etc.) in dashboard and page components with the responsive `text-r-*` equivalents.

### Step 4.1: Migration mapping

| Fixed Class | Responsive Replacement | Used For |
|-------------|----------------------|----------|
| `text-[10px]`, `text-[11px]` | `text-r-xs` | Micro labels, uppercase section headers |
| `text-xs` | `text-r-xs` | Small labels, meta text |
| `text-sm` | `text-r-sm` | Sub-text, secondary info |
| `text-base` | `text-r-base` | Body text, table cells, card content |
| `text-lg` | `text-r-lg` | Card titles, prominent labels |
| `text-xl` | `text-r-xl` | Section headers |
| `text-2xl` | `text-r-2xl` | Page sub-headers, medium numbers |
| `text-3xl`, `text-[32px]` | `text-r-3xl` | Stat card numbers, page titles |
| `text-4xl`, `text-5xl` | `text-r-4xl` | Big hero numbers |
| `text-6xl`, `text-7xl`, `text-[56px]` | `text-r-5xl` | Hero record numbers (W-L display) |

### Step 4.2: Apply across all dashboard components

Systematically replace in these files:

**Admin dashboard components:**
```bash
ls src/components/dashboard/
# Replace in each: OrgHealthHero, SeasonJourneyList, KPIRow, AdminSetupTracker,
# AdminActionChecklist, AdminQuickActions, ActionItemsCard, ComplianceCards,
# FinancialSummaryCard, TeamsTable, UpcomingEventsCard, TeamWallPreviewCard
```

**Coach dashboard components:**
```bash
ls src/components/coach/
# Replace in each: CoachGameDayHeroV2, CoachNotificationsCard, CoachRosterCard,
# GameDayJourneyCard, CoachStatsCard, CoachToolsCard, CoachActionsCard,
# CoachScheduleCard, ChallengesCard, TopPlayersCard, TeamReadinessCard,
# CoachWallPreviewCard, plus any new cards from DASHBOARD-POLISH
```

**Parent dashboard:**
```bash
cat src/pages/roles/ParentDashboard.jsx
# Replace all fixed text sizes
```

**Shared components:**
```bash
ls src/components/shared/
# WelcomeBanner, any other shared components
```

**Page components (stat rows, filter bars, tables):**
```bash
# TeamsStatRow, TeamsTableView, PaymentsStatRow, FamilyPaymentList,
# RegistrationsStatRow, RegistrationsTable, RosterStatRow, RosterTable,
# ScheduleStatRow, ScheduleListView, GameDayHero, LineupPanel, ScorePanel,
# AttendancePanel
```

### Step 4.3: Also replace fixed padding/gap with responsive spacing

Where appropriate (dashboard-level padding, grid gaps, card internal padding):
- `px-6` → `px-r-4`
- `py-6` → `py-r-4`
- `gap-4` → `gap-r-3`
- `p-7` or `p-8` → `p-r-6`
- `mb-5` → `mb-r-4`

**Do NOT replace all spacing** — small internal padding (like `px-2 py-1` on pills/badges) should stay fixed. Only replace dashboard-level and card-level spacing.

### Step 4.4: Verify
```bash
npx tsc --noEmit
```
Check: text scales smoothly when resizing browser window. At 1024px it's readable. At 1440px it's comfortable. At 1920px it doesn't get absurdly large.

**Commit:** `git add -A && git commit -m "phase 4: migrate all dashboard text to responsive r-* scale, responsive spacing on cards"`

---

## PHASE 5: Season Management Navigation Fix

**Goal:** "Continue →" on season journey cards should navigate to the Season Management Page with the correct season pre-selected.

### Step 5.1: Read the SeasonJourneyList component

```bash
cat src/components/dashboard/SeasonJourneyList.jsx
```

Find where the "Continue →" button's onClick handler navigates. It's likely going to `/admin/seasons` or `/admin/settings` without passing a season ID.

### Step 5.2: Read the SeasonManagementPage

```bash
cat src/pages/admin/SeasonManagementPage.jsx
```

Find how it reads the season ID — it should be from route params (`:seasonId`) or query string.

### Step 5.3: Fix the navigation

In `SeasonJourneyList.jsx`, each season card's "Continue →" button should navigate to:
```
/admin/seasons/{seasonId}
```
where `seasonId` is the actual Supabase ID of that season record.

If the route isn't set up yet, add it:
```bash
# Find the router config
grep -r "Route\|createBrowserRouter\|BrowserRouter" src/ --include="*.jsx" -l | head -5
cat [router file]
```

Add the route: `/admin/seasons/:seasonId` → `SeasonManagementPage`

In `SeasonManagementPage.jsx`:
- Read `seasonId` from route params: `const { seasonId } = useParams()`
- On mount, fetch that season's data and pre-populate the page
- The season/sport dropdown should default to the season matching `seasonId`, not always Spring 2026

### Step 5.4: Verify

Test: Click "Continue →" on each season card. Each should navigate to the Season Management Page with that specific season loaded (not Spring 2026 every time).

**Commit:** `git add -A && git commit -m "phase 5: season journey Continue button passes correct seasonId to management page"`

---

## PHASE 6: Page-Level Responsive Treatment

**Goal:** Apply the responsive system to all inner pages (Teams, Payments, Registrations, Roster, Schedule, Game Day).

### Step 6.1: Wrap all pages in DashboardContainer

Every page in `src/pages/` that was redesigned should use `<DashboardContainer>` as its outermost wrapper. This gives it the same max-width and responsive padding as the dashboards.

```bash
# Find all page files
ls src/pages/teams/
ls src/pages/payments/
ls src/pages/registrations/
ls src/pages/roster/
ls src/pages/schedule/
ls src/pages/gameprep/
ls src/pages/parent/
```

For each page: if it has `<div className="w-full px-6 py-6">` as its outer wrapper, replace with `<DashboardContainer>`.

### Step 6.2: Stat rows → use StatGrid

All stat rows on inner pages should use `<StatGrid>` instead of inline `grid grid-cols-4` classes. This ensures they stack to 2x2 on tablets.

### Step 6.3: Filter bars and tables

- Filter bar text: `text-r-sm`
- Search input: `text-r-base`
- Filter chips: `text-r-xs font-semibold`
- Table headers: `text-r-xs font-bold uppercase tracking-wider`
- Table cells: `text-r-sm`

### Step 6.4: Verify all pages
```bash
npx tsc --noEmit
```
Navigate to each page as each role. Check text scales, cards are constrained, nothing is enormous.

**Commit:** `git add -A && git commit -m "phase 6: responsive treatment applied to all inner pages"`

---

## PHASE 7: Sidebar Responsive Polish

**Goal:** Sidebar text and spacing should also use the responsive scale.

### Step 7.1: Read sidebar

```bash
cat src/components/layout/LynxSidebar.jsx
```

### Step 7.2: Apply responsive text

- Nav item labels: `text-r-sm font-semibold`
- Category titles: `text-r-xs font-bold uppercase tracking-wider`
- Profile name: `text-r-base font-bold`
- Role pills: `text-r-xs font-bold`
- "Lynx" brand: `text-r-lg font-extrabold`

### Step 7.3: Sidebar width

The sidebar itself should have responsive width:
- Collapsed: `w-16` (64px) — fixed, doesn't need to scale
- Expanded: `w-56` (224px) at base, could go to `w-60` (240px) on larger screens
- Use: `lg:w-56 xl:w-60` for expanded state

### Step 7.4: Verify sidebar renders correctly at multiple widths.

**Commit:** `git add -A && git commit -m "phase 7: sidebar responsive text + width scaling"`

---

## PHASE 8: Final Parity Check

**Goal:** Test everything at three viewport widths. Fix any remaining issues.

### Step 8.1: Test at 1024px (small laptop)

For each role:
- Dashboard loads, content stacks where appropriate
- Grids go from multi-column to fewer columns
- Text is readable (not too small)
- No horizontal overflow / scroll
- Sidebar collapses to icon-only

### Step 8.2: Test at 1440px (Carlos's monitor)

For each role:
- Dashboard looks "designed" — cards have breathing room, nothing is giant
- Hero cards are ~350-380px tall max
- Stat cards are compact (~100-130px tall)
- Text is comfortable — not squinting, not shouting
- Season journey list is compact on the right
- Tables are scannable

### Step 8.3: Test at 1920px (ultrawide)

For each role:
- Content is centered within 1600px max-width container
- Cards don't stretch beyond their max constraints
- Text doesn't get oversized (capped by clamp max values)
- Comfortable margins on each side

### Step 8.4: Test Season Management navigation

Click "Continue →" on every season card. Each should load the correct season.

### Step 8.5: TSC + build
```bash
npx tsc --noEmit
npm run build
```

### Step 8.6: Final commit
```bash
git add -A && git commit -m "phase 8: responsive parity check — tested at 1024/1440/1920px, all roles verified"
```

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + audit | Snapshot current state, measure existing sizes |
| 1 | Tailwind config | Responsive font scale (clamp), spacing tokens, constraint tokens |
| 2 | Dashboard containers + grids | max-w-dashboard wrapper, shared grid components, applied to all dashboards |
| 3 | Card constraints | max-h on heroes/stat cards/notification/squad, compact internals |
| 4 | Typography migration | All fixed text-* → responsive text-r-*, responsive spacing |
| 5 | Season navigation fix | "Continue →" passes seasonId, page reads from route params |
| 6 | Inner pages | DashboardContainer + StatGrid on all redesigned pages |
| 7 | Sidebar | Responsive text + width scaling |
| 8 | Parity check | Test at 1024/1440/1920, all roles |

**Total phases:** 9 (0–8)

---

## NOTES FOR CC

- **This is a CSS/layout-only spec.** Do not change component logic, data fetching, or functionality. Only change sizing, spacing, typography classes, and layout structure.
- **The `text-r-*` classes use CSS `clamp()`.** They are defined in tailwind.config.js and work like any other Tailwind text size class. They don't require any JavaScript.
- **`max-w-dashboard` (1600px) is the content ceiling.** This means on a 2560px ultrawide, there will be ~480px of empty space on each side. This is intentional — it prevents content from stretching absurdly wide.
- **Don't remove any existing breakpoint classes** (like `lg:grid-cols-2`). The responsive grid components ADD breakpoints; they don't replace any that are already there for good reason.
- **The hero card `max-h-hero` (380px) is a hard ceiling.** If the content doesn't fit at 380px, tighten padding and text sizes inside the hero — don't increase the max-h.
- **Test by resizing the browser window**, not just at one resolution. Drag the window from 1024px to 1920px and watch elements scale smoothly.
- **The Season Management Page navigation fix (Phase 5) is a logic change** — it's the one exception to the "layout only" rule in this spec. It's included here because it's a small fix that Carlos reported alongside the layout issues.
