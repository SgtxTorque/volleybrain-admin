# PLATFORM ADMIN COMMAND CENTER — PHASE 2 EXECUTION SPEC
# Operations: Running the business day-to-day
# FINAL VERSION — Post-Phase 1

## Context

Phase 0 + Phase 1 completed successfully (12 sub-phases, 12 commits). Current state:
- 10 platform pages (~8,900 lines total) + 3 shell/nav components + 1 shared hook
- 11 `platform_*` database tables
- `public.is_platform_admin()` SECURITY DEFINER function is in place
- Build passes (1812 modules, ~12s, chunk warning is expected)
- Nav has 9 sections: Overview, Organizations, Users, Subscriptions, Analytics, Support, Notifications, Audit Log, Settings

## MASTER GUARDRAILS (Same as Phase 1 — apply to every sub-phase)

1. **JSX project, NOT TypeScript.** Validate with `npm run build`. Exit code 1 from chunk size warning is expected and NOT an error.
2. **Commit after every sub-phase.** Format: `[PA-P2-X]` where X is the sub-phase number (1-6).
3. **Run `npm run build` between sub-phases.** Fix any real failures before moving on.
4. **Never modify the game badge system.** `player_badges`, `GameDetailModal.jsx`, `GameCompletionModal.jsx` are OFF LIMITS.
5. **Never use "Diego Fuentez"** in any placeholder data.
6. **Follow existing design patterns.** Use `useTheme()`, `useThemeClasses()`, `useAuth()` from `../../contexts/AuthContext`. Card style: `isDark ? 'bg-[#1E293B] border border-slate-700 shadow-sm rounded-[14px]' : 'bg-white border border-slate-200 shadow-sm rounded-[14px]'`. Icons from `../../constants/icons`.
7. **ALL new RLS policies must use `public.is_platform_admin()`** — the SECURITY DEFINER function. NEVER use `auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true)` directly. That pattern causes recursive RLS on the profiles table and WILL break login.
8. **All destructive PA actions must log to `platform_admin_actions`.** Pattern: `await supabase.from('platform_admin_actions').insert({ admin_id: user.id, action_type, target_type, target_id, details: {} })`. Get user from `useAuth()` or `supabase.auth.getUser()`.
9. **Flag and report, don't guess.** Ambiguity → FLAGS FOR REVIEW section.
10. **Safety limits on all new queries.** Every `.select()` that could return many rows MUST have `.limit()` or pagination.
11. **Preserve existing functionality.** When modifying files, ADD to them. Don't break what works.
12. **New pages follow the PlatformNotifications.jsx pattern** — it's the cleanest reference (574 lines, uses useAuth, has animation styles, proper modal pattern, audit logging).

---

## Pre-Phase 2.0: Lazy Load Platform Pages

**Goal:** Address the 3,045 kB chunk size by lazy-loading all platform pages.

**File to modify:** `src/MainApp.jsx`

**Changes:**

Replace the static imports (around lines 97-108) with lazy imports:

```javascript
// Platform Admin (lazy loaded)
const PlatformAnalyticsPage = lazy(() => import('./pages/platform/PlatformAnalyticsPage'))
const PlatformSubscriptionsPage = lazy(() => import('./pages/platform/PlatformSubscriptionsPage'))
const PlatformOverview = lazy(() => import('./pages/platform/PlatformOverview'))
const PlatformOrganizations = lazy(() => import('./pages/platform/PlatformOrganizations'))
const PlatformOrgDetail = lazy(() => import('./pages/platform/PlatformOrgDetail'))
const PlatformUsersPage = lazy(() => import('./pages/platform/PlatformUsers'))
const PlatformSupport = lazy(() => import('./pages/platform/PlatformSupport'))
const PlatformAuditLog = lazy(() => import('./pages/platform/PlatformAuditLog'))
const PlatformSettings = lazy(() => import('./pages/platform/PlatformSettings'))
const PlatformNotifications = lazy(() => import('./pages/platform/PlatformNotifications'))
const PlatformShell = lazy(() => import('./components/platform/PlatformShell'))
```

