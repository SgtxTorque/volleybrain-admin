# PLATFORM ADMIN COMMAND CENTER — PHASE 0 + PHASE 1 EXECUTION SPEC
# FINAL VERSION — Post-Investigation Revision

## Context

Carlos is the solo founder and Platform Admin of Lynx. The web admin repo is `SgtxTorque/volleybrain-admin` (React 18.2 + Vite 5, JSX — NOT TypeScript). Supabase project ID: `uqpjvbiuokwpldjvxiby`.

**Investigation completed.** This spec incorporates all findings from the investigation report dated 2026-03-30.

### Confirmed Database State
- `platform_admin_actions` — EXISTS ✅
- `platform_invoices` — EXISTS ✅  
- `platform_subscriptions` — EXISTS ✅
- `platform_support_tickets` — MISSING ❌ (must create)
- `platform_support_messages` — MISSING ❌ (must create)

### Decisions Made
- PlatformAdminPage.jsx (890-line monolith) — REMOVE (safely — 3 nav references need redirect)
- Mobile platform admin — SKIP (web only for all phases)
- Hardcoded anon key in pg_cron — FIX in Phase 0
- RLS policies for PA — CREATE in Phase 0

---

## MASTER GUARDRAILS (Apply to EVERY sub-phase)

1. **This is a JSX project, NOT TypeScript.** Do not run `npx tsc --noEmit`. Instead run `npm run build` to validate. Build is healthy if it exits with compiled output — the exit code 1 from chunk size warning is expected and NOT an error.
2. **Commit after every sub-phase.** Commit format: `[PA-P0-X]` or `[PA-P1-X]` where X is the sub-phase number.
3. **Run `npm run build` between sub-phases.** If build fails (NOT from chunk warning), fix before moving on.
4. **Never modify the game badge system.** `player_badges` table, `GameDetailModal.jsx`, `GameCompletionModal.jsx`, and badge-related code in `PlayerComponents.jsx` are OFF LIMITS.
5. **Never use "Diego Fuentez"** in any placeholder data.
6. **Follow existing design patterns.** Use `useTheme()`, `useThemeClasses()`, `rounded-[14px]` or `rounded-xl`, `isDark` ternaries for card backgrounds: `isDark ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-slate-200'`. Icons from `src/constants/icons.js` (re-exports from lucide-react).
7. **All new Supabase tables need RLS.** Pattern: `USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true))`.
8. **All destructive PA actions must log to `platform_admin_actions`.** Insert: `{ admin_id: user.id, action_type, target_type, target_id, details: {} }`.
9. **Flag and report, don't guess.** If you encounter ambiguity, STOP. Add to the end-of-phase report under "FLAGS FOR REVIEW". Do NOT make assumptions.
10. **Test each sub-phase.** After code changes:
    - Run `npm run build`
    - Manually check: does the page load? Console errors?
    - List any edge cases that need manual QA
11. **Safety limits on all new queries.** Every new Supabase `.select()` that could return many rows MUST have a `.limit()` (max 10000) or use pagination. No unbounded full table scans.
12. **Preserve existing working functionality.** When modifying an existing file, do NOT remove or break existing features. Add to them.

---

## PHASE 0: Pre-Flight Fixes
*Fix infrastructure issues discovered in investigation before building new features.*

### Sub-Phase 0.1: Create Missing Support Tables

The support inbox page (`PlatformSupport.jsx`) currently shows "Support system not set up yet" because the tables don't exist.

**Create migration file:** `supabase/migrations/20260330_platform_support_tables.sql`

```sql
-- Platform Support Tickets
CREATE TABLE IF NOT EXISTS platform_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to support tickets"
  ON platform_support_tickets FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_support_tickets_status ON platform_support_tickets(status);
CREATE INDEX idx_support_tickets_org ON platform_support_tickets(organization_id);

-- Platform Support Messages
CREATE TABLE IF NOT EXISTS platform_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES platform_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT,
  is_internal_note BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access to support messages"
  ON platform_support_messages FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_support_messages_ticket ON platform_support_messages(ticket_id);
```

**ACTION REQUIRED:** Carlos must run this SQL in the Supabase Dashboard → SQL Editor. CC cannot run migrations directly.

**Verification:** After Carlos runs the SQL, the Support page at `/platform/support` should load without the "not set up yet" message.

**Commit message:** `[PA-P0-1] Add migration file for platform_support_tickets and platform_support_messages`

---

