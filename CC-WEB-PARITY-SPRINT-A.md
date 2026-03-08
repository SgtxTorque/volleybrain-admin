# CC-WEB-PARITY-SPRINT-A.md
## Lynx Web Admin -- Close All Remaining Parity Gaps
### For Claude Code Execution

**Repo:** volleybrain-admin
**Branch:** feat/desktop-dashboard-redesign
**Backend:** Supabase (project: uqpjvbiuokwpldjvxiby)
**Date:** March 7, 2026

---

## RULES (READ FIRST -- APPLY TO ALL PHASES)

1. **Read CLAUDE.md and DATABASE_SCHEMA.md** in the project root before doing anything.
2. **Read each file FULLY before modifying it.** Understand every import, hook, and render block.
3. **Archive before replace** -- copy any file being replaced to `src/_archive/parity-sprint-a/` first.
4. **Preserve all existing Supabase queries.** Never replace working queries with mock data.
5. **Do NOT touch these files:** `src/contexts/*`, `src/lib/supabase.js`, `src/lib/routes.js`.
6. **Use the existing theme system.** Use `useTheme()`, `useThemeClasses()`, `isDark`. Support both light and dark modes.
7. **Font:** Inter Variable (already in public/fonts/ and tailwind.config.js as `font-sans`).
8. **Tailwind only** -- use existing Lynx tokens from tailwind.config.js (`lynx-navy`, `lynx-sky`, etc.).
9. **Brand tokens:** offWhite=#F6F8FB, navyDeep=#0D1B3E, skyBlue=#4BB9EC, border=#E8ECF2, textPrimary=#10284C.
10. **Commit after each phase** with the message format shown.
11. **Test all four roles render** without console errors after each phase.
12. **Max 500 lines per file.** Split into sub-components if needed.
13. **No em dashes** in any user-facing text. Use double hyphens or reword.

---

## CONTEXT

This spec closes the final 6 gaps identified in the platform parity audit (verified against live repos). The mobile app (feat/next-five-build) already has all of these features built. The web repo has 115 page files and 560 commits on this branch -- almost everything is done. These are the last items.

---

## PHASE 1: Parent Registration Hub (NEW PAGE)

**Goal:** Create an authenticated parent registration page at `/parent/register`. This is NOT the public registration page (which already exists at `/register/:org/:season`). This is for logged-in parents who want to register additional children or for new seasons.

**Mobile reference:** `volleybrain-mobile3/app/parent-registration-hub.tsx` (835 lines) -- DO NOT copy the mobile UX. Adapt for desktop.

### Desktop-adapted flow (2-panel layout, not multi-step wizard):

```
+------------------------------------------+----------------------------+
|  LEFT PANEL (60%)                        |  RIGHT PANEL (40%)         |
|                                          |                            |
|  [Tab: Open Seasons | My Registrations]  |  REGISTRATION SUMMARY      |
|                                          |  - Selected season         |
|  Season cards with:                      |  - Player info preview     |
|  - Sport icon + season name              |  - Fee breakdown           |
|  - Registration deadline countdown       |  - Waiver status           |
|  - Fee info (reg + uniform)              |  - [Submit Registration]   |
|  - Early bird discount if applicable     |                            |
|  - Capacity / waitlist status            |  RETURNING FAMILY CARD     |
|  - [Register] button                     |  (if detected)             |
|                                          |  "Welcome back! We found   |
|  When Register clicked, expand inline:   |   your previous info."     |
|  - Player details form (name, DOB, etc.) |  - Pre-filled fields list  |
|  - Waiver scroll-and-sign section        |  - [Use Previous Info]     |
|  - Emergency contact                     |                            |
+------------------------------------------+----------------------------+
```

### Implementation:

