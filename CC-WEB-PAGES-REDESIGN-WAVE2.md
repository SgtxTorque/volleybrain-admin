# CC-WEB-PAGES-REDESIGN-WAVE2.md
## Lynx Web Admin -- Full Pages Modernization (Wave 2)
### For Claude Code Execution

**Repo:** volleybrain-admin
**Branch:** feat/desktop-dashboard-redesign
**Backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**Date:** March 7, 2026

---

## WHAT HAS ALREADY BEEN REDESIGNED

These pages already use the new PageShell + brand treatment. DO NOT touch them:
- `SchedulePage.jsx` (PageShell, branded event cards, hover popups)
- `AttendancePage.jsx` (PageShell, inline dropdown detail, branded event cards)
- `JerseysPage.jsx` (PageShell, compact 3-col cards, brand treatment)
- `TeamsPage.jsx` (PageShell, SeasonFilterBar, gradient health bars)
- `PaymentsPage.jsx` (PageShell, SeasonFilterBar, brand button colors)
- `RegistrationsPage.jsx` (PageShell, SeasonFilterBar, amber pending rows)

These dashboards were fully redesigned earlier. DO NOT touch them:
- `DashboardPage.jsx` (Admin -- 24-col widget grid)
- `CoachDashboard.jsx` (Coach -- hero carousel, tools, roster)
- `ParentDashboard.jsx` (Parent -- child hero, priority cards, 3-col)
- `PlayerDashboard.jsx` (Player -- dark theme, trading card)

---

## RULES (READ FIRST -- APPLY TO ALL PHASES)

1. **Read CLAUDE.md** in the project root before doing anything.
2. **Read each file FULLY before modifying it.** Understand every import, hook, modal, and data query.
3. **Archive before replace** -- copy the original to `src/_archive/pages-wave2-YYYYMMDD/` first.
4. **ZERO FEATURE REMOVAL.** Every modal, button, form, filter, data query, export function that currently works MUST still work. You are reskinning the layout and visual treatment. Not rebuilding.
5. **Preserve all Supabase queries and data hooks.** Never replace real queries with mock data.
6. **Do NOT touch:** `src/contexts/*`, `src/lib/*`, `MainApp.jsx`, `LynxSidebar.jsx`, any dashboard file, any already-redesigned page listed above.
7. **Theme system:** Use `useTheme()`, `useThemeClasses()`, `isDark`. Support light and dark modes.
8. **Font:** Inter Variable via Tailwind `font-sans`. No other fonts. No Google Font imports. No Bebas Neue (that is mobile-only). No Tele-Grotesk (was replaced with Inter).
9. **Tailwind only.** Use the `lynx-*` and `brand-*` color namespaces already in tailwind.config.js. No inline styles. No custom CSS blocks. No Google Font imports.
10. **Color tokens from tailwind.config.js:** `lynx-navy=#10284C`, `lynx-sky=#4BB9EC`, `lynx-charcoal=#1A2744`, `lynx-cloud=#F6F8FB`, `lynx-silver=#E8ECF2`, `brand-navy-deep=#0D1B3E`, `brand-sky-blue=#4BB9EC`, `brand-off-white=#F6F8FB`, `brand-border=#E8ECF2`. For neutrals use Tailwind `slate-*`.
11. **No em dashes** in any user-facing text.
12. **Commit after each phase** with the exact message format shown.
13. **Max 500 lines per file.** If a page exceeds this after redesign, split into sub-components in the same directory.
14. **Test all 4 roles** render without console errors after each phase.
15. **BEFORE PHASE 1:** Read these 3 files in full as your style reference: `src/pages/schedule/SchedulePage.jsx`, `src/pages/teams/TeamsPage.jsx`, and `src/components/pages/PageShell.jsx`. Every page you redesign must look like it belongs with these. If you see a pattern in those files, follow it. If you don't see it, don't invent it.

---

## DESIGN SYSTEM RULES (How every page should look)

Every page being redesigned must follow the patterns already established by the 6 redesigned pages. Study `SchedulePage.jsx` and `TeamsPage.jsx` as your primary references.

