# CC-WAVE2-VISUAL-POLISH.md
# Wave 2: Inner Pages Visual Polish — Premium Lynx Treatment

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `LYNX-UX-PHILOSOPHY.md`
4. `src/styles/v2-tokens.css` (the design system source of truth)
5. `src/components/v2/` (reference for how V2 dashboards look)
6. `src/components/pages/PageShell.jsx` (current shared page wrapper)
7. `src/components/pages/InnerStatRow.jsx` (current stat cards)
8. `src/components/pages/SeasonFilterBar.jsx` (current filter bar)

## SCOPE
Upgrade the visual quality of all inner pages (the 35+ pages that use PageShell) to match the premium feel of the V2 dashboards. This is a DESIGN pass, not a feature pass. No new features. No new data queries. No new routes. Only visual and layout improvements.

Two tiers:
- **Tier 1 (Foundation):** Upgrade shared components so every page benefits immediately
- **Tier 2 (Targeted):** Individual page redesigns for the 8 highest-traffic pages

## DESIGN PRINCIPLES (from LYNX-UX-PHILOSOPHY.md)
- Clarity without chaos
- Progressive disclosure (content earns its place)
- Every element should feel intentional, not template-generated
- Cards should feel substantial (subtle shadow, generous padding, rounded-[14px])
- Typography hierarchy: big bold numbers, smaller uppercase labels, muted detail text
- Color: navy (#10284C) for primary text, sky (#4BB9EC) for interactive, semantic colors for status
- The V2 token system (v2-tokens.css) is the source of truth for ALL visual decisions

---
---

# TIER 1: SHARED COMPONENT UPGRADES

These changes affect ALL 35+ pages that use these components.

---

## PHASE 1.1 — Upgrade PageShell.jsx

**File:** `src/components/pages/PageShell.jsx` (19 lines currently)
**Edit contract:** Restyle only. Do not change prop interface. Do not add new props unless necessary for theming.

### Current:
Plain wrapper with basic breadcrumb, h1 title, subtitle, and actions slot.

### Target:
Match the V2 dashboard feel. Better typography, proper spacing, subtle visual hierarchy, theme-aware.

```jsx
import { useTheme } from '../../contexts/ThemeContext'

export default function PageShell({ breadcrumb, title, subtitle, actions, children, className = '' }) {
  const { isDark } = useTheme()
  
  return (
    <div className={`w-full px-8 py-6 ${className}`} style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${
          isDark ? 'text-lynx-sky/70' : 'text-lynx-sky'
        }`}>
          <span>🏠</span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>›</span>
          {breadcrumb}
        </div>
      )}
      
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-[#10284C]'
          }`} style={{ letterSpacing: '-0.03em' }}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 items-center shrink-0">{actions}</div>
        )}
      </div>
      
      {children}
    </div>
  )
}
```

Key changes: V2 font, tighter letter-spacing on title, dark mode support, slightly more horizontal padding (px-8 vs px-6), navy text color instead of generic slate-900.

### Verification:
```bash
npm run build
```
Spot check 3 pages (Coaches, Payments, Schedule) to confirm header looks correct in light mode.

### Commit:
```bash
git add src/components/pages/PageShell.jsx
git commit -m "Phase 1.1: upgrade PageShell to V2 typography and theme-awareness"
```

---

## PHASE 1.2 — Upgrade InnerStatRow.jsx

**File:** `src/components/pages/InnerStatRow.jsx`
**Edit contract:** Restyle only. Keep the same prop interface ({ stats }). Each stat has { icon, value, label, color, sub }.

### Current:
Plain white cards with basic border. Functional but generic.

### Target:
Stat cards that feel like the V2 dashboard KPI cells. Subtle gradient or accent on the left, bolder typography, better icon treatment, hover elevation, theme-aware.

