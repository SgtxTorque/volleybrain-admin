# CC-WEB-ENGAGEMENT-XP-CENTRALIZE
# Lynx Web Admin — Investigate + Execute: Centralize XP Awards
# STATUS: READY FOR CC EXECUTION
# NOTE: Combined investigation + execution because web has only 3 XP write paths (vs mobile's 8)
# Reference: Mobile lib/xp-award-service.ts (the pattern to follow)

---

## STANDING RULES

1. **Read these files first:**
   - `INVESTIGATION-WEB-ALIGN-01.md` in repo root (Tasks 2, 3, 4 — XP write paths)
   - `src/lib/engagement-constants.js` — read the SEASON_RANK_TIERS section (added in earlier spec)
2. **Run investigation steps FIRST (Phase 0). If anything unexpected is found, STOP and report.**
3. **Commit after each phase.** Format: `[xp-centralize-web] Phase X: description`

---

## WHAT THIS SPEC DOES

Creates a centralized `src/lib/xp-award-service.js` for the web admin that mirrors the mobile version. Refactors 3 files to use it. Adds season_id tagging, season rank multiplier reads, and season_ranks updates to all web XP awards.

---

## PHASE 0: Investigation (read-only, no changes)

Before writing any code, audit the 3 XP-writing files. For each one, report:

### 0A: Read `src/lib/achievement-engine.js` fully

1. Find every `supabase.from('xp_ledger').insert(...)` — exact line, exact columns
2. Find every `supabase.from('profiles').update(...)` that writes `player_level` — exact line, exact columns
3. What variables hold the XP amount, profile ID, achievement ID?
4. Is there a `season_id` available at the award site?
5. Is there an `organization_id` available?

### 0B: Read `src/lib/shoutout-service.js` fully

Same 5 questions.

### 0C: Read `src/lib/challenge-service.js` fully

Same 5 questions.

### 0D: Check for other XP writers

```bash
grep -rn "from('xp_ledger').insert\|from(\"xp_ledger\").insert" --include="*.js" --include="*.jsx" src/ | grep -v node_modules
```

Report any files beyond the 3 expected ones.

### 0E: Write investigation findings

Write a brief summary at the top of your commit message listing:
- Total XP write paths found: [N]
- Files: [list]
- Any unexpected findings

**If more than 3 XP write paths are found, STOP and report back without proceeding to Phase 1.**

---

## PHASE 1: Create src/lib/xp-award-service.js

Create a NEW file mirroring the mobile version but in plain JS (no TypeScript):

```javascript
/**
 * xp-award-service.js — Centralized XP Award Service (Web)
 * Mirrors mobile lib/xp-award-service.ts
 */

import { supabase } from './supabase'
import { getLevelFromXP } from './engagement-constants'

/**
 * Award XP to a profile. Handles:
 * - Season rank multiplier lookup
 * - xp_ledger insert with season_id
 * - profiles update (total_xp, player_level, tier, xp_to_next_level)
 * - season_ranks.season_xp increment
 */
export async function awardXP({
  profileId,
  baseAmount,
  sourceType,
  sourceId = null,
  seasonId = null,
  organizationId = null,
  teamId = null,
  description = '',
}) {
  if (baseAmount <= 0) return { finalAmount: 0 }

  // Look up season rank multiplier from profiles (denormalized)
  let seasonMultiplier = 1.0
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_season_multiplier')
      .eq('id', profileId)
      .maybeSingle()
    seasonMultiplier = profile?.current_season_multiplier || 1.0
  } catch (e) {
    // Non-critical, continue with 1.0
  }

  const finalAmount = Math.round(baseAmount * seasonMultiplier)

  let finalDescription = description
  if (seasonMultiplier > 1.0) {
    finalDescription += ` (${seasonMultiplier}x season rank)`
  }

  // Insert xp_ledger
  await supabase.from('xp_ledger').insert({
    player_id: profileId,
    organization_id: organizationId,
    xp_amount: finalAmount,
    base_amount: baseAmount,
    season_multiplier: seasonMultiplier,
    source_type: sourceType,
    source_id: sourceId,
    season_id: seasonId,
    description: finalDescription,
  })

  // Update profiles
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', profileId)
    .maybeSingle()

  const oldTotalXp = currentProfile?.total_xp || 0
  const newTotalXp = oldTotalXp + finalAmount
  const levelInfo = getLevelFromXP(newTotalXp)

  await supabase
    .from('profiles')
    .update({
      total_xp: newTotalXp,
      player_level: levelInfo.level,
      tier: levelInfo.tier,
      xp_to_next_level: levelInfo.xpToNext,
    })
    .eq('id', profileId)

  // Update season_ranks if season known
  if (seasonId) {
    try {
      const { data: existing } = await supabase
        .from('season_ranks')
        .select('id, season_xp')
        .eq('player_id', profileId)
        .eq('season_id', seasonId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('season_ranks')
          .update({
            season_xp: (existing.season_xp || 0) + finalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else if (organizationId) {
        await supabase
          .from('season_ranks')
          .insert({
            player_id: profileId,
            season_id: seasonId,
            organization_id: organizationId,
            season_xp: finalAmount,
          })
      }
    } catch (e) {
      // Non-critical
    }
  }

  return {
    finalAmount,
    newTotalXp,
    newLevel: levelInfo.level,
    newTier: levelInfo.tier,
    leveledUp: levelInfo.level > getLevelFromXP(oldTotalXp).level,
  }
}
```

**Commit:** `[xp-centralize-web] Phase 1: create centralized xp-award-service.js`

