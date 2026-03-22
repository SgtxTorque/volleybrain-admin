# CC-COACH-DASHBOARD-POLISH-V3.md
## Coach Dashboard — Visual Polish, Team Color Removal, Sizing Fixes

**Read `CLAUDE.md`, `SUPABASE_SCHEMA.md`, and `public/lynx-brandbook-v2.html` before writing ANY code.**
**Read EVERY file you're about to edit before making changes.**

---

## STEP 0: SAFETY CHECKPOINT

```bash
git add -A && git commit -m "Pre-polish-v3 checkpoint"
```

---

## OVERVIEW

This is a comprehensive visual polish pass covering:

1. **Remove team color everywhere** — replace with Lynx brand palette
2. **Sidebar team badge** → use team logo (like admin/parent) instead of color square
3. **Workflow buttons** — shrink to half width, centered, use Lynx sky gradient
4. **Command strip** — make tiles smaller/more compact
5. **Font size increases** — scale text to fill the space properly
6. **Fix data bugs** — "undefined week", dashes, wrong colors
7. **General visual polish** — consistency, spacing, dark mode

---

## BRAND PALETTE (the ONLY colors allowed)

```
Accent interactive:  #4BB9EC (text-lynx-sky / bg-lynx-sky)
Accent hover:        #2A9BD4 (text-lynx-deep / bg-lynx-deep)
Accent highlight:    #E8F4FD (bg-lynx-ice)
Primary text light:  #10284C (text-lynx-navy)
Primary text dark:   text-white
Secondary text:      #5A6B7F (text-lynx-slate) / dark: text-slate-400
Cards light:         bg-white  |  dark: bg-lynx-charcoal
Inner panels light:  bg-lynx-frost (#F0F3F7)  |  dark: bg-lynx-graphite
Page bg:             bg-lynx-cloud (#F5F7FA)   |  dark: bg-lynx-midnight
Borders light:       border-lynx-silver  |  dark: border-lynx-border-dark
Success:             text-emerald-500 / bg-emerald-50 (light) / bg-emerald-500/10 (dark)
Error:               text-red-500 / bg-red-50 (light) / bg-red-500/10 (dark)
Warning:             text-amber-500 / bg-amber-50 (light) / bg-amber-500/10 (dark)
```

**BANNED: No team.color, selectedTeam.color, #3B82F6, #6366F1, blue-500, indigo-, purple-. No backdrop-blur.**

---

## ═══════════════════════════════════════════════
## PHASE 1: Remove Team Color Everywhere
## ═══════════════════════════════════════════════

Search all coach files for `selectedTeam?.color`, `team?.color`, `team.color`, `#3B82F6`, `#6366F1`, `#4BB9EC` used as team-color fallback, and `adjustBrightness`. Replace every instance with brand palette equivalents.

### 1A. Left Sidebar — Team Identity Badge

**File: `src/components/coach/CoachLeftSidebar.jsx`**

Replace the team-color square with the **team logo** (matching admin/parent pattern). The `teams` table has `logo_url`.

The shell query (`loadCoachData`) already selects from `teams` — make sure it includes `logo_url` in the select. If it doesn't, add it.

**Replace the team badge block:**

```jsx
{/* OLD: Color square with initial */}
<div
  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
  style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}
>
  {selectedTeam?.name?.charAt(0)}
</div>

{/* NEW: Team logo or branded fallback */}
{selectedTeam?.logo_url ? (
  <div className={`w-12 h-12 rounded-xl overflow-hidden shadow-sm ${isDark ? 'border border-white/[0.06]' : 'border border-lynx-silver'}`}>
    <img src={selectedTeam.logo_url} alt={selectedTeam.name} className="w-full h-full object-cover" />
  </div>
) : (
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-lynx-graphite text-lynx-sky border border-lynx-border-dark' : 'bg-lynx-ice text-lynx-sky border border-lynx-sky/20'}`}>
    {selectedTeam?.name?.charAt(0)}
  </div>
)}
```

**Also update the stat badges** — if `text-blue-500` still exists on the Teams stat, change to `text-lynx-sky`.

### 1B. Hero Card — Dark Cinematic Gradient

**File: `src/components/coach/CoachGameDayHero.jsx`**

Replace all team-color gradient overlays with a **dark navy cinematic gradient**.

**Game hero overlay (around line 60):**
```jsx
{/* OLD */}
style={{ background: `linear-gradient(135deg, ${selectedTeam?.color || '#3B82F6'}dd, ${selectedTeam?.color || '#3B82F6'}99, rgba(15,23,42,0.90))` }}

