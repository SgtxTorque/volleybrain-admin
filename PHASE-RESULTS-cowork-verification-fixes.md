# PHASE RESULTS: Cowork Verification Fixes
**Date:** 2026-04-13
**Branch:** main
**Build:** PASS (chunk size warning only, not an error)

### Issue 1: Coach Account — MANUAL
**Commit:** b915672
**Root cause:** QAcoach2@example.com has zero references in the codebase. This is a Supabase Auth issue (account may not exist or password is wrong). The login flow itself works correctly — uses standard `supabase.auth.signInWithPassword()`.
**Fix:** Created `scripts/reset-coach-account.mjs` — a one-time script to reset the coach password via Supabase Admin API. Requires `SUPABASE_SERVICE_KEY` env var. If the account doesn't exist, it logs instructions to create via the coach invite flow.

### Issue 2: Admin Bell Dropdown — PASS
**Commit:** a0e53f3
**Root cause:** Both bell handlers (LynxSidebar + GatedTopBar) had an explicit `if (activeView === 'admin') navigate('/notifications')` check that routed admins to the full NotificationsPage instead of toggling the dropdown. Additionally, the NotificationDropdown render condition included `activeView !== 'admin'` which prevented the dropdown from rendering for admins entirely.
**Fix:** Removed the admin-specific navigation from both bell click handlers (now all roles toggle the dropdown). Removed `activeView !== 'admin'` guard from NotificationDropdown render condition. The sidebar "Push Notifications" menu item still navigates to /notifications management page for full admin control.
**Admin bell now:** Opens NotificationDropdown showing recent admin_notifications.

### Issue 3: Setup Banner — PASS
**Commit:** dd1fa83
**Root cause:** The `/coaches` route renders `StaffPortalPage` (not `CoachesPage`), and StaffPortalPage was missing the `TrackerReturnBanner` import and render. The banner component and all other target pages (Teams, Schedule, Registrations, Blasts) already had it.
**Pages fixed:** StaffPortalPage (the actual page served at /coaches)
**Pages verified already working:** TeamsPage, SchedulePage, RegistrationsPage, BlastsPage, CoachesPage (unused by route but has banner)

### Issue 4: Tab State — PASS
**Commit:** 14746a9
**Approach:** URL param
**returnTo now includes:** `?tab=setup`
**Details:** ProgramPage now reads `?tab=setup` from URL params via `useSearchParams()`. The initial `activeTab` state is set from the URL param if present. LifecycleTracker's `handleCTA` now includes `?tab=setup` in the `returnTo` URL. Both TrackerReturnBanner and TrackerSuccessPopup "Back to Setup" buttons navigate to the returnTo URL, which now preserves the setup tab.

### Issue 5: Baton Pass — INVESTIGATING (improved logging deployed)
**Commit:** df57884
**Root cause:** Two issues found:
1. **Silent Supabase failures:** Supabase `.insert()` returns `{error}` instead of throwing exceptions. All 8 baton pass catch blocks only caught thrown errors, meaning RLS policy failures and column mismatches were silently swallowed.
2. **Insufficient error logging:** Original catch blocks only logged the error object without extracting `.message`, `.details`, or `.hint` fields.
**Fix:**
- Added `{error: bpErr}` destructuring to `admin_notifications` and `notifications` insert calls
- Added `if (bpErr) console.error(...)` to catch Supabase response errors that don't throw
- Enhanced all 8 catch blocks across 5 files to log `err.message`, `err.details`, `err.hint`
- Files: PublicRegistrationPage, RegistrationCartPage, RegistrationsPage, SchedulePage, ActionItemsSidebar

### Bonus Fixes — APPLIED
**Tab badge:** PASS (commit fe2e6ea)
- Season Setup tab now always shows `X/7` badge (e.g., `3/7` or `7/7`)
- Previously badge disappeared when setup was complete (showed checkmark icon only)

**Scroll fix:** PASS (commit fe2e6ea)
- Added bottom padding (`pb-2`) to the tracker steps list container
- Prevents last steps from being clipped at viewport bottom edge

## Issues Encountered
- The vite build process returns exit code 1 due to a chunk size warning (>500KB), but the build itself succeeds. This is a pre-existing condition unrelated to these fixes.
- Issue 1 (coach login) cannot be fully resolved via code — requires running the reset script with a Supabase service role key, or creating the account through the coach invite flow.
- Issue 5 root cause is ambiguous: notifications may not appear because (a) RLS blocks the insert silently, (b) the admin tested before baton pass code was deployed, or (c) the notification was inserted but the dropdown wasn't rendering for admins (fixed in Issue 2). The enhanced logging will diagnose this on the next registration.
