# TeamWall Page — Post-Build Fixes
## Claude Code Prompt

I need you to fix several issues with the TeamWall page that was just built. The file is `src/pages/public/TeamWallPage.jsx`. Read `public/lynx-brandbook-v2.html` for brand reference.

Apply ALL of the following fixes:

---

## FIX 1: Photo Posts — Edge-to-Edge Images

Photos in post cards are NOT going edge-to-edge in the container. They have padding/margins around them.

**Fix:** Photos must fill the full width of the post card with ZERO padding, ZERO margin, ZERO gap on left/right. The image should touch both side edges of the card. Use `width: 100%` and remove any `padding`, `margin`, or `border-radius` on the image itself. The card container should have `overflow: hidden` and the image inside should have no horizontal spacing. Example:

```jsx
<div style={{ margin: '0 -20px', width: 'calc(100% + 40px)' }}>
  <img src={url} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
</div>
```

Or simply ensure the image's parent container has `padding: 0` on left/right sides. The image goes edge-to-edge, full bleed.

---

## FIX 2: Post Card — No Shadow, No Border, No Outline at Rest

Post cards currently show a visible border/outline and possibly shadow at rest.

**Fix:** Post cards (especially photo posts) should have:
- `border: none` at rest
- `box-shadow: none` at rest  
- `outline: none` at rest
- Background should be transparent or match the page background, making the card "invisible" as a container

**On hover ONLY:** add a subtle shadow + slight rise:
```css
/* hover state only */
box-shadow: 0 8px 24px rgba(0,0,0,.08); /* light mode */
box-shadow: 0 8px 24px rgba(0,0,0,.3); /* dark mode */
transform: translateY(-2px);
transition: all 250ms;
```

The card should feel like it's floating on the page with no visible edges until you hover.

---

## FIX 3: Comment Input — Hidden by Default

The "Add a comment..." input bar is currently visible under every post.

**Fix:** Remove the comment input from being visible by default. It should ONLY appear when the user clicks the comment bubble icon. Clicking the comment bubble should either:
- Slide open the comment panel (as already designed), OR
- Expand an inline comment input under that specific post

The comment input should NOT be persistently visible on every post card.

---

## FIX 4: Post Text/Caption — Move Below Photo

The post text/caption ("testing the limites") is currently above the photo.

**Fix:** The post layout order should be:
1. **Author row** (avatar, name, timestamp, badges, 3-dot menu) — TOP
2. **Photo/media** — MIDDLE (edge-to-edge)
3. **Engagement row** (reactions, comments, share) — below photo
4. **Caption/text** (author name bold + caption text) — BELOW engagement row

This matches Instagram's layout: author info → photo → engagement → caption.

---

## FIX 5: Create Post Modal — Remove Title Input

The "Title (optional)" input field should be removed entirely from the Create Post modal.

**Fix:**
- Remove the Title input field completely
- Expand the "What's on your mind?" textarea to fill the space where Title was
- The textarea should be the primary and ONLY text input
- Make the textarea larger/taller by default (at least 120px min-height)
- The textarea font should match the body font style (14px / Tele-Grotesk Nor 400)

---

## FIX 6: Create Post Modal — Post Type Buttons Too Light

The post type buttons (Announcement, Game Recap, Shoutout, Milestone, Photo) are too light and hard to read.

**Fix:**
- Increase font weight to Hal 500 (font-weight: 500)
- Darken the text color: use Navy `#10284C` in light mode, `#FFFFFF` in dark mode
- The selected/active post type should use Sky Blue `#4BB9EC` background with white text
- Unselected types should have visible borders (Silver `#DFE4EA` light / `#2A3545` dark) with solid readable text
- The emoji icons in the buttons should remain colorful
- Increase font size to 13px from whatever it is now

---

## FIX 7: All Cards — Font Size Increase (+2 sizes)

All text across all cards (left column, right column, everywhere) is too small.

**Fix:** Increase ALL font sizes by approximately 2 steps:
- Labels that were 9px → 11px
- Labels that were 10px → 12px  
- Labels that were 11px → 13px (but keep uppercase tracking for section labels)
- Body that was 12px → 14px
- Body that was 13px → 15px
- Card titles that were 14px → 16px
- Card titles that were 15px → 17px
- Section titles that were 16px → 18px
- Stat numbers remain at 36px (already large enough)
- Team name: bump to 20px

Everything should feel more readable and substantial. Don't change the type hierarchy — just scale everything up.

---

## FIX 8: Breadcrumb — Remove or Relocate

There's a breadcrumb element (appears to be a "Teams" breadcrumb in the top-left, just below the nav bar) that is pushing the columns down and preventing them from sitting flush against the nav bar.

**Fix:** Either:
- **Remove it entirely** if it's not essential, OR
- **Move it inline** into the left column as the first element (above the team hero card), styled as a simple "← Back" link in Sky Blue, not a separate row that spans the full width

The 3-column layout should start immediately below the nav bar with no full-width elements between them creating gaps.

---

## FIX 9: Columns — Center Alignment & Width

The columns are too close to the screen edges. The layout needs to be centered with proper gutters.

**Fix:**
- Wrap the 3-column grid in a **centered container** with `max-width` and `margin: 0 auto`
- Add horizontal padding/gutters (32px on each side minimum)
- **Left column width: 320px** (up from ~280px)
- **Right column width: 320px** (up from ~300px)
- **Center column: flex-1** (takes remaining space)
- The overall max-width of the container should be something like `1440px` or `1600px` so on very wide screens it doesn't stretch to the edges
- The columns should feel "pushed in" toward the center of the page

Example:
```jsx
<div style={{
  maxWidth: '1600px',
  margin: '0 auto',
  padding: '0 32px',
  display: 'grid',
  gridTemplateColumns: '320px 1fr 320px',
  gap: '24px',
}}>
```

---

## FIX 10: Scrollbar — Hidden/Invisible

The scrollbar on the center and right columns is visually prominent and ugly.

**Fix:** Hide the scrollbar visually while keeping scroll functionality. Add these CSS rules to the component's embedded styles:

```css
/* Hide scrollbar for Chrome, Safari, Edge */
.teamwall-scroll::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

/* Hide scrollbar for Firefox */
.teamwall-scroll {
  scrollbar-width: none;
}

/* Hide scrollbar for IE/Edge legacy */
.teamwall-scroll {
  -ms-overflow-style: none;
}
```

Apply the `teamwall-scroll` class (or equivalent inline approach) to all scrollable containers (center column, right column, comment panel, etc.).

---

## SUMMARY OF ALL CHANGES

| # | Issue | Fix |
|---|-------|-----|
| 1 | Photos not edge-to-edge | Remove padding, full-bleed images |
| 2 | Card has border/shadow at rest | No border/shadow/outline at rest, only on hover |
| 3 | Comment input always visible | Hide until comment bubble clicked |
| 4 | Caption text above photo | Move caption below photo + engagement row |
| 5 | Title input in Create Post | Remove Title field entirely, expand textarea |
| 6 | Post type buttons too light | Darken text, increase weight, better contrast |
| 7 | All card fonts too small | Increase all font sizes by ~2 steps |
| 8 | Breadcrumb blocking layout | Remove or move into left column as "← Back" |
| 9 | Columns at screen edges | Center with max-width container, 320px sidebars |
| 10 | Visible scrollbar | Hide with CSS while keeping scroll |

Apply all 10 fixes to `src/pages/public/TeamWallPage.jsx`. Keep all existing functionality intact. Keep all imports, props, and exports unchanged.
