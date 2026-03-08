# CC-EVAL-FIX-V2.md
## Fix: Evaluation Flow Not Showing Players After "Start Evaluation"

**Read the ENTIRE `src/pages/roster/RosterManagerPage.jsx` before making changes.**

---

## THE PROBLEM

The Overview tab shows 12 players correctly. The Evaluate setup screen shows "All roster (12)". But clicking "Start Evaluation →" does NOT transition to the rating view — the setup screen stays visible. The console shows multiple 400 errors from Supabase.

---

## ROOT CAUSE ANALYSIS

There are likely multiple compounding issues:

1. **`loadPreviousEval` uses `.single()` which returns a 406/400 error when 0 rows exist.** For players with no previous evaluations (which is ALL 12 since they've never been evaluated), this throws. The try/catch catches it, but the repeated Supabase error responses flood the console.

2. **The IIFE rendering pattern `{condition && (() => { ... })()}` can fail silently.** If any JS error occurs inside the IIFE during the render cycle, React may not render the section but also may not show a clear error.

3. **Possible: `startEvaluation()` encounters a JS error** during `flattenRosterPlayer` map or during state setting that prevents the state transition from completing.

---

## FIX 1: Change `loadPreviousEval` to use `.maybeSingle()`

`.single()` throws an error when 0 or 2+ rows match. `.maybeSingle()` returns `null` when 0 rows match without throwing. Since most players won't have previous evaluations, this is critical.

```jsx
// FIND this function (around line 387):
async function loadPreviousEval(playerId) {
    try {
      const { data } = await supabase
        .from('player_evaluations')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', selectedSeason?.id)
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .single()    // <-- THIS IS THE PROBLEM
      setEvalPrevious(data || null)
    } catch {
      setEvalPrevious(null)
    }
  }

// REPLACE WITH:
async function loadPreviousEval(playerId) {
    if (!playerId || !selectedSeason?.id) {
      setEvalPrevious(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('player_evaluations')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', selectedSeason.id)
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .maybeSingle()    // <-- Returns null instead of throwing when 0 rows
      
      if (error) {
        console.warn('loadPreviousEval query error:', error)
        setEvalPrevious(null)
      } else {
        setEvalPrevious(data)  // null if no rows, object if found
      }
    } catch (err) {
      console.warn('loadPreviousEval error:', err)
      setEvalPrevious(null)
    }
  }
```

---

## FIX 2: Add safety + debugging to `startEvaluation()`

Wrap the entire function in try/catch and add console logging so we can trace failures:

```jsx
// FIND the startEvaluation function and REPLACE with:
function startEvaluation() {
    try {
      console.log('[EVAL] Starting evaluation. Roster length:', roster.length)
      console.log('[EVAL] evalPlayerScope:', evalPlayerScope)
      console.log('[EVAL] selectedIds size:', selectedIds.size)
      
      let source = []
      if (evalPlayerScope === 'all') {
        source = roster
      } else if (evalPlayerScope === 'selected' && selectedIds.size > 0) {
        source = roster.filter(p => selectedIds.has(p.player_id))
      } else if (evalPlayerScope === 'single' && selectedPlayer) {
        source = [selectedPlayer]
      } else {
        source = roster
      }

      console.log('[EVAL] Source players:', source.length)
      
      // Log first player structure for debugging
      if (source.length > 0) {
        const sample = source[0]
        console.log('[EVAL] First player keys:', Object.keys(sample))
        console.log('[EVAL] Has .players:', !!sample.players)
        console.log('[EVAL] Has .player:', !!sample.player)
        console.log('[EVAL] Has .player_id:', !!sample.player_id)
      }

      const players = source
        .filter(tp => {
          const hasId = !!tp.player_id
          const hasPlayerData = !!(tp.players || tp.player)
          if (!hasId || !hasPlayerData) {
            console.warn('[EVAL] Filtered out player:', { player_id: tp.player_id, hasPlayers: !!tp.players, hasPlayer: !!tp.player })
          }
          return hasId && hasPlayerData
        })
        .map(tp => {
          const p = tp.players || tp.player
          return {
            id: tp.player_id,
            player_id: tp.player_id,
            first_name: p?.first_name || 'Unknown',
            last_name: p?.last_name || '',
            photo_url: p?.photo_url || null,
            position: p?.position || tp.positions?.primary_position || null,
            grade: p?.grade || null,
            jersey_number: tp.jersey_number ?? p?.jersey_number ?? null,
            skills: tp.skills,
            evalCount: tp.evalCount || 0,
          }
        })

      console.log('[EVAL] Flattened players:', players.length)
      if (players.length > 0) {
        console.log('[EVAL] First flattened player:', players[0])
      }

      if (players.length === 0) {
        showToast?.('No players found to evaluate', 'error')
        return
      }

      // Set all state in one batch
      setEvalPlayers(players)
      setEvalCurrentIndex(0)
      setEvalRatings({})
      setEvalNotes('')
      setEvalPrevious(null)
      setEvalStep('rating')
      
      console.log('[EVAL] State set to rating mode. Loading previous eval for:', players[0].player_id)
      loadPreviousEval(players[0].player_id)
    } catch (err) {
      console.error('[EVAL] startEvaluation crashed:', err)
      showToast?.('Error starting evaluation: ' + err.message, 'error')
    }
  }
```

---

## FIX 3: Convert IIFE rendering to a safer pattern

The `{condition && (() => { ... })()}` IIFE pattern can fail silently. Convert to a function that's called normally:

```jsx
// FIND this block (around line 968):
{viewMode === 'evaluate' && selectedTeam && evalStep === 'rating' && evalPlayers.length > 0 && (() => {
  const cp = evalPlayers[evalCurrentIndex]
  if (!cp) return null
  // ... rest of IIFE
  return (
    <div className={...}>
      {/* ... evaluation UI ... */}
    </div>
  )
})()}

// REPLACE the wrapping with a regular conditional + inline variables:
// Remove the IIFE wrapper. Instead, compute variables OUTSIDE the JSX return
// and render the eval card with a normal conditional.
```

**Specifically**, extract the evaluation card into its own section. Near the top of the component (after all the state declarations and functions), add:

```jsx
// Computed values for evaluation rendering
const evalCurrentPlayer = evalStep === 'rating' && evalPlayers.length > 0 ? evalPlayers[evalCurrentIndex] : null
const evalPrevSkills = evalPrevious?.skills 
  ? (typeof evalPrevious.skills === 'string' ? (() => { try { return JSON.parse(evalPrevious.skills) } catch { return null } })() : evalPrevious.skills)
  : null
const evalRated = Object.values(evalRatings).filter(v => v > 0)
const evalOverall = evalRated.length > 0 ? (evalRated.reduce((s, v) => s + v, 0) / evalRated.length).toFixed(1) : '—'
```

Then in the JSX, replace the IIFE with:

```jsx
{/* ═══ EVALUATION RATING CARD ═══ */}
{viewMode === 'evaluate' && selectedTeam && evalStep === 'rating' && evalCurrentPlayer && (
  <div className={`${cardBg} border rounded-xl p-6`}>
    {/* Nav bar */}
    <div className="flex items-center justify-between mb-5">
      <button onClick={() => { setEvalStep('setup') }}
        className={`flex items-center gap-1 text-sm font-semibold ${isDark ? 'text-slate-400 hover:text-white' : 'text-lynx-slate hover:text-lynx-navy'} transition`}>
        <ChevronLeft className="w-4 h-4" /> Back to Setup
      </button>
      <span className={`text-sm font-semibold ${secondaryText}`}>
        Player {evalCurrentIndex + 1} of {evalPlayers.length}
      </span>
      <button onClick={handleSkipPlayer}
        className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-lynx-slate hover:bg-lynx-cloud'} transition`}>
        Skip
      </button>
    </div>

    {/* Player Info */}
    <div className="flex items-center gap-4 mb-5">
      {evalCurrentPlayer.photo_url ? (
        <img src={evalCurrentPlayer.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
      ) : (
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-lynx-sky/20 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>
          {evalCurrentPlayer.first_name?.[0]}{evalCurrentPlayer.last_name?.[0]}
        </div>
      )}
      <div>
        <h3 className={`text-lg font-bold ${primaryText}`}>{evalCurrentPlayer.first_name} {evalCurrentPlayer.last_name}</h3>
        <p className={`text-sm ${secondaryText}`}>
          {evalCurrentPlayer.jersey_number ? `#${evalCurrentPlayer.jersey_number}` : ''}
          {evalCurrentPlayer.jersey_number && evalCurrentPlayer.position ? ' · ' : ''}
          {evalCurrentPlayer.position || ''}
          {evalCurrentPlayer.grade ? ` · Grade ${evalCurrentPlayer.grade}` : ''}
        </p>
      </div>
    </div>

    {/* ... keep everything else from the existing evaluation card exactly as-is,
        but replace every instance of `cp.` with `evalCurrentPlayer.`
        and replace `prevSkills` with `evalPrevSkills`
        and replace `rated` with `evalRated`  
        and replace `overall` with `evalOverall` ... */}
  </div>
)}
```

**Make sure to replace ALL references** from the old IIFE variables:
- `cp` → `evalCurrentPlayer`
- `cp.photo_url` → `evalCurrentPlayer.photo_url`
- `cp.first_name` → `evalCurrentPlayer.first_name`
- `cp.last_name` → `evalCurrentPlayer.last_name`
- `jerseyNum` → `evalCurrentPlayer.jersey_number`
- `position` → `evalCurrentPlayer.position`
- `prevSkills` → `evalPrevSkills`
- `rated` → `evalRated`
- `overall` → `evalOverall`

---

## FIX 4: Fix the 400 errors from enrichment queries

In `loadRoster`, the enrichment queries for `player_skill_ratings`, `player_evaluations`, `waiver_signatures`, and `player_positions` should all have error handling that doesn't throw:

For each enrichment query, wrap individually:

```jsx
// For each enrichment query, add error capture:
let skillRatings = {}
if (playerIds.length > 0 && selectedSeason?.id) {
  try {
    const { data: ratings, error: ratErr } = await supabase
      .from('player_skill_ratings')
      .select('*')
      .in('player_id', playerIds)
      .eq('season_id', selectedSeason.id)
      .order('rated_at', { ascending: false })
    if (ratErr) console.warn('skill_ratings query:', ratErr.message)
    for (const r of (ratings || [])) {
      if (!skillRatings[r.player_id]) skillRatings[r.player_id] = r
    }
  } catch (e) { console.warn('skill_ratings error:', e) }
}
```

Do the same for all 4 enrichment query blocks (skill_ratings, evaluations, waivers, positions).

---

## FIX 5: Also fix `saveEvaluation` queries that use `.single()`

Lines ~452 and ~480 use `.single()` to check for existing records. Change to `.maybeSingle()`:

```jsx
// Around line 446-452 - checking existing skill_ratings:
const { data: existing } = await supabase
  .from('player_skill_ratings')
  .select('id')
  .eq('player_id', playerId)
  .eq('team_id', selectedTeam.id)
  .eq('season_id', selectedSeason.id)
  .limit(1)
  .maybeSingle()   // <-- was .single()