Make sure `lazy` is imported from React at the top of the file. The platform routes section (around line 1232) should already be inside `<ErrorBoundary>` — wrap it additionally in `<Suspense fallback={<div>Loading...</div>}>` if not already present.

**IMPORTANT:** Each platform page file must have a `default` export for `lazy()` to work. Check each file — some use named exports like `export { PlatformAnalyticsPage }`. If so, also add `export default PlatformAnalyticsPage` at the bottom, or change the lazy import pattern to: `lazy(() => import('./pages/platform/PlatformAnalyticsPage').then(m => ({ default: m.PlatformAnalyticsPage })))`.

**Commit message:** `[PA-P2-0] Lazy-load all platform pages to reduce main chunk size`

**Test:** `npm run build` — check that chunk size warning improves or splits into multiple chunks. All platform pages should still load when navigated to.

---

## Sub-Phase 2.1: Support Inbox Upgrade

**Goal:** Add SLA timers, canned responses, and satisfaction ratings to the existing support system.

**File to modify:** `src/pages/platform/PlatformSupport.jsx` (957 lines)

**Database changes — create migration file `supabase/migrations/20260330_platform_support_upgrade.sql`:**

```sql
-- Add SLA and satisfaction columns to support tickets
ALTER TABLE platform_support_tickets
  ADD COLUMN IF NOT EXISTS first_response_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT,
  ADD COLUMN IF NOT EXISTS escalation_count INTEGER DEFAULT 0;

-- Canned responses stored in platform_settings (no new table needed)
-- Key: 'support_canned_responses', Category: 'support'
-- Value: JSON array of { id, label, text, variables: [] }
```

**ACTION REQUIRED:** Carlos must run this SQL in Supabase Dashboard.

### Changes:

**1. SLA Timer System:**

Add SLA calculation constants at the top of the file:

```javascript
const SLA_CONFIG = {
  urgent:  { response_hours: 1,  resolution_hours: 4 },
  high:    { response_hours: 4,  resolution_hours: 24 },
  normal:  { response_hours: 24, resolution_hours: 72 },
  low:     { response_hours: 48, resolution_hours: 168 }, // 7 days
}
```

When a ticket is created or priority is changed, calculate and set `first_response_deadline` and `resolution_deadline`:
```javascript
const sla = SLA_CONFIG[priority] || SLA_CONFIG.normal
const now = new Date()
const first_response_deadline = new Date(now.getTime() + sla.response_hours * 3600000).toISOString()
const resolution_deadline = new Date(now.getTime() + sla.resolution_hours * 3600000).toISOString()
```

Display SLA countdown on each ticket in the list:
- Calculate time remaining from `first_response_deadline` (if no `first_response_at`) or `resolution_deadline`
- Color coding: green (>50% time left), amber (10-50%), red (<10%), gray with "Breached" badge (past deadline)
- Show as a small pill next to the priority badge

When the first reply is sent, set `first_response_at = now()`.
When status changes to 'resolved', set `resolved_at = now()`.

**2. Canned Responses:**

Add a canned response dropdown to the reply composer area (inside `TicketDetailSlideOver`):

- Load canned responses from `platform_settings` where `key = 'support_canned_responses'` using `usePlatformSettings('support')`
- Dropdown button "Quick Reply" next to the Send button
- Clicking a canned response populates the reply textarea with the template text
- Support variables: `{{org_name}}`, `{{user_name}}`, `{{ticket_id}}` — replace with actual values from the ticket

Seed default canned responses on first load if none exist (use `usePlatformSettings` upsert):
```javascript
const DEFAULT_CANNED = [
  { id: '1', label: 'Investigating', text: 'Thanks for reaching out! We\'re looking into this and will update you shortly.' },
  { id: '2', label: 'Need More Info', text: 'Could you provide more details about this issue? Screenshots or steps to reproduce would be very helpful.' },
  { id: '3', label: 'Resolved', text: 'This issue has been resolved. Please let us know if you experience it again.' },
  { id: '4', label: 'Known Issue', text: 'This is a known issue that we\'re actively working on. We\'ll notify you when the fix is deployed.' },
  { id: '5', label: 'Feature Noted', text: 'Thanks for the suggestion! We\'ve added this to our feature request tracker.' },
]
```

