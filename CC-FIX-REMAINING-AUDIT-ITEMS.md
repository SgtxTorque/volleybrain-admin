# CC-FIX-REMAINING-AUDIT-ITEMS.md
# Fix: Remaining Audit Items — profile?.role Checks + BlastAlertChecker Verification

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md` (guardrail rules — follow ALL of them)
2. `CLAUDE.md`

## SCOPE
Fix 6 instances of `profile?.role === 'admin'` that use the wrong field for admin detection. The `profiles` table does not have a `role` column. Admin status comes from `user_roles.role === 'league_admin'`, exposed as the `isAdmin` boolean from `useAuth()`.

Also: verify BlastAlertChecker's `profile_id` column usage is correct (it is — the `message_recipients` table has a `profile_id` column per the schema). Remove the TODO comment if present.

**This spec does NOT:**
- Touch playerSelf (that requires a DB schema migration affecting both web and mobile — separate spec)
- Refactor any component structure
- Change any UI layout or styling
- Modify any Supabase queries beyond the specific column/field fixes listed

---

## PHASE 1: Fix profile?.role === 'admin' in CommentSection.jsx

**Finding:** Audit item — `profile?.role` does not exist. Admin check always returns false. Admins cannot edit/delete comments on team walls.
**File:** `src/components/teams/CommentSection.jsx`

### Edit contract:
**Allowed:** Change the isAdmin assignment to use `useAuth()`. Add the `useAuth` import if not present.
**Not allowed:** Change anything else in this file. No JSX changes. No query changes. No style changes.

### Changes:

**Line 95** (approximately):
```javascript
// FIND:
const isAdmin = profile?.role === 'admin'

// REPLACE WITH:
const { isAdmin } = useAuth()
```

If `useAuth` is not already imported, add it to the existing import block:
```javascript
import { useAuth } from '../../contexts/AuthContext'
```

If `profile` was being destructured from `useAuth()` already in this component, just add `isAdmin` to that destructure. Do NOT add a second `useAuth()` call.

### Verification:
```bash
npm run build 2>&1 | tail -5
git diff --name-only  # should ONLY show CommentSection.jsx
```

### Commit:
```bash
git add src/components/teams/CommentSection.jsx
git commit -m "Phase 1: fix admin check in CommentSection — use isAdmin from useAuth"
```

---

## PHASE 2: Fix profile?.role checks in pages/teams/TeamWallPage.jsx

**Finding:** Same issue — `profile?.role` does not exist. Affects admin/coach permissions for team wall post management.
**File:** `src/pages/teams/TeamWallPage.jsx`

### Edit contract:
**Allowed:** Change the 2 lines that reference `profile?.role`. Add `isAdmin` and/or `isCoach` to the existing `useAuth()` destructure if needed.
**Not allowed:** Change any other logic, JSX, queries, or styling in this file.

### Changes:

**Line 150** (approximately):
```javascript
// FIND:
const isAdminOrCoach = profile?.role === 'admin' || profile?.role === 'coach'

// REPLACE WITH:
const { isAdmin } = useAuth()  // add isAdmin to existing useAuth destructure if present
const isCoach = roleContext?.isCoach || false  // or use existing coach detection
const isAdminOrCoach = isAdmin || isCoach
```

Check how this file currently gets `profile`. If it already calls `useAuth()`, just add `isAdmin` to the destructure. Do NOT add a duplicate `useAuth()` call.

**Line 814** (approximately):
```javascript
// FIND:
viewerRole={profile?.role === 'parent' ? 'parent' : profile?.role === 'coach' ? 'coach' : 'admin'}

// REPLACE WITH:
viewerRole={activeView === 'parent' ? 'parent' : activeView === 'coach' ? 'coach' : 'admin'}
```

Note: `activeView` is passed as a prop to TeamWallPage from MainApp. If `activeView` is not available in scope, check the component's props. Use whatever role indicator is already available — do NOT add new props.

### Verification:
```bash
npm run build 2>&1 | tail -5
git diff --name-only  # should ONLY show TeamWallPage.jsx (teams version)
```

### Commit:
```bash
git add src/pages/teams/TeamWallPage.jsx
git commit -m "Phase 2: fix admin/coach checks in TeamWallPage — use isAdmin from useAuth + activeView"
```

---

## PHASE 3: Fix profile?.role checks in pages/public/TeamWallPage.jsx

**Finding:** Same issue in the public TeamWallPage (which the audit found has active importers and was kept).
**File:** `src/pages/public/TeamWallPage.jsx`

### Edit contract:
**Allowed:** Change the 3 lines that reference `profile?.role`. Same pattern as Phase 2.
**Not allowed:** Everything else in this file stays untouched.

### Changes:

**Line 322** (approximately):
```javascript
// FIND:
const isAdmin = profile?.role === 'admin'

// REPLACE WITH — use useAuth:
const { isAdmin } = useAuth()
```

**Line 894** (approximately):
```javascript
// FIND:
viewerRole={profile?.role === 'parent' ? 'parent' : profile?.role === 'coach' ? 'coach' : 'admin'}

// REPLACE WITH:
viewerRole={activeView === 'parent' ? 'parent' : activeView === 'coach' ? 'coach' : 'admin'}
```

If `activeView` is not available in this component, check what props it receives. If neither `activeView` nor role info is available, use `isAdmin` from `useAuth()`:
```javascript
viewerRole={isAdmin ? 'admin' : 'parent'}
```

**Line 931** (approximately):
```javascript
// FIND:
const isAdmin = profile?.role === 'admin'

// REPLACE WITH:
// Remove this line — isAdmin already defined from useAuth above
```

### Verification:
```bash
npm run build 2>&1 | tail -5
git diff --name-only  # should ONLY show public/TeamWallPage.jsx
```

### Commit:
```bash
git add src/pages/public/TeamWallPage.jsx
git commit -m "Phase 3: fix admin checks in public TeamWallPage — use isAdmin from useAuth"
```

---

## PHASE 4: BlastAlertChecker — Remove TODO, Confirm Column is Correct

**Finding:** Audit flagged `profile_id` as possibly wrong column. Investigation confirms `message_recipients` table HAS a `profile_id` column (per SUPABASE_SCHEMA.md). The query is correct.
**File:** `src/components/layout/BlastAlertChecker.jsx`

### Edit contract:
**Allowed:** Remove the TODO comment if one was added by a previous spec. Optionally add a clarifying comment.
**Not allowed:** Change any query logic, imports, JSX, or functionality.

### Changes:

Find any TODO comment about the column mismatch (added by the Phase 4 architecture fixes). Remove it or replace with:
```javascript
// profile_id column confirmed in message_recipients table (SUPABASE_SCHEMA.md)
```

If no TODO exists, skip this phase entirely.

### Verification:
```bash
npm run build 2>&1 | tail -5
git diff --name-only  # should ONLY show BlastAlertChecker.jsx, or nothing if skipped
```

### Commit (if changes were made):
```bash
git add src/components/layout/BlastAlertChecker.jsx
git commit -m "Phase 4: confirm BlastAlertChecker profile_id column is correct, remove TODO"
```

---

## FINAL PUSH

Only after ALL phases pass verification:
```bash
git push origin main
```

## FINAL REPORT

```
## Spec Execution Report
- Spec: CC-FIX-REMAINING-AUDIT-ITEMS.md
- Phases completed: X/4
- Phases skipped: X (with reasons)
- Files modified: [list]
- Total lines changed: +X / -Y
- Build status: PASS / FAIL
- Unintended changes: NONE / [list]
- Issues discovered: [list or "none"]
```
