# CC-SCHEDULE-RESTYLE.md
## Phase 2: Restyle SchedulePage + All Extracted Modals to Match New Design System

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)
**Prereq:** Phase 1 (CC-SCHEDULE-EXTRACTION.md) must be complete and verified working.

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.** Do NOT change any Supabase queries, state logic, data flow, event handlers, or business logic. This is a **visual-only** refresh.
3. **Do NOT change any component props or exports.** Other files import these — changing signatures will break things.
4. **Use the existing theme system.** Every style must respect dark/light mode using `isDark` conditionals or `tc.*` theme classes from `useThemeClasses()`. Never hardcode to one mode.
5. **Git commit after each file is restyled.** Test `npm run dev` after each.
6. **Preserve all existing functionality.** Every button, dropdown, form field, modal must still work.

---

## THE PROBLEM

The SchedulePage and its modals are **hardcoded dark theme** (`bg-slate-800`, `border-slate-700`, `text-white` everywhere). The new dashboard design system uses **theme-aware classes** that work in both light and dark mode. The schedule pages look like they belong to a different app.

---

## DESIGN SYSTEM REFERENCE

These are the established patterns from the completed dashboards. **Match these exactly.**

### Page Background
```
isDark ? 'bg-slate-900' : 'bg-slate-50'
— or use tc.pageBg
```

### Cards
```
isDark ? 'bg-slate-800 border border-white/[0.06]' : 'bg-white border border-slate-200'
+ rounded-2xl shadow-sm
— or use: `${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm`
```

### Section Headers
```
text-xs font-semibold uppercase tracking-wider
isDark ? 'text-slate-400' : 'text-slate-500'
— or use tc.textMuted
```

### Primary Text
```
isDark ? 'text-white' : 'text-slate-900'
— or use tc.text
```

### Secondary/Muted Text
```
isDark ? 'text-slate-400' : 'text-slate-500'
— or use tc.textMuted
```

### Form Inputs
```
className={`w-full rounded-xl px-4 py-3 border text-sm ${
  isDark
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
}`}
— or use tc.input
```

### Form Labels
```
className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
```

### Modal Overlay
```
className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
```

### Modal Container
```
className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden`}
```

### Modal Header
```
className={`p-6 border-b ${tc.border} flex items-center justify-between`}
```
Title: `className={`text-xl font-bold ${tc.text}`}`
Close button: `className={`${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} text-2xl p-1`}`

### Modal Footer
```
className={`p-6 border-t ${tc.border} flex justify-end gap-3`}
```

### Primary Button
```
className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold hover:brightness-110 transition"
```

### Secondary/Cancel Button
```
className={`px-6 py-2.5 rounded-xl border font-medium transition ${
  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
}`}
```

### Danger Button
```
className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition"
```

### Dropdown Menus
```
className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-30 border overflow-hidden ${
  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
}`}
```

### Select Inputs
```
className={`rounded-xl px-4 py-2.5 text-sm font-medium border ${
  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
}`}
```

