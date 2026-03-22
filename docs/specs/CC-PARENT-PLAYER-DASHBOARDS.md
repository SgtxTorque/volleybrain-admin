# CC-PARENT-PLAYER-DASHBOARDS — Parent & Player Dashboard Build + Financial Fix

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-COACH-DASHBOARD-FINAL (completed or in flight)
**Design Reference:** Carlos's 5 reference screenshots (parent family dashboard + player dashboard mockups)

---

## CONTEXT

Carlos provided reference mockup screenshots for both the Parent (Family) Dashboard and Player Dashboard. These are the north star. This spec builds both dashboards to match those references, plus fixes the Financial Summary card's category breakdown, and adds pulse animations to key elements.

---

## RULES

1. Read every file before modifying
2. Archive before replace
3. Preserve all Supabase data fetching
4. Commit after each phase
5. TSC verify after each phase
6. No file over 500 lines
7. Reference the mobile repo for tone/copy: `SgtxTorque/volleybrain-mobile3` (clone to `/tmp/mobile-ref` if not already there)

---

## PHASE 0: Archive + Clone Mobile Ref

```bash
mkdir -p src/_archive/parent-player-$(date +%Y%m%d)
cp src/pages/roles/ParentDashboard.jsx src/_archive/parent-player-$(date +%Y%m%d)/
cp src/components/dashboard/FinancialSummaryCard.jsx src/_archive/parent-player-$(date +%Y%m%d)/

# Find player dashboard if it exists
find src -name "*PlayerDashboard*" -o -name "*player-dashboard*" | head -10
# Archive if found

# Clone mobile for reference if needed
if [ ! -d /tmp/mobile-ref ]; then
  git clone https://github.com/SgtxTorque/volleybrain-mobile3.git /tmp/mobile-ref
fi

# Study the mobile parent and player screens
find /tmp/mobile-ref/src -path "*parent*" -type f | head -20
find /tmp/mobile-ref/src -path "*player*" -type f | head -20
find /tmp/mobile-ref/src -name "*ParentHome*" -o -name "*PlayerHome*" -o -name "*parent-scroll*" | head -20
# Read each file found
```

**Commit:** `git add -A && git commit -m "phase 0: archive for parent/player dashboard build"`

---

## PHASE 1: Financial Summary Card — Category Breakdown Fix

### Step 1.1: Read current card

```bash
cat src/components/dashboard/FinancialSummaryCard.jsx
```

### Step 1.2: Add category breakdown section

Based on Carlos's reference screenshot (Image 1), below the green/red bar graph add:

**A horizontal line divider:** `border-t border-slate-200 my-4`

**Then a row of category breakdowns:**
- Each category shows: category title on top (`text-r-xs text-slate-500 uppercase`), then the dollar amount below (`text-r-xl font-extrabold text-lynx-navy`)
- Layout: `flex justify-between` or `grid grid-cols-3 gap-4` (however many categories exist)
- Sample categories: Registration, Tournaments, Uniforms (derive from actual payment data)
- Format: `$28,500` (just collected amount, bold and prominent)

```
──────────────────────────────────────
Registration        Tournaments       Uniforms
$28,500             $8,200            $3,100
```

Read the Supabase payment queries to see what categories/types exist. If payments have a `category` or `type` field, group by that. If not, check if there are different payment plan types, registration fee types, or line item categories.

If no category data exists in the database, show a single row: "Total Billed: $45,250" as a fallback, and add a comment noting the schema needs a category field for richer breakdowns.

### Step 1.3: Verify card renders with the breakdown at its grid size.

**Commit:** `git add -A && git commit -m "phase 1: financial summary — category breakdown below bar graph with divider"`

---

## PHASE 2: Parent (Family) Dashboard — Full Build

### Step 2.1: Read current parent dashboard

```bash
cat src/pages/roles/ParentDashboard.jsx
wc -l src/pages/roles/ParentDashboard.jsx
```

