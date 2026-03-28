# CC-TIGHTEN-PAYMENT-METHODS-LAYOUT.md
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

The Payment Methods section in Org Setup wastes space. Each manual method sits in its own full-width card with the label on the far left and toggle on the far right. Expanded inputs stretch unnecessarily. The Payment Settings block has number inputs wider than they need to be.

This spec tightens the layout:
- Manual methods collapse into a single card with divider rows (like Coach Requirements does with its toggle list)
- When a method is enabled, the account input appears inline at a constrained width, not full-width
- Payment Settings number inputs get constrained widths
- Overall vertical scroll is reduced

**Design reference:** The Coach Requirements section (toggle list with dividers, no individual cards per item) is the target density.

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (1 file)

---

## PHASE 1 — Tighten Manual Methods + Payment Settings

### File: `src/pages/settings/SetupSectionContent.jsx`

**Change 1: Replace the manual methods block.**

Find the manual methods `.map()` block. It starts at approximately:

```jsx
{[
  { key: 'venmo', label: 'Venmo', icon: '💜', placeholder: '@YourVenmoHandle' },
```

And ends at approximately:

```jsx
            })}
```

(Just before the Payment Settings `<div>`.)

Replace that entire block (from `{[` through the closing `})}`) with:

```jsx
<div className={`rounded-xl border ${tc.border} divide-y ${tc.border}`}>
  {[
    { key: 'venmo', label: 'Venmo', icon: '💜', placeholder: '@YourVenmoHandle' },
    { key: 'zelle', label: 'Zelle', icon: '💚', placeholder: 'email@example.com or phone' },
    { key: 'cashapp', label: 'Cash App', icon: '💵', placeholder: '$YourCashTag' },
    { key: 'paypal', label: 'PayPal', icon: '💙', placeholder: 'email@example.com' },
    { key: 'check', label: 'Check', icon: '📝', placeholder: 'Payable to: Your Org Name' },
    { key: 'cash', label: 'Cash', icon: 'dollar', placeholder: 'In-person only' },
  ].map(method => {
    const methodData = localData.paymentMethods?.[method.key] || {}
    return (
      <div key={method.key} className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">{method.icon}</span>
          <span className={`font-medium text-sm ${tc.text} w-24`}>{method.label}</span>
          <button
            onClick={() => {
              const newMethods = { ...localData.paymentMethods }
              newMethods[method.key] = { ...methodData, enabled: !methodData.enabled }
              updateField('paymentMethods', newMethods)
            }}
            className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${methodData.enabled ? '' : 'bg-slate-600'}`}
            style={{ backgroundColor: methodData.enabled ? accent.primary : undefined }}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${methodData.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
              className={`flex-1 max-w-xs px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
            />
          )}
        </div>
        {methodData.enabled && (
          <div className="mt-2 ml-[calc(1.125rem+0.75rem+6rem+0.75rem)]">
            <textarea
              value={methodData.instructions || ''}
              onChange={(e) => {
                const newMethods = { ...localData.paymentMethods }
                newMethods[method.key] = { ...methodData, instructions: e.target.value }
                updateField('paymentMethods', newMethods)
              }}
              placeholder="Payment instructions (optional)"
              rows={1}
              className={`w-full max-w-md px-3 py-1.5 rounded-lg border text-sm ${tc.input} resize-none`}
            />
          </div>
        )}
      </div>
    )
  })}
</div>
```

**What changed:**
- 6 separate full-width cards → 1 card with divider rows
- Label, toggle, and account input are on the same row (not label-left toggle-far-right)
- Toggle is right next to the label (w-24 fixed width for label, toggle immediately after)
- Account input appears inline to the right of the toggle when enabled, constrained to `max-w-xs`
- Instructions textarea drops below with a left offset to align under the input, constrained to `max-w-md`
- Toggle is slightly smaller (w-10 h-5 instead of w-12 h-6) to match the compact row height
- Padding reduced (py-3 instead of p-4)

**Change 2: Tighten the Payment Settings block.**

Find the Payment Settings block (starts around line 787):

```jsx
<div className={`p-4 rounded-xl border ${tc.border}`}>
  <p className={`font-medium ${tc.text} mb-4`}>⚙️ Payment Settings</p>
  <div className="space-y-4">
    <SectionToggle {...fp}
      label="Allow Payment Plans"
      field="allowPaymentPlans"
      helpText="Let families split payments into installments"
    />
    {localData.allowPaymentPlans && (
      <div className="pl-4 border-l-2 border-slate-600 space-y-4">
        <SectionNumberInput {...fp} label="Number of Installments" field="paymentPlanInstallments" min={2} max={6} />
      </div>
    )}
    <div className="grid grid-cols-2 gap-4">
      <SectionNumberInput {...fp} label="Late Fee Amount" field="lateFeeAmount" prefix="$" />
      <SectionNumberInput {...fp} label="Grace Period" field="gracePeriodDays" suffix="days" />
    </div>
  </div>
</div>
```

Replace with:

```jsx
<div className={`p-4 rounded-xl border ${tc.border}`}>
  <p className={`font-medium ${tc.text} mb-4`}>⚙️ Payment Settings</p>
  <div className="space-y-4">
    <SectionToggle {...fp}
      label="Allow Payment Plans"
      field="allowPaymentPlans"
      helpText="Let families split payments into installments"
    />
    {localData.allowPaymentPlans && (
      <div className="pl-4 border-l-2 border-slate-600">
        <div className="max-w-[200px]">
          <SectionNumberInput {...fp} label="Number of Installments" field="paymentPlanInstallments" min={2} max={6} />
        </div>
      </div>
    )}
    <div className="flex gap-4">
      <div className="w-[180px]">
        <SectionNumberInput {...fp} label="Late Fee Amount" field="lateFeeAmount" prefix="$" />
      </div>
      <div className="w-[200px]">
        <SectionNumberInput {...fp} label="Grace Period" field="gracePeriodDays" suffix="days" />
      </div>
    </div>
  </div>
</div>
```

**What changed:**
- "Number of Installments" constrained to 200px (it's a 1-digit number, doesn't need 400px)
- Late Fee and Grace Period switched from `grid grid-cols-2` (each takes 50% of full width) to `flex` with fixed widths (180px and 200px) so they sit compact on the left instead of stretching across the page
- The suffix "days" will now be visible right next to the number, not 3 planets to the right

### Verification

- The Payment Methods section should now have one card with 6 rows instead of 6 separate cards
- Toggle should be right next to each method name, not at the far right edge
- When a method is enabled, the account input appears on the same row
- Late Fee and Grace Period should be compact side-by-side inputs on the left, not stretched across full width
- No other sections changed

### Commit message
```
refactor(setup): tighten Payment Methods layout — compact rows, constrained inputs
```

---

## POST-EXECUTION QA CHECKLIST

1. All 6 manual methods visible in a single card with divider rows
2. Toggle is immediately next to each method name (icon → name → toggle → input)
3. Enabling a method shows the account input inline on the same row
4. Instructions textarea appears below, aligned under the account input
5. "Number of Installments" is a compact input, not full width
6. "Late Fee Amount" and "Grace Period" sit side by side at reasonable widths, suffix visible next to the number
7. Stripe card and "Manual Payment Methods" divider are unchanged
8. Toggling methods on/off still saves correctly
