# WEB_BETA_GAMEPLAN.md — Phased Roadmap to Beta Launch

**Estimated total**: 10–15 Claude Code sessions
**Current status**: 0% complete — starting Phase 1

---

## PHASE 1: Foundation & Infrastructure (2–3 sessions)

### Sprint 1.1: URL Routing
**Why first**: Everything else builds on this. Without routing, no bookmarks, no back/forward, no deep linking.

Tasks:
- [ ] Replace `useState('dashboard')` page switching in MainApp.jsx with react-router-dom routes
- [ ] Map all 25+ page IDs to URL paths:
  - `/dashboard` — admin dashboard
  - `/registrations` — registrations management
  - `/payments` — payments management
  - `/teams` — teams list
  - `/teams/:teamId` — team wall/hub
  - `/coaches` — coaches management
  - `/schedule` — schedule/calendar
  - `/schedule/availability` — coach availability
  - `/attendance` — attendance tracking
  - `/gameprep` — game prep / lineup builder
  - `/gameprep/live` — game day command center
  - `/standings` — team standings
  - `/leaderboards` — season leaderboards
  - `/chats` — messaging
  - `/blasts` — announcements
  - `/notifications` — push notification management
  - `/reports` — reports & analytics
  - `/reports/funnel` — registration funnel
  - `/archives` — season archives
  - `/directory` — org directory
  - `/jerseys` — jersey management
  - `/achievements` — achievements catalog
  - `/settings/seasons` — season management
  - `/settings/templates` — registration form templates
  - `/settings/waivers` — waiver management
  - `/settings/payment-setup` — payment configuration
  - `/settings/organization` — org settings
  - `/settings/data-export` — data export
  - `/settings/subscription` — subscription management
  - `/profile` — my profile
  - `/platform/admin` — platform admin (super admin)
  - `/platform/analytics` — platform analytics
  - `/platform/subscriptions` — platform subscriptions
  - `/parent/dashboard` — parent dashboard
  - `/coach/dashboard` — coach dashboard
  - `/player/dashboard` — player dashboard
- [ ] Keep public routes working: `/register/:orgId/:seasonId`, `/directory`
- [ ] Browser back/forward works correctly
- [ ] Role context persists through navigation (URL param or session)
- [ ] Update all `onNavigate={setPage}` and `setPage('...')` calls to use router navigation

### Sprint 1.2: Loading & Error States
- [ ] Create `SkeletonCard`, `SkeletonTable`, `SkeletonDashboard` components
- [ ] Add skeleton screens to: Dashboard, Teams, Registrations, Schedule, Payments
- [ ] Upgrade Toast system: types (success/error/warning/info), slide animation, auto-dismiss progress, stack multiple
- [ ] Add React Error Boundaries so one broken page doesn't crash the app

### Sprint 1.3: Navigation Polish
- [ ] Breadcrumb component: `Dashboard > Teams > Black Hornets`
- [ ] Cmd/Ctrl+K command palette (search all pages, jump to player/team by name)
- [ ] Quick action buttons on admin dashboard header

---

## PHASE 2: Team Hub Parity (2–3 sessions)

### Sprint 2.1: Comment System
- [ ] Verify `team_post_comments` table exists in Supabase (run verification query from MOBILE_PARITY.md)
- [ ] Build `CommentSection` component with inline text input below each post
- [ ] Comment list: show first 2, "View all X comments" expand button
- [ ] Delete own comments (admin can delete any)
- [ ] Real-time `comment_count` updates on post cards
- [ ] Threaded replies using `parent_comment_id`

### Sprint 2.2: Enhanced Reactions
- [ ] Verify `team_post_reactions` table exists (⚠️ web code uses `post_reactions` — check which is real)
- [ ] Replace simple like toggle with emoji reaction picker popup
- [ ] Reaction options: 👍 ❤️ 🔥 🏐 ⭐ 👏
- [ ] Show reaction summary bar under posts: `👍 3  ❤️ 2  🔥 1`
- [ ] Click own reaction to remove
- [ ] Multiple reaction types per user per post (or one-per-user — match mobile behavior)

### Sprint 2.3: Photo Gallery
- [ ] Set up Supabase Storage bucket for team photos
- [ ] Add image upload to post composer (drag-and-drop + file picker)
- [ ] Build photo gallery grid on Team Hub (4–5 column on desktop)
- [ ] Lightbox viewer: full-screen, prev/next arrows, close button
- [ ] Download/save button on photos

### Sprint 2.4: Cover Photo & Post Polish
- [ ] Upload/change team cover photo (admin/coach only, uses `banner_url` or `cover_image_url` on teams table)
- [ ] Pin posts to top of feed (admin/coach only, uses `is_pinned` on team_posts)
- [ ] Three-dot menu on posts: Edit, Delete, Pin (role-gated)

