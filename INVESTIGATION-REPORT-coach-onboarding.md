# INVESTIGATION REPORT: Coach Onboarding Pipeline
## Date: 2026-04-11
## Repo: SgtxTorque/volleybrain-admin (main branch)

## The Pipeline (Current State)

### Step 1: Admin clicks "Invite Coach"
**File:** `src/pages/coaches/InviteCoachModal.jsx`

Admin opens InviteCoachModal from CoachesPage or StaffPortalPage. Fills in first name, last name, email, role (head/assistant/manager/volunteer), and optionally a team. The modal detects existing Lynx accounts in real-time (debounced email check via `checkExistingAccount()` — line 65-77).

**Two paths diverge here:**

- **New user** → `handleNewUserInvite()` (line 177): Creates a `coaches` table record with `invite_status: 'invited'` and a **16-char hex invite code** (line 181: `crypto.randomUUID().replace(/-/g, '').slice(0, 16)`). Also creates a secondary record in `invitations` table via `createInvitation()` with a **different 40-char hex token** (line 217). Links coach to team via `team_coaches` if teamId provided (line 205). Queues email with invite URL.

- **Existing user** → `handleRoleElevation()` (line 116): Directly grants coach role via `grantRole()`, creates an active coaches record with `profile_id` already linked, assigns to team, sends a role elevation notification email. **No invite acceptance needed — works correctly.**

### Step 2: Email sent
**File:** `src/lib/email-service.js:194-216` (sendCoachInvite method)

Email is queued to `email_notifications` table with template type `coach_invite`. The email contains:
- `invite_link` / `cta_url`: The clickable URL
- `cta_text`: "Accept Invitation"
- Subject: "You're invited to coach at {orgName}!"

**The URL in the email** (InviteCoachModal.jsx line 234-236):
```javascript
const inviteUrl = pendingCoach
  ? `${window.location.origin}/invite/coach/${inviteCode}`  // 16-char code
  : `${window.location.origin}/join/coach/${orgId}`          // fallback
```

If the `coaches` insert succeeded (`pendingCoach` is truthy), the email URL is:
```
https://thelynxapp.com/invite/coach/{16-char-code}
```

If the `coaches` insert FAILED (`pendingCoach` is null/undefined), the fallback URL is:
```
https://thelynxapp.com/join/coach/{orgId}
```

**The shareable link shown in the modal UI** (line 39) is always:
```
thelynxapp.com/join/coach/{orgId}
```

### Step 3: Coach clicks link
**Two completely different outcomes depending on which URL:**

#### Path A: `/invite/coach/{16-char-code}` (email link, when coaches insert succeeded)
- **Route exists:** `src/App.jsx:84` → `<Route path="/invite/coach/:inviteCode" element={<CoachInviteAcceptPage />} />`
- **Component:** `src/pages/public/CoachInviteAcceptPage.jsx` renders
- This is the HAPPY PATH — the CoachInviteAcceptPage is a well-built public page that validates the invite, shows org branding, and offers signup/login

**POTENTIAL FAILURE:** The page queries `coaches` table with `.eq('invite_code', inviteCode)` (line 59). This is a PUBLIC route (no auth). If RLS on the `coaches` table blocks anonymous reads, this query returns nothing → "Invitation Not Found" error.

#### Path B: `/join/coach/{orgId}` (shareable link OR email fallback)
- **NO ROUTE EXISTS** for `/join/coach/`
- Matches catch-all `<Route path="/*" element={<AuthenticatedApp />} />` (App.jsx line 90)
- AuthenticatedApp requires auth → shows LandingPage (marketing homepage) for unauthenticated users
- **Coach lands on marketing homepage with zero context — THIS IS THE COWORK BUG**

### Step 4: Coach creates account
**If the coach reached CoachInviteAcceptPage (Path A):**
- Page shows org branding, role, team assignment details
- Coach can sign up (new account) or log in (existing account)
- Signup: `supabase.auth.signUp()` → creates profile → calls `acceptInvite()` → signs in → redirects to /dashboard
- Login: `supabase.auth.signInWithPassword()` → calls `acceptInvite()` → redirects to /dashboard

**If the coach landed on marketing homepage (Path B):**
- Coach has no context about the invite
- Coach sees generic "Sign In" / "Sign Up" buttons
- If coach signs up → goes through SetupWizard (onboarding)
- If coach enters invite code in wizard → **CODE IS REJECTED** (see Step 5)

### Step 5: Coach lands on dashboard
**If accepted via CoachInviteAcceptPage:** Dashboard renders correctly (coach role assigned, org linked, onboarding complete).

**If signed up generically:** Coach goes through SetupWizard. Selects "Coach / Team Manager" role. Sees three options:
1. "Start a new team" → Creates a separate micro-org (wrong org!)
2. "I have an invite code" → Code is rejected (wrong tables queried)
3. "I'll be added later" → Skips to dashboard with no org linked → infinite skeleton

