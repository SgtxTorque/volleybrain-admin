# CC-BASKETBALL-READINESS-INVESTIGATION.md
# Basketball Readiness — Pre-Build Investigation
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. We have a build spec (CC-BASKETBALL-READINESS.md) ready to execute, but before running it we need to verify assumptions, identify risks, and confirm the database can support the changes. Report back with findings so the build spec can be tightened.

---

## CONTEXT

Marisa is about to beta test with a basketball organization. We identified 4 blocking bugs (QuickScoreModal volleyball-only, leaderboards volleyball-only, GameDetailModal set labels, standings set scores) plus ~15 volleyball fallback strings. Before fixing them, we need to confirm exactly what needs to change and what risks exist.

---

## INVESTIGATION TASKS

### 1. QuickScoreModal — Full Read

Open and read `src/pages/gameprep/QuickScoreModal.jsx` completely (every line).

**Report:**
- Full component structure — what props does it receive, what state does it manage?
- How does `VOLLEYBALL_FORMATS` drive the UI? Walk through the exact rendering logic.
- How does the save/submit function work? What Supabase table and columns does it write to? Copy the exact save query.
- What columns does it write game results to? (e.g., `our_score`, `opponent_score`, `set_scores`, `our_sets_won`, `opponent_sets_won`, `game_result`, `period_scores`, etc.)
- Does a `period_scores` column exist on the games/events table, or only `set_scores`?
- Where is QuickScoreModal imported and called from? List every call site with the props passed (especially the `sport` prop — is it always provided or sometimes missing?).

### 2. GamePrepCompletionModal — Save Pattern

Open and read `src/pages/gameprep/GamePrepCompletionModal.jsx` — specifically the save/submit logic for period-based sports.

**Report:**
- How does it save basketball game results? What columns and format?
- Does it save `period_scores` as a JSON column? What shape is the data? (e.g., `[{our: 15, their: 12}, {our: 20, their: 18}]` or different?)
- What is the difference between how it saves volleyball results vs basketball results?
- Can we reuse this save pattern in QuickScoreModal?

### 3. Database Schema — Game Result Columns

We need to know what columns exist on the games/events table for storing scores.

**Report:**
- Search the codebase for ALL columns written when saving a game result. Look at every game save/update query across all files. Common patterns:
  - `our_score`, `opponent_score`
  - `set_scores` (JSON array of set scores)
  - `our_sets_won`, `opponent_sets_won`
  - `period_scores` (does this column exist?)
  - `game_result` (win/loss/tie)
  - `scoring_format`
  - Any other score-related columns

Search for: `supabase.from('events').update`, `supabase.from('games').update`, or similar patterns that write game results.

- List every column that gets written and its expected format/type.
- If `period_scores` does NOT exist as a column, how does GamePrepCompletionModal save quarter scores? Does it reuse `set_scores` with different semantics?

### 4. Leaderboard Data Source

Open and read `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` completely.

**Report:**
- What Supabase query loads leaderboard data? Copy the exact query.
- What table/view does it read from? (e.g., `player_season_stats`, `player_stats`, a materialized view, or raw game stats aggregated client-side?)
- What columns are available in that table/view? List them all.
- Are basketball stat columns present? (e.g., `total_rebounds`, `rebounds_per_game`, `total_steals`, `steals_per_game`, `fg_percentage`, `three_point_percentage`, `ft_percentage`)
- If basketball columns are NOT present, what is available? Could we compute basketball leaderboards from raw game stat entries?
- Is the leaderboard query already sport-aware, or does it fetch all stats regardless of sport?

### 5. GameDetailModal — Score Display Logic

Open and read `src/components/games/GameDetailModal.jsx` — specifically the score display and breakdown sections.

**Report:**
- How does the modal receive game data? What fields are on the game object?
- Does the modal have access to sport info? (Via game.teams.seasons.sports, or a prop, or context?)
- What is the exact conditional logic for displaying set scores vs total scores?
- If the game has `period_scores` (or basketball scores stored in `set_scores`), how would the current code render them? Would it show "Set 1, Set 2" labels on basketball quarter data?
- What would need to change to show "Q1, Q2, Q3, Q4" instead of "Set 1, Set 2, Set 3"?

### 6. Standings — Score Display Logic

Open and read the relevant section of `src/pages/standings/TeamStandingsPage.jsx` (~lines 390-410).

**Report:**
- How does the standings page get game data? What query, what joins?
- Does the game data include sport info?
- What is the exact conditional for displaying `our_sets_won - opponent_sets_won`?
- If a basketball game has no `set_scores` and no `our_sets_won`, does the existing code already fall through to showing `our_score - opponent_score`? (If so, this might not actually be a bug — it might already work by fallback.)

### 7. GameDayCommandCenter — Sport Awareness

Open and read `src/pages/gameprep/GameDayCommandCenter.jsx` — specifically the scoring/live game section.

**Report:**
- Is this component actively used for live game scoring, or is it a legacy/WIP feature?
- Does it receive or detect sport type?
- Does it use set-based scoring exclusively, or does it have period-based paths?
- How much work would it take to make it sport-aware? (Simple conditional vs major refactor)
- Is this something Marisa would use in beta, or is it out of scope?

### 8. Call Sites Audit — Sport Prop Propagation

For each component that needs to be sport-aware, check whether the sport prop is actually available at the call site.

**Report for each:**

| Component | Call Site File | Call Site Line | Sport Prop Passed? | Where Does Sport Come From? |
|-----------|--------------|---------------|-------------------|---------------------------|

Components to check:
- QuickScoreModal
- GameDetailModal
- GameDayCommandCenter

If sport is NOT passed at a call site, we'll need to add it. Report exactly what data is available at each call site (season object, team object, sport context, etc.) so we know how to wire it.

### 9. Risk Assessment

Based on all findings, report:

**High risk items** — things that could break or cause unexpected behavior:
- Any database columns that don't exist but the build spec assumes they do
- Any save logic that would write bad data
- Any query that would fail or return wrong results

**Medium risk items** — things that might not work perfectly but won't break:
- Leaderboard categories that exist in code but have no data in the database yet
- Display issues where labels might be wrong but data is correct

**Low risk items** — cosmetic or edge cases:
- Fallback string changes
- Icon swaps

**Items that might already work without changes:**
- If standings already falls through to `our_score - opponent_score` for basketball, it's not a bug
- If GameDetailModal already handles the no-set-scores case gracefully, it might already work

---

## OUTPUT FORMAT

```
## INVESTIGATION REPORT — Basketball Readiness Pre-Build

### 1. QuickScoreModal
[full findings including save logic]

### 2. GamePrepCompletionModal Save Pattern
[findings]

### 3. Database Schema — Game Result Columns
[complete column list with formats]

### 4. Leaderboard Data Source
[query, table, available columns]

### 5. GameDetailModal
[findings]

### 6. Standings
[findings — is this actually a bug?]

### 7. GameDayCommandCenter
[findings — scope assessment]

### 8. Call Sites Audit
[table of sport prop propagation]

### 9. Risk Assessment
[categorized risks]
```

Include exact file paths, line numbers, and code snippets (under 20 lines each).

---

## REMINDER

**Do NOT modify any files.** Read only. Report back.
