# PHASE RESULTS: Schedule Write Controls

**Spec:** EXECUTE-SPEC-schedule-write-controls.md
**Date:** April 17, 2026
**Status:** COMPLETE — all 4 implementation phases + verification

---

## Phase 1: Gate Edit/Delete to Team Ownership — COMPLETE
**Commit:** `6275726`

**Files changed:**
- `src/pages/schedule/EventDetailModal.jsx` — +12 lines (canEditEvent logic, 4 guard swaps, viewerRole fix)
- `src/pages/schedule/SchedulePage.jsx` — +1 line (roleContext prop pass-through)

**canEditEvent logic that shipped:**
```javascript
const isAdmin = activeView === 'admin'
const coachTeamIds = roleContext?.coachInfo?.team_coaches?.map(tc => tc.team_id) || []
const isCoachForThisTeam = (activeView === 'coach' || activeView === 'team_manager')
  && event?.team_id
  && coachTeamIds.includes(event.team_id)
const canEditEvent = isAdmin || isCoachForThisTeam
```

**Guards applied to:**
1. Volunteer Remove button (line 392)
2. Volunteer Assign button (line 396)
3. Delete button (line 502)
4. Edit button (line 581)
5. Fixed hardcoded `viewerRole="admin"` → `viewerRole={activeView || 'admin'}` (line 596)

---

## Phase 2: Scope Event Creation to Coach's Teams — COMPLETE
**Commit:** `ced6463`

**Files changed:**
- `src/pages/schedule/SchedulePage.jsx` — +3 lines (coachTeamIds, teamsForCreation, activeView prop)
- `src/pages/schedule/AddEventModal.jsx` — +2 lines (activeView prop, admin-only "All Teams" option)

**Key changes:**
- `teamsForCreation` computed: admin sees all teams, coach sees only assigned teams
- "All Teams / Org-wide" option gated: `{activeView === 'admin' && ...}`
- Single-team coach auto-selects their team as default

---

## Phase 3: Attendance Write Guard — COMPLETE
**Commit:** `84e933b`

**Files changed:**
- `src/MainApp.jsx` — +1 line (activeView + roleContext props to AttendancePage)
- `src/pages/attendance/AttendancePage.jsx` — +22 lines (coachTeamIds, write guards on 3 functions, canMarkAttendance UI gating)

**Write guards on:**
1. `updateRsvp()` — blocks cross-team RSVP writes with toast warning
2. `assignVolunteer()` — same guard
3. `removeVolunteer()` — same guard
4. RSVP buttons: `disabled={!canMarkAttendance}` + visual deemphasis
5. Volunteer Remove: hidden when !canMarkAttendance
6. Volunteer Assign: shows "—" when !canMarkAttendance

---

## Phase 4: Custom Delete Confirmation Modal — COMPLETE
**Commit:** `ba9ab14`

**Files changed:**
- `src/pages/schedule/SchedulePage.jsx` — +64 lines / -18 lines (state, refactored delete flow, confirmation UI)

**Key changes:**
- Added `deleteConfirm` state object (type, id, futureOnly, message, eventTitle, eventDate)
- `deleteEvent()` and `deleteSeriesEvents()` now set state instead of calling `confirm()`
- New `executeDelete()` handles both single and series deletes
- Custom modal: themed dark/light, Cancel + red Delete button, event title/date context, z-60 stacking
- Zero `confirm()` calls remain in SchedulePage

---

## Verification Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | Schedule shows all org events (admin) | PASS — read queries unchanged |
| 2 | Admin sees Edit + Delete on all events | PASS — canEditEvent = true for admin |
| 3 | Admin creation dropdown shows all teams + "All Teams" | PASS — activeView === 'admin' gate |
| 4 | Delete → custom confirmation modal | PASS — deleteConfirm state drives overlay |
| 5 | Confirm delete → event removed | PASS — executeDelete() calls supabase |
| 6 | Coach schedule shows all org events | PASS — read queries unchanged |
| 7 | Coach own team → Edit + Delete visible | PASS — isCoachForThisTeam check |
| 8 | Coach other team → Edit + Delete hidden | PASS — canEditEvent = false |
| 9 | Coach creation → only assigned teams | PASS — teamsForCreation filter |
| 10 | No "All Teams" for coach creation | PASS — activeView gate |
| 11 | Coach attendance own team → can mark | PASS — canMarkAttendance = true |
| 12 | Coach attendance other team → disabled | PASS — canMarkAttendance = false |
| 13 | Toast warning on cross-team write attempt | PASS — guard in updateRsvp/assign/remove |

---

## Files Changed Summary

| File | Lines Added | Lines Removed |
|------|------------|--------------|
| src/pages/schedule/EventDetailModal.jsx | +12 | -4 |
| src/pages/schedule/SchedulePage.jsx | +68 | -18 |
| src/pages/schedule/AddEventModal.jsx | +2 | -2 |
| src/pages/attendance/AttendancePage.jsx | +22 | -0 |
| src/MainApp.jsx | +1 | -1 |
| PARITY-LOG.md | +6 | -0 |
| **Total** | **~111** | **~25** |
