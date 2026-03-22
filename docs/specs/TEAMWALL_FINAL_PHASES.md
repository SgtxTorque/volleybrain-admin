# TeamWall — Final Fix Phases
## Execute each phase, verify it works, then commit before moving to the next phase.

**Brand reference:** `public/lynx-brandbook-v2.html`

---

# PHASE 1: Layout & Structure Fixes
**Files:** `src/MainApp.jsx`, `src/pages/teams/TeamWallPage.jsx`
**Commit message:** `fix: TeamWall layout - breadcrumb, columns, scroll`

## 1A. Hide the Breadcrumb

The breadcrumb is rendered in `src/MainApp.jsx` around line 1103:
```jsx
<Breadcrumb />
```

It sits ABOVE all page content and pushes the TeamWall grid down. The Breadcrumb component is at `src/components/ui/Breadcrumb.jsx` — it already returns `null` for `/dashboard`, but NOT for `/teams/` routes.

**Fix:** In `src/components/ui/Breadcrumb.jsx`, find this line:
```jsx
if (pathname === '/dashboard' || pathname === '/') return null
```
Change it to ALSO hide on team routes:
```jsx
if (pathname === '/dashboard' || pathname === '/' || pathname.startsWith('/teams/')) return null
```

This hides the breadcrumb on TeamWall without affecting other pages. The "← Back" link already exists inside the left column.

## 1B. Widen Side Columns to 335px

In `src/pages/teams/TeamWallPage.jsx`, find the grid template definition. Change both side columns from whatever they are now to `335px`:
```
gridTemplateColumns: '335px 1fr 335px'
```

## 1C. Fix Center Column Scroll

In `src/pages/teams/TeamWallPage.jsx`, the 3-column grid parent AND the scrollable columns need explicit height constraints. 

Find the outermost container div for the 3-column layout. Give it:
```jsx
style={{ height: 'calc(100vh - 64px)' }}  // 64px = nav bar height
```

The center column `<main>` needs:
```jsx
style={{ overflowY: 'auto', height: '100%' }}
```

The right column also needs:
```jsx
style={{ overflowY: 'auto', height: '100%' }}
```

The left column needs:
```jsx
style={{ overflowY: 'auto', height: '100%' }}
```

All three columns should scroll independently. Add the scrollbar-hiding CSS if not already present:
```css
.tw-hide-scrollbar::-webkit-scrollbar { width: 0; background: transparent; }
.tw-hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
```

Apply `tw-hide-scrollbar` className to all three column containers.

## 1D. Right Column — Leaderboard Text Cutoff

In the right column, the Challenges / Achievements / Leaderboard links are getting cut off. This is likely because the container has `overflow: hidden` without enough width or the text is truncating. Find these elements and ensure:
- The text "Leaderboard" is fully visible (no `truncate`, no `overflow-hidden` on the text, no `whitespace-nowrap` that clips it)
- The container width matches the new 335px column width

**After these fixes: verify the page loads, columns sit against the nav bar, center column scrolls, breadcrumb is gone on team pages. Commit.**

---

# PHASE 2: Post Card Fixes
**Files:** `src/pages/teams/FeedPost.jsx`, `src/constants/hubStyles.js`
**Commit message:** `fix: FeedPost - edge photos, no border at rest, caption below, comment toggle, text post card`

## 2A. Photos Edge-to-Edge

In `src/pages/teams/FeedPost.jsx`, in the `renderPhotoGrid()` function:

**Single image (lines 74-86):** Change:
```jsx
<div className="px-4 pb-4">
  <div className="w-full overflow-hidden rounded-xl">
```
To:
```jsx
<div>
  <div className="w-full overflow-hidden">
```

**All other variants (2-image, 3-image, 4-image, 5+):** Remove `px-4 pb-4` class, remove `rounded-xl` from inner grid containers. Keep `gap-1` for multi-photo grids and `overflow-hidden` on the grid.

## 2B. No Border/Shadow at Rest

**Option A (preferred — create new class):** In `src/constants/hubStyles.js`, ADD a new class `tw-post-card` instead of modifying `tw-glass` (which other pages use):

