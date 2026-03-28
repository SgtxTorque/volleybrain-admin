# CC-INVESTIGATE-CHATS-LEADERBOARDS-LEAK.md
# URGENT: Chats and Leaderboards Still Showing Cross-Org Data

## DO NOT CHANGE CODE. INVESTIGATE AND REPORT ONLY.

## PROBLEM
After fixing 35 queries across 15 files, Registrations is now properly isolated. But Chats and Leaderboards STILL show Account A's data when logged in as Account B.

The fix report listed ChatsPage as "safe/no fix needed." That assessment was WRONG. The fix report listed SeasonLeaderboardsPage as fixed (2 queries). That fix is either not working or incomplete.

## INVESTIGATION 1: ChatsPage — Why Was It Marked Safe?

```bash
# Show the COMPLETE loadChannels function
grep -n "loadChannels\|\.from.*chat\|\.from.*channel\|season_id\|isAllSeasons\|allSeasons" src/pages/chats/ChatsPage.jsx | head -30
```

Read the entire data loading logic in ChatsPage.jsx. Answer:
1. What Supabase queries run when the page loads?
2. Is there a season_id filter on ANY of them?
3. Is there an allSeasons fallback for "All Seasons + no sport"?
4. If ChatsPage loads channels WITHOUT any season or org filter, that's the leak. Show the exact query.

## INVESTIGATION 2: SeasonLeaderboardsPage — Why Is It Still Leaking?

```bash
# Show the data loading functions
grep -n "loadTeams\|loadLeaderboards\|\.from\|season_id\|isAllSeasons\|allSeasons\|player_season_stats" src/pages/leaderboards/SeasonLeaderboardsPage.jsx | head -30
```

Read the data loading logic. Answer:
1. The fix report says 2 queries were patched. Show the EXACT lines that were changed.
2. Are there OTHER queries in this file that weren't patched?
3. Is the `player_season_stats` query filtered by season_id or allSeasons?
4. Show every `.from()` call in the file with its filters.

## INVESTIGATION 3: Any Other Pages Still Leaking?

Do a COMPREHENSIVE check. For every page file, verify that EVERY `.from()` query has either:
- `.eq('season_id', selectedSeason.id)` for specific season
- `.in('season_id', sportSeasonIds)` for sport filter
- `.in('season_id', orgSeasonIds)` for All Seasons + no sport
- `.eq('organization_id', organization.id)` for tables that have that column
- A parent-chain filter (e.g., filtered by team_id where teams are already season-scoped)

```bash
# Find ALL .from() calls across all pages
grep -rn "\.from(" src/pages/ --include="*.jsx" | grep -v _archive | grep -v "// " | wc -l
```

For each one, verify it has an org-scoping filter. List any that DON'T.

## DELIVERABLE

```
## Chats & Leaderboards Leak Investigation

### ChatsPage:
- Queries found: [list each .from() with its filters]
- Leak cause: [exact query that runs unfiltered]
- Fix needed: [exact description]

### SeasonLeaderboardsPage:
- Queries found: [list each .from() with its filters]  
- Previous fix applied correctly: YES/NO
- Additional unpatched queries: [list]
- Fix needed: [exact description]

### Other pages still leaking:
- [list any .from() query without org scoping, or "NONE"]
```

```bash
git add CHATS-LEADERBOARDS-LEAK-REPORT.md
git commit -m "docs: Investigation — why chats and leaderboards still leak"
git push origin main
```
