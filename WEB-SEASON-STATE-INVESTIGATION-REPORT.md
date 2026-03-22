# WEB-SEASON-STATE-INVESTIGATION-REPORT

**Date:** 2026-03-22
**Repo:** SgtxTorque/volleybrain-admin
**Branch:** main
**Classification:** Investigation only — no files modified

---

## Phase 1: Global Season State Map

### State Provider
- **File:** `src/contexts/SeasonContext.jsx` (134 lines)
- **Mechanism:** React Context (`createContext` + `useContext`)
- **State shape:**
  ```js
  {
    seasons: Season[],              // Filtered by sport
    allSeasons: Season[],           // All seasons (unfiltered)
    selectedSeason: Season | null,  // Currently selected season object, or null
    selectSeason: (season) => void, // Setter
    loading: boolean,
    refreshSeasons: (selectId?) => Promise<void>
  }
  ```
- **Valid values for `selectedSeason`:** A season object, or `null`
- **No "all" sentinel value exists.** "All Seasons" in the UI maps to `null`.

### Season Selector Components

| Component | File | "All Seasons" support | What it writes |
|-----------|------|-----------------------|----------------|
| **SeasonFilterBar** | `src/components/pages/SeasonFilterBar.jsx` (lines 21-24) | Yes — `<option value="">All Seasons</option>` | `selectSeason(null)` |
| **HeaderSeasonSelector** | `src/components/layout/HeaderComponents.jsx` (lines 79-135) | No | `selectSeason(seasonObject)` |
| **SeasonCarousel** | `src/components/v2/admin/SeasonCarousel.jsx` (line 144) | No — cards only | `onSeasonSelect(season.id)` via props |

**SeasonFilterBar "All Seasons" trace:**
1. User selects `<option value="">All Seasons</option>`
2. `e.target.value` = `""` (empty string)
3. `allSeasons.find(s => s.id === "")` returns `undefined`
4. Falls back: `undefined || null` → `null`
5. `selectSeason(null)` called
6. `selectedSeason` set to `null` in React state

### Dashboard Empty State Condition (Bug 1 Core)

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Lines 778-779:**
```js
if (!seasonLoading && !selectedSeason) {
  return <GettingStartedGuide onNavigate={onNavigate} />
}
```
- **Trigger:** `selectedSeason === null` AND loading is done
- **Result:** Renders "Welcome to [Org]! Create Your First Season" — even when seasons exist
- **This is the root of Bug 1.** Selecting "All Seasons" anywhere → global state becomes `null` → dashboard shows welcome screen.

### Persistence Mechanism

| Layer | Mechanism | Key | Survives navigation? | Survives refresh? |
|-------|-----------|-----|---------------------|-------------------|
| React Context | In-memory state | N/A | Yes (provider stays mounted) | No |
| localStorage | `vb_selected_season` | Season ID string | Yes | Yes |
| Database | `seasons` table | `status='active'` fallback | Yes | Yes |

**Initialization flow (lines 38-59):**
1. Load all seasons from Supabase `seasons` table
2. Check `localStorage.getItem('vb_selected_season')` — restore if found
3. Fallback: first season with `status === 'active'`
4. Fallback: first season in list
5. Fallback: `null`

**Critical persistence bug:**
```js
function selectSeason(season) {
  setSelectedSeason(season)           // Line 72 — accepts null
  if (season?.id) {                   // Line 73
    localStorage.setItem('vb_selected_season', season.id)  // Line 74
  }
  // When season is null, localStorage is NOT cleared!
  // Old season ID persists in localStorage.
}
```
- Selecting "All Seasons" sets state to `null` but does NOT clear localStorage
- On next refresh, the old season is restored from localStorage
- "All Seasons" selection doesn't survive refresh — inconsistent behavior

### Season State Consumer Map (43 files)

