# PLATFORM ADMIN COMMAND CENTER — PHASE 3 EXECUTION SPEC
# Growth: Understanding and scaling the business
# FINAL VERSION — Post-Phase 2

## Context

Phase 0-2 completed. Current state:
- 13 platform pages (~11,400 lines) + 3 shell/nav + 1 hook
- 16 `platform_*` database tables
- 12 nav sections
- `public.is_platform_admin()` SECURITY DEFINER function in place
- Existing `PlatformAnalyticsPage.jsx` (741 lines) has basic metrics, charts, and tables
- Existing `DataExportPage.jsx` in settings has per-org CSV/JSON export
- Existing `RegistrationFunnelPage.jsx` in reports has org-level funnel
- Engagement tables confirmed in codebase: `xp_ledger`, `shoutouts`, `chat_messages`, `event_attendance`, `player_achievements`, `player_game_stats`, `player_season_stats`, `season_ranks`
- Content tables confirmed: `achievements`, `coach_challenges`, `sport_skill_templates`

## MASTER GUARDRAILS (Same as Phase 1-2)

1. **JSX project.** Validate with `npm run build`. Chunk warning exit code 1 is expected.
2. **Commit format:** `[PA-P3-X]` where X = sub-phase number (1-6).
3. **Run `npm run build` between sub-phases.**
4. **Never modify game badge system.** `player_badges`, `GameDetailModal`, `GameCompletionModal` OFF LIMITS.
5. **Never use "Diego Fuentez"** in placeholder data.
6. **Follow existing patterns.** `useTheme()`, `useThemeClasses()`, `useAuth()`. Card style from existing platform pages.
7. **ALL new RLS policies use `public.is_platform_admin()`.** NEVER use the subquery pattern directly.
8. **Audit log all destructive actions** to `platform_admin_actions`.
9. **Flag and report** ambiguity → FLAGS FOR REVIEW.
10. **Safety limits** on all queries. `.limit()` on every unbounded select.
11. **Preserve existing functionality** when modifying files.
12. **Lazy load new pages** — use the same `lazy(() => import(...))` pattern established in P2-0.

---

## Sub-Phase 3.1: Revenue Analytics Upgrade

**Goal:** Transform the revenue section of `PlatformAnalyticsPage.jsx` into investor-ready metrics.

**File to modify:** `src/pages/platform/PlatformAnalyticsPage.jsx` (741 lines)

**No new database tables.** All computed from existing `platform_subscriptions`, `platform_org_events`, `payments`, `platform_invoices`.

### Changes:

**1. MRR Waterfall Chart** (add as new section):

Calculate for current month:
- **New MRR**: Sum of `price_cents` for subscriptions created this month (normalize annual to monthly)
- **Churned MRR**: Sum of `price_cents` for subscriptions where `status` changed to `'cancelled'` this month (use `cancelled_at`)
- **Net New MRR**: New - Churned
- Visual: horizontal stacked bar or simple bar chart with green (new) and red (churned). Use the same `BarChart` component already in the file.

```javascript
// MRR Waterfall data calculation
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

// New subs this month
const newSubs = activeSubs.filter(s => s.created_at >= startOfMonth)
const newMRR = newSubs.reduce((sum, s) => {
  const monthly = s.billing_cycle === 'annual' ? Math.round((s.price_cents || 0) / 12) : (s.price_cents || 0)
  return sum + monthly
}, 0)

// Churned this month
const { data: churnedSubs } = await supabase
  .from('platform_subscriptions')
  .select('price_cents, billing_cycle, cancelled_at')
  .eq('status', 'cancelled')
  .gte('cancelled_at', startOfMonth)
  .limit(10000)

const churnedMRR = (churnedSubs || []).reduce((sum, s) => {
  const monthly = s.billing_cycle === 'annual' ? Math.round((s.price_cents || 0) / 12) : (s.price_cents || 0)
  return sum + monthly
}, 0)
```

**2. Cohort Retention Table** (add as new section):

Group organizations by the month they were created. For each cohort, calculate how many are still active (have an active subscription) at months 1, 2, 3, ... N since creation.

```javascript
// Cohort calculation
// 1. Get all orgs with creation month
// 2. For each org, check if platform_subscriptions has an active entry
// 3. Group into cohort grid: rows = signup month, columns = months since signup
// Visual: heatmap table where darker = higher retention %
```

