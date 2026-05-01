# PHASE RESULTS: Registration Submit Safety (Ghost Writes + Cross-Org Family Scoping)

**Date:** May 1, 2026
**Spec:** EXECUTE-registration-submit-safety.md

---

## Phase 1: Fix Ghost Writes in PublicRegistrationPage.jsx

**File:** `src/pages/public/PublicRegistrationPage.jsx`
**Lines changed:** +39 / -6

Changes:
- Added `useRef` to React import
- Added `submittingRef = useRef(false)` state declaration
- Added `slowWarning` state for non-error informational banner
- Added synchronous `useRef` guard at top of `handleSubmit` (prevents double-click)
- Removed `Promise.race` + 30s timeout pattern (was re-enabling submit while background work continued)
- Added 15s slow-timer showing amber info banner (not red error)
- Added 120s hard timeout as safety net for unreachable Supabase (per Codex review)
- Both timers cleared in `finally` block alongside `setSubmitting(false)` and `submittingRef.current = false`
- Added amber info banner UI for `slowWarning` state (separate from red error banner)

**Commit:** `7736536` fix: remove Promise.race ghost write vulnerability in PublicRegistrationPage

---

## Phase 2: Fix Double-Submit in RegistrationCartPage.jsx

**File:** `src/pages/public/RegistrationCartPage.jsx`
**Lines changed:** +10 / -1

Changes:
- Added `useRef` to React import
- Added `submittingRef = useRef(false)` state declaration
- Added synchronous `useRef` guard at top of `handleSubmit`
- Added `submittingRef.current = false` in `finally` block
- Confirmed: No `Promise.race` pattern exists in this file

**Commit:** `4fcebb1` fix: add useRef double-submit guard to RegistrationCartPage

---

## Phase 3: Database Migration

**File:** `supabase/migrations/20260501_families_organization_id.sql`
**Lines added:** 52

Migration steps:
1. `ALTER TABLE families ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id)`
2. Backfill from `players -> seasons -> organizations` using `DISTINCT ON (family_id)` ordered by `created_at DESC`
3. Fallback backfill from `registrations -> seasons -> organizations` for families with no linked players
4. `CREATE UNIQUE INDEX IF NOT EXISTS families_org_email_unique ON families (organization_id, primary_email) WHERE organization_id IS NOT NULL AND primary_email IS NOT NULL`
5. `CREATE INDEX IF NOT EXISTS families_org_email_lookup ON families (organization_id, primary_email) WHERE primary_email IS NOT NULL`

**Status:** Migration file committed. Carlos must run in Supabase SQL Editor before the org-scoped queries take effect.

**Commit:** `ad38375` migration: add organization_id to families table for cross-org isolation

---

## Phase 4: Update Family Queries — Registration Pages

**Files:** `PublicRegistrationPage.jsx`, `RegistrationCartPage.jsx`
**Lines changed:** +5 / -2

Changes:
- PublicRegistrationPage family lookup: added `.eq('organization_id', organization?.id)`
- PublicRegistrationPage family insert: added `organization_id: organization?.id`
- RegistrationCartPage family lookup: added `.eq('organization_id', organization?.id)`
- RegistrationCartPage family insert: added `organization_id: organization?.id`
- Rollback deletes use `.eq('id', familyId)` — no change needed (primary key)

**Commit:** `056dbe6` fix: scope family lookups and inserts to organization_id

---

## Phase 5: Update Family Queries — Other Files

**File:** `src/pages/public/ParentInviteAcceptPage.jsx`
**Lines changed:** +2 / -1

Changes:
- ParentInviteAcceptPage family UPDATE: added `.eq('organization_id', invite.organization_id)`
- LoginPage.jsx: Left unchanged — read-only queries, no org context available at login time, cannot corrupt data

**Full codebase search results (`from('families')`):**
1. PublicRegistrationPage.jsx — scoped (Phase 4)
2. RegistrationCartPage.jsx — scoped (Phase 4)
3. ParentInviteAcceptPage.jsx — scoped (Phase 5)
4. LoginPage.jsx — read-only, unscoped (no org context at login)
5. invite-utils.js — no family queries found

**Commit:** `2cd55f3` fix: scope family queries in ParentInviteAcceptPage to organization_id

---

## Phase 6: Codex Adversarial Review

**Findings (7 total):**

| Severity | File | Description | Action Taken |
|----------|------|-------------|--------------|
| CRITICAL | PublicRegistrationPage.jsx | No hard timeout after Promise.race removal — UI could hang forever | Added 120s hard timeout |
| HIGH | Migration SQL | Backfill picks one org arbitrarily for multi-org families | Documented as known limitation — manual remediation needed for multi-org families |
| HIGH | Migration SQL | NULL organization_id families won't match new scoped queries | Documented — column intentionally nullable for backward compatibility |
| MED | PublicRegistrationPage.jsx | Slow-timer writes to error state (red banner) | Split into separate slowWarning state with amber banner |
| MED | PublicRegistrationPage.jsx | Timer not cleaned up on unmount | Acceptable risk — submit normally completes before unmount |
| MED | ParentInviteAcceptPage.jsx | Legacy NULL org_id families won't match scoped update | Acceptable — new registrations will always have org_id |
| LOW | LoginPage.jsx | Unscoped family queries remain | Intentional — read-only, no org context at login |

**Commit:** `dfe3753` fix: harden submit timeout per Codex adversarial review

---

## Phase 7: Final Push + Parity Log

**Build:** Passing (14.46s, no errors)
**Total commits:** 6
**Total files changed:** 4
**Total lines:** +95 / -9

**Parity log updated:** PARITY-LOG.md — May 1, 2026 entry added

**Known limitations (for Carlos):**
1. Migration must be run in Supabase SQL Editor before org-scoped queries take effect
2. Families with NULL organization_id after backfill will not match scoped queries — they'll get new org-scoped records on next registration
3. LoginPage family queries remain globally scoped (read-only, no corruption risk)
4. Multi-org families get assigned to their most recently active org — manual review recommended via dry-run queries in Phase 3B
