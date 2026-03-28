# CC-CRITICAL-SECURITY-FIX.md
# CRITICAL: Add Organization Isolation to All Data Queries + Fix React #310

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `CRITICAL-AUDIT-REPORT.md` (the audit that identified these issues)

## PRIORITY: EMERGENCY — Security fix. Execute immediately.

## APPROACH
For every Supabase query flagged in the audit, add `.eq('organization_id', organization.id)` where the table HAS that column. For tables without `organization_id`, filter through a parent relationship (e.g., filter `event_rsvps` by first getting event IDs from org-scoped `schedule_events`).

**BEFORE adding `.eq('organization_id', ...)` to ANY query, verify the column exists:**
```bash
grep -n "organization_id" SUPABASE_SCHEMA.md DATABASE_SCHEMA.md SCHEMA_REFERENCE.csv 2>/dev/null | grep "<table_name>"
```

If the table does NOT have `organization_id`, use the parent-chain approach:
- `event_rsvps` → filter by `event_id` from org-scoped events
- `event_volunteers` → filter by `event_id` from org-scoped events
- `player_positions` → filter by `player_id` from org-scoped players
- `achievements` → these may be global (system-defined). Only filter `player_achievements` by player org scope
- `chat_messages` → filter by `channel_id` from org-scoped channels

**Every page must destructure `organization` from `useAuth()`.** If a page doesn't already import it, add the import. Check each file first.

---

## ELEMENT PRESERVATION CONTRACT

This spec ONLY adds `.eq()` filters to existing Supabase queries. It does NOT change:
- Query select fields
- Query sort order
- Variable names
- JSX rendering
- Component structure
- Any function logic beyond adding the filter

The ONLY acceptable change per query is inserting one `.eq('organization_id', organization.id)` line or equivalent parent-chain filter.

---

## PHASE 1: P0 — Financial & PII Data (Fix Immediately)

### 1A: PaymentsPage.jsx
**Ensure `organization` is destructured from `useAuth()`.**

Add `.eq('organization_id', organization.id)` to:
- Line ~60: players query
- Line ~69: payments query (fee check)
- Line ~189: players query (main load)
- Line ~210: payments query (main load)

### 1B: RegistrationsPage.jsx
Add `.eq('organization_id', organization.id)` to:
- Line ~81: players query (main load)
- Line ~132: players query (single player)

### 1C: TeamsPage.jsx
Add `.eq('organization_id', organization.id)` to:
- Line ~67: teams query
- Line ~119: players query
- Line ~305: coaches query

(teams table should have org_id. Verify.)

### 1D: CoachesPage.jsx
Add to:
- Line ~59: coaches query
- Line ~93: teams query

### 1E: SchedulePage.jsx
Add season_id scope to mutation operations:
- Line ~201: update query — add `.eq('season_id', selectedSeason.id)` if not present
- Line ~213: delete query — add season scope
- Line ~223: update query — add season scope
- Line ~239: delete series query — add season scope

For read queries, add org_id to the teams query.

### 1F: AttendancePage.jsx
This has 10 unscoped queries. Add org/season scope to each:
- Teams query: `.eq('organization_id', organization.id)`
- Events query: season-scoped (already done? verify)
- RSVPs: filter by event_id chain (events are season-scoped)
- Volunteers: filter by event_id chain

### 1G: ChatsPage.jsx
- Channel queries: verify season_id filter exists
- Message queries: filter by channel_id (channels are already org-scoped via season)
- Member queries: filter by channel_id

### 1H: BlastsPage.jsx
- Teams query: add org_id
- Messages query: add org_id (verify column exists on messages table)
- Players/recipients: filter through org-scoped teams

### Commit after Phase 1:
```bash
npm run build  # MUST PASS
git add src/pages/payments/PaymentsPage.jsx src/pages/registrations/RegistrationsPage.jsx src/pages/teams/TeamsPage.jsx src/pages/coaches/CoachesPage.jsx src/pages/schedule/SchedulePage.jsx src/pages/attendance/AttendancePage.jsx src/pages/chats/ChatsPage.jsx src/pages/blasts/BlastsPage.jsx
git commit -m "CRITICAL SECURITY: Add organization_id filters to P0 pages (payments, registrations, teams, coaches, schedule, attendance, chats, blasts)"
```

