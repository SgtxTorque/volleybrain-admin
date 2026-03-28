# CC-PLAYER-CARD-REDESIGN.md
# Player Card Page — Two-Column Split Pane Redesign
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Redesign ParentPlayerCardPage into a two-column split pane layout (Concept 5 direction). Left column is a static player identity card (photo, name, OVR, skill bars) that persists across all tabs. Right column has 5 tabs: Overview, Stats, Development, Badges, Games. Light mode. V2 design treatment.

All data sources already exist and are queried. This is a layout and visual restructuring, not a data model change.

---

## CRITICAL GUARDRAILS

### Do NOT Break Existing Data

- **Do not change any Supabase queries.** The 10 existing queries in ParentPlayerCardPage.jsx stay exactly as-is. Only ADD new queries for shoutouts, challenges, and XP.
- **Do not rename any state variables.** `playerData`, `skills`, `seasonStats`, `games`, `badges`, `achievements`, `evaluations`, `coachNotes`, `goals` — keep every name. Child components reference these.
- **Do not change SPORT_DISPLAY config.** The 6-sport config object (lines 11-205) stays untouched. It drives everything.
- **Do not change how OVR is calculated.** Client-side formula stays as-is.

### Do NOT Break Child Components

- **ParentPlayerHero and ParentPlayerTabs already exist** as separate files. You are REPLACING their rendering with new layout, not editing them in place.
- **Approach:** Create NEW tab content components inside the existing file OR as new files. Do NOT delete the old components until the new ones are verified working. Keep old components commented out or in backup files until Phase 7 QA confirms everything works.
- **Existing reusable components stay untouched:**
  - `src/components/charts/SpiderChart.jsx` — use as-is
  - `src/components/ui/MetricCard.jsx` — use as-is
  - `src/components/ui/ProgressRing.jsx` — use as-is
  - `src/components/engagement/ShoutoutCard.jsx` — use as-is
  - `src/components/v2/player/PlayerChallengesTab.jsx` — use as-is for reference, adapt rendering

### Build Incrementally

- **Each phase must build and compile before moving to the next.** Run `npm run build 2>&1 | tail -20` after EVERY phase.
- **If a phase causes build errors, fix them before proceeding.** Do not stack phases on broken code.
- **After each phase, verify the page loads without crashing** by checking that the component renders (even if incomplete).

### Sport Awareness

- **Every stat display, skill label, and category must use SPORT_DISPLAY config** — never hardcode volleyball terms.
- **Test mentally for both volleyball and basketball** paths through every piece of UI you build.

### Light Mode

- **This page renders in LIGHT MODE.** Use the existing Lynx V2 design tokens: white/light gray backgrounds, navy text, sky blue accents. The left column player card can use the navy gradient, but the right column content area is light.
- **Do not use dark mode classes** unless behind an `isDark` conditional.

### Report

- Write final report to `CC-PLAYER-CARD-REDESIGN-BUILD-REPORT.md` in the project root.
- Commit after each phase.

---

## REFERENCE: LAYOUT STRUCTURE

```
┌─────────────────────┬──────────────────────────────────────────────┐
│  LEFT COLUMN        │  RIGHT COLUMN                                │
│  (static, ~380px)   │  (flexible, scrollable within)               │
│                     │                                              │
│  ┌───────────────┐  │  ┌──────────────────────────────────────────┐│
│  │  PLAYER PHOTO │  │  │ Overview │ Stats │ Dev │ Badges │ Games ││
│  │  (large)      │  │  ├──────────────────────────────────────────┤│
│  │               │  │  │                                          ││
│  ├───────────────┤  │  │  Tab content area                        ││
│  │  AVA TEST     │  │  │  (scrolls within this container)         ││
│  │  #1 | SETTER  │  │  │                                          ││
│  │  78 OVR       │  │  │                                          ││
│  ├───────────────┤  │  │                                          ││
│  │  SKILL BARS   │  │  │                                          ││
│  │  Serve    90  │  │  │                                          ││
│  │  Pass     90  │  │  │                                          ││
│  │  Attack   70  │  │  │                                          ││
│  │  Block    60  │  │  │                                          ││
│  │  Dig      70  │  │  │                                          ││
│  │  Set      90  │  │  │                                          ││
│  └───────────────┘  │  └──────────────────────────────────────────┘│
└─────────────────────┴──────────────────────────────────────────────┘
```

Left column is STATIC — does not change when tabs switch. Same player identity card always visible.

---

