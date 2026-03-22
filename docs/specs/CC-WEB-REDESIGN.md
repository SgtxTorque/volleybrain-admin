# CC-WEB-REDESIGN.md — Admin Dashboard & Team Hub Layout Transplant
## For Claude Code Execution

**Project:** volleybrain-admin (React/Vite web app)
**Backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**GitHub:** SgtxTorque/volleybrain-admin

---

## RULES (READ FIRST — APPLY TO ALL PHASES)

1. **Read CLAUDE.md and DATABASE_SCHEMA.md** in the project root before doing anything.

2. **Read the v0 reference codebase FIRST.** Unzip `reference/v0-desktop.zip` into `reference/v0-desktop/` if not already extracted. These files define the EXACT layout structure you must match:
   - `reference/v0-desktop/components/dashboard/` — Admin dashboard components
   - `reference/v0-desktop/components/team-hub/` — Team hub components
   - `reference/v0-desktop/app/globals.css` — Color system (CSS custom properties)
   - `reference/v0-desktop/app/page.tsx` — Admin dashboard page structure
   - `reference/v0-desktop/app/team-hub/page.tsx` — Team hub page structure

3. **Read the existing code before changing it.** Before modifying any file, read the ENTIRE file first. Understand what's already built and working. Do NOT break existing functionality.

4. **ZERO FEATURE REMOVAL.** Every widget, modal, popup, dropdown, button, chart, form that currently works MUST still work after changes. If a feature exists in the current web app but NOT in the v0 reference, find a logical place for it within the new layout — do NOT delete it.

5. **Do NOT touch these files unless the task explicitly says to:**
   - `src/contexts/*` (AuthContext, ThemeContext, SeasonContext, etc.)
   - `src/lib/*` (supabase.js, routes.js, etc.)
   - `src/pages/roles/ParentDashboard.jsx`
   - `src/pages/roles/PlayerDashboard.jsx`
   - `src/pages/roles/CoachDashboard.jsx` (separate task later)
   - Any page under `src/pages/` that is NOT DashboardPage.jsx or TeamWallPage.jsx

6. **Use REAL DATA from existing Supabase queries.** The v0 reference has hardcoded mock data. You must wire in the real data from the existing `loadDashboardData()`, `loadTeamData()`, `loadPosts()`, and other fetch functions already in the current code. Do NOT use hardcoded values.

7. **The v0 reference is Next.js + TypeScript + shadcn/ui. This project is React/Vite + plain JSX + Tailwind.** Translate accordingly:
   - `"use client"` → remove (not needed in Vite)
   - `import Image from "next/image"` → use `<img>` tags
   - `import Link from "next/link"` → use existing `onNavigate` prop or `useAppNavigate()`
   - `import { Avatar, AvatarFallback } from "@/components/ui/avatar"` → build inline or use simple div with initials
   - `lucide-react` imports → already available in this project, same import pattern
   - TypeScript interfaces → remove, use plain JS
   - `className` strings with shadcn CSS variables (e.g., `bg-card`, `text-card-foreground`) → translate to Tailwind classes using the color mapping below

8. **COLOR MAPPING — v0 CSS variables to Tailwind classes:**
   The v0 reference uses CSS custom properties. Map them as follows for the LIGHT theme (which is the default and primary target):
   ```
   --background (#f5f6f8)    → bg-slate-50 or bg-[#f5f6f8]
   --card (#ffffff)           → bg-white
   --card-foreground (#1a2332) → text-slate-900
   --primary (#2c3e50)        → bg-slate-700 or bg-[#2c3e50]
   --primary-foreground       → text-slate-50
   --muted-foreground (#6b7a8d) → text-slate-500
   --accent (#0d9488)         → teal-600 or the existing theme accent system
   --border (#e2e6ec)         → border-slate-200
   --destructive (#ef4444)    → text-red-500
   --warning (#f59e0b)        → text-amber-500
   --success (#0d9488)        → text-teal-600
   --nav (#2c3e50)            → bg-slate-700 or bg-[#2c3e50]
   ```
   BUT: This project has an existing theme system with `useTheme()` and `useThemeClasses()`. USE the existing theme system. Apply these colors through the existing `isDark` conditional patterns already in the codebase. The v0 colors are your light-mode targets. For dark mode, use the existing dark-mode palette from ThemeContext.

