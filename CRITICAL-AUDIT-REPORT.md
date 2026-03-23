# CRITICAL SECURITY & BUG AUDIT REPORT

**Date:** March 23, 2026
**Auditor:** Claude Code (automated)
**Scope:** Full codebase security audit + React Error #310 + Bug sweep
**Status:** INVESTIGATION ONLY — No code changes made

---

## EXECUTIVE SUMMARY

**26 page files audited. 80+ Supabase queries reviewed.**

- **CRITICAL:** The vast majority of Supabase queries across the app filter by `season_id` but NOT by `organization_id`. Since `season_id` is stored in React state (client-side), a malicious user could manipulate it to access data from other organizations.
- **CRITICAL:** React Error #310 in OrganizationPage.jsx caused by hooks called after an early return.
- **LOW:** Bug sweep found no undefined components, broken imports, or broken routes.

### Risk Summary

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 20 pages | Missing `organization_id` filter on data queries |
| CRITICAL | 1 page | React hooks violation (OrganizationPage.jsx) |
| MEDIUM | 1 page | DashboardPage `games` table query weak isolation |
| LOW | 0 | No broken components/imports/routes found |

---

## SECTION 1: SECURITY — Cross-Organization Data Isolation

### How Organization ID Works

The organization is loaded in `AuthContext.jsx`:
1. User logs in → Supabase session established
2. Query `user_roles` table for `user_id` + `is_active=true`
3. Extract `roles[0].organization_id` → fetch full org object
4. Store in context → components access via `useAuth()` hook → `organization.id`

**The org ID is available everywhere**, but most queries don't use it.

### Root Cause

The codebase relies on `season_id` as the primary data isolation boundary. Seasons ARE org-scoped (loaded with `.eq('organization_id', organization.id)` in SeasonContext). However, `season_id` is stored in React state and passed as a filter parameter — it is NOT a server-side security boundary. Without RLS policies enforcing org isolation on every table, a crafted API call could bypass the client-side season filter.

### Full Audit Table

| Page | Table(s) Queried | org_id Filter? | season_id Filter? | team_id Filter? | RISK |
|------|-----------------|---------------|-------------------|-----------------|------|
| **RegistrationsPage** | players, registrations | NO | YES | NO | **CRITICAL** |
| **PaymentsPage** | players, payments | NO | YES | NO | **CRITICAL** |
| **TeamsPage** | teams, players, team_players, coaches, registrations | NO | YES (some) | NO | **CRITICAL** |
| **CoachesPage** | coaches, team_coaches, teams | NO | YES | NO | **CRITICAL** |
| **SchedulePage** | schedule_events, teams | NO | YES (reads) / NO (updates/deletes) | NO | **CRITICAL** |
| **AttendancePage** | teams, schedule_events, event_rsvps, event_volunteers, profiles | NO | YES (some) / NO (RSVPs) | YES (some) | **CRITICAL** |
| **ChatsPage** | chat_channels, channel_members, chat_messages, team_players | NO | YES (channels) / NO (messages) | NO | **CRITICAL** |
| **BlastsPage** | teams, messages, players, team_players, team_coaches, message_recipients | NO | YES (some) | YES (some) | **CRITICAL** |
| **NotificationsPage** | notifications, notification_templates | YES (2 queries) | NO | NO | **MIXED** |
| **NotificationsPage** | teams, profiles | NO | YES (teams) / NO (profiles) | NO | **CRITICAL** |
| **CoachAvailabilityPage** | coaches, coach_availability, schedule_events | NO | YES (coaches) / NO (availability) | NO | **CRITICAL** |
| **JerseysPage** | teams, players, team_players, registrations | NO | YES (some) / NO (players line 210) | YES (some) | **CRITICAL** |
| **SeasonLeaderboardsPage** | teams, player_season_stats | NO | YES | NO | **CRITICAL** |
| **PlayerStatsPage** | players, player_season_stats, player_skill_ratings, schedule_events | NO | YES (some) / NO (players line 342) | NO | **CRITICAL** |
| **AchievementsCatalogPage** | achievements, player_achievements, player_tracked_achievements | NO | NO | NO | **CRITICAL** |
| **StaffPortalPage** | coaches, team_coaches, teams | NO (coaches) / YES (staff_members) | YES | NO | **CRITICAL** |
| **RosterManagerPage** | coaches, teams, team_players, player_skill_ratings, player_evaluations, waiver_signatures, player_positions | NO | YES (some) / NO (positions, coaches) | YES (some) | **CRITICAL** |
| **TeamStandingsPage** | teams, team_standings, schedule_events | NO | YES | YES | OK (double-filtered) |
| **OrganizationPage** | waivers, venues, user_roles | YES | NO | NO | **OK** |
| **SeasonsPage** | seasons, registration_templates | YES | YES | NO | **OK** |
| **WaiversPage** | waiver_templates | YES | NO | NO | **OK** |
| **WaiversPage** | waiver_edit_history, waiver_signatures | NO | NO | NO | **CRITICAL** |
| **PaymentSetupPage** | organizations | YES | NO | NO | **OK** |
| **ReportsPage** | seasons, sports, teams, players, payments, schedule_events, coaches | YES (some) | YES | YES (some) | **OK** |
| **RegistrationFunnelPage** | seasons, players, registrations, payments, registration_funnel_events | YES (some) | YES | NO | **OK** |
| **GamePrepPage** | teams, schedule_events, game_lineups, event_rsvps, team_players | NO | YES | YES | **OK** |
| **GameDayCommandCenter** | team_players, event_rsvps, game_lineups, schedule_events | NO | YES | YES | **OK** |
| **DashboardPage** | teams, players, payments, waivers, waiver_signatures, schedule_events, etc. | YES (waivers) | YES (most) | YES (some) | **OK** |
| **DashboardPage** | games | NO | NO | YES (team IDs) | **MEDIUM** |

