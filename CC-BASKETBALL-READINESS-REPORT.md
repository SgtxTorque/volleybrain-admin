# Basketball Readiness — Build Report

Generated: 2026-03-25

---

## Completed

### Phase 1: QuickScoreModal — Basketball Scoring (P0)
- **File:** `src/pages/gameprep/QuickScoreModal.jsx` (full rewrite)
- Added `BASKETBALL_FORMATS` array (4 Quarters + 2 Halves)
- Added sport detection: `isSetBased` flag derived from `sport` prop
- Added `periodScores` state alongside existing `setScores`
- Format selector now renders sport-appropriate formats (volleyball Best of 3/5 vs basketball Quarters/Halves)
- Score inputs: volleyball gets set inputs, basketball gets period inputs with Q1/Q2/Q3/Q4 or H1/H2 labels
- Save logic branches by sport:
  - Volleyball: writes `set_scores`, `our_sets_won`, `opponent_sets_won` (unchanged)
  - Basketball: writes `period_scores` only (follows GamePrepCompletionModal pattern exactly)
- Result calculation: volleyball uses sets-won logic, basketball uses total points comparison (supports ties)
- Result display: volleyball shows "WIN 2-1", basketball shows "WIN" with total score

### Phase 2: Leaderboards — Basketball Categories (P0)
- **File:** `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`
- Renamed `LEADERBOARD_CATEGORIES` → `VOLLEYBALL_LEADERBOARD_CATEGORIES` (contents unchanged)
- Added `BASKETBALL_LEADERBOARD_CATEGORIES` with 8 categories:
  - Points (`total_basketball_points`), Rebounds (`total_rebounds`), Assists (`total_basketball_assists`)
  - Steals (`total_steals`), Blocks (`total_blocks`)
  - FG% (`fg_percentage`), 3P% (`three_percentage`), FT% (`ft_percentage`)
- Added `getLeaderboardCategories(sport)` helper for sport-conditional selection
- Component derives `sportName` from `selectedSeason` or `selectedSport` context
- Categories reset when sport changes (selectedCategory cleared, viewMode reset to grid)
- Updated export and `index.js` re-export

### Phase 3: GameDetailModal — Period Breakdown (P1)
- **File:** `src/components/games/GameDetailModal.jsx`
- Added `sport` prop to component signature
- Added period-by-period breakdown section (after existing set-by-set block):
  - Reads `game.period_scores` for basketball/soccer games
  - Labels derived from `game.scoring_format`: "Q1-Q4" for quarters, "H1-H2" for halves
  - Visual style matches set-by-set cards (emerald/red color coding)
  - Section heading: "Quarter-by-Quarter Breakdown" / "Half-by-Half Breakdown" / "Period Breakdown"
- **File:** `src/pages/gameprep/GamePrepPage.jsx` line 569
  - Wired `sport={sport}` prop to GameDetailModal call site

### Phase 4: GameDayCommandCenter — Gate + Column Bug Fix (P1)
- **File:** `src/pages/gameprep/GameDayCommandCenter.jsx`
- **Bug fix:** `their_score` → `opponent_score` (3 occurrences in season record query)
- **Bug fix:** `status: 'completed'` → `game_status: 'completed'` (read query filter + save update)
- Added `sport` prop to component signature
- Added non-volleyball sport gate: basketball/soccer/other sports show a friendly "Live scoring coming soon" overlay with back button, instead of the volleyball court/stats UI
- **File:** `src/pages/gameprep/GamePrepPage.jsx` line 583
  - Wired `sport={sport}` prop to GameDayCommandCenter call site

### Phase 5: Volleyball Fallback Cleanup (P2)
- `ParentDashboard.jsx` line 84: `{ name: 'Volleyball', icon: '🏐' }` → `{ name: 'Sport', icon: '🏆' }`
- `CoachDashboard.jsx` line 898: `|| 'volleyball'` → `|| ''`
- `PlayerProfilePage.jsx` line 40: `useState('volleyball')` → `useState('')`
- `PlayerProfilePage.jsx` line 116: `|| 'volleyball'` → `|| ''`
- `ParentPlayerCardPage.jsx` line 231: `useState('volleyball')` → `useState('')`
- `ParentPlayerCardPage.jsx` line 257: `|| 'volleyball'` → `|| ''`
- `PlayerProfileInfoTab.jsx` line 39: Added `?.` safe access for `sportName?.toLowerCase()`
- `GamePrepPage.jsx` line 51: `|| 'volleyball'` → `|| ''`
- `TeamWallPage.jsx` line 816: `|| 'volleyball'` → `|| ''`
- `EventDetailModal.jsx` line 573: `|| 'volleyball'` → `|| ''`
- `TeamWallLeftSidebar.jsx` line 103: Changed hardcoded volleyball image paths to generic `sports-game.jpg`/`sports-practice.jpg`

