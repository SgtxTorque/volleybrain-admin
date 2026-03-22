# CC-WEB-ALL-SEASONS-ORG-VIEW-INVESTIGATION.md
# Classification: INVESTIGATION ONLY
# Repo: SgtxTorque/volleybrain-admin
# Branch: main
# Reference: WEB-SEASON-STATE-INVESTIGATION-REPORT.md

---

## CRITICAL RULES

- **Do NOT modify any files.**
- **Pre-read `CC-LYNX-RULES.md` and `AGENTS.md`** before starting if they exist in this repo.
- Produce a written report (`WEB-ALL-SEASONS-ORG-VIEW-REPORT.md`) at the end with all findings.
- Use `grep`, `cat`, and file reads only. No edits, no commits.

---

## CONTEXT

We just fixed a bug where selecting "All Seasons" set `selectedSeason` to `null`, causing 6 pages to show false empty states. The fix removed "All Seasons" from the dropdown entirely and added a null guard.

Now we want to bring "All Seasons" back — properly. The product principle is: **"Season is a FILTER, not a GATE. Admin sees the whole org by default."** An admin should be able to view coaches, payments, teams, registrations, and everything else across all seasons from a single org-wide view. "All Seasons" should be a first-class state, not a null hack.

### The Plan (High Level)
1. Introduce a sentinel value in SeasonContext (e.g., `{ id: 'all', name: 'All Seasons' }`) so that "All Seasons" is a real state, distinct from null (no seasons exist).
2. Add "All Seasons" back to SeasonFilterBar using the sentinel.
3. Update every page/query that consumes `selectedSeason` to handle the sentinel — either by dropping the season filter (showing all data) or by showing appropriate messaging if the page is inherently season-scoped.
4. Make "All Seasons" the default for admins on the dashboard.

### What This Investigation Needs to Map
Before we can write the execution spec, we need CC to catalog every place season filtering happens so we know the full scope of changes.

---

## PHASE 1 — Catalog Every Season-Filtered Query

**Goal:** Find every Supabase query, data fetch, or filter operation that uses `selectedSeason` to scope data.

1. **Search for all uses of `selectedSeason` in queries.**
   ```bash
   grep -rn "selectedSeason" src/ --include="*.jsx" --include="*.js" --include="*.tsx" --include="*.ts" | grep -v "node_modules"
   ```

2. **For each file that uses `selectedSeason`, document:**
   - File path and line number(s)
   - What data it queries (which Supabase table/view)
   - How it uses the season: `.eq('season_id', selectedSeason.id)` ? Passed as parameter? Used in a join?
   - What the query returns (coaches, payments, teams, players, events, etc.)
   - What happens currently if `selectedSeason` is null (does it skip the query? crash? return empty?)

3. **Also search for indirect season filtering:**
   ```bash
   grep -rn "season_id\|seasonId\|season\.id" src/ --include="*.jsx" --include="*.js" --include="*.tsx" --include="*.ts" | grep -v "node_modules"
   ```
   Some components might receive season ID as a prop rather than reading from context directly.

4. **Organize findings into a table:**

   ```
   | File | Line(s) | Table Queried | Filter Used | Data Type | Can Work Unfiltered? |
   ```

   The "Can Work Unfiltered?" column is critical — mark YES if removing the season filter would return valid, useful data (e.g., all coaches across all seasons). Mark NO if the data is inherently season-scoped and showing all seasons would be confusing or meaningless (e.g., lineup cards for a specific game).

---

## PHASE 2 — Classify Pages by "All Seasons" Compatibility

**Goal:** For each page in the web admin, determine whether an org-wide unfiltered view makes sense.

Go through every page in `src/pages/` and classify it:

### Category A: "All Seasons" Makes Full Sense
These pages should show aggregated/unfiltered data when "All Seasons" is selected.
Expected examples: Dashboard, Coaches, Teams, Payments, Registrations, Players/Roster, Staff, Schedule/Events

### Category B: "All Seasons" Works But Needs Clarification
These pages can show unfiltered data but might need a visual indicator or grouping (e.g., group teams by season, show season labels on payment rows).
Expected examples: Blasts history, Chat channels, Attendance records

### Category C: Inherently Season-Scoped
These pages only make sense with a specific season selected. When "All Seasons" is active, they should show a friendly message like "Select a specific season to view [X]" — NOT the broken empty states we just fixed.
Expected examples: Standings, Leaderboards (if season-scoped), possibly Waivers, Jerseys

For each page, document:
- Page name and file
- Category (A, B, or C)
- Reason for classification
- Any special handling needed (grouping, labeling, messaging)

---

## PHASE 3 — Audit SeasonContext and Selector Components

**Goal:** Map exactly what needs to change in the state layer.

