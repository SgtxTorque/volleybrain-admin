# CC-FIX-ADMIN-CHATS.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

Admin users can only see chats for the currently selected season. In reality, conversations span seasons (e.g., "Black Hornets Yellow" chat has been going for 4 seasons). Admins need to see ALL org channels by default, with the option to filter by season if they choose.

This spec has 2 phases:
- Phase 1: Fix `loadChats()` so admins always query all org season IDs (not just selected season)
- Phase 2: Add SeasonFilterBar to ChatsPage so admins can optionally filter by season

**Files touched:**
- `src/pages/chats/ChatsPage.jsx` (both phases)

---

## PHASE 1 — Admin Always Sees All Org Chats

**Goal:** When `activeView` is NOT admin, keep current season-scoped behavior. When admin, always use `orgSeasonIds` (all org seasons) so every channel shows.

### File: `src/pages/chats/ChatsPage.jsx`

**Change 1: Update the query filter logic in `loadChats()` function.**

Find the primary query block (around lines 113-134). It currently looks like this:

```js
let q1 = supabase
  .from('chat_channels')
  .select(`
    *,
    teams (id, name, color, logo_url),
    channel_members (id, user_id, display_name, last_read_at)
  `)
if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
  q1 = q1.eq('season_id', selectedSeason.id)
} else if (sportSeasonIds && sportSeasonIds.length > 0) {
  q1 = q1.in('season_id', sportSeasonIds)
} else {
  // All Seasons + no sport (or any unmatched case) → filter by ALL org season IDs
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  console.log('[ChatsPage q1] selectedSeason:', selectedSeason, 'isAllSeasons:', isAllSeasons(selectedSeason), 'orgSeasonIds:', orgSeasonIds)
  if (orgSeasonIds.length === 0) {
    setChannels([])
    setLoading(false)
    return
  }
  q1 = q1.in('season_id', orgSeasonIds)
}
```

Replace the entire filter block (from `if (!isAllSeasons(selectedSeason)` through the closing `}` of the else) with:

```js
// Admin: always show all org channels regardless of season/sport selection
// Non-admin: respect season + sport filters
const isAdminView = activeView === 'admin'

if (isAdminView) {
  // Admin always sees all org channels — season is a filter, not a gate
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) {
    setChannels([])
    setLoading(false)
    return
  }
  q1 = q1.in('season_id', orgSeasonIds)
} else if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
  q1 = q1.eq('season_id', selectedSeason.id)
} else if (sportSeasonIds && sportSeasonIds.length > 0) {
  q1 = q1.in('season_id', sportSeasonIds)
} else {
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) {
    setChannels([])
    setLoading(false)
    return
  }
  q1 = q1.in('season_id', orgSeasonIds)
}
```

**Change 2: Apply the same pattern to the fallback query (q2).**

Find the fallback query block (around lines 147-160). It has the same 3-branch filter pattern. Apply the identical change: admin always uses `orgSeasonIds`, non-admin keeps the existing season/sport filter logic.

Replace the filter block for q2 with:

```js
if (isAdminView) {
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) {
    setChannels([])
    setLoading(false)
    return
  }
  q2 = q2.in('season_id', orgSeasonIds)
} else if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
  q2 = q2.eq('season_id', selectedSeason.id)
} else if (sportSeasonIds && sportSeasonIds.length > 0) {
  q2 = q2.in('season_id', sportSeasonIds)
} else {
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) {
    setChannels([])
    setLoading(false)
    return
  }
  q2 = q2.in('season_id', orgSeasonIds)
}
```

**Change 3: Remove the stale console.log statements.**

Delete the two `console.log('[ChatsPage q1]...')` and `console.log('[ChatsPage q2]...')` debug lines if they exist. These were debugging aids from the security fix session and should not ship.

### Verification

- `grep -n "isAdminView" src/pages/chats/ChatsPage.jsx` should show 2-3 hits (the const + the two if blocks)
- `grep -c "console.log.*ChatsPage" src/pages/chats/ChatsPage.jsx` should return 0
- No other files changed

### Commit message
```
fix(chats): admin always sees all org channels regardless of season selection
```

---

## PHASE 2 — Add SeasonFilterBar to ChatsPage

**Goal:** Add the existing `SeasonFilterBar` component to the Chats page header area. This gives admins the ability to switch seasons from the Chats page (addressing the "season selector not accessible from every page" UX issue). For non-admin roles, the filter bar is hidden (SeasonFilterBar already handles this internally).

**Important:** This is a visual/UX addition only. Because of Phase 1, the admin query ignores the season selection. The filter bar is here for future use and for non-admin roles that still respect season scoping. Do NOT re-introduce season filtering into the admin query.

### File: `src/pages/chats/ChatsPage.jsx`

**Change 1: Add import for SeasonFilterBar.**

Add this import near the top of the file, after the existing context imports:

```js
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
```

**Change 2: Add SeasonFilterBar above the chat container.**

Find the return statement's outermost `<div>` (the one with `h-[calc(100vh-180px)]`). Wrap it in a fragment and add SeasonFilterBar above it. The result should look like:

```jsx
return (
  <>
    <SeasonFilterBar role={activeView} />
    <div
      className={`h-[calc(100vh-180px)] flex overflow-hidden rounded-[14px] border animate-fade-in ${
        isDark
          ? 'bg-[#132240] border-white/[0.06]'
          : 'bg-white border-[#E8ECF2] shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]'
      }`}
      style={{ fontFamily: 'var(--v2-font)' }}
    >
```

And close with `</>` at the end:

```jsx
    </div>
  </>
)
```

**Important:** The COPPA gate return (around line 279) returns early before this JSX. That's fine, do not move it.

### Verification

- `grep -n "SeasonFilterBar" src/pages/chats/ChatsPage.jsx` should show 2 hits (import + usage)
- The page should render without errors
- Admin should see the season/sport dropdowns above the chat panel
- Parent/player views should NOT see the filter bar (SeasonFilterBar hides itself for non-admin/coach roles)

### Commit message
```
feat(chats): add SeasonFilterBar to ChatsPage for season/sport filtering
```

---

## POST-EXECUTION QA CHECKLIST

1. **Account A (Black Hornets):** Admin should see ALL 9+ chats regardless of which season is selected
2. **Account B (Real Test Athletics):** Admin should see ONLY their own org's chats (zero Black Hornets channels)
3. **Season filter bar:** Should appear above the chat panel for admin view
4. **Coach/Parent/Player view:** Should still see only their team's chats, scoped by season
5. **New Chat modal:** Should still work (creates chat with selected season's teams)
