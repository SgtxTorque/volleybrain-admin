# PHASE RESULTS: Invite Code Standardization
**Date:** 2026-04-13
**Branch:** main
**Build:** PASS (all 5 commits build successfully)

### Fix 1: InviteCoachModal — PASS
**Commit:** dbda7dc
**Was:** `crypto.randomUUID().replace(/-/g, '').slice(0, 16)` → 16-char lowercase hex
**Now:** `generateInviteCode()` → 8-char uppercase alphanum
**File:** `src/pages/coaches/InviteCoachModal.jsx:210`

### Fix 2: CoachesPage resendInvite — PASS
**Commit:** 1238208
**Was:** `crypto.randomUUID().replace(/-/g, '').slice(0, 16)` → 16-char lowercase hex
**Now:** `generateInviteCode()` → 8-char uppercase alphanum (already imported)
**File:** `src/pages/coaches/CoachesPage.jsx:202`

### Fix 3: LoginPage recovery — PASS
**Commit:** 94db682
**Was:** `crypto.randomUUID()` → 36-char UUID with dashes
**Now:** `generateInviteToken()` → 40-char hex (matches other invitations table records)
**File:** `src/pages/auth/LoginPage.jsx:199`

### Fix 4: SetupWizard query — PASS
**Commit:** 749fb81
**Query updated to:** `.ilike('invite_code', inviteCode)` — case-insensitive match handles both new 8-char uppercase and legacy 16-char lowercase codes
**File:** `src/pages/auth/SetupWizard.jsx:435-439`

### Fix 5: Team code consolidation — PASS
**Commit:** 7d371b2
**New export:** `generateTeamInviteCode()` in `src/lib/invite-utils.js` (6-char uppercase)
**Removed:** Duplicate `generateCode()` from `InviteCodeModal.jsx` and `TeamManagerSetup.jsx`
**Files:** `src/lib/invite-utils.js`, `src/components/team-manager/InviteCodeModal.jsx`, `src/pages/team-manager/TeamManagerSetup.jsx`

### Existing Bad Codes in DB
Coaches invited via InviteCoachModal or resendInvite before this fix may have 16-char lowercase hex codes in the database. These will still work because:
- Magic link URLs (`/invite/coach/{code}`) use exact match on the URL param — still works
- SetupWizard now uses `.ilike()` — case-insensitive, matches both formats
- Admin can regenerate any coach's code from the detail modal (produces correct 8-char format)

### invite-utils.js Exports (Final State)
| Function | Output | Length | Purpose |
|----------|--------|--------|---------|
| `generateInviteCode()` | Uppercase alphanum (no I/O/0/1) | 8 | Coach invite codes (manual entry) |
| `generateTeamInviteCode()` | Uppercase alphanum (no I/O/0/1) | 6 | Team invite codes (manual entry) |
| `generateInviteToken()` | Lowercase hex | 40 | Magic link tokens (URL only) |
| `createInvitation()` | Uses `generateInviteToken()` internally | — | Invitations table records |
| `validateInvitation()` | — | — | Check invite validity |
| `acceptInvitation()` | — | — | Accept and mark used |
| `checkExistingAccount()` | — | — | Check if email has profile |
| `grantRole()` | — | — | Upsert user role |

### Final Verification
- Zero `crypto.randomUUID` in invite/code contexts (remaining usages are batch IDs, file paths, session IDs)
- Zero duplicate `generateCode()` functions
- All 5 builds passed (chunk size warning is pre-existing, not a real error)

## Issues Encountered
None. All fixes applied cleanly.
