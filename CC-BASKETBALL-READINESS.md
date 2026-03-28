# CC-BASKETBALL-READINESS.md
# Basketball Readiness — Verified Build Spec
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Make the web app fully functional for basketball beta testing. All changes verified by pre-build investigation — no assumptions. The database already supports basketball (period_scores column exists, basketball stat columns exist in player_season_stats). The work is purely frontend.

---

## GUARDRAILS

- **Read before modify.** Open every file before changing it.
- **Do not break volleyball.** Every change uses sport-conditional branching.
- **Do not change the database.** All needed columns already exist.
- **Follow the GamePrepCompletionModal pattern.** It already handles basketball correctly — copy its save logic and sport branching, not invent new patterns.
- **Generate a report file.** After all phases, write a summary report to `CC-BASKETBALL-READINESS-REPORT.md` in the project root listing what was changed, what was skipped, and any issues found.
- **Commit after each phase.**

---

## PHASE 1: QuickScoreModal — Basketball Scoring (P0)

### File: `src/pages/gameprep/QuickScoreModal.jsx`

**The bug:** The `sport` prop is received but completely ignored. Basketball games get volleyball Best-of-3/Best-of-5 set scoring. Saving writes to `set_scores` and `our_sets_won` columns — corrupting basketball game data.

**Step 1.1:** Read `QuickScoreModal.jsx` fully and `GamePrepCompletionModal.jsx` lines 40-80 (basketball format definitions) and lines 360-380 (save logic branching).

**Step 1.2:** Add basketball formats alongside existing volleyball ones:

```javascript
const BASKETBALL_FORMATS = [
  { id: 'four_quarters', name: '4 Quarters', periods: 4, periodName: 'Quarter', periodAbbr: 'Q', hasOvertime: true },
  { id: 'two_halves', name: '2 Halves', periods: 2, periodName: 'Half', periodAbbr: 'H', hasOvertime: true },
]
```

**Step 1.3:** Add sport detection using the existing `sport` prop (already passed from GamePrepPage.jsx line 594):

```javascript
const sportLower = sport?.toLowerCase() || ''
const isSetBased = sportLower === 'volleyball'
const formats = isSetBased ? VOLLEYBALL_FORMATS : BASKETBALL_FORMATS
```

**Step 1.4:** Add `periodScores` state alongside existing `setScores` state:

```javascript
const [periodScores, setPeriodScores] = useState([])
```

Initialize period scores when format changes (for non-set-based sports):

```javascript
useEffect(() => {
  if (isSetBased) {
    setSetScores(Array(selectedFormat.maxSets).fill(null).map(() => ({ our: 0, their: 0 })))
  } else {
    setPeriodScores(Array(selectedFormat.periods).fill(null).map(() => ({ our: 0, their: 0 })))
  }
}, [selectedFormat])
```

**Step 1.5:** Update format selector to use `formats` variable instead of hardcoded `VOLLEYBALL_FORMATS`.

**Step 1.6:** Update score input UI. Import `PeriodScoreInput` from `./PeriodScoreInput` (already exists, currently orphaned). Add conditional:

- If `isSetBased`: render existing set score inputs unchanged
- If NOT `isSetBased`: render PeriodScoreInput per `selectedFormat.periods`

**Step 1.7:** Update save logic (lines 83-101). Branch based on sport — follow GamePrepCompletionModal pattern exactly:

For set-based (volleyball) — keep existing save logic unchanged.

For period-based (basketball):
```javascript
const ourTotal = periodScores.reduce((sum, p) => sum + (p.our || 0), 0)
const theirTotal = periodScores.reduce((sum, p) => sum + (p.their || 0), 0)

const updateData = {
  game_status: 'completed',
  scoring_format: selectedFormat.id,
  our_score: ourTotal,
  opponent_score: theirTotal,
  point_differential: ourTotal - theirTotal,
  game_result: ourTotal > theirTotal ? 'win' : ourTotal < theirTotal ? 'loss' : 'tie',
  period_scores: periodScores,
  completed_at: new Date().toISOString(),
  completed_by: user?.id,
}
```

