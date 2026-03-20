# CC-INVESTIGATE-WEB-CATCHUP.md
## Full Investigation Spec: Lynx Web Admin — Mobile Parity & UX Audit

**Purpose:** This is an INVESTIGATION ONLY. Do NOT write any code. Do NOT modify any files. Your job is to read both codebases (web and mobile), trace every system, compare them, and produce a comprehensive report of exactly what the web needs, what will break, what the risks are, and what the safest execution order is.

**Date:** March 19, 2026
**Web repo:** `SgtxTorque/volleybrain-admin` — branch `feat/desktop-dashboard-redesign`
**Mobile repo:** `SgtxTorque/Volleybrain-Mobile3` — branch `navigation-cleanup-complete`

---

## RULES

1. **DO NOT WRITE CODE.** Do not create files other than the report. Do not modify any source files. Read only.
2. Read every file referenced before making conclusions.
3. When you find something, quote the EXACT file path, line number, and the relevant code snippet.
4. If you are unsure about something, log it in Open Questions. Do not guess.
5. Think about dominoes. If changing X breaks Y, say so. If Y then breaks Z, say that too.
6. For every feature gap, state whether the web equivalent should be a desktop-adapted version or mobile-only (stays on mobile).
7. Produce the full report at the end in the format specified in DELIVERABLE.

---

## CONTEXT: Web Product Philosophy

Before investigating, internalize these rules. They are the lens through which you evaluate everything:

- **Mobile = momentum.** Help the user move, react, and complete tasks fast.
- **Web = command center.** Help the user see the system, prioritize, triage, drill in, and execute across a broader surface.
- **Parity means:** shared language, shared priorities, shared data truths, shared design system, shared workflow intent.
- **Parity does NOT mean:** pixel-copying mobile onto desktop, cramming every mobile card into desktop because there's room, making every section equally loud.
- **One screen = one job.** Every dashboard needs a primary purpose nameable in one sentence.
- **Desktop is for panels, not card soup.** Mobile full screens become desktop panels, drawers, side rails, tables, or drill-down modules.

Reference docs in web repo: `LYNX-UX-PHILOSOPHY.md`, `LynxBrandBook.html`

---

## PART 1: ARCHITECTURE & SHELL AUDIT

### 1A: Role Detection Chain

**Goal:** Map every place in the web app where a user's role is determined, stored, or checked.

**Investigate:**

1. `src/contexts/AuthContext.jsx` — How is `isAdmin` set? What queries run? What columns are checked?
2. `src/MainApp.jsx` — Find `loadRoleContext()`. Read it completely. Document:
   - Every table it queries
   - Every boolean it sets on roleContext
   - Whether `team_staff` is queried at all
   - Whether `team_manager` appears anywhere
   - The priority order for `setActiveView()`
3. `src/MainApp.jsx` — Find `getAvailableViews()`. Document every view it returns.
4. `src/MainApp.jsx` — Find the dashboard routing (the ternary chain for activeView). Document every case and what renders. Note what happens for an unrecognized activeView value.
5. **Full grep:** `grep -rn "isAdmin\|isCoach\|isParent\|isPlayer\|roleContext\." src/ --include="*.jsx" | grep -v _archive | grep -v node_modules` — document every file that checks role booleans.

**Comparison with mobile:**
- Read `lib/permissions.ts` and `lib/permissions-context.tsx` in mobile repo
- Document every role mobile supports vs web
- Document the `isTeamManager` detection chain on mobile

---

### 1B: Route Guards

**Goal:** Map every protected route and determine correctness.

**Investigate:**

1. Read `src/components/auth/RouteGuard.jsx` completely.
2. Find every `<RouteGuard>` usage in `src/MainApp.jsx`. For each:
   - Route path
   - Current `allow` array
   - Whether Team Manager should access it
3. Find routes with NO RouteGuard that probably should have one.
4. **Compare with mobile:** Read the role guard audit mobile ran (21 screens secured). Check mobile files:
   - `app/attendance.tsx`, `app/blast-composer.tsx`, `app/blast-history.tsx`, `app/volunteer-assignment.tsx` — grep for permission checks
   - Document the full mobile permission matrix for TM

---

### 1C: Sidebar Navigation

**Goal:** Understand nav group architecture and what TM needs.

