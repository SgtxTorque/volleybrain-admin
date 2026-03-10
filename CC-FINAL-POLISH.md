# CC-FINAL-POLISH — Responsive Behavior, Parent Cards, Player Data, UX Cleanup

**Spec Author:** Claude Opus 4.6
**Date:** March 8, 2026
**Branch:** `main`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## CRITICAL RULE

**Before fixing ANY data query, find the WORKING page that already shows the same data. Read its exact Supabase query. Copy that pattern. Check the mobile repo (`volleybrain-mobile3`) if the web doesn't have a working version.**

---

## PHASE 1: Responsive Behavior — Smart Breakpoints

### The Problem
When the browser window gets small, the grid stays fixed and content gets smushed with no horizontal scroll. When expanded back, it doesn't reflow properly. We need smarter behavior at different screen sizes.

### Step 1.1: Read current grid and breakpoint setup

```bash
cat src/components/layout/DashboardGrid.jsx
grep -r "breakpoint\|cols\|Responsive" src/components/layout/DashboardGrid.jsx | head -20
```

### Step 1.2: Implement proper responsive behavior

**Large screens (≥1200px — "lg"):** Normal dashboard layout. 24 columns. Carlos's custom arrangements.

**Medium screens (768px–1199px — "md"):** Cards should reflow to fewer columns. Instead of 3-column layouts, go to 2 columns. Instead of side-by-side widgets, stack them. The grid should use 12 columns at this breakpoint so cards take up more relative width.

**Small screens (480px–767px — "sm"):** Single column stack. Every card goes full-width, stacked vertically. This mimics the mobile scroll experience. 6 columns, every card `w: 6` (full width).

**Very small / phone (< 480px — "xs"):** Same as small but with tighter padding. Show a subtle "For the best experience, use the Lynx app" banner at the top with a link to download.

```jsx
<Responsive
  width={containerWidth}
  layouts={{
    lg: savedLayout || defaultLayout,
    md: generateMediumLayout(savedLayout || defaultLayout),
    sm: generateStackedLayout(savedLayout || defaultLayout),
    xs: generateStackedLayout(savedLayout || defaultLayout),
  }}
  breakpoints={{ lg: 1200, md: 768, sm: 480, xs: 0 }}
  cols={{ lg: 24, md: 12, sm: 6, xs: 4 }}
  ...
>
```

### Step 1.3: Auto-generate breakpoint layouts

Create helper functions that derive medium/small layouts from the lg layout:

```jsx
function generateMediumLayout(lgLayout) {
  // Take the lg layout and reflow for 12 columns
  // Cards that were side-by-side go to stacked
  // Preserve the vertical order from lg layout (sort by y, then x)
  const sorted = [...lgLayout].sort((a, b) => a.y - b.y || a.x - b.x);
  let currentY = 0;
  return sorted.map(item => {
    const w = Math.min(12, Math.max(6, Math.round(item.w / 2)));
    const result = { ...item, x: 0, y: currentY, w: 12 }; // full width at medium
    currentY += item.h;
    return result;
  });
}

function generateStackedLayout(lgLayout) {
  // Everything single column, stacked
  const sorted = [...lgLayout].sort((a, b) => a.y - b.y || a.x - b.x);
  let currentY = 0;
  return sorted.map(item => {
    const result = { ...item, x: 0, y: currentY, w: 6, minW: 4 };
    currentY += item.h;
    return result;
  });
}
```

### Step 1.4: Add horizontal scroll as fallback

If someone resizes to an odd width that doesn't match any breakpoint cleanly, add a minimum width to prevent content from getting smushed below usability:

```jsx
// On the main content area wrapper (in MainApp or wherever the sidebar + content layout is)
<div className="flex-1 min-w-[480px] overflow-x-auto">
  {/* Dashboard content */}
</div>
```

This means: at very narrow widths, a horizontal scrollbar appears instead of smushing. Not ideal, but better than broken layout.

### Step 1.5: "Use the Lynx app" banner for phone-sized screens

```jsx
{containerWidth < 480 && (
  <div className="bg-lynx-navy text-white text-center py-3 px-4 text-r-sm">
    📱 For the best experience, <a href="https://thelynxapp.com/download" className="text-lynx-sky font-bold underline">download the Lynx app</a>
  </div>
)}
```

