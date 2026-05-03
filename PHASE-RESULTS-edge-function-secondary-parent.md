# PHASE RESULTS: Edge Function Secondary Parent Authorization

## Date: 2026-05-03
## Branch: main

## Phase 1: Function Audit
- create-player-account auth check: line 65 (`player.parent_account_id !== parentUser.id`), uses `supabaseAdmin` (service role)
- update-player-password auth check: line 59 (`!player || player.parent_account_id !== parentUser.id`), uses `supabaseAdmin` (service role)
- stripe-create-checkout auth check: lines 96-101 (multi-player `parent_account_id` query + count match), uses `serviceClient` (service role)
- stripe-create-payment-intent auth check: lines 95-101 (same multi-player pattern), uses `serviceClient` (service role)

## Phase 2: Shared Helper
- File created: `supabase/functions/_shared/parent-auth.ts`
- Exports `isAuthorizedParent(supabaseClient, userId, playerId)` — checks `players.parent_account_id` then `player_parents` junction table
- Commit: 12694d4

## Phase 3: create-player-account
- Added import of `isAuthorizedParent` from `../_shared/parent-auth.ts`
- Line 65: Added `player_parents` fallback inside the `parent_account_id !== parentUser.id` block
- Commit: d5eccc4

## Phase 4: update-player-password
- Added import of `isAuthorizedParent` from `../_shared/parent-auth.ts`
- Line 59: Split combined `!player || parent_account_id` check into separate null check + auth check with `player_parents` fallback
- Commit: d96b29a

## Phase 5: stripe-create-checkout
- Added import of `isAuthorizedParent` from `../_shared/parent-auth.ts`
- Lines 96-101: After existing `authorizedPlayers` query, added secondary check via `player_parents` for any unmatched player IDs using `Promise.all`
- Commit: ca674ec

## Phase 6: stripe-create-payment-intent
- Added import of `isAuthorizedParent` from `../_shared/parent-auth.ts`
- Same pattern as stripe-create-checkout: secondary `player_parents` check for unmatched players
- Commit: 4e46898

## Phase 7: Deploys
- create-player-account: SUCCESS (deployed twice — once initially, once after Codex fix)
- update-player-password: SUCCESS
- stripe-create-checkout: SUCCESS
- stripe-create-payment-intent: NOT DEPLOYED (dead code per spec)

## Phase 8: Codex Review
### Findings:
1. **Bypass risk (MEDIUM)**: `isAuthorizedParent()` trusts row existence in `player_parents` without checking status. Relies on `player_parents` INSERT RLS policies (added in previous spec) to prevent unauthorized row creation. Pre-existing concern.
2. **TOCTOU race (LOW)**: Check-then-act gap between authorization and external side effects (Auth/Stripe). Inherent to the architecture; accepted risk.
3. **Scope creep (FIXED)**: `create-player-account` was setting `user_metadata.parent_id` to the caller's ID. Fixed to use `player.parent_account_id` (primary parent) as canonical owner, with `created_by` field for audit trail. Commit: 6d8b11a
4. **Client appropriateness (MEDIUM)**: Service role client used for auth queries — standard for Edge Functions. Security boundary is function logic + table write policies.
5. **Error response leaks (LOW)**: Pre-existing patterns (404 for missing player, raw `err.message` in catch blocks). Not introduced by this change.
6. **Stripe routing (OK)**: Secondary parent fallback does not affect payment routing. Connected account derived from payment records, not caller identity.

### Critical issues: NO (one issue fixed in-session)

## Phase 9: Push
- Build: PASS (14.45s, no errors)
- Push: SUCCESS (407c613..6d8b11a)

## ISSUES ENCOUNTERED
- Codex identified that `create-player-account` would record secondary parent as owner in `user_metadata.parent_id`. Fixed immediately by using `player.parent_account_id` instead and adding `created_by` field. Redeployed.
