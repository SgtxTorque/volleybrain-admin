# TeamWall — Final Polish Fixes
## Claude Code Prompt

**Execute all fixes, then commit with message:** `fix: TeamWall polish - text contrast, lightbox fullscreen, roster shoutout, routing`

**Files to edit:**
- `src/pages/teams/FeedPost.jsx` — text colors, lightbox fix
- `src/pages/teams/TeamWallPage.jsx` — roster card actions, routing, text contrast
- `src/components/common/PhotoLightbox.jsx` — close X styling
- `src/constants/hubStyles.js` — if any text color variables live here

---

## FIX 1: Text Contrast — Darken Light Mode, Lighten Dark Mode

The text across the entire TeamWall is too faint. Colors are too washed out in both modes. This affects ALL text in `TeamWallPage.jsx`, `FeedPost.jsx`, and any sub-components.

### Current problem values → Fix to:

**Light mode text colors (make DARKER):**
| Current (too light) | Change to | Usage |
|---------------------|-----------|-------|
| `rgba(0,0,0,.3)` | `rgba(0,0,0,.55)` | Timestamps, secondary |
| `rgba(0,0,0,.25)` | `rgba(0,0,0,.5)` | Labels, sub-labels |
| `rgba(0,0,0,.2)` | `rgba(0,0,0,.4)` | Muted text, tracking labels |
| `rgba(0,0,0,.15)` | `rgba(0,0,0,.35)` | Share button, tertiary |
| `rgba(0,0,0,.4)` | `rgba(0,0,0,.6)` | Body text, menu items |
| `rgba(0,0,0,.55)` | `rgba(0,0,0,.75)` | Post content/caption |
| `rgba(0,0,0,.6)` | `rgba(0,0,0,.75)` | Menu items |

**Dark mode text colors (make BRIGHTER):**
| Current (too dim) | Change to | Usage |
|-------------------|-----------|-------|
| `rgba(255,255,255,.15)` | `rgba(255,255,255,.35)` | Share, tertiary |
| `rgba(255,255,255,.2)` | `rgba(255,255,255,.4)` | Labels, tracking |
| `rgba(255,255,255,.25)` | `rgba(255,255,255,.45)` | Timestamps |
| `rgba(255,255,255,.3)` | `rgba(255,255,255,.5)` | Icons, secondary |
| `rgba(255,255,255,.4)` | `rgba(255,255,255,.6)` | Body, menu |
| `rgba(255,255,255,.5)` | `rgba(255,255,255,.7)` | Content, counts |

**Do a global find-and-replace across these files:**
- `src/pages/teams/FeedPost.jsx`
- `src/pages/teams/TeamWallPage.jsx`
- `src/pages/teams/NewPostModal.jsx`

For each file, find every `rgba(0,0,0,.XX)` and `rgba(255,255,255,.XX)` text color value and bump the opacity up according to the tables above. The goal: all text should be clearly readable without squinting, in both light and dark modes.

### Also fix font-weight for thin text:

Any text that uses `font-weight: 400` (Tele-Grotesk Nor) for labels, buttons, or UI elements should be bumped to `font-weight: 500` (Tele-Grotesk Hal) minimum. Body text paragraphs can stay at 400, but:
- Labels → 500 minimum
- Button text → 500 minimum  
- Timestamps → 500
- "REACTIONS", "COMMENTS", "SHARE" labels → 600
- Post type badges → 600
- Player jersey/position → 500

Search for `fontWeight: 400` in UI elements (not paragraph body text) and bump to 500.

---

## FIX 2: Lightbox — Fullscreen, Not Inside Post Card

The `PhotoLightbox` component at `src/components/common/PhotoLightbox.jsx` uses `position: fixed` and `z-index: 300`, which should be fullscreen. But it's being rendered INSIDE the `<article>` element in `FeedPost.jsx` which has `overflow: hidden` — this creates a new stacking context that clips the fixed-position lightbox.

**Fix in `src/pages/teams/FeedPost.jsx`:**

Move the lightbox rendering OUTSIDE of the `<article>` tag using a React Portal. Import `createPortal` from `react-dom`:

```jsx
import { createPortal } from 'react-dom'
```

Then change the lightbox render (around line 300-307) from:
```jsx
{lightboxIdx !== null && (
  <PhotoLightbox
    photos={mediaUrls}
    initialIndex={lightboxIdx}
    onClose={() => setLightboxIdx(null)}
  />
)}
```

To:
```jsx
{lightboxIdx !== null && createPortal(
  <PhotoLightbox
    photos={mediaUrls}
    initialIndex={lightboxIdx}
    onClose={() => setLightboxIdx(null)}
  />,
  document.body
)}
```

