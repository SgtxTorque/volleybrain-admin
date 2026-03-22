# CC-REMAINING-PAGES-MODERNIZE.md
## Grouping 9: Modernize All Remaining Pages

**Date:** February 27, 2026
**Repo:** `volleybrain-admin` (GitHub: SgtxTorque/volleybrain-admin)

---

## ⛔ RULES

1. **Read CLAUDE.md and DATABASE_SCHEMA.md before doing anything.**
2. **ZERO functional changes.**
3. **Git commit after each file.** Test `npm run dev` after each.

---

## SITUATION SUMMARY

These are the remaining pages not covered by Groupings 1-8. Mix of near-done and needs-work.

### Need Full Conversion (no tc.*, no isDark theme awareness)

| File | Lines | Issue |
|------|-------|-------|
| `attendance/AttendancePage.jsx` | 698 | 17 hardcoded dark, 0 tc, 0 isDark |
| `notifications/NotificationsPage.jsx` | 768 | 0 tc, 0 isDark — uses inline styles + custom fonts |
| `stats/PlayerStatsPage.jsx` | 731 | 0 tc, 0 isDark — check styling approach |

### Need Partial Conversion (has isDark but not tc.*)

| File | Lines | Issue |
|------|-------|-------|
| `reports/ReportsPage.jsx` | 855 | 0 tc, 26 isDark — uses isDark but not tc classes |
| `reports/RegistrationFunnelPage.jsx` | 794 | 0 tc, 25 isDark — same pattern |

### Need Minor Fixes (mostly done)

| File | Lines | Fixes |
|------|-------|-------|
| `teams/TeamsPage.jsx` | 1,290 | 70 tc refs, 11 hd-dark (likely in isDark conditionals — verify) |
| `registrations/RegistrationsPage.jsx` | 1,582 | 115 tc refs, 6 hd-dark |
| `parent/MyStuffPage.jsx` | 671 | 46 tc refs, 7 hd-dark |
| `archives/SeasonArchivePage.jsx` | 643 | 66 tc refs, 2 hd-dark stray |
| `schedule/CoachAvailabilityPage.jsx` | 1,175 | 55 tc refs, 2 hd-dark stray |

### Already Clean (skip)

| File | Lines | Status |
|------|-------|--------|
| `blasts/BlastsPage.jsx` | 691 | ✅ 67 tc, 0 hd-dark |
| `coaches/CoachesPage.jsx` | 799 | ✅ 67 tc, 0 hd-dark |
| `jerseys/JerseysPage.jsx` | 1,410 | ✅ 106 tc, 0 hd-dark |
| `parent/InviteFriendsPage.jsx` | 84 | ✅ 14 tc, 0 hd-dark |
| `parent/ParentMessagesPage.jsx` | 81 | ✅ 11 tc, 0 hd-dark |
| `profile/MyProfilePage.jsx` | 1,421 | ✅ 74 tc, 0 hd-dark |

---

## DESIGN SYSTEM REFERENCE

Same as all previous docs:
```
Page bg:    ${tc.pageBg}
Card:       ${tc.cardBg} border ${tc.border} rounded-2xl shadow-sm
Inner:      ${tc.cardBgAlt}
Text:       ${tc.text}
Muted:      ${tc.textMuted}
Input:      ${tc.input} rounded-xl
Modal:      bg-black/50 backdrop-blur-sm overlay + ${tc.cardBg} border ${tc.border} rounded-2xl container
```

---

## EXECUTION PLAN

### Step 1: AttendancePage.jsx — Full conversion

Add imports/hooks:
```javascript
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
const tc = useThemeClasses()
const { isDark } = useTheme()
```

Apply standard bulk patterns:
- `text-white` → `${tc.text}`
- `text-slate-400` / `text-slate-500` → `${tc.textMuted}`
- `bg-slate-800 border border-slate-700 rounded-2xl` → `${tc.cardBg} border ${tc.border} rounded-2xl`
- `bg-slate-900 rounded-xl` → `${tc.cardBgAlt} rounded-xl`
- Form inputs: `bg-slate-900 border border-slate-700 text-white` → `${tc.input}`
- `border-slate-700` → `${tc.border}`
- Hover states: `hover:bg-slate-700` → `${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`

**Commit:** `git add -A && git commit -m "Full theme conversion of AttendancePage"`

---

### Step 2: NotificationsPage.jsx — Full conversion

This page uses inline styles and custom fonts (Bebas Neue, DM Sans). Same treatment as TeamWallPage/ChatsPage:

1. Remove custom font references — let Tele-Grotesk inherit
2. Convert `style={{ color: '...' }}` to tc.* classes
3. Convert card backgrounds to `${tc.cardBg} border ${tc.border} rounded-2xl`
4. Add imports/hooks

**Commit:** `git add -A && git commit -m "Full theme conversion of NotificationsPage"`

---

### Step 3: PlayerStatsPage.jsx — Full conversion

Check the styling approach first (could be inline styles, hardcoded light, or something else). Apply the same conversion pattern as the other full-conversion pages.

**Commit:** `git add -A && git commit -m "Full theme conversion of PlayerStatsPage"`

---

### Step 4: ReportsPage.jsx — Convert isDark to tc.*

This page already uses `isDark` (26 refs) but doesn't use `tc.*`. The conversion is straightforward:

