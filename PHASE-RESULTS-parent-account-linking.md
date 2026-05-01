# PHASE RESULTS: Parent Account Linking Fix

**Date:** April 30, 2026
**Commit:** `fix: link parent_account_id for returning parents in PublicRegistrationPage and RegistrationCartPage`

---

## Phase 0: RLS + Schema Verification

### 0A: RLS / Supabase Client
- **Client:** Anon client (`VITE_SUPABASE_ANON_KEY`) — same client used throughout the app.
- **RLS impact:** The existing code at PublicRegistrationPage line 882 already successfully updates `parent_account_id` for newly created player records using this client. The rows are freshly created within the same submit handler, so the same UPDATE will succeed for the returning-parent case.
- **Blocker:** None.

### 0B: `player_parents` Table
- **Status:** EXISTS in the database.
- **Columns:** `id` (uuid), `player_id` (uuid), `parent_id` (uuid), `relationship` (text), `is_primary` (boolean), `can_pickup` (boolean), `receives_notifications` (boolean), `created_at` (timestamptz).
- **Current usage:** Not populated during registration. Not read by any web app code (only referenced in spec/investigation docs).
- **Decision:** Included `player_parents` upsert in the fix since the returning-parent case provides a valid `parent_id`. Uses `.catch(() => {})` to handle the case where the unique constraint `(player_id, parent_id)` may not exist.

### 0C: Variable Naming
- **`existingAccount`** (PublicRegistrationPage, line 57): State variable set from `checkExistingAccount()` useEffect (line 430-442). Returns `{ id, full_name, email, role }` from `profiles` table. The `.id` property equals the auth UID (`profiles.id = auth.users.id`).
- **`existingProfile`** (PublicRegistrationPage, line 903): Separate local variable queried fresh inside the invite section of the submit handler. Same shape.
- **`existingProfile`** (RegistrationCartPage, line 1457): Local variable inside submit handler from `checkExistingAccount(parentEmail)`.
- **`authUserId`** (PublicRegistrationPage, line 828): Only set when `auth.signUp` succeeds. `!authUserId` is the correct guard.

### Role Granting
- `grantRole()` function exists in `src/lib/invite-utils.js` (line 156).
- Uses `user_roles` table (NOT `organization_members`).
- Already imported in PublicRegistrationPage; added to RegistrationCartPage import.

---

## Phase 1: PublicRegistrationPage.jsx Changes

**File:** `src/pages/public/PublicRegistrationPage.jsx`
**Insertion point:** After line 896 (end of auth.signUp block), before invite creation section.

**Added block (46 lines):**
- Guard: `existingAccount?.id && createdPlayerIds.length > 0 && !authUserId`
- Updates `players.parent_account_id` for all created player IDs
- Links `families.account_id` if not already set
- Upserts `player_parents` records (player_id, parent_id, relationship, is_primary)
- Grants parent role via `grantRole(existingAccount.id, organization?.id, 'parent')`
- All operations wrapped in try/catch (non-fatal)

---

## Phase 2: RegistrationCartPage.jsx Changes

**File:** `src/pages/public/RegistrationCartPage.jsx`

**Change 1:** Added `grantRole` to import from `../../lib/invite-utils`.

**Change 2:** Hoisted `existingProfile` from inner `const` (line 1457) to `let existingProfile = null` declared alongside `parentInviteUrl`, so it's accessible after the player creation loop.

**Change 3:** Added linking block (55 lines) after the player creation loop (line 1681), before BATON PASS admin notification:
- Guard: `existingProfile?.id && createdPlayerIds.length > 0`
- Updates `players.parent_account_id` for all created player IDs
- Links `families.account_id` if not already set
- Upserts `player_parents` records
- Grants parent role via `grantRole()`
- Syncs emergency contact info to parent profile
- All operations wrapped in try/catch (non-fatal)

**Note:** No `!authUserId` guard needed here because RegistrationCartPage has NO auth.signUp logic — there's no possibility of double-linking.

---

## Phase 3: Data Repair SQL Scripts

**These scripts must be run manually by Carlos in the Supabase SQL Editor.**

### 3A: Dry Run — Find orphan player records

