# PHASE RESULTS: Parent Auth During Registration
**Date:** 2026-04-12
**Branch:** main
**Build:** PASS (all 4 phases built successfully with `npx vite build`)

### Phase 1: Password Fields on Registration Form — PASS
**Commit:** 02d3ffc
**Implementation:** Inline section below WaiversCard on the single-page registration form (not a new step — PublicRegistrationPage uses a single scrollable layout, not a multi-step stepper)
**Password validation:**
- Password must be >= 8 characters
- Password and confirmPassword must match
- Visual indicator: green checkmark when 8+ chars requirement met
- Submit button disabled until both conditions met
- Section hidden entirely when parent already has an existing auth account (detected via `checkExistingAccount()` from invite-utils)

### Phase 2: Auth Account Creation on Submit — PASS
**Commit:** 0112040
**Variable names used:**
- parentEmail from `sharedInfo.parent1_email.trim().toLowerCase()`
- parentName from `sharedInfo.parent1_name`
- organizationId from `organization?.id`
- familyId from local variable in handleSubmit
- createdPlayerIds from array built during player creation loop
**Tables written to:**
- `profiles` — upsert with id, email, full_name, phone, current_organization_id, onboarding_completed
- `user_roles` — via `grantRole(authUserId, organization?.id, 'parent')`
- `players` — update `parent_account_id` to link children to auth user
**Already-registered handling:** If signUp returns "already registered" or "already exists", logs and continues without error. Registration data is preserved regardless of auth outcome.

### Phase 3: Success Screen Update — PASS
**Commit:** 01e7f92
**Auth success state:** Shows "Your account is ready!" with sky-blue info card displaying login email and "Sign In to Your Dashboard" CTA linking to /login
**Auth failure state:** Falls back to existing "Create Account" button with invite link (unchanged from original)
**Three states handled:** hasSession (Go to Dashboard), authCreated (Sign In to Dashboard), fallback (Create Account via invite)

### Phase 4: Login Page Fallback (Parents + Coaches) — PASS
**Commit:** b2956eb
**Mini-investigation findings:**
- Coach invite table: `coaches` (primary, stores invite_code) + `invitations` (tracking)
- Coach invite_type value: `'coach'` in invitations table
- Coach role values: `head`, `assistant`, `manager`, `volunteer` in team_coaches; mapped to `head_coach`, `assistant_coach`, `team_manager` in user_roles
- Coach invite URL pattern: `/invite/coach/:inviteCode` (from coaches.invite_code)
- Coach join fallback URL: `/join/coach/:orgId`
- Coach invite_status: `'invited'` (pending), `'active'` (accepted)
**Parent recovery flow:**
1. On "Invalid login credentials", checks `families.primary_email` for match
2. Verifies no existing `profiles` record (confirms truly no auth account)
3. Shows recovery card: "We found a registration for {name}!"
4. Clicks "Set Up My Account" → looks for existing parent invite in invitations table
5. If no invite found, creates one on-the-fly with 72h expiration
6. Redirects to `/invite/parent/:inviteCode`
**Coach recovery flow:**
1. Checks `coaches` table for email with `invite_status = 'invited'`
2. Also checks `coaches` table for any record (active coach without auth)
3. Shows recovery card: "We found a coaching invitation for {email}!"
4. Clicks "Accept My Invitation" → redirects to `/invite/coach/:inviteCode` if code exists
5. Falls back to `/join/coach/:orgId` if no invite code but org found
**Recovery state clears on email change**

## Issues Encountered
- PublicRegistrationPage is NOT a multi-step form — it's a single scrollable page. The spec assumed steps but the actual form uses inline sections. Adjusted Phase 1 to use inline approach (spec's recommended approach).
- `families` table does NOT have an `account_id` column. The correct link is via `players.parent_account_id`. Adjusted Phase 2 accordingly.
- `profiles` table uses `current_organization_id` not `organization_id`, and does NOT have a `role` column. Adjusted profile upsert.
- Used `grantRole()` from invite-utils instead of raw `user_roles` upsert for consistency.
- Coach invite data lives primarily in `coaches` table (invite_code, invite_status, invite_email), not in `invitations` table (which is secondary tracking).
- Build exit code is 1 due to pre-existing chunk size warning (>500kB), but build succeeds (~12.5s).

## Testing Notes
To test the full flow:
1. Open incognito window
2. Go to registration link for any season
3. Fill out form, create password on review step
4. Submit — verify auth account creation (check console for "Auth account created" log)
5. Open new incognito window
6. Go to /login — enter the email and password from step 3
7. Should log in successfully and see parent dashboard

To test login recovery:
1. For a parent who registered before this fix (no auth account):
   - Go to /login, enter their registration email with any password
   - Should see "We found a registration for {name}!" recovery card
   - Click "Set Up My Account" → redirected to invite acceptance page
2. For a coach who was invited but never accepted:
   - Go to /login, enter their email with any password
   - Should see "We found a coaching invitation for {email}!" recovery card
   - Click "Accept My Invitation" → redirected to coach invite page
