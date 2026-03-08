# CC-WEB-DESKTOP-REDESIGN.md
## Lynx Web Admin — Desktop Dashboard Redesign

---

### MISSION

Redesign all 5 role-based dashboards in the `volleybrain-admin` web app to match the Lynx brand identity and the desktop mockup reference screens (d1–d5) from the `reference/v0-desktop/` folder. Navigation stays untouched — this is a dashboard-only visual overhaul.

---

## WORKING RULES (READ FIRST — ALWAYS FOLLOW)

1. **Do NOT touch `MainApp.jsx` routing, `HorizontalNavBar`, or any navigation logic.** Navigation is out of scope. Only dashboard page components and their child components change.
2. **Do NOT rename files or move folders.** Keep existing file paths intact.
3. **Do NOT break any Supabase queries, auth flows, role-gating, or existing functionality.** This is a visual reskin, not a feature rewrite. Every data fetch, every button action, every modal — must still work.
4. **Read the reference files before each phase.** The d1–d5 mockup components in `reference/v0-desktop/components/desktop/` contain the exact layout structure, color tokens, card treatments, and spacing to follow.
5. **Read `CC-LYNX-BRAND-RESTYLE.md`** in the repo root for the full brand token spec (colors, fonts, surfaces, semantic colors).
6. **Commit after each phase.** One phase = one commit. Run the build check before committing. Message format: `"Web Redesign Phase X: [description]"`
7. **Do NOT add new npm dependencies** unless absolutely required. Use what's already installed.
8. **Preserve all existing Tailwind utility classes that handle responsive behavior.** Only change visual classes (colors, fonts, spacing, borders, shadows).
9. **Use Tele-Grotesk** for body text (already configured as `font-sans` in `tailwind.config.js`). Use bold display treatments for hero headers matching the Bebas Neue style from mockups, but use whatever display font is already installed — do NOT add new font dependencies.
10. **The header pattern:** Dark navy band (`#0D1B3E`) at the top ~200px with user info, role badge, and a Bebas-style title. Content cards float upward into this header with negative margin, creating depth. This is THE signature visual pattern across all dashboards.

---

## BRAND TOKENS (QUICK REFERENCE)

```
/* Surfaces - Light Mode */
Page Background:    #F6F8FB
Card Background:    #FFFFFF
Inner Panels:       #F0F3F7
Borders:            #E8ECF2
Ice Blue Highlight: #E8F4FD

/* Surfaces - Dark Mode (Player dashboard only) */
Page Background:    #0A1B33
Card Background:    #10284C
Inner Panels:       #162848
Borders:            rgba(255,255,255,0.06)

/* Brand Colors */
Navy (headers):     #0D1B3E
Lynx Navy:          #10284C
Sky Blue (primary): #4BB9EC
Deep Sky (hover):   #2A9BD4
Gold (accent):      #FFD700
Slate (secondary):  #5A6B7F

/* Semantic */
Success:            #22C55E
Warning:            #F59E0B
Danger:             #EF4444

/* Card Style */
Border Radius:      18px (large cards), 14px (small cards), 12px (inner elements)
Shadow:             shadow-sm (0 1px 2px rgba(0,0,0,0.05))
Border:             1px solid #E8ECF2 (light) or rgba(255,255,255,0.06) (dark)
```

---

## REFERENCE FILES LOCATION

After setup, these will be at:
```
volleybrain-admin/
├── reference/
│   └── v0-desktop/
│       └── components/
│           └── desktop/
│               ├── d1-admin-command.tsx    ← Admin Dashboard reference
│               ├── d2-coach-gameday.tsx    ← Coach Dashboard reference
│               ├── d3-tryout-eval.tsx      ← Player Evaluation reference
│               ├── d4-roster-cards.tsx     ← Player/Roster Cards reference
│               ├── d5-team-pulse.tsx       ← Team Pulse/Social reference
│               └── sidebar-nav.tsx         ← Sidebar nav reference (DO NOT BUILD YET)
├── CC-LYNX-BRAND-RESTYLE.md               ← Brand token spec
└── lynx-brandbook-v2.html                 ← Full interactive brand book
```

---

## TARGET FILES (WHAT CC MODIFIES)

| Phase | Dashboard | Target File(s) | Reference |
|-------|-----------|----------------|-----------|
| 1 | Admin Dashboard | `src/pages/dashboard/DashboardPage.jsx` + child components | d1-admin-command.tsx |
| 2 | Coach Dashboard | `src/pages/roles/CoachDashboard.jsx` + child components | d2-coach-gameday.tsx |
| 3 | Parent Dashboard | `src/pages/roles/ParentDashboard.jsx` + child components | d1 (light mode pattern) + existing parent cards |
| 4 | Player Dashboard | `src/pages/roles/PlayerDashboard.jsx` + child components | d4-roster-cards.tsx + d5-team-pulse.tsx |
| 5 | Shared Components | Shared card components, stat widgets, activity feeds | All d1–d5 for consistency |

