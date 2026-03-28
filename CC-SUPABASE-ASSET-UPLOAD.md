# CC-SUPABASE-ASSET-UPLOAD — Upload Badges, Mascots & Quest Assets to Supabase Storage
# Drop this file in the volleybrain-admin repo root before running with Claude Code

## CONTEXT
Carlos has been using Claude Cowork to batch-process ~600+ achievement badge images, 86 new mascot images, and quest environment assets. These are now sitting in the web admin repo at `public/badges/` (copied there by Cowork as a staging area). There is also a `badge-manifest.csv` in the repo root that maps every badge image to its achievement in the database.

The mobile repo at `Volleybrain-Mobile3` has also had its mascot images upgraded in-place (green backgrounds replaced with transparent) by Cowork — that work is done and doesn't need to be touched here.

**Supabase project ID:** uqpjvbiuokwpldjvxiby
**Base storage URL:** https://uqpjvbiuokwpldjvxiby.supabase.co/storage/v1/object/public/

## GOALS
1. Upload all badge images to Supabase Storage
2. Upload all new mascot images to Supabase Storage
3. Upload quest assets to Supabase Storage
4. Update the `achievements` table to point each badge to its Supabase URL
5. Wire the progression chain data so the UI knows badge evolution paths
6. Do NOT break any existing achievement data or functionality

---

## RULES
- Read `badge-manifest.csv` FIRST — it is the single source of truth
- Read SCHEMA_REFERENCE.csv to confirm current achievements table schema
- Do NOT delete or modify any existing achievements data
- Do NOT modify any existing storage bucket policies
- Run `npx tsc --noEmit` if touching any TypeScript
- Commit after each phase

---

## PHASE 1: Investigate Current State

### Step 1A: Check Existing Storage Buckets
```bash
# List all storage buckets
# Check if 'achievements' bucket exists and its policies
# Check if there are existing files in the bucket
```

Query Supabase to determine:
- Does an `achievements` storage bucket exist? (It should — it was created in January 2026)
- Is it set to public?
- What files are currently in it? (There may be old layered assets from the previous icon/frame/glow system)
- Are there other relevant buckets? (e.g., 'public', 'avatars', 'team-posts')

