# INVESTIGATION REPORT — Forgot Password Flow Verification

**Date:** April 15, 2026
**Spec:** INVESTIGATION-SPEC-FORGOT-PASSWORD.MD
**Status:** READ-ONLY investigation — no code changes made

---

## 1. Executive Summary

The forgot password flow is **mostly functional but has one critical configuration gap**. The code-side implementation is solid: a dedicated `ResetPasswordPage` exists at `/reset-password` with proper password form, validation, and OTP expiry error handling. `AuthContext` correctly intercepts the `PASSWORD_RECOVERY` event and redirects to the reset page with hash params intact. The root issue is that `LoginPage.jsx` line 256 calls `supabase.auth.resetPasswordForEmail(email)` with **no `redirectTo` parameter**, causing Supabase to fall back to whatever "Site URL" is configured in the Supabase Dashboard. If that Site URL is `http://localhost:5173` (common during development), reset emails in production will contain links pointing to localhost — making them non-functional for end users. If the Site URL is set to `https://thelynxapp.com` (the production domain), the flow works end-to-end because `AuthContext.onAuthStateChange` intercepts the `PASSWORD_RECOVERY` event on any page and redirects to `/reset-password`. The "instant OTP expiry" reported by Cowork is most likely caused by a Site URL / Redirect URL mismatch in the Supabase Dashboard, not a code bug.

---

## 2. Flow Trace Table

| Step | Description | Code Location | Status |
|------|-------------|---------------|--------|
| 1 | User clicks "Forgot password?" on login page | `LoginPage.jsx` line 436–445 (button), line 247–263 (`handleForgotPassword`) | FUNCTIONAL |
| 2 | `resetPasswordForEmail()` called | `LoginPage.jsx` line 256 | **GAP: no `redirectTo` passed** |
| 3 | Supabase sends email with reset link | Supabase backend (not in code) | Depends on Dashboard Site URL config |
| 4a | User clicks valid link → lands on app | `AuthContext.jsx` line 55–58 intercepts `PASSWORD_RECOVERY`, redirects to `/reset-password` | FUNCTIONAL |
| 4b | User clicks expired link → error shown | `ResetPasswordPage.jsx` lines 12–19 parse hash for `otp_expired` / `access_denied` / `otp_disabled` | FUNCTIONAL |
| 5 | User submits new password | `ResetPasswordPage.jsx` lines 21–47, calls `supabase.auth.updateUser({ password })` | FUNCTIONAL |
| 6 | After success → user signs in | `ResetPasswordPage.jsx` lines 69–89 show success + "Sign In" link to `/` | FUNCTIONAL (manual click required) |

---

## 3. Area-by-Area Findings

### Area 1: Login Page — Forgot Password Trigger

**File:** `src/pages/auth/LoginPage.jsx`

**"Forgot password?" button (lines 436–445):**
```jsx
{mode === 'login' && (
  <button type="button" onClick={handleForgotPassword} disabled={resetSending}
    className="text-sm text-slate-400 hover:text-[#4BB9EC] transition cursor-pointer mt-1 disabled:opacity-50">
    {resetSending ? 'Sending...' : 'Forgot password?'}
  </button>
)}
```
- Only visible in `login` mode (not signup)
- Styled as muted gray text (`text-slate-400`, `text-sm`) — functional but easy to miss
- Shows loading state ("Sending...") and disables button while request is in flight

**`handleForgotPassword` function (lines 247–263):**
```jsx
async function handleForgotPassword() {
  if (!email.trim()) {
    setError('Please enter your email address first')
    return
  }
  setResetSending(true)
  setError('')
  setMessage('')
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (resetError) throw resetError
    setMessage('Password reset link sent! Check your email.')
  } catch (err) {
    setError(err.message)
  }
  setResetSending(false)
}
```

| Question | Answer |
|----------|--------|
| Calls `resetPasswordForEmail()`? | Yes, line 256 |
| `redirectTo` URL passed? | **NONE** — no options object at all |
| Email validation? | Basic empty check only (`!email.trim()`) |
| Feedback on success? | Green banner: "Password reset link sent! Check your email." |
| Feedback on error? | Red banner with `err.message` |
| UI visibility? | Muted gray, small — functional but subtle |

---

### Area 2: Password Reset Callback Handling

**Dedicated `/reset-password` page exists:** Yes

**File:** `src/pages/auth/ResetPasswordPage.jsx` (142 lines)
**Route:** `src/App.jsx` line 89: `<Route path="/reset-password" element={<ResetPasswordPage />} />`

