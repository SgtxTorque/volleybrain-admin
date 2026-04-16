# PHASE RESULTS: Multi-Team Player Assignment — Tier 2 (Read-Side Fixes)

**Date:** April 16, 2026
**Spec:** EXECUTE-SPEC-multi-team-assign-t2.md
**Status:** ✅ All phases complete, build passing, pushed to origin/main

---

## Summary

Tier 1 fixed the write path so admins can assign players to multiple teams. Tier 2 fixed all ~15 read-side locations that used `team_players[0]` to grab "the" team. Now single-team surfaces render the **primary** team, multi-team surfaces render **all** teams, and every `team_players` Supabase query includes `is_primary_team` so the helper can resolve correctly.

---

## Per-Phase Status

### Shared Utility — `src/lib/team-utils.js`
- **Commit:** `10d6c6d`
- **Build:** ✓ built in ~12s
- Created three exported helpers:
  - `getPrimaryTeam(teamPlayers)` — returns the `team_players` row with `is_primary_team: true`, falls back to `[0]`
  - `getPrimaryTeamInfo(teamPlayers)` — returns the nested `teams` object of the primary row (or null)
  - `getAllTeams(teamPlayers)` — returns a flat array of `{ id, name, color, isPrimary, jerseyNumber }` for all rows

### Phase 1 — `ParentDashboard.jsx`
- **Commit:** `0a1cda2`
- **Build:** ✓ built in 12.06s
- **Files changed:** 1 (44 insertions, 31 deletions)
- All 6 `team_players[0]` call sites replaced with helpers (child status, card team/jersey, coach lookup, team color, team name/ID, fallback team)
- Multi-team indicator added: kid card now shows "Team Name +N more" when `allTeams.length > 1`
- `tIds` now flatMaps over all team_players (schedule needs all teams, not just primary)

### Phase 2 — Parent Sub-Pages
- **Commit:** `e8a28e4`
- **Build:** ✓ built in 12.06s
- **Files changed:** 3 (35 insertions, 9 deletions)
- `PlayerProfilePage.jsx`: import + replace `team_players?.[0]` with `getPrimaryTeam`/`getAllTeams` + render multi-team pill badges in banner when `hasMultipleTeams`
- `ParentRegistrationHub.jsx`: import + replace line 591 with `getPrimaryTeamInfo`
- `MyStuffPage.jsx`: import + replace 4 call sites (team, jersey, status-2x)

### Phase 3 — MainApp + SetupWizard
- **Commit:** `6be40ff`
- **Build:** ✓ built in 11.78s
- **Files changed:** 2
- `MainApp.jsx` line 1507: team-hub nav now uses `getPrimaryTeam(roleContext.children[0].team_players)?.team_id`
- `SetupWizard.jsx` line 825: wizard team name uses `getPrimaryTeamInfo(child.team_players)?.name`

### Phase 4 — DashboardPage Audit
- **Commit:** (no commit — no changes needed)
- **Build:** (no build — no changes)
- DashboardPage only queries `team_players` to count distinct `player_id`s (Set-based dedup). The count math is already correct — a multi-team player counts as 1 rostered. No team names rendered for individual players. Per spec: "Commit (only if changes were needed)". Skipped.

### Phase 5 — Queries Include `is_primary_team`
- **Commit:** `a74886e`
- **Build:** ✓ built in 11.75s
- **Files changed:** 6 (7 insertions, 7 deletions)
- All team_players selects now include `is_primary_team` so `getPrimaryTeam()` can resolve without the `[0]` fallback.

### Phase 6 — Docs + Push
- This file (`PHASE-RESULTS-multi-team-assign-t2.md`) written
- `PARITY-LOG.md` appended with April 16, 2026 Tier 2 entry
- Pushed to `origin/main`

---

## Files Changed

| File | Phase | Lines changed |
|---|---|---|
| `src/lib/team-utils.js` | Utility | New file (+76) |
| `src/pages/roles/ParentDashboard.jsx` | 1, 5 | +44/-31, +1/-1 |
| `src/pages/parent/PlayerProfilePage.jsx` | 2, 5 | +~28/-4, +1/-1 |
| `src/pages/parent/ParentRegistrationHub.jsx` | 2, 5 | +2/-1, +1/-1 |
| `src/pages/parent/MyStuffPage.jsx` | 2 | +6/-4 |
| `src/MainApp.jsx` | 3, 5 | +2/-1, +2/-2 |
| `src/pages/auth/SetupWizard.jsx` | 3, 5 | +2/-1, +1/-1 |
| `src/pages/registrations/RegistrationsPage.jsx` | 5 | +1/-1 |

