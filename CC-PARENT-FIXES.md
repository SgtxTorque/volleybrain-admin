# CC-PARENT-FIXES — Parent Layout, Card Fit, Shoutout Widget, Coach Switcher

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-WIDGET-UX (completed or in flight)

---

## CONTEXT

Carlos arranged his parent dashboard and exported the layout. Three issues to fix:
1. Card content bleeding/cut off inside cards — need internal resizing to fit
2. Coach team/season switcher is missing — verify it exists or add it
3. Need a "Give Shoutout" widget for parents — goes in the placeholder next to season record
4. Replace placeholder cards with spacers where needed

---

## RULES

1. Read every file before modifying
2. Commit after each phase
3. TSC verify after each phase
4. Do NOT change grid positions — only fix card internals and add the shoutout widget

---

## PHASE 1: Hardcode Parent Layout + Replace Placeholders

### Step 1.1: Find and update parent dashboard layout

```bash
grep -r "parentWidgets\|PARENT_DEFAULT_LAYOUT\|ParentDashboard" src/ --include="*.jsx" -l
```

Read the file. Replace the default layout with Carlos's exported JSON:

```js
const PARENT_DEFAULT_LAYOUT = [
  { i: "welcome-banner", x: 0, y: 0, w: 11, h: 4 },
  { i: "parent-journey", x: 11, y: 0, w: 11, h: 4 },
  { i: "spacer-divider", x: 3, y: 4, w: 17, h: 1 },
  { i: "action-required", x: 0, y: 5, w: 9, h: 7 },
  { i: "athlete-cards", x: 10, y: 5, w: 8, h: 7 },
  { i: "engagement-progress", x: 19, y: 5, w: 4, h: 6 },
  { i: "achievements", x: 19, y: 11, w: 4, h: 6 },
  { i: "next-event", x: 0, y: 12, w: 9, h: 9 },
  { i: "calendar-strip", x: 10, y: 12, w: 8, h: 9 },
  { i: "team-hub", x: 19, y: 17, w: 4, h: 9 },
  { i: "quick-links", x: 0, y: 21, w: 4, h: 9 },
  { i: "balance-due", x: 5, y: 21, w: 4, h: 7 },
  { i: "season-record", x: 10, y: 21, w: 4, h: 8 },
  { i: "give-shoutout", x: 14, y: 21, w: 4, h: 8 },
  { i: "spacer-bottom", x: 5, y: 28, w: 4, h: 7 },
  { i: "team-chat", x: 19, y: 26, w: 4, h: 8 },
];
```

Note: 
- `placeholder-mmfhq94e` (x:14, y:21) becomes `give-shoutout` (Phase 3)
- `placeholder-mmfhqmzy` (x:5, y:28) becomes `spacer-bottom`
- `spacer-mmfhj2qf` (x:3, y:4) becomes `spacer-divider`

Make sure the spacer widgets are in the active widget list.

**Commit:** `git add -A && git commit -m "phase 1: hardcode parent dashboard layout from Carlos's export"`

---

## PHASE 2: Fix Card Content Overflow — All Parent Cards

### Step 2.1: Read and fix every parent card component

Go through EACH widget on the parent dashboard and verify content fits inside the card at its assigned grid size. For each card, calculate the pixel dimensions based on the 24-col grid:

At 1440px viewport minus sidebar (~1380px usable), each column ≈ 57px, each row = 20px.

| Widget | Grid Size | Approx Pixels | Fix Needed |
|--------|-----------|---------------|------------|
| welcome-banner | 11×4 | 627×80 | Text may wrap — check |
| parent-journey | 11×4 | 627×80 | Step circles may overflow — compact them |
| action-required | 9×7 | 513×140 | Item rows may clip — reduce padding |
| athlete-cards | 8×7 | 456×140 | Cards may overflow — smaller cards or scroll |
| engagement-progress | 4×6 | 228×120 | Tight — compact layout needed |
| achievements | 4×6 | 228×120 | Badge icons may overflow — smaller or grid |
| next-event | 9×9 | 513×180 | Should fit — verify buttons |
| calendar-strip | 8×9 | 456×180 | Verify horizontal strip fits |
| team-hub | 4×9 | 228×180 | Narrow — text must truncate |
| quick-links | 4×9 | 228×180 | List items should fit |
| balance-due | 4×7 | 228×140 | Dollar amount + button must fit |
| season-record | 4×8 | 228×160 | W/L numbers must fit |
| give-shoutout | 4×8 | 228×160 | New widget (Phase 3) |
| team-chat | 4×8 | 228×160 | Message preview must fit |

### Step 2.2: General rules for fixing card overflow

For EVERY card:

