# CC-PLAYER-CARD-REDESIGN-INVESTIGATION.md
# Player Card Page Redesign — Data & Architecture Investigation
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## PURPOSE

This is an **investigation-only** spec. Do NOT modify any files. We are redesigning the ParentPlayerCardPage (the sport stats/gamification view at `/parent/player/:playerId`) into a two-column split pane layout inspired by Concept 5 from design mockups. Before building, we need to know exactly what data exists, what tables are real, what queries work, and what we'd be building against air.

Write your report to: `CC-PLAYER-CARD-REDESIGN-REPORT.md` in the project root.

---

## INVESTIGATION TASKS

### 1. Current ParentPlayerCardPage Architecture

Open and read `src/pages/parent/ParentPlayerCardPage.jsx` completely.

**Report:**
- Total line count
- Component signature — what props does it receive?
- What tabs/sections exist currently?
- What sport config maps exist (volleyball, basketball, etc.)?
- How is sport determined?
- List every Supabase query in the file — table name, columns selected, and what the data is used for

### 2. Database Tables — What Exists?

For each of these tables, search the ENTIRE codebase (`src/` directory) for queries against them. Also check `SUPABASE_SCHEMA.md`, `SCHEMA_REFERENCE.csv`, `DATABASE_SCHEMA.md`, or any schema documentation files in the repo.

Report for each table: Does it exist? What columns does it have? Is it queried anywhere on the web? Is there actual data in it (based on whether any page renders data from it)?

| Table | Exists? | Key Columns | Queried on Web? | Has Data? |
|-------|---------|-------------|----------------|-----------|

Tables to check:
- `player_season_stats`
- `game_player_stats`
- `player_badges` or `player_achievement_progress`
- `player_skills`
- `player_evaluations`
- `player_coach_notes`
- `player_goals`
- `shoutouts`
- `challenges` or `player_challenges`
- `challenge_progress`

### 3. Per-Game Stats Availability

**Report:**
- Is there a `game_player_stats` table (or similar) that stores individual player stats per game?
- What columns does it have? (e.g., kills, aces, digs per game for volleyball; points, rebounds, assists per game for basketball)
- Is this data populated from game scoring flows (QuickScoreModal, GamePrepCompletionModal)?
- Can we render a "game-by-game breakdown" table from this data?

### 4. Skills / Spider Graph Data

**Report:**
- Where do skill ratings come from? (player_skills table? player_evaluations? manually entered? computed from stats?)
- What skill dimensions exist per sport? (volleyball: serve, pass, attack, block, dig, set? basketball: shooting, passing, dribbling, rebounding, defense, speed?)
- Is there a "baseline" or "tryout" evaluation snapshot we can compare against current skills?
- What data shape would a spider graph need? (e.g., `{ serve: 90, pass: 85, attack: 70, ... }`)

### 5. Badge / Achievement System

**Report:**
- What tables store earned badges? (`player_badges`? `player_achievement_progress`?)
- What does a badge record look like? (badge_id, player_id, earned_date, progress_percentage, etc.)
- Where is the badge catalog defined? (database table? constants file? both?)
- Are badge images stored in Supabase Storage? What bucket? What URL pattern?
- Is there badge progress tracking (e.g., "75% toward Leadership Gold")?

### 6. Shoutout System

**Report:**
- What table stores shoutouts?
- What does a shoutout record look like?
- Is there a web-facing query for shoutouts, or only mobile?
- Can we show "recent shoutouts for this player" on the badges/engagement tab?

### 7. Challenge System

**Report:**
- What tables store challenges and challenge progress?
- What does a challenge record look like? (title, description, target, current progress, etc.)
- Is there a web-facing query, or only mobile?
- Can we show "active challenges" and "completed challenges" for a player?

### 8. Season Stats Aggregation

**Report:**
- How are season-level stats computed? (Supabase view? Client-side aggregation from game stats? Pre-computed in player_season_stats?)
- What columns are available for volleyball? For basketball?
- Are "per game" averages pre-computed or do we need to calculate them?

### 9. OVR Rating

**Report:**
- How is the OVR (Overall Rating) number calculated? (e.g., the "78" shown on the current player card)
- Is it stored in the database or computed client-side?
- What formula/algorithm is used?
- Is it sport-specific?

### 10. Existing Sub-Components

Check if any reusable components already exist in the codebase that we could leverage:

**Report on each — does it exist, what file, what does it render?**
- Spider/radar chart component
- Power bar / skill bar component
- Badge card component
- Game log / game result row component
- Stat tile / stat card component
- Shoutout card component
- Challenge card / progress component

### 11. Mobile Reference

Check `reference/mobile-app/` or `reference/mobile-source/` for any player card related files.

**Report:**
- What does the mobile player card show?
- What data does it pull?
- Are there mobile-specific components we should know about?

---

## OUTPUT FORMAT

Write to: `CC-PLAYER-CARD-REDESIGN-REPORT.md`

```markdown
# Player Card Redesign — Investigation Report

## 1. Current Architecture
[findings]

## 2. Database Tables
[table with exists/columns/queried/data status]

## 3. Per-Game Stats
[findings]

## 4. Skills / Spider Graph
[findings]

## 5. Badge System
[findings]

## 6. Shoutout System
[findings]

## 7. Challenge System
[findings]

## 8. Season Stats
[findings]

## 9. OVR Rating
[findings]

## 10. Existing Components
[findings]

## 11. Mobile Reference
[findings]

## Summary — What's Buildable Now vs What Needs Backend Work
[categorized list]
```

---

## REMINDER

**Do NOT modify any files.** Read only. Report to file.
