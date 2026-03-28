# CC-EMAIL-INVESTIGATION: Pre-Build Audit for Email System

> **Purpose:** Investigate the volleybrain-admin web codebase and Supabase state to produce a comprehensive report. NO code changes. Read-only investigation.
> **Output:** Generate `EMAIL_INVESTIGATION_REPORT.md` in the project root with all findings.
> **Time estimate:** ~15 minutes
> **IMPORTANT:** Do NOT modify any files. Do NOT run any migrations. This is reconnaissance only.

---

## Instructions

Run each investigation task below in order. Record ALL findings in the output report. If something is unclear or you can't find what's expected, note that too. Uncertainty is useful data.

---

## TASK 1: Project Structure Audit

Map the current web admin project structure relevant to the email system integration.

```bash
# 1a. Show top-level project structure
ls -la src/

# 1b. Show the full page/route structure
find src/pages -type f -name "*.tsx" -o -name "*.jsx" | sort

# 1c. Show the full components structure
find src/components -type f -name "*.tsx" -o -name "*.jsx" | sort

# 1d. Show hooks structure
find src/hooks -type f -name "*.ts" -o -name "*.tsx" | sort

# 1e. Show utils structure
find src/utils -type f -name "*.ts" -o -name "*.tsx" | sort

# 1f. Show types structure
find src/types -type f -name "*.ts" | sort

# 1g. Check for any existing email-related files
grep -rl "email" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" -l | sort

# 1h. Check for any existing notification-related files
grep -rl "notification" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" -l | sort

# 1i. Check for any existing announcement-related files
grep -rl "announcement" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" -l | sort
```

**Report:** List every file found. Flag any existing email/notification/announcement files that we might conflict with or need to extend.

---

## TASK 2: Router & Navigation Audit

Understand how routing works so the new Email pages integrate correctly.

```bash
# 2a. Find the main router file
grep -rl "BrowserRouter\|createBrowserRouter\|Routes\|Route" src/ --include="*.tsx" --include="*.jsx" -l

# 2b. Show the full router configuration (read the file found above)
# Look for: Route definitions, layout wrappers, auth guards, role-based routing

# 2c. Find the sidebar/navigation component
grep -rl "sidebar\|Sidebar\|SideNav\|NavLink" src/ --include="*.tsx" --include="*.jsx" -l

# 2d. Read the sidebar component to understand:
#     - How nav items are structured (array of objects? hardcoded JSX?)
#     - How sections/groups are organized
#     - How active state is handled
#     - How role-based visibility works (admin vs coach)
#     - Where "Email" section would be inserted

# 2e. Check for any route guards or role-checking wrappers
grep -rl "ProtectedRoute\|RoleGuard\|RequireRole\|useRole\|isAdmin\|isCoach" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" -l
```

**Report:** Document the exact router pattern, sidebar structure, and where/how to add new routes and nav items. Include the specific file paths and line numbers where changes are needed.

---

## TASK 3: Supabase Client & Data Patterns

Understand how the app talks to Supabase so new email hooks follow the same pattern.

```bash
# 3a. Find the Supabase client setup
grep -rl "createClient\|supabase" src/ --include="*.ts" --include="*.tsx" -l | head -20

# 3b. Read the Supabase client initialization file
# Look for: how the client is created, environment variable names, any wrappers

# 3c. Find examples of existing hooks that fetch data
# Pick 2-3 hooks and read them to understand the pattern:
# - How they use supabase.from().select()
# - Error handling approach
# - Loading state management
# - Any custom wrapper (React Query? SWR? Custom hook pattern?)

# 3d. Find how Edge Functions are called (if at all)
grep -rl "functions.invoke\|edge-function\|/functions/v1" src/ --include="*.ts" --include="*.tsx" -l

# 3e. Find how file uploads work (for logo upload in email settings)
grep -rl "storage\|upload\|bucket" src/ --include="*.ts" --include="*.tsx" -l

# 3f. Check for any existing Resend or email service integration
grep -rl "resend\|sendgrid\|postmark\|email.*api\|email.*send" src/ --include="*.ts" --include="*.tsx" -l
```

**Report:** Document the exact Supabase patterns used (client import path, hook structure, error handling, loading states). Include 1-2 example hooks as reference. Note if Edge Functions are already called from the frontend and how.

---

## TASK 4: Existing Email/Notification Infrastructure

Check what's already built for emails, notifications, and announcements in the web admin.