**Commit:** `git add -A && git commit -m "phase 1: smart responsive breakpoints — medium stacks, small full-width, min-width fallback"`

---

## PHASE 2: Parent Player Cards — Carousel + Profile Access

### Step 2.1: Read current player card component

```bash
find src/components/parent -name "*Athlete*" -o -name "*Child*" -o -name "*PlayerCard*" | head -10
cat [found files]
```

### Step 2.2: Convert to horizontal carousel

The player card strip needs to handle 1 child elegantly AND 9 children. Replace the current horizontal row with a proper carousel:

- Use CSS scroll-snap for smooth carousel behavior:
```jsx
<div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 px-1">
  {children.map(child => (
    <div key={child.id} className="snap-start flex-shrink-0 w-[200px]">
      <ChildCard child={child} selected={selectedChildId === child.id} onClick={() => selectChild(child.id)} />
    </div>
  ))}
  <div className="snap-start flex-shrink-0 w-[200px]">
    <AddChildCard />
  </div>
</div>
```

- If more than 4 children: show left/right arrow buttons on the edges of the carousel
- Current child is visually highlighted (border, scale, glow)
- Smooth scroll to selected child on selection change

### Step 2.3: Add "View Profile" button to each child card

Each child card needs a way to navigate to that child's full profile page. Add a button or make the card click behavior two-fold:

- **Single click:** Select this child (updates dashboard widgets below)
- **"View Profile" button** inside or below each card: navigates to the player profile page

```jsx
<button
  onClick={(e) => {
    e.stopPropagation(); // Don't trigger card selection
    navigate(`/players/${child.player_id}`);
  }}
  className="mt-2 w-full bg-white/20 text-white text-r-xs font-bold py-1.5 rounded-lg hover:bg-white/30 transition-colors"
>
  View Profile →
</button>
```

The profile page should show: registration info, development stats, game recaps, evaluations, leaderboard position, trophies, teammates. Check what the existing player profile page renders:
```bash
find src/pages -name "*PlayerProfile*" -o -name "*player-profile*" | head -5
cat [found file]
```

If the profile page is missing sections that the mobile app has (stats, game recaps, leaderboards, trophies, teammates), note them as follow-up items.

### Step 2.4: Truncation fix

Child names "Siste..." should show full first name. Increase card width from current to `w-[200px]` minimum, or reduce other content to give the name more room.

**Commit:** `git add -A && git commit -m "phase 2: parent player cards — carousel, view profile button, full names"`

---

## PHASE 3: Action Required Card — Clean Disappearance

### Step 3.1: Read the action required component

```bash
grep -r "ActionRequired\|action-required\|ACTION_REQUIRED\|All caught up" src/components/ --include="*.jsx" -l | head -10
cat [found file]
```

### Step 3.2: Fix progressive disclosure

When there are ZERO action items, the card should NOT render at all. No "All caught up!" message. No empty card. The card simply doesn't exist, and the space collapses.

```jsx
// The widget should return null when empty
if (!actionItems || actionItems.length === 0) {
  return null;
}
```

In the DashboardGrid, if a widget returns null, the grid item should collapse. Check if react-grid-layout handles null children — if not, the widget array should be filtered to exclude widgets with no content:

```jsx
const activeWidgets = useMemo(() => {
  return allWidgets.filter(w => {
    if (w.id === 'action-required' && actionItems.length === 0) return false;
    if (w.id === 'balance-due' && balanceDue <= 0) return false;
    // ... other conditional widgets
    return true;
  });
}, [actionItems, balanceDue, ...]);
```

The "All caught up" celebration should be a brief TOAST notification that fades out after 3 seconds, not a persistent card.

**Commit:** `git add -A && git commit -m "phase 3: action required disappears when empty — no lingering card"`

---

## PHASE 4: Season Onboarding vs Alerts/Registration

### Step 4.1: Make the onboarding tracker area dual-purpose

Carlos asked: where do alerts and open registration announcements show up? The season onboarding tracker slot is the right place.

The card at the top of the parent dashboard should rotate between:

1. **Season Onboarding Tracker** — when the parent has incomplete onboarding steps
2. **Open Registration Alert** — when there are open registrations the parent hasn't signed up for
3. **Org Alerts/Announcements** — admin blasts or important notifications
4. **Nothing** — when all steps are done, no alerts, no open registrations (progressive disclosure)

```jsx
function ParentTopBanner({ onboardingSteps, openRegistrations, alerts }) {
  // Priority: alerts first, then open registrations, then onboarding
  if (alerts?.length > 0) {
    return <AlertBanner alerts={alerts} />;
  }
  if (openRegistrations?.length > 0) {
    return <OpenRegistrationBanner registrations={openRegistrations} />;
  }
  if (onboardingSteps && !onboardingSteps.allComplete) {
    return <SeasonOnboardingTracker steps={onboardingSteps} />;
  }
  return null; // nothing to show
}
```

For open registrations, query:
```bash
# Find how the mobile app checks for open registrations
grep -r "open.*registration\|registration.*open\|registration.*available" src/ --include="*.jsx" | grep "from\|select" | head -10
```

**Commit:** `git add -A && git commit -m "phase 4: parent top banner — rotates between onboarding, open registrations, and alerts"`

---

## PHASE 5: Player Dashboard — Real Data Wiring

### The Problem
The player dashboard shows placeholder data even when viewing as a specific player (admin "Viewing as Ava Test"). The mobile app shows real stats for the same player. The web queries are wrong.

### Step 5.1: Find what the mobile app queries

```bash
# Clone mobile if not available
if [ ! -d /tmp/mobile-ref ]; then
  git clone https://github.com/SgtxTorque/volleybrain-mobile3.git /tmp/mobile-ref
fi

# Find how mobile loads player dashboard data
find /tmp/mobile-ref/src -name "*PlayerHome*" -o -name "*player*dashboard*" -o -name "*PlayerDash*" | head -10
grep -r "\.from(" /tmp/mobile-ref/src/screens/player/ --include="*.jsx" --include="*.tsx" 2>/dev/null | head -30
grep -r "\.from(" /tmp/mobile-ref/src/components/player/ --include="*.jsx" --include="*.tsx" 2>/dev/null | head -30

# Find how mobile loads evaluations
grep -r "evaluation\|player_evaluations\|skill_scores" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" | grep "from\|select" | head -20

# Find how mobile loads game stats
grep -r "game_stats\|player_stats\|game.*stat" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" | grep "from\|select" | head -20

# Find how mobile loads leaderboard
grep -r "leaderboard\|ranking\|top.*player" /tmp/mobile-ref/src/ --include="*.jsx" --include="*.tsx" | grep "from\|select" | head -20
```

### Step 5.2: Wire each player widget to real data

For EACH widget on the player dashboard, copy the mobile app's query:

**Scouting Report (skill bars):**
- Find the mobile evaluation query
- Copy it to the web's scouting report component
- The scores should show actual evaluation numbers (1-5 or 1-10), not all "1"

**Trophy Case:**
- Find how mobile queries player_achievements or user_achievements
- Copy to web
- Show earned badges with correct icons and rarity tiers

**Today XP:**
- Find how mobile calculates XP earned today
- Copy to web

**Last Game Stats:**
- Find how mobile queries the most recent game's stats for a player
- Copy to web
- Should show: kills, aces, digs, blocks, etc.

**Team Chat:**
- Already fixed — verify it works on player dashboard too

**Daily Challenge:**
- Find how mobile queries active challenges for a player
- Copy to web

### Step 5.3: Fix "Viewing as" mode for admins

When an admin clicks "Viewing as Ava Test", the player dashboard should query data for Ava Test's player_id, not the admin's user_id. Check:

```bash
grep -r "viewing.*as\|viewAs\|impersonate\|switchPlayer" src/ --include="*.jsx" | head -20
```

The player_id used in all queries should come from the "viewing as" context, not auth.uid(). Verify this is wired correctly.

### Step 5.4: Add missing player sections

