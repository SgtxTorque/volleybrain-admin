# CC-INNER-PAGES-V2 — Inner Pages Redesign (Schedule, Jerseys, RSVP, Teams, Payments, Registrations)

**Spec Author:** Claude Opus 4.6
**Date:** March 7, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Design Reference:** `lynx-inner-pages-mockup.html` (in repo root or recent uploads) + Carlos's feedback
**Brand Reference:** Read `LynxBrandBook.html` (find it: `find . -name "LynxBrandBook*"`) and `LYNX-UX-PHILOSOPHY.md`

---

## CONTEXT

The dashboards are locked in. Now the inner pages need the same premium treatment. Carlos reviewed HTML mockups and gave specific feedback:

1. **RSVP detail should EXPAND INLINE below the event card** (dropdown pattern, like payments), NOT a side panel
2. **Jersey warning cards should NOT resize** — use background color tint instead, with a small icon button for "Ask Parent"
3. **Season filter on every inner page** — admin and coach get season/sport/team dropdowns
4. **Event cards need more color and brand presence** — not just a thin left border. Use the brand book aggressively. Background tints, proper Lynx color treatment.
5. **Domain fix:** Replace any "lynxsports.com" with "thelynxapp.com"

---

## RULES

1. Read every file before modifying
2. Archive before replace
3. Preserve all Supabase data fetching
4. Commit after each phase
5. TSC verify after each phase
6. No file over 500 lines
7. Read `LynxBrandBook.html` and `LYNX-UX-PHILOSOPHY.md` BEFORE writing any visual code

---

## BEFORE STARTING

```bash
# Read brand references
cat LYNX-UX-PHILOSOPHY.md
find . -name "LynxBrandBook*" -not -path "*/node_modules/*" | head -5
# Read the brand book if found

# Read the HTML mockup for reference
find . -name "lynx-inner-pages*" | head -3

# Fix domain
grep -r "lynxsports.com" src/ --include="*.jsx" --include="*.js" --include="*.css" -l
# Replace all with "thelynxapp.com"

# Archive all inner page files
mkdir -p src/_archive/inner-pages-v2-$(date +%Y%m%d)
cp src/pages/schedule/SchedulePage.jsx src/_archive/inner-pages-v2-$(date +%Y%m%d)/
cp src/pages/roster/RosterManagerPage.jsx src/_archive/inner-pages-v2-$(date +%Y%m%d)/
cp src/pages/teams/TeamsPage.jsx src/_archive/inner-pages-v2-$(date +%Y%m%d)/
cp src/pages/payments/PaymentsPage.jsx src/_archive/inner-pages-v2-$(date +%Y%m%d)/
cp src/pages/registrations/RegistrationsPage.jsx src/_archive/inner-pages-v2-$(date +%Y%m%d)/
cp src/pages/gameprep/GameDayCommandCenter.jsx src/_archive/inner-pages-v2-$(date +%Y%m%d)/
# Find and archive jersey/attendance pages
find src/pages -name "*Jersey*" -o -name "*jersey*" -o -name "*Attendance*" -o -name "*attendance*" -o -name "*RSVP*" -o -name "*rsvp*" | while read f; do cp "$f" "src/_archive/inner-pages-v2-$(date +%Y%m%d)/"; done
```

**Commit:** `git add -A && git commit -m "phase 0: archive + domain fix + read brand references"`

---

## PHASE 1: Shared Inner Page Components

**Goal:** Build reusable components that every inner page shares — page header, stat row, filter bar, season filter.

### Step 1.1: Create shared PageShell component

`src/components/pages/PageShell.jsx`

Every inner page wraps in this:

```jsx
export default function PageShell({ breadcrumb, title, subtitle, actions, children }) {
  return (
    <div className="w-full max-w-[1400px] px-6 py-6">
      {breadcrumb && (
        <div className="text-r-xs font-medium text-lynx-sky mb-1 flex items-center gap-1.5">
          🏠 <span className="text-slate-400">›</span> {breadcrumb}
        </div>
      )}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-r-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-r-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 items-center">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
```

### Step 1.2: Create shared SeasonFilterBar component

`src/components/pages/SeasonFilterBar.jsx`

Appears at the top of every inner page for admin and coach roles:

