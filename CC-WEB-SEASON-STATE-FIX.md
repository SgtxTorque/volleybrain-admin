# CC-WEB-SEASON-STATE-FIX.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main
# Reference: WEB-SEASON-STATE-INVESTIGATION-REPORT.md

---

## CRITICAL RULES

- **Pre-read `CC-LYNX-RULES.md` and `AGENTS.md`** before starting if they exist in this repo.
- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report — do not improvise.

---

## OVERVIEW

This spec fixes 4 issues found in the investigation:

1. **"All Seasons" filter corrupts global state** — selecting "All Seasons" on any of 11 pages sets `selectedSeason` to null, causing the dashboard and 5 other pages to show false "create your first season" / "select a season" empty states.
2. **Action Items count mismatch** — season card badge (87) counts different things than the Action Items tab (47). Different scope, different categories.
3. **Selected season card needs visual distinction** — currently too subtle.
4. **Misleading empty state messages** — "Please select a season from the sidebar" references a sidebar that doesn't exist.

---

## PHASE 1 — Fix Season State: Remove "All Seasons" + Guard Against Null

**Strategy:** Remove the "All Seasons" option from SeasonFilterBar so users can't set global state to null. Also add a safety guard in `selectSeason()` so that even if null somehow gets passed, it falls back to the previously selected season instead of corrupting state.

### File 1: `src/components/pages/SeasonFilterBar.jsx`

**Change:** Remove the "All Seasons" `<option>` from the season dropdown.

Find the `<option>` element that renders "All Seasons" (around lines 21-24). It looks like:
```jsx
<option value="">All Seasons</option>
```

**Remove that line entirely.** The dropdown should only show actual season options.

Also check the `onChange` handler for the season dropdown. If it has a fallback for empty string that calls `selectSeason(null)`, that codepath is now dead — but leave it for safety. The important thing is the "All Seasons" option is gone from the UI.

### File 2: `src/contexts/SeasonContext.jsx`

**Change 1:** Guard `selectSeason` against null when seasons exist.

Find the `selectSeason` function (around line 72). Currently:
```js
function selectSeason(season) {
  setSelectedSeason(season)
  if (season?.id) {
    localStorage.setItem('vb_selected_season', season.id)
  }
}
```

Replace with:
```js
function selectSeason(season) {
  // Guard: if null is passed but seasons exist, keep current selection
  if (!season && seasons.length > 0) {
    console.warn('[SeasonContext] Attempted to set season to null while seasons exist. Ignoring.')
    return
  }
  setSelectedSeason(season)
  if (season?.id) {
    localStorage.setItem('vb_selected_season', season.id)
  }
}
```

This is a safety net. With "All Seasons" removed from the UI, this should never fire in normal usage — but it prevents the state corruption if null leaks in from anywhere else.

### Files to change:
1. `src/components/pages/SeasonFilterBar.jsx`
2. `src/contexts/SeasonContext.jsx`

### Verification:
```bash
# Confirm "All Seasons" option is removed
grep -rn "All Seasons" src/components/pages/SeasonFilterBar.jsx
# Should return nothing

# Confirm guard exists in SeasonContext
grep -n "Attempted to set season to null" src/contexts/SeasonContext.jsx
# Should return the console.warn line

# Confirm selectSeason still works for valid seasons
grep -A 10 "function selectSeason" src/contexts/SeasonContext.jsx
# Should show the new guarded version
```

### Commit message:
```
fix: remove "All Seasons" option and guard selectSeason against null

- Removed "All Seasons" option from SeasonFilterBar dropdown to prevent
  global season state from being set to null
- Added null guard in SeasonContext.selectSeason() so that null is
  rejected when seasons exist
- Fixes: dashboard showing "Create Your First Season" after selecting
  All Seasons, Payments/Coaches/Teams/Attendance/Jerseys pages showing
  false empty states
```

---

## PHASE 2 — Fix Action Items Count Mismatch

**Strategy:** Make the season card badge count match what the Action Items tab shows. The card badge should count items for THAT specific season only (not all seasons), using the same 5 categories the tab uses.

### File: `src/pages/dashboard/DashboardPage.jsx`