9. **Do NOT move, remove, hide, or restructure any existing widgets, sections, or features unless the task EXPLICITLY says to.**

10. **Git Discipline:** Commit AND push after EACH phase completes. Format: `"CC-WEB Phase X: [description]"`. Do NOT make one giant commit at the end.

11. **Test Before Committing:** After every phase, run `npm run dev`, open the dashboard in the browser, and verify:
    - No console errors
    - Layout matches the v0 reference structure
    - All existing widgets still render with real data
    - Navigation still works (click through nav items)
    - Role switching still works (admin/coach/parent/player)

12. **If something in the v0 reference conflicts with existing functionality, KEEP the existing functionality and adapt the v0 layout around it.**

13. **Changes must actually appear on screen.** Do NOT just create CSS classes that nothing uses. Do NOT just create components that nothing renders. Wire everything in and VERIFY visually.

---

## PHASE 1: Admin Dashboard — Layout Transplant

**Goal:** Transform `src/pages/dashboard/DashboardPage.jsx` from its current single-column layout to match the v0 reference's 3-column command center layout.

**Reference files to read first:**
- `reference/v0-desktop/app/page.tsx` (page structure)
- `reference/v0-desktop/components/dashboard/org-sidebar.tsx` (left panel)
- `reference/v0-desktop/components/dashboard/dashboard-content.tsx` (center)
- `reference/v0-desktop/components/dashboard/team-snapshot.tsx`
- `reference/v0-desktop/components/dashboard/registration-stats.tsx`
- `reference/v0-desktop/components/dashboard/payment-summary.tsx`
- `reference/v0-desktop/components/dashboard/upcoming-events.tsx`
- `reference/v0-desktop/components/dashboard/live-activity.tsx` (right panel)

### Task 1A: Create the 3-Column Layout Wrapper

Create the outer layout structure matching the v0 reference's `page.tsx`:

```
┌──────────────────────────────────────────────────────┐
│ Existing Nav Bar (DO NOT CHANGE)                      │
├────────────┬─────────────────────────┬───────────────┤
│ Left Panel │    Center Content       │  Right Panel  │
│  (280px)   │    (flex-1, scroll)     │   (300px)     │
│  (scroll)  │                         │   (scroll)    │
│            │  "Dashboard" heading    │               │
│ Org Card   │  Team Snapshot (4-col)  │ Live Activity │
│ Stats      │  Reg Stats + Payments   │ Feed          │
│ Collections│  Upcoming Events        │               │
│ Needs Attn │  [existing widgets      │               │
│ Quick Acts │   below v0 sections]    │               │
│            │                         │               │
└────────────┴─────────────────────────┴───────────────┘
```

The wrapper is: `flex h-[calc(100vh-64px)] overflow-hidden` for the 3-column area.
- Left: `w-[280px] shrink-0 overflow-y-auto border-r border-slate-200 py-8 pl-6 pr-4`
- Center: `flex-1 overflow-y-auto py-8 px-8`
- Right: `w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 py-8 px-6`

### Task 1B: Build the Left Sidebar (OrgSidebar)

Create a new component matching `reference/v0-desktop/components/dashboard/org-sidebar.tsx`. Place it at `src/components/dashboard/OrgSidebar.jsx`.

**Structure (one continuous scrollable sidebar, NOT separate floating cards):**

1. **Org Identity Card** — rounded-2xl white card with shadow-sm containing:
   - Org logo (or initials "BH" in a rounded-2xl colored square)
   - Organization name (bold)
   - Season name + "Active" status
   - 3-column stat grid: PLAYERS count | TEAMS count | COACHES count

2. **Collections Progress** — rounded-2xl white card:
   - "Collections" label + percentage on right
   - Progress bar (accent color fill)
   - "$X / $Y" amount text