| Page | File | Reads from | Null behavior | Vulnerable? |
|------|------|-----------|---------------|-------------|
| Admin Dashboard | `pages/dashboard/DashboardPage.jsx` | `useSeason()` | Shows GettingStartedGuide | **YES** |
| Teams | `pages/teams/TeamsPage.jsx` | `useSeason()` | Shows "select a season" / auto-selects | **YES** |
| Coaches | `pages/coaches/CoachesPage.jsx` | `useSeason()` | Shows "select a season to manage coaches" | **YES** |
| Payments | `pages/payments/PaymentsPage.jsx` | `useSeason()` | Shows "select a season from the sidebar" | **YES** |
| Attendance | `pages/attendance/AttendancePage.jsx` | `useSeason()` | Shows "No Season Selected" | **YES** |
| Jerseys | `pages/jerseys/JerseysPage.jsx` | `useSeason()` | Shows "No Season Selected" | **YES** |
| Schedule | `pages/schedule/SchedulePage.jsx` | `useSeason()` | No data loads, empty (silent) | No |
| Registrations | `pages/registrations/RegistrationsPage.jsx` | `useSeason()` | No data loads (silent) | No |
| Blasts | `pages/blasts/BlastsPage.jsx` | `useSeason()` | No data loads (silent) | No |
| Chats | `pages/chats/ChatsPage.jsx` | `useSeason()` | No data loads (silent) | No |
| Coach Dashboard | `pages/roles/CoachDashboard.jsx` | `useSeason()` | Loading state indefinitely | Partial |
| Parent Dashboard | `pages/roles/ParentDashboard.jsx` | `useSeason()` | Uses registrationData, not season | Safe |
| Player Dashboard | `pages/roles/PlayerDashboard.jsx` | `useSeason()` | Empty state (graceful) | Safe |
| Leaderboards | `pages/leaderboards/SeasonLeaderboardsPage.jsx` | `useSeason()` | No data loads (silent) | No |
| Stats | `pages/stats/PlayerStatsPage.jsx` | `useSeason()` | No data loads (silent) | No |
| Standings | `pages/standings/TeamStandingsPage.jsx` | `useSeason()` | No data loads (silent) | No |
| Reports | `pages/reports/ReportsPage.jsx` | `useSeason()` | No data loads (silent) | No |

---

## Phase 2: Action Items Count Mismatch

### Season Card Badge Count (the "87")

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Lines:** 140-191

**Data sources:**
1. **Pending registrations** — queries `players` table joined with `registrations`, counts where status is `'pending'`, `'submitted'`, or `'new'`
2. **Unpaid payments** — queries `payments` table, counts where `paid = false`

**Scope:** ALL seasons (global query across every season ID)
**Formula:** `pending_registrations + unpaid_payments` per season
**Stored in:** `perSeasonActionCounts` state map
**Rendered in:** `SeasonCarousel.jsx` line 136: `const actionCount = perSeasonActionCounts[season.id] || 0`

### Action Items Tab Count (the "47")

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Lines:** 800-817

**Data sources (5 categories):**
1. **Overdue payments** — `Math.ceil(stats.pastDue / 100)` (dollar amount divided by 100, not record count)
2. **Pending registrations** — `stats.pending` (count for current season)
3. **Unsigned waivers** — `stats.unsignedWaivers` (expected - signed)
4. **Unrostered players** — `totalPlayers - stats.rosteredPlayers`
5. **Teams without schedule** — `totalTeams - teamsWithSchedule`

**Scope:** Current selected season ONLY, filtered by selected team
**Formula:** Sum of all 5 category counts
**Rendered in:** Line 970: `{ id: 'action-items', label: 'Action Items', badge: actionCount || 0 }`

### Delta Explanation

| Aspect | Season Card Badge (87) | Action Items Tab (47) |
|--------|------------------------|----------------------|
| **Scope** | ALL seasons (global) | Current season only |
| **Team filter** | None | Applies if team selected |
| **Categories counted** | 2 (regs + payments) | 5 (+waivers, +unrostered, +no-schedule) |
| **Payment metric** | Count of unpaid records | `ceil(pastDue_amount / 100)` |
| **Data lines** | 140-191 | 800-817 |

