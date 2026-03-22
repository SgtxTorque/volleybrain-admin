# TEAMHUB — Update Authenticated TeamWallPage Layout

⚠️ **RULES:**
1. Run `npx tsc --noEmit` before AND after changes — zero new errors allowed.
2. Do NOT break any other pages or components.
3. Do NOT touch src/pages/public/TeamWallPage.jsx — leave it as-is for future public website feature.
4. Do not ask for permission. Just do it.

---

## CONTEXT

There are TWO TeamWallPage files:
- `src/pages/teams/TeamWallPage.jsx` — AUTHENTICATED (coaches, parents, players). This is now the active route. Has working upload, lightbox, photo grid. But has the OLD layout.
- `src/pages/public/TeamWallPage.jsx` — FUTURE PUBLIC WEBSITE (fans, visitors, unauthenticated). Do NOT touch this file. It will be redesigned separately later.

The authenticated version needs its LAYOUT updated to match the modern design while keeping all its working functionality.

---

## WHAT TO DO

Update `src/pages/teams/TeamWallPage.jsx` layout to have:

### Overall Structure:
```
┌──────────────────────────────────────────────────────────────────────┐
│  Team Header Banner (team photo/color background)                     │
│  [Team Logo] TEAM NAME  •  12 Players  •  Spring 2026  •  Active    │
│                                                    [Join Huddle]     │
├────────────┬─────────────────────────────────┬───────────────────────┤
│  LEFT COL  │        CENTER COL               │     RIGHT COL        │
│            │                                  │                      │
│  ROSTER    │  [Feed] [Schedule] [Achievements]│  UPCOMING            │
│  • Chloe T.│  [Stats]                        │  Practice             │
│  • Test A. │                                  │  Fri, Feb 27 6:00 PM │
│  • Player N│  ┌─What's on your mind?────────┐│                      │
│  • Sarah J.│  │ 📷 Photo  📊 Poll           ││  Game vs Frisco Red  │
│  • Maya R. │  │ ⭐ Shoutout  🏆 Challenge   ││  Sat, Feb 28 6:00 PM │
│  ...       │  └─────────────────────────────┘│                      │
│            │                                  │  SEASON RECORD       │
│            │  [Feed Posts with photos,        │  0 — 0               │
│            │   lightbox, multi-photo grid]    │  No games played     │
│            │                                  │                      │
│            │                                  │  GALLERY             │
│            │                                  │  [photo thumbs]      │
└────────────┴─────────────────────────────────┴───────────────────────┘
```

### Left Column — Roster Panel:
- Show team roster with player numbers, names, positions
- Clicking a player opens their player card
- Scrollable if roster is long

### Center Column — Feed:
- Tab navigation: Feed, Schedule, Achievements, Stats
- "What's on your mind?" prompt bar that opens NewPostModal
- Quick action buttons: Photo/Video, Poll, Shoutout, Challenge
- Feed posts using the existing FeedPost.jsx (already has working photo grid + lightbox)
- All existing post types must still render (announcement, shoutout, milestone, challenge, photo, text)

### Right Column — Sidebar:
- UPCOMING section: next 2-3 schedule events
- "Full Calendar" link
- SEASON RECORD: W-L display
- GALLERY: thumbnail grid of recent photos from posts

### Important — Keep ALL existing functionality:
- Working photo upload (contentType fix)
- PhotoLightbox component
- Multi-photo grid display
- NewPostModal with Facebook-style layout
- All post types (announcement, game recap, shoutout, milestone, photo)
- Reactions bar
- Comments

### Look at the public version for layout REFERENCE ONLY:
You can look at `src/pages/public/TeamWallPage.jsx` to see how the 3-column layout, team header, roster panel, and sidebar are structured. Copy the LAYOUT patterns but keep all the FUNCTIONALITY from the teams version. Do NOT import from the public version — just reference its structure.

---

## SHARED COMPONENTS

Both the authenticated and public TeamWallPages should import from the SAME shared components for feed display:
- `src/pages/teams/FeedPost.jsx` — post display with photo grid
- `src/components/common/PhotoLightbox.jsx` — photo viewer
- Any other shared feed components

This way, future upgrades to FeedPost or PhotoLightbox automatically apply to both pages.

If the public version currently has its own inline FeedPost, refactor it to import the shared one (but keep it read-only — no create post, no edit, no delete).

---

## VERIFICATION

- [ ] 3-column layout: roster left, feed center, sidebar right
- [ ] Team header banner with team info
- [ ] Tab navigation (Feed, Schedule, Achievements, Stats)
- [ ] "What's on your mind?" post prompt
- [ ] Quick action buttons (Photo/Video, Poll, Shoutout, Challenge)
- [ ] Feed posts display correctly with all post types
- [ ] Single photos: full width, NO cropping, clickable → lightbox
- [ ] Multi photos: Facebook grid layout, clickable → lightbox
- [ ] Photo upload still works
- [ ] Roster panel shows players
- [ ] Sidebar shows upcoming events + season record + gallery
- [ ] Works in light AND dark mode
- [ ] `npx tsc --noEmit` — zero new errors

---

## COMMIT

```bash
git add .
git commit -m "TeamWallPage: modern 3-column layout with all working features"
git push
```
