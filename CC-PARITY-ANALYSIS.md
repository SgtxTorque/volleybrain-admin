# CC-PARITY-ANALYSIS.md
# Lynx Web vs. Mobile Feature Parity Report
# Generated: April 2, 2026

---

## EXECUTIVE SUMMARY

Both platforms are mature and production-ready, but they were clearly built with different priorities. The **web app** is the administrative powerhouse — it's where org setup, bulk operations, payments, registrations, and data exports live. The **mobile app** is the engagement and game-day platform — it has quests, journey maps, voice messages, camera integration, and a richer player experience.

Neither platform is a subset of the other. Each has significant features the other lacks entirely.

**Key numbers:**
- Web: ~40+ pages, 5 role dashboards, 16+ admin settings sections
- Mobile: ~117 screens, 5 role dashboards, native device features
- Features only on web: ~18
- Features only on mobile: ~14
- Features on both but at different depth: ~12

---

## SECTION 1: FEATURES ONLY ON WEB (Missing from Mobile)

These features exist on the web app but have no equivalent on the mobile app.

| # | Feature | Web Implementation | Impact |
|---|---------|-------------------|--------|
| 1 | **Email System** | Full email composer with TipTap rich text editor, recipient picker, templates, SMTP settings, email log, preview modal | HIGH — Coaches/admins can't send formatted emails from mobile |
| 2 | **Registration Funnel Analytics** | Dedicated page showing conversion rates: Views → Starts → Submitted → Approved → Paid, with bottleneck detection | MEDIUM — Admin analytics tool |
| 3 | **Registration Template Editor** | Visual editor for custom registration form fields, field type selection, ordering, clone from previous season | MEDIUM — Setup task, may be fine as web-only |
| 4 | **Data Export Page** | Export any data category (players, payments, teams, etc.) as CSV or JSON with season filtering | MEDIUM — Bulk data operations |
| 5 | **Social Cards System** | 18 shareable card templates (8 gameday, 7 results, 3 schedule) with dynamic data, download as image, social share | HIGH — Popular feature for parent/coach sharing |
| 6 | **Venue Manager** | CRUD for venues with address, courts, parking instructions, Google Maps links, rental costs | LOW — Setup task |
| 7 | **Coach Availability Calendar** | Coaches set recurring availability patterns, admins see conflict detection when scheduling | LOW — Planning feature |
| 8 | **Dashboard Widget Customization** | Drag-and-drop react-grid-layout widget grid with 8 self-contained widgets, per-user layout persistence | LOW — Web convenience feature |
| 9 | **Command Palette (Cmd+K)** | Quick-nav keyboard shortcut to jump to any page | LOW — Web-only UX pattern |
| 10 | **Breadcrumb Navigation** | URL-based breadcrumb trail on all pages | LOW — Web-only UX pattern |
| 11 | **Bulk Practice Creation Modal** | Wizard for creating recurring practice events in batch | MEDIUM — Time-saver for coaches |
| 12 | **Bulk Game Creation Modal** | Wizard for creating multiple games at once | MEDIUM — Time-saver for admins |
| 13 | **iCal Export** | Subscribable calendar feed for external calendar apps | LOW — Calendar sync exists natively on mobile |
| 14 | **Subscription Management Page** | View plan details, invoice history (partial) | LOW — Rarely accessed |
| 15 | **Platform Admin Suite** | Org management, user management, audit log, analytics (super admin only) | LOW — Only platform admins use this |
| 16 | **Organization Directory (Public)** | Public searchable org directory with filters | LOW — Discovery feature |
| 17 | **Volunteer Auto-Assign Modal** | Algorithm to auto-assign parents to volunteer roles | LOW — Nice-to-have |
| 18 | **Schedule Poster/Share Modals** | Generate printable season schedule posters | MEDIUM — Useful for coaches |

---

## SECTION 2: FEATURES ONLY ON MOBILE (Missing from Web)

These features exist on the mobile app but have no equivalent on the web app.

