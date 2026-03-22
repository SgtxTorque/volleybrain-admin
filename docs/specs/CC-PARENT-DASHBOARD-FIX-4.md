# CC-PARENT-DASHBOARD-FIX-4.md
## Parent Dashboard — Critical Fix Pass #4

**File:** `src/pages/roles/ParentDashboard.jsx`

---

## CRITICAL CONTEXT FROM CONSOLE LOGS

The browser console reveals the root causes. Here are the actual errors:

```
player_season_stats?select=*&player_id=...&season_id=... → 406 (Not Acceptable)
player_season_stats → repeats 8+ times (INFINITE RETRY LOOP)
player_badges?select=*&player_id=... → 400 (Bad Request)
waivers?select=...&is_active=eq.true → 400 (Bad Request)
event_rsvps?select=...&user_id=... → 400 (Bad Request)
team_standings?select=*&team_id=...&season_id=... → 406 (Not Acceptable)
user_dashboard_layouts → 404 (table doesn't exist)
games?select=...&status=eq.completed → 404 (table doesn't exist)
```

The 406 errors on `player_season_stats` are repeating **endlessly** — this is the re-render/flicker loop. A 406 means the table exists but the query format is wrong (likely the table schema doesn't match the `select=*` or the columns being requested).

---

## FIX 1 (CRITICAL): STOP THE INFINITE RETRY LOOP

Find every Supabase query in ParentDashboard.jsx that fetches data. For ANY query that can fail (especially `player_season_stats`, `team_standings`, `player_badges`, `waivers`, `event_rsvps`), **add error handling that does NOT trigger a re-fetch or state change that causes a re-render loop.**

**Pattern to find and fix:**

```jsx
// BAD — error causes state change, which triggers useEffect, which re-fetches, which errors again
useEffect(() => {
  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('player_season_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('season_id', seasonId);
    
    if (error) {
      console.error(error);
      // If this sets any state that's in the useEffect dependency array → INFINITE LOOP
      setStats(null); // ← This might trigger re-render → re-fetch → loop
    } else {
      setStats(data);
    }
  };
  fetchStats();
}, [playerId, seasonId]); // ← If playerId/seasonId change on error, LOOP
```

```jsx
// GOOD — graceful error handling, no loop
useEffect(() => {
  let cancelled = false;
  
  const fetchStats = async () => {
    if (!playerId || !seasonId) return; // Guard: don't fetch without valid IDs
    
    try {
      const { data, error } = await supabase
        .from('player_season_stats')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', seasonId);
      
      if (cancelled) return;
      
      if (error) {
        console.warn('player_season_stats query failed:', error.message);
        // Set empty/default state, do NOT retry
        if (!cancelled) setStats([]); 
      } else {
        if (!cancelled) setStats(data || []);
      }
    } catch (err) {
      console.warn('player_season_stats fetch error:', err);
      if (!cancelled) setStats([]);
    }
  };
  
  fetchStats();
  return () => { cancelled = true; };
}, [playerId, seasonId]); // Stable deps only
```

**Apply this pattern to ALL Supabase queries in the component:**

1. **`player_season_stats`** — the main offender (406 loop). Add null guards and graceful fallback.
2. **`team_standings`** — also 406 looping. Same fix.
3. **`player_badges`** — 400 error. Add error handling, fallback to empty array.
4. **`waivers`** — 400 error. The `is_active` column may not exist. Wrap in try/catch, fallback gracefully.
5. **`event_rsvps`** — 400 error. Same treatment.
6. **`user_dashboard_layouts`** — 404 (table doesn't exist). This query should not be in the Parent Dashboard at all — it's an admin feature. Remove it entirely or guard it behind a role check.
7. **`games`** — 404 (table doesn't exist). Remove or guard behind check.

**KEY RULES for all queries:**
- Always add `if (!requiredId) return;` guard before fetching
- Always use the `cancelled` flag pattern with cleanup
- On error: `console.warn` + set empty/default state. NEVER retry automatically.
- NEVER put the result state variable in the useEffect dependency array
- Make sure no error handler sets state that causes the same effect to re-fire

---

## FIX 2: HERO PLAYER CARD DISAPPEARS AND NEVER COMES BACK

The hero card vanished when moving to the 4K TV and didn't return on the regular monitor. This is likely caused by:

**Cause A: A responsive breakpoint class hides it permanently**
- Check for classes like `hidden lg:block` or `@media` queries that might hide the hero card at certain widths
- If the card uses a ref or measurement-based rendering (like checking `window.innerWidth`), the resize event may have set a state that permanently hides it

**Cause B: A state variable got set to null/undefined during the resize and never recovered**
- If the hero card renders conditionally like `{selectedPlayerTeam && <HeroCard />}`, and `selectedPlayerTeam` got cleared during re-mount, it won't come back
- The re-render loop (Fix 1) may have cleared this state during the screen change

**Fix:**
- Make the hero card render unconditionally — show a loading/placeholder state instead of rendering nothing
- If `selectedPlayerTeam` is null, show a skeleton card or "Select a player" message, NOT nothing

```jsx
{/* ALWAYS render the hero card container */}
<div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
  {selectedPlayerTeam ? (
    <HeroPlayerCard playerTeam={selectedPlayerTeam} />
  ) : players.length > 0 ? (
    <div className="flex items-center justify-center h-[420px] text-slate-400">
      Loading player...
    </div>
  ) : (
    <div className="flex items-center justify-center h-[420px] text-slate-400">
      No players registered yet
    </div>
  )}
</div>
```

- Also ensure the initialization of `selectedPlayerTeam` is robust:

```jsx
// Initialize selectedPlayerTeam ONCE when players data loads
useEffect(() => {
  if (players.length > 0 && !selectedPlayerTeam) {
    setSelectedPlayerTeam(players[0]);
  }
}, [players]); // Do NOT include selectedPlayerTeam in deps
```

---

## FIX 3: HERO CARD STILL TOO SHORT / PHOTO CROPPED

The hero card is STILL not tall enough. The player photo is cropped.

**Explicit height requirements:**
- The hero card outer container: `min-h-[420px]` 
- The photo section (left side): `h-full` relative to the card, using `object-cover object-top` on the `<img>`
- The photo container should be `w-[280px]` or about 30% of the card width, and span the FULL height
- Use `aspect-[3/4]` or explicit height on the photo container if needed

```jsx
<div className="flex bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[420px]">
  {/* Photo section — full height, fixed width */}
  <div className="w-[280px] shrink-0 relative">
    <img 
      src={playerPhoto} 
      alt={playerName}
      className="absolute inset-0 w-full h-full object-cover object-top"
    />
    {/* Player name overlay at bottom */}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
      <div className="text-white font-bold text-lg">{playerName}</div>
      <div className="text-white/80 text-sm">{jerseyNumber}</div>
      <span className="inline-block mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
        ● Active
      </span>
    </div>
  </div>
  
  {/* Info section — stacks vertically */}
  <div className="flex-1 p-6 flex flex-col gap-4">
    {/* Team info + status badges */}
    {/* Quick action icons with labels */}
    {/* What's Next */}
    {/* Gallery placeholder */}
    {/* Showcased Badge placeholder */}
  </div>
</div>
```

The key is `absolute inset-0 w-full h-full object-cover` on the image inside a relatively positioned container. This ensures the photo fills the entire left column of the card without cropping awkwardly.

---

## FIX 4: REMOVE QUERIES FOR NON-EXISTENT TABLES

These tables don't exist and are generating 404 errors:
- `user_dashboard_layouts` — REMOVE this query entirely from ParentDashboard (it's for the admin dashboard customization feature)
- `games` — REMOVE or replace with the correct table name. Check DATABASE_SCHEMA.md for the actual games/matches table name.

Search the entire ParentDashboard.jsx for these table names and either remove the queries or wrap them in a check:

```jsx
// If you must keep the query for future use:
const { data, error } = await supabase.from('games').select('...');
if (error) {
  // Table doesn't exist yet, silently skip
  console.debug('games table not available:', error.message);
  return;
}
```

---

## IMPLEMENTATION ORDER

1. **Fix the infinite retry loop** (Fix 1) — this is causing ALL the visual problems
2. **Fix hero card disappearing** (Fix 2) — make it always render something
3. **Fix hero card height** (Fix 3) — proper photo layout
4. **Remove bad queries** (Fix 4) — clean up 404 errors

---

## VERIFICATION CHECKLIST

After fixes:
- [ ] Open browser Console — NO rapidly repeating error messages
- [ ] The 406 errors for `player_season_stats` appear at most ONCE (not looping)
- [ ] Page is completely stable — no flickering or twitching
- [ ] Hero player card is visible with full photo (~420px tall)
- [ ] Resize browser window to various sizes — hero card stays visible
- [ ] Move between monitors — hero card persists
- [ ] All sections show content or graceful empty states (not blank/broken)
- [ ] No 404 errors for `user_dashboard_layouts` or `games`
