# CC-V2-QA-ROUND1.md
## Lynx Web Admin — V2 QA Round 1 Fixes
### Admin Dashboard Feedback from Carlos

**Branch:** `main`
**Rule:** Fix what is listed. Each section is a numbered fix. Build-verify-commit after each. Do not refactor unrelated code. Do not touch hooks, contexts, Supabase queries, or service layers.

---

## SCOPE BOUNDARIES

### DO touch:
- `src/pages/dashboard/DashboardPage.jsx`
- `src/components/v2/admin/` files (SeasonCarousel, SeasonStepper, AdminTeamsTab, AdminRegistrationsTab, AdminPaymentsTab, AdminScheduleTab)
- `src/components/v2/HeroCard.jsx` (mascot image swap only)
- `src/components/v2/MascotNudge.jsx` (mascot image swap only)
- `src/components/v2/AttentionStrip.jsx` (expandable behavior)
- `src/components/v2/MilestoneCard.jsx` (click handler)
- `src/components/v2/OrgHealthCard.jsx` (data scope label)
- `src/components/v2/FinancialSnapshot.jsx` (data scope label)
- `src/components/v2/TopBar.jsx` (font weight check)
- `src/components/layout/LynxSidebar.jsx` (role switcher, expand behavior)
- `src/styles/v2-tokens.css` (font verification)

### DO NOT touch:
- Any file in `src/hooks/` or `src/contexts/`
- Any Supabase query inside `loadDashboardData()` — the queries stay as-is. We only change HOW we pass data to components.
- CoachDashboard.jsx, ParentDashboard.jsx, PlayerDashboard.jsx, TeamManagerDashboard.jsx (separate QA pass)
- Any modal component
- Any service layer or lib file
- `src/lib/routes.js`

---

## Fix 1: Role Switcher (HIGH)

**Problem:** There is no way to switch roles anywhere in the UI. Users with multiple roles (admin + coach + parent) have no mechanism to switch between them.

**Files:** `src/components/layout/LynxSidebar.jsx`

**Context:** The old sidebar had role pills visible on hover-expand. The v2 slim sidebar removed the expand behavior, and the role pills went with it. They need to come back in a way that works with the 60px sidebar.

**Fix:** Add a role switcher to the TOP of the sidebar, just below the logo. It should be a compact element that works within 60px width.

**Implementation:**

1. Find where the sidebar receives `availableRoles` or `activeView` and `setActiveView` (or equivalent). These props come from MainApp.jsx. Check how the old sidebar rendered role pills and use the same data source.

2. Below the sidebar logo ("L" block), add a role indicator that doubles as a switcher:
   - Show the current role as a small colored circle/icon (e.g., a shield for admin, whistle for coach, heart for parent, star for player, clipboard for team manager)
   - On CLICK, show a small dropdown/popover that lists all available roles
   - The popover should appear to the RIGHT of the sidebar (position: absolute, left: 60px)
   - Each role option shows: role icon + role name + team name (if applicable for coach/TM)
   - Clicking a role calls the existing `setActiveView(role)` function

3. Style the popover:
   - White background, 14px radius, card shadow, border-subtle
   - Width: 200px, positioned to the right of the clicked element
   - Each option: padding 10px 14px, hover: surface background
   - Active role: navy background, white text
   - Close on click outside or on selection

4. If only one role exists, hide the switcher entirely (no dropdown needed).

**Alternatively (simpler approach):** If a popover is too complex for the sidebar, add the role switcher to the TopBar instead. Place it between the brand label ("Lynx Admin") and the nav links. Show the current role as a clickable label that opens a dropdown. This may be simpler since TopBar has more horizontal space.

**Pick whichever approach is cleaner. The requirement is: users with multiple roles MUST be able to switch.**

**Commit:** `feat(v2): role switcher in sidebar`

---

## Fix 2: Sidebar Expand on Hover (MEDIUM)

**Problem:** The slim sidebar icons have no labels visible. Users have to guess what each icon does. The `title` attribute provides a native tooltip on hover, but it's slow and ugly.

**Files:** `src/components/layout/LynxSidebar.jsx`, possibly `src/styles/v2-tokens.css`

**Fix:** Restore a SUBTLE hover-expand behavior. Not the old full 228px expand, but a lightweight label reveal.

