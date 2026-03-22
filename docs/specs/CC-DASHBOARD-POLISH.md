# CC-DASHBOARD-POLISH — Dashboard Visual Polish & Mobile Parity

**Spec Author:** Claude Opus 4.6
**Date:** March 4, 2026
**Branch:** `feat/desktop-dashboard-redesign` (continue on existing branch)
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-PAGES-REDESIGN (all 11 phases completed)
**Mobile Reference Repo:** `SgtxTorque/volleybrain-mobile3`

---

## CONTEXT

CC-PAGES-REDESIGN completed all 11 phases successfully. The structure is in place but Carlos reviewed on a 27" 1440p monitor and identified significant visual and functional issues across Coach, Parent, and all dashboards. This spec addresses those issues.

**Key themes in this feedback:**
1. Text is too small across the entire app at 1440p — bump all text up 2–4 sizes
2. Coach dashboard layout needs major rework — hero card missing elements, new cards needed, roster cards too small
3. Parent dashboard needs a near-complete redo referencing the mobile app's parent-scroll components
4. All dashboards need the welcome banner/header treatment from the mobile app
5. Sidebar nav text is too small
6. Mobile app (volleybrain-mobile3) is the design reference for tone, voice, card treatments, and progressive disclosure patterns

---

## RULES (same as CC-PAGES-REDESIGN — non-negotiable)

1. **Read every file before modifying it** — no assumptions about file contents
2. **Archive before replace** — copy any file being fully replaced to `src/_archive/` with timestamp suffix
3. **Never delete files** — only add or modify
4. **Preserve all Supabase data fetching** — extract and reuse, never remove queries
5. **Schema-first** — check existing queries before touching data logic
6. **No file over 500 lines** — split into sub-components
7. **Commit after each phase** with descriptive message
8. **TSC verify** (`npx tsc --noEmit`) after each phase
9. **Test all four roles** render without console errors after each phase
10. **Tailwind only** — use Lynx color tokens
11. **Do not remove existing card components or features** — tweak, resize, rearrange, add
12. **Reference the mobile app** — clone or read `SgtxTorque/volleybrain-mobile3` for component patterns, tone/voice copy, and card treatments

---

## PHASE 0: Clone Mobile Repo + Archive

**Goal:** Get the mobile repo available for reference, and archive current state.

```bash
# Clone mobile repo for reference (read-only — do NOT modify)
git clone https://github.com/SgtxTorque/volleybrain-mobile3.git /tmp/mobile-ref

# Archive current state of files we'll modify
mkdir -p src/_archive/dashboard-polish-$(date +%Y%m%d)
cp src/components/coach/CoachGameDayHeroV2.jsx src/_archive/dashboard-polish-$(date +%Y%m%d)/
cp src/components/coach/CoachNotificationsCard.jsx src/_archive/dashboard-polish-$(date +%Y%m%d)/
cp src/components/coach/CoachRosterCard.jsx src/_archive/dashboard-polish-$(date +%Y%m%d)/
cp src/components/coach/GameDayJourneyCard.jsx src/_archive/dashboard-polish-$(date +%Y%m%d)/
cp src/pages/roles/ParentDashboard.jsx src/_archive/dashboard-polish-$(date +%Y%m%d)/
cp src/components/layout/LynxSidebar.jsx src/_archive/dashboard-polish-$(date +%Y%m%d)/
# Archive the coach dashboard layout file (find it first)
grep -r "CoachGameDayHero" src/ --include="*.jsx" -l
# Copy that file too
```