This renders the lightbox directly on `document.body`, bypassing any `overflow: hidden` parent containers. The lightbox will now truly be fullscreen.

---

## FIX 3: Lightbox — Prominent Close X Button

In `src/components/common/PhotoLightbox.jsx`, the X button exists but is small and hard to see (line 60-65). Make it more prominent:

Change the close button styling from:
```jsx
<button
  onClick={(e) => { e.stopPropagation(); onClose() }}
  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
>
  <X className="w-5 h-5" />
</button>
```

To a larger, circular, more visible button:
```jsx
<button
  onClick={(e) => { e.stopPropagation(); onClose() }}
  style={{
    width: 44,
    height: 44,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,.15)',
    border: '1px solid rgba(255,255,255,.2)',
    color: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 200ms',
  }}
  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.3)' }}
  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}
>
  <X style={{ width: 22, height: 22 }} />
</button>
```

Also make the Gallery lightbox in `TeamWallPage.jsx` (around line 1008) use the same portal approach if it isn't already fullscreen:
```jsx
{galleryLightboxIdx !== null && createPortal(
  <PhotoLightbox
    photos={galleryImages}
    initialIndex={galleryLightboxIdx}
    onClose={() => setGalleryLightboxIdx(null)}
  />,
  document.body
)}
```

Add `import { createPortal } from 'react-dom'` to TeamWallPage.jsx if not already there.

---

## FIX 4: Roster Cards — Shoutout Icon + Click to Profile + Routing Fix

In `src/pages/teams/TeamWallPage.jsx`, find the roster section in the right column.

**Remove the broken hover popup entirely.** Replace with a simpler approach:

Each player row should have:
1. The player's avatar, name, jersey/position (as it is now)
2. A small **⭐ shoutout icon button** on the right side of the row
3. **Clicking the row** (not the star) opens `PlayerCardExpanded`
4. **Clicking the ⭐** opens the shoutout modal for that player

```jsx
{players.map(player => (
  <div key={player.id}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      borderRadius: 10, cursor: 'pointer', transition: 'all 200ms',
    }}
    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    {/* Avatar + Info — clicking this opens profile */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
      onClick={() => setSelectedPlayer(player)}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#4BB9EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
        {player.photo_url ? (
          <img src={player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          (player.first_name?.[0] || '') + (player.last_name?.[0] || '')
        )}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#fff' : '#10284C' }}>
          {player.first_name} {player.last_name}
        </p>
        <p style={{ fontSize: 12, fontWeight: 500, color: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)' }}>
          #{player.jersey_number} · {player.position}
        </p>
      </div>
    </div>

    {/* Shoutout button */}
    <button
      onClick={(e) => {
        e.stopPropagation()
        // Set the player as shoutout target and open shoutout modal
        setShoutoutTargetPlayer?.(player) || setSelectedShoutoutPlayer?.(player)
        setShowShoutoutModal(true)
      }}
      title="Give Shoutout"
      style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 16, transition: 'all 200ms',
      }}
      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(75,185,236,.15)' : 'rgba(75,185,236,.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      ⭐
    </button>
  </div>
))}
```

**Important — check what state variable opens the shoutout modal and pre-selects a player.** Look for `showShoutoutModal`, `shoutoutTarget`, `GiveShoutoutModal` in the file. The ⭐ button needs to set the target player AND open the modal. Match whatever state/props the existing `GiveShoutoutModal` component expects.

## FIX 5: Player Profile Close — Return to TeamWall

Find where `PlayerCardExpanded` is rendered in `TeamWallPage.jsx`. Its `onClose` callback must ONLY clear the selected player state. It should NOT navigate away:

```jsx
<PlayerCardExpanded
  player={selectedPlayer}
  teamId={teamId}
  // ... other props
  onClose={() => setSelectedPlayer(null)}  // Just clear state, stay on page
  onBack={() => setSelectedPlayer(null)}   // Same — don't navigate
/>
```

Search for any `onNavigate`, `navigate(`, or `onBack` calls in the PlayerCardExpanded rendering that might redirect to home/dashboard. Remove or replace them with `setSelectedPlayer(null)`.

---

## SUMMARY

| Fix | What | Files |
|-----|------|-------|
| 1 | Text contrast + font weight bump | FeedPost.jsx, TeamWallPage.jsx, NewPostModal.jsx |
| 2 | Lightbox fullscreen via portal | FeedPost.jsx |
| 3 | Lightbox close X prominent + gallery portal | PhotoLightbox.jsx, TeamWallPage.jsx |
| 4 | Roster: star shoutout icon + click for profile | TeamWallPage.jsx |
| 5 | Profile close → stay on TeamWall | TeamWallPage.jsx |

Apply all 5 fixes, verify the app compiles, then commit.
