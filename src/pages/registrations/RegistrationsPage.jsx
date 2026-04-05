// =============================================================================
// RegistrationsPage — Orchestrator
// Preserves all Supabase queries and approval/deny/bulk workflows
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { generateFeesForPlayer } from '../../lib/fee-calculator'
import { EmailService, isEmailEnabled } from '../../lib/email-service'
import { exportToCSV } from '../../lib/csv-export'
import { BarChart3, Table, FileDown, Check } from 'lucide-react'

import RegistrationsStatRow from './RegistrationsStatRow'
import RegistrationsTable from './RegistrationsTable'
import RegistrationAnalytics from './RegistrationAnalytics'
import PlayerDetailModal from './PlayerDetailModal'
import PlayerDossierPanel from './PlayerDossierPanel'
import { DenyRegistrationModal, BulkDenyModal } from './RegistrationModals'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// Re-export for any legacy imports
export { calculateAge, ClickablePlayerName } from './PlayerDetailModal'
export { DenyRegistrationModal, BulkDenyModal } from './RegistrationModals'

const csvColumns = [
  { label: 'First Name', accessor: r => r.first_name },
  { label: 'Last Name', accessor: r => r.last_name },
  { label: 'DOB', accessor: r => r.birth_date || r.dob },
  { label: 'Grade', accessor: r => r.grade },
  { label: 'Gender', accessor: r => r.gender },
  { label: 'Parent Name', accessor: r => r.parent_name },
  { label: 'Parent Email', accessor: r => r.parent_email },
  { label: 'Parent Phone', accessor: r => r.parent_phone },
  { label: 'Status', accessor: r => r.registrations?.[0]?.status },
  { label: 'Liability Waiver', accessor: r => r.waiver_liability ? 'Yes' : 'No' },
  { label: 'Photo Waiver', accessor: r => r.waiver_photo ? 'Yes' : 'No' },
  { label: 'Conduct Waiver', accessor: r => r.waiver_conduct ? 'Yes' : 'No' },
]

