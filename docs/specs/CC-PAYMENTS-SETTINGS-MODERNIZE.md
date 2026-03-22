# CC-PAYMENTS-SETTINGS-MODERNIZE.md
## Groupings 7-8: Modernize Payment Pages + Settings Pages

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.** Stripe logic, payment processing, season CRUD, waiver management, registration templates — all must remain identical.
3. **Git commit after each file.** Test `npm run dev` after each.
4. **No extraction needed** unless a file exceeds 1,000 lines (only SeasonsPage and SetupSectionContent qualify, and SetupSectionContent is already clean).

---

## SITUATION SUMMARY

### Payment Pages

| File | Lines | Status | Work |
|------|-------|--------|------|
| `ParentPaymentsPage.jsx` (parent/) | 539 | ✅ 95% done (54 tc refs) | 1 hover fix |
| `PaymentsPage.jsx` (payments/) | 1,368 | ✅ 90% done (101 tc refs) | 4 inner panel fixes |
| `PaymentSetupPage.jsx` (settings/) | 547 | ❌ 0% (0 tc, 13 hd-dark) | Full conversion |

### Settings Pages

| File | Lines | Status | Work |
|------|-------|--------|------|
| `SetupSectionContent.jsx` | 1,525 | ✅ Done (153 tc refs) | 1 stray fix |
| `SetupSectionCard.jsx` | 103 | ✅ Done | None |
| `OrganizationPage.jsx` | 812 | ✅ Done (15 tc refs) | None |
| `SubscriptionPage.jsx` | 624 | ✅ Done (36 tc refs) | None |
| `DataExportPage.jsx` | 947 | ✅ 95% done (14 tc refs) | 1 stray fix |
| `WaiversPage.jsx` | 1,052 | 🟡 95% done (105 tc, 38 isDark) | 1 modal header fix |
| `RegistrationTemplatesPage.jsx` | 823 | 🟡 Uses `colors.*` inline styles, no tc | Convert to tc.* classes |
| `SeasonsPage.jsx` | 1,014 | ❌ 0% (0 tc, 48 hd-dark) | Full conversion |

---

## DESIGN SYSTEM REFERENCE

Same patterns as all previous docs. Quick reference:

```
Page bg:    ${tc.pageBg}
Card:       ${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm
Inner:      ${tc.cardBgAlt}
Text:       ${tc.text}
Muted:      ${tc.textMuted}
Input:      ${tc.input} or isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
Modal:      bg-black/50 backdrop-blur-sm (overlay), ${tc.cardBg} border ${tc.border} rounded-2xl (container)
```

---

## EXECUTION PLAN

### Step 1: ParentPaymentsPage.jsx — 1 fix

Line 307: hover state uses `hover:bg-slate-800/50` without isDark conditional:
```
Old: hover:bg-slate-800/50
New: ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100'}
```

**Commit:** `git add -A && git commit -m "Fix ParentPaymentsPage hover state"`

---

### Step 2: PaymentsPage.jsx — 4 fixes

All 4 instances use `bg-slate-800/30` or `bg-slate-800/50` for inner panels. Convert:

```
Old: bg-slate-800/30
New: ${tc.cardBgAlt}

Old: bg-slate-800/50
New: ${tc.cardBgAlt}
```

Lines to fix: 296, 405, 593, 642.

If `tc` is not imported, add: `const tc = useThemeClasses()` and `import { useThemeClasses } from '../../contexts/ThemeContext'`.

**Commit:** `git add -A && git commit -m "Fix PaymentsPage inner panel theme"`

---

### Step 3: PaymentSetupPage.jsx — Full conversion

**Add imports and hooks:**
```javascript
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
// Inside component:
const tc = useThemeClasses()
const { isDark } = useTheme()
```

**Convert all hardcoded dark classes:**

| Old | New |
|-----|-----|
| `text-3xl font-bold text-white` (header) | `text-3xl font-bold ${tc.text}` |
| `text-slate-400` (all instances) | `${tc.textMuted}` |
| `text-white` (all label instances) | `${tc.text}` |
| `border-b border-slate-700 pb-2` (tab border) | `border-b ${tc.border} pb-2` |
| `bg-slate-700 text-white` (active tab) | `${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm'} ` |
| `text-slate-400 hover:text-white hover:bg-slate-800` (inactive tab) | `${tc.textMuted} ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-50'}` |
| `bg-slate-800 border border-slate-700 rounded-2xl` (card) | `${tc.cardBg} border ${tc.border} rounded-2xl` |
| `bg-slate-900 rounded-xl` (inner panel) | `${tc.cardBgAlt} rounded-xl` |
| `bg-slate-800 border border-slate-700 rounded-xl` (input) | `${tc.input} rounded-xl` |
| `text-white font-medium` (field labels) | `${tc.text} font-medium` |
| `text-sm text-slate-400` (descriptions) | `text-sm ${tc.textMuted}` |
| `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` (success states) | Keep as-is — works both themes |
| `bg-blue-500/10 border border-blue-500/30` (help box) | Keep as-is — works both themes |
| `text-blue-400`, `text-blue-300` (help text) | Keep as-is |
| `bg-red-500/10 border border-red-500/30` (error states) | Keep as-is |

**Toggle switches:** The checkbox inputs use `accent-orange-500` — keep as-is.

