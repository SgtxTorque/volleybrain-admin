# CC-PARENT-DASHBOARD-FIX-2.md
## Parent Dashboard — Fix Pass #2

**File:** `src/pages/roles/ParentDashboard.jsx`

---

## ISSUE 1: HERO PLAYER CARD IS CUT OFF / TOO SHORT

The hero player card is cropping the player photo and is way too short. It needs to be a tall, premium card that shows the FULL player photo and has room for additional content.

**What it looks like now:** Photo is cropped/cut off at the bottom, card is too compact, information is cramped.

**What it should look like:** Reference the second screenshot (Image 2) — that's closer to the right proportions. The card should be tall enough to show the full player photo from head to knees/feet, plus all the info on the right side.

**Fix:**
- The hero card should have a **minimum height of ~400px** (adjust as needed to show the full photo).
- The player photo section should be on the LEFT side, taking roughly 35-40% of the card width.
- The photo should use `object-cover` and `object-top` to show the player from head down, NOT cropped at the chest.
- The photo container should be the FULL height of the card.
- The RIGHT side of the hero card should stack vertically with room for:
  1. Team name + season + sport
  2. Status badges (Active, Paid Up)
  3. Quick action icons row (Player Card, Team Hub, Profile, Achievements) — these icons are currently missing their labels, fix that too
  4. "What's Next" section (next event + count)
  5. **NEW: Gallery preview row** — placeholder for now, just add a section header "GALLERY" with 3-4 placeholder thumbnail squares (gray boxes with camera icon). Add comment: `// TODO: Wire to player photos/videos`
  6. **NEW: Showcased Badge** — large badge image display area. Placeholder for now: a centered badge icon at ~80px with the badge name below it. Add comment: `// TODO: Wire to player's showcased/featured badge`
- The quick action icons (Player Card, Team Hub, Profile, Achievements) should have their TEXT LABELS visible beneath each icon. Currently they show as blank icons with no labels.

**Card structure:**
```
┌──────────────────────────────────────────────────────────┐
│                    │                                      │
│                    │  🏐 Black Hornets Elite              │
│   PLAYER PHOTO     │  S · Spring 2026                     │
│   (full height,    │                                      │
│    ~35-40% width)  │  ● Active    ☑ Paid Up               │
│                    │                                      │
│                    │  [PlayerCard] [TeamHub] [Profile] [Achievements] │
│                    │                                      │
│                    │  WHAT'S NEXT                         │
│                    │  🏐 Wed, Feb 25 8:30 PM  2 events    │
│                    │                                      │
│                    │  GALLERY                             │
│                    │  [📷] [📷] [📷] [📷]                │
│                    │                                      │
│                    │  SHOWCASED BADGE                     │
│                    │  [🏆 Badge Name]                     │
│                    │                                      │
│   AVA             │                                      │
│   TEST            │                                      │
│   ● Active        │                                      │
└──────────────────────────────────────────────────────────┘
```

The card minimum height should be around **420-450px** to comfortably fit everything.

---

## ISSUE 2: UPCOMING EVENTS — NOT SHOWING + NEED HERO CARD STYLE

The right column's "UPCOMING" section is only showing one event and it's not styled as hero cards like the mobile app.

**What it should look like:** Each upcoming event should be a small hero-style card with:
- A colored gradient or image background based on event type
- Event type badge overlay (Game Day = red/orange, Practice = blue/teal, Tournament = purple)
- Opponent name or event description (prominent)
- Date + time
- Location
- The card itself is visually rich — not just a plain text list

**Fix:**
- Show the next **3 upcoming events** (not just 1)
- Each event is a mini hero card, stacked vertically in the right sidebar
- Style per event type:
  - **Game Day:** Warm gradient background (orange/red tones), "Game Day" badge
  - **Practice:** Cool gradient background (blue/teal tones), "Practice" badge  
  - **Tournament:** Rich gradient background (purple tones), "Tournament" badge
- Each card layout:
```
┌─────────────────────────────┐
│  [Game Day] badge            │
│                              │
│  vs Long Stockings           │  ← opponent/title (bold, white text)
│  Wed, Feb 25 · 8:30 PM      │  ← date/time
│  Frisco Fieldhouse           │  ← location
└─────────────────────────────┘
```
- Card height: ~100-120px each
- Rounded corners (rounded-xl), subtle shadow
- Text should be white or light on the gradient backgrounds
- "Full Calendar →" link stays at the top of the section
- If fewer than 3 events, just show what's available. If zero: "No upcoming events" with calendar icon.

---

## ISSUE 3: BADGES IN WRONG COLUMNS

**Parent Badges** (BADGE PROGRESS section) is currently showing at the bottom of the LEFT sidebar — this is CORRECT placement but confirm it stays there.

**Player Badges** — there's a "PARENT BADGES" section appearing at the bottom of the RIGHT column. This is WRONG. 

**Fix:**
- **Left sidebar (bottom):** Should show "PARENT BADGES" or "BADGE PROGRESS" — these are the PARENT's own badges. This is correctly placed already. Keep it.
- **Right sidebar:** Should show "PLAYER ACHIEVEMENTS" or "ACHIEVEMENTS" — these are the SELECTED PLAYER's badges/achievements, NOT parent badges. 
  - Rename the section in the right column from "PARENT BADGES" to "ACHIEVEMENTS" 
  - This section should pull the PLAYER's achievements (for the currently selected hero player), not the parent's badges
  - Show 3-4 badge icons with progress bars
  - "View All →" links to the player's achievements page

**Summary:**
- Left column → Parent's own badges (BADGE PROGRESS) ✅ already correct
- Right column → Selected player's achievements (ACHIEVEMENTS) — fix the label AND the data source

---

## ISSUE 4: QUICK ACTION ICONS MISSING LABELS

In the hero card, the quick action icons (Player Card, Team Hub, Profile, Achievements) are showing as icons only with no text labels underneath.

**Fix:**
- Each icon should have its label text below it:
  - 🎴 Player Card
  - 👥 Team Hub  
  - 👤 Profile
  - 🏆 Achievements
- Style: icon on top, text below, `text-xs text-slate-600 font-medium`
- Each should be a clickable button/link

---

## VERIFICATION CHECKLIST

After fixes, confirm:
- [ ] Hero player card is tall (~420-450px), showing the full player photo without cropping
- [ ] Hero card has Gallery placeholder section and Showcased Badge placeholder
- [ ] Quick action icons in hero card have visible text labels
- [ ] Right column shows 3 upcoming events as gradient hero-style cards (not plain text)
- [ ] Event hero cards are colored by type (Game=warm, Practice=cool, Tournament=purple)
- [ ] Left sidebar bottom has "BADGE PROGRESS" (parent's badges) — unchanged
- [ ] Right sidebar has "ACHIEVEMENTS" (player's badges) — renamed and wired to player data, NOT parent badges
- [ ] No section labeled "PARENT BADGES" appears in the right column
