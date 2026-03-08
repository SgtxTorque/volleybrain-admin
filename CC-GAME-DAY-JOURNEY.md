# CC-GAME-DAY-JOURNEY.md
## Game Day Journey — Checkpoint System + Visual Unification

**Read `CLAUDE.md`, `DATABASE_SCHEMA.md`, and `public/lynx-brandbook-v2.html` before writing ANY code.**
**Read ALL files referenced in each phase before modifying them.**

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-game-day-journey checkpoint"
```

---

## PROJECT OVERVIEW

This build adds a **Game Day Journey** checkpoint system to the coach's game experience and **visually unifies** all game-related modals/panels into a consistent design language. We are NOT rebuilding existing components — we're wrapping them in a cohesive journey layer and fixing visual inconsistencies.

### What Changes

1. **GameCard** gets a checkpoint progress tracker strip
2. **GamePrepPage** gets a **Game Journey Panel** (slide-out, like PlayerDevelopmentCard) that wraps access to all game phases
3. **All game modals** get unified to consistent Lynx brand styling (dark mode aware, same sizes, same corners, same animation)
4. **Post-game flow** gets a "Quick Entry" path (60-second score entry)
5. **Schedule nudges** surface on coach dashboard

### What Does NOT Change

- GameDayCommandCenter internal logic (court, scoreboard, stats) — untouched
- GamePrepCompletionModal step logic — stays, gets reskinned
- LineupBuilder functionality — stays, gets reskinned
- GameStatsModal functionality — stays, gets reskinned
- All database tables and queries — no schema changes

### Architecture Principle

- **No new npm dependencies.**
- **No new Supabase tables.**
- **Reuse existing components** — wrap, reskin, connect.
- **Every modal must respect dark mode** via `useTheme()` / `useThemeClasses()`.
- **Tele-Grotesk is the app font.** Remove Bebas Neue and Rajdhani from game pages. The tactical blueprint theme was cool but it creates a jarring disconnect from the rest of the app. Game pages should feel like Lynx, not a different app.

---

## BRAND SYSTEM (quick ref — same as roster build)

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

## UNIFIED MODAL STANDARD

**ALL game-related modals/panels MUST follow this pattern:**

```jsx
// Backdrop — consistent across all modals
<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

// Container — theme-aware, consistent sizing
<div className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}>

// Header — consistent structure
<div className={`px-6 py-4 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex items-center justify-between`}>
  <div>
    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Title</h2>
    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Subtitle</p>
  </div>
  <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-lynx-frost'}`}>
    <X className="w-5 h-5" />
  </button>
</div>

// Body — scrollable
<div className="flex-1 overflow-y-auto p-6">
  {/* Content */}
</div>

// Footer — consistent button placement
<div className={`px-6 py-4 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex justify-between`}>
  <button className="secondary">Back/Cancel</button>
  <button className="primary">Next/Save</button>
</div>
```

**Standard sizes:**
- Small modals (stats prompt, quick actions): `max-w-md`
- Medium modals (score entry, attendance): `max-w-2xl`
- Large modals (lineup builder, game detail): `max-w-4xl`
- Full-screen (Command Center only — this is the exception): `fixed inset-0`

**The Command Center is the ONE exception** that goes full-screen. Everything else follows the modal pattern above.

---

## ═══════════════════════════════════════════════════════════
## PHASE 1: Checkpoint Data Model + Computation
## ═══════════════════════════════════════════════════════════

No UI yet — just the logic that powers the checkpoint tracker.

### 1A. Create checkpoint computation utility

**Create: `src/lib/gameCheckpoints.js`**

```js
/**
 * Game Day Journey — Checkpoint computation
 * 
 * Checkpoints:
 * 1. RSVP    — Have players responded? (event_rsvps)
 * 2. LINEUP  — Is a lineup set? (game_lineups)
 * 3. ATTEND  — Has attendance been taken? (event_attendance)
 * 4. GAME    — Is the game in progress or complete? (schedule_events.game_status)
 * 5. SCORES  — Are set/period scores entered? (schedule_events.game_status === 'completed')
 * 6. STATS   — Are player stats entered? (schedule_events.stats_entered)
 */

