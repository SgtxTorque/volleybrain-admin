# PHASE RESULTS: Fix Logo/Banner Upload Persistence + Button Visibility

**Date:** April 16, 2026
**Spec:** EXECUTE-SPEC-logo-upload-persist.md
**Status:** All phases complete, build passing, pushed to origin/main

---

## Summary

Beta user Marisa reported that uploaded org logo and banner images vanished after navigation. Two root causes fixed:
1. Logo auto-save wrote to DB but didn't sync React state (stale on SPA navigation)
2. Banner had NO auto-save at all (URL lost on navigation, misleading "Image uploaded" toast)
3. Upload buttons were nearly invisible in light mode (white-on-white, no visible border)

---

## Per-Phase Status

### Phase 1 — Logo Auto-Save State Sync
- **Commit:** `9462f0d`
- **Build:** built in 12.04s
- **Files:** OrganizationPage.jsx (+2), SetupSectionContent.jsx (+7)
- **Change:** After both Identity and Branding logo auto-saves succeed, now calls `setOrganization(prev => ({ ...prev, logo_url: publicUrl }))` and `setSetupData(prev => ({ ...prev, logoUrl: publicUrl }))`. `setOrganization` threaded from OrganizationPage as new prop.
- **Prop threading:** `setOrganization` was already available in OrganizationPage via `useAuth()` but NOT passed to SetupSectionContent. Added to both render sites (lines 990 and 1076). `setSetupData` was already passed as prop.

### Phase 2 — Banner Auto-Save
- **Commit:** `6ea6dcc`
- **Build:** built in 12.35s
- **Files:** SetupSectionContent.jsx (+26)
- **Change:** `handleBrandingUpload` now has `else if (field === 'brandingBannerUrl')` branch that auto-saves to `organizations.settings.branding.banner_url` via JSONB merge. Toast changed from misleading "Image uploaded" to "Banner saved!" on success. React state synced via `setOrganization` + `setSetupData`.

### Phase 3 — Upload Button Visibility
- **Commit:** `3efe78b`
- **Build:** built in 12.15s
- **Files:** SetupSectionContent.jsx (+19/-7)
- **Change:** All three upload buttons (Identity logo, Branding logo, Banner) now use:
  - **Empty state:** `bg-slate-50 border-2 border-dashed border-slate-300` — clearly visible dashed border
  - **Filled state:** `bg-white border border-slate-300` — solid button
  - **Hover:** `hover:border-[#4BB9EC] hover:text-[#4BB9EC]` — Lynx sky blue accent
  - Icon size increased from `w-4 h-4` to `w-5 h-5`
  - Border radius: `rounded-[14px]` per design system

### Phase 4 — Verify + Push
- This file written
- Final build passed
- Pushed to origin/main

---

## Files Changed

| File | Lines changed | Phases |
|---|---|---|
| `src/pages/settings/OrganizationPage.jsx` | +2 (setOrganization prop) | 1 |
| `src/pages/settings/SetupSectionContent.jsx` | +52/-7 (state sync, banner auto-save, button styling) | 1, 2, 3 |

---

## Verification Checklist

1. [ ] Go to Settings -> Identity & Branding
2. [ ] Upload a logo -> see preview -> see "Logo saved!" toast
3. [ ] Navigate to Dashboard (SPA navigation, don't refresh)
4. [ ] Navigate back to Settings -> Identity & Branding
5. [ ] Logo should still be there (not vanished)
6. [ ] Go to Settings -> Branding & White-Label
7. [ ] Upload a banner -> see preview -> see "Banner saved!" toast
8. [ ] Navigate to Dashboard
9. [ ] Navigate back to Settings -> Branding & White-Label
10. [ ] Banner should still be there
11. [ ] Hard refresh (F5) -> both logo and banner still visible
12. [ ] Check registration page -> org logo appears in header
13. [ ] Upload buttons are clearly visible (dashed border, not invisible)

**Runtime QA:** Pending Carlos + Marisa manual verification.

---

## Commits

```
3efe78b  fix: upload buttons now clearly visible with dashed border — no more white-on-white
6ea6dcc  fix: banner upload now auto-saves to database — no more silent data loss on navigation
9462f0d  fix: logo auto-save now syncs React state — logo persists across SPA navigation
```

---

## Carlos Action Item

**Check the Supabase dashboard for the `organizations` table:**
1. Go to Table Editor -> organizations -> RLS Policies
2. Is RLS enabled? If YES:
   - Is there an UPDATE policy for league_admin / org admin? Or only platform_admin?
   - If only platform_admin can UPDATE, Marisa's uploads would fail silently at the DB level even with the React state fix
   - Add a policy: `CREATE POLICY "org_admin_update" ON organizations FOR UPDATE USING (id IN (SELECT organization_id FROM user_roles WHERE user_id = auth.uid()))`
3. If RLS is NOT enabled, the fix in this spec is sufficient
