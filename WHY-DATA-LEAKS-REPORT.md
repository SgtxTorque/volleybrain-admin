# WHY CROSS-ORG DATA STILL LEAKS — Root Cause Investigation

**Date**: 2026-03-23
**Status**: READ-ONLY investigation — no code changes made

---

## INVESTIGATION 1: How Does SeasonContext Load Seasons?

**File**: `src/contexts/SeasonContext.jsx`

### How seasons are loaded:
```javascript
const { data } = await supabase
  .from('seasons')
  .select('*, sports(id, name, icon, color_primary)')
  .eq('organization_id', organization.id)   // ← ORG-SCOPED
  .order('created_at', { ascending: false })
```

### Answers:
1. **How are seasons loaded?** Via `loadSeasons()`, triggered by `useEffect` when `organization?.id` changes. Query filters by `.eq('organization_id', organization.id)`.
2. **Does the season query filter by organization_id?** YES. Seasons are org-scoped.
3. **If "All Seasons" is selected, what happens?** The `ALL_SEASONS` sentinel `{ id: 'all', name: 'All Seasons', isSentinel: true }` is set as `selectedSeason`. Individual pages are then responsible for handling this sentinel — they should use `allSeasons` (the org-scoped array) to build their season_id filter. **But many pages don't do this properly** (see Investigation 3).
4. **Could previous user's seasons remain in state?** The signOut function clears `localStorage.removeItem('vb_selected_season')` and resets state. SeasonContext reloads when `organization?.id` changes (line 32). However, there's a timing window: the `useEffect` on `organization?.id` fires asynchronously. If `organization` updates to the new user's org AFTER a render cycle, the old `allSeasons` could briefly persist.
5. **Does SeasonContext RELOAD for new org?** YES — the `useEffect` dependency on `organization?.id` triggers `loadSeasons()` when the org changes.

### Verdict: SeasonContext itself is SAFE. The `allSeasons` array only contains the current org's seasons. The problem is downstream — how pages use (or fail to use) this data.

---

## INVESTIGATION 2: Trace the Exact Data Path for Registrations

**File**: `src/pages/registrations/RegistrationsPage.jsx`

### Full `loadRegistrations` function:
```javascript
async function loadRegistrations() {
  setLoading(true)
  let query = supabase
    .from('players')                                          // TABLE: players
    .select('*, registrations(*), seasons:season_id(id, name)')
    .order('created_at', { ascending: false })

  if (selectedSeason?.id && !isAllSeasons(selectedSeason)) {
    query = query.eq('season_id', selectedSeason.id)          // CASE 1: Specific season → SAFE
  } else if (isAllSeasons(selectedSeason) && selectedSport?.id) {
    const sportSeasonIds = (allSeasons || [])
      .filter(s => s.sport_id === selectedSport.id)
      .map(s => s.id)
    if (sportSeasonIds.length === 0) {
      setRegistrations([])
      setLoading(false)
      return
    }
    query = query.in('season_id', sportSeasonIds)             // CASE 2: All Seasons + sport → SAFE
  }
  // CASE 3: All Seasons + NO sport → *** NO FILTER AT ALL ***

  const { data, error } = await query                         // RUNS UNFILTERED!
  // ...
}
```

### Answers:
1. **Table queried**: `players` (with join to `registrations` and `seasons`)
2. **Filters applied**: `season_id` (conditionally) + `created_at` ordering
3. **Where does selectedSeason come from?** `useSeason()` → SeasonContext (org-scoped)
4. **If selectedSeason is 'all' and no sport**: **NO FILTER IS APPLIED** — the query returns ALL players from ALL organizations
5. **Is there an organization_id filter?** NO — we removed it because `players` table doesn't have that column
6. **Is there a season_id filter?** Only in Cases 1 and 2. Case 3 has NO season_id filter
7. **Could the season_id be from another org?** No, because `allSeasons` is org-scoped. But when ALL seasons + no sport is selected, NO season_id filter exists at all

### ROOT CAUSE: When "All Seasons" is selected AND no sport filter is active, the query runs with ZERO org-scoping filters, returning data from every organization.

---

## INVESTIGATION 3: What Happens With "All Seasons" + No Sport Selected

### The Leak Pattern (found in 12+ files):
```javascript
// VULNERABLE:
if (!isAllSeasons(selectedSeason)) {
  query = query.eq('season_id', selectedSeason.id)        // Specific season → safe
} else {
  const sportIds = getSportSeasonIds()  // returns null if no sport selected
  if (sportIds && sportIds.length > 0) {
    query = query.in('season_id', sportIds)               // Sport selected → safe
  } else if (sportIds && sportIds.length === 0) {
    return  // empty result → safe
  }
  // ELSE: sportIds is null → NO FILTER → LEAKS ALL DATA
}
```