**Three views:**

1. **OTP Expired screen** (lines 49–67) — shown when hash contains `otp_expired`, `access_denied`, or `otp_disabled`:
   - Shows: "Reset link expired" with clock emoji
   - Shows: "Request a new one and click it right away"
   - Shows: "Back to Login →" link to `/login`

2. **Success screen** (lines 69–89) — shown after successful password update:
   - Shows: "Password Updated!" with checkmark emoji
   - Shows: "Sign In" link to `/`

3. **Password form** (lines 91–141) — default view:
   - Two password fields (new + confirm)
   - 8-character minimum validation
   - Match validation
   - "Reset Password" submit button

**OTP hash parsing (lines 12–19):**
```jsx
useEffect(() => {
  const hash = window.location.hash
  if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied') || hash.includes('error_code=otp_disabled')) {
    setOtpExpired(true)
    window.history.replaceState(null, '', window.location.pathname)
  }
}, [])
```

**Password update call (line 36):**
```jsx
const { error: updateError } = await supabase.auth.updateUser({ password: password })
```
Uses `supabase.auth.updateUser()` — correct method for updating password during a recovery session.

**`access_token` parsing:** ResetPasswordPage does NOT explicitly parse `access_token`. It relies on Supabase JS SDK to automatically exchange the token from the hash fragment and establish the recovery session. This is the correct pattern.

---

### Area 3: Supabase Auth Configuration

**Supabase client:** `src/lib/supabase.js` (11 lines)
```js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```
- Project ID: `uqpjvbiuokwpldjvxiby`
- URL: `https://uqpjvbiuokwpldjvxiby.supabase.co`
- No custom auth options (no flow type override, no custom storage)

**All `redirectTo` usage in codebase:**

| File | Line | Value | Context |
|------|------|-------|---------|
| `AuthContext.jsx` | 236 | `window.location.origin` | Google OAuth |
| `AuthContext.jsx` | 246 | `window.location.origin` | Apple OAuth |
| `LoginPage.jsx` | 256 | **NOT SET** | `resetPasswordForEmail()` |

**All `onAuthStateChange` listeners:**

| File | Line | Events Handled |
|------|------|---------------|
| `AuthContext.jsx` | 42 | `SIGNED_IN` → `init()`, `SIGNED_OUT` → clear state, `PASSWORD_RECOVERY` → redirect to `/reset-password` |
| `RegistrationCartPage.jsx` | 401 | Session presence only (`setHasSession`) |
| `RegistrationScreens.jsx` | 238 | Session presence only (`setHasSession`) |

---

### Area 4: Auth Context — Session Recovery

**File:** `src/contexts/AuthContext.jsx`

**`onAuthStateChange` listener (lines 42–62):**
```jsx
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    init()
  }
  if (event === 'SIGNED_OUT') {
    setUser(null); setProfile(null); setOrganization(null)
    setIsAdmin(false); setIsPlatformAdmin(false); setNeedsOnboarding(false); setLoading(false)
  }
  if (event === 'PASSWORD_RECOVERY') {
    const hash = window.location.hash
    window.location.href = '/reset-password' + hash
  }
})
```

| Question | Answer |
|----------|--------|
| Has `onAuthStateChange`? | Yes, line 42 |
| Handles `PASSWORD_RECOVERY`? | Yes, lines 55–58 |
| What does it do? | Hard redirect: `window.location.href = '/reset-password' + hash` |
| Calls `init()`? | No — does NOT set user state for PASSWORD_RECOVERY |
| Session state? | Supabase JS SDK handles the temporary session internally; AuthContext doesn't set React state for it |

**Important:** After a valid reset link click, Supabase establishes a temporary session before firing `PASSWORD_RECOVERY`. `AuthContext` does NOT call `init()` for this event — the user's React state (profile, org, etc.) is never loaded. This is correct because the user should only be able to set a new password, not access the full app.

---

### Area 5: Error Display on Homepage/Login

**LoginPage.jsx (lines 52–59) — parses hash on mount:**
```jsx
useEffect(() => {
  const hash = window.location.hash
  if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied')) {
    setError('This password reset link has expired. Please request a new one.')
    window.history.replaceState(null, '', window.location.pathname)
  }
}, [])
```
- Catches `otp_expired` and `access_denied`
- Shows friendly error message
- Cleans hash from URL

**App.jsx:** No hash parsing
**MainApp.jsx:** No hash parsing

