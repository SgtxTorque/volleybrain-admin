# INVESTIGATION REPORT: Lifecycle Test Critical Blockers
## Date: 2026-04-11
## Repo: SgtxTorque/volleybrain-admin (main branch)

## Summary

Three critical blockers were found during lifecycle testing with real email accounts against thelynxapp.com. Investigation reveals: (1) Coach dashboard infinite skeleton is caused by the coach role detection mechanism in MainApp.jsx relying solely on the `coaches` table (not `user_roles`), combined with `activeView` defaulting to `'admin'` for new users — meaning the CoachDashboard never renders at all; (2) Team creation from Program Detail page silently fails because `ProgramPage.jsx:handleTeamCreate()` does NOT perform any Supabase INSERT — it incorrectly assumes NewTeamModal handles its own insert; (3) The web registration flow does NOT create auth users — the passwordless user must originate from a Supabase server-side trigger or Edge Function, and the app lacks both a password recovery handler and an auth callback route.

---

## Blocker 1: Coach Dashboard Infinite Skeleton Loading

### Root Cause: Coach role is never detected, so CoachDashboard never renders — the user is stuck in admin view showing skeleton loading for data they can't access.

### Evidence

**1. `activeView` defaults to `'admin'` on first load (MainApp.jsx:918-921):**
```javascript
const [activeView, setActiveView] = useState(() => {
  const saved = localStorage.getItem('lynx_active_view')
  return saved || 'admin'  // Defaults to 'admin' on first load
})
```
A brand-new coach account has no localStorage, so `activeView` starts as `'admin'`.

**2. Coach role detection relies on `coaches` table, NOT `user_roles` (MainApp.jsx:969-1009):**
```javascript
// Line 969-978: Coach detection via coaches table
let coachLink = null
if (orgSeasonIds.length > 0) {
  const { data: coachRows } = await supabase
    .from('coaches').select('*, team_coaches(team_id, role, teams(id, name, color, season_id))')
    .eq('profile_id', profile.id)
    .in('season_id', orgSeasonIds)
  if (coachRows && coachRows.length > 0) {
    coachLink = { ...coachRows[0], team_coaches: allTeamCoaches }
  }
}

// Line 1008-1009: isCoach depends entirely on coachLink
isCoach: !!coachLink,  // FALSE if coaches table query returns empty
```

The `user_roles` entry with `role='coach'` (created by CoachInviteAcceptPage:148-153) is **completely ignored** for coach detection. The ONLY way to be detected as a coach is via the `coaches` table query.

**3. The coaches table query has TWO failure points:**

- **Failure Point A — `orgSeasonIds` is empty (MainApp.jsx:961-964):**
  ```javascript
  const { data: orgSeasons } = await supabase
    .from('seasons').select('id').eq('organization_id', organization.id)
  const orgSeasonIds = orgSeasons?.map(s => s.id) || []
  ```
  If RLS policies on `seasons` block the coach user, or `organization.id` is wrong, `orgSeasonIds` is empty. The entire coaches query is skipped (`if (orgSeasonIds.length > 0)`), and `coachLink` stays null.

- **Failure Point B — `organization` object itself is null or wrong:**
  If the profile's `current_organization_id` doesn't match the org where the coach was invited, all org-scoped queries return empty.

**4. Without coach detection, `availableRoles` never includes 'coach' (MainApp.jsx:1020-1027):**
```javascript
if (roles?.some(r => r.role === 'league_admin' || r.role === 'admin')) availableRoles.push('admin')
if (coachLink) availableRoles.push('coach')  // <-- FALSE when coachLink is null
// ... if nothing matches ...
if (availableRoles.length === 0) availableRoles.push('parent')  // fallback
```

**5. The result: user is stuck in admin view or falls to parent view:**
- `activeView` stays `'admin'` (default) or falls to `'parent'`
- Admin dashboard renders, but the coach user can't access admin data
- Admin dashboard queries fail silently → permanent skeleton loading
- "Lynx Admin" header appears because admin view is active
- Sidebar shows lock icons because admin prereqs (seasons, etc.) appear unfulfilled for this user

**6. The CoachInviteAcceptPage correctly sets up the data (CoachInviteAcceptPage.jsx:113-161):**
```javascript
// Links coaches record: profile_id = userId, invite_status = 'active'
await supabase.from('coaches').update({
  profile_id: userId,
  invite_status: 'active',
}).eq('id', invite.id)

// Creates user_roles entry
await supabase.from('user_roles').upsert({
  user_id: userId, organization_id: orgId, role: 'coach', is_active: true,
})

// Sets current_organization_id
await supabase.from('profiles').update({
  current_organization_id: orgId, onboarding_completed: true,
}).eq('id', userId)
```
All correct. The data is written. But `loadRoleContext()` fails to read it back due to the query chain issues above.

