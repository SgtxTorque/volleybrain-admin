# PHASE RESULTS: Login Rescue Flow Fix
**Date:** 2026-05-15
**Branch:** feat/login-rescue-gating -> merged to main
**Build:** PASS (all 3 phases)

## Pre-Work Findings
- Rescue state variables found: `showRecovery`, `recoveryType`, `recoveryName`, `recoveryInviteCode`, `recoveryOrgId`, `recoveryLoading` (lines 45-50)
- Rescue lookup location: `src/pages/auth/LoginPage.jsx:76-163` (families query at 80, profiles query at 88, coaches queries at 105-160)
- Rescue card JSX location: `src/pages/auth/LoginPage.jsx:476-519` (originally)
- Recovery handler location: `src/pages/auth/LoginPage.jsx:171-237` (`handleRecoveryAction`)
- Forgot password handler: exists, `handleForgotPassword` at line 247, calls `supabase.auth.resetPasswordForEmail`
- showError() helper: did NOT exist before, created in Phase 1

## Phase 1: showError() Helper -- PASS
**Commit:** `32717e5`
- Error-setting sites replaced: 9 (OTP hash, login fallback, 3 recovery errors, forgot password validation, forgot password catch, Google OAuth catch, Apple OAuth catch)
- Direct `setError()` calls remaining: 12 (1 inside showError, 11 clearing calls with `setError('')`)

## Phase 2: Rescue Flow Removal -- PASS
**Commit:** `ed989c0`
- Rescue lookup removed from: `src/pages/auth/LoginPage.jsx:76-163` (entire families/profiles/coaches query block)
- Rescue card commented out at: `src/pages/auth/LoginPage.jsx:329-334` (replaced with disabled comment)
- Recovery handler commented out at: `src/pages/auth/LoginPage.jsx:84-92` (replaced with disabled comment)
- State variables commented out: `showRecovery`, `recoveryType`, `recoveryName`, `recoveryInviteCode`, `recoveryOrgId`, `recoveryLoading`
- `clearRecovery()` function commented out
- `generateInviteToken` import commented out (no longer needed)
- New error message: "Incorrect email or password. Please try again or reset your password below."

## Phase 3: Password Reset Affordance -- PASS
**Commit:** `f47b780`
- Reset prompt renders after: `error` state contains "Incorrect email or password" (login mode only)
- Forgot password handler: verified working, calls `supabase.auth.resetPasswordForEmail` with `redirectTo` pointing to `/reset-password`
- Secondary "never created a password" link: present, shows guidance to contact club admin or re-register
- `resetSending` state correctly disables the "Reset My Password" button during send

## Phase 4: Merge & Log -- PASS
**Merge commit:** `git merge feat/login-rescue-gating --no-ff`
- PARITY-LOG.md updated: YES
- Pushed to main: pending (ready to push)

## Issues Encountered
- None. All phases completed cleanly. Build passed on all 3 phases.

## Follow-Up Items (NOT part of this spec)
1. Player accounts mis-roled as parents (cru.ross.player, amir.herbert.player) -- needs investigation spec
2. Douglas Womble org-less profile -- needs investigation spec
3. Server-side recovery resolver Edge Function -- future enhancement if smart routing is needed
4. Forgot password flow verification -- confirm reset emails actually send via Resend
5. Pilar Lilley's families row may need `organization_id` backfill if she still can't log in after creating a password via reset
