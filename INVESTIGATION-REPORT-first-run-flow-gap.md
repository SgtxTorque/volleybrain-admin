# INVESTIGATION REPORT: First-Run Flow Gap
**Date:** 2026-04-13

---

## Gap 1: Age Division Text Unreadable

- **Component:** `src/pages/settings/SetupSectionContent.jsx:572-603`
- **What renders:** The `sports` step in the FirstRunSetupPage reuses SetupSectionContent which renders two toggle buttons ("Grade-Based" / "Age-Based") and a row of division chips (8U, 10U, 12U, 14U, 16U, 18U or K-2nd, 3rd-5th, etc.)
- **Root cause:** The age system toggle buttons (lines 551-570) use Tailwind dynamic classes that reference `var(--accent-primary)` for the active state border/background:
  ```
  border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-medium
  ```
  But **no explicit text color** is set on either state. In the inactive state, the button just uses `${tc.border}` with no text color class at all — so text color is inherited, which may be invisible against the background depending on the theme.

  For the division chips (lines 580-600), the inactive state uses `${tc.border} ${tc.textMuted}` which in dark mode means very faint border + muted grey text. On many displays, especially with the thin `border-2` and muted text color, these appear nearly invisible.

- **Fix effort:** **S** — Add explicit text color classes to both the toggle buttons and the division chips for both active and inactive states.

---

## Gap 2: Sports Don't Auto-Create Programs

- **What the wizard saves:** The FirstRunSetupPage saves sports to `organization.settings.enabled_sports` as an array of strings (e.g., `['volleyball', 'basketball', 'softball']`). See `FirstRunSetupPage.jsx:237-244`.
- **Does it create programs:** **NO.** The `saveSection('sports', data)` call only updates `organization.settings` with the list of enabled sports. It does NOT insert rows into the `programs` table.
- **Where programs ARE created:** The INITIAL signup wizard (`src/pages/auth/SetupWizard.jsx:300-343`) creates **exactly ONE program** for the ONE sport selected during account creation. It does this correctly:
  - Looks up the sport record in the `sports` table
  - Inserts into `programs` with the sport_id, name, and organization_id
  - Has a fallback to create a "General" program if all else fails
- **The disconnection:**
  1. SetupWizard (signup) creates **1 program** for **1 sport**
  2. FirstRunSetupPage (post-signup setup) lets admin select **multiple sports** but only saves them as `enabled_sports` in settings — **no additional programs are created**
  3. Admin expects Volleyball, Basketball, and Softball programs in the sidebar. Only Volleyball exists.
- **Fix approach:** The FirstRunSetupPage's `saveSection('sports', ...)` should diff `enabled_sports` against existing programs and auto-create missing program records. Alternatively, add a "Create Program" CTA after the wizard.
- **Fix effort:** **M**

---

## Gap 3: "Create First Season" Goes to Dead End

- **Navigates to:** `/settings/seasons` (see `FirstRunSetupPage.jsx:402`)
- **Button text:** "Create First Season →" (celebration screen after wizard completion)
- **Why it's a dead end:** The SeasonsPage (`src/pages/settings/SeasonsPage.jsx:294-301`) shows:
  ```
  "No seasons yet"
  "Seasons are created within programs. Go to a program page to add your first season."
  ```
  There is **NO "Create Season" button** on this page. It tells the user to navigate to a program page instead. But for a brand-new admin who just completed setup, they don't know where the program page is or that programs even exist.
- **Double dead-end:** If Gap 2 isn't fixed (additional sports don't create programs), the admin also can't navigate to program pages for the sports they configured.
- **Fix approach:** Either:
  1. Change the CTA to navigate to the program page directly (e.g., `/programs/{first-program-id}`) where `ProgramEmptyState` has a working "Create First Season" button, OR
  2. Add a "Create Season" button to SeasonsPage when programs exist
- **Fix effort:** **S**

---

## Gap 4: Dashboard Cards Out of Order

- **Are cards conditional:** **NO.** All 4 EmptyStateCTA cards are always shown when `foundationDone` is true (`DashboardPage.jsx:278-290`):
  1. "Create Your First Season" → navigates to `seasons`
  2. "Add Your First Team" → navigates to `teams`
  3. "Open Registration" → navigates to `registration-templates`
  4. "Create Schedule" → navigates to `schedule`
- **All 4 are active and clickable** regardless of whether prerequisites are met.
- **The text acknowledges dependencies** — card #3 says "Create a season first, then open registration for families" — but the button is still active.
- **Which cards should be disabled:**
  - "Add Your First Team" — requires a season first
  - "Open Registration" — requires a season first
  - "Create Schedule" — requires a season and teams first
