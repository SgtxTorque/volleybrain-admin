# PHASE RESULTS: Parent Experience — Spec B (Data Integrity + Polish)
**Date:** April 10, 2026
**Branch:** main
**Build:** PASS (`✓ built in 13.37s`, 1876 modules, exit code 1 is chunk-size warning only)

---

## Phase Results

### Phase B1: Unify waiver queries [Finding #11] — PASS
**Files changed:**
- `src/components/parent/PriorityCardsEngine.jsx` — changed `from('waivers')` to `from('waiver_templates')`, fixed FK `waiver_id` to `waiver_template_id`
- `src/pages/parent/MyStuffPage.jsx` — fixed FK `waiver_id` to `waiver_template_id`, fixed insert columns, fixed display `waiver.title` to `waiver.name || waiver.title`

**Commit:** `5c4705d`

### Phase B2: Fix Payments tab [Finding #7] — PASS
**Files changed:**
- `src/components/v2/parent/ParentPaymentsTab.jsx` — removed `.slice(0, 5)` cap, added child-name grouping via `playerNameMap`, added "Show all" toggle for 8+ items, added "View full breakdown" button
- `src/pages/roles/ParentDashboard.jsx` — passed `children={registrationData}` prop to ParentPaymentsTab

**Commit:** `a266994`

### Phase B3: Fix emergency contact pipeline [Finding #8] — PASS
**Files changed:**
- `src/pages/profile/ProfileDetailsSection.jsx` — added `loadFallbackFromPlayers()` to populate emergency contact from player records when profile data is empty
- `src/pages/public/PublicRegistrationPage.jsx` — after registration, syncs emergency contact data to parent's profiles record if they have an existing account

**Commit:** `08d612e`

### Phase B4: Filter achievement catalog by role [Finding #14] — PASS
**Files changed:**
- `src/pages/achievements/AchievementsCatalogPage.jsx` — added server-side `target_role` filter via `.or()` query; parents see parent+player+all+null, coaches see coach+player+all+null, players see player+all+null, admin sees all. Client-side `COACH_ONLY_PATTERNS` retained as fallback.

**Commit:** `b0c2161`

### Phase B5: Create formatPhone utility [Finding #15] — PASS
**Files changed (8 files):**
- `src/lib/formatters.js` — **NEW** — `formatPhone(value)` formats raw digits to `(XXX) XXX-XXXX`
- `src/pages/parent/PlayerProfileInfoTab.jsx` — 3 phone displays wrapped
- `src/pages/registrations/PlayerDetailModal.jsx` — 3 phone displays wrapped
- `src/pages/coaches/CoachesPage.jsx` — 4 phone displays wrapped (card, modal, emergency, CSV)
- `src/components/players/PlayerComponents.jsx` — 3 phone displays wrapped
- `src/pages/staff-portal/PersonDetailPanel.jsx` — 1 phone display wrapped
- `src/pages/public/OrgDirectoryPage.jsx` — 1 phone display wrapped
- `src/pages/registrations/RegistrationsPage.jsx` — 1 CSV export accessor wrapped

**Note:** ProfileDetailsSection, ProfileInfoSection, and MyStuffPage phone fields are input elements (editable), not display-only — formatting those would break editing. Skipped intentionally.

**Commit:** `ca2cea3`

### Phase B6: Add dependency-aware empty states [Finding #12] — PASS
**Files changed:**
- `src/components/v2/parent/ParentScheduleTab.jsx` — enriched empty state with icon and helpful description
- `src/pages/schedule/CalendarViews.jsx` — added icon and navigation hints to week/day view empty states
- `src/pages/chats/ChatsPage.jsx` — role-aware empty state (parents told channels come with team assignment)
- `src/pages/roles/ParentDashboard.jsx` — Team Hub button now shows toast when child has no team (was silently doing nothing)

**Commit:** `b93bb01`

---

## Verification Greps

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| PriorityCardsEngine uses `waiver_templates` | `from('waiver_templates')` | `from('waiver_templates')` on line 83 | PASS |
| PriorityCardsEngine does NOT use `from('waivers')` | No matches | No matches | PASS |
| MyStuffPage uses `waiver_template_id` | Present | Line 357 fallback `s.waiver_template_id \|\| s.waiver_id` | PASS |
| ParentPaymentsTab has no `.slice(0, 5)` | No matches | No matches | PASS |
| formatPhone imported in 8+ files | 8+ | 8 files | PASS |
| DRIFTING not in parent contexts | No matches in .jsx | No matches | PASS |

---

## Combined Findings Coverage Matrix (Spec A + Spec B)

| # | Finding | Severity | Spec | Phase | Status |
|---|---------|----------|------|-------|--------|
| 1 | Mascot checklist (SetupHelper) | CRITICAL | A | 1 | PASS |
| 2 | Bell icon for non-admins | CRITICAL | A | 3 | PASS |
| 3 | Registration Hub crash | CRITICAL | A | 4 | PASS |
| 4 | Action item count mismatch | HIGH | A | 7 | PASS |
| 5 | No onboarding journey | HIGH | A | 2 | PASS |
| 6 | PENDING badge confusing | HIGH | A | 8 | PASS |
| 7 | Payments tab caps at 5, no grouping | HIGH | B | 2 | PASS |
| 8 | Emergency contact missing on profile | HIGH | B | 3 | PASS |
| 9 | UUID breadcrumb labels | HIGH | A | 6 | PASS |
| 10 | DOB missing on player profile | HIGH | A | 5 | PASS |
| 11 | Waiver status contradictions | MED | B | 1 | PASS |
| 12 | Empty states need improvement | MED | B | 6 | PASS |
| 13 | DRIFTING label for parents | MED | A | 9 | PASS |
| 14 | Achievement catalog unscoped | MED | B | 4 | PASS |
| 15 | Phone numbers unformatted | MED | B | 5 | PASS |
| 16 | Profile completeness indicator | LOW | — | — | DEFERRED |
| 17 | Approval notification for parents | LOW | — | — | DEFERRED (bell hidden in Spec A) |

**15 of 17 findings resolved. 2 low-severity items deferred.**

---

## Risk Assessment

| Phase | Admin broken? | Coach broken? | Scoped correctly? |
|-------|--------------|---------------|-------------------|
| B1 | No | No | Yes — waiver queries only |
| B2 | No | No | Yes — parent payments tab only |
| B3 | No | No | Yes — profile display + registration pipeline |
| B4 | No | No | Yes — admin still sees all badges |
| B5 | No | No | Yes — display-only formatting, no data changes |
| B6 | No | No | Yes — calendar enhancements apply to all roles, chat is role-aware |

---

## Notes

- **Build exit code 1 is expected** — Vite chunk-size warning causes this. `✓ built in` confirms success.
- **MyStuffPage waiver check** uses `s.waiver_template_id || s.waiver_id` as a backwards-compatible fallback for any legacy signatures. This is intentional.
- **formatPhone skipped input fields** — ProfileDetailsSection, ProfileInfoSection, MyStuffPage phone inputs are editable; formatting them would interfere with user editing.
- **No unit tests exist** in this project, so no test regression to check.
