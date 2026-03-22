# CC-WEB-SEASON-STATE-INVESTIGATION.md
# Classification: INVESTIGATION ONLY
# Repo: SgtxTorque/volleybrain-admin
# Branch: feat/desktop-dashboard-redesign (or main — confirm which is active)

---

## CRITICAL RULES

- **Do NOT modify any files.**
- **Pre-read `CC-LYNX-RULES.md` and `AGENTS.md`** before starting if they exist in this repo.
- Produce a written report (`WEB-SEASON-STATE-INVESTIGATION-REPORT.md`) at the end with all findings.
- Use `grep`, `cat`, and file reads only. No edits, no commits.

---

## CONTEXT

Carlos found three bugs on the web admin (thelynxapp.com) while testing the admin dashboard:

### Bug 1 — "All Seasons" filter corrupts global state
**Steps to reproduce:**
1. Admin is on the dashboard with a season selected (e.g., Spring 2026)
2. Clicks a section header (e.g., Coaches) to navigate to Coach Directory
3. Coach Directory loads correctly, scoped to the current season
4. Admin opens the season dropdown and selects "All Seasons"
5. Coach Directory partially renders (empty state, filter dropdowns disappear)
6. Admin navigates back to the dashboard
7. **Dashboard now shows the "Welcome to [Org Name]! Create Your First Season" empty state** — as if no seasons exist
8. Hard refresh (Ctrl+R) restores the dashboard to normal

**Hypothesis:** The season dropdown writes a null, undefined, or "all" value to global season state (likely React context or Zustand/Redux store). Other pages — including the dashboard — interpret that value as "no season exists" and render the brand-new-org welcome screen.

### Bug 2 — Payments page loses season context
**Steps to reproduce:**
1. Navigate to /payments
2. Page shows "Please select a season from the sidebar" even though a season was previously selected

**Hypothesis:** Same root cause as Bug 1. The global season state is either not persisted across route changes, or the Payments page doesn't read from the same state source as the dashboard.

### Bug 3 — Action Items count mismatch
**Steps to reproduce:**
1. On the admin dashboard, the Spring 2026 season card badge shows "87" attention items
2. Below, the Action Items tab body shows only "47" items
3. 40 items are unaccounted for

**Hypothesis:** The season card badge and the Action Items tab query different data sources, or one applies filters/pagination that the other doesn't.

### UX Issue — Selected season card needs visual distinction
The currently selected season card shows a small "Selected" text label but doesn't visually stand out. Carlos wants the selected card to have a lynx-sky blue (#4BB9EC) border or background tint so it's immediately obvious.

---

## PHASE 1 — Map Global Season State

**Goal:** Understand how season selection state flows through the entire web admin.

1. **Find the season state provider.**
   - Search for React Context, Zustand store, Redux store, or any global state that holds the current season.
   - `grep -rn "createContext\|useContext\|create(\|configureStore\|seasonContext\|selectedSeason\|activeSeason\|currentSeason" src/`
   - Identify: What is the state shape? What values can it hold? Is there a "null" or "all" case?

2. **Find the season selector dropdown component.**
   - `grep -rn "All Seasons\|allSeasons\|season.*dropdown\|season.*select\|SeasonSelector\|SeasonPicker\|SeasonFilter" src/`
   - Trace what happens when "All Seasons" is selected. What value gets written to state? (null? empty string? "all"? undefined?)

3. **Find the dashboard's season check.**
   - Locate the admin dashboard component (likely `src/pages/Dashboard` or similar).
   - Find the conditional that decides between showing the "Welcome, create your first season" empty state vs. the normal dashboard.
   - What exact condition triggers the empty state? `if (!season)` ? `if (seasons.length === 0)` ? Something else?
   - **This is the core of Bug 1** — document the exact line and condition.

4. **Map season state consumers across ALL pages.**
   - `grep -rn "useSeason\|useSelectedSeason\|useActiveSeason\|seasonContext\|selectedSeason" src/`
   - List every page/component that reads from global season state.
   - For each, note: What does it render when season is null/undefined/"all"?
   - Flag any page that would break or show wrong content when season state is "all" or null.

5. **Check if season state persists across navigation.**
   - Is the state held in React context (lost on unmount)?
   - Is it in a global store (persists)?
   - Is it in URL params (persists)?
   - Is it in localStorage (persists across refreshes)?
   - Document the persistence mechanism.

**Report for Phase 1:** Provide a diagram/table showing: State source → Selector component → All consumers → What each consumer does with null/"all" values.