**Implementation — Option A (CSS-only tooltip):**

Add a CSS-only tooltip that appears to the right of each icon on hover:

```css
.v2-sidebar-btn {
  position: relative;
}
.v2-sidebar-btn::after {
  content: attr(data-label);
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--v2-navy);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 300;
}
.v2-sidebar-btn:hover::after {
  opacity: 1;
}
```

Add `data-label={item.label}` to each sidebar button element. This gives instant-show labels on hover without expanding the sidebar width.

**Implementation — Option B (hover expand to ~180px):**

Restore a hover-expand, but more compact than before:
- Default: 60px (icons only)
- On sidebar hover: expand to 180px, show text labels next to each icon
- Transition: 0.2s ease
- The main content area should NOT shift (use position: fixed + z-index overlay, not document flow push)
- Only show icon + label, no role pills, no theme toggle, no accent picker (those are now in TopBar/role switcher)

**Carlos prefers being able to SEE the labels, so Option B is recommended.** But implement it as an OVERLAY that doesn't push content. The sidebar stays fixed at 60px in the layout, but visually expands over the content on hover.

**Commit:** `feat(v2): sidebar hover-expand with labels`

---

## Fix 3: Font Weight / Typography Check (MEDIUM)

**Problem:** The font weights in the TopBar and Financial Snapshot cards look "funny" — possibly not rendering with Inter Variable as intended.

**Files:** `src/styles/v2-tokens.css`, `src/components/v2/TopBar.jsx`, `src/components/v2/FinancialSnapshot.jsx`

**Fix:**

1. Check `v2-tokens.css` — verify `--v2-font` references Inter Variable correctly:
   ```css
   --v2-font: 'Inter Variable', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
   ```

2. Check that `Inter-Variable.ttf` (or `.woff2`) is in `public/fonts/` and that there's an `@font-face` declaration loading it. The web admin migrated from Tele-Grotesk to Inter Variable in the Feb reskin. Verify the `@font-face` still exists and hasn't been overridden.

3. Check TopBar.jsx — verify it uses `font-family: var(--v2-font)` and not a hardcoded font stack.

4. Check FinancialSnapshot.jsx — same check. The big numbers ($1,875.01 / $4,155.15) should be Inter Variable at weight 800. If they look thin, the font file may not be loading or the weight may be wrong.

5. Open the browser DevTools on the live site, inspect the TopBar brand label, and check "Computed" > "font-family" to see what's actually rendering. If it falls back to Plus Jakarta Sans or system fonts, the Inter Variable file isn't loading.

**Report what you find before making changes.** If the font file is missing or the @font-face is broken, fix it. If the font is loading correctly and it's just a weight issue, adjust the weights.

**Commit:** `fix(v2): verify and fix Inter Variable font loading`

---

## Fix 4: Replace Cat Emoji with Mascot Images (MEDIUM)

**Problem:** The HeroCard and MascotNudge show a 🐱 cat emoji. The repo has actual Lynx mascot image files that should be used instead.

**Files:** `src/components/v2/HeroCard.jsx`, `src/components/v2/MascotNudge.jsx`, `src/pages/dashboard/DashboardPage.jsx`

**Fix:**

1. Find the mascot image files in the repo. Check `public/images/` for files like `lynx-mascot.png`, `laptoplynx.png`, `mascot.png`, or similar. List what's available.

2. In HeroCard.jsx, the mascot spot currently renders an emoji in a rounded square. Replace with an `<img>` tag:
   ```jsx
   <img
     src="/images/[mascot-filename].png"
     alt="Lynx mascot"
     style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover' }}
   />
   ```
   Keep the container styling (background, border) but let the image fill it.

3. In MascotNudge.jsx, same approach for the 48x48 avatar:
   ```jsx
   <img
     src="/images/[mascot-filename].png"
     alt="Lynx"
     style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover' }}
   />
   ```

4. If multiple mascot images exist, use the most appropriate one for each context (e.g., a waving/greeting mascot for the hero, a thinking/talking mascot for the nudge).

5. Update the prop interface if needed. The HeroCard currently accepts `mascotEmoji` as a string prop. Either change it to `mascotImage` (URL string) or make it accept both (if string starts with '/' or 'http', render as image; otherwise render as emoji).

**Commit:** `feat(v2): replace emoji with mascot images`

---

