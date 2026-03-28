# CC-REGISTRATIONS-FINAL-ADJUSTMENTS.md
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

Final adjustments to registrations page:
1. Move filter tabs (All/Pending/Approved/etc.) from inside RegistrationsTable to the action bar row in RegistrationsPage (above both columns)
2. Add parent name as its own visible column in the list (not subtext under player name)
3. Expand PlayerDossierPanel to show full profile info (player details, parent/guardian, emergency contact, medical, school, waivers, payment, contact) — replaces the modal
4. Remove "View Full Profile" button. The dossier IS the full profile.
5. Show player photo in dossier if available

**Files touched:**
- `src/pages/registrations/RegistrationsPage.jsx` (Phase 1)
- `src/pages/registrations/RegistrationsTable.jsx` (Phase 1)
- `src/pages/registrations/PlayerDossierPanel.jsx` (Phase 2)

---

## PHASE 1 — Move Filters to Action Bar + Fix List Layout

### File: `src/pages/registrations/RegistrationsPage.jsx`

**Change 1: Add filter tabs to the action bar.**

Find the action bar section. It currently looks like:

```jsx
      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
```

Replace the entire action bar `<div>` block with:

```jsx
      {/* Action bar + filter tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/[0.06] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <button onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'table' ? (isDark ? 'bg-white/[0.1] text-white' : 'bg-[#F5F6F8] text-[#10284C]') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
            <Table className="w-3.5 h-3.5" /> Table
          </button>
          <button onClick={() => setViewMode('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'analytics' ? (isDark ? 'bg-white/[0.1] text-white' : 'bg-[#F5F6F8] text-[#10284C]') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>
        <button onClick={() => exportToCSV(filteredRegs, 'registrations', csvColumns)}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${isDark ? 'bg-white/[0.06] text-slate-300 border border-white/[0.06]' : 'bg-white text-[#10284C] border border-[#E8ECF2]'}`}>
          <FileDown className="w-3.5 h-3.5" /> Export
        </button>
        {statusCounts.pending > 0 && (
          <button onClick={bulkApproveAllPending} disabled={bulkProcessing}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#22C55E] text-white hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 transition">
            <Check className="w-3.5 h-3.5" /> Approve All ({statusCounts.pending})
          </button>
        )}

        {/* Status filter tabs — moved from table */}
        <div className={`ml-auto flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          {[
            { key: 'all', label: 'All', count: statusCounts.all },
            { key: 'pending', label: 'Pending', count: statusCounts.pending },
            { key: 'approved', label: 'Approved', count: statusCounts.approved },
            { key: 'rostered', label: 'Rostered', count: statusCounts.rostered },
            { key: 'waitlist', label: 'Waitlist', count: statusCounts.waitlist },
            { key: 'denied', label: 'Denied', count: statusCounts.denied },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                statusFilter === f.key
                  ? (isDark ? 'bg-white/[0.1] text-white' : 'bg-[#F5F6F8] text-[#10284C] shadow-sm')
                  : (isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-[#10284C]')
              }`}
            >
              {f.label}
              {f.count > 0 && <span className="ml-1 opacity-60">{f.count}</span>}
            </button>
          ))}
        </div>
      </div>
