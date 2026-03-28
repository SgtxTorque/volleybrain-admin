# Coach Context Bleeding — Investigation Report

## 1. Season Context Architecture

**File:** `src/contexts/SeasonContext.jsx`

**`selectedSeason` is GLOBAL** — it is a single piece of state shared across all roles (admin, coach, parent, player). There is no per-role scoping.

- **Stored in localStorage** as `vb_selected_season` (line 61, 89, 99). This means it persists across page reloads AND role switches.
- **On initial load** (line 60-68): Restores from localStorage, falls back to the first `active` season, then first season.
- **When admin picks "Soccer Spring 2026"** (line 85-101): `selectSeason()` is called, which sets state AND writes to localStorage.
- **When the user switches roles:** Nothing resets. `selectedSeason` stays as whatever was last selected.

**`selectedSport` is also GLOBAL** (`src/contexts/SportContext.jsx`):
- Stored in localStorage as `vb_selected_sport` (line 49).
- Same problem — persists across role switches.

**Root cause confirmed:** The season/sport context has no awareness of roles. It's a single global selector designed for the admin view where an admin can pick any season. When a coach inherits this, they get whatever the admin left behind.

---

## 2. Role Switching Flow

**File:** `src/MainApp.jsx`, line 494

The role switch button handler:
```javascript
onClick={() => { setActiveView(view.id); setShowRoleSwitcher(false); navigate('/dashboard'); }}
```

**What happens when "Coach" is clicked:**
1. `setActiveView('coach')` — changes the role view state
2. `setShowRoleSwitcher(false)` — closes the dropdown
3. `navigate('/dashboard')` — navigates to dashboard route

**What does NOT happen:**
- No call to `selectSeason()` — season stays as "Soccer Spring 2026"
- No call to `selectSport()` — sport stays as whatever admin had
- No reset of `selectedSeason` in SeasonContext
- No reset of localStorage `vb_selected_season`
- No derivation of "this coach's default season" from their team assignments

**The CoachDashboard does compute `coachSeasons`** (lines 227-237) — an array of seasons that the coach's teams belong to — but this is never used to reset `selectedSeason`. It's computed but unused for season context correction.

---

## 3. Coach Dashboard Season Scoping

**File:** `src/pages/roles/CoachDashboard.jsx`

There is a **disconnect between the hero card and everything else**:

| Component | Data Source | Result |
|-----------|------------|--------|
| Hero card team name | `selectedTeam?.name` from coach's `coachTeamAssignments` | **Correct** — "Black Hornets Elite" |
| Hero sub-line season | `selectedSeason?.name` from global SeasonContext (line 704) | **Wrong** — shows "Soccer Spring 2026" |
| `topPlayers` query | `eq('season_id', selectedSeason.id)` (line 311) | **Wrong** — queries Soccer season, returns empty |
| `statLeaders` query | `eq('season_id', selectedSeason.id)` (line 392) | **Wrong** — queries Soccer season, returns empty |
| `evalData` query | NO season filter (line 574-578) | **Correct** — returns all evals for roster players |
| Team loading | `coachTeamAssignments` (line 245) | **Correct** — loads coach's actual teams regardless of season |
| Events/schedule | `eq('team_id', team.id)` (line 278) | **Correct** — scoped to team, not season |
| Shoutouts/challenges | `eq('team_id', team.id)` | **Correct** — scoped to team, not season |

**The hero uses `roleContext` for the team name but `selectedSeason` for the season label.** The body tabs' stats queries also use the global `selectedSeason.id`, causing the "no data" issue.

---

## 4. Coach Pages — Data Source per Page

**Every page below uses `useSeason()` to get the global `selectedSeason` and filters data accordingly.**

