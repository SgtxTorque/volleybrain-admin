# CC-URGENT-INPUT-FOCUS-BUG.md
# URGENT: Form Inputs Lose Focus After Every Keystroke

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## PRIORITY: CRITICAL — This breaks every form in the app.

## PROBLEM
When typing in ANY form input across the app (tested on Organization Setup page), the input loses focus after typing a single character. The user has to click back into the input to type another character. This makes every form in the app unusable.

## ROOT CAUSE DIAGNOSIS (do this FIRST before changing anything)

This bug is almost always caused by one of these:

### Cause 1: Component re-mounting on every state change
If a functional component that contains an `<input>` is DEFINED INSIDE another component's render, it gets a new function reference on every render, causing React to unmount and remount it. This destroys focus.

**Search for this pattern:**
```bash
# Find components defined inside other components (functions inside functions that return JSX)
grep -rn "function.*{" src/ --include="*.jsx" | head -200
```

Look specifically for:
- Components defined inside `DashboardPage.jsx` render
- Components defined inside `OrganizationPage.jsx`
- Components defined inside `SetupSectionContent.jsx`
- Any component defined inside a `.map()` callback

The **most likely culprit** is a recent change where a component was inlined or where a parent component now re-renders on every keystroke, causing child components to remount.

### Cause 2: Key prop changing on every render
If an input or its parent has a `key` prop that changes when state changes, React treats it as a new element.

```bash
grep -rn "key={.*state\|key={.*search\|key={.*query\|key={.*form\|key={.*input\|key={.*value" src/ --include="*.jsx" | grep -v _archive | grep -v node_modules | head -30
```

### Cause 3: State update causing full page re-render
If a top-level state change (like in MainApp.jsx or a context provider) triggers on every keystroke, it could cause the entire component tree to re-render.

Check if any recent changes added `useEffect` dependencies that fire on form state changes, or if a context value changes on every keystroke.

### Cause 4: Recent CSS/layout change causing DOM restructure
The sidebar fix (Phase 4-5 of CC-ONBOARDING-AND-SIDEBAR-FIXES) changed the sidebar width and layout. If this caused the main content area to re-layout on every state change, it could trigger remounts.

## PHASE 1: Diagnose the Root Cause

**Do NOT change any code in this phase. Only read and report.**

### Step 1: Find the most recent commits that could have caused this:
```bash
git log --oneline -20
```

### Step 2: Check if the bug exists on a specific page or ALL pages:
Look at the Organization Setup page specifically since that's where Carlos noticed it. Then check:
- Login page inputs
- Any settings page with forms
- Search inputs on operational pages (Schedule, Teams, etc.)
- Chat message input

### Step 3: Check for inline component definitions:
```bash
# In the files modified by recent specs, look for function components defined inside other components
grep -n "function [A-Z]" src/pages/settings/OrganizationPage.jsx
grep -n "function [A-Z]" src/pages/settings/SetupSectionContent.jsx
grep -n "function [A-Z]" src/components/layout/LynxSidebar.jsx
grep -n "function [A-Z]" src/pages/dashboard/DashboardPage.jsx
grep -n "function [A-Z]" src/MainApp.jsx | head -20
```

### Step 4: Check for re-render triggers:
```bash
# Look for state updates in onChange handlers that might trigger parent re-renders
grep -n "onChange.*setState\|onChange.*set[A-Z]\|onChange.*dispatch" src/pages/settings/OrganizationPage.jsx src/pages/settings/SetupSectionContent.jsx | head -20
```

### Step 5: Check the git diff for what changed:
```bash
# Find what files changed in the last 3 commits
git diff HEAD~3 --name-only
```

**REPORT your findings before proceeding to Phase 2.** List:
- Which files were recently modified
- Where inline component definitions exist
- What the likely root cause is

---

## PHASE 2: Fix the Root Cause

Based on the diagnosis, apply ONE of these fixes:

### If Cause 1 (inline component definition):
Move the component definition OUTSIDE the parent component:

```jsx
// BAD — component redefined on every render:
function ParentPage() {
  const [data, setData] = useState({})
  
  function FormSection({ value, onChange }) {  // <-- THIS IS THE BUG
    return <input value={value} onChange={onChange} />
  }
  
  return <FormSection value={data.name} onChange={e => setData({...data, name: e.target.value})} />
}

// GOOD — component defined outside:
function FormSection({ value, onChange }) {
  return <input value={value} onChange={onChange} />
}

function ParentPage() {
  const [data, setData] = useState({})
  return <FormSection value={data.name} onChange={e => setData({...data, name: e.target.value})} />
}
```

### If Cause 2 (key prop):
Remove or stabilize the key prop:

```jsx
// BAD:
<input key={`field-${formData.name}`} ... />

// GOOD:
<input key="name-field" ... />
// or no key at all if not in a list
```

### If Cause 3 (state cascade):
Isolate the form state so it doesn't trigger a full tree re-render. Use local state in the form component instead of lifting state to a parent that causes everything to re-render.

### If Cause 4 (layout change):
Check if the sidebar width change or the onboarding CTA additions caused the main content container to have a dynamic className or style that changes on re-render. Stabilize it.

### IMPORTANT: Fix the MINIMUM amount of code to resolve the focus issue. Do not refactor. Do not clean up. Just stop the focus loss.

### Verify the fix:
1. Go to Organization Setup page
2. Click into the Organization Name field
3. Type a full word without losing focus
4. Tab to the next field
5. Type a full word without losing focus
6. Repeat on 2 other pages with forms (Login page, any Settings page)

### Commit:
```bash
git add [only the files you changed]
git commit -m "URGENT: Fix input focus loss — [describe root cause]"
git push origin main
```

---

## PHASE 3: Verify No Regression

After the fix:
- [ ] Build passes
- [ ] Organization Setup: can type freely in all fields
- [ ] Login page: can type email and password without focus loss
- [ ] Season form modal: can type season name
- [ ] Chat input: can type messages
- [ ] Search inputs on any page: can type search queries
- [ ] Dashboard search/command palette: works
- [ ] No other functionality broken

### Commit (if any additional fixes needed):
```bash
git add [files]
git commit -m "Phase 3: Verify input focus fix across all forms"
git push origin main
```

---

## REPORT
```
## Input Focus Bug Report
- Root cause: [describe]
- Files modified: [list]
- Lines changed: +X / -Y
- Fix verified on: [list of pages tested]
- Build status: PASS
```
