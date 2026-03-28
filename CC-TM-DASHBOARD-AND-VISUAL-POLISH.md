# CC-TM-DASHBOARD-AND-VISUAL-POLISH.md
# Team Manager Dashboard Upgrade + Inner Pages Visual Polish

## READ FIRST
1. `CC-SPEC-GUARDRAILS.md`
2. `CLAUDE.md`
3. `LYNX-UX-PHILOSOPHY.md`
4. `src/components/v2/index.js` (shared V2 components)
5. `src/components/v2/coach/` (reference for how Coach V2 tabs are built)

## SCOPE
**Wave 1:** Upgrade TeamManagerDashboard to match Coach/Admin/Parent quality by creating proper V2 tab components.
**Wave 2:** Visual polish pass on the 35 PageShell inner pages for consistent Lynx branding.

This spec covers Wave 1 only. Wave 2 will be a separate spec after Wave 1 is verified.

---

# WAVE 1: TEAM MANAGER DASHBOARD UPGRADE

## WHAT EXISTS NOW
TeamManagerDashboard.jsx (472 lines) already uses V2 shared components: TopBar, HeroCard, AttentionStrip, BodyTabs, V2DashboardLayout, FinancialSnapshot, WeeklyLoad, ThePlaybook, MilestoneCard, MascotNudge.

**What's missing:** Every other role has dedicated V2 tab components in `components/v2/{role}/`. Team Manager has NO `components/v2/team-manager/` directory. Its 4 body tabs (Roster, Payments, Schedule, Attendance) are rendered inline with raw `style={{}}` objects instead of proper extracted components.

## DESIGN TARGET
The Coach dashboard is the reference. Look at how `CoachRosterTab`, `CoachScheduleTab`, `CoachStatsTab`, `CoachGamePrepTab`, and `CoachEngagementTab` are structured. Each is a standalone component in `components/v2/coach/` that:
- Receives data as props (no internal Supabase queries)
- Uses the V2 CSS variable system (`var(--v2-font)`, `var(--v2-text-primary)`, etc.)
- Renders clean, card-based UI with consistent spacing
- Has loading and empty states
- Has action buttons that call `onNavigate`

Team Manager tabs should follow the EXACT same pattern.

## PHASE 1: Create `components/v2/team-manager/` Directory + Tab Components

### Edit contract:
**Allowed:** Create new files in `src/components/v2/team-manager/`. Extract inline JSX from TeamManagerDashboard.jsx into these new files. Import and use them in TeamManagerDashboard.jsx.
**Not allowed:** Change data loading logic. Change props passed to V2 shared components. Change the hook (useTeamManagerData). Add new Supabase queries. Change routing or navigation targets.

### Files to create:

**1. `src/components/v2/team-manager/TMRosterTab.jsx`**
Extract from TeamManagerDashboard's `RosterStatusCard` component (lines ~380-450). Convert inline `style={{}}` to Tailwind classes using the Lynx design tokens. Reference `CoachRosterTab.jsx` for the visual pattern.

Should show:
- Roster fill bar (players/capacity)
- Open/Full status badge
- Pending count badge
- "View Full Roster" CTA button
- Player list preview (if data available)

**2. `src/components/v2/team-manager/TMPaymentsTab.jsx`**
Extract from TeamManagerDashboard's `PaymentHealthCard` component (lines ~325-375). Convert inline styles to Tailwind.

Should show:
- 3-stat grid (Overdue / Pending / Collected)
- Overdue amount highlighted in red
- "Send Reminders" CTA when overdue > 0
- Collection progress bar

**3. `src/components/v2/team-manager/TMScheduleTab.jsx`**
Extract from TeamManagerDashboard's schedule tab (lines ~220-260). Convert inline styles to Tailwind.

Should show:
- Event list with date column + event details
- Event type badge (game/practice/meeting)
- Time and location
- Empty state when no events

**4. `src/components/v2/team-manager/TMAttendanceTab.jsx`**
Extract from TeamManagerDashboard's `RsvpSummaryCard` component (lines ~290-325). Convert inline styles to Tailwind.

Should show:
- Next event info with type badge
- RSVP stacked bar (confirmed/maybe/declined/no response)
- Legend row with counts
- "Take Attendance" CTA

### Pattern to follow (from CoachRosterTab):
```jsx
// Each tab component follows this pattern:
export default function TMRosterTab({ data, rosterCount, loading, onNavigate }) {
  const { isDark } = useTheme()
  
  if (loading) return <TabLoading />
  if (!data) return <TabEmpty message="No roster data available" />
  
  return (
    <div className="p-5 space-y-4">
      {/* Content using Tailwind + Lynx tokens */}
    </div>
  )
}
```

### Verification:
```bash
ls src/components/v2/team-manager/
# Should show: TMRosterTab.jsx, TMPaymentsTab.jsx, TMScheduleTab.jsx, TMAttendanceTab.jsx
npm run build
```

### Commit:
```bash
git add src/components/v2/team-manager/
git commit -m "Phase 1: create V2 team manager tab components"
```

---

## PHASE 2: Wire New Tab Components into TeamManagerDashboard

### Edit contract:
**Allowed:** Import the 4 new tab components. Replace the inline tab content with the new components. Remove the now-unused inline card functions (RosterStatusCard, PaymentHealthCard, RsvpSummaryCard) from the bottom of the file.
**Not allowed:** Change data loading. Change props to shared V2 components. Change the layout structure. Change navigation targets.

### Changes in `src/pages/roles/TeamManagerDashboard.jsx`:

**Add imports:**
```javascript
import TMRosterTab from '../../components/v2/team-manager/TMRosterTab'
import TMPaymentsTab from '../../components/v2/team-manager/TMPaymentsTab'
import TMScheduleTab from '../../components/v2/team-manager/TMScheduleTab'
import TMAttendanceTab from '../../components/v2/team-manager/TMAttendanceTab'
```

