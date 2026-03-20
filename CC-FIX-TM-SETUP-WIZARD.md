# CC-FIX-TM-SETUP-WIZARD.md
## Execution Spec: Fix TM Setup Wizard — Match Mobile Insert Pattern

**Date:** March 19, 2026
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `feat/desktop-dashboard-redesign`
**Prereq:** Read `INVESTIGATION-TM-SETUP-FIX.md` — that is the investigation report this fix is based on.

---

## WHAT THIS DOES

Fixes the TM Setup Wizard 400 error by matching the mobile's proven insert order and column usage exactly. Also fixes the SetupWizard's `profiles.current_organization_id` gap.

---

## WHAT THIS DOES NOT DO

- Does NOT change the UI/layout of the setup wizard
- Does NOT modify any other page or component
- Does NOT touch RLS policies or database schema
- Does NOT change existing admin/coach setup flows

---

## RULES

1. Read every file before modifying.
2. Make the MINIMUM change. Follow the mobile's working pattern exactly.
3. Run `npm run build` after each phase. Zero errors.
4. Commit after each phase: `[fix] Phase X: description`
5. Do not refactor, restyle, or reorganize. Surgical fixes only.

---

## PHASE 1: Fix `TeamManagerSetup.jsx` — Rewrite `handleCreate()` insert order

**File:** `src/pages/team-manager/TeamManagerSetup.jsx`

Find the `handleCreate()` function. Replace the ENTIRE database operations section (from `let orgId = organization?.id` through the invite code creation) with this corrected flow.

**The new order must be:**

```
1. Create org (if needed)
2. Create user_roles for the org (if not exists) ← MOVED UP
3. Update profiles.current_organization_id      ← ADDED
4. Create season (use `sport` text, NOT sport_id) ← CHANGED
5. Create team (fix columns)                     ← FIXED
6. Create team_staff
7. Create invite code (fix columns)              ← FIXED
```

**Exact changes:**

### Step 1: Org creation — fix payload
Remove `type` and `settings`. Add `is_active`. Match mobile:

```javascript
const { data: newOrg, error: orgError } = await supabase
  .from('organizations')
  .insert({
    name: teamName.trim(),
    slug,
    is_active: true,
  })
  .select()
  .single()
```

Note: org name is just the team name (no " Club" suffix). Match mobile.

### Step 2: Create user_roles IMMEDIATELY after org (before any other inserts)

```javascript
// Create user_role for this org (must happen before season/team for RLS)
const { data: existingRole } = await supabase
  .from('user_roles')
  .select('id')
  .eq('user_id', profile.id)
  .eq('organization_id', orgId)
  .eq('role', 'team_manager')
  .maybeSingle()

if (!existingRole) {
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: profile.id,
    organization_id: orgId,
    role: 'team_manager',
    is_active: true,
  })
  if (roleError) throw roleError
}
```

### Step 3: Update profiles.current_organization_id (NEW — mobile does this, web didn't)

```javascript
// Update profile's current org so RLS policies pass
await supabase
  .from('profiles')
  .update({ current_organization_id: orgId })
  .eq('id', profile.id)
```

### Step 4: Create season — use `sport` text column, NOT `sport_id`

REMOVE the entire "Find or create sport" section (the block that queries/inserts into the `sports` table and sets `sportId`). Replace the seasons insert with:

```javascript
const { data: newSeason, error: seasonError } = await supabase
  .from('seasons')
  .insert({
    organization_id: orgId,
    sport: sport.toLowerCase(),
    name: seasonName.trim(),
    start_date: startDate,
    end_date: endDate,
    status: 'active',
  })
  .select()
  .single()

if (seasonError) throw seasonError
```

### Step 5: Create team — fix columns

Remove `is_active` (doesn't exist in schema). Add `max_players`:

```javascript
const { data: newTeam, error: teamError } = await supabase
  .from('teams')
  .insert({
    season_id: newSeason.id,
    name: teamName.trim(),
    color: teamColor,
    age_group: ageGroup,
    max_players: 20,
  })
  .select()
  .single()

if (teamError) throw teamError
```

### Step 6: Create team_staff — no changes needed, this is correct

### Step 7: Create invite code — fix columns

```javascript
try {
  const code = generateCode()
  await supabase.from('team_invite_codes').insert({
    team_id: newTeam.id,
    code,
    is_active: true,
    max_uses: 30,
    current_uses: 0,
    created_by: profile.id,
  })
  setInviteCode(code)
} catch {
  // team_invite_codes table may not exist — graceful fallback
  setInviteCode(null)
}
```

### What to remove

- Remove the entire "Find or create sport" block (the `existingSport` query and `newSport` insert)
- Remove any `sportId` variable and references
- Remove the old `user_roles` creation block if it appears later in the function (it's now at step 2)
- Remove `type: 'club'` and `settings: {}` from org insert
- Remove `is_active: true` from teams insert
- Remove `created_at: new Date().toISOString()` from invite code insert

**Commit:** `[fix] Phase 1: rewrite TM setup insert order — match mobile pattern`

---

## PHASE 2: Fix `SetupWizard.jsx` — Add `profiles.current_organization_id` update

**File:** `src/pages/auth/SetupWizard.jsx`

Find the `createIndependentTeam()` function (around line 138). After the org is created and user_roles is inserted, but BEFORE setting `onboarding_completed`, add:

```javascript
// Update profile with current org (required for RLS)
await supabase
  .from('profiles')
  .update({ current_organization_id: org.id })
  .eq('id', user.id)
```

This fixes the gap for ANY user going through the SetupWizard, not just TMs. Admin users who create orgs through the wizard also need this.

**Do NOT change anything else in SetupWizard.** Do not change the role it creates (`league_admin`). That's a separate issue for a future spec.

**Commit:** `[fix] Phase 2: add profiles.current_organization_id update to SetupWizard`

---

## PHASE 3: Verification

Run the build:
```bash
npm run build
```

**Report:**
```
## TM SETUP FIX VERIFICATION

### Build: PASS / FAIL
### Files changed: [list]
### Lines changed: [count]

### Insert order now matches mobile: YES / NO
### profiles.current_organization_id update added: YES / NO
### sport text column used (not sport_id): YES / NO
### sports table no longer queried: YES / NO
### teams.is_active removed: YES / NO
### invite code columns fixed: YES / NO

### Unexpected issues: NONE / [describe]
```

**Commit:** `[fix] Phase 3: verification complete`

---

## CC PROMPT

```
Read CC-FIX-TM-SETUP-WIZARD.md in the repo root. Also read INVESTIGATION-TM-SETUP-FIX.md for the full root cause analysis.

This is a targeted fix for the TM Setup Wizard 400 error. The root cause is 3 compounding issues: wrong insert order, missing profiles.current_organization_id update, and sport_id vs sport column mismatch.

Execute Phases 1 through 3. The fix matches the mobile app's proven working pattern exactly.

CRITICAL: Do not change UI, layout, or styling. Only fix the database operations order and column payloads. Do not touch any file other than TeamManagerSetup.jsx and SetupWizard.jsx.
```
