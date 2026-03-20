# CC-PHASE1-SHARED-COMPONENTS.md
## Lynx Web Admin — V2 Dashboard Redesign: Phase 1
### Shared Components Foundation

**Branch:** `feat/v2-dashboard-redesign`
**Prereq:** Phase 0 (dead code cleanup + grid archive) COMPLETE
**Rule:** Presentation layer only. Every data hook, Supabase query, context provider, and service layer file stays UNTOUCHED. We are building new shells, not rewiring plumbing.

---

## EXECUTION CONTRACT

CC will execute this spec phase by phase. After EACH numbered sub-phase:
1. Run `npx tsc --noEmit` to verify no type errors introduced
2. Confirm the file compiles and exports correctly
3. `git add` + `git commit` with message: `feat(v2): Phase 1.X — ComponentName`
4. Move to the next sub-phase

**If any sub-phase introduces a type error or breaks an existing import, STOP and fix before proceeding.**

---

## SCOPE BOUNDARIES — READ THIS FIRST

### DO touch:
- `src/components/v2/` (NEW directory — all new shared components go here)
- `src/components/layout/LynxSidebar.jsx` (rework in place)
- `src/styles/v2-tokens.css` (NEW file — design tokens)

### DO NOT touch:
- Any file in `src/pages/` (dashboard pages wired in Phase 2-6)
- Any file in `src/hooks/` or `src/contexts/`
- Any existing component file EXCEPT `LynxSidebar.jsx`
- Any Supabase query, RLS policy, or service layer file
- `MainApp.jsx` routing logic (wired in Phase 2+)
- `widgetComponents.jsx` registry (updated in Phase 2+)

### DO NOT delete:
- Any file. Phase 0 handled cleanup. Phase 1 only ADDS and REWORKS.

### DO NOT invent:
- Table names, column names, or hook signatures. If a component needs data, define its prop interface and leave data wiring for later phases.
- New npm dependencies unless absolutely required and explicitly called out below

---

## RISK REGISTER

| Risk | Mitigation |
|------|-----------|
| LynxSidebar rework breaks all 5 dashboard pages | Rework is backward-compatible: same props, same nav items, just different render. Test by loading `/dashboard` after commit. |
| New components accidentally import from contexts | Shared components accept ALL data via props. Zero context imports except `useTheme` for dark/light and `useAppNavigate` for routing. |
| CSS variable collisions with existing theme | All v2 tokens namespaced under `--v2-*` prefix in dedicated `v2-tokens.css` file. No overwriting existing variables. |
| TopBar conflicts with existing Breadcrumb | TopBar is a new component. It does NOT replace Breadcrumb yet. Breadcrumb removal happens in Phase 2+ per-dashboard. |
| Player dark mode tokens bleed into light mode | Player overrides scoped via `.player-dashboard` parent class, not global. Defined in tokens file but only activated per-role. |

---

## DESIGN TOKENS — Sub-phase 1.0

**File:** `src/styles/v2-tokens.css` (NEW)

Create this file with all shared design tokens extracted from the HTML mockups. This is the single source of truth for v2 styling.

