# Email System Investigation Report
Generated: 2026-03-25
Codebase: volleybrain-admin (web)

---

## 1. Project Structure

### Top-Level src/ Layout
```
src/
├── App.jsx                    # Entry point, auth check, public route handling
├── MainApp.jsx                # Main layout, nav, page routing
├── main.jsx                   # Vite entry (BrowserRouter wraps entire app)
├── index.css                  # Global styles + Tailwind
├── contexts/                  # React Context providers (7 contexts)
├── lib/                       # Utility libraries (supabase client, email-service, etc.)
├── constants/                 # Theme + icon constants
├── hooks/                     # useAppNavigate.js, useTeamManagerData.js
├── components/                # Shared UI + layout + feature components
└── pages/                     # All page components (20+ subdirectories)
```

**Note:** `src/utils/` does NOT exist. `src/types/` does NOT exist (no TypeScript — all .jsx).

### Email-Relevant Files Already in the Codebase

| File | Role |
|------|------|
| `src/lib/email-service.js` | Core email queue library — inserts rows into `email_notifications` table |
| `src/pages/coaches/EmailCoachesModal.jsx` | Manual `mailto:` link for bulk-emailing coaches (does NOT use EmailService) |
| `src/pages/registrations/RegistrationsPage.jsx` | Only active caller of EmailService (approval/waitlist emails) |
| `src/pages/settings/OrganizationPage.jsx` | Email notification toggle persistence |
| `src/pages/settings/SetupSectionContent.jsx` | Email notification config UI (toggles + "Email Branding (Future)" placeholder) |
| `src/pages/blasts/BlastsPage.jsx` | In-app blast/announcement composer + list (no email integration) |
| `src/pages/notifications/NotificationsPage.jsx` | Push notification management (separate from email) |
| `src/components/layout/BlastAlertChecker.jsx` | Global popup for unacknowledged blasts |
| `supabase/functions/send-payment-reminder/index.ts` | Edge Function that sends emails via Resend REST API |

### Files Mentioning "email" (91 matches total)

Most are form fields displaying `email` on user records (profiles, players, coaches). The files above are the only ones with email-sending infrastructure.

### Files Mentioning "notification" (24 matches)

Primary: `NotificationsPage.jsx` (push notifications), `email-service.js`, `MainApp.jsx` (admin notification bell polling). The rest reference notification preferences or breadcrumb labels.

### Files Mentioning "announcement" (16 matches)

Primary: `BlastsPage.jsx`, `ParentMessagesPage.jsx`, `BlastAlertChecker.jsx`, `CoachDashboard.jsx`. The rest reference announcement as a post type or breadcrumb label.

---

## 2. Router & Navigation

### Router Pattern

The app uses **react-router-dom v6** with `BrowserRouter` wrapping the entire app in `main.jsx`. All page routes are defined in `MainApp.jsx` inside the `RoutedContent` function (lines 654–775) using `<Routes>` and `<Route>` elements.

**Key files:**
- `src/main.jsx` — `<BrowserRouter>` wrapper
- `src/App.jsx` — Top-level split: public routes vs. `<AuthenticatedApp>`
- `src/MainApp.jsx` — All page `<Route>` definitions (lines 654–775)
- `src/lib/routes.js` — `ROUTES` map (pageId → URL path), `PAGE_TITLES`, `getPathForPage()`, `getPageIdFromPath()`
- `src/hooks/useAppNavigate.js` — `useAppNavigate()` hook, `useCurrentPageId()` for active-state

**Auth guard:** `AuthenticatedApp` in `App.jsx` checks `user` state. If not logged in → `LoginPage`. If onboarding needed → `SetupWizard`. Otherwise → `<MainApp />`.

**Role guard:** `src/components/auth/RouteGuard.jsx` — accepts `allow` array of role strings (`'admin'`, `'coach'`, `'parent'`, `'player'`, `'team_manager'`) and current `activeView`. Redirects to `/dashboard` if role not allowed.

