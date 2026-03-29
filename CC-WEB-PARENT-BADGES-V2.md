# CC-WEB-PARENT-BADGES-V2
# Lynx Web Admin — Replace Legacy Parent Player Badges Tab with V2 Achievements
# STATUS: READY FOR CC EXECUTION

---

## STANDING RULES

1. **Read these files first:**
   - `src/pages/parent/ParentPlayerCardPage.jsx` — read the BadgesTab function fully (starts ~line 1047)
   - `src/pages/parent/ParentPlayerHero.jsx` — read the badgeDefinitions export
   - `src/pages/achievements/AchievementsCatalogPage.jsx` — study how it queries and renders V2 achievements (this is the pattern to follow)
   - `src/components/BadgeImage.jsx` — study how it renders icon_url images
2. **Only modify the files listed. Commit after each phase.**
3. **Format:** `[parent-badges-v2] Phase X: description`

---

## WHAT THIS SPEC DOES

The Badges tab on the parent player profile page (`/parent/player/[id]`) currently reads from the legacy `player_badges` table (10 hardcoded game badges with emoji). This spec replaces it with V2 achievement data from `player_achievements` + `achievements` tables — the same system that powers the achievements catalog page. After this fix, parents see their child's real badge art (578 badges with composites from Supabase Storage), earned/in-progress states, and progress bars.

---

## PHASE 1: Investigate the current BadgesTab

Read `src/pages/parent/ParentPlayerCardPage.jsx` fully. Report:

1. Where does BadgesTab start and end? (line numbers)
2. How does it query data? (which table, which columns, which filters)
3. What does it render for earned badges? (layout, grid, card structure)
4. What does it render for in-progress badges? (progress bars, targets)
5. What props does BadgesTab receive? (playerId, etc.)
6. Does the parent page also have access to `seasonId` or `organizationId`?
7. Are there other tabs on this page that query from `player_achievements` already? (Overview, Development?)

Also check: is there a `PlayerBadgesTab.jsx` in `src/components/v2/player/` that was already fixed in the badge-images spec? If so, could we just import and use that component instead of maintaining a separate implementation?

**Do NOT make changes. Report findings.**

---

## PHASE 2: Replace BadgesTab data source

In `src/pages/parent/ParentPlayerCardPage.jsx`, rewrite the BadgesTab function:

### 2A: Replace the query

Remove the `player_badges` query. Replace with two queries:

```javascript
// Query 1: All achievements available to this player (the full catalog)
const { data: allAchievements } = await supabase
  .from('achievements')
  .select('*')
  .eq('is_active', true)
  .in('target_role', ['player', 'all'])
  .order('display_order');

// Query 2: This player's earned achievements
const { data: earnedAchievements } = await supabase
  .from('player_achievements')
  .select('achievement_id, earned_at, season_id, stat_value_at_unlock')
  .eq('player_id', playerId);
```

Build an `earnedSet` from the earned data:
```javascript
const earnedSet = new Set((earnedAchievements || []).map(e => e.achievement_id));
const earnedMap = Object.fromEntries(
  (earnedAchievements || []).map(e => [e.achievement_id, e])
);
```

Split achievements into earned and in-progress:
```javascript
const earned = (allAchievements || []).filter(a => earnedSet.has(a.id));
const inProgress = (allAchievements || []).filter(a => !earnedSet.has(a.id));
```

### 2B: Remove the badgeDefinitions import

Remove the import of `badgeDefinitions` from `ParentPlayerHero.jsx` if it's only used by BadgesTab. If other parts of the page use it, leave the import but stop using it in BadgesTab.

**Commit:** `[parent-badges-v2] Phase 2: replace legacy player_badges query with V2 achievements`

---

## PHASE 3: Replace BadgesTab rendering

### 3A: Earned badges section

Render earned badges in a grid with actual badge art:

```jsx
<h4>Earned ({earned.length})</h4>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
  {earned.map(badge => (
    <div key={badge.id} style={{ textAlign: 'center' }}>
      {badge.icon_url ? (
        <img
          src={badge.icon_url}
          alt={badge.name}
          style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        <span style={{ fontSize: 40 }}>{badge.icon || '🏅'}</span>
      )}
      <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}>{badge.name}</p>
      <p style={{ fontSize: 11, color: '#6B7280' }}>{badge.rarity}</p>
      {earnedMap[badge.id]?.earned_at && (
        <p style={{ fontSize: 10, color: '#9CA3AF' }}>
          Earned {new Date(earnedMap[badge.id].earned_at).toLocaleDateString()}
        </p>
      )}
    </div>
  ))}
</div>
```

