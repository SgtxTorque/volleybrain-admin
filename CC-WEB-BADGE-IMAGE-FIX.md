# CC-WEB-BADGE-IMAGE-FIX
# Lynx Web Admin — Fix: Render badge images from icon_url instead of emoji
# STATUS: READY FOR CC EXECUTION
# This is a quick targeted fix, not a full investigation+execution cycle.

---

## STANDING RULES

1. **Read `src/components/BadgeImage.jsx` fully before making changes.**
2. **Commit after each phase.** Format: `[badge-images] Phase X: description`

---

## WHAT THIS SPEC DOES

The achievement/badge cards currently render emoji characters (🏅) from the `icon` field instead of actual badge art from the `icon_url` field. All 578 badges now have `icon_url` populated in the database pointing to Supabase Storage composites. This spec makes the web render those images.

---

## PHASE 1: Comprehensive badge rendering audit

Find EVERY place in the web admin that renders a badge/achievement visual. Search broadly:

```bash
# Find all files that reference badge emoji, achievement icons, or badge rendering
grep -rn "icon.*emoji\|🏅\|🎖\|🏆\|🥇\|🥈\|🥉\|medal\|badge.*icon\|icon_url\|iconUrl\|BadgeImage\|achievement.*icon\|rarity.*color\|rarity.*glow\|badge.*image\|\.icon \|\[\"icon\"\]" --include="*.jsx" --include="*.js" src/ | grep -v node_modules | grep -v ".test."

# Also find all components that query achievements or player_achievements
grep -rn "from('achievements')\|from('player_achievements')\|from('user_achievements')" --include="*.jsx" --include="*.js" src/ | grep -v node_modules
```

For EVERY file found, report:
1. File path and line number
2. What it renders for the badge visual (emoji text? img tag? svg? nothing?)
3. Does it have access to `icon_url` from its data source?
4. What size is the badge rendered at?
5. Is this an earned badge display, a progress/locked badge, or a catalog/library view?