---

## What's Broken and Why

### FAILURE POINT 1: `/join/coach/` route does not exist
**Evidence:** `src/App.jsx` has NO route for `/join/coach/:orgId` or `/join/coach/*`.
- Line 82: `/register/:orgIdOrSlug`
- Line 83: `/register/:orgIdOrSlug/:seasonId`
- Line 84: `/invite/coach/:inviteCode` ← exists
- Line 85: `/invite/parent/:inviteCode` ← exists
- Line 86: `/player-login`
- Line 87: `/reset-password`
- Line 90: `/*` ← catch-all (AuthenticatedApp)

The shareable link `thelynxapp.com/join/coach/{orgId}` (InviteCoachModal.jsx line 39) and the email fallback URL (line 236) both point to a non-existent route. Any coach who clicks this link lands on the marketing homepage.

### FAILURE POINT 2: Email URL uses 16-char code, but only when coaches insert succeeds
**Evidence:** `src/pages/coaches/InviteCoachModal.jsx:234-236`
```javascript
const inviteUrl = pendingCoach
  ? `${window.location.origin}/invite/coach/${inviteCode}`  // 16-char, works
  : `${window.location.origin}/join/coach/${orgId}`          // fallback, BROKEN
```
If the `coaches` table insert fails for any reason (RLS, missing column, constraint violation), `pendingCoach` is null and the email uses the broken `/join/coach/` URL. The error is only logged to console (line 201) — execution continues and the broken URL is sent.

### FAILURE POINT 3: Wizard invite code checks WRONG tables
**Evidence:** `src/pages/auth/SetupWizard.jsx:419-434`

The wizard's `useInviteCodeAction()` function queries:
1. `team_invite_codes` table (line 420) — checks `.eq('code', inviteCode.toUpperCase()).eq('is_active', true)`
2. `account_invites` table (line 428) — checks `.eq('invite_code', inviteCode.toUpperCase()).eq('status', 'pending')`

It does **NOT** query:
- `coaches` table (where the 16-char invite code lives in `coaches.invite_code`)
- `invitations` table (where the 40-char token lives in `invitations.invite_code`)

So any invite code from the email (whether 16-char or 40-char) will fail validation with "Invalid or expired invite code."

### FAILURE POINT 4: Two different invite codes, no cross-reference
**Evidence:**
- `InviteCoachModal.jsx:181` — generates 16-char code, stores in `coaches.invite_code`
- `InviteCoachModal.jsx:217` — calls `createInvitation()` which generates a separate 40-char token stored in `invitations.invite_code`
- Email URL uses the 16-char code
- CoachInviteAcceptPage queries `coaches.invite_code` (16-char) — matches
- Expiration check queries `invitations` table by `coach_id` (line 84-89) — works via FK, not code match
- Wizard queries neither table — always fails

### FAILURE POINT 5: Shareable link is a dead end
**Evidence:** `InviteCoachModal.jsx:39`
```javascript
const inviteLink = `thelynxapp.com/join/coach/${orgId}`
```
This link is displayed in the modal UI for admins to copy/share. It has no route handler. Any coach who receives this link via text, social media, or clipboard paste lands on the marketing homepage.

---

## What Exists But Isn't Wired

### CoachInviteAcceptPage — EXISTS and IS wired (mostly works)
- **File:** `src/pages/public/CoachInviteAcceptPage.jsx` (519 lines)
- **Route:** `/invite/coach/:inviteCode` (App.jsx line 84)
- **Import:** App.jsx line 14
- **Status:** Fully implemented, properly routed, NOT orphaned
- **Handles:** New signup, existing user login, email mismatch warning, expiration check, org branding, team display
- **Issue:** Only works when reached via `/invite/coach/{16-char-code}` URL. Coach must click the email link directly.

### SetupWizard coach path — EXISTS but queries wrong tables
- **File:** `src/pages/auth/SetupWizard.jsx`
- **Coach flow:** ROLE → COACH_PATH (line 733) → INVITE_CODE (line 846) → SUCCESS
- **Issue:** `useInviteCodeAction()` (line 415) checks `team_invite_codes` and `account_invites` — never checks `coaches` or `invitations`

### `/join/coach/` URL — Referenced but never routed
- **Referenced in:** InviteCoachModal.jsx (line 39, line 236), email-service.js (line 235 fallback)
- **Route defined:** NOWHERE
- **Should either:** Get a route handler that redirects to a coach application flow, or be removed entirely

---

## Recommended Fix (Exact Steps)

### Fix 1: Add `/join/coach/:orgId` route (Critical)
Create a public route that handles the shareable link. Two options:

**Option A (Simple redirect):** Route `/join/coach/:orgId` to a page that says "Contact your organization admin for a direct invite link" with the org's branding.