```css
.tw-post-card {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 16px;
  transition: all 250ms;
  overflow: hidden;
}
.tw-post-card:hover {
  background: rgba(255,255,255,.03);
  border-color: rgba(255,255,255,.08);
  box-shadow: 0 8px 24px rgba(0,0,0,.3);
  transform: translateY(-2px);
}

.tw-light .tw-post-card {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.tw-light .tw-post-card:hover {
  background: rgba(255,255,255,.9);
  border-color: rgba(0,0,0,.06);
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  transform: translateY(-2px);
}
```

Then in `src/pages/teams/FeedPost.jsx` line 179, change:
```jsx
<article className={`tw-glass overflow-hidden tw-ac ${accentClass}`}
```
To:
```jsx
<article className={`tw-post-card overflow-hidden tw-ac ${accentClass}`}
```

## 2C. Content Order — Instagram Layout

In `src/pages/teams/FeedPost.jsx`, rearrange the render order inside the `<article>`. Currently:
1. Post Header (lines 180-260)
2. Content (lines 262-295) 
3. Photo Grid (line 298)
4. Lightbox (lines 300-307)
5. Interaction Bar (lines 309-340)
6. CommentSection (lines 342-352)

Change to this order for **photo posts and announcements**:
1. Post Header
2. Photo Grid
3. Lightbox
4. Content/Caption ← moved here
5. Interaction Bar
6. CommentSection

**BUT for text-only posts** (no media AND not shoutout/milestone), render:
1. Post Header
2. Text Content Card (special treatment — see 2E below)
3. Interaction Bar
4. CommentSection

Use a conditional to determine the layout:
```jsx
const hasMedia = mediaUrls.length > 0
const isShoutout = postType === 'shoutout' && shoutoutMeta
const isMilestone = postType === 'milestone' && milestoneMeta
const isTextOnly = !hasMedia && !isShoutout && !isMilestone
```

## 2D. Comment Section — Toggle on Click

Add state:
```jsx
const [showComments, setShowComments] = useState(false)
```

Find the MessageCircle button (around line 324). Wrap it in a clickable button:
```jsx
<button onClick={() => setShowComments(!showComments)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0 }}>
  <MessageCircle className="w-6 h-6" style={{ color: isDark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)' }} />
  <div className="text-left">
    <p className="text-sm font-bold" style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}>{localCommentCount}</p>
    <p className="text-[8px] font-bold uppercase tracking-wider leading-none" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}>COMMENTS</p>
  </div>
</button>
```

Wrap CommentSection:
```jsx
{showComments && (
  <CommentSection ... />
)}
```

## 2E. Text-Only Posts — Card Treatment with Truncation

When a post has NO media and is NOT a shoutout or milestone, render the text inside a styled card (similar to how shoutouts get their own card):

