# CC-SAFE-MERGE-TO-MAIN.md
# Safe Merge: feat/desktop-dashboard-redesign → main

## CONTEXT
Two branches have been accumulating commits separately. Marisa is testing the live site (thelynxapp.com) in ~2 hours. Vercel deploys from main. We need everything on main, verified working, before she tests.

## DO NOT RUSH. VERIFY EVERYTHING.

---

## STEP 1: Pre-Merge Inventory

Before touching anything, document the current state.

### A. What's on main that's NOT on feat/desktop-dashboard-redesign:
```bash
git log main..feat/desktop-dashboard-redesign --oneline
```

### B. What's on feat/desktop-dashboard-redesign that's NOT on main:
```bash
git log feat/desktop-dashboard-redesign..main --oneline
```

### C. Check for file conflicts BEFORE merging:
```bash
git checkout main
git merge --no-commit --no-ff feat/desktop-dashboard-redesign
```
If conflicts appear, LIST every conflicted file. Do NOT auto-resolve. Report them.
If no conflicts:
```bash
git merge --abort
```

### D. Build both branches independently:
```bash
git checkout main
npm run build 2>&1 | tail -5

git checkout feat/desktop-dashboard-redesign
npm run build 2>&1 | tail -5
```

Report: Does each branch build clean on its own?

---

## STEP 2: Perform the Merge

Only proceed if Step 1 shows no conflicts (or conflicts you can safely resolve).

```bash
git checkout main
git merge feat/desktop-dashboard-redesign -m "Merge feat/desktop-dashboard-redesign into main — consolidate all work for Vercel deploy"
```

If conflicts occur during merge:
- For each conflict, open the file and pick the NEWER version (the feat branch version is likely more recent for UI components)
- If you're unsure about any conflict, STOP and list it. Do not guess.

---

## STEP 3: Post-Merge Build Verification

```bash
npm run build 2>&1
```

Must pass with zero errors. Warnings are OK. If build fails, report the exact error and DO NOT push.

---

## STEP 4: Post-Merge Functional Spot Check

Start the dev server and verify these critical paths work:

```bash
npm run dev
```

Open the app in the browser. Check:

### Admin Dashboard
- [ ] Dashboard loads without blank screen or console errors
- [ ] Header shows greeting + KPI stats
- [ ] Financial Snapshot card renders on the right
- [ ] Season cards show with attention pills
- [ ] "All Seasons" option appears in the dashboard filter bar

### Navigation
- [ ] Sidebar renders with all nav groups
- [ ] Click "Team Management" — page loads
- [ ] Click "Coach Directory" — page loads
- [ ] Click "Payment Admin" — page loads
- [ ] Click "Registrations" — page loads
- [ ] Click "Schedule" — page loads

### Season Selectors
- [ ] Coach Directory page: season dropdown has "All Seasons" at top
- [ ] Payment Admin page: season dropdown has "All Seasons" at top
- [ ] Team Management page: season dropdown has "All Seasons" at top

### Role Switching
- [ ] Switch to Coach view — coach dashboard loads
- [ ] Switch to Parent view — parent dashboard loads
- [ ] Switch back to Admin — admin dashboard loads

### Platform Mode Security
- [ ] Type /platform/overview in URL as non-platform-admin — should redirect to /dashboard

Report results for each check. If ANY check fails, note the exact failure.

---

## STEP 5: Push to Main (triggers Vercel deploy)

Only if ALL checks pass:
```bash
git push origin main
```

Then verify the Vercel deployment starts:
- Check that a new deployment appears in the Vercel dashboard
- Wait for it to show "Ready" status

---

## STEP 6: Delete Feature Branch

Only AFTER Vercel deploy is confirmed working:
```bash
git branch -d feat/desktop-dashboard-redesign
git push origin --delete feat/desktop-dashboard-redesign
```

---

## STEP 7: Final Report

```
## Merge Report
- Pre-merge conflicts: [none / list]
- Build status: PASS / FAIL
- Dashboard: OK / ISSUES
- Navigation: OK / ISSUES  
- Season selectors: OK / ISSUES
- Role switching: OK / ISSUES
- Platform security: OK / ISSUES
- Vercel deploy triggered: YES / NO
- Feature branch deleted: YES / NO
- Any issues found: [list or "none"]
```

## IF ANYTHING GOES WRONG
```bash
git merge --abort   # if merge not yet committed
git reset --hard HEAD~1   # if merge committed but not pushed
```
Do NOT push a broken merge. Report what went wrong.