Basketball does NOT write set_scores, our_sets_won, or opponent_sets_won.

**Step 1.8:** Initialize `selectedFormat` from correct format array:

```javascript
const [selectedFormat, setSelectedFormat] = useState(isSetBased ? VOLLEYBALL_FORMATS[0] : BASKETBALL_FORMATS[0])
```

**Commit:** `fix: QuickScoreModal sport-aware — basketball gets quarter/half scoring with period_scores save`

---

## PHASE 2: Leaderboards — Basketball Categories (P0)

### File: `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`

**The bug:** LEADERBOARD_CATEGORIES is hardcoded with 8 volleyball stats. Basketball columns exist in player_season_stats but the UI never references them.

**Step 2.1:** Read the file fully. Note existing categories (~line 52-125), data query (~lines 387-406), and how categories drive UI (~lines 504-518).

**Step 2.2:** Rename existing array to `VOLLEYBALL_LEADERBOARD_CATEGORIES`. Keep contents exactly as-is.

**Step 2.3:** Create `BASKETBALL_LEADERBOARD_CATEGORIES`. Before writing, verify the exact column names by reading the Supabase query response shape and checking `SUPABASE_SCHEMA.md` or `SCHEMA_REFERENCE.csv`. The investigation reported these columns exist — confirm their exact names:
- total_basketball_points (or total_points?)
- total_rebounds
- total_basketball_assists (or total_assists?)
- total_steals
- total_blocks
- fg_percentage
- three_percentage
- ft_percentage

Use the CONFIRMED column names, not the guesses above.

**Step 2.4:** Add sport detection:
```javascript
const sportName = selectedSeason?.sports?.name?.toLowerCase() || selectedSport?.name?.toLowerCase() || ''
const LEADERBOARD_CATEGORIES = sportName === 'basketball' ? BASKETBALL_LEADERBOARD_CATEGORIES : VOLLEYBALL_LEADERBOARD_CATEGORIES
```

**Step 2.5:** Update export if needed.

**Commit:** `feat: basketball leaderboard categories — PTS/REB/AST/STL/BLK/FG%/3P%/FT%`

---

## PHASE 3: GameDetailModal — Period Breakdown (P1)

### File: `src/components/games/GameDetailModal.jsx`

**Current state:** Headline score already works for basketball via fallback. Quarter breakdown is completely missing.

**Step 3.1:** Read file. Find score display (~lines 152-169) and "Set-by-Set Breakdown" (~lines 231-257).

**Step 3.2:** Add `sport` prop to component signature.

**Step 3.3:** After the existing set-by-set block, add period breakdown:

```jsx
{game.period_scores && game.period_scores.length > 0 && (
  <div>
    <h3 className={`font-semibold ${tc.text} mb-3`}>
      {game.scoring_format === 'four_quarters' ? 'Quarter-by-quarter' :
       game.scoring_format === 'two_halves' ? 'Half-by-half' : 'Period breakdown'}
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {game.period_scores.map((period, idx) => {
        if (!period || (period.our === 0 && period.their === 0)) return null
        const weWon = period.our > period.their
        const periodLabel = game.scoring_format === 'four_quarters' ? `Q${idx + 1}` :
                           game.scoring_format === 'two_halves' ? `H${idx + 1}` : `P${idx + 1}`
        return (
          <div key={idx} className={`p-4 rounded-xl border ${
            weWon ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className="text-xs font-semibold text-slate-500 mb-1">{periodLabel}</p>
            <p className={`text-lg font-bold ${weWon ? 'text-emerald-600' : 'text-red-500'}`}>
              {period.our} - {period.their}
            </p>
          </div>
        )
      })}
    </div>
  </div>
)}
```

**Step 3.4:** Wire sport prop at call site.

### File: `src/pages/gameprep/GamePrepPage.jsx` (~line 568)
Add `sport={sport}` to GameDetailModal render. The `sport` variable is already in scope (line 51).

**Commit:** `feat: GameDetailModal period-by-period breakdown for basketball`

---

## PHASE 4: GameDayCommandCenter — Gate + Column Bug Fix (P1)

### File: `src/pages/gameprep/GameDayCommandCenter.jsx`

**Step 4.1:** Read file. Find save query (~line 188 area) with wrong column names.

**Step 4.2:** Fix column names everywhere in the file:
- `their_score` → `opponent_score`
- `status` → `game_status`

**Step 4.3:** Wire sport prop at call site.

### File: `src/pages/gameprep/GamePrepPage.jsx` (~line 581)
Add `sport={sport}` to GameDayCommandCenter render.

**Step 4.4:** Add sport prop to GameDayCommandCenter signature. Gate non-volleyball sports:

```jsx
if (sport && sport.toLowerCase() !== 'volleyball') {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <span className="text-5xl mb-4">🏀</span>
      <h2 className="text-xl font-bold mb-2">Live scoring coming soon for {sport}</h2>
      <p className="text-slate-500">Use Game Prep to enter final scores for {sport} games.</p>
      <button onClick={onClose} className="mt-6 px-6 py-2 bg-lynx-navy-subtle text-white rounded-xl font-semibold">
        Back to Game Prep
      </button>
    </div>
  )
}
```

**Commit:** `fix: gate GameDayCommandCenter for non-volleyball + fix column names`

---

## PHASE 5: Volleyball Fallback Cleanup (P2)

Replace user-facing `'volleyball'` fallbacks with generic defaults. DO NOT change config map fallbacks.

| File | Line | Current | Change To |
|------|------|---------|-----------|
| ParentDashboard.jsx | 84 | `{ name: 'Volleyball', icon: '🏐' }` | `{ name: 'Sport', icon: '🏆' }` |
| CoachDashboard.jsx | 898 | `|| 'volleyball'` | `|| ''` |
| PlayerProfilePage.jsx | 40 | `useState('volleyball')` | `useState('')` |
| PlayerProfilePage.jsx | 116 | `|| 'volleyball'` | `|| ''` |
| ParentPlayerCardPage.jsx | 213, 231, 257 | `|| 'volleyball'` | `|| ''` then verify getSportDisplay handles empty |
| PlayerProfileInfoTab.jsx | 39 | `|| SPORT_POSITIONS.volleyball` | `|| []` |
| GamePrepPage.jsx | 51 | `|| 'volleyball'` | `|| ''` |
| TeamWallLeftSidebar.jsx | 103 | volleyball images hardcoded | Sport-conditional with null fallback for non-volleyball |
| TeamWallPage.jsx | ~895, ~816 | `|| 'volleyball'` | `|| ''` |
| EventDetailModal.jsx | ~573 | `|| 'volleyball'` | `|| ''` |

**DO NOT change:** `SPORT_CONFIGS[sport] || SPORT_CONFIGS.volleyball` in AdvancedLineupBuilder.jsx and GameComponents.jsx — these are internal config lookups.

**Commit:** `fix: replace volleyball-specific display fallbacks with generic defaults`

---

## PHASE 6: Verify & Report

**Step 6.1:** `npm run build 2>&1 | tail -20` — must compile clean.

**Step 6.2:** Write `CC-BASKETBALL-READINESS-REPORT.md` in project root:

```markdown
# Basketball Readiness — Build Report

## Completed
- [list each change]

## Skipped
- Standings score display — already works via fallback
- Config map fallbacks (SPORT_CONFIGS) — internal lookups

## Known Limitations
- Leaderboards show correct category names but may show zeros until basketball game data populates player_season_stats
- GameDayCommandCenter live scoring is volleyball-only — basketball shows "coming soon"
- No basketball event images for TeamWall

## Issues Found During Build
- [any issues]
```

**Commit:** `chore: basketball readiness report`
