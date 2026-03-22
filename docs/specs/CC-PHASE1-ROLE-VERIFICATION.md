# CC-PHASE1-ROLE-VERIFICATION.md
## Execution Spec: Phase 1 — Role System Verification + Edge Case Hardening

**Date:** March 19, 2026
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `feat/desktop-dashboard-redesign`
**Prereq:** Phase 0 must be complete. Read `INVESTIGATION-REPORT-WEB-CATCHUP.md` and the Phase 0 verification report.

---

## WHAT THIS PHASE DOES

Hardens the role foundation from Phase 0 by testing edge cases, fixing any components that break with the new `isTeamManager` boolean, ensuring the role switcher works correctly for all role combinations, and confirming the sidebar renders properly for every view including TM.

This is a verification and hardening pass, not a feature build.

---

## WHAT THIS PHASE DOES NOT DO

- Does NOT build the TM dashboard (Phase 2)
- Does NOT change any dashboard content or layout
- Does NOT add new pages or features
- Does NOT touch design system or styling
- Does NOT port mobile engines or hooks

---

## RULES

1. Read every file before modifying.
2. Minimum change needed. No bonus refactors.
3. Do not touch files not listed in this spec.
4. Run `npm run build` after each sub-phase. Zero errors required.
5. Commit after each sub-phase: `[phase-1] Phase 1.X: description`
6. If you encounter something unexpected, STOP and report.

---

## PHASE 1.1: Audit Components That Check Role Booleans

Run this search and read every match:

```bash
grep -rn "roleContext\.is\|activeView.*===\|activeView.*!==" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules
```

For each file found, check:
- Does it handle `activeView === 'team_manager'` or will TM fall through to a default/broken state?
- Does it check `roleContext.isCoach` in a way that should also include `roleContext.isTeamManager`?

**Files most likely to need changes (check these first):**

1. `src/components/shared/WelcomeBanner.jsx` — Does it have role-specific messages? Does TM get a greeting or blank?
2. `src/components/layout/DashboardContainer.jsx` — Does it use activeView for anything?
3. `src/components/layout/DashboardGrid.jsx` — Does the widget grid have default layouts per role? What happens for `team_manager`?
4. `src/components/layout/EditLayoutButton.jsx` — Does it break for unknown activeView?
5. `src/components/coach/CalendarStripCard.jsx` — Used by multiple dashboards. Does it filter by role?
6. `src/pages/schedule/SchedulePage.jsx` — Does it check activeView for data scoping?
7. `src/pages/payments/PaymentsPage.jsx` — The route uses a ternary: `activeView === 'parent' ? ParentPaymentsPage : PaymentsPage`. Does TM need handling here?
8. `src/pages/chats/ChatsPage.jsx` — Does it check `activeView === 'coach'` specifically for channel management features? TM should have channel management too.

**For each file that needs a change:**
- Document what the issue is
- Make the minimum fix (usually adding `|| activeView === 'team_manager'` or `|| roleContext?.isTeamManager`)
- Do NOT restructure the conditional logic. Just extend it.

**Commit:** `[phase-1] Phase 1.1: audit and fix role-conditional components for TM`

---

## PHASE 1.2: Widget Grid Default Layout for TM

**File:** Find the layout service or layout defaults. Check:
- `src/components/layout/DashboardGrid.jsx`
- `src/components/widgets/dashboard/DashboardGrid.jsx`
- Any file that defines default widget positions per role

The widget grid system uses react-grid-layout and stores layouts per user. But on FIRST LOGIN, there needs to be a default layout. If no default exists for `team_manager`, the grid may render empty or crash.

**If default layouts are defined per role:**
Add a `team_manager` default. Keep it simple since the real TM dashboard is Phase 2. Use a minimal layout:
- One full-width placeholder widget
- Or fall back to the coach default layout

**If default layouts are stored in database (per user):**
Ensure the code handles a missing layout gracefully (falls back to empty grid, not crash).

**If the widget grid is NOT used for TM** (because the TM placeholder from Phase 0 renders instead of a widget grid):
Document this and skip. The widget grid only matters if `DashboardGrid` renders for TM.

**Commit:** `[phase-1] Phase 1.2: add TM default layout or confirm grid not used for TM`

---

## PHASE 1.3: Role Switcher End-to-End Verification

Trace through the role switcher flow in code:

1. User clicks role badge in header (or sidebar) → `setShowRoleSwitcher(true)`
2. Dropdown shows views from `getAvailableViews()`
3. User clicks a view → `setActiveView(view.id)` + `navigate('/dashboard')`
4. Dashboard re-renders with new `activeView`
5. Sidebar re-renders with new nav groups

**Verify these code paths for TM:**