```css
/* ============================================
   LYNX V2 DESIGN TOKENS
   Source of truth for all v2 dashboard styles.
   Import in App.jsx or index.css.
   ============================================ */

:root {
  /* ---- Brand ---- */
  --v2-navy: #10284C;
  --v2-midnight: #0B1628;
  --v2-sky: #4BB9EC;
  --v2-gold: #FFD700;

  /* ---- Surfaces (Light Mode) ---- */
  --v2-surface: #F5F6F8;
  --v2-white: #FFFFFF;
  --v2-card-bg: var(--v2-white);
  --v2-border-subtle: rgba(16, 40, 76, 0.06);

  /* ---- Semantic Colors ---- */
  --v2-green: #22C55E;
  --v2-red: #EF4444;
  --v2-amber: #F59E0B;
  --v2-purple: #8B5CF6;
  --v2-coral: #F87171;

  /* ---- Text ---- */
  --v2-text-primary: #10284C;
  --v2-text-secondary: #64748B;
  --v2-text-muted: #94A3B8;

  /* ---- Shadows ---- */
  --v2-card-shadow: 0 1px 3px rgba(16, 40, 76, 0.04), 0 4px 12px rgba(16, 40, 76, 0.03);
  --v2-card-shadow-hover: 0 2px 8px rgba(16, 40, 76, 0.06), 0 8px 24px rgba(16, 40, 76, 0.05);

  /* ---- Dimensions ---- */
  --v2-radius: 14px;
  --v2-sidebar-width: 60px;
  --v2-topbar-height: 56px;
  --v2-side-col-width: 340px;

  /* ---- Typography ---- */
  --v2-font: 'Inter Variable', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ---- Player Dark Mode Override ---- */
/* Applied via .v2-player-dark parent class on player dashboard only */
.v2-player-dark {
  --v2-surface: #060E1A;
  --v2-card-bg: #132240;
  --v2-white: #0D1B2F;
  --v2-border-subtle: rgba(255, 255, 255, 0.06);
  --v2-text-primary: #E2E8F0;
  --v2-text-secondary: #94A3B8;
  --v2-text-muted: #64748B;
  --v2-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

**Action:**
1. Create `src/styles/v2-tokens.css` with the above content
2. Add `import './styles/v2-tokens.css';` to `src/App.jsx` (or wherever global CSS is imported), AFTER existing theme imports so v2 tokens don't override current behavior
3. Verify existing pages still render correctly after import (tokens are namespaced, no collision expected)
4. Commit: `feat(v2): Phase 1.0 — v2 design tokens`

---

## Sub-phase 1.1 — SlimSidebar (Rework LynxSidebar)

**File:** `src/components/layout/LynxSidebar.jsx` (MODIFY IN PLACE)

**What changes:**
- Remove hover-expand behavior (no more 64px -> 228px transition)
- Lock width to 60px permanently
- Remove: text labels, role pills, expanded state, theme toggle, accent picker, notification bell
- Keep: icon nav items, nav item grouping, active state logic, settings/help at bottom, platform mode button
- Change active state: dark navy fill (`--v2-navy`) with white icon. Inactive = muted icon on transparent.
- Background: white (`--v2-white`), right border: `1px solid var(--v2-border-subtle)`
- Logo block: 34x34px navy square, border-radius 10px, centered "L" in white, weight 800

**Exact CSS from mockup:**
```
.sidebar {
  position: fixed; top: 0; left: 0;
  width: 60px; height: 100vh;
  background: var(--v2-white);
  border-right: 1px solid var(--v2-border-subtle);
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 0 20px;
  z-index: 200;
}
.sidebar-btn {
  width: 40px; height: 40px; border-radius: 10px;
  /* inactive: */ color: var(--v2-text-muted); background: transparent;
}
.sidebar-btn:hover {
  background: var(--v2-surface); color: var(--v2-text-secondary);
}
.sidebar-btn.active {
  background: var(--v2-navy); color: white;
}
```

**Backward compatibility contract:**
- The component still accepts the same props it does today (navItems, activeView, onNavigate, etc.)
- It still renders the correct nav items per role
- It still calls `onNavigate` / `appNavigate` on click
- The only visual change is: always slim, no expand, no text

**Player dark mode:** When role is `player`, the sidebar uses midnight background, gold logo, gold active state. Apply via conditional class or inline style check against `activeView === 'player'`.

Player sidebar from mockup:
```
background: var(--v2-midnight);
border-right: 1px solid rgba(255,255,255,0.06);
.sidebar-logo { background: var(--v2-gold); color: var(--v2-midnight); }
.sidebar-btn.active { background: var(--v2-gold); color: var(--v2-midnight); }
```

**Responsive:** Hide sidebar below 700px (`@media (max-width: 700px) { display: none; }`)

**Testing:** After commit, load `/dashboard` as admin, coach, parent, player, team_manager. All 5 should show the slim sidebar with correct nav items highlighted. No console errors.

**Commit:** `feat(v2): Phase 1.1 — SlimSidebar rework`

---

## Sub-phase 1.2 — TopBar

**File:** `src/components/v2/TopBar.jsx` (NEW)

**Props interface:**
```jsx
TopBar.propTypes = {
  roleLabel: PropTypes.string.isRequired,       // "Lynx Admin", "Lynx Coach", etc.
  navLinks: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,          // "Dashboard", "Analytics", etc.
    pageId: PropTypes.string.isRequired,         // for appNavigate
    isActive: PropTypes.bool,
  })).isRequired,
  searchPlaceholder: PropTypes.string,           // "Search roster, teams..."
  onSearchClick: PropTypes.func,                 // opens CommandPalette
  notificationCount: PropTypes.number,           // badge count (0 = dot only if hasNotifications)
  hasNotifications: PropTypes.bool,              // show red dot
  avatarInitials: PropTypes.string,              // "CF", "CM", etc.
  avatarGradient: PropTypes.string,              // CSS gradient string
  onSettingsClick: PropTypes.func,
  onNotificationClick: PropTypes.func,
  onAvatarClick: PropTypes.func,
  onThemeToggle: PropTypes.func,                 // moon/sun toggle
  isDark: PropTypes.bool,                        // current theme state
};
```

**Structure (from admin mockup):**
```
<header> sticky, 56px height, z-index 100
  ├── Brand label (roleLabel) — 17px, weight 800, navy, padding-left 72px (accounts for sidebar)
  │   NOTE: padding-left is 72px when sidebar visible, 16px when sidebar hidden (<700px)
  ├── Nav links — flex row, gap 4px, margin-left 16px
  │   Each link: 13.5px, weight 600, secondary color, 6px 14px padding, 8px radius
  │   Active: navy text, surface background
  │   Hidden below 700px
  ├── (spacer — margin-left: auto)
  ├── Search trigger — surface bg, 10px radius, 7px 14px padding, 13px text
  │   Search icon (14px) + placeholder text + kbd "⌘K"
  │   onClick => onSearchClick (opens existing CommandPalette)
  │   kbd hidden below 700px
  ├── Theme toggle button — 36x36px, 10px radius, moon/sun icon
  │   Moon icon when light mode, Sun icon when dark mode
  │   onClick => onThemeToggle
  ├── Notification bell — 36x36px, 10px radius, bell icon
  │   Red dot badge (8x8px) when hasNotifications
  │   onClick => onNotificationClick
  ├── Settings gear — 36x36px, 10px radius
  │   onClick => onSettingsClick
  └── Avatar — 32x32px, 10px radius, gradient background, initials
      onClick => onAvatarClick
