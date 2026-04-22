# PHASE RESULTS — User Deletion Hotfix

## Date: April 22, 2026
## Branch: main
## Commits:
- `c856b7c` — fix: correct RPC parameter name + fix org memberships display in slide-over

---

## Phase 1: Fix RPC parameter name
- Status: PASS
- Changed: `p_profile_id` → `profile_id` in `delete_profile_cascade` RPC call
- Also fixed remove_user_from_org params: N/A (those params match the SQL function signature already: `p_user_id`, `p_org_id`)
- Build status: PASS
- Commit: `c856b7c`

## Phase 2: Fix org memberships display
- Status: PASS
- Root cause: The slide-over query used `.order('created_at', { ascending: false })` but the `user_roles` table has no `created_at` column — it has `granted_at`. PostgREST returned a 400 error, making `rolesRes.data` null, which defaulted to `[]`, showing "No organization memberships" for ALL users.
- Fix: Changed `.order('created_at', ...)` to `.order('granted_at', ...)`
- Tables involved: `user_roles` (joined with `organizations`)
- Why main table worked: The main table query at line 590 loads ALL user_roles without `.order()`, so it never hit this error.
- Build status: PASS
- Commit: `c856b7c`

## Phase 3: Push
- Status: PASS

## Verification Checklist
- [x] delete_profile_cascade RPC uses parameter name `profile_id`
- [x] Org memberships display for users who have org roles
- [x] Remove from Org button visible when user has memberships
- [x] npx vite build passes
- [x] git push succeeded
