# PHASE RESULTS: Baton Pass — Cross-Role Notifications
**Date:** April 12, 2026
**Branch:** main
**Build:** PASS (12.05s, exit code 1 is chunk size warning only)

## Phase 1: Baton Pass Wiring

### BP1: Registration Submitted → Admin Bell — PASS
**Commit:** c342d84
**Table:** admin_notifications
**Variables used:** `allChildren` (array of child names), `sharedInfo.parent1_name`, `sharedInfo.parent1_email`, `season?.name`, `organization?.id`, `season?.id` (PublicRegistrationPage); `children` (array), `sharedInfo.parent1_name`, `parentEmail`, `selectedPrograms`, `organization?.id` (RegistrationCartPage)

### BP2: Registration Approved → Parent Push — PASS
**Commit:** c1eca2e
**Table:** notifications
**Parent ID source:** `player.parent_account_id` field on the players table (included in existing `select('*')` query)
**Bulk approval handled:** YES — both `updateStatus()` (single) and `approvePlayers()` (bulk) insert notifications

### BP3: Schedule Event → Parent Push — PASS
**Commit:** d807b42
**Table:** notifications
**Parent lookup:** `team_players` → `players(parent_account_id)` join, filtered by `newEvent.team_id`
**Events handled:** single event (createEvent function)

### BP4: RSVP → Coach Push — PASS
**Commit:** 7fa56b1
**Table:** notifications
**RSVP source file:** `src/components/parent/ActionItemsSidebar.jsx` (QuickRsvpModal component)
**Coach lookup:** `team_coaches` → `coaches(user_id)` join, filtered by event's team_id; also queries `event_rsvps` for count summary

### BP5: Registration → Admin Email — PASS
**Commit:** c5221c3
**Table:** email_notifications
**Template type used:** `blast_announcement` (fallback — `registration_new` is not in Edge Function's legacyTemplates map)
**Admin email source:** `organization.contact_email` from organization record

## Phase 2: Bell Extension

### All-role bell — PASS
**Commit:** fe64d76
**Admin source:** admin_notifications (unchanged)
**Coach/Parent source:** notifications (new)
**Realtime:** NO — kept 30s polling (consistent with existing pattern)
**Bell visibility:** all roles — admin-only gate removed from LynxSidebar and GatedTopBar
**New types rendered:** registration_approved, rsvp_update, schedule_change, team_assignment, game_reminder, payment_due

## Issues Encountered
- **Column name differences:** `admin_notifications` uses `is_read`/`message` while `notifications` uses `read`/`body`. Solved by mapping in loadNotifications: `.map(n => ({ ...n, is_read: n.read, message: n.body }))`
- **Template type mismatch:** `registration_new` is not recognized by the `send-payment-reminder` Edge Function. Used `blast_announcement` template which accepts `heading`/`body`/`html_body` data fields
- **Build exit code 1:** Vite build returns exit code 1 due to chunk size warnings (>500kB), but build succeeds — confirmed by "built in X.XXs" in stdout

## Testing Notes
To test BP1 (registration → admin):
1. Open incognito, register a new player via /register/:orgId
2. Log in as admin — bell should show "New Registration" notification

To test BP2 (approval → parent):
1. Log in as admin, approve a registration on RegistrationsPage
2. Log in as parent — bell should show "Welcome to {team}!" notification

To test BP3 (schedule → parents):
1. Log in as admin, create a schedule event for a team with rostered players
2. Log in as parent of a player on that team — bell should show "New Event" notification

To test BP4 (RSVP → coach):
1. Log in as parent, RSVP for an event via QuickRsvpModal
2. Log in as coach — bell should show "RSVP Update" notification with count summary

To test bell for all roles:
1. Log in as coach — bell icon visible, click opens dropdown, shows notifications from `notifications` table
2. Log in as parent — bell icon visible, click opens dropdown, shows notifications from `notifications` table
3. Log in as admin — bell navigates to /notifications management page (existing behavior preserved)
4. Click notification — mark as read, badge count decreases
