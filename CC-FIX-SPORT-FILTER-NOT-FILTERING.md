# CC-FIX-SPORT-FILTER-NOT-FILTERING.md
# URGENT: Sport filter shows wrong data — teams from ALL sports appear regardless of selection

## PROBLEM
On Team Management page: selecting "Tennis" (which has no seasons) still shows 13 teams. All volleyball, basketball, and soccer teams appear. The sport filter is NOT filtering.

This is likely broken on every page, not just Teams. The sport filter was supposedly wired in the last commit (321ab98) but it's not working.

## ROOT CAUSE (investigate and confirm)
Teams don't have a `sport_id` column. They have `season_id`. The season has `sport_id`. To filter teams by sport, you must:
1. Get all season IDs for the selected sport
2. Filter teams where `season_id` is in that list

If CC's last fix added a sport filter that checks `team.sport_id` directly, that column doesn't exist and the filter silently passes everything through.

## FIX

### Step 1: Understand the data model
```bash
grep -rn "sport_id" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v docs/ | head -30
```

Check: which tables have `sport_id`? Likely only `seasons` and `sports`. Teams connect to sport THROUGH their season.

### Step 2: Fix the sport filter pattern

The correct pattern for filtering ANY table by sport when the table only has `season_id`:

```javascript
// Get season IDs that belong to the selected sport
const sportSeasonIds = (allSeasons || seasons || [])
  .filter(s => selectedSport?.id ? s.sport_id === selectedSport.id : true)
  .map(s => s.id)

// Then filter the data
// Option A: filter in the query (if querying)
if (selectedSport?.id && sportSeasonIds.length > 0) {
  query = query.in('season_id', sportSeasonIds)
} else if (selectedSport?.id && sportSeasonIds.length === 0) {
  // Selected sport has NO seasons — show empty results
  setData([])
  return
}

// Option B: filter after fetch (if data already loaded)
const filtered = data.filter(item => {
  if (!selectedSport?.id) return true // "All Sports" — show everything
  return sportSeasonIds.includes(item.season_id)
})
```

### Step 3: Apply to EVERY page that has a sport filter

Open EVERY page that was marked "Sport filter works? Yes" in the last report. Verify the filter ACTUALLY works by checking the code logic, not just that the code exists.

```bash
grep -rn "selectedSport\|sportFilter\|sport.*filter" src/pages/ --include="*.jsx" | grep -v _archive | grep -v docs/
```

For each page:
1. Open the file
2. Find where `selectedSport` is used
3. Verify it's filtering through `season_id` → `sport_id` join, NOT checking a nonexistent `sport_id` column on the table
4. If the filter is wrong, fix it using the pattern above
5. Test: selecting a sport with no seasons should show ZERO records

### Step 4: Also check the stat cards

On TeamsPage screenshot, the stat cards show "13 TOTAL TEAMS" and "21 ROSTERED PLAYERS" even with Tennis selected. The stat card data must also be filtered by sport, not just the table rows.

### Step 5: Verify

After fixing, these scenarios must work correctly:

- [ ] Teams + "All Seasons" + "Tennis" = 0 teams (no tennis seasons exist)
- [ ] Teams + "All Seasons" + "Volleyball" = only volleyball season teams
- [ ] Teams + "All Seasons" + "All Sports" = all 13 teams
- [ ] Teams + specific season + "All Sports" = only that season's teams
- [ ] Stat cards update to match the filtered data (not showing totals when filtered)
- [ ] Registrations + "All Seasons" + "Baseball" = 0 registrations
- [ ] Coaches + "All Seasons" + "Basketball" = only coaches assigned to basketball teams
- [ ] Every other page with sport filter: wrong sport = correct filtered results or zero

## COMMIT
```bash
git add -A
git commit -m "fix: sport filter wired through season_id→sport_id join on all pages"
git push origin main
```

## REPORT
For each page, confirm: "Selected [sport with no seasons] → showed 0 results: YES/NO"
