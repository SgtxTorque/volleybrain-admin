# CC-PAYMENTS-FIXED-SPLIT.md
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

The payment list should NOT accordion (change width) when a family is selected. Both columns stay fixed width at all times. The detail panel always shows — either family details or a "select a family" placeholder.

**Files touched:**
- `src/pages/payments/PaymentsPage.jsx` (1 file)

---

## PHASE 1 — Fixed Two-Column Layout with Persistent Detail Panel

### File: `src/pages/payments/PaymentsPage.jsx`

**Change 1: Replace the flex layout and detail panel section.**

Find the layout wrapper and the conditional detail panel (around lines 551-645). The current code is:

```jsx
        <div className="flex gap-6">
          {/* Left: Payment list */}
          <div className="flex-1 min-w-0">
```

Replace `<div className="flex gap-6">` with:

```jsx
        <div className="flex gap-5">
          {/* Left: Payment list */}
          <div className="w-[420px] shrink-0 min-w-0 overflow-y-auto max-h-[calc(100vh-280px)]">
```

This gives the list a fixed 420px width that never changes.

**Change 2: Replace the conditional detail panel with an always-visible panel.**

Find (around lines 633-645):

```jsx
          {/* Right: Family Detail Panel */}
          {selectedFamily && viewMode === 'family' && (
            <div className="w-[380px] shrink-0 hidden xl:block">
              <FamilyDetailPanel
                family={selectedFamily}
                onClose={() => setSelectedFamily(null)}
                onMarkPaid={p => setShowMarkPaidModal(p)}
                onMarkUnpaid={handleMarkUnpaid}
                onSendReminder={f => setShowReminderModal(f)}
                onAddFee={() => setShowAddModal(true)}
              />
            </div>
          )}
```

Replace with:

```jsx
          {/* Right: Family Detail Panel — always visible */}
          {viewMode === 'family' && (
            <div className="flex-1 min-w-0 hidden lg:block">
              {selectedFamily ? (
                <FamilyDetailPanel
                  family={selectedFamily}
                  onClose={() => setSelectedFamily(null)}
                  onMarkPaid={p => setShowMarkPaidModal(p)}
                  onMarkUnpaid={handleMarkUnpaid}
                  onSendReminder={f => setShowReminderModal(f)}
                  onAddFee={() => setShowAddModal(true)}
                />
              ) : (
                <div className={`rounded-2xl flex flex-col items-center justify-center sticky top-4 h-[calc(100vh-280px)] ${
                  isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                    isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'
                  }`}>
                    <span className="text-3xl">👈</span>
                  </div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                    Select a Family
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Click a family to view account details
                  </p>
                </div>
              )}
            </div>
          )}
```

**What changed:**
- Detail panel is always rendered when in family view mode (not gated by `selectedFamily`)
- When no family selected: shows a centered placeholder with "Select a Family" nudge
- Panel uses `flex-1` so it fills all remaining space after the 420px list
- Changed breakpoint from `xl:block` to `lg:block` since the list is narrower now
- List has `overflow-y-auto` and `max-h` so it scrolls independently

### Verification

- Family list is always 420px wide, regardless of selection state
- Detail panel always visible on lg+ screens
- No family selected: placeholder with "Select a Family" message
- Family selected: detail panel shows account info with sibling tabs
- List scrolls independently from the detail panel
- On screens smaller than lg: detail panel hidden, mobile overlay still works

### Commit message
```
fix(payments): fixed 2-column layout — list always 420px, detail panel always visible with placeholder
```
