# CC-BADGE-V3-UPLOAD-INVESTIGATION

## Purpose
Investigate the current badge storage and database structure so we can safely replace all existing badge images with the new V3 assembled badges.

## Investigation Steps

### Step 1: Check Supabase Storage bucket structure
```sql
-- List all files in the badges bucket, grouped by folder
SELECT name, metadata
FROM storage.objects 
WHERE bucket_id = 'badges'
ORDER BY name
LIMIT 50;
```

Also check each subfolder:
```sql
SELECT name FROM storage.objects WHERE bucket_id = 'badges' AND name LIKE 'player/%' LIMIT 20;
SELECT name FROM storage.objects WHERE bucket_id = 'badges' AND name LIKE 'coach/%' LIMIT 20;
SELECT name FROM storage.objects WHERE bucket_id = 'badges' AND name LIKE 'parent/%' LIMIT 20;
SELECT name FROM storage.objects WHERE bucket_id = 'badges' AND name LIKE 'admin/%' LIMIT 20;
SELECT name FROM storage.objects WHERE bucket_id = 'badges' AND name LIKE 'tm/%' LIMIT 20;
SELECT name FROM storage.objects WHERE bucket_id = 'badges' AND name LIKE 'universal/%' LIMIT 20;
```

**Report:** What are the current filenames? What naming pattern do they use? How many files per folder?

### Step 2: Check database badge/achievement tables
```sql
-- Find any table that references badge images
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name ILIKE '%image%' 
   OR column_name ILIKE '%icon%' 
   OR column_name ILIKE '%badge%path%'
   OR column_name ILIKE '%badge%url%'
   OR column_name ILIKE '%badge%img%'
ORDER BY table_name;
```

```sql
-- Check the achievements/badges table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'achievements'
ORDER BY ordinal_position;
```

```sql
-- If achievements table exists, show sample rows with image paths
SELECT id, name, image_url, badge_image, icon_path
FROM achievements
LIMIT 10;
```

Note: Some of those column names may not exist — try them and report which ones are real.

Also check:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'badges' OR table_name = 'player_badges' OR table_name = 'badge_definitions'
ORDER BY table_name, ordinal_position;
```

### Step 3: Check how badge images are currently referenced
```sql
-- Find any column in any table that contains the string 'badges/' (storage path reference)
SELECT table_name, column_name
FROM information_schema.columns
WHERE data_type IN ('text', 'character varying')
AND table_schema = 'public'
ORDER BY table_name;
```

Then for each text column that might contain badge paths:
```sql
-- Example: check if achievements table has storage paths
SELECT DISTINCT LEFT(image_url, 50) FROM achievements WHERE image_url IS NOT NULL LIMIT 20;
```

### Step 4: Count current badges in storage vs database
Report:
- Total files in badges bucket (per subfolder)
- Total badge records in database
- Whether the counts match
- The exact column name that stores the image path
- The path format (e.g., `badges/player/filename.png` or just `player/filename.png` or a full URL)

### Step 5: Check the V3 assembled badges
```bash
# Count assembled badges ready to upload
ls -la outbox/badges-v3/assembled/player/ | wc -l
ls -la outbox/badges-v3/assembled/coach/ | wc -l
ls -la outbox/badges-v3/assembled/parent/ | wc -l
ls -la outbox/badges-v3/assembled/admin/ | wc -l
ls -la outbox/badges-v3/assembled/team-manager/ | wc -l
ls -la outbox/badges-v3/assembled/universal/ | wc -l
```

**Report the filename format** of the assembled badges (e.g., `player-001-first-blood.png`)

## Deliverable
Write a report to `CC-BADGE-UPLOAD-REPORT.md` with:
1. Current storage filenames and naming pattern
2. Current database table and column that references badge images
3. The path format used in the database
4. How many old badges exist vs how many new V3 badges are ready
5. Whether the V3 filenames need to be renamed to match the old naming convention
6. A recommended upload plan (rename V3 files → upload → update DB, or upload V3 with new names → update DB to point to new paths)

## CRITICAL
- Do NOT upload anything yet
- Do NOT modify any database records
- Do NOT delete any existing files
- Investigation ONLY — report back with findings
