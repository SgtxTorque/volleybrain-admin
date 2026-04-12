# INVESTIGATION: Coach Multi-Org Role Detection

**Date:** 2026-04-11
**Type:** READ-ONLY code audit
**Scope:** Why existing-user coach invite acceptance leads to permanent skeleton on /dashboard

---

## AREA 1: What CoachInviteAcceptPage Does (Existing User Path)

**File:** `src/pages/public/CoachInviteAcceptPage.jsx`

When an existing user clicks "I Have an Account" → signs in → the flow is:

1. `handleLogin()` (line 252) → `supabase.auth.signInWithPassword()` → calls `acceptInvite()` → calls `verifyAndRedirect()`
2. `handleAccept()` (line 190) — if already logged in → calls `acceptInvite()` → calls `verifyAndRedirect()`

### Every DB Write in `acceptInvite()` (line 113-161)

| # | What | Line | Code | Conditional? |
|---|------|------|------|-------------|
| 1 | Update `coaches` record: set `profile_id`, `invite_status: 'active'`, `invite_accepted_at`, `email` | 118-126 | `supabase.from('coaches').update({ profile_id: userId, invite_status: 'active', invite_accepted_at: new Date().toISOString(), email: userEmail }).eq('id', invite.id)` | NO — always runs |
| 2 | Mark `invitations` record as accepted | 131-143 | `acceptInvitationRecord(invitation.invite_code, userId)` | Non-critical, try/catch |
| 3 | Create `user_roles` entry for new org | 148-153 | `supabase.from('user_roles').upsert({ user_id: userId, organization_id: orgId, role: 'coach', is_active: true }, { onConflict: 'user_id,organization_id,role' })` | **YES — only if `orgId` is truthy** |
| 4 | Update `profiles.current_organization_id` + `onboarding_completed` | 156-159 | `supabase.from('profiles').update({ current_organization_id: orgId, onboarding_completed: true }).eq('id', userId)` | **YES — only if `orgId` is truthy** |
| 5 | Create `team_coaches` entry | N/A | **NOT DONE** — the accept page does NOT create team_coaches entries | N/A |
| 6 | Clear `localStorage.lynx_active_view` | N/A | **NOT DONE** — localStorage is never touched | N/A |

### Where `orgId` comes from

```javascript
// Line 146
const orgId = invite._season?.organization_id
```

And `invite._season` is set during `loadInvite()` (line 53-104):

```javascript
// Line 71-81
if (coach.season_id) {                                    // ← CONDITIONAL
  const { data: season } = await supabase
    .from('seasons')
    .select('name, organization_id, organizations(...)')
    .eq('id', coach.season_id)
    .single()
  if (season) {
    coach._season = season                                // ← Only set if season_id exists
    org = season.organizations
  }
}
```

**If `coach.season_id` is null → `invite._season` is never set → `orgId` is undefined → writes #3 and #4 are SKIPPED entirely.**

### Where does `season_id` come from on the coach record?

From `InviteCoachModal.jsx` (just fixed in Phase 1):

```javascript
season_id: seasonId || null,
```

`seasonId` comes from the modal's props, which is `selectedSeason?.id || null` from `CoachesPage.jsx` (line 415). **If the admin hasn't selected a season (or is viewing "All Seasons"), `season_id` is null.**

### `verifyAndRedirect()` (line 163-188)

```javascript
async function verifyAndRedirect(userId, orgId) {
  await new Promise(resolve => setTimeout(resolve, 1000))    // 1s wait

  const { data: verifyProfile } = await supabase
    .from('profiles')
    .select('onboarding_completed, current_organization_id')
    .eq('id', userId).single()

  if (!verifyProfile?.onboarding_completed) {
    // Force write if first didn't stick
    await supabase.from('profiles').update({
      onboarding_completed: true,
      current_organization_id: orgId,                         // ← could be undefined!
    }).eq('id', userId)
  }

  setAccepted(true)
  setTimeout(() => {
    window.location.href = '/dashboard'                       // FULL PAGE RELOAD
  }, 1500)
}
```

**Redirect method:** `window.location.href = '/dashboard'` — full page reload. This forces AuthContext to re-initialize from scratch, which is correct. But it depends on the profile writes having committed.

---

## AREA 2: What loadRoleContext() Expects

**File:** `src/MainApp.jsx`, line 953-1058

### Trigger

```javascript
// Line 947-951
useEffect(() => {
  if (profile?.id && organization?.id) {
    loadRoleContext()
  }
}, [profile?.id, organization?.id])
```