## Fix 5: Attention Strip Expandable with Categories (HIGH)

**Problem:** The attention strip says "43 items need action" but clicking "REVIEW NOW" just navigates to payments. It should be expandable to show a categorized breakdown of what needs attention, with each category linking to the right page.

**Files:** `src/components/v2/AttentionStrip.jsx`, `src/pages/dashboard/DashboardPage.jsx`

**Fix:**

### Step 1: Enhance AttentionStrip component

The AttentionStrip already has `isExpanded`, `expandedContent`, and `onClick` props (from Phase 1 spec). Wire them.

When clicked, instead of navigating, toggle expanded state. Show categorized items:

```jsx
// In DashboardPage.jsx, add state:
const [attentionExpanded, setAttentionExpanded] = useState(false);

// Build categorized items from existing stats:
const attentionItems = [];
if (overdueCount > 0) {
  attentionItems.push({
    category: 'Overdue Payments',
    count: overdueCount,
    icon: '💰',
    onClick: () => onNavigate?.('payments'),
  });
}
if ((stats.pending || 0) > 0) {
  attentionItems.push({
    category: 'Pending Registrations',
    count: stats.pending,
    icon: '📋',
    onClick: () => onNavigate?.('registrations'),
  });
}
if ((stats.unsignedWaivers || 0) > 0) {
  attentionItems.push({
    category: 'Unsigned Waivers',
    count: stats.unsignedWaivers,
    icon: '📝',
    onClick: () => onNavigate?.('waivers'),
  });
}
if ((stats.teamsNeedCoach || 0) > 0) {
  attentionItems.push({
    category: 'Teams Need a Coach',
    count: stats.teamsNeedCoach,
    icon: '🏟️',
    onClick: () => onNavigate?.('coaches'),
  });
}
if ((stats.teamsNoSchedule || 0) > 0) {
  attentionItems.push({
    category: 'Teams Without Schedule',
    count: stats.teamsNoSchedule,
    icon: '📅',
    onClick: () => onNavigate?.('schedule'),
  });
}
```

### Step 2: Update AttentionStrip render

```jsx
<AttentionStrip
  message={`${actionCount} items need action`}
  ctaLabel={attentionExpanded ? "COLLAPSE" : "REVIEW NOW →"}
  onClick={() => setAttentionExpanded(!attentionExpanded)}
  isExpanded={attentionExpanded}
  expandedContent={
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
      {attentionItems.map((item, i) => (
        <div key={i}
          onClick={(e) => { e.stopPropagation(); item.onClick(); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(255,255,255,0.6)', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <span>{item.icon}</span> {item.category}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-red)' }}>{item.count}</span>
        </div>
      ))}
    </div>
  }
/>
```

### Step 3: Verify AttentionStrip.jsx supports expandable rendering

Check that AttentionStrip.jsx renders `expandedContent` when `isExpanded` is true. If the Phase 1 implementation didn't wire this, add it:

```jsx
// Inside AttentionStrip's return, after the main row:
{isExpanded && expandedContent && (
  <div style={{ borderTop: '1px solid rgba(239,68,68,0.1)', marginTop: 8 }}>
    {expandedContent}
  </div>
)}
```

**NOTE:** The stat field names (stats.unsignedWaivers, stats.teamsNeedCoach, stats.teamsNoSchedule) may not match the actual field names in `loadDashboardData()`. CC MUST check what fields exist in the `stats` object and use the correct names. If a field doesn't exist, omit that category from the attention items. Do NOT invent new Supabase queries to get this data.

**Commit:** `feat(v2): expandable attention strip with categorized items`

---

## Fix 6: Hero Card Data Scope — Org-Wide Stats (HIGH)

**Problem:** The hero card stats (4 Teams, 17 Players, 5 Coaches, etc.) show data for the SELECTED SEASON only. Carlos wants the hero card to show ORG-WIDE stats across all active seasons.

**Files:** `src/pages/dashboard/DashboardPage.jsx`

**Fix:**

The `loadDashboardData()` function currently scopes all queries to `selectedSeason.id`. The hero card should show aggregate org numbers instead.

**Approach:** We do NOT modify `loadDashboardData()`. Instead, we derive org-wide stats from the data we already have:

1. `perSeasonTeamCounts` and `perSeasonPlayerCounts` already contain counts per season (fetched in a separate useEffect). Sum these for org totals.

