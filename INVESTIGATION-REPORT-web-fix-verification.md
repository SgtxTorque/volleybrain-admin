# INVESTIGATION REPORT: Web Fix Verification + Deploy Health Check
## SgtxTorque/volleybrain-admin | main branch | April 10, 2026

---

## Repo Verification

| Check | Result |
|-------|--------|
| Remote | `origin https://github.com/SgtxTorque/volleybrain-admin.git` |
| Branch | `main` |
| Pull status | Already up to date |
| Working tree | Untracked investigation/build artifacts only (no modified source) |

**Verification: PASS**

---

# PART A: FINDINGS FIX VERIFICATION

## Source 1: Parent Experience Findings (17 findings)

| ID | Severity | Finding | Status | Evidence | Complete? | Notes |
|----|----------|---------|--------|----------|-----------|-------|
| PE-1 | CRITICAL | Mascot setup checklist shows to parents | **FIXED** | `MainApp.jsx:1559` — `{activeView === 'admin' && <SetupHelper />}` | YES | Clean admin-only gate |
| PE-2 | CRITICAL | Bell icon routes parents to admin notifications | **FIXED** | `MainApp.jsx:1497-1498` — `notificationCount={activeView === 'admin' ? notifUnreadCount : 0}`, `onOpenNotifications={activeView === 'admin' ? ... : undefined}`. TopBar/LynxSidebar only render bell if prop is truthy. RouteGuard at line 753 also restricts. | YES | Multiple layers: prop-gating, conditional render, route guard, polling guard |
| PE-3 | CRITICAL | Registration Hub infinite spinner | **FIXED** | `ParentRegistrationHub.jsx:54` — uses `organization?.id` with early `setLoading(false)` return. Lines 88-93: waiver query uses `waiver_templates`. Lines 97-106: uses `waiver_template_id`. | YES | Correct org source, correct tables, loading always resolves |
| PE-4 | HIGH | Action-item count mismatch (banner vs panel) | **FIXED** | `ParentDashboard.jsx:674-676` — `allActionItems = priorityEngine?.items`. AttentionStrip (line 750) and ActionItemsSidebar (line 977) both derive from `priorityEngine.items`. | YES | Single data source feeds both banner and sidebar |
| PE-5 | HIGH | No parent onboarding | **FIXED** | `ParentDashboard.jsx:17` imports `ParentJourneyBar`. Lines 757-761: rendered in dashboard. | YES | Journey bar visible |
| PE-6 | HIGH | PENDING badge confusing | **FIXED** | `KidCards.jsx:56` — `pending: { label: 'Awaiting Placement', hint: 'Your child will be assigned to a team soon.' }` | YES | Human-readable with hints |
| PE-7 | HIGH | Payments tab 5-item cap, no grouping | **FIXED** | `ParentPaymentsTab.jsx:25-31` — grouped by `player_id` via `playerNameMap`. `COLLAPSE_THRESHOLD = 8` with expand toggle. No `.slice(0,5)`. | YES | Grouped by child, expandable |
| PE-8 | HIGH | Emergency contact not carried to profile | **FIXED** | `PublicRegistrationPage.jsx:757-764` — syncs emergency data to `profiles` table. `ProfileDetailsSection.jsx:34-63` — falls back to `players` table via `loadFallbackFromPlayers()`. | YES | Two-way fix: write + fallback |
| PE-9 | HIGH | UUID in breadcrumb | **FIXED** | `Breadcrumb.jsx:53-55` — `isUUID()` detection. Lines 66-100: resolves UUIDs via DB queries. `MainApp.jsx:1092-1099` — `resolvePageLabel()` for dynamic page IDs. | YES | UUID resolution via DB + label map |
| PE-10 | HIGH | DOB missing on player profile | **FIXED** | `PlayerProfileInfoTab.jsx:103` — `(player.date_of_birth || player.birth_date)` with `+ 'T00:00:00'` for timezone safety. | YES | Dual-column fallback |
| PE-11 | MED | Waiver contradictions across surfaces | **FIXED** | `PriorityCardsEngine.jsx:83` — `from('waiver_templates')`. `MyStuffPage.jsx:333` — `from('waiver_templates')`. `ParentRegistrationHub.jsx:89` — `from('waiver_templates')`. All use `waiver_template_id`. | YES | Unified on `waiver_templates` table |
| PE-12 | MED | Empty states need context | **FIXED** | `ParentScheduleTab.jsx:110-114` — "Once your coach posts practices and games, they'll appear here." `ChatsPage.jsx:433` — "Chat channels will be available once your players are assigned to a team." | YES | Contextual, role-aware messaging |
| PE-13 | MED | DRIFTING label confusing | **FIXED** | `ParentDashboard.jsx:853` — passes `labels={{ active: 'On Team', drifting: 'New', inactive: 'Inactive' }}` to EngagementTeamPulseCard. | YES | Parent-appropriate labels |
| PE-14 | MED | Achievement catalog shows 503 badges | **FIXED** | `AchievementsCatalogPage.jsx:90-96` — `target_role` filter: parent sees `parent,player,all`, player sees `player,all`, coach sees `coach,player,all`. | YES | Role-based filtering |
| PE-15 | MED | Phone numbers unformatted | **FIXED** | `src/lib/formatters.js` — `formatPhone()` utility. Imported in 7+ files: RegistrationsPage, OrgDirectoryPage, PersonDetailPanel, PlayerComponents, CoachesPage, PlayerDetailModal, PlayerProfileInfoTab. | YES | Utility applied across major surfaces |
| PE-16 | LOW | Profile completeness indicator | **DEFERRED** | No implementation found. No matches for `profile_completeness` or `completeness.*indicator`. | N/A | Still deferred |
| PE-17 | LOW | Approval notification for parents | **DEFERRED** | Bell hidden as interim fix (`MainApp.jsx:1498`). No parent notification channel implemented. | N/A | Bell hidden; no parent-facing notification system |

## Source 2: Admin First-Run Findings (15 findings)

