# CC-SCHEDULE-VISUAL-OVERHAUL.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

Three issues remaining on the Schedule page:
1. Stat cards are billboard-sized — need to be ~1/3 current height
2. Month view pills are generic gray with only a tiny left-side color bar — no team name, no event type background
3. Week view cells have faint backgrounds and tiny text — not readable or glanceable

**Design principle:** Event type drives the background color. Team identity drives the left accent bar (using the team's assigned color). Team name is always visible as text.

**Color system:**
- **Game:** Navy background (`#10284C`), white text, team color left bar
- **Practice:** Emerald tint background, dark text, team color left bar
- **Tournament:** Purple tint background, dark text, team color left bar
- **Team Event:** Sky tint, team color left bar
- **Other:** Slate, team color left bar

**Files touched:**
- `src/pages/schedule/ScheduleStatRow.jsx` (Phase 1)
- `src/pages/schedule/CalendarViews.jsx` (Phase 2, Phase 3)

---

## PHASE 1 — Shrink Stat Cards

### File: `src/pages/schedule/ScheduleStatRow.jsx`

**Change 1: Replace the StatCard component.**

Find the `StatCard` function (around lines 8-29). Replace the entire function with:

```jsx
function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`relative overflow-hidden rounded-xl px-4 py-3 border ${
      isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'
    }`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className={`w-5 h-5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} style={{ color: iconColor }} />
        )}
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black italic tracking-tighter ${valueColor || (isDark ? 'text-white' : 'text-[#10284C]')}`}>{value}</span>
            {sub && <span className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</span>}
            {pill && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**What changed:**
- Padding: `p-5` → `px-4 py-3`
- Value font: `text-3xl` → `text-xl`
- Rounded: `rounded-2xl` → `rounded-xl`
- Layout: vertical stack → horizontal flex (icon left, text right)
- Sub text: moved inline next to value instead of below
- Ghost icon: removed (the 80px watermark behind the card)
- Overall height: ~1/3 of original

### Verification

- Stat cards should be compact horizontal cards, roughly 50-60px tall
- Icon on the left, label + value + sub inline on the right
- No giant ghost icon watermark

### Commit message
```
refactor(schedule): shrink stat cards to compact horizontal layout
```

---

## PHASE 2 — Month View: Event Type Backgrounds + Team Color Bar + Team Name

### File: `src/pages/schedule/CalendarViews.jsx`

**Change 1: Replace the event pill rendering inside MonthView.**

In the `MonthView` function, find the event rendering block inside the day cells (around lines 194-213). The current code renders events as:

```jsx
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const type = event.event_type || 'other'
                        const colors = EVENT_COLORS[type] || EVENT_COLORS.other
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                            className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs font-semibold truncate cursor-pointer transition hover:brightness-110 ${
                              isDark ? 'bg-white/[0.04] text-slate-300' : 'bg-[#F5F6F8] text-[#10284C]'
                            }`}
                          >
                            <div className={`w-0.5 h-3.5 rounded-full shrink-0 ${colors.border}`} />
                            <span className="truncate">{event.title || event.event_type}</span>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className={`text-[10px] font-bold px-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+{dayEvents.length - 3} more</div>
                      )}
                    </div>
```

Replace the entire `<div className="space-y-1">` block (including the "+N more") with:

```jsx
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(event => {
                        const type = event.event_type || 'other'
                        const isGame = type === 'game'
                        const isTournament = type === 'tournament'
                        const isPractice = type === 'practice'
                        const teamColor = event.teams?.color || '#6366F1'

                        const pillBg = isGame
                          ? (isDark ? 'bg-[#10284C]' : 'bg-[#10284C]')
                          : isPractice
                            ? (isDark ? 'bg-emerald-900/40' : 'bg-emerald-500/15')
                            : isTournament
                              ? (isDark ? 'bg-purple-900/40' : 'bg-purple-500/15')
                              : (isDark ? 'bg-white/[0.06]' : 'bg-slate-100')

                        const pillText = isGame
                          ? 'text-white'
                          : isPractice
                            ? (isDark ? 'text-emerald-300' : 'text-emerald-800')
                            : isTournament
                              ? (isDark ? 'text-purple-300' : 'text-purple-800')
                              : (isDark ? 'text-slate-300' : 'text-slate-700')

                        return (
                          <div
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(event) }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition hover:brightness-110 ${pillBg}`}
                          >
                            <div className="w-[3px] h-3 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                            <span className={`text-[10px] font-bold truncate ${pillText}`}>
                              {event.title || event.event_type}
                            </span>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className={`text-[10px] font-bold px-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>+{dayEvents.length - 3} more</div>
                      )}
                    </div>
```

**Change 2: Update the month view legend to reflect the new color system.**

Find the legend footer in MonthView (around lines 224-236). Replace the legend colors:

```jsx
      <div className="flex items-center justify-center gap-6 mt-4">
        {[
          { label: 'Practice', color: '#10B981' },
          { label: 'Game', bg: 'bg-[#10284C]', textColor: 'text-white' },
          { label: 'Tournament', color: '#8B5CF6' },
          { label: 'Team Event', color: '#3B82F6' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            {item.bg ? (
              <div className={`w-4 h-3 rounded-sm ${item.bg}`} />
            ) : (
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: `${item.color}30` }}>
                <div className="w-[3px] h-full rounded-l-sm" style={{ backgroundColor: item.color }} />
              </div>
            )}
            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
          </div>
        ))}
      </div>