---

## PHASE 2: P1 — Stability + Remaining Security

### 2A: OrganizationPage.jsx — Fix React Error #310
Move ALL hooks at lines 689-736 (useRef, useEffect, useCallback) to BEFORE the `if (loading) return` block at line 669. Place them immediately after the existing hooks at the top of the component (after line ~32).

Do NOT change hook logic. Only move their position in the file.

### 2B: AchievementsCatalogPage.jsx
- Achievements may be system-wide (not org-scoped). Check if `achievements` table has org_id.
- `player_achievements` and `player_tracked_achievements`: filter by player_id from org-scoped players, OR by org_id if column exists.

### 2C: PlayerStatsPage.jsx
- Line ~342: players query — add org_id
- Stats/ratings: filter by season_id (already done? verify)

### 2D: CoachAvailabilityPage.jsx
- Coaches query: add org_id
- Availability query: filter through coach_id (coaches are org-scoped)
- Events query: add season scope

### 2E: StaffPortalPage.jsx
- Coaches query: add org_id to match the staff_members query pattern

### 2F: RosterManagerPage.jsx
- All queries: add org_id or parent-chain scope
- `player_positions`: filter through player_id chain

### Commit after Phase 2:
```bash
npm run build  # MUST PASS
git add src/pages/settings/OrganizationPage.jsx src/pages/achievements/AchievementsCatalogPage.jsx src/pages/stats/PlayerStatsPage.jsx src/pages/schedule/CoachAvailabilityPage.jsx src/pages/staff-portal/StaffPortalPage.jsx src/pages/roster/RosterManagerPage.jsx
git commit -m "SECURITY: Add org filters to P1 pages + fix React #310 hooks order"
```

---

## PHASE 3: P2 — Remaining Data Hygiene

### 3A: JerseysPage.jsx
- Players query line ~210: add org_id

### 3B: SeasonLeaderboardsPage.jsx
- Stats query: verify season scope, add org_id to teams query

### 3C: WaiversPage.jsx
- `waiver_edit_history`: filter by waiver_template_id (templates are org-scoped)
- `waiver_signatures`: filter by waiver_template_id chain

### 3D: NotificationsPage.jsx
- Template toggle query: add org_id
- Profile queries: add scope

### 3E: DashboardPage.jsx
- Games query: add team_id scope (teams are org-scoped)

### Commit after Phase 3:
```bash
npm run build  # MUST PASS
git add src/pages/jerseys/JerseysPage.jsx src/pages/leaderboards/SeasonLeaderboardsPage.jsx src/pages/settings/WaiversPage.jsx src/pages/notifications/NotificationsPage.jsx src/pages/dashboard/DashboardPage.jsx
git commit -m "SECURITY: Add org filters to P2 pages (jerseys, leaderboards, waivers, notifications, dashboard)"
```

---

## FINAL PUSH

After ALL 3 phases pass:
```bash
git push origin main
```

---

## VERIFICATION

After each phase, verify:
- [ ] `npm run build` passes with zero errors
- [ ] Only the targeted files appear in `git diff --name-only`
- [ ] The page still loads data correctly for the CURRENT organization
- [ ] The page does NOT show data from other organizations

**Critical test after all phases:**
1. Log in as Org A admin → check Registrations → should only see Org A data
2. Log in as Org B admin → check Registrations → should only see Org B data
3. Repeat for Payments, Teams, Schedule
4. Verify no pages crash (no "organization is undefined" errors)

---

## REPORT
```
## Critical Security Fix Report
- Phases completed: X/3
- P0 fixes applied: X/8 pages
- P1 fixes applied: X/6 pages
- P2 fixes applied: X/5 pages
- React #310 fixed: YES/NO
- Total queries patched: [count]
- Build status: PASS/FAIL
- Cross-org data leak verified closed: YES/NO
- Any tables missing organization_id column: [list]
```
