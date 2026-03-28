# CC-EMERGENCY-PAGE-VERIFICATION.md
# Emergency: Full Page-by-Page UI Verification

## CONTEXT
After merging feat/desktop-dashboard-redesign into main, UI elements are missing on live pages. The Coach Directory page lost its season filter dropdown. The Registrations page also appears to be missing its season filter. We do NOT know what else is broken. Marisa is testing in under 2 hours.

## PRIORITY: Find every broken page. Fix them. Do NOT guess, do NOT assume.

---

## STEP 1: Inventory Every Page That Should Have a SeasonFilterBar

Search the codebase for every page that imports or renders SeasonFilterBar:
```bash
grep -rn "SeasonFilterBar\|seasonFilterBar\|season-filter" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v docs/
```

Also search for pages that have their OWN season `<select>` (not using the shared component):
```bash
grep -rn "selectedSeason\|selectSeason\|season.*select\|seasons.*map.*option" src/pages/ --include="*.jsx" | grep -v _archive | grep -v docs/
```

List EVERY page file that references seasons or season filtering in any way.

## STEP 2: Verify Each Page Actually Renders Its Filter

For each page found in Step 1, open the file and verify:
1. Is `SeasonFilterBar` imported?
2. Is it actually rendered in the JSX (not commented out, not inside a false conditional)?
3. Does it receive the correct props (`seasons`, `selectedSeason`, `onSeasonChange` or equivalent)?
4. Is the page using `useSeason()` context or receiving season as a prop?

**Create a table:**
```
| Page | File | Has Filter Import? | Renders Filter? | Gets Season Data? | Status |
```

## STEP 3: Check What Changed in Recent Commits

Look at the last 20 commits on main. For each one, check if it modified any page files in a way that could have removed or broken the filter:
```bash
git log --oneline -20
```
For suspicious commits:
```bash
git show <commit-hash> --stat
git show <commit-hash> -- src/pages/coaches/CoachesPage.jsx
```

Specifically check:
- The audit Phase 3 dead code cleanup (did it accidentally delete something used?)
- The All Seasons commits (did they modify page files?)
- The dashboard tweaks (did they change shared components?)

## STEP 4: Fix Every Missing Filter

For each page that SHOULD have a season filter but doesn't:
1. Add the `SeasonFilterBar` import
2. Add the `useSeason()` hook call if missing
3. Render `<SeasonFilterBar />` in the correct position (typically below the page header, above the content)
4. Wire it to the page's data loading (season change should trigger data reload)

If a page previously had a filter and it was accidentally removed, use `git log -p -- <filepath>` to find the commit that removed it and restore the filter rendering code.

## STEP 5: Check for Other Missing UI Elements

While you're in each page, also verify these are present and functional:
- Page title / header
- Breadcrumb
- Action buttons (Export, Add, etc.)
- Data table or content area
- Any stat cards at the top

If ANYTHING looks stripped out or broken, note it.

## STEP 6: Full Build + Page Load Test

```bash
npm run build
```

Then start dev server and load EACH of these pages (just verify they render without blank screen or console errors):
- [ ] /dashboard (admin)
- [ ] /teams
- [ ] /coaches
- [ ] /staff
- [ ] /registrations
- [ ] /payments
- [ ] /jerseys
- [ ] /schedule
- [ ] /schedule/availability
- [ ] /attendance
- [ ] /gameprep
- [ ] /standings
- [ ] /leaderboards
- [ ] /chats
- [ ] /blasts
- [ ] /notifications
- [ ] /reports
- [ ] /reports/funnel
- [ ] /archives
- [ ] /directory
- [ ] /achievements
- [ ] /stats
- [ ] /roster
- [ ] /settings/seasons
- [ ] /settings/templates
- [ ] /settings/waivers
- [ ] /settings/payment-setup
- [ ] /settings/organization
- [ ] /settings/venues
- [ ] /settings/data-export
- [ ] /settings/subscription
- [ ] /profile

For each page: Does it render? Does it have its filter bar (if applicable)? Any console errors?

## STEP 7: Report + Fix + Commit

Report:
```
## Page Verification Report
- Total pages checked: X
- Pages with season filter: X (list)
- Pages missing season filter that should have one: X (list with fix applied)
- Pages with other missing UI: X (list with details)
- Pages with console errors: X (list)
- Build status: PASS/FAIL
```

Commit all fixes:
```bash
git add -A
git commit -m "fix: restore missing season filters and verify all page rendering"
git push origin main
```

## DO NOT SKIP ANY PAGE. CHECK EVERY SINGLE ONE.