| Page | File | Uses `useSeason()` | Uses `roleContext` | Season Filter | Impact |
|------|------|-------------------|-------------------|---------------|--------|
| **Roster Manager** | `src/pages/roster/RosterManagerPage.jsx` | Yes (line 22) | Yes — coach team IDs (line 53-78) | `eq('season_id', selectedSeason.id)` on teams query | Shows teams from wrong season; coach's volleyball teams won't appear if Soccer season is selected |
| **Game Prep** | `src/pages/gameprep/GamePrepPage.jsx` | Yes (line 27) | No — loads all teams for season | `eq('season_id', selectedSeason.id)` (line 73-94) | Shows Soccer teams instead of coach's volleyball teams |
| **Standings** | `src/pages/standings/TeamStandingsPage.jsx` | Yes (line 21) | No — loads all teams for season | `eq('season_id', selectedSeason.id)` (line 58-79) | Shows Soccer standings instead of volleyball |
| **Leaderboards** | `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | Yes (line 404) | No — org-wide stats | `eq('season_id', selectedSeason.id)` (line 480-489) | Shows Soccer player stats |
| **Chats** | `src/pages/chats/ChatsPage.jsx` | Yes (line 19) | Yes — coach team channels (line 77-97) | `in('season_id', targetSeasonIds)` (line 130) | Shows chat channels from Soccer season |
| **Blasts** | `src/pages/blasts/BlastsPage.jsx` | Yes (line 19) | Yes — coach team filter | `eq('season_id', selectedSeason.id)` (line 83-108) | Shows blasts from Soccer season |

**All 6 pages will show wrong-season data when the admin's season selection bleeds into the coach view.**

---

## 5. Stats & Evals Missing Data

### "No player stats yet" — Root Cause: Wrong Season Filter

**Query** (CoachDashboard line 310-313):
```javascript
const { data: seasonStats } = await supabase
  .from('player_season_stats')
  .select('player_id, total_kills, total_aces, ...')
  .in('player_id', playerIds)        // ← correct: coach's roster players
  .eq('season_id', selectedSeason.id) // ← WRONG: Soccer Spring 2026 season ID
  .order('total_points', { ascending: false })
  .limit(5)
```

The roster players are from a **volleyball** team. Their stats exist under a **volleyball season ID**. But the query filters by the Soccer season ID → returns empty → "No player stats yet."

**Fix:** Replace `selectedSeason.id` with the selected team's actual `season_id` (available from `selectedTeam.season_id`).

### "No evaluations yet" — Likely Genuinely Empty

**Query** (CoachDashboard lines 574-578):
```javascript
const { data: ratings } = await supabase
  .from('player_skill_ratings')
  .select('player_id, overall_rating, serve, pass, ...')
  .in('player_id', playerIds)
  .order('created_at', { ascending: false })
