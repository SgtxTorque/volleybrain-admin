# CC-INVESTIGATE-TM-SETUP-400.md
## Investigation: TM Setup Wizard — Season Creation 400 Error

**Purpose:** INVESTIGATION ONLY. Do NOT modify any files. Find the root cause of the 400 error when the TM Setup Wizard tries to create a season.

**Symptom:** `POST /rest/v1/seasons?select=* 400 (Bad Request)` when a new Team Manager completes the setup wizard.

---

## RULES

1. DO NOT WRITE CODE. DO NOT MODIFY FILES.
2. Quote exact file paths, line numbers, and column names.
3. Compare mobile's working flow vs web's broken flow column by column.

---

## INVESTIGATION TASKS

### Task 1: Compare the exact insert payloads

**Mobile (working):** Read `app/team-manager-setup.tsx` function `createTeamManagerSetup` (line 84+). Document the EXACT columns and values inserted into each table in order:
- organizations insert: which columns?
- user_roles insert: which columns? What order vs other inserts?
- profiles update: does it set current_organization_id?
- seasons insert: which columns? Does it use `sport_id` or `sport`? Does it use `status` or `is_active`?
- teams insert: which columns? Does it have `color`? `organization_id`? `is_active`?
- team_staff insert: which columns?
- team_invite_codes insert: which columns?

**Web (broken):** Read `src/pages/team-manager/TeamManagerSetup.jsx` function `handleCreate`. Document the EXACT same info.

Produce a side-by-side comparison table:

| Table | Mobile Columns | Web Columns | Mismatch? |
|-------|---------------|-------------|-----------|

### Task 2: Check the actual Supabase table schemas

For each table involved, check what columns actually exist. Use the schema reference files in the repo:
- `SUPABASE_SCHEMA.md`
- `DATABASE_SCHEMA.md`

For `seasons` specifically:
- Does it have `sport_id` (uuid FK) or `sport` (text) or BOTH?
- Does it have a `status` column? What are the allowed values?
- Are there any NOT NULL constraints that the web insert is missing?
- Are there any CHECK constraints?

For `teams`:
- Does it have `organization_id`? Is it required?
- Does it have `color`? Is it required?
- Does it have `is_active`?

For `organizations`:
- Does it have `type`? 
- Does it have `settings`?

### Task 3: Check RLS policies

The 400 could be from RLS blocking the insert. Check:
- What RLS policies exist on `seasons`? Does the user need to be in `user_roles` for the org before they can insert a season?
- What RLS policies exist on `organizations`? Can any authenticated user create an org?
- What RLS policies exist on `teams`?
- What order must inserts happen in for RLS to pass?

Check: `grep -rn "seasons\|organizations\|teams" *.sql` in the repo for any migration files.
Also check: does `CC-MOBILE-RLS-ALIGNMENT.md` in the mobile repo document the RLS policies?

### Task 4: Check the profiles.current_organization_id step

Mobile does this after creating the org:
```javascript
await supabase.from('profiles').update({ current_organization_id: org.id }).eq('id', data.userId);
```

Web does NOT do this. Could this be causing downstream issues? Does the web's `SeasonContext` or `AuthContext` depend on `profiles.current_organization_id` to scope queries?

### Task 5: Identify the exact fix

Based on your findings, document:
1. The exact root cause of the 400
2. The exact columns the web insert should send (matching mobile's working pattern)
3. The exact order of operations (matching mobile)
4. Any missing steps (like the profiles update)
5. Whether `sport_id` vs `sport` is the column mismatch

---

## DELIVERABLE

Produce: `INVESTIGATION-TM-SETUP-FIX.md` with:

1. **Root cause** — exactly why the 400 happens
2. **Side-by-side table** — mobile vs web insert payloads for every table
3. **RLS analysis** — what policies require what order
4. **Recommended fix** — exact code changes needed, in order
5. **Risk assessment** — will fixing this break anything else?

---

## CC PROMPT

```
Read CC-INVESTIGATE-TM-SETUP-400.md in the repo root. This is an investigation into why the TM Setup Wizard gets a 400 error when creating a season.

DO NOT WRITE CODE. DO NOT MODIFY FILES.

You have access to:
- Web repo: volleybrain-admin (current directory)
- Mobile repo: clone https://github.com/SgtxTorque/Volleybrain-Mobile3.git and checkout navigation-cleanup-complete

Compare the mobile's working TM setup flow against the web's broken one. Find every mismatch in column names, insert order, and RLS dependencies.

Produce INVESTIGATION-TM-SETUP-FIX.md with the exact root cause and recommended fix.
```