2. Find where HeroCard receives its stats props. Change the values:

```jsx
// Org-wide stats (derived from existing data)
const orgTotalTeams = Object.values(perSeasonTeamCounts || {}).reduce((sum, count) => sum + count, 0);
const orgTotalPlayers = Object.values(perSeasonPlayerCounts || {}).reduce((sum, count) => sum + count, 0);
```

3. For coaches, overdue, collected, and pending — these are currently season-scoped in `stats`. If org-wide versions aren't available from existing state, keep the season-scoped values but add a label to the hero card indicating which season is shown. OR change the hero to show:
   - Org-wide: Total Teams (all seasons), Total Players (all seasons), Total Seasons
   - Season-specific: keep in the body tabs and sidebar cards

4. Update the hero greeting to reflect org scope:
   ```
   orgLine = "Black Hornets Athletics"  (not season name)
   greeting = contextual based on total action items
   subLine = "X active seasons · [date]"
   ```

**IMPORTANT:** If summing across seasons gives inaccurate totals (e.g., a player registered in 2 seasons counts twice), that's acceptable for now. The point is giving the admin an org-level pulse, not an audited number.

**Commit:** `feat(v2): hero card shows org-wide stats`

---

## Fix 7: Financial Snapshot Data Scope — Org-Wide (HIGH)

**Problem:** Same as Fix 6 but for the Financial Snapshot card. It shows "Spring 2026 · Revenue Overview" but should show org-wide financials or at minimum make it clear this is season-scoped.

**Files:** `src/pages/dashboard/DashboardPage.jsx`

**Fix:**

**Option A (preferred — org-wide):** If the `loadDashboardData()` function or other existing state has org-wide financial totals, use those. Check if `stats.totalCollected` and `stats.pastDue` are already org-scoped or season-scoped.

**Option B (label fix):** If org-wide data isn't available without new queries, keep the season-scoped data but update the labels:
```jsx
overline="Financial Snapshot"
heading={selectedSeason?.name || 'All Seasons'}
headingSub="Season Revenue"  // Make it clear this is season-scoped
```

And add a note or toggle that says "Viewing: [Season Name]" so the admin knows the scope.

**Do NOT write new Supabase queries.** Use existing data only.

**Commit:** `feat(v2): financial snapshot scope clarity`

---

## Fix 8: Season Carousel Improvements (HIGH)

**Problem:** Multiple issues with the season carousel:
- No horizontal scroll arrows to see more seasons
- Cards don't show enough info
- Clicking a card causes near-full-page refresh (performance)
- "View All" shows only one season on the management page

**Files:** `src/components/v2/admin/SeasonCarousel.jsx`, `src/pages/dashboard/DashboardPage.jsx`

### Fix 8a: Scroll Arrows

Add left/right arrow buttons at the edges of the carousel:

```jsx
// State for scroll position
const scrollRef = useRef(null);
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(true);

const handleScroll = () => {
  const el = scrollRef.current;
  setCanScrollLeft(el.scrollLeft > 0);
  setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
};

const scrollBy = (direction) => {
  scrollRef.current.scrollBy({ left: direction * 260, behavior: 'smooth' });
};
```

Add arrow buttons (absolutely positioned at left/right edges of the carousel):
- Only show left arrow when `canScrollLeft`
- Only show right arrow when `canScrollRight`
- Style: 32px circle, white bg, shadow, centered chevron icon, z-index above cards

### Fix 8b: Richer Season Cards

Add more data to each season card. Each card currently shows: status badge, name, team count, player count, progress bar. Add:

- **Sport icon/name** (if multi-sport)
- **Financial summary** — collected/outstanding (from `perSeasonPaymentData` if available, otherwise skip)
- **Registration status** — "12 registered / 4 pending" or "Registration closed"
- **Date range** — "Jan 15 – May 30, 2026"

Check what data is available in the `seasons` array and `perSeasonTeamCounts`/`perSeasonPlayerCounts`. Only add fields that have data. Do NOT add new Supabase queries.

### Fix 8c: Season Switch Performance

The "near-full-page refresh" happens because `selectSeason()` triggers `loadDashboardData()` which resets stats to empty, shows loading skeleton, then re-renders everything. Fix 1 (empty state race condition) already added `setLoading(true)` on season switch, but the visual experience is still jarring.

