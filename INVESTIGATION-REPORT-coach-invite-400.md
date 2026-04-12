# INVESTIGATION: Coach Invite 400 + Registration Link Button

**Date:** 2026-04-11
**Type:** READ-ONLY code audit
**Scope:** InviteCoachModal coach insert 400 error + ProgramPage registration link UX

---

## Blocker 1: Coach Invite 400

### Root Cause: `role` column does not exist on the `coaches` table

Both `handleNewUserInvite()` (line 189) and `handleRoleElevation()` (line 128) in `src/pages/coaches/InviteCoachModal.jsx` send `role: role` (e.g., `"head"`, `"assistant"`) in the INSERT payload to the `coaches` table. The `coaches` table has **no `role` column** — the coach's role within a team is stored on `team_coaches.role`, not on `coaches` directly.

Supabase REST API returns **400 Bad Request** when a column name in the INSERT payload does not exist on the target table.

### Insert Payload (handleNewUserInvite, line 183-198)

```javascript
{
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  email: email.trim(),
  role: role,                    // ← DOES NOT EXIST ON TABLE — causes 400
  invite_status: 'invited',
  invite_email: email.trim(),
  invite_code: inviteCode,
  invited_at: new Date().toISOString(),
  invited_by: profile?.id || null,
  season_id: seasonId || null,
}
```

### Insert Payload (handleRoleElevation, line 124-135)

```javascript
{
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  email: email.trim(),
  role,                          // ← SAME BUG — causes 400
  profile_id: existingUser.id,
  invite_status: 'active',
  invite_email: email.trim(),
  invite_accepted_at: new Date().toISOString(),
  invited_by: profile?.id || null,
  season_id: seasonId || null,
}
```

### Table Schema (from SCHEMA-REFERENCE-04052026.csv)

The `coaches` table has these columns:
- `id`, `season_id`, `first_name`, `last_name`, `email`, `phone`, `address`
- `experience_years`, `experience_details`, `specialties`
- `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation`
- `status`, `notes`, `created_at`, `updated_at`
- `profile_id`, `photo_url`, `bio`, `date_of_birth`, `gender`, `shirt_size`
- `certifications`, `background_check_status/date/expiry`
- `coaching_license`, `coaching_level`, `preferred_sports`, `preferred_age_groups`
- `availability`, `waiver_signed/at/signer_name`, `code_of_conduct_signed/at`
- `secondary_phone`, `preferred_contact`
- `invite_status`, `invite_email`, `invited_at`, `invite_accepted_at`, `invited_by`, `invite_code`

**No `role` column.** The role lives on `team_coaches.role` (columns: `id`, `team_id`, `coach_id`, `role`, `created_at`).

### Mismatch: `role` sent to `coaches` but belongs on `team_coaches`

The role value IS correctly being written to `team_coaches` later in the flow (lines 209-214 for new user, lines 141-145 for elevation), but the initial `coaches.insert` fails before reaching that step.

### Comparison with Working Inserts

| File | Sends `role` to `coaches`? | Works? |
|------|--------------------------|--------|
| `InviteCoachModal.jsx` (handleNewUserInvite) | YES | NO — 400 |
| `InviteCoachModal.jsx` (handleRoleElevation) | YES | NO — 400 |
| `CoachesPage.jsx` (saveCoach) | NO | YES |
| `StaffPortalPage.jsx` (insert) | NO | YES |
| `CoachInviteAcceptPage.jsx` (acceptInvite) | NO (update only) | YES |

### Error Handling Analysis

The error IS caught properly (lines 200-205):
```javascript
if (coachError || !pendingCoach) {
  console.error('Error creating pending coach record:', coachError)
  showToast?.('Failed to create coach invitation. Please try again.', 'error')
  setSending(false)
  return
}
```

The error toast should fire. If it's not showing, possible reasons:
1. `showToast` prop is not being passed to the modal
2. The toast is firing but dismissed too fast
3. The outer try/catch in `handleSendEmail` (line 294-297) is catching first

However, looking at the outer `handleSendEmail` catch (line 294-297):
```javascript
} catch (err) {
  console.error('Invite error:', err)
  showToast?.(err.message || 'Something went wrong sending the invite.', 'error')
}
```

For `handleNewUserInvite`, the function does `return` on coach insert error (line 204), so it won't throw. The outer catch shouldn't interfere. But for `handleRoleElevation`, line 137 does `if (coachError) throw coachError` — which would be caught by the outer catch and show the error.

**Key insight:** The `handleNewUserInvite` path returns early (line 204) with its own error toast and `setSending(false)`. This should work correctly IF `showToast` is passed. The "form clears silently" report may indicate `showToast` is undefined/null.