// Around line 475-480 - checking existing player_skills:
const { data: existingSkills } = await supabase
  .from('player_skills')
  .select('id')
  .eq('player_id', playerId)
  .eq('season_id', selectedSeason.id)
  .limit(1)
  .maybeSingle()   // <-- was .single()
```

---

## VERIFICATION

After applying all 5 fixes:

1. Open browser console (F12 → Console)
2. Navigate to Roster Manager → Evaluate tab
3. Confirm "All roster (12)" is shown
4. Click "Start Evaluation →"
5. **Check console for `[EVAL]` log messages** — these will show:
   - `[EVAL] Starting evaluation. Roster length: 12`
   - `[EVAL] Source players: 12`
   - `[EVAL] First player keys: [...]`
   - `[EVAL] Flattened players: 12`
   - `[EVAL] State set to rating mode.`
6. Verify the first player's evaluation card appears with photo, name, skill rating circles
7. Verify the console 400 errors are gone (replaced with clean null handling)
8. Rate skills and click "Save & Next" — verify it advances to player 2
9. Share screenshot of console + evaluation card with me

```bash
git add -A && git commit -m "Fix: Eval flow — maybeSingle, remove IIFE, debug logging, error handling" && git push
```

## DO NOT
- DO NOT change loadTeams or loadRoster data fetching logic — those work
- DO NOT change the Overview tab rendering — it works
- DO NOT change Season Setup wizard — it works
- DO NOT change any other files