**Change:** Rewrite the `perSeasonActionCounts` calculation (around lines 140-191).

Currently, it queries pending registrations + unpaid payments across ALL seasons and maps counts per season. This needs to be replaced so that each season's badge count reflects the same 5 categories shown in the Action Items tab for that season:

1. Overdue payments (for that season)
2. Pending registrations (for that season)
3. Unsigned waivers (for that season)
4. Unrostered players (for that season)
5. Teams without schedule (for that season)

**Important:** The Action Items tab currently computes its count at lines 800-817. Look at how each of those 5 categories is computed for the selected season. The card badge needs to use the same logic, just parameterized per season.

**Implementation approach:**

Find the function/effect that computes `perSeasonActionCounts` (lines 140-191). Replace it with a function that, for each season, computes the same 5 counts the tab uses. If the tab's computation is inline and hard to extract, you may need to extract it into a shared helper function that both the card badge and the tab call.

**If extracting a shared function is complex**, a simpler acceptable approach is: make the card badge query the same 2 categories it currently does (pending regs + unpaid payments) BUT scoped to only that card's season (not all seasons). This alone would fix the biggest confusion. Add a code comment noting that the tab includes 3 additional categories (waivers, unrostered, no-schedule) so counts may still differ slightly.

**Use whichever approach is cleaner to implement.** The goal is: the number on the card should not wildly mismatch the number in the tab. Getting them closer (same-season scope) is the minimum. Making them identical (same categories) is the ideal.

### Verification:
```bash
# Confirm perSeasonActionCounts is now season-scoped
grep -n "perSeasonActionCounts" src/pages/dashboard/DashboardPage.jsx
# Review the updated logic to confirm it's not querying across all seasons
```

### Commit message:
```
fix: scope season card badge counts to individual seasons

- Season card attention badges now count items for that specific season
  only, not across all seasons
- Aligns card badge counts with Action Items tab to prevent confusing
  mismatches (e.g., card showing 87 while tab shows 47)
```

---

## PHASE 3 — Selected Season Card Styling

**Strategy:** Make the selected season card visually pop using lynx-sky blue tokens that already exist.

### File: `src/components/v2/admin/SeasonCarousel.jsx`

**Change 1:** Update card container styles (around lines 145-154).

