# CC-PAYMENT-METHODS-GRID-FIX.md
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

The previous layout spec didn't match the wireframe. The Stripe card stretched to fill the left column and manual methods dropped below the grid. This fix uses a proper CSS grid where all 4 blocks are direct grid children with correct placement:

```
┌────────────────────┬────────────────────┐
│ Online Payments    │ Payment Plans      │
│ (Stripe)           │ + toggle           │
├────────────────────┤────────────────────┤
│                    │ Fees & Grace       │
│ Manual Methods     │ Period             │
│ (6 toggle rows)    │                    │
│                    │                    │
└────────────────────┴────────────────────┘
```

All 4 blocks are direct children of a single `grid`. Manual Methods is taller naturally because of its content, not because of `h-full` or `row-span` hacks.

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (1 file)

---

## PHASE 1 — Fix Grid Layout

### File: `src/pages/settings/SetupSectionContent.jsx`

**Replace the entire `case 'payments':` return block** (from `case 'payments':` up to but not including `case 'fees':`).

Replace with:

```jsx
      case 'payments':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Configure how you accept payments from families. Enable at least one method.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] lg:grid-rows-[auto_1fr] gap-4">

              {/* TOP-LEFT: Online Payments (Stripe) */}
              <div className={`p-4 rounded-xl border-2 ${
                organization?.stripe_enabled
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : `${tc.border}`
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${tc.text}`}>Online Payments</p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {organization?.stripe_enabled
                        ? <>Stripe is <span className="text-emerald-500 font-semibold">enabled</span> ({organization?.stripe_mode === 'live' ? 'Live' : 'Test'} mode)</>
                        : 'Credit/debit cards via Stripe'
                      }
                    </p>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-white font-medium text-xs flex-shrink-0"
                    style={{ backgroundColor: accent.primary }}
                    onClick={() => navigate('/settings/payment-setup')}
                  >
                    {organization?.stripe_enabled ? 'Manage →' : 'Set Up →'}
                  </button>
                </div>
              </div>

              {/* TOP-RIGHT: Payment Plans */}
              <div className={`p-4 rounded-xl border ${tc.border}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateField('allowPaymentPlans', !localData.allowPaymentPlans)}
                    className={`w-9 h-[18px] rounded-full transition-colors flex-shrink-0 ${localData.allowPaymentPlans ? '' : 'bg-slate-600'}`}
                    style={{ backgroundColor: localData.allowPaymentPlans ? accent.primary : undefined }}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${localData.allowPaymentPlans ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className={`text-sm font-semibold ${tc.text}`}>Allow Payment Plans</p>
                    <p className={`text-xs ${tc.textMuted}`}>Split payments into installments</p>
                  </div>
                </div>
                {localData.allowPaymentPlans && (
                  <div className="mt-3 pl-12">
                    <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Installments</label>
                    <input
                      type="number"
                      value={localData.paymentPlanInstallments || ''}
                      onChange={(e) => updateField('paymentPlanInstallments', parseFloat(e.target.value) || 0)}
                      min={2} max={6}
                      className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                    />
                  </div>
                )}
              </div>

              {/* BOTTOM-LEFT: Manual Methods */}
              <div className={`rounded-xl border ${tc.border}`}>
                <div className="px-4 py-2">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${tc.textMuted}`}>Manual Methods</p>
                </div>
                <div className={`divide-y ${tc.border}`}>
                  {[
                    { key: 'venmo', label: 'Venmo', icon: '💜', placeholder: '@YourVenmoHandle' },
                    { key: 'zelle', label: 'Zelle', icon: '💚', placeholder: 'email@example.com or phone' },
                    { key: 'cashapp', label: 'Cash App', icon: '💵', placeholder: '$YourCashTag' },
                    { key: 'paypal', label: 'PayPal', icon: '💙', placeholder: 'email@example.com' },
                    { key: 'check', label: 'Check', icon: '📝', placeholder: 'Payable to: Your Org Name' },
                    { key: 'cash', label: 'Cash', icon: '💰', placeholder: 'In-person only' },
                  ].map(method => {
                    const methodData = localData.paymentMethods?.[method.key] || {}
                    return (
                      <div key={method.key} className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm w-5 text-center">{method.icon}</span>
                          <span className={`font-medium text-sm ${tc.text} w-20`}>{method.label}</span>
                          <button
                            onClick={() => {
                              const newMethods = { ...localData.paymentMethods }
                              newMethods[method.key] = { ...methodData, enabled: !methodData.enabled }
                              updateField('paymentMethods', newMethods)
                            }}
                            className={`w-9 h-[18px] rounded-full transition-colors flex-shrink-0 ${methodData.enabled ? '' : 'bg-slate-600'}`}
                            style={{ backgroundColor: methodData.enabled ? accent.primary : undefined }}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${methodData.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                          </button>
                          {methodData.enabled && (
                            <input
                              type="text"
                              value={methodData.account || ''}
                              onChange={(e) => {
                                const newMethods = { ...localData.paymentMethods }
                                newMethods[method.key] = { ...methodData, account: e.target.value }
                                updateField('paymentMethods', newMethods)
                              }}
                              placeholder={method.placeholder}
                              className={`flex-1 px-2.5 py-1 rounded-lg border text-sm ${tc.input}`}
                            />
                          )}
                        </div>
                        {methodData.enabled && (
                          <div className="mt-1.5 pl-[7.5rem]">
                            <input
                              type="text"
                              value={methodData.instructions || ''}
                              onChange={(e) => {
                                const newMethods = { ...localData.paymentMethods }
                                newMethods[method.key] = { ...methodData, instructions: e.target.value }
                                updateField('paymentMethods', newMethods)
                              }}
                              placeholder="Instructions (optional)"
                              className={`w-full px-2.5 py-1 rounded-lg border text-xs ${tc.input}`}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* BOTTOM-RIGHT: Fees & Grace Period */}
              <div className={`p-4 rounded-xl border ${tc.border} self-start`}>
                <p className={`font-semibold text-sm ${tc.text} mb-3`}>Fees & Grace Period</p>
                <div className="flex gap-4">
                  <div>
                    <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Late Fee</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input
                        type="number"
                        value={localData.lateFeeAmount || ''}
                        onChange={(e) => updateField('lateFeeAmount', parseFloat(e.target.value) || 0)}
                        className={`w-24 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Grace Period</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={localData.gracePeriodDays || ''}
                        onChange={(e) => updateField('gracePeriodDays', parseFloat(e.target.value) || 0)}
                        className={`w-24 pr-12 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>days</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )
```

### What's different from the broken version:
1. **No wrapper divs for columns.** All 4 blocks are direct children of the grid. CSS grid handles the 2x2 layout automatically.
2. **No `h-full`** on the Stripe card. It sizes to its content.
3. **`grid-rows-[auto_1fr]`** -- first row (Stripe + Payment Plans) sizes to content. Second row (Manual Methods + Fees) takes remaining space, with Fees using `self-start` so it doesn't stretch.
4. **Stripe card is compact** -- icon, text, and button are all on one row. No stacked layout.
5. **Grid naturally flows**: top-left, top-right, bottom-left, bottom-right in DOM order = correct grid placement.

### Verification

- On desktop (lg+): 4 blocks in a 2x2 grid. Stripe top-left, Payment Plans top-right, Manual Methods bottom-left, Fees bottom-right.
- Stripe card and Payment Plans card should be roughly the same height (short).
- Manual Methods card is taller (6 rows). Fees card sits at the top of the bottom-right cell (`self-start`), not stretching.
- On mobile: all 4 blocks stack vertically.

### Commit message
```
fix(setup): correct Payment Methods grid to 2x2 layout matching wireframe
```
