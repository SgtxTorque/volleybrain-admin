# CC-ROLE-DASHBOARDS-REDESIGN.md — Coach, Parent & Player Dashboard Redesign
## For Claude Code Execution

**Project:** volleybrain-admin (React/Vite web app)
**Backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**GitHub:** SgtxTorque/volleybrain-admin
**Depends on:** CC-WEB-REDESIGN.md (Admin Dashboard + Team Hub must be completed first)

---

## RULES (READ FIRST — APPLY TO ALL PHASES)

1. **Read CLAUDE.md and DATABASE_SCHEMA.md** in the project root before doing anything.

2. **Read CC-WEB-REDESIGN.md** for the color system, theme mapping, and translation rules (Next.js → React/Vite, shadcn → Tailwind, etc.). The same rules apply here.

3. **Read each dashboard file FULLY before changing it.** These are large files (1300-1927 lines). Understand every import, data hook, modal, helper function, and render section before making changes. Missing something = breaking something.

4. **ZERO FEATURE REMOVAL.** Every widget, modal, popup, dropdown, button, chart, form, data query that currently works MUST still work after changes. You are reskinning and restructuring the layout — NOT rebuilding from scratch.

5. **Preserve ALL existing data hooks and Supabase queries.** These dashboards already fetch real data (teams, players, events, payments, badges, stats, RSVPs, etc.). Do NOT replace working queries with mock data.

6. **Do NOT touch these files:**
   - `src/contexts/*` (AuthContext, ThemeContext, SeasonContext, etc.)
   - `src/lib/*` (supabase.js, routes.js, etc.)
   - `src/pages/dashboard/DashboardPage.jsx` (Admin — already redesigned)
   - `src/pages/public/TeamWallPage.jsx` (Team Hub — already redesigned)
   - Any page under `src/pages/` that is NOT one of the three role dashboards

7. **Use the existing theme system.** Use `useTheme()`, `useThemeClasses()`, `isDark` conditionals. Support both light and dark modes. The v0 light-mode palette from CC-WEB-REDESIGN.md is your light-mode target.

8. **Font system:** The project now uses Tele-Grotesk via Tailwind's `font-sans`. Use Tailwind font weight classes:
   - `font-normal` (400) — body text, labels
   - `font-semibold` (600) — card titles, nav items
   - `font-bold` (700) — section headers, page headings
   - `font-black` (900) — display text, hero elements, big numbers
   **REMOVE all Google Fonts imports** (Bebas Neue, Rajdhani, DM Sans, Outfit) and all `style={{ fontFamily: '...' }}` inline font declarations from these files. Let Tailwind's font-sans handle everything.

9. **Card styling must match the Admin Dashboard.** Use the same card patterns already established:
   - Light: `bg-white border border-slate-200 rounded-2xl shadow-sm`
   - Dark: `bg-slate-800 border border-white/[0.08] rounded-2xl`
   - Or use the `tc.cardBg`, `tc.border` theme classes already in the codebase.

10. **Layout structure:** All three dashboards should use consistent layout patterns:
    - Max width container: `max-w-7xl mx-auto px-4 sm:px-6 py-6`
    - Section spacing: `space-y-6`
    - Grid gaps: `gap-4` for widget grids, `gap-6` for major sections
    - Responsive: 1 col mobile → 2-3 col desktop

11. **Remove all heavy CSS-in-JS style blocks.** The Coach and Player dashboards have massive `<style>` blocks with custom CSS (tc-styles, vg-styles). Remove these entirely and replace with Tailwind classes. No more `.tc-wrap`, `.tc-card`, `.tc-widget`, `.vg-dashboard`, `.vg-hero`, `.vg-hex`, etc.

12. **Git discipline:** Commit after EACH phase. Message format: `"CC-ROLES Phase X: [description]"`

13. **Test before committing:** Run `npm run dev`, verify the page loads, data appears, no console errors, all buttons/modals still work.

---

## DESIGN PHILOSOPHY BY ROLE

### 🏐 COACH — "Mission Control That Feels Alive"
Coaches open this daily. They need at-a-glance answers: Who's coming? What's next? How are we doing? But they also want the tool to feel professional and energizing — not like a spreadsheet.