Display as an HTML table with:
- Rows: cohort month (e.g., "Jan 2026", "Feb 2026", "Mar 2026")
- Columns: Month 0, Month 1, Month 2, ... (up to current month)
- Cell values: retention % (orgs still active / total orgs in cohort)
- Cell color: green gradient (darker = higher retention)
- Only show cohorts with at least 1 org

**3. Customer Lifetime Value (LTV):**

Simple calculation:
```javascript
const avgRevenuePerOrg = totalRevenue / totalOrgs // revenue from payments table
const avgLifespanMonths = // average months between org creation and cancellation (or now if still active)
const ltv = avgRevenuePerOrg * avgLifespanMonths
```

Display as a KPI card alongside existing cards. If not enough data (no cancellations yet), show "Insufficient data" gracefully.

**4. Churn Analysis Enhancement:**

Add a "Churn Breakdown" section:
- Monthly churn rate trend (line chart over last 6 months)
- Voluntary churn count (status = 'cancelled', from `platform_subscriptions`)
- Involuntary churn count (payment failures from `payments` where status = 'failed')
- Net revenue retention rate: (MRR at end of month - churned MRR + expansion MRR) / MRR at start of month

**5. Revenue by Tier Donut** (already exists — enhance):
- Add trend arrows showing tier growth/shrinkage vs last month

### Implementation note:
The existing `PlatformAnalyticsPage` has a `loadAnalytics()` function with a `Promise.all()`. Add the new queries to this function. Add new state variables for the new data. Add new sections below the existing chart grid.

**Commit message:** `[PA-P3-1] Upgrade revenue analytics with MRR waterfall, cohort retention, LTV, and churn analysis`

**Test checklist:**
- [ ] MRR waterfall displays with correct new/churned amounts
- [ ] Cohort table renders (may show 1 row if only 1 month of data)
- [ ] LTV shows a number or "Insufficient data" gracefully
- [ ] Churn trend chart renders
- [ ] Existing analytics features still work
- [ ] Build passes

---

## Sub-Phase 3.2: Engagement Analytics

**Goal:** New page showing how actively orgs and users are using Lynx.

**New file:** `src/pages/platform/PlatformEngagement.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/engagement`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'engagement', label: 'Engagement' }` AFTER 'analytics' (replace the current position, so analytics-related items group together)
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**No new database tables.** All computed from existing tables.

### Page design:

**1. Platform-Wide Activity Metrics** (top KPI strip):

| Metric | Calculation | Source Tables |
|--------|------------|---------------|
| DAU | Distinct users with any activity today | `chat_messages`, `event_attendance`, `shoutouts`, `xp_ledger` created_at = today |
| WAU | Distinct users with activity in last 7 days | Same tables, last 7 days |
| MAU | Distinct users with activity in last 30 days | Same tables, last 30 days |
| Stickiness | DAU / MAU × 100 (as %) | Computed |
| Active Orgs | Orgs with at least 1 user active in last 7 days | Computed via user_roles join |

**IMPORTANT:** These queries touch large tables. Use COUNT(DISTINCT user_id) with date filters, not full selects. Pattern:

```javascript
// DAU example
const today = new Date().toISOString().split('T')[0]
const { count: chatDAU } = await supabase
  .from('chat_messages')
  .select('sender_id', { count: 'exact', head: true })
  .gte('created_at', today + 'T00:00:00Z')

