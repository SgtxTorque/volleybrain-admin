# CC-WEB-AUDIT-FIXES.md
# Lynx Web Admin — Full Audit Fix Spec (All Phases)

## READ FIRST
1. `CLAUDE.md`
2. `WEB-AUDIT-REPORT.md` (findings reference)

## EXECUTION MODEL
Run all 4 phases sequentially. Commit and push after EACH phase. Do not stop between fixes within a phase. If a fix requires investigation (marked with ⚠️), investigate first, then apply the fix or skip with a note. Run `npm run dev` after each phase to verify no build errors.

---
---

# PHASE 0: EMERGENCY SECURITY
**Commit message:** `"Phase 0: Emergency security — platform auth, route guards, gitignore cleanup"`

---

## FIX 0.1 — Platform Mode Auth Protection
**Finding:** 1.1 (CRITICAL) — Any authenticated user can access all 10 `/platform/*` routes by typing the URL.
**File:** `src/MainApp.jsx`

**Line 784-786** — The `useState` initializer. Change to:
```javascript
const [appMode, setAppMode] = useState(() =>
  (window.location.pathname.startsWith('/platform') && isPlatformAdmin) ? 'platform' : 'org'
)
```

**Lines 789-793** — The URL sync `useEffect`. Change to:
```javascript
useEffect(() => {
  const isPlatformUrl = mainLocation.pathname.startsWith('/platform')
  if (isPlatformUrl && isPlatformAdmin && appMode !== 'platform') setAppMode('platform')
  else if (isPlatformUrl && !isPlatformAdmin) navigate('/dashboard', { replace: true })
  else if (!isPlatformUrl && appMode === 'platform') setAppMode('org')
}, [mainLocation.pathname, isPlatformAdmin])
```

**Test:** Non-admin typing `/platform/overview` → redirected to `/dashboard`. Platform admin → still works.

---

## FIX 0.2 — Add RouteGuard to /teams
**Finding:** 1.3 — TeamsPage (create/edit/delete teams) has no guard.
**File:** `src/MainApp.jsx`, line 695

Wrap in RouteGuard:
```javascript
<Route path="/teams" element={<RouteGuard allow={['admin']} activeView={activeView}><TeamsPage showToast={showToast} navigateToTeamWall={navigateToTeamWall} onNavigate={(pageId, params) => navigate(getPathForPage(pageId, params))} /></RouteGuard>} />
```

---

## FIX 0.3 — Add RouteGuard to /payments
**Finding:** 1.4 + 3.2 — Coach/player/TM see full admin financial page.
**File:** `src/MainApp.jsx`, lines 703-707

Change to:
```javascript
<Route path="/payments" element={
  activeView === 'parent'
    ? <ParentPaymentsPage roleContext={roleContext} showToast={showToast} />
    : <RouteGuard allow={['admin', 'team_manager']} activeView={activeView}><PaymentsPage showToast={showToast} /></RouteGuard>
} />
```

---

## FIX 0.4 — Remove Dead Platform Routes from RoutedContent
**Finding:** 1.6 — 3 platform routes in RoutedContent never render (appMode switches to PlatformShell first).
**File:** `src/MainApp.jsx`, lines 756-758

Delete these three lines entirely:
```javascript
<Route path="/platform/admin" element={<RouteGuard allow={['admin']} activeView={activeView}><PlatformAdminPage showToast={showToast} /></RouteGuard>} />
<Route path="/platform/analytics" element={<RouteGuard allow={['admin']} activeView={activeView}><PlatformAnalyticsPage showToast={showToast} /></RouteGuard>} />
<Route path="/platform/subscriptions" element={<RouteGuard allow={['admin']} activeView={activeView}><PlatformSubscriptionsPage showToast={showToast} /></RouteGuard>} />
```

---

## FIX 0.5 — .gitignore + Remove from Git Tracking
**Finding:** 4.4/4.5/4.6 (CRITICAL) + 4.1/4.2

Add to `.gitignore`:
```
# Dead code archives
src/_archive/
src_backup/

# Reference materials (90MB, contains credentials)
reference/
```

Remove the broken line `src_backup/NUL` from `.gitignore`.