### Sub-Phase 0.2: RLS Policies for Platform Admin Cross-Org Access

The investigation found that cross-org queries could silently fail if RLS blocks platform admin reads. 

**Create migration file:** `supabase/migrations/20260330_platform_admin_rls.sql`

```sql
-- ═══════════════════════════════════════════════════════════
-- RLS Policies for Platform Admin cross-org access
-- These allow users with is_platform_admin = true to read
-- across all organizations for the platform admin dashboard.
-- ═══════════════════════════════════════════════════════════

-- Helper: Check if a policy exists before creating (avoid errors on re-run)
-- We use IF NOT EXISTS pattern via DO blocks

-- organizations: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all organizations' AND tablename = 'organizations') THEN
    CREATE POLICY "Platform admins can read all organizations"
      ON organizations FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- organizations: PA can update all (for suspend/activate)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can update all organizations' AND tablename = 'organizations') THEN
    CREATE POLICY "Platform admins can update all organizations"
      ON organizations FOR UPDATE
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- profiles: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Platform admins can read all profiles"
      ON profiles FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- profiles: PA can update all (for suspend/unsuspend)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can update all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Platform admins can update all profiles"
      ON profiles FOR UPDATE
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- user_roles: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all user_roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Platform admins can read all user_roles"
      ON user_roles FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- seasons: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all seasons' AND tablename = 'seasons') THEN
    CREATE POLICY "Platform admins can read all seasons"
      ON seasons FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- teams: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all teams' AND tablename = 'teams') THEN
    CREATE POLICY "Platform admins can read all teams"
      ON teams FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- payments: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all payments' AND tablename = 'payments') THEN
    CREATE POLICY "Platform admins can read all payments"
      ON payments FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- schedule_events: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all schedule_events' AND tablename = 'schedule_events') THEN
    CREATE POLICY "Platform admins can read all schedule_events"
      ON schedule_events FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- registrations: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all registrations' AND tablename = 'registrations') THEN
    CREATE POLICY "Platform admins can read all registrations"
      ON registrations FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- registration_templates: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all registration_templates' AND tablename = 'registration_templates') THEN
    CREATE POLICY "Platform admins can read all registration_templates"
      ON registration_templates FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- team_coaches: PA can read all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins can read all team_coaches' AND tablename = 'team_coaches') THEN
    CREATE POLICY "Platform admins can read all team_coaches"
      ON team_coaches FOR SELECT
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- platform_subscriptions: PA full access (table already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins full access to subscriptions' AND tablename = 'platform_subscriptions') THEN
    CREATE POLICY "Platform admins full access to subscriptions"
      ON platform_subscriptions FOR ALL
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- platform_invoices: PA full access (table already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins full access to invoices' AND tablename = 'platform_invoices') THEN
    CREATE POLICY "Platform admins full access to invoices"
      ON platform_invoices FOR ALL
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;

-- platform_admin_actions: PA can insert and read (table already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Platform admins full access to admin actions' AND tablename = 'platform_admin_actions') THEN
    CREATE POLICY "Platform admins full access to admin actions"
      ON platform_admin_actions FOR ALL
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
  END IF;
END $$;
```

**IMPORTANT:** Some of these tables may already have RLS policies that already allow this access. The `IF NOT EXISTS` pattern prevents duplicate policy errors. If a policy creation fails because one with a different name already covers the same access, that's fine — log it in the report but don't consider it a blocker.

**ACTION REQUIRED:** Carlos must run this SQL in the Supabase Dashboard → SQL Editor.

**Commit message:** `[PA-P0-2] Add RLS policies migration for platform admin cross-org access`

---

### Sub-Phase 0.3: Add Audit Logging to Unlogged Write Operations

The investigation found that subscription edits, invoice creation/updates, and support ticket status changes are NOT audit-logged. Fix this.

**Files to modify:**
- `src/pages/platform/PlatformSubscriptionsPage.jsx`
- `src/pages/platform/PlatformSupport.jsx`

**For PlatformSubscriptionsPage.jsx:**

Find every `supabase.from('platform_subscriptions').update(...)` and `supabase.from('platform_invoices').insert(...)` / `.update(...)` call. After each successful write, add:

```javascript
await supabase.from('platform_admin_actions').insert({
  admin_id: user.id,  // get user from useAuth()
  action_type: 'update_subscription', // or 'create_invoice', 'update_invoice', 'mark_invoice_paid'
  target_type: 'subscription', // or 'invoice'
  target_id: subscriptionId, // or invoiceId
  details: { org_name: orgName, changes: { ...whatChanged } }
})
```

