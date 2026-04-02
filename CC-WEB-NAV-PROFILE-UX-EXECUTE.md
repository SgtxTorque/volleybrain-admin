# CC-WEB-NAV-PROFILE-UX-EXECUTE
# Lynx Web Admin — Nav, Profile & Nudge Card UX Fixes
# Based on: CC Web Nav & Profile UX Audit (investigation report)
# Status: READY FOR CC EXECUTION

---

## STANDING RULES

1. **Read these files first, in order:**
   - `CLAUDE.md` in repo root (if it exists)
   - `DATABASE_SCHEMA.md` in repo root (if it exists)
   - `LYNX-UX-PHILOSOPHY.md` in repo root (if it exists)
2. **Do NOT modify any file not explicitly listed in this spec.**
3. **Do NOT rename, delete, or create any new files** unless explicitly instructed.
4. **Do NOT touch any routing logic, RouteGuard definitions, or Supabase queries.**
5. **Do NOT touch the game badge system** (`player_badges` table, GameDetailModal, GameCompletionModal).
6. **Do NOT refactor, reorganize, or "improve" anything outside the scope of each phase.**
7. **Commit after EVERY phase.** Commit message format: `[ux-fix] Phase X: description`
8. **After EACH phase, run `npx vite build` and confirm clean build before proceeding.** If the build fails, STOP and report the error. Do NOT attempt to fix it without reporting first.
9. **If a line number has shifted due to earlier phases, find the equivalent code by matching the code snippet shown.**
10. **If something is unclear or ambiguous, STOP and report back. Do NOT guess.**
11. **Use `--dangerously-skip-permissions` when launching CC.**

---

## DO NOT TOUCH LIST

These files/systems are OFF LIMITS regardless of what you encounter:

- Any file in `src/pages/settings/` (settings pages, org setup, waivers)
- Any Supabase query logic or RLS policies
- Any Stripe/payment integration code
- RouteGuard.jsx (do not change guard logic)
- Any engagement system files (achievements, badges, XP, challenges)
- Any file not explicitly named in this spec

---

## CONTEXT

Four UX issues were found during Team Manager QA. All are config/wiring fixes — no new components, no schema changes, no routing overhauls.

**Source of truth file:** `src/MainApp.jsx`
**Sidebar component:** `src/components/layout/LynxSidebar.jsx`
**Top bar component:** `src/components/layout/TopBar.jsx`
**Dashboard files (5):**
- Admin: `src/pages/DashboardPage.jsx`
- Coach: `src/pages/CoachDashboardPage.jsx`
- Parent: `src/pages/ParentDashboardPage.jsx`
- Player: `src/pages/PlayerDashboardPage.jsx`
- Team Manager: `src/pages/TeamManagerDashboardPage.jsx`

---

## PHASE 1: Dashboard as Top-Level Nav Item for All Roles

**Goal:** Dashboard must be the FIRST item in the sidebar for every role. Not nested under any group.

**Files to modify:** `src/MainApp.jsx` ONLY

**What to change:**

### 1A. Coach Nav (coachNavGroups, ~line 1069-1098)

Currently, Dashboard is nested inside the "My Teams" group as a child item. 

**Action:** Remove the Dashboard item from inside the "My Teams" group children array. Add a new top-level Dashboard item BEFORE the "My Teams" group in the coachNavGroups array.

The new Dashboard item should match this structure:
```jsx
{ type: 'single', id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
```

The "My Teams" group should then start with "Roster Manager" (or whatever its first non-Dashboard child currently is).

### 1B. Team Manager Nav (teamManagerNavGroups, ~line 1150-1180)

Same issue — Dashboard is nested inside "My Teams" group.

**Action:** Same fix as 1A. Remove Dashboard from the "My Teams" group children. Add a top-level Dashboard item as the FIRST item in the teamManagerNavGroups array.

### 1C. Player Nav (playerNavGroups, ~line 1129-1148)

Dashboard is completely missing from the nav.

**Action:** Add a top-level Dashboard item as the FIRST item in the playerNavGroups array:
```jsx
{ type: 'single', id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
```

Verify that the `LayoutDashboard` icon import from lucide-react already exists at the top of MainApp.jsx (it should, since Admin uses it). If not, add the import.

### 1D. Verify Admin and Parent

Admin and Parent already have Dashboard as top-level first item. **Do NOT change these.** Just visually confirm they match the pattern.

**Commit:** `[ux-fix] Phase 1: Dashboard top-level nav for all roles`