```jsx
{isTextOnly && (
  <div className="px-6 pb-3">
    <div style={{
      background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`,
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <TextContent content={post.content} isDark={isDark} />
    </div>
  </div>
)}
```

Create a `TextContent` sub-component inside FeedPost.jsx:

```jsx
function TextContent({ content, isDark }) {
  const [expanded, setExpanded] = useState(false)
  if (!content) return null
  
  const lines = content.split('\n')
  const isLong = lines.length > 5 || content.length > 300
  
  // Calculate font size based on length — shorter = bigger
  let fontSize = 18
  if (content.length > 100) fontSize = 16
  if (content.length > 200) fontSize = 15
  if (content.length > 400) fontSize = 14
  
  const displayContent = (!expanded && isLong) 
    ? lines.slice(0, 5).join('\n') + (lines.length > 5 ? '...' : '')
    : content
  
  return (
    <div>
      <p style={{
        fontSize,
        fontWeight: 400,
        lineHeight: 1.6,
        color: isDark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.85)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
        dangerouslySetInnerHTML={{ __html: formatPostText(displayContent) }}
      />
      {isLong && !expanded && (
        <button 
          onClick={() => setExpanded(true)}
          style={{ color: '#4BB9EC', fontSize: 14, fontWeight: 600, marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ...more
        </button>
      )}
    </div>
  )
}
```

Also add a simple text formatting function at the top of FeedPost.jsx:
```jsx
function formatPostText(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')                    // *italic*
    .replace(/__(.*?)__/g, '<u>$1</u>')                      // __underline__
    .replace(/^[-•]\s+(.+)$/gm, '<span style="display:block;padding-left:16px">• $1</span>')  // bullet points
    .replace(/\n/g, '<br/>')                                  // newlines
}
```

## 2F. Remove Post Title Rendering

In `src/pages/teams/FeedPost.jsx`, find lines 287-289:
```jsx
{post.title && !titleIsJson && (
  <h3 ...>{post.title}</h3>
)}
```
Delete this block entirely. Only `post.content` should render.

## 2G. Achievement/Milestone Posts — Content Above Engagement

For shoutout and milestone posts, the content card (ShoutoutCard or milestone card) should also be ABOVE the interaction bar, same as photos. Make sure the render order is:
1. Post Header
2. Shoutout/Milestone content card
3. Interaction Bar
4. CommentSection

**After these fixes: verify post cards look clean, photos are edge-to-edge, text posts have a card treatment, comments only show on click. Commit.**

---

# PHASE 3: Event Hero Card + Season Record
**Files:** `src/pages/teams/TeamWallPage.jsx`
**Commit message:** `fix: TeamWall event hero with photos, season record query`

## 3A. Event Hero Card — Background Photos

Find the next event hero card in the left column. Replace it with a photo-backed card. Use these images from the repo:

- **Games/Tournaments:** `/images/volleyball-game.jpg`
- **Practices:** `/images/volleyball-practice.jpg`

```jsx
{nextEvent && (() => {
  const isGame = nextEvent.event_type === 'game' || nextEvent.event_type === 'tournament'
  const bgImage = isGame ? '/images/volleyball-game.jpg' : '/images/volleyball-practice.jpg'
  const dayLabel = getDayLabel(nextEvent.start_date)
  
  return (
    <div style={{
      borderRadius: 12, overflow: 'hidden', position: 'relative', minHeight: 200,
      border: `1px solid ${borderColor}`, boxShadow: shadow,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.15) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 200 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#4BB9EC', color: '#fff' }}>
            {nextEvent.event_type?.toUpperCase() || 'GAME'}
          </span>
          {dayLabel && (
            <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#F59E0B', color: '#fff' }}>
              {dayLabel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>
          {nextEvent.event_type === 'practice' ? 'Practice' : 'Game Day'}
        </p>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
          {nextEvent.opponent ? `vs ${nextEvent.opponent}` : nextEvent.title || 'Practice'}
        </p>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span>📅 {new Date(nextEvent.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span>🕐 {formatTime12(nextEvent.start_time)}</span>
          <span>📍 {nextEvent.location || 'TBD'}</span>
        </div>
        <button 
          onClick={() => {
            const q = encodeURIComponent(nextEvent.location || '')
            window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
          }}
          style={{
            marginTop: 12, padding: '8px 16px', borderRadius: 10,
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content',
          }}>
          📍 Get Directions
        </button>
      </div>
    </div>
  )
})()}
```

## 3B. Season Record — Fix the Query

The current query in `src/pages/teams/TeamWallPage.jsx` (around line 266) queries the `games` table with `.select('result, created_at')` and filters `result === 'win'`. But the CoachDashboard uses `.select('team_score, opponent_score, status')` and compares scores instead.

Check which approach actually returns data. The CoachDashboard version (around line 616 of `CoachDashboard.jsx`) uses:
```jsx
.from('games')
.select('team_score, opponent_score, status, date')
.eq('team_id', team.id)
.eq('status', 'completed')
```

Update the TeamWall query to match:
```jsx
const { data: games } = await supabase
  .from('games')
  .select('team_score, opponent_score, status, date')
  .eq('team_id', teamId)
  .eq('status', 'completed')
  .order('date', { ascending: false })

if (games) {
  let wins = 0, losses = 0
  const recentForm = []
  games.forEach((g, i) => {
    const won = (g.team_score || 0) > (g.opponent_score || 0)
    if (won) wins++; else losses++
    if (i < 5) recentForm.push(won ? 'win' : 'loss')
  })
  setGameRecord({ wins, losses, recentForm })
}
```

**After these fixes: verify hero card has photo background, season record pulls real data. Commit.**

---

# PHASE 4: Player Card Popup + Create Post Enhancements
**Files:** `src/pages/teams/TeamWallPage.jsx`, `src/pages/teams/NewPostModal.jsx`
**Commit message:** `feat: player popup actions, text formatting toolbar, background colors in create post`

## 4A. Player Card — Click Popup with Actions

In `src/pages/teams/TeamWallPage.jsx`, find the roster section in the right column.

Add state:
```jsx
const [activePlayerPopup, setActivePlayerPopup] = useState(null)
```

Each player row needs `position: relative` and an onClick that toggles the popup:
```jsx
onClick={() => setActivePlayerPopup(activePlayerPopup === player.id ? null : player.id)}
```

When `activePlayerPopup === player.id`, show a popup positioned to the left of the row:
```jsx
{activePlayerPopup === player.id && (
  <div style={{
    position: 'absolute', left: -170, top: '50%', transform: 'translateY(-50%)',
    background: isDark ? '#1A2332' : '#FFFFFF',
    border: `1px solid ${isDark ? '#2A3545' : '#DFE4EA'}`,
    borderRadius: 12,
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,.3)' : '0 8px 24px rgba(0,0,0,.08)',
    padding: 10, minWidth: 155, zIndex: 50,
  }}>
    <button onClick={(e) => { e.stopPropagation(); setShoutoutTargetPlayer(player); setShowShoutoutModal(true); setActivePlayerPopup(null) }}
      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: '#4BB9EC', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 6, textAlign: 'center' }}>
      ⭐ Give Shoutout
    </button>
    <button onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setActivePlayerPopup(null) }}
      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'transparent', color: isDark ? '#B0BEC5' : '#5A6B7F', fontSize: 13, fontWeight: 500, border: `1.5px solid ${isDark ? '#2A3545' : '#DFE4EA'}`, cursor: 'pointer', textAlign: 'center' }}>
      👤 View Profile
    </button>
  </div>
)}
```

Add click-outside-to-close: when clicking anywhere outside a player row, set `activePlayerPopup(null)`. Use a `useEffect` with `mousedown` listener, same pattern as FeedPost's menu.

## 4B. Player Profile Close — Stay on TeamWall

Find where `PlayerCardExpanded` is rendered in `TeamWallPage.jsx`. Make sure its `onClose` only clears the selected player:
```jsx
onClose={() => setSelectedPlayer(null)}
```

It should NOT call `onNavigate`, `onBack`, or `navigate()`. Just clearing the state unmounts the modal and the user stays on TeamWall.

## 4C. Create Post Modal — Simple Text Formatting Toolbar

In `src/pages/teams/NewPostModal.jsx`, add a formatting toolbar between the textarea and the drag-drop zone.

The toolbar should have 4 buttons: **Bold**, *Italic*, _Underline_, • Bullet

These insert markdown-style markers around selected text or at cursor position:
- Bold: wraps selection in `**text**`
- Italic: wraps selection in `*text*`
- Underline: wraps selection in `__text__`
- Bullet: prepends `• ` to the current line

```jsx
function insertFormat(format) {
  const ta = textareaRef.current
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = content.substring(start, end)
  
  let newText
  if (format === 'bullet') {
    const before = content.substring(0, start)
    const lineStart = before.lastIndexOf('\n') + 1
    newText = content.substring(0, lineStart) + '• ' + content.substring(lineStart)
    setContent(newText)
  } else {
    const wrap = format === 'bold' ? '**' : format === 'italic' ? '*' : '__'
    newText = content.substring(0, start) + wrap + selected + wrap + content.substring(end)
    setContent(newText)
  }
}
```

Toolbar UI (place between textarea and drag-drop):
```jsx
<div className="px-5 pb-2 flex items-center gap-1">
  <button onClick={() => insertFormat('bold')} title="Bold"
    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
    B
  </button>
  <button onClick={() => insertFormat('italic')} title="Italic"
    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, fontStyle: 'italic', color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
    I
  </button>
  <button onClick={() => insertFormat('underline')} title="Underline"
    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, textDecoration: 'underline', color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
    U
  </button>
  <button onClick={() => insertFormat('bullet')} title="Bullet Point"
    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 13, color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
    •
  </button>
</div>
```

## 4D. Create Post Modal — Background Color Picker (Facebook-style)

Add state to `NewPostModal.jsx`:
```jsx
const [bgColor, setBgColor] = useState(null)
const [showBgPicker, setShowBgPicker] = useState(false)
```

Define color/gradient options:
```jsx
const BG_OPTIONS = [
  null, // no background (default)
  '#1A1A2E', '#E74C3C', '#FF1493', '#2C2C2C',
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
  'linear-gradient(135deg, #8360c3, #2ebf91)',
]

const EXTENDED_BG_OPTIONS = [
  // More solid colors
  '#0A1B33', '#10284C', '#1B4332', '#7B2D8E', '#B91C1C', '#D97706', '#0369A1', '#4338CA',
  // More gradients
  'linear-gradient(135deg, #ff9a9e, #fad0c4)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
  'linear-gradient(135deg, #d4fc79, #96e6a1)',
  'linear-gradient(135deg, #84fab0, #8fd3f4)',
  'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
  'linear-gradient(135deg, #fddb92, #d1fdff)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
  'linear-gradient(135deg, #f5576c, #ff6f91)',
]
```

Add an "Aa" button (like Facebook's) next to the formatting toolbar. When clicked, show a scrollable row of color swatches. The last two swatches are a grid icon (opens extended picker) and a smiley (no background):

```jsx
{/* Background color button — only show when no photos attached */}
{mediaPreviews.length === 0 && (
  <button onClick={() => setShowBgPicker(!showBgPicker)} title="Choose background"
    style={{
      width: 32, height: 32, borderRadius: 8, fontSize: 14, fontWeight: 700,
      background: bgColor || (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'),
      color: bgColor ? '#fff' : (isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)'),
      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
    Aa
  </button>
)}
```

When `showBgPicker` is true, show the swatch row beneath the toolbar:
```jsx
{showBgPicker && (
  <div className="px-5 pb-2">
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="tw-hide-scrollbar">
      {BG_OPTIONS.map((bg, i) => (
        <button key={i} onClick={() => setBgColor(bg)}
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
            background: bg || (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'),
            border: bgColor === bg ? '2px solid #4BB9EC' : '1px solid rgba(255,255,255,.1)',
          }}
        />
      ))}
    </div>
  </div>
)}
```

When `bgColor` is set, change the textarea area to show the background:
```jsx
<div className="px-5 pt-2 pb-1" style={{
  ...(bgColor && {
    background: bgColor,
    minHeight: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 -1px',
    padding: '32px 24px',
  }),
}}>
  <textarea
    ref={textareaRef}
    placeholder="What's on your mind?"
    value={content}
    onChange={e => setContent(e.target.value)}
    className="w-full bg-transparent focus:outline-none resize-none leading-relaxed"
    style={{
      color: bgColor ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.85)'),
      fontSize: bgColor ? 22 : 15,
      fontWeight: bgColor ? 700 : 400,
      textAlign: bgColor ? 'center' : 'left',
      minHeight: bgColor ? 'auto' : 120,
      textShadow: bgColor ? '0 1px 4px rgba(0,0,0,.3)' : 'none',
    }}
  />
</div>
```

Save the bgColor in the post submission. Add it to the insert payload:
```jsx
const insertPayload = {
  team_id: teamId,
  author_id: user?.id,
  title: bgColor ? JSON.stringify({ bgColor }) : null,  // store bg in title field as JSON
  content: content.trim() || null,
  post_type: bgColor ? 'announcement' : postType,  // text+bg = announcement type
  ...
}
```

Then in `FeedPost.jsx`, detect the bgColor from the title JSON and render text posts with that background in the feed card.

**After these fixes: verify player popup works, create post has formatting toolbar + bg colors, text posts render with card treatment. Commit.**

---

## SUMMARY

| Phase | Fixes | Files |
|-------|-------|-------|
| 1 | Breadcrumb, column widths, scroll, leaderboard text | MainApp.jsx, Breadcrumb.jsx, TeamWallPage.jsx |
| 2 | Edge photos, no border at rest, caption below, comment toggle, text card, remove title | FeedPost.jsx, hubStyles.js |
| 3 | Event hero with photos, season record query | TeamWallPage.jsx |
| 4 | Player popup, profile close routing, text formatting, bg colors | TeamWallPage.jsx, NewPostModal.jsx |

Execute Phase 1 first, verify and commit, then Phase 2, verify and commit, etc.
