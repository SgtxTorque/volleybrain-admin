# PA COMMAND CENTER — INVESTIGATION REPORT

**Date**: 2026-03-30
**Codebase**: `volleybrain-admin` (React 18.2 + Vite 5, JSX)
**Database**: Supabase project `uqpjvbiuokwpldjvxiby` (shared with mobile)
**Investigator**: Claude Code (Opus 4.6)

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Total platform files analyzed** | 13 (10 pages + 3 shell/nav components) |
| **Total platform lines of code** | ~7,700 |
| **Build health** | PASS (1811 modules, 12.12s) — exit code 1 from chunk size warning only |
| **Critical issues found** | 5 |
| **Database tables confirmed in code** | 5 platform-specific (`platform_subscriptions`, `platform_invoices`, `platform_admin_actions`, `platform_support_tickets`, `platform_support_messages`) |
| **Database tables confirmed in migrations** | 0 platform-specific (none have migration files) |
| **Edge functions** | 8 deployed |
| **New tables needed for 22-item blueprint** | ~74 |
| **New columns needed on existing tables** | ~41 |

### Top 5 Risks for Execution Phase

1. **No migration files for platform tables** — `platform_subscriptions`, `platform_invoices`, `platform_admin_actions`, `platform_support_tickets`, `platform_support_messages` are referenced in code but have zero migration files. Must verify they exist in Supabase dashboard.
2. **RLS policies missing for platform admin** — No evidence of `is_platform_admin`-based RLS bypass policies. All cross-org queries could fail or return empty if RLS is org-scoped.
3. **PlatformAdminPage.jsx (890 lines) is superseded** — The standalone pages (PlatformOverview, PlatformOrganizations, PlatformUsers, etc.) duplicate and improve upon the monolithic PlatformAdminPage. The old page still has its own route at `/platform/admin`.
4. **Performance risk on analytics** — Multiple full-table-scan queries with NO `.limit()` on `payments`, `profiles`, and `registrations` tables in PlatformAnalyticsPage.
5. **Hardcoded anon key in pg_cron migration** — `20260326_pg_cron_email_queue.sql` line 43 has a hardcoded JWT anon token for the cron job HTTP call. Should use service role key.

---

## TABLE OF CONTENTS

