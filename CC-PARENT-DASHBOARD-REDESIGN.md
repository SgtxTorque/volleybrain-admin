# CC-PARENT-DASHBOARD-REDESIGN.md
## Parent Dashboard 3-Column Redesign Spec

**File:** `src/pages/roles/ParentDashboard.jsx`
**Goal:** Rebuild the Parent Dashboard to match the Admin Dashboard's polished 3-column layout, with parent-specific content and a context-switching hero player system.

---

## IMPORTANT: Read First
- Read `CLAUDE.md` and `DATABASE_SCHEMA.md` before starting.
- Reference `src/pages/dashboard/DashboardPage.jsx` (Admin Dashboard) for layout patterns, card styling, and sidebar structure.
- Reference `CC-WEB-REDESIGN.md` and `CC-ROLE-DASHBOARDS-REDESIGN.md` for design system details.
- **Do NOT remove any existing functionality** — only reorganize where it lives.
- **Preserve all existing data hooks, queries, and state management** — just restructure the JSX layout.

---

## DESIGN SYSTEM (Match Admin Dashboard)

```
Font: Tele-Grotesk (already configured)
Page bg: bg-slate-50
Cards: bg-white border border-slate-200 rounded-2xl shadow-sm
Section headers: text-xs font-bold uppercase tracking-wider text-slate-500
Nav: bg-[#2c3e50] full-bleed h-16
Accent: Brand #2C5F7C, Accent #E8A838
```

---

## 1. NAV BAR CHANGES (MainApp.jsx)

### Current Nav Items to REMOVE (for Parent role only):
- Schedule
- Standings
- Leaderboards
- Achievements
- Archives (move to My Stuff dropdown)
- Directory (move to My Stuff dropdown)

### Updated Nav for Parent Role:
```
VOLLEYBRAIN | Home | My Players ▾ | Social ▾ | Payments | My Stuff ▾ | [icons] | [avatar]
```

### Dropdown Menus:
- **My Players** — existing dropdown (no change)
- **Social** (new, replaces "Chats"):
  - Chat
  - Team Hub
- **My Stuff** (updated):
  - My Stuff (main page)
  - Archives
  - Directory

### Implementation Notes:
- These nav changes apply ONLY when the active role is `parent`.
- Other roles keep their existing nav.
- Use the same dropdown pattern already in the nav (hover or click to reveal).

---

## 2. PAGE LAYOUT — 3-Column Structure

```
┌──────────────────────────────────────────────────────────────┐
│  NAV BAR (full-bleed, edge-to-edge)                          │
├────────────┬──────────────────────────────┬──────────────────┤
│            │                              │                  │
│  LEFT      │  CENTER                      │  RIGHT           │
│  SIDEBAR   │  DASHBOARD                   │  CONTEXT PANEL   │
│  280px     │  flex-1                      │  300px           │
│  fixed     │  scrollable                  │  scrollable      │
│            │                              │                  │
│            │                              │                  │
└────────────┴──────────────────────────────┴──────────────────┘
```

### Outer Container:
```jsx
<div className="flex min-h-screen bg-slate-50">
  {/* Left Sidebar */}
  <aside className="w-[280px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
    ...
  </aside>

  {/* Center Dashboard */}
  <main className="flex-1 overflow-y-auto p-6 space-y-6">
    ...
  </main>

  {/* Right Context Panel */}
  <aside className="w-[300px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
    ...
  </aside>
</div>
```

**CRITICAL:** The page must be edge-to-edge. No max-width container. No side margins/padding on the outer wrapper. Full use of horizontal real estate.

---

## 3. LEFT SIDEBAR (280px) — Parent Command Center

Content cascades top to bottom in this order:

### 3A. Org Header Card
- Org logo (from org data) + org name + org subtitle/tagline
- Match the Admin Dashboard's org card style exactly
- Below org info: Parent name + avatar/photo
- Subtle divider between org and parent info