### Sidebar Structure

**File:** `src/components/layout/LynxSidebar.jsx`

Nav items are passed as a `navGroups` prop — an array of group/item objects defined in `MainApp.jsx` (lines 1004–1187). Five role-specific arrays exist: `adminNavGroups`, `coachNavGroups`, `parentNavGroups`, `playerNavGroups`, `teamManagerNavGroups`.

**Item structure:**
```js
// Single item
{ id: 'dashboard', label: 'Dashboard', type: 'single', icon: 'dashboard' }

// Group with children
{
  id: 'communication',
  label: 'Communication',
  type: 'group',
  icon: 'chats',
  items: [
    { id: 'chats',         label: 'Chats',              icon: 'message' },
    { id: 'blasts',        label: 'Announcements',       icon: 'megaphone' },
    { id: 'notifications', label: 'Push Notifications',  icon: 'bell' },
  ]
}
```

Groups are accordion-style (collapsible). Active state is determined by `useCurrentPageId()` matching `item.id`.

**Icon map:** `LynxSidebar.jsx` lines 21–38 — a plain object mapping string keys to Lucide components. To add a new icon (e.g., `'mail'`), add an entry to `ICON_MAP`.

### Where to Add Email Section

**Option A — Inside the existing Communication group (adminNavGroups, line 1042):**
```js
{ id: 'email', label: 'Email', icon: 'mail' }  // add to items array
```

**Option B — New top-level group:**
```js
{ id: 'email-section', label: 'Email', type: 'group', icon: 'mail', items: [
  { id: 'email',           label: 'Email Dashboard',  icon: 'mail' },
  { id: 'email-templates', label: 'Templates',         icon: 'file-text' },
  { id: 'email-settings',  label: 'Settings',          icon: 'settings' },
]}
```

### How to Add a New Route (Complete Steps)

1. **`src/lib/routes.js`** — Add `'email': '/email'` to `ROUTES` and `'/email': 'Email'` to `PAGE_TITLES`
2. **`src/MainApp.jsx` RoutedContent (~line 720)** — Add `<Route>` element with `RouteGuard`
3. **`src/MainApp.jsx` adminNavGroups (~line 1042)** — Add item to Communication group (or new group)
4. **`src/MainApp.jsx` CONTEXTUAL_NAV (~line 902)** — Add contextual quick-links
5. **`src/components/layout/LynxSidebar.jsx` ICON_MAP (~line 21)** — Add `'mail': Mail` if using a new icon
6. **Import the new page component** in `MainApp.jsx` near line 66

### Role Guards

Auth check: conditional rendering in `App.jsx` `AuthenticatedApp` component (not a Route wrapper).
Role check: `<RouteGuard allow={['admin']} activeView={activeView}>` wraps individual routes in `MainApp.jsx`.

---

## 3. Supabase Patterns

### Client Setup

**File:** `src/lib/supabase.js` (10 lines)

```js
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Single named export. Default Supabase JS v2 client, no wrappers. Every page imports: `import { supabase } from '../../lib/supabase'`

### Data Fetching Pattern

**No React Query, SWR, or data-fetching library.** The universal pattern is:

```js
// State
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)

// Trigger
useEffect(() => { loadData() }, [dependency1, dependency2])