**What happens at `thelynxapp.com/#error_code=otp_expired`:**
1. App loads → `AuthContext` fires `onAuthStateChange`
2. Supabase fires `PASSWORD_RECOVERY` with error in hash
3. AuthContext redirects to `/reset-password#error_code=otp_expired&...`
4. `ResetPasswordPage` mounts, `useEffect` detects `otp_expired`, shows "Reset link expired" screen
5. User sees friendly error with "Back to Login →" button

**Double safety net:** If for some reason the user lands on `/login#error_code=otp_expired` directly (bypassing AuthContext), LoginPage also catches the error and shows its own message. Both paths are covered.

**Note:** LoginPage catches `otp_expired` + `access_denied`. ResetPasswordPage catches `otp_expired` + `access_denied` + `otp_disabled`. The `otp_disabled` case is only handled on ResetPasswordPage.

---

### Area 6: Full Reset Flow Trace

**Step 1: User clicks "Forgot password?"**
- `LoginPage.jsx` line 247: `handleForgotPassword()` fires
- Line 256: `supabase.auth.resetPasswordForEmail(email.trim())` called
- **No `redirectTo`** — Supabase uses Dashboard Site URL as default

**Step 2: Supabase sends email**
- Email contains a magic link URL pointing to the Supabase auth endpoint
- After token validation, Supabase redirects to: `{Site URL}#access_token=...&type=recovery` (valid) or `{Site URL}#error_code=otp_expired&...` (expired)
- If `redirectTo` were set, it would redirect to that URL instead of Site URL

**Step 3: User clicks link in email**
- Browser navigates to `{Site URL}#access_token=...&type=recovery` (or error hash)
- Supabase JS client reads the hash, exchanges the token, establishes a recovery session
- Supabase fires `PASSWORD_RECOVERY` event on `onAuthStateChange`

**Step 4a: Valid OTP**
- `AuthContext.jsx` line 55: `PASSWORD_RECOVERY` event fires
- Line 58: `window.location.href = '/reset-password' + hash`
- `ResetPasswordPage` mounts, shows password form
- Supabase has already established a temporary session — `updateUser()` will work

**Step 4b: Expired OTP**
- `AuthContext.jsx` line 55: `PASSWORD_RECOVERY` event fires (even for errors)
- Line 58: Redirects to `/reset-password#error_code=otp_expired&...`
- `ResetPasswordPage` line 12: `useEffect` catches `otp_expired`, shows "Reset link expired" screen

**Step 5: User submits new password**
- `ResetPasswordPage.jsx` line 36: `supabase.auth.updateUser({ password })`
- Validation: 8+ chars, passwords match
- Success: `setSuccess(true)` → shows success screen

**Step 6: After success**
- Success screen renders with "Sign In" link to `/`
- No auto-redirect, no sign-out — user must manually click
- The recovery session persists until the user navigates away

---

### Area 7: "User Already Registered" Recovery Path

**LoginPage.jsx (signup mode):** When `signUp()` returns an "already registered" error, the raw Supabase error message is shown in the red banner via `setError(err.message)`. There is **no special recovery path** — no "Sign in instead" button, no "Forgot password?" suggestion. However, the Sign In / Sign Up toggle tabs are always visible at the top of the form, so the user can manually switch modes.

**PublicRegistrationPage.jsx (lines 828–834):** Properly detects "already registered" / "already exists" errors and sets `existingAccountDetected = true`. The success screen then shows an amber card with:
- "You already have an account"
- "Sign In →" button (links to `/login`)
- "Forgot Password?" button (links to `/login`)

**RegistrationCartPage.jsx (lines 467–473):** Same pattern — detects existing account and shows:
- "You already have an account"
- "Sign In →" button
- "Forgot Password?" button

**Summary:** The registration flows handle "already registered" well with clear recovery CTAs. The LoginPage signup flow does NOT — it just shows the raw error.

---

## 4. Root Cause Analysis — "OTP Expires Instantly"

The reported issue of "OTP links expire within 10 seconds of receipt" is almost certainly **NOT a code bug**. The code correctly handles both valid and expired tokens. The likely root causes are:

### Most Likely: Supabase Dashboard Site URL Mismatch

`LoginPage.jsx` line 256 calls `resetPasswordForEmail(email)` with **no `redirectTo`**. Supabase falls back to the Dashboard's "Site URL" setting. If that is set to:
- `http://localhost:5173` → Link redirects to localhost, never reaches production app, appears "broken"
- `https://thelynxapp.com` → Link works correctly (AuthContext intercepts and redirects to `/reset-password`)

If the Site URL was recently changed from localhost to production, old emails in transit would still have localhost links.

