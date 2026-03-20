# CC-COMPREHENSIVE-FIX — Registration, Navigation, Layout, Parent/Player, Photos, Chat

**Spec Author:** Claude Opus 4.6
**Date:** March 8, 2026
**Branch:** `feat/desktop-dashboard-redesign`
**Repo:** `SgtxTorque/volleybrain-admin`

---

## CRITICAL RULE

**Before fixing ANY query or data issue, find the WORKING page or component that already handles the same data. Read its exact Supabase query. Copy that pattern. Do NOT invent new table names or query structures.**

```bash
# Run this FIRST — get the complete list of tables the app actually uses
grep -roh "\.from(['\"][a-z_]*['\"])" src/ --include="*.jsx" --include="*.js" | sort | uniq
```

---

## PHASE 1: Registration & Onboarding Fixes

### 1.1: Registration preview loads at bottom instead of top

```bash
find src -name "*Registration*" -o -name "*registration*" -o -name "*PublicRegistration*" | head -20
cat src/pages/registrations/PublicRegistrationPage.jsx 2>/dev/null || find src -path "*public*registration*" -name "*.jsx" | head -5
```

The registration form preview/link opens scrolled to the bottom (confirmation area) instead of the top. Fix:
- Add `window.scrollTo(0, 0)` on component mount
- Or add `useEffect(() => { window.scrollTo({ top: 0 }); }, []);` at the top of the registration page component
- Test: open the registration link — it should show the first form field at the top, not the confirmation section

### 1.2: Waivers not linkable in registration templates

```bash
find src -path "*template*" -name "*.jsx" | head -10
find src -path "*waiver*" -name "*.jsx" | head -10
grep -r "waiver" src/pages/ --include="*.jsx" | grep -i "template\|form\|builder" | head -10
```