**Investigate:**

1. Find all nav group definitions in `src/MainApp.jsx` (adminNavGroups, coachNavGroups, etc.). Document exact structure.
2. Read `src/components/layout/LynxSidebar.jsx` — how does it receive and render groups? Props-based or computed?
3. How are team-specific nav items generated (TeamWall links, player links)?
4. What would `teamManagerNavGroups` look like based on mobile's TM permissions?

---

### 1D: Dashboard Shell & Layout System

**Goal:** Assess whether the current shell can receive new features or needs fixing first.

**Investigate:**

1. Read `src/components/layout/DashboardContainer.jsx` — what does it provide?
2. Read `src/components/layout/DashboardGrid.jsx` and `src/components/layout/DashboardGrids.jsx` — is this the react-grid-layout system? Is it used by all dashboards?
3. Read `src/components/layout/WidgetLibraryPanel.jsx` — is the drag-drop widget system active?
4. Check each role's dashboard for layout approach:
   - `src/pages/dashboard/DashboardPage.jsx` (admin) — widget grid? Fixed layout? Both?
   - `src/pages/roles/CoachDashboard.jsx` — same questions
   - `src/pages/roles/ParentDashboard.jsx` — same questions
   - `src/pages/roles/PlayerDashboard.jsx` — same questions
5. Check responsive system: `grep -rn "text-r-\|useMediaQuery\|breakpoint\|responsive\|min-w\|max-w" src/ --include="*.jsx" | grep -v _archive | head -30`
6. **Assess:** Is the current layout system stable enough to receive TM and new features, or does it need fixing first? Be specific about what's broken vs what works.

---

### 1E: Design System Compliance

**Goal:** Check if the web follows its own design system or has drifted.

**Investigate:**

1. Read `LYNX-UX-PHILOSOPHY.md` in web repo root. Note the key rules.
2. Spot-check 5 pages for compliance:
   - Do they use `text-r-*` responsive tokens or hardcoded `text-sm`/`text-xs`?
   - Do they use `border-lynx-silver` or raw `border-slate-200`?
   - Do they use `bg-lynx-navy` or hardcoded hex?
   - Do they use `rounded-[14px]` for cards?
3. Check font: Is Inter Variable actually being used everywhere? `grep -rn "font-family\|fontFamily\|Tele-Grotesk\|Plus Jakarta" src/ --include="*.jsx" --include="*.css" | grep -v _archive | head -20`
4. **Assess:** How much design system drift exists? Would new features inherit the right tokens or need cleanup?

---

## PART 2: FEATURE GAP AUDIT

For each feature below, investigate BOTH repos and produce:
- **Mobile behavior:** What it does, what components render it, what hooks/data it uses
- **Web behavior:** What exists (if anything), what's missing, what's broken
- **Parity status:** match / partial / missing / conflicting
- **Desktop recommendation:** How should web implement this? (panel, page, drawer, sidebar widget, skip entirely)
- **Files affected on web:** What would change
- **Dependencies:** What else needs to exist first
- **Risk level:** none / low / medium / high

---

### 2A: Team Manager Role (5th Role)

**Mobile:** Read these files:
- `components/TeamManagerHomeScroll.tsx` — what cards does it render?
- `components/InviteCodeModal.tsx`
- `components/empty-states/TeamManagerSetupPrompt.tsx`
- `components/coach-scroll/ManagerPaymentCard.tsx`, `ManagerAvailabilityCard.tsx`, `ManagerRosterCard.tsx`
- `hooks/useTeamManagerData.ts` — what data does it fetch?
- `app/team-manager-setup.tsx` — what's the setup wizard flow?
- `app/(auth)/signup.tsx` — how does TM appear in signup?
- `components/DashboardRouter.tsx` — how does TM route?
- `lib/permissions.ts` — full TM permission set
- `lib/permissions-context.tsx` — how is `isTeamManager` detected?

**Web:** Search for every `team_manager` reference. Document what exists and what's missing.

**Key questions:**
- Can TM land in the current web architecture with surgical changes?
- Or does the web shell need changes first?
- What is the minimum viable TM web experience?

---

### 2B: Quest + XP Engine (Data Layer)

