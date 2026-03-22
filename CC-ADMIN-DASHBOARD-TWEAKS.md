# CC-ADMIN-DASHBOARD-TWEAKS.md
# Admin Dashboard — Header, Financial Snapshot & Season Card Tweaks

## READ FIRST
1. `CLAUDE.md`
2. `src/pages/dashboard/DashboardPage.jsx` (widget layout definitions, ~line 1467)
3. `src/components/dashboard/OrgHealthHero.jsx` (the dark hero card)
4. `src/components/dashboard/OrgFinancials.jsx` (financial snapshot)
5. `src/components/dashboard/SeasonJourneyList.jsx` (season cards)
6. `src/components/shared/WelcomeBanner.jsx` (greeting text)

## SCOPE
3 targeted UX tweaks to the admin dashboard. No structural changes. No new components. Minimal diffs.

---

## TWEAK 1 — Welcome Message: Single Line + Dynamic Rotation

**Problem:** The greeting in the dark hero header ("Good morning, Admin. You've got 3 items to knock out.") wraps to two lines unnecessarily. It should fit on one line. It should also rotate between a few different contextual messages, not just always say "You've got X items to knock out."

**Files:** `src/components/dashboard/OrgHealthHero.jsx`

The greeting text currently lives in OrgHealthHero. Look at the header section. It currently shows just the org name as an `<h2>`. The "Good morning, Admin. You've got 3 items..." text is actually rendered by the WelcomeBanner widget which sits ABOVE OrgHealthHero in the grid layout.

**Check:** Determine which component actually renders the greeting shown in the screenshot. It could be:
- `WelcomeBanner` (widget id `welcome-banner`, grid position y:0)
- Or it could be baked into OrgHealthHero

Once you find the right component:

### Changes:

**A. Make the greeting fit one line.** The message format should be:
```
{greeting}, {displayName}. {contextual_message}
```
Where the ENTIRE string is short enough to fit one line at typical dashboard width (~800px). Maximum ~60 characters.

**B. Add dynamic contextual messages** that rotate. Replace the static "You've got X items to knock out" with a pool of messages that account for the org's current state:

```javascript
const getContextualMessage = (urgentCount, totalPlayers, totalTeams, upcomingEvents) => {
  const messages = []
  
  // Urgent items
  if (urgentCount > 0) {
    messages.push(`You've got ${urgentCount} item${urgentCount !== 1 ? 's' : ''} to knock out.`)
    messages.push(`${urgentCount} thing${urgentCount !== 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} your attention.`)
  }
  
  // Positive state
  if (urgentCount === 0) {
    messages.push("Everything's looking good.")
    messages.push("All systems running smooth.")
    messages.push("Your club is humming.")
  }
  
  // Season context
  if (upcomingEvents > 0) {
    messages.push(`${upcomingEvents} event${upcomingEvents !== 1 ? 's' : ''} coming up.`)
  }
  
  // Growth
  if (totalPlayers > 0) {
    messages.push(`${totalPlayers} players across ${totalTeams} team${totalTeams !== 1 ? 's' : ''}.`)
  }
  
  // Pick one randomly per session (stable across re-renders)
  return messages[Math.floor(Math.random() * messages.length)] || "Let's see how things are going."
}
```

Use `useMemo` with empty deps to pick one message per mount, so it doesn't flicker on re-renders.

**C. Format:** The greeting + contextual message should render as a SINGLE `<h1>` or `<h2>` on one line with `whitespace-nowrap` and `text-ellipsis overflow-hidden` as safety. Font size should be large enough to be a clear header but small enough to fit one line (aim for `text-xl` or `text-2xl` depending on space). The active season count and date should be a subtle subline below.

**Test:** Verify the greeting fits one line at normal dashboard width. Refresh a few times to see different contextual messages appear.

---

## TWEAK 2 — Header & Financial Snapshot: Always Global (Not Season-Scoped)

**Problem:** The header KPIs and financial snapshot currently change when the admin switches seasons in the filter bar. Carlos wants these to always show GLOBAL org data (all seasons combined), because the season filter should only affect the body content (tabs, tables, team cards), not the header stats.

**Files:** `src/pages/dashboard/DashboardPage.jsx`

### Changes:

**A. Create a separate `globalStats` object** that aggregates across ALL seasons, computed once on initial load. The existing `stats` object (which is season-scoped) continues to power the body widgets.

In the data loading section (around lines 900-1000 where stats are computed), add a separate query or aggregation that computes org-wide totals:

```javascript
// Global stats (all seasons, never changes with filter)
const [globalStats, setGlobalStats] = useState({
  totalTeams: 0,
  totalPlayers: 0,
  totalCoaches: 0,
  totalSeasons: 0,
  totalCollected: 0,
  totalExpected: 0,
  actionItemCount: 0,
})
```

Load this ONCE (not on season change). Query teams, players, coaches across ALL active seasons. For financial data, sum across all seasons.

**B. Pass `globalStats` to the OrgHealthHero widget** instead of the season-scoped stats:

In the `adminWidgets` array (~line 1470), change the OrgHealthHero props:
```javascript
// BEFORE: uses season-scoped stats (totalTeams, totalPlayers, etc.)
// AFTER: uses globalStats for the KPI row