| # | Feature | Mobile Implementation | Impact |
|---|---------|----------------------|--------|
| 1 | **Quest System (Daily/Weekly/Team)** | Full quest engine with daily check-ins, stat checks, social actions, attendance quests, team quests, XP rewards | HIGH — Core player engagement loop |
| 2 | **Journey Path (Skill Progression)** | Chapter-based learning map with landmarks, skill modules, video lessons, quizzes, visual progression | HIGH — Unique player development feature |
| 3 | **Skill Modules** | Interactive video training modules with transcripts, quizzes, completion tracking | HIGH — Educational content delivery |
| 4 | **Voice Messages in Chat** | Record and send audio messages, playback with progress bar | MEDIUM — Popular mobile chat feature |
| 5 | **GIF Picker in Chat** | Search and send GIFs in conversations | LOW — Fun engagement feature |
| 6 | **Camera Integration** | Take photos/videos directly from camera for chat, posts, profiles | MEDIUM — Native mobile advantage |
| 7 | **Haptic Feedback** | Touch feedback on ratings, achievements, interactions | LOW — Mobile UX enhancement |
| 8 | **Device Calendar Sync** | Write Lynx events directly to device calendar | MEDIUM — Convenience feature |
| 9 | **Streak Tracking System** | Daily login streaks with fire emoji counter, streak-based quests | MEDIUM — Engagement mechanic |
| 10 | **Notification Inbox (Player)** | Dedicated in-app notification feed with mascot images per type, mark read/unread | MEDIUM — Player engagement |
| 11 | **First-Time Tour/Tutorial** | Overlay tutorial highlighting key features for new users | LOW — Onboarding enhancement |
| 12 | **Family Gallery** | Photo gallery for family/team events with media library integration | LOW — Nice-to-have |
| 13 | **Data Rights Page** | GDPR/CCPA compliance page with data export request and deletion options | LOW — Compliance feature |
| 14 | **Account Claiming** | Orphan record resolution and account merging for pre-registered players | MEDIUM — Onboarding edge case |

---

## SECTION 3: FEATURES ON BOTH — DIFFERENT DEPTH

These features exist on both platforms but are implemented to different levels of completeness.

| Feature | Web Depth | Mobile Depth | Who's Ahead? | Gap Notes |
|---------|-----------|--------------|--------------|-----------|
| **Chat/Messaging** | Text, emoji reactions, threaded replies, pinning, search, team/DM channels | Text, photos, video, audio, GIFs, emoji reactions, replies, pinning, mentions, read receipts, typing indicator | **Mobile** | Web is missing: media attachments (photo/video/audio), GIF picker, mentions, typing indicators, read receipt UI |
| **Achievements/Badges** | Catalog page, 5 categories, 5 rarities, progress tracking, celebration modal, HexBadge/LevelBadge components | Same catalog + quest integration, rarity glow effects, role-specific categories (coach achievements), achievement engine with daily checks | **Mobile** | Mobile ties achievements to quests and journey. Web has achievements but no quest/journey context |
| **Player Evaluations** | Skill ratings stored, spider chart display, evaluation history | Full swipe-through evaluation UI, 9-skill rating blocks (1-5), per-player comments, comparison to previous ratings | **Mobile** | Mobile has the evaluation INPUT flow. Web has the data but no coach-facing evaluation entry screen |
| **Game Day Command** | Full-screen overlay with pre-game/in-game/post-game modes, live scoring, stat entry, lineup panel | 4-page workflow (prep → live match → end set → post-game), formation picker, substitution interface, court visualization | **Roughly Even** | Both are comprehensive. Mobile has slightly better UX for live use (portrait/landscape, haptics) |
| **Lineup Builder** | AdvancedLineupBuilder (1,257 lines), multi-formation, drag-drop, per-set, libero, rotation vis | lineup-builder.tsx (58KB), court visualization, drag-drop, formation presets, libero, save/load | **Roughly Even** | Both are full-featured. Web uses HTML5 drag-drop, mobile uses gesture handlers |
| **Registrations** | Admin: full approval workflow, bulk ops, funnel analytics. Parent: public multi-child form | Admin: hub with tabs (new/approved/waitlisted/denied), approve/deny. Parent: registration flow with waiver signing | **Web** | Web has funnel analytics, bulk operations, template editor. Mobile has solid core flow but fewer admin tools |
| **Payments** | Admin: zone classification, bulk reminder, backfill fees, mark paid. Parent: Stripe + manual methods | Admin: family grouping, mark paid, payment plans. Parent: view fees, report payment with proof upload | **Web** | Web has more admin power tools (zones, bulk blast). Mobile has payment plan creation and receipt upload |
| **Announcements** | Multi-target blasts, read receipts, scheduled sends, 10 notification types, CSV export | Blast composer with targeting, priority levels, email queueing, blast history with delivery tracking | **Roughly Even** | Both are solid. Web has scheduled sends and more notification types. Mobile has better history/tracking UI |
| **Team Wall** | 3-column layout (feed, chat, roster), posts, comments, reactions, photo gallery, shoutouts, challenges | Posts, comments, reactions, achievements tab, stats tab, real-time updates | **Web** | Web has richer layout with chat + roster alongside feed. Mobile is simpler but real-time |
| **Standings** | Full standings page with W/L/T, points, differentials, multiple stat columns | League table with wins, losses, win %, PF, PA, streak | **Roughly Even** | Both functional, web has more stat columns |
| **Leaderboards** | Season leaderboards across 8+ stat categories | Engagement leaderboard (XP-focused) with level, badges, streak | **Different focus** | Web: game stats leaderboard. Mobile: XP/engagement leaderboard. Neither has both |
| **Reports** | 11 report types, multi-filter, column picker, CSV/PDF/email export, saved presets | Reports tab with stats summaries, season progress, season reports | **Web** | Web's reporting is significantly more powerful. Mobile is basic overview only |