**Build check:** Run `npx vite build` — must pass before proceeding.

---

## PHASE 2: Wire Avatar Click to Profile Page

**Goal:** Clicking the user avatar in the top-right header navigates to /profile for ALL roles.

**Files to modify:** `src/MainApp.jsx` ONLY

**What to change:**

Find where `<TopBar` is rendered in MainApp.jsx (~line 1307-1329). The TopBar component accepts an `onAvatarClick` prop (defined in TopBar.jsx at lines 292-308), but it is currently NOT being passed.

**Action:** Add the `onAvatarClick` prop to the TopBar component:

```jsx
onAvatarClick={() => navigate('/profile')}
```

Verify that:
- `navigate` is available in scope (it should be — MainApp uses React Router)
- The `/profile` route exists and renders `MyProfilePage.jsx` (confirmed in investigation — no RouteGuard restriction)

**Do NOT modify TopBar.jsx.** The prop interface already exists and works.

**Commit:** `[ux-fix] Phase 2: Wire avatar click to profile page`

**Build check:** Run `npx vite build` — must pass before proceeding.

---

## PHASE 3: Role-Aware Settings Gear Behavior

**Goal:** Settings gear navigates admins to /settings/organization (current behavior). All other roles navigate to /profile instead of silently redirecting to dashboard.

**Files to modify:**
- `src/MainApp.jsx`
- `src/components/layout/TopBar.jsx`
- `src/components/layout/LynxSidebar.jsx`

**Root cause (from investigation):** All 8 settings routes in MainApp.jsx (lines 755-763) are wrapped in `RouteGuard allow={['admin']}`. When a non-admin clicks the gear, they hit the guard → silent redirect to /dashboard → looks like a page refresh.

**What to change:**

### 3A. TopBar.jsx — Settings gear click handler (~line 288)

Find the settings gear icon and its `onSettingsClick` prop/handler.

**Action:** The TopBar already receives `onSettingsClick` as a prop. No changes needed here IF MainApp is passing the right function. Verify this — if TopBar has a hardcoded navigate or onClick, change it to use the `onSettingsClick` prop exclusively.

### 3B. LynxSidebar.jsx — Settings item (~line 433)

Find the hardcoded `onNavigate?.('organization')` call on the settings item.

**Action:** Replace with the `onSettingsClick` prop/callback passed from MainApp. The sidebar should not decide the route — it should call back to the parent.

If LynxSidebar doesn't currently receive an `onSettingsClick` prop, add it to the component's props and wire it to the settings item click.

### 3C. MainApp.jsx — Pass role-aware settings handler

Find where TopBar and LynxSidebar are rendered.

**Action:** Create a single handler function that checks the current user's role:

```jsx
const handleSettingsClick = () => {
  const isAdmin = userRoles?.some(r => r.role === 'league_admin') || false;
  if (isAdmin) {
    navigate('/settings/organization');
  } else {
    navigate('/profile');
  }
};
```

Pass this handler as `onSettingsClick` to BOTH TopBar and LynxSidebar.

**Important:** Use the existing role/auth context pattern already in MainApp.jsx to determine the user's role. Find how the existing nav group selection works (it already switches on role) and use the same source. Do NOT create a new role-checking mechanism.

