# CC-LINEUP-BUILDER-INVESTIGATION.md
# Lynx Web Admin — Lineup Builder V2 & Coach Nav Restructure
# INVESTIGATION SPEC

**Type:** Investigation  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`  
**Output:** Write all findings to `LINEUP-BUILDER-INVESTIGATION-REPORT.md` in repo root. Do NOT output to console.

---

## OBJECTIVE

Investigate the current codebase to map every file, function, DB table, context, and route involved in:
1. The **Lineup Builder / War Room** (currently `AdvancedLineupBuilder.jsx`)
2. The **"Game Day" nav group** in the sidebar and any horizontal top nav
3. The **Game Prep page** and all its child components
4. Any **practice/drill** related code or DB tables
5. The **theme system** (light/dark mode) as it applies to these components

The goal is to produce a comprehensive report so we can write a phased execution spec to:
- Redesign the Lineup Builder into a fixed-height, no-scroll, split-view layout (court left, tabbed panel right, control bar bottom)
- Rename the "Game Day" nav group to something better (likely "Compete" or "Team Ops")
- Ensure the new lineup builder works in both light and dark modes using the existing theme system
- Identify what DB tables/columns exist vs what needs to be created

---

## INVESTIGATION TASKS

### 1. LINEUP BUILDER — Current Architecture

**Files to examine:**
- `src/components/games/AdvancedLineupBuilder.jsx` — the main component
- `src/pages/gameprep/LineupPanel.jsx` — the simpler lineup panel
- `src/pages/schedule/LineupBuilder.jsx` — older lineup builder in schedule
- `src/pages/gameprep/CourtPlayerCard.jsx` — court player card component

**For each file, document:**
- Exported components and their props
- State variables and what they track
- Supabase queries — exact table names, columns selected, filters used
- How the component is invoked (modal? page? what triggers it?)
- What sport configurations exist (`SPORT_CONFIGS` object)
- How drag-and-drop works (HTML5 drag? library?)
- How rotation logic works (clockwise movement, position mapping)
- How set management works (per-set lineups, copy to all sets)
- How substitutions are tracked
- How libero assignment works
- How auto-fill works
- How save/load works (what gets written to `game_lineups` table)

**Key questions to answer:**
- What is the exact schema of the `game_lineups` table? (columns, types, constraints)
- Are there any other tables for substitutions, rotations, or formation presets?
- Is lineup data per-event or per-event-per-set?
- Does the current save support saving formation type (5-1, 6-2, 4-2)?
- Is there any concept of "lineup templates" or reusable lineups?
- What player data is available on the roster query? (photo_url, jersey_number, position, etc.)

### 2. GAME PREP PAGE — Full Component Tree

**Files to examine:**
- `src/pages/gameprep/GamePrepPage.jsx` — main page
- `src/pages/gameprep/GameDayCommandCenter.jsx`
- `src/pages/gameprep/GameCard.jsx`
- `src/pages/gameprep/GameDayHero.jsx`
- `src/pages/gameprep/GameDayStats.jsx`
- `src/pages/gameprep/GameDayHelpers.jsx`
- `src/pages/gameprep/GameJourneyPanel.jsx`
- `src/pages/gameprep/GamePrepCompletionModal.jsx`
- `src/pages/gameprep/AttendancePanel.jsx`
- `src/pages/gameprep/PostGameSummary.jsx`
- `src/pages/gameprep/QuickAttendanceModal.jsx`
- `src/pages/gameprep/QuickScoreModal.jsx`
- `src/pages/gameprep/Scoreboard.jsx`
- `src/pages/gameprep/SetScoreInput.jsx`
- `src/pages/gameprep/ScorePanel.jsx`
- `src/pages/gameprep/PeriodScoreInput.jsx`
- `src/components/games/GameComponents.jsx`
- `src/components/games/GameDetailModal.jsx`
- `src/components/games/GameScoringModal.jsx`
- `src/components/games/GameStatsEntryModal.jsx`

**For each file, document:**
- What it renders and when
- Parent-child relationships (component tree)
- Props it receives
- What data it fetches from Supabase
- Any shared state or context dependencies

**Key questions to answer:**
- What is the full user flow from "I want to prep for a game" to "lineup saved"?
- How does the Game Prep page know which games exist? (events table query)
- What is the `computeCheckpoints` / `getCurrentCheckpoint` flow in `gameCheckpoints.js`?
- Is there a concept of game phases/states (upcoming, in-progress, completed)?
- What game completion flow exists?

### 3. NAVIGATION STRUCTURE

**Files to examine:**
- `src/MainApp.jsx` — nav group definitions for all roles (admin, coach, team_manager, parent, player)
- `src/components/layout/LynxSidebar.jsx` — icon sidebar
- `src/components/layout/DashboardLayout.jsx` — overall layout wrapper
- `src/components/layout/DashboardContainer.jsx` — page container
- `src/components/layout/SidebarHelpers.jsx`
- Any component rendering horizontal top nav tabs (check the screenshots — there's a "Game Prep | Attendance | Standings | Leaderboards" bar)

**Document:**
- The exact nav group structure for each role (admin, coach, team_manager)
- How the sidebar and top nav interact (does clicking a group expand to show the horizontal sub-nav?)
- How routing works — map each nav item ID to its route path
- The `getPathForPage()` function logic
- How the "Lynx Coach >" breadcrumb/role indicator works in the top bar

**Key questions to answer:**
- Where is the horizontal top nav (visible in screenshots) rendered? Which component?
- How does the sidebar group expand/collapse work?
- What is the current mapping: sidebar group "Game Day" → sub-items → routes?
- If we rename "Game Day" to "Compete", what files need to change?
- If we add new sub-items (e.g., "Practice Hub", "Lineups"), what needs to change?

### 4. THEME SYSTEM — Light/Dark Mode Support

**Files to examine:**
- `src/contexts/ThemeContext.jsx`
- `src/constants/theme.js`
- `src/index.css` or `src/styles/` — check for Tailwind config, CSS custom properties, Lynx brand tokens

**Document:**
- All CSS custom properties set by the theme system
- The `useTheme()` hook return values
- The `useThemeClasses()` hook return values
- Tailwind custom classes (e.g., `bg-lynx-midnight`, `bg-lynx-cloud`, etc.)
- How the current `AdvancedLineupBuilder` handles theming (it currently hardcodes dark theme — document every hardcoded color)

**Key questions to answer:**
- Does `AdvancedLineupBuilder` use the theme system at all, or is it fully hardcoded dark?
- What Lynx brand color tokens exist in Tailwind config?
- What is the proper way to make a new component theme-aware?

### 5. DATABASE SCHEMA — Game/Lineup Tables

**Using grep across the codebase, document every Supabase table referenced in game-related code:**

Tables to investigate:
- `game_lineups` — document all columns used in insert/select/update
- `events` — document columns relevant to games (event_type, opponent_name, event_date, etc.)
- `event_rsvps` — document columns
- `team_players` — document columns (especially position, jersey_number, photo_url)
- `teams` — document columns
- Any table related to `game_scores`, `game_stats`, `player_stats`
- Any table related to substitutions or formation presets

**For each table, document:**
- Every column name referenced in the code
- The operations performed (select, insert, update, delete)
- Foreign key relationships implied by the code
- Any RLS or filtering patterns

**Key questions to answer:**
- Is there a `formations` or `lineup_templates` table? If not, note that we may need one.
- Is there a `substitutions` table? If not, note that we may need one.
- Does `game_lineups` support per-set data, or just per-event?
- Where does formation type (5-1, 6-2) get stored? Is it in the lineup record?

### 6. PRACTICE / DRILL — Existing Code

**Search for any existing practice or drill related code:**
- Grep for: `practice`, `drill`, `Practice`, `Drill`, `practice_plan`, `drill_library`
- Check if any DB tables exist for practices
- Check if the `events` table has `event_type = 'practice'` usage

**Document:**
- What exists today
- What would need to be built from scratch
- How practice events relate to the existing events/schedule system

### 7. RELATED COMPONENTS — Potential Reuse

**Check these components for patterns we can reuse:**
- `src/components/players/` — player card components, photo display
- `src/components/v2/coach/` — any v2 coach components
- `src/components/coach/` — coach-specific components (especially `CoachSeasonJourneyCard.jsx`)
- `src/pages/roster/RosterManagerPage.jsx` — how roster data is loaded and displayed

**Document:**
- Any player card component that shows photo + number + name + position
- How player photos are loaded (Supabase storage URL pattern)
- Any drag-and-drop patterns already in the codebase

---

## REPORT FORMAT

Write the report to `LINEUP-BUILDER-INVESTIGATION-REPORT.md` with these sections:

```
# LINEUP BUILDER V2 — INVESTIGATION REPORT

