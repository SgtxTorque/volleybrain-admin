# PLATFORM ADMIN COMMAND CENTER — PHASE 4 EXECUTION SPEC
# Scale: Infrastructure, security, and team readiness
# FINAL VERSION — Post-Phase 3

## Context

Phases 0-3 completed. Current state:
- 16 platform pages (~13,800 lines) + 3 shell/nav + 2 shared files (hook + health calculator)
- 16 `platform_*` database tables + `platform_org_health_scores`
- 15 nav sections
- `public.is_platform_admin()` SECURITY DEFINER function in place
- 8 Supabase Edge Functions deployed
- Integrations: Supabase, Stripe (publishable key configured), Resend (via Edge Function), Vercel (deployment)
- Existing `ErrorBoundary` component catches render errors (logs to console only)
- Build healthy, all pages lazy-loaded

## MASTER GUARDRAILS (Same as Phases 1-3)

1. **JSX project.** Validate with `npm run build`. Chunk warning exit code 1 is expected.
2. **Commit format:** `[PA-P4-X]` where X = sub-phase number (1-4).
3. **Run `npm run build` between sub-phases.**
4. **Never modify game badge system.** OFF LIMITS.
5. **Never use "Diego Fuentez"** in placeholder data.
6. **Follow existing patterns.** `useTheme()`, `useThemeClasses()`, `useAuth()`. Card styles from existing platform pages.
7. **ALL new RLS policies use `public.is_platform_admin()`.** NEVER the subquery pattern.
8. **Audit log all destructive actions.**
9. **Flag and report** ambiguity → FLAGS FOR REVIEW.
10. **Safety limits** on all queries.
11. **Preserve existing functionality.**
12. **Lazy load new pages.**

---

## Sub-Phase 4.1: System Health Monitor

**Goal:** Monitor infrastructure health, Edge Function status, and application activity from the PA dashboard.

**New file:** `src/pages/platform/PlatformSystemHealth.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/system`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'system', label: 'System' }` BEFORE 'settings' (so settings stays last)
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**New database table — create migration `supabase/migrations/20260330_platform_error_log.sql`:**

```sql
CREATE TABLE IF NOT EXISTS platform_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  component TEXT,
  user_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read errors"
  ON platform_error_log FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "Authenticated users can log errors"
  ON platform_error_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_error_log_severity ON platform_error_log(severity);
CREATE INDEX idx_error_log_created ON platform_error_log(created_at DESC);
CREATE INDEX idx_error_log_type ON platform_error_log(error_type);
```

**ACTION REQUIRED:** Carlos must run this SQL.

### Page design — 4 sections:

**Section 1: Application Health Pulse**

Check the "last activity" timestamp for key system functions by querying the most recent record from each critical table:

```javascript
const HEALTH_CHECKS = [
  { name: 'User Activity', table: 'profiles', column: 'updated_at', description: 'Last user profile update' },
  { name: 'Chat Activity', table: 'chat_messages', column: 'created_at', description: 'Last chat message' },
  { name: 'Schedule Activity', table: 'schedule_events', column: 'created_at', description: 'Last event created' },
  { name: 'Payment Activity', table: 'payments', column: 'created_at', description: 'Last payment processed' },
  { name: 'Email Activity', table: 'email_notifications', column: 'created_at', description: 'Last email queued' },
  { name: 'Admin Activity', table: 'platform_admin_actions', column: 'created_at', description: 'Last PA action' },
  { name: 'Registration', table: 'registrations', column: 'created_at', description: 'Last registration' },
  { name: 'XP/Engagement', table: 'xp_ledger', column: 'created_at', description: 'Last XP award' },
]
```

For each check:
```javascript
const { data } = await supabase
  .from(check.table)
  .select(check.column)
  .order(check.column, { ascending: false })
  .limit(1)
  .single()
