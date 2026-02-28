# TEAMHUB — Rebuild Post Creation & Display (Facebook-Style)

⚠️ **RULES:**
1. Run `npx tsc --noEmit` before AND after changes — zero new errors allowed.
2. Do NOT break any other pages or components.
3. Use EXISTING Supabase tables, storage buckets, and database schema. Check SCHEMA_REFERENCE.csv for table/column names.
4. Do NOT create new database tables — work with what exists.

---

## CONTEXT

The TeamHub feed has two broken issues:
1. **Photos uploaded with posts are not displaying** — the upload toast says success, but the photo doesn't appear on the post in the feed
2. **When photos DO show, they are cropped** — images get cut off instead of displaying at their natural aspect ratio

The goal: Make the TeamHub post creation and display work EXACTLY like Facebook's post system.

---

## INVESTIGATION FIRST — Do this before ANY code changes:

```bash
# Find all TeamHub/feed related files
find . -name "*feed*" -o -name "*post*" -o -name "*team*hub*" -o -name "*team*wall*" | grep -v node_modules | grep -E "\.(tsx|jsx)$"

# Find the post creation/upload logic
grep -rn "upload\|storage\|bucket\|media_url\|image_url\|photo" src/ --include="*.tsx" --include="*.jsx" | grep -i -E "feed|post|team|hub|wall"

# Find what Supabase storage bucket is being used
grep -rn "storage\|bucket\|upload" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" | grep -v node_modules | head -30

# Check the posts table schema
grep -i "post" SCHEMA_REFERENCE.csv | head -20
```

Report ALL findings before making changes. I need to understand:
- What file handles post creation?
- What file handles post display in the feed?
- What Supabase storage bucket stores post images?
- What column in the database stores the image URL?
- Is the image URL being saved correctly on post creation?
- Is the image URL being fetched correctly on feed display?

---

## PROBLEM 1: Photos Not Displaying After Upload

The likely issue is one of these:
- The image uploads to Supabase storage but the URL is not saved to the post record in the database
- The URL is saved but the feed query doesn't SELECT that column
- The URL is saved but the feed component doesn't render it
- The storage bucket permissions don't allow public read access

**Debug steps:**
1. Find the post creation function. Trace the FULL flow: 
   - User picks image → image uploads to storage → URL is returned → URL is saved to post record → post is inserted into database
2. Check: is the media/image URL column being included in the INSERT?
3. Find the feed query. Check: is the media/image URL column being included in the SELECT?
4. Find the feed post component. Check: is there a conditional render for the image that might be failing silently?
5. Check Supabase storage bucket: is it set to public? If not, are signed URLs being generated?

**Fix whatever is broken in this chain.**

---

## PROBLEM 2: Photo Display — Facebook-Style (No Cropping)

After photos are actually showing, fix the display. Reference how Facebook handles post images:

**Facebook's approach:**
- Single image: full width of the post card, height is AUTO based on the image's natural aspect ratio
- The image has NO fixed height, NO max-height, NO object-fit
- It's literally just: `width: 100%, height: auto, display: block`
- Landscape photos appear shorter, portrait photos appear taller — that's correct behavior
- The image sits between the post text and the reaction/comment bar
- There is NO hover zoom effect on the image
- Clicking the image opens it in a lightbox/modal at full resolution

**Implementation:**
```jsx
{/* Post image — Facebook style */}
{post.media_url && (
  <div className="w-full">
    <img 
      src={post.media_url} 
      alt=""
      className="w-full h-auto block"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      onClick={() => openImageModal(post.media_url)}
    />
  </div>
)}
```

That's it. No object-fit. No max-height. No fixed dimensions. Just a full-width image at its natural ratio.

**Remove ALL of these if they exist on post images:**
- `object-cover`
- `object-contain`
- `object-fit` (any value)
- `h-[any fixed value]`
- `max-h-[any value]`
- `maxHeight`
- Any fixed height on the image OR its parent container

---

## POST CREATION MODAL — Facebook-Style

The "Create Post" experience should work like this:

1. User clicks "create post" or the text input area
2. A modal opens with:
   - User avatar + name at top
   - Text input area (auto-expanding textarea, no fixed height)
   - If an image is attached: show the image PREVIEW below the text, full width, natural aspect ratio, with an X button to remove it
   - A toolbar at the bottom with: Photo icon, Emoji icon (use existing emoji picker if available)
   - A "Post" button that is disabled until there is text OR an image
3. When user clicks Post:
   - If there's an image: upload to Supabase storage first, get the URL
   - Insert the post record with text + image URL
   - Close the modal
   - The new post appears at the top of the feed immediately (optimistic update or refetch)
   - Show a success toast

**Important:** The image preview in the create modal should ALSO be unstyled — just `width: 100%, height: auto`. Show the user exactly what the post will look like.

---

## VERIFICATION

- [ ] Create a text-only post → appears in feed immediately with correct text
- [ ] Create a post with a LANDSCAPE photo → photo uploads, appears in feed, NOT cropped, full width
- [ ] Create a post with a PORTRAIT photo → photo uploads, appears in feed, NOT cropped, taller than landscape
- [ ] Create a post with a SQUARE photo → photo uploads, appears in feed, NOT cropped
- [ ] Old posts with photos that weren't showing → NOW show their photos (if URLs exist in DB)
- [ ] Image preview in create modal matches how it displays in feed
- [ ] Post button is disabled when empty
- [ ] Success toast on post creation
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## COMMIT

```bash
git add .
git commit -m "TeamHub: rebuild post creation and display - Facebook-style photos, fix upload bug"
git push
```
