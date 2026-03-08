# TeamWall — Final Polish (Reactions, Shoutout Flow, Feed Aggregation)
## Claude Code Prompt

**Commit after all fixes:** `fix: reactions contrast, shoutout star preselect, shoutout feed aggregation`

**Files to edit:**
- `src/components/teams/ReactionBar.jsx` — text contrast fix
- `src/pages/teams/TeamWallPage.jsx` — shoutout star preselect, aggregation logic, shoutout link under leaderboard
- `src/pages/teams/FeedPost.jsx` — aggregated shoutout card rendering

---

## FIX 1: Reactions Label Text Contrast

In `src/components/teams/ReactionBar.jsx`, the "REACTIONS" label and count text are too faint. Find and replace these values:

**Line ~199 (active reactions label):**
```jsx
style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}
```
Change to:
```jsx
style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}
```

**Line ~198 (active reactions count):**
```jsx
style={{ color: myReaction ? g : (isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)') }}
```
Change to:
```jsx
style={{ color: myReaction ? g : (isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)') }}
```

**Line ~206 (zero reactions count):**
```jsx
style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}
```
Change to:
```jsx
style={{ color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}
```

**Line ~207 (zero reactions label):**
```jsx
style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)' }}
```
Change to:
```jsx
style={{ color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}
```

Also check **line ~166** (emoji count in picker):
```jsx
style={{ color: myReaction === r.type ? g : (isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)') }}
```
Change to:
```jsx
style={{ color: myReaction === r.type ? g : (isDark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.55)') }}
```

---

## FIX 2: Shoutout Star → Pre-select Player, Skip to Category Step

The `GiveShoutoutModal` already supports a `preselectedRecipient` prop — when provided, it skips the player picker and goes straight to the "category" step. But the modal is currently rendered WITHOUT this prop.

In `src/pages/teams/TeamWallPage.jsx`:

**Step 1:** Add state for the preselected player:
```jsx
const [shoutoutPreselect, setShoutoutPreselect] = useState(null)
```

**Step 2:** Find the ⭐ star button on roster player cards. Change its onClick to:
```jsx
onClick={(e) => {
  e.stopPropagation()
  setShoutoutPreselect({
    id: player.id,
    name: `${player.first_name} ${player.last_name}`,
    photo: player.photo_url,
    type: 'player',
  })
  setShowShoutoutModal(true)
}
```

**Step 3:** Find where `GiveShoutoutModal` is rendered (around line 1042). Add the `preselectedRecipient` prop:
```jsx
<GiveShoutoutModal
  visible={showShoutoutModal}
  teamId={teamId}
  preselectedRecipient={shoutoutPreselect}
  onClose={() => { setShowShoutoutModal(false); setShoutoutPreselect(null) }}
  onSuccess={() => { loadPosts(1, true); showToast?.('Shoutout sent!', 'success'); setShoutoutPreselect(null) }}
/>
```

**Step 4:** For the BULK shoutout option, add a "Give Shoutout" link in the right column under the Leaderboard item:

Find the Challenges / Achievements / Leaderboard section. After the Leaderboard row, add:
```jsx
<div
  onClick={() => { setShoutoutPreselect(null); setShowShoutoutModal(true) }}
  style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    cursor: 'pointer', transition: 'all 200ms', borderRadius: 10,
  }}
  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
>
  <span style={{ fontSize: 18 }}>⭐</span>
  <span style={{ fontSize: 15, fontWeight: 600, color: '#4BB9EC' }}>Give Shoutout</span>
</div>
```

When clicked with NO preselect, the modal opens at the player picker step (bulk flow). When clicked from a star icon WITH preselect, it skips to category step.

---

## FIX 3: Shoutout Feed Aggregation (Rolling Window)

This is the big feature. When multiple shoutouts are given to the same player within a rolling 6-hour window, they should be collapsed into ONE feed card instead of individual posts.

### 3A. Aggregation Logic in TeamWallPage.jsx

In the `TeamWallPage.jsx`, find where posts are loaded and passed to the feed. After fetching posts, add aggregation logic BEFORE rendering:

```jsx
// Add this function near the top of the component, after state declarations
function aggregateShoutouts(posts) {
  const WINDOW_MS = 6 * 60 * 60 * 1000 // 6-hour rolling window
  const result = []
  const shoutoutGroups = new Map() // key: recipientId, value: { posts: [], latestTime }
  
  for (const post of posts) {
    if (post.post_type !== 'shoutout') {
      result.push(post)
      continue
    }
    
    // Parse shoutout metadata to get recipient
    let meta = null
    try {
      if (post.title) meta = JSON.parse(post.title)
    } catch {}
    
    if (!meta?.receiverId) {
      result.push(post) // Can't parse, show individually
      continue
    }
    
    const recipientKey = meta.receiverId
    const postTime = new Date(post.created_at).getTime()
    
    if (shoutoutGroups.has(recipientKey)) {
      const group = shoutoutGroups.get(recipientKey)
      const timeDiff = Math.abs(postTime - group.latestTime)
      
      if (timeDiff <= WINDOW_MS) {
        // Within window — add to group
        group.posts.push(post)
        group.latestTime = Math.max(group.latestTime, postTime)
        continue
      }
    }
    
    // First shoutout for this recipient (or outside window) — start new group
    shoutoutGroups.set(recipientKey, {
      posts: [post],
      latestTime: postTime,
      recipientKey,
    })
  }
  
  // Convert groups to aggregated cards or individual posts
  for (const [key, group] of shoutoutGroups) {
    if (group.posts.length === 1) {
      // Single shoutout — show as individual card
      result.push(group.posts[0])
    } else {
      // Multiple shoutouts — create aggregated post object
      const firstPost = group.posts[0]
      let firstMeta = null
      try { firstMeta = JSON.parse(firstPost.title) } catch {}
      
      const givers = group.posts.map(p => p.profiles?.full_name || 'Someone')
      const categories = group.posts.map(p => {
        try { return JSON.parse(p.title) } catch { return null }
      }).filter(Boolean)
      
      const aggregatedPost = {
        ...firstPost,
        id: `agg-${key}-${firstPost.id}`,
        _isAggregated: true,
        _aggregateCount: group.posts.length,
        _aggregateGivers: givers,
        _aggregateCategories: categories,
        _aggregatePosts: group.posts,
        _recipientName: firstMeta?.receiverName || 'Player',
        _recipientPhoto: firstMeta?.receiverPhotoUrl || null,
        created_at: new Date(group.latestTime).toISOString(), // Use latest time for sorting
      }
      result.push(aggregatedPost)
    }
  }
  
  // Sort by created_at descending (newest first)
  result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  return result
}
```

