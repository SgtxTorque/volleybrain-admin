# CC-LYNX-BRAND-RESTYLE.md
## Lynx Brand Restyle — Complete Web Platform Overhaul

**Date:** February 27, 2026  
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)  
**Estimated total CC time:** 3–4 hours across 6–8 sessions

---

## RULES — READ FIRST

1. **Read CLAUDE.md and DATABASE_SCHEMA.md** in the repo root before doing anything.
2. **ZERO functional changes.** No Supabase queries, no routing, no business logic, no API calls.
3. **Git commit after each phase.** Run `npm run dev` to verify no build errors.
4. **Do NOT touch** `src/pages/gameprep/` — GamePrepPage and GameDayCommandCenter keep their tactical dark theme by design.
5. **Do NOT touch** `src/pages/auth/` or `src/pages/public/` — login, setup wizard, and public pages are separate.

---

## BRAND CONTEXT

The app is rebranding from **VolleyBrain** to **Lynx** (thelynxapp.com). The logo is a geometric angular lynx face in deep navy + sky blue. This restyle aligns the entire web admin portal with the new brand identity.

Key visual targets:
- **12-color palette** replacing the old multi-accent system
- **12px card roundness** (down from 16px) for a sharper, more professional feel
- **Single accent color** (Sky Blue) replacing the 6-color picker
- **Gradient nav bar** with logo mark
- **Zebra-striped tables** for better data scanning
- **Font cleanup** — remove all custom Google Font imports, rely on Tele-Grotesk system font

---

## THE 12-COLOR SYSTEM

### Brand Core (from logo)

| Token | Name | Hex | Tailwind Class | Usage |
|-------|------|-----|----------------|-------|
| `lynx-navy` | Navy | `#10284C` | `bg-lynx-navy` / `text-lynx-navy` | Nav bar, page titles, primary text (light) |
| `lynx-sky` | Sky Blue | `#4BB9EC` | `bg-lynx-sky` / `text-lynx-sky` | Primary action: buttons, links, active tabs |
| `lynx-deep` | Deep Sky | `#2A9BD4` | `bg-lynx-deep` / `text-lynx-deep` | Hover/pressed states on sky blue |
| `lynx-ice` | Ice Blue | `#E8F4FD` | `bg-lynx-ice` / `text-lynx-ice` | Selected rows, highlights, active card tint |

### Neutrals (navy-tinted)

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `lynx-slate` | Slate | `#5A6B7F` | Secondary text, labels, captions |
| `lynx-silver` | Silver | `#DFE4EA` | Card borders, dividers, input outlines |

### Surfaces — Light Mode

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `lynx-cloud` | Cloud | `#F5F7FA` | Page background |
| — | White | `#FFFFFF` | Cards, modals, dropdowns |
| `lynx-frost` | Frost | `#F0F3F7` | Inner panels, table headers, zebra rows |

### Surfaces — Dark Mode

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `lynx-midnight` | Midnight | `#0A1B33` | Page background |
| `lynx-charcoal` | Charcoal | `#1A2332` | Cards, modals |
| `lynx-graphite` | Graphite | `#232F3E` | Inner panels, table headers, zebra rows |

### Dark Mode Border

| Token | Hex | Usage |
|-------|-----|-------|
| `lynx-border-dark` | `#2A3545` | All borders and dividers in dark mode |

### Semantic Colors (DO NOT CHANGE)

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Win, going, confirmed |
| Error | `#EF4444` | Loss, failed, delete |
| Warning | `#F59E0B` | Pending, attention |
| Info | `#4BB9EC` | = Sky Blue |

---

## LOGO FILES

Two logo files are in the repo root. **Before starting Phase 1**, copy them to `public/`:

```bash
cp lynx-icon-logo.png public/lynx-icon-logo.png
cp lynx-logo.png public/lynx-logo.png
```

| File | What | Where it goes |
|------|------|---------------|
| `lynx-icon-logo.png` | Lynx face mark only (square) | Favicon, nav icon, mobile app icon |
| `lynx-logo.png` | Full horizontal logo (face + "lynx" wordmark) | Nav bar, login page headers |

