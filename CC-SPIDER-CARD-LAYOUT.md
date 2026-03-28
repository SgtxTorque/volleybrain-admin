# CC-SPIDER-CARD-LAYOUT.md
# Spider Chart Cards — Side-by-Side Content + Action Buttons
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Reshape the two spider chart cards on the Development tab from "centered chart in a wide empty card" to "chart left, companion content right." Add role-gated action buttons. Absorb Career Milestones into the Skill Progression card.

---

## GUARDRAILS

- **Read before modify.** Open `ParentPlayerCardPage.jsx` and understand the current DevelopmentTab structure before changing it.
- **Do not change SpiderChart component.** It was just updated — leave it alone.
- **Do not change data loading or queries.** All data is already available.
- **Do not remove Coach Intelligence or Strategic Objectives sections.** Those stay as-is for now (they'll be addressed in a future layout pass).
- **Role-gate action buttons.** "Evaluate" and "Enter/Edit Stats" only show for coach and admin roles. Parents and players see the cards without buttons.
- **Build check after each phase.**
- **Write report to:** `CC-SPIDER-CARD-LAYOUT-REPORT.md` in the project root.
- **Commit after each phase.**

---

## PHASE 1: Wire activeView to ParentPlayerCardPage

### File: `src/MainApp.jsx`

**Step 1.1:** Find `ParentPlayerCardRoute` (~line 641). It currently receives `roleContext` and `showToast`. Add `activeView`:

```jsx
function ParentPlayerCardRoute({ roleContext, showToast, activeView }) {
  const { playerId } = useParams()
  return <ParentPlayerCardPage playerId={playerId} roleContext={roleContext} showToast={showToast} activeView={activeView} />
}
```

**Step 1.2:** Find where `ParentPlayerCardRoute` is rendered in the routes (~line 694). Pass `activeView`:

```jsx
<ParentPlayerCardRoute roleContext={roleContext} showToast={showToast} activeView={activeView} />
```

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

**Step 1.3:** Update the component signature to accept `activeView`:

```jsx
function ParentPlayerCardPage({ playerId, roleContext, showToast, seasonId: propSeasonId, activeView })
```

**Step 1.4:** Create a helper:
```jsx
const isCoachOrAdmin = activeView === 'coach' || activeView === 'admin'
```

**Step 1.5:** Pass `isCoachOrAdmin` and `onNavigate` (if available, or we may need to wire that too) to the DevelopmentTab. Check if `onNavigate` is passed to the page — if not, we can use `window.location` or `useNavigate` from react-router as a fallback. Check what navigation pattern the rest of the app uses.

**Step 1.6:** Build check.

**Commit:** `wire: pass activeView to ParentPlayerCardPage for role-gated actions`

---

## PHASE 2: Skill Progression Card — Chart Left, Timeline Right

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

Find the DevelopmentTab function. Find the Skill Progression card and the Career Milestones card.

**Step 2.1:** Restructure the Skill Progression card from centered layout to two-column:

```jsx
<div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
  <div className="flex items-center justify-between mb-4">
    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Skill progression</h4>
    {growthPct !== null && <span className={`text-xs font-bold ${growthPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{growthPct >= 0 ? '+' : ''}{growthPct}% Growth</span>}
  </div>
  
  <div className="flex gap-6">
    {/* LEFT — Spider Chart */}
    <div className="flex flex-col items-center flex-shrink-0">
      <SpiderChart ... />
      {/* Pill legend below chart */}
      <div className="flex items-center gap-3 mt-4">
        ...existing pill legends...
      </div>
      {/* Action button — coach/admin only */}
      {isCoachOrAdmin && (
        <button onClick={() => { /* trigger evaluation workflow */ }}
          className="mt-4 px-4 py-2 rounded-lg bg-lynx-navy-subtle text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition">
          Evaluate Player
        </button>
      )}
    </div>
    
    {/* RIGHT — Evaluation Timeline */}
    <div className="flex-1 min-w-0">
      <h5 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">Evaluation history</h5>
      {evalHistory.length > 0 ? (
        <div className="space-y-0">
          {evalHistory.slice(-6).reverse().map((ev, i) => (
            <div key={i} className={`flex items-center gap-3 py-2.5 ${i < evalHistory.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-[#4BB9EC]' : 'bg-slate-300'}`} />
              <span className="text-xs text-slate-400 w-24 flex-shrink-0">
                {new Date(ev.evaluation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
                {ev.evaluation_type || 'Eval'}
              </span>
              <span className="text-sm font-bold text-[#10284C] ml-auto">
                {ev.overall_score}/10
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 py-4">No evaluations recorded yet</p>
      )}
    </div>
  </div>
</div>
```

**Step 2.2:** Remove the standalone Career Milestones card from the DevelopmentTab. Its content is now inside the Skill Progression card. Search for the "Career Milestones" or "CAREER MILESTONES" heading and remove that entire card block.

**Step 2.3:** For the "Evaluate Player" button click handler:
- Check if there's an existing evaluation workflow/modal in the codebase. Search for `CreateEvaluationModal`, `EvaluationModal`, `PlayerEvaluation`, or similar.
- If a modal exists: import it and toggle its visibility on button click
- If no modal exists: navigate to the player's evaluation page if one exists, OR show a toast "Evaluation workflow coming soon" as a placeholder. Do NOT build a new modal from scratch in this spec.

**Step 2.4:** Build check.

**Commit:** `layout: Skill Progression card — chart left, eval timeline right, evaluate button`

---

## PHASE 3: Last Game Performance Card — Chart Left, Stats Table Right

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

Find the Last Game Performance card in DevelopmentTab.

**Step 3.1:** Restructure from centered to two-column:

```jsx
{lastGame && gameSpiderData && gameSpiderData.length >= 3 && (
  <div className="bg-white rounded-xl border border-[#E8ECF2] p-5">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Last game performance</h4>
      <span className="text-xs font-semibold text-slate-500">
        vs {lastGame.opponent} · {lastGame.result} {lastGame.score}
      </span>
    </div>
    
    <div className="flex gap-6">
      {/* LEFT — Spider Chart */}
      <div className="flex flex-col items-center flex-shrink-0">
        <SpiderChart data={gameSpiderData} maxValue={10} size={320} color="#10B981" isDark={false} />
        <div className="flex items-center gap-3 mt-4">
          ...existing game output legend pill...
        </div>
      </div>
      
      {/* RIGHT — Game Stat Table */}
      <div className="flex-1 min-w-0">
        <div className="mb-3">
          <p className="text-sm font-bold text-[#10284C]">{lastGame.opponent}</p>
          <p className="text-xs text-slate-400">
            {lastGame.date ? new Date(lastGame.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
            {' · '}{lastGame.result === 'W' ? 'Win' : 'Loss'} {lastGame.score}
          </p>
        </div>
        
        <div className="space-y-0">
          {sc.primaryStats.map((stat, i) => {
            const gameVal = stat.calc ? stat.calc(lastGame.raw) : (lastGame.raw[stat.key] || 0)
            const seasonAvg = gamesPlayed > 0 ? ((stat.calc ? stat.calc(seasonStats) : (seasonStats?.[stat.key] || 0)) / gamesPlayed) : 0
            const diff = gameVal - seasonAvg
            return (
              <div key={stat.key} className={`flex items-center justify-between py-2.5 ${i < sc.primaryStats.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <span className="text-sm text-slate-500">{stat.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#10284C]">{gameVal}</span>
                  {seasonAvg > 0 && (
                    <span className={`text-xs font-semibold ${diff >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)} vs avg
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Action button — coach/admin only */}
        {isCoachOrAdmin && (
          <button onClick={() => { /* navigate to game stat entry for this game */ }}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-lynx-navy-subtle text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 transition text-center">
            Enter / Edit Stats
          </button>
        )}
      </div>
    </div>
  </div>
)}
```

**Step 3.2:** The stat table shows each primary stat (from `sc.primaryStats`) with:
- Stat label (left)
- Game value (right, bold)
- Difference from season average ("+2.1 vs avg" in green, or "-1.3 vs avg" in red)

This needs `seasonStats` and `gamesPlayed` to be available in the DevelopmentTab. Check if they're already passed as props. If not, add them to the DevelopmentTab call (~line 555) and the function signature.

**Step 3.3:** For the "Enter / Edit Stats" button click handler:
- This should ideally navigate to the game detail or stat entry view for that specific game
- Check if there's a route that takes a game/event ID for stat entry
- If a route exists: navigate to it with the event_id from `lastGame.raw.event_id`
- If no route exists: show a toast "Stat entry workflow coming soon" as a placeholder

**Step 3.4:** Build check.

**Commit:** `layout: Last Game card — chart left, stat table right, enter/edit stats button`

---

## PHASE 4: Keep Cards Side-by-Side

The two restructured cards should remain in the `grid grid-cols-1 lg:grid-cols-2 gap-5` layout from the previous spider chart spec. Verify they're still in the grid and both render correctly side by side.

If the cards are too tall side-by-side (because of the added timeline/table content), that's OK — the right column scrolls. But check that neither card overflows horizontally or clips content.

**Step 4.1:** Verify the grid layout. If the cards were stacked during Phase 2-3, re-wrap them in the grid.

**Step 4.2:** Build check.

**Commit:** `layout: verify side-by-side spider chart cards in grid`

---

## PHASE 5: Verify & Report

**Step 5.1:** `npm run build 2>&1 | tail -20`

**Step 5.2:** Verify:
- Skill Progression: spider chart left, eval timeline right, legend pills visible
- Skill Progression: "Evaluate Player" button shows for coach/admin, hidden for parent
- Last Game Performance: spider chart left, stat table right with +/- vs average
- Last Game Performance: "Enter / Edit Stats" button shows for coach/admin, hidden for parent  
- Career Milestones section is gone (absorbed into Skill Progression)
- No data: Skill Progression shows graceful empty state, Last Game card hidden if no games
- Both cards sit side-by-side in the grid without overflow

**Step 5.3:** Write `CC-SPIDER-CARD-LAYOUT-REPORT.md`

**Commit:** `chore: spider card layout report`

---

## FILES MODIFIED

| Phase | File | What Changes |
|-------|------|-------------|
| 1 | `src/MainApp.jsx` | Pass activeView to ParentPlayerCardRoute and page |
| 1-3 | `src/pages/parent/ParentPlayerCardPage.jsx` | Accept activeView, restructure both spider cards, remove Career Milestones, add action buttons |

---

## WHAT THIS SPEC DOES NOT DO

- Does not change SpiderChart component
- Does not change data queries
- Does not build new evaluation or stat entry modals/pages
- Does not change Coach Intelligence or Strategic Objectives sections
- Does not change the Overview, Stats, Badges, or Games tabs
- Does not change the left column identity card