**Mobile:** Read these files:
- `lib/quest-engine.ts` — what tables does it read/write?
- `lib/team-quest-engine.ts`
- `lib/xp-boost-engine.ts`
- `lib/leaderboard-engine.ts`
- `lib/journey-themes.ts`
- `hooks/useQuestEngine.ts`, `useStreakEngine.ts`, `useWeeklyQuestEngine.ts`, `useTeamQuests.ts`

**Web:** Check:
- Which of these Supabase tables does web reference? `grep -rn "daily_quests\|weekly_quests\|xp_ledger\|league_standings\|team_quests\|team_quest_contributions\|quest_bonus_tracking\|xp_boost_events\|player_notifications\|early_bird_claims" src/ --include="*.jsx" | grep -v _archive`
- Does web have any quest/XP UI at all?

**Key question:** Can the engine files be shared (or ported) as a web `lib/` module, or do they need rewriting for React (vs React Native)?

---

### 2C: Engagement Leaderboard + Coach Engagement Dashboard

**Mobile:** Read:
- `app/engagement-leaderboard.tsx` — what does it render?
- `app/coach-engagement.tsx` — what does the coach see?
- `hooks/useLeaderboard.ts`, `hooks/useCoachEngagement.ts`

**Web:** Does anything equivalent exist? Check leaderboard page: `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` — is this stat-based or XP-based?

**Desktop recommendation:** Should this be a full page, a dashboard panel, or both?

---

### 2D: Notification Engine + Inbox

**Mobile:** Read:
- `lib/notification-engine.ts` — what templates exist? What table?
- `hooks/useNotifications.ts`
- `app/notification-inbox.tsx`

**Web:** Read `src/pages/notifications/NotificationsPage.jsx` — is this an admin push notification config page or a user inbox? What's the gap?

---

### 2E: Shoutout Received Flow

**Mobile:** Read:
- `components/ShoutoutReceivedModal.tsx`
- `components/ShoutoutCard.tsx`
- `components/ShoutoutProfileSection.tsx`
- How is unseen tracking done? (AsyncStorage keys)

**Web:** Read:
- `src/components/engagement/ShoutoutCard.jsx`
- `src/components/engagement/GiveShoutoutModal.jsx`
- Is there any "received" flow or celebration?

---

### 2F: Dashboard Cards (All 4 Roles)

For EACH role, compare what mobile renders on its home scroll vs what web renders on its dashboard.

**Admin:**
- Mobile: Read `components/AdminHomeScroll.tsx` — list every imported component
- Web: Read `src/pages/dashboard/DashboardPage.jsx` — list every imported component
- Gap analysis: which mobile cards have no web equivalent?

**Coach:**
- Mobile: Read `components/CoachHomeScroll.tsx`
- Web: Read `src/pages/roles/CoachDashboard.jsx`
- Same gap analysis

**Parent:**
- Mobile: Read `components/ParentHomeScroll.tsx`
- Web: Read `src/pages/roles/ParentDashboard.jsx`
- Same gap analysis

**Player:**
- Mobile: Read `components/PlayerHomeScroll.tsx`
- Web: Read `src/pages/roles/PlayerDashboard.jsx`
- Same gap analysis

**For each gap, state:**
- Should this card exist on web? (yes/no/adapted)
- If adapted, what form? (panel, sidebar widget, table row, drill-down)
- Priority: critical / high / medium / low / skip

---

### 2G: Quest Screens

**Mobile:** Read:
- `app/quests.tsx`
- `app/skill-module.tsx`
- `app/(tabs)/journey.tsx`
- Player scroll quest cards: `PlayerDailyQuests.tsx`, `PlayerWeeklyQuests.tsx`, `PlayerTeamQuests.tsx`, `PlayerQuestEntryCard.tsx`, `PlayerContinueTraining.tsx`

**Web:** Does anything exist?

**Desktop recommendation:** Full page? Dashboard panel? Both?

---

### 2H: Empty States + Dead Ends

**Mobile:** Read:
- `components/empty-states/` — all files
- What CTAs do they provide?

**Web:** Check:
- `src/components/ui/EmptyState.jsx` — what does it render?
- Spot-check 3 pages: what happens when there's no data?

---

### 2I: Role Guards Parity

