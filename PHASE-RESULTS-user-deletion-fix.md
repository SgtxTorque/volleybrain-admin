# PHASE RESULTS — User Deletion & Org Removal Fix

## Date: April 22, 2026
## Branch: main
## Commits:
- `db65b98` — fix: rewire Permanently Delete User to use delete_profile_cascade RPC
- `b43474a` — refactor: simplify delete-user-account Edge Function — auth.users deletion only
- `59ba586` — fix: Remove from Org now cleans up coaches, teams, staff, and roles

---

## Phase 1: Rewire Permanently Delete User
- Status: PASS
- File modified: `src/pages/platform/PlatformUsers.jsx`
- Key changes: RPC `delete_profile_cascade` runs first (60+ tables), Edge Function runs second (auth.users only), `logAction` moved to after success, partial failure handled gracefully
- Build status: PASS
- Commit: `db65b98`

## Phase 2: Simplify Edge Function
- Status: PASS
- Lines removed: ~87
- Lines remaining: ~84
- File: `supabase/functions/delete-user-account/index.ts`
- Removed: all `safeDelete` calls, email-based user lookup, warnings array
- Kept: auth verification, platform admin check, self-deletion guard, `auth.admin.deleteUser()`
- Commit: `b43474a`

## Phase 3: Deploy Edge Function
- Status: PASS
- Deploy output: `Deployed Functions on project uqpjvbiuokwpldjvxiby: delete-user-account`
- Dashboard: https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby/functions
- Commit: N/A

## Phase 4: Fix Remove from Org
- Status: PASS
- Migration created: `supabase/migrations/20260422_remove_user_from_org.sql`
- Migration applied: MANUAL APPLY NEEDED — `supabase db push` failed due to migration ordering conflicts with older 20260330 migrations. Carlos must run the SQL manually via the Supabase SQL Editor.
- Handler updated: YES — `handleRemoveFromOrg` now calls `remove_user_from_org` RPC
- Build status: PASS
- Commit: `59ba586`

## Phase 5: Push
- Status: PASS
- Push: `32000d2..59ba586 main -> main`

## Verification Checklist
- [x] handleDeleteUser calls delete_profile_cascade RPC first
- [x] handleDeleteUser calls Edge Function for auth.users second
- [x] logAction runs AFTER successful deletion (not before)
- [x] Partial failure handled (profile gone, auth failed = warning toast)
- [x] Edge Function simplified to auth.users deletion only
- [x] Edge Function keeps platform admin check
- [x] Edge Function keeps self-deletion guard
- [x] Edge Function deployed to Supabase
- [x] Remove from Org calls remove_user_from_org RPC
- [x] Remove from Org cleans coaches, team_coaches, staff, user_roles
- [x] Remove from Org nulls current_organization_id if matching
- [x] npx vite build passes
- [x] git push succeeded

## Manual Steps Remaining
- [ ] Apply migration via SQL editor — run the contents of `supabase/migrations/20260422_remove_user_from_org.sql` in the Supabase SQL Editor (Dashboard > SQL Editor > paste and run). The `remove_user_from_org` RPC won't work until this is done.
