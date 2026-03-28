# CC-FIX-ALL-SEASONS-DATA-AND-SPORT-FILTER.md
# Fix: Pages must show org-wide data with "All Seasons" + sport filter must actually filter

## READ FIRST
1. `CLAUDE.md`
2. Every page file in `src/pages/` that loads data from Supabase

## TWO PROBLEMS TO FIX

### Problem 1: Pages showing "Select a specific season" when they should show ALL data
When admin selects "All Seasons", pages like Team Management, Staff, Schedule, etc. show an empty state telling the admin to pick a season. This is WRONG. These pages should show ALL data across all seasons. Teams exist in seasons, but admins need to see ALL teams when viewing org-wide. Same for staff, schedule events, jerseys, attendance, etc.

**The rule is simple:** When "All Seasons" is selected, skip the `.eq('season_id', ...)` filter and load ALL data for the organization. Every page must do this. No page should ever show a "pick a season" dead end.

### Problem 2: Sport filter dropdown doesn't actually filter data
The sport filter dropdown appears on pages (Registrations, etc.) but selecting a sport (e.g., Basketball, Baseball) does NOT filter the data. All records still show regardless of sport selection. The filter is cosmetic only.

---

## STEP 1: Fix every page to show ALL data when "All Seasons" is selected

For EVERY page that currently has a "Select a specific season" empty state guard, REMOVE that guard and instead make the data loading work without a season_id filter.

Search for every instance:
```bash
grep -rn "Select a specific season\|isAllSeasons.*return\|Select a season to" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v docs/
```

For each page found:

**REMOVE the early return / empty state that blocks rendering when All Seasons is active.**

**CHANGE the data loading function** to conditionally include the season_id filter:
```javascript
// Pattern for EVERY Supabase query that filters by season:
let query = supabase.from('teams').select('*').eq('organization_id', organization.id)

// Only add season filter when a specific season is selected
if (selectedSeason?.id && selectedSeason.id !== 'all') {
  query = query.eq('season_id', selectedSeason.id)
}

const { data, error } = await query.order('name')
```

This applies to ALL tables: teams, staff_members, schedule_events, jerseys, jersey_assignments, games, attendance, coaches, chat_channels, etc.

**Do this for EVERY page.** The list includes but is not limited to:
- TeamsPage.jsx
- StaffPage.jsx
- JerseysPage.jsx
- SchedulePage.jsx
- CoachAvailabilityPage.jsx
- AttendancePage.jsx
- GamePrepPage.jsx
- TeamStandingsPage.jsx
- SeasonLeaderboardsPage.jsx
- ChatsPage.jsx
- BlastsPage.jsx
- NotificationsPage.jsx
- RosterManagerPage.jsx
- ReportsPage.jsx
- RegistrationFunnelPage.jsx

Search comprehensively:
```bash
grep -rn "selectedSeason" src/pages/ --include="*.jsx" -l | grep -v _archive
```

Open EACH file. Find EVERY `.eq('season_id', ...)` call. Make it conditional.

---

## STEP 2: Fix sport filter to actually filter data

Find every page that has a sport filter dropdown. Search:
```bash
grep -rn "selectedSport\|sportFilter\|filterSport\|sport.*filter\|All Sports" src/pages/ --include="*.jsx" | grep -v _archive
```

For each page that has a sport dropdown:

**Verify the sport filter is connected to the data query.** The pattern should be:

```javascript
// After the main query returns data, filter by sport if selected:
let filteredData = data || []

if (selectedSport?.id) {
  // Get team IDs for this sport's seasons
  const sportSeasonIds = (allSeasons || seasons || [])
    .filter(s => s.sport_id === selectedSport.id)
    .map(s => s.id)
  
  filteredData = filteredData.filter(item => 
    sportSeasonIds.includes(item.season_id)
  )
}
```

OR if the table has a direct sport relationship:
```javascript
if (selectedSport?.id) {
  query = query.eq('sport_id', selectedSport.id)
}
```

The sport filter must actually reduce the displayed records to only those belonging to seasons of the selected sport. If you select Baseball and have no baseball seasons, the page should show ZERO records, not all records.

Check EVERY page that has the sport dropdown and verify the filter is wired to the data, not just the UI.

---

## STEP 3: Verify EVERY page works in three states

For each page, verify these three scenarios work:

**A. "All Seasons" + "All Sports"** = shows ALL org data
**B. "All Seasons" + specific sport** = shows only data from that sport's seasons  
**C. Specific season + "All Sports"** = shows only data from that season

If any of these combinations produce wrong results, fix the query logic.

---

## STEP 4: Build, verify, push

```bash
npm run build
```

Must pass.

Start dev server. Spot check:
- [ ] Team Management with "All Seasons" shows ALL teams (not empty state)
- [ ] Staff with "All Seasons" shows ALL staff
- [ ] Schedule with "All Seasons" shows ALL events
- [ ] Jerseys with "All Seasons" shows ALL jersey data
- [ ] Registrations with "All Seasons" + "Basketball" shows ONLY basketball registrations
- [ ] Registrations with "All Seasons" + "Baseball" shows ZERO (no baseball seasons exist)
- [ ] Coaches with "All Seasons" shows ALL coaches
- [ ] Payments with "All Seasons" shows ALL payments
- [ ] No `season_id=eq.all` errors in browser console on ANY page

```bash
git add -A
git commit -m "fix: all pages show org-wide data with All Seasons + sport filter wired to queries"
git push origin main
```

## REPORT
```
| Page | All Seasons works? | Sport filter works? | Notes |
```
