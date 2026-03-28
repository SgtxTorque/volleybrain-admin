# CC-PARENT-PROFILE-POLISH — Build Report

**Commit**: fbd215d
**Status**: ALL 6 PHASES COMPLETE — build passes (1812 modules, 13.00s)

---

## Phase 1: Move Emergency Contact from Medical → Registration tab
- **PlayerProfileInfoTab.jsx**: Added emergency contact section (full-width, below 2-col grid), accepts new props
- **PlayerProfileMedicalTab.jsx**: Removed emergency contact entirely — now medical-only (conditions + allergies)
- **PlayerProfilePage.jsx**: Updated prop wiring — emergency props go to InfoTab, simplified Medical props

## Phase 2: Widen Photo Column
- Changed `w-[360px]` → `w-[460px]` in PlayerProfilePage.jsx (25% wider)

## Phase 3: Add Dashboard to Parent Sidebar
- Added `{ id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'home' }` as first entry in `parentNavGroups` (MainApp.jsx)

## Phase 4: Sidebar Player Click → Profile
- Changed child nav item IDs from `player-${child.id}` → `player-profile-${child.id}` in MainApp.jsx
- Updated LynxSidebar.jsx: 3 active-matching locations now check both `player-` and `player-profile-` prefixes

## Phase 5: Remove Duplicate TopBar from Dashboards
- Removed local TopBar import + JSX from 4 files:
  - ParentDashboard.jsx
  - CoachDashboard.jsx
  - PlayerDashboard.jsx
  - TeamManagerDashboard.jsx
- Global TopBar in MainApp.jsx (line 1306) handles all roles

## Phase 6: View Player Card Button
- Added "View Player Card →" button to profile name banner pills row
- Routes to `player-${playerId}` (the sport stats card page)

---

## Files Modified (9 total)
| File | Change |
|------|--------|
| `src/pages/parent/PlayerProfileInfoTab.jsx` | +emergency contact section |
| `src/pages/parent/PlayerProfileMedicalTab.jsx` | -emergency contact (medical only) |
| `src/pages/parent/PlayerProfilePage.jsx` | Wider photo col, prop rewiring, player card button |
| `src/MainApp.jsx` | Dashboard nav entry, player-profile IDs |
| `src/components/layout/LynxSidebar.jsx` | Active matching for player-profile- |
| `src/pages/roles/ParentDashboard.jsx` | -TopBar |
| `src/pages/roles/CoachDashboard.jsx` | -TopBar |
| `src/pages/roles/PlayerDashboard.jsx` | -TopBar |
| `src/pages/roles/TeamManagerDashboard.jsx` | -TopBar |

## Net Change
- **+87 lines, -152 lines** (net -65 lines — cleaner codebase)
