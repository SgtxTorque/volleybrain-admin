# CC-PLATFORM-ADMIN-MODE

## Executive Summary

Transform the current platform admin experience from "three links crammed into the org sidebar" into a fully separate **Platform Mode** — a distinct shell with its own top nav bar, contextual left sidebar, and dedicated page content. This gives Carlos (the Lynx platform owner) a proper SaaS operations command center, visually and functionally separated from the org-level experience.

---

## Architecture Overview

### Two Modes, One App

The app now has two top-level modes:

1. **Org Mode** (current) — The dark navy sidebar, role pills, org-specific nav groups. No changes.
2. **Platform Mode** (new) — A gradient top nav bar + lighter contextual left sidebar + full-width content. Completely different visual identity.

A new state variable `appMode` controls which shell renders:
- `appMode === 'org'` → current LynxSidebar + content layout (unchanged)
- `appMode === 'platform'` → new PlatformTopNav + PlatformSidebar + platform content layout

### Entry Point

In the current LynxSidebar, the three existing platform links (Analytics, Subscriptions, Platform Admin) in the bottom utility area get **replaced** by a single entry point:

- Icon: Shield with a small arrow/launch indicator
- Label (on hover): "Platform Mode"
- Click → sets `appMode = 'platform'` and navigates to `/platform/overview`
- This button only renders when `isPlatformAdmin === true` (same gate as today)

### Exit Point

In Platform Mode, there is an "Exit to [Org Name]" button visible in the top nav bar (far right, next to profile avatar). Clicking it sets `appMode = 'org'` and navigates to `/dashboard`.

---

## Phase 0: State Management & Routing Foundation

### New State in MainApp

```
// Add to MainApp component state
const [appMode, setAppMode] = useState('org') // 'org' | 'platform'
```

