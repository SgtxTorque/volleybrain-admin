# CC-COACH-ENGAGEMENT-COLUMN — Execution Report

## Summary

Added a new engagement column to the coach dashboard, creating a 3-column layout. Four stacked cards provide XP/level info, coaching activity stats, badge previews, and team pulse data. The old MilestoneCard XP bar was removed from the sidebar.

---

## Phase 1: Investigation Findings

### Current Layout
- `V2DashboardLayout` uses CSS grid: `1fr 340px` (main + sidebar)
- Responsive: collapses to 1-column at 1100px
- Coach dashboard passes `mainContent` and `sideContent` props

### Right Sidebar Contents (before)
1. `GameDayCard` — Next game info
2. `WeeklyLoad` — This week's events
3. `ThePlaybook` — Quick action buttons
4. `ShoutoutCard` — Weekly shoutout count
5. `MilestoneCard` — Coach XP bar (REMOVED)

### Available Data
- `weeklyShoutouts` — shoutout count from `shoutouts` table
- `weeklyEngagement` — `{ shoutouts, challenges, posts }` from weekly queries
- `evalData` — player skill evaluations array
- `teamRecord` — `{ wins, losses }` from completed games
- `roster` — full player array with position/jersey data
- XP system: `getLevelFromXP()` and `getLevelTier()` from engagement-constants.js

---

## Phase 2: Layout Change

### File: `src/components/v2/V2DashboardLayout.jsx`
- Added optional `engagementContent` prop
- When present: grid becomes `1fr 220px 340px` (main | engagement | sidebar)
- When absent: grid stays `1fr 340px` (backward compatible — other dashboards unaffected)
- Engagement column: `display: flex; flex-direction: column; gap: 12px`

### Responsive Breakpoints
- **>= 1400px**: Full 3-column layout
- **1100px–1399px**: 2-column — engagement cards flow into a 4-across grid above sidebar
- **< 1100px**: Single column — engagement cards in 2-column grid
- **< 700px**: Single column — everything stacks

---

## Phase 3: Engagement Cards

### File: `src/components/v2/coach/CoachEngagementColumn.jsx`

**Card 1: `CoachLevelCard`**
- Navy gradient background (`#0B1628` → `#162D50`)
- Star icon in sky-blue circle
- Tier name, level number, XP count
- Sky-blue XP progress bar (4px)
- Gold "Trophy case →" link → navigates to achievements

**Card 2: `CoachActivityCard`**
- White card, "YOUR ACTIVITY" header with "Week" pill
- 4 rows: Shoutouts, Challenges, Stats entered, Evals done
- Each row: colored icon, label, bold count
- Gold nudge bar: "X more shoutouts for Hype Coach" (next badge hint)

**Card 3: `CoachBadgesCard`**
- White card, "BADGES" header with earned/total count
- 5-across grid of 32px badge thumbnails (up to 10)
- "View all →" link to achievements page

**Card 4: `TeamPulseCard`**
- White card, "TEAM PULSE" header
- Active (green), Drifting (amber), Inactive (red) counts
- Stacked progress bar below

### Data Sources
| Card | Data Source |
|------|------------|
| CoachLevelCard | `getLevelFromXP(coachXp)` — XP from wins, roster size, shoutouts, evals |
| CoachActivityCard | `weeklyShoutouts`, `weeklyEngagement.challenges`, `gamesWithStats`, `evalData.length` |
| CoachBadgesCard | New query: `player_achievements` for coach user + `achievements` count |
| TeamPulseCard | Heuristic: position + jersey = active, one missing = drifting, both missing = inactive |

### New Queries Added to `loadTeamData()`
1. **Coach badges** (query 12): `player_achievements` joined with `achievements` for coach user, last 10 earned
2. **Games with stats** (query 13): `schedule_events` where `stats_entered = true` in last 7 days

---

## Phase 5: Cleanup

- Removed `MilestoneCard` from coach dashboard sidebar (redundant with CoachLevelCard)
- Removed unused `MilestoneCard` import

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/v2/V2DashboardLayout.jsx` | Added `engagementContent` prop, 3-column grid, responsive breakpoints |
| `src/components/v2/coach/CoachEngagementColumn.jsx` | **NEW** — 4 engagement cards |
| `src/pages/roles/CoachDashboard.jsx` | Import engagement cards, add state + queries, wire engagementContent, remove old MilestoneCard |

## Build Status
- `npx vite build` — **PASSES** (14.26s, no errors)