</header>
```

**Backdrop:** `backdrop-filter: blur(12px); background: rgba(255,255,255,0.92);` (light mode)

**Player dark mode (when receiving isDark or via .v2-player-dark context):**
```
background: rgba(6,14,26,0.9);
border-bottom: 1px solid rgba(255,255,255,0.06);
roleLabel color: var(--v2-gold);
nav link active: gold text, rgba(255,215,0,0.08) bg
search: rgba(255,255,255,0.04) bg, border: 1px solid rgba(255,255,255,0.06)
avatar: gold gradient
```

**IMPORTANT:** This component does NOT wire to CommandPalette itself. It receives `onSearchClick` as a prop. The parent dashboard page will pass `() => setCommandPaletteOpen(true)` or equivalent. Same for notifications, settings, avatar.

**Icons:** Use Lucide icons (already in the project). Bell, Settings/Gear, Search, Moon, Sun. Import from lucide-react.

**Responsive (from mockup @media rules):**
- Below 700px: hide nav links, hide kbd shortcut in search, brand padding-left becomes 16px

**Commit:** `feat(v2): Phase 1.2 — TopBar component`

---

## Sub-phase 1.3 — HeroCard (Base)

**File:** `src/components/v2/HeroCard.jsx` (NEW)

This is the BASE hero card. Role-specific variants (AdminHeroCard, CoachHeroCard, etc.) will be built in Phase 2-6 and will compose this base.

**Props interface:**
```jsx
HeroCard.propTypes = {
  orgLine: PropTypes.string,                     // "Black Hornets Athletics" or "U14 Hornets Premier · Spring Soccer 2026"
  greeting: PropTypes.string.isRequired,         // "You've got 15 items to knock out, Carlos. Let's go."
  subLine: PropTypes.string,                     // "Spring Soccer 2026 · Friday, March 20"
  mascotEmoji: PropTypes.string,                 // "🐱" (or could be an image URL later)
  stats: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string,                     // "green", "red", "sky", "gold" or undefined for white
  })),
  // Player hero gets extra treatment — optional slots
  levelBadge: PropTypes.node,                    // For player: <span>LVL 14</span> Gold Tier
  xpBar: PropTypes.node,                         // For player: XP progress bar JSX
  streakBadge: PropTypes.node,                   // For player: streak counter JSX
  variant: PropTypes.oneOf(['light', 'dark', 'player']),  // 'light' default, 'player' = full dark with gold
  className: PropTypes.string,
};

