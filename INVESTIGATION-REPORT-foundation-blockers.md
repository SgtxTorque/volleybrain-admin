# INVESTIGATION REPORT: Foundation Blockers
**Date:** 2026-04-12
**Branch:** main
**Latest commit:** 55dc518 docs: update parity log with full April 11-12 sprint changes

---

## 1. setup_complete Flag

### Where It's Read

| File | Line | What It Gates | When `false` | When `true` |
|------|------|---------------|-------------|-------------|
| `src/MainApp.jsx` | 877 | `hasOrgSetup` for top-nav gating | Top-nav links for payments, paymentsetup, chats, blasts, notifications show locked (tooltip + not-allowed cursor) | All top-nav links unlocked |
| `src/components/layout/LynxSidebar.jsx` | 483 | `hasOrgSetup` for sidebar gating | Sidebar `money` group locked (muted, opacity 0.45, lock icon, not-allowed cursor) | Sidebar fully unlocked |
| `src/pages/dashboard/DashboardPage.jsx` | 70 | `foundationDone` — controls first-load coach marks | Coach marks (highlight onboarding CTAs) fire on first page load | Coach marks skipped |
| `src/pages/dashboard/DashboardPage.jsx` | 83 | `setupFlowComplete` — controls resume banner | "Resume Setup" banner displayed on admin dashboard | Banner hidden |
| `src/pages/dashboard/DashboardPage.jsx` | 108 | Journey step completion | `org_setup` step remains incomplete | `org_setup` step marked done |
| `src/lib/engagement-constants.js` | 65 | XP award constant | N/A | Awards 100 XP via `org_setup_complete` source type |

### Where It's Written

**Single location — `src/pages/setup/FirstRunSetupPage.jsx` lines 334-360:**

```
handleSetupComplete() →
  1. supabase.from('organizations').update({ settings: { ...prev, setup_complete: true, setup_completed_at: ISO } })
  2. Updates AuthContext local state
  3. Completes journey step 'org_setup'
  4. Awards 100 XP (org_setup_complete source)
```

**There is NO other code path that sets `setup_complete = true`.** It can only be set via the `/setup` wizard (FirstRunSetupPage). It cannot be toggled from the organization settings page or any admin UI. The only alternative is a manual DB update.

### ADMIN_NAV_PREREQS Map (Current State)

**LynxSidebar.jsx (lines 29-37) — SIDEBAR:**

| Group ID | Prerequisite | Items Gated | Status |
|----------|-------------|-------------|--------|
| `teams-rosters` | `season` | Teams, Rosters | ACTIVE |
| `registration` | `season` | Registrations, Waivers, Templates | ACTIVE |
| `scheduling` | `season` | Schedule, Venues, Events | ACTIVE |
| `practice` | `season` | Practice, Training | ACTIVE |
| `game` | `season` | Game Prep, Standings, Leaderboards | ACTIVE |
| `money` | `orgSetup` | Payments, Payment Setup | ACTIVE |
| `insights` | `season` | Reports, Registration Funnel, Archives | ACTIVE |
| ~~`communication`~~ | ~~`orgSetup`~~ | ~~Chats, Blasts, Notifications~~ | **REMOVED** (commit e71f101) |

**MainApp.jsx (lines 848-870) — TOP NAV:**

| Page ID | Prerequisite | Status |
|---------|-------------|--------|
| teams, coaches, jerseys, registrations, templates, registration-funnel, schedule, attendance, coach-availability, gameprep, standings, leaderboards, reports, venues | `season` | ACTIVE |
| payments, paymentsetup | `orgSetup` | ACTIVE |
| **chats, blasts, notifications** | **`orgSetup`** | **STILL GATED — NOT REMOVED** |

**DISCREPANCY FOUND:** The April 12 fix (commit e71f101) removed the `communication` gate from `ADMIN_NAV_PREREQS` in LynxSidebar.jsx, but the **TOP_NAV_PREREQS in MainApp.jsx still gates chats, blasts, and notifications behind `orgSetup`** (lines 867-869). If admins use the top nav bar instead of the sidebar, communication is still locked for orgs with `setup_complete = false`.

### Settings Object Structure

- **Column type:** JSONB column `settings` on the `organizations` table
- **Fetched in:** `src/contexts/AuthContext.jsx` line 165 via `supabase.from('organizations').select('*').eq('id', orgId)`
- **Full schema defined in:** `src/pages/setup/FirstRunSetupPage.jsx` lines 62-180

**Key categories in settings JSONB:**