**Design direction:**
- Clean 3-column layout matching Admin Dashboard aesthetic
- Left sidebar: Team selector + squad quick stats
- Center: Hero card (next game/record), tactical tools, schedule
- Right sidebar: Attendance feed, recent activity
- Keep the team color accent throughout (dynamic based on selected team)
- Cards feel alive with subtle micro-interactions (hover states, smooth transitions)
- Remove the dark "tactical command center" / military aesthetic — replace with the clean light-mode card design from the Admin Dashboard
- Preserve ALL coach tools: Lineup Builder, Game Day Hub, Coach Blast, Warmup Timer, Attendance

### 👨‍👩‍👧 PARENT — "Celebration Hub With Daily Touchpoints"
Parents check this every day for quick updates. They want to celebrate their kids, stay on top of payments, and know what's happening next. The emotional core is pride in their child.

**Design direction:**
- Clean 2-column layout (wider center + right sidebar)
- Hero area: Player card(s) for their children — photo, team, jersey, position, status. This is the emotional anchor. Make it beautiful.
- Center column: Priority action cards (payments, waivers, RSVPs), upcoming events calendar, team feed preview
- Right sidebar: Payment summary, quick links, checklist progress
- The player card section should feel premium — like a sports trading card, but clean and modern (not cartoonish)
- Multi-child support: Tabs or horizontal scroll to switch between children
- Keep the pride-driven moments: achievements badges, shoutout notifications
- Preserve ALL parent features: Payment modals, RSVP inline, Action Items Sidebar, Priority Cards Engine, Getting Started Checklist, Alerts, Re-registration, Add Child

### 🎮 PLAYER — "Feels Like a Video Game, Doesn't Look Like One"
Players (teens) will be in this app daily. It needs dopamine. But the instruction is clear: **feel** like a game, don't **look** like one. That means:

**Design direction:**
- The PLAYER PAGE IS ALLOWED TO LOOK DIFFERENT from the rest of the app. It can have its own personality.
- Use a dark theme by default (this is a player's personal space — dark = immersive, cool)
- Background: Deep navy/charcoal gradient (not pure black). Subtle, barely-visible pattern or grid.
- The "game feel" comes from: progress systems, satisfying animations, status/rank displays, achievement unlocks — NOT from pixel fonts, neon borders, scanlines, or hexagons.
- Hero section: Large player photo with team color accent. Name, position, jersey. Level + XP bar (keep the existing XP system — it's great). Overall rating diamond.
- Stats section: Clean stat bars (not "power bars" with glow). Each stat is a horizontal bar chart row. Label | Value | Bar | Rank. Simple, readable, satisfying.
- Trophy case: Horizontal scroll of earned achievement cards. Rarity colors (legendary gold, epic purple, rare blue, common gray). Locked slots for unearned. This section is the dopamine hit.
- Upcoming events: Clean event cards with team color accents
- Battle Log: Recent game results with W/L badges, key stat highlights
- Squad Comms: Activity feed from their team
- Quick Actions: 2x2 grid (Team Hub, Leaderboards, Trophies, Standings)
- **Future-proofing for themes:** Keep all color references as CSS variables or extractable constants. Down the road, players will be able to pick theme palettes (cyberpunk, sunset, arctic, etc.). Structure the code so the color system can be swapped via a single object/config.
- Animation: Subtle entrance animations (fade-up on scroll). XP bar fills on load. Trophy cards have a gentle hover lift. Nothing flashy — satisfying.
- Typography: Use Tele-Grotesk at heavier weights (font-bold, font-black) for headers. The geometric face naturally adds edge without needing display fonts.

---

## PHASE 1: COACH DASHBOARD

**File:** `src/pages/roles/CoachDashboard.jsx` (1778 lines)

### Step 1.1: Strip the old skin
- Remove the entire `const tcStyles = \`...\`` CSS block and the `<style>{tcStyles}</style>` tag
- Remove the Google Fonts @import (Bebas Neue, Rajdhani)
- Remove the `.tc-wrap`, `.tc-scanlines` wrapper classes
- Remove all `style={{ fontFamily: 'Bebas Neue, sans-serif' }}` and `fontFamily: 'Rajdhani, sans-serif'` inline styles
- Keep ALL state variables, useEffect hooks, data fetching, helper functions, modals (EventDetailModal, CoachBlastModal, WarmupTimerModal, AttendanceCard)

### Step 1.2: Build the 3-column layout
Replace the current single-column `max-w-7xl` container with:

```
┌─────────────────────────────────────────────────────────┐
│  TEAM SELECTOR (if multiple teams) — horizontal scroll  │
├────────────┬──────────────────────────┬─────────────────┤
│            │                          │                 │
│  LEFT      │  CENTER CONTENT          │  RIGHT          │
│  SIDEBAR   │                          │  SIDEBAR        │
│  (280px)   │  (flex-1)                │  (300px)        │
│            │                          │                 │
│  Squad     │  Hero Card               │  Attendance     │
│  Status    │  (Next Game / Record)    │  Feed           │
│            │                          │  (upcoming      │
│  Quick     │  4 Command Widgets       │   events with   │
│  Stats     │  (grid 2x2)             │   RSVP counts)  │
│            │                          │                 │
│  Quick     │  Tactical Command        │  Recent         │
│  Actions   │  (Lineup + Game Day)     │  Activity       │
│  (compact  │                          │                 │
│   list)    │  Schedule/Events         │                 │
│            │  (with AttendanceCards)  │                 │
│            │                          │                 │
└────────────┴──────────────────────────┴─────────────────┘
```

**Left sidebar (w-[280px] shrink-0):**
- Team card (color strip, team name, coach role)
- Squad count, season record W-L, win rate %
- Recent Form dots (W/L/T circles)
- Quick Actions as compact list items (not large hero cards):
  - Take Attendance → navigates
  - Message Parents → opens CoachBlastModal
  - Start Warmup → opens WarmupTimerModal
  - Team Hub → navigates
  - Team Chat → opens chat

**Center content (flex-1, min-w-0):**
- Hero card: Next game (team color gradient, opponent, countdown, time/location) OR season record if no upcoming game
- 4 stat widgets in 2x2 grid: Squad Status, Next Objective, Recent Form, Season Record — clean white/dark cards, NOT the old `.tc-widget` style
- Tactical Command section: Lineup Builder + Game Day Hub as 2 side-by-side action cards
- Stats pending alert (if any games need stats entered)
- Upcoming Events section with expandable AttendanceCard components

**Right sidebar (w-[300px] shrink-0):**
- Attendance preview for next event (who's confirmed, who hasn't responded)
- RSVP summary counts across upcoming events
- Recent activity feed (new RSVPs, messages, stat entries)

### Step 1.3: Restyle all components
- All cards: match Admin Dashboard card styling (white bg, subtle border, rounded-2xl, shadow-sm)
- Team color used as accent (not background): colored left border strip on cards, colored icon backgrounds, colored text highlights
- Hero card keeps the gradient approach but cleaner — no scanlines, no ::before overlays
- Modals (CoachBlast, WarmupTimer, EventDetail): Update to white/dark card styling, remove the dark "tactical" styling. Keep all functionality.
- AttendanceCard: Restyle from `.tc-card` to standard card. Keep the expand/collapse, player list, check/x buttons.

### Step 1.4: Responsive
- Below 1024px: Stack to single column (sidebar content moves above/below center)
- Below 768px: All single column, hero card full width

**Commit:** `"CC-ROLES Phase 1: Coach Dashboard redesign — 3-column layout, clean card styling, remove tactical theme"`

---

## PHASE 2: PARENT DASHBOARD

**File:** `src/pages/roles/ParentDashboard.jsx` (1927 lines)

### Step 2.1: Audit and preserve
- Keep ALL imports: TeamStandingsWidget, ChildStatsWidget, ChildAchievementsWidget, ParentChecklistWidget, usePriorityItems, PriorityCardsList, ActionBadge, ActionItemsSidebar, QuickRsvpModal
- Keep ALL modals: EventDetailModal, PaymentOptionsModal, AddChildModal, ReRegisterModal, AlertDetailModal
- Keep ALL data hooks: loadParentData, loadUpcomingEvents, loadPaymentSummary, loadAlerts, loadOpenSeasons, loadTeamRecord, loadPlayerBadges
- Keep: priorityEngine, handlePriorityAction, RSVP functionality, photo upload, org branding header

### Step 2.2: Build the layout
```
┌─────────────────────────────────────────────────────────┐
│  ORG BRANDING HEADER (if custom branding exists)        │
├─────────────────────────────────────────────────────────┤
│  CHILD SELECTOR — horizontal cards (scroll if 3+ kids)  │
├──────────────────────────────────────┬──────────────────┤
│                                      │                  │
│  CENTER CONTENT                      │  RIGHT SIDEBAR   │
│  (flex-1)                            │  (320px)         │
│                                      │                  │
│  ┌──────────────────────────────┐    │  Payment         │
│  │  PLAYER HERO CARD            │    │  Summary         │
│  │  (trading card feel)         │    │  (amount due,    │
│  │  Photo | Name | Team | #    │    │   progress bar,  │
│  │  Position | Status badge    │    │   Make Payment)  │
│  └──────────────────────────────┘    │                  │
│                                      │  Quick Links     │
│  Priority Action Cards               │  (My Stuff,      │
│  (payments, waivers, RSVPs)          │   Team Hub,      │
│                                      │   Calendar)      │
│  Getting Started Checklist           │                  │
│                                      │  Achievements    │
│  Upcoming Events                     │  Preview         │
│  (with inline RSVP buttons)         │  (recent badges) │
│                                      │                  │
│  Team Feed Preview                   │  Team Record     │
│  (latest 2-3 posts)                 │  (W-L)           │
│                                      │                  │
│  Team Standings Widget               │  Checklist       │
│  Child Stats Widget                  │  Progress        │
│  Child Achievements Widget           │  (% complete)    │
│                                      │                  │
└──────────────────────────────────────┴──────────────────┘
```

### Step 2.3: Player Hero Card redesign
This is the emotional centerpiece. For the active child:
- Full-width card with 2 sections: photo column (left, ~280px) + info column (right)
- Photo column: team-color gradient background, player photo centered, jersey number overlay
- Info column: First + Last name (large, bold), team name with color dot, position, status badge
- Below info: Mini stat row (Games Played, Points, Achievements count) — small badges, not large
- If multiple children: tab bar above the hero card to switch. Active tab has team-color top border.
- Trading card feel = clean, premium edges, subtle shadow, team color accent. NOT: literal card borders, holographic effects, or sports card templates.

### Step 2.4: Restructure center content
- Priority Action Cards stay prominent — these are the "daily touchpoints"
- Events section: Clean event rows with date badge (colored), event name, time, RSVP buttons inline
- Feed preview: Show 2-3 latest posts from the active child's team, compact format
- Existing widgets (TeamStandings, ChildStats, ChildAchievements): Keep but restyle to match new card system

### Step 2.5: Right sidebar
- Payment Summary card: Amount due (large, red if overdue), progress bar (paid/total), "Make Payment" button
- Quick Links: Compact list — My Stuff, Team Hub, Full Calendar, Documents
- Achievements preview: Last 2-3 earned badges, "View All →" link
- Team Record: Simple W-L display with team color

### Step 2.6: Alerts
- Org announcements display above the main content as dismissible banners (keep current behavior)
- Urgent alerts: red gradient background, prominent
- Normal alerts: subtle card with icon

### Step 2.7: Preserve Action Items Sidebar
The ActionItemsSidebar is a slide-out panel triggered by "View All →" on priority cards. Keep it exactly as-is functionally. Restyle the panel to match the new card system.

**Commit:** `"CC-ROLES Phase 2: Parent Dashboard redesign — 2-column layout, player hero card, clean card styling"`

---

## PHASE 3: PLAYER DASHBOARD

**File:** `src/pages/roles/PlayerDashboard.jsx` (1313 lines)

### ⚠️ CRITICAL: This page has its own personality
The Player Dashboard is intentionally different from the admin/coach/parent pages. It uses a dark, immersive theme. This is by design — players are teens who will use this daily.

### Step 3.1: Strip the old skin, keep the soul
- Remove the entire `const STYLES = \`...\`` CSS block and the `<style>{STYLES}</style>` tag
- Remove the Google Fonts @import (Bebas Neue, Rajdhani)
- Remove all `.vg-*` class references
- Remove all `style={{ fontFamily: '...' }}` inline font overrides
- **BUT** keep the dark background, keep the immersive feel, keep the level/XP system, keep the trophy cards
- Keep ALL state, data hooks, helper functions, AdminPlayerSelector modal

### Step 3.2: Create the theme config
At the top of the file, create an extractable theme object (future-proofing for player theme selection):

```javascript
// Player theme — extractable for future theme picker
const PLAYER_THEME = {
  bg: '#0f1219',              // Deep navy, not pure black
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  // Team color injected dynamically from selectedTeam.color
}
```

### Step 3.3: Hero section redesign
Keep the hero large and dramatic — this is the player's identity.
- Background: Solid dark gradient (no scanlines, no ::before patterns, no ambient blobs)
- Player photo: Large, rounded-2xl, 2px border in team color. Clean, no neon glow.
- Player name: Large (text-5xl+), font-black, white, team color subtle text-shadow
- Position/Team/Jersey badges: Clean pill badges with team color background
- Level badge: Clean circle, team color border, "LVL" label + number. No pulse animation.
- XP bar: Horizontal progress bar, team color fill, clean rounded. Subtle shine gradient on the fill (not animated shimmer). Shows "Level X · Y XP" and "Z XP to Level N+1"
- Quick stat badges: 3 clean circles or squares (Games, Trophies, Points) — NOT hexagons. Simple bordered containers with number + label.
- Overall rating: Clean diamond or rounded square, team color background, white number

### Step 3.4: Stat HUD redesign
Rename from "Stat HUD" to "Season Stats" (feels like a game without using game UI language).
- Clean dark card with subtle border
- Each stat row: Icon | Label (small caps) | Value (large number) | Horizontal bar | Rank badge
- Bar fill: Team color at ~60% opacity. No glow, no animated shimmer.
- Rank badges: Only show for top 10. Clean rounded rectangle, gold for top 3.
- Bottom row: Hit %, Serve %, Games — clean metric boxes

### Step 3.5: Trophy Case redesign
This is the main dopamine section. Keep it exciting but clean.
- Horizontal scroll of trophy cards
- Each card: ~150px wide, rounded-2xl, rarity gradient background
  - Legendary: warm gold gradient
  - Epic: deep purple gradient
  - Rare: blue gradient
  - Common: gray gradient
- Card content: Large emoji icon centered, trophy name at bottom, rarity label small in corner, earned date
- Locked cards: Dark card with subtle lock icon. "Locked" text. Clean, not "redacted" or "classified."
- Hover: Subtle lift (translateY -2px), slight shadow increase
- The cards should feel collectible and desirable

### Step 3.6: Content grid
Below the hero:
```
┌──────────────────────────────┬─────────────────────────┐
│                              │                         │
│  Season Stats                │  Squad Comms            │
│  (full stat bar display)     │  (activity feed)        │
│                              │                         │
│  Trophy Case                 │  Quick Actions          │
│  (horizontal scroll)         │  (2x2 grid)             │
│                              │                         │
│  Upcoming Events             │                         │
│  (event cards)               │                         │
│                              │                         │
│  Battle Log                  │                         │
│  (recent game results)       │                         │
│                              │                         │
└──────────────────────────────┴─────────────────────────┘
```

Use `grid grid-cols-12 gap-6`:
- Left: `col-span-12 lg:col-span-7`
- Right: `col-span-12 lg:col-span-5`

### Step 3.7: Event cards
- Rename "Upcoming Battles" → "Upcoming Events" (or keep "Upcoming" — simple)
- Remove VS GAME / PRACTICE military-style badges → use clean colored pill: green "Practice", red "Game"
- Date badge: Clean rounded square with day/date, team color background at low opacity
- Keep countdown text ("Today", "Tomorrow", "In 3 days")
- Remove all `.vg-battle` styling

### Step 3.8: Battle Log
- Rename to "Recent Games" (or keep "Game Log")
- Clean card rows: Date | W/L badge (green/red rounded square) | Opponent + Score | Key stats (K/A/D/B)
- Remove military result styling

### Step 3.9: Squad Comms
- Rename to "Team Activity" or "Team Feed"
- Clean activity feed items with avatar, text, timestamp
- "Enter Team Wall" button at bottom with team color

### Step 3.10: Quick Actions
- 2x2 grid: Team Hub, Leaderboards, Trophies, Standings
- Clean dark cards with icon + label
- Hover: team color border glow (subtle)

### Step 3.11: Animation (the "game feel" without game look)
Use Tailwind + minimal CSS for these ONLY:
- Page sections: `animate-[fadeUp_0.5s_ease-out]` with staggered delays (0.1s increments). Define this keyframe once.
- XP bar: `transition-all duration-1000 ease-out` on width (animates on load via state)
- Trophy cards: `transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg`
- Cards: `transition-all duration-200` for hover border/shadow changes
- That's it. No scanlines, no pulse, no glow animations, no particle effects.

### Step 3.12: Admin Preview banner
Keep the admin preview banner and player switcher. Restyle to match:
- Subtle amber background strip
- "Viewing as [Name]" + Switch Player button
- AdminPlayerSelector modal: Restyle to match dark theme, remove old `.vg-*` classes

**Commit:** `"CC-ROLES Phase 3: Player Dashboard redesign — dark immersive theme, clean stat bars, trophy case, theme-ready architecture"`

---

## PHASE 4: FINAL POLISH PASS

### Step 4.1: Cross-dashboard consistency check
- All cards use the same border radius, shadow, spacing
- All section headers use the same typography pattern (font-bold, text-lg, tracking-tight)
- All "View All →" links use the same style
- All empty states use the same pattern (icon + heading + subtitle)
- All modals have consistent backdrop, border radius, padding

### Step 4.2: Remove dead code
- Remove any unused imports
- Remove commented-out code blocks
- Remove any remaining `.tc-*` or `.vg-*` CSS class references
- Remove any Google Fonts link tags or @import statements

### Step 4.3: Verify responsive behavior
Each dashboard should be fully usable at:
- Desktop (1280px+): Full multi-column layout
- Tablet (768-1024px): 2 columns or stacked
- Mobile (< 768px): Single column, all content accessible

### Step 4.4: Verify all features work
Run through each role and verify:

**Coach:**
- [ ] Team selector switches teams and reloads data
- [ ] Hero card shows next game or season record
- [ ] 4 stat widgets show real data
- [ ] Lineup Builder and Game Day Hub cards navigate correctly
- [ ] Take Attendance navigates
- [ ] Message Parents opens CoachBlastModal, sends work
- [ ] Start Warmup opens WarmupTimerModal, timer works
- [ ] Team Hub and Team Chat navigate correctly
- [ ] Schedule events display with AttendanceCards
- [ ] AttendanceCard expands, shows roster, check/x buttons save RSVPs
- [ ] Event detail modal opens on click

**Parent:**
- [ ] Child selector switches active child
- [ ] Player hero card shows correct child's photo, team, jersey, status
- [ ] Photo upload works (click on photo area)
- [ ] Priority action cards appear with correct counts
- [ ] "View All →" opens Action Items Sidebar
- [ ] Payment modal opens, shows amounts, copy buttons work
- [ ] RSVP buttons work inline on events
- [ ] Getting Started Checklist renders and tracks progress
- [ ] Org alerts display and can be dismissed
- [ ] TeamStandingsWidget, ChildStatsWidget, ChildAchievementsWidget render
- [ ] Add Child modal works
- [ ] Re-register flow works

**Player:**
- [ ] Player photo and identity display correctly
- [ ] Level and XP bar calculate and display correctly
- [ ] Overall rating diamond shows
- [ ] Stat bars show real season stats with correct values and per-game rates
- [ ] Rankings display for top-10 stats
- [ ] Trophy case shows earned badges with correct rarity colors
- [ ] Locked trophy placeholders appear
- [ ] Upcoming events show with correct dates/times
- [ ] Game log shows recent results with W/L and stat highlights
- [ ] Team activity feed shows real items
- [ ] Quick action buttons navigate correctly
- [ ] Admin preview banner works (switch player)
- [ ] AdminPlayerSelector modal opens and switches players

**Commit:** `"CC-ROLES Phase 4: Final polish — consistency check, dead code removal, responsive verification"`

---

## SUMMARY OF WHAT CHANGES vs. WHAT STAYS

### CHANGES (visual/structural):
- Layout: Single column → multi-column (coach 3-col, parent 2-col, player 2-col grid)
- Styling: Custom CSS blocks → Tailwind classes
- Typography: Google Fonts → Tele-Grotesk (via font-sans)
- Cards: Custom themed cards → consistent Admin Dashboard card styling (except Player which keeps dark theme)
- Coach: "Tactical Command Center" military theme → clean professional layout
- Parent: Trading card hero → premium but clean player card
- Player: Neon/hex/scanline video game → immersive dark with clean satisfying progress systems

### STAYS (must not break):
- ALL state management and data hooks
- ALL Supabase queries
- ALL modals and their full functionality
- ALL navigation (onNavigate, navigateToTeamWall, openTeamChat)
- ALL existing widgets and their data display
- Level/XP calculation system
- Trophy/badge rarity system
- Priority Cards Engine
- Action Items Sidebar
- Parent onboarding checklist
- Photo upload functionality
- RSVP system
- Coach Blast messaging
- Warmup Timer
- Attendance system
- Admin preview mode for Player Dashboard
- Theme system (light/dark) for Coach and Parent
