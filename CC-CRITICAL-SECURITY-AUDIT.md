# CC-CRITICAL-SECURITY-AUDIT.md
# CRITICAL SECURITY AUDIT — Data Leaking Across Organizations + Full Bug Investigation

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## PRIORITY: EMERGENCY. DO NOT SKIP ANY STEP.

## DO NOT CHANGE ANY CODE IN THIS SPEC. READ ONLY. REPORT ONLY.

This is an INVESTIGATION spec. CC will search, read, and report. CC will NOT modify any files. CC will produce a report with findings, affected files, line numbers, and suggested fixes. Carlos will review the report before any changes are made.

---

## PROBLEM 1: CRITICAL SECURITY — Cross-Organization Data Leak

A user on Organization A can see registration data from Organization B. This means the `.eq('organization_id', ...)` filter is missing or broken on at least the Registrations page, and potentially on EVERY page that loads data.

### Investigation Steps:

**Step 1: Check how organization_id is obtained and used globally.**
```bash
# How does the app get the current user's organization?
grep -rn "organization_id\|organization\.id\|org_id\|orgId" src/contexts/ --include="*.jsx" --include="*.js" | head -20

# How is it stored/provided?
grep -rn "organization" src/contexts/AuthContext.jsx | head -20
```

**Step 2: Check EVERY page's data loading for organization_id filtering.**

For EACH page below, find the Supabase `.from()` query and verify it includes `.eq('organization_id', organization.id)` or equivalent:

```bash
# Registrations — THE CONFIRMED LEAK
grep -n "\.from(" src/pages/registrations/RegistrationsPage.jsx | head -10

# Every other data-loading page:
grep -n "\.from(" src/pages/payments/PaymentsPage.jsx | head -10
grep -n "\.from(" src/pages/teams/TeamsPage.jsx | head -10
grep -n "\.from(" src/pages/coaches/CoachesPage.jsx | head -10
grep -n "\.from(" src/pages/staff/StaffPage.jsx | head -10
grep -n "\.from(" src/pages/schedule/SchedulePage.jsx | head -10
grep -n "\.from(" src/pages/attendance/AttendancePage.jsx | head -10
grep -n "\.from(" src/pages/chats/ChatsPage.jsx | head -10
grep -n "\.from(" src/pages/blasts/BlastsPage.jsx | head -10
grep -n "\.from(" src/pages/notifications/NotificationsPage.jsx | head -10
grep -n "\.from(" src/pages/jerseys/JerseysPage.jsx | head -10
grep -n "\.from(" src/pages/leaderboards/SeasonLeaderboardsPage.jsx | head -10
grep -n "\.from(" src/pages/standings/TeamStandingsPage.jsx | head -10
grep -n "\.from(" src/pages/stats/PlayerStatsPage.jsx | head -10
grep -n "\.from(" src/pages/achievements/AchievementsCatalogPage.jsx | head -10
grep -n "\.from(" src/pages/reports/ReportsPage.jsx | head -10
grep -n "\.from(" src/pages/reports/RegistrationFunnelPage.jsx | head -10
grep -n "\.from(" src/pages/settings/OrganizationPage.jsx | head -10
grep -n "\.from(" src/pages/settings/SeasonsPage.jsx | head -10
grep -n "\.from(" src/pages/settings/WaiversPage.jsx | head -10
grep -n "\.from(" src/pages/settings/PaymentSetupPage.jsx | head -10
grep -n "\.from(" src/pages/dashboard/DashboardPage.jsx | head -20
grep -n "\.from(" src/pages/staff-portal/StaffPortalPage.jsx | head -10
grep -n "\.from(" src/pages/gameprep/GamePrepPage.jsx | head -10
grep -n "\.from(" src/pages/gameprep/GameDayCommandCenter.jsx | head -10
grep -n "\.from(" src/pages/schedule/CoachAvailabilityPage.jsx | head -10
grep -n "\.from(" src/pages/roster/RosterManagerPage.jsx | head -10
```

**For EACH query found**, check:
1. Does it filter by `organization_id`? 
2. Does it filter by `season_id` (which is scoped to the org)?
3. Does it filter by `team_id` (which is scoped to the org via season)?
4. Is there NO org-level filter at all? **FLAG THIS AS A SECURITY ISSUE.**

**Step 3: Check RLS (Row Level Security) in Supabase.**

The app previously had an RLS security audit. Check if the recent changes broke any RLS assumptions:
```bash
# Check if any queries use .eq('organization_id', ...) 
grep -rn "\.eq.*organization_id\|\.eq.*org_id" src/pages/ --include="*.jsx" | wc -l

# Check if any queries DON'T filter by org at all
# Look for simple .from('table').select('*') without any org filter
grep -rn "\.from.*\.select.*\*" src/pages/ --include="*.jsx" | grep -v "\.eq\|\.in\|\.filter" | head -20
```

**Step 4: Check if the StaffPortalPage merge broke org scoping.**