### 3B. Parent Stats (small badge row)
Display 3 compact stat badges in a row (like Admin's stat counters):
- **Players** — number of children registered
- **Seasons** — total seasons participated across all children
- **Teams** — number of active teams across all children

These pull from the parent's children data. Keep them small, clean, icon + number + label.

### 3C. Payment Summary Card
- Shows total balance / "All Paid Up ✅" status
- If outstanding balance: show amount, colored warning, clickable to go to Payments page
- If paid up: green checkmark, "No outstanding balance"
- Card is clickable → navigates to Payments

### 3D. Needs Attention Card
- Show count badge: "X Actions Needed" (orange/red)
- List items that need action (RSVPs, unsigned waivers, missing forms, unpaid fees)
- Each item clickable to resolve
- If nothing needs attention: "All caught up! ✅" with a friendly message
- Max 3 visible, "View All >" link if more

### 3E. Quick Actions (2×2 Grid)
Four icon buttons in a 2×2 grid:
```
[ 📅 Calendar ]  [ 👥 Team Hub ]
[ 📋 Register ]  [ 💳 Payments ]
```
- Each is a rounded card/button with icon + label
- Clickable → navigates to respective page
- Match Admin Dashboard's quick action button styling

### 3F. Badge Progress Preview
- Show parent's badge/achievement progress (if the system supports parent badges)
- Or show a summary of their children's combined badge progress
- 2-3 badge icons with progress bars
- "View All >" link to achievements page

---

## 4. CENTER DASHBOARD (flex-1) — The Main Stage

### 4A. Hero Player Card + Carousel
This is the emotional centerpiece of the dashboard.

**Single Hero Card (large, prominent):**
- Player photo (large, left side or background)
- Player name, jersey number
- Team name, season, sport
- Status badges: Active, Paid Up, etc.
- Quick action icons below: Player Card, Team Hub, Profile, Achievements

**Horizontal Carousel (if parent has multiple player+team combos):**
- Below the hero card, show a horizontal scrollable row of **mini player cards**
- Each mini card = player photo thumbnail + player name + team name + sport icon
- The currently selected one is highlighted/elevated
- **Notification dot/badge** on mini cards that have pending actions (RSVP needed, payment due, waiver unsigned)
- Clicking a mini card:
  - Swaps the hero card above
  - Updates the right column context panel
  - Updates the Team Hub and Chat preview cards below

**If only one player+team:** No carousel needed, just show the hero card.

**State Management:**
```jsx
const [selectedPlayerTeam, setSelectedPlayerTeam] = useState(null);
// { playerId, teamId, playerName, teamName, photo, ... }
```
All content in sections 4B and 5 (right column) should react to `selectedPlayerTeam`.

### 4B. Team Hub + Chat Preview Row
Two cards side by side on the same row, equal width:

```
┌─────────────────────────┬─────────────────────────┐
│  TEAM HUB PREVIEW       │  CHAT PREVIEW           │
│                         │                         │
│  Last post (full card)  │  Last 3 messages        │
│  - Author avatar+name   │  - Chat bubbles style   │
│  - Post content          │  - Quick reply input    │
│  - Timestamp            │  - Like button on msgs  │
│  - Reactions/comments   │                         │
│                         │                         │
│  Click → Team Hub page  │  Click → Chat page      │
└─────────────────────────┴─────────────────────────┘
```

**Team Hub Preview Card:**
- Header: "Team Hub" + team name + "View All >" link
- Show the most recent post as a full post card (author avatar, name, content, timestamp, reactions)
- This is the actual post card component, not a summary
- Clicking the card header or "View All" → navigates to Team Hub page for that team

**Chat Preview Card:**
- Header: "Team Chat" + team name + "View All >" link
- Show last 3 messages in chat bubble style
- Each message: sender name, message text, timestamp
- **Quick reply input** at bottom — text field + send button (sends message without leaving dashboard)
- **Like button** on each message bubble (heart or thumbs up)
- Clicking header or "View All" → navigates to Chat page for that team

**CRITICAL:** Both cards update when the hero player/team selection changes. They show data for the currently selected team.

---

## 5. RIGHT SIDEBAR (300px) — Player Context Panel

Everything in this column is contextual to the selected hero player/team. When the hero card changes, ALL of this content updates.

### 5A. Next 3 Upcoming Events
- Each event in a card with:
  - **Image preview hero** (event type icon or team photo as background, similar to mobile experience)
  - Event type badge (Game Day, Practice, Tournament)
  - Opponent/description
  - Date + time
  - Location (abbreviated)
  - RSVP status button (if applicable)
- Styled like premium event cards with subtle gradients
- Max 3 events shown, "View Full Calendar >" link

### 5B. Season Record
- Win-Loss display (large numbers, colored)
  - Wins in green, Losses in red
  - Format: `W 4 - 1 L`
- Team name underneath
- Clean, centered card

### 5C. Achievements Preview
- Show 3-4 most recent or closest-to-completion achievements
- Badge icon + name + progress bar
- "View All Achievements >" link
- If no achievements yet: "No badges earned yet" with encouraging message

### 5D. Leaderboard Preview
- Show player's position in key stat categories
- Stats to show: Kills, Aces, Digs, Assists (volleyball-specific)
- Each stat: stat name + player's value or rank + bar indicator
- "View Full Leaderboard >" link

### 5E. Player Stat Preview
- Quick snapshot of the player's key performance stats
- Could be a mini radar chart or simple stat bars
- Shows the most impressive/recent stats
- "View Full Stats >" link

---

## 6. CONTEXT SWITCHING BEHAVIOR

When a parent clicks a different mini player card in the carousel:

1. **Hero card** updates with new player/team info and photo
2. **Team Hub preview** loads the latest post from the NEW team
3. **Chat preview** loads the latest messages from the NEW team's chat
4. **Right sidebar** entirely refreshes:
   - Upcoming events → for the new team
   - Season record → for the new team
   - Achievements → for the new player
   - Leaderboard → for the new player on the new team
   - Stats → for the new player

Use loading skeletons during transitions. Keep the switch feeling instant where possible (prefetch if data is available).

---

## 7. RESPONSIVE CONSIDERATIONS

This is a desktop-first redesign. For now:
- Below 1280px: Right sidebar collapses, content moves below center
- Below 1024px: Left sidebar collapses to icons-only or hamburger menu
- Below 768px: Single column stack

But don't over-engineer responsive now — desktop is the priority.

---

## 8. DATA SOURCES

All data should come from existing Supabase queries where possible. Reference the current ParentDashboard.jsx for existing data hooks. Key data needed:

- **Parent's children:** players linked to this parent account
- **Team memberships:** teams each child is on (can be multiple)
- **Events:** upcoming events per team (from schedule/events table)
- **Team feed:** latest posts per team (from team_feed or similar)
- **Chat messages:** latest messages per team chat
- **Payments:** outstanding balances, payment status
- **Achievements:** player badges and progress
- **Stats:** player performance statistics
- **Season record:** team W-L record
- **Leaderboard:** player rankings in stat categories
- **Needs attention:** aggregated action items (RSVPs, waivers, forms, payments)

If a query doesn't exist yet, create a placeholder with mock/sample data and add a `// TODO: Wire to Supabase` comment.

---

## 9. IMPLEMENTATION ORDER

1. **Nav bar changes** (MainApp.jsx) — quick win, do first
2. **3-column layout shell** — get the structure in place with placeholder content
3. **Left sidebar** — org header, stats, payment summary, needs attention, quick actions, badges
4. **Hero player card + carousel** — the centerpiece with state management
5. **Team Hub + Chat preview cards** — the two-card row with context switching
6. **Right sidebar panels** — events, record, achievements, leaderboard, stats
7. **Context switching wiring** — make everything react to hero card selection
8. **Polish** — loading states, empty states, transitions, spacing

---

## 10. CARD STYLING REFERENCE

Copy these patterns from the Admin Dashboard:

```jsx
{/* Standard Card */}
<div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
    Section Title
  </h3>
  {/* content */}
</div>

{/* Stat Badge */}
<div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
  <div className="text-2xl font-bold text-slate-900">12</div>
  <div className="text-xs text-slate-500 mt-1">Label</div>
</div>

{/* Quick Action Button */}
<button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
  <span className="text-2xl">📅</span>
  <span className="text-xs font-semibold text-slate-700">Calendar</span>
</button>

{/* Needs Attention Item */}
<div className="flex items-center justify-between py-2">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
      <span className="text-amber-600">⚠️</span>
    </div>
    <div>
      <div className="text-sm font-semibold text-slate-900">RSVP Needed</div>
      <div className="text-xs text-slate-500">vs Long Stockings — Wed, Feb 25</div>
    </div>
  </div>
  <button className="px-3 py-1 bg-brand text-white text-xs font-semibold rounded-lg">RSVP</button>
</div>
```

---

## FINAL NOTES

- This spec replaces the current ParentDashboard.jsx layout entirely.
- All existing features/data must be preserved — just reorganized.
- The hero player carousel with context switching is the signature UX feature.
- Inline chat reply from the dashboard is an advanced feature — if complex, stub it with a "Reply" button that navigates to chat.
- Test with both single-child and multi-child parent accounts.
- Keep the code clean, commented, and maintainable.
