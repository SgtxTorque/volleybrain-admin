import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  TrendingUp, Users, DollarSign, Clock,
  CheckCircle2, Eye, Activity, BarChart3, Calendar
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import FunnelOverviewTab from './FunnelOverviewTab'
import PipelineTab from './PipelineTab'
import TrendsTab from './TrendsTab'

// ============================================
// REGISTRATION FUNNEL PAGE - Analytics Dashboard
// Tracks: Page Views > Form Started > Submitted > Approved > Paid
// Works with existing registration/payment data from day one
// ============================================

const FNL_STYLES = `
  @keyframes growWidth{from{width:0}to{width:var(--target-w)}}
  .fnl-bar{animation:growWidth .6s ease-out both}
`

function RegistrationFunnelPage({ showToast }) {
  const { isDark } = useTheme()
  const { selectedSeason: globalSeason } = useSeason()
  const { organization } = useAuth()

  const inputCls = isDark
    ? 'bg-white/[0.04] border border-white/[0.06] text-white placeholder-slate-500'
    : 'bg-white border border-slate-200 text-slate-700 placeholder-slate-400'

  const [seasons, setSeasons] = useState([])
  const [selectedSeasonId, setSelectedSeasonId] = useState(null)
  const [dateRange, setDateRange] = useState('all')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('funnel')

  // Raw data
  const [players, setPlayers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [payments, setPayments] = useState([])
  const [funnelEvents, setFunnelEvents] = useState([])
  const [hasFunnelTable, setHasFunnelTable] = useState(false)

  useEffect(() => { loadSeasons() }, [organization?.id])
  useEffect(() => { if (globalSeason?.id && !selectedSeasonId) setSelectedSeasonId(globalSeason.id) }, [globalSeason?.id])
  useEffect(() => { if (selectedSeasonId) loadAllData() }, [selectedSeasonId, dateRange])

  async function loadSeasons() {
    if (!organization?.id) return
    const { data } = await supabase.from('seasons').select('id, name, status, start_date, end_date')
      .eq('organization_id', organization.id).order('start_date', { ascending: false })
    setSeasons(data || [])
  }

  async function loadAllData() {
    setLoading(true)
    try {
      const seasonFilter = selectedSeasonId

      // Load players for this season
      const { data: p } = await supabase.from('players')
        .select('id, first_name, last_name, parent_name, parent_email, status, created_at')
        .eq('season_id', seasonFilter).order('created_at', { ascending: false })
      setPlayers(p || [])

      // Load registrations for these players
      const playerIds = (p || []).map(x => x.id)
      let regs = []
      if (playerIds.length > 0) {
        const { data: r } = await supabase.from('registrations')
          .select('id, player_id, status, submitted_at, approved_at, denied_at, deny_reason, created_at')
          .in('player_id', playerIds)
        regs = r || []
      }
      setRegistrations(regs)

      // Load payments for this season
      const { data: pay } = await supabase.from('payments')
        .select('id, player_id, amount, paid, paid_at, created_at')
        .eq('season_id', seasonFilter)
      setPayments(pay || [])

      // Try loading funnel events (table may not exist yet)
      try {
        const { data: fe, error } = await supabase.from('registration_funnel_events')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('season_id', seasonFilter)
          .order('created_at', { ascending: false })
        if (!error) {
          setFunnelEvents(fe || [])
          setHasFunnelTable(true)
        } else {
          setFunnelEvents([])
          setHasFunnelTable(false)
        }
      } catch {
        setFunnelEvents([])
        setHasFunnelTable(false)
      }
    } catch (err) {
      console.error('Funnel data load error:', err)
    }
    setLoading(false)
  }

  // ============================================
  // COMPUTED METRICS
  // ============================================
  const metrics = useMemo(() => {
    const regMap = {}
    registrations.forEach(r => { regMap[r.player_id] = r })
    const payMap = {}
    payments.forEach(p => {
      if (!payMap[p.player_id]) payMap[p.player_id] = []
      payMap[p.player_id].push(p)
    })

    // Date filter
    const now = new Date()
    const cutoff = dateRange === '7d' ? new Date(now - 7 * 86400000) :
                   dateRange === '30d' ? new Date(now - 30 * 86400000) :
                   dateRange === '90d' ? new Date(now - 90 * 86400000) : null

    const filteredPlayers = cutoff
      ? players.filter(p => new Date(p.created_at) >= cutoff)
      : players

    // Funnel stages from existing data
    const pageViews = hasFunnelTable ? funnelEvents.filter(e => e.event_type === 'page_view').length : null
    const formStarts = hasFunnelTable ? funnelEvents.filter(e => e.event_type === 'form_started').length : null
    const totalRegistrations = filteredPlayers.length
    const submitted = filteredPlayers.filter(p => {
      const reg = regMap[p.id]
      return reg && ['new', 'submitted', 'pending', 'approved', 'active', 'waitlisted', 'withdrawn'].includes(reg.status)
    }).length
    const approved = filteredPlayers.filter(p => {
      const reg = regMap[p.id]
      return reg && ['approved', 'active'].includes(reg.status)
    }).length
    const denied = filteredPlayers.filter(p => {
      const reg = regMap[p.id]
      return reg && ['withdrawn', 'denied'].includes(reg.status)
    }).length
    const pending = filteredPlayers.filter(p => {
      const reg = regMap[p.id]
      return reg && ['new', 'submitted', 'pending'].includes(reg.status)
    }).length
    const paid = filteredPlayers.filter(p => {
      const pp = payMap[p.id] || []
      const totalDue = pp.reduce((s, x) => s + (x.amount || 0), 0)
      const totalPaid = pp.filter(x => x.paid).reduce((s, x) => s + (x.amount || 0), 0)
      return totalDue > 0 && totalPaid >= totalDue
    }).length
    const partialPaid = filteredPlayers.filter(p => {
      const pp = payMap[p.id] || []
      const totalDue = pp.reduce((s, x) => s + (x.amount || 0), 0)
      const totalPaid = pp.filter(x => x.paid).reduce((s, x) => s + (x.amount || 0), 0)
      return totalDue > 0 && totalPaid > 0 && totalPaid < totalDue
    }).length

    // Revenue
    const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0)
    const collectedRevenue = payments.filter(p => p.paid).reduce((s, p) => s + (p.amount || 0), 0)

    // Avg time to complete (submitted_at to approved_at)
    let totalTime = 0, timeCount = 0
    registrations.forEach(r => {
      if (r.submitted_at && r.approved_at) {
        totalTime += new Date(r.approved_at) - new Date(r.submitted_at)
        timeCount++
      }
    })
    const avgApprovalTime = timeCount > 0 ? totalTime / timeCount : 0

    // Registrations over time (by week)
    const byWeek = {}
    filteredPlayers.forEach(p => {
      const d = new Date(p.created_at)
      const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
      const key = weekStart.toISOString().split('T')[0]
      byWeek[key] = (byWeek[key] || 0) + 1
    })
    const timeline = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))

    // Source breakdown from funnel events
    const sources = {}
    funnelEvents.filter(e => e.event_type === 'page_view' && e.source).forEach(e => {
      sources[e.source] = (sources[e.source] || 0) + 1
    })

    // Build pipeline rows
    const pipeline = filteredPlayers.map(p => {
      const reg = regMap[p.id]
      const pp = payMap[p.id] || []
      const totalDue = pp.reduce((s, x) => s + (x.amount || 0), 0)
      const totalPaid = pp.filter(x => x.paid).reduce((s, x) => s + (x.amount || 0), 0)
      let pipeStatus = 'unknown'
      if (reg) {
        if (['new', 'submitted', 'pending'].includes(reg.status)) pipeStatus = 'pending'
        else if (['approved', 'active'].includes(reg.status)) {
          if (totalDue === 0) pipeStatus = 'approved'
          else if (totalPaid >= totalDue) pipeStatus = 'paid'
          else if (totalPaid > 0) pipeStatus = 'partial'
          else pipeStatus = 'unpaid'
        }
        else if (['withdrawn', 'denied'].includes(reg.status)) pipeStatus = 'denied'
        else if (reg.status === 'waitlisted') pipeStatus = 'waitlisted'
      } else {
        pipeStatus = 'manual'
      }
      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        parent_name: p.parent_name || '-',
        parent_email: p.parent_email || '-',
        submitted_at: reg?.submitted_at || p.created_at,
        approved_at: reg?.approved_at || null,
        reg_status: reg?.status || 'manual',
        pipe_status: pipeStatus,
        total_due: totalDue,
        total_paid: totalPaid,
        balance: totalDue - totalPaid,
      }
    })

    return {
      pageViews, formStarts, totalRegistrations, submitted, approved, denied,
      pending, paid, partialPaid, totalRevenue, collectedRevenue, avgApprovalTime,
      timeline, sources, pipeline
    }
  }, [players, registrations, payments, funnelEvents, dateRange, hasFunnelTable])

  // ============================================
  // FUNNEL STAGES
  // ============================================
  const funnelStages = useMemo(() => {
    const stages = []
    if (metrics.pageViews !== null) {
      stages.push({ label: 'Page Views', count: metrics.pageViews, color: '#6366f1', icon: Eye })
    }
    if (metrics.formStarts !== null) {
      stages.push({ label: 'Form Started', count: metrics.formStarts, color: '#8b5cf6', icon: Activity })
    }
    stages.push({ label: 'Submitted', count: metrics.submitted, color: '#f59e0b', icon: Clock })
    stages.push({ label: 'Approved', count: metrics.approved, color: '#10b981', icon: CheckCircle2 })
    stages.push({ label: 'Fully Paid', count: metrics.paid, color: '#06b6d4', icon: DollarSign })
    return stages
  }, [metrics])

  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1)

  const formatTime = (ms) => {
    if (!ms) return '-'
    const hours = ms / (1000 * 60 * 60)
    if (hours < 1) return `${Math.round(ms / (1000 * 60))}m`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId)

  // ============================================
  // Tab config
  // ============================================
  const tabs = [
    { id: 'funnel', label: 'Funnel Overview', icon: TrendingUp },
    { id: 'pipeline', label: 'Registration Pipeline', icon: Users },
    { id: 'trends', label: 'Trends & Sources', icon: BarChart3 },
  ]

  // ============================================
  // No season selected state
  // ============================================
  if (!selectedSeasonId) {
    return (
      <PageShell title="Registration Funnel" subtitle="Select a season to view funnel analytics" breadcrumb="Insights">
        <style>{FNL_STYLES}</style>
        <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] p-12 text-center`}>
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <p className={`text-r-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Select a Season</p>
          <p className="text-r-sm text-slate-400 mt-2">Choose a season to view funnel analytics</p>
          <select value="" onChange={e => setSelectedSeasonId(e.target.value)}
            className={`mt-4 px-4 py-2.5 text-r-sm rounded-lg outline-none focus:ring-1 focus:ring-lynx-sky/30 ${inputCls}`}>
            <option value="">Select Season</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </PageShell>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <PageShell
      title="Registration Funnel"
      subtitle={`Track your registration pipeline from views to payment${selectedSeason ? ` / ${selectedSeason.name}` : ''}`}
      breadcrumb="Insights"
      actions={
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold tracking-wider mb-1 text-slate-400">DATE RANGE</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className={`px-3 py-2 text-r-sm rounded-lg outline-none min-w-[140px] focus:ring-1 focus:ring-lynx-sky/30 ${inputCls}`}>
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-wider mb-1 text-slate-400">SEASON</label>
            <select value={selectedSeasonId || ''} onChange={e => setSelectedSeasonId(e.target.value)}
              className={`px-3 py-2 text-r-sm rounded-lg outline-none min-w-[180px] focus:ring-1 focus:ring-lynx-sky/30 ${inputCls}`}>
              <option value="">Select Season</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      }
    >
      <style>{FNL_STYLES}</style>

      {/* InnerStatRow */}
      <InnerStatRow stats={[
        { value: metrics.pageViews != null ? metrics.pageViews : '-', label: 'VIEWS', icon: '👁' },
        { value: metrics.formStarts != null ? metrics.formStarts : '-', label: 'STARTS', icon: '📝' },
        { value: metrics.submitted, label: 'COMPLETIONS', icon: '✅' },
        { value: metrics.approved, label: 'APPROVED', icon: '🎯' },
      ]} />

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-bold text-r-sm transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-lynx-sky/20 text-lynx-sky'
                : isDark
                  ? 'bg-white/[0.04] border border-white/[0.06] text-white hover:bg-white/[0.06]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-r-sm text-slate-400">Loading funnel data...</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'funnel' && (
            <FunnelOverviewTab
              metrics={metrics}
              funnelStages={funnelStages}
              maxFunnel={maxFunnel}
              hasFunnelTable={hasFunnelTable}
              formatTime={formatTime}
            />
          )}
          {activeTab === 'pipeline' && (
            <PipelineTab
              metrics={metrics}
              organization={organization}
              selectedSeason={selectedSeason}
            />
          )}
          {activeTab === 'trends' && (
            <TrendsTab
              metrics={metrics}
              hasFunnelTable={hasFunnelTable}
              seasons={seasons}
              selectedSeasonId={selectedSeasonId}
              organization={organization}
            />
          )}
        </>
      )}
    </PageShell>
  )
}

export { RegistrationFunnelPage }