**3. Satisfaction Rating:**

After a ticket is marked "resolved":
- Show a small rating section at the top of the ticket detail: "How was your support experience?" with 5 star buttons
- Clicking a star saves `satisfaction_rating` to the ticket
- Optional comment textarea appears after rating
- Save to `satisfaction_comment`

Add CSAT metrics to the ticket list header area:
- Average CSAT score (across all rated tickets)
- SLA compliance rate (% of tickets resolved within deadline)

**4. Support Dashboard Metrics Strip** (add above the ticket list):

5 metric cards in a row:
- Open tickets (count)
- Avg first response time (hours)
- Avg resolution time (hours)
- CSAT score (average, 1-5)
- SLA compliance (%)

All computed from the tickets data already loaded.

**Commit message:** `[PA-P2-1] Upgrade support inbox with SLA timers, canned responses, CSAT ratings, and metrics`

**Test checklist:**
- [ ] SLA deadlines appear on ticket cards
- [ ] Timer countdown displays with color coding
- [ ] Canned responses load and insert into composer
- [ ] Variable replacement works ({{org_name}} etc.)
- [ ] Satisfaction rating saves after resolution
- [ ] Dashboard metrics calculate correctly
- [ ] First response time updates when first reply sent
- [ ] Build passes

---

## Sub-Phase 2.2: Platform Email Center

**Goal:** Create a platform-level email campaign system, reusing existing Tiptap email components.

**New file:** `src/pages/platform/PlatformEmailCenter.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/email`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'email', label: 'Email' }` to NAV_SECTIONS after 'notifications'
- `src/components/platform/PlatformSidebar.jsx` — add `email: [{ id: 'email', label: 'Email Center', icon: Mail }]` to SECTION_NAV

**Database changes — create migration `supabase/migrations/20260330_platform_email_campaigns.sql`:**

```sql
CREATE TABLE IF NOT EXISTS platform_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  target_audience TEXT DEFAULT 'all',
  target_org_ids UUID[] DEFAULT '{}',
  target_user_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage campaigns"
  ON platform_email_campaigns FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX idx_email_campaigns_status ON platform_email_campaigns(status);
CREATE INDEX idx_email_campaigns_created ON platform_email_campaigns(created_at DESC);
```

**ACTION REQUIRED:** Carlos must run this SQL.

### Page design:

**Reuse existing email components where possible:**
- `EmailComposer.jsx` (228 lines) — Tiptap rich text editor. Can be imported directly.
- Do NOT reuse `RecipientPicker.jsx` (it's org-scoped). Build a simpler platform-level audience picker.
- Do NOT reuse `EmailPage.jsx` (1068 lines, heavily org-scoped). Build fresh.

**Layout:**

1. **Campaign List** (default view):
   - Status filter pills: All | Drafts | Sent | Scheduled
   - Each row: subject, audience summary, status badge, sent date, delivery stats (sent/delivered/opened/bounced)
   - Actions: Edit (if draft), Duplicate, Delete

2. **Create/Edit Campaign** (modal or full-page view — follow the PlatformNotifications pattern of inline editing):
   - Subject line input
   - Body: Import and use `EmailComposer` from `../../components/email/EmailComposer`
   - Audience picker: select from All Users, All Admins, All Coaches, All Parents, Specific Orgs (with org multi-select)
   - Recipient count display (compute from selection)
   - "Send Test Email" button — sends to the current PA's email address only
   - "Save as Draft" and "Send Now" buttons
   - Respect `email_unsubscribes` table — exclude unsubscribed users from recipient count

3. **Campaign Detail** (slide-over or expanded row):
   - Full delivery stats
   - Subject and body preview
   - "Duplicate" button to create a new campaign from this template

**Email sending approach:**
- For "Send Now": update campaign status to 'sending', compute recipient list, insert individual email records into `email_notifications` table (the existing email queue system picks these up via the pg_cron job every 2 minutes)
- Each recipient gets their own `email_notifications` row with the campaign subject/body
- After inserting all rows, update campaign `total_recipients` count and status to 'sent'
- The existing `resend-webhooks` Edge Function tracks delivery — but linking back to campaigns would require adding a `campaign_id` column to `email_notifications`. For Phase 2, just track totals manually. Deep delivery tracking per-recipient is a Phase 3 enhancement.

**Commit message:** `[PA-P2-2] Add Platform Email Center with campaigns, Tiptap editor, audience targeting`

**Test checklist:**
- [ ] Campaign CRUD works (create, save draft, edit, delete)
- [ ] EmailComposer renders with Tiptap toolbar
- [ ] Audience picker shows correct recipient counts
- [ ] Unsubscribed users excluded from count
- [ ] "Send Test Email" sends to PA's own email
- [ ] "Send Now" inserts into email_notifications table
- [ ] Campaign status transitions: draft → sending → sent
- [ ] Route `/platform/email` works, nav entries added
- [ ] All actions audit-logged
- [ ] Build passes

---

## Sub-Phase 2.3: Feature Request Board

**Goal:** Create a system for tracking and prioritizing feature requests.

**New file:** `src/pages/platform/PlatformFeatureRequests.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/features`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'features', label: 'Features' }` after 'email'
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**Database changes — create migration `supabase/migrations/20260330_platform_feature_requests.sql`:**