```jsx
export default function SeasonFilterBar({
  seasons, sports, teams,
  selectedSeason, selectedSport, selectedTeam,
  onSeasonChange, onSportChange, onTeamChange,
  role
}) {
  // Only render for admin and coach
  if (role !== 'admin' && role !== 'coach') return null;

  return (
    <div className="flex gap-3 items-center mb-5 flex-wrap">
      <select value={selectedSeason} onChange={e => onSeasonChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white">
        <option value="">All Seasons</option>
        {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      {sports?.length > 1 && (
        <select value={selectedSport} onChange={e => onSportChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white">
          <option value="">All Sports</option>
          {sports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {teams?.length > 1 && (
        <select value={selectedTeam} onChange={e => onTeamChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white">
          <option value="">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
    </div>
  );
}
```

For coaches: filter teams by coach_id (only their teams). For admin: show all org teams.

### Step 1.3: Create shared InnerStatRow component

`src/components/pages/InnerStatRow.jsx`

```jsx
export default function InnerStatRow({ stats }) {
  return (
    <div className={`grid grid-cols-${stats.length} gap-3.5 mb-6`}>
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-[14px] border border-slate-200 px-5 py-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2.5">
            {stat.icon && <span className="text-lg">{stat.icon}</span>}
            <div>
              <div className={`text-r-3xl font-extrabold tracking-tight ${stat.color || 'text-slate-900'}`}>
                {stat.value}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {stat.label}
              </div>
              {stat.sub && <div className="text-r-xs text-slate-500 mt-1">{stat.sub}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Step 1.4: Create EventCard component with brand treatment

`src/components/pages/EventCard.jsx`

This is the redesigned event card used across Schedule, RSVP, and dashboards. NOT a thin left-border strip — a proper branded card:

```jsx
/**
 * Event card with full brand treatment.
 * 
 * Game cards: amber background tint, amber accent, bold opponent name
 * Practice cards: teal/green background tint, green accent
 * Tournament cards: purple background tint, purple accent
 * 
 * NOT just a thin left border — the entire card has a subtle background color
 * that makes the event type immediately obvious at a glance.
 */
