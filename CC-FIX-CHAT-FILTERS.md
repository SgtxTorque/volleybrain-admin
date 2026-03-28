# CC-FIX-CHAT-FILTERS.md
# Fix Chat Sport & Season Filters
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Fix the sport and season filter on the Chats page so they work correctly for ALL roles, including admin. Currently:

- **Admin:** Both season and sport filters are ignored — admin always loads ALL org channels regardless of filter selection.
- **Non-admin + specific season:** Sport filter is ignored.
- **Non-admin + All Seasons + sport:** Sport filter works (the only working case).

After this fix: selecting a sport filters to only that sport's channels. Selecting a season filters to only that season's channels. Both can be combined. This applies to all roles including admin.

---

## GUARDRAILS

- **Read before modify.** Open ChatsPage.jsx and confirm the query structure before changing it.
- **Do not change the data model.** No new columns, no DB changes. The existing join path (chat_channels.season_id → seasons.sport_id) is sufficient.
- **Do not change the filter UI.** SeasonFilterBar works correctly — the bug is in how ChatsPage uses the selected values.
- **Preserve the client-side filters.** The ALL/UNREAD/TEAMS/DMS tabs and search work fine. Do not touch them.
- **Both query blocks.** The investigation found the same branching logic in TWO query blocks (primary ~lines 114-149 and fallback ~lines 156-179). Fix BOTH identically.
- **Commit after the fix.**

---

## THE FIX

### File: `src/pages/chats/ChatsPage.jsx`

**Step 1:** Open and read the file. Locate:
- The `sportSeasonIds` computation (~line 103-105)
- The primary query branching (~lines 114-149)
- The fallback/duplicate query branching (~lines 156-179)
- The `isAdminView` variable (~line 123)

**Step 2:** Replace the query branching logic in BOTH query blocks. The current logic has an if/else-if chain where admin short-circuits everything. Replace it with a composable approach:

The new logic should be:

```javascript
// Step 1: Start with the base set of season IDs
let targetSeasonIds = null

if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
  // Specific season selected — use just that one
  targetSeasonIds = [selectedSeason.id]
} else {
  // All Seasons — start with all org seasons
  targetSeasonIds = (allSeasons || []).map(s => s.id)
}

// Step 2: If a sport is selected, narrow down to only seasons for that sport
if (selectedSport?.id && targetSeasonIds) {
  const sportFiltered = targetSeasonIds.filter(sid => {
    const season = (allSeasons || []).find(s => s.id === sid)
    return season?.sport_id === selectedSport.id
  })
  targetSeasonIds = sportFiltered
}

// Step 3: Apply the filter
if (targetSeasonIds && targetSeasonIds.length > 0) {
  q1 = q1.in('season_id', targetSeasonIds)
} else {
  // No matching seasons (e.g., sport has no seasons) — return empty
  q1 = q1.in('season_id', ['__none__'])
}
```

This logic works identically for admin and non-admin. The old `isAdminView` branch is removed — admin no longer gets special treatment that bypasses filters. Admin still sees all org channels by default (when "All Seasons" is selected and no sport is picked), but now respects filter selections.

**Step 3:** Remove the old `isAdminView` branching. The `isAdminView` variable may still be needed elsewhere in the file (check before removing the variable declaration). Only remove the query branching that uses it, not the variable itself if it's referenced elsewhere.

**Step 4:** Apply the exact same fix to the second/fallback query block (~lines 156-179). Both blocks must have identical filtering logic.

**Step 5:** Verify the `sportSeasonIds` computation at ~line 103-105 is no longer needed (the new logic computes sport filtering inline). If nothing else references `sportSeasonIds`, remove it to avoid confusion. If it IS referenced elsewhere, leave it.

**Step 6:** Verify the build: `npm run build 2>&1 | tail -20`

**Step 7:** Test scenarios (mentally trace through the code):
- Admin + All Seasons + All Sports → loads all org channels (no filter)
- Admin + All Seasons + Basketball → loads only channels from basketball seasons
- Admin + Spring 2026 + All Sports → loads only Spring 2026 channels
- Admin + Spring 2026 + Basketball → loads only Spring 2026 IF it's a basketball season (otherwise empty)
- Coach + All Seasons + Basketball → loads only basketball channels the coach has access to
- Coach + specific season + no sport → loads only that season's channels

**Commit:** `fix: wire sport and season filters for chat — all roles including admin now respect filter selections`

---

## FILES MODIFIED

| File | What Changes |
|------|-------------|
| `src/pages/chats/ChatsPage.jsx` | Replace query branching logic in both query blocks to respect sport and season filters for all roles |

One file.

---

## WHAT THIS SPEC DOES NOT DO

- Does not change the filter UI (SeasonFilterBar)
- Does not change the data model
- Does not add new sport columns to chat_channels
- Does not touch client-side filters (ALL/UNREAD/TEAMS/DMS/search)
- Does not change any other page's filter behavior