1. **Add `overflow-hidden` to the card wrapper** — nothing bleeds outside
2. **Long text gets `truncate` or `line-clamp-2`** — no text wrapping that breaks layout
3. **Numbers get `whitespace-nowrap`** — dollar amounts, W/L records stay on one line
4. **Buttons must fit within the card width** — if a button is too wide, use `w-full` or reduce padding
5. **Internal padding scales with card size** — use `p-3` for narrow cards (4 cols), `p-4` for medium, `p-5` for wide
6. **Font sizes for narrow cards (4 cols wide):**
   - Title: `text-r-xs font-bold uppercase`
   - Primary number: `text-r-2xl font-extrabold`
   - Body text: `text-r-sm`
   - Sub-text: `text-r-xs`
7. **If content absolutely can't fit, add internal scroll:** `overflow-y-auto max-h-full`

### Step 2.3: Fix each card

Read each component file and apply fixes:

```bash
# Find each parent card component
find src/components/parent -name "*.jsx" | sort
cat src/components/parent/AthleteCard.jsx
cat src/components/parent/AthleteCardRow.jsx
cat src/components/parent/ParentActionRequired.jsx
cat src/components/parent/NextEventCard.jsx
cat src/components/parent/SeasonRecordCard.jsx
cat src/components/parent/EngagementProgressCard.jsx
cat src/components/parent/QuickLinksCard.jsx
# Also check shared components used on parent dashboard
```

**Specific fixes likely needed:**

**Athlete Cards (8×7):** The horizontal row of athlete cards is in a narrow space. Each individual card should be compact — `w-28 h-full` with small text. If they don't fit, make the row scrollable: `overflow-x-auto flex gap-2`.

**Engagement Progress (4×6):** Very narrow. Level badge + XP bar need to stack vertically, no horizontal layout. Text: `text-r-xs` for label, `text-r-base font-bold` for level name.

**Achievements (4×6):** Badge icons in a 3×2 grid might be too wide. Use `grid grid-cols-2 gap-1` with smaller icons (`w-8 h-8`). Or show just the first 3-4 badges with "+N more".

**Team Hub (4×9):** Narrow and tall. Shoutout text must wrap and truncate: `line-clamp-3`. Activity items: `text-r-xs`, single line each with `truncate`.

**Balance Due (4×7):** Stack vertically: amount → sub-text → button. Button: `w-full`.

**Quick Links (4×9):** Each link row: icon + label + chevron, `text-r-sm`, `py-2`.

### Step 2.4: Verify — no content bleeds outside any card boundary. All text readable. All buttons clickable.

**Commit:** `git add -A && git commit -m "phase 2: fix card content overflow on all parent dashboard cards"`

---

## PHASE 3: Give Shoutout Widget

### Step 3.1: Create GiveShoutoutCard

Create: `src/components/shared/GiveShoutoutCard.jsx`

A card that lets parents (and coaches) give shoutouts to players.

**Visual (at 4×8 grid size = ~228×160px):**
- Header: "GIVE SHOUTOUT" with a ⭐ icon
- A prompt: "Recognize a player's effort!" in `text-r-sm text-slate-500`
- Player selector: dropdown or list of players on the child's team
  - For parent: shows players on their child's team
  - For coach: shows players on their team
- Shoutout type selector: small pills — "Clutch Player", "Hustle Award", "Leadership", "Most Improved", "Iron Lung", "Team Spirit"
- "Send Shoutout ⭐" button at bottom — `bg-lynx-sky text-white w-full rounded-lg py-2 font-bold`
- On send: creates a shoutout record in the database and shows a brief confirmation

**Data flow:**
```bash
# Find existing shoutout/kudos infrastructure
grep -r "shoutout\|kudos\|Shoutout\|Kudos" src/ --include="*.jsx" --include="*.js" -l | head -10
# Check if there's a shoutouts table
grep -r "shoutout" supabase/ --include="*.sql" | head -10
```

Use existing shoutout infrastructure if it exists. If not, create a simple insert to whatever table stores shoutouts/kudos.

**Compact layout for 4×8 grid:**
```
┌──────────────────┐
│ ⭐ GIVE SHOUTOUT │
│                  │
│ [Select Player ▼]│
│                  │
│ ○Clutch ○Hustle  │
│ ○Leader ○Improve │
│                  │
│ [Send Shoutout ⭐]│
└──────────────────┘
```

### Step 3.2: Register in widget registry

```js
{
  id: 'give-shoutout',
  label: 'Give Shoutout',
  description: 'Recognize a player — select a player and shoutout type to send kudos',
  category: WIDGET_CATEGORIES.SHARED,
  roles: ['parent', 'coach', 'admin'],
  defaultSize: { w: 8, h: 8 },
  minSize: { w: 4, h: 6 },
  componentKey: 'GiveShoutoutCard',
  icon: '⭐',
},
```

### Step 3.3: Register in component resolver

Import and add to componentMap.

### Step 3.4: Add to parent default layout

Already added in Phase 1 at position `{ i: "give-shoutout", x: 14, y: 21, w: 4, h: 8 }`.

### Step 3.5: Verify — shoutout card renders, player dropdown populates, shoutout types selectable, send works.