### CRITICAL Findings — Pages with NO org_id Filter

**Tier 1 — Financial/PII Data Exposure (FIX FIRST):**

1. **PaymentsPage.jsx** — Lines 60, 69, 189, 210
   - All payment queries filter by `season_id` only
   - Exposes: payment amounts, fee categories, family emails
   - Fix: Add `.eq('organization_id', organization.id)` to all read queries

2. **RegistrationsPage.jsx** — Lines 81, 132
   - Main query filters by `season_id` only; single-player fetch has NO filter
   - Exposes: player names, emails, addresses, registration status
   - Fix: Add `.eq('organization_id', organization.id)` to both queries

**Tier 2 — Operational Data Exposure:**

3. **TeamsPage.jsx** — Lines 67, 98, 105, 119, 135, 305
   - All queries filter by `season_id` only
   - Exposes: team rosters, player assignments, coach assignments

4. **CoachesPage.jsx** — Lines 59, 78, 93
   - Coaches query filters by `season_id` only
   - Exposes: coach names, assignments, contact info

5. **SchedulePage.jsx** — Lines 86, 139, 201, 213, 223, 239
   - Read queries use `season_id`; update/delete operations have NO season or org filter
   - Risk: A user could delete/modify events from other organizations by ID

6. **AttendancePage.jsx** — Lines 53, 72, 102, 109, 137-140, 158, 160, 175, 187
   - 10 CRITICAL queries; RSVPs/volunteers have no org scope
   - Risk: Cross-org attendance manipulation

7. **ChatsPage.jsx** — Lines 79, 114, 135, 162, 179, 192
   - Chat channels filtered by `season_id`; messages/members not org-filtered
   - Risk: Reading messages from other organizations

8. **BlastsPage.jsx** — Lines 53, 72, 331, 347, 386, 398, 429
   - Blast creation and recipient queries not org-filtered
   - Risk: Sending blasts to other orgs' members

9. **CoachAvailabilityPage.jsx** — Lines 143, 178, 197, 303, 322, 362
   - Availability table completely unscoped
   - Risk: Viewing/modifying any coach's availability

**Tier 3 — Player/Achievement Data Exposure:**

10. **AchievementsCatalogPage.jsx** — Lines 73, 92, 101, 230, 250
    - NO organization filter on any achievement query
    - Risk: Viewing/managing achievements for any player in the system

11. **PlayerStatsPage.jsx** — Lines 342, 352, 362, 373
    - Direct player lookup with no org filter (line 342)
    - Stats/ratings filtered by `season_id` only

12. **SeasonLeaderboardsPage.jsx** — Line 382
    - `player_season_stats` filtered by `season_id` only