1. Create `src/pages/parent/ParentRegistrationHub.jsx`
2. Query `seasons` where `registration_open = true` for the parent's org
3. Query `registrations` for the current user to show "My Registrations" tab
4. **Returning family detection:** Query `players` where `parent_account_id = user.id` or check `player_parents` table. If matches found, show the Returning Family Card in the right panel and pre-fill the player form with previous data (name, DOB, school, grade, position, jersey preferences, emergency contacts).
5. Inline waiver signing: query `waivers` for the season, display each waiver with scroll-to-accept and a typed-name signature (not canvas drawing on web).
6. Fee breakdown from `season_fees` table (registration + uniform). Show early bird discount if `early_bird_deadline` is in the future.
7. On submit: insert into `registrations` table with status `new`, create `waiver_signatures` records, queue email notification.
8. Add route to MainApp.jsx: `<Route path="/parent/register" element={<ParentRegistrationHub ... />} />`
9. Add nav link in LynxSidebar for Parent role under "My Family" or similar group.

### Supabase tables used:
- `seasons` (registration_open, early_bird_deadline, early_bird_discount, capacity)
- `season_fees` (fee type, amount per season)
- `registrations` (player_id, season_id, status, created_at)
- `players` (parent_account_id, first_name, last_name, dob, school, grade, position)
- `player_parents` (player_id, parent_id, relationship)
- `waivers` (season_id, title, content)
- `waiver_signatures` (waiver_id, signed_by, signature_text, signed_at)
- `families` (account_id)

**Commit:** `"Parity Phase 1: Parent Registration Hub with returning family detection, inline waivers, fee breakdown"`

---

## PHASE 2: COPPA Consent Modal (NEW COMPONENT)

**Goal:** Add a COPPA consent modal that appears when a parent first accesses chat. This is a legal requirement for children under 13.

**Mobile reference:** `volleybrain-mobile3/components/CoppaConsentModal.tsx` (265 lines)

### Implementation:

1. Create `src/components/compliance/CoppaConsentModal.jsx`
2. The modal should appear as an overlay when:
   - The user's role is `parent`
   - The user's profile does NOT have `coppa_consent_given = true`
   - The user navigates to `/chats`
3. Modal content:
   - Heading: "Parental Consent Required"
   - Body: Explain that Lynx complies with COPPA. Children under 13 participate in team features. We need parental consent to continue. We never sell children's data.
   - [I Consent] button -- updates `profiles` table: `coppa_consent_given: true, coppa_consent_date: new Date().toISOString()`
   - [Learn More] link to privacy policy
   - Cannot be dismissed without action (no X button, no click-outside-to-close)
4. Gate the ChatsPage: In `src/pages/chats/ChatsPage.jsx`, check `profile.coppa_consent_given` for parent role. If not consented, show the modal instead of the chat interface.
5. Style: Use existing modal patterns from the codebase (check GiveShoutoutModal or CreateChallengeModal for reference). White card, rounded corners, Lynx brand colors.

### Supabase:
- Read: `profiles.coppa_consent_given`
- Write: `profiles.coppa_consent_given`, `profiles.coppa_consent_date`

