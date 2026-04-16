# INVESTIGATION REPORT — Marisa Operational Issues

**Date:** April 15, 2026
**Scope:** Read-only investigation of 3 live-beta operational requests from Black Hornets Youth Sports
**Status:** Investigation complete — no source files modified

---

## TL;DR

| # | Issue | Current Status | DB Migration? | Complexity |
|---|-------|----------------|----------------|------------|
| 1 | Custom fee tracking | **Already works** | None | No work needed |
| 2 | Registration transfer | Not implemented | None (optional audit column) | Medium (~500 LOC, 5 files) |
| 3 | Payment-gated approval | Not implemented | 1 `ALTER TABLE` (or JSONB field) | Medium (~400 LOC, 7 files) |

**All three can ship in one spec.** Issue 1 requires no code (verify in QA only). Issues 2 and 3 share no files and no DB objects — they can be built in parallel, though it is cleaner to do them sequentially in the order 3 → 2 (approval mode underpins fee timing, which transfer re-uses).

---

## ISSUE 1 — Custom Fee Tracking

### Verdict: ✅ WORKING AS DESIGNED

When an admin uses the "Add Fee" modal, the fee:
1. Attaches to the player via `player_id`
2. Appears in the admin's player payment cards and Family Detail Panel
3. Appears in the parent's payment ledger (ParentPaymentsPage)
4. Is marked `auto_generated: false` to distinguish from system-generated fees

### Full Data Flow

**UI:** `src/pages/payments/PaymentsModals.jsx:221-280` — `AddFeeModal` triggered from `PaymentsPage.jsx:544-548`

**Modal collects:**
```jsx
{ player_id, fee_type, fee_name, amount, due_date, description }
// + handler adds: paid: false, fee_category: 'per_player'
```

**Insert:** `src/pages/payments/PaymentsPage.jsx:310-326`
```jsx
async function handleAddPayment(paymentData) {
  const player = players.find(p => p.id === paymentData.player_id)
  await supabase.from('payments').insert({
    ...paymentData,                                       // player_id, fee_type, fee_name, amount, due_date, description, paid, fee_category
    season_id: selectedSeason.id,
    family_email: player?.parent_email?.toLowerCase(),
    auto_generated: false,                                // key distinction vs fee-calculator output
    created_at: new Date().toISOString()
  })
}
```

**Target table:** `payments` (same table as auto-generated fees)

**Fields set on custom fee:**
| Field | Value |
|-------|-------|
| `player_id` | ✅ Selected player UUID |
| `season_id` | ✅ Current season |
| `family_email` | ✅ Parent email (lowercase) |
| `fee_type` | User-selected (`'other'` default) |
| `fee_name` | User text |
| `amount` | Parsed float |
| `due_date` | Optional |
| `paid` | `false` |
| `fee_category` | `'per_player'` (no per_family option) |
| `auto_generated` | `false` |
| `registration_id` | **not set** (null) |

### Display Confirmation

**Admin view** — `PaymentsPage.jsx:220-244`:
```jsx
let query = supabase
  .from('payments')
  .select('*, players(id, first_name, last_name, parent_name, parent_email, photo_url, position, grade, jersey_number)')
if (!isAllSeasons(selectedSeason)) query = query.eq('season_id', selectedSeason.id)
const { data } = await query.order('created_at', { ascending: false })
```
No filter on `auto_generated` → custom fees appear alongside system fees.

**Parent view** — `ParentPaymentsPage.jsx:55-59`:
```jsx
const { data: paymentsData } = await supabase
  .from('payments')
  .select('*, players (id, first_name, last_name, season_id)')
  .in('player_id', playerIds)
```
Query keys on `player_id` → custom fees with `player_id` set appear in parent ledger.

### Comparison: Auto-Generated vs Custom

| Aspect | Auto-Generated | Custom |
|--------|----------------|--------|
| `auto_generated` | `true` | `false` |
| `registration_id` | Set on approval | `null` |
| `fee_category` | `'per_player'` or `'per_family'` | Always `'per_player'` |
| Unique constraint | Partial: `(player_id, season_id, fee_type, fee_name)` WHERE `auto_generated=true` | None (duplicates allowed) |
| Generation point | `fee-calculator.js:243` on approval | Modal submit |