// Fetcher
async function loadData() {
  setLoading(true)
  let query = supabase
    .from('table_name')
    .select('*, related:foreign_key(col1, col2)')
    .eq('organization_id', organization.id)

  // Conditional filters
  if (selectedSeason?.id) query = query.eq('season_id', selectedSeason.id)

  const { data, error } = await query
  if (error) console.error('Error:', error)  // Read errors: console only
  else setData(data || [])
  setLoading(false)
}
```

**Write pattern:**
```js
try {
  const { error } = await supabase.from('table').update({ ... }).eq('id', id)
  if (error) throw error
  showToast('Saved!', 'success')
  loadData()  // Re-fetch after mutation
} catch (err) {
  showToast(err.message, 'error')
}
```

### Edge Function Calls

Two patterns exist in the codebase:

**Pattern A — SDK method** (`PaymentSetupPage.jsx` line 132):
```js
const { data, error } = await supabase.functions.invoke('stripe-test-connection')
```

**Pattern B — Raw fetch** (`stripe-checkout.js` line 25):
```js
const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-create-checkout`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token || ANON_KEY}`,
  },
  body: JSON.stringify(payload),
})
```

Only 2 Edge Functions are called from the frontend: `stripe-test-connection` and `stripe-create-checkout`.

### File Upload Pattern

Two-step pattern used across 14 upload sites:

```js
// Step 1: Upload
const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })

// Step 2: Get public URL (synchronous)
const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
```

**Buckets:** `media` (primary — avatars, chat images, org logo), `waivers` (PDF uploads), `team-assets` (public team wall cover photos).

### Real-time

Only used in chat (`ChatThread.jsx`): Postgres CDC subscription for new messages + Presence channels for typing indicators. All other pages poll on demand.

---

## 4. Existing Email/Notification Infrastructure

### Tables Already Queried by the Web App

| Table | Used By | Purpose |
|-------|---------|---------|
| `email_notifications` | `email-service.js` (INSERT only) | Email queue — rows with `status: 'pending'` picked up by Edge Function |
| `messages` | `BlastsPage.jsx`, `CoachDashboard.jsx`, `ParentMessagesPage.jsx` | In-app blast/announcement records |
| `message_recipients` | `BlastsPage.jsx`, `ParentMessagesPage.jsx`, `BlastAlertChecker.jsx` | Per-recipient read/acknowledge tracking |
| `notifications` | `NotificationsPage.jsx` | Push notification log per user |
| `notification_templates` | `NotificationsPage.jsx` | Push notification templates with toggle on/off |
| `admin_notifications` | `MainApp.jsx` (bell icon polling) | Admin in-app notification inbox |
| `announcements` | `ParentDashboard.jsx` (read only) | Separate announcement table — no write UI in web |
| `email_logs` | **NOT REFERENCED ANYWHERE** | Zero occurrences in entire codebase |

### Existing Email Service (`src/lib/email-service.js`, 213 lines)

**EmailService object — 5 methods:**

| Method | Email type | Called from |
|--------|-----------|------------|
| `sendRegistrationConfirmation` | `registration_confirmation` | Not called (dead code) |
| `sendApprovalNotification` | `registration_approved` | `RegistrationsPage.jsx` |
| `sendWaitlistSpotAvailable` | `waitlist_spot_available` | Not called (dead code) |
| `sendPaymentReminder` | `payment_reminder` | Not called (dead code) |
| `sendTeamAssignment` | `team_assignment` | Not called (dead code) |

All methods call `queueEmail()` which inserts into `email_notifications`:
```js
async queueEmail(type, recipientEmail, recipientName, data, organizationId) {
  await supabase.from('email_notifications').insert({
    type, recipient_email: recipientEmail, recipient_name: recipientName,
    data, organization_id: organizationId, status: 'pending',
    created_at: new Date().toISOString()
  })
}
```

**`getEmailTemplate(type, data)`** returns hardcoded HTML templates with inline styles for 5 email types. Templates reference `data.organization_name`, `data.player_name`, `data.season_name`, etc. No handlebars/MJML/liquid — plain string interpolation.

**`isEmailEnabled(organization, type)`** checks `organization.settings.email_notifications_enabled` (master toggle) then per-type toggles (`email_on_registration`, `email_on_approval`, etc.).

### Email Settings in Organization Setup

**Stored in `organizations.settings` JSON blob:**
- `email_notifications_enabled` — master on/off
- `email_on_registration` — registration confirmation
- `email_on_approval` — approval notification
- `email_on_waitlist` — waitlist spot available
- `email_on_team_assignment` — team assignment
- `email_on_payment_due` — payment reminder
- `game_reminder_hours` — push notification timing
- `practice_reminder_hours`
- `payment_reminder_days`

**Stored in `organizations.settings.branding`:**
- `email_header_color` — exposed via `OrgBrandingContext` as `emailHeaderColor`
- `email_header_logo` — exposed via `OrgBrandingContext` as `emailHeaderLogo`

**Stored directly on `organizations` table:**
- `send_receipt_emails` — boolean (from PaymentSetupPage), NOT checked by `isEmailEnabled()`

### Fields That Do NOT Exist Yet

These were searched and found **zero occurrences**:
- `email_sender_name`
- `email_reply_to`
- `email_accent_color` (closest: `email_header_color` in branding)
- `email_footer`
- `email_include_unsubscribe`

### Existing UI

**NotificationsPage** — Push notification admin (3 tabs: Dashboard, History, Templates). Completely separate from email.

**BlastsPage** — In-app announcement composer + list. Does NOT trigger any email. Has a ComposeBlastModal with targeting (Everyone / Specific Team), message type, priority, and recipient preview.

**EmailCoachesModal** — Opens `mailto:` links in the browser's email client. No Supabase involvement.

**SetupSectionContent** — Has "Email Notifications" section with 6 toggles and a "Email Branding (Future)" placeholder section.

### Conflicts & Overlap

1. **`email_notifications` table is write-only from web** — no read/log UI exists. A new email system must add a log viewer.
2. **`email_header_color`/`email_header_logo`** are stored in branding context but never injected into `getEmailTemplate()` HTML — gap to close.
3. **`send_receipt_emails`** (on `organizations` table) is never checked by `isEmailEnabled()` — inconsistency.
4. **3 of 5 EmailService methods are dead code** — never called from any UI page.
5. **BlastsPage does NOT integrate with EmailService** — sending a blast does not trigger any email, despite having `recipient_email` on each `message_recipients` row.
6. **Two separate "announcement" systems** exist: `messages` table (BlastsPage) and `announcements` table (ParentDashboard read-only). These are independent.
7. **`target_type` vs `target_audience` naming inconsistency** — BlastsPage inserts `target_type`, ParentMessagesPage queries `target_audience`.

---

## 5. UI & Styling

### CSS Approach

**Tailwind CSS 3.4** with an extensively extended theme in `tailwind.config.js`.

**Brand tokens (the "Lynx" palette):**
| Token | Value | Purpose |
|-------|-------|---------|
| `lynx-navy` | `#10284C` | Primary dark background |
| `lynx-sky` | `#4BB9EC` | Primary accent (interactive) |
| `lynx-deep` | `#2A9BD4` | Accent hover |
| `lynx-midnight` | `#0A1628` | Dark mode page bg |
| `lynx-charcoal` | `#1A2744` | Dark mode card bg |
| `lynx-graphite` | `#232F3E` | Dark mode card alt bg |
| `lynx-cloud` | `#F6F8FB` | Light mode page bg |
| `lynx-frost` | `#F0F2F5` | Light mode alt bg |
| `lynx-silver` | `#E8ECF2` | Light mode borders |
| `lynx-border-dark` | `#2A3545` | Dark mode borders |
| `lynx-slate` | `#5A6B7F` | Muted text |

**CSS custom properties** (set by ThemeContext): `--accent-primary`, `--accent-light`, `--accent-dark`, `--navbar-bg`, `--bg-primary`, `--text-primary`, etc.

**Dark/light mode:** `useThemeClasses()` hook returns pre-built class map (`tc.cardBg`, `tc.text`, `tc.input`, `tc.border`, `tc.modal`, etc.). Every component uses `const tc = useThemeClasses()`.

### Reusable Components

