# PHASE RESULTS — Branding Overhaul Phase 3: Org Branding Activation

**Branch:** `feat/branding-phase3` (merged to main)
**Date:** April 15, 2026
**Commits:** 5

---

## Per-Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| 3A | Create OrgLogo component | PASS |
| 3B | Standardize org logo across public pages | PASS |
| 3C | Dynamic registration header colors | PASS |
| 3D | Org logo in admin sidebar & dashboard | PASS |
| 3E | Clean up OrgBrandingContext | PASS (no changes needed — has active consumers) |
| 3F | Update parity log | PASS |

---

## 3A: OrgLogo Component

**File:** `src/components/OrgLogo.jsx` (50 lines)

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `org` | object | `{}` | `{ logo_url, name, primary_color }` |
| `size` | number | `40` | Height in px |
| `className` | string | `''` | Additional CSS |
| `variant` | string | `'default'` | `'default'` (auto-width) or `'square'` (forced square) |

**Fallback chain:**
1. Logo image — `height={size}`, `width: auto` (or `width={size}` for square), `maxWidth: size * 2.5`, `object-contain`, `borderRadius: 14`, `onError` hides image
2. Colored initials — rounded square (`borderRadius: 14`), `primary_color` bg (fallback `#10284C`), contrast-safe text via `getContrastText`, first letter of name or "O"

**Commit:** `d1fec69`

---

## 3B: Public Page Swap Inventory

| File | Old Rendering | Old Size | New Component | New Size | Org Data Shape |
|------|--------------|----------|---------------|----------|----------------|
| PublicRegistrationPage (season selector) | Conditional `<img>`, no fallback | 64px (w-16 h-16) | `<OrgLogo>` | 56px | `organization.*` via `select('*')` |
| PublicRegistrationPage (main header) | Conditional `<img>`, no fallback | 80px (w-20 h-20) | `<OrgLogo>` | 72px | Same |
| RegistrationCartPage (sticky header) | Conditional `<img>`, no fallback | 32px (w-8 h-8) | `<OrgLogo>` | 28px | `orgLogo` from settings (fixed to prefer top-level `logo_url`) |
| CoachJoinPage | 10-line ternary (img OR colored circle) | h-16 (64px) | `<OrgLogo>` | 64px | `org.{logo_url, name, primary_color}` via explicit select |
| CoachInviteAcceptPage | 7-line ternary (img OR bg-white/20 box) | h-14 (56px) | `<OrgLogo>` | 56px | `orgInfo.{logo_url, name, primary_color}` from join |
| ParentInviteAcceptPage | 7-line ternary (identical to coach) | h-14 (56px) | `<OrgLogo>` | 56px | Same join pattern |
| OrgDirectoryPage (card) | 13-line conditional (img OR initial) | w-14 h-14 (56px) | `<OrgLogo variant="square">` | 56px | `org.{logo_url, name}`, `settings.primary_color` |
| OrgDirectoryPage (panel) | 13-line conditional (identical) | w-20 h-20 (80px) | `<OrgLogo variant="square">` | 80px | Same |

**Commit:** `5a552e2`

---

## 3C: Registration Header

### PublicRegistrationPage

**CSS classes removed:** `bg-lynx-navy`, `text-white`, `text-white/60`, `text-white/80`, `text-white/50`

**Inline styles added:**
- Header container: `style={{ backgroundColor: headerBgColor, color: headerTextColor }}`
- Title: `style={{ color: headerTextColor }}`
- Tagline: `style={{ color: headerTextColor + '99' }}` (60% opacity)
- Season line: `style={{ color: headerTextColor + 'cc' }}` (80% opacity)
- Date line: `style={{ color: headerTextColor + '80' }}` (50% opacity)

**Color source:** `headerBgColor = organization?.primary_color || orgBranding.primary_color || orgSettings.primary_color || '#10284C'`

**Fallback:** `#10284C` (Lynx navy) → white text via getContrastText. Identical to previous behavior for orgs without a primary_color.

### RegistrationCartPage

**accentColor text contrast:** Added `accentTextColor = getContrastText(accentColor)`. Applied to header `<h1>` via `style={{ color: accentTextColor }}` (was hardcoded `text-white`).

**orgLogo source fix:** Changed from `orgBranding.logo_url || orgSettings.logo_url || null` to `organization?.logo_url || orgBranding.logo_url || orgSettings.logo_url || null` — now prefers the top-level column, which is where logos are actually stored.

