# CC-PARENT-PROFILE-POLISH.md
# Parent Profile Page Polish + Navigation Fixes
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Six targeted fixes from QA on the parent experience. No major redesigns — these are polish and routing corrections.

---

## GUARDRAILS

- **Read before modify.** Open every file before changing it.
- **Do not change save handlers or data loading.** Only layout, routing, and nav config changes.
- **Write report to:** `CC-PARENT-PROFILE-POLISH-REPORT.md` in the project root.
- **Commit after each phase.**

---

## PHASE 1: Move Emergency Contact to Registration Tab

### Files:
- `src/pages/parent/PlayerProfileInfoTab.jsx`
- `src/pages/parent/PlayerProfileMedicalTab.jsx`
- `src/pages/parent/PlayerProfilePage.jsx`

**Step 1.1:** Read both tab files. The Emergency Contact section currently lives in `PlayerProfileMedicalTab.jsx` (lines 19-48). It renders: Contact Name, Phone, Relationship with edit/save functionality.

**Step 1.2:** Move the entire Emergency Contact section (JSX + edit state handling) from `PlayerProfileMedicalTab.jsx` into `PlayerProfileInfoTab.jsx`. Place it after the Parent/Guardian 2 section (end of file, before the closing `</div>`).

**Step 1.3:** PlayerProfileInfoTab needs to receive the emergency contact props. Update its signature to accept: `emergencyForm`, `setEmergencyForm`, `editingEmergency`, `setEditingEmergency`, `saveEmergencyContact`. These are already passed to PlayerProfileMedicalTab from PlayerProfilePage.jsx — just need to be passed to the Info tab too.

**Step 1.4:** Update `PlayerProfilePage.jsx` — pass the emergency props to PlayerProfileInfoTab:
```jsx
<PlayerProfileInfoTab
  ... existing props ...
  emergencyForm={emergencyForm} setEmergencyForm={setEmergencyForm}
  editingEmergency={editingEmergency} setEditingEmergency={setEditingEmergency}
  saveEmergencyContact={saveEmergencyContact}
/>
```

**Step 1.5:** Remove the Emergency Contact section from `PlayerProfileMedicalTab.jsx`. The Medical tab should now only show Medical Information (conditions + allergies). Also remove the emergency-related props from its signature if they're no longer used there.

**Step 1.6:** Keep the "No emergency contact on file" warning — move it to the Info tab along with the rest of the emergency section.

**Commit:** `fix: move emergency contact from Medical tab to Registration tab`

---

## PHASE 2: Widen Player Photo Column

### File: `src/pages/parent/PlayerProfilePage.jsx`

**Step 2.1:** Read the file. Find the left column width. It's currently set to something like `w-[360px]` or similar.

**Step 2.2:** Increase the photo column width by ~25-30%. If it's currently 360px, change to `w-[460px]`. If it uses a different value, scale up proportionally by 25-30%.

**Step 2.3:** Make sure the right column still has enough room for the tab content. At 1920px viewport minus ~230px sidebar minus ~460px photo column, the right column would be ~1230px — more than enough.

**Commit:** `polish: widen player photo column by 25%`

---

## PHASE 3: Add Dashboard to Parent Sidebar Nav

### File: `src/MainApp.jsx`

**Step 3.1:** Find `parentNavGroups` (~line 1100). Currently there is no "Dashboard" or "Home" entry — the nav starts with "My Players."

**Step 3.2:** Add a Dashboard item as the first entry, as a standalone item before the first group (or as its own single-item group, matching whatever pattern the other roles use for their dashboard entry):

```javascript
const parentNavGroups = [
  { id: 'home', label: 'Home', type: 'group', icon: 'home', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  ]},
  { id: 'myplayers', label: 'My Players', ...existing... },
  // ... rest stays the same
]
```

Check how Coach and Team Manager nav groups handle their Dashboard entry and follow the same pattern.

**Step 3.3:** Verify the parent contextual top bar (PARENT_CONTEXTUAL_NAV) includes 'dashboard' in appropriate link sets.

**Commit:** `fix: add Dashboard to parent sidebar nav`

---

## PHASE 4: Sidebar Player Click → Profile (Not Player Card)

### File: `src/MainApp.jsx` or `src/lib/routes.js`

**The problem:** When a parent clicks a child's name in the sidebar, it navigates to `player-{uuid}` which routes to ParentPlayerCardPage (sport stats). It should route to PlayerProfilePage (registration info).

**Step 4.1:** There are two approaches. Pick the one that's cleaner:

**Option A — Change sidebar item IDs:** In `parentNavGroups`, change the child item IDs from `player-${child.id}` to `player-profile-${child.id}`. This would route sidebar clicks to the profile page. The "Player Card" button on the dashboard already correctly routes to `player-${child.id}`.

**Option B — Change routes.js:** Add a parent-context-aware route that makes `player-{uuid}` go to the profile page when coming from sidebar. This is more complex and fragile.

