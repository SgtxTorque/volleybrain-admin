# CC-PARENT-DASHBOARD-FIX-5.md
## Parent Dashboard — CRITICAL: Rules of Hooks Violation (Crash Fix)

**File:** `src/pages/roles/ParentDashboard.jsx`
**Error:** `Rendered more hooks than during the previous render` at line 1156
**Severity:** PAGE IS COMPLETELY CRASHED — "Something went wrong" error boundary

---

## THE PROBLEM

React's Rules of Hooks require that hooks are called in the **exact same order** on every render. The console error shows:

```
Previous render            Next render
------------------------------------------------------
...
45. useEffect                 useEffect
46. undefined                 useMemo    ← THIS IS THE BUG
```

Hook #46 (`useMemo` at line 1156) did NOT exist on a previous render but DOES exist on the next render. This means there is a **conditional hook call** — a `useMemo`, `useState`, `useEffect`, or other hook that only runs sometimes.

---

## HOW TO FIX

### Step 1: Find ALL early returns in the component

Search `ParentDashboard.jsx` for any `return` statements that happen BEFORE all hooks are declared. This is the most common cause.

```jsx
// BAD — early return before all hooks
const ParentDashboard = () => {
  const [x, setX] = useState(0);
  
  if (loading) return <Loading />;  // ← EARLY RETURN!
  
  const memoValue = useMemo(() => ..., []);  // ← This hook doesn't run when loading=true
  // React sees different number of hooks between renders = CRASH
};
```

```jsx
// GOOD — all hooks declared before any return
const ParentDashboard = () => {
  const [x, setX] = useState(0);
  const memoValue = useMemo(() => ..., []);  // ← Always runs
  
  if (loading) return <Loading />;  // ← Returns AFTER all hooks
};
```

**ACTION:** Move ALL hooks to the TOP of the component, BEFORE any conditional returns.

### Step 2: Find ALL conditional hook calls

Search for hooks inside `if` statements, ternaries, loops, or after `&&` / `||` operators:

```jsx
// BAD — hook inside condition
if (selectedPlayerTeam) {
  const stats = useMemo(() => computeStats(selectedPlayerTeam), [selectedPlayerTeam]);
}

// BAD — hook after early return
if (!user) return null;
const theme = useMemo(() => getTheme(), []);

// BAD — hook in a loop or dynamic block
players.forEach(p => {
  const [selected, setSelected] = useState(false); // NEVER do this
});
```

### Step 3: Fix the specific issue at line 1156

Go to **line 1156** of `ParentDashboard.jsx`. There is a `useMemo` call there. Either:

A) It's placed AFTER an early `return` statement — move it above the return
B) It's inside an `if` block — move it out and make the computation conditional instead:

```jsx
// BAD
if (someCondition) {
  const value = useMemo(() => compute(), [dep]);
}

// GOOD
const value = useMemo(() => {
  if (!someCondition) return null;
  return compute();
}, [someCondition, dep]);
```

### Step 4: Audit the ENTIRE component

The component has ~45+ hooks (the error shows hooks up to #46). Every single one must be called unconditionally and in the same order. Do a full audit:

1. List every `useState`, `useRef`, `useContext`, `useEffect`, `useMemo`, `useCallback` in the file
2. Verify NONE of them are after an early return or inside a conditional
3. The order should be:
   - All `useContext` calls
   - All `useState` calls
   - All `useRef` calls
   - All `useMemo` calls
   - All `useCallback` calls
   - All `useEffect` calls
   - Then conditional returns (loading states, error states)
   - Then the JSX return

### Step 5: Fix the bad Supabase queries (secondary)

While fixing hooks, also address these column-doesn't-exist errors from the console:

| Query | Error | Fix |
|-------|-------|-----|
| `player_badges` → `order=earned_at.desc` | `column player_badges.earned_at does not exist` | Check DATABASE_SCHEMA.md for the correct column name. Likely `created_at` instead of `earned_at`. Fix the `.order()` call. |
| `waivers` → `select=id,title,required` + `is_active=eq.true` | `column waivers.title does not exist` | Check DATABASE_SCHEMA.md for the actual waivers table columns. Fix the `.select()` and `.eq()` calls. This is in `PriorityCardsEngine.jsx:85`. |
| `event_rsvps` → `user_id=eq.xxx` | `column event_rsvps.user_id does not exist` | Check DATABASE_SCHEMA.md for the correct column name. Likely `parent_id` or `profile_id` or `created_by`. This is in `PriorityCardsEngine.jsx:171`. |
| `user_dashboard_layouts` | 404 — table doesn't exist | Remove this query entirely from ParentDashboard or guard it. It belongs to the admin dashboard customization feature. |
| `games` | 404 — table doesn't exist | Remove or replace with correct table name from DATABASE_SCHEMA.md. |

For each fix, reference `DATABASE_SCHEMA.md` to find the correct table/column names.

---

## IMPLEMENTATION ORDER

1. **Fix the hooks violation FIRST** — find and move the conditional `useMemo` at line 1156 (and any other conditional hooks). The page literally cannot render until this is fixed.
2. **Fix the bad column names** — reference DATABASE_SCHEMA.md, fix `earned_at`, `title`, `user_id`, etc.
3. **Remove non-existent table queries** — `user_dashboard_layouts`, `games`
4. **Test** — page should load without crashing

---

## VERIFICATION CHECKLIST

- [ ] Page loads WITHOUT "Something went wrong" error
- [ ] Console has NO "Rendered more hooks" errors
- [ ] Console has NO "change in the order of Hooks" warnings
- [ ] No rapid 400/404/406 errors looping in console
- [ ] All sections render (even if with empty/placeholder data)
- [ ] Page is stable when resizing browser window