```

Display as a grid of health cards:
- Green: activity within last 24 hours
- Amber: activity within last 72 hours but not last 24
- Red: no activity in 72+ hours
- Gray: no data (table empty — not an error, just no usage yet)

Show the actual timestamp for each: "Last activity: 2h ago" or "3 days ago" or "Never"

**Section 2: Edge Function Registry**

Hardcoded list of known Edge Functions (since we can't query the Supabase management API from the client):

```javascript
const EDGE_FUNCTIONS = [
  { name: 'send-payment-reminder', purpose: 'Email queue processor (runs every 2min via pg_cron)', critical: true },
  { name: 'stripe-webhook', purpose: 'Handles Stripe payment events', critical: true },
  { name: 'stripe-create-checkout', purpose: 'Creates Stripe checkout sessions', critical: true },
  { name: 'stripe-create-payment-intent', purpose: 'Creates payment intents', critical: false },
  { name: 'stripe-test-connection', purpose: 'Tests Stripe API credentials', critical: false },
  { name: 'resend-webhooks', purpose: 'Tracks email delivery status', critical: true },
  { name: 'push', purpose: 'Sends mobile push notifications', critical: false },
  { name: 'notification-cron', purpose: 'Scheduled notification checks', critical: false },
]
```

Display as a table with:
- Function name
- Purpose
- Critical badge (red) for essential functions
- "Test" button (for `stripe-test-connection` — calls the function and shows result)
- Link to Supabase dashboard: `https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby/functions`

**Section 3: Database Table Stats**

Query row counts for the most important tables:

```javascript
const TRACKED_TABLES = [
  'organizations', 'profiles', 'user_roles', 'seasons', 'teams',
  'players', 'team_players', 'payments', 'registrations', 'schedule_events',
  'chat_messages', 'email_notifications', 'shoutouts', 'xp_ledger',
  'platform_admin_actions', 'platform_support_tickets', 'platform_org_health_scores',
]
```

For each:
```javascript
const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
```

Display as a sortable table: table name, row count, sorted by count descending. This gives a quick view of data volume.

**NOTE:** Some tables may be blocked by RLS. If a count query fails, show "Access denied" instead of an error. Flag in completion report which tables need additional RLS policies.

**Section 4: Error Log**

Query `platform_error_log` table (created by this migration):
- Show recent errors sorted by `created_at DESC`, limit 50
- Filter by severity: all / warning / error / critical
- Filter by error_type: all / js_error / api_error / edge_function_error
- Each row: severity badge, timestamp, message, component, "Details" expand showing stack trace

**Also:** Enhance the existing `ErrorBoundary` component to log errors to the database:

**File to modify:** `src/components/ui/ErrorBoundary.jsx`

In the `componentDidCatch` method, add after the `console.error`:
```javascript
// Log to platform_error_log table (fire-and-forget)
import { supabase } from '../../lib/supabase'

// In componentDidCatch:
try {
  supabase.from('platform_error_log').insert({
    error_type: 'js_error',
    message: error?.message || 'Unknown error',
    stack_trace: error?.stack || null,
    component: errorInfo?.componentStack || null,
    severity: 'error',
    metadata: { url: window.location.href }
  })
} catch (e) {
  // Silent fail — don't break error handling with error logging
}
```

**NOTE:** Since `ErrorBoundary` is a class component, the `supabase` import needs to be at the top of the file, not inside the method. Add it alongside the existing imports.

**Commit message:** `[PA-P4-1] Add system health monitor with application pulse, edge functions, table stats, and error log`

**Test checklist:**
- [ ] `platform_error_log` table created (by Carlos)
- [ ] Application health checks show timestamps for tables that have data
- [ ] Tables with no data show "Never" gracefully (not an error)
- [ ] Edge function registry displays correctly
- [ ] Table stats show row counts (flag any RLS-blocked tables)
- [ ] Error log section loads (will be empty initially)
- [ ] ErrorBoundary enhancement doesn't break existing error handling
- [ ] Route and nav items added
- [ ] Build passes

---

## Sub-Phase 4.2: Database Admin Tools

**Goal:** Give PA read-only visibility into database health and data integrity.

**New file:** `src/pages/platform/PlatformDatabaseTools.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/database`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'database', label: 'Database' }` after 'system'
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**No new database tables.** This page is READ-ONLY.

