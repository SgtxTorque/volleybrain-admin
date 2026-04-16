# INVESTIGATION REPORT — Marisa's Beta Findings (4 Issues)

**Date:** April 15, 2026
**Status:** Read-only investigation complete

---

## ISSUE 1: Age Groups and Grade Levels Too Limited

### Findings

**Age group options** are defined in **3 separate files** (NOT centralized):

| File | Line | Values | Missing |
|------|------|--------|---------|
| `src/pages/teams/NewTeamModal.jsx` | 37-38 | `8U, 9U, 10U, 11U, 12U, 13U, 14U, 15U, 16U, 17U, 18U, Adult` | **No 5U, 6U, 7U** |
| `src/pages/teams/EditTeamModal.jsx` | 36-37 | Identical duplicate of above | Same |
| `src/pages/team-manager/TeamManagerSetup.jsx` | 25 | `10U-18U, Open` | Different range entirely |
| `src/pages/settings/SetupSectionContent.jsx` | 605 | Presets: `8U, 10U, 12U, 14U, 16U, 18U` | Even-number presets only |

**Grade level options** are defined in **4+ places**:

| File | Line | Values | Missing |
|------|------|--------|---------|
| `NewTeamModal.jsx` | 41-52 | `3rd through 12th` | **No K, 1st, 2nd** |
| `EditTeamModal.jsx` | 41-52 | Identical duplicate | Same |
| `RegistrationFormSteps.jsx` | 35 | `K, 1, 2, 3...12` | Already has K (full range) |
| `PlayerProfileInfoTab.jsx` | 37 | `K, 1st, 2nd...12th` | Already has K (full range) |
| `SetupSectionContent.jsx` | 603 | Presets: `K-2nd, 3rd-5th, 6th-8th, 9th-12th` | Preset bands only |

### Root Cause

- **Age groups**: The array starts at 8U. There's no 5U, 6U, or 7U option. Marisa can't create teams for younger age groups.
- **Grade levels**: Team creation (NewTeamModal/EditTeamModal) starts at 3rd grade. No K, 1st, or 2nd grade options for team classification. The registration form already supports K-12 for player profiles, but team *classification* doesn't match.

### Database Storage

- `teams.age_group` — stored as free text string (no DB enum constraint)
- `players.grade` — stored as free text string
- No migration needed — just add values to the UI arrays.

### Fix Complexity: LOW

- **4 files** to update (NewTeamModal, EditTeamModal, TeamManagerSetup, SetupSectionContent)
- ~10 lines changed total
- Add `5U, 6U, 7U` to age arrays, add `K, 1st, 2nd` to team grade arrays
- **Recommendation**: Extract to `src/constants/ageGradeOptions.js` and import everywhere to prevent future duplication

---

## ISSUE 2: Registration Cart Missing New Programs

### Findings

**The RegistrationCartPage** (`src/pages/public/RegistrationCartPage.jsx`, lines 1670-1697) loads programs with this query chain:

```
1. Programs query (line 1670-1675):
   FROM programs
   WHERE organization_id = orgData.id
   AND is_active = true              ← Filter 1
   ORDER BY display_order ASC

2. Seasons query (line 1678-1683):
   FROM seasons
   WHERE organization_id = orgData.id
   AND status = 'active'             ← Filter 2
   ORDER BY start_date DESC

3. Registration window filter (line 1686-1691):
   IF registration_opens AND today < registration_opens → exclude    ← Filter 3
   IF registration_closes AND today > registration_closes → exclude  ← Filter 4

4. Program-season join (line 1694-1697):
   Group seasons by program_id
   Exclude programs with ZERO matching seasons  ← Filter 5
```

### Root Cause — Multiple Exclusion Points

A newly created Basketball program can be excluded by **any** of these conditions:

| Filter | Condition | Most Likely Culprit? |
|--------|-----------|---------------------|
| `programs.is_active = true` | Program must be marked active | Defaults to `true` in ProgramFormModal — unlikely |
| `seasons.status = 'active'` | Season must have status 'active' | **LIKELY** — new season may default to 'upcoming' or 'pending' |
| `registration_opens > today` | Registration window hasn't opened yet | Possible if admin set a future open date |
| `registration_closes < today` | Registration window has closed | Unlikely for new season |
| `season.program_id = program.id` | Season must be linked to the program | **LIKELY** — if season was created before the program, `program_id` may be null |

**Most probable root cause**: The season's `status` is not `'active'` (it may be `'upcoming'` or `'draft'`), OR the season's `program_id` is null/not linked to the Basketball program.

### Registration Link Type

From `RegLinkModal.jsx` — the org registration link is **org-wide** (`/register/{orgSlug}`), showing all programs with open seasons. It's not program-specific unless a specific season is selected.

### Fix Complexity: MEDIUM

- Need to investigate what `status` a new season gets by default
- May need to add a UI hint on season creation showing "this season won't appear in registration until status = active"
- Or auto-set `status: 'active'` when `registration_opens` is set
- Possibly also need a diagnostic banner on the admin side: "This program has no seasons visible to parents"

---

## ISSUE 3: Org Logo Upload Doesn't Save

### Findings

There are **two** logo upload surfaces, both in `src/pages/settings/SetupSectionContent.jsx`:

| Section | Lines | Upload Path | DB Field |
|---------|-------|-------------|----------|
| **Identity** | 314-328 | `org-branding/{id}_logo_{ts}.{ext}` | `logo_url` via `saveSection('identity')` |
| **Branding** | 1504-1518 | `org-branding/{id}_logoUrl_{ts}.{ext}` | `logo_url` via `saveSection('branding')` |

Both upload handlers follow the same pattern:
1. Upload file to Supabase Storage bucket `media`
2. Get public URL
3. Call `updateField('logoUrl', publicUrl)` — updates **local form state only**
4. Show toast: "Logo uploaded" / "Image uploaded"

**The save to the database happens separately** when the user clicks the section's Save button. The save handler (`OrganizationPage.jsx`, line 396-416) then:
```javascript
updatePayload = { logo_url: data.logoUrl, settings: { ...currentSettings, branding: { ... } } }
await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
```

### Root Cause — Two Problems

**Problem A: Misleading UX.** The toast says "Logo uploaded" after the storage upload, but the user must **also click Save** on the section to persist `logo_url` to the database. Marisa likely uploaded the logo, saw the toast + preview, and assumed it was saved.

**Problem B: Silent DB update failure.** At line 416, the `.update()` call does NOT destructure `{ error }`:
```javascript
await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
// ← No error check! If this fails (e.g., RLS), the code continues to line 422:
showToast('Saved!', 'success')  // Shows success even if DB update failed
```

So even if Marisa DID click Save, the database update could fail silently due to RLS policies, and the app would still say "Saved!" with no indication of failure.

### Fix Complexity: LOW-MEDIUM

- **Quick fix**: Add `{ error }` destructuring to the update call and show error toast if it fails (~3 lines)
- **Better fix**: Auto-save `logo_url` to DB immediately after storage upload succeeds (don't require separate Save click)
- **Best fix**: Both — auto-save + error handling

---

## ISSUE 4: Registration Banner Image

### Findings

**What EXISTS:**
- `organizations.settings.branding.banner_url` — JSONB field, already used by branding section
- Branding section (`SetupSectionContent.jsx`, lines 1609-1629) has a full **banner upload UI**: file picker, preview, remove button, help text ("Wide image recommended (1200×400+). Shows on team wall and registration.")
- `email-html-builder.js` supports `email_header_image` in `resolveOrgBranding()`

**What DOESN'T exist:**
- **PublicRegistrationPage does NOT use the banner** — line 1085 renders a solid `backgroundColor: headerBgColor` with no image support
- No code in the registration header reads `organization.settings.branding.banner_url`

### Current Registration Header

`PublicRegistrationPage.jsx` line 1078-1085:
```jsx
const headerBgColor = organization?.primary_color || orgBranding.primary_color || '#10284C'
const headerTextColor = getContrastText(headerBgColor)
// ...
<div style={{ backgroundColor: headerBgColor, color: headerTextColor }}>
```

Solid color only. No conditional banner image rendering.

### Root Cause

The banner upload UI exists and saves to `settings.branding.banner_url`, but the registration page was never wired to read and display it.

### Fix Complexity: LOW

- Read `organization?.settings?.branding?.banner_url` in PublicRegistrationPage
- If banner exists, render `<img>` above or behind the header section
- If no banner, keep current solid color behavior
- ~15-20 lines of change in 1 file

---

## FIX COMPLEXITY SUMMARY

| Issue | Complexity | Files | Lines Changed | Impact |
|-------|-----------|-------|---------------|--------|
| 1. Age/Grade | LOW | 4-5 | ~15 | Unblocks younger age groups |
| 2. Missing Programs | MEDIUM | 1-2 | ~20-40 | Unblocks new program visibility |
| 3. Logo Save | LOW-MEDIUM | 2 | ~15 | Fixes silent data loss |
| 4. Banner Image | LOW | 1 | ~20 | Enables existing feature |

## RECOMMENDED FIX ORDER

1. **Issue 3 (Logo Save)** — Fix first. This is a **data loss bug** where user action appears to succeed but doesn't persist. Highest user frustration. Quick fix: add error handling to the DB update call + consider auto-save after upload.

2. **Issue 1 (Age/Grade)** — Fix second. Blocking for clubs with young athletes (6U, Kindergarten). Simple array expansion.

3. **Issue 2 (Missing Programs)** — Fix third. Requires investigating what `status` new seasons get by default and whether `program_id` is being linked. May need a diagnostic query to confirm the exact filter that's excluding Marisa's Basketball program.

4. **Issue 4 (Banner Image)** — Fix last. Nice-to-have polish. The infrastructure exists; just needs wiring.

## RISK FLAGS

- **Issue 1**: Extracting to a shared constants file is ideal but touches ~15 import paths. Simpler to just add values inline for now and centralize later.
- **Issue 2**: The root cause is ambiguous — could be `status`, `program_id`, or `registration_opens`. Need to query Marisa's actual data to confirm. Fix should address ALL possible causes.
- **Issue 3**: The `.update()` call at OrganizationPage.jsx:416 has NO error check for ANY section (identity, branding, etc.), not just logo. Every section's save could be silently failing. The fix should cover the whole `saveSection` function, not just branding.
- **Issue 4**: The banner needs to work well with dynamic text colors (getContrastText). If the banner is light, dark text overlay may be unreadable. May need a semi-transparent overlay between banner and text.
