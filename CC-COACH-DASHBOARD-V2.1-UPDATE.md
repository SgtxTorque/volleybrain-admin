# CC-COACH-DASHBOARD-V2.1-UPDATE.md
## Coach Dashboard — Workflow Buttons, Command Strip Polish, Performance Grid

**Read `CLAUDE.md`, `SUPABASE_SCHEMA.md`, and `public/lynx-brandbook-v2.html` before writing ANY code.**

**Also read these existing files for patterns:**
- `src/components/widgets/dashboard/DashboardWidgets.jsx` — has `DonutChart`, `MiniLineChart`, `WCard`, `WHeader` components. Reuse the SVG chart patterns. Do NOT install recharts or any chart library.
- `src/components/coach/CoachCenterDashboard.jsx` — the file you're modifying
- `src/pages/roles/CoachDashboard.jsx` — the shell with all data fetching

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-v2.1-update checkpoint"
```

---

## OVERVIEW

This update modifies the existing V2 Coach Dashboard (already implemented) to:

1. **Revise the Command Strip** — new tile definitions, status pills instead of dots
2. **Add Workflow Buttons** — 4 branded gradient buttons below the command strip
3. **Add Performance Grid** — 3×3 grid of charts/cards replacing Quick Attendance
4. **Remove Quick Attendance section** — replaced by Performance Grid

---

## BRAND REFERENCE (quick reminder)

```
Sky Blue:    #4BB9EC (text-lynx-sky / bg-lynx-sky)
Deep Sky:    #2A9BD4 (text-lynx-deep / bg-lynx-deep)
Ice Blue:    #E8F4FD (bg-lynx-ice)
Navy:        #10284C (text-lynx-navy)
Cards light: bg-white    |  dark: bg-lynx-charcoal
Borders:     border-lynx-silver  |  dark: border-lynx-border-dark
Fallback team color: #4BB9EC
No new dependencies. Use raw SVG for all charts (match DashboardWidgets.jsx patterns).
```

---

## ═══════════════════════════════════════════════
## PHASE 1: Revise Command Strip
## ═══════════════════════════════════════════════

**File: `src/components/coach/CoachCommandStrip.jsx`**

### New Tile Definitions

Replace the current 6 tiles with these 6. The strip measures **rolling team health** (last 3 events + next event), not just next-game status.

| # | Tile | Icon | Value Logic | Status Logic | Tap Action |
|---|------|------|-------------|--------------|------------|
| 1 | **Game Prep** | `Swords` | Shows next game opponent or "No games" | 🟢 if lineup set + RSVPs > 80% + last stats entered. 🟡 if any one missing. 🔴 if game < 24h and items missing. ⚪ if no upcoming game. | `onNavigate('gameprep')` |
| 2 | **Attendance** | `ClipboardCheck` | Avg attendance % over last 3 events (e.g. "85%") or "—" if no events | 🟢 if ≥ 85%. 🟡 if 70-84%. 🔴 if < 70%. ⚪ if no data. | `onNavigate('attendance')` |
| 3 | **Engagement** | `Heart` | Composite: shoutouts this week + active challenges + team posts this week. Show as score e.g. "12 acts" | 🟢 if ≥ 8 total engagement actions. 🟡 if 3-7. 🔴 if < 3. ⚪ if no data. | `onNavigate('teamhub')` |
| 4 | **Roster** | `Users` | "{count} players" + issue count | 🟢 if no issues. 🟡 if 1-2 issues (missing jersey, no position). 🔴 if 3+ issues. | `onNavigate('roster')` |
| 5 | **Stats** | `BarChart3` | "{pending} need" or "All done" | 🟢 if 0 pending. 🟡 if 1 pending. 🔴 if 2+ pending. | `onNavigate('gameprep')` |
| 6 | **Lineups** | `ClipboardList` | "{count}/{total} set" for upcoming games | 🟢 if all upcoming games have lineups. 🟡 if some missing. 🔴 if next game has no lineup. ⚪ if no upcoming games. | `onNavigate('gameprep')` |

### Status Pill (replaces dot indicator)

Replace the tiny dot at the bottom of each tile with a **status pill**:

```jsx
{/* OLD — tiny dot */}
<span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />

{/* NEW — status pill with text */}
<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${pillClasses}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
  {statusText}
