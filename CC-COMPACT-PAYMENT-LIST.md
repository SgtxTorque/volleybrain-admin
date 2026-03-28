# CC-COMPACT-PAYMENT-LIST.md
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

The Payments page renders each family as a separate padded card with rounded corners, border, and shadow. This wastes vertical space and makes the list feel sparse. The target is the Teams & Health table density: tight rows, divider lines, no individual card wrappers.

**Phase 1:** Convert `FamilyPaymentCard` and `PlayerPaymentCard` from individual cards to compact rows (strip card wrapper, reduce padding).

**Phase 2:** Wrap the lists in `PaymentsPage.jsx` in a single container card so the rows sit inside one bordered container with dividers.

**Files touched:**
- `src/pages/payments/PaymentCards.jsx` (Phase 1)
- `src/pages/payments/PaymentsPage.jsx` (Phase 2)

---

## PHASE 1 — Convert Cards to Compact Rows

### File: `src/pages/payments/PaymentCards.jsx`

**Change 1: Convert `PlayerPaymentCard` wrapper.**

Find the outer wrapper (around line 30-31):

```jsx
  return (
    <div className={`${cardBg} rounded-[14px] overflow-hidden transition-all`}>
      <div onClick={onToggle} className={`px-5 py-4 cursor-pointer transition flex items-center justify-between ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
