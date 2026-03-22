# CC-COACH-DASHBOARD-REDESIGN.md
## Coach Dashboard — 3-Column Redesign

**File:** `src/pages/roles/CoachDashboard.jsx`
**Reference:** Admin Dashboard (`DashboardPage.jsx`) and Parent Dashboard (`ParentDashboard.jsx`) for layout patterns.

**IMPORTANT:** Read `CLAUDE.md` and `DATABASE_SCHEMA.md` before writing ANY code or queries.

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-coach-redesign checkpoint"
```

---

## DESIGN SYSTEM (Same as Admin/Parent)

```
Font: Tele-Grotesk (already configured as font-sans)
Page bg: bg-slate-50
Cards: bg-white border border-slate-200 rounded-2xl shadow-sm
Section headers: text-xs font-bold uppercase tracking-wider text-slate-500
Nav: bg-[#2c3e50] full-bleed h-16
Borders between columns: border-slate-200/50 (subtle, 1px)
Accent: Brand #2C5F7C, Accent #E8A838
```

---

## PAGE LAYOUT — 3-Column Structure

```
┌──────────────────────────────────────────────────────────────┐
│  NAV BAR (full-bleed, edge-to-edge)                          │
├────────────┬──────────────────────────────┬──────────────────┤
│            │                              │                  │
│  LEFT      │  CENTER                      │  RIGHT           │
│  SIDEBAR   │  DASHBOARD                   │  ROSTER PANEL    │
│  240px     │  flex-1                      │  300px           │
│            │                              │                  │
└────────────┴──────────────────────────────┴──────────────────┘
```

Full edge-to-edge. No max-width container. Match Admin/Parent layout approach.

```jsx
<div className="flex w-full min-h-[calc(100vh-4rem)] bg-slate-50">
  <aside className="w-[240px] shrink-0 border-r border-slate-200/50 bg-white overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
    {/* Left Sidebar */}
  </aside>
  <main className="flex-1 overflow-y-auto p-6 space-y-5">
    {/* Center Dashboard */}
  </main>
  <aside className="w-[300px] shrink-0 border-l border-slate-200/50 bg-white overflow-y-auto h-[calc(100vh-4rem)] sticky top-16">
    {/* Right Roster Panel */}
  </aside>
</div>
```

---

## ARCHITECTURE: Use Child Components

Create: `src/components/coach/`
- `CoachLeftSidebar.jsx`
- `CoachGameDayHero.jsx`
- `CoachCenterDashboard.jsx`
- `CoachRosterPanel.jsx`

Keep CoachDashboard.jsx as a thin shell (~150-200 lines max):
- ALL hooks at top, before any conditional returns
- Core data fetching (team, season, roster)
- Pass props down to children
- Each child handles its own additional data fetching with proper error handling

**QUERY RULES (same as parent rebuild):**
- Read DATABASE_SCHEMA.md for every table before querying
- Every query gets cancelled flag + try/catch + graceful fallback
- Never put result state in useEffect dependencies
- If a table doesn't exist, use mock data with TODO comment

---

## LEFT SIDEBAR (240px) — Team Command Center

Content cascades top to bottom:

### 1. Team Header
- Team logo/avatar + team name (e.g., "Black Hornets Elite")
- Season + sport underneath (e.g., "Spring 2026 · Volleyball")
- Coach name below that (e.g., "Head Coach · Carlos")
- Match the Admin Dashboard org card styling

### 2. Team Stat Badges (row of 3-4)
Small compact badges in a row:
- **Players** — roster count (e.g., 12)
- **Wins** — season wins
- **Losses** — season losses  
- **Win %** — calculated percentage

### 3. Season Record Card
- Big W-L numbers (green wins, red losses)
- Win percentage
- Recent Form: row of W/W/W/W/L badges (green W, red L)
- Compact version of what's currently at the top of the page

### 4. Quick Actions List
Vertical list with icons, each row clickable:
- ✅ Take Attendance →
- 📨 Message Parents →
- 🔥 Start Warmup →
- 👥 Team Hub →
- 💬 Team Chat →

Style: each row is `flex items-center gap-3 py-2.5 px-3 hover:bg-slate-50 rounded-xl cursor-pointer transition`
Icon on left, label, chevron on right.

### 5. Quick Links Row (2x2 grid)
Four compact buttons:
```
[ 📅 Schedule ]  [ ✅ Attendance ]
[ 🏐 Game Prep ] [ 💬 Messages  ]
```

---

## CENTER DASHBOARD (flex-1) — The Main Stage

### Row 1: Game Day Hero Card (the centerpiece)

A large, premium hero card showing the next upcoming game. This is the emotional centerpiece.

**Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  NEXT GAME DAY                                          │
│                                                          │
│  ┌──────────┐    VS    ┌──────────┐                     │
│  │  YOUR    │          │ OPPONENT │                     │
│  │  TEAM    │          │  TEAM    │                     │
│  │  LOGO    │          │  LOGO    │                     │
│  └──────────┘          └──────────┘                     │
│                                                          │
│  Black Hornets Elite  vs  Long Stockings                │
│                                                          │
│  📅 Wed, Feb 25 · 8:30 PM                              │
│  📍 Frisco Fieldhouse                                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Lineup   │  │ Game Day │  │  RSVP    │              │
│  │ Builder  │  │   Hub    │  │ Status   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: Use `/images/volleyball-game.jpg` as background image with dark overlay, OR a rich gradient (brand colors)
- Min height: ~200-240px
- "NEXT GAME DAY" label at top in small uppercase
- Team logos/avatars centered with "VS" between them
- Team names bold, white text
- Date/time and venue below
- Three action buttons at bottom: "Lineup Builder", "Game Day Hub", "RSVP Status"
- If NO upcoming game: show "No upcoming games" with a "Schedule" button

**If the next event is a PRACTICE (not a game):**
- Use `/images/volleyball-practice.jpg` as background
- Show "NEXT PRACTICE" label
- Show date/time/venue
- Action buttons: "Take Attendance", "Start Warmup"

### Row 2: Game Day Tools (two cards side by side)

```
┌─────────────────────────┬─────────────────────────┐
│  LINEUP BUILDER         │  GAME DAY HUB           │
│                         │                         │
│  🏐 Build & manage     │  ⚡ Live scoring & stats │
│     lineups             │                         │
│                         │  Score games, track     │
│  No upcoming games      │  stats, manage rotations│
│                         │                         │
│  Open Builder →         │  Enter Hub →            │
└─────────────────────────┴─────────────────────────┘
```

Keep these similar to current design. Two equal-width cards. Each clickable to navigate.

### Row 3: Quick Attendance Card (full width)

If there's an upcoming practice/event soon:
- Show the event name, time
- "Take Attendance" button
- RSVP status count (X/12 responded)

### Row 4: Top Players Leaderboard Preview + Team Hub Preview (two cards side by side)

```
┌─────────────────────────┬─────────────────────────┐
│  TOP PLAYERS            │  TEAM HUB               │
│  View All →             │  View All →             │
│                         │                         │
│  1. Test A.  20K 13A    │  Latest post preview    │
│  2. Chloe T. 15K 7A    │  (author, content,      │
│  3. Sarah J. 9K 6A     │   timestamp)            │
│  4. Maya R.  2K 13A    │                         │
│  5. Ava T.   8K 7A     │                         │
└─────────────────────────┴─────────────────────────┘
```

**Top Players:** Show top 5 players with photo, name, jersey number, and key stats (K=kills, A=assists, PPG). Clickable to full leaderboard.

**Team Hub Preview:** Show the latest team hub post (full post card with author, content, timestamp). Clickable to Team Hub page.

### Row 5: Team Chat Preview (full width or half)

Similar to Parent Dashboard — show last 3 messages in chat bubble style with quick reply input at bottom.

---

## RIGHT SIDEBAR (300px) — Squad Roster Panel

This is the roster — a scrollable list of player cards.

### Header
- "SQUAD ROSTER" title + "Full Roster →" link
- Player count badge: "12 Players"

### Player Cards (list view, scrollable)
Each player card in a vertical list:

```
┌─────────────────────────────────┐
│ [Photo]  Player Name        #1  │
│  48px    Position               │
│  round   ● Active   Stats: 20K │
└─────────────────────────────────┘
```

**Each card:**
- Player photo (48px circle, `rounded-full object-cover`)
- Player name (font-semibold text-sm)
- Jersey number (on the right, text-slate-400)
- Position (text-xs text-slate-500)
- Active status indicator (small green dot)
- Key stat preview (optional — kills or top stat)
- Clickable → navigates to player profile/card

**Card styling:**
- `flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition`
- Subtle bottom border between cards: `border-b border-slate-100 last:border-0`
- If player has a notification (needs waiver, etc.), show a small dot

### Below Roster: Upcoming Events Preview
After the roster list, show:
- "UPCOMING" header + "Schedule →" link
- Next 2-3 events as compact cards (date, type badge, time)
- Use the same hero event card style from Parent Dashboard (with background images)

---

## NAV BAR — Coach Role

Keep the current coach nav items. If they need slimming similar to parent:
- Dashboard, My Teams ▾, Schedule, My Availability, Game Day ▾, Attendance, Communication ▾, Insights ▾

Only modify if Carlos requests changes. For now, keep current coach nav as-is.

---

## CONTEXT: Coach May Have Multiple Teams

If a coach has multiple teams, add a team selector:
- Dropdown or tab bar above the hero card
- Switching teams updates: hero card, roster, stats, everything
- Default to the first/primary team

Use the same pattern as the Parent Dashboard's player selector, but for teams.

---

## IMPLEMENTATION ORDER

1. **Git checkpoint** — commit current state
2. **Create child component files** — CoachLeftSidebar, CoachGameDayHero, CoachCenterDashboard, CoachRosterPanel
3. **Rebuild CoachDashboard.jsx as thin shell** — all hooks at top, props down to children
4. **Left sidebar** — team header, stats, season record, quick actions, quick links
5. **Game Day Hero card** — the centerpiece with next game/practice info
6. **Game Day Tools row** — Lineup Builder + Game Day Hub
7. **Leaderboard + Team Hub preview row**
8. **Right sidebar roster panel** — player cards in list view
9. **Polish** — spacing, borders, loading states, empty states

---

## PRESERVE EXISTING FUNCTIONALITY

Before rebuilding, scan current CoachDashboard.jsx and note:
- All navigation handlers
- All modal/dialog triggers  
- Context values consumed (season, sport, org branding, theme, etc.)
- Data queries that work correctly — keep their logic, just reorganize
- The Lineup Builder, Game Day Hub, Warmup Timer integrations

All existing features must be preserved — just reorganized into the new layout.

---

## CRITICAL REMINDERS

- ALL hooks at top of component, BEFORE any conditional returns
- Use child components — no 2000+ line single file
- Check DATABASE_SCHEMA.md before every query
- Every query: cancelled flag + try/catch + graceful fallback
- Borders between columns: `border-slate-200/50` (subtle)
- Inline `style={{ minHeight: '...' }}` for critical height requirements
- No CSS transitions/animations that could cause visual glitches
- Test with browser resize — layout must stay stable
- Edge-to-edge, no max-width wrapper