**Do NOT modify RouteGuard.jsx.** The admin-only guard on /settings/* is correct — we're routing non-admins away from it entirely.

**Commit:** `[ux-fix] Phase 3: Role-aware settings gear routing`

**Build check:** Run `npx vite build` — must pass before proceeding.

---

## PHASE 4: Reposition Nudge Card Above Attention Strip

**Goal:** In ALL 5 dashboard files, move the MascotNudge component from its current position (after BodyTabs, at the bottom) to between the HeroCard and the AttentionStrip/needs-attention section.

**New layout order for all dashboards:**
```
HeroCard
MascotNudge  ← moved here
AttentionStrip / "needs attention" section
BodyTabs (Roster, Payments, Schedule, Attendance tabs)
```

**Files to modify (5):**
1. `src/pages/DashboardPage.jsx` — Admin (~line 1248-1255)
2. `src/pages/CoachDashboardPage.jsx` — Coach (~line 792-799)
3. `src/pages/ParentDashboardPage.jsx` — Parent (~line 677-686)
4. `src/pages/PlayerDashboardPage.jsx` — Player (~line 397-405)
5. `src/pages/TeamManagerDashboardPage.jsx` — Team Manager (~line 204-217)

**For EACH file:**

1. Find the `<MascotNudge` JSX block (including any wrapping conditional, e.g., `{unsignedWaivers > 0 && !nudgeDismissed && (<MascotNudge ... />)}`)
2. CUT the entire block (including the conditional wrapper)
3. PASTE it immediately after the HeroCard section and before the AttentionStrip / attention section
4. Do NOT change any props, conditions, or logic — just move the JSX position

**Preserve all existing conditional rendering logic.** If Admin's nudge only shows when `unsignedWaivers > 0 && !nudgeDismissed`, keep that exact condition. If TM's nudge always shows, keep it always showing. Only the POSITION changes.

**Commit:** `[ux-fix] Phase 4: Reposition nudge card below hero for all dashboards`

**Build check:** Run `npx vite build` — must pass.

---

## VERIFICATION REPORT

After all 4 phases are complete, produce a report with this exact format:

```
## CC-WEB-NAV-PROFILE-UX — Verification Report

### Phase 1: Dashboard Nav
- [ ] Coach: Dashboard is top-level, first item (not nested under My Teams)
- [ ] Team Manager: Dashboard is top-level, first item (not nested under My Teams)
- [ ] Player: Dashboard nav item exists as top-level, first item
- [ ] Admin: Unchanged, still top-level first item
- [ ] Parent: Unchanged, still top-level first item

### Phase 2: Avatar Click
- [ ] onAvatarClick prop is wired on TopBar in MainApp.jsx
- [ ] Clicking avatar navigates to /profile
- [ ] /profile route exists and has no role restriction

### Phase 3: Settings Gear
- [ ] Admin clicking gear → /settings/organization
- [ ] Coach clicking gear → /profile
- [ ] Team Manager clicking gear → /profile
- [ ] Parent clicking gear → /profile
- [ ] Player clicking gear → /profile
- [ ] LynxSidebar settings item uses callback (not hardcoded route)

### Phase 4: Nudge Card
- [ ] Admin dashboard: MascotNudge is between HeroCard and AttentionStrip
- [ ] Coach dashboard: MascotNudge is between HeroCard and AttentionStrip
- [ ] Parent dashboard: MascotNudge is between HeroCard and AttentionStrip
- [ ] Player dashboard: MascotNudge is between HeroCard and AttentionStrip
- [ ] TM dashboard: MascotNudge is between HeroCard and AttentionStrip
- [ ] All conditional rendering logic preserved (Admin dismiss, Coach RSVP count, etc.)

### Build Check
- [ ] `npx vite build` passes with exit code 0 (chunk warning OK)

### Files Modified (expected ~8-9):
- src/MainApp.jsx
- src/components/layout/TopBar.jsx
- src/components/layout/LynxSidebar.jsx
- src/pages/DashboardPage.jsx
- src/pages/CoachDashboardPage.jsx
- src/pages/ParentDashboardPage.jsx
- src/pages/PlayerDashboardPage.jsx
- src/pages/TeamManagerDashboardPage.jsx
```

---

## MANUAL QA CHECKLIST (for Carlos after CC finishes)

Test each role using the role switcher:

**As Admin:**
- [ ] Dashboard is first sidebar item
- [ ] Click avatar → lands on /profile page
- [ ] Click settings gear → lands on /settings/organization
- [ ] Nudge card appears below hero header (if conditions met)

**As Coach:**
- [ ] Dashboard is first sidebar item (NOT inside My Teams)
- [ ] My Teams group starts with Roster Manager (or next item after Dashboard)
- [ ] Click avatar → lands on /profile page
- [ ] Click settings gear → lands on /profile (NOT org settings, NOT dashboard refresh)
- [ ] Nudge card appears below hero header

**As Team Manager:**
- [ ] Dashboard is first sidebar item (NOT inside My Teams)
- [ ] Click avatar → lands on /profile page
- [ ] Click settings gear → lands on /profile (NOT dashboard refresh)
- [ ] Nudge card appears below hero header

**As Parent:**
- [ ] Dashboard is still first sidebar item (unchanged)
- [ ] Click avatar → lands on /profile page
- [ ] Click settings gear → lands on /profile
- [ ] Nudge card appears below hero header

**As Player:**
- [ ] Dashboard now appears in sidebar
- [ ] Click avatar → lands on /profile page
- [ ] Click settings gear → lands on /profile
- [ ] Nudge card appears below hero header
