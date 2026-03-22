# INVESTIGATION-TM-SETUP-FIX.md
## Root Cause Analysis: TM Setup Wizard — Season Creation 400 Error

**Symptom:** `POST /rest/v1/seasons?select=* 400 (Bad Request)`
**Date:** March 19, 2026

---

## 1. ROOT CAUSE

**There are 3 compounding issues, any of which can cause the 400:**

### Root Cause A: Missing `profiles.current_organization_id` Update (CRITICAL)

The mobile's working flow explicitly updates `profiles.current_organization_id` **BEFORE** creating the season:

```javascript
// Mobile — step 3 of createTeamManagerSetup (line 115-118)
await supabase
  .from('profiles')
  .update({ current_organization_id: org.id })
  .eq('id', data.userId);
```

The web's **SetupWizard** (`src/pages/auth/SetupWizard.jsx:168-177`) does NOT update `current_organization_id` — it only updates `onboarding_completed` and `onboarding_data`.

The web's **TeamManagerSetup** (`src/pages/team-manager/TeamManagerSetup.jsx`) also does NOT update it.

**Why this matters:** The existing RLS policies in `001_enable_rls.sql` (lines 11-37) all use:
```sql
SELECT organization_id FROM profiles WHERE id = auth.uid()
```
If `profiles.current_organization_id` is NULL (or points to a different org), any downstream table with RLS scoped through seasons → organization_id → profiles will reject the insert.

### Root Cause B: Wrong Insert Order (CRITICAL)

The mobile creates `user_roles` **BEFORE** the season insert. The web creates it **AFTER**.

| Step | Mobile (working) | Web (broken) |
|------|-----------------|-------------|
| 1 | Create org | Create org (if needed) |
| 2 | **Create user_roles** | Find/create sport |
| 3 | **Update profiles.current_organization_id** | **Create season** ← 400 HERE |
| 4 | Create season | Create team |
| 5 | Create team | Create team_staff |
| 6 | Create team_staff | **Create user_roles** ← TOO LATE |
| 7 | Create invite code | Create invite code |

When the web's season insert runs at step 3, the user has:
- ❌ No `user_roles` entry for `role: 'team_manager'` in the new org (only `league_admin` from SetupWizard)
- ❌ No `profiles.current_organization_id` pointing to the new org

### Root Cause C: `sport_id` vs `sport` Column Mismatch (LIKELY CONTRIBUTOR)

The `seasons` table has **both** columns (confirmed in `SUPABASE_SCHEMA.md` lines 102 and 120):
- `sport_id` — uuid FK → `sports.id`
- `sport` — text

| | Mobile | Web |
|---|--------|-----|
| Column used | `sport` (text: `'volleyball'`) | `sport_id` (uuid FK) |
| Sports table | **NOT used** | Queries/inserts into `sports` table |

The web's approach requires:
1. Finding or creating a `sports` record → getting `sportId`
2. The `sports` table has `organization_id` (uuid) — web's insert **does not include it**
3. If `sports.organization_id` has NOT NULL constraint, the sports insert fails with 400 (on sports, not seasons)
4. If sports RLS is enabled, the query might return no results and the insert might fail

Even if sports works, using `sport_id` adds a dependency on the `sports` table that mobile avoids entirely.

---

## 2. SIDE-BY-SIDE TABLE: Mobile vs Web Insert Payloads

### organizations

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| name | `data.teamName` | `teamName + ' Club'` | ⚠️ Different naming |
| slug | `generateSlug(data.teamName)` | custom slug | OK (different format, both valid) |
| is_active | `true` | not sent | ⚠️ Mobile sends, web doesn't |
| type | not sent | `'club'` | ⚠️ Web sends, mobile doesn't |
| settings | not sent | `{}` | ⚠️ Web sends, mobile doesn't |

**Risk:** `type` is `USER-DEFINED` (PostgreSQL enum). If `'club'` is not a valid enum value, the org insert fails. Mobile avoids this by not sending `type` at all. The web's SetupWizard uses `type: 'independent_team'`.

### user_roles

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| user_id | ✓ | ✓ | Same |
| organization_id | ✓ | ✓ | Same |
| role | `'team_manager'` | `'team_manager'` | Same |
| is_active | `true` | `true` | Same |
| **Insert order** | **Step 2 (before season)** | **Step 6 (after everything)** | ❌ CRITICAL |

### profiles update

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| current_organization_id | `org.id` | **NOT UPDATED** | ❌ CRITICAL |
| **Insert order** | **Step 3 (before season)** | **N/A** | ❌ CRITICAL |

### seasons

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| organization_id | ✓ | ✓ | Same |
| name | ✓ | ✓ | Same |
| start_date | ✓ | ✓ | Same |
| end_date | ✓ | ✓ | Same |
| status | `'active'` | `'active'` | Same |
| sport | `data.sport.toLowerCase()` | **not sent** | ❌ MISMATCH |
| sport_id | **not sent** | `sportId` (uuid) | ❌ MISMATCH |

### sports (web only — mobile doesn't use this table)

