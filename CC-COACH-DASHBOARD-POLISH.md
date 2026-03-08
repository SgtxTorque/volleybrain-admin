# CC-COACH-DASHBOARD-POLISH.md
## Coach Dashboard — Brand Sweep + Dark Mode + Polish Pass

**Read `CLAUDE.md` and `public/lynx-brandbook-v2.html` before writing ANY code.**

**Files that need editing (ALL of them — read each one first):**
1. `src/components/coach/CoachLeftSidebar.jsx`
2. `src/components/coach/CoachCenterDashboard.jsx`
3. `src/components/coach/CoachGameDayHero.jsx`
4. `src/components/coach/CoachRosterPanel.jsx`
5. `src/pages/roles/CoachDashboard.jsx`

**Also delete this dead file:**
6. `src/pages/dashboard/CoachDashboard.jsx` ← old version, unused, nobody imports it

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-coach-polish checkpoint"
```

---

## BRAND REFERENCE (from lynx-brandbook-v2.html)

```
Interactive accent color: #4BB9EC (Sky Blue) — use `text-lynx-sky` / `bg-lynx-sky`
Hover/pressed:           #2A9BD4 (Deep Sky) — use `text-lynx-deep` / `bg-lynx-deep`
Light highlights:        #E8F4FD (Ice Blue) — use `bg-lynx-ice`
Primary text (light):    #10284C (Navy) — use `text-lynx-navy`
Secondary text:          #5A6B7F (Slate) — use `text-lynx-slate`
Borders (light):         #DFE4EA (Silver) — use `border-lynx-silver`
Page bg (light):         #F5F7FA (Cloud) — use `bg-lynx-cloud`
Cards (light):           #FFFFFF (White)
Inner panels (light):    #F0F3F7 (Frost) — use `bg-lynx-frost`
Page bg (dark):          #0A1B33 (Midnight) — use `bg-lynx-midnight`
Cards (dark):            #1A2332 (Charcoal) — use `bg-lynx-charcoal`
Inner panels (dark):     #232F3E (Graphite) — use `bg-lynx-graphite`
Dark border:             #2A3545 — use `border-lynx-border-dark`
Success:                 #10B981 (light) / #34D399 (dark)
Error:                   #EF4444 (light) / #F87171 (dark)
Warning:                 #F59E0B (light) / #FBBF24 (dark)

