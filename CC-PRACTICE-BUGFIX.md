# CC-PRACTICE-BUGFIX.md
# Lynx Web Admin — Practice Planning Bugfix
# EXECUTION SPEC

**Type:** Bugfix  
**Branch:** `feat/practice-planning`  
**Run with:** `--dangerously-skip-permissions`  
**Context:** First deploy of practice planning revealed DB errors, RLS issues, and UI gaps. This spec fixes all of them.

---

## ISSUE 1: RLS Policies Missing or Broken (403 on drills and practice_plans)

**Problem:** The `/drills` page and `/practice-plans` page return 403 from Supabase. The tables exist but RLS is blocking all access. Either the policies weren't applied or they reference columns/functions that don't exist.

**Fix:** CC must investigate the current RLS state and fix it.

**Step 1:** Check what policies exist:
```bash
# In the codebase, find the migration SQL file
cat src/lib/migrations/practice-planning-migrations.sql | grep -A5 "CREATE POLICY\|ENABLE ROW LEVEL"
```

**Step 2:** If policies ARE in the file but weren't run, generate a standalone RLS fix SQL file. If policies are missing entirely, write them.

**The policies needed (following existing Lynx patterns):**

For `drills`:
```sql
-- Allow authenticated users to read drills in their org
CREATE POLICY "Users can view org drills" ON drills
  FOR SELECT USING (
    org_id IN (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
    OR org_id IS NULL
  );

-- Allow coaches and admins to manage drills
CREATE POLICY "Coaches can manage drills" ON drills
  FOR ALL USING (
    created_by = auth.uid()
    OR public.is_platform_admin()
  );
```

For `practice_plans`:
```sql
CREATE POLICY "Users can view org practice plans" ON practice_plans
  FOR SELECT USING (
    org_id IN (SELECT current_organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can manage practice plans" ON practice_plans
  FOR ALL USING (
    created_by = auth.uid()
    OR public.is_platform_admin()
  );
```

Apply the same pattern for ALL 10 practice tables: `drills`, `drill_favorites`, `drill_categories`, `practice_plans`, `practice_plan_favorites`, `practice_plan_items`, `event_practice_plans`, `player_development_assignments`, `reflection_templates`, `practice_reflections`.

**IMPORTANT:** Check if the existing Lynx RLS pattern uses `current_organization_id` on profiles or a different column. Look at existing policies on `schedule_events` or `teams` to find the exact pattern. Copy that pattern exactly.

**Step 3:** Write the fixed SQL to `src/lib/migrations/practice-rls-fix.sql` AND apply it via Supabase. Add a comment at the top of the file saying "Run this in Supabase SQL Editor."

**Verify:** After applying, the `/drills` page loads without 403. An empty state shows ("Build your drill library..."). The `/practice-plans` page loads without 403.

---

## ISSUE 2: drill_categories Seed SQL Error (ambiguous column "name")

**Problem:** The volleyball-specific seed query fails with: `ERROR: 42702: column reference "name" is ambiguous LINE 13`

**Fix:** The VALUES alias and the `sports` table both have a `name` column. Disambiguate with explicit table aliases.

In the migration SQL file, find the volleyball-specific seed and replace with:
```sql
INSERT INTO drill_categories (org_id, sport_id, name, display_name, sort_order)
SELECT NULL, s.id, v.cat_name, v.cat_display, v.cat_order FROM (VALUES
  ('serving', 'Serving', 10),
  ('passing', 'Passing', 11),
  ('setting', 'Setting', 12),
  ('attacking', 'Attacking', 13),
  ('blocking', 'Blocking', 14),
  ('defense', 'Defense', 15),
  ('transition', 'Transition', 16),
  ('serve_receive', 'Serve Receive', 17)
) AS v(cat_name, cat_display, cat_order)
CROSS JOIN sports s WHERE s.name ILIKE '%volleyball%'
ON CONFLICT DO NOTHING;
```

Also put this fixed SQL in `src/lib/migrations/practice-rls-fix.sql` so it can be run as part of the fix batch.

**Verify:** Categories appear in the drill category dropdown when creating a drill.

---

## ISSUE 3: player_skill_ratings Query Returns 400

**Problem:** The lineup builder's roster stats query is failing with a 400 error:
```
player_skill_ratings?select=player_id,overall_rating,serve,pass,attack,block,dig,set_skill,created_at&player_id=in.(...)&order=created_at.desc
```