**Read the mobile app's key reference files:**
```bash
# Coach home / welcome patterns
find /tmp/mobile-ref/src -name "*CoachHome*" -o -name "*coach-home*" -o -name "*WelcomeBanner*" -o -name "*welcome*" | head -20
cat /tmp/mobile-ref/src/components/coach/*.jsx 2>/dev/null || cat /tmp/mobile-ref/src/components/coach/*.tsx 2>/dev/null

# Parent scroll components (Carlos specifically referenced this)
find /tmp/mobile-ref/src -path "*parent-scroll*" -o -path "*parent_scroll*" -o -path "*ParentScroll*" | head -20
ls /tmp/mobile-ref/src/components/parent-scroll/ 2>/dev/null || ls /tmp/mobile-ref/src/components/parentScroll/ 2>/dev/null
# Read ALL files in that folder — this is the design reference for parent dashboard

# Player card treatments
find /tmp/mobile-ref/src -name "*PlayerCard*" -o -name "*TradingCard*" | head -10

# Welcome/greeting patterns
grep -r "Ready to kill" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" -l
grep -r "Welcome" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" -l

# Action items / "You Got Stuff To Do" patterns
grep -r "caught up" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" -l
grep -r "uh oh" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" -l
```

Read every file found. These are the source of truth for tone, voice, card patterns, and progressive disclosure.

**Commit:** `git add -A && git commit -m "phase 0: archive + clone mobile ref for dashboard polish"`

---

## PHASE 1: Global Text Size Fix + Sidebar Nav Text

**Goal:** All text across the app is too small on 1440p. Bump up 2–4 Tailwind size steps globally. Fix sidebar nav text.

### Step 1.1: Audit current text sizes

```bash
# Find the most common text size classes used
grep -roh "text-\[.*\]" src/components/ src/pages/ --include="*.jsx" | sort | uniq -c | sort -rn | head -30
grep -roh "text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl\|text-3xl" src/components/ src/pages/ --include="*.jsx" | sort | uniq -c | sort -rn
```

### Step 1.2: Define the size bump mapping

Apply these minimum sizes across all dashboard and page components:

| Current | New Minimum | Context |
|---------|-------------|---------|
| `text-[10px]` or `text-[11px]` | `text-xs` (12px) | Micro labels, section headers |
| `text-xs` (12px) | `text-sm` (14px) | Sub-labels, meta text |
| `text-sm` (14px) | `text-base` (16px) | Body text, table cells, card content |
| `text-base` (16px) | `text-lg` (18px) | Card titles, prominent labels |
| `text-lg` (18px) | `text-xl` (20px) | Section headers |
| `text-xl` (20px) | `text-2xl` (24px) | Page sub-headers |
| `text-[22px]` / `text-2xl` | `text-3xl` (30px) | Page titles |
| `text-[32px]` | `text-4xl` (36px) | Stat card big numbers |
| `text-[56px]` | `text-6xl` (60px) | Hero record numbers |

### Step 1.3: Sidebar nav text

Read `LynxSidebar.jsx`. The nav item labels and category titles are too small.

- Nav item labels: use `text-sm font-semibold` minimum (was likely `text-xs`)
- Category group titles: use `text-sm font-bold uppercase tracking-wider` (was likely `text-[11px]`)
- Profile name: `text-base font-bold`
- Role switcher pills: `text-sm font-bold`
- "Lynx" brand text: `text-lg font-extrabold`

### Step 1.4: Apply across all redesigned components

Go through every file modified in CC-PAGES-REDESIGN and apply the size bump. This includes:
- All stat row components (StatRow labels, numbers, sub-text)
- All table headers and cells
- All filter bar text and chips
- All status chips
- All card headers and titles
- All page headers and subtitles
- All button text

**Do not change the relative hierarchy** — if a label was smaller than its number, it should stay smaller. Just shift everything up proportionally.

### Step 1.5: Verify
```bash
npx tsc --noEmit
```
Visually check at 1440p: text should be comfortably readable without squinting on any card, table, or label.

**Commit:** `git add -A && git commit -m "phase 1: global text size bump for 1440p readability + sidebar nav text fix"`

---

## PHASE 2: Welcome Banner — All Dashboards

**Goal:** Every dashboard (Admin, Coach, Parent) gets a welcome banner/header matching the mobile app's treatment.

### Step 2.1: Study the mobile app's welcome patterns

```bash
# Read the mobile welcome components
find /tmp/mobile-ref/src -name "*Welcome*" -o -name "*Greeting*" -o -name "*Banner*" | head -20
# Read coach home screen for greeting copy
# Read parent home screen for greeting copy
# Read admin home screen for greeting copy
```