Also read mobile parent components for tone and card patterns:
```bash
find /tmp/mobile-ref/src -path "*parent-scroll*" -type f | while read f; do echo "=== $f ==="; cat "$f"; done
```

### Step 2.2: Parent Dashboard layout (from reference screenshots)

The reference shows a clean, warm, child-focused dashboard. Build it to match:

**Top section:**
- "Family Dashboard" header bar with notification bell (badge count) + parent avatar (top right)
- Welcome section: Lynx cub mascot icon + "Welcome to the Den," + parent name large and bold
- `text-r-sm text-slate-500` for "Welcome to the Den," then `text-r-3xl font-extrabold` for the name

**My Athletes section:**
- Header: "MY ATHLETES" uppercase label
- Horizontal row of athlete cards, each is a compact card (~160px wide):
  - Dark navy gradient background (`bg-gradient-to-br from-lynx-navy to-[#1a2d5a]`)
  - Player avatar circle (large, centered or left-aligned, with photo or initial)
  - Player name bold white
  - Team name below in `text-white/60`
  - Position + jersey number: "Setter · #1"
  - Level badge: "Lvl 4 Bronze" in a small pill with appropriate tier color
  - XP progress bar at bottom: `h-1.5 rounded-full` showing progress to next level (e.g. "750/800 XP")
  - Blue checkmark badge if selected/active
- "Add Athlete" card: dashed border, "+" icon, "Add Athlete" text — opens registration flow
- Clicking an athlete card selects them and all cards below update to show that child's data

**Action Required section (conditional — progressive disclosure):**
- Only shows if there ARE action items. If zero items, this section doesn't exist.
- Amber/warm tint card with "ACTION REQUIRED" header in amber
- Each item is a row with:
  - Icon (payment icon, calendar icon, etc.)
  - Specific description: "Payment overdue for Ava – $209.99" (not generic "Payment Overdue")
  - Action button right-aligned: "Pay Now" (red/coral), "RSVP" (sky), etc.
  - **Pulse animation on the action buttons:** `animate-pulse` on the button background, subtle

**Next Event card:**
- Dark navy/teal gradient background
- "● NEXT EVENT" label in green with green dot (pulsing: `animate-pulse`)
- Event type large: "Practice" or "Game vs [Opponent]"
- Date/time: "Today at 6:00 PM"
- Location: "📍 Frisco Fieldhouse"
- Two buttons: "RSVP" (sky blue) + "Directions" (dark/navy)
- This card should have a gentle glow or border pulse to draw attention

**Team Hub card (right of next event):**
- White card
- "TEAM HUB" header
- Latest shoutout or post: avatar + "Coach Carlos gave Ava a **Clutch Player** shoutout!" + time ago
- "RECENT ACTIVITY" section below with 3-4 items:
  - "Ava attended practice · Yesterday"
  - "Stats updated from game · 2 days ago"
  - "New schedule posted · 3 days ago"

**Season Record card:**
- Clean white card
- "SEASON RECORD" header
- Big numbers: `6` Wins (green) `1` Loss (red), displayed side by side
- Sub-text: "Last: Won 50-12"

**Balance Due card (conditional — only if money owed):**
- "BALANCE DUE" header in red
- Big red amount: `$209.99`
- "Pay Now" button full-width, coral/red color, **with subtle pulse animation**
- If balance is $0: card does not render

**Engagement Progress card:**
- "ENGAGEMENT PROGRESS" header
- Level badge: "Level 4 Bronze" with tier icon
- XP bar: "750 / 800 XP" with gradient fill
- Wider bar than the athlete card version — more visual impact here

**Team Chat preview card:**
- Chat bubble icon + "Team Chat" + "1 unread message"
- Clickable → navigates to chat

**Quick Links card:**
- "QUICK LINKS" header
- List of navigation shortcuts:
  - 📅 View Full Schedule >
  - 💳 Payment History >
  - 🏠 Team Roster >
