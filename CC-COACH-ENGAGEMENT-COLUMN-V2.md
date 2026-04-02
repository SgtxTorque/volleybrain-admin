# CC-COACH-ENGAGEMENT-COLUMN-V2
## Add Engagement Column to Coach Dashboard — LAYOUT FIX

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## WHAT WENT WRONG LAST TIME

You put the engagement cards INSIDE the existing right sidebar. That is WRONG. The engagement cards need to be in their OWN SEPARATE COLUMN — a brand new column that does not exist yet. The dashboard needs THREE columns of content, not two.

---

## THE LAYOUT — READ THIS VERY CAREFULLY

### Current layout (2 columns):
```
┌──────────────────────────────────────┐  ┌──────────────────┐
│          MAIN CONTENT                │  │  RIGHT SIDEBAR   │
│  (hero, nudge, roster tabs)          │  │  (Next Game,     │
│                                      │  │   This Week,     │
│                                      │  │   Playbook,      │
│                                      │  │   Shoutout,      │
│                                      │  │   XP bar)        │
└──────────────────────────────────────┘  └──────────────────┘
```

### New layout (3 columns):
```
┌────────────────────────────┐  ┌──────────────┐  ┌──────────────────┐
│       MAIN CONTENT         │  │  ENGAGEMENT   │  │  RIGHT SIDEBAR   │
│  (hero, nudge, roster)     │  │   COLUMN      │  │  (Next Game,     │
│                            │  │  (NEW - does  │  │   This Week,     │
│  This column gets          │  │   not exist   │  │   Playbook,      │
│  NARROWER to make room     │  │   yet. YOU    │  │   Shoutout)      │
│                            │  │   CREATE IT)  │  │                  │
│                            │  │              │  │  This column     │
│                            │  │  ~220px wide  │  │  stays EXACTLY   │
│                            │  │              │  │  as it is now    │
└────────────────────────────┘  └──────────────┘  └──────────────────┘
```

### The vertical split point:
The hero banner and nudge card span the FULL width of the main content area (column 1 only). The 3-column split starts at the tabs/roster level. Here's the vertical breakdown:

```
┌────────────────────────────────────────┐  ┌──────────────────┐
│  HERO BANNER (full main width)         │  │                  │
├────────────────────────────────────────┤  │  RIGHT SIDEBAR   │
│  NUDGE CARD (full main width)          │  │  (spans full     │
├────────────────────────────────────────┤  │   height)        │
│  ATTENTION BAR (full main width)       │  │                  │
├──────────────────────┬─────────────────┤  │                  │
│  ROSTER / TABS       │  ENGAGEMENT     │  │                  │
│  (gets narrower)     │  COLUMN (new)   │  │                  │
│                      │  ~220px         │  │                  │
│                      │                 │  │                  │
└──────────────────────┴─────────────────┘  └──────────────────┘
```

---

## PHASE 1: INVESTIGATION

### Step 1.1 — Show me the current CoachDashboard layout code
Open `src/pages/roles/CoachDashboard.jsx` and show me:
1. The EXACT JSX that creates the 2-column layout (the outermost grid/flex container)
2. The EXACT CSS/Tailwind classes on that container
3. What wraps the main content (left column)
4. What wraps the right sidebar (right column)
5. Show me the actual code — lines numbers and all

### Step 1.2 — Identify the split point
Inside the main content column, find where the tabs/roster section starts. Show me:
1. Where the hero banner ends
2. Where the nudge card ends
3. Where the attention bar ends
4. Where the tabs (Roster, Schedule, Stats & Evals, Game Prep, Engagement) begin
5. We need to wrap everything FROM the tabs downward in a new flex container that will hold both the tabs AND the engagement column side by side

### Step 1.3 — Show current right sidebar contents
List every component in the right sidebar, in order. Confirm none of the engagement cards from the failed attempt are still in there. If they are, REMOVE THEM FIRST before proceeding.

**Write findings to `CC-COACH-ENGAGEMENT-COLUMN-V2-REPORT.md`. STOP and wait for review.**

