# Phase Results — Registration Page Visual Upgrade

**Branch:** `fix/registration-visuals`
**Date:** April 15, 2026
**Spec:** `COMBO-SPEC-registration-visuals.md`

## Scope

Four visual fixes shipped together, triggered by Black Hornets Athletics (Marisa) feedback:

1. Banner image uploaded successfully but not rendering on the public registration pages
2. Org logo rendered too small on registration header (32–72px) — needed hero treatment
3. Upload size guidance on the Organization settings page was inadequate
4. Program cards looked nearly identical across sports — easy to register for wrong program

---

## Investigation Findings (Part A)

### A1 — Banner URL path

- **Save path** (OrganizationPage.jsx:396–410): `settings.branding.banner_url`
- **Upload handler** (SetupSectionContent.jsx:1511–1520): uploads to Supabase Storage (`media` bucket, `org-branding/` prefix) and stores `publicUrl` in `localData.brandingBannerUrl` → persisted through the save handler into `settings.branding.banner_url`
- **Read path on `PublicRegistrationPage`** (line 1097): `organization?.settings?.branding?.banner_url || orgBranding.banner_url` — correct, matched save path
- **Read path on `RegistrationCartPage`** (before this change): **no banner read at all** — the header was a solid accent-color bar with only a 28px logo + step progress
- **Organizations query**: both public pages call `supabase.from('organizations').select('*')` so the `settings` JSONB column IS returned

**Root cause of "solid yellow header — no banner image visible"**: `RegistrationCartPage` (the new cart-based flow used by Black Hornets) did not read or render the banner. `PublicRegistrationPage` did, but used only the double-reference fallback pointing to the same path, so any non-standard storage location (e.g. top-level `banner_url`) would fail silently.

### A2 — Logo current state

- `PublicRegistrationPage` header (line 1117): `<OrgLogo size={72} />`
- `RegistrationCartPage` header (line 1879): `<OrgLogo size={28} />`
- No drop-shadow, no hero padding, logo centered above small `text-2xl` org name
- `OrgLogo` accepts a `className` prop (confirmed in `src/components/OrgLogo.jsx`)

### A3 — Program card component

- **File:** `src/pages/public/RegistrationCartPage.jsx`
- **Components:** `ProgramCard` (line 64) for single-season programs, `MultiSeasonProgramCard` (line 149) for programs with >1 season
- **Current state:** 44px icon tile with `${sportColor}15` background (9% opacity), `text-sm` bold program name, small 11px date text. All sports render visually identical when `program.sport.color_primary` is missing (falls back to same `accentColor` for all cards)
- **Data available on `program`:** `id, name, icon, sport.id, sport.name, sport.icon, sport.color_primary, seasons[]` (from `loadPrograms` at line 1690–1696)

### A4 — Sport colors and icons

- `sports` table has `color_primary` and `icon` columns
- Fetched via `sport:sports(id, name, icon, color_primary)` join on both public pages
- **BUT** when an org has no configured sport (or `sports` rows are missing), the cards fall back to a uniform accent color — which is what Marisa saw
- No global `SPORT_COLORS` map existed in `src/` (search returned only SetupWizard uses and per-sport backfill scripts)

---

## Phase 1 — Banner rendering fix

**Commit:** `59c197b fix: render banner on registration pages and apply hero treatment to org logo` (shipped with Phase 2)

Changes:
- `PublicRegistrationPage.jsx:1097` — expanded `bannerUrl` fallback chain to try `settings.branding.banner_url`, `settings.banner_url`, `orgBranding.banner_url`, and top-level `banner_url` so any save location is covered
- `RegistrationCartPage.jsx:1243` — added `bannerUrl` constant (same 4-level fallback) and `orgTagline` constant to power the new hero

Scenario matched: **Scenario 2 (wrong/missing read path) + Scenario 1 (query missing field) simultaneously** — `RegistrationCartPage` had no read logic at all while `PublicRegistrationPage` read only one location. Phase 1's fix made both pages resilient to where the banner actually lives in `settings`.