Then run:
```bash
git rm -r --cached reference/ 2>/dev/null || true
git rm -r --cached src/_archive/ 2>/dev/null || true
git rm -r --cached src_backup/ 2>/dev/null || true
```

Do NOT delete the directories from disk. Just remove from git tracking.

---

**After all Phase 0 fixes:** `npm run dev` — verify no errors. Then:
```bash
git add -A && git commit -m "Phase 0: Emergency security — platform auth, route guards, gitignore cleanup" && git push
```

---
---

# PHASE 1: NAVIGATION FIXES
**Commit message:** `"Phase 1: Navigation fixes — route guards, team-hub fallback, player access, text fixes"`

---

## FIX 1.1 — Parent "Team Hub" Fallback
**Finding:** 3.6 (HIGH) — `team-hub` nav item falls through to `/dashboard` when children have no teams.
**File:** `src/MainApp.jsx`, lines 1077-1083

Change `handleNavigation` team-hub block to:
```javascript
if (itemId === 'team-hub') {
  const firstTeamId = roleContext?.children?.[0]?.team_players?.[0]?.team_id
  if (firstTeamId) {
    navigate(`/teams/${firstTeamId}`)
    return
  }
  showToast?.('No team found. Your child may not be assigned to a team yet.', 'info')
  return
}
```

---

## FIX 1.2 — Player "Profile & Stats" Blocked by Parent Guard
**Finding:** 3.4 (HIGH) — Player nav points to `/my-stuff` which has `allow={['parent']}`.
**File:** `src/MainApp.jsx`, line 687

Change:
```javascript
// BEFORE:
<RouteGuard allow={['parent']} activeView={activeView}>
// AFTER:
<RouteGuard allow={['parent', 'player']} activeView={activeView}>
```

---

## FIX 1.3 — Player Chat Channel Filtering
**Finding:** 3.3 (HIGH) — Player sees ALL chat channels (no team filter).
**File:** `src/pages/chats/ChatsPage.jsx`

After the team_manager filter block (after line 75), add:
```javascript
// Player: filter by player's team membership
if (activeView === 'player' && roleContext?.playerInfo?.team_players?.length > 0) {
  userTeamIds = roleContext.playerInfo.team_players.map(tp => tp.team_id).filter(Boolean)
}
// Admin sees all channels (no team filtering) — intentional
```

Note: playerInfo is currently null (playerSelf not implemented), so this is future-proofing. No immediate behavioral change.

---

## FIX 1.4 — Add RouteGuard to /parent/player/* Routes
**Finding:** Security audit — Any user can view any player's profile by URL.
**File:** `src/MainApp.jsx`, lines 683-684

Wrap both routes:
```javascript
<Route path="/parent/player/:playerId/profile" element={<RouteGuard allow={['parent', 'admin', 'coach']} activeView={activeView}><PlayerProfileRoute roleContext={roleContext} showToast={showToast} /></RouteGuard>} />
<Route path="/parent/player/:playerId" element={<RouteGuard allow={['parent', 'admin', 'coach']} activeView={activeView}><ParentPlayerCardRoute roleContext={roleContext} showToast={showToast} /></RouteGuard>} />
```

---

## FIX 1.5 — Add RouteGuard to /stats/:playerId
**Finding:** Security audit — Any user can view any player's stats by guessing ID.
**File:** `src/MainApp.jsx`, lines 734-736

Wrap:
```javascript
<Route path="/stats/:playerId" element={
  <RouteGuard allow={['admin', 'coach', 'parent']} activeView={activeView}>
    <PlayerStatsPage showToast={showToast} />
  </RouteGuard>
} />
```

---

## FIX 1.6 — Fix "undefined's" in Achievements playerName
**Finding:** 3.9 (LOW) — Shows "undefined's Achievements" when no children data.
**File:** `src/MainApp.jsx`, line 722

Change the playerName prop:
```javascript
// BEFORE:
playerName={activeView === 'player' ? (selectedPlayerForView ? `${selectedPlayerForView.first_name}'s` : 'My') : `${roleContext?.children?.[0]?.first_name}'s`}

// AFTER:
playerName={activeView === 'player' ? (selectedPlayerForView ? `${selectedPlayerForView.first_name}'s` : 'My') : (roleContext?.children?.[0]?.first_name ? `${roleContext.children[0].first_name}'s` : 'Player')}
```

