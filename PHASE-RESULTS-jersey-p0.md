# PHASE RESULTS: Jersey Workflow P0 — Lifecycle Tracker Step + Dashboard Attention Item

**Date:** April 16, 2026
**Spec:** EXECUTE-SPEC-jersey-p0.md
**Status:** All phases complete, build passing, pushed to origin/main

---

## Summary

The admin had no lifecycle prompt to assign jersey numbers. The active LifecycleTracker (8 steps) had no jersey step, and the `getJerseyTasksCount()` helper was exported but never consumed. This spec adds:
1. A "Assign jersey numbers" step to the lifecycle tracker (step 8 of 9)
2. A dashboard attention item showing "X Players Need Jersey Numbers"
3. Jersey number in the team assignment email template (when available)

---

## Per-Phase Status

### Phase 1 — Add Jersey Step to LifecycleTracker
- **Commit:** `20e8628`
- **Build:** built in 13.94s
- **Files:** LifecycleTracker.jsx (+11), ProgramPage.jsx (+11)
- **Changes:**
  - New `assign_jerseys` step inserted in `ADMIN_STEPS` array (position 8 of 9, before "Send announcement")
  - Added `jerseyAssignedCount` prop to LifecycleTracker
  - Added `jerseyAssignedCount` to the data object used by completion checks
  - ProgramPage: new state `jerseyAssignedCount`, new query after main data load to count team_players with non-null jersey_number
  - ProgramPage passes `jerseyAssignedCount` prop to `<LifecycleTracker>`
  - Completion: `d.jerseyAssignedCount > 0` (loose — at least one player has a jersey number)
  - Blocked until: `process_registrations` (approve registrations first)
  - CTA: "Assign Jerseys" → navigates to `/jerseys`
  - "Send announcement" step NOT blocked by jersey step (jersey is skippable)

### Phase 2 — Dashboard Jersey Attention Item
- **Commit:** `9a6d4f9`
- **Build:** built in 13.47s
- **Files:** DashboardPage.jsx (+11)
- **Changes:**
  - Import `getJerseyTasksCount` from `../jerseys`
  - New state `jerseyTasksCount`
  - Fetch jersey count in `loadDashboardData` after stats computation
  - Guarded: only shows when `jerseyTasksCount > 0` AND `rosteredPlayers > 0`
  - Attention item: "Players Need Jersey Numbers" with 👕 icon
  - Positioned after "Players Need Team Assignment" (workflow order)
  - Clicking navigates to `/jerseys` via `onNavigate('jerseys')`

### Phase 3 — Team Assignment Email Jersey Number
- **Commit:** `7c399c8`
- **Build:** built in 13.48s
- **Files:** email-service.js (+3/-1)
- **Changes:**
  - `sendTeamAssignment` now accepts optional 5th param `jerseyNumber = null`
  - `jersey_number` field added to email data object
  - Template: conditional `<p><strong>Jersey Number:</strong> #X</p>` after coach name, before practice info
  - Backward-compatible: existing call sites pass no jersey number → field renders nothing

### Phase 4 — Verify + Push
- This file written
- PARITY-LOG.md updated
- Final build passed
- Pushed to origin/main

---

## Updated Lifecycle Tracker (9 Steps)

| # | Step ID | Label | Completion Check |
|---|---------|-------|-----------------|
| 1 | `create_season` | Create your season | Always true |
| 2 | `registration_setup` | Set up registration form | Has template or registration open |
| 3 | `create_teams` | Create your teams | teamsCount > 0 |
| 4 | `assign_coaches` | Assign coaches to teams | coachesAssignedCount > 0 |
| 5 | `open_registration` | Share registration link — GO LIVE! | registrationsCount > 0 or playersCount > 0 |
| 6 | `build_schedule` | Build the schedule | eventsCount > 0 |
| 7 | `process_registrations` | Process registrations | approvedRegsCount > 0 |
| 8 | **`assign_jerseys`** | **Assign jersey numbers** | **jerseyAssignedCount > 0** |
| 9 | `send_announcement` | Send your first announcement — LAUNCH! | playersCount > 0 && eventsCount > 0 && approvedRegsCount > 0 |

---

## Files Changed

| File | Lines changed | Phases |
|---|---|---|
| `src/components/v2/admin/LifecycleTracker.jsx` | +11 (new step, new prop, data object) | 1 |
| `src/pages/programs/ProgramPage.jsx` | +11 (state, query, prop) | 1 |
| `src/pages/dashboard/DashboardPage.jsx` | +11 (import, state, fetch, attention item) | 2 |
| `src/lib/email-service.js` | +3/-1 (param, field, template) | 3 |

---

## Verification Checklist

1. [x] Lifecycle tracker shows "Assign jersey numbers" as step 8 of 9
2. [x] Jersey step links to `/jerseys`
3. [x] Jersey step shows as incomplete when no jerseys assigned
4. [x] Jersey step is blocked when no registrations processed
5. [x] "Send announcement" step is NOT blocked by jersey step
6. [x] Dashboard shows "Players Need Jersey Numbers" attention item when applicable
7. [x] Dashboard item guarded: hidden when no players rostered
8. [x] Dashboard item navigates to `/jerseys` on click
9. [x] Email template includes jersey number when passed
10. [x] Email template hides jersey line when null (backward-compatible)
11. [x] Build passes with no errors

**Runtime QA:** Pending Carlos manual verification.

---

## Commits

```
7c399c8  feat: team assignment email template supports jersey number — shown when available
9a6d4f9  feat: dashboard attention item shows jersey assignment count — links to JerseysPage
20e8628  feat: add "Assign jersey numbers" step to lifecycle tracker — links to JerseysPage
```