## PHASE 1: Scaffold Two-Column Layout

### File: `src/pages/parent/ParentPlayerCardPage.jsx`

**Step 1.1:** Read the entire file. Understand the data loading flow (lines ~230-370) and how data is passed to ParentPlayerHero and ParentPlayerTabs.

**Step 1.2:** Replace the render section. Keep ALL data loading, state, and SPORT_DISPLAY config exactly as-is. Only change the JSX return.

Remove the current rendering of `<ParentPlayerHero>` and `<ParentPlayerTabs>` as stacked components. Replace with:

```
Two-column flex container:
  - Left: Static identity card (photo, name, position, OVR, skill bars)
  - Right: Tab bar + tab content area
```

**Step 1.3:** The left column identity card pulls from existing state:
- `player` — name, photo_url, position, jersey
- `teams` — primary team name, color
- `skills` — 6 skill dimensions from player_skills
- `ovrRating` — already computed
- `sc` — sport config (from SPORT_DISPLAY)

**Step 1.4:** The right column tab bar uses the same 5 tabs: Overview, Stats, Development, Badges, Games. Use `activeTab` state (already exists or add it).

**Step 1.5:** For now, render placeholder text in each tab content area: "Overview content coming in Phase 2", etc. This ensures the layout works before we fill in content.

**Step 1.6:** Style the left column:
- Navy gradient background on the photo/name section: `linear-gradient(90deg, #0B1628, #162D50)` (the horizontal gradient)
- White text for name, position, jersey
- Skill bars below in a light card
- Width: `w-[380px]` flex-shrink-0

**Step 1.7:** Style the right column:
- Light background (white or `bg-slate-50`)
- Tab bar at the top with sky blue active indicator
- Content area with `overflow-y-auto` for internal scrolling
- Full viewport height minus topbar: `h-[calc(100vh-var(--v2-topbar-height,56px))]`

**Step 1.8:** Remove PageShell wrapper if present — this page has its own layout.

**Step 1.9:** Verify build compiles. Verify page loads with the two-column scaffold.

**Commit:** `redesign: PlayerCard two-column scaffold — identity left, tabs right`

---

## PHASE 2: Overview Tab

### File: `src/pages/parent/ParentPlayerCardPage.jsx` (or new file if extracting tabs)

The Overview tab is the landing view. It shows a high-level snapshot.

**Content sections (in this order):**

1. **Season Progress** — 4 stat tiles in a row showing primary per-game stats (e.g., Win Rate, Avg Sets/G, Points Responsible, Impact Rating for volleyball). Use existing `perGameStats` data. Style as compact metric cards with large bold numbers, small labels, and optional trend indicators.

2. **Recent Games** — Compact 3-row game log (last 3 games only). Each row: date, opponent, W/L pill, score, 2-3 key stats. Data from `transformedGames.slice(0, 3)`. Clicking a game row could navigate to game detail (future enhancement — for now just display).

3. **Elite Specialty Card** — A dynamic "Lynx chatter" card. Generate this from the player's stats:
   - Find the player's top stat (highest per-game average)
   - Generate a headline like "Defensive Anchor" (if digs are highest) or "Floor General" (if assists are highest)
   - Short description based on the data: "Ava leads the team in assists with 12.4 per game, ranking in the top 5 of the league."
   - Use SPORT_DISPLAY to get sport-appropriate labels
   - This is client-side generated text, not AI-generated — it's template-driven from stat data

4. **Status Cards** (right side of elite specialty) — Small cards showing:
   - Next Badge progress (from `achievements` data — nearest to completion)
   - Pro Certified / status indicator (based on OVR rating tier)

**Step 2.1:** Build each section using existing data variables. Do NOT add new queries.

**Step 2.2:** Verify build. Verify Overview tab renders with real data.

**Commit:** `feat: PlayerCard Overview tab — season progress, recent games, elite specialty`

---

## PHASE 3: Stats Tab

**Content sections:**

1. **Season Totals** — Primary metrics row (same as current). Use SPORT_DISPLAY primaryStats. Large bold numbers with small labels and context text ("+2 vs Last Year", "Elite Tier", etc. — these can be computed by comparing to league averages if available, or just show raw totals).

