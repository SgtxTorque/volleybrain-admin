# PHASE RESULTS — Branding Overhaul Phase 1: Foundation & Cleanup

**Date:** April 15, 2026
**Branch:** feat/branding-phase1 → merged to main
**Overall Status:** ALL PHASES PASS

---

## Phase 1A: Create TeamLogo Component — PASS

**Commit:** `27c62cc` — feat: create reusable TeamLogo component with fallback chain

**File Created:**
- `src/components/TeamLogo.jsx` — 170 lines

**Prop Interface (final):**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `team` | object | `{}` | Team object with `logo_url`, `color`, `name`, `abbreviation` |
| `size` | number | `32` | Width/height in pixels |
| `className` | string | `''` | Additional CSS classes |
| `showTooltip` | boolean | `false` | Show team name on hover |
| `variant` | string | `'default'` | `'default'` \| `'dot'` \| `'watermark'` |

**Fallback Chain Confirmed:**
1. Logo image (with `onError` graceful degradation)
2. Colored initials (abbreviation or first 2 chars of name, `getContrastText` for text color)
3. Color dot (only `team.color`, no text)
4. Gray fallback (shield SVG icon)

**Variant Behavior:**
- `'dot'` — filled circle, defaults to 8px
- `'watermark'` — 4% opacity, defaults to 192px
- `'default'` — follows fallback chain

**Build:** PASS (11.85s)

---

## Phase 1B: Consolidate getContrastText Duplicates — PASS

**Commit:** `965d0e6` — refactor: consolidate getContrastText to single import from cardColorUtils

**Files Modified:**
- `src/pages/schedule/SchedulePosterModal.jsx` — Removed 4 inline functions (`getContrastText`, `darken`, `lighten`, `hexToRgba`), added import from `cardColorUtils`
- `src/pages/schedule/GameDayShareModal.jsx` — Removed 3 inline functions (`getContrastText`, `darken`, `hexToRgba`), added import from `cardColorUtils`

**Signature Comparison:**
All 3 `getContrastText` functions (canonical + 2 duplicates) are **identical**:
- Accept single `hex` string
- Use luminance formula: `(0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55`
- Return `'#1a1a2e'` (dark) or `'#ffffff'` (light)

Also consolidated: `darken`, `lighten` (SchedulePosterModal only), `hexToRgba` — all identical to canonical versions in `cardColorUtils.js`.

**Net code reduction:** 40 lines deleted, 2 import lines added.

**Build:** PASS (12.00s)

---

## Phase 1C: Remove Dead Branding Code — PASS (Partial)

**Commit:** `2d493b9` — chore: remove dead useOrgBranding import and hook call from TeamWallPage

**Files Modified:**
- `src/pages/public/TeamWallPage.jsx` — Removed `useOrgBranding` import and destructured variables (`orgLogo`, `orgName`, `hasCustomBranding`) that were never used in JSX or functions

**Spec Corrections:**
1. **`accentColor` in RegistrationCartPage (line 1236) is NOT dead code.** It's actively used on lines 1852, 1870, 1887, 1902, 1923, 1939 (passed to step components as prop, used in sticky header background). **SKIPPED — not removed.**
2. **`useOrgBranding` was NOT in `src/pages/teams/TeamWallPage.jsx`** as spec claimed — it was in `src/pages/public/TeamWallPage.jsx`. The spec had the wrong directory. Found and cleaned up from the correct file.

**Build:** PASS (11.44s)

---

## Phase 1D: Add Logo Upload to EditTeamModal — PASS

**Commit:** `0c8b02c` — feat: add logo upload and preview to EditTeamModal

**File Modified:**
- `src/pages/teams/EditTeamModal.jsx` — 116 lines added, 17 lines modified (net +99 lines)

