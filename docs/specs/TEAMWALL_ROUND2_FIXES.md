# TeamWall — Round 2 Fixes (16 Items)
## Claude Code Execution Prompt

**IMPORTANT:** This fix touches MULTIPLE files. Read this entire document before making any changes. Reference `public/lynx-brandbook-v2.html` for brand colors and patterns.

### Files you WILL need to edit:
- `src/pages/teams/TeamWallPage.jsx` — main page layout, columns, breadcrumb, create post bar
- `src/pages/teams/FeedPost.jsx` — post card rendering, photo layout, caption order, comment toggle
- `src/constants/hubStyles.js` — the `tw-glass` CSS class that controls card appearance
- `src/components/teams/NewPostModal.jsx` (or wherever the Create Post modal lives) — remove title input, fix post type buttons

### Files you MAY need to check:
- `src/components/teams/CommentSection.jsx` — understand its interface for the toggle fix
- `src/components/players/PlayerCardExpanded.jsx` — understand its onClose callback for routing fix
- `src/MainApp.jsx` — check how TeamWall navigation/routing works for the player card close fix

---

## FIX 1: Remove Breadcrumb

In `src/pages/teams/TeamWallPage.jsx`, find the breadcrumb element that sits ABOVE the 3-column grid (it shows something like "Home > Teams" or has a home icon + "Teams" text). Delete it entirely or wrap it in `{false && (...)}` to hide it. The 3-column grid should be the FIRST thing rendered after the component's outermost wrapper, with no full-width rows above it. The columns must sit flush against the nav bar.

If there is a "← Back" link, move it inside the left column as the very first element above the Team Hero card. Style it as: Sky Blue `#4BB9EC` text, 13px, font-weight 500, with an ArrowLeft icon. It should NOT be a separate row outside the grid.

---

## FIX 2: Widen Side Columns

In `src/pages/teams/TeamWallPage.jsx`, find the grid definition (likely `gridTemplateColumns: '320px 1fr 320px'` or similar). Change both side columns to `335px`:

```
gridTemplateColumns: '335px 1fr 335px'
```

Keep the center column as `1fr`. Keep the container `maxWidth`, `margin: 0 auto`, padding, and gap unchanged.

---

## FIX 3: Fix Center Column Scroll

In `src/pages/teams/TeamWallPage.jsx`, find the center column `<main>` element (around line 712). It needs:

```jsx
<main ref={centerRef} onScroll={handleCenterScroll}
  style={{
    overflowY: 'auto',
    height: 'calc(100vh - 64px)',  /* 64px = nav bar height, adjust if different */
  }}
  className="tw-hide-scrollbar">
```

The issue is likely that the center column has no explicit height constraint, so `overflow-y: auto` has nothing to overflow against. It needs a fixed height (viewport minus nav bar). Also check that the parent grid container has a height set — it may need `height: calc(100vh - 64px)` as well so the grid children can fill it and scroll independently.

The left column should be `position: sticky; top: 0; alignSelf: start; height: fit-content;` and the right column should have the same `overflowY: auto; height: calc(100vh - 64px)` as the center.

---

## FIX 4: Remove Quick Action Buttons Under Create Post Bar

In `src/pages/teams/TeamWallPage.jsx`, find the "Quick action row" section under the Create Post bar (around lines 748-764). It renders Photo/Video, Shoutout, and Challenge buttons below the "Share a Moment" input. Delete this entire block:

```jsx
{/* Quick action row */}
<div className="flex items-center gap-1 px-4 py-2" style={{ borderTop: ... }}>
  ...Photo/Video, Shoutout, Challenge buttons...
</div>
```

Also remove the `borderTop` divider. The Create Post bar should just be the avatar + input pill + camera icon, nothing below it.

---

## FIX 5: Photos Edge-to-Edge in Post Cards

In `src/pages/teams/FeedPost.jsx`, find the `renderPhotoGrid()` function (starts around line 69).

**For single images (line 74-86):** Change from:
```jsx
<div className="px-4 pb-4">
  <div className="w-full overflow-hidden rounded-xl">
```
To:
```jsx
<div>
  <div className="w-full overflow-hidden">
```

Remove ALL `px-4` padding and `rounded-xl` border-radius from every photo grid variant (single, 2-image, 3-image, 4-image, 5+ image). Photos must go edge-to-edge with zero horizontal padding and no rounded corners. The card itself handles the outer shape via `overflow: hidden`.

Lines to fix: 76, 93, 111, 139, 157 — remove `px-4 pb-4` class, change to just `pb-3` or no class. Remove `rounded-xl` from inner containers. Keep `overflow-hidden` and `gap-1` for multi-photo grids.

---

## FIX 6: Post Cards — No Border/Shadow at Rest, Only on Hover

In `src/constants/hubStyles.js`, find the `.tw-glass` definition and change it:

**Dark mode (default):**
```css
.tw-glass {
  background: transparent;
  border: none;
  border-radius: 16px;
  transition: all 250ms;
  overflow: hidden;
}
.tw-glass:hover {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
  transform: translateY(-2px);
}
```

