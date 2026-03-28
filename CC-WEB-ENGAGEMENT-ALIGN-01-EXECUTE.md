# CC-WEB-ENGAGEMENT-ALIGN-01-EXECUTE
# Lynx Web Admin — Execute: XP Level Curve Alignment
# STATUS: READY FOR CC EXECUTION
# DEPENDS ON: INVESTIGATION-WEB-ALIGN-01.md (completed, reviewed)
# MIRRORS: Mobile CC-ENGAGEMENT-ALIGN-01-EXECUTE (completed successfully)
# Reference: LYNX-ENGAGEMENT-SYSTEM-V2.md (Section 3.3)

---

## STANDING RULES

1. **Read these files first, in order:**
   - `INVESTIGATION-WEB-ALIGN-01.md` in repo root (the investigation report)
   - `LYNX-ENGAGEMENT-SYSTEM-V2.md` in repo root (Section 3.3 — Level Thresholds)
2. **Only modify the files explicitly listed in each phase.**
3. **DO NOT modify any Supabase tables, migrations, or edge functions.**
4. **Commit after each phase.** Format: `[engagement-align] Phase X: description`
5. **If a file doesn't match what the investigation reported, STOP and report back.**
6. **Branch:** `main` (or current working branch)

---

## WHAT THIS SPEC DOES

1. Updates `engagement-constants.js` to match the V2 30-level curve (identical to mobile)
2. Fixes 3 dashboard pages with broken hardcoded `Math.floor(xp/1000)+1` level math
3. Fixes hardcoded wrong tier names in PlayerDashboard and ParentChildHero
4. Aligns 3 profile writer services to write all 4 columns (total_xp, player_level, tier, xp_to_next_level)
5. Replaces hardcoded XP strings in shoutout UI with constants references
6. Does NOT change XP_BY_SOURCE values (separate spec)

---

## PHASE 1: Update engagement-constants.js

Modify `src/lib/engagement-constants.js`. Replace the level-related constants while preserving everything else.

### Step 1A: Replace XP_LEVELS array

Replace the 20-entry array with the V2 30-entry version:

```javascript
/** V2 XP level thresholds — 30 levels, exponential curve
 *  xpRequired = XP needed for THIS level (delta)
 *  cumulative = total XP to reach this level
 *  See: LYNX-ENGAGEMENT-SYSTEM-V2.md Section 3.3 */
export const XP_LEVELS = [
  { level: 1,  xpRequired: 0,     cumulative: 0,      tier: 'Rookie' },
  { level: 2,  xpRequired: 100,   cumulative: 100,    tier: 'Rookie' },
  { level: 3,  xpRequired: 150,   cumulative: 250,    tier: 'Rookie' },
  { level: 4,  xpRequired: 200,   cumulative: 450,    tier: 'Rookie' },
  { level: 5,  xpRequired: 250,   cumulative: 700,    tier: 'Bronze' },
  { level: 6,  xpRequired: 300,   cumulative: 1000,   tier: 'Bronze' },
  { level: 7,  xpRequired: 400,   cumulative: 1400,   tier: 'Bronze' },
  { level: 8,  xpRequired: 500,   cumulative: 1900,   tier: 'Bronze' },
  { level: 9,  xpRequired: 600,   cumulative: 2500,   tier: 'Silver' },
  { level: 10, xpRequired: 700,   cumulative: 3200,   tier: 'Silver' },
  { level: 11, xpRequired: 800,   cumulative: 4000,   tier: 'Silver' },
  { level: 12, xpRequired: 900,   cumulative: 4900,   tier: 'Silver' },
  { level: 13, xpRequired: 1100,  cumulative: 6000,   tier: 'Gold' },
  { level: 14, xpRequired: 1300,  cumulative: 7300,   tier: 'Gold' },
  { level: 15, xpRequired: 1500,  cumulative: 8800,   tier: 'Gold' },
  { level: 16, xpRequired: 1700,  cumulative: 10500,  tier: 'Gold' },
  { level: 17, xpRequired: 2000,  cumulative: 12500,  tier: 'Platinum' },
  { level: 18, xpRequired: 2300,  cumulative: 14800,  tier: 'Platinum' },
  { level: 19, xpRequired: 2700,  cumulative: 17500,  tier: 'Platinum' },
  { level: 20, xpRequired: 3000,  cumulative: 20500,  tier: 'Platinum' },
  { level: 21, xpRequired: 3500,  cumulative: 24000,  tier: 'Diamond' },
  { level: 22, xpRequired: 4000,  cumulative: 28000,  tier: 'Diamond' },
  { level: 23, xpRequired: 4500,  cumulative: 32500,  tier: 'Diamond' },
  { level: 24, xpRequired: 5000,  cumulative: 37500,  tier: 'Diamond' },
  { level: 25, xpRequired: 5500,  cumulative: 43000,  tier: 'Legend' },
  { level: 26, xpRequired: 6000,  cumulative: 49000,  tier: 'Legend' },
  { level: 27, xpRequired: 7000,  cumulative: 56000,  tier: 'Legend' },
  { level: 28, xpRequired: 8000,  cumulative: 64000,  tier: 'Legend' },
  { level: 29, xpRequired: 9000,  cumulative: 73000,  tier: 'Legend' },
  { level: 30, xpRequired: 10000, cumulative: 83000,  tier: 'Legend' },
]

export const MAX_LEVEL = 30
```