**Root cause:** Either `overall_rating` or `set_skill` column doesn't exist on the `player_skill_ratings` table, or the table uses different column names.

**Fix:** CC must check the actual schema of `player_skill_ratings`:
```bash
grep -rn "player_skill_ratings" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | head -20
```

Find how existing code queries this table (e.g., in the Development tab or evaluation components) and match those column names. If the table has `setting` instead of `set_skill`, or doesn't have `overall_rating` at all, update the query in the lineup builder's `loadData()` function to use the correct columns.

If `overall_rating` doesn't exist, compute it as an average of the individual skill columns that DO exist. Or just remove the `overall_rating` from the select and compute client-side.

**Wrap the query in a try-catch** so it fails gracefully — player ratings are supplementary data, not required for the lineup builder to function.

**Verify:** No 400 errors on the player_skill_ratings query. If the table columns don't match, the query is updated. Roster cards either show ratings or gracefully show nothing.

---

## ISSUE 4: game_player_stats FK Join Error

**Problem:** Console shows: `game_player_stats FK join failed, trying implicit: column schedule_events_1.their_score does not exist`

**Root cause:** The query tries to join `game_player_stats` with `schedule_events` and select `their_score`, but that column might be named `opponent_score` on the actual table.

**Fix:** Find the query that does this join:
```bash
grep -rn "their_score\|game_player_stats.*schedule_events" src/ --include="*.jsx" --include="*.js" | grep -v _archive
```

Check the actual `schedule_events` table — is the column `their_score` or `opponent_score`? The investigation report from the lineup builder says it's `opponent_score`. Update the Supabase select query to use the correct column name.

**Verify:** No FK join errors in console when viewing player profiles.

---

## ISSUE 5: Drill Creation — No File Upload Option (YouTube Only)

**Problem:** The Create Drill modal only shows a YouTube URL input. Coaches need the ability to upload their own video files or images (court diagrams, drill illustrations).

**Fix in `src/pages/drills/CreateDrillModal.jsx`:**

Add a media source picker at the top of the media section:

```
MEDIA
[YouTube URL] [Upload Video] [Upload Diagram]
```

