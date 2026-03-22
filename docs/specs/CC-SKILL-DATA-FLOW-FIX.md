# CC-SKILL-DATA-FLOW-FIX.md
## Fix: Evaluation Skill Ratings Not Appearing on Parent Player Card

**Read all referenced files before making changes.**

---

## THE PROBLEM

Evaluations save to the database successfully. The coach's Roster Manager overview shows "4/5" for evaluated players. The Player Development Card spider chart renders correctly. But the **Parent Player Card** shows all skills as **0**.

---

## ROOT CAUSE

There is a **column name mismatch** between what `saveEvaluation()` writes to the `player_skills` table and what `ParentPlayerCardPage.jsx` reads.

### What gets saved (in RosterManagerPage.jsx saveEvaluation):
```js
const skillsRow = {
  serving: ratings.serving,    // DB column: "serving"
  passing: ratings.passing,    // DB column: "passing"
  hitting: ratings.attacking,  // DB column: "hitting"
  blocking: ratings.blocking,  // DB column: "blocking"
  setting: ratings.setting,    // DB column: "setting"
  defense: ratings.defense,    // DB column: "defense"
}
```

### What the Parent card reads:
```js
// ParentPlayerCardPage.jsx line 26:
skills: ['serve', 'pass', 'attack', 'block', 'dig', 'set']

// Then accesses: skills['serve'], skills['pass'], skills['attack'], etc.
// But DB columns are: serving, passing, hitting, blocking, defense, setting
// skills['serve'] → undefined → 0
```

**The mapping is broken:**

| Parent reads | DB column | Result |
|---|---|---|
| `serve` | `serving` | ❌ undefined → 0 |
| `pass` | `passing` | ❌ undefined → 0 |
| `attack` | `hitting` | ❌ undefined → 0 |
| `block` | `blocking` | ❌ undefined → 0 |
| `dig` | `defense` | ❌ undefined → 0 |
| `set` | `setting` | ❌ undefined → 0 |

---

## THE FIX

Fix the **Parent Player Card** to read the actual database column names. Do NOT change the database columns or the save function — the save is correct. Fix the reading side.

### Fix 1: Update ParentPlayerCardPage.jsx skill key mapping

**File: `src/pages/parent/ParentPlayerCardPage.jsx`**

Find the volleyball sport config (around line 22-27):

```js
// FIND:
skills: ['serve', 'pass', 'attack', 'block', 'dig', 'set'],

// REPLACE WITH:
skills: ['serving', 'passing', 'hitting', 'blocking', 'defense', 'setting'],
```

This makes the parent card read `skills['serving']`, `skills['passing']`, etc. — which matches the actual DB column names.

### Fix 2: Update SkillBar labels to display clean names

The SkillBar component currently does `label.replace(/_/g, ' ')` to clean up labels. But now labels will be "serving", "passing", "hitting", etc. These are fine as-is — they'll display as "Serving", "Passing", "Hitting", etc. after the existing `displayLabel` capitalization. But "hitting" should show as "Attacking" and "defense" should show as "Digging/Dig". 

Add a display name map near the SkillBar component or in the sport config:

```js
// Add a display label map to the volleyball config:
volleyball: {
  // ...existing fields...
  skills: ['serving', 'passing', 'hitting', 'blocking', 'defense', 'setting'],
  skillLabels: {
    serving: 'Serve',
    passing: 'Pass',
    hitting: 'Attack',
    blocking: 'Block',
    defense: 'Dig',
    setting: 'Set',
  },
  // ...rest of config...
}
```

Then update the SkillBar rendering to use the label map:

```jsx
// Where skills are rendered with SkillBar (around line 569):
{sc.skills.map(s => (
  <SkillBar 
    key={s} 
    label={sc.skillLabels?.[s] || s} 
    value={getSkillValue(skills[s])} 
    isDark={isDark} 
  />
))}
```

And update the SpiderChart data mapping too (around line 559-563):

```jsx
<SpiderChart
  data={sc.skills.map(s => ({
    label: sc.skillLabels?.[s] || s.charAt(0).toUpperCase() + s.slice(1),
    value: getSkillValue(skills[s]) / 20,
  }))}
  // ...rest of props
/>
```

### Fix 3: Fix `.single()` → `.maybeSingle()` in parent card

**File: `src/pages/parent/ParentPlayerCardPage.jsx`** (around line 375)

```js
// FIND:
try { const { data } = await supabase.from('player_skills').select('*').eq('player_id', playerId).order('created_at', { ascending: false }).limit(1).single(); setSkills(data || null) }
catch { setSkills(null) }

// REPLACE WITH:
try { 
  const { data, error } = await supabase
    .from('player_skills')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) console.warn('player_skills query:', error.message)
  setSkills(data || null) 
} catch (err) { 
  console.warn('player_skills load error:', err)
  setSkills(null) 
}
```

### Fix 4: Update other sport configs to match DB columns

Check each sport config in the `SPORT_CONFIGS` object. If any other sport uses short keys (like 'serve' instead of 'serving'), update them to match the actual `player_skills` table columns. Since `player_skills` has a `skills_data` jsonb column, sports other than volleyball could use that. But for now, only update volleyball since that's what's being used.

### Fix 5: Update the `saveEvaluation` `.single()` calls 

