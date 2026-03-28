# CC-ONBOARDING-AND-SIDEBAR-FIXES.md
# Fix: New Admin Onboarding Flow + Sidebar Polish + Setup Wizard Bug

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/styles/v2-tokens.css`
4. `src/pages/auth/SetupWizard.jsx`
5. `src/pages/dashboard/DashboardPage.jsx`
6. `src/components/layout/LynxSidebar.jsx`
7. `src/MainApp.jsx`

## SCOPE
Fix the new admin onboarding experience end-to-end. A brand new admin who just created an account should land on the Dashboard (not Staff Portal), see empty state CTAs that guide them through setup, and have a visible setup checklist. Also fix the sidebar (lock open, categorize, fix width) and the Setup Wizard Unicode rendering bug.

---

## ELEMENT PRESERVATION CONTRACT

All existing dashboard widgets, sidebar navigation items, routes, and setup wizard steps must survive. We are ADDING empty state CTAs and onboarding guidance. We are NOT removing any existing dashboard functionality. The dashboard must still work perfectly for admins with fully configured orgs.

---

## PHASE 1: Fix Setup Wizard Unicode Bug

**File:** `src/pages/auth/SetupWizard.jsx`
**Edit contract:** Fix the Unicode rendering issue. Minimal change.

### Problem:
The text `\u23f1\ufe0f ~2 min total` is rendering as literal escaped text instead of the ⏱️ emoji. This is likely a string that's been escaped when it shouldn't be.

### Fix:
Search the file for `\u23f1` or `~2 min total` or any time estimate text near the "Skip setup for now" button. Replace the escaped Unicode with the actual emoji character or a Lucide icon:

```jsx
// FIND the line with the broken Unicode
// REPLACE with:
<span className="text-sm text-slate-400">⏱️ ~2 min total</span>
// OR if the emoji doesn't render well:
<span className="text-sm text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~2 min total</span>
```

### Commit:
```bash
git add src/pages/auth/SetupWizard.jsx
git commit -m "Phase 1: Fix Unicode escape rendering in Setup Wizard time estimate"
```

---

## PHASE 2: Fix Post-Signup Routing — New Admins Land on Dashboard

**File:** `src/MainApp.jsx` (or wherever post-signup routing is handled)
**Edit contract:** Change where new admins are routed after completing the Setup Wizard. Do not change routing for existing users.

### Problem:
After completing the 4-step Setup Wizard, a new admin lands on the Staff Portal page which shows "Please select a season to manage staff" — a dead end. They should land on the Dashboard.

### Fix:
Find where the Setup Wizard completion triggers navigation. After the wizard completes (step 4 done, user clicks "Let's Go" or equivalent):

```javascript
// After wizard completion, navigate to dashboard:
onNavigate?.('dashboard')
// NOT onNavigate?.('coaches') or whatever is currently set
```

Also check: is there a default route redirect that might be sending new users to `/coaches` or `/staff`? Search for any logic that determines the initial route after login/signup:

```bash
grep -n "defaultRoute\|initialRoute\|firstRoute\|navigate.*after.*login\|navigate.*after.*signup\|wizard.*complete\|onComplete.*navigate" src/MainApp.jsx src/pages/auth/SetupWizard.jsx
```

Ensure the default landing page for admin role is always `dashboard`.

### Commit:
```bash
git add src/MainApp.jsx src/pages/auth/SetupWizard.jsx
git commit -m "Phase 2: Route new admins to Dashboard after Setup Wizard completion"
```

---

## PHASE 3: Dashboard Empty State CTAs — Guide New Admins Through Setup

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Edit contract:** Add empty state CTAs to dashboard sections when data is missing. Do not change any existing dashboard rendering for orgs that HAVE data. These CTAs only appear when the relevant data is empty/zero.

### Concept:
When a section has no data, instead of showing "0" or empty space, show a helpful CTA card that guides the admin to create what's missing.

### Changes:

**A. Active Seasons carousel — empty state:**
When `seasons.length === 0`:
```jsx
<div className={`rounded-[14px] border-2 border-dashed border-[#4BB9EC]/30 p-8 text-center ${isDark ? 'bg-[#132240]/50' : 'bg-[#4BB9EC]/[0.03]'}`}>
  <div className="text-3xl mb-3">📅</div>
  <h3 className="font-extrabold text-lg mb-1">Create Your First Season</h3>
  <p className="text-sm text-slate-400 mb-4">Define your season dates, fees, and registration windows</p>
  <button onClick={() => onNavigate?.('seasons')} 
    className="px-6 py-2.5 bg-[#10284C] text-white font-bold rounded-xl hover:brightness-110 transition">
    + Create Season
  </button>