HeroCard.defaultProps = {
  variant: 'light',
  mascotEmoji: '🐱',
};
```

**Structure (admin mockup — 'light' variant, which is actually dark navy card on light page):**
```
<div class="v2-hero" data-variant={variant}>
  Background: linear-gradient(145deg, --v2-navy 0%, --v2-midnight 100%)
  border-radius: 14px, padding: 28px 32px 24px
  Color: white
  Overflow: hidden
  Pseudo ::after for ambient glow (top-right radial gradient)

  ├── hero-top (flex, space-between, align-start)
  │   ├── Left content
  │   │   ├── orgLine — 11.5px, weight 600, 0.08em spacing, uppercase, sky color, mb 8px
  │   │   │   (Player variant: shows levelBadge node here instead)
  │   │   ├── greeting — 26px, weight 800, line-height 1.15, -0.03em tracking, max-width 420-460px
  │   │   └── subLine — 13px, rgba(255,255,255,0.5), mt 6px
  │   └── Mascot — 72x72px, rgba(255,255,255,0.06) bg, 16px radius, 36px emoji, flex-shrink 0
  │       Border: 1px solid rgba(255,255,255,0.06)
  │       (Player variant: rgba(255,215,0,0.06) bg, rgba(255,215,0,0.1) border)
  │
  ├── xpBar slot (Player variant only — renders between top and stats/streak)
  │
  ├── Stats grid (if stats array provided)
  │   Grid: repeat(N, 1fr) where N = stats.length
  │   Gap: 2px, mt 20px
  │   Background: rgba(255,255,255,0.04), radius 10px, overflow hidden
  │   Each stat:
  │     padding: 12px 8px, text-align center
  │     bg: rgba(255,255,255,0.02), hover: rgba(255,255,255,0.06)
  │     value: 20px, weight 800, -0.02em tracking
  │       .green => --v2-green, .red => --v2-coral, .sky => --v2-sky, .gold => --v2-gold
  │     label: 10px, weight 600, 0.06em spacing, uppercase, rgba(255,255,255,0.4)
  │
  └── streakBadge slot (Player variant only)