- Each is a row with icon + label + chevron, clickable

### Step 2.3: Create new parent-specific card components

Some of these cards may already exist. Read first, then create what's missing:

- `src/components/parent/AthleteCard.jsx` — individual child card with dark styling, XP bar, level badge
- `src/components/parent/AthleteCardRow.jsx` — horizontal row of AthleteCards + Add Athlete
- `src/components/parent/ParentActionRequired.jsx` — action items with specific descriptions and action buttons
- `src/components/parent/NextEventCard.jsx` — dark gradient event card with RSVP + Directions
- `src/components/parent/SeasonRecordCard.jsx` — W/L display
- `src/components/parent/EngagementProgressCard.jsx` — XP level and progress
- `src/components/parent/QuickLinksCard.jsx` — navigation shortcuts
- Reuse existing: `TeamHubPreview`, `BalanceDueCard`, `ChatPreviewCard`

### Step 2.4: Register all parent widgets in the registry

Add each new component to `widgetRegistry.js` and `widgetComponents.jsx`.

### Step 2.5: Set up parent dashboard with DashboardGrid

Wire the parent dashboard to use `DashboardGrid` with these widgets in a default layout that matches the reference screenshots.

**Suggested default layout (24-col grid):**
```js
const PARENT_DEFAULT_LAYOUT = [
  { i: "welcome-banner", x: 0, y: 0, w: 24, h: 5 },
  { i: "athlete-cards", x: 0, y: 5, w: 24, h: 7 },
  { i: "action-required", x: 0, y: 12, w: 24, h: 5 },
  { i: "next-event", x: 0, y: 17, w: 14, h: 8 },
  { i: "team-hub", x: 14, y: 17, w: 10, h: 8 },
  { i: "season-record", x: 0, y: 25, w: 7, h: 6 },
  { i: "balance-due", x: 7, y: 25, w: 7, h: 6 },
  { i: "team-chat", x: 14, y: 25, w: 10, h: 3 },
  { i: "quick-links", x: 14, y: 28, w: 10, h: 6 },
  { i: "engagement-progress", x: 0, y: 31, w: 7, h: 5 },
];
```

### Step 2.6: Verify

Test as Parent:
- Welcome section with mascot + parent name
- Athlete cards render with real child data, photos, levels, XP
- Selecting an athlete updates all cards below
- Action items specific (not generic), with action buttons
- Next Event shows real next event, RSVP + Directions buttons
- Team Hub shows real shoutouts/activity
- Season Record shows real W/L
- Balance Due conditional (shows only if owed)
- Chat preview with real unread count
- Quick Links navigate correctly
- Pulse animations on action buttons and next event dot
- No admin data visible, no other family data

**Commit:** `git add -A && git commit -m "phase 2: parent family dashboard — full build matching reference screenshots"`

---

## PHASE 3: Player Dashboard — Full Build

### Step 3.1: Check if player dashboard exists

```bash
find src -name "*PlayerDashboard*" -o -name "*player-dashboard*" -o -name "*PlayerHome*" | head -10
grep -r "player.*dashboard\|PlayerDashboard" src/ --include="*.jsx" -l | head -10
```

Read whatever exists. The player dashboard may be minimal or may not exist at all for web.

### Step 3.2: Player Dashboard layout (from reference screenshots — Images 4 & 5)

The reference shows a DARK THEME player dashboard. This is the one dashboard that uses dark mode by default — matching the player trading card aesthetic from mobile.

**Overall styling:** Dark navy background on the entire page. Cards use lighter navy or glassmorphic styling. Text is white/light.

**Player Hero Card (top left):**
- "PLAYER" label in sky blue, small uppercase
- Player name HUGE: `text-r-5xl font-extrabold text-white` — first name on one line, last name on next
- Team + position + jersey: "Black Hornets Elite · Setter · #1" in `text-white/60`
- Level badge: "LVL 4 BRONZE" pill in tier color
- XP progress: "750/800 XP to Level 5" with progress bar

