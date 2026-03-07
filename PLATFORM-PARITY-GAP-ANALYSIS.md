# Platform Parity Gap Analysis — Mobile vs Web

## Date: 2026-03-07
## Purpose: Identify feature gaps between mobile and web to prioritize what to build next

---

## EXECUTIVE SUMMARY

| Metric | Mobile | Web |
|--------|--------|-----|
| Total Screens | 72 | 44 |
| Total Features Audited | 62 | 66 |
| Fully Implemented | 57 (92%) | 51 (77%) |
| Partial | 3 (5%) | 11 (17%) |
| Missing | 2 (3%) | 4 (6%) |
| Supabase Tables Used | 56 | 62 |
| RPC Functions | 11 | 2 |
| Storage Buckets | 4 | 3 |

**Bottom line:** Mobile has broader feature coverage (92% vs 77%). Web has more admin power tools but is missing key parent-facing flows. The biggest gaps are in parent registration, onboarding, and player experience on web.

---

## 1. FEATURES ON MOBILE BUT NOT ON WEB

### Critical (P0) — Causes broken workflows

| # | Feature | What It Does on Mobile | Who Uses It | Difficulty | Where on Web |
|---|---------|----------------------|-------------|------------|--------------|
| 1 | **Parent Registration Hub** | Multi-step registration: family info → player details → waivers → payment. Detects returning families, handles multi-child, open season discovery | Parents (100% of parents use this) | L | New page at `/parent/register` |
| 2 | **COPPA Consent Modal** | Parental consent for children's data/chat access. Tracks `coppa_consent_given` flag | Parents with children under 13 | S | Add modal to ChatsPage when parent accesses child chat |
| 3 | **Claim Account** | Orphan account resolution — parent claims existing player profile created by admin | Parents with pre-registered kids | M | New page at `/claim-account` or modal in Parent Dashboard |

### High Priority (P1) — Key user experience gaps

| # | Feature | What It Does on Mobile | Who Uses It | Difficulty | Where on Web |
|---|---------|----------------------|-------------|------------|--------------|
| 4 | **Returning Family Detection** | Auto-detects returning families, shows returning family cards for faster re-registration | Parents (repeat registrations) | M | Add to PublicRegistrationPage |
| 5 | **Season Setup Wizard (5-step)** | Guided 5-step wizard: Basics → Teams → Registration → Schedule → Review | Admins (season start) | M | Enhance SeasonManagementPage with wizard flow |
| 6 | **Game Day Command Center** | 4-page workflow: Prep → Live Match → End Set → Post-Game with MatchProvider context | Coaches (every game) | L | Enhance GamePrepPage with multi-step workflow |
| 7 | **Game Recap Page** | Final game recap: score, opponent, date, per-player stats snapshot | Coaches + parents (post-game) | M | New page at `/games/:gameId/recap` |
| 8 | **Player Trading Card (FIFA-style)** | Full-screen trading card: XP/OVR, skill breakdown, badges, photo, rarity glow | Players + parents (engagement) | M | New page at `/player-card/:playerId` or modal |
| 9 | **Player Evaluation (9-skill swipe)** | Swipe cards for 9 skills rated 1-10 with per-skill notes | Coaches (player development) | M | New page at `/evaluations` or modal in RosterManager |
| 10 | **Bulk Event Create Wizard** | 4-step wizard: day selection → recurrence → location → preview & confirm | Admins (season setup) | M | Enhance SchedulePage with wizard modal |

### Medium Priority (P2) — Nice-to-have for completeness

