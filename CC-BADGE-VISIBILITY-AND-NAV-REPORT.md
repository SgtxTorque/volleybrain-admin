# CC-BADGE-VISIBILITY-AND-NAV — Execution Report

## Summary

All 4 phases executed successfully. Locked badges now show full-color art at 70% opacity with a styled lock overlay. Achievements navigation link added to all 5 roles. Dashboard cards link to achievements for all roles.

---

## Phase 1: Investigation Findings

### Locked Badge Rendering
- **AchievementCard.jsx:221** — `grayscale opacity-50` applied to badge container when `!isEarned`
- **AchievementDetailModal.jsx:178** — `grayscale opacity-50` applied to modal badge when `!isEarned`
- Lock icon existed only for `progress === 0` badges (AchievementCard.jsx:259)

### Achievements Route
- **Route**: `/achievements` (MainApp.jsx:740)
- **Component**: `AchievementsCatalogPage`
- **No role gate** — page loads for all roles, shows catalog-only when no `playerId`

### Navigation Status (Before)
| Role | Nav Link | Dashboard Card |
|------|----------|----------------|
| Player | Yes (line 1144) | Badges tab exists |
| Parent | No | Yes (Trophy Case card lines 554-620) |
| Coach | No | MilestoneCard exists (no link to achievements) |
| Admin | No | MilestoneCard with achievements link |
| Team Manager | No | MilestoneCard exists (no link to achievements) |

### Contextual Nav (Before)
- Player: achievements included
- Coach/Parent/Admin/TM: achievements NOT included

---

## Phase 2: Locked Badge Appearance Fix

### Files Modified
1. **`src/pages/achievements/AchievementCard.jsx`**
   - Line 221: Replaced `grayscale opacity-50` → `opacity: 0.7` (via inline style)
   - Added hover behavior: opacity bumps to 0.85 on hover using existing `isHovered` state
   - Line 259: Lock icon now shows for ALL unearned badges (removed `progress === 0` gate)
   - Lock icon styled per spec: `#1E293B` background, `#475569` border, `#94A3B8` lock color

2. **`src/pages/achievements/AchievementDetailModal.jsx`**
   - Line 178: Replaced `grayscale opacity-50` → `opacity: 0.7` (via inline style)
   - Lock icon styled per spec: `#1E293B` background, `#475569` border, `#94A3B8` lock color

### What Was Removed
- `grayscale` CSS class from locked badges
- `opacity-50` CSS class from locked badges (replaced with 0.7 inline)
- `progress === 0` condition on lock icon (now shows for all unearned)

---

## Phase 3: Navigation Updates

### Files Modified
**`src/MainApp.jsx`** — Nav groups updated:

| Role | Group | Line Added |
|------|-------|-----------|
| Admin | Game Day | `{ id: 'achievements', label: 'Achievements', icon: 'achievements' }` |
| Coach | Game Day | `{ id: 'achievements', label: 'Achievements', icon: 'achievements' }` |
| Parent | Social | `{ id: 'achievements', label: 'Achievements', icon: 'achievements' }` |
| Team Manager | Game Day | `{ id: 'achievements', label: 'Achievements', icon: 'achievements' }` |
| Player | (already had it) | No change |

### Contextual Nav Updates
- **Admin (CONTEXTUAL_NAV)**: Added `achievements` entry, updated `standings` and `leaderboards` to reference it
- **Coach (COACH_CONTEXTUAL_NAV)**: Added `achievements` entry, updated `standings` and `leaderboards`
- **Parent (PARENT_CONTEXTUAL_NAV)**: Added `achievements` entry, updated `dashboard`, `schedule`, `team-hub`
- **Team Manager (TM_CONTEXTUAL_NAV)**: Added `achievements` entry, updated `standings` and `leaderboards`

---

## Phase 4: Dashboard Cards

### Files Modified
1. **`src/pages/roles/CoachDashboard.jsx`** (line 860)
   - Existing `MilestoneCard` now has `onClick={() => onNavigate?.('achievements')}`

2. **`src/pages/roles/PlayerDashboard.jsx`** (new card in sideContent)
   - Added `MilestoneCard` with trophy="🏆", badge count, level, XP progress
   - Links to achievements page on click

3. **`src/pages/roles/TeamManagerDashboard.jsx`** (line 253)
   - Existing `MilestoneCard` now has `onClick={() => onNavigate?.('achievements')}`

4. **Parent & Admin**: Already had working cards — no changes needed

---

## Phase 5: Verification

- `npx vite build` — **PASSES** (no errors)
- All existing routes preserved
- No badge image URLs modified
- No database changes
- No auth flow changes

---

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/achievements/AchievementCard.jsx` | Locked badge: 70% opacity, lock overlay always visible, hover bump |
| `src/pages/achievements/AchievementDetailModal.jsx` | Locked badge: 70% opacity, styled lock overlay |
| `src/MainApp.jsx` | Nav links + contextual nav for all 5 roles |
| `src/pages/roles/CoachDashboard.jsx` | MilestoneCard links to achievements |
| `src/pages/roles/PlayerDashboard.jsx` | New MilestoneCard trophy card in sidebar |
| `src/pages/roles/TeamManagerDashboard.jsx` | MilestoneCard links to achievements |