### Step 1B: Replace LEVEL_TIERS array

Replace the 4-tier array with V2 7-tier version:

```javascript
/** V2 level tier visual config — 7 tiers */
export const LEVEL_TIERS = [
  { min: 1,  max: 4,  name: 'Rookie',   color: '#94A3B8', bgColor: '#94A3B820' },
  { min: 5,  max: 8,  name: 'Bronze',   color: '#CD7F32', bgColor: '#CD7F3220' },
  { min: 9,  max: 12, name: 'Silver',   color: '#C0C0C0', bgColor: '#C0C0C020' },
  { min: 13, max: 16, name: 'Gold',     color: '#FFD700', bgColor: '#FFD70020' },
  { min: 17, max: 20, name: 'Platinum', color: '#E5E4E2', bgColor: '#E5E4E220' },
  { min: 21, max: 24, name: 'Diamond',  color: '#B9F2FF', bgColor: '#B9F2FF20' },
  { min: 25, max: 30, name: 'Legend',   color: '#FF6B35', bgColor: '#FF6B3520' },
]
```

### Step 1C: Rewrite getLevelFromXP() to return V2 superset shape

Replace the function with the V2 version that returns `tier` and `xpToNext` in addition to existing fields:

```javascript
/** Calculate level info from total XP — V2 SINGLE SOURCE OF TRUTH
 *  Returns superset shape matching mobile: { level, currentXp, nextLevelXp, progress, tier, xpToNext } */
export function getLevelFromXP(totalXp) {
  let currentLevel = 1
  for (const entry of XP_LEVELS) {
    if (totalXp >= entry.cumulative) {
      currentLevel = entry.level
    } else {
      break
    }
  }

  const currentEntry = XP_LEVELS[currentLevel - 1]
  const nextEntry = currentLevel < MAX_LEVEL ? XP_LEVELS[currentLevel] : null
  const nextCumulative = nextEntry ? nextEntry.cumulative : currentEntry.cumulative
  const xpIntoLevel = totalXp - currentEntry.cumulative
  const xpNeeded = nextCumulative - currentEntry.cumulative
  const progress = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100

  return {
    level: currentLevel,
    currentXp: totalXp,
    nextLevelXp: nextCumulative,
    progress,
    tier: currentEntry.tier,
    xpToNext: nextEntry ? nextEntry.cumulative - totalXp : 0,
  }
}
```

### Step 1D: Leave these UNCHANGED

- `getLevelTier()` — already works (uses `.find()` on min/max)
- `checkLevelUp()` — leave as-is
- `XP_BY_SOURCE` — do NOT change values
- `XP_BY_RARITY` — already matches V2
- `RARITY_CONFIG` — untouched
- `DEFAULT_SHOUTOUT_CATEGORIES` — untouched
- `ACHIEVEMENT_CATEGORIES` — untouched
- `STAT_OPTIONS` — untouched

**Commit:** `[engagement-align] Phase 1: V2 level curve — 30 levels, 83K max XP, 7 tiers`

---

## PHASE 2: Fix broken dashboard level calculations

The investigation found 3 dashboard files using `Math.floor(xp / 1000) + 1` instead of `getLevelFromXP()`. These are already broken today — they show wrong levels. Fix all of them.