## 1. Executive Summary
(2-3 paragraph overview of findings)

## 2. Current Lineup Builder Architecture
### 2.1 File Map (file → purpose → line count)
### 2.2 Component Tree
### 2.3 State Management
### 2.4 Drag & Drop Implementation
### 2.5 Rotation Logic
### 2.6 Save/Load Flow
### 2.7 Sport Configurations

## 3. Game Prep Page Architecture
### 3.1 Component Tree
### 3.2 User Flow (game selection → lineup → game day)
### 3.3 Game Checkpoints System

## 4. Navigation Structure
### 4.1 Nav Groups by Role (exact current config)
### 4.2 Sidebar Rendering
### 4.3 Top Nav / Horizontal Tab Bar
### 4.4 Routing Map (nav ID → route path)
### 4.5 Files to Change for Nav Rename

## 5. Theme System
### 5.1 CSS Custom Properties
### 5.2 Tailwind Tokens
### 5.3 useTheme / useThemeClasses API
### 5.4 Current Lineup Builder Theme Issues (hardcoded colors list)

## 6. Database Schema
### 6.1 game_lineups (columns, operations, gaps)
### 6.2 events (game-relevant columns)
### 6.3 event_rsvps
### 6.4 team_players / players (roster data shape)
### 6.5 Game stats / scores tables
### 6.6 Missing Tables (what we need to create)

## 7. Practice/Drill Status
### 7.1 What Exists
### 7.2 What Needs to Be Built

## 8. Reusable Components
### 8.1 Player Card Patterns
### 8.2 Photo Loading Patterns
### 8.3 Drag & Drop Patterns

## 9. Recommendations
### 9.1 Files to Modify (with line ranges)
### 9.2 Files to Create
### 9.3 DB Migrations Needed
### 9.4 Suggested Phase Breakdown
### 9.5 Risk Areas / Dependencies
```

---

## IMPORTANT RULES

1. **Write everything to the markdown report file** — do NOT dump findings to console
2. **Be specific** — include actual file paths, line numbers, column names, function signatures
3. **Include code snippets** where they illustrate important patterns (keep them short)
4. **Flag conflicts** — if two files implement the same thing differently, call it out
5. **Flag hardcoded values** — especially colors, sizes, or strings that should use the theme/config system
6. **Commit the report** when done with message: `investigation: lineup builder v2 and coach nav restructure`