Extract the greeting copy patterns, time-of-day logic, motivational messages, and visual treatment.

### Step 2.2: Create shared WelcomeBanner component

`src/components/shared/WelcomeBanner.jsx`

**Props:** `role` (admin/coach/parent), `userName`, `teamName`, `seasonName`

**Visual:**
- Full-width, flat (no card background, no shadow, no border) — this is a text-only header section
- Greeting line: large, warm, personalized — `text-3xl font-extrabold`
  - Time-of-day aware: "Good morning, Coach Carlos" / "Good evening"
  - OR motivational: "Ready to kill it today, Coach?" / "Today feels like a good day to knock out the lineup"
  - Rotate through 5–8 motivational messages randomly per session
- Sub-line: `text-lg text-slate-500` — context like team name, season, date
- Below the greeting: season indicator + current team being managed/coached

**Role-specific copy (match mobile app tone):**
- **Coach:** "Ready to dominate today, Coach?" / "Let's build some champions today" / "The court is calling, Coach" / "Today feels like a W"
- **Admin:** "Welcome to the command center" / "Let's see how the org is running" / "Time to check on the troops"
- **Parent:** "Welcome to the Den, {name}" / "Let's see what {childName} has been up to" / (match the mobile parent-scroll welcome)

### Step 2.3: Wire into each dashboard

- **Admin dashboard:** Add `<WelcomeBanner>` as the first element, above the health hero card
- **Coach dashboard:** Add `<WelcomeBanner>` as the very first element, above everything. Below it: season/team selectors (see Phase 3). Below that: the hero card and rest of dashboard.
- **Parent dashboard:** Replace "Welcome back, Parent" with `<WelcomeBanner>` using the mobile app's parent greeting patterns

### Step 2.4: Verify all three dashboards show the welcome banner with correct role-specific copy.

**Commit:** `git add -A && git commit -m "phase 2: welcome banner on all dashboards — mobile app tone and voice"`

---

## PHASE 3: Coach Dashboard — Complete Rework

**Goal:** Major rework of the coach dashboard layout and cards based on Carlos's detailed feedback.

This is the biggest phase. Read Carlos's feedback carefully — every element is specified.

### Step 3.1: Read current state + mobile reference

```bash
# Read current coach dashboard
cat [coach dashboard layout file]

# Read ALL mobile coach components
ls /tmp/mobile-ref/src/components/coach/
# Read each one
```

### Step 3.2: New coach dashboard layout (top to bottom)

The full layout from top to bottom:

```
┌─────────────────────────────────────────────────────────────────────┐
│  WELCOME BANNER (flat, text only — from Phase 2)                    │
│  "Ready to kill it today, Coach Carlos?"                            │
│  Season indicator + current team                                     │
├─────────────────────────────────────────────────────────────────────┤
│  SEASON/TEAM/SPORT SELECTORS (if coach has multiple)                │
│  Filter pills — only THEIR teams, not org-wide                      │
│  Selecting changes everything below                                  │
├────────────────────────────────────────┬────────────────────────────┤
│  GAME DAY HERO CARD (~55% width)       │  NOTIFICATIONS CARD        │
│  - 50% taller than current             │  - Full sentences           │
│  - Game image as background            │  - Emoji + event + time ago │
│  - Live badge / countdown              │  - Last 5 recent items      │
│  - Matchup title                       │  - Cycles: alerts vs recent │
│  - Open Game Day button                │                            │
│  - JOURNEY TRACKER INSIDE the hero     │                            │
│    (between button and record)         │                            │
│  - Season record + form badges         │                            │
├────────────────────────────────────────┤  SQUAD CARD               │
│  "Also this week..." (flat text card)  │  (larger player cards,     │
│  Cycles through week's events          │   rounded portrait photos, │
│                                        │   overall rating,          │
├────────────────────────────────────────┤   per-game stats top 5)   │
│  CALENDAR STRIP CARD (50% hero width)  │                            │
│  - Week view, current day highlighted  │                            │
│  - Scrollable through month            │                            │
│  - Click day → shows that day's events │                            │
│  - Max 3 events shown, +X overflow     │                            │
│  - "Go to schedule" button             │                            │
│  - If no events: "No events this day"  │                            │
├────────────────────────────────────────┤                            │
│  ACTION ITEMS CARD (flat, no bg/shadow)│                            │
│  - Same size as calendar strip         │                            │
│  - Large text, mobile app tone         │                            │
│  - Click items → navigate to task      │                            │
│  - If empty: motivational message      │                            │
│  - "uh oh, you haven't recorded stats  │                            │
│    for last week's game..."            │                            │
├────────────────────────────────────────┴────────────────────────────┤
│  (healthy visual padding here)                                       │
├─────────────────────────────────────────────────────────────────────┤
│  TEAM HEALTH CARD (full width)                                       │
│  - Attendance % (season, games vs practices)                         │
│  - Average team rating (avg of all player overall scores)            │
│  - Record, win rate                                                  │
│  - "This team is developing and on fire" energy                      │
│  - NOT engagement — performance + participation vs record            │
├─────────────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS CARD (50% of hero width)                              │
│  - Task-related buttons only                                         │
│  - Send Blast, Build Lineup, Give Shoutout, Enter Stats, etc.       │
├─────────────────────────────────────────────────────────────────────┤
│  TEAM READINESS JOURNEY CARD (full width)                            │
│  - Checklist: Verify roster, Evaluations done, Positions set,        │
│    Introduce yourself in chat, etc.                                  │
│  - Updates as things are completed                                   │
│  - Similar to admin's season journey tracker                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 3.3: Game Day Hero Card modifications

Read current `CoachGameDayHeroV2.jsx`.

Changes:
1. **Increase height by 50%** — add more vertical padding, make the content breathe
2. **Game image as background** — the previous version had a game photo as the hero card background. Restore this. The image should be behind the content with a dark gradient overlay (`bg-gradient-to-r from-lynx-navy/90 via-lynx-navy/70 to-lynx-navy/50`) so text remains readable. If no image exists, fall back to the current dark navy gradient.
3. **Move the Game Day Journey tracker INSIDE the hero card** — it currently sits in a separate card below. Move it into the hero, positioned between the "Open Game Day" button and the season record/form badges. Same visual style (numbered steps, clickable) but on the dark background with light text. Remove the separate `GameDayJourneyCard` from below the hero since it's now inside.
4. **All text inside the hero bumped up** per Phase 1 sizing

### Step 3.4: "Also This Week" flat card

Create: `src/components/coach/AlsoThisWeekCard.jsx`

- Sits immediately below the hero card, left column
- **Flat styling:** no background color, no shadow, no border, no outline — text only
- Shows: "Also this week: Saturday, Game vs 13U at 10:00 AM"
- If multiple events this week, cycles through them (auto-rotate every 5 seconds, or show 2-3 stacked)
- Data: filter events for current week from existing schedule data

### Step 3.5: Calendar Strip Card

Create: `src/components/coach/CalendarStripCard.jsx`

- **50% the width of the hero card** (so roughly 27.5% of total width)
- Sits below "Also This Week" card, left side
- **Week view:** 7 day columns (Mon–Sun), current day highlighted in `bg-lynx-sky text-white rounded-full`
- Scrollable through the month (left/right arrows or swipe)
- Small button: "View Full Schedule →" links to schedule page
- **When a day is selected/highlighted:** shows events for that day below the strip
  - If no events: "No events on this day"
  - If 1 event: show detail (time, type, opponent/location)
  - If 2-3 events: show compact list
  - If 4+ events: show first 3 + "+X more events" link to schedule page
- Reference the mobile app's day-strip calendar component for visual pattern

### Step 3.6: Action Items Card

Create: `src/components/coach/CoachActionItemsCard.jsx`

- **Same size as calendar strip card** — sits next to it (or below it in the left column)
- **Flat styling:** no background, no shadow, no border — text only
- Large text (`text-lg font-bold` for action items)
- Each item is clickable → navigates to the appropriate task/page
- **Mobile app tone and voice for the copy:**
  - "Uh oh, you haven't recorded stats for last week's game — the players are waiting to see how they did"
  - "11 pending RSVPs — let's lock in who's coming"
  - "2 games need stats entered"
  - "Evaluations are due this week for 5 players"
- **If no action items:** motivational message like the mobile app — "You're all caught up, Coach! The Den is running smooth." or similar. Match the mobile app's empty-state energy.
- Data: derive from existing queries (games without stats, pending RSVPs, overdue evaluations, etc.)

### Step 3.7: Notifications Card enhancement

Read current `CoachNotificationsCard.jsx`.

Changes:
- Must support **full-length sentences** — not truncated snippets
- Format: emoji + event description + time ago — e.g. "🏅 Ava Test earned Hype Machine · 4d ago"
- Room for **at least 5 recent items**
- **Two modes that cycle/tab:**
  1. Blasts/Alerts/Announcements — org-wide or team-wide messages from admin
  2. Recent activity — "Asst Coach Carlos inputted stats for Saturday's game", "Parent gave [Player] kudos for leadership"
- These can be tabs at the top of the card, or auto-cycle between the two views
- If no notifications: "Nothing new — your team is quietly crushing it"

### Step 3.8: Squad/Roster Card overhaul

Read current `CoachRosterCard.jsx`.

Changes:
- **Player cards are too small (height-wise)** — increase card row height significantly
- **Photos must be rounded portraits** — not cropped circles. Use `rounded-xl` or `rounded-2xl` with natural aspect ratio, not forced into circles
- **Each player row should include:**
  - Portrait photo (rounded, larger — `w-12 h-12 rounded-xl` minimum)
  - Jersey number + Name (bold)
  - Position badge
  - Overall rating (as a small XP bar or number)
  - Top per-game stats (top 5 stats — kills, digs, aces, etc. — show the most relevant ones as small numbers)
- Card title: "SQUAD (12)" with "Full Roster →" link
- Internal scroll if > 12 players, but cards should be large enough to be glanceable
- Reference the mobile app's player card list treatment

### Step 3.9: Team Health Card

Create: `src/components/coach/TeamHealthCard.jsx`

- Full width, below the calendar strip + action items section, with healthy visual padding above
- **Performance + participation focused, NOT engagement:**
  - Season attendance % (overall, and broken down: games vs practices)
  - Average team rating (mean of all players' overall evaluation scores)
  - Season record + win rate
  - Visual treatment: big numbers, power bars, color-coded (green = thriving, amber = needs work, red = concern)
- The energy should be: "This team is developing and on fire" — celebratory when stats are good, honest when they need work
- This is NOT an engagement/activity card — it's purely about on-court performance and participation

### Step 3.10: Quick Actions Card resize

The existing Quick Actions card should be **50% the width of the hero card** (not full width). Same content (Send Blast, Build Lineup, Give Shoutout, Enter Stats, Manage Roster, Challenge) — just narrower.

### Step 3.11: Team Readiness Journey Card

Create: `src/components/coach/TeamReadinessCard.jsx`

- Full width, at the bottom of the dashboard
- A journey/checklist tracker for coaches — similar concept to the admin's season setup journey
- Steps that update as the coach completes them:
  1. Verify roster (all players confirmed)
  2. Complete evaluations (all players evaluated)
  3. Set positions (all players have positions assigned)
  4. Introduce yourself in team chat (sent at least one message)
  5. Build first lineup
  6. Record first game stats
- Each step shows completed (green check + sky fill) or pending (gray outline)
- Progress bar at top showing X of Y complete
- This activates when admin assigns players to the coach's team

### Step 3.12: Season/Team Selectors

Below the welcome banner, above the hero:
- If coach manages multiple teams/seasons/sports: show filter pills
- **Only show THEIR options** — not org-wide options. Even if they're also an admin, the coach view shows only teams they actually coach.
- Selecting a different team/season updates ALL cards below
- If coach only has one team in one season: selectors don't render (progressive disclosure)

### Step 3.13: Verify
```bash
npx tsc --noEmit
```
Test as Coach:
- Welcome banner shows with motivational copy
- Season/team selectors work (if multiple teams)
- Hero card is 50% taller, has game image background, journey tracker INSIDE
- "Also this week" cycles through events
- Calendar strip shows week, day selection shows events
- Action items use mobile app tone
- Notifications show full sentences, 5+ items
- Squad cards are larger with portraits and stats
- Team health card shows performance data
- Quick actions is half-width
- Team readiness journey tracks progress
- All text readable at 1440p
- No console errors

**Commit:** `git add -A && git commit -m "phase 3: coach dashboard complete rework — hero, calendar strip, action items, team health, readiness"`

---

## PHASE 4: Parent Dashboard — Mobile App Parity

**Goal:** The parent dashboard needs a near-complete redo. Reference the mobile app's `parent-scroll` components folder as the design source of truth.

### Step 4.1: Study the mobile parent-scroll components

```bash
# Read EVERY file in the parent-scroll folder
ls /tmp/mobile-ref/src/components/parent-scroll/
# Cat each file
find /tmp/mobile-ref/src/components/parent-scroll/ -type f | while read f; do echo "=== $f ==="; cat "$f"; done