### Affected pages (All Seasons + no sport = UNFILTERED QUERY):

| File | Table(s) with no filter |
|------|------------------------|
| RegistrationsPage.jsx | players |
| TeamsPage.jsx | teams, players |
| CoachesPage.jsx | coaches, teams |
| PaymentsPage.jsx | players, payments |
| SchedulePage.jsx | schedule_events, teams |
| AttendancePage.jsx | teams, schedule_events |
| BlastsPage.jsx | teams, messages |
| JerseysPage.jsx | teams (3 queries) |
| NotificationsPage.jsx | teams |
| StaffPortalPage.jsx | coaches, teams |
| SeasonLeaderboardsPage.jsx | teams |
| CoachAvailabilityPage.jsx | coaches |

### Key insight: `getSportSeasonIds()` returns `null` (not empty array) when no sport is selected:
```javascript
function getSportSeasonIds() {
  if (!selectedSport?.id) return null    // ← null, not []
  return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
}
```

When `sportIds` is `null`, the condition `sportIds && sportIds.length > 0` is `false`, and `sportIds && sportIds.length === 0` is also `false`. The code falls through to the implicit else — no filter.

---

## INVESTIGATION 4: Which Tables ACTUALLY Have organization_id

**Source**: SUPABASE_SCHEMA.md (actual database)

### Tables WITH organization_id:
| Table | Notes |
|-------|-------|
| organizations | It IS the org table |
| seasons | Primary org-scoping FK |
| user_roles | Has organization_id |
| waiver_templates | Has organization_id |
| waivers | Has organization_id (BOTH tables exist!) |
| waiver_signatures | Has organization_id |
| registration_templates | Has organization_id |
| registration_fees | Has organization_id |
| sports | Has organization_id |
| announcements | Has organization_id |
| messages | Has organization_id |
| staff_members | Has organization_id |
| notification_templates | Has organization_id |

### Tables WITHOUT organization_id:
| Table | Scoping Path |
|-------|-------------|
| players | season_id → seasons.organization_id |
| teams | season_id → seasons.organization_id |
| coaches | season_id → seasons.organization_id |
| payments | season_id → seasons.organization_id |
| schedule_events | season_id → seasons.organization_id |
| chat_channels | season_id → seasons.organization_id |
| notifications | user_id (no org link) |
| player_achievements | player_id → players.season_id → seasons |
| registrations | player_id → players.season_id → seasons |
| team_players | team_id → teams.season_id → seasons |
| team_coaches | coach_id → coaches.season_id → seasons |

### CORRECTION: `waivers` table DOES exist
The previous investigation (INVESTIGATION-REPORT-SESSION-WAIVERS-SCHEMA.md) stated "The `waivers` table does not exist." This is WRONG. SUPABASE_SCHEMA.md shows BOTH tables:
- `waivers` (lines 1906-1920): simpler table with organization_id, name, content, etc.
- `waiver_templates` (lines 1922-1944): extended table with versioning, PDF, sport_id, etc.

The OrganizationPage query was changed from `.from('waivers')` to `.from('waiver_templates')`. The original `.from('waivers')` may have been correct depending on which table the org setup was designed to use. Both tables have `organization_id`.

---

## INVESTIGATION 5: Do RLS Policies Exist?

**File**: `supabase/migrations/001_enable_rls.sql`

### RLS policies ARE defined for 7 tables:
1. **teams** — `season_id IN (SELECT id FROM seasons WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))`
2. **players** — same pattern
3. **schedule_events** — same pattern
4. **payments** — same pattern
5. **messages** — same pattern
6. **notifications** — `organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())`
7. **notification_templates** — same as notifications

### CRITICAL PROBLEM: ALL RLS POLICIES ARE BROKEN

Every policy references:
```sql
SELECT organization_id FROM profiles WHERE id = auth.uid()
```

But the `profiles` table does NOT have an `organization_id` column! The actual column is:
```
| current_organization_id | uuid |
```

**The column name mismatch means ALL 7 RLS policies fail.** Either:
- The migration was never successfully applied (CREATE POLICY would error on the non-existent column)
- The migration was applied but the policies silently fail (return no rows → block ALL access)
- There was a different column at the time that was later renamed

### Additional issue: `notifications` doesn't have `organization_id`
The notifications RLS policy references `notifications.organization_id`, but that column doesn't exist on the notifications table. The table only has: `id, user_id, title, body, type, event_id, team_id, read, read_at, created_at, data`.

### CLAUDE.md claims RLS was resolved:
> Sprint 5.3: RLS migration for 7 tables, org_id scoping audit (NotificationsPage fixed), input validation lib

But based on the column name mismatch (`organization_id` vs `current_organization_id` on profiles), these policies are either not applied or not functioning.

---

## INVESTIGATION 6: The Registrations Query — Full Trace

