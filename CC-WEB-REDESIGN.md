# VolleyBrain Web Admin Portal — Redesign + Feature Parity Spec
## For Claude Code Execution
## Created: February 25, 2026

**Project:** volleybrain-admin (React/Vite web portal)
**Sister repo:** volleybrain-mobile3 (React Native/Expo) — reference copy at `reference/mobile-app/`
**Shared backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**GitHub:** SgtxTorque/volleybrain-admin

---

## ⛔ RULES (READ FIRST — APPLY TO ALL PHASES)

These rules are NON-NEGOTIABLE. Every session, every phase.

1. **Read CLAUDE.md FIRST** — it has the full project structure, completed phases, known issues, and mandatory rules. Read it before touching any code.

2. **Read DATABASE_SCHEMA.md** — verify every table name and column name before writing or modifying ANY Supabase query. If a table or column isn't documented, check the mobile reference at `reference/mobile-app/SCHEMA_REFERENCE.csv`. If it doesn't exist anywhere, flag it and ask — do NOT guess.

3. **Read MOBILE_PARITY.md** — understand what the mobile app has so you know what you're bringing to the web. But remember: the web is NOT a copy of mobile. The web is a COMMAND CENTER. Mobile is on-the-go.

4. **Read the existing code before changing it.** Before modifying ANY file, read the ENTIRE file first. Understand what's built and working. Do NOT break existing functionality.

5. **The mobile app reference is at `reference/mobile-app/`.** When you need to understand how a feature works on mobile (query patterns, data structures, component logic), read the corresponding mobile files. The mobile app is the reference for FEATURES. The web app defines its own LAYOUT and UX.

6. **Do NOT delete or replace existing page components** — modify them, extend them. If you need to restructure, create NEW files and update imports.

7. **Do NOT change Supabase queries or data logic** unless the task specifically requires it. If a query works, leave it alone.

8. **Do NOT modify the theme/styling system** (ThemeContext, accent colors, dark/light mode) unless the task specifically requires it.

9. **Do NOT alter the auth flow** (AuthContext, login, role detection) unless asked.

10. **Do NOT drop or alter existing database tables/columns** — only ADD new ones.

11. **Git discipline**: Commit AND push after every completed phase. Commit messages: `"CC-WEB Phase X: [what changed]"`. Run `git add -A && git commit -m "..." && git push` after each phase.

12. **Test before finishing**: After every change, verify the app starts with `npm run dev` without errors. Check the browser console. If you modified navigation, verify ALL pages are still reachable.

13. **If unsure, STOP and explain options** before proceeding. If a task seems like it will break existing functionality, flag it first.

14. **The web admin portal uses react-router-dom for navigation** (implemented in Phase 1). Routes are defined in MainApp.jsx. Navigation uses `useNavigate()` and `useAppNavigate()` hook. Do not revert to useState-based navigation.

---

## 🎯 PROJECT VISION

### What the Web Is
The web admin portal is a **command center** — an extended universe HQ where admins, coaches, parents, and players get the FULL picture. Think: ESPN studio desk meets Notion workspace meets Apple Fitness dashboard. It should feel expansive, powerful, and information-rich. Large screens mean MORE visible at once — not just bigger versions of phone cards.

### What the Web Is NOT
The web is NOT a pixel-perfect copy of the mobile app. The mobile app is designed for on-the-go quick actions (thumb-friendly, glanceable, push-driven). The web leverages what desktop does better: split panels, data tables, drag-and-drop, calendar views, side-by-side comparisons, and deep analysis.

### Design Direction (from approved mockups)

The design direction combines the best elements from three HTML mockups that were reviewed and approved:

**From Mockup 1 — Glassmorphism Foundation:**
- Floating glass navigation bar (rounded pill, backdrop-blur, translucent)
- Glass card aesthetic throughout (subtle transparency + blur in both light/dark)
- Soft multi-layer shadows in light mode (not flat, not harsh)
- The GlanceWidget concept (replacing InfoHeaderBar with a contextual stats strip)

