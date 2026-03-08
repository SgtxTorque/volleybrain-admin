# TeamWall — Hotfix: Broken Query, Missing Posts, Gallery, Card Width
## Claude Code Prompt

**Commit message:** `hotfix: fix shoutout digest query, restore posts and gallery, restore card width`

**File:** `src/pages/teams/TeamWallPage.jsx`

---

## ISSUE 1: Shoutout Digest Query Failing (400 Error)

The Supabase query for the shoutout digest is returning a 400 error. The problem is this join syntax:

```jsx
.select('id, receiver_id, category, message, created_at, giver_id, players:receiver_id(first_name, last_name, photo_url)')
```

Supabase cannot resolve `players:receiver_id` — this is not a valid foreign key relationship syntax. The `shoutouts` table's `receiver_id` column may reference `profiles` or `players`, but you can't alias a join like that unless there's an actual foreign key constraint set up in the database.

**Fix:** Simplify the query. Don't try to join `players` inline. Fetch shoutouts first, then look up player names from the already-loaded `players` state that the page already has:

```jsx
async function loadShoutoutDigest() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // Simple query — no joins
    const { data: recentShoutouts, error } = await supabase
      .from('shoutouts')
      .select('id, receiver_id, category, message, created_at, giver_id')
      .eq('team_id', teamId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.log('Shoutout digest query error:', error)
      setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
      return
    }
    
    if (!recentShoutouts || recentShoutouts.length === 0) {
      setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
      return
    }
    
    // Group by receiver — use the players array already loaded in state
    const byReceiver = new Map()
    for (const s of recentShoutouts) {
      const rid = s.receiver_id
      if (!byReceiver.has(rid)) {
        // Look up player name from the already-loaded players state
        const player = players.find(p => p.id === rid)
        byReceiver.set(rid, {
          receiverId: rid,
          name: player ? `${player.first_name} ${player.last_name}` : 'Player',
          photo: player?.photo_url || player?.avatar_url || null,
          count: 0,
          categories: [],
        })
      }
      const entry = byReceiver.get(rid)
      entry.count++
      if (s.category && !entry.categories.includes(s.category)) {
        entry.categories.push(s.category)
      }
    }
    
    const ranked = Array.from(byReceiver.values()).sort((a, b) => b.count - a.count)
    
    setShoutoutDigest({
      recent: ranked,
      total: recentShoutouts.length,
      lastShoutoutDate: recentShoutouts[0]?.created_at || null,
    })
  } catch (err) {
    console.log('Could not load shoutout digest:', err)
    setShoutoutDigest({ recent: [], total: 0, lastShoutoutDate: null })
  }
}
```

**IMPORTANT:** Make sure `loadShoutoutDigest()` is called AFTER `players` state has been populated (i.e., after the players query completes). If it's called too early, the player lookup won't find names. Either call it at the end of `loadTeamData`, or add it to a `useEffect` that depends on `players`:

```jsx
useEffect(() => {
  if (players.length > 0 && teamId) {
    loadShoutoutDigest()
  }
}, [players, teamId])
```

---

## ISSUE 2: Posts Not Showing

Check that the feed is not accidentally filtering out ALL posts. The shoutout filter should ONLY remove shoutout posts:

```jsx
const feedPosts = posts.filter(p => p.post_type !== 'shoutout')
```

Make sure:
- `posts` state is still being populated (the `loadPosts` function wasn't accidentally modified)
- The filter is applied to `posts`, not to an empty array
- The JSX renders `feedPosts.map(...)` (not checking `posts.length`)
- The empty state check uses `feedPosts.length` not `posts.length`:

```jsx
{feedPosts.length > 0 ? (
  <div className="flex flex-col" style={{ gap: '17px' }}>
    {feedPosts.map((post, i) => (
      <FeedPost key={post.id} post={post} ... />
    ))}
  </div>
) : (
  <div> ... No posts yet ... </div>
)}
```

If the `loadPosts` function was accidentally changed, revert it to its previous working state. The ONLY change in the feed section should be adding the `filter` for shoutouts.

---

## ISSUE 3: Gallery Disappeared

The gallery pulls images from posts that have `media_urls`. Check that the gallery image extraction wasn't broken. Look for the function that extracts gallery images (around line 175 in the original):

```jsx
const galleryImages = posts
  .filter(p => p.media_urls?.length > 0)
  .flatMap(p => Array.isArray(p.media_urls) ? p.media_urls : [])
```

Make sure this still uses `posts` (ALL posts), NOT `feedPosts` (filtered posts). The gallery should include photos from ALL post types, including shoutouts if they have media. Only the FEED cards filter out shoutouts.

If this line was accidentally changed to use `feedPosts`, change it back to `posts`.

Also verify the gallery rendering section in the right column is still there and wasn't accidentally removed or wrapped in a broken conditional.

---

## ISSUE 4: Card Width Shrunk

The center column's Create Post bar and post cards are narrower than before. Find the center column's inner container — it likely has a `max-w-2xl` class or `maxWidth` style.

**If CC added or changed a `maxWidth` or `max-w-` class**, remove it. The center column should use the full width available from the grid (it's already constrained by being `1fr` between two 335px columns). The inner content wrapper should be:

```jsx
<div className="mx-auto px-4 lg:px-6 py-5 flex flex-col" style={{ gap: '17px', width: '100%' }}>
```

Remove any `max-w-2xl`, `max-w-xl`, `max-w-lg`, or `maxWidth: XXXpx` that limits the center column content width. The cards should fill the available center column space.

---

## SUMMARY

| Issue | Cause | Fix |
|-------|-------|-----|
| Shoutout digest 400 error | Invalid Supabase join `players:receiver_id(...)` | Remove join, use local `players` state for names |
| Posts missing | Possibly cascading error or bad filter logic | Verify `loadPosts` unchanged, `feedPosts` filter correct |
| Gallery gone | Gallery extraction may use `feedPosts` instead of `posts` | Ensure gallery uses `posts` (unfiltered) |
| Cards too narrow | CC added a maxWidth constraint to center column | Remove maxWidth, let `1fr` grid handle width |

Apply all 4 fixes, verify everything loads, then commit.
