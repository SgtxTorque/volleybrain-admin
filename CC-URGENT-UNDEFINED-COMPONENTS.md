# CC-URGENT-UNDEFINED-COMPONENTS.md
# URGENT: `Select is not defined` and `Toggle is not defined` crashing pages

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## PRIORITY: CRITICAL — Multiple pages are crashing.

## PROBLEM
`SetupSectionContent.jsx` (and potentially other files) reference `Select` and `Toggle` components that do not exist. These were introduced during the Settings mega redesign. The components were never created or imported. Every section that uses them crashes with `ReferenceError`.

**Error locations in SetupSectionContent.jsx:**
- Line 296: `Select is not defined`
- Line 343: `Select is not defined`
- Line 730: `Toggle is not defined`
- Line 1132: `Toggle is not defined`

## THIS IS LIKELY SITE-WIDE

The Settings mega spec instructed replacing selects and toggles across ALL settings pages. Search the ENTIRE codebase for any reference to undefined `Select` or `Toggle` components:

## PHASE 1: Find EVERY instance of undefined components across the entire codebase

**Do NOT change any code yet. Only search and report.**

```bash
# Find every file that references Select as a component (capital S, used as JSX)
grep -rn "<Select\b\|<Select " src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v "// " | grep -v "SelectAll\|SelectTeam\|SelectSeason\|SelectPlayer\|setSelect\|isSelect\|onSelect\|selectedInd"

# Find every file that references Toggle as a component (capital T, used as JSX)  
grep -rn "<Toggle\b\|<Toggle " src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v "// " | grep -v "toggleSelect\|toggleTheme\|toggleStatus\|toggleRoster\|setToggle\|isToggle\|onToggle"

# Check if Select or Toggle are imported ANYWHERE
grep -rn "import.*Select\b" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v "setSelect\|selectAll\|ToggleSelect"
grep -rn "import.*Toggle\b" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v "toggleTheme\|setToggle"

# Also check for other potentially undefined components that CC might have introduced
grep -rn "<Switch\b" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules
grep -rn "<Dropdown\b" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules
grep -rn "<Checkbox\b" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | grep -v "checkbox\|type=\"checkbox\|type='checkbox"
```

**Report the FULL list of every file and line number that references an undefined component.**

---

## PHASE 2: Fix EVERY instance — Replace with native HTML elements

For EVERY undefined `Select` reference: replace with a native `<select>` element styled with V2 Tailwind classes.

For EVERY undefined `Toggle` reference: replace with a styled native `<input type="checkbox">` wrapped in a toggle-switch CSS pattern, OR a simple `<button>` toggle.

### Select replacement pattern:
```jsx
// FIND (crashes):
<Select value={value} onChange={onChange} options={options} />

// REPLACE WITH native <select> styled with V2 classes:
<select
  value={value}
  onChange={onChange}
  className={`w-full appearance-none rounded-xl px-4 py-2.5 text-sm font-medium border transition-all ${
    isDark
      ? 'bg-white/[0.06] border-white/[0.06] text-white'
      : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'
  }`}
  style={{ fontFamily: 'var(--v2-font)', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
>
  {options.map(opt => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

**IMPORTANT:** The Select component may have been called with different prop patterns. Check each instance to see how it was invoked and translate the props correctly to native `<select>`:
- `options` array → map to `<option>` elements
- `value` → `value` prop on `<select>`
- `onChange` → might expect the value directly or an event. Native `<select>` passes event, so use `onChange={e => handler(e.target.value)}`
- `placeholder` → add a disabled first `<option>` element

### Toggle replacement pattern:
```jsx
// FIND (crashes):
<Toggle checked={value} onChange={onChange} label="Enable X" />

// REPLACE WITH a styled toggle button:
<label className="flex items-center gap-3 cursor-pointer">
  <div className="relative">
    <input
      type="checkbox"
      checked={value}
      onChange={e => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className={`w-10 h-5 rounded-full transition-colors ${
      value ? 'bg-[#4BB9EC]' : (isDark ? 'bg-white/[0.1]' : 'bg-slate-200')
    }`} />
    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
      value ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </div>
  {label && <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{label}</span>}
</label>
```

**Again, check each instance for the actual prop pattern used.**

### Apply to EVERY file found in Phase 1.

Do NOT skip any file. Do NOT assume "it's only in SetupSectionContent." Search results from Phase 1 are the definitive list.

---

## PHASE 3: Build and verify EVERY settings page

```bash
npm run build
```

Must pass with ZERO errors.

Then verify each settings page loads without console errors:
- [ ] Organization Setup: expand EVERY section, verify no crashes
- [ ] Seasons: load page, open season form modal
- [ ] Waivers: load page, check for Toggle/Select usage
- [ ] Payment Setup: load page, check manual/stripe tabs
- [ ] Registration Templates: load page
- [ ] Data Export: load page
- [ ] Subscription: load page
- [ ] Venue Manager: load page

Also check NON-settings pages that may have been affected:
- [ ] Dashboard: loads without errors
- [ ] Schedule: loads, filters work
- [ ] Registrations: loads
- [ ] Teams: loads
- [ ] Payments: loads
- [ ] Staff Portal: loads
- [ ] Chats: loads
- [ ] Any other page with form inputs

### Commit:
```bash
git add -A
git commit -m "URGENT: Replace all undefined Select/Toggle components with native styled elements"
git push origin main
```

---

## PHASE 4: Verify the input focus bug is also resolved

The input focus loss bug reported earlier may have been CAUSED by these undefined components throwing errors during render, which caused React to repeatedly re-mount the component tree.

After fixing the undefined components, test:
- [ ] Organization Setup: can type full words in text inputs without losing focus
- [ ] Login page: can type email/password normally
- [ ] Any search input: works normally

If the focus bug persists after this fix, THEN it's a separate issue. Report whether it's resolved or still occurring.

---

## REPORT
```
## Undefined Components Fix Report
- Total files with undefined Select: [count]
- Total files with undefined Toggle: [count]  
- Total instances fixed: [count]
- Files modified: [list]
- Build status: PASS/FAIL
- All settings pages load: YES/NO
- All non-settings pages load: YES/NO
- Input focus bug resolved: YES/NO / STILL OCCURRING
```