### Checkbox Row
```
className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl ${
  isDark ? 'bg-slate-900' : 'bg-slate-50'
}`}
```

### Inner Panels (nested cards inside modals)
```
className={`rounded-xl p-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
```

### Tabs
```
Active: className="text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] px-4 py-3 text-sm font-medium"
Inactive: className={`px-4 py-3 text-sm font-medium ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
```

### Table Headers
```
className={`text-left text-sm font-medium pb-3 pr-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
```

---

## RESTYLE INSTRUCTIONS (Do in order)

### Step 1: Restyle `SchedulePage.jsx` (the main shell)

**Add theme hooks if not already present:**
```javascript
const tc = useThemeClasses()
const { isDark } = useTheme()
```

**Changes to make:**

1. **Upcoming Games Strip** (~line where `allUpcomingGames.length > 0`):
   - The strip wrapper already uses `isDark` conditionals — verify it matches the card pattern above. It should use `${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm`.
   - The strip header should use `tc.textMuted` for the section label.

2. **Filters row** — selects and view toggle already use `isDark`. Verify they match the Select Input pattern above.

3. **Calendar navigation bar** — already uses `isDark`. Verify it matches the card pattern.

4. **The main `<div className="space-y-5">` wrapper** — this is fine, no change needed.

5. **"Share & Export" dropdown** — already uses `isDark`. Verify it matches Dropdown Menu pattern.

6. **"Add Events" dropdown** — same as above.

7. **No-season fallback** (`if (!selectedSeason)`) — use `tc.textMuted` for the message.

**This file is already mostly theme-aware** since it was updated more recently. The main work is on the modals below.

**Commit:**
```bash
git add -A && git commit -m "Phase 2a: Restyle SchedulePage.jsx shell to design system"
```

---

### Step 2: Restyle `AddEventModal.jsx`

This modal is **fully hardcoded dark**. Every class needs theme conversion.

**Add at top of component:**
```javascript
const tc = useThemeClasses()
const { isDark } = useTheme()
```

**Add imports:**
```javascript
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
```

**Find-and-replace patterns (apply throughout the file):**

| Old (hardcoded dark) | New (theme-aware) |
|----------------------|-------------------|
| `bg-black/70` | `bg-black/50 backdrop-blur-sm` |
| `bg-slate-800 border border-slate-700 rounded-2xl` (modal container) | `${tc.cardBg} border ${tc.border} rounded-2xl` |
| `p-6 border-b border-slate-700` (header) | `p-6 border-b ${tc.border}` |
| `sticky top-0 bg-slate-800` (sticky header bg) | `sticky top-0 ${tc.cardBg}` |
| `text-xl font-semibold text-white` (title) | `text-xl font-bold ${tc.text}` |
| `text-slate-400 hover:text-white text-2xl` (close btn) | `${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} text-2xl` |
| `text-sm text-slate-400 mb-2` (labels) | `text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}` |
| `bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white` (inputs) | `${tc.input} rounded-xl px-4 py-3` |
| `bg-slate-900 rounded-xl` (checkbox row) | `${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl` |
| `text-white` on checkbox label | `${tc.text}` |
| `p-6 border-t border-slate-700` (footer) | `p-6 border-t ${tc.border}` |
| `sticky bottom-0 bg-slate-800` (sticky footer bg) | `sticky bottom-0 ${tc.cardBg}` |
| `px-6 py-2 rounded-xl border border-slate-700 text-white` (cancel btn) | Use Secondary Button pattern from reference |
| `px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold` (submit btn) | Use Primary Button pattern from reference (already close, just verify) |

**Commit:**
```bash
git add -A && git commit -m "Phase 2b: Restyle AddEventModal to design system"
```

---

### Step 3: Restyle `BulkPracticeModal.jsx`

Same pattern as Step 2. This modal is also fully hardcoded dark.

**Add imports and hooks** (same as Step 2).

**Apply the same find-and-replace patterns from Step 2**, plus:

| Old | New |
|-----|-----|
| `bg-slate-900 rounded-xl p-4` (per-day venue config panel) | `${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4` |
| `bg-slate-800 rounded-lg` (individual day config rows) | `${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'} rounded-lg` |
| `bg-slate-900 border border-slate-700 rounded-lg` (small inputs) | `${tc.input} rounded-lg` |
| `text-[var(--accent-primary)] hover:text-yellow-300` (edit preview link) | `text-[var(--accent-primary)] hover:underline` |
| `bg-slate-800 rounded-lg` (preview rows) | `${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'} rounded-lg` |
| `text-sm text-slate-400` (preview text) | `text-sm ${tc.textMuted}` |
| `text-slate-400` in footer count text | `${tc.textMuted}` |
| Day selection buttons inactive: `bg-slate-900 border border-slate-700 text-slate-400 hover:text-white` | `${isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'}` |

**Commit:**
```bash
git add -A && git commit -m "Phase 2c: Restyle BulkPracticeModal to design system"
```

---

### Step 4: Restyle `BulkGamesModal.jsx`

Same pattern. **Add imports/hooks.**

**Apply Step 2 patterns, plus:**

| Old | New |
|-----|-----|
| Table header `text-left text-sm text-slate-400` | `text-left text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}` |
| Table cell inputs `bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm` | `${tc.input} rounded-lg px-2 py-2 text-sm` |
| `border border-dashed border-slate-700` (add row btn) | `border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'} ${tc.textMuted}` |
| `text-red-400 hover:text-red-300` (remove row) | Keep as-is — red works in both themes |

**Commit:**
```bash
git add -A && git commit -m "Phase 2d: Restyle BulkGamesModal to design system"
```

---

### Step 5: Restyle `VenueManagerModal.jsx`

Smallest modal. **Add imports/hooks.**

**Apply Step 2 base patterns, plus:**

| Old | New |
|-----|-----|
| `bg-slate-900 rounded-xl p-4` (venue card) | `${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4` |
| `font-medium text-white` (venue name) | `font-medium ${tc.text}` |
| `text-sm text-slate-400` (venue address) | `text-sm ${tc.textMuted}` |
| `text-xs text-slate-500` (venue notes) | `text-xs ${tc.textMuted}` |
| `border-t border-slate-700` (divider) | `border-t ${tc.border}` |
| `text-sm font-medium text-white` (section title) | `text-sm font-medium ${tc.text}` |
| `w-full px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600` (add venue btn) | `w-full px-4 py-2 rounded-xl transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}` |

**Commit:**
```bash
git add -A && git commit -m "Phase 2e: Restyle VenueManagerModal to design system"
```

---

### Step 6: Restyle `AvailabilitySurveyModal.jsx`

**Add imports/hooks.**

**Apply Step 2 base patterns, plus:**

| Old | New |
|-----|-----|
| `text-sm text-slate-400` (subtitle) | `text-sm ${tc.textMuted}` |
| `text-sm font-medium text-slate-400 mb-3` (section headers) | `text-xs font-semibold uppercase tracking-wider mb-3 ${tc.textMuted}` |
| `bg-slate-900 rounded-xl p-4` (survey cards) | `${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4` |
| `font-medium text-white` (survey title) | `font-medium ${tc.text}` |
| `text-sm text-slate-400` (response count) | `text-sm ${tc.textMuted}` |
| `px-3 py-1 bg-slate-700 rounded-lg text-xs text-white hover:bg-slate-600` (view results btn) | `px-3 py-1 rounded-lg text-xs transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}` |
| `px-3 py-1 bg-blue-500/20 rounded-lg text-xs text-blue-400 hover:bg-blue-500/30` (copy link btn) | Keep as-is — works in both themes |
| `px-3 py-1 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30` (delete btn) | Keep as-is — works in both themes |
| `border-t border-slate-700 pt-6` (create section divider) | `border-t ${tc.border} pt-6` |
| `text-sm font-medium text-white mb-4` (create form header) | `text-sm font-semibold ${tc.text} mb-4` |
| `text-slate-400 hover:text-white mb-4` (back button) | `${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'} mb-4` |
| Heatmap bars — `bg-slate-700 rounded-full` (track background) | `${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full` |
| `text-sm text-white` (slot labels in heatmap) | `text-sm ${tc.text}` |
| `bg-slate-900 rounded-lg p-3` (individual responses) | `${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-lg p-3` |
| `text-white font-medium` (response name) | `${tc.text} font-medium` |
| `text-slate-400 text-xs` (response details) | `text-xs ${tc.textMuted}` |
| Slot row delete buttons + add slot dashed border — same pattern as BulkPractice |

**Commit:**
```bash
git add -A && git commit -m "Phase 2f: Restyle AvailabilitySurveyModal to design system"
```

---

### Step 7: Restyle `EventDetailModal.jsx`

This is the **biggest modal** (1,085 lines). It has tabs, nested panels, roster grids, RSVP buttons, volunteer assignment, game prep — lots of UI.

**Add imports/hooks** at top if not present. This file likely already imports `useAuth` — also add:
```javascript
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
```

And in the component body:
```javascript
const tc = useThemeClasses()
const { isDark } = useTheme()
```

**Apply Step 2 base patterns for the modal shell (overlay, container, header, footer).**

**Additional specific patterns:**

**Modal container:**
```
Old: bg-slate-800 border border-slate-700 rounded-2xl
New: ${tc.cardBg} border ${tc.border} rounded-2xl
```

**Tabs bar:**
```
Old: border-b border-slate-700
New: border-b ${tc.border}
```

**Tab buttons:**
```
Active — keep as-is (accent color based)
Inactive old: text-slate-500 hover:text-gray-300
Inactive new: ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}
```

**Inner info panels (`bg-slate-900 rounded-xl p-4`):**
```
New: ${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4
```

**Section titles (`text-sm font-semibold text-slate-400 uppercase`):**
```
New: text-xs font-semibold uppercase tracking-wider ${tc.textMuted}
```

**DetailItem component** (at bottom of file):
```
Old: text-xs text-slate-500 (label) + text-white font-medium (value)
New: text-xs ${tc.textMuted} (label) + ${tc.text} font-medium (value)
```

**VolunteerSlot component** (at bottom of file):
```
Old: bg-slate-800 rounded-lg (slot row)
New: ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'} rounded-lg
Old: text-slate-400 text-sm (role label)
New: ${tc.textMuted} text-sm
Old: text-emerald-400 text-sm (assigned name)
New: text-emerald-500 text-sm (works both themes)
```

**RSVP buttons** — these use conditional colors (green/red/yellow). Keep the color logic but ensure the inactive state uses theme-aware backgrounds:
```
Old inactive: bg-slate-700 text-slate-400 hover:bg-emerald-500/20
New inactive: ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'} hover:bg-emerald-500/20 hover:text-emerald-500
```
(Apply same pattern for "No" and "Maybe" buttons)

**RSVP summary cards** (grid of 4):
```
Keep the colored backgrounds (emerald-500/10, red-500/10, etc.) — these work in both themes.
Update the border: add `border ${isDark ? 'border-emerald-500/30' : 'border-emerald-200'}` etc.
```

**Roster grid / Player cards** — these use `<PlayerCard>` component which has its own styling. Don't change.

**Volunteer sections** — same inner panel pattern. Update `bg-slate-900` to theme-aware, `bg-slate-800` to theme-aware.

**Volunteer "Sign Up" banner:**
```
Keep the accent-colored background — it works in both themes.
```

**Coach cards:**
```
Old: bg-slate-900 rounded-xl p-4 (coach card)
New: ${isDark ? 'bg-slate-900' : 'bg-slate-50'} rounded-xl p-4
Old: bg-slate-800 (coach avatar row)
New: ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}
```

**Game Prep tab:**
```
Same inner panel pattern — bg-slate-900 → theme-aware.
Keep game status banners (they use colored backgrounds).
```

**Edit form** (when isEditing = true):
```
Same input pattern as AddEventModal — use tc.input.
```

**Footer:**
```
Old: p-4 border-t border-slate-700
New: p-4 border-t ${tc.border}
Old: border border-slate-700 text-white (close/cancel btns)
New: Use Secondary Button pattern
Old: bg-blue-500/20 text-blue-400 (edit btn)
New: Keep as-is — works both themes
```

**IMPORTANT:** This file also contains `<LineupBuilder>` and `<GameCompletionModal>` renders. Those components are restyled separately (Steps 8 & 9). Don't change the props passed to them.

**Commit:**
```bash
git add -A && git commit -m "Phase 2g: Restyle EventDetailModal to design system"
```

---

### Step 8: Restyle `LineupBuilder.jsx`

**Add imports/hooks.**

This component already uses `tc = useThemeClasses()`. Verify all classes use `tc.*` or `isDark` conditionals. Key areas:

| Old | New |
|-----|-----|
| Modal overlay `bg-black/80` | `bg-black/50 backdrop-blur-sm` |
| `${tc.cardBg} rounded-2xl` | Keep — already theme-aware |
| Position grid slots: `bg-[var(--accent-primary)]/20` (filled) | Keep |
| Position grid slots: `${tc.cardBgAlt} border-slate-600 hover:border-slate-400` (empty) | Update: `${isDark ? 'bg-slate-900 border-slate-600 hover:border-slate-400' : 'bg-slate-50 border-slate-300 hover:border-slate-400'}` |
| Player list: `${tc.cardBgAlt} hover:bg-slate-700/50` | Update: `${isDark ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'}` |
| `text-white text-lg` (jersey numbers in slots) | `${tc.text} text-lg` |
| `text-xs text-slate-300` (player name in slot) | `text-xs ${tc.textMuted}` |
| `bg-slate-600` (default avatar) | `${isDark ? 'bg-slate-600' : 'bg-slate-300'}` |
| Footer: `${tc.cardBgAlt} ${tc.text}` (cancel) | Already theme-aware — keep |

**Commit:**
```bash
git add -A && git commit -m "Phase 2h: Restyle LineupBuilder to design system"
```

---

### Step 9: Restyle `GameCompletionModal.jsx`

**Add imports/hooks.**

This is the most complex modal (scoring UI). It already uses `tc = useThemeClasses()`.

**SetScoreInput component** — this is heavily dark-hardcoded:

| Old | New |
|-----|-----|
| `bg-slate-800/50 border-slate-600` (default set wrapper) | `${isDark ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}` |
| `text-white` (set number label) | `${tc.text}` |
| `text-xs text-slate-400` (first-to label + team labels) | `text-xs ${tc.textMuted}` |
| Score inputs: `bg-slate-800 border-slate-600 text-white focus:border-purple-500` | `${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'} focus:border-purple-500` |
| `bg-slate-700 hover:bg-slate-600 text-white` (minus buttons) | `${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${tc.text}` |
| Keep emerald/red colors for won/lost states — they work both themes |

**GameCompletionModal** — main component:

| Old | New |
|-----|-----|
| Modal overlay + container — same Step 2 patterns |
| Step indicators / wizard dots — verify theme-aware |
| Format selection cards: if hardcoded dark, apply card pattern |
| Attendance checkboxes: same checkbox row pattern |
| Badge/recognition section: keep accent colors |
| Summary/confirm step: apply inner panel pattern |

**Commit:**
```bash
git add -A && git commit -m "Phase 2i: Restyle GameCompletionModal to design system"
```

---

### Step 10: Final commit

```bash
git add -A && git commit -m "Phase 2 complete: SchedulePage + all modals restyled to design system"
git push
```

---

## VERIFICATION CHECKLIST

After all restyling, verify in **light mode** (primary target):

- [ ] SchedulePage has white cards on slate-50 background
- [ ] Calendar renders with white background, slate-200 borders
- [ ] Upcoming Games strip matches dashboard card style
- [ ] Filters/view toggle look clean on white
- [ ] Click "Add Events" → AddEventModal has white bg, clean inputs
- [ ] Open Recurring Practice modal → white bg, day pills look correct
- [ ] Open Bulk Games modal → table looks clean
- [ ] Open Venue Manager → white bg
- [ ] Open Availability Survey → white bg, heatmap readable
- [ ] Click an event → EventDetailModal opens with tabs, all readable
- [ ] All tabs (Details, Roster, RSVPs, Volunteers, Coaches, Game Prep) look correct
- [ ] RSVP buttons work and show correct states
- [ ] Edit mode in EventDetailModal has clean form inputs
- [ ] Lineup Builder modal opens with clean styling
- [ ] Game Completion modal (if testable) has readable scoring UI

Then verify in **dark mode**:

- [ ] Toggle to dark mode (if theme toggle exists)
- [ ] All above items still look correct in dark
- [ ] No white text on white backgrounds
- [ ] No dark text on dark backgrounds
- [ ] Borders visible but subtle in both modes

---

## WHAT COMES NEXT

After SchedulePage is fully restyled, move on to:
- Grouping 2: TeamWallPage + ChatsPage
- (Separate handoff doc will be provided)