| # | Feature | What It Does on Mobile | Who Uses It | Difficulty | Where on Web |
|---|---------|----------------------|-------------|------------|--------------|
| 11 | **Venue Manager** | Add/edit venues with location details | Admins | S | New page at `/settings/venues` |
| 12 | **Coach Background Checks** | Track background check status for coaches | Admins | S | Add tab to CoachesPage |
| 13 | **Volunteer Assignment Wizard** | 3-step workflow: Select Event → Assign Roles → Confirm & Notify | Admins | M | New page at `/volunteers` or modal in AttendancePage |
| 14 | **Payment Reminders Page** | Dedicated screen for scheduling payment reminders | Admins | S | Could be tab on PaymentsPage |
| 15 | **My Kids Page** | Parent view of all children with navigation to player cards | Parents | S | Dashboard already has child selector; could add as dedicated page |
| 16 | **My Waivers Page** | Parent waiver status and signing | Parents | S | Already in MyStuffPage tabs; consider standalone |
| 17 | **Challenge Library** | Browse all available challenges | Coaches | S | Add tab to achievements or new page |
| 18 | **Coach Challenge Dashboard** | Challenge management for coaches | Coaches | S | ChallengesCard on coach dashboard covers basics |
| 19 | **Player Goals** | Set/track player development goals | Coaches | M | New page or section in RosterManager |
| 20 | **Season Progress Page** | Track season progress metrics for players | Players | S | Add to player dashboard or achievements |
| 21 | **Evaluation Session Manager** | Live evaluation session for multiple players | Coaches | M | Build as part of evaluation feature |
| 22 | **Notification Preferences** | Per-user push notification type toggles | All users | S | Add to MyProfilePage or MyStuffPage |

### Low Priority (P3) — Mobile-specific UX

| # | Feature | What It Does on Mobile | Who Uses It | Difficulty | Where on Web |
|---|---------|----------------------|-------------|------------|--------------|
| 23 | **Gesture Drawer Menu** | Swipe-open navigation drawer with shortcuts | All (mobile UX) | N/A | Not needed — web has sidebar nav |
| 24 | **Day-Strip Calendar** | Horizontal date picker with event dots | Parents | N/A | CalendarStripCard already exists on dashboard |
| 25 | **Touch Signature Pad** | Finger-drawn waiver signatures | Parents | S | Could use mouse-drawn canvas on web |
| 26 | **Push Notifications (native)** | Native push via expo-notifications | All | N/A | Web push via service worker (separate concern) |
| 27 | **First Launch Tour** | Onboarding walkthrough for new users | New users | S | Could add as guided tour overlay |

---

## 2. FEATURES ON WEB BUT NOT ON MOBILE

| # | Feature | What It Does on Web | Who Uses It | Difficulty to Add to Mobile |
|---|---------|--------------------|-------------|---------------------------|
| 1 | **Dashboard Customization** | Drag-and-drop widget grid with per-user persistence | Admin, Coach, Parent | L — react-native-draggable-grid would need custom implementation |
| 2 | **Command Palette (Cmd+K)** | Quick navigation across all pages, teams, players | Power users | N/A — mobile has search bar + gesture drawer |
| 3 | **URL Routing & Bookmarks** | Bookmarkable pages, browser history | All | N/A — mobile uses React Navigation deep links |
| 4 | **Public Registration Page** | No-login registration at shareable URL | Public / parents | M — Could build as in-app webview or deep link |
| 5 | **Registration Form Builder** | Create custom registration templates with dynamic fields | Admins | L — Complex form builder UI on mobile |
| 6 | **Waiver Template Editor** | Create/edit waiver templates with rich text | Admins | M — `web-features.tsx` already flags this as web-only |
| 7 | **Data Export (CSV/Excel)** | Export team/player data in bulk | Admins | S — Share sheet with CSV attachment |
| 8 | **Subscription Management** | License and billing management | Admins | S — Could be minimal view page |
| 9 | **Platform Admin Suite** | Multi-org management (3 pages) | Super admins | N/A — Not needed on mobile |
| 10 | **Registration Funnel Analytics** | Conversion rates, drop-off analysis | Admins | M — Could be simpler card in reports |
| 11 | **Split-Panel Chat** | Side-by-side channel list + thread | All | N/A — Mobile has native tab-based chat |
| 12 | **Breadcrumb Navigation** | URL-based breadcrumbs showing current path | All | N/A — Mobile uses back buttons |
| 13 | **Skeleton Loading States** | Shimmer loading animations | All | S — Already common pattern in RN |
| 14 | **Season Management (Guided)** | Step-by-step season setup with progress tracking | Admins | M — Mobile has SeasonSetupWizard but different UX |

