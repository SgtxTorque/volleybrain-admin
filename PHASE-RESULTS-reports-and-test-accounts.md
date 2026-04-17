# PHASE RESULTS: Reports Empty Data + QA Test Accounts + Data Scrub

**Date:** April 17, 2026
**Spec:** COMBO-SPEC-reports-and-test-accounts.md
**Status:** All parts complete, build passing

---

## Part A: Reports Player Roster Fix

### Root Cause

Two interrelated bugs in `src/pages/reports/ReportsPage.jsx` caused "No data found" when selecting a specific season:

1. **GlobalSeason sync guard (line 82-86):** The `useEffect` that syncs `selectedSeasonId` from `globalSeason` context had a `!selectedSeasonId` guard. If the seasons list loaded first and set a fallback value, the global season sync would never fire — locking the report to the wrong season.

2. **Stale closure in load effect (line 89-95):** The load effect called `setSelectedSeasonId(fallback)` and then `loadReportData()` in the same tick. Since React state updates are asynchronous, `loadReportData()` read `null` from the closure, causing `applySeasonFilter()` to return an unfiltered or all-seasons query instead of the selected season.

### Fix Applied (6 lines changed)

**Fix 1 — Always sync from globalSeason:**
```javascript
// BEFORE:
useEffect(() => {
  if (globalSeason?.id) {
    if (isAllSeasons(globalSeason)) setSelectedSeasonId('all')
    else if (!selectedSeasonId) setSelectedSeasonId(globalSeason.id)
  }
}, [globalSeason?.id])

// AFTER:
useEffect(() => {
  if (globalSeason?.id) {
    setSelectedSeasonId(isAllSeasons(globalSeason) ? 'all' : globalSeason.id)
  }
}, [globalSeason?.id])
```

**Fix 2 — Remove stale closure fallback:**
```javascript
// BEFORE:
useEffect(() => {
  const seasonToLoad = selectedSeasonId || seasons?.[0]?.id
  if (seasonToLoad) {
    if (!selectedSeasonId) setSelectedSeasonId(seasonToLoad)
    loadReportData()
  }
}, [selectedSeasonId, selectedSportId, activeReport, filters, seasons])

// AFTER:
useEffect(() => {
  if (selectedSeasonId) {
    loadReportData()
  }
}, [selectedSeasonId, selectedSportId, activeReport, filters])
```

**Commit:** `55029bd`

### Other Report Types

All report types (Players, Teams, Payments, Outstanding, Schedule, Registrations, Financial, Jerseys, Coaches, Emergency, Season Summary) use the same `applySeasonFilter()` function and `selectedSeasonId` state — so this fix repairs ALL report types, not just Player Roster.

---

## Part B: QA Test Account Creation Script

### Script Location
`scripts/create-qa-test-accounts.mjs`

### How to Run
```bash
node scripts/create-qa-test-accounts.mjs
```

The script reads `.env` for Supabase credentials automatically. If `SUPABASE_SERVICE_ROLE_KEY` is not in `.env`, set it as an environment variable.

### What It Creates

| Role | Email | Password | Org | Notes |
|------|-------|----------|-----|-------|
| Coach | qatestdirector2026+coach@gmail.com | TestCoach2026! | QA Panthers Athletics | Head coach, first team |
| Parent | qatestdirector2026+parent@gmail.com | TestParent2026! | QA Panthers Athletics | Linked to first unlinked player |

### Features
- **Idempotent** — checks for existing accounts before creating
- Looks up QA Panthers org, latest season, and teams automatically
- Creates auth user, profile, user_role, and role-specific records
- Coach: creates coaches row + team_coaches assignment
- Parent: creates families row + links to a player via parent_account_id

### Credentials Doc
`QA-TEST-ACCOUNTS.md` — updated with all account info

**Commit:** `47c806a`

---

## Part C: Data Scrub Script

### Script Location
`scripts/scrub-qa-test-data.mjs`

### How to Run
```bash
# Dry run first (shows changes, modifies nothing):
node scripts/scrub-qa-test-data.mjs --dry-run

# Execute:
node scripts/scrub-qa-test-data.mjs
```

### What It Scrubs

| Table | Field | Old Value | New Value |
|-------|-------|-----------|-----------|
| players | last_name | *Fuentez | Thompson |
| players | parent_name | *Fuentez* | *Thompson* |
| players | parent_email | fuentezinaction@gmail.com | qatestdirector2026+testparent@gmail.com |
| families | name, contact fields | *Fuentez* | *Thompson* |
| families | email fields | fuentezinaction@gmail.com | qatestdirector2026+testparent@gmail.com |
| profiles | full_name | *Fuentez* (non-admin only) | *Thompson* |
| payments | description, notes | *Fuentez* | *Thompson* |

### Safety
- Only modifies records within QA Panthers Athletics org (scoped by season_id or org_id)
- Skips real admin accounts (fuentez.carlos@gmail.com, qatestdirector2026@gmail.com)
- `--dry-run` flag shows every change without executing
- Does NOT touch Black Hornets Athletics or any other org

**Commit:** `48a50e6`

---

## Commits

```
48a50e6  fix: scrub founder surname and email from QA Panthers test data — standing rule compliance
47c806a  feat: create real-domain QA test accounts — coach and parent on Gmail subaddressing
55029bd  fix: Reports Player Roster query — eliminate season sync race condition and stale closure
```

---

## Carlos Action Items

1. **Verify Reports fix:** Go to Reports > Player Roster, select QA Spring 2026 — should show 14 players
2. **Run test account script:** `node scripts/create-qa-test-accounts.mjs`
3. **Run scrub script (dry run first):** `node scripts/scrub-qa-test-data.mjs --dry-run` then without `--dry-run`
4. **Verify coach login:** Log in as `qatestdirector2026+coach@gmail.com` / `TestCoach2026!`
5. **Verify parent login:** Log in as `qatestdirector2026+parent@gmail.com` / `TestParent2026!`
6. **Re-run Cowork specs 2-5** with the new credentials