```bash
# 4a. Search for any pages or components that interact with these tables:
#     - email_logs
#     - email_notifications
#     - notification_templates
#     - announcements
#     - announcement_reads

grep -rn "email_logs\|email_notifications\|notification_templates\|announcements\|announcement_reads" src/ --include="*.ts" --include="*.tsx" --include="*.jsx"

# 4b. Check if there's an existing announcement composer or blast system in the web admin
grep -rn "blast\|broadcast\|compose\|announcement" src/ --include="*.tsx" --include="*.jsx" -l

# 4c. Read any files found above to understand what's already built
# Is there an announcement page? A notification settings page? Any email-sending UI?

# 4d. Check if the `organizations` table email fields are already used anywhere
grep -rn "email_sender_name\|email_reply_to\|email_accent_color\|email_footer\|send_receipt_emails\|email_include_unsubscribe" src/ --include="*.ts" --include="*.tsx"

# 4e. Check for existing form patterns (for the email settings form)
grep -rl "useForm\|react-hook-form\|formik\|onChange.*setState" src/ --include="*.tsx" -l | head -10
# Read 1-2 form examples to understand the pattern
```

**Report:** Document exactly what email/notification/announcement infrastructure already exists in the web admin UI. Identify anything we'd conflict with or need to extend vs. build fresh.

---

## TASK 5: UI Component & Styling Patterns

Understand the design system so new email pages look native.

```bash
# 5a. Check for a component library or shared UI components
ls src/components/ui/ 2>/dev/null || echo "No ui/ directory"
ls src/components/shared/ 2>/dev/null || echo "No shared/ directory"
ls src/components/common/ 2>/dev/null || echo "No common/ directory"

# 5b. Check what CSS approach is used
grep -r "tailwind\|styled-components\|emotion\|css-modules\|.module.css\|.scss" package.json tailwind.config* postcss.config* vite.config* src/ --include="*.json" --include="*.js" --include="*.ts" --include="*.cjs" -l 2>/dev/null | head -15

# 5c. If Tailwind, read the config for custom theme values
cat tailwind.config.js 2>/dev/null || cat tailwind.config.ts 2>/dev/null || echo "No tailwind config found"

# 5d. Find existing table/data-table components (for the email log)
grep -rl "Table\|DataTable\|table" src/components/ --include="*.tsx" --include="*.jsx" -l

# 5e. Find existing modal/slide-over/dialog components (for template editor)
grep -rl "Modal\|Dialog\|SlideOver\|Drawer\|Sheet" src/components/ --include="*.tsx" --include="*.jsx" -l

# 5f. Find existing badge/pill/status components
grep -rl "Badge\|Pill\|Status\|Tag" src/components/ --include="*.tsx" --include="*.jsx" -l

# 5g. Find existing color picker or rich input components
grep -rl "ColorPicker\|color.*input\|HexInput" src/components/ --include="*.tsx" --include="*.jsx" -l

# 5h. Check for any existing toast/notification UI
grep -rl "toast\|Toast\|Snackbar\|notify" src/ --include="*.tsx" --include="*.ts" -l

# 5i. Read the most recently created/modified page to understand current patterns
# (Find a page that looks recently built and read its structure)
ls -lt src/pages/**/*.tsx 2>/dev/null | head -10
```

**Report:** Document the CSS approach, available shared components (tables, modals, badges, forms, toasts), and the general page structure pattern. Identify any components we can reuse vs. need to build.

---

## TASK 6: Existing RLS Policies Check

Before we add new policies, check what already exists to avoid conflicts.

```bash
# This requires Supabase access. If you can run SQL via the Supabase client:
# If not, skip this task and note it as "requires manual SQL check"

# Check existing policies on the tables we're extending:
# Run in Supabase SQL Editor:

# SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
# FROM pg_policies
# WHERE tablename IN ('notification_templates', 'email_notifications', 'email_logs', 'organizations', 'announcements')
# ORDER BY tablename, policyname;
```

**Report:** List all existing RLS policies on the tables we plan to extend. Flag any that might conflict with the new policies in CC-EMAIL-SYSTEM-V2.

---

## TASK 7: Package Dependencies Check

Verify what's already installed and what we'll need to add.

```bash
# 7a. Check current dependencies
cat package.json | grep -A 200 '"dependencies"' | head -60

# 7b. Check for any email-related packages
grep -i "email\|resend\|sendgrid\|nodemailer\|mjml\|react-email" package.json

# 7c. Check for rich text editor packages (for broadcast body composer)
grep -i "editor\|quill\|tiptap\|slate\|draft-js\|lexical\|prosemirror\|tinymce" package.json

# 7d. Check for color picker packages
grep -i "color\|picker\|spectrum" package.json

# 7e. Check the Supabase version
grep "supabase" package.json
```

**Report:** List relevant installed packages. Note what we may need to add (color picker, rich text editor if desired, etc.).

---

## TASK 8: Edge Functions Check

Check if Supabase Edge Functions already exist in the project.

