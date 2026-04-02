# CC-TEAM-SELECTOR-GLOBAL-FIX.md
# Lynx Web Admin — Team Selector Fix (All Compete Pages)
# EXECUTION SPEC

**Type:** Bugfix  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`

---

## PROBLEM

ALL Compete pages (Game Prep, Lineups, Standings, Leaderboards) only show "TM Test Team" in their team selector. The coach is assigned to 10+ teams across multiple seasons, but only teams from the currently selected season appear. The dashboard correctly shows all teams because it uses a different query pattern.

## ROOT CAUSE

The Compete pages filter teams by `selectedSeason` from `SeasonContext`. The currently selected season only contains "TM Test Team." The other teams (BBall Stingers, Kickers Elite, Black Hornets Elite, etc.) belong to different seasons. The dashboard's team pill bar shows all teams because it queries differently — via the `roleContext` which loads all `team_coaches` assignments without season filtering.

## FIX

### Step 1: Find the team loading in each Compete page

CC must examine the `loadTeams()` function (or equivalent) in each file:
- `src/pages/gameprep/GamePrepPage.jsx`
- `src/pages/lineups/LineupsPage.jsx`
- `src/pages/standings/TeamStandingsPage.jsx`
- `src/pages/leaderboards/SeasonLeaderboardsPage.jsx`

Look for this pattern (the problem):
```javascript
.eq('season_id', selectedSeason.id)
```

### Step 2: Replace with org-wide coach team query on ALL four pages

Remove the season filter from team loading. Load ALL teams the coach is assigned to:

```javascript
async function loadTeams() {
  const { data: coachRecord } = await supabase
    .from('coaches')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  
  if (!coachRecord) {
    // Fallback for admins — load all teams in org
    const orgId = profile?.current_organization_id
    if (!orgId) return
    const { data } = await supabase
      .from('teams')
      .select('id, name, color, season_id, seasons(id, name, sport_id, sports(id, name))')
      .eq('seasons.organization_id', orgId)
      .order('name')
    setTeams(data || [])
    if (data?.length > 0) setSelectedTeam(data[0])
    return
  }
  
  // Load ALL teams this coach is assigned to across ALL seasons
  const { data: assignments } = await supabase
    .from('team_coaches')
    .select(`
      team_id, role,
      teams(id, name, color, season_id, 
        seasons(id, name, sport_id, 
          sports(id, name)
        )
      )
    `)
    .eq('coach_id', coachRecord.id)
  
  const teams = (assignments || [])
    .map(a => ({
      ...a.teams,
      coachRole: a.role,
      sport: a.teams?.seasons?.sports?.name?.toLowerCase() || 'volleyball',
      seasonName: a.teams?.seasons?.name,
    }))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
  
  setTeams(teams)
  if (teams.length > 0 && !selectedTeam) {
    setSelectedTeam(teams[0])
  }
}
```

**KEY CHANGE:** No `.eq('season_id', selectedSeason.id)` filter. The coach sees ALL their teams across all seasons. Period.

### Step 3: Remove the `useEffect` dependency on `selectedSeason` for team loading

On each page, the team loading is likely triggered by `selectedSeason` changing:
```javascript
// PROBLEM: reloads (and filters) teams when season changes
useEffect(() => {
  if (selectedSeason?.id) loadTeams()
}, [selectedSeason])
```

Change this to load teams on mount (or when the user context is available), NOT when season changes:
```javascript
// FIXED: load ALL teams once on mount
useEffect(() => {
  loadTeams()
}, [user])  // or [] if user is always available
```

### Step 4: Add sport emoji to team selector pills

Since teams now span multiple sports, show the sport icon:
```jsx
<button onClick={() => setSelectedTeam(team)}>
  {team.name}
  <span className="ml-1 text-xs opacity-60">
    {team.sport === 'basketball' ? '🏀' :
     team.sport === 'baseball' ? '⚾' :
     team.sport === 'soccer' ? '⚽' :
     team.sport === 'football' ? '🏈' :
     team.sport === 'flag_football' ? '🏳️' :
     team.sport === 'softball' ? '🥎' :
     team.sport === 'hockey' ? '🏒' : '🏐'}
  </span>
</button>
```

### Step 5: Verify events still filter by team_id

When a team is selected, game/event loading should filter by `team_id` (NOT by season). This should already be the case. Verify that `loadGames()` or equivalent uses `.eq('team_id', selectedTeam.id)`.

## VERIFICATION

- [ ] Game Prep → shows ALL 10+ teams in selector
- [ ] Lineups → shows ALL teams
- [ ] Standings → shows ALL teams
- [ ] Leaderboards → shows ALL teams
- [ ] Click "BBall Stingers" → page context updates for that team
- [ ] Click "Black Hornets Elite" → page context updates for that team
- [ ] Sport emoji visible next to team names
- [ ] Dashboard team selector still works as before
- [ ] No regressions on existing volleyball features

**Commit:** `fix(compete): team selector shows all coach teams across all seasons`