- **The setup roadmap stepper** (lines 245-276) DOES have a proper `isLocked` mechanism with `prerequisitesMet` checks. The stepper correctly greys out steps whose prerequisites aren't done. But the 4 CTA cards below it ignore this entirely.
- **Does "Create Season" card work?** It navigates to `seasons` page which is SeasonsPage — same dead-end from Gap 3.
- **Fix approach:** Either grey out / disable cards when prerequisites aren't met, or remove the 4-card grid entirely and rely on the stepper (which already has proper dependency logic).
- **Fix effort:** **S**

---

## Gap 5 + 9: Fee Inheritance Not Working

### Season creation forms found:

| File | Reads org settings? | Default fees |
|------|---------------------|-------------|
| `src/pages/settings/SeasonsPage.jsx:35-51` | **YES** ✅ | `orgSettings.default_registration_fee ?? 150` / `orgSettings.default_uniform_fee ?? 45` / `orgSettings.default_monthly_fee ?? 50` |
| `src/pages/programs/ProgramPage.jsx:187-192, 503-510` | **NO** ❌ | `fee_registration: 0, fee_uniform: 0, fee_monthly: 0` |

### Root cause:
**ProgramPage.jsx hardcodes all fees to `0`.** Both the initial state (line 190) and the `openSeasonModal()` function (line 508) set:
```js
fee_registration: 0, fee_uniform: 0, fee_monthly: 0, months_in_season: 1,
```

This means:
- If admin creates a season from **SeasonsPage** → fees inherit from org settings ✅
- If admin creates a season from **ProgramPage** (via "Create First Season" button, or New Season quick action) → fees default to **$0/$0/$0** ❌

### The specific form Carlos used:
Carlos most likely navigated from the dashboard GettingStartedGuide → to a program page → clicked "Create First Season" → which opened ProgramPage's SeasonFormModal with $0 defaults. He may have manually adjusted some values, which explains the mix of $150/$50/$10 he reported.

### Additional issue with SeasonsPage:
The SeasonsPage reads org settings correctly BUT uses the `??` (nullish coalescing) operator. If the org settings have `default_registration_fee: 0` (not null, just zero), the `??` won't trigger the fallback. However if the first-run setup saved the values correctly, this should work fine. The real problem is ProgramPage ignoring org settings entirely.

### Fix:
ProgramPage's `openSeasonModal()` needs to read `organization.settings` and pre-fill fees the same way SeasonsPage does.

- **Fix effort:** **S** — Just change the defaults in `openSeasonModal()` and the initial `seasonForm` state.

---

## Gap 6: Default Form No Context

- **Component:** `src/pages/settings/SeasonFormModal.jsx:224-263` (RegistrationTab)
- **What "default" means:** When "Use default form" is selected (`<option value="">Use default form</option>`), no `registration_template_id` is set and no `registration_config` is applied. The system falls back to its built-in default registration fields (player info, parent info, emergency contact, medical info — presumably hardcoded elsewhere in the registration flow).
- **What's shown:** Just a dropdown with "Use default form" as the first option, plus any custom templates. Below it: "Select which registration form to use for this season. Manage templates" (where "Manage templates" links to `/templates`).
- **What's missing:**
  1. No explanation of what fields the default form collects
  2. No preview of the default form
  3. No inline customization from within the season creation flow
  4. The "Manage templates" link opens `/templates` in a new tab — which may not exist as a route
- **Fix approach:** Add helper text below the dropdown explaining what the default form collects (e.g., "Collects player info, parent contact, emergency contact, and medical info"). Optionally add a "Preview Default Form" link.
- **Fix effort:** **S**

---

## Gap 7: Form Section Dividers

- **Component:** `src/pages/settings/SeasonFormModal.jsx:377-593` (FeesTab)
- **Current separation:**
  - **Registration tab** (lines 224-370): Has proper `border-t ${tc.border} pt-4 mt-4` dividers between "Registration Windows", "Early Bird & Late Registration", and "Capacity" sections ✅
  - **Fees tab** (lines 377-593): Uses only `<h4>` headers with `uppercase tracking-wide` and `mt-6` spacing between "Per-Player Fees", "Per-Family Fee", and "Sibling Discount" sections. **No `border-t` or `<hr>` dividers** between sections ❌
  - The Fee Summary card at the bottom has a `border-t` inside it, but the main fee sections blend together