**Note:** If the `coppa_consent_given` and `coppa_consent_date` columns don't exist on the `profiles` table, add them via:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coppa_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coppa_consent_date TIMESTAMPTZ;
```

**Commit:** `"Parity Phase 2: COPPA consent modal gating chat for parent role"`

---

## PHASE 3: Claim Account Page (NEW PAGE)

**Goal:** Allow parents whose children were pre-registered by an admin to claim those player profiles.

**Mobile reference:** `volleybrain-mobile3/app/claim-account.tsx` (154 lines) -- simple and clean, follow the same pattern.

### Implementation:

1. Create `src/pages/parent/ClaimAccountPage.jsx`
2. **Detection logic:** When a parent logs in, check if any `players` records have a matching email (parent's email in `players.parent_email` or `players.emergency_email`) but `parent_account_id IS NULL`. These are "orphan" players.
3. If orphan players found, show a card:
   - Lynx mascot image (if available, else skip)
   - "We found your family!"
   - List each player with name and checkmark icon
   - [Link to My Account] primary button
   - [This isn't me] secondary/skip button
4. On "Link to My Account":
   - Update `players.parent_account_id = user.id` for each matched player
   - Upsert into `player_parents` (player_id, parent_id, relationship: 'parent', is_primary: true)
   - If `families` records exist for those players, update `families.account_id = user.id`
   - Navigate to dashboard
5. On "This isn't me": navigate to dashboard, don't link.
6. Add route: `<Route path="/claim-account" element={<ClaimAccountPage ... />} />`
7. **Trigger:** Add a check in the parent dashboard or after login. If orphan players detected, show a banner/card that links to `/claim-account`. Check `ParentDashboard.jsx` -- add a priority card at the top if orphans are detected.

### Supabase tables:
- `players` (parent_account_id, parent_email, emergency_email)
- `player_parents` (player_id, parent_id, relationship, is_primary)
- `families` (account_id)
- `profiles` (id, email)

**Commit:** `"Parity Phase 3: Claim Account page with orphan player detection and linking"`

---

## PHASE 4: PlayerStatsPage Route (WIRING FIX)

**Goal:** The file `src/pages/stats/PlayerStatsPage.jsx` (743 lines) is fully built but has no route in MainApp.jsx. Wire it up.

### Implementation:

1. In `src/MainApp.jsx`:
   - Add import: `import { PlayerStatsPage } from './pages/stats/PlayerStatsPage'`
   - Add route: `<Route path="/stats" element={<PlayerStatsPage showToast={showToast} />} />`
   - Also consider: `<Route path="/stats/:playerId" element={<PlayerStatsPage showToast={showToast} />} />`
2. Add nav link for Player role in LynxSidebar under "My Stuff" group:
   - `{ id: 'stats', label: 'My Stats', icon: 'chart' }` (or appropriate icon)
3. Verify the page renders for player role without errors.
4. If `PlayerStatsPage` expects props like `playerId`, pass them via route params or from auth context.

**Commit:** `"Parity Phase 4: wire PlayerStatsPage route and nav link"`

---

## PHASE 5: Venue Manager Page (NEW PAGE)

**Goal:** Create a standalone venue management page. Currently venues are managed inline in SchedulePage and AddEventModal. Mobile has `venue-manager.tsx` (72 lines, lightweight).

### Implementation:

1. Create `src/pages/settings/VenueManagerPage.jsx`
2. Venues are stored in org settings JSON (`organizations.settings.venues` as array). Check how `SchedulePage.jsx` and `AddEventModal.jsx` load venues -- reuse the same data source.
3. Page layout:
   - Header: "Venue Manager" with [+ Add Venue] button
   - Table/card list of all venues: name, address, notes
   - Add/edit modal: name (required), address (required), notes (optional), map link (optional)
   - Delete with confirmation
4. Add route: `<Route path="/settings/venues" element={<VenueManagerPage showToast={showToast} />} />`
5. Add nav link in Admin sidebar under "Setup" group.
6. Use the PageShell component pattern from the inner pages redesign.

**Commit:** `"Parity Phase 5: standalone Venue Manager page at /settings/venues"`

---

## PHASE 6: Verification Pass

1. Switch between all 4 roles (admin, coach, parent, player) and verify:
   - No console errors on any dashboard
   - Parent Registration Hub loads and shows seasons
   - COPPA modal appears for parent on /chats if not consented
   - Claim Account page renders (even if no orphan players exist -- should show empty/redirect)
   - PlayerStatsPage loads via /stats route
   - VenueManagerPage loads via /settings/venues
2. Run `npm run build` -- verify zero build errors.
3. Report any issues found.

**Commit:** `"Parity Phase 6: verification pass -- all gaps closed, build clean"`

---

## DONE

After all 6 phases, the web admin will have zero remaining parity gaps with mobile. The only differences will be intentionally platform-specific features (drag-and-drop dashboard, command palette, form builder, etc.).
