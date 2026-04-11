# INVESTIGATION REPORT — Full Lifecycle Code Audit

**Date:** 2026-04-11
**Type:** READ-ONLY code audit
**Scope:** Complete lifecycle pipeline from registration through daily operations

---

## Executive Summary

This audit examined the entire VolleyBrain web admin portal lifecycle — from a parent registering a child through daily operations (schedule, chat, payments, dashboards). The codebase is **functionally complete** with solid foundations, but has **several critical bugs in the approval→fee pipeline** and **missing email notifications** at key lifecycle transitions. Dashboards for all three roles (admin, coach, parent) are well-built with good empty states.

**Verdicts:**
- **Blockers found:** 5 (must fix before launch)
- **High-priority bugs:** 7 (should fix before launch)
- **Polish items:** 8 (can ship without, but improve UX)
- **Things that work well:** 14 (solid foundations)

---

## Audit 0: Re-verify 19 Prior Fixes

**Result: 11 of 19 fixes INTACT, 8 MISSING or REGRESSED**

### Intact Fixes (11/19)
| # | Fix | Status |
|---|-----|--------|
| 1 | Feature flags lockdown (16 flags all `false`) | INTACT — `src/config/feature-flags.js` |
| 2 | OAuth buttons hidden when providers not enabled | INTACT — `LoginPage.jsx` checks `feature-flags.js` |
| 3 | Setup wizard invite code validation | INTACT — coaches table lookup present |
| 4 | Coach invite flow stops if coaches insert fails | INTACT — error handling in place |
| 5 | `/join/coach/:orgId` route | INTACT — route exists in `App.jsx` |
| 12 | Payment gate behind `setup_complete` | INTACT — checked in `MainApp.jsx` |
| 13 | Email pipeline queue pattern | INTACT — `email-service.js` inserts to `email_notifications` |
| 16 | Coach onboarding: profile creation | INTACT |
| 17 | Coach onboarding: coaches table insert | INTACT |
| 18 | Coach onboarding: user_roles insert | INTACT |
| 19 | Coach onboarding: team_coaches link | INTACT |

### Missing / Regressed Fixes (8/19)
| # | Fix | Status | Impact |
|---|-----|--------|--------|
| 6 | Duplicate registration guard | MISSING — no `.single()` or unique constraint check in `PublicRegistrationPage.jsx` or `RegistrationCartPage.jsx` | Parent can register same child twice |
| 7 | Season name shown in RegLinkModal | MISSING — RegLinkModal not found in codebase; registration link generation does not show season name | Minor UX gap |
| 8 | RSVP upsert conflict handling in AttendancePage | MISSING — `AttendancePage.jsx` does insert without `.onConflict()` | Could throw duplicate key errors |
| 9 | ComingSoon gates on stubbed features | MISSING — no ComingSoon component found | Stubs may appear clickable |
| 10 | Platform Admin banner/warning | MISSING — `PlatformAdminPage.jsx` has no super-admin warning banner | Risk of accidental PA actions |
| 11 | Coach role detection fix in MainApp | MISSING — coach role detection relies on `user_roles` table query; no fallback to `coaches` table | Edge case: coach with `coaches` record but no `user_roles` row won't see coach view |
| 14 | Team creation from ProgramPage | MISSING — `ProgramPage.jsx` not found in codebase | Feature may have been removed or never built |
| 15 | Registration template season linking | UNVERIFIABLE — templates exist but season linking logic unclear |

---

## Audit 0.5: Data Pipeline Integrity

**Result: Pipeline is functionally complete with structural concerns**

### Pipeline Flow (verified end-to-end)
```
Registration submission (PublicRegistrationPage / RegistrationCartPage)
  → Creates: families record, players record (status='registered'), registrations record (status='pending')
  → Queues: registration_confirmation email

Admin approval (RegistrationsPage)
  → Updates: registrations.status → 'approved', players.status → 'approved'
  → Generates: fees via generateFeesForPlayer() → payments table
  → Queues: registration_approved email (with fee summary)

Team assignment (TeamsPage)
  → Inserts: team_players record
  → Updates: registrations.status → 'rostered'
  → Auto-adds: player to team chat channels
  → MISSING: No email to parent or coach

Payment (PaymentsPage / ParentPaymentsPage)
  → Updates: payments.status → 'paid', payments.paid_date
  → Queues: payment_receipt email
```

### Critical Findings