**Overall Rating (top right of hero):**
- Big number in a circle/badge: "56 OVR"
- The circle has a sky blue border or fill
- `text-r-4xl font-extrabold text-white`

**Trophy Case card:**
- "Trophy Case" header + "3/6 unlocked" right-aligned
- Grid of badge icons (3 across, 2 rows):
  - Earned badges: full color with tier label (Hype Machine — RARE, First Shoutout — COMMON, Iron Lung — EPIC)
  - Locked badges: gray silhouette with lock icon
- Badge tier colors: Common=gray, Rare=blue, Epic=purple, Legendary=gold
- **Rare and Epic badges should have a subtle glow/pulse:** `shadow-blue-500/20` or `shadow-purple-500/20`

**Streak card:**
- "🔥 3-Day Streak" bold
- "Keep it going — you're locked in" motivational sub-text
- If no streak: "Start a streak by attending practice!"

**Next Up card:**
- Green dot pulsing + "NEXT UP" label
- "Practice" large text
- Date/time + location
- "I'M READY" button — coral/orange with rounded pill shape
- **This button pulses subtly:** `animate-pulse` on hover or constantly

**Scouting Report card (right side):**
- "Scouting Report" header
- List of skills with XP power bars:
  - Hitting: 3/5 with segmented bar (3 green segments, 2 gray)
  - Serving: 4/5
  - Passing: 3/5
  - Setting: 5/5 (full green, maybe gold tint)
  - Blocking: 2/5 (amber/orange segments)
  - Court Awareness: 4/5
- **Overall Rating at bottom:** power bar + number "56"
- Bar segments: green for filled, gray for empty. Use discrete segments (not smooth fill) — 5 blocks per skill
- `h-3 rounded` per segment with `gap-1` between them

**Shoutout card:**
- Lynx mascot wave icon + "Coach Carlos gave you a **Clutch Player** shoutout!"
- Time: "2h ago"
- Warm, celebratory feel — maybe a subtle background glow

**Today card:**
- "TODAY" header in green
- "+50 XP earned" — big green number, "Practice attendance" sub-text
- **The +50 should have a shimmer or pulse animation**

**Last Game card:**
- "LAST GAME" header
- Stats in a row: 22 Assists, 100 Hit %, 100 Srv %, 0 Blocks
- Each stat: big number on dark card, label below in muted text

**Team Chat card:**
- Chat icon + "Team Chat" + "1 unread message" + chevron
- Clickable

**Daily Challenge card:**
- Lightning bolt + "DAILY CHALLENGE" header in yellow
- Challenge description: "Complete 20 serves at practice"
- Progress bar: 0/20
- "+25 XP reward" below the bar

### Step 3.3: Create player-specific components

- `src/components/player/PlayerHeroCard.jsx` — dark, name huge, team/position, level, XP
- `src/components/player/OverallRatingBadge.jsx` — circle with OVR number
- `src/components/player/TrophyCaseCard.jsx` — badge grid with tier colors and glows
- `src/components/player/StreakCard.jsx` — streak count + motivational text
- `src/components/player/ScoutingReportCard.jsx` — skill bars with discrete segments
- `src/components/player/TodayXPCard.jsx` — XP earned today with shimmer
- `src/components/player/LastGameCard.jsx` — game stat boxes
- `src/components/player/DailyChallengeCard.jsx` — challenge + progress bar + XP reward
- Reuse: `NextEventCard` (from parent, but styled dark), `ChatPreviewCard`, shoutout display

### Step 3.4: Player Dashboard page

Create or update: `src/pages/roles/PlayerDashboard.jsx`

