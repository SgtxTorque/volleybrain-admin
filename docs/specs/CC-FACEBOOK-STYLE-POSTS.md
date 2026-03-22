# TEAMHUB — Facebook-Style Post System (Create + Display + Lightbox)

⚠️ **RULES:**
1. Run `npx tsc --noEmit` before AND after changes — zero new errors allowed.
2. Do NOT break any other pages or components.
3. Use existing Supabase tables, storage buckets (bucket: "media", path: "team-wall/{teamId}/").
4. Upload must include `contentType: file.type || 'image/jpeg'` — this was the fix that made uploads work.
5. Must work in BOTH light mode and dark mode. Use existing theme context/variables.
6. Do not ask for permission. Just do it.

---

## REFERENCE: Facebook's Post System Behavior

Study these patterns carefully — this is the target UX:

### CREATE POST MODAL (Facebook reference):
- Clean modal overlay with backdrop blur
- User avatar + name at top left
- Privacy/visibility dropdown next to name
- Large auto-expanding textarea — no fixed height, grows with content
- When photo is attached: shows full preview below text at natural aspect ratio
- Multiple photos: shows grid preview (up to 4-5 visible, rest hidden behind "+N" overlay)
- "X" button on each photo to remove it
- Bottom toolbar: Photo/Video, Tag People, Emoji, Location, GIF icons
- "Post" / "Publish" button at bottom — disabled when empty, colored when ready
- Smooth animations on open/close

### FEED POST DISPLAY (Facebook reference):
- **Single image**: Full width of card, natural aspect ratio, no cropping
- **Two images**: Side by side, equal height, slight gap between
- **Three images**: One large left, two stacked right
- **Four images**: 2x2 grid
- **Five+ images**: 2x2 grid with last cell showing "+N" overlay with remaining count (like the Frisco Flyers volleyball post with "+11")
- ALL images are clickable — clicking opens lightbox
- No hover zoom effects. Just a subtle brightness change on hover to indicate clickable.

### PHOTO LIGHTBOX (Facebook reference):
- Dark overlay covers entire screen
- Large photo centered, maximum size while fitting viewport
- Left/right arrow buttons to navigate between photos in the post
- "X" close button top right
- Keyboard navigation: left/right arrows, Escape to close
- On desktop: comments panel on the right side (can implement later, for now just the photo viewer)

---

## PART 1: REBUILD CREATE POST MODAL (NewPostModal.jsx)

Rebuild the Create Post modal to match Facebook's UX:

### Layout:
```
┌─────────────────────────────────────────┐
│  Create Post                        X   │
├─────────────────────────────────────────┤
│  [Avatar] Carlos test                   │
│           Public ▾                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ What's on your mind?            │   │
│  │ (auto-expanding textarea)       │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [Photo grid preview]           X │   │
│  │ [Photo grid preview]           X │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─ Post Type ────────────────────┐    │
│  │ 📢 Announcement  🎮 Game Recap │    │
│  │ ⭐ Shoutout  🏆 Milestone      │    │
│  │ 📷 Photo                       │    │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─ Add to your post ─────────────┐   │
│  │  📷  😊                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │          Publish                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Photo Preview Grid (inside modal):
- Show photos at natural aspect ratio in preview
- Multiple photos: use the same grid layout as feed display
- Each photo has an X button (top-right corner) to remove
- Clicking the photo upload area or drag-and-drop to add more
- Show upload progress indicator when publishing

### Key behaviors:
- Post type selector: keep existing types (Announcement, Game Recap, Shoutout, Milestone, Photo)
- Auto-select "Photo" type when photos are attached
- Title field: only show if post type is NOT "Photo" or "text" (announcements, game recaps need titles)
- Textarea auto-grows — starts at 3 rows, expands as user types
- Publish button uses team accent color when active, gray when disabled
- Modal has smooth fade-in animation
- Backdrop click closes modal (with confirmation if content exists)
- Dark mode: dark card background, light text, subtle borders

---

## PART 2: FEED POST PHOTO DISPLAY (FeedPost.jsx)

### Single Image:
```jsx
<div className="w-full cursor-pointer" onClick={() => openLightbox(0)}>
  <img src={url} className="w-full h-auto block" />