**Recommendation:** Most web-only features are correctly web-only per the UX philosophy (web = command center, mobile = companion). Registration Form Builder, Waiver Editor, Data Export, and Platform Admin should stay web-exclusive. Consider adding Public Registration as a webview on mobile.

---

## 3. FEATURES ON BOTH BUT DIFFERENT

| # | Feature | Mobile | Web | Should Align? | Better Version |
|---|---------|--------|-----|---------------|----------------|
| 1 | **Dashboard Layout** | Fixed card scroll (vertical) | Drag-and-drop grid (24-col) | No — different UX paradigms | Both appropriate for platform |
| 2 | **Child Selector (Parent)** | Swipeable carousel with photos | Tab buttons with names | Could align slightly | Mobile is more engaging; web is more functional |
| 3 | **Priority Cards Engine** | Integrated in home scroll | Dedicated card widget on dashboard | Same data, different presentation | Web version is more visible (good) |
| 4 | **Team Wall** | Tab-based (Posts / Achievements / Stats) | Multi-section page with sidebars | Could align tabs | Mobile has cleaner UX; web has more space |
| 5 | **Chat Interface** | Tab-based navigation, typing indicators | Split-panel with channels list | No — different paradigms | Both appropriate |
| 6 | **Attendance** | Event-based with present/absent/late | Event list → expand to mark | Same behavior, different layout | Web could add inline marking like mobile |
| 7 | **Leaderboard** | Grid + full list views, top 3 per category | Table-based with stat filters | Could align presentation | Mobile is more visual; web has more data |
| 8 | **Achievements** | Full-screen cards with rarity effects | Catalog grid with detail modal | Could align celebration UX | Mobile is much richer visually |
| 9 | **Shoutout Flow** | In-feed cards with XP animation | Modal-based flow | Same data flow, different UX | Both work well |
| 10 | **Challenge System** | Full challenge lifecycle (library, CTA, celebration) | Create + view on dashboard | Web is missing challenge library + celebration | Mobile is more complete |
| 11 | **Role Switcher** | RoleSelector component + devViewAs | Sidebar dropdown | Same mechanism | Both work |
| 12 | **Payment View** | Admin: per-player/family grouped. Parent: player fees | Admin: stat row + data table. Parent: card-based | Same data, different layouts | Both appropriate for platform |
| 13 | **Player Stats** | Season selector, summary cards, personal bests, game history | Scouting report card on dashboard | Web has less depth | Mobile is more complete — web needs `/my-stats` page |
| 14 | **Registration Approval** | Admin cards with approve/deny buttons | Data table with bulk operations | Same capability | Web is better for bulk; mobile is better for individual review |

---

## 4. SUPABASE TABLE GAPS

### Tables Used by Mobile but NOT by Web (6 tables)

| Table | Mobile Usage | Impact |
|-------|-------------|--------|
| `age_groups` | Age group definitions for team organization | Low — could add to team setup |
| `families` | Family group definitions | Medium — web doesn't track family groups |
| `invitations` | Invitation codes for registration | Low — web uses public URL instead |
| `payment_settings` | Payment configuration per season | Medium — web has PaymentSetupPage but may not query this table |
| `season_fees` | Fee structure per season | Medium — web queries `payments` directly |
| `typing_indicators` | Real-time chat typing status | Low — web chat doesn't show typing indicators |

### Tables Used by Web but NOT by Mobile (12 tables)