export const CHECKPOINTS = [
  { id: 'rsvp', label: 'RSVP', icon: '📋', phase: 'prep' },
  { id: 'lineup', label: 'Lineup', icon: '📐', phase: 'prep' },
  { id: 'attend', label: 'Attendance', icon: '✋', phase: 'gameday' },
  { id: 'game', label: 'Game', icon: '🏐', phase: 'gameday' },
  { id: 'scores', label: 'Scores', icon: '📊', phase: 'postgame' },
  { id: 'stats', label: 'Stats', icon: '⭐', phase: 'postgame', optional: true },
]

/**
 * Compute checkpoint states from game + related data
 * Returns: { [checkpointId]: { status, detail } }
 * status: 'not_started' | 'in_progress' | 'done' | 'warning' | 'skipped'
 */
export function computeCheckpoints(game, { rsvpData, hasLineup, attendanceData, rosterCount }) {
  const today = new Date().toISOString().split('T')[0]
  const gameDate = game.event_date
  const isToday = gameDate === today
  const isPast = gameDate < today
  const isCompleted = game.game_status === 'completed'

  // RSVP
  const rsvpCount = rsvpData?.length || 0
  const rsvpYes = rsvpData?.filter(r => r.status === 'yes' || r.status === 'attending').length || 0
  const rsvpNo = rsvpData?.filter(r => r.status === 'no' || r.status === 'not_attending').length || 0
  const rsvpPending = rosterCount - rsvpCount
  let rsvpStatus = 'not_started'
  let rsvpDetail = `${rsvpPending} pending`
  if (rsvpCount > 0 && rsvpPending === 0) { rsvpStatus = 'done'; rsvpDetail = `${rsvpYes} yes, ${rsvpNo} no` }
  else if (rsvpCount > 0) { rsvpStatus = 'in_progress'; rsvpDetail = `${rsvpYes} yes, ${rsvpPending} pending` }
  if (isCompleted) { rsvpStatus = rsvpCount > 0 ? 'done' : 'skipped' }

  // LINEUP
  let lineupStatus = hasLineup ? 'done' : 'not_started'
  let lineupDetail = hasLineup ? 'Set' : 'Not set'
  if (!hasLineup && (isToday || isPast)) lineupStatus = isPast ? 'skipped' : 'warning'
  if (isCompleted && !hasLineup) lineupStatus = 'skipped'

  // ATTENDANCE
  const attendCount = attendanceData?.length || 0
  let attendStatus = attendCount > 0 ? 'done' : 'not_started'
  let attendDetail = attendCount > 0 ? `${attendanceData.filter(a => a.status === 'present').length}/${attendCount} present` : 'Not taken'
  if (isCompleted && attendCount === 0) attendStatus = 'skipped'

  // GAME (in progress)
  let gameStatus = 'not_started'
  let gameDetail = ''
  if (isCompleted) {
    gameStatus = 'done'
    gameDetail = game.game_result === 'win' ? 'Won' : game.game_result === 'loss' ? 'Lost' : game.game_result === 'tie' ? 'Tied' : 'Completed'
  } else if (game.game_status === 'in_progress') {
    gameStatus = 'in_progress'
    gameDetail = 'In progress'
  } else if (isPast) {
    gameStatus = 'warning'
    gameDetail = 'Needs completion'
  }

  // SCORES
  let scoresStatus = 'not_started'
  let scoresDetail = 'Not entered'
  if (isCompleted) {
    scoresStatus = 'done'
    const ourScore = game.our_sets_won ?? game.our_score ?? 0
    const theirScore = game.opponent_sets_won ?? game.opponent_score ?? 0
    scoresDetail = `${ourScore}-${theirScore}`
  } else if (isPast) {
    scoresStatus = 'warning'
    scoresDetail = 'Enter scores'
  }

  // STATS
  let statsStatus = game.stats_entered ? 'done' : 'not_started'
  let statsDetail = game.stats_entered ? 'Entered' : 'Optional'
  if (isCompleted && !game.stats_entered) {
    statsStatus = 'not_started' // not warning — it's optional
    statsDetail = 'Add stats to power leaderboards'
  }

  return {
    rsvp: { status: rsvpStatus, detail: rsvpDetail },
    lineup: { status: lineupStatus, detail: lineupDetail },
    attend: { status: attendStatus, detail: attendDetail },
    game: { status: gameStatus, detail: gameDetail },
    scores: { status: scoresStatus, detail: scoresDetail },
    stats: { status: statsStatus, detail: statsDetail },
  }
}