---

## PHASE 2 — Diagnose Action Items Count Mismatch

**Goal:** Find why the season card badge says 87 but the Action Items tab shows 47.

1. **Find the season card badge count query.**
   - Locate the season card component on the dashboard.
   - Find the query or computation that produces the red attention badge number (87 in this case).
   - Document: What tables does it query? What filters does it apply? Does it include all item types (payments, registrations, schedules, waivers, etc.)?

2. **Find the Action Items tab query.**
   - Locate the Action Items tab component on the dashboard.
   - Find the query or data source that produces the list and the "47" count in the tab header.
   - Document: What tables? What filters? Is there pagination or a limit?

3. **Compare the two.**
   - Side-by-side: What does the card count include that the tab excludes (or vice versa)?
   - Is one filtering by team, date range, status, or item type differently?
   - Is the tab paginated but the card count is not?
   - Are there item categories visible in the card count that have no corresponding section in the tab body?

4. **Check all other dashboard tabs too.**
   - Teams & Health, Registrations, Payments, Schedules — do their tab counts add up consistently with their content?

**Report for Phase 2:** Exact queries for both counts, the delta explanation, and recommended fix.

---

## PHASE 3 — Audit ALL Role Dashboards for Season State Issues

**Goal:** Get ahead of this bug across every role, not just admin.

1. **List all role-specific dashboard pages on the web admin.**
   - Admin dashboard, Coach dashboard, Parent dashboard, Player dashboard, Team Manager dashboard (if they exist on web).
   - For each, find: Does it read from global season state? What does it show when season is null?

2. **List all pages that use season-scoped data.**
   - Coach Directory, Payments, Registrations, Teams, Events/Schedule, Reports, Player Directory, etc.
   - For each: Does it have its own season selector? Does it fall back to global state? What happens with "All Seasons" or null?

3. **Check the sidebar season selector** (if there is one).
   - The Payments page said "Please select a season from the sidebar" — is there a sidebar season picker that's separate from the per-page dropdown?
   - How does the sidebar selector relate to the per-page selector?
   - Can they conflict?

4. **Document every "empty state" condition across all pages.**
   - For each page: What condition triggers the empty/welcome state?
   - Flag any that would false-trigger when season = null/"all" (same bug as dashboard).

**Report for Phase 3:** Table of every page, its season state dependency, and whether it's vulnerable to the "All Seasons" corruption bug.

---

## PHASE 4 — Selected Season Card Styling

**Goal:** Find exactly where to add visual distinction to the selected card.

1. **Find the season card component.**
   - Locate the component that renders the horizontal season cards on the admin dashboard.
   - Find how the "Selected" label currently renders.
   - Document: What CSS classes/styles are applied to selected vs. unselected cards?
   - Note the exact file, line numbers, and current className/style props.

2. **Check the design system.**
   - Is `#4BB9EC` (lynx-sky) already defined as a CSS variable or Tailwind token?
   - What's the current card border/background style?
   - Document what needs to change: border color, background tint, text color, shadow, etc.

**Report for Phase 4:** Exact component, exact lines, current styles, and a specific recommendation for the selected state styling using lynx-sky blue.

---

## REPORT FORMAT

Produce `WEB-SEASON-STATE-INVESTIGATION-REPORT.md` with:

```
# WEB-SEASON-STATE-INVESTIGATION-REPORT

## Phase 1: Global Season State Map
- State provider: [file, line, mechanism]
- Season selector: [file, line, what "All Seasons" writes]
- Dashboard empty state condition: [file, line, exact condition]
- Consumer table: [page | reads from | null behavior | vulnerable?]
- Persistence: [mechanism, survives navigation?, survives refresh?]

## Phase 2: Action Items Count Mismatch
- Card badge query: [file, line, tables, filters]
- Tab body query: [file, line, tables, filters]
- Delta explanation: [what's missing and why]
- Recommended fix: [specific changes]

## Phase 3: All-Role Season State Audit
- Dashboard table: [role | page | season dependency | null behavior | vulnerable?]
- Page table: [page | season selector type | global state fallback | null behavior | vulnerable?]
- Sidebar vs per-page selector relationship: [description]
- False-trigger empty states: [list]

## Phase 4: Selected Card Styling
- Component: [file, line]
- Current selected styles: [classes/styles]
- Recommended change: [specific CSS/className changes using #4BB9EC]
- Design token status: [exists? needs creation?]
```

---

## REMINDER

**Do NOT modify any files. Investigation and report only.**