1. Does `getAvailableViews()` return TM with correct label and description? (Phase 0 should have done this)
2. When `setActiveView('team_manager')` fires, does the sidebar correctly receive `teamManagerNavGroups`? Trace the prop chain from MainApp to LynxSidebar/HorizontalNavBar.
3. Does `navigate('/dashboard')` re-trigger the dashboard ternary and show the TM placeholder?
4. If user switches FROM TM TO coach, does everything reset correctly?
5. If user switches FROM admin TO TM, does the sidebar change?

**If any path breaks, fix it.** Most likely issue: the nav group selection conditional doesn't have a `team_manager` case and falls to a default that shows wrong groups.

**Commit:** `[phase-1] Phase 1.3: verify role switcher works for all TM combinations`

---

## PHASE 1.4: Payments Route TM Handling

**File:** `src/MainApp.jsx` — the `/payments` route

The investigation report shows the payments route has a special ternary:

```jsx
activeView === 'parent'
  ? <ParentPaymentsPage ... />
  : <PaymentsPage ... />
```

TM should see the admin/coach `PaymentsPage` (scoped to their team), NOT `ParentPaymentsPage`. Verify that TM falls through to `PaymentsPage` correctly. If the ternary needs adjusting, the correct logic is:

```jsx
activeView === 'parent'
  ? <ParentPaymentsPage roleContext={roleContext} showToast={showToast} />
  : <PaymentsPage showToast={showToast} />
```

TM is not `'parent'`, so it will correctly render `PaymentsPage`. Just verify this and document it. If it's already correct, no change needed.

Also: does `PaymentsPage` scope data by team for non-admin roles? Or does it show all org payments? If it shows all org payments, TM will see more than they should. Log this as a data scoping issue for Phase 2 but do NOT fix it now.

**Commit:** `[phase-1] Phase 1.4: verify payments route TM handling`

---

## PHASE 1.5: Chat TM Handling

**File:** `src/pages/chats/ChatsPage.jsx`

Mobile gives TM chat channel management (`canManageChannels = isCoach || isAdmin || isTeamManager`). Check the web ChatsPage:

1. Does it check `activeView` or `roleContext` to enable/disable chat features?
2. If it checks `isCoach` for management features, add `|| roleContext?.isTeamManager` alongside.
3. If it uses `activeView === 'coach'`, add `|| activeView === 'team_manager'`.

**Do NOT restructure the chat page.** Just extend the existing conditionals.

**Commit:** `[phase-1] Phase 1.5: add TM to chat management permissions`

---

## PHASE 1.6: Update LYNX-UX-PHILOSOPHY.md

**File:** `LYNX-UX-PHILOSOPHY.md` in repo root

Make these factual corrections only:

1. If the doc mentions Tele-Grotesk as the web font, change it to: "Web font: Inter Variable (self-hosted from `public/fonts/Inter-Variable.ttf`). Mobile font: Plus Jakarta Sans + Bebas Neue display."
2. If the doc lists roles, add Team Manager to the list.
3. If the doc mentions only 4 roles anywhere, update to 6 (add Team Manager and note that Player is now auto-detected).

**Do NOT rewrite the philosophy, tone, or design guidelines.** Only update factual inaccuracies.

**Commit:** `[phase-1] Phase 1.6: update UX philosophy doc — font and role corrections`

---

## PHASE 1.7: Final Verification

Run the build:
```bash
npm run build
```

**Report back with:**
```
## PHASE 1 VERIFICATION

### Build: PASS / FAIL
### Files changed: [list with line counts]
### Total lines changed: [count]

### Components audited for role checks: [count]
### Components that needed TM fixes: [list]
### Components safe (no change needed): [list]

### Widget grid TM handling: [describe outcome]
### Role switcher TM flow: VERIFIED / ISSUE
### Payments route TM: VERIFIED / ISSUE  
### Chat TM management: VERIFIED / ISSUE
### UX philosophy doc: UPDATED / NO CHANGES NEEDED

### Data scoping issues found (deferred to Phase 2):
[list any cases where TM sees org-wide data instead of team-scoped]

### Unexpected issues: NONE / [describe]
```

**Commit:** `[phase-1] Phase 1.7: verification pass complete`

---

## CC PROMPT

```
Read CC-PHASE1-ROLE-VERIFICATION.md in the repo root. Also read INVESTIGATION-REPORT-WEB-CATCHUP.md and the Phase 0 verification report for context.

This is Phase 1 — verification and hardening of the role foundation. You are auditing every component that checks roles, fixing edge cases for Team Manager, and confirming the role switcher, sidebar, widget grid, payments, and chat all handle TM correctly.

Execute sub-phases 1.1 through 1.7 in order. Commit after each. Do NOT expand scope. Do NOT build features. Do NOT redesign pages. This is a hardening pass only.

If you encounter something unexpected, STOP and report it.
```