/**
 * Get the "current" checkpoint — what the coach should focus on next
 */
export function getCurrentCheckpoint(checkpoints) {
  // Priority: warnings first, then first not_started
  const warningId = CHECKPOINTS.find(cp => checkpoints[cp.id]?.status === 'warning')?.id
  if (warningId) return warningId
  
  const nextId = CHECKPOINTS.find(cp => 
    checkpoints[cp.id]?.status === 'not_started' && !cp.optional
  )?.id
  if (nextId) return nextId

  // All required done — suggest optional stats if not done
  const statsNotDone = checkpoints.stats?.status === 'not_started'
  if (statsNotDone) return 'stats'

  return null // all done
}

/**
 * Get completion percentage (excluding optional checkpoints)
 */
export function getCompletionPercent(checkpoints) {
  const required = CHECKPOINTS.filter(cp => !cp.optional)
  const done = required.filter(cp => 
    checkpoints[cp.id]?.status === 'done' || checkpoints[cp.id]?.status === 'skipped'
  )
  return Math.round((done.length / required.length) * 100)
}
```

```bash
git add -A && git commit -m "Phase 1: Game checkpoint computation utility" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 2: Checkpoint Tracker Strip on GameCard
## ═══════════════════════════════════════════════════════════

### 2A. Update GameCard to show checkpoint progress

**File: `src/pages/gameprep/GameCard.jsx`**

Add the checkpoint tracker strip below the opponent name, above the date/time details. This is a compact horizontal row of dots/icons showing progress.

```
┌─────────────────────────────────────────┐
│ 🔴 TODAY                                │
│                                         │
│ vs Frisco Red                           │
│                                         │
│ ● RSVP → ● Lineup → ○ Attend → ○ Game  │  ← NEW
│                        ↑ current        │
│                                         │
│ 📅 Sat, Mar 8  🕐 6:00 PM  🏠 Home    │
│                                         │
│ [Lineup Set ✓]              [Game Day →]│
└─────────────────────────────────────────┘
```

**Checkpoint dot states:**
- `done` → Filled circle, lynx-sky color (`bg-lynx-sky`)
- `in_progress` → Filled circle, amber (`bg-amber-400`)
- `warning` → Pulsing circle, red (`bg-red-400 animate-pulse`)
- `not_started` → Empty circle, muted border (`border-2 border-slate-300 dark:border-slate-600`)
- `skipped` → Filled circle, slate (`bg-slate-400`) with line-through on label
- `current` checkpoint gets a subtle ring/glow to draw the eye

**Implementation:**

Add `checkpoints` as a prop to GameCard. The parent (GamePrepPage) will compute and pass them.

```jsx
// Inside GameCard, after the opponent name, before date/time:
{checkpoints && (
  <div className="flex items-center gap-1 mb-3 overflow-x-auto">
    {CHECKPOINTS.map((cp, idx) => {
      const state = checkpoints[cp.id]
      const isCurrent = currentCheckpoint === cp.id
      return (
        <React.Fragment key={cp.id}>
          {idx > 0 && (
            <div className={`w-3 h-px ${state?.status === 'done' || state?.status === 'skipped' ? 'bg-lynx-sky/50' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          )}
          <div className="flex flex-col items-center gap-0.5" title={`${cp.label}: ${state?.detail || ''}`}>
            <div className={`w-3 h-3 rounded-full transition-all ${
              state?.status === 'done' ? 'bg-lynx-sky' :
              state?.status === 'in_progress' ? 'bg-amber-400' :
              state?.status === 'warning' ? 'bg-red-400 animate-pulse' :
              state?.status === 'skipped' ? 'bg-slate-400' :
              isDark ? 'border-2 border-slate-600' : 'border-2 border-slate-300'
            } ${isCurrent ? 'ring-2 ring-lynx-sky/40 ring-offset-1 ring-offset-transparent' : ''}`} />
            <span className={`text-[8px] font-medium ${
              state?.status === 'done' ? 'text-lynx-sky' :
              state?.status === 'warning' ? 'text-red-400' :
              isCurrent ? (isDark ? 'text-white' : 'text-lynx-navy') :
              isDark ? 'text-slate-600' : 'text-slate-400'
            } ${state?.status === 'skipped' ? 'line-through' : ''}`}>
              {cp.label}
            </span>
          </div>
        </React.Fragment>
      )
    })}
  </div>
)}
```

### 2B. Update GamePrepPage to compute and pass checkpoints

**File: `src/pages/gameprep/GamePrepPage.jsx`**

After loading games, also load RSVP data, lineup statuses, and attendance data for each game. Then compute checkpoints.

```js
import { CHECKPOINTS, computeCheckpoints, getCurrentCheckpoint } from '../../lib/gameCheckpoints'

