# INVESTIGATION REPORT: Session Bleed, Waiver Checkboxes, Schema Mismatches

**Date**: 2026-03-23
**Status**: READ-ONLY investigation — no code changes made

---

## PROBLEM 1: Session State Bleed — Login Still Lands on Previous User's Page

### What signOut does (src/contexts/AuthContext.jsx):

```javascript
async function signOut() {
  // Clear persisted navigation/filter state to prevent session bleed
  localStorage.removeItem('vb_selected_season')
  localStorage.removeItem('vb_selected_sport')
  localStorage.removeItem('returnToOrgSetup')
  localStorage.removeItem('lynx-recent-searches')

  await supabase.auth.signOut()
  setUser(null)
  setProfile(null)
  setOrganization(null)
  setIsAdmin(false)
  setIsPlatformAdmin(false)
  setNeedsOnboarding(false)

  // Reset URL to root so next login lands on dashboard (not previous user's page)
  window.history.replaceState(null, '', '/')
}
```

### Report:

```
What signOut does: Clears 4 localStorage keys, calls supabase.auth.signOut(), resets all state vars to null/false, calls window.history.replaceState to '/'
localStorage keys cleared: vb_selected_season, vb_selected_sport, returnToOrgSetup, lynx-recent-searches
URL redirect method: window.history.replaceState(null, '', '/')
React Router navigate called: NO
onAuthStateChange handles SIGNED_IN redirect: NO — it only sets user/profile/org state, does not navigate

Root cause: window.history.replaceState(null, '', '/') changes the browser's address bar
but does NOT notify React Router v6. React Router maintains its own internal location state
that only updates in response to:
  1. navigate() calls (from useNavigate hook)
  2. <Link> component clicks
  3. popstate events (browser back/forward buttons)

replaceState is NOT one of these. So the browser URL shows '/' but React Router's internal
location still thinks it's on '/schedule' (or wherever the previous user was). When the new
user logs in, React Router renders the route matching its INTERNAL location — the old page.

Suggested fix (two options):
  Option A (preferred): After replaceState, dispatch a popstate event to notify React Router:
    window.history.replaceState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))

  Option B (simpler but causes full reload): Use window.location.href instead:
    window.location.href = '/'
    This forces a full page reload which resets everything including React Router state.
```

---

## PROBLEM 2: Waiver Checkboxes in Org Setup Are Dead

### Investigation:

**A. Waiver query in OrganizationPage.jsx (line 39):**
```javascript
const { data: waiversData } = await supabase
  .from('waivers')          // ← WRONG TABLE NAME
  .select('*')
  .eq('organization_id', organization.id)
```

The actual table in the database is `waiver_templates`, NOT `waivers`. The `waivers` table does not exist. This query silently returns an empty array (Supabase returns empty data for non-existent tables with the anon key, or a 400 error depending on RLS config).

**B. Checkbox rendering in SetupSectionContent.jsx (lines 1030-1068):**
The checkbox code IS functional. It has proper onClick handlers that call `updateField()`:
```jsx
{waivers.length > 0 ? (
  waivers.map(waiver => (
    <label key={waiver.id} className="flex items-center gap-3 ...">
      <input
        type="checkbox"
        checked={formData.settings?.selected_waivers?.includes(waiver.id) || false}
        onChange={() => {
          const current = formData.settings?.selected_waivers || []
          const updated = current.includes(waiver.id)
            ? current.filter(id => id !== waiver.id)
            : [...current, waiver.id]
          updateField('settings', { ...formData.settings, selected_waivers: updated })
        }}
      />
      <span>{waiver.name}</span>
    </label>
  ))
) : (
  <p>"No waivers configured yet. Create waivers in Waiver Management first."</p>
)}
```

Since `waivers` is always `[]` (empty array from the bad query), it always renders the "No waivers configured yet" message. The checkboxes never appear.

**C. Waiver list source:**
The waiver list comes from OrganizationPage.jsx which queries the WRONG table (`waivers` instead of `waiver_templates`). Custom waivers created on the Waiver Management page are stored in `waiver_templates` and would appear IF the query used the correct table.

**D. How waivers are "selected" for the org:**
Selected waivers are stored as a JSONB array in `organizations.settings.selected_waivers`. The SetupSectionContent code correctly reads/writes this field via `updateField('settings', ...)`.

### Report:

```
Checkbox implementation: Native <input type="checkbox"> with onChange handler — FUNCTIONAL CODE
onChange handler exists: YES — properly toggles waiver ID in formData.settings.selected_waivers array
Waiver list source: Loaded from 'waivers' table (WRONG — should be 'waiver_templates')
Custom waivers appear in list: NO — query hits wrong table, always returns empty
How waivers are "selected": JSONB field organizations.settings.selected_waivers (correct)

Root cause for dead checkboxes: OrganizationPage.jsx line 39 queries .from('waivers')
  but the actual database table is 'waiver_templates'. The query returns empty → waivers
  state is always [] → SetupSectionContent renders "No waivers configured yet" → no checkboxes.

Root cause for missing custom waivers: Same — wrong table name means no waivers load at all.

Suggested fix: Change line 39 in OrganizationPage.jsx from:
  .from('waivers')
to:
  .from('waiver_templates')

That single change will load all waivers (both default and custom) and the existing
checkbox code in SetupSectionContent.jsx will work correctly.
```