13. **JerseysPage.jsx** — Lines 100, 210, 410
    - Players query has no org filter; jersey updates unscoped

14. **StaffPortalPage.jsx** — Lines 90, 158-237
    - Coaches query: `season_id` only (inconsistent with staff_members which uses org_id)

15. **RosterManagerPage.jsx** — Lines 65, 94, 98, 102, 108, 180-269
    - Multiple queries without org filter; `player_positions` has zero filtering

**Tier 4 — Settings Data Exposure:**

16. **WaiversPage.jsx** — Lines 104-105, 109-110, 118-121
    - `waiver_edit_history` and `waiver_signatures` queried by `waiver_template_id` only
    - No org filter on history/signature reads

17. **NotificationsPage.jsx** — Lines 79, 453, 557
    - Template toggle and profile queries not org-filtered
    - (Note: notification reads ARE properly org-filtered)

### Affected Tables (need org_id filter added)

| Table | Pages Affected | Data Sensitivity |
|-------|---------------|-----------------|
| `players` | 8+ pages | HIGH (PII) |
| `payments` | 3+ pages | HIGH (financial) |
| `registrations` | 3+ pages | HIGH (PII) |
| `coaches` | 4+ pages | MEDIUM |
| `teams` | 6+ pages | MEDIUM |
| `schedule_events` | 4+ pages | MEDIUM |
| `event_rsvps` | 3+ pages | MEDIUM |
| `event_volunteers` | 2+ pages | MEDIUM |
| `chat_messages` | 1+ pages | HIGH (private comms) |
| `coach_availability` | 1 page | LOW |
| `achievements` | 1 page | LOW |
| `player_achievements` | 1 page | LOW |
| `player_season_stats` | 3+ pages | MEDIUM |
| `player_skill_ratings` | 2+ pages | MEDIUM |
| `waiver_edit_history` | 1 page | MEDIUM |
| `waiver_signatures` | 2+ pages | MEDIUM |
| `player_positions` | 1 page | LOW |

### "All Seasons" Feature Assessment

The "All Seasons" feature in SeasonContext uses a sentinel object `{ id: 'all' }`. When active, DashboardPage properly returns early and uses pre-computed `globalStats` instead of per-season queries. **This is correctly implemented and does NOT create additional cross-org exposure** — but ONLY for the Dashboard. Other pages that don't handle `isAllSeasons()` correctly could still be affected.

---

## SECTION 2: React Error #310 — OrganizationPage.jsx

### Root Cause

**Hooks called AFTER an early return statement.**

**File:** `src/pages/settings/OrganizationPage.jsx`

**The Problem:**
- Lines 21-27: 7 `useState` hooks (valid, at top)
- Line 30: 1 `useEffect` hook (valid, at top)
- **Lines 669-678: Early return when `loading` is true** — returns a loading spinner
- Line 690: `useRef` — called AFTER the early return
- Lines 693-704: `useEffect` — called AFTER the early return
- Line 707: `useEffect` — called AFTER the early return
- Line 719: `useRef` — called AFTER the early return
- Line 720: `useCallback` — called AFTER the early return

**What happens:**
- When `loading === true`: Only hooks 1-8 execute, then the component returns early
- When `loading === false`: Hooks 1-8 execute, PLUS hooks 9-13 at lines 690-720
- React sees a different number of hooks between renders → Error #310

### Suggested Fix

**Option A (Recommended — Simplest):** Move ALL hooks (lines 689-736) to BEFORE the `if (loading)` block. Place them immediately after line 32, before any conditional logic.

**Option B (Alternative):** Replace the early return with conditional JSX rendering:
```jsx
// Instead of:
if (loading) return <LoadingSpinner />

// Use:
return (
  <PageShell>
    {loading ? <LoadingSpinner /> : <MainContent />}
  </PageShell>
)
```

**Option C (If hooks depend on loaded data):** Extract the post-loading content into a separate `<OrganizationPageInner />` component that receives loaded data as props and contains its own hooks.

---

## SECTION 3: Full Bug Sweep

### Build Status

```
vite v5.4.21 building for production...
✓ 1717 modules transformed
✓ built in 8.84s

WARNING: Chunk size > 500 kB (2,768 kB)
  → Not an error. Recommendation: code-split with dynamic import()
```

