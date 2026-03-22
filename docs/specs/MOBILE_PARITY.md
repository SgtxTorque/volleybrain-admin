# MOBILE_PARITY.md — What the Mobile App Has That Web Needs

This document describes features built in the mobile app (volleybrain-mobile3) that the web admin portal should match or adapt for desktop. The goal is ONE unified experience across both platforms, not two different apps.

**Rule**: Both apps share the same Supabase backend. The UX can differ (mobile uses bottom tabs, web uses horizontal nav + dropdowns), but the data model and feature set should be consistent.

---

## PARENT UX (Mobile has, Web needs)

### Bottom Nav Structure (Mobile)
```
Home | Schedule | Chat | Team | My Stuff
```

### Home Screen — Smart Dashboard
- **Dynamic Priority Cards**: Auto-generated based on:
  - Unpaid balance → "Payment Due: $150" card with Pay button
  - Unsigned waiver → "Waiver Needed" card with Sign button  
  - Event without RSVP → "RSVP for Saturday Practice" card with Yes/No
  - Upcoming game in <48hrs → "Game Day Tomorrow" card with details
- Cards sorted by urgency (payment due > waiver > RSVP > info)
- One-click action buttons on each card (no navigation required)

### "Needs Attention" System
- Animated button on home screen
- Opens bottom sheet with all pending action items
- Badge count showing number of items
- **Web equivalent**: Persistent sidebar panel or top banner with count badge

### Team Selector Pills
- Horizontal swipeable pills on home when parent has kids on multiple teams
- Tap to filter dashboard content by team
- **Web equivalent**: Tab bar or dropdown (swipe not needed on desktop)

### My Stuff Tab (Consolidated)
Everything in one place:
- Profile editing
- Payment history & balance
- Waiver status & signing
- Settings (notifications, preferences)
- Linked players list
- **Web currently**: These are scattered across Payments nav, separate profile page, etc.

---

## COACH UX (Mobile has, Web needs)

### Home Screen
- **Event Carousel**: Horizontal scrollable cards showing next 5 events
  - Each card: date, type icon, time, RSVP count
  - Tap to see event detail
  - **Web equivalent**: Event cards row on coach dashboard (not table)

### Quick Actions
- "Take Attendance" → Opens attendance for current/next event
- "Start Warmup" → Timer/countdown
- "Message Parents" → Opens team chat
- **Web has**: No quick actions on coach dashboard. Must navigate through nav dropdowns.

### Blast Messaging
- Coaches can send blasts to their team's parents
- **Web currently**: Blasts are admin-only. Coaches can't send announcements.

### Game Prep Workflow
- Lineup builder (both have this)
- Rotation planner (both have this)
- **Game Day Command Center**: Live stat tracking — both have this

---

## ADMIN UX (Mobile has, Web needs)

### Org Health Banner
- Always-visible stats bar: Total Players | Teams | Coaches | Registration %
- Shows on admin home screen persistently
- **Web**: Only shows metrics on dashboard cards, not always visible

### Needs Attention Section
- Always visible on admin home (not hidden behind a button)
- Shows: Pending registrations count, overdue payments, unsigned waivers
- **Web**: Dashboard shows these in separate card widgets, not consolidated

### Quick Actions
- Regs | Payments | Invite | Blast — one-tap access
- **Web**: 2 clicks minimum (dropdown → page)

---

## TEAM HUB (All Roles — Mobile has, Web partially has)

### Cover Photo Hero
- Full-width team photo at top of Team Hub
- Upload/change by admin or coach
- Gradient overlay for text readability
- **Web**: Has `banner_url` support and basic display, but upload UX is minimal

### Feed Tab — Social Posts
| Feature | Mobile | Web |
|---------|--------|-----|
| Post composer ("What's on your mind?") | ✅ | ✅ |
| Post types (announcement, photo, shoutout, game recap) | ✅ | ✅ |
| Full-width post cards | ✅ | ✅ |
| Like/react to posts | ✅ Multi-emoji | 🟡 Like only |
| Long-press emoji picker (👍❤️🔥🏐⭐👏) | ✅ | ❌ |
| Reaction summary bar (👍3 ❤️2) | ✅ | ❌ |
| Inline comments | ✅ Full system | ❌ Count only |
| Comment expand/collapse (2+ threshold) | ✅ | ❌ |
| Delete own comments | ✅ Role-gated | ❌ |
| Pin posts | ✅ | ❌ |
| Three-dot menu (edit, delete, pin) | ✅ Role-gated | ❌ |
| Share via native sheet | ✅ | ❌ |

### Photo Gallery
- 3-column grid on mobile
- Full-screen viewer with swipe
- Save/share photos
- **Web**: No photo gallery at all

### Roster Tab
- Both have roster display ✅

### Schedule Tab
- Both have team-filtered schedule ✅

### Achievements Tab
- Player achievement badges
- **Web has** AchievementsCatalogPage but not embedded in Team Hub

### Stats Tab
- Team/player statistics
- **Web has** PlayerStatsPage but not embedded in Team Hub

### Swipe Navigation
- Swipe left/right between teams
- **Web**: N/A (not needed on desktop, use dropdown/tabs instead)

---

## DATABASE TABLES MOBILE USES THAT WEB SHOULD VERIFY

These tables were created during mobile UX redesign sessions. Verify they exist before building web features:

```sql
-- Run in Supabase SQL Editor to verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'team_post_comments',
  'team_post_reactions',
  'team_posts',
  'team_documents',
  'team_milestones',
  'post_reactions'
)
ORDER BY table_name;
```

Also verify these columns exist:
```sql
-- Check team_posts columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'team_posts' AND column_name IN ('share_count', 'comment_count', 'reaction_count');

-- Check teams columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'teams' AND column_name IN ('cover_image_url', 'banner_url', 'motto', 'logo_url');

-- Check organizations columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'organizations' AND column_name = 'banner_url';
```

---

## UX PHILOSOPHY — ONE APP, TWO SURFACES

The mobile app is optimized for:
- Quick actions (one thumb, one hand)
- Glanceable info (what do I need to know RIGHT NOW?)
- Push notifications
- On-the-go use at practices/games

The web app should be optimized for:
- **Power operations** (bulk approve, data tables, complex forms)
- **Deep analysis** (reports, charts, funnel analysis, data export)
- **Complex workflows** (season setup, registration templates, organization settings)
- **Desktop interactions** (split-panel chat, calendar views, drag-and-drop)

**Don't make the web a pixel-perfect copy of mobile.** Leverage what desktop does better. But the features should exist on both — just adapted for the surface.