---

## PROBLEM 3: `.eq('organization_id', ...)` on Tables That Don't Have That Column

### Schema verification (from SUPABASE_SCHEMA.md — actual database):

| Table | Has organization_id? | Actual scoping columns |
|-------|---------------------|----------------------|
| `organizations` | YES (it IS the org table) | id |
| `seasons` | YES | organization_id |
| `waiver_templates` | YES | organization_id |
| `registration_templates` | YES | organization_id |
| `registration_fees` | YES | organization_id |
| `user_roles` | YES | organization_id |
| `schedule_events` | **NO** | season_id, team_id |
| `teams` | **NO** | season_id |
| `coaches` | **NO** | season_id |
| `players` | **NO** | season_id |
| `payments` | **NO** | season_id, player_id |
| `chat_channels` | **NO** | season_id, team_id |
| `notifications` | **NO** | user_id |
| `player_achievements` | **NO** | player_id, achievement_id |

**Note**: DATABASE_SCHEMA.md CLAIMS some of these tables have `organization_id`, but SUPABASE_SCHEMA.md (generated from actual database) shows they do NOT. The security fix relied on DATABASE_SCHEMA.md which is WRONG for these tables.

### Broken queries (organization_id added to tables that don't have it):

| File | Table | Has org_id? | Current Filter | Should Be |
|------|-------|-------------|----------------|-----------|
| src/pages/schedule/SchedulePage.jsx | schedule_events | NO | .eq('organization_id', ...) | Remove — use season_id filter only (already present) |
| src/pages/teams/TeamsPage.jsx | teams | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/coaches/CoachesPage.jsx | coaches | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/stats/PlayerStatsPage.jsx | players | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/stats/PlayerStatsPage.jsx | schedule_events | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/payments/PaymentsPage.jsx | payments | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/chats/ChatsPage.jsx | chat_channels | NO | .eq('organization_id', ...) | Remove — use season_id/team_id filter only |
| src/pages/achievements/AchievementsCatalogPage.jsx | player_achievements | NO | .eq('organization_id', ...) | Remove — filter by player_id chain |
| src/pages/schedule/CoachAvailabilityPage.jsx | coaches | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/staff-portal/StaffPortalPage.jsx | coaches | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/staff-portal/StaffPortalPage.jsx | teams | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/roster/RosterManagerPage.jsx | coaches | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/jerseys/JerseysPage.jsx | teams | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/leaderboards/SeasonLeaderboardsPage.jsx | teams | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/notifications/NotificationsPage.jsx | teams | NO | .eq('organization_id', ...) | Remove — use season_id filter only |
| src/pages/dashboard/DashboardPage.jsx | teams | NO | .eq('organization_id', ...) | Remove — use season_id filter only |

### How should these tables be org-scoped instead?

These tables use **parent-chain filtering** through `season_id`:
- `seasons` HAS `organization_id` → filter seasons by org
- `teams` has `season_id` → filter by season (which is org-scoped)
- `coaches` has `season_id` → filter by season
- `players` has `season_id` → filter by season
- `schedule_events` has `season_id` + `team_id` → filter by season
- `payments` has `season_id` → filter by season
- `chat_channels` has `season_id` + `team_id` → filter by season

For tables without season_id:
- `notifications` → filter by `user_id` (already user-scoped)
- `player_achievements` → filter by `player_id` (which chains through players → season → org)

### Report:

```
Tables WITH organization_id column: organizations, seasons, waiver_templates, registration_templates, registration_fees, user_roles
Tables WITHOUT organization_id column: schedule_events, teams, coaches, players, payments, chat_channels, notifications, player_achievements

Total broken queries: ~16 across 12 files
All caused by: The security fix (CC-CRITICAL-SECURITY-FIX.md) added .eq('organization_id', organization.id)
  based on DATABASE_SCHEMA.md which incorrectly claims these tables have that column.

Suggested fix for each: REMOVE the .eq('organization_id', ...) filter. These tables are already
  org-scoped through their season_id foreign key (seasons table HAS organization_id).
  The existing .eq('season_id', selectedSeason.id) filters are sufficient for org isolation
  because seasons are already filtered by organization_id when loaded.

CRITICAL: These broken queries are returning 400 errors from Supabase ("column X.organization_id
  does not exist"), which means the affected pages are showing NO DATA at all.
```

---

## SUMMARY OF ROOT CAUSES

| Problem | Root Cause | Severity | Fix Complexity |
|---------|-----------|----------|---------------|
| Session bleed | `replaceState` doesn't notify React Router | Medium | 1 line — add popstate dispatch |
| Dead waiver checkboxes | Wrong table name: `waivers` → `waiver_templates` | Medium | 1 line change |
| Schema mismatch 400s | `organization_id` filter on 8+ tables that lack that column | **CRITICAL** | ~16 query edits across 12 files |

The schema mismatch is the most critical — it causes **complete data loss** on affected pages (Supabase returns 400 errors, queries fail, pages show empty).
