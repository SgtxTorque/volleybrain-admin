# CC-WEB-FULL-AUDIT.md — Lynx Web Admin Full Audit Spec

## READ FIRST
1. `CLAUDE.md` (project rules)
2. `src/lib/routes.js` (route map)
3. `src/MainApp.jsx` (all routing + nav groups)
4. `src/App.jsx` (outer auth + public routes)
5. `src/components/layout/LynxSidebar.jsx` (sidebar nav)

## PURPOSE

Perform a comprehensive, no-stone-unturned audit of the Lynx web admin codebase. This is the same methodology used on the mobile app (which found 26 issues across 5 phases, removed ~8,400 lines, and consolidated 12 screens into 4). The web admin is larger (~169 page files, 148 components, 65 routes) and has never had this audit done.

**CC does ALL the investigative work.** Carlos cannot code. Your job is to trace every path, verify every connection, and produce detailed findings. Do NOT skip files, do NOT assume things work. Open them, read them, verify them.

---

## PHASE 1: ROUTE & NAVIGATION AUDIT

### 1A. Route Completeness Check

For EVERY route in `src/MainApp.jsx` (both RoutedContent and PlatformShell):
- Does the route render a real component or a stub/placeholder?
- Is the imported component actually exported from its file?
- Does the page file exist and have real content (not just a "Coming Soon" placeholder)?
- Count lines per page file. Flag any under 100 lines as potential stubs.

**Deliverable:** A table in the report:
```
| Route Path | Component | File | Lines | Status (Live/Stub/Broken) | Notes |
```

### 1B. Nav Item → Route Mapping

For EVERY nav item in ALL 5 role navGroups (adminNavGroups, coachNavGroups, parentNavGroups, playerNavGroups, teamManagerNavGroups) in MainApp.jsx:
- What `id` does the nav item use?
- What does `getPathForPage(id)` in `lib/routes.js` resolve to?
- Does that path have a matching `<Route>` in RoutedContent?
- Does the Route render the correct page for that role?
- Is there a RouteGuard? If so, what roles are allowed?
- Can the nav item's intended role actually pass the RouteGuard?

**Flag these issues:**
- Nav item points to a route that doesn't exist
- Nav item points to a route that is RouteGuarded against the role that has the nav item
- Nav item uses special handling in `handleNavigation()` that could fail (e.g., team-hub for parent with no children)
- Route exists but has no nav item pointing to it (orphaned route)

**Deliverable:** A table per role:
```
| Nav Item Label | Nav ID | Resolves To | Route Exists? | Guard | Can Role Access? | Status |
```

### 1C. RouteGuard Security Audit

For EVERY route in RoutedContent:
- Does it have a RouteGuard wrapper?
- If yes, what roles are in the `allow` array?
- If no, SHOULD it have one? (Use this logic: if the page shows org-level data, financial data, admin controls, or player personal data, it needs a guard)
- Are there routes that have a guard but the guard is too permissive or too restrictive?

**Also check:** The RouteGuard component itself (`src/components/auth/RouteGuard.jsx`). What does it do when access is denied? Does it redirect? Show an error? Silently render nothing?

**Deliverable:** Security findings list with severity ratings.

---

## PHASE 2: FILE & IMPORT AUDIT

### 2A. Orphaned Files

Scan ALL .jsx files in `src/pages/` and `src/components/`. For each file:
- Is it imported by ANY other file in the project? (Search for the filename/export name across the entire src/ directory)
- If it's only imported by its own directory's index.js, is THAT index.js imported anywhere?
- Flag any file that has zero external imports as ORPHANED.

**Known suspects to check:**
- `src/pages/dashboard/DashboardWidgetsExample.jsx`
- `src/pages/achievements/TrackedAchievementsWidget.jsx`
- `src/pages/public/TeamWallPage.jsx` (the public version — is it used anywhere?)
- Any file in `src/components/` that isn't imported by any page

**Deliverable:** List of orphaned files with line counts.

### 2B. Duplicate / Overlapping Files

Check these known clusters for overlap:
- **DashboardGrid**: `components/layout/DashboardGrid.jsx`, `components/layout/DashboardGrids.jsx`, `components/widgets/dashboard/DashboardGrid.jsx` — which ones are actually used? Which are dead?
- **TeamWallPage**: `pages/public/TeamWallPage.jsx` (1,132 lines) vs `pages/teams/TeamWallPage.jsx` (840 lines) — do they share code? Is one a dead fork of the other?
- **LineupBuilder**: `components/games/AdvancedLineupBuilder.jsx` vs `pages/schedule/LineupBuilder.jsx` — which is used where?
- **VenueManager**: `pages/settings/VenueManagerPage.jsx` vs `pages/schedule/VenueManagerModal.jsx` — overlap?
- **Season pages**: `pages/settings/SeasonsPage.jsx` (311 lines) vs `pages/admin/SeasonManagementPage.jsx` (430 lines) — what's the difference? Are both needed?
- **Coach dashboard components**: `pages/roles/CoachDashboard.jsx` vs `components/coach/CoachCenterDashboard.jsx` — relationship?