```jsx
import { useTheme } from '../../contexts/ThemeContext'

export default function InnerStatRow({ stats }) {
  const { isDark } = useTheme()
  
  return (
    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`rounded-[14px] px-5 py-4 transition-all duration-200 ${
            isDark
              ? 'bg-[#132240] border border-white/[0.06] hover:border-white/[0.12]'
              : 'bg-white border border-[#E8ECF2] hover:shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]'
          }`}
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          <div className="flex items-center gap-3">
            {stat.icon && (
              <span className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-white/[0.06]' : 'bg-[#F5F6F8]'
              }`}>
                {stat.icon}
              </span>
            )}
            <div>
              <div className={`text-2xl font-extrabold tracking-tight ${stat.color || (isDark ? 'text-white' : 'text-[#10284C]')}`}
                style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div className={`text-[10.5px] font-bold uppercase tracking-[0.08em] mt-1 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {stat.label}
              </div>
              {stat.sub && (
                <div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.sub}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

Key changes: V2 font, rounded-[14px], icon gets a subtle background container, extrabold numbers with tighter tracking, uppercase tracking on labels, dark mode support, hover shadow elevation.

### Verification:
```bash
npm run build
```
Spot check Coaches page and Payments page stat rows.

### Commit:
```bash
git add src/components/pages/InnerStatRow.jsx
git commit -m "Phase 1.2: upgrade InnerStatRow to V2 card styling with dark mode"
```

---

## PHASE 1.3 — Upgrade SeasonFilterBar.jsx

**File:** `src/components/pages/SeasonFilterBar.jsx`
**Edit contract:** Restyle only. Keep all functional logic (season selection, sport selection, All Seasons for admin). Only change visual styling.

### Target:
Sleeker dropdowns that match V2 aesthetic. Pill-shaped selectors instead of browser-default `<select>`. Subtle background, proper font.

Update the `<select>` elements to use V2 styling:
```jsx
className={`appearance-none rounded-lg px-4 pr-8 py-2 text-sm font-semibold cursor-pointer transition-all ${
  isDark
    ? 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1]'
    : 'bg-white border border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'
}`}
style={{ fontFamily: 'var(--v2-font)' }}
```

Add the custom chevron icon overlay for the selects (same pattern used in the dashboard filter bar).

### Commit:
```bash
git add src/components/pages/SeasonFilterBar.jsx
git commit -m "Phase 1.3: upgrade SeasonFilterBar to V2 select styling"
```

---

## PHASE 1.4 — Create V2InnerCard Shared Component

**File:** `src/components/pages/V2InnerCard.jsx` (NEW)
**Purpose:** A reusable card wrapper for content sections on inner pages. Used to wrap tables, lists, form sections, and content blocks.

```jsx
import { useTheme } from '../../contexts/ThemeContext'

export default function V2InnerCard({ children, className = '', padding = true, onClick }) {
  const { isDark } = useTheme()
  
  return (
    <div
      onClick={onClick}
      className={`rounded-[14px] overflow-hidden transition-all duration-200 ${
        isDark
          ? 'bg-[#132240] border border-white/[0.06]'
          : 'bg-white border border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04),0_4px_12px_rgba(16,40,76,0.03)]'
      } ${onClick ? 'cursor-pointer hover:shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]' : ''} ${className}`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
      {padding ? <div className="p-5">{children}</div> : children}
    </div>
  )
}
```

This is the building block for Tier 2 page redesigns. Consistent card styling everywhere.

### Commit:
```bash
git add src/components/pages/V2InnerCard.jsx
git commit -m "Phase 1.4: create V2InnerCard shared card component"
```

---

## PHASE 1.5 — Create V2ActionButton Shared Component

**File:** `src/components/pages/V2ActionButton.jsx` (NEW)
**Purpose:** Consistent button styling for page action buttons (Export, Add, Create, etc.)

```jsx
export default function V2ActionButton({ label, icon: Icon, onClick, variant = 'secondary', size = 'md', className = '' }) {
  const variants = {
    primary: 'bg-[#10284C] text-white hover:bg-[#1a3a6b] shadow-sm',
    sky: 'bg-[#4BB9EC] text-white hover:brightness-110 shadow-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    secondary: 'bg-white text-[#10284C] border border-[#E8ECF2] hover:border-[#4BB9EC]/30 hover:shadow-sm',
    ghost: 'text-[#64748B] hover:text-[#10284C] hover:bg-[#F5F6F8]',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  }
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center font-semibold transition-all duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
      {label}
    </button>
  )
}
```

### Commit:
```bash
git add src/components/pages/V2ActionButton.jsx
git commit -m "Phase 1.5: create V2ActionButton shared button component"
```

---
---

# TIER 2: TARGETED PAGE REDESIGNS

Now apply the upgraded foundation + new components to the 8 highest-traffic pages. These are VISUAL redesigns within each page file. No new features. No new queries. Data loading stays identical.

**Order:** Schedule → Registrations → Payments → Teams → Coaches → Jerseys → Player Card → Chats

For each page, the approach is:
1. Import V2InnerCard and V2ActionButton
2. Wrap content sections in V2InnerCard instead of raw divs
3. Replace inline button styling with V2ActionButton
4. Improve data table styling (header row, row hover, alignment)
5. Add dark mode support where missing
6. Improve empty states
7. Verify nothing breaks

---

## PHASE 2.1 — Schedule Page Polish

**File:** `src/pages/schedule/SchedulePage.jsx`
**Edit contract:** Visual changes only. Do not change data loading, event creation, or calendar logic. Only restyle the page layout, stat cards, filter bar, calendar views, and event cards.

### Changes:
1. Replace action buttons (Share & Export, Add Events) with V2ActionButton
2. Wrap the stat row area in proper V2InnerCard cards
3. Style the "Upcoming Games" section with V2InnerCard
4. Improve the calendar view toggle buttons (List/Month/Week/Day) to match V2 pill-toggle style
5. Style event cards in list view: left colored border (green=practice, amber=game, purple=tourney), proper typography, V2 card treatment
6. Calendar month view: clean grid lines, colored event dots, hover preview
7. The filter bar (All Teams, All Types) should use the same V2 select styling

### Specific styling targets:
- Event cards: rounded-[14px], left-3 colored border, white bg, navy title text, muted time/location, type badge pill
- Calendar view toggles: rounded-full pills, active=navy bg white text, inactive=ghost
- Month grid: subtle grid lines, event names truncated with hover expansion
- Stat cards at top: use the upgraded InnerStatRow

### Commit:
```bash
git add src/pages/schedule/SchedulePage.jsx src/pages/schedule/CalendarViews.jsx
git commit -m "Phase 2.1: Schedule page V2 visual polish"
```

---

## PHASE 2.2 — Registrations Page Polish

**File:** `src/pages/registrations/RegistrationsPage.jsx` + related sub-files
**Edit contract:** Visual only. Keep all approval/deny logic, bulk actions, CSV export.

### Changes:
1. Stat cards: use upgraded InnerStatRow (already using it, will auto-upgrade from Phase 1.2)
2. Tab bar (All/Pending/Approved/Rostered/Waitlist/Denied): style as V2 pill tabs with counts
3. Data table: V2InnerCard wrapper, better header row (uppercase tracking, muted color), row hover, alternating subtle backgrounds
4. Player rows: avatar circle with initials, player name bold + age/grade muted, parent name, contact info, waiver status badge, registration status badge, action menu
5. Status badges: rounded-full pills with semantic colors (green=Rostered, amber=Pending, red=Denied, blue=Approved, purple=Waitlisted)
6. Bulk action bar: sticky bottom bar when checkboxes selected, navy bg, white text, action buttons
7. Action buttons: V2ActionButton (Table/Analytics toggle, Export CSV, Approve All)

### Commit:
```bash
git add src/pages/registrations/RegistrationsPage.jsx src/pages/registrations/RegistrationsTable.jsx src/pages/registrations/RegistrationsStatRow.jsx
git commit -m "Phase 2.2: Registrations page V2 visual polish"
```

---

## PHASE 2.3 — Payments Page Polish

**File:** `src/pages/payments/PaymentsPage.jsx` + sub-files
**Edit contract:** Visual only.

### Changes:
1. Stat cards already look decent (screenshot 4) but upgrade to V2InnerCard treatment
2. Filter tabs (All/Unpaid/Paid) + view toggle (Individual/Family): V2 pill style
3. Payment rows: V2InnerCard wrapper, better expansion animation, collected/total with progress indication
4. Overdue highlight: subtle red-tinted left border on overdue families
5. Action buttons: V2ActionButton (Blast Overdue=danger variant, Backfill Fees, Export, Add Fee=primary)
6. Search bar: V2 styled input with icon

### Commit:
```bash
git add src/pages/payments/PaymentsPage.jsx src/pages/payments/PaymentCards.jsx src/pages/payments/PaymentsStatRow.jsx
git commit -m "Phase 2.3: Payments page V2 visual polish"
```

---

## PHASE 2.4 — Teams Page Polish

**File:** `src/pages/teams/TeamsPage.jsx` + sub-files
**Edit contract:** Visual only.

### Changes:
1. Team table: V2InnerCard rows, team color dot, roster fill bar (colored by health %), health percentage with color coding (green >80%, amber 50-80%, red <50%)
2. Stat cards: upgraded via InnerStatRow
3. Unrostered player alert banner: V2 attention strip styling
4. Action buttons: V2ActionButton (Export, New Team=primary)
5. Search + filter bar: V2 styling
6. "View" wall links: styled as subtle text buttons

### Commit:
```bash
git add src/pages/teams/TeamsPage.jsx src/pages/teams/TeamsTableView.jsx src/pages/teams/TeamsStatRow.jsx
git commit -m "Phase 2.4: Teams page V2 visual polish"
```

---

## PHASE 2.5 — Coaches Page Polish

**File:** `src/pages/coaches/CoachesPage.jsx`
**Edit contract:** Visual only.

### Changes:
1. Coach cards: V2InnerCard, avatar with colored ring, name bold, email/phone muted, team assignment pills, compliance badges
2. Compliance stat cards (BG Checks, Waivers, Conduct): upgraded via InnerStatRow, with progress bar treatment (0/9 with red bar)
3. Action buttons: V2ActionButton (Export, Email All, Invite, Add Coach=primary)
4. Search + status filter: V2 styling
5. "Assign to team" link: styled as sky-colored text button

### Commit:
```bash
git add src/pages/coaches/CoachesPage.jsx
git commit -m "Phase 2.5: Coaches page V2 visual polish"
```

---

## PHASE 2.6 — Jerseys Page Polish

**File:** `src/pages/jerseys/JerseysPage.jsx`
**Edit contract:** Visual only.

### Changes:
1. Team selector pills: V2 rounded pills with team color dots, active state with ring
2. Stat cards: V2 treatment
3. Tab bar (Needs Jersey / Ready to Order / Ordered): V2 tab styling with count badges
4. Player jersey cards: V2InnerCard, avatar, team badge, size info, preference pills, assign button
5. Alert banner (unrostered players): V2 attention strip
6. Auto-assign button: V2ActionButton with sparkle icon
7. Action buttons: V2ActionButton (History, Full League Report, Auto-Assign=sky)

### Commit:
```bash
git add src/pages/jerseys/JerseysPage.jsx
git commit -m "Phase 2.6: Jerseys page V2 visual polish"
```

---

## PHASE 2.7 — Player Card Page Polish

**File:** `src/pages/parent/ParentPlayerCardPage.jsx` + related tab files
**Edit contract:** Visual only.

### Changes:
1. Hero section: the player photo + name + position + jersey + OVR rating area needs the premium sports-card treatment. Dark navy gradient background behind the hero, big bold name, OVR in a circle with color coding (green 80+, amber 50-80, red <50)
2. Stat bar (KILLS/G, DIGS/G, etc.): V2 styled with subtle dividers
3. Tab bar (Overview/Stats/Development/Badges/Games): V2 tab styling
4. Power Levels radar chart: keep as-is but wrap in V2InnerCard
5. Skill bars (Serve, Pass, Attack, etc.): V2 progress bars with sky color
6. Badge display: V2InnerCard wrapper, badge images in a clean grid
7. Season progress: V2 styled

### Commit:
```bash
git add src/pages/parent/ParentPlayerCardPage.jsx src/pages/parent/ParentPlayerTabs.jsx src/pages/parent/ParentPlayerHero.jsx
git commit -m "Phase 2.7: Player Card page V2 visual polish"
```

---

## PHASE 2.8 — Chats Page Polish

**File:** `src/pages/chats/ChatsPage.jsx` + sub-files
**Edit contract:** Visual only. Do not change messaging logic.

### Changes:
1. Conversation list sidebar: V2InnerCard wrapper, cleaner avatar + name + preview layout, unread dot, timestamp alignment
2. Filter tabs (All/Teams/DMs): V2 pill style
3. Chat header: cleaner team name + description, settings menu
4. Message bubbles: keep current layout but refine bubble radius, timestamp styling, sender name treatment
5. Input bar: V2 styled text input with icon buttons
6. Search bar in sidebar: V2 styled

### Commit:
```bash
git add src/pages/chats/ChatsPage.jsx src/pages/chats/ChatThread.jsx src/pages/chats/MessageBubble.jsx
git commit -m "Phase 2.8: Chats page V2 visual polish"
```

---
---

# FINAL PUSH

After ALL phases pass verification:
```bash
git push origin main
```

# FINAL REPORT
```
## Wave 2 Visual Polish Report
- Tier 1 phases completed: X/5
- Tier 2 phases completed: X/8
- Files modified: [list]
- New files created: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
- Visual consistency: [notes]
- Dark mode support: [notes]
- Issues discovered: [list or "none"]
```

# CRITICAL REMINDERS
- This is a VISUAL pass. Do not change data loading, Supabase queries, routing, or feature logic.
- Use V2 tokens (v2-tokens.css) for all color/spacing/shadow values.
- Every card uses rounded-[14px].
- Every text uses var(--v2-font) or inherits it from PageShell.
- Dark mode must work on every changed element.
- Test that no existing functionality breaks after each phase.
