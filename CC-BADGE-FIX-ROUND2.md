# CC-BADGE-FIX-ROUND2
## Fix Badge Visibility + Nav — Changes Did Not Take Effect

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin`
**Branch:** `feat/desktop-dashboard-redesign` (verify this is the active branch)

---

## PROBLEM

The previous spec (CC-BADGE-VISIBILITY-AND-NAV) reported success but the changes are NOT visible in the deployed app:

1. **Locked badges are STILL nearly black/dark gray.** The grayscale filter and heavy opacity are still active. The lock icon IS showing (confirmed in modal), but the badge art is invisible behind the dark filter.
2. **Sidebar nav link for Achievements is NOT appearing** for Coach, Admin, or Team Manager roles. Only Parent can access the page (via dashboard card).

---

## PHASE 1: DIAGNOSE WHY CHANGES AREN'T VISIBLE

### Step 1.1 — Verify the branch and deployment
1. Run `git status` — confirm you're on the right branch
2. Run `git log --oneline -5` — confirm the badge visibility commits are in the history
3. Check if changes need to be pushed: `git diff origin/$(git branch --show-current)`
4. Is there a build/deploy step needed? Check if Vercel auto-deploys from this branch

### Step 1.2 — Actually inspect the current badge rendering code
Open these files and show me the EXACT current code around locked badge rendering:

**AchievementCard.jsx** — Find the img/div that renders the badge image and show me:
- The full className or style prop on the badge image container
- Any conditional classes based on `isEarned`, `earned`, `unlocked`, `progress`, etc.
- Show me lines 210-270 (or wherever the badge image renders)

**AchievementDetailModal.jsx** — Same thing:
- Show me the badge image rendering code
- Show the conditional styling for locked vs unlocked
- Show me lines 170-200

### Step 1.3 — Inspect the sidebar nav config
Open **MainApp.jsx** and show me:
- The nav configuration for Coach role (the full nav group array)
- Search for the string 'achievements' — show every line it appears on
- Show the contextual nav config for Coach

---

## PHASE 2: FIX BADGE VISIBILITY (FOR REAL THIS TIME)

### The goal
Locked badges should show the FULL COLOR badge art at 70% opacity. They should NOT be grayscale. They should NOT be dark. A user should be able to clearly see what the badge looks like and want to earn it.

### Step 2.1 — Find and REMOVE all darkening filters
Search the ENTIRE codebase for these patterns and remove them from locked badge contexts:
```
grep -rn "grayscale" src/
grep -rn "brightness" src/ 
grep -rn "saturate(0" src/
grep -rn "opacity-50" src/  (Tailwind class)
grep -rn "opacity-40" src/
grep -rn "opacity-30" src/
```

For every result that applies to badge/achievement images in a locked/unearned state:
- Remove the `grayscale` class or filter
- Remove any `brightness(0.1)` or similar darkening
- Remove `saturate(0)` 
- Replace with ONLY: `opacity: 0.7` (or Tailwind `opacity-70`)

### Step 2.2 — Verify by reading the code back
After making changes, show me the EXACT code that now renders:
1. A locked badge in the grid (AchievementCard)
2. A locked badge in the detail modal (AchievementDetailModal)

I want to see the actual JSX with the actual className/style — not a summary of what you changed.

### Step 2.3 — Check for CSS overrides
Sometimes Tailwind utilities get overridden by other CSS. Check:
- Is there a global CSS file that applies grayscale to `.badge-locked` or similar?
- Are there any CSS modules or styled-components that could override?
- Search: `grep -rn "grayscale" src/**/*.css`

### Step 2.4 — Check for multiple render paths
The badge image might render through different components depending on context. Check:
- Is there a `BadgeImage` or `BadgeIcon` shared component?
- Does the achievement grid use a different component than the modal?
- Are there wrapper components that apply their own filters?

---

## PHASE 3: FIX SIDEBAR NAVIGATION (FOR REAL THIS TIME)

### Step 3.1 — Find the actual nav structure
The sidebar nav likely uses a specific data structure. Find:
1. Where Coach nav items are defined (search for "My Teams", "Roster Manager", "Schedule" — items visible in the coach sidebar screenshot)
2. The exact array/object structure for nav items
3. Is there a role-based filter that might be excluding "achievements"?

### Step 3.2 — Add Achievements link correctly
Based on the actual structure found, add the Achievements link for:
- Coach: Add after "Game Day" section or in a logical grouping
- Admin: Add in sidebar  
- Team Manager: Add in sidebar
- Parent: Add in sidebar (currently only accessible via dashboard card)
- Player: Verify it's there

### Step 3.3 — Verify by reading nav config back
Show me the full nav config for Coach role after changes. I want to see the actual array.

---

## PHASE 4: BUILD AND VERIFY

1. Run `npx vite build` — confirm no errors
2. Run `npx tsc --noEmit` — confirm no type errors  
3. Push changes to the branch
4. Confirm Vercel deployment triggers (or whatever the deploy process is)

### Write to `CC-BADGE-FIX-ROUND2-REPORT.md`:
- What was actually wrong (why didn't the first attempt work?)
- What files were changed and the exact diff
- The actual current code for locked badge rendering (paste the JSX)
- The actual current nav config showing achievements for each role
- Build status

---

## CRITICAL

- Show me the actual code, not summaries
- If a change "looks right" but isn't rendering, there's an override or a different code path — find it
- Test by looking at the actual rendered output, not just the source code
- The badges should look like they have a slight frosted/dimmed overlay — NOT dark gray, NOT black, NOT invisible