```sql
CREATE TABLE IF NOT EXISTS platform_feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'under_review',
  priority TEXT DEFAULT 'medium',
  vote_count INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES profiles(id),
  submitted_org_id UUID REFERENCES organizations(id),
  admin_notes TEXT,
  shipped_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to feature requests"
  ON platform_feature_requests FOR ALL
  USING (public.is_platform_admin());

CREATE TABLE IF NOT EXISTS platform_feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id UUID NOT NULL REFERENCES platform_feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_request_id, user_id)
);

ALTER TABLE platform_feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage votes"
  ON platform_feature_votes FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX idx_feature_requests_status ON platform_feature_requests(status);
CREATE INDEX idx_feature_requests_category ON platform_feature_requests(category);
CREATE INDEX idx_feature_votes_request ON platform_feature_votes(feature_request_id);
```

**ACTION REQUIRED:** Carlos must run this SQL.

**Categories:** `'general'`, `'engagement'`, `'scheduling'`, `'payments'`, `'communication'`, `'reporting'`, `'mobile'`, `'registration'`

**Statuses:** `'under_review'`, `'planned'`, `'in_progress'`, `'shipped'`, `'declined'`

### Page design:

1. **Kanban View** (default):
   - 5 columns: Under Review | Planned | In Progress | Shipped | Declined
   - Each card: title, vote count, category badge, submitted by org name
   - Cards sorted by vote count (highest first) within each column
   - Click card to expand detail

2. **List View** (toggle):
   - Table with columns: Title, Category, Status, Votes, Submitted By, Date
   - Sortable by any column
   - Filter by category, status

3. **Create/Edit Modal:**
   - Title (required)
   - Description (textarea)
   - Category (select)
   - Priority (select: low/medium/high/critical)
   - Status (select — PA can set any status)
   - Admin Notes (textarea — PA internal notes, not visible to submitters in future)
   - Shipped Version (text — e.g., "v1.2.0", only shown when status = 'shipped')

4. **Request Detail** (slide-over):
   - Full description
   - Vote count with manual +/- buttons (PA can add votes on behalf of orgs that requested features verbally)
   - Status change dropdown
   - Admin notes
   - Submitted by info (user + org)
   - Created date

5. **Metrics strip** at top:
   - Total requests (count)
   - Under Review (count)
   - Planned (count)
   - In Progress (count)
   - Shipped this month (count)

**Commit message:** `[PA-P2-3] Add Feature Request Board with kanban view, voting, and status tracking`

**Test checklist:**
- [ ] Feature request CRUD works
- [ ] Kanban columns display correctly
- [ ] Vote increment/decrement works
- [ ] Status changes move cards between columns
- [ ] Category and status filters work
- [ ] List view toggle works
- [ ] All actions audit-logged
- [ ] Build passes