Debug `console.log` **not added** — not needed since the issue was verified by code inspection (no banner render at all on cart page).

## Phase 2 — Logo hero treatment

**Commit:** `59c197b fix: render banner on registration pages and apply hero treatment to org logo`

**PublicRegistrationPage** (lines 1100–1140):
- Logo upgraded from 72px to responsive **120px (mobile) / 160px (md+)** with `drop-shadow-lg`
- Header padding `py-10` → `py-10 md:py-14`
- Org name `text-2xl` → `text-3xl md:text-4xl` with `tracking-tight`
- Tagline opacity raised from 60% (`99`) to 70% (`b3`)
- Banner overlay opacity 80% (`cc`) → 85% (`d9`) for better readability over the larger header
- Season line moved into its own `mt-6` block with responsive `text-base md:text-lg`

**RegistrationCartPage** (lines 1919–1962):
- Replaced the entire header bar with a full hero: banner image + 85% colored overlay + centered **110px (mobile) / 140px (md+) logo with `drop-shadow-lg`** + `text-2xl md:text-3xl` black org name + optional tagline
- Split the sticky step-progress into its own bar BELOW the hero, still sticky at top on scroll — preserves the 5-step UX

Applied to BOTH pages as specified.

## Phase 3 — Upload guidance

**Commit:** `32d2437 feat: enhanced upload guidance with recommended sizes, format tips, and banner coaching`

Updated 3 locations in `SetupSectionContent.jsx`:

1. **Identity section logo** (line ~337): Replaced `Square image recommended (200x200+)` with a 3-line guidance block — "📐 Recommended: 400×400 (square)", "Minimum: 200×200 · Max file size: 2MB", "Formats: PNG (transparent background recommended), JPG, WebP"
2. **Branding section logo** (line ~1568): Same 3-line block as above
3. **Branding section banner** (line ~1646): Replaced `Wide image recommended (1200x400+). Shows on team wall and registration.` with a 4-line block — "📐 Recommended: 1600×500 (landscape, ~3.2:1 ratio)", "Minimum: 1200×400 · Max file size: 5MB", "Formats: JPG, PNG, WebP — photos work great", plus an italic 💡 Tip coaching the user NOT to bake org name into the banner (since it's overlaid dynamically)

Styling pattern used: `mt-2 text-xs ${tc.textMuted} space-y-0.5` container, with `font-semibold ${tc.textSecondary}` on the "Recommended:" headline. Matches the existing theme-context (`tc`) helper classes used throughout the file.

## Phase 4 — Program card differentiation

**Commit:** `ed88e15 feat: visual differentiation for program cards with sport colors, larger icons, and accent strips`

Added at top of `RegistrationCartPage.jsx`:
- `SPORT_COLORS` map (14 sports + Other) covering Volleyball, Basketball, Soccer, Football, Baseball, Softball, Hockey, Tennis, Lacrosse, Swimming, Track, Cheer, Wrestling, General, Other
- `SPORT_ICONS` map matching the same keys with emoji
- `getProgramVisual(program, fallbackColor)` helper that resolves the best color/icon in priority order: `program.color` → `program.sport.color_primary` → `SPORT_COLORS[sport.name]` → `fallbackColor` → Other

Rewrote **both `ProgramCard` and `MultiSeasonProgramCard`**:
- **Top accent strip** (`h-2 w-full`) in the sport color — instantly distinguishes each card
- **Sport icon tile** bumped from `w-11 h-11 text-xl` to **`w-14 h-14 text-3xl`** with `${sportColor}1a` (10% opacity) tinted background
- Program name bumped from `text-sm` to `text-base`
- Fee bumped from `text-sm` to `text-base`
- **Season rows in `MultiSeasonProgramCard`** now have a **3px colored left border** in the sport color, and selected state uses `${sportColor}0d` (5% opacity) tinted background with matching border
- Card border: 1px default; 2px in sport color when selected (replaces old `ring-2 ring-offset-1`)
- Radii normalized to `14px` per design system

Did programs have their own color field? Programs carry `color` via `program.color` OR `program.sport.color_primary`. The helper checks both, then falls back to the SPORT_COLORS map — so Black Hornets' existing sport data will continue to drive the colors when present, and the map takes over when sports are missing/unconfigured.

## Phase 5 — Parity log

**Commit:** `2ce1348 docs: update parity log with registration visual upgrade`

Appended 4-bullet entry to `PARITY-LOG.md` under April 15, 2026 (Registration Visual Upgrade) flagging:
- Banner URL fallback pattern for mobile registration
- Hero logo sizing expectation for mobile
- No mobile action on upload guidance (web-only setting)
- Mobile cart should replicate sport color/icon card treatment

---

## Build Verification

`npx vite build` ran clean after every phase. Only pre-existing warnings:
- `fee-calculator.js` dynamic+static import mixing (harmless, pre-existing)
- Main chunk > 500 kB (project-wide, pre-existing)

| Phase | Build time | Status |
| ----- | ---------- | ------ |
| 1 (banner constant) | 11.32s | ✓ |
| 2 (hero treatment) | 11.98s | ✓ |
| 3 (upload guidance) | 11.55s | ✓ |
| 4 (program cards) | 11.58s | ✓ |
| 5 (parity log) | 11.69s | ✓ |

## Commits

| Phase | Commit  | Description |
| ----- | ------- | ----------- |
| 1+2   | 59c197b | fix: render banner on registration pages and apply hero treatment to org logo |
| 3     | 32d2437 | feat: enhanced upload guidance with recommended sizes, format tips, and banner coaching |
| 4     | ed88e15 | feat: visual differentiation for program cards with sport colors, larger icons, and accent strips |
| 5     | 2ce1348 | docs: update parity log with registration visual upgrade |

## Files Changed

### Phase 1 + 2
- `src/pages/public/PublicRegistrationPage.jsx` — bannerUrl fallback chain, hero logo sizing, responsive padding, overlay opacity bump
- `src/pages/public/RegistrationCartPage.jsx` — bannerUrl + orgTagline constants, full hero header (banner + overlay + logo + name + tagline), step progress split into its own sticky bar

### Phase 3
- `src/pages/settings/SetupSectionContent.jsx` — 3 upload guidance blocks replaced

### Phase 4
- `src/pages/public/RegistrationCartPage.jsx` — SPORT_COLORS / SPORT_ICONS / getProgramVisual helpers, rewritten `ProgramCard` and `MultiSeasonProgramCard`

### Phase 5
- `PARITY-LOG.md` — Registration Visual Upgrade entry

## Carlos Actions After Deploy

1. **Re-verify banner upload** at Settings → Organization → Branding → Upload Banner
2. **Visit `/register/<slug>`** (or `/r/<slug>`) on the Black Hornets org — the banner should now render as the hero background with a tinted overlay, and the org logo should dominate the header (130–160px)
3. **Check the cart flow program picker** — each program card should show a colored top stripe and large icon tile; multi-season programs should show colored left borders on each season row
4. **Test the upload guidance** on Settings → Organization → Branding — the help text below each uploader should now show recommended dimensions, max file size, and (for banner) a tip not to bake the org name into the image

## Issues Encountered

- The bug wasn't exactly any of the three scenarios in the spec — it was a hybrid: `PublicRegistrationPage` read the banner correctly but had only a single-path fallback, while `RegistrationCartPage` (the cart flow actually used by Marisa's org) had **no banner read or render at all**. Fixed both: defensive fallback on one, new hero-with-banner on the other.
- No console.log debug was added since the root cause was obvious from code inspection (missing render logic on the cart page).
- `OrgLogo` supports `className` but not arbitrary size overrides via classes — used two wrapped `<div className="hidden md:block">` / `<div className="md:hidden">` blocks with different `size` props for responsive sizing instead.