| Table | Web Usage | Impact |
|-------|----------|--------|
| `account_invites` | Setup wizard invite tracking | Low — web-only onboarding |
| `admin_notifications` | Admin notification feed | Low — web-only admin feature |
| `email_notifications` | Email notification queue | Low — web triggers emails |
| `game_stats` | Aggregated game statistics | Low — mobile uses `game_player_stats` |
| `jersey_assignments` | Jersey-player assignments | Low — mobile uses `jerseys` table differently |
| `notification_templates` | Notification template definitions | Low — web-only admin feature |
| `player_badges` | Player badge inventory | Low — could add to mobile |
| `player_coach_notes` | Coach notes on individual players | Medium — useful for mobile coach view |
| `player_positions` | Player position assignments | Low — mobile stores position on `players` table |
| `team_documents` | Team document storage | Low — web team wall feature |
| `team_invite_codes` | Team-specific invite codes | Low — web setup wizard |
| `user_dashboard_layouts` | Per-user dashboard widget layouts | N/A — web-only drag-and-drop |

### RPC Functions: Mobile Has 11, Web Has 2

| Function | Mobile | Web | Notes |
|----------|--------|-----|-------|
| `assign_jersey` | YES | NO | Web handles jersey assignment via direct table ops |
| `check_game_reminders` | YES | NO | Mobile-only reminder check |
| `check_game_reminders_2hr` | YES | NO | Mobile-only reminder check |
| `check_payment_reminders` | YES | NO | Mobile-only reminder check |
| `check_rsvp_reminders` | YES | NO | Mobile-only reminder check |
| `get_pending_emails` | YES | NO | Mobile-only email check |
| `get_team_parent_ids` | YES | NO | Mobile uses for team notifications |
| `mark_email_failed` | YES | NO | Mobile-only email tracking |
| `mark_email_sent` | YES | NO | Mobile-only email tracking |
| `queue_notification` | YES | YES | Both use for notifications |
| `queue_team_notification` | YES | YES | Both use for team notifications |

### Storage Buckets

| Bucket | Mobile | Web | Notes |
|--------|--------|-----|-------|
| `media` | YES | YES | Both: profile photos, general uploads |
| `photos` | YES | NO | Mobile: team/event photos |
| `player-photos` | YES | NO | Mobile: player profile photos |
| `waivers` | YES | YES | Both: waiver PDFs |
| `team-assets` | NO | YES | Web: team logos, cover photos |

---

## 5. PRIORITY RECOMMENDATIONS

### Tier 1: Build Now (Blocks real workflows)

| Priority | Feature | Reason | Platform | Effort |
|----------|---------|--------|----------|--------|
| **P0-1** | Parent Registration on Web | Parents need to register children from desktop. Currently web has only public reg (no login). Need authenticated parent reg flow with multi-child, returning family, payment. | Web | L |
| **P0-2** | COPPA Consent on Web | Legal requirement for children under 13. Mobile has it, web doesn't. | Web | S |
| **P0-3** | Claim Account on Web | Parents whose kids were pre-registered by admin can't claim profiles on web. | Web | M |

### Tier 2: Build Soon (Key experience gaps)

| Priority | Feature | Reason | Platform | Effort |
|----------|---------|--------|----------|--------|
| **P1-1** | Game Day Command Center (Web) | Coaches need multi-step game day workflow. Current GamePrepPage is flat; mobile has 4-step flow. | Web | L |
| **P1-2** | Player Evaluation Page (Web) | Coaches need to evaluate players with 9-skill ratings. Currently only available in archived RosterManager code. | Web | M |
| **P1-3** | Player Trading Card (Web) | Key engagement feature for players and parents. Mobile has full FIFA-style card. | Web | M |
| **P1-4** | Game Recap Page (Web) | Post-game summary is missing. Mobile has dedicated recap screen. | Web | M |
| **P1-5** | Returning Family Detection (Web) | Reduces registration friction for returning families. | Web | M |
| **P1-6** | My Stats Page (Web) | Players have no dedicated stats page; only scouting card on dashboard. Mobile has full stats page. | Web | M |

### Tier 3: Build When Convenient (Completeness)