**NOTE:** `PlatformSubscriptionsPage` does NOT currently import `useAuth()`. You will need to add:
```javascript
import { useAuth } from '../../contexts/AuthContext'
```
And destructure `user` from it inside the component:
```javascript
const { user } = useAuth()
```

**For PlatformSupport.jsx:**

Find every `supabase.from('platform_support_tickets').update(...)` call (status changes, priority changes) and add audit logging. Also log when sending replies.

Same pattern — add `useAuth` import if not present, get `user`, insert audit log after each write.

**Action types to add:**
- `update_ticket_status` (when status changes)
- `update_ticket_priority` (when priority changes)
- `send_support_reply` (when replying to ticket)
- `send_internal_note` (when adding internal note)

**Commit message:** `[PA-P0-3] Add audit logging to subscription, invoice, and support write operations`

**Test:** After changes, perform a subscription edit and check that `platform_admin_actions` has a new row. Perform a support ticket status change and verify the same.

---

### Sub-Phase 0.4: Remove Legacy PlatformAdminPage

Remove the superseded 890-line monolithic page safely.

**Files to modify:**

1. **`src/MainApp.jsx`**:
   - **Line 98**: Remove `import { PlatformAdminPage } from './pages/platform/PlatformAdminPage'`
   - **Line 1254**: Remove `<Route path="/platform/admin" element={<PlatformAdminPage showToast={showToast} />} />`

2. **`src/lib/routes.js`**:
   - **Line 73**: Remove `'platform-admin': '/platform/admin',`
   - **Line 182**: Remove `'/platform/admin': 'Platform Admin',`

3. **`src/pages/platform/PlatformOrgDetail.jsx`**:
   - **Line 690**: Change `navigate('/platform/admin')` → `navigate('/platform/organizations')`
   - **Line 737**: Change `navigate('/platform/admin')` → `navigate('/platform/organizations')`
   - **Line 755**: Change `navigate('/platform/admin')` → `navigate('/platform/organizations')`

4. **`src/pages/platform/PlatformAdminPage.jsx`**: DELETE the entire file.

5. **Leave the comments alone** — `PlatformAuditLog.jsx` line 13 and `PlatformUsers.jsx` line 12 have comments referencing the old page as historical context. These are harmless — do NOT modify them.

**Commit message:** `[PA-P0-4] Remove superseded PlatformAdminPage and redirect references to /platform/organizations`

**Test:** Navigate to `/platform/organizations`. Verify the page loads. Navigate to `/platform/admin` — should redirect to `/platform/overview` (caught by the catch-all route). Verify PlatformOrgDetail back navigation works.

---

### Sub-Phase 0.5: Fix Hardcoded Anon Key in pg_cron Migration

**File to modify:** `supabase/migrations/20260326_pg_cron_email_queue.sql`

**Line ~43**: The `Authorization` header contains a hardcoded anon JWT. Replace the approach with a comment explaining how to use the service_role key instead, since we can't embed the service_role key in a migration file (it's secret).

**Change the Authorization header line to use the anon key from a Supabase vault secret pattern, OR add a comment:**

```sql
-- SECURITY NOTE: The Authorization header below uses the anon key.
-- For production, replace with service_role key stored in Supabase Vault:
--   'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
-- Or configure the Edge Function to not require auth for cron calls.
```

Actually — since this migration has already been run and the cron job is already scheduled in the database, modifying this file won't change the running job. The fix needs to happen in the Supabase dashboard by updating the cron job directly.

**Revised approach:** Do NOT modify the migration file. Instead, document the issue:

**Create file:** `SECURITY-NOTES.md` in repo root

```markdown
# Security Notes

## pg_cron Email Queue Job
The cron job `process-email-queue` (created by `supabase/migrations/20260326_pg_cron_email_queue.sql`) 
uses a hardcoded anon JWT for the Authorization header. 

**To fix:** In Supabase Dashboard → SQL Editor, run:
```
SELECT cron.unschedule('process-email-queue');

