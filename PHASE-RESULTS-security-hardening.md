# PHASE RESULTS — Security Hardening (Tier 1)
**Date:** 2026-05-01

## Phase 0: Baseline Investigation

### 0A: Current RLS Policies (from migration files)
- **teams**: `"Users can view teams in their org seasons"` (SELECT), `"Admins can insert teams"` (INSERT), `"Admins can update teams"` (UPDATE) — write policies only checked org membership, NOT admin role. No DELETE policy.
- **players**: `"Users can view players in their org"` (SELECT), `"Admins can manage players"` (FOR ALL) — any org member could CRUD.
- **schedule_events**: `"Users can view events in their org"` (SELECT), `"Admins can manage events"` (FOR ALL) — any org member could CRUD.
- **payments**: `"Users can view payments in their org"` (SELECT), `"Admins can manage payments"` (FOR ALL) — any org member could CRUD.

### 0B: user_roles Schema
- Columns: `user_id`, `organization_id`, `role`, `is_active`, `granted_at`, `granted_by`, `revoked_by`
- Admin role value: `'league_admin'` (confirmed in AuthContext.jsx line 161 and 20260411_fix_rls_role_names.sql)
- Platform admin: `profiles.is_platform_admin = true` or `public.is_platform_admin()` function
- The column is `user_id` (NOT `profile_id` as the spec template assumed)