---

## SECTION 4: DATABASE/TABLE DIFFERENCES

The web and mobile apps share the same Supabase backend but query different tables in some cases.

### Tables queried by Mobile but NOT Web:
- `quests`, `quest_completions`, `weekly_quests`, `team_quests` — Quest system
- `journey_chapters`, `journey_nodes`, `journey_completions` — Journey path
- `streak_tracking` — Streak system
- `player_notifications` — Player engagement notifications
- `users_xp` — XP tracking (web uses `xp_ledger` directly)
- `challenge_progress` — Challenge progress tracking
- `user_achievements` — Role-based achievements (coach, admin)

### Tables queried by Web but NOT Mobile:
- `email_notifications`, `email_logs` — Email system
- `notification_templates` — Push notification template management
- `admin_notifications` — Admin notification dashboard
- `registration_custom_fields` — Registration template editor
- `volunteer_blasts` — Volunteer notification system
- `platform_subscriptions`, `platform_invoices` — Platform admin

### Tables both query but with different column usage:
- `chat_messages` — Mobile uses attachment fields (file_url, mime_type, duration_seconds). Web doesn't use attachment columns
- `schedule_events` — Web uses bulk creation fields. Mobile uses calendar sync fields
- `players` — Mobile uses player_pin, player_account_enabled for player portal. Web queries these but doesn't fully utilize them

---

## SECTION 5: ROLE EXPERIENCE COMPARISON

### Admin Experience
| Capability | Web | Mobile |
|-----------|-----|--------|
| Dashboard with KPIs | Full widgets + customizable grid | Snapshot cards |
| Team CRUD | Full (create, edit, roster, coaches) | Basic (view, assign) |
| Registration approval | Bulk approve/deny, funnel analytics | Individual approve/deny |
| Payment management | Zone classification, bulk reminders, backfill | Family grouping, mark paid |
| Email composition | Rich text editor, templates, SMTP | Not available |
| Data export | 10 categories, CSV/JSON | Not available |
| Reports | 11 types with filters | Basic summaries |
| Org settings | 16 expandable sections | Basic org settings |
| Season management | Full CRUD with fee structure | Basic view |

**Verdict:** Web is the admin's primary tool. Mobile is for quick checks and approvals on the go.

### Coach Experience
| Capability | Web | Mobile |
|-----------|-----|--------|
| Dashboard | Team stats, roster, schedule | Upcoming games, quick actions |
| Game prep | Lineup builder, game day command | Game prep wizard, command center |
| Live scoring | Full stat entry per player | Full stat entry per player |
| Player evaluations | View ratings, spider chart | Full evaluation entry (swipe-through) |
| Challenges | Create, view, manage | Create, view, manage, dashboard |
| Shoutouts | Give via modal | Give via modal + award from player card |
| Attendance | Quick-mark roster | RSVP tracking |
| Announcements | Multi-target blast | Blast composer with history |
| Schedule | Multi-view calendar | Weekly calendar |
| Availability | Set recurring availability | Set availability |

**Verdict:** Both are strong. Web is better for planning. Mobile is better for game day and evaluations.