### Why the Previous Fix Didn't Work

The COACH-1 fix added a 5-second timeout with retry and "Contact your club director" buttons to `CoachDashboard.jsx:247-252`. This fix is valid but **never seen** because CoachDashboard never renders — the user is stuck in admin view. The fix handles "coach dashboard loads but data is slow." The actual bug is "coach dashboard doesn't load at all because `activeView` is wrong."

The COACH-2 fix added dedicated `coachNavGroups` in MainApp.jsx:1246-1282. This is also valid but irrelevant — coach nav groups only render when `activeView === 'coach'`, which never happens.

### Recommended Fix

1. **Add `user_roles` as a fallback for coach detection (MainApp.jsx, in `loadRoleContext()`):**
   ```javascript
   // After the existing coaches table query, add:
   if (!coachLink && roles?.some(r => r.role === 'coach')) {
     // user_roles says they're a coach but no coaches table entry found
     // Create a minimal coachLink so they're at least routed to CoachDashboard
     coachLink = { id: null, team_coaches: [] }
   }
   ```

2. **Make CoachDashboard handle the "no teams assigned" state gracefully** (it already does with the empty team check at line 261, but verify the empty state UI renders properly).

3. **Investigate RLS on `seasons` table** — if the policy blocks coaches from reading seasons, the entire role detection chain breaks. Coaches need SELECT on `seasons` where `organization_id` matches their `current_organization_id`.

### Files to Modify
- `src/MainApp.jsx` (loadRoleContext function, ~line 978)
- Potentially: Supabase RLS policies on `seasons` table

### Estimated Complexity: Medium
The code change is small (5-10 lines), but requires understanding the cascading role detection logic and testing with a real coach account. RLS investigation may require Supabase dashboard access.

---

## Blocker 2: Team Creation Silent Fail from Program Detail

### Root Cause: `ProgramPage.jsx:handleTeamCreate()` does NOT perform any Supabase INSERT. It has a misleading comment claiming NewTeamModal handles its own insert, which is factually wrong.

### Evidence — Side-by-side Comparison

**Path A: Team Management Page (WORKS)**

| Step | File | Line | What happens |
|------|------|------|-------------|
| 1. Click "New Team" | `TeamsPage.jsx` | 500 | `setShowNewTeamModal(true)` |
| 2. Modal renders | `TeamsPage.jsx` | 704-708 | `<NewTeamModal onCreate={createTeam} />` |
| 3. Click "Create Team" | `NewTeamModal.jsx` | 84-93 | `handleCreate()` calls `await onCreate(form)` |
| 4. Callback executes | `TeamsPage.jsx` | 164-269 | **`createTeam(form)` performs `supabase.from('teams').insert({...})`** |
| 5. Post-insert | `TeamsPage.jsx` | 262-263 | Closes modal, calls `loadTeams()` |

**The `createTeam` function (TeamsPage.jsx:164-269) does ALL of this:**
- Validates `selectedSeason?.id` exists
- Calls `supabase.from('teams').insert({...})` with name, color, season_id, organization_id, sport_id
- Creates team chat channel (`chat_channels.insert`)
- Creates player-only chat channel
- Adds admin as channel member
- Shows toast, closes modal, refreshes

**Path B: Program Detail Page (SILENTLY FAILS)**

| Step | File | Line | What happens |
|------|------|------|-------------|
| 1. Click "New Team" | `ProgramPage.jsx` | 451 | `setShowTeamModal(true)` |
| 2. Modal renders | `ProgramPage.jsx` | 1152-1156 | `<NewTeamModal onCreate={handleTeamCreate} />` |
| 3. Click "Create Team" | `NewTeamModal.jsx` | 84-93 | `handleCreate()` calls `await onCreate(form)` |
| 4. Callback executes | `ProgramPage.jsx` | 538-544 | **`handleTeamCreate()` — NO INSERT** |

**The `handleTeamCreate` function (ProgramPage.jsx:538-544):**
```javascript
async function handleTeamCreate(teamData) {
  // The NewTeamModal handles its own insert — just refresh after  ← WRONG COMMENT
  setShowTeamModal(false)        // Closes modal
  showToast?.('Team created!', 'success')  // MISLEADING SUCCESS TOAST
  refreshSeasons?.()             // Refreshes (nothing new to find)
  setTimeout(() => loadProgramData(), 500) // Refreshes (nothing new to find)
}
```

**Zero Supabase writes.** The comment "The NewTeamModal handles its own insert" is factually incorrect — `NewTeamModal.jsx:88` just calls `await onCreate(form)`, delegating entirely to the parent's callback.

