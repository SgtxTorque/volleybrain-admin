# PARITY LOG — Web / Mobile Sync Notes

Track web-only changes that may need mobile counterparts.
Shared Supabase project: uqpjvbiuokwpldjvxiby

---

### April 10, 2026 (Feature Lockdown)
- WEB: Feature flag system added (src/config/feature-flags.js) — 14 advanced features hidden from nav, 3 kept visible (coachAvailability, jerseys, registrationFunnel)
- WEB: Locked features: gamePrep, standings, leaderboards, achievements, playerStats, playerPass, playerDashboard, engagement, drillLibrary, coachReflection, archives, dataExport, subscription, teamWall
- WEB: Kept visible (not core but useful now): coachAvailability, jerseys, registrationFunnel
- WEB: Core features remain: dashboard, teams, coaches, registrations, payments, schedule, attendance, chat, blasts, reports, settings, setup, roster, programs, notifications
- WEB: Platform Admin mode now has amber banner + hidden on mobile — No mobile action needed
- NOTE: Mobile should consider similar feature lockdown approach — hide advanced features until core basics are solid

### April 10, 2026 (Stop the Bleeding)
- WEB: Duplicate registration pre-check added to RegistrationCartPage and PublicRegistrationPage → Mobile registration flows should also check for existing registrations before insert
- WEB: RSVP changed from insert to upsert on AttendancePage → Mobile RSVP flows should verify they use upsert pattern
- WEB: Reports "All Seasons" mode now loads data → No mobile action needed (mobile has different reports architecture)

### April 11, 2026 (Lifecycle Blockers — Round 1)
- WEB: Coach role detection now uses user_roles as fallback when coaches table query fails → Mobile should verify coach detection uses equivalent fallback
- WEB: Team creation from ProgramPage now performs real Supabase INSERT → Mobile season-setup-wizard already fixed in separate spec
- WEB: Added PASSWORD_RECOVERY handler + /reset-password page → Mobile has its own auth flow, no action needed
- WEB: SuccessScreen CTA now links to /invite/parent/:code → Mobile registration has different post-registration flow, no action needed

### April 11, 2026 (Coach Onboarding Pipeline)
- WEB: Added /join/coach/:orgId route with email lookup → redirects to CoachInviteAcceptPage → Mobile has its own coach invite flow, no action needed
- WEB: Coach invite email no longer sends if coaches insert fails → Mobile coach invite may have same issue, should verify
- WEB: SetupWizard invite code now checks coaches table → Mobile onboarding wizard should add same check if it has an invite code step
- WEB: Google/Apple OAuth buttons hidden via feature flags → Mobile has its own auth UI, no action needed

### April 11, 2026 (Lifecycle Pipeline Fixes)
- WEB: Approval email now includes correct fee total (was passing undefined result.fees, now passes result.totalAmount) → Mobile should verify its approval notification includes fee data
- WEB: Fee generation now happens BEFORE status update to 'approved' — if fees fail, approval is blocked → Mobile approval flow should use same order (fees first, then status)
- WEB: players.status updated to 'rostered' on team assignment (was only updating registrations.status) → Mobile should verify it updates BOTH players.status AND registrations.status on team assignment
- WEB: Team assignment email now sent to parent via EmailService.sendTeamAssignment() → Mobile should verify it sends push notification on team assignment
- WEB: Coach schedule view now scoped to assigned teams only (was showing all org events) → Mobile coach schedule should verify same team scoping
- WEB: Payment reminder button now actually sends email via EmailService (was UI stub only) → Mobile payment reminders should verify email/push delivery
- WEB: All team creation paths now auto-create chat channels (team chat + admin membership) → Mobile team creation should verify channel creation

### April 11, 2026 (Coach Invite 400 Fix)
- **CRITICAL — SHARED BACKEND:** Removed `role` field from coaches table INSERT in InviteCoachModal — the `coaches` table has NO `role` column. Role belongs on `team_coaches.role`. → **Mobile MUST verify it does NOT write `role` to the coaches table. Will cause 400 error.**
- WEB: RegLinkModal extracted to shared component with season dropdown → Mobile has its own sharing flow, no action needed

### April 11, 2026 (Coach Role Value Fix)
- **CRITICAL — SHARED BACKEND:** The `user_roles` table has a CHECK constraint: `role IN ('league_admin', 'head_coach', 'assistant_coach', 'team_manager', 'parent', 'player')`. The value `'coach'` is NOT valid and will silently fail on insert.
- WEB: CoachInviteAcceptPage now maps team_coaches.role to valid user_roles values: head→head_coach, assistant→assistant_coach, manager→team_manager, volunteer→assistant_coach → **Mobile MUST use the same role mapping. Any insert/upsert to user_roles with role='coach' will fail.**
- WEB: InviteCoachModal handleRoleElevation now maps role before calling grantRole() → Mobile should verify same mapping
- WEB: MainApp.jsx coach role detection updated from `r.role === 'coach'` to `['head_coach', 'assistant_coach', 'team_manager'].includes(r.role)` → **Mobile MUST update coach detection to check for these three values, not 'coach'**