---

## PHASE 2: Refactor achievement-engine.js

Modify `src/lib/achievement-engine.js`.

### Step 2A: Add import
```javascript
import { awardXP } from './xp-award-service'
```

### Step 2B: Find XP award section

Based on the investigation, this is around line 169-174 in `awardAchievementXP()`. It:
1. Gets xp_reward from XP_BY_RARITY based on rarity
2. Inserts into xp_ledger
3. Updates profiles with getLevelFromXP

### Step 2C: Replace with centralized call

Replace the xp_ledger insert AND profiles update with:

```javascript
await awardXP({
  profileId,
  baseAmount: xpReward,
  sourceType: 'achievement',
  sourceId: achievementId,
  organizationId: /* if available from context */,
  description: `Earned badge: ${achievementName} (+${xpReward} XP)`,
})
```

Remove the old xp_ledger and profiles code. Keep everything else (achievement record insert, unseen tracking, etc.).

### Step 2D: Remove unused imports

If `getLevelFromXP` was only used for the profile update, it may still be used in `fetchPlayerXP()`. Check before removing. Only remove imports with zero remaining usages.

**Commit:** `[xp-centralize-web] Phase 2: refactor achievement-engine to use centralized awardXP`

---

## PHASE 3: Refactor shoutout-service.js

Modify `src/lib/shoutout-service.js`.

### Step 3A: Add import
```javascript
import { awardXP } from './xp-award-service'
```

### Step 3B: Replace XP award section

Find the section (~lines 92-137) that:
1. Calculates giverXP and receiverXP from XP_BY_SOURCE
2. Inserts into xp_ledger (two rows)
3. Updates profiles for both giver and receiver

Replace with two `awardXP()` calls:

```javascript
// Giver
await awardXP({
  profileId: giverProfileId,
  baseAmount: XP_BY_SOURCE.shoutout_given,
  sourceType: 'shoutout_given',
  sourceId: shoutoutId,
  organizationId,
  description: `Gave shoutout (+${XP_BY_SOURCE.shoutout_given} XP)`,
})

// Receiver
await awardXP({
  profileId: receiverProfileId,
  baseAmount: XP_BY_SOURCE.shoutout_received,
  sourceType: 'shoutout_received',
  sourceId: shoutoutId,
  organizationId,
  description: `Received shoutout (+${XP_BY_SOURCE.shoutout_received} XP)`,
})
```

Keep the shoutout record insert, team wall post, and achievement check logic.

**Commit:** `[xp-centralize-web] Phase 3: refactor shoutout-service to use centralized awardXP`

---

## PHASE 4: Refactor challenge-service.js

Modify `src/lib/challenge-service.js`.

### Step 4A: Add import
```javascript
import { awardXP } from './xp-award-service'
```

### Step 4B: Replace XP award section in completeChallenge()

Find the section (~lines 316-355) that:
1. Builds xp_ledger entries for completed participants
2. Batch inserts into xp_ledger
3. Updates profiles for each participant

Replace with a loop calling `awardXP()` for each participant:

```javascript
for (const participant of completedParticipants) {
  const xpAmount = challenge.xp_reward || XP_BY_SOURCE.challenge_completed
  await awardXP({
    profileId: participant.player_id,
    baseAmount: xpAmount,
    sourceType: 'challenge',
    sourceId: challenge.id,
    organizationId: challenge.organization_id,
    description: `Completed challenge "${challenge.title}" (+${xpAmount} XP)`,
  })
}

// Winner bonus (individual challenges only)
if (challenge.challenge_type === 'individual' && winnerId) {
  await awardXP({
    profileId: winnerId,
    baseAmount: XP_BY_SOURCE.challenge_won,
    sourceType: 'challenge_won',
    sourceId: challenge.id,
    organizationId: challenge.organization_id,
    description: `Won challenge "${challenge.title}" (+${XP_BY_SOURCE.challenge_won} XP bonus)`,
  })
}
```

Keep the challenge status update, winner detection, and notification logic.

**Commit:** `[xp-centralize-web] Phase 4: refactor challenge-service to use centralized awardXP`

---

## PHASE 5: Verification

```bash
# Should find ZERO direct xp_ledger inserts outside xp-award-service
grep -rn "from('xp_ledger').insert" --include="*.js" --include="*.jsx" src/lib/ | grep -v xp-award-service

# Should find ZERO direct player_level profile updates outside xp-award-service
grep -rn "player_level" --include="*.js" src/lib/achievement-engine.js src/lib/shoutout-service.js src/lib/challenge-service.js | grep "update"

# Confirm all 3 import from xp-award-service
grep -rn "from.*xp-award-service" --include="*.js" src/lib/
```

### Report

```
## VERIFICATION REPORT: WEB XP CENTRALIZATION

### Phase 0: Investigation
- XP write paths found: [N]
- Files: [list]
- Unexpected findings: [any]

### Phase 1: xp-award-service.js
- File created: YES/NO, line count: [N]

### Phases 2-4: Refactored files
| File | awardXP imported | Old XP code removed |
|------|-----------------|---------------------|
| achievement-engine.js | | |
| shoutout-service.js | | |
| challenge-service.js | | |

### Phase 5: Verification
- Direct xp_ledger inserts outside service: [count]
- Direct player_level updates outside service: [count]
- Files importing xp-award-service: [count]

### Files created:
- src/lib/xp-award-service.js: [N] lines

### Files modified:
[list]

### Errors: NONE / [list]
```

**Commit:** `[xp-centralize-web] Phase 5: verification complete`
