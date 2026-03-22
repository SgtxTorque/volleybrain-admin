# CC-V2-QA-ROUND2.md
## Lynx Web Admin — V2 QA Round 2
### Admin Registrations Tab + Coach Dashboard Enhancements

**Branch:** `main`
**Rule:** This spec has TWO sections. Section A is layout/presentation work using existing data. Section B requires expanded Supabase selects. Both are safe to execute but Section B needs extra care around query changes. Build-verify-commit after each numbered fix.

---

## SCOPE BOUNDARIES

### DO touch:
- `src/pages/dashboard/DashboardPage.jsx` (admin dashboard — registrations tab wiring)
- `src/pages/roles/CoachDashboard.jsx` (coach dashboard — roster tab, body tabs, sidebar)
- `src/components/v2/admin/AdminRegistrationsTab.jsx` (redesign)
- `src/components/v2/coach/CoachRosterTab.jsx` (add columns)
- `src/components/v2/coach/CoachStatsTab.jsx` (add eval data)
- Any NEW files in `src/components/v2/admin/` or `src/components/v2/coach/`

### DO NOT touch:
- `src/contexts/` or `src/hooks/` (no context changes)
- `src/lib/routes.js`
- `src/components/v2/` shared components (TopBar, HeroCard, etc. are LOCKED)
- `MainApp.jsx`
- Any service layer file
- PlayerDashboard, ParentDashboard, TeamManagerDashboard (separate QA pass)

### QUERY RULES:
- You MAY add `.select()` columns to EXISTING queries in `loadDashboardData()` or coach data fetching
- You MAY add NEW queries inside existing `useEffect` blocks to fetch supplementary data
- You MUST NOT change the table structure, RLS policies, or create new tables
- You MUST wrap all new queries in try/catch so they fail silently if columns don't exist
- You MUST NOT remove or modify any existing query — only add to selects or add new parallel queries

---

# SECTION A — LAYOUT AND PRESENTATION (existing data)

## Fix A1: Admin Registrations Tab — List View Below Stats

**File:** `src/components/v2/admin/AdminRegistrationsTab.jsx`

**Problem:** The registrations tab shows overview stat cards and a funnel visualization, but no list of individual registrations. It should show a clean player-level list below the stats (like the Teams & Health tab does for teams).

**Current layout:** 1x6 stat cards → Capacity bar → Registration Funnel → "View All" button

**New layout:**
```
1x6 stat cards (keep, same row — they look good)
↓
Capacity bar (keep)
↓
Registration Funnel (keep)
↓
NEW: Player registration list (table format)
  Columns: Player | Parent | Contact | Waiver | Status | Actions
  Rows: All players NOT at "Rostered" finish line (pending, approved-but-missing-items, waiver-unsigned, etc.)
  Cap at 10 rows, "View All Registrations →" footer
↓
"View All Registrations →" button (keep, move to footer)
```

**The player list structure (matching Teams & Health table styling):**
```
Header row: PLAYER | PARENT | CONTACT | WAIVER | STATUS | ACTIONS
  All headers: 10px, weight 700, uppercase, muted, surface bg

Data rows:
  ├── Player: initials avatar (32px circle) + name (13.5px weight 600) + "Age X · Gr Y" (12px muted)
  ├── Parent: parent name (13px, text-secondary)
  ├── Contact: email + phone (12px, muted)
  ├── Waiver: "Signed" (green badge) or "Unsigned" (red badge)
  ├── Status: "Rostered" (green) / "Approved" (blue) / "Pending" (amber) / "Waitlisted" (purple) / "Denied" (red)
  └── Actions: "..." menu or link icon
```

**Filtering logic:** The `Registrations 1` badge on the tab already indicates items needing attention. The list should prioritize showing registrations that are NOT at the finish line:
1. Pending review (not yet approved)
2. Approved but waiver unsigned
3. Approved but jersey info missing
4. Any status that isn't fully "Rostered + waiver signed + jersey assigned"

If ALL registrations are at the finish line, show a success state: "All registrations complete ✓"

**Data source:** The `stats` object in DashboardPage already has registration counts. For the player-level list, check what data `loadDashboardData()` fetches from the `players` table. It likely already fetches player records with registration status. If individual player records with parent info aren't in state, this moves to Section B (new query needed).

**For now (Section A):** Build the table component structure. If individual player data IS available from existing state (check `stats` or any player-related state variables), wire it. If not, render the table with a "Loading registration details..." placeholder and mark it for Section B data wiring.

**Commit:** `feat(v2): admin registrations tab player list`

---