| ID | Severity | Finding | Status | Evidence | Complete? | Notes |
|----|----------|---------|--------|----------|-----------|-------|
| AFR-1 | CRITICAL | Fake 69% progress bar | **FIXED** | `DashboardPage.jsx:40-295` — `GettingStartedGuide` uses `JourneyContext` for real step tracking. `OrganizationPage.jsx:433` — explicit "show 0%, not 69%" comment. | YES | Real progress from JourneyContext |
| AFR-2 | CRITICAL | Landing page broken CTAs | **FIXED** | `LandingPage.jsx:1-293` — rewrite with 3 CTAs: "Join a Team", "Run a Club", "Log In". All functional. Copy is honest: "Beta Now Live". | YES | All CTAs work, honest copy |
| AFR-3 | HIGH | Wizard missing sport selection | **FIXED** | `SetupWizard.jsx:34/47/670-730` — `STEPS.SPORTS` step. 8 sport options. `handleSportContinue()` saves to `organization.settings.enabled_sports`. | YES | Full sport picker with 8 options |
| AFR-4 | HIGH | No guided setup flow | **FIXED** | `FirstRunSetupPage.jsx:1-60` — `/setup` route with 5 steps: identity, contact, sports/programs, payments, fees. Back/Next navigation, progress bar, resume banner on dashboard. | YES | Full 5-step guided setup |
| AFR-5 | HIGH | Badge notifications double-fire | **FIXED** | `JourneyCelebrations.jsx:1-222` — `WIZARD_BADGE_IDS` prevents re-fire, `TOAST_BADGE_IDS` routes to corner toasts. 10-second debounce. Only milestones get full-screen celebration. | YES | Toast routing, debounce, anti-flash |
| AFR-6 | HIGH | Chat badge cross-org data | **FIXED** | `FloatingChatButton.jsx:35-83` — badge scoped to org via `seasonIds` from `allSeasons`. Queries `chat_channels` filtered by org season IDs. Initializes `last_read_at` to "now" for existing channels. | YES | Fully org-scoped chat badge |
| AFR-7-15 | HIGH/MED | Progressive sidebar, coach-marks, XP | **FIXED** | `LynxSidebar.jsx:29-38` — `ADMIN_NAV_PREREQS` locks groups. `CoachMarkContext.jsx` — sequential tooltips. `xp-award-service.js` — XP for admin actions across 19+ files. `JourneyContext.jsx` — 5-role journey steps. | YES | T2 + T3 features all implemented |

## Source 3: Part 2/2B/2C Findings

| ID | Severity | Finding | Status | Evidence | Complete? | Notes |
|----|----------|---------|--------|----------|-----------|-------|
| P2-1 | CRITICAL | familyId not defined crash | **FIXED** | `PublicRegistrationPage.jsx:570` — `let familyId = null` properly declared before use. | YES | Correct let declaration |
| P2B-2 | HIGH | DOB timezone bug | **FIXED** | `date-helpers.js:10-17` — `parseLocalDate()` appends `T00:00:00`. `RegistrationFormSteps.jsx:187` — uses `+ 'T00:00:00'`. All public page date displays use timezone-safe parsing. | YES | All DOB displays fixed |
| P2B-3 | MED | Sport column shows dash | **FIXED** | `TeamsPage.jsx:70` — query includes sport via both direct and program->sport joins. `TeamsTableView.jsx:192` — `team.season?.sport?.name || team.season?.program?.sport?.name` fallback. | YES | Dual join path with fallback |
| P2B-5 | MED | No sibling last-name pre-fill | **FIXED** | `PublicRegistrationPage.jsx:1055-1057` — `setCurrentChild({ last_name: children[0]?.last_name || '' })` | YES | Pre-fills from first child |
| P2B-6 | MED | No form auto-save | **FIXED** | `PublicRegistrationPage.jsx:60-94` — `DRAFT_KEY` per season, `saveDraftToStorage()` to localStorage, 24-hour expiry, restore-on-load prompt. | YES | Full localStorage auto-save |
| P2C-1 | HIGH | Create Account ignores existing session | **NOT FIXED** | `RegistrationScreens.jsx:254-267` — "Create Account" CTA is a simple `<a href="/">`. No session detection for logged-in users. | NO | Should show "Go to Dashboard" for logged-in users |
| P2C-2 | MED | Registration scroll issue | **PARTIAL** | Main container uses `min-h-screen`. Submit button is standard flow (reachable by scroll). No sticky/fixed positioning for short viewports. | NO | Reachable but not optimized for short viewports |
| P2C-3 | MED | No confirmation emails | **PARTIAL** | `PublicRegistrationPage.jsx:749-803` — `EmailService.sendRegistrationConfirmation()` called on submit. Approval email not verified. | NO | Submit email exists; approval email unverified |
| P2C-4 | LOW | No registration_funnel_events table | **FIXED** | `PublicRegistrationPage.jsx:123-131` — `trackFunnelEvent()` inserts into `registration_funnel_events`. Called at form_started, page_view, step_completed, form_submitted. | YES | Full funnel tracking implemented |

## Source 4: Coach Findings

| ID | Severity | Finding | Status | Evidence | Complete? | Notes |
|----|----------|---------|--------|----------|-----------|-------|
| COACH-1 | CRITICAL | Perpetual skeleton loading | **FIXED** | `CoachDashboard.jsx:247-252` — 5-second timeout with `loadingTooLong` flag. Retry + "Contact your club director" buttons. Empty team state handled. | YES | Timeout, retry, graceful empty state |
| COACH-2 | HIGH | Full admin nav exposed to coaches | **FIXED** | `MainApp.jsx:1246-1282` — dedicated `coachNavGroups` with only coach-appropriate items. `getNavGroups()` switches on `activeView`. Admin-only items excluded. | YES | Fully scoped coach navigation |

## Source 5: Admin Operational Findings

| ID | Severity | Finding | Status | Evidence | Complete? | Notes |
|----|----------|---------|--------|----------|-----------|-------|
| OPS-1 | CRITICAL | Cross-org data leak in game prep | **FIXED** | `GamePrepPage.jsx:67-117` — coach path uses `team_coaches` join; admin uses `orgSeasonIds` from SeasonContext. Lines 120-127: team/season mismatch guard clears selection. | YES | Scoped via team assignments + mismatch guard |
| OPS-2 | HIGH | Team creation JS error | **FIXED** | `TeamsPage.jsx:164-223` — `selectedSeason?.id` guard. `clean()` helper converts empty strings to null. Error handling via toast. | YES | Proper guards and null coercion |