// Better: use a single RPC function if performance is an issue
// For now, multiple count queries are fine for low-volume
```

Actually — counting distinct users across multiple tables from the client side is expensive and inaccurate (can't dedupe across tables with count+head). **Simpler approach:** Pick the 2-3 most reliable activity signals and use those:

- **Chat messages** sent (count from `chat_messages` by date range)
- **Attendance records** (count from `event_attendance` by date range)
- **XP earned** (count from `xp_ledger` by date range)

Display as individual activity metrics rather than trying to compute a precise DAU. Label them "Chat Activity", "Attendance Activity", "Engagement Activity" with counts per day/week/month.

**2. Feature Adoption Rates:**

For each major feature, count how many orgs are using it (have at least 1 record):

```javascript
const features = [
  { name: 'Chat', table: 'chat_messages', countColumn: 'id' },
  { name: 'Scheduling', table: 'schedule_events', countColumn: 'id' },
  { name: 'Attendance', table: 'event_attendance', countColumn: 'id' },
  { name: 'Engagement/XP', table: 'xp_ledger', countColumn: 'id' },
  { name: 'Shoutouts', table: 'shoutouts', countColumn: 'id' },
  { name: 'Email', table: 'email_notifications', countColumn: 'id' },
  { name: 'Registration', table: 'registrations', countColumn: 'id' },
  { name: 'Payments', table: 'payments', countColumn: 'id' },
]
```

For each: count total records, count records this month, display as horizontal bar chart ranked by usage.

**3. Per-Org Engagement Score** (computed):

For each org, compute a simple score 0-100:
- Has active users in last 7 days: +25
- Has used 3+ features: +25
- Has events scheduled in next 30 days: +25
- Has growing player count (more this month than last): +25

Display as a ranked list: org name, score, breakdown badges. Top 10 most engaged and bottom 10 least engaged.

**4. Activity Trend Charts:**

- Line chart: weekly activity counts over last 12 weeks (pick chat_messages as the primary signal)
- Bar chart: feature usage by category this month

Use the same `SparkLine` and `BarChart` components from `PlatformAnalyticsPage`.

**Commit message:** `[PA-P3-2] Add engagement analytics with activity metrics, feature adoption, and per-org scoring`

**Test checklist:**
- [ ] Activity metrics display counts (may be 0 for empty tables — handle gracefully)
- [ ] Feature adoption chart renders
- [ ] Per-org engagement scores compute
- [ ] Trend charts render
- [ ] Route and nav items added
- [ ] Build passes

---

## Sub-Phase 3.3: Registration Funnel (Platform-Wide)

**Goal:** Platform-wide view of registration conversion across all orgs.

**File to modify:** `src/pages/platform/PlatformAnalyticsPage.jsx` — add a "Registration Funnel" tab or section

**OR** create `src/pages/platform/PlatformRegistrationFunnel.jsx` if the analytics page is getting too large (it's 741 lines currently, will grow with P3-1 changes). **Decision for CC:** If PlatformAnalyticsPage exceeds ~1200 lines after P3-1 changes, create a separate page. Otherwise, add as a new tab within analytics.

**No new database tables.** Computed from existing `registrations`, `payments`, `waiver_signatures`, `team_players`, and optionally `registration_funnel_events`.

### Implementation:

**1. Platform-Wide Funnel:**

Stages (computed from existing data):
```javascript
const FUNNEL_STAGES = [
  { id: 'registered', label: 'Registered', query: () => supabase.from('registrations').select('id', { count: 'exact', head: true }) },
  { id: 'approved', label: 'Approved', query: () => supabase.from('registrations').select('id', { count: 'exact', head: true }).eq('status', 'approved') },
  { id: 'waiver_signed', label: 'Waiver Signed', query: () => supabase.from('waiver_signatures').select('id', { count: 'exact', head: true }) },
  { id: 'paid', label: 'Paid', query: () => supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'paid') },
  { id: 'rostered', label: 'Rostered', query: () => supabase.from('team_players').select('id', { count: 'exact', head: true }) },
]
```

Display as a horizontal funnel visualization:
- Each stage: count + percentage of previous stage (conversion rate)
- Color gradient from blue (start) to green (end)
- Drop-off highlighted in red between stages

**2. Funnel by Org:**
- Same stages, grouped by organization
- Table: Org name | Registered | Approved | Paid | Rostered | Overall Conversion %
- Sort by conversion rate (best/worst)
- Highlight orgs with <50% overall conversion in amber

**3. Monthly Comparison:**
- Side-by-side: this month vs last month at each stage
- Trend arrows for improvement/decline

**4. Integration with existing funnel:**
- Check if `registration_funnel_events` table exists (it may not — the org-level funnel page handles this gracefully)
- If it exists, use it for richer page-view → form-start → completion tracking
- If not, use the simplified stages above

**Commit message:** `[PA-P3-3] Add platform-wide registration funnel with per-org breakdown and monthly comparison`

**Test checklist:**
- [ ] Funnel stages calculate correctly from existing data
- [ ] Conversion rates display between stages
- [ ] Per-org breakdown shows correct numbers
- [ ] Monthly comparison works (may show 0 for months with no data)
- [ ] Handles missing `registration_funnel_events` table gracefully
- [ ] Build passes

---

## Sub-Phase 3.4: Org Health Score Engine

**Goal:** Create a composite health score for each org that predicts churn risk.

**Files to modify:**
- `src/pages/platform/PlatformOrganizations.jsx` (913 lines) — add health score column
- `src/pages/platform/PlatformOrgDetail.jsx` (1363 lines) — add health score section
- `src/pages/platform/PlatformOverview.jsx` (711 lines) — replace simple colors with scores

**New database table — create migration `supabase/migrations/20260330_platform_health_scores.sql`:**

```sql
CREATE TABLE IF NOT EXISTS platform_org_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  activity_score INTEGER CHECK (activity_score BETWEEN 0 AND 100),
  payment_score INTEGER CHECK (payment_score BETWEEN 0 AND 100),
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
  growth_score INTEGER CHECK (growth_score BETWEEN 0 AND 100),
  setup_score INTEGER CHECK (setup_score BETWEEN 0 AND 100),
  churn_risk TEXT,
  risk_factors JSONB DEFAULT '[]',
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE platform_org_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage health scores"
  ON platform_org_health_scores FOR ALL
  USING (public.is_platform_admin());

