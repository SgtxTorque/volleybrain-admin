# TeamWall — Hotfix: Posts Not Showing / Gallery Empty
## Claude Code Prompt

**Commit message:** `hotfix: exclude shoutouts at query level, restore posts and gallery`

**File:** `src/pages/teams/TeamWallPage.jsx`

---

## ROOT CAUSE

Posts and gallery appear empty because:
1. The database has 10+ shoutout posts (most recent)
2. `loadPosts` fetches the 10 most recent posts → all 10 are shoutouts
3. The client filter `posts.filter(p => p.post_type !== 'shoutout')` removes all of them → "No posts yet"
4. `galleryImages` derives from `posts` state → also empty since shoutouts have no media

The fix is simple: **exclude shoutouts at the database query level**, not in client-side filtering.

## THE FIX

### Step 1: Exclude shoutouts from the loadPosts query

Find the `loadPosts` function (around line 327). In BOTH the primary query AND the fallback query, add a filter to exclude shoutout posts:

**Primary query — change from:**
```jsx
let { data: postsData, error } = await supabase
  .from('team_posts')
  .select('*, profiles:author_id(id, full_name, avatar_url)')
  .eq('team_id', teamId)
  .eq('is_published', true)
  .order('is_pinned', { ascending: false })
  .order('created_at', { ascending: false })
  .range(from, to)
```

**Change to:**
```jsx
let { data: postsData, error } = await supabase
  .from('team_posts')
  .select('*, profiles:author_id(id, full_name, avatar_url)')
  .eq('team_id', teamId)
  .eq('is_published', true)
  .neq('post_type', 'shoutout')
  .order('is_pinned', { ascending: false })
  .order('created_at', { ascending: false })
  .range(from, to)
```

**Fallback query — same change, add `.neq('post_type', 'shoutout')`:**
```jsx
const fallback = await supabase
  .from('team_posts')
  .select('*')
  .eq('team_id', teamId)
  .eq('is_published', true)
  .neq('post_type', 'shoutout')
  .order('is_pinned', { ascending: false })
  .order('created_at', { ascending: false })
  .range(from, to)
```

### Step 2: Remove the client-side filter

Find this line (around line 946):
```jsx
const feedPosts = posts.filter(p => p.post_type !== 'shoutout')
```

Change it to just use posts directly:
```jsx
const feedPosts = posts
```

Or better yet, remove the `feedPosts` variable entirely and just use `posts` in the JSX below it. Replace `feedPosts.length` with `posts.length` and `feedPosts.map` with `posts.map`.

### Step 3: Gallery — add a SEPARATE query for gallery images

The gallery currently derives from `posts` state, but `posts` only has the current page of feed posts. The gallery should show ALL team photos regardless of pagination.

Add a separate gallery loader. Find `galleryImages` useMemo (around line 190):

**Replace the entire useMemo with a state + loader approach:**

```jsx
const [galleryImages, setGalleryImages] = useState([])
```

Add a gallery loader function inside `loadTeamData` (or as a separate function called from it):

```jsx
// Inside loadTeamData, after the loadPosts call:
try {
  const { data: photoPosts } = await supabase
    .from('team_posts')
    .select('media_urls')
    .eq('team_id', teamId)
    .eq('is_published', true)
    .not('media_urls', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20)
  
  const images = (photoPosts || [])
    .flatMap(p => Array.isArray(p.media_urls) ? p.media_urls : [])
  setGalleryImages(images)
} catch (err) {
  console.log('Could not load gallery:', err)
}
```

Remove the old `useMemo` for `galleryImages`. The gallery now loads its own data independently of the feed posts.

### Step 4: Restore card width (if still wrong)

Check the center column inner container. It should have comfortable padding, not overly tight. Find:
```jsx
<div className="px-3 lg:px-4 py-5 flex flex-col gap-5">
```

Change back to:
```jsx
<div className="px-4 lg:px-6 py-5 flex flex-col gap-5">
```

This restores the original padding that gives cards breathing room.

Also check the grid container maxWidth. If it's `1520`, change back to `1400`:
```jsx
style={{ maxWidth: 1400, margin: '0 auto', gap: 24, height: 'calc(100vh - 64px)' }}
```

---

## WHAT NOT TO CHANGE

- Do NOT modify any other queries, components, or features
- Do NOT change the shoutout digest card — it's working correctly
- Do NOT change FeedPost.jsx
- Do NOT change the loadPosts function signature or pagination logic
- ONLY add `.neq('post_type', 'shoutout')` to the queries, remove client filter, add gallery query, and fix padding

## VERIFY

After applying:
- Announcement and photo posts should appear in the feed
- Gallery should show photos from photo posts
- Shoutout digest card should still show at the top
- Shoutouts should NOT appear as individual feed posts
- "Load More Posts" pagination should still work