**Build: PASS** (no errors, 1 size warning)

### Undefined Components

**Status: NONE FOUND**

Searched for bare `<Select`, `<Toggle`, `<Switch`, `<Dropdown` references. All replaced with proper `SectionSelect`, `SectionToggle` etc. in the previous URGENT fix commit (`a57de6b`).

### Broken Imports

**Status: NONE FOUND**

All 100+ imports in MainApp.jsx verified — all imported files exist at their specified paths.

### Broken Routes

**Status: NONE FOUND**

All 50+ route definitions in `RoutedContent` (MainApp.jsx lines 651-773) point to valid imported components. Dynamic routes (`/teams/:teamId`, `/parent/player/:playerId`, etc.) are correctly configured. Fallback route catches undefined paths.

### LynxSidebar Navigation

**Status: WORKING**

`handleNavigation` in MainApp.jsx (lines 1073-1091) correctly routes:
- Dynamic team IDs → `/teams/{teamId}`
- Dynamic player IDs → `/parent/player/{playerId}`
- Standard pages → `getPathForPage(itemId)`

### CSS Design Tokens

**Status: CLEAN**

`v2-tokens.css` defines all required variables (brand colors, surfaces, text, semantics, shadows, dimensions, dark mode overrides).

### Other Issues

**NONE** — Recent changes (SetupSectionContent extraction, waiver flow fix, Org Setup layout, undefined component fix, input focus fix) are all clean.

---

## SECTION 4: Priority Order for Fixes

### P0 — Fix Immediately (Security)

| # | Fix | File(s) | Est. Lines |
|---|-----|---------|-----------|
| 1 | Add `organization_id` filter to PaymentsPage queries | PaymentsPage.jsx | ~8 lines |
| 2 | Add `organization_id` filter to RegistrationsPage queries | RegistrationsPage.jsx | ~4 lines |
| 3 | Add `organization_id` filter to TeamsPage queries | TeamsPage.jsx | ~12 lines |
| 4 | Add `organization_id` filter to CoachesPage queries | CoachesPage.jsx | ~6 lines |
| 5 | Add org scope to SchedulePage update/delete operations | SchedulePage.jsx | ~8 lines |
| 6 | Add org scope to AttendancePage RSVP/volunteer queries | AttendancePage.jsx | ~12 lines |
| 7 | Add org scope to ChatsPage message queries | ChatsPage.jsx | ~6 lines |
| 8 | Add org scope to BlastsPage blast/recipient queries | BlastsPage.jsx | ~8 lines |

### P1 — Fix This Week (Security + Stability)

| # | Fix | File(s) | Est. Lines |
|---|-----|---------|-----------|
| 9 | Fix React Error #310 — move hooks before early return | OrganizationPage.jsx | ~20 lines |
| 10 | Add org filter to AchievementsCatalogPage | AchievementsCatalogPage.jsx | ~10 lines |
| 11 | Add org filter to PlayerStatsPage | PlayerStatsPage.jsx | ~8 lines |
| 12 | Add org filter to CoachAvailabilityPage | CoachAvailabilityPage.jsx | ~8 lines |
| 13 | Add org filter to StaffPortalPage coaches query | StaffPortalPage.jsx | ~2 lines |
| 14 | Add org filter to RosterManagerPage | RosterManagerPage.jsx | ~12 lines |

### P2 — Fix Soon (Data Hygiene)

| # | Fix | File(s) | Est. Lines |
|---|-----|---------|-----------|
| 15 | Add org filter to JerseysPage players query | JerseysPage.jsx | ~4 lines |
| 16 | Add org filter to SeasonLeaderboardsPage | SeasonLeaderboardsPage.jsx | ~2 lines |
| 17 | Add org filter to WaiversPage history/signatures | WaiversPage.jsx | ~6 lines |
| 18 | Add org filter to NotificationsPage template/profile queries | NotificationsPage.jsx | ~4 lines |
| 19 | Add org filter to DashboardPage games query | DashboardPage.jsx | ~2 lines |

### P3 — Structural Improvements (Not Urgent)

| # | Fix | Description |
|---|-----|-------------|
| 20 | Enable RLS on all tables | Server-side enforcement as backup to client-side filters |
| 21 | Code-split the 2.7MB JS bundle | Dynamic imports for route-based splitting |
| 22 | Audit tables missing `organization_id` column | Some tables (achievements, player_positions) may need schema additions |

