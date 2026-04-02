# CC-WEB-BADGE-FINAL-FIX
# Lynx Web Admin — Fix: Last 3 Badge Display Issues
# STATUS: READY FOR CC EXECUTION

---

## STANDING RULES

1. **Only modify the 3 files listed below.**
2. **Commit after each phase.** Format: `[badge-fix] Phase X: description`
3. **Do NOT touch the LEGACY OK game badge files** (GameDetailModal, GameCompletionModal, PlayerComponents) — those are a separate feature using player_badges intentionally.

---

## PHASE 1: Fix PlayerCardExpanded.jsx

File: `src/components/players/PlayerCardExpanded.jsx`

**Current problem:** Queries `player_badges` (line 344), renders emoji via hardcoded `badgeDefinitions` (line 23). Used by TeamsPage, TeamWallPage, AttendancePage.

**Fix:** Replace the `player_badges` query with a `player_achievements` + `achievements` query, and render `icon_url` images instead of emoji.

### 1A: Replace the badge query

Find the `player_badges` query (~line 344). Replace with:

```javascript
const { data: earnedBadges } = await supabase
  .from('player_achievements')
  .select('achievement_id, earned_at, achievements(id, name, icon, icon_url, rarity, category)')
  .eq('player_id', playerId)
  .order('earned_at', { ascending: false })
  .limit(6);
```

### 1B: Replace the badge rendering

Find where badges are rendered using `badgeDefinitions` lookup and emoji. Replace with:

```jsx
{earnedBadges?.map(eb => {
  const badge = eb.achievements;
  if (!badge) return null;
  return (
    <div key={eb.achievement_id} style={{ textAlign: 'center' }}>
      {badge.icon_url ? (
        <img
          src={badge.icon_url}
          alt={badge.name}
          style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        <span style={{ fontSize: 28 }}>{badge.icon || '🏅'}</span>
      )}
      <p style={{ fontSize: 10, marginTop: 2 }}>{badge.name}</p>
    </div>
  );
})}
```

### 1C: Remove hardcoded badgeDefinitions import

If `badgeDefinitions` is imported from `ParentPlayerHero.jsx` or defined locally, remove the import/definition IF it's only used for this badge rendering. Check for other usages first.

**Commit:** `[badge-fix] Phase 1: PlayerCardExpanded uses V2 achievements with icon_url`

---

## PHASE 2: Fix PlayerDevelopmentCard.jsx

File: `src/pages/roster/PlayerDevelopmentCard.jsx`

**Current problem:** Queries `player_badges` (line 139), renders text-only badge names (line 407). Used in RosterManagerPage.

**Fix:** Replace with V2 achievements query and render badge art.

### 2A: Replace the badge query

Find the `player_badges` query (~line 139). Replace with:

```javascript
const { data: earnedBadges } = await supabase
  .from('player_achievements')
  .select('achievement_id, earned_at, achievements(id, name, icon, icon_url, rarity)')
  .eq('player_id', playerId)
  .order('earned_at', { ascending: false })
  .limit(8);
```

### 2B: Replace the badge rendering

Find where badge names are rendered as text (~line 407). Replace with image rendering:

```jsx
{earnedBadges?.map(eb => {
  const badge = eb.achievements;
  if (!badge) return null;
  return (
    <div key={eb.achievement_id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 8, marginBottom: 4 }}>
      {badge.icon_url ? (
        <img
          src={badge.icon_url}
          alt={badge.name}
          style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }}
        />
      ) : (
        <span style={{ fontSize: 16 }}>{badge.icon || '🏅'}</span>
      )}
      <span style={{ fontSize: 11 }}>{badge.name}</span>
    </div>
  );
})}
```

Adapt sizing to fit the development card layout.

**Commit:** `[badge-fix] Phase 2: PlayerDevelopmentCard uses V2 achievements with icon_url`

---

## PHASE 3: Fix JourneyCelebrations.jsx

File: `src/components/layout/JourneyCelebrations.jsx`

**Current problem:** Renders `badge.icon` as emoji text in celebration modal. No image support.

**Fix:** Add icon_url image rendering with emoji fallback.

Find where `badge.icon` is rendered (the celebration display). Replace with:

```jsx
{badge.icon_url ? (
  <img
    src={badge.icon_url}
    alt={badge.name || 'Badge'}
    style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }}
  />
) : (
  <span style={{ fontSize: 56 }}>{badge.icon || '🏅'}</span>
)}
```

Also check: does this component receive its badge data with `icon_url` included? If the data comes from a parent component's query, make sure that query includes `icon_url`. If it queries directly, make sure it selects `icon_url`.

**Commit:** `[badge-fix] Phase 3: JourneyCelebrations renders badge images in celebration modal`

---

## PHASE 4: Verification

```bash
# Confirm no more player_badges queries in fixed files
grep -n "player_badges" src/components/players/PlayerCardExpanded.jsx src/pages/roster/PlayerDevelopmentCard.jsx

# Confirm icon_url rendering in all 3 files
grep -n "icon_url" src/components/players/PlayerCardExpanded.jsx src/pages/roster/PlayerDevelopmentCard.jsx src/components/layout/JourneyCelebrations.jsx

# Confirm legacy game badge files are untouched
git diff --name-only src/components/games/GameDetailModal.jsx src/pages/schedule/GameCompletionModal.jsx src/components/players/PlayerComponents.jsx
```

### Report:
```
## VERIFICATION REPORT: BADGE FINAL FIX

### PlayerCardExpanded.jsx
- Queries player_achievements: YES/NO
- Renders icon_url images: YES/NO
- badgeDefinitions removed: YES/NO/KEPT (if used elsewhere)

### PlayerDevelopmentCard.jsx
- Queries player_achievements: YES/NO
- Renders icon_url images: YES/NO

### JourneyCelebrations.jsx
- Renders icon_url images: YES/NO
- Has access to icon_url data: YES/NO

### Legacy game badge files untouched: YES/NO
### Build: PASS/FAIL
### Errors: NONE / [list]
```

**Commit:** `[badge-fix] Phase 4: verification complete`