Three options as pill buttons/tabs:
1. **YouTube URL** (current behavior) — paste URL, auto-extract thumbnail
2. **Upload Video** — file picker accepting video/* (mp4, mov, webm). Upload to Supabase Storage bucket `drill-media/videos/`. Save the public URL to `drills.video_url`.
3. **Upload Diagram** — file picker accepting image/* (png, jpg, svg). Upload to Supabase Storage bucket `drill-media/diagrams/`. Save the public URL to `drills.diagram_url`.

**Upload pattern:** Follow the same pattern used for player photo uploads in the codebase. Search for:
```bash
grep -rn "supabase.storage\|from('.*').upload\|getPublicUrl" src/ --include="*.jsx" --include="*.js" | grep -v _archive | head -10
```

Use the same bucket/upload/getPublicUrl pattern. If no `drill-media` bucket exists, the migration SQL should create it, or document that the developer needs to create it in Supabase Storage settings.

**Verify:** Can upload a video file from device → saves to storage → displays in drill detail. Can upload a diagram image → saves → displays.

---

## ISSUE 6: YouTube Import Should Auto-Parse Video Metadata

**Problem:** When a coach pastes a YouTube URL, they have to manually fill in title, description, category, etc. The system should attempt to pre-fill from the YouTube video metadata.

**Fix:** Use the YouTube oEmbed API (no API key needed) to fetch video title and author:

```javascript
// In src/lib/youtube-helpers.js, add:
export async function fetchYouTubeMetadata(videoUrl) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    )
    if (!response.ok) return null
    const data = await response.json()
    return {
      title: data.title || '',
      author: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || null,
    }
  } catch {
    return null
  }
}
```

**In `CreateDrillModal.jsx`:** After the coach pastes a YouTube URL and it's validated, call `fetchYouTubeMetadata()` and pre-fill the title field. The coach can edit it before saving.

**IMPORTANT:** The oEmbed API is rate-limited and may not work for all videos (private, age-restricted, etc.). Always fail gracefully — if metadata fetch fails, just don't pre-fill. Don't block the form.

**Note on AI parsing:** The request about parsing video content to auto-fill category, coaching points, etc. is a great future feature (use Claude API to analyze the video title/description), but it's out of scope for this bugfix. For now, just pre-fill the title from oEmbed.

**Verify:** Paste a YouTube URL → title field auto-fills with the video title. If oEmbed fails, title stays empty (no error shown).

---

## ISSUE 7: Custom Blocks in Practice Plans Cannot Be Named

**Problem:** When adding a custom block (Break, Talk, or Custom) to a practice plan, the coach can add notes but cannot set the block's title. It defaults to "Water Break", "Team Talk", or "Custom Block" with no way to rename.

**Fix in `src/pages/practice-plans/PracticePlanBuilder.jsx`:**

Make the title of each plan item editable. For custom blocks (item_type !== 'drill'), the title should be a text input that the coach can click to edit inline.

```jsx
// For each plan item in the sequence:
{item.item_type !== 'drill' ? (
  <input
    type="text"
    value={item.custom_title || ''}
    onChange={(e) => updateItemTitle(index, e.target.value)}
    placeholder={
      item.item_type === 'break' ? 'Water Break' :
      item.item_type === 'talk' ? 'Team Talk' : 'Custom Block'
    }
    className={`font-semibold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded px-1 ${tc.text}`}
  />
) : (
  <span className="font-semibold">{item.drills?.title || item.custom_title}</span>
)}
```

The coach clicks the title text → it becomes an editable input → they type a name → it saves to `custom_title` on the plan item.

Also allow renaming drill items (override the drill's default title for this specific plan usage). The `custom_title` field on `practice_plan_items` already supports this.

**Verify:** Add a custom block → can type a custom name. Add a break → can rename from "Water Break" to "Hydration Station" or whatever. Name persists on save.

---

## ISSUE 8: Font Sizes Too Small Throughout Practice Pages

**Problem:** Text across the drill library, practice plan builder, and create drill modal is too small to read comfortably.

**Fix:** Audit all new practice-related components and ensure:
- Page titles: `text-2xl font-bold` minimum
- Section headers: `text-lg font-semibold`
- Card titles: `text-base font-semibold`
- Body text / descriptions: `text-sm` minimum (not `text-xs`)
- Input labels: `text-sm font-medium`
- Button text: `text-sm font-medium`
- Stat/metadata pills: `text-xs` is okay for badges, but ensure proper padding

Specifically check:
- `DrillLibraryPage.jsx` — page title, card text
- `DrillCard.jsx` — title, duration, category text
- `CreateDrillModal.jsx` — all form labels and inputs
- `PracticePlanBuilder.jsx` — plan title, item titles, duration labels
- `PracticePlansPage.jsx` — plan card text

If anything is using `text-[10px]`, `text-[11px]`, or `text-xs` for important readable content, bump it up.

**Verify:** All text is comfortable to read at normal viewing distance on a 24" monitor.

---

## EXECUTION ORDER

1. Issue 1 — RLS fix (unblocks everything else)
2. Issue 2 — Seed SQL fix (fills categories dropdown)
3. Issue 3 — player_skill_ratings query fix
4. Issue 4 — game_player_stats join fix
5. Issue 6 — YouTube metadata pre-fill
6. Issue 5 — File upload for drills
7. Issue 7 — Custom block naming
8. Issue 8 — Font sizes

---

## VERIFICATION CHECKLIST

- [ ] `/drills` page loads without 403 error
- [ ] `/practice-plans` page loads without 403 error
- [ ] Drill categories dropdown shows volleyball-specific categories (Serving, Passing, etc.)
- [ ] No 400 errors on player_skill_ratings query
- [ ] No FK join errors for game_player_stats in console
- [ ] Create a drill with YouTube URL → title auto-fills from video metadata
- [ ] Create a drill by uploading a video file → file uploads to storage, displays in detail
- [ ] Upload a diagram image for a drill → displays in drill detail
- [ ] Add a custom block to practice plan → can type a custom name
- [ ] Rename a break/talk block → name persists after save
- [ ] All text is legible at normal size
- [ ] No console errors on `/drills`, `/practice-plans`, or player profile pages
- [ ] All above works in both light and dark mode

**Commit:** `fix(practice): RLS policies, seed SQL, YouTube metadata, file upload, custom block naming, font sizes`