**Light mode:**
```css
.tw-light .tw-glass {
  background: transparent;
  border: none;
  box-shadow: none;
}
.tw-light .tw-glass:hover {
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  transform: translateY(-2px);
}
```

Remove `backdrop-filter` and `-webkit-backdrop-filter` from `.tw-glass` entirely — the brand book prohibits glass/blur effects.

**IMPORTANT:** Make sure this change doesn't break other cards that use `tw-glass` elsewhere. If other pages depend on `tw-glass` having a visible background at rest, create a NEW class `tw-post-card` with the invisible-at-rest behavior and apply it only to FeedPost's `<article>` element instead of modifying `tw-glass` globally.

---

## FIX 7: Caption/Text Below Photo (Instagram Layout)

In `src/pages/teams/FeedPost.jsx`, the render order currently is:
1. Post Header (lines 180-260) ← keep this first
2. Content/Caption (lines 262-295) ← MOVE THIS
3. Photo Grid (line 298) ← this should come second
4. Interaction Bar (lines 309-340)

Change the order to:
1. **Post Header** (author avatar, name, timestamp, badges, 3-dot menu)
2. **Photo Grid** (`renderPhotoGrid()`)
3. **Interaction Bar** (reactions, comments, share)
4. **Content/Caption** (post title if applicable, post text/caption)

Move the entire `{/* Content — before photos like Facebook */}` block (lines 262-295) to AFTER the interaction bar (after line 340). This gives Instagram layout: author → photo → engagement → caption.

---

## FIX 8: Comment Input Hidden by Default

In `src/pages/teams/FeedPost.jsx`, add a state variable:
```jsx
const [showComments, setShowComments] = useState(false)
```

Find the MessageCircle button (around line 324) and add an onClick:
```jsx
<button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2.5" style={{ cursor: 'pointer' }}>
  <MessageCircle className="w-6 h-6" ... />
  ...
</button>
```

Wrap the `<CommentSection>` (lines 342-352) in a conditional:
```jsx
{showComments && (
  <CommentSection
    postId={post.id}
    commentCount={localCommentCount}
    isDark={isDark}
    g={g}
    onCountChange={(count) => {
      setLocalCommentCount(count)
      onCommentCountChange?.(post.id, count)
    }}
  />
)}
```

---

## FIX 9: Stop Rendering Post Title on Feed Posts

In `src/pages/teams/FeedPost.jsx`, find lines 287-289:
```jsx
{post.title && !titleIsJson && (
  <h3 className="font-bold text-[16px] ...">{post.title}</h3>
)}
```

Remove this block entirely. Post titles should not render in the feed. If titles are needed for announcements in the future, we'll add that back with specific styling. For now, only `post.content` should render as the caption text.

---

## FIX 10: Create Post Modal — Remove Title Input

Find the Create Post modal component. It's likely in `src/pages/teams/TeamWallPage.jsx` (as an inline component) or `src/components/teams/NewPostModal.jsx` — search for "Title (optional)" or "Create Post" modal heading.

Remove the title input field entirely. Expand the "What's on your mind?" textarea:
- Min-height: 120px
- Font: 15px, weight 400
- Placeholder color: Slate `#5A6B7F` (light) / `#7B8FA0` (dark)

Also remove the `title` field from the form submission / Supabase insert — or set it to `null` so it doesn't save empty titles.

---

## FIX 11: Create Post Modal — Post Type Buttons Readability

Find the post type buttons (Announcement, Game Recap, Shoutout, Milestone, Photo) in the Create Post modal.

Change styling:
- Font size: 13px
- Font weight: 500 (Hal)
- Text color (unselected): Navy `#10284C` (light) / `#FFFFFF` (dark)
- Border (unselected): 1.5px solid Silver `#DFE4EA` (light) / `#2A3545` (dark)
- Background (selected/active): Sky Blue `#4BB9EC`
- Text color (selected): `#FFFFFF`
- Border radius: 999px (pill shape)
- Padding: 6px 14px
- Keep emoji icons colorful

---

## FIX 12: Player Card Hover Popup

In `src/pages/teams/TeamWallPage.jsx`, find the roster section in the right column where player rows are rendered.

Instead of clicking a player card to immediately open `PlayerCardExpanded`, add a hover/click popup:

```jsx
const [activePlayerPopup, setActivePlayerPopup] = useState(null)
```

Each player row: on click, toggle `activePlayerPopup` to that player's id. When active, show a small positioned popup card:

```jsx
{activePlayerPopup === player.id && (
  <div style={{
    position: 'absolute',
    right: '100%',
    top: '50%',
    transform: 'translateY(-50%)',
    marginRight: 8,
    background: isDark ? '#1A2332' : '#FFFFFF',
    border: `1px solid ${isDark ? '#2A3545' : '#DFE4EA'}`,
    borderRadius: 12,
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)',
    padding: 12,
    minWidth: 160,
    zIndex: 50,
  }}>
    <button onClick={() => { setShoutoutTarget(player); setShowShoutoutModal(true); setActivePlayerPopup(null) }}
      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: '#4BB9EC', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 6 }}>
      ⭐ Give Shoutout
    </button>
    <button onClick={() => { setSelectedPlayer(player); setActivePlayerPopup(null) }}
      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'transparent', color: isDark ? '#B0BEC5' : '#5A6B7F', fontSize: 13, fontWeight: 500, border: `1.5px solid ${isDark ? '#2A3545' : '#DFE4EA'}`, cursor: 'pointer' }}>
      👤 View Profile
    </button>
  </div>
)}
```

