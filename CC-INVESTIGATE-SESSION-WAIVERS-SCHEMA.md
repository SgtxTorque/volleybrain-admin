# CC-INVESTIGATE-SESSION-WAIVERS-SCHEMA.md
# INVESTIGATION: Session Bleed Still Happening + Waiver Checkboxes Dead + Schema Mismatches

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`

## DO NOT CHANGE ANY CODE. READ ONLY. REPORT ONLY.

---

## PROBLEM 1: Session State Bleed — Login Still Lands on Previous User's Page

The previous fix claimed to clear localStorage on logout and redirect to dashboard on login. It's NOT working. Logging out of Account A (on Schedule page) and logging into Account B still lands on the Schedule page.

### Investigate:

**A. What EXACTLY does the signOut function do now?**
```bash
grep -B5 -A30 "signOut\|sign_out\|handleSignOut\|handleLogout" src/contexts/AuthContext.jsx
```

**B. Is the localStorage actually being cleared?** Check if the keys are correct:
```bash
# What localStorage keys does the app use?
grep -rn "localStorage\.\(set\|get\|remove\)Item" src/ --include="*.jsx" --include="*.js" | grep -v _archive | grep -v node_modules | head -30
```

**C. Is the URL redirect actually happening?**
```bash
grep -n "window\.history\|window\.location\|replaceState\|pushState\|navigate.*dashboard\|redirect.*dashboard" src/contexts/AuthContext.jsx src/MainApp.jsx | head -15
```

**D. Is the route state stored in react-router, not localStorage?** React Router keeps the current URL in the browser's address bar. If signOut doesn't change the URL, the browser stays on `/schedule` and when the new user logs in, react-router renders the Schedule page.
```bash
grep -n "useNavigate\|useLocation\|navigate(\|<Navigate" src/MainApp.jsx src/contexts/AuthContext.jsx | head -15
```

**E. Check the onAuthStateChange handler — does it redirect on SIGNED_IN?**
```bash
grep -B5 -A20 "onAuthStateChange\|SIGNED_IN\|SIGNED_OUT" src/contexts/AuthContext.jsx
```

### Report:
```
What signOut does: [exact code]
localStorage keys cleared: [list]
URL redirect method: [replaceState / navigate / none]
React Router navigate called: YES/NO
onAuthStateChange handles SIGNED_IN redirect: YES/NO
Root cause: [why the redirect isn't working]
Suggested fix: [exact approach]
```

---

## PROBLEM 2: Waiver Checkboxes in Org Setup Are Dead

In the Legal & Waivers section of Organization Setup, the waiver checkboxes (Liability Waiver, Photo/Media Release, etc.) cannot be checked. They are visually present but clicking does nothing. Also, custom waivers created on the Waiver Management page do NOT appear in this list.

### Investigate:

**A. Find the waiver checkbox rendering in SetupSectionContent.jsx:**
```bash
grep -n "waiver\|Waiver\|checkbox\|check.*box\|Liability\|Photo.*Release\|Medical.*Auth\|Code.*Conduct\|Concussion" src/pages/settings/SetupSectionContent.jsx | head -30
```

**B. Read the exact waiver section code (find the section around "Legal" or "Waivers"):**
```bash
# Find the legal/waivers section
grep -n "legal\|Legal\|waiver\|Waiver" src/pages/settings/SetupSectionContent.jsx | head -20
```
Then read 50 lines around that section to see the checkbox implementation.

**C. Check if the checkboxes have onChange handlers:**
Look at the actual checkbox elements. Are they:
- `<input type="checkbox" onChange={...} checked={...} />` (functional)
- `<input type="checkbox" />` with no onChange (dead)
- `<SectionToggle>` or other custom component (may be broken)
- Just text labels with no actual input element

**D. Check where the waiver list comes from:**
```bash
grep -n "waivers\|setWaivers\|loadWaivers\|waiver_templates" src/pages/settings/SetupSectionContent.jsx | head -15
grep -n "waivers\|setWaivers\|loadWaivers\|waiver_templates" src/pages/settings/OrganizationPage.jsx | head -15
```

Is the waiver list hardcoded (the 5 recommended ones) or loaded from the `waiver_templates` table? If hardcoded, custom waivers will never appear. If loaded, check if the query is org-scoped.

**E. Check how waivers are supposed to be "selected" for the org:**
Is there a junction table like `organization_waivers` or a field on the `organizations` table like `required_waivers`? Or are waivers selected by creating them as templates in the waiver management page?

```bash
grep -rn "required_waiver\|selected_waiver\|organization_waiver\|waiver.*enabled\|waiver.*active" src/ --include="*.jsx" --include="*.js" --include="*.md" --include="*.csv" | grep -v _archive | grep -v node_modules | head -15
```

### Report:
```
Checkbox implementation: [type — native input / custom component / none]
onChange handler exists: YES/NO
Waiver list source: [hardcoded / loaded from waiver_templates / loaded from other table]
Custom waivers appear in list: YES/NO
How waivers are "selected": [junction table / org field / template creation / unknown]
Root cause for dead checkboxes: [describe]
Root cause for missing custom waivers: [describe]
Suggested fix: [exact approach]
```

---

## PROBLEM 3: `.eq('organization_id', ...)` on Tables That Don't Have That Column

The console shows: `column schedule_events.organization_id does not exist` — a 400 error.

The security fix added `.eq('organization_id', organization.id)` to queries, but some tables don't have that column. The audit report listed these tables but CC added the filter anyway.

### Investigate:

**A. Find EVERY Supabase query that adds organization_id on a table that doesn't have it:**
```bash
# Check the actual Supabase schema for which tables have organization_id
grep -A5 "schedule_events\|teams\|coaches\|players\|payments\|chat_channels\|event_rsvps\|event_volunteers\|coach_availability" DATABASE_SCHEMA.md SUPABASE_SCHEMA.md SCHEMA_REFERENCE.csv 2>/dev/null | grep "organization_id" | head -20
```

**B. For the specific tables in the error, check if organization_id column exists:**

Tables to verify:
- `schedule_events` — does it have `organization_id`? (console says NO)
- `teams` — does it have `organization_id`?
- `coaches` — does it have `organization_id`?
- `players` — does it have `organization_id`?
- `payments` — does it have `organization_id`?
- `chat_channels` — does it have `organization_id`?
- `notifications` — does it have `organization_id`?

```bash
# Check schema files
grep -B2 -A15 "### schedule_events" DATABASE_SCHEMA.md SUPABASE_SCHEMA.md 2>/dev/null | head -20
grep -B2 -A15 "### teams" DATABASE_SCHEMA.md SUPABASE_SCHEMA.md 2>/dev/null | head -20
grep -B2 -A15 "### coaches" DATABASE_SCHEMA.md SUPABASE_SCHEMA.md 2>/dev/null | head -20
grep -B2 -A15 "### players" DATABASE_SCHEMA.md SUPABASE_SCHEMA.md 2>/dev/null | head -20
grep -B2 -A15 "### payments" DATABASE_SCHEMA.md SUPABASE_SCHEMA.md 2>/dev/null | head -20
```

**C. Find every query that uses `.eq('organization_id', ...)` and list the table it's querying:**
```bash
grep -rn "\.eq.*organization_id.*organization" src/pages/ --include="*.jsx" | grep -v _archive | grep -v "// " | head -40
```

For each match, note:
- File + line number
- Table being queried (from the `.from('table_name')` above it)
- Whether that table actually has an `organization_id` column

**D. For tables WITHOUT organization_id, how should they be org-scoped?**
- `schedule_events` → has `season_id` and `team_id`. Season is org-scoped. Filter by season_id (already done) and remove the org_id filter.
- `teams` → might have `organization_id` OR use `season_id` which is org-scoped. Check schema.
- `coaches` → might use `season_id` or `organization_id`. Check schema.
- `players` → might use `season_id` or `organization_id`. Check schema.

### Report:
```
Tables WITH organization_id column: [list]
Tables WITHOUT organization_id column: [list]

Broken queries (org_id added to table that doesn't have it):
| File | Line | Table | Has org_id? | Current filter | Should be |
|------|------|-------|-------------|----------------|-----------|
| SchedulePage.jsx | ~86 | schedule_events | NO | .eq('organization_id',...) | Remove, use season_id only |
| ... | ... | ... | ... | ... | ... |

Total broken queries: [count]
Suggested fix for each: [remove org_id filter / replace with parent-chain filter]
```

---

## DELIVERABLE

Produce ONE file: `INVESTIGATION-REPORT-SESSION-WAIVERS-SCHEMA.md` with all three sections.

```bash
git add INVESTIGATION-REPORT-SESSION-WAIVERS-SCHEMA.md
git commit -m "docs: Investigation report — session bleed, waiver checkboxes, schema mismatches"
git push origin main
```
