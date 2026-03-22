# TeamWall — Shoutout Digest + Final Polish
## Claude Code Prompt

**Commit message:** `feat: shoutout digest card, remove shoutout posts from feed, fix undefined names, reduce post gap`

**Files to edit:**
- `src/pages/teams/TeamWallPage.jsx` — digest card, filter shoutouts from feed, preselect fix, padding
- `src/pages/teams/FeedPost.jsx` — remove aggregation rendering (if added in previous fix)
- `src/components/engagement/GiveShoutoutModal.jsx` — fix undefined name bug

---

## FIX 1: Shoutout Preselect — Fix Undefined Names

The `GiveShoutoutModal` expects `preselectedRecipient` to have shape `{ id, full_name, avatar_url, role }`. But the star button on roster cards is either not passing it at all, or passing wrong property names.

**In `src/pages/teams/TeamWallPage.jsx`:**

Add state:
```jsx
const [shoutoutPreselect, setShoutoutPreselect] = useState(null)
```

Find the ⭐ star button on each player roster row. Change its onClick to pass the correctly shaped object:
```jsx
onClick={(e) => {
  e.stopPropagation()
  setShoutoutPreselect({
    id: player.id,
    full_name: `${player.first_name} ${player.last_name}`,
    avatar_url: player.photo_url || null,
    role: 'player',
  })
  setShowShoutoutModal(true)
}
```

**IMPORTANT:** The property must be `full_name` (not `name`), and `avatar_url` (not `photo`). These must match what `GiveShoutoutModal` uses on `selectedRecipient.full_name` and `selectedRecipient.avatar_url` (see line ~116 of GiveShoutoutModal.jsx where it builds metadata: `receiverName: selectedRecipient.full_name`).

Find where `GiveShoutoutModal` is rendered (around line 1042) and add the prop:
```jsx
<GiveShoutoutModal
  visible={showShoutoutModal}
  teamId={teamId}
  preselectedRecipient={shoutoutPreselect}
  onClose={() => { setShowShoutoutModal(false); setShoutoutPreselect(null) }}
  onSuccess={() => { loadPosts(1, true); showToast?.('Shoutout sent!', 'success'); setShoutoutPreselect(null) }}
/>
```

For any place that opens the shoutout modal WITHOUT a specific player (like a general "Give Shoutout" button), make sure it clears the preselect first:
```jsx
setShoutoutPreselect(null)
setShowShoutoutModal(true)
```

**Also in `src/components/engagement/GiveShoutoutModal.jsx`:**

Add a safety check so `receiverName` never ends up as `undefined`. Find line ~116:
```jsx
receiverName: selectedRecipient.full_name,
```
Change to:
```jsx
receiverName: selectedRecipient.full_name || selectedRecipient.name || 'Player',
```

And in the `useEffect` that resets on open (around line 32), update the preselectedRecipient dependency:
```jsx
useEffect(() => {
  if (visible) {
    setStep(preselectedRecipient ? 'category' : 'recipient')
    setSelectedRecipient(preselectedRecipient || null)
    setSelectedCategory(null)
    setMessage('')
    setSearch('')
    loadData()
  }
}, [visible, preselectedRecipient])
```

---

## FIX 2: Remove Individual Shoutout Posts from Feed

Shoutout posts should NO LONGER render as individual cards in the feed. The feed should filter them out entirely.

**In `src/pages/teams/TeamWallPage.jsx`:**

Find where posts are mapped to `<FeedPost>` components (around line 770). Before mapping, filter out shoutout posts:

```jsx
const feedPosts = posts.filter(p => p.post_type !== 'shoutout')
```

Then use `feedPosts` instead of `posts` for the feed rendering:
```jsx
{feedPosts.length > 0 ? (
  <div className="flex flex-col" style={{ gap: '17px' }}>
    {feedPosts.map((post, i) => (
      <FeedPost key={post.id} post={post} ... />
    ))}
  </div>
) : ( ... )}
```

**ALSO:** If the previous fix added any aggregation logic (`aggregateShoutouts` function, `_isAggregated` flags, shoutout grouping code), REMOVE all of it. We don't need aggregation anymore — shoutouts simply don't appear in the feed.

**In `src/pages/teams/FeedPost.jsx`:**

If the previous fix added any `isAggregatedShoutout` rendering code, REMOVE it. FeedPost no longer needs to handle shoutout aggregation at all. Individual shoutouts that somehow slip through should still render via the existing `ShoutoutCard` component as a fallback, but normally they won't appear because the feed filters them out.

---

## FIX 3: Shoutout Digest Card — Pinned at Top of Feed

Add a new component inside `TeamWallPage.jsx` that renders between the Create Post bar and the first post. This is NOT a post — it's a system UI widget.

**Add state for shoutout digest data:**
```jsx
const [shoutoutDigest, setShoutoutDigest] = useState({ recent: [], total: 0, lastShoutoutDate: null })
```

**Add a data loader (inside the main `loadTeamData` or as a separate function):**
```jsx
async function loadShoutoutDigest() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentShoutouts } = await supabase
      .from('shoutouts')
      .select('id, receiver_id, category, message, created_at, giver_id, players:receiver_id(first_name, last_name, photo_url)')
      .eq('team_id', teamId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
    
    if (!recentShoutouts || recentShoutouts.length === 0) {
      setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
      return
    }
    
    // Group by receiver
    const byReceiver = new Map()
    for (const s of recentShoutouts) {
      const rid = s.receiver_id
      if (!byReceiver.has(rid)) {
        byReceiver.set(rid, {
          receiverId: rid,
          name: s.players ? `${s.players.first_name} ${s.players.last_name}` : 'Player',
          photo: s.players?.photo_url || null,
          count: 0,
          categories: [],
        })
      }
      const entry = byReceiver.get(rid)
      entry.count++
      if (!entry.categories.includes(s.category)) entry.categories.push(s.category)
    }
    
    // Sort by count descending
    const ranked = Array.from(byReceiver.values()).sort((a, b) => b.count - a.count)
    
    setShoutoutDigest({
      recent: ranked,
      total: recentShoutouts.length,
      lastShoutoutDate: recentShoutouts[0]?.created_at || null,
    })
  } catch (err) {
    console.log('Could not load shoutout digest:', err)
  }
}
```