Runs when AuthContext finishes loading `profile` and `organization`.

### Every check in loadRoleContext()

| Step | What | Query | Depends on |
|------|------|-------|-----------|
| 1 | Query `user_roles` for this user + org | `.eq('user_id', profile.id).eq('organization_id', organization.id).eq('is_active', true)` | `organization.id` from AuthContext |
| 2 | Query `seasons` to get org season IDs | `.eq('organization_id', organization.id)` | `organization.id` |
| 3 | Query `coaches` scoped to org seasons | `.eq('profile_id', profile.id).in('season_id', orgSeasonIds)` | `orgSeasonIds` from step 2 |
| 4 | Fallback: if no coaches rows found, check if `user_roles` has `role: 'coach'` | `roles?.some(r => r.role === 'coach')` | `roles` from step 1 |
| 5 | Query `team_staff` for team_manager | `.eq('user_id', profile.id)` | N/A |
| 6 | Query `players` for children | `.eq('parent_account_id', profile.id).in('season_id', orgSeasonIds)` | `orgSeasonIds` |
| 7 | Detect player self | `.eq('profile_id', profile.id)` | N/A |
| 8 | Build `availableRoles` and set `activeView` | Checks isAdmin, isCoach, etc. | All above |

### activeView resolution (line 1039-1054)

```javascript
const savedView = localStorage.getItem('lynx_active_view')
if (savedView && availableRoles.includes(savedView)) {
  setActiveView(savedView)                                  // Keep saved if still valid
} else if (!savedView && !availableRoles.includes('admin') && availableRoles.includes('coach')) {
  setActiveView('coach')                                    // First-time coach → auto-set
  localStorage.setItem('lynx_active_view', 'coach')
} else {
  const newView = availableRoles[0] || 'admin'              // Default to highest role
  setActiveView(newView)
  if (savedView && !availableRoles.includes(savedView)) {
    localStorage.setItem('lynx_active_view', newView)       // Fix stale saved view
  }
}
```

### Where `organization` comes from (AuthContext)

**File:** `src/contexts/AuthContext.jsx`, line 158-166

```javascript
const { data: roles } = await supabase.from('user_roles').select('role, organization_id')
  .eq('user_id', authUser.id).eq('is_active', true).order('granted_at', { ascending: false })

if (roles && roles.length > 0) {
  const preferredOrgId = prof?.current_organization_id
    && roles.some(r => r.organization_id === prof.current_organization_id)
      ? prof.current_organization_id
      : roles[0].organization_id
  const { data: org } = await supabase.from('organizations').select('*').eq('id', preferredOrgId).maybeSingle()
  setOrganization(org)
}
```

**Logic:** Use `profiles.current_organization_id` if it exists AND matches one of the user's roles. Otherwise fall back to `roles[0].organization_id` (most recently granted role).

---

## AREA 3: Predicted Database State After Accept

### Scenario A: `season_id` IS set on coach record (happy path)

1. `current_organization_id` → Updated to Crossover ✅
2. `user_roles` → `{ user_id, organization_id: crossover, role: 'coach', is_active: true }` ✅
3. `coaches` → `{ profile_id: userId, invite_status: 'active', season_id: crossover_season }` ✅
4. `activeView` → Resolves to 'coach' after loadRoleContext runs ✅ (but flashes 'admin' skeleton first)

### Scenario B: `season_id` is NULL on coach record (bug path)

1. `current_organization_id` → **NOT updated** — still points to QA Panthers ❌
2. `user_roles` → **No entry for Crossover** — only QA Panthers roles exist ❌
3. `coaches` → `{ profile_id: userId, invite_status: 'active', season_id: NULL }` — linked but orphaned from org
4. On reload, AuthContext:
   - Reads `current_organization_id` = QA Panthers
   - Loads QA Panthers as the org
   - `loadRoleContext()` queries roles for QA Panthers (not Crossover)
   - User sees QA Panthers dashboard, NOT Crossover
   - **If user doesn't have admin in QA Panthers:** admin skeleton forever
   - **If user does have admin in QA Panthers:** wrong org's data loads

### Scenario C: `season_id` set, all writes succeed, but localStorage stale