**Dark theme wrapper:**
```jsx
<div className="min-h-screen bg-lynx-navy">
  <DashboardContainer className="!bg-transparent">
    <DashboardGrid
      widgets={playerWidgets}
      editMode={editMode}
      sharedProps={playerData}
      className="[&_.react-grid-item]:!bg-transparent"
    />
  </DashboardContainer>
</div>
```

Cards on the player dashboard use dark styling internally — each card component handles its own dark treatment rather than relying on a global dark mode.

**Default layout:**
```js
const PLAYER_DEFAULT_LAYOUT = [
  { i: "player-hero", x: 0, y: 0, w: 14, h: 10 },
  { i: "overall-rating", x: 14, y: 0, w: 4, h: 5 },
  { i: "trophy-case", x: 14, y: 0, w: 10, h: 10 },
  { i: "streak", x: 0, y: 10, w: 14, h: 3 },
  { i: "next-event-player", x: 0, y: 13, w: 14, h: 6 },
  { i: "scouting-report", x: 14, y: 10, w: 10, h: 14 },
  { i: "shoutout", x: 0, y: 19, w: 14, h: 4 },
  { i: "today-xp", x: 0, y: 23, w: 7, h: 5 },
  { i: "last-game", x: 7, y: 23, w: 7, h: 5 },
  { i: "team-chat", x: 0, y: 28, w: 7, h: 3 },
  { i: "daily-challenge", x: 7, y: 28, w: 7, h: 5 },
];
```

### Step 3.5: Register all player widgets in the registry

Add every new component to `widgetRegistry.js` with `roles: ['player']` (and `['admin', 'coach', 'parent', 'player']` where it makes sense — like chat and next event).

### Step 3.6: Wire to real data

Each player card needs real data from Supabase:
- Player profile: name, team, position, jersey, photo, level, XP
- Evaluation scores: per-skill ratings for scouting report
- Achievements/badges: earned + in-progress
- Recent games: stats from last game
- Streak: attendance streak count
- Challenges: active daily/weekly challenges
- Chat: unread message count
- Schedule: next event

Read existing Supabase queries and player-related tables to wire everything up.

### Step 3.7: Verify

Test as Player:
- Dark theme renders across entire dashboard
- Player hero shows real name, team, position, level
- Overall rating circle shows real eval score
- Trophy case shows real earned + locked badges with tier colors
- Scouting report shows real per-skill evaluations as segmented bars
- Streak shows real attendance streak
- Today XP shows real XP earned (with shimmer/pulse)
- Last Game shows real stats
- Daily Challenge shows real challenge (or empty state)
- Chat shows real unread count
- Next Up shows real next event with "I'M READY" button
- Pulse/glow animations on: rare/epic badges, next event dot, action buttons, XP earned

**Commit:** `git add -A && git commit -m "phase 3: player dashboard — full dark theme build matching reference screenshots"`

---

## PHASE 4: Pulse Animations Across All Dashboards

### Step 4.1: Add CSS animation utilities

In `src/index.css`, add custom animations:

```css
/* Subtle pulse for attention items */
@keyframes soft-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.animate-soft-pulse {
  animation: soft-pulse 2s ease-in-out infinite;
}

/* Glow pulse for achievements */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(75, 185, 236, 0.3); }
  50% { box-shadow: 0 0 20px rgba(75, 185, 236, 0.6); }
}
.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Gold glow for legendary items */
@keyframes gold-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 24px rgba(255, 215, 0, 0.6); }
}
.animate-gold-glow {
  animation: gold-glow 2s ease-in-out infinite;
}

/* Shimmer for XP gains */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.animate-shimmer {
  background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

/* Green dot pulse for "live" / "next event" indicators */
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
.animate-dot-pulse {
  animation: dot-pulse 1.5s ease-in-out infinite;
}
```

### Step 4.2: Apply animations across dashboards

**Admin dashboard:**
- Needs Attention items with high urgency: `animate-soft-pulse` on the red dot
- Setup tracker progress bar: shimmer effect on the filled portion

