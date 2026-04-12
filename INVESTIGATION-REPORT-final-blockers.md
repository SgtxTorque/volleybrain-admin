# INVESTIGATION: Final Lifecycle Blockers
**Date:** 2026-04-12
**Branch:** main
**Classification:** READ-ONLY investigation

---

## Blocker 1: Registration Form Scroll — Waivers + Submit Button Unreachable
**Severity: CRITICAL**

### Root Cause: Insufficient bottom padding on form container

**PublicRegistrationPage.jsx (line ~952):**
The form body container uses `className="px-4 py-6 max-w-2xl mx-auto"` with NO bottom padding buffer. The form structure is:

```
<div className="min-h-screen bg-[#F5F6F8]">         ← ROOT (no overflow constraint)
  <div className="bg-lynx-navy">...</div>            ← Header
  <div className="px-4 py-6 max-w-2xl mx-auto">     ← FORM BODY (line ~952)
    <FeePreviewCard />
    <form onSubmit={handleSubmit}>
      <ChildrenListCard />
      <PlayerInfoCard />
      <AddChildButton />
      <SharedInfoCard />
      <CustomQuestionsCard />
      <WaiversCard />                                ← NEAR BOTTOM
      <button type="submit">...</button>             ← AT BOTTOM
    </form>
    <p className="pb-4">Powered by Lynx</p>          ← Only 16px bottom pad
  </div>
</div>
```

- No `overflow: hidden` or `max-height` constraining scroll — the page scrolls naturally
- The real issue: on long forms (multiple children, custom questions, multiple waivers), the accumulated height pushes waivers + submit below the viewport with only `pb-4` (16px) footer padding
- No scroll-into-view behavior when waiver section appears

**RegistrationCartPage.jsx (line ~733):**
Step 4 (FamilyInfoStep) has `pb-32` (128px) bottom padding BUT also has a fixed bottom bar (`fixed bottom-0`) that overlaps content. The fixed bar is ~60px tall, leaving only ~68px actual buffer — insufficient when multiple waivers + signature field are rendered.

### Fix
1. **PublicRegistrationPage.jsx:** Change form body container to `px-4 py-6 pb-40 max-w-2xl mx-auto` (add `pb-40` = 160px bottom padding)
2. **RegistrationCartPage.jsx:** Change content container from `pb-32` to `pb-48` (192px) to clear the fixed bottom bar with margin
3. Optional: Add `scrollIntoView({ behavior: 'smooth', block: 'center' })` on signature input focus

### Files
- `src/pages/public/PublicRegistrationPage.jsx` (line ~952)
- `src/pages/public/RegistrationCartPage.jsx` (line ~733)

---

## Blocker 2: Admin Communication Sidebar Dead Clicks
**Severity: CRITICAL**

### Root Cause: Communication group locked behind `orgSetup` prerequisite gate

**LynxSidebar.jsx (lines 29-38):** The sidebar has an `ADMIN_NAV_PREREQS` map:
```javascript
const ADMIN_NAV_PREREQS = {
  'communication': { needs: 'orgSetup', tooltip: 'Finish club setup to unlock messaging' },
  // ... other groups
}
```

**LynxSidebar.jsx (lines 481-494):** The lock check:
```javascript
const hasOrgSetup = Boolean(organization?.settings?.setup_complete)
const unlockState = { orgSetup: hasOrgSetup, season: hasSeason }

const getGroupLock = (groupId) => {
  if (activeView !== 'admin') return null
  const req = ADMIN_NAV_PREREQS[groupId]
  if (!req) return null
  return unlockState[req.needs] ? null : { tooltip: req.tooltip }
}
```

When `organization.settings.setup_complete` is falsy, the entire Communication group (Chats, Announcements, Push Notifications, Email) becomes non-clickable. NavItem swallows clicks when locked (line ~218-220):
```javascript
const handleClick = () => {
  if (isLocked) return  // swallowed
  onNavigate?.(item.id, item)
}
```

**Why coach sidebar works:** Coach nav has NO prerequisite gates — `ADMIN_NAV_PREREQS` only applies when `activeView === 'admin'`.

**All routes and paths exist and are correct:**
- Admin navGroups definition: MainApp.jsx lines 1265-1270 (Chats, Announcements, Push Notifications, Email)
- Routes: MainApp.jsx lines 775-777 (`/blasts`, `/notifications`, `/email`)
- Path mapping: src/lib/routes.js (all correctly mapped)

### Fix
Option A (recommended): Remove the `orgSetup` gate from Communication group — messaging should always be available:
```javascript
// Remove this line from ADMIN_NAV_PREREQS:
'communication': { needs: 'orgSetup', tooltip: 'Finish club setup to unlock messaging' },
```

Option B: Ensure `organization.settings.setup_complete` is set to `true` for active orgs (DB update).