**Why 87 ≠ 47:**
- The "87" is a cross-season total of pending regs + unpaid payments
- The "47" is the current-season total of 5 operational categories
- They measure fundamentally different things using the same visual language (badge count)

### Recommended Fix
- **Option A:** Make them consistent — season card badge should only count items for THAT season (not all), matching what the tab shows
- **Option B:** Clarify the UI — rename the season card badge to "Pending Items" with a tooltip explaining "Pending registrations & unpaid fees for this season"
- **Option C:** Make the tab show all 87 items — extend the action items list to include ALL items from the season card count

---

## Phase 3: All-Role Season State Audit

### Role Dashboard Vulnerability Table

| Role | Dashboard File | Season dependency | Null behavior | Vulnerable? |
|------|---------------|-------------------|---------------|-------------|
| Admin | `pages/dashboard/DashboardPage.jsx` | `useSeason()` — guard at line 778 | Shows GettingStartedGuide | **YES** |
| Coach | `pages/roles/CoachDashboard.jsx` | `useSeason()` — guard at line 310 | Infinite loading | **PARTIAL** |
| Parent | `pages/roles/ParentDashboard.jsx` | Uses `registrationData`, not season | Shows registration CTA | Safe |
| Player | `pages/roles/PlayerDashboard.jsx` | `useSeason()` — guard at line 151 | Empty stats (graceful) | Safe |

### Pages Vulnerable to "All Seasons" Null Corruption

| Page | File | Guard Lines | False Message | Severity |
|------|------|------------|---------------|----------|
| Admin Dashboard | `pages/dashboard/DashboardPage.jsx` | 778-779 | "Welcome! Create Your First Season" | **CRITICAL** |
| Payments | `pages/payments/PaymentsPage.jsx` | 307-313 | "Please select a season from the sidebar" | **CRITICAL** |
| Coaches | `pages/coaches/CoachesPage.jsx` | 160-171 | "Please select a season to manage coaches" | **HIGH** |
| Teams | `pages/teams/TeamsPage.jsx` | 300-334 | "Please select a season from the sidebar" / auto-select | **HIGH** |
| Attendance | `pages/attendance/AttendancePage.jsx` | 177-185 | "No Season Selected" | **HIGH** |
| Jerseys | `pages/jerseys/JerseysPage.jsx` | 397-407 | "No Season Selected" | **HIGH** |

### Pages That Handle Null Safely (Silent Empty)

Schedule, Registrations, Blasts, Chats, Staff, Notifications, Leaderboards, Stats, Standings, Achievements, Season Archives, Reports, Coach Availability, Waivers, Data Export — all use `if (selectedSeason?.id)` guards that prevent data loading but don't show false "create your first season" messages.

### Sidebar vs Per-Page Selector

- **There is no separate sidebar season picker.** The "Please select a season from the sidebar" message on the Payments page is misleading — there's no sidebar.
- The only season selectors are:
  1. **SeasonFilterBar** (page-level dropdown, has "All Seasons" option)
  2. **HeaderSeasonSelector** (top-right header button, NO "All Seasons")
  3. **SeasonCarousel** (admin dashboard cards, NO "All Seasons")
- The message should say "Please select a season from the header" or just "Please select a season"

### SeasonFilterBar Consumers (Pages Where Users Can Trigger the Bug)

These 11 pages include SeasonFilterBar with the "All Seasons" option:
1. Teams
2. Registrations
3. Payments
4. Schedule
5. Blasts
6. Attendance
7. Coaches
8. Jerseys
9. Staff
10. Notifications
11. (DashboardPage uses its own TopBar instead)

Any of these pages can trigger the global null state, affecting all subsequent navigation.

---

## Phase 4: Selected Season Card Styling

### Component Location
**File:** `src/components/v2/admin/SeasonCarousel.jsx` (290 lines)
**Used in:** `src/pages/dashboard/DashboardPage.jsx` (lines 942-952)

### Current Selected vs Unselected Styling

