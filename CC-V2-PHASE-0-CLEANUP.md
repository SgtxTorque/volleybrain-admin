# CC-V2-PHASE-0-CLEANUP.md
## Phase 0: Dead Code Cleanup + Grid System Archive

**Purpose:** Clean the codebase before the v2 redesign begins. Remove confirmed dead code. Archive the drag-and-drop grid system (it may return later). This phase modifies NO working features — only removes files that are already unused.

**Branch:** Create `feat/v2-dashboard-redesign` from current HEAD. All v2 work happens on this branch.

---

## RULES

1. Read `CLAUDE.md` before starting.
2. Read `DASHBOARD-AUDIT-RESULTS.md` for the full audit context.
3. Read `LYNX-V2-KEEP-MOVE-REMOVE.md` for migration decisions.
4. **Do NOT modify any working dashboard page.** This phase only deletes/moves files that are confirmed unused.
5. **Do NOT delete any data hooks, contexts, or Supabase queries.**
6. Commit after each step. Push after all steps complete.
7. Run `npx tsc --noEmit` and `npm run build` after each step to verify nothing breaks.

---

## STEP 1: Create Branch

```bash
git checkout -b feat/v2-dashboard-redesign
```

**Commit:** `"v2: create redesign branch"`

---

## STEP 2: Delete Confirmed Dead Code

These files are imported by NOTHING in the current codebase. Verify each one with a grep before deleting:

```bash
# For each file, verify it's not imported anywhere:
grep -r "OrgSidebar" src/ --include="*.jsx" --include="*.tsx" --include="*.js" -l
# If only result is the file itself (or DashboardWidgetsExample), safe to delete.
```

**Delete these files (verify each first):**

1. `src/components/dashboard/OrgSidebar.jsx` — Legacy org sidebar, replaced by LynxSidebar
2. `src/components/layout/AdminLeftSidebar.jsx` — Legacy admin sidebar, replaced by LynxSidebar
3. `src/components/coach/CoachLeftSidebar.jsx` — Legacy coach sidebar, replaced by LynxSidebar
4. `src/components/parent/ParentLeftSidebar.jsx` — Legacy parent sidebar, replaced by LynxSidebar
5. `src/components/coach/CoachCenterDashboard.jsx` — Legacy center column, replaced by widget grid
6. `src/components/parent/ParentCenterDashboard.jsx` — Legacy center column, replaced by widget grid
7. `src/components/parent/ParentRightPanel.jsx` — Legacy right panel, replaced by widget grid
8. `src/components/player/PlayerCenterFeed.jsx` — Legacy center feed, replaced by widget grid
9. `src/components/player/PlayerSocialPanel.jsx` — Legacy social panel, replaced by widget grid
10. `src/components/coach/CoachGameDayHero.jsx` — V1 game day hero, superseded by CoachGameDayHeroV2
11. `src/pages/dashboard/DashboardWidgetsExample.jsx` — Reference/example only, never routed

**For each file:**
1. Grep to confirm no imports
2. Delete the file
3. Run `npm run build` to confirm no breakage
4. If build fails, the file IS used somewhere — do NOT delete, add a comment noting it needs investigation

**Commit:** `"v2 phase 0: remove 11 confirmed dead code files"`

---

## STEP 3: Delete Legacy Widget System

The entire `src/components/widgets/` directory contains legacy widget files superseded by `src/components/layout/widgetComponents.jsx` + `src/components/layout/DashboardGrid.jsx`.

**Verify first:**
```bash
# Check if anything imports from widgets/ directory
grep -r "from.*components/widgets" src/ --include="*.jsx" --include="*.tsx" --include="*.js" -l
```

If only `DashboardWidgetsExample.jsx` (already deleted in Step 2) imports from this directory, the entire directory is safe to delete:

```bash
rm -rf src/components/widgets/
```

**Files being removed:**
- `widgets/coach/TeamRecordWidget.jsx`
- `widgets/coach/TopPlayerWidget.jsx`
- `widgets/parent/ChildStatsWidget.jsx`
- `widgets/parent/TeamStandingsWidget.jsx`
- `widgets/parent/ChildAchievementsWidget.jsx`
- `widgets/player/MyStatsWidget.jsx`
- `widgets/player/MyBadgesWidget.jsx`
- `widgets/dashboard/DashboardGrid.jsx` (old grid, NOT the current layout/DashboardGrid.jsx)
- `widgets/dashboard/DashboardWidgets.jsx` (old widget defs, NOT the current layout/widgetComponents.jsx)

Run `npm run build` to verify.

**Commit:** `"v2 phase 0: remove legacy widgets/ directory (superseded by layout/widgetComponents)"`

---

## STEP 4: Archive Grid System Files

These files power the drag-and-drop dashboard widget system. They are CURRENTLY USED by all dashboards but will be replaced in Phases 2-6. We are NOT deleting them — we're copying them to an archive directory so they can be restored later if dashboard customization returns.

```bash
mkdir -p src/_archive/grid-system
cp src/components/layout/DashboardGrid.jsx src/_archive/grid-system/
cp src/components/layout/EditLayoutButton.jsx src/_archive/grid-system/
cp src/components/layout/WidgetLibraryPanel.jsx src/_archive/grid-system/
cp src/components/layout/SpacerWidget.jsx src/_archive/grid-system/
```

**Do NOT delete the originals yet.** They are still imported by the current dashboard pages. They will be removed when each dashboard page is rebuilt in Phases 2-6.