---

## FIX 1.7 — Fix Unknown activeView Dashboard Fallback
**Finding:** 3.7 (MEDIUM) — Unknown activeView renders full admin dashboard.
**File:** `src/MainApp.jsx`, line 669

Change the final fallback in the dashboard ternary from `<DashboardPage .../>` to:
```javascript
<div className="flex items-center justify-center h-[50vh] text-center">
  <div>
    <p className="text-lg font-semibold">No dashboard available for this role.</p>
    <p className="text-sm text-gray-500 mt-2">Try switching to a different role using the sidebar.</p>
  </div>
</div>
```

---

**After all Phase 1 fixes:** `npm run dev` — verify no errors. Then:
```bash
git add -A && git commit -m "Phase 1: Navigation fixes — route guards, team-hub fallback, player access, text fixes" && git push
```

---
---

# PHASE 2: COMPONENT & PROP FIXES
**Commit message:** `"Phase 2: Component fixes — shoutout modal, dead code, button overlap, unread accuracy"`

---

## FIX 2.1 — GiveShoutoutModal Missing `visible` Prop
**Finding:** 5.1 (HIGH) — Modal opens but never loads recipients/categories.
**File:** `src/pages/roles/CoachDashboard.jsx`, lines 869-874

Change to:
```javascript
<GiveShoutoutModal
  visible={showShoutoutModal}
  teamId={selectedTeam.id}
  teamName={selectedTeam.name}
  onClose={() => setShowShoutoutModal(false)}
  onSuccess={() => { setShowShoutoutModal(false); showToast?.('Shoutout sent!', 'success') }}
  showToast={showToast}
/>
```

---

## FIX 2.2 — Remove WarmupTimerModal Dead Code
**Finding:** 5.11 — `setShowWarmupTimer(true)` never called from any UI.
**File:** `src/pages/roles/CoachDashboard.jsx`

Delete:
1. The entire `WarmupTimerModal` function (lines 180-244)
2. The state declaration: `const [showWarmupTimer, setShowWarmupTimer] = useState(false)` (line 277)
3. The render block (lines 865-867):
```javascript
{showWarmupTimer && (
  <WarmupTimerModal onClose={() => setShowWarmupTimer(false)} />
)}
```

---

## FIX 2.3 — Remove ParentChecklistWidget Unused Import
**Finding:** 5.8 — Imported but never used in JSX.
**File:** `src/MainApp.jsx`, line 44

Change:
```javascript
// BEFORE:
import { SpotlightOverlay, ParentChecklistWidget, FloatingHelpButton } from './components/parent/ParentOnboarding'
// AFTER:
import { SpotlightOverlay, FloatingHelpButton } from './components/parent/ParentOnboarding'
```

---

## FIX 2.4 — FloatingHelpButton No-Op Buttons
**Finding:** 5.5 — "Help Center" and "Contact Support" do nothing.
**File:** `src/components/parent/ParentOnboarding.jsx`

Find the "Help Center" button (around line 439). Change its onClick:
```javascript
onClick={() => { window.open('https://thelynxapp.com', '_blank'); setShowMenu(false) }}
```

Find the "Contact Support" button (around line 451). Change its onClick:
```javascript
onClick={() => { window.location.href = 'mailto:support@thelynxapp.com?subject=Lynx Support Request'; setShowMenu(false) }}
```

---

## FIX 2.5 — FloatingHelpButton / FloatingChatButton Overlap
**Finding:** 5.9 — Both at `bottom-6 right-6`. Help covers chat for parent view.
**File:** `src/components/layout/FloatingChatButton.jsx`

Change the button className:
```javascript
// BEFORE:
className="fixed bottom-6 right-6 z-40 ...
// AFTER:
className="fixed bottom-6 right-24 z-40 ...
```

---

## FIX 2.6 — FloatingChatButton Inflated Unread Count
**Finding:** 5.12 — Counts ALL messages in 24hrs, not just user's channels.
**File:** `src/components/layout/FloatingChatButton.jsx`