</div>
```

**B. Financial Snapshot — empty state:**
When no payments exist or payment setup incomplete:
```jsx
<div className="...dashed border card...">
  <div className="text-3xl mb-3">💳</div>
  <h3 className="font-extrabold text-lg mb-1">Set Up Payments</h3>
  <p className="text-sm text-slate-400 mb-4">Configure Stripe or manual payment methods</p>
  <button onClick={() => onNavigate?.('payment-setup')} className="...navy button...">
    Configure Payments
  </button>
</div>
```

**C. Teams & Health tab — empty state:**
When `teams.length === 0`:
```jsx
<div className="...dashed border card...">
  <div className="text-3xl mb-3">👥</div>
  <h3 className="font-extrabold text-lg mb-1">Add Your First Team</h3>
  <p className="text-sm text-slate-400 mb-4">Create teams and start building your rosters</p>
  <button onClick={() => onNavigate?.('teams')} className="...navy button...">
    + Create Team
  </button>
</div>
```

**D. Registrations tab — empty state:**
When no registrations exist:
```jsx
<div className="...dashed border card...">
  <div className="text-3xl mb-3">📋</div>
  <h3 className="font-extrabold text-lg mb-1">Open Registration</h3>
  <p className="text-sm text-slate-400 mb-4">Create a season first, then open registration for families</p>
  <button onClick={() => onNavigate?.('registration-templates')} className="...navy button...">
    Set Up Registration
  </button>
</div>
```

**E. Hero card greeting — new admin context:**
When the org has no seasons, no teams, and no players, adjust the greeting:
```javascript
const isNewOrg = (seasons?.length || 0) === 0 && (teams?.length || 0) === 0
const greeting = isNewOrg 
  ? `Welcome to Lynx, ${firstName}. Let's get your club set up.`
  : existingGreetingLogic
```

**F. Season Journey stepper — show org setup progress:**
The existing Season Journey stepper should reflect setup completion. The steps should be:
1. Org Profile (check: organization has name + contact info)
2. Season (check: at least 1 season exists)
3. Teams (check: at least 1 team exists)
4. Coaches (check: at least 1 coach assigned)
5. Registration Open (check: at least 1 active registration window)
6. Schedule (check: at least 1 event created)

Each incomplete step should be clickable → navigates to the relevant page.
Each complete step shows a green checkmark.

If this stepper already exists, verify it works for brand new orgs. If it only appears after a season is selected, make it also appear in the "no seasons" state showing step 1 (Org Profile) as the starting point.

### Important:
These empty state CTAs must ONLY render when the data is actually empty. They must NOT render alongside real data. Use conditional rendering:
```jsx
{seasons.length === 0 ? <EmptySeasonCTA /> : <SeasonCarousel seasons={seasons} />}
```

### Commit:
```bash
git add src/pages/dashboard/DashboardPage.jsx
git commit -m "Phase 3: Dashboard empty state CTAs for new admin onboarding"
```

---

## PHASE 4: Sidebar Fixes — Lock Open, Categorize, Fix Width, Logo

**File:** `src/components/layout/LynxSidebar.jsx`
**Edit contract:** Fix the sidebar behavior and styling. Do not change which nav items exist or their route targets.

### Changes:

**A. Lock sidebar open — remove collapse/expand behavior:**
Find the toggle/collapse logic. Remove or disable it. The sidebar should always render in its expanded state showing icon + label for every nav item. Remove any hover-to-expand, click-to-toggle, or responsive-collapse behavior on desktop.

On mobile (below 768px), the sidebar can still be a drawer/overlay if that pattern exists. But on desktop, it's always open.

**B. Increase sidebar width by ~10-15px:**
Current width is likely 60px (collapsed icon-only). Since we're locking it open with labels, it needs to be ~200-220px wide. Find the width constant:
```javascript
// FIND: something like width: 60, or w-[60px], or --v2-sidebar-width: 60px
// REPLACE with: width: 210px (or similar)
```

Also update `--v2-sidebar-width` in `v2-tokens.css` if it's defined there:
```css
--v2-sidebar-width: 210px;
```

And update any layout that uses this variable (MainApp content area margin-left, V2DashboardLayout, etc.).

**C. Categorize nav items with section headers:**
Group the nav items with small uppercase section labels:

```
OVERVIEW
  Dashboard

CLUB MANAGEMENT  
  Team Management
  Staff Portal
  Registrations
  Payment Admin
  Jersey Management

SCHEDULE & OPS
  Schedule
  Attendance & RSVP
  Coach Availability

GAME DAY
  Game Prep

ENGAGEMENT
  Standings
  Leaderboards