### Step 1B: Check Achievements Table Schema
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'achievements'
ORDER BY ordinal_position;
```

Confirm these columns exist (they should):
- `icon_url` TEXT — currently stores the layered icon URL
- `frame_url` TEXT — currently stores the shield/frame URL
- `glow_url` TEXT — currently stores the rarity glow URL
- `unlock_effect_url` TEXT — unlock animation URL

We are REPLACING the layered approach (icon + frame + glow as separate images) with a single pre-composited badge image. We need to add:
- `badge_image_url` TEXT — the single composited badge image (NEW COLUMN)
- `chain_id` TEXT — progression chain identifier (NEW COLUMN, if not exists)
- `chain_position` INTEGER — position in the progression chain (NEW COLUMN, if not exists)
- `tier` INTEGER — visual tier 0-5 (NEW COLUMN, if not exists)

The old columns (icon_url, frame_url, glow_url) should be KEPT for backward compatibility but the app will be migrated to use badge_image_url.

### Step 1C: Read the Manifest
Read `badge-manifest.csv` from the repo root. It has columns:
```
chain_id, role, badge_number, badge_name, description, how_to_earn, stat_key, threshold, rarity, xp, category, cadence, unlock_level, stacks_into, tier, chain_position, chain_length, output_filename, shield_used, icon_used, wings_used, match_type, is_tier0, is_pre_existing
```

Count total rows. Report how many are pre-existing vs new composites vs tier0.

### Step 1D: Read Mascot Manifest
If `mascot-manifest.csv` exists in the repo, read it too. It maps mascot filenames to descriptions and suggested uses.

**REPORT ALL FINDINGS. Do not proceed until Carlos confirms.**

---

## PHASE 2: Create Storage Structure

### Step 2A: Create Storage Buckets (if needed)
Ensure these buckets exist and are PUBLIC with cache-friendly headers:

```sql
-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('badges', 'badges', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('mascots', 'mascots', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('quest-assets', 'quest-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
```

### Step 2B: Set Public Access Policies
```sql
-- Allow public read on badges bucket
CREATE POLICY IF NOT EXISTS "Public badge read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'badges');

-- Allow public read on mascots bucket
CREATE POLICY IF NOT EXISTS "Public mascot read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'mascots');

-- Allow public read on quest-assets bucket
CREATE POLICY IF NOT EXISTS "Public quest asset read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'quest-assets');

-- Allow authenticated users to upload (for admin use)
CREATE POLICY IF NOT EXISTS "Authenticated badge upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'badges' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Authenticated mascot upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mascots' AND auth.role() = 'authenticated');
```

**Commit:** `"Storage Phase 1: create badges, mascots, quest-assets buckets with public read policies"`

---

## PHASE 3: Upload Badge Images

### Step 3A: Write Upload Script
Create a Node.js script at `scripts/upload-badges.mjs` that:

1. Reads `badge-manifest.csv`
2. For each row where `output_filename` exists:
   - Reads the PNG file from `public/badges/{output_filename}` (or `public/badges/mascots/` for mascot files)
   - Uploads it to Supabase Storage bucket `badges` with the path: `{role}/{output_filename}`
   - Example: `badges/player/player_first-blood_common.png`
   - Tier 0 files go to: `badges/{role}/tier0/{output_filename}`
3. Uses the Supabase JS client with the service role key from `.env`
4. Implements retry logic (3 retries with exponential backoff)
5. Logs progress every 25 uploads
6. Saves results to `upload-results.json`

```javascript
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role for storage uploads
)

// Read manifest
const manifest = parse(readFileSync('badge-manifest.csv'), { columns: true })

for (const row of manifest) {
  const filePath = `public/badges/${row.output_filename}`
  const storagePath = `${row.role}/${row.output_filename}`
  
  const fileBuffer = readFileSync(filePath)
  
  const { error } = await supabase.storage
    .from('badges')
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      cacheControl: '31536000', // 1 year cache — badges don't change
      upsert: true
    })
    
  if (error) console.error(`Failed: ${row.output_filename}`, error)
  else console.log(`Uploaded: ${storagePath}`)
}
```

### Step 3B: Run the Upload
```bash
node scripts/upload-badges.mjs
```

Monitor output. If any failures, retry those specific files.

### Step 3C: Upload Mascot Images
Same pattern — read from `public/badges/mascots/`, upload to `mascots` bucket.

### Step 3D: Upload Quest Assets
Same pattern — read from `public/badges/quest/`, upload to `quest-assets` bucket.

**Commit:** `"Storage Phase 2: upload scripts for badges, mascots, and quest assets"`

---

## PHASE 4: Update Achievements Table

### Step 4A: Add New Columns
```sql
-- Add composited badge image URL column
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS badge_image_url TEXT;

-- Add progression chain columns
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS chain_id TEXT;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS chain_position INTEGER DEFAULT 0;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;

-- Add tier 0 image URL (icon-only version for chain start)
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS tier0_image_url TEXT;