Then where posts are passed to the feed rendering (around line 770), wrap them:
```jsx
{(() => {
  const displayPosts = aggregateShoutouts(posts)
  return displayPosts.length > 0 ? (
    <div className="flex flex-col gap-5">
      {displayPosts.map((post, i) => (
        <FeedPost key={post.id} post={post} g={g} gb={gb} i={i} isDark={isDark}
          isAdminOrCoach={isAdminOrCoach}
          currentUserId={user?.id}
          onDelete={deletePost}
          onTogglePin={togglePinPost}
          onEdit={editPostContent}
          onCommentCountChange={(postId, count) => {
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: count } : p))
          }}
          onReactionCountChange={(postId, count) => {
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, reaction_count: count } : p))
          }} />
      ))}
    </div>
  ) : (
    // ... existing empty state ...
  )
})()}
```

### 3B. Aggregated Shoutout Card in FeedPost.jsx

In `src/pages/teams/FeedPost.jsx`, add handling for aggregated shoutouts. Near the top of the component, detect the aggregated flag:

```jsx
const isAggregatedShoutout = post._isAggregated === true
```

Then in the render, add a branch for aggregated shoutouts. Place this BEFORE the existing shoutout rendering:

```jsx
{isAggregatedShoutout ? (
  <div className="px-6 pb-3">
    <div style={{
      background: isDark ? 'rgba(75,185,236,.06)' : 'rgba(75,185,236,.04)',
      border: `1.5px solid ${isDark ? 'rgba(75,185,236,.15)' : 'rgba(75,185,236,.1)'}`,
      borderRadius: 12,
      padding: '20px 24px',
      textAlign: 'center',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>⭐</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4BB9EC' }}>
          SHOUTOUT WAVE
        </span>
        <span style={{ fontSize: 24 }}>⭐</span>
      </div>
      
      {/* Recipient */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
        {post._recipientPhoto && (
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #4BB9EC' }}>
            <img src={post._recipientPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <p style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#fff' : '#10284C' }}>
          {post._recipientName}
        </p>
      </div>
      
      <p style={{ fontSize: 15, fontWeight: 500, color: isDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)' }}>
        received <span style={{ fontWeight: 700, color: '#4BB9EC' }}>{post._aggregateCount}</span> shoutouts!
      </p>
      
      {/* Category breakdown */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {(() => {
          // Count categories
          const catCounts = {}
          post._aggregateCategories.forEach(c => {
            const key = c.categoryName || c.categoryEmoji || 'Shoutout'
            catCounts[key] = (catCounts[key] || 0) + 1
          })
          return Object.entries(catCounts).map(([name, count]) => (
            <span key={name} style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: isDark ? 'rgba(75,185,236,.12)' : 'rgba(75,185,236,.08)',
              color: '#4BB9EC',
            }}>
              {name} {count > 1 ? `×${count}` : ''}
            </span>
          ))
        })()}
      </div>
      
      {/* Givers */}
      <p style={{ fontSize: 12, fontWeight: 500, color: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.4)', marginTop: 10 }}>
        From {(() => {
          const g = [...new Set(post._aggregateGivers)]
          if (g.length <= 3) return g.join(', ')
          return `${g.slice(0, 2).join(', ')}, and ${g.length - 2} others`
        })()}
      </p>
    </div>
  </div>
) : shoutoutMeta ? (
  // ... existing individual ShoutoutCard rendering ...
```

For the aggregated post's header, modify the type badge to show the count:
```jsx
// In the header section, if isAggregatedShoutout, change the badge:
{isAggregatedShoutout ? (
  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg"
    style={{ background: 'rgba(75,185,236,.12)', color: '#4BB9EC' }}>
    ⭐ {post._aggregateCount} SHOUTOUTS
  </span>
) : (
  // existing badge
)}
```

---

## EXECUTION SUMMARY

| Fix | What | File |
|-----|------|------|
| 1 | Reactions label text contrast | `src/components/teams/ReactionBar.jsx` |
| 2 | Star → preselect player in shoutout modal | `src/pages/teams/TeamWallPage.jsx` |
| 3A | Shoutout aggregation logic (6hr window) | `src/pages/teams/TeamWallPage.jsx` |
| 3B | Aggregated shoutout card rendering | `src/pages/teams/FeedPost.jsx` |

Apply all fixes, verify the app compiles and runs, then commit.