| Component | File | Can Reuse For |
|-----------|------|---------------|
| `Toast` / `useToast` | `ui/Toast.jsx` | Feedback on email send/save |
| `Badge` | `ui/Badge.jsx` | Email status pills (sent, pending, failed, draft) |
| `MetricCard` | `ui/MetricCard.jsx` | Email stats (sent count, open rate, bounces) |
| `EmptyState` | `ui/EmptyState.jsx` | Empty inbox/sent states |
| `Skeleton` / `SkeletonTable` | `ui/Skeleton.jsx` | Loading placeholders for email log |
| `PageShell` | `pages/PageShell.jsx` | Standard page wrapper (breadcrumb, title, actions) |
| `SeasonFilterBar` | `pages/SeasonFilterBar.jsx` | Filter emails by season/sport |
| `ErrorBoundary` | `ui/ErrorBoundary.jsx` | Error wrapping |
| `CommandPalette` | `ui/CommandPalette.jsx` | Already integrated globally |

### Components That Must Be Built

- Email composer (HTML preview, template variables)
- Email log/history table
- Recipient audience picker
- Template editor/manager
- Email analytics dashboard
- Scheduled send UI (if needed)

### Page Structure Pattern

Every page follows:
```jsx
function SomePage({ showToast }) {
  const { organization } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [selectedSeason?.id])

  return (
    <PageShell title="Page Title" actions={<button>Action</button>}>
      <SeasonFilterBar />
      {loading ? <SkeletonTable /> : (
        <div className={`rounded-xl border ${tc.card}`}>
          {/* Content */}
        </div>
      )}
    </PageShell>
  )
}
```

### Modal Pattern (no reusable wrapper — inline each time)

```jsx
<div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
  <div className={`${tc.modal} border rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}
       onClick={e => e.stopPropagation()}>
    {/* Header: p-5 border-b, title + X button */}
    {/* Body: flex-1 overflow-y-auto p-5 space-y-5 */}
    {/* Footer: p-5 border-t, Cancel + Submit buttons */}
  </div>
