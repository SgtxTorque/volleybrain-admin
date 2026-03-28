# CC-SCHEDULE-BUGS-AND-REDESIGN.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

The Schedule page has navigation bugs and oversized, washed-out event cards. This spec fixes both in phases:

1. **Phase 1** — Fix navigation: arrows move by month/week/day depending on active view. Day view initializes to today. Week strip removed from List view.
2. **Phase 2** — Compact event cards in List and Day views. Stronger colors with full background tinting (games get navy gradient).
3. **Phase 3** — Boost week and month view pill colors so they're not washed out.

**Files touched:**
- `src/pages/schedule/SchedulePage.jsx` (Phase 1)
- `src/pages/schedule/CalendarViews.jsx` (Phase 2, Phase 3)

---

## PHASE 1 — Fix Navigation (Arrows + Day View Date + Remove Week Strip from List)

### File: `src/pages/schedule/SchedulePage.jsx`

**Change 1: Replace the navigation functions.**

Find (around line 279-281):

```js
  function prevMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)) }
  function goToToday() { setCurrentDate(new Date()) }
```

Replace with:

```js
  function navigateBack() {
    if (view === 'week') {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 7)
      setCurrentDate(d)
    } else if (view === 'day') {
      const d = new Date(currentDate)
      d.setDate(d.getDate() - 1)
      setCurrentDate(d)
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }
  function navigateForward() {
    if (view === 'week') {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 7)
      setCurrentDate(d)
    } else if (view === 'day') {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + 1)
      setCurrentDate(d)
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }
  function goToToday() { setCurrentDate(new Date()) }
```

**Change 2: Update the navigation bar to use the new functions and show context-aware label.**

Find the calendar navigation bar (around lines 408-424). Replace the entire block:

```jsx
      <div className={`flex items-center justify-between rounded-[14px] p-3 border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <button onClick={prevMonth} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToToday} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Today
          </button>
        </div>
        <button onClick={nextMonth} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