Add click-outside-to-close logic (similar to the post menu pattern already in FeedPost.jsx).

Each player row needs `position: relative` for the popup to position correctly.

---

## FIX 13: Player Profile Close → Return to TeamWall

In `src/pages/teams/TeamWallPage.jsx`, find where `PlayerCardExpanded` is rendered. Its `onClose` callback should simply clear the selected player state:

```jsx
<PlayerCardExpanded
  ...
  onClose={() => setSelectedPlayer(null)}
/>
```

It should NOT call `onBack()` or `onNavigate('home')` or any navigation function. Closing the modal should just set `selectedPlayer` to `null`, which unmounts the modal and leaves the user on the TeamWall. Check that `onClose` doesn't trigger any navigation side effects.

---

## FIX 14: Event Hero Card with Photo Background

In `src/pages/teams/TeamWallPage.jsx`, find the next event hero card in the left column. It currently shows a plain text version. Search the codebase for existing event card components that use photo backgrounds — check:
- `src/components/coach/CoachCenterDashboard.jsx`
- `src/pages/dashboard/CoachDashboard.jsx`
- `src/components/events/` folder

If a photo-backed event card component exists, import and reuse it. If not, enhance the current card with:

```jsx
<div style={{
  borderRadius: 12,
  overflow: 'hidden',
  position: 'relative',
  minHeight: 180,
  background: cardBg,
  border: `1px solid ${borderColor}`,
  boxShadow: shadow,
}}>
  {/* Background image if event has one, otherwise gradient */}
  <div style={{
    position: 'absolute',
    inset: 0,
    backgroundImage: nextEvent?.image_url ? `url(${nextEvent.image_url})` : `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.deepSky})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }} />
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7) 0%, rgba(0,0,0,.2) 100%)' }} />
  
  {/* Content overlaid on image */}
  <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 180 }}>
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(75,185,236,.9)', color: '#fff' }}>
        {nextEvent?.event_type?.toUpperCase() || 'GAME'}
      </span>
      {dayLabel && (
        <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,.9)', color: '#fff' }}>
          {dayLabel}
        </span>
      )}
    </div>
    <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
      {nextEvent?.title || 'Game Day'}
    </p>
    <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
      vs {nextEvent?.opponent || 'TBD'}
    </p>
    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span>📅 {formatDate(nextEvent?.start_date)}</span>
      <span>🕐 {formatTime12(nextEvent?.start_time)}</span>
      <span>📍 {nextEvent?.location || 'TBD'}</span>
    </div>
    <button style={{
      marginTop: 12, padding: '8px 16px', borderRadius: 10,
      background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,.25)', color: '#fff',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
    }}>
      📍 Get Directions
    </button>
  </div>
</div>
```

---

## FIX 15: Hide Scrollbar

In `src/pages/teams/TeamWallPage.jsx`, find the embedded `<style>` block (or create one). Add:

```css
.tw-hide-scrollbar::-webkit-scrollbar { width: 0; background: transparent; }
.tw-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
```

Add `tw-hide-scrollbar` className to the center column and right column scroll containers.

---

## FIX 16: Font Size Bump (+2 Sizes Across All Cards)

Across ALL cards in ALL three columns in `TeamWallPage.jsx`, increase font sizes:

| Current | Change To | Elements |
|---------|-----------|----------|
| 9px | 11px | Tiny labels |
| 10px | 12px | Sub-labels, tracking text |
| 11px | 13px | Section labels (keep uppercase + tracking) |
| 12px | 14px | Body text, timestamps, secondary |
| 13px | 15px | Card body, names |
| 14px | 16px | Card titles, primary text |
| 15px | 17px | Section headings |
| 16px | 18px | Component titles |
| 18px | 20px | Team name |

Also bump FeedPost.jsx font sizes by the same scale. The goal is everything feels readable and substantial. Stat numbers (36px W-L) stay unchanged.

---

## EXECUTION ORDER

Apply fixes in this order to minimize conflicts:
1. Fix 1 (breadcrumb) + Fix 2 (column widths) + Fix 3 (scroll) + Fix 4 (remove buttons) — layout fixes in TeamWallPage.jsx
2. Fix 6 (tw-glass) — hubStyles.js
3. Fix 5 + Fix 7 + Fix 8 + Fix 9 — FeedPost.jsx post card fixes
4. Fix 10 + Fix 11 — Create Post modal
5. Fix 12 + Fix 13 — player card popup + routing
6. Fix 14 — event hero card
7. Fix 15 + Fix 16 — scrollbar + font sizes (cosmetic, do last)

After all fixes, verify the app still compiles and runs. Do NOT break any imports, exports, or prop interfaces.
