# Player Card Redesign — Investigation Report

---

## 1. Current Architecture

**File:** `src/pages/parent/ParentPlayerCardPage.jsx`
**Line count:** 444 lines

**Component signature:**
```jsx
function ParentPlayerCardPage({ playerId, roleContext, showToast, seasonId: propSeasonId })
```
- `roleContext` and `showToast` are passed but never used internally.

**Structure:** This is a **data orchestration component** — it fetches 10 datasets, transforms them, and passes everything to two child components:
- `ParentPlayerHero` (166 lines) — hero card with photo, name, OVR rating, badges, per-game stats bar
- `ParentPlayerTabs` (381 lines) — 5-tab dashboard (Overview, Stats, Development, Badges, Games)

**Tabs/sections in ParentPlayerTabs:**

| Tab | Content |
|-----|---------|
| **Overview** | 3-column: Power Levels (spider chart + skill bars), Season Progress + Recent Games, Badges + Trend chart |
| **Stats** | Season Totals grid, Detail Sections (2-col), Per Game Averages, Mini bar charts for trends |
| **Development** | Spider chart (latest vs first eval), Coach Feedback, Goals with progress bars, Season Journey timeline |
| **Badges** | Earned Badges (4-col grid), In Progress (2-col with progress bars) |
| **Games** | Full game log table: date, opponent, score, W/L badge, stat columns |

**Sport config:** `SPORT_DISPLAY` object (lines 11–205) supports **6 sports + 2 aliases**:

| Sport | Positions | Primary Stats | Skills (6 each) |
|-------|-----------|---------------|------------------|
| Volleyball | OH, S, MB, OPP, L, DS, RS | Kills, Digs, Aces, Blocks, Assists | serving, passing, hitting, blocking, defense, setting |
| Basketball | PG, SG, SF, PF, C | Points*, Rebounds, Assists, Steals, Blocks | shooting, passing, dribbling, rebounding, defense, speed |
| Soccer | GK, Defender, Midfielder, Forward | Goals, Assists, Shots, Saves, Fouls | shooting, passing, dribbling, speed, defense, stamina |
| Baseball | Pitcher, Catcher, 1B-3B, SS, OF | Hits, Runs, RBIs, HRs, SBs | hitting, fielding, throwing, speed, batting_eye, power |
| Football | QB, RB, WR, TE, OL, DL, LB, DB, K | Pass Yds, Rush Yds, Rec Yds, TDs*, Tackles | arm_strength, speed, agility, catching, tackling, awareness |
| Hockey | Goalie, Defense, Center, Wing | Goals, Assists, Shots, Saves, +/- | skating, shooting, passing, checking, defense, speed |
| Flag Football | alias → football config | | |
| Softball | alias → baseball config | | |

*Calculated stats (basketball points = FGM*2 + 3PM*3 + FTM; football TDs = pass+rush+rec)

**Sport determination (priority order):**
1. First team assignment → team → season → sport → name
2. Player's `sport` column
3. Default: volleyball

### All Supabase Queries (10 total)

| # | Table | Select | Purpose |
|---|-------|--------|---------|
| 1 | `players` | `*` | Player profile (name, position, jersey, photo) |
| 2 | `team_players` | `*, teams(id, name, color, season_id, seasons(id, name, sports(name, icon)))` | Team assignments with nested season/sport |
| 3 | `player_season_stats` | `*` | Season aggregate stats |
| 4 | `player_badges` | `*` | Earned badges |
| 5 | `player_achievement_progress` | `*` | In-progress badges |
| 6 | `game_player_stats` | `*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)` | Per-game stats with game info |
| 7 | `player_skills` | `*` | Skill ratings |
| 8 | `player_evaluations` | `evaluation_date, evaluation_type, overall_score, skills` | Historical eval snapshots |
| 9 | `player_coach_notes` | `content, note_type, created_at` | Public coach feedback |
| 10 | `player_goals` | `*` | Development goals |

---

## 2. Database Tables

