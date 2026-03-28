# CC-URGENT-CONSOLIDATED-FIXES.md
# URGENT: React #310 Still Broken + Session State Bleed + season_id=all Leaks

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## PRIORITY: CRITICAL — Three blocking bugs.

---

## PROBLEM 1: React Error #310 on OrganizationPage — STILL BROKEN

The previous fix claimed to move hooks before the early return. It either didn't work, didn't deploy, or there's a SECOND early return that was missed.

### Fix:

**Step 1:** Open `src/pages/settings/OrganizationPage.jsx` and find EVERY early return in the component:
```bash
grep -n "return" src/pages/settings/OrganizationPage.jsx | head -30
```

**Step 2:** Find EVERY hook call in the component:
```bash
grep -n "useState\|useEffect\|useRef\|useMemo\|useCallback\|useContext\|useTheme\|useAuth\|useSeason" src/pages/settings/OrganizationPage.jsx
```

**Step 3:** Verify that ALL hooks come BEFORE the FIRST `return` statement (other than the final JSX return). If ANY hook is called after ANY early return, move it above ALL early returns.

**Step 4:** If there are hooks that depend on data that's only available after loading (e.g., `useRef` that references loaded sections), they still need to be called before any return. Use conditional logic INSIDE the hook, not around it:

```javascript
// BAD (causes #310):
if (loading) return <Spinner />
const ref = useRef(null)  // <-- This hook doesn't run when loading=true

// GOOD:
const ref = useRef(null)  // <-- Always runs
if (loading) return <Spinner />
```

**Step 5:** If the component is too complex to untangle (too many hooks after conditionals), use the extraction pattern. Extract the post-loading content into a SEPARATE component:

```jsx
// OrganizationPage.jsx
function OrganizationPage(props) {
  // Only top-level hooks here (auth, season, theme, loading state)
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState({})
  
  useEffect(() => { loadData() }, [])
  
  if (loading) return <Spinner />
  if (!organization) return <NoOrg />
  
  // Pass all loaded data to the inner component
  return <OrganizationPageContent organization={organization} setupData={setupData} setSetupData={setSetupData} {...props} />
}

// OrganizationPageContent.jsx (or same file, below)
function OrganizationPageContent({ organization, setupData, setSetupData, ...props }) {
  // ALL remaining hooks go here — this component never conditionally unmounts
  const ref = useRef(null)
  const [expandedSection, setExpandedSection] = useState(null)
  // ... etc
}
```

This pattern GUARANTEES hooks are never called conditionally. Use this if the simple move-hooks-up approach didn't work.

### Verify:
- Navigate to Organization Setup page
- Page loads without "Something went wrong" error
- Console shows no React error #310

### Commit:
```bash
git add src/pages/settings/OrganizationPage.jsx
git commit -m "URGENT: Fix React #310 — extract inner component to guarantee hook order"
```

---

## PROBLEM 2: Session State Bleeds Between Organizations

When User A logs out and User B logs in, the app navigates User B to the last page User A was viewing. This happens because the current page/route state persists in the browser (likely localStorage or URL state) across sessions.

### Fix:

**Step 1:** Find where the "current page" or "active view" is stored:
```bash
grep -rn "localStorage.*page\|localStorage.*route\|localStorage.*view\|localStorage.*active\|localStorage.*nav\|sessionStorage" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | head -20
```

**Step 2:** Find the logout handler and the login/auth state change handler:
```bash
grep -n "signOut\|logout\|onAuthStateChange\|session.*change" src/contexts/AuthContext.jsx | head -15
```

**Step 3:** On logout OR on auth state change (new session), clear any persisted page state:
```javascript
// In the logout function:
async function signOut() {
  // Clear any persisted navigation state
  localStorage.removeItem('lastPage')
  localStorage.removeItem('activeView')
  localStorage.removeItem('selectedSeason')
  // ... any other persisted state keys
  
  await supabase.auth.signOut()
}
```

