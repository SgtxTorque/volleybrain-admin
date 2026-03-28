# CC-SCHEDULE-REDESIGN.md
# Schedule Page Redesign — The Stack (List) + The Month View + The Timeline (Week)

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css` (design system)
4. `src/pages/schedule/SchedulePage.jsx` (current — 463 lines)
5. `src/pages/schedule/CalendarViews.jsx` (current — 374 lines)
6. The Stitch mockup HTML files (attached to the repo or described below)

## SCOPE
Redesign the Schedule page's visual presentation across all 3 view modes (List, Month, Week). The data loading, event creation, filtering, and all existing functionality stays IDENTICAL. We are changing HOW events look, not WHAT they do.

**Design targets** (from Stitch mockups):
- **List view** → "The Stack" style: vertical card-stack grouped by day, bold italic date headers, rich event cards with left color border, team name + type + time + venue + RSVP count laid out horizontally
- **Month view** → "The Month View" style: editorial header with bold/light typography ("March **Schedule**"), clean calendar grid with colored event pills, stat cards with watermark icons
- **Week view** → "The Timeline" style: swim-lane grid with team rows and day columns, event blocks placed in cells with type badges and RSVP counts

**What to REMOVE:** The "Upcoming Games" card section. Get rid of it entirely.
**What to KEEP:** Everything else. See the Element Preservation Contract below.

---

## ELEMENT PRESERVATION CONTRACT — READ THIS BEFORE TOUCHING ANY CODE

**Every interactive element listed below MUST survive the redesign.** They can be MOVED to a different position in the layout. They can be RESTYLED with new CSS/Tailwind classes. They CANNOT be removed, hidden, commented out, or have their onClick/onChange handlers disconnected. If an element doesn't fit the new layout, find a new home for it. Do not delete it.

### Action Buttons (currently top-right, can be repositioned):
- **Share & Export dropdown** — triggers: Season Poster modal, Game Day Card modal, iCal export, Print. The dropdown and ALL 4 sub-options must remain accessible from the UI.
- **Add Events dropdown** — triggers: Single Event modal (`setShowAddEvent`), Create Event Series (`setShowBulkWizard`), Manage Venues (`setShowVenueManager`), Availability Survey (`setShowAvailabilitySurvey`). The dropdown and ALL 4 sub-options must remain accessible.

### Filters (currently below header, can be repositioned):
- **Season filter** (from SeasonFilterBar) — season and sport dropdowns
- **Team selector** (`selectedTeam` / `setSelectedTeam`) — filter events by team or "All Teams"
- **Event type filter** — any existing type filtering for Practice/Game/Tournament
- **Type legend dots** (Practice=green, Game=amber, Tourney=purple) — can be in filter bar, footer, or inline

### View Controls:
- **View toggle** (List/Month/Week/Day) — all 4 view modes must remain selectable
- **Month navigation** (prev/next arrows via `prevMonth()`/`nextMonth()` + "Today" button via `goToToday()`)
- **Month/Year label** showing the current period

### Calendar View Interactions (in CalendarViews.jsx):
- **Event click** → calls `onSelectEvent(event)` which opens EventDetailModal (must work in ALL views)
- **Day click in MonthView** → calls `onSelectDate(date)` which switches to DayView for that date
- **onShareGame callback** in event cards → opens GameDayShareModal via `setShowGameDayCard`

### Modals (rendered at bottom of SchedulePage.jsx — DO NOT TOUCH these modal render blocks):
1. `AddEventModal` (triggered by `showAddEvent`)
2. `BulkPracticeModal` (triggered by `showBulkPractice`)
3. `BulkGamesModal` (triggered by `showBulkGames`)
4. `BulkEventWizard` (triggered by `showBulkWizard`)
5. `VenueManagerModal` (triggered by `showVenueManager`)
6. `AvailabilitySurveyModal` (triggered by `showAvailabilitySurvey`)
7. `EventDetailModal` (triggered by `selectedEvent` being non-null)
8. `SchedulePosterModal` (triggered by `showPosterModal`)
9. `GameDayShareModal` (triggered by `showGameDayCard` being non-null)
10. `GameCompletionModal` (if present)

**None of these modal renders may be removed or altered.** Their trigger state variables and the `set*` functions that open them must remain connected to clickable UI elements somewhere on the page.

### Data Functions (DO NOT MODIFY — not even formatting changes):
- `loadEvents()`, `loadTeams()`, `loadVenues()` — Supabase read queries
- `createEvent()`, `createBulkEvents()` — insert operations
- `updateEvent()` — update operation
- `deleteEvent()`, `deleteEventSeries()` — delete operations
- `saveVenues()` — venue CRUD
- `exportEventsToICal()` — iCal export function
- All event filtering/sorting logic (`filteredEvents` computation)
- All RSVP counting logic
- `prevMonth()`, `nextMonth()`, `goToToday()` — navigation functions

**If you are unsure whether an element can be removed, the answer is NO. Restyle it and reposition it.**

---

## DESIGN REFERENCE: Key Visual Elements to Replicate

### From "The Stack" (List View):
- **Date headers:** Bold, italic, uppercase, tracking-tight. Today's date = navy/white with a "TODAY" pill badge. Future dates = muted.  Example: **MONDAY, MARCH 22** with green TODAY pill
- **Event cards:** rounded-[14px], left-3 colored border (green=practice, amber=game, purple/teal=tournament/meeting), white bg in light mode. Layout: icon container (48px rounded-xl) | team name (xs uppercase sky) + event type (xs uppercase muted) on line 1, event title (xl font-extrabold) on line 2, time + venue on line 3 | RSVP count + type badge on right
- **Weekly date strip:** Horizontal row of day cells with MON/TUE/etc labels and big date numbers. Selected day has brand bg. Days with events have dots. Sticky below the page header.
- **Generous whitespace** between day groups (space-y-10 or more between day sections)

### From "The Month View":
- **Editorial header typography:** First word of month BOLD, "Schedule" in LIGHT weight. Both uppercase italic. Very large (text-5xl to text-6xl). Example: **MARCH** *Schedule*
- **Stat cards:** 4 across. Each has: tiny uppercase label, BIG italic bold number, subtle watermark icon in bottom-right corner. White card with subtle shadow.
- **Calendar grid:** Clean borders, date number prominent, event pills with colored left edge (2px rounded bar), event name truncated, today highlighted with brand border + "TODAY" badge
- **View toggle:** Pill-style buttons (Week | Month | Year) in a subtle container

### From "The Timeline" (Week View):
- **Swim-lane layout:** Team names in left column (bold uppercase), day columns across top (with day name and date number). Events placed as blocks in the grid cells.
- **Event blocks:** Colored background matching event type, type badge label at top (uppercase xs), event title/venue, RSVP count. Blocks can span multiple time slots visually.
- **Footer stats:** Total events count, legend (Practice=green, Game=amber, Conflict=red)

### Light/Dark Mode:
All views must support both. Light mode: white cards on #F5F6F8 surface. Dark mode: #132240 cards on #0B1628 surface.

---

## PHASE 1: Restructure SchedulePage.jsx Header + Remove Upcoming Games

**File:** `src/pages/schedule/SchedulePage.jsx`
**Edit contract:** Modify the header area and remove the upcoming games section. Keep all data loading, filtering, modal triggers, and navigation logic untouched.

### Changes:

**A. Editorial Header:** Replace the current `<h1>Schedule</h1>` with the bold/light typography treatment:
```jsx
<h1 className={`text-5xl font-black tracking-tighter uppercase italic ${isDark ? 'text-white' : 'text-[#10284C]'}`}
  style={{ fontFamily: 'var(--v2-font)', letterSpacing: '-0.04em', lineHeight: 1 }}>
  {new Date(currentDate).toLocaleString('en-US', { month: 'long' })}
  {' '}
  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>Schedule</span>