</div>
```

### Input Pattern

```js
const ic = `w-full rounded-xl px-4 py-3 text-r-sm ${tc.input} border ${tc.border} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40`
```

### Button Styles

- **Primary:** `bg-lynx-navy text-white font-bold rounded-xl px-4 py-2.5`
- **Accent:** `bg-lynx-sky text-lynx-navy font-bold rounded-xl px-4 py-2.5`
- **Ghost:** `border ${tc.border} rounded-xl px-6 py-2`
- **Destructive:** `bg-red-500 text-white font-bold rounded-xl px-6 py-2`

### Status Color Pattern

```
bg-emerald-500/12 text-emerald-500   → Success / Approved / Delivered
bg-amber-500/12 text-amber-500       → Pending / Warning
bg-red-500/12 text-red-500           → Error / Failed / Denied
bg-[#4BB9EC]/15 text-[#4BB9EC]       → Info / Active
bg-slate-500/12 text-slate-400       → Neutral / Unknown
```

### Form Pattern

No form library (no react-hook-form, no formik). Universal pattern:
```js
const [form, setForm] = useState({ field1: '', field2: '' })
onChange={e => setForm({...form, fieldName: e.target.value})}
```

---

## 6. RLS Policies

**Cannot be checked from the web codebase alone.** Requires running SQL in Supabase SQL Editor:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('notification_templates', 'email_notifications', 'email_logs', 'organizations', 'announcements', 'messages', 'message_recipients')
ORDER BY tablename, policyname;
```

**What we know from code:**
- `email_notifications` — the web app only INSERTs (via `email-service.js`). RLS must allow INSERT for authenticated users scoped to their org.
- `notification_templates` — `NotificationsPage.jsx` reads and toggles `is_active`. RLS must allow SELECT + UPDATE for admin role.
- `messages` / `message_recipients` — BlastsPage does INSERT (compose) + SELECT (list). Read queries filter by `organization_id`. Write may rely on RLS to auto-fill `organization_id` (the INSERT omits it).
- `organizations` — OrganizationPage reads and updates settings. Must allow SELECT + UPDATE for org admins.

**Risk:** The blast INSERT in `BlastsPage.jsx` (line 393) does NOT include `organization_id` in the payload. If RLS doesn't auto-populate it, new blasts won't appear in the read query (which filters `.eq('organization_id', organization.id)`).

---

## 7. Dependencies

### Installed (runtime — only 6 total)

| Package | Version |
|---------|---------|
| `@supabase/supabase-js` | `^2.39.0` |
| `lucide-react` | `^0.294.0` |
| `react` | `^18.2.0` |
| `react-dom` | `^18.2.0` |
| `react-grid-layout` | `^2.2.2` |
| `react-router-dom` | `^6.21.0` |

### Installed (devDependencies)

| Package | Version |
|---------|---------|
| `@types/react` | `^18.2.45` |
| `@types/react-dom` | `^18.2.18` |
| `@vitejs/plugin-react` | `^4.2.1` |
| `autoprefixer` | `^10.4.16` |
| `postcss` | `^8.4.32` |
| `tailwindcss` | `^3.4.0` |
| `vite` | `^5.0.10` |

### Not Installed (may be needed)

| Category | Packages | Needed? |
|----------|----------|---------|
| Email SDK | resend, sendgrid, nodemailer | **No** — email sending is server-side (Edge Function uses Resend REST API directly via `fetch()`) |
| Email templates | mjml, react-email | **Optional** — current templates are hardcoded HTML strings |
| Rich text editor | tiptap, quill, slate, lexical | **Optional** — if HTML email composer is desired; current blasts use plain `<textarea>` |
| Color picker | react-color, @uiw/react-color | **No** — can reuse native `<input type="color">` (already used for team colors) or the custom `AccentColorPicker` swatch component |

---

## 8. Edge Functions

### Current State

**6 Edge Functions exist** in `supabase/functions/`:

| Function | Purpose | Triggered By |
|----------|---------|-------------|
| `send-payment-reminder/index.ts` | Batch email sender — fetches pending `email_notifications` rows, sends via Resend REST API | Cron / manual |
| `stripe-create-checkout/index.ts` | Creates Stripe Checkout Session | Frontend (`stripe-checkout.js`) |
| `stripe-create-payment-intent/index.ts` | Creates Stripe PaymentIntent | Not wired yet |
| `stripe-test-connection/index.ts` | Tests Stripe API key | Frontend (`PaymentSetupPage.jsx`) |
| `stripe-webhook/index.ts` | Handles Stripe webhook events | Stripe webhook |
| `push/index.ts` | Sends Expo push notifications | DB trigger on `notifications` INSERT |
| `notification-cron/index.ts` | Triggers game/RSVP/payment reminders | Cron |

### No `config.toml`

`supabase/config.toml` does NOT exist. The Supabase CLI is not formally initialized with a local project config.

### Environment Variables

**Frontend `.env`:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**`.env.example` also includes:**
- `VITE_STRIPE_PUBLISHABLE_KEY` (not in live `.env`)

**Edge Function secrets** (set server-side via `supabase secrets set`):
- `RESEND_API_KEY` — used by `send-payment-reminder`
- `FROM_EMAIL` — sender address for emails
- `STRIPE_SECRET_KEY` — used by Stripe functions
- `STRIPE_WEBHOOK_SECRET` — used by `stripe-webhook`
- `EXPO_ACCESS_TOKEN` — used by `push` function
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by runtime

### Email Sending Flow

The `send-payment-reminder` Edge Function is the only email sender:
1. Queries `email_notifications` where `status = 'pending'`
2. For each row, calls the Resend REST API (`fetch('https://api.resend.com/emails', ...)`)
3. Updates the row's `status` to `'sent'` or `'failed'`

This function name is misleading — despite being called "send-payment-reminder", it processes ALL pending email types from the queue, not just payment reminders.

---

## 9. Announcements System

### Current State

**Two parallel systems exist:**

#### System 1: Blast Messages (`messages` + `message_recipients` tables)

The primary system used by `BlastsPage.jsx` (admin compose + list), `CoachDashboard.jsx` (coach quick-send), `ParentMessagesPage.jsx` (parent read view), and `BlastAlertChecker.jsx` (global popup).

**Compose flow (BlastsPage ComposeBlastModal):**
1. Admin fills: Title, Body (textarea), Type (General/Payment/Schedule/Deadline), Priority (Normal/Urgent), Target (Everyone or Specific Team)
2. Live recipient count preview via `calculateRecipients()`
3. On send: INSERT into `messages`, then bulk INSERT `message_recipients` (one per parent, with `recipient_email` stored)
4. Uses `sanitizeText()` from `src/lib/validation.js`
5. Does **NOT** call EmailService — in-app only

**Targeting:**
| `target_type` | Audience | Available to |
|---------------|----------|-------------|
| `all` | Everyone in season | Admin only |
| `team` | One team's parents | Admin + Coach |

Coaches are locked to `team` target only.

**Detail view:** Shows blast body, sent timestamp, sender. Stats: Read/Unread/Rate. Filterable recipient list with acknowledged status.

**Consumer-side:** `BlastAlertChecker` (mounted globally in MainApp) queries `message_recipients` where `profile_id = user.id` AND `acknowledged = false`, shows a full-screen popup requiring "I've Read This" acknowledgment.

#### System 2: Announcements (`announcements` + `announcement_reads` tables)

Used only by `ParentDashboard.jsx` for alert banners (read-only query: `.eq('is_active', true)`). **No write UI exists** in the web admin for this table.

### Known Issues

1. **No `organization_id` in blast INSERT** — `messages` insert omits it but the read query filters by it. Works only if RLS auto-fills the column.
2. **No `profile_id` in `message_recipients` INSERT** — BlastAlertChecker reads by `profile_id`, but compose inserts `recipient_id` (player UUID, not profile UUID). Alert popup may not find new blasts.
3. **`coaches` target type is unreachable from UI** — exists in `calculateRecipients()` but no button to select it.
4. **No email delivery from blast send** — despite `recipient_email` being stored per recipient.
5. **No scheduling / send-later capability.**
6. **No rich text / attachments** — plain textarea only.

### Integration Plan

**Recommended approach: Extend `ComposeBlastModal` with an "Also send as email" toggle.**

The compose modal already has targeting, recipient lookup, and the send flow. Adding email is a natural extension:

1. Add `send_email: false` toggle to compose form
2. After `message_recipients` bulk insert, if `send_email` is true, also bulk-insert into `email_notifications` with `type: 'blast_announcement'`
3. Add a `blast_announcement` template to `getEmailTemplate()` in `email-service.js`
4. The existing `send-payment-reminder` Edge Function will pick up and send these emails automatically

This avoids building a separate Email Broadcast page and keeps the blast + email as one unified action.

---

## 10. Risk Register

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | `email_notifications` table has no read UI — can't see delivery status, failed emails, or retry | High | Build an Email Log page as part of the email system |
| 2 | Blast INSERT missing `organization_id` — new blasts may not appear in list query | High | Add `organization_id: organization.id` to the insert in BlastsPage.jsx |
| 3 | `profile_id` not set on `message_recipients` INSERT — BlastAlertChecker won't find new blasts | High | Add profile_id lookup during compose, or change BlastAlertChecker to query by `recipient_email` |
| 4 | `send_receipt_emails` (organizations table) not checked by `isEmailEnabled()` | Medium | Update `isEmailEnabled()` to also check this direct column |
| 5 | `email_header_color`/`email_header_logo` branding stored but not injected into email templates | Medium | Update `getEmailTemplate()` to accept and use branding data |
| 6 | 3 of 5 EmailService methods are dead code (never called) | Medium | Wire them up or remove them during email system build |
| 7 | `target_type` vs `target_audience` naming inconsistency between BlastsPage and ParentMessagesPage | Medium | Audit and standardize column names |
| 8 | No `config.toml` for Supabase CLI — Edge Function deployment may be manual | Low | Create config.toml if deploying functions from this repo |
| 9 | No rich text editor installed — email composer limited to plain text without adding a package | Low | Evaluate tiptap or similar if HTML emails are needed |
| 10 | `email_logs` table referenced nowhere — may not exist or may be an empty table | Low | Verify in Supabase dashboard; may need to create it |

---

## 11. Files That Will Be Modified

| File | Changes Needed | Lines |
|------|---------------|-------|
| `src/lib/routes.js` | Add email route(s) to `ROUTES` and `PAGE_TITLES` | ~5 lines |
| `src/MainApp.jsx` | Add `<Route>` element(s), add nav group items, import new page(s) | ~15 lines |
| `src/components/layout/LynxSidebar.jsx` | Add `'mail'` to `ICON_MAP` (if using new icon) | ~1 line |
| `src/lib/email-service.js` | Add `blast_announcement` template, inject branding, possibly refactor `queueEmail` | ~50 lines |
| `src/pages/settings/SetupSectionContent.jsx` | Add email sender name, reply-to, footer fields to the Notifications section | ~30 lines |
| `src/pages/settings/OrganizationPage.jsx` | Persist new email settings fields | ~10 lines |
| `src/pages/blasts/BlastsPage.jsx` | Add "Also send as email" toggle to ComposeBlastModal + email queue logic | ~40 lines |

---

## 12. Files That Will Be Created

| File | Purpose |
|------|---------|
| `src/pages/email/EmailPage.jsx` | Email dashboard — log/history, stats, compose access |
| `src/pages/email/EmailLogTable.jsx` | Email log table component (sent, pending, failed, delivered) |
| `src/pages/email/EmailComposer.jsx` | Standalone email compose modal (for non-blast emails) |
| `src/pages/email/EmailTemplateEditor.jsx` | Template management UI (optional — depends on scope) |
| `src/pages/email/index.js` | Re-export barrel file |

---

## 13. Open Questions

1. **Scope of "email system":** Is this primarily adding email delivery to existing blasts? Or a full standalone email campaign/broadcast tool with its own composer, templates, scheduling, and analytics?

2. **Rich text / HTML editor:** Should the email composer support rich text (bold, links, images)? Current blasts are plain text only. Adding a rich text editor requires a new dependency (tiptap, Quill, etc.).

3. **Email templates:** Should admins be able to create/edit custom email templates via the UI? Or are the hardcoded templates in `email-service.js` sufficient for now?

4. **Email analytics:** Does Carlos need open rate, click rate, bounce tracking? This requires a webhook from Resend and additional database tables.

5. **Sender identity:** What should the "From" name and email be? Currently the Edge Function uses `FROM_EMAIL` env var. Should each org be able to customize sender name/reply-to?

6. **Unsubscribe handling:** Does the email system need an unsubscribe mechanism? Required by CAN-SPAM for marketing emails. Transactional emails (registration confirmation, payment receipt) are exempt.

7. **`email_logs` table:** Does this table actually exist in Supabase, or does the codebase only reference `email_notifications`? Need to verify in the Supabase dashboard.

8. **Blast `organization_id` bug:** Is this a known issue, or is RLS auto-populating this column? Needs verification before building on top of BlastsPage.

9. **`announcements` vs `messages` — which is canonical?** Two parallel systems exist. Should the email system integrate with `messages` (BlastsPage) or `announcements` (ParentDashboard), or both?

10. **Mobile app impact:** If email delivery is added to blasts, will mobile users (who compose blasts from the React Native app) also get email delivery? Or is this web-admin-only?