---

## Sub-Phase 2.4: Compliance Center

**Goal:** Create a compliance dashboard for COPPA, data requests, waivers, and Terms of Service. **This is CRITICAL for youth sports.**

**New file:** `src/pages/platform/PlatformCompliance.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/compliance`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'compliance', label: 'Compliance' }` after 'features'
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**Database changes — create migration `supabase/migrations/20260330_platform_compliance.sql`:**

```sql
-- Data deletion/export/correction requests
CREATE TABLE IF NOT EXISTS platform_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  requestor_id UUID REFERENCES profiles(id),
  requestor_email TEXT,
  target_user_id UUID REFERENCES profiles(id),
  target_org_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'pending',
  reason TEXT,
  admin_notes TEXT,
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage data requests"
  ON platform_data_requests FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX idx_data_requests_status ON platform_data_requests(status);
CREATE INDEX idx_data_requests_type ON platform_data_requests(request_type);

-- Terms of Service versions
CREATE TABLE IF NOT EXISTS platform_tos_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_tos_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage ToS"
  ON platform_tos_versions FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "All users can read current ToS"
  ON platform_tos_versions FOR SELECT
  USING (is_current = true);
```

**ACTION REQUIRED:** Carlos must run this SQL.

### Page design — 4 tabs:

**Tab 1: COPPA Dashboard**
- **COPPA Consent Rate**: Count of profiles where `coppa_consent_given = true` ÷ total parent profiles. Source: `profiles` table.
- **Orgs with Minor Players**: Query `players` joined to `teams` joined to `seasons` to get org, then check player birth dates. If no birth date column, count all players as potential minors (flag this for review).
- **Recent Consent Activity**: Last 10 profiles that gave COPPA consent (query profiles ordered by `coppa_consent_date DESC`)
- **Info panel**: Explain what Lynx collects from minors (chat messages, team membership, stats) — reference the existing `CoppaConsentModal.jsx` content

**Tab 2: Data Requests**
- **Request Queue**: List all `platform_data_requests` sorted by deadline
- **Create Request** button (PA can manually create on behalf of a user who emailed/called):
  - Request type: deletion, export, correction, access
  - Requestor email
  - Target user (search by name/email)
  - Target org (optional)
  - Reason
  - Deadline auto-set: 30 days from creation (GDPR requirement)
- **Process Request** workflow:
  - Status flow: pending → in_progress → completed (or rejected)
  - Admin notes field for documenting what was done
  - "Mark Complete" button sets `completed_at` and `completed_by`
- **Metrics**: Open requests, avg resolution time, overdue count (deadline passed + status != completed)

**Tab 3: Waiver Compliance**
- Cross-org view of waiver status
- Query `waiver_templates` grouped by org, with counts of `waiver_signatures` vs total expected
- Show: Org name, active waivers count, signed %, unsigned count
- Click org → link to `/platform/organizations/{orgId}`
- Highlight orgs with <80% signature rate in amber, <50% in red

**Tab 4: Terms of Service**
- Version list from `platform_tos_versions`
- "Create New Version" modal: version string, title, content (textarea)
- "Publish" action: sets `is_current = true` on this version, sets `is_current = false` on all others, sets `published_at`
- Current version highlighted
- Version history with dates

**Commit message:** `[PA-P2-4] Add Compliance Center with COPPA dashboard, data requests, waiver compliance, and ToS`

**Test checklist:**
- [ ] COPPA metrics pull from profiles.coppa_consent_given
- [ ] Data request CRUD works with 30-day deadline auto-calculation
- [ ] Status flow: pending → in_progress → completed
- [ ] Overdue detection works
- [ ] Waiver compliance aggregates across orgs correctly
- [ ] ToS versioning works (only one "current" at a time)
- [ ] All tabs render without errors
- [ ] All actions audit-logged
- [ ] Build passes

---

## Sub-Phase 2.5: Onboarding Health Tracker

**Goal:** Track how well new orgs are setting up and identify stalled onboarding.

**File to modify:** `src/pages/platform/PlatformOverview.jsx` (582 lines) — add onboarding section
**File to modify:** `src/pages/platform/PlatformOrgDetail.jsx` (1287 lines) — enhance onboarding checklist

**No new database tables.** All computed from existing data.

### Changes to PlatformOverview.jsx:

Add an "Onboarding Health" section below the existing Org Health list. This is a focused view of recently created orgs (last 30 days) and their setup progress.

**Onboarding Milestones** (computed per org):

```javascript
const ONBOARDING_MILESTONES = [
  { id: 'admin', label: 'Admin user', check: (org, data) => data.members.some(m => m.role === 'admin' || m.role === 'league_admin') },
  { id: 'season', label: 'First season', check: (org, data) => data.seasonCount > 0 },
  { id: 'team', label: 'First team', check: (org, data) => data.teamCount > 0 },
  { id: 'player', label: 'First player', check: (org, data) => data.playerCount > 0 },
  { id: 'coach', label: 'Coach assigned', check: (org, data) => data.coachCount > 0 },
  { id: 'event', label: 'First event', check: (org, data) => data.eventCount > 0 },
  { id: 'registration', label: 'Registration template', check: (org, data) => data.regTemplateCount > 0 },
]
```

For each org created in the last 30 days, compute milestone completion:
- Query: `organizations` created in last 30 days, then batch-load `user_roles`, `seasons`, `teams`, `team_players`, `team_coaches`, `schedule_events`, `registration_templates` counts per org
- Display as a compact list: org name, creation date, progress bar (X/7 milestones), last milestone achieved, "stalled" badge if no milestone completed in 7+ days

**Stall Detection:**
- "Stalled" = org created 7+ days ago AND progress < 50% (less than 4 milestones)
- "Critical" = org created 14+ days ago AND progress < 30% (less than 3 milestones)
- Show count of stalled orgs in the Attention Strip (added in Phase 1)

### Changes to PlatformOrgDetail.jsx:

The existing onboarding checklist (added in Phase 1) should be enhanced:
- Replace simple boolean checks with the 7-milestone system above
- Show time-to-value metrics: "Time from creation to first team: X days"
- Add "Send Setup Reminder" button — creates a `platform_org_events` entry with `event_type: 'setup_reminder_sent'` and could trigger an email if the email center is working

**Commit message:** `[PA-P2-5] Add onboarding health tracker with milestone tracking, stall detection, and setup reminders`

**Test checklist:**
- [ ] Onboarding section shows orgs from last 30 days
- [ ] Milestone progress calculates correctly
- [ ] Stall detection flags correct orgs
- [ ] Stalled count appears in attention strip
- [ ] OrgDetail checklist shows 7 milestones
- [ ] "Send Setup Reminder" creates org event
- [ ] Build passes

---

## Sub-Phase 2.6: Audit Log Upgrade

**Goal:** Enhance `PlatformAuditLog.jsx` with data diffs, IP tracking, and better export.

**File to modify:** `src/pages/platform/PlatformAuditLog.jsx` (493 lines)

**Database changes — create migration `supabase/migrations/20260330_platform_audit_upgrade.sql`:**

```sql
ALTER TABLE platform_admin_actions
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS old_values JSONB,
  ADD COLUMN IF NOT EXISTS new_values JSONB;