When `appMode === 'platform'`:
- LynxSidebar does NOT render
- HorizontalNavBar does NOT render (it's dead code anyway — delete it in this phase)
- Instead, render: `<PlatformShell>` which contains `<PlatformTopNav>` + `<PlatformSidebar>` + platform content area

When `appMode === 'org'`:
- Everything works exactly as it does today. Zero changes.

### Route Structure

All platform routes live under `/platform/`:

| Route | Section | Component |
|-------|---------|-----------|
| `/platform/overview` | Overview | PlatformOverview |
| `/platform/organizations` | Organizations | PlatformOrganizations |
| `/platform/organizations/:orgId` | Org Detail | PlatformOrgDetail |
| `/platform/users` | Users | PlatformUsers |
| `/platform/subscriptions` | Subscriptions | PlatformSubscriptions |
| `/platform/analytics` | Analytics | PlatformAnalytics |
| `/platform/support` | Support | PlatformSupport |
| `/platform/audit` | Audit Log | PlatformAuditLog |
| `/platform/settings` | Settings | PlatformSettings |

### Files to Create

```
src/
  components/
    platform/
      PlatformShell.jsx          — wraps top nav + sidebar + content
      PlatformTopNav.jsx         — gradient top nav bar
      PlatformSidebar.jsx        — contextual left sidebar (lighter color)
  pages/
    platform/
      PlatformOverview.jsx       — main dashboard (refactored from OverviewTab)
      PlatformOrganizations.jsx  — org list + health (refactored from OrganizationsTab)
      PlatformOrgDetail.jsx      — single org drill-down (refactored from OrgDetailSlideOver)
      PlatformUsers.jsx          — user management (refactored from UsersTab)
      PlatformSubscriptions.jsx  — EXISTS — refactor in place
      PlatformAnalytics.jsx      — EXISTS — refactor in place
      PlatformSupport.jsx        — NEW — support inbox
      PlatformAuditLog.jsx       — audit log (refactored from AuditLogTab)
      PlatformSettings.jsx       — NEW — platform config
```

### Files to Modify

- `src/MainApp.jsx` — add `appMode` state, conditional shell rendering, new routes
- `src/components/layout/LynxSidebar.jsx` — replace 3 platform links with single "Platform Mode" button
- Delete dead `HorizontalNavBar` function from MainApp.jsx

### DO NOT

- Change any org-mode behavior, styling, routing, or components
- Modify AuthContext (isPlatformAdmin already works)
- Change the LynxSidebar's appearance or behavior beyond replacing the 3 bottom links
- Remove or rename existing platform page files until their content is migrated

---

## Phase 1: PlatformTopNav — The Gradient Top Bar

### Design Spec

**Layout:** Full-width horizontal bar, fixed to top, height 56px, z-50.

**Background:** 4-color CSS gradient, left to right, 60% light territory:

```css
background: linear-gradient(
  to right,
  #F8FAFC 0%,        /* near-white / cloud */
  #E8F4FD 35%,       /* light sky tint */
  #4BB9EC 70%,       /* lynx sky blue */
  #0B1628 100%       /* lynx navy */
);
```

Adjust the stops so approximately 60% of the bar is in the light color range. The nav text items sit in the light zone so they remain readable in dark navy.

**Far Left:** Full Lynx logo (not just the paw — use the `/lynx-logo.png` or a horizontal lockup). Next to it, text label: **"Platform Admin"** in `#0B1628` (navy), font-weight bold, text-lg. These should be vertically centered.

**Center-Right (still in light zone):** Navigation items as text buttons. Dark navy text (`#0B1628`). Font: Inter Variable (matches current brand system). Active item gets an underline or pill highlight using `#4BB9EC` (sky blue).

Nav items in order:
1. **Overview**
2. **Organizations**
3. **Users**
4. **Subscriptions**
5. **Analytics**
6. **Support**
7. **Audit Log**
8. **Settings**

**Far Right (in the darker zone):** 
- Profile avatar (same circular avatar as current sidebar)
- "Exit to [Org Name]" button — a small pill/chip with the org initial + name that navigates back to org mode. White text since it's on the dark end of the gradient. Use a small X or arrow-left icon.

### Behavior

- Clicking a nav item navigates to `/platform/{section}` and updates the active indicator
- The nav bar is sticky/fixed at top
- On smaller screens (if relevant), nav items could collapse into a hamburger — but Carlos works on a 27" 1440p monitor, so this is low priority

### Component Props

```jsx
<PlatformTopNav
  activeSection={currentPlatformSection}  // 'overview' | 'organizations' | etc.
  onNavigate={(section) => navigate(`/platform/${section}`)}
  profile={profile}
  orgName={organization?.name || 'My Club'}
  onExitPlatformMode={() => { setAppMode('org'); navigate('/dashboard') }}
/>
```

---

## Phase 2: PlatformSidebar — Contextual Drill-Down

### Design Spec

**Layout:** Fixed left sidebar, same expand-on-hover pattern as LynxSidebar (64px collapsed → ~228px expanded). BUT:

**Color:** Use a **light color scheme** to visually distinguish from org mode's dark navy sidebar.

- Background: `#F1F5F9` (slate-100) or `#F8FAFC` (slate-50)
- Border-right: `1px solid #E2E8F0` (slate-200)
- Text: `#334155` (slate-700) for primary, `#94A3B8` (slate-400) for muted
- Active item: sky blue highlight (`#4BB9EC` background at 10-15% opacity, sky blue text)
- Active indicator: left border bar in `#4BB9EC` (same pattern as current sidebar's sky blue bar)
- Hover: `#E2E8F0` background
- Icons: `#64748B` (slate-500), active: `#4BB9EC`

This creates an immediate visual signal: "I am NOT in my org."

**Behavior:** Same hover-to-expand as LynxSidebar. 64px shows icons only, hover expands to show labels. Collapsible groups with chevrons.

**Content is CONTEXTUAL** — it changes based on which top nav section is active:

| Top Nav Section | Sidebar Shows |
|-----------------|---------------|
| Overview | Quick stats summary, recent alerts, quick links to each section |
| Organizations | List of all orgs (searchable), each clickable to drill into |
| Org Detail (sub-page) | That org's info: members list, teams, seasons, actions |
| Users | Filter options (by org, by role, by status), recent users |
| Subscriptions | Filter by tier, filter by status, revenue summary |
| Analytics | Date range selector, metric category filters |
| Support | Open tickets count, filter by status (open/in-progress/resolved) |
| Audit Log | Filter by action type, filter by date range |
| Settings | Settings categories (General, Billing Config, Feature Flags, Tier Limits) |

### Top of Sidebar (always visible)

- Lynx paw icon + "Platform" label (collapsed: just paw, expanded: paw + "Platform")
- Below: small text showing platform stats — e.g., "4 orgs · 23 users" (updates from data)
- Divider line

### Bottom of Sidebar (always visible)

- "Exit to [Org Name]" button with org avatar/initial — same escape hatch as top nav, for convenience
- Theme toggle (dark/light mode)
- Sign out

### Component Props

```jsx
<PlatformSidebar
  activeSection={currentPlatformSection}
  activePage={currentPlatformPage}        // for sub-pages like org detail
  organizations={orgs}                     // for org list in sidebar
  platformStats={{ orgCount, userCount }}
  onNavigate={(path) => navigate(path)}
  onExitPlatformMode={() => { setAppMode('org'); navigate('/dashboard') }}
  orgName={organization?.name}
  orgInitials={orgInitials}
  isDark={isDark}
  onToggleTheme={toggleTheme}
  onSignOut={signOut}
/>
```

---

## Phase 3: PlatformShell — The Wrapper

This component wraps the platform layout: top nav + sidebar + content.

```jsx
function PlatformShell({ children, activeSection, ...props }) {
  return (
    <div className="min-h-screen bg-slate-50">  {/* or bg-lynx-cloud */}
      <PlatformTopNav activeSection={activeSection} {...topNavProps} />
      <div className="flex pt-14">  {/* offset by top nav height */}
        <PlatformSidebar activeSection={activeSection} {...sidebarProps} />
        <main className="flex-1 pl-16 p-6">  {/* offset by sidebar width */}
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Content Area

- Background: `#F8FAFC` (light) or `bg-lynx-midnight` (dark mode) — same as current content area
- Padding: comfortable `p-6` around content
- Max-width: consider `max-w-7xl mx-auto` for readability on Carlos's 27" monitor, or let it breathe full-width depending on the page

---

## Phase 4: PlatformOverview — The Command Center Dashboard

This is the first thing Carlos sees when entering Platform Mode. Refactor content from the current `OverviewTab` in `PlatformAdminPage.jsx` and enhance significantly.

### Layout

**Top Row: KPI Cards (4-6 cards in a responsive grid)**

| Card | Data Source | Icon | Color |
|------|------------|------|-------|
| Total Organizations | `organizations` count | Building2 | `#3B82F6` blue |
| Total Users | `profiles` count | Users | `#8B5CF6` purple |
| Active Seasons | `seasons` where status = 'active' count | Calendar | `#10B981` green |
| Total Teams | `teams` count | Shield | `#F59E0B` amber |
| Monthly Revenue | `payments` where paid = true, created this month | DollarSign | `#EC4899` pink |
| Active Subscriptions | `platform_subscriptions` where status = 'active' count | CreditCard | `#06B6D4` cyan |

Each card shows: icon, big number, label, and a small trend indicator if possible (e.g., "+2 this month" in green or "no change" in gray).

**Second Row: Two-column layout**

Left column — **Org Health at a Glance**: A compact list of all organizations with traffic-light health indicators:
- 🟢 Green: active season, teams created, members joined, recent activity
- 🟡 Yellow: org exists but missing setup steps (no season, no teams, or no members beyond admin)
- 🔴 Red: suspended or flagged issues

Each row shows: org name, member count, team count, health dot, last activity date. Clicking navigates to `/platform/organizations/:orgId`.

Right column — **Recent Activity Feed**: A timeline of recent platform events:
- New org created
- New user signed up
- Subscription changed
- Org suspended/activated
- Support ticket submitted (once support is built)
- Pull from `platform_admin_actions` table + recent `profiles.created_at` + recent `organizations.created_at`

**Third Row: Quick Actions**

Horizontal row of action buttons/cards:
- "View All Organizations" → `/platform/organizations`
- "Manage Subscriptions" → `/platform/subscriptions`
- "Check Support Inbox" → `/platform/support`
- "Review Audit Log" → `/platform/audit`

### Styling

- Use the Lynx brand card style: `rounded-[14px]`, subtle shadow, border
- Light mode: white cards on slate-50 background
- Dark mode: dark glass cards on midnight background
- Font: Inter Variable
- NO glassmorphism / backdrop-blur in platform mode — keep it clean and professional, more like a business dashboard than the sporty org UI
- Gold text on light backgrounds is PROHIBITED (existing brand rule)

---

## Phase 5: PlatformOrganizations — Org Management + Health

Refactor from `OrganizationsTab` and `OrgDetailSlideOver` in current `PlatformAdminPage.jsx`.

### Org List View (`/platform/organizations`)

**Top: Search + Filters**
- Search bar: by org name or slug
- Filter pills: All | Active | Suspended | Needs Attention (yellow health)
- Sort: by name, by created date, by member count

**Org Cards/Rows** — each org as a card showing:
- Org avatar (first letter or logo_url)
- Org name + slug
- Status badge (Active / Suspended)
- Member count, team count, active season count
- Health indicator dot (green/yellow/red) based on onboarding completeness
- Subscription tier badge (Free / Pro / Club / Elite / Enterprise)
- Last activity timestamp
- Quick actions: View Details, Suspend/Activate
- Click card → navigates to `/platform/organizations/:orgId`

**Onboarding Health Logic (NEW)**

For each org, calculate a setup completeness score:
- ✅ Created organization (always true)
- ✅/❌ Has at least 1 season
- ✅/❌ Has at least 1 team
- ✅/❌ Has at least 1 non-admin member (coach or parent)
- ✅/❌ Has registration configured
- ✅/❌ Has payment setup configured
- ✅/❌ Has at least 1 scheduled event

Display as a progress indicator (e.g., "4/7 setup steps complete") on the org card.

### Org Detail View (`/platform/organizations/:orgId`)

Full-page detail view (NOT a slide-over — this is a proper page now).

**Header:** Org name, slug, status badge, created date, subscription tier, health score.

**Action Buttons (top right):** 
- "View As Admin" → future Phase for impersonation
- "View As Coach" → future Phase
- "View As Parent" → future Phase
- Suspend / Activate toggle
- Delete (with confirmation modal — type DELETE to confirm, same as current)

**Tabbed Content Below:**

| Tab | Content |
|-----|---------|
| Overview | KPI cards for this org (members, teams, seasons, revenue), onboarding checklist with check/X for each step, recent activity for this org |
| Members | Table of all users in this org (from `user_roles` joined with `profiles`). Show name, email, role, joined date, last active. Actions: view profile, remove from org |
| Teams | List of all teams. Name, division, player count, coach name, season. Click to see roster |
| Seasons | All seasons for this org. Name, sport, status, date range, team count |
| Payments | All payments for this org. Player name, amount, status (paid/pending/overdue), date |
| Subscription | This org's subscription details. Current tier, billing cycle, status, payment history. Ability to change tier, apply credits, extend trial |
| Activity Log | Filtered audit log showing only actions related to this org |

### Sidebar Content (when on Organizations section)

The platform sidebar shows:
- Search box
- Scrollable list of all orgs with health indicator dots
- Clicking an org in sidebar navigates to `/platform/organizations/:orgId`
- Active org is highlighted

---

## Phase 6: PlatformUsers — Cross-Org User Management

Refactor from `UsersTab` in current `PlatformAdminPage.jsx`.

### User Table

**Top: Search + Filters**
- Search: by name, email
- Filter: by org (dropdown), by role (admin/coach/parent/player), by status (active/suspended)

**Table Columns:**
- Avatar + Name
- Email
- Organization(s) they belong to (query `user_roles` to get all org memberships)
- Role(s) in each org
- Joined date
- Status (Active / Suspended)
- Platform Admin badge (if `is_platform_admin`)
- Actions: Suspend/Activate, Grant/Revoke Super-Admin

### Enhancement: User Detail Slide-Over

Clicking a user row opens a slide-over panel showing:
- Full profile info
- All org memberships with roles
- Recent activity (logins, actions)
- Payment history across all orgs
- Suspend/activate controls

### Sidebar Content (when on Users section)

- Filter controls
- Quick stats: total users, active today, new this week
- Recently joined users list

---

## Phase 7: PlatformSupport — Support Inbox (NEW)

This is entirely new. It gives org admins a way to reach Carlos from within the app, and gives Carlos a way to track and resolve issues.

### Database Setup

Create new table: `platform_support_tickets`

```sql
CREATE TABLE platform_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  submitted_by UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT CHECK (category IN ('bug', 'feature_request', 'billing', 'setup_help', 'general')),
  assigned_to UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE platform_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES platform_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: platform admins can see all tickets
-- Org admins can see tickets from their own org
-- Regular users cannot see support tickets
```

### Support Inbox View (`/platform/support`)

**Top: Filter bar**
- Status pills: All | Open | In Progress | Resolved | Closed
- Priority filter: All | Urgent | High | Normal | Low
- Category filter: All | Bug | Feature Request | Billing | Setup Help | General

**Ticket List:**
- Each ticket as a card/row: subject, org name, submitted by, priority badge, status badge, time since created
- Unread/new tickets highlighted
- Click → opens ticket detail

**Ticket Detail View:**
- Full conversation thread (messages from org admin + Carlos's replies)
- Internal notes (only visible to platform admins, not to the org admin)
- Status controls: change status dropdown
- Priority controls: change priority
- Resolution notes field (when resolving)
- "Reply" message composer at bottom

### Org-Side Submission (future spec)

For org admins, add a "Help & Support" link in their sidebar (Setup section) that opens a form to submit a ticket. This is a SEPARATE spec — do NOT build the org-side form in this spec. Just build the platform admin inbox that's ready to receive tickets.

### Sidebar Content (when on Support section)

- Open ticket count badge
- Quick filters
- List of recent tickets with status indicators

---

## Phase 8: PlatformAuditLog — Action History

Refactor from `AuditLogTab` in current `PlatformAdminPage.jsx`.

### Enhancements Over Current

**Filters (top):**
- Date range picker (today, last 7 days, last 30 days, custom range)
- Action type filter (suspend_org, activate_org, delete_org, suspend_user, activate_user, grant_super_admin, revoke_super_admin, change_subscription, etc.)
- Actor filter (which platform admin performed the action — relevant if Carlos grants super-admin to someone else later)

**Table/Timeline:**
- Each entry: timestamp, action icon + label, target (org name or user name), performed by, details expandable
- Paginated or infinite scroll
- Export to CSV button

### Sidebar Content (when on Audit Log section)

- Date range quick filters
- Action type filters
- Summary stats: "47 actions this month", "Last action: 2 hours ago"

---

## Phase 9: PlatformAnalytics — Refactor Existing

The current `PlatformAnalyticsPage.jsx` (767 lines) already has good content. Refactor it to:

1. Remove its own access gate (PlatformShell handles that now)
2. Remove its own header/title (PlatformTopNav shows the active section)
3. Adjust styling to match the new platform mode design language (no glassmorphism, clean professional cards)
4. Keep all existing chart/metric logic
5. Add the sidebar contextual content (date range, metric filters)

### Sidebar Content (when on Analytics section)

- Date range selector (7d / 30d / 90d / Year / All Time)
- Metric category toggles (Growth, Revenue, Engagement, Retention)

---

## Phase 10: PlatformSubscriptions — Refactor Existing

The current `PlatformSubscriptionsPage.jsx` (707 lines) already works. Refactor it to:

1. Remove its own access gate
2. Remove its own header
3. Adjust styling
4. **CRITICAL: Align tier names to the finalized pricing model:**
   - Current tiers in code: `free`, `starter`, `pro`, `enterprise`
   - Correct tiers: `free`, `pro`, `club`, `elite`, `enterprise`
   - Update `TIER_CONFIG` object accordingly
   - Update any references in `platform_subscriptions` table data

### Sidebar Content (when on Subscriptions section)

- Revenue summary (MRR, ARR)
- Tier breakdown (how many orgs on each tier)
- Filter by tier, filter by status

---

## Phase 11: PlatformSettings — Platform Configuration (NEW)

New page for platform-level configuration that doesn't belong in any org.

### Sections

**General**
- Platform name display
- Platform domain (`thelynxapp.com`)
- Default timezone
- Support email address

**Tier & Limits Configuration**
- Define what each tier includes (team limits, feature access, etc.)
- This is the configuration side of the pricing model
- Displays current tier definitions, allows editing limits per tier

**Feature Flags** (future — scaffold the page with a placeholder)
- Per-org or per-tier feature toggles
- Show a "Coming Soon" placeholder for now

**Branding**
- Default platform colors (for new orgs that haven't customized)
- Default sport types available

### Sidebar Content (when on Settings section)

- Settings category list: General, Tiers & Limits, Feature Flags, Branding

---

## Phase 12: LynxSidebar Modification

### Changes to `src/components/layout/LynxSidebar.jsx`

In the bottom utility section (lines 291-310), **replace** the three individual platform nav items:

```jsx
{/* REMOVE THIS BLOCK */}
{isPlatformAdmin && (
  <div className="py-1">
    <NavItem item={{ id: 'platform-analytics', ... }} />
    <NavItem item={{ id: 'platform-subscriptions', ... }} />
    <NavItem item={{ id: 'platform-admin', ... }} />
  </div>
)}
```

**Replace with** a single "Platform Mode" button:

```jsx
{isPlatformAdmin && (
  <div className="py-1">
    <button
      onClick={() => onEnterPlatformMode?.()}
      className="relative w-full flex items-center gap-3 h-9 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors duration-200"
      title="Platform Mode"
    >
      <div className="w-16 min-w-[64px] flex items-center justify-center shrink-0">
        <Shield className="w-[18px] h-[18px]" />
      </div>
      <span className="text-r-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Platform Mode
      </span>
    </button>
  </div>
)}
```

Use amber/gold color to make it visually distinct from regular nav items — this is a mode switch, not a page link.

### New Prop

Add `onEnterPlatformMode` to the LynxSidebar prop list. In MainApp, wire it:

```jsx
onEnterPlatformMode={() => { setAppMode('platform'); navigate('/platform/overview') }}
```

---

## Global Design Rules for Platform Mode

1. **NO glassmorphism / backdrop-blur** — Platform mode is clean, professional, business dashboard. Save the glass effects for the org experience.
2. **Card style:** `rounded-[14px]`, white background (light mode) or `#1E293B` slate-800 (dark mode), subtle `shadow-sm`, `border border-slate-200` (light) or `border-white/[0.06]` (dark).
3. **Font:** Inter Variable everywhere. No Bebas Neue, no Tele-Grotesk in platform mode.
4. **Colors:** Navy text `#0B1628` for headings. Sky blue `#4BB9EC` for active states and primary actions. Slate tones for secondary text. Gold `#FFD700` sparingly for accent only.
5. **Gold text on light backgrounds is PROHIBITED.**
6. **Button variety required** — don't make every button the same color.
7. **Tables:** Clean, properly aligned, with hover row highlighting. No glass effects on table rows.
8. **Dark mode:** Fully supported. The lighter sidebar goes to a darker-but-not-navy shade (e.g., `#1E293B` slate-800) to still contrast with the darkest navy in org mode.

---

## Execution Order

Run phases in order. Commit after each phase. Stop and report if blocked.

| Phase | Description | Depends On |
|-------|-------------|------------|
| 0 | State management, routing, delete dead HorizontalNavBar | Nothing |
| 1 | PlatformTopNav component | Phase 0 |
| 2 | PlatformSidebar component | Phase 0 |
| 3 | PlatformShell wrapper + MainApp integration | Phases 1, 2 |
| 4 | PlatformOverview page | Phase 3 |
| 5 | PlatformOrganizations + OrgDetail pages | Phase 3 |
| 6 | PlatformUsers page | Phase 3 |
| 7 | PlatformSupport (NEW — includes SQL migration) | Phase 3 |
| 8 | PlatformAuditLog refactor | Phase 3 |
| 9 | PlatformAnalytics refactor | Phase 3 |
| 10 | PlatformSubscriptions refactor + tier alignment | Phase 3 |
| 11 | PlatformSettings (NEW) | Phase 3 |
| 12 | LynxSidebar modification | Phase 0 |

**IMPORTANT:** Phases 4-11 can be run in any order after Phase 3 is complete. Phase 12 can be run anytime after Phase 0.

---

## DO NOT

- Change ANY org-mode components, styling, or behavior
- Modify AuthContext.jsx
- Change the LynxSidebar expand/collapse behavior or dimensions
- Remove the existing 3 platform page files until their content is fully migrated into the new platform mode pages
- Use glassmorphism/backdrop-blur in platform mode
- Use Bebas Neue or Tele-Grotesk fonts in platform mode
- Use gold text on light backgrounds
- Install new npm packages without checking package.json first
- Change any database table that isn't explicitly mentioned in this spec
- Build the org-side support ticket submission form (that's a separate spec)
- Build View As / impersonation (that's a separate spec that builds on Phase 5's org detail page)

---

## CC Prompt

```
Read CC-PLATFORM-ADMIN-MODE.md in the repo root — that is your full spec.
Also read LYNX-UX-PHILOSOPHY.md for progressive disclosure rules.
Also read src/components/layout/LynxSidebar.jsx to understand the current sidebar.
Also read src/pages/platform/PlatformAdminPage.jsx, PlatformAnalyticsPage.jsx, and PlatformSubscriptionsPage.jsx to understand existing platform code to refactor.
Execute phase by phase starting at Phase 0. Commit after each phase. Stop and report if blocked.
```