| Table | Exists? | Key Columns | Queried on Web? | Where? |
|-------|---------|-------------|-----------------|--------|
| `player_season_stats` | YES | games_played, kills, digs, aces, blocks, assists, hit_percentage, attack_attempts, attack_errors, pass_rating, serve_receive_pct | YES | ParentPlayerCardPage, AchievementsCatalogPage |
| `game_player_stats` | YES | player_id, event_id, all sport-specific stat columns, joins schedule_events | YES | ParentPlayerCardPage, GameDetailModal |
| `player_badges` | YES | id, player_id, badge_type, badge_name, awarded_by, awarded_at, notes | YES | ParentPlayerCardPage, GameDetailModal |
| `player_achievement_progress` | YES | player_id, achievement_id, current_value, target_value, last_updated_at | YES | achievement-engine.js, shoutout-service.js |
| `player_skills` | YES | player_id, serving, passing, hitting, blocking, defense, setting, sport, skills_data, season_id | YES | ParentPlayerCardPage, PlayerComponents, PlayerCardExpanded, RosterManagerPage |
| `player_evaluations` | YES | player_id, season_id, evaluated_by, evaluation_type, evaluation_date, overall_score, skills, notes | YES | ParentPlayerCardPage, PlayerComponents, RosterManagerPage, PlayerDevelopmentCard |
| `player_coach_notes` | YES | player_id, coach_id, season_id, note_type, content, is_private, created_at | YES | ParentPlayerCardPage, PlayerComponents, PlayerCardExpanded, PlayerDevelopmentCard |
| `player_goals` | YES | player_id, season_id, created_by, title, description, category, target_value, current_value, target_date, status, progress_notes | YES | ParentPlayerCardPage, PlayerComponents, PlayerDevelopmentCard |
| `shoutouts` | YES | giver_id, giver_role, receiver_id, receiver_role, team_id, organization_id, category_id, category, message, show_on_team_wall, post_id | YES | shoutout-service.js, achievement-engine.js |
| `coach_challenges` | YES | coach_id, team_id, organization_id, title, description, challenge_type, metric_type, stat_key, target_value, xp_reward, badge_id, custom_reward_text, starts_at, ends_at, status, post_id | YES | challenge-service.js |
| `challenge_participants` | YES | challenge_id, player_id, current_value, completed, completed_at, contribution, opted_in_at | YES | challenge-service.js |
| `game_stats` | YES | player_id, game_id, stat_type, value, set_number | YES | achievement-engine.js |
| `achievements` | YES | id, name, description, category, type, rarity, stat_key, threshold, requires_verification, icon, is_active, xp_reward | YES | achievement-engine.js, shoutout-service.js |
| `player_achievements` | YES | player_id, achievement_id, earned_at, stat_value_at_unlock, verified_by, verified_at | YES | achievement-engine.js, shoutout-service.js |
| `xp_ledger` | YES | player_id, organization_id, xp_amount, source_type, source_id, description | YES | achievement-engine.js, challenge-service.js, shoutout-service.js |

**All 15 tables exist and are actively queried on web.** Two related tables exist but are unused: `game_sets`, `achievement_categories`.

---

## 3. Per-Game Stats

**Table:** `game_player_stats` — EXISTS and IS QUERIED

**Columns available:** All sport-specific stat columns (kills, digs, aces, blocks, assists for volleyball; points, rebounds, assists, steals, blocks for basketball; etc.) plus:
- `event_id` → joins to `schedule_events` for event_date, opponent_name, our_score, their_score
- `player_id`, `team_id`, `season_id`

**How it's populated:** From game scoring flows (GameDetailModal, game components). Data enters via coach-facing game stat entry.

**Current usage in ParentPlayerCardPage:**
- Query at line 280: fetches all `game_player_stats` for the player/season, joined to schedule_events
- Transforms into `transformedGames` array: `{ date, opponent, score, result (W/L), statValues, raw }`
- Calculates `perGameStats` (5 primary stats averaged per game)
- Generates `trends` arrays (last 6 games per stat for sparkline charts)

**Can we render a game-by-game breakdown?** YES — data shape already supports it. The current Games tab already renders a full game log table.

