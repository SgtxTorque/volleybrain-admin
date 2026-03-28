# CC-SIMPLIFY-WAIVER-UX.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

The waiver management UX is confusing. There are three places that touch waivers:
1. **Legal & Waivers section** in Org Setup — shows a read-only keyword-matching checklist that looks like checkboxes but aren't interactive
2. **Registration Form section** in Org Setup — has interactive checkboxes to select which waivers to include in registration
3. **Waiver Manager page** (`/settings/waivers`) — full CRUD for waiver templates with active/inactive and required toggles

This is redundant. The Waiver Manager already has active/required toggles per template. Registration should just pull all active waivers automatically (respecting sport_id for sport-specific waivers). There's no need for a manual checkbox picker in Org Setup.

### What this spec does:
- **Phase 1:** Rename "Legal & Waivers" to "Legal & Compliance". Replace the fake waiver checklist with a clean summary card showing active waiver count + link to Waiver Manager.
- **Phase 2:** Replace the interactive waiver checkbox picker in Registration Form with a read-only summary that shows active waiver count and links to Waiver Manager. Remove `selected_waivers` from the save payload (no longer needed — registration will use the `is_active` flag on waiver_templates directly).
- **Phase 3:** Update the completion check for the legal section to no longer require 3+ waivers (waivers are managed separately now).

**Design principle:** Waiver Manager is the single source of truth. `is_active` and `is_required` on `waiver_templates` control everything. Registration pulls all active waivers automatically (standard waivers for all registrations, sport-specific waivers matched by `sport_id`).

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (Phase 1, Phase 2)
- `src/pages/settings/OrganizationPage.jsx` (Phase 2, Phase 3)

---

## PHASE 1 — Simplify Legal Section

**Goal:** Rename section to "Legal & Compliance". Remove the fake waiver keyword checklist. Replace with a clean summary card showing how many active waivers exist and a button to Waiver Manager.

### File: `src/pages/settings/OrganizationPage.jsx`

**Change 1: Update the section definition.**

Find the section object (around line 545-553):

```js
{
  key: 'legal',
  title: 'Legal & Waivers',
  icon: '⚖️',
  estTime: '10-15 min',
  description: 'Waivers, insurance, and compliance',
  required: true,
  category: 'foundation',
},
```

Replace with:

```js
{
  key: 'legal',
  title: 'Legal & Compliance',
  icon: '⚖️',
  estTime: '5-10 min',
  description: 'Entity info, insurance, and compliance',
  required: true,
  category: 'foundation',
},
```

### File: `src/pages/settings/SetupSectionContent.jsx`

**Change 2: Replace the waiver checklist block in the `legal` case.**

Find the waiver block (around lines 620-649). It starts with:
```js
<div className={`p-4 rounded-xl border ${tc.border} ${tc.cardBgAlt}`}>
```
and contains the `['Liability Waiver', 'Photo/Media Release', ...]` map and the "Manage Waivers" button.

Replace that entire `<div>...</div>` block (lines 620-649) with:

```jsx
<div className={`p-4 rounded-xl border ${tc.border} ${tc.cardBgAlt}`}>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-2xl">📋</span>
      <div>
        <p className={`font-medium ${tc.text}`}>Waivers</p>
        <p className={`text-sm ${tc.textMuted}`}>
          {waivers?.filter(w => w.is_active).length || 0} active
          {' · '}
          {waivers?.filter(w => w.is_required).length || 0} required
          {' · '}
          {waivers?.length || 0} total
        </p>
      </div>
    </div>
    <button
      className="px-4 py-2 rounded-lg text-white font-medium text-sm"
      style={{ backgroundColor: accent.primary }}
      onClick={() => {
        localStorage.setItem('returnToOrgSetup', 'legal')
        navigate('/settings/waivers')
      }}
    >
      Manage Waivers →
    </button>
  </div>
  {(!waivers || waivers.length === 0) && (
    <p className={`text-sm mt-3 ${tc.textMuted}`}>
      No waivers created yet. Add your liability waiver, code of conduct, and other documents families need to sign.
    </p>
  )}
  {waivers && waivers.filter(w => w.is_active).length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">
      {waivers.filter(w => w.is_active).map(w => (
        <span
          key={w.id}
          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
            w.is_required
              ? 'bg-red-500/10 text-red-500'
              : tc.cardBgAlt + ' ' + tc.textMuted
          }`}
        >
          {w.name}
          {w.is_required && ' · Required'}
          {w.sport_id && ' · Sport-specific'}
        </span>
      ))}
    </div>
  )}
