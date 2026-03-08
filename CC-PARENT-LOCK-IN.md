# CC-PARENT-LOCK-IN — Final Parent Dashboard Polish

**Spec Author:** Claude Opus 4.6
**Date:** March 6, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`
**Predecessor:** CC-PARENT-FIXES (completed or in flight)

---

## CONTEXT

Carlos is locking in the parent dashboard layout. This spec:
1. Hardcodes the cleaned final layout (deduplicated from Carlos's export)
2. Ensures all card content fits cleanly inside card boundaries
3. Expands Quick Links to a 2×6 button grid with more shortcuts
4. Fixes any light-on-light text contrast issues
5. Adds game/practice background images and auto-rotation to the Next Event hero card

---

## RULES

1. Read every file before modifying
2. Commit after each phase
3. TSC verify after each phase
4. Do NOT change grid positions — only fix card internals

---

## PHASE 1: Hardcode Cleaned Parent Layout

### Step 1.1: Deduplicated layout

Carlos's export had duplicate entries. The cleaned, unique layout is:

```js
const PARENT_DEFAULT_LAYOUT = [
  { i: "welcome-banner", x: 0, y: 0, w: 11, h: 4 },
  { i: "parent-journey", x: 11, y: 0, w: 11, h: 4 },
  { i: "spacer-divider", x: 0, y: 4, w: 1, h: 1 },
  { i: "spacer-divider-2", x: 3, y: 4, w: 17, h: 1 },
  { i: "action-required", x: 0, y: 5, w: 9, h: 7 },
  { i: "athlete-cards", x: 10, y: 5, w: 8, h: 7 },
  { i: "engagement-progress", x: 19, y: 5, w: 4, h: 6 },
  { i: "achievements", x: 19, y: 11, w: 4, h: 6 },
  { i: "next-event", x: 0, y: 12, w: 9, h: 9 },
  { i: "calendar-strip", x: 10, y: 12, w: 8, h: 9 },
  { i: "team-hub", x: 19, y: 17, w: 4, h: 9 },
  { i: "quick-links", x: 0, y: 21, w: 4, h: 9 },
  { i: "balance-due", x: 5, y: 21, w: 4, h: 8 },
  { i: "season-record", x: 10, y: 21, w: 4, h: 8 },
  { i: "give-shoutout", x: 14, y: 21, w: 4, h: 8 },
  { i: "team-chat", x: 19, y: 26, w: 4, h: 8 },
  { i: "spacer-bottom", x: 0, y: 30, w: 1, h: 1 },
];
```

Find the parent dashboard file and replace the default layout.

Make sure the active widgets list matches — include spacer entries (`spacer-divider`, `spacer-divider-2`, `spacer-bottom`) with the SpacerWidget component.

**Commit:** `git add -A && git commit -m "phase 1: parent layout locked in — cleaned duplicates from export"`

---

## PHASE 2: Card Content Fit — All Parent Cards

### Step 2.1: Go through every card and fix internal sizing

Read each component. For each one, the content must fit cleanly inside the card at its grid dimensions with NO bleeding, NO clipping, NO scrollbars unless intentional.

**Rules for every card:**
- `overflow-hidden` on the outermost card div
- All text either fits on one line (`whitespace-nowrap truncate`) or wraps cleanly with `line-clamp-N`
- Buttons are `w-full` in narrow cards (4-col wide)
- No horizontal overflow — everything stacks vertically in narrow cards
- Padding: `p-3` for 4-col cards, `p-4` for wider cards

**Card-by-card checklist:**

```bash
# Read each parent card component
find src/components/parent -name "*.jsx" -o -name "*.tsx" | sort
find src/components/shared -name "*.jsx" | sort
```

For each card:

**Welcome Banner (11×4):**
- Mascot icon + greeting + name should fit in one row or stack cleanly
- `text-r-2xl font-extrabold` for name, `text-r-sm` for sub-text

**Parent Journey (11×4):**
- 7 step circles + labels must fit in 11 columns (~627px)
- Step circles: `w-6 h-6` max, labels: `text-[8px]` if needed to fit all 7
- Or: show circles only, labels on hover/active step only

**Action Required (9×7):**
- Item rows: icon + text + action button
- Text: `text-r-sm`, button: compact `px-3 py-1 text-r-xs`
- If more than 3-4 items, internal scroll `overflow-y-auto`

**Athlete Cards (8×7):**
- Horizontal row of cards
- Each card: `w-24 min-w-[96px]` with `overflow-x-auto` on the container
- Compact: small photo, name `text-r-xs font-bold`, team `text-[9px]`

**Engagement Progress (4×6):**
- Vertical stack: level badge → XP bar → progress text
- `text-r-sm font-bold` for level, `text-r-xs` for XP fraction

**Achievements (4×6):**
- Badge grid: `grid grid-cols-3 gap-1` with `w-8 h-8` badges
- Show 6 max, locked badges as gray
- If more: "+N" indicator

**Next Event (9×9):**
- Hero card with background image — handled in Phase 4
- Event info + RSVP/Directions buttons must fit

**Calendar Strip (8×9):**
- Horizontal day strip + View Full Schedule button + events below
- All must fit without overflow

**Team Hub (4×9):**
- Narrow: shoutout text `line-clamp-3`, activity items `text-r-xs truncate`

**Quick Links (4×9):**
- Expanded to 2×6 grid — handled in Phase 3

**Balance Due (4×8):**
- Stack: header → big amount → sub-text → Pay Now button (`w-full`)

**Season Record (4×8):**
- Stack: header → W/L big numbers side by side → "Last: Won 50-12"

**Give Shoutout (4×8):**
- Compact form: player dropdown → type pills → send button

**Team Chat (4×8):**
- Last message preview → "Open Chat" button (`w-full`)

### Step 2.2: Verify — visually check every card. Nothing bleeds. Nothing is cut off.

**Commit:** `git add -A && git commit -m "phase 2: all parent card content fits cleanly inside boundaries"`

---

## PHASE 3: Quick Links — Expand to 2×6 Button Grid

### Step 3.1: Read current Quick Links

```bash
find src -name "*QuickLink*" -o -name "*quick-link*" -o -name "*quickLink*" | head -10
cat [found file]
```

### Step 3.2: Expand to 12 buttons in a 2-column × 6-row grid

The card is 4×9 (narrow and tall). A 2-column layout with 6 rows of buttons:

```jsx
const parentQuickLinks = [
  { icon: '📅', label: 'Full Schedule', path: '/schedule' },
  { icon: '💳', label: 'Payments', path: '/payments' },
  { icon: '👥', label: 'Team Roster', path: '/roster' },
  { icon: '📊', label: 'Player Stats', path: '/stats' },
  { icon: '💬', label: 'Team Chat', path: '/chat' },
  { icon: '📋', label: 'Waivers', path: '/waivers' },
  { icon: '🏆', label: 'Achievements', path: '/achievements' },
  { icon: '📱', label: 'Team Wall', path: '/team-wall' },
  { icon: '🔔', label: 'Notifications', path: '/notifications' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
  { icon: '📧', label: 'Contact Coach', path: '/chat' },
  { icon: '📍', label: 'Directions', path: null },  // opens maps
];
```

**Layout:**
```jsx
<div className="grid grid-cols-2 gap-1.5">
  {parentQuickLinks.map(link => (
    <button
      key={link.label}
      onClick={() => link.path ? navigate(link.path) : openDirections()}
      className="flex items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
    >
      <span className="text-base">{link.icon}</span>
      <span className="text-r-xs font-medium text-slate-700 truncate">{link.label}</span>
    </button>
  ))}
</div>
```

Each button: emoji + label, compact, 2 per row, 6 rows. Fits in the 4×9 card.

### Step 3.3: Make sure all paths are correct — verify each route exists in the router.

**Commit:** `git add -A && git commit -m "phase 3: quick links expanded to 2x6 button grid with 12 shortcuts"`

---

## PHASE 4: Text Contrast Audit — No Light on Light

### Step 4.1: Scan for light-on-light text issues

```bash
# Find potential contrast issues — light text colors on white/light backgrounds
grep -rn "text-slate-200\|text-slate-100\|text-gray-200\|text-gray-100\|text-white/[1-3]0\|text-slate-300" src/components/parent/ --include="*.jsx" | head -20
grep -rn "text-slate-200\|text-slate-100\|text-gray-200\|text-gray-100\|text-white" src/components/shared/ --include="*.jsx" | head -20
```

### Step 4.2: Fix any found issues

For cards with WHITE or LIGHT backgrounds (most parent cards):
- Primary text: `text-slate-800` or `text-lynx-navy` (dark)
- Secondary text: `text-slate-500` minimum (not slate-300 or lighter)
- Labels: `text-slate-500` or `text-slate-600`
- Muted text: `text-slate-400` is the LIGHTEST allowed on white backgrounds

For cards with DARK backgrounds (Next Event hero):
- Primary text: `text-white`
- Secondary text: `text-white/70` minimum (not white/30 or lower)
- Labels: `text-white/60` minimum

### Step 4.3: Check status chip colors on light backgrounds

Status chips (green, amber, red) should have enough contrast:
- Green text on green/10 background: ✓ visible
- Amber text on amber/10 background: ✓ visible
- Red text on red/10 background: ✓ visible

But check for any chip using `text-slate-300` or similar — those are invisible on white.

### Step 4.4: Verify — no text is hard to read on any parent card.

**Commit:** `git add -A && git commit -m "phase 4: text contrast audit — no light on light anywhere"`

---

## PHASE 5: Next Event — Background Images + Auto-Rotation

### Step 5.1: Read the parent NextEventCard

```bash
find src/components/parent -name "*NextEvent*" -o -name "*next-event*" | head -5
cat [found file]
```

### Step 5.2: Add sport-specific background images

Same treatment as the coach Game Day Hero:

```bash
ls public/images/ | grep -i "volley\|basket\|soccer\|practice\|game"
```

Map event type + sport to background image:
```jsx
function getEventBackground(eventType, sport) {
  const sportKey = (sport || 'volleyball').toLowerCase();
  const typeKey = (eventType || 'game').toLowerCase().includes('practice') ? 'practice' : 'game';

  // Check what files actually exist in public/images/
  // Use the mapping found from ls above
  return `/images/${sportKey}-${typeKey}.jpg`;  // adjust to actual filenames
}
```

Apply as card background:
```jsx
<div
  className="relative rounded-2xl overflow-hidden h-full"
  style={{
    backgroundImage: `url('${bgImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  <div className="absolute inset-0 bg-gradient-to-r from-lynx-navy/90 via-lynx-navy/70 to-lynx-navy/50" />
  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
    {/* Event content */}
  </div>
</div>
```

### Step 5.3: Auto-rotation between next game and next practice

If the parent's child has both an upcoming game AND an upcoming practice, the Next Event card should auto-rotate between them:

```jsx
const [activeEventIndex, setActiveEventIndex] = useState(0);

// Gather upcoming events (next game + next practice)
const upcomingEvents = useMemo(() => {
  const events = [];
  if (nextGame) events.push({ ...nextGame, type: 'game' });
  if (nextPractice) events.push({ ...nextPractice, type: 'practice' });
  return events;
}, [nextGame, nextPractice]);

// Auto-rotate every 8 seconds
useEffect(() => {
  if (upcomingEvents.length <= 1) return;
  const interval = setInterval(() => {
    setActiveEventIndex(prev => (prev + 1) % upcomingEvents.length);
  }, 8000);  // 8 seconds — slow enough to read and interact, fast enough to signal rotation
  return () => clearInterval(interval);
}, [upcomingEvents.length]);

const currentEvent = upcomingEvents[activeEventIndex];
```

### Step 5.4: Add dot indicators if multiple events

If rotating between 2+ events, show small dot indicators at the bottom of the card:

```jsx
{upcomingEvents.length > 1 && (
  <div className="flex gap-2 justify-center mt-2">
    {upcomingEvents.map((_, idx) => (
      <button
        key={idx}
        onClick={() => setActiveEventIndex(idx)}
        className={`rounded-full transition-all ${
          idx === activeEventIndex
            ? 'w-2.5 h-2.5 bg-white'
            : 'w-2 h-2 bg-white/30'
        }`}
      />
    ))}
  </div>
)}
```

### Step 5.5: Smooth transition between events

Use opacity fade:
```jsx
<div className={`transition-opacity duration-500 ${fadeClass}`}>
  {/* Current event content */}
</div>
```

Or use a simple crossfade with `key` prop to trigger re-mount animation.

### Step 5.6: If no events at all

Show a calm state with mascot image background:
- "No upcoming events"
- "The schedule is clear — enjoy the downtime!"
- Or show "View Full Schedule" button

### Step 5.7: Verify — Next Event card shows background image, rotates between game/practice if both exist, dots work, smooth transition.

**Commit:** `git add -A && git commit -m "phase 5: next event — background images, auto-rotation, dot indicators"`

---

## PHASE 6: Parity Check

```bash
npx tsc --noEmit
```

Test as Parent:
- Layout matches locked-in positions
- ALL card content fits — nothing bleeding or cut off
- Quick Links has 12 buttons in 2×6 grid, all navigate correctly
- No light-on-light text anywhere
- Next Event shows sport-specific background image
- Auto-rotation works between game and practice (if both exist)
- Dot indicators clickable
- All other cards render with real data
- Give Shoutout card works
- Parent Journey tracks real steps

Test Coach/Admin/Player — not broken.

**Commit:** `git add -A && git commit -m "phase 6: parent dashboard locked in — full parity check"`

---

## NOTES FOR CC

- **The layout JSON had duplicates.** Use ONLY the cleaned version in Phase 1. Do not include duplicate widget IDs — react-grid-layout will error.
- **Card content MUST fit inside boundaries.** This is non-negotiable. If content doesn't fit, shrink text, truncate, or add internal scroll — do NOT let it bleed out.
- **Quick Links has 12 buttons.** Verify each route path exists. If a route doesn't exist (like `/achievements`), either create the route or point to the closest existing page.
- **Background images: read `public/images/` first.** Use the actual filenames found there. Don't hardcode filenames that don't exist.
- **Auto-rotation interval is 8 seconds.** This gives enough time to read event details and hit RSVP, but signals that there's more content.
- **Text contrast minimum:** On white cards, no text lighter than `text-slate-400`. On dark cards, no text lighter than `text-white/60`.
