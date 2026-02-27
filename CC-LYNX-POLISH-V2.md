# CC-LYNX-POLISH-V2.md
## Lynx Brand Restyle — Polish Pass (v2)

**Date:** February 27, 2026  
**Prereq:** Phases 1-6 from CC-LYNX-BRAND-RESTYLE.md are complete. Commit 590eee4.  
**Goal:** Fix visibility, sizing, and contrast. CSS/Tailwind class changes ONLY.

---

## ABSOLUTE RULES — VIOLATION = ROLLBACK

1. **Read CLAUDE.md** before starting.
2. **ZERO functional changes.** No Supabase queries, no routing, no business logic, no data fetching changes.
3. **ZERO layout restructuring.** Do NOT move cards, reorder sections, add new components, remove existing components, merge cards, or change what data is displayed. The HTML structure stays THE SAME.
4. **ZERO JavaScript logic changes.** Only change className strings, inline style objects, and Tailwind classes. If you find yourself editing a `.map()`, `.filter()`, a `useState`, a `useEffect`, or any conditional rendering logic — STOP. That is out of scope.
5. **Do NOT touch:** `src/pages/gameprep/`, `src/pages/auth/`, `src/pages/public/`, `src/pages/setup/`
6. **Do NOT change sidebar show/hide breakpoints** (xl:flex, lg:flex stay as-is).
7. **Do NOT resize gallery/photo thumbnails on the Parent Player Hero card.** Leave those exactly as they are right now.
8. **Commit after each fix group.** Run `npm run build` to verify zero errors.
9. **If unsure whether a change is CSS-only or structural — skip it.**

---

## FIX 1: Nav Bar Gradient + Visibility
**File:** `src/MainApp.jsx` — HorizontalNavBar only  
**Scope:** Background style, text colors, text sizes. Nothing else.

### The nav bar must have a gradient background — not flat solid navy.

Find the `<header>` element in HorizontalNavBar. Change ONLY the background:

```jsx
// Replace whatever bg class or style is on the <header>:
<header
  className="h-16 flex items-center justify-between px-6 sticky top-0 z-50 w-full shadow-lg"
  style={{ background: 'linear-gradient(135deg, #10284C 0%, #153050 50%, #1B3A5C 100%)' }}
>
```

Do NOT change the height, padding, flex layout, sticky positioning, or z-index.

### Nav link text — increase size and ensure visibility:

Find the nav link button classes. Change ONLY the text/color classes:

```jsx
// Active nav item — must be clearly visible white on the gradient:
'px-5 py-2 text-sm font-semibold rounded-full bg-white/15 text-white whitespace-nowrap'

// Inactive nav item — must be readable, not washed out:
'px-5 py-2 text-sm font-medium rounded-full text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap'
```

**KEY:** The minimum opacity for inactive nav text is `text-white/80`. If you see `text-white/50`, `text-white/60`, or `text-white/70` anywhere in the nav — change it to `text-white/80`.

### Nav dropdown menus:

Any dropdown that opens FROM the nav bar should have:
- `bg-lynx-navy` or `bg-lynx-charcoal` background (dark, always)
- `text-white/90` for items
- `text-white` for active/hovered items
- `border-lynx-border-dark`

### Logo image:
```jsx
// Ensure the logo is h-8 (32px tall). If it's h-6 or h-7, bump to h-8:
<img src="/lynx-logo.png" alt="Lynx" className="h-8" />
```

### Right-side nav icons:
Find notification bell, chat icon, profile avatar. Ensure:
- Icon buttons: minimum `w-9 h-9` with `text-white/80`
- Profile avatar: minimum `w-9 h-9`
- Notification badge dot: minimum `w-2.5 h-2.5`

**Commit:** `git commit -m "Polish-v2: Nav gradient, text visibility, sizing"`

---

## FIX 2: Widen Left + Right Sidebar Columns
**Files:** `src/components/dashboard/OrgSidebar.jsx`, `src/components/dashboard/LiveActivity.jsx`, `src/components/parent/ParentLeftSidebar.jsx`, `src/components/parent/ParentRightPanel.jsx`, `src/components/coach/CoachRosterPanel.jsx`, `src/components/player/PlayerSocialPanel.jsx`  
**Scope:** Width values on `<aside>` elements ONLY.

### Current → New widths:

| Component | Current | New | Change |
|-----------|---------|-----|--------|
| OrgSidebar (Admin left) | `w-[280px]` | `w-[310px]` | +30px (~11%) |
| LiveActivity (Admin right) | `w-[300px]` | `w-[330px]` | +30px (~10%) |
| ParentLeftSidebar | `w-[280px]` | `w-[310px]` | +30px |
| ParentRightPanel | `w-[300px]` | `w-[330px]` | +30px |
| CoachRosterPanel | `w-[300px]` | `w-[330px]` | +30px |
| PlayerSocialPanel | `w-[300px]` | `w-[330px]` | +30px |

