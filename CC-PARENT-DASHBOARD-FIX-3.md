# CC-PARENT-DASHBOARD-FIX-3.md
## Parent Dashboard — Critical Fix Pass #3

**File:** `src/pages/roles/ParentDashboard.jsx` (primary), `src/MainApp.jsx` (if wrapper involved)

---

## ISSUE 1 (CRITICAL): PAGE IS TWITCHING / FLICKERING — RE-RENDER LOOP

The Parent Dashboard is visually twitching and flickering. It flashes between showing content and showing nothing. This is a **re-render loop** — some state update or useEffect is triggering infinite re-renders.

**How to diagnose:**
1. Open browser DevTools Console — look for rapid repeated logs or warnings
2. Check React DevTools Profiler — see which component is re-rendering constantly
3. Most likely causes in order of probability:

**Common cause A: useEffect with missing/wrong dependency array**
```jsx
// BAD — runs every render, sets state, causes re-render, runs again = infinite loop
useEffect(() => {
  setSomething(computedValue);
}); // ← missing dependency array!

// BAD — object/array in dependency recreated every render
useEffect(() => {
  setData(transform(items));
}, [items]); // ← if items is recreated each render (new array reference)

// FIX — add proper dependency array, or use useMemo for computed values
const computedValue = useMemo(() => transform(items), [items]);
```

**Common cause B: setState inside render (not in useEffect or handler)**
```jsx
// BAD — setting state during render
const MyComponent = () => {
  const [x, setX] = useState(0);
  setX(1); // ← causes immediate re-render!
  return <div>{x}</div>;
};
```

**Common cause C: Derived state that triggers itself**
```jsx
// BAD — selectedPlayerTeam changes → effect fires → sets selectedPlayerTeam → loop
useEffect(() => {
  if (players.length > 0) {
    setSelectedPlayerTeam(players[0]); // new object reference each time!
  }
}, [players, selectedPlayerTeam]); // ← selectedPlayerTeam in deps causes loop

// FIX — remove selectedPlayerTeam from deps, or guard with comparison
useEffect(() => {
  if (players.length > 0 && !selectedPlayerTeam) {
    setSelectedPlayerTeam(players[0]);
  }
}, [players]); // ← only depend on players
```

**Common cause D: Context or parent re-rendering**
- Check if MainApp.jsx or a wrapper is re-rendering and unmounting/remounting ParentDashboard

**STEPS TO FIX:**
1. Add `console.log('ParentDashboard render')` at the top of the component function — if it logs hundreds of times per second, confirmed re-render loop
2. Comment out ALL useEffect hooks temporarily — if flickering stops, the bug is in one of the effects
3. Uncomment them one by one to find the culprit
4. Fix the dependency array or add a guard condition
5. **Also check:** any `setInterval` or `setTimeout` that calls setState without cleanup
6. **Also check:** any event listeners added without cleanup in useEffect return

**THIS IS THE #1 PRIORITY FIX.** Everything else is cosmetic. The page must be stable and not flickering before any other work.

---

## ISSUE 2: COLUMN BORDER LINES TOO THICK / DARK

The vertical lines between the left sidebar, center column, and right sidebar are too thick and dark (looks like 3-4px black/very dark lines).

