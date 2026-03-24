// =============================================================================
// PaymentsPage — Orchestrator: data fetching, stat row, card views, modals
// Sub-components: PaymentsStatRow, PaymentCards, PaymentsModals
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { calculateFeesForPlayer } from '../../lib/fee-calculator'
import { exportToCSV } from '../../lib/csv-export'
import {
  DollarSign, Search, Bell, User, Users, Download, Plus, X, AlertTriangle, CheckCircle, Clock as ClockIcon
} from 'lucide-react'
import { SkeletonPaymentsPage } from '../../components/ui'
// PaymentsStatRow replaced by navy financial overview header inline
import { PlayerPaymentCard, FamilyPaymentCard } from './PaymentCards'
import { MarkPaidModal, DeletePaymentModal, SendReminderModal, BlastReminderModal, AddFeeModal } from './PaymentsModals'
import FamilyDetailPanel from './FamilyDetailPanel'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// ---------- Zone classification ----------
const ZONES = [
  { key: 'critical', label: 'ZONE 1: CRITICAL PRIORITY', color: 'text-red-500', dot: 'bg-red-500' },
  { key: 'followup', label: 'ZONE 2: NEEDS FOLLOW-UP', color: 'text-amber-500', dot: 'bg-amber-500' },
  { key: 'ontrack', label: 'ZONE 3: ON TRACK', color: 'text-[#22C55E]', dot: 'bg-[#22C55E]' },
  { key: 'paid', label: 'ZONE 4: FULLY PAID', color: 'text-slate-400', dot: 'bg-slate-400' },
]