### How to apply:

In each file, find the `<aside>` element. It will have a `w-[Xpx]` class. Change ONLY the width number. Also add `shrink-0` if not already present.

Example:
```jsx
// OLD:
<aside className="hidden xl:flex w-[280px] shrink-0 flex-col ...">

// NEW:
<aside className="hidden xl:flex w-[310px] shrink-0 flex-col ...">
```

**Do NOT change:**
- The breakpoint (xl:flex, lg:flex — keep as-is)
- The flex-col, overflow, padding, border, or background classes
- Anything inside the sidebar — just the width on the `<aside>` tag

**Commit:** `git commit -m "Polish-v2: Widen sidebars +30px each"`

---

## FIX 3: Body Font Size Increase
**Files:** Various — className changes only  
**Scope:** Tailwind text size classes. No structural changes.

### The problem:
Body text (descriptions, list items, card content) is too small at 1440p 100% zoom. Headers are fine. We need to bump BODY text specifically.

### Global rule — search and replace these patterns:

**In card body content, descriptions, list items, and paragraphs:**

| Find this pattern | Replace with | Where |
|-------------------|-------------|-------|
| `text-xs` on readable body text | `text-sm` | Descriptions, list items, helper text |
| `text-xs` on card subtitles | `text-sm` | Card subtitle/description lines |
| `text-sm` on primary card content | `text-base` | Main content text in cards, form labels |

**Do NOT change:**
- `text-xs` on badges — badges stay `text-xs`
- `text-xs` on section labels (the uppercase tracked ones) — these stay `text-xs`
- `text-xs` on timestamps and "ago" text — these can stay `text-xs`
- `text-xs` on table header cells — these stay `text-xs`
- Any heading sizes — headers are fine as-is

### Specific patterns to find and fix:

**A. Card description/subtitle text:**
Search for patterns like `text-xs text-lynx-slate` or `text-xs text-slate-400` that appear directly below a card title. These are descriptions or subtitles. Bump to `text-sm`.

**B. List item text in sidebars:**
Quick Actions labels, "RSVP Needed" items, "Pending registrations" items, sidebar menu items — if they're `text-xs`, bump to `text-sm`.

**C. Stat labels under numbers:**
The labels like "POINTS", "KILLS", "WINS" under stat numbers — if they're `text-[10px]` or smaller than `text-xs`, bump to `text-xs`. If already `text-xs`, leave them.

**D. Table body cells:**
If table `<td>` content uses `text-xs`, bump to `text-sm`. Table headers (`<th>`) stay `text-xs`.

**E. Form input labels:**
If form labels are `text-xs`, bump to `text-sm font-medium`.

**F. Button text:**
Buttons should be minimum `text-sm font-semibold`. If any buttons use `text-xs`, bump to `text-sm`.

### How to do this safely:

1. Open each page file one at a time
2. Search for `text-xs` 
3. For each occurrence, ask: "Is this body content a user needs to read, or is it a label/badge/timestamp?"
4. If body content → change to `text-sm`
5. If label/badge/timestamp → leave as `text-xs`
6. Do NOT change any text-xs that is inside a badge, chip, or tag component

### Files to prioritize (user-facing dashboards):
1. `src/pages/dashboard/DashboardPage.jsx` and its sub-components
2. `src/components/dashboard/OrgSidebar.jsx`
3. `src/components/dashboard/LiveActivity.jsx`
4. `src/pages/schedule/SchedulePage.jsx`
5. `src/pages/teams/TeamsPage.jsx`
6. `src/pages/registrations/RegistrationsPage.jsx`
7. `src/pages/payments/PaymentsPage.jsx`
8. All parent and player dashboard components

**Commit:** `git commit -m "Polish-v2: Bump body text from text-xs to text-sm"`

---

## FIX 4: Light Text on Light Backgrounds
**Files:** Various — className changes only  
**Scope:** Text color classes. Nothing else.

### The problem:
Some text is nearly invisible in light mode because light gray text sits on light gray backgrounds.

### Fix pattern:

Search across all non-excluded files for these LOW CONTRAST patterns and fix them:

**A. `text-slate-400` in light mode contexts:**
`text-slate-400` is #94A3B8 — too light on white or cloud backgrounds.
- If used for body text → replace with `text-lynx-slate` (#5A6B7F)
- If used for decorative/muted text that doesn't need to be read → leave it

**B. `text-slate-500` in light mode:**
`text-slate-500` is #64748B — borderline. OK for large text, too light for small text.
- If `text-xs text-slate-500` → change to `text-xs text-lynx-slate font-medium`
- If `text-sm text-slate-500` → change to `text-sm text-lynx-slate`

**C. Section labels that disappear:**
Labels like "TEAM SNAPSHOT", "UPCOMING EVENTS", "NEEDS ATTENTION", "QUICK ACTIONS" — these uppercase tracked labels must be visible.
- Minimum: `text-xs font-semibold uppercase tracking-wider text-lynx-slate`
- If they currently use `text-slate-400` or `text-slate-500` → replace with `text-lynx-slate`

**D. "View All →" links:**
These should be `text-lynx-sky font-medium` — make sure they're not `text-slate-400` or too light.

**E. Breadcrumb text:**
Must be `text-sm text-lynx-slate` for inactive crumbs, `text-sm text-lynx-sky` for active/current.

**F. Progress bar labels:**
"31% collected" / "$4,155.15 overdue" — must be readable. Minimum `text-sm text-lynx-slate`.

### How to verify:
After making changes, view each page in LIGHT mode and squint. If you can't read something at arm's length, it needs more contrast.

**Commit:** `git commit -m "Polish-v2: Fix low-contrast text in light mode"`

---

## FIX 5: Card Content — Slightly Larger Stats and Charts
**Files:** Dashboard components only  
**Scope:** Text size classes and chart dimension props. NO structural changes.

### Rules:
- Do NOT move, reorder, add, or remove any cards or sections
- Do NOT change what data is displayed
- Do NOT change card padding or card sizing
- ONLY change text sizes inside cards and chart width/height props

### Stat numbers (the big numbers like "17", "109", "$1,875.01"):

If a primary stat number uses `text-xl` or `text-2xl`, it can bump ONE step:
- `text-xl` → `text-2xl`
- `text-2xl` → `text-3xl`

Do NOT go above `text-3xl` for any stat number. Do NOT bump `text-3xl` → `text-4xl`.

### Chart/graph dimensions:

If a donut chart or line chart has `width` and `height` props, bump by ~15%:
- `width={180}` → `width={200}`
- `height={180}` → `height={200}`
- `width={280}` → `width={320}`

Do NOT more than 20% increase on any chart dimension. The chart must still fit inside its card with padding.

### Legend/label text next to charts:

If chart legend items (like "Rostered: 15", "Pending: 4") use `text-xs`, bump to `text-sm`.

### Payment amounts in lists:

Recent payment rows ("Ava Test — $150") — ensure both the name and amount are `text-sm` minimum.

**Commit:** `git commit -m "Polish-v2: Bump stat numbers and chart sizes slightly"`

---

## FIX 6: Remaining Palette Cleanup
**Files:** Various  
**Scope:** Color class replacements only.

### Search and replace any remaining old palette references:

```bash
# Run these searches. If any results appear in non-excluded files, fix them:
grep -rn "bg-slate-900" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup
grep -rn "bg-slate-800" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup
grep -rn "bg-slate-50" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup
grep -rn "border-slate-700" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup
grep -rn "border-slate-200" src/ --include="*.jsx" | grep -v gameprep | grep -v auth | grep -v public | grep -v setup
grep -rn "2c3e50\|2C3E50" src/ --include="*.jsx"
```

**Replacements:**
- `bg-slate-900` → `bg-lynx-midnight`
- `bg-slate-800` → `bg-lynx-charcoal`
- `bg-slate-50` → `bg-lynx-cloud`
- `border-slate-700` → `border-lynx-border-dark`
- `border-slate-200` → `border-lynx-silver`
- `#2c3e50` / `#2C3E50` → `#10284C`

### Loading spinners:
Search for spinner/loading animations that use `border-amber`, `border-orange`, `border-gold`, or `border-blue`. Replace the accent color with `border-lynx-sky`.

### Fix any `text-white/50` or `text-white/60` in the nav area:
Minimum nav text opacity is `text-white/80`.

**Commit:** `git commit -m "Polish-v2: Remaining palette and spinner cleanup"`

---

## DONE — FINAL VERIFICATION

After all 6 fixes, verify:

- [ ] Nav bar has a visible navy-to-blue gradient (NOT flat solid)
- [ ] All nav text is readable (white/80 minimum)
- [ ] Sidebars are wider and content isn't cramped
- [ ] Body text in cards is comfortably readable (text-sm minimum)
- [ ] No light-on-light invisible text in light mode
- [ ] Stat numbers are prominent (text-2xl to text-3xl)
- [ ] Charts are appropriately sized within their cards
- [ ] No layout has been restructured — everything is where it was before
- [ ] Gallery thumbnails on Parent Player Hero card are UNCHANGED
- [ ] `npm run build` passes with zero errors
- [ ] Both light and dark mode look correct