### Minor Observations (not bugs)

- No unique constraint on custom fees means admins can accidentally add duplicates. By design.
- Custom fees cannot be marked `per_family`. Acceptable since per-family fees are auto-generated from season config.
- Custom fees do not link to `registration_id`. Acceptable for standalone/ad-hoc charges.

### Recommendation

**No fix needed.** If Marisa reports "I added a fee and it disappeared," it is likely a season-scoping issue (fee added while viewing Season A, then she switched to Season B and couldn't find it). Consider a small QA pass:
1. Confirm she selects the right player
2. Confirm she is on the same season when viewing
3. Confirm page refresh after add (handler already calls `loadPayments()`)

---

## ISSUE 2 — Registration Transfer

### Verdict: ❌ NOT IMPLEMENTED — Feature to build

Parents accidentally register for the wrong program. Admins have no way to move a registration between seasons without manual DB edits.

### Registration Data Model

**Primary tables touched by a registration:**

**`registrations`** — registration state
- `id`, `player_id` (FK), `season_id` (FK), `family_id`
- `status` (`new` | `submitted` | `pending` | `approved` | `rostered` | `waitlist` | `withdrawn` | `denied`)
- `submitted_at`, `approved_at`, `deny_reason`
- `waivers_accepted` (jsonb), `custom_answers` (jsonb), `registration_data` (jsonb)
- `signature_name`, `signature_date`, `registration_source`
- Uniqueness: `UNIQUE(player_id, season_id)`

**`players`** — player profile (scoped to a season via `season_id`)
- `id`, `organization_id`, `season_id`
- Player + parent + emergency + medical + address + waiver fields
- A player record belongs to ONE season

**`payments`** — fee ledger
- `player_id`, `season_id`, `registration_id`, `family_email`
- `amount`, `fee_type`, `fee_name`, `fee_category`, `auto_generated`, `paid`
- No cascade delete from registrations

**Relationships:**
- 1:1 `registrations` ↔ `players` per season (enforced by unique constraint)
- 1:many `registrations` → `payments` (via `registration_id` + `player_id+season_id`)
- Siblings linked by `family_id` on registration + `parent_email` on player

### Cascade Impact — What Changes When `season_id` Changes

| Table | Impact | Required Action |
|-------|--------|-----------------|
| `players.season_id` | Player record scoped to old season | **UPDATE to new season_id** |
| `registrations.season_id` | Registration points to old season | **UPDATE to new season_id** |
| `payments` (auto_generated=true) | Orphaned — tied to old season/fees | **DELETE and regenerate from new season config** |
| `payments` (auto_generated=false) | Custom fees admin added manually | Keep (admin intent) or prompt |
| `team_players` | Roster slot on old season's team | **DELETE** (coach can re-add on new season) |
| `event_rsvps` | RSVPs to old season events | **DELETE** old-season RSVPs |
| `waiver_signatures` | Signed old season's waivers | Keep (audit trail); new waivers can be re-collected |
| `game_stats`, `game_lineups` | Historical game data | Keep (historical record) |

**No cascade FK constraints observed** in Supabase query code → we can safely delete/update manually. No hard blockers.

### Minimum Safe Transfer Sequence

```javascript
// Pseudocode — would live in src/lib/registration-transfer.js
async function transferRegistration(registrationId, newSeasonId) {
  1. Validate: new season exists in same org; player not already registered in new season;
               current status is not 'denied' or 'withdrawn'
  2. DELETE FROM payments WHERE registration_id = :regId AND auto_generated = true
  3. DELETE FROM team_players WHERE player_id = :playerId
  4. DELETE FROM event_rsvps WHERE player_id = :playerId
       AND event_id IN (SELECT id FROM schedule_events WHERE season_id = :oldSeasonId)
  5. UPDATE registrations SET season_id = :newSeasonId WHERE id = :regId
  6. UPDATE players SET season_id = :newSeasonId WHERE id = :playerId
  7. If status in ('approved', 'rostered'):
       generateFeesForPlayer(supabase, player, newSeason, showToast)
}
```

### Season Query for Transfer Dropdown

Seasons table has `name`, `program_id`, `sport_id`, `status`, `start_date`, `end_date`, `organization_id`.

```javascript
const { data } = await supabase
  .from('seasons')
  .select('id, name, program_id, sport_id, start_date, end_date, status, sports(name, icon), programs(name, icon)')
  .eq('organization_id', organizationId)
  .neq('id', currentSeasonId)
  .in('status', ['active', 'upcoming'])
  .order('start_date', { ascending: false })
```

Group dropdown by program name in UI. Display label format: `"🏐 Volleyball — Spring 2026 (Jan 15 – Apr 30)"`.

### Fee Recalculation

Fee structure is defined on the season row: `fee_registration`, `fee_uniform`, `fee_monthly`, `fee_per_family`, `months_in_season`, discount fields. Logic is already centralized in `src/lib/fee-calculator.js`.

**Approach:** Delete old auto-generated fees, call `generateFeesForPlayer()` for the new season. No Stripe refunds needed (we are moving the registration, not refunding payments).

**Edge cases to handle in Phase 2:**
- Parent has already paid some fees → recommend "hold transfer until refunded" OR preserve paid fees as credit (out of scope for v1)
- Sibling discount must recompute based on siblings in the new season

### Transfer Button Placement

**File:** `src/pages/registrations/PlayerDossierPanel.jsx:182-200` — actions section near Approve/Deny/Edit buttons.

Recommended addition (below Edit button, gated to pending/approved statuses):
```jsx
{canTransfer && (
  <button onClick={() => onTransfer?.(player, registration)}
    className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-[#4BB9EC]/10 text-[#4BB9EC] border border-[#4BB9EC]/20 hover:bg-[#4BB9EC]/20 flex items-center justify-center gap-1.5 transition">
    <GitBranch className="w-3.5 h-3.5" /> Transfer Season
  </button>
)}
```

### Estimated Complexity

| File | Status | LOC |
|------|--------|-----|
| `src/pages/registrations/TransferModal.jsx` | NEW | ~250 |
| `src/lib/registration-transfer.js` | NEW | ~150 |
| `src/pages/registrations/RegistrationsPage.jsx` | Modify | +80 |
| `src/pages/registrations/PlayerDossierPanel.jsx` | Modify | +25 |
| *(optional)* audit column migration | Migration | 1 line |

**Total:** ~500 LOC across 4-5 files. **No DB migration required** for v1.

### Risk Flags

- **HIGH:** Race condition if admin clicks Approve while another admin transfers. Mitigation: lock registration status during transfer.
- **MEDIUM:** Sibling discount miscalculation if sibling set differs between seasons. Mitigation: call `calculateFeesForPlayer` with fresh sibling count in new season.
- **LOW:** Coach loses team assignment. Mitigation: toast message "Player removed from old team — please add to new season roster."

---

## ISSUE 3 — Payment-Gated Approval

### Verdict: ❌ NOT IMPLEMENTED — Feature to build

Three workflow modes need to be supported per season:

| Mode | Flow | Gate | Fee Generation Timing |
|------|------|------|----------------------|
| `open` (current default) | Register → Approve → Pay → Roster | None | On approval |
| `pay_first` | Register → Pay → Approve → Roster | Approve disabled until fees paid | **On registration submit** |
| `tryout_first` | Register → Approve → Roster → Pay | None | **On team assignment** |

### Current Approval Flow

**File:** `src/pages/registrations/RegistrationsPage.jsx:127-229` (single) + `:269-346` (bulk)

```jsx
async function updateStatus(playerId, regId, newStatus) {
  if (newStatus === 'approved' && selectedSeason) {
    // 1. Fetch player with registrations
    const { data: playerData } = await supabase.from('players')
      .select('*, registrations(*)').eq('id', playerId).single()
    // 2. Generate fees (ALWAYS — no conditional)
    const result = await generateFeesForPlayer(supabase, playerData, selectedSeason, null)
    // 3. Update registration.status -> 'approved'
    await supabase.from('registrations').update({
      status: 'approved', approved_at: new Date().toISOString()
    }).eq('id', regId)
    // 4. Send approval email + baton-pass push notification
  }
}
```

**No pre-approval checks exist today** — no payment check, no waiver check, no required-field check. Approve is always enabled.

### Season Settings Structure

`seasons` table already has a `settings` (jsonb) column (per `DATABASE_SCHEMA.md:58`) but it is undocumented and unused in the current codebase.

**Recommendation:** Dedicated `approval_mode` column on `seasons` for explicitness and query speed:
```sql
ALTER TABLE seasons
  ADD COLUMN approval_mode TEXT DEFAULT 'open'
  CHECK (approval_mode IN ('open', 'pay_first', 'tryout_first'));
```

**Alternative (no migration):** Store as `settings.approval_mode` in JSONB. Slightly slower queries but avoids any ALTER TABLE.

### Season Form UI

**File:** `src/pages/settings/SeasonFormModal.jsx` currently has tabs: `basic`, `fees`.

Add an "Approval" section (or extend basic tab) with 3 radio options:
- Open — approve anytime
- Pay First — require payment before approval
- Tryout First — approve first, generate fees at roster assignment

### Payment Status Check — Does Not Exist

**No utility function** exists to check "has player paid registration fee". Build a new helper:

```javascript
// NEW: src/lib/payment-checker.js
export async function getPlayerPaymentStatus(supabase, playerId, seasonId) {
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, paid')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .eq('auto_generated', true)   // ignore custom fees for gating
  if (!payments?.length) return { hasFees: false, totalOwed: 0, amountPaid: 0, fullyPaid: false }
  const totalOwed = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const amountPaid = payments.filter(p => p.paid).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  return {
    hasFees: totalOwed > 0,
    totalOwed,
    amountPaid,
    fullyPaid: amountPaid >= totalOwed && totalOwed > 0,
    unpaidAmount: Math.max(0, totalOwed - amountPaid)
  }
}
```

Similar math already exists scattered in `PaymentsPage.jsx:41-50` (`classifyFamily`). Centralize in the helper.

### Conditional Approval Logic

**Mode `open` (current):** No changes. Fees generated on approval.

**Mode `pay_first`:**
1. Generate fees on registration submit (`src/pages/public/PublicRegistrationPage.jsx` + `RegistrationCartPage.jsx` after the registration insert succeeds)
2. In `RegistrationsPage.updateStatus`, before approving: call `getPlayerPaymentStatus`; if not fully paid, block approval
3. In `RegistrationsTable.jsx` and `PlayerDossierPanel.jsx`: render Approve as disabled with "Payment required: $X" label

**Mode `tryout_first`:**
1. In `RegistrationsPage.updateStatus`: when `approval_mode === 'tryout_first'`, SKIP `generateFeesForPlayer` — only update status to approved
2. Update approval email template to say "Fees will be assigned when your child makes the team"
3. At team assignment (`src/pages/teams/TeamsPage.jsx` — roster add handler, OR `team_players` insert path), trigger `generateFeesForPlayer` if season mode is `tryout_first` and fees don't yet exist

Fee generation is already idempotent — `generateFeesForPlayer` checks for existing fees and returns `{ skipped: true }` if found (`src/lib/fee-calculator.js:248-260`). Safe to call multiple times.

### Estimated Complexity

| File | Status | LOC |
|------|--------|-----|
| `src/lib/payment-checker.js` | NEW | ~50 |
| `src/pages/settings/SeasonsPage.jsx` + `SeasonFormModal.jsx` | Modify | +60 (form + approval tab) |
| `src/pages/registrations/RegistrationsPage.jsx` | Modify | +80 (conditional in updateStatus + bulk) |
| `src/pages/registrations/RegistrationsTable.jsx` | Modify | +40 (Approve button state) |
| `src/pages/registrations/PlayerDossierPanel.jsx` | Modify | +30 (Approve button state) |
| `src/pages/public/PublicRegistrationPage.jsx` + `RegistrationCartPage.jsx` | Modify | +60 (pay_first fee gen at submit) |
| `src/pages/teams/TeamsPage.jsx` | Modify | +40 (tryout_first fee gen at roster add) |
| DB migration | 1 `ALTER TABLE` | 1 SQL |

**Total:** ~360 LOC across 7 files + 1 migration (or 0 migrations if we use `settings` JSONB).

### Risk Flags

- **HIGH:** `pay_first` mode needs fees to exist BEFORE approval — this requires generating fees at registration submit, which changes the parent's experience (they see fees immediately). Must update parent-facing messaging on the public registration confirmation page.
- **MEDIUM:** `tryout_first` requires a team-assignment hook that currently may not exist. Confirm where players get added to `team_players` and insert fee-gen call there.
- **LOW:** Mixing modes within one org is fine (mode is per-season) but admin needs clear UI labels so they don't confuse themselves.

---

## FEASIBILITY ASSESSMENT

### Can It Ship Without DB Migrations?

| Issue | Migration Needed? | Alternative |
|-------|-------------------|-------------|
| 1 | ❌ No | N/A (already works) |
| 2 | ❌ No | Optional `transferred_from_season_id` audit column — can skip for v1 |
| 3 | ⚠️ 1 `ALTER TABLE` recommended | Store `approval_mode` in existing `seasons.settings` JSONB to ship zero-migration |

### Can All Three Ship in One Spec?

**Yes.** They touch completely separate code paths:
- Issue 1 — no code change
- Issue 2 — registrations pages + new transfer lib
- Issue 3 — seasons form + registrations logic + team roster + new payment-checker lib

Only overlap: both Issue 2 and Issue 3 call `generateFeesForPlayer()`. That function is already idempotent and battle-tested.

### Recommended Build Order

1. **Issue 1** — **Zero work**. QA only. Confirm with Marisa that her scenario matches: she added a fee, selected the correct player, and viewed the correct season afterwards. If still broken, re-open with a repro.
2. **Issue 3 — Payment-gated approval** — Medium complexity. Gives the approval-mode infrastructure other features can lean on.
3. **Issue 2 — Registration transfer** — Medium complexity. Reuses `generateFeesForPlayer` (already idempotent thanks to existing checks).

Rationale: Issue 3 establishes the "when are fees generated" decision tree. Issue 2 then uses the same regeneration path cleanly.

### Overall Risk Flags

- **CROSS-ISSUE:** Make sure Issue 3's `tryout_first` fee-generation hook does NOT fire a second time when Issue 2's transfer happens. Since `generateFeesForPlayer` is idempotent (checks `existingFees` at `fee-calculator.js:248`), this is a soft risk — but add a test case.
- **PARENT EXPERIENCE:** Issue 3 `pay_first` + Issue 2 transfer can surprise parents (fees appear at different moments). Add an email template for each scenario.
- **NO SCHEMA DRIFT:** None of these changes touch tables that mobile reads differently. Mobile will pick up `approval_mode` naturally via the existing `seasons` query `select('*')`.

---

## APPENDIX — Key File References

**Issue 1:**
- `src/pages/payments/PaymentsModals.jsx:221-280` — `AddFeeModal`
- `src/pages/payments/PaymentsPage.jsx:310-326` — insert handler
- `src/pages/payments/PaymentsPage.jsx:217-247` — admin payment query
- `src/pages/parent/ParentPaymentsPage.jsx:55-59` — parent payment query
- `src/lib/fee-calculator.js:42-51` — auto-generated fee shape

**Issue 2:**
- `src/pages/registrations/RegistrationsPage.jsx:84-115` — load registrations
- `src/pages/registrations/PlayerDossierPanel.jsx:182-200` — action buttons (Transfer button goes here)
- `src/pages/public/RegistrationCartPage.jsx:1525-1548` — registration insert (source of truth for fields)
- `src/lib/fee-calculator.js:243-357` — `generateFeesForPlayer` (idempotent, reusable)
- `DATABASE_SCHEMA.md:48-59` — seasons schema

**Issue 3:**
- `src/pages/registrations/RegistrationsPage.jsx:127-178` — single approve handler
- `src/pages/registrations/RegistrationsPage.jsx:269-296` — bulk approve handler
- `src/pages/settings/SeasonsPage.jsx:36-53` — season form state (add `approval_mode` here)
- `src/pages/settings/SeasonFormModal.jsx` — season edit UI
- `src/lib/fee-calculator.js:243-266` — fee generation entry point (idempotent)
- `src/pages/payments/PaymentsPage.jsx:41-50` — existing `classifyFamily` math pattern