### April 12, 2026 (Coach Multi-Org Fix)
- WEB: CoachInviteAcceptPage now resolves orgId from 3 fallback sources when coaches.season_id is null: (1) invite._season.organization_id, (2) invitations.organization_id, (3) team_coaches→teams→seasons→organizations chain → Mobile coach invite acceptance should use same fallback pattern
- WEB: localStorage.lynx_active_view cleared on invite acceptance before redirect → Mobile should clear any stored view/role preference when user accepts invite to new org
- WEB: InviteCoachModal auto-selects most recent active/upcoming season when admin hasn't selected one (prevents coaches.season_id = null) → Mobile invite flow should apply same auto-select

### April 12, 2026 (Final Blockers)
- WEB: Registration form bottom padding increased (pb-4→pb-40 on PublicRegistrationPage, pb-32→pb-48 on RegistrationCartPage) for waiver scroll → Mobile registration form should verify waivers are scrollable on all screen sizes
- WEB: Admin Communication sidebar unlocked — removed 'communication' from ADMIN_NAV_PREREQS (was gated behind setup_complete) → Mobile admin nav should verify Communication is accessible without setup_complete
- WEB: Payment installments now use remainder-aware rounding (Math.floor + remainder on first installment) → Mobile fee display should verify same calculation if it has its own fee calculator. If mobile reads from payments table, web handles the math.
- WEB: Optimistic UI updates added to 11 mutation handlers (registrations, teams, payments) — local state updates immediately before background refetch → Mobile uses React Native state — verify similar optimistic pattern for approve/pay/roster actions
- WEB: Registration draft storage moved from localStorage to sessionStorage (prevents cross-family data exposure) → Mobile uses AsyncStorage — verify draft persistence is scoped per user/session, not globally

### April 12, 2026 (Quick Fixes)
- WEB: Top nav communication gate removed (chats/blasts/notifications no longer require orgSetup in MainApp.jsx TOP_NAV_PREREQS) → Mobile admin nav should verify same
- WEB: Registration form padding reduced (pb-40 → pb-24 on PublicRegistrationPage, pb-48 → pb-36 on RegistrationCartPage) → Mobile registration form: verify scroll behavior
- WEB: Installment rounding migration script created (scripts/fix-installment-rounding.mjs) → Mobile: verify fee display shows corrected amounts after migration runs

### April 12, 2026 (Parent Auth)
- WEB: Registration form now creates Supabase auth account (signUp) + profile + user_role during submission → Mobile registration should implement the same pattern (currently creates auth account separately)
- WEB: Login page now checks families table (parents) AND coaches table (coaches) on failed login, offers account recovery → Mobile login should implement the same fallback for both roles
- WEB: Success screen shows different states based on auth creation result → Mobile success screen should match

---

## INFRASTRUCTURE CHANGES (April 11-12, 2026)

### Email Pipeline
- Resend domain `thelynxapp.com` verified — DKIM, SPF, MX all green
- DKIM TXT record added to Vercel DNS: `resend._domainkey`
- Email cron `process-email-queue` changed from every 2 minutes to every 30 seconds
- All emails send from `noreply@mail.thelynxapp.com` via Resend API
- Edge Function `send-payment-reminder` processes queue (despite the name, handles ALL email types)

### Active Email Templates
| Template | Triggered By | Status |
|---|---|---|
| registration_confirmation | Registration submit | ACTIVE |
| registration_approved | Admin approval | ACTIVE |
| coach_invite | Admin coach invite | ACTIVE |
| team_assignment | Admin roster assignment | ACTIVE (newly wired) |
| payment_receipt | Admin marks paid | ACTIVE |
| payment_reminder | Admin sends reminder | ACTIVE (newly wired) |
| blast_announcement | Admin sends blast with email toggle | ACTIVE |
| role_elevation | Existing user role add | ACTIVE |
| registration_invite | Admin shares registration link via email | ACTIVE |
| waitlist_spot_available | Waitlist movement | DEFINED BUT UNUSED |

---

### April 12, 2026 (Lifecycle Tracker)
- WEB: Admin Lifecycle Tracker added to ProgramPage as "Season Setup" tab — 7 data-driven steps replacing SeasonStepper → Mobile should consider equivalent for season management screens
- WEB: Coach Lifecycle Tracker added to CoachDashboard above tabs — 5 onboarding steps → Mobile coach view should implement similar first-login guidance
- WEB: Smart return navigation (from=tracker breadcrumb) on teams, staff, schedule, registrations, announcements pages → Mobile deep linking may want similar "return to setup" pattern
- WEB: SeasonStepper component no longer rendered on ProgramPage (component file preserved) → No mobile impact

---

## CRITICAL MOBILE ACTIONS (Do These First)

1. **Search for `role: 'coach'` or `role: "coach"` in any user_roles insert/upsert** — change to `head_coach`, `assistant_coach`, or `team_manager` based on the coach's team_coaches.role value
2. **Search for coach role detection** — change any `role === 'coach'` check to `['head_coach', 'assistant_coach', 'team_manager'].includes(role)`
3. **Search for coaches table inserts that include a `role` field** — remove it, the column doesn't exist