SELECT cron.schedule(
  'process-email-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uqpjvbiuokwpldjvxiby.supabase.co/functions/v1/send-payment-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Prerequisite:** Store the service_role key in Supabase Vault first:
1. Go to Supabase Dashboard → Settings → Vault
2. Add secret: name = `service_role_key`, value = your service_role JWT
```

**Commit message:** `[PA-P0-5] Document pg_cron security fix and add SECURITY-NOTES.md`

---

### Sub-Phase 0.6: Add Performance Safety Limits

The investigation found 5 queries in platform pages that do full table scans with no `.limit()`.

**Files to modify:**

1. **`src/pages/platform/PlatformAnalyticsPage.jsx`**:
   - Find: `profiles.select('created_at').order('created_at')` → Add `.limit(50000)` 
   - Find: `payments.select(...).eq('paid', true).order('created_at')` → Add `.limit(50000)`
   - Find: `registrations.select('created_at, status').order('created_at')` → Add `.limit(50000)`

2. **`src/pages/platform/PlatformOrganizations.jsx`**:
   - Find: `.limit(5000)` on team_coaches → Change to `.limit(10000)` (current 5000 is fine for now, but add a comment: `// Safety limit — paginate if orgs exceed this`)

3. **`src/pages/platform/PlatformAdminPage.jsx`**: DELETED in 0.4, skip.

**Commit message:** `[PA-P0-6] Add safety limits to unbounded platform analytics queries`

**Test:** Load `/platform/analytics` and verify data still loads correctly with the limits.

---

## PHASE 0 COMPLETION CHECK

Before proceeding to Phase 1:

- [ ] `npm run build` passes (chunk warning OK)
- [ ] Support page loads (tables created by Carlos)
- [ ] RLS policies applied (by Carlos in SQL Editor)
- [ ] Subscription edit creates audit log entry
- [ ] Support ticket status change creates audit log entry
- [ ] `/platform/admin` redirects to `/platform/overview`
- [ ] PlatformOrgDetail back navigation goes to `/platform/organizations`
- [ ] Analytics page loads with safety limits
- [ ] `SECURITY-NOTES.md` committed

**Produce a short Phase 0 completion note listing what was done, then proceed to Phase 1.**

---

---

## PHASE 1: Foundation
*Core capabilities to run Lynx as a SaaS.*

6 sub-phases. Each gets its own commit.

---

### Sub-Phase 1.1: Overview Dashboard Upgrade

**Goal:** Transform `PlatformOverview.jsx` from a simple counter into an actionable command center.

**File to modify:** `src/pages/platform/PlatformOverview.jsx` (405 lines)

**DO NOT create new database tables for this sub-phase.** All metrics are computed from existing tables.

#### Changes:

**1. Add SaaS Metrics Row** (4 new KPI cards BEFORE the existing 6):

| Metric | Calculation | Source |
|--------|------------|--------|
| MRR | Sum of `price_cents` for active/trialing subs. If `billing_cycle = 'annual'`, use `price_cents / 12`. Format as dollars. | `platform_subscriptions` |
| ARR | MRR × 12 | Computed |
| Churn Rate | Subs where `status = 'cancelled'` AND `updated_at >= startOfMonth` ÷ total active subs at start of month. Format as %. | `platform_subscriptions` |
| Open Tickets | Count where `status = 'open'` | `platform_support_tickets` |

Add these queries to `loadOverviewData()`. Add 4 new entries to the `kpiCards` array BEFORE the existing 6.

**2. Add Attention Required Strip** (new section ABOVE the KPI cards):

A horizontal strip with clickable alert items:
- Open support tickets count → navigates to `/platform/support`
- Incomplete setup orgs count (orgs with yellow health) → navigates to `/platform/organizations?filter=needs_attention`
- Failed payments this month → navigates to `/platform/subscriptions`

Each item: icon + count + label + chevron. Use the same card styling as existing platform pages.

The data for these is already loaded by the existing queries — just extract the counts.

**3. Enhance Org Health list:**
- Make each org row clickable → `navigate('/platform/organizations/' + org.id)`
- Add sort dropdown: Name, Status, Members, Teams (add state `healthSort` defaulting to `'status'`)

**4. Enhance Recent Activity:**
- Add a simple filter dropdown for action type (use the existing `formatAction` helper to get labels)
- Make activity items clickable where applicable (if target is an org, link to org detail)

#### Implementation notes:
- Keep the existing `loadOverviewData()` function structure — add new queries to the existing `Promise.all()` array
- For MRR calculation, handle the case where `platform_subscriptions` might have zero rows (MRR = $0)
- For open tickets, the table was just created in Phase 0 — handle zero rows gracefully
- For churn rate, if there are no active subscriptions, show "N/A" instead of dividing by zero

**Commit message:** `[PA-P1-1] Upgrade overview dashboard with SaaS metrics, attention strip, and enhanced org health`

**Test checklist:**
- [ ] Page loads without errors
- [ ] MRR shows $0 if no subscriptions (not NaN, not error)
- [ ] Churn rate shows "N/A" if no subscriptions
- [ ] Open tickets shows 0 if no tickets
- [ ] Attention strip items are clickable
- [ ] Org health rows navigate to org detail on click
- [ ] Sort dropdown works
- [ ] Activity filter works
- [ ] Build passes

---

### Sub-Phase 1.2: Org Lifecycle Manager

**Goal:** Add lifecycle tracking to org management.

**Files to modify:**
- `src/pages/platform/PlatformOrganizations.jsx` (789 lines)
- `src/pages/platform/PlatformOrgDetail.jsx` (899 lines)

**New database table (migration file):**

Create `supabase/migrations/20260330_platform_org_events.sql`:

```sql
CREATE TABLE IF NOT EXISTS platform_org_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_org_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage org events"
  ON platform_org_events FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE INDEX idx_org_events_org ON platform_org_events(organization_id);
CREATE INDEX idx_org_events_type ON platform_org_events(event_type);
CREATE INDEX idx_org_events_created ON platform_org_events(created_at DESC);
```

**ACTION REQUIRED:** Carlos must run this SQL in Supabase Dashboard.

**Event types:** `'trial_started'`, `'trial_extended'`, `'upgraded'`, `'downgraded'`, `'suspended'`, `'reactivated'`, `'deleted'`, `'note_added'`, `'setup_reminder_sent'`

#### Changes to PlatformOrganizations.jsx:

1. **Add filter pills** below the search bar:
   - All | Active | Trialing | Suspended | Needs Setup
   - "Active": `is_active = true` AND subscription status is `'active'`
   - "Trialing": subscription status is `'trialing'`
   - "Suspended": `is_active = false`
   - "Needs Setup": org health is yellow (incomplete setup)
   - These filter the existing `orgs` state — no additional queries needed

2. **Add "Add Note" quick action** to each org card:
   - Small note icon button in the card header
   - Opens a small modal with a textarea
   - Saves to `platform_org_events` with `event_type: 'note_added'`
   - Also logs to `platform_admin_actions`

#### Changes to PlatformOrgDetail.jsx:

1. **Add "Lifecycle" tab** to the existing tabs array (currently: overview, members, teams, seasons, payments, activity):
   - Add `{ id: 'lifecycle', label: 'Lifecycle', icon: Clock }` after 'activity'
   - Create a `LifecycleTab` component inside the file

2. **LifecycleTab content:**
   - Timeline view: query `platform_org_events` where `organization_id = orgId`, order by `created_at DESC`, limit 50
   - Each event: icon (based on type), timestamp, event type label, details, performed_by name
   - "Add Note" button at top → same modal as org card
   - If org has a subscription: show trial countdown if trialing, show "Extend Trial" button

3. **Extend Trial action** (if org has a trialing subscription):
   - Modal with: current trial end date, new end date picker, reason textarea
   - Updates `platform_subscriptions.trial_ends_at`
   - Inserts `platform_org_events` with `event_type: 'trial_extended'`
   - Inserts `platform_admin_actions` audit log

4. **Enhance existing suspend/activate** to also create org events:
   - When suspending: insert `platform_org_events` with `event_type: 'suspended'`
   - When reactivating: insert `platform_org_events` with `event_type: 'reactivated'`
   - These are IN ADDITION to the existing `platform_admin_actions` logging

**Commit message:** `[PA-P1-2] Add org lifecycle manager with events table, timeline, and enhanced actions`

**Test checklist:**
- [ ] `platform_org_events` table created (by Carlos)
- [ ] Filter pills correctly filter the org list
- [ ] Add Note creates an event AND an audit log entry
- [ ] Lifecycle tab shows timeline of events
- [ ] Trial extension updates subscription and creates event
- [ ] Suspend/activate now also create org events
- [ ] Build passes

---

### Sub-Phase 1.3: User Management Upgrade

**Goal:** Enhance `PlatformUsers.jsx` with richer detail and new actions.

**File to modify:** `src/pages/platform/PlatformUsers.jsx` (1025 lines)

**No new database tables.** This sub-phase adds features using existing tables.

#### Changes:

1. **Enhanced UserDetailSlideOver — Activity Timeline:**
   - The slide-over already loads `recentActivity` from `platform_admin_actions` where the user was the target
   - Enhance: also query where the user was the `admin_id` (actions they performed)
   - Combine into a single timeline sorted by `created_at DESC`
   - Show engagement data if available: query `xp_ledger` for user's XP entries (use `user_id` column — investigate exact column name first), `shoutouts` received

2. **Enhanced filtering:**
   - The page already has org, role, and status filters
   - Add **date range filter**: "Joined" dropdown with options: All Time, This Week, This Month, This Quarter, This Year
   - Filter `profiles` by `created_at` range

3. **"Remove from Org" action** in user detail:
   - When viewing a user's org memberships, add a small "Remove" button next to each org
   - Confirms: "Remove [user] from [org]?"
   - Deletes the `user_roles` row for that user+org combination
   - Logs to `platform_admin_actions` with `action_type: 'remove_user_from_org'`

4. **Duplicate Detection section** (add below the user table):
   - Button: "Check for Duplicates"
   - When clicked, query `profiles` grouped by `LOWER(full_name)` where count > 1
   - Also check for matching email domains
   - Display results in a collapsible section
   - Each duplicate group shows the profiles with a "Review" link to open the user detail
   - This is READ-ONLY — no merge capability yet (deferred to Phase 2+)

**Commit message:** `[PA-P1-3] Upgrade user management with activity timeline, date filter, org removal, and duplicate detection`

**Test checklist:**
- [ ] Activity timeline shows both "actions on user" and "actions by user"
- [ ] Date range filter works
- [ ] "Remove from Org" removes the user_roles row and logs to audit
- [ ] Duplicate detection finds matching names
- [ ] Build passes

---

### Sub-Phase 1.4: Subscription & Billing Upgrade

**Goal:** Enhance `PlatformSubscriptionsPage.jsx` with better detail and promo codes.

**File to modify:** `src/pages/platform/PlatformSubscriptionsPage.jsx` (688 lines)

**New database tables (migration file):**

Create `supabase/migrations/20260330_platform_promo_codes.sql`:

```sql
CREATE TABLE IF NOT EXISTS platform_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  duration_months INTEGER,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage promo codes"
  ON platform_promo_codes FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE TABLE IF NOT EXISTS platform_promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES platform_promo_codes(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  applied_by UUID REFERENCES profiles(id),
  applied_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_promo_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage promo usage"
  ON platform_promo_usage FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
```

**ACTION REQUIRED:** Carlos must run this SQL.

#### Changes:

1. **Payment Health Strip** (add at top of page, above the existing MRR metrics):
   - Failed payments this month: count from `payments` where `status = 'failed'` AND `created_at >= startOfMonth`
   - Upcoming renewals this week: count from `platform_subscriptions` where `current_period_end` is within 7 days
   - Trial expirations this week: count from `platform_subscriptions` where `status = 'trialing'` AND `trial_ends_at` is within 7 days

2. **Promo Code Manager** (new tab or section):
   - Add a "Promo Codes" tab alongside the main subscriptions view
   - Add state: `activeView` = `'subscriptions'` | `'promos'`
   - Toggle buttons at top: "Subscriptions" | "Promo Codes"

   **Promo Codes view:**
   - List all promo codes with: code, discount %, duration, uses/max, status, created date
   - "Create Promo Code" button → modal with: code (text), discount % (number), duration months (number, optional), max uses (number, optional), expiry date (optional)
   - "Deactivate" action per code
   - "Apply to Org" action → opens org picker, inserts into `platform_promo_usage`, increments `times_used`
   - All actions logged to `platform_admin_actions`

3. **Subscription Detail Enhancement:**
   - The edit modal already exists — add a "History" section showing `platform_org_events` where `event_type` is subscription-related for this org

**Commit message:** `[PA-P1-4] Upgrade subscriptions with payment health, promo codes, and subscription history`

**Test checklist:**
- [ ] Payment health strip calculates correctly
- [ ] Promo code creation works with validation
- [ ] Promo code "Apply to Org" works
- [ ] Deactivation works
- [ ] All promo actions audit-logged
- [ ] Build passes

---

### Sub-Phase 1.5: Platform Settings (Make It Live)

**Goal:** Convert `PlatformSettings.jsx` from static to functional.

**File to modify:** `src/pages/platform/PlatformSettings.jsx` (516 lines)

**New database table (migration file):**

Create `supabase/migrations/20260330_platform_settings.sql`:

```sql
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage settings"
  ON platform_settings FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE POLICY "Authenticated users can read settings"
  ON platform_settings FOR SELECT
  USING (auth.role() = 'authenticated');
```

**ACTION REQUIRED:** Carlos must run this SQL.

**New shared hook:** Create `src/hooks/usePlatformSettings.js`:

```javascript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePlatformSettings(category) {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const query = supabase.from('platform_settings').select('*')
    if (category) query.eq('category', category)
    const { data } = await query
    const map = {}
    ;(data || []).forEach(s => { map[s.key] = s.value })
    setSettings(map)
    setLoading(false)
  }, [category])

  useEffect(() => { loadSettings() }, [loadSettings])

  const updateSetting = useCallback(async (key, value, userId) => {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ key, value, category: category || 'general', updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }))
      // Audit log
      await supabase.from('platform_admin_actions').insert({
        admin_id: userId,
        action_type: 'update_setting',
        target_type: 'setting',
        target_id: null,
        details: { key, category }
      })
    }
    return { error }
  }, [category])

  return { settings, loading, updateSetting, reload: loadSettings }
}
```

#### Changes to PlatformSettings.jsx:

**Complete rewrite of all 4 tab sections to be functional:**

1. **GeneralSection** — Replace static display with editable fields:
   - Platform Name (text input, saves to key `general_platform_name`)
   - Support Email (text input, saves to key `general_support_email`)
   - Default Timezone (select dropdown, saves to key `general_timezone`)
   - Maintenance Mode (toggle switch, saves to key `general_maintenance_mode`)
   - Default Trial Duration in days (number input, saves to key `general_trial_days`)
   - Each field: load from `usePlatformSettings('general')`, save on blur or button click

2. **TiersSection** — Replace hardcoded tier cards with editable config:
   - Load tier config from key `tiers_config` (a single JSON object with all tier data)
   - Display as editable cards: name, price, team limit, member limit, features checklist
   - "Save Changes" button saves the entire config back
   - On first load (no data in DB), seed with the current hardcoded values

3. **FeatureFlagsSection** — Replace "Coming Soon" with functional toggles:
   - Load from key `feature_flags` (JSON object: `{ "flag_name": { enabled: bool, description: "..." } }`)
   - Display as toggle list with description
   - Default flags: `engagement_system`, `social_cards`, `email_system`, `basketball_mode`, `advanced_lineup`, `team_manager_role`
   - On first load, seed with all flags enabled

4. **BrandingSection** — Replace static display with functional:
   - Color pickers for primary, secondary, accent colors
   - Save to key `branding_colors`
   - Sport management: list of supported sports with enable/disable toggles
   - Save to key `branding_sports`
   - On first load, seed with current hardcoded values

**Remove all "Coming soon" and "future update" text.**

**Commit message:** `[PA-P1-5] Make platform settings functional with live config for general, tiers, flags, and branding`

**Test checklist:**
- [ ] `platform_settings` table created (by Carlos)
- [ ] `usePlatformSettings` hook works
- [ ] General settings save and reload correctly
- [ ] Tier config saves and displays correctly
- [ ] Feature flags toggle and persist
- [ ] Branding colors/sports save
- [ ] First-load seeding works (settings are populated from hardcoded defaults)
- [ ] All changes audit-logged
- [ ] Build passes

---

### Sub-Phase 1.6: Notification Center

**Goal:** Create a new page for platform-wide announcements.

**New file:** `src/pages/platform/PlatformNotifications.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add route and import
- `src/components/platform/PlatformTopNav.jsx` — add to NAV_SECTIONS
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**New database tables (migration file):**

Create `supabase/migrations/20260330_platform_announcements.sql`:

```sql
CREATE TABLE IF NOT EXISTS platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_audience TEXT DEFAULT 'all',
  target_org_ids UUID[] DEFAULT '{}',
  is_banner BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage announcements"
  ON platform_announcements FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));

