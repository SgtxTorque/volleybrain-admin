# CC-EVAL-SCALE-1-10.md
## Change Evaluation Scale from 1-5 to 1-10 + Fix Display Across All Views

**Read ALL referenced files before making changes.**

---

## OVERVIEW

The evaluation system currently rates skills 1-5. We're changing to **1-10**. The display rules are:

- **Coach views** (Roster Manager, Player Dev Card): Show ratings as **/10** scale (e.g., "7/10", "8.5/10")
- **Parent/Player views** (ParentPlayerCardPage, PlayerCardExpanded): Show ratings as **/100** scale (e.g., "70", "85") — multiply the stored value by 10. This matches the video game "power rating" feel (NBA 2K, Madden)
- **Spider charts**: Use 1-10 scale with `maxValue={10}`
- **Database**: Store raw 1-10 integers in all tables. No conversion on save.

---

## FILE 1: `src/pages/roster/RosterManagerPage.jsx`

### Change 1A: Update rating circles from 5 to 10

Find the skill rating circles in the evaluation card rendering (where it maps `[1, 2, 3, 4, 5]`):

```jsx
// FIND:
{[1, 2, 3, 4, 5].map(n => (

// REPLACE WITH:
{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
```

The circles will be smaller since there are 10. Reduce the size:

```jsx
// FIND (the circle button styling — look for w-9 h-9):
className={`w-9 h-9 rounded-full text-sm font-bold transition ${...}`}

// REPLACE WITH:
className={`w-8 h-8 rounded-full text-xs font-bold transition ${...}`}
```

### Change 1B: Update overall score display

Find where the overall score is displayed (the "Overall: X / 5" section):

```jsx
// FIND:
{overall !== '—' && ' / 5'}

// REPLACE WITH:
{overall !== '—' && ' / 10'}
```

### Change 1C: Update previous eval display

Find where the previous evaluation is shown (the "Previous: ... Overall: X/5" line):

```jsx
// FIND:
Overall: {evalPrevious.overall_score}/5

// REPLACE WITH:
Overall: {evalPrevious.overall_score}/10
```

### Change 1D: Update the Roster Overview skills column

In the overview table, the skill rating column shows "X/5". Find where this displays:

```jsx
// FIND any instance of:
/5

// That's in the context of skill display in the roster table. Change to:
/10
```

Look for where `overall_rating` is displayed in the roster table rows — it likely says something like `{skills.overall_rating}/5` or similar. Change the denominator to 10.

### Change 1E: Update the Player Development Card (slide-out)

In the dev card header stats row, the RATING badge shows "X/5". Change to "X/10".

In the dev card Overview tab, the SpiderChart should use `maxValue={10}`:

```jsx
// FIND:
maxValue={5}

// REPLACE WITH:
maxValue={10}
```

In the Evaluations tab, any display of "X/5" should become "X/10".

### Change 1F: Update saveEvaluation overall_score calculation

The overall score should still be the average of all rated skills, but now on a 1-10 scale:

```jsx
// The calculation is already correct — it averages the ratings.
// Just verify it stores the raw average (e.g., 7.7) not a converted value.
// The overall_score column is integer, so it will round. That's fine.
// Math.round(7.7) = 8 stored in DB.
```

Actually, check the overall_score insert. If it does any `* 2` or `/ 5 * 10` conversion, remove it. The raw average of 1-10 ratings IS the score to store.

---

## FILE 2: `src/components/players/PlayerCardExpanded.jsx`

This is the coach's player card modal. It reads from `player_skills` table.

### Change 2A: The getSkillValue function should multiply by 10 for display

```jsx
// FIND:
const getSkillValue = (value) => {
    if (value === null || value === undefined) return 0
    return value <= 10 ? value * 10 : value
  }

// This is ALREADY CORRECT for the new system.
// A stored value of 7 → 7 * 10 = 70 displayed out of 100.
// A stored value of 10 → 10 * 10 = 100 displayed out of 100.
// Keep this function as-is.
```

### Change 2B: The calculateOverallRating function

```jsx
// FIND the calculateOverallRating function. It should now use the correct column names
// (serving, passing, hitting, blocking, defense, setting).
// The calculation should multiply by 10 to show on 100 scale:

const calculateOverallRating = () => {
    if (!skills) return null
    const skillValues = [
      skills.serving, skills.passing, skills.hitting, 
      skills.blocking, skills.defense, skills.setting
    ].filter(v => v !== null && v !== undefined)
    
    if (skillValues.length === 0) return null
    
    const avg = skillValues.reduce((a, b) => a + b, 0) / skillValues.length
    return Math.round(avg * 10)  // 7.7 avg → 77 displayed
  }
```

### Change 2C: Verify SkillBar rendering uses correct column names

From the previous fix, these should already be `skills.serving`, `skills.passing`, etc. Verify they are. The SkillBar `value` should go through `getSkillValue()` which multiplies by 10, giving the 0-100 display.

---

## FILE 3: `src/pages/parent/ParentPlayerCardPage.jsx`

This is the parent's view of their child's player card. It should show skills out of 100.

### Change 3A: The getSkillValue function

```jsx
// FIND:
const getSkillValue = (v) => (v == null) ? 0 : (v <= 10 ? v * 10 : v)

// This is ALREADY CORRECT. Keep as-is.
// Stored 7 → 7 * 10 = 70 display. 
// Stored 10 → 10 * 10 = 100 display. ✓
```