| Property | Unselected | Selected |
|----------|-----------|----------|
| **Background** | `var(--v2-white)` (#FFFFFF) | `var(--v2-white)` (#FFFFFF) — same |
| **Border** | `1px solid var(--v2-border-subtle)` (rgba(16,40,76,0.06)) | `1px solid var(--v2-border-subtle)` — same |
| **Box shadow** | `var(--v2-card-shadow)` (subtle drop shadow) | `0 0 0 2px var(--v2-sky)` (2px sky blue outline) |
| **Selected label** | Not shown | 10px text in `var(--v2-sky)` color (line 178) |
| **Hover shadow** | `0 4px 16px rgba(0,0,0,0.1)` | `0 0 0 2px var(--v2-sky), 0 4px 16px rgba(0,0,0,0.1)` |

### "Selected" Label Code (Lines 176-182)
```jsx
{isSelected && (
  <span style={{
    fontSize: 10, fontWeight: 600, color: 'var(--v2-sky)',
  }}>
    Selected
  </span>
)}
```
- Plain 10px text, no background pill, no icon
- Appears next to the status badge (e.g., "ACTIVE | Selected")

### Design Token Status

**`#4BB9EC` (lynx-sky) IS already defined:**

| Token | File | Value |
|-------|------|-------|
| `--v2-sky` | `src/styles/v2-tokens.css` | `#4BB9EC` |
| `lynx.primary` | `src/constants/theme.js` | `#4BB9EC` |
| `lynx.light` | `src/constants/theme.js` | `#E8F4FD` |
| `lynx.lighter` | `src/constants/theme.js` | `#F0F8FF` |
| `lynx.glow` | `src/constants/theme.js` | `rgba(75, 185, 236, 0.15)` |

### Recommended Changes (Using Existing Tokens)

**In `SeasonCarousel.jsx`, modify card styles (lines 145-154):**

```jsx
// Card container
style={{
  // ... existing styles ...
  background: isSelected ? 'rgba(75, 185, 236, 0.04)' : 'var(--v2-white)',  // Subtle sky tint
  border: isSelected ? '2px solid var(--v2-sky)' : '1px solid var(--v2-border-subtle)',  // Sky border
  boxShadow: isSelected
    ? '0 0 0 2px var(--v2-sky), 0 2px 8px rgba(75, 185, 236, 0.12)'  // Sky glow
    : 'var(--v2-card-shadow)',
  padding: isSelected ? '17px 19px' : '18px 20px',  // Compensate for 2px vs 1px border
}}
```

**Upgrade "Selected" label to pill badge (lines 176-182):**
```jsx
{isSelected && (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
    background: 'rgba(75, 185, 236, 0.15)',
    color: '#0284C7',
    padding: '3px 8px',
    borderRadius: 6,
  }}>
    ✓ Selected
  </span>
)}
```

---

## Summary of Root Causes

### Bug 1 — "All Seasons" corrupts global state
**Root cause:** `selectSeason(null)` is a valid action (triggered by SeasonFilterBar's "All Seasons" option), but the dashboard and 5 other pages treat `null` as "no seasons exist" and show false welcome/empty states.
**Secondary issue:** `selectSeason(null)` doesn't clear localStorage, so the null state doesn't persist through refresh — inconsistent behavior.

### Bug 2 — Payments page loses season context
**Root cause:** Same as Bug 1. Payments page has `if (!selectedSeason)` guard (line 307) that shows "Please select a season from the sidebar." The sidebar reference is incorrect — there is no sidebar season picker.

### Bug 3 — Action Items count mismatch (87 vs 47)
**Root cause:** Season card badge counts 2 categories across ALL seasons (pending regs + unpaid payments = 87). Action Items tab counts 5 categories for CURRENT season only (overdue payments + pending regs + waivers + unrostered + no-schedule teams = 47). Different scope + different categories = different numbers.

### UX Issue — Selected card needs distinction
**Current state:** 2px sky blue outline shadow + 10px "Selected" text. Functional but subtle.
**Recommendation:** Add background tint (`rgba(75, 185, 236, 0.04)`), upgrade border to `2px solid var(--v2-sky)`, and convert "Selected" text to a styled pill badge.