Option C: Keep the gate but make it check for a more specific condition (e.g., only lock Email if no SMTP configured).

### Files
- `src/components/layout/LynxSidebar.jsx` (lines 29-38, prerequisite map)
- `src/MainApp.jsx` (lines 1265-1270, admin navGroups — no changes needed)

---

## Blocker 3: Payment Rounding Bug ($235.01 instead of $235.00)
**Severity: HIGH**

### Root Cause: No remainder handling in installment division

**fee-calculator.js (line ~175):**
```javascript
fees.push({
  ...baseFee,
  fee_type: 'monthly',
  amount: monthlyWithDiscount / monthsInSeason,  // ← Raw division, no rounding
  due_date: dueDate.toISOString().split('T')[0],
})
```

- `$50 / 3 = 16.666666...` stored as floating-point in DB
- UI renders with `.toFixed(2)` → `$16.67`
- Three payments × $16.67 = **$50.01** (one cent off)
- No remainder-aware logic: last installment is NOT adjusted to absorb rounding difference

**Secondary issue — TOTAL shows "—":**
`PlayerDossierPanel.jsx` (line ~166) reads `reg?.registration_fee` from the registrations table, but modern fee system stores charges in the `payments` table (multiple rows). `registration_fee` column is never populated → falls back to "—".

### Fix
**Primary — remainder-aware installment calculation (fee-calculator.js):**
```javascript
for (let i = 0; i < monthsInSeason; i++) {
  let installmentAmount
  if (i === monthsInSeason - 1) {
    // Last installment absorbs remainder
    const previousTotal = Math.round((monthlyWithDiscount / monthsInSeason) * 100) / 100 * i
    installmentAmount = Math.round((monthlyWithDiscount - previousTotal) * 100) / 100
  } else {
    installmentAmount = Math.round((monthlyWithDiscount / monthsInSeason) * 100) / 100
  }
  // use installmentAmount
}
```

Result: Installments 1-2 = $16.67, Installment 3 = $16.66, Total = $50.00

**Secondary — TOTAL display (PlayerDossierPanel.jsx):**
Sum from `payments` table instead of reading `registrations.registration_fee`, or populate `registration_fee` when fees are generated.

### Files
- `src/lib/fee-calculator.js` (line ~175, installment calculation)
- `src/pages/registrations/PlayerDossierPanel.jsx` (line ~166, TOTAL display)

---

## Blocker 4: Stale UI After Registration Approval
**Severity: HIGH**

### Root Cause: No optimistic state update — relies on async refetch with visible delay

The app uses manual `useState` + `useEffect` for data fetching (NOT React Query). After mutations, it calls `loadRegistrations()` which is async:

**RegistrationsPage.jsx (lines ~123-187):**
```javascript
async function updateStatus(playerId, regId, newStatus) {
  // ... API call succeeds ...
  showToast('Approved!', 'success')   // ← Shows immediately
  loadRegistrations()                  // ← Async refetch (100-300ms delay)
  // UI shows stale "Pending" badge until refetch completes
}
```

**Data flow:**
1. User clicks Approve
2. Supabase update succeeds
3. Toast shows immediately
4. `loadRegistrations()` fires async → queries Supabase → `setRegistrations(data)`
5. During the 100-300ms gap, UI still renders old status from stale state
6. User sees: toast says success, badge says "Pending" → confusion

**Badge renders from stale data (RegistrationsTable.jsx lines ~181-247):**
```javascript
const reg = player.registrations?.[0]
const statusDisplay = isPending ? 'Pending' : reg?.status === 'approved' ? 'Approved' : ...
```

### Pattern: This affects ALL mutation flows across the app

| File | Functions | Line |
|------|-----------|------|
| `RegistrationsPage.jsx` | `updateStatus()`, `approvePlayers()`, `bulkDeny()`, `bulkMoveToWaitlist()` | 183, 268, 302, 327 |
| `TeamsPage.jsx` | `addPlayerToTeam()`, team mutations | ~325 |
| `PaymentsPage.jsx` | `handleMarkPaid()`, `handleMarkUnpaid()`, `handleAddPayment()`, `handleMarkFamilyAllPaid()` | 280, 289, 312, 393 |

### Fix: Add optimistic local state update BEFORE the async refetch

```javascript
async function updateStatus(playerId, regId, newStatus) {
  // OPTIMISTIC: Update UI immediately
  setRegistrations(prev => prev.map(p =>
    p.id === playerId
      ? { ...p, registrations: [{ ...p.registrations[0], status: newStatus, updated_at: new Date().toISOString() }] }
      : p
  ))

  try {
    await supabase.from('registrations').update({ status: newStatus, ... }).eq('id', regId)
    showToast('Approved!', 'success')
    loadRegistrations()  // Background sync
  } catch (err) {
    loadRegistrations()  // Revert on failure
    showToast('Error: ' + err.message, 'error')
  }
}
```