### Parent Experience
| Capability | Web | Mobile |
|-----------|-----|--------|
| Dashboard | Priority cards, kid cards, action items | Kid cards, schedules, payments |
| Schedule | Full calendar views | Calendar with RSVP |
| RSVP | Quick-RSVP modal | Inline RSVP |
| Payments | Stripe + manual, history | View fees, report payment, upload proof |
| Waivers | View signed, sign from registration | Sign during registration |
| Player profile | 5-tab detail (reg, uniform, medical, waivers, history) | Child detail with stats, achievements, evaluations |
| Chat | Team chats, DMs | Team chats, DMs, voice messages, media |
| Invite friends | Referral link, tier tracking | QR code, share link, invite parents |
| My Stuff | 5-tab self-service (profile, payments, waivers, settings, linked players) | Profile, settings |
| Registration | Public form | Registration flow with waiver signing |

**Verdict:** Web has deeper admin-like parent tools (My Stuff, 5-tab profile). Mobile has better communication (voice, media, QR invites).

### Player Experience
| Capability | Web | Mobile |
|-----------|-----|--------|
| Dashboard | Badges, challenges, stats, skills, shoutouts | Challenges, quests, skill ratings, achievements, streaks |
| Achievements | Catalog with progress tracking | Catalog + quest integration + rarity glow |
| Quests | Not available | Daily/weekly/team quests with XP rewards |
| Journey | Not available | Chapter-based skill progression map |
| Skill modules | Not available | Interactive video training with quizzes |
| Stats | Season totals, per-game, trend charts | Season summary, personal bests, game history, OVR |
| Challenges | View, opt-in, progress | View, opt-in, progress, detail modal |
| Chat | Team chat, DMs | Team chat, DMs, voice, GIFs, media |
| Streaks | Not available | Daily login streak counter |
| Notifications | Not available | Engagement notification inbox with mascot images |

**Verdict:** Mobile is significantly richer for players. Quests, Journey, Skill Modules, and Streaks are major engagement features that don't exist on web.

---

## SECTION 6: PRIORITY RECOMMENDATIONS

### HIGH PRIORITY — Add to Web

1. **Player Evaluation Entry Screen** — Coaches currently can only VIEW ratings on web, not ENTER them. The mobile swipe-through evaluation UI is the only way to rate players. Add a web-based evaluation form so coaches at their desks can rate players.

2. **Chat Media Support** — Web chat is text-only. Add photo/image sharing at minimum. Voice and GIF can wait, but images are table stakes for a modern chat.

3. **Social Cards for Mobile** — The 18 social card templates are web-only. Parents and coaches on mobile can't generate game day or results cards to share on social media. This is a high-engagement feature that should work on both platforms.

### MEDIUM PRIORITY — Add to Web

4. **Quest System (or simplified version)** — The quest/daily mission system is a major engagement driver for players on mobile. Even a simplified version on web (daily check-in, weekly goals) would help retention.

5. **Notification Inbox for Players** — Players on web have no dedicated notification feed. Add a notification center.

6. **Streak Tracking Display** — Show streak data on web player dashboard (data already exists in DB).

### MEDIUM PRIORITY — Add to Mobile

7. **Email Composer** — Even a simplified version so coaches can send formatted messages without switching to web.

8. **Registration Funnel Analytics** — Surface basic conversion metrics for admins on mobile.

9. **Bulk Event Creation** — Allow coaches to create recurring practices from mobile instead of requiring web.

10. **Data Export** — At minimum, allow CSV export of roster/contacts from mobile.

### LOW PRIORITY — Nice to Have

11. **Journey/Skill Modules on Web** — Player training content could render on web for larger-screen viewing.
12. **Dashboard Widget Customization on Mobile** — Not critical, mobile has different layout needs.
13. **Venue Manager on Mobile** — Setup task, fine to keep web-only.
14. **Platform Admin on Mobile** — Super admin tool, fine to keep web-only.

---

## SECTION 7: SHARED BACKEND NOTES

Both apps share the same Supabase project (`uqpjvbiuokwpldjvxiby`). Important considerations:

- **Table naming differences**: Mobile uses `events` alias in some places where web uses `schedule_events`. Both reference the same table but some code paths may differ.
- **Column usage gaps**: Mobile writes to columns (like chat attachment fields) that web never reads. If a feature is added to web, verify the columns exist and match mobile's expectations.
- **RLS policies**: Web has undergone an RLS audit (Phase 5 Sprint 5.3). Verify mobile respects the same policies.
- **Real-time subscriptions**: Mobile has extensive real-time listeners. Web has some but fewer. Adding features to web may require adding subscriptions.

---

*This report was generated by analyzing both codebases in full. File counts, feature descriptions, and table references are based on reading actual source code, not just file names.*