Brand DON'Ts:
- No pure black (#000)
- No glass/blur effects (no backdrop-filter)
- No multiple accent colors — Sky Blue only for interactive elements
- No ALL-CAPS text over 13px (text-xs = 12px is OK, text-sm = 14px is NOT OK for uppercase)
```

---

## PHASE 1: Brand Color Sweep (All 5 files)

### 1A. Replace `#2C5F7C` → Lynx Sky Blue

This old brand color appears in 6 places as link/action text. Replace ALL of them.

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 552 | `text-[#2C5F7C]` | `text-lynx-sky` |
| 575 | `text-[#2C5F7C]` | `text-lynx-sky` |
| 616 | `text-[#2C5F7C]` | `text-lynx-sky` |

**File: `src/components/coach/CoachRosterPanel.jsx`**

| Line | Old | New |
|------|-----|-----|
| 101 | `text-[#2C5F7C]` | `text-lynx-sky` |
| 173 | `text-[#2C5F7C]` | `text-lynx-sky` |
| 235 | `text-[#2C5F7C]` | `text-lynx-sky` |

For each instance, also change `hover:opacity-80` to `hover:text-lynx-deep` for proper hover state.

So the pattern becomes:
```
OLD: className="text-xs text-[#2C5F7C] font-semibold hover:opacity-80"
NEW: className="text-xs text-lynx-sky font-semibold hover:text-lynx-deep"
```

### 1B. Replace `text-blue-500` → `text-lynx-sky`

These are decorative icon colors that should use the brand accent.

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 453 | `text-blue-500` (Crosshair icon) | `text-lynx-sky` |
| 549 | `text-blue-500` (BarChart3 icon) | `text-lynx-sky` |
| 572 | `text-blue-500` (Users icon) | `text-lynx-sky` |

**File: `src/components/coach/CoachLeftSidebar.jsx`**

| Line | Old | New |
|------|-----|-----|
| 53 | `color: 'text-blue-500'` (Teams stat) | `color: 'text-lynx-sky'` |

**File: `src/components/coach/CoachRosterPanel.jsx`**

| Line | Old | New |
|------|-----|-----|
| 166 | `text-blue-500` (Users icon) | `text-lynx-sky` |
| 230 | `text-blue-500` (Calendar icon) | `text-lynx-sky` |

**File: `src/pages/roles/CoachDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 66 | `text-blue-500` (Calendar icon in EventDetailModal) | `text-lynx-sky` |
| 74 | `text-blue-500` (MapPin icon in EventDetailModal) | `text-lynx-sky` |
| 402 | `text-blue-500` (Shield icon in no-teams state) | `text-lynx-sky` |

### 1C. Replace `bg-blue-50` → `bg-lynx-ice`

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Context | Change |
|------|---------|--------|
| 191 | Player avatar fallback in QuickAttendancePanel | `bg-blue-50 text-blue-600` → `bg-lynx-ice text-lynx-sky` |
| 452 | Crosshair icon bg | `'bg-blue-50'` → `'bg-lynx-ice'` |

**File: `src/components/coach/CoachRosterPanel.jsx`**

| Line | Context | Change |
|------|---------|--------|
| 126 | Player avatar fallback in Top Players | `bg-blue-50 text-blue-600` → `bg-lynx-ice text-lynx-sky` |

**File: `src/pages/roles/CoachDashboard.jsx`**

| Line | Context | Change |
|------|---------|--------|
| 401 | No-teams state icon bg | `'bg-blue-50 border border-blue-100'` → `'bg-lynx-ice border border-lynx-sky/20'` |

Also in line 168 (CoachBlastModal priority button), change:
```
OLD: 'bg-blue-50 border border-blue-300 text-blue-600'
NEW: 'bg-lynx-ice border border-lynx-sky/30 text-lynx-sky'
```
And the dark variant on same line:
```
OLD: 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
NEW: 'bg-lynx-sky/10 border border-lynx-sky/30 text-lynx-sky'
```

### 1D. Replace `#3B82F6` fallback → `#4BB9EC` (Lynx Sky Blue)

This is the fallback color when a team has no color set. Currently uses Tailwind blue.

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Change |
|------|--------|
| 412 | `team.color \|\| '#3B82F6'` → `team.color \|\| '#4BB9EC'` |
| 418 | `team.color \|\| '#3B82F6'` → `team.color \|\| '#4BB9EC'` |

**File: `src/components/coach/CoachGameDayHero.jsx`**

| Line | Change |
|------|--------|
| 60 | `selectedTeam?.color \|\| '#3B82F6'` → `selectedTeam?.color \|\| '#4BB9EC'` (appears 2x on this line) |
| 72 | `selectedTeam?.color \|\| '#3B82F6'` → `selectedTeam?.color \|\| '#4BB9EC'` |
| 154 | `selectedTeam?.color \|\| '#3B82F6'` → `selectedTeam?.color \|\| '#4BB9EC'` |

**File: `src/components/coach/CoachLeftSidebar.jsx`**

| Line | Change |
|------|--------|
| 35 | `selectedTeam?.color \|\| '#3B82F6'` → `selectedTeam?.color \|\| '#4BB9EC'` |

**File: `src/components/coach/CoachRosterPanel.jsx`**

| Line | Change |
|------|--------|
| 197 | `selectedTeam?.color \|\| '#3B82F6'` → `selectedTeam?.color \|\| '#4BB9EC'` |

**File: `src/pages/roles/CoachDashboard.jsx`**

| Line | Change |
|------|--------|
| 52 | `team?.color \|\| '#3B82F6'` → `team?.color \|\| '#4BB9EC'` |

### 1E. Replace `#6366F1` fallback → `#4BB9EC`

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Change |
|------|--------|
| 266 | `const g = selectedTeam?.color \|\| '#6366F1'` → `const g = selectedTeam?.color \|\| '#4BB9EC'` |

### 1F. Replace `indigo-` → Lynx Sky equivalents

The Lineup Builder card uses indigo for its accent. Should use Sky Blue.

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 468 | `bg-indigo-500/10 border border-indigo-500/20` | `bg-lynx-sky/10 border border-lynx-sky/20` |
| 468 | `bg-indigo-50 border border-indigo-100` | `bg-lynx-ice border border-lynx-sky/20` |
| 469 | `text-indigo-500` | `text-lynx-sky` |
| 477 | `bg-indigo-500/10 border border-indigo-500/20` | `bg-lynx-sky/10 border border-lynx-sky/20` |
| 477 | `bg-indigo-50 border border-indigo-100` | `bg-lynx-ice border border-lynx-sky/20` |
| 478 | `text-indigo-500` | `text-lynx-sky` |
| 486 | `text-indigo-500` | `text-lynx-sky` |

### 1G. Replace `purple-` → Lynx Sky equivalents

The Message Parents button and Coach Blast Modal use purple. Brand says single accent color (Sky Blue).

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 742 | `bg-purple-500/10 border border-purple-500/20` | `bg-lynx-sky/10 border border-lynx-sky/20` |
| 742 | `bg-purple-50 border border-purple-100` | `bg-lynx-ice border border-lynx-sky/20` |
| 743 | `text-purple-500` | `text-lynx-sky` |

**File: `src/pages/roles/CoachDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 144 | `bg-purple-500/10 border border-purple-500/20` | `bg-lynx-sky/10 border border-lynx-sky/20` |
| 144 | `bg-purple-50 border border-purple-100` | `bg-lynx-ice border border-lynx-sky/20` |
| 145 | `text-purple-500` | `text-lynx-sky` |
| 175 | `bg-purple-600 hover:bg-purple-700` | `bg-lynx-sky hover:bg-lynx-deep` |

### 1H. Replace `text-blue-500/10` dark mode patterns

In the dark-mode variants where `blue-500` is used with opacity for backgrounds:

**File: `src/components/coach/CoachCenterDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 452 | `'bg-blue-500/10'` (dark) | `'bg-lynx-sky/10'` |

**File: `src/pages/roles/CoachDashboard.jsx`**

| Line | Old | New |
|------|-----|-----|
| 401 | `'bg-blue-500/10 border border-blue-500/20'` (dark) | `'bg-lynx-sky/10 border border-lynx-sky/20'` |

### 1I. PRACTICE event badge color

**File: `src/components/coach/CoachRosterPanel.jsx`**

| Line | Old | New |
|------|-----|-----|
| 257 | `'text-blue-500 bg-blue-500/10'` (practice badge) | `'text-lynx-sky bg-lynx-sky/10'` (practice badge) |

**NOTE:** Keep `text-red-500 bg-red-500/10` for GAME badge — red is the brand error/alert color and is appropriate for game urgency.

---

## PHASE 2: Dark Mode Fixes

### 2A. CoachGameDayHero — No-events fallback (lines 200–223)

This entire block is light-mode only. Add dark mode support.

**Replace the entire no-events return block (lines 201–223) with:**

```jsx
  // No upcoming events — Season Record fallback
  return (
    <div className={`${isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'} rounded-xl shadow-sm p-6`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Season Record</p>
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-black text-emerald-500">{teamRecord.wins}</span>
          <span className={`text-3xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>-</span>
          <span className="text-5xl font-black text-red-500">{teamRecord.losses}</span>
          <span className={`text-sm ml-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{winRate}% win rate</span>
        </div>
      </div>
      <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{selectedTeam?.name} · {selectedSeason?.name}</p>
      <div className="mt-4">
        <button
          onClick={() => onNavigate?.('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
            isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-200' : 'bg-lynx-cloud hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          View Schedule
        </button>
      </div>
    </div>
  )
```

**IMPORTANT:** This component currently does NOT import `useTheme`. Add this at the top of `CoachGameDayHero.jsx`:

```jsx
import { useTheme } from '../../contexts/ThemeContext'
```

And inside the function, before the first `if`:

```jsx
const { isDark } = useTheme()
```

### 2B. Needs Attention badge — dark mode

**File: `src/components/coach/CoachLeftSidebar.jsx`** (line 69-71)

```
OLD: className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"
NEW: className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-100 text-amber-700'}`}
```

### 2C. Game Day Hub "Game Day" live badge — dark mode

**File: `src/components/coach/CoachCenterDashboard.jsx`** (line 507)

```
OLD: <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
NEW: <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
```

Also line 509:
```
OLD: <span className="text-sm text-red-500 font-semibold">
```
This one is OK — `text-red-500` works in both modes.

### 2D. Pending Stats Alert — dark mode

**File: `src/components/coach/CoachCenterDashboard.jsx`** (line 526)

```
OLD: <div className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
NEW: <div className={`mx-5 mb-5 flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
```

Also line 529:
```
OLD: <p className="text-sm font-semibold text-amber-700">
NEW: <p className={`text-sm font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
```

And line 530:
```
OLD: <p className="text-sm text-amber-600/70">
NEW: <p className={`text-sm ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'}`}>
```

And the button on line 534:
```
OLD: className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600"
```
This one is OK — amber-500 with white text works in both modes.

### 2E. ALL PRESENT button — dark mode

**File: `src/components/coach/CoachCenterDashboard.jsx`** (line 174)

```
OLD: className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100"
NEW: className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
```

---

## PHASE 3: Remove `backdrop-blur` (Brand Don't)

**File: `src/pages/roles/CoachDashboard.jsx`**

Three modals use `backdrop-blur-sm`. Remove it from all three:

| Line | Context | Change |
|------|---------|--------|
| 48 | EventDetailModal | `bg-black/50 backdrop-blur-sm` → `bg-black/60` |
| 140 | CoachBlastModal | `bg-black/50 backdrop-blur-sm` → `bg-black/60` |
| 209 | WarmupTimerModal | `bg-black/50 backdrop-blur-sm` → `bg-black/60` |

Increase opacity from `/50` to `/60` to compensate for removing the blur.

---

## PHASE 4: Column Borders

The Coach Dashboard's 3-column layout has no visual separators between columns.

**File: `src/components/coach/CoachLeftSidebar.jsx`** (line 29)

Add `border-r` to the aside:

```
OLD: className={`w-[240px] shrink-0 ${isDark ? 'bg-lynx-midnight' : 'bg-white'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`}
NEW: className={`w-[240px] shrink-0 ${isDark ? 'bg-lynx-midnight border-r border-lynx-border-dark' : 'bg-white border-r border-lynx-silver/50'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`}
```

**File: `src/components/coach/CoachRosterPanel.jsx`** (line 48)

Add `border-l` to the aside:

```
OLD: className={`hidden lg:flex w-[330px] shrink-0 flex-col ${isDark ? 'bg-lynx-midnight' : 'bg-white'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`}
NEW: className={`hidden lg:flex w-[330px] shrink-0 flex-col ${isDark ? 'bg-lynx-midnight border-l border-lynx-border-dark' : 'bg-white border-l border-lynx-silver/50'} overflow-y-auto p-5 space-y-5 h-full scrollbar-hide`}
```

---

## PHASE 5: Delete Dead File

```bash
rm src/pages/dashboard/CoachDashboard.jsx
```

Verify nothing imports it:
```bash
grep -r "dashboard/CoachDashboard" src/
```

This should return zero results. The app imports from `src/pages/roles/CoachDashboard.jsx` via `src/pages/roles/index.js`.

---

## PHASE 6: Extract Shared Helpers (Deduplicate)

The functions `formatTime12()` and `countdownText()` are duplicated in 4+ files.

**Create new file: `src/lib/date-helpers.js`**

```js
/**
 * Shared date/time formatting helpers used across coach dashboard components.
 */

export function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch {
    return timeStr
  }
}

export function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff <= 7) return `${diff}d`
  return `${Math.ceil(diff / 7)}w`
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
```

**Then in each coach file, replace the local definitions with imports:**

`src/components/coach/CoachCenterDashboard.jsx` — Remove the local `formatTime12`, `countdownText`, `formatDateShort`, `timeAgo` functions (lines 13–57). Add at top:
```js
import { formatTime12, countdownText, formatDateShort, timeAgo } from '../../lib/date-helpers'
```

`src/components/coach/CoachGameDayHero.jsx` — Remove local `formatTime12`, `countdownText`, `formatDateLong` (lines 1–31). Add at top:
```js
import { formatTime12, countdownText, formatDateLong } from '../../lib/date-helpers'
```

`src/components/coach/CoachRosterPanel.jsx` — Remove local `formatTime12`, `countdownText` (lines 4–27). Add at top:
```js
import { formatTime12, countdownText } from '../../lib/date-helpers'
```

`src/pages/roles/CoachDashboard.jsx` — Remove local `formatTime12`, `countdownText` (near the top). Add:
```js
import { formatTime12, countdownText } from '../../lib/date-helpers'
```

---

## PHASE 7: Remove Redundant Quick Links

The left sidebar has both "Quick Actions" (5 items with chevrons) and "Quick Links" (2x2 grid) — but 3 of the 4 Quick Links destinations (Schedule, Attendance, Messages) are already in Quick Actions. Remove the Quick Links grid entirely.

**File: `src/components/coach/CoachLeftSidebar.jsx`**

Delete the entire "Quick Links" section (lines 126–148, from `{/* Quick Links */}` through the closing `</div>`).

---

## PHASE 8: Uppercase Text > 13px Fix

Brand rule: No ALL-CAPS text over 13px. `text-sm` = 14px = violation when combined with `uppercase`.

**File: `src/components/coach/CoachLeftSidebar.jsx`** (line 67)

```
OLD: className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}
NEW: className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}
```

**File: `src/components/coach/CoachGameDayHero.jsx`** (line 79)

```
OLD: className="text-white/40 text-sm font-bold uppercase tracking-wider"
NEW: className="text-white/40 text-xs font-bold uppercase tracking-wider"
```

---

## DO NOT

- **DO NOT** change any Supabase queries
- **DO NOT** change the 3-column layout structure or column widths (240px / flex-1 / 330px)
- **DO NOT** modify the nav bar
- **DO NOT** change any navigation handlers or routing logic
- **DO NOT** modify the TeamHub FeedPost embed or chat functionality
- **DO NOT** touch HUB_STYLES or hubStyles.js
- **DO NOT** modify the warmup timer logic or blast modal send logic
- **DO NOT** change any prop names or component interfaces
- **DO NOT** add any new features — this is a polish/brand-compliance pass only
- **DO NOT** change emerald/green colors used for success states (those are brand semantic colors)
- **DO NOT** change amber/yellow colors used for warning states (those are brand semantic colors)
- **DO NOT** change red colors used for error/loss states (those are brand semantic colors)

---

## COMMIT PLAN

```bash
# After Phase 1 (brand colors):
git add -A && git commit -m "Phase 1: Brand color sweep — replace non-brand blues/purples/indigos with Lynx Sky Blue" && git push

# After Phase 2 (dark mode):
git add -A && git commit -m "Phase 2: Dark mode fixes — hero fallback, badges, alerts" && git push

# After Phase 3 (backdrop-blur):
git add -A && git commit -m "Phase 3: Remove backdrop-blur from modals (brand don't)" && git push

# After Phase 4 (column borders):
git add -A && git commit -m "Phase 4: Add subtle column borders to coach dashboard" && git push

# After Phase 5 (delete dead file):
git add -A && git commit -m "Phase 5: Remove unused old CoachDashboard from pages/dashboard" && git push

# After Phase 6 (shared helpers):
git add -A && git commit -m "Phase 6: Extract shared date helpers to src/lib/date-helpers.js" && git push

# After Phase 7 (remove redundant links):
git add -A && git commit -m "Phase 7: Remove redundant Quick Links section from coach sidebar" && git push

# After Phase 8 (uppercase fix):
git add -A && git commit -m "Phase 8: Fix uppercase text > 13px brand violation" && git push
```

---

## VERIFICATION CHECKLIST

After all phases, verify:
- [ ] No instances of `#2C5F7C` remain in any coach file
- [ ] No instances of `text-blue-500` remain in coach files (except if inside a semantic success/error context)
- [ ] No instances of `indigo-` remain in coach files
- [ ] No instances of `purple-` remain in coach files
- [ ] All `#3B82F6` fallbacks changed to `#4BB9EC`
- [ ] `#6366F1` fallback changed to `#4BB9EC`
- [ ] Hero fallback card works in dark mode
- [ ] Needs Attention badge renders correctly in dark mode
- [ ] No `backdrop-blur` in any coach modal
- [ ] Left sidebar has subtle right border
- [ ] Right sidebar has subtle left border
- [ ] `src/pages/dashboard/CoachDashboard.jsx` is deleted
- [ ] `src/lib/date-helpers.js` exists and all 4 coach components import from it
- [ ] No duplicate `formatTime12` / `countdownText` functions in coach files
- [ ] Quick Links grid is removed from left sidebar
- [ ] No `text-sm uppercase` combinations remain (should be `text-xs uppercase`)
- [ ] App starts with `npm run dev` — no console errors
- [ ] All coach dashboard pages are still reachable and functional