### Why Network Trace Shows Zero Write Operations

The modal opens (rendering, no writes), the form fills (state changes, no writes), "Create Team" is clicked → `handleTeamCreate()` runs → closes modal, shows success toast, triggers GET refreshes. No INSERT/POST ever fires because no Supabase write call exists in the callback.

### Recommended Fix

Replace `handleTeamCreate` in ProgramPage.jsx with actual team creation logic. Either:

**Option A (recommended):** Extract `createTeam` from TeamsPage into a shared utility and call it from both locations.

**Option B (quick fix):** Duplicate the insert logic directly in `handleTeamCreate`:
```javascript
async function handleTeamCreate(teamData) {
  const seasonId = selectedProgramSeason?.id
  if (!seasonId) { showToast?.('Select a season first', 'error'); return }

  const { data: team, error } = await supabase.from('teams').insert({
    name: teamData.name,
    color: teamData.color || '#4BB9EC',
    season_id: seasonId,
    organization_id: organization?.id,
    sport_id: program?.sport_id,
    // ... additional fields from teamData
  }).select().single()

  if (error) { showToast?.('Failed to create team: ' + error.message, 'error'); return }

  // Create team chat channels (same as TeamsPage)
  // ...

  setShowTeamModal(false)
  showToast?.('Team created!', 'success')
  setTimeout(() => loadProgramData(), 500)
}
```

### Files to Modify
- `src/pages/programs/ProgramPage.jsx` (handleTeamCreate function, line 538)
- Optionally: Extract shared team creation logic from `src/pages/teams/TeamsPage.jsx` (lines 164-269)

### Estimated Complexity: Simple
The fix is straightforward — copy the INSERT logic from the working path. The main consideration is ensuring `season_id` and `organization_id` are available in ProgramPage's scope (they are, via `selectedProgramSeason` and `organization`).

---

## Blocker 3: Registration Creates Passwordless Auth User

### Root Cause: Multi-layered issue — the web registration flow does NOT create auth users (the passwordless user must come from a server-side trigger), AND the app lacks both a password recovery handler and a proper account creation flow from registration.

### Auth User Creation Point

**FINDING: The web codebase does NOT create auth users during registration.**

Both `PublicRegistrationPage.jsx` (lines 510-853) and `RegistrationCartPage.jsx` (lines 1261-1460+) were read in full. The registration submit flow performs:
1. Creates `families` record (find-or-create by email)
2. Creates `players` records (one per child)
3. Creates `registrations` records (one per child)
4. Creates `invitations` record via `createInvitation()` (invite-utils.js:28-76) — this only inserts into `invitations` table
5. Queues confirmation email via `EmailService.sendRegistrationConfirmation()` — this only inserts into `email_notifications` table

**None of these call `supabase.auth.signUp()`, `supabase.auth.admin.createUser()`, or any auth-related function.**

If a passwordless `auth.users` entry exists after registration, it must be created by:
1. **A Supabase database trigger** (on `registrations` or `players` insert) that auto-creates an auth user
2. **A Supabase Edge Function** that processes the `email_notifications` queue and creates auth users
3. **The mobile app** performing a separate action
4. **Supabase's `inviteUserByEmail` API** being called server-side

**This cannot be diagnosed from the web codebase alone. Carlos needs to check the Supabase dashboard for triggers/functions on the `registrations`, `players`, `families`, or `invitations` tables.**

### Password Handling

- The web registration flow never sets a password (it never creates an auth user)
- If a server-side trigger creates the auth user, it likely uses `auth.admin.createUser()` without a password, or with a random/placeholder password
- This creates an unusable account: exists in `auth.users` but has no valid password

### The Correct Flow (as designed in the web code)

The intended flow is:
1. Parent registers child(ren) via PublicRegistrationPage or RegistrationCartPage
2. No auth user is created — only player/registration/family records
3. An `invitations` record is created with `invite_type: 'parent'` and a 7-day expiry
4. A confirmation email is queued with an `invite_url`: `/invite/parent/{invite_code}`
5. Parent clicks the invite link in the email → lands on `ParentInviteAcceptPage.jsx`
6. Parent signs up with email + password → `supabase.auth.signUp()` creates the auth user WITH a password
7. `linkPlayersAndFamily()` connects the players to the parent account
8. `grantRole()` adds `role: 'parent'` to `user_roles`
9. Profile is created/updated with `current_organization_id` and `onboarding_completed: true`
10. Parent is redirected to dashboard

**This flow is well-implemented in `ParentInviteAcceptPage.jsx` (lines 85-208).** The problem is that something creates the auth user BEFORE step 6, breaking `signUp()`.