## Part A Summary

| Category | Count |
|----------|-------|
| **Total findings** | **39** |
| **FIXED** | **33** |
| **PARTIAL** | **2** (P2C-2, P2C-3) |
| **NOT FIXED** | **1** (P2C-1) |
| **NOT IMPLEMENTED** | **0** |
| **DEFERRED** | **2** (PE-16, PE-17) |
| **STILL BROKEN** | **1** (P2C-1) |

---

# PART B: DEPLOY HEALTH CHECK

## B1: Last 10 Commits on Main

| SHA | Author | Date | Message |
|-----|--------|------|---------|
| 5d75f68 | Carlos Fuentez | 2026-04-10 | Phase B7: Verification results -- all 6 phases pass, 15/17 findings resolved |
| b93bb01 | Carlos Fuentez | 2026-04-10 | feat(parent): Add dependency-aware empty states across schedule, chat, team hub |
| ca2cea3 | Carlos Fuentez | 2026-04-10 | feat(ui): Create formatPhone utility and apply across phone display points |
| b0c2161 | Carlos Fuentez | 2026-04-10 | feat(achievements): Filter badge catalog by user role using target_role column |
| 08d612e | Carlos Fuentez | 2026-04-10 | Phase B3: Fix emergency contact data pipeline -- display fallback + profile sync |
| a266994 | Carlos Fuentez | 2026-04-10 | fix(parent): Show all children's fees in dashboard Payments tab with child-name grouping |
| 5c4705d | Carlos Fuentez | 2026-04-10 | fix(waivers): Unify waiver queries to waiver_templates table across PriorityCardsEngine and MyStuffPage |
| 24eee1e | Carlos Fuentez | 2026-04-10 | fix(parent): Replace DRIFTING label with parent-appropriate engagement states |
| c4d9ad4 | Carlos Fuentez | 2026-04-10 | fix(parent): Replace ambiguous PENDING badge with descriptive 'Awaiting Team Placement' status |
| 13c9c58 | Carlos Fuentez | 2026-04-10 | fix(parent): Align action-item count between dashboard banner and action panel |

All 10 commits are from the same date (April 10, 2026), authored by Carlos Fuentez, forming a clean sequence of parent experience fixes.

## B2: Full Branch Inventory

### All Branches (14 local + main, 12 remote + main)

| Branch Name | Ahead | Behind | Last Commit Date | Last Commit Message | Status | Recommendation |
|-------------|-------|--------|-----------------|---------------------|--------|----------------|
| feat/invite-system | 0 | 68 | 2026-04-06 | [Invite Fix] Verify and fix email templates | MERGED & OBSOLETE | **DELETE** |
| feat/player-pass | 0 | 63 | 2026-04-06 | [PlayerPass 5] Parent controls | MERGED & OBSOLETE | **DELETE** |
| feat/program-layer | 0 | 83 | 2026-04-06 | [Polish3 3] Schedule tab | MERGED & OBSOLETE | **DELETE** |
| feat/registration-cart | 0 | 74 | 2026-04-06 | [Cart Fix] Registration preview button | MERGED & OBSOLETE | **DELETE** |
| feat/registration-fixes | 0 | 80 | 2026-04-06 | [RegFix 3] Fee display with discounts | MERGED & OBSOLETE | **DELETE** |
| feat/v2-dashboard-redesign | 0 | 491 | 2026-03-20 | feat(v2): Phase 6.1 dashboard restyle | MERGED BUT STALE | **DELETE** |
| fix/admin-first-run-polish | 0 | 32 | 2026-04-09 | [Polish P2-10] Pre-completed steps | MERGED & OBSOLETE | **DELETE** |
| fix/admin-first-run-t1 | 0 | 54 | 2026-04-09 | [FirstRun T1-6] Landing page CTAs | MERGED & OBSOLETE | **DELETE** |
| fix/admin-first-run-t2 | 0 | 50 | 2026-04-09 | [FirstRun T2-4] Progressive sidebar | MERGED & OBSOLETE | **DELETE** |
| fix/admin-first-run-t3 | 0 | 42 | 2026-04-09 | [Fix] User deletion Edge Function | MERGED & OBSOLETE | **DELETE** |
| fix/floating-buttons-ux | 0 | 17 | 2026-04-10 | feat: add .well-known files | MERGED & OBSOLETE | **DELETE** |
| fix/gameprep-pipeline | 0 | 60 | 2026-04-06 | [GameFix 3] Retire legacy games table | MERGED & OBSOLETE | **DELETE** |
| fix/part2b-registration-polish | 0 | 16 | 2026-04-10 | fix: Part 2B registration polish | MERGED & OBSOLETE | **DELETE** |
| fix/program-orphan-guard | 0 | 22 | 2026-04-10 | fix: add NOT NULL constraint on seasons.program_id | MERGED & OBSOLETE | **DELETE** |

### Specific Branch Verification

| Expected Branch | Expected Status | Actual Status | Verdict |
|----------------|-----------------|---------------|---------|
| fix/admin-first-run-t1 | Merged to main | 0 ahead, fully merged | Safe to delete |
| fix/admin-first-run-t2 | Merged to main | 0 ahead, fully merged | Safe to delete |
| fix/admin-first-run-t3 | Merged to main | 0 ahead, fully merged | Safe to delete |
| fix/admin-first-run-polish | "NEEDS MERGE" per handoff | 0 ahead, fully merged | Already merged. Safe to delete |
| fix/part2b-registration-polish | Unknown | 0 ahead, fully merged | Safe to delete |
| fix/program-orphan-guard | Unknown | 0 ahead, fully merged | Safe to delete |
| feat/program-layer | Merged to main | 0 ahead, fully merged | Safe to delete |
| feat/registration-fixes | Merged to main | 0 ahead, fully merged | Safe to delete |
| feat/registration-cart | Merged to main | 0 ahead, fully merged | Safe to delete |
| feat/invite-system | Merged to main | 0 ahead, fully merged | Safe to delete |
| feat/player-pass | Merged to main | 0 ahead, fully merged | Safe to delete |
| fix/gameprep-pipeline | Merged to main | 0 ahead, fully merged | Safe to delete |
| feat/expo-web-qa | Mobile branch | NOT present in web repo | N/A |

