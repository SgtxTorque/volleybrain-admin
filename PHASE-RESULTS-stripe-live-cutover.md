# PHASE RESULTS: Stripe Connect Sandbox-to-Live Cutover

## Date: 2026-05-02
## Branch: main

## Phase 1: Webhook Security Fix
- Files changed: supabase/functions/stripe-webhook/index.ts
- Lines modified: 18 insertions, 10 deletions
- Old behavior: When STRIPE_WEBHOOK_SECRET or stripe-signature header was missing, fell back to JSON.parse(body) and processed unverified events with a console.warn
- New behavior: Returns 500 if webhook secret not configured, 400 if signature header missing, 400 if signature invalid. No unverified events are ever processed.
- SDK version change: stripe@13.10.0 → stripe@14.14.0
- Build: PASS
- Commit: 1c70e94
- **Codex adversarial review:** PASS — No Critical or High findings
  - Medium: Replay protection relies on Stripe's default 5-minute tolerance window (updates are idempotent, so impact is minimal)
  - Low: Single webhook secret means rotation requires careful timing
  - Low: 500 path reveals "Webhook secret not configured" to probing attackers (reconnaissance value only)
  - Low: Post-verification 500 catch path reflects raw error.message
  - Info: SDK v13→v14 introduces no breaking changes to constructEvent or event types
- **Codex critical issues found:** NO

## Phase 2: stripe-create-payment-intent Usage
- Frontend references found: 1 (metadata listing in PlatformSystemHealth.jsx, not an invocation)
- Status: Dead code
- Details: The only reference is in PlatformSystemHealth.jsx line 33 as a metadata entry listing edge functions for the health dashboard. No fetch() or functions.invoke() calls to stripe-create-payment-intent exist anywhere in the frontend codebase.

## Phase 3: stripe_publishable_key Column Usage
- Frontend references found: 1 (ParentPaymentsPage.jsx line 74)
- Is it used for payment processing: NO
- Details: The column is included in a Supabase .select() query alongside other org payment config fields (venmo, zelle, cashapp, etc.), but the value is never passed to loadStripe() or any Stripe client-side SDK. The @stripe/stripe-js package is not even imported in the codebase. It is dead code in the select clause.

## Phase 4: Manual Key Updates
- Status: Completed by Carlos
- Supabase secrets updated: 3 (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY)
- Vercel env var updated: YES

## Phase 5: Database Cleanup
- Organizations affected: 2
  - Black Hornets Athletics (b213e885-093f-47d8-afca-b305a75b3274) — acct_1TPQeoRfLXl7JDGg, stripe_enabled=true
  - Black Hornets Youth Sports (0fa5bfe1-8087-48ce-aee9-83d3e5ea9b45) — acct_1TSO2sRaQY9C6h46, stripe_enabled=false
- Dry run output: Both orgs had sandbox Stripe account IDs from test onboarding
- Post-cleanup verification: PASS — 0 rows with non-null stripe_account_id

## Phase 6: .env.example Update
- Files changed: .env.example, .claude/worktrees/tender-khorana/.env.example
- Build: PASS
- Commit: 6218b39

## Phase 7: Edge Function Deploys
- stripe-webhook: SUCCESS
- stripe-connect-onboard: SUCCESS
- stripe-connect-status: SUCCESS
- stripe-create-checkout: SUCCESS
- stripe-test-connection: SUCCESS
- **Codex post-deploy review:** PASS — No Critical findings
  - All functions read STRIPE_SECRET_KEY from Deno.env.get() — no fallbacks to hardcoded values
  - No hardcoded test keys or sandbox references anywhere
  - stripe-create-checkout correctly routes to connected accounts via stripeAccount option
  - stripe-webhook rejects all unverified events (no JSON.parse fallback)
  - MEDIUM: Wildcard CORS (Access-Control-Allow-Origin: *) on 4 functions — standard for Supabase Edge Functions behind auth headers, but should be tightened to production domain in future hardening pass
  - LOW: console.log of event.type in webhook (operational, not secrets)
- **Codex critical issues found:** NO

## Phase 8: Vercel Redeploy
- Push: SUCCESS (42cc6b2..6218b39 main -> main)
- Deploy status: Triggered (auto-deploy on push to main)

## Phase 9: Verification
- stripe-test-connection response: Requires admin JWT session — cannot call from CLI with anon key alone
- test_mode value: Expected FALSE (live key sk_live_* does not contain '_test_', line 99 of function)
- Webhook endpoint status: Deployed and accepting only signature-verified events
- Organization Stripe reset confirmed: YES — all 10 orgs show stripe_account_id=NULL, stripe_enabled=false

## ISSUES ENCOUNTERED
- `supabase db execute --project-ref` is not a valid command — used `supabase db query --linked` instead
- `supabase functions invoke` is not available in this CLI version — used curl for verification (requires user JWT)
- Vite build returns exit code 1 due to chunk size warnings (not errors) — build completes successfully ("✓ built in Xs")
- stripe-test-connection requires logged-in admin session; Carlos should verify from the admin UI after Vercel deploy completes

## FUTURE HARDENING (Non-blocking)
- Tighten CORS from wildcard to production domain on all Stripe Edge Functions
- Add replay tolerance parameter to constructEvent (reduce from 5min default)
- Mask error.message in webhook processing catch block (line 150)
- Remove console.log statements from webhook before high-volume usage

## PARITY LOG ENTRY
Added to PARITY-LOG.md under "May 2, 2026 (Stripe Live Cutover)"