| Column | Web sends | Schema has | Issue? |
|--------|-----------|------------|--------|
| name | ✓ | ✓ | OK |
| icon | ✓ | ✓ | OK |
| organization_id | **not sent** | ✓ (uuid) | ⚠️ Missing — could be NOT NULL |

### teams

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| name | ✓ | ✓ | Same |
| season_id | ✓ | ✓ | Same |
| age_group | ✓ | ✓ | Same |
| max_players | `20` | **not sent** | ⚠️ Mobile sends, web doesn't |
| color | **not sent** | ✓ (hex string) | ⚠️ Web sends, mobile doesn't |
| is_active | **not sent** | `true` | ❌ Column may not exist (not in schema) |

### team_staff

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| team_id | ✓ | ✓ | Same |
| user_id | ✓ | ✓ | Same |
| staff_role | `'team_manager'` | `'team_manager'` | Same |
| is_active | `true` | `true` | Same |

### team_invite_codes

| Column | Mobile | Web | Mismatch? |
|--------|--------|-----|-----------|
| code | ✓ | ✓ | Same |
| team_id | ✓ | ✓ | Same |
| is_active | `true` | `true` | Same |
| max_uses | `30` | **not sent** | ⚠️ Missing |
| current_uses | `0` | **not sent** | ⚠️ Missing |
| created_by | `data.userId` | **not sent** | ⚠️ Missing |
| created_at | **not sent** (DB default) | `new Date().toISOString()` | ⚠️ Unnecessary |

---

## 3. RLS ANALYSIS

### Tables WITH RLS (from `001_enable_rls.sql`)

| Table | RLS | INSERT Policy |
|-------|-----|--------------|
| teams | ✓ | `season_id IN (SELECT id FROM seasons WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))` |
| players | ✓ | Same pattern |
| schedule_events | ✓ | Same pattern |
| payments | ✓ | Same pattern |
| messages | ✓ | Same pattern |
| notifications | ✓ | Direct `organization_id` check |
| notification_templates | ✓ | Direct `organization_id` check |

### Tables WITHOUT RLS in migration files

| Table | RLS in code? | Could have RLS in Supabase dashboard? |
|-------|-------------|--------------------------------------|
| **seasons** | ❌ No | ⚠️ Possibly — cannot confirm from code |
| **organizations** | ❌ No | ⚠️ Possibly |
| **sports** | ❌ No | ⚠️ Possibly |
| user_roles | ❌ No | ⚠️ Possibly |
| team_staff | ❌ No | ⚠️ Possibly |

### RLS dependency chain

All existing RLS policies depend on: `profiles.current_organization_id` (referenced as `profiles.organization_id` in SQL — may be the same column or an alias).

If `seasons` has RLS enabled in Supabase dashboard (not visible in code), the INSERT policy would likely check:
```sql
organization_id IN (
  SELECT current_organization_id FROM profiles WHERE id = auth.uid()
)
```

**Since the web never updates `profiles.current_organization_id` for new TMs, this check would fail.**

### Required insert order for RLS to pass

1. Create organization ← must exist for FK
2. Create user_roles ← must exist for role-scoped policies
3. Update `profiles.current_organization_id` ← must match for org-scoped policies
4. Create season ← can now pass RLS checks
5. Create team ← RLS checks `season_id → seasons → organization_id → profiles`
6. Create team_staff
7. Create invite code

---

## 4. THE `profiles.current_organization_id` GAP

### Web's onboarding flow trace

1. User signs up → `SetupWizard` runs
2. User selects "Team Manager / Coach" role
3. `createIndependentTeam()` (`SetupWizard.jsx:138-191`):
   - Creates org with `type: 'independent_team'`
   - Creates `user_roles` with `role: 'league_admin'` (NOT `team_manager`)
   - Updates `profiles.onboarding_completed = true`
   - **Does NOT update `profiles.current_organization_id`**
4. `completeOnboarding()` → `AuthContext.init()` runs
5. `init()` queries `user_roles` → finds `league_admin` → fetches org → sets `organization` in React state
6. MainApp loads → `loadRoleContext()` → `isAdmin = true`, `activeView = 'admin'`

**Problem:** The user is now routed to the ADMIN dashboard, not the TM dashboard. `isTeamManager` is false because:
- `team_staff` query returns empty
- `user_roles` has `role: 'league_admin'`, not `role: 'team_manager'`

**So the TM Setup Wizard is unreachable through normal onboarding!** It would only be reached if someone manually assigns `role: 'team_manager'` in `user_roles`.

### What the mobile does differently

```javascript
// Mobile step 3 (line 115-118):
await supabase
  .from('profiles')
  .update({ current_organization_id: org.id })
  .eq('id', data.userId);
```

This ensures the database row for `profiles` has the correct org, so all downstream RLS checks pass.

### Impact on web

The web's `AuthContext` does query the org from `user_roles` and set it in React state (line 88-89). So `organization?.id` in the React app is correct. But the **database** column `profiles.current_organization_id` is still NULL or points to a previous org.

Since RLS runs on the **database server**, it checks the **database column**, not the React state. This is the gap.

---

## 5. RECOMMENDED FIX

### Fix 1: Match mobile's insert order + add profiles update