Read the registration template builder (Image 5 shows it exists). Waivers (Image 6 shows Liability Waiver, Photo/Video Release, Code of Conduct) should be selectable when creating a registration template. Check:
- Can the admin link existing waivers to a registration form?
- If not, add a "Waivers" section to the template builder with checkboxes for each waiver
- Alternative: waivers become a parent to-do after registration submission (show in the parent's action required section while awaiting approval)

### 1.3: Registration page copy — Lynx voice

Read `LYNX-UX-PHILOSOPHY.md` for tone guidance. Then scan all registration-related components for generic copy:
```bash
grep -r "Register\|Sign Up\|Submit\|Complete" src/pages/registrations/ --include="*.jsx" | head -30
```

Replace generic text with Lynx-branded copy:
- "Register" → "Join the Den" or "Sign Up for [Season Name]"
- "Submit Application" → "Let's Get Started"
- Generic helper text → warm, encouraging Lynx tone
- Error messages → friendly, not robotic

### 1.4: Season creation — no error indication

```bash
find src -path "*season*" -name "*.jsx" | grep -i "create\|setup\|wizard" | head -10
```

The "Create Season" button grays out with no indication of which required field is missing. Fix:
- On button click (when disabled), show validation errors inline next to each missing field
- Or: highlight missing fields with red border + error message below
- The button should say "Complete required fields" when disabled, not just be gray with no explanation

**Commit:** `git add -A && git commit -m "phase 1: registration fixes — scroll to top, waiver linking, Lynx copy, validation errors"`

---

## PHASE 2: Navigation & Filtering

### 2.1: Global season/sport/team filters on ALL admin pages

The admin dashboard has filter dropdowns (Season, Sport, Team) but inner pages don't. Carlos got stuck in the wrong season on the Teams page.

```bash
# Find where the global filters live
grep -r "SeasonFilter\|GlobalFilter\|season.*filter" src/components/ --include="*.jsx" -l | head -10
# Find the admin filter bar component
grep -r "Spring 2026\|All Teams\|All Sports" src/components/ --include="*.jsx" -l | head -10
```

Add the same `SeasonFilterBar` component to the TOP of every admin inner page:
- TeamsPage
- PaymentsPage
- RegistrationsPage
- SchedulePage
- RosterManagerPage
- Jersey Management page
- Attendance/RSVP page
- Any other admin page

The filter state should be GLOBAL — either in a React context or stored in a shared state so changing it on one page persists when navigating to another page. Check if a SeasonContext or similar already exists:
```bash
grep -r "SeasonContext\|SeasonProvider\|useSeason" src/ --include="*.jsx" --include="*.js" | head -10
```

If a season context exists, use it. If not, create one that stores selectedSeason, selectedSport, selectedTeam and persists across page navigation.

### 2.2: Age group filter for teams

Add an age group filter (10U, 11U, 12U, etc.) to the Teams page filter bar, next to the existing sport filter. Only show age groups that exist in the data.

### 2.3: Floating chat button for admins

```bash
# Check if a floating action button exists
grep -r "FloatingButton\|fab\|floating.*chat\|chat.*button" src/ --include="*.jsx" -l | head -10
```

Create a floating chat button in the bottom-left corner (above the sidebar, or bottom-right if it doesn't conflict with Edit Layout):
- Circular button, `bg-lynx-sky text-white`, chat bubble icon
- Shows unread message count badge
- Click opens a mini-chat drawer or navigates to the chat page
- Only visible for admin role
- Position: `fixed bottom-6 left-20 z-40` (offset from sidebar)

**Commit:** `git add -A && git commit -m "phase 2: global filters on all pages, age group filter, floating chat button"`

---

## PHASE 3: Teams & Schedule Fixes

### 3.1: Team card 3-dot menu cut off

```bash
grep -r "three.*dot\|context.*menu\|dropdown.*menu\|3-dot\|overflow.*menu" src/pages/teams/ --include="*.jsx" | head -10
```

The context menu on team cards gets clipped inside the card boundary. Fix:
- Add `overflow-visible` to the card wrapper (or remove `overflow-hidden` temporarily when menu is open)
- Better: use a portal-based dropdown (renders outside the card DOM) or add `z-50` to the dropdown
- Test: click the 3-dot menu on a team card — all options should be fully visible

### 3.2: Bulk edit for schedule events

Currently you can bulk CREATE events but can't bulk EDIT. For events created as a series:
```bash
grep -r "series\|recurring\|bulk.*edit" src/pages/schedule/ --include="*.jsx" | head -10
```

Add "Edit Series" option when clicking a series event:
- "Edit this event only" — opens single event editor
- "Edit all future events in series" — opens bulk editor with all future events pre-loaded, allows changing time, location, or canceling
- If series support doesn't exist yet, note it as a follow-up — don't block this spec on it

**Commit:** `git add -A && git commit -m "phase 3: team card menu fix, bulk edit for schedule series"`

---

## PHASE 4: Responsive / Layout Fixes

### 4.1: Fix ResizeObserver not reflowing on window resize

This is the root cause of the "smush and won't unssmush" issue. When you resize the Chrome window small then back to large, the grid stays smushed.

```bash
cat src/components/layout/DashboardGrid.jsx
```

Find the ResizeObserver or width measurement logic. The problem is likely:
- ResizeObserver fires on container resize but NOT on window resize
- Or the width is cached and not re-measured

Fix:
```jsx
useEffect(() => {
  if (!containerRef.current) return;
  
  const measure = () => {
    const width = containerRef.current?.offsetWidth;
    if (width && width > 0) {
      setContainerWidth(width);
    }
  };
  
  // Measure immediately
  measure();
  
  // ResizeObserver for container changes
  const observer = new ResizeObserver(() => {
    requestAnimationFrame(measure);
  });
  observer.observe(containerRef.current);
  
  // ALSO listen for window resize — this is the missing piece
  const handleWindowResize = () => {
    requestAnimationFrame(measure);
  };
  window.addEventListener('resize', handleWindowResize);
  
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', handleWindowResize);
  };
}, []);
```

The key: `window.addEventListener('resize', handleWindowResize)` must be present AND must trigger a re-measure. If it's already there but not working, check if `setContainerWidth` actually causes a re-render with the new width.

### 4.2: Better scaling on extreme screen sizes

The responsive clamp system should handle this, but verify:
- On a 13" laptop (~1366px): text should be at the clamp minimum, cards compact
- On a 43" 4K TV (~3840px): text should be at the clamp maximum (capped), cards should NOT stretch infinitely

For 4K: the `max-w-dashboard` was removed. For extreme widths, we may need to add it back but ONLY for very large screens:
```jsx
// In DashboardContainer or the main layout wrapper
className="w-full 3xl:max-w-[2400px] 3xl:mx-auto"
```

Add a custom `3xl` breakpoint to Tailwind config:
```js
screens: {
  '3xl': '2560px',
}
```

This caps content at 2400px only on ultrawide/4K monitors. Normal monitors are unaffected.

**Commit:** `git add -A && git commit -m "phase 4: fix resize reflow, extreme screen size handling"`

---

## PHASE 5: Parent View Fixes

### 5.1: Child cards not clickable

The athlete cards on parent dashboard highlight on hover but don't navigate anywhere when clicked.

```bash
find src/components/parent -name "*Athlete*" -o -name "*Child*" -o -name "*PlayerCard*" | head -10
cat [found files]
```

Fix: clicking a child card should either:
- Select that child (set selectedChildId) and update all dashboard widgets to show that child's data — this is what the current system is supposed to do
- Check if the onClick handler is missing or not wired

If the cards ARE selecting a child but it doesn't feel like navigation, add a visual response:
- Selected card gets a prominent border (`border-2 border-lynx-sky`)
- Unselected cards dim slightly
- A subtle slide transition as widgets below update

### 5.2: Parent player cards include parent profile info

The parent cards should show both child info AND which parent account they belong to. Check the card component and add:
- Parent name below the child name (smaller text)
- Or: "Parent: Carlos D." in the card footer

### 5.3: Next Event hero card showing events

From the earlier fix, verify the parent's Next Event card now shows real events. If it still shows "No upcoming events" when events exist:
- Check if it's filtering by the selected child's team_id
- Check if the event date filter is correct (>= today)
- Read the schedule page query and copy it

**Commit:** `git add -A && git commit -m "phase 5: parent child cards clickable, parent info on cards, event hero fix"`

---

## PHASE 6: Player View Fixes

### 6.1: Player dashboard not loading data

```bash
find src -name "*PlayerDashboard*" -o -name "*player-dashboard*" | head -10
cat [found file]
```

Check every widget query on the player dashboard. Wire them to real data using the same approach: find the working page, copy its query.

### 6.2: Player hero card photo — full hero treatment

The player photo is a tiny thumbnail. Make it:
- Large photo (`w-24 h-24` minimum or even background image treatment)
- If the player has a photo: show it prominently
- If no photo: show large initials with team color gradient background
- Photo should be the visual centerpiece of the hero card

### 6.3: Large OVR rating visible

The FIFA-style Overall Rating (OVR) number should be prominent on the player dashboard:
- Large circle or badge: `w-20 h-20 rounded-full bg-lynx-sky text-white text-4xl font-extrabold`
- Positioned in the hero card, top-right area
- Shows the player's overall evaluation score
- If no score yet: show "—" or "NEW"

### 6.4: "My Team" link in player navigation

```bash
grep -r "player" src/components/layout/LynxSidebar.jsx | head -10
```

Add a "My Team" or "Team Hub" link to the player role's sidebar navigation that navigates to their team's wall page.

### 6.5: Achievement page — use new system

```bash
find src -name "*Achievement*" -o -name "*achievement*" | head -10
```

Check if there are two achievement systems (old and new). If so, make sure the player dashboard and achievement page use the NEW one that was built in recent specs. Read both systems, identify which is current, and wire the player view to the correct one.

### 6.6: Multi-team player switcher

Players who play on multiple teams or sports need a team selector. Check if the player has multiple team memberships:
```bash
grep -r "player.*team\|team.*player\|roster_entries\|team_players" src/ --include="*.jsx" | grep "from\|select" | head -20
```

If a player has multiple teams, add a "My Teams" selector above the player dashboard (similar to the parent's child switcher). Selecting a different team updates all dashboard widgets.

**Commit:** `git add -A && git commit -m "phase 6: player dashboard — data wiring, hero photo, OVR rating, my team link, achievements, multi-team"`

---

## PHASE 7: Photo Upload Checkpoints

### 7.1: Add photo upload prompts at key moments

Photos should be uploadable at:

**Registration form:**
- Add a "Upload Player Photo" field to the registration form (optional but encouraged)
- Friendly prompt: "Add a photo so coaches can identify your player!"

**Parent player profile:**
- On the player profile page (parent view), if no photo exists, show a prominent "Add Photo" card
- Large upload area with camera icon

**Coach quick upload:**
- On the roster page, each player card should have a camera icon if no photo
- Clicking it opens a quick upload modal

```bash
# Find existing photo upload components
grep -r "upload.*photo\|photo.*upload\|avatar.*upload\|image.*upload" src/ --include="*.jsx" -l | head -10
```

If a photo upload component already exists, reuse it in these locations. If not, create a shared `PhotoUpload` component.

**Commit:** `git add -A && git commit -m "phase 7: photo upload prompts — registration, profile, roster"`

---

## PHASE 8: Verify Everything

```bash
npx tsc --noEmit
npm run build
```

Test each fix:

**Registration:**
- [ ] Form opens at the top, not bottom
- [ ] Season creation shows which fields are missing
- [ ] Registration copy uses Lynx tone

**Navigation:**
- [ ] Season/sport/team filters on all admin inner pages
- [ ] Age group filter on teams page
- [ ] Floating chat button for admins
- [ ] Filter persists across page navigation

**Teams & Schedule:**
- [ ] Team card 3-dot menu fully visible
- [ ] Bulk edit series option (or noted as follow-up)

**Responsive:**
- [ ] Resize window small → large: grid reflows WITHOUT page refresh
- [ ] 4K screens don't stretch infinitely

**Parent:**
- [ ] Child cards are clickable and select the child
- [ ] Next Event shows real events
- [ ] All widgets update when switching children

**Player:**
- [ ] Dashboard loads with real data
- [ ] Large hero photo
- [ ] OVR rating visible
- [ ] "My Team" in sidebar nav
- [ ] Achievements use new system
- [ ] Multi-team switcher (if applicable)

**Photos:**
- [ ] Upload prompt on registration form
- [ ] Upload prompt on player profile
- [ ] Camera icon on roster cards

No console 400/500 errors. All roles render. All navigation links go to correct pages.

**Commit:** `git add -A && git commit -m "phase 8: comprehensive fix parity check — all issues verified"`

---

## NOTES FOR CC

- **The resize reflow fix (Phase 4.1) is critical.** This has been reported multiple times. The `window.addEventListener('resize')` handler MUST trigger a remeasure and re-render of the grid width. Test by resizing the browser window and confirming the grid reflows in real-time.
- **Global filters (Phase 2.1) should use an existing context if one exists.** Check for SeasonContext, SportContext, or similar. Don't create duplicate state management.
- **The floating chat button is admin-only.** Don't show it for coach/parent/player roles.
- **For the player OVR rating:** read how player evaluations are stored. The OVR is likely the average of all skill ratings. Find the calculation in the existing evaluation code and reuse it.
- **Read every file before modifying.** This has been the #1 source of bugs — CC inventing queries instead of reading existing working code.