```

### Verification

- Month view: game pills are navy with white text, team color left bar visible
- Practice pills are green tinted, tournament pills are purple tinted
- Team color bar (3px) shows the assigned team color
- Legend matches the actual pill styles
- Hover still works on pills

### Commit message
```
refactor(schedule): month view pills with event type backgrounds and team color bars
```

---

## PHASE 3 — Week View: Stronger Colors + Bigger Text + Team Color Bar

### File: `src/pages/schedule/CalendarViews.jsx`

**Change 1: Replace the event cell rendering in WeekView.**

In the `WeekView` function, find the event rendering inside day cells (around lines 333-361). Replace the event map:

```jsx
                    {dayEvents.map(event => {
                      const type = event.event_type || 'other'
                      const colors = EVENT_COLORS[type] || EVENT_COLORS.other
                      return (
                        <div key={event.id}
                          onClick={() => onSelectEvent(event)}
                          className={`p-2 mb-1.5 rounded-lg cursor-pointer transition-all hover:brightness-110 ${
                            isDark ? 'hover:brightness-125' : 'hover:shadow-sm'
                          }`}
                          style={{ backgroundColor: `${colors.icon}25` }}
                        >
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${colors.badge}`}>
                            {type}
                          </span>
                          <div className={`text-xs font-bold mt-1 truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                            {event.title || event.event_type}
                          </div>
                          {event.venue_name && (
                            <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {event.venue_name}
                            </div>
                          )}
                          {event.event_time && (
                            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {formatTime12(event.event_time)}
                            </div>
                          )}
                        </div>
                      )
                    })}
```

Replace with:

```jsx
                    {dayEvents.map(event => {
                      const type = event.event_type || 'other'
                      const isGame = type === 'game'
                      const isTournament = type === 'tournament'
                      const isPractice = type === 'practice'
                      const teamColor = event.teams?.color || '#6366F1'

                      const cellBg = isGame
                        ? (isDark ? 'bg-[#10284C]' : 'bg-[#10284C]')
                        : isPractice
                          ? (isDark ? 'bg-emerald-900/30' : 'bg-emerald-500/15')
                          : isTournament
                            ? (isDark ? 'bg-purple-900/30' : 'bg-purple-500/15')
                            : (isDark ? 'bg-white/[0.06]' : 'bg-slate-100')

                      const cellText = isGame ? 'text-white' : (isDark ? 'text-white' : 'text-[#10284C]')
                      const cellMuted = isGame ? 'text-white/60' : (isDark ? 'text-slate-400' : 'text-slate-500')

                      return (
                        <div key={event.id}
                          onClick={() => onSelectEvent(event)}
                          className={`p-2 mb-1.5 rounded-lg cursor-pointer transition-all hover:brightness-110 flex gap-1.5 ${cellBg}`}
                        >
                          <div className="w-[3px] rounded-full shrink-0 self-stretch" style={{ backgroundColor: teamColor }} />
                          <div className="min-w-0 flex-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              isGame ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'
                            }`}>
                              {type}
                            </span>
                            <div className={`text-sm font-bold truncate ${cellText}`}>
                              {event.title || event.event_type}
                            </div>
                            {event.venue_name && (
                              <div className={`text-[10px] truncate ${cellMuted}`}>
                                {event.venue_name}
                              </div>
                            )}
                            {event.event_time && (
                              <div className={`text-[10px] ${cellMuted}`}>
                                {formatTime12(event.event_time)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
```

**What changed:**
- **Game cells:** Navy background, white text (matches list view treatment)
- **Practice cells:** Stronger emerald tint
- **Tournament cells:** Stronger purple tint
- **Team color bar:** 3px left bar using the team's assigned color, visible on all event types
- **Title text:** Bumped from `text-xs` to `text-sm` for readability
- **Type badge:** Moved from a separate pill to inline text above the title (saves vertical space)
- **Layout:** `flex gap-1.5` with the team color bar on the left

**Change 2: Update the week view legend.**

Find the week view footer legend (around lines 381-393). Replace the color for Game:

Find:
```jsx
            { label: 'Game', color: '#F59E0B' },
```

Replace with:
```jsx
            { label: 'Game', color: '#10284C' },
```

### Verification

- Week view: game cells are navy with white text, clearly distinct
- Practice cells are green tinted, tournaments purple tinted
- Team color bar (3px) visible on every event cell
- Title text is `text-sm` (readable, not squinting)
- Legend game dot matches navy

### Commit message
```
refactor(schedule): week view with event type backgrounds, team color bars, bigger text
```

---

## POST-EXECUTION QA CHECKLIST

1. **Stat cards:** Compact horizontal cards, ~1/3 previous height. Icon left, text right. No ghost watermark.
2. **Month view pills:** Games = navy bg + white text. Practice = green tint. Tournament = purple tint. Team color bar (3px) visible on left of each pill.
3. **Month view legend:** Reflects actual pill colors (navy block for games, tinted blocks for others).
4. **Week view cells:** Games = navy bg + white text. Practice = green tint. Tournament = purple tint. Team color bar visible. Title text is `text-sm` (readable).
5. **Week view legend:** Game dot is navy.
6. **All views:** Clicking events still opens EventDetailModal.
7. **Multi-team org:** Different teams show different colored left bars on their events. Event type background is consistent regardless of team.
8. **Filter by team:** Events still show team name context even when filtered.
