# PHASE RESULTS — Marisa's Beta Findings (4 Fixes)

**Date:** April 15, 2026
**Branch:** `fix/marisa-beta-findings` (merged to main)
**Files Changed:** 8 (63 insertions, 15 deletions)

---

## Per-Fix Status

| Fix | Description | Status | Commit |
|-----|-------------|--------|--------|
| 1 | Logo save error handling + auto-save | PASS | `5c71c03` |
| 2 | Age groups 5U+ and grades K+ | PASS | `6aeb54f` |
| 3 | Registration cart includes upcoming seasons | PASS | `fbd3080` |
| 4 | Banner image on registration header | PASS | `9ea874f` |
| 5 | Parity log update | PASS | `805bbe1` |

---

## Fix 1: Logo Save (OrganizationPage + SetupSectionContent)

### 1A: Error Handling

**File:** `src/pages/settings/OrganizationPage.jsx`, line 416

**1 `.update()` call was missing error handling.** This single call handles ALL section saves (identity, branding, default). It now destructures `{ error }` and shows an error toast + early return if the DB write fails. Previously, "Saved!" toast showed even on failure.

**Before:**
```jsx
await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
showToast('Saved!', 'success')
```

**After:**
```jsx
const { error } = await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
if (error) {
  console.error('Failed to save organization settings:', error)
  showToast('Failed to save. Please try again.', 'error')
  setSaving(false)
  return
}
showToast('Saved!', 'success')
```

### 1B: Auto-Save Logo After Upload

Both upload handlers now immediately save `logo_url` to the database after storage upload succeeds, without requiring a separate Save button click.

- **Identity section** (line 314-328): Added `supabase.from('organizations').update({ logo_url: publicUrl })` after `updateField()`
- **Branding section** (line 1511-1525): Added same auto-save, but only for `field === 'logoUrl'` (not for banner uploads)

Toast message changed from "Logo uploaded" to "Logo saved!" on success.

### 1C: Preview

Previews already existed in both sections — no changes needed:
- Identity: 64x64 rounded preview with color fallback (lines 296-309)
- Branding: 80x80 rounded preview with color fallback (lines 1530-1543)

---

## Fix 2: Age Groups and Grade Levels

### Age Groups (before → after)

| File | Before | After |
|------|--------|-------|
| `NewTeamModal.jsx:37` | `8U, 9U...18U, Adult` (12) | `5U, 6U, 7U, 8U...18U, Adult` (15) |
| `EditTeamModal.jsx:36` | `8U, 9U...18U, Adult` (12) | `5U, 6U, 7U, 8U...18U, Adult` (15) |
| `TeamManagerSetup.jsx:25` | `10U...18U, Open` (10) | `5U, 6U, 7U, 8U...18U, Adult, Open` (16) |
| `SetupSectionContent.jsx:612` | `8U, 10U, 12U, 14U, 16U, 18U` (6 presets) | `6U, 8U, 10U, 12U, 14U, 16U, 18U` (7 presets) |

### Grade Levels (before → after)

| File | Before | After |
|------|--------|-------|
| `NewTeamModal.jsx:41` | `3rd...12th` (10) | `K, 1st, 2nd, 3rd...12th` (13) |
| `EditTeamModal.jsx:40` | `3rd...12th` (10) | `K, 1st, 2nd, 3rd...12th` (13) |

`RegistrationFormSteps.jsx` and `PlayerProfileInfoTab.jsx` already had K-12 — no changes needed.

---

## Fix 3: Registration Cart Missing Programs

### Root Cause

New seasons default to `status: 'upcoming'` (ProgramPage.jsx line 540: `status: seasonForm.status || 'upcoming'`). The SeasonFormModal dropdown's first option is "Upcoming" (line 212). The registration cart query filtered `.eq('status', 'active')`, excluding all `'upcoming'` seasons.

### Query Change

**RegistrationCartPage.jsx** (line 1682):
- Before: `.eq('status', 'active')`
- After: `.in('status', ['active', 'upcoming'])`

**PublicRegistrationPage.jsx** (line 234):
- Before: `.eq('status', 'active')`
- After: `.in('status', ['active', 'upcoming'])`

Both pages now include seasons with status `'upcoming'`, which are still filtered by registration date windows (registration_opens/registration_closes) at lines 1687-1691 of RegistrationCartPage.

---

## Fix 4: Banner Image

### Implementation

**File:** `src/pages/public/PublicRegistrationPage.jsx`

Added `bannerUrl` computation (line 1080):
```jsx
const bannerUrl = organization?.settings?.branding?.banner_url || orgBranding.banner_url || null
```

Header now renders with conditional banner:
- `<div className="relative overflow-hidden">` wraps the header
- If `bannerUrl` exists: `<img>` with `absolute inset-0 object-cover` fills the background
- Semi-transparent overlay uses `headerBgColor + 'cc'` (80% opacity of org brand color)
- Content gets `relative z-10` to sit above overlay
- `onError` handler hides broken images gracefully

**RegistrationCartPage:** No branded header exists on this page (it has a different layout with program cards). Not updated.

`settings.branding.banner_url` is accessible from the registration page's `organization` object which is loaded with `select('*')`.

---

## Build Verification

| Fix | Build Time | Status |
|-----|-----------|--------|
| 1 | 13.24s | PASS |
| 2 | 13.20s | PASS |
| 3 | 12.93s | PASS |
| 4 | 12.91s | PASS |
| 5 | 13.11s | PASS |

---

## Issues Encountered

None. All 5 fixes applied cleanly.