---

## PHASE INSTRUCTIONS

### PHASE 1: Admin Dashboard

**Read first:** `reference/v0-desktop/components/desktop/d1-admin-command.tsx` and `CC-LYNX-BRAND-RESTYLE.md`

**What to do:**
1. Add a dark navy header band at the top of the dashboard (`bg-[#0D1B3E]`, ~200px) containing:
   - User avatar + name + email (left side)
   - Season badge (right side)
   - Subtitle: "ADMIN COMMAND CENTER" in small uppercase tracking
   - Title: Large bold display text contextual to the page (e.g., "ORGANIZATION OVERVIEW")
2. Make the first row of content cards float upward into the dark header using negative margin (`-mt-20` or similar), overlapping the header to create depth
3. Restyle all existing dashboard cards to use:
   - `rounded-[18px] bg-white border border-[#E8ECF2] shadow-sm` card treatment
   - `#F6F8FB` page background
   - Consistent padding (p-5 or p-6)
   - Section labels: `text-[10px] font-bold tracking-[0.12em] uppercase text-[#0D1B3E]/30`
4. Restyle the stat numbers to use large display font treatment
5. Keep ALL existing data, widgets, charts, and actions functional — only change the visual presentation
6. **Fix the header height issue:** v0 made the header band too tall in the mockup. Keep it compact (~180-200px max including padding). The floating cards should start overlapping roughly 80px into the header area so the dashboard content is immediately visible without scrolling.

**Commit:** `"Web Redesign Phase 1: Admin Dashboard — dark header band, floating cards, brand restyle"`

---

### PHASE 2: Coach Dashboard

**Read first:** `reference/v0-desktop/components/desktop/d2-coach-gameday.tsx`

**What to do:**
1. Same dark header band pattern as Admin, but with coach context (role badge says "Coach", title contextual)
2. Apply the same floating card treatment
3. Restyle existing coach widgets (schedule, team overview, quick actions) to match the card style from d2
4. If a Game Day section exists, reference the score display and roster management layout from d2
5. All existing Supabase queries and coach-specific data stay intact

**Commit:** `"Web Redesign Phase 2: Coach Dashboard — dark header, floating cards, coach widgets restyle"`

---

### PHASE 3: Parent Dashboard

**Read first:** d1 for the general card pattern (but use light-mode surfaces)

**What to do:**
1. Same dark header band pattern, parent context
2. Restyle the ParentHeroCard and all child-related cards
3. Apply the floating card overlap treatment
4. Use light-mode card styling (`bg-white`, `border-[#E8ECF2]`)
5. Ensure payment cards, schedule previews, and child info cards all match the new style

**Commit:** `"Web Redesign Phase 3: Parent Dashboard — dark header, floating cards, parent widgets restyle"`

---

### PHASE 4: Player Dashboard

**Read first:** `reference/v0-desktop/components/desktop/d4-roster-cards.tsx` and `d5-team-pulse.tsx`

**What to do:**
1. This dashboard uses DARK PLAYER_THEME — `bg-[#0A1B33]` page background, `bg-[#10284C]` cards
2. Same dark header band, but it blends into the dark page (use slightly lighter navy or a gradient border to differentiate)
3. Player trading cards with power bars (reference d4)
4. XP leaderboard and team wall (reference d5)
5. Gold accent for achievements and streaks

**Commit:** `"Web Redesign Phase 4: Player Dashboard — dark theme, power bars, leaderboard, team pulse"`

---

### PHASE 5: Shared Component Polish

**What to do:**
1. Audit all card components used across dashboards for consistency
2. Ensure the card border radius, shadows, and spacing are uniform
3. Standardize section label typography across all dashboards
4. Check that the dark header + floating card pattern is consistent
5. Final visual QA pass

**Commit:** `"Web Redesign Phase 5: Shared component polish, visual consistency pass"`

---

## WHAT NOT TO CHANGE

- `MainApp.jsx` — no routing changes
- `HorizontalNavBar` — no nav changes
- Any Supabase queries or hooks
- Auth flows or role-gating logic
- Modal components (unless they're dashboard-specific cards)
- The `public/` pages (registration, public team wall, etc.)
- Any API calls or data fetching logic

---

## KNOWN ISSUES TO WATCH FOR

1. **Header height:** The v0 mockups made the header band too tall, pushing content below the fold. Keep it compact. The floating cards should be the first thing visible.
2. **Font fallbacks:** If Tele-Grotesk isn't loading, check `tailwind.config.js` font-family mapping. Don't add new fonts.
3. **Dark mode bleed:** The dark header band should NOT affect the rest of the page. Use a clear boundary where dark stops and `#F6F8FB` light background begins (except Player dashboard which is all dark).
4. **Existing component re-use:** Many dashboard widgets are shared components imported from `src/components/`. Restyle them without breaking their use in other pages. If a component is used in non-dashboard contexts, consider creating a wrapper or variant prop rather than changing the base component.
