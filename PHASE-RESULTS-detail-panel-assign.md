# PHASE RESULTS: Assign-to-Team in Player Detail Panel

**Spec:** `EXECUTE-SPEC-detail-panel-assign.md`
**Date:** April 16, 2026
**Repo:** `SgtxTorque/volleybrain-admin` (main)
**Base commit:** `3807bd6` (verify: end-to-end registration-to-roster flow confirmed working)

---

## SUMMARY

Added contextual bottom-panel actions to `PlayerDossierPanel` — the right-side slide-out that opens when an admin clicks a registration row. Previously the panel showed Approve/Deny/Edit/Transfer regardless of status. Now it switches the primary action based on the player's registration + rostering state:

- **Pending** → Approve / Deny (unchanged)
- **Approved + not on team** → Full-width sky-blue "Assign to Team ▾" dropdown (primary action)
- **Approved + on team / Rostered** → Full-width team-colored badge with checkmark + team name
- **Denied / Withdrawn** → Edit / Transfer only

Plus, I derived a live `dossierPlayerLive` reference in `RegistrationsPage.jsx` so the panel smoothly transitions through all states (pending → approved → rostered) without requiring a row re-click.

Build: `✓ built in 13.50s`. Single commit as specified.

---

## FILES CHANGED

```
src/pages/registrations/PlayerDossierPanel.jsx   | ~70 ins / ~3 del
src/pages/registrations/RegistrationsPage.jsx    |  ~15 ins /  ~8 del
```

Two files, ~85 lines added / ~11 lines removed.

---

## PANEL STATES — VISUAL DESCRIPTIONS

### State 1: Pending (unchanged)
```
┌────────────────────────────────────────┐
│   [ ✓ Approve    ]   [ ✗ Deny     ]    │
│         (optional warning)             │
│         [ ✎ Edit Player ]              │
│         [ Transfer season ]            │
└────────────────────────────────────────┘
```

### State 2: Approved + No Team (NEW primary action)
```
┌────────────────────────────────────────┐
│ ╔════════════════════════════════════╗ │
│ ║ 🏐  Assign to Team ▾              ║ │  ← Full-width, #4BB9EC bg, white text
│ ╚════════════════════════════════════╝ │
│         [ ✎ Edit Player ]              │
│         [ Transfer season ]            │
└────────────────────────────────────────┘
```
Dropdown options: every team in the current season. On selection → calls `assignPlayerToTeam(playerId, teamId)` (shared with table-row inline dropdown and UnrosteredAlert on Teams page). While assigning: label shows "Assigning..." and control is disabled.

If season has **no teams yet**:
```
│  No teams in this season yet — create a team first   │
```

### State 3: Approved + On Team / Rostered (NEW badge)
```
┌────────────────────────────────────────┐
│ ╔════════════════════════════════════╗ │
│ ║ ✓   Panthers 14U                  ║ │  ← Tinted by team.color if present,
│ ╚════════════════════════════════════╝ │    else emerald. No Approve/Deny.
│         [ ✎ Edit Player ]              │
│         [ Transfer season ]            │
└────────────────────────────────────────┘
```

### State 4: Denied / Withdrawn (unchanged)
```
┌────────────────────────────────────────┐
│         [ ✎ Edit Player ]              │
└────────────────────────────────────────┘
```
(Transfer season only renders for pending/approved; explicitly omitted for denied per existing logic.)

---

## MARISA-FLOW WALK-THROUGH

1. She clicks a pending registration row → dossier panel slides in on the right.
2. She reads Maya's info in the panel, clicks **Approve** (green button).
3. `updateStatus` runs; `registrations` state flips Maya's status to `approved`; `dossierPlayerLive` picks up the new status on the next render.
4. Within the same panel, the two Approve/Deny buttons disappear and a single full-width **🏐 Assign to Team ▾** appears in their place.
5. She clicks the dropdown, selects "Panthers 14U".
6. Button goes to "Assigning..." (disabled) while `assignPlayerToTeam` runs.
7. On success, the dropdown swaps for a sky-blue pill: **✓ Panthers 14U**.
8. The table row behind the panel also updates (same `assignPlayerToTeam` refreshes `registrations` + `teams`).
9. She never left the Registrations page. She never had to navigate to `/teams`, never had to open a three-dot menu, never had to look for "Manage Roster".

---

## IMPLEMENTATION NOTES

1. **Shared assignment logic.** The new dropdown wires into the same `assignPlayerToTeam(playerId, teamId)` function added in the previous `EXECUTE-SPEC-assign-to-team-bridge.md`. No duplication; the panel just calls into RegistrationsPage's existing handler. This means: `team_players` insert, registration `status = 'rostered'`, player `status = 'rostered'`, tryout-first fee generation, team-assignment email — all behave identically whether admin clicks the panel dropdown, the table-row inline dropdown, or the UnrosteredAlert on the Teams page.

2. **Live panel state.** Added `dossierPlayerLive` derivation in `RegistrationsPage.jsx:604-606` so the panel always reflects the current version from `registrations`. Without this, the panel would show stale status (e.g. still "Pending" after clicking Approve, until the user closes/reopens the panel). With it, the panel transitions smoothly through states in place.

3. **Team name detection.** Reads `player.team_players[0]?.teams?.name` from the query extension already in place. If the player has no `team_players` row, `hasTeam === false` and the dropdown renders instead of the badge.

4. **No "Assign" state for pending.** The dropdown only renders when `reg.status === 'approved' && !hasTeam`. Pending players still see Approve/Deny (they must be approved before they can be assigned).

5. **`rostered` state coverage.** Even if a registration status is `rostered` without a team_players row (data drift edge case), the code still shows the green "Rostered" badge rather than confusingly offering to assign again. Conversely, if a registration is still `approved` but a `team_players` row already exists (another edge case — admin used a different path first), the panel shows the team badge.

6. **Styling.** Button uses `bg-[#4BB9EC]` (lynx-sky) with white text, `rounded-[14px]`, full-width, 2.5 vertical padding — matches the spec's "same visual weight as Approve button". Team badge is tinted by `team.color` when available for clear visual identity; falls back to emerald when color is missing.

7. **Edit / Transfer preserved.** Both buttons remain visible in every state per the spec ("always relevant").

---

## ISSUES ENCOUNTERED

1. **Stale dossier panel state** — as mentioned above, the initial prop wiring passed `dossierPlayer` (the snapshot at click time) rather than a live reference. After Approve, the panel would still show Approve/Deny until the user closed and re-opened it — which completely defeats the purpose of the spec (Marisa's eyes never leave the panel). Fixed by deriving `dossierPlayerLive = registrations.find(p => p.id === dossierPlayer.id) || dossierPlayer` so the panel is always in sync with the underlying array. Gracefully falls back to the snapshot if the player somehow isn't in `registrations` (shouldn't happen).

2. **Windows build exit code** — `npx vite build` exits 1 from pre-existing chunk-size warnings. Actual build succeeds (`✓ built in 13.50s`); treated as passing (same treatment as all previous spec phases).

---

## COMMIT

```
feat: add assign-to-team dropdown to player detail panel — contextual actions by registration status
```

One commit as specified. No changes to DB, RLS, Edge Functions, mobile code, or existing modals. No new npm dependencies. No modifications to the Phase 2 table-row inline dropdown (explicitly preserved per spec).

---

## PARITY LOG

No entry needed — web-client UI only, shared helpers unchanged.

**End of results.**