function daysSince(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

function classifyFamily(family) {
  const totalOwed = family.payments.filter(p => !p.paid).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  if (totalOwed === 0 && family.payments.length > 0) return 'paid'
  const hasOverdue30 = family.payments.some(p => !p.paid && p.due_date && daysSince(p.due_date) > 30)
  if (hasOverdue30) return 'critical'
  const hasPending = family.payments.some(p => !p.paid && p.payment_method === 'manual')
  const hasOverdue = family.payments.some(p => !p.paid && p.due_date && daysSince(p.due_date) > 0)
  if (hasPending || hasOverdue) return 'followup'
  return 'ontrack'
}

// ============================================
// GENERATE FEES FOR EXISTING PLAYERS (backfill) — exported utility
// ============================================
export async function generateFeesForExistingPlayers(supabase, seasonId, showToast) {
  try {
    const { data: season, error: seasonError } = await supabase
      .from('seasons').select('*').eq('id', seasonId).single()
    if (seasonError || !season) throw new Error('Season not found')

    const { data: players, error: playersError } = await supabase
      .from('players').select('*, registrations(*)').eq('season_id', seasonId)
    if (playersError) throw playersError

    const approvedPlayers = (players || []).filter(p =>
      ['approved', 'rostered', 'active'].includes(p.registrations?.[0]?.status)
    )
    if (approvedPlayers.length === 0) return { success: true, message: 'No approved players found' }

    const { data: existingPayments } = await supabase
      .from('payments').select('player_id, family_email, fee_category')
      .eq('season_id', seasonId).eq('auto_generated', true)

    const playersWithFees = new Set((existingPayments || []).map(p => p.player_id))
    const familiesWithFamilyFee = new Set(
      (existingPayments || []).filter(p => p.fee_category === 'per_family').map(p => p.family_email?.toLowerCase())
    )
    const playersNeedingFees = approvedPlayers.filter(p => !playersWithFees.has(p.id))
    if (playersNeedingFees.length === 0) return { success: true, message: 'All approved players already have fees' }

    const familyGroups = {}
    for (const player of playersNeedingFees) {
      const familyEmail = player.parent_email?.toLowerCase() || 'unknown'
      if (!familyGroups[familyEmail]) familyGroups[familyEmail] = []
      familyGroups[familyEmail].push(player)
    }

    const familySiblingCounts = {}
    for (const payment of (existingPayments || [])) {
      const email = payment.family_email?.toLowerCase()
      if (email) familySiblingCounts[email] = (familySiblingCounts[email] || 0) + 1
    }
    for (const email of Object.keys(familySiblingCounts)) {
      const uniquePlayers = [...new Set((existingPayments || [])
        .filter(p => p.family_email?.toLowerCase() === email).map(p => p.player_id))]
      familySiblingCounts[email] = uniquePlayers.length
    }

    let totalFeesCreated = 0
    let totalAmount = 0
    const allFees = []

    for (const familyEmail of Object.keys(familyGroups)) {
      const familyPlayers = familyGroups[familyEmail]
      let siblingIndex = familySiblingCounts[familyEmail] || 0

      for (const player of familyPlayers) {
        const fees = calculateFeesForPlayer(player, season, {
          checkExistingFamilyFee: true,
          existingFamilyEmails: [...familiesWithFamilyFee],
          siblingIndex
        })

        if (familyEmail && fees.some(f => f.fee_category === 'per_family')) {
          familiesWithFamilyFee.add(familyEmail)
        }

        for (const fee of fees) {
          allFees.push({
            season_id: seasonId,
            player_id: player.id,
            family_email: familyEmail,
            fee_type: fee.fee_type,
            fee_name: fee.fee_name,
            fee_category: fee.fee_category,
            amount: fee.amount,
            description: fee.description || null,
            due_date: fee.due_date || null,
            paid: false,
            auto_generated: true,
            created_at: new Date().toISOString()
          })
          totalFeesCreated++
          totalAmount += fee.amount
        }
        siblingIndex++
      }
    }

    if (allFees.length > 0) {
      const { error: insertError } = await supabase.from('payments').insert(allFees)
      if (insertError) throw insertError
    }

    const msg = `Generated ${totalFeesCreated} fees totaling $${totalAmount.toFixed(2)}`
    showToast(msg, 'success')
    return { success: true, message: msg }
  } catch (err) {
    showToast('Error generating fees: ' + err.message, 'error')
    return { success: false, message: err.message }
  }
}

// ============================================
// MAIN PAYMENTS PAGE
// ============================================
export function PaymentsPage({ showToast }) {
  const { organization } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const { isDark } = useTheme()
  const [payments, setPayments] = useState([])
  const [players, setPlayers] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('family')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(null)
  const [showReminderModal, setShowReminderModal] = useState(null)
  const [showBlastModal, setShowBlastModal] = useState(false)
  const [sortMode, setSortMode] = useState('balance')
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [selectedFamilyIds, setSelectedFamilyIds] = useState(new Set())
  const [showZone4All, setShowZone4All] = useState(false)

  // Helper: get season IDs filtered by sport (for "All Seasons" + sport filter)
  function getSportSeasonIds() {
    if (!selectedSport?.id) return null
    return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  }

  useEffect(() => {
    if (selectedSeason?.id) { loadPayments(); loadPlayers() }
  }, [selectedSeason?.id, selectedSport?.id])

  async function loadPlayers() {
    let query = supabase
      .from('players')
      .select('id, first_name, last_name, photo_url, position, grade, jersey_number, parent_email, parent_name')
    if (!isAllSeasons(selectedSeason)) {
      query = query.eq('season_id', selectedSeason.id)
    } else {
      const sportIds = getSportSeasonIds()
      if (sportIds && sportIds.length > 0) {
        query = query.in('season_id', sportIds)
      } else if (sportIds && sportIds.length === 0) {
        setPlayers([])
        return
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setPlayers([])
          return
        }
        query = query.in('season_id', orgSeasonIds)
      }
    }
    const { data } = await query
    setPlayers(data || [])
  }

  async function loadPayments() {
    if (!selectedSeason?.id) return
    setLoading(true)
    let query = supabase
      .from('payments')
      .select('*, players(id, first_name, last_name, parent_name, parent_email, photo_url, position, grade, jersey_number)')
    if (!isAllSeasons(selectedSeason)) {
      query = query.eq('season_id', selectedSeason.id)
    } else {
      const sportIds = getSportSeasonIds()
      if (sportIds && sportIds.length > 0) {
        query = query.in('season_id', sportIds)
      } else if (sportIds && sportIds.length === 0) {
        setPayments([])
        setLoading(false)
        return
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setPayments([])
          setLoading(false)
          return
        }
        query = query.in('season_id', orgSeasonIds)
      }
    }
    const { data } = await query.order('created_at', { ascending: false })
    setPayments(data || [])
    setLoading(false)
  }

  async function handleMarkPaid(paymentId, details) {
    await supabase.from('payments').update({
      paid: true,
      paid_date: details.paid_date || new Date().toISOString().split('T')[0],
      payment_method: details.payment_method,
      reference_number: details.reference_number,
      status: 'verified',
      verified_at: new Date().toISOString(),
      notes: details.notes || null
    }).eq('id', paymentId)
    showToast('Payment marked as paid', 'success')
    setShowMarkPaidModal(null)
    loadPayments()
  }

  async function handleMarkUnpaid(paymentId) {
    await supabase.from('payments').update({
      paid: false, paid_date: null, reference_number: null, status: 'pending'
    }).eq('id', paymentId)
    showToast('Payment marked as unpaid', 'success')
    loadPayments()
  }

  async function handleDeletePayment(paymentId) {
    await supabase.from('payments').delete().eq('id', paymentId)
    showToast('Fee removed', 'success')
    setShowDeleteModal(null)
    loadPayments()
  }

  async function handleAddPayment(paymentData) {
    try {
      const player = players.find(p => p.id === paymentData.player_id)
      await supabase.from('payments').insert({
        ...paymentData,
        season_id: selectedSeason.id,
        family_email: player?.parent_email?.toLowerCase(),
        auto_generated: false,
        created_at: new Date().toISOString()
      })
      showToast('Fee added!', 'success')
      setShowAddModal(false)
      loadPayments()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function handleBackfillFees() {
    if (!selectedSeason) return
    setBackfillLoading(true)
    const result = await generateFeesForExistingPlayers(supabase, selectedSeason.id, showToast)
    setBackfillLoading(false)
    if (result.success) loadPayments()
  }

  function handleSendReminder(data) {
    showToast(`Reminder ${data.method === 'email' ? 'email' : data.method === 'text' ? 'text' : 'notification'} queued!`, 'success')
    setShowReminderModal(null)
  }

  function handleSendBlast(data) {
    showToast(`Blast sent to ${data.count} families via ${data.method}!`, 'success')
    setShowBlastModal(false)
  }

  function toggleCard(id) {
    setExpandedCards(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ------ Filtering & grouping ------
  const filteredPayments = payments.filter(p => {
    if (statusFilter === 'paid' && !p.paid) return false
    if (statusFilter === 'unpaid' && p.paid) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const playerName = `${p.players?.first_name || ''} ${p.players?.last_name || ''}`.toLowerCase()
      const parentName = (p.players?.parent_name || '').toLowerCase()
      const parentEmail = (p.players?.parent_email || '').toLowerCase()
      if (!playerName.includes(q) && !parentName.includes(q) && !parentEmail.includes(q)) return false
    }
    return true
  })

  const playerGroups = filteredPayments.reduce((acc, payment) => {
    const pid = payment.player_id
    if (!pid) return acc
    if (!acc[pid]) acc[pid] = { player: payment.players || { first_name: 'Unknown', last_name: '' }, payments: [] }
    acc[pid].payments.push(payment)
    return acc
  }, {})

  const playerList = Object.entries(playerGroups)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => {
      const aOwed = a.payments.filter(p => !p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
      const bOwed = b.payments.filter(p => !p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
      return bOwed - aOwed
    })

  const familyGroups = filteredPayments.reduce((acc, payment) => {
    const email = payment.family_email || payment.players?.parent_email || 'unknown'
    if (!acc[email]) acc[email] = { email, parentName: payment.players?.parent_name || 'Unknown', payments: [], players: new Set() }
    acc[email].payments.push(payment)
    if (payment.players?.first_name) acc[email].players.add(`${payment.players.first_name} ${payment.players.last_name}`)
    return acc
  }, {})

  const familyList = Object.values(familyGroups).sort((a, b) => {
    if (sortMode === 'name') {
      return (a.parentName || '').localeCompare(b.parentName || '')
    }
    if (sortMode === 'priority') {
      const zoneOrder = { critical: 0, followup: 1, ontrack: 2, paid: 3 }
      const az = zoneOrder[classifyFamily(a)] ?? 9
      const bz = zoneOrder[classifyFamily(b)] ?? 9
      if (az !== bz) return az - bz
    }
    // Default: highest balance first
    const aOwed = a.payments.filter(p => !p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    const bOwed = b.payments.filter(p => !p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    return bOwed - aOwed
  })

  // ------ Summary stats ------
  const totalOwed = payments.filter(p => !p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalCollected = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalBilled = totalOwed + totalCollected
  const uniqueFamilies = new Set(payments.map(p => p.family_email || p.players?.parent_email)).size
  const overdueFamilyCount = Object.values(familyGroups).filter(f => f.payments.some(p => !p.paid)).length
  const collectionRate = payments.length > 0 ? Math.round((payments.filter(p => p.paid).length / payments.length) * 100) : 0

  // Avg days overdue
  const overduePayments = payments.filter(p => !p.paid && p.due_date && daysSince(p.due_date) > 0)
  const avgDaysOverdue = overduePayments.length > 0
    ? Math.round(overduePayments.reduce((sum, p) => sum + daysSince(p.due_date), 0) / overduePayments.length)
    : 0

  // Zone groups for priority queue rendering
  const zoneGroups = ZONES.map(zone => ({
    ...zone,
    families: familyList.filter(f => classifyFamily(f) === zone.key)
  }))

  // Bulk selection helpers
  function toggleBulkSelect(email) {
    setSelectedFamilyIds(prev => {
      const next = new Set(prev)
      next.has(email) ? next.delete(email) : next.add(email)
      return next
    })
  }

  const csvColumns = [
    { label: 'Player First Name', accessor: p => p.players?.first_name },
    { label: 'Player Last Name', accessor: p => p.players?.last_name },
    { label: 'Parent', accessor: p => p.players?.parent_name },
    { label: 'Parent Email', accessor: p => p.players?.parent_email || p.family_email },
    { label: 'Fee Type', accessor: p => p.fee_name || p.fee_type },
    { label: 'Amount', accessor: p => p.amount },
    { label: 'Paid', accessor: p => p.paid ? 'Yes' : 'No' },
    { label: 'Paid Date', accessor: p => p.paid_date },
    { label: 'Method', accessor: p => p.payment_method },
  ]

  // ------ Guards ------
  if (!selectedSeason) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Please select a season to view payments.</p>
      </div>
    )
  }

  // ------ Main render ------
  return (
    <PageShell
      breadcrumb="Registration & Payments"
      title="Payment Admin"
      subtitle={`Track and manage payment status · ${selectedSeason.name}`}
      actions={
        <>
          <button onClick={() => setShowBlastModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all"
            style={{ fontFamily: 'var(--v2-font)' }}>
            <Bell className="w-4 h-4" /> Blast Overdue
          </button>
          <button onClick={handleBackfillFees} disabled={backfillLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 hover:shadow-sm'} ${backfillLoading ? 'opacity-50' : ''}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            {backfillLoading ? 'Generating...' : 'Backfill Fees'}
          </button>
          <button onClick={() => exportToCSV(payments, 'payments', csvColumns)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 hover:shadow-sm'}`}
            style={{ fontFamily: 'var(--v2-font)' }}>
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-[#10284C] text-white font-semibold hover:bg-[#1a3a6b] shadow-sm transition-all"
            style={{ fontFamily: 'var(--v2-font)' }}>
            <Plus className="w-4 h-4" /> Add Fee
          </button>
        </>
      }
    >
      <div className="space-y-5">
      {/* Season filter */}
      <SeasonFilterBar />

      {/* Navy Financial Overview Header */}
      <div className="bg-[#10284C] rounded-2xl p-6" style={{ fontFamily: 'var(--v2-font)' }}>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { label: 'Total Billed', value: `$${totalBilled.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'text-white' },
            { label: 'Collected', value: `$${totalCollected.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'text-[#22C55E]' },
            { label: 'Outstanding', value: `$${totalOwed.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: totalOwed > 0 ? 'text-red-400' : 'text-white' },
            { label: 'Collection Rate', value: `${collectionRate}%`, color: collectionRate >= 80 ? 'text-[#22C55E]' : collectionRate >= 50 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Overdue', value: overdueFamilyCount, color: overdueFamilyCount > 0 ? 'text-red-400' : 'text-white' },
            { label: 'Avg Days Overdue', value: avgDaysOverdue, color: avgDaysOverdue > 30 ? 'text-red-400' : avgDaysOverdue > 14 ? 'text-amber-400' : 'text-white' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-black ${stat.color}`} style={{ letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filter bar */}
      <div className={`rounded-[14px] px-5 py-3 flex items-center gap-3 flex-wrap ${isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04),0_4px_12px_rgba(16,40,76,0.03)]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by player or parent..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-8 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder-slate-500' : 'bg-white border border-[#E8ECF2] text-[#10284C] placeholder-slate-400 focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'} focus:outline-none transition-all`}
            style={{ fontFamily: 'var(--v2-font)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {['all', 'unpaid', 'paid'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize transition ${
                statusFilter === f
                  ? (f === 'unpaid' ? 'bg-red-500/12 text-red-500' : f === 'paid' ? 'bg-emerald-500/12 text-emerald-500' : 'bg-lynx-sky/15 text-lynx-sky')
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Sort mode */}
        <select value={sortMode} onChange={e => setSortMode(e.target.value)}
          className={`px-3 py-2 rounded-lg text-sm font-bold ${isDark ? 'bg-white/[0.04] border border-white/[0.06] text-white' : 'bg-white border border-[#E8ECF2] text-[#10284C]'} focus:outline-none focus:border-[#4BB9EC]`}
          style={{ fontFamily: 'var(--v2-font)' }}>
          <option value="balance">Sort: Highest Balance</option>
          <option value="priority">Sort: Priority Queue</option>
          <option value="name">Sort: Family Name</option>
        </select>

        <div className={`ml-auto flex gap-1 p-1 rounded-lg ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
          <button onClick={() => setViewMode('individual')}
            className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1.5 transition ${
              viewMode === 'individual' ? 'bg-lynx-sky text-white' : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
            <User className="w-3.5 h-3.5" /> Individual
          </button>
          <button onClick={() => setViewMode('family')}
            className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1.5 transition ${
              viewMode === 'family' ? 'bg-lynx-sky text-white' : isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
            <Users className="w-3.5 h-3.5" /> Family
          </button>
        </div>
      </div>

      {/* Content — 2-column layout */}
      {loading ? (
        <SkeletonPaymentsPage />
      ) : payments.length === 0 ? (
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
            <DollarSign className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No payments found</h3>
          <p className={`text-base mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fees are automatically generated when registrations are approved.</p>
          <button onClick={handleBackfillFees} className="mt-4 bg-lynx-navy text-white font-bold px-6 py-2 rounded-lg hover:brightness-110 transition">
            Generate Fees for Existing Players
          </button>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Left: Payment list */}
          <div className="flex-1 min-w-0">
            {viewMode === 'individual' ? (
              <div>
                {playerList.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No results found for "{searchQuery}"</div>
                ) : (
                  <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04)]'}`}>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {playerList.map(({ id, player, payments: pPayments }) => (
                        <PlayerPaymentCard key={id} player={player} payments={pPayments}
                          expanded={expandedCards.has(id)} onToggle={() => toggleCard(id)}
                          onMarkPaid={p => setShowMarkPaidModal(p)} onMarkUnpaid={handleMarkUnpaid}
                          onDeletePayment={p => setShowDeleteModal(p)} onSendReminder={p => setShowReminderModal(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : sortMode === 'priority' ? (
              /* Priority Queue — zone-grouped rendering */
              <div className="space-y-1">
                {zoneGroups.map(zone => {
                  if (zone.families.length === 0) return null
                  const isZone4 = zone.key === 'paid'
                  const visibleFamilies = isZone4 && !showZone4All ? zone.families.slice(0, 3) : zone.families
                  return (
                    <div key={zone.key}>
                      {/* Zone header */}
                      <div className="flex items-center gap-2 mt-5 mb-3 first:mt-0">
                        <div className={`w-2 h-2 rounded-full ${zone.dot}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${zone.color}`}
                          style={{ fontFamily: 'var(--v2-font)' }}>{zone.label}</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>({zone.families.length})</span>
                        <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                        {isZone4 && zone.families.length > 3 && (
                          <button onClick={() => setShowZone4All(!showZone4All)}
                            className="text-xs font-bold text-[#4BB9EC] hover:underline">
                            {showZone4All ? 'Collapse' : `Show All ${zone.families.length}`} {showZone4All ? '↑' : '↓'}
                          </button>
                        )}
                      </div>
                      {/* Zone families */}
                      <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04)]'}`}>
                        <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                        {visibleFamilies.map(family => (
                          <FamilyPaymentCard key={family.email} family={family}
                            expanded={expandedCards.has(family.email)} onToggle={() => toggleCard(family.email)}
                            onMarkPaid={p => setShowMarkPaidModal(p)} onMarkUnpaid={handleMarkUnpaid}
                            onDeletePayment={p => setShowDeleteModal(p)} onSendReminder={f => setShowReminderModal(f)}
                            isSelected={selectedFamily?.email === family.email}
                            onSelect={() => setSelectedFamily(selectedFamily?.email === family.email ? null : family)}
                            zone={zone.key}
                            onBulkToggle={() => toggleBulkSelect(family.email)}
                            bulkSelected={selectedFamilyIds.has(family.email)}
                          />
                        ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Flat list (balance/name sort) */
              <div>
                {familyList.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No results found for "{searchQuery}"</div>
                ) : (
                  <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2] shadow-[0_1px_3px_rgba(16,40,76,0.04)]'}`}>
                    <div className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-[#E8ECF2]'}`}>
                      {familyList.map(family => (
                        <FamilyPaymentCard key={family.email} family={family}
                          expanded={expandedCards.has(family.email)} onToggle={() => toggleCard(family.email)}
                          onMarkPaid={p => setShowMarkPaidModal(p)} onMarkUnpaid={handleMarkUnpaid}
                          onDeletePayment={p => setShowDeleteModal(p)} onSendReminder={f => setShowReminderModal(f)}
                          isSelected={selectedFamily?.email === family.email}
                          onSelect={() => setSelectedFamily(selectedFamily?.email === family.email ? null : family)}
                          zone={classifyFamily(family)}
                          onBulkToggle={() => toggleBulkSelect(family.email)}
                          bulkSelected={selectedFamilyIds.has(family.email)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Family Detail Panel */}
          {selectedFamily && viewMode === 'family' && (
            <div className="w-[380px] shrink-0 hidden xl:block">
              <FamilyDetailPanel
                family={selectedFamily}
                onClose={() => setSelectedFamily(null)}
                onMarkPaid={p => setShowMarkPaidModal(p)}
                onMarkUnpaid={handleMarkUnpaid}
                onSendReminder={f => setShowReminderModal(f)}
                onAddFee={() => setShowAddModal(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedFamilyIds.size > 0 && (
        <div className={`sticky bottom-4 flex items-center gap-4 p-4 rounded-2xl shadow-lg z-30 ${
          isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-xl'
        }`} style={{ fontFamily: 'var(--v2-font)' }}>
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            {selectedFamilyIds.size} {selectedFamilyIds.size === 1 ? 'family' : 'families'} selected
          </span>
          <button onClick={() => setShowBlastModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition">
            Send Reminder
          </button>
          <button onClick={() => {
            const selectedPayments = payments.filter(p => selectedFamilyIds.has(p.family_email || p.players?.parent_email || 'unknown'))
            exportToCSV(selectedPayments, 'selected-payments', csvColumns)
          }}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`}>
            Export Ledger
          </button>
          <button onClick={() => setSelectedFamilyIds(new Set())}
            className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-300">
            Clear Selection
          </button>
        </div>
      )}

      {/* Detail panel overlay for smaller screens */}
      {selectedFamily && viewMode === 'family' && (
        <div className="xl:hidden">
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedFamily(null)} />
          <div className={`fixed right-0 top-0 h-screen w-[400px] z-50 shadow-2xl overflow-y-auto ${isDark ? 'bg-lynx-midnight' : 'bg-white'}`}>
            <FamilyDetailPanel
              family={selectedFamily}
              onClose={() => setSelectedFamily(null)}
              onMarkPaid={p => setShowMarkPaidModal(p)}
              onMarkUnpaid={handleMarkUnpaid}
              onSendReminder={f => setShowReminderModal(f)}
              onAddFee={() => setShowAddModal(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showMarkPaidModal && <MarkPaidModal payment={showMarkPaidModal} onConfirm={handleMarkPaid} onClose={() => setShowMarkPaidModal(null)} />}
      {showDeleteModal && <DeletePaymentModal payment={showDeleteModal} onConfirm={handleDeletePayment} onClose={() => setShowDeleteModal(null)} />}
      {showReminderModal && <SendReminderModal target={showReminderModal} onSend={handleSendReminder} onClose={() => setShowReminderModal(null)} />}
      {showBlastModal && <BlastReminderModal families={familyList} onSend={handleSendBlast} onClose={() => setShowBlastModal(false)} />}
      {showAddModal && <AddFeeModal players={players} onAdd={handleAddPayment} onClose={() => setShowAddModal(false)} />}
      </div>
    </PageShell>
  )
}
