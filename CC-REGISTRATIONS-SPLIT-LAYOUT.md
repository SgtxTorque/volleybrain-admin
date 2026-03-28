# CC-REGISTRATIONS-SPLIT-LAYOUT.md
# Classification: EXECUTE
# Repo: SgtxTorque/volleybrain-admin
# Branch: main

---

## CRITICAL RULES

- **Change ONLY the files listed in each phase.**
- **Commit after each phase** with the exact commit message provided.
- After each phase, run verification checks as specified.
- If anything is unclear or a file doesn't match expected structure, STOP and report.

---

## OVERVIEW

Apply the Payments page treatment to Registrations:
- Stats move from left sidebar to compact horizontal row at top
- Table becomes a simple selection list (photo, name, parent, status badge) at fixed width
- Detail/dossier panel is always visible on the right with "Select a player" placeholder
- Waiver, contact, and actions columns removed from table (moved to detail panel)
- Status filter tabs stay above the list

**Files touched:**
- `src/pages/registrations/RegistrationsPage.jsx` (Phase 1 — layout restructure)
- `src/pages/registrations/RegistrationsTable.jsx` (Phase 2 — simplify to selection list)
- `src/pages/registrations/RegistrationsStatRow.jsx` (Phase 3 — compact horizontal)

---

## PHASE 1 — Restructure Page Layout

### File: `src/pages/registrations/RegistrationsPage.jsx`

**Replace the entire render section.** Find `// ========== RENDER ==========` (around line 366) and replace everything from `return (` to the final closing `)` of the return with:

```jsx
  return (
    <PageShell
      breadcrumb="Registrations"
      title="Registrations"
      subtitle={selectedSeason?.name || 'All Seasons'}
    >
      <div className="space-y-4" style={{ fontFamily: 'var(--v2-font)' }}>
      {/* Season filter */}
      <SeasonFilterBar />

      {/* Compact stat row (horizontal) */}
      <RegistrationsStatRow
        statusCounts={statusCounts}
        waiverStats={waiverStats}
        returningCount={returningCount}
        newCount={newCount}
      />

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
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
        {statusCounts.pending > 0 && (
          <button onClick={bulkApproveAllPending} disabled={bulkProcessing}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#22C55E] text-white hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 transition">
            <Check className="w-3.5 h-3.5" /> Approve All ({statusCounts.pending})
          </button>
        )}
        <button onClick={() => exportToCSV(filteredRegs, 'registrations', csvColumns)}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${isDark ? 'bg-white/[0.06] text-slate-300 border border-white/[0.06]' : 'bg-white text-[#10284C] border border-[#E8ECF2]'}`}>
          <FileDown className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <RegistrationAnalytics
          registrations={registrations}
          season={selectedSeason}
          statusCounts={statusCounts}
          showToast={showToast}
        />
      )}

      {/* Table View — 2-column split */}
      {viewMode === 'table' && (
        <div className="flex gap-5">
          {/* LEFT: Selection list */}
          <div className="w-[680px] shrink-0 min-w-0 overflow-y-auto max-h-[calc(100vh-300px)]">
            <RegistrationsTable
              registrations={registrations}
              filteredRegs={filteredRegs}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusCounts={statusCounts}
              selectedIds={selectedIds}
              toggleSelectAll={toggleSelectAll}
              toggleSelect={toggleSelect}
              onPlayerSelect={(p) => { setSelectedPlayer(p); setEditMode(false) }}
              onEditPlayer={(p) => { setSelectedPlayer(p); setEditMode(true) }}
              onApprove={(playerId, regId) => updateStatus(playerId, regId, 'approved')}
              onDeny={(player, reg) => setShowDenyModal({ player, reg })}
              onPromote={(playerId, regId) => updateStatus(playerId, regId, 'approved')}
              bulkApprove={bulkApprove}
              bulkDeny={bulkDeny}
              bulkMoveToWaitlist={bulkMoveToWaitlist}
              bulkExport={bulkExport}
              bulkProcessing={bulkProcessing}
              setShowBulkDenyModal={setShowBulkDenyModal}
              loading={loading}
              selectedPendingCount={selectedPendingCount}
              dossierPlayerId={dossierPlayer?.id}
              onRowSelect={setDossierPlayer}
            />
          </div>

          {/* RIGHT: Detail panel — always visible */}
          <div className="flex-1 min-w-0 hidden lg:block">
            {dossierPlayer ? (
              <PlayerDossierPanel
                player={dossierPlayer}
                registration={dossierPlayer.registrations?.[0]}
                onClose={() => setDossierPlayer(null)}
                onApprove={() => {
                  const reg = dossierPlayer.registrations?.[0]
                  if (reg) updateStatus(dossierPlayer.id, reg.id, 'approved')
                }}
                onDeny={() => {
                  const reg = dossierPlayer.registrations?.[0]
                  if (reg) setShowDenyModal({ player: dossierPlayer, reg })
                }}
                onEdit={() => { setSelectedPlayer(dossierPlayer); setEditMode(true) }}
                onViewFull={() => { setSelectedPlayer(dossierPlayer); setEditMode(false) }}
                isDark={isDark}
              />
            ) : (
              <div className={`rounded-2xl flex flex-col items-center justify-center sticky top-4 h-[calc(100vh-300px)] ${
                isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
              }`}>
                <span className="text-4xl mb-3">👈</span>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Select a Player</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Click a registration to view details
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player Detail/Edit Modal */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          editMode={editMode}
          onClose={() => { setSelectedPlayer(null); setEditMode(false) }}
          onUpdate={() => { loadRegistrations(); setSelectedPlayer(null); setEditMode(false) }}
          showToast={showToast}
        />
      )}

      {/* Deny Modal (single) */}
      {showDenyModal && (
        <DenyRegistrationModal
          player={showDenyModal.player}
          onClose={() => setShowDenyModal(null)}
          onDeny={(reason) => denyRegistration(showDenyModal.reg.id, reason)}
        />
      )}

      {/* Bulk Deny Modal */}
      {showBulkDenyModal && (
        <BulkDenyModal
          count={selectedIds.size}
          onClose={() => setShowBulkDenyModal(false)}
          onDeny={bulkDeny}
          processing={bulkProcessing}
        />
      )}
      </div>
    </PageShell>
  )
```

### Verification

- Stats are a horizontal row at top, not a sidebar
- Table is fixed 680px on the left
- Detail panel fills remaining space on the right
- "Select a Player" placeholder when nothing is selected
- Analytics view still works when toggled
- All modals still work

### Commit message
```
refactor(registrations): split layout — stats on top, selection list left, detail panel right
```

---

## PHASE 2 — Simplify Table to Selection List

### File: `src/pages/registrations/RegistrationsTable.jsx`

**Replace the entire table rendering.** Find the `<table>` element and everything inside it (the `<thead>` and `<tbody>`). This starts around line 195 after the filter/search bar. Replace from `<div className={...}>` containing `<table>` through the closing `</div>` of the table wrapper with:

Find the table wrapper (around line 195):
```jsx
      <div className={`${cardBg} rounded-[14px] overflow-hidden`}>
```

Replace from that `<div>` through its closing `</div>` (which contains the entire `<table>`) with:

```jsx
      <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredRegs.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No registrations found'}
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
            {filteredRegs.map(player => {
              const reg = player.registrations?.[0]
              const isPending = ['submitted', 'pending', 'new'].includes(reg?.status)
              const isSelected = selectedIds.has(player.id)
              const isSelectedForDossier = player.id === dossierPlayerId

              const statusDisplay = isPending ? 'Pending' :
                reg?.status === 'approved' ? 'Approved' :
                reg?.status === 'rostered' ? 'Rostered' :
                reg?.status === 'waitlist' ? 'Waitlist' :
                reg?.status === 'withdrawn' ? 'Denied' : '—'

              const statusColor = isPending ? 'bg-amber-500/12 text-amber-500' :
                reg?.status === 'approved' ? 'bg-emerald-500/12 text-emerald-500' :
                reg?.status === 'rostered' ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' :
                reg?.status === 'waitlist' ? 'bg-amber-500/12 text-amber-500' :
                reg?.status === 'withdrawn' ? 'bg-red-500/12 text-red-500' : 'bg-slate-500/12 text-slate-400'

              return (
                <div
                  key={player.id}
                  className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelectedForDossier
                      ? (isDark ? 'bg-[#4BB9EC]/10' : 'bg-[#10284C]/[0.04]')
                      : isSelected ? (isDark ? 'bg-[#4BB9EC]/5' : 'bg-[#4BB9EC]/[0.03]')
                      : isPending ? 'border-l-3 border-l-amber-400'
                      : isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => onRowSelect?.(player)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(player.id) }}
                    className="w-4 h-4 rounded cursor-pointer shrink-0"
                  />

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
                  </div>

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

                  {/* Status badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                    {statusDisplay}
                  </span>

                  {/* Quick approve/deny for pending */}
                  {isPending && (
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onApprove(player.id, reg.id)}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-[#22C55E] text-white hover:brightness-110">
                        ✓
                      </button>
                      <button onClick={() => onDeny(player, reg)}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        ✗
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
```

**Important:** Keep everything ABOVE the table (the filter chips, search bar, bulk action bar) exactly as they are. Only replace the table itself.

### Verification

- Registration list shows: checkbox, avatar, name, parent, grade, status badge
- No more Waiver, Contact, Actions columns
- Pending registrations show inline approve/deny buttons
- Clicking a row selects it and opens the dossier panel
- Bulk selection checkboxes still work
- Filter chips and search still work

### Commit message
```
refactor(registrations): simplify table to compact selection list — photo, name, parent, status
```

---

## PHASE 3 — Compact Stat Row (Horizontal)

### File: `src/pages/registrations/RegistrationsStatRow.jsx`

**Replace the StatCard component** (lines 8-39) with:

```jsx
function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`relative overflow-hidden rounded-xl px-4 py-3 border ${
      isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'
    }`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className={`w-5 h-5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} style={{ color: iconColor }} />
        )}
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black tracking-tighter ${valueColor || (isDark ? 'text-white' : 'text-[#10284C]')}`}>{value}</span>
            {sub && <span className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</span>}
            {pill && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Also update the layout** in the export function. Find (around line 51):

```jsx
    <div className={compact ? 'space-y-3' : 'grid grid-cols-2 lg:grid-cols-4 gap-3'}>
```

Replace with:

```jsx
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
```

Remove the `compact` prop handling since the sidebar layout is gone. The stat row is always horizontal now.

### Verification

- Stat cards are compact horizontal cards (~50px tall)
- 4 cards in a row on desktop, 2 on smaller screens
- No giant icon watermarks
- Same info displayed

### Commit message
```
refactor(registrations): compact horizontal stat cards
```

---

## POST-EXECUTION QA CHECKLIST

1. **Stats:** Compact horizontal row at top (4 cards). No left sidebar.
2. **Action bar:** View toggle (Table/Analytics), Approve All, Export CSV in a horizontal row.
3. **Selection list:** Fixed 680px left column. Each row: checkbox, avatar, name, parent + grade, status badge. Pending rows have inline approve/deny.
4. **Detail panel:** Always visible on right. Shows player dossier with info, waivers, contact, payment, actions. "Select a Player" placeholder when nothing selected.
5. **Clicking a row:** Highlights the row and populates the detail panel.
6. **Bulk actions:** Select checkboxes > sticky action bar appears with Approve/Deny/Waitlist/Export.
7. **Filters:** All/Pending/Approved/Rostered/Waitlist/Denied chips still filter the list.
8. **Search:** Still filters by name/parent/email.
9. **Analytics view:** Still works when toggled.
10. **Modals:** Player detail, deny, bulk deny all still work.