# Also read the parent home screen
find /tmp/mobile-ref/src -name "*ParentHome*" -o -name "*parent-home*" | head -10
# Read those files too
```

**Identify and catalog:**
- Every card type used in the mobile parent view
- The visual treatment for each (gradients, sizing, spacing)
- The progressive disclosure logic (what shows/hides conditionally)
- The tone and copy for empty states
- The player card treatment (NOT the long flat cards currently showing)
- The action items treatment
- The event/schedule treatment
- The balance/payment treatment

### Step 4.2: Redesign ParentDashboard.jsx

Replace the current parent dashboard content with web-appropriate versions of the mobile parent-scroll patterns.

**The current problems Carlos identified:**
- Player hero cards are ugly "LOOOONG" flat cards — need the mobile app's player card treatment instead
- "Add Child" registration check is broken (says no open registration when mobile shows 8 open + Summer 2026)
- Overall layout and card styling doesn't match mobile app energy

**New layout (reference mobile parent-scroll):**

1. **Welcome Banner** (from Phase 2) — "Welcome to the Den, {parentName}"

2. **Child Player Cards** — NOT long flat cards. Reference the mobile app's player card component:
   - Each child gets a proper player trading card aesthetic
   - Photo, name, jersey, team, position
   - Team color accents
   - If multiple children: horizontal scroll of cards, each clickable to set context
   - Card size should be substantial — maybe `w-64 h-40` minimum, not the thin strips currently showing
   - "Add Child" card at the end (if registration is open)

3. **"Action Required" / "You Got Stuff To Do"** — match the mobile app's treatment:
   - Conditional (progressive disclosure — gone if no items)
   - Amber accent
   - Each item clickable → resolves the task
   - Mobile app tone: specific, actionable copy (not just "Payment Overdue" three times — specify WHICH payment, for WHICH child, HOW MUCH)

4. **Upcoming Events** — match mobile event carousel/list:
   - Next 3 events for selected child
   - RSVP buttons
   - Game vs practice visual distinction

5. **Team Hub Preview** — latest team wall post

6. **Balance Due** (conditional — only if > $0):
   - Match the current treatment but with mobile app styling
   - Big amount, progress bar, Pay Now button

7. **Player Achievements** — badges with rarity tiers

### Step 4.3: Fix "Add Child" / Registration check

The "Add Child" button says no open registrations, but the mobile app shows 8 open + Summer 2026. This means the web query is either:
- Missing the correct organization_id filter
- Not checking the right table/columns
- Using a different date range check

```bash
# Find the registration availability check in web
grep -r "no open registration\|no.*registration.*open\|registration.*available" src/ --include="*.jsx" -l
# Read that file to find the query