</h1>
```

**B. Stat cards:** Update the existing stat row to use the watermark icon treatment from the Month View mockup. Each stat card gets a large faded icon in the bottom-right corner:
```jsx
// Pattern for each stat card:
<div className={`relative overflow-hidden p-5 rounded-2xl border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}>
  <div className="relative z-10">
    <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
    <h3 className={`text-3xl font-black italic tracking-tighter ${stat.color || (isDark ? 'text-white' : 'text-[#10284C]')}`}>{stat.value}</h3>
    {stat.sub && <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.sub}</p>}
  </div>
  {stat.watermarkIcon && (
    <stat.watermarkIcon className={`absolute -right-3 -bottom-3 w-20 h-20 ${isDark ? 'text-white/[0.03]' : 'text-slate-100'}`} />
  )}
</div>
```

**C. View toggle:** Replace the current text buttons with the pill-style toggle from the Month View:
```jsx
<div className={`flex items-center p-1.5 rounded-xl border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}>
  {['list', 'month', 'week', 'day'].map(v => (
    <button key={v} onClick={() => setView(v)}
      className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
        view === v
          ? (isDark ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-[#F5F6F8] text-[#10284C] shadow-sm')
          : (isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-[#10284C]')
      }`}>
      {v.charAt(0).toUpperCase() + v.slice(1)}
    </button>
  ))}
</div>
```

**D. Remove the Upcoming Games card section entirely.** Find the section that renders upcoming game cards (the horizontal scrollable area below the stat row) and delete it. The space it occupied should be reclaimed by the calendar content below.

### Commit:
```bash
git add src/pages/schedule/SchedulePage.jsx
git commit -m "Phase 1: Schedule editorial header, stat cards with watermarks, pill view toggle, remove upcoming games"
```

---

## PHASE 2: Redesign ListView — "The Stack"

**File:** `src/pages/schedule/CalendarViews.jsx` (the ListView component)
**Edit contract:** Completely restyle the ListView rendering. Keep the same data input (events array, filters). Change the visual output.

### The Stack Layout:

**A. Group events by day.** The current ListView may already do this. If not, group the events array by `event_date` so each day becomes a section.

**B. Day header:**
```jsx
<div className="flex items-center gap-3 mb-4">
  <h2 className={`text-2xl font-black tracking-tighter italic uppercase ${
    isToday ? (isDark ? 'text-white' : 'text-[#10284C]') : (isDark ? 'text-slate-500' : 'text-slate-400')
  }`} style={{ fontFamily: 'var(--v2-font)' }}>
    {dayLabel} {/* e.g., "MONDAY, MARCH 22" */}
  </h2>
  {isToday && (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
      isDark ? 'bg-[#FFD700] text-[#10284C]' : 'bg-[#22C55E] text-white'
    }`}>Today</span>
  )}
</div>
```

**C. Event card (The Stack style):**
```jsx
<div className={`group relative rounded-[14px] overflow-hidden transition-all cursor-pointer ${
  isDark
    ? 'bg-[#132240] hover:bg-[#1a2d50] shadow-lg'
    : 'bg-white hover:shadow-[0_2px_8px_rgba(16,40,76,0.08)] border border-[#E8ECF2]'
}`} onClick={() => onEventClick?.(event)}>
  {/* Left color border */}
  <div className={`absolute left-0 top-0 bottom-0 w-1 ${eventColorClass}`} />
  
  <div className="p-5 pl-6 flex items-center justify-between gap-6">
    {/* Left: Icon + Info */}
    <div className="flex items-start gap-4 min-w-0">
      {/* Event type icon container */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
        isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-[#F5F6F8]'
      }`}>
        <EventIcon className="w-5 h-5" style={{ color: eventColor }} />
      </div>
      
      <div className="min-w-0">
        {/* Team + Type line */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-black tracking-widest uppercase ${isDark ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'}`}>
            {event.teams?.name || 'All Teams'}
          </span>
          <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
          <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {event.event_type}
          </span>
        </div>
        
        {/* Title */}
        <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
          {event.title || event.event_type}
        </h3>
        
        {/* Time + Venue */}
        <div className={`flex items-center gap-4 mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatTime12(event.event_time)}{event.end_time ? ` — ${formatTime12(event.end_time)}` : ''}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
    
    {/* Right: RSVP + Type badge */}
    <div className="flex items-center gap-5 shrink-0">
      {event.rsvpCount !== undefined && (
        <div className="text-right">
          <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>RSVP</div>
          <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {event.rsvpCount || 0}/{event.rsvpTotal || '—'}
          </div>
        </div>
      )}
      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${typeColorClass}`}>
        {event.event_type}
      </span>
    </div>
  </div>
</div>
```

**D. Event type colors:**
```javascript
const EVENT_COLORS = {
  practice: { border: 'bg-[#4BB9EC]', badge: 'bg-[#4BB9EC]/10 text-[#4BB9EC]', icon: '#4BB9EC' },
  game: { border: 'bg-[#F59E0B]', badge: 'bg-[#F59E0B]/10 text-[#F59E0B]', icon: '#F59E0B' },
  tournament: { border: 'bg-[#8B5CF6]', badge: 'bg-[#8B5CF6]/10 text-[#8B5CF6]', icon: '#8B5CF6' },
  meeting: { border: 'bg-[#22C55E]', badge: 'bg-[#22C55E]/10 text-[#22C55E]', icon: '#22C55E' },
  other: { border: 'bg-slate-400', badge: 'bg-slate-400/10 text-slate-400', icon: '#94A3B8' },
}
```

**E. Day group spacing:** `space-y-12` between day groups for generous breathing room.

**F. Add the weekly date strip** at the top of the list view (sticky, below the stat row). Shows the current week's days with day name + date number. Selected/today day highlighted. Days with events get a colored dot.

### Commit:
```bash
git add src/pages/schedule/CalendarViews.jsx
git commit -m "Phase 2: ListView redesigned as The Stack — day-grouped rich event cards"
```

---

## PHASE 3: Redesign MonthView — Editorial Calendar

**File:** `src/pages/schedule/CalendarViews.jsx` (the MonthView component)
**Edit contract:** Restyle the month calendar grid. Keep all date logic, event placement logic, and click handlers.

### Changes:

**A. Calendar grid styling:** Clean thin borders, day-of-week headers as uppercase bold text, date numbers prominent. Today's cell gets a brand-colored border and "TODAY" micro-badge.

**B. Event pills in cells:** Small rounded pills with 2px left color bar matching event type. Event name truncated. Max 3 visible per cell with "+N more" overflow.

**C. Multi-day events** (if supported) span across cells visually.

**D. Previous/next month dates** render in muted color.

**E. Legend footer:** Color-coded dots for Practice, Game, Tournament, Conflict.

### Commit:
```bash
git add src/pages/schedule/CalendarViews.jsx
git commit -m "Phase 3: MonthView redesigned with editorial calendar treatment"
```

---

## PHASE 4: Redesign WeekView — The Timeline (Swim Lanes)

**File:** `src/pages/schedule/CalendarViews.jsx` (the WeekView component)
**Edit contract:** Restyle the week view as a swim-lane grid. Keep all data logic.

### Changes:

**A. Layout:** Grid with team names in the left column and day columns (Mon-Sun) across the top. Each team gets a row. Events placed as blocks in the appropriate day column.

**B. Team row labels:** Bold uppercase team name with team color dot/bar on the left.

**C. Event blocks:** Colored background matching type, type label badge at top, event title, venue, RSVP count. Rounded corners. Click to open event detail.

**D. Day column headers:** Day name (uppercase) + date number. Today's column highlighted. Weekend columns slightly dimmed.

**E. Footer:** Total events count + event type legend.

**Note:** This is the most complex view change. If the current WeekView is a time-grid (hourly rows), converting to swim lanes is a significant layout change. If it's simpler, adapt accordingly. The key is: teams as rows, days as columns, events as placed blocks. If this requires too many lines changed, implement a simplified version that still captures the swim-lane feel.

### Commit:
```bash
git add src/pages/schedule/CalendarViews.jsx
git commit -m "Phase 4: WeekView redesigned as swim-lane timeline"
```

---

## PHASE 5: Polish DayView + Final Consistency Pass

**File:** `src/pages/schedule/CalendarViews.jsx` (the DayView component) + `SchedulePage.jsx`
**Edit contract:** Bring DayView to the same quality level. Final consistency check across all views.

### Changes:
- DayView should use the same event card style as The Stack (from Phase 2) but for a single day
- Verify all 4 views support dark mode properly
- Verify all modals still open correctly (click event card → EventDetailModal)
- Verify filters (team, type) still work across all views
- Verify month navigation (prev/next) still works

### Commit:
```bash
git add src/pages/schedule/SchedulePage.jsx src/pages/schedule/CalendarViews.jsx
git commit -m "Phase 5: DayView polish + final consistency pass across all schedule views"
```

---

## FINAL PUSH

After ALL phases pass verification:
```bash
git push origin main
```

## VERIFICATION CHECKLIST
- [ ] Build passes
- [ ] List view: events grouped by day with bold date headers and rich cards
- [ ] List view: left color borders match event type (green=practice, amber=game, purple=tournament)
- [ ] List view: clicking event opens EventDetailModal
- [ ] Month view: editorial header typography (bold month + light "Schedule")
- [ ] Month view: clean calendar grid with event pills
- [ ] Month view: today highlighted
- [ ] Week view: swim-lane layout with team rows and day columns
- [ ] Day view: consistent card styling with other views
- [ ] All views: dark mode works
- [ ] All views: season/sport filter works
- [ ] All views: search works
- [ ] Stat cards have watermark icons
- [ ] Upcoming Games section is GONE
- [ ] Add Events modal still works
- [ ] Share & Export still works
- [ ] No console errors
