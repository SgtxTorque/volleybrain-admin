// =============================================================================
// RegistrationsTable — filter bar + table with pending amber highlights
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { ClickablePlayerName, calculateAge } from './PlayerDetailModal'
import { Search, Check, X, MoreHorizontal, FileDown, List, ClipboardList } from 'lucide-react'

// ============================================
// STATUS CHIP
// ============================================
function StatusChip({ status }) {
  const display = ['submitted', 'pending', 'new'].includes(status) ? 'Pending' :
    status === 'approved' ? 'Approved' :
    status === 'rostered' ? 'Rostered' :
    status === 'waitlist' ? 'Waitlist' :
    status === 'withdrawn' ? 'Denied' : status || 'Unknown'

  const colors = ['submitted', 'pending', 'new'].includes(status) ? 'bg-amber-500/12 text-amber-500' :
    status === 'approved' ? 'bg-emerald-500/12 text-emerald-500' :
    status === 'rostered' ? 'bg-lynx-sky/15 text-lynx-sky' :
    status === 'waitlist' ? 'bg-amber-500/12 text-amber-500' :
    status === 'withdrawn' ? 'bg-red-500/12 text-red-500' : 'bg-slate-500/12 text-slate-400'

  return (
    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${colors}`}>{display}</span>
  )
}

// ============================================
// WAIVER CHIP
// ============================================
function WaiverChip({ player }) {
  const allSigned = player.waiver_liability && player.waiver_conduct
  const someSigned = player.waiver_liability || player.waiver_photo || player.waiver_conduct

  if (allSigned) return <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">Signed</span>
  if (someSigned) return <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-500">Partial</span>
  return <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-red-500/12 text-red-500">Unsigned</span>
}

// ============================================
// OVERFLOW MENU
// ============================================
function OverflowMenu({ onView, onEdit }) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-8 z-20 w-36 rounded-xl shadow-lg border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => { onView(); setOpen(false) }} className={`w-full text-left px-4 py-2.5 text-base ${isDark ? 'text-white hover:bg-white/[0.04]' : 'text-slate-900 hover:bg-slate-50'} rounded-t-xl`}>
              View Details
            </button>
            <button onClick={() => { onEdit(); setOpen(false) }} className={`w-full text-left px-4 py-2.5 text-base ${isDark ? 'text-white hover:bg-white/[0.04]' : 'text-slate-900 hover:bg-slate-50'} rounded-b-xl`}>
              Edit Player
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// REGISTRATIONS TABLE
// ============================================
export default function RegistrationsTable({
  registrations,
  filteredRegs,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  statusCounts,
  selectedIds,
  toggleSelectAll,
  toggleSelect,
  onPlayerSelect,
  onEditPlayer,
  onApprove,
  onDeny,
  onPromote,
  bulkApprove,
  bulkDeny,
  bulkMoveToWaitlist,
  bulkExport,
  bulkProcessing,
  setShowBulkDenyModal,
  loading,
  selectedPendingCount,
}) {
  const { isDark } = useTheme()

  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'

  const filterChips = [
    { key: 'all', label: 'All', count: statusCounts.all },
    { key: 'pending', label: 'Pending', count: statusCounts.pending, dot: statusCounts.pending > 0 },
    { key: 'approved', label: 'Approved', count: statusCounts.approved },
    { key: 'rostered', label: 'Rostered', count: statusCounts.rostered },
    { key: 'waitlist', label: 'Waitlist', count: statusCounts.waitlist },
    { key: 'denied', label: 'Denied', count: statusCounts.denied },
  ]

  return (
    <div className="space-y-3">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className={`${cardBg} rounded-[14px] p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedIds.size} selected
            </span>
            <button onClick={() => toggleSelectAll(true)} className="text-base text-slate-400 hover:underline">
              Clear
            </button>
          </div>
          <div className="flex gap-2">
            {selectedPendingCount > 0 && (
              <button
                onClick={bulkApprove}
                disabled={bulkProcessing}
                className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-base font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Approve ({selectedPendingCount})
              </button>
            )}
            <button
              onClick={bulkMoveToWaitlist}
              disabled={bulkProcessing}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl text-base font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
            >
              <List className="w-4 h-4" /> Waitlist
            </button>
            <button
              onClick={() => setShowBulkDenyModal(true)}
              disabled={bulkProcessing}
              className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-base font-bold hover:bg-red-500/20 disabled:opacity-50"
            >
              Deny
            </button>
            <button
              onClick={bulkExport}
              className={`px-4 py-2 rounded-xl text-base font-bold ${isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.08]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} flex items-center gap-2`}
            >
              <FileDown className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar inside card */}
      <div className={`${cardBg} rounded-[14px] overflow-hidden`}>
        <div className={`px-5 py-3 flex items-center gap-3 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search players or parents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-white placeholder-slate-500' : 'bg-white border-[#E8ECF2] text-[#10284C] placeholder-slate-400 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'} border transition-all focus:outline-none`}
              style={{ fontFamily: 'var(--v2-font)' }}
            />
          </div>
          <div className="flex gap-1.5">
            {filterChips.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition relative ${
                  statusFilter === f.key
                    ? 'bg-lynx-sky text-lynx-navy'
                    : isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {f.label} ({f.count || 0})
                {f.dot && statusFilter !== f.key && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-lynx-sky/30 border-t-lynx-sky rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-base mt-3">Loading registrations...</p>
          </div>
        ) : filteredRegs.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className={`w-12 h-12 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <h3 className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>No registrations found</h3>
            <p className="text-slate-400 mt-1 text-base">
              {statusFilter !== 'all' ? 'Try changing the filter' : 'Registrations will appear here'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredRegs.length && filteredRegs.length > 0}
                    onChange={() => toggleSelectAll()}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
                <th className="text-left px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Player</th>
                <th className="text-left px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Parent</th>
                <th className="text-left px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Contact</th>
                <th className="text-left px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Waiver</th>
                <th className="text-left px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegs.map((player) => {
                const reg = player.registrations?.[0]
                const isSelected = selectedIds.has(player.id)
                const isPending = ['submitted', 'pending', 'new'].includes(reg?.status)

                return (
                  <tr
                    key={player.id}
                    className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'} transition ${
                      isSelected ? 'bg-lynx-sky/10' :
                      isPending ? (isDark ? 'bg-amber-500/5' : 'bg-amber-50') :
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(player.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
                        </div>
                        <div>
                          <ClickablePlayerName
                            player={player}
                            onPlayerSelect={onPlayerSelect}
                            className={`font-semibold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}
                          />
                          <p className="text-sm text-slate-400">
                            {player.birth_date || player.dob ? `Age ${calculateAge(player.birth_date || player.dob)}` : ''}
                            {player.grade ? ` · Gr ${player.grade}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className={`text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{player.parent_name || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-400">{player.parent_email}</p>
                      <p className="text-sm text-slate-500">{player.parent_phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <WaiverChip player={player} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={reg?.status} />
                    </td>
                    <td className="px-5 py-3">
                      {isPending ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApprove(player.id, reg.id)}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-lynx-sky text-lynx-navy hover:bg-lynx-sky/80"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onDeny(player, reg)}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                          >
                            Deny
                          </button>
                        </div>
                      ) : reg?.status === 'waitlist' ? (
                        <button
                          onClick={() => onPromote(player.id, reg.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500/12 text-amber-500 hover:bg-amber-500/20"
                        >
                          Promote
                        </button>
                      ) : (
                        <OverflowMenu
                          onView={() => onPlayerSelect(player)}
                          onEdit={() => onEditPlayer(player)}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