```

### File: `src/pages/registrations/RegistrationsTable.jsx`

**Change 2: Remove filter tabs from RegistrationsTable.**

Find the filter bar inside the card (around lines 152-194). This is the section containing the search input and the filter chips, wrapped in a `<div className={...cardBg...}>`. Remove the filter chips container but KEEP the search input.

Replace the entire filter bar section (from the `<div className={...cardBg...}>` containing search + filter chips through its closing `</div>`) with just the search + bulk bar:

```jsx
      {/* Search */}
      <div className={`relative max-w-sm`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search players or parents..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none ${
            isDark
              ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder:text-slate-500 focus:border-[#4BB9EC]/30'
              : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'
          }`}
          style={{ fontFamily: 'var(--v2-font)' }}
        />
      </div>
```

**Change 3: Update list rows to show parent name as its own column.**

In the same file, find the list row rendering. Replace the `{/* Name + parent */}` section:

```jsx
                  {/* Name + parent */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold truncate block ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                      {player.first_name} {player.last_name}
                    </span>
                    <span className={`text-xs truncate block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {player.parent_name || 'No parent'}
                      {player.grade ? ` · Gr ${player.grade}` : ''}
                    </span>
                  </div>
```

With:

```jsx
                  {/* Player name */}
                  <div className="w-[160px] min-w-0 shrink-0">
                    <span className={`text-sm font-semibold truncate block ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                      {player.first_name} {player.last_name}
                    </span>
                    <span className={`text-[10px] truncate block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {player.grade ? `Gr ${player.grade}` : ''}
                    </span>
                  </div>

                  {/* Parent name */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs truncate block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {player.parent_name || '—'}
                    </span>
                  </div>
```

### Commit message
```
refactor(registrations): move filter tabs to action bar, add parent name column to list
```

---

## PHASE 2 — Expand PlayerDossierPanel to Full Profile

### File: `src/pages/registrations/PlayerDossierPanel.jsx`

**Replace the entire file contents with:**

```jsx
import { Check, X, Edit } from 'lucide-react'

function calculateAge(birthDate) {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function InfoRow({ label, value, isDark }) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{value || '—'}</span>
    </div>
  )
}

function SectionLabel({ children, isDark }) {
  return (
    <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 mt-4 first:mt-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{children}</h4>
  )
}

function WaiverRow({ label, signed, isDark }) {
  return (
    <div className={`flex items-center justify-between py-1.5`}>
      <span className={`text-xs font-semibold ${signed ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
        {label}
      </span>
      <span className={`text-[10px] font-bold uppercase ${signed ? 'text-emerald-500' : 'text-red-500'}`}>
        {signed ? 'Signed' : 'Missing'}
      </span>
    </div>
  )
}

export default function PlayerDossierPanel({ player, registration, onClose, onApprove, onDeny, onEdit, isDark }) {
  if (!player) return null

  const reg = registration || player.registrations?.[0]
  const isPending = ['submitted', 'pending', 'new'].includes(reg?.status)
  const age = calculateAge(player.birth_date || player.dob)
  const dob = (player.birth_date || player.dob)
    ? new Date((player.birth_date || player.dob) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const statusDisplay = isPending ? 'Pending' :
    reg?.status === 'approved' ? 'Approved' :
    reg?.status === 'rostered' ? 'Rostered' :
    reg?.status === 'waitlist' ? 'Waitlist' :
    reg?.status === 'withdrawn' ? 'Denied' : reg?.status || 'Unknown'

  const statusColor = isPending ? 'bg-amber-500/12 text-amber-500' :
    reg?.status === 'approved' ? 'bg-emerald-500/12 text-emerald-500' :
    reg?.status === 'rostered' ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' :
    reg?.status === 'waitlist' ? 'bg-amber-500/12 text-amber-500' :
    reg?.status === 'withdrawn' ? 'bg-red-500/12 text-red-500' : 'bg-slate-500/12 text-slate-400'

  const registeredDate = reg?.created_at
    ? new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className={`sticky top-4 rounded-2xl border overflow-hidden flex flex-col max-h-[calc(100vh-220px)] ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}
      style={{ fontFamily: 'var(--v2-font)' }}>

      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between bg-[#10284C] shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70">Player Profile</span>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Player identity */}
      <div className={`px-5 py-4 flex items-center gap-4 border-b shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        {player.photo_url ? (
          <img src={player.photo_url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${isDark ? 'bg-[#4BB9EC]/10 text-[#4BB9EC]' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'}`}>
            {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {player.first_name} {player.last_name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>{statusDisplay}</span>
            {registeredDate && <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Registered {registeredDate}</span>}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-3">

        <SectionLabel isDark={isDark}>Player Information</SectionLabel>
        <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
          <InfoRow label="Date of Birth" value={dob} isDark={isDark} />
          <InfoRow label="Age" value={age} isDark={isDark} />
          <InfoRow label="Grade" value={player.grade} isDark={isDark} />
          <InfoRow label="Gender" value={player.gender} isDark={isDark} />
          <InfoRow label="School" value={player.school} isDark={isDark} />
          <InfoRow label="Experience" value={player.experience_level} isDark={isDark} />
          <InfoRow label="Jersey #" value={player.jersey_number} isDark={isDark} />
          <InfoRow label="Jersey Pref" value={[player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean).join(', ') || null} isDark={isDark} />
          <InfoRow label="Jersey Size" value={player.uniform_size_jersey} isDark={isDark} />
          <InfoRow label="Shorts Size" value={player.uniform_size_shorts} isDark={isDark} />
          <InfoRow label="Position" value={player.position} isDark={isDark} />
        </div>

        <SectionLabel isDark={isDark}>Parent / Guardian</SectionLabel>
        <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
          <InfoRow label="Name" value={player.parent_name} isDark={isDark} />
          <InfoRow label="Email" value={player.parent_email} isDark={isDark} />
          <InfoRow label="Phone" value={player.parent_phone} isDark={isDark} />
          <InfoRow label="Phone 2" value={player.parent_phone_secondary} isDark={isDark} />
          <InfoRow label="Address" value={[player.address, player.city, player.state, player.zip].filter(Boolean).join(', ') || null} isDark={isDark} />
        </div>

        <SectionLabel isDark={isDark}>Emergency Contact</SectionLabel>
        <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
          <InfoRow label="Name" value={player.emergency_contact_name} isDark={isDark} />
          <InfoRow label="Phone" value={player.emergency_contact_phone} isDark={isDark} />
          <InfoRow label="Relation" value={player.emergency_contact_relation} isDark={isDark} />
        </div>

        <SectionLabel isDark={isDark}>Medical</SectionLabel>
        <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
          <InfoRow label="Conditions" value={player.medical_conditions || player.medical_notes} isDark={isDark} />
          <InfoRow label="Allergies" value={player.allergies} isDark={isDark} />
          <InfoRow label="Medications" value={player.medications} isDark={isDark} />
        </div>

        <SectionLabel isDark={isDark}>Waivers</SectionLabel>
        <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
          <WaiverRow label="Liability Waiver" signed={player.waiver_liability} isDark={isDark} />
          <WaiverRow label="Photo Release" signed={player.waiver_photo} isDark={isDark} />
          <WaiverRow label="Code of Conduct" signed={player.waiver_conduct} isDark={isDark} />
        </div>

        <SectionLabel isDark={isDark}>Payment</SectionLabel>
        <div className={`rounded-lg p-3 ${isDark ? 'bg-[#10284C]' : 'bg-[#10284C]'}`}>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Total</span>
            <span className="text-lg font-black text-white">
              {reg?.registration_fee ? `$${reg.registration_fee}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`px-5 py-3 border-t shrink-0 space-y-2 ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
        {isPending && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onApprove}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-[#22C55E] text-white hover:brightness-110 flex items-center justify-center gap-1.5 transition">
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={onDeny}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center gap-1.5 transition">
              <X className="w-3.5 h-3.5" /> Deny
            </button>
          </div>
        )}
        <button onClick={onEdit}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-slate-200'
          }`}>
          <Edit className="w-3.5 h-3.5" /> Edit Player
        </button>
      </div>
    </div>
  )
}
```

### What changed:
- **Photo** shows if player has `photo_url`, otherwise initials avatar
- **Full profile info** replaces the abbreviated dossier: all player fields, parent/guardian with address, emergency contact, medical info, waivers, payment
- **Compact layout** using `InfoRow` component (label left, value right) instead of big grid cards that stretch across full width
- **"View Full Profile" button removed** -- this panel IS the full profile
- **`onViewFull` prop removed** from the component signature
- **Sections use divider rows** not padded card grids

### Also update RegistrationsPage.jsx to stop passing `onViewFull`:

Find in RegistrationsPage.jsx:

```jsx
              onViewFull={() => { setSelectedPlayer(dossierPlayer); setEditMode(false) }}
```

Remove that line.

### Commit message
```
refactor(registrations): expand dossier to full profile, compact InfoRow layout, remove View Full Profile
```

---

## POST-EXECUTION QA CHECKLIST

1. **Action bar:** Table | Analytics | Export | Approve All on the left. All | Pending | Approved | Rostered | Waitlist | Denied on the right. All in one row.
2. **List rows:** Checkbox, avatar, player name (with grade below), parent name (separate column), status badge, inline approve/deny for pending.
3. **Search:** Above the list, not inside a card wrapper.
4. **Detail panel:** Full player profile. Player photo (if exists). Player info, parent/guardian, emergency contact, medical, waivers, payment. Compact `InfoRow` layout (label left, value right).
5. **No "View Full Profile" button.** Edit Player button only.
6. **Approve/Deny buttons** in dossier footer for pending registrations.
7. **Filter tabs** change the list content. Detail panel stays if a player is selected.
8. **Info isn't stretched** across the full width. Label-value pairs are compact rows.