export default function EventCard({
  event, onClick, selected, expandable, expanded, children
}) {
  const typeStyles = {
    game: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      selectedBorder: 'border-amber-400 shadow-amber-100',
      accent: 'bg-amber-500',
      chip: 'bg-amber-100 text-amber-700',
      icon: '🏐',
    },
    practice: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      selectedBorder: 'border-emerald-400 shadow-emerald-100',
      accent: 'bg-emerald-500',
      chip: 'bg-emerald-100 text-emerald-700',
      icon: '⚡',
    },
    tournament: {
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      selectedBorder: 'border-purple-400 shadow-purple-100',
      accent: 'bg-purple-500',
      chip: 'bg-purple-100 text-purple-700',
      icon: '🏆',
    },
  };

  const type = event.event_type?.toLowerCase() || 'practice';
  const style = typeStyles[type] || typeStyles.practice;

  return (
    <div className={`rounded-[14px] border overflow-hidden mb-3 transition-all cursor-pointer
      ${style.bg} ${selected ? style.selectedBorder + ' shadow-md' : style.border}
      hover:shadow-md`}
      onClick={onClick}
    >
      {/* Top accent bar — 3px colored bar across the top, not just left side */}
      <div className={`h-[3px] ${style.accent}`} />

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Type icon circle */}
          <div className={`w-10 h-10 rounded-xl ${style.chip} flex items-center justify-center text-lg flex-shrink-0`}>
            {style.icon}
          </div>
          <div>
            {/* Chips row */}
            <div className="flex gap-2 items-center mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.chip}`}>
                {type}
              </span>
              {event.team_name && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
                  {event.team_name}
                </span>
              )}
              {event.needs_volunteers && (
                <span className="text-[10px] font-bold text-red-500">⚠️ Needs Volunteers</span>
              )}
            </div>
            {/* Event name */}
            <div className="text-r-lg font-bold text-slate-900">{event.title || event.name}</div>
            {/* Meta */}
            <div className="text-r-sm text-slate-500 mt-0.5">
              {event.date_display} · {event.time_display} · {event.venue}
            </div>
          </div>
        </div>

        {/* Right side — RSVP counts or actions */}
        <div className="flex items-center gap-3">
          {event.rsvp_counts && (
            <div className="flex gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-r-xs font-bold bg-emerald-100 text-emerald-700">
                {event.rsvp_counts.going} ✓
              </span>
              <span className="px-2.5 py-1 rounded-lg text-r-xs font-bold bg-red-100 text-red-700">
                {event.rsvp_counts.no} ✕
              </span>
              <span className="px-2.5 py-1 rounded-lg text-r-xs font-bold bg-slate-100 text-slate-500">
                {event.rsvp_counts.maybe} ?
              </span>
            </div>
          )}
          {expandable && (
            <span className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
          )}
        </div>
      </div>

      {/* Expandable detail section (dropdown) */}
      {expanded && children && (
        <div className="border-t border-slate-200/50 bg-white px-5 py-4 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  );
}
```

Add slideDown animation to CSS:
```css
@keyframes slideDown {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 600px; }
}
.animate-slideDown {
  animation: slideDown 0.25s ease-out;
}
```

### Step 1.5: Register shared components, verify imports.

**Commit:** `git add -A && git commit -m "phase 1: shared inner page components — PageShell, SeasonFilter, InnerStatRow, EventCard"`

---

## PHASE 2: Schedule Page Redesign

### Step 2.1: Read current schedule page

```bash
cat src/pages/schedule/SchedulePage.jsx
wc -l src/pages/schedule/SchedulePage.jsx
# Also find any sub-components
find src/pages/schedule -name "*.jsx" | sort
```

### Step 2.2: Redesign schedule page

The schedule page uses `PageShell` and `SeasonFilterBar`. Three view modes: Week (default), Month, List.

**Top section (all views):**
1. `PageShell` with breadcrumb, title "Schedule", subtitle "{season} · {count} events"
2. `SeasonFilterBar` for admin/coach
3. `InnerStatRow` with 4 stats: Season Record, Next Event (TODAY or date), This Month (count + breakdown), Upcoming (remaining games)
4. **Upcoming Games Strip** — horizontal scrollable row of upcoming game cards (not practices). Each card: TODAY/date badge, opponent, time, location, share button. Cards use the amber game styling.

**Filter bar:**
- Team filter + Type filter (All Types, Games, Practices, Tournaments)
- Color legend: Practice (green dot), Game (amber dot), Tournament (purple dot)
- View toggle: List | Week | Month

**Calendar strip:**
- Horizontal strip showing 7 days of current week
- Current day highlighted in sky blue
- Dots under days that have events (color-coded)
- Clicking a day filters the view to that day's events

**Week View (default):**
- 7-column grid: Sunday to Saturday (horizontal, left to right)
- Each column: day header (name + number), event pills below
- Event pills use the FULL brand treatment — background tinted by type (amber/green/purple), NOT just a thin left border. The entire pill has the type's background color.
- **Hover popup:** hovering an event pill shows a popup with full details — event info, RSVP summary (Going/No/Maybe), team, venue, and "Open Event" button. This solves the "too small to see" problem.
- TODAY column highlighted with sky background tint
- Empty days show "No events" in muted text
- If a day has 4+ events: show first 3 + "+N more" overflow link

**Month View:**
- Standard calendar grid
- Event cells use branded mini-pills (type color background, not just left border)
- "+1 more" overflow for busy days
- Hover on a day with multiple events shows a popup listing all events for that day
- TODAY cell highlighted

**List View:**
- Chronological event list grouped by date
- Uses `EventCard` component (expandable)
- TODAY section highlighted at top with sky accent bar
- Game events show RSVP counts + "⚡ Game Day" coral button
- Practice events simpler
- Clicking an event card expands it inline (dropdown) showing RSVP detail, not a side panel

### Step 2.3: Role-specific behavior

- **Admin:** sees all teams' events, has "Add Events" button, team filter shows all org teams
- **Coach:** sees only their team's events, has "Add Events" for their team, filter shows only their teams
- **Parent:** no Add Events, RSVP Yes/No buttons on each event, child switcher if multi-child
- All roles: same visual treatment, different data and controls

### Step 2.4: Split if needed

If the schedule page exceeds 500 lines, split into:
- `SchedulePage.jsx` — orchestrator with filters and data
- `ScheduleWeekView.jsx`
- `ScheduleMonthView.jsx`
- `ScheduleListView.jsx`
- `UpcomingGamesStrip.jsx`
- `EventHoverPopup.jsx`

### Step 2.5: Verify all three views work, role-based controls, season filter.

**Commit:** `git add -A && git commit -m "phase 2: schedule page — week/month/list views, branded event cards, hover popups"`

---

## PHASE 3: RSVP & Attendance Page Redesign

### Step 3.1: Read current RSVP/attendance page

```bash
find src/pages -name "*ttendance*" -o -name "*RSVP*" -o -name "*rsvp*" | head -10
cat [found file]
```

### Step 3.2: Redesign with inline dropdown pattern

**Layout:** Single column event list. Clicking an event EXPANDS the detail section inline (slides down below the card). Other events push down. No side panel.

**Page structure:**
1. `PageShell` with "Attendance & RSVP"
2. `SeasonFilterBar`
3. `InnerStatRow` — Total Events, Games, Practices, Need Volunteers
4. Team filter + time filter (Upcoming/Past/All)
5. Event list using `EventCard` with `expandable={true}`

**When an event is clicked and expanded:**
- The card expands downward (slide animation)
- Expanded section shows:
  - RSVP summary grid (Going/Can't Go/Maybe/Pending) with colored boxes
  - Player roster list with RSVP buttons per player (✓/✕/?)
  - Volunteers section (if game) — roles needed + "Need Volunteer →" CTA
  - "Send RSVP Reminders" navy button at bottom
  - "Collapse ▲" button to close
- Other events slide down smoothly
- Only one event can be expanded at a time (clicking another collapses the current one)

**RSVP buttons per player:**
- Three small buttons: ✓ (green when active), ✕ (red when active), ? (amber when active)
- Clicking toggles the RSVP status and saves to Supabase
- Admin/coach can set RSVPs for players. Parent can only set for their own children.

### Step 3.3: Verify — click event, detail expands inline, RSVP buttons work, collapse works.

**Commit:** `git add -A && git commit -m "phase 3: RSVP page — inline dropdown detail, branded event cards, per-player RSVP"`

---

## PHASE 4: Jersey Management Page Redesign

### Step 4.1: Read current jersey page

```bash
find src/pages -name "*Jersey*" -o -name "*jersey*" | head -10
cat [found file]
```

### Step 4.2: Redesign with compact 3-column cards

**Page structure:**
1. `PageShell` with "Jersey Management"
2. `SeasonFilterBar`
3. Team filter pills
4. `InnerStatRow` — Total Rostered, Needs Jersey (red), Ready to Order (amber), Ordered (green)
5. Status tabs: Needs Jersey | Ready to Order | Ordered
6. Two-column layout: 3-col card grid (left ~70%) + sticky detail panel (right ~30%)

**Jersey cards (compact, 3 per row):**
- All cards are the SAME SIZE regardless of warnings
- Cards with missing info: red-tinted background `bg-red-50` + small red badge on the jersey number
- Cards with everything complete: normal white background + green "✓ Ready" tag
- Each card: jersey number badge (colored circle) + name + team + size + status tags + edit button
- **"Ask Parent" is a small icon button** (📩) on the card, NOT an inline expanding message. Clicking it opens a quick-send modal: pre-filled message "Hi [Parent], we need [Child]'s jersey size to place the order. Please update it in the app." with a Send button.

**Detail panel (right side, sticky):**
- When no card is selected: shows "Select a player to view details" with jersey icon
- When a card is clicked: shows full detail — jersey number (editable), size (dropdown), order status, player info, parent contact, edit/save buttons
- The detail panel is OPTIONAL — it's useful for admin managing 100+ players but can be hidden on smaller screens

**"Ask Parent" quick-send modal:**
- Small modal overlay
- Pre-filled message based on what's missing (size, number, both)
- Send button sends a notification/message to the parent via existing chat or notification infrastructure
- Confirmation: "Message sent to [Parent Name]"

### Step 4.3: Verify — compact cards, red tint for warnings, ask parent modal, detail panel.

**Commit:** `git add -A && git commit -m "phase 4: jersey management — compact 3-col cards, ask parent modal, detail panel"`

---

## PHASE 5: Teams & Roster Page Polish

### Step 5.1: Read current teams page

```bash
cat src/pages/teams/TeamsPage.jsx
find src/pages/teams -name "*.jsx" | sort
```

### Step 5.2: Apply brand treatment

The teams page was already redesigned in CC-PAGES-REDESIGN but needs the updated brand treatment:

- Event cards on the page use `EventCard` component
- Team cards use brand colors for sport indicators (not just text pills — use tinted backgrounds)
- Health bars: use Lynx brand gradient (sky-to-green for healthy, amber-to-red for critical)
- Status chips: use the consistent chip styles from the shared components
- Unrostered alert: amber tinted background (not just a left border)
- Add `SeasonFilterBar` at top
- Wrap in `PageShell`

### Step 5.3: Verify styling consistency with other pages.

**Commit:** `git add -A && git commit -m "phase 5: teams page — brand treatment, consistent event cards, season filter"`

---

## PHASE 6: Payments Page Polish

### Step 6.1: Read current payments page

```bash
cat src/pages/payments/PaymentsPage.jsx
find src/pages/payments -name "*.jsx" | sort
```

### Step 6.2: Apply brand treatment

- Wrap in `PageShell` with `SeasonFilterBar`
- Family cards: the expand-inline pattern (click family → detail drops down)
- Payment status uses branded chips (Paid=green tint, Partial=amber tint, Overdue=red tint)
- The bar graph from the dashboard's financial card can be replicated here as a page-level summary
- Category breakdown visible at page level
- "Send Reminders" navy button, "Record Payment" sky button

### Step 6.3: Verify admin vs parent view — parent sees only their family.

**Commit:** `git add -A && git commit -m "phase 6: payments page — brand treatment, inline expand, season filter"`

---

## PHASE 7: Registrations Page Polish

### Step 7.1: Read and apply brand treatment

- Wrap in `PageShell` with `SeasonFilterBar`
- Pending registrations: amber tinted row background (full row, not just chip)
- Approve/Deny buttons: green/red with proper brand styling
- Player rows: avatar + name + position badge + status chips using consistent styles
- Waiver/Payment/Status columns all use branded chips

**Commit:** `git add -A && git commit -m "phase 7: registrations page — brand treatment, amber pending rows, season filter"`

---

## PHASE 8: Game Day Command Center Polish

### Step 8.1: Read current game day page

```bash
cat src/pages/gameprep/GameDayCommandCenter.jsx
find src/pages/gameprep -name "*.jsx" | sort
```

### Step 8.2: Verify dark theme treatment

Game Day should already be dark themed from CC-PAGES-REDESIGN. Verify:
- Dark navy background on hero and lineup panel
- Light text throughout
- Score panel uses branded colors
- Attendance panel uses RSVP button pattern (✓/✕/?)
- All text readable on dark background (no dark-on-dark)

Apply `SeasonFilterBar` only if the coach manages multiple teams — otherwise not needed on game day.

**Commit:** `git add -A && git commit -m "phase 8: game day command center — dark theme verified, brand polish"`

---

## PHASE 9: Parity Check

```bash
npx tsc --noEmit
npm run build
```

Walk every inner page as each role:

**Schedule:** Week/Month/List views, hover popups, role-based controls, season filter
**RSVP:** Inline dropdown expand, RSVP buttons, role-based permissions
**Jerseys:** 3-col compact cards, red tint warnings, ask parent modal, detail panel
**Teams:** Brand treatment, health bars, season filter
**Payments:** Brand treatment, inline expand, admin vs parent views
**Registrations:** Brand treatment, amber pending rows, approve/deny
**Game Day:** Dark theme, all panels functional

Check for:
- No light-on-light text
- No "lynxsports.com" references (should be "thelynxapp.com")
- Event cards consistently branded across all pages
- Season filter present on every page for admin/coach
- No console errors

**Commit:** `git add -A && git commit -m "phase 9: inner pages parity check — all pages, all roles verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + domain fix | Backup files, fix lynxsports→thelynxapp |
| 1 | Shared components | PageShell, SeasonFilter, InnerStatRow, EventCard |
| 2 | Schedule page | Week/Month/List, branded events, hover popups, calendar strip |
| 3 | RSVP page | Inline dropdown expand (not side panel), per-player RSVP |
| 4 | Jersey page | Compact 3-col cards, red tint warnings, ask parent modal |
| 5 | Teams page | Brand treatment polish |
| 6 | Payments page | Brand treatment, inline expand |
| 7 | Registrations page | Brand treatment, amber pending rows |
| 8 | Game Day | Dark theme verification |
| 9 | Parity check | All pages, all roles |

**Total phases:** 10 (0–9)

---

## NOTES FOR CC

- **EventCard is the star of this spec.** It's used on Schedule, RSVP, and dashboard widgets. It must look premium — background tinted by event type (amber for games, green for practices, purple for tournaments), NOT just a thin left border. The entire card should have the type's color as a subtle background.
- **RSVP uses INLINE EXPAND, not a side panel.** Click event → detail slides down below the card → other events push down. Only one expanded at a time. This matches the payments page pattern.
- **Jersey cards are ALL the same size.** Warning states use background color tint (bg-red-50), not expanded height. "Ask Parent" is a small button that opens a modal.
- **Season filter appears on EVERY inner page** for admin and coach. Use the shared `SeasonFilterBar` component. For coaches, filter by their teams only.
- **Read the brand book before writing visual code.** The brand colors, typography, and card styles should match the brand system, not generic Bootstrap/Tailwind patterns.
- **No yellow/gold text on light backgrounds.** Carlos specifically called this out. Amber text on amber-tinted backgrounds is fine. Gold text on white backgrounds is NOT.
- **Button color variety:** Not everything is sky blue. Use navy for primary actions, sky for secondary, coral for urgent/game-day, green for positive confirmations. Make the pages feel designed, not template-generated.
