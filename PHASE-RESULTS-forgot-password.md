# PHASE RESULTS — Forgot Password Flow Fixes

**Date:** April 15, 2026
**Commit:** `0ddb076`
**Files Changed:** 2 (`LoginPage.jsx`, `ResetPasswordPage.jsx`)

---

## Fix 1: Add `redirectTo` to `resetPasswordForEmail()` — CRITICAL

**File:** `src/pages/auth/LoginPage.jsx`, line 256

**Old:**
```jsx
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim())
```

**New:**
```jsx
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: `${window.location.origin}/reset-password`
})
```

Reset email links now explicitly point to `{current domain}/reset-password`, regardless of Supabase Dashboard Site URL configuration. Uses `window.location.origin` (dynamic) so it works on both localhost dev and production.

---

## Fix 2: Add `otp_disabled` to LoginPage Hash Parser

**File:** `src/pages/auth/LoginPage.jsx`, line 55

**Old:**
```jsx
if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied')) {
```

**New:**
```jsx
if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied') || hash.includes('error_code=otp_disabled')) {
```

Now matches ResetPasswordPage's error code coverage (which already had all three).

---

## Fix 3: Signup "Already Registered" Recovery CTA

**File:** `src/pages/auth/LoginPage.jsx`, inserted after line 339 (the error banner `</div>`)

**JSX added:**
```jsx
{error && mode === 'signup' && (error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already exists')) && (
  <div className="mt-[-16px] mb-6 text-center text-sm">
    <span className="text-slate-400">Already have an account? </span>
    <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[#4BB9EC] hover:underline font-medium">
      Sign in instead
    </button>
    <span className="text-slate-400 mx-1">or</span>
    <button type="button" onClick={handleForgotPassword} className="text-[#4BB9EC] hover:underline font-medium">
      reset your password
    </button>
  </div>
)}
```

**Does `email` state work for `handleForgotPassword`?** Yes — `email` is a component-level `useState` that's shared across login and signup modes. When the user types their email in signup mode and gets "already registered", the email field is already populated. `handleForgotPassword` reads `email.trim()` and validates it's non-empty before calling `resetPasswordForEmail`.

**`mt-[-16px]`** compensates for the `mb-6` on the error banner above, pulling the recovery CTA tight against the error message so they read as a single unit.

---

## Fix 4: Auto-Redirect After Password Reset Success

**File:** `src/pages/auth/ResetPasswordPage.jsx`

**Was `supabase` already imported?** Yes — line 2: `import { supabase } from '../../lib/supabase'`

**Added to success handler (after `setSuccess(true)` on line 41):**
```jsx
// Sign out the recovery session and redirect to login
setTimeout(async () => {
  await supabase.auth.signOut()
  window.location.href = '/login'
}, 3000)
```

**Added to success screen JSX (after "Your password has been reset successfully."):**
```jsx
<p className="text-sm text-slate-400 mb-6">Redirecting to sign in...</p>
```

After successful reset, the recovery session is signed out (clean state) and the user is redirected to `/login` after 3 seconds. The manual "Sign In" button remains for users who want to click immediately.

---

## Build Verification

**Status:** PASS
**Time:** 13.79s
**Exit code 1:** Chunk size warning only (3,376 kB main bundle — expected)

---

## Carlos Action Required

Verify these Supabase Dashboard settings at:
`https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby/auth/url-configuration`

1. **Site URL** → must be `https://thelynxapp.com`
2. **Redirect URLs** → must include `https://thelynxapp.com/**` or at minimum `/reset-password`, `/login`
3. **Email OTP Expiration** → should be `3600` seconds (1 hour)

---

## Issues Encountered

None. All 4 fixes applied cleanly. Line numbers matched the investigation report exactly.