For each cluster, open both files, compare their exports, their usage, and determine: keep one, merge, or both are needed for different purposes.

**Deliverable:** Duplicate analysis with recommendation (keep/merge/delete) per cluster.

### 2C. Misplaced Files

Check for files that live in the wrong directory:
- `pages/roster/SeasonSetupWizard.jsx` — why is a season setup wizard in the roster directory?
- `pages/schedule/LineupBuilder.jsx` — should this be in gameprep/?
- `pages/schedule/VenueManagerModal.jsx` — should this be in settings/ next to VenueManagerPage?
- Any component in `pages/` that is actually a shared component (used by multiple pages) and should be in `components/`
- Any page in `components/` that is actually a full page and should be in `pages/`

**Deliverable:** List of misplaced files with recommended new locations.

### 2D. Monster Files

List every file over 500 lines. For each one:
- What does it do?
- Could it be split into smaller, more maintainable files?
- Are there logical extraction candidates (e.g., a helper function block, a sub-component, a constants section)?

**Deliverable:** Table of large files with split recommendations.

---

## PHASE 3: CROSS-ROLE BEHAVIOR AUDIT

### 3A. Shared Routes Per-Role Behavior

These routes render differently based on `activeView` but have NO RouteGuard:
- `/dashboard` — switches between DashboardPage/CoachDashboard/ParentDashboard/PlayerDashboard/TeamManagerDashboard
- `/payments` — switches between PaymentsPage (admin) and ParentPaymentsPage (parent)
- `/schedule` — same SchedulePage but passes activeView and roleContext
- `/chats` — same ChatsPage but passes activeView and roleContext
- `/achievements` — same AchievementsCatalogPage but different playerId logic

For each: verify that the role-conditional logic actually works. What happens if a coach navigates to /payments? What happens if a player navigates to /registrations (blocked by guard — good)?

### 3B. Player Role Issues

`playerSelf` is hardcoded to `null` in MainApp.jsx. This means:
- `roleContext.isPlayer` is always false
- `roleContext.playerInfo` is always null
- The Player view only appears in the role switcher if the user is also admin or coach (preview mode)
- PlayerDashboard receives `roleContext` with no real player data

Audit what breaks in the Player view because of this. Check PlayerDashboard.jsx, PlayerStatsPage.jsx, AchievementsCatalogPage.jsx — what do they do when there's no real player profile linked?

### 3C. Parent-Specific Navigation Issues

- The parent nav has `{ id: 'team-hub', label: 'Team Hub', icon: 'users' }` — this is handled specially in `handleNavigation()` by navigating to the first child's first team's wall. What if `roleContext.children` is empty or the first child has no `team_players`? Trace the exact failure path.
- The player nav has `{ id: 'my-stuff' }` which maps to `/my-stuff` which has `RouteGuard allow={['parent']}`. A player clicking "Profile & Stats" in their sidebar gets BLOCKED. Verify this.

---

## PHASE 4: ARCHITECTURE & CODE HEALTH

### 4A. _archive/ Directory Audit

`src/_archive/` is 3.3MB. List every directory and file in it. Check: is ANY of it imported by active code? If not, the entire directory is dead weight.

### 4B. src_backup/ Directory Audit

`src_backup/` is 1.3MB and contains a legacy monolithic App.jsx (1.2MB). Is it imported anywhere? Is it in .gitignore? Should it be deleted?

### 4C. CC Spec File Cleanup

There are 89 CC-*.md files in the repo root totaling 1.4MB. These are executed specs from past sessions. List them all. None should be in the repo root — they should be moved to a `specs/` or `docs/executed-specs/` directory or deleted entirely.

Also check for other root-level doc files that may be stale:
- TEAMWALL_*.md files (8+ of them)
- INVESTIGATION-*.md files
- MOBILE-FEATURE-AUDIT.md, MOBILE_PARITY.md (mobile docs in web repo)
- WEB_BETA_GAMEPLAN.md, QA-AUDIT-RESULTS.md

### 4D. reference/ Directory

`reference/` is 90MB. Check what's in it and whether it's in .gitignore. 90MB of images in a git repo is a problem.

### 4E. Import Health Check

