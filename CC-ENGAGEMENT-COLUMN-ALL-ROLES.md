# CC-ENGAGEMENT-COLUMN-ALL-ROLES
## Add Engagement Column to Admin, Parent, and Team Manager Dashboards

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## CONTEXT

The Coach dashboard now has a working engagement column (280px, 4 cards, real data). We need to replicate this same pattern for Admin, Parent, and Team Manager dashboards. Same 4-card structure, same layout approach, role-specific activity rows.

**Reference:** Look at how the Coach dashboard engagement column is built in `CoachDashboard.jsx`. The pattern is:
- Inner flex container wraps the tabs/content area + engagement column side by side
- Engagement column is 280px fixed width, flexShrink: 0
- Hero banner, nudge card, attention bar stay full width ABOVE the flex split
- 4 cards stack vertically: Level Card → Activity Card → Badges Card → Team Pulse Card

---

## THE LAYOUT RULE (same as Coach — DO NOT put cards in the right sidebar)

```
Main content column:
┌────────────────────────────────────────┐
│  HERO BANNER (full width)              │
│  NUDGE/ALERT CARDS (full width)        │
├──────────────────────┬─────────────────┤
│  MAIN TABS/CONTENT   │  ENGAGEMENT     │
│  (flex: 1)           │  COLUMN (280px) │
└──────────────────────┴─────────────────┘
```

The right sidebar (if the role has one) stays completely untouched.

---

## PHASE 1: INVESTIGATION

### Step 1.1 — Examine each dashboard file
For each of these 3 dashboards, show me:
1. The file path and the overall layout structure (grid/flex, column count)
2. Where the hero/banner section ends and the main content tabs begin
3. Whether there's a right sidebar and what's in it
4. Whether there's already an XP bar or MilestoneCard that should be removed

Files to check:
- Admin dashboard: likely `src/pages/roles/AdminDashboard.jsx` or similar
- Parent dashboard: likely `src/pages/roles/ParentDashboard.jsx` or similar
- Team Manager dashboard: likely `src/pages/roles/TeamManagerDashboard.jsx` or similar

### Step 1.2 — Check what engagement components already exist
The Coach dashboard created reusable components (or inline JSX). Check if `CoachLevelCard`, `CoachActivityCard`, `CoachBadgesCard`, `TeamPulseCard` are separate components we can reuse, or if they're inline in CoachDashboard.jsx.

If they're inline, we should extract them into shared components first.

### Step 1.3 — Check available data per role
For each role, check what data hooks/queries already exist:
- XP and level data (from profile)
- Shoutouts given/received
- Badges earned
- Role-specific activity metrics

**Write findings to `CC-ENGAGEMENT-COLUMN-ALL-ROLES-REPORT.md`. STOP and wait for review.**

---

## PHASE 2: EXTRACT SHARED COMPONENTS (if needed)

If the engagement cards are inline in CoachDashboard.jsx, extract them into reusable components:

Create in `src/components/engagement/`:
- `EngagementLevelCard.jsx` — The navy gradient level/XP card
- `EngagementActivityCard.jsx` — The "Your Activity" card (accepts activity rows as props)
- `EngagementBadgesCard.jsx` — The badges grid card
- `EngagementTeamPulseCard.jsx` — The active/drifting/inactive card

Each component should accept props for its data, not fetch data internally. The dashboard passes data down.

**Props interface for ActivityCard:**
```jsx
// activities = array of { icon, iconBg, label, count }
// nextBadgeHint = string like "3 more shoutouts for Hype Coach"
<EngagementActivityCard activities={[...]} nextBadgeHint="..." />
```

After extracting, verify CoachDashboard still works with the extracted components.

**Commit:** `refactor: extract engagement cards into shared components`

---

## PHASE 3: ADD ENGAGEMENT COLUMN TO EACH DASHBOARD

### 3A — Admin Dashboard

**Layout change:** Same inner flex container pattern as Coach. Find where the main content/tabs start, wrap in flex with engagement column.

**Activity rows for Admin:**
```
Row 1: "Blasts sent" — icon: megaphone (amber bg) — count from blasts/announcements this week
Row 2: "Registrations" — icon: clipboard (purple bg) — count of new registrations this week
Row 3: "Revenue" — icon: dollar (blue bg) — revenue collected this week or season
Row 4: "Teams managed" — icon: people (teal bg) — total active teams
```