### Page Shell
```jsx
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// PageShell provides: max-w-[1400px], px-6 py-6, breadcrumb, title, subtitle, actions
<PageShell title="..." subtitle="..." breadcrumb="..." actions={...}>
  <InnerStatRow stats={[{ value: '24', label: 'TOTAL', icon: '👥', sub: 'across 5 teams' }]} />
  <SeasonFilterBar ... />
  <MainContent />
</PageShell>
```

### Visual Rules (from actual codebase, not guesses)
- **Stat cards:** `bg-white rounded-[14px] border border-slate-200 px-5 py-4 hover:shadow-md` -- this is exactly what InnerStatRow uses. Values use `text-r-3xl font-extrabold tracking-tight text-slate-900`. Labels use `text-[11px] font-bold uppercase tracking-wider text-slate-400`.
- **Cards (light):** `bg-white rounded-[14px] border border-slate-200` or `bg-white rounded-xl border border-slate-200`
- **Cards (dark):** `bg-lynx-charcoal border border-white/[0.06]`
- **Primary buttons:** `bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110` or `bg-lynx-sky text-lynx-navy font-bold rounded-xl hover:bg-lynx-sky/80`
- **Secondary buttons:** `border border-slate-200 rounded-lg text-slate-800` (light) / `bg-lynx-charcoal border-white/[0.06] text-white` (dark)
- **Inputs/selects:** `px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20`
- **Dropdowns/popovers:** `rounded-[14px] shadow-2xl border overflow-hidden`
- **Hover backgrounds:** `hover:bg-slate-100` (light), `hover:bg-white/[0.04]` (dark)
- **View toggle pills:** `rounded-xl p-1 border` container, active pill: `bg-lynx-sky/20 text-lynx-sky`, inactive: transparent
- **Empty states:** Centered with `rounded-full bg-slate-100` icon container, then heading + subtext + action button
- **Text sizes:** Use responsive clamp tokens: `text-r-xs`, `text-r-sm`, `text-r-base`, `text-r-lg`, `text-r-xl`, `text-r-2xl`, `text-r-3xl`
- **Dark mode:** Always use ternary: `${isDark ? 'dark-classes' : 'light-classes'}`. Check existing pages for exact patterns.
- **Color tokens:** Use `lynx-*` namespace (`lynx-navy`, `lynx-sky`, `lynx-charcoal`, `lynx-cloud`) and `brand-*` namespace (`brand-sky-blue`, `brand-navy-deep`) from tailwind.config.js. Also use standard Tailwind `slate-*` for neutrals.
- **Shadows:** Use `shadow-soft-sm`, `shadow-soft-md`, or `hover:shadow-md`. Never raw `shadow-lg` without the custom tokens.
- **No `max-w-*` wrappers inside pages.** PageShell already handles `max-w-[1400px]`. Content inside is full-width.

---

## PHASE 1: Coach/Admin Daily-Use Pages

These are the pages admins and coaches hit every day. Highest impact.

### 1a. CoachesPage.jsx (800 lines)
- Add PageShell wrapper
- Stat row: Total Coaches, Assigned to Teams, Unassigned, Background Check Status
- Table with coach photo, name, role (Head/Assistant), assigned teams (pill badges), email, phone
- Action buttons: Assign to Team, Edit Role, Remove
- Filter bar: search by name, filter by team, filter by role
- If > 500 lines, split coach table into `CoachesTable.jsx`

### 1b. RosterManagerPage.jsx (443 lines)
- Add PageShell wrapper
- Stat row: Total Players, Rostered, Unrostered, Avg Roster Fill %
- Preserve the `evaluate` mode and `setup` mode sub-views
- Player cards: photo, name, jersey, position (colored pill), grade, stats snapshot
- Keep all existing evaluation form functionality intact

### 1c. BlastsPage.jsx (693 lines)
- Add PageShell wrapper
- Stat row: Total Sent, Avg Read Rate, Pending Reads, Urgent Count
- Card-based blast list with type badge, priority indicator, read progress bar
- Compose modal: keep all targeting options, priority levels, team selection
- Filter tabs: All, Urgent, Unread, Payment, Schedule, General

### 1d. NotificationsPage.jsx (726 lines)
- Add PageShell wrapper
- Stat row: Total Sent, Delivered %, Pending, Failed
- Template management with card grid
- Push notification queue with status tracking
- Keep all existing send/template functionality