-- Comment the columns
COMMENT ON COLUMN achievements.badge_image_url IS 'Pre-composited badge image URL from Supabase Storage (replaces layered icon+frame+glow)';
COMMENT ON COLUMN achievements.chain_id IS 'Groups badges in the same progression chain (e.g., player-kill-chain)';
COMMENT ON COLUMN achievements.chain_position IS 'Position in chain: 0=start, 1=second, etc.';
COMMENT ON COLUMN achievements.tier IS 'Visual tier: 0=icon-only, 1=common shield, 2=uncommon, 3=rare, 4=epic, 5=legendary';
COMMENT ON COLUMN achievements.tier0_image_url IS 'Icon-only version for progression chain start display';
```

### Step 4B: Write the Database Update Script
Create `scripts/wire-badge-urls.mjs` that:

1. Reads `badge-manifest.csv`
2. For each row (skipping tier0 rows):
   - Finds the matching achievement in the database by matching on: `name` (badge_name), `target_role`, `rarity`, AND/OR `stat_key` + `threshold`
   - Sets `badge_image_url` to the Supabase storage public URL
   - Sets `chain_id`, `chain_position`, `tier`
3. For tier0 rows:
   - Finds the FIRST achievement in that chain
   - Sets `tier0_image_url` on that achievement

**MATCHING LOGIC — BE CAREFUL:**
The manifest badge names may not exactly match the database names. Use fuzzy matching:
1. First try exact name match (case-insensitive)
2. Then try matching on `stat_key` + `threshold` + `target_role`
3. Then try matching on `stat_key` + `rarity`
4. Log any unmatched rows for Carlos to review

```javascript
const baseUrl = 'https://uqpjvbiuokwpldjvxiby.supabase.co/storage/v1/object/public/badges'

for (const row of manifest) {
  if (row.is_tier0 === 'true') continue // Handle tier0 separately
  
  const imageUrl = `${baseUrl}/${row.role}/${row.output_filename}`
  
  // Try to match by name first
  const { data, error } = await supabase
    .from('achievements')
    .update({
      badge_image_url: imageUrl,
      chain_id: row.chain_id,
      chain_position: parseInt(row.chain_position),
      tier: parseInt(row.tier)
    })
    .ilike('name', row.badge_name)
    .eq('target_role', row.role === 'tm' ? 'team_manager' : row.role)
    
  if (!data || data.length === 0) {
    // Fallback: match by stat_key + threshold
    // ... implement fallback matching
  }
}
```

### Step 4C: Wire Tier 0 Images
For each chain, find the tier0 image and set it on the chain's first achievement:

```javascript
const tier0Rows = manifest.filter(r => r.is_tier0 === 'true')

for (const row of tier0Rows) {
  const tier0Url = `${baseUrl}/${row.role}/tier0/${row.output_filename}`
  
  // Find the first achievement in this chain
  const { error } = await supabase
    .from('achievements')
    .update({ tier0_image_url: tier0Url })
    .eq('chain_id', row.chain_id)
    .eq('chain_position', 0)
}
```

### Step 4D: Verify
```sql
-- Check how many achievements now have badge_image_url set
SELECT 
  target_role,
  COUNT(*) as total,
  COUNT(badge_image_url) as has_image,
  COUNT(*) - COUNT(badge_image_url) as missing_image
FROM achievements
GROUP BY target_role;

-- Check chain data
SELECT chain_id, COUNT(*) as chain_length, MIN(tier) as min_tier, MAX(tier) as max_tier
FROM achievements
WHERE chain_id IS NOT NULL
GROUP BY chain_id
ORDER BY chain_length DESC
LIMIT 20;

-- Find any orphaned achievements without images
SELECT name, target_role, rarity, stat_key
FROM achievements
WHERE badge_image_url IS NULL
ORDER BY target_role, name;
```

**Commit:** `"Storage Phase 3: wire badge_image_url, chain_id, tier columns to achievements table"`

---

## PHASE 5: Update App Components

### Step 5A: Create a Badge Image Component (Web)
Create `src/components/BadgeImage.tsx`:

```typescript
interface BadgeImageProps {
  achievement: {
    badge_image_url?: string | null
    icon_url?: string | null
    frame_url?: string | null
    glow_url?: string | null
    rarity: string
    name: string
  }
  size?: number
  locked?: boolean
  className?: string
}