### SuccessScreen UX Issue (RegistrationScreens.jsx:226-296)

The SuccessScreen shows a "Create Account" CTA that links to `/` (the root/login page):
```javascript
<a href="/" className="...">Create Account</a>
<p>Use the same email you registered with</p>
```

This is wrong. It should link to the invite acceptance page (`/invite/parent/:code`). By linking to `/`, parents who click "Create Account":
- Go to the generic login page
- If they sign up there, they create an account but DON'T link their children
- The invite goes unused
- They'd need to use ClaimAccountPage later to link children

### Password Reset / OTP Issue

**The app does NOT handle Supabase auth recovery events.**

`AuthContext.jsx:42-45`:
```javascript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) { init() }
  if (event === 'SIGNED_OUT') { /* clear state */ }
})
```

Missing: `PASSWORD_RECOVERY` event handling. When Supabase sends a password reset email:
1. User clicks the link
2. Supabase redirects to the app with `#access_token=...&type=recovery` in the URL hash
3. The app needs to detect this, parse the token, and show a "Set new password" form
4. The app does NOT do any of this — no hash parsing, no recovery handler
5. The token in the URL expires quickly (default: 1 hour), and since the app never parses it, the reset fails

**No auth callback route exists.** There is no `/auth/callback` route. The `LoginPage.jsx` calls `supabase.auth.resetPasswordForEmail()` (line 70) which sends the email, but the return redirect is never handled.

### Recommended Fix

**Priority 1 — Investigate server-side auth user creation:**
- Check Supabase dashboard for database triggers on `registrations`, `players`, `families`, `invitations` tables
- Check Edge Functions that process the `email_notifications` queue
- If a trigger creates auth users, either: (a) remove it and let the invite flow handle account creation, or (b) ensure it creates users with a magic link flow instead of a passwordless entry

**Priority 2 — Fix SuccessScreen CTA (RegistrationScreens.jsx):**
```javascript
// Instead of linking to "/"
<a href={inviteUrl || "/"}>Create Account</a>
```
Pass the `inviteUrl` to the SuccessScreen component so it links directly to the invite acceptance page.

**Priority 3 — Add PASSWORD_RECOVERY handler (AuthContext.jsx):**
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) { init() }
  if (event === 'SIGNED_OUT') { /* ... */ }
  if (event === 'PASSWORD_RECOVERY') {
    // Redirect to a password reset form
    // Or show a modal to set new password
    navigate('/reset-password')
  }
})
```

**Priority 4 — Create a password reset page** that:
1. Detects the recovery token from the URL hash
2. Shows a "Set new password" form
3. Calls `supabase.auth.updateUser({ password: newPassword })`

### Files to Modify
- Supabase dashboard: Check triggers/functions (not in web codebase)
- `src/pages/public/RegistrationScreens.jsx` (SuccessScreen — fix CTA link)
- `src/pages/public/PublicRegistrationPage.jsx` (pass inviteUrl to SuccessScreen)
- `src/pages/public/RegistrationCartPage.jsx` (pass inviteUrl to SuccessScreen)
- `src/contexts/AuthContext.jsx` (add PASSWORD_RECOVERY handler)
- New file: `src/pages/auth/ResetPasswordPage.jsx` (password reset form)
- `src/App.jsx` or routing config (add /reset-password route)

### Estimated Complexity: Complex
Requires Supabase dashboard investigation (triggers/functions), SuccessScreen UX fix, auth recovery handler, and a new password reset page. The server-side trigger investigation is the critical first step.

---

## Risk Assessment

### Blocker 1 Fix Risks
- **Low risk**: Adding `user_roles` fallback for coach detection is additive — doesn't change existing admin/parent detection logic
- **Medium risk**: If RLS on `seasons` is the root cause, fixing it could expose season data to roles that shouldn't see it. RLS changes must be tested with all roles.

### Blocker 2 Fix Risks
- **Very low risk**: Adding the INSERT logic to ProgramPage only affects team creation from the program detail view. No impact on TeamsPage or other flows.
- **Consideration**: Ensure the ProgramPage has access to `organization.id` and `season_id` in scope (it does, via existing state variables).

### Blocker 3 Fix Risks
- **High risk if modifying server-side triggers**: Could affect mobile app behavior since both apps share the same Supabase backend. Any changes to auth user creation must be tested on both platforms.
- **Low risk for SuccessScreen CTA fix**: Pure UI change.
- **Medium risk for PASSWORD_RECOVERY handler**: Need to handle edge cases (expired tokens, already-logged-in users). Should be tested with real email flow.
- **Important**: The SuccessScreen currently shows "Team created!" toast even though no team was created (Blocker 2). After fixing Blocker 2, verify the toast text is accurate.
