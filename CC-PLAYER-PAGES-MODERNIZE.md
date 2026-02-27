# CC-PLAYER-PAGES-MODERNIZE.md
## Grouping 5: Modernize PlayerProfilePage + ParentPlayerCardPage

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.** Do NOT change Supabase queries, state logic, waiver signing flow, or form validation.
3. **Git commit after each file.** Test `npm run dev` after each.
4. **No extraction needed.** Both files have reasonable structure already.

---

## SITUATION ASSESSMENT

| File | Lines | Theme Status | Work |
|------|-------|-------------|------|
| `PlayerProfilePage.jsx` (parent/) | 1,326 | **80% done** — main content uses `tc.*` + `isDark` throughout. Two waiver modals (lines 1195-1321) are hardcoded light. | Convert waiver modals + minor input standardization |
| `ParentPlayerCardPage.jsx` (parent/) | 735 | **90% done** — uses `tc.*` + `isDark` everywhere. Inner panels use `isDark ? 'bg-slate-800/50' : 'bg-slate-50'` pattern consistently. | Standardize to `tc.cardBgAlt` + minor fixes |

**Both pages already handle dark/light mode for their main content.** The work is mostly standardizing patterns and fixing the waiver modals.

---

## DESIGN SYSTEM REFERENCE

Same patterns as previous groupings. Key additions for these pages:

### Inner Panels (nested sections inside cards)
```
Standard: ${tc.cardBgAlt} → isDark ? 'bg-slate-900' : 'bg-slate-50'
Current (both files): isDark ? 'bg-slate-800/50' : 'bg-slate-50'
```
The `bg-slate-800/50` pattern is close but slightly different from `tc.cardBgAlt`. For consistency, convert to `tc.cardBgAlt` where possible.

### Form Inputs
Both files already use a consistent input pattern:
```
${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border ${tc.border} rounded-xl
```
This is acceptable but could be simplified to `${tc.input} rounded-xl`. Use whichever the file already uses more — don't mix patterns within a single file.

### Waiver Modals (special case)
Waiver modals display legal documents. They intentionally use a "document" aesthetic (serif fonts, white paper look). In light mode, keep them white. In dark mode, they should use a slightly lighter dark background to maintain readability — `${isDark ? 'bg-slate-800' : 'bg-white'}`.

---

## EXECUTION PLAN

### Step 1: PlayerProfilePage.jsx — Waiver Modal Conversion

The main page content (tabs, forms, info panels) is already theme-aware. Only the two waiver modals at the bottom need conversion.

#### Fix 1a: View Waiver Modal (lines ~1196-1229)

| Line | Old | New |
|------|-----|-----|
| 1197 | `bg-black/60` | `bg-black/50 backdrop-blur-sm` |
| 1198 | `bg-white rounded-2xl` | `${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl` |
| 1200 | `bg-slate-100 rounded-t-2xl` | `${isDark ? 'bg-slate-900' : 'bg-slate-100'} rounded-t-2xl` |
| 1201 | `text-sm font-medium text-slate-700` | `text-sm font-medium ${tc.text}` |
| 1202 | `text-lg text-slate-500 hover:text-slate-800` | `text-lg ${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-800'}` |
| 1208 | `text-lg font-bold text-slate-900` | `text-lg font-bold ${tc.text}` |
| 1212 | `text-base font-bold text-slate-800 text-center mb-4` | `text-base font-bold ${tc.text} text-center mb-4` |
| 1214 | `border border-slate-200` | `border ${tc.border}` |
| 1219 | `border border-slate-200` | `border ${tc.border}` |
| 1222 | `text-slate-700 leading-relaxed` | `${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed` |

#### Fix 1b: Sign Waiver Modal (lines ~1232-1321)

| Line | Old | New |
|------|-----|-----|
| 1234 | `bg-black/60` | `bg-black/50 backdrop-blur-sm` |
| 1235 | `bg-white rounded-2xl` | `${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl` |
| 1244 | `text-lg font-bold text-slate-900` | `text-lg font-bold ${tc.text}` |
| 1245 | `text-xs text-slate-500` | `text-xs ${tc.textMuted}` |
| 1248 | `text-lg text-slate-400 hover:text-slate-800` | `text-lg ${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-800'}` |
| 1254 | `border border-slate-200` | `border ${tc.border}` |
| 1259 | `border border-slate-200` | `border ${tc.border}` |
| 1262 | `text-slate-700 leading-relaxed` | `${isDark ? 'text-slate-300' : 'text-slate-700'} leading-relaxed` |
| 1267 | `text-slate-400 italic` | `${tc.textMuted} italic` |
| 1272 | `bg-slate-50 border-t border-slate-200` | `${isDark ? 'bg-slate-900' : 'bg-slate-50'} border-t ${tc.border}` |
| 1274 | `border border-slate-200 bg-white` (checkbox label) | `border ${tc.border} ${isDark ? 'bg-slate-800/50' : 'bg-white'}` |
| 1277 | `text-sm text-slate-700` | `text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}` |
| 1285 | `text-xs font-bold uppercase tracking-wider text-slate-500` | `text-xs font-bold uppercase tracking-wider ${tc.textMuted}` |
| 1287 | `border border-slate-300 text-sm text-slate-900 bg-white` | `border ${tc.border} text-sm ${tc.text} ${isDark ? 'bg-slate-700' : 'bg-white'}` |
| 1294 | `bg-emerald-50 border border-emerald-200` | `${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border` |
| 1295 | `text-[11px] text-emerald-700` | `text-[11px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}` |
| 1306 | `border border-slate-300 text-slate-700` | `border ${tc.border} ${tc.text}` |

