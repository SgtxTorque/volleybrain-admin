# CC-PAYMENTS-SPLIT-LAYOUT-REDESIGN.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

The Payments page has a left list (flex-1) and right detail panel (w-[380px]). The list takes too much width, and the detail panel is cramped. This spec:

1. **Phase 1:** Resize the split — list gets a fixed max-width, detail panel expands to fill remaining space.
2. **Phase 2:** Enhance the detail panel with sibling tabs (like dashboard tab bodies), action buttons for each payment (mark paid/unpaid), and keep the timeline and family overview stats.

**Files touched:**
- `src/pages/payments/PaymentsPage.jsx` (Phase 1)
- `src/pages/payments/FamilyDetailPanel.jsx` (Phase 2)

---

## PHASE 1 — Resize Split Layout

### File: `src/pages/payments/PaymentsPage.jsx`

**Change 1: Adjust the flex layout widths.**

Find (around line 551):

```jsx
        <div className="flex gap-6">
          {/* Left: Payment list */}
          <div className="flex-1 min-w-0">
```

Replace with:

```jsx
        <div className="flex gap-5">
          {/* Left: Payment list */}
          <div className={`min-w-0 ${selectedFamily && viewMode === 'family' ? 'w-[420px] shrink-0' : 'flex-1'}`}>
```

**What changed:** When a family is selected and the detail panel is open, the list shrinks to a fixed 420px. When no family is selected, the list takes full width as before. This gives the detail panel much more room.

**Change 2: Widen the detail panel.**

Find (around line 635):

```jsx
            <div className="w-[380px] shrink-0 hidden xl:block">
```

Replace with:

```jsx
            <div className="flex-1 min-w-[400px] hidden xl:block">
```

**What changed:** Detail panel now takes all remaining space (`flex-1`) instead of a fixed 380px. `min-w-[400px]` ensures it doesn't get too small.

**Change 3: Update the mobile overlay width.**

Find (around line 679):

```jsx
            <div className={`fixed right-0 top-0 h-screen w-[400px] z-50 shadow-2xl overflow-y-auto ${isDark ? 'bg-lynx-midnight' : 'bg-white'}`}>
```

Replace with:

```jsx
            <div className={`fixed right-0 top-0 h-screen w-[500px] max-w-[90vw] z-50 shadow-2xl overflow-y-auto ${isDark ? 'bg-lynx-midnight' : 'bg-white'}`}>
```

### Verification

- With a family selected: list is 420px, detail panel fills remaining space
- Without a family selected: list is full width
- Detail panel mobile overlay is wider (500px, capped at 90vw)
- No layout breaks at different screen widths

### Commit message
```
refactor(payments): resize split layout — narrow list when detail open, wider detail panel
```

---

## PHASE 2 — Enhance Detail Panel with Sibling Tabs and Inline Actions

### File: `src/pages/payments/FamilyDetailPanel.jsx`

**Replace the entire file contents with:**

