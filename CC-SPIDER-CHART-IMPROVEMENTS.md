# CC-SPIDER-CHART-IMPROVEMENTS.md
# Spider Chart Visual Improvements + Game Performance Chart
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Improve the spider chart on the Player Card Development tab: better color contrast between first and latest evaluations, redesigned legend, larger chart size, and add a second spider chart showing last game performance. Focused scope — only spider chart changes.

---

## GUARDRAILS

- **Read before modify.** Open `SpiderChart.jsx` and `ParentPlayerCardPage.jsx` before changing anything.
- **Do not change the SpiderChart component API.** Only add new optional props. Existing callers must continue to work unchanged.
- **Do not change data loading queries.** All data is already loaded (`evalHistory`, `recentGames`, `skills`).
- **Do not change any other tab content.** Only the Development tab's Skill Progression section changes.
- **Build check after each phase.** `npm run build 2>&1 | tail -20`
- **Write report to:** `CC-SPIDER-CHART-IMPROVEMENTS-REPORT.md` in the project root.
- **Commit after each phase.**

---

## PHASE 1: SpiderChart Component — Color & Contrast Improvements

### File: `src/components/charts/SpiderChart.jsx`

**Step 1.1:** Read the full component. Currently:
- Primary data: `color` prop (default `#4BB9EC` sky blue), fill opacity `25` (hex suffix = ~15% opacity), stroke `2.5px`
- Compare data: `compareColor` prop (default `#94A3B8` slate gray), fill opacity `15` (hex suffix = ~8% opacity), stroke `2px`, dashed `4,4`

**Step 1.2:** Improve the compare data rendering. The dashed gray line is nearly invisible. Change:

- Compare fill opacity from `15` to `30` (hex suffix) — more visible fill
- Compare stroke from dashed `4,4` to solid — dashed is too subtle at this size
- Compare stroke width from `2` to `2.5` — match primary weight
- Add data point circles to compare data (currently only primary has circles)

Add the compare data points after the compare polygon:
```jsx
{compareData && compareData.length === data.length && (
  <>
    <polygon ... /> {/* existing */}
    {compareData.map((d, i) => {
      const pt = getPoint(i, d.value)
      return (
        <circle key={`c-${i}`} cx={pt.x} cy={pt.y} r="3"
          fill={compareColor} stroke="white" strokeWidth="1.5" />
      )
    })}
  </>
)}
```

**Step 1.3:** Increase primary fill opacity from `25` to `35` (hex suffix) so the two layers are both visible but distinguishable.

**Step 1.4:** Add a new optional prop `compareStrokeDash` with default `undefined` (solid). This preserves backward compatibility — existing callers that don't pass this prop get solid strokes (the new default). Any caller that wants dashed can explicitly pass `compareStrokeDash="4,4"`.

Update the compare polygon to use it:
```jsx
strokeDasharray={compareStrokeDash || undefined}
```

**Step 1.5:** Increase label font size from `text-[11px]` to `text-[12px]` for better readability on larger charts.

**Step 1.6:** Build check.

**Commit:** `polish: SpiderChart contrast improvements — visible compare layer, data points, stronger fills`

---

## PHASE 2: Development Tab — Chart Sizing & Color Treatment

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

Find the `DevelopmentTab` function (~line 811).

**Step 2.1:** Change the SpiderChart call for the evaluation comparison. Currently:
```jsx
<SpiderChart data={latestData} compareData={earliestData...} maxValue={10} size={280} color="#4BB9EC" compareColor="#94A3B8" isDark={false} />
```

Change to:
```jsx
<SpiderChart data={latestData} compareData={earliestData...} maxValue={10} size={380} color="#4BB9EC" compareColor="#F59E0B" isDark={false} />
```

Changes:
- `size` from `280` to `380` — larger chart to fill space and accommodate 9 dimensions
- `compareColor` from `#94A3B8` (invisible gray) to `#F59E0B` (amber/gold) — "foundation" color that pops against the blue "latest"

