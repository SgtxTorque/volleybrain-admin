# CC-FIX-PAYMENT-DETAIL-REFRESH.md
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

When a payment is marked paid/unpaid from the detail panel, the family list refreshes but the detail panel shows stale data because `selectedFamily` is a snapshot object stored at click time. The fix: store only the selected family's email in state, and derive the displayed family from the live `familyList` on every render.

**Files touched:**
- `src/pages/payments/PaymentsPage.jsx` (1 file)

---

## PHASE 1 — Derive selectedFamily from familyList

### File: `src/pages/payments/PaymentsPage.jsx`

**Change 1: Change selectedFamily state to store email only.**

Find (around line 175):

```js
const [selectedFamily, setSelectedFamily] = useState(null)
```

Replace with:

```js
const [selectedFamilyEmail, setSelectedFamilyEmail] = useState(null)
```

**Change 2: Add a derived selectedFamily after familyList is computed.**

Find where `familyList` is defined (around line 360). After the `familyList` sort block ends (the closing `})`), add:

```js
  const selectedFamily = selectedFamilyEmail ? familyList.find(f => f.email === selectedFamilyEmail) || null : null
```

**Change 3: Find and replace all `setSelectedFamily` calls.**

Do a find-and-replace across the entire file:

- `setSelectedFamily(null)` → `setSelectedFamilyEmail(null)`
- `setSelectedFamily(selectedFamily?.email === family.email ? null : family)` → `setSelectedFamilyEmail(selectedFamilyEmail === family.email ? null : family.email)`
- `selectedFamily?.email === family.email` stays the same (it reads from the derived `selectedFamily`)

Specifically, find each occurrence:

**Occurrence 1** (around line 599, priority zone families):
```js
onSelect={() => setSelectedFamily(selectedFamily?.email === family.email ? null : family)}
```
Replace with:
```js
onSelect={() => setSelectedFamilyEmail(selectedFamilyEmail === family.email ? null : family.email)}
```

**Occurrence 2** (around line 622, flat family list):
```js
onSelect={() => setSelectedFamily(selectedFamily?.email === family.email ? null : family)}
```
Replace with:
```js
onSelect={() => setSelectedFamilyEmail(selectedFamilyEmail === family.email ? null : family.email)}
```

**Occurrence 3** (detail panel onClose, around line 638):
```js
onClose={() => setSelectedFamily(null)}
```
Replace with:
```js
onClose={() => setSelectedFamilyEmail(null)}
```

**Occurrence 4** (mobile overlay backdrop, around line 678):
```js
onClick={() => setSelectedFamily(null)}
```
Replace with:
```js
onClick={() => setSelectedFamilyEmail(null)}
```

**Occurrence 5** (mobile detail panel onClose, around line 682):
```js
onClose={() => setSelectedFamily(null)}
```
Replace with:
```js
onClose={() => setSelectedFamilyEmail(null)}
```

**Important:** Do NOT change any reads of `selectedFamily` (like `selectedFamily?.email`, `selectedFamily && viewMode`, etc.). Those read from the derived const, which is correct.

### Verification

- `grep "setSelectedFamily" src/pages/payments/PaymentsPage.jsx` should return 0 hits
- `grep "setSelectedFamilyEmail" src/pages/payments/PaymentsPage.jsx` should return 5+ hits
- `grep "const selectedFamily " src/pages/payments/PaymentsPage.jsx` should return 1 hit (the derived const)
- Mark a payment paid → detail panel balance updates immediately
- Mark a payment unpaid → detail panel balance updates immediately
- Delete a payment → detail panel updates immediately
- Add a fee → detail panel updates immediately

### Commit message
```
fix(payments): derive selectedFamily from live familyList so detail panel refreshes after payment actions
```