## Fix A2: Coach Roster Tab — Add Columns, Reduce Whitespace

**File:** `src/components/v2/coach/CoachRosterTab.jsx`

**Problem:** The roster tab has too much empty space between columns. Needs more data columns to fill the width and provide operational value.

**Current columns:** Avatar | Player | Pos | Goals | Attendance | RSVP Status

**New columns:**
```
Avatar | Player | Parent | Contact | Pos | Season | Level | RSVP
```

Where:
- **Avatar:** 32px circle with photo or gradient initials (keep)
- **Player:** Name + jersey number + position (13.5px weight 600, 12px muted below) — combine current Player + Pos
- **Parent:** Parent/guardian first + last name (13px, text-secondary)
- **Contact:** Parent phone number (12px, muted) — shows the most actionable contact info
- **Pos:** Position abbreviation (keep, but smaller — 12px muted)
- **Season:** "New" / "2nd" / "3rd" / "Veteran" based on how many seasons this player has been with the club. Derive from player registration history if available, otherwise show "—"
- **Level:** Player level + small XP indicator (e.g., "Lv 8" in a pill). From player XP/level data if available.
- **RSVP:** Going (green) / Pending (amber) / No RSVP (red) badge (keep)

**Grid adjustment:**
```css
grid-template-columns: 40px 1fr 140px 120px 50px 70px 60px 80px;
```

This fills the available width much better than the current wide-gap layout.

**Data source:** The `roster` state in CoachDashboard already has player records with names, positions, jerseys. Parent info and season count may not be in the current data. If not available, show "—" for those columns and mark for Section B.

**Commit:** `feat(v2): coach roster tab enriched columns`

---

## Fix A3: Coach Player Card Click → Full Profile Card

**File:** `src/pages/roles/CoachDashboard.jsx`

**Problem:** Clicking a player in the roster opens `PlayerCardExpanded` which doesn't include evaluation metrics, skill ratings, or coach notes. It should open the full player profile card (screenshot 3 shows what it should look like — skills, badges, season progress, coach notes).

**Fix:**

Check what happens when a roster row is clicked. It likely opens a modal with `PlayerCardExpanded`. Look at the modal component being used.