export function RegistrationsPage({ showToast }) {
  const journey = useJourney()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const { organization } = useAuth()
  const { isDark } = useTheme()

  const [registrations, setRegistrations] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [showDenyModal, setShowDenyModal] = useState(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [showBulkDenyModal, setShowBulkDenyModal] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => {
    loadRegistrations()
  }, [selectedSeason?.id, selectedSport?.id])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter])

  // ========== DATA LOADING ==========

  async function loadRegistrations() {
    setLoading(true)
    let query = supabase
      .from('players')
      .select('*, registrations(*), seasons:season_id(id, name)')
      .order('created_at', { ascending: false })

    if (selectedSeason?.id && !isAllSeasons(selectedSeason)) {
      query = query.eq('season_id', selectedSeason.id)
    } else if (isAllSeasons(selectedSeason) && selectedSport?.id) {
      // Filter by sport: only include players from seasons matching the selected sport
      const sportSeasonIds = (allSeasons || [])
        .filter(s => s.sport_id === selectedSport.id)
        .map(s => s.id)
      if (sportSeasonIds.length === 0) {
        setRegistrations([])
        setLoading(false)
        return
      }
      query = query.in('season_id', sportSeasonIds)
    } else {
      // All Seasons + no sport → filter by ALL org season IDs
      const orgSeasonIds = (allSeasons || []).map(s => s.id)
      if (orgSeasonIds.length === 0) {
        setRegistrations([])
        setLoading(false)
        return
      }
      query = query.in('season_id', orgSeasonIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading registrations:', error)
    } else {
      setRegistrations(data || [])
    }
    setLoading(false)
  }

  // ========== STATUS UPDATES ==========

  async function updateStatus(playerId, regId, newStatus) {
    try {
      await supabase.from('registrations').update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'approved' ? { approved_at: new Date().toISOString() } : {})
      }).eq('id', regId)

      if (newStatus === 'approved' && selectedSeason) {
        const { data: playerData } = await supabase
          .from('players')
          .select('*, registrations(*)')
          .eq('id', playerId)
          .single()

        if (playerData) {
          const result = await generateFeesForPlayer(supabase, playerData, selectedSeason, null)
          if (result.success && !result.skipped) {
            showToast(`Approved! Generated ${result.feesCreated} fees ($${result.totalAmount.toFixed(2)})`, 'success')
            if (isEmailEnabled(organization, 'registration_approved') && playerData.parent_email) {
              EmailService.sendApprovalNotification(playerData, selectedSeason, organization, result.fees || [])
                .then(r => r.success && console.log('Approval notification email queued'))
                .catch(e => console.error('Email queue error:', e))
            }
          } else if (result.skipped) {
            if (result.noFeesConfigured) {
              showToast('Approved! No fees configured - go to Setup to add fees', 'warning')
            } else {
              showToast('Registration approved!', 'success')
            }
            if (isEmailEnabled(organization, 'registration_approved') && playerData.parent_email) {
              EmailService.sendApprovalNotification(playerData, selectedSeason, organization, [])
                .then(r => r.success && console.log('Approval notification email queued'))
                .catch(e => console.error('Email queue error:', e))
            }
          } else {
            showToast('Approved (fee generation failed - check manually)', 'warning')
          }
        } else {
          showToast('Registration approved!', 'success')
        }
        journey?.completeStep('register_players')
      } else {
        showToast(`Registration ${newStatus}!`, 'success')
      }

      loadRegistrations()
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error')
    }
  }

  async function denyRegistration(regId, reason) {
    try {
      await supabase.from('registrations').update({
        status: 'withdrawn',
        deny_reason: reason,
        updated_at: new Date().toISOString()
      }).eq('id', regId)
      showToast('Registration denied', 'success')
      setShowDenyModal(null)
      loadRegistrations()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  // ========== BULK ACTIONS ==========

  function toggleSelectAll(clear) {
    if (clear || selectedIds.size === filteredRegs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRegs.map(p => p.id)))
    }
  }

  function toggleSelect(playerId) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(playerId)) newSelected.delete(playerId)
    else newSelected.add(playerId)
    setSelectedIds(newSelected)
  }

  async function approvePlayers(players, label) {
    setBulkProcessing(true)
    const pending = players.filter(p => ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status))
    if (pending.length === 0) {
      showToast('No pending registrations to approve', 'warning')
      setBulkProcessing(false)
      return
    }
    let approved = 0, feesGenerated = 0, totalFeeAmount = 0, emailsQueued = 0
    for (const player of pending) {
      const reg = player.registrations?.[0]
      if (!reg) continue
      try {
        await supabase.from('registrations').update({
          status: 'approved', updated_at: new Date().toISOString(), approved_at: new Date().toISOString()
        }).eq('id', reg.id)
        approved++
        let fees = []
        if (selectedSeason) {
          const result = await generateFeesForPlayer(supabase, player, selectedSeason, null)
          if (result.success && !result.skipped) {
            feesGenerated += result.feesCreated
            totalFeeAmount += result.totalAmount
            fees = result.fees || []
          }
        }
        if (isEmailEnabled(organization, 'registration_approved') && player.parent_email) {
          const emailResult = await EmailService.sendApprovalNotification(player, selectedSeason, organization, fees)
          if (emailResult.success) emailsQueued++
        }
      } catch (err) {
        console.error('Error approving player:', player.id, err)
      }
    }
    showToast(
      `${label ? label + ' ' : ''}Approved ${approved} registrations! Generated ${feesGenerated} fees ($${totalFeeAmount.toFixed(2)})${emailsQueued > 0 ? ` · ${emailsQueued} emails queued` : ''}`,
      'success'
    )
    journey?.completeStep('register_players')
    setSelectedIds(new Set())
    setBulkProcessing(false)
    loadRegistrations()
  }

  function bulkApprove() {
    approvePlayers(filteredRegs.filter(p => selectedIds.has(p.id)), '')
  }

  function bulkApproveAllPending() {
    approvePlayers(registrations, 'All')
  }

  async function bulkDeny(reason) {
    setBulkProcessing(true)
    const selected = filteredRegs.filter(p => selectedIds.has(p.id))
    const eligible = selected.filter(p => ['submitted', 'pending', 'new', 'waitlist'].includes(p.registrations?.[0]?.status))
    let denied = 0

    for (const player of eligible) {
      const reg = player.registrations?.[0]
      if (!reg) continue
      try {
        await supabase.from('registrations').update({
          status: 'withdrawn', deny_reason: reason, updated_at: new Date().toISOString()
        }).eq('id', reg.id)
        denied++
      } catch (err) {
        console.error('Error denying player:', player.id, err)
      }
    }

    showToast(`Denied ${denied} registrations`, 'success')
    setSelectedIds(new Set())
    setShowBulkDenyModal(false)
    setBulkProcessing(false)
    loadRegistrations()
  }

  async function bulkMoveToWaitlist() {
    setBulkProcessing(true)
    const selected = filteredRegs.filter(p => selectedIds.has(p.id))
    const eligible = selected.filter(p => ['submitted', 'pending', 'new', 'approved'].includes(p.registrations?.[0]?.status))
    let moved = 0

    for (const player of eligible) {
      const reg = player.registrations?.[0]
      if (!reg) continue
      try {
        await supabase.from('registrations').update({
          status: 'waitlist', updated_at: new Date().toISOString()
        }).eq('id', reg.id)
        moved++
      } catch (err) {
        console.error('Error moving player to waitlist:', player.id, err)
      }
    }

    showToast(`Moved ${moved} registrations to waitlist`, 'success')
    setSelectedIds(new Set())
    setBulkProcessing(false)
    loadRegistrations()
  }

  function bulkExport() {
    const selected = filteredRegs.filter(p => selectedIds.has(p.id))
    if (selected.length === 0) {
      showToast('No registrations selected', 'warning')
      return
    }
    exportToCSV(selected, 'selected_registrations', csvColumns)
    showToast(`Exported ${selected.length} registrations`, 'success')
  }

  // ========== DERIVED STATE ==========

  const filteredRegs = registrations.filter(p => {
    // Apply status filter
    if (statusFilter !== 'all') {
      const regStatus = p.registrations?.[0]?.status
      if (statusFilter === 'pending') {
        if (!['submitted', 'pending', 'new'].includes(regStatus)) return false
      } else if (statusFilter === 'denied') {
        if (regStatus !== 'withdrawn') return false
      } else {
        if (regStatus !== statusFilter) return false
      }
    }
    // Apply search filter
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      p.first_name?.toLowerCase().includes(search) ||
      p.last_name?.toLowerCase().includes(search) ||
      p.parent_name?.toLowerCase().includes(search) ||
      p.parent_email?.toLowerCase().includes(search)
    )
  })

  const statusCounts = {
    all: registrations.length,
    pending: registrations.filter(p => ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status)).length,
    approved: registrations.filter(p => p.registrations?.[0]?.status === 'approved').length,
    rostered: registrations.filter(p => p.registrations?.[0]?.status === 'rostered').length,
    waitlist: registrations.filter(p => p.registrations?.[0]?.status === 'waitlist').length,
    denied: registrations.filter(p => p.registrations?.[0]?.status === 'withdrawn').length,
  }

  const selectedPendingCount = filteredRegs.filter(p =>
    selectedIds.has(p.id) && ['submitted', 'pending', 'new'].includes(p.registrations?.[0]?.status)
  ).length

  // Waiver stats for stat row
  const waiverStats = {
    total: registrations.length,
    signed: registrations.filter(p => {
      // Check boolean fields on players table (legacy)
      if (p.waiver_liability && p.waiver_conduct) return true
      // Check registration record for waivers_accepted (public form)
      const reg = p.registrations?.[0]
      if (reg?.waivers_accepted && typeof reg.waivers_accepted === 'object') {
        const vals = Object.values(reg.waivers_accepted)
        return vals.length > 0 && vals.every(v => v === true)
      }
      if (reg?.signature_name) return true
      return false
    }).length,
  }
  const returningCount = registrations.filter(p => p.is_returning).length
  const newCount = registrations.length - returningCount

  // Dossier panel state
  const [dossierPlayer, setDossierPlayer] = useState(null)

  // ========== RENDER ==========

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
}
