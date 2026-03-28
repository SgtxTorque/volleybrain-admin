# CC-WEB-ENGAGEMENT-ALIGN-02-AND-CATEGORIES-01-EXECUTE
# Lynx Web Admin — Execute: Challenge Tiers V2 + Badge Category Framework
# STATUS: READY FOR CC EXECUTION
# NOTE: This combines two mobile specs into one web port since the web changes are smaller.
# Reference: LYNX-ENGAGEMENT-SYSTEM-V2.md (Sections 2 and 2.3)

---

## STANDING RULES

1. **Read these files first:**
   - `LYNX-ENGAGEMENT-SYSTEM-V2.md` in repo root (Sections 2 and 2.3)
   - `INVESTIGATION-WEB-ALIGN-01.md` in repo root (for context on web structure)
2. **Only modify the files explicitly listed in each phase.**
3. **Commit after each phase.** Format: `[engagement-web] Phase X: description`
4. **If a file doesn't match expectations, STOP and report back.**

---

## WHAT THIS SPEC DOES

Ports two mobile changes to web:
1. **ALIGN-02:** V2 challenge difficulty tiers (quick_win/standard/grind/team_challenge/boss_challenge) with XP ranges
2. **CATEGORIES-01:** V2 engagement category constants + type awareness (the DB column already exists)

---

## PHASE 1: Add V2 challenge difficulty config to engagement-constants.js

Modify `src/lib/engagement-constants.js`.

**Add these new exports** after the existing `STAT_OPTIONS` export at the bottom of the file:

```javascript
/** V2 Challenge Difficulty Tiers — coach picks tier, adjusts XP within range */
export const DIFFICULTY_CONFIG = {
  quick_win: {
    label: 'Quick Win',
    color: '#10B981',
    bgColor: '#10B98115',
    xpMin: 15,
    xpMax: 35,
    xpDefault: 25,
    description: '10 minutes or less',
  },
  standard: {
    label: 'Standard',
    color: '#3B82F6',
    bgColor: '#3B82F615',
    xpMin: 35,
    xpMax: 75,
    xpDefault: 50,
    description: 'Real effort across a practice or day',
  },
  grind: {
    label: 'Grind',
    color: '#F59E0B',
    bgColor: '#F59E0B15',
    xpMin: 75,
    xpMax: 150,
    xpDefault: 100,
    description: 'Sustained effort across days or a week',
  },
  team_challenge: {
    label: 'Team Challenge',
    color: '#8B5CF6',
    bgColor: '#8B5CF615',
    xpMin: 50,
    xpMax: 100,
    xpDefault: 75,
    description: 'Whole team works together',
  },
  boss_challenge: {
    label: 'Boss Challenge',
    color: '#EF4444',
    bgColor: '#EF444415',
    xpMin: 150,
    xpMax: 300,
    xpDefault: 200,
    description: 'Season-defining accomplishment',
  },
}

/** V2 Engagement Categories — the 5 parent categories for all badges */
export const ENGAGEMENT_CATEGORIES = {
  stat:      { label: 'Stat Badges',      icon: 'BarChart3',       color: '#EF4444', description: 'Auto-earned from game performance' },
  milestone: { label: 'Milestones',        icon: 'Award',           color: '#6366F1', description: 'Auto-earned from showing up' },
  coach:     { label: 'Coach Badges',      icon: 'ClipboardList',   color: '#F59E0B', description: 'Coach-awarded and challenge completion' },
  journey:   { label: 'Journey Badges',    icon: 'Map',             color: '#10B981', description: 'Earned from skill path progress' },
  community: { label: 'Community',         icon: 'Users',           color: '#EC4899', description: 'Social actions and discovery' },
}
```

Note: Icon names use Lucide React convention (PascalCase) for web, vs Ionicons convention for mobile.

**Commit:** `[engagement-web] Phase 1: add V2 difficulty tiers and engagement categories to constants`

---

## PHASE 2: Update challenge service with difficulty support

Modify `src/lib/challenge-service.js`.

### Step 2A: Add difficulty import

Add to the existing import from engagement-constants:
```javascript
import { getLevelFromXP, XP_BY_SOURCE, DIFFICULTY_CONFIG } from './engagement-constants'
```

### Step 2B: Add difficulty to create function

Find the `createChallenge()` function. It accepts a params object. The function should now also accept a `difficulty` field and write it to the `coach_challenges` insert.

Find the `.insert({...})` call inside `createChallenge()`. Add `difficulty: params.difficulty || null` to the inserted object.

### Step 2C: Add XP validation

Before the insert, add tier-based XP clamping:

```javascript
if (params.difficulty && DIFFICULTY_CONFIG[params.difficulty]) {
  const tierConfig = DIFFICULTY_CONFIG[params.difficulty]
  params.xpReward = Math.min(Math.max(params.xpReward, tierConfig.xpMin), tierConfig.xpMax)
}
```

**Commit:** `[engagement-web] Phase 2: difficulty field in challenge service with XP validation`

---

## PHASE 3: Update CreateChallengeModal with tier picker

Modify `src/components/engagement/CreateChallengeModal.jsx`.

