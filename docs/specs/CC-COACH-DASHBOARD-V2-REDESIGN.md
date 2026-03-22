# CC-COACH-DASHBOARD-V2-REDESIGN.md
## Coach Dashboard — Full Redesign Plan

**Read `CLAUDE.md`, `DATABASE_SCHEMA.md`, and `public/lynx-brandbook-v2.html` before writing ANY code.**

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-coach-v2-redesign checkpoint"
```

---

## OVERVIEW

The Coach Dashboard is being redesigned from the current layout into a purpose-driven 3-column layout that serves three coach mental modes:

1. **"What needs my attention?"** → Left Sidebar
2. **"Let me get work done"** → Center Workspace
3. **"How's my team doing?"** → Right Panel

### Architecture

The thin shell stays at `src/pages/roles/CoachDashboard.jsx`. It owns all hooks, data fetching, and state. Child components receive props.

**Files to rewrite:**
- `src/components/coach/CoachLeftSidebar.jsx` — rewrite
- `src/components/coach/CoachCenterDashboard.jsx` — rewrite
- `src/components/coach/CoachRosterPanel.jsx` — rewrite (rename conceptually to "Team Panel")
- `src/components/coach/CoachGameDayHero.jsx` — rewrite (compact version)
- `src/pages/roles/CoachDashboard.jsx` — update props, add new state/queries

**New files to create:**
- `src/components/coach/CoachCommandStrip.jsx` — smart status tiles row
- `src/components/coach/GameDayChecklist.jsx` — prep checklist for next event
- `src/components/coach/RotatingPanel.jsx` — auto-rotating card container (Season Totals ↔ Checklist)

**Shared helpers (already exist from Phase 6):**
- `src/lib/date-helpers.js` — formatTime12, countdownText, etc.

---

## BRAND SYSTEM (apply everywhere)

```
Interactive accent:    text-lynx-sky / bg-lynx-sky (#4BB9EC)
Hover:                 text-lynx-deep / bg-lynx-deep (#2A9BD4)
Highlight (light):     bg-lynx-ice (#E8F4FD)
Primary text (light):  text-lynx-navy (#10284C)  |  (dark): text-white
Secondary text:        text-lynx-slate (#5A6B7F)  |  (dark): text-slate-400
Borders (light):       border-lynx-silver  |  (dark): border-lynx-border-dark
Page bg:               bg-lynx-cloud (light)  |  bg-lynx-midnight (dark)
Cards:                 bg-white (light)  |  bg-lynx-charcoal (dark)
Inner panels:          bg-lynx-frost (light)  |  bg-lynx-graphite (dark)
Card border-radius:    rounded-xl (12px)
Button border-radius:  rounded-[10px]
Badge border-radius:   rounded-md (6px)
Pill border-radius:    rounded-full (999px)
Shadow (light):        shadow-sm  |  (dark): shadow-[0_1px_3px_rgba(0,0,0,.3)]
No backdrop-blur. No pure black. No multiple accent colors. No ALL-CAPS > 13px.
Fallback team color:   #4BB9EC (lynx-sky)
```

---

## SCHEMA REFERENCE (key tables for this redesign)

**IMPORTANT: Read this before writing any Supabase queries. Use EXACT column names.**

### schedule_events
`id, team_id, event_type (text: 'game'|'practice'|'tournament'), title, event_date (date), event_time (time), venue_name, venue_address, opponent_name, game_status (text: 'completed'|null), game_result (text: 'win'|'loss'|null), stats_entered (boolean), our_score, opponent_score, season_id`

### event_rsvps
`id, event_id (FK→schedule_events), player_id (FK→players), status (text: 'going'|'yes'|'maybe'|'no'|'not_going'), responded_by, responded_at`

### game_lineups
`id, event_id (FK→schedule_events), team_id (FK→teams), player_id (FK→players), rotation_order, is_starter, is_libero, position, is_published`

### team_players
`id, team_id, player_id, jersey_number (integer, nullable), is_primary_team, joined_at`

### players
`id, first_name, last_name, photo_url, jersey_number, position, parent_name, parent_email, parent_phone, status`

### player_season_stats
`id, player_id, team_id, season_id, games_played, total_kills, total_aces, total_digs, total_blocks, total_assists, total_points, total_serves, total_service_errors, total_attacks, total_attack_errors, total_receptions, total_reception_errors`

### shoutouts
`id, giver_id, giver_role, receiver_id, receiver_role, team_id, organization_id, category_id, category (text), message, show_on_team_wall, post_id, created_at`

### coach_challenges
`id, coach_id, team_id, organization_id, title, description, challenge_type, metric_type, stat_key, target_value (integer), xp_reward (integer), starts_at, ends_at, status (text: 'active'|'completed'|'expired'), post_id, created_at`

### challenge_participants
`id, challenge_id (FK→coach_challenges), player_id, current_value (integer), completed (boolean), completed_at, opted_in_at`

### chat_channels
`id, season_id, team_id, name, channel_type, created_by, is_archived`

### chat_messages
`id, channel_id (FK→chat_channels), sender_id, content, message_type, is_deleted, created_at`

### team_posts
`id, team_id, author_id, post_type (text: 'announcement'|'photo'|'game_recap'|'shoutout'|'milestone'|'challenge'), title, content, media_urls, is_pinned, is_published, reaction_count, comment_count, created_at`

### team_coaches
`id, team_id, coach_id, role (text: 'head'|'assistant'|'coach')`

### teams
`id, name, color, season_id` — joins: `seasons(name, sports(name, icon))`

---

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HORIZONTAL NAV BAR (full-bleed)                                        │
├──────────────┬──────────────────────────────────────┬───────────────────┤
│              │                                      │                   │
│  LEFT        │  CENTER                              │  RIGHT            │
│  SIDEBAR     │  WORKSPACE                           │  TEAM PANEL       │
│  240px       │  flex-1 (scrollable)                 │  330px            │
│  (sticky)    │                                      │  (scrollable)     │
│              │                                      │                   │
│  border-r    │                                      │  border-l         │
│              │                                      │                   │
└──────────────┴──────────────────────────────────────┴───────────────────┘
```

Main container (same as current):
```jsx
<div className={`flex h-[calc(100vh-4rem)] overflow-hidden ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
  <CoachLeftSidebar ... />
  <CoachCenterDashboard ... />
  <CoachRightPanel ... />
</div>
```

---

## ═══════════════════════════════════════════════
## LEFT SIDEBAR (240px) — Coach Command Post
## ═══════════════════════════════════════════════

**File: `src/components/coach/CoachLeftSidebar.jsx`**

This column answers: "Who am I, what's my status, what needs my attention?"

Scrollable, sticky. Hidden below `xl` breakpoint.

### Content (top to bottom):

---

### 1. Coach Identity Card

Same structure as current but tighter:

```
┌─────────────────────────────┐
│ [Team Color] [Team Initial] │
│  Team Name                  │
│  Season · Sport             │
│  Head Coach · Carlos        │
└─────────────────────────────┘
```

- Team color square (w-12 h-12 rounded-xl) with team initial
- Team name (text-sm font-bold, truncate)
- Season + Sport (text-xs text-lynx-slate)
- Role + Coach name (text-xs text-lynx-slate)
- Keep as-is from current. No changes needed.

---

### 2. Coach Stat Badges (row of 3)

Same as current: Players | Teams | Win %
Keep exactly as-is.

---

### 3. Coach Onboarding Journey (PLACEHOLDER)

**This is a placeholder card. Do NOT build the engine. Just the UI shell with mock data.**

Pattern: Match the Admin's "Setup Progress 5/7" card from `OrgSidebar.jsx`.

```
┌─────────────────────────────┐
│  Coach Setup          3/7   │
│  ████████░░░░░░░  43%       │
│  NEXT: Set up your lineup › │
└─────────────────────────────┘
```

Implementation:
```jsx
{/* Coach Onboarding — placeholder until journey engine is built */}
{/* TODO: Wire to JourneyContext once coach journey steps are defined */}
<div className={`${cardBg} rounded-xl shadow-sm p-4`}>
  <div className="flex items-center justify-between mb-2">
    <span className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>Coach Setup</span>
    <span className="text-xs font-bold text-lynx-sky">3/7</span>
  </div>
  <div className={`h-2 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'} overflow-hidden mb-2`}>
    <div className="h-full rounded-full bg-lynx-sky" style={{ width: '43%' }} />
  </div>
  <button className={`flex items-center gap-2 text-xs font-semibold ${secondaryText} hover:text-lynx-sky w-full`}>
    <span>NEXT:</span>
    <span className={primaryText}>Set up your lineup</span>
    <ChevronRight className="w-3 h-3 ml-auto" />
  </button>
</div>
```

Mock steps (for reference, not displayed yet):
1. Complete your profile
2. Review your roster
3. Set up your first lineup
4. Take attendance at first practice
5. Send your first shoutout
6. Enter game stats
7. Create a challenge

---

### 4. Needs Attention

Same pattern as current but **expanded with smarter items**.

Current items (keep):
- Games needing stats entered
- Pending RSVPs

New items to add (compute in the shell, pass as props):
- Upcoming events with no lineup set (query `game_lineups` for next game)
- Players with no jersey number (check roster for `jersey_number IS NULL`)
- Unread parent messages (if chat unread count available)

Each item: colored dot + label + chevron → tappable to fix page.

Empty state: "All caught up! ✅"

**The shell (`CoachDashboard.jsx`) computes these and passes them as `needsAttentionItems` array — same interface as current.** Just add more items to the array.

---

### 5. Quick Actions

Vertical list with icons. Same pattern as current but **add "Give Shoutout"**:

```
✅ Take Attendance      →
📨 Message Parents      →
⏱  Start Warmup        →
⭐ Give Shoutout        →   ← NEW
👥 Team Hub             →
💬 Team Chat            →
```

The "Give Shoutout" action opens the `GiveShoutoutModal` (already exists in the codebase — check `src/components/engagement/` or similar). Pass an `onShowShoutout` callback from the shell.

---

## ═══════════════════════════════════════════════
## CENTER WORKSPACE (flex-1) — The Main Stage
## ═══════════════════════════════════════════════

**File: `src/components/coach/CoachCenterDashboard.jsx`**

Scrollable. This is where coaches DO things.

### Content (top to bottom):

---

### Row 0: Welcome + Team/Season Switcher

Compact bar. Same width as center column.

```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome back, Carlos                              Spring 2026 ▾│
│  Black Hornets Elite · Spring 2026                              │
│                                                                 │
│  [ Black Hornets Elite ]  [ BH Stingers ]  [ 13U ]            │
└─────────────────────────────────────────────────────────────────┘
```

- Welcome message + season dropdown on right (keep from current)
- Team pills below if multi-team (keep from current)
- **Make this section tighter** — reduce vertical padding. Welcome text `text-xl` instead of `text-2xl`. Subtitle `text-xs`.

---

### Row 1: Hero Card + Rotating Panel (side by side)

**This is the key new layout.**

```
┌────────────────────────────────────┬─────────────────────────┐
│                                    │  ● ○                    │
│   NEXT GAME DAY                    │  SEASON TOTALS          │
│                                    │  109  54  46  17        │
│   [B] ←— VS —→ 🏐                 │  PTS  K   A   DIG       │
│   BH Elite    Frisco Red           │  54   9   3             │
│                                    │  AST  BLK GAMES         │
│   ⏱  1d 4h 22m                    │                         │
│   📅 Sun Mar 1 · 6:00 PM          │  View Full Stats →      │
│   📍 Fieldhouse                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│                                    │  ○ ●                    │
│   [Lineup Builder] [Game Day Hub]  │  GAME DAY CHECKLIST     │
│                                    │  ✅ Lineup set          │
│                                    │  ✅ RSVPs checked       │
│                                    │  ⬜ Last game stats     │
│                                    │  ⬜ Parent reminder     │
│                                    │                         │
│                                    │  2/4 ready              │
└────────────────────────────────────┴─────────────────────────┘
```

**Grid: `grid grid-cols-5 gap-4`** — Hero takes `col-span-3`, Rotating Panel takes `col-span-2`.

#### Hero Card (Compact)

- **KEEP the hero aesthetic** — background image with team color overlay, VS display, countdown, action buttons
- **Reduce height**: `min-height: 280px` instead of the current unconstrained height
- **ADD live countdown timer**: `⏱ 1d 4h 22m` that ticks down. Use a `useEffect` with `setInterval` updating every minute (not every second — too resource-heavy for a dashboard)
- Date/time/venue below the countdown
- Two action buttons: `[Lineup Builder]` `[Game Day Hub]`
- When next event is practice: same compact size, practice variant
- When no events: season record fallback (already built)

#### Rotating Panel (NEW component)

**File: `src/components/coach/RotatingPanel.jsx`**

A container that holds 2 child panels and auto-rotates between them.

```jsx
function RotatingPanel({ children, interval = 8000 }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const panelCount = React.Children.count(children)

  useEffect(() => {
    if (paused || panelCount <= 1) return
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % panelCount)
    }, interval)
    return () => clearInterval(timer)
  }, [paused, panelCount, interval])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-full"
    >
      {/* Active panel */}
      {React.Children.toArray(children)[activeIndex]}

      {/* Dot indicators at bottom */}
      {panelCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {Array.from({ length: panelCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === activeIndex ? 'bg-lynx-sky' : isDark ? 'bg-white/20' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Behavior:**
- Auto-rotates every 8 seconds
- **Pauses on hover** (desktop) — so coaches can interact with checklist without it rotating away
- Dot indicators at bottom (●○) — clickable to jump
- Smooth fade transition between panels (use opacity transition, not slide)

**Panel A: Season Totals**

Compact 2-row grid of stat boxes. Same data as current but in a tighter layout:

```
┌──────┬──────┬──────┬──────┐
│ 109  │  54  │  46  │  17  │
│ PTS  │ KILL │ ACE  │ DIG  │
├──────┼──────┼──────┼──────┤
│  54  │   9  │   3  │      │
│ AST  │ BLK  │GAMES │      │
└──────┴──────┴──────┴──────┘
  View Full Stats →
```

Clickable → navigates to leaderboards.

**Panel B: Game Day Checklist**

**File: `src/components/coach/GameDayChecklist.jsx`**

Dynamic checklist that auto-populates based on the next event type.

For a **GAME**:
- ⬜/✅ Lineup set for this game
- ⬜/✅ RSVPs reviewed (X/Y responded)
- ⬜/✅ Stats entered from last game
- ⬜/✅ Parent reminder sent

For a **PRACTICE**:
- ⬜/✅ Attendance plan ready
- ⬜/✅ Last game stats reviewed
- ⬜/✅ Practice focus set (optional, manual check)

**Auto-check logic** (computed in the shell, passed as props):
- "Lineup set" → check if `game_lineups` table has a row for the next game's event_id. **If the table doesn't exist or returns empty, show unchecked with TODO comment.**
- "RSVPs reviewed" → check if rsvpCounts for next event show total >= 80% of roster
- "Stats entered from last game" → `pendingStats === 0`
- "Parent reminder sent" → **Manual check only for now.** Store in local state (not persisted). TODO: wire to messages table.

**Progress indicator at bottom:** "2/4 ready" with a mini progress bar.

**When all items checked:** Show "Ready for Game Day ✅" with a subtle emerald glow border (`ring-1 ring-emerald-500/25`).

**When no upcoming events:** Show "No upcoming events — enjoy the break! 🎉"

---

### Row 2: Coach Command Strip

**File: `src/components/coach/CoachCommandStrip.jsx`**

A single horizontal row of 6 compact smart tiles. Each shows a status number AND acts as a shortcut.

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 📋       │ 🏐       │ ✉️       │ ⭐       │ 📊       │ 💬       │
│ 8/12     │ 2 set    │ 10/12    │ 3 week   │ 2 need   │ 1 new    │
│Attendance│ Lineups  │ RSVPs    │ Shoutouts│ Stats    │ Messages │
│  ● green │  ● green │  ● amber │  ● green │  ● red   │  ● amber │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Grid:** `grid grid-cols-3 md:grid-cols-6 gap-3`

Each tile:
```jsx
<button onClick={action} className={`${cardBg} rounded-xl shadow-sm p-3 text-center hover:shadow-md transition group`}>
  <Icon className="w-5 h-5 mx-auto mb-1 text-lynx-sky" />
  <p className={`text-lg font-bold ${primaryText}`}>{value}</p>
  <p className={`text-[10px] uppercase tracking-wider font-bold ${secondaryText}`}>{label}</p>
  {/* Status dot */}
  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 ${statusColor}`} />
</button>
```

**Tile definitions:**

| Tile | Icon | Value | Status Logic | Tap → |
|------|------|-------|-------------|-------|
| Attendance | ClipboardCheck | `{marked}/{total}` for next event | green if 100%, amber if partial, gray if no event | attendance page |
| Lineups | ClipboardList | `{count} set` or "None" | green if lineup exists for next game, amber if game soon + no lineup, gray otherwise | gameprep page |
| RSVPs | UserCheck | `{responded}/{total}` | green if >80%, amber if 50-80%, red if <50% | schedule page |
| Shoutouts | Star | `{count} week` (shoutouts given this week) | green if ≥3, amber if 1-2, gray if 0 | opens GiveShoutoutModal |
| Stats | BarChart3 | `{pending} need` | green if 0, red if >0 | gameprep page |
| Messages | MessageCircle | `{unread} new` or "0" | amber if unread >0, green if 0 | chats page |

**Data sources:**
- Attendance: from `rsvpCounts` for next event + roster length (uses `event_rsvps` table)
- Lineups: query `game_lineups` table — `SELECT count(*) FROM game_lineups WHERE event_id = nextGame.id AND team_id = selectedTeam.id`. If count > 0, show "{count} set". Shell computes and passes as prop.
- RSVPs: from `rsvpCounts` for next event (uses `event_rsvps` table)
- Shoutouts: from `weeklyShoutouts` state — counts rows in `shoutouts` table where `team_id` matches and `created_at > 7 days ago`
- Stats: from existing `pendingStats` — counts `schedule_events` where `game_status = 'completed'` AND `stats_entered = false`
- Messages: query unread count from `chat_messages` — `SELECT count(*) FROM chat_messages WHERE channel_id = teamChannelId AND created_at > lastReadTimestamp`. **If too complex for now, show "—" with TODO comment.**

---

### Row 3: Team Hub + Chat Preview (side by side)

**Keep from current but reduce height.**

```
┌──────────────────────────────┬──────────────────────────────┐
│  TEAM HUB     Go To Team →  │  TEAM CHAT     Go to Chat →  │
│                              │                              │
│  [Latest post with FeedPost] │  [Last 3-4 chat bubbles]    │
│                              │  [Quick reply input]         │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Grid:** `grid grid-cols-1 md:grid-cols-2 gap-4`

- Same implementation as current (FeedPost on left, chat on right)
- Add `max-h-[300px] overflow-hidden` to each card to prevent runaway height
- Keep the inline chat reply functionality

---

### Row 4: Quick Attendance Panel (conditional)

**Keep from current.** Only shows if there's an upcoming event. The expandable attendance tracker where you can mark players present/absent inline.

- Already well-built, keep as-is
- Only shows on mobile AND desktop (remove the `lg:hidden` restriction so it appears for everyone — it's useful)

---

### Row 5: Mobile Quick Actions (lg:hidden only)

Keep the mobile-only quick action cards for small screens where the left sidebar is hidden. Same as current.

---

## ═══════════════════════════════════════════════
## RIGHT PANEL (330px) — Team At A Glance
## ═══════════════════════════════════════════════

**File: `src/components/coach/CoachRosterPanel.jsx`**

This column answers: "How's my team doing?" Everything is team-specific.

Scrollable, hidden below `lg` breakpoint.

### Content (top to bottom):

---

### 1. Season Record (keep, top position)

Same as current. W-L, win rate, recent form badges. No changes.

---

### 2. Next 3 Events (MOVED UP from bottom)

Promote this higher — coaches check upcoming schedule constantly.

```
┌─────────────────────────────────┐
│ 📅 UPCOMING              Sched →│
├─────────────────────────────────┤
│  Sat  GAME  vs Frisco · 6 PM   │
│   1   ────  10✓ 2✗              │
│                                 │
│  Tue  PRACTICE  · 7 PM         │
│   4   ────  8✓                  │
│                                 │
│  Sat  GAME  vs Dallas · 5 PM   │
│   8   ────  3✓                  │
└─────────────────────────────────┘
```

Same component as current but:
- Show **RSVP summary** on each event row: `10✓ 2✗` (going/declined)
- Limit to **3 events** (not 4)
- Each row tappable → opens event detail modal

---

### 3. Top Players / Leaderboard (keep)

Same as current. Top 5 with kills, aces, PPG.
Move below events (was position 2, now position 3).

---

### 4. Active Challenges (NEW — uses real data)

```
┌─────────────────────────────────┐
│ 🏆 CHALLENGES       Create + → │
├─────────────────────────────────┤
│  Ace Challenge                  │
│  ████████░░░ 3/5 completed     │
│  Ends in 3 days                 │
│                                 │
│  Kill Streak                    │
│  ██░░░░░░░░ 1/5 completed      │
│  Ends in 5 days                 │
└─────────────────────────────────┘
```

**Schema:** `coach_challenges` table has `id, team_id, title, description, challenge_type, target_value, starts_at, ends_at, status, xp_reward`. Progress comes from `challenge_participants` table with `challenge_id, player_id, current_value, completed`.

**Query:** Already defined in Shell Updates section. The shell passes `activeChallenges` array with `{ ...challenge, completedCount, totalParticipants }` shape.

**Display each challenge:**
- Title (text-sm font-bold)
- Progress bar: `completedCount / totalParticipants` participants completed
- Time remaining: compute from `ends_at` vs now ("Ends in 3 days" / "Ends tomorrow" / "Ended")
- XP reward badge: "+{xp_reward} XP"

**If no active challenges:** Show prompt card:

```
┌─────────────────────────────────┐
│  🏆 No active challenges       │
│                                 │
│  Challenges keep players        │
│  engaged and push performance.  │
│                                 │
│  [ Create Challenge + ]         │
└─────────────────────────────────┘
```

Button navigates to the challenges page: `onNavigate?.('challenges')` — if route doesn't exist, navigate to Team Hub.

**If the query fails:** Show the empty prompt card gracefully. Do NOT crash.

---

### 5. Squad Roster (moved to bottom, capped)

Same as current but:
- **Cap visible players at 6** with "View All (12) →" link
- Keep the tall portrait photos (w-12 h-16 rounded-lg)
- Keep jersey numbers, position, active dot

---

## ═══════════════════════════════════════════════
## SHELL UPDATES — CoachDashboard.jsx
## ═══════════════════════════════════════════════

### New State Variables

```jsx
const [weeklyShoutouts, setWeeklyShoutouts] = useState(0)
const [activeChallenges, setActiveChallenges] = useState([])
const [checklistState, setChecklistState] = useState({
  lineupSet: false,
  rsvpsReviewed: false,
  lastGameStatsEntered: false,
  parentReminderSent: false,  // manual only for now
})
const [showShoutoutModal, setShowShoutoutModal] = useState(false)
```

### New Queries (add to `loadTeamData`)

```jsx
// Weekly shoutout count — uses shoutouts table (has giver_id, team_id, created_at)
try {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count } = await supabase
    .from('shoutouts')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id)
    .gte('created_at', weekAgo.toISOString())
  setWeeklyShoutouts(count || 0)
} catch { setWeeklyShoutouts(0) }

// Active challenges — uses coach_challenges table (has status, starts_at, ends_at, target_value)
// Also joins challenge_participants to get progress counts
try {
  const { data: challenges } = await supabase
    .from('coach_challenges')
    .select('id, title, description, challenge_type, target_value, starts_at, ends_at, status, xp_reward')
    .eq('team_id', team.id)
    .eq('status', 'active')
    .order('ends_at', { ascending: true })
    .limit(3)

  // For each challenge, get participant progress
  const challengesWithProgress = []
  for (const ch of (challenges || [])) {
    const { data: participants } = await supabase
      .from('challenge_participants')
      .select('player_id, current_value, completed')
      .eq('challenge_id', ch.id)
    const completedCount = (participants || []).filter(p => p.completed).length
    const totalParticipants = (participants || []).length
    challengesWithProgress.push({ ...ch, completedCount, totalParticipants })
  }
  setActiveChallenges(challengesWithProgress)
} catch { setActiveChallenges([]) }
```

### Expanded Needs Attention Items

```jsx
// Existing
if (pendingStats > 0) needsAttentionItems.push({ ... })
if (notResponded > 0) needsAttentionItems.push({ ... })

// NEW: Players missing jersey numbers
const missingJersey = roster.filter(p => !p.jersey_number).length
if (missingJersey > 0) needsAttentionItems.push({
  label: `${missingJersey} player${missingJersey > 1 ? 's' : ''} need jersey #`,
  action: () => navigateToTeamWall?.(selectedTeam?.id),
  color: '#F59E0B'
})
```

### Checklist Auto-Computation

```jsx
// Compute checklist state based on existing data
useEffect(() => {
  if (!selectedTeam || !nextEvent) return
  let cancelled = false

  async function computeChecklist() {
    const nextEventRsvp = rsvpCounts[nextEvent?.id]
    const rsvpPercent = roster.length > 0
      ? ((nextEventRsvp?.total || 0) / roster.length) * 100
      : 0

    // Check if lineup is set for next game
    // game_lineups table: event_id, team_id, is_published
    let lineupSet = false
    if (nextEvent?.event_type === 'game') {
      try {
        const { count } = await supabase
          .from('game_lineups')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', nextEvent.id)
          .eq('team_id', selectedTeam.id)
        lineupSet = (count || 0) > 0
      } catch { lineupSet = false }
    }

    if (!cancelled) {
      setChecklistState(prev => ({
        ...prev,
        lineupSet,
        rsvpsReviewed: rsvpPercent >= 80,
        lastGameStatsEntered: pendingStats === 0,
        // parentReminderSent: manual only, stays as local state
      }))
    }
  }

  computeChecklist()
  return () => { cancelled = true }
}, [nextEvent?.id, rsvpCounts, roster.length, pendingStats, selectedTeam?.id])
```

---

## ═══════════════════════════════════════════════
## IMPLEMENTATION ORDER (PHASED)
## ═══════════════════════════════════════════════

### Phase 1: New Utility Components
1. Create `src/components/coach/RotatingPanel.jsx`
2. Create `src/components/coach/GameDayChecklist.jsx`
3. Create `src/components/coach/CoachCommandStrip.jsx`
4. Create `src/lib/date-helpers.js` — already exists, just verify

```bash
git add -A && git commit -m "Phase 1: Create RotatingPanel, GameDayChecklist, CoachCommandStrip components" && git push
```

### Phase 2: Rewrite Center Column
1. Rewrite `CoachCenterDashboard.jsx` with new Row layout:
   - Row 0: Compact welcome + team/season switcher
   - Row 1: Hero (col-span-3) + RotatingPanel (col-span-2)
   - Row 2: CoachCommandStrip (6 tiles)
   - Row 3: Team Hub + Chat (keep existing, add max-height)
   - Row 4: Quick Attendance (keep)
   - Row 5: Mobile Quick Actions (keep)
2. Rewrite `CoachGameDayHero.jsx` — compact version with countdown timer

```bash
git add -A && git commit -m "Phase 2: Rewrite center column — compact hero + rotating panel + command strip" && git push
```

### Phase 3: Update Left Sidebar
1. Add Coach Onboarding Journey placeholder card
2. Add "Give Shoutout" to Quick Actions
3. Remove Quick Links (already done in polish pass — verify)
4. Expand Needs Attention items (pass new items from shell)

```bash
git add -A && git commit -m "Phase 3: Update left sidebar — onboarding placeholder, shoutout action, expanded alerts" && git push
```

### Phase 4: Update Right Panel
1. Reorder: Season Record → Upcoming (3 events with RSVP) → Top Players → Challenges (placeholder) → Roster (capped at 6)
2. Add Active Challenges card (or empty prompt)

```bash
git add -A && git commit -m "Phase 4: Update right panel — reorder, add challenges, cap roster" && git push
```

### Phase 5: Shell Updates
1. Add new state variables
2. Add new queries (weekly shoutouts, active challenges)
3. Expand needsAttentionItems
4. Add checklist auto-computation
5. Pass new props to all children
6. Wire up shoutout modal (if GiveShoutoutModal exists in codebase)

```bash
git add -A && git commit -m "Phase 5: Shell updates — new queries, expanded alerts, checklist computation" && git push
```

### Phase 6: Polish + Verify
1. Dark mode pass on all new components
2. Empty state for every section
3. Loading states (skeleton or spinner)
4. Test team switching — all sections update
5. Test season switching
6. Verify no console errors
7. Verify responsive (hide sidebars on small screens)

```bash
git add -A && git commit -m "Phase 6: Polish — dark mode, empty states, loading states, responsive" && git push
```

---

## DO NOT

- **DO NOT** change any Supabase table schemas — use existing tables only
- **DO NOT** run DROP TABLE or destructive ALTER statements
- **DO NOT** modify the nav bar
- **DO NOT** change the HorizontalNavBar or MainApp.jsx routing
- **DO NOT** remove the Coach Blast Modal, Warmup Timer, or Event Detail Modal — they stay as modals in the shell
- **DO NOT** change FeedPost.jsx or any team hub components
- **DO NOT** change hubStyles.js
- **DO NOT** change any context providers (AuthContext, SeasonContext, etc.)
- **DO NOT** add any npm dependencies
- **DO NOT** create new Supabase tables
- **DO NOT** modify the `src/lib/date-helpers.js` file (it was just created in the polish pass)
- **DO NOT** break the existing chat inline reply functionality
- **DO NOT** change the parent dashboard or admin dashboard
- **DO NOT** make the left sidebar wider than 240px
- **DO NOT** make the right panel wider than 330px

---

## VERIFICATION CHECKLIST

### Layout
- [ ] 3-column layout: 240px | flex-1 | 330px
- [ ] Left sidebar has right border, right panel has left border
- [ ] Left sidebar hidden below xl, right panel hidden below lg
- [ ] Center column scrolls independently
- [ ] All columns respect dark/light mode

### Center Column
- [ ] Welcome message is compact (text-xl not text-2xl)
- [ ] Team selector pills appear for multi-team coaches
- [ ] Season dropdown works
- [ ] Hero card is compact (~280px height) with countdown timer
- [ ] Rotating panel shows Season Totals and Game Day Checklist
- [ ] Panel auto-rotates every 8s, pauses on hover, dots are clickable
- [ ] Checklist items auto-check based on real data where possible
- [ ] Command strip shows 6 tiles with correct status colors
- [ ] Team Hub and Chat previews render, max-height 300px
- [ ] Quick Attendance works (expand, mark present/absent)

### Left Sidebar
- [ ] Coach identity card, stat badges unchanged
- [ ] Onboarding Journey placeholder card renders
- [ ] Needs Attention shows expanded items (including missing jersey #)
- [ ] Quick Actions includes "Give Shoutout" (6th item)
- [ ] Quick Links grid is NOT present (removed in polish)

### Right Panel
- [ ] Order: Season Record → Events (3) → Top Players → Challenges → Roster (6 max)
- [ ] Events show RSVP summary (✓/✗ counts)
- [ ] Challenges card renders (or empty prompt if none)
- [ ] Roster capped at 6 with "View All" link
- [ ] All items tappable to correct destinations

### Data
- [ ] Team switching updates ALL sections
- [ ] Season switching updates ALL sections
- [ ] Weekly shoutout count query works (or gracefully fails)
- [ ] Active challenges query works (or gracefully falls back to empty prompt)
- [ ] No console errors
- [ ] App starts with `npm run dev`

### Brand
- [ ] All interactive elements use lynx-sky / lynx-deep
- [ ] No blue-500, indigo, purple, #2C5F7C, #3B82F6
- [ ] No backdrop-blur
- [ ] No uppercase text > 13px
- [ ] Fallback team color is #4BB9EC
