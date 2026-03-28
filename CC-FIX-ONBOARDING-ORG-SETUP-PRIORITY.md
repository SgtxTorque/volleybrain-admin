# CC-FIX-ONBOARDING-ORG-SETUP-PRIORITY.md
# Fix: Org Setup Must Come First in New Admin Onboarding + Schedule CTA

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `src/pages/dashboard/DashboardPage.jsx`
4. `src/pages/settings/OrganizationPage.jsx` (to understand what "org setup complete" means)

## SCOPE
The onboarding flow from CC-ONBOARDING-AND-SIDEBAR-FIXES.md shows empty state CTAs for Season, Payments, Teams, etc. But it skips the most important first step: **completing the Organization Setup**. An admin can't properly create a season without first setting up their org's payment methods, contact info, sports, fees, and legal info. Those foundation settings feed into season creation, registration forms, and payment processing.

This spec fixes the priority order and adds the Schedule CTA that was missed.

**This does NOT undo anything from the previous spec.** It adjusts the priority and adds the org setup step.

---

## ELEMENT PRESERVATION CONTRACT

All empty state CTAs from the previous spec must survive. We are changing their PRIORITY ORDER and adding conditional gating so that Org Setup is the first thing a new admin is guided to complete. We are also adding the Schedule CTA to the Weekly Load card and Schedules body tab.

---

## PHASE 1: Org Setup Completion Detection

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Edit contract:** Add logic to detect whether the org setup foundation is complete. Do not modify the Organization page itself.

### Add org setup completion check:

The Organization page has foundation sections (identity, contact, sports, online, legal) and operational sections (payments, fees, etc.). We need to check if the minimum foundation is done.

```javascript
// Determine if org has completed minimum setup
// Check: org has name, has at least 1 sport configured, has contact info
const orgSetupComplete = Boolean(
  organization?.name &&
  organization?.contact_email &&
  organization?.sports?.length > 0
)

// More granular: check if payment methods are configured
const paymentSetupComplete = Boolean(
  organization?.stripe_enabled ||
  organization?.payment_venmo ||
  organization?.payment_zelle ||
  organization?.payment_cashapp
)

// Overall foundation ready (minimum needed before creating seasons)
const foundationReady = orgSetupComplete && paymentSetupComplete
```

If `organization` data doesn't have these fields readily available, check what's already loaded in the dashboard data. The dashboard likely already fetches the organization object. Use whatever fields are available to determine if the admin has gone through org setup.

### Commit:
```bash
git add src/pages/dashboard/DashboardPage.jsx
git commit -m "Phase 1: Add org setup completion detection for onboarding priority"
```

---

## PHASE 2: Reorder Empty State CTAs — Org Setup First

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Edit contract:** Adjust the empty state CTA priority. Org Setup is the FIRST thing shown. Other CTAs are gated behind org setup completion.

### New priority order for empty state CTAs:

**When org setup is NOT complete (`!foundationReady`):**

The dashboard should prominently show ONE primary CTA above everything else:

```jsx
{!foundationReady && (
  <div className={`rounded-2xl border-2 border-dashed border-[#4BB9EC]/40 p-8 mb-6 text-center ${isDark ? 'bg-[#4BB9EC]/[0.04]' : 'bg-[#4BB9EC]/[0.03]'}`}>
    <div className="text-4xl mb-3">🏢</div>
    <h3 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
      Complete Your Organization Setup
    </h3>
    <p className={`text-sm mb-4 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
      Set up your club's identity, contact info, sports, payment methods, and fees. This information feeds into seasons, registration, and payments.
    </p>
    <button onClick={() => onNavigate?.('organization')} 
      className="px-8 py-3 bg-[#10284C] text-white font-bold rounded-xl hover:brightness-110 transition text-sm">
      Start Organization Setup →
    </button>
    <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
      Takes about 5-10 minutes to complete the essentials
    </p>
  </div>
)}
```

**The other empty state CTAs (Season, Teams, Payments, Registration) should still show, but they should be BELOW the org setup CTA and visually secondary:**

```jsx
{/* Show Season CTA only when org setup is done but no seasons exist */}
{foundationReady && seasons.length === 0 && (
  <SeasonEmptyStateCTA />
)}

{/* If org setup is NOT done, still show the other CTAs but in a muted/smaller style 
    so the admin knows what's coming, but Org Setup is clearly the priority */}
{!foundationReady && (
  <div className="grid grid-cols-3 gap-4 mt-4 opacity-60">
    <div className="rounded-[14px] border border-dashed border-slate-200 p-4 text-center">
      <div className="text-xl mb-1">📅</div>
      <p className="text-xs font-bold text-slate-400">Create Season</p>
      <p className="text-[10px] text-slate-300">After org setup</p>
    </div>
    <div className="rounded-[14px] border border-dashed border-slate-200 p-4 text-center">
      <div className="text-xl mb-1">👥</div>
      <p className="text-xs font-bold text-slate-400">Add Teams</p>
      <p className="text-[10px] text-slate-300">After creating a season</p>
    </div>
    <div className="rounded-[14px] border border-dashed border-slate-200 p-4 text-center">
      <div className="text-xl mb-1">📋</div>
      <p className="text-xs font-bold text-slate-400">Open Registration</p>
      <p className="text-[10px] text-slate-300">After adding teams</p>
    </div>
  </div>
)}
```

### Journey Stepper update:

The Journey Stepper steps should be:
1. **Org Profile** → navigates to `/organization` — green checkmark when `orgSetupComplete`
2. **Payment Setup** → navigates to `/payment-setup` — green when `paymentSetupComplete`
3. **Create Season** → navigates to `/seasons` — green when `seasons.length > 0`
4. **Add Teams** → navigates to `/teams` — green when `teams.length > 0`
5. **Add Coaches** → navigates to `/coaches` — green when coaches exist
6. **Create Schedule** → navigates to `/schedule` — green when events exist
7. **Open Registration** → navigates to `/registration-templates` — green when reg template exists

Step 1 should be highlighted/pulsing if org setup isn't done. Steps 3+ should be grayed out (not clickable) until their prerequisites are met.

### Hero greeting context:

```javascript
const greeting = !foundationReady
  ? `Welcome to Lynx, ${firstName}! Let's set up your club.`
  : seasons.length === 0
    ? `Great start, ${firstName}. Now let's create your first season.`
    : existingGreetingLogic
```

### Commit:
```bash
git add src/pages/dashboard/DashboardPage.jsx
git commit -m "Phase 2: Org Setup as first priority CTA, other CTAs gated behind foundation"
```

---

## PHASE 3: Add Schedule Empty State CTAs

**File:** `src/pages/dashboard/DashboardPage.jsx`
**Edit contract:** Add Schedule CTA to the Weekly Load sidebar card and the Schedules body tab. Do not change any existing schedule data loading.

### A. Weekly Load sidebar card — empty state:
Find the `WeeklyLoad` component render in the sidebar. When there are no events:

```jsx
{/* In the sidebar where WeeklyLoad renders */}
{events.length === 0 ? (
  <div className={`rounded-[14px] p-5 text-center ${isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Weekly Load</div>
    <div className="text-2xl mb-2">📅</div>
    <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>No Events This Week</p>
    <p className="text-xs text-slate-400 mb-3">Create practices and games for your teams</p>
    <button onClick={() => onNavigate?.('schedule')} 
      className="w-full py-2 bg-[#10284C] text-white font-bold rounded-lg text-xs hover:brightness-110 transition">
      + Create Event
    </button>
  </div>
) : (
  <WeeklyLoad ... />
)}
```

### B. Schedules body tab — empty state:
Find the Schedules tab content in BodyTabs. When there are no upcoming events:

```jsx
{activeTab === 'schedules' && (
  upcomingEvents.length === 0 ? (
    <div className="p-8 text-center">
      <div className="text-3xl mb-3">📅</div>
      <h3 className="font-extrabold text-lg mb-1">No Upcoming Events</h3>
      <p className="text-sm text-slate-400 mb-4">Add practices, games, and events to your schedule</p>
      <button onClick={() => onNavigate?.('schedule')} 
        className="px-6 py-2.5 bg-[#10284C] text-white font-bold rounded-xl hover:brightness-110 transition">
        Go to Schedule →
      </button>
    </div>
  ) : (
    <ExistingScheduleTabContent />
  )
)}
```

### Commit:
```bash
git add src/pages/dashboard/DashboardPage.jsx
git commit -m "Phase 3: Schedule empty state CTAs in Weekly Load card and Schedules body tab"
```

---

## FINAL PUSH

After ALL 3 phases pass:
```bash
git push origin main
```

## VERIFICATION CHECKLIST
- [ ] Build passes
- [ ] New admin (no org setup done): sees "Complete Your Organization Setup" as the PRIMARY CTA
- [ ] New admin: other CTAs (Season, Teams, Registration) shown below as grayed-out previews with "After org setup" labels
- [ ] New admin: Journey Stepper starts at step 1 (Org Profile) highlighted
- [ ] New admin: hero greeting says "Let's set up your club"
- [ ] Admin with org setup done but no season: "Complete Org Setup" CTA disappears, "Create Your First Season" becomes primary
- [ ] Admin with org + season but no teams: "Add Your First Team" is primary
- [ ] Admin with full data: NO empty state CTAs visible, normal dashboard renders
- [ ] Journey Stepper: each completed step shows green checkmark
- [ ] Journey Stepper: incomplete steps are clickable and navigate to correct page
- [ ] Journey Stepper: steps beyond prerequisites are grayed out (can't click "Add Coaches" before "Add Teams")
- [ ] Weekly Load card: shows "No Events This Week" + Create Event button when empty
- [ ] Schedules body tab: shows "No Upcoming Events" + Go to Schedule button when empty
- [ ] All CTAs navigate to the correct pages
- [ ] Existing orgs with full data: dashboard unchanged, no regression
- [ ] Dark mode works on all new elements

## FINAL REPORT
```
## Onboarding Priority Fix Report
- Phases completed: X/3
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
- Org Setup as first CTA: YES/NO
- Gated progression: YES/NO
- Schedule CTAs added: YES/NO
- Journey Stepper priority correct: YES/NO
- No regression on existing dashboards: YES/NO
```
