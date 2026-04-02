# CC-ENGAGEMENT-LAYOUT-POLISH
## Adjust Admin, Parent, and Team Manager Dashboard Layouts for Engagement Column

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## OVERVIEW

The engagement column is now on all 3 dashboards but it's positioned too low. Carlos wants it to start right below the nudge card on each dashboard, which means content ABOVE the engagement column needs to be narrower (sharing horizontal space with the engagement column) or shorter (taking less vertical space). Each dashboard has specific changes.

**The golden rule:** The engagement column (280px) should start at the SAME vertical level as the first content below the nudge/hero area. Everything below the nudge card shares horizontal space with the engagement column.

---

## ADMIN DASHBOARD

### Layout goal:
```
┌──────────────────────────────────────────────────┐  ┌──────────────────┐
│  HERO BANNER (full width)                        │  │  FINANCIAL       │
├──────────────────────────────────────────────────┤  │  SNAPSHOT        │
│  NUDGE CARD (full width of main area)            │  │  (right sidebar) │
├─────────────────────────────────┬────────────────┤  │                  │
│  ATTENTION BAR (narrower)      │                 │  │                  │
├─────────────────────────────────┤  ENGAGEMENT    │  │                  │
│  ACTIVE SEASONS (narrower,     │  COLUMN        │  ├──────────────────┤
│  shorter cards)                │  280px          │  │  WEEKLY LOAD     │
├─────────────────────────────────┤                │  │                  │
│  SEASON JOURNEY (narrower,     │  - Level Card  │  ├──────────────────┤
│  shorter stepper)              │  - Activity    │  │  ORG HEALTH      │
├─────────────────────────────────┤  - Badges      │  │                  │
│  TABS (Action Items, Teams,    │  - Team Pulse  │  │                  │
│  Registrations, Payments)      │                │  │                  │
└─────────────────────────────────┴────────────────┘  └──────────────────┘
```

### Changes:
1. **Move the engagement column UP** — it should start right below the nudge card, not below the tabs. The inner flex container that wraps `content + engagement column` should include EVERYTHING from the attention bar downward (Active Seasons, Season Journey, Tabs).
   
2. **Attention bar** — reduce width. It's now inside the flex container sharing space with the 280px engagement column. It will naturally get narrower since it's `flex: 1`.

3. **Active Seasons cards** — currently full width horizontal scroll. They should now be constrained to the narrower main content width (excluding the engagement column). Also reduce the card height:
   - Remove some vertical padding on season cards
   - The season cards are currently tall with lots of whitespace. Tighten: reduce padding, make the status pill + date + team/player count more compact. Target: ~30% shorter cards.

4. **Season Journey stepper** — currently very tall with large circles and lots of vertical spacing between the step labels and the progress line. Compact it:
   - Reduce the circle sizes from whatever they are now to ~28px diameter
   - Reduce the vertical padding above and below the stepper
   - The step labels (ORG PROFILE, PAYMENT SETUP, etc.) can be smaller font (10px)
   - Target: ~40% shorter overall height for this section

5. **DO NOT modify the right sidebar** (Financial Snapshot, Weekly Load, Org Health, Playbook) — those stay as-is.

---

## TEAM MANAGER DASHBOARD

### Layout goal:
```
┌──────────────────────────────────────────────────┐  ┌──────────────────┐
│  HERO BANNER (full width)                        │  │  BREAKDOWN       │
├──────────────────────────────────────────────────┤  │  (right sidebar) │
│  NUDGE CARD (full width of main area)            │  │                  │
├─────────────────────────────────┬────────────────┤  ├──────────────────┤
│  ATTENTION BAR (narrower)      │                 │  │  UPCOMING        │
├─────────────────────────────────┤  ENGAGEMENT    │  │                  │
│  GETTING STARTED (narrower,    │  COLUMN        │  ├──────────────────┤
│  more compact)                 │  280px          │  │  PLAYBOOK        │
├─────────────────────────────────┤                │  │                  │
│  TABS (Roster, Payments,       │  - Level Card  │  │                  │
│  Schedule, Attendance)         │  - Activity    │  │                  │
│                                │  - Badges      │  │                  │
│                                │  - Team Pulse  │  │                  │
└─────────────────────────────────┴────────────────┘  └──────────────────┘
```

### Changes:
1. **Move the engagement column UP** — start right below the nudge card. The inner flex container includes the attention bar, Getting Started card, and tabs.

2. **Attention bar** — naturally narrower within the flex container.

3. **Getting Started card** — currently takes full width. Now constrained to the narrower content area. Also compact it slightly:
   - Reduce vertical padding between checklist items
   - The checklist is fine as-is content-wise, just tighten spacing

4. **DO NOT modify the right sidebar** (Breakdown, Upcoming, Playbook) — stays as-is.

---

## PARENT DASHBOARD

This one has the most changes.