CREATE POLICY "Users can read published announcements"
  ON platform_announcements FOR SELECT
  USING (is_published = true AND (expires_at IS NULL OR expires_at > now()));

CREATE INDEX idx_announcements_published ON platform_announcements(is_published, published_at DESC);

CREATE TABLE IF NOT EXISTS platform_announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES platform_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE platform_announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can mark own reads"
  ON platform_announcement_reads FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can view all reads"
  ON platform_announcement_reads FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_platform_admin = true));
```

**ACTION REQUIRED:** Carlos must run this SQL.

#### New page design:

Follow the exact same patterns as existing platform pages:
- Import `useAuth`, `useTheme`, `useThemeClasses`, `supabase`, icons
- Use the same card styling: `isDark ? 'bg-[#1E293B] border border-slate-700 shadow-sm rounded-[14px]' : 'bg-white border border-slate-200 shadow-sm rounded-[14px]'`
- Same loading spinner pattern

**Page layout:**

1. **Header strip with metrics:**
   - Published: count
   - Drafts: count  
   - Active banners: count

2. **Announcement list:**
   - Each row: type badge (info/warning/maintenance/feature/changelog with colors), title, target audience, status (Draft/Published/Expired), published date, read count
   - Click to expand/edit

3. **Create/Edit Modal:**
   - Title (text input)
   - Body (textarea — rich text editor is a stretch goal, plain textarea for now)
   - Type (select: info, warning, maintenance, feature, changelog)
   - Target audience (select: all, admins only, coaches only, parents only, specific orgs)
   - If "specific orgs": org picker (multi-select from existing orgs)
   - Banner toggle (show as dismissible banner in org dashboards)
   - Expiry date (optional date picker)
   - "Save as Draft" and "Publish" buttons

4. **Changelog view** (filtered tab):
   - Show only type='changelog' announcements
   - Formatted as version history

#### Navigation changes:

**PlatformTopNav.jsx** — Add to NAV_SECTIONS array:
```javascript
{ id: 'notifications', label: 'Notifications' },
```
Add it AFTER 'support' and BEFORE 'audit'.

**PlatformSidebar.jsx** — Add to SECTION_NAV:
```javascript
notifications: [
  { id: 'notifications', label: 'Notifications', icon: Bell },
],
```

**MainApp.jsx** — Add import and route:
```javascript
import PlatformNotifications from './pages/platform/PlatformNotifications'
// In routes:
<Route path="/platform/notifications" element={<PlatformNotifications showToast={showToast} />} />
```

**All announcement actions audit-logged:** create, publish, unpublish, edit, delete.

**Commit message:** `[PA-P1-6] Add Platform Notification Center with announcements, banners, and changelog`

**Test checklist:**
- [ ] Both tables created (by Carlos)
- [ ] Page loads at `/platform/notifications`
- [ ] Nav items appear in TopNav and Sidebar
- [ ] Create announcement works (save as draft)
- [ ] Publish sets `is_published = true` and `published_at`
- [ ] Type badges display with correct colors
- [ ] Target audience picker works
- [ ] Changelog tab filters correctly
- [ ] Expiry filtering works
- [ ] All actions audit-logged
- [ ] Build passes

---

## END-OF-PHASE 1 REPORT TEMPLATE

After completing all sub-phases (0.1-0.6 and 1.1-1.6), produce this report:

```markdown
# PA Command Center — Phase 0 + Phase 1 Completion Report

