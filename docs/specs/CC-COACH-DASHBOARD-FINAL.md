# CC-COACH-DASHBOARD-FINAL — Coach Dashboard Layout, Hero Carousel, Spacers, Chat

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-ADMIN-TWEAKS (completed or in flight)

---

## CONTEXT

Carlos arranged his coach dashboard using the widget grid editor and exported the layout. He also needs:
1. Spacer widgets (invisible, no outline, no text) to replace placeholder cards
2. Game Day Hero card: background images (sport-specific), fill card layout, content rearranged
3. Practice Hero card: same slot as game day hero, carousel/rotation between them
4. Season Setup Hero card: also rotates in the same hero slot
5. Chat card added to widget library
6. All cards properly wired to real data

---

## RULES

1. Read every file before modifying
2. Archive before replace
3. Preserve all Supabase data fetching
4. Commit after each phase
5. TSC verify after each phase
6. No file over 500 lines

---

## PHASE 0: Archive + Hardcode Coach Layout

### Step 0.1: Archive

```bash
mkdir -p src/_archive/coach-final-$(date +%Y%m%d)
grep -r "coachWidgets\|CoachGameDayHero\|CoachDashboard" src/ --include="*.jsx" -l
# Archive each found file
cp src/components/layout/widgetRegistry.js src/_archive/coach-final-$(date +%Y%m%d)/
cp src/components/layout/DashboardGrid.jsx src/_archive/coach-final-$(date +%Y%m%d)/
```

### Step 0.2: Hardcode Carlos's coach layout as default

Find the coach dashboard file where widgets/layout are defined. Replace the default layout:

```js
const COACH_DEFAULT_LAYOUT = [
  { i: "spacer-top", x: 0, y: 0, w: 1, h: 26 },
  { i: "welcome-banner", x: 1, y: 0, w: 8, h: 3 },
  { i: "spacer-divider", x: 1, y: 3, w: 21, h: 1 },
  { i: "coach-tools", x: 1, y: 4, w: 5, h: 7 },
  { i: "gameday-hero", x: 7, y: 4, w: 9, h: 12 },
  { i: "notifications", x: 17, y: 4, w: 6, h: 6 },
  { i: "action-items", x: 17, y: 10, w: 6, h: 7 },
  { i: "also-this-week", x: 1, y: 11, w: 5, h: 5 },
  { i: "squad-roster", x: 1, y: 16, w: 5, h: 9 },
  { i: "calendar-strip", x: 7, y: 16, w: 9, h: 10 },
  { i: "challenges", x: 17, y: 17, w: 3, h: 9 },
  { i: "achievements", x: 20, y: 17, w: 3, h: 9 },
  { i: "team-readiness", x: 1, y: 25, w: 5, h: 9 },
  { i: "org-wall-preview", x: 11, y: 26, w: 5, h: 7 },
  { i: "top-players", x: 17, y: 26, w: 6, h: 6 },
];
```

Note: the two `placeholder-*` entries are replaced with `spacer-top` and `spacer-divider` (see Phase 1).

**Commit:** `git add -A && git commit -m "phase 0: archive + hardcode coach dashboard layout"`

---

## PHASE 1: Spacer Widgets

### Step 1.1: Create SpacerWidget component

Create: `src/components/layout/SpacerWidget.jsx`

```jsx
/**
 * SpacerWidget — invisible widget used for layout spacing.
 * No background, no border, no text, no outline.
 * Completely invisible in normal view mode.
 * In edit mode: shows a very faint dashed outline so it can be selected.
 */
export default function SpacerWidget({ editMode = false }) {
  if (!editMode) {
    // Completely invisible in normal mode
    return <div className="w-full h-full" />;
  }
  // Faint outline only in edit mode so it's selectable
  return (
    <div className="w-full h-full border border-dashed border-slate-200/30 rounded-lg flex items-center justify-center">
      <span className="text-r-xs text-slate-300">spacer</span>
    </div>
  );
}
```

### Step 1.2: Register spacer in widget registry

In `src/components/layout/widgetRegistry.js`, add:

```js
{
  id: 'spacer',
  label: 'Spacer',
  description: 'Invisible spacing widget — no outline, no text. Use for layout gaps.',
  category: WIDGET_CATEGORIES.OVERVIEW,
  roles: ['admin', 'coach', 'parent'],
  defaultSize: { w: 1, h: 1 },
  minSize: { w: 1, h: 1 },
  componentKey: 'SpacerWidget',
  icon: '⬜',
  allowMultiple: true,
},
```

### Step 1.3: Register in component resolver

In `src/components/layout/widgetComponents.jsx`, import and add:

```jsx
import SpacerWidget from './SpacerWidget';
// Add to componentMap:
SpacerWidget,
```

### Step 1.4: Pass editMode to SpacerWidget

In `DashboardGrid.jsx`, when rendering widgets, pass `editMode` as a prop to all widgets (or specifically to spacers):

```jsx
{resolveWidget(widget.componentKey, { ...sharedProps, editMode })}
```

The SpacerWidget reads `editMode` to decide whether to show the faint outline or be completely invisible.

### Step 1.5: Add spacers to the coach widget list

Replace the placeholder entries with spacer entries in the coach dashboard:
- `placeholder-mmf3uwgi` (x:0, y:0, w:1, h:26) → `spacer-top` 
- `placeholder-mmf3dp6o` (x:1, y:3, w:21, h:1) → `spacer-divider`

**Commit:** `git add -A && git commit -m "phase 1: spacer widgets — invisible in normal mode, faint outline in edit mode"`

---

## PHASE 2: Game Day Hero Card — Background Images + Content Layout

### Step 2.1: Read current hero card

```bash
cat src/components/coach/CoachGameDayHeroV2.jsx
```

### Step 2.2: Check available images

```bash
ls public/images/ | head -30
# Look for sport-specific game/practice images
find public/images -name "*volley*" -o -name "*basketball*" -o -name "*soccer*" -o -name "*game*" -o -name "*practice*" -o -name "*mascot*" | head -20
```

### Step 2.3: Add sport-specific background images

The hero card should use a background image based on the event type and sport:

**Image mapping logic:**
```jsx
function getHeroBackground(sport, eventType) {
  const sportKey = sport?.toLowerCase() || 'volleyball';
  const typeKey = eventType?.toLowerCase() || 'game';
  
  // Try sport + type specific first
  const options = [
    `/images/${sportKey}-${typeKey}.jpg`,
    `/images/${sportKey}-${typeKey}.png`,
    `/images/${sportKey}_${typeKey}.jpg`,
    `/images/${sportKey}_${typeKey}.png`,
    `/images/volley-${typeKey}.jpg`,  // fallback to volleyball
    `/images/volley-game.jpg`,        // ultimate fallback
  ];
  
  // Return the first one that exists, or fallback to gradient-only
  return options[0]; // CC should check which files actually exist
}
```

Read the `public/images/` directory to find the EXACT filenames. Map them:
- Volleyball game → `volley-game.*` or `volleyball-game.*`
- Volleyball practice → `volley-practice.*` or `volleyball-practice.*`
- Basketball game → `basketball-game.*`
- Soccer game → `soccer-game.*`
- No event / idle → mascot image from `public/images/`