Both are on black/transparent backgrounds with the navy + sky blue brand colors.

---

## EXECUTION PLAN — 7 PHASES

### Phase 1: Theme Foundation
**Files:** `tailwind.config.js`, `src/constants/theme.js`, `src/contexts/ThemeContext.jsx`  
**Time:** 30–45 min  
**Risk:** Medium — this is the foundation everything else builds on

#### 1A. Update `tailwind.config.js`

In the `extend.colors` section, **add** the Lynx tokens:

```javascript
lynx: {
  navy: '#10284C',
  sky: '#4BB9EC',
  deep: '#2A9BD4',
  ice: '#E8F4FD',
  slate: '#5A6B7F',
  silver: '#DFE4EA',
  cloud: '#F5F7FA',
  frost: '#F0F3F7',
  midnight: '#0A1B33',
  charcoal: '#1A2332',
  graphite: '#232F3E',
  'border-dark': '#2A3545',
},
```

Keep existing color definitions (glass, gold, dark) for now — removing them risks breaking pages we're not touching.

#### 1B. Update `src/constants/theme.js`

**Replace `accentColors`** — remove all 6 options (orange, blue, purple, green, rose, slate). Replace with:

```javascript
export const accentColors = {
  lynx: {
    primary: '#4BB9EC',
    light: '#E8F4FD',
    lighter: '#F0F8FF',
    dark: '#2A9BD4',
    glow: 'rgba(75, 185, 236, 0.15)',
    navBar: '#10284C',
    navBarSolid: '#10284C',
  },
}
```

**Replace `themes.light`:**
```javascript
light: {
  name: 'light',
  bg: 'bg-lynx-cloud',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-lynx-frost',
  bgHover: 'hover:bg-lynx-frost',
  border: 'border-lynx-silver',
  text: 'text-lynx-navy',
  textSecondary: 'text-lynx-slate',
  textMuted: 'text-lynx-slate',
  colors: {
    bg: '#F5F7FA',
    bgSecondary: '#FFFFFF',
    bgTertiary: '#F0F3F7',
    card: '#FFFFFF',
    cardAlt: '#F0F3F7',
    border: '#DFE4EA',
    text: '#10284C',
    textSecondary: '#5A6B7F',
    textMuted: '#5A6B7F',
  }
}
```

**Replace `themes.dark`:**
```javascript
dark: {
  name: 'dark',
  bg: 'bg-lynx-midnight',
  bgSecondary: 'bg-lynx-charcoal',
  bgTertiary: 'bg-lynx-graphite',
  bgHover: 'hover:bg-lynx-graphite',
  border: 'border-lynx-border-dark',
  text: 'text-white',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  colors: {
    bg: '#0A1B33',
    bgSecondary: '#1A2332',
    bgTertiary: '#232F3E',
    card: '#1A2332',
    cardAlt: '#232F3E',
    border: '#2A3545',
    text: '#ffffff',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
  }
}
```

**Replace `colorPickerOptions`:**
```javascript
export const colorPickerOptions = [
  { id: 'lynx', color: '#4BB9EC', label: 'Lynx Blue' },
]
```

Keep `statusColors` and `priorityColors` exactly as they are.

#### 1C. Update `src/contexts/ThemeContext.jsx`

**Default accent** → `'lynx'`:
```javascript
const [accentColor, setAccentColor] = useState(() => localStorage.getItem('vb_accent') || 'lynx')
```

**Update `useThemeClasses`** — replace all `bg-slate-*` references with Lynx tokens:

```javascript
export function useThemeClasses() {
  const { isDark, accent } = useTheme()
  return {
    pageBg: isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud',
    cardBg: isDark ? 'bg-lynx-charcoal' : 'bg-white',
    cardBgAlt: isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost',
    inputBg: isDark ? 'bg-lynx-graphite' : 'bg-white',
    modalBg: isDark ? 'bg-lynx-charcoal' : 'bg-white',
    border: isDark ? 'border-lynx-border-dark' : 'border-lynx-silver',
    text: isDark ? 'text-white' : 'text-lynx-navy',
    textSecondary: isDark ? 'text-slate-300' : 'text-lynx-slate',
    textMuted: isDark ? 'text-slate-400' : 'text-lynx-slate',
    hoverBg: isDark ? 'hover:bg-lynx-graphite' : 'hover:bg-lynx-frost',
    hoverBgAlt: isDark ? 'hover:bg-lynx-charcoal' : 'hover:bg-lynx-cloud',
    card: isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver',
    input: isDark
      ? 'bg-lynx-graphite border-lynx-border-dark text-white placeholder-slate-500'
      : 'bg-white border-lynx-silver text-lynx-navy placeholder-slate-400',
    modal: isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver',
    // Zebra row for tables
    zebraRow: isDark ? 'bg-lynx-graphite/50' : 'bg-lynx-frost/50',
    // Keep backward compatibility
    colors: isDark ? themes.dark.colors : themes.light.colors,
    accent: accent,
    navBar: '#10284C',
    navBarSolid: '#10284C',
  }
}
```

**Update the CSS variable `useEffect`** in ThemeProvider:

```javascript
// Accent — always Lynx
root.style.setProperty('--accent-primary', '#4BB9EC')
root.style.setProperty('--accent-light', '#E8F4FD')
root.style.setProperty('--accent-dark', '#2A9BD4')
root.style.setProperty('--navbar-bg', '#10284C')
root.style.setProperty('--navbar-bg-solid', '#10284C')
```

**Commit:** `git add -A && git commit -m "Phase 1: Lynx 12-color system in theme foundation"`

---

### Phase 2: Full Rebrand — Logo, Nav, Favicon, Meta, Strings
**Files:** `index.html`, `src/MainApp.jsx`, plus 9 other files with "VolleyBrain" strings  
**Time:** 30–45 min  
**Risk:** Low-Medium

#### 2A. Update `index.html` (repo root)

**Title and meta tags:**
```html
<!-- OLD -->
<title>VolleyBrain Admin Portal</title>
<meta name="description" content="Youth volleyball league management — teams, scheduling, payments, and game day tools." />
<meta property="og:title" content="VolleyBrain — League Management" />
<meta property="og:description" content="Youth volleyball league management — teams, scheduling, payments, and game day tools." />
<meta property="og:site_name" content="VolleyBrain" />
<meta name="apple-mobile-web-app-title" content="VolleyBrain" />

<!-- NEW -->
<title>Lynx — Sports Management</title>
<meta name="description" content="Youth sports management — teams, scheduling, payments, and game day tools." />
<meta property="og:title" content="Lynx — Sports Management" />
<meta property="og:description" content="Youth sports management — teams, scheduling, payments, and game day tools." />
<meta property="og:site_name" content="Lynx" />
<meta name="apple-mobile-web-app-title" content="Lynx" />
```

**Theme color:**
```html
<!-- OLD -->
<meta name="theme-color" content="#0a0a0a" />

<!-- NEW -->
<meta name="theme-color" content="#10284C" />
```

**Favicon:**
```html
<!-- OLD -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- NEW -->
<link rel="icon" type="image/png" href="/lynx-icon-logo.png" />
```

**Font — replace Space Grotesk with Tele-Grotesk (already in /public/fonts):**

Check if Tele-Grotesk is already loaded via `tailwind.config.js` font stack. If so, the Google Fonts link for Space Grotesk can be removed:
```html
<!-- REMOVE these 3 lines if Tele-Grotesk is loaded locally -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Body font-family in `<style>` block:**
```css
/* OLD */
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;

/* NEW */
font-family: 'Tele-Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Loading spinner color in `<style>` block:**
```css
/* OLD */
border-top-color: var(--gold);

/* NEW */
border-top-color: #4BB9EC;
```

**CSS custom properties in `:root` — update to Lynx colors:**
```css
/* OLD */
--gold: #FFD700;
--gold-dim: #B8860B;
--dark: #0a0a0a;
--darker: #050505;

/* NEW */
--gold: #4BB9EC;
--gold-dim: #2A9BD4;
--dark: #0A1B33;
--darker: #071424;
```

