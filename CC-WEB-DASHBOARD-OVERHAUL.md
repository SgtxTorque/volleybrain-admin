# CC-WEB-DASHBOARD-OVERHAUL.md

## CONTEXT

Lynx is a dual-platform youth sports club management app (volleybrain-admin = web, Volleybrain-Mobile3 = mobile). Both platforms share the same Supabase backend and must feel like the **same product** — a user moving from mobile to web should feel continuity, not whiplash.

This spec converts the web admin portal dashboards to match the HTML mockups already designed:
- `admin-dashboard-v1.html` → Admin Org Dashboard (the first thing an admin sees)
- `coach-dashboard-v3.html` → Coach Dashboard (the first thing a coach sees)

The mockups are the source of truth for layout and visual design. The existing codebase is the source of truth for data, auth, routing, and Supabase logic.

**What exists today that is GOOD and must be preserved:**
- Tele-Grotesk font — already installed in `/public/fonts/` and wired in `index.css` ✅
- Lynx color tokens in `tailwind.config.js` (`lynx-navy`, `lynx-sky`, etc.) ✅
- Full theme system (dark/light) in `ThemeContext.jsx` ✅
- `DashboardLayout` component for 3-column layouts ✅
- All Supabase data fetching in existing dashboard components ✅
- Role-based routing in `MainApp.jsx` ✅
- Journey system (`JourneyContext`, `JourneyTimeline`) ✅
- All page routes and navigation ✅

**What needs to change:**
- The current Admin dashboard (`DashboardPage.jsx`) uses a 3-column layout with sidebars — replace with the new org health hero + icon sidebar layout
- The current Coach dashboard (`CoachDashboard.jsx`) uses the old 3-column layout — replace with the new icon sidebar + game day hero layout
- Both dashboards need a new **collapsible icon sidebar** (64px collapsed, 228px expanded on hover) that replaces the current left sidebar pattern

---

## WORKING RULES

1. **Read before modifying.** Read every file you will touch before writing a single line. No assumptions.
2. **Schema first.** Read `DATABASE_SCHEMA.md` (or `Supabase_schema.md`) before any new Supabase query.
3. **NEVER DELETE ANY FILE.** This is an absolute rule with no exceptions. No `rm`, no file deletion, no removing imports that "seem unused." If something is being replaced, it gets moved to `src/_archive/` first. If something is being refactored, the original stays until the replacement is confirmed working.
4. **Archive before replace.** Any component being replaced by a new version must be copied to `src/_archive/[original-path]/` before the new version is written. This means if `CoachLeftSidebar.jsx` is being replaced, it lives at `src/_archive/components/coach/CoachLeftSidebar.jsx` permanently.
5. **New files alongside old ones.** When building a new version of a component (e.g., a new `CoachGameDayHero.jsx`), write the new file first, wire it in, confirm it works, THEN move the old one to `_archive/`. Never overwrite in place.
6. **Preserve all data logic.** All existing `useEffect` hooks fetching from Supabase must survive. If a component is being replaced visually, extract its data fetching into the new component before archiving the old one. Not a single Supabase query gets lost.
7. **No file over 500 lines.** If a component grows beyond 500 lines, split into child components in the same folder.
8. **JSX clean.** No unused imports. No console.log in production paths.
9. **Tailwind only.** No new inline style objects unless required by dynamic values (e.g., conic-gradient for score ring). Use existing Lynx tokens (`lynx-navy`, `lynx-sky`, `gold`, etc.).
10. **Dark/light mode required on every component.** Use `const { isDark } = useTheme()` and conditional classes. Never hardcode a single theme.
11. **Mobile-web parity principle.** The web and mobile must feel like the same product. Use the same terminology, same card patterns, same color language. A parent or coach moving between the two should feel continuity.
12. **Commit after each phase.** `git add -A && git commit -m "phase X: description"`
13. **Do not break other roles.** After every phase, the Admin, Coach, Player, and Parent dashboards must all still render without errors.
14. **Icon sidebar is a shared component.** Build it once in `src/components/layout/LynxSidebar.jsx` — used by both Admin and Coach dashboards. Do not duplicate.
15. **The mockup HTML files are in the repo root** — read them directly to extract exact class patterns, color hex values, and layout structure.

---

## PHASE 0 — Archive Snapshot (Safety Net)

**Goal:** Before touching a single component, create a complete snapshot of everything that will be modified. This is the safety net. If anything goes wrong at any point, the originals are always recoverable from `src/_archive/`.

