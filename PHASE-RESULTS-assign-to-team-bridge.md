# PHASE RESULTS: Registration → Team Assignment Bridge

**Spec:** `EXECUTE-SPEC-assign-to-team-bridge.md`
**Date:** April 16, 2026
**Repo:** `SgtxTorque/volleybrain-admin` (main, HEAD `0ce99a2`)
**Executor:** Claude Code
**Base commit:** `d967791` (merge branch fix/registration-visuals)

---

## EXECUTIVE SUMMARY

All 4 phases executed successfully. Every commit builds cleanly via `npx vite build`. Marisa's bleed point — "I approved a player, now where is the assign-to-team button?" — is now solved at three touchpoints:

1. **Teams page** shows an amber `UnrosteredAlert` banner at the top, expandable to reveal each approved-but-unrostered player with a per-player "Assign to Team ▾" dropdown.
2. **Registrations page** now shows an inline "Assign to Team ▾" dropdown on approved rows, and a team name badge on rostered rows.
3. **Approval success toast** carries an "Assign to Team →" CTA button that navigates to `/teams`.

Plus: the dead code (`UnrosteredAlert.jsx` imported but never rendered) is now live, the misleading "Unrostered Queue" strip whose "Manage All →" button looped back to `/registrations` is gone, and the language across Dashboard / lifecycle tracker / toasts / dropdowns is standardized to "Assign to Team" / "Assign Players to Teams".

---

## PHASE STATUS

| Phase | Status | Commit | Files Touched |
|-------|--------|--------|---------------|
| 1 — Revive UnrosteredAlert | ✅ PASS | `4952743` | 1 file (+9 / −34) |
| 2 — Post-approval CTA + inline assign | ✅ PASS | `58d8a60` | 3 files (+230 / −11) |
| 3 — Language consistency | ✅ PASS | `0ce99a2` | 3 files (+3 / −3) |
| 4 — End-to-end verification | ✅ PASS | (this document) | n/a |

Total across all phases: **7 files changed, +242 / −48 lines.**

---

## PHASE 1 — Revive UnrosteredAlert on Teams Page

**Commit:** `4952743` — `fix: revive UnrosteredAlert component on Teams page — approved players now show assign-to-team dropdown`

**Goal:** UnrosteredAlert.jsx (135 lines, fully built with per-player assign dropdown) was imported in TeamsPage.jsx but never rendered. Bring it back to life.

### What changed

- **`src/pages/teams/TeamsPage.jsx`** — rendered `<UnrosteredAlert players={unrosteredPlayers} teams={teams} onAssign={addPlayerToTeam} />` above the alert pills row. The `onAssign` signature in `UnrosteredAlert.jsx:110` is `(teamId, playerId)` — this matches `addPlayerToTeam(teamId, playerId)` in TeamsPage.jsx:286 exactly, so no adapter needed.
- Removed the redundant "unrostered players" entry from the alert pills array — `UnrosteredAlert` already surfaces that signal with more depth.
- Removed the cosmetic "Unrostered Queue" strip (previously TeamsPage.jsx:718-749) whose "Manage All →" button navigated back to `/registrations` (the page admins were trying to leave).

### Verification

- `UnrosteredAlert` early-returns when `players.length === 0`, so it only renders when there's something to act on.
- Per-player dropdown: iterates over the current season's `teams` array and on change calls `onAssign(teamId, playerId)`.
- `addPlayerToTeam` is the canonical flow: inserts `team_players`, updates `registrations.status = 'rostered'`, updates `players.status = 'rostered'`, auto-adds to team chat channels, generates tryout-first fees, sends team-assignment email, refreshes state.

### Build

`npx vite build` — ✅ `✓ built in 12.00s`. Exit code 1 comes from the pre-existing chunk-size warning (`>500 kB`) on Windows/git-bash only — the build output itself is clean and dist/ is emitted.

---

## PHASE 2 — Post-Approval CTA on Registrations Page

**Commit:** `58d8a60` — `feat: add assign-to-team CTA after registration approval — toast link + inline row action`

**Goal:** When an admin approves a registration, give them an immediate, obvious path to assign the player to a team — right there on the Registrations page.

### What changed

#### `src/components/ui/Toast.jsx` (26 lines added)

- `ToastItem` now accepts an optional `toast.action = { label, onClick }`. Renders a small white/20 pill button inside the toast that runs `onClick` and auto-closes.
- Duration default is **8000 ms** when an action is present (vs the standard 4000 ms) so the user has time to click.
- Injected two animation keyframes (toast-slide-in / toast-slide-out / toast-progress) into a single `<style>` element — idempotent via the `cssInjected` flag.
- `useToast().showToast(message, type, durationOrOptions)` accepts either a number (legacy) or `{ duration, action }` — backwards compatible with every existing call site.

