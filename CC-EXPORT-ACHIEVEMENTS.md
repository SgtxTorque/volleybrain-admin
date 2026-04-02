# CC-EXPORT-ACHIEVEMENTS
## Quick Export: Pull achievements table to CSV

**Run with:** `--dangerously-skip-permissions`
**Repo:** Either repo (just needs Supabase access)

---

## TASK

Export the full `achievements` table from Supabase to a CSV file. One query, one file.

### Query
```sql
SELECT 
  id,
  name,
  description,
  stat_key,
  role,
  rarity,
  category,
  xp_reward,
  badge_image_url,
  icon_url,
  threshold,
  created_at
FROM achievements 
ORDER BY role, name
```

### Output
Save results to `achievements-export.csv` in the repo root.

Make sure:
- All 578 rows are included
- CSV has headers
- NULL values show as empty strings
- Text fields with commas are properly quoted

### Verification
After export, print:
- Total row count
- Count per role
- Count where badge_image_url IS NOT NULL
- Count where badge_image_url IS NULL

That's it. Just the export. Write results to console AND save the CSV.
