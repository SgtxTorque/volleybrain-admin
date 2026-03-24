# Chats & Leaderboards Leak Investigation

## ChatsPage:

### Queries found:

| # | Table | Lines | Filters |
|---|-------|-------|---------|
| 1 | `chat_channels` (primary, with joins) | 113-127 | `.eq('season_id', selectedSeason.id)` OR `.in('season_id', sportSeasonIds)` — **NO allSeasons fallback** |
| 2 | `chat_channels` (fallback, no joins) | 134-144 | Same as above — **NO allSeasons fallback** |
| 3 | `teams` (lookup by ID array) | 151-154 | `.in('id', teamIds)` — parent-chain safe |
| 4 | `channel_members` (lookup by channel IDs) | 161-164 | `.in('channel_id', channelIds)` — parent-chain safe |
| 5 | `chat_messages` (last msg per channel) | 178-185 | `.eq('channel_id', ch.id)` — parent-chain safe |
| 6 | `chat_messages` (unread count) | 191-197 | `.eq('channel_id', ch.id)` — parent-chain safe |

### Leak cause:

**Lines 120-124** — The season filter has only TWO branches:
```javascript
if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
  q1 = q1.eq('season_id', selectedSeason.id)       // Branch 1: single season
} else if (sportSeasonIds && sportSeasonIds.length > 0) {
  q1 = q1.in('season_id', sportSeasonIds)           // Branch 2: all seasons + sport
}
// MISSING: else if (isAllSeasons) → .in('season_id', orgSeasonIds) ← NOT HERE
```

When user selects **"All Seasons" + no sport**, `sportSeasonIds` is `null` (line 102-104), both `if` branches are skipped, and the query runs with **NO season filter at all**. This loads ALL `chat_channels` across the entire database.

Additionally, `organization` is imported from `useAuth()` but **never used** to filter any query. No `.eq('organization_id', ...)` exists anywhere in the file.

### Fix needed:

Add a third `else if` branch to both Q1 (line 124) and Q2 (line 141):
```javascript
} else if (isAllSeasons(selectedSeason)) {
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) { setChannels([]); setLoading(false); return }
  q1 = q1.in('season_id', orgSeasonIds)
}
```

---

## SeasonLeaderboardsPage:

### Queries found:

| # | Table | Lines | Filters |
|---|-------|-------|---------|
| 1 | `teams` | 356-372 | `.eq('season_id', ...)` OR `.in('season_id', sportIds)` OR `.in('season_id', orgSeasonIds)` |
| 2 | `player_season_stats` | 387-406 | `.eq('season_id', ...)` OR `.in('season_id', sportIds)` OR `.in('season_id', orgSeasonIds)` + `.gt('games_played', 0)` |

### Previous fix applied correctly: YES

Both queries have the proper three-branch pattern including the "All Seasons + no sport" fallback:
```javascript
} else if (isAllSeasons(selectedSeason)) {
  // All Seasons + no sport → filter by ALL org season IDs
  const orgSeasonIds = (allSeasons || []).map(s => s.id)
  if (orgSeasonIds.length === 0) { setTeams([]); return }
  query = query.in('season_id', orgSeasonIds)
}
```

### Additional unpatched queries: NONE

### Additional context:
`allSeasons` from `SeasonContext` is already org-scoped — it queries `.eq('organization_id', organization.id)` (SeasonContext.jsx lines 53-55). So the `orgSeasonIds` fallback is safe.

### Fix needed: NONE — Leaderboards is properly fixed.

---

## Other pages still leaking:

### 1. ChatsPage.jsx — CRITICAL (detailed above)
- `chat_channels` query missing allSeasons fallback
- No organization_id filter

### 2. NotificationsPage.jsx line 50 — MEDIUM
```javascript
.from('notifications')
.select('*, profiles:user_id(full_name, email)')
.order('created_at', { ascending: false })
.limit(100)
```
- **No organization_id filter** — loads notifications from ALL orgs
- Fix: Add `.eq('organization_id', organization?.id)`

### 3. AttendancePage.jsx line 157 — HIGH
```javascript
supabase.from('profiles').select('id, full_name, email').order('full_name')
```
- **No filters whatsoever** — returns ALL profiles from entire database
- Used to populate volunteer assignment dropdown
- Fix: Filter through `user_roles` table by org, or add org filter

### 4. AchievementDetailModal.jsx lines 96-98 — LOW
- `.from('players')` count query with no org scope
- Shows cross-org player counts in achievement stats
- Lower risk since it's aggregate data, not PII

### Pages confirmed SAFE:
- RegistrationsPage ✓ (season_id + org_id)
- TeamsPage ✓ (season_id)
- SchedulePage ✓ (season_id)
- PaymentsPage ✓ (season_id)
- CoachesPage ✓ (season_id)
- JerseysPage ✓ (season_id)
- BlastsPage ✓ (organization_id)
- StandingsPage ✓ (season_id + team_id)
- PlayerStatsPage ✓ (player_id + season_id)
- ReportsPage ✓ (organization_id)
- SeasonArchivePage ✓ (organization_id)
- SeasonLeaderboardsPage ✓ (season_id with fallback)
- Platform pages ✓ (intentionally cross-org, super-admin gated)

---

## Root Cause Summary

The original fix report missed ChatsPage because it likely only checked for `season_id` usage (which exists) without verifying the **"All Seasons + no sport" fallback branch** was present. The same pattern that was correctly applied to SeasonLeaderboardsPage was simply never added to ChatsPage.

SeasonLeaderboardsPage was correctly fixed — the leaderboards leak report was either from before the fix was applied, or from testing with "All Seasons + no sport" before the fix commit was deployed.
