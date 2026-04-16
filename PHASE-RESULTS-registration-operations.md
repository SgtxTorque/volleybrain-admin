# Phase Results — Registration Operations

**Branch:** `feat/registration-operations`
**Date:** April 15, 2026
**Spec:** `EXECUTE-SPEC-registration-operations.md`

## Scope

Three features shipped together:

1. **Payment-Gated Approval** — per-season `approval_mode` (open/pay_first/tryout_first)
2. **Registration Transfer** — admin moves a registration from one season to another
3. **Fee Deletion / Waive** — admin deletes unpaid fees or waives paid fees

## Commits

| Phase | Commit  | Description |
| ----- | ------- | ----------- |
| 1     | 81b8b8a | Migration + payment-checker utility |
| 2     | 678520e | Season form approval mode UI |
| 3     | 10cef0b | Conditional approval logic with pay_first and tryout_first modes |
| 4     | b58782c | Registration transfer library with cascade handling |
| 5     | b733f83 | Registration transfer modal with season picker and cascade handling |
| 6     | 004f72e | Fee deletion for unpaid fees and waive option for paid fees |

## Files Changed / Created

### Phase 1
- `supabase/migrations/20260415_approval_mode.sql` *(new)* — adds `approval_mode` + `approval_gate_fees` to `seasons`
- `src/lib/payment-checker.js` *(new)* — `getPlayerPaymentStatus` for gating approvals

### Phase 2
- `src/pages/settings/SeasonsPage.jsx` — form defaults + retroactive fee sweep when switching to pay_first
- `src/pages/settings/SeasonFormModal.jsx` — Approval tab with 3-mode cards, fee gating checkboxes, help copy

### Phase 3
- `src/pages/registrations/RegistrationsPage.jsx` — batch payment-status load, conditional approval logic, force-approve override, bulk approval with skipUnpaid
- `src/pages/registrations/RegistrationsTable.jsx` — inline approve disable + "$X owed" badge in pay_first mode
- `src/pages/registrations/PlayerDossierPanel.jsx` — force-approve UI + tryout_first info line
- `src/pages/public/PublicRegistrationPage.jsx` — pay_first fee generation on submit
- `src/pages/public/RegistrationCartPage.jsx` — pay_first fee generation + amber "payment required" success banner
- `src/pages/teams/TeamsPage.jsx` — tryout_first fee generation when player is rostered

### Phase 4
- `src/lib/registration-transfer.js` *(new)* — 10-step cascade `transferRegistration` helper

### Phase 5
- `src/pages/registrations/TransferModal.jsx` *(new)* — season picker modal with group-by-program + warning copy
- `src/pages/registrations/PlayerDossierPanel.jsx` — "Transfer season" button for pending/submitted/approved
- `src/pages/registrations/RegistrationsPage.jsx` — `transferTarget` state + modal wiring

### Phase 6
- `src/pages/payments/PaymentsPage.jsx` — `handleDeleteFee(feeId, isPaid)` for delete/waive
- `src/pages/payments/FamilyDetailPanel.jsx` — Delete (unpaid) / Waive (paid) buttons on each fee row

### Phase 7
- `PARITY-LOG.md` — Registration Operations entry added

## Build Verification

`npx vite build` ran clean after every phase. Only warnings were the standard:
- Dynamic import of `fee-calculator` coexists with static imports (expected — no code-splitting benefit but harmless)
- Main chunk > 500 kB (pre-existing project-wide warning)

## Carlos Actions After Deploy

1. **Run migration** at `supabase/migrations/20260415_approval_mode.sql` in Supabase SQL Editor.
2. **Verify** `seasons` table now has `approval_mode` (default `'open'`) and `approval_gate_fees` (default `'["registration"]'`).
3. **Test Transfer**: Admin → Registrations → pick a player → "Transfer season" → pick target → confirm.
4. **Test Payment-Gated Approval**: switch a season to "Pay first" → Approve button blocks until gating fees paid → test Force approve override.
5. **Test Tryout-First**: switch a season to "Tryout first" → approve a player (no fees generated) → add to team roster (fees generated).

## Notes

- `approval_mode` values: `open` | `pay_first` | `tryout_first`
- `approval_gate_fees` is a JSONB array, defaults to `["registration"]`. When empty/null, gating uses all auto-generated fees.
- Fee calculator (`generateFeesForPlayer`) is idempotent; dynamic import used in pay_first/tryout_first hooks to avoid potential circular deps.
- Transfer blocks if the player has paid auto-generated fees in the source season — admin must refund first.
- Waived fees are kept for audit (amount set to $0, fee_name suffixed with "(Waived)", description tagged "[Waived by admin]").