// In loadGames(), after loading games and lineupStatuses:
// Also load RSVPs and attendance for all games
const allGameIds = allGames.map(g => g.id)

let rsvpMap = {}
if (allGameIds.length > 0) {
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('event_id, player_id, status')
    .in('event_id', allGameIds)
  for (const r of (rsvps || [])) {
    if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = []
    rsvpMap[r.event_id].push(r)
  }
}

let attendMap = {}
if (allGameIds.length > 0) {
  const { data: attend } = await supabase
    .from('event_attendance')
    .select('event_id, player_id, status')
    .in('event_id', allGameIds)
  for (const a of (attend || [])) {
    if (!attendMap[a.event_id]) attendMap[a.event_id] = []
    attendMap[a.event_id].push(a)
  }
}

// Store in state
setRsvpData(rsvpMap)
setAttendanceData(attendMap)

// When rendering GameCard:
const checkpoints = computeCheckpoints(game, {
  rsvpData: rsvpData[game.id] || [],
  hasLineup: !!lineupStatuses[game.id]?.hasLineup,
  attendanceData: attendanceData[game.id] || [],
  rosterCount: roster.length,
})
const current = getCurrentCheckpoint(checkpoints)

<GameCard
  checkpoints={checkpoints}
  currentCheckpoint={current}
  // ... existing props
/>
```

```bash
git add -A && git commit -m "Phase 2: Checkpoint tracker strip on GameCard" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 3: Game Journey Panel
## ═══════════════════════════════════════════════════════════

A slide-out panel (same pattern as PlayerDevelopmentCard) that opens when a coach clicks a game card. Shows the full checkpoint journey with actions for each phase.

### 3A. Create Game Journey Panel

**Create: `src/pages/gameprep/GameJourneyPanel.jsx`**

This is an 800px slide-out panel from the right (matching PlayerDevelopmentCard pattern).

```
┌──────────────────────────────────────────────────────────────┐
│ ✕                                                            │
│                                                              │
│  vs Frisco Red                                               │
│  Sat, Mar 8 · 6:00 PM · Home                                │
│  Black Hornets Elite                                         │
│                                                              │
│  ● RSVP  →  ● Lineup  →  ◌ Attend  →  ○ Game  →  ○ Scores  │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░  40%              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  ✋ ATTENDANCE          ← Current suggested action  │     │
│  │  Take attendance for today's game                    │     │
│  │                                                      │     │
│  │  [ Take Attendance → ]                               │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ ● RSVP          Done │  │ ● Lineup        Done │         │
│  │ 10 yes, 2 no         │  │ Set ✓                │         │
│  │ [View RSVPs]         │  │ [Edit Lineup]        │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐         │
│  │ ○ Game     Not started│  │ ○ Scores  Not entered│         │
│  │                       │  │                      │         │
│  │ [Launch Game Day →]   │  │ [Enter Scores →]     │         │
│  └──────────────────────┘  └──────────────────────┘         │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ ⭐ Stats (Optional)                               │       │
│  │ Add player stats to power leaderboards            │       │
│  │ [Enter Stats →]                                   │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  ─── Game Notes ───                                         │
│  [ Add a note about this game... ]                           │
│                                                              │
│  ─── Previous Matchup ───                                   │
│  vs Frisco Red · Nov 15, 2025 · W 2-1 (25-20, 22-25, 15-11)│
│                                                              │
│  ─── Quick Actions ───                                      │
│  [ 🏐 Command Center ]  [ 📋 Full Game Detail ]             │
└──────────────────────────────────────────────────────────────┘
```

**Key behaviors:**

- **Current checkpoint** is elevated to a hero card at the top with the primary CTA button.
- **Completed checkpoints** show as compact cards with green checks and a "View/Edit" link.
- **Future checkpoints** show as compact cards with muted styling and their CTA.
- **Optional checkpoints** (Stats) show with a subtle "optional" badge.
- Clicking a CTA button opens the EXISTING modal for that phase (LineupBuilder, CompletionModal, StatsModal, etc.)
- **Previous matchup** section: Query schedule_events for previous games vs same opponent_name. Show most recent result.
- **Game notes** section: Quick text input that saves to a notes field on the schedule_event (or a new text area — check if `schedule_events.notes` exists, if not use `schedule_events.description`).