1. `current_organization_id` → Updated to Crossover ✅
2. `user_roles` → Created ✅
3. `coaches` → Linked ✅
4. On reload:
   - `activeView` initializes to 'admin' from localStorage (line 918-921)
   - Admin DashboardPage renders and shows skeleton
   - `loadRoleContext()` runs in background
   - If loadRoleContext succeeds: switches `activeView` to 'coach' → skeleton replaces with coach dashboard (brief flash)
   - **If loadRoleContext ERRORS** (caught at line 1055-1057): activeView stays 'admin', skeleton is permanent ❌

---

## AREA 4: The activeView / localStorage Problem

### How `activeView` is initialized (line 918-921)

```javascript
const [activeView, setActiveView] = useState(() => {
  const saved = localStorage.getItem('lynx_active_view')
  return saved || 'admin'
})
```

- Read from localStorage on mount — **before** loadRoleContext runs
- If user was admin in QA Panthers, localStorage has `lynx_active_view = 'admin'`
- Initial render uses 'admin' → Admin DashboardPage mounts and shows skeleton

### Does CoachInviteAcceptPage clear localStorage?

**NO.** There is no `localStorage.removeItem('lynx_active_view')` anywhere in CoachInviteAcceptPage.jsx.

### The commit 86efe87 fix (user_roles fallback)

The prior fix added the fallback at line 980-988:

```javascript
// Fallback: if coaches table didn't find anything, check user_roles
if (!coachLink) {
  const isCoachByRole = roles?.some(r => r.role === 'coach')
  if (isCoachByRole) {
    coachLink = { id: null, profile_id: profile.id, team_coaches: [] }
  }
}
```

This fallback works **only if:**
1. `user_roles` has a coach entry for `organization.id` → requires write #3 to have succeeded
2. `organization.id` is the Crossover org → requires write #4 (`current_organization_id` update) to have succeeded

**If both writes were skipped (Scenario B), this fallback can't help.** It queries user_roles for the WRONG org (QA Panthers), where the user has no coach role.

### CRITICAL answer: If `current_organization_id` was NOT updated to Crossover, does the entire role detection chain query the WRONG org's data?

**YES.** Every query in `loadRoleContext()` uses `organization.id`, which comes from AuthContext, which resolves from `profiles.current_organization_id`. Wrong org → wrong seasons → wrong coaches query → wrong roles → wrong activeView.

---

## AREA 5: The acceptInvitation Function

**File:** `src/lib/invite-utils.js`

### `acceptInvitation()` (line 106-124)

Only updates the `invitations` table status:

```javascript
export async function acceptInvitation(inviteCode, userId) {
  await supabase.from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_by: userId })
    .eq('invite_code', inviteCode).eq('status', 'pending')
    .select().single()
}
```

**Does NOT:**
- Call `grantRole()` — NO
- Update `profiles.current_organization_id` — NO
- Handle multi-org in any way — NO

This is just a bookkeeping update for the invitations table. The actual role/profile writes happen in CoachInviteAcceptPage's `acceptInvite()`.

### `grantRole()` (line 143-155)

```javascript
export async function grantRole(userId, organizationId, role) {
  await supabase.from('user_roles').upsert({
    user_id: userId, organization_id: organizationId, role, is_active: true,
    granted_at: new Date().toISOString(),
  }, { onConflict: 'user_id,organization_id,role' })
}
```

`grantRole()` is called by `InviteCoachModal.handleRoleElevation()` (direct add for known users), but **NOT by CoachInviteAcceptPage**. The accept page does its own inline upsert at line 148-153. Same effect, different code path.

---

## AREA 6: The Redirect After Accept

```javascript
// verifyAndRedirect() — line 186
window.location.href = '/dashboard'
```

This is a **full page reload**, not a client-side `navigate()`. This means:
- The entire React app re-initializes
- AuthContext runs `loadProfile()` from scratch
- `loadRoleContext()` runs fresh
- All state is clean (except localStorage)

This is the correct approach. The problem is not the redirect method — it's what data is in the database when the reload happens.

---

## The Gap

### PRIMARY BUG: `coach.season_id` null → all org writes skipped

**Root cause chain:**

1. Admin invites a coach from CoachesPage without selecting a specific season (common when viewing "All Seasons")
2. `InviteCoachModal` creates coach record with `season_id: null`
3. Coach accepts via CoachInviteAcceptPage
4. `loadInvite()` line 71: `if (coach.season_id)` → **FALSE** → `invite._season` is never populated
5. `acceptInvite()` line 146: `const orgId = invite._season?.organization_id` → **undefined**
6. `acceptInvite()` line 147: `if (orgId)` → **FALSE** → entire block skipped:
   - No `user_roles` entry for new org
   - No `profiles.current_organization_id` update
   - No `profiles.onboarding_completed` update