Check if these exist on the web player profile/dashboard. If not, add them (or note as follow-up):
- Game recaps (recent games with scores and stats)
- Leaderboard position (player's rank among teammates)
- Teammates list (other players on their team)
- Evaluation history (trend over time)

At minimum, wire the data that already exists on mobile.

**Commit:** `git add -A && git commit -m "phase 5: player dashboard — real data from mobile query patterns, viewing-as fix"`

---

## PHASE 6: Floating Chat + Team Hub Filters

### Step 6.1: Move floating chat to dashboard welcome area

Carlos wants the chat bubble near the welcome message, not in the bottom corner. Find a better placement:

- Option: small chat icon/link to the RIGHT of the welcome banner text
- Or: include it as part of the welcome card widget content
- Make it available on ALL role dashboards (admin, coach, parent), not just admin
- Shows unread count badge
- Click navigates to chat page

### Step 6.2: Team Hub filters

Check the Team Hub / Team Wall page for season/sport/team filters:
```bash
cat src/pages/teams/TeamWallPage.jsx | head -30
```

If the global `SeasonFilterBar` from Phase 2 of CC-COMPREHENSIVE-FIX was added to all admin pages, verify it's also on the Team Wall/Hub page. If not, add it.

**Commit:** `git add -A && git commit -m "phase 6: chat access on welcome banner, team hub filters"`

---

## PHASE 7: Multi-Team Player Experience

### Step 7.1: Check if players can be on multiple teams

```bash
grep -r "team_players\|roster_entries\|player.*team" src/ --include="*.jsx" | grep "from\|select" | head -20
```

### Step 7.2: Add team switcher for multi-team players

If a player is on multiple teams (e.g., volleyball AND basketball), add a team selector above the player dashboard:

```jsx
{playerTeams.length > 1 && (
  <div className="flex gap-2 mb-4">
    {playerTeams.map(team => (
      <button
        key={team.id}
        onClick={() => setSelectedTeamId(team.id)}
        className={`px-4 py-2 rounded-xl border-2 text-r-sm font-bold transition-all ${
          selectedTeamId === team.id
            ? 'border-lynx-sky bg-lynx-sky/10 text-lynx-sky'
            : 'border-slate-600 text-slate-400 hover:border-slate-500'
        }`}
      >
        {team.name}
      </button>
    ))}
  </div>
)}
```

All player dashboard widgets update based on selectedTeamId.

**Commit:** `git add -A && git commit -m "phase 7: multi-team player switcher on player dashboard"`

---

## PHASE 8: Verify Everything

```bash
npx tsc --noEmit
npm run build
```

**Responsive:**
- [ ] Resize window from large to small: cards stack vertically at medium/small breakpoints
- [ ] Resize back to large: grid restores to saved layout
- [ ] Very narrow width: horizontal scrollbar appears, not smushed
- [ ] Phone-sized: "Use the Lynx app" banner shows

**Parent:**
- [ ] Player cards in carousel with scroll arrows for 5+ children
- [ ] "View Profile" button on each child card → navigates to profile
- [ ] Full first names visible (no "Siste...")
- [ ] Action Required disappears completely when no items (no "All caught up" card)
- [ ] Top banner shows open registrations or alerts when applicable

**Player:**
- [ ] Scouting Report shows real evaluation scores (not all 1s)
- [ ] Trophy Case shows real earned badges
- [ ] Last Game Stats shows real numbers
- [ ] "Viewing as" mode shows the correct player's data
- [ ] Multi-team switcher works (if applicable)

**Chat:**
- [ ] Chat access visible near welcome banner on all dashboards
- [ ] Floating chat bubble works

No console errors. All roles render.

**Commit:** `git add -A && git commit -m "phase 8: final polish parity check"`

---

## NOTES FOR CC

- **The responsive breakpoint auto-generation (Phase 1) is the most important fix.** The md/sm/xs layouts should be DERIVED from the lg layout, not independently defined. Sort by y then x, stack vertically.
- **Player data wiring (Phase 5) MUST use the mobile app as reference.** Clone volleybrain-mobile3 and read the exact queries. The same Supabase tables exist — the mobile app is already showing the data correctly.
- **Action Required progressive disclosure means the widget returns null.** The grid must handle this — either filter the widget array or allow null returns. Test that removing a widget doesn't break the grid layout.
- **The "View Profile" button on parent child cards is critical.** Parents need a direct path to deep-dive on their child's data — stats, evaluations, game recaps, trophies, teammates.
- **Read before writing. Copy before inventing.**