---

## SECTION 5: Suggested Fixes (Exact Locations)

### Fix #1: PaymentsPage.jsx — Add org_id filter

```
Line 60: .from('players').select('*, registrations(*)')
  ADD: .eq('organization_id', organization.id) after .select()

Line 69: .from('payments').select('player_id, family_email, fee_category')
  ADD: .eq('organization_id', organization.id) after .select()

Line 189: .from('players').select(...)
  ADD: .eq('organization_id', organization.id) after .select()

Line 210: .from('payments').select(...)
  ADD: .eq('organization_id', organization.id) after .select()
```

### Fix #2: RegistrationsPage.jsx — Add org_id filter

```
Line 81: .from('players').select('*, registrations(*), seasons:season_id(id, name)')
  ADD: .eq('organization_id', organization.id) after .select()

Line 132: .from('players').select('*, registrations(*)')
  ADD: .eq('organization_id', organization.id) after .select()
```

### Fix #3: TeamsPage.jsx — Add org_id filter

```
Line 67: .from('teams').select(...)
  ADD: .eq('organization_id', organization.id) after .select()

Line 119: .from('players').select(...)
  ADD: .eq('organization_id', organization.id) after .select()

Line 305: .from('coaches').select(...)
  ADD: .eq('organization_id', organization.id) after .select()
```

### Fix #4: CoachesPage.jsx — Add org_id filter

```
Line 59: .from('coaches').select('*')
  ADD: .eq('organization_id', organization.id) after .select()

Line 93: .from('teams').select(...)
  ADD: .eq('organization_id', organization.id) after .select()
```

### Fix #5: SchedulePage.jsx — Add org scope to mutations

```
Line 201: .from('schedule_events').update(...)
  ADD: .eq('season_id', selectedSeason.id) to the .eq() chain

Line 213: .from('schedule_events').delete()
  ADD: .eq('season_id', selectedSeason.id) to the .eq() chain

Line 223: .from('schedule_events').update(...)
  ADD: .eq('season_id', selectedSeason.id) to the .eq() chain

Line 239: .from('schedule_events').delete()
  ADD: .eq('season_id', selectedSeason.id) to the .eq() chain
```

### Fix #6-8: AttendancePage, ChatsPage, BlastsPage

Same pattern: Add `.eq('organization_id', organization.id)` to all read queries. For tables without an `organization_id` column, filter via the parent relationship (team → season → org).

### Fix #9: OrganizationPage.jsx — React Error #310

```
MOVE lines 689-736 (all useRef, useEffect, useCallback hooks)
TO immediately after line 32 (after the first useEffect)
BEFORE the if (loading) return block at line 669
```

### Fix #10-19: Remaining org_id filters

Same pattern as fixes #1-4. Add `.eq('organization_id', organization.id)` to each flagged query. For tables that don't have an `organization_id` column (e.g., `achievements`, `player_positions`), either:
- Add the column to the table (requires schema change — coordinate with mobile app)
- Or filter via a parent relationship (e.g., join through `players` → `season_id` → org)

---

## IMPORTANT CAVEATS

1. **Line numbers are approximate** — based on current file state. Verify before editing.
2. **Some tables may not have an `organization_id` column.** Before adding `.eq('organization_id', ...)`, verify the column exists in the schema. Tables like `achievements`, `player_positions`, `event_rsvps`, `event_volunteers` may need schema additions first.
3. **RLS is the proper long-term fix.** Client-side filtering is defense-in-depth but NOT a substitute for server-side Row Level Security policies.
4. **Mobile app shares the same database.** Any schema changes (adding columns) must be coordinated with `volleybrain-mobile3`.

---

## Spec Execution Report

- **Spec:** CC-CRITICAL-SECURITY-AUDIT.md
- **Phases completed:** 3/3 (Security audit, React #310, Bug sweep)
- **Phases skipped:** 0
- **Files modified:** 1 (this report only)
- **Total lines changed:** +0 code / -0 code (investigation only)
- **Build status:** PASS (1 size warning, 0 errors)
- **Unintended changes:** NONE
- **Code changes made:** NONE — report only as specified