CREATE INDEX idx_health_scores_org ON platform_org_health_scores(organization_id);
CREATE INDEX idx_health_scores_risk ON platform_org_health_scores(churn_risk);
```

**ACTION REQUIRED:** Carlos must run this SQL.

### Score Calculation:

Create a shared utility function `src/lib/healthScoreCalculator.js`:

```javascript
export function calculateHealthScore(org, data) {
  const scores = {}
  const riskFactors = []

  // Activity Score (0-100): Recent activity signals
  const hasRecentEvents = data.recentEventCount > 0
  const hasRecentChat = data.recentChatCount > 0
  const hasRecentAttendance = data.recentAttendanceCount > 0
  scores.activity = (hasRecentEvents ? 35 : 0) + (hasRecentChat ? 35 : 0) + (hasRecentAttendance ? 30 : 0)
  if (scores.activity < 30) riskFactors.push('no_recent_activity')

  // Payment Score (0-100): Subscription and payment health
  const hasActiveSub = data.subscriptionStatus === 'active'
  const hasFailedPayments = data.failedPaymentCount > 0
  const isPastDue = data.subscriptionStatus === 'past_due'
  scores.payment = (hasActiveSub ? 50 : 0) + (!hasFailedPayments ? 30 : 0) + (!isPastDue ? 20 : 0)
  if (hasFailedPayments) riskFactors.push('payment_failures')
  if (isPastDue) riskFactors.push('past_due')

  // Engagement Score (0-100): Feature breadth
  const featuresUsed = data.featuresUsed || 0 // count of distinct feature tables with records
  scores.engagement = Math.min(100, featuresUsed * 20) // 5 features = 100
  if (featuresUsed < 2) riskFactors.push('low_feature_adoption')

  // Growth Score (0-100): Player/team count trend
  const isGrowing = data.playerCountThisMonth > data.playerCountLastMonth
  const isStable = data.playerCountThisMonth >= data.playerCountLastMonth
  scores.growth = isGrowing ? 100 : (isStable ? 60 : 20)
  if (!isStable) riskFactors.push('declining_roster')

  // Setup Score (0-100): Onboarding milestones (from Phase 2)
  const milestonesComplete = data.milestonesComplete || 0
  scores.setup = Math.round((milestonesComplete / 7) * 100)
  if (milestonesComplete < 4) riskFactors.push('incomplete_setup')

  // Overall: weighted average
  scores.overall = Math.round(
    scores.activity * 0.25 +
    scores.payment * 0.25 +
    scores.engagement * 0.20 +
    scores.growth * 0.15 +
    scores.setup * 0.15
  )

  // Churn risk
  let churnRisk = 'low'
  if (scores.overall < 40) churnRisk = 'critical'
  else if (scores.overall < 60) churnRisk = 'high'
  else if (scores.overall < 80) churnRisk = 'medium'

  return { ...scores, churn_risk: churnRisk, risk_factors: riskFactors }
}
```

### Changes to PlatformOverview.jsx:

- Add a "Compute Health Scores" button (or auto-compute on page load)
- For each org, compute the health score and upsert into `platform_org_health_scores`
- Replace the simple green/yellow/red indicators with score badges (0-100 with color gradient)
- Add "At Risk" section showing orgs with churn_risk = 'high' or 'critical'

### Changes to PlatformOrganizations.jsx:

- Add health score column to org cards/list
- Add sort option: "Sort by Health Score"
- Add filter: "At Risk" (churn_risk = 'high' or 'critical')

### Changes to PlatformOrgDetail.jsx:

- Add "Health Score" section on the Overview tab
- Show overall score as a large circular progress indicator
- Show 5 sub-scores as smaller bars (activity, payment, engagement, growth, setup)
- Show risk factors as warning badges
- "Recalculate" button to refresh the score

**Commit message:** `[PA-P3-4] Add org health score engine with composite scoring, churn risk, and risk factors`

**Test checklist:**
- [ ] `platform_org_health_scores` table created (by Carlos)
- [ ] Health scores compute for existing orgs
- [ ] Churn risk categorization works
- [ ] Overview shows scores instead of simple colors
- [ ] Org list sorts/filters by health score
- [ ] Org detail shows score breakdown
- [ ] Build passes

---

## Sub-Phase 3.5: Data Export & Reports Upgrade

**Goal:** Add platform-level aggregate exports and investor-ready metrics download.

**File to modify:** `src/pages/settings/DataExportPage.jsx` — enhance the existing page

**OR** create a simpler platform-level export section. Since `DataExportPage` is org-scoped with a PA org-selector override, it's better to add a **new section to PlatformAnalyticsPage** or **create a small utility**.

**Approach:** Add an "Export" action bar to `PlatformAnalyticsPage.jsx` since that's where the data already lives.

### Changes to PlatformAnalyticsPage.jsx:

**1. Export Action Bar** (add at top of page, next to date range selector):

Two export buttons:
- "Export Analytics (CSV)" — exports the current analytics data as CSV
- "Export Investor Summary (CSV)" — exports a pre-formatted investor metrics sheet

**2. Investor Summary Export:**

Generate a CSV with:
```
Metric,Value,Period
Total Organizations,X,All Time
Active Organizations,X,Current
Total Users,X,All Time
Monthly Recurring Revenue,$X,Current Month
Annual Recurring Revenue,$X,Projected
Churn Rate,X%,Current Month
Customer LTV,$X,Calculated
Total Teams,X,All Time
Total Players,X,All Time
Registrations This Month,X,Current Month
Payment Volume This Month,$X,Current Month
```

Use the existing `buildCSV` and `triggerDownload` functions from `../../pages/settings/dataExportHelpers`.

**3. Cross-Org Aggregate Export:**

"Export All Org Summary (CSV)" button:
```
Organization,Status,Members,Teams,Players,Seasons,Revenue,Health Score,Created
Org A,Active,25,4,80,2,$2400,85,2026-01-15
Org B,Trialing,5,1,12,1,$0,42,2026-03-01
...
```

Query all orgs with their aggregate counts (already loaded for the analytics page).

**4. Tax Report Export:**

"Export Revenue Report (CSV)" button:
```
Month,Gross Revenue,Refunds,Net Revenue,Transaction Count
2026-01,5000.00,0.00,5000.00,15
2026-02,7500.00,200.00,7300.00,22
...
```

Computed from `payments` table grouped by month.

### Reuse from existing code:

```javascript
import { buildCSV, buildJSON, triggerDownload } from '../../pages/settings/dataExportHelpers'
```

This import already works — the helpers are pure utility functions.

**Commit message:** `[PA-P3-5] Add investor summary export, cross-org aggregate export, and tax report to analytics`

**Test checklist:**
- [ ] Investor summary CSV generates correctly
- [ ] Cross-org aggregate CSV generates
- [ ] Tax report CSV generates with monthly grouping
- [ ] Downloads trigger in browser
- [ ] Build passes

---

## Sub-Phase 3.6: Content Manager

**Goal:** Manage platform-wide content (sport templates, badges, challenges) from the PA dashboard.

**New file:** `src/pages/platform/PlatformContentManager.jsx`

**Files to modify:**
- `src/MainApp.jsx` — add lazy import and route for `/platform/content`
- `src/components/platform/PlatformTopNav.jsx` — add `{ id: 'content', label: 'Content' }` before 'settings'
- `src/components/platform/PlatformSidebar.jsx` — add to SECTION_NAV

**No new database tables.** Manages existing tables: `sport_skill_templates`, `achievements`, `coach_challenges`, `sports`.

### Page design — 4 tabs:

**Tab 1: Sport Skill Templates**
- Query `sport_skill_templates` — show all templates grouped by sport
- Display: sport name, skill category, skill name, description
- "Add Template" button → modal with: sport (select from `sports` table), category, name, description
- "Edit" and "Delete" actions per template
- Count display: "X templates across Y sports"

**Tab 2: Badge Library**
- Query `achievements` table — show all achievement/badge definitions
- Display as a grid: badge name, description, category, tier, XP reward
- Filter by category (from the V2 5-category framework)
- Filter by tier
- Read-only for now — badge images are in Supabase Storage `badges` bucket
- Display badge image if URL is available: `<img src={badge.image_url} />` with fallback icon
- Count display: "X badges in Y categories"

**NOTE:** Do NOT modify the `achievements` table or `player_badges` or `player_achievements`. This tab is READ-ONLY for browsing the badge library. Editing badge definitions is deferred — it's complex and touches the engagement system.

**Tab 3: Challenge Templates**
- Query `coach_challenges` where the challenge is a template (not assigned to a specific team/player)
- This may need investigation — check if `coach_challenges` has a `is_template` or `organization_id IS NULL` pattern for platform-level templates
- If all challenges are org-scoped, show them grouped by org with counts
- "Add Default Template" button → modal to create a new challenge template
- Display: challenge name, description, difficulty, XP reward, sport

**Tab 4: Sports Management**
- Query `sports` table — show all configured sports
- Display: sport name, icon, number of orgs using it, number of skill templates
- "Add Sport" and "Edit Sport" modals
- "Disable Sport" toggle (if there's an `is_active` column, otherwise just display)
- Count display: "X sports configured"

### RLS note:
The existing tables (`sport_skill_templates`, `achievements`, `coach_challenges`, `sports`) may have org-scoped RLS. The `public.is_platform_admin()` policies added in Phase 0 may not cover these tables. **CC should check:** do SELECT queries on these tables return data for the PA? If not, add RLS policies:

```sql
-- Only if needed (check first!)
CREATE POLICY "Platform admins can read all sport_skill_templates"
  ON sport_skill_templates FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins can manage sport_skill_templates"
  ON sport_skill_templates FOR ALL
  USING (public.is_platform_admin());

