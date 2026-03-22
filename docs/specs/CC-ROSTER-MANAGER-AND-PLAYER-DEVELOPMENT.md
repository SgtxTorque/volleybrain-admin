# CC-ROSTER-MANAGER-AND-PLAYER-DEVELOPMENT.md
## Roster Manager + Player Development — Full Feature Build

**Read `CLAUDE.md`, `SUPABASE_SCHEMA.md`, and `public/lynx-brandbook-v2.html` before writing ANY code.**
**Read ALL files referenced in each phase before writing code.**

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-roster-manager checkpoint"
```

---

## PROJECT OVERVIEW

Build a comprehensive **Roster Manager** page for coaches and an enhanced **Player Development** experience that spans coach, parent, and player views. This is a multi-page feature that introduces:

1. A new **Roster Manager** page for coaches (`/roster`)
2. A **Player Development Card** (slide-out panel) accessible from the roster
3. A **Skill Evaluation** flow coaches can use at any point in the season
4. An upgraded **Parent Player Card** with a "Power Levels" spider/radar chart for skills
5. Route/nav updates to wire everything together

### Architecture Principle

- **No new Supabase tables.** All tables already exist. Use them.
- **No new npm dependencies.** SVG charts only (match `DashboardWidgets.jsx` patterns).
- **Reuse existing components** where possible (PlayerCardExpanded, SkillBar, etc.)
- **Every query wrapped in try/catch.** Graceful failures everywhere.

---

## BRAND SYSTEM (quick ref)

```
Interactive: text-lynx-sky / bg-lynx-sky (#4BB9EC)
Hover:       text-lynx-deep / bg-lynx-deep (#2A9BD4)
Highlight:   bg-lynx-ice (#E8F4FD)
Nav text:    text-lynx-navy (#10284C) | dark: text-white
Secondary:   text-lynx-slate (#5A6B7F) | dark: text-slate-400
Cards:       bg-white | dark: bg-lynx-charcoal
Inner:       bg-lynx-frost | dark: bg-lynx-graphite
Page bg:     bg-lynx-cloud | dark: bg-lynx-midnight
Borders:     border-lynx-silver | dark: border-lynx-border-dark
Radius:      cards rounded-xl, buttons rounded-[10px], badges rounded-md, pills rounded-full
No backdrop-blur. No team colors for styling. No off-brand colors.
```

---

## DATABASE TABLES USED

**Read `SUPABASE_SCHEMA.md` for exact column names. Key tables for this build:**

### Roster & Players
- `team_players` — player-team link (jersey_number, joined_at)
- `players` — full player record (name, photo, position, jersey_pref_1/2/3, waiver fields, parent info)
- `player_positions` — primary/secondary/tertiary position, captain flags, per-skill ratings
- `registrations` — status flow (needs_evaluation, evaluated_at, evaluated_by)

### Evaluations & Skills
- `player_evaluations` — eval snapshot (player_id, season_id, evaluated_by, evaluation_type, evaluation_date, overall_score, skills jsonb, notes, is_initial)
- `player_skill_ratings` — structured ratings (serving_rating, passing_rating, setting_rating, attacking_rating, blocking_rating, defense_rating, hustle_rating, coachability_rating, teamwork_rating, overall_rating, coach_notes)
- `player_skills` — simplified sport-generic skills (serve, pass, attack, block, dig, set + skills_data jsonb)
- `player_coach_notes` — private timestamped notes (note_type: general/injury/behavior/skill, is_private)
- `sport_skill_templates` — sport-specific skill definitions (sport_name, skill_key, skill_name, skill_description, display_order)

### Goals & Engagement
- `player_goals` — goals with progress (title, category, target_value, current_value, status, target_date)
- `player_achievements` — earned achievements (achievement_id, earned_at, stat_value_at_unlock)
- `player_achievement_progress` — progress toward achievements (current_value, target_value)
- `player_badges` — badges earned (badge_type, badge_name, awarded_at)
- `xp_ledger` — XP history (xp_amount, source_type, description)
- `shoutouts` — shoutouts received (category, message, created_at)

### Stats
- `player_game_stats` — per-game stats (kills, aces, digs, blocks, assists, points_scored, etc.)
- `player_season_stats` — aggregated season totals
- `game_results` — game-level results for linking stats to games

### Waivers & Attendance
- `waiver_signatures` — signed waivers (player_id, status, signed_at)
- `event_attendance` — per-event attendance (player_id, event_id, status: present/absent/late/excused)

---

## ═══════════════════════════════════════════════════════════
## PHASE 1: Routes, Navigation, and Page Shell
## ═══════════════════════════════════════════════════════════

### 1A. Add route to `src/lib/routes.js`

```js
'roster': '/roster',
```

Add to PAGE_TITLES:
```js
'/roster': 'Roster Manager',
```

### 1B. Add route to `src/MainApp.jsx`

Import the new page:
```jsx
import RosterManagerPage from './pages/roster/RosterManagerPage'
```

Add route (near the other core page routes):
```jsx
<Route path="/roster" element={<RosterManagerPage showToast={showToast} roleContext={roleContext} onNavigate={(pageId) => navigate(getPathForPage(pageId))} />} />
```

### 1C. Add to coach navigation

In `coachNavGroups` in MainApp.jsx, add Roster to the "My Teams" dropdown:
```jsx
{ id: 'myteams', label: 'My Teams', type: 'dropdown', items: [
  { id: 'roster', label: 'Roster Manager', icon: 'users' },  // ADD THIS
  ...(roleContext?.coachInfo?.team_coaches?.map(tc_item => ({
    id: `teamwall-${tc_item.team_id}`,
    label: tc_item.teams?.name + (tc_item.role === 'head' ? ' ⭐' : ''),
    icon: 'users',
    teamId: tc_item.team_id,
  })) || [])
]}
```

### 1D. Create page shell

**Create: `src/pages/roster/RosterManagerPage.jsx`**

The thin shell that owns data fetching and passes props to child components.

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function RosterManagerPage({ showToast, roleContext, onNavigate }) {
  const { user, organization } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [roster, setRoster] = useState([])
  const [viewMode, setViewMode] = useState('overview') // 'overview' | 'evaluate' | 'setup'
  const [selectedPlayer, setSelectedPlayer] = useState(null) // opens dev card
  const [rosterHealth, setRosterHealth] = useState({ total: 0, missingJersey: 0, missingPosition: 0, unsignedWaivers: 0, newPlayers: 0, needsEval: 0 })

  // Load coach's teams
  useEffect(() => { loadTeams() }, [selectedSeason])

  // Load roster when team changes
  useEffect(() => { if (selectedTeam) loadRoster(selectedTeam) }, [selectedTeam?.id])

  async function loadTeams() { /* ... query team_coaches + teams ... */ }
  async function loadRoster(team) { /* ... query team_players + players + evaluations + waivers ... */ }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      {/* Page renders here — details in Phase 2 */}
    </div>
  )
}
```

**Create: `src/pages/roster/index.js`**
```js
export { default as RosterManagerPage } from './RosterManagerPage'
```

### 1E. Wire dashboard workflow button

In the coach dashboard, the Roster workflow button should navigate to `/roster`:
```jsx
// In CoachWorkflowButtons or wherever the 4 buttons are:
onClick={() => onNavigate('roster')
```

```bash
git add -A && git commit -m "Phase 1: Add roster route, nav item, page shell, wire dashboard button" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 2: Roster Overview Mode
## ═══════════════════════════════════════════════════════════

This is the default view of the Roster Manager page.

### 2A. Page Header

```
┌─────────────────────────────────────────────────────────────────────┐
│  👥 Roster Manager          [ Team Selector ▾ ]  [ Season ▾ ]     │
│                                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │12 Players│ 2 Need   │ 1 Waiver │ 3 New    │ 4 Need   │          │
│  │          │ Jersey # │ Unsigned │ Players  │ Eval     │          │
│  │  ● OK    │  ● Issue │  ● Issue │  ● Info  │  ● Action│          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
│                                                                     │
│  [ Overview ]  [ Evaluate ]  [ Season Setup ]    🔍 Search         │
└─────────────────────────────────────────────────────────────────────┘
```

**Team selector:** Dropdown of teams the coach is assigned to. Same pattern as dashboard.

**Roster Health Bar:** 5 compact stat tiles (same style as command strip but smaller). Each shows a count and status. Computed from the roster data:
- **Total players** — `roster.length`
- **Need Jersey #** — players where `jersey_number` is null in `team_players`
- **Waiver unsigned** — players with no matching row in `waiver_signatures` for current season (or status !== 'signed')
- **New players** — `team_players.joined_at` within last 14 days
- **Need Eval** — players with no row in `player_evaluations` for current season OR `player_skill_ratings` for current season

**Mode tabs:** Overview | Evaluate | Season Setup. Simple tab pills.

**Search:** Filters roster by name.

### 2B. Roster Table

A sortable card-table hybrid. Each row is a player with key info at a glance.

```
┌─────┬──────────────────┬────┬──────┬────────┬────────┬────────┬──────────┐
│     │ Player           │ #  │ Pos  │ Skills │ Waiver │ Status │ Actions  │
├─────┼──────────────────┼────┼──────┼────────┼────────┼────────┼──────────┤
│ 📷  │ Sarah Johnson    │ 7  │ OH   │ ████░  │  ✅    │ Active │ ⋯       │
│     │ 8th Grade        │    │      │ 4.2/5  │        │ 🆕     │          │
├─────┼──────────────────┼────┼──────┼────────┼────────┼────────┼──────────┤
│ 📷  │ Maya Rodriguez   │ —  │ —    │ ░░░░░  │  ⚠️    │ Active │ ⋯       │
│     │ 7th Grade        │    │      │ No eval│        │ 🆕     │          │
└─────┴──────────────────┴────┴──────┴────────┴────────┴────────┴──────────┘
```

**Columns:**
- **Photo** — `players.photo_url` (or placeholder avatar)
- **Player** — Full name + grade/age. **Clickable → opens Player Development Card (Phase 4)**
- **Jersey #** — From `team_players.jersey_number`. If null, show `—` in amber. **Inline editable**: click to type a number, blur to save.
- **Position** — From `players.position` or `player_positions.primary_position`. If null, show `—` in amber. **Inline editable**: dropdown with sport-specific positions.
- **Skills** — Mini progress bar showing `player_skill_ratings.overall_rating` (1-10 scale, displayed as bar). If no eval exists, show "No eval" in muted text.
- **Waiver** — ✅ if signed, ⚠️ if unsigned. Query `waiver_signatures` for this player + season.
- **Status** — Active/Inactive. Plus badges: 🆕 if joined in last 14 days. 🏆 if captain (from `player_positions.is_captain`).
- **Actions** — Three-dot menu: "View Profile", "Evaluate", "Add Note", "Remove from Team"

**Sorting:** Click column headers to sort. Default: jersey number ascending, nulls last.

**Inline editing for Jersey # and Position:**
When the coach clicks the jersey number cell, it becomes an input field. On blur or Enter, save to `team_players.jersey_number` via supabase update. Same pattern for position → save to `players.position`.

**Bulk Actions Bar** (appears when items are selected via checkbox):
```
┌─────────────────────────────────────────────────────────┐
│ ✅ 4 selected    [ Assign Position ▾ ] [ Bulk Eval ]   │
└─────────────────────────────────────────────────────────┘
```

### 2C. Data Loading

```jsx
async function loadRoster(team) {
  setLoading(true)
  try {
    // 1. Get team players with full player data
    const { data: teamPlayers } = await supabase
      .from('team_players')
      .select('*, players(id, first_name, last_name, photo_url, position, grade, birth_date, jersey_number, jersey_pref_1, jersey_pref_2, jersey_pref_3, parent_name, parent_email, waiver_signed, status)')
      .eq('team_id', team.id)
      .order('jersey_number', { ascending: true, nullsFirst: false })

    const playerIds = (teamPlayers || []).map(tp => tp.player_id).filter(Boolean)

    // 2. Get skill ratings for all players
    let skillRatings = {}
    if (playerIds.length > 0) {
      const { data: ratings } = await supabase
        .from('player_skill_ratings')
        .select('*')
        .in('player_id', playerIds)
        .eq('season_id', selectedSeason?.id)
        .order('rated_at', { ascending: false })
      // Group by player_id, take most recent
      for (const r of (ratings || [])) {
        if (!skillRatings[r.player_id]) skillRatings[r.player_id] = r
      }
    }

    // 3. Get evaluation count per player
    let evalCounts = {}
    if (playerIds.length > 0) {
      const { data: evals } = await supabase
        .from('player_evaluations')
        .select('player_id')
        .in('player_id', playerIds)
        .eq('season_id', selectedSeason?.id)
      for (const e of (evals || [])) {
        evalCounts[e.player_id] = (evalCounts[e.player_id] || 0) + 1
      }
    }

    // 4. Get waiver signatures
    let waiverStatus = {}
    if (playerIds.length > 0) {
      const { data: waivers } = await supabase
        .from('waiver_signatures')
        .select('player_id, status')
        .in('player_id', playerIds)
        .eq('season_id', selectedSeason?.id)
      for (const w of (waivers || [])) {
        if (w.status === 'signed' || w.status === 'active') waiverStatus[w.player_id] = true
      }
    }

    // 5. Get player_positions for captain flags
    let positionData = {}
    if (playerIds.length > 0) {
      const { data: positions } = await supabase
        .from('player_positions')
        .select('player_id, primary_position, secondary_position, is_captain, is_co_captain')
        .in('player_id', playerIds)
      for (const pos of (positions || [])) {
        positionData[pos.player_id] = pos
      }
    }

    // 6. Merge everything into enriched roster
    const enriched = (teamPlayers || []).map(tp => ({
      ...tp,
      player: tp.players,
      skills: skillRatings[tp.player_id] || null,
      evalCount: evalCounts[tp.player_id] || 0,
      waiverSigned: !!waiverStatus[tp.player_id],
      positions: positionData[tp.player_id] || null,
      isNew: tp.joined_at && (new Date() - new Date(tp.joined_at)) < 14 * 24 * 60 * 60 * 1000,
    }))

    setRoster(enriched)

    // 7. Compute health
    setRosterHealth({
      total: enriched.length,
      missingJersey: enriched.filter(p => !p.jersey_number && !p.player?.jersey_number).length,
      missingPosition: enriched.filter(p => !p.player?.position && !p.positions?.primary_position).length,
      unsignedWaivers: enriched.filter(p => !p.waiverSigned).length,
      newPlayers: enriched.filter(p => p.isNew).length,
      needsEval: enriched.filter(p => p.evalCount === 0).length,
    })
  } catch (err) {
    console.error('loadRoster error:', err)
    showToast?.('Failed to load roster', 'error')
  }
  setLoading(false)
}
```

```bash
git add -A && git commit -m "Phase 2: Roster overview — health bar, sortable table, inline edit, bulk actions" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 3: Evaluation Mode
## ═══════════════════════════════════════════════════════════

When the coach clicks the "Evaluate" tab or "Evaluate" action on a player.

### 3A. Evaluation Setup

Before starting an evaluation, coach selects:

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Start Evaluation                                       │
│                                                             │
│  Type:  [ Tryout ] [ Pre-Season ] [ Mid-Season ]           │
│         [ End-Season ] [ Ad Hoc ]                          │
│                                                             │
│  Players:  ○ All roster  ○ Selected (4)  ○ Single player   │
│                                                             │
│  Skills to rate:                                            │
│  ✅ Serving  ✅ Passing  ✅ Setting  ✅ Attacking           │
│  ✅ Blocking  ✅ Defense  ✅ Hustle  ✅ Coachability        │
│  ✅ Teamwork                                                │
│                                                             │
│  [ Start Evaluation → ]                                     │
└─────────────────────────────────────────────────────────────┘
```

**Evaluation types** map to `player_evaluations.evaluation_type`:
- `tryout` — pre-team-assignment eval
- `pre_season` — start of season assessment
- `mid_season` — mid-season check-in
- `end_season` — final evaluation
- `ad_hoc` — any time

**Skills** come from the `player_skill_ratings` columns: serving, passing, setting, attacking, blocking, defense, hustle, coachability, teamwork. Also try loading `sport_skill_templates` for the team's sport and use those if they exist. Fall back to the hardcoded volleyball skills if no templates found.

### 3B. Player Evaluation Card

Once evaluation starts, show one player at a time:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back to Setup       Player 3 of 12        Skip → │ Next → │    │
│                                                                     │
│  ┌────────┐                                                        │
│  │  📷    │  Sarah Johnson  #7  OH                                 │
│  │        │  8th Grade · Black Hornets Elite                       │
│  └────────┘                                                        │
│                                                                     │
│  ┌─ Previous Eval (if exists) ─────────────────────────────────┐   │
│  │ Pre-Season · Oct 15, 2025 · Overall: 3.5/5                  │   │
│  │ Serving: 3 | Passing: 4 | Setting: 2 | Attacking: 3         │   │
│  │ "Strong passer, needs work on approach for hitting"          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ── Current Evaluation ──                                           │
│                                                                     │
│  Serving      ①  ②  ③  ④  ⑤    [ 3 ]                            │
│  Passing      ①  ②  ③  ④  ⑤    [ 4 ] ↑ was 4                   │
│  Setting      ①  ②  ③  ④  ⑤    [ 3 ] ↑ was 2                   │
│  Attacking    ①  ②  ③  ④  ⑤    [ 4 ] ↑ was 3                   │
│  Blocking     ①  ②  ③  ④  ⑤    [ 3 ]                            │
│  Defense      ①  ②  ③  ④  ⑤    [ 4 ]                            │
│  Hustle       ①  ②  ③  ④  ⑤    [ 5 ]                            │
│  Coachability ①  ②  ③  ④  ⑤    [ 4 ]                            │
│  Teamwork     ①  ②  ③  ④  ⑤    [ 5 ]                            │
│                                                                     │
│  Overall: 3.9 / 5  (auto-calculated average)                       │
│                                                                     │
│  Notes: [                                                ]          │
│         [ "Huge improvement in setting. Moving her to    ]          │
│         [  backup setter for tournaments."               ]          │
│                                                                     │
│  [ Save & Next → ]                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Rating UI:** Each skill shows 5 clickable circles (1-5). Clicking fills circles up to that number. If a previous eval exists for this player in this season, show the previous rating next to current with an arrow (↑↓→) indicating change.

**Overall score:** Auto-calculated as the average of all rated skills, rounded to 1 decimal.

**Notes:** Textarea for coach commentary. This saves to both `player_evaluations.notes` AND creates a `player_coach_notes` entry with `note_type: 'evaluation'`.

### 3C. Saving Evaluations

When "Save & Next" is clicked:

```jsx
async function saveEvaluation(playerId, ratings, notes, evalType) {
  const overallScore = Math.round(
    Object.values(ratings).reduce((s, v) => s + v, 0) / Object.values(ratings).length * 10
  ) / 10

  // 1. Save to player_evaluations
  const skillsJson = JSON.stringify(ratings)
  await supabase.from('player_evaluations').insert({
    player_id: playerId,
    season_id: selectedSeason.id,
    evaluated_by: user.id,
    evaluation_type: evalType,
    evaluation_date: new Date().toISOString().split('T')[0],
    overall_score: Math.round(overallScore),
    skills: skillsJson,
    notes: notes || null,
    is_initial: evalType === 'tryout' || evalType === 'pre_season',
  })

  // 2. Save/update player_skill_ratings (upsert on player_id + season_id + team_id)
  const ratingRow = {
    player_id: playerId,
    team_id: selectedTeam.id,
    season_id: selectedSeason.id,
    overall_rating: Math.round(overallScore),
    serving_rating: ratings.serving || null,
    passing_rating: ratings.passing || null,
    setting_rating: ratings.setting || null,
    attacking_rating: ratings.attacking || null,
    blocking_rating: ratings.blocking || null,
    defense_rating: ratings.defense || null,
    hustle_rating: ratings.hustle || null,
    coachability_rating: ratings.coachability || null,
    teamwork_rating: ratings.teamwork || null,
    coach_notes: notes || null,
    rated_by: user.id,
    rated_at: new Date().toISOString(),
  }

  // Try upsert — if a rating exists for this player/team/season, update it
  const { data: existing } = await supabase
    .from('player_skill_ratings')
    .select('id')
    .eq('player_id', playerId)
    .eq('team_id', selectedTeam.id)
    .eq('season_id', selectedSeason.id)
    .limit(1)
    .single()

  if (existing) {
    await supabase.from('player_skill_ratings').update(ratingRow).eq('id', existing.id)
  } else {
    await supabase.from('player_skill_ratings').insert(ratingRow)
  }

  // 3. Also update player_skills for parent/player view compatibility
  const skillsRow = {
    player_id: playerId,
    season_id: selectedSeason.id,
    sport: 'volleyball', // or derive from team's sport
    serve: ratings.serving || null,
    pass: ratings.passing || null,
    attack: ratings.attacking || null,
    block: ratings.blocking || null,
    dig: ratings.defense || null,
    set: ratings.setting || null,
    skills_data: skillsJson,
  }

  const { data: existingSkills } = await supabase
    .from('player_skills')
    .select('id')
    .eq('player_id', playerId)
    .eq('season_id', selectedSeason.id)
    .limit(1)
    .single()

  if (existingSkills) {
    await supabase.from('player_skills').update({ ...skillsRow, updated_at: new Date().toISOString() }).eq('id', existingSkills.id)
  } else {
    await supabase.from('player_skills').insert(skillsRow)
  }

  // 4. Save coach note
  if (notes && notes.trim()) {
    await supabase.from('player_coach_notes').insert({
      player_id: playerId,
      coach_id: user.id,
      season_id: selectedSeason.id,
      note_type: 'skill',
      content: notes.trim(),
      is_private: true,
    })
  }
}
```

**Important:** We write to BOTH `player_skill_ratings` (structured, for coach analytics) AND `player_skills` (simplified, for parent/player "power levels" view). This ensures the parent's existing SkillBar component sees updated data.

```bash
git add -A && git commit -m "Phase 3: Evaluation mode — setup, player-by-player rating flow, save to multiple tables" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 4: Player Development Card (Slide-out Panel)
## ═══════════════════════════════════════════════════════════

**Create: `src/pages/roster/PlayerDevelopmentCard.jsx`**

A slide-out panel that opens from the right when a coach clicks a player name in the roster table. 800px wide. Has 5 tabs.

### 4A. Panel Shell

```jsx
export default function PlayerDevelopmentCard({ player, teamId, seasonId, onClose, showToast }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { isDark } = useTheme()

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'evaluations', label: 'Evaluations', icon: ClipboardList },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'notes', label: 'Notes', icon: FileText },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className={`w-[800px] max-w-full h-full overflow-y-auto ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'} shadow-2xl`}>
        {/* Header with player info + close button */}
        {/* Tab bar */}
        {/* Tab content */}
      </div>
    </div>
  )
}
```

### 4B. Panel Header

```
┌─────────────────────────────────────────────────────────────┐
│  ✕                                                          │
│                                                              │
│  ┌──────────┐                                                │
│  │          │  Sarah Johnson                                 │
│  │   📷    │  #7 · Outside Hitter · 8th Grade              │
│  │          │  Black Hornets Elite                           │
│  └──────────┘                                                │
│                                                              │
│  ┌──────┬──────┬──────┬──────┬──────┐                       │
│  │ 5    │ 54   │ 4.2  │ 85%  │ Lv.6 │                      │
│  │GAMES │KILLS │RATING│ATTEND│  XP  │                       │
│  └──────┴──────┴──────┴──────┴──────┘                       │
│                                                              │
│  [ Overview ] [ Stats ] [ Evaluations ] [ Goals ] [ Notes ] │
└─────────────────────────────────────────────────────────────┘
```

**Quick stats row:** 5 compact metric badges.
- Games: from `player_season_stats.games_played`
- Top stat (kills for volleyball): from `player_season_stats.total_kills`
- Rating: from most recent `player_skill_ratings.overall_rating`
- Attendance: computed from `event_attendance` for this player this season
- XP Level: computed from `xp_ledger` total for this player

### 4C. Overview Tab

Two columns:

**Left column:**
- **Skill Spider Chart** (SVG radar chart) — shows the latest `player_skill_ratings` on a hexagonal/pentagonal radar chart. Skills: Serving, Passing, Setting, Attacking, Blocking, Defense. Scale 1-5. If a previous eval exists, overlay it as a dashed line so the coach can see growth.
- **Season Stats Summary** — big numbers: Kills, Aces, Digs, Assists, Points, Games

**Right column:**
- **Recent Games** — last 3-4 games with per-game stats (compact list)
- **Badges & Achievements** — recent badges earned (last 3-4)
- **Quick Note** — text input to add a quick note (saves to `player_coach_notes`)

### 4D. Stats Tab

- **Per-game stats table** — all games this season, sortable columns: Date, Opponent, Result, Kills, Aces, Digs, Blocks, Assists, Points
- **Trend line chart** — SVG line chart showing kills/game and points/game over the season (use MiniLineChart pattern)
- **Team comparison** — player's avg vs team avg for key stats (horizontal bars, player in lynx-sky, team avg in gray)
- **Best game callout** — highlight card: "Best Game: 8 kills vs Frisco Red on Feb 15"

### 4E. Evaluations Tab

- **Timeline view** — all evaluations for this player, most recent first
- Each eval card shows: date, evaluator name, eval type badge (tryout/pre-season/etc.), overall score, individual skill ratings as mini bars, notes
- **Spider chart comparison** — dropdown to select any two evaluations and overlay them on a radar chart. Shows growth visually.
- **[+ New Evaluation]** button — opens the evaluation flow from Phase 3 for just this player

### 4F. Goals Tab

- **Active goals** with progress bars
- Each goal: title, description, progress bar (current_value / target_value), target date, status badge
- **[+ Create Goal]** button — modal to create a new goal:
  - Title (text)
  - Category dropdown: "Performance", "Attendance", "Skills", "Personal"
  - Target type: "Stat-based" (auto-tracked from game stats) or "Manual" (coach updates)
  - If stat-based: pick stat (kills, aces, etc.) and target value
  - Target date (optional)
- **Completed goals** — archived below, collapsed by default

Auto-tracking logic for stat-based goals:
```jsx
// When loading goals, check if any stat-based goals need updating
for (const goal of goals.filter(g => g.category === 'Performance' && g.status === 'active')) {
  // goal.title might contain the stat key, or we store it in description/progress_notes
  // Compare target_value against player_season_stats value
  // If current_value has changed, update it
}
```

### 4G. Notes Tab

- **Chronological feed** of all coach notes for this player (newest first)
- Each note shows: date, note_type badge (general/injury/behavior/skill), content
- **Quick add** at top: text input + note_type selector + "Add Note" button
- **Privacy indicator:** All notes show a 🔒 icon — "Private to coaching staff"
- Notes save to `player_coach_notes` with `is_private: true`

```bash
git add -A && git commit -m "Phase 4: Player development card — 5-tab slide-out with spider chart, stats, evals, goals, notes" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 5: Spider/Radar Chart Component
## ═══════════════════════════════════════════════════════════

**Create: `src/components/charts/SpiderChart.jsx`**

A reusable SVG radar/spider chart for skill visualization. Used by both the coach's Player Development Card AND the parent's Player Card page.

```jsx
/**
 * SpiderChart — SVG radar chart for skill ratings
 * @param {Object} props
 * @param {Array<{label: string, value: number}>} props.data — skill ratings (value 0-5 or 0-10)
 * @param {Array<{label: string, value: number}>} [props.compareData] — optional overlay for comparison
 * @param {number} [props.maxValue=5] — maximum value on the scale
 * @param {number} [props.size=280] — width/height of the chart
 * @param {string} [props.color='#4BB9EC'] — primary fill color
 * @param {string} [props.compareColor='#94A3B8'] — comparison fill color
 */
export default function SpiderChart({ data, compareData, maxValue = 5, size = 280, color = '#4BB9EC', compareColor = '#94A3B8', isDark }) {
  const center = size / 2
  const radius = (size - 60) / 2  // Leave room for labels
  const angleStep = (2 * Math.PI) / data.length

  // Calculate point positions
  function getPoint(index, value) {
    const angle = angleStep * index - Math.PI / 2  // Start from top
    const r = (value / maxValue) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // Generate polygon points string
  function getPolygonPoints(values) {
    return values.map((d, i) => {
      const pt = getPoint(i, d.value)
      return `${pt.x},${pt.y}`
    }).join(' ')
  }

  // Generate grid rings
  const rings = [1, 2, 3, 4, 5].map(level => {
    const points = data.map((_, i) => {
      const pt = getPoint(i, level)
      return `${pt.x},${pt.y}`
    }).join(' ')
    return points
  })

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid rings */}
      {rings.map((points, i) => (
        <polygon key={i} points={points} fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
          strokeWidth="1" />
      ))}

      {/* Axis lines */}
      {data.map((_, i) => {
        const pt = getPoint(i, maxValue)
        return <line key={i} x1={center} y1={center} x2={pt.x} y2={pt.y}
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="1" />
      })}

      {/* Comparison data (if provided) — dashed outline */}
      {compareData && (
        <polygon points={getPolygonPoints(compareData)}
          fill={`${compareColor}15`} stroke={compareColor}
          strokeWidth="2" strokeDasharray="4,4" />
      )}

      {/* Primary data — solid fill */}
      <polygon points={getPolygonPoints(data)}
        fill={`${color}25`} stroke={color} strokeWidth="2.5" />

      {/* Data points */}
      {data.map((d, i) => {
        const pt = getPoint(i, d.value)
        return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={color} stroke="white" strokeWidth="2" />
      })}

      {/* Labels */}
      {data.map((d, i) => {
        const labelPt = getPoint(i, maxValue + 0.8)
        return (
          <text key={i} x={labelPt.x} y={labelPt.y}
            textAnchor="middle" dominantBaseline="middle"
            className={`text-[11px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
```

```bash
git add -A && git commit -m "Phase 5: Create reusable SpiderChart SVG component" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 6: Season Setup Wizard
## ═══════════════════════════════════════════════════════════

The third mode tab in the Roster Manager. A guided step-by-step flow for start-of-season roster setup.

### Steps

**Step 1: Review Roster**
- Show all players assigned to this team
- Highlight new players (🆕 badge)
- Highlight returning players
- Coach confirms: "This roster looks correct" or flags issues
- Simple list view with checkmarks

**Step 2: Assign Positions**
- Each player shown with a position dropdown
- Pre-fill from `players.position` if exists
- Show player's jersey preferences as a hint
- Sport-specific position list (use the SPORT_POSITIONS map from ParentPlayerCardPage.jsx or similar)
- Save to `players.position` AND `player_positions.primary_position`

**Step 3: Assign Jerseys**
- Each player shown with current jersey # (if any) and their preferences (pref 1, 2, 3 from registration)
- Visual grid showing which numbers are taken vs available
- Conflict detection: highlight if two players want the same number
- Save to `team_players.jersey_number`

**Step 4: Verify Waivers**
- List all players with waiver status (signed ✅ / unsigned ⚠️)
- For unsigned: show parent email, option to "Send Reminder" (creates a `waiver_sends` record or shows the parent's email for manual follow-up)
- Coach can mark "Skip for now" on individual players

**Step 5: Initial Evaluation (Optional)**
- Prompt: "Would you like to do an initial skill evaluation?"
- If yes: launches the Evaluation Mode from Phase 3 with `evaluation_type: 'pre_season'`
- If no: "You can evaluate your players anytime from the Roster Manager"
- Skip is always available

**Step 6: Confirmation**
- Summary: "Your roster is ready! 12 players, all jerseys assigned, 11/12 waivers signed"
- "Go to Dashboard" button
- Sets a flag so the Season Setup tab doesn't show as primary anymore (store in localStorage or a coach preference)

**Implementation:** Each step is a component inside `src/pages/roster/SeasonSetupWizard.jsx`. Progress bar at top showing current step.

```bash
git add -A && git commit -m "Phase 6: Season setup wizard — 6-step guided roster onboarding flow" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 7: Upgrade Parent Player Card — Power Levels
## ═══════════════════════════════════════════════════════════

**File: `src/pages/parent/ParentPlayerCardPage.jsx`**

The parent already sees a player card with tabs (Overview, Stats, Badges, Games). Upgrade the **Overview tab** to show a "Power Levels" spider chart alongside the existing SkillBars.

### 7A. Add Spider Chart to Overview Tab

In the Overview tab's left column (where Skills currently shows SkillBars), add the SpiderChart ABOVE the skill bars:

```jsx
import SpiderChart from '../../components/charts/SpiderChart'

// In the Skills section of Overview tab:
{skills && sc.skills.some(s => skills[s] != null) ? (
  <div className="space-y-4">
    {/* Spider Chart — Power Levels */}
    <SpiderChart
      data={sc.skills.map(s => ({
        label: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
        value: getSkillValue(skills[s]) / 20, // Convert 0-100 scale to 0-5
      }))}
      maxValue={5}
      size={240}
      color="#4BB9EC"
      isDark={isDark}
    />

    {/* Existing Skill Bars below */}
    <div className="space-y-3">
      {sc.skills.map(s => <SkillBar key={s} label={s} value={getSkillValue(skills[s])} isDark={isDark} />)}
    </div>
  </div>
) : (
  <div className="flex flex-col items-center py-6 text-center">
    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
      <Target className="w-8 h-8 text-lynx-sky" />
    </div>
    <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Power Levels</p>
    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Your coach hasn't rated skills yet</p>
  </div>
)}
```

### 7B. Add "Development" Tab

Add a new tab to the parent's player card:

```jsx
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'stats', label: 'Stats' },
  { id: 'development', label: 'Development' },  // NEW
  { id: 'badges', label: 'Badges' },
  { id: 'games', label: 'Games' },
]
```

**Development tab content:**

- **Skill Progression** — If multiple evaluations exist across the season, show the SpiderChart with an overlay: earliest eval (dashed, gray) vs latest eval (solid, sky blue). This is the "growth visualization" parents love.
- **Coach Feedback** — Show `player_coach_notes` where `is_private = false` (non-private notes that the coach intentionally shares). If no public notes exist, show "No coach feedback shared yet."
- **Goals** — Show any `player_goals` for this player. Progress bars. Parents can see what their kid is working toward.
- **Season Journey** — Timeline of evaluations (date, type, overall score). Shows progression over time as a simple vertical timeline with score badges.

**Load evaluation history for the Development tab:**
```jsx
// Load all evaluations for this player across the current season
const { data: evalHistory } = await supabase
  .from('player_evaluations')
  .select('evaluation_date, evaluation_type, overall_score, skills')
  .eq('player_id', playerId)
  .eq('season_id', selectedSeason?.id)
  .order('evaluation_date', { ascending: true })
```

### 7C. Fix SkillBar Color

The existing SkillBar uses `#F59E0B` (amber/gold). Change to brand color:

```jsx
{/* OLD */}
style={{ width: `${pct}%`, backgroundColor: '#F59E0B' }}

{/* NEW */}
style={{ width: `${pct}%`, backgroundColor: '#4BB9EC' }}
```

```bash
git add -A && git commit -m "Phase 7: Parent player card — spider chart power levels, development tab, skill progression" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 8: Polish and Integration
## ═══════════════════════════════════════════════════════════

### 8A. Dark Mode Pass

Verify every new component works in dark mode:
- Roster table
- Evaluation cards
- Player Development Card (slide-out)
- Spider Chart
- Season Setup Wizard
- Parent's Development tab

### 8B. Empty States

Every section needs a graceful empty state:
- No players on roster → "No players assigned yet. Ask your admin to assign players."
- No evaluations → "No evaluations yet. Start your first evaluation to track player growth."
- No game stats → "Play games and enter stats to see performance data."
- No goals → "Set goals for your players to track their progress."
- No notes → "Add private notes to track player development."
- No skills (parent view) → "Power Levels will appear once your coach rates skills."

### 8C. Loading States

- Skeleton loaders for the roster table (3-4 placeholder rows with shimmer)
- Spinner/skeleton for Player Development Card tabs
- Loading indicator for evaluation save

### 8D. Toast Notifications

- "Evaluation saved for Sarah Johnson" (success)
- "Jersey #7 assigned to Sarah Johnson" (success)
- "Note added" (success)
- "Goal created" (success)
- Error toasts for any failed operations

### 8E. Responsive

- Roster table: on mobile, collapse to card view (stack player info vertically)
- Player Development Card: on mobile, take full width
- Spider chart: reduce size on small screens
- Season Setup: stack steps vertically on mobile

### 8F. Wire Dashboard Coach Onboarding Journey

In the coach dashboard left sidebar, the "Coach Setup 3/7" placeholder should now include:
- "Review your roster" → navigates to `/roster`
- "Evaluate your players" → navigates to `/roster` with evaluate mode

(This is still a placeholder — just update the mock text and link targets.)

```bash
git add -A && git commit -m "Phase 8: Polish — dark mode, empty states, loading, responsive, toast notifications" && git push
```

---

## DO NOT

- **DO NOT** create new Supabase tables — all tables exist already
- **DO NOT** run DROP TABLE or destructive ALTER statements
- **DO NOT** install any npm dependencies — use raw SVG for all charts
- **DO NOT** modify the nav bar component itself — only modify `coachNavGroups` in MainApp.jsx
- **DO NOT** change the admin dashboard or admin functionality
- **DO NOT** change the coach dashboard layout (that was just polished)
- **DO NOT** change FeedPost.jsx, hubStyles.js, or shared engagement components
- **DO NOT** change the XP/achievement system logic
- **DO NOT** use team colors for styling — use brand palette only
- **DO NOT** use backdrop-blur anywhere
- **DO NOT** break existing parent player card functionality — only ADD to it
- **DO NOT** expose private coach notes to parents — `is_private: true` notes must NEVER appear in parent views
- **DO NOT** change the player dashboard (that's a separate feature)

---

## VERIFICATION CHECKLIST

### Routes & Navigation
- [ ] `/roster` route works and renders RosterManagerPage
- [ ] "Roster Manager" appears in coach's "My Teams" dropdown
- [ ] Dashboard Roster workflow button navigates to `/roster`
- [ ] Back navigation from roster returns to dashboard

### Roster Overview
- [ ] Team selector works (multi-team coaches can switch)
- [ ] Roster health bar shows correct counts
- [ ] Player table renders with all columns
- [ ] Player name is clickable → opens Player Development Card
- [ ] Jersey # is inline editable → saves to DB
- [ ] Position is inline editable → saves to DB
- [ ] Skill rating bar reflects actual evaluation data
- [ ] Waiver status reflects actual waiver_signatures data
- [ ] New player badge (🆕) shows for players joined < 14 days
- [ ] Search filters by player name
- [ ] Sorting works on all columns

### Evaluation Mode
- [ ] Setup screen lets coach select eval type and skills
- [ ] Player-by-player evaluation card shows photo, name, jersey, position
- [ ] Previous evaluation shown if exists (with comparison arrows)
- [ ] 1-5 rating circles work for all skills
- [ ] Overall score auto-calculates
- [ ] Notes textarea saves
- [ ] "Save & Next" advances to next player
- [ ] Skip works
- [ ] Evaluations save to player_evaluations, player_skill_ratings, AND player_skills
- [ ] Coach notes save to player_coach_notes

### Player Development Card
- [ ] Slide-out panel opens from right
- [ ] Backdrop click closes panel
- [ ] X button closes panel
- [ ] Header shows player photo, name, jersey, position, team
- [ ] Quick stats row shows games, top stat, rating, attendance, XP level
- [ ] Overview tab: Spider chart renders with latest skill ratings
- [ ] Overview tab: Season stats summary shows correct numbers
- [ ] Stats tab: Per-game table renders and is sortable
- [ ] Stats tab: Trend line chart shows kill/point progression
- [ ] Evaluations tab: Timeline shows all evals chronologically
- [ ] Evaluations tab: Spider chart comparison works
- [ ] Goals tab: Active goals show progress bars
- [ ] Goals tab: Create goal form works and saves
- [ ] Notes tab: Notes feed shows chronologically
- [ ] Notes tab: Quick add works and saves

### Spider Chart
- [ ] Renders correctly with 6+ data points
- [ ] Grid rings and axis lines visible
- [ ] Labels readable and not overlapping
- [ ] Comparison overlay works (dashed line)
- [ ] Scales from 0-5 correctly
- [ ] Works in dark mode

### Season Setup Wizard
- [ ] All 6 steps render
- [ ] Progress bar updates per step
- [ ] Step 1: Shows all players with status
- [ ] Step 2: Position dropdowns work and save
- [ ] Step 3: Jersey number assignment works with conflict detection
- [ ] Step 4: Waiver status correct, reminder action works
- [ ] Step 5: Optional eval launches correctly
- [ ] Step 6: Summary shows correct counts
- [ ] Skip forward/backward between steps works

### Parent Player Card
- [ ] Spider chart renders in Overview tab Skills section
- [ ] Power Levels shows "not rated yet" when no skills data
- [ ] New "Development" tab appears
- [ ] Development tab: Skill progression spider chart with comparison
- [ ] Development tab: Only non-private coach notes shown
- [ ] Development tab: Goals shown with progress
- [ ] Development tab: Evaluation timeline shown
- [ ] SkillBar color changed from amber to lynx-sky (#4BB9EC)
- [ ] ZERO private coach notes visible to parents

### Data Integrity
- [ ] Evaluations save to all 3 tables (player_evaluations, player_skill_ratings, player_skills)
- [ ] Jersey updates save to team_players.jersey_number
- [ ] Position updates save to players.position
- [ ] Notes save with correct note_type and is_private
- [ ] Goals save with correct structure
- [ ] All queries use selectedSeason.id for season filtering
- [ ] No console errors
- [ ] App starts with `npm run dev`

### Brand
- [ ] No team color usage for styling
- [ ] All interactive elements use lynx-sky / lynx-deep
- [ ] Spider chart uses lynx-sky (#4BB9EC) as primary color
- [ ] SkillBars use lynx-sky (not amber #F59E0B)
- [ ] No off-brand colors
- [ ] No backdrop-blur
