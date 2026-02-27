# CC-STANDINGS-LEADERBOARDS-MODERNIZE.md
## Grouping 3: Modernize TeamStandingsPage + SeasonLeaderboardsPage

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.** Do NOT change Supabase queries, state logic, props, or business logic.
3. **Git commit after each file.** Test `npm run dev` after each.
4. **No extraction needed.** Both files are under 660 lines and have clean component structures.

---

## SITUATION ASSESSMENT

| File | Lines | Theme Status | Work Required |
|------|-------|-------------|---------------|
| `TeamStandingsPage.jsx` (standings/) | 559 | **95% done** — uses `tc.*` everywhere. Only 1 hardcoded `border-slate-700` and 2 `bg-slate-700` in loading skeleton. | Minimal — fix 3 lines + verify |
| `SeasonLeaderboardsPage.jsx` (leaderboards/) | 649 | **0% done** — hardcoded LIGHT mode. All `bg-white`, `text-slate-800`, `border-slate-200`. No `tc.*`, no `isDark`, no `useTheme`. | Full conversion to theme-aware |

**Also:** There is a duplicate file at `src/pages/stats/SeasonLeaderboardsPage.jsx` (identical content). Only `src/pages/leaderboards/SeasonLeaderboardsPage.jsx` is imported (via `MainApp.jsx` line 67). **Delete the duplicate** at `src/pages/stats/SeasonLeaderboardsPage.jsx`.

---

## DESIGN SYSTEM REFERENCE

Same patterns as CC-SCHEDULE-RESTYLE.md. Key patterns for these pages:

```
Page background:     ${tc.pageBg} → isDark ? 'bg-slate-900' : 'bg-slate-50'
Card:                ${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm
Card alt (inner):    ${tc.cardBgAlt} → isDark ? 'bg-slate-900' : 'bg-slate-50'
Primary text:        ${tc.text}
Secondary text:      ${tc.textMuted}
Border:              ${tc.border}
Input:               ${tc.input}
```

---

## EXECUTION PLAN

### Step 0: Delete duplicate file

```bash
rm src/pages/stats/SeasonLeaderboardsPage.jsx
```

If the `src/pages/stats/` directory is now empty, remove it too:
```bash
rmdir src/pages/stats/ 2>/dev/null
```

**Commit:**
```bash
git add -A && git commit -m "Remove duplicate SeasonLeaderboardsPage from stats/"
```

---

### Step 1: Fix TeamStandingsPage.jsx (3 lines)

This page is already 95% compliant. Only three fixes needed:

**Fix 1 — Line 164/166:** Loading skeleton uses hardcoded `bg-slate-700`
```
Old: <div className="h-8 bg-slate-700 rounded w-48" />
New: <div className={`h-8 rounded w-48 ${tc.cardBgAlt}`} />
```
```
Old: {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-700 rounded-2xl" />)}
New: {[1,2,3,4].map(i => <div key={i} className={`h-32 rounded-2xl ${tc.cardBgAlt}`} />)}
```

**Fix 2 — Line 300:** Stats grid border uses hardcoded `border-slate-700`
```
Old: <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-t border-slate-700">
New: <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-t ${tc.border}`}>
```

**Fix 3 — Line 234:** Team dropdown hover uses `hover:bg-slate-700/50`
```
Old: className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition ${...}`}
New: className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'} ${...}`}
```

For Fix 3, add `const { isDark } = useTheme()` and `import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'` (update existing import to include `useTheme`).

**Also in StandingsWidget (line 511-512):** Same loading skeleton fix:
```
Old: <div className="h-6 bg-slate-700 rounded w-32 mb-4" />
     <div className="h-12 bg-slate-700 rounded w-24" />
New: <div className={`h-6 rounded w-32 mb-4 ${tc.cardBgAlt}`} />
     <div className={`h-12 rounded w-24 ${tc.cardBgAlt}`} />
```

**Commit:**
```bash
git add -A && git commit -m "Fix 3 remaining hardcoded theme issues in TeamStandingsPage"
```

---

### Step 2: Full Restyle of SeasonLeaderboardsPage.jsx

This page needs a complete theme-awareness conversion. It's currently hardcoded light mode.

**Step 2a: Add imports and hooks**

Add to imports:
```javascript
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
```

Inside the `SeasonLeaderboardsPage` function, add:
```javascript
const tc = useThemeClasses()
const { isDark } = useTheme()
```

**Step 2b: Convert LeaderboardRow component (lines ~150-211)**

This component takes props but doesn't have theme context. Two options:
- **Option A:** Pass `isDark` and `tc` as props from the parent
- **Option B:** Add `useTheme`/`useThemeClasses` hooks directly

**Use Option B** — add the hooks directly since each component renders independently:

```javascript
function LeaderboardRow({ player, rank, statValue, isPercentage, color, onClick }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  // ... rest of component
```

Then convert:
| Old | New |
|-----|-----|
| `bg-white hover:bg-slate-50 rounded-2xl border border-slate-200` | `${tc.cardBg} border ${tc.border} rounded-2xl ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}` |
| `text-slate-800 font-semibold` | `${tc.text} font-semibold` |
| `text-xs text-slate-500` | `text-xs ${tc.textMuted}` |
| `bg-slate-200` (avatar fallback) | `${isDark ? 'bg-slate-700' : 'bg-slate-200'}` |
| `text-xs font-bold text-slate-500` (avatar text) | `text-xs font-bold ${tc.textMuted}` |
| `text-slate-400` (chevron icon) | `${tc.textMuted}` |

**Step 2c: Convert CategoryTab component (lines ~216-231)**

