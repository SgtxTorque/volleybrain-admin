# CC-ADD-STRIPE-CARD-TO-PAYMENTS.md
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

The Payment Methods section in Org Setup only shows manual payment options (Venmo, Zelle, Cash App, etc.). A fully functional Stripe/online payments setup page exists at `/settings/payment-setup` with enable/disable, API keys, test mode, processing fees, and connection testing. But there's no link to it from Org Setup, so admins don't know it exists.

This spec adds an Online Payments card at the top of the Payment Methods section that shows Stripe status and links to the full configuration page.

**Files touched:**
- `src/pages/settings/SetupSectionContent.jsx` (1 file, 1 phase)

---

## PHASE 1 — Add Online Payments Card to Payment Methods Section

**Goal:** Add a prominent card at the top of the `payments` case that shows current Stripe status (enabled/disabled, test/live mode) and a button to navigate to `/settings/payment-setup`.

### File: `src/pages/settings/SetupSectionContent.jsx`

**Change 1: Add the Online Payments card at the top of the payments section.**

Find the `case 'payments':` block (around line 664). It currently starts with:

```jsx
case 'payments':
  return (
    <div className="space-y-6">
      <p className={`text-sm ${tc.textMuted}`}>Configure how you accept payments from families. Enable at least one method.</p>

      {[
```

Insert the Online Payments card between the intro paragraph and the manual methods array. The result should be:

```jsx
case 'payments':
  return (
    <div className="space-y-6">
      <p className={`text-sm ${tc.textMuted}`}>Configure how you accept payments from families. Enable at least one method.</p>

      {/* Online Payments (Stripe) */}
      <div className={`p-5 rounded-xl border-2 ${
        organization?.stripe_enabled
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : `${tc.border}`
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <p className={`font-semibold ${tc.text}`}>Online Payments</p>
              <p className={`text-sm ${tc.textMuted}`}>
                {organization?.stripe_enabled
                  ? <>Stripe is <span className="text-emerald-500 font-semibold">enabled</span> ({organization?.stripe_mode === 'live' ? 'Live' : 'Test'} mode)</>
                  : 'Accept credit/debit cards via Stripe'
                }
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: accent.primary }}
            onClick={() => navigate('/settings/payment-setup')}
          >
            {organization?.stripe_enabled ? 'Manage Stripe →' : 'Set Up Stripe →'}
          </button>
        </div>
        {!organization?.stripe_enabled && (
          <p className={`text-xs mt-3 ${tc.textMuted}`}>
            Enable Stripe to let families pay registration fees, dues, and other charges online with credit or debit cards.
          </p>
        )}
      </div>

      <div className={`flex items-center gap-3 ${tc.textMuted}`}>
        <div className={`flex-1 h-px ${tc.border}`} style={{ borderTopWidth: '1px' }} />
        <span className="text-xs font-bold uppercase tracking-wider">Manual Payment Methods</span>
        <div className={`flex-1 h-px ${tc.border}`} style={{ borderTopWidth: '1px' }} />
      </div>

      {[
```

Everything after the `{[` continues unchanged (the existing manual methods array and Payment Settings block).

### Verification

- `grep -n "Online Payments" src/pages/settings/SetupSectionContent.jsx` should return 1 hit
- `grep -n "payment-setup" src/pages/settings/SetupSectionContent.jsx` should return 1 hit
- `grep -n "stripe_enabled" src/pages/settings/SetupSectionContent.jsx` should return 2-3 hits (the status checks)
- The manual payment methods (Venmo, Zelle, etc.) should still render below the new card, unchanged

### Commit message
```
feat(setup): add Stripe status card with link to payment setup page in Org Setup
```

---

## POST-EXECUTION QA CHECKLIST

1. **Payment Methods section:** Should show an "Online Payments" card at the top with Stripe status
2. **Stripe disabled:** Card should show "Accept credit/debit cards via Stripe" with "Set Up Stripe" button and helper text
3. **Stripe enabled:** Card should show green border, "Stripe is enabled (Test/Live mode)" with "Manage Stripe" button
4. **Button click:** Should navigate to `/settings/payment-setup`
5. **Manual methods:** Venmo, Zelle, Cash App, PayPal, Check, Cash should all still appear below with a "Manual Payment Methods" divider
6. **Payment Settings:** Allow Payment Plans, Late Fee, Grace Period should still appear at bottom unchanged