#### 2B. Update nav bar in `src/MainApp.jsx`

**Nav bar background (line ~665):**
```jsx
// OLD:
<header className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full bg-[#2c3e50] shadow-md">

// NEW — gradient nav with subtle blue tint:
<header className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full shadow-md" style={{ background: 'linear-gradient(135deg, #10284C 0%, #152E4A 50%, #1A3555 100%)' }}>
```

**Logo area (lines ~668-672) — replace volleyball icon + text with logo image:**
```jsx
// OLD:
<div className="flex items-center gap-3">
  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
    <VolleyballIcon className="w-4 h-4 text-white" />
  </div>
  <span className="text-base font-bold tracking-widest text-white">VOLLEYBRAIN</span>
</div>

// NEW:
<div className="flex items-center gap-3">
  <img src="/lynx-logo.png" alt="Lynx" className="h-7" />
</div>
```

**Active nav item styling — search for all `accent-primary` in MainApp.jsx (~15 refs):**
```jsx
// OLD pattern:
'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'

// NEW:
'bg-lynx-sky/15 text-lynx-sky'
```

**Notification dots and indicators:**
```jsx
// OLD:
'bg-[var(--accent-primary)]'

// NEW:
'bg-lynx-sky'
```

**Remove VolleyballIcon import** at the top of MainApp.jsx if no longer used anywhere in the file:
```jsx
// Check if VolleyballIcon is used elsewhere in the file first
// If only used in the nav logo area (now replaced), remove the import
```

#### 2C. Hide accent color picker

In the settings/theme dropdown (around line 460–470 in MainApp.jsx), find the section with `accentColor`, `changeAccent`, and the color circle buttons. Comment it out or remove it. Lynx has one brand color — no user selection.

#### 2D. Replace "VolleyBrain" strings in other files

These files contain "VolleyBrain" text shown to users. Replace with "Lynx":

| File | What to change |
|------|---------------|
| `src/pages/dashboard/DashboardPage.jsx` | Line ~862: `'VolleyBrain'` → `'Lynx'` in welcome fallback |
| `src/components/journey/JourneyTimeline.jsx` | Search for "VolleyBrain" string |
| `src/components/parent/ParentLeftSidebar.jsx` | Search for "VolleyBrain" string |
| `src/contexts/ParentTutorialContext.jsx` | Search for "VolleyBrain" string |
| `src/pages/parent/ParentPaymentsPage.jsx` | Search for "VolleyBrain" string |
| `src/pages/platform/PlatformAdminPage.jsx` | Search for "VolleyBrain" string |

**Do NOT rename:**
- File names (keep `volleybrain-admin` as the repo/project name)
- Supabase table names or database references
- GitHub repo name
- Import paths or folder names

Only change **user-visible display strings** from "VolleyBrain" to "Lynx".

#### 2E. Update VolleyballIcon references across the codebase

There are 35 uses of `VolleyballIcon` across the app. For now, **keep them all** except the nav bar one (replaced with the logo image in 2B). These are decorative volleyball icons in various pages — they can be replaced with a Lynx icon later in a separate pass.

**Commit:** `git add -A && git commit -m "Phase 2: Full rebrand — Lynx logo, favicon, meta, strings"`

---

### Phase 3: Global Roundness Reduction
**All `.jsx` files under `src/` EXCEPT `src/pages/gameprep/`**  
**Time:** 15–20 min (mostly find-replace)  
**Risk:** Low

**IMPORTANT: Do step 1 FIRST, then step 2. Order matters.**

**Step 1:** `rounded-3xl` → `rounded-2xl` (16 instances)  
**Step 2:** `rounded-2xl` → `rounded-xl` (487 instances)

If you do step 2 first, the 3xl items become xl instead of 2xl.

**Do NOT change:**
- `rounded-full` (circles — avatars, pills)
- `rounded-xl` (already at target)
- `rounded-lg` (smaller elements)
- Anything in `src/pages/gameprep/`
- Anything in `tailwind.config.js`