### Page design — 3 tabs:

**Tab 1: Table Overview**

Reuse the table stats from System Health (or compute fresh). Enhanced view:

For each table, show:
- Table name
- Row count
- Category tag: "Core" (organizations, profiles, teams, etc.), "Platform" (platform_*), "Engagement" (xp_ledger, shoutouts, etc.), "Communication" (chat, email), "Financial" (payments, invoices)

Sort by: row count, name, category. Group by category option.

Total row count across all tracked tables displayed as a KPI card at top.

**Tab 2: Orphan Record Detection**

Run a series of integrity checks. Each check is a query that identifies records pointing to non-existent parents:

```javascript
const ORPHAN_CHECKS = [
  {
    name: 'Players not on any team',
    description: 'Player records with no team_players entry',
    query: async () => {
      // Get player IDs that have no team_players row
      const { data: allPlayers } = await supabase.from('players').select('id, full_name').limit(10000)
      const { data: rosteredPlayers } = await supabase.from('team_players').select('player_id').limit(10000)
      const rosteredIds = new Set((rosteredPlayers || []).map(tp => tp.player_id))
      return (allPlayers || []).filter(p => !rosteredIds.has(p.id))
    }
  },
  {
    name: 'Teams with no players',
    description: 'Teams that have zero roster entries',
    query: async () => {
      const { data: allTeams } = await supabase.from('teams').select('id, name').limit(10000)
      const { data: teamPlayers } = await supabase.from('team_players').select('team_id').limit(10000)
      const teamsWithPlayers = new Set((teamPlayers || []).map(tp => tp.team_id))
      return (allTeams || []).filter(t => !teamsWithPlayers.has(t.id))
    }
  },
  {
    name: 'Seasons with no teams',
    description: 'Seasons that have zero teams',
    query: async () => {
      const { data: allSeasons } = await supabase.from('seasons').select('id, name').limit(10000)
      const { data: teams } = await supabase.from('teams').select('season_id').limit(10000)
      const seasonsWithTeams = new Set((teams || []).map(t => t.season_id))
      return (allSeasons || []).filter(s => !seasonsWithTeams.has(s.id))
    }
  },
  {
    name: 'User roles for inactive orgs',
    description: 'Active user_roles pointing to suspended organizations',
    query: async () => {
      const { data: inactiveOrgs } = await supabase.from('organizations').select('id, name').eq('is_active', false).limit(10000)
      const inactiveIds = (inactiveOrgs || []).map(o => o.id)
      if (inactiveIds.length === 0) return []
      const { data: orphanRoles } = await supabase.from('user_roles').select('id, user_id, organization_id, role').eq('is_active', true).in('organization_id', inactiveIds).limit(10000)
      return orphanRoles || []
    }
  },
  {
    name: 'Profiles requesting deletion',
    description: 'Users who have requested account deletion (deletion_requested = true)',
    query: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email').eq('deletion_requested', true).limit(1000)
      return data || []
    }
  },
]
```

Display:
- "Run All Checks" button — runs all queries and shows results
- Each check: name, description, status (pass = 0 orphans, warning = orphans found), count of orphan records
- Expandable detail showing the first 20 orphan records per check
- **NO delete or fix actions** — this tab identifies problems. Fixing them requires separate specs.

**Tab 3: Data Integrity Checks**

