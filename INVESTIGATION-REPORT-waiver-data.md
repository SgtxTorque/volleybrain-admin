# INVESTIGATION REPORT: Waiver Data Verification
**Date:** 2026-04-12
**Branch:** main

## Waiver Collection (Registration Form)

### Waivers Collected

Waivers are **configurable per organization** via `registration_templates.waivers` (JSONB column). The DEFAULT_CONFIG (in `registrationConstants.jsx:27`) defines three built-in waivers:

| Waiver | Key | State Variable | Required? | Type |
|--------|-----|---------------|-----------|------|
| Liability Waiver | `liability` | `waiverState.liability` | Yes (default) | checkbox boolean |
| Photo/Video Release | `photo_release` | `waiverState.photo_release` | No (default) | checkbox boolean |
| Code of Conduct | `code_of_conduct` | `waiverState.code_of_conduct` | No (default) | checkbox boolean |

- State: `const [waiverState, setWaiverState] = useState({})` (PublicRegistrationPage.jsx:34)
- Initialized dynamically from the resolved config at load time (lines 380-385) — all enabled waivers start as `false`
- Admins can customize waiver titles, text, enable/disable, and mark as required via `RegistrationTemplateModal.jsx` (Settings > Registration Forms)
- Waiver keys are dynamic — they come from the template, not hardcoded. The mapping to boolean columns uses fuzzy matching (see below)

### Electronic Signature
- **Field:** `const [signature, setSignature] = useState('')` (PublicRegistrationPage.jsx:36)
- **Validation:** Must be non-empty if any waivers are enabled: `if (hasEnabledWaivers && !signature.trim()) throw new Error('Please sign by typing your full name')` (line 585)
- **UI:** Rendered via `WaiversCard` component (RegistrationScreens.jsx:13-90) — typed name with cursive font, timestamp display, confirmation message
- **Stored as:** Plain text (`signature_name`) + ISO timestamp (`signature_date`)

## Waiver Storage (Database)

### How It's Saved — TWO locations (redundant storage)

Waiver data is saved to **both** the `players` table AND the `registrations` table on every registration submit.

#### 1. Players Table (boolean columns)
**Table:** `players`
**Columns (from schema):**
| Column | Type | Description |
|--------|------|-------------|
| `waiver_liability` | boolean | Liability waiver signed |
| `waiver_photo` | boolean | Photo release signed |
| `waiver_conduct` | boolean | Code of conduct signed |
| `waiver_signed` | boolean | Any waiver signed |
| `waiver_signed_by` | text | Electronic signature (typed name) |
| `waiver_signed_date` | timestamp | When signature was given |

**How the booleans are derived** (PublicRegistrationPage.jsx:662-667, RegistrationCartPage.jsx:1374-1378):
```javascript
const waiverEntries = Object.entries(waiverState || {})
const waiverLiability = waiverEntries.some(([k, v]) => v === true && (k.includes('liability') || k === 'waiver_liability'))
const waiverPhoto = waiverEntries.some(([k, v]) => v === true && (k.includes('photo') || k === 'photo_release'))
const waiverConduct = waiverEntries.some(([k, v]) => v === true && (k.includes('conduct') || k === 'code_of_conduct'))
const waiverAnySigned = Object.values(waiverState || {}).some(v => v === true)
```
Uses fuzzy key matching to map dynamic template keys to fixed boolean columns.

#### 2. Registrations Table (JSONB + text columns)
**Table:** `registrations`
**Columns (from schema):**
| Column | Type | Description |
|--------|------|-------------|
| `waivers_accepted` | jsonb | Full waiver state object (e.g. `{"liability": true, "photo_release": false, "code_of_conduct": true}`) |
| `signature_name` | text | Electronic signature (typed name) |
| `signature_date` | timestamp with time zone | When signature was given |
| `signature_ip` | text | IP address (column exists but NOT populated by web code) |
| `registration_data` | jsonb | Full blob including `waivers`, `signature`, `player`, `shared` data |

### Example Payload — Players Insert (lines 715-721)
```javascript
{
  waiver_liability: true,        // boolean
  waiver_photo: false,           // boolean
  waiver_conduct: true,          // boolean
  waiver_signed: true,           // boolean (any signed)
  waiver_signed_by: "Jane Smith", // text (typed signature)
  waiver_signed_date: "2026-04-12T15:30:00.000Z"  // timestamp
}
```