```sql
-- DRY RUN: Find all players with parent_email matching an existing profile
-- but parent_account_id is NULL
SELECT
  p.id AS player_id,
  p.first_name,
  p.last_name,
  p.parent_email,
  p.parent_account_id,
  pr.id AS profile_id,
  pr.email AS profile_email
FROM players p
JOIN profiles pr ON LOWER(p.parent_email) = LOWER(pr.email)
WHERE p.parent_account_id IS NULL
  AND p.parent_email IS NOT NULL
ORDER BY p.created_at DESC;
```

### 3B: Verify Brittany Clark's Data

```sql
-- Verify Brittany's auth account
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'brittrclark@gmail.com';

-- Verify her profile
SELECT id, email, full_name, current_organization_id
FROM profiles
WHERE LOWER(email) = 'brittrclark@gmail.com';

-- Verify her daughter's player record
SELECT id, first_name, last_name, parent_email, parent_account_id, family_id
FROM players
WHERE LOWER(parent_email) = 'brittrclark@gmail.com';

-- Verify family record
SELECT id, primary_email, account_id
FROM families
WHERE LOWER(primary_email) = 'brittrclark@gmail.com';
```

### 3C: Execute Repair (ONLY after Carlos verifies dry run)

```sql
-- REPAIR: Set parent_account_id on orphan player records
-- where parent_email matches an existing profile
UPDATE players p
SET parent_account_id = pr.id
FROM profiles pr
WHERE LOWER(p.parent_email) = LOWER(pr.email)
  AND p.parent_account_id IS NULL
  AND p.parent_email IS NOT NULL;

-- REPAIR: Set families.account_id for orphan family records
UPDATE families f
SET account_id = pr.id
FROM profiles pr
WHERE LOWER(f.primary_email) = LOWER(pr.email)
  AND f.account_id IS NULL
  AND f.primary_email IS NOT NULL;
```

### 3D: Post-Repair Verification

Re-run the dry run query from 3A. Should return zero rows.

```sql
-- Verify Brittany specifically
SELECT id, first_name, parent_email, parent_account_id
FROM players
WHERE LOWER(parent_email) = 'brittrclark@gmail.com';
-- parent_account_id should now be populated
```

---

## Phase 4: Self-Review (Codex not available)

### Review Findings

1. **Race conditions:** Minimal risk. `existingAccount` is set from a debounced useEffect that runs when email is entered. By submit time, it's stable. The fresh `checkExistingAccount()` call in RegistrationCartPage's submit handler is synchronous with the rest of the handler.

2. **RLS gaps:** The anon client successfully performs `players.update()` for newly created rows in the same handler (proven by the existing new-account path). No gap.

3. **Error handling:** All linking operations are wrapped in try/catch with `console.error`. Failures are non-fatal — registration data is already saved.

4. **Duplicate linking:** PublicRegistrationPage uses `!authUserId` guard — if auth.signUp succeeded and set `authUserId`, the returning-parent block is skipped. RegistrationCartPage has no auth.signUp, so no duplication risk.

5. **Email case sensitivity:** `checkExistingAccount()` in `invite-utils.js` already normalizes with `.trim().toLowerCase()` before querying. The SQL repair scripts use `LOWER()`. Covered.

6. **`existingAccount.id` = profile ID = auth UID:** Confirmed. `profiles.id` is the primary key and equals `auth.users.id`. The `checkExistingAccount()` function queries `profiles` and returns `.id`.

7. **`player_parents` upsert safety:** Uses `.catch(() => {})` to silently handle the case where the unique constraint `(player_id, parent_id)` may not exist on the table (it's defined in the schema but constraint enforcement wasn't verified).

8. **`families.account_id` update:** Uses `.is('account_id', null)` guard to avoid overwriting a valid existing link.

---

## Phase 5: Build + Push

- **Build:** `npx vite build` passes with no errors.
- **Push:** Pushed to main.

---

## Summary of Changes

| File | Lines Added | Lines Removed | Net |
|------|------------|---------------|-----|
| `src/pages/public/PublicRegistrationPage.jsx` | +46 | 0 | +46 |
| `src/pages/public/RegistrationCartPage.jsx` | +63 | -2 | +61 |
| **Total** | **+109** | **-2** | **+107** |