---

## 4. Skills / Spider Graph Data

**Source:** `player_skills` table — coach-entered ratings

**Columns per sport (6 dimensions each):**
- Volleyball: serving, passing, hitting, blocking, defense, setting
- Basketball: shooting, passing, dribbling, rebounding, defense, speed
- Soccer: shooting, passing, dribbling, speed, defense, stamina
- Baseball: hitting, fielding, throwing, speed, batting_eye, power
- Football: arm_strength, speed, agility, catching, tackling, awareness
- Hockey: skating, shooting, passing, checking, defense, speed

**Scale:** 1–10 (or 1–100; `getSkillValue` normalizes — if value ≤ 10, multiplies by 10 for display)

**Baseline comparison:** YES — `player_evaluations` stores historical snapshots. The Development tab already compares latest eval vs first eval in a SpiderChart overlay.

**Data shape for spider graph:**
```js
// Already implemented in ParentPlayerTabs.jsx
const chartData = sc.skills.map(s => ({
  label: sc.skillLabels?.[s] || s,
  value: skills?.[s] || 0
}))
// compareData from evalHistory[0].skills for baseline overlay
```

**Spider chart component:** `src/components/charts/SpiderChart.jsx` — fully implemented, supports `data`, `compareData`, `maxValue`, `size`, `color`, `compareColor`, `isDark`.

---

## 5. Badge / Achievement System

**Two parallel systems:**

### A. Player Badges (`player_badges` table)
- Records: id, player_id, badge_type, badge_name, awarded_by, awarded_at, notes
- Used in: GameDetailModal, ParentPlayerCardPage
- Display: `badgeDefinitions` constant in ParentPlayerHero.jsx defines 10 badge types with icons, colors, rarities:
  - MVP (gold/legendary), Offensive Player (red/epic), Defensive Player (blue/epic), Most Improved (green/rare), Leadership (purple/rare), Hustle (orange/uncommon), Sportsmanship (teal/uncommon), Rookie (sky/common), Academic (indigo/common), All-Star (amber/legendary)

### B. Achievement System (`achievements` + `player_achievements` + `player_achievement_progress`)
- `achievements`: catalog — id, name, description, category, type, rarity, stat_key, threshold, icon, xp_reward
- `player_achievements`: unlocked — player_id, achievement_id, earned_at, stat_value_at_unlock
- `player_achievement_progress`: tracking — player_id, achievement_id, current_value, target_value
- Achievement engine (`src/lib/achievement-engine.js`) handles auto-unlock, XP awards, progress tracking

**Badge images:** NOT in Supabase Storage. Badges use emoji icons defined in `badgeDefinitions` constant. No image URLs or bucket references for badges.

**Progress tracking:** YES — `player_achievement_progress` tracks current_value vs target_value. The Badges tab already renders progress bars for in-progress achievements.

---

## 6. Shoutout System

**Table:** `shoutouts` — EXISTS and IS QUERIED

**Record shape:**
```
id, giver_id, giver_role, receiver_id, receiver_role, team_id, organization_id,
category_id, category, message, show_on_team_wall, post_id, created_at
```

**Web queries:**
- `src/lib/shoutout-service.js` — `giveShoutout()`, `fetchShoutoutCategories()`, `fetchShoutoutStats()`
- `src/lib/achievement-engine.js` — counts shoutouts_given and shoutouts_received for achievement checks

**Categories (10 defaults in `engagement-constants.js`):**
Great Effort, Leadership, Most Improved, Team Player, Clutch Player, Hardest Worker, Great Communication, Positive Attitude, Sportsmanship, Coachable

**Shoutout card component:** `src/components/engagement/ShoutoutCard.jsx` — renders colored card with emoji, giver/receiver names, message, +15 XP badge

**Can we show "recent shoutouts for this player"?** YES — query `shoutouts` where `receiver_id = playerId`, join to `profiles` for giver name. Service function `fetchShoutoutStats()` already aggregates counts.

---

## 7. Challenge System