### Change 3B: Verify skill keys are the DB column names

From the previous fix prompt, the volleyball skills should already be:
```js
skills: ['serving', 'passing', 'hitting', 'blocking', 'defense', 'setting'],
```

If they're still `['serve', 'pass', 'attack', 'block', 'dig', 'set']`, change them now.

### Change 3C: Add skillLabels map if not already present

```js
skillLabels: {
  serving: 'Serve',
  passing: 'Pass',
  hitting: 'Attack',
  blocking: 'Block',
  defense: 'Dig',
  setting: 'Set',
},
```

### Change 3D: Fix SpiderChart in parent view

The SpiderChart should show the 1-10 raw value, NOT the ×10 converted value:

```jsx
// For the SpiderChart data:
data={sc.skills.map(s => ({
  label: sc.skillLabels?.[s] || s.charAt(0).toUpperCase() + s.slice(1),
  value: skills[s] || 0,  // Raw 1-10 value, NO conversion
}))}
maxValue={10}  // Scale is 1-10
```

### Change 3E: SkillBars show 0-100

The SkillBars should continue to use `getSkillValue()` which gives the ×10 (0-100) display:

```jsx
{sc.skills.map(s => (
  <SkillBar 
    key={s} 
    label={sc.skillLabels?.[s] || s} 
    value={getSkillValue(skills[s])}  // ×10 for 0-100 display
    isDark={isDark} 
  />
))}
```

The SkillBar component's maxValue is 100 by default, so a value of 70 fills 70% of the bar. Perfect.

---

## FILE 4: `src/components/charts/SpiderChart.jsx`

The SpiderChart grid rings currently show 5 levels. With maxValue=10, it should show 10 rings (or 5 rings at intervals of 2):

```jsx
// FIND:
const rings = [1, 2, 3, 4, 5].map(level => {

// REPLACE WITH (show rings at 2, 4, 6, 8, 10 — 5 rings for cleanliness):
const ringLevels = Array.from({ length: 5 }, (_, i) => ((i + 1) / 5) * maxValue)
const rings = ringLevels.map(level => {
```

This dynamically creates 5 evenly-spaced rings regardless of maxValue. For maxValue=10: rings at 2, 4, 6, 8, 10. For maxValue=5: rings at 1, 2, 3, 4, 5. Backwards compatible.

---

## FILE 5: `src/components/player/PlayerProfileSidebar.jsx`

Check if this file displays skill ratings anywhere. If it shows an `overallRating` prop, verify it's being passed the correct value. The sidebar likely gets its data from the parent component (PlayerDashboard), so just verify the display label says "/10" or "/100" as appropriate for the player view.

```jsx
// If it shows something like "4.2/5" for overall rating, change to "/10"
// If it shows a number that should be out of 100, verify the ×10 conversion
```

---

## SUMMARY OF SCALE RULES

| Location | Stored Value | Display Value | Format |
|---|---|---|---|
| Database (player_skill_ratings) | 1-10 raw | — | — |
| Database (player_skills) | 1-10 raw | — | — |
| Database (player_evaluations.overall_score) | 1-10 raw | — | — |
| Coach eval flow | — | 1-10 circles | "7/10" |
| Coach roster table | — | X/10 | "8/10" |
| Coach dev card spider chart | — | 1-10 scale | maxValue={10} |
| Coach dev card header | — | X/10 | "8/10" |
| Parent player card skill bars | — | 0-100 (stored × 10) | "70", "85" |
| Parent player card spider chart | — | 1-10 raw | maxValue={10} |
| Player card expanded (coach modal) | — | 0-100 (stored × 10) | "70", "85" |
| Player dashboard sidebar | — | 0-100 (stored × 10) | "70", "85" |

---

## IMPORTANT: Existing evaluation data

Chloe Test was already evaluated on the 1-5 scale. Her stored values are like 3, 4, 5, etc. After this change, those values will display as:
- Coach view: "3/10", "4/10" — looks low but correct for old data
- Parent view: 30, 40, 50 — same as before

This is fine. Once the coach re-evaluates on the 1-10 scale, the new ratings will overwrite the old ones. No data migration needed.

---

## VERIFICATION

1. **Roster Manager → Evaluate tab**: Rating circles show 1 through 10
2. **Rate a player**: Give varied scores (7, 8, 6, 9, etc.), overall shows correctly as X/10
3. **Save evaluation**: Check roster overview shows the rating as X/10
4. **Click player name → Coach modal (PlayerCardExpanded)**: Skills show as 0-100 (70, 80, 60, 90)
5. **Click player name → Dev card slide-out**: Spider chart shows 1-10 scale, header shows X/10
6. **Parent view → Player card**: Skill bars show 0-100 values, spider chart shows 1-10

```bash
git add -A && git commit -m "Scale change: Eval 1-10, coach display /10, parent/player display /100 (2K style)" && git push
```

## DO NOT

- DO NOT change the database schema
- DO NOT add any new npm packages
- DO NOT change the evaluation save logic beyond removing any ×2 or /5 conversions — store raw 1-10
- DO NOT change game stats, achievements, XP, or any other system
- DO NOT change the admin dashboard
