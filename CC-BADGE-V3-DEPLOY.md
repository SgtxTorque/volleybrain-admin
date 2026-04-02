# CC-BADGE-V3-DEPLOY
## Upload V3 Badge Images + Update/Create Achievements in Supabase

**Run with:** `--dangerously-skip-permissions`
**Repo:** `SgtxTorque/volleybrain-admin` (needs Supabase access + local file access)

---

## CONTEXT

We have 530 V3 badge images ready to deploy. A master mapping CSV (`lynx-badge-master-mapping.csv`) defines exactly what to do with each one:

- **422 badges** → `action: UPDATE_URL` — upload image, update existing achievement's `badge_image_url`
- **108 badges** → `action: CREATE_ACHIEVEMENT` — upload image, create a new achievement row

The mapping CSV is in the repo root (Carlos will place it there). It has these key columns:
- `badge_filename` — the PNG filename on disk
- `badge_role` — player, coach, parent, admin, team-manager, universal
- `storage_folder` — the Supabase Storage subfolder (player, coach, parent, admin, tm, universal)
- `new_badge_image_url` — the full public URL after upload
- `new_thumb_url` — thumbnail URL after upload
- `match_type` — EXACT or NEW
- `action` — UPDATE_URL or CREATE_ACHIEVEMENT
- `achievement_id` — UUID of existing achievement (for UPDATE_URL rows)
- `achievement_name`, `stat_key`, `category`, `rarity`, `xp_reward` — for CREATE_ACHIEVEMENT rows

### Source files on local machine
```
~/Desktop/lynx-photo-assets/outbox/badges-v3/assembled/
├── admin/          (100 badges + 100 thumbs)
├── coach/          (100 badges + 100 thumbs)
├── parent/         (100 badges + 100 thumbs)
├── player/         (100 badges + 100 thumbs)
├── team-manager/   (100 badges + 100 thumbs)
└── universal/      (30 badges + 30 thumbs)
```

### Supabase target
- **Project ID:** `uqpjvbiuokwpldjvxiby`
- **Storage bucket:** `badges`
- **Subfolders:** `player/`, `coach/`, `parent/`, `admin/`, `tm/`, `universal/`
- **Base URL:** `https://uqpjvbiuokwpldjvxiby.supabase.co/storage/v1/object/public/badges/`
- **DB table:** `achievements`

---

## PHASE 1: INVESTIGATION (Read-Only)

### Step 1.1 — Verify local files exist
1. Read the master mapping CSV from repo root
2. For each row, verify the badge PNG exists at the expected local path:
   - Role `team-manager` → folder is `~/Desktop/lynx-photo-assets/outbox/badges-v3/assembled/team-manager/`
   - All other roles → folder matches role name
3. Also check that the `-thumb.png` variant exists for each badge
4. Report: X of 530 full-size found, X of 530 thumbs found, list any missing

### Step 1.2 — Verify Supabase connectivity
1. Query: `SELECT COUNT(*) FROM achievements;` — expected: **433**
2. List existing files in Storage `badges` bucket (all subfolders)
3. Report current file counts per subfolder

### Step 1.3 — Verify achievement IDs exist
For the 422 UPDATE_URL rows, verify each `achievement_id` exists:
```sql
SELECT id FROM achievements WHERE id IN (<list of 422 IDs>);
```
Report any IDs that don't exist (these would indicate a mismatch).