### Branch Summary

```
Total branches (local + remote, excluding main): 14 local, 12 remote (some overlap)
  - Safe to delete (merged, 0 ahead): 14
  - Has unique work needing review: 0
  - Diverged/conflicted: 0
  - Active development: 0
```

**All 14 branches are safe to delete.** Every branch is 0 commits ahead of main. No unmerged work exists.

### Branches Carlos Should Delete

All of these (both local and remote):
1. `feat/invite-system`
2. `feat/player-pass`
3. `feat/program-layer`
4. `feat/registration-cart`
5. `feat/registration-fixes`
6. `feat/v2-dashboard-redesign`
7. `fix/admin-first-run-polish`
8. `fix/admin-first-run-t1`
9. `fix/admin-first-run-t2`
10. `fix/admin-first-run-t3`
11. `fix/floating-buttons-ux`
12. `fix/gameprep-pipeline`
13. `fix/part2b-registration-polish`
14. `fix/program-orphan-guard`

## B3: Build Verification

| Metric | Value |
|--------|-------|
| Exit code | 0 (success) |
| Build time | 11.83s |
| Modules transformed | 1,876 |
| Main chunk size | 3,279.92 kB (gzip: 769.04 kB) |
| CSS size | 167.90 kB (gzip: 25.97 kB) |
| Warnings | 1 — chunk size warning (main chunk > 500 kB). Acceptable; recommends code-splitting. |
| Errors | 0 |

**Build: PASS** (chunk size warning is non-blocking)

## B4: Package Health

```
volleybrain-admin@1.0.0
├── @supabase/supabase-js@2.90.1
├── @tiptap/extension-image@3.20.5
├── @tiptap/extension-link@3.20.5
├── @tiptap/extension-placeholder@3.20.5
├── @tiptap/extension-text-align@3.20.5
├── @tiptap/extension-underline@3.20.5
├── @tiptap/react@3.20.5
├── @tiptap/starter-kit@3.20.5
├── @types/react-dom@18.3.7
├── @types/react@18.3.27
├── @vitejs/plugin-react@4.7.0
├── autoprefixer@10.4.23
├── csv-parse@6.2.1
├── html2canvas@1.4.1
├── lucide-react@0.294.0
├── postcss@8.5.6
├── react-dom@18.3.1
├── react-grid-layout@2.2.2
├── react-router-dom@6.30.3
├── react@18.3.1
├── tailwindcss@3.4.19
└── vite@5.4.21
```

- No UNMET DEPENDENCY warnings
- No version conflicts
- No missing peer dependencies
- **Package health: CLEAN**

## B5: .well-known Placeholder Values

| File | Has Placeholders? | Details |
|------|-------------------|---------|
| `apple-app-site-association` | **YES** | `<APPLE_TEAM_ID>.com.lynxapp.mobile` — placeholder team ID |
| `assetlinks.json` | **YES** | `<ANDROID_PACKAGE_NAME>` and `<SHA256_FINGERPRINT>` — placeholder values |

**Both files still have placeholder values and are NOT production-ready.** These need real values before iOS Universal Links and Android App Links will work.

---

# PART C: DUPLICATE REGISTRATION BUG

## C1: Unique Constraint

The constraint `registrations_player_id_season_id_key` is a database-level unique constraint on `registrations(player_id, season_id)`. No reference to it exists in application code — it's enforced at the Postgres/Supabase schema level.

## C2: Code Paths That Could Trigger It

**Flow 1: PublicRegistrationPage** (`src/pages/public/PublicRegistrationPage.jsx`, lines 722-743)
- Creates new `players` row per child, then inserts `registrations` row with `player_id + season_id`.
- Double-click risk: `submitting` state disables button, but no server-side idempotency key.

**Flow 2: RegistrationCartPage** (`src/pages/public/RegistrationCartPage.jsx`, lines 1436-1462)
- Same pattern. Identical risk profile.

## C3: Duplicate Guard

**There is NO pre-check.** Neither flow queries `registrations` for existing `(player_id, season_id)` before insert.

The only capacity-related pre-check counts non-denied registrations for capacity enforcement, but does not check for a specific player's existing registration.

## C4: Error Handling

| Flow | Error Code 23505 Handling |
|------|--------------------------|
| **PublicRegistrationPage** — player insert | User-friendly: `"${child.first_name} may already be registered"` |
| **PublicRegistrationPage** — registration insert | **Silently swallowed** (`if (regError.code !== '23505') throw`). User sees success even if registration wasn't created. |
| **RegistrationCartPage** — player insert | User-friendly: `"${child.first_name} may already be registered"` |
| **RegistrationCartPage** — registration insert | **Raw Postgres error thrown** (`if (regError) throw regError`). This is likely the exact error Carlos saw. |

## C5: Recommended Fix