**Run these exact commands:**
```bash
mkdir -p src/_archive/components/layout
mkdir -p src/_archive/components/dashboard
mkdir -p src/_archive/components/coach
mkdir -p src/_archive/pages/dashboard
mkdir -p src/_archive/pages/roles

# Layout components being modified
cp src/components/layout/DashboardLayout.jsx src/_archive/components/layout/DashboardLayout.jsx
cp src/components/layout/AdminLeftSidebar.jsx src/_archive/components/layout/AdminLeftSidebar.jsx
cp src/components/layout/NavIcon.jsx src/_archive/components/layout/NavIcon.jsx

# Dashboard components being replaced
cp src/components/dashboard/OrgSidebar.jsx src/_archive/components/dashboard/OrgSidebar.jsx
cp src/components/dashboard/TeamSnapshot.jsx src/_archive/components/dashboard/TeamSnapshot.jsx
cp src/components/dashboard/RegistrationStatsCard.jsx src/_archive/components/dashboard/RegistrationStatsCard.jsx
cp src/components/dashboard/PaymentSummaryCard.jsx src/_archive/components/dashboard/PaymentSummaryCard.jsx
cp src/components/dashboard/UpcomingEventsCard.jsx src/_archive/components/dashboard/UpcomingEventsCard.jsx
cp src/components/dashboard/LiveActivity.jsx src/_archive/components/dashboard/LiveActivity.jsx

# Coach components being replaced
cp src/components/coach/CoachLeftSidebar.jsx src/_archive/components/coach/CoachLeftSidebar.jsx
cp src/components/coach/CoachCenterDashboard.jsx src/_archive/components/coach/CoachCenterDashboard.jsx
cp src/components/coach/CoachGameDayHero.jsx src/_archive/components/coach/CoachGameDayHero.jsx
cp src/components/coach/CoachRosterPanel.jsx src/_archive/components/coach/CoachRosterPanel.jsx

# Full page files being restructured
cp src/pages/dashboard/DashboardPage.jsx src/_archive/pages/dashboard/DashboardPage.jsx
cp src/pages/roles/CoachDashboard.jsx src/_archive/pages/roles/CoachDashboard.jsx
```

**Then verify:**
```bash
ls src/_archive/pages/dashboard/
ls src/_archive/components/coach/
```

Both should show the copied files. If any copy fails, stop and fix it before proceeding.

**Commit:**
```bash
git add -A && git commit -m "phase 0: archive snapshot of all files to be modified"
```

**After this phase:** The original files are still in their original locations AND in `_archive/`. Nothing has been changed. The archive is purely additive.

---

## PHASE 1 — LynxSidebar Shared Component

**Goal:** Build the collapsible icon sidebar as a reusable component. This is the foundation everything else inherits.

**Read first:**
- `src/components/layout/DashboardLayout.jsx`
- `src/components/layout/AdminLeftSidebar.jsx`
- `src/components/layout/NavIcon.jsx`
- `src/MainApp.jsx` (to understand current nav structure and active route detection)
- `tailwind.config.js` (for available color tokens)

**Create:** `src/components/layout/LynxSidebar.jsx`

**Behavior:**
- Collapsed state: 64px wide, shows only icons centered in the column
- Expanded state: 228px wide, shows icons + labels + section headers + badges
- Expand trigger: CSS hover (`group` + `group-hover`) — no JS state needed, pure CSS transition
- Transition: `width 0.28s cubic-bezier(0.4,0,0.2,1)` on the sidebar container
- Labels, section headers, org info, and user footer: `opacity-0` collapsed → `opacity-100` expanded, same transition timing
- Active nav item: sky-blue left accent bar (3px, `bg-lynx-sky`), sky-tinted background
- Badge counts: red pill, only visible when expanded

**Props interface:**
```jsx
<LynxSidebar
  role="admin" | "coach" | "player" | "parent"
  navItems={[{ id, label, icon, path, badge }]}
  orgName="Black Hornets VBC"
  orgInitials="BH"
  teamName="Black Hornets Elite"      // coach only
  teamSub="14U · Spring 2026"         // coach only
  userName="Carlos D."
  userRole="Director · Admin"
  activePath="/dashboard"
  onNavigate={(path) => {}}
  contextSlot={null}                  // optional: season/sport switcher for admin
/>
```

**Structure (top to bottom):**
1. Logo row: Lynx paw icon + "Lynx" wordmark (hidden when collapsed)
2. Org/team identity row: badge circle + name + sub (hidden when collapsed)
3. Context slot (admin only): season + sport switcher pills (hidden when collapsed)
4. Nav items: icon + label, grouped by section with section labels
5. Bottom user row: avatar + name + role (hidden when collapsed)