# Compare with mobile
grep -r "open.*registration\|registration.*open" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" -l
# Read to compare the query logic
```

Fix the web query to match the mobile app's logic so it correctly finds open registrations.

### Step 4.4: Verify
```bash
npx tsc --noEmit
```
Test as Parent:
- Welcome banner shows
- Child cards look like mobile app treatment (NOT long flat strips)
- Multiple children: horizontal scroll, context switching works
- Action Required items are specific (which payment, which child, how much)
- "Add Child" correctly shows open registrations
- Upcoming events with RSVP
- Balance card conditional
- Team hub preview
- All text readable at 1440p
- No console errors, no admin data leaking

**Commit:** `git add -A && git commit -m "phase 4: parent dashboard — mobile app parity, player cards, action items, registration fix"`

---

## PHASE 5: Admin Dashboard — Welcome Banner + Polish

**Goal:** Add welcome banner to admin dashboard. Apply text size fixes. Light polish.

### Step 5.1: Add WelcomeBanner to admin dashboard

Read the admin dashboard layout file. Add `<WelcomeBanner role="admin" ... />` as the first element, above the OrgHealthHero card.

### Step 5.2: Apply any remaining text size fixes specific to admin pages

Check TeamsPage, PaymentsPage, RegistrationsPage — all stat rows, tables, filter bars should have the bumped text sizes from Phase 1.

### Step 5.3: Verify
```bash
npx tsc --noEmit
```
Test as Admin: welcome banner, all pages readable at 1440p, no console errors.

**Commit:** `git add -A && git commit -m "phase 5: admin dashboard welcome banner + text size polish"`

---

## PHASE 6: Parity Check + Final Polish

**Goal:** Final sweep. Everything should be readable, consistent, and match the mobile app's energy.

### Step 6.1: Full role test

For each role (Admin, Coach, Parent, Player):
1. Dashboard renders with welcome banner
2. All cards at correct sizes
3. All text readable at 1440p
4. No console errors
5. No VolleyBrain references
6. Progressive disclosure working (empty sections don't render)

### Step 6.2: Consistency check

- All flat/text-only cards truly have no background, shadow, or border
- All status chips use consistent colors
- All XP bars use the correct tier colors
- Player photos are rounded portraits (rounded-xl), not cropped circles, in the coach squad card
- Game Day hero has image background with gradient overlay
- Journey trackers inside hero and on team readiness both work

### Step 6.3: TSC + build
```bash
npx tsc --noEmit
npm run build
```

### Step 6.4: Final commit
```bash
git add -A && git commit -m "phase 6: final parity check — all roles tested, 1440p readable, mobile tone matched"
```

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + clone mobile ref | Get mobile repo for reference |
| 1 | Global text size bump + sidebar | All text up 2-4 sizes, sidebar nav text larger |
| 2 | Welcome banners — all dashboards | Motivational greetings, mobile app tone |
| 3 | Coach dashboard complete rework | Hero (taller, image bg, journey inside), calendar strip, action items, team health, squad cards larger, team readiness |
| 4 | Parent dashboard — mobile parity | Reference parent-scroll folder, fix player cards, fix registration check |
| 5 | Admin dashboard polish | Welcome banner + text size fixes |
| 6 | Parity check | Final sweep all roles |

**Total phases:** 7 (0–6)

---

## NOTES FOR CC

- **The mobile repo is READ ONLY.** Clone it to `/tmp/mobile-ref` for reference. Do not modify it. Do not push to it.
- **"Flat" cards mean truly flat:** `bg-transparent shadow-none border-none` — literally just text content with padding. No card chrome at all.
- **Tone and voice must match the mobile app.** Read the mobile components' copy strings and use the same energy. "Uh oh, you haven't recorded stats" not "Stats pending entry."
- **Player card photos are rounded portraits, not circles.** Use `rounded-xl` or `rounded-2xl` with `object-cover`, not `rounded-full`.
- **The coach dashboard selectors filter by THEIR teams only.** Even if the user is also an admin, coach view = only their coached teams. No org-wide data in coach view.
- **"Also This Week" and Action Items are flat text cards.** No card wrapper. They float in the layout as typography-driven content blocks.
- **Calendar strip references the mobile app's day-strip calendar.** Find it, read it, adapt it for web.
- **Game Day Hero image background:** The previous coach dashboard had a game photo as the hero background. Find where that image URL comes from in the data and restore it. Use a dark gradient overlay to keep text readable.