**Tables:**
- `coach_challenges` — challenge definitions (title, description, type, metric, target, xp_reward, dates, status)
- `challenge_participants` — player opt-ins (challenge_id, player_id, current_value, completed, completed_at)

**Record shapes:**
```
coach_challenges: id, coach_id, team_id, organization_id, title, description,
  challenge_type (individual/team), metric_type, stat_key, target_value,
  xp_reward (25-500), badge_id, custom_reward_text, starts_at, ends_at, status, post_id

challenge_participants: id, challenge_id, player_id, current_value, completed,
  completed_at, contribution, opted_in_at
```

**Web queries:** All in `src/lib/challenge-service.js`:
- `createChallenge()` — coach creates
- `optInToChallenge()` — player joins
- `updateChallengeProgress()` — updates current_value, auto-completes at target
- `fetchActiveChallenges(teamId)` — active challenges with participant data
- `fetchChallengeDetail(challengeId)` — single challenge with leaderboard
- `completeChallenge()` — awards XP to completers

**Challenge card components:**
- `src/components/v2/player/PlayerChallengesTab.jsx` — challenge rows with progress bars
- `src/components/engagement/CreateChallengeModal.jsx` — coach creation modal
- `src/components/v2/coach/CoachEngagementTab.jsx` — coach view of active challenges

**Can we show active/completed challenges for a player?** YES — query `challenge_participants` where `player_id = playerId`, join to `coach_challenges`. Data shape already supports progress display.

---

## 8. Season Stats Aggregation

**Source:** `player_season_stats` table — appears to be pre-computed (not a materialized view or client-side aggregation)

**Columns available for volleyball:** games_played, kills, digs, aces, blocks, assists, hit_percentage, attack_attempts, attack_errors, pass_rating, serve_receive_pct

**Columns available for basketball:** games_played, points, rebounds, assists, steals, blocks, fgm, fga, three_pm, three_pa, ftm, fta (+ calculated FG%, 3P%, FT%)

**Per-game averages:** Calculated CLIENT-SIDE in ParentPlayerCardPage.jsx (lines 387-392):
```js
perGameStats = sc.primaryStats.map(ps => ({
  key: ps.key,
  label: ps.shortLabel || ps.label,
  value: gp > 0 ? (val / gp).toFixed(1) : '0.0',
  total: val
}))
```

So season totals are stored, per-game averages are computed at render time by dividing by `games_played`.

---

## 9. OVR Rating

**Location:** ParentPlayerCardPage.jsx lines 369-375

**Calculation:** Computed CLIENT-SIDE — NOT stored in database.

**Formula:**
```js
const vals = sc.skills.map(s => skills[s]).filter(v => v != null)
const avg = vals.reduce((a, b) => a + b, 0) / vals.length
return avg <= 10 ? Math.round(avg * 10) : Math.round(avg)
```

**Algorithm:** Simple average of all sport-specific skill values (6 skills per sport).

**Scale handling:** If individual skills are 1–10 scale, multiplies average by 10 to get 0–100 range. If already 0–100, uses as-is.

**Sport-specific:** YES — uses the sport's skill list from `SPORT_DISPLAY[sport].skills`.

**Null handling:** Returns `null` if no skills data exists (hero shows no rating circle).

---

## 10. Existing Components