---

## Queries Updated to Include `is_primary_team`

All seven target queries identified in the spec were updated:

| File | Line | Old select | New select |
|---|---|---|---|
| `MainApp.jsx` | 1055 | `team_players(team_id, jersey_number, teams(…))` | `team_players(team_id, is_primary_team, jersey_number, teams(…))` |
| `MainApp.jsx` | 1065 | `team_players(team_id, jersey_number, teams(…))` | `team_players(team_id, is_primary_team, jersey_number, teams(…))` |
| `ParentDashboard.jsx` | 299 | `team_players(team_id, jersey_number, teams(…))` | `team_players(team_id, is_primary_team, jersey_number, teams(…))` |
| `PlayerProfilePage.jsx` | 60 | `id, team_id, jersey_number, teams(…)` | `id, team_id, is_primary_team, jersey_number, teams(…)` |
| `ParentRegistrationHub.jsx` | 73 | `team_players (team_id, teams(name))` | `team_players (team_id, is_primary_team, teams(name))` |
| `RegistrationsPage.jsx` | 120 | `team_players(team_id, teams:team_id(id, name, color))` | `team_players(team_id, is_primary_team, jersey_number, teams:team_id(id, name, color))` |
| `SetupWizard.jsx` | 181 | `team_players(teams(name, color))` | `team_players(is_primary_team, teams(name, color))` |

DashboardPage.jsx team_players queries only select `player_id` or `team_id, player_id` for count/dedup purposes; no team info needed downstream so no change required.

---

## Verification Checklist (Tier 2)

Assuming a player is on 2 teams (from Tier 1):

1. [ ] Parent Dashboard — shows primary team name with "+1 more" indicator
2. [ ] Player Profile Page — shows BOTH team names as pill badges in banner
3. [ ] Parent Registration Hub — shows primary team name (not "Unassigned")
4. [ ] MyStuff Page — shows primary team's jersey number and info
5. [ ] MainApp team hub nav — navigates to primary team's hub
6. [ ] SetupWizard team name — shows primary team name
7. [ ] Dashboard rostered count — player counts as 1 (not 2) *(unchanged logic, already correct)*
8. [ ] Dashboard "Players Need Team Assignment" — does NOT include this player *(unchanged logic, already correct)*
9. [ ] Registrations table — shows both team badges + "+ Team" dropdown *(Tier 1)*
10. [ ] Player Dossier Panel — shows both team badges + "Add to Another Team" dropdown *(Tier 1)*

**Runtime QA:** pending Carlos manual verification with Marisa's actual data.

---

## Commits (Tier 2)

```
a74886e  fix: all team_players queries now include is_primary_team for correct primary team resolution
6be40ff  fix: MainApp and SetupWizard use getPrimaryTeam for multi-team safety
e8a28e4  fix: parent sub-pages use getPrimaryTeam — PlayerProfile shows all teams, Hub and MyStuff use primary
0a1cda2  fix: ParentDashboard uses getPrimaryTeam for multi-team safety — shows +N indicator for multi-team players
10d6c6d  feat: add team-utils.js helper — getPrimaryTeam, getPrimaryTeamInfo, getAllTeams for multi-team support
```

---

## Notes

- **Helper fallback safety:** `getPrimaryTeam()` always falls back to `teamPlayers[0]` if no row has `is_primary_team: true`. This means Tier 2 is fully backward-compatible with players whose rows were created before `is_primary_team` began being set (Tier 1 write path). For those legacy rows, behavior is unchanged from the old `team_players?.[0]` pattern.
- **Multi-team UI surfacing:** Only two surfaces render multiple teams — ParentDashboard kid card ("+N more" indicator) and PlayerProfilePage banner (pill badges). Everywhere else renders the primary team only, which is the intended space-conscious choice.
- **No schema/RLS/Edge Function changes.** No mobile changes. No new deps. No placeholder personal data used.