**Panel shell follows PlayerDevelopmentCard pattern:**
```jsx
<div className="fixed inset-0 z-50 flex">
  {/* Backdrop */}
  <div className="flex-1 bg-black/50" onClick={onClose} />
  
  {/* Panel */}
  <div className={`w-[800px] max-w-full h-full overflow-y-auto ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'} shadow-2xl`}>
    {/* Content */}
  </div>
</div>
```

### 3B. Wire GamePrepPage to open Journey Panel

**File: `src/pages/gameprep/GamePrepPage.jsx`**

Replace the current behavior where clicking a game card sets `selectedGame` and then various buttons open different modals. Instead:

- Clicking a game card opens the **GameJourneyPanel**
- The GameJourneyPanel then has buttons that open the individual modals
- The GamePrepPage still owns the modal state and renders the modals

```jsx
const [showJourneyPanel, setShowJourneyPanel] = useState(false)

// When a game card is clicked:
onClick={() => {
  setSelectedGame(game)
  setShowJourneyPanel(true)
}}

// Journey panel callbacks:
<GameJourneyPanel
  game={selectedGame}
  team={selectedTeam}
  roster={roster}
  checkpoints={checkpoints}
  currentCheckpoint={current}
  onClose={() => setShowJourneyPanel(false)}
  onOpenLineup={() => setShowLineupBuilder(true)}
  onOpenCompletion={() => setShowGameCompletion(true)}
  onOpenStats={() => setShowStatsModal(true)}
  onOpenGameDay={() => { setShowJourneyPanel(false); setShowGameDayMode(true) }}
  onOpenDetail={() => setShowGameDetail(true)}
  onOpenAttendance={() => setShowAttendanceModal(true)} // NEW
  onOpenQuickScore={() => setShowQuickScore(true)} // NEW
  showToast={showToast}
/>
```

**IMPORTANT:** GameCard buttons ("Set Lineup →", "Game Day", "Complete") should STILL work as direct shortcuts. The Journey Panel is the detailed view, but quick actions on the card should still fire directly. The Journey Panel is what opens when you click the card BODY (not a button).

```bash
git add -A && git commit -m "Phase 3: Game Journey Panel — slide-out checkpoint hub" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 4: Quick Attendance Modal
## ═══════════════════════════════════════════════════════════

A standalone attendance modal that can be opened from the Journey Panel. The GamePrepCompletionModal already has attendance (Step 3), but coaches need to take attendance BEFORE the game without going through the full completion flow.

### 4A. Create Quick Attendance Modal

**Create: `src/pages/gameprep/QuickAttendanceModal.jsx`**

Simple modal. Shows roster with big present/absent toggles. Saves to `event_attendance`.

- Pre-fills from RSVP data (if player RSVPd "yes" → default to present, "no" → default to absent)
- Present = green card with ✓
- Absent = muted card with ✗
- Tap to toggle
- Save button at bottom
- **Follows the unified modal standard from above**
- `max-w-2xl` size

```
┌─────────────────────────────────────────────────────────┐
│  ✋ Take Attendance                               ✕    │
│  vs Frisco Red · 11 players on roster                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────┐ ← tap to toggle│
│  │ ✓  #7  Sarah Johnson        Present │                │
│  └─────────────────────────────────────┘                │
│  ┌─────────────────────────────────────┐                │
│  │ ✓  #12 Ava Martinez         Present │                │
│  └─────────────────────────────────────┘                │
│  ┌─────────────────────────────────────┐                │
│  │ ✗  #3  Chloe Park           Absent  │                │
│  └─────────────────────────────────────┘                │
│  ...                                                    │
│                                                         │
│  9 present · 2 absent                                   │
├─────────────────────────────────────────────────────────┤
│  [Cancel]                         [Save Attendance ✓]   │
└─────────────────────────────────────────────────────────┘
```

### 4B. Wire Quick Attendance into GamePrepPage

Add `showAttendanceModal` state. Journey Panel's "Take Attendance" button triggers it.

