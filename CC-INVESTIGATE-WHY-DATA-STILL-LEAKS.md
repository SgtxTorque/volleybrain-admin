# CC-INVESTIGATE-WHY-DATA-STILL-LEAKS.md
# CRITICAL INVESTIGATION: Why Is Cross-Org Data STILL Leaking?

## DO NOT CHANGE ANY CODE. INVESTIGATE AND REPORT ONLY.

## CONTEXT
We have attempted to fix the cross-org data leak THREE times:
1. Added `.eq('organization_id', ...)` → broke pages because tables don't have that column
2. Removed those filters → data loads but org isolation gone
3. Tables rely on `season_id` filtering, but Account B can see Account A's registrations, leaderboards, and chats

The client-side approach of filtering by `season_id` has FAILED. We need to understand exactly WHY Account B sees Account A's data so we can determine the correct fix.

---

## INVESTIGATION 1: How Does SeasonContext Load Seasons?

```bash
cat src/contexts/SeasonContext.jsx
```

Answer these questions:
1. When a user logs in, how are seasons loaded? What query runs?
2. Does the season query filter by `organization_id`?
3. If "All Seasons" is selected, what happens to the season_id filter on data queries?
4. Is there ANY moment during login where seasons from the PREVIOUS user could still be in state?
5. When the user switches from Account A to Account B, does SeasonContext RELOAD seasons for the new org, or does it keep the old ones?

## INVESTIGATION 2: Trace the Exact Data Path for Registrations

The Registrations page is the confirmed leak. Trace the EXACT query:

```bash
grep -n "\.from\|\.select\|\.eq\|\.in\|\.order" src/pages/registrations/RegistrationsPage.jsx | head -20
```

1. What table is queried?
2. What filters are applied?
3. Where does `selectedSeason` come from?
4. If `selectedSeason` is null or 'all', what filter is applied?
5. Is there an `organization_id` filter? (There shouldn't be — we removed it because the column doesn't exist)
6. Is there a `season_id` filter? What value does it use?
7. Could that `season_id` value EVER be a season from another organization?

## INVESTIGATION 3: Check What Happens With "All Seasons" Selected

When "All Seasons" is selected (`selectedSeason.id === 'all'`):

```bash
grep -rn "isAllSeasons\|selectedSeason.*all\|season_id.*all\|!selectedSeason\|selectedSeason === null" src/pages/registrations/RegistrationsPage.jsx
```

1. Does the Registrations query SKIP the season_id filter entirely when "All Seasons" is active?
2. If yes, what ELSE filters the data by organization? (Answer: probably nothing)
3. This would mean "All Seasons" + no org_id column = queries return ALL data from ALL orgs

## INVESTIGATION 4: Check What Tables ACTUALLY Have organization_id

Run this DIRECTLY against the database schema files:

```bash
# Check the ACTUAL schema reference (not the outdated DATABASE_SCHEMA.md)
cat SCHEMA_REFERENCE.csv | head -5
grep "organization_id" SCHEMA_REFERENCE.csv

# Also check SUPABASE_SCHEMA.md
grep -B2 "organization_id" SUPABASE_SCHEMA.md
```

List EVERY table that has `organization_id` and EVERY table that doesn't.

## INVESTIGATION 5: Check if RLS Policies Exist

```bash
# Search for any RLS policy references in the codebase
grep -rn "RLS\|rls\|row.*level.*security\|policy\|policies" src/ docs/ *.md --include="*.md" --include="*.sql" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | grep -v _archive | head -20
```

Are there any existing RLS policies? Were they disabled at some point?

## INVESTIGATION 6: The Registrations Query — Full Trace

Read the ENTIRE `loadRegistrations` function in RegistrationsPage.jsx. Copy the full function here. Then trace:
1. What org/season values are available when this function runs?
2. Is `organization.id` available? (from useAuth)
3. Could we filter the `players` table by joining through `seasons` → `organization_id`?

For example: 
```sql
-- Can we do this?
SELECT * FROM players 
WHERE season_id IN (SELECT id FROM seasons WHERE organization_id = 'xxx')
```

In Supabase JS this would be:
```javascript
// First get the org's season IDs
const { data: orgSeasons } = await supabase
  .from('seasons')
  .select('id')
  .eq('organization_id', organization.id)
const seasonIds = orgSeasons.map(s => s.id)

// Then query players filtered to those seasons only
const { data: players } = await supabase
  .from('players')
  .select('*')
  .in('season_id', seasonIds)
```

Is this approach viable for ALL affected tables?

## INVESTIGATION 7: What's the Fastest Path to Real Isolation?

Evaluate these three options and recommend one:

**Option A: Parent-chain filtering (client-side)**
- On every page, first query org's season IDs, then use `.in('season_id', orgSeasonIds)` 
- Pros: No database changes needed
- Cons: Still client-side, adds extra query per page, race conditions still possible

**Option B: Add organization_id column to missing tables (schema migration)**
- Add `organization_id` column to: teams, coaches, players, payments, schedule_events, chat_channels
- Backfill existing rows from their season's org_id
- Then add `.eq('organization_id', ...)` filters
- Pros: Simple filters, no joins needed
- Cons: Requires DB migration, must coordinate with mobile app, backfill needed

**Option C: Supabase Row Level Security (server-side)**
- Create RLS policies on every table that restrict access based on the authenticated user's organization
- Policies would join through user_roles → organization_id → seasons → table
- Pros: Server-side enforcement, impossible to bypass from client
- Cons: Complex policy definitions, may impact query performance, needs careful testing

Which option (or combination) is the fastest path to GUARANTEED org isolation?

---

## DELIVERABLE

Produce: `WHY-DATA-LEAKS-REPORT.md` with findings for all 7 investigations.

```bash
git add WHY-DATA-LEAKS-REPORT.md
git commit -m "docs: Root cause investigation — why cross-org data leak persists"
git push origin main
```
