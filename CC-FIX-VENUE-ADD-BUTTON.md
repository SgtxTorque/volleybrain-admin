# CC-FIX-VENUE-ADD-BUTTON.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

The "Add Venue" button on the Org Setup facilities section fires a "coming soon" toast instead of doing anything. A fully functional Venue Manager page already exists at `/settings/venues` with full CRUD (add, edit, delete) wired to Supabase. The fix: navigate to that page, same pattern already used for waivers (`navigate('/settings/waivers')` on line 631 of the same file).

When the admin navigates back from `/settings/venues` to `/settings/organization`, the OrganizationPage remounts and `loadSetupData()` re-runs, so the venue list will refresh automatically. No extra wiring needed.

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (1 change)

---

## PHASE 1 — Wire "Add Venue" Button to Venue Manager Page

### File: `src/pages/settings/SetupSectionContent.jsx`

**Change 1: Replace the toast onClick with navigate.**

Find this line (around line 792):

```js
onClick={() => showToast('Venue manager coming soon!', 'info')}
```

Replace with:

```js
onClick={() => navigate('/settings/venues')}
```

That's it. The `navigate` function is already imported via `useNavigate` (line 2) and initialized (line 219).

### Verification

- `grep -n "coming soon" src/pages/settings/SetupSectionContent.jsx` should NOT return any line containing "Venue" (the "Invite admin coming soon" on line 832 is a separate issue, leave it alone)
- `grep -n "navigate.*venues" src/pages/settings/SetupSectionContent.jsx` should return 1 hit
- No other files changed

### Commit message
```
fix(setup): wire Add Venue button to /settings/venues instead of coming-soon toast
```

---

## POST-EXECUTION QA CHECKLIST

1. Go to Org Setup > Facilities section
2. Click "Add Venue" -- should navigate to `/settings/venues`
3. Add a venue (name, address, etc.) and save
4. Navigate back to Org Setup > Facilities
5. The new venue should appear in the venue list
6. Verify existing venues still display correctly with name, address, and Home/Away badge