</div>
```

### Verification

- `grep -n "Liability Waiver.*Photo.*Media" src/pages/settings/SetupSectionContent.jsx` should return 0 results (old keyword checklist is gone)
- `grep -n "Manage Waivers" src/pages/settings/SetupSectionContent.jsx` should return 1 hit (the button in the new summary card)
- `grep -n "Legal & Compliance" src/pages/settings/OrganizationPage.jsx` should return 1 hit
- No `Legal & Waivers` string should remain

### Commit message
```
refactor(setup): rename Legal & Waivers to Legal & Compliance, replace fake checklist with active waiver summary
```

---

## PHASE 2 — Replace Waiver Picker in Registration Form

**Goal:** Remove the interactive waiver checkbox picker from the Registration Form section. Replace with a read-only summary that shows active waivers and links to Waiver Manager. Remove `selected_waivers` from the save payload.

### File: `src/pages/settings/SetupSectionContent.jsx`

**Change 1: Replace the "Waivers Selection" block in the `registrationForm` case.**

Find the waivers selection block (around lines 1021-1068). It starts with:
```jsx
{/* Waivers Selection */}
<div className={`p-5 rounded-xl border ${tc.border}`}>
```
and ends with the closing `</div>` after the empty state.

Replace that entire block with:

```jsx
{/* Waivers Summary (managed via Waiver Manager) */}
<div className={`p-5 rounded-xl border ${tc.border}`}>
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <span className="text-xl">📜</span>
      <h3 className={`font-semibold ${tc.text}`}>Waivers</h3>
    </div>
    <button
      className="text-sm font-medium transition"
      style={{ color: accent.primary }}
      onClick={() => navigate('/settings/waivers')}
    >
      Manage Waivers →
    </button>
  </div>
  <p className={`text-sm ${tc.textMuted} mb-3`}>
    All active waivers are automatically included during registration. Manage them in the Waiver Manager.
  </p>
  {waivers && waivers.filter(w => w.is_active).length > 0 ? (
    <div className="space-y-1.5">
      {waivers.filter(w => w.is_active).map(w => (
        <div key={w.id} className={`flex items-center gap-2 text-sm ${tc.text}`}>
          <span className="text-green-500">✓</span>
          <span>{w.name}</span>
          {w.is_required && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">Required</span>
          )}
          {w.sport_id && (
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${tc.cardBgAlt} ${tc.textMuted}`}>Sport-specific</span>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className={`text-center py-4 ${tc.cardBgAlt} rounded-xl`}>
      <p className={tc.textMuted}>No active waivers.</p>
      <p className={`text-sm ${tc.textMuted} mt-1`}>Create and activate waivers in the Waiver Manager.</p>
    </div>
  )}
</div>
```

**Change 2: Update the Form Preview Summary waiver count.**

In the same `registrationForm` case, find the Preview Summary section (around line 1095-1100). The waivers stat currently reads:

```jsx
<p className="text-2xl font-bold" style={{ color: accent.primary }}>
  {(localData.selectedWaivers || []).length}
</p>
<p className={`text-xs ${tc.textMuted}`}>Waivers</p>
```

Replace with:

```jsx
<p className="text-2xl font-bold" style={{ color: accent.primary }}>
  {waivers?.filter(w => w.is_active).length || 0}
</p>
<p className={`text-xs ${tc.textMuted}`}>Active Waivers</p>
```

### File: `src/pages/settings/OrganizationPage.jsx`

**Change 3: Remove `selected_waivers` from the `registrationForm` save case.**

Find the registrationForm save case (around line 338-346):

```js
case 'registrationForm':
  updatePayload = {
    settings: {
      ...currentSettings,
      registration_fields: data.registrationFields,
      custom_questions: data.customQuestions,
      selected_waivers: data.selectedWaivers,
    }
  }
  break
```

Remove the `selected_waivers` line so it becomes:

```js
case 'registrationForm':
  updatePayload = {
    settings: {
      ...currentSettings,
      registration_fields: data.registrationFields,
      custom_questions: data.customQuestions,
    }
  }
  break
```

Note: Do NOT delete existing `selected_waivers` data from the database. It can stay as legacy data harmlessly. We just stop writing to it.

### Verification

- `grep -n "selectedWaivers\|selected_waivers" src/pages/settings/SetupSectionContent.jsx` should return 0 hits
- `grep -n "selected_waivers" src/pages/settings/OrganizationPage.jsx` should return only the load line (around line 181), not the save line
- `grep -n "Manage Waivers" src/pages/settings/SetupSectionContent.jsx` should return 2 hits (legal section + registration form section)

### Commit message
```
refactor(setup): replace waiver checkbox picker with read-only summary, remove selected_waivers from save
```

---

## PHASE 3 — Update Completion Check

**Goal:** The legal section completion check currently requires `waivers.length >= 3`. Since waivers are now managed independently, the legal section completion should only check legal-specific fields.

### File: `src/pages/settings/OrganizationPage.jsx`

**Change 1: Update the legal completion criteria.**

Find (around line 457-460):

```js
legal: [
  setupData.legalName || setupData.name,
  waivers.length >= 3,
],
```

Replace with:

```js
legal: [
  setupData.legalName || setupData.name,
],
```

### Verification

- `grep -A2 "legal:" src/pages/settings/OrganizationPage.jsx` in the completion section should show only the legalName check, no waiver count
- The Legal section should show as complete once a legal entity name is filled in (or org name exists)

### Commit message
```
fix(setup): remove waiver count from legal section completion check
```

---

## POST-EXECUTION QA CHECKLIST

1. **Legal & Compliance section:** Should show "Legal & Compliance" (not "Legal & Waivers"). Should display a summary card with active/required/total waiver counts. Should show pill tags for each active waiver. "Manage Waivers" button navigates to `/settings/waivers`.
2. **Registration Form section:** Should show a read-only waiver summary with green checkmarks for active waivers. Should NOT have interactive checkboxes. "Manage Waivers" link navigates to `/settings/waivers`.
3. **Waiver Manager page:** Unchanged. Still full CRUD with active/required toggles.
4. **Completion check:** Legal section should complete based on legal entity name only, not waiver count.
5. **Form Preview Summary:** Should show count of active waivers (from waiver_templates), not selectedWaivers.

## FUTURE NOTE (NOT IN THIS SPEC)

The actual registration flow (mobile app) will need to be updated to query active waivers from `waiver_templates` instead of reading `org.settings.selected_waivers`. That's a mobile-side change and should be a separate spec. The query logic:
- Pull all `waiver_templates` where `organization_id` matches AND `is_active = true`
- For sport-specific waivers (`type = 'sport_specific'`), also filter by `sport_id` matching the registration's sport
- Standard waivers (`type = 'standard'`) always included regardless of sport