```

With:

```jsx
      <div className={`flex items-center justify-between rounded-[14px] p-3 border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <button onClick={navigateBack} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {view === 'day'
              ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              : view === 'week'
                ? (() => {
                    const start = new Date(currentDate)
                    start.setDate(currentDate.getDate() - currentDate.getDay())
                    const end = new Date(start)
                    end.setDate(start.getDate() + 6)
                    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  })()
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
          </h2>
          <button onClick={goToToday} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Today
          </button>
        </div>
        <button onClick={navigateForward} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
```

**Change 3: Pass currentDate and a setCurrentDate callback to ListView so it can be context-aware.**

Find (around line 434):

```jsx
        <ListView events={filteredEvents} onSelectEvent={setSelectedEvent} teams={teams} />
```

Replace with:

```jsx
        <ListView events={filteredEvents} onSelectEvent={setSelectedEvent} teams={teams} currentDate={currentDate} />
```

### Verification

- List/Month view: arrows move by month, label shows "March 2026"
- Week view: arrows move by week, label shows "Mar 22 – Mar 28, 2026"
- Day view: arrows move by day, label shows "Tuesday, March 24, 2026"
- "Today" button works in all views
- `grep "prevMonth\|nextMonth" src/pages/schedule/SchedulePage.jsx` should return 0 hits

### Commit message
```
fix(schedule): context-aware navigation — arrows move by month/week/day based on active view
```

---

## PHASE 2 — Compact Event Cards in List + Day Views, Remove Week Strip from List

### File: `src/pages/schedule/CalendarViews.jsx`

**Change 1: Rewrite the ListView.**

Replace the entire `export function ListView` function (from its declaration to the closing `}` before the last line) with:

```jsx
export function ListView({ events, onSelectEvent, teams, currentDate }) {
  const { isDark } = useTheme()
  const sortedEvents = [...events].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const grouped = sortedEvents.reduce((acc, event) => {
    const date = new Date(event.start_time).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(event)
    return acc
  }, {})

  const today = new Date()
  today.setHours(0,0,0,0)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dayEvents]) => {
        const dateObj = new Date(date)
        const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear()
        const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()

        return (
          <div key={date}>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-base font-black tracking-tight italic uppercase ${
                isToday ? (isDark ? 'text-white' : 'text-[#10284C]') : (isDark ? 'text-slate-500' : 'text-slate-400')
              }`} style={{ fontFamily: 'var(--v2-font)' }}>
                {dayLabel}
              </h2>
              {isToday && (
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${
                  isDark ? 'bg-[#FFD700] text-[#10284C]' : 'bg-[#22C55E] text-white'
                }`}>Today</span>
              )}
              <span className={`text-xs font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
            </div>

            <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
              <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                {dayEvents.map(event => {
                  const type = event.event_type || 'other'
                  const isGame = type === 'game'
                  const isTournament = type === 'tournament'
                  const colors = EVENT_COLORS[type] || EVENT_COLORS.other

                  return (
                    <div key={event.id}
                      className={`relative px-4 py-3 flex items-center gap-4 cursor-pointer transition-all ${
                        isGame
                          ? (isDark ? 'bg-[#10284C] hover:bg-[#162d52]' : 'bg-gradient-to-r from-[#10284C] to-[#1a3a6b] text-white hover:brightness-110')
                          : isTournament
                            ? (isDark ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100')
                            : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                      }`}
                      onClick={() => onSelectEvent(event)}
                    >
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${colors.border}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                          }`}>
                            {event.teams?.name || 'All Teams'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${
                            isGame ? 'text-white/50' : (isDark ? 'text-slate-500' : 'text-slate-400')
                          }`}>
                            {type}
                          </span>
                        </div>
                        <h3 className={`text-sm font-bold tracking-tight ${
                          isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')
                        }`}>
                          {event.title || event.event_type}
                        </h3>
                        <div className={`flex items-center gap-3 mt-0.5 text-xs ${
                          isGame ? 'text-white/60' : (isDark ? 'text-slate-500' : 'text-slate-400')
                        }`}>
                          <span>{formatTime12(event.event_time)}{event.end_time ? ` — ${formatTime12(event.end_time)}` : ''}</span>
                          {(event.venue_name || event.location) && (
                            <span>📍 {event.venue_name || event.location}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0 ${
                        isGame
                          ? 'bg-white/10 text-white'
                          : colors.badge
                      }`}>
                        {type}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

**What changed:**
- Week strip REMOVED from list view entirely
- Events are compact rows inside a single container card per day (like payments)
- Day headers are smaller (`text-base` not `text-2xl`), with event count and divider line
- Event rows: no 48px icon boxes, no `p-5` padding, just `px-4 py-3` compact rows
- **Game cards get navy gradient background** (`bg-gradient-to-r from-[#10284C] to-[#1a3a6b]` with white text)
- Tournament cards get purple tint
- Practice/other stay light but cleaner
- `space-y-12` between day groups reduced to `space-y-6`
- Type badge is a compact pill on the right

**Change 2: Rewrite the DayView with the same compact treatment.**

Replace the entire `export function DayView` function with:

```jsx
export function DayView({ events, currentDate, onSelectEvent, teams }) {
  const { isDark } = useTheme()
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.start_time)
    return eventDate.getDate() === currentDate.getDate() &&
           eventDate.getMonth() === currentDate.getMonth() &&
           eventDate.getFullYear() === currentDate.getFullYear()
  }).sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''))

  return (
    <div className="space-y-4">
      {dayEvents.length === 0 ? (
        <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No events scheduled for this day</p>
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
          <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
            {dayEvents.map(event => {
              const type = event.event_type || 'other'
              const isGame = type === 'game'
              const isTournament = type === 'tournament'
              const colors = EVENT_COLORS[type] || EVENT_COLORS.other

              return (
                <div key={event.id}
                  className={`relative px-4 py-3 flex items-center gap-4 cursor-pointer transition-all ${
                    isGame
                      ? (isDark ? 'bg-[#10284C] hover:bg-[#162d52]' : 'bg-gradient-to-r from-[#10284C] to-[#1a3a6b] text-white hover:brightness-110')
                      : isTournament
                        ? (isDark ? 'bg-purple-900/20 hover:bg-purple-900/30' : 'bg-purple-50 hover:bg-purple-100')
                        : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                  }`}
                  onClick={() => onSelectEvent(event)}
                >
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${colors.border}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                      }`}>
                        {event.teams?.name || 'All Teams'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        isGame ? 'text-white/50' : (isDark ? 'text-slate-500' : 'text-slate-400')
                      }`}>
                        {type}
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold tracking-tight ${
                      isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')
                    }`}>
                      {event.title || event.event_type}
                    </h3>
                    <div className={`flex items-center gap-3 mt-0.5 text-xs ${
                      isGame ? 'text-white/60' : (isDark ? 'text-slate-500' : 'text-slate-400')
                    }`}>
                      <span>{formatTime12(event.event_time)}{event.end_time ? ` — ${formatTime12(event.end_time)}` : ''}</span>
                      {(event.venue_name || event.location) && (
                        <span>📍 {event.venue_name || event.location}</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0 ${
                    isGame
                      ? 'bg-white/10 text-white'
                      : colors.badge
                  }`}>
                    {type}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Verification

- List view: no week strip, compact rows per day, game rows are navy gradient
- Day view: same compact rows, shows correct date based on currentDate
- Day headers are smaller and have divider lines
- Event type badge on the right is compact

### Commit message
```
refactor(schedule): compact event rows, navy game cards, remove list view week strip
```

---

## PHASE 3 — Boost Week + Month View Colors

### File: `src/pages/schedule/CalendarViews.jsx`

**Change 1: Update EVENT_TYPE_STYLES to use stronger, more saturated colors.**

Find the `EVENT_TYPE_STYLES` constant (around lines 27-33):

```js
const EVENT_TYPE_STYLES = {
  game:       { bg: 'bg-amber-100/80',   text: 'text-amber-800',   dot: 'bg-amber-500',   darkBg: 'bg-amber-900/30',   darkText: 'text-amber-300' },
  practice:   { bg: 'bg-emerald-100/70',  text: 'text-emerald-800', dot: 'bg-emerald-500',  darkBg: 'bg-emerald-900/30',  darkText: 'text-emerald-300' },
  tournament: { bg: 'bg-purple-100/70',   text: 'text-purple-800',  dot: 'bg-purple-500',   darkBg: 'bg-purple-900/30',   darkText: 'text-purple-300' },
  team_event: { bg: 'bg-sky-100/70',      text: 'text-sky-800',     dot: 'bg-sky-500',      darkBg: 'bg-sky-900/30',      darkText: 'text-sky-300' },
  other:      { bg: 'bg-slate-100',       text: 'text-slate-700',   dot: 'bg-slate-400',    darkBg: 'bg-slate-700/40',    darkText: 'text-slate-300' },
}
```

Replace with:

```js
const EVENT_TYPE_STYLES = {
  game:       { bg: 'bg-[#10284C]',         text: 'text-white',        dot: 'bg-[#10284C]',    darkBg: 'bg-[#10284C]',       darkText: 'text-white' },
  practice:   { bg: 'bg-emerald-500/20',     text: 'text-emerald-800',  dot: 'bg-emerald-500',  darkBg: 'bg-emerald-500/20',  darkText: 'text-emerald-300' },
  tournament: { bg: 'bg-purple-500/20',      text: 'text-purple-800',   dot: 'bg-purple-500',   darkBg: 'bg-purple-500/20',   darkText: 'text-purple-300' },
  team_event: { bg: 'bg-sky-500/20',         text: 'text-sky-800',      dot: 'bg-sky-500',      darkBg: 'bg-sky-500/20',      darkText: 'text-sky-300' },
  other:      { bg: 'bg-slate-200',          text: 'text-slate-700',    dot: 'bg-slate-400',    darkBg: 'bg-slate-700/40',    darkText: 'text-slate-300' },
}
```

**What changed:**
- **Game pills** in month/week views are now **navy with white text** (not washed-out amber)
- **Practice** bumped from `emerald-100/70` to `emerald-500/20` (more visible green tint)
- **Tournament** bumped from `purple-100/70` to `purple-500/20` (stronger purple)
- **Team event** bumped similarly
- Dark mode variants follow the same boost

**Change 2: Update the week view cell event background colors.**

In the `WeekView` function, find the event pill rendering (around line 342):

```jsx
                          style={{ backgroundColor: `${colors.icon}15` }}
```

Replace with:

```jsx
                          style={{ backgroundColor: `${colors.icon}25` }}
```

This bumps the opacity from 15 (very faint) to 25 (visible tint).

### Verification

- Month view: game pills are navy with white text, standing out from other event types
- Week view: event cells have stronger background tinting
- Practice pills are clearly green, tournament clearly purple
- The visual hierarchy is obvious: games are the most prominent, tournaments second, practices third

### Commit message
```
refactor(schedule): boost event colors — navy game pills, stronger tints for all types
```

---

## POST-EXECUTION QA CHECKLIST

1. **List view arrows:** Move by month. Label shows "March 2026". No week strip.
2. **Month view arrows:** Move by month. Label shows "March 2026". Game pills are navy with white text.
3. **Week view arrows:** Move by week. Label shows "Mar 22 – Mar 28, 2026". Events have stronger color tints.
4. **Day view arrows:** Move by day. Label shows "Tuesday, March 24, 2026". Shows correct day's events.
5. **"Today" button:** Works in all views, jumps to current date.
6. **List view event cards:** Compact rows (no 48px icon boxes). Games are navy gradient. Tournaments are purple tint. Practices are clean/light.
7. **Day view event cards:** Same compact treatment as list view.
8. **Month view pills:** Games are navy/white, clearly distinct from other types.
9. **Week view cells:** Stronger color tinting, readable text.
10. **Click events:** Clicking any event in any view still opens the EventDetailModal.
