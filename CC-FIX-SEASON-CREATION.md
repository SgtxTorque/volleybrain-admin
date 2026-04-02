# CC-FIX-SEASON-CREATION.md

## Overview
Fix the HTTP 400 error when creating a new season from the Seasons page. The root cause is empty string `''` values being sent to PostgreSQL date columns, which reject anything that isn't a valid date or `null`.

## Root Cause
In `src/pages/settings/SeasonsPage.jsx`, the `handleSave()` function spreads the raw `form` object directly into the Supabase insert. The `openNew()` function initializes date fields as empty strings (`''`), but PostgreSQL date columns require either a proper date value or `null` — not an empty string.

The `handleClone()` function in the same file already handles this correctly by explicitly setting dates to `null`.

Additionally, the update path (`editingSeason` branch) had no error handling at all — errors were silently swallowed.

## The Fix
Replace the `handleSave()` function in `src/pages/settings/SeasonsPage.jsx` with the version below. The changes are:

1. **Clean empty strings to null** for all date fields and nullable fields before inserting/updating
2. **Add error handling to the update path** (it had none)
3. **Surface actual error messages** in the toast instead of the generic "Error creating season"

### Replace this (around line 114):

```javascript
  async function handleSave() {
    const data = { organization_id: organization.id, ...form }
    if (editingSeason) {
      await supabase.from('seasons').update(data).eq('id', editingSeason.id)
      showToast('Season updated!', 'success')
      setShowModal(false)
      loadSeasons()
      refreshSeasons()
    } else {
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert(data)
        .select()
        .single()

      if (error) {
        showToast('Error creating season', 'error')
        return
      }

      showToast('Season created!', 'success')
      journey?.completeStep('create_season')
      setShowModal(false)
      loadSeasons()
      refreshSeasons(newSeason.id)
    }
  }
```

### With this:

```javascript
  async function handleSave() {
    // Clean form data: convert empty strings to null for date/nullable fields
    // PostgreSQL rejects empty strings ('') for date, integer, and uuid columns
    const dateFields = ['start_date', 'end_date', 'registration_opens', 'registration_closes', 'early_bird_deadline', 'late_registration_deadline']
    const nullableFields = ['sport_id', 'capacity', 'waitlist_capacity', 'registration_template_id', 'registration_config']
    const cleaned = { ...form }
    dateFields.forEach(f => { if (cleaned[f] === '' || cleaned[f] === undefined) cleaned[f] = null })
    nullableFields.forEach(f => { if (cleaned[f] === '' || cleaned[f] === undefined) cleaned[f] = null })

    const data = { organization_id: organization.id, ...cleaned }

    if (editingSeason) {
      const { error } = await supabase.from('seasons').update(data).eq('id', editingSeason.id)
      if (error) {
        console.error('Season update error:', error)
        showToast(`Error updating season: ${error.message}`, 'error')
        return
      }
      showToast('Season updated!', 'success')
      setShowModal(false)
      loadSeasons()
      refreshSeasons()
    } else {
      const { data: newSeason, error } = await supabase
        .from('seasons')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('Season creation error:', error)
        showToast(`Error creating season: ${error.message}`, 'error')
        return
      }

      showToast('Season created!', 'success')
      journey?.completeStep('create_season')
      setShowModal(false)
      loadSeasons()
      refreshSeasons(newSeason.id)
    }
  }
```

## Verification
1. Run `npm run build` — confirm zero errors
2. Open the app → Settings → Seasons → New Season
3. Fill in only the required fields (name + sport) and click Create Season
4. Confirm the season is created without an HTTP 400
5. Create another season with ALL fields filled in (dates, fees, capacity, etc.)
6. Confirm that also works
7. Edit an existing season and save — confirm no errors

## Commit
```
git add src/pages/settings/SeasonsPage.jsx
git commit -m "[fix] Season creation: clean empty strings to null for date fields, add error messages"
```
