# CC-FIX-SESSION-WAIVERS-SCHEMA.md
# Fix: Session Bleed + Waiver Table Name + Remove Invalid org_id Filters

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `INVESTIGATION-REPORT-SESSION-WAIVERS-SCHEMA.md`

## PRIORITY: CRITICAL — Pages returning no data due to 400 errors.

---

## PHASE 1: Remove Invalid `.eq('organization_id', ...)` From Tables That Don't Have It

The security fix added `.eq('organization_id', organization.id)` to tables that don't have that column. Supabase returns 400 errors, pages show no data. These tables are already org-scoped through their `season_id` foreign key.

**For EVERY file below, remove the `.eq('organization_id', organization.id)` line from queries on the specified table. Do NOT remove org_id filters on tables that DO have the column (seasons, waiver_templates, registration_templates, user_roles, organizations).**

### Edit contract:
**Allowed:** Remove `.eq('organization_id', organization.id)` from queries on tables that don't have that column.
**Not allowed:** Remove ANY other filter. Do not change select fields, sort order, or any other query logic. Do not remove org_id filters from tables that DO have the column.

### Files and lines to fix:

| File | Table | Action |
|------|-------|--------|
| `src/pages/schedule/SchedulePage.jsx` | schedule_events | Remove `.eq('organization_id', ...)` |
| `src/pages/schedule/SchedulePage.jsx` | teams | Remove `.eq('organization_id', ...)` |
| `src/pages/teams/TeamsPage.jsx` | teams | Remove `.eq('organization_id', ...)` |
| `src/pages/coaches/CoachesPage.jsx` | coaches | Remove `.eq('organization_id', ...)` |
| `src/pages/stats/PlayerStatsPage.jsx` | players | Remove `.eq('organization_id', ...)` |
| `src/pages/stats/PlayerStatsPage.jsx` | schedule_events | Remove `.eq('organization_id', ...)` |
| `src/pages/payments/PaymentsPage.jsx` | payments | Remove `.eq('organization_id', ...)` |
| `src/pages/payments/PaymentsPage.jsx` | players | Remove `.eq('organization_id', ...)` |
| `src/pages/chats/ChatsPage.jsx` | chat_channels | Remove `.eq('organization_id', ...)` |
| `src/pages/achievements/AchievementsCatalogPage.jsx` | player_achievements | Remove `.eq('organization_id', ...)` |
| `src/pages/schedule/CoachAvailabilityPage.jsx` | coaches | Remove `.eq('organization_id', ...)` |
| `src/pages/staff-portal/StaffPortalPage.jsx` | coaches | Remove `.eq('organization_id', ...)` |
| `src/pages/staff-portal/StaffPortalPage.jsx` | teams | Remove `.eq('organization_id', ...)` |
| `src/pages/roster/RosterManagerPage.jsx` | coaches | Remove `.eq('organization_id', ...)` |
| `src/pages/jerseys/JerseysPage.jsx` | teams | Remove `.eq('organization_id', ...)` |
| `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` | teams | Remove `.eq('organization_id', ...)` |
| `src/pages/notifications/NotificationsPage.jsx` | teams | Remove `.eq('organization_id', ...)` |
| `src/pages/dashboard/DashboardPage.jsx` | teams | Remove `.eq('organization_id', ...)` |

**How to find each one:**
```bash
grep -rn "\.eq.*organization_id.*organization" src/pages/ --include="*.jsx" | grep -v _archive
```

For each match, check the `.from('table_name')` call above it. If the table is in the "does NOT have organization_id" list (schedule_events, teams, coaches, players, payments, chat_channels, notifications, player_achievements), remove the `.eq('organization_id', ...)` line.

If the table IS in the "HAS organization_id" list (seasons, waiver_templates, registration_templates, user_roles, organizations, registration_fees), KEEP the filter.

### Verify:
```bash
npm run build
```
No 400 errors in browser console when navigating to Schedule, Teams, Payments, Coaches, Chats.

### Commit:
```bash
git add [all 12+ affected files]
git commit -m "CRITICAL: Remove organization_id filter from 16 queries on tables that lack that column"
```

---

## PHASE 2: Fix Waiver Table Name

**File:** `src/pages/settings/OrganizationPage.jsx`
**Edit contract:** Change ONE word. Nothing else.

### Fix:
Find the waiver loading query (around line 39):
```javascript
// FIND:
.from('waivers')

// REPLACE WITH:
.from('waiver_templates')
```

That's it. The checkbox code in SetupSectionContent.jsx is already functional. It just never gets data because the query hits a nonexistent table.

### Verify:
- Navigate to Organization Setup
- Click Legal & Waivers section
- Waiver checkboxes should now appear with real waiver names (Liability Waiver, Custom COC Waiver, etc.)
- Checking/unchecking a waiver should work
- Save should persist the selection

### Commit:
```bash
git add src/pages/settings/OrganizationPage.jsx
git commit -m "Fix: Waiver query uses wrong table name — waivers → waiver_templates"
```

---

## PHASE 3: Fix Session State Bleed

**File:** `src/contexts/AuthContext.jsx`
**Edit contract:** Add ONE line after the existing `window.history.replaceState` call. Nothing else changes.

### Fix:
In the `signOut` function, after `window.history.replaceState(null, '', '/')`, add:
```javascript
window.history.replaceState(null, '', '/')
window.dispatchEvent(new PopStateEvent('popstate'))  // ← ADD THIS LINE
```

This notifies React Router that the URL changed, so it updates its internal location state to `/` which triggers the dashboard redirect.

### Verify:
1. Log in as Account A
2. Navigate to Schedule page
3. Log out (click Sign Out)
4. Log in as Account B
5. Should land on Dashboard, NOT Schedule

### Commit:
```bash
git add src/contexts/AuthContext.jsx
git commit -m "Fix: Dispatch popstate event on signOut so React Router resets to dashboard"
```

---

## FINAL PUSH

After ALL 3 phases:
```bash
git push origin main
```

## REPORT
```
## Fix Report
- Phase 1: org_id filters removed from [count] queries across [count] files
- Phase 2: Waiver table name fixed: YES/NO
- Phase 3: Session bleed fixed: YES/NO
- Build status: PASS/FAIL
- Schedule page loads data: YES/NO
- Teams page loads data: YES/NO
- Payments page loads data: YES/NO
- Waiver checkboxes appear and work: YES/NO
- Login redirects to dashboard: YES/NO
```
