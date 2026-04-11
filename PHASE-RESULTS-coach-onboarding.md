# PHASE RESULTS: Coach Onboarding Pipeline Fix
**Date:** 2026-04-11
**Branch:** main
**Build:** PASS — 12.78s, 1881 modules

## Phase Results

### Phase 1: CoachJoinPage + Route — PASS
**Files created:** src/pages/public/CoachJoinPage.jsx
**Files changed:** src/App.jsx
**Commit:** 9c96f5a
**Notes:** Used `invite_email` column (not `email`) for coach lookup — matches InviteCoachModal's insert column.

### Phase 2: Prevent Broken Fallback URL — PASS
**Files changed:** src/pages/coaches/InviteCoachModal.jsx
**Commit:** 0f4472b
**Notes:** Changed error handling to return early with error toast if coaches insert fails. Uses `setSending(false)` (not `setSubmitting` as spec suggested — matched actual state variable name).

### Phase 3: Wizard Coaches Table Lookup — PASS
**Files changed:** src/pages/auth/SetupWizard.jsx
**Commit:** e40fff8
**Notes:** Added `.toLowerCase()` to invite code query since codes are stored as lowercase hex but wizard uppercases user input. Redirects to `/invite/coach/:code` instead of duplicating acceptance logic.

### Phase 4: OAuth Button Feature Flags — PASS
**Files changed:** src/config/feature-flags.js, src/pages/auth/LoginPage.jsx
**Commit:** f51426e
**Notes:** Both `googleOAuth` and `appleOAuth` flags default to `false`. Divider ("or continue with email") also hidden when both OAuth buttons are hidden. CoachInviteAcceptPage does NOT show OAuth buttons — no changes needed there.

## Issues Encountered

1. **Column name mismatch (Phase 1):** Spec suggested `.eq('email', ...)` but `coaches` table uses `invite_email` for the email column populated during invite creation.
2. **State variable name (Phase 2):** Spec used `setSubmitting` but actual code uses `setSending` — adapted to match existing code.
3. **Case sensitivity (Phase 3):** Coach invite codes are lowercase hex (from `crypto.randomUUID().replace(/-/g, '').slice(0, 16)`), but wizard uppercases input. Added `.toLowerCase()` to the query.
4. **Build exit code (all phases):** `npx vite build` returns exit code 1 due to chunk size warning (>500KB). This is a pre-existing condition — builds complete successfully.