---

## PHASE 2: REVERT ANY PREVIOUS DAMAGE

Before building anything new:
1. Remove ALL engagement card components that were added to the right sidebar in the previous attempt
2. Remove the old XP/MilestoneCard from the right sidebar (it's being replaced)
3. Verify the coach dashboard renders without errors
4. Commit: `fix: revert broken engagement column attempt, clean slate`

---

## PHASE 3: BUILD THE NEW LAYOUT

### Step 3.1 — Create the inner flex container

Find where the tabs/roster section starts in the main content column. Wrap the tabs/roster section AND a new engagement column div in a flex container:

**Before (pseudocode):**
```jsx
<div className="main-content-column">
  <HeroBanner />
  <NudgeCard />
  <AttentionBar />
  <TabsAndRoster />   {/* This is the part that needs to share space */}
</div>
<div className="right-sidebar">
  <NextGame />
  <ThisWeek />
  <Playbook />
  <Shoutout />
</div>
```

**After (pseudocode):**
```jsx
<div className="main-content-column">
  <HeroBanner />
  <NudgeCard />
  <AttentionBar />
  
  {/* NEW: Inner flex container for roster + engagement */}
  <div style={{ display: 'flex', gap: '16px' }}>
    
    {/* Roster/tabs takes remaining space */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <TabsAndRoster />
    </div>
    
    {/* NEW: Engagement column - fixed width */}
    <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <CoachLevelCard />
      <CoachActivityCard />
      <CoachBadgesCard />
      <TeamPulseCard />
    </div>
    
  </div>
</div>
<div className="right-sidebar">
  {/* UNCHANGED — do not touch these */}
  <NextGame />
  <ThisWeek />
  <Playbook />
  <Shoutout />
</div>
```

### KEY RULES FOR THE LAYOUT:
1. The engagement column is INSIDE the main content area, NOT inside the right sidebar
2. The engagement column sits to the RIGHT of the tabs/roster, to the LEFT of the right sidebar
3. The hero banner, nudge card, and attention bar remain FULL WIDTH within the main content area — they do NOT share space with the engagement column
4. Use `flex: 1; min-width: 0;` on the roster section so it shrinks to accommodate the engagement column
5. Use `width: 220px; flex-shrink: 0;` on the engagement column so it stays fixed width
6. The overall page-level grid (main + sidebar) stays UNCHANGED — still 2 columns. The 3-column effect comes from the INNER flex split within the main content area

---

## PHASE 4: BUILD THE 4 ENGAGEMENT CARDS

All cards use MOCK DATA. Hardcoded values. No Supabase queries. Mark data with `{/* TODO: wire to real data */}`.

### Card 1: CoachLevelCard
```jsx
// File: src/components/engagement/CoachLevelCard.jsx (or inline in dashboard)

// Visual: Navy gradient card
// Background: linear-gradient(135deg, #0B1628, #162D50)
// Border radius: match existing cards
// Padding: 14px
// All text white

// Content:
// - Lynx mascot or star icon (40px circle, border: 1.5px solid #4BB9EC)
// - "Rising Star" — 14px bold white
// - "Level 4 — 520 / 2K XP" — 11px #94A3B8
// - XP bar: 4px tall, bg rgba(255,255,255,0.1), fill #4BB9EC at 26% width
// - "Trophy case →" link in #FFD700, 11px, onClick navigates to achievements

const xp = 520;           // TODO: wire to real data
const maxXp = 2000;       // TODO: wire to real data
const level = 4;          // TODO: wire to real data
const levelName = "Rising Star"; // TODO: wire to real data
```

### Card 2: CoachActivityCard
```jsx
// Visual: White card, standard border
// Header: "YOUR ACTIVITY" (11px uppercase #0F6E56) + "Week" pill (#E1F5EE bg, #085041 text)

// 4 rows, each in a #F8FAFC rounded surface:
// Row 1: ⭐ amber icon bg (#FAEEDA) | "Shoutouts" | 2    (bold 16px)
// Row 2: ✅ purple icon bg (#EEEDFE) | "Challenges" | 3
// Row 3: 📋 blue icon bg (#E6F1FB) | "Stats entered" | 1
// Row 4: 👤 teal icon bg (#E1F5EE) | "Evals done" | 0

// Gold nudge bar at bottom:
// bg #FAEEDA, rounded, padding 6px 10px
// ⭐ icon + "3 more shoutouts for Hype Coach" in #633806, 11px
// "Hype Coach" is bold

const shoutouts = 2;     // TODO: wire to real data
const challenges = 3;    // TODO: wire to real data
const statsEntered = 1;  // TODO: wire to real data
const evalsDone = 0;     // TODO: wire to real data
const nextBadgeName = "Hype Coach";      // TODO: wire to real data
const nextBadgeAction = "shoutouts";     // TODO: wire to real data
const nextBadgeRemaining = 3;            // TODO: wire to real data
```

### Card 3: CoachBadgesCard
```jsx
// Visual: White card
// Header: "BADGES" (11px uppercase) + "5/42" (right-aligned, #378ADD)
// Grid: 5 columns of 32px badge squares
// Each badge: 32px, border-radius 6px, bg #162D50
// For now, render 5 dark navy squares as placeholders
// "View all →" link below grid in #378ADD, 11px

const earnedCount = 5;   // TODO: wire to real data
const totalCount = 42;   // TODO: wire to real data
```

### Card 4: TeamPulseCard
```jsx
// Visual: White card, compact
// Header: "TEAM PULSE" (11px uppercase)
// Three numbers in a row:
//   8 (green #1D9E75) "Active"
//   3 (amber #EF9F27) "Drifting"
//   1 (red #E24B4A) "Inactive"
// Labels in 9px gray below each
// Stacked bar: 4px height, 3 segments (67% green, 25% amber, 8% red)

const active = 8;     // TODO: wire to real data
const drifting = 3;   // TODO: wire to real data
const inactive = 1;   // TODO: wire to real data
```

---

## PHASE 5: VERIFICATION

1. `npx tsc --noEmit` — no type errors
2. `npx vite build` — builds clean
3. **CRITICAL:** The coach dashboard loads without any React errors
4. The layout shows 3 visual columns:
   - Left: Hero + nudge + tabs/roster (narrower than before)
   - Middle: 4 engagement cards stacked vertically
   - Right: Next Game + This Week + Playbook + Shoutout (unchanged)
5. The hero banner and nudge card are WIDER than the roster — they don't share space with engagement column
6. The engagement column does NOT appear inside the right sidebar
7. The roster table is usable at the narrower width (columns may be tighter but readable)

### Responsive note
If the engagement column makes things too tight below 1200px, hide it with a media query:
```css
@media (max-width: 1200px) {
  .engagement-column { display: none; }
}
```

---

## PHASE 6: COMMIT AND PUSH

Commit: `feat: add coach engagement column with 3-column layout (mock data)`
Push to branch.

**Write report to `CC-COACH-ENGAGEMENT-COLUMN-V2-REPORT.md` including:**
- Screenshot or description of the 3-column layout
- The actual JSX for the inner flex container (paste the code)
- Confirmation that engagement cards are NOT in the right sidebar
- Build status
- Any responsive concerns

---

## DO NOT:
- ❌ Put engagement cards in the right sidebar
- ❌ Write any Supabase queries — ALL DATA IS MOCK/HARDCODED
- ❌ Modify the right sidebar in any way
- ❌ Modify the hero banner or nudge card
- ❌ Add new npm dependencies
- ❌ Touch any file other than CoachDashboard.jsx and new component files

## DO:
- ✅ Create a NEW flex container inside the main content column
- ✅ Put tabs/roster on the left of that flex container
- ✅ Put engagement cards on the right of that flex container (220px fixed)
- ✅ Use hardcoded mock data everywhere
- ✅ Match existing card styling (border radius, borders, padding)
- ✅ Make sure the dashboard LOADS without errors before committing