3. **Needs Attention** — section with items, each is a clickable row:
   - ⚠️ section header with warning icon
   - Pending registrations → badge count, navigates to registrations page
   - Overdue payments → badge with dollar amount, navigates to payments page
   - Unsigned waivers → badge count, navigates to waivers settings

4. **Quick Actions** — 2×2 grid of compact square buttons:
   - Regs (with notification badge if pending), Payments, Invite, Blast
   - Each button: icon + label, rounded-2xl white card, shadow-sm, hover lift

**Data source:** All data already exists in `loadDashboardData()` in the current DashboardPage.jsx. Pass it as props from the parent. The current code fetches: `stats.totalPlayers`, `stats.totalTeams`, `stats.totalCoaches`, `stats.totalCollected`, `stats.totalFees`, `stats.pendingRegistrations`, `stats.overdueAmount`, plus waiver data.

### Task 1C: Build the Center Content Area

Restructure the main content area to match `reference/v0-desktop/components/dashboard/dashboard-content.tsx`:

**Top section (matches v0 exactly):**

1. **Header** — `<h1>Dashboard</h1>` + greeting line ("Good evening, Carlos. Here's your overview.")

2. **Team Snapshot** — section header "TEAM SNAPSHOT" (uppercase muted) + "Manage" link → navigates to teams page.
   - 4-column grid of team cards
   - Each card: white bg, rounded-2xl, shadow-sm, colored top border (unique per team), team name, player count, W-L record
   - Data: from existing teams query in `loadDashboardData()`

3. **Registration Stats + Payment Summary** — 2-column grid:
   - **Left: Registration Stats** — donut chart showing Rostered/Pending/Waitlisted/Denied counts with legend. Reuse the existing `RegistrationDonut` / `RegistrationStats` component logic but restyle to match v0's card (see `registration-stats.tsx`).
   - **Right: Payment Summary** — total collected / total amount, progress bar, "31% collected" + overdue amount, recent payments list. Reuse existing `FinancialSummary` logic, restyle to match v0's card (see `payment-summary.tsx`).

4. **Upcoming Events** — section header "UPCOMING EVENTS" + "Full Calendar" link → navigates to schedule page.
   - List of events in a single white card. Each row: team color icon, team name (+ opponent if game), location, date + time.
   - Reuse existing `UpcomingEvents` component data, restyle to match v0.

**Below the v0 sections, preserve ALL existing widgets that don't have v0 equivalents:**

5. **FinancialOverview** (MiniLineChart showing monthly revenue) — keep as-is
6. **SeasonCard** (detailed season breakdown) — keep as-is
7. **OverduePayments** (payment recovery widget) — keep as-is
8. **GettingStartedGuide** — keep as-is (shows only for new orgs)

These go in the center column below the v0 sections, maintaining their existing styling.

### Task 1D: Build the Right Sidebar (LiveActivity)

Create a new component at `src/components/dashboard/LiveActivity.jsx` matching `reference/v0-desktop/components/dashboard/live-activity.tsx`.

**Structure:**
- "LIVE ACTIVITY" section header (uppercase muted)
- Scrollable vertical feed of recent activity items
- Each item: colored icon avatar + event text (bold) + detail + person name + relative timestamp

**Activity types and their icon colors:**
- Payment received → amber/warning icon (DollarSign)
- Registration assigned/approved → accent/teal icon (ClipboardCheck)
- Waiver signed → success/green icon (FileCheck)
- Game completed → purple icon (Trophy)

**Data source:** Build a combined query pulling recent events from:
- `payments` table → recent payments (amount, player name, timestamp)
- `registrations` table → recent status changes (player name, new status, timestamp)
- `waiver_signatures` table → recent signings (player name, timestamp)
- `games` table → recently completed games (teams, score, timestamp)

Combine all into one array, sort by timestamp descending, limit to ~15-20 items. Display relative time ("25d ago", "2h ago").

If building the combined query is complex, start simple: just show recent payments and registrations (the data is already being fetched in `loadDashboardData()`). You can expand later.

### Task 1E: Clean Up Redundant Dashboard Elements

Now that the left sidebar has org stats, collections, needs attention, and quick actions:

- **REMOVE the GlanceWidget / InfoHeaderBar from the admin dashboard view.** This is the horizontal bar that shows "Season | Rostered X/Y | Active Teams | Collected $X". That information is now in the left sidebar. ONLY remove it for `activeView === 'admin'` — do NOT remove it for coach/parent/player views if they use it.

- **REMOVE any "hero banner"** that was added in previous redesign attempts — the big colored section at top with "Black Hornets Athletics" and stat pills. That info is now in the left sidebar's Org Card.

- If there are any duplicate widgets (e.g., if Quick Actions appears both in the left sidebar AND the center content), keep only the left sidebar version and remove the center duplicate.

### Task 1F: Restyle Cards to Match v0

Apply consistent card styling across all dashboard widgets:
- Background: `bg-white` (light) / existing dark card color
- Shadow: `shadow-sm`
- Corners: `rounded-2xl`
- Section headers: `text-xs font-semibold uppercase tracking-wider text-slate-400`
- Hover on interactive cards: `hover:shadow-md hover:-translate-y-0.5 transition-all`

**Commit after Phase 1:** `git add -A && git commit -m "CC-WEB Phase 1: Admin dashboard 3-column layout transplant" && git push`

---

## PHASE 2: Team Hub — Layout Transplant

**Goal:** Transform `src/pages/public/TeamWallPage.jsx` from its current layout to match the v0 reference's 3-panel layout with single hero banner.

**Reference files to read first:**
- `reference/v0-desktop/app/team-hub/page.tsx` (page structure)
- `reference/v0-desktop/components/team-hub/team-hero.tsx` (hero banner)
- `reference/v0-desktop/components/team-hub/roster-sidebar.tsx` (left panel)
- `reference/v0-desktop/components/team-hub/team-feed.tsx` (center content)
- `reference/v0-desktop/components/team-hub/feed-tabs.tsx` (tab navigation)
- `reference/v0-desktop/components/team-hub/feed-composer.tsx` (post composer)
- `reference/v0-desktop/components/team-hub/feed-card.tsx` (post cards)
- `reference/v0-desktop/components/team-hub/team-widgets.tsx` (right panel)

### Task 2A: Replace the Banner Carousel with a Single Hero

**DELETE the entire 3-slide banner carousel system:**
- Remove `bannerSlides` array and all banner state (`bannerSlide`, `setBannerSlide`, `showBannerEdit`)
- Remove `PhotoBanner`, `NextGameBanner`, `SeasonPulseBanner` sub-components
- Remove the carousel auto-rotation `setInterval`
- Remove carousel dot navigation
- Remove banner edit controls panel

**REPLACE with a single hero banner** matching `reference/v0-desktop/components/team-hub/team-hero.tsx`:
- Full-width rounded-2xl card with overflow-hidden
- Background: team photo (`team.banner_url` or `team.cover_image_url`) with `object-cover`, OR a gradient fallback using the team's color if no photo
- Gradient overlay: `bg-gradient-to-t from-[#2c3e50]/90 via-[#2c3e50]/40 to-transparent`
- Camera icon button (top right) — triggers cover photo upload (keep existing upload logic)
- Bottom left: team logo/initials badge + team name in BOLD CAPS + player count + coach count + season + Active dot
- Bottom right: "Join Huddle" button with green pulse dot — calls existing `openTeamChat()` function

### Task 2B: Create the 3-Panel Layout Below Hero

Below the hero, create:

```
┌──────────┬───────────────────────────┬───────────────┐
│  Roster  │      Center Feed         │   Widgets     │
│  (220px) │      (flex-1, scroll)    │   (280px)     │
│  (scroll)│                          │   (scroll)    │
│          │  Tab Bar                 │               │
│ Player 1 │  Post Composer           │ Upcoming      │
│ Player 2 │  Feed Post 1             │ Events        │
│ Player 3 │  Feed Post 2             │               │
│ ...      │  ...                     │ Season Record │
│          │                          │               │
│          │                          │ Gallery       │
└──────────┴───────────────────────────┴───────────────┘
```