2. **Spider Graph + Phase Cards** — Three-column layout:
   - Left: Spider/radar chart using existing `SpiderChart` component with current skill data
   - Center: "Offensive Phase" card — group offensive stats (kills, aces, hit percentage for volleyball; points, FGM, 3PM for basketball). One solid card, not individual colored cards. Clean stat rows inside.
   - Right: "Defensive Phase" card — group defensive stats (digs, blocks, reception % for volleyball; rebounds, steals, blocks for basketball). Same solid card treatment.
   
   The spider graph should show TWO overlays if evaluation data exists: latest evaluation vs first evaluation (baseline). Use `SpiderChart`'s `compareData` prop.

3. **Game-by-Game Breakdown** — Full table with all games. Columns: Date/Opponent, Result, then sport-specific stat columns. Use existing `transformedGames` data. Add a search/filter input for opponent name. Add sort capability.

**Step 3.1:** Build using existing state variables. The offensive/defensive split comes from SPORT_DISPLAY — check if it has a phase grouping or if you need to define one based on `statCategories` and `primaryStats`.

**Step 3.2:** For the spider graph comparison, use `evaluations` state. If evaluations exist, use the first evaluation's skills as `compareData` and current skills as primary data.

**Step 3.3:** Verify build. Verify Stats tab renders.

**Commit:** `feat: PlayerCard Stats tab — season totals, spider graph, phase cards, game log`

---

## PHASE 4: Development Tab

**Content sections:**

1. **Skill Progression** — Spider chart showing growth trajectory. Two overlays: current skills (solid) vs baseline/first eval (dashed). Include a text summary: "Growth Trajectory: +12% YoY" (computed from skill data if baseline exists).

2. **Coach Intelligence** — Cards showing coach feedback from `coachNotes`. Each card: quote text, coach name, date. Only show `is_private = false` notes.

3. **Strategic Objectives** — Player goals from `goals` state. Each goal: title, description, progress bar (current_value / target_value), status pill (in progress / completed). Use existing goal data.

4. **Career Milestones** — Timeline of evaluations from `evaluations` state. Each entry: date, evaluation type, overall score, brief skills summary.

**Step 4.1:** Build using existing state variables (`evaluations`, `coachNotes`, `goals`, `skills`).

**Step 4.2:** Verify build.

**Commit:** `feat: PlayerCard Development tab — progression, coach notes, goals, milestones`

---

## PHASE 5: Badges Tab (+ Shoutouts + Challenges)

**Content sections:**

1. **Earned Badges** — Grid of earned badges with tier-colored borders (Common=gray, Rare=blue, Epic=purple, Legendary=gold). Each badge: icon, name, tier label, earned date, description. Use existing `badges` state data + `badgeDefinitions` for metadata.

2. **In-Progress Badges** — Cards with progress bars. Each: badge name, tier, progress (current_value / target_value as percentage), description of what's needed. Use existing `achievements` state.

3. **Recent Shoutouts** — NEW QUERY needed. Add a query for `shoutouts` where `receiver_id = playerId`, limited to 5 most recent, joined to profiles for giver name. Render using existing `ShoutoutCard` component or a simplified version.

4. **Active Challenges** — NEW QUERY needed. Add a query for `challenge_participants` where `player_id = playerId` and `completed = false`, joined to `coach_challenges` for challenge details. Show title, progress bar, XP reward, deadline.

5. **Badge Rarity Guide** — Small footer section showing the 4 tiers with their colors and descriptions.

**Step 5.1:** Add the two new queries to the data loading function. Add new state variables:
```javascript
const [shoutouts, setShoutouts] = useState([])
const [challenges, setChallenges] = useState([])
```

**Step 5.2:** Query shoutouts:
```javascript
const { data: shoutoutData } = await supabase
  .from('shoutouts')
  .select('*, giver:profiles!giver_id(first_name, last_name, photo_url)')
  .eq('receiver_id', playerId)
  .order('created_at', { ascending: false })
  .limit(5)
```
Verify this query shape matches the `shoutouts` table columns from the investigation. If the join syntax doesn't match (e.g., `giver_id` references `profiles` via a different FK), adjust.

**Step 5.3:** Query challenges:
```javascript
const { data: challengeData } = await supabase
  .from('challenge_participants')
  .select('*, challenge:coach_challenges(*)')
  .eq('player_id', playerId)
  .order('opted_in_at', { ascending: false })
```

**Step 5.4:** Build each section. Wrap each new query in try/catch so that if the query fails (e.g., FK issue, permissions), it silently returns empty data rather than crashing the page.

**Step 5.5:** Verify build.

**Commit:** `feat: PlayerCard Badges tab — earned, in-progress, shoutouts, challenges`

---

## PHASE 6: Games Tab

**Content sections:**

