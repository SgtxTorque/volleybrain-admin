# CC-GLOBAL-FIXES — Centering, Resize Bug, Text, Parent Layout, Nav Audit

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-PARENT-PLAYER-DASHBOARDS (completed)

---

## CONTEXT

Carlos identified several issues across the app after recent specs:
1. Content is centered on screen — should be left-aligned, full-width
2. Resizing browser to small then back to large leaves layout squished
3. Text is too large again — clamp values are overshooting on 1440p
4. Parent dashboard doesn't match reference screenshots
5. Coach/admin need role-scoped filters (coaches can't see other teams)
6. Buttons and nav links may be wired to wrong pages
7. All these need fixing in one pass

---

## RULES

1. Read every file before modifying
2. Commit after each phase
3. TSC verify after each phase
4. Test all four roles after each phase

---

## PHASE 1: Remove Centering — Left-Aligned Full Width

### Step 1.1: Fix DashboardContainer

```bash
cat src/components/layout/DashboardContainer.jsx
```

Find `mx-auto` and remove it. The container should be left-aligned:

**Change:**
```jsx
// FROM:
<div className="w-full max-w-dashboard mx-auto px-r-4 py-r-4">

// TO:
<div className="w-full px-r-4 py-r-4">
```

Remove `max-w-dashboard` entirely. Content should fill the available space to the right of the sidebar, not be centered with margins.

### Step 1.2: Check all pages for leftover mx-auto

```bash
grep -rn "mx-auto" src/components/ src/pages/ --include="*.jsx" | grep -v node_modules | grep -v _archive
```

Remove `mx-auto` from any page-level or dashboard-level container. It's fine on small elements (like centering text inside a badge), but NOT on page wrappers.

### Step 1.3: Verify — content is left-aligned, fills space right of sidebar, no centering.

**Commit:** `git add -A && git commit -m "phase 1: remove centering — left-aligned full-width content"`

---

## PHASE 2: Fix Resize Breakpoint Bug

### Step 2.1: Read DashboardGrid

```bash
cat src/components/layout/DashboardGrid.jsx
```

### Step 2.2: Fix breakpoint layout contamination

The issue: when the window resizes from lg → sm, react-grid-layout creates a new layout for "sm" breakpoint. When resizing back to lg, it should restore the lg layout — but if `onLayoutChange` is overwriting the lg layout with sm positions, it stays squished.

**Fix:** Only update the layout for the CURRENT breakpoint, not all breakpoints:

```jsx
const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

// Track breakpoint changes
const handleBreakpointChange = useCallback((newBreakpoint) => {
  setCurrentBreakpoint(newBreakpoint);
}, []);

// Only update the specific breakpoint that changed
const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
  setLayouts(prev => ({
    ...prev,
    [currentBreakpoint]: currentLayout,
  }));
  if (editMode) {
    detectOverlaps(currentLayout);
  }
  if (onLayoutChange) {
    onLayoutChange(allLayouts);
  }
}, [currentBreakpoint, editMode, detectOverlaps, onLayoutChange]);
```

Add the breakpoint change handler to the grid:
```jsx
<ResponsiveGridLayout
  ...
  onBreakpointChange={handleBreakpointChange}
  onLayoutChange={handleLayoutChange}
  ...
>
```

### Step 2.3: Initialize all breakpoint layouts from defaults

When the grid mounts, pre-populate layouts for ALL breakpoints based on the default layout. For smaller breakpoints, auto-stack cards vertically:

```jsx
const [layouts, setLayouts] = useState(() => {
  const lg = widgets.map(w => ({
    i: w.id,
    x: w.defaultLayout.x,
    y: w.defaultLayout.y,
    w: w.defaultLayout.w,
    h: w.defaultLayout.h,
    minW: w.minW || 2,
    minH: w.minH || 2,
  }));

  // For medium: same layout but constrained to fewer columns
  const md = lg.map(item => ({
    ...item,
    w: Math.min(item.w, 24),
    x: Math.min(item.x, 24 - item.w),
  }));

  // For small: stack everything vertically
  const sm = lg.map((item, idx) => ({
    ...item,
    x: 0,
    w: 12,
    y: idx * item.h,
  }));

  return { lg, md, sm };
});
```

This way each breakpoint has its own layout that doesn't contaminate the others.

**Commit:** `git add -A && git commit -m "phase 2: fix resize bug — separate layouts per breakpoint, no contamination"`

---

## PHASE 3: Dial Back Text Sizes

### Step 3.1: Read current clamp values

```bash
grep -A2 "r-xs\|r-sm\|r-base\|r-lg\|r-xl\|r-2xl\|r-3xl\|r-4xl\|r-5xl" tailwind.config.js
```

### Step 3.2: Reduce the MAX values in clamp

The current clamp max values are too large on 1440p. Reduce by ~15-20%:

```js
fontSize: {
  'r-xs':   ['clamp(0.6875rem, 0.6rem + 0.2vw, 0.75rem)', { lineHeight: '1.4' }],     // 11px → 12px (was 13)
  'r-sm':   ['clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', { lineHeight: '1.4' }],      // 12px → 13px (was 15)
  'r-base': ['clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)', { lineHeight: '1.5' }],   // 13px → 15px (was 17)
  'r-lg':   ['clamp(0.9375rem, 0.85rem + 0.25vw, 1.0625rem)', { lineHeight: '1.4' }],  // 15px → 17px (was 20)
  'r-xl':   ['clamp(1.0625rem, 0.95rem + 0.3vw, 1.25rem)', { lineHeight: '1.3' }],     // 17px → 20px (was 24)
  'r-2xl':  ['clamp(1.25rem, 1.1rem + 0.4vw, 1.5rem)', { lineHeight: '1.2' }],         // 20px → 24px (was 30)
  'r-3xl':  ['clamp(1.5rem, 1.3rem + 0.5vw, 2rem)', { lineHeight: '1.1' }],            // 24px → 32px (was 40)
  'r-4xl':  ['clamp(2rem, 1.7rem + 0.7vw, 2.5rem)', { lineHeight: '1' }],              // 32px → 40px (was 52)
  'r-5xl':  ['clamp(2.5rem, 2.1rem + 1vw, 3.5rem)', { lineHeight: '1' }],              // 40px → 56px (was 72)
},
```

These tighter ranges mean text stays readable but never gets oversized on larger monitors.

### Step 3.3: Verify at 1440p — text should feel like a normal web app, not a billboard.

**Commit:** `git add -A && git commit -m "phase 3: dial back clamp max values — tighter text range for 1440p"`

---

## PHASE 4: Parent Dashboard — Match Reference Screenshots

### Step 4.1: Read current parent dashboard

```bash
cat src/pages/roles/ParentDashboard.jsx
wc -l src/pages/roles/ParentDashboard.jsx
```

### Step 4.2: Compare current state to reference

Carlos's reference screenshots (Images 10-11 from this batch, Images 2-3 from the original mockups) show:

**Top:** "Family Dashboard" header bar with notification bell + parent avatar
**Below:** Lynx mascot + "Welcome to the Den," + "Sarah Johnson" (large bold)
**Below:** "MY ATHLETES" — dark navy athlete cards with photo, name, team, position, jersey, level badge, XP bar, Add Athlete card
**Below:** "ACTION REQUIRED" — amber card, specific items with action buttons (Pay Now, RSVP)
**Below:** Two columns — "NEXT EVENT" (dark gradient, Practice, RSVP + Directions buttons) | "TEAM HUB" (shoutouts + recent activity)
**Below:** Three columns — "SEASON RECORD" (W/L) | "BALANCE DUE" ($209.99, Pay Now) | Team Hub/Chat
**Below:** "ENGAGEMENT PROGRESS" (Level badge, XP) | "Team Chat" (1 unread) | "QUICK LINKS"
**Below:** "ACHIEVEMENTS" — badges row

### Step 4.3: Fix what's wrong

Read the current dashboard and compare section by section to the reference. For each section that doesn't match:

**Athlete cards:** The current cards (Image 9) are gradient colored but don't have the dark navy treatment from the reference (Image 10). Fix:
- Background: `bg-gradient-to-br from-lynx-navy to-[#1a2d5a]`
- Player photo/avatar circle centered
- Name bold white, team below in muted
- Position + jersey
- Level badge pill
- XP bar at bottom

**Action Required:** Current version (Image 9) says "Payment Overdue" three times. Reference (Image 10) says "Payment overdue for Ava – $209.99". Fix: make descriptions specific with child name and amounts.

**Next Event card:** Reference shows dark gradient card with RSVP + Directions buttons. Verify this renders.

**Layout order:** Make sure the vertical order matches the reference. Use the widget grid default layout to enforce this.

**Set parent default layout to match reference:**
```js
const PARENT_DEFAULT_LAYOUT = [
  { i: "welcome-banner", x: 0, y: 0, w: 24, h: 6 },
  { i: "athlete-cards", x: 0, y: 6, w: 24, h: 8 },
  { i: "action-required", x: 0, y: 14, w: 24, h: 5 },
  { i: "next-event", x: 0, y: 19, w: 14, h: 9 },
  { i: "team-hub", x: 14, y: 19, w: 10, h: 9 },
  { i: "season-record", x: 0, y: 28, w: 8, h: 7 },
  { i: "balance-due", x: 8, y: 28, w: 8, h: 7 },
  { i: "team-wall-preview", x: 16, y: 28, w: 8, h: 7 },
  { i: "engagement-progress", x: 0, y: 35, w: 8, h: 5 },
  { i: "team-chat", x: 8, y: 35, w: 8, h: 5 },
  { i: "quick-links", x: 16, y: 35, w: 8, h: 7 },
  { i: "achievements", x: 0, y: 42, w: 24, h: 4 },
];
```

### Step 4.4: Verify parent matches reference screenshots.

**Commit:** `git add -A && git commit -m "phase 4: parent dashboard — match reference screenshots exactly"`

---

## PHASE 5: Role-Scoped Filters for Coach

### Step 5.1: Coach filter scoping

The coach dashboard must have team/season selectors like admin, BUT:
- **Only show teams the coach actually coaches** — not all org teams
- **Only show seasons the coach has teams in** — not all org seasons
- If the coach coaches only 1 team in 1 season: selectors don't render (progressive disclosure)

Read the coach dashboard to find where filters/selectors are:
```bash
grep -r "season.*selector\|team.*selector\|TeamSelector\|SeasonSelector" src/ --include="*.jsx" -l | head -10
```

If selectors exist, check the query:
- It should filter by `coach_id = currentUser.id` (or however coaches are linked to teams)
- NOT show all org teams

If selectors don't exist yet for coach, add them:
- Below the welcome banner, above the grid
- Same visual style as admin filters (dropdown pills)
- Query: teams WHERE coach_id = current user's profile ID
- Seasons: derived from the coach's teams' seasons

### Step 5.2: Admin filter verification

Admin filters should show ALL org data by default. Verify the header filter dropdowns work:
- Changing season filters all dashboard cards to that season
- Changing sport filters to that sport
- Changing team filters to that specific team
- "All" resets to org-wide

### Step 5.3: Data isolation

Verify that when viewing as Coach:
- Cannot see other coaches' teams
- Cannot see org-wide financial data (only their team's)
- Cannot see other teams' rosters
- Cannot see admin-only controls

**Commit:** `git add -A && git commit -m "phase 5: role-scoped filters — coach sees only their teams"`

---

## PHASE 6: Navigation & Button Audit

### Step 6.1: Audit all sidebar nav links

```bash
# Find all route definitions
grep -r "Route\|path:" src/ --include="*.jsx" --include="*.js" -l | head -10
cat [router file]

# Find all sidebar nav items and their targets
grep -r "navigate\|to=\|href=" src/components/layout/LynxSidebar.jsx | head -30
```

For EACH sidebar nav item, verify:
- The label matches the destination
- The route exists and renders the correct page
- The icon makes sense for the destination

### Step 6.2: Audit dashboard card buttons/links

Go through each dashboard and check every clickable element:

**Admin dashboard:**
- "Handle >" on action items → correct page?
- "Continue >" on season journey → correct season management page?
- Quick action buttons → correct pages?
- Needs Attention items → correct pages?
- "View Full Schedule" → schedule page?
- "View All" links → correct pages?

**Coach dashboard:**
- "START GAME DAY MODE" → game day page?
- "Full Roster >" → roster page?
- Quick action buttons (Send Blast, Build Lineup, Enter Stats, etc.) → correct pages?
- "View Full Schedule" → schedule page?
- "Create Challenge" → challenge page?

**Parent dashboard:**
- "Pay Now" → payment page?
- "RSVP" → schedule/event page?
- "Directions" → opens maps with venue address?
- "Open Chat" → chat page?
- "VIEW HUB" → team wall page?
- Quick Links (View Full Schedule, Payment History, Team Roster) → correct pages?

**Player dashboard:**
- "I'M READY" → RSVP action?
- "Team Chat" → chat page?
- Badge clicks → achievement detail?

### Step 6.3: Fix any misrouted links

For each broken link found, fix the navigation target. Read the router to find the correct route path for each destination.

### Step 6.4: Report

After the audit, log a summary:
```
=== NAV AUDIT RESULTS ===
[x] Sidebar: Schedule → /schedule ✓
[x] Sidebar: Reports → /reports ✓ (was going to /payments — FIXED)
[x] Admin: Handle action items → correct pages ✓
...
```

**Commit:** `git add -A && git commit -m "phase 6: navigation audit — all buttons and links verified and fixed"`

---

## PHASE 7: Parity Check

```bash
npx tsc --noEmit
npm run build
```

Test all four roles at 1440p:
- Content left-aligned, not centered
- Resize window small then back to large — layout restores correctly
- Text is readable but not oversized
- Admin: filters work, data updates
- Coach: only sees their teams, filters scoped
- Parent: matches reference screenshots
- Player: dark theme, all cards present
- All buttons navigate to correct pages
- No console errors

**Commit:** `git add -A && git commit -m "phase 7: global fixes parity check — all roles verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 1 | Remove centering | Left-aligned full-width, remove mx-auto |
| 2 | Resize bug | Separate layouts per breakpoint |
| 3 | Text sizes | Tighter clamp max values |
| 4 | Parent dashboard | Match reference screenshots |
| 5 | Role filters | Coach sees only their teams |
| 6 | Nav audit | All buttons/links verified |
| 7 | Parity check | All roles tested |

**Total phases:** 7 (1–7)

---

## NOTES FOR CC

- **`mx-auto` is the centering culprit.** Remove it from DashboardContainer and any page-level wrapper. Keep it only on small inner elements (badges, buttons) where centering is intentional.
- **The resize bug is a state management issue.** Each breakpoint (lg, md, sm) needs its own layout in state. `onLayoutChange` must only update the CURRENT breakpoint's layout.
- **Text clamp max values were too generous.** The new values cap text smaller so it doesn't feel oversized at 1440p. The min values stay the same for small screens.
- **Parent dashboard reference screenshots are the north star.** Read the images described in context. The key elements: dark athlete cards, specific action items with child names and amounts, dark gradient next event card, RSVP + Directions buttons.
- **Coach filter scoping is critical for security.** A coach must NEVER see another coach's team data. Query must filter by coach_id.
- **The nav audit is manual.** Click every link, verify destination, fix mismatches. Log results.