---

## PHASE 3: Parent & Player UX (2–3 sessions)

### Sprint 3.1: Parent Dashboard Upgrade
- [ ] Build `PriorityCardsEngine` — scan for:
  - Unpaid fees (query payments + registration_fees where status != 'completed')
  - Unsigned waivers (query waiver_signatures, find missing)
  - Events without RSVP (query event_rsvps, find upcoming events with no response)
  - Upcoming games in <48hrs
- [ ] Render as urgency-sorted cards with one-click action buttons
- [ ] "Action Items" sidebar panel (desktop equivalent of mobile bottom sheet)
- [ ] Badge count on nav showing pending items
- [ ] Quick RSVP directly from dashboard cards

### Sprint 3.2: My Stuff Consolidation
- [ ] Create unified `/my-stuff` page with tabs: Profile | Payments | Waivers | Settings | Linked Players
- [ ] Migrate parent-specific content from scattered pages
- [ ] Either build out ParentMessagesPage (81-line stub) or remove from nav
- [ ] Either build out InviteFriendsPage (84-line stub) or remove from nav

### Sprint 3.3: Player Experience
- [ ] Add "My Stats" link to player navigation (PlayerStatsPage exists at `src/pages/stats/PlayerStatsPage.jsx`)
- [ ] Combine Standings + Leaderboards into one Rankings page with tabs
- [ ] Event cards on player dashboard (not just table)

### Sprint 3.4: In-App Registration for Existing Parents
- [ ] Build authenticated registration flow (no redirect to public form)
- [ ] Pre-fill known data from profile + existing player records
- [ ] Season browser showing open seasons for re-registration/sibling registration

---

## PHASE 4: Coach Power Features (1–2 sessions)

### Sprint 4.1: Quick Actions & Blasts
- [ ] Add Quick Action buttons to coach dashboard: "Take Attendance", "Message Parents", "Start Warmup"
- [ ] Allow coaches to send blasts scoped to their team's parents (modify BlastsPage to allow coach role)
- [ ] Event cards with RSVP counts on coach dashboard

### Sprint 4.2: Attendance Shortcut
- [ ] One-click attendance from dashboard for today's/next event
- [ ] Quick-mark roster (show player list with check/x, inline on dashboard)

---

## PHASE 5: Beta Polish (2–3 sessions)

### Sprint 5.1: Dashboard Customization (Carlos's TODO)
- [ ] Install `react-grid-layout` (add to package.json)
- [ ] Widget catalog: Registration Stats, Payment Summary, Upcoming Events, Attendance Trends, Team Health
- [ ] Drag-and-drop grid with add/remove/resize
- [ ] Save layout per user to Supabase (new table: `user_dashboard_layouts`)
- [ ] Default layouts per role

### Sprint 5.2: Visual Polish
- [ ] Page transitions/animations (fade in on route change)
- [ ] Responsive audit: tablet + laptop breakpoints
- [ ] Empty states for all pages (illustration + CTA when no data)
- [ ] Favicon, document title per page, meta tags

### Sprint 5.3: Security & Data Integrity
- [ ] Enable RLS policies on all tables
- [ ] Audit all queries for proper organization_id scoping
- [ ] Rate limiting on public routes
- [ ] Input validation/sanitization on all forms

### Sprint 5.4: Code Cleanup
- [ ] Split SchedulePage.jsx (4,200 lines) into: CalendarView, EventForm, EventDetail, RSVPManager, VolunteerPanel
- [ ] Split OrganizationPage.jsx (2,400 lines) into tabbed sub-components
- [ ] Remove `src_backup/` folder
- [ ] Add `supabase/supabase.exe` to `.gitignore` and remove from tracked files
- [ ] Remove dead imports and unused code

---

## PHASE 6: Deploy & Launch (1 session)

### Sprint 6.1: Deployment
- [ ] Pick app name & purchase domain
- [ ] Clean repo: remove supabase.exe, src_backup, unused files
- [ ] Connect GitHub to Vercel (vercel.json already exists)
- [ ] Set env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [ ] Configure custom domain + SSL
- [ ] Test all routes with Vercel SPA fallback (rewrites in vercel.json)
- [ ] Update public registration links to new domain

### Sprint 6.2: Beta Program
- [ ] Invite 3–5 beta testers (Black Hornets coaches + parents)
- [ ] Set up feedback form or email
- [ ] Monitor Supabase logs
- [ ] Bug fix sprint from feedback

---

## PARKING LOT (Post-Beta)
- Stripe online payment checkout
- Swag store / merchandise
- Tournament bracket builder
- Practice plans / drill library
- Calendar sync (iCal/Google)
- Web push notifications (service worker)
- Message moderation / reporting
- Payment receipts / invoice PDFs
- Refund management
- Mobile app store deployment
