# CC-CONSOLE-400-CLEANUP.md
## Fix All Console 400 Errors — Column Name Mismatches + Ambiguous Joins

**Read `CLAUDE.md` before writing ANY code.**
**This is a cleanup pass — fix ONLY what's listed below. Do NOT refactor or restyle anything.**

---

## FIX 1: player_badges — `earned_at` → `awarded_at`

The DB column is `awarded_at`, but many files reference `earned_at`.

**Every instance must be changed. Search-and-verify after each file.**

### 1A. `src/components/players/PlayerCardExpanded.jsx`
- **Line ~347:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`
- **Line ~1046:** `b.earned_at ? new Date(b.earned_at)` → `b.awarded_at ? new Date(b.awarded_at)`

### 1B. `src/pages/parent/ParentPlayerCardPage.jsx`
- **Line ~368:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`

### 1C. `src/components/player/PlayerCenterFeed.jsx`
- **Line ~157:** `b.earned_at || b.created_at` → `b.awarded_at || b.created_at`

### 1D. `src/components/widgets/parent/ChildAchievementsWidget.jsx`
- **Line ~39:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`

### 1E. `src/components/widgets/player/MyBadgesWidget.jsx`
- **Line ~48:** `earned_at,` → `awarded_at,`
- **Line ~54:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`
- **Line ~133:** `formatDate(recentBadge.earned_at)` → `formatDate(recentBadge.awarded_at)`

### 1F. `src/lib/achievement-engine.js`
- **Line ~44:** `earned_at: now,` → `awarded_at: now,`
- **Line ~190:** `.gt('earned_at', lastSeen)` → `.gt('awarded_at', lastSeen)`
- **Line ~191:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`

### 1G. `src/lib/shoutout-service.js`
- **Line ~213:** `earned_at: now,` → `awarded_at: now,`

### 1H. `src/pages/achievements/AchievementCard.jsx`
- **Lines ~113-114:** `earnedData?.earned_at` → `earnedData?.awarded_at` (both lines)

### 1I. `src/pages/achievements/AchievementDetailModal.jsx`
- **Lines ~116-117:** `earnedData?.earned_at` → `earnedData?.awarded_at` (both lines)

### 1J. `src/pages/achievements/TrackedAchievementsWidget.jsx`
- **Line ~246:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`

### 1K. `src/pages/roles/PlayerDashboard.jsx`
- **Line ~235:** `.order('earned_at', { ascending: false })` → `.order('awarded_at', { ascending: false })`

### 1L. `src/pages/schedule/GameCompletionModal.jsx`
- **Line ~329:** `earned_at: new Date().toISOString()` → `awarded_at: new Date().toISOString()`

### Verification
After all changes, do a project-wide search:
```bash
grep -rn "earned_at" src/ | grep -v node_modules | grep -v ".map"
```
**This should return ZERO results.** If any remain, fix them.

---

## FIX 2: player_coach_notes — `note` → `content`

The DB column is `content`, not `note`.

### 2A. `src/pages/parent/ParentPlayerCardPage.jsx`
- **Line ~412:** Change the select:
```js
// OLD:
.select('note, note_type, created_at')
// NEW:
.select('content, note_type, created_at')
```
- **Line ~837:** Change the rendering:
```js
// OLD:
{note.note}
// NEW:
{note.content}
```

### Verification
```bash
grep -n "\.note\b" src/pages/parent/ParentPlayerCardPage.jsx
```
Should only return lines that are NOT about player_coach_notes data (e.g., variable names are OK, but `note.note` is not).

---

## FIX 3: game_player_stats → schedule_events — Ambiguous FK

The `game_player_stats` table has multiple FK relationships to `schedule_events`. PostgREST can't pick one automatically. We must specify `!event_id` to disambiguate.

### 3A. `src/components/players/PlayerCardExpanded.jsx`
- **Line ~374:**
```js
// OLD:
.select('*, schedule_events(event_date, opponent_name, our_score, their_score)')
// NEW:
.select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
```

### 3B. `src/pages/parent/ParentPlayerCardPage.jsx`
- **Line ~377:**
```js
// OLD:
.select('*, schedule_events(event_date, opponent_name, our_score, their_score)')
// NEW:
.select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
```

### 3C. `src/pages/roster/PlayerDevelopmentCard.jsx`
- **Line ~89:**
```js
// OLD:
.select('*, schedule_events(event_date, opponent_name, our_score, their_score)')
// NEW:
.select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
```

### 3D. `src/components/widgets/player/MyBadgesWidget.jsx`
- **Line ~50:** If this line joins to schedule_events, add the `!event_id` hint:
```js
// OLD:
event:schedule_events(id, event_date, opponent_name)
// NEW:
event:schedule_events!event_id(id, event_date, opponent_name)
```

---

## FIX 4: TopPlayerWidget — Bare column names → `total_` prefix

The `player_season_stats` table uses `total_kills`, `total_aces`, etc. — not bare `kills`, `aces`.

### 4A. `src/components/widgets/coach/TopPlayerWidget.jsx`

Add a column mapping and use it for both the ORDER BY and the stat reading:

```js
// FIND the statCategories array (around line 20) and ADD a columnMap right after it:
const columnMap = {
  points: 'total_points',
  kills: 'total_kills',
  aces: 'total_aces',
  assists: 'total_assists',
  digs: 'total_digs',
  blocks: 'total_blocks',
};

// FIND the .order() call (around line 54):
// OLD:
.order(statCategory, { ascending: false })
// NEW:
.order(columnMap[statCategory] || statCategory, { ascending: false })

// FIND the getCurrentStat function (around line 72):
// OLD:
const value = topPlayer[statCategory] || 0;
// NEW:
const value = topPlayer[columnMap[statCategory]] || topPlayer[statCategory] || 0;
```

---

## FIX 5: PlayerCardExpanded SkillBar color — amber → brand blue

### 5A. `src/components/players/PlayerCardExpanded.jsx`
- **Line ~135:** Find the SkillBar background color:
```js
// OLD:
backgroundColor: '#F59E0B'
// NEW:
backgroundColor: '#4BB9EC'
```

---

## FINAL VERIFICATION

After all fixes, run:
```bash
npm run dev
```

Then open the browser console and navigate to:
1. **Coach Dashboard** → should load with NO 400 errors from TopPlayerWidget
2. **Roster Manager** → Evaluate a player → Save → click player name → PlayerCardExpanded modal opens
   - Check: NO 400 errors for player_badges, player_coach_notes, game_player_stats
   - Check: SkillBar color is blue (#4BB9EC), not amber
   - Check: Badges section loads (or shows empty state gracefully)
   - Check: Recent Games section loads (or shows empty state)
3. **Parent view** → My Players → click player card
   - Check: NO 400 errors
   - Check: Coach Feedback section in Development tab renders correctly
   - Check: Badges load correctly

**Expected console output:** Zero 400 (Bad Request) errors from Supabase.

The only acceptable console warnings after this fix are:
- React Router future flag warnings (cosmetic, not errors)
- The `<meta name="apple-mobile-web-app-capable">` deprecation (cosmetic)

```bash
git add -A && git commit -m "Fix all console 400 errors: earned_at→awarded_at, note→content, FK hints, column mapping, SkillBar color" && git push
```