In `RosterManagerPage.jsx`, the `saveEvaluation` function has `.single()` calls at lines ~452 and ~480 for checking existing records. If these weren't already changed to `.maybeSingle()` in the previous fix, change them now:

```js
// For player_skill_ratings check:
.maybeSingle()    // not .single()

// For player_skills check:
.maybeSingle()    // not .single()
```

---

## ALSO: Verify the scale conversion

The evaluation rates skills 1-5. The `player_skills` columns are `integer` type. The `getSkillValue` function in the parent card does:

```js
const getSkillValue = (v) => (v == null) ? 0 : (v <= 10 ? v * 10 : v)
```

This means:
- If rating is 4 (from 1-5 scale), getSkillValue(4) → 4 * 10 = 40 (out of 100)
- The SkillBar shows this as 40% filled

This is correct behavior — a 4/5 rating showing as 80% would be wrong since the bar max is 100 and 4/5 maps to 40/100 with the current scale. But the SpiderChart divides by 20:

```js
value: getSkillValue(skills[s]) / 20  // 40 / 20 = 2 out of maxValue 5
```

This is WRONG. A rating of 4 should show as 4 on a 5-point spider chart, not 2. 

Fix the SpiderChart value calculation:

```jsx
// For the spider chart in the parent card:
data={sc.skills.map(s => ({
  label: sc.skillLabels?.[s] || s.charAt(0).toUpperCase() + s.slice(1),
  value: skills[s] || 0,  // Direct 1-5 value, no conversion needed
}))}
maxValue={5}
```

---

## VERIFICATION

After all fixes:

1. Navigate to Parent view → select a player who has been evaluated (Chloe Test)
2. The Skills section should show actual values (e.g., Serve: 4, Pass: 4, Attack: 3, etc.)
3. The SkillBar labels should show "Serve", "Pass", "Attack", "Block", "Dig", "Set"
4. The SpiderChart (if visible) should correctly represent skill ratings on the 1-5 scale
5. No console 400 errors from player_skills query
6. Players without evaluations should still show "0" or "No skill ratings yet" gracefully

```bash
git add -A && git commit -m "Fix: Skill data flow to parent card — column name mapping + scale fix" && git push
```

---

## FIX 6: Update PlayerCardExpanded.jsx (Coach Player Card Modal)

**File: `src/components/players/PlayerCardExpanded.jsx`**

This is the modal that appears when a coach clicks a player's name from the roster overview or attendance page. It has THE SAME BUG — it reads `skills.serve`, `skills.pass`, etc. instead of the actual DB column names.

### Fix the loadSkills query (around line 408):

Change `.single()` to `.maybeSingle()`:

```js
// FIND:
.single()

// REPLACE WITH:
.maybeSingle()
```

### Fix the calculateOverallRating function (around line 454-459):

```js
// FIND:
const skillValues = [
  skills.serve, skills.pass, skills.attack, 
  skills.block, skills.dig, skills.set
].filter(v => v !== null && v !== undefined)

// REPLACE WITH:
const skillValues = [
  skills.serving, skills.passing, skills.hitting, 
  skills.blocking, skills.defense, skills.setting
].filter(v => v !== null && v !== undefined)
```

### Fix the SkillBar rendering (around line 746-751):

```jsx
// FIND:
<SkillBar label="Serve" value={getSkillValue(skills.serve)} theme={theme} />
<SkillBar label="Pass" value={getSkillValue(skills.pass)} theme={theme} />
<SkillBar label="Attack" value={getSkillValue(skills.attack)} theme={theme} />
<SkillBar label="Block" value={getSkillValue(skills.block)} theme={theme} />
<SkillBar label="Dig" value={getSkillValue(skills.dig)} theme={theme} />
<SkillBar label="Set" value={getSkillValue(skills.set)} theme={theme} />

// REPLACE WITH:
<SkillBar label="Serve" value={getSkillValue(skills.serving)} theme={theme} />
<SkillBar label="Pass" value={getSkillValue(skills.passing)} theme={theme} />
<SkillBar label="Attack" value={getSkillValue(skills.hitting)} theme={theme} />
<SkillBar label="Block" value={getSkillValue(skills.blocking)} theme={theme} />
<SkillBar label="Dig" value={getSkillValue(skills.defense)} theme={theme} />
<SkillBar label="Set" value={getSkillValue(skills.setting)} theme={theme} />
```

---

## COMPLETE LIST OF FILES TO MODIFY

1. **`src/pages/parent/ParentPlayerCardPage.jsx`** — Fix volleyball skill keys, add skillLabels map, fix SpiderChart scale, fix `.single()` → `.maybeSingle()`
2. **`src/components/players/PlayerCardExpanded.jsx`** — Fix skill column names in calculateOverallRating, SkillBar rendering, and loadSkills query
3. **`src/pages/roster/RosterManagerPage.jsx`** — Verify `.maybeSingle()` in saveEvaluation (may already be done)

---

## DO NOT

- DO NOT change the `player_skills` database table schema
- DO NOT change how `saveEvaluation` writes to `player_skills` — the save is correct
- DO NOT change the Roster Manager overview or evaluation flow  
- DO NOT change the coach Player Development Card slide-out panel — it reads from `player_skill_ratings` which works correctly