```jsx
// =============================================================================
// FamilyDetailPanel — Enhanced split desk detail panel with sibling tabs
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X, Bell, Plus, Check, Clock, DollarSign, AlertTriangle, ChevronDown } from 'lucide-react'

// ---------- Payment timeline dot ----------
function TimelineDot({ status }) {
  if (status === 'paid') return <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shrink-0" />
  if (status === 'overdue') return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
  if (status === 'pending') return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
  return <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
}

export default function FamilyDetailPanel({
  family,
  onClose,
  onMarkPaid,
  onMarkUnpaid,
  onSendReminder,
  onAddFee,
}) {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  if (!family) return null

  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalPaid = family.payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const total = totalOwed + totalPaid
  const collectionPercent = total > 0 ? Math.round((totalPaid / total) * 100) : 0
  const unpaidPayments = family.payments.filter(p => !p.paid)
  const pendingManual = family.payments.filter(p => !p.paid && p.payment_method === 'manual')

  // Group payments by player
  const playerPayments = {}
  family.payments.forEach(p => {
    const name = p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown'
    if (!playerPayments[name]) playerPayments[name] = { player: p.players, payments: [] }
    playerPayments[name].payments.push(p)
  })
  const playerNames = Object.keys(playerPayments)
  const hasSiblings = playerNames.length > 1

  // Build timeline from all payments
  const timeline = [...family.payments]
    .sort((a, b) => {
      const dateA = a.paid_date || a.due_date || a.created_at || ''
      const dateB = b.paid_date || b.due_date || b.created_at || ''
      return new Date(dateB) - new Date(dateA)
    })
    .slice(0, 10)

  // Determine tabs: Overview + one per sibling (or just Overview if single child)
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(hasSiblings ? playerNames.map(name => ({ id: name, label: name.split(' ')[0] })) : []),
  ]

  const divider = isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'
  const cardBg = isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-[#E8ECF2]'

  // Get payments for a specific player tab
  const getTabPayments = (tabId) => {
    if (tabId === 'overview') return family.payments
    return playerPayments[tabId]?.payments || []
  }

  const currentPayments = getTabPayments(activeTab)
  const currentUnpaid = currentPayments.filter(p => !p.paid)
  const currentPaid = currentPayments.filter(p => p.paid)

  return (
    <div className={`rounded-2xl flex flex-col sticky top-4 max-h-[calc(100vh-120px)] overflow-hidden ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${divider} shrink-0`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            Account Detail
          </span>
          <button onClick={onClose}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition ${
              isDark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Family avatar + name */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black ${
            totalOwed > 0 ? 'bg-red-500/10 text-red-500' : 'bg-[#22C55E]/10 text-[#22C55E]'
          }`}>
            {(family.parentName || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{family.parentName} Family</h2>
            <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{family.email} · {playerNames.length} player{playerNames.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Balance overview */}
        <div className="mt-3 flex gap-4">
          <div>
            <div className={`text-lg font-black tabular-nums ${isDark ? 'text-white' : 'text-[#10284C]'}`}>${total.toFixed(0)}</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Billed</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums text-[#22C55E]">${totalPaid.toFixed(0)}</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Paid</div>
          </div>
          <div>
            <div className={`text-lg font-black tabular-nums ${totalOwed > 0 ? 'text-red-500' : 'text-[#22C55E]'}`}>${totalOwed.toFixed(0)}</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Owed</div>
          </div>
          <div className="flex-1">
            <div className={`text-lg font-black tabular-nums ${collectionPercent === 100 ? 'text-[#22C55E]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{collectionPercent}%</div>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Collected</div>
          </div>
        </div>

        {/* Collection progress bar */}
        <div className="mt-2">
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${collectionPercent === 100 ? 'bg-[#22C55E]' : collectionPercent > 50 ? 'bg-[#4BB9EC]' : 'bg-red-500'}`}
              style={{ width: `${collectionPercent}%` }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          <button onClick={() => onSendReminder(family)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
            <Bell className="w-3 h-3" /> Reminder
          </button>
          <button onClick={onAddFee}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            <Plus className="w-3 h-3" /> Add Fee
          </button>
          {unpaidPayments.length > 0 && (
            <button onClick={() => onMarkPaid(unpaidPayments[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10284C] text-white hover:brightness-110 transition">
              <DollarSign className="w-3 h-3" /> Mark Paid
            </button>
          )}
        </div>
      </div>

      {/* Sibling Tabs (only show if multiple players) */}
      {tabs.length > 1 && (
        <div className={`px-5 pt-3 pb-0 border-b ${divider} shrink-0`}>
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? `${isDark ? 'bg-white/[0.06] text-white' : 'bg-white text-[#10284C]'} border-b-2 border-[#4BB9EC]`
                    : `${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`
                }`}
                style={{ fontFamily: 'var(--v2-font)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Pending Manual Approvals (overview tab only) */}
        {activeTab === 'overview' && pendingManual.length > 0 && (
          <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-700'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>Pending Approval</span>
            </div>
            {pendingManual.map(p => (
              <div key={p.id} className="flex items-center justify-between mt-1.5">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.players?.first_name} — {p.fee_name || p.fee_type}</p>
                  <p className={`text-[10px] ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
                    ${parseFloat(p.amount || 0).toFixed(2)} · {p.reference_number || 'No ref'}
                  </p>
                </div>
                <button onClick={() => onMarkPaid(p)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#22C55E] text-white hover:brightness-110">
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Line Items — shows per-tab */}
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            {activeTab === 'overview' ? `All Fees (${currentPayments.length})` : `${activeTab} Fees (${currentPayments.length})`}
          </h3>

          {currentPayments.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'} py-4 text-center`}>No fees assigned</p>
          ) : (
            <div className={`rounded-xl overflow-hidden border ${divider}`}>
              <div className={`divide-y ${divider}`}>
                {currentPayments.map(p => {
                  const isOverdue = !p.paid && p.due_date && new Date(p.due_date) < new Date()
                  return (
                    <div key={p.id} className={`px-3 py-2.5 flex items-center gap-3 ${
                      p.paid ? (isDark ? 'bg-emerald-500/5' : 'bg-emerald-50/50') : ''
                    }`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${p.paid ? 'bg-[#22C55E]' : isOverdue ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activeTab === 'overview' && p.players ? `${p.players.first_name} — ` : ''}{p.fee_name || p.fee_type}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {p.due_date && `Due ${new Date(p.due_date).toLocaleDateString()}`}
                          {p.paid && p.paid_date && ` · Paid ${new Date(p.paid_date).toLocaleDateString()}`}
                          {p.paid && p.payment_method && ` via ${p.payment_method}`}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                        ${parseFloat(p.amount || 0).toFixed(2)}
                      </span>
                      {p.paid ? (
                        <button onClick={() => onMarkUnpaid(p.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                            isDark ? 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                          Undo
                        </button>
                      ) : (
                        <button onClick={() => onMarkPaid(p)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#22C55E] text-white hover:brightness-110 shrink-0 transition">
                          Pay
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Payment Timeline (overview tab only) */}
        {activeTab === 'overview' && timeline.length > 0 && (
          <div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
              style={{ fontFamily: 'var(--v2-font)' }}>
              Payment Timeline
            </h3>
            <div className={`${cardBg} rounded-xl p-3`}>
              {timeline.map((p, i) => {
                const dateStr = p.paid_date || p.due_date || p.created_at
                const date = dateStr ? new Date(dateStr).toLocaleDateString() : '—'
                const status = p.paid ? 'paid' : (p.due_date && new Date(p.due_date) < new Date() ? 'overdue' : 'pending')
                return (
                  <div key={p.id} className="flex items-start gap-3 py-1.5">
                    <div className="flex flex-col items-center">
                      <TimelineDot status={status} />
                      {i < timeline.length - 1 && (
                        <div className={`w-px h-full min-h-[12px] ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {p.players?.first_name} — {p.fee_name || p.fee_type}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {p.paid ? `Paid ${date}` : `Due ${date}`}
                        {p.payment_method && p.paid && ` via ${p.payment_method}`}
                      </p>
                    </div>
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${p.paid ? 'text-[#22C55E]' : 'text-red-500'}`}>
                      ${parseFloat(p.amount || 0).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Key changes from the original:
- **Sibling tabs:** When multiple players exist, tabs appear below the header (Overview + one per sibling first name). Single-child families just see Overview with no tab bar.
- **Tab content:** Overview shows all fees with player name prefix. Sibling tabs show only that player's fees.
- **Inline Pay/Undo buttons:** Each fee line has a "Pay" or "Undo" button right in the row, no need to expand.
- **Action buttons moved to header:** Send Reminder, Add Fee, Mark Paid are in the header area, always visible without scrolling.
- **Balance stats:** Changed from 3-col grid to horizontal flex for better use of wider panel.
- **Timeline:** Only shows on Overview tab, slightly more compact.
- **No bottom action bar:** Actions are in the header now, so the sticky footer is removed.

### Verification

- Single-child family: No tab bar shown. Overview content with all fees displayed.
- Multi-child family: Tab bar with "Overview" + first name of each sibling. Clicking tab filters fee list.
- Each fee row has inline Pay/Undo button.
- Action buttons (Reminder, Add Fee, Mark Paid) visible in header.
- Timeline only shows on Overview tab.
- Panel is wider due to Phase 1 layout change.

### Commit message
```
feat(payments): enhance detail panel with sibling tabs, inline pay buttons, header actions
```

---

## POST-EXECUTION QA CHECKLIST

1. **No family selected:** Payment list takes full width
2. **Family selected:** List shrinks to 420px, detail panel fills remaining space
3. **Single-child family:** Detail panel shows header + fees + timeline. No tab bar.
4. **Multi-child family:** Tab bar with Overview + sibling first names. Tabs filter the fee list.
5. **Fee line items:** Each row has a status dot, name, due date, amount, and Pay/Undo button
6. **Header actions:** Send Reminder, Add Fee, Mark Paid buttons always visible
7. **Balance stats:** Billed, Paid, Owed, Collection % in a horizontal row
8. **Timeline:** Shows on Overview tab with colored dots and dates
9. **Pending manual approvals:** Amber card with Approve button, only on Overview tab
10. **Mobile overlay:** Panel slides in at 500px (capped at 90vw)