```bash
git add -A && git commit -m "Phase 4: Quick Attendance modal — standalone pre-game attendance" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 5: Quick Score Entry Modal
## ═══════════════════════════════════════════════════════════

The "Sunday morning" flow. Minimal friction score entry without going through the full CompletionModal.

### 5A. Create Quick Score Modal

**Create: `src/pages/gameprep/QuickScoreModal.jsx`**

This is for coaches who just want to log the result. No format selection step (remember the format from last time or default to the org's standard), no attendance, no confirmation step. Just scores → save.

**For set-based sports (volleyball):**
- Show set score inputs immediately (default to Best of 3 for youth, can toggle to Best of 5)
- Auto-calculate W/L from set scores
- Optional: "Quick Stars" — tap 1-3 standout players from the roster
- Save button

**For period-based sports:**
- Show period/quarter score inputs immediately
- Auto-calculate total and W/L
- Optional: Quick Stars
- Save button

```
┌─────────────────────────────────────────────────────────┐
│  📊 Enter Scores                                  ✕    │
│  vs Frisco Red · Sat, Mar 8                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Format: [ Best of 3 ▾ ]                                │
│                                                         │
│        Us    Them                                       │
│  Set 1 [25]  [20]                                       │
│  Set 2 [22]  [25]                                       │
│  Set 3 [15]  [11]                                       │
│                                                         │
│  Result: 🏆 WIN  2-1  (62-56, +6)                      │
│                                                         │
│  ─── Quick Stars (optional) ───                         │
│  Who stood out?                                         │
│  [ Ava ✓ ] [ Sarah ] [ Chloe ✓ ] [ Maya ] ...          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Cancel]                              [Save Game ✓]    │
└─────────────────────────────────────────────────────────┘
```

**Quick Stars** — tapping a player name toggles a highlight. Starred players get:
- A `shoutout` record created (category: 'game_star', message: auto-generated)
- Shows on the Team Wall as "⭐ Game Stars: Ava, Chloe stood out vs Frisco Red"

### 5B. Quick Score saves the same data as CompletionModal

The save function should update `schedule_events` with:
- `game_status: 'completed'`
- `scoring_format`
- `our_score`, `opponent_score`, `point_differential`
- `game_result` (win/loss/tie)
- `set_scores` or `period_scores`
- `our_sets_won`, `opponent_sets_won` (for set-based)
- `completed_at`, `completed_by`

This is the same save logic as `GamePrepCompletionModal.completeGame()` — extract it to a shared utility or call the same function.

### 5C. Wire Quick Score into flows

- Journey Panel "Enter Scores" button → opens QuickScoreModal
- GameCard "Complete" button for past games → opens QuickScoreModal (not the full CompletionModal)
- Stats Pending banner "Enter Stats" button → still opens StatsModal (unchanged)
- GamePrepCompletionModal stays available from the Journey Panel as "Full Game Completion" for coaches who want the format selection + attendance + confirmation flow

```bash
git add -A && git commit -m "Phase 5: Quick Score modal — 60-second post-game score entry with Quick Stars" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 6: Visual Unification — Reskin All Modals
## ═══════════════════════════════════════════════════════════

This is the pass that makes everything feel like one app. Apply the unified modal standard to all existing game modals.

### 6A. GamePrepPage — Remove tactical blueprint theme

**File: `src/pages/gameprep/GamePrepPage.jsx`**

- Remove the `gpStyles` CSS string entirely (the `.gp-wrap`, `.gp-card`, `.gp-label` classes)
- Remove the `<style>{gpStyles}</style>` tag
- Remove the Bebas Neue / Rajdhani font loading block
- Replace `.gp-wrap` with standard Lynx page background: `${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`
- Replace `.gp-card` with standard card styling: `${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'} border rounded-xl`
- Replace `.gp-label` with standard label: `text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`
- Replace the Bebas Neue heading with standard Tele-Grotesk bold
- Keep the page structure and layout — just restyle it

The GamePrepPage should look and feel like every other Lynx page (CoachDashboard, RosterManager, SchedulePage).

### 6B. GameCard — Restyle to Lynx brand

**File: `src/pages/gameprep/GameCard.jsx`**