### 2A: `src/pages/roles/PlayerDashboard.jsx`

**Add import at top:**
```javascript
import { getLevelFromXP, getLevelTier } from '../../lib/engagement-constants'
```

**Find the hardcoded level math (~line 215-217).** It looks like:
```javascript
Math.floor(xp / 1000) + 1      // wrong level
(xp % 1000) / 1000) * 100      // wrong progress
1000 - (xp % 1000)             // wrong xp to next
```

**Replace all three with:**
```javascript
const levelInfo = getLevelFromXP(xp)
// Then use levelInfo.level, levelInfo.progress, levelInfo.xpToNext
```

Adapt to how the component uses these values — look at where `level`, progress percentage, and XP-to-next are rendered and replace each with the correct `levelInfo` field.

**Also fix the wrong tier ternary (~line 230).** It currently has:
```javascript
level >= 10 ? 'Diamond' : level >= 7 ? 'Platinum' : level >= 4 ? 'Gold' : 'Silver'
```

**Replace with:**
```javascript
getLevelTier(levelInfo.level).name
```

And for tier color, use:
```javascript
getLevelTier(levelInfo.level).color
```

### 2B: `src/pages/roles/ParentDashboard.jsx`

**Add import at top:**
```javascript
import { getLevelFromXP, getLevelTier } from '../../lib/engagement-constants'
```

**Find the hardcoded level math (~line 285-286):**
```javascript
Math.floor(totalXp / 1000) + 1
totalXp % 1000
```

**Replace with:**
```javascript
const levelInfo = getLevelFromXP(totalXp)
// Use levelInfo.level, levelInfo.progress, levelInfo.xpToNext, levelInfo.tier
```

If there's a fallback `'Bronze'` tier label, replace with `getLevelTier(levelInfo.level).name`.

### 2C: `src/pages/roles/TeamManagerDashboard.jsx`

**Add import at top:**
```javascript
import { getLevelFromXP } from '../../lib/engagement-constants'
```

**Find the hardcoded level math (~line 253):**
```javascript
Math.floor((rosterCount * 50) / 1000) + 1
```

**Replace with a proper XP-based calculation using `getLevelFromXP()`**, OR if this is a fake XP value derived from roster count (not real XP from profiles), then change it to read real `profiles.total_xp` from the current user's profile instead of computing fake XP. Look at what data the component has available and adapt accordingly.

### 2D: `src/pages/roles/ParentChildHero.jsx`

**Add import at top (if not already imported):**
```javascript
import { getLevelTier } from '../../lib/engagement-constants'
```

**Find the hardcoded tier ternary (~line 15).** Replace with:
```javascript
const tier = getLevelTier(level)
// Use tier.name and tier.color
```

**Commit:** `[engagement-align] Phase 2: fix broken hardcoded level math in 4 dashboard files`

---

## PHASE 3: Align profile writers to 4-column pattern

The investigation found all 3 web services write only `total_xp` and `player_level` — missing `tier` and `xp_to_next_level`. Fix all three.

### 3A: `src/lib/achievement-engine.js` (~line 169-174)

Find the profile update:
```javascript
const { level } = getLevelFromXP(newXP)
// ...
profiles.update({ total_xp: newXP, player_level: level })
```

Replace with:
```javascript
const { level, tier, xpToNext } = getLevelFromXP(newXP)
// ...
profiles.update({ total_xp: newXP, player_level: level, tier, xp_to_next_level: xpToNext })
```

### 3B: `src/lib/shoutout-service.js` (~line 133-137)

Find:
```javascript
const { level } = getLevelFromXP(newXP)
profiles.update({ total_xp: newXP, player_level: level })
```

Replace with:
```javascript
const { level, tier, xpToNext } = getLevelFromXP(newXP)
profiles.update({ total_xp: newXP, player_level: level, tier, xp_to_next_level: xpToNext })
```

### 3C: `src/lib/challenge-service.js` (~line 352-355)

Same pattern — find the profile update, add `tier` and `xp_to_next_level`.

**Commit:** `[engagement-align] Phase 3: all profile writers now write 4 columns (level, tier, xp_to_next_level)`

---

## PHASE 4: Replace hardcoded XP strings in UI

The investigation found 2 files with hardcoded "+10 XP" / "+15 XP" strings.