**Recommended: Option A.** Change the sidebar nav item ID only:

```javascript
{ id: 'myplayers', label: 'My Players', type: 'group', icon: 'users', items:
  roleContext?.children?.map(child => ({
    id: `player-profile-${child.id}`,    // was: player-${child.id}
    label: child.first_name,
    icon: 'user',
    playerId: child.id,
    teams: child.team_players,
  })) || []
},
```

**Step 4.2:** Check the sidebar's active-page highlighting logic. In `LynxSidebar.jsx` around line 247, there's an active check:
```javascript
item.playerId && activePage === `player-${item.playerId}`
```
This needs to also match `player-profile-${item.playerId}`:
```javascript
item.playerId && (activePage === `player-${item.playerId}` || activePage === `player-profile-${item.playerId}`)
```

Or simplify to: `item.playerId && activePage.includes(item.playerId)`

**Commit:** `fix: parent sidebar player click goes to profile page, not player card`

---

## PHASE 5: Fix Double Header on Parent Dashboard

### File: `src/pages/roles/ParentDashboard.jsx`

**The problem:** ParentDashboard renders its own `<TopBar>` (line 477) AND MainApp.jsx renders a global TopBar (line 1306). When viewing the parent dashboard, both render — creating a double header. On other parent pages, only the global one shows (which is correct).

**Step 5.1:** Read ParentDashboard.jsx. Find the `<TopBar>` rendering (~line 477-494).

**Step 5.2:** Remove the entire local TopBar rendering from ParentDashboard. The global TopBar in MainApp.jsx already handles parent contextual nav (PARENT_CONTEXTUAL_NAV).

Delete from `<TopBar` through the closing `/>` (~lines 477-494).

**Step 5.3:** Also remove the TopBar import if it's no longer used elsewhere in the file:
```javascript
TopBar, HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
```
Remove `TopBar` from this import line (line 22).

**Step 5.4:** Check if any other dashboard pages have the same issue:
- `src/pages/dashboard/DashboardPage.jsx` (admin)
- `src/pages/roles/CoachDashboard.jsx`
- `src/pages/roles/PlayerDashboard.jsx`
- `src/pages/roles/TeamManagerDashboard.jsx`

If any of them also render a local TopBar, remove it — the global one handles all roles now.

**Commit:** `fix: remove duplicate TopBar from dashboard pages — global TopBar handles all roles`

---

## PHASE 6: Add "View Player Card" Button to Profile Header

### File: `src/pages/parent/PlayerProfilePage.jsx`

**Step 6.1:** Find the navy gradient name banner in the right column.

**Step 6.2:** Add a button in the banner that navigates to the player card page:

```jsx
<button
  onClick={() => onNavigate?.(`player-${playerId}`)}
  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition flex items-center gap-2"
>
  View Player Card →
</button>
```

Place it in the banner — either to the right of the name (aligned right) or below the status pills. Make sure it doesn't crowd the name typography. The button should be subtle (white/10 background on the navy gradient) but visible.

**Step 6.3:** Verify `onNavigate` is available in the component's props. Check the component signature and how it's called from MainApp.jsx routing.

**Commit:** `feat: add View Player Card button to profile page header`

---

## PHASE 7: Verify & Report

**Step 7.1:** `npm run build 2>&1 | tail -20`

**Step 7.2:** Write `CC-PARENT-PROFILE-POLISH-REPORT.md`:

```markdown
# Parent Profile Polish — Build Report

## Completed
- [list each change]

## Double Header Check
- ParentDashboard: [removed local TopBar / was already clean]
- CoachDashboard: [removed / clean]
- PlayerDashboard: [removed / clean]
- TeamManagerDashboard: [removed / clean]
- AdminDashboard: [removed / clean]

## Issues Found
- [any issues]
```

**Commit:** `chore: parent profile polish report`

---

## FILES MODIFIED

| Phase | File | What Changes |
|-------|------|-------------|
| 1 | `src/pages/parent/PlayerProfileInfoTab.jsx` | Add emergency contact section |
| 1 | `src/pages/parent/PlayerProfileMedicalTab.jsx` | Remove emergency contact section |
| 1 | `src/pages/parent/PlayerProfilePage.jsx` | Pass emergency props to Info tab |
| 2 | `src/pages/parent/PlayerProfilePage.jsx` | Widen photo column ~25% |
| 3 | `src/MainApp.jsx` | Add Dashboard to parentNavGroups |
| 4 | `src/MainApp.jsx` | Change sidebar player IDs to player-profile- |
| 4 | `src/components/layout/LynxSidebar.jsx` | Update active-page matching for player-profile- |
| 5 | `src/pages/roles/ParentDashboard.jsx` | Remove local TopBar |
| 5 | Other dashboard pages (if needed) | Remove local TopBar |
| 6 | `src/pages/parent/PlayerProfilePage.jsx` | Add "View Player Card" button |