```javascript
const INTEGRITY_CHECKS = [
  {
    name: 'Orgs with no admin users',
    description: 'Active organizations that have zero users with admin or league_admin role',
    query: async () => {
      // Get all active orgs
      const { data: orgs } = await supabase.from('organizations').select('id, name').eq('is_active', true).limit(10000)
      // Get all admin roles
      const { data: adminRoles } = await supabase.from('user_roles').select('organization_id').in('role', ['admin', 'league_admin']).eq('is_active', true).limit(10000)
      const orgsWithAdmin = new Set((adminRoles || []).map(r => r.organization_id))
      return (orgs || []).filter(o => !orgsWithAdmin.has(o.id))
    }
  },
  {
    name: 'Subscriptions without organizations',
    description: 'Platform subscriptions pointing to non-existent organizations',
    query: async () => {
      const { data: subs } = await supabase.from('platform_subscriptions').select('id, organization_id, plan_tier').limit(10000)
      const { data: orgs } = await supabase.from('organizations').select('id').limit(10000)
      const orgIds = new Set((orgs || []).map(o => o.id))
      return (subs || []).filter(s => !orgIds.has(s.organization_id))
    }
  },
  {
    name: 'Duplicate email addresses',
    description: 'Profiles sharing the same email address',
    query: async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').limit(50000)
      const emailMap = {}
      ;(profiles || []).forEach(p => {
        const email = (p.email || '').toLowerCase()
        if (!email) return
        if (!emailMap[email]) emailMap[email] = []
        emailMap[email].push(p)
      })
      return Object.entries(emailMap).filter(([_, profiles]) => profiles.length > 1).map(([email, profiles]) => ({ email, count: profiles.length, profiles }))
    }
  },
  {
    name: 'Health scores freshness',
    description: 'Health scores older than 7 days (may be stale)',
    query: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data } = await supabase.from('platform_org_health_scores').select('organization_id, overall_score, computed_at').lt('computed_at', sevenDaysAgo).limit(1000)
      return data || []
    }
  },
]
```

Same display pattern as orphan checks: run all, show pass/warning status, expandable details.

**Commit message:** `[PA-P4-2] Add database admin tools with table overview, orphan detection, and integrity checks`

**Test checklist:**
- [ ] Table overview shows row counts
- [ ] Orphan detection runs without errors
- [ ] Checks that find zero orphans show green "Pass"
- [ ] Integrity checks run without errors
- [ ] Expandable details work
- [ ] No write operations (READ-ONLY page)
- [ ] RLS-blocked tables handled gracefully
- [ ] Build passes

---

## Sub-Phase 4.3: Internal Team Management

**Goal:** Prepare for hiring by building role-based PA access management.

**New file:** `src/pages/platform/PlatformTeam.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/team`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'team', label: 'Team' }` after 'database'
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**New database table — create migration `supabase/migrations/20260330_platform_team_members.sql`:**

```sql
CREATE TABLE IF NOT EXISTS platform_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'support',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  UNIQUE(profile_id)
);

ALTER TABLE platform_team_members ENABLE ROW LEVEL SECURITY;

-- Only existing PA team members with super_admin role can manage
-- For now, Carlos is the only super_admin via is_platform_admin on profiles
CREATE POLICY "Platform admins can manage team members"
  ON platform_team_members FOR ALL
  USING (public.is_platform_admin());

-- Team members can read their own record
CREATE POLICY "Team members can read own record"
  ON platform_team_members FOR SELECT
  USING (auth.uid() = profile_id);