### Step 3A: Add imports

```javascript
import { DIFFICULTY_CONFIG } from '../../lib/engagement-constants'
```

### Step 3B: Add difficulty state

Add to the component's state:
```javascript
const [difficulty, setDifficulty] = useState('standard')
```

### Step 3C: Add tier picker UI

Add a row of 5 tier pills BEFORE the XP reward input. Each pill shows the tier label with its color. When selected:
1. Set `difficulty` state
2. Set `xpReward` to the tier's `xpDefault`
3. Update the XP input placeholder/label to show the tier's range

Style the pills to match the existing form styling in the modal — likely horizontal flex row with rounded chips, active state with the tier's color as background.

### Step 3D: Update XP clamp

Find the existing XP clamp (currently `Math.min(Math.max(Number(xpReward) || 50, 25), 500)`).

Replace with:
```javascript
const tierConfig = DIFFICULTY_CONFIG[difficulty]
const clampedXp = Math.min(Math.max(Number(xpReward) || tierConfig.xpDefault, tierConfig.xpMin), tierConfig.xpMax)
```

### Step 3E: Update XP field label

Change the label from "XP Reward (25–500)" to dynamically show the tier's range:
```javascript
`XP Reward (${tierConfig.xpMin}–${tierConfig.xpMax})`
```

### Step 3F: Pass difficulty to service

Find the `createChallenge()` call. Add `difficulty` to the params object.

**Commit:** `[engagement-web] Phase 3: tier picker in CreateChallengeModal with dynamic XP ranges`

---

## PHASE 4: Update achievements catalog with V2 category filter

Modify `src/pages/achievements/AchievementsCatalogPage.jsx`.

### Step 4A: Add import

```javascript
import { ENGAGEMENT_CATEGORIES } from '../../lib/engagement-constants'
```

### Step 4B: Add filter state

```javascript
const [engagementFilter, setEngagementFilter] = useState(null)
```

### Step 4C: Add V2 category filter row

Add a row of 6 filter pills (All + 5 categories) ABOVE any existing category/rarity filters. Each pill shows the category label with its color. "All" clears the filter.

### Step 4D: Apply filter to badge list

Where achievements are filtered for display, add:
```javascript
const filtered = engagementFilter
  ? achievements.filter(a => a.engagement_category === engagementFilter)
  : achievements
```

Make sure the Supabase query includes `engagement_category` — if it uses `select('*')`, it already does.

### Step 4E: Preserve existing filters

The existing rarity and subcategory filters should still work within the selected V2 category. Apply `engagementFilter` first, then existing filters on top.

**Commit:** `[engagement-web] Phase 4: V2 engagement category filter on achievements catalog`

---

## PHASE 5: Update hardcoded XP strings in CreateChallengeModal

The investigation found the XP range label "25–500" in CreateChallengeModal. This was already addressed in Phase 3 (dynamic range from tier config). Verify it's gone.

Also check if there are any other hardcoded difficulty references in the web codebase that need updating.

```bash
grep -rn "'easy'\|'medium'\|'hard'\|'legendary'" --include="*.jsx" --include="*.js" src/ | grep -v node_modules | grep -v engagement-constants
```

If any are found in challenge-related files, update them to use V2 tier names. If they're in unrelated files, leave them.

**Commit (if changes):** `[engagement-web] Phase 5: cleanup hardcoded difficulty references`

---

## PHASE 6: Verification

```bash
# Confirm DIFFICULTY_CONFIG and ENGAGEMENT_CATEGORIES in constants
grep -n "DIFFICULTY_CONFIG\|ENGAGEMENT_CATEGORIES" src/lib/engagement-constants.js | head -10

# Confirm difficulty in challenge service
grep -n "difficulty" src/lib/challenge-service.js | head -10

# Confirm tier picker in modal
grep -n "difficulty\|DIFFICULTY_CONFIG" src/components/engagement/CreateChallengeModal.jsx | head -10

# Confirm category filter on achievements page
grep -n "engagement_category\|ENGAGEMENT_CATEGORIES\|engagementFilter" src/pages/achievements/AchievementsCatalogPage.jsx | head -10
```

### Report

```
## VERIFICATION REPORT: WEB ALIGN-02 + CATEGORIES-01

### Phase 1: Constants
- DIFFICULTY_CONFIG: EXISTS, entries: [count]
- ENGAGEMENT_CATEGORIES: EXISTS, entries: [count]

### Phase 2: Challenge service
- difficulty in insert: YES/NO
- XP validation: YES/NO

### Phase 3: CreateChallengeModal
- Tier picker: ADDED/MISSING
- Dynamic XP range: YES/NO
- difficulty passed to service: YES/NO

### Phase 4: Achievements catalog
- V2 category pills: ADDED/MISSING
- engagementFilter state: EXISTS/MISSING
- Filter applied to list: YES/NO

### Phase 5: Hardcoded cleanup
- Remaining old difficulty strings: [count]

### Files modified:
[list all]

### Errors: NONE / [list]
```

**Commit:** `[engagement-web] Phase 6: verification complete`