### Step 1.4 — Check for duplicate stat_key conflicts
For the 108 CREATE_ACHIEVEMENT rows, check if any would create a new duplicate:
```sql
SELECT stat_key, rarity, COUNT(*) 
FROM achievements 
WHERE stat_key IN (<list of new stat_keys>)
GROUP BY stat_key, rarity;
```
Report any potential conflicts. Some are EXPECTED (e.g., `total_badges` with `common` rarity exists for player but not for coach — creating for coach is fine since they'll have different `target_role` values).

**STOP HERE. Write investigation results to `CC-BADGE-V3-DEPLOY-REPORT.md`. Wait for Carlos to review before proceeding.**

---

## PHASE 2: UPLOAD BADGE IMAGES TO STORAGE

### Step 2.1 — Upload full-size badges
For each of the 530 rows in the mapping CSV:

1. Read the PNG from: `~/Desktop/lynx-photo-assets/outbox/badges-v3/assembled/{local_role_folder}/{badge_filename}`
   - Where `local_role_folder` = the `badge_role` column value (e.g., `team-manager`, `player`, etc.)
2. Upload to Supabase Storage at: `badges/{storage_folder}/{badge_filename}`
   - Where `storage_folder` = the `storage_folder` column value (e.g., `tm`, `player`, etc.)
3. Settings:
   - Content type: `image/png`
   - Cache control: `public, max-age=31536000`
   - Upsert: `true` (overwrite if exists)

### Step 2.2 — Upload thumbnails
Same process for the `-thumb.png` files. Same destination folder.

### Step 2.3 — Upload in batches
- Process one role folder at a time: admin → coach → parent → player → team-manager → universal
- After each role folder, verify upload count matches expected
- Log progress: "Uploaded X/530 full-size, X/530 thumbs"

### Step 2.4 — Verify uploads
After all uploads:
1. List files in each Storage subfolder
2. Compare counts to expected:
   - `player/`: 200 files (100 full + 100 thumb)
   - `coach/`: 200 files
   - `parent/`: 200 files
   - `admin/`: 200 files
   - `tm/`: 200 files
   - `universal/`: 60 files
3. Spot-check 3 random URLs per role by fetching them (verify 200 OK response)
4. Append results to report

**Commit after Phase 2 with message:** `feat: upload 530 V3 badge images to Supabase Storage`

---

## PHASE 3: UPDATE EXISTING ACHIEVEMENTS (422 rows)

### Step 3.1 — Update badge_image_url
For each row where `action = UPDATE_URL`:

```sql
UPDATE achievements 
SET badge_image_url = '{new_badge_image_url}'
WHERE id = '{achievement_id}';
```

- Run in batches of 50
- After each batch, verify with `SELECT COUNT(*) FROM achievements WHERE badge_image_url LIKE '%badges-v3%' OR badge_image_url LIKE '%/admin/%';`
- Total expected updates: 422

### Step 3.2 — Verify updates
```sql
-- Count achievements with new V3 URLs
SELECT COUNT(*) FROM achievements 
WHERE badge_image_url LIKE 'https://uqpjvbiuokwpldjvxiby.supabase.co/storage/v1/object/public/badges/%';

-- Sample 10 random updated rows
SELECT name, rarity, badge_image_url 
FROM achievements 
WHERE badge_image_url IS NOT NULL 
ORDER BY RANDOM() LIMIT 10;
```

Append to report.

---

## PHASE 4: CREATE NEW ACHIEVEMENTS (108 rows)

### Step 4.1 — Prepare insert data
For each row where `action = CREATE_ACHIEVEMENT`, build an INSERT statement.

**Required columns and their values:**

| Column | Source |
|--------|--------|
| `id` | Generate a new UUID (use `gen_random_uuid()` or generate in code) |
| `name` | `badge_name` from CSV |
| `description` | Generate a short description based on the badge name and category (e.g., "Earn your first kill" for "Kill Streak I", "Collect 5 badges" for "Badge Collector I") |
| `how_to_earn` | Same as description, but phrased as instruction |
| `category` | `category` from CSV |
| `type` | `'stat_cumulative'` for most, `'badge'` for meta badges, `'attendance'` for streaks |
| `rarity` | `rarity` from CSV (lowercase it to match existing convention) |
| `stat_key` | `stat_key` from CSV |
| `threshold` | Estimate based on rarity and stat_key (see threshold guide below) |
| `threshold_type` | `'gte'` (greater than or equal) for most |
| `requires_verification` | `false` |
| `icon` | Badge name emoji or short label |
| `icon_url` | Same as `new_badge_image_url` (use badge image as fallback too) |
| `badge_image_url` | `new_badge_image_url` from CSV |
| `xp_reward` | `xp_reward` from CSV |
| `target_role` | Map from badge_role: player→player, coach→coach, parent→parent, admin→admin, team-manager→team_manager, universal→all |
| `sport` | `'volleyball'` for player stat badges, `''` for generic/universal |
| `is_active` | `true` |
| `display_order` | `badge_number` from CSV (as integer) |
| `cadence` | `'lifetime'` for cumulative, `'season'` for seasonal |
| `engagement_category` | Match to existing categories: `'stat_mastery'` for player stats, `'community'` for social, `'operations'` for admin/tm ops, `'growth'` for leveling |

### Threshold guide (estimate based on stat_key + rarity)
Use existing achievements as reference. Query first:
```sql
SELECT stat_key, rarity, threshold, name 
FROM achievements 
WHERE stat_key IN ('total_kills', 'total_aces', 'total_blocks', 'total_digs', 'total_assists', 'total_points', 'games_played', 'shoutouts_given', 'shoutouts_received', 'photos_uploaded', 'blasts_sent', 'total_badges', 'total_xp', 'volunteer_signups')
ORDER BY stat_key, threshold;
```

Use these patterns:
- If a badge is part of a progression (I, II, III), set thresholds that fit between existing ones
- Common: low threshold, Uncommon: medium, Rare: higher, Epic: high, Legendary: very high
- If unsure, use: Common=1, Uncommon=5, Rare=10, Epic=25, Legendary=50

### Step 4.2 — Insert new achievements
Run INSERTs in batches of 25. After each batch verify count.

### Step 4.3 — Verify inserts
```sql
-- New total should be 433 + 108 = 541
SELECT COUNT(*) FROM achievements;

-- Check the new rows
SELECT name, rarity, category, stat_key, xp_reward, badge_image_url 
FROM achievements 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY target_role, name;
```

---

## PHASE 5: FINAL VERIFICATION

### Step 5.1 — Complete inventory
```sql
-- Total count
SELECT COUNT(*) as total FROM achievements;
-- Expected: 541

-- By role
SELECT target_role, COUNT(*) FROM achievements GROUP BY target_role ORDER BY target_role;
-- Expected: admin ~100, coach ~100, parent ~100, player ~100, team_manager ~100, all ~30

-- Badge URL coverage
SELECT 
  COUNT(*) as total,
  COUNT(badge_image_url) as has_badge_url,
  COUNT(*) - COUNT(badge_image_url) as missing_badge_url
FROM achievements;

-- Any broken URLs (the old badges/player/badges/ pattern)
SELECT COUNT(*) FROM achievements WHERE badge_image_url LIKE '%/badges/player/badges/%';
-- Expected: 0

-- Remaining NULL badge_image_url
SELECT name, target_role, rarity, stat_key 
FROM achievements 
WHERE badge_image_url IS NULL OR badge_image_url = ''
ORDER BY target_role, name;
```

### Step 5.2 — Cross-check with storage
For each role, verify the Storage file count matches the achievement count:
```sql
SELECT target_role, COUNT(*) FROM achievements 
WHERE badge_image_url IS NOT NULL 
GROUP BY target_role;
```
Compare with Storage bucket file counts.

### Step 5.3 — Spot check URLs
Pick 5 random achievements, fetch their `badge_image_url`, verify 200 OK:
```sql
SELECT name, badge_image_url FROM achievements ORDER BY RANDOM() LIMIT 5;
```

### Step 5.4 — Write final report
Append to `CC-BADGE-V3-DEPLOY-REPORT.md`:
- Total images uploaded (full + thumb)
- Total achievement URLs updated
- Total new achievements created
- Final achievement count
- Badge URL coverage percentage
- Any remaining issues
- List of orphan achievements (exist but have no V3 badge)

---

## CRITICAL RULES

1. **Phase 1 is read-only** — STOP and wait for Carlos review before uploading anything
2. **DO NOT delete any achievement rows** — only UPDATE existing or INSERT new
3. **DO NOT modify any columns besides `badge_image_url`** on existing rows (no changing names, XP, stat_keys, etc.)
4. **Upsert mode for Storage** — overwrite existing files, don't fail on conflicts
5. **team-manager local folder → tm Storage folder** — the mapping is in the CSV, follow it
6. **Lowercase rarity** for new inserts — existing convention is `common` not `Common`
7. **Commit after each phase** with descriptive messages
8. **Write all reports to markdown files**, not console
9. **TypeScript check between phases:** `npx tsc --noEmit`
10. **If ANY phase fails, STOP and report** — do not continue to next phase