### Fix (Blocker 1)

Remove `role` from both insert payloads. The role is already correctly set via `team_coaches.insert` later in the flow.

**handleNewUserInvite (line 185-196) — remove `role: role`:**
```javascript
.insert({
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  email: email.trim(),
  // role removed — stored on team_coaches, not coaches
  invite_status: 'invited',
  invite_email: email.trim(),
  invite_code: inviteCode,
  invited_at: new Date().toISOString(),
  invited_by: profile?.id || null,
  season_id: seasonId || null,
})
```

**handleRoleElevation (line 124-135) — remove `role`:**
```javascript
const { data: newCoach, error: coachError } = await supabase.from('coaches').insert({
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  email: email.trim(),
  // role removed — stored on team_coaches, not coaches
  profile_id: existingUser.id,
  invite_status: 'active',
  invite_email: email.trim(),
  invite_accepted_at: new Date().toISOString(),
  invited_by: profile?.id || null,
  season_id: seasonId || null,
}).select().single()
```

---

## Blocker 2: Registration Link Button

### Current Behavior

**File:** `src/pages/programs/ProgramPage.jsx` lines 459-466

The "Registration Link" button on the Program Detail page does:
1. Builds URL: `${window.location.origin}/register/${slug}?program=${program?.id}`
2. Calls `navigator.clipboard.writeText(url)`
3. On success: calls `showToast?.('Registration link copied!', 'success')`
4. On failure: falls back to `window.prompt('Copy this registration link:', url)`

```javascript
{ label: 'Registration Link', icon: Link2, onClick: () => {
  const slug = organization?.slug || organization?.id
  const url = `${window.location.origin}/register/${slug}?program=${program?.id}`
  navigator.clipboard.writeText(url).then(
    () => showToast?.('Registration link copied!', 'success'),
    () => { window.prompt('Copy this registration link:', url) }
  )
}},
```

### What Works

- The URL is correctly constructed using org slug
- The clipboard copy IS functional
- The toast IS called on success

### Missing

1. **No visible confirmation in some browsers:** `navigator.clipboard.writeText` may silently fail in non-HTTPS contexts or when the page doesn't have focus, causing neither toast nor prompt to appear
2. **No modal with sharing options:** The dashboard's `RegLinkModal` (lines 1719-1838 of DashboardPage.jsx) offers a much richer experience:
   - Visual display of the URL
   - Copy button with animated checkmark feedback
   - Email input to send branded registration invite emails to multiple parents
   - Season name display
   - Proper modal with close button
3. **URL format concern:** The ProgramPage URL uses `?program=${program?.id}` query param. The routes defined in App.jsx are:
   - `/register/:orgIdOrSlug` → RegistrationCartPage (org-wide, parent picks season)
   - `/register/:orgIdOrSlug/:seasonId` → PublicRegistrationPage (season-specific)

   The `?program=` query param may not be consumed by either route. This needs verification — it may be ignored silently.

### Dashboard RegLinkModal (for reference)

The dashboard's `RegLinkModal` (DashboardPage.jsx lines 1719-1838) provides:
- URL display with copy button + visual feedback (checkmark)
- Season-specific URL when a season is selected (`/register/${slug}/${seasonId}`)
- Org-wide URL when no season selected (`/register/${slug}`)
- Email sharing: comma-separated email input → calls `EmailService.sendRegistrationInvite()` for each
- Season name and org name displayed in header
- Warning when no season is selected

### Fix (Blocker 2)

**Option A (Quick):** Extract `RegLinkModal` from DashboardPage.jsx into a shared component (e.g., `src/components/ui/RegLinkModal.jsx`), then import and use it in ProgramPage.jsx. Pass the selected program's season as `selectedSeason`.

**Option B (Minimal):** Keep the clipboard copy but wrap it in try/catch with a guaranteed fallback toast. This is the smallest change but doesn't add the email sharing capability.

**Recommended:** Option A — extract and reuse the `RegLinkModal`. It already handles all edge cases (no season, clipboard failure, email sending) and provides a polished UX. The ProgramPage can pass the program's season context to scope the link.

---

## Summary

| Blocker | Root Cause | Severity | Fix Complexity |
|---------|-----------|----------|----------------|
| Coach Invite 400 | `role` column sent to `coaches` table (doesn't exist — belongs on `team_coaches`) | CRITICAL | 2 lines removed from InviteCoachModal.jsx |
| Registration Link | Button copies silently — no modal, no email sharing option | MEDIUM | Extract RegLinkModal to shared component, import in ProgramPage |

---

*Investigation performed by Claude Code — read-only, no files modified*