```bash
# 8a. Check for supabase functions directory
ls -la supabase/ 2>/dev/null || echo "No supabase/ directory at root"
ls -la supabase/functions/ 2>/dev/null || echo "No functions/ directory"
find . -path "*/supabase/functions/*" -name "index.ts" 2>/dev/null

# 8b. Check for any existing Edge Function configurations
cat supabase/config.toml 2>/dev/null || echo "No config.toml"

# 8c. Check .env or environment files for Supabase URLs and keys
ls -la .env* 2>/dev/null
grep "SUPABASE\|RESEND\|EMAIL" .env* 2>/dev/null || echo "No relevant env vars found"
# DO NOT output actual secret values, just note which variables exist
```

**Report:** Document whether Edge Functions are already set up, what functions exist, and the environment variable situation.

---

## TASK 9: Announcements & Blast System Deep Dive

Since broadcasts will integrate with the existing announcements system, we need to understand it fully.

```bash
# 9a. Find all files related to announcements/blasts
find src/ -type f \( -name "*nnouncement*" -o -name "*last*" -o -name "*roadcast*" \) | sort

# 9b. Read any announcement-related pages
# Look for: how announcements are created, what fields are used, 
# how targeting works, how they're displayed

# 9c. Check how the announcements table is queried
grep -rn "announcements" src/ --include="*.ts" --include="*.tsx" | grep -i "from\|select\|insert\|update"

# 9d. Check if there's audience targeting UI already built
grep -rn "target_type\|target_team\|audience\|recipient" src/ --include="*.tsx" | head -20
```

**Report:** Document the current announcements system -- what UI exists, how it creates records, how targeting works. Identify exactly how the email broadcast should integrate (extend the existing compose flow? separate page that also creates an announcement? etc.).

---

## TASK 10: Risk Assessment

Based on everything found above, identify risks.

**Check for:**
1. **Table conflicts:** Are `email_notifications` or `notification_templates` actively queried in ways that would break if we add columns?
2. **RLS conflicts:** Would new policies contradict existing ones?
3. **Route conflicts:** Would `/email/*` routes collide with anything?
4. **Component conflicts:** Any existing email components we'd shadow?
5. **State management:** Does the app use Redux, Zustand, Context, or just local state? Will email state need to integrate with a global store?
6. **Auth pattern:** How does the app know if the current user is an admin vs. coach? Where is this role info stored/accessed?
7. **Build/deploy pipeline:** Any CI/CD or deployment considerations?

---

## OUTPUT FORMAT

Generate `EMAIL_INVESTIGATION_REPORT.md` with this structure:

```markdown
# Email System Investigation Report
Generated: [date]
Codebase: volleybrain-admin (web)

## 1. Project Structure
[findings]

## 2. Router & Navigation
### Router Pattern
[how routing works, file paths]
### Sidebar Structure  
[how nav items work, where to add Email section, line numbers]
### Role Guards
[how role-based access works]

## 3. Supabase Patterns
### Client Setup
[import path, initialization]
### Hook Pattern
[example hook structure]
### Edge Function Calls
[how/if they're called from frontend]
### File Upload Pattern
[how uploads work, if at all]

## 4. Existing Email/Notification Infrastructure
### Tables Already Queried
[which of our target tables are already used in the UI]
### Existing UI
[any email/notification/announcement pages or components]
### Conflicts & Overlap
[anything that would conflict with the email system build]

## 5. UI & Styling
### CSS Approach
[Tailwind? Custom? Theme config?]
### Reusable Components
[tables, modals, forms, badges we can use]
### Page Structure Pattern
[how pages are typically structured]

## 6. RLS Policies
[existing policies on our target tables, conflict risks]

## 7. Dependencies
### Installed
[relevant packages]
### Needed
[packages to add]

## 8. Edge Functions
[current state, setup needed]

## 9. Announcements System
### Current State
[what exists, how it works]
### Integration Plan
[how email broadcasts should connect]

## 10. Risk Register
| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | ... | High/Med/Low | ... |
| 2 | ... | ... | ... |

## 11. Files That Will Be Modified
[Complete list of existing files that need changes, with line numbers where possible]

## 12. Files That Will Be Created
[Complete list of new files the email system will add]

## 13. Open Questions
[Anything that couldn't be determined from code alone and needs Carlos's input]
```

---

## FINAL REMINDER

- **Do NOT modify any files.** This is read-only.
- **Do NOT run migrations.** Database changes come later.
- **Do NOT install packages.** Just note what's needed.
- Be thorough. If a file is relevant, read it. If a pattern is unclear, say so.
- When in doubt, include more detail rather than less.
- Save the report as `EMAIL_INVESTIGATION_REPORT.md` in the project root.
