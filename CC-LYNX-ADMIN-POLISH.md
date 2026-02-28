# CC-LYNX-ADMIN-POLISH.md
## Lynx Admin Dashboard — Visual Polish Pass

**Date:** February 27, 2026  
**Starting commit:** 590eee4 (Phase 6 complete)  
**Goal:** Fix nav gradient, profile dropdown theme, text legibility, sidebar width, and card density across ALL dashboard views. CSS/Tailwind class changes ONLY.

---

## ABSOLUTE RULES — READ THREE TIMES BEFORE STARTING

1. **Read CLAUDE.md** in the repo root first.
2. **CSS/TAILWIND CLASS CHANGES ONLY.** You may change: className strings, inline `style={{}}` objects, Tailwind utility classes, chart dimension props (width/height numbers), and text content inside existing elements.
3. **You may NOT:** add new components, remove components, add new state variables, add new useEffect hooks, change data fetching, change routing, change conditional rendering logic, restructure JSX tree order, merge or split cards, or change what information a card displays.
4. **You may ADD small text/data elements ONLY inside existing card components** if: the data is already available as a prop or from existing state, AND the addition fills dead space in an existing card. Example: adding a "Start Date" row to RegistrationStatsCard using data already passed in via `stats` prop is OK. Adding a new API call is NOT OK.
5. **Do NOT touch:** `src/pages/gameprep/`, `src/pages/auth/`, `src/pages/public/`, `src/pages/setup/`
6. **Do NOT change gallery/photo thumbnail sizes** on the Parent Player Hero card.
7. **Every change must work at 100% zoom AND 150% zoom AND 80% zoom.** Use responsive Tailwind classes (sm:, md:, lg:, xl:) and avoid fixed pixel widths on text. Cards must have `overflow-hidden`. Text in single-line contexts must use `truncate` or `line-clamp-1`.
8. **Commit after each fix group.** Run `npm run build` to verify zero errors before committing.

---

## FIX 1: Nav Bar — Gradient Background
**File:** `src/MainApp.jsx` — the `<header>` element inside HorizontalNavBar  
**Change:** ONE line — the background style

The nav bar MUST have a gradient from navy to a slightly lighter blue. This has been requested 3 times and must be applied correctly.

Find the `<header>` tag (around line 665). Replace its background with an inline style:

```jsx
<header
  className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full shadow-lg"
  style={{ background: 'linear-gradient(135deg, #10284C 0%, #153050 50%, #1B3A5C 100%)' }}
>
```

**Remove** any `bg-[#2c3e50]` or `bg-[#10284C]` or `bg-lynx-navy` class from the header — the inline style handles it.

**Do NOT change** the header height, padding, flex layout, sticky, or z-index.

**Commit:** `git commit -m "Fix 1: Nav bar gradient background"`

---

## FIX 2: Nav Text Visibility
**File:** `src/MainApp.jsx` — nav link buttons inside HorizontalNavBar  
**Change:** className text color/size values only

Find where nav items are rendered (the `.map()` that creates nav buttons). Change ONLY the className strings on the button elements:

**Active nav item:**
```
px-5 py-2 text-sm font-semibold rounded-full bg-white/20 text-white whitespace-nowrap
```

**Inactive nav item:**
```
px-5 py-2 text-sm font-medium rounded-full text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap
```

**Dropdown trigger items** (items with chevron arrows indicating submenus):
Same pattern — inactive text must be `text-white/80` minimum, never `text-white/50` or `text-white/60` or `text-white/70`.

**Right-side nav icons** (notification bell, chat, etc): Ensure they use `text-white/80 hover:text-white`. Icons should be `w-5 h-5` minimum.

**Commit:** `git commit -m "Fix 2: Nav text visibility — white/80 minimum"`

---

## FIX 3: Profile Dropdown — Fix Dark Mode Stuck
**File:** `src/MainApp.jsx` — the ProfileDropdown / RoleSwitcher component  
**Change:** className strings on the dropdown container and items

The profile dropdown menu (top-right, shows role switcher, dark/light toggle, sign out) is rendering with dark mode styling even in light mode. 

Find the dropdown container div (the one that appears when `showRoleSwitcher` is true). It has a conditional className like:
```jsx
isDark 
  ? 'bg-slate-800 backdrop-blur-2xl border border-white/[0.08] ...' 
  : 'bg-white/95 backdrop-blur-2xl border border-slate-200/60 ...'
```

**Update the light mode version** to use Lynx palette:
```jsx
isDark 
  ? 'bg-lynx-charcoal backdrop-blur-2xl border border-lynx-border-dark shadow-[0_8px_40px_rgba(0,0,0,0.5)]' 
  : 'bg-white backdrop-blur-2xl border border-lynx-silver shadow-[0_8px_40px_rgba(0,0,0,0.12)]'
```

