# CC-COACH-DASHBOARD-FIX-1.md
## Coach Dashboard — Refinement Pass

**Files:** `src/pages/roles/CoachDashboard.jsx` and child components in `src/components/coach/`
**Also fix:** Parent Dashboard and Admin Dashboard column borders to match coach's clean look.

---

## 1. RIGHT COLUMN REORDER

Current order is wrong. Change to this order top to bottom:

1. **Season Record** (move from left sidebar to top of right column)
   - Big W-L numbers, win rate, recent form W/W/W/W/L badges
   - This becomes the first thing you see in the right column

2. **Top Players Leaderboard**
   - Top 5 players with photo, name, jersey, key stats
   - "View All →" link

3. **Squad Roster** (below leaderboard)
   - Header: "SQUAD ROSTER" + player count + "Full Roster →"
   - Player cards in list view (see styling changes below)

---

## 2. ROSTER CARD STYLING CHANGES

Each player card in the squad roster:

**Photo shape:** Change from round (`rounded-full`) to RECTANGLE. 
Use `rounded-lg w-12 h-16 object-cover` — taller than wide, like a 
mini portrait/trading card shape.

**Jersey number:** Make LARGER and DARKER.
- Change from current small light text to: `text-lg font-bold text-slate-800`
- The number should be prominent and easy to read

**Card layout:**
```
┌─────────────────────────────────┐
│ [RECT   ]  Player Name      #1 │
│ [PHOTO  ]  Position             │
│ [tall   ]  ● Active             │
└─────────────────────────────────┘
```

---

## 3. LEFT COLUMN UPDATES

Since Season Record moved to the right column, replace it:

**New left column order:**
1. Team Header (team name, season, sport, coach name) — keep as-is
2. Coach Stat Badges row: **Players** (total across all teams), 
   **Teams** (number of teams coaching), **Win %** (overall), 
   **Seasons** (total seasons coached). These are COACH-level stats, 
   not team-specific.
3. **Needs Attention** card (moved here from wherever it was, or new)
   - Pending RSVPs, missing waivers, unfinished lineups, 
     attendance not taken, etc.
   - Count badge: "X items" in orange
   - Each item clickable to resolve
   - If nothing: "All caught up! ✅"
4. Quick Actions list (keep as-is)
5. Quick Links 2x2 grid (keep as-is)

---

## 4. SEASON TOTALS CARD (NEW — center column)

Add a new card directly below the Game Day Hero card, same full width. 
This is a "Season Totals at a Glance" preview card.

**Stats to show in a horizontal row of compact stat boxes:**
- Total Points
- Total Kills  
- Total Aces
- Total Digs
- Total Assists
- Total Blocks
- Total Errors
- Games Played

**Styling:** Single card, horizontal flex row of stat boxes. Each box:
```
┌────────┐
│  245   │  ← big number, font-bold text-lg
│ Kills  │  ← label, text-xs text-slate-500
└────────┘
```

**The entire card is clickable** → navigates to stats/leaderboard page.
Add a subtle hover effect and "View Full Stats →" link at the right end.

If stats data is not available yet, use placeholder zeros with a 
`// TODO: Wire to actual season stats` comment.

---

## 5. TEAM HUB + CHAT PREVIEWS (MISSING)

Add these below the Season Totals card, same layout as Parent Dashboard:

Two cards side by side, equal width:

**Team Hub Preview:**
- Header: "Team Hub" + team name + "View All →"
- Show most recent post (author avatar, name, content, timestamp)
- Clickable to Team Hub page

**Team Chat Preview:**
- Header: "Team Chat" + team name + "View All →"  
- Show last 3 messages in chat bubble style
- Quick reply input at bottom
- Clickable to Chat page

---

## 6. HERO CARD BACKGROUND IMAGE NOT WORKING

The Game Day Hero card should use background images but they are not showing.

**Check:** Is the hero card using the images from `/images/volleyball-game.jpg` 
and `/images/volleyball-practice.jpg`?