The screenshot Carlos showed (Ava's profile with skills, badges, season progress, coach notes) appears to be the `PlayerProfilePage` or a similar detail component that already exists. Options:

**Option A (quick):** Change the roster row click to navigate to `/parent/player/${playerId}` (the player profile page) instead of opening a modal. This shows the full profile with all data.

**Option B (better UX):** Change the modal to use a richer component that includes evaluation data. Check if `ScoutingReportCard` or `PlayerProfileSidebar` could be composed into the modal alongside `PlayerCardExpanded`.

**Recommended: Option A** for now. Navigate to the full player profile page on click. It's cleaner and shows all the data without needing to rebuild the modal.

```jsx
// In the roster tab row click handler:
onPlayerClick={(playerId) => appNavigate('player-profile', { playerId })}
// OR
onPlayerClick={(playerId) => navigate(`/parent/player/${playerId}`)}
```

Verify the route exists in routes.js. The audit showed `/parent/player/:playerId` exists.

**Commit:** `feat(v2): coach roster click opens full player profile`

---

## Fix A4: Coach "This Week" Card — Include Practices

**File:** `src/pages/roles/CoachDashboard.jsx` (where WeeklyLoad receives its events prop)

**Problem:** The "This Week" sidebar card only shows games, not practices. It should show ALL events for the team this week.

**Fix:** Find where the WeeklyLoad component receives its `events` prop. It's likely filtering `upcomingEvents` by event type. Remove the filter so all event types show (games, practices, meetings, etc.).

Check the current code:
```jsx
// If it currently does something like:
events={upcomingEvents.filter(e => e.event_type === 'game').map(...)}

// Change to:
events={upcomingEvents.slice(0, 5).map(...)}
```

If it's already passing all events and practices aren't showing, the issue is that there are no practice events in the data for this team. Verify by checking the `upcomingEvents` state contents.

**Commit:** `fix(v2): coach weekly load shows all event types`

---

## Fix A5: Coach Body Tabs — Restructure

**File:** `src/pages/roles/CoachDashboard.jsx`

**Problem:** The current tabs are Roster | Attendance | Stats | Game Prep. Feedback says:
- Replace "Attendance" with "Schedule" (show all scheduled events for the team, not just attendance tracking)
- Stats tab should include evaluation scores and last eval date
- Add engagement tabs: Challenges, Trophies/Badges, Shoutouts

**New tab structure:**
```
Roster | Schedule | Stats & Evals | Game Prep | Engagement
```

**Schedule tab** (replaces Attendance):
- Show all upcoming events for the selected team: practices, games, meetings, tournaments
- Each row: Date, Time, Type (Practice/Game/etc), Location, RSVP summary (X going / Y pending)
- "View Full Schedule →" footer

**Stats & Evals tab** (enhanced Stats):
- Keep the existing TopPlayersCard data (leaderboard-style player stats)
- Add below: Evaluation summary per player — overall rating, last eval date
- If evaluation data (from `player_skill_ratings` or `ScoutingReportCard` data) is available in the coach dashboard state, display it. If not, show "No evaluations yet" and mark for Section B.

**Engagement tab** (NEW):
- Sub-sections for: Active Challenges, Recent Shoutouts, Team Badges
- Active Challenges: from `activeChallenges` state (already fetched in CoachDashboard)
- Recent Shoutouts: from shoutouts data (already fetched — weekly shoutout count is in state)
- Team Badges: aggregate of player badges for this team (may need Section B query)
- Keep it simple — card-style displays, not complex tables

**Implementation:**
1. Update the `tabs` array passed to BodyTabs
2. Create `src/components/v2/coach/CoachScheduleTab.jsx` (NEW) — replaces CoachAttendanceTab
3. Update `src/components/v2/coach/CoachStatsTab.jsx` — add eval summary
4. Create `src/components/v2/coach/CoachEngagementTab.jsx` (NEW)
5. Wire new tab content in CoachDashboard.jsx

**Commit:** `feat(v2): coach body tabs restructured — schedule, stats & evals, engagement`

---

# SECTION B — DATA ENRICHMENT (new/expanded queries)

**CAUTION:** This section involves adding to Supabase queries. Every new query or expanded select MUST be wrapped in try/catch. If a column doesn't exist on the table, the query should fail silently and the UI should show "—" or a placeholder.

---

## Fix B1: Registration Player List Data

**File:** `src/pages/dashboard/DashboardPage.jsx` (inside `loadDashboardData()`)

**Problem:** The admin registrations tab needs individual player records with parent info, waiver status, and jersey status. The current `loadDashboardData()` fetches aggregate counts but may not fetch per-player registration detail.

**Fix:**

1. Find the existing player query in `loadDashboardData()`. It likely does something like:
   ```javascript
   const { data: players } = await supabase
     .from('players')
     .select('id, first_name, last_name, ...')
     .eq('season_id', selectedSeason.id)
   ```

2. Expand the select to include registration data and parent info:
   ```javascript
   const { data: registrationDetails } = await supabase
     .from('players')
     .select(`
       id, first_name, last_name, date_of_birth, grade,
       registration_status,
       profiles:parent_id (first_name, last_name, email, phone),
       team_players (team_id, jersey_number)
     `)
     .eq('season_id', selectedSeason.id)
     .order('created_at', { ascending: false })
     .limit(20)
   ```

   Wrap in try/catch:
   ```javascript
   let registrationDetails = [];
   try {
     const { data } = await supabase.from('players').select(`...`).eq('season_id', selectedSeason.id).limit(20);
     registrationDetails = data || [];
   } catch (err) {
     console.warn('Registration details query failed:', err);
   }
   ```

3. For waiver status, check if there's an existing waiver query in `loadDashboardData()`. The audit showed queries for `waivers` and `waiver_signatures`. Use the same pattern to determine per-player waiver completion:
   ```javascript
   // Already fetched: waiver signature counts
   // Cross-reference: for each player, check if they have a signature for each required waiver
   // Simplified: flag as "Unsigned" if player is NOT in waiver_signatures for any required waiver
   ```

4. Add `registrationDetails` to the stats state or a separate state variable:
   ```javascript
   const [registrationDetails, setRegistrationDetails] = useState([]);
   ```

5. Pass to AdminRegistrationsTab:
   ```jsx
   <AdminRegistrationsTab
     stats={stats}
     registrationDetails={registrationDetails}
     onNavigate={appNavigate}
   />
   ```

**CRITICAL:** The `parent_id` foreign key on `players` may not exist, or it may be named differently (e.g., `user_id`, `guardian_id`, or the parent relationship may be in a separate `player_parents` join table). CC MUST check the actual table schema. Use `SCHEMA_REFERENCE.csv` if it exists in the repo, or query the table structure. If the FK doesn't exist, omit the parent join and show "—" in the parent column.

**Commit:** `feat(v2): registration details query for admin tab`

---

## Fix B2: Coach Roster — Parent Info and Season Count

**File:** `src/pages/roles/CoachDashboard.jsx`

**Problem:** The roster tab needs parent name, contact number, and season count per player. These aren't in the current roster data.

**Fix:**

1. Find the roster query in CoachDashboard.jsx. It likely fetches from `team_players` joined with `players`:
   ```javascript
   const { data: roster } = await supabase
     .from('team_players')
     .select('*, players(*)')
     .eq('team_id', selectedTeam.id)
   ```

2. Expand the player select to include parent info:
   ```javascript
   .select(`
     *,
     players (
       id, first_name, last_name, photo_url, jersey_number, position,
       profiles:parent_id (first_name, last_name, phone, email)
     )
   `)
   ```

   Same caveat as B1: the `parent_id` FK may not exist or may be named differently.

3. For season count (how many seasons this player has been registered):
   ```javascript
   // After fetching roster, for each player, count their registrations
   // This could be a separate query:
   const playerIds = roster.map(r => r.players?.id).filter(Boolean);
   let seasonCounts = {};
   try {
     const { data } = await supabase
       .from('players')
       .select('id, season_id')
       .in('id', playerIds);  // This won't work — players table may not have multiple rows per player per season
   } catch (err) {
     console.warn('Season count query failed:', err);
   }
   ```

   **IMPORTANT:** The `players` table structure determines how this works. If each player has ONE row (and season is tracked via `team_players.season_id` or similar), the count query would be different. CC must check the actual schema. If season count isn't easily derivable, show "—" and skip this column for now.

4. For player level/XP: check if `xp_ledger` data is already fetched, or if the player profile includes a `level` field. If not available, show "—".

5. Pass enriched roster data to CoachRosterTab.

**Commit:** `feat(v2): coach roster parent info and enrichment`

---

## Fix B3: Coach Evaluation Data for Stats Tab

**File:** `src/pages/roles/CoachDashboard.jsx`

**Problem:** Stats tab should show player evaluation scores and last eval date. Current stats tab only shows game performance stats (goals, assists, etc.).

**Fix:**

1. Check if `player_skill_ratings` is already queried in CoachDashboard. The audit showed it's queried in PlayerDashboard but may not be in CoachDashboard.

2. Add a query for eval data:
   ```javascript
   let evalData = [];
   try {
     const playerIds = roster.map(r => r.players?.id || r.player_id).filter(Boolean);
     const { data } = await supabase
       .from('player_skill_ratings')
       .select('player_id, overall_rating, created_at, serve, pass, attack, block, dig, set_skill')
       .in('player_id', playerIds)
       .order('created_at', { ascending: false });
     evalData = data || [];
   } catch (err) {
     console.warn('Eval data query failed:', err);
   }
   ```

3. Group by player_id, take most recent eval per player. Pass to CoachStatsTab.

4. In CoachStatsTab, display: Player name | Overall Rating | Last Eval Date | Individual skill scores (compact)

**Commit:** `feat(v2): coach stats tab evaluation data`

---

## EXECUTION ORDER

### Section A (safe, no query changes):
1. A1 — Admin registrations tab list view (structure only, placeholder data)
2. A2 — Coach roster tab enriched columns
3. A3 — Coach player card click → full profile
4. A4 — Coach weekly load all event types
5. A5 — Coach body tabs restructure

### Section B (query expansion, extra caution):
6. B1 — Registration details query
7. B2 — Coach roster parent info
8. B3 — Coach evaluation data

Build and verify after EACH fix. Push after all are committed.

---

## POST-FIX SMOKE TEST

After all fixes:
1. Admin dashboard: click Registrations tab — stat cards on top, player list below with columns
2. Admin dashboard: "View All Registrations →" navigates to `/registrations`
3. Coach dashboard: Roster tab shows enriched columns (parent, contact, season, level, RSVP)
4. Coach dashboard: click a player row → navigates to full player profile page
5. Coach dashboard: "This Week" card shows practices AND games
6. Coach dashboard: body tabs show Roster | Schedule | Stats & Evals | Game Prep | Engagement
7. Coach dashboard: Stats & Evals tab shows evaluation scores if data exists
8. Coach dashboard: Engagement tab shows challenges, shoutouts
9. Switch to Admin, Parent, Player, Team Manager — verify no regressions
10. No console errors on any dashboard

Report results.

---

## DEFERRED (not in this spec):
- Admin Payments tab enrichment (family-level payment list) — separate spec
- Coach Trophies/Badges detail in Engagement tab — needs badge query
- Player dashboard QA
- Parent dashboard QA
- Team Manager dashboard QA