**Replace the BodyTabs children** (around lines 210-260):
```jsx
<BodyTabs tabs={tmTabs} activeTab={activeTab} onTabChange={setActiveTab}>
  {activeTab === 'roster' && (
    <TMRosterTab data={registrationStatus} rosterCount={rosterCount} loading={loading} onNavigate={onNavigate} />
  )}
  {activeTab === 'payments' && (
    <TMPaymentsTab data={paymentHealth} loading={loading} onNavigate={onNavigate} />
  )}
  {activeTab === 'schedule' && (
    <TMScheduleTab events={upcomingEvents} loading={loading} onNavigate={onNavigate} />
  )}
  {activeTab === 'attendance' && (
    <TMAttendanceTab data={nextEventRsvp} loading={loading} onNavigate={onNavigate} />
  )}
</BodyTabs>
```

**Delete the inline card functions** at the bottom of the file (PaymentHealthCard, RsvpSummaryCard, RosterStatusCard). These are now in the V2 components.

**Also:** Convert the Getting Started checklist from inline `style={{}}` to Tailwind classes. This is the section around lines 150-205. Use the same card styling pattern as the V2 components (rounded-2xl, proper padding, Lynx colors).

### Verification:
```bash
npm run build
git diff --stat  # should show TeamManagerDashboard.jsx modified + new V2 files
```

Log in as Team Manager. Verify:
- [ ] Dashboard loads without errors
- [ ] Roster tab shows player count and fill bar
- [ ] Payments tab shows overdue/pending/collected
- [ ] Schedule tab shows upcoming events
- [ ] Attendance tab shows RSVP summary
- [ ] Getting Started checklist renders cleanly
- [ ] Sidebar (Financial Snapshot, Weekly Load, Playbook) still works
- [ ] All navigation buttons still work

### Commit:
```bash
git add src/pages/roles/TeamManagerDashboard.jsx src/components/v2/team-manager/
git commit -m "Phase 2: wire V2 tab components into TeamManagerDashboard, remove inline styles"
```

---

## PHASE 3: Polish the TM Hero, Attention Strip, and Sidebar

### Edit contract:
**Allowed:** Adjust props passed to HeroCard, AttentionStrip, FinancialSnapshot, and MascotNudge in TeamManagerDashboard.jsx. Improve the data shown (better stat labels, more context).
**Not allowed:** Change the V2 shared components themselves. Change data loading.

### Changes:

**HeroCard:** Currently shows generic stats (Roster, Capacity, Overdue, RSVPs). Make them more actionable:
```javascript
const heroStats = [
  { label: 'Players', value: rosterCount, color: rosterCount > 0 ? 'sky' : 'muted' },
  { label: 'Capacity', value: registrationStatus?.capacity || '—' },
  { label: 'Events', value: upcomingEvents.length },
  { label: 'Collection', value: paymentHealth?.totalPayments > 0 ? `${Math.round((paymentHealth.collectedAmount / (paymentHealth.collectedAmount + paymentHealth.overdueAmount + paymentHealth.pendingAmount)) * 100)}%` : '—' },
]
```

**AttentionStrip:** Add more attention items (unsigned waivers, upcoming events with low RSVPs, roster spots remaining):
```javascript
const attentionItems = [
  ...(paymentHealth?.overdueCount > 0 ? [{
    icon: '💰', label: `${paymentHealth.overdueCount} overdue payment${paymentHealth.overdueCount !== 1 ? 's' : ''}`,
    type: 'coral', onClick: () => onNavigate?.('payments'),
  }] : []),
  ...(registrationStatus?.pendingCount > 0 ? [{
    icon: '📋', label: `${registrationStatus.pendingCount} pending registration${registrationStatus.pendingCount !== 1 ? 's' : ''}`,
    type: 'amber', onClick: () => onNavigate?.('registrations'),
  }] : []),
  ...(!hasEvents ? [{
    icon: '📅', label: 'No events scheduled yet',
    type: 'sky', onClick: () => onNavigate?.('schedule'),
  }] : []),
]
```

**MascotNudge:** Make messages more specific and actionable.

### Verification:
```bash
npm run build
```
Visual check: hero stats look good, attention strip shows relevant items, mascot message is contextual.

### Commit:
```bash
git add src/pages/roles/TeamManagerDashboard.jsx
git commit -m "Phase 3: polish TM hero stats, attention items, and sidebar content"
```

---

## PHASE 4: Fix BodyTabs Prop Mismatch (from audit)

### Edit contract:
**Allowed:** Fix the `key` vs `id` and `activeTab` vs `activeTabId` prop naming in TM dashboard tabs.
**Not allowed:** Change anything else.

The audit (Finding 5.4) identified that BodyTabs expects `id` property on tabs and `activeTabId` prop, but TM dashboard uses `key` and `activeTab`.

Check what BodyTabs actually expects:
```bash
head -30 src/components/v2/BodyTabs.jsx
```

Fix the tab definitions and prop passing to match.

### Commit:
```bash
git add src/pages/roles/TeamManagerDashboard.jsx
git commit -m "Phase 4: fix BodyTabs prop mismatch in TM dashboard"
```

---

## FINAL PUSH

After all 4 phases pass:
```bash
git push origin main
```

## FINAL REPORT
```
## TM Dashboard Upgrade Report
- Phases completed: X/4
- New files created: [list]
- Files modified: [list]
- Total lines: +X / -Y
- Build status: PASS/FAIL
- TM dashboard renders correctly: YES/NO
- All 4 body tabs functional: YES/NO
- Sidebar widgets working: YES/NO
- BodyTabs prop mismatch fixed: YES/NO
```