- Replace inline `rgba()` background styles with Lynx brand classes
- Card: `${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'} border rounded-xl`
- Top color bar: keep team color gradient (this is the one place team color is used — as an accent, not a theme)
- Buttons: use `bg-lynx-sky hover:bg-lynx-deep text-white` for primary, standard secondary for others
- Remove gradient buttons (`from-[var(--accent-primary)] to-purple-500`) — use flat lynx-sky
- Text: use `${isDark ? 'text-white' : 'text-lynx-navy'}` for headings, `${isDark ? 'text-slate-400' : 'text-lynx-slate'}` for secondary

### 6C. GamePrepCompletionModal — Make theme-aware

**File: `src/pages/gameprep/GamePrepCompletionModal.jsx`**

Currently always white/light. Add theme awareness:
- Import `useTheme, useThemeClasses`
- Replace `bg-white` container with `${isDark ? 'bg-lynx-charcoal' : 'bg-white'}`
- Replace `text-slate-800` with `${isDark ? 'text-white' : 'text-lynx-navy'}`
- Replace `bg-slate-50` inner cards with `${isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'}`
- Replace `border-slate-200` with `${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'}`
- Step indicators: use lynx-sky for active, emerald for done, muted for pending
- Container: `rounded-xl max-w-3xl` (standardize from current `rounded-3xl max-w-2xl`)
- Backdrop: `bg-black/70` (standardize)

### 6D. LineupBuilder — Standardize shell

**File: `src/pages/schedule/LineupBuilder.jsx`**

- Remove `backdrop-blur-sm` from backdrop (brand rule: no backdrop-blur)
- Backdrop: `bg-black/70`
- Container: already uses `tc.cardBg rounded-xl max-w-4xl` — this is good, keep it
- Verify header follows the standard pattern

### 6E. GameDetailModal — Already mostly good

**File: `src/components/games/GameDetailModal.jsx`**

- Backdrop: change `bg-black/80` to `bg-black/70`
- Verify it follows the standard pattern. Likely just minor tweaks.

### 6F. GameStatsModal — Standardize

**File: Inside `src/components/games/GameComponents.jsx`**

- Backdrop: standardize to `bg-black/70`
- Container: keep `max-w-md` for the simple score entry, but expand to `max-w-3xl` for the full stats grid
- Ensure theme-aware throughout

### 6G. StatsPrompt popup — Make theme-aware

**File: `src/pages/gameprep/GamePrepPage.jsx` (inline)**

- Replace `bg-white rounded-3xl` with theme-aware card
- Replace `text-gray-900/500/400` with Lynx text classes

### 6H. AdvancedLineupBuilder — Remove backdrop-blur

**File: `src/components/games/AdvancedLineupBuilder.jsx`**