**Option B (Full join flow):** Create a `CoachJoinPage` that loads the org by ID, shows branding, and lets the coach submit a "request to join" (similar to how parents can self-register). This is more work but solves the shareable link use case.

**Minimum viable fix:** Add a redirect route in App.jsx:
```jsx
<Route path="/join/coach/:orgId" element={<CoachJoinRedirect />} />
```
Where `CoachJoinRedirect` shows the org name and tells the coach to check their email for a direct invite link, or contact the admin.

### Fix 2: Make email URL resilient (Critical)
In `InviteCoachModal.jsx`, don't send the email if `pendingCoach` is null — the broken fallback URL should never be sent:
```javascript
// Line 200-202: If coaches insert fails, STOP — don't send broken email
if (coachError) {
  throw new Error('Failed to create coach record. Please try again.')
}
```
This prevents the broken `/join/coach/` URL from ever being emailed.

### Fix 3: Add `coaches` table lookup to wizard (Medium)
In `SetupWizard.jsx:useInviteCodeAction()`, after the `team_invite_codes` and `account_invites` checks fail, add a third check against the `coaches` table:
```javascript
// After line 434, before throwing error:
const { data: coachInvite } = await supabase
  .from('coaches')
  .select('id, invite_code, invite_status, season_id')
  .eq('invite_code', inviteCode.toUpperCase())
  .eq('invite_status', 'invited')
  .maybeSingle()

if (coachInvite) {
  // Redirect to the proper accept page instead of handling inline
  window.location.href = `/invite/coach/${coachInvite.invite_code}`
  return
}
```
This way, if a coach enters the 16-char code from their email into the wizard, they get redirected to the proper CoachInviteAcceptPage.

### Fix 4: Fix shareable link URL (Low)
In `InviteCoachModal.jsx:39`, change the shareable link to point to a route that exists. Options:
- Use the org's registration page: `thelynxapp.com/register/{orgSlug}`
- Use a new coach application route: `thelynxapp.com/apply/coach/{orgId}`
- Or just remove the shareable link section until a proper route exists

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/App.jsx` | Add `/join/coach/:orgId` route | Critical |
| `src/pages/coaches/InviteCoachModal.jsx` | Throw error if coaches insert fails (don't send broken email) | Critical |
| `src/pages/coaches/InviteCoachModal.jsx` | Fix shareable link URL (line 39) | Low |
| `src/pages/auth/SetupWizard.jsx` | Add `coaches` table lookup in `useInviteCodeAction()` | Medium |
| NEW: `src/pages/public/CoachJoinPage.jsx` or redirect component | Handle `/join/coach/:orgId` | Critical |

---

## OAuth Button Status

### Where They Are
**File:** `src/pages/auth/LoginPage.jsx:162-179`
- Google: "Continue with Google" button (line 163-170)
- Apple: "Continue with Apple" button (line 171-178)

### How They Work
**File:** `src/contexts/AuthContext.jsx:227-245`
- Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- Apple: `supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin } })`

### Current State
- **Always shown** — no conditional rendering based on provider availability (LoginPage.jsx:162)
- **No check** for whether providers are configured in Supabase dashboard
- If a provider is not configured, clicking the button will error with a Supabase auth error message displayed in the login form's error banner

### Recommendation
- If Google/Apple OAuth is not configured in the Supabase project settings, the buttons should either be hidden or show a graceful "not available" message
- The simplest fix: wrap buttons in a check against environment variables or a feature flag:
  ```javascript
  {import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== 'false' && <GoogleButton />}
  ```
- Alternatively, add a try-catch that hides the button if the first attempt fails (already partially handled — errors show in the error banner)
- **Not blocking for coach onboarding** — these buttons are on LoginPage, not CoachInviteAcceptPage. The coach invite flow has its own signup/login forms that don't show OAuth buttons.

---

## Summary

The coach onboarding pipeline has **5 failure points** that compound into a completely broken experience:

1. **Shareable link (`/join/coach/`) has no route** → coach lands on marketing homepage
2. **Email fallback URL also uses `/join/coach/`** → broken if coaches insert fails
3. **Wizard invite code checks wrong tables** → code always rejected
4. **Two different invite codes** exist with no cross-reference in the wizard
5. **No error boundary** — coaches insert failure is swallowed and broken email is sent anyway

The core component that would fix everything — `CoachInviteAcceptPage` — **already exists and works**. The problem is that coaches can't reach it because:
- The shareable link points to `/join/coach/` (no route)
- The email might use `/join/coach/` as fallback
- Coaches who sign up generically can't enter the invite code in the wizard

The **minimum viable fix** is: (1) add a `/join/coach/:orgId` route, (2) prevent sending broken fallback URLs, and (3) add coaches table lookup to the wizard's invite code validation.