**Fix:**
- Left sidebar: change `border-r border-slate-200` → `border-r border-slate-200/60` (or just ensure it's `border-r` which is 1px by default)
- Right sidebar: change `border-l border-slate-200` → `border-l border-slate-200/60`
- If the borders appear thick, check if there are DUPLICATE borders — e.g., the sidebar has `border-r` AND the center column has `border-l`, which would create a 2px line. Remove one of them.
- The border should be a subtle 1px light gray line, barely noticeable. Use `border-slate-200` (light gray) not `border-slate-800` or similar dark colors.
- Search the entire ParentDashboard component for ALL instances of `border` classes and verify none are using dark colors or thick widths.
- Also check: is there a `divide-x` on the parent flex container? That could also create borders. Remove it if present.
- Also check MainApp.jsx — is it adding borders around the page content area?

**Target look:** The divider between columns should be a whisper-thin light gray line (1px, `border-slate-200` or even `border-slate-100`).

---

## ISSUE 3: UPCOMING EVENT HERO CARDS NEED BACKGROUND IMAGES

The upcoming event cards in the right sidebar currently use solid color gradients. They need to use **stock background images** instead, with a dark overlay for text readability.

**Step 1: Add images to the repo**
Carlos will add these two images to the project:
- `public/images/volleyball-game.jpg` — used for Game Day events
- `public/images/volleyball-practice.jpg` — used for Practice events

**Step 2: Update the event hero cards to use background images**

Each event card should use the appropriate image as a background:

```jsx
{/* Game Day Event Card */}
<div 
  className="relative rounded-xl overflow-hidden h-[130px] cursor-pointer hover:shadow-lg transition-shadow"
  style={{ 
    backgroundImage: `url(/images/volleyball-game.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
  {/* Dark overlay for text readability */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
  
  {/* Content on top of overlay */}
  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
    {/* Event type badge */}
    <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold uppercase rounded w-fit">
      Game Day
    </span>
    
    {/* Event details */}
    <div>
      <div className="text-white font-bold text-base">vs Long Stockings</div>
      <div className="text-white/80 text-xs">Wed, Feb 25 · 8:30 PM</div>
      <div className="text-white/60 text-xs">Frisco Fieldhouse</div>
    </div>
  </div>
</div>

{/* Practice Event Card */}
<div 
  className="relative rounded-xl overflow-hidden h-[130px] cursor-pointer hover:shadow-lg transition-shadow"
  style={{ 
    backgroundImage: `url(/images/volleyball-practice.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
    <span className="inline-block px-2 py-0.5 bg-cyan-500 text-white text-[10px] font-bold uppercase rounded w-fit">
      Practice
    </span>
    <div>
      <div className="text-white font-bold text-base">Practice</div>
      <div className="text-white/80 text-xs">Fri, Feb 27 · 6:00 PM</div>
      <div className="text-white/60 text-xs">Frisco Fieldhouse</div>
    </div>
  </div>
</div>
```

**Image mapping by event type:**
- `game` / `match` / `game_day` → `/images/volleyball-game.jpg`
- `practice` / `training` → `/images/volleyball-practice.jpg`
- `tournament` → `/images/volleyball-game.jpg` (reuse game image for now)
- Any other type → `/images/volleyball-game.jpg` (fallback)

**Card specs:**
- Height: ~130px each
- Rounded corners: `rounded-xl`
- Dark gradient overlay from bottom (heavier at bottom for text readability)
- White text on the overlay
- Event type badge in top-left (colored by type)
- Event details (opponent, date/time, location) at bottom
- Hover: subtle shadow lift
- Gap between cards: `space-y-3`

---

## ISSUE 4: HERO PLAYER CARD STILL BROKEN

If the re-render loop (Issue 1) was causing the hero card to not display properly, it may fix itself once the loop is resolved. After fixing Issue 1, verify:

- Hero player card is visible and stable (not flickering)
- Full player photo is showing (not cropped)
- Card is tall enough (~420-450px)
- All sections visible: team info, status badges, quick actions with labels, What's Next, Gallery placeholder, Showcased Badge placeholder

If the hero card is still broken after fixing the re-render loop, the component JSX itself may need debugging. Check that the hero card section isn't conditionally rendered in a way that flickers (e.g., checking a state value that keeps changing).

---

## IMPLEMENTATION ORDER

1. **FIX THE RE-RENDER LOOP FIRST** (Issue 1) — nothing else matters if the page is flickering
2. Fix column borders (Issue 2) — quick CSS change
3. Add background images to event cards (Issue 3) — after Carlos adds images to repo
4. Verify hero card (Issue 4) — may self-resolve after Issue 1

---

## VERIFICATION CHECKLIST

After fixes:
- [ ] Page loads and stays STABLE — no flickering, no twitching, no flashing
- [ ] Console shows no rapid repeated logs or warnings
- [ ] Column dividers are subtle 1px light gray lines (barely visible)
- [ ] No thick dark lines between columns
- [ ] Upcoming event cards have background images (game.jpg or practice.jpg)
- [ ] Event cards have dark overlay with white text, readable and clean
- [ ] Hero player card is stable and fully visible
- [ ] All content renders once and stays put