**Expected locations (check ALL of these plus any others found by grep):**
- `src/components/BadgeImage.jsx`
- `src/pages/achievements/AchievementCard.jsx`
- `src/pages/achievements/AchievementDetailModal.jsx`
- `src/pages/achievements/AchievementsCatalogPage.jsx`
- `src/components/v2/parent/BadgeShowcase.jsx`
- `src/components/v2/player/PlayerBadgesTab.jsx`
- `src/components/v2/player/PlayerStatsTab.jsx` (might show earned badges)
- `src/components/v2/coach/CoachEngagementTab.jsx` (might show team badges)
- `src/pages/roles/PlayerDashboard.jsx` (might show recent badges)
- `src/pages/roles/ParentDashboard.jsx` (might show child's badges)
- `src/pages/roles/CoachDashboard.jsx` (might show team engagement)
- `src/components/v2/HeroCard.jsx` (might show level/badge)
- `src/components/v2/MilestoneCard.jsx` (might show badges)
- `src/pages/parent/ParentPlayerHero.jsx`
- `src/pages/parent/PlayerProfilePage.jsx`
- `src/components/players/PlayerCardExpanded.jsx`
- `src/components/shared/WelcomeBanner.jsx`
- Any social card templates that include badges

Write a complete list of EVERY badge rendering location with its current behavior.

**Do NOT make changes yet. Just report findings.**

---

## PHASE 2: Fix BadgeImage.jsx

Modify `src/components/BadgeImage.jsx` to prioritize `icon_url` over emoji.

The component should:
1. Accept `iconUrl` (or `icon_url`) as a prop
2. If `iconUrl` is a valid URL string, render `<img src={iconUrl} />` with appropriate sizing, border-radius, and an `onError` fallback to the emoji
3. If `iconUrl` is not available, fall back to the existing emoji rendering

```jsx
// Pseudocode for the fix:
function BadgeImage({ icon, iconUrl, size = 48, rarity }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover' }}
        onError={(e) => { e.target.style.display = 'none'; /* show emoji fallback */ }}
      />
    );
  }
  // Existing emoji rendering
  return <span style={{ fontSize: size * 0.6 }}>{icon || '🏅'}</span>;
}
```

Adapt to match the component's existing patterns and styling.

**Commit:** `[badge-images] Phase 2: BadgeImage renders icon_url images with emoji fallback`

---

## PHASE 3: Fix AchievementCard.jsx

Modify `src/pages/achievements/AchievementCard.jsx` to pass `icon_url` to the badge rendering.

Find where the badge icon/emoji is rendered. The achievement data object has both `icon` (emoji) and `icon_url` (image URL). Make sure `icon_url` is passed to `BadgeImage` (or rendered directly as an `<img>` if BadgeImage isn't used here).

If AchievementCard renders the emoji inline (not via BadgeImage), change it to:

```jsx
{achievement.icon_url ? (
  <img
    src={achievement.icon_url}
    alt={achievement.name}
    style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
    onError={(e) => { e.target.onerror = null; e.target.textContent = achievement.icon || '🏅'; }}
  />
) : (
  <span>{achievement.icon || '🏅'}</span>
)}
```

Adapt sizing and styling to match the existing card layout.

**Commit:** `[badge-images] Phase 3: AchievementCard renders icon_url images`

---

## PHASE 4: Fix ALL remaining badge display components

Based on the Phase 1 audit, fix EVERY component that renders badge emoji instead of images. Apply the same pattern to each (render `icon_url` image if available, emoji fallback):

This includes but is not limited to:
1. `src/pages/achievements/AchievementDetailModal.jsx` — the detail/enlarged view
2. `src/components/v2/parent/BadgeShowcase.jsx` — parent dashboard badge display
3. `src/components/v2/player/PlayerBadgesTab.jsx` — player badges tab
4. **EVERY other component identified in Phase 1 that renders badge visuals**

For each, apply the same `icon_url` → `<img>` pattern with emoji fallback. If a component doesn't have `icon_url` in its data, check whether its Supabase query uses `select('*')` (which already includes it) or a specific column list (which may need `icon_url` added).

**Do not skip any location found in Phase 1.** The goal is that after this phase, there are ZERO places in the web admin that show emoji when an `icon_url` exists.

**Commit:** `[badge-images] Phase 4: all badge display components render icon_url images`

---

## PHASE 5: Fix progress/in-progress badges

The screenshot shows "IN PROGRESS" badges also showing emoji. These are unearned badges shown with progress bars. They should also show the badge art (perhaps slightly dimmed/grayed to indicate not-yet-earned).

Find where in-progress badge cards are rendered (likely in the same AchievementCard or a variant). Add the same `icon_url` image rendering, but with a CSS filter for unearned badges:

```jsx
<img
  src={achievement.icon_url}
  style={{
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: 'cover',
    filter: isEarned ? 'none' : 'grayscale(80%) opacity(0.5)',
  }}
/>
```

This makes unearned badges show the actual art but grayed out — much better than a generic emoji.

**Commit:** `[badge-images] Phase 5: in-progress badges show grayed icon_url images`

---

## PHASE 6: Verification

```bash
# Confirm no more hardcoded emoji-only rendering in achievement components
grep -n "icon_url\|iconUrl\|<img" src/pages/achievements/AchievementCard.jsx src/pages/achievements/AchievementDetailModal.jsx src/components/BadgeImage.jsx | head -20
```

### Report:
```
## VERIFICATION REPORT: WEB BADGE IMAGES
### BadgeImage.jsx: renders icon_url: YES/NO
### AchievementCard.jsx: renders icon_url: YES/NO
### AchievementDetailModal.jsx: renders icon_url: YES/NO
### BadgeShowcase.jsx: renders icon_url: YES/NO
### PlayerBadgesTab.jsx: renders icon_url: YES/NO
### In-progress grayscale: YES/NO
### Files modified: [list]
### Errors: NONE / [list]
```

**Commit:** `[badge-images] Phase 6: verification complete`