| Category | Keys |
|----------|------|
| Identity | `short_name`, `tagline`, `primary_color`, `secondary_color`, `org_type`, `founded_year`, `mission` |
| Contact | `contact_name`, `contact_title`, `secondary_email`, `phone`, `address`, `city`, `state`, `zip`, `timezone`, `office_hours` |
| Online | `website`, `facebook`, `instagram`, `twitter` |
| Sports | `enabled_sports`, `program_types`, `age_system`, `age_cutoff_date`, `skill_levels`, `gender_options` |
| Legal | `legal_name`, `entity_type`, `ein`, `insurance_provider`, `insurance_policy_number` |
| Payment Config | `payment_methods`, `allow_payment_plans`, `payment_plan_installments`, `late_fee_amount`, `grace_period_days` |
| Default Fees | `default_registration_fee`, `default_uniform_fee`, `default_monthly_fee`, `early_bird_discount`, `sibling_discount`, `multi_sport_discount` |
| Branding | `branding: { primary_color, secondary_color, tagline }` |
| Setup Tracking | `setup_complete`, `setup_completed_at` |

### Impact Assessment

**If we set `setup_complete = true` for all test orgs:**
- Nothing breaks functionally — the flag only controls UI gating
- Payment nav items unlock (admins could configure payments before entering legal info, but that's acceptable for beta)
- Dashboard onboarding prompts disappear (resume banner, coach marks)
- Risk: **LOW** — purely UX progression, not data integrity

**If we remove the `orgSetup` gate entirely from nav:**
- Only the `money` sidebar group and `payments`/`paymentsetup`/`chats`/`blasts`/`notifications` top-nav items would unlock
- All `season`-gated items remain locked (still need at least one season)
- Risk: **LOW** — payments page still works without setup, just missing org legal details

**Is it serving a legitimate purpose?**
- YES for payments — admins should fill in legal/payment details before accepting money
- NO for communication — already fixed in sidebar but **still broken in top nav** (see discrepancy above)
- The onboarding UX (resume banner, coach marks) is a legitimate progressive-disclosure pattern

### Recommendation

1. **IMMEDIATE FIX (P0):** Remove `chats`, `blasts`, `notifications` from `TOP_NAV_PREREQS` in `MainApp.jsx` lines 867-869 — this was missed in the April 12 commit that fixed the sidebar
2. **BETA WORKAROUND:** For test orgs stuck with `setup_complete = false`, either:
   - Have admins complete the `/setup` wizard, OR
   - Run a manual DB update: `UPDATE organizations SET settings = settings || '{"setup_complete": true}' WHERE id = '<org-id>'`
3. **KEEP the gate** for payments — it serves a real purpose (prevents payment config before legal info)

---

## 2. .well-known Files

### Files Found

**The `public/.well-known/` directory does NOT exist.** No `.well-known` files are present anywhere in the repo.

### Vercel Configuration

`vercel.json` (lines 2-7) is **correctly pre-configured** to serve these files:

```json
{
  "rewrites": [
    { "source": "/.well-known/apple-app-site-association", "destination": "/.well-known/apple-app-site-association" },
    { "source": "/.well-known/assetlinks.json", "destination": "/.well-known/assetlinks.json" },
    ...
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- Rewrite rules are placed BEFORE the catch-all SPA rule
- `Content-Type: application/json` header is set for `.well-known/*` (lines 11-13)
- Configuration is correct — files just need to be created

### Placeholder Values

No placeholders exist because files were never created. When created, they need:

**apple-app-site-association** (no file extension):
- Apple Team ID (from Apple Developer Portal)
- Bundle ID (from volleybrain-mobile3 app.json / Xcode config)
- URL paths to handle (`/invite/*`, `/join/*`, `/register/*`)

**assetlinks.json:**
- Android package name (from volleybrain-mobile3 android/app/build.gradle)
- SHA-256 fingerprint (from Android signing certificate)

### Priority

**DEFER — not blocking anything right now.**

- These files are ONLY needed for mobile deep linking (Universal Links on iOS, App Links on Android)
- The web admin portal works correctly without them
- They are NOT needed until the mobile app goes to App Store / Play Store
- Current behavior: shared links (invite, registration) open in the browser — functional, just not app-native

### Recommendation

1. **No action needed now** — defer until mobile app store submission prep
2. When ready, get real values from the mobile repo (`volleybrain-mobile3`) and create:
   - `public/.well-known/apple-app-site-association`
   - `public/.well-known/assetlinks.json`
3. Vercel config is already correct — no changes needed there
4. **Severity: NONE** — not causing any user-facing issues

---

## 3. Parent Re-Login Failure

### Registration Auth Flow

**Registration does NOT create a Supabase auth account.**

Evidence:
- `src/pages/public/PublicRegistrationPage.jsx` — zero calls to `supabase.auth.signUp()` anywhere in the file (confirmed via grep)
- `src/pages/public/RegistrationCartPage.jsx` — zero calls to `supabase.auth.signUp()` anywhere in the file (confirmed via grep)

**What registration DOES create (PublicRegistrationPage.jsx lines 570-808):**

| Step | Table | Key Fields | Auth Account? |
|------|-------|-----------|--------------|
| 1 | `families` | `primary_email`, `primary_contact_name`, `primary_phone` | NO |
| 2 | `players` | `first_name`, `last_name`, `family_id`, `parent_email`, `parent_name` | NO |
| 3 | `registrations` | `player_id`, `season_id`, `status='pending'`, `waiver_signatures` | NO |
| 4 | `invitations` | `email`, `invite_type='parent'`, `role='parent'`, `invite_code` | NO — creates invite, not auth user |

### Post-Registration State

After a parent submits registration:
- **In DB:** `families` row + `players` row(s) + `registrations` row(s) + `invitations` row — all linked by email, NOT by auth user ID
- **In Supabase Auth:** **Nothing** — no auth user record exists
- **On screen:** SuccessScreen shows "Create Account" button linking to `/invite/parent/{inviteCode}` (`RegistrationScreens.jsx` line 287)

**The invite flow is the ONLY account creation mechanism:**
- `src/pages/public/ParentInviteAcceptPage.jsx` line 183: `supabase.auth.signUp({ email, password })` — creates the actual auth account
- This page also creates a `profiles` record, links players/families to the auth user, and grants the `parent` role

### Login Flow

**`src/pages/auth/LoginPage.jsx` line 59-60:**
```javascript
if (mode === 'login') {
  await signIn(email, password)
```

**`src/contexts/AuthContext.jsx` lines 198-206:**
```javascript
async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error  // ← "Invalid login credentials" comes from here
}
```

The error is thrown directly by Supabase when either:
- The email has no auth record, OR
- The password doesn't match

### Root Cause

**The parent's auth account was never created because they did not click the invite link.**

The flow gap:
1. Parent fills out registration form with email "parent@example.com"
2. Registration creates `families`, `players`, `registrations`, `invitations` records — all linked by email only
3. SuccessScreen shows "Create Account" button linking to `/invite/parent/{code}`
4. Parent closes the browser / ignores the button / misses the email
5. Parent later goes to `/login` and enters "parent@example.com" + a password
6. Supabase Auth has NO record for this email → **"Invalid login credentials"**

**Additional failure modes:**
- If `createInvitation()` throws (line 805), `parentInviteUrl` stays `null`, and the "Create Account" button links to `/` (homepage) instead of the invite page — parent sees login page, tries to log in, fails
- If the confirmation email fails to send (line 812), parent has no email with the invite link
- The SuccessScreen does NOT explain that they MUST click "Create Account" before they can log in — it looks optional
- The LoginPage does have a sign-up mode toggle (line 32), but if a parent uses it to create an account, their new auth user won't be linked to their `families`/`players`/`registrations` records (they'd be an orphan user)

### Recommended Fix

**Option A (Recommended — simplest, highest impact):**
Improve the SuccessScreen UX to make account creation unmissable:
- Change "Create Account" button text to "Set Up Your Password" or "Create Your Login"
- Add prominent warning: "You MUST create an account to view your registration status and make payments"
- If `inviteUrl` is null (invite creation failed), show a fallback: "Check your email for account setup instructions" or provide a way to request a new invite link

**Option B (Best long-term fix):**
Create the auth account during registration itself:
- After creating registrations, call `supabase.auth.signUp({ email, password })` with the password the parent entered
- Add a "Create Password" field to the registration form
- Link `families.account_id` to the new auth user ID
- Skip the invitation step entirely for self-registering parents

**Option C (Quick backend fix):**
Add a "Resend Invite" or "Create Account" prompt on the login page:
- When login fails, check if the email exists in `families` or `registrations` tables
- If yes, show: "We found your registration! Click here to set up your login." → triggers new invite creation
- This catches parents who missed the original invite link

| Option | Effort | Impact | Risk |
|--------|--------|--------|------|
| A — UX fix on SuccessScreen | Small | Medium — reduces but doesn't eliminate problem | Low |
| B — Auth during registration | Medium | High — eliminates the problem entirely | Medium — needs password field in reg form |
| C — Login page fallback | Small | High — catches all missed invites | Low |

**Recommended approach:** Do Option C first (quick win, catches existing affected parents), then Option B for new registrations.

---

## Summary

| Blocker | Severity | Fix Effort | Recommendation |
|---------|----------|------------|----------------|
| `setup_complete` — top nav still gates communication | **P0 (bug)** | 5 min | Remove chats/blasts/notifications from TOP_NAV_PREREQS in MainApp.jsx:867-869 |
| `setup_complete` — test orgs stuck at false | **P1** | 10 min | Have admins run `/setup` wizard, or manual DB update |
| `.well-known` files | **P3 (defer)** | N/A | Not blocking anything — defer until mobile app store submission |
| Parent re-login failure | **P0 (critical)** | 1-2 hrs | Option C (login page fallback) first, then Option B (auth during reg) |
