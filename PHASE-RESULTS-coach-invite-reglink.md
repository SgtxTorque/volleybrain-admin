# PHASE RESULTS: Coach Invite 400 + RegLink Fix
**Date:** 2026-04-11
**Branch:** main
**Build:** PASS — 10.96s, 1882 modules transformed

### Phase 1: Coach Invite 400 Fix — PASS
**Files changed:** src/pages/coaches/InviteCoachModal.jsx
**Commit:** 719c4ea
**Details:**
- Removed `role: role` from `handleNewUserInvite()` insert payload (line 189)
- Removed `role` from `handleRoleElevation()` insert payload (line 128)
- Role belongs on `team_coaches.role`, which is already set correctly later in both flows
- Verified `showToast` prop is passed from CoachesPage.jsx (line 419)
- The `team_coaches.insert` at lines 209-214 and 141-145 still correctly include `role`

### Phase 2: RegLinkModal Extraction — PASS
**Files created:** src/components/ui/RegLinkModal.jsx
**Files changed:** src/pages/dashboard/DashboardPage.jsx, src/pages/programs/ProgramPage.jsx
**Commit:** 3138a5d
**Details:**
- Extracted RegLinkModal from DashboardPage (was inline function, lines 1719-1860) into shared component
- New component accepts: `isOpen`, `onClose`, `organization`, `seasons`, `defaultSeasonId`, `showToast`
- Added season selector dropdown inside modal — admin can pick which season's link to share
- Self-contained: if `seasons` prop not provided, component queries its own seasons on mount
- DashboardPage now imports shared component (same behavior, cleaner code)
- ProgramPage "Registration Link" button now opens full modal instead of silent clipboard copy
- ProgramPage passes `programSeasons` and `selectedProgramSeason` for context-aware defaults

## Issues Encountered
- DashboardPage does not receive `showToast` as a prop — the shared component uses optional chaining (`showToast?.()`) so this is handled gracefully. The original inline component also didn't use toasts.
- Build exits with code 1 due to chunk size warning (index.js > 500KB) — this is the standard Vite warning, not a build failure.