Add hooks, then:
| Old | New |
|-----|-----|
| `bg-white text-slate-600 hover:bg-slate-50 border border-slate-200` (inactive) | `${tc.cardBg} border ${tc.border} ${isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-slate-50'}` |
| `text-white shadow-lg` (active) | Keep — active uses the category's color as background, white text works on colored bg |

**Step 2d: Convert MiniLeaderboardCard component (lines ~236-308)**

Add hooks, then:
| Old | New |
|-----|-----|
| `bg-white rounded-2xl border border-slate-200` | `${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm` |
| `font-semibold text-slate-800` | `font-semibold ${tc.text}` |
| `text-xs text-slate-500` | `text-xs ${tc.textMuted}` |
| `hover:bg-slate-50 rounded-lg` (list hover) | `${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} rounded-lg` |
| `bg-slate-200` (avatar fallback) | `${isDark ? 'bg-slate-700' : 'bg-slate-200'}` |
| `text-xs font-bold text-slate-500` (avatar text) | `text-xs font-bold ${tc.textMuted}` |
| `font-medium text-slate-800 text-sm` | `font-medium ${tc.text} text-sm` |
| `text-sm text-slate-400` (no data) | `text-sm ${tc.textMuted}` |
| `text-indigo-600 hover:bg-indigo-50 border-t border-slate-200` (view all btn) | `text-[var(--accent-primary)] ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-indigo-50'} border-t ${tc.border}` |

**Step 2e: Convert main page render**

| Old | New |
|-----|-----|
| `bg-slate-100 overflow-y-auto` (page bg) | `${tc.pageBg} overflow-y-auto` |
| `bg-slate-100` (loading bg) | `${tc.pageBg}` |
| `border-4 border-indigo-500` (loading spinner) | `border-4 border-[var(--accent-primary)]` — keep consistent |
| **Sticky header:** `bg-white border-b border-slate-200` | `${tc.cardBg} border-b ${tc.border}` |
| `text-2xl font-bold text-slate-800` | `text-2xl font-bold ${tc.text}` |
| `text-slate-500` | `${tc.textMuted}` |
| **Select filter:** `px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm` | `px-3 py-2 rounded-xl text-sm ${tc.input}` |
| **View toggle container:** `bg-slate-100 rounded-xl p-1` | `${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'} rounded-xl p-1` |
| **View toggle active:** `bg-white shadow text-slate-800` | `${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-800'} shadow` |
| **View toggle inactive:** `text-slate-500` | `${tc.textMuted}` |
| **Full view category header:** `bg-white rounded-2xl p-6 border-2` | `${tc.cardBg} rounded-2xl p-6 border-2` |
| `text-2xl font-bold text-slate-800` | `text-2xl font-bold ${tc.text}` |
| **Empty state:** `bg-white rounded-2xl p-12 text-center border border-slate-200` | `${tc.cardBg} rounded-2xl p-12 text-center border ${tc.border}` |
| `text-slate-300` (empty icon) | `${tc.textMuted}` |
| `text-slate-500`, `text-slate-400` | `${tc.textMuted}` |
| `text-slate-600 font-medium` | `${tc.text} font-medium` |

**Step 2f: Season MVPs gradient banner (line 570)**

This is the colored gradient banner at the bottom. It uses `bg-gradient-to-r from-indigo-500 to-purple-600 text-white`. This is **intentionally styled** as a feature highlight card.

**Keep the gradient and white text.** It's a "feature card" pattern that works in both themes because it has its own background. Just update the inner panel pattern:
```
Old: bg-white/10 rounded-xl p-4
Keep as-is — white/10 on a gradient background works in both themes.
```

**Step 2g: RankBadge component (if not already theme-aware)**

The medal badges (`🥇🥈🥉`) use white text on colored backgrounds. These are fine in both themes — **keep as-is**.

**Commit:**
```bash
git add -A && git commit -m "Full theme conversion of SeasonLeaderboardsPage to design system"
```

---

### Step 3: Final commit & push

```bash
git add -A && git commit -m "Grouping 3 complete: Standings + Leaderboards modernized"
git push
```

---

## VERIFICATION CHECKLIST

### TeamStandingsPage
- [ ] Loading skeleton uses theme-aware colors (not hardcoded bg-slate-700)
- [ ] Stats grid border adapts to theme
- [ ] Team dropdown hover works in both modes
- [ ] Season record card displays correctly
- [ ] Recent results cards show win/loss colors
- [ ] Form guide row renders
- [ ] StandingsWidget also renders correctly on dashboards

### SeasonLeaderboardsPage
- [ ] Page background is slate-50 (light) / slate-900 (dark)
- [ ] Sticky header matches design system
- [ ] Grid view shows mini cards with correct styling in both themes
- [ ] Full list view displays rankings correctly
- [ ] Category tabs switch correctly
- [ ] Team filter dropdown works
- [ ] View toggle (Grid/Full) works
- [ ] Player avatar fallbacks show correctly
- [ ] Season MVPs gradient banner displays at bottom
- [ ] Empty states render with appropriate text colors
- [ ] Click player navigates (if wired up)

### Both themes
- [ ] Light mode: white cards on slate-50 background
- [ ] Dark mode: slate-800 cards on slate-900 background
- [ ] No white text on white, no dark text on dark

---

## NOTE: Quick win

This is one of the fastest groupings — StandingsPage only needs 3 line fixes, and LeaderboardsPage is a straightforward "add theme hooks + replace hardcoded light colors" conversion. No extraction needed. **Should take CC one session, 15-30 minutes.**