**Commit:** `git add -A && git commit -m "Full theme conversion of PaymentSetupPage"`

---

### Step 4: SeasonsPage.jsx — Full conversion

This is the biggest settings page that needs conversion (1,014 lines, 48 hardcoded dark instances, 0 tc refs).

**Add imports and hooks** at top:
```javascript
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
// Inside component:
const tc = useThemeClasses()
const { isDark } = useTheme()
```

**Bulk patterns to replace throughout the file:**

| Old (search for) | New (replace with) |
|-------------------|--------------------|
| `text-white` (headings/labels) | `${tc.text}` |
| `text-slate-400` (descriptions) | `${tc.textMuted}` |
| `text-slate-500` (secondary) | `${tc.textMuted}` |
| `bg-slate-800 border border-slate-700 rounded-2xl` | `${tc.cardBg} border ${tc.border} rounded-2xl` |
| `bg-slate-800 rounded-xl` or `bg-slate-800 rounded-2xl` | `${tc.cardBg} border ${tc.border} rounded-2xl` |
| `bg-slate-900 rounded-xl` | `${tc.cardBgAlt} rounded-xl` |
| `bg-slate-900 border border-slate-700 rounded-xl` (inputs) | `${tc.input} rounded-xl` |
| `border-b border-slate-700` | `border-b ${tc.border}` |
| `border border-slate-700` (standalone) | `border ${tc.border}` |
| `hover:bg-slate-700` | `${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}` |
| `bg-slate-700 text-white` (active states) | `${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm'}` |
| `text-slate-400 hover:text-white` | `${tc.textMuted} hover:${isDark ? 'text-white' : 'text-slate-900'}` |

**Be careful with:** Modals inside SeasonsPage — apply the standard modal overlay/container pattern.

**Commit:** `git add -A && git commit -m "Full theme conversion of SeasonsPage"`

---

### Step 5: RegistrationTemplatesPage.jsx — Convert inline colors to tc.*

This page uses `style={{ color: colors.text }}` and `style={{ backgroundColor: colors.card, border: '1px solid ' + colors.border }}` inline styles. Convert to tc.* class equivalents:

```
Old: style={{ color: colors.text }}
New: className={tc.text}  (remove style prop)

Old: style={{ color: colors.textMuted }}
New: className={tc.textMuted}

Old: style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
New: className={`${tc.cardBg} border ${tc.border}`}
```

Add `import { useThemeClasses } from '../../contexts/ThemeContext'` and `const tc = useThemeClasses()` if not present.

**Note:** Some elements may combine className and style props. Merge the style values into className where possible.

**Commit:** `git add -A && git commit -m "Convert RegistrationTemplatesPage from inline styles to tc.*"`

---

### Step 6: WaiversPage.jsx — 1 fix

Line 597: Modal header bar is hardcoded dark:
```
Old: className="px-5 py-2.5 flex items-center justify-between bg-slate-800 rounded-t-2xl"
New: className={`px-5 py-2.5 flex items-center justify-between ${tc.cardBg} rounded-t-2xl`}
```

**Commit:** `git add -A && git commit -m "Fix WaiversPage modal header theme"`

---

### Step 7: DataExportPage.jsx — 1 fix

Find the 1 hardcoded dark instance and convert it. Likely a loading skeleton or inner panel:
```
Old: bg-slate-700 (or similar)
New: ${tc.cardBgAlt}
```

**Commit:** `git add -A && git commit -m "Fix DataExportPage stray hardcoded dark"`

---

### Step 8: SetupSectionContent.jsx — 1 fix

Same as above — find the 1 stray hardcoded dark instance and convert.

**Commit:** `git add -A && git commit -m "Fix SetupSectionContent stray hardcoded dark"`

---

### Step 9: Final commit

```bash
git add -A && git commit -m "Groupings 7-8 complete: Payments + Settings modernized"
git push
```

---

## VERIFICATION CHECKLIST

### Payment Pages
- [ ] ParentPaymentsPage: payment cards render, selection works
- [ ] PaymentsPage (admin): payment tracking table renders, filters work
- [ ] PaymentSetupPage: Manual payments tab — Venmo/Zelle/CashApp fields editable
- [ ] PaymentSetupPage: Stripe tab — settings render, test connection works
- [ ] PaymentSetupPage: Save button works

### Settings Pages
- [ ] SeasonsPage: season list renders, create/edit season works
- [ ] SeasonsPage: sport selection, date pickers, all form fields work
- [ ] RegistrationTemplatesPage: templates grid renders, create/edit works
- [ ] WaiversPage: waiver list renders, create/edit/preview works
- [ ] DataExportPage: export options render
- [ ] OrganizationPage: org settings display (should be unchanged)
- [ ] SubscriptionPage: subscription info displays (should be unchanged)

### Both themes
- [ ] Light mode: white cards on slate-50 background
- [ ] Dark mode: consistent dark backgrounds
- [ ] All form inputs readable in both themes
- [ ] No text readability issues

---

## TIME ESTIMATE

- Steps 1-2 (ParentPayments + PaymentsPage): 5 min
- Step 3 (PaymentSetupPage): 15 min
- Step 4 (SeasonsPage): 20-30 min (largest piece)
- Step 5 (RegistrationTemplatesPage): 15 min
- Steps 6-8 (stray fixes): 5 min

**Total: ~60-75 minutes, 1 CC session.**