**Commit:** `"Wave 2 Phase 1: CoachesPage, RosterManagerPage, BlastsPage, NotificationsPage — PageShell + brand treatment"`

---

## PHASE 2: Player/Parent Engagement Pages

These are the pages that make players and parents feel connected. Engagement-critical.

### 2a. TeamStandingsPage.jsx (561 lines)
- Add PageShell wrapper
- Stat row: Total Teams, Games Played, Season Record
- Standings table: rank, team name (with color dot), W-L-T, win %, points, streak indicator
- Clean card layout. Highlight the user's team row.

### 2b. SeasonLeaderboardsPage.jsx (660 lines)
- Add PageShell wrapper
- Category tabs: Kills, Aces, Digs, Blocks, Assists, Points, Serve %, etc.
- Top 3 players: large card with photo, name, team, stat value
- Full list below with rank, photo, name, team, stat value
- Use XP power bar style for stat visualization (matches mobile aesthetic)

### 2c. AchievementsCatalogPage.jsx (486 lines)
- Add PageShell wrapper
- Grid of achievement cards with rarity colors (Common=gray, Rare=blue, Epic=purple, Legendary=gold)
- Each card: hex badge icon, name, description, rarity pill, earned/locked state
- Filter by: rarity, earned/available, category
- Detail modal on click with progress tracking

### 2d. PlayerStatsPage.jsx (743 lines)
- This was just wired in Phase 4 of Sprint A. Now give it the brand treatment.
- Add PageShell wrapper
- Season selector
- Stat summary cards: Games, Kills/Game, Aces/Game, Digs/Game
- Personal bests section
- Game-by-game history table
- Skill ratings visualization (use power bars, not radar charts -- per Lynx design system)

**Commit:** `"Wave 2 Phase 2: Standings, Leaderboards, Achievements, PlayerStats — PageShell + brand treatment"`

---

## PHASE 3: Parent-Specific Pages

### 3a. ParentPaymentsPage.jsx (540 lines)
- Add PageShell wrapper
- Stat row: Total Owed, Total Paid, Outstanding Balance, Next Due Date
- Payment cards grouped by child with status badges (Paid/Due/Overdue)
- Payment history table with date, amount, method, status
- Preserve Pay Now action buttons

### 3b. MyStuffPage.jsx (672 lines)
- Add PageShell wrapper
- Tab-based layout: Profile, Payments, Waivers, Settings, Linked Players
- Each tab: clean card layout with brand styling
- Notification preferences section (already has the save/load logic)
- Keep all existing form fields and save functionality

### 3c. ParentPlayerCardPage.jsx (985 lines)
- This is the largest parent page. Add brand treatment.
- Player hero card at top (name, photo, team, jersey, position)
- Tabs: Overview, Stats, Evaluations, Waivers, Achievements
- Each tab content with card layout
- Split into sub-components if > 500 lines: `ParentPlayerHero.jsx`, `ParentPlayerTabs.jsx`

### 3d. PlayerProfilePage.jsx (657 lines)
- Add PageShell wrapper
- Player detail view with photo, personal info, medical/allergy, emergency contacts
- Clean card sections for each data group
- Editable fields for parents viewing their own child

**Commit:** `"Wave 2 Phase 3: ParentPayments, MyStuff, ParentPlayerCard, PlayerProfile — PageShell + brand treatment"`

---

## PHASE 4: Reports and Analytics Pages

### 4a. ReportsPage.jsx (848 lines)
- Add PageShell wrapper
- Stat row: Active Players, Collection Rate %, Total Revenue, Attendance Avg
- Report cards: Registration, Financial, Attendance, Player Stats
- Each report section with charts/tables
- Export buttons preserved
- Split if needed: `ReportCards.jsx` for individual report sections

### 4b. RegistrationFunnelPage.jsx (788 lines)
- Add PageShell wrapper
- Funnel visualization: Views > Starts > Completions > Approved
- Conversion rate between each step
- Drop-off analysis cards
- Date range filter

### 4c. SeasonArchivePage.jsx (639 lines)
- Add PageShell wrapper
- Season cards: name, dates, team count, player count, record, financial summary
- Click to expand with detailed season data
- Search/filter by year