### 3B: In-progress badges section

Render in-progress badges with grayed-out art and progress bars:

```jsx
<h4 style={{ marginTop: 24 }}>In Progress</h4>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
  {inProgress.slice(0, 20).map(badge => {
    // Get player's current stat value for this badge's stat_key
    // (use playerStats if available from the page's existing data)
    const currentVal = playerStats?.[badge.stat_key] || 0;
    const target = badge.threshold || 1;
    const pct = Math.min(Math.round((currentVal / target) * 100), 100);
    
    return (
      <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12, border: '1px solid #E5E7EB' }}>
        {badge.icon_url ? (
          <img
            src={badge.icon_url}
            alt={badge.name}
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', filter: 'grayscale(70%) opacity(0.5)' }}
          />
        ) : (
          <span style={{ fontSize: 28, filter: 'grayscale(70%) opacity(0.5)' }}>{badge.icon || '🏅'}</span>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>{badge.name}</span>
            <span>{currentVal}/{target}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', marginTop: 4 }}>
            <div style={{ height: '100%', borderRadius: 3, backgroundColor: '#4BB9EC', width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  })}
</div>
```

### 3C: Match existing page styling

Adapt all the above to match the existing styling patterns in `ParentPlayerCardPage.jsx`. If the page uses Tailwind classes, use those instead of inline styles. If it uses a `styles` object or CSS modules, match that pattern. The layout above is a guide — the actual implementation should feel native to the page.

### 3D: Add V2 category filter (optional but nice)

If straightforward, add the engagement category filter pills (Stat, Milestone, Coach, Journey, Community) above the badge grid, using `ENGAGEMENT_CATEGORIES` from engagement-constants.js. This matches what we built on the achievements catalog page. If this adds too much complexity, skip it.

**Commit:** `[parent-badges-v2] Phase 3: render V2 badge art with earned/in-progress states`

---

## PHASE 4: Get player stats for progress bars

The in-progress badges need the player's current stat values to show progress (e.g., "7/25 kills").

Check if the page already has player stats loaded (from `player_season_stats` or similar). If yes, pass them to the BadgesTab. If no, add a query:

```javascript
const { data: statsData } = await supabase
  .from('player_season_stats')
  .select('*')
  .eq('player_id', playerId)
  .order('season_id', { ascending: false })
  .limit(1)
  .maybeSingle();
```

Map the stats object so badge `stat_key` values (e.g., `total_kills`, `total_aces`) resolve to actual numbers.

**Commit:** `[parent-badges-v2] Phase 4: wire player stats for progress bar accuracy`

---

## PHASE 5: Clean up legacy references

### 5A: Check if badgeDefinitions is used elsewhere

If `badgeDefinitions` in `ParentPlayerHero.jsx` is ONLY used by the old BadgesTab, it can stay but add a comment marking it as legacy. Do NOT delete it — other components might reference it.

### 5B: Check if player_badges query is used elsewhere on this page

If the legacy `player_badges` query in this file was ONLY for BadgesTab, remove it. If Overview or other tabs also use it, leave it.

### 5C: Verify no broken references

Make sure removing the old BadgesTab code doesn't break any imports, props, or shared state on the page.

**Commit:** `[parent-badges-v2] Phase 5: clean up legacy badge references`

---

## PHASE 6: Verification

```bash
# Confirm BadgesTab queries achievements, not player_badges
grep -n "player_badges\|player_achievements\|achievements" src/pages/parent/ParentPlayerCardPage.jsx | head -20

# Confirm icon_url rendering
grep -n "icon_url\|<img" src/pages/parent/ParentPlayerCardPage.jsx | head -10

# Confirm no build errors
# (run whatever build command the web project uses)
```

### Report:
```
## VERIFICATION REPORT: PARENT BADGES V2

### Data source: player_achievements + achievements (V2): YES/NO
### Legacy player_badges query removed from BadgesTab: YES/NO
### Badge art rendering (icon_url → img): YES/NO
### In-progress grayscale: YES/NO
### Progress bars with real stats: YES/NO
### Category filter pills: YES/NO/SKIPPED
### Build: PASS/FAIL
### Files modified: [list]
### Errors: NONE / [list]
```

**Commit:** `[parent-badges-v2] Phase 6: verification complete`
