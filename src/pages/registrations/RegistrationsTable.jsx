// =============================================================================
// RegistrationsTable — filter bar + table with pending amber highlights
// =============================================================================

import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { ClickablePlayerName, calculateAge } from './PlayerDetailModal'
import { Search, Check, X, MoreHorizontal, FileDown, List, ClipboardList, ChevronDown, ChevronRight, Mail } from 'lucide-react'

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
  dossierPlayerId,
  onRowSelect,
}) {
  const { isDark } = useTheme()
  const [expandedRowId, setExpandedRowId] = useState(null)

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
      {/* Bulk Action Bar — sticky navy bar */}
      {selectedIds.size > 0 && (
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-3 rounded-xl ${
          isDark ? 'bg-[#10284C] border border-[#4BB9EC]/20' : 'bg-[#10284C]'
        }`}>
          <span className="text-sm font-bold text-white">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            {selectedPendingCount > 0 && (
              <button onClick={bulkApprove} disabled={bulkProcessing}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#22C55E] text-white hover:brightness-110 disabled:opacity-50">
                Approve ({selectedPendingCount})
              </button>
            )}
            <button onClick={() => setShowBulkDenyModal(true)} disabled={bulkProcessing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:brightness-110 disabled:opacity-50">
              Deny
            </button>
            <button onClick={bulkMoveToWaitlist} disabled={bulkProcessing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:brightness-110 disabled:opacity-50">
              Waitlist
            </button>
            <button onClick={bulkExport}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white hover:bg-white/30">
              Export
            </button>
            <button onClick={() => toggleSelectAll(true)} className="text-xs text-white/60 hover:text-white ml-2">
              Clear
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
}
