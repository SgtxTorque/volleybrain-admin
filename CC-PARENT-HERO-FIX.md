# CC-PARENT-HERO-FIX.md
## Replace the Hero Card + Fix Borders

This is a SMALL, targeted fix. Two things only.

---

## TASK 1: Replace the Hero Card Component

The hero card keeps breaking because of fragile conditional rendering. Here's a replacement that ALWAYS renders (never returns null for the outer container).

**If `src/components/parent/ParentHeroCard.jsx` exists:** Replace its contents entirely with the code below.
**If it doesn't exist:** Create `src/components/parent/ParentHeroCard.jsx` with the code below.

Then update ParentDashboard.jsx (or ParentCenterDashboard.jsx, wherever the hero card is rendered) to:
1. Import this component
2. Pass it the correct props: `selectedPlayerTeam`, `playerTeams`, `onSelectPlayerTeam`, `onNavigate`
3. Make sure `selectedPlayerTeam` is an object with these fields from the player/team data:
   - `playerName` (string)
   - `playerPhoto` (URL string or null) 
   - `teamName` (string)
   - `seasonName` (string, e.g. "S · Spring 2026")
   - `jerseyNumber` (string or number)
   - `sportName` (string, e.g. "Volleyball")
   - `isActive` (boolean)
   - `isPaidUp` (boolean)
   - `teamId` (string UUID)
   - `playerId` (string UUID)

**The key difference in this component:** It NEVER returns null. Even with no player selected, it renders a full-height placeholder card. This prevents the disappearing card bug.

**CRITICAL: The photo container uses `style={{ minHeight: '420px' }}` as inline style, NOT just Tailwind classes.** This ensures the card height is respected regardless of content loading state. The photo uses `absolute inset-0` positioning inside a relatively-positioned container, which means it will ALWAYS fill the full height of the card.

---

## TASK 2: Fix the Dark Column Border Lines

The borders between the 3 columns are too dark/thick. Find the sidebar `<aside>` elements in ParentDashboard.jsx.

**Current (likely):**
```jsx
border-r border-slate-200   // left sidebar
border-l border-slate-200   // right sidebar
```

**Change to:**
```jsx
border-r border-slate-200/50   // left sidebar — 50% opacity
border-l border-slate-200/50   // right sidebar — 50% opacity
```

Also check: are there DUPLICATE borders? For example, if the left sidebar has `border-r` AND the center column has `border-l`, that creates a 2px line. Remove the duplicate — only one element should have the border.

Also check MainApp.jsx — does the content wrapper add any borders around the route content? If so, remove them for the parent dashboard route.

---

## TASK 3: Verify the data mapping

Check how `selectedPlayerTeam` is being built. It needs to include `playerPhoto`. The player photo URL likely comes from the `players` table or `profiles` table. Check DATABASE_SCHEMA.md for the photo column name (probably `photo_url` or `avatar_url`).

If the photo URL is not being included in the `selectedPlayerTeam` object, that's why the photo section shows a placeholder instead of the actual player image.

---

## THAT'S IT. Just these 3 things. Don't change anything else.