</div>
```

### Multi-Image Grid:
```
2 photos:  [img1 | img2]        — side by side, equal height
3 photos:  [img1  | img2]       — 1 large left, 2 stacked right  
           [      | img3]
4 photos:  [img1 | img2]        — 2x2 grid
           [img3 | img4]
5+ photos: [img1 | img2]        — 2x2 grid, last cell has overlay
           [img3 | +N  ]        — "+N" shows remaining count
```

### Grid implementation:
- All grid cells have equal dimensions (square or near-square aspect ratio using object-cover ONLY in the grid — this is the one place object-cover is correct)
- Small gap between cells (4px)
- Rounded corners on the outer edges of the grid
- Each cell is clickable — opens lightbox at that photo's index
- "+N" overlay: semi-transparent dark overlay with white text showing count

### Hover state:
- Subtle brightness reduction on hover: `hover:brightness-95` 
- Cursor: pointer
- NO zoom effects

---

## PART 3: PHOTO LIGHTBOX COMPONENT (new file: PhotoLightbox.jsx)

Create a new component: `src/components/common/PhotoLightbox.jsx`

### Features:
- Full-screen dark overlay (bg-black/90)
- Photo centered and scaled to fit viewport (max-width: 90vw, max-height: 90vh, object-contain)
- Navigation arrows (left/right) — only show if multiple photos
- Close button (X) top-right
- Keyboard support: ArrowLeft, ArrowRight, Escape
- Click outside photo to close
- Photo counter: "2 / 5" shown at top
- Smooth fade-in/out transitions
- Works in both light and dark mode (it's always dark overlay regardless of theme)
- Swipe support for future mobile use (optional)

### Usage in FeedPost:
```jsx
const [lightboxOpen, setLightboxOpen] = useState(false)
const [lightboxIndex, setLightboxIndex] = useState(0)

// In render:
{lightboxOpen && (
  <PhotoLightbox
    photos={post.media_urls}
    initialIndex={lightboxIndex}
    onClose={() => setLightboxOpen(false)}
  />
)}
```

---

## PART 4: DARK MODE SUPPORT

The Create Post modal and all photo components must respect the app's theme:

- Check how existing components handle dark mode (look for theme context, `dark:` Tailwind prefixes, or CSS variables)
- Modal background: white in light mode, dark gray in dark mode
- Text: dark in light, light in dark
- Borders: subtle gray in light, subtle dark border in dark
- Photo grid: works the same in both modes
- Lightbox: always dark (black overlay) regardless of theme

---

## FILE CHANGES SUMMARY:

1. **src/pages/teams/NewPostModal.jsx** — Complete rebuild of create post modal
2. **src/pages/teams/FeedPost.jsx** — Add multi-photo grid + lightbox trigger
3. **src/components/common/PhotoLightbox.jsx** — NEW file, photo lightbox viewer
4. **src/pages/public/TeamWallPage.jsx** — Update inline post modal to use shared NewPostModal (if not already done)

---

## VERIFICATION:

- [ ] Create post modal matches Facebook layout
- [ ] Single photo: full width, no crop, clickable
- [ ] 2 photos: side by side grid, clickable
- [ ] 3+ photos: proper grid with +N overlay on 5+
- [ ] Clicking any photo opens lightbox
- [ ] Lightbox: arrow navigation, keyboard nav, close button, photo counter
- [ ] Upload still works (contentType included)
- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Auto-expanding textarea
- [ ] Photo removal (X button) in create modal
- [ ] Publish button disabled when empty
- [ ] `npx tsc --noEmit` — zero new errors

---

## COMMIT:

```bash
git add .
git commit -m "TeamHub: Facebook-style post creation, multi-photo grid, photo lightbox"
git push
```