</span>
```

Pill variants:
```jsx
const STATUS = {
  healthy: {
    pillClasses: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    dotColor: 'bg-emerald-500',
    text: 'Healthy'
  },
  attention: {
    pillClasses: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
    dotColor: 'bg-amber-500',
    text: 'Needs Work'
  },
  behind: {
    pillClasses: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
    dotColor: 'bg-red-500',
    text: 'Behind'
  },
  noData: {
    pillClasses: isDark ? 'bg-white/[0.06] text-slate-500' : 'bg-slate-100 text-slate-400',
    dotColor: isDark ? 'bg-slate-600' : 'bg-slate-300',
    text: 'No Data'
  }
}
```

### Tile Size Adjustment

Make the tile text proportional to the card size:
- Value: `text-xl font-black` (was `text-lg`)
- Label: `text-[10px] uppercase tracking-wider font-bold` (keep)
- Icon: `w-6 h-6` (was `w-5 h-5`)

Grid stays: `grid grid-cols-3 md:grid-cols-6 gap-3`

### New Props Needed from Shell

The command strip now needs these props:
```jsx
{
  // Game Prep
  nextGame,              // next game event object
  lineupSetForNextGame,  // boolean
  rsvpPercentNextGame,   // number 0-100
  lastGameStatsEntered,  // boolean (pendingStats === 0)
  
  // Attendance
  avgAttendanceLast3,    // number 0-100 or null
  
  // Engagement
  weeklyEngagement,      // { shoutouts: number, challenges: number, posts: number }
  
  // Roster
  rosterCount,           // number
  rosterIssues,          // number (missing jerseys + missing positions + unsigned waivers)
  
  // Stats
  pendingStats,          // number
  
  // Lineups
  lineupsSet,            // number (how many upcoming games have lineups)
  upcomingGamesCount,    // number (total upcoming games)
  
  // Navigation
  onNavigate,
}
```

---

## ═══════════════════════════════════════════════
## PHASE 2: Add Workflow Buttons
## ═══════════════════════════════════════════════

**Create new file: `src/components/coach/CoachWorkflowButtons.jsx`**

Four branded gradient buttons in a horizontal row. These are the coach's core workspaces.

### Layout

```
grid grid-cols-2 md:grid-cols-4 gap-3
```

### Button Design

Each button has:
- Subtle gradient background using the team color (or lynx-sky fallback)
- White icon + white text
- Optional notification badge (top-right corner)
- Hover: slight brightness increase + subtle lift shadow

```jsx
function WorkflowButton({ icon: Icon, label, badge, onClick, teamColor, isDark }) {
  const baseColor = teamColor || '#4BB9EC'
  
  // Create a subtle gradient from teamColor to a slightly darker shade
  const gradientStyle = {
    background: `linear-gradient(135deg, ${baseColor}dd, ${baseColor}99, ${adjustBrightness(baseColor, -20)}bb)`
  }
  
  return (
    <button
      onClick={onClick}
      className="relative rounded-xl p-4 text-left transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 group overflow-hidden min-h-[80px]"
      style={gradientStyle}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-bold text-white">{label}</span>
      </div>
      
      {/* Notification badge */}
      {badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-20 shadow-lg">
          {badge}
        </span>
      )}
    </button>
  )
}
```

**Import `adjustBrightness` from `../../constants/hubStyles`** (it already exists in the codebase).

### The Four Buttons

| Button | Icon | Label | Badge Logic | Tap Action |
|--------|------|-------|-------------|------------|
| **Game Day** | `Swords` | "Game Day" | Badge = 1 if game within 24 hours AND checklist not complete | `onNavigate('gameday')` |
| **Practice** | `ClipboardCheck` | "Practice" | Badge = count of practices in next 7 days with < 50% RSVP | `onNavigate('schedule')` — filter to practices |
| **Roster** | `Users` | "Roster" | Badge = count of roster issues (missing jerseys + no position + unsigned waivers). Also badge if admin added new players since coach last viewed. | `onNavigate('roster')` |
| **Schedule** | `Calendar` | "Schedule" | Badge = events in next 7 days with < 50% RSVP response rate | `onNavigate('schedule')` |

### Badge Data

**Roster badge (new players):** This is the "new players added" indicator you described. 

To detect new players, the shell can compare `team_players.joined_at` against a threshold. If any player's `joined_at` is within the last 7 days, show the count as a badge. This naturally handles start-of-season when admin bulk-adds players.

```jsx
// In shell (CoachDashboard.jsx) loadTeamData:
const newPlayersCount = roster.filter(p => {
  const joined = new Date(p.joined_at)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return joined > weekAgo
}).length