| Component | Exists? | File | What It Renders |
|-----------|---------|------|-----------------|
| **Spider/Radar Chart** | YES | `src/components/charts/SpiderChart.jsx` | SVG radar with filled polygons, labels, optional comparison overlay. Props: data, compareData, maxValue, size, color, compareColor, isDark |
| **Skill Bar** | YES (inline) | `src/pages/parent/ParentPlayerTabs.jsx` (SkillBar function) | Horizontal progress bar with label and value. Also: `src/components/v2/player/PlayerSkillsTab.jsx` (1-10 bars with color tiers) |
| **Badge Card** | YES | `src/pages/parent/ParentPlayerTabs.jsx` (BadgeIcon function) + `src/components/v2/player/PlayerBadgesTab.jsx` | Badge with icon, rarity color, label, earned date, progress bar |
| **Game Log Row** | YES (inline) | `src/pages/parent/ParentPlayerTabs.jsx` (GamesTab) | Date, opponent, W/L badge, score, stat columns per game |
| **Stat Tile** | YES | `src/components/ui/MetricCard.jsx` | Card with label, large value, sublabel, icon, status indicator |
| **Shoutout Card** | YES | `src/components/engagement/ShoutoutCard.jsx` | Colored card with emoji, names, message, XP pill, time ago |
| **Challenge Card** | YES | `src/components/v2/player/PlayerChallengesTab.jsx` | Challenge row with icon, title, progress bar, XP reward |
| **Create Challenge Modal** | YES | `src/components/engagement/CreateChallengeModal.jsx` | Multi-field modal for coach challenge creation |
| **Achievement Celebration** | NO | Not implemented | Referenced in CLAUDE.md Phase 3 but not built |
| **HexBadge** | NO | Not implemented | Referenced in CLAUDE.md Phase 3 but not built |
| **LevelBadge** | NO | Not implemented | Data exists in engagement-constants.js but no UI component |
| **ProgressRing** | YES | `src/components/ui/ProgressRing.jsx` | Circular SVG progress indicator |

---

## 11. Mobile Reference

**Location checked:** `reference/mobile-app/` — contains only Git metadata, no source code files (.js/.jsx/.tsx/.ts)

**No mobile player card reference code available.** The mobile app source lives in the sister repo `volleybrain-mobile3` which is not included in this archive.

**V2 Design Brief found:** `reference/v2-redesign/V2-DESIGN-BRIEF.md` — describes the Lynx V2 visual system (navy gradients, typography, card styling) but does not contain mobile player card specifics.

---

## Summary — What's Buildable Now vs What Needs Backend Work

### BUILDABLE NOW (data exists, queries work, components available)

1. **Two-column split-pane layout** — just a layout change, no new data needed
2. **Hero card with OVR rating** — player data + skills → OVR already computed client-side
3. **Spider/radar chart for skills** — `SpiderChart` component exists, `player_skills` data available
4. **Skill bars (Power Levels)** — inline `SkillBar` component exists, skill data available
5. **Season stats grid** — `player_season_stats` table exists and is queried
6. **Per-game averages** — computed client-side from season stats / games_played
7. **Game log table** — `game_player_stats` joined to `schedule_events` already works
8. **Trend mini-charts** — `MiniBarChart` inline component + game-by-game data exists
9. **Earned badges display** — `player_badges` + `badgeDefinitions` constant
10. **In-progress badges with progress bars** — `player_achievement_progress` data available
11. **Coach feedback/notes** — `player_coach_notes` table queried, filtered by `is_private`
12. **Player goals with progress** — `player_goals` table fully wired (CRUD exists)
13. **Evaluation history timeline** — `player_evaluations` table queried, spider chart comparison works
14. **Shoutout display** — `ShoutoutCard` component + `shoutouts` table + service functions exist
15. **Challenge progress** — `PlayerChallengesTab` component + `challenge_participants` data available

### NEEDS NEW QUERIES (tables exist, but not queried from PlayerCard page yet)

1. **Recent shoutouts for this player** — need new query: `shoutouts` where `receiver_id = playerId`, join profiles
2. **Active challenges for this player** — need new query: `challenge_participants` where `player_id = playerId`, join `coach_challenges`
3. **XP total and level** — need query: `profiles.total_xp` + `getLevelFromXP()` from engagement-constants.js

### NEEDS NEW COMPONENTS

1. **HexBadge** — hexagonal SVG badge with tier colors (referenced but not built)
2. **LevelBadge** — compact level indicator with tier colors (data system exists, no UI)
3. **AchievementCelebrationModal** — confetti celebration on unlock (referenced but not built)

### DOES NOT EXIST / NEEDS BACKEND WORK

Nothing critical is missing. All 15 data tables exist and contain the right columns. The redesign is primarily a **layout and visual restructuring** — all data sources are already wired.
