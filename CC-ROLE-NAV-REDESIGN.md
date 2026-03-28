# CC-ROLE-NAV-REDESIGN.md
# Role-Based Navigation Redesign — Coach, Parent, Player, Team Manager
## Repo: SgtxTorque/volleybrain-admin | Branch: main

---

## OBJECTIVE

Reorganize the sidebar nav groups and wire up the smart contextual top bar for all non-admin roles. The accordion sidebar pattern already works for all roles (built into LynxSidebar.jsx). TopBar.jsx is already reusable. The work is:

1. **Restructure nav group arrays** in MainApp.jsx for Coach, Parent, Player, and Team Manager
2. **Add contextual nav maps** (like admin's CONTEXTUAL_NAV) for each role
3. **Remove the admin-only guard** on TopBar rendering so all roles get the smart top bar
4. **Add PAGE_LABELS entries** for any new/renamed pages

No new components needed. No new files. This is a config-level change in MainApp.jsx with minor adjustments.

---

## GUARDRAILS

- **Read before modify.** Open every file referenced before changing it.
- **Never invent table names.** This spec is frontend-only — no DB changes.
- **TSC verify after each phase.** Run `npx tsc --noEmit` (or equivalent lint check) after each phase.
- **Commit after each phase.** One commit per phase with descriptive message.
- **Do not touch admin nav.** Admin nav groups and CONTEXTUAL_NAV are handled by CC-SMART-NAV-REDESIGN.md. Leave them exactly as they are.
- **Do not rename route paths.** Keep all existing route paths. We are only reorganizing which sidebar group items appear in and wiring top bar links.
- **Preserve dynamic items.** Team names (Coach, TM), child names (Parent), and team names (Player) must continue to render dynamically from roleContext.

---

## REFERENCE: APPROVED NAV STRUCTURES

### Coach Sidebar Groups

| Group | Items |
|-------|-------|
| **My teams** | Dashboard, Roster manager, [dynamic team names] |
| **Schedule & events** | Schedule, Attendance |
| **Game day** | Game prep, Standings, Leaderboards |
| **Communication** | Team chat, Announcements |
| **My stuff** | My availability, Season archives, Org directory |

**Changes from current:** Dashboard moves into "My teams" group (was standalone). Schedule becomes "Schedule & events" group with Attendance moved in from Game Day.

### Coach Top Bar (contextual)

| Current Page | Show These Links |
|-------------|-----------------|
| dashboard | Schedule, Attendance, Game prep |
| roster | Schedule, Team chat, Standings |
| schedule | Dashboard, Attendance, Team chat |
| gameprep | Attendance, Standings, Leaderboards |
| attendance | Schedule, Game prep, Standings |
| standings | Leaderboards, Game prep, Schedule |
| leaderboards | Standings, Game prep, Schedule |
| chats | Dashboard, Schedule, Roster |
| blasts | Team chat, Schedule, Dashboard |
| coach-availability | Schedule, Dashboard, Season archives |
| season-archives | Dashboard, Org directory, Schedule |
| org-directory | Dashboard, Season archives, Team chat |

### Parent Sidebar Groups

| Group | Items |
|-------|-------|
| **My players** | [dynamic child names] — auto-collapse group if 4+ children |
| **Schedule & events** | Schedule, Volunteer duties (future — placeholder only if page exists, otherwise just Schedule) |
| **Payments & registration** | Payments, Registration, Forms & waivers (future — placeholder only if page exists) |
| **Social** | Chat, Team hub |
| **My stuff** | My stuff, Archives, Directory |

**Changes from current:** Home (dashboard) removed as standalone group — parent lands on dashboard by default, it doesn't need a sidebar entry (top bar handles it). "Payments" broken out of standalone group into "Payments & registration" with Registration moved from My Stuff. Social stays but Team Hub and Chat swap order (Chat first, more used). If "Volunteer duties" or "Forms & waivers" pages don't exist yet, do NOT add them — only reorganize existing items.

**IMPORTANT:** Check if `parent-register` route/page exists. If yes, include it as "Registration" under "Payments & registration." If a "forms-waivers" route exists, include it. Do not invent routes.

### Parent Top Bar (contextual)

| Current Page | Show These Links |
|-------------|-----------------|
| dashboard | Schedule, Payments, Chat |
| schedule | Home, Payments, Chat |
| payments | Registration, Schedule, Home |
| parent-register | Payments, Schedule, Home |
| chats | Home, Schedule, Team hub |
| team-hub | Chat, Schedule, Home |
| my-stuff | Home, Archives, Directory |
| season-archives | Home, My stuff, Directory |
| org-directory | Home, My stuff, Archives |

Note: "Home" in top bar links navigates to dashboard.

### Player Sidebar Groups

| Group | Items |
|-------|-------|
| **My team** | Schedule, Achievements, [dynamic team names] |
| **Stats & competition** | My stats, Leaderboards, Standings |
| **My stuff** | Profile & stats (my-stuff), Challenges (if route exists), Badges (if route exists) |

**Changes from current:** Home removed as standalone group (same logic as Parent — dashboard is default landing). Schedule moves from standalone group into "My team." Achievements moves from standalone into "My team." "My Stuff" is split — competitive items go to new "Stats & competition" group, personal items stay in "My stuff." If "challenges" or "badges" routes don't exist yet, do NOT add them.

### Player Top Bar (contextual)

| Current Page | Show These Links |
|-------------|-----------------|
| dashboard | Schedule, Leaderboards, Achievements |
| schedule | Home, Achievements, Leaderboards |
| achievements | Schedule, Leaderboards, My stats |
| stats | Leaderboards, Standings, Schedule |
| leaderboards | My stats, Standings, Achievements |
| standings | Leaderboards, My stats, Schedule |
| my-stuff | Home, Schedule, Achievements |

### Team Manager Sidebar Groups

| Group | Items |
|-------|-------|
| **My teams** | Dashboard, Roster manager, [dynamic team names] |
| **Schedule & events** | Schedule, Attendance |
| **Game day** | Standings, Leaderboards |
| **Communication** | Team chat, Announcements |
| **Team ops** | Payments |
| **My stuff** | Season archives, Org directory |

**Changes from current:** Dashboard moves into "My teams" (same as Coach pattern). Attendance moves from "Game day" to "Schedule & events" (same as Coach pattern). Everything else stays.

### Team Manager Top Bar (contextual)

| Current Page | Show These Links |
|-------------|-----------------|
| dashboard | Schedule, Attendance, Payments |
| roster | Schedule, Team chat, Standings |
| schedule | Dashboard, Attendance, Team chat |
| attendance | Schedule, Standings, Leaderboards |
| standings | Leaderboards, Schedule, Attendance |
| leaderboards | Standings, Schedule, Attendance |
| chats | Dashboard, Schedule, Roster |
| blasts | Team chat, Schedule, Dashboard |
| payments | Schedule, Dashboard, Team chat |
| season-archives | Dashboard, Org directory, Schedule |
| org-directory | Dashboard, Season archives, Team chat |

---

## PHASE 1: Restructure Nav Group Arrays

### File: `src/MainApp.jsx`

**Step 1.1:** Read the current coachNavGroups (lines ~1000-1027). Rewrite it to match the approved Coach structure above. Keep the same object shape (id, label, icon, items array). Keep dynamic team items exactly as they are — just move them into the right group.

**Step 1.2:** Read the current parentNavGroups (lines ~1029-1051). Rewrite to match the approved Parent structure. Check if `parent-register` exists as a route — if yes, move it to "Payments & registration." Check if volunteer-duties or forms-waivers routes exist. Only include items that have existing routes.

**Step 1.3:** Read the current playerNavGroups (lines ~1053-1071). Rewrite to match the approved Player structure. Check if challenges or badges routes exist before including them.

**Step 1.4:** Read the current teamManagerNavGroups (lines ~1073-1101). Rewrite to match the approved TM structure.

**Step 1.5:** Verify the app builds without errors. Test that sidebar renders correctly for each role by checking the getNavGroups() switch still returns the right arrays.

**Commit:** `refactor: reorganize sidebar nav groups for coach, parent, player, team_manager`

---

## PHASE 2: Wire Contextual Top Bar for All Roles

### File: `src/MainApp.jsx`

**Step 2.1:** Read the existing CONTEXTUAL_NAV map (lines ~902-924) and PAGE_LABELS map (lines ~927-935). Understand the pattern.

**Step 2.2:** Create parallel maps for each role. Naming convention:
- `COACH_CONTEXTUAL_NAV` — Map of page_id → array of related page_ids
- `PARENT_CONTEXTUAL_NAV`
- `PLAYER_CONTEXTUAL_NAV`
- `TM_CONTEXTUAL_NAV`

Use the tables from the Reference section above. Each entry maps a page ID to an array of 3-4 related page IDs.

**Step 2.3:** Create parallel PAGE_LABELS maps if needed, or extend the existing one. Every page ID referenced in the contextual nav maps must have a label. Check the existing PAGE_LABELS — if it already covers all pages, just reuse it. If not, add missing entries.

**Step 2.4:** Create a helper function (or extend existing logic) that selects the correct contextual nav map based on activeView:

```javascript
const getContextualNav = () => {
  switch (activeView) {
    case 'admin': return CONTEXTUAL_NAV;
    case 'coach': return COACH_CONTEXTUAL_NAV;
    case 'parent': return PARENT_CONTEXTUAL_NAV;
    case 'player': return PLAYER_CONTEXTUAL_NAV;
    case 'team_manager': return TM_CONTEXTUAL_NAV;
    default: return {};
  }
};
```

**Step 2.5:** Find the TopBar rendering block (lines ~1228-1252). Remove the `activeView === 'admin'` guard. Update the navLinks prop to use the role-appropriate contextual nav map via the helper function. The roleLabel prop should already adapt based on activeView — verify this.

**Step 2.6:** Verify the existing TopBar.jsx component doesn't have any admin-specific assumptions baked in. Read `src/components/v2/TopBar.jsx` and confirm it works generically with any navLinks array.

**Step 2.7:** Build and verify. Check that each role shows the correct top bar links.

**Commit:** `feat: wire smart contextual top bar for all roles`

---

## PHASE 3: Parent "My Players" Auto-Collapse

### File: `src/MainApp.jsx` and/or `src/components/layout/LynxSidebar.jsx`

**Step 3.1:** Read LynxSidebar.jsx accordion logic (expandedGroups state, auto-expand useEffect around lines 255-267).

**Step 3.2:** For the Parent role's "My players" group: if the group has 4 or more dynamic children, it should default to collapsed (not auto-expanded) unless the active page is a child profile page.

**Implementation approach:** The auto-expand useEffect already adds the active group to expandedGroups. The change is: for the "my-players" group specifically, do NOT auto-expand on initial load if item count >= 4. Only expand if the user navigates to a child profile page (which would trigger the auto-expand naturally since that page lives in the group). This may require passing a `defaultCollapsed` flag on the group config or adding a conditional in the useEffect.

**Step 3.3:** Test with a parent account that has 4+ children. Verify:
- On load, "My players" is collapsed
- Clicking the chevron expands it
- Navigating to a child profile auto-expands it
- Groups with fewer than 4 items behave normally

**Commit:** `fix: auto-collapse parent My Players group when 4+ children`

---

## PHASE 4: Verify & QA

**Step 4.1:** Switch between all 5 roles (admin, coach, parent, player, team_manager) and verify:
- Sidebar groups match the approved structures
- Accordion expand/collapse works correctly
- Active page highlights correctly in the sidebar
- Top bar shows contextual links per the mapping tables
- Top bar links navigate to the correct pages
- Dynamic items (team names, child names) still render correctly
- Role switcher dropdown in top bar still works

**Step 4.2:** Check that the Player dark theme still applies correctly (isPlayer flag, midnight bg, gold active state).

**Step 4.3:** Check that mobile breakpoint (< 700px) still hides sidebar correctly.

**Step 4.4:** Report any issues found.

**Commit:** `chore: QA pass on role nav redesign` (only if fixes were needed)

---

## FILES THAT WILL BE MODIFIED

| File | Phase | What Changes |
|------|-------|-------------|
| `src/MainApp.jsx` | 1, 2 | Nav group arrays restructured, contextual nav maps added, TopBar guard removed |
| `src/components/layout/LynxSidebar.jsx` | 3 | Auto-collapse logic for large dynamic groups |

That's it. Two files.

---

## WHAT THIS SPEC DOES NOT DO

- Does not touch admin nav (CC-SMART-NAV-REDESIGN.md owns that)
- Does not create new pages or routes
- Does not add placeholder items for future features (volunteer duties, forms & waivers, challenges, badges) unless those routes already exist
- Does not change any route paths
- Does not modify TopBar.jsx component internals (it's already reusable)
- Does not change the Player dark theme
- Does not change sidebar width or CSS variables