---

## Skipped (by design)

- **Standings score display** — already works via fallback (`our_score - opponent_score` renders when `set_scores` is null)
- **Config map fallbacks** (`SPORT_CONFIGS[sport] || SPORT_CONFIGS.volleyball` in AdvancedLineupBuilder.jsx and GameComponents.jsx) — internal config lookups, not user-facing strings
- **`getSportDisplay()` fallback** in ParentPlayerCardPage.jsx — display utility that must return valid data, falls back to volleyball display object as intended
- **`PeriodScoreInput.jsx`** — the orphaned component in gameprep/ was not imported into QuickScoreModal since we built inline period inputs matching the existing set input visual style for consistency

---

## Known Limitations

1. **Leaderboards show correct category names but may show zeros** until basketball game data populates `player_season_stats` (the columns exist but need game stats to be entered and aggregated)
2. **GameDayCommandCenter live scoring is volleyball-only** — basketball/soccer shows a "coming soon" gate with a back button directing users to Game Prep
3. **No basketball event images for TeamWall** — changed volleyball-specific image paths to generic names (`sports-game.jpg`/`sports-practice.jpg`) but these image files may not exist yet; the hero card will show with a fallback/broken image
4. **Player Stats tab in GameDetailModal** is still volleyball-column-specific (kills, aces, digs, blocks, assists, hit%, srv%) — basketball games will show these columns even though the data is basketball stats. This needs a separate sport-aware stats table in a future sprint.

---

## Issues Found During Build

1. **GameDayCommandCenter had 2 pre-existing column name bugs** (`their_score` instead of `opponent_score`, `status` instead of `game_status`) — fixed in Phase 4. These were silently failing writes, meaning any game saved via the live Game Day Command Center was NOT actually persisting the score to the database correctly.
2. **`PeriodScoreInput.jsx`** exists but is not theme-aware — it uses hardcoded light-mode colors (`bg-white`, `border-indigo-200`, etc.) that won't work with the app's dark mode. We built inline period inputs in QuickScoreModal instead.
3. **Build produces a 2.7MB chunk size warning** — pre-existing, not introduced by these changes.

---

## Files Changed

| File | Phase | Change |
|------|-------|--------|
| `src/pages/gameprep/QuickScoreModal.jsx` | 1 | Full rewrite: sport-aware scoring |
| `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | 2 | Basketball leaderboard categories |
| `src/pages/leaderboards/index.js` | 2 | Updated re-exports |
| `src/components/games/GameDetailModal.jsx` | 3 | Added sport prop + period breakdown |
| `src/pages/gameprep/GamePrepPage.jsx` | 3,4 | Wired sport prop to GameDetailModal + GameDayCommandCenter |
| `src/pages/gameprep/GameDayCommandCenter.jsx` | 4 | Column bug fixes + sport gate |
| `src/pages/roles/ParentDashboard.jsx` | 5 | Generic sport fallback |
| `src/pages/roles/CoachDashboard.jsx` | 5 | Removed volleyball fallback |
| `src/pages/parent/PlayerProfilePage.jsx` | 5 | Removed volleyball fallback (2 locations) |
| `src/pages/parent/PlayerProfileInfoTab.jsx` | 5 | Safe access for sportName |
| `src/pages/parent/ParentPlayerCardPage.jsx` | 5 | Removed volleyball fallback (2 locations) |
| `src/pages/teams/TeamWallPage.jsx` | 5 | Removed volleyball fallback |
| `src/pages/teams/TeamWallLeftSidebar.jsx` | 5 | Generic sport image paths |
| `src/pages/schedule/EventDetailModal.jsx` | 5 | Removed volleyball fallback |