Use flex layout matching v0:
- Left: `w-[220px] shrink-0 overflow-y-auto border-r border-slate-200 py-8 pl-6 pr-4`
- Center: `flex-1 overflow-y-auto px-8 py-8`
- Right: `w-[280px] shrink-0 overflow-y-auto border-l border-slate-200 py-8 px-6`

### Task 2C: Build the Roster Sidebar (Left Panel)

Matching `reference/v0-desktop/components/team-hub/roster-sidebar.tsx`:

- "ROSTER" section header + "X online" indicator with green dot
- Player list, each row is a clickable button:
   - Jersey number in a bordered circle (hover turns accent color)
   - Online status dot (bottom right of number circle)
   - Player name (bold) + position abbreviation (muted)

**Data source:** Use existing `roster` state from `loadTeamData()`.

**REMOVE the "roster" tab from the center tabs** — roster is now permanently visible in the left sidebar.

### Task 2D: Restructure the Center Feed

**Tab Navigation** — pill-style bar matching `feed-tabs.tsx`:
- Tabs: Feed | Schedule | Achievements | Stats
- Each tab: icon + label, flex-1 width, rounded-xl
- Active: accent background + white text. Inactive: muted text.
- **Remove "Roster"** from tabs (now in sidebar)
- **Move "Documents"** out of tabs — add a "Docs" link/button in the right widgets sidebar or as a secondary action

**Post Composer** — matching `feed-composer.tsx`:
- User avatar + text input row
- Quick action buttons row below: Photo/Video | Poll | Shoutout | Challenge
- **Keep ALL existing post creation logic** — `createPost()`, image upload, etc.

**Feed Post Cards** — restyle to match `feed-card.tsx`:
- Author row: avatar + name (bold) + timestamp + type badge (Photo/Announcement/Shoutout)
- Content text
- Full-bleed image if present
- Engagement row: like count + comment count
- Action bar: Like | Comment | Share (three equal columns)
- Top comment inline preview
- **PRESERVE all existing functionality:**
  - Emoji reaction picker (6 emoji options) — keep working
  - Comment threading — keep working
  - Photo gallery lightbox — keep working
  - Post pinning — keep working
  - Three-dot menu (edit/delete/pin) — keep working
  - Cover photo upload — keep working (moved to hero camera button)

### Task 2E: Build the Widgets Sidebar (Right Panel)

Matching `reference/v0-desktop/components/team-hub/team-widgets.tsx`:

1. **Upcoming Events** — "UPCOMING" header + "Full Calendar" link
   - Event cards: event title (or "Game vs [opponent]" with accent color), date + time
   - Data: from `schedule_events` filtered by this team, already fetched in existing code

2. **Season Record** — "SEASON RECORD" header
   - Large W-L display (wins in accent, losses in red), centered
   - Win percentage text below
   - Data: from `games` filtered by this team

3. **Gallery** — "GALLERY" header
   - 3×2 grid of photo thumbnails (rounded-xl, aspect-square)
   - Data: from team photos in Supabase Storage or from `team_posts` with images

### Task 2F: Verify All Existing Features Still Work

Run through this checklist:
- [ ] Can create a new post (text only)
- [ ] Can create a post with an image
- [ ] Can react to a post (emoji picker appears, reaction registers)
- [ ] Can comment on a post
- [ ] Can reply to a comment (threading works)
- [ ] Can pin/unpin a post (admin/coach only)
- [ ] Can edit/delete a post via three-dot menu
- [ ] Can upload/change cover photo via camera icon on hero
- [ ] "Join Huddle" button opens team chat
- [ ] Tab switching works (Feed → Schedule → Achievements → Stats)
- [ ] Roster sidebar shows all team players
- [ ] Right sidebar shows real upcoming events and season record
- [ ] Back button / navigation still works
- [ ] Page loads without console errors

**Commit after Phase 2:** `git add -A && git commit -m "CC-WEB Phase 2: Team Hub 3-panel layout transplant" && git push`

---

## PHASE 3: Nav Bar Visual Polish

**Goal:** Restyle the existing nav bar to match the v0 reference's clean dark nav. VISUAL CHANGES ONLY.

**Reference:** `reference/v0-desktop/components/dashboard/top-nav.tsx`