Find the card's `style` object. For the selected state, apply:
- **Background:** `rgba(75, 185, 236, 0.04)` (very subtle sky tint) for selected, `var(--v2-white)` for unselected
- **Border:** `2px solid var(--v2-sky)` for selected, `1px solid var(--v2-border-subtle)` for unselected
- **Box shadow:** `0 0 0 2px rgba(75, 185, 236, 0.15), 0 2px 8px rgba(75, 185, 236, 0.12)` for selected, existing `var(--v2-card-shadow)` for unselected
- **Padding:** Reduce by 1px on all sides for selected to compensate for the thicker border (so card size doesn't shift). If current padding is `18px 20px`, selected should be `17px 19px`.

**Change 2:** Upgrade "Selected" label to a pill badge (around lines 176-182).

Replace the current plain text:
```jsx
{isSelected && (
  <span style={{
    fontSize: 10, fontWeight: 600, color: 'var(--v2-sky)',
  }}>
    Selected
  </span>
)}
```

With a styled pill:
```jsx
{isSelected && (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: 'rgba(75, 185, 236, 0.15)',
    color: '#0284C7',
    padding: '3px 8px',
    borderRadius: 6,
    lineHeight: 1,
  }}>
    Selected
  </span>
)}
```

### Files to change:
1. `src/components/v2/admin/SeasonCarousel.jsx`

### Verification:
```bash
# Confirm selected styling uses sky tokens
grep -n "v2-sky\|4BB9EC\|0284C7" src/components/v2/admin/SeasonCarousel.jsx
# Should find references in card styles and pill badge
```

### Commit message:
```
style: add lynx-sky blue selected state to season cards

- Selected season card now has sky blue border, subtle background tint,
  and blue glow shadow for immediate visual distinction
- Upgraded "Selected" text to a styled pill badge with sky background
```

---

## PHASE 4 — Fix Misleading Empty State Messages

**Strategy:** Update empty state messages across all vulnerable pages to remove references to a non-existent "sidebar" and provide accurate, helpful guidance.

### File 1: `src/pages/payments/PaymentsPage.jsx`
Find the empty state message (around line 307-313) that says "Please select a season from the sidebar."
Change to: **"Please select a season to view payments."**

### File 2: `src/pages/coaches/CoachesPage.jsx`
Find the message (around line 160-171) that says "Please select a season to manage coaches" or similar.
If it references "sidebar", change it. If it already says "select a season to manage coaches", leave it — that's fine.

### File 3: `src/pages/teams/TeamsPage.jsx`
Find the empty state message (around line 300-334). If it references "sidebar", change to: **"Please select a season to manage teams."**

### File 4: `src/pages/attendance/AttendancePage.jsx`
Find the message (around line 177-185). If it says "No Season Selected", that's acceptable. If it references "sidebar", fix it.

### File 5: `src/pages/jerseys/JerseysPage.jsx`
Find the message (around line 397-407). Same rule — no "sidebar" references.

### File 6: `src/pages/dashboard/DashboardPage.jsx`
The GettingStartedGuide at lines 778-779 should now be unreachable (Phase 1 prevents null). But as a safety net, check the GettingStartedGuide component. If it renders a "Welcome! Create Your First Season" message AND there's no way it could legitimately show (i.e., the only trigger was `selectedSeason === null`), leave it as-is — it's now dead code protected by the Phase 1 guard. Do NOT remove it, as it's still needed for genuinely new orgs with zero seasons.

### Verification:
```bash
# Confirm no "sidebar" references remain in empty state messages
grep -rn "from the sidebar\|from sidebar" src/pages/
# Should return nothing (or only in unrelated contexts)
```

### Commit message:
```
fix: update misleading "select from sidebar" empty state messages

- Removed references to non-existent sidebar season picker
- Updated Payments, Coaches, Teams, Attendance, Jerseys pages with
  accurate "select a season" messaging
```

---

## PHASE 5 — Final Verification

Run these checks after all phases are committed:

```bash
# 1. No "All Seasons" option in filter bar
grep -rn "All Seasons" src/components/pages/SeasonFilterBar.jsx

# 2. Null guard in SeasonContext
grep -A 8 "function selectSeason" src/contexts/SeasonContext.jsx

# 3. No "sidebar" in empty state messages
grep -rn "from the sidebar\|from sidebar" src/pages/

# 4. Selected card uses sky blue
grep -n "v2-sky\|4BB9EC\|0284C7" src/components/v2/admin/SeasonCarousel.jsx

# 5. Action counts are season-scoped
grep -B 5 -A 10 "perSeasonActionCounts" src/pages/dashboard/DashboardPage.jsx

# 6. TypeScript/build check (if applicable)
npm run build 2>&1 | tail -20
```

Produce a `WEB-SEASON-STATE-FIX-VERIFICATION.md` with the output of each check and confirmation that all phases passed.

### Commit message (if verification report is committed):
```
docs: add season state fix verification report
```

---

## FILES CHANGED SUMMARY

| Phase | File | Change |
|-------|------|--------|
| 1 | `src/components/pages/SeasonFilterBar.jsx` | Remove "All Seasons" option |
| 1 | `src/contexts/SeasonContext.jsx` | Add null guard to selectSeason |
| 2 | `src/pages/dashboard/DashboardPage.jsx` | Scope card badge counts to individual seasons |
| 3 | `src/components/v2/admin/SeasonCarousel.jsx` | Add sky blue selected state + pill badge |
| 4 | `src/pages/payments/PaymentsPage.jsx` | Fix "sidebar" message |
| 4 | `src/pages/coaches/CoachesPage.jsx` | Fix "sidebar" message (if present) |
| 4 | `src/pages/teams/TeamsPage.jsx` | Fix "sidebar" message (if present) |
| 4 | `src/pages/attendance/AttendancePage.jsx` | Fix "sidebar" message (if present) |
| 4 | `src/pages/jerseys/JerseysPage.jsx` | Fix "sidebar" message (if present) |