## Build Status
- [ ] `npm run build` passes
- [ ] No console errors on any platform page

## Summary

| Sub-Phase | Status | Files Modified | Files Created | DB Tables (new) | Commit Hash |
|-----------|--------|---------------|---------------|-----------------|-------------|
| P0-1 Support tables | ✅/⚠️/❌ | ... | ... | ... | ... |
| P0-2 RLS policies | ... | ... | ... | ... | ... |
| P0-3 Audit logging | ... | ... | ... | ... | ... |
| P0-4 Remove legacy | ... | ... | ... | ... | ... |
| P0-5 Security notes | ... | ... | ... | ... | ... |
| P0-6 Safety limits | ... | ... | ... | ... | ... |
| P1-1 Overview | ... | ... | ... | ... | ... |
| P1-2 Org lifecycle | ... | ... | ... | ... | ... |
| P1-3 User mgmt | ... | ... | ... | ... | ... |
| P1-4 Subscriptions | ... | ... | ... | ... | ... |
| P1-5 Settings | ... | ... | ... | ... | ... |
| P1-6 Notifications | ... | ... | ... | ... | ... |

## SQL Migrations Carlos Needs to Run
List all migration files with status (created file / Carlos needs to run / confirmed working)

## New Routes Added
| Path | Component | Nav Entry |
|------|-----------|-----------|

## FLAGS FOR REVIEW
List ANY issues, concerns, ambiguities, or decisions that need Carlos's input.

## Deferred Items
Anything from scope that was intentionally deferred and why.

## Recommended Phase 2 Adjustments
Based on what was learned, any changes to Phase 2 spec.
```