Call `loadShoutoutDigest()` inside the main data loading function, and also call it after a shoutout is successfully sent (in the `onSuccess` callback).

**Render the digest card between Create Post bar and the feed:**

```jsx
{/* ─── Shoutout Digest Card ─── */}
{(() => {
  const hasActivity = shoutoutDigest.total > 0
  const noRecentActivity = !hasActivity
  
  // Nudge messages when no activity
  const nudges = [
    "Who impressed you this week? 🏐",
    "Recognize a teammate's hard work ⭐",
    "Shoutouts boost team morale! 💪",
    "Be the first to give props this week 🙌",
    "Your teammates love recognition ❤️",
  ]
  const nudge = nudges[Math.floor(Date.now() / 86400000) % nudges.length] // rotates daily
  
  return (
    <div style={{
      background: isDark ? 'rgba(75,185,236,.06)' : 'rgba(75,185,236,.03)',
      border: `1px solid ${isDark ? 'rgba(75,185,236,.12)' : 'rgba(75,185,236,.08)'}`,
      borderRadius: 12,
      padding: '14px 18px',
      transition: 'all 250ms',
    }}>
      {hasActivity ? (
        <>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⭐</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#4BB9EC', letterSpacing: '0.05em' }}>
                {shoutoutDigest.total} SHOUTOUT{shoutoutDigest.total !== 1 ? 'S' : ''} THIS WEEK
              </span>
            </div>
            <button
              onClick={() => { setShoutoutPreselect(null); setShowShoutoutModal(true) }}
              style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                background: '#4BB9EC', color: '#fff', border: 'none', cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2A9BD4'}
              onMouseLeave={e => e.currentTarget.style.background = '#4BB9EC'}
            >
              Give Shoutout
            </button>
          </div>
          
          {/* Player summary — show top 4 max */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {shoutoutDigest.recent.slice(0, 4).map((r, i) => (
              <div key={r.receiverId} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px 4px 4px', borderRadius: 999,
                background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)',
                fontSize: 12, fontWeight: 600,
                color: isDark ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.7)',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', overflow: 'hidden',
                  background: '#4BB9EC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0,
                }}>
                  {r.photo ? (
                    <img src={r.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    r.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                {r.name.split(' ')[0]}
                <span style={{ color: '#4BB9EC', fontWeight: 700 }}>({r.count})</span>
              </div>
            ))}
            {shoutoutDigest.recent.length > 4 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)' }}>
                +{shoutoutDigest.recent.length - 4} more
              </span>
            )}
          </div>
        </>
      ) : (
        /* Nudge state — no shoutouts in 7 days */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}>
                No shoutouts this week
              </p>
              <p style={{ fontSize: 12, fontWeight: 400, color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.35)', marginTop: 2 }}>
                {nudge}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShoutoutPreselect(null); setShowShoutoutModal(true) }}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: '#4BB9EC', color: '#fff', border: 'none', cursor: 'pointer',
              transition: 'all 200ms', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2A9BD4'}
            onMouseLeave={e => e.currentTarget.style.background = '#4BB9EC'}
          >
            Be the first ⭐
          </button>
        </div>
      )}
    </div>
  )
})()}
```

Place this in the center column, after the Create Post bar and BEFORE the post feed.

---

## FIX 4: Reduce Padding Between Post Cards

Find the flex container that holds the post feed (the `div` wrapping `FeedPost` components). Change the gap from whatever it is now (likely `gap: 20px` or `gap-5` in Tailwind which is 20px) to `17px`:

If it uses Tailwind class `gap-5`, replace with inline style:
```jsx
<div className="flex flex-col" style={{ gap: '17px' }}>
```

If it already uses inline gap, just change the value to `17px`.

This applies to the feed post list only, not the overall page gaps.

---

## FIX 5: Clean Up Previous Aggregation Code

If the previous fix added ANY of the following, REMOVE them:
- `aggregateShoutouts()` function in TeamWallPage.jsx
- `_isAggregated`, `_aggregateCount`, `_aggregateGivers`, `_aggregateCategories`, `_aggregatePosts`, `_recipientName`, `_recipientPhoto` properties
- "SHOUTOUT WAVE" card rendering in FeedPost.jsx
- `isAggregatedShoutout` variable in FeedPost.jsx
- Any grouping/windowing logic for shoutout posts

All of that is replaced by the digest card approach. Keep it clean.

---

## EXECUTION ORDER

1. Fix 5 — Remove old aggregation code first (clean slate)
2. Fix 1 — Shoutout preselect + undefined name fix
3. Fix 2 — Filter shoutouts out of feed
4. Fix 3 — Add digest card widget
5. Fix 4 — Reduce post gap

Verify the app compiles and:
- ⭐ on roster card → modal opens at category step with player pre-selected
- "Give Shoutout" button in digest / sidebar → modal opens at player picker step
- Shoutout posts do NOT appear in the feed
- Digest card shows shoutout summary at top of feed
- If no shoutouts in 7 days, nudge message appears
- No "undefined" in any shoutout text
- Post cards have slightly tighter spacing

Then commit.