### 0C: Client Type
- Web app uses the **anon** key for ALL client-side operations (src/lib/supabase.js)
- Service role is only used in server-side scripts (src/scripts/*)
- No service role key exposed on the client side

### 0D: Edge Function Auth Patterns
| Function | Auth Before | Auth After |
|---|---|---|
| stripe-create-payment-intent | NONE | User auth + payment ownership + server-side amount |
| stripe-create-checkout | NONE | User auth + payment ownership + server-side amount |
| notification-cron | `--no-verify-jwt` | Shared secret (`x-cron-secret`) |
| push | `--no-verify-jwt` | Shared secret (`x-cron-secret`) |
| stripe-test-connection | NONE | Admin auth required |
| stripe-connect-status | Auth but no role check | Auth + admin role check |
| stripe-connect-onboard | Auth + wrong role names | Auth + correct role (`league_admin`) |
| resend-webhooks | NONE | Svix signature headers + HMAC verification |
| send-payment-reminder | Internal queue (OK) | No change needed |
| create-player-account | Auth (OK) | No change needed |
| update-player-password | Auth (OK) | No change needed |
| delete-user-account | Auth (OK) | No change needed |

## Phase 1: RLS Hardening Migration

**File:** `supabase/migrations/20260501_rls_role_hardening.sql`

### Policies Dropped
- `"Admins can insert teams"` on teams (INSERT, org-membership only)
- `"Admins can update teams"` on teams (UPDATE, org-membership only)
- `"Admins can manage players"` on players (FOR ALL, org-membership only)
- `"Admins can manage events"` on schedule_events (FOR ALL, org-membership only)
- `"Admins can manage payments"` on payments (FOR ALL, org-membership only)

### Policies Created
- **teams**: Admin-only INSERT, UPDATE, DELETE (league_admin or platform_admin)
- **players**: INSERT allows admins + registration (authenticated org members + anon); UPDATE allows admins, parents (own children), coaches; DELETE admin-only
- **schedule_events**: INSERT/UPDATE allows admins + coaches; DELETE admin-only
- **payments**: INSERT, UPDATE, DELETE all admin-only

### Adaptations from Spec Template
1. Changed `profile_id` to `user_id` (actual column name)
2. Changed `'platform_admin'` role check to `profiles.is_platform_admin = true` (actual pattern)
3. Added `is_active = true` to all user_roles checks
4. Payments resolved via `season_id -> seasons.organization_id` (no direct org_id column)
5. Left existing SELECT policies unchanged (they work correctly)

## Phase 2: Edge Function Hardening

### stripe-create-payment-intent
- Added auth via `supabase.auth.getUser()`
- Validates payment_ids belong to caller (parent check) or caller is org admin
- Derives amount from database `payments` table, ignores client-supplied amount
- Rejects mixed-org payment sets

### stripe-create-checkout
- Same auth + ownership + server-side amount pattern
- Org's connected Stripe account looked up from DB, not from request
- Rejects mixed-org payment sets
- Application fee logic preserved

### notification-cron
- Replaced `--no-verify-jwt` with `x-cron-secret` header verification
- Requires `CRON_SECRET` environment variable

### push
- Same shared secret pattern as notification-cron
- Database webhooks must include `x-cron-secret` header

### stripe-test-connection
- Added auth + admin role check (league_admin or platform_admin)
- Error responses sanitized

### stripe-connect-status
- Added admin role check after existing auth
- Requires league_admin for the target organization or platform_admin

### stripe-connect-onboard
- Fixed role check from `['admin', 'director', 'owner']` to `'league_admin'`
- Added `is_active = true` check
- Origin header validated against trusted allowlist (prevents open redirect)
- Error response sanitized

### resend-webhooks
- Added svix signature header requirement (svix-id, svix-timestamp, svix-signature)
- Added timestamp staleness check (5-minute window)
- HMAC signature verification using `RESEND_WEBHOOK_SECRET`
- Fails closed when secret is not configured

## Phase 3: Codex Adversarial Review

### CRITICAL (Fixed)
1. **Mixed-org payment sets** in both Stripe functions — admin of org A could process payments from org B. Fixed: reject requests where payments span multiple organizations and verify admin for the specific org.

### HIGH (Fixed)
2. **resend-webhooks optional auth** — when `RESEND_WEBHOOK_SECRET` was unset, verification was skipped. Fixed: fail closed with 500 error.

### HIGH (Accepted Risk — Documented)
3. **Anonymous player INSERT** — `auth.uid() IS NULL` allows unauthenticated inserts into any season. This is required for public registration to work with the anon client. Proper fix is moving registration to an Edge Function (larger architectural change, out of scope).
4. **Parent player UPDATE is full-row** — parents can update any mutable column on their children's records, not just account-linking fields. Column-level RLS requires migration to RPC pattern (out of scope).

### MED (Fixed)
5. **Open redirect in stripe-connect-onboard** — Origin header used for Stripe redirect URLs. Fixed: validate against trusted origins allowlist.

### MED (Accepted Risk — Documented)
6. **Coach player-update is org-scoped** — coaches can update any player in the org, not just their team's players. Team-level scoping requires team_coaches join in RLS (complexity/performance tradeoff).
7. **Payments SELECT remains org-wide** — all org members can see all org payments. Splitting by actor type is a follow-up migration.

## Phase 4: Regression Testing

**For Carlos to verify manually:**
1. Public registration at thelynxapp.com — does it still work?
2. Admin CRUD operations on teams, events, payments
3. Parent dashboard and payment views
4. Stripe checkout flow (if sandbox is active)

## Phase 5: Final Build & Push

- Build: PASSED (vite build, 1894 modules, 14-17s)
- Parity log: Updated with security hardening notes
- All commits pushed to main

## New Secrets Required

Carlos must configure these in Supabase Dashboard (Edge Function Secrets):
1. `CRON_SECRET` — strong random string for notification-cron and push functions
2. `RESEND_WEBHOOK_SECRET` — get from Resend Dashboard > Webhooks > Signing secret

## Deployment Commands

After Carlos configures the secrets:
```bash
npx supabase functions deploy stripe-create-payment-intent --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy stripe-create-checkout --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy notification-cron --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy push --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy stripe-test-connection --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy stripe-connect-status --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy stripe-connect-onboard --project-ref uqpjvbiuokwpldjvxiby
npx supabase functions deploy resend-webhooks --project-ref uqpjvbiuokwpldjvxiby
```

**IMPORTANT:** Deploy `notification-cron` and `push` WITHOUT `--no-verify-jwt` this time.

The RLS migration (`20260501_rls_role_hardening.sql`) must be run in the Supabase SQL Editor. Carlos should first run `dump_current_rls.sql` to verify the actual live policy names match the DROP statements in the migration.