This gives a clear visual story: **gold = where you started, blue = where you are now.**

**Step 2.2:** Also update the single-evaluation case (when only 1 eval exists, ~line 854). Increase its size from `260` to `340`.

**Step 2.3:** Build check.

**Commit:** `polish: evaluation spider chart — larger size, amber baseline vs blue latest`

---

## PHASE 3: Legend Redesign

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

Find the legend rendering in DevelopmentTab (~lines 847-850). Currently:
```jsx
<div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#4BB9EC] rounded inline-block" /> Latest (...)</span>
  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-400 rounded inline-block" /> First (...)</span>
</div>
```

**Step 3.1:** Replace with pill-style legend badges:

```jsx
<div className="flex items-center justify-center gap-3 mt-4">
  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4BB9EC]/10 border border-[#4BB9EC]/30">
    <span className="w-2.5 h-2.5 rounded-full bg-[#4BB9EC]" />
    <span className="text-xs font-semibold text-[#4BB9EC]">
      Latest: {new Date(latest.evaluation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
    </span>
  </span>
  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30">
    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
    <span className="text-xs font-semibold text-[#F59E0B]">
      Baseline: {new Date(earliest.evaluation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
    </span>
  </span>
</div>
```

Colored pills with a dot, clear label, and date. Impossible to miss.

**Step 3.2:** Build check.

**Commit:** `polish: spider chart legend — pill badges with color dots instead of tiny lines`

---

## PHASE 4: Last Game Performance Spider Chart

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

**Step 4.1:** The DevelopmentTab currently receives `sc`, `skills`, `getSkillValue`, `evalHistory`, `coachFeedback`, `playerGoals`. It needs game data too.

Find where DevelopmentTab is called (~line 555):
```jsx
{activeTab === 'development' && <DevelopmentTab sc={sc} skills={skills} getSkillValue={getSkillValue} evalHistory={evalHistory} coachFeedback={coachFeedback} playerGoals={playerGoals} />}
```

Add `transformedGames` and `seasonStats` props:
```jsx
{activeTab === 'development' && <DevelopmentTab sc={sc} skills={skills} getSkillValue={getSkillValue} evalHistory={evalHistory} coachFeedback={coachFeedback} playerGoals={playerGoals} transformedGames={transformedGames} seasonStats={seasonStats} />}
```

**Step 4.2:** Update the DevelopmentTab function signature to accept these new props.

**Step 4.3:** Build a "Last Game Performance" spider chart. The idea: take the most recent game's stat line and normalize it against the season averages to create a 0-10 scale spider chart showing how that game compared to the player's typical output.

The mapping from game stats to spider dimensions depends on the sport. For volleyball, each of the `sc.primaryStats` (kills, digs, aces, blocks, assists) becomes a dimension. For each stat:
- Season average = baseline (maps to 5.0 on the chart)
- The game's value as a ratio of the season average, clamped to 0-10

```javascript
const lastGame = transformedGames[0]
if (lastGame && seasonStats) {
  const gameSpiderData = sc.primaryStats.map(stat => {
    const gameVal = stat.calc ? stat.calc(lastGame.raw) : (lastGame.raw[stat.key] || 0)
    const seasonTotal = stat.calc ? stat.calc(seasonStats) : (seasonStats[stat.key] || 0)
    const gp = seasonStats.games_played || 1
    const seasonAvg = seasonTotal / gp
    // Normalize: season average = 5, scale proportionally, clamp 0-10
    const normalized = seasonAvg > 0 ? Math.min(10, Math.max(0, (gameVal / seasonAvg) * 5)) : (gameVal > 0 ? 7 : 0)
    return { label: stat.short || stat.label, value: normalized }
  })
}
```