CREATE INDEX idx_platform_team_role ON platform_team_members(role);
CREATE INDEX idx_platform_team_active ON platform_team_members(is_active);
```

**ACTION REQUIRED:** Carlos must run this SQL.

### Page design:

**1. Team Members List:**

Display all `platform_team_members` joined with `profiles` for name/email:
- Avatar/initials, name, email, role badge, status (active/inactive), last active, joined date
- "Invite Team Member" button → modal
- "Edit Role" action per member
- "Deactivate" / "Reactivate" action per member

**2. Invite Team Member Modal:**
- Email input (search existing profiles by email)
- Role select (see role templates below)
- Note: Inviting sets `is_platform_admin = true` on their profile AND creates a `platform_team_members` record
- If the email doesn't match an existing profile, show a message: "This user must create a Lynx account first"

**3. Role Templates:**

```javascript
const ROLE_TEMPLATES = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full access to everything (Carlos only)',
    color: '#EF4444',
    permissions: {
      overview: 'full', organizations: 'full', users: 'full',
      subscriptions: 'full', analytics: 'full', engagement: 'full',
      funnel: 'full', support: 'full', notifications: 'full',
      email: 'full', features: 'full', compliance: 'full',
      audit: 'full', content: 'full', system: 'full',
      database: 'full', team: 'full', settings: 'full',
    }
  },
  admin: {
    label: 'Admin',
    description: 'Full access except settings and team management',
    color: '#8B5CF6',
    permissions: {
      overview: 'full', organizations: 'full', users: 'full',
      subscriptions: 'full', analytics: 'full', engagement: 'full',
      funnel: 'full', support: 'full', notifications: 'full',
      email: 'full', features: 'full', compliance: 'full',
      audit: 'full', content: 'full', system: 'read',
      database: 'read', team: 'none', settings: 'none',
    }
  },
  support: {
    label: 'Support Agent',
    description: 'Support inbox + read-only on users and orgs',
    color: '#3B82F6',
    permissions: {
      overview: 'read', organizations: 'read', users: 'read',
      subscriptions: 'none', analytics: 'none', engagement: 'none',
      funnel: 'none', support: 'full', notifications: 'read',
      email: 'none', features: 'read', compliance: 'none',
      audit: 'read', content: 'none', system: 'none',
      database: 'none', team: 'none', settings: 'none',
    }
  },
  analyst: {
    label: 'Analyst',
    description: 'Analytics and reports (read-only)',
    color: '#10B981',
    permissions: {
      overview: 'read', organizations: 'read', users: 'read',
      subscriptions: 'read', analytics: 'read', engagement: 'read',
      funnel: 'read', support: 'none', notifications: 'none',
      email: 'none', features: 'read', compliance: 'read',
      audit: 'read', content: 'read', system: 'read',
      database: 'read', team: 'none', settings: 'none',
    }
  },
  billing: {
    label: 'Billing Manager',
    description: 'Subscriptions and payments',
    color: '#F59E0B',
    permissions: {
      overview: 'read', organizations: 'read', users: 'none',
      subscriptions: 'full', analytics: 'read', engagement: 'none',
      funnel: 'none', support: 'read', notifications: 'none',
      email: 'none', features: 'none', compliance: 'read',
      audit: 'read', content: 'none', system: 'none',
      database: 'none', team: 'none', settings: 'none',
    }
  },
}
```

**4. Permission Matrix View:**
- Visual grid showing all roles vs all pages
- Cells: green (full), blue (read), gray (none)
- Read-only display — role changes happen via the edit modal

**5. Auto-seed Carlos as super_admin:**
On first load, if `platform_team_members` is empty, auto-insert Carlos's profile as `super_admin`:
```javascript
if (teamMembers.length === 0 && user) {
  await supabase.from('platform_team_members').upsert({
    profile_id: user.id,
    role: 'super_admin',
    permissions: ROLE_TEMPLATES.super_admin.permissions,
    is_active: true,
    invited_by: user.id,
  }, { onConflict: 'profile_id' })
}
```

**6. Activity per Team Member:**
- Query `platform_admin_actions` filtered by `admin_id` for each team member
- Show: "X actions this week", last action timestamp

**IMPORTANT NOTE:** This phase builds the DATA MODEL and MANAGEMENT UI for team roles. It does NOT enforce permissions in the navigation or page access yet. Enforcement (hiding nav items, disabling actions based on role permissions) would be a Phase 5 item. For now, `is_platform_admin` on `profiles` remains the only access gate.

**Commit message:** `[PA-P4-3] Add internal team management with roles, permissions matrix, and member activity`

**Test checklist:**
- [ ] `platform_team_members` table created (by Carlos)
- [ ] Carlos auto-seeded as super_admin on first load
- [ ] Invite modal works (finds existing profiles by email)
- [ ] Role assignment sets correct permissions JSON
- [ ] Permission matrix displays correctly
- [ ] Deactivate/reactivate works
- [ ] Activity counts show per member
- [ ] All actions audit-logged
- [ ] Build passes

---

## Sub-Phase 4.4: API & Integrations Hub

**Goal:** Central view of all third-party integration health and configuration.

**New file:** `src/pages/platform/PlatformIntegrations.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/integrations`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'integrations', label: 'Integrations' }` after 'team'
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**No new database tables.** This page reads from existing config and tests connections.

