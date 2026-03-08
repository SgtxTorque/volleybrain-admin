# CC-PLAYER-SKILLS-SAVE-FIX.md
## Fix: player_skills Not Updating After Re-Evaluation

**Read `src/pages/roster/RosterManagerPage.jsx` before making changes.**

**Also pull latest: `git pull origin main`**

---

## THE PROBLEM

After re-evaluating players on the 1-10 scale:
- `player_skill_ratings` updates correctly → Coach Dev Card shows new ratings ✅
- `player_evaluations` inserts correctly → Eval history shows new entries ✅  
- `player_skills` does NOT update → Parent card & PlayerCardExpanded still show old values ❌

The `saveEvaluation` function writes to `player_skills` but **does not capture errors** on the insert/update. The operation is failing silently.

---

## ROOT CAUSE

The `player_skills` save block (step 3 in `saveEvaluation`) does this:

```js
// Check for existing row with this player + season
const { data: existingSkills } = await supabase
  .from('player_skills')
  .select('id')
  .eq('player_id', playerId)
  .eq('season_id', selectedSeason.id)
  .limit(1)
  .maybeSingle()

if (existingSkills) {
  // UPDATE existing
  await supabase.from('player_skills').update({...}).eq('id', existingSkills.id)
} else {
  // INSERT new
  await supabase.from('player_skills').insert(skillsRow)
}
```

**Two problems:**
1. Neither the update nor insert captures `{ error }`. If they fail, code continues silently.
2. The existing check filters by `season_id`. If the original row was created WITHOUT `season_id` (or with a different `season_id`), the check returns null → tries to INSERT → likely fails on a unique constraint.

---

## THE FIX

### Fix 1: Replace the player_skills save block in `saveEvaluation`

Find the comment `// 3. Update player_skills for parent/player view compatibility` and replace the ENTIRE block (from there to the `// 4. Save coach note` comment) with:

```js
      // 3. Update player_skills for parent/player view compatibility
      const skillsRow = {
        player_id: playerId,
        season_id: selectedSeason.id,
        sport: 'volleyball',
        passing: ratings.passing || null,
        serving: ratings.serving || null,
        hitting: ratings.attacking || null,
        blocking: ratings.blocking || null,
        setting: ratings.setting || null,
        defense: ratings.defense || null,
        skills_data: skillsJson,
        updated_at: new Date().toISOString(),
      }

      // Find ANY existing player_skills row for this player (with or without season_id)
      const { data: existingSkills, error: findErr } = await supabase
        .from('player_skills')
        .select('id, season_id')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (findErr) console.warn('[EVAL] player_skills lookup error:', findErr.message)

      if (existingSkills) {
        // Update the existing row (also set season_id in case it was null)
        const { error: updateErr } = await supabase
          .from('player_skills')
          .update(skillsRow)
          .eq('id', existingSkills.id)
        
        if (updateErr) {
          console.error('[EVAL] player_skills UPDATE failed:', updateErr.message, updateErr)
        } else {
          console.log('[EVAL] player_skills updated successfully for player:', playerId)
        }
      } else {
        // No row exists at all — insert new
        const { error: insertErr } = await supabase
          .from('player_skills')
          .insert({ ...skillsRow, created_at: new Date().toISOString() })
        
        if (insertErr) {
          console.error('[EVAL] player_skills INSERT failed:', insertErr.message, insertErr)
        } else {
          console.log('[EVAL] player_skills inserted successfully for player:', playerId)
        }
      }
```

**Key changes:**
- Finds existing row by `player_id` only (no `season_id` filter) — catches rows created with null or different season
- Captures `{ error }` on EVERY Supabase call
- Logs success and failure with `[EVAL]` prefix
- Includes `updated_at` in the row data

### Fix 2: Also add error capture to player_skill_ratings and player_evaluations saves

While we're here, add error capture to the other two saves as well:

```js
// For player_evaluations insert:
const { error: evalInsertErr } = await supabase.from('player_evaluations').insert({...})
if (evalInsertErr) console.error('[EVAL] player_evaluations INSERT failed:', evalInsertErr.message)

// For player_skill_ratings update/insert:
if (existing) {
  const { error: ratingUpdateErr } = await supabase.from('player_skill_ratings').update(ratingRow).eq('id', existing.id)
  if (ratingUpdateErr) console.error('[EVAL] player_skill_ratings UPDATE failed:', ratingUpdateErr.message)
} else {
  const { error: ratingInsertErr } = await supabase.from('player_skill_ratings').insert(ratingRow)
  if (ratingInsertErr) console.error('[EVAL] player_skill_ratings INSERT failed:', ratingInsertErr.message)
}
```

### Fix 3: Change skill load queries to order by `updated_at`

In **`PlayerCardExpanded.jsx`** (loadSkills function around line 408):

```js
// FIND:
.order('created_at', { ascending: false })

// REPLACE WITH:
.order('updated_at', { ascending: false, nullsFirst: false })
```

In **`ParentPlayerCardPage.jsx`** (around line 387):

```js
// FIND:
.order('created_at', { ascending: false })

// REPLACE WITH:
.order('updated_at', { ascending: false, nullsFirst: false })
```

### Fix 4: Change PlayerCardExpanded SkillBar color

While in `PlayerCardExpanded.jsx`, fix the amber SkillBar color (around line 135):

```jsx
// FIND:
backgroundColor: '#F59E0B'

// REPLACE WITH:
backgroundColor: '#4BB9EC'
```

### Fix 5: Fix remaining `.single()` calls

In **`PlayerCardExpanded.jsx`** line ~329:

```js
// FIND:
.single()

// REPLACE WITH (for the player_season_stats query):
.maybeSingle()
```

---

## VERIFICATION

After applying fixes:

1. Open browser console (F12)
2. Go to Roster Manager → Evaluate → evaluate ONE player (e.g., Chloe Test) with varied 1-10 ratings
3. Click "Save & Next"
4. **Check console for `[EVAL]` messages:**
   - Should see: `[EVAL] player_skills updated successfully for player: <uuid>`
   - Should NOT see: `[EVAL] player_skills UPDATE failed:` or `INSERT failed:`
5. Close the eval, click Chloe's name → PlayerCardExpanded opens
6. Skills should show new values (e.g., 80, 70, 90 — the 1-10 ratings × 10)
7. SkillBar color should be blue (#4BB9EC), not amber
8. Check parent view for same player — should also show updated values

**If console shows an error message**, screenshot it and share — the error message will tell us exactly what constraint or RLS rule is blocking the save.

```bash
git add -A && git commit -m "Fix: player_skills save — error capture, flexible lookup, load by updated_at" && git push
```

## DO NOT
- DO NOT change how player_skill_ratings or player_evaluations are saved (those work)
- DO NOT change the SpiderChart component
- DO NOT change the evaluation flow UI
- DO NOT change any routing or navigation