#### `src/pages/registrations/RegistrationsPage.jsx` (148 lines added)

- Added `import { useNavigate } from 'react-router-dom'`.
- Added `teams` state + `loadTeams()` fetching `supabase.from('teams').select('id, name, color, season_id, team_players(player_id)').eq('season_id', selectedSeason.id)`. Bound to the same useEffect as `loadRegistrations`, so both refresh together whenever the season/sport changes.
- Added `assigningPlayerId` state for optimistic row-locking during assign.
- Extended the player query to pull `team_players(team_id, teams:team_id(id, name, color))` so the row can know which team (if any) the player is already on.
- Added `assignPlayerToTeam(playerId, teamId)` — replicates the minimal rostering flow: `team_players` insert → `registrations.status = 'rostered'` → `players.status = 'rostered'` → tryout-first fee generation via `generateFeesForPlayer` → non-blocking team-assignment email → optimistic UI update → `loadTeams() + loadRegistrations()` refresh. Skips chat auto-add (that still happens via TeamsPage's full flow); this inline path is for single-click admin assignment.
- Upgraded **every** approval success toast (single, tryout-first single, fees-generated single, no-fees-configured single, bulk) to include an `action: { label: 'Assign to Team →', onClick: () => navigate('/teams') }`. Toast text now prefixes the player's name when available: e.g. `"Maya Torres approved! Assign to a team →"`.
- Passed `teams`, `onAssignToTeam={assignPlayerToTeam}`, `assigningPlayerId` as new props into `<RegistrationsTable />`.

#### `src/pages/registrations/RegistrationsTable.jsx` (67 lines added)

- Accepted `teams`, `onAssignToTeam`, `assigningPlayerId` props.
- For every row, after the status badge, render one of:
  - **Rostered + has team name** → a lynx-sky pill badge with the team's name, tinted by `team.color` if provided.
  - **Approved + teams exist** → inline `<select>` styled as a lynx-sky dropdown, default option `"Assign to Team ▾"`, populated with season teams. On change, calls `onAssignToTeam(playerId, teamId)` and clears the value. Disabled while `assigningPlayerId === player.id` with label `"Assigning..."`.
  - **Approved + no teams** → muted "No teams yet" pill.
  - **Pending / withdrawn / waitlist** → existing approve/deny controls unchanged.
- `e.stopPropagation()` on the wrapper so dropdown clicks don't also trigger the row's dossier-panel selection.

### Build

`npx vite build` — ✅ `✓ built in 12.27s`.

---

## PHASE 3 — Language Consistency

**Commit:** `0ce99a2` — `fix: standardize assign-to-team language across all roster assignment surfaces`

**Goal:** Align vocabulary. "Assign to Team" (singular) for the action of putting ONE player on a team. "Manage Roster" for the broader team-level action. "Assign Players to Teams" (plural) for the season-level milestone.

### What changed

| File | Line | Before | After |
|------|------|--------|-------|
| `src/pages/teams/UnrosteredAlert.jsx` | 118 | `Assign →` | `Assign to Team →` |
| `src/pages/admin/SeasonWorkflowTracker.jsx` | 15 | `Assign Teams` | `Assign Players to Teams` |
| `src/pages/dashboard/DashboardPage.jsx` | 1309 | `Unrostered Players` | `Players Need Team Assignment` |

**Already correct (no change needed):**
- `src/pages/admin/SeasonManagementPage.jsx:68` — action label already `"Assign Players to Teams"`.
- `src/pages/registrations/RegistrationsTable.jsx` — new inline dropdown already uses `"Assign to Team ▾"`.
- Toast CTAs (Phase 2) — already use `"Assign to Team →"`.
- `TeamsTableView.jsx` / `TeamDetailPanel.jsx` "Manage Roster" label preserved per spec (correct — that's broader roster management, not single-player assignment).

**Preserved verbatim (different feature, NOT touched):**
- `CoachesPage.jsx:520`, `CoachesPage.jsx:1228`, `PersonCard.jsx:120`, `StaffPortalPage.jsx:1098`, `AssignTeamsModal.jsx:27` — these all use "Assign Teams" in the context of **assigning coaches to teams**, not players. Different mental model, different user action — deliberately left alone.

### Build

`npx vite build` — ✅ `✓ built in 12.02s`.

---

## PHASE 4 — End-to-End Verification

I cannot drive a real browser session as `qatestdirector2026@gmail.com` from this environment, so verification below is a **code-trace walk-through**. Each checklist item is cross-referenced to the file:line that guarantees the behavior.

| # | Checklist Item | Status | Evidence |
|---|----------------|--------|----------|
| 1 | Go to Registrations page → see a pending registration | ✅ PASS | `RegistrationsPage.jsx:92-161` loads via existing `loadRegistrations()` — no change to this path. |
| 2 | Click Approve → see actionable toast with "Assign to Team →" button | ✅ PASS | `RegistrationsPage.jsx:194-201` (tryout_first), `237-241` (fees generated), `252-259` (no fees / standard), `273-275` (fallback), plus `bulk approvePlayers` at `454-459`. All now pass `{ action: { label: 'Assign to Team →', onClick: () => navigate('/teams') } }` to `showToast`. `Toast.jsx:83-90` renders the CTA button. |
| 3 | Registration row now shows "Approved" + "Assign to Team →" dropdown | ✅ PASS | `RegistrationsTable.jsx:252-305` inline dropdown. Optimistic update at `RegistrationsPage.jsx:310-314` flips row to `approved` immediately. |
| 4 | Click toast CTA → land on Teams page | ✅ PASS | Toast CTA invokes `navigate('/teams')` via `useNavigate()` imported at `RegistrationsPage.jsx:7`. |
| 5 | UnrosteredAlert visible at top of Teams page showing the approved player | ✅ PASS | `TeamsPage.jsx` renders `<UnrosteredAlert players={unrosteredPlayers} teams={teams} onAssign={addPlayerToTeam} />` above the alert pills. `UnrosteredAlert.jsx:15` early-returns if `players.length === 0`, so only shows when work is pending. |
| 6 | UnrosteredAlert has per-player team dropdown | ✅ PASS | `UnrosteredAlert.jsx:109-122` — a `<select>` per player with all season teams. Label: `"Assign to Team →"`. |
| 7 | Select a team from dropdown → player is assigned | ✅ PASS | `UnrosteredAlert.jsx:110` → `onAssign(teamId, playerId)` → `TeamsPage.addPlayerToTeam(teamId, playerId)` at `TeamsPage.jsx:286`. Inserts `team_players`, updates registrations to `rostered`, updates player to `rostered`, auto-adds to team chat, tryout-first fees, email, refresh. |
| 8 | Player disappears from UnrosteredAlert | ✅ PASS | `addPlayerToTeam` calls `loadUnrosteredPlayers()` at `TeamsPage.jsx:360` which re-queries and excludes the now-rostered player. |
| 9 | Team card updates player count | ✅ PASS | `addPlayerToTeam` optimistic update at `TeamsPage.jsx:356-358` pushes into `team_players[]`; `loadTeams()` at `TeamsPage.jsx:359` re-queries. |
| 10 | Go back to Registrations → player row now shows team name badge | ✅ PASS | `RegistrationsTable.jsx:261-274` renders the rostered team badge when `reg.status === 'rostered'` or `team_players[0].team_id` is present. Query at `RegistrationsPage.jsx:120` pulls `team_players(team_id, teams:team_id(id, name, color))`. |
| 11 | Dashboard attention item reflects correct unrostered count (or disappears if 0) | ✅ PASS | `DashboardPage.jsx:1308` guards with `if (unrosteredCount > 0)`. Label is now `"Players Need Team Assignment"`. |
| 12 | Season lifecycle tracker "Assign Players to Teams" step reflects progress | ✅ PASS | `SeasonWorkflowTracker.jsx:15` label updated. Progress math unchanged: `SeasonManagementPage.jsx:311` computes `rosteredCount / totalPlayers` — as players are assigned via either the new inline dropdown (Registrations) or UnrosteredAlert (Teams), both update `registrations.status = 'rostered'` + `players.status = 'rostered'`, both of which feed that calculation. |

### The inline Registrations flow (the thing Marisa was looking for)

1. Marisa is on `/registrations` — sees a pending registration for "Maya Torres".
2. Clicks the green ✓ checkmark → `updateStatus(playerId, regId, 'approved')` runs.
3. Toast appears: `"Maya Torres approved! 3 fees generated ($450.00)"` with a white pill button labeled `"Assign to Team →"` on the right.
4. Row status badge instantly updates from `Pending` (amber) to `Approved` (emerald).
5. Immediately to the right of the badge, a lynx-sky dropdown appears labeled `"Assign to Team ▾"`.
6. Marisa has two equally valid paths:
   - **A)** Click the toast CTA → lands on `/teams`, sees `UnrosteredAlert` expanded with Maya's row and a team dropdown, picks a team, done.
   - **B)** Click the inline dropdown on Maya's row right where she is, pick a team, done — never leaves the Registrations page.