Search for:
- Circular imports (file A imports from file B which imports from file A)
- Unused imports within files (imported but never referenced in JSX or logic)
- Imports from `_archive/` or `src_backup/`
- Broken imports (importing from a file that doesn't exist)

### 4F. Context & Hook Audit

List every Context provider and custom hook. For each:
- Where is it provided (wrapped in the component tree)?
- Which pages/components consume it?
- Are any contexts provided but never consumed?
- Are any hooks exported but never imported?

Check specifically:
- `JourneyContext.jsx` — is it used in the web app or only mobile?
- `ParentTutorialContext.jsx` — is the tutorial system actually wired up?
- `OrgBrandingContext.jsx` — what pages use it?

---

## PHASE 5: BUTTON & ACTION AUDIT

### 5A. Dashboard Action Buttons

For each role's dashboard, find every clickable element (button, card, link). Trace where it navigates or what action it triggers. Flag:
- Buttons that navigate to non-existent pages
- Buttons with `onClick={() => {}}` or `onClick={null}` (no-ops)
- Buttons that call `onNavigate` with an ID that doesn't exist in routes.js
- "View All" or "See More" links that go nowhere

### 5B. Modal & Drawer Connections

For every modal component:
- What triggers it to open?
- Does it receive the data it needs via props?
- Does it have a working close/dismiss mechanism?
- After a successful action (save, create, delete), does it refresh the parent data?

### 5C. Floating Components

Check these always-present components:
- `FloatingChatButton` — what does it navigate to? Does it work for all roles?
- `SetupHelper` — what does it do? Is it functional?
- `BlastAlertChecker` — does it work? What does it check?
- `SpotlightOverlay` / `ParentChecklistWidget` / `FloatingHelpButton` — are these wired up?

---

## DELIVERABLES

After completing ALL phases, produce these output files:

### 1. `WEB-AUDIT-REPORT.md`
A comprehensive markdown report with ALL findings organized by phase. Every issue gets:
- Severity: CRITICAL / HIGH / MEDIUM / LOW / INFO
- Category tag: SECURITY / NAVIGATION / DUPLICATE / ORPHAN / ARCHITECTURE / UX / DEAD-CODE
- Description of the problem
- File(s) involved with line numbers
- Recommended fix

### 2. `WEB-AUDIT-DASHBOARD.html`
An interactive HTML dashboard (same format as the mobile audit dashboard at the repo root) with:
- Tab 1: Overview (summary stats, critical issues count, severity breakdown)
- Tab 2: Security (RouteGuard audit, unguarded routes, recommendations)
- Tab 3: Nav Audit (per-role nav item → route trace tables)
- Tab 4: Duplicates & Orphans (file clusters, dead code, orphaned files)
- Tab 5: Architecture (monster files, misplaced files, archive/cleanup)
- Tab 6: Role Matrix (which roles can access which pages — cross-reference grid)
- Tab 7: Fix Plan (prioritized phases with specific fix items, estimated effort)

Use the Lynx brand colors (navy #10284C, sky #4BB9EC, gold #FFD700). Use DM Sans + JetBrains Mono fonts. Make it polished and easy for a non-coder to understand.

### 3. `WEB-NAVIGATION-MAP.md`
A complete navigation map showing:
- Every route with its page component, file path, RouteGuard, and which roles can reach it via nav
- Every sidebar nav item per role with its destination
- Orphaned routes (exist but no nav item points to them)
- Missing routes (nav items that point to non-existent destinations)

---

## EXECUTION RULES

1. **Do NOT fix anything.** This is an audit only. Document everything, fix nothing.
2. **Do NOT skip files.** Open every suspect file and verify with your own eyes. Do not assume based on filenames.
3. **Do NOT guess.** If you can't determine whether a file is used, grep the entire src/ directory for its name and every export it contains.
4. **Be thorough.** The mobile audit found issues we never would have caught without systematic checking. Apply the same rigor here.
5. **Count everything.** Line counts, file counts, import counts. Numbers tell the story.
6. **Commit the deliverables** when complete: `git add WEB-AUDIT-REPORT.md WEB-AUDIT-DASHBOARD.html WEB-NAVIGATION-MAP.md && git commit -m "Web admin full audit: report + dashboard + nav map" && git push`

---

## IMPORTANT CONTEXT

- The mobile audit (chat: 7c98fd95) found: 12 orphaned screens, 8 unguarded admin screens, 50-item drawer reduced to 69, ~8,400 lines of dead code removed, 4 chat screens consolidated to 1, 4 roster screens to 1, 2 game prep to 1, 2 game results to 1.
- The web admin has NEVER had this audit done. Expect similar or worse findings.
- Carlos is the sole user and tester. He will use the dashboard HTML to review findings before authorizing any fixes.
- After this audit, a separate CC-WEB-AUDIT-FIX spec will be created to execute fixes in phases, just like the mobile audit did.