**Commit:** `3313832`

---

## 3D: Sidebar & Dashboard

### Sidebar (LynxSidebar.jsx)

**Before:** Always showed `/lynx-logo.png` (Lynx platform logo) at 28px height with "L" text fallback.

**After:** If `organization?.logo_url || organization?.name` is truthy, shows `<OrgLogo org={organization} size={34} />`. Otherwise falls back to the original Lynx logo. Org data comes from `useAuth()` which loads `select('*')` from organizations table.

### Dashboard (DashboardPage.jsx)

**Change:** HeroCard `orgLine` prop updated from plain text to inline JSX: `<OrgLogo size={18} />` + org name text. The HeroCard already supported JSX children in this prop.

**Commit:** `7daa100`

---

## 3E: OrgBrandingContext Status

**Consumers found: 3**
1. `MainApp.jsx` — uses `background` (line 626)
2. `DashboardPage.jsx` — uses `orgName`, `orgLogo` (line 319)
3. `ParentDashboard.jsx` — uses `orgName` (line 52)

**Provider mounted in:** `MainApp.jsx` lines 1593–1712 (wraps the entire authenticated app)

**Decision:** Context is alive and actively used. No changes made.

### email-html-builder.js `resolveOrgBranding()`

Returns:
- `headerColor`: `org.settings.branding.email_header_color` → `org.primary_color` → `#10284C`
- `headerLogo`: `org.settings.branding.email_header_logo` → `org.logo_url` → null
- `headerImage`: `org.email_header_image` → `org.settings.branding.email_header_image` → null
- `accentColor`: `org.secondary_color` → `#5BCBFA`
- `senderName`: `org.email_sender_name` → `org.name` → `'Lynx'`
- `replyTo`, `footerText`, `socialLinks`, `includeUnsubscribe`

Not modified per spec (Phase 4 scope).

---

## Build Verification

| Phase | Build | Time |
|-------|-------|------|
| 3A | PASS | 12.35s |
| 3B | PASS | 12.13s |
| 3C | PASS | 12.18s |
| 3D | PASS | 11.66s |

---

## Commit Hashes

| Phase | Hash | Message |
|-------|------|---------|
| 3A | `d1fec69` | feat: create reusable OrgLogo component with fallback chain |
| 3B | `5a552e2` | feat: standardize org logo rendering with OrgLogo component across public pages |
| 3C | `3313832` | feat: dynamic org brand colors on registration headers with contrast-safe text |
| 3D | `7daa100` | feat: add org logo to admin sidebar and dashboard hero card |
| 3F | `2427563` | docs: update parity log with branding phase 3 changes |

---

## Files Changed (10 total)

| File | Change |
|------|--------|
| `src/components/OrgLogo.jsx` | NEW — 50-line reusable component |
| `src/pages/public/PublicRegistrationPage.jsx` | Import OrgLogo + getContrastText, 2 logo swaps, dynamic header color |
| `src/pages/public/RegistrationCartPage.jsx` | Import OrgLogo + getContrastText, logo swap, contrast-safe header text, fix orgLogo source |
| `src/pages/public/CoachJoinPage.jsx` | Import OrgLogo, replace 10-line ternary |
| `src/pages/public/CoachInviteAcceptPage.jsx` | Import OrgLogo, replace 7-line ternary |
| `src/pages/public/ParentInviteAcceptPage.jsx` | Import OrgLogo, replace 7-line ternary |
| `src/pages/public/OrgDirectoryPage.jsx` | Import OrgLogo, replace 2 x 13-line blocks (card + panel) |
| `src/components/layout/LynxSidebar.jsx` | Import OrgLogo, show org logo when available |
| `src/pages/dashboard/DashboardPage.jsx` | Import OrgLogo, inline in HeroCard orgLine |
| `PARITY-LOG.md` | Add branding Phase 3 entry |

---

## Issues Encountered

- **RegistrationCartPage orgLogo source bug:** The cart was reading logo from `organization.settings.branding.logo_url` instead of the top-level `organization.logo_url` column (where logos are actually stored). Fixed by prepending `organization?.logo_url ||` to the fallback chain.
- **No list view in OrgDirectoryPage:** The spec mentioned a "list view" but the page only has a card grid view and a detail slide-over panel. Both were converted.
- **Line numbers shifted:** Investigation line numbers were ~5-10 lines off from Phase 1+2 changes. Read each file before editing.