| Priority | Feature | Reason | Platform | Effort |
|----------|---------|--------|----------|--------|
| **P2-1** | Venue Manager (Web) | Admins manage venues on mobile but not web. | Web | S |
| **P2-2** | Coach Background Checks (Web) | Tracking exists on mobile; web coaches page could add tab. | Web | S |
| **P2-3** | Volunteer Assignment Wizard (Web) | Mobile has 3-step wizard; web has basic volunteer tracking in attendance. | Web | M |
| **P2-4** | Challenge Library (Web) | Mobile has full challenge browsing; web only has creation modal. | Web | S |
| **P2-5** | Player Goals (Web) | Development goal tracking exists on mobile but not web. | Web | M |
| **P2-6** | Notification Preferences (Web) | Per-user notification toggles. Mobile has it; web doesn't. | Web | S |
| **P2-7** | Bulk Event Create Wizard (Web) | Mobile has 4-step wizard; web schedule page has bulk create but less guided. | Web | M |
| **P2-8** | Payment Plans / Installments (Both) | Neither platform fully supports installment scheduling. | Both | M |
| **P2-9** | Streak Management (Both) | Both show streak count but neither has streak rewards/recovery. | Both | S |

### Tier 4: Keep Platform-Specific

These features should stay on their current platform per the UX philosophy:

| Feature | Platform | Why |
|---------|----------|-----|
| Registration Form Builder | Web only | Complex form builder requires desktop screen |
| Waiver Template Editor | Web only | Rich text editing is desktop task |
| Data Export (CSV/Excel) | Web only | Bulk data is a desktop workflow |
| Platform Admin Suite | Web only | Super admin controls are desktop-only |
| Dashboard Drag-and-Drop | Web only | Grid layout customization needs mouse |
| Command Palette (Cmd+K) | Web only | Keyboard-driven navigation |
| Gesture Drawer Menu | Mobile only | Touch-native navigation |
| Touch Signature Pad | Mobile only | Finger-drawn signatures |
| Native Push Notifications | Mobile only | OS-level notification integration |
| Day-Strip Calendar | Mobile only | Thumb-scrollable date picker |

---

## 6. RECOMMENDED BUILD ORDER

### Sprint A: Parent Registration & Compliance (2-3 sessions)
1. Parent Registration Hub on web (authenticated flow with multi-child)
2. Returning family detection
3. COPPA consent modal for chat
4. Claim Account page

### Sprint B: Coach Power Tools (2 sessions)
1. Game Day Command Center (4-step workflow)
2. Player Evaluation page (9-skill ratings)
3. Game Recap page

### Sprint C: Player Experience (1-2 sessions)
1. Player Trading Card page (FIFA-style)
2. My Stats page (season stats, personal bests, game history)
3. Challenge Library page

### Sprint D: Admin Completeness (1 session)
1. Venue Manager page
2. Coach Background Checks tab
3. Volunteer Assignment wizard
4. Notification Preferences on profile page

### Sprint E: Cross-Platform Alignment (1 session)
1. Payment Plans / installment scheduling
2. Streak management and rewards
3. Bulk Event Create wizard enhancement

---

## 7. SUMMARY TABLE

| Area | Mobile | Web | Gap Owner |
|------|--------|-----|-----------|
| Auth & Onboarding | Strong (5 screens) | Basic (3 screens) | Web needs parent reg + claim |
| Admin Tools | Strong (28 screens) | Very strong (29 routes) | Web leads |
| Coach Tools | Strong (22 screens) | Good (13 routes) | Web needs eval, game day flow |
| Parent Experience | Strong (11 screens) | Moderate (15 routes, 2 stubs) | Web needs registration flow |
| Player Experience | Strong (9 screens) | Basic (7 routes) | Web needs stats page, trading card |
| Communication | Strong (6 features) | Strong (5 features) | Web needs COPPA |
| Payments | Moderate (5 features) | Moderate (4 features) | Both need payment plans |
| Gamification | Strong (7 features) | Good (7 features) | Web needs trading card, challenge library |
| Settings & Admin | Basic (3 screens) | Comprehensive (7 pages) | Web leads |
| Platform Admin | None | Strong (3 pages) | Web leads (correctly) |

---

*Generated by automated platform parity analysis on 2026-03-07*