The Staff Portal was a NEW page that merged coaches + staff. Check its queries:
```bash
grep -n "\.from\|\.eq\|organization_id\|season_id" src/pages/staff-portal/StaffPortalPage.jsx | head -20
```

**Step 5: Check the "All Seasons" feature.**

The All Seasons feature removes the `season_id` filter. When combined with missing `organization_id` filters, this could expose ALL data across ALL orgs:
```bash
grep -rn "isAllSeasons\|season_id.*all\|selectedSeason.*all" src/pages/ --include="*.jsx" | head -20
```

### REPORT FORMAT for Problem 1:
```
## Security Audit: Organization Data Isolation

| Page | Query Table | Has org_id filter? | Has season_id filter? | Has RLS backup? | RISK |
|------|-------------|-------------------|-----------------------|-----------------|------|
| RegistrationsPage | registrations | YES/NO | YES/NO | ? | CRITICAL/OK |
| PaymentsPage | payments | YES/NO | YES/NO | ? | CRITICAL/OK |
| ... | ... | ... | ... | ... | ... |

CRITICAL FINDINGS:
- [List every query that does NOT filter by organization_id or an org-scoped parent]

AFFECTED TABLES:
- [List every Supabase table being queried without proper org isolation]
```

---

## PROBLEM 2: React Error #310 on OrganizationPage.jsx:690

React error #310 means: "Too many re-renders" or "Rendered more hooks than during the previous render." This is at line 690 of OrganizationPage.jsx, in a `useRef` call.

### Investigation:
```bash
# Look at line 690 and surrounding context
sed -n '680,700p' src/pages/settings/OrganizationPage.jsx

# Check if hooks are called conditionally (inside if/else, loops, or after early returns)
grep -n "useRef\|useState\|useEffect\|useMemo\|useCallback\|useContext" src/pages/settings/OrganizationPage.jsx | head -30

# Check for conditional returns before hook calls
grep -n "return\|if.*return" src/pages/settings/OrganizationPage.jsx | head -20
```

The most common cause of #310 is hooks being called inside a conditional block, inside a loop, or after an early return. If recent changes added a `useRef` inside an if-statement or inside a sub-component that's defined inline, that's the bug.

### REPORT FORMAT for Problem 2:
```
## React Error #310 Investigation

File: OrganizationPage.jsx
Line 690: [what's on this line]
Root cause: [hooks called conditionally / inline component / etc.]
Suggested fix: [move hook outside conditional / extract component / etc.]
```

---

## PROBLEM 3: Full Bug Sweep — Check Every Recent Change

The recent mega specs (Settings, Reports, Operational, Onboarding, Sidebar, Undefined Components fix) touched dozens of files. Some may have introduced additional bugs.

### Investigation:

**Step 1: List all files changed in the last 10 commits:**
```bash
git log --oneline -10
git diff HEAD~10 --name-only | sort
```

**Step 2: For each changed file, do a quick sanity check:**
```bash
# Check for any remaining undefined component references
grep -rn "<Select\b\|<Toggle\b\|<Switch\b\|<Dropdown\b" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v "// " | grep -v "<select\|<SelectAll\|setSelect\|onSelect\|isSelect\|selectedI\|<ToggleGroup\|toggleSelect\|toggleTheme\|setToggle\|<SwitchTeam"

# Check for any import statements referencing non-existent files
# (files that were moved or renamed during the redesigns)
grep -rn "from.*\.\./\|from.*\.\/" src/pages/ --include="*.jsx" | grep -c "Cannot find module" 2>/dev/null

# Check for any console errors in the build
npm run build 2>&1 | grep -i "error\|warning" | head -20
```

**Step 3: Check for broken routes:**
```bash
# Verify all routes in MainApp still point to valid components
grep -n "element={" src/MainApp.jsx | head -30

# Check that all imported page components exist
grep -n "^import" src/MainApp.jsx | head -40
```

**Step 4: Check the sidebar changes didn't break navigation:**
```bash
# Check LynxSidebar for any issues
grep -n "onNavigate\|onClick\|href\|to=" src/components/layout/LynxSidebar.jsx | head -20
```

### REPORT FORMAT for Problem 3:
```
## Full Bug Sweep Report

### Undefined Components Still Remaining:
- [file:line] — [component name]

### Build Warnings/Errors:
- [list]

### Broken Routes:
- [list or "none"]

### Broken Imports:
- [list or "none"]

### Other Issues Found:
- [list]
```

---

## FINAL DELIVERABLE

Produce ONE file: `CRITICAL-AUDIT-REPORT.md` containing:

1. **Security section** — every page's data isolation status (the table above)
2. **React #310 section** — root cause and suggested fix
3. **Bug sweep section** — all remaining issues found
4. **Priority order** — which fixes should be applied first
5. **Suggested fix for each issue** — exact file, line, what to change (but DO NOT make the change)

```bash
git add CRITICAL-AUDIT-REPORT.md
git commit -m "docs: CRITICAL security and bug audit report — investigation only, no code changes"
git push origin main
```

## REMEMBER: DO NOT CHANGE ANY CODE. REPORT ONLY.