**Commit:** `"Wave 2 Phase 4: Reports, RegistrationFunnel, SeasonArchive — PageShell + brand treatment"`

---

## PHASE 5: Settings Pages

All 6 settings pages need the same treatment. These are admin-only so lower user impact, but they should still look polished.

### Pattern for all settings pages:
- Add PageShell wrapper
- Clean card sections for each settings group
- Form inputs: consistent Tailwind styling (`rounded-lg border-slate-200 focus:ring-sky-500`)
- Save/cancel buttons: navy primary, ghost secondary
- Success/error toast on save

### Pages:
- **5a. SeasonsPage.jsx** (1017 lines) -- season list + create/edit. Split into `SeasonCard.jsx` and `SeasonFormModal.jsx`
- **5b. OrganizationPage.jsx** (813 lines) -- org settings. Split into `OrgSettingsSection.jsx` components
- **5c. WaiversPage.jsx** (1053 lines) -- waiver templates + signatures. Split into `WaiverEditor.jsx` and `WaiverSignaturesList.jsx`
- **5d. RegistrationTemplatesPage.jsx** (797 lines) -- form builder. Brand treatment on the builder UI
- **5e. PaymentSetupPage.jsx** (551 lines) -- Stripe config + payment plans
- **5f. DataExportPage.jsx** (944 lines) -- export options. Clean card layout with export buttons

**Commit:** `"Wave 2 Phase 5: All 6 settings pages — PageShell + brand treatment + file splitting"`

---

## PHASE 6: Remaining Pages

### 6a. MyProfilePage.jsx (1417 lines)
- Add PageShell wrapper
- Split into sub-components: `ProfileInfo.jsx`, `ProfileSecurity.jsx`, `ProfilePreferences.jsx`
- Card sections: Personal Info, Password/Security, Notification Preferences, Appearance
- Photo upload with preview

### 6b. CoachAvailabilityPage.jsx (1169 lines)
- Add PageShell wrapper
- Calendar grid for availability
- Survey creation and response viewing
- Split into: `AvailabilityCalendar.jsx`, `AvailabilitySurvey.jsx`

### 6c. ChatsPage.jsx (555 lines)
- Already has theme system (39 refs). Give it the brand card treatment.
- Split-panel layout is intentional and correct for desktop. Just update card styles.
- Channel list: branded cards with team color dots, unread badges
- Message thread: clean bubbles with Lynx colors

### 6d. PublicRegistrationPage.jsx (1109 lines)
- This is public-facing. Needs to look extra polished.
- Brand the header, form steps, and confirmation screen
- Split into: `RegistrationSteps.jsx`, `RegistrationConfirmation.jsx`

**Commit:** `"Wave 2 Phase 6: MyProfile, CoachAvailability, Chats, PublicRegistration — PageShell + brand treatment + splitting"`

---

## PHASE 7: Verification Pass

1. Switch between all 4 roles (admin, coach, parent, player) and navigate to every page.
2. Verify:
   - No console errors on any page
   - All modals still open and function
   - All forms submit correctly
   - All tables/lists load data
   - Dark mode works on every page
   - No pages exceed 500 lines (check with `wc -l`)
3. Run `npm run build` -- zero build errors.
4. Report any issues found.

**Commit:** `"Wave 2 Phase 7: full verification pass — all pages modernized, build clean"`

---

## SUMMARY

| Phase | Pages | Total Files |
|-------|-------|-------------|
| 1 | Coaches, Roster, Blasts, Notifications | 4 pages |
| 2 | Standings, Leaderboards, Achievements, PlayerStats | 4 pages |
| 3 | ParentPayments, MyStuff, ParentPlayerCard, PlayerProfile | 4 pages |
| 4 | Reports, RegistrationFunnel, SeasonArchive | 3 pages |
| 5 | All 6 Settings pages | 6 pages |
| 6 | MyProfile, CoachAvailability, Chats, PublicRegistration | 4 pages |
| 7 | Verification | -- |
| **TOTAL** | **25 pages redesigned** | 7 commits |

After this spec completes, every page in the web admin will have the Lynx brand treatment, PageShell layout, and consistent design language. The web will feel like the same product as mobile.