```

This query has **no season filter** — it pulls all evaluations for roster players across all seasons. If it returns empty, the data genuinely doesn't exist in `player_skill_ratings` for those players.

However, `CoachStatsTab` (a display-only component) checks `evalData.length === 0` to show the "No evaluations yet" message. If evaluations DO exist for these players, this should work fine. **If the user reports seeing "No evaluations yet" despite evaluations existing, the issue is likely that evaluations are stored in a different table or under different player IDs.**

---

## 6. Create Challenge Flow

### The Click Path

1. **User clicks "Create Challenge"** in CoachEngagementTab (or "Challenge" in The Playbook sidebar)
2. **CoachEngagementTab** calls `onCreateChallenge` prop
3. **CoachDashboard passes** (line 786):
   ```javascript
   onCreateChallenge={() => onNavigate?.('teams')}
   ```
4. **`onNavigate('teams')`** resolves to `navigate('/teams')` via `getPathForPage('teams')` → returns `'/teams'`
5. **Route `/teams`** (MainApp.jsx line 705):
   ```javascript
   <Route path="/teams" element={
     <RouteGuard allow={['admin']} activeView={activeView}>
       <TeamsPage ... />
     </RouteGuard>
   } />
   ```
6. **RouteGuard** checks: `allow=['admin']`, `activeView='coach'` → **NOT allowed**
7. **RouteGuard redirects** to `/dashboard` (RouteGuard.jsx line 20):
   ```javascript
   return <Navigate to="/dashboard" replace />
   ```
8. **User sees the coach dashboard reload** — appears as if the button "does nothing"

### Why It Happens
- `onCreateChallenge` navigates to `'teams'` which maps to `/teams`
- The `/teams` route is **admin-only** — coaches are blocked by `RouteGuard`
- The redirect sends coaches back to `/dashboard` (their CoachDashboard)

### The Fix
- `CreateChallengeModal` **already exists** at `src/components/engagement/CreateChallengeModal.jsx` (280 lines, fully functional)
- It is **NOT imported** in CoachDashboard.jsx
- It is **NOT imported anywhere** in the codebase — it's dead code
- The fix: Import and render `CreateChallengeModal` in CoachDashboard, controlled by a `showCreateChallenge` state variable, and change `onCreateChallenge` to toggle that state instead of navigating

---

## 7. Recommended Fix Approach

### Bug 1: Season Context Bleeding — Two Options

**Option A (Recommended): Reset season on role switch**
- In MainApp.jsx, when `setActiveView('coach')` is called, also derive the coach's default season from their team assignments and call `selectSeason()` with it
- Implementation: In the role switch handler, check if switching to coach → find `roleContext.coachInfo.team_coaches[0].teams.season_id` → find that season in `availableSeasons` → call `selectSeason(thatSeason)`
- Pros: Simple, minimal changes, doesn't break admin season selection
- Cons: If coach has teams in multiple seasons, picks the first one (but TeamSwitcher lets them switch)

**Option B: Coach pages ignore global season, use team's season**
- Each coach page would derive `season_id` from the selected team instead of `selectedSeason`
- Pros: More correct — coach context is always team-scoped
- Cons: Requires touching every coach page and the CoachDashboard queries

**Recommended: Option A + targeted fixes in CoachDashboard**

1. **MainApp.jsx role switch handler**: When switching to `coach`, reset `selectedSeason` to the coach's first team's season
2. **CoachDashboard `getCoachSubLine()`**: Use `selectedTeam?.seasons?.name` instead of `selectedSeason?.name`
3. **CoachDashboard `topPlayers` query**: Use `selectedTeam?.season_id` instead of `selectedSeason?.id`
4. **CoachDashboard `statLeaders` query**: Same — use `selectedTeam?.season_id`

### Bug 2: Stats & Evals Empty
- Will be fixed by Bug 1 fix (season filter correction)
- `evalData` query is fine (no season filter needed)

### Bug 3: Create Challenge Button
1. Import `CreateChallengeModal` in CoachDashboard
2. Add `const [showCreateChallenge, setShowCreateChallenge] = useState(false)` state
3. Change `onCreateChallenge` prop from `() => onNavigate?.('teams')` to `() => setShowCreateChallenge(true)`
4. Render the modal: `{showCreateChallenge && selectedTeam && <CreateChallengeModal visible teamId={selectedTeam.id} organizationId={organization?.id} onClose={() => setShowCreateChallenge(false)} onSuccess={() => { setShowCreateChallenge(false); loadTeamData(selectedTeam); showToast?.('Challenge created!', 'success') }} />}`
5. Do the same for The Playbook's "Challenge" action (line 849)

### Files That Need Changes (Summary)

| File | Change |
|------|--------|
| `src/MainApp.jsx` | Role switch handler: reset season when switching to coach |
| `src/pages/roles/CoachDashboard.jsx` | Fix `getCoachSubLine()` to use team's season name; fix `topPlayers`/`statLeaders` queries to use `selectedTeam.season_id`; import + render `CreateChallengeModal`; add `showCreateChallenge` state; fix `onCreateChallenge` and Playbook "Challenge" action |

No other files need changes — the coach-specific pages will automatically show correct data once the season context is reset on role switch (Option A).