**Data queries (try real, fallback to mock):**
- XP/Level: `profile?.total_xp` (same as coach)
- Badges: `player_achievements` joined with `achievements` where user is admin
- Blasts sent this week: query announcements/blasts table
- Registrations this week: query registrations table
- Revenue: query payments table
- Teams: count of active teams in org
- Team Pulse: active/drifting/inactive based on org-wide player activity

**If queries fail or tables don't exist, use mock data with TODO comments.**

### 3B — Parent Dashboard

**Layout change:** Same pattern. The Parent dashboard already has a right sidebar with Family Balance, Badge Showcase, Playbook, Latest Shoutout. The engagement column goes BETWEEN the main content and that right sidebar (inside the main content area, same as Coach).

**Activity rows for Parent:**
```
Row 1: "RSVPs submitted" — icon: calendar check (amber bg) — RSVPs this week
Row 2: "Shoutouts given" — icon: star burst (purple bg) — shoutouts given this week
Row 3: "Photos uploaded" — icon: camera (blue bg) — photos uploaded this week
Row 4: "Volunteer signups" — icon: hand raise (teal bg) — volunteer signups this season
```

**Data queries:**
- XP/Level: `profile?.total_xp`
- Badges: `player_achievements` for this parent user
- RSVPs: query RSVP data for this parent's children
- Shoutouts: query shoutouts given by this user
- Photos: query photo uploads by this user
- Volunteers: query volunteer signups
- Team Pulse: not applicable for parent — replace with "My Kids' Activity" showing per-child engagement status

**Parent Team Pulse alternative — "My Kids":**
Instead of Active/Drifting/Inactive across a team, show each child's engagement status:
```
Child 1 name — Level X — Active ●
Child 2 name — Level X — Drifting ●
```
This is more relevant for a parent. If this is too complex for now, just show the standard Team Pulse with the parent's primary team.

### 3C — Team Manager Dashboard

**Layout change:** Same pattern as Coach.

**Activity rows for Team Manager:**
```
Row 1: "Events created" — icon: calendar (amber bg) — events created this week
Row 2: "Blasts sent" — icon: megaphone (purple bg) — blasts/messages sent this week
Row 3: "Payments tracked" — icon: dollar (blue bg) — payments processed this week
Row 4: "Waivers collected" — icon: document check (teal bg) — waivers completed this season
```

**Data queries:**
- XP/Level: `profile?.total_xp`
- Badges: `player_achievements` for this TM user
- Events: query schedule_events created by this user this week
- Blasts: query blasts/announcements sent this week
- Payments: query payment activity this week
- Waivers: query waiver completion status
- Team Pulse: same as Coach — active/drifting/inactive players on managed team

---

## PHASE 4: REMOVE OLD ENGAGEMENT ARTIFACTS

For each dashboard, remove any old engagement treatment that's now redundant:
- Remove old MilestoneCard / XP bar if it exists
- Remove old "Team Progress 0/100 XP" card from TM dashboard
- Do NOT remove the Parent's Badge Showcase on the right sidebar — that's separate and stays

---

## PHASE 5: VERIFICATION

For EACH of the 3 dashboards:
1. `npx tsc --noEmit` — no type errors
2. `npx vite build` — builds clean
3. Dashboard loads without React errors
4. Engagement column appears as its OWN column (280px) between main content and right sidebar
5. Engagement column is NOT inside the right sidebar
6. Level card shows XP and level data
7. Activity card shows 4 rows with counts
8. Badges card shows badge thumbnails or placeholders
9. Team Pulse shows active/drifting/inactive
10. Right sidebar is unchanged
11. Hero banner stays full width

**Commit after each dashboard works:** 
- `feat: add engagement column to admin dashboard`
- `feat: add engagement column to parent dashboard`
- `feat: add engagement column to team manager dashboard`

**Write report to `CC-ENGAGEMENT-COLUMN-ALL-ROLES-REPORT.md`**

---

## CRITICAL RULES

1. ❌ DO NOT put engagement cards in the right sidebar
2. ❌ DO NOT use useMemo for computed engagement values — use plain variables after early returns
3. ❌ DO NOT crash the dashboard — all queries in try/catch with fallbacks
4. ❌ DO NOT modify the Coach dashboard — it's already done
5. ❌ DO NOT modify any right sidebar cards
6. ✅ DO extract shared components if engagement cards are currently inline in CoachDashboard
7. ✅ DO use the same 280px width and same card styling as Coach
8. ✅ DO try real Supabase queries first, fall back to mock with TODO if table/column doesn't exist
9. ✅ DO place all useState hooks BEFORE any early returns
10. ✅ DO commit after each dashboard is working (not all at once)