### Task 3A: Restyle the Nav Bar

Apply these VISUAL changes to the `HorizontalNavBar` component in `MainApp.jsx`:

- Background: dark color matching `--nav: #2c3e50`. Use `bg-[#2c3e50]` or `bg-gradient-to-r from-[#1B3A4B] to-[#2C5F7C]`
- Height: h-16 (64px)
- Logo area: "VOLLEYBRAIN" in bold white tracking-widest, with a small globe/volleyball icon
- Nav items (center): pill-style buttons
  - Active: `bg-white/15 text-white`
  - Inactive: `text-white/70 hover:bg-white/10 hover:text-white`
- Right side: Season label (white/70), role switcher pill (accent bg), notification bell (white), user avatar (accent bg with initials)
- Shadow: `shadow-md` on the header bar

**DO NOT change ANY of these:**
- Dropdown menu structure, content, or items
- Role switching logic (`activeView`, role detection)
- Season/sport selector functionality
- Notification polling and badge counts
- Profile dropdown actions (settings, logout)
- Coach team selector
- Parent child selector
- Any event handlers or state management
- Mobile menu behavior
- CommandPalette integration

Only change: background colors, text colors, border styles, border-radius, shadows, padding, font sizing — purely CSS/Tailwind classes.

**Commit after Phase 3:** `git add -A && git commit -m "CC-WEB Phase 3: Nav bar dark reskin" && git push`

---

## VERIFICATION CHECKLIST — RUN AFTER ALL PHASES

Before calling this complete, verify EVERY item:

**Admin Dashboard:**
- [ ] 3-column layout visible (left sidebar | center | right activity)
- [ ] Left sidebar: org card with logo/name/season/stats
- [ ] Left sidebar: collections progress bar with real amounts
- [ ] Left sidebar: needs attention items with real counts, clickable
- [ ] Left sidebar: 2×2 quick actions grid
- [ ] Center: "Dashboard" heading with greeting
- [ ] Center: team snapshot 4-column grid with real teams
- [ ] Center: registration stats + payment summary side by side
- [ ] Center: upcoming events with real events
- [ ] Center: existing FinancialOverview chart still renders
- [ ] Center: existing SeasonCard still renders
- [ ] Center: existing OverduePayments widget still renders
- [ ] Right sidebar: live activity feed with real data entries
- [ ] GlanceWidget/InfoHeaderBar removed from admin view only
- [ ] DashboardWidgets drag-and-drop still accessible

**Team Hub:**
- [ ] Single hero banner (no carousel, no dots, no auto-rotate)
- [ ] Hero shows team photo or gradient fallback
- [ ] Hero shows team name, player/coach counts, season
- [ ] Camera icon on hero works for cover photo upload
- [ ] "Join Huddle" button opens team chat
- [ ] 3-panel layout below hero
- [ ] Left panel: persistent roster with all players
- [ ] Center: tab bar (Feed/Schedule/Achievements/Stats)
- [ ] Center: post composer with quick actions
- [ ] Center: feed posts with reactions, comments, menus all working
- [ ] Right panel: upcoming events for this team
- [ ] Right panel: season record (W-L)
- [ ] Right panel: photo gallery thumbnails
- [ ] Can create, edit, delete, pin posts
- [ ] Emoji reaction picker works
- [ ] Comment threading works

**Navigation:**
- [ ] Nav bar has dark background with white text
- [ ] All dropdown menus still open and navigate correctly
- [ ] Role switching works (admin → coach → parent → player)
- [ ] Coach/parent/player dashboards are UNCHANGED
- [ ] All 25+ pages still accessible via nav
- [ ] No console errors on any page

---

## HOW TO START

Paste this into Claude Code:

```
Read CC-WEB-REDESIGN.md in the project root for the full spec and rules. Also read CLAUDE.md and DATABASE_SCHEMA.md.

First, unzip reference/v0-desktop.zip into reference/v0-desktop/ if it hasn't been extracted yet.

Then start Phase 1: Admin Dashboard Layout Transplant. Read all the v0 reference files listed in Phase 1 before writing any code.
```
