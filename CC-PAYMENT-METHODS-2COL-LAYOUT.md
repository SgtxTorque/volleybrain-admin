# CC-PAYMENT-METHODS-2COL-LAYOUT.md
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

Restructure the Payment Methods section into a 2-column grid layout per Carlos's wireframe:

```
┌─────────────────────────┬─────────────────────────┐
│   Online Payments       │   Allow Payment Plans    │
│   (Stripe card)         │   + Late Fee / Grace     │
├─────────────────────────┤   Period                 │
│                         │                          │
│   Manual Payment        │                          │
│   Methods               │                          │
│   (toggle list)         │                          │
│                         │                          │
└─────────────────────────┴──────────────────────────┘
```

Also fix: Cash icon is `'dollar'` (string, not emoji) causing alignment offset.

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (1 file)

---

## PHASE 1 — 2-Column Grid Layout for Payment Methods

### File: `src/pages/settings/SetupSectionContent.jsx`

**Replace the entire `case 'payments':` return block.**

Find the payments case (starts around line 684). Replace everything from `case 'payments':` up to (but not including) `case 'fees':` with:

```jsx
      case 'payments':
        return (
          <div className="space-y-5">
            <p className={`text-sm ${tc.textMuted}`}>Configure how you accept payments from families. Enable at least one method.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Online Payments (Stripe) */}
                <div className={`p-4 rounded-xl border-2 h-full ${
                  organization?.stripe_enabled
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : `${tc.border}`
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">💳</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${tc.text}`}>Online Payments</p>
                      <p className={`text-sm ${tc.textMuted} mt-0.5`}>
                        {organization?.stripe_enabled
                          ? <>Stripe is <span className="text-emerald-500 font-semibold">enabled</span> ({organization?.stripe_mode === 'live' ? 'Live' : 'Test'} mode)</>
                          : 'Accept credit/debit cards via Stripe'
                        }
                      </p>
                      <button
                        className="mt-3 px-4 py-2 rounded-lg text-white font-medium text-sm"
                        style={{ backgroundColor: accent.primary }}
                        onClick={() => navigate('/settings/payment-setup')}
                      >
                        {organization?.stripe_enabled ? 'Manage Stripe →' : 'Set Up Stripe →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Manual Payment Methods */}
                <div className={`rounded-xl border ${tc.border}`}>
                  <div className="px-4 py-2.5">
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
                        <div key={method.key} className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base w-5 text-center">{method.icon}</span>
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
                            <div className="mt-1.5 pl-[calc(1.25rem+0.625rem+5rem+0.625rem)]">
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
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">
                {/* Payment Plans */}
                <div className={`p-4 rounded-xl border ${tc.border}`}>
                  <p className={`font-semibold ${tc.text} mb-3`}>Payment Plans</p>
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => updateField('allowPaymentPlans', !localData.allowPaymentPlans)}
                      className={`w-9 h-[18px] rounded-full transition-colors flex-shrink-0 ${localData.allowPaymentPlans ? '' : 'bg-slate-600'}`}
                      style={{ backgroundColor: localData.allowPaymentPlans ? accent.primary : undefined }}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${localData.allowPaymentPlans ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${tc.text}`}>Allow Payment Plans</p>
                      <p className={`text-xs ${tc.textMuted}`}>Let families split payments into installments</p>
                    </div>
                  </div>
                  {localData.allowPaymentPlans && (
                    <div className="pl-4 border-l-2 border-slate-600 mt-3">
                      <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Number of Installments</label>
                      <input
                        type="number"
                        value={localData.paymentPlanInstallments || ''}
                        onChange={(e) => updateField('paymentPlanInstallments', parseFloat(e.target.value) || 0)}
                        min={2} max={6}
                        className={`w-24 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                      />
                    </div>
                  )}
                </div>

                {/* Late Fees & Grace */}
                <div className={`p-4 rounded-xl border ${tc.border}`}>
                  <p className={`font-semibold ${tc.text} mb-3`}>Fees & Grace Period</p>
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
          </div>
        )
```

### Key changes from the previous attempt:
- **2-column grid** (`grid-cols-1 lg:grid-cols-2`) matches the wireframe exactly
- **Left column:** Stripe card on top, manual methods below (single card with compact rows)
- **Right column:** Payment Plans card, Fees & Grace Period card
- **Cash icon fixed:** Changed from `'dollar'` to `'💰'` emoji so alignment is consistent
- **No more `SectionToggle`** for Allow Payment Plans — inline toggle sits next to the label, not at the far right edge
- **No more `SectionNumberInput`** for Late Fee / Grace / Installments — inline inputs with fixed `w-24` width so they're compact
- **Instructions field** changed from textarea to single-line input (less vertical space)
- **Toggle size** reduced to w-9 h-[18px] to match compact row density

### Verification

- `grep -c "SectionToggle\|SectionNumberInput" src/pages/settings/SetupSectionContent.jsx` — count should be LOWER than before (removed from payments section, still used elsewhere)
- `grep "dollar" src/pages/settings/SetupSectionContent.jsx` should return 0 hits (Cash icon fixed)
- The section should render as a 2-column layout on desktop, single column on mobile
- No other sections changed

### Commit message
```
refactor(setup): restructure Payment Methods into 2-column grid layout per wireframe
```

---

## POST-EXECUTION QA CHECKLIST

1. **Desktop (lg+):** 2-column layout. Left = Stripe card + manual methods. Right = Payment Plans + Fees.
2. **Mobile:** Single column, everything stacks naturally
3. **Manual methods:** All 6 methods in a single card, compact rows, toggle next to label (not far right)
4. **Cash icon:** Shows 💰 emoji, aligned with other methods
5. **Allow Payment Plans toggle:** Right next to the label text, not at far right edge
6. **Installments input:** Compact w-24, appears when payment plans enabled
7. **Late Fee / Grace Period:** Side by side, compact w-24 inputs, $ and "days" visible next to numbers
8. **Stripe card:** Button below the text (stacked), not floating at far right
9. **All toggles still save correctly** — enable/disable methods, payment plans