**What Changed:**
- Added `logoFile`, `logoPreview`, `removeLogo` state + `logoInputRef`
- Added `handleLogoSelect()` with 2MB file size validation
- Added logo upload section to Basic Info tab (between color picker and description)
- Uses `TeamLogo` component for live preview (reflects form color/name/abbreviation changes)
- Upload on save mirrors `NewTeamModal` pattern: Supabase `team-assets` bucket, falls back to data URI
- `logo_url` included in update payload only when changed
- "Remove Logo" button sets `logo_url` to `null`
- "Undo Remove" if user changes mind before saving

**Pattern Match with NewTeamModal:** Yes — same bucket (`team-assets`), same upload pattern, same fallback to `readAsDataURL`. Deviations:
- EditTeamModal uses `TeamLogo` component for preview (NewTeamModal uses raw `<img>`)
- EditTeamModal supports "Remove Logo" (NewTeamModal doesn't need it since logo is optional on creation)

**Build:** PASS (11.66s)

---

## Phase 1E: Swap TeamsTableView to Use TeamLogo — PASS

**Commit:** `3f32a13` — refactor: use TeamLogo component in TeamsTableView

**File Modified:**
- `src/pages/teams/TeamsTableView.jsx` — Replaced 8-line inline rendering block with single `<TeamLogo team={team} size={28} showTooltip />`

**Size:** 28px (matches original `w-7 h-7` = 28px)

**Rendering Match:**
- Teams with logos: `<img>` with rounded corners and object-fit cover — matches
- Teams without logos: colored square with abbreviation initials — matches (TeamLogo uses 14px border-radius vs original `rounded-md` ≈ 6px — minor visual difference, but consistent with Lynx design system standard)
- Default color: TeamLogo falls back to `#10284C` vs original `#4BB9EC` — minor difference; `#10284C` is the Lynx navy (design system standard), original was Lynx sky. Both are acceptable defaults.

**Build:** PASS (13.74s)

---

## Phase 1F: Update Parity Log — PASS

**Commit:** `9b77a72` — docs: update parity log with branding phase 1 changes

**File Modified:**
- `PARITY-LOG.md` — Added "April 15, 2026 (Branding Phase 1)" section with 4 entries

**Build:** N/A (docs only)

---

## Final Merge & Push — PASS

- Merged `feat/branding-phase1` to `main` (fast-forward)
- Final build on main: PASS (14.17s)
- Pushed to `origin/main`: `205adc0..9b77a72`

---

## Summary

| Phase | Status | Commit |
|-------|--------|--------|
| 1A: TeamLogo Component | PASS | `27c62cc` |
| 1B: getContrastText Consolidation | PASS | `965d0e6` |
| 1C: Dead Code Removal | PASS (partial) | `2d493b9` |
| 1D: EditTeamModal Logo Upload | PASS | `0c8b02c` |
| 1E: TeamsTableView Swap | PASS | `3f32a13` |
| 1F: Parity Log | PASS | `9b77a72` |

**Files Created:** 1
- `src/components/TeamLogo.jsx` (170 lines)

**Files Modified:** 5
- `src/pages/schedule/SchedulePosterModal.jsx` — removed duplicate color utils, added import
- `src/pages/schedule/GameDayShareModal.jsx` — removed duplicate color utils, added import
- `src/pages/public/TeamWallPage.jsx` — removed dead `useOrgBranding` import and hook call
- `src/pages/teams/EditTeamModal.jsx` — added logo upload, preview, and remove functionality
- `src/pages/teams/TeamsTableView.jsx` — swapped inline rendering with TeamLogo component

**Files Deleted:** 0

**Issues Encountered:**
1. Spec Phase 1C referenced wrong file path (`src/pages/teams/TeamWallPage.jsx` instead of `src/pages/public/TeamWallPage.jsx`) — found and fixed at correct location
2. Spec Phase 1C claimed `accentColor` in RegistrationCartPage was dead code — it is NOT, it's used on 6+ lines throughout the component. Skipped removal.
3. Build exit code is always 1 due to chunk size warning (3.3MB main bundle), but builds complete successfully every time.