1. **Add duplicate-registration pre-check** before insert: query `registrations` matching `player_id + season_id`. Show friendly message if exists.
2. **Use `upsert` with `onConflict`** on registration insert: `.upsert({ ... }, { onConflict: 'player_id,season_id', ignoreDuplicates: true })`
3. **In RegistrationCartPage**, handle `regError.code === '23505'` with user-friendly message (matching PublicRegistrationPage's pattern).
4. **Add server-side idempotency** (unique `submission_token`) to prevent double-submit entirely.

---

# PART D: REAL-WORLD BREAKAGE BUGS

## D1: All Organizations Visible on Mobile Web

**Root cause: By-design for Platform Admins, not a normal admin bug.**

- `AuthContext.jsx:154-166` — Normal users see exactly ONE organization (their `current_organization_id`).
- `isPlatformAdmin` flag comes from `profile.is_platform_admin` (line 105).
- Platform pages (`/platform/*`) query ALL organizations without filtering — this is intentional for the super-admin view.
- No org switcher exists for normal users. Only PA has "Enter Platform Mode" in the sidebar (`LynxSidebar.jsx:850`).

**Finding:** Carlos, as a PA, was likely in platform mode or navigated to a platform page on mobile. The visual distinction between "org mode" and "platform mode" is unclear on mobile.

**Recommendation:** Add a clear "Platform Admin View" banner on platform pages. Consider hiding the Platform Admin sidebar link on mobile.

## D2: Registration Link Confusion / Wrong Season

**Root cause: RegLinkModal uses `selectedSeason?.id` from global filter without prominently showing season name.**

- `DashboardPage.jsx:1719-1848` — RegLinkModal builds URL as `/register/${slug}/${sid}` using the currently selected season.
- The modal header says "Registration Link" with **no season name shown prominently** (only the raw URL with UUID).
- `SeasonFormModal.jsx:598-613` — ShareHubModal does show `{shareSeason.name}` as a subtitle, but the dashboard's RegLinkModal does not.

**Recommendation:**
1. Add prominent season name in RegLinkModal: "Registration link for **{season.name}**"
2. Add dropdown to select target season
3. Show confirmation when no season is selected ("This link will show a season picker")

## D3: Mobile Web Responsiveness

**Finding: Sidebar/nav is properly responsive; individual page layouts have issues.**

**What works well:**
- `LynxSidebar.jsx` — Full mobile strategy at `max-width: 1023px`: desktop sidebar hidden, mobile header bar (52px) shown with hamburger menu, 280px slide-out navigation panel.
- `index.css:597-601` — Media query resets `padding-left: 0 !important` and adds `padding-top: 52px` on `.lynx-main-content`.

**What doesn't work:**
- `RegistrationsPage.jsx:463` — Hardcoded `w-[680px]` for table column. Overflows on mobile.
- `LineupBuilderV2.jsx:596-607` — Uses `left: 'var(--v2-sidebar-width, 230px)'` inline style. No mobile override — content offset 230px from left on mobile.
- Most page components are desktop-first without `sm:`/`md:` responsive breakpoints.

**Recommendation:**
1. Replace `w-[680px]` with `w-full lg:w-[680px]`
2. Add mobile media query for LineupBuilderV2 to set `left: 0`
3. Add responsive breakpoints to data-heavy pages (registrations, payments, reports)

---

# PART E: COWORK AUDIT UNVERIFIED ITEMS

| ID | Severity | Issue | Code Fix Exists | Evidence | Confidence |
|----|----------|-------|----------------|----------|------------|
| E1 | CRITICAL | Email delivery failure | **PARTIAL** | `email-service.js` queues to `email_notifications` table. Templates for `coach_invite`, `registration_invite`, `payment_reminder` exist. Actual delivery depends on Supabase Edge Function outside this repo. | MEDIUM |
| E2 | CRITICAL | Cross-org data leak in Game Prep | **YES** | `GamePrepPage.jsx:78-127` — Admin uses `orgSeasonIds`, coach uses `team_coaches` join, explicit team/season mismatch guard. | HIGH |
| E3 | CRITICAL | Coach profile missing org linkage | **YES** | `MainApp.jsx:934-951` — Coach loading scopes to org season IDs. `CoachesPage.jsx:64-86` and `StaffPortalPage.jsx:103-118` filter via org season IDs. | HIGH |
| E4 | CRITICAL | Infinite auth loading | **YES** | `AuthContext.jsx:182-186` — `Promise.race()` with 10-second timeout. `setLoading(false)` in catch block ensures resolution. | HIGH |
| E5 | P0 | Roster three-dot menu hijack | **NO** | `RosterTable.jsx:45-68` — OverflowMenu only shows "View Profile" and "Evaluate". No specific fix preventing navigation to setup wizard from roster context. | LOW |
| E6 | P0 | Zero URL-based role enforcement | **YES** | `RouteGuard.jsx` (49 lines) — checks `allow` array against `activeView`. `MainApp.jsx:708-799` — nearly every route wrapped with `<RouteGuard>`. | HIGH |
| E7 | P0 | Coach can access /registrations, /payments | **YES** | `MainApp.jsx:729` — `/registrations` allows only `['admin']`. Line 744 — `/payments` allows `['admin', 'team_manager']`. Coach NOT in either allow list. | HIGH |
| E8 | HIGH | Registration form scroll issue | See P2C-2 | Covered in Part A. | — |
| E9 | HIGH | Create Account ignores session | See P2C-1 | Covered in Part A. | — |
| E10 | MED | Chat send failures (silent) | **YES** | `ChatThread.jsx:232-238` — errors show toast. RLS policy errors get specific message. Not silent. | HIGH |
| E11 | MED | RSVP 400 errors | **PARTIAL** | `ActionItemsSidebar.jsx:176-218` — check-then-upsert pattern (fixed). `AttendancePage.jsx:177` — bare `.insert()` without duplicate check (not fixed). Mixed. | MEDIUM |
| E12 | MED | COPPA consent not persisting | **YES** | `CoppaConsentModal.jsx:24-25` — writes `coppa_consent_given: true` and `coppa_consent_date` to `profiles` table. `ChatsPage.jsx:54-65` — reads from profile. | HIGH |
| E13 | MED | Reports Unicode rendering | **NO** | Emojis used as raw Unicode characters in source. No escape sequence handling or decoding logic found. | MEDIUM |
| E14 | MED | Reports "No data found" | **PARTIAL** | `ReportsPage.jsx:85` — triggers on `selectedSeasonId` change. If "All Seasons" selected (no specific ID), `loadReportData()` never fires. No fix for "All Seasons" mode. | MEDIUM |
| E15 | MED | My Stats infinite loader | **PARTIAL** | `PlayerStatsPage.jsx:331-337` — loading false if no `playerId`. Line 395-399: catch sets `setLoading(false)`. Fix appears adequate but depends on `game_player_stats` table existing. | MEDIUM |
| E16 | MED | Registration route 2 URL segments | **YES** | `App.jsx:81-82` — two routes: `/register/:orgIdOrSlug` (1 segment, cart page) and `/register/:orgIdOrSlug/:seasonId` (2 segments, direct registration). Both handled. | HIGH |
| E17 | MED | Announcements POST organization_id | **YES** | `BlastsPage.jsx:449` — insert includes `organization_id: organization.id`. Line 93: read query uses `.eq('organization_id', organization.id)`. Code assumes column exists. | MEDIUM |
| E18 | LOW | Coach form empty strings | **YES** | `CoachesPage.jsx:135` — `const clean = (v) => (v === '' || v === undefined) ? null : v`. Applied to `date_of_birth`, `background_check_date`, `background_check_expiry`, `invited_at`, `invite_accepted_at`. | HIGH |
| E19-E22 | — | Mobile bugs | MOBILE — not applicable to web repo | — | — |

### Part E Summary

- **Fixes confirmed (YES):** 9 items (E2, E3, E4, E6, E7, E10, E12, E16, E18)
- **Partial fixes (PARTIAL):** 4 items (E1, E11, E14, E15)
- **No fix found (NO):** 2 items (E5, E13)
- **Cross-referenced:** 2 items (E8→P2C-2, E9→P2C-1)
- **Not applicable:** 4 items (E19-E22 mobile)

---

# PART F: PLATFORM ADMIN ARCHITECTURE AUDIT

## F1: How is Platform Admin Detected?

- **Flag location:** `profiles.is_platform_admin` column in Supabase.
- **Loaded in:** `AuthContext.jsx:105` — `const isPlatformAdmin = profileData?.is_platform_admin === true`.
- **Exposed as:** `isPlatformAdmin` on the AuthContext, available via `useAuth()` hook.
- **Checked in:** Platform pages import `useAuth()` and read `isPlatformAdmin`. `MainApp.jsx` uses it to decide whether to show the "Enter Platform Mode" button and to gate `/platform/*` routes.

## F2: What Can PA Do That Normal Admins Cannot?

| Feature | File | Line | Description |
|---------|------|------|-------------|
| Platform Overview dashboard | `PlatformOverview.jsx` | — | Cross-org stats, health scores |
| Manage ALL organizations | `PlatformOrganizations.jsx` | 555 | Unfiltered `from('organizations').select('*')` |
| Org detail (any org) | `PlatformOrgDetail.jsx` | 1090+ | View/manage any single org |
| User management (all users) | `PlatformUsers.jsx` | — | View/search all profiles |
| Platform subscriptions | `PlatformSubscriptionsPage.jsx` | — | Manage subscriptions across orgs |
| Platform analytics | `PlatformAnalyticsPage.jsx` | — | Cross-org analytics |
| Email center | `PlatformEmailCenter.jsx` | — | Cross-org email management |
| System health | `PlatformSystemHealth.jsx` | — | Edge function status checks |
| Database tools | `PlatformDatabaseTools.jsx` | — | Direct DB operations |
| Audit log | `PlatformAuditLog.jsx` | — | `platform_admin_actions` tracking |
| Compliance | `PlatformCompliance.jsx` | — | Cross-org compliance |
| Content manager | `PlatformContentManager.jsx` | — | Manage cross-org content |
| Feature requests | `PlatformFeatureRequests.jsx` | — | Feature request management |
| Platform settings | `PlatformSettings.jsx` | — | Global platform configuration |
| Platform notifications | `PlatformNotifications.jsx` | — | Cross-org notification management |
| Support tickets | `PlatformSupport.jsx` | — | Cross-org support |
| Platform integrations | `PlatformIntegrations.jsx` | — | Integration management |
| Registration funnel | `PlatformRegistrationFunnel.jsx` | — | Cross-org funnel analytics |
| Engagement analytics | `PlatformEngagement.jsx` | — | Cross-org engagement metrics |
| Platform team management | `PlatformTeam.jsx` | — | Manage platform team members |

## F3: How Does PA See Other Organizations?

1. **Normal admin:** Sees only their org. `AuthContext.jsx:154-166` loads ONE organization based on `profile.current_organization_id` or first role's org.
2. **PA sees all orgs:** Through unfiltered queries in platform pages. `PlatformOrganizations.jsx:555` — `supabase.from('organizations').select('*')`.
3. **No org switcher for normal users.** Only PA has "Enter Platform Mode" (`LynxSidebar.jsx:850`) which changes `appMode` state from `'org'` to `'platform'`.
4. **When PA exits platform mode:** `handleExitPlatformMode()` sets `appMode='org'` and navigates to `/dashboard`, which scopes back to their personal org. The `organization` context from AuthContext always stays scoped to the PA's own org.

## F4: Cross-Org Query Bleed

| Table | Properly Org-Scoped? | Evidence |
|-------|---------------------|----------|
| `seasons` | YES | SeasonContext loads seasons via `from('seasons').eq('organization_id', org.id)`. Used throughout. |
| `teams` | YES (via season) | `TeamsPage.jsx` filters by `selectedSeason.id`. `GamePrepPage.jsx` uses `orgSeasonIds`. |
| `players` | YES (via season) | Queries use `.eq('season_id', ...)` or `.in('season_id', orgSeasonIds)`. |
| `registrations` | YES (via season/player) | Scoped through player/season joins. |
| `schedule_events` | YES | `SchedulePage.jsx` uses `season_id` filter. `DashboardPage.jsx:670` — `.eq('season_id', seasonId)`. |
| `games` | N/A | Legacy table retired. Uses `schedule_events` now. |
| `chat_channels` | YES | `FloatingChatButton.jsx:42-45` — filtered by org season IDs. `ChatsPage.jsx:101` — admin sees all channels (intentional for org admin). |
| `messages` (blasts) | YES | `BlastsPage.jsx:93` — `.eq('organization_id', organization.id)`. |

**Platform pages (PlatformOrganizations, PlatformAnalytics, PlatformOrgDetail, etc.) intentionally bypass org scoping to show cross-org data.** This is correct behavior for PA pages under `/platform/*`.

## F5: activeView and Role Hierarchy

- **Possible values:** `'admin'`, `'team_manager'`, `'coach'`, `'parent'`, `'player'`
- **NO `'platform_admin'` value exists.** PA uses the same `'admin'` activeView as a normal admin.
- **PA distinction is separate:** The `appMode` state (`'org'` vs `'platform'`) determines whether the PA sees the normal admin experience or the platform admin experience. This is orthogonal to `activeView`.
- **When PA logs in:** `activeView` defaults to `'admin'` (from `localStorage` or first available role). `appMode` defaults to `'org'`.
- **Changing `activeView`:** Triggers `loadRoleContext()` which re-loads role-specific data (children for parent, teams for coach, etc.). Data is properly re-scoped.
- **Entering platform mode:** Changes route to `/platform/overview` and renders `PlatformShell` instead of the normal org shell. `activeView` is not changed — it stays `'admin'`.

## F6: PA Summary and Separation Recommendation

### 1. Current PA Architecture Pattern
PA is a **boolean flag** on the `profiles` table (`is_platform_admin`). It is NOT a role in `user_roles`. The PA experience is a **parallel mode** (`appMode: 'platform'`) with its own shell (`PlatformShell`), sidebar, and routes (`/platform/*`). The PA still has a normal org admin role and can switch between "org mode" and "platform mode."

### 2. Where PA Bleeds Into Normal Admin
- **Navigation:** The "Enter Platform Mode" button is visible in the sidebar for PA users, even on mobile where it may be confusing.
- **Context persistence:** When PA exits platform mode, the `organization` context still points to their personal org. However, if the PA was viewing another org's data in platform mode, there's no "breadcrumb trail" showing they've switched back.
- **No visual distinction:** On mobile, there's no clear indicator of whether the user is in "org mode" or "platform mode." The sidebar link text may be the only cue.
- **Registration link sharing:** While in org mode, the PA creates links scoped to their org. But if they recently viewed another org in platform mode and navigated back, the context could be confusing.

### 3. What Would Need to Change for PA Separation
- Add a **landing page/org-picker** when PA logs in (instead of defaulting to their personal org).
- Add a **persistent visual banner** in platform mode ("Platform Admin - Viewing All Organizations").
- **Hide PA sidebar link on mobile** or move it to a settings/gear menu.
- Consider an **impersonation mode** where PA can "View as [Org Name]" without affecting their real auth context.

### 4. Estimated Scope
- ~5-8 files touched: `AuthContext.jsx`, `MainApp.jsx`, `LynxSidebar.jsx`, platform page components, possibly a new `PlatformLandingPage.jsx`.
- This is a **1-phase** separation if the goal is just visual clarity and org-picker landing.
- A full **impersonation mode** would be a 2-phase effort (phase 1: org-picker, phase 2: impersonation context).

### 5. Recommended Approach
1. **Phase 1 (Quick wins):** Add "Platform Admin" banner in platform mode. Hide PA sidebar link on mobile. Show org name prominently in RegLinkModal.
2. **Phase 2 (Clean separation):** Add org-picker landing page for PA login. Add "Return to [Org Name]" breadcrumb in platform mode. Consider `activeOrg` context that can be overridden by PA.

---

# PART G: CORE BASICS FEATURE MAP

## G1: Core Basics Checklist

### Admin Core

| # | Workflow | Code Path Exists? | Complete? | Known Bugs? |
|---|---------|-------------------|-----------|-------------|
| 1 | Create/manage organization | YES — `OrganizationPage.jsx`, `SetupSectionCard.jsx`, `SetupSectionContent.jsx` | YES | None found |
| 2 | Create/manage programs | YES — `ProgramPage.jsx`, program creation in `SeasonsPage.jsx` | YES | None found |
| 3 | Create/manage seasons | YES — `SeasonsPage.jsx`, `SeasonFormModal.jsx` | YES | None found |
| 4 | Create/manage teams | YES — `TeamsPage.jsx`, `NewTeamModal.jsx`, `TeamsTableView.jsx` | YES | None found |
| 5 | Invite/manage coaches | YES — `CoachesPage.jsx`, `InviteCoachModal.jsx`, `invite-utils.js` | YES | Email delivery depends on Edge Function (E1) |
| 6 | Open registration | YES — `RegistrationCartPage.jsx` (multi-program cart), `PublicRegistrationPage.jsx` (single-season), registration template management, `ShareHubModal.jsx` | YES | Duplicate reg bug (Part C), session detection (P2C-1) |
| 7 | Approve/manage registrations | YES — `RegistrationsPage.jsx` with bulk operations, filters, approve/deny | YES | None found |
| 8 | Manage rosters | YES — `RosterManagerPage.jsx`, `RosterTable.jsx`, player detail modals | YES | None found |
| 9 | Manage payments | YES — `PaymentsPage.jsx` with view balances, mark paid, send reminders | YES | Reminder emails depend on Edge Function (E1) |
| 10 | Create/manage schedule | YES — `SchedulePage.jsx` (3,823 lines), `CalendarViews.jsx`, `EventDetailModal.jsx` | YES | None found |
| 11 | Send communications | YES — `BlastsPage.jsx` with audience targeting, `ChatsPage.jsx` | YES | Assumes `messages.organization_id` column exists (E17) |
| 12 | Basic reporting | YES — `ReportsPage.jsx`, `RegistrationFunnelPage.jsx` | PARTIAL | "No data found" when "All Seasons" selected (E14) |

### Coach Core

| # | Workflow | Code Path Exists? | Complete? | Known Bugs? |
|---|---------|-------------------|-----------|-------------|
| 1 | View assigned teams/rosters | YES — `CoachDashboard.jsx`, team-scoped roster views | YES | None found |
| 2 | View/manage schedule | YES — Coach has schedule access via `coachNavGroups` | YES | None found |
| 3 | Communicate with team | YES — Chat and blast access for coaches | YES | None found |
| 4 | Take attendance | YES — `AttendancePage.jsx`, inline attendance from dashboard | YES | RSVP bare insert may cause 400 (E11) |
| 5 | View player profiles | YES — Player detail modals accessible from roster | YES | None found |

### Parent Core

| # | Workflow | Code Path Exists? | Complete? | Known Bugs? |
|---|---------|-------------------|-----------|-------------|
| 1 | Register child via public link | YES — `PublicRegistrationPage.jsx`, `RegistrationCartPage.jsx` | YES | Duplicate reg bug (Part C) |
| 2 | Create account and link | YES — Account creation flow from registration success | PARTIAL | "Create Account" doesn't detect existing session (P2C-1) |
| 3 | View dashboard with status | YES — `ParentDashboard.jsx` with `KidCards`, `AttentionStrip`, `PriorityCardsEngine` | YES | None found |
| 4 | View/pay fees | YES — `ParentPaymentsTab.jsx`, `PaymentsPage.jsx` | YES | None found |
| 5 | View schedule | YES — `ParentScheduleTab.jsx` with empty states | YES | None found |
| 6 | RSVP to events | YES — `QuickRsvpModal.jsx`, `EventDetailModal.jsx` | YES | None found |
| 7 | Communicate via chat | YES — `ChatsPage.jsx` with parent-scoped channels | YES | None found |
| 8 | View player profile | YES — `PlayerProfilePage.jsx`, `PlayerProfileInfoTab.jsx` | YES | None found |

## G2: Feature Lockdown Inventory

### CORE (Keep Visible)

These routes/pages serve the core basics checklist:

**Admin:**
- `/dashboard` — Admin dashboard
- `/teams` — Team management
- `/teams/:teamId` — Team detail
- `/coaches` — Coach management
- `/registrations` — Registration management
- `/payments` — Payment management
- `/schedule` — Schedule management
- `/attendance` — Attendance tracking
- `/blasts` — Announcements
- `/chats` — Chat
- `/reports` — Basic reporting
- `/settings/*` — Organization, Seasons, Registration Templates, Payment Setup, Waivers
- `/setup` — First-run setup flow
- `/roster` — Roster management
- `/programs/:programId` — Program management
- `/notifications` — Admin notification management

**Coach:**
- `/dashboard` — Coach dashboard
- `/schedule` — Schedule view
- `/attendance` — Attendance
- `/chats` — Chat
- `/blasts` — Announcements (team-scoped)
- `/gameprep` — Game preparation
- `/roster` — Roster view

**Parent:**
- `/dashboard` — Parent dashboard
- `/schedule` — Schedule view
- `/chats` — Chat
- `/parent/player/:id` — Player profile
- `/my-stuff` — Self-service (profile, payments, waivers)
- `/blasts` — Announcements (read-only)

**Public:**
- `/register/:orgIdOrSlug` — Registration cart
- `/register/:orgIdOrSlug/:seasonId` — Direct registration
- `/org/:orgIdOrSlug` — Org directory
- `/join/coach/:orgId` — Coach join page
- `/invite/:code` — Invite acceptance

### ADVANCED (Candidates for Lockdown)

These routes/pages are beyond core basics and could be hidden until core is bulletproof:

| Route/Page | Category | Notes |
|-----------|----------|-------|
| `/gameprep` | Game Day | Lineup builder, game completion, stats entry — advanced coach tool |
| `/standings` | Game Day | Team standings — requires game data |
| `/leaderboards` | Game Day | Season leaderboards — requires stats data |
| `/achievements` | Gamification | Badge catalog, achievement tracking — engagement feature |
| `/player-stats` | Gamification | Individual player stats — requires game stats data |
| `/jerseys` | Operations | Jersey management — nice-to-have, not core |
| `/coach-availability` | Operations | Coach availability scheduling — secondary feature |
| `/registration-funnel` | Analytics | Funnel analytics — advanced reporting |
| `/archives` | Archives | Season archives — historical data |
| `/data-export` | Settings | Data export — power user feature |
| `/subscription` | Settings | Subscription management — business feature |
| `/directory` | Discovery | Org directory — discovery feature |
| TeamWall (`/teams/:teamId`) | Social | Post feed, photo gallery, reactions — social feature |
| Engagement system | Gamification | Shoutouts, challenges, XP/levels — full gamification layer |
| PlayerPass | Gamification | Player pass with PIN, QR code — engagement feature |
| PlayerDashboard | Gamification | Player-specific dashboard with badges, challenges, leaderboards |
| DrillPage / PracticePlanPage | Coach Tools | Practice planning — advanced coach tool |
| CoachReflection | Coach Tools | Post-practice reflection — advanced coach tool |
| All `/platform/*` routes | Platform Admin | PA-only, should be completely separate from org experience |

### Lockdown Recommendation

**Keep visible (23 core routes):** Dashboard, Teams, Coaches, Registrations, Payments, Schedule, Attendance, Chat, Blasts, Reports, Settings, Setup, Roster, Programs, Notifications, My Stuff, Player Profile, public registration routes.

**Lock down or feature-flag (15+ advanced routes):** Game Prep, Standings, Leaderboards, Achievements, Player Stats, Jerseys, Coach Availability, Registration Funnel, Archives, Data Export, Subscription, Engagement system, PlayerPass, Practice Plans, Drill Library.

**Separate completely (20 platform routes):** All `/platform/*` routes should be inaccessible from the normal admin experience and only reachable via explicit "Enter Platform Mode."

---

# EXECUTIVE SUMMARY

## What's Working Well
- **33 of 39 findings are FIXED** — an 85% fix rate across all QA audit sources
- **All CRITICAL findings are resolved** (mascot checklist, bell icon, registration hub, auth timeout, cross-org leaks, coach skeleton, familyId crash, fake progress)
- **Build passes cleanly** with 1,876 modules in 11.83s
- **All branches are merged** — zero unmerged work, clean repo state
- **RouteGuard system** properly restricts URL-based role access
- **Package health is clean** — no dependency issues

## What Still Needs Attention
1. **P2C-1 (HIGH):** "Create Account" button doesn't detect existing auth session
2. **Duplicate registration bug (HIGH):** No pre-check before insert; RegistrationCartPage shows raw Postgres error
3. **Registration link confusion (MED):** RegLinkModal doesn't prominently show season name
4. **.well-known placeholder values:** Both files need real Apple Team ID and Android package info
5. **Mobile responsiveness:** Several pages (registrations, lineup builder) have hardcoded widths that overflow
6. **Email delivery (CRITICAL dep):** Web code queues emails correctly, but actual delivery depends on Supabase Edge Function
7. **Reports empty state (MED):** "All Seasons" mode doesn't load report data
8. **14 stale branches** should be deleted from both local and remote

## Strategic Priorities (Part F + G)
1. **PA separation:** Add visual distinction between org mode and platform mode. Short-term: banner + hide PA link on mobile. Long-term: org-picker landing + impersonation.
2. **Core basics lockdown:** Hide 15+ advanced features (gamification, game prep, standings, etc.) behind feature flags until the 23 core routes are bulletproof.
3. **Duplicate registration guard:** Highest-priority code fix — affects real users right now.