- **Result:** Per-Player Fees, Per-Family Fee, and Sibling Discount sections visually blur into one long form. Early Bird, Late Registration, and Capacity also stack without clear boundaries in the fees context.
- **Fix approach:** Add `border-t ${tc.border} pt-4 mt-4` dividers before each `<h4>` section header in the Fees tab (matching the Registration tab pattern).
- **Fix effort:** **S**

---

## Gap 8: Staff Portal Post-Creation

- **LifecycleTracker step:** "Assign coaches to teams" → `navigateTo: '/coaches'` with CTA label "Go to Staff Portal" (`LifecycleTracker.jsx:30-37`)
- **CoachesPage** (`/coaches`):
  - Has TrackerReturnBanner: **YES** ✅ (line 349)
  - Has TrackerSuccessPopup: **YES** ✅ (line 429, shows "Coach Added!" with return button)
- **StaffPortalPage** (`/staff-portal`):
  - Has TrackerReturnBanner: **YES** ✅ (line 16, renders at top of page)
  - Has TrackerSuccessPopup: **NO** ❌ (not imported, no `trackerSuccessInfo` state)

### The confusion:
The LifecycleTracker CTA says **"Go to Staff Portal"** but actually navigates to `/coaches` (CoachesPage). If the admin navigates directly to the actual Staff Portal (`/staff-portal`) instead — for example via the sidebar — the TrackerReturnBanner shows but there's no success popup after creating a coach/staff member.

### Fix:
1. Add TrackerSuccessPopup to StaffPortalPage (matching the pattern in CoachesPage)
2. OR change the CTA label from "Go to Staff Portal" to "Go to Coaches" to match the actual navigation target
3. Ideally: both — fix the label AND add the popup to StaffPortalPage for consistency

- **Fix effort:** **S**

---

## Summary Priority Order

1. **Gap 5+9: ProgramPage fee inheritance** — CRITICAL. Every season created from ProgramPage gets $0 fees. One-line fix (read org settings instead of hardcoding 0). This is the most impactful bug.
2. **Gap 2: Sports don't auto-create programs** — CRITICAL. Multi-sport orgs are broken from day one. Admin selects 3 sports, only 1 program exists. Everything downstream (seasons, teams, schedule) is scoped to programs.
3. **Gap 3: "Create First Season" → dead end** — HIGH. The primary CTA after completing setup sends the admin to a page that says "go somewhere else." 100% of new admins hit this.
4. **Gap 4: Dashboard cards out of order** — MEDIUM. Misleading but not blocking — admin can still click "Create Season" (though it goes to the same dead end from Gap 3). The stepper above already has proper locking.
5. **Gap 1: Age division text unreadable** — MEDIUM. Visual issue that makes the sports step confusing. Quick CSS fix.
6. **Gap 8: Staff Portal missing success popup** — MEDIUM. The tracker actually goes to `/coaches` which works correctly. Only an issue if admin navigates to `/staff-portal` directly.
7. **Gap 7: Fee form section dividers** — LOW. Visual polish — sections exist but lack visual separation.
8. **Gap 6: Default form no context** — LOW. Confusing but non-blocking. Admin can proceed without understanding the default.

---

## Recommended Execution Approach

### Phase 1: Critical Flow Fixes (3 tasks, ~30 min)
1. **Fix ProgramPage fee inheritance** — Read `organization.settings` in `openSeasonModal()` and initial state, matching SeasonsPage pattern
2. **Fix "Create First Season" CTA** — Navigate to `/programs/{first-program-id}` instead of `/settings/seasons`, where the ProgramEmptyState has a working create button
3. **Auto-create programs from first-run sports** — In FirstRunSetupPage's `saveSection('sports', ...)`, diff `enabled_sports` against existing programs and insert missing ones

### Phase 2: Dashboard & Tracker Polish (3 tasks, ~20 min)
4. **Disable/grey dashboard CTA cards** that require prerequisites (or remove them in favor of the stepper which already works)
5. **Fix age division chip visibility** — Add explicit text colors for both active/inactive states
6. **Add TrackerSuccessPopup to StaffPortalPage** and fix CTA label in LifecycleTracker

### Phase 3: Form Polish (2 tasks, ~10 min)
7. **Add section dividers to Fees tab** in SeasonFormModal
8. **Add helper text for "Use default form"** in Registration tab

**Total estimated phases:** 3
**Total tasks:** 8
**All changes are isolated to existing files — no new components needed.**