### 4A: `src/components/engagement/GiveShoutoutModal.jsx` (~line 317)

**Add import (if not already present):**
```javascript
import { XP_BY_SOURCE } from '../../lib/engagement-constants'
```

Find the hardcoded string like `"+10 XP for you, +15 XP for [recipient]"` and replace the numbers with:
```javascript
`+${XP_BY_SOURCE.shoutout_given} XP for you, +${XP_BY_SOURCE.shoutout_received} XP for ${recipientName}`
```

### 4B: `src/components/shared/GiveShoutoutCard.jsx` (~line 123)

Same approach — replace hardcoded `"+10 XP for you"` with:
```javascript
`+${XP_BY_SOURCE.shoutout_given} XP for you`
```

Add the import if needed.

### 4C: `src/components/engagement/CreateChallengeModal.jsx` (~line 232)

The "25–500" XP range string. This is informational — update it to match the V2 challenge tier ranges: "15–300 XP" or better yet, derive it from constants if there's a config. If this is just a helper text string, update it to say "15–300 XP (based on difficulty tier)".

**Commit:** `[engagement-align] Phase 4: replace hardcoded XP strings with constants references`

---

## PHASE 5: Verification

### 5A: Search for remaining issues

```bash
# Should find NO remaining Math.floor(xp/1000) patterns
grep -rn "/ 1000\|% 1000\|xp / 1000\|xp/1000" --include="*.jsx" --include="*.js" src/ | grep -v node_modules | grep -v engagement-constants

# Should find NO hardcoded tier ternaries
grep -rn "'Diamond'\|'Platinum'\|'Gold'\|'Silver'\|'Bronze'" --include="*.jsx" src/pages/roles/ | grep -v node_modules

# Should confirm all 3 services write 4 columns
grep -A 3 "profiles.*update" --include="*.js" src/lib/achievement-engine.js src/lib/shoutout-service.js src/lib/challenge-service.js

# Should confirm MAX_LEVEL = 30
grep "MAX_LEVEL" src/lib/engagement-constants.js

# Should confirm 30 XP_LEVELS entries
grep -c "level:" src/lib/engagement-constants.js
```

### 5B: Report

```
## VERIFICATION REPORT: WEB-ALIGN-01-EXECUTE

### Phase 1: engagement-constants.js
- XP_LEVELS: [count] entries, max cumulative: [value]
- MAX_LEVEL: [value]
- LEVEL_TIERS: [count] entries, tier names: [list]
- getLevelFromXP return fields: [list]

### Phase 2: Dashboard fixes
- PlayerDashboard.jsx: Math.floor removed: YES/NO, tier ternary replaced: YES/NO
- ParentDashboard.jsx: Math.floor removed: YES/NO
- TeamManagerDashboard.jsx: Math.floor removed: YES/NO
- ParentChildHero.jsx: tier ternary replaced: YES/NO

### Phase 3: Profile writer alignment
- achievement-engine.js: writes [columns]
- shoutout-service.js: writes [columns]
- challenge-service.js: writes [columns]

### Phase 4: Hardcoded XP strings
- GiveShoutoutModal.jsx: hardcoded XP removed: YES/NO
- GiveShoutoutCard.jsx: hardcoded XP removed: YES/NO
- CreateChallengeModal.jsx: XP range updated: YES/NO

### Phase 5: Verification searches
- Remaining /1000 patterns: [count]
- Remaining hardcoded tier names in dashboards: [count]
- Profile writers missing columns: [count]

### Files modified (complete list):
[list every file touched]

### Errors: NONE / [list]
```

**Commit:** `[engagement-align] Phase 5: verification complete`

---

## ROLLBACK

All changes are code-only (no DB). To revert:
```bash
git log --oneline -5
git revert HEAD~N..HEAD
```

---

## WHAT COMES NEXT

- **DB Migration Script** — Recalculate profiles.player_level, tier, xp_to_next_level for all existing rows using V2 curve. Carlos runs this in Supabase SQL Editor after both mobile and web are deployed.
- **CC-WEB-ENGAGEMENT-ALIGN-02** — Update XP_BY_SOURCE values to V2 (coordinate with mobile ALIGN-02)
- **CC-WEB-ENGAGEMENT-CATEGORIES-01** — Add engagement_category display to achievement catalog page
