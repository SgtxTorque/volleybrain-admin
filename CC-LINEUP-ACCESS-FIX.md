# CC-LINEUP-ACCESS-FIX.md
# Lynx Web Admin — Lineup Builder Direct Access + Schedule Fix
# EXECUTION SPEC

**Type:** Bugfix  
**Branch:** `feat/v2-dashboard-redesign`  
**Run with:** `--dangerously-skip-permissions`

---

## ISSUE 1: Lineup Builder Has No Direct Access — Requires Game Event

**Problem:** The only way to open the lineup builder is by clicking "Set Lineup" on a game card in Game Prep. If a coach has no upcoming games, or just wants to experiment with lineups, they can't access the builder at all. The builder should be accessible directly from the sidebar nav.

**Fix — Add "Lineups" to the Compete nav group:**

**File: `src/MainApp.jsx`**

In the **coach** nav group for Compete (currently "gameday"), add a "Lineups" item:

```javascript
{ id: 'gameday', label: 'Compete', type: 'group', icon: 'gameprep', items: [
  { id: 'gameprep', label: 'Game Prep', icon: 'target' },
  { id: 'lineups', label: 'Lineups', icon: 'layout-grid' },  // NEW
  { id: 'attendance', label: 'Attendance', icon: 'check-square' },
  { id: 'standings', label: 'Standings', icon: 'star' },
  { id: 'leaderboards', label: 'Leaderboards', icon: 'bar-chart' },
]},
```

Do the same for the **admin** nav group that has Compete.

**Add the icon mapping in `src/components/layout/LynxSidebar.jsx`:**
```javascript
'layout-grid': LayoutGrid,  // from lucide-react
```

Check if `LayoutGrid` is already imported. If not, add it to the lucide-react import.

**Create a Lineups page: `src/pages/lineups/LineupsPage.jsx`**

This page shows:
1. A **team selector** (dropdown of coach's teams, same pattern as Game Prep page)
2. An **upcoming games list** — games that need lineups, with a "Set Lineup" button each
3. A **"Quick Lineup Builder"** button that opens the lineup builder WITHOUT requiring a game event — this is for experimenting, building templates, and practice lineups
4. A **saved templates section** showing lineup templates for the selected team

When "Quick Lineup Builder" is clicked, open `LineupBuilderV2` with:
- `event = null` (no game attached)
- `team = selectedTeam`
- `sport = selectedSeason.sport`

**Update `LineupBuilderV2.jsx` to handle `event = null`:**
- If no event, the header shows "Team Name — Practice Lineup" instead of "Team vs Opponent"
- Save behavior: when event is null, ONLY save as template (since there's no event to attach lineup records to). Show a prompt: "No game selected. Save as a template?"
- Load behavior: when event is null, load the default template for this team (if one exists)
- All other builder functionality works exactly the same (drag-drop, rotations, subs, etc.)

**Add route:**

**File: `src/lib/routes.js`** — Add `'lineups': '/lineups'`

**File: `src/MainApp.jsx`** — Add route:
```jsx
<Route path="/lineups" element={
  <RouteGuard allow={['admin', 'coach']} activeView={activeView}>
    <LineupsPage showToast={showToast} />
  </RouteGuard>
} />
```

Add the import at the top of MainApp.jsx.

**Verify:**
1. Coach sidebar shows "Lineups" under Compete
2. Click Lineups → page renders with team selector and upcoming games
3. Click "Quick Lineup Builder" → builder opens WITHOUT a game event
4. Can drag players, set formation, use all features
5. Save prompts to save as template (since no game attached)
6. Click "Set Lineup" on a game card → builder opens WITH that game (existing behavior)

---

## ISSUE 2: schedule_events Bulk Insert Returns 400

**Problem:** Creating bulk events (practices or games) fails with a 400 error on the schedule_events insert. The error URL shows the insert is trying to send columns that may not exist on the table, specifically `series_id`.

**Root cause:** The bulk insert is trying to insert a `series_id` column that likely doesn't exist on the `schedule_events` table (or has been removed/renamed). The 400 errors show two different insert attempts — one WITH `series_id` and one WITHOUT, suggesting there's a fallback pattern, but both are failing.

**Fix:** CC must investigate the actual `schedule_events` table schema and the bulk event creation code.

**Step 1:** Find the bulk event creation code:
```bash
grep -rn "bulk\|Bulk\|series_id\|BulkPractice\|BulkEvent" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules
```

**Step 2:** Check what columns the insert is trying to use vs what actually exists on the table. The 400 error shows the insert is sending columns wrapped in double quotes (`"team_id"`, `"event_type"`, etc.) which suggests it's using a `columns` parameter. Check if Supabase is rejecting a column that doesn't exist.

Look at the URL decoded columns list:
```
team_id, event_type, title, notes, event_date, event_time, end_time, 
venue_name, venue_address, court_number, location_type, opponent_name, 
series_id, season_id, created_at
```

One of these columns likely doesn't exist on the actual table. The most suspicious is `series_id` — check if it exists on `schedule_events`. If not, remove it from the insert.

Also check `court_number` and `location_type` — these may have been added in a migration that wasn't run, or may have different column names.

**Step 3:** Fix the insert to only include columns that exist on the table. If `series_id` doesn't exist, remove it from the insert object. Same for any other non-existent column.

**Step 4:** Also check if the `coaches` query error (`profiles:profile_id(first_name, last_name)` returning 400) is caused by the `profiles` table not having `first_name`/`last_name` columns (they might be combined as `full_name` instead). Fix the select to use the correct column names.

**Verify:**
1. Can create a single event (game or practice) from the schedule page
2. Can create bulk recurring practices
3. No 400 errors in console on the schedule page

---

## EXECUTION ORDER

1. Issue 2 — Fix schedule_events insert (unblocks event creation for testing)
2. Issue 1 — Add Lineups page and direct builder access

---

**Commit:** `fix(lineup-v2): direct lineup builder access via nav + schedule insert fix`