### Example Payload — Registrations Insert (lines 762-768)
```javascript
{
  waivers_accepted: { liability: true, photo_release: false, code_of_conduct: true },  // jsonb
  signature_name: "Jane Smith",    // text
  signature_date: "2026-04-12T15:30:00.000Z",  // timestamp
  registration_data: {
    player: { /* child data */ },
    shared: { /* parent/guardian data */ },
    waivers: { liability: true, photo_release: false, code_of_conduct: true },
    custom_questions: [ /* answers */ ],
    signature: { name: "Jane Smith", date: "2026-04-12T15:30:00.000Z" }
  }
}
```

### Both Registration Pages Use Same Pattern
| Page | Source Tag | Waiver Storage | Confirmed |
|------|-----------|---------------|-----------|
| PublicRegistrationPage.jsx | `registration_source: 'public_form'` | Players booleans + Registrations JSONB | YES (lines 715-721, 762-768) |
| RegistrationCartPage.jsx | `registration_source: 'shopping_cart'` | Players booleans + Registrations JSONB | YES (lines 1414-1419, 1459-1469) |

## Admin Visibility

### Where Admins Can See Waiver Status

| Location | Component | What's Shown | Detail Level |
|----------|-----------|-------------|-------------|
| Registration list (stat row) | `RegistrationsStatRow.jsx:59-62` | "Waivers Signed: X" with percentage | Aggregate count only |
| Registration list (table) | `RegistrationsTable.jsx:34` WaiverChip | Signed/Partial/Unsigned chip | **DEAD CODE — defined but never rendered in table rows** |
| Player dossier (side panel) | `PlayerDossierPanel.jsx:157-160` | Liability: Signed/Missing, Photo: Signed/Missing, Conduct: Signed/Missing | Per-waiver row with color coding |
| Player detail modal | `PlayerDetailModal.jsx:406-427` | WaiverBadge for each waiver + "Signed by {name} on {date}" | Per-waiver badge + signature text + date |
| CSV export (registrations) | `RegistrationsPage.jsx:42-44` | Liability Waiver: Yes/No, Photo Waiver: Yes/No, Conduct Waiver: Yes/No | Columns in CSV export |
| CSV export (coaches) | `dataExportFunctions.jsx:121-126` | Waiver Signed: Yes/No, Code of Conduct: Yes/No | Columns in CSV export |

### Can Admin See:
- **Which waivers were signed?** YES — PlayerDossierPanel shows per-waiver rows (Liability, Photo, Conduct). PlayerDetailModal shows badges from `waivers_accepted` JSONB or falls back to player boolean columns.
- **Electronic signature text?** YES — PlayerDetailModal shows "Signed by {name} on {date}" (lines 420-426). Uses `reg.signature_name` or `player.waiver_signed_by`.
- **Timestamp of signing?** YES — PlayerDetailModal shows the date from `reg.signature_date` or `player.waiver_signed_date` (lines 423-424).
- **Whether ALL required waivers are complete?** PARTIAL — RegistrationsStatRow shows a count/percentage. The stat calculation considers a player "signed" if `waiver_liability && waiver_conduct` are both true, OR if all `waivers_accepted` values are true, OR if `signature_name` exists (lines 415-424). Photo is NOT required in the stat calculation.

## Waiver Management System

### Admin Waiver Template System (WaiversPage)
- **Location:** Settings > Waivers (`/settings/waivers`)
- **Database tables:** `waiver_templates`, `waiver_signatures`, `waiver_edit_history`, `waiver_sends`
- **Features:**
  - Create/edit/delete custom waiver templates
  - Types: Standard, Sport-Specific, Ad-Hoc
  - Per-sport waiver support
  - Version history with edit tracking
  - Signature tracking (signed/unsigned counts)
  - Send ad-hoc waivers to specific players
  - Preview modal
  - Drag to reorder
  - Filter by type, sport, active/inactive status
  - Three views: Templates, Signatures, Send History
  - Tip banner: "Link to Registration" via Registration Forms page
  - Fallback to legacy waivers from `organization.settings.waivers` if `waiver_templates` table doesn't exist

### Registration Template Waivers (Inline)
- **Location:** Settings > Registration Forms (`RegistrationTemplateModal.jsx`)
- **These are the waivers parents see during registration** — stored in `registration_templates.waivers` JSONB
- Admins can toggle enable/disable, set required/optional, edit title and text
- Default: 3 waivers (Liability, Photo Release, Code of Conduct)

### Two Waiver Systems — Slight Disconnect
There are effectively **two separate waiver systems**:
1. **Registration-time waivers** — defined in `registration_templates.waivers`, checked during form submission, stored as booleans on `players` + JSONB on `registrations`
2. **Standalone waiver templates** — defined in `waiver_templates` table, managed in WaiversPage, can be sent ad-hoc, tracked in `waiver_signatures` with full audit trail

