# CC-ACHIEVEMENTS-MODERNIZE.md
## Grouping 4: Polish AchievementsCatalogPage + Related Components

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.**
3. **Do NOT flatten the gaming-inspired card styling.** The AchievementCard rarity gradients, shimmer effects, and glow effects are intentional and should be preserved.

---

## SITUATION ASSESSMENT

**This grouping is 98% done.** All 4 files already use `tc.*` theme classes, `useThemeClasses()`, and `useTheme()`. No extraction needed (all files under 500 lines). Only a handful of minor fixes.

| File | Lines | Theme Status | Fixes Needed |
|------|-------|-------------|-------------|
| `AchievementsCatalogPage.jsx` | 485 | ✅ Fully theme-aware | 1 divider gradient fix |
| `AchievementCard.jsx` | 462 | ✅ Fully theme-aware | None (bg-white/0→10 overlay is intentional) |
| `AchievementDetailModal.jsx` | 429 | ✅ Fully theme-aware | 1 modal overlay opacity fix |
| `TrackedAchievementsWidget.jsx` | 395 | ✅ Fully theme-aware | None |

**Total work: ~5 minutes. 2 line fixes.**

---

## FIXES

### Fix 1: AchievementsCatalogPage.jsx — Line 442

Category section divider uses hardcoded dark color:

```
Old: <div className="flex-1 h-px bg-gradient-to-r from-zinc-700 to-transparent" />
New: <div className={`flex-1 h-px bg-gradient-to-r ${isDark ? 'from-zinc-700' : 'from-slate-200'} to-transparent`} />
```

**Need to add `isDark`:** This file imports `useTheme` already but only destructures `colors`. Update:
```javascript
// Old:
const { colors } = useTheme()
// New:
const { colors, isDark } = useTheme()
```

### Fix 2: AchievementDetailModal.jsx — Line 125

Modal overlay uses `bg-black/70` — should match the design system standard of `bg-black/50`:

```
Old: className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
New: className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
```

---

## THAT'S IT

**Commit:**
```bash
git add -A && git commit -m "Grouping 4: Minor polish on Achievements components"
git push
```

---

## VERIFICATION CHECKLIST

- [ ] Navigate to Achievements page — grid loads
- [ ] Search filter works
- [ ] Category pills filter correctly
- [ ] Type dropdown filters correctly
- [ ] Earned Only / In Progress toggles work
- [ ] Click an achievement → detail modal opens with correct styling
- [ ] Modal hero section shows gradient (earned) or dark (locked)
- [ ] Track/Untrack buttons work
- [ ] TrackedAchievementsWidget renders on player dashboard
- [ ] All rarity tiers display correctly (common → legendary)
- [ ] Category divider line visible in both light and dark mode