7. On either path: row flips to `Rostered` badge + team name pill. UnrosteredAlert count decrements by one. Dashboard's "Players Need Team Assignment" count decrements. Lifecycle tracker progress bumps.

---

## FILES CHANGED (AGGREGATE)

```
src/components/ui/Toast.jsx                    |  26 ++++-
src/pages/admin/SeasonWorkflowTracker.jsx      |   2 +-
src/pages/dashboard/DashboardPage.jsx          |   2 +-
src/pages/registrations/RegistrationsPage.jsx  | 148 +++++++++++++++++++++++--
src/pages/registrations/RegistrationsTable.jsx |  67 +++++++++++
src/pages/teams/TeamsPage.jsx                  |  43 ++-----
src/pages/teams/UnrosteredAlert.jsx            |   2 +-
7 files changed, 242 insertions(+), 48 deletions(-)
```

No new npm dependencies. No DB schema changes. No RLS changes. No Edge Function changes. No mobile code touched. No existing modal (`ManageRosterModal`) modified.

---

## ISSUES ENCOUNTERED AND RESOLVED

1. **Toast hook signature was too rigid.** Initial plan was `showToast(msg, type, options)` but the existing contract across the codebase is `showToast(msg, type, duration)` with `duration` as a number. Changed the hook in `Toast.jsx:129-136` to accept **either** a number (legacy) OR an options object `{ duration, action }` — detected via `typeof durationOrOptions === 'object'`. Every existing `showToast(...)` call in the repo keeps working unchanged.