**Step 4.4:** Render the game performance spider chart in a new section below the Skill Progression section (or beside it if there's room). Use a different color — green (`#10B981`) to distinguish from the eval charts (blue/gold):

```jsx
{lastGame && gameSpiderData.length >= 3 && (
  <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Last game performance</h4>
      <span className="text-xs font-semibold text-slate-500">
        vs {lastGame.opponent} · {lastGame.result} {lastGame.score}
      </span>
    </div>
    <div className="flex flex-col items-center">
      <SpiderChart data={gameSpiderData} maxValue={10} size={320} color="#10B981" isDark={false} />
      <div className="flex items-center justify-center gap-3 mt-4">
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span className="text-xs font-semibold text-[#10B981]">Game output</span>
        </span>
        <span className="text-xs text-slate-400">5.0 = season average</span>
      </div>
    </div>
  </div>
)}
```

The legend explains: center of chart (5.0) = season average. Above center = above average game. Below center = below average game. A player who got 12 kills in a game where their season average is 8 kills/game would show the kills dimension at ~7.5 (above the midline).

**Step 4.5:** If no games have been played (`transformedGames.length === 0`), don't render this section at all. No empty state needed — the section just doesn't appear.

**Step 4.6:** Build check.

**Commit:** `feat: last game performance spider chart on Development tab`

---

## PHASE 5: Layout Adjustment — Side by Side

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

If the Development tab right column is wide enough (~800px+), place the two spider charts side by side instead of stacked:

**Step 5.1:** Wrap the Skill Progression card and Last Game Performance card in a grid:

```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
  {/* Skill Progression (eval comparison) */}
  <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
    ...existing skill progression content...
  </div>
  
  {/* Last Game Performance */}
  {lastGame && gameSpiderData.length >= 3 && (
    <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
      ...game performance chart...
    </div>
  )}
</div>
```

If there's no game data, the skill progression card spans full width naturally via CSS grid.

**Step 5.2:** Adjust chart sizes for side-by-side: both at `size={320}` when in 2-column, or `size={380}` when full width (single column). Use a responsive approach or just pick 320 which works in both layouts.

**Step 5.3:** Build check.

**Commit:** `layout: side-by-side spider charts on Development tab`

---

## PHASE 6: Verify & Report

**Step 6.1:** `npm run build 2>&1 | tail -20`

**Step 6.2:** Verify visually:
- Evaluation spider chart: blue (latest) vs gold (baseline) clearly distinguishable
- Both layers have visible fills and data point circles
- Legend is pill-style, easy to read, colors match chart
- Chart is larger and labels are readable (especially with 9 dimensions)
- Last game spider chart appears in green with "vs [Opponent]" header
- Side-by-side layout works without overflow
- Page with no evals shows appropriate empty state (no crash)
- Page with no games shows only the eval chart (no crash)
- Page with 1 eval shows single chart with "comparison shows after next evaluation" note

**Step 6.3:** Write `CC-SPIDER-CHART-IMPROVEMENTS-REPORT.md`

**Commit:** `chore: spider chart improvements report`

---

## FILES MODIFIED

| Phase | File | What Changes |
|-------|------|-------------|
| 1 | `src/components/charts/SpiderChart.jsx` | Stronger fills, compare data points, optional dash prop, larger labels |
| 2 | `src/pages/parent/ParentPlayerCardPage.jsx` | Chart size 280→380, amber compareColor |
| 3 | `src/pages/parent/ParentPlayerCardPage.jsx` | Pill legend replaces line legend |
| 4-5 | `src/pages/parent/ParentPlayerCardPage.jsx` | Game performance spider chart, side-by-side layout |

---

## WHAT THIS SPEC DOES NOT DO

- Does not change data loading or queries
- Does not change other tabs (Overview, Stats, Badges, Games)
- Does not change the left column identity card
- Does not change Coach Intelligence, Strategic Objectives, or Career Milestones sections
- Does not change the SpiderChart API for existing callers (only adds optional props)