{/* NEW — dark cinematic gradient, no team color */}
style={{ background: 'linear-gradient(135deg, rgba(10,27,51,0.92), rgba(16,40,76,0.85), rgba(10,27,51,0.95))' }}
```

**Practice hero overlay (around line 154):**
```jsx
{/* OLD */}
style={{ background: `linear-gradient(135deg, ${selectedTeam?.color || '#3B82F6'}cc, rgba(30,41,59,0.90))` }}

{/* NEW */}
style={{ background: 'linear-gradient(135deg, rgba(10,27,51,0.90), rgba(16,40,76,0.85))' }}
```

**VS circles — team identity:**
```jsx
{/* OLD — team color circle */}
style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}

{/* NEW — show team logo or branded initial */}
{selectedTeam?.logo_url ? (
  <img src={selectedTeam.logo_url} alt={selectedTeam.name}
    className="w-16 h-16 rounded-xl object-cover border-2 border-white/20" />
) : (
  <div className="w-16 h-16 rounded-xl bg-lynx-sky/80 flex items-center justify-center text-white text-2xl font-black border-2 border-white/20">
    {selectedTeam?.name?.charAt(0)}
  </div>
)}
```

For the **opponent circle**, keep the same pattern but use a neutral charcoal bg since we won't have the opponent's logo:
```jsx
<div className="w-16 h-16 rounded-xl bg-slate-700/80 flex items-center justify-center text-white text-2xl font-black border-2 border-white/20">
  {opponentInitial}
</div>
```

### 1C. Center Dashboard — Team Selector Pills

**File: `src/components/coach/CoachCenterDashboard.jsx`**

Replace team-color pills with brand-styled pills:

```jsx
{/* OLD — team color on selected pill */}
style={isSelected ? { backgroundColor: team.color || '#3B82F6' } : undefined}

{/* NEW — brand sky blue for selected, neutral for unselected */}
className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
  isSelected
    ? 'bg-lynx-sky text-white shadow-sm'
    : isDark
      ? 'bg-white/[0.06] text-slate-400 hover:bg-white/10'
      : 'bg-lynx-frost text-lynx-slate hover:bg-slate-200'
}`}
```

Remove the `style` prop entirely — no inline backgroundColor.

Also remove the team color dot inside unselected pills if it exists:
```jsx
{/* OLD — team color dot */}
style={!isSelected ? { backgroundColor: team.color || '#3B82F6' } : undefined}

{/* NEW — remove entirely, or use a neutral dot */}
{/* If a dot indicator is needed for multi-team, use a small logo or lynx-sky dot */}
```

### 1D. Center Dashboard — Chat Gradient

```jsx
{/* OLD */}
const g = selectedTeam?.color || '#6366F1'

{/* NEW — use lynx brand */}
const g = '#4BB9EC'  // lynx-sky, always
```

### 1E. Roster Panel — Player Badges

**File: `src/components/coach/CoachRosterPanel.jsx`**

```jsx
{/* OLD */}
style={{ backgroundColor: selectedTeam?.color || '#3B82F6' }}

{/* NEW */}
className="bg-lynx-sky"
```
Remove the `style` prop.

### 1F. Shell — Event Detail Modal

**File: `src/pages/roles/CoachDashboard.jsx`**

```jsx
{/* OLD */}
<div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl" style={{ backgroundColor: team?.color || '#3B82F6' }}>

{/* NEW */}
<div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${isDark ? 'bg-lynx-graphite text-lynx-sky border border-lynx-border-dark' : 'bg-lynx-ice text-lynx-sky border border-lynx-sky/20'}`}>
```

### 1G. Shell — Ensure `logo_url` is fetched

In `loadCoachData` where teams are queried, make sure the select includes `logo_url`:

```jsx
const { data: teamData } = await supabase
  .from('teams')
  .select('*, logo_url, seasons(name, sports(name, icon))')
  .in('id', teamIds)
```

If `logo_url` is already included via `*`, this is fine. But verify.

### 1H. Workflow Buttons — Remove team color gradient

Replace the team-color gradient with a **Lynx sky blue gradient**:

```jsx
{/* OLD — team color gradient */}
style={{ background: `linear-gradient(135deg, ${teamColor}dd, ${teamColor}99, ${adjustBrightness(teamColor, -20)}bb)` }}