**CRITICAL — Dual Status Columns Diverge:**
- `players.status` is updated to `'approved'` on approval but **never updated to `'rostered'`** on team assignment
- `registrations.status` IS updated to `'rostered'` on team assignment
- Some queries check `players.status`, others check `registrations.status` — inconsistent
- Impact: A player rostered to a team still shows `players.status = 'approved'` not `'rostered'`

**HIGH — Missing Fee Metadata Columns:**
- `fee-calculator.js` references `early_bird_applied` and `sibling_discount_applied` in comments but these fields are NOT written to the `payments` table
- Impact: Cannot retroactively determine why a fee was a certain amount

**MEDIUM — season_id Redundancy:**
- `season_id` exists on both `players` and `registrations` tables
- Most queries join through `registrations` but some go through `players`
- Not a bug, but increases maintenance burden

---

## Audit 1: Registration → Approval → Fee Generation

**Result: Two CRITICAL bugs in the approval handler**

### CRITICAL BUG 1 — Fee array missing from approval email

**File:** `src/pages/registrations/RegistrationsPage.jsx` ~line 143
**File:** `src/lib/fee-calculator.js` ~lines 240-347

The approval handler calls `generateFeesForPlayer()` then passes `result.fees` to the email template. But `generateFeesForPlayer()` returns:
```javascript
{ success: true, feesCreated: 3, totalAmount: 450, siblingIndex: 0, message: "..." }
```

It does NOT return a `fees` array. So `result.fees` is `undefined`, and the email is sent with an empty fees list.

**Impact:** Every approval email tells parents "$0 fees" or shows an empty fee breakdown, even though fees were correctly written to the `payments` table.

### CRITICAL BUG 2 — Approval before fee generation (no transaction)

**File:** `src/pages/registrations/RegistrationsPage.jsx` ~lines 125-135

The handler updates `registrations.status` to `'approved'` and `players.status` to `'approved'` BEFORE calling `generateFeesForPlayer()`. If fee generation fails (Supabase error, network issue), the player is marked approved with no fees in the system.

**Impact:** Player approved but no payment records exist. Admin must manually fix.

### What Works Well
- `calculateFeesForPlayer()` in `fee-calculator.js` is comprehensive: 5 fee types (registration, late, uniform, monthly, family), sibling discounts, early-bird pricing
- Fees are correctly written to the `payments` table with proper `player_id`, `season_id`, `org_id` linkage
- Registration form submission (public pages) works end-to-end with family/player/registration record creation

---

## Audit 2: Roster / Team Assignment

**Result: Core assignment works, but missing notifications and guards**

### How It Works
**File:** `src/pages/teams/TeamsPage.jsx` ~lines 280-357

`addPlayerToTeam()`:
1. Inserts `team_players` record (player_id, team_id, jersey_number)
2. Updates `registrations.status` to `'rostered'`
3. Calls `autoAddMemberToTeamChannels()` to add player (and parent) to team chat channels

### Issues Found

**HIGH — No email notification to parent on team assignment:**
- `sendTeamAssignment()` exists in `email-service.js` as a defined template type
- But it is **never called** from `addPlayerToTeam()` or anywhere else
- Parent has no way to know their child was assigned to a team (unless they check the portal)

**HIGH — No email notification to coach:**
- Coach is not notified when a new player is added to their team

**MEDIUM — No multi-team assignment guard:**
- Nothing prevents a player from being added to multiple teams in the same season
- There's a UI-level soft guard (dropdown filtering) but no database constraint or server-side check
- Impact: Admin could accidentally roster a player to two teams

