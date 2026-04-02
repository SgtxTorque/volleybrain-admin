# CC-LINEUP-TEAM-SELECTOR-FIX.md
# Lynx Web Admin — Lineups Page Team Selector + Court Sizing Fix
# EXECUTION SPEC

**Type:** Bugfix  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`

---

## ISSUE 1: Lineups Page Only Shows One Team

**Problem:** The Lineups page team selector only shows "TM Test Team" instead of all teams the coach is assigned to (BBall Stingers, Kickers Elite, 13U, BH Elite, Black Hornets Elite, etc.). The coach is assigned to 10+ teams via `team_coaches` but the page only shows one.

**Root cause:** The team loading query is likely filtering incorrectly — either querying `team_managers` instead of `team_coaches`, or missing the coach ID lookup, or filtering by the wrong season/org.

**Fix in `src/pages/lineups/LineupsPage.jsx`:**

Find the team loading function and replace it with a query that pulls ALL teams where the current user is a coach:

```javascript
async function loadTeams() {
  const { data: coachRecord } = await supabase
    .from('coaches')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  
  if (!coachRecord) return
  
  const { data: assignments } = await supabase
    .from('team_coaches')
    .select('team_id, role, teams(id, name, color, season_id, seasons(id, name, sport_id, sports(id, name)))')
    .eq('coach_id', coachRecord.id)
  
  const teams = assignments
    ?.map(a => ({
      ...a.teams,
      coachRole: a.role,
      sport: a.teams?.seasons?.sports?.name || 'volleyball',
      sportId: a.teams?.seasons?.sport_id,
      seasonName: a.teams?.seasons?.name,
    }))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
  
  setTeams(teams || [])
  if (teams?.length > 0) setSelectedTeam(teams[0])
}
```

This follows the same pattern used by the Game Prep page and the coach dashboard — look up the coach record via `profile_id`, then get all `team_coaches` assignments with team + season + sport joins.

**Also update the team selector UI** to show the sport next to each team name so the coach knows which lineup builder they'll get:

```jsx
{teams.map(team => (
  <button 
    key={team.id}
    onClick={() => setSelectedTeam(team)}
    className={/* active/inactive styling */}
  >
    {team.name}
    <span className="text-xs opacity-60 ml-1">
      {team.sport === 'basketball' ? '🏀' : 
       team.sport === 'baseball' ? '⚾' :
       team.sport === 'softball' ? '🥎' :
       team.sport === 'soccer' ? '⚽' :
       team.sport === 'football' ? '🏈' :
       team.sport === 'flag_football' ? '🏳️' :
       team.sport === 'volleyball' ? '🏐' : ''}
    </span>
  </button>
))}
```

**When `selectedTeam` changes**, the sport prop passed to the lineup builder should come from `selectedTeam.sport`, which feeds into the `SportFieldView` router to render the correct field.

**Verify:** All coach-assigned teams appear in the selector. Clicking each shows the correct sport emoji. Opening the lineup builder for a basketball team shows the basketball court. Opening for a volleyball team shows the volleyball court.

---

## ISSUE 2: All Sport Field Components Are Too Small

**Problem:** The basketball court (and likely all non-volleyball fields) renders far too small. The position slots are tiny and hard to interact with. Needs to be approximately 3x larger.

**Fix:** The issue is likely that each field component has its own SVG `viewBox` or CSS dimensions that are too constrained. All sport field components need to fill their parent container.

**For ALL field components in `src/components/games/lineup-v2/fields/`:**

Each field component (`BasketballCourt.jsx`, `BaseballDiamond.jsx`, `SoccerPitch.jsx`, `FootballField.jsx`) must:

1. Use `width="100%" height="100%"` on its SVG (or `style={{ width: '100%', height: '100%' }}`)
2. Use `preserveAspectRatio="xMidYMid meet"` on the SVG to maintain proportions while filling space
3. The SVG `viewBox` should be set to reasonable dimensions (e.g., `viewBox="0 0 800 600"` for landscape courts) and the SVG should scale up to fill its container
4. Position drop zones within the SVG should be large enough to receive drops and display player cards

**If the fields use CSS/HTML instead of SVG:**
- The container should use `width: 100%; height: 100%;` or `flex: 1`
- Position slots should use percentage-based positioning relative to the container
- Minimum slot size: 120px × 120px for player cards (same as volleyball)

**Specific fix for `BasketballCourt.jsx`:**

Looking at the screenshot, the court is rendering as a fixed-size element floating in the middle. It needs to expand to fill the available court area (the left panel of the split view). 

Find the outermost container div of the basketball court and ensure it has:
```jsx
<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <svg viewBox="0 0 800 600" style={{ width: '100%', maxHeight: '100%' }} preserveAspectRatio="xMidYMid meet">
    {/* court drawing + position slots */}
  </svg>
</div>
```

Or if using CSS-positioned divs:
```jsx
<div className="relative w-full h-full" style={{ minHeight: '500px' }}>
  {/* Court background */}
  <div className="absolute inset-0 rounded-2xl" style={{ background: courtColor }}>
    {/* Court lines as absolute-positioned SVG or borders */}
  </div>
  
  {/* Position slots as absolute-positioned drop targets */}
  <div className="absolute" style={{ top: '10%', left: '40%', width: '20%' }}>
    {/* PG slot */}
  </div>
  {/* ... other positions using percentage-based positioning */}
</div>
```

**Apply the same sizing fix to ALL field components**, not just basketball. Each field should fill its container and the position slots should be large, interactive, and show player cards at the same size as volleyball.

**Verify:** Basketball court fills the left panel area. Position drop zones are large and easy to interact with. Player cards (when dropped) are legible. Same for baseball, soccer, and football fields when tested.

---

## EXECUTION ORDER

1. Issue 1 — Team selector fix (unblocks testing all sports)
2. Issue 2 — Field sizing fix (makes all sports usable)

**Commit:** `fix(lineup-v2): team selector shows all coach teams, sport field sizing 3x larger`