{/* NEW — brand sky blue gradient */}
className="bg-gradient-to-br from-lynx-sky to-lynx-deep"
```

Remove all `teamColor` props, `adjustBrightness` imports, and inline `style` props from workflow buttons.

```bash
git add -A && git commit -m "Phase 1: Remove team color everywhere — use brand palette + team logos" && git push
```

---

## ═══════════════════════════════════════════════
## PHASE 2: Resize Workflow Buttons
## ═══════════════════════════════════════════════

The workflow buttons are currently full-width across the center column. They need to be:
- **Half the current width** (each button is ~half the size)
- **Centered** in the available space
- Still 4 buttons in a row on desktop

**Change the grid container:**

```jsx
{/* OLD — full width */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">

{/* NEW — centered, max-width constrained */}
<div className="max-w-[640px] mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-3">
```

**Reduce button padding and height:**

```jsx
{/* OLD */}
className="... p-4 ... min-h-[80px]"

{/* NEW — more compact */}
className="... px-4 py-3 ... min-h-[56px]"
```

**Reduce icon container:**
```jsx
{/* OLD */}
<div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
  <Icon className="w-5 h-5 text-white" />

{/* NEW — smaller */}
<div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
  <Icon className="w-4 h-4 text-white" />
```

**Label text stays `text-sm font-bold text-white`** — this is fine at the smaller size.

```bash
git add -A && git commit -m "Phase 2: Resize workflow buttons — half width, centered" && git push
```

---

## ═══════════════════════════════════════════════
## PHASE 3: Resize Command Strip
## ═══════════════════════════════════════════════

The command strip tiles are too tall. Make them more compact while keeping the information clear.

**Reduce tile padding:**
```jsx
{/* OLD */}
className="... p-4 ..."

{/* NEW */}
className="... px-3 py-2.5 ..."
```

**Reduce icon size:**
```jsx
{/* OLD */}
<Icon className="w-6 h-6 ..." />

{/* NEW */}
<Icon className="w-5 h-5 ..." />
```

**Reduce value text but keep it readable:**
```jsx
{/* OLD */}
<p className="text-xl font-black ...">{value}</p>

{/* NEW */}
<p className="text-lg font-bold ...">{value}</p>
```

**Status pill stays the same size** — it's already compact at `text-[9px]`.

**Also center the strip** to match workflow buttons:
```jsx
{/* Wrap in a max-width container */}
<div className="max-w-[800px] mx-auto w-full">
  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
    {/* tiles */}
  </div>
</div>
```

Use `gap-2` instead of `gap-3` for tighter spacing.

```bash
git add -A && git commit -m "Phase 3: Resize command strip — more compact tiles" && git push
```

---

## ═══════════════════════════════════════════════
## PHASE 4: Fix Data Bugs
## ═══════════════════════════════════════════════

### 4A. "undefined week" on Shoutouts tile

The shoutouts command strip tile shows "undefined week". This means the value template string is referencing a variable that doesn't exist or is undefined.

**Find the shoutouts tile** in the command strip and fix the value:

```jsx
{/* Fix: ensure the value handles null/undefined gracefully */}
value: weeklyEngagement
  ? `${(weeklyEngagement.shoutouts || 0) + (weeklyEngagement.challenges || 0) + (weeklyEngagement.posts || 0)} acts`
  : '—'
```

The label should be `ENGAGEMENT` not `SHOUTOUTS`. If it still says SHOUTOUTS, update it.

### 4B. Attendance and RSVPs showing "—"

These tiles show dashes because the data isn't being passed or computed. Check:

1. In the shell (`CoachDashboard.jsx`), verify `avgAttendanceLast3` is being computed and passed as a prop
2. Verify the attendance query is running (check console for errors)
3. If no past events exist, show "No data" pill instead of "—"

For attendance: If `avgAttendanceLast3` is null, show `—` with "No Data" pill. If it's a number, show `{avgAttendanceLast3}%`.

### 4C. "Create Challenge +" button is red

**File: `src/components/coach/CoachRosterPanel.jsx`** (or wherever the Challenges section is in the right panel)

Find the Create Challenge button and fix:

```jsx
{/* OLD — red/coral */}
className="... bg-red-500 ..."

{/* NEW — brand sky blue */}
className="... bg-lynx-sky hover:bg-lynx-deep text-white ..."
```

### 4D. Scoring trend X-axis labels

The line chart X-axis shows garbled text (00, 000, T10). Fix the label generation:

```jsx
{/* The labels should show opponent initials or game numbers */}
const label = game.opponent_name
  ? game.opponent_name.substring(0, 3).toUpperCase()
  : `G${index + 1}`
```

### 4E. Duplicate helper functions

Check if `formatTime12` and `countdownText` are still duplicated in `CoachCenterDashboard.jsx` (they were extracted to `src/lib/date-helpers.js` in the earlier polish pass but may have been re-added during V2 rewrite). If duplicated, remove the local copies and import from `date-helpers.js`.

```bash
git add -A && git commit -m "Phase 4: Fix data bugs — undefined shoutouts, dash values, red button, chart labels" && git push
```

---

## ═══════════════════════════════════════════════
## PHASE 5: Font Size Scaling
## ═══════════════════════════════════════════════

Across the entire coach dashboard, increase font sizes where text looks too small for the space it occupies. The principle: **text should fill its container confidently, not float in empty space.**

### Welcome Header
```jsx
{/* Keep text-xl for name, but make sure subtitle is visible */}
<h1 className="text-xl font-bold ...">Welcome back, Carlos</h1>
<p className="text-sm ...">Black Hornets Elite · Spring 2026</p>
```

### Left Sidebar
- Team name: `text-sm font-bold` → keep (240px is narrow)
- Season/sport: `text-xs` → keep
- Stat badge values: ensure `text-lg font-black` or `text-xl font-bold`
- Needs Attention items: `text-sm` → keep
- Quick Action labels: `text-sm` → keep

### Hero Card
- "NEXT GAME DAY" badge: `text-[10px]` → `text-xs` (12px)
- Team names below VS circles: `text-sm font-bold` → `text-base font-bold`
- Countdown timer: should be `text-base font-semibold` minimum
- Date/time/venue: `text-sm` → keep
- Action buttons (Lineup Builder, Game Day Hub): `text-sm font-semibold` → keep

### Season Totals (rotating panel)
- Stat values: should be `text-2xl font-bold` minimum
- Stat labels: `text-[10px] uppercase` → keep
- "View Full Stats →": `text-xs font-semibold text-lynx-sky`

### Game Day Checklist (rotating panel)
- Title: `text-sm font-bold`
- Checklist items: `text-sm` → keep
- Progress text ("2/4 ready"): `text-xs font-semibold`

### Command Strip Tiles
- Value: `text-lg font-bold` (already adjusted in Phase 3)
- Label: `text-[10px] uppercase tracking-wider font-bold`

### Workflow Buttons
- Label: `text-sm font-bold text-white` → keep

### Team Hub / Chat Preview
- Section titles (TEAM HUB, TEAM CHAT): `text-sm font-bold`
- "Go To Team Page →": `text-xs font-semibold text-lynx-sky`

### Performance Grid Cards
- Card header titles: `text-xs font-bold uppercase tracking-wider`
- Chart value labels inside cards: should be `text-sm` minimum
- Power bar stat names: `text-xs font-semibold`
- Power bar values: `text-sm font-bold`
- Top Performer name: `text-base font-bold`
- Top Performer stats: `text-xl font-bold`
- Placeholder text: `text-sm` for title, `text-xs` for description

### Right Panel
- Section headers (SEASON RECORD, UPCOMING, etc.): `text-xs font-bold uppercase tracking-wider`
- Season record numbers: `text-3xl font-black` (keep big)
- Player names: `text-sm font-semibold`
- Player stats: `text-xs`

### General Rule
If text looks lost in whitespace, bump it one size up. If text is crowded, leave it. Trust the visual weight.

```bash
git add -A && git commit -m "Phase 5: Font size scaling — fill space confidently" && git push
```

---

## ═══════════════════════════════════════════════
## PHASE 6: General Visual Polish
## ═══════════════════════════════════════════════

### 6A. Dark Mode Sweep

Go through every component and verify dark mode looks correct:
- Cards: `bg-lynx-charcoal border border-lynx-border-dark`
- Text: primary = `text-white`, secondary = `text-slate-400`
- Borders: `border-lynx-border-dark` or `border-white/[0.06]`
- Inner panels: `bg-lynx-graphite`
- Hover states: `hover:bg-white/[0.06]` or `hover:bg-white/10`

### 6B. Performance Grid — Empty State Consistency

All 9 performance cards should have the same empty state pattern when there's no data:
- Centered icon in a `bg-lynx-ice` (light) / `bg-lynx-sky/10` (dark) circle
- Title text: `text-sm font-semibold`
- Description: `text-xs text-lynx-slate`
- Consistent height: `min-h-[220px]` with content vertically centered

### 6C. Checklist Card Polish

When all items are checked:
- Card gets a subtle emerald glow: `ring-1 ring-emerald-500/25`
- Progress text changes to "Ready for Game Day ✅" in emerald
- Maybe a subtle confetti or shine animation (optional, don't force it)

When items are unchecked:
- Unchecked items have a clear checkbox outline
- Checked items have a filled emerald checkbox with strikethrough text

### 6D. Right Panel — "Create Challenge +" Button

Must be `bg-lynx-sky hover:bg-lynx-deep text-white` not red.

### 6E. Hero Card — Ensure Text Contrast

With the new dark navy gradient (no team color), all text on the hero must be white with good contrast:
- Team names: `text-white font-bold`
- Countdown: `text-white/90`
- Date/venue: `text-white/70`
- Action buttons: `bg-white/20 text-white hover:bg-white/30 border border-white/10`

### 6F. Workflow Buttons — Add Subtle Differentiation

Even though all 4 buttons use the same sky-blue gradient, add subtle visual cues so they don't all look identical:

Option: Give each button a slightly different icon background opacity or a different subtle pattern. Or simply rely on the icon + label being different enough (they probably are at the smaller size).

### 6G. Verify No Scroll Issues

- Left sidebar and right panel should scroll independently
- Center column should scroll independently
- No double scrollbars
- Content doesn't overflow horizontally

### 6H. Loading States

Every section that depends on async data should show a loading skeleton or spinner while data loads. Check:
- Command strip tiles
- Performance grid cards
- Checklist items
- Right panel sections

```bash
git add -A && git commit -m "Phase 6: Visual polish — dark mode, empty states, contrast, loading states" && git push
```

---

## DO NOT

- **DO NOT** use team.color or selectedTeam.color ANYWHERE — this is the whole point
- **DO NOT** use #3B82F6, #6366F1, blue-500, indigo-, purple-
- **DO NOT** use backdrop-blur
- **DO NOT** install any npm packages
- **DO NOT** change Supabase table schemas
- **DO NOT** modify the nav bar or routing
- **DO NOT** change the parent or admin dashboards
- **DO NOT** change FeedPost.jsx, hubStyles.js, or shared components
- **DO NOT** change modal functionality (Coach Blast, Warmup Timer, Event Detail)
- **DO NOT** break the Team Hub + Chat inline reply
- **DO NOT** make sidebar wider than 240px or right panel wider than 330px
- **DO NOT** remove any existing functionality — this is polish only
- **DO NOT** use `adjustBrightness` with team colors — remove those patterns entirely

---

## VERIFICATION CHECKLIST

### Team Color Removal
- [ ] ZERO instances of `selectedTeam?.color` in any coach file
- [ ] ZERO instances of `team?.color` or `team.color` used for styling
- [ ] ZERO instances of `#3B82F6` or `#6366F1`
- [ ] ZERO instances of `adjustBrightness` with team color
- [ ] Sidebar shows team logo (or branded fallback initial)
- [ ] Hero card uses dark navy gradient (no team color)
- [ ] VS circles show logos (or branded initials)
- [ ] Team selector pills use `bg-lynx-sky` for selected
- [ ] Workflow buttons use `bg-gradient-to-br from-lynx-sky to-lynx-deep`
- [ ] All fallback colors are brand-safe

### Sizing
- [ ] Workflow buttons are ~half previous width, centered with `max-w-[640px] mx-auto`
- [ ] Command strip tiles are compact (reduced padding)
- [ ] Command strip centered with `max-w-[800px] mx-auto`

### Data Bugs
- [ ] No "undefined" text anywhere on the dashboard
- [ ] Shoutouts tile shows engagement count or "—" (not "undefined week")
- [ ] Attendance tile shows percentage or "No Data"
- [ ] Create Challenge button is lynx-sky (not red)
- [ ] Scoring trend chart has readable X-axis labels
- [ ] No duplicate formatTime12 / countdownText functions

### Font Sizing
- [ ] Text fills its space — no tiny text floating in large containers
- [ ] Stat values are bold and prominent
- [ ] Labels are readable but secondary

### Visual Polish
- [ ] All components look correct in dark mode
- [ ] All empty states are consistent
- [ ] Hero card text has good contrast on dark gradient
- [ ] Performance grid cards are consistent height
- [ ] Right panel has no red buttons
- [ ] No scroll issues
- [ ] App starts with `npm run dev` — no console errors

### Run this final check:
```bash
# Should return ZERO results
grep -rn "selectedTeam?.color\|team\.color\|team?.color\|#3B82F6\|#6366F1" src/components/coach/ src/pages/roles/CoachDashboard.jsx
```