Apply this pattern to all mutation handlers in Registrations, Teams, and Payments pages.

### Files affected
- `src/pages/registrations/RegistrationsPage.jsx` (4 mutation functions)
- `src/pages/registrations/RegistrationsTable.jsx` (status badge render)
- `src/pages/registrations/PlayerDossierPanel.jsx` (detail panel status)
- `src/pages/teams/TeamsPage.jsx` (team assignment mutations)
- `src/pages/payments/PaymentsPage.jsx` (4+ payment mutations)

---

## Blocker 5: Pre-filled Emergency Contact Data Leak
**Severity: MED**

### Root Cause: localStorage draft key scoped only by seasonId, not by user/family

**PublicRegistrationPage.jsx (line ~62):**
```javascript
const DRAFT_KEY = `lynx-registration-draft-${seasonId || 'unknown'}`
```

**What gets persisted (lines ~67-76):**
```javascript
const draft = {
  children,
  currentChild,
  sharedInfo,        // ← emergency_name, emergency_phone, emergency_relation
  customAnswers,     //   parent names, phones, emails, medical data
  savedAt: new Date().toISOString()
}
localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
```

**Recovery (lines ~79-97):**
```javascript
useEffect(() => {
  const raw = localStorage.getItem(DRAFT_KEY)
  if (raw) {
    const draft = JSON.parse(raw)
    if (daysSince < 7) {
      setSavedDraft(draft)
      setShowDraftRestore(true)  // Shows "Restore" or "Start Fresh" prompt
    }
  }
}, [])
```

**The vulnerability chain:**
1. Parent A registers for Season X, enters emergency contact "Marco Torres"
2. Data auto-saves to `lynx-registration-draft-{seasonId}`
3. Parent A closes browser without submitting
4. Parent B opens same registration URL on same device (shared computer, kiosk, tablet)
5. Same `DRAFT_KEY` matches → Parent B sees Marco Torres' data

**Key scoping problem:**
- Scoped by seasonId: YES
- Scoped by parent email: NO
- Scoped by user/session: NO
- Cleared on submit: YES (line ~827)
- Auto-expires after 7 days: YES
- **But persists across different families on the same device: YES — that's the bug**

**RegistrationCartPage.jsx:** Safe — does NOT persist drafts to localStorage.

### Fix
Scope the draft key by parent email or use sessionStorage:

**Option A (recommended) — scope by parent email:**
```javascript
// After parent enters email (before saving draft), include email in key:
const parentEmail = sharedInfo.parent1_email?.trim().toLowerCase() || ''
const DRAFT_KEY = `lynx-registration-draft-${seasonId || 'unknown'}-${parentEmail}`
```
Challenge: parent email isn't known until they type it, so initial save uses unscoped key.

**Option B — use sessionStorage instead of localStorage:**
```javascript
sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
```
Auto-clears when browser tab/window closes. Eliminates cross-session leaks entirely.

**Option C — generate a session-scoped UUID:**
```javascript
const sessionId = sessionStorage.getItem('lynx-reg-session') || crypto.randomUUID()
sessionStorage.setItem('lynx-reg-session', sessionId)
const DRAFT_KEY = `lynx-registration-draft-${seasonId}-${sessionId}`
```

### Files
- `src/pages/public/PublicRegistrationPage.jsx` (line ~62, DRAFT_KEY definition)

---

## Summary Table

| # | Blocker | Severity | Root Cause | Fix Complexity | Files |
|---|---------|----------|------------|----------------|-------|
| 1 | Registration scroll — waivers unreachable | CRITICAL | Insufficient bottom padding (`pb-4` only) on form container; fixed bottom bar overlap on cart page | Low — CSS-only | `PublicRegistrationPage.jsx`, `RegistrationCartPage.jsx` |
| 2 | Admin comms sidebar dead clicks | CRITICAL | Communication group locked behind `orgSetup` prerequisite gate in `ADMIN_NAV_PREREQS` | Low — remove one line from prereqs map | `LynxSidebar.jsx` |
| 3 | Payment rounding ($50.01) | HIGH | Raw division with no remainder handling; last installment not adjusted | Medium — rework installment loop in fee-calculator | `fee-calculator.js`, `PlayerDossierPanel.jsx` |
| 4 | Stale UI after mutations | HIGH | No optimistic state update; async refetch has 100-300ms visible delay | Medium — add optimistic updates to all mutation handlers | `RegistrationsPage.jsx`, `TeamsPage.jsx`, `PaymentsPage.jsx` |
| 5 | Emergency contact data leak | MED | localStorage draft key scoped only by seasonId, shared across users on same device | Low — switch to sessionStorage or scope key by email | `PublicRegistrationPage.jsx` |