**Update text colors inside the dropdown** — search for `tc.text`, `tc.textMuted`, `tc.textSecondary` usage. These should work correctly if the theme context is set up right. But also check for any hardcoded `text-white` or `text-slate-*` that ignores the theme.

**Update the "Accent Color" section** — either remove it entirely (Lynx has one brand color) or hide it:
```jsx
{/* Remove or comment out the entire accent color picker div */}
```

**Commit:** `git commit -m "Fix 3: Profile dropdown respects light/dark mode"`

---

## FIX 4: Global Base Font Size
**File:** `index.html`  
**Change:** Add ONE CSS rule

In the `<style>` block, add this rule right after the `* { margin:0... }` reset:

```css
html {
  font-size: 17px;
}
```

This scales ALL rem-based Tailwind sizes up by ~6% globally. Every `text-sm`, `text-base`, `text-xs` gets proportionally bigger. This is the single highest-leverage fix for legibility.

**After adding this, check:** Does anything overflow or break? Open the app, navigate through admin, coach, parent, player dashboards. If a specific element overflows, add `overflow-hidden truncate` to that element specifically — do NOT remove the html font-size rule.

**Commit:** `git commit -m "Fix 4: Global base font size 17px for legibility"`

---

## FIX 5: Body Text Size Bump
**Files:** All dashboard components, sidebar components, card components  
**Change:** Tailwind text size classes only

After Fix 4 increases the base, some `text-xs` elements will still be too small. Apply these targeted bumps:

### Rules:
- `text-xs` that is **readable body content** (descriptions, list items, helper text, card subtitles) → change to `text-sm`
- `text-xs` that is a **badge, timestamp, or uppercase section label** → LEAVE AS `text-xs`
- `text-sm` that is **primary card content** (the main text a user reads) → can optionally bump to `text-base` if it looks too small after Fix 4

### Priority files:
1. `src/components/dashboard/OrgSidebar.jsx` — sidebar labels, list items, quick actions
2. `src/components/dashboard/LiveActivity.jsx` — activity list items, timestamps
3. `src/components/dashboard/RegistrationStatsCard.jsx` — legend items
4. `src/components/dashboard/PaymentSummaryCard.jsx` — payment rows, labels
5. `src/components/dashboard/UpcomingEventsCard.jsx` — event text
6. `src/components/dashboard/TeamSnapshot.jsx` — team names, player counts
7. `src/pages/dashboard/DashboardPage.jsx` — inline card components (SeasonCard, FinancialSummary, etc.)

### Specific patterns to find and fix in these files:

**Card subtitle/description lines:**
```jsx
// FIND: text-xs text-slate-500  or  text-xs text-lynx-slate  or  text-xs ${tc.textMuted}
// CHANGE TO: text-sm [same color class]
```

**Sidebar list items (Quick Actions, Needs Attention, etc.):**
```jsx
// FIND: text-xs on the label text of clickable items
// CHANGE TO: text-sm
```

**Table body cells:**
```jsx
// FIND: text-xs on <td> content
// CHANGE TO: text-sm
```

### What NOT to change:
- Badge text (stays `text-xs`)
- Uppercase tracked section labels like "TEAM SNAPSHOT", "QUICK ACTIONS" (stays `text-xs font-semibold uppercase tracking-wider`)
- Timestamps like "27d ago" (stays `text-xs`)
- Tiny labels under stat numbers like "WINS", "LOSSES" (stays `text-xs`)

**Commit:** `git commit -m "Fix 5: Bump body text-xs to text-sm for readability"`

---

## FIX 6: Light-on-Light Contrast
**Files:** Various  
**Change:** Text color classes only