The registration-time waivers do NOT write to `waiver_signatures` table. The WaiversPage system does NOT read from `players.waiver_*` columns. They operate independently.

## Parent Visibility

### Parent-Facing Waiver Views
| Location | Component | What's Shown |
|----------|-----------|-------------|
| Parent Priority Cards | `PriorityCardsEngine.jsx:83-107` | "Unsigned waivers" action card (reads from `waiver_templates` + `waiver_signatures`) |
| Player Profile Waivers | `PlayerProfileWaivers.jsx` | Per-waiver sign/view buttons, waiver content modal, status tracking |
| My Stuff > Waivers tab | `MyStuffPage.jsx:382` | Toast on waiver sign |
| Parent Registration Hub | `ParentRegistrationHub.jsx:148` | "Please sign all required waivers before submitting" validation |

## Gaps & Risks

### Legal/Compliance Gaps

1. **`signature_ip` column exists but is never populated** — The `registrations` table has a `signature_ip` column (text), but neither PublicRegistrationPage nor RegistrationCartPage writes to it. For legal compliance, IP address at time of electronic signature is often recommended.

2. **Registration waivers don't write to `waiver_signatures` audit table** — The full audit trail system (`waiver_signatures` with IP, user agent, version, revocation tracking) only works for waivers sent through the WaiversPage ad-hoc system. Registration-time waivers bypass this entirely and only store booleans + typed name.

3. **WaiverChip is dead code in RegistrationsTable** — The component is defined (line 34) but never actually rendered in the table. Admins only see waiver status when they click into a specific player (dossier panel or detail modal), not in the list view.

4. **Fuzzy key matching is fragile** — The mapping from dynamic template keys to boolean columns uses `.includes('liability')`, `.includes('photo')`, `.includes('conduct')`. If an admin creates a waiver with "photo" in the title that isn't actually a photo release, it would incorrectly set `waiver_photo = true`.

5. **Custom waivers beyond the three built-ins are only stored in JSONB** — If an admin adds a 4th waiver (e.g., "Concussion Awareness Agreement"), it's stored in `waivers_accepted` JSONB and `registration_data.waivers`, but there's no corresponding boolean column on `players`. The PlayerDossierPanel only shows the three hardcoded rows (Liability, Photo, Conduct), so the 4th waiver would only be visible in the PlayerDetailModal (which reads from `waivers_accepted` JSONB).

6. **No waiver content versioning in registration flow** — When a parent signs waivers during registration, only the boolean (agreed/not) and signature name are stored. The actual waiver TEXT they agreed to is not captured per-signature. If an admin changes waiver text after a parent signs, there's no record of what version the parent actually saw.

### Recommendations

1. **HIGH: Populate `signature_ip`** — Add `signature_ip: null` to registration inserts (or capture via a server-side function). Low effort, high legal value.

2. **HIGH: Bridge registration waivers to `waiver_signatures` table** — After registration submit, insert a `waiver_signatures` record for each signed waiver. This gives a proper audit trail with the full schema (signed_by_name, signed_by_email, signature_data, ip_address, user_agent, waiver_version, signed_at).

3. **MEDIUM: Render WaiverChip in RegistrationsTable** — The component exists and works. Adding `<WaiverChip player={player} />` to the table row would give admins waiver status at a glance without clicking into each player.

4. **LOW: Store waiver content snapshot** — When a parent signs, store the waiver text they agreed to (either in `registration_data` or in `waiver_signatures.previous_content`). This protects against post-signature waiver text changes.

5. **LOW: Handle custom waivers in PlayerDossierPanel** — Currently hardcodes three waiver rows. Should dynamically render from `registration.waivers_accepted` when available, similar to how PlayerDetailModal already does.

## Summary

| Aspect | Status | Risk |
|--------|--------|------|
| Waivers collected in form | YES — 3 default + configurable via templates | None |
| Waivers saved to database | YES — dual storage: `players` booleans + `registrations` JSONB | None |
| Admin can view waiver status | YES — dossier panel + detail modal + stat row + CSV export | LOW (WaiverChip dead in table view) |
| Electronic signature stored | YES — `signature_name` + `signature_date` on both tables | None |
| Audit trail exists | PARTIAL — `waiver_signatures` table exists with full audit fields, but registration-time waivers bypass it | MEDIUM (legal compliance gap) |
| IP address captured | NO — column exists (`signature_ip`) but never populated | MEDIUM (legal best practice) |
| Waiver content versioned | NO — only boolean + name stored, not the text agreed to | LOW (post-sign text changes untracked) |
| Custom waivers beyond 3 | PARTIAL — stored in JSONB, visible in detail modal, NOT in dossier panel | LOW |