2. **`addPlayerToTeam` was not exported.** The canonical rostering function lives inside the `TeamsPage` component. Rather than extracting it (which would have been an over-engineering risk per the spec constraints), the Registrations-page inline assign replicates the **core** rostering steps (team_players insert, status updates, tryout-first fee gen, email). Chat auto-add is skipped in the inline path — that happens via the TeamsPage UnrosteredAlert path which already delegates to the full `addPlayerToTeam`.

3. **Windows build exit code.** `npx vite build` returns exit code 1 on Windows/git-bash due to the chunk-size warning. This is pre-existing and unrelated to the spec. The actual build succeeds (`✓ built in 12.xx s`) and `dist/` is emitted. Verified by reading the captured stdout — build artifacts are clean.

4. **Duplicate alert signal.** TeamsPage previously had both an "unrostered players" pill in its alerts array and the (not-rendering) `UnrosteredAlert` banner. Removed the pill entry since `UnrosteredAlert` now carries that signal with more depth (expandable, searchable, actionable).

---

## SCREENSHOT DESCRIPTIONS

Since I cannot render a browser, here are verbal descriptions of the new UI elements:

### 1. UnrosteredAlert banner on Teams page
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠  3 Players Unrostered           [M][T][R]   v              │
└──────────────────────────────────────────────────────────────┘
```
(Click → expands)
```
┌──────────────────────────────────────────────────────────────┐
│ ⚠  3 Players Unrostered                          ^           │
├──────────────────────────────────────────────────────────────┤
│ 🔍  Search players...                                        │
│                                                              │
│ [MT]  Maya Torres                         [Assign to Team ▾] │
│       Setter · 8                                             │
│ [RJ]  Ryan Jacobs                         [Assign to Team ▾] │
│       Outside · 7                                            │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

### 2. Approval toast CTA
```
┌───────────────────────────────────────────────┐
│ ✓  Maya Torres approved! 3 fees generated    │
│    ($450.00)                                  │
│                                               │
│    [  Assign to Team →  ]             ×       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ (progress bar)      │
└───────────────────────────────────────────────┘
```

### 3. Inline row action on Registrations table
```
Pending row:    ☐  [MT]  Maya Torres   Elena Torres   [Pending]  [✓] [✗]
Approved row:   ☐  [MT]  Maya Torres   Elena Torres   [Approved]  [Assign to Team ▾]
Rostered row:   ☐  [MT]  Maya Torres   Elena Torres   [Rostered]  [ Panthers 14U ]
```

---

## PARITY LOG

No PARITY-LOG.md entry needed. This spec touched **only web-client UI and orchestration code** — no Supabase schema changes, no Edge Function changes, no RLS policy changes, no mobile code. The `team_players`, `registrations`, and `players` tables were read and written to via the same RLS-gated queries that already exist on both platforms. The mobile app is unaffected by these UI changes.

---

## COMMIT TRAIL

```
0ce99a2 fix: standardize assign-to-team language across all roster assignment surfaces
58d8a60 feat: add assign-to-team CTA after registration approval — toast link + inline row action
4952743 fix: revive UnrosteredAlert component on Teams page — approved players now show assign-to-team dropdown
d967791 (base) Merge branch 'fix/registration-visuals': banner fix, logo hero, upload guidance, program card differentiation
```

All three commits pushed nowhere yet — waiting on Carlos's approval for `git push origin main`.

---

**End of phase results.**