// Combine with issues for total badge
const rosterBadge = newPlayersCount + rosterIssues
```

### Props

```jsx
{
  teamColor,       // selectedTeam?.color
  onNavigate,
  gameDay: {       // Game Day button data
    badge: number  // 1 if game <24h and checklist incomplete, else 0
  },
  practice: {
    badge: number  // practices in next 7 days with low RSVP
  },
  roster: {
    badge: number  // new players + issues
  },
  schedule: {
    badge: number  // events with low RSVP in next 7 days
  }
}
```

---

## ═══════════════════════════════════════════════
## PHASE 3: Performance Grid (3×3)
## ═══════════════════════════════════════════════

**Create new file: `src/components/coach/CoachPerformanceGrid.jsx`**

This replaces the Quick Attendance section. A 3×3 grid of performance cards with charts, power bars, and insights.

### Layout

```jsx
{/* Section divider */}
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <BarChart3 className={`w-5 h-5 ${isDark ? 'text-lynx-sky' : 'text-lynx-sky'}`} />
    <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Performance</h2>
  </div>
  <button onClick={() => onNavigate?.('leaderboards')} className="text-xs font-semibold text-lynx-sky hover:text-lynx-deep">
    View Full Stats →
  </button>
</div>

{/* 3x3 Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  {/* 9 cards */}
</div>
```

### Card Wrapper

Each performance card uses a consistent wrapper:

```jsx
function PerfCard({ title, icon: Icon, children, isDark }) {
  const cardBg = isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver/50'
  return (
    <div className={`${cardBg} rounded-xl shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        {Icon && <Icon className="w-4 h-4 text-lynx-sky" />}
        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{title}</h3>
      </div>
      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
```

**All cards should have a consistent height: `min-h-[220px]`** on the wrapper div so the grid stays aligned.

---

### CARD 1: Team Scoring Trend (Line Chart)

**Position:** Row 1, Col 1

```
┌─────────────────────────┐
│ 📈 SCORING TREND        │
│                         │
│    *        *           │
│   / \    * / \     *    │
│  /   \  / \   \   /    │
│ *     \/    \   \ /     │
│               *  *      │
│                         │
│ G1 G2 G3 G4 G5 G6 G7  │
└─────────────────────────┘
```

**Data:** Query `schedule_events` where `team_id = selectedTeam.id` AND `game_status = 'completed'` AND `our_score IS NOT NULL`. Order by `event_date ASC`. Plot `our_score` per game.

**Chart:** Reuse the `MiniLineChart` SVG pattern from `DashboardWidgets.jsx`. Use `color = '#4BB9EC'` (lynx-sky). Show game labels on X-axis (G1, G2, G3... or opponent initials if available).

**Empty state:** "Play games to see your scoring trend" with a faint chart placeholder.

**Query (add to shell `loadTeamData`):**
```jsx
// Scoring trend — completed games with scores
const { data: scoringGames } = await supabase
  .from('schedule_events')
  .select('event_date, our_score, opponent_score, opponent_name')
  .eq('team_id', team.id)
  .eq('game_status', 'completed')
  .not('our_score', 'is', null)
  .order('event_date', { ascending: true })
setScoringTrend(scoringGames || [])
```

---

### CARD 2: Win/Loss Breakdown (Donut Chart)

**Position:** Row 1, Col 2

```
┌─────────────────────────┐
│ 🏆 WIN/LOSS             │
│                         │
│      ┌─────┐            │
│     │ 80%  │            │
│     │ WIN  │            │
│      └─────┘            │
│                         │
│  ● 4 Wins  ● 1 Loss    │
│  🔥 4-game win streak   │
└─────────────────────────┘
```

**Data:** Already available as `teamRecord` prop (`{ wins, losses, recentForm }`).

**Chart:** Reuse the `DonutChart` SVG pattern from `DashboardWidgets.jsx`. Two segments: wins (emerald-500) and losses (red-500). Win percentage in center.

Below the donut: Legend with win/loss counts. Current streak (compute from `recentForm` array — count consecutive W's or L's from the end).

**Empty state:** "No completed games yet" with empty donut outline.

---

### CARD 3: Set Analysis (Stacked Bar Chart)

**Position:** Row 1, Col 3

```
┌─────────────────────────┐
│ 📊 SET ANALYSIS         │
│                         │
│  ██   ██   ██   ██  ██  │
│  ██   ██   ██   ░░  ██  │
│  ██   ░░   ██   ░░  ░░  │
│                         │
│  G1   G2   G3   G4  G5  │
│                         │
│  ● Sets Won  ● Sets Lost│
└─────────────────────────┘
```

**Data:** From `schedule_events` where `game_status = 'completed'`. Use `our_sets_won` and `opponent_sets_won` columns.

**Chart:** Custom SVG stacked bars. Each game gets a vertical bar split into sets won (emerald) and sets lost (red/slate). This is volleyball-specific and coaches LOVE this view — "are we closing out in 2 or always going to 3?"

**If `our_sets_won` is null for all games** (data not entered at that level), show: "Enter set scores in Game Day to see this analysis."

**Query (add to shell, can reuse scoringGames with extra columns):**
```jsx
// Already querying schedule_events for scoring trend — just add columns:
.select('event_date, our_score, opponent_score, opponent_name, our_sets_won, opponent_sets_won')
```

---

### CARD 4: Top Performer Spotlight (Photo Card)

**Position:** Row 2, Col 1

```
┌─────────────────────────┐
│ 🏅 TOP PERFORMER        │
│                         │
│  ┌────┐                 │
│  │    │  Sarah J.  #7   │
│  │ 📷 │  OH              │
│  └────┘                 │
│                         │
│  54 K    46 A    20 PTS │
│  ↑ 12%   ↑ 8%   ↑ 15%  │
└─────────────────────────┘
```

**Data:** `topPlayers[0]` from existing prop. Already has photo_url, first_name, last_name, jersey_number, position, and stat totals.

**Trend arrows:** Compare player's per-game averages. If `games_played >= 4`, compare last 2 games' per-game stats vs first 2 games' per-game stats. If higher → ↑ green. If lower → ↓ red. If similar → → neutral.

**For the trend calculation, query `player_game_stats` for this player:**
```jsx
// In shell — only for top player (topPlayers[0])
if (topPlayers.length > 0) {
  const topPlayerId = topPlayers[0].player_id
  const { data: gameStats } = await supabase
    .from('player_game_stats')
    .select('kills, aces, points_scored, created_at')
    .eq('player_id', topPlayerId)
    .order('created_at', { ascending: true })
  
  // Compute early vs late averages
  if (gameStats && gameStats.length >= 4) {
    const half = Math.floor(gameStats.length / 2)
    const early = gameStats.slice(0, half)
    const late = gameStats.slice(half)
    const avg = (arr, key) => arr.reduce((s, g) => s + (g[key] || 0), 0) / arr.length
    setTopPlayerTrend({
      kills: avg(late, 'kills') - avg(early, 'kills'),
      aces: avg(late, 'aces') - avg(early, 'aces'),
      points: avg(late, 'points_scored') - avg(early, 'points_scored'),
    })
  }
}
```

**Empty state:** "Complete games and enter stats to see your top performer."

---

### CARD 5: Stat Leaders — Power Bars (Horizontal Bars)

**Position:** Row 2, Col 2

```
┌─────────────────────────┐
│ 💪 STAT LEADERS         │
│                         │
│ Kills   Sarah   ████ 54 │
│ Aces    Test A  ███░ 46  │
│ Digs    Maya    ██░░ 17  │
│ Blocks  Chloe   █░░░  9  │
│ Assists Ava     █░░░  8  │
│                         │
└─────────────────────────┘
```

**Data:** From `player_season_stats`. For each stat category (kills, aces, digs, blocks, assists), find the player with the highest total. This data is mostly already available from the `topPlayers` query, but we need per-stat leaders.

**Query (add to shell):**
```jsx
// Stat leaders — one query, find max per category
const playerIds = roster.map(r => r.player_id || r.players?.id).filter(Boolean)
if (playerIds.length > 0) {
  const { data: allStats } = await supabase
    .from('player_season_stats')
    .select('player_id, total_kills, total_aces, total_digs, total_blocks, total_assists')
    .in('player_id', playerIds)
    .eq('season_id', selectedSeason.id)
  
  // Build leaders object
  const categories = ['kills', 'aces', 'digs', 'blocks', 'assists']
  const columnMap = { kills: 'total_kills', aces: 'total_aces', digs: 'total_digs', blocks: 'total_blocks', assists: 'total_assists' }
  const leaders = {}
  for (const cat of categories) {
    const col = columnMap[cat]
    const sorted = (allStats || []).sort((a, b) => (b[col] || 0) - (a[col] || 0))
    if (sorted.length > 0 && sorted[0][col] > 0) {
      const player = roster.find(r => (r.player_id || r.players?.id) === sorted[0].player_id)
      leaders[cat] = {
        name: player ? `${player.players?.first_name || ''} ${(player.players?.last_name || '')[0]}.` : '—',
        value: sorted[0][col],
        max: sorted[0][col] // Normalize bar against this value
      }
    }
  }
  setStatLeaders(leaders)
}
```

**Chart:** Custom SVG horizontal bars. Each bar is normalized against the highest value across all categories. Bar color: `lynx-sky`. Background track: `lynx-frost` (light) / `white/[0.06]` (dark).

**Empty state:** "Enter game stats to see your stat leaders."

---

### CARD 6: Player Development (Grouped Bar Chart)

**Position:** Row 2, Col 3

```
┌─────────────────────────┐
│ 📈 PLAYER DEVELOPMENT   │
│                         │
│         K/G  A/G  P/G   │
│ Early   ██   █    ███   │
│ Recent  ████ ██   █████ │
│                         │
│ ↑ Team improving across │
│   all categories        │
└─────────────────────────┘
```

**Data:** Uses `player_game_stats` joined with `game_results` to get per-game team averages, then compares early season vs recent.

**Query (add to shell):**
```jsx
// Player development — per-game team averages across season
const { data: allGameStats } = await supabase
  .from('player_game_stats')
  .select('kills, aces, points_scored, game_result_id, created_at')
  .in('player_id', playerIds)
  .order('created_at', { ascending: true })

if (allGameStats && allGameStats.length > 0) {
  // Group by game_result_id to get per-game team totals
  const byGame = {}
  for (const s of allGameStats) {
    if (!byGame[s.game_result_id]) byGame[s.game_result_id] = { kills: 0, aces: 0, points: 0 }
    byGame[s.game_result_id].kills += s.kills || 0
    byGame[s.game_result_id].aces += s.aces || 0
    byGame[s.game_result_id].points += s.points_scored || 0
  }
  
  const gameArr = Object.values(byGame)
  if (gameArr.length >= 4) {
    const half = Math.floor(gameArr.length / 2)
    const early = gameArr.slice(0, half)
    const recent = gameArr.slice(half)
    const avg = (arr, key) => arr.reduce((s, g) => s + g[key], 0) / arr.length
    
    setDevelopmentData({
      early: { kills: avg(early, 'kills'), aces: avg(early, 'aces'), points: avg(early, 'points') },
      recent: { kills: avg(recent, 'kills'), aces: avg(recent, 'aces'), points: avg(recent, 'points') },
    })
  }
}
```

**Chart:** Custom SVG grouped horizontal bars. Two bars per stat (early = slate/muted, recent = lynx-sky). If recent > early, show an upward trend indicator.

**Empty state:** "Play at least 4 games to see development trends."

---

### CARD 7: Season Highlights — PLACEHOLDER

**Position:** Row 3, Col 1

```
┌─────────────────────────┐
│ 🔥 SEASON HIGHLIGHTS    │
│                         │
│                         │
│   🏆                    │
│                         │
│   Season highlights     │
│   will appear as your   │
│   team plays more games │
│                         │
│                         │
└─────────────────────────┘
```

A placeholder card with a centered icon and message. Style it with a subtle dashed border and muted text to indicate "coming soon."

```jsx
<PerfCard title="Season Highlights" icon={Flame} isDark={isDark}>
  <div className="flex flex-col items-center justify-center h-[160px] text-center">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
      <Trophy className="w-6 h-6 text-lynx-sky" />
    </div>
    <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Season highlights</p>
    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>will appear as your team plays more games</p>
  </div>
</PerfCard>
```

**TODO comment:** `// TODO: Implement streak detection, milestone tracking, career records from player_season_stats and schedule_events`

---

### CARD 8: Placeholder 2

**Position:** Row 3, Col 2

Same visual pattern as Card 7 but with different text:

```jsx
<PerfCard title="Head-to-Head Records" icon={Target} isDark={isDark}>
  <div className="flex flex-col items-center justify-center h-[160px] text-center">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
      <Target className="w-6 h-6 text-lynx-sky" />
    </div>
    <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Head-to-head records</p>
    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Compare performance against each opponent</p>
  </div>
</PerfCard>
```

**TODO comment:** `// TODO: Group schedule_events by opponent_name, compute W/L per opponent, avg score differential`

---

### CARD 9: Placeholder 3

**Position:** Row 3, Col 3

```jsx
<PerfCard title="Player Consistency" icon={Activity} isDark={isDark}>
  <div className="flex flex-col items-center justify-center h-[160px] text-center">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
      <Activity className="w-6 h-6 text-lynx-sky" />
    </div>
    <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Player consistency</p>
    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Track game-to-game reliability and variance</p>
  </div>
</PerfCard>
```

**TODO comment:** `// TODO: Compute standard deviation of per-game stats for each player, rank by consistency`

---

## ═══════════════════════════════════════════════
## PHASE 4: Update Center Column Layout
## ═══════════════════════════════════════════════

**File: `src/components/coach/CoachCenterDashboard.jsx`**

Update the render order to include the new sections:

```jsx
return (
  <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
    
    {/* Row 0: Welcome + Team/Season Switcher */}
    {/* ... keep existing ... */}
    
    {/* Row 1: Hero + Rotating Panel */}
    {/* ... keep existing ... */}
    
    {/* Row 2: Command Strip */}
    <CoachCommandStrip
      nextGame={nextGame}
      lineupSetForNextGame={lineupSetForNextGame}
      rsvpPercentNextGame={rsvpPercentNextGame}
      lastGameStatsEntered={pendingStats === 0}
      avgAttendanceLast3={avgAttendanceLast3}
      weeklyEngagement={weeklyEngagement}
      rosterCount={roster?.length || 0}
      rosterIssues={rosterIssues}
      pendingStats={pendingStats}
      lineupsSet={lineupsSet}
      upcomingGamesCount={upcomingGamesCount}
      onNavigate={onNavigate}
    />
    
    {/* Row 3: Workflow Buttons — NEW */}
    <CoachWorkflowButtons
      teamColor={selectedTeam?.color}
      onNavigate={onNavigate}
      gameDayBadge={gameDayBadge}
      practiceBadge={practiceBadge}
      rosterBadge={rosterBadge}
      scheduleBadge={scheduleBadge}
    />
    
    {/* Row 4: Team Hub + Chat */}
    {/* ... keep existing ... */}
    
    {/* Row 5: Performance Grid — NEW (replaces Quick Attendance) */}
    <CoachPerformanceGrid
      scoringTrend={scoringTrend}
      teamRecord={teamRecord}
      topPlayers={topPlayers}
      topPlayerTrend={topPlayerTrend}
      statLeaders={statLeaders}
      developmentData={developmentData}
      onNavigate={onNavigate}
    />
    
    {/* REMOVE: Quick Attendance section */}
    {/* REMOVE: Mobile Quick Actions (move to sidebar or keep if needed for responsive) */}
    
  </div>
)
```

---

## ═══════════════════════════════════════════════
## PHASE 5: Shell Updates
## ═══════════════════════════════════════════════

**File: `src/pages/roles/CoachDashboard.jsx`**

### New State Variables

```jsx
// Performance grid data
const [scoringTrend, setScoringTrend] = useState([])
const [statLeaders, setStatLeaders] = useState({})
const [topPlayerTrend, setTopPlayerTrend] = useState(null)
const [developmentData, setDevelopmentData] = useState(null)

// Command strip data  
const [avgAttendanceLast3, setAvgAttendanceLast3] = useState(null)
const [weeklyEngagement, setWeeklyEngagement] = useState({ shoutouts: 0, challenges: 0, posts: 0 })
const [rosterIssues, setRosterIssues] = useState(0)
const [lineupSetForNextGame, setLineupSetForNextGame] = useState(false)
const [lineupsSet, setLineupsSet] = useState(0)
const [upcomingGamesCount, setUpcomingGamesCount] = useState(0)

// Workflow button badges
const [newPlayersCount, setNewPlayersCount] = useState(0)
```

### New Queries (add to `loadTeamData`)

Add all queries defined in the card sections above. Wrap each in try/catch so failures are graceful.

**Key queries to add:**

1. **Scoring trend** — `schedule_events` completed games with scores (Card 1 + Card 3 set data)
2. **Stat leaders** — `player_season_stats` max per category (Card 5)
3. **Top player trend** — `player_game_stats` for top player (Card 4)
4. **Development data** — `player_game_stats` grouped by game (Card 6)
5. **Average attendance** — `event_attendance` for last 3 events (Command Strip)
6. **Weekly engagement** — count `shoutouts` + `coach_challenges` active + `team_posts` this week (Command Strip)
7. **Roster issues** — count players with null `jersey_number` or null `position` (Command Strip + Workflow)
8. **New players** — count `team_players` with `joined_at` in last 7 days (Workflow Buttons)
9. **Lineup check for next game** — `game_lineups` count for next game event_id (Command Strip)
10. **Lineups set for upcoming games** — `game_lineups` count grouped by event_id for all upcoming games (Command Strip)

**Average attendance query:**
```jsx
// Avg attendance over last 3 events
try {
  const { data: recentEvents } = await supabase
    .from('schedule_events')
    .select('id')
    .eq('team_id', team.id)
    .lt('event_date', today)
    .order('event_date', { ascending: false })
    .limit(3)
  
  if (recentEvents && recentEvents.length > 0) {
    const eventIds = recentEvents.map(e => e.id)
    const { data: attendance } = await supabase
      .from('event_attendance')
      .select('event_id, status')
      .in('event_id', eventIds)
    
    const totalRecorded = attendance?.length || 0
    const totalPresent = attendance?.filter(a => a.status === 'present').length || 0
    const rosterSize = roster.length || 1
    const expectedTotal = rosterSize * recentEvents.length
    setAvgAttendanceLast3(expectedTotal > 0 ? Math.round((totalPresent / expectedTotal) * 100) : null)
  }
} catch { setAvgAttendanceLast3(null) }
```

**Weekly engagement query:**
```jsx
// Weekly engagement composite
try {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStr = weekAgo.toISOString()
  
  const [shoutRes, postRes] = await Promise.all([
    supabase.from('shoutouts').select('*', { count: 'exact', head: true })
      .eq('team_id', team.id).gte('created_at', weekStr),
    supabase.from('team_posts').select('*', { count: 'exact', head: true })
      .eq('team_id', team.id).gte('created_at', weekStr),
  ])
  
  // Active challenges count
  const { count: challengeCount } = await supabase
    .from('coach_challenges')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id)
    .eq('status', 'active')
  
  setWeeklyEngagement({
    shoutouts: shoutRes.count || 0,
    challenges: challengeCount || 0,
    posts: postRes.count || 0,
  })
} catch { setWeeklyEngagement({ shoutouts: 0, challenges: 0, posts: 0 }) }
```

**Roster issues:**
```jsx
// Count roster issues
const missingJersey = roster.filter(p => !(p.jersey_number ?? p.players?.jersey_number)).length
const missingPosition = roster.filter(p => !(p.players?.position)).length
setRosterIssues(missingJersey + missingPosition)

// New players in last 7 days
const weekAgo = new Date()
weekAgo.setDate(weekAgo.getDate() - 7)
const newPlayers = roster.filter(p => new Date(p.joined_at) > weekAgo).length
setNewPlayersCount(newPlayers)
```

---

## ═══════════════════════════════════════════════
## PHASE 6: Remove Quick Attendance + Cleanup
## ═══════════════════════════════════════════════

1. Remove the Quick Attendance section from `CoachCenterDashboard.jsx`
2. Remove the Mobile Quick Actions cards (the 2x2 grid that shows on mobile). Replace with a slim note: "View full dashboard on desktop for all features" or keep a simpler mobile layout.
3. Verify all imports are correct
4. Verify no dead code references

---

## IMPLEMENTATION ORDER

```bash
# Phase 1: Revise Command Strip
# Edit CoachCommandStrip.jsx — new tiles, status pills
git add -A && git commit -m "Phase 1: Revise command strip — new tiles, status pills, rolling health" && git push

# Phase 2: Workflow Buttons
# Create CoachWorkflowButtons.jsx
git add -A && git commit -m "Phase 2: Add workflow buttons — branded gradient, smart badges" && git push

# Phase 3: Performance Grid
# Create CoachPerformanceGrid.jsx with 9 cards (6 real + 3 placeholder)
git add -A && git commit -m "Phase 3: Add 3x3 performance grid — charts, power bars, placeholders" && git push

# Phase 4: Update Center Column Layout
# Edit CoachCenterDashboard.jsx — integrate new components, remove Quick Attendance
git add -A && git commit -m "Phase 4: Update center column — workflow buttons, performance grid, remove quick attendance" && git push

# Phase 5: Shell Updates
# Edit CoachDashboard.jsx — new state, queries, props
git add -A && git commit -m "Phase 5: Shell updates — scoring trend, stat leaders, engagement, attendance queries" && git push

# Phase 6: Polish
# Dark mode, empty states, responsive, brand compliance
git add -A && git commit -m "Phase 6: Polish — dark mode, empty states, responsive cleanup" && git push
```

---

## DO NOT

- **DO NOT** install recharts, chart.js, d3, or any chart library — use raw SVG (match `DashboardWidgets.jsx` patterns)
- **DO NOT** change any Supabase table schemas
- **DO NOT** modify the nav bar, routing, or MainApp.jsx
- **DO NOT** remove the Coach Blast Modal, Warmup Timer, or Event Detail Modal
- **DO NOT** change FeedPost.jsx, hubStyles.js, or any shared components
- **DO NOT** change the left sidebar or right panel in this update (those were done in V2)
- **DO NOT** change the Hero Card or Rotating Panel (those were done in V2)
- **DO NOT** change the parent dashboard or admin dashboard
- **DO NOT** break the existing Team Hub + Chat preview functionality
- **DO NOT** use `backdrop-blur` anywhere
- **DO NOT** use colors outside the brand system (no blue-500, indigo, purple, etc.)

---

## VERIFICATION CHECKLIST

### Command Strip
- [ ] 6 tiles: Game Prep, Attendance, Engagement, Roster, Stats, Lineups
- [ ] Each tile has a status pill (not a dot) — Healthy / Needs Work / Behind / No Data
- [ ] Pill colors respect dark mode
- [ ] Values are dynamic (not hardcoded)
- [ ] All tiles are tappable with correct navigation

### Workflow Buttons
- [ ] 4 buttons: Game Day, Practice, Roster, Schedule
- [ ] Branded gradient background using team color
- [ ] Notification badges appear when relevant
- [ ] Roster badge includes new players count
- [ ] Hover state: brightness + lift
- [ ] Responsive: 2×2 on mobile, 4×1 on desktop

### Performance Grid
- [ ] 3×3 grid: 6 real cards + 3 placeholders
- [ ] Card 1 (Scoring Trend): Line chart with real game data
- [ ] Card 2 (Win/Loss): Donut chart with win %, streak info
- [ ] Card 3 (Set Analysis): Stacked bars or "enter set scores" message
- [ ] Card 4 (Top Performer): Photo, stats, trend arrows
- [ ] Card 5 (Power Bars): 5 stat categories with leader names
- [ ] Card 6 (Development): Early vs Recent grouped bars
- [ ] Cards 7-9: Placeholder empty states with icons
- [ ] All charts use raw SVG (no chart libraries)
- [ ] All cards have consistent height (~220px)
- [ ] All cards respect dark mode
- [ ] All cards have empty states for insufficient data
- [ ] Grid is responsive: 1 col mobile, 2 col tablet, 3 col desktop

### Data
- [ ] Shell has all new state variables
- [ ] Shell has all new queries in loadTeamData
- [ ] All queries wrapped in try/catch
- [ ] Team switching updates all performance data
- [ ] No console errors
- [ ] App starts with `npm run dev`

### Brand
- [ ] Charts use lynx-sky (#4BB9EC) as primary color
- [ ] No off-brand colors anywhere
- [ ] Workflow buttons use team color gradient (fallback: lynx-sky)
- [ ] All text follows brand typography (no uppercase > 13px)