-- Same pattern for sports, achievements, coach_challenges if needed
```

**Flag any RLS issues in the completion report** — Carlos will run the fix SQL.

**Commit message:** `[PA-P3-6] Add Content Manager for sport templates, badge library, challenges, and sports`

**Test checklist:**
- [ ] Sport skill templates load and display grouped by sport
- [ ] Badge library displays with images (or fallback)
- [ ] Challenge templates display
- [ ] Sports management shows configured sports
- [ ] Add/Edit/Delete work on sport_skill_templates
- [ ] Badge tab is READ-ONLY (no edit/delete on achievements)
- [ ] RLS issues flagged if queries return empty
- [ ] Route and nav items added
- [ ] Build passes

---

## SQL MIGRATIONS SUMMARY

Only 1 new migration for Phase 3:

| Migration | Tables/Changes |
|-----------|---------------|
| `20260330_platform_health_scores.sql` | CREATE platform_org_health_scores |

Plus potential RLS policy additions for content tables (flagged by CC if needed).

---

## END-OF-PHASE 3 REPORT TEMPLATE

```markdown
# PA Command Center — Phase 3 Completion Report

## Build Status
- [ ] `npm run build` passes
- [ ] No console errors on any platform page

## Summary
| Sub-Phase | Status | Files Modified | Files Created | DB Changes | Commit Hash |
|-----------|--------|---------------|---------------|------------|-------------|
| P3-1 Revenue analytics | ✅/⚠️/❌ | ... | ... | ... | ... |
| P3-2 Engagement | ... | ... | ... | ... | ... |
| P3-3 Registration funnel | ... | ... | ... | ... | ... |
| P3-4 Health scores | ... | ... | ... | ... | ... |
| P3-5 Data export | ... | ... | ... | ... | ... |
| P3-6 Content manager | ... | ... | ... | ... | ... |

## SQL Migrations Carlos Needs to Run
List all migration files with status.

## New Routes Added
| Path | Component | Nav Entry |

## RLS Issues Found
List any tables where PA queries returned empty due to RLS.
Include the exact SQL fix for Carlos to run.

## Performance Assessment
- Are analytics queries fast enough?
- Any that need optimization or server-side aggregation?

## FLAGS FOR REVIEW
Issues needing Carlos's input.

## Deferred Items
What was intentionally deferred and why.

## Recommended Phase 4 Adjustments
Based on learnings from Phase 3.
```