**Coach dashboard:**
- Game Day hero "LIVE" badge: `animate-dot-pulse` on the red dot
- Action items overdue: `animate-soft-pulse` on the urgency dot
- Hero carousel dot indicators: subtle pulse on active dot

**Parent dashboard:**
- Action Required buttons (Pay Now, RSVP): `animate-soft-pulse`
- Next Event green dot: `animate-dot-pulse`
- Balance Due "Pay Now" button: `animate-soft-pulse` (subtle urgency)

**Player dashboard:**
- Rare badges: `animate-glow-pulse` (blue glow)
- Epic badges: `animate-glow-pulse` (purple — change the color in a variant)
- Legendary badges: `animate-gold-glow`
- "+50 XP earned" number: `animate-shimmer` overlay
- "I'M READY" button: `animate-soft-pulse`
- Next event green dot: `animate-dot-pulse`
- Daily challenge XP reward text: subtle `animate-shimmer`

### Step 4.3: Respect prefers-reduced-motion

Add to `src/index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-soft-pulse,
  .animate-glow-pulse,
  .animate-gold-glow,
  .animate-shimmer,
  .animate-dot-pulse {
    animation: none !important;
  }
}
```

### Step 4.4: Verify animations are visible but not distracting.

**Commit:** `git add -A && git commit -m "phase 4: pulse animations — soft-pulse, glow, shimmer, dot-pulse across all dashboards"`

---

## PHASE 5: Parity Check

```bash
npx tsc --noEmit
npm run build
```

Test all four roles:
- **Admin:** Financial card has category breakdown, pulse on urgency items
- **Coach:** Hero carousel works, all cards wired
- **Parent:** Full family dashboard matching reference, athlete cards, action items specific, pulse animations
- **Player:** Full dark theme dashboard, scouting report bars, trophy case with glows, XP shimmer, daily challenge

No console errors across any role. No data leaking between roles.

**Commit:** `git add -A && git commit -m "phase 5: parity check — all four dashboards verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + mobile ref | Backup files, study mobile patterns |
| 1 | Financial card fix | Category breakdown with divider below bar graph |
| 2 | Parent Dashboard | Full build — athlete cards, action items, next event, team hub, balance, XP, quick links |
| 3 | Player Dashboard | Full dark theme build — hero, scouting report, trophy case, streak, XP, challenge |
| 4 | Pulse animations | soft-pulse, glow-pulse, gold-glow, shimmer, dot-pulse across all dashboards |
| 5 | Parity check | All four roles tested |

**Total phases:** 6 (0–5)

---

## NOTES FOR CC

- **The Player Dashboard is DARK THEME.** The entire page background is `bg-lynx-navy`. Cards use dark navy variants internally. Text is white/light. This is the ONLY dashboard that's dark by default.
- **Scouting Report uses discrete segmented bars, NOT smooth fills.** Each skill has 5 blocks. Filled blocks are colored (green/teal), empty blocks are gray. Use `flex gap-1` with 5 individual divs per skill.
- **Trophy Case badges use tier-specific glow animations.** Rare = blue glow, Epic = purple glow, Legendary = gold glow (slow 2-second pulse). Common badges have no glow.
- **Parent Action Required items must be SPECIFIC.** "Payment overdue for Ava – $209.99" NOT "Payment Overdue". Include the child's name, the dollar amount, the event name, etc. Read from actual data.
- **The "Add Athlete" card on parent dashboard** opens the registration flow. Verify this connects to the registration availability check that was fixed in a prior spec.
- **Athlete card selection** changes context for the entire dashboard below. When a parent clicks on a different child, all cards (next event, season record, balance, chat, etc.) update to show that child's data.
- **`prefers-reduced-motion`** must be respected — all animations disabled for users who have that OS setting.
- **Both parent and player dashboards use DashboardGrid** with the widget system, so Carlos can rearrange them in edit mode just like admin and coach.