Replace the entire `loadUnread` function:
```javascript
async function loadUnread() {
  try {
    const { data: memberships } = await supabase
      .from('channel_members')
      .select('channel_id, last_read_at')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      setUnreadCount(0)
      return
    }

    let total = 0
    for (const membership of memberships) {
      const since = membership.last_read_at || new Date(Date.now() - 86400000).toISOString()
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', membership.channel_id)
        .neq('sender_id', user.id)
        .gt('created_at', since)
      total += (count || 0)
    }
    setUnreadCount(total)
  } catch { setUnreadCount(0) }
}
```

---

## FIX 2.7 — LynxSidebar Unused Props
**Finding:** 4.10 — 5 unused destructured props.
**File:** `src/components/layout/LynxSidebar.jsx`, line 108

Remove `activePathname = ''`, `orgInitials = ''`, `orgLogo = null`, `teamName = ''`, `teamSub = ''` from the function signature. Keep everything else.

Also check MainApp.jsx where LynxSidebar is rendered (~lines 1151-1170) — if any of these are passed as props, remove them from the caller too. Do NOT remove props that are still used.

---

**After all Phase 2 fixes:** `npm run dev` — verify no errors. Then:
```bash
git add -A && git commit -m "Phase 2: Component fixes — shoutout modal, dead code, button overlap, unread accuracy" && git push
```

---
---

# PHASE 3: DEAD CODE CLEANUP
**Commit message:** `"Phase 3: Dead code cleanup — ~70 orphaned files removed, specs moved to docs/"`

## CRITICAL RULE
Before deleting ANY file or directory, verify with grep:
```bash
grep -rn "FILENAME_OR_DIRNAME" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v node_modules
```
If ANY active file imports it, DO NOT DELETE. Skip and note in report.

---

## FIX 3.1 — Move Spec Files to docs/
```bash
mkdir -p docs/specs
mv CC-*.md docs/specs/ 2>/dev/null || true
mv CC_*.md docs/specs/ 2>/dev/null || true
mv TEAMWALL_*.md docs/specs/ 2>/dev/null || true
mv TEAM_HUB_*.md docs/specs/ 2>/dev/null || true
mv INVESTIGATION-*.md docs/specs/ 2>/dev/null || true
mv WEB_BETA_GAMEPLAN.md docs/specs/ 2>/dev/null || true
mv QA-AUDIT-RESULTS.md docs/specs/ 2>/dev/null || true
mv MOBILE-FEATURE-AUDIT.md docs/specs/ 2>/dev/null || true
mv MOBILE_PARITY.md docs/specs/ 2>/dev/null || true
mv PLATFORM-PARITY-GAP-ANALYSIS.md docs/specs/ 2>/dev/null || true
mv WEB-FEATURE-AUDIT.md docs/specs/ 2>/dev/null || true
```
DO NOT MOVE: CLAUDE.md, README.md, DATABASE_SCHEMA.md, SUPABASE_SCHEMA.md, LYNX-UX-PHILOSOPHY.md, MISSING_TABLES.sql, WEB-AUDIT-REPORT.md, WEB-AUDIT-DASHBOARD.html, WEB-NAVIGATION-MAP.md

---

## FIX 3.2 — Record Line Count Before Cleanup
```bash
echo "BEFORE cleanup:" && find src -name "*.jsx" -not -path "*_archive*" -not -path "*src_backup*" | xargs wc -l | tail -1
```

---

## FIX 3.3 — Delete Orphaned Directories (verify each first)

**`src/components/dashboard/`** (~19 files):
```bash
grep -rn "from.*components/dashboard\|components/dashboard" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v "src/components/dashboard/"
# If ZERO results: delete
rm -rf src/components/dashboard/
```

**`src/components/coach/`** (~26 files):
```bash
grep -rn "from.*components/coach\|components/coach" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v "src/components/coach/"
# If ZERO results: delete. If ANY active importer found: STOP and report which file.
rm -rf src/components/coach/
```