**Commit:** `git add -A && git commit -m "phase 3: give shoutout widget — parents and coaches can send kudos"`

---

## PHASE 4: Verify Coach Team/Season Switcher Exists

### Step 4.1: Check if the coach switcher was built

```bash
grep -r "TeamSelector\|SeasonSelector\|selectedTeamId\|coachTeams\|team.*switcher\|season.*switcher" src/ --include="*.jsx" -l | head -10
```

Read the coach dashboard file:
```bash
grep -r "coachWidgets\|CoachDashboard" src/ --include="*.jsx" -l
cat [found file]
```

### Step 4.2: If switcher exists

Verify:
- It shows above the DashboardGrid (not inside it)
- It only shows teams the coach actually coaches (filtered by coach_id)
- Selecting a different team updates all widgets below
- Single-team coaches don't see the switcher

### Step 4.3: If switcher does NOT exist — build it

Add to the coach dashboard, ABOVE the DashboardGrid:

```jsx
// Fetch coach's teams
const { data: coachTeams } = useQuery(
  supabase
    .from('teams')
    .select('id, name, season_id, seasons(name)')
    .eq('coach_id', currentUser.id)  // or however coaches are linked
);

const coachSeasons = useMemo(() => {
  const unique = new Map();
  coachTeams?.forEach(t => {
    if (t.season_id && !unique.has(t.season_id)) {
      unique.set(t.season_id, t.seasons?.name || 'Unknown Season');
    }
  });
  return Array.from(unique, ([id, name]) => ({ id, name }));
}, [coachTeams]);

// State
const [selectedSeasonId, setSelectedSeasonId] = useState(null);
const [selectedTeamId, setSelectedTeamId] = useState(null);

// Filter teams by selected season
const filteredTeams = coachTeams?.filter(t =>
  !selectedSeasonId || t.season_id === selectedSeasonId
) || [];

// Auto-select first team if none selected
useEffect(() => {
  if (!selectedTeamId && filteredTeams.length > 0) {
    setSelectedTeamId(filteredTeams[0].id);
  }
}, [filteredTeams, selectedTeamId]);
```

Render above the grid:
```jsx
{(coachSeasons.length > 1 || filteredTeams.length > 1) && (
  <div className="flex gap-3 mb-4 items-center flex-wrap">
    {coachSeasons.length > 1 && (
      <select
        value={selectedSeasonId || ''}
        onChange={e => {
          setSelectedSeasonId(e.target.value || null);
          setSelectedTeamId(null); // reset team on season change
        }}
        className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white"
      >
        <option value="">All Seasons</option>
        {coachSeasons.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    )}
    {filteredTeams.length > 1 && (
      <div className="flex gap-2">
        {filteredTeams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={`px-4 py-2 rounded-xl border-2 text-r-sm font-bold transition-all ${
              selectedTeamId === team.id
                ? 'border-lynx-sky bg-lynx-sky/10 text-lynx-sky'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>
    )}
  </div>
)}
```

Pass `selectedTeamId` and `selectedSeasonId` through `sharedProps` to all widgets.

**Critical:** The teams query MUST filter by coach_id. Verify the database schema:
```bash
grep -r "coach_id\|coach" supabase/ --include="*.sql" | head -10
# Or check how teams are linked to coaches in existing queries
grep -r "coach" src/pages/ --include="*.jsx" | grep -i "supabase\|from(\|select(" | head -10
```

### Step 4.4: Verify switcher appears and works for coaches with multiple teams.

**Commit:** `git add -A && git commit -m "phase 4: verify/build coach team-season switcher"`

---

## PHASE 5: Parity Check

```bash
npx tsc --noEmit
```

Test as Parent:
- Default layout matches Carlos's export
- No content bleeding/cut off in any card
- Give Shoutout card works — can select player, type, and send
- Spacers are invisible
- All buttons navigate correctly

Test as Coach:
- Team/season switcher visible (if multiple teams)
- Switching teams updates all dashboard cards
- Cannot see other coaches' teams

Test Admin + Player — not broken.

**Commit:** `git add -A && git commit -m "phase 5: parent fixes + shoutout widget parity check"`

---

## NOTES FOR CC

- **Card overflow is the #1 priority in Phase 2.** Go through EVERY card component and add `overflow-hidden`, `truncate`, `line-clamp`, `whitespace-nowrap` where needed. Narrow cards (4 cols) need especially tight internal layouts.
- **The Give Shoutout card must use existing shoutout infrastructure.** Read the codebase to find the shoutouts table and existing mutation logic. Don't create new tables if they already exist.
- **Coach team switcher is NOT a widget.** It's fixed UI above the DashboardGrid, like the admin header filters. It doesn't appear in the widget library.
- **The teams query for coach switcher filters by coach_id.** Find how coaches are linked to teams in the schema (it could be a `coach_id` column on teams, or a `team_coaches` join table, or a role in the `profiles` table). Read the existing code to find the pattern.