### Page design — 3 sections:

**Section 1: Integration Status Dashboard**

Display each integration as a status card:

```javascript
const INTEGRATIONS = [
  {
    name: 'Supabase',
    icon: 'Database',
    description: 'Backend database, auth, and storage',
    status: 'connected', // Always connected if page loads
    testFn: async () => {
      const { count, error } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
      return { ok: !error, detail: error ? error.message : `${count} organizations` }
    },
    dashboardUrl: 'https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby',
    configuredKeys: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  },
  {
    name: 'Stripe',
    icon: 'CreditCard',
    description: 'Payment processing',
    testFn: async () => {
      // Check if publishable key is configured
      const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      if (!key) return { ok: false, detail: 'Publishable key not configured' }
      // Try the test-connection edge function
      try {
        const { data, error } = await supabase.functions.invoke('stripe-test-connection')
        return { ok: !error, detail: error ? error.message : 'Connection verified' }
      } catch (e) {
        return { ok: false, detail: e.message || 'Test failed' }
      }
    },
    dashboardUrl: 'https://dashboard.stripe.com',
    configuredKeys: ['VITE_STRIPE_PUBLISHABLE_KEY'],
  },
  {
    name: 'Resend',
    icon: 'Mail',
    description: 'Transactional and campaign email delivery',
    testFn: async () => {
      // Check last email sent
      const { data, error } = await supabase
        .from('email_notifications')
        .select('created_at, status')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error || !data) return { ok: false, detail: 'No emails sent yet' }
      return { ok: true, detail: `Last email: ${new Date(data.created_at).toLocaleString()}` }
    },
    dashboardUrl: 'https://resend.com/emails',
    configuredKeys: ['RESEND_API_KEY (Edge Function secret)'],
  },
  {
    name: 'Vercel',
    icon: 'Globe',
    description: 'Web app hosting and deployment',
    status: 'connected', // Always connected if page loads on thelynxapp.com
    testFn: null, // No API test available from client
    dashboardUrl: 'https://vercel.com/dashboard',
    configuredKeys: ['Managed via Vercel dashboard'],
  },
  {
    name: 'Expo (Mobile)',
    icon: 'Smartphone',
    description: 'Mobile app build and push notifications',
    testFn: null,
    dashboardUrl: 'https://expo.dev',
    configuredKeys: ['Managed via EAS'],
  },
]
```

Each card:
- Integration name + icon
- Description
- Status indicator: green dot (connected/healthy), amber (degraded), red (disconnected), gray (not tested)
- "Test Connection" button (runs testFn, shows result)
- "Open Dashboard" link (external link to provider)
- "Configured" tag or "Missing Config" warning

**Section 2: Webhook Health**

