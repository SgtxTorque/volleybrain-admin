# CC-INVESTIGATE-ALL-SEASONS-MISSING.md
# Investigation: "All Seasons" Option Not Appearing in Page-Level Season Selectors

## READ FIRST
1. `CLAUDE.md`
2. `src/contexts/SeasonContext.jsx` — where ALL_SEASONS sentinel should be defined
3. `src/MainApp.jsx` — where header season selector lives
4. `src/pages/dashboard/DashboardPage.jsx` — where dashboard filter bar lives

## PROBLEM
The "All Seasons" option was implemented (commits d66df89 through 6a005a8 on main, now merged into feat/desktop-dashboard-redesign). The dashboard Financial Snapshot header shows "All Seasons" text, so part of it works. But the season selector dropdowns on individual pages (Coach Directory, Payment Admin, Team Management, etc.) do NOT show an "All Seasons" option in their dropdown lists.

Carlos can see the normal season list (Spring Soccer 2026, Soccer Spring 2026, Spring 2 2026, etc.) but no "All Seasons" entry anywhere in those dropdowns.

## INVESTIGATION TASKS

### 1. Find every season selector in the app
Search for ALL `<select>` elements that render season options. There are likely multiple:
- The dashboard filter bar in `DashboardPage.jsx`
- The header-level selector in `MainApp.jsx` (HeaderSeasonSelector)
- Page-level selectors in individual pages (CoachesPage, PaymentsPage, TeamsPage, RegistrationsPage, SchedulePage, etc.)
- Any SeasonFilterBar shared component

```bash
grep -rn "seasons.*map.*option\|\.map.*season.*option\|season.*select\|SeasonFilter\|SeasonSelector\|selectedSeason.*select" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v docs/
```

### 2. Check the SeasonContext
Read `src/contexts/SeasonContext.jsx`. Find:
- Is `ALL_SEASONS` exported?
- Is there an `isAllSeasons()` helper?
- Does the `seasons` array returned by the context include the ALL_SEASONS sentinel?
- Or is it expected that each selector manually prepends the "All Seasons" option?

### 3. Check which selectors got the "All Seasons" option
For each selector found in step 1, check if it includes the ALL_SEASONS option. The Phase 2 commit (1ca3f95) was supposed to add it to "season selectors (admin only)". Which ones did it actually touch?

### 4. Identify the gap
List every season selector that does NOT have the "All Seasons" option, with file and line number.

## FIX

Once you've identified the gap, add the "All Seasons" option to EVERY season selector that an admin can see. The option should:
- Only appear for admin role (not coach, parent, player, team_manager)
- Be the first item in the dropdown
- Use the ALL_SEASONS sentinel value from SeasonContext
- When selected, call `selectSeason(ALL_SEASONS)` from SeasonContext

For page-level selectors that render their own `<select>`, the fix is typically adding one `<option>` at the top:
```jsx
{activeView === 'admin' && (
  <option value={ALL_SEASONS.id}>All Seasons</option>
)}
```

Or if the selector iterates `seasons.map(...)`, prepend the sentinel:
```javascript
const displaySeasons = activeView === 'admin' 
  ? [ALL_SEASONS, ...seasons] 
  : seasons
```

For shared components like `SeasonFilterBar` or `PageShell`, the fix goes in ONE place and propagates everywhere.

## COMMIT
```bash
git add -A
git commit -m "fix: add All Seasons option to all page-level season selectors (admin only)"
git push
```

## VERIFICATION
After fixing, verify the "All Seasons" option appears in the dropdown on:
- [ ] Coach Directory page
- [ ] Payment Admin page  
- [ ] Team Management page
- [ ] Registrations page
- [ ] Schedule page
- [ ] Any other page with a season selector

Report which selectors were missing and what was changed.
