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

      {/* Filter Bar inside card */}
      <div className={`${cardBg} rounded-[14px] overflow-hidden`}>
        <div className={`px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          {/* V2 Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search players or parents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder:text-slate-500 focus:border-[#4BB9EC]/30'
                  : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder:text-slate-400 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'
              }`}
              style={{ fontFamily: 'var(--v2-font)' }}
            />
          </div>
          {/* V2 pill-style status tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'}`}>
            {filterChips.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative ${
                  statusFilter === f.key
                    ? (isDark ? 'bg-white/[0.1] text-white shadow-sm' : 'bg-white text-[#10284C] shadow-sm')
                    : (isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-[#10284C]')
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`ml-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full text-[10px] font-black ${
                    f.dot && statusFilter !== f.key ? 'bg-amber-500 text-white' : (isDark ? 'bg-white/[0.1] text-slate-400' : 'bg-slate-200 text-slate-600')
                  }`}>{f.count}</span>
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
                const isSelectedForDossier = dossierPlayerId === player.id
                const isExpanded = expandedRowId === player.id

                return (
                  <React.Fragment key={player.id}>
                    <tr
                      className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'} transition-colors cursor-pointer ${
                        isSelectedForDossier
                          ? (isDark ? 'bg-[#4BB9EC]/10 border-l-[3px] border-l-[#10284C]' : 'bg-[#4BB9EC]/[0.06] border-l-[3px] border-l-[#10284C]')
                          : isSelected ? 'bg-lynx-sky/10'
                          : isPending ? (isDark ? 'border-l-[3px] border-l-amber-400' : 'border-l-[3px] border-l-amber-400')
                          : isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-[#4BB9EC]/[0.02]'
                      }`}
                      onClick={(e) => {
                        // Don't trigger row select if clicking on checkbox, button, or link
                        if (e.target.closest('input[type="checkbox"]') || e.target.closest('button')) return
                        onRowSelect?.(player)
                      }}
                    >
                      <td className="w-10 px-3 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(player.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedRowId(isExpanded ? null : player.id) }}
                            className={`p-0.5 rounded transition ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-[#10284C]'}`}
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
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
                    {/* Expandable detail row — Mission Control style */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7}>
                          <div className={`px-8 py-4 flex gap-8 ${isDark ? 'bg-[#0D1B2F] border-b border-white/[0.04]' : 'bg-[#F5F6F8] border-b border-[#E8ECF2]'}`}>
                            {/* Financial Breakdown */}
                            <div className="flex-1">
                              <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Financial Breakdown</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Registration Fee</span>
                                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{reg?.registration_fee ? `$${reg.registration_fee}` : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Uniform Kit</span>
                                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>—</span>
                                </div>
                                <div className={`border-t pt-2 flex justify-between ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Total</span>
                                  <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{reg?.registration_fee ? `$${reg.registration_fee}` : '—'}</span>
                                </div>
                              </div>
                            </div>
                            {/* Quick Actions */}
                            <div className="w-[200px] shrink-0">
                              <h4 className={`text-[10px] font-black uppercase tracking-[0.15em] mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Quick Actions</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {isPending && (
                                  <>
                                    <button onClick={() => onApprove(player.id, reg.id)}
                                      className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-[#22C55E] text-white hover:brightness-110">Approve</button>
                                    <button onClick={() => onDeny(player, reg)}
                                      className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">Deny</button>
                                  </>
                                )}
                                <button onClick={() => onEditPlayer(player)}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-white text-[#10284C] border border-[#E8ECF2] hover:bg-slate-50'}`}>Edit</button>
                                <button onClick={() => onPlayerSelect(player)}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-white text-[#10284C] border border-[#E8ECF2] hover:bg-slate-50'}`}>View</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