This can be done as a codebase-wide find-replace in the editor.

**Commit:** `git add -A && git commit -m "Phase 3: Card roundness 16px → 12px"`

---

### Phase 4: Color Sweep — Replace Accent References
**All files using `var(--accent-primary)`**  
**Time:** 60–90 min  
**Risk:** Medium — 461 references, need to be careful

This is the biggest phase. There are 461 uses of `var(--accent-primary)` across 69 files. Since we've set the CSS variable to `#4BB9EC` in Phase 1, these will already *look* correct. But we should also replace hardcoded orange/amber decorative references.

#### 4A. Hardcoded orange hex values (62 references)

Search for `#F97316`, `#f97316`, `orange-500`, `orange-400`, `orange-600` in all `.jsx` files.

**Replace with the appropriate Lynx color:**
- Decorative/accent orange → `lynx-sky` or `#4BB9EC`
- Button backgrounds → `bg-lynx-sky hover:bg-lynx-deep`
- Text accents → `text-lynx-sky`
- Border accents → `border-lynx-sky`

**Do NOT replace:**
- `amber-500` used in semantic warning contexts (pending RSVPs, attention needed) — these are correct
- Status indicator colors that are explicitly for warnings

#### 4B. Inline style orange references

Search for `style={{` combined with `F97316` or `orange` or `#F9`. Replace inline hex colors with Lynx equivalents.

#### 4C. Verify no purple/rose accent leaks

Search for `purple-500`, `rose-500`, `violet` — these were from the old accent picker. If any appear in non-gameprep pages, replace with `lynx-sky`.

**Commit:** `git add -A && git commit -m "Phase 4: Replace accent colors with Lynx Sky Blue"`

---

### Phase 5: Font Cleanup
**11 files with custom Google Font imports**  
**Time:** 30–45 min  
**Risk:** Low-Medium

These 11 files import Bebas Neue, Rajdhani, or DM Sans and use custom CSS class systems. Strip them all.

**Files to clean:**
1. `src/pages/archives/SeasonArchivePage.jsx` — uses `.sa-display`, `.sa-heading`, `.sa-label`
2. `src/pages/profile/MyProfilePage.jsx`
3. `src/pages/schedule/CoachAvailabilityPage.jsx`
4. `src/pages/reports/ReportsPage.jsx`
5. `src/pages/reports/RegistrationFunnelPage.jsx`
6. `src/pages/settings/DataExportPage.jsx`
7. `src/pages/settings/SubscriptionPage.jsx`
8. `src/pages/platform/PlatformAdminPage.jsx` — uses `.pa-display`, `.pa-heading`, `.pa-label`
9. `src/pages/platform/PlatformAnalyticsPage.jsx` — uses `.an-display`, `.an-heading`, `.an-label`
10. `src/pages/platform/PlatformSubscriptionsPage.jsx` — uses `.ps-display`, `.ps-heading`, `.ps-label`
11. `src/pages/public/OrgDirectoryPage.jsx`

**For each file:**

1. **Remove** the `<style>` block or inline `@import` that loads Google Fonts
2. **Remove** the custom CSS class definitions (`.sa-display`, `.pa-heading`, etc.)
3. **Replace** custom class usage in JSX with standard Tailwind:
   - `.xx-display` (large headings) → `text-2xl font-bold` or `text-xl font-bold`
   - `.xx-heading` (section headings) → `text-lg font-semibold`
   - `.xx-label` (small labels) → `text-xs font-semibold uppercase tracking-wide text-lynx-slate`
4. **Verify** the page still renders correctly with system font (Tele-Grotesk from tailwind.config)

**Platform pages (8–10) are lower priority** — they're admin-only. Focus on user-facing pages first (1–7).

**Commit:** `git add -A && git commit -m "Phase 5: Strip custom fonts, use Tele-Grotesk system"`

---

### Phase 6: Visual Polish
**Various files**  
**Time:** 30–45 min  
**Risk:** Low

#### 6A. Zebra-striped tables

Find all data tables across the app. Add alternating row backgrounds:

```jsx
// In table row mapping:
<tr className={index % 2 === 1 ? (isDark ? 'bg-lynx-graphite/50' : 'bg-lynx-frost/50') : ''}>
```

Or use the `tc.zebraRow` class added in Phase 1:
```jsx
<tr className={index % 2 === 1 ? tc.zebraRow : ''}>
```

Key tables to update:
- Player stats tables (StandingsPage, PlayerStatsPage)
- Roster tables (TeamsPage)
- Registration tables (RegistrationsPage)
- Reports tables (ReportsPage)
- Any data list with 5+ rows

#### 6B. Consistent card patterns

Verify all main content cards follow the pattern:
- **Light:** `bg-white border border-lynx-silver rounded-xl shadow-sm`
- **Dark:** `bg-lynx-charcoal border border-lynx-border-dark rounded-xl`
- **Inner panels:** `bg-lynx-frost rounded-lg` (light) / `bg-lynx-graphite rounded-lg` (dark)

#### 6C. Section label pattern

All section headers should use the consistent pattern:
```jsx
<h3 className="text-xs font-semibold uppercase tracking-wide text-lynx-slate mb-2">
  SECTION TITLE
</h3>
```

This replaces the mix of bold sentence-case, all-caps large, and custom font headers.

**Commit:** `git add -A && git commit -m "Phase 6: Zebra tables, card consistency, visual polish"`

---

## SUMMARY TABLE

| Phase | What | Files | ~Time | Commit Message |
|-------|------|-------|-------|----------------|
| 1 | Theme foundation (12 colors, remove accent picker) | 3 files | 30–45 min | `Phase 1: Lynx 12-color system in theme foundation` |
| 2 | Full rebrand (logo, favicon, meta, nav, strings) | ~12 files | 30–45 min | `Phase 2: Full rebrand — Lynx logo, favicon, meta, strings` |
| 3 | Roundness reduction (16px → 12px) | ~80 files | 15–20 min | `Phase 3: Card roundness 16px → 12px` |
| 4 | Color sweep (orange → sky blue) | ~69 files | 60–90 min | `Phase 4: Replace accent colors with Lynx Sky Blue` |
| 5 | Font cleanup (strip Bebas/Rajdhani/DM Sans) | 11 files | 30–45 min | `Phase 5: Strip custom fonts, use Tele-Grotesk system` |
| 6 | Visual polish (zebra tables, card consistency) | Various | 30–45 min | `Phase 6: Zebra tables, card consistency, visual polish` |

**Total: ~3.5–5 hours across 6–8 CC sessions**

---

## VERIFICATION CHECKLIST (after all phases)

After completing all 6 phases, verify:

- [ ] Nav bar shows Lynx logo image with gradient navy background
- [ ] Browser tab shows Lynx favicon (lynx face mark) and title "Lynx — Sports Management"
- [ ] No "VolleyBrain" text visible anywhere in the UI (except code/file names which stay)
- [ ] All buttons are Sky Blue (`#4BB9EC`), hover is Deep Sky (`#2A9BD4`)
- [ ] No orange, purple, or rose accent colors visible anywhere
- [ ] All cards use `rounded-xl` (12px), not `rounded-2xl` (16px)
- [ ] Light mode: Cloud page bg → White cards → Frost inner panels
- [ ] Dark mode: Midnight page bg → Charcoal cards → Graphite inner panels
- [ ] No Bebas Neue or Rajdhani fonts visible on any page
- [ ] Tables have zebra striping (Frost/Graphite alternating rows)
- [ ] Accent color picker is hidden/removed from settings
- [ ] GamePrepPage and GameDayCommandCenter still have their dark tactical theme
- [ ] `npm run dev` builds with no errors
- [ ] Both light and dark mode work correctly across all pages

---

## PAGES TO SKIP (do not modify)

- `src/pages/gameprep/*` — intentional tactical dark theme
- `src/pages/auth/*` — login/signup flows
- `src/pages/public/*` — public-facing pages (except OrgDirectoryPage font cleanup)
- `src/pages/setup/*` — setup wizard
