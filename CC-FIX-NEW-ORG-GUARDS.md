# CC-FIX-NEW-ORG-DEFENSIVE-GUARDS.md

## Overview
After fixing the auth session bug, this spec adds defensive guards to prevent the cascade of issues that new organizations hit: orphaned role records, null season on team creation, and overly complex RLS policies.

**Run this spec AFTER CC-FIX-AUTH-SESSION.md is deployed and verified.**

## Fix 1: Null Guard on Team Creation

**File:** `src/pages/teams/TeamsPage.jsx`

Find the `createTeam` function. At the very top of the function (before the try block), add a null guard:

```javascript
async function createTeam(formData) {
    // Guard: require a selected season before creating a team
    if (!selectedSeason?.id) {
      showToast('Please select or create a season before adding teams.', 'error')
      return
    }

    try {
      // ... rest of the function
```

This prevents the silent failure when `selectedSeason` is null/undefined. Instead of sending `season_id: undefined` to Supabase (which returns a cryptic error), the user gets a clear message telling them what to do.

## Fix 2: Fix user_roles RLS SELECT Policy

**Run this SQL in the Supabase SQL Editor:**

The current "Users can view roles in their org" policy uses a subquery on `profiles.current_organization_id` which can mismatch with the user's actual roles. Replace it with a simpler policy that lets users always see their own roles:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view roles in their org" ON user_roles;

-- Replace with a simpler policy: users can see their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
```

This is safer because:
- A user can always see their own role records regardless of `current_organization_id`
- No subquery on `profiles` that could trigger RLS recursion
- The platform admin policy still covers cross-org admin access

## Fix 3: Add FK Constraint on user_roles.organization_id

**Run this SQL in the Supabase SQL Editor:**

First check if the FK already exists:

```sql
SELECT conname FROM pg_constraint 
WHERE conrelid = 'user_roles'::regclass 
AND confrelid = 'organizations'::regclass;
```

If nothing is returned, add the constraint:

```sql
-- First, delete any orphaned user_roles pointing to non-existent orgs
DELETE FROM user_roles 
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- Then add the FK constraint with CASCADE delete
ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_organization 
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;
```

The `ON DELETE CASCADE` means if an org is deleted, the user_roles for that org are automatically cleaned up — no more orphaned records.

## Fix 4: Clean Up the Test User's Orphaned Data

**Run this SQL in the Supabase SQL Editor:**

The test user `qatestdirector2026@gmail.com` has a `user_roles` record pointing to a non-existent org, and their `current_organization_id` points to Carlos's org. Clean it up:

```sql
-- Check the test user's current state
SELECT p.id, p.email, p.current_organization_id, ur.organization_id as role_org_id
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'qatestdirector2026@gmail.com';

-- Delete orphaned user_roles (org doesn't exist)
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'qatestdirector2026@gmail.com')
AND organization_id NOT IN (SELECT id FROM organizations);

-- Reset their profile so they can re-onboard
UPDATE profiles 
SET current_organization_id = NULL, 
    onboarding_completed = false,
    onboarding_data = NULL
WHERE email = 'qatestdirector2026@gmail.com';
```

After this, the test user can sign back in and go through the setup wizard again cleanly.

## Fix 5: Add Season Null Guard on Schedule Event Creation Too

**File:** `src/pages/schedule/SchedulePage.jsx`

Find the event creation function and add the same null guard pattern:

```javascript
// At the top of the create event function
if (!selectedSeason?.id) {
  showToast('Please select or create a season first.', 'error')
  return
}
```

Search for similar patterns in other pages that insert records with `season_id` — any page that creates data linked to a season should have this guard.

## Verification

1. `npm run build` — zero errors
2. Run the SQL migrations in order (Fix 2, Fix 3, Fix 4)
3. Log in as the test user (`qatestdirector2026@gmail.com`) — should see the setup wizard again
4. Complete the wizard → create org → create season → create team → all should succeed
5. Hard refresh at any point — should stay logged in (auth fix from previous spec)
6. Log in as Carlos — confirm Black Hornets Athletics still works normally (no regressions)

## Commit (for the code changes only — SQL runs separately)
```
git add src/pages/teams/TeamsPage.jsx src/pages/schedule/SchedulePage.jsx
git commit -m "[fix] Add season null guards on team and event creation, prevent silent failures"
```