### Second Possibility: Supabase Email Rate Limiting

Supabase's free tier limits password reset emails. If multiple resets are requested in quick succession during testing, subsequent emails may contain stale/expired tokens.

### Third Possibility: OTP Expiry Window Too Short

Supabase's default OTP expiry is typically 1 hour, but this can be configured in the Dashboard under Authentication → Settings → "Email OTP Expiration." If someone set this to a very short window (e.g., 10 seconds), that would explain the instant expiry.

### NOT a Code Issue

The code-side handling is correct:
- `AuthContext` intercepts `PASSWORD_RECOVERY` and redirects to `/reset-password`
- `ResetPasswordPage` handles both valid tokens and expired tokens
- `LoginPage` has a backup hash parser for OTP errors
- `updateUser({ password })` is the correct Supabase method

---

## 5. Missing Code

| What's Missing | Severity | Where It Should Be |
|---------------|----------|-------------------|
| `redirectTo` in `resetPasswordForEmail()` | **HIGH** | `LoginPage.jsx` line 256 — should pass `{ redirectTo: \`${window.location.origin}/reset-password\` }` |
| "Sign in instead" CTA for signup "already registered" error | **LOW** | `LoginPage.jsx` — when `mode === 'signup'` and error contains "already registered", show Sign In button |
| Auto-redirect or sign-out after password reset success | **LOW** | `ResetPasswordPage.jsx` — after success, could auto-redirect to `/login` after 3 seconds or explicitly sign out the recovery session |
| `otp_disabled` handling in LoginPage hash parser | **VERY LOW** | `LoginPage.jsx` line 54 — only catches `otp_expired` + `access_denied`, not `otp_disabled` (ResetPasswordPage catches all three) |

---

## 6. Recommended Fixes (Priority Order)

### Fix 1: Add `redirectTo` to `resetPasswordForEmail()` [HIGH — 1 line]
```jsx
// LoginPage.jsx line 256, change:
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim())
// to:
const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: `${window.location.origin}/reset-password`
})
```
This ensures the reset email link always points to the correct domain and page, regardless of Supabase Dashboard configuration.

### Fix 2: Verify Supabase Dashboard Settings [HIGH — Dashboard only]
- **Site URL:** Must be `https://thelynxapp.com` (not localhost)
- **Redirect URLs:** Must include `https://thelynxapp.com/reset-password` in the allowed list
- **OTP Expiration:** Should be at least 3600 seconds (1 hour) under Authentication → Settings

### Fix 3: Add "Sign in instead" to LoginPage signup error [LOW — ~10 lines]
When signup fails with "already registered", show a button to switch to login mode instead of just the raw error.

### Fix 4: Add auto-redirect after password reset success [LOW — ~5 lines]
After successful password reset, auto-redirect to `/login` after 3 seconds, or call `supabase.auth.signOut()` to cleanly end the recovery session.

### Fix 5: Add `otp_disabled` to LoginPage hash parser [VERY LOW — 1 line]
Add `hash.includes('error_code=otp_disabled')` to the LoginPage useEffect (line 54) for completeness.

---

## 7. Risk Assessment

### What breaks if we change the auth flow?

| Change | Risk | Dependencies |
|--------|------|-------------|
| Add `redirectTo` to `resetPasswordForEmail()` | **NONE** — purely additive, doesn't change existing behavior | None |
| Modify Supabase Dashboard Site URL | **LOW** — may affect other auth flows (OAuth, email confirmations) if they also rely on Site URL | OAuth redirects in AuthContext already use `window.location.origin` (dynamic), so they're safe |
| Change `ResetPasswordPage` post-success behavior | **LOW** — only affects users who just reset their password | Recovery session may interfere with `AuthContext.init()` if not signed out |
| Add signup error recovery CTA | **NONE** — purely additive UI | None |

### What depends on current behavior?

- `AuthContext.onAuthStateChange` is the single listener for `PASSWORD_RECOVERY` — all other listeners ignore it
- `ResetPasswordPage` relies on Supabase JS SDK having already established a recovery session before mount
- The hash-passthrough in `AuthContext` line 58 (`window.location.href = '/reset-password' + hash`) is relied upon by `ResetPasswordPage` to detect errors
- Registration success screens (`RegistrationScreens.jsx`, `RegistrationCartPage.jsx`) independently handle "already registered" — they don't depend on `LoginPage` behavior

### Safe to change:
- Adding `redirectTo` is zero-risk
- Supabase Dashboard changes are low-risk if OAuth redirects are verified
- All recommended fixes are backward-compatible