Improve the transition:
1. Do NOT reset stats to empty before refetch. Keep the old season's data visible while loading.
2. Add a subtle loading indicator (e.g., a thin progress bar at the top of the main content, or a pulse animation on the hero card) instead of replacing everything with a skeleton.
3. When new data arrives, swap it in. This gives a "live update" feel instead of a full reload.

**Implementation:**
In `loadDashboardData()`, do NOT call `setStats({})` or equivalent at the beginning. Just set `setLoading(true)` and let the existing data stay visible. When the fetch completes, update stats atomically. The loading state should show a subtle overlay or indicator, not a full skeleton replacement.

Find the early return that shows `<SkeletonDashboard />` when `loading` is true:
```jsx
if (seasonLoading || loading) {
  return <SkeletonDashboard />
}
```

Change this to only show skeleton on INITIAL load (not on season switch):
```jsx
const [initialLoadComplete, setInitialLoadComplete] = useState(false);

// In loadDashboardData success callback:
setInitialLoadComplete(true);

// In render:
if ((seasonLoading || loading) && !initialLoadComplete) {
  return <SkeletonDashboard />
}
```

After initial load, season switches show the stale data with a loading indicator overlay instead of a full skeleton.

### Fix 8d: View All Seasons

The "View All →" link navigates to season management (`/admin/seasons`). If that page only shows one season, that's a bug on the seasons management page, not the dashboard. Do NOT fix the seasons management page in this spec. Just note it as a known issue.

**Commit:** `feat(v2): season carousel scroll arrows, richer cards, smooth transitions`

---

## Fix 9: Season Stepper — Post-Completion Behavior (LOW)

**Problem:** Once all 6 steps are complete, the stepper just sits there as wasted space. It should either disappear or evolve.

**Files:** `src/pages/dashboard/DashboardPage.jsx`, `src/components/v2/admin/SeasonStepper.jsx`

**Fix:** The investigation report noted that the stepper already hides when all steps are complete (`setupComplete < 6`). Verify this works. If it's already hiding, this is a non-issue.

If it IS showing when all steps are complete, add the conditional:
```jsx
{setupSteps.filter(s => s.status !== 'done').length > 0 && (
  <SeasonStepper ... />
)}
```

**Commit:** `fix(v2): season stepper hides when complete` (only if needed)

---

## Fix 10: Body Tabs — Richer Content (HIGH)

This is the biggest visual enhancement. The body tabs need to show more operational data — making them a "workable preview" that reduces the need to navigate to separate management pages.

### Fix 10a: Teams & Health Tab Enhancement

**File:** `src/components/v2/admin/AdminTeamsTab.jsx`

Add columns to the team table:
- Current: dot, Team, Roster, Record, Unpaid, Status
- Add: **Attendance %**, **Waivers** (signed/total), **Player Avatars** (circle stack)

For player avatars: show up to 5-6 circle avatars (32px, overlapping by -8px) plus "+N" overflow. This data comes from the roster/player data already available in `teamsData` or `teamStats`.

Check what player photo URLs are available in the data. If players have `photo_url` or `avatar_url` in their profiles, use those. If not, use gradient circles with initials (same pattern as coach dashboard roster tab).

For attendance % and waivers: these may not be in `teamStats`. If the data isn't available from existing state, show "—" as placeholder. Do NOT add new queries.

Make team row clicks navigate to the team's roster page: `onNavigate?.('teamwall', { teamId: team.id })` (already fixed in the prior round).

### Fix 10b: Registrations Tab Enhancement

**File:** `src/components/v2/admin/AdminRegistrationsTab.jsx`

Current: 2x3 stat cards (Total, Pending, Approved, Rostered, Waitlisted, Denied) + capacity bar + "View All" button.

Redesign:
1. Put all 6 stats in a single horizontal 1x6 row (compact stat chips)
2. Below that, show a LIST of individual registrations:
   - Each row: Player name, Parent name, Team, Status badge (Pending/Approved/Rostered), Date submitted
   - Cap at 8-10 rows with "View All Registrations →" footer
   - Clicking a row navigates to that player's registration profile (if route exists) or to `/registrations`
   - Sort by most recent first

This data should be derivable from existing state. Check if `loadDashboardData()` fetches player registration data. If individual registration rows aren't in state, show just the stat row + the existing "View All" link. Do NOT add new queries.