**Mobile:** The branch has commits for "role guards audit" securing 21 screens. Read:
- `app/attendance.tsx`, `app/blast-composer.tsx`, `app/blast-history.tsx`, `app/volunteer-assignment.tsx`, `app/invite-parents.tsx`, `app/users.tsx` — how do they check permissions?

**Web:** For each equivalent web page, check if it has a RouteGuard and if the allow array is correct.

---

## PART 3: RISK ANALYSIS

For each of these scenarios, trace the code path and document what would happen:

1. **A user with only `team_manager` role logs into web today.** What happens? Blank screen? Error? Wrong dashboard?
2. **activeView is set to `'team_manager'`** but no dashboard component handles it. What renders?
3. **A TM tries to navigate to `/gameprep`** — is it blocked or accessible?
4. **The quest engine writes to `daily_quests` table** — does web have any code that reads from it? Could stale/conflicting reads happen?
5. **A coach switches to TM view via role switcher** — does the sidebar break?
6. **A TM user opens the mobile app and the web app simultaneously** — are there any data conflicts? (e.g., both writing to same tables)
7. **The widget grid layout system** — if a new role is added, does it have default layouts? What happens if no layout exists?

---

## PART 4: SHELL HEALTH ASSESSMENT

Answer these questions based on your investigation:

1. **Is the current web shell (sidebar + header + DashboardContainer) stable enough to receive new roles and features?** Or does it need structural work first?
2. **Is the responsive/sizing system working?** Or will new features inherit the "everything is too big" problem?
3. **Is the design system being followed?** Or has drift created inconsistency that new features will amplify?
4. **Does the web follow its own UX philosophy doc?** Specifically:
   - Does each dashboard have a clear primary job?
   - Is there a priority stack (primary/secondary/tertiary)?
   - Are dashboards routing to drill-downs, or trying to do everything inline?
5. **What is the single biggest structural problem on web right now?** The one thing that, if not fixed, will make every subsequent feature worse.

---

## DELIVERABLE

Produce a single file: `INVESTIGATION-REPORT-WEB-CATCHUP.md`

### Required sections:

#### 1. Executive Summary
2-3 paragraphs. What is the state of the web? What's the biggest risk? What should happen first?

#### 2. Role Detection Map
Table: File | Line | What it does | TM status | Notes

#### 3. Route Access Matrix
Table: Route | Path | Current allow | TM should access? | Change needed | Risk

#### 4. Sidebar Nav Analysis
Current nav groups per role + proposed TM nav group

#### 5. Dashboard Comparison (per role)
For each role: Mobile cards vs Web cards side-by-side. Gap list with priority.

#### 6. Feature Gap Register
Table: Feature | Mobile status | Web status | Parity | Desktop approach | Priority | Dependencies | Files affected

#### 7. Database Table Usage
Table: Supabase table | Used by mobile? | Used by web? | Gap | Risk

#### 8. Design System Drift Report
List of compliance issues found during spot-check

#### 9. Shell Health Assessment
Answers to the 5 shell health questions above

#### 10. Risk Register
Table: Risk | Severity (1-5) | Likelihood (1-5) | Impact description | Mitigation

#### 11. Recommended Execution Order
Numbered phases with rationale. For each phase:
- What it does
- What it depends on
- What it enables
- Estimated scope (S/M/L)
- Risk level

#### 12. Open Questions
Anything that needs Carlos to answer before proceeding

---

## CC PROMPT

```
Read CC-INVESTIGATE-WEB-CATCHUP.md in the repo root. This is a comprehensive investigation-only spec.

DO NOT WRITE ANY CODE. DO NOT MODIFY ANY SOURCE FILES.

You have access to two repos:
- Web: volleybrain-admin (current directory), branch feat/desktop-dashboard-redesign
- Mobile: clone https://github.com/SgtxTorque/Volleybrain-Mobile3.git and checkout branch navigation-cleanup-complete

Read both codebases thoroughly. Trace every system listed in the spec. Compare mobile vs web for every feature area.

Produce the full report as specified in the DELIVERABLE section. Save it as INVESTIGATION-REPORT-WEB-CATCHUP.md in the repo root.

Be thorough. Quote exact file paths and line numbers for every finding. Do not guess — if you cannot determine something, log it in Open Questions.

This report will be reviewed by the project owner before any code is written. Your job is to give us the complete picture so we can make the right decisions, not the fast ones.
```