Display known webhooks:
```javascript
const WEBHOOKS = [
  {
    name: 'Stripe Webhook',
    endpoint: '/functions/v1/stripe-webhook',
    description: 'Receives payment events from Stripe',
    lastReceived: null, // Would need webhook logs — show "Unknown" if no tracking
  },
  {
    name: 'Resend Webhook',
    endpoint: '/functions/v1/resend-webhooks',
    description: 'Tracks email delivery, opens, bounces',
    lastReceived: null,
  },
]
```

For each:
- Name, endpoint, description
- Last received timestamp (query `email_notifications` for Resend, `payments` for Stripe as proxies)
- Status: active (recent activity) or unknown

**Section 3: Environment & Configuration**

Display what's configured (values masked):
```javascript
const ENV_CHECKS = [
  { key: 'VITE_SUPABASE_URL', present: !!import.meta.env.VITE_SUPABASE_URL },
  { key: 'VITE_SUPABASE_ANON_KEY', present: !!import.meta.env.VITE_SUPABASE_ANON_KEY },
  { key: 'VITE_STRIPE_PUBLISHABLE_KEY', present: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY },
]
```

Display as a checklist: key name + green checkmark (present) or red X (missing).

Add a "Quick Links" section:
- Supabase Dashboard
- Stripe Dashboard
- Resend Dashboard
- Vercel Dashboard
- GitHub Repo: `https://github.com/SgtxTorque/volleybrain-admin`
- Lynx Production: `https://www.thelynxapp.com`

**Commit message:** `[PA-P4-4] Add API & Integrations Hub with connection testing, webhook health, and environment checks`

**Test checklist:**
- [ ] Integration cards display with correct status
- [ ] Supabase test connection works (should always pass)
- [ ] Stripe test connection attempts the edge function
- [ ] Resend shows last email timestamp
- [ ] Environment checks show which keys are configured
- [ ] Quick links open correctly
- [ ] Route and nav items added
- [ ] Build passes

---

## SQL MIGRATIONS SUMMARY

2 migrations for Phase 4:

| Migration | Tables/Changes |
|-----------|---------------|
| `20260330_platform_error_log.sql` | CREATE platform_error_log |
| `20260330_platform_team_members.sql` | CREATE platform_team_members |

---

## END-OF-PHASE 4 REPORT TEMPLATE

```markdown
# PA Command Center — Phase 4 Completion Report (FINAL PHASE)

## Build Status
- [ ] `npm run build` passes
- [ ] No console errors on any platform page

## Summary
| Sub-Phase | Status | Files Modified | Files Created | DB Changes | Commit Hash |
|-----------|--------|---------------|---------------|------------|-------------|
| P4-1 System Health | ✅/⚠️/❌ | ... | ... | ... | ... |
| P4-2 Database Tools | ... | ... | ... | ... | ... |
| P4-3 Team Management | ... | ... | ... | ... | ... |
| P4-4 Integrations | ... | ... | ... | ... | ... |

## SQL Migrations Carlos Needs to Run
List all migration files.

## New Routes Added
| Path | Component | Nav Entry |

## RLS Issues Found
Tables where PA queries returned empty.

## FINAL PLATFORM ADMIN INVENTORY

### Total Pages: [count]
### Total Lines of Code: [count]
### Total Database Tables: [count]
### Total Nav Sections: [count]
### Total Commits (all phases): [count]

### Complete Page List:
| # | Route | Page | Lines | Phase Built |
|---|-------|------|-------|-------------|
| 1 | /platform/overview | PlatformOverview | ... | P1 |
| 2 | /platform/organizations | PlatformOrganizations | ... | P0 (original) |
| ... | ... | ... | ... | ... |

## FLAGS FOR REVIEW
Any final issues needing Carlos's input.

## RECOMMENDATIONS FOR PHASE 5 (Future)
- Permission enforcement in UI (hide nav items based on team role)
- Full user impersonation (login-as-user)
- Automated scheduled reports
- Mobile PA companion (view-only dashboard in mobile app)
- Public-facing status page
- Customer-facing feature request portal
- Automated health score recalculation via pg_cron
```