1. **Read `src/contexts/SeasonContext.jsx` fully.** Document:
   - Current state shape (confirm matches investigation report)
   - The `selectSeason` function (now with the null guard we just added)
   - The initialization flow (localStorage restore, active season fallback)
   - How `seasons` and `allSeasons` differ (sport filtering?)
   - What changes are needed to support a sentinel "all" value

2. **Read `src/components/pages/SeasonFilterBar.jsx` fully.** Document:
   - Current dropdown rendering logic
   - The onChange handler
   - What needs to change to add "All Seasons" back with the sentinel value

3. **Read `src/components/layout/HeaderComponents.jsx` (HeaderSeasonSelector).** Document:
   - Does this also need "All Seasons"?
   - How does it interact with SeasonFilterBar?
   - Should admin header default to "All Seasons"?

4. **Read `src/components/v2/admin/SeasonCarousel.jsx`.** Document:
   - How does the carousel interact with season selection?
   - Should there be an "All" card or does deselecting all cards = "All Seasons"?
   - What happens to the Season Journey progress bar when "All Seasons" is active?

5. **Check localStorage handling:**
   - If user selects "All Seasons", should that persist in localStorage?
   - On next load, should admin default to "All Seasons" or to the last specific season?

---

## PHASE 4 — Dashboard-Specific Considerations

**Goal:** Figure out what the admin dashboard looks like in "All Seasons" mode.

1. **Season Carousel behavior:**
   - When "All Seasons" is active, should no card be highlighted? Or should there be a visual "All" state?
   - Clicking a specific season card should switch to that season's filtered view.
   - Should the carousel still show `perSeasonActionCounts` badges on each card?

2. **Season Journey progress bar:**
   - This is inherently single-season. What shows here in "All Seasons" mode?
   - Options: hide it, show the most recent season's journey, or show an org-level "health" summary.

3. **Action Items tab:**
   - In "All Seasons" mode, should this show action items aggregated across all seasons?
   - Or should it default to the most recent active season's items?

4. **Other dashboard tabs (Teams & Health, Registrations, Payments, Schedules):**
   - What does each tab show in "All Seasons" mode?
   - Can the queries handle no season filter without performance issues?

5. **The GettingStartedGuide empty state (lines 778-779):**
   - Current condition: `!seasonLoading && !selectedSeason`
   - With sentinel, this needs to change to: `!seasonLoading && seasons.length === 0`
   - Confirm this is the only place that determines "show welcome vs. show dashboard"

---

## PHASE 5 — Role-Specific Behavior

**Goal:** Determine how "All Seasons" affects non-admin roles.

1. **Should non-admin roles even see "All Seasons"?**
   - Coach: Maybe — could be useful to see their teams across seasons. Or maybe not if they only coach one season at a time.
   - Parent: Probably yes — they want to see all their kids' activity, not just one season.
   - Player: Probably yes — career view across seasons is a planned feature.
   - Team Manager: Probably no — they're scoped to one team in one season.

2. **For each role's dashboard, document:**
   - Does it use `selectedSeason` from context?
   - Would the queries work without a season filter?
   - Any role-specific concerns?

3. **Check role detection in SeasonContext:**
   - Does SeasonContext know the user's role?
   - Could we make "All Seasons" the default for admin/parent but a specific season default for coach/player/TM?

---

## REPORT FORMAT

Produce `WEB-ALL-SEASONS-ORG-VIEW-REPORT.md` with:

```
# WEB-ALL-SEASONS-ORG-VIEW-REPORT

## Phase 1: Season-Filtered Query Catalog
[Table of every query that uses selectedSeason, what it queries, and whether it can work unfiltered]

## Phase 2: Page Classification
### Category A — Full "All Seasons" Support
[List with reasoning]

### Category B — Works With Clarification
[List with reasoning and handling notes]

### Category C — Inherently Season-Scoped
[List with reasoning and messaging recommendation]

## Phase 3: State Layer Audit
- SeasonContext changes needed: [specifics]
- SeasonFilterBar changes needed: [specifics]
- HeaderSeasonSelector changes needed: [specifics]
- SeasonCarousel changes needed: [specifics]
- localStorage strategy: [recommendation]

## Phase 4: Dashboard in "All Seasons" Mode
- Carousel behavior: [recommendation]
- Season Journey bar: [recommendation]
- Action Items: [recommendation]
- Other tabs: [recommendation per tab]
- GettingStartedGuide condition: [exact fix]

## Phase 5: Role-Specific Behavior
[Table: role | sees "All Seasons"? | default state | concerns]

## Estimated Scope
- Total files to modify: [count]
- Total queries to update: [count]
- Complexity assessment: [low/medium/high per phase]
- Recommended execution order: [phases]
```

---

## REMINDER

**Do NOT modify any files. Investigation and report only.**