Create an archive README:

```bash
cat > src/_archive/grid-system/README.md << 'EOF'
# Archived: Dashboard Grid System

These files powered the drag-and-drop widget dashboard layout (react-grid-layout, 24-column).
Archived during v2 redesign (March 2026) in favor of fixed structured layouts.

May be restored in the future as a "customize your dashboard" feature.

## Files
- DashboardGrid.jsx — react-grid-layout wrapper with drag/resize
- EditLayoutButton.jsx — FAB for toggling edit mode
- WidgetLibraryPanel.jsx — Slide-out panel for adding/removing widgets
- SpacerWidget.jsx — Visual spacer/divider for grid layouts

## Original location
src/components/layout/

## To restore
Copy files back to src/components/layout/ and re-import in dashboard pages.
EOF
```

**Commit:** `"v2 phase 0: archive grid system files (drag-and-drop layout preserved for future use)"`

---

## STEP 5: Add V2 Reference Files to Repo

Copy the v2 design reference files into the repo so CC can reference them during Phases 1-6:

Create a `reference/v2-redesign/` directory and add the following:

```bash
mkdir -p reference/v2-redesign
```

Create a V2 design brief that summarizes the approved direction:

```bash
cat > reference/v2-redesign/V2-DESIGN-BRIEF.md << 'EOF'
# Lynx V2 Dashboard Design Brief

## Layout Pattern (All Roles)
- Slim sidebar: 60px, light background (#FFFFFF), dark navy active state (#10284C)
- Top bar: sticky, 56px. Contains: brand label, typography nav links, search (⌘K), notification bell, theme toggle (moon/sun), settings gear, user avatar
- Main content: 2-column grid (1fr main + 340px sidebar)
- Main column: Hero Card → Attention Strip → Role-specific zone → Body Tabs → Mascot Nudge
- Side column: Financial card (dark navy) → Weekly Load → Org Health / Badges → The Playbook → Milestone

## Visual System
- Background: #F5F6F8 (light), #060E1A (player dark mode)
- Navy: #10284C (primary), #0B1628 (midnight/depth)
- Sky: #4BB9EC (accent, interactive)
- Gold: #FFD700 (achievement only, player accent)
- Green: #22C55E (success), Red: #EF4444 (critical), Amber: #F59E0B (warning)
- Card radius: 14px everywhere
- Typography: Plus Jakarta Sans (or Inter Variable)
- No 1px border dividers — use whitespace and background shifts
- Dark cards on light background = signature Lynx rhythm

## Per-Role Top Bar Nav
- Admin: Dashboard | Analytics | Schedule | Roster
- Coach: Dashboard | Game Day | Stats | Chat
- Parent: Dashboard | Schedule | Payments | Chat
- Player: Dashboard | Stats | Badges | Leaderboard
- Team Manager: Dashboard | Schedule | Payments | Roster

## Per-Role Body Tabs
- Admin: Teams & Health | Registrations | Payments | Schedules
- Coach: Roster | Attendance | Stats | Game Prep
- Parent: Schedule | Payments | Forms & Waivers | Report Card
- Player: Badges | Challenges | Season Stats | Skills
- Team Manager: Roster | Payments | Schedule | Attendance

## Key Decisions
- Grid system: ARCHIVED (fixed layout replaces drag-and-drop)
- SeasonContext: Will be reworked to be driven by carousel/team selection
- Notifications: Bell shows icon only for now, proper system deferred
- Theme toggle: Small moon/sun icon in top bar
- Voice: Coach voice everywhere. "Let's go" not "Please proceed"
- Mascot: Present on every role as contextual nudge with action buttons
EOF
```

**Commit:** `"v2 phase 0: add v2 design reference files"`

---

## STEP 6: Verify Clean State

```bash
npx tsc --noEmit
npm run build
npm run dev  # Quick manual check that all 5 role dashboards still load
```

All dashboards should look and function exactly as they did before Phase 0. We only removed dead files and archived reference copies.

**Commit (if any fixes needed):** `"v2 phase 0: build verification and fixes"`

**Push:**
```bash
git push origin feat/v2-dashboard-redesign
```

---

## PHASE 0 COMPLETE

**What changed:**
- 11 dead code files deleted
- Legacy widgets/ directory deleted (~9 files)
- Grid system files archived to `src/_archive/grid-system/`
- V2 design reference added to `reference/v2-redesign/`
- Branch `feat/v2-dashboard-redesign` created and pushed

**What did NOT change:**
- All 5 dashboards still render and function identically
- All data hooks, contexts, and Supabase queries untouched
- All working widget components untouched
- LynxSidebar, navigation, routing all untouched

**Next:** Phase 1 (Shared Components) will be written in a new chat with fresh context. Drop `LYNX-V2-KEEP-MOVE-REMOVE.md`, `DASHBOARD-AUDIT-RESULTS.md`, and `reference/v2-redesign/V2-DESIGN-BRIEF.md` as context for that chat.

---

## CC PROMPT

```
Read CC-V2-PHASE-0-CLEANUP.md in the repo root. Execute steps 1 through 6 in order.

This is a cleanup-only phase. Do NOT modify any working dashboard pages. Only delete confirmed dead code files, archive the grid system, and add reference files.

Verify with grep before every deletion. Run npm run build after every step. If a build fails after a deletion, that file is NOT dead code — restore it and note the issue.

Read CLAUDE.md and DASHBOARD-AUDIT-RESULTS.md before starting.
```