### Values available when `loadRegistrations()` runs:
- `organization` — from `useAuth()` → has `organization.id` ✓
- `selectedSeason` — from `useSeason()` → org-scoped season or ALL_SEASONS sentinel
- `allSeasons` — from `useSeason()` → org-scoped array of all seasons
- `selectedSport` — from `useSport()` → may be null

### The viable fix using parent-chain filtering:
```javascript
// Always get the org's season IDs (org-scoped by SeasonContext)
const orgSeasonIds = allSeasons.map(s => s.id)

// Then ALWAYS filter by those seasons
if (orgSeasonIds.length === 0) {
  setRegistrations([])
  return
}

let query = supabase
  .from('players')
  .select('*, registrations(*), seasons:season_id(id, name)')

if (!isAllSeasons(selectedSeason)) {
  query = query.eq('season_id', selectedSeason.id)
} else if (selectedSport?.id) {
  const sportSeasonIds = allSeasons.filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  query = query.in('season_id', sportSeasonIds)
} else {
  // "All Seasons" + no sport → use ALL org season IDs
  query = query.in('season_id', orgSeasonIds)
}
```

### Is this viable for ALL affected tables?
YES. Every affected table has `season_id`. The fix is the same everywhere:
- Replace the "no filter" fallthrough with `.in('season_id', allSeasons.map(s => s.id))`
- `allSeasons` is already org-scoped by SeasonContext
- This adds one simple clause instead of leaving the query unfiltered

---

## INVESTIGATION 7: Fastest Path to Real Isolation

### Option A: Parent-chain filtering (client-side) — RECOMMENDED AS IMMEDIATE FIX
**How**: On every page, when "All Seasons + no sport" is active, use `.in('season_id', allSeasons.map(s => s.id))` instead of no filter.
- **Pros**: No database changes, no migration, can be deployed immediately, `allSeasons` is already available and org-scoped in every page
- **Cons**: Client-side only — a crafted Supabase request could still bypass it. Defense-in-depth, not airtight
- **Effort**: ~12 files, ~1-3 lines each
- **Time to fix**: < 1 hour

### Option B: Add organization_id to missing tables (schema migration)
**How**: Add `organization_id` column to players, teams, coaches, payments, schedule_events, chat_channels. Backfill from season's org_id. Add `.eq('organization_id', ...)` to all queries.
- **Pros**: Simple direct filtering, no joins needed
- **Cons**: Requires DB migration coordinated with mobile app, backfill script, every INSERT must also set org_id
- **Effort**: High — schema change + backfill + both codebases
- **Time to fix**: Days to weeks

### Option C: Fix & apply RLS policies (server-side)
**How**: Fix the RLS policies to use `current_organization_id` instead of `organization_id` on profiles table, OR use `user_roles.organization_id`. Apply to ALL data tables.
- **Pros**: Server-side enforcement, impossible to bypass from client, the ONLY real security boundary
- **Cons**: Must be tested carefully, the column name mismatch suggests the original migration may have failed, need to verify what's actually in production
- **Effort**: Medium — fix SQL, test, apply
- **Time to fix**: 1-2 days with testing

### RECOMMENDATION: A + C (two-phase approach)

**Phase 1 (immediate, today)**: Option A — Fix the "All Seasons + no sport" leak on all 12 pages. This eliminates the primary data leak path with minimal risk.

**Phase 2 (this week)**: Option C — Fix the RLS policies:
1. Check what's actually applied in production Supabase dashboard
2. Fix all policies to use `user_roles` instead of `profiles`:
```sql
-- CORRECT approach using user_roles (which HAS organization_id):
CREATE POLICY "Users can view teams in their org" ON teams
  FOR SELECT USING (
    season_id IN (
      SELECT id FROM seasons WHERE organization_id IN (
        SELECT organization_id FROM user_roles
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
```
3. Extend policies to cover ALL data tables (currently only 7 of ~15)
4. Test on staging before production

Option B is NOT recommended — it's too invasive for the immediate problem and requires coordinating with the mobile app.

---

## SUMMARY

| Finding | Severity |
|---------|----------|
| "All Seasons + no sport" = unfiltered queries on 12 pages | **CRITICAL** |
| RLS policies reference non-existent `profiles.organization_id` column | **CRITICAL** |
| RLS policies likely never applied or broken in production | **CRITICAL** |
| `waivers` table DOES exist (previous investigation was wrong) | Medium |
| `allSeasons` array IS org-scoped — can be used as immediate fix | Positive |
| Every affected table has `season_id` — parent-chain fix is viable everywhere | Positive |

### The data leak is NOT caused by missing organization_id columns.
### The data leak IS caused by:
1. **Client-side**: The "All Seasons + no sport" code path applies ZERO filters to Supabase queries
2. **Server-side**: RLS policies are broken/not applied, so there's no server-side safety net