**Keep these as-is** — they work in both themes:
- The team-color accent bars (`style={{ backgroundColor: teamColor }}`)
- The serif font on waiver content (`style={{ fontFamily: 'Georgia, serif' }}`)
- The sign button with team color background

**Commit:**
```bash
git add -A && git commit -m "Convert PlayerProfilePage waiver modals to theme-aware"
```

---

### Step 2: PlayerProfilePage.jsx — Standardize Inner Panels

Throughout the file, the pattern `${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}` appears ~18 times. Replace all with `${tc.cardBgAlt}` for consistency.

**Search and replace:**
```
Old: ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}
New: ${tc.cardBgAlt}
```

This is a safe bulk find-and-replace since the pattern is identical everywhere. Verify `tc.cardBgAlt` resolves to `isDark ? 'bg-slate-900' : 'bg-slate-50'` — the dark value changes from `bg-slate-800/50` to `bg-slate-900` which is a subtle difference. Check it looks good visually.

**Commit:**
```bash
git add -A && git commit -m "Standardize PlayerProfilePage inner panels to tc.cardBgAlt"
```

---

### Step 3: ParentPlayerCardPage.jsx — Standardize Inner Panels

Same pattern — `${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}` appears ~13 times. Replace all with `${tc.cardBgAlt}`.

**Search and replace:**
```
Old: ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}
New: ${tc.cardBgAlt}
```

**Commit:**
```bash
git add -A && git commit -m "Standardize ParentPlayerCardPage inner panels to tc.cardBgAlt"
```

---

### Step 4: ParentPlayerCardPage.jsx — Minor Fixes

Check for any remaining non-standard patterns. Likely issues:

**Loading skeleton** (if present):
```
Old: bg-slate-700
New: ${tc.cardBgAlt}
```

**SkillBar component (line ~233):**
This receives `isDark` as a prop. Verify the bar backgrounds use theme conditionals:
```
Track: ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
```

**MiniBarChart component (line ~247):**
Same — verify bar chart backgrounds are theme-aware.

**BadgeIcon component (line ~277):**
Verify badge display works in both themes.

These are likely already fine given the high `isDark` count (84 refs), but verify.

**Commit:**
```bash
git add -A && git commit -m "Minor fixes to ParentPlayerCardPage components"
```

---

### Step 5: Final Commit

```bash
git add -A && git commit -m "Grouping 5 complete: Player pages modernized"
git push
```

---

## VERIFICATION CHECKLIST

### PlayerProfilePage
- [ ] Player header card renders correctly (photo, name, jersey, team)
- [ ] Tab navigation works (Info, Stats, Uniforms, Medical, Waivers)
- [ ] Info tab: edit mode toggles, forms work
- [ ] Stats tab: season stats display
- [ ] Uniforms tab: size selection dropdowns work
- [ ] Medical tab: medical info displays (if populated)
- [ ] Waivers tab: waiver cards render
- [ ] Click "View" on a waiver → modal opens with correct styling in both themes
- [ ] Click "Sign" on a waiver → signing modal opens
- [ ] Agree checkbox + name input → sign button enables
- [ ] Successfully sign a waiver → toast confirmation
- [ ] All inner panels use consistent card styling
- [ ] Serif font preserved on waiver content

### ParentPlayerCardPage
- [ ] Player card hero section renders (jersey number, name, position)
- [ ] Tab navigation works (Overview, Stats, Trends, Badges)
- [ ] Overview tab: primary stats display with sport-specific icons
- [ ] Skill bars render with correct fill colors
- [ ] Stats tab: detailed stat sections display
- [ ] Trends tab: mini bar charts render
- [ ] Badges tab: earned badges + in-progress display
- [ ] All inner panels use consistent tc.cardBgAlt

### Both themes
- [ ] Light mode: slate-50 inner panels on white cards
- [ ] Dark mode: consistent dark backgrounds, no transparency issues
- [ ] No text readability issues in either theme

---

## NOTE

This is a medium-effort grouping — maybe 20-30 minutes for CC. The biggest piece is the waiver modal conversion (Step 1), which is about 20 line changes. Everything else is bulk find-and-replace.