1. **Season Game Log Header** — "X Games Played · YYYY Season" with filter pills: All, Wins, Losses. Sort toggle: Latest First / Oldest First.

2. **Game Cards** — Each game as a compact row/card:
   - Left: Date + VS/@ indicator
   - Center: Opponent name (bold), Win/Loss pill, score
   - Right: 3 key stat values for the sport + performance grade circle (A+, A, B, etc.)
   
   Performance grade: compute from per-game stats relative to season averages. If the player's stat line for that game is above their season average in 4+ categories = A+, 3 = A, 2 = B, 1 = C, 0 = D. This is client-side computation.

3. **Next Game Footer** — If there's an upcoming game in the schedule, show "Next Game: vs [Opponent] (H/A)" with a link to schedule.

**Step 6.1:** Build using existing `transformedGames` data. The current Games tab already renders a game log — adapt its data shape for the new visual treatment.

**Step 6.2:** Add the filter (All/Wins/Losses) and sort as client-side state.

**Step 6.3:** Verify build.

**Commit:** `feat: PlayerCard Games tab — game log with filters, grades, next game`

---

## PHASE 7: QA Pass + Cleanup

**Step 7.1:** Verify every tab renders without errors for a player with data.

**Step 7.2:** Verify every tab renders gracefully for a player with NO data (empty states, not crashes). Check:
- No season stats → "No stats this season" message
- No games played → "No games played yet"
- No skills → Spider chart hidden or shows placeholder
- No badges → "No badges earned yet"
- No shoutouts → Section hidden
- No challenges → "No active challenges"
- No evaluations → "No evaluations yet"
- No coach notes → "No coach feedback yet"
- No goals → "No goals set yet"

**Step 7.3:** Verify sport switching. If test data exists for basketball, check that basketball stat labels, skill dimensions, and phase groupings render correctly.

**Step 7.4:** Verify left column identity card stays static when switching tabs.

**Step 7.5:** Verify page doesn't crash on refresh, back navigation, or direct URL access.

**Step 7.6:** Remove or comment out the old `ParentPlayerHero` and `ParentPlayerTabs` components if they're no longer rendered. If they're in separate files, leave the files but add a comment at the top noting they're superseded by the new layout.

**Step 7.7:** `npm run build 2>&1 | tail -20` — clean build.

**Step 7.8:** Write `CC-PLAYER-CARD-REDESIGN-BUILD-REPORT.md`:

```markdown
# Player Card Redesign — Build Report

## Completed
- [list each phase and what was built]

## Data Status
- Shoutout query: [working / failed / empty data]
- Challenge query: [working / failed / empty data]
- XP/Level: [implemented / deferred]

## Empty State Coverage
- [list each empty state and whether it's handled]

## Sport Awareness
- Volleyball rendering: [verified / issues]
- Basketball rendering: [verified / issues / no test data]

## Known Limitations
- [any issues]

## Files Changed
- [list]

## Files Deprecated
- [old components no longer rendered]
```

**Commit:** `chore: PlayerCard redesign QA pass + cleanup`

---

## FILES MODIFIED

| Phase | File | What Changes |
|-------|------|-------------|
| 1-6 | `src/pages/parent/ParentPlayerCardPage.jsx` | Complete render rewrite + 2 new queries |
| 1 | `src/pages/parent/ParentPlayerHero.jsx` | Deprecated (left column replaces it) |
| 1 | `src/pages/parent/ParentPlayerTabs.jsx` | Deprecated (tab content inline or new files) |

**Files NOT modified:**
- `src/components/charts/SpiderChart.jsx` — used as-is
- `src/components/ui/MetricCard.jsx` — used as-is
- `src/components/ui/ProgressRing.jsx` — used as-is
- `src/components/engagement/ShoutoutCard.jsx` — used as-is
- `SPORT_DISPLAY` config — untouched
- All Supabase queries (existing 10) — untouched
- All save handlers — none exist on this page (read-only view)

---

## WHAT THIS SPEC DOES NOT DO

- Does not change database schema
- Does not change SPORT_DISPLAY config
- Does not change OVR calculation
- Does not change any existing queries (only adds 2 new ones)
- Does not affect PlayerProfilePage (the registration info page)
- Does not build HexBadge, LevelBadge, or AchievementCelebrationModal (future features)
- Does not implement "Compare Player" functionality (future feature)
- Does not implement "Export Dossier / PDF" (future feature)
- Does not implement dark mode for this page (light mode only for now)
