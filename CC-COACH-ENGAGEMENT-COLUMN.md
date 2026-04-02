# CC-COACH-ENGAGEMENT-COLUMN
## Add Engagement Column to Coach Dashboard

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `feat/desktop-dashboard-redesign` (or current active branch)

---

## CONTEXT

The coach dashboard currently has a two-panel layout: main content area (left) + right sidebar (Next Game, This Week, Playbook, Latest Shoutout, Coach XP bar). The engagement system is nearly invisible — just a tiny XP bar at the bottom of the right sidebar.

We're adding a NEW engagement column between the main content and the existing right sidebar. The dashboard becomes a 3-column layout:

```
| Main Content (narrower) | Engagement Column (~220px) | Right Sidebar (existing, unchanged) |
```

The main content area (hero banner, nudge card, attention bar, roster/tabs) gets narrower but keeps all existing content. The right sidebar (Next Game, This Week, Playbook, Latest Shoutout) stays exactly as-is. The new engagement column slots between them.

### Design reference
Carlos provided a screenshot of the exact layout he wants. The engagement column contains 4 stacked cards:

1. **Coach Level/XP Hero Card** — Navy gradient background (#0B1628 → #162D50), shows level name ("Rising Star"), level number, XP progress (e.g., "520 / 2K XP"), XP progress bar in sky blue (#4BB9EC), and a gold "Trophy case" link
2. **Your Coaching Activity Card** — White card, "YOUR ACTIVITY" header with "Week" pill. Four activity rows:
   - Shoutouts given (count)
   - Challenges created (count)  
   - Games with stats entered (count)
   - Player evals done (count)
   - Each row has a colored icon, label, and bold count number on the right
   - Gold nudge bar at bottom: "3 more shoutouts for Hype Coach" (shows next closest badge)
3. **Badges Card** — Compact. Header "BADGES" with count "15/100". Grid of small badge thumbnails (5 across, ~32px each). Shows most recently earned badges.
4. **Team Pulse Card** — Compact. Shows Active/Drifting/Inactive player counts in green/amber/red with a stacked progress bar below.

### Design system (locked)
- Navy: `#0B1628` (midnight), `#10284C` (navy), `#162D50` (lighter navy)
- Sky blue: `#4BB9EC`
- Gold: `#FFD700` (achievement only)
- Font: Inter Variable (web)
- Border radius: 14px for cards (or whatever the dashboard currently uses)
- The engagement column should match the visual style of the existing right sidebar cards

---

## PHASE 1: INVESTIGATION

### Step 1.1 — Current dashboard layout structure
Open `src/pages/roles/CoachDashboard.jsx` (or wherever the coach dashboard lives) and document:
1. The overall layout structure — how is the 2-column layout implemented? (CSS grid? flexbox? fixed widths? percentage?)
2. What component/div contains the main content area?
3. What component/div contains the right sidebar?
4. What CSS classes or inline styles control the column widths?
5. Show me the top-level JSX structure (the grid/flex container with its children)

### Step 1.2 — Right sidebar current contents
List everything currently in the right sidebar, in order:
- Component names
- What data each card displays
- Where does the XP bar currently live?

### Step 1.3 — Available data hooks
Check what engagement data is already being fetched or available:
1. Coach's current XP and level — is this already fetched somewhere?
2. Coach's badge count — how many earned out of total?
3. Shoutouts given this week — is there a query for this?
4. Challenges created — available?
5. Games with stats entered — available?
6. Player evals completed — available?
7. Team engagement data (active/drifting/inactive players) — available?
8. Next badge to earn — is there logic for "closest unearned badge"?

### Step 1.4 — Existing engagement components
Search the codebase for any existing engagement-related components that we can reuse:
```
grep -rn "MilestoneCard\|EngagementCard\|XpBar\|LevelCard\|BadgeShowcase\|TeamPulse\|PlayerEngagement" src/
```

**Write findings to `CC-COACH-ENGAGEMENT-COLUMN-REPORT.md`. STOP and wait for review.**

---

## PHASE 2: BUILD THE LAYOUT CHANGE

### Step 2.1 — Modify the dashboard grid
Change the coach dashboard from 2-column to 3-column layout:

**Current (approximate):**
```
grid-template-columns: 1fr 320px;  /* or similar */
```

**New:**
```
grid-template-columns: 1fr 220px 320px;  /* main | engagement | sidebar */
```

Or if using flexbox:
- Main content: `flex: 1` (takes remaining space)
- Engagement column: `width: 220px; flex-shrink: 0;`
- Right sidebar: keep existing width (likely ~320px)

The main content area will naturally shrink. This is fine — the roster table is responsive and will adapt. If the table has fixed-width columns that don't fit, we may need to hide lower-priority columns (like CONTACT) at this width.

### Step 2.2 — Create the engagement column container
Add a new `<div>` between the main content and right sidebar. Give it:
- `width: 220px` (or `flex: 0 0 220px`)
- `display: flex; flex-direction: column; gap: 12px;`
- `padding: 12px 0` (match the padding of the right sidebar)
- Same vertical scroll behavior as the right sidebar if applicable

---

## PHASE 3: BUILD THE 4 ENGAGEMENT CARDS

### Card 1: Coach Level/XP Hero

**Component:** `CoachLevelCard` (new component, create in `src/components/engagement/` or alongside the dashboard)

**Visual spec:**
- Background: `linear-gradient(135deg, #0B1628, #162D50)`
- Border radius: match existing cards (likely `rounded-xl` or 14px)
- Padding: 14px
- All text is white

**Content:**
- Left: Circle with trophy/star icon (40px, border: 1.5px solid #4BB9EC, bg: rgba(75,185,236,0.15))
- Next to it: Level name (e.g., "Rising star") in 14px bold, "Level 4 — 520 / 2K XP" in 11px #94A3B8
- XP progress bar: 4px height, bg rgba(255,255,255,0.1), fill #4BB9EC, width = (currentXP / xpForNextLevel * 100)%
- Bottom right: "Trophy case" link in #FFD700, font-size 11px, navigates to achievements page

**Data needed:**
- Coach's current XP (from user profile or XP system)
- Coach's current level and level name (from the leveling system)
- XP threshold for next level
- Get this from whatever system already powers the bottom-right XP bar

### Card 2: Coaching Activity

**Component:** `CoachActivityCard`

**Visual spec:**
- White background, standard card border
- Header: "YOUR ACTIVITY" (uppercase, 11px, #0F6E56) + "Week" pill (background: #E1F5EE, color: #085041)
- 4 activity rows, each in a rounded surface (#F8FAFC or bg-secondary):
  - Row 1: Shoutout icon (amber bg #FAEEDA) + "Shoutouts" + count (18px bold)
  - Row 2: Checkbox icon (purple bg #EEEDFE) + "Challenges" + count
  - Row 3: Document icon (blue bg #E6F1FB) + "Stats entered" + count
  - Row 4: Person icon (teal bg #E1F5EE) + "Evals done" + count
- Below rows: Gold nudge banner (bg #FAEEDA, text #633806):
  - Star icon + "X more [action] for [Badge Name]"
  - This shows the closest unearned badge and how many more actions are needed

**Data needed:**
- Shoutouts given this week by this coach (query `shoutouts` table or similar)
- Challenges created this week (query `challenges` table)
- Games where this coach entered stats this week (query game stats)
- Player evaluations done this season (query evals table)
- Next closest badge: query `achievements` where `target_role = 'coach'`, compare progress to threshold, find the one closest to completion

**If data queries don't exist yet:** Create placeholder hooks that return mock data. Mark them with `// TODO: wire to real data` comments. The UI should render correctly with mock data so Carlos can see the layout immediately. We'll wire real data in a follow-up spec.

### Card 3: Recent Badges

**Component:** `CoachBadgesCard`

**Visual spec:**
- White card
- Header: "BADGES" (uppercase, 11px) + "15/100" count (right-aligned, blue)
- Grid of badge thumbnails: `grid-template-columns: repeat(5, 32px)`, gap 4px
- Each badge: 32px square, border-radius 6px, background #162D50
- Show the badge thumbnail image (`badge_image_url` with `-thumb` variant)
- Show up to 10 most recently earned, truncated with "..." if more

**Data needed:**
- Coach's earned badges (from `player_achievements` joined with `achievements`)
- Each badge's thumbnail URL

### Card 4: Team Pulse

**Component:** `TeamPulseCard`

**Visual spec:**
- White card, compact
- Header: "TEAM PULSE" (uppercase, 11px)
- Three numbers in a row:
  - Active count in #1D9E75 (green)
  - Drifting count in #EF9F27 (amber)  
  - Inactive count in #E24B4A (red)
- Labels below each: "Active", "Drifting", "Inactive" in 9px gray
- Stacked horizontal bar below (4px height, 3 colored segments proportional to counts)

**Data needed:**
- For each player on the team:
  - "Active" = logged in / had activity within last 7 days
  - "Drifting" = last activity 7-14 days ago
  - "Inactive" = last activity 14+ days ago
- This might come from a user activity/login tracking table, or from XP ledger activity

**If no activity tracking exists:** Use a simpler heuristic — players who have earned any badge or XP in the last 7 days = active. Or mark all as "active" with a TODO to wire real data.

---

## PHASE 4: RESPONSIVE BEHAVIOR

### Step 4.1 — Breakpoint handling
At narrower screen widths, the 3-column layout won't fit. Add responsive behavior:

- **>= 1400px:** Full 3-column layout (main + engagement + sidebar)
- **1100px - 1399px:** 2-column layout — hide the engagement column OR stack it below main content
- **< 1100px:** Single column — everything stacks

Use whatever breakpoint system the project already uses (Tailwind responsive prefixes, CSS media queries, etc.).

### Step 4.2 — Main content table responsiveness
With the narrower main content area, the roster table might lose room. Check if:
- The CONTACT column can be hidden at this width
- Column widths are flexible or fixed
- The table scrolls horizontally if needed

---

## PHASE 5: REMOVE OLD XP BAR

The old XP bar at the bottom of the right sidebar is now redundant (the engagement column has a better version). Remove it:
1. Find where the coach XP bar currently renders in the right sidebar
2. Remove it (the `MilestoneCard` or equivalent component)
3. The right sidebar should now contain only: Next Game, This Week, Playbook, Latest Shoutout

---

## PHASE 6: VERIFICATION

1. `npx tsc --noEmit` — no type errors
2. `npx vite build` — builds clean
3. Visual check at full width — 3 columns render correctly
4. Visual check at 1200px width — responsive behavior works
5. The engagement column cards render with data (even if mock)
6. The right sidebar still looks correct with no XP bar
7. Main content area table is usable at the narrower width
8. "Trophy case" link navigates to achievements page

**Write report to `CC-COACH-ENGAGEMENT-COLUMN-REPORT.md`**

---

## CRITICAL RULES

1. **Do NOT modify the right sidebar cards** (Next Game, This Week, Playbook, Latest Shoutout) — they stay as-is
2. **Do NOT modify the hero banner or nudge card** — they stay full width across the main content area
3. **The hero banner and nudge card should span the full main content width**, NOT extend into the engagement column. Only the tab/roster area below gets narrower.
4. **Actually — look at Carlos's screenshot:** The hero banner and nudge card span the FULL width above both the roster AND the engagement column. The 3-column split starts BELOW the nudge/attention bar. The engagement column sits next to the roster tabs, not next to the hero.
5. **Mock data is acceptable** for this first pass — mark with TODO comments. Getting the layout right is the priority.
6. **Match existing card styles** — same border radius, same shadows (or lack thereof), same padding patterns as the existing right sidebar cards
7. **Commit after Phase 2** (layout change), then after **Phase 3** (cards built), then after **Phase 5** (cleanup)
8. **Use the Lynx design system colors** — navy #0B1628, sky blue #4BB9EC, gold #FFD700 for the hero card only