**`src/components/player/`** (~6 files):
```bash
grep -rn "from.*components/player\|components/player" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v "src/components/player/"
# If ZERO results: delete
rm -rf src/components/player/
```

---

## FIX 3.4 — Delete Orphaned Widget System Chain
Verify and delete each individually:
```bash
for f in DashboardGrid.jsx DashboardGrids.jsx DashboardLayout.jsx EditLayoutButton.jsx WidgetLibraryPanel.jsx widgetComponents.jsx SpacerWidget.jsx; do
  base=$(basename "$f" .jsx)
  count=$(grep -rn "$base" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v "src/components/layout/$f" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "DELETING: src/components/layout/$f (0 importers)"
    rm -f "src/components/layout/$f"
  else
    echo "KEEPING: src/components/layout/$f ($count importers)"
  fi
done
```

Also check `widgetRegistry.js` or `layoutService.js` if present:
```bash
grep -rn "widgetRegistry\|layoutService" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v "widgetRegistry\|layoutService" | head -5
```

---

## FIX 3.5 — Delete Individual Orphaned Files
For EACH file, verify then delete:
```bash
declare -a ORPHAN_SUSPECTS=(
  "src/pages/public/TeamWallPage.jsx"
  "src/pages/achievements/TrackedAchievementsWidget.jsx"
  "src/pages/dashboard/DashboardWidgetsExample.jsx"
  "src/components/layout/LiveActivitySidebar.jsx"
  "src/components/journey/JourneyTimeline.jsx"
  "src/components/engagement/ChallengeCard.jsx"
  "src/components/engagement/ChallengeDetailModal.jsx"
  "src/components/engagement/AchievementCelebrationModal.jsx"
  "src/components/engagement/HexBadge.jsx"
  "src/components/engagement/LevelBadge.jsx"
  "src/components/games/GameStatsEntryModal.jsx"
  "src/components/games/GameScoringModal.jsx"
  "src/components/parent/ParentHeroCard.jsx"
  "src/components/parent/ParentTopBanner.jsx"
  "src/components/parent/ParentEventCard.jsx"
  "src/components/parent/EngagementProgressCard.jsx"
  "src/components/parent/NextEventCard.jsx"
  "src/components/parent/ParentJourneyCard.jsx"
  "src/components/parent/QuickLinksCard.jsx"
  "src/components/parent/SeasonRecordCard.jsx"
)

for filepath in "${ORPHAN_SUSPECTS[@]}"; do
  base=$(basename "$filepath" .jsx)
  count=$(grep -rn "$base" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v src_backup | grep -v "$filepath" | wc -l)
  if [ "$count" -eq 0 ]; then
    echo "DELETING: $filepath (0 importers)"
    rm -f "$filepath"
  else
    echo "KEEPING: $filepath ($count active importers)"
  fi
done
```

**⚠️ DO NOT include `src/pages/roles/ParentChildHero.jsx` in the delete list.** It is actively imported by ParentDashboard.jsx line 374.

---

## FIX 3.6 — Clean Up Index Files
Check if any barrel export files now reference deleted files:
```bash
for idx in $(find src -name "index.js" -not -path "*_archive*" -not -path "*node_modules*"); do
  echo "=== $idx ==="
  cat "$idx"
done
```
If any index.js exports a deleted component, remove that export line.

---

## FIX 3.7 — Record Line Count After Cleanup
```bash
echo "AFTER cleanup:" && find src -name "*.jsx" -not -path "*_archive*" -not -path "*src_backup*" | xargs wc -l | tail -1
```
Report the difference.

---

**After all Phase 3 fixes:** `npm run dev` — verify no errors. Then:
```bash
git add -A && git commit -m "Phase 3: Dead code cleanup — ~70 orphaned files removed, specs moved to docs/" && git push
```

---
---

# PHASE 4: ARCHITECTURE FIXES
**Commit message:** `"Phase 4: Architecture fixes — schedule filtering, context optimization, scope fixes"`

---

## FIX 4.1 — ⚠️ Investigate loadRoleContext Scope
**Finding:** 1.2 (HIGH)
**File:** `src/MainApp.jsx`