If the images exist in `public/images/`, the URL in the component should be:
```jsx
style={{ backgroundImage: `url(/images/volleyball-practice.jpg)` }}
```
NOT:
```jsx
style={{ backgroundImage: `url(./images/volleyball-practice.jpg)` }}
```

The leading `/` is important for Vite to serve from the public folder.

If the files do not exist in `public/images/`, note that and Carlos will 
add them. For now, fall back to a gradient:
```jsx
className="bg-gradient-to-br from-amber-500 to-orange-600"
```

---

## 7. MULTI-TEAM COACH SUPPORT

Add a team selector at the top of the center column, above the welcome message.

**If coach has only 1 team:** Don't show the selector.

**If coach has multiple teams:** Show a horizontal row of team pills/tabs:
```
[ Black Hornets Elite ]  [ BH Stingers ]  [ 13U ]
```
- Selected team is highlighted with brand color background
- Clicking a different team updates: hero card, stats, roster, 
  leaderboard, everything in center and right columns
- Left sidebar coach stats stay the same (they are coach-level, not team-specific)

**Also add a season selector** — small dropdown in the team header area 
or near the team selector:
```
Season: [ Spring 2026 ▾ ]
```
Coaches need to look back at previous seasons for reference.

---

## 8. NAV BAR SLIMMING (Coach role)

**Current:** Dashboard | My Teams ▾ | Schedule | My Availability | Game Day ▾ | Attendance | Communication ▾ | Insights ▾

**New:**
```
Dashboard | My Teams ▾ | Schedule | Game Day ▾ | Communication ▾ | My Stuff ▾
```

**Moved into "My Stuff" dropdown:**
- My Availability
- Attendance (already accessible via Quick Actions and Game Day)
- Insights

**Moved into "Game Day" dropdown:**
- Lineup Builder
- Game Day Hub  
- Attendance (also here for game-day context)

**"Communication" dropdown:**
- Team Chat
- Team Hub
- Message Parents
- Blast

These nav changes apply ONLY when active role is coach. Other roles 
keep their nav.

---

## 9. FIX COLUMN BORDER LINES (ALL DASHBOARDS)

The coach dashboard has clean thin borders. Parent and Admin have thick dark lines.

**In ParentDashboard.jsx:** Change sidebar borders to:
- Left sidebar: `border-r border-slate-200/50`
- Right sidebar: `border-l border-slate-200/50`

**In DashboardPage.jsx (Admin):** Same change:
- Left sidebar: `border-r border-slate-200/50`  
- Right sidebar: `border-l border-slate-200/50`

**Also check MainApp.jsx** for any borders on the content wrapper that 
might be causing dark lines on parent/admin but not coach.

All three dashboards should have the same subtle, barely-visible column dividers.

---

## IMPLEMENTATION ORDER

1. Fix column borders across all 3 dashboards (quick CSS change)
2. Reorder right column (season record → leaderboard → roster)
3. Restyle roster cards (rectangle photos, larger jersey numbers)
4. Update left column (coach stats, needs attention)
5. Add Season Totals card in center column
6. Add Team Hub + Chat previews in center column
7. Fix hero card background image
8. Add multi-team selector + season dropdown
9. Slim down nav bar for coach role

---

## VERIFICATION CHECKLIST

- [ ] Right column: Season Record on top, then Leaderboard, then Roster
- [ ] Roster photos are rectangular (not round), jersey numbers are large and dark
- [ ] Left column has coach-level stats and Needs Attention
- [ ] Season Totals card appears below hero, full width, clickable
- [ ] Team Hub and Chat preview cards appear in center column
- [ ] Hero card background image shows (or clean gradient fallback)
- [ ] Multi-team selector appears if coach has multiple teams
- [ ] Nav bar is slimmed down for coach role
- [ ] Column borders are subtle and matching across Admin, Parent, and Coach
- [ ] No thick dark vertical lines on any dashboard