**From Mockup 2 — Dashboard Layout + Typography:**
- Hero typography on dashboard headings (text-4xl, font-black, tracking-tighter)
- Squircle cards (large border-radius: 1.5rem+)
- 3-column dashboard layout with sidebar context panel
- Season overview sidebar component
- TaskItem / QuickAction component patterns
- Activity feed with timeline styling

**From Mockup 3 — Theme Token System:**
- Glassmorphism utility classes in Tailwind config (soft-xl shadows, glow-* shadows)
- Per-accent-color glow shadows
- Proper glass tokens for light AND dark mode (both get the glass treatment)
- Surface/divider/inputBg semantic tokens in theme.js

**General Design Rules:**
- Light mode default, dark mode fully supported
- Primary accent: Orange (#F97316) with 6 customizable accent colors (already built)
- Rounded-2xl (16px) or larger corners on cards
- 44px minimum touch/click targets
- Generous padding and whitespace
- Smooth hover transitions (300ms)
- Calm technology: Amber for attention items, not alarming red
- No pure black backgrounds in dark mode — use slate-900 (#0f172a)
- No pure white backgrounds in light mode — use off-white (#F8FAFC or #F1F5F9)

---

## 📋 PHASE OVERVIEW

| Phase | Focus | Sessions |
|-------|-------|----------|
| Phase 1 | Visual Foundation — Nav + Dashboard + Theme Tokens | 2-3 |
| Phase 2 | Role Dashboards — Admin, Coach, Parent, Player command centers | 2-3 |
| Phase 3 | Feature Parity — Engagement system, Team Hub upgrades | 2-3 |
| Phase 4 | Desktop Power Features — Split panels, bulk ops, calendar | 1-2 |
| Phase 5 | Polish — Responsive audit, empty states, transitions, consistency | 1-2 |

---

## PHASE 1: Visual Foundation

**Goal:** Apply the approved design direction to the shell (navigation, layout wrapper, dashboard) WITHOUT breaking any functionality. This is a visual upgrade to existing structure, not a rebuild.

### Task 1A: Navigation Upgrade

**Current state:** `MainApp.jsx` has a `HorizontalNavBar` component (~line 1430) that renders dropdown menus. It was upgraded to a floating glass pill in a previous session but had issues (text bleeding through in dark mode, layout too narrow, shadows too weak in light mode).

**What to do:**
1. Read the current `HorizontalNavBar` code in MainApp.jsx
2. Fix the known issues:
   - **Layout width**: The nav and content area should use `max-w-[1400px]` or wider — NOT the overly narrow `max-w-6xl` (1152px). The content should breathe on large screens.
   - **Dark mode glass**: Increase the background opacity of the glass pill in dark mode from `0.75` to `0.85` so text doesn't bleed through. Add a stronger `border` in dark mode (`border-white/[0.12]`).
   - **Light mode shadows**: Use a multi-layer shadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.04)` instead of a single soft shadow.
   - **Light mode glass**: The nav in light mode should be `rgba(255, 255, 255, 0.85)` with `backdrop-blur-xl` and a subtle `border-slate-200/60`.
3. The floating glass pill nav concept is correct — keep it. Just fix these rendering issues.
4. Ensure dropdown menus also get the glass treatment with proper opacity so they're always readable.
5. **Keep ALL existing nav items, routes, role-based menus, dropdowns, notification bell, role switcher, theme toggle, accent picker** — do not remove anything.

### Task 1B: Content Layout Wrapper

**Current state:** The main content area renders below the fixed nav with basic padding.

**What to do:**
1. Ensure the content area has proper top padding to clear the floating nav (nav height + 24px gap)
2. Set content max-width to `max-w-[1440px]` centered with `mx-auto`
3. Add subtle page transition: when navigating between pages, content fades in with `opacity 0→1, translateY 8px→0` over 200ms
4. The background should be `bg-slate-50` (light) / `bg-slate-900` (dark) — NOT pure white or pure black

### Task 1C: GlanceWidget Bar (Context Strip)

**Current state:** There's an `InfoHeaderBar` component in `src/components/layout/HeaderComponents.jsx` that shows stats. It was partially upgraded to a glass card.

**What to do:**
1. Read the existing `InfoHeaderBar` code
2. Upgrade it to a "GlanceWidget" strip that sits below the nav bar:
   - **Admin**: Total Players | Active Teams | Season Progress (ring) | Collections ($X/$Y) | Needs Attention (badge count)
   - **Coach**: Team Record (W-L) | Next Event (name + countdown) | Roster Count | Attendance Rate
   - **Parent**: Children Count | Next Event | Payments Due | Action Items Count
   - **Player**: Team | Position | XP/Level | Next Event
3. Use glass card styling matching the nav
4. Each widget is a compact card (icon + label + value) in a horizontal flex row
5. Make it collapsible with a chevron — users can hide it if they want more vertical space
6. Data should come from the same Supabase queries that already power the existing InfoHeaderBar / dashboard stats — reuse, don't rebuild

### Task 1D: Theme Token Expansion

**Current state:** `src/constants/theme.js` has accent colors with glass nav variants. `src/contexts/ThemeContext.jsx` provides `useTheme()` and `useThemeClasses()`.

**What to do:**
1. Read the existing theme.js and ThemeContext.jsx
2. Add these semantic tokens to the theme classes (accessible via `useThemeClasses()`):
   - `surface` — the default page background (`bg-slate-50` / `bg-slate-900`)
   - `surfaceElevated` — card backgrounds (`bg-white/80 backdrop-blur-md` / `bg-slate-800/80 backdrop-blur-md`)
   - `surfaceGlass` — glassmorphism cards (`bg-white/60 backdrop-blur-xl` / `bg-slate-800/60 backdrop-blur-xl`)
   - `divider` — borders between sections (`border-slate-200` / `border-white/[0.08]`)
   - `inputBg` — form input backgrounds
   - `inputBorder` — form input borders
   - `textPrimary`, `textSecondary`, `textMuted` — text color tiers
3. Add Tailwind config extensions (in tailwind.config.js):
   - `shadow-soft-sm`, `shadow-soft-md`, `shadow-soft-xl` — multi-layer soft shadows for light mode
   - `shadow-glow-{accent}` — subtle accent glow shadows
   - `rounded-3xl` (1.5rem), `rounded-4xl` (2rem) — extra border radii
   - `animate-fade-in-up` — the page transition keyframe
4. Do NOT remove any existing theme tokens or classes — only ADD new ones

### COMMIT CHECKPOINT: Phase 1
```bash
git add -A && git commit -m "CC-WEB Phase 1: Visual foundation - nav fixes, layout wrapper, glance bar, theme tokens" && git push
```

**Verify:**
- App starts without errors
- All pages still accessible via navigation
- Light mode: clean, readable, proper shadows, glass nav works
- Dark mode: readable, no text bleed-through, proper glass opacity
- Role switching still works
- Theme/accent toggle still works
- All existing features untouched

---

## PHASE 2: Role Dashboard Command Centers

**Goal:** Upgrade each role's dashboard to feel like a proper command center. The admin dashboard should feel like mission control. The coach dashboard should feel like a sideline HQ. The parent dashboard should feel like a proud parent's viewing gallery. The player dashboard should feel like a personal stats studio.

**CRITICAL:** Do NOT make these look like the mobile dashboards. The mobile dashboards are compact, card-based, swipeable. The web dashboards should leverage desktop space with multi-column layouts, data density, and side panels.

### Task 2A: Admin Dashboard Command Center

**Current file:** `src/pages/dashboard/DashboardPage.jsx` (46K, ~1200 lines)

**What to do:**
1. Read the ENTIRE existing DashboardPage.jsx first — understand all widgets, data fetching, charts
2. Restructure the layout to a 3-column command center:
   - **Left column (wide)**: Main content area — the existing DashCard widgets (Registration Stats, Financial Summary, Upcoming Events, Recent Activity) arranged in a 2-column grid
   - **Right column (narrow, 320px)**: Context sidebar — Season Overview (circular progress ring), Needs Attention items, Quick Actions (big buttons: Add Player, Create Event, Send Blast, View Reports), Announcements preview
3. **Hero section** at top spanning full width:
   - Organization name in hero typography (text-3xl font-black tracking-tight)
   - Subtitle: "Season X · Week Y of Z"
   - Quick stat strip: 4 stat pills inline (Players: X, Teams: Y, Collected: $Z, Attendance: X%)
4. Apply glass card styling to all DashCard components (surfaceElevated class)
5. The existing drag-and-drop widget grid (react-grid-layout from Sprint 5.1) should remain functional — this layout is the DEFAULT view. Users who customized their grid keep their customization.
6. **Keep ALL existing Supabase queries, chart components, data logic** — only change the LAYOUT and STYLING

### Task 2B: Coach Dashboard Command Center

**Current files:** `src/pages/roles/CoachDashboard.jsx` (73K) AND `src/pages/dashboard/CoachDashboard.jsx` (28K)

**NOTE:** There appear to be TWO CoachDashboard files. Read both. Determine which one is actually rendered (check MainApp.jsx routing). The one in `pages/roles/` is likely the active one.

**What to do:**
1. Read the active CoachDashboard file entirely
2. Restructure to sideline HQ layout:
   - **Hero card** at top: Next game/event with countdown timer, opponent name, venue. Styled like a broadcast graphic (gradient overlay, bold text, team color accent). If no upcoming game, show "Season Record: W-L" hero instead.
   - **Main area** (2 columns):
     - Left: Team roster panel (compact player grid with photo, name, jersey #, click to expand PlayerCard)
     - Right: Quick Actions stack (Take Attendance, Game Prep, Message Parents, Enter Stats) + Recent Activity feed
   - **Bottom section**: Upcoming schedule (next 5 events as event cards, not a table)
3. The coach should be able to see their team roster AT ALL TIMES on the dashboard — this is a command center, not a navigation hub
4. Glass card styling throughout
5. **Keep all existing data, queries, functionality**

### Task 2C: Parent Dashboard Command Center

**Current file:** `src/pages/roles/ParentDashboard.jsx` (83K)

**What to do:**
1. Read the entire file first
2. The parent dashboard should feel like a proud parent's viewing gallery — their kids are the stars
3. Layout:
   - **Hero section**: Child/children cards with photo, name, team, jersey #. If multiple children, show them as a horizontal row of player "trading cards" (the mini version — photo, name, team badge, position tag)
   - **Action Items panel** (right side or top banner): The PriorityCardsEngine output — payments due, waivers needed, RSVPs needed. Make these highly visible but not alarming (amber dots, not red alerts)
   - **Main area**: 
     - Upcoming events for this child/these children
     - Team standings snapshot (where their kid's team ranks)
     - Recent team posts / announcements
   - **If multiple children**: Tab or toggle to filter by child, or show a combined view with child avatars next to each item
4. The "My Stuff" link should be prominent but separate from the dashboard
5. Glass card styling, warm tone (this is a parent looking at their kid's sports life)
6. **Keep all existing data, queries, PriorityCardsEngine, functionality**

### Task 2D: Player Dashboard Command Center

**Current file:** `src/pages/roles/PlayerDashboard.jsx` (64K)

**What to do:**
1. Read the entire file first
2. The player dashboard should feel personal and achievement-driven — like a video game stats screen
3. Layout:
   - **Hero section**: Player's "trading card" — large photo area, name bold (first name small, last name BIG), position tag, team name, jersey number
   - **Stats strip**: Key season stats in a horizontal row (Games Played, Attendance %, Achievements Earned)
   - **Main area** (2 columns):
     - Left: Recent game results (win/loss cards with scores), upcoming events
     - Right: Achievement badges grid, XP/Level progress bar, leaderboard position
4. The player experience should feel gamified — XP bar, level indicator, badges with rarity colors
5. Glass card styling with accent color highlights on achievements
6. **Keep all existing data, queries, functionality**

### COMMIT CHECKPOINT: Phase 2
```bash
git add -A && git commit -m "CC-WEB Phase 2: Role dashboard command centers - admin, coach, parent, player" && git push
```

**Verify:**
- All 4 dashboard views render correctly
- Role switching between admin/coach/parent/player works
- All data loads (check for console errors)
- Charts and widgets still functional
- Existing modals/popups still open when clicked
- Nav still works on all pages

---

## PHASE 3: Feature Parity — Engagement System + Team Hub Upgrades

**Goal:** Bring features from mobile that don't exist on web yet. The web adaptations should leverage desktop space (side panels, multi-column, hover states) rather than copying mobile's bottom sheets and swipe gestures.

### Task 3A: Engagement System (Shoutouts + Challenges)

**Mobile reference files:**
- `reference/mobile-app/lib/shoutout-service.ts`
- `reference/mobile-app/lib/challenge-service.ts`
- `reference/mobile-app/lib/engagement-constants.ts`
- `reference/mobile-app/lib/engagement-events.ts`
- `reference/mobile-app/lib/engagement-types.ts`
- `reference/mobile-app/components/GiveShoutoutModal.tsx`
- `reference/mobile-app/components/ShoutoutCard.tsx`
- `reference/mobile-app/components/ChallengeCard.tsx`
- `reference/mobile-app/components/ChallengeDetailModal.tsx`
- `reference/mobile-app/components/CreateChallengeModal.tsx`
- `reference/mobile-app/components/ShoutoutProfileSection.tsx`

**What to build on web:**
1. Create `src/lib/shoutout-service.js` — port the core functions from mobile's shoutout-service.ts (sendShoutout, getTeamShoutouts, getPlayerShoutouts, etc.). Adapt from TypeScript to plain JavaScript. Use the same Supabase tables and queries.
2. Create `src/lib/challenge-service.js` — port from mobile's challenge-service.ts (createChallenge, getChallenges, joinChallenge, updateProgress, etc.)
3. Create `src/lib/engagement-constants.js` — port the XP values, shoutout categories, challenge types from mobile
4. Create `src/components/engagement/ShoutoutCard.jsx` — Desktop version of shoutout cards. Should look like social media "story" cards — player photo, shoutout text, category icon, who sent it.
5. Create `src/components/engagement/GiveShoutoutModal.jsx` — Desktop modal (not bottom sheet) with: player picker dropdown, shoutout category selector, custom message field, preview before send
6. Create `src/components/engagement/ChallengeCard.jsx` — Desktop challenge cards showing: challenge name, progress bar, participants count, deadline, join/leave button
7. Create `src/components/engagement/CreateChallengeModal.jsx` — Admin/coach modal to create new team challenges
8. Create `src/components/engagement/ChallengeDetailModal.jsx` — Full detail view with leaderboard of participants and their progress
9. Wire shoutouts into the Team Hub feed (appear alongside team_posts)
10. Wire challenges into the Team Hub (new "Challenges" tab or section)
11. Add "Give Shoutout" button to player cards and roster views
12. Add shoutout/challenge activity to the Recent Activity feed on dashboards

**Desktop adaptations (not same as mobile):**
- Shoutout modal is a centered desktop modal with more space for preview, not a bottom sheet
- Challenge leaderboard shows full participant list with progress bars side-by-side (not scrollable list)
- "Give Shoutout" is a button action, not a swipe gesture

### Task 3B: Team Hub Feed Upgrades

**Current files:** `src/pages/public/TeamWallPage.jsx` and `src/pages/teams/TeamWallPage.jsx`

**What to verify exists (from Phase 2 work):**
- ✅ Comments (CommentSection component)
- ✅ Emoji reactions (ReactionBar component)
- ✅ Photo gallery (PhotoGallery component)
- ✅ Cover photo upload
- ✅ Post pinning
- ✅ Three-dot menu

**What to add:**
1. **Shoutout posts in feed**: When someone gives a shoutout, it appears in the team feed as a special post type with distinctive styling (accent color border, shoutout icon, category badge)
2. **Challenge announcements in feed**: When a new challenge is created, auto-post to the team feed
3. **Inline post reactions with counts**: Make sure the emoji reaction summary bar (👍3 ❤️2 🔥1) is visible and clickable on all post types including shoutouts
4. **Photo gallery link in Team Hub nav tabs**: If the gallery tab exists but isn't in the Team Hub tab navigation, add it

### Task 3C: Achievement System Enhancements

**Current file:** `src/pages/achievements/AchievementsCatalogPage.jsx` (66K directory)

**Mobile reference:**
- `reference/mobile-app/components/AchievementCelebrationModal.tsx`
- `reference/mobile-app/lib/achievement-engine.ts`
- `reference/mobile-app/components/HexBadge.tsx`
- `reference/mobile-app/components/LevelBadge.tsx`

**What to add:**
1. If not already present, create a desktop `AchievementCelebrationModal.jsx` — a full-screen celebration overlay when a player earns an achievement (confetti animation, badge zoom-in, share button)
2. Create `HexBadge.jsx` and `LevelBadge.jsx` web equivalents — hexagonal badge icons with rarity glow effects (common=gray, rare=blue, epic=purple, legendary=gold). Use CSS gradients and box-shadows, not images.
3. Verify the achievement-engine logic exists on web. If not, port `achievement-engine.ts` to `src/lib/achievement-engine.js`
4. Add achievement badges to the Player Dashboard (Task 2D) and PlayerCardExpanded modal

### COMMIT CHECKPOINT: Phase 3
```bash
git add -A && git commit -m "CC-WEB Phase 3: Engagement system (shoutouts, challenges) + Team Hub + Achievement upgrades" && git push
```

**Verify:**
- Give Shoutout modal opens and sends (check Supabase for new rows)
- Shoutout cards appear in Team Hub feed
- Challenge creation works
- Challenge leaderboard displays
- Achievement badges render with rarity colors
- ALL existing Team Hub features still work (posts, comments, reactions, gallery, pins)

---

## PHASE 4: Desktop Power Features

**Goal:** Features that only make sense on desktop — leveraging screen real estate, mouse precision, and keyboard shortcuts that mobile can't do.

### Task 4A: Split-Panel Chat Enhancement

**Current file:** `src/pages/chats/ChatsPage.jsx` (80K directory)

**What to do:**
1. Read the existing ChatsPage — it likely already has a split-panel layout (sidebar channel list + main message area)
2. Enhance:
   - Add a third panel on the right: "Channel Info" that slides in when you click the channel name/header. Shows: member list, shared photos, shared files, pinned messages
   - Add keyboard shortcuts: `Enter` to send, `Shift+Enter` for newline, `Escape` to close info panel
   - Add drag-and-drop file upload to the message area (not just a file picker button)
   - Make the channel list searchable with a filter input at the top
3. If emoji picker exists, ensure it works. If voice message UI exists, ensure it works.
4. **Keep all existing chat functionality** — real-time subscriptions, typing indicators, reactions, attachments

### Task 4B: Calendar View Enhancements

**Current files:** `src/pages/schedule/SchedulePage.jsx` + `src/pages/schedule/CalendarViews.jsx`

**What to do:**
1. Read the existing CalendarViews.jsx — it has MonthView, WeekView, DayView, ListView
2. Enhance:
   - **Day view**: Show events as time blocks (like Google Calendar day view), not just a list
   - **Drag-and-drop event rescheduling** (admin only): Allow dragging events to different time slots in week/day view
   - **Event color coding**: Use team colors for team-specific events, accent color for org-wide events
   - **Hover preview**: Hovering over an event shows a tooltip with quick details (time, venue, RSVP count, assigned coaches)
3. **Keep all existing calendar views and data logic**

### Task 4C: Bulk Operations Refinement

**Current files:** `src/pages/registrations/RegistrationsPage.jsx`, `src/pages/payments/PaymentsPage.jsx`

**What to do:**
1. Verify bulk operations exist (they should from Phase 5 Sprint work documented in CLAUDE.md):
   - Bulk approve/deny registrations
   - Bulk payment reminders
   - Data export (CSV)
2. If they exist, make sure they have proper styling matching the new design (glass cards, proper shadows)
3. If any are missing, check the mobile reference and implement the web version
4. Add a "Select All" checkbox in table headers for any data table that supports bulk actions
5. Add a floating action bar at the bottom of the screen when items are selected: "X items selected — [Approve] [Deny] [Export] [Email]"

### COMMIT CHECKPOINT: Phase 4
```bash
git add -A && git commit -m "CC-WEB Phase 4: Desktop power features - chat panels, calendar, bulk ops" && git push
```

**Verify:**
- Chat split panel works with third info panel
- Calendar views still render all events
- Bulk operations work (test approve/deny on registrations)
- Existing pages not affected

---

## PHASE 5: Polish & Consistency

**Goal:** Make everything feel cohesive. Fix visual inconsistencies, add loading states, ensure responsive behavior.

### Task 5A: Glass Card Consistency Pass

**What to do:**
1. Go through EVERY page listed in CLAUDE.md's project structure
2. For each page, verify that cards/containers use the new `surfaceElevated` or `surfaceGlass` theme classes
3. Fix any page that still has hardcoded colors (like `bg-white` instead of theme-aware backgrounds, or `bg-[#050505]` instead of `bg-slate-900`)
4. Ensure all modals have the glass overlay treatment (backdrop-blur on the overlay)
5. Ensure all dropdown menus have glass styling
6. This is a STYLING pass — do NOT change any data logic, queries, or functionality

### Task 5B: Empty States

**Current:** `src/components/ui/EmptyState.jsx` exists (from Sprint 5.2)

**What to do:**
1. Read the existing EmptyState component
2. Verify it's used on all major pages. If any page shows a blank area when there's no data, add the EmptyState component
3. Pages to check: Dashboard (no events), Teams (no teams), Registrations (no pending), Payments (no records), Schedule (no events), Chats (no channels), Team Hub feed (no posts), Achievements (no badges earned)
4. Each empty state should have: an illustration or icon, a headline, a subtitle with guidance, and a CTA button where appropriate ("Create your first team", "Add an event", etc.)

### Task 5C: Responsive Audit

**What to do:**
1. Test the layout at these breakpoints: 1024px (laptop), 1280px (desktop), 1440px (large desktop), 1920px (ultrawide)
2. The 3-column dashboard layouts should collapse to 2 columns at 1024px and 1 column below that
3. The floating nav should collapse to a hamburger menu below 768px
4. Data tables should have horizontal scroll on smaller screens
5. Chat split panel should collapse to single panel below 1024px
6. Fix any overflow, text truncation, or layout breaking issues

### Task 5D: Transition & Micro-interaction Pass

**What to do:**
1. Add hover states to ALL interactive cards (subtle scale `transform: scale(1.01)` + shadow increase)
2. Add focus-visible outlines on all interactive elements (accessibility)
3. Ensure the page fade-in-up transition from Task 1B works on all route changes
4. Modal open/close should have a 200ms scale + fade animation
5. Dropdown menus should have a 150ms slide-down animation
6. Toast notifications should slide in from the top-right with stacking support

### COMMIT CHECKPOINT: Phase 5
```bash
git add -A && git commit -m "CC-WEB Phase 5: Polish - glass consistency, empty states, responsive, transitions" && git push
```

**Verify:**
- Every page has consistent card styling
- Empty states show on pages with no data
- Layout works at 1024px, 1280px, 1440px, 1920px
- Hover effects feel smooth, not jarring
- No console errors
- All existing functionality still works

---

## ⚠️ THINGS TO NEVER DO

1. **Never make the web feel like a phone app blown up on a big screen.** Desktop users expect data density, keyboard shortcuts, multi-panel views, and hover states. Don't waste screen space with single-card views that made sense on a 375px phone.

2. **Never rebuild something that already works.** If a page loads data, shows it correctly, and handles user actions — leave the logic alone. Only change the PRESENTATION layer.

3. **Never remove the role switcher.** All 4 roles (admin, coach, parent, player) must remain accessible at all times via the header role selector.

4. **Never hardcode team names, player names, or fake data.** Always use real Supabase queries. If data doesn't exist yet, show an empty state — not "John Doe" or "Sample Team."

5. **Never use orange (#F97316) for urgent/danger states.** Orange is the brand accent. Use amber/yellow for "needs attention" and red (#EF4444) only for destructive actions (delete, remove). Green (#10B981) for success/positive.

---

## 📚 FILE REFERENCE MAP

When you need to find existing code, here's where to look:

| Feature | Web File | Mobile Reference |
|---------|----------|-----------------|
| Auth | `src/contexts/AuthContext.jsx` | `reference/mobile-app/lib/auth.tsx` |
| Theme | `src/contexts/ThemeContext.jsx` + `src/constants/theme.js` | `reference/mobile-app/lib/theme.tsx` |
| Season context | `src/contexts/SeasonContext.jsx` | `reference/mobile-app/lib/season.tsx` |
| Admin dashboard | `src/pages/dashboard/DashboardPage.jsx` | `reference/mobile-app/components/AdminDashboard.tsx` |
| Coach dashboard | `src/pages/roles/CoachDashboard.jsx` | `reference/mobile-app/components/CoachDashboard.tsx` |
| Parent dashboard | `src/pages/roles/ParentDashboard.jsx` | `reference/mobile-app/components/ParentDashboard.tsx` |
| Player dashboard | `src/pages/roles/PlayerDashboard.jsx` | `reference/mobile-app/components/PlayerDashboard.tsx` |
| Team Hub / Wall | `src/pages/public/TeamWallPage.jsx` + `src/pages/teams/TeamWallPage.jsx` | `reference/mobile-app/components/TeamWall.tsx` |
| Chat | `src/pages/chats/ChatsPage.jsx` | `reference/mobile-app/app/chat/` |
| Schedule | `src/pages/schedule/SchedulePage.jsx` + CalendarViews.jsx | `reference/mobile-app/app/(tabs)/schedule.tsx` |
| Payments | `src/pages/payments/PaymentsPage.jsx` | `reference/mobile-app/components/payments-admin.tsx` + `payments-parent.tsx` |
| Player card | `src/components/players/PlayerCardExpanded.jsx` | `reference/mobile-app/components/PlayerCardExpanded.tsx` |
| Achievements | `src/pages/achievements/` | `reference/mobile-app/app/achievements.tsx` + `reference/mobile-app/lib/achievement-engine.ts` |
| Game prep | `src/pages/gameprep/GamePrepPage.jsx` | `reference/mobile-app/app/game-prep.tsx` |
| Game day | `src/pages/gameprep/GameDayCommandCenter.jsx` | `reference/mobile-app/components/AdminGameDay.tsx` |
| Blasts | `src/pages/blasts/BlastsPage.jsx` | `reference/mobile-app/app/blast-composer.tsx` + `blast-history.tsx` |
| Registration | `src/pages/registrations/RegistrationsPage.jsx` | `reference/mobile-app/app/registration-hub.tsx` |
| Shoutouts | **DOES NOT EXIST ON WEB — BUILD IT** | `reference/mobile-app/lib/shoutout-service.ts` + `reference/mobile-app/components/GiveShoutoutModal.tsx` + `ShoutoutCard.tsx` |
| Challenges | **DOES NOT EXIST ON WEB — BUILD IT** | `reference/mobile-app/lib/challenge-service.ts` + `reference/mobile-app/components/ChallengeCard.tsx` + related |
| Engagement engine | **DOES NOT EXIST ON WEB — BUILD IT** | `reference/mobile-app/lib/engagement-*.ts` |

---

## 🚀 HOW TO USE THIS SPEC

**For each session, tell Claude Code:**

> Read CC-WEB-REDESIGN.md in the project root for the full spec and rules. Also read CLAUDE.md for project context. We are now on Phase [X], Task [Y].

**Execution order:**
- Phase 1 first (foundation must be stable before dashboards change)
- Phase 2 after Phase 1 is committed
- Phase 3 after Phase 2 is committed  
- Phase 4 and 5 can run in any order after Phase 3

**If Claude Code hits context limits mid-phase**, restart with the same spec reference and tell it which tasks are already done.
