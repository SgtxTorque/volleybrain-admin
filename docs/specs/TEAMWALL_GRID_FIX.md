# TeamWall — Grid Layout Fix
## Claude Code Prompt

Fix the layout/grid structure in `src/pages/teams/TeamWallPage.jsx`. The columns need to be centered on the page with proper gutters, not hugging the screen edges.

**Do NOT change any functionality, posts, modals, or features. This is ONLY a layout/spacing fix.**

---

## THE PROBLEM

The 3-column grid currently stretches edge-to-edge across the viewport. The columns need to be centered in the page with breathing room on both sides, like Facebook's layout.

## THE FIX

Find the outermost wrapper/container that holds the 3-column grid. Replace its styling with this exact structure:

```jsx
<div style={{
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 48px',
  display: 'grid',
  gridTemplateColumns: '320px 1fr 320px',
  gap: '24px',
  alignItems: 'start',
}}>
```

If the grid is defined using Tailwind classes instead of inline styles, replace those classes with the equivalent. The key values are:

- **Container max-width:** `1400px` — prevents stretching on ultra-wide screens
- **Container margin:** `0 auto` — centers the entire layout horizontally
- **Container padding:** `0 48px` — breathing room on left and right edges
- **Left column:** `320px` fixed width
- **Center column:** `1fr` — takes whatever space remains (roughly 640-660px on a 1440p screen)
- **Right column:** `320px` fixed width
- **Gap between columns:** `24px`

## ALSO FIX: Breadcrumb Row

If there is a breadcrumb element (like "Home > Teams" or similar) that sits ABOVE the 3-column grid as a full-width row, move it INSIDE the left column as the very first element. It should be a simple "← Back" text link styled in Sky Blue `#4BB9EC`, sitting above the Team Hero card but inside the left column — not a separate full-width row that pushes the grid down.

## ALSO FIX: Scrollbar Visibility

Add this CSS to the component's embedded `<style>` block if not already present:

```css
.tw-hide-scrollbar::-webkit-scrollbar { width: 0; background: transparent; }
.tw-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
```

Apply the `tw-hide-scrollbar` className to the center column and right column scroll containers.

## ALSO FIX: Left Column Sticky

The left column should be `position: sticky` with `top: 24px` so it stays visible as the user scrolls the center feed. It should NOT scroll independently.

```jsx
// Left column wrapper
<div style={{
  position: 'sticky',
  top: '24px',
  alignSelf: 'start',
  height: 'fit-content',
}}>
```

## WHAT THE RESULT SHOULD LOOK LIKE

On a 1920px wide monitor:
- ~260px empty space on the left edge
- 320px left column
- 24px gap
- ~632px center column
- 24px gap  
- 320px right column
- ~260px empty space on the right edge

On a 1440px monitor:
- ~68px empty space on each side (48px padding + remainder)
- Same column widths, center column narrower (~540px)

Everything centered, nothing touching the viewport edges.

## DO NOT

- Do not change the max-width to 800px or any value under 1200px
- Do not change post card content, modals, or functionality
- Do not remove columns or change their internal content
- Do not change any imports, props, or exports