```

Replace with:

```jsx
  return (
    <div className="overflow-hidden transition-all">
      <div onClick={onToggle} className={`px-4 py-2.5 cursor-pointer transition flex items-center justify-between ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
```

Remove the `cardBg` const (line 28) since it's no longer used. Or just leave it — it won't hurt.

Also in the same component, find the closing `</div>` of the outer wrapper (line 132-133). No change needed there.

**Change 2: Reduce padding in the expanded fee items of PlayerPaymentCard.**

Find (around line 68):
```jsx
              <div key={payment.id} className={`px-5 py-3 flex items-center justify-between
```

Replace `px-5 py-3` with `px-4 py-2`:
```jsx
              <div key={payment.id} className={`px-4 py-2 flex items-center justify-between
```

Also find the payment history section (around line 116):
```jsx
            <div className={`px-5 py-3 border-t
```

Replace `px-5 py-3` with `px-4 py-2`:
```jsx
            <div className={`px-4 py-2 border-t
```

**Change 3: Convert `FamilyPaymentCard` wrapper.**

Find the outer wrapper (around lines 165-170):

```jsx
  return (
    <div className={`rounded-[14px] overflow-hidden transition-all ${
      isSelected
        ? (isDark ? 'bg-[#4BB9EC]/10 border-2 border-[#10284C]' : 'bg-[#4BB9EC]/[0.06] border-2 border-[#10284C]')
        : (isDark ? 'bg-[#132240] border border-white/[0.06] hover:bg-[#1a2d50]' : 'bg-white border border-[#E8ECF2] hover:shadow-md')
    } ${isOverdue && !isSelected ? (isDark ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-red-500') : ''}`}>
```

Replace with:

```jsx
  return (
    <div className={`overflow-hidden transition-all ${
      isSelected
        ? (isDark ? 'bg-[#4BB9EC]/10' : 'bg-[#4BB9EC]/[0.06]')
        : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
    } ${isOverdue && !isSelected ? 'border-l-4 border-l-red-500' : ''}`}>
```

**What changed:** Stripped `rounded-[14px]`, individual borders, shadow on hover. Kept selected highlight bg and overdue left-border indicator.

**Change 4: Reduce header row padding in FamilyPaymentCard.**

Find (around line 172):
```jsx
      <div className={`p-4 flex items-center gap-3 cursor-pointer transition`}
```

Replace with:
```jsx
      <div className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition`}
```

**Change 5: Reduce expanded fee items padding in FamilyPaymentCard.**

Find (around line 242):
```jsx
              <div key={payment.id} className={`px-5 py-3 flex items-center justify-between
```

Replace `px-5 py-3` with `px-4 py-2`:
```jsx
              <div key={payment.id} className={`px-4 py-2 flex items-center justify-between
```

### Verification

- `grep "rounded-\[14px\]" src/pages/payments/PaymentCards.jsx` should return 0 hits
- `grep "hover:shadow-md" src/pages/payments/PaymentCards.jsx` should return 0 hits
- `grep "py-2.5" src/pages/payments/PaymentCards.jsx` should return 2 hits (one per card type header)

### Commit message
```
refactor(payments): convert payment cards to compact rows — strip card wrappers, reduce padding
```

---

## PHASE 2 — Wrap Lists in Container Card

### File: `src/pages/payments/PaymentsPage.jsx`

**Change 1: Wrap the individual (player) list in a container.**

Find (around line 554-567):

```jsx
            {viewMode === 'individual' ? (
              <div className="space-y-3">
                {playerList.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No results found for "{searchQuery}"</div>
                ) : (
                  playerList.map(({ id, player, payments: pPayments }) => (
                    <PlayerPaymentCard key={id} player={player} payments={pPayments}
                      expanded={expandedCards.has(id)} onToggle={() => toggleCard(id)}
                      onMarkPaid={p => setShowMarkPaidModal(p)} onMarkUnpaid={handleMarkUnpaid}
                      onDeletePayment={p => setShowDeleteModal(p)} onSendReminder={p => setShowReminderModal(p)}
                    />
                  ))
                )}
              </div>
```

Replace with:

```jsx
            {viewMode === 'individual' ? (
              <div>
                {playerList.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No results found for "{searchQuery}"</div>
                ) : (
                  <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04)]'}`}>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {playerList.map(({ id, player, payments: pPayments }) => (
                        <PlayerPaymentCard key={id} player={player} payments={pPayments}
                          expanded={expandedCards.has(id)} onToggle={() => toggleCard(id)}
                          onMarkPaid={p => setShowMarkPaidModal(p)} onMarkUnpaid={handleMarkUnpaid}
                          onDeletePayment={p => setShowDeleteModal(p)} onSendReminder={p => setShowReminderModal(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
```

**Change 2: Wrap the flat family list (balance/name sort) in a container.**

Find (around line 611-629):

```jsx
              <div className="space-y-3">
                {familyList.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No results found for "{searchQuery}"</div>
                ) : (
                  familyList.map(family => (
                    <FamilyPaymentCard key={family.email} family={family}
```

Replace the opening `<div className="space-y-3">` with `<div>` and wrap the family map in a container:

```jsx
              <div>
                {familyList.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No results found for "{searchQuery}"</div>
                ) : (
                  <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04)]'}`}>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {familyList.map(family => (
                        <FamilyPaymentCard key={family.email} family={family}
                          expanded={expandedCards.has(family.email)} onToggle={() => toggleCard(family.email)}
                          onMarkPaid={p => setShowMarkPaidModal(p)} onMarkUnpaid={handleMarkUnpaid}
                          onDeletePayment={p => setShowDeleteModal(p)} onSendReminder={f => setShowReminderModal(f)}
                          isSelected={selectedFamily?.email === family.email}
                          onSelect={() => setSelectedFamily(selectedFamily?.email === family.email ? null : family)}
                          zone={null}
                          onBulkToggle={() => toggleBulkSelect(family.email)}
                          bulkSelected={selectedFamilyIds.has(family.email)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
```

**Change 3: Wrap the priority zone family lists in containers.**

Find the zone families rendering (around line 592):

```jsx
                      <div className="space-y-3">
                        {visibleFamilies.map(family => (
                          <FamilyPaymentCard key={family.email} family={family}
```

Replace `<div className="space-y-3">` with a container card:

```jsx
                      <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04)]'}`}>
                        <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                        {visibleFamilies.map(family => (
                          <FamilyPaymentCard key={family.email} family={family}
```

And find the closing of that map block. The current closing is:

```jsx
                        ))}
                      </div>
```

Replace with:

```jsx
                        ))}
                        </div>
                      </div>
```

### Verification

- Payment list should render as a single bordered card with divider rows instead of separate floating cards
- Priority zone view: each zone gets its own container card with rows inside
- Selected family row should highlight with blue bg
- Overdue families should still have red left border
- Expanded fee items still appear below the row inside the same container
- Empty state message still renders without a card wrapper

### Commit message
```
refactor(payments): wrap payment lists in container cards with divider rows
```

---

## POST-EXECUTION QA CHECKLIST

1. **Family view (flat sort):** Single container card, families as divider rows. Much less vertical space per family.
2. **Family view (priority sort):** Each zone (Critical, Follow Up, Upcoming, Paid) gets its own container card with rows inside.
3. **Individual view:** Same treatment for player cards.
4. **Selected state:** Clicking a family highlights the row with blue bg, detail panel opens on right.
5. **Overdue indicator:** Red left border still visible on overdue rows.
6. **Expanded state:** Clicking the chevron expands fee line items within the row, divider still visible.
7. **Bulk checkboxes:** Still functional, still aligned.
8. **Bell/reminder buttons:** Still visible and clickable.
9. **Progress bar + balance:** Still visible per row, compact.
10. **Empty state:** "No results found" still renders cleanly without a card wrapper.
