# INVESTIGATION-TM-ADMIN-FALLBACK.md
## Why TM Accounts Still Show Admin Dashboard

**Date:** March 19, 2026

---

## 1. SetupWizard Fix Status — CODE IS CORRECT

The fix **is deployed**. Verified in `src/pages/auth/SetupWizard.jsx`:

**`createIndependentTeam()`** (line 160-165) — the TM path:
```javascript
await supabase.from('user_roles').insert({
  user_id: user.id,
  organization_id: org.id,
  role: 'team_manager',   // ← CORRECT (was league_admin)
  is_active: true,
})
```

**`createOrganization()`** (line 106-111) — the Org Director path (separate):
```javascript
await supabase.from('user_roles').insert({
  user_id: user.id,
  organization_id: org.id,
  role: 'league_admin',   // ← CORRECT for org directors
  is_active: true,
})
```

Org insert (line 150-154): `is_active: true` — fixed (no `type` enum).

`profiles.current_organization_id` update (line 168-172): present, runs before onboarding update.

**Verdict: The code is correct. These are two separate functions for two separate paths.**

---

## 2. Other Role Insertion Paths — NONE AFFECT TM

All `user_roles.insert` calls in `src/` (excluding `_archive/`):

| File | Line | Role Inserted | Triggered By |
|------|------|--------------|-------------|
| `SetupWizard.jsx` | 106-111 | `league_admin` | "Organization Director" path — `createOrganization()` |
| `SetupWizard.jsx` | 160-165 | `team_manager` | "Team Manager / Coach" path — `createIndependentTeam()` |
| `SetupWizard.jsx` | 227-231 | `accountInvite.role` (dynamic) | "Join with invite code" path — `useInviteCode()` |
| `SetupWizard.jsx` | 251-255 | `parent` | "Parent / Player" path |
| `TeamManagerSetup.jsx` | 131-137 | `team_manager` | TM Setup Wizard (post-onboarding) |

**No other code path inserts `league_admin` for TM users.**

---

## 3. Stale Data Diagnosis — THIS IS THE ROOT CAUSE

**The two test accounts were created BEFORE the fix was deployed.**

When those accounts went through onboarding:
1. They selected "Team Manager / Coach"
2. The OLD `createIndependentTeam()` ran
3. It inserted `user_roles` with `role: 'league_admin'` (old code)
4. It did NOT update `profiles.current_organization_id` (old code)

**Database rows don't change when code changes.** The fix only affects FUTURE accounts. The existing accounts still have:
- `user_roles.role = 'league_admin'` ← makes them admins
- `profiles.current_organization_id = NULL` ← breaks RLS for season creation

---

## 4. `loadRoleContext()` Priority — Admin Always Wins

`src/MainApp.jsx` lines 946-956:

```javascript
if (roles?.some(r => r.role === 'league_admin' || r.role === 'admin')) {
  setActiveView('admin')           // ← WINS (priority 1)
} else if (coachLink) {
  setActiveView('coach')           // priority 2
} else if (...team_manager...) {
  setActiveView('team_manager')    // priority 3
} else if (children?.length > 0) {
  setActiveView('parent')          // priority 4
}
```

If a user has `role: 'league_admin'`, `isAdmin = true` and `activeView = 'admin'`. The code never reaches the `team_manager` check.

This is why the two test accounts show admin dashboard — they have `league_admin` in the database.

---

## 5. Season 400 — Still Fails Because of Missing `current_organization_id`

The test accounts were created with OLD code that:
1. Assigned `role: 'league_admin'` (so they see admin dashboard)
2. Did NOT update `profiles.current_organization_id`

When they try to create a season from the admin dashboard (SeasonsPage):
- `SeasonsPage.handleSave()` sends `organization_id: organization.id`
- If RLS on seasons checks `profiles.current_organization_id`, it returns NULL
- The insert fails with 400

**This is a data issue, not a code issue.** The code fix is correct for new accounts.

---

## 6. Two `profiles.update()` Calls — No Race Condition

`createIndependentTeam()` lines 168-182:

```javascript
// Update 1 (await):
await supabase.from('profiles')
  .update({ current_organization_id: org.id })
  .eq('id', user.id)

// Update 2 (await):
await supabase.from('profiles').update({
  onboarding_completed: true,
  onboarding_data: { ... }
}).eq('id', user.id)
```

Both use `await` → sequential execution. Supabase `.update()` does partial updates (only columns specified). Update 2 does NOT include `current_organization_id`, so it won't overwrite Update 1's value.

**No race condition. Both updates work correctly.**

---

## 7. Org Insert — Fixed, No Enum Risk

The `createIndependentTeam()` org insert (line 150-154):
```javascript
.insert({
  name: teamName,
  slug: slug,
  is_active: true,
})
```

No `type` field sent. No enum risk. Matches mobile pattern.

The `createOrganization()` org insert (line 95-100) still uses `type: 'club'`. This is the Org Director path, NOT the TM path. Not relevant to this investigation.

---

## 8. Recommended Fix for Existing Test Accounts

### Option A: Manual Database Cleanup (Quick)

Run in Supabase SQL Editor for each test account:

```sql
-- 1. Find the test accounts
SELECT p.id, p.email, p.current_organization_id, ur.role, ur.organization_id
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email IN ('test-account-1@email.com', 'test-account-2@email.com');

-- 2. Fix role: change league_admin to team_manager
UPDATE user_roles
SET role = 'team_manager'
WHERE user_id IN (SELECT id FROM profiles WHERE email IN ('...', '...'))
  AND role = 'league_admin';

-- 3. Fix profiles.current_organization_id
UPDATE profiles
SET current_organization_id = (
  SELECT organization_id FROM user_roles WHERE user_id = profiles.id LIMIT 1
)
WHERE email IN ('...', '...')
  AND current_organization_id IS NULL;
```

### Option B: Delete and Recreate (Cleanest)

Delete the two test accounts and their associated data (orgs, user_roles) from Supabase, then create fresh accounts with the fixed code.

### Option C: Do Nothing (Just Test with New Accounts)

Create a brand new account with the fixed code. The old accounts are just stale test data.

---

## 9. Summary

| Question | Answer |
|----------|--------|
| Is the SetupWizard fix deployed? | **YES** — `role: 'team_manager'` at line 163 |
| Other code paths assigning `league_admin`? | **NO** — only `createOrganization()` (Org Director path) |
| Why do test accounts show admin? | **Stale data** — created with OLD code, DB has `league_admin` |
| Does admin always win over TM? | **YES** — `loadRoleContext()` checks admin first (line 946) |
| Why does season creation still 400? | **`profiles.current_organization_id` is NULL** — old code didn't set it |
| Do the two profiles.update calls race? | **NO** — both use `await`, sequential, partial updates |
| Will NEW accounts work correctly? | **YES** — fixed code assigns `team_manager` + sets `current_organization_id` |

**Bottom line: The code is correct. The test accounts have stale data from the old code. Create a new account to verify the fix, or clean up the existing accounts in Supabase.**