- Simple shell: Remove `backdrop-blur-sm`, standardize backdrop to `bg-black/70`
- Full-screen mode: Keep as-is (it's a complex layout)

```bash
git add -A && git commit -m "Phase 6: Visual unification — all game modals follow Lynx brand standard" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 7: Dashboard Nudges
## ═══════════════════════════════════════════════════════════

Surface game-related reminders on the coach dashboard.

### 7A. Add nudges to CoachCommandStrip

**File: `src/components/coach/CoachCommandStrip.jsx`**

The Command Strip already shows compact metrics. Add game-aware nudges:

- **"Game in X days"** — if next game is within 3 days, show countdown
- **"Lineup not set"** — if next game within 3 days and no lineup
- **"X games need scores"** — count of completed games without scores

These should be computed from the data already loaded in CoachDashboard (events, lineupStatuses).

### 7B. Add nudges to CoachWorkflowButtons

**File: `src/components/coach/CoachWorkflowButtons.jsx`**

The workflow buttons already have badge counts. Wire them to game checkpoint data:

- **Game Day button** badge: number of games today or tomorrow that need attention
- Navigate to `/gameprep` when clicked

### 7C. Add "Games Need Scores" banner to CoachDashboard

If there are completed games without scores entered, show a subtle banner similar to the one GamePrepPage already has. Link to `/gameprep?tab=results`.

```bash
git add -A && git commit -m "Phase 7: Dashboard nudges — game countdown, lineup reminders, score prompts" && git push
```

---

## ═══════════════════════════════════════════════════════════
## PHASE 8: Polish
## ═══════════════════════════════════════════════════════════

### 8A. Dark Mode Verification

Test every modified component in both light and dark mode:
- GamePrepPage
- GameCard with checkpoint strip
- GameJourneyPanel
- QuickAttendanceModal
- QuickScoreModal
- GamePrepCompletionModal (newly themed)
- All other reskinned modals

### 8B. Empty States

- No games scheduled → "Schedule games from the Schedule page"
- No RSVP data → "RSVPs not collected for this game"
- No previous matchup → Don't show the section
- No roster → "Add players to your team first"

### 8C. Loading States

- Journey Panel: skeleton cards while loading checkpoint data
- Quick Attendance: spinner while saving
- Quick Score: spinner while saving

### 8D. Responsive

- Journey Panel: full width on mobile
- GameCard checkpoint strip: horizontal scroll on very small screens
- Quick modals: full-width on mobile

### 8E. Transitions

- Journey Panel slides in from right (same as PlayerDevelopmentCard)
- Modals fade in
- Checkpoint dots animate when status changes

```bash
git add -A && git commit -m "Phase 8: Polish — dark mode, empty states, loading, responsive" && git push
```

---

## DO NOT

- **DO NOT** rewrite GameDayCommandCenter internals — it works, don't touch it
- **DO NOT** delete GamePrepCompletionModal — it stays as the "full" completion path
- **DO NOT** change database schema — use existing tables and columns
- **DO NOT** install new npm dependencies
- **DO NOT** use backdrop-blur anywhere
- **DO NOT** use Bebas Neue or Rajdhani fonts — Tele-Grotesk only
- **DO NOT** use team colors for styling (except the thin accent bar on GameCard)
- **DO NOT** change the coach dashboard 3-column layout
- **DO NOT** modify nav structure or routing
- **DO NOT** break the existing GameCard button shortcuts (Set Lineup, Game Day, Complete)
- **DO NOT** change how the Command Center launches — it should still go full-screen

---

## VERIFICATION CHECKLIST

### Checkpoint System
- [ ] `gameCheckpoints.js` correctly computes all 6 checkpoint states
- [ ] Checkpoints update when data changes (lineup set, attendance taken, scores entered)
- [ ] `getCurrentCheckpoint` returns the right next action based on game timeline
- [ ] Completion percentage calculates correctly

### GameCard
- [ ] Checkpoint tracker strip renders on all game cards
- [ ] Current checkpoint is visually highlighted
- [ ] Done checkpoints show lynx-sky filled dots
- [ ] Warning checkpoints pulse red
- [ ] Optional (stats) shows differently than required
- [ ] Card buttons still work as direct shortcuts

### Game Journey Panel
- [ ] Opens as slide-out from right
- [ ] Shows all 6 checkpoints with correct states
- [ ] Current checkpoint elevated as hero card
- [ ] Each checkpoint CTA opens the correct modal
- [ ] Previous matchup section shows when data exists
- [ ] Closes on backdrop click and X button

### Quick Attendance Modal
- [ ] Shows full roster with toggle
- [ ] Pre-fills from RSVP data
- [ ] Saves to event_attendance
- [ ] Present/absent counts update in real time
- [ ] Theme-aware

### Quick Score Modal
- [ ] Set score inputs render correctly
- [ ] Auto-calculates W/L from set scores
- [ ] Quick Stars player selection works
- [ ] Saves all required fields to schedule_events
- [ ] Creates shoutout records for starred players
- [ ] Format selector defaults intelligently
- [ ] Under 60 seconds to complete for simple games

### Visual Unification
- [ ] GamePrepPage uses Lynx brand (no tactical blueprint theme)
- [ ] All modals use consistent backdrop (bg-black/70)
- [ ] All modals use consistent container styling
- [ ] All modals are dark mode aware
- [ ] No backdrop-blur anywhere
- [ ] No Bebas Neue or Rajdhani font usage
- [ ] All buttons use lynx-sky / lynx-deep palette
- [ ] Consistent rounded-xl corners (except full-screen Command Center)

### Dashboard Nudges
- [ ] Command Strip shows game countdown when game within 3 days
- [ ] "Games need scores" count displays when applicable
- [ ] Workflow button badge reflects game status

### Brand Compliance
- [ ] All interactive elements use lynx-sky (#4BB9EC)
- [ ] All hover states use lynx-deep (#2A9BD4)
- [ ] No off-brand colors (no purple gradients, no arbitrary blues)
- [ ] Tele-Grotesk font throughout
- [ ] Consistent with rest of Lynx app (dashboard, roster manager, schedule)

```bash
git add -A && git commit -m "Game Day Journey — complete build" && git push
```