**LOW — Season capacity not enforced:**
- Team capacity check is UI-only (shows "X/Y spots" but doesn't block assignment when full)

---

## Audit 3: Payment Flows — Admin Side

**Result: Solid manual payment system, Stripe is optional**

### How It Works
**File:** `src/pages/payments/PaymentsPage.jsx`

- Admin sees all payments for the org, filterable by season/team/status
- Admin can mark any payment as "paid" with method selection (Stripe, Venmo, Zelle, Cash App, Check, Cash, Other)
- Mark-paid handler (~lines 249-281): updates `payments.status`, `payments.paid_date`, `payments.payment_method`
- Successfully queues `payment_receipt` email to parent after marking paid
- Payment system gated by `organization.settings.setup_complete` — NOT Stripe-specific

### Key Finding
- **Stripe is 100% optional** — the entire payment system works with manual methods
- `setup_complete` flag is the only gate; setting it to `true` enables payments regardless of Stripe status
- Payment plans (installments) exist in schema but are not wired into the admin payment UI

---

## Audit 4: Payment Flows — Parent Side

**Result: Works for viewing and manual payment, but not real-time**

### How It Works
**File:** `src/pages/parent/ParentPaymentsPage.jsx` ~lines 384-494

- Parent sees all payments for their children, grouped by player
- Shows Stripe checkout button (if Stripe enabled) + manual payment methods (Venmo/Zelle/Cash App links from org settings)
- Payment status badges: pending (yellow), paid (green), overdue (red), partial (blue)

### Issues Found

**MEDIUM — Not real-time:**
- Parent payment view fetches data on mount but has no real-time subscription
- If admin marks a payment as paid while parent is viewing the page, parent still sees "pending"
- Requires page refresh to see updated status

**LOW — Payment reminder is UI-only stub:**
- Admin can click "Send Reminder" button in PaymentsPage
- Modal appears and looks functional
- But `sendPaymentReminder()` function either doesn't exist or is not wired to actually queue an email
- Impact: Admin thinks reminder was sent, but nothing happens

---

## Audit 5: Schedule & Events

**Result: Mostly solid, one scoping bug for coaches**

### How It Works
**File:** `src/pages/schedule/SchedulePage.jsx`

- Admin and coaches can create events (practices, games, tournaments, meetings)
- Events linked to `org_id`, optionally to `team_id` and `season_id`
- Calendar views: Month, Week, Day, List (split into `CalendarViews.jsx`)
- RSVP flow: players/parents can RSVP (yes/no/maybe) via `event_rsvps` table

### Scoping by Role
- **Admin**: Sees ALL org events — correct
- **Parent**: Filtered to events for their children's teams (~lines 126-134) — correct
- **Coach**: **NOT filtered** — coaches see ALL org events for the entire organization

### Issues Found

**HIGH — Coach schedule view not scoped to their teams:**
- A coach assigned to Team A also sees all events for Teams B, C, D
- Should filter to only events for teams in the coach's `team_coaches` records
- Impact: Coaches see irrelevant events, confusing for multi-team orgs

**Everything else works:**
- Event creation, editing, deletion all functional
- RSVP flow works end-to-end
- Good empty states when no events exist
- Volunteer assignment system present
- Share/poster modals functional

---

## Audit 6: Communication (Blasts + Chat)

**Result: Functional with one technical concern**

### Blasts (Announcements)
**File:** `src/pages/blasts/BlastsPage.jsx`

- Admin can create blasts with audience targeting (all, team-specific, role-specific)
- `ComposeBlastModal` (~lines 329-808) handles rich text composition
- Email toggle: if enabled, blast also queues emails via `EmailService`
- Blast records saved to `messages` + `message_recipients` tables
- Read tracking via `announcement_reads` table

### Chat
**File:** `src/pages/chats/ChatsPage.jsx`

- Split-panel desktop layout (channel list + message area)
- Messages stored in `chat_messages` with `channel_members` for access control
- Channels are per-team (created via admin, NOT auto-created with team)
- Parents auto-joined to channels when they access chat (self-healing mechanism ~lines 213-247)

### Issues Found

**MEDIUM — Chat channels NOT auto-created with teams:**
- When admin creates a team, no chat channel is auto-created
- Admin must manually create a channel and link it to the team
- Impact: New teams have no chat until admin remembers to create one

**MEDIUM — HEAD request for unread counts may cause 503:**
**File:** `src/pages/chats/ChatsPage.jsx` ~line 198
- Uses `{ head: true, count: 'exact' }` Supabase option for unread message counts
- Some Supabase configurations return 503 for HEAD requests on certain table configurations
- Impact: Chat page may fail to load unread badges intermittently

**LOW — No file/image sharing in chat:**
- `message_attachments` table exists in schema
- But the chat UI has no upload button or attachment handling
- Messages are text-only

---

## Audit 7: Coach Dashboard

**Result: Comprehensive and well-built**

### How It Works
**File:** `src/pages/roles/CoachDashboard.jsx`

- Queries 30+ tables on mount to build a complete coach overview
- Shows: team roster summary, upcoming events, recent results, attendance stats
- "ThePlaybook" quick actions section (~lines 1032-1041): Take Attendance, Message Parents, Start Warmup, View Schedule, Team Stats, Game Prep

### What Works
- Good empty states for 0 players, 0 events, 0 teams
- All nav items present and functional (Schedule, Attendance, Chat, Game Prep)
- Coaches CAN create events from their dashboard
- Team-scoped data (roster, attendance) loads correctly
- Inline attendance marking from dashboard (Sprint 4.2 feature)

### No Issues Found
- Coach dashboard is one of the most polished areas of the app

---

## Audit 8: Parent Dashboard

**Result: Functional with good invitation system**

### How It Works
**File:** `src/pages/roles/ParentDashboard.jsx`

- Shows: payment summary, upcoming events, child status cards
- `loadPaymentSummary()` (~lines 454-466) aggregates payment data per child
- Schedule filtered to children's teams — correct scoping
- Priority cards engine surfaces: unpaid fees, unsigned waivers, missing RSVPs, upcoming games

### Invitation System
**File:** `src/lib/invite-utils.js`
**File:** `src/pages/auth/ParentInviteAcceptPage.jsx`

- Full invitation flow: admin creates invite → parent receives email/link → accepts → account created → role granted
- `createInvitation()`, `validateInvitation()`, `acceptInvitation()`, `grantRole()` all present
- Magic link support for passwordless onboarding

### What Works
- Payment summary accurate (pulled from `payments` table)
- Schedule correctly scoped to child's teams
- Priority cards drive parent engagement
- Invitation system is end-to-end functional

---

## Audit 9: Admin Dashboard

**Result: Sophisticated 3-tier system, well-designed**

### How It Works
**File:** `src/pages/dashboard/DashboardPage.jsx`

Three rendering tiers:
1. **Day-Zero Guide** (~lines 57-295): Shown for brand new orgs. Step-by-step setup checklist (create org → add season → create teams → invite coaches → open registration)
2. **Foundation-Ready** (~lines 1332-1350): Org exists but `setup_complete = false`. Shows setup progress with next steps
3. **Full V2 Dashboard** (~lines 1352-1701): Complete dashboard with metrics, charts, action items, quick actions

### Metrics Accuracy
- Registration count: direct query to `registrations` table — accurate
- Payment totals: sum of `payments.amount` where `status = 'paid'` — accurate
- Team count: direct query to `teams` table — accurate
- Active players: query `players` where `status IN ('approved', 'rostered')` — accurate

### Action Items System (~lines 1268-1303)
- Surfaces: pending registrations, overdue payments, unsigned waivers, unassigned players
- Each item links to the relevant page for quick resolution
- Count badges shown in nav

### What Works
- Setup guide correctly hidden after `setup_complete = true`
- Metrics pull from real DB data (not cached/stale)
- Widget grid (drag-and-drop) from Sprint 5.1 functional
- Good visual hierarchy and information density

---

## Audit 10: Email Pipeline & Templates

**Result: Functional pipeline with gaps in coverage**

### How It Works
**File:** `src/lib/email-service.js`

- Central `queueEmail()` function inserts records to `email_notifications` table
- Supabase Edge Functions process the queue and send via configured provider
- `isEmailEnabled()` (~lines 345-364) checks org settings before queuing
- 10 email types defined in the service

### Email Type Status

| Email Type | Status | Triggered From |
|-----------|--------|---------------|
| `registration_confirmation` | ACTIVE | PublicRegistrationPage / RegistrationCartPage on submit |
| `registration_approved` | ACTIVE | RegistrationsPage on approval (but fee array is empty — see Audit 1) |
| `payment_receipt` | ACTIVE | PaymentsPage when admin marks paid |
| `coach_invite` | ACTIVE | CoachesPage when inviting a coach |
| `role_elevation` | ACTIVE | User role changes |
| `blast_announcement` | ACTIVE | BlastsPage when email toggle is on |
| `registration_invite` | ACTIVE | Registration link sharing |
| `team_assignment` | DEFINED BUT UNUSED | Never called from TeamsPage (see Audit 2) |
| `waitlist_spot_available` | DEFINED BUT UNUSED | No waitlist feature implemented |
| `payment_reminder` | UI STUB ONLY | Modal exists in PaymentsPage but send function not wired |

### Issues Found

**HIGH — `team_assignment` email never sent:**
- Template exists, function exists, but no code calls it
- See Audit 2 for full details

**MEDIUM — `payment_reminder` is a non-functional stub:**
- Admin clicks "Send Reminder" → modal appears → appears to succeed
- But no email is actually queued
- Admin has no feedback that the reminder didn't send

**LOW — `waitlist_spot_available` defined but no waitlist feature:**
- Template exists but there's no waitlist management UI
- Dead code — not harmful but misleading

---

## Summary: All Blockers Found

These MUST be fixed before launch:

| # | Blocker | Audit | Severity | Impact |
|---|---------|-------|----------|--------|
| B1 | Fee array missing from approval email — parents see $0 fees | Audit 1 | CRITICAL | Every approved registration email has wrong fee info |
| B2 | Approval happens before fee generation — no transaction safety | Audit 1 | CRITICAL | Failed fee generation leaves player approved with no payment records |
| B3 | Duplicate registration not guarded — same child can register twice | Audit 0 | CRITICAL | Creates duplicate payment records, roster confusion |
| B4 | `players.status` never updated to 'rostered' — dual status divergence | Audit 0.5 | HIGH | Queries checking `players.status` get stale data after team assignment |
| B5 | Team assignment email never sent — parent not notified | Audit 2 | HIGH | Parent has no way to know child was rostered (must check portal) |

## Summary: High-Priority Bugs

Should fix before launch:

| # | Bug | Audit | Impact |
|---|-----|-------|--------|
| H1 | Coach schedule not scoped to their teams | Audit 5 | Coaches see irrelevant events |
| H2 | Payment reminder is a non-functional stub | Audit 4/10 | Admin thinks reminders are sent but nothing happens |
| H3 | RSVP upsert missing conflict handling | Audit 0 | Could throw duplicate key errors on re-RSVP |
| H4 | No multi-team assignment guard at DB level | Audit 2 | Player can be accidentally rostered to two teams |
| H5 | Chat channels not auto-created with teams | Audit 6 | New teams have no chat until admin manually creates one |
| H6 | Coach role detection has no fallback to coaches table | Audit 0 | Edge case: coach without user_roles row can't see coach view |
| H7 | HEAD request in chat may cause 503 errors | Audit 6 | Chat unread badges may fail intermittently |

## Summary: Polish Items

Can ship without, but improve UX:

| # | Item | Audit |
|---|------|-------|
| P1 | Parent payment view not real-time (requires refresh) | Audit 4 |
| P2 | No Platform Admin warning banner | Audit 0 |
| P3 | No ComingSoon gates on stub features | Audit 0 |
| P4 | Season name not shown in registration link modal | Audit 0 |
| P5 | Fee metadata columns not written (early_bird_applied, sibling_discount_applied) | Audit 0.5 |
| P6 | No file/image sharing in chat | Audit 6 |
| P7 | Team capacity not enforced at assignment time | Audit 2 |
| P8 | waitlist_spot_available email template is dead code | Audit 10 |

## Summary: Things That Work Well

| # | Feature | Notes |
|---|---------|-------|
| W1 | Fee calculator | 5 fee types, sibling discounts, early-bird — comprehensive |
| W2 | Registration submission flow | Family + player + registration records created correctly |
| W3 | Coach onboarding pipeline | Profile → coaches → user_roles → team_coaches — all 4 steps intact |
| W4 | Feature flags lockdown | All 16 flags set to false — good for controlled rollout |
| W5 | Admin dashboard 3-tier system | Day-zero → foundation → full dashboard — excellent onboarding |
| W6 | Coach dashboard | 30+ table queries, quick actions, empty states — most polished area |
| W7 | Parent priority cards | Surfaces unpaid fees, unsigned waivers, missing RSVPs — drives engagement |
| W8 | Invitation system | Full flow: create → validate → accept → grant role — end-to-end |
| W9 | Payment system (manual methods) | Works without Stripe — Venmo/Zelle/Cash App supported |
| W10 | Blast announcements with email | Audience targeting + optional email queue — functional |
| W11 | RSVP flow | End-to-end event RSVP with yes/no/maybe — works |
| W12 | Auto-join chat channels | Self-healing parent join mechanism — smart pattern |
| W13 | Admin action items | Surfaces pending regs, overdue payments, unsigned waivers — drives admin action |
| W14 | Email pipeline architecture | Queue-based with Edge Function processing — scalable pattern |

---

*Report generated by Claude Code — lifecycle code audit of volleybrain-admin codebase*