**Background implementation:**
```jsx
<div
  className="relative rounded-2xl overflow-hidden"
  style={{
    backgroundImage: `url('${heroImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  {/* Dark gradient overlay for text readability */}
  <div className="absolute inset-0 bg-gradient-to-r from-lynx-navy/90 via-lynx-navy/75 to-lynx-navy/60" />
  
  {/* Content on top */}
  <div className="relative z-10 p-6">
    {/* ... hero content ... */}
  </div>
</div>
```

### Step 2.4: Fill the card layout

The hero card is 9×12 grid units. The content inside should USE all the space — no big empty areas.

Layout inside the hero:
```
┌─────────────────────────────────────────┐
│  [LIVE badge / countdown timer]         │
│                                         │
│  BLACK HORNETS ELITE                    │
│  vs Who Who                    SEASON   │
│  📅 Sat, Mar 7 · 10:00 AM    RECORD    │
│  📍 Frisco Fieldhouse          4 — 1    │
│                               80% win   │
│  [⚡ START GAME DAY MODE >]   W W W W L │
│                                         │
│  ○—●—○—○—○—○  Game Day Journey          │
│  1  2  3  4  5  6                       │
│  RSVPs Lineup Attend Score Stats Report │
└─────────────────────────────────────────┘
```

- All text uses responsive sizes
- Journey tracker at bottom of hero, inside the card
- "Start Game Day Mode" button: `bg-lynx-sky text-white rounded-lg px-4 py-2 font-bold`

### Step 2.5: Verify hero renders with background image at 9×12 grid size.

**Commit:** `git add -A && git commit -m "phase 2: gameday hero — sport-specific background images, content fills card"`

---

## PHASE 3: Hero Card Carousel — Game Day / Practice / Season Setup

### Step 3.1: Create a HeroCarousel wrapper

The hero card position (x:7, y:4, w:9, h:12) should rotate between up to 3 hero cards depending on what's happening:

**Priority order:**
1. **Game Day Hero** — shows when there's a game today or the next upcoming game
2. **Practice Hero** — shows when the next event is a practice
3. **Season Setup Hero** — shows when the coach has incomplete setup tasks (roster verification, evaluations, positions, uniforms, etc.)
4. **Idle Hero** — when nothing is pressing, show a mascot image with a motivational message

Create: `src/components/coach/CoachHeroCarousel.jsx`

```jsx
/**
 * Rotates between hero card types based on what's relevant right now.
 * Auto-advances every 8 seconds, or user can click dots to switch.
 */
export default function CoachHeroCarousel({ 
  nextGame, nextPractice, setupTasks, teamData, ...props 
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Build array of available hero cards
  const heroes = useMemo(() => {
    const list = [];
    if (nextGame) list.push({ type: 'game', data: nextGame });
    if (nextPractice) list.push({ type: 'practice', data: nextPractice });
    if (setupTasks?.incomplete > 0) list.push({ type: 'setup', data: setupTasks });
    if (list.length === 0) list.push({ type: 'idle' });
    return list;
  }, [nextGame, nextPractice, setupTasks]);
  
  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (heroes.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [heroes.length]);
  
  // Render active hero
  // ... switch on heroes[activeIndex].type
  // Show dot indicators at bottom if multiple heroes
}
```

### Step 3.2: Practice Hero Card

Create: `src/components/coach/PracticeHeroCard.jsx`

Similar layout to Game Day Hero but for practices:
- Background image: sport-specific practice image (e.g. `volley-practice.jpg`)
- Dark gradient overlay
- Title: "Practice" (not "vs Opponent")
- Time, location
- Attendance count so far
- "Open Practice Plan >" button
- No win/loss record — instead show "Practice #{N} this season"

### Step 3.3: Season Setup Hero Card

Create: `src/components/coach/SeasonSetupHeroCard.jsx`

For when the coach has setup tasks to complete:
- Background: Lynx mascot image or abstract pattern
- Title: "Season Setup" or "Get Your Team Ready"
- Progress: "5 of 8 tasks complete" with power bar
- Next task: "Next: Complete player evaluations"
- "Continue Setup >" button — navigates to the relevant task
- Task list preview: compact list of what's done (green check) and what's pending (gray circle)

Tasks tracked:
1. Verify roster (all assigned players confirmed)
2. Complete player evaluations
3. Set all positions
4. Assign jersey numbers / uniforms
5. Introduce yourself in team chat
6. Build first lineup
7. Create practice plan
8. Review schedule

### Step 3.4: Idle Hero Card

Create: `src/components/coach/IdleHeroCard.jsx`

When there's no game, no practice, and setup is complete:
- Background: Lynx mascot image (find appropriate mascot image in `public/images/`)
- Motivational message: "The court is quiet, Coach. Enjoy the downtime." or similar
- Maybe show: days until next event, season stats summary
- Relaxed, no urgency

### Step 3.5: Wire the carousel into the coach dashboard

In the coach dashboard widget config, replace the `gameday-hero` widget's component with `CoachHeroCarousel`:

```jsx
{
  id: 'gameday-hero',
  label: 'Hero Card',
  componentKey: 'CoachHeroCarousel',
  ...
}
```

Register `CoachHeroCarousel` in the component resolver.

### Step 3.6: Register new hero cards in widget registry

Add entries for Practice Hero and Season Setup Hero so they appear in the widget library (even though they're inside the carousel, they should be addable standalone too):

```js
{
  id: 'practice-hero',
  label: 'Practice Hero',
  description: 'Practice event hero card with attendance and practice plan',
  category: WIDGET_CATEGORIES.SCHEDULE,
  roles: ['coach'],
  defaultSize: { w: 9, h: 12 },
  minSize: { w: 6, h: 8 },
  componentKey: 'PracticeHeroCard',
  icon: '⚡',
},
{
  id: 'season-setup-hero',
  label: 'Season Setup',
  description: 'Coach setup task tracker — roster, evals, positions, uniforms',
  category: WIDGET_CATEGORIES.PROGRESS,
  roles: ['coach'],
  defaultSize: { w: 9, h: 12 },
  minSize: { w: 6, h: 8 },
  componentKey: 'SeasonSetupHeroCard',
  icon: '🔧',
},
```

### Step 3.7: Dot indicators on carousel

If multiple heroes are available, show small dot indicators at the bottom of the hero card:
- Active dot: `bg-white w-2.5 h-2.5 rounded-full`
- Inactive dots: `bg-white/30 w-2 h-2 rounded-full`
- Clicking a dot switches to that hero
- Positioned: `absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2`

**Commit:** `git add -A && git commit -m "phase 3: hero carousel — game day, practice, season setup, idle + dot navigation"`

---

## PHASE 4: Chat Card Widget

### Step 4.1: Create ChatPreviewCard

Create: `src/components/shared/ChatPreviewCard.jsx`

A card showing the latest messages from team chat:
- Header: "TEAM CHAT" with chat icon
- Shows last 3-5 messages in a compact list:
  - Avatar (small, `w-6 h-6 rounded-full`) + sender name (bold) + message preview (truncated, 1 line) + time ago
- "Open Chat >" link at bottom — navigates to the chat page
- If no messages: "No messages yet — break the ice, Coach!"
- Role-aware:
  - Coach: sees their team's chat
  - Admin: sees org-wide or most recent team chat
  - Parent: sees their child's team chat (COPPA-compliant — no direct messaging with minors)

### Step 4.2: Register in widget registry

```js
{
  id: 'team-chat',
  label: 'Team Chat',
  description: 'Latest team chat messages with quick preview',
  category: WIDGET_CATEGORIES.COMMUNICATION,
  roles: ['admin', 'coach', 'parent'],
  defaultSize: { w: 6, h: 8 },
  minSize: { w: 4, h: 4 },
  componentKey: 'ChatPreviewCard',
  icon: '💬',
},
```

### Step 4.3: Register in component resolver

Import `ChatPreviewCard` and add to `componentMap`.

### Step 4.4: Wire data

The chat card needs to fetch recent messages. Check existing chat infrastructure:
```bash
grep -r "chat_messages\|ChatMessage\|useChat" src/ --include="*.jsx" --include="*.js" -l | head -10
```

Use existing chat queries/subscriptions if available. If not, create a simple query:
```js
const { data: recentMessages } = useQuery(
  supabase
    .from('chat_messages')
    .select('*, profiles(full_name, avatar_url)')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(5)
);
```

**Commit:** `git add -A && git commit -m "phase 4: chat preview card — team chat widget for all roles"`

---

## PHASE 5: Make All Widgets Available to All Dashboards

### Step 5.1: Update widget registry — every widget available to every role

Carlos said every dashboard should have access to every card, with role-specific behavior. Update the `roles` field on ALL widgets in the registry to include all three roles:

```js
roles: ['admin', 'coach', 'parent'],
```

Do this for EVERY entry in the registry. The widget library will now show everything to everyone.

**Role-specific behavior stays inside the components** — a parent viewing the "All Teams" card sees read-only data, no admin controls. A coach viewing "Financials" sees their team's financials only. The components already handle this via `roleContext` or similar props.

For components that make no sense for a role (like "Squad" for admin), they still appear in the library but render with appropriate data (admin's "Squad" could show all players across the org, or prompt to select a team).

### Step 5.2: Verify library shows all widgets for all roles.

**Commit:** `git add -A && git commit -m "phase 5: all widgets available to all roles in widget library"`

---

## PHASE 6: Wire Coach Dashboard Cards to Real Data

### Step 6.1: Read the coach dashboard orchestrator

```bash
grep -r "coachWidgets\|CoachDashboard\|DashboardGrid" src/ --include="*.jsx" -l
```

### Step 6.2: Verify each widget receives correct data

Go through each widget on the coach dashboard and verify it's receiving real data:

- **welcome-banner** — coach name, team name, season name
- **gameday-hero** (carousel) — next game, next practice, setup tasks from Supabase
- **coach-tools** — quick action links work, navigate to correct pages
- **also-this-week** — events this week for the coach's team
- **notifications** — team activity feed, real notifications
- **action-items** — real action items (stats to enter, RSVPs pending, evals due)
- **squad-roster** — real player list with photos, positions, status
- **calendar-strip** — real events for coach's team
- **challenges** — real challenges data (or empty state)
- **achievements** — real player achievements
- **team-readiness** — real completion status of setup tasks
- **top-players** — real player stats
- **org-wall-preview** — real team wall posts

For any widget showing placeholder/dummy data, wire it to the actual Supabase query. Read the existing queries in the coach dashboard to see what data is already being fetched.

### Step 6.3: Team/season selector filtering

The coach dashboard has team/season selectors above the grid. When the coach selects a different team, ALL widgets below should update to show that team's data. Verify this is wired correctly.

If the coach only has one team, selectors should not render (progressive disclosure).

**Commit:** `git add -A && git commit -m "phase 6: coach dashboard — all widgets wired to real data, team selector connected"`

---

## PHASE 7: Parity Check

```bash
npx tsc --noEmit
```

Test as Coach:
- Default layout matches Carlos's exported positions
- Spacers are invisible in normal mode, faint outline in edit mode
- Hero card carousel rotates between game/practice/setup/idle
- Background images show for each hero type
- Dot indicators work for switching heroes
- Chat card shows recent messages (or empty state)
- All cards show real data, not placeholders
- Team selector filters all cards
- Calendar strip is horizontal (matching admin fix from CC-ADMIN-TWEAKS)
- All text readable with Inter font
- No console errors

Test Admin + Parent — not broken.

**Commit:** `git add -A && git commit -m "phase 7: coach dashboard parity check — all verified"`

---

## EXECUTION ORDER SUMMARY

| Phase | Scope | Key Changes |
|-------|-------|-------------|
| 0 | Archive + layout | Hardcode Carlos's coach layout |
| 1 | Spacer widgets | Invisible spacers, replace placeholders |
| 2 | Game Day Hero | Background images, content fills card |
| 3 | Hero Carousel | Game/Practice/Setup/Idle rotation with dots |
| 4 | Chat Card | New team chat preview widget |
| 5 | All widgets → all roles | Every widget available in every dashboard's library |
| 6 | Wire real data | All coach cards connected to Supabase |
| 7 | Parity check | Full test |

**Total phases:** 8 (0–7)

---

## NOTES FOR CC

- **Spacers are INVISIBLE in normal mode.** Literally `<div className="w-full h-full" />` with nothing visible. Only show a faint dashed outline in edit mode.
- **Background images: read `public/images/` to find the actual filenames.** Don't guess. `ls public/images/` and map sport names to actual files.
- **The hero carousel auto-rotates every 8 seconds.** It should also respond to dot clicks for manual navigation. If there's only one hero type available, no dots render and no rotation happens.
- **Season Setup Hero tracks coach-specific tasks**, not admin tasks. The coach's setup checklist is different from the admin's season management workflow. Coach tasks: verify roster, evaluations, positions, jerseys, introduce in chat, first lineup, practice plan, review schedule.
- **Chat card uses existing chat infrastructure.** Read the codebase to find existing chat queries and Supabase table structure. Don't create new tables.
- **Making all widgets available to all roles** means updating the `roles` array in the registry only. Component internals already handle role-based rendering.