**Dark/light:**
- Background: always `bg-[#0B1628]` (navy-deep) — sidebar is always dark regardless of app theme
- This matches mobile's dark bottom nav / drawer pattern — sidebar is a constant anchor

**Export** from `src/components/layout/index.js`

**Bash:**
```bash
git add -A && git commit -m "phase 1: LynxSidebar shared component"
```

---

## PHASE 2 — Admin Org Dashboard Layout Shell

**Goal:** Replace `DashboardPage.jsx`'s layout with the new icon sidebar + scrollable main content shell. No data changes yet — just the structural layout.

**Read first:**
- `src/pages/dashboard/DashboardPage.jsx` (full file — 1489 lines)
- `admin-dashboard-v1.html` in repo root (the mockup — read the full layout structure)
- `src/contexts/AuthContext.jsx` (for user/org data shape)
- `src/contexts/SeasonContext.jsx`
- `src/contexts/SportContext.jsx`

**What to do:**
- Replace the outer layout wrapper in `DashboardPage.jsx` with a new two-column flex layout:
  - Left: `<LynxSidebar role="admin" ... />` (fixed, 64px)
  - Right: scrollable main area (`ml-16` margin to clear sidebar, `flex-1`, `overflow-y-auto`)
- Remove `DashboardLayout` (left/right sidebars pattern) from the admin dashboard
- The top bar (currently in `MainApp.jsx`) remains — don't remove it
- All existing card components (`OrgSidebar`, `TeamSnapshot`, etc.) stay in the file for now — we'll replace them in Phase 3. Just change the wrapper.
- Wire `LynxSidebar` with real data from `useAuth()`, `useSeason()`, `useSport()` contexts
- Admin nav items (from `admin-dashboard-v1.html`):
  - Overview: Org Dashboard (active), Reports, Season Setup
  - People: All Players, Parents (badge: pending count), Coaches
  - Program: Teams, Evaluations (badge), Tryouts, Blasts
  - Finance: Payments (badge), Waivers (badge)
  - Settings: Settings
- `onNavigate` should use `useNavigate()` from react-router-dom, routing to existing page paths from `src/lib/routes.js`

**Bash:**
```bash
git add -A && git commit -m "phase 2: admin dashboard layout shell with LynxSidebar"
```

---

## PHASE 3 — Admin Org Health Hero Card

**Goal:** Build the Org Health Hero card — the centerpiece of the admin dashboard. This replaces the current top-of-page content.

**Read first:**
- `admin-dashboard-v1.html` — the `.org-hero` section (lines ~130–260 approx)
- `src/pages/dashboard/DashboardPage.jsx` — identify all existing Supabase queries and what data they already fetch (teams, players, payments, waivers, events)
- `src/components/dashboard/OrgSidebar.jsx` — extract any useful data logic before replacing

**Create:** `src/components/dashboard/OrgHealthHero.jsx`

**Visual structure (matches mockup exactly):**
- Dark navy background (`#0B1628`) with radial gradient mesh and subtle dot-grid overlay
- Three columns inside:
  1. **Left — Score block:** Animated conic-gradient health score ring (0–100), org name in Bebas Neue (use `font-black tracking-wide` as close approximation since Tele-Grotesk is the web font), status text ("Healthy / Needs Attention / Critical")
  2. **Center — KPI pills:** Two rows of glassmorphic pills, each showing a stat value + label + change indicator. Stats: Active Teams, Registered Players, Revenue Collected, Waiver Completion, Events This Month, Avg Attendance, Active Coaches, Overdue Payments
  3. **Right — Urgent actions:** Border-left divider, "Needs Attention" title, 4–5 urgent items with colored dot indicators and counts

