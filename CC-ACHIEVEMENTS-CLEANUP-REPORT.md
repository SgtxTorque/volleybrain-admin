# CC-ACHIEVEMENTS-CLEANUP-REPORT

**Date:** 2026-04-01
**Executed by:** Claude Code

---

## Phase 1: Safety Backup

- **Backup file:** `achievements-backup-pre-cleanup.csv` (repo root)
- **Initial row count:** 578 (matches expected)

---

## Phase 2: Foreign Key Reference Check

### Tables checked:
| Table | Result |
|-------|--------|
| `player_achievements` | **7 references** across 5 achievement IDs |
| `player_achievement_progress` | **185 references** across 149 achievement IDs |
| `player_badges` | Table does not exist |
| `xp_ledger` | Table does not exist |

### 5 IDs skipped (referenced in `player_achievements`):

These have actual player awards and were **NOT deleted** to avoid breaking player records:

| ID | Name | stat_key | rarity |
|----|------|----------|--------|
| `5babfb9d` | ACE SNIPER | total_aces | uncommon |
| `0d07be23` | First Shoutout | shoutouts_given | common |
| `9ee1aa1a` | Hype Machine | shoutouts_given | uncommon |
| `dbee21ba` | Community Builder | shoutouts_given | rare |
| `4eefa96f` | Fan Favorite | shoutouts_received | uncommon |

### `player_achievement_progress` cleanup:
- Progress records for the 145 deleted achievements were cleaned up (these are auto-seeded tracking rows, not actual awards)

---

## Phase 3: Deletion Results

| Metric | Count |
|--------|-------|
| Total identified for deletion | 150 |
| Skipped (player_achievements FK) | 5 |
| Actually deleted | **145** |
| Progress rows cleaned up | ~145 achievement IDs worth |

Deleted in 6 batches of 25 (last batch: 20). Count verified after each batch:
- Batch 1: 578 -> 553
- Batch 2: 553 -> 528
- Batch 3: 528 -> 503
- Batch 4: 503 -> 478
- Batch 5: 478 -> 453
- Batch 6: 453 -> 433

---

## Phase 4: Post-Cleanup Verification

### 4.1 Row count
- **Final count: 433** (expected 428, difference is the 5 skipped IDs)

### 4.2 Remaining duplicates (stat_key + rarity)
- **5 remaining** (all due to the skipped IDs):
  - `shoutouts_given` + `common`: 2 rows
  - `shoutouts_given` + `uncommon`: 2 rows
  - `shoutouts_given` + `rare`: 2 rows
  - `shoutouts_received` + `uncommon`: 2 rows
  - `total_aces` + `uncommon`: 2 rows

### 4.3 ALL-CAPS names remaining
- **1 remaining:** "ACE SNIPER" (skipped ID — has player awards)

### 4.4 Count by role (from URL)
| Role | Count |
|------|-------|
| admin | 83 |
| coach | 87 |
| parent | 88 |
| player | 91 |
| tm | 71 |
| universal | 12 |
| unknown | 1 |
| **Total** | **433** |

### 4.5 Rows with NULL/empty badge_image_url (12 total)

**Original 7 expected (real achievements needing badge images):**
- Block Party (blocks, epic)
- Untouchable (aces, epic)
- Most Valued (shoutouts_received, epic)
- Iron Player (null, uncommon)
- Streak Machine (null, epic)
- First Roster (roster_assignments, common)
- Dominant Season (season_win_pct, epic)

**5 skipped duplicates (also missing badges):**
- First Shoutout (shoutouts_given, common)
- Hype Machine (shoutouts_given, uncommon)
- Community Builder (shoutouts_given, rare)
- Fan Favorite (shoutouts_received, uncommon)
- ACE SNIPER (total_aces, uncommon)

---

## Issues & Next Steps

1. **5 skipped IDs need manual resolution.** These duplicate achievements have actual `player_achievements` awards. To fully clean them:
   - Identify the "keeper" achievement for each stat_key+rarity pair
   - Migrate `player_achievements` rows to point to the keeper ID
   - Migrate any remaining `player_achievement_progress` rows
   - Then delete the 5 duplicates

2. **The 5 skipped IDs also lack `badge_image_url`** — if the keeper version has a badge, migrating is straightforward.

3. **"unknown" role (1 row)** — one achievement has no badge URL containing a role path. May need investigation.

---

## Files Created
- `achievements-backup-pre-cleanup.csv` — Full 578-row backup before any deletions
- `achievements-delete-list.csv` — The 150 identified duplicate IDs with reasons
- `achievements-skipped-ids.json` — The 5 skipped IDs
- `achievements-verify-data.json` — Raw verification data
