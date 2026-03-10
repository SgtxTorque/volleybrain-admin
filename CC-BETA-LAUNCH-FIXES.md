# CC-BETA-LAUNCH-FIXES.md
## Lynx Web Admin -- Beta Launch Critical Fixes
### For Claude Code Execution

**Repo:** volleybrain-admin
**Branch:** feat/desktop-dashboard-redesign
**Backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**Date:** March 8, 2026

---

## RULES (READ FIRST -- APPLY TO ALL PHASES)

1. **Read CLAUDE.md and DATABASE_SCHEMA.md** in the project root before doing anything.
2. **Read each file FULLY before modifying it.** Understand every import, hook, and render block.
3. **Preserve all existing Supabase queries.** Never replace working queries with mock data.
4. **Do NOT touch these files:** `src/contexts/*`, `src/lib/supabase.js`, `src/lib/routes.js`.
5. **Use the existing theme system.** Use `useTheme()`, `useThemeClasses()`, `isDark`. Support both light and dark modes.
6. **Font:** Inter Variable (already in public/fonts/ and tailwind.config.js as `font-sans`).
7. **Tailwind only** -- use existing Lynx tokens from tailwind.config.js (`lynx-navy`, `lynx-sky`, etc.).
8. **Commit after each phase** with the message format shown.
9. **Test that the app builds cleanly** (`npm run build`) after each phase.
10. **No em dashes** in any user-facing text.

---

## PHASE 1: Add Forgot Password to Login Page

**File:** `src/pages/auth/LoginPage.jsx`

**What to do:**

1. Read the full LoginPage.jsx file.
2. Import `supabase` from `../../lib/supabase`.
3. Add a `resetSending` state (boolean, default false).
4. Add a `handleForgotPassword` async function:
   - If email is empty, set error to "Please enter your email address first"
   - Set resetSending = true
   - Call `await supabase.auth.resetPasswordForEmail(email.trim())`
   - On success, set message to "Password reset link sent! Check your email."
   - On error, set error to the error message
   - Set resetSending = false
5. Add a "Forgot password?" link below the password input field, ONLY visible when mode === 'login'.
   - Style: `text-sm text-slate-400 hover:text-[var(--accent-primary)] transition cursor-pointer mt-1`
   - On click, call handleForgotPassword
   - If resetSending is true, show "Sending..." instead of "Forgot password?"

**Commit:** `Beta fix 1: add forgot password to login page`

---

## PHASE 2: Improve Registration Success Screen

**File:** `src/pages/public/RegistrationScreens.jsx`

**What to do:**

1. Read the full RegistrationScreens.jsx file.
2. Find the `SuccessScreen` component.
3. After the fee preview card (or at the bottom of the success card), add three sections:

**Section A -- "Create Your Account" CTA:**
```
What's next?
Create a Lynx account to track your registration status, manage payments, and stay connected with your team.
[Create Account] button -- links to the root URL "/" (which shows the login page with signup toggle)
```
- Style the button like the existing Lynx brand: `bg-lynx-sky text-white font-semibold py-3 px-8 rounded-[14px] hover:brightness-110 transition`
- Below the button, add small text: "Use the same email you registered with"

**Section B -- "Download the App" (informational):**
```
Get the Lynx App
Download the mobile app for game day updates, real-time notifications, and more.
Coming soon to App Store and Google Play
```
- Use a muted style since the app isn't published yet -- just `text-r-xs text-slate-400`
- No store links yet, just the "coming soon" line

**Section C -- Organization contact info:**
- If the organization data is available (passed as prop), show:
  "Questions? Contact [org name]" with the org email if available
- If not available, skip this section

4. Update the SuccessScreen props to accept `organization` (optional) alongside existing props.
5. Check PublicRegistrationPage.jsx to see if `organization` state is available at the point where SuccessScreen renders, and pass it through if so.

**Commit:** `Beta fix 2: improve registration success screen with account CTA and next steps`

---

## PHASE 3: Fix SetupWizard Hardcoded Volleyball

**File:** `src/pages/auth/SetupWizard.jsx`

**What to do:**

1. Read the full SetupWizard.jsx file (all 535 lines, including the sub-components at the bottom).
2. Find the two places where organizations are created with hardcoded volleyball:
   - `createOrganization` function: `settings: { sports: ['volleyball'] }`
   - `createIndependentTeam` function: `settings: { sports: ['volleyball'] }`
3. Replace the hardcoded `{ sports: ['volleyball'] }` with `{}` (empty settings object). The actual sport association happens when the admin creates a season and picks a sport -- the org settings don't need to hardcode a sport.
4. Update the placeholder text:
   - In the ORG_INFO step: change `"e.g., Black Hornets Volleyball"` to `"e.g., Black Hornets Athletics"`
   - In the INDEPENDENT_TEAM_INFO step: change `"e.g., Dallas Elite 14U"` to keep as-is (this is sport-agnostic already)

**Commit:** `Beta fix 3: remove hardcoded volleyball from setup wizard`

---

## PHASE 4: Verify and Fix Registration-to-Account Pipeline

**Files to read:** `src/pages/public/PublicRegistrationPage.jsx`, `src/pages/parent/ClaimAccountPage.jsx`, `src/App.jsx`

**What to do:**

1. Read PublicRegistrationPage.jsx fully. Find where `submitted` state is set to `true` and the SuccessScreen is rendered.
2. Verify that the `organization` object is in scope when SuccessScreen renders. If it is, pass it:
   ```jsx
   <SuccessScreen
     childrenCount={children.length}
     seasonName={season?.name}
     totalFee={...}
     currentChildName={...}
     organization={organization}  // ADD THIS
   />
   ```
3. Read ClaimAccountPage.jsx. Verify it:
   - Detects orphan players (parent_email matches the logged-in user's email but parent_account_id is null)
   - Links them by updating parent_account_id
   - Redirects to dashboard after linking
4. Read App.jsx. Verify ClaimAccountPage has a route. If not, add one:
   - In MainApp.jsx's RoutedContent, add: `<Route path="/claim-account" element={<ClaimAccountPage showToast={showToast} />} />`
   - Verify the import exists at the top of MainApp.jsx
5. Check if ClaimAccountPage is already imported and routed. If it's already there, just confirm it works and move on.

**Commit:** `Beta fix 4: wire registration-to-account pipeline`

---

## PHASE 5: Verify Build and Push

1. Run `npm run build` -- must complete with zero errors.
2. Fix any build errors found.
3. Run `git add -A && git commit -m "Beta launch fixes: forgot password, success screen, wizard fix, pipeline" && git push`

---

## DONE

After this spec completes, Carlos needs to:
1. Merge this branch to main
2. Point app.thelynxapp.com domain
3. Smoke test the full admin journey
4. Hand off to Marisa
