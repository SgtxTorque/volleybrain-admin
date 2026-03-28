# CC-CLEANUP-REMAINING-WAIVER-ORGID.md
# Cleanup: 4 Remaining Wrong Table Names + Invalid org_id Filters

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## SCOPE
Fix the 4 remaining issues identified in the previous fix report. Same patterns: wrong table name (`waivers` → `waiver_templates`) and `organization_id` on tables that lack the column.

## PHASE 1: Fix All 4 Files

### 1. `src/pages/settings/SeasonManagementPage.jsx` (lines ~293-294)
- Change `.from('waivers')` → `.from('waiver_templates')`
- If `waiver_signatures` query has `.eq('organization_id', ...)`, remove it (waiver_signatures doesn't have that column — filter by waiver_template_id which is org-scoped)

### 2. `src/pages/dashboard/DashboardPage.jsx` (lines ~655-661)
- Change `.from('waivers')` → `.from('waiver_templates')`
- If `waiver_signatures` query has `.eq('organization_id', ...)`, remove it

### 3. `src/pages/parent/MyStuffPage.jsx` (line ~334)
- Change `.from('waivers')` → `.from('waiver_templates')`

### 4. `src/pages/platform/PlatformOrgDetail.jsx` (line ~607)
- The payments query uses `.eq('organization_id', orgId)` but payments lacks that column
- This is a platform admin page that views a SPECIFIC org's data. The fix: instead of filtering payments by org_id directly, get the org's season IDs first, then filter payments by those season IDs:
```javascript
// Get seasons for this org
const { data: orgSeasons } = await supabase
  .from('seasons')
  .select('id')
  .eq('organization_id', orgId)
const seasonIds = (orgSeasons || []).map(s => s.id)

// Then filter payments through seasons
if (seasonIds.length > 0) {
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('*')
    .in('season_id', seasonIds)
} else {
  // No seasons = no payments
}
```
If this refactor is too complex for this file, wrap the existing query in a try/catch so it degrades gracefully (it may already be wrapped — if so, leave it).

### Commit:
```bash
npm run build
git add src/pages/settings/SeasonManagementPage.jsx src/pages/dashboard/DashboardPage.jsx src/pages/parent/MyStuffPage.jsx src/pages/platform/PlatformOrgDetail.jsx
git commit -m "Cleanup: Fix remaining waiver table names + invalid org_id filters in 4 files"
git push origin main
```

## REPORT
```
Files fixed: X/4
Build: PASS/FAIL
```
