# CC-ACHIEVEMENTS-CLEANUP
## Delete 150 Duplicate Achievement Rows from Supabase

**Run with:** `--dangerously-skip-permissions`
**Repo:** Either repo (just needs Supabase access)

---

## CONTEXT

The `achievements` table has 578 rows but 150 are duplicates (same `stat_key` + same `rarity`, different names or IDs). These include 15 ALL-CAPS V2 leftovers and 135 straight duplicates. After cleanup: 428 clean rows.

A CSV file with the exact IDs to delete is attached: `achievements-delete-list.csv`

---

## PHASE 1: SAFETY BACKUP

### Step 1.1 — Full table backup
Before deleting anything, export the ENTIRE `achievements` table to a backup file:

```sql
SELECT * FROM achievements ORDER BY created_at;
```

Save to `achievements-backup-pre-cleanup.csv` in the repo root. This is the undo file if anything goes wrong.

### Step 1.2 — Count verification
```sql
SELECT COUNT(*) as total FROM achievements;
-- Expected: 578
```

---

## PHASE 2: CHECK FOR FOREIGN KEY REFERENCES

Before deleting, check if any of the 150 IDs are referenced elsewhere. Run these checks:

```sql
-- Check if player_badges references achievements
SELECT COUNT(*) FROM player_badges pb 
WHERE pb.achievement_id IN (<list of 150 IDs>);

-- Check if any other table references achievements.id
-- Look at: user_achievements, badge_awards, challenge_rewards, or whatever tables exist
-- Run: \dt to see all tables, then check for achievement_id foreign keys
```

**If ANY rows are referenced:** Report which IDs are referenced and by how many rows. Do NOT delete those — remove them from the delete list and note in the report. We'll handle those separately.

**If no references:** Proceed to Phase 3.

---

## PHASE 3: DELETE DUPLICATES

### The 150 IDs to delete

Here are the exact UUIDs. Delete in batches of 25.

**IMPORTANT:** Before each batch, verify the row exists and confirm it's the duplicate (not the one we want to keep). Use this pattern:

```sql
-- Verify before deleting (spot check 3 random from each batch)
SELECT id, name, stat_key, rarity FROM achievements WHERE id = '<uuid>';

-- Then delete the batch
DELETE FROM achievements WHERE id IN (
  '<uuid1>',
  '<uuid2>',
  ...
);
```

### Batch execution approach
1. Read the `achievements-delete-list.csv` file (Carlos will place it in the repo root, or you can find it in the project)
2. Extract the `id` column — these are the 150 UUIDs to delete
3. Delete in batches of 25
4. After each batch, run `SELECT COUNT(*) FROM achievements;` to verify count is decreasing correctly
5. After all batches: final count should be **428**

---

## PHASE 4: POST-CLEANUP VERIFICATION

### Step 4.1 — Row count
```sql
SELECT COUNT(*) FROM achievements;
-- Expected: 428
```

### Step 4.2 — No more duplicates
```sql
-- This should return ZERO rows
SELECT stat_key, rarity, COUNT(*) as cnt 
FROM achievements 
WHERE stat_key IS NOT NULL AND stat_key != ''
GROUP BY stat_key, rarity 
HAVING COUNT(*) > 1;
```

### Step 4.3 — No ALL-CAPS names remain
```sql
-- This should return ZERO rows
SELECT id, name FROM achievements WHERE name = UPPER(name) AND LENGTH(name) > 3;
```

### Step 4.4 — Count by role (from URL)
```sql
SELECT 
  CASE 
    WHEN badge_image_url LIKE '%/player/%' OR icon_url LIKE '%/player/%' THEN 'player'
    WHEN badge_image_url LIKE '%/coach/%' OR icon_url LIKE '%/coach/%' THEN 'coach'
    WHEN badge_image_url LIKE '%/parent/%' OR icon_url LIKE '%/parent/%' THEN 'parent'
    WHEN badge_image_url LIKE '%/admin/%' OR icon_url LIKE '%/admin/%' THEN 'admin'
    WHEN badge_image_url LIKE '%/tm/%' OR icon_url LIKE '%/tm/%' THEN 'tm'
    WHEN badge_image_url LIKE '%/universal/%' OR icon_url LIKE '%/universal/%' THEN 'universal'
    ELSE 'unknown'
  END as role,
  COUNT(*) as count
FROM achievements
GROUP BY role
ORDER BY role;
```

Expected approximately:
- admin: 76
- coach: 88
- parent: 84
- player: 86
- tm: 85
- universal: 9

### Step 4.5 — Remaining NULL badge_image_url
```sql
SELECT id, name, stat_key, rarity, category 
FROM achievements 
WHERE badge_image_url IS NULL OR badge_image_url = '';
```

Expected: ~7 rows (Block Party, Dominant Season, First Roster, Iron Player, Most Valued, Streak Machine, Untouchable). These are real achievements that just need badge images assigned — NOT duplicates.

---

## PHASE 5: WRITE REPORT

Write results to `CC-ACHIEVEMENTS-CLEANUP-REPORT.md`:
- Backup file location
- Foreign key check results
- How many rows deleted
- Final count
- Duplicate check (should be zero)
- ALL-CAPS check (should be zero)
- Role breakdown
- List of remaining NULL badge_image_url rows
- Any issues encountered

---

## CRITICAL RULES

1. **BACK UP FIRST** — do not delete a single row before the full backup CSV exists
2. **CHECK FOREIGN KEYS** — if referenced, skip those IDs
3. **BATCH DELETES** — 25 at a time, verify count after each
4. **DO NOT** delete any row not in the delete list
5. **DO NOT** modify any columns — only DELETE rows
6. **Commit after Phase 1** (backup), then again after **Phase 3** (deletes complete)
