# CC-COACH-ENGAGEMENT-COLUMN-V2 — Execution Report

## Summary

Fixed the engagement column layout. Previously, the 4 engagement cards were passed as a separate `engagementContent` prop to `V2DashboardLayout`, creating a page-level 3-column grid. This was wrong — the engagement column now lives **inside** the main content area, next to the tabs/roster section, via an inner flex container.

---

## What Changed

### Layout Structure (Before — Wrong)
```
V2DashboardLayout (3-column: main | engagement | sidebar)
  engagementContent: 4 cards as page-level column
  mainContent: hero + nudge + tabs (full height)
  sideContent: sidebar cards
```

### Layout Structure (After — Correct)
```
V2DashboardLayout (2-column: main | sidebar)  ← page grid unchanged
  mainContent:
    HeroCard          (full width of main column)
    TeamSwitcher      (full width of main column)
    MascotNudge       (full width, conditional)
    AttentionStrip    (full width, conditional)
    ┌─────────────────────────────────────────────┐
    │  FLEX CONTAINER (display: flex, gap: 16px)  │
    │  ┌──────────────────┐ ┌──────────────────┐  │
    │  │ BodyTabs         │ │ Engagement Col   │  │
    │  │ (flex: 1,        │ │ (width: 220px,   │  │
    │  │  minWidth: 0)    │ │  flexShrink: 0)  │  │
    │  │                  │ │                  │  │
    │  │ Roster/Schedule  │ │ CoachLevelCard   │  │
    │  │ Stats/GamePrep   │ │ CoachActivity    │  │
    │  │ Engagement tab   │ │ CoachBadges      │  │
    │  │                  │ │ TeamPulse        │  │
    │  └──────────────────┘ └──────────────────┘  │
    └─────────────────────────────────────────────┘
  sideContent:          ← completely untouched
    GameDayCard
    WeeklyLoad
    ThePlaybook
    ShoutoutCard
```

---

## Phase 1: Investigation Findings

### Current Layout (before fix)
- `V2DashboardLayout` was receiving `engagementContent` prop → triggered 3-column grid (`1fr 220px 340px`)
- Engagement cards appeared as a page-level column between main and sidebar
- Carlos wanted them INSIDE the main column, next to tabs/roster only

### Split Point Identified
- Hero banner → line 750
- Team switcher → line 763
- Mascot nudge → line 770 (conditional)
- Attention strip → line 779 (conditional)
- BodyTabs → line 791 ← this is where the inner flex split begins

### Right Sidebar Contents (unchanged)
1. `GameDayCard` — Next game info with countdown
2. `WeeklyLoad` — This week's events
3. `ThePlaybook` — 6 quick action buttons
4. `ShoutoutCard` — Weekly shoutout count
- **No engagement cards in sidebar** ✅

---

## Phase 2: Revert

- Removed `engagementContent` prop from `V2DashboardLayout` call
- Page-level grid reverted to 2-column (`1fr 340px`)
- `V2DashboardLayout.jsx` file itself NOT modified (the optional prop is harmless)

---

## Phase 3: Inner Flex Container

### The JSX
```jsx
{/* INNER FLEX: Tabs/Roster + Engagement Column side by side */}
<div style={{ display: 'flex', gap: 16 }}>
  {/* Roster/tabs takes remaining space */}
  <div style={{ flex: 1, minWidth: 0 }}>
    <BodyTabs ...>
      {/* Roster, Schedule, Stats, GamePrep, Engagement tabs */}
    </BodyTabs>
  </div>

  {/* ENGAGEMENT COLUMN — 220px fixed, mock data */}
  <div
    className="coach-engagement-column"
    style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
  >
    <CoachLevelCard ... />
    <CoachActivityCard ... />
    <CoachBadgesCard ... />
    <TeamPulseCard ... />
  </div>
</div>
```

### Key Details
- `flex: 1, minWidth: 0` on roster container — shrinks to accommodate engagement column
- `width: 220, flexShrink: 0` on engagement column — stays fixed
- Hero, TeamSwitcher, Nudge, AttentionStrip remain **above** the flex container — full main-column width
- Engagement column only appears next to the tabs/roster area

---

## Phase 4: Mock Data

All engagement cards use hardcoded values from `mockEngagement` object:
```javascript
const mockEngagement = {
  levelInfo: { level: 4, progress: 52, nextLevelXp: 2000 },
  tierName: 'Rising Star',
  xp: 520,
  shoutouts: 3, challenges: 1, statsEntered: 2, evalsDone: 5,
  nextBadgeHint: '2 more shoutouts for Hype Coach',
  badges: [5 placeholder badges with emoji icons],
  earnedCount: 5, totalCount: 42,
  pulse: { active: 8, drifting: 3, inactive: 1 },
}
```
**Zero Supabase queries** for engagement data.

---

## Phase 5: Responsive

Added media query to hide engagement column on narrow screens:
```css
@media (max-width: 1200px) {
  .coach-engagement-column { display: none !important; }
}
```

---

## Confirmation Checklist

- [x] Engagement cards are NOT in the right sidebar
- [x] Engagement cards are INSIDE the main content area, next to tabs/roster
- [x] Hero/nudge/attention bar remain full-width (not sharing space with engagement)
- [x] Right sidebar completely untouched (GameDay, WeeklyLoad, Playbook, Shoutout)
- [x] All data is hardcoded mock — no Supabase queries
- [x] Responsive: engagement column hidden below 1200px
- [x] Build passes: `npx vite build` — **11.81s, no errors**
- [x] No new npm dependencies
- [x] Only CoachDashboard.jsx modified (no other files touched)

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/roles/CoachDashboard.jsx` | Moved engagement cards from `engagementContent` prop into inner flex container inside `mainContent` |

## Build Status
- `npx vite build` — **PASSES** (11.81s, no errors)