### Fix 10c: Payments Tab Enhancement

**File:** `src/components/v2/admin/AdminPaymentsTab.jsx`

Current: Two big cards (Collected/Outstanding), collection rate bar, monthly trend chart, "View All" button.

Redesign:
1. Put Collected, Outstanding, and Collection Rate on ONE horizontal row (3 compact cards)
2. Below that, show a LIST of payment records:
   - Each row: Family/Parent name, Player name, Amount, Status (Paid/Overdue/Pending), Due date
   - Cap at 8-10 rows
   - Overdue items highlighted (red text or red dot)
   - "View All Payments →" footer
   - Sort: overdue first, then by due date

3. Keep the monthly trend chart below the list (it's good visual context)

Same rule: use existing data only. If individual payment rows aren't available from state, keep the current layout but make the stat cards a single row.

### Fix 10d: Schedules Tab

**File:** `src/components/v2/admin/AdminScheduleTab.jsx`

Currently shows "No upcoming events" when empty. When events exist, it should show:
- Each row: Date, Time, Event name, Type (Practice/Game/Tournament), Team, Location, RSVP count
- Cap at 8-10 rows
- "View Full Schedule →" footer

This data comes from `upcomingEvents` already in state.

**Commit:** `feat(v2): body tabs richer content — teams, registrations, payments, schedules`

---

## Fix 11: Org Health Card Scope (MEDIUM)

**Problem:** The Org Health sidebar card shows season-scoped data. Should reflect org-wide health across all active seasons.

**Files:** `src/pages/dashboard/DashboardPage.jsx`

**Fix:** Same approach as Fix 6. Derive org-wide metrics from existing cross-season data (perSeasonTeamCounts, perSeasonPlayerCounts). For metrics that are only season-scoped (payments %, overdue), keep them but label clearly:

```jsx
title="Org Health"  // (already says this)
```

If org-wide data isn't derivable without new queries, add a subtitle to the card: "Across all active seasons" or "Season: Spring 2026" to set expectations.

**Commit:** `feat(v2): org health card scope clarity`

---

## Fix 12: Milestone Card Click → Trophy Case (LOW)

**Problem:** The milestone/XP card at the bottom right doesn't do anything when clicked. Should navigate to the admin's trophy case / achievements page.

**Files:** `src/pages/dashboard/DashboardPage.jsx`, `src/components/v2/MilestoneCard.jsx`

**Fix:**

1. Add an `onClick` prop to MilestoneCard if it doesn't have one:
   ```jsx
   MilestoneCard.propTypes = {
     ...existing props,
     onClick: PropTypes.func,
   };
   ```
   Wrap the card in a clickable div with cursor pointer.

2. In DashboardPage.jsx where MilestoneCard is rendered:
   ```jsx
   <MilestoneCard
     ...existing props
     onClick={() => onNavigate?.('achievements')}
   />
   ```

3. Verify `'achievements'` exists in routes.js and maps to `/achievements`.

**Commit:** `feat(v2): milestone card navigates to achievements`

---

## EXECUTION ORDER

1. Fix 1 — Role switcher (unblocks multi-role testing)
2. Fix 2 — Sidebar hover expand (UX critical for nav)
3. Fix 3 — Font check (quick investigation + fix)
4. Fix 4 — Mascot images (quick visual fix)
5. Fix 5 — Attention strip expandable (important functional fix)
6. Fix 6 — Hero card org-wide scope
7. Fix 7 — Financial snapshot scope
8. Fix 8 — Season carousel improvements
9. Fix 9 — Season stepper post-completion
10. Fix 10 — Body tabs richer content (biggest chunk)
11. Fix 11 — Org health scope
12. Fix 12 — Milestone card click

Build and verify after EACH fix. Push after all are committed.

---

## REMINDER: These fixes apply to the ADMIN dashboard only. Coach, Parent, Player, and Team Manager dashboards will get their own QA pass later. However, fixes to SHARED components (AttentionStrip, HeroCard, MascotNudge, MilestoneCard, TopBar, LynxSidebar) will automatically affect all roles. Be careful that changes to shared components don't break the other dashboards. After completing all fixes, do a quick smoke test: load Coach, Parent, Player, and Team Manager dashboards to verify no regressions.