**Step 4:** On login (new session detected), navigate to Dashboard:
```javascript
// In the auth state change handler, when a new session starts:
if (event === 'SIGNED_IN') {
  // Reset to dashboard — don't carry over previous user's state
  // This might be in MainApp.jsx where the initial route is determined
}
```

**Step 5:** Check if the URL itself carries state. If the app uses client-side routing (react-router), the URL path persists across sessions. The fix is to redirect to `/dashboard` on new login:
```bash
grep -n "navigate\|Navigate\|redirect\|useNavigate" src/MainApp.jsx | head -10
```

In the auth flow, after successful login, force navigation to dashboard:
```javascript
// After login completes:
window.location.href = '/dashboard'  // or use router.navigate('/dashboard')
```

### Verify:
- Log in as Org A, navigate to Schedule page
- Log out
- Log in as Org B
- App should land on Dashboard, NOT Schedule

### Commit:
```bash
git add src/contexts/AuthContext.jsx src/MainApp.jsx
git commit -m "URGENT: Clear navigation state on logout, redirect to dashboard on login"
```

---

## PROBLEM 3: season_id=eq.all STILL Leaking to Supabase

The console shows:
```
players?season_id=eq.all → 400
payments?season_id=eq.all → 400
registration_funnel_events?season_id=eq.all → 404
notifications?organization_id=eq.xxx&... → 400
```

The "All Seasons" sentinel value `'all'` is STILL being sent as a literal string to Supabase on some queries. The earlier fix missed some pages.

### Fix:

**Step 1:** Find EVERY remaining instance where `season_id` could be set to `'all'`:
```bash
grep -rn "selectedSeason.*\.id\|season_id.*selectedSeason\|\.eq.*season_id" src/pages/ src/components/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | grep -v "\.md" | grep -v "// "
```

**Step 2:** For EVERY match, verify there's a guard that prevents `'all'` from reaching Supabase:
```javascript
// The guard pattern — MUST exist before every .eq('season_id', ...):
if (selectedSeason?.id && selectedSeason.id !== 'all') {
  query = query.eq('season_id', selectedSeason.id)
}
```

If the guard is MISSING, add it.

**Step 3:** Also check for `isAllSeasons()` helper usage — some pages may have added `organization_id` filters in the security fix but forgotten to also guard the `season_id` filter:
```bash
grep -rn "isAllSeasons\|\.id === 'all'" src/pages/ --include="*.jsx" | head -20
```

**Step 4:** Check the specific pages from the console errors:
- `players` query with `season_id=eq.all` — which page?
- `payments` query with `season_id=eq.all` — which page?
- `registration_funnel_events` with `season_id=eq.all` — RegistrationFunnelPage
- `notifications` with 400 — NotificationsPage

For each, find the query and add the guard.

**Step 5:** Also check the DashboardPage — when "All Seasons" is selected and the dashboard loads, do its sub-queries properly skip the season_id filter?

### Verify:
- Select "All Seasons" in the header
- Navigate to every page
- Console should show ZERO `season_id=eq.all` errors
- Pages should either show all-org data (if they support it) or show "select a season" (if they require one)

### Commit:
```bash
git add [all affected files]
git commit -m "URGENT: Guard all remaining season_id queries against 'all' sentinel value"
```

---

## FINAL PUSH

After ALL 3 problems are fixed:
```bash
git push origin main
```

## VERIFICATION
- [ ] OrganizationPage loads without React #310 error
- [ ] All org setup sections are accessible (click each one in left nav)
- [ ] Log out of Org A, log into Org B → lands on Dashboard, not previous page
- [ ] No `season_id=eq.all` 400 errors in console on any page
- [ ] No `season_id=eq.all` 404 errors in console
- [ ] Dashboard loads correctly for new org with no data
- [ ] Schedule page loads (was showing errors in console)
- [ ] Standings page loads (was showing errors in console)

## REPORT
```
## Consolidated Fix Report
- React #310 fixed: YES/NO (describe approach used)
- Session state bleed fixed: YES/NO
- season_id=all leaks remaining: [count] / 0
- Pages verified working: [list]
- Build status: PASS/FAIL
```