In `src/pages/team-manager/TeamManagerSetup.jsx` function `handleCreate()`:

```javascript
// CURRENT (broken) order:
// 1. Create org → 2. Find/create sport → 3. Create season → 4. Create team → 5. Create staff → 6. Create user_roles → 7. Create invite code

// FIXED order (match mobile):
// 1. Create org (if needed)
// 2. Create user_roles (if not exists)     ← MOVE UP
// 3. Update profiles.current_organization_id ← ADD
// 4. Create season (use `sport` text, not `sport_id`)  ← CHANGE COLUMN
// 5. Create team (remove `is_active`, add `max_players`) ← FIX COLUMNS
// 6. Create team_staff
// 7. Create invite code
```

### Fix 2: Use `sport` text column instead of `sport_id`

Replace the sports table lookup with a simple text value:

```javascript
// REMOVE: Find or create sport section (lines 122-143)
// CHANGE seasons insert to use `sport` text column:
const { data: newSeason, error: seasonError } = await supabase
  .from('seasons')
  .insert({
    organization_id: orgId,
    sport: sport.toLowerCase(),  // ← text, not sport_id UUID
    name: seasonName.trim(),
    start_date: startDate,
    end_date: endDate,
    status: 'active',
  })
  .select()
  .single()
```

### Fix 3: Fix the org insert payload

Match mobile — don't send `type` (avoid enum issues) or `settings`:

```javascript
// CURRENT:
{ name: teamName.trim() + ' Club', slug, type: 'club', settings: {} }

// FIXED (match mobile):
{ name: teamName.trim(), slug, is_active: true }
```

### Fix 4: Fix the teams insert payload

Remove `is_active` (not in schema), add `max_players`:

```javascript
// CURRENT:
{ season_id, name, color, age_group, is_active: true }

// FIXED:
{ season_id, name, color, age_group, max_players: 20 }
```

### Fix 5: Fix the invite code payload

Add missing columns that mobile sends:

```javascript
// CURRENT:
{ team_id, code, is_active: true, created_at: new Date().toISOString() }

// FIXED (match mobile):
{ team_id, code, is_active: true, max_uses: 30, current_uses: 0, created_by: profile.id }
```

### Fix 6: SetupWizard should also update `profiles.current_organization_id`

In `src/pages/auth/SetupWizard.jsx` function `createIndependentTeam()`, after creating the org and user_roles, add:

```javascript
await supabase
  .from('profiles')
  .update({ current_organization_id: org.id })
  .eq('id', user.id)
```

---

## 6. RISK ASSESSMENT

| Fix | Risk | Impact |
|-----|------|--------|
| Reorder inserts | ✅ None — just reordering existing operations | Low |
| Add profiles update | ✅ None — adds a missing step that mobile already does | Low |
| Use `sport` text instead of `sport_id` | ⚠️ Low — `sport` column exists and mobile uses it successfully. `sport_id` will be NULL for TM-created seasons (same as mobile). Web's `SeasonContext` queries `sports(id, name, icon, color_primary)` via the FK — TM seasons won't have this join data, but that's OK since the text `sport` column has the name. | Low-Medium |
| Remove `type: 'club'` from org | ⚠️ Low — mobile doesn't send it. If no `type` is needed, let DB use its default. | Low |
| Remove `is_active` from teams | ✅ None — column doesn't exist in schema | Low (fixes a silent issue) |
| Fix invite code columns | ✅ None — adds missing data fields | Low |
| SetupWizard profiles update | ⚠️ Low — existing admins already have `current_organization_id` set from other flows | Low |

**Will fixing this break anything else?**
- No existing functionality depends on the TM Setup Wizard (it's new code)
- The org/season/team/staff inserts match the mobile's proven pattern
- The `profiles.current_organization_id` update aligns web with mobile's behavior
- The `sport` text column is already used by mobile and exists in the schema

---

## 7. TABLES USED BY TM SETUP

| Table | Operation | Status |
|-------|-----------|--------|
| organizations | INSERT (new org) | ⚠️ `type: 'club'` may not be valid enum |
| user_roles | SELECT + INSERT | ⚠️ Created too late in web flow |
| profiles | **NOT UPDATED** | ❌ Missing `current_organization_id` |
| sports | SELECT + INSERT | ⚠️ Web uses this, mobile doesn't |
| seasons | INSERT | ❌ 400 error — likely from missing profile/role setup |
| teams | INSERT | ⚠️ `is_active` column doesn't exist in schema |
| team_staff | INSERT | ✅ OK |
| team_invite_codes | INSERT | ⚠️ Missing `max_uses`, `current_uses`, `created_by` |

---

## 8. SUMMARY

**The 400 on seasons is most likely caused by the combination of:**
1. `profiles.current_organization_id` not being set → RLS (if enabled on seasons) rejects the insert
2. `user_roles` not yet existing for the org when season insert runs → role-based checks fail
3. Possibly: `sport_id` FK issues if the sports table has RLS or org-scoping constraints

**The fix is to match the mobile's proven insert order and column usage exactly.** The mobile's `createTeamManagerSetup` function has been tested and works. The web should mirror it.