### Layout goal:
```
┌──────────────────────────────────────────────────┐  ┌──────────────────┐
│  HERO BANNER (full width)                        │  │  FAMILY BALANCE  │
├──────────────────────────────────────────────────┤  │  (right sidebar) │
│  NUDGE CARD (full width of main area)            │  │                  │
├─────────────────────────────────┬────────────────┤  │                  │
│  ATTENTION BAR (narrower)      │                 │  ├──────────────────┤
├─────────────────────────────────┤  ENGAGEMENT    │  │  BADGE SHOWCASE  │
│  MY PLAYERS (narrower cards)   │  COLUMN        │  │  (REMOVED —      │
│                                │  280px          │  │  now in engage-  │
├─────────────────────────────────┤                │  │  ment column)    │
│  FEED ("Sister earned          │  - Level Card  │  ├──────────────────┤
│   3 badges!")                  │  - Activity    │  │  PLAYBOOK         │
├─────────────────────────────────┤  - Badges      │  ├──────────────────┤
│  TABS (Schedule, Payments,     │  - My Kids     │  │  TEAM CHAT btn   │
│  Forms & Waivers, Report Card) │    Pulse       │  │  TEAM HUB btn    │
└─────────────────────────────────┴────────────────┘  ├──────────────────┤
                                                      │  LATEST SHOUTOUT │
                                                      └──────────────────┘
```

### Changes:

1. **Move nudge card + attention bar** — these should be right below the hero header (they may already be, but confirm). Shorten attention bar width so engagement column can sit next to it.

2. **Move engagement column UP** — starts right below the nudge card. Inner flex container includes everything from attention bar downward.

3. **Remove the "Rookie Tier" card** — this is the card that shows "Rookie Tier / Level 1" with the Lynx mascot in the My Players carousel area. It's redundant now because the engagement column has the Level Card. Find and delete this component/card from the My Players section. It may be the last card in the horizontal player carousel.

4. **My Players cards — make narrower.** The player cards are in a horizontal scroll carousel. The carousel container needs to be constrained to the narrower width (flex: 1 area, not full width). The individual cards might need to be slightly narrower too, or the carousel just scrolls less before overflowing. The cards themselves should keep their current content — just the carousel container gets narrower.

5. **Remove Badge Showcase card from right sidebar.** The Badge Showcase card (showing "Community Builder", "First Shoutout", "Hype Machine" with earned dates) is in the right sidebar. REMOVE IT — this functionality is now handled by the Badges card in the engagement column.

6. **Move Team Chat + Team Hub into right sidebar.** These are currently in the My Players carousel area (the last 2 cards showing Team Chat and Team Hub with icons). Remove them from the carousel and add them as buttons/cards in the right sidebar, positioned UNDER the Playbook card. They can be simple button-style cards:
   ```
   ┌─────────┐  ┌─────────┐
   │ Team    │  │ Team    │
   │ Chat    │  │ Hub     │
   └─────────┘  └─────────┘
   ```
   Or a single card with two buttons inside. Match the Playbook card styling.

7. **Parent "Team Pulse" replacement** — The 4th card in the engagement column for Parent should show "MY KIDS" instead of "TEAM PULSE":
   - For each child registered, show: Child name, team name, level, and activity status (green dot = active, amber = drifting, red = inactive)
   - If this is too complex, keep the standard Team Pulse for now with a TODO to customize

---

## IMPLEMENTATION ORDER

Do these one at a time, committing after each:

### Step 1: Admin dashboard layout adjustments
- Move engagement column up (flex container starts below nudge)
- Compact Active Seasons cards (reduce height ~30%)
- Compact Season Journey stepper (reduce height ~40%)
- Verify dashboard loads, no errors
- **Commit:** `fix: admin dashboard - move engagement column up, compact season cards and journey stepper`

### Step 2: Team Manager dashboard layout adjustments
- Move engagement column up (flex container starts below nudge)
- Compact Getting Started card spacing
- Verify dashboard loads, no errors
- **Commit:** `fix: tm dashboard - move engagement column up, compact getting started`

### Step 3: Parent dashboard layout adjustments
- Move engagement column up (flex container starts below nudge)
- Remove Rookie Tier card from player carousel
- Remove Badge Showcase from right sidebar
- Move Team Chat + Team Hub into right sidebar under Playbook
- Narrow My Players carousel container
- Verify dashboard loads, no errors
- **Commit:** `fix: parent dashboard - reorganize layout, move engagement column up, relocate team chat/hub`

---

## VERIFICATION FOR EACH DASHBOARD

1. `npx vite build` — no errors
2. Dashboard loads without React crashes
3. Engagement column starts at the same vertical level as the first content below the nudge card
4. Engagement column is 280px wide, NOT in the right sidebar
5. Right sidebar is unchanged (except Parent where Badge Showcase removed and Team Chat/Hub added)
6. All cards render with data (real or mock fallback)
7. No content overflows or overlaps

---

## CRITICAL RULES

1. ❌ DO NOT modify the engagement column cards themselves — they're working, just repositioning them
2. ❌ DO NOT modify the hero banners
3. ❌ DO NOT break any existing functionality (tabs, roster, payments, etc.)
4. ❌ DO NOT add new Supabase queries — we're just moving things around
5. ✅ DO commit after each dashboard change (3 separate commits)
6. ✅ DO verify the dashboard loads before committing
7. ✅ DO match existing styling when moving Team Chat/Hub to the right sidebar
8. ✅ DO handle the Active Seasons horizontal scroll at the narrower width gracefully

**Write report to `CC-ENGAGEMENT-LAYOUT-POLISH-REPORT.md`**