7. Full page reload → AuthContext reads old `current_organization_id` (QA Panthers)
8. `loadRoleContext()` queries everything for QA Panthers
9. User sees wrong org or broken skeleton — coach dashboard for new org never renders

### SECONDARY BUG: No localStorage cleanup

Even when `season_id` IS set and all writes succeed:
- `localStorage.lynx_active_view` = 'admin' from previous org persists
- `activeView` initializes to 'admin' before `loadRoleContext()` runs
- Admin DashboardPage renders skeleton while loadRoleContext runs
- If loadRoleContext errors out (catch on line 1055), skeleton is permanent
- If loadRoleContext succeeds, there's a visible flash from admin skeleton → coach dashboard

### TERTIARY BUG: No `team_coaches` created during accept

The CoachInviteAcceptPage does NOT create `team_coaches` entries. The `team_coaches` records were created at invite time by `InviteCoachModal` (linking `coach_id` to a team). However, the `team_coaches.coach_id` references the `coaches.id` that existed at invite time. Since `acceptInvite()` only UPDATES the existing coach record (not creating a new one), the `team_coaches` linkage should survive. **This is NOT a bug** — just worth noting for clarity.

---

## Recommended Fix

### Fix 1 (CRITICAL): CoachInviteAcceptPage must resolve orgId without depending on `season_id`

**File:** `src/pages/public/CoachInviteAcceptPage.jsx`

The `acceptInvite()` function should get `orgId` from MULTIPLE sources, not just `invite._season?.organization_id`.

**Option A — Resolve org from `invitations` table (has `organization_id` directly):**

At the top of `acceptInvite()` (line 113), before the coach update:

```javascript
async function acceptInvite(userId, userEmail) {
  checkEmailMismatch(userEmail)

  // Resolve orgId from multiple sources
  let orgId = invite._season?.organization_id

  // Fallback 1: query invitations table (has organization_id directly)
  if (!orgId) {
    const { data: invitation } = await supabase
      .from('invitations')
      .select('organization_id')
      .eq('coach_id', invite.id)
      .maybeSingle()
    orgId = invitation?.organization_id
  }

  // Fallback 2: resolve from team_coaches → teams → seasons → org
  if (!orgId && invite.team_coaches?.length > 0) {
    const teamId = invite.team_coaches[0].team_id
    const { data: team } = await supabase
      .from('teams').select('season_id, seasons(organization_id)')
      .eq('id', teamId).single()
    orgId = team?.seasons?.organization_id
  }

  // ... rest of acceptInvite with orgId guaranteed
```

### Fix 2 (IMPORTANT): Clear stale localStorage on accept

In `verifyAndRedirect()`, before the redirect:

```javascript
// Line ~185, before setAccepted(true)
localStorage.removeItem('lynx_active_view')
```

This ensures that on reload, `activeView` doesn't default to 'admin' from a previous org session. `loadRoleContext()` will set the correct view based on the user's roles in the new org.

### Fix 3 (NICE-TO-HAVE): InviteCoachModal should always set `season_id`

When the admin hasn't selected a season, the modal should either:
- **Require** a season selection before sending invite (add validation)
- **Auto-select** the most recent active/upcoming season as a fallback:

```javascript
// In handleNewUserInvite / handleRoleElevation:
const effectiveSeasonId = seasonId || (await getDefaultSeasonId(orgId))
```

This prevents the root cause entirely — no coach record would ever have `season_id: null`.

---

## Summary

| Bug | Severity | Root Cause | File:Line |
|-----|----------|-----------|-----------|
| `season_id` null → org writes skipped | **CRITICAL** | `acceptInvite()` only resolves orgId from `invite._season?.organization_id`, which requires `season_id` to be set | `CoachInviteAcceptPage.jsx:146-147` |
| Stale `localStorage.lynx_active_view` | **HIGH** | Never cleared during invite accept → admin skeleton flashes or persists | `CoachInviteAcceptPage.jsx` (missing) |
| No multi-source orgId resolution | **HIGH** | Only one source for orgId; no fallback to `invitations.organization_id` or team→season→org chain | `CoachInviteAcceptPage.jsx:146` |
| Prior fix (86efe87) ineffective for this case | **INFO** | user_roles fallback queries wrong org when `current_organization_id` wasn't updated | `MainApp.jsx:980-988` |

---

*Investigation performed by Claude Code — read-only, no files modified*