1. Add `const tc = useThemeClasses()` and import
2. Replace verbose isDark conditionals with tc.* shortcuts:
   - `${isDark ? 'text-white' : 'text-slate-900'}` → `${tc.text}`
   - `${isDark ? 'text-slate-400' : 'text-slate-500'}` → `${tc.textMuted}`
   - `${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}` → `${tc.cardBg} border ${tc.border}`
3. Keep any complex isDark conditionals that don't map cleanly to tc.*

**Commit:** `git add -A && git commit -m "Convert ReportsPage isDark to tc.*"`

---

### Step 5: RegistrationFunnelPage.jsx — Same as Step 4

Same pattern — has isDark but not tc.*. Convert verbose conditionals to tc.* shortcuts.

**Commit:** `git add -A && git commit -m "Convert RegistrationFunnelPage isDark to tc.*"`

---

### Step 6: TeamsPage.jsx — Verify + minor fixes

This page has 70 tc refs but 11 hd-dark. Check if the hd-dark instances are inside isDark conditionals (probably yes). Fix any that aren't:

```bash
grep -n "bg-slate-800\|bg-slate-900\|border-slate-700" src/pages/teams/TeamsPage.jsx
```

For each match, check if it's wrapped in `isDark ? '...' : '...'`. If yes, leave it. If no, add the conditional or replace with tc.*.

**Commit:** `git add -A && git commit -m "Fix TeamsPage stray hardcoded dark"`

---

### Step 7: RegistrationsPage.jsx — Verify + minor fixes

Same approach as Step 6. 115 tc refs means it's mostly done. Check the 6 hd-dark instances.

**Commit:** `git add -A && git commit -m "Fix RegistrationsPage stray hardcoded dark"`

---

### Step 8: MyStuffPage.jsx — Verify + minor fixes

46 tc refs, 7 hd-dark. Check if hd-dark instances are conditional. Fix any that aren't.

**Commit:** `git add -A && git commit -m "Fix MyStuffPage stray hardcoded dark"`

---

### Step 9: SeasonArchivePage.jsx — 2 stray fixes

66 tc refs, only 2 hd-dark. Find and fix:
```bash
grep -n "bg-slate-800\|bg-slate-900\|border-slate-700" src/pages/archives/SeasonArchivePage.jsx
```

**Commit:** `git add -A && git commit -m "Fix SeasonArchivePage stray hardcoded dark"`

---

### Step 10: CoachAvailabilityPage.jsx — 2 stray fixes

55 tc refs, only 2 hd-dark. Find and fix.

**Commit:** `git add -A && git commit -m "Fix CoachAvailabilityPage stray hardcoded dark"`

---

### Step 11: Final commit

```bash
git add -A && git commit -m "Grouping 9 complete: All remaining pages modernized"
git push
```

---

## SKIPPED PAGES (already clean)

These pages need NO changes:
- `blasts/BlastsPage.jsx` ✅
- `coaches/CoachesPage.jsx` ✅
- `jerseys/JerseysPage.jsx` ✅
- `parent/InviteFriendsPage.jsx` ✅
- `parent/ParentMessagesPage.jsx` ✅
- `profile/MyProfilePage.jsx` ✅

Also skipped (separate concerns):
- `auth/LoginPage.jsx` — public-facing, has its own styling
- `auth/SetupWizard.jsx` — onboarding flow, own styling
- `public/OrgDirectoryPage.jsx` — public page
- `public/PublicRegistrationPage.jsx` — public page
- `public/TeamWallPage.jsx` — public version, separate from admin TeamWallPage
- `platform/PlatformAdminPage.jsx` — platform admin, separate concern
- `platform/PlatformAnalyticsPage.jsx` — platform admin
- `platform/PlatformSubscriptionsPage.jsx` — platform admin
- `dashboard/*.jsx` — already modernized (the dashboards that started it all)
- `roles/*.jsx` — already modernized

---

## VERIFICATION CHECKLIST

For EACH converted page, verify:
- [ ] Page loads without errors
- [ ] Cards use white bg (light) / dark bg (dark)
- [ ] Text is readable in both themes
- [ ] Form inputs visible and editable in both themes
- [ ] Buttons work and have hover states
- [ ] Modals (if any) open with correct styling
- [ ] No white-on-white or dark-on-dark text

### Specific checks:
- [ ] AttendancePage: attendance grid renders, check/uncheck works
- [ ] NotificationsPage: notification list renders, send works
- [ ] PlayerStatsPage: stats display correctly
- [ ] ReportsPage: report cards render, charts display
- [ ] RegistrationFunnelPage: funnel visualization works
- [ ] TeamsPage: team grid/list renders, CRUD works
- [ ] RegistrationsPage: registration list renders, filters work
- [ ] MyStuffPage: parent's items display
- [ ] SeasonArchivePage: archived seasons render
- [ ] CoachAvailabilityPage: availability grid works

---

## TIME ESTIMATE

- Steps 1-3 (full conversions): 45-60 min
- Steps 4-5 (isDark → tc.*): 20 min
- Steps 6-10 (minor fixes): 15 min

**Total: ~80-95 minutes. Could split into 2 CC sessions if needed:**
- Session A: Steps 1-5 (full + partial conversions)
- Session B: Steps 6-10 (minor fixes + verification)