### Problem:
In light mode, some text uses `text-slate-400` (#94A3B8) or `text-slate-500` (#64748B) which is too faint on white/cloud/frost backgrounds.

### Fix:

**Search pattern 1:** `text-slate-400` in light mode contexts  
**Replace with:** `text-lynx-slate` (which is #5A6B7F — much better contrast)

**Search pattern 2:** `text-slate-500` on small text  
**Replace with:** `text-lynx-slate`

**Search pattern 3:** Section labels like "TEAM SNAPSHOT", "REGISTRATION STATS", "NEEDS ATTENTION"  
**Ensure they use:** `text-lynx-slate font-semibold` (not text-slate-400/500)

**Search pattern 4:** "View All →" links  
**Ensure they use:** `text-lynx-sky font-medium` (bright and clickable-looking)

**Search pattern 5:** `text-slate-600` on descriptive text  
**This is OK** — #475569 has good contrast. Leave these alone.

### Files to check:
Run this search and fix every result in non-excluded files:
```bash
grep -rn "text-slate-400\|text-slate-300" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup
```

For each result: if the text needs to be read by a user → change to `text-lynx-slate` or `${tc.textSecondary}`.

**Commit:** `git commit -m "Fix 6: Light mode text contrast — slate-400 to lynx-slate"`

---

## FIX 7: Widen Sidebars
**Files:** 6 sidebar component files  
**Change:** Width value on `<aside>` tag only

| File | Find | Replace |
|------|------|---------|
| `src/components/dashboard/OrgSidebar.jsx` | `w-[280px]` | `w-[310px]` |
| `src/components/dashboard/LiveActivity.jsx` | `w-[300px]` | `w-[330px]` |
| `src/components/parent/ParentLeftSidebar.jsx` | `w-[280px]` | `w-[310px]` |
| `src/components/parent/ParentRightPanel.jsx` | `w-[300px]` | `w-[330px]` |
| `src/components/coach/CoachRosterPanel.jsx` | `w-[300px]` | `w-[330px]` |
| `src/components/player/PlayerSocialPanel.jsx` | `w-[300px]` | `w-[330px]` |

**Also ensure** each `<aside>` has `shrink-0` class to prevent flex compression.

**Do NOT change:** breakpoints (xl:flex, lg:flex), padding, borders, backgrounds, or anything inside the sidebars.

**Commit:** `git commit -m "Fix 7: Widen sidebars +30px for breathing room"`

---

## FIX 8: Card Stat Sizing
**Files:** Dashboard card components  
**Change:** Text size classes and chart dimension props ONLY

### Stat numbers — bump ONE step if undersized:
- `text-lg` stat numbers → `text-xl`
- `text-xl` stat numbers → `text-2xl`  
- `text-2xl` stat numbers → `text-3xl`
- Already `text-3xl` or larger → LEAVE ALONE

### Charts — bump dimensions by ~15%:
- Donut/pie charts: if `width` prop is under 200, bump to 200-220
- Line charts: if `width` prop is under 300, bump to 320
- Do NOT exceed 20% size increase on any chart

### Legend items next to charts:
- If `text-xs` → bump to `text-sm`
- Dot indicators: if `w-2 h-2` → bump to `w-2.5 h-2.5`
- Gap between legend items: if `space-y-1` → bump to `space-y-2`

### Payment amounts in card lists:
- Name and amount: ensure `text-sm` minimum
- Row padding: ensure `py-2.5` minimum

### Progress bars:
- If `h-1.5` or `h-2` → bump to `h-2.5`
- Ensure `rounded-full`

**CRITICAL:** After every size increase, verify the card doesn't overflow. Each card component's outermost div must have `overflow-hidden`.

**Commit:** `git commit -m "Fix 8: Card stats, charts, and content density"`

---

## FIX 9: Remaining Old Palette Sweep
**Files:** Various  
**Change:** Color class replacements

Run these searches and replace any remaining old palette references in non-excluded files:

```bash
grep -rn "bg-slate-900" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup | grep -v node_modules
grep -rn "bg-slate-800" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup | grep -v node_modules
grep -rn "bg-slate-50" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup | grep -v node_modules
grep -rn "border-slate-700" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup | grep -v node_modules
grep -rn "border-slate-200" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup | grep -v node_modules
grep -rn "2c3e50\|2C3E50" src/ --include="*.jsx" | grep -v node_modules
grep -rn "text-white/[456]0\|text-white/50\|text-white/60" src/ --include="*.jsx" | grep -v node_modules
```

**Replacements:**
| Find | Replace |
|------|---------|
| `bg-slate-900` | `bg-lynx-midnight` |
| `bg-slate-800` | `bg-lynx-charcoal` |
| `bg-slate-50` | `bg-lynx-cloud` |
| `border-slate-700` | `border-lynx-border-dark` |
| `border-slate-200` | `border-lynx-silver` |
| `#2c3e50` or `#2C3E50` | `#10284C` |
| `text-white/40` through `text-white/60` in nav context | `text-white/80` |

**Also fix loading spinners:** search for `border-amber`, `border-orange`, `border-gold`, `border-blue` on spinner elements. Replace accent color with `border-lynx-sky`.

**Commit:** `git commit -m "Fix 9: Final palette sweep — remaining slate and old colors"`

---

## FINAL VERIFICATION

After ALL 9 fixes, run `npm run build` and verify:

- [ ] Nav bar has visible gradient (navy → slightly lighter blue), NOT flat solid
- [ ] All nav text readable — white/80 minimum for inactive items
- [ ] Profile dropdown menu: white bg in light mode, dark bg in dark mode
- [ ] Accent color picker is removed from profile dropdown
- [ ] Body text is comfortable to read at 100% zoom on 1440p (arm's length test)
- [ ] No light-on-light invisible text in light mode
- [ ] Sidebars are wider and not cramped
- [ ] Stat numbers are prominent but not oversized
- [ ] Charts are proportionally sized within their cards
- [ ] No elements overflow their containers at 100% or 150% zoom
- [ ] No horizontal scrollbar at any zoom level
- [ ] Gallery thumbnails on Parent Player Hero card are UNCHANGED
- [ ] Both light and dark mode work correctly
- [ ] No build errors