export function BadgeImage({ achievement, size = 64, locked = false, className }: BadgeImageProps) {
  // Prefer new composited image, fall back to old layered approach
  const imageUrl = achievement.badge_image_url || achievement.icon_url
  
  if (!imageUrl) {
    return <FallbackBadge rarity={achievement.rarity} size={size} />
  }
  
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <img
        src={imageUrl}
        alt={achievement.name}
        className={cn(
          "w-full h-full object-contain",
          locked && "grayscale opacity-50"
        )}
        loading="lazy"
      />
    </div>
  )
}
```

### Step 5B: Find and Replace Old Badge Rendering
Search the codebase for any component that renders achievement images using the old layered approach (icon_url + frame_url + glow_url stacked). Replace with the new `BadgeImage` component.

```bash
# Find all files that reference icon_url, frame_url, glow_url for achievements
grep -rn "icon_url\|frame_url\|glow_url" src/ --include="*.tsx" --include="*.ts" | grep -i "achievement\|badge"
```

Replace each instance with `<BadgeImage achievement={...} />`.

### Step 5C: Update Queries
Any Supabase query that fetches achievements should now also SELECT:
- `badge_image_url`
- `chain_id`
- `chain_position`
- `tier`
- `tier0_image_url`

```bash
# Find all achievement queries
grep -rn "from('achievements')\|from(\"achievements\")" src/ --include="*.tsx" --include="*.ts"
```

Add the new columns to each SELECT.

**Commit:** `"Storage Phase 4: BadgeImage component + migrate from layered to composited badge display"`

---

## PHASE 6: Cleanup

### Step 6A: Remove Staging Files
After successful upload and verification, remove the staging badge images from the repo:

```bash
rm -rf public/badges/*.png
rm -rf public/badges/mascots/
rm -rf public/badges/quest/
rm badge-manifest.csv
rm mascot-manifest.csv
```

Keep the `public/badges/` folder (it existed before with the old badge seed files).

### Step 6B: Update .gitignore
Add to `.gitignore`:
```
# Badge staging area (uploaded to Supabase storage, not committed to repo)
public/badges/*.png
public/badges/mascots/
public/badges/quest/
```

**Commit:** `"Storage Phase 5: cleanup staging files, update .gitignore"`

---

## VERIFICATION CHECKLIST

After all phases:
- [ ] `badges` storage bucket exists and is public
- [ ] ~600 badge PNGs uploaded to `badges/{role}/` paths
- [ ] ~86 mascot PNGs uploaded to `mascots/` bucket
- [ ] Quest assets uploaded to `quest-assets/` bucket
- [ ] `badge_image_url` populated for all 510 achievements
- [ ] `chain_id` and `chain_position` set for all chained achievements
- [ ] `tier` set correctly (0-5) for all achievements
- [ ] `tier0_image_url` set for all chain start achievements
- [ ] Old layered rendering replaced with BadgeImage component
- [ ] Achievement queries include new columns
- [ ] Staging files removed from repo
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] App loads and displays badges correctly

---

## IMPORTANT NOTES

### Service Role Key
The upload script needs the Supabase SERVICE ROLE KEY (not the anon key) to upload files to storage. This should already be in the `.env` file as `SUPABASE_SERVICE_ROLE_KEY`. If not, Carlos will need to add it from the Supabase dashboard > Settings > API.

### Cache Headers
All badge uploads use `cacheControl: '31536000'` (1 year). Badges are immutable — once created, they don't change. This keeps egress low because browsers and CDN cache them aggressively.

### Backward Compatibility
The old `icon_url`, `frame_url`, `glow_url` columns are NOT deleted. The `BadgeImage` component checks `badge_image_url` first, falls back to `icon_url`. This means the mobile app (which may still use the old columns) won't break during the migration.

### Mobile App
The mobile app (`Volleybrain-Mobile3`) will need a similar update to use `badge_image_url` instead of the layered approach. That's a separate CC spec — the database changes from this spec will be available to both apps since they share the same Supabase backend.
