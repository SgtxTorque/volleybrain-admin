# PLATFORM ADMIN COMMAND CENTER — INVESTIGATION SPEC

## Context

Carlos is the solo founder and Platform Admin (PA) of Lynx, a multi-sport youth club management SaaS. The web admin repo is `SgtxTorque/volleybrain-admin` (React/Vite, deployed to `thelynxapp.com` via Vercel) with a Supabase backend (project ID: `uqpjvbiuokwpldjvxiby`).

The platform admin section currently has 10 pages (~7,700 lines) under `src/pages/platform/` and 3 shell/nav components under `src/components/platform/`. This investigation will produce a comprehensive report covering everything CC needs to know before we write execution specs for 4 phases of PA Command Center work.

**THIS IS AN INVESTIGATION ONLY. DO NOT MODIFY ANY CODE. DO NOT CREATE ANY FILES. DO NOT MAKE ANY COMMITS.**

---

## Guardrails

1. **Read-only mode.** Do not modify, create, or delete any files in the repo. No `git commit`, no `git push`, no file writes.
2. **Run `npx tsc --noEmit` at the START** to confirm current build health before investigation.
3. **If you encounter any issue during investigation** (e.g., a file is missing, a table doesn't exist, a query pattern looks broken, a component import chain is circular), **log it in Section 11 of your report** — do NOT attempt to fix it.
4. **Use `--dangerously-skip-permissions`** for all commands.
5. **Be exhaustive.** When asked to list columns, list ALL columns with types. When asked to list imports, list ALL imports. No summaries, no "...and more". Complete data only.

---

## Investigation Tasks

### TASK 1: Full Platform Page Inventory

For EACH file in `src/pages/platform/` and `src/components/platform/`:

1. **File path and line count**
2. **All named exports** (components, functions, constants)
3. **All imports** — group by: React/router, Supabase, icons, internal components, contexts, utils
4. **All Supabase table references** — every `.from('tablename')` call with the query shape (select, insert, update, delete) and columns used
5. **All state variables** (`useState`) — name, initial value, what it controls
6. **Props received** — from parent or route
7. **Functional completeness**: Is it fully wired (data loads, actions work, saves to DB)? Or is it display-only/static/placeholder?
8. **Known issues or "coming soon" text** — any hardcoded values, TODO comments, placeholder content, static displays

Output this as a structured table per file.

---

### TASK 2: Database Schema Deep Dive

Connect to Supabase and query the ACTUAL schema for ALL platform-related tables. For each table:

Run these queries against the database using the Supabase JS client (you can use a temporary Node script that reads from the anon key — DO NOT write to the database):

```
Tables to investigate:
- platform_subscriptions
- platform_admin_actions
- platform_support_tickets
- platform_support_messages
- platform_invoices
- organizations (focus on: is_active, settings JSONB, subscription-related columns)
- profiles (focus on: is_platform_admin, any suspension/ban columns)
- user_roles (focus on: role types, is_active)
- Any other table with "platform_" prefix
```

For EACH table, report:
1. **All columns** — name, data type, nullable, default, constraints
2. **Primary key and foreign keys**
3. **Indexes** — name, columns, type (btree, unique, etc.)
4. **RLS policies** — policy name, command (SELECT/INSERT/UPDATE/DELETE), USING expression, WITH CHECK expression
5. **Row count** (approximate from `pg_stat_user_tables` or `count(*)`)
6. **Any triggers or functions** attached to the table

If you cannot directly query the schema (RLS blocks it), fall back to reading the migration files in `supabase/migrations/` and any SQL files, PLUS inferring schema from all `.from('tablename').select('column1, column2, ...')` patterns in the codebase.

---

### TASK 3: Routing and Navigation Map

1. **All platform routes** defined in `src/MainApp.jsx` — path, component, props passed
2. **PlatformTopNav NAV_SECTIONS** — every section ID and label
3. **PlatformSidebar SECTION_NAV** — every section and its nav items
4. **Gap analysis**: Are there routes without nav entries? Nav entries without routes? Dead routes?
5. **How does the platform mode get activated?** Trace the full flow from org mode → platform mode → back

---

### TASK 4: Auth and Access Control Audit

1. **How is `isPlatformAdmin` determined?** Trace from `AuthContext` → `profiles` table → how it's used in routing
2. **Which platform pages check `isPlatformAdmin` inside the component?** (vs relying on route-level guard)
3. **Are there any platform actions that DON'T log to `platform_admin_actions`?** List all write operations (insert/update/delete) across all platform pages and flag which ones have audit logging and which don't.
4. **RLS implications**: Can the platform admin actually read/write all the tables they need to? Are there org-scoping RLS policies that would block cross-org queries?

---

### TASK 5: Existing Feature Depth Assessment

For each existing platform page, rate its completeness on this scale:
- **GREEN** = Fully functional, data-driven, all CRUD works, production-ready
- **YELLOW** = Partially functional — reads data but limited write capability, or has significant missing features
- **RED** = Mostly static/placeholder, display-only, or broken

And list specifically what's missing for each:

| Page | Status | What Works | What's Missing |
|------|--------|-----------|----------------|

---

### TASK 6: Cross-Org Query Patterns

The PA needs to query across ALL organizations. Investigate:

1. **Which existing queries are already cross-org?** (no `.eq('organization_id', ...)` filter)
2. **Which queries are org-scoped that SHOULD be cross-org for PA?**
3. **Are there any RLS policies that would block cross-org reads for platform admin?**
4. **Performance concerns**: Any queries that would be slow at scale (full table scans, no pagination, no limit)?

---

### TASK 7: Design System Compliance Check

Read these reference files:
- `LYNX-UX-PHILOSOPHY.md` in repo root (if exists)
- `LynxBrandBook.html` in repo root (if exists)
- Any design token files

Check existing platform pages against the Lynx design system:
1. Are they using `useTheme()` and `useThemeClasses()` consistently?
2. Are they using the correct color tokens (lynx-navy `#10284C`, lynx-sky `#4BB9EC`)?
3. Are they using `rounded-[14px]` consistently?
4. Any hardcoded colors or styles that should be tokenized?
5. Is the navy gradient treatment (`linear-gradient(90deg, #0B1628, #162D50)`) used anywhere in platform pages?

---

### TASK 8: Edge Functions and Backend Services

1. **List all Supabase Edge Functions** in `supabase/functions/` — name, what it does, which tables it touches
2. **Which edge functions are relevant to platform admin?** (e.g., payment processing, email sending, notifications)
3. **Are there any cron jobs?** Check `supabase/migrations/` for pg_cron references
4. **Resend email integration**: How is it configured? Does the PA have any email-sending capability currently?

---

### TASK 9: Mobile App Platform Admin Audit

Check the mobile repo (`Volleybrain-Mobile3/`) for:
1. **Any platform admin screens or features** — files, routes, components
2. **Any Supabase queries that reference platform tables**
3. **Any shared services/hooks that the web platform pages could reuse patterns from**
4. **Mobile-specific tables or columns** that the PA might need visibility into (e.g., push notification tokens, mobile engagement data)

---

### TASK 10: Tables & Columns Needed (Gap Analysis)

Based on the 22-item blueprint below, identify which NEW database tables/columns would be needed. For each, specify:
1. **Table name** (follow existing naming conventions)
2. **Proposed columns** with types
3. **Which existing table it relates to** (foreign keys)
4. **Whether it needs RLS** and a proposed policy

**The 22-item blueprint:**

**Phase 1 — Foundation:**
1. Overview Dashboard upgrade (real MRR/ARR, churn, system health, error rates)
2. Org Lifecycle Manager (trial management, suspension/reactivation flows, onboarding wizard tracking)
3. User Management upgrade (impersonation, password reset trigger, merge duplicates, activity timeline)
4. Subscription & Billing upgrade (Stripe integration deepening, invoice gen, payment failure recovery, coupons/promos, refunds)
5. Platform Settings (make it LIVE — real feature flags, tier config, email templates, rate limits)
6. Notification Center (platform-wide announcements, maintenance notices, in-app banners, changelog)

**Phase 2 — Operations:**
7. Support Inbox upgrade (SLA timers, canned responses, satisfaction ratings, escalation rules)
8. Platform Email Center (mass email to all orgs/users, drip campaigns, onboarding sequences, delivery tracking)
9. Feature Request Board (voting, status tracking, roadmap view)
10. Compliance Center (COPPA tracking, data deletion requests, privacy dashboard, ToS management, consent audit)
11. Onboarding Health Tracker (per-org setup progress, time-to-value, stall alerts)
12. Audit Log upgrade (data change diffs, IP logging, session tracking, retention policies)

**Phase 3 — Growth:**
13. Revenue Analytics upgrade (MRR/ARR, cohort analysis, LTV, churn prediction, expansion revenue)
14. Engagement Analytics (DAU/WAU/MAU, feature adoption, session duration, stickiness, engagement score per org)
15. Registration Funnel (platform-wide funnel, conversion rates, drop-off points)
16. Org Health Score Engine (composite score, churn risk flags, automated alerts)
17. Data Export & Reports upgrade (scheduled reports, PDF gen, investor-ready metrics, tax reporting)
18. Content Manager (sport skill templates, default badge sets, challenge templates, shared resources)

**Phase 4 — Scale:**
19. System Health Monitor (Supabase usage, Edge Function logs, error tracking, uptime, performance alerts)
20. Database Admin Tools (row counts, storage, orphan cleanup, integrity checks, migration tracker)
21. Internal Team Management (PA access levels, permissions, team audit trails)
22. API & Integrations Hub (webhook management, third-party status, API keys, rate limits)

---

### TASK 11: Issues and Flags

Log ANY issues discovered during investigation:
- **Build errors** (from `npx tsc --noEmit` or equivalent)
- **Dead imports** — imports that reference files that don't exist
- **Broken queries** — Supabase calls that reference tables/columns that might not exist
- **Security concerns** — any platform operations that bypass RLS unsafely
- **Stale code** — the `PlatformAdminPage.jsx` (889 lines) appears to be an older version with inline tabs. Is it still used or superseded by the standalone pages?
- **Duplicate functionality** — are there overlapping capabilities between files?
- **Any hardcoded values** that should be configurable (e.g., tier prices, trial durations)

---

## Output Format

Produce your report as a single markdown document with:
1. A table of contents
2. Numbered sections matching the 11 tasks above
3. Structured tables where specified
4. Code snippets showing exact current patterns (for the execution spec to reference)
5. A final **EXECUTIVE SUMMARY** section at the top with:
   - Total files analyzed
   - Build health status
   - Critical issues found (count)
   - Database tables confirmed vs. unconfirmed
   - Top 5 risks for execution phase

**Save the report as `PA-COMMAND-CENTER-INVESTIGATION-REPORT.md` in the repo root. This is the ONLY file you may create.**

---

## How to Run This Spec

```bash
cd /path/to/volleybrain-admin
# Run all investigation tasks, output report
# DO NOT modify any existing files
# DO NOT make any commits
```

Estimated time: 20-30 minutes of investigation work.

When complete, flag any blockers or questions for Carlos to review before execution specs are written.