COMMUNICATION
  Chats
  Announcements
  Push Notifications

REPORTS
  Reports & Analytics
  Registration Funnel
  Season Archives
  Org Directory

SETTINGS
  Season Management
  Registration Forms
  Waivers
  Settings
```

Section headers styled as:
```jsx
<div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 px-4 pt-5 pb-1">
  {categoryName}
</div>
```

**D. Remove the navy/dark scrollbar styling** that's causing visual issues. Use a clean, thin, subtle scrollbar:
```css
.lynx-sidebar::-webkit-scrollbar { width: 4px; }
.lynx-sidebar::-webkit-scrollbar-track { background: transparent; }
.lynx-sidebar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
```

**E. Lynx logo at the top:**
Replace the "L" circle with the real Lynx logo. Check if `/lynx-logo.png` or `/images/lynx-logo.png` exists in the public assets:
```bash
ls public/lynx-logo* public/images/lynx-logo* public/images/mascots/* 2>/dev/null
```

If a logo file exists, use it:
```jsx
<img src="/lynx-logo.png" alt="Lynx" className="h-7" />
```

If not, use a text treatment: "**Lynx**" in Inter bold with the app's navy color. Not a circle with "L".

**F. Active nav item styling:**
Keep the current active state (highlighted background + brand color text) but make sure it works with the wider sidebar. The active indicator should be a left border accent (3px sky-blue bar on the left edge of the active item).

### Commit:
```bash
git add src/components/layout/LynxSidebar.jsx src/styles/v2-tokens.css
git commit -m "Phase 4: Sidebar locked open, categorized, wider, clean scrollbar, logo"
```

---

## PHASE 5: Update Layout Dependencies for Wider Sidebar

**File:** `src/MainApp.jsx` + any layout files that reference sidebar width
**Edit contract:** Update content area margin/padding to account for the wider sidebar. Minimal changes.

### Changes:
Search for references to the old sidebar width:
```bash
grep -rn "60px\|sidebar.*width\|ml-\[60\|pl-\[60\|margin-left.*60\|padding-left.*60\|v2-sidebar-width" src/ --include="*.jsx" --include="*.css" | grep -v _archive | grep -v node_modules
```

Update each reference from 60px to the new width (210px or whatever Phase 4 set it to).

Also check:
- `V2DashboardLayout.jsx` — does it account for sidebar width?
- `TopBar.jsx` — does it have left padding for the sidebar?
- Any page that uses `md:ml-64` or similar Tailwind margin

### Verification:
- [ ] Build passes
- [ ] Content area is not overlapped by the wider sidebar
- [ ] Dashboard renders correctly with sidebar visible
- [ ] All pages render correctly (spot check 3-4 pages)
- [ ] TopBar aligns with content area
- [ ] No horizontal scrollbar appears

### Commit:
```bash
git add src/MainApp.jsx src/components/v2/V2DashboardLayout.jsx src/components/v2/TopBar.jsx
git commit -m "Phase 5: Update layout margins for wider sidebar"
```

---

## FINAL PUSH

After ALL 5 phases pass:
```bash
git push origin main
```

## VERIFICATION CHECKLIST
- [ ] Setup Wizard: emoji/timer text renders correctly on step 1
- [ ] Setup Wizard completion → lands on Dashboard (not Staff Portal)
- [ ] Dashboard for new org: shows empty state CTAs (Create Season, Set Up Payments, Add Team, etc.)
- [ ] Dashboard for new org: greeting says "Let's get your club set up"
- [ ] Dashboard for new org: Season Journey stepper shows setup progress
- [ ] Dashboard for existing org: all existing widgets render normally (no empty state CTAs showing alongside real data)
- [ ] Empty state CTA buttons navigate to correct pages
- [ ] Sidebar: always open on desktop, never collapses
- [ ] Sidebar: nav items categorized with section headers
- [ ] Sidebar: no navy scrollbar, clean thin scrollbar instead
- [ ] Sidebar: labels not clipped, all text visible
- [ ] Sidebar: Lynx logo (real asset or clean text treatment)
- [ ] Sidebar: active item has left border accent
- [ ] Sidebar: width increased, content area adjusted
- [ ] All pages: content not overlapped by sidebar
- [ ] Dark mode: works on all new elements

## FINAL REPORT
```
## Onboarding & Sidebar Fix Report
- Phases completed: X/5
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
- Setup Wizard bug fixed: YES/NO
- Post-signup routing fixed: YES/NO
- Empty state CTAs working: YES/NO
- Sidebar locked open: YES/NO
- Sidebar categorized: YES/NO
- Layout adjusted: YES/NO
```