kpis={{
  teams: globalStats.totalTeams,
  players: globalStats.totalPlayers,
  coaches: globalStats.totalCoaches,
  // ... etc using globalStats
}}
```

**C. Pass `globalStats` to the OrgFinancials widget** (~line 1474):
```javascript
// BEFORE:
component: <OrgFinancials stats={stats} onNavigate={onNavigate} />

// AFTER:
component: <OrgFinancials stats={globalStats} onNavigate={onNavigate} />
```

The `globalStats` object should have the same property names as `stats` so OrgFinancials doesn't need internal changes.

**D. The season filter** continues to affect everything else: teams table, events, registration numbers in the body area. Only the hero KPIs and financial snapshot become global.

**E. Update the greeting subline** to show the global context:
```
6 active seasons · Sunday, March 22
```
Instead of the selected season name.

**Test:** Change the season filter dropdown. Verify: header KPIs and financial snapshot do NOT change. Body content (teams table, events, etc.) DOES change.

---

## TWEAK 3 — Season Cards: Add Attention Pill

**Problem:** The season cards (screenshot 3) show season name, date range, team/player counts, and a progress bar. But there's no indication of which seasons have items needing attention (pending registrations, overdue payments, unrostered players, etc.). Admin doesn't know which season to focus on.

**File:** `src/components/dashboard/SeasonJourneyList.jsx` — specifically the `CompactSeasonCard` component.

Also: `src/pages/dashboard/DashboardPage.jsx` — need to pass per-season action item counts to the component.

### Changes:

**A. Compute per-season action item counts** in DashboardPage.jsx.

In the data loading section, after computing `urgentItems` and `actionItems` (around line 1450), also compute per-season counts. You'll need to know which season each action item belongs to. The existing queries for pending registrations, overdue payments, unrostered players, etc. are already season-scoped (they use `selectedSeason`). You need the SAME counts but for EACH season.

Create a map:
```javascript
const [perSeasonActionCounts, setPerSeasonActionCounts] = useState({})
// Shape: { [seasonId]: number }
```

The simplest approach: for each active season, count the number of action-worthy items (pending registrations + unrostered players + overdue payments + unsigned waivers). This can be done with a single query per season, or batched.

**B. Pass `perSeasonActionCounts` to `SeasonJourneyList`:**
```javascript
// In adminWidgets, the season-journey widget:
component: <SeasonJourneyList 
  seasons={allSeasons || seasons || []} 
  sports={sports} 
  teamCounts={teamCountsMap} 
  playerCounts={playerCountsMap} 
  actionCounts={perSeasonActionCounts}  // NEW PROP
  onNavigate={onNavigate} 
/>
```

**C. Update `CompactSeasonCard` to show the attention pill:**

In `SeasonJourneyList.jsx`, update the `CompactSeasonCard` component to accept and display `actionCount`:

```jsx
function CompactSeasonCard({ season, sportName, sportColor, teamCount, playerCount, actionCount = 0, onNavigate }) {
  // ... existing code ...

  return (
    <div className={`${cardBg} rounded-xl p-3`}>
      {/* Row 1: Sport icon + Season name + ACTION PILL */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${sportColor}15` }}>
          {sportIcon}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-r-lg font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {season?.name || 'Season'}
          </p>
          <p className={`text-r-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {teamCount} teams · {playerCount} players
          </p>
        </div>
        {/* ATTENTION PILL */}
        {actionCount > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-500 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {actionCount}
          </span>
        )}
      </div>
      {/* ... rest of card unchanged ... */}
    </div>
  )
}
```

Also update the `SeasonJourneyList` default export to accept and pass `actionCounts`:

```jsx
export default function SeasonJourneyList({ seasons = [], sports = [], teamCounts = {}, playerCounts = {}, actionCounts = {}, onNavigate }) {
  // ... in the map:
  return (
    <CompactSeasonCard
      key={season.id}
      season={season}
      sportName={sportName}
      sportColor={sportColor}
      teamCount={teamCounts[season.id] || 0}
      playerCount={playerCounts[season.id] || 0}
      actionCount={actionCounts[season.id] || 0}  // NEW
      onNavigate={onNavigate}
    />
  )
}
```

**Result:** Each season card shows a red pill with the count of items needing attention (e.g., "3"). Seasons with no issues show no pill. Admin can instantly see which seasons need focus.

**Test:** Verify season cards with pending items show the red pill with correct count. Verify seasons with no issues show no pill. Verify the number matches the actual pending items for that season.

---

## EXECUTION ORDER
1. Tweak 1 (greeting single line + dynamic messages) — smallest diff
2. Tweak 3 (season card attention pill) — medium diff
3. Tweak 2 (global header stats) — largest diff, new data loading

## COMMIT
```bash
git add -A
git commit -m "Admin dashboard: single-line greeting, global header stats, season attention pills"
git push
```

## VERIFICATION CHECKLIST
- [ ] `npm run dev` starts without errors
- [ ] Greeting fits on one line at normal dashboard width
- [ ] Greeting rotates between different contextual messages on refresh
- [ ] Header KPIs show org-wide totals (not season-scoped)
- [ ] Financial snapshot shows org-wide totals
- [ ] Changing season filter does NOT change header or financial snapshot
- [ ] Changing season filter DOES change body content (teams, events, etc.)
- [ ] Season cards with pending items show red attention pill with count
- [ ] Season cards with no issues show no pill
- [ ] Subline shows "X active seasons · [date]" not single season name