First, determine if RoutedContent is defined INSIDE or OUTSIDE MainApp:
```bash
grep -n "^function RoutedContent\|^function MainApp\|^  function RoutedContent\|^  function MainApp" src/MainApp.jsx
```

If RoutedContent is a SIBLING function (defined outside MainApp at module level): `loadRoleContext` is NOT in scope at line 665. Fix by passing it as a prop:
- Add `onRefreshRoles` prop to RoutedContent
- Pass `loadRoleContext` from MainApp where RoutedContent is rendered
- Change line 665 from `onComplete={() => loadRoleContext()}` to `onComplete={() => onRefreshRoles?.()}`

If RoutedContent is NESTED inside MainApp: No bug. Skip.

---

## FIX 4.2 — SchedulePage: Filter Events by Team for Parent/Player
**Finding:** 3.8 (MEDIUM)
**File:** `src/pages/schedule/SchedulePage.jsx`

After the main Supabase query returns `data` (around line 84), and BEFORE the `transformedData` map, add:
```javascript
// Filter events to user's teams for parent/player roles
let filteredData = data || []
if (activeView === 'parent' && roleContext?.children?.length > 0) {
  const childTeamIds = new Set()
  roleContext.children.forEach(child => {
    child.team_players?.forEach(tp => { if (tp.team_id) childTeamIds.add(tp.team_id) })
  })
  if (childTeamIds.size > 0) {
    filteredData = filteredData.filter(event => !event.team_id || childTeamIds.has(event.team_id))
  }
}
if (activeView === 'player' && roleContext?.playerInfo?.team_players?.length > 0) {
  const playerTeamIds = new Set(roleContext.playerInfo.team_players.map(tp => tp.team_id).filter(Boolean))
  if (playerTeamIds.size > 0) {
    filteredData = filteredData.filter(event => !event.team_id || playerTeamIds.has(event.team_id))
  }
}
```

Then change the transformedData source:
```javascript
// BEFORE:
const transformedData = (data || []).map(event => ({
// AFTER:
const transformedData = filteredData.map(event => ({
```

---

## FIX 4.3 — ⚠️ BlastAlertChecker Column Verification
**Finding:** 5.13 (MEDIUM)
**File:** `src/components/layout/BlastAlertChecker.jsx`

Read the full file. Cross-reference the column names it queries against `DATABASE_SCHEMA.md` or `SUPABASE_SCHEMA.md`. If the column name is wrong (e.g., `profile_id` should be `recipient_id` or `user_id`), fix it. If correct, add a clarifying comment and move on.

---

## FIX 4.4 — ParentTutorialContext: Only Load for Parent Role
**Finding:** 4.8 (MEDIUM)
**File:** `src/contexts/ParentTutorialContext.jsx`

Open the file. Find the useEffect(s) that call `loadTutorialState` and/or `loadChecklistData`. Add an early return if the user is not a parent:

**⚠️ The context may not have access to `activeView`.** Check what's available. Options:
1. If the context uses `useAuth()` and can access `user_roles`, check for parent role there
2. If no role info is available inside the context, wrap `<ParentTutorialProvider>` conditionally in MainApp.jsx:

```javascript
// In MainApp.jsx, only provide for parent view:
const TutorialWrapper = activeView === 'parent' ? ParentTutorialProvider : ({ children }) => children
// Then use <TutorialWrapper> instead of <ParentTutorialProvider>
```

Choose whichever approach is least invasive. If neither is clean, skip and note.

---

**After all Phase 4 fixes:** `npm run dev` — verify no errors. Then:
```bash
git add -A && git commit -m "Phase 4: Architecture fixes — schedule filtering, context optimization, scope fixes" && git push
```

---
---

# FINAL REPORT

After all 4 phases, produce a brief summary:
```
## Web Audit Fix Summary
- Phase 0: [X] fixes applied, [Y] skipped
- Phase 1: [X] fixes applied, [Y] skipped
- Phase 2: [X] fixes applied, [Y] skipped
- Phase 3: [X] files deleted, [Y] lines removed, [Z] files kept (had active importers)
- Phase 4: [X] fixes applied, [Y] skipped (with reasons)
- Total commits: 4
- Build status: ✅ / ❌
```