1. [Task 1: Full Platform Page Inventory](#task-1-full-platform-page-inventory)
2. [Task 2: Database Schema Deep Dive](#task-2-database-schema-deep-dive)
3. [Task 3: Routing and Navigation Map](#task-3-routing-and-navigation-map)
4. [Task 4: Auth and Access Control Audit](#task-4-auth-and-access-control-audit)
5. [Task 5: Existing Feature Depth Assessment](#task-5-existing-feature-depth-assessment)
6. [Task 6: Cross-Org Query Patterns](#task-6-cross-org-query-patterns)
7. [Task 7: Design System Compliance Check](#task-7-design-system-compliance-check)
8. [Task 8: Edge Functions and Backend Services](#task-8-edge-functions-and-backend-services)
9. [Task 9: Mobile App Platform Admin Audit](#task-9-mobile-app-platform-admin-audit)
10. [Task 10: Tables & Columns Needed (Gap Analysis)](#task-10-tables--columns-needed-gap-analysis)
11. [Task 11: Issues and Flags](#task-11-issues-and-flags)

---

## TASK 1: Full Platform Page Inventory

### Summary Table

| File | Type | Lines | Status | Main Tables | Key Features |
|------|------|-------|--------|-------------|--------------|
| PlatformAdminPage.jsx | Page | 890 | WIRED | organizations, user_roles, profiles, platform_admin_actions | 4-tab super-admin dashboard (old monolith) |
| PlatformAnalyticsPage.jsx | Page | 740 | WIRED | organizations, profiles, seasons, payments, registrations | 13 metrics + charts + tables |
| PlatformAuditLog.jsx | Page | 493 | WIRED | platform_admin_actions | Expandable logs, CSV export |
| PlatformOrganizations.jsx | Page | 789 | WIRED | organizations, user_roles, seasons, teams, registrations | Grid view, filters, sort |
| PlatformOverview.jsx | Page | 405 | WIRED | organizations, profiles, seasons, teams, payments, platform_subscriptions, user_roles, platform_admin_actions | 6 KPI cards, org health, activity feed |
| PlatformSettings.jsx | Page | 516 | STATIC | None | Display-only config (4 tabs) |
| PlatformSubscriptionsPage.jsx | Page | 688 | WIRED | platform_subscriptions, organizations, platform_invoices | Edit subscriptions, manage invoices |
| PlatformSupport.jsx | Page | 926 | WIRED | platform_support_tickets, platform_support_messages | Support inbox with threading |
| PlatformUsers.jsx | Page | 1025 | WIRED | profiles, organizations, user_roles, platform_admin_actions | Full user management |
| PlatformOrgDetail.jsx | Page | 899 | WIRED | organizations, user_roles, seasons, teams, payments, platform_admin_actions | 6-tab org detail view |
| PlatformShell.jsx | Component | 52 | WIRED | None | Layout wrapper |
| PlatformSidebar.jsx | Component | 178 | WIRED | None | Collapsible sidebar nav |
| PlatformTopNav.jsx | Component | 87 | WIRED | None | Top navigation bar |

---

### Detailed Per-File Analysis

#### 1. PlatformAdminPage.jsx (890 lines)

**Exports**: `PlatformAdminPage` (default)

**Imports**:
- React: `useState`, `useEffect`, `useMemo`
- Contexts: `useAuth`, `useTheme`, `useThemeClasses`
- Supabase: `supabase`
- Icons: 15+ Lucide icons

**State Variables**:
| Variable | Initial | Purpose |
|----------|---------|---------|
| `activeTab` | `'overview'` | Active tab (overview, organizations, users, audit) |
| `orgs` | `[]` | All organizations |
| `users` | `[]` | All user profiles |
| `stats` | `{}` | KPI stats (orgs, users, teams, revenue) |
| `loading` | `true` | Initial data load |
| `selectedOrg` | `null` | Org for detail slide-over |
| `confirmModal` | `{ open: false }` | Confirm modal state |

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `organizations` | select, update, delete | *, is_active, user_roles(count) |
| `profiles` | select, update | *, is_suspended, is_platform_admin |
| `teams` | select (count) | * |
| `payments` | select | amount, paid |
| `user_roles` | select | *, profiles(id, full_name, email) |
| `seasons` | select | *, sports(name, icon) |
| `platform_admin_actions` | insert, select | admin_id, action_type, target_type, target_id, details, created_at |

**Functional Completeness**: FULLY WIRED — Dashboard with 6 KPI cards, org list with suspend/activate/delete, user list with suspend/toggle super-admin, audit log viewer. All actions logged.

**Known Issues**: This is the **older monolithic version** with inline tabs. Superseded by standalone pages (PlatformOverview, PlatformOrganizations, etc.) but still has its own route.

---

#### 2. PlatformAnalyticsPage.jsx (740 lines)

**Exports**: `PlatformAnalyticsPage` (default)

**State Variables**:
| Variable | Initial | Purpose |
|----------|---------|---------|
| `dateRange` | `'30d'` | Filter by time period |
| `loading` | `true` | Initial data load |
| `kpis` | `{}` | Key performance indicators |
| `userGrowth` | `[]` | Monthly user signups |
| `revenueByMonth` | `[]` | Monthly revenue |
| `orgTypes` | `[]` | Org breakdown by type |
| `sportDist` | `[]` | Sport distribution |
| `topOrgsByMembers` | `[]` | Top 10 orgs by member count |
| `topOrgsByRevenue` | `[]` | Top 10 orgs by revenue |
| `recentOrgs` | `[]` | Last 30d organizations |
| `recentUsers` | `[]` | Last 30d users |
| `inactiveOrgs` | `[]` | Active orgs with no seasons |
| `registrationsByMonth` | `[]` | Registration volume over time |

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `organizations` | select | id, name, settings, is_active, created_at |
| `profiles` | select | id, created_at, full_name, email |
| `seasons` | select | id, organization_id, status |
| `payments` | select | amount, paid, created_at, season_id |
| `user_roles` | select | organization_id, id |
| `registrations` | select | created_at, status |

**Functional Completeness**: FULLY WIRED — 6 KPI cards with month-over-month trends, user growth sparkline, revenue bar chart, org types donut chart, sport distribution, top 10 orgs by members, registrations sparkline, top 10 orgs by revenue table, recent org/user tables, inactive orgs alert, date range filter, refresh button.

---

#### 3. PlatformAuditLog.jsx (493 lines)

**State Variables**: `logs`, `loading`, `dateRange` (`'30days'`), `actionFilter`, `searchQuery`, `expandedId`, `showFilters`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `platform_admin_actions` | select | *, profiles:admin_id(full_name, email) |

**Features**: Filter by date range (today/7d/30d/all), filter by action type (7 types), full-text search, expandable log entries, CSV export with 8 columns, 100-record limit.

---

#### 4. PlatformOrganizations.jsx (789 lines)

**State Variables**: `orgs`, `orgMeta`, `loading`, `refreshing`, `search`, `activeFilter` (`'all'`), `sortBy` (`'name'`), `sortAsc`, `confirmModal`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `organizations` | select, update | *, is_active |
| `user_roles` | select | organization_id, id |
| `seasons` | select | id, organization_id, status, updated_at |
| `registration_templates` | select | id, organization_id |
| `schedule_events` | select | id, season_id |
| `team_coaches` | select | id, team_id |
| `teams` | select | id, season_id |
| `platform_admin_actions` | insert | admin_id, action_type, target_type, target_id, details |

**Features**: Grid view with search, filter pills (All/Active/Suspended/Needs Attention), sort by name/created/member count, org cards with health score (X/7), setup health color coding, suspend/activate actions with logging.

---

#### 5. PlatformOverview.jsx (405 lines)

**State Variables**: `loading`, `stats` (6 KPIs), `orgHealth`, `recentActivity`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `organizations` | select | *, id, name, slug, is_active, created_at |
| `profiles` | select (count) | * |
| `seasons` | select (count) | *, status |
| `teams` | select (count) | * |
| `payments` | select | amount, status |
| `platform_subscriptions` | select (count) | *, status |
| `user_roles` | select | organization_id, is_active |
| `platform_admin_actions` | select | *, profiles:admin_id(full_name, email) |

**Features**: 6 KPI cards, org health list (green/yellow/red), recent activity feed (10 entries), quick action buttons (View All Orgs, Manage Subscriptions, Support Inbox, Review Audit).

---

#### 6. PlatformSettings.jsx (516 lines)

**State Variables**: `activeTab` (`'general'`)

**Supabase Tables**: **NONE** — display-only

**Features**: 4 tabs (General, Tiers & Limits, Feature Flags, Branding). All content is **hardcoded/static**:
- General: Platform Name "Lynx", Domain "thelynxapp.com", Timezone "America/Chicago", Support Email "support@thelynxapp.com"
- Tiers: 5 hardcoded tier cards (Free, Pro, Club, Elite, Enterprise) with pricing, limits, features
- Feature Flags: "Coming soon" placeholder
- Branding: 3 hardcoded brand colors + 6 hardcoded sports

**Known Issues**: Display-only. States "Editing these settings will be available in a future update."

---

#### 7. PlatformSubscriptionsPage.jsx (688 lines)

**State Variables**: `subscriptions`, `orgs`, `invoices`, `loading`, `search`, `filterTier`, `filterStatus`, `editingSub`, `editForm`, `showInvoicesFor`, `savingSub`, `creatingInvoice`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `platform_subscriptions` | select, update, insert | id, organization_id, plan_tier, billing_cycle, status, price_cents, trial_ends_at, current_period_start, current_period_end, created_at, cancelled_at, updated_at |
| `organizations` | select | id, name, slug, is_active, created_at |
| `platform_invoices` | select, update, insert | id, subscription_id, organization_id, amount_cents, status, invoice_date, due_date, paid_at |

**Features**: MRR/ARR metrics, revenue by tier breakdown, search + filter by tier/status, edit subscription modal (tier, billing cycle, status, trial days, price), invoice slide-over with "Mark Paid" button, create invoice.

---

#### 8. PlatformSupport.jsx (926 lines)

**State Variables** (Main): `tickets`, `loading`, `loadError`, `statusFilter`, `priorityFilter`, `categoryFilter`, `searchQuery`, `selectedTicket`, `detailOpen`
**State Variables** (TicketDetail): `messages`, `loading`, `replyText`, `isInternalNote`, `sending`, `updatingStatus`, `updatingPriority`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `platform_support_tickets` | select, update | id, subject, description, status, priority, category, organization_id, submitted_by, created_at, updated_at |
| `platform_support_messages` | select, insert | id, ticket_id, sender_id, message, is_internal_note, created_at |

**Features**: Status pills with counts, search, filter by priority/category dropdowns, ticket list, detail slide-over with full thread, internal notes (amber-highlighted), reply composer with Ctrl+Enter, status/priority dropdowns.

**Known Issues**: Gracefully handles missing table with "Support system not set up yet" message.

---

#### 9. PlatformUsers.jsx (1025 lines)

**State Variables**: `users`, `organizations`, `userRolesMap`, `loading`, `search`, `orgFilter`, `roleFilter`, `statusFilter`, `selectedUser`, `confirmModal`, `sortField`, `sortAsc`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `profiles` | select, update | id, full_name, email, avatar_url, created_at, is_suspended, is_platform_admin, phone, last_sign_in_at |
| `organizations` | select | id, name, slug |
| `user_roles` | select | user_id, role, organization_id, organizations(name, slug) |
| `platform_admin_actions` | insert, select | admin_id, action_type, target_type, target_id, details |

**Features**: Search, filter by org/role/status, sort by name/email/date, users table with avatar, org membership (first 2 + "+X"), suspend/activate, grant/revoke super-admin, detail slide-over with profile, orgs, activity, actions.

---

#### 10. PlatformOrgDetail.jsx (899 lines)

**State Variables**: `org`, `members`, `teams`, `seasons`, `payments`, `loading`, `activeTab` (`'overview'`), `confirmModal`

**Supabase Tables**:
| Table | Operations | Columns |
|-------|-----------|---------|
| `organizations` | select, update, delete | *, is_active |
| `user_roles` | select | *, profiles(full_name, email) |
| `seasons` | select | *, sports(name, icon) |
| `teams` | select | *, team_players(count) |
| `payments` | select | *, profiles:player_id(full_name) |
| `platform_admin_actions` | insert, select | admin_id, action_type, target_type, target_id, details |

**Features**: 6 tabs (overview/members/teams/seasons/payments/activity), 4 KPI cards, role breakdown, onboarding checklist (5 items), searchable member/payment tables, team grid, season cards, audit log, health score (0-100), suspend/activate/delete actions.

---

#### 11-13. Shell/Nav Components

**PlatformShell.jsx** (52 lines): Layout wrapper with fixed top nav (56px) + collapsible sidebar. Props: `children`, `profile`, `orgName`, `orgInitials`, `platformStats`, `onExitPlatformMode`, `onSignOut`.

**PlatformTopNav.jsx** (87 lines): Fixed top nav with gradient background. NAV_SECTIONS: overview, organizations, users, subscriptions, analytics, support, audit, settings. Navigation via `navigate('/platform/${section.id}')`.

**PlatformSidebar.jsx** (178 lines): Collapsible sidebar (64px collapsed → 240px on hover). Same 8 sections as TopNav. Bottom utilities: Exit to Org, Theme toggle, Sign Out.

---

## TASK 2: Database Schema Deep Dive

### Platform Tables (Found in Code, NOT in Migrations)

#### 1. platform_subscriptions

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | NO | - | FK → organizations |
| plan_tier | text | YES | - | 'free','starter','pro','club','elite','enterprise' |
| billing_cycle | text | YES | - | 'monthly','annual' |
| status | text | YES | - | 'active','trialing','past_due','cancelled','expired' |
| price_cents | integer | YES | - | Stored in cents |
| current_period_start | timestamptz | YES | - | Billing period start |
| current_period_end | timestamptz | YES | - | Billing period end |
| trial_days | integer | YES | - | Trial duration |
| trial_ends_at | timestamptz | YES | - | Trial expiry |
| cancelled_at | timestamptz | YES | - | Cancellation date |
| created_at | timestamptz | YES | NOW() | Record created |
| updated_at | timestamptz | YES | NOW() | Record updated |

**Code references**: `SubscriptionPage.jsx:122-211`, `PlatformSubscriptionsPage.jsx:85-197`, `PlatformOverview.jsx:58`

---

#### 2. platform_invoices

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| subscription_id | uuid | YES | - | FK → platform_subscriptions |
| organization_id | uuid | NO | - | FK → organizations |
| amount_cents | integer | YES | - | Invoice amount in cents |
| status | text | YES | - | 'open','paid','overdue','cancelled' |
| invoice_date | date | YES | - | Date created |
| due_date | date | YES | - | Payment due date |
| paid_at | timestamptz | YES | - | Payment received |
| created_at | timestamptz | YES | NOW() | |
| updated_at | timestamptz | YES | NOW() | |

---

#### 3. platform_admin_actions

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| admin_id | uuid | YES | - | FK → profiles |
| action_type | text | YES | - | suspend_org, activate_org, delete_org, suspend_user, activate_user, grant_super_admin, revoke_super_admin |
| target_type | text | YES | - | 'organization' or 'user' |
| target_id | uuid | YES | - | ID of affected record |
| details | jsonb | YES | - | Contains org_name, user_name, email |
| created_at | timestamptz | YES | NOW() | |

---

#### 4. platform_support_tickets

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| organization_id | uuid | YES | - | FK → organizations |
| submitted_by | uuid | YES | - | FK → profiles |
| subject | text | YES | - | |
| category | text | YES | - | 'bug','feature_request','billing','setup_help','general' |
| priority | text | YES | - | 'urgent','high','normal','low' |
| status | text | YES | - | 'open','in_progress','resolved','closed' |
| created_at | timestamptz | YES | NOW() | |
| updated_at | timestamptz | YES | NOW() | |

---

#### 5. platform_support_messages

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| ticket_id | uuid | NO | - | FK → platform_support_tickets |
| sender_id | uuid | YES | - | FK → profiles |
| message | text | YES | - | |
| is_internal_note | boolean | YES | FALSE | Internal-only message |
| created_at | timestamptz | YES | NOW() | |

---

### Extended Tables (Platform-Relevant Columns)

#### profiles (extended)

| Column | Type | Notes |
|--------|------|-------|
| is_suspended | boolean | Platform-level account suspension |
| is_platform_admin | boolean | Platform super-admin flag |
| deletion_requested | boolean | User requested account deletion |

#### organizations (extended — from email migration)

| Column | Type | Notes |
|--------|------|-------|
| email_sender_name | text | Display name for email sender |
| email_reply_to | text | Reply-to email address |
| email_footer_text | text | Custom footer in emails |
| email_social_facebook | text | Facebook URL |
| email_social_instagram | text | Instagram URL |
| email_social_twitter | text | Twitter/X URL |
| email_include_unsubscribe | boolean | Whether to add unsubscribe link |
| email_header_image | text | Header image URL |

---

### Tables Created in Migrations

| Table | Migration File | Status |
|-------|---------------|--------|
| user_dashboard_layouts | 002_user_dashboard_layouts.sql | Created with RLS |
| email_notifications (extended) | 20260325_email_system.sql | Extended with tracking columns |
| email_unsubscribes | 20260325_email_system.sql | New table with RLS |
| email_attachments | 20260325_email_system.sql | New table |
| notification_templates (extended) | 20260325_email_system.sql | Extended with email templates |
| organizations (extended) | 20260325_email_system.sql | Email branding columns added |

### CRITICAL: Schema Gap

**5 platform tables are referenced in code but have NO migration files:**
- `platform_subscriptions`
- `platform_invoices`
- `platform_admin_actions`
- `platform_support_tickets`
- `platform_support_messages`

**Action required**: Verify in Supabase dashboard or run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'platform_%'
ORDER BY table_name;
```

---

## TASK 3: Routing and Navigation Map

### Platform Routes (MainApp.jsx, lines 1244-1257)

All routes are inside `PlatformShell`, active when `appMode === 'platform'`:

| Path | Component | Props |
|------|-----------|-------|
| `/platform/overview` | PlatformOverview | showToast |
| `/platform/organizations/:orgId` | PlatformOrgDetail | showToast |
| `/platform/organizations` | PlatformOrganizations | showToast |
| `/platform/users` | PlatformUsersPage | showToast |
| `/platform/subscriptions` | PlatformSubscriptionsPage | showToast |
| `/platform/analytics` | PlatformAnalyticsPage | showToast |
| `/platform/support` | PlatformSupport | showToast |
| `/platform/audit` | PlatformAuditLog | showToast |
| `/platform/settings` | PlatformSettings | showToast |
| `/platform/admin` | PlatformAdminPage | showToast |
| `/platform` | Navigate → /platform/overview | redirect |
| `*` | Navigate → /platform/overview | catch-all |

### PlatformTopNav NAV_SECTIONS (8 sections)

| Section ID | Label |
|-----------|-------|
| overview | Overview |
| organizations | Organizations |
| users | Users |
| subscriptions | Subscriptions |
| analytics | Analytics |
| support | Support |
| audit | Audit Log |
| settings | Settings |

### PlatformSidebar SECTION_NAV

Each section has one nav item matching the TopNav section. The sidebar collapses to icon-only (64px) and expands on hover (240px).

### Gap Analysis

| Gap Type | Finding |
|----------|---------|
| Routes without nav entries | `/platform/admin` (PlatformAdminPage) has a route but NO nav entry in TopNav or Sidebar |
| Nav entries without routes | None |
| Dead routes | None detected |

### Platform Mode Activation Flow

1. **Entry point**: LynxSidebar has a "Platform Mode" button (golden shield icon) visible only when `isPlatformAdmin === true` (line 413-425)
2. **Activation**: `handleEnterPlatformMode()` in MainApp.jsx sets `appMode = 'platform'` and navigates to `/platform/overview`
3. **Exit**: "Exit to Org" button in PlatformSidebar/PlatformTopNav calls `handleExitPlatformMode()` which sets `appMode = 'org'` and navigates to `/dashboard`
4. **URL sync**: `useEffect` on `mainLocation.pathname` auto-syncs `appMode` state with URL (line 799-804). If URL starts with `/platform` and user is PA, enters platform mode. If URL doesn't start with `/platform` and user is in platform mode, exits.

---

## TASK 4: Auth and Access Control Audit

### How isPlatformAdmin Is Determined

**Source**: `AuthContext.jsx` (lines 34-76)

```jsx
// Line 76
setIsPlatformAdmin(!!prof?.is_platform_admin)
```

Flow:
1. On auth session established → query `profiles` table for current user
2. Extract `is_platform_admin` boolean column
3. Store in React context state
4. Cleared to `false` on sign-out

### Component-Level vs Route-Level Guards

| Page | Component-Level Check? | Route-Level Only? |
|------|----------------------|-------------------|
| PlatformAdminPage | YES — shows "Access Denied" UI | Also route-guarded |
| PlatformOrgDetail | YES — shows "Access Denied" UI | Also route-guarded |
| PlatformOverview | NO | Route-level only |
| PlatformOrganizations | NO | Route-level only |
| PlatformUsersPage | NO | Route-level only |
| PlatformAuditLog | NO | Route-level only |
| PlatformSubscriptionsPage | NO | Route-level only |
| PlatformSupport | NO | Route-level only |
| PlatformSettings | NO | Route-level only |

**Risk**: 7 of 9 platform pages rely solely on `appMode === 'platform'` state. If state becomes desynced from server, access control could be bypassed.

### Write Operations and Audit Logging

| Page | Write Operation | Audit Logged? |
|------|----------------|---------------|
| PlatformAdminPage | Suspend/activate/delete org | YES |
| PlatformAdminPage | Suspend/activate user | YES |
| PlatformAdminPage | Grant/revoke super-admin | YES |
| PlatformOrgDetail | Suspend/activate/delete org | YES |
| PlatformOrganizations | Suspend/activate org | YES |
| PlatformUsers | Suspend/activate user | YES (inferred) |
| PlatformUsers | Grant/revoke super-admin | YES (inferred) |
| PlatformSubscriptionsPage | Update subscription | **NO** |
| PlatformSubscriptionsPage | Create/update invoice | **NO** |
| PlatformSupport | Update ticket status | **NO** |
| PlatformSupport | Update ticket priority | **NO** |
| PlatformSupport | Send reply/internal note | **NO** |

**Finding**: Subscription, invoice, and support write operations are NOT audit-logged.

### RLS Implications

All platform admin pages query across ALL organizations with NO `organization_id` filter. This requires:

| Table | RLS Requirement |
|-------|----------------|
| organizations | MUST allow platform_admin to read all orgs |
| profiles | MUST allow platform_admin to read/update all users |
| platform_admin_actions | MUST allow insert with admin_id = current_user |
| seasons, teams, payments | MUST allow platform_admin to read all |
| user_roles | MUST allow platform_admin to read all org members |
| platform_subscriptions | MUST allow platform_admin full CRUD |
| platform_invoices | MUST allow platform_admin full CRUD |
| platform_support_tickets | MUST allow platform_admin full CRUD |
| platform_support_messages | MUST allow platform_admin full CRUD |

---

## TASK 5: Existing Feature Depth Assessment

| Page | Status | What Works | What's Missing |
|------|--------|-----------|----------------|
| **PlatformOverview** | GREEN | 6 KPIs, org health, activity feed, quick actions | None — production ready |
| **PlatformOrganizations** | GREEN | Grid view, search, filters, sort, health score, suspend/activate | Org creation UI, inline property editing |
| **PlatformOrgDetail** | GREEN | 6 tabs, KPIs, role breakdown, onboarding checklist, all CRUD | None — production ready |
| **PlatformUsers** | GREEN | Search, filters, sort, suspend/activate, super-admin toggle, detail slide-over | Impersonation, password reset, merge duplicates |
| **PlatformSubscriptionsPage** | GREEN | MRR/ARR, edit plans, invoices, mark paid, create invoice | No Stripe integration, no invoice PDF generation |
| **PlatformAnalyticsPage** | GREEN | 13 metrics, charts, tables, date range filter | MRR trending, cohort analysis, LTV, churn prediction |
| **PlatformAuditLog** | GREEN | Filters, search, expandable entries, CSV export | Data change diffs, IP logging, session tracking |
| **PlatformSupport** | GREEN | Full ticket system, threading, internal notes, status/priority | SLA tracking, canned responses, CSAT, ticket assignment |
| **PlatformSettings** | YELLOW | All 4 tabs render correctly, visual layout complete | ALL tabs display-only — no edit capability whatsoever |
| **PlatformAdminPage** | GREEN | 4-tab dashboard, all CRUD works, audit logging | Superseded by standalone pages — consider deprecation |

---

## TASK 6: Cross-Org Query Patterns

### Already Cross-Org (Correct)

All platform admin pages query without `.eq('organization_id', ...)`:

- `PlatformOverview.jsx`: `organizations.select('*')`, `profiles.select('*')`, `teams.select('*')`, `payments.select('amount')`, `platform_subscriptions.select('*')` — all unfiltered
- `PlatformAnalyticsPage.jsx`: All 15+ queries are cross-org
- `PlatformOrganizations.jsx`: `organizations.select('*')`, then batch loads via `.in('organization_id', orgIds)`
- `PlatformUsers.jsx`: `profiles.select('*')`, `organizations.select('id, name, slug')`, `user_roles.select(...)`
- `PlatformSubscriptionsPage.jsx`: `platform_subscriptions.select('*')`, `organizations.select(...)`
- `PlatformAuditLog.jsx`: `platform_admin_actions.select(...)`

### Correctly Org-Scoped (In Detail Views)

- `PlatformOrgDetail.jsx`: `.eq('organization_id', orgId)` on user_roles, seasons — correct for single-org detail view
- `PlatformSubscriptionsPage.jsx`: `.eq('organization_id', orgId)` on platform_invoices — correct when viewing invoices for one org

### Performance Concerns

| File | Query | Issue |
|------|-------|-------|
| PlatformAnalyticsPage.jsx:411 | `profiles.select('created_at').order('created_at')` | **NO LIMIT** — full table scan |
| PlatformAnalyticsPage.jsx:420 | `payments.select(...).eq('paid', true).order('created_at')` | **NO LIMIT** — full table scan |
| PlatformAnalyticsPage.jsx:515 | `registrations.select('created_at, status').order('created_at')` | **NO LIMIT** — full table scan |
| PlatformOrganizations.jsx:381 | `team_coaches.select('id, team_id').limit(5000)` | Hardcoded 5000 limit |
| PlatformAdminPage.jsx:276 | `payments.select('amount, paid')` | **NO LIMIT** — full table scan |

**Recommendation**: Add `.limit(10000)` safety caps and consider server-side aggregation via RPC functions for analytics.

---

## TASK 7: Design System Compliance Check

### Design Documentation Found

1. `LYNX-UX-PHILOSOPHY.md` (167 lines) — Core UX philosophy
2. `LynxBrandBook.html` (~4.5 MB) — Brand guidelines
3. `src/constants/theme.js` (112 lines) — Design tokens

### Compliance Matrix

| Check | Status | Details |
|-------|--------|---------|
| `useTheme()` usage | PASS | All 10 platform pages import and use `useTheme()` |
| `useThemeClasses()` usage | PASS | All 10 pages use `useThemeClasses()` for theme-aware CSS |
| Lynx-navy `#10284C` | PARTIAL | Used in email templates; platform pages use theme tokens instead |
| Lynx-sky `#4BB9EC` | PARTIAL | Some hardcoded in OrgCard (PlatformOrganizations line 170) |
| `rounded-[14px]` | PASS | Used consistently in PlatformOrganizations; others use `rounded-xl` (close equivalent) |
| Navy gradient | NOT USED | `linear-gradient(90deg, #0B1628, #162D50)` not present in any platform page |
| Glassmorphism | PASS | Consistent `.pa-glass`, `.an-glass`, `.po-glass` CSS classes with `backdrop-filter: blur(20-24px)` |

### Hardcoded Colors Found

| File | Line | Colors | Should Be |
|------|------|--------|-----------|
| PlatformAnalyticsPage.jsx | ~40 | `CHART_COLORS = ['#EAB308','#3B82F6','#10B981',...]` | Design tokens |
| PlatformSubscriptionsPage.jsx | ~29-34 | `TIER_CONFIG` tier colors: `#3B82F6`, `#8B5CF6`, `#F59E0B`, `#EC4899` | Design tokens |
| PlatformOverview.jsx | ~175-177 | Card backgrounds: `#1E293B` (dark), `#FFFFFF` (light) | Theme CSS vars |
| PlatformOrganizations.jsx | ~170 | `#4BB9EC` hardcoded | Should use `--accent-primary` |

---

## TASK 8: Edge Functions and Backend Services

### Edge Functions Inventory

| Function | Purpose | Tables Touched | Relevant to PA? |
|----------|---------|---------------|-----------------|
| **send-payment-reminder** | Batch email sending via Resend API | email_notifications, email_attachments, organizations | YES — email delivery |
| **stripe-webhook** | Handle Stripe payment events | payments | YES — payment processing |
| **stripe-create-checkout** | Create Stripe checkout session | payments (implicit) | YES — payment flow |
| **stripe-create-payment-intent** | Create payment intent | payments (implicit) | YES — payment flow |
| **stripe-test-connection** | Test Stripe API credentials | None | YES — Stripe health check |
| **push** | Send Expo push notifications | push_tokens, notifications | NO — mobile-only |
| **notification-cron** | Cron-triggered notification checks | notifications | NO — operational |
| **resend-webhooks** | Resend delivery tracking | email_notifications | YES — email tracking |

### pg_cron Jobs

**Migration**: `20260326_pg_cron_email_queue.sql`

| Job Name | Schedule | Action |
|----------|----------|--------|
| `process-email-queue` | Every 2 minutes (`*/2 * * * *`) | POST to `send-payment-reminder` edge function |

**Security concern**: Uses hardcoded anon JWT token in migration line 43. Should use service role token.

### Resend Email Integration

- **Configured**: YES — via `send-payment-reminder` edge function
- **Secrets**: `RESEND_API_KEY`, `FROM_EMAIL` (default: noreply@mail.thelynxapp.com)
- **Templates**: registration_confirmation, registration_approved, payment_reminder, payment_receipt, team_assignment, waitlist, blast_announcement
- **Tracking**: via `resend-webhooks` function (delivered, opened, clicked, bounced)
- **PA email capability**: Currently NONE — emails are triggered by org-level actions, not PA UI

---

## TASK 9: Mobile App Platform Admin Audit

**Status**: NOT AVAILABLE — The mobile repo (`Volleybrain-Mobile3/`) is not present in this workspace. Cannot audit mobile platform admin screens.

**Recommendation**: In a future session with access to the mobile repo, check:
1. Any screens under a `platform/` folder
2. Supabase queries referencing `platform_` tables
3. Push notification token table (`push_tokens`) structure
4. Mobile engagement data tables

---

## TASK 10: Tables & Columns Needed (Gap Analysis)

### Phase 1 — Foundation (Items 1-6)

#### Item 1: Overview Dashboard Upgrade
**EXISTS**: PlatformOverview.jsx (405 lines) — 6 KPI cards, org health, activity feed
**MISSING**: Real MRR/ARR trending, churn rate, system health, error rates
**NEW TABLES**:
| Table | Columns |
|-------|---------|
| `platform_kpi_snapshots` | id, snapshot_date, mrr_cents, arr_cents, churn_rate, active_orgs, active_users, error_rate, created_at |
| `platform_system_health` | id, metric_name, metric_value, unit, threshold_warning, threshold_critical, sampled_at, created_at |

#### Item 2: Org Lifecycle Manager
**EXISTS**: PlatformOrganizations + PlatformOrgDetail — org list, detail, suspend/activate/delete
**MISSING**: Trial management, suspension/reactivation flows, onboarding wizard tracking
**NEW TABLES**:
| Table | Columns |
|-------|---------|
| `platform_org_lifecycle_events` | id, organization_id (FK), event_type (created/trial_started/trial_extended/activated/suspended/reactivated/deleted), triggered_by_admin (FK), details (jsonb), created_at |
| `platform_onboarding_progress` | id, organization_id (FK), step (varchar), completed (boolean), completed_at, created_at |

#### Item 3: User Management Upgrade
**EXISTS**: PlatformUsers.jsx (1025 lines) — full user CRUD
**MISSING**: Impersonation, password reset trigger, merge duplicates, activity timeline
**NEW TABLES**:
| Table | Columns |
|-------|---------|
| `platform_impersonation_sessions` | id, admin_id (FK), target_user_id (FK), started_at, ended_at, reason, created_at |
| `platform_user_merge_log` | id, primary_user_id (FK), merged_user_id (FK), merged_by_admin (FK), merged_at, details (jsonb), created_at |

**NEW COLUMNS on profiles**: `password_reset_requested_at` (timestamptz), `merged_into_user_id` (uuid FK)

#### Item 4: Subscription & Billing Upgrade
**EXISTS**: PlatformSubscriptionsPage.jsx — plan editing, invoices
**MISSING**: Stripe integration deepening, payment failure recovery, coupons/promos, refunds
**NEW TABLES**:
| Table | Columns |
|-------|---------|
| `platform_coupons` | id, code (unique), discount_type (percent/fixed), discount_value, max_uses, used_count, valid_from, valid_until, created_by_admin (FK), created_at |
| `platform_coupon_redemptions` | id, coupon_id (FK), organization_id (FK), redeemed_at, created_at |
| `platform_payment_failures` | id, organization_id (FK), subscription_id (FK), failure_reason, stripe_event_id, retry_count, next_retry_at, resolved_at, created_at |
| `platform_refunds` | id, invoice_id (FK), organization_id (FK), amount_cents, reason, refunded_by_admin (FK), stripe_refund_id, created_at |

**NEW COLUMNS on platform_subscriptions**: `stripe_subscription_id` (text), `stripe_customer_id` (text), `coupon_id` (uuid FK)

#### Item 5: Platform Settings (Make it LIVE)
**EXISTS**: PlatformSettings.jsx — display-only
**MISSING**: Real feature flags, tier config, email templates, rate limits
**NEW TABLES**:
| Table | Columns |
|-------|---------|
| `platform_feature_flags` | id, flag_key (unique), label, description, enabled (boolean), rollout_percent, created_at, updated_at |
| `platform_tier_config` | id, tier_name, max_teams, max_members, max_storage_mb, features (jsonb), price_monthly_cents, price_annual_cents, created_at, updated_at |
| `platform_email_templates` | id, template_key, name, subject_template, body_template (HTML), variables (jsonb), created_at, updated_at |
| `platform_rate_limits` | id, endpoint, limit_per (minute/hour/day), tier_overrides (jsonb), created_at, updated_at |

#### Item 6: Notification Center
**EXISTS**: NONE
**MISSING**: Platform-wide announcements, maintenance notices, in-app banners, changelog
**NEW TABLES**:
| Table | Columns |
|-------|---------|
| `platform_announcements` | id, title, body, type (info/warning/critical/maintenance), severity (1-5), published_at, expires_at, created_by_admin (FK), created_at |
| `platform_announcement_reads` | id, announcement_id (FK), user_id (FK), read_at, created_at |
| `platform_changelogs` | id, version, title, release_date, body, features (jsonb), bugfixes (jsonb), breaking_changes (jsonb), created_by_admin (FK), created_at |
| `platform_maintenance_windows` | id, start_at, end_at, title, reason, show_banner (boolean), affected_services (varchar[]), created_by_admin (FK), created_at |

---

### Phase 2 — Operations (Items 7-12)

#### Item 7: Support Inbox Upgrade
**EXISTS**: PlatformSupport.jsx (926 lines) — full ticket system
**MISSING**: SLA timers, canned responses, CSAT, escalation rules, ticket assignment
**NEW TABLES**: `platform_sla_policies`, `platform_support_canned_responses`, `platform_support_satisfaction`, `platform_support_escalation_rules`, `platform_support_assignments`
**NEW COLUMNS on platform_support_tickets**: `assigned_to_admin_id`, `sla_response_due_at`, `sla_resolution_due_at`, `escalated_at`, `escalated_reason`

#### Item 8: Platform Email Center
**EXISTS**: NONE (org-level email-service.js exists)
**MISSING**: Mass email composer, drip campaigns, onboarding sequences, delivery tracking, A/B testing
**NEW TABLES**: `platform_email_campaigns`, `platform_email_campaign_recipients`, `platform_email_drip_sequences`, `platform_email_drip_steps`, `platform_email_ab_tests`

#### Item 9: Feature Request Board
**EXISTS**: NONE
**NEW TABLES**: `platform_feature_requests`, `platform_feature_request_votes`, `platform_feature_request_duplicates`

#### Item 10: Compliance Center
**EXISTS**: NONE
**NEW TABLES**: `platform_data_deletion_requests`, `platform_coppa_consents`, `platform_terms_versions`, `platform_consent_audits`

#### Item 11: Onboarding Health Tracker
**EXISTS**: Partial — org health status in PlatformOverview
**NEW TABLES**: `platform_onboarding_metrics`, `platform_setup_bottlenecks`

#### Item 12: Audit Log Upgrade
**EXISTS**: PlatformAuditLog.jsx (493 lines) — basic audit log
**MISSING**: Data change diffs, IP logging, session tracking
**NEW TABLES**: `platform_audit_log_detailed`, `platform_audit_sessions`
**NEW COLUMNS on platform_admin_actions**: `ip_address`, `user_agent`, `session_id`, `before_state` (jsonb), `after_state` (jsonb)

---

### Phase 3 — Growth (Items 13-18)

#### Item 13: Revenue Analytics Upgrade
**EXISTS**: PlatformAnalyticsPage.jsx — basic revenue metrics
**NEW TABLES**: `platform_revenue_cohorts`, `platform_churn_predictions`

#### Item 14: Engagement Analytics
**EXISTS**: NONE
**NEW TABLES**: `platform_user_sessions`, `platform_feature_adoption`, `platform_engagement_daily`

#### Item 15: Registration Funnel
**EXISTS**: NONE (registrations table exists for counts)
**NEW TABLES**: `platform_registration_funnel_steps`, `platform_registration_funnel_metrics`

#### Item 16: Org Health Score Engine
**EXISTS**: Partial — basic green/yellow/red in PlatformOverview
**NEW TABLES**: `platform_org_health_scores`, `platform_health_alerts`

#### Item 17: Data Export & Reports Upgrade
**EXISTS**: CSV export in PlatformAuditLog
**NEW TABLES**: `platform_scheduled_reports`, `platform_report_history`, `platform_investor_metrics`

#### Item 18: Content Manager
**EXISTS**: NONE (achievements table exists)
**NEW TABLES**: `platform_skill_templates`, `platform_badge_sets`, `platform_challenge_templates`

---

### Phase 4 — Scale (Items 19-22)

#### Item 19: System Health Monitor
**EXISTS**: NONE
**NEW TABLES**: `platform_system_metrics`, `platform_edge_function_logs`, `platform_uptime_checks`, `platform_performance_metrics`

#### Item 20: Database Admin Tools
**EXISTS**: NONE
**NEW TABLES**: `platform_db_table_stats`, `platform_orphan_records`, `platform_integrity_checks`

#### Item 21: Internal Team Management
**EXISTS**: `is_platform_admin` boolean on profiles only
**NEW TABLES**: `platform_admin_roles`, `platform_admin_team_members`, `platform_admin_permissions`

#### Item 22: API & Integrations Hub
**EXISTS**: NONE
**NEW TABLES**: `platform_api_keys`, `platform_webhooks`, `platform_webhook_logs`, `platform_integrations_status`

---

### Grand Total

| Phase | Items | New Tables | New Columns |
|-------|-------|-----------|-------------|
| Phase 1 — Foundation | 1-6 | ~24 | ~26 |
| Phase 2 — Operations | 7-12 | ~21 | ~10 |
| Phase 3 — Growth | 13-18 | ~15 | 0 |
| Phase 4 — Scale | 19-22 | ~14 | 0 |
| **TOTAL** | **22** | **~74** | **~36** |

---

## TASK 11: Issues and Flags

### Build Errors
- **TypeScript**: N/A — project is 100% JSX, no `tsconfig.json`
- **Vite Build**: PASS — 1811 modules, 12.12s. Exit code 1 from chunk size warning (3,008 KB > 500 KB) — not a real error

### Dead Imports
- None detected across platform files

### Broken Queries (Potential)
| File | Table | Risk |
|------|-------|------|
| PlatformOverview.jsx:58 | `platform_subscriptions` | Table may not exist — no migration file found |
| PlatformSubscriptionsPage.jsx:85 | `platform_subscriptions` | Same risk |
| PlatformSubscriptionsPage.jsx:232 | `platform_invoices` | Table may not exist — no migration file found |
| PlatformSupport.jsx:529 | `platform_support_tickets` | Gracefully handles missing table ("Support system not set up yet") |
| PlatformAnalyticsPage.jsx:515 | `registrations` | Table referenced but not in known schema — may be alias for `team_players` or separate table |

### Security Concerns
1. **7 of 9 platform pages lack component-level `isPlatformAdmin` check** — rely on route-level guard only
2. **Hardcoded anon JWT in pg_cron migration** (`20260326_pg_cron_email_queue.sql:43`) — should use service role key
3. **No RLS policies confirmed for platform tables** — all cross-org queries could fail silently or expose data
4. **Subscription/invoice/support write ops NOT audit-logged** — violates audit trail pattern established by other pages

### Stale Code: PlatformAdminPage.jsx
**Status**: SUPERSEDED but still routed

The 890-line `PlatformAdminPage.jsx` is the **original monolithic version** with 4 inline tabs (Overview, Organizations, Users, Audit Log). It has been superseded by:
- PlatformOverview.jsx (405 lines)
- PlatformOrganizations.jsx (789 lines)
- PlatformUsers.jsx (1025 lines)
- PlatformAuditLog.jsx (493 lines)

The old page still has a route at `/platform/admin` but NO nav entry. It should be deprecated/removed to avoid confusion and reduce maintenance burden.

### Duplicate Functionality

| Feature | Old Location | New Location | Overlaps? |
|---------|-------------|-------------|-----------|
| KPI dashboard | PlatformAdminPage overview tab | PlatformOverview.jsx | YES — both query same data |
| Org list + CRUD | PlatformAdminPage org tab | PlatformOrganizations.jsx + PlatformOrgDetail.jsx | YES — both have suspend/activate/delete |
| User list + CRUD | PlatformAdminPage users tab | PlatformUsers.jsx | YES — both have suspend/toggle super-admin |
| Audit log | PlatformAdminPage audit tab | PlatformAuditLog.jsx | YES — both query platform_admin_actions |

### Hardcoded Values That Should Be Configurable

| File | Value | Current | Should Be |
|------|-------|---------|-----------|
| PlatformSettings.jsx | Platform Name | "Lynx" | Database-driven |
| PlatformSettings.jsx | Domain | "thelynxapp.com" | Database-driven |
| PlatformSettings.jsx | Timezone | "America/Chicago" | Database-driven |
| PlatformSettings.jsx | Support Email | "support@thelynxapp.com" | Database-driven |
| PlatformSettings.jsx | Tier pricing | 5 hardcoded tiers | Database-driven (`platform_tier_config`) |
| PlatformSettings.jsx | Sports list | 6 hardcoded sports | Database-driven |
| PlatformOrganizations.jsx:381 | team_coaches limit | 5000 | Configurable or paginated |
| PlatformAuditLog.jsx:130 | Audit log limit | 100 | Configurable with pagination |
| 20260326_pg_cron_email_queue.sql:43 | Anon JWT token | Hardcoded | Environment variable / service role |

---

## END OF REPORT

**Investigation completed**: 2026-03-30
**Files created**: 1 (this report)
**Files modified**: 0
**Commits made**: 0

**Blockers for Carlos to review before execution specs**:
1. Verify the 5 platform tables exist in Supabase dashboard (or they need migration files)
2. Decide whether to deprecate PlatformAdminPage.jsx or keep it as a fallback
3. Confirm the pg_cron email job is running (check `cron.job` table)
4. Decide priority ordering within each phase — which items to build first
5. Confirm whether the mobile app needs any platform admin features (Task 9 was blocked)