**Data mapping (from existing Supabase queries — reuse, don't re-fetch):**
- Teams count → existing teams query
- Players count → existing registrations/players query
- Payments → existing payments query (collected vs outstanding)
- Waivers → existing waivers query (signed vs total)
- Events → existing schedule query
- Health score: calculate as weighted average: `(waiver_pct * 0.25) + (payment_pct * 0.30) + (attendance_pct * 0.25) + (profile_complete_pct * 0.20)`

**Props:**
```jsx
<OrgHealthHero
  orgName="Black Hornets VBC"
  healthScore={83}
  kpis={{ teams, players, revenueCollected, outstanding, waiverPct, eventsMonth, avgAttendance, coaches, overduePayments }}
  urgentItems={[{ label, count, severity: 'critical'|'warning'|'info' }]}
  isDark={isDark}
/>
```

**Bash:**
```bash
git add -A && git commit -m "phase 3: OrgHealthHero card with live data"
```

---

## PHASE 4 — Admin Season Journey Trackers

**Goal:** Build the multi-sport Season Journey tracker row that sits directly under the hero card.

**Read first:**
- `admin-dashboard-v1.html` — the `.journey-row` section
- `src/contexts/JourneyContext.jsx` — understand the existing journey step system
- `src/components/journey/JourneyTimeline.jsx` — reuse this logic if possible
- `src/contexts/SportContext.jsx` — for multi-sport data shape

**Create:** `src/components/dashboard/SeasonJourneyRow.jsx`

**Visual structure:**
- 3-column grid (or as many active sports as exist)
- Each card has a sport-specific top accent bar color (volleyball = sky blue, basketball = amber, soccer = green)
- Inside each card: sport icon + name + season name, percentage number, progress bar, 6-step tracker (Setup → Tryouts → Rosters → Season → Playoffs → Wrap-up), team/player count, contextual CTA button
- Step dots: done = filled sport color, active = navy with sky glow ring, upcoming = border only
- Progress bar fills with sport color

**Data:** Pull from `JourneyContext` + season data. Each sport's journey is independent. If a sport has no active season, don't show its card.

**Bash:**
```bash
git add -A && git commit -m "phase 4: SeasonJourneyRow multi-sport trackers"
```

---

## PHASE 5 — Admin Dashboard Body Cards

**Goal:** Replace the remaining dashboard body with the card grid from the mockup: KPI stat cards, notifications, all-teams table, action items, upcoming events, people compliance, financials, org wall.

**Read first:**
- `admin-dashboard-v1.html` — everything below `.journey-row`
- `src/components/dashboard/` — all existing card components. Extract data logic and reuse where possible before replacing.
- `src/pages/dashboard/DashboardPage.jsx` — all remaining Supabase queries

**Build these components** (each in `src/components/dashboard/`):
- `OrgKpiRow.jsx` — 4 stat cards (Players, Families, Coaches, Teams)
- `AllTeamsTable.jsx` — table with team name, sport tag, record, player count, health bar, status chip
- `OrgActionItems.jsx` — prioritized action list with icons, descriptions, counts, chevrons
- `OrgUpcomingEvents.jsx` — org-wide schedule with multi-team event grouping
- `PeopleComplianceRow.jsx` — 4 role cards (Players, Parents, Coaches, Org) with completion rows
- `OrgFinancials.jsx` — 4 financial stat tiles + "Send reminders" CTA
- `OrgWallPreview.jsx` — 3 recent team wall posts (reuse existing post components)

**Layout:** Assemble in `DashboardPage.jsx` using CSS grid sections matching the mockup row structure.

**Bash:**
```bash
git add -A && git commit -m "phase 5: admin dashboard body cards complete"
```

---

## PHASE 6 — Coach Dashboard Layout + Hero Card

**Goal:** Convert `CoachDashboard.jsx` to use `LynxSidebar` + the new Game Day Hero card from the coach mockup.

**Read first:**
- `src/pages/roles/CoachDashboard.jsx` (full — 856 lines)
- `coach-dashboard-v3.html` in repo root (full mockup)
- `src/components/coach/CoachGameDayHero.jsx` — existing component, assess what to keep vs rebuild
- `src/components/coach/CoachLeftSidebar.jsx` — extract data logic before removing

**Layout change:**
- Same pattern as admin: `LynxSidebar` fixed left (64px) + scrollable main
- Remove `DashboardLayout` 3-column wrapper

**Coach nav items:**
- Main: Dashboard (active), Schedule (badge: upcoming count), Roster, Stats, Team Wall
- Tools: Game Day, Send Blast, Challenges, Shoutouts (badge)
- Club: Payments, Evaluations, Settings

**Hero card (`CoachGameDayHero.jsx` — rebuild to match mockup):**
- Shortened width (full content width), height ~225px
- Dark navy with radial gradient, dot grid texture
- Left: live badge (if game today), team label, matchup title in Bebas Neue style, stat pills row (court, kills, aces, blocks)
- Right: Season record (large Bebas Neue 4—1 display), win rate, recent form badges (W/L), "Open Game Day ⚡" CTA button
- If no game today: show next upcoming game with countdown

**Bash:**
```bash
git add -A && git commit -m "phase 6: coach dashboard layout + game day hero"
```

---

## PHASE 7 — Coach Dashboard Body Cards

**Goal:** Build the full coach dashboard card grid from the mockup.

**Read first:**
- `coach-dashboard-v3.html` — full layout
- `src/components/coach/CoachCenterDashboard.jsx` — extract all data logic
- `src/components/coach/CoachRosterPanel.jsx` — reuse roster data fetching

**Build these components** (each in `src/components/coach/`):
- `CoachJourneyTracker.jsx` — single-sport journey tracker (same pattern as SeasonJourneyRow but scoped to coach's team/sport)
- `CoachNotifications.jsx` — notifications card (4 items, unread dots)
- `SquadRosterCard.jsx` — player photos + jersey numbers + position, 2-column grid. Green dot for online/active.
- `CoachStatMiniCards.jsx` — 2×2 grid: Roster count, RSVP'd today, Due evaluations, Stats to enter
- `CoachTools.jsx` — 2-column quick action grid: Send Blast, Build Lineup, Give Shoutout, Enter Stats, Manage Roster, Challenge
- `CoachActionItems.jsx` — 3 action items with colored dots (reuse/adapt from admin version)
- `CoachScheduleCard.jsx` — upcoming 3–4 events with RSVP counts
- `ChallengesCard.jsx` — empty state with "Create Challenge" CTA, or active challenges if they exist
- `TopPlayersCard.jsx` — 5-player leaderboard with rank, avatar, position, kill/ace/PPG stats
- `TeamReadinessCard.jsx` — 4 health bars: Attendance, Eligibility, Waivers, RSVP
- `TeamWallPreviewCard.jsx` — 3 recent wall posts

**Layout in `CoachDashboard.jsx`:**
```
Row 1: [Hero Card] [Notifications]         (grid: 1fr 300px)
Row 2: [Journey Tracker] [Squad Roster]    (grid: 1fr 300px)
Row 3: [Coach Tools] [Stat Mini Cards] [ ] (grid: 1fr 1fr 300px)
Row 4: [Action Items] [Schedule] [Challenges]  (grid: 1fr 1fr 1fr)
Row 5: [Top Players] [Team Readiness] [Team Wall] (grid: 1fr 1fr 1fr)
```

**Bash:**
```bash
git add -A && git commit -m "phase 7: coach dashboard body cards complete"
```

---

## PHASE 8 — Mobile-Web Parity Audit + Polish

**Goal:** Ensure the two platforms feel like the same product. Terminology, card patterns, and color language must match.

**Checklist — verify each item:**

- [ ] Font: Tele-Grotesk is loading correctly across all new components (check network tab)
- [ ] Colors: `lynx-navy` (#10284C), `lynx-sky` (#4BB9EC), `gold` (#FFD700) used consistently — no stray blue-500/purple-600 from old components
- [ ] Terminology matches mobile: "Game Day" not "Game Prep", "Squad" not "Team Members", "Shoutout" not "Kudos", "Blast" not "Announcement"
- [ ] Journey tracker step labels match mobile app exactly
- [ ] Dark mode: every new component renders correctly in both dark and light themes
- [ ] Role selector: Admin and Coach role pills in topbar still function (this was the existing bug — verify it hasn't regressed)
- [ ] Empty states: use Lynx cub mascot (`/public/lynx-mascot.png` if it exists, or paw emoji 🐾 as fallback) — not generic empty box illustrations
- [ ] No VolleyBrain references remain in any new or modified component
- [ ] Sidebar hover transition is smooth (test in Chrome)
- [ ] All existing page routes still navigate correctly from the new sidebar
- [ ] No TypeScript/prop errors in browser console

**Final commit:**
```bash
git add -A && git commit -m "phase 8: mobile-web parity audit and polish"
```

---

## EXECUTION ORDER SUMMARY

| Phase | What | Key Files |
|-------|------|-----------|
| 1 | LynxSidebar component | `src/components/layout/LynxSidebar.jsx` |
| 2 | Admin layout shell | `DashboardPage.jsx` (wrapper swap) |
| 3 | Org Health Hero card | `src/components/dashboard/OrgHealthHero.jsx` |
| 4 | Season Journey row | `src/components/dashboard/SeasonJourneyRow.jsx` |
| 5 | Admin body cards | Multiple in `src/components/dashboard/` |
| 6 | Coach layout + hero | `CoachDashboard.jsx` + `CoachGameDayHero.jsx` |
| 7 | Coach body cards | Multiple in `src/components/coach/` |
| 8 | Parity audit + polish | All modified files |

**To start CC:**
```
Read CC-WEB-DASHBOARD-OVERHAUL.md in the project root. Also read CLAUDE.md and DATABASE_SCHEMA.md if they exist. Start with Phase 1.
```

**Between phases:**
```
Phase [X] is done and committed. Read CC-WEB-DASHBOARD-OVERHAUL.md and continue with Phase [X+1].
```

**If something breaks:**
```
Stop. Do not continue. Read the error carefully. The most likely cause is a missing import or a removed component that something else still references. Fix only the breakage, do not refactor anything else. Commit the fix, then continue.
```