```

**Player variant overrides:**
- Background: `linear-gradient(145deg, #132240, var(--v2-midnight))`
- Border: `1px solid rgba(255,255,255,0.06)`
- Ambient glow: gold tint instead of sky

**Responsive:** Stats grid collapses to 3 columns below 700px.

**Commit:** `feat(v2): Phase 1.3 — HeroCard base component`

---

## Sub-phase 1.4 — AttentionStrip

**File:** `src/components/v2/AttentionStrip.jsx` (NEW)

**Props:**
```jsx
AttentionStrip.propTypes = {
  message: PropTypes.string.isRequired,          // "3 items need action before Monday kickoff"
  ctaLabel: PropTypes.string,                    // "REVIEW NOW →"
  onClick: PropTypes.func,                       // expand or navigate
  variant: PropTypes.oneOf(['urgent', 'warning', 'info']),  // red, amber, sky
  isExpanded: PropTypes.bool,                    // for collapsible detail
  expandedContent: PropTypes.node,               // detail items when expanded
};
```

**Structure (from mockup):**
```
<div> — flex, align-center, space-between
  padding: 12px 20px
  background: #FEF2F2 (urgent) / #FFFBEB (warning) / #EFF6FF (info)
  border-left: 3px solid --v2-red (urgent) / --v2-amber (warning) / --v2-sky (info)
  border-radius: 14px
  cursor: pointer
  transition: all 0.15s ease
  hover: darken background slightly

  ├── Left — flex, align-center, gap 10px
  │   ├── Pulsing dot — 8x8px, red/amber/sky, 50% radius, pulse animation 2s infinite
  │   └── Message text — 13.5px, weight 600, text-primary color
  │
  └── CTA label — 12px, weight 700, sky color, 0.02em spacing

  (If isExpanded && expandedContent)
  └── Expanded section below, with border-top, padding-top
```

**Pulse keyframe:** `0%,100% { opacity: 1 } 50% { opacity: 0.4 }`

**Commit:** `feat(v2): Phase 1.4 — AttentionStrip component`

---

## Sub-phase 1.5 — BodyTabs (Shell)

**File:** `src/components/v2/BodyTabs.jsx` (NEW)

This is a SHELL. Tab content is wired per-role in Phases 2-6.

**Props:**
```jsx
BodyTabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    badge: PropTypes.number,                     // optional count badge on tab
  })).isRequired,
  activeTabId: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  children: PropTypes.node,                      // rendered inside tab-content area
  footerLink: PropTypes.shape({
    label: PropTypes.string,                     // "View all 9 teams →"
    onClick: PropTypes.func,
  }),
  variant: PropTypes.oneOf(['light', 'dark']),   // 'dark' for player
};
```

**Structure (from mockup):**
```
<div> — white bg, 14px radius, card shadow, 1px border, overflow hidden
  (dark variant: card-bg, no shadow, border subtle)

  ├── tabs-nav — flex, border-bottom 1px, padding 0 24px
  │   Each tab button:
  │     padding 14px 0, margin-right 28px
  │     13px, weight 600, muted color
  │     border-bottom: 2px solid transparent
  │     Active: navy text (gold for player), navy underline (gold for player)
  │     Hover: text-primary
  │
  ├── tab-content — children rendered here (padding 0 by default; specific tabs add their own)
  │
  └── tab-footer (if footerLink provided)
      padding: 14px 24px, border-top 1px, text-align center
      Link: 12px, weight 600, sky color
```

**State:** Tab switching is controlled externally (activeTabId + onTabChange). No internal state. This keeps it flexible for each role dashboard to manage its own tab state.

**Commit:** `feat(v2): Phase 1.5 — BodyTabs shell component`

---

## Sub-phase 1.6 — FinancialSnapshot

**File:** `src/components/v2/FinancialSnapshot.jsx` (NEW)

The dark navy "Relational Hub" style card used for Admin (Financial Snapshot) and Parent (Family Balance).

**Props:**
```jsx
FinancialSnapshot.propTypes = {
  overline: PropTypes.string,                    // "Financial Snapshot" or "Family Balance"
  heading: PropTypes.string,                     // "Spring Soccer 2026"
  headingSub: PropTypes.string,                  // "Revenue Overview" or "Season Fees"
  projectedRevenue: PropTypes.number,            // null if N/A (parent doesn't use this)
  collectedPct: PropTypes.number,                // 75.6
  receivedAmount: PropTypes.string,              // "$12,400" or "$450"
  receivedLabel: PropTypes.string,               // "Received" or "Paid"
  outstandingAmount: PropTypes.string,           // "$3,200" or "$200"
  outstandingLabel: PropTypes.string,            // "Outstanding"
  breakdown: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,          // "Registration"
    amount: PropTypes.string.isRequired,         // "$8,200"
    color: PropTypes.string.isRequired,          // CSS color for dot
  })),                                           // null if no breakdown (parent)
  dueDateText: PropTypes.string,                 // "Uniform balance due Apr 1, 2026" (parent)
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,          // "Send Reminders" or "Pay Balance Now →"
    onClick: PropTypes.func.isRequired,
    variant: PropTypes.oneOf(['danger', 'success']),  // danger = red/coral, success = green
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
};
```

**Structure (from admin mockup finance-card):**
```
<div> — dark navy gradient background
  background: linear-gradient(160deg, #0f2847 0%, --v2-midnight 100%)
  color: white, border-radius 14px, padding 24px
  position relative, overflow hidden
  Pseudo ::before for ambient sky-tinted radial glow top-right

  ├── overline — 10px, weight 700, 0.1em spacing, uppercase, sky color, mb 6px
  ├── heading — 19px, weight 800, -0.02em tracking, mb 16px
  │   headingSub on next line: rgba(255,255,255,0.55), weight 700
  │
  ├── (if projectedRevenue)
  │   ├── Target row — flex, space-between, 12px, rgba(255,255,255,0.45)
  │   ├── Progress bar — 6px height, sky fill, rgba(255,255,255,0.08) track
  │   └── Percentage text — 11px, weight 700, rgba(255,255,255,0.5), mb 18px
  │
  ├── Big numbers row — flex, gap 20px
  │   ├── Received: 24px weight 800, white color (or green for parent "Paid")
  │   │   Label: 10px, weight 600, uppercase, rgba(255,255,255,0.35)
  │   └── Outstanding: 24px weight 800, coral color
  │       Label: same
  │
  ├── (if breakdown array)
  │   Breakdown section — border-top rgba(255,255,255,0.06), pt 14px
  │   Title: 10px, weight 700, uppercase, rgba(255,255,255,0.3)
  │   Each row: flex, space-between, py 5px
  │     Name: 12px, rgba(255,255,255,0.55) + 6px colored dot
  │     Amount: 12px, weight 700, rgba(255,255,255,0.8)
  │
  ├── (if dueDateText)
  │   Due date — 12px, rgba(255,255,255,0.5), mb 14px
  │
  └── Actions — flex, gap 8px
      Primary: flex 1, 10px padding, 10px radius, 12px weight 700
        danger: rgba(239,68,68,0.2) bg, coral text, rgba(239,68,68,0.15) border
        success: green bg, navy text
      Secondary: flex 1, rgba(255,255,255,0.06) bg, rgba(255,255,255,0.6) text
```

**Commit:** `feat(v2): Phase 1.6 — FinancialSnapshot component`

---

## Sub-phase 1.7 — WeeklyLoad

**File:** `src/components/v2/WeeklyLoad.jsx` (NEW)

**Props:**
```jsx
WeeklyLoad.propTypes = {
  title: PropTypes.string,                       // "Weekly Load" or "This Week"
  dateRange: PropTypes.string,                   // "Mar 17 – 23"
  events: PropTypes.arrayOf(PropTypes.shape({
    dayName: PropTypes.string.isRequired,        // "Mon", "Wed", etc.
    dayNum: PropTypes.number.isRequired,         // 17, 19, etc.
    isToday: PropTypes.bool,
    title: PropTypes.string.isRequired,          // "4 Practices" or "Practice"
    meta: PropTypes.string,                      // "Various Fields · 4:00 – 6:00 PM"
  })).isRequired,
  variant: PropTypes.oneOf(['light', 'dark']),
};
```

**Structure (from mockup):** Standard side-card wrapper with day-by-day event list.

```
<div class="side-card">
  ├── Header — flex, space-between
  │   ├── Title: 11px, weight 700, 0.06em spacing, uppercase, muted
  │   └── Date range badge: 11px, weight 700, sky color
  │
  └── Event rows
      Each: flex, gap 12px, py 10px, border-bottom (last: none)
      ├── Day column — 42px wide, text-center
      │   ├── Day name: 10px, weight 700, uppercase, muted
      │   └── Day number: 18px, weight 800, navy (today: sky)
      └── Details — flex 1
          ├── Title: 13px, weight 600, text-primary
          └── Meta: 11.5px, muted
```

**Dark variant (player):** Card uses `--v2-card-bg`, day number color: `--v2-text-primary`, today: `--v2-gold`.

**Commit:** `feat(v2): Phase 1.7 — WeeklyLoad component`

---

## Sub-phase 1.8 — ThePlaybook

**File:** `src/components/v2/ThePlaybook.jsx` (NEW)

**Props:**
```jsx
ThePlaybook.propTypes = {
  title: PropTypes.string,                       // "The Playbook" or "Quick Actions"
  actions: PropTypes.arrayOf(PropTypes.shape({
    emoji: PropTypes.string.isRequired,          // "📅", "📢", etc.
    label: PropTypes.string.isRequired,          // "Create Event", "Send Blast"
    onClick: PropTypes.func.isRequired,
    isPrimary: PropTypes.bool,                   // first action gets navy bg
  })).isRequired,
  columns: PropTypes.oneOf([2, 3]),              // 3 for admin/coach/parent, 2 for player
  variant: PropTypes.oneOf(['light', 'dark']),
};

ThePlaybook.defaultProps = {
  columns: 3,
  variant: 'light',
  title: 'The Playbook',
};
```

**Structure (from mockup):** Side-card wrapper with grid of action buttons.

```
<div class="side-card">
  ├── Header — title only (same style as WeeklyLoad header)
  └── Grid — repeat(columns, 1fr), gap 10px
      Each button:
        flex column, align-center, gap 6px
        padding: 16px 8px, radius 12px
        Background: surface (light) / rgba(255,255,255,0.03) (dark)
        Border: 1px transparent (light) / 1px border-subtle (dark)
        Hover: white bg + shadow + translateY(-1px) (light) / rgba(255,255,255,0.06) (dark)

        isPrimary:
          Light: navy bg, white text
          Dark: rgba(255,215,0,0.1) bg, rgba(255,215,0,0.15) border, gold label

        ├── Emoji — 20px
        └── Label — 11px, weight 600, text-secondary (primary: white or gold)
```

**Commit:** `feat(v2): Phase 1.8 — ThePlaybook component`

---

## Sub-phase 1.9 — MilestoneCard

**File:** `src/components/v2/MilestoneCard.jsx` (NEW)

**Props:**
```jsx
MilestoneCard.propTypes = {
  trophy: PropTypes.string,                      // "🏆" or "🏅"
  title: PropTypes.string.isRequired,            // "Gold Tier Admin · Level 12"
  subtitle: PropTypes.string,                    // "Top 5% of regional efficiency"
  xpCurrent: PropTypes.number.isRequired,
  xpTarget: PropTypes.number.isRequired,
  variant: PropTypes.oneOf(['gold', 'sky', 'standard']),  // gold = admin warm, sky = coach, standard = parent/player
};

MilestoneCard.defaultProps = {
  trophy: '🏆',
  variant: 'gold',
};
```

**Structure (from admin mockup):**

Gold variant (admin):
```
<div> — gradient bg: #FFFBEB -> #FEF3C7, radius 14px, padding 18px 20px
  border: 1px solid rgba(245,158,11,0.15)

  ├── Top — flex, align-center, gap 12px, mb 10px
  │   ├── Trophy emoji — 24px
  │   └── Info
  │       ├── Title: 12.5px, weight 700, text-primary
  │       └── Subtitle: 11px, text-secondary
  │
  ├── XP bar track — 4px height, rgba(245,158,11,0.2), 2px radius
  │   └── Fill: gold color, width = (xpCurrent/xpTarget)*100 %
  │
  └── XP text — 10.5px, muted, text-align right. Format: "4,990 / 5,200 XP"
```

Sky variant (coach): Same structure but:
- Background: white, card shadow, border-subtle
- Bar track: rgba(75,185,236,0.15)
- Bar fill: sky color

Standard variant (parent): Same as gold variant (warm amber treatment per parent mockup).

**Commit:** `feat(v2): Phase 1.9 — MilestoneCard component`

---

## Sub-phase 1.10 — MascotNudge

**File:** `src/components/v2/MascotNudge.jsx` (NEW)

**Props:**
```jsx
MascotNudge.propTypes = {
  emoji: PropTypes.string,                       // "🐱"
  message: PropTypes.node.isRequired,            // Can include <strong> tags
  primaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  secondaryAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  variant: PropTypes.oneOf(['light', 'dark']),
};

MascotNudge.defaultProps = {
  emoji: '🐱',
  variant: 'light',
};
```

**Structure (from mockup):**
```
<div> — white bg (light) / card-bg (dark), radius 14px, padding 20px, card shadow, border, flex, gap 16px

  ├── Mascot avatar — 48x48px, navy gradient bg (light) / gold tint bg (dark), radius 14px
  │   Center: emoji 24px
  │   Green dot (12px) bottom-right, 2px white border, absolute positioned
  │   (Dark: gold-tinted bg with gold border)
  │
  └── Content — flex 1
      ├── Message — 13.5px, weight 500, text-primary, line-height 1.45, mb 12px
      │   <strong> inside: weight 700 (dark: gold color for strong)
      │
      └── Actions — flex, gap 8px
          Primary: navy bg + white text (light) / gold bg + midnight text (dark)
            7px 16px padding, 8px radius, 12px weight 700
          Secondary: transparent bg, text-secondary, 1px border-subtle
```

**Commit:** `feat(v2): Phase 1.10 — MascotNudge component`

---

## Sub-phase 1.11 — OrgHealthCard

**File:** `src/components/v2/OrgHealthCard.jsx` (NEW)

Admin-only sidebar card with colored progress bars.

**Props:**
```jsx
OrgHealthCard.propTypes = {
  title: PropTypes.string,
  metrics: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,          // "Roster Fill", "Payments", etc.
    value: PropTypes.string.isRequired,          // "17/48", "31%", "15", etc.
    percentage: PropTypes.number.isRequired,      // 0-100 for bar width
    color: PropTypes.oneOf(['sky', 'green', 'red', 'purple', 'amber']).isRequired,
    isAlert: PropTypes.bool,                     // makes value red colored
  })).isRequired,
};

OrgHealthCard.defaultProps = {
  title: 'Org Health',
};
```

**Structure (from admin mockup):**
```
<div class="side-card">
  ├── Header — just title, same uppercase muted style
  │
  └── Metric rows
      Each: flex, align-center, gap 12px, py 8px
      ├── Label — 12.5px, weight 500, text-secondary, width 90px, flex-shrink 0
      ├── Bar — flex 1, 5px height, surface bg, 3px radius, overflow hidden
      │   └── Fill: percentage width, colored bg (sky/green/red/purple/amber), 3px radius
      └── Value — 12.5px, weight 700, text-primary, width 46px, text-right
          (isAlert: coral color)
```

**Commit:** `feat(v2): Phase 1.11 — OrgHealthCard component`

---

## Sub-phase 1.12 — SideCard Wrapper + V2DashboardLayout

**File:** `src/components/v2/SideCard.jsx` (NEW)
**File:** `src/components/v2/V2DashboardLayout.jsx` (NEW)

### SideCard

A thin wrapper used by WeeklyLoad, ThePlaybook, OrgHealth, and other sidebar cards. Avoids repeating the same container styles.

```jsx
SideCard.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['light', 'dark']),
  className: PropTypes.string,
};
```

Renders: `<div>` with white bg, 14px radius, card shadow, 1px border-subtle. Dark variant swaps to card-bg and no shadow.

### V2DashboardLayout

The shared page-level layout skeleton that all 5 role dashboards will use in Phase 2-6.

```jsx
V2DashboardLayout.propTypes = {
  mainContent: PropTypes.node.isRequired,        // hero + attention + tabs + mascot
  sideContent: PropTypes.node.isRequired,        // sidebar cards
  variant: PropTypes.oneOf(['light', 'dark']),
};
```

**Structure:**
```
<div class="v2-dashboard" data-variant={variant}>
  padding: 28px 32px 80px
  ├── main-grid — display: grid, grid-template-columns: 1fr 340px, gap 24px
  │   ├── main-col — flex column, gap 24px
  │   │   └── {mainContent}
  │   └── side-col — flex column, gap 20px
  │       └── {sideContent}
```

**Responsive:**
- Below 1100px: single column, side-col becomes 2-column grid, finance card spans 2
- Below 700px: side-col single column, padding 16px

**IMPORTANT:** This layout component does NOT replace the current dashboard page layout yet. It is a STANDALONE component that dashboard pages will adopt in Phase 2-6 by importing and rendering it. Current pages remain untouched.

**Commit:** `feat(v2): Phase 1.12 — SideCard wrapper + V2DashboardLayout`

---

## Sub-phase 1.13 — Index Barrel File + Integration Smoke Test

**File:** `src/components/v2/index.js` (NEW)

Create barrel export:
```js
export { default as TopBar } from './TopBar';
export { default as HeroCard } from './HeroCard';
export { default as AttentionStrip } from './AttentionStrip';
export { default as BodyTabs } from './BodyTabs';
export { default as FinancialSnapshot } from './FinancialSnapshot';
export { default as WeeklyLoad } from './WeeklyLoad';
export { default as ThePlaybook } from './ThePlaybook';
export { default as MilestoneCard } from './MilestoneCard';
export { default as MascotNudge } from './MascotNudge';
export { default as OrgHealthCard } from './OrgHealthCard';
export { default as SideCard } from './SideCard';
export { default as V2DashboardLayout } from './V2DashboardLayout';
```

**Integration smoke test:**
1. Run `npx tsc --noEmit` (if TypeScript) or ensure no import/export errors
2. Create a temporary test: In the browser console or a scratch file, verify each component can be imported without error
3. Load `/dashboard` for all 5 roles. Confirm the reworked SlimSidebar renders correctly. No console errors. No visual regressions on existing dashboard content (which still uses the old grid layout, unchanged).
4. Delete any scratch test files

**Commit:** `feat(v2): Phase 1.13 — barrel exports + smoke test`

---

## PHASE 1 COMPLETE CHECKLIST

Before declaring Phase 1 done, verify:

- [ ] `src/styles/v2-tokens.css` exists and is imported in app entry
- [ ] `LynxSidebar.jsx` is permanently 60px, no hover expand, correct active states per role
- [ ] All 12 new components exist in `src/components/v2/`
- [ ] Every component exports correctly via barrel file
- [ ] Zero new context imports in shared components (only `useTheme` and `useAppNavigate` allowed)
- [ ] Zero changes to any file in `src/pages/`, `src/hooks/`, `src/contexts/`
- [ ] Zero changes to Supabase queries, service layers, or route configs
- [ ] No TypeScript/compilation errors
- [ ] `/dashboard` loads for all 5 roles with slim sidebar, no console errors
- [ ] 13 commits on `feat/v2-dashboard-redesign` branch (1.0 through 1.13)

**Next:** Phase 2 (CC-PHASE2-ADMIN-DASHBOARD.md) will wire the Admin dashboard to use these shared components, replacing the grid layout with the fixed V2DashboardLayout and connecting all existing data hooks.

---

## COMPONENT REFERENCE QUICK TABLE

| Component | File | Used By | Data Source | Props Only? |
|-----------|------|---------|-------------|-------------|
| v2-tokens.css | styles/ | All | N/A | N/A |
| SlimSidebar | layout/LynxSidebar.jsx | All | Same as current | Same props |
| TopBar | v2/TopBar.jsx | All | Props from page | YES |
| HeroCard | v2/HeroCard.jsx | All | Props from page | YES |
| AttentionStrip | v2/AttentionStrip.jsx | All | Props from page | YES |
| BodyTabs | v2/BodyTabs.jsx | All | Props from page | YES |
| FinancialSnapshot | v2/FinancialSnapshot.jsx | Admin, Parent | Props from page | YES |
| WeeklyLoad | v2/WeeklyLoad.jsx | Admin, Coach | Props from page | YES |
| ThePlaybook | v2/ThePlaybook.jsx | All | Props from page | YES |
| MilestoneCard | v2/MilestoneCard.jsx | All | Props from page | YES |
| MascotNudge | v2/MascotNudge.jsx | All | Props from page | YES |
| OrgHealthCard | v2/OrgHealthCard.jsx | Admin | Props from page | YES |
| SideCard | v2/SideCard.jsx | All | Children | YES |
| V2DashboardLayout | v2/V2DashboardLayout.jsx | All | Children | YES |

**Every shared component is props-only. Zero Supabase queries. Zero context reads (except useTheme/useAppNavigate in sidebar). Data wiring happens in Phase 2-6 per role.**