```

**ACTION REQUIRED:** Carlos must run this SQL.

### Changes:

**1. Data Change Diffs:**

When any platform page logs an audit action that involves a data change (settings update, subscription edit, status change), the `old_values` and `new_values` columns should capture what changed.

This is ALREADY partially supported — the `details` JSONB field captures some context. For Phase 2, enhance the audit log DISPLAY:
- When a log entry has `old_values` and `new_values`, show a diff view in the expanded row
- Changed fields highlighted: old value in red background, new value in green background
- If only `details` exists (older entries), show the details JSON formatted nicely

**NOTE:** Updating the WRITING side (capturing old/new values in every platform page) is a large change touching many files. For Phase 2, implement the DISPLAY side in the audit log. Add `old_values`/`new_values` capture to the `usePlatformSettings` hook (which already does audit logging) and to PlatformSubscriptionsPage (subscription edits). Other pages can be updated incrementally.

Specifically, update `src/hooks/usePlatformSettings.js` `updateSetting` function to also capture `old_values` and `new_values`:
```javascript
// Before update, read current value
const { data: current } = await supabase.from('platform_settings').select('value').eq('key', key).single()
// Then in the audit log insert:
old_values: current?.value || null,
new_values: value,
```

**2. Enhanced Export:**

The CSV export already exists. Add:
- JSON export button (alongside CSV)
- Date range picker for export (from date → to date)
- Filter by action type BEFORE export (export only the filtered view)
- Include `ip_address` and diff data in export when available

**3. Pagination:**

Currently loads 100 entries with a hardcoded limit. Add:
- "Load More" button that fetches the next 100
- Use `.range(offset, offset + 99)` pattern
- Total count display: "Showing X of Y entries"

**4. IP Logging for future entries:**

The actual IP capture needs to happen at the point where audit logs are written. In a Supabase + browser context, the client doesn't have access to the request IP. Options:
- Store `navigator.userAgent` in `user_agent` column (available in browser)
- For IP: would need an edge function or server-side logging — flag this as "deferred to Phase 4"

For Phase 2: capture `user_agent` on new audit log entries. Add this to audit logging calls across platform pages:
```javascript
user_agent: navigator.userAgent
```

This is a low-risk addition to each existing `platform_admin_actions.insert()` call.

**Commit message:** `[PA-P2-6] Upgrade audit log with diff display, JSON export, pagination, and user agent tracking`

**Test checklist:**
- [ ] New columns added to platform_admin_actions
- [ ] Diff view displays when old_values/new_values present
- [ ] Settings changes now capture old/new values
- [ ] JSON export works
- [ ] Date range filter for export works
- [ ] Pagination "Load More" works
- [ ] User agent captured on new entries
- [ ] Build passes

---

## SQL MIGRATIONS SUMMARY

Carlos will need to run these 4 migration files after CC commits them:

| Migration | Tables/Changes |
|-----------|---------------|
| `20260330_platform_support_upgrade.sql` | ALTER platform_support_tickets (add 7 columns) |
| `20260330_platform_email_campaigns.sql` | CREATE platform_email_campaigns |
| `20260330_platform_feature_requests.sql` | CREATE platform_feature_requests + platform_feature_votes |
| `20260330_platform_compliance.sql` | CREATE platform_data_requests + platform_tos_versions |
| `20260330_platform_audit_upgrade.sql` | ALTER platform_admin_actions (add 4 columns) |

**ALL RLS policies use `public.is_platform_admin()` — the safe SECURITY DEFINER function.**

---

## END-OF-PHASE 2 REPORT TEMPLATE

```markdown
# PA Command Center — Phase 2 Completion Report

## Build Status
- [ ] `npm run build` passes
- [ ] Chunk size improved with lazy loading
- [ ] No console errors on any platform page

## Summary
| Sub-Phase | Status | Files Modified | Files Created | DB Changes | Commit Hash |
|-----------|--------|---------------|---------------|------------|-------------|
| P2-0 Lazy loading | ✅/⚠️/❌ | ... | ... | ... | ... |
| P2-1 Support upgrade | ... | ... | ... | ... | ... |
| P2-2 Email Center | ... | ... | ... | ... | ... |
| P2-3 Feature Requests | ... | ... | ... | ... | ... |
| P2-4 Compliance | ... | ... | ... | ... | ... |
| P2-5 Onboarding Health | ... | ... | ... | ... | ... |
| P2-6 Audit Upgrade | ... | ... | ... | ... | ... |

## SQL Migrations Carlos Needs to Run
List all migration files with status

## New Routes Added
| Path | Component | Nav Entry |

## FLAGS FOR REVIEW
Any issues, concerns, or decisions needing Carlos's input.

## Deferred Items
Anything intentionally deferred and why.

## Recommended Phase 3 Adjustments
Based on what was learned during Phase 2.
```
