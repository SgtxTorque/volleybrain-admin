# CC-INVESTIGATE-TM-ADMIN-FALLBACK.md
## Investigation: TM Accounts Still Showing Admin Dashboard

**Symptom:** After fixing SetupWizard.jsx to assign `role: 'team_manager'` instead of `league_admin`, newly created TM accounts STILL land on the admin dashboard. Season creation still fails with 400.

**Two accounts were created and both show admin view.**

---

## RULES

1. DO NOT WRITE CODE. DO NOT MODIFY FILES.
2. Quote exact file paths and line numbers.
3. Trace the FULL flow from signup → onboarding → role detection → dashboard routing.

---

## INVESTIGATION TASKS

### Task 1: Verify the SetupWizard fix actually deployed

Read `src/pages/auth/SetupWizard.jsx`. Confirm:
- Line ~164: Is the role now `'team_manager'` or still `'league_admin'`?
- Line ~153: Is `type: 'independent_team'` removed?
- Quote the exact code.

### Task 2: Check if there are OTHER code paths that create user_roles

The SetupWizard might not be the only place roles are created. Search comprehensively:

```bash
grep -rn "user_roles.*insert\|insert.*user_roles\|from('user_roles')" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules
```

Check EVERY match. Are there other paths during signup/onboarding that insert `league_admin`?

Also check:
```bash
grep -rn "league_admin" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules
```

### Task 3: Trace the signup flow end to end

Starting from `src/pages/auth/LoginPage.jsx` (or wherever signup lives):
1. What happens after a user creates their account (signs up)?
2. What triggers the SetupWizard to appear?
3. When they select "Team Manager / Coach" and enter a team name, which function runs?
4. Does `createIndependentTeam()` actually execute, or does a different code path run?
5. After the wizard completes, what refreshes the auth context?

### Task 4: Check if the two test accounts have stale data

The two accounts Carlos created might have been created BEFORE the fix was deployed. Check:
- Is there a way the old `league_admin` role persists even after code changes? (Yes — database rows don't change when code changes)
- If the accounts were created with the OLD code, their `user_roles` entry says `league_admin` and that won't auto-update to `team_manager`

**This is likely the answer.** The fix only changes what FUTURE accounts get. Existing accounts already have `league_admin` in the database.

### Task 5: Check `loadRoleContext()` priority

Read `src/MainApp.jsx` `loadRoleContext()`:
- If a user has BOTH `league_admin` and `team_manager` in user_roles, which wins?
- Is `isAdmin` checked before `isTeamManager`?
- If `isAdmin = true`, does the code ever check `isTeamManager`?

### Task 6: Check the season creation 400 (still failing)

If the accounts were created with old code and have `role: 'league_admin'`, they should be able to create seasons as admins. The fact that season creation STILL fails suggests the `profiles.current_organization_id` update might not have worked, or there's a different issue.

Check `src/pages/auth/SetupWizard.jsx`:
- Is the `profiles.current_organization_id` update actually executing?
- Is it executing BEFORE or AFTER the onboarding_completed update?
- Could the two `profiles.update()` calls be racing each other? (There are two separate update calls — one for current_organization_id and one for onboarding data. The second one might overwrite the first if they both set different fields.)

Read the exact code and check if the two updates could conflict:
```javascript
// Update 1: profiles.current_organization_id
await supabase.from('profiles').update({ current_organization_id: org.id }).eq('id', user.id)

// Update 2: profiles.onboarding_completed + onboarding_data
await supabase.from('profiles').update({ onboarding_completed: true, onboarding_data: {...} }).eq('id', user.id)
```

Do these run sequentially (await) or could they race? If sequential, both should work. If the second one doesn't include `current_organization_id`, it shouldn't overwrite it (Supabase partial update). But verify.

### Task 7: Check if org insert is also failing

The org insert also had `type: 'independent_team'` which was flagged as an enum risk. If the fix removed it, confirm. If the org insert is failing silently (caught by try/catch and showing a generic error), that would cascade to everything downstream.

Check: does the error handling in `createIndependentTeam()` show the actual error message to the user, or does it show a generic toast?

---

## DELIVERABLE

Produce: `INVESTIGATION-TM-ADMIN-FALLBACK.md` with:

1. **SetupWizard fix status** — is the code actually changed?
2. **Other role insertion paths** — any other code that assigns league_admin?
3. **Stale data diagnosis** — are the test accounts using old data?
4. **loadRoleContext priority** — does admin always win over TM?
5. **Season 400 root cause** — why is it still failing?
6. **Recommended fix** — what exactly needs to happen for a NEW account to work as TM end-to-end
7. **Recommended cleanup** — what to do about the two existing test accounts

---

## CC PROMPT

```
Read CC-INVESTIGATE-TM-ADMIN-FALLBACK.md in the repo root.

DO NOT WRITE CODE. DO NOT MODIFY FILES.

Two newly created TM accounts are still showing as admin and season creation still fails. Trace the full signup → onboarding → role detection → dashboard flow. Find every reason this is broken.

Produce INVESTIGATION-TM-ADMIN-FALLBACK.md with findings and recommended fix.
```
