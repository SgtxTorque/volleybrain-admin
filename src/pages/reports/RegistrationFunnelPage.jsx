import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  TrendingUp, Users, DollarSign, Clock, Filter, ChevronDown,
  CheckCircle2, XCircle, Eye, Activity, ArrowRight, Search,
  Calendar, BarChart3, AlertTriangle
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// REGISTRATION FUNNEL PAGE — Analytics Dashboard
// Tracks: Page Views → Form Started → Submitted → Approved → Paid
// Works with existing registration/payment data from day one
// ═══════════════════════════════════════════════════════════

const FNL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes growWidth{from{width:0}to{width:var(--target-w)}}
  .fnl-au{animation:fadeUp .4s ease-out both}
  .fnl-ai{animation:fadeIn .3s ease-out both}
  .fnl-as{animation:scaleIn .25s ease-out both}
  .fnl-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .fnl-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .fnl-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .fnl-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .fnl-nos::-webkit-scrollbar{display:none}.fnl-nos{-ms-overflow-style:none;scrollbar-width:none}
  .fnl-light .fnl-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .fnl-light .fnl-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
  .fnl-bar{animation:growWidth .6s ease-out both}
`

function RegistrationFunnelPage({ showToast }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { selectedSeason: globalSeason } = useSeason()
  const { organization } = useAuth()

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

  // Pipeline table
  const [pipelineFilter, setPipelineFilter] = useState('all')
  const [pipelineSearch, setPipelineSearch] = useState('')
  const [pipelineSort, setPipelineSort] = useState({ field: 'submitted_at', dir: 'desc' })

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

  // ═══════ COMPUTED METRICS ═══════
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

  // ═══════ FUNNEL STAGES ═══════
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

  // Pipeline filtering + sorting
  const filteredPipeline = useMemo(() => {
    let rows = [...metrics.pipeline]
    if (pipelineFilter !== 'all') rows = rows.filter(r => r.pipe_status === pipelineFilter)
    if (pipelineSearch) {
      const s = pipelineSearch.toLowerCase()
      rows = rows.filter(r => r.name.toLowerCase().includes(s) || r.parent_name.toLowerCase().includes(s) || r.parent_email.toLowerCase().includes(s))
    }
    rows.sort((a, b) => {
      const av = a[pipelineSort.field], bv = b[pipelineSort.field]
      if (av == null) return 1; if (bv == null) return -1
      return (av < bv ? -1 : 1) * (pipelineSort.dir === 'asc' ? 1 : -1)
    })
    return rows
  }, [metrics.pipeline, pipelineFilter, pipelineSearch, pipelineSort])

  const handlePipelineSort = (field) => {
    if (pipelineSort.field === field) setPipelineSort({ field, dir: pipelineSort.dir === 'asc' ? 'desc' : 'asc' })
    else setPipelineSort({ field, dir: 'asc' })
  }

  // ═══════ HELPERS ═══════
  const gc = { background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.7)', border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)', borderRadius: 16 }
  const gi = { background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)', border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)', borderRadius: 12, color: isDark ? 'white' : '#1a1a1a' }

  const formatTime = (ms) => {
    if (!ms) return '-'
    const hours = ms / (1000 * 60 * 60)
    if (hours < 1) return `${Math.round(ms / (1000 * 60))}m`
    if (hours < 24) return `${Math.round(hours)}h`
    return `${Math.round(hours / 24)}d`
  }

  const pipeStatusColors = {
    pending: { bg: 'rgba(245,158,11,.15)', text: '#f59e0b' },
    approved: { bg: 'rgba(16,185,129,.15)', text: '#10b981' },
    paid: { bg: 'rgba(6,182,212,.15)', text: '#06b6d4' },
    partial: { bg: 'rgba(139,92,246,.15)', text: '#8b5cf6' },
    unpaid: { bg: 'rgba(239,68,68,.15)', text: '#ef4444' },
    denied: { bg: 'rgba(239,68,68,.15)', text: '#ef4444' },
    waitlisted: { bg: 'rgba(245,158,11,.15)', text: '#f59e0b' },
    manual: { bg: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)', text: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)' },
    unknown: { bg: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)', text: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)' },
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId)

  // ═══════ RENDER ═══════
  return (
    <div className={`flex flex-col h-[calc(100vh-100px)] ${!isDark ? 'fnl-light' : ''}`} style={{ fontFamily: "'DM Sans', system-ui" }}>
      <style>{FNL_STYLES}</style>

      {/* HEADER */}
      <div className="px-6 py-5 fnl-glass-solid" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`fnl-display text-3xl font-bold ${tc.text}`}>REGISTRATION FUNNEL</h1>
            <p className={`text-sm mt-0.5 ${tc.textMuted}`}>Track your registration pipeline from views to payment</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className={`block text-[10px] font-bold fnl-heading tracking-wider mb-1 ${tc.textMuted}`}>DATE RANGE</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-3 py-2 text-sm rounded-xl outline-none min-w-[140px]" style={gi}>
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-bold fnl-heading tracking-wider mb-1 ${tc.textMuted}`}>SEASON</label>
              <select value={selectedSeasonId || ''} onChange={e => setSelectedSeasonId(e.target.value)} className="px-3 py-2 text-sm rounded-xl outline-none min-w-[180px]" style={gi}>
                <option value="">Select Season</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name} {s.status === 'active' ? '●' : s.status === 'upcoming' ? '○' : '◌'}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'funnel', label: 'Funnel Overview', icon: TrendingUp },
            { id: 'pipeline', label: 'Registration Pipeline', icon: Users },
            { id: 'trends', label: 'Trends & Sources', icon: BarChart3 },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab !== tab.id ? tc.text : ''}`}
              style={activeTab === tab.id ? { background: accent.primary, color: 'white', boxShadow: `0 2px 12px ${accent.primary}40` } : gc}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-auto p-6 fnl-nos">
        {!selectedSeasonId ? (
          <div className="flex-1 flex items-center justify-center h-full fnl-ai">
            <div className="text-center"><span className="text-6xl">📅</span><p className={`font-bold text-lg mt-4 ${tc.text}`}>Select a Season</p><p className={`mt-2 text-sm ${tc.textMuted}`}>Choose a season to view funnel analytics</p></div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
              <p className={`mt-3 text-sm ${tc.textMuted}`}>Loading funnel data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ═══════ FUNNEL OVERVIEW TAB ═══════ */}
            {activeTab === 'funnel' && (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                  {[
                    { label: 'Total Registered', value: metrics.totalRegistrations, icon: Users, color: '#6366f1' },
                    { label: 'Pending Review', value: metrics.pending, icon: Clock, color: '#f59e0b' },
                    { label: 'Approved', value: metrics.approved, icon: CheckCircle2, color: '#10b981' },
                    { label: 'Denied / Withdrawn', value: metrics.denied, icon: XCircle, color: '#ef4444' },
                    { label: 'Fully Paid', value: metrics.paid, icon: DollarSign, color: '#06b6d4' },
                    { label: 'Avg Approval Time', value: formatTime(metrics.avgApprovalTime), icon: Clock, color: '#8b5cf6', raw: true },
                  ].map((m, i) => (
                    <div key={m.label} className="p-4 rounded-xl fnl-au" style={{ ...gc, animationDelay: `${i * .05}s` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}20` }}>
                          <m.icon className="w-4 h-4" style={{ color: m.color }} />
                        </div>
                      </div>
                      <p className={`text-2xl font-bold ${tc.text}`}>{m.raw ? m.value : m.value.toLocaleString()}</p>
                      <p className={`text-[10px] font-bold fnl-heading tracking-wider mt-1 ${tc.textMuted}`}>{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Funnel Visualization */}
                <div className="p-6 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.15s' }}>
                  <h2 className={`fnl-heading text-lg font-bold mb-1 ${tc.text}`}>CONVERSION FUNNEL</h2>
                  <p className={`text-xs mb-6 ${tc.textMuted}`}>
                    {hasFunnelTable ? 'Full funnel tracking active' : 'Based on existing registration & payment data — run the SQL migration to enable full page view tracking'}
                  </p>

                  <div className="space-y-3">
                    {funnelStages.map((stage, i) => {
                      const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0
                      const prevCount = i > 0 ? funnelStages[i - 1].count : null
                      const dropoff = prevCount && prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : null
                      const convRate = prevCount && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : null

                      return (
                        <div key={stage.label}>
                          {/* Drop-off indicator between stages */}
                          {dropoff !== null && dropoff > 0 && (
                            <div className="flex items-center gap-2 ml-8 mb-1">
                              <ArrowRight className="w-3 h-3" style={{ color: dropoff > 50 ? '#ef4444' : dropoff > 25 ? '#f59e0b' : '#10b981' }} />
                              <span className="text-[11px] font-bold" style={{ color: dropoff > 50 ? '#ef4444' : dropoff > 25 ? '#f59e0b' : '#10b981' }}>
                                {convRate}% conversion · {dropoff}% drop-off
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stage.color}20` }}>
                              <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${tc.text}`}>{stage.label}</span>
                                <span className="text-sm font-bold tabular-nums" style={{ color: stage.color }}>{stage.count.toLocaleString()}</span>
                              </div>
                              <div className="w-full h-8 rounded-lg overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)' }}>
                                <div
                                  className="h-full rounded-lg fnl-bar"
                                  style={{ '--target-w': `${Math.max(pct, 2)}%`, width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}99)`, animationDelay: `${i * .1 + .2}s` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Overall conversion rate */}
                  {metrics.totalRegistrations > 0 && (
                    <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)' }}>
                      <span className={`text-sm font-bold ${tc.textMuted}`}>Overall Conversion (Submitted → Paid)</span>
                      <span className="text-lg font-bold" style={{ color: accent.primary }}>
                        {metrics.submitted > 0 ? Math.round((metrics.paid / metrics.submitted) * 100) : 0}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Revenue Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-5 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.25s' }}>
                    <p className={`text-[10px] font-bold fnl-heading tracking-wider ${tc.textMuted}`}>TOTAL EXPECTED</p>
                    <p className={`text-2xl font-bold mt-1 ${tc.text}`}>${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-5 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.3s' }}>
                    <p className={`text-[10px] font-bold fnl-heading tracking-wider ${tc.textMuted}`}>COLLECTED</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: '#10b981' }}>${metrics.collectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-5 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.35s' }}>
                    <p className={`text-[10px] font-bold fnl-heading tracking-wider ${tc.textMuted}`}>COLLECTION RATE</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: accent.primary }}>
                      {metrics.totalRevenue > 0 ? Math.round((metrics.collectedRevenue / metrics.totalRevenue) * 100) : 0}%
                    </p>
                  </div>
                </div>

                {/* Funnel table hint */}
                {!hasFunnelTable && (
                  <div className="p-4 rounded-xl flex items-start gap-3 fnl-ai" style={{ background: isDark ? 'rgba(245,158,11,.08)' : 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 16 }}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                    <div>
                      <p className={`text-sm font-bold ${tc.text}`}>Enable Full Funnel Tracking</p>
                      <p className={`text-xs mt-1 ${tc.textMuted}`}>
                        Run the <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>registration_funnel_events</code> SQL migration in Supabase to track page views, form starts, and step completions. Without it, the funnel shows submitted → approved → paid only.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════ PIPELINE TAB ═══════ */}
            {activeTab === 'pipeline' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${tc.textMuted}`} />
                      <input type="text" value={pipelineSearch} onChange={e => setPipelineSearch(e.target.value)} placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none" style={gi} />
                    </div>
                  </div>
                  <div>
                    <select value={pipelineFilter} onChange={e => setPipelineFilter(e.target.value)} className="px-3 py-2.5 text-sm rounded-xl outline-none" style={gi}>
                      <option value="all">All Status ({metrics.pipeline.length})</option>
                      <option value="pending">Pending ({metrics.pipeline.filter(r => r.pipe_status === 'pending').length})</option>
                      <option value="approved">Approved ({metrics.pipeline.filter(r => r.pipe_status === 'approved').length})</option>
                      <option value="unpaid">Unpaid ({metrics.pipeline.filter(r => r.pipe_status === 'unpaid').length})</option>
                      <option value="partial">Partial ({metrics.pipeline.filter(r => r.pipe_status === 'partial').length})</option>
                      <option value="paid">Paid ({metrics.pipeline.filter(r => r.pipe_status === 'paid').length})</option>
                      <option value="denied">Denied ({metrics.pipeline.filter(r => r.pipe_status === 'denied').length})</option>
                      <option value="manual">Manual ({metrics.pipeline.filter(r => r.pipe_status === 'manual').length})</option>
                    </select>
                  </div>
                </div>

                {/* Pipeline status summary bar */}
                {metrics.pipeline.length > 0 && (
                  <div className="p-4 rounded-xl fnl-ai" style={gc}>
                    <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)' }}>
                      {['paid', 'partial', 'approved', 'unpaid', 'pending', 'denied'].map(status => {
                        const count = metrics.pipeline.filter(r => r.pipe_status === status).length
                        const pct = (count / metrics.pipeline.length) * 100
                        if (pct === 0) return null
                        return <div key={status} className="h-full" style={{ width: `${pct}%`, background: pipeStatusColors[status]?.text }} title={`${status}: ${count}`} />
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {['paid', 'partial', 'approved', 'unpaid', 'pending', 'denied'].map(status => {
                        const count = metrics.pipeline.filter(r => r.pipe_status === status).length
                        if (count === 0) return null
                        return (
                          <button key={status} onClick={() => setPipelineFilter(pipelineFilter === status ? 'all' : status)}
                            className="flex items-center gap-1.5 text-xs font-bold" style={{ color: pipeStatusColors[status]?.text, opacity: pipelineFilter === 'all' || pipelineFilter === status ? 1 : .4 }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: pipeStatusColors[status]?.text }} />
                            {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="rounded-xl overflow-hidden" style={gc}>
                  {filteredPipeline.length === 0 ? (
                    <div className="p-12 text-center">
                      <span className="text-5xl">📭</span>
                      <p className={`font-bold mt-4 ${tc.text}`}>No registrations found</p>
                      <p className={`text-sm mt-1 ${tc.textMuted}`}>Try adjusting your filters</p>
                    </div>
                  ) : (
                    <div className="overflow-auto fnl-nos" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                      <table className="w-full">
                        <thead className="sticky top-0" style={{ background: isDark ? 'rgba(30,41,59,.95)' : 'rgba(248,250,252,.95)', backdropFilter: 'blur(8px)' }}>
                          <tr>
                            {[
                              { id: 'name', label: 'Player' },
                              { id: 'parent_name', label: 'Parent' },
                              { id: 'parent_email', label: 'Email' },
                              { id: 'submitted_at', label: 'Submitted' },
                              { id: 'pipe_status', label: 'Status' },
                              { id: 'total_due', label: 'Due' },
                              { id: 'total_paid', label: 'Paid' },
                              { id: 'balance', label: 'Balance' },
                            ].map(col => (
                              <th key={col.id} onClick={() => handlePipelineSort(col.id)}
                                className={`px-4 py-3 text-left text-[10px] font-bold fnl-heading tracking-wider cursor-pointer whitespace-nowrap ${tc.textMuted}`}>
                                {col.label}{pipelineSort.field === col.id && <span className="ml-1">{pipelineSort.dir === 'asc' ? '↑' : '↓'}</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPipeline.map((row, i) => (
                            <tr key={row.id} className="transition"
                              style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,.04)' : '1px solid rgba(0,0,0,.04)' }}
                              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.01)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <td className={`px-4 py-3 text-sm font-medium ${tc.text}`}>{row.name}</td>
                              <td className={`px-4 py-3 text-sm ${tc.text}`}>{row.parent_name}</td>
                              <td className={`px-4 py-3 text-sm ${tc.textMuted}`}>{row.parent_email}</td>
                              <td className={`px-4 py-3 text-sm ${tc.text}`}>
                                {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                                  style={{ background: pipeStatusColors[row.pipe_status]?.bg, color: pipeStatusColors[row.pipe_status]?.text }}>
                                  {row.pipe_status}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-sm tabular-nums ${tc.text}`}>{row.total_due > 0 ? `$${row.total_due.toFixed(2)}` : '-'}</td>
                              <td className="px-4 py-3 text-sm tabular-nums" style={{ color: '#10b981' }}>{row.total_paid > 0 ? `$${row.total_paid.toFixed(2)}` : '-'}</td>
                              <td className={`px-4 py-3 text-sm font-bold tabular-nums ${row.balance > 0 ? 'text-red-500' : tc.textMuted}`}>{row.balance > 0 ? `$${row.balance.toFixed(2)}` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)', background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.01)' }}>
                    <p className={`text-sm ${tc.textMuted}`}>Showing {filteredPipeline.length} of {metrics.pipeline.length} registrations</p>
                    <p className={`text-xs ${tc.textMuted}`}>{organization?.name} • {selectedSeason?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ TRENDS TAB ═══════ */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                {/* Registrations Over Time */}
                <div className="p-6 rounded-xl fnl-au" style={gc}>
                  <h2 className={`fnl-heading text-lg font-bold mb-1 ${tc.text}`}>REGISTRATIONS OVER TIME</h2>
                  <p className={`text-xs mb-5 ${tc.textMuted}`}>Weekly registration volume</p>

                  {metrics.timeline.length === 0 ? (
                    <div className="py-12 text-center">
                      <span className="text-4xl">📊</span>
                      <p className={`mt-3 text-sm ${tc.textMuted}`}>No timeline data available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const maxCount = Math.max(...metrics.timeline.map(t => t.count), 1)
                        return metrics.timeline.map((t, i) => {
                          const pct = (t.count / maxCount) * 100
                          const d = new Date(t.date)
                          return (
                            <div key={t.date} className="flex items-center gap-3">
                              <span className={`text-[11px] tabular-nums w-20 text-right flex-shrink-0 ${tc.textMuted}`}>
                                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)' }}>
                                <div className="h-full rounded-md fnl-bar" style={{ '--target-w': `${Math.max(pct, 3)}%`, width: `${Math.max(pct, 3)}%`, background: accent.primary, animationDelay: `${i * .03}s` }} />
                              </div>
                              <span className={`text-xs font-bold tabular-nums w-8 ${tc.text}`}>{t.count}</span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>

                {/* Source Breakdown + Payment Rate side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source Breakdown */}
                  <div className="p-6 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.1s' }}>
                    <h2 className={`fnl-heading text-lg font-bold mb-1 ${tc.text}`}>TRAFFIC SOURCES</h2>
                    <p className={`text-xs mb-5 ${tc.textMuted}`}>Where registrants come from</p>

                    {!hasFunnelTable || Object.keys(metrics.sources).length === 0 ? (
                      <div className="py-8 text-center">
                        <span className="text-4xl">🔗</span>
                        <p className={`mt-3 text-sm ${tc.textMuted}`}>
                          {hasFunnelTable ? 'No source data yet — traffic sources will appear as registrations come in' : 'Enable funnel tracking to see traffic sources'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const entries = Object.entries(metrics.sources).sort((a, b) => b[1] - a[1])
                          const total = entries.reduce((s, [, v]) => s + v, 0)
                          const sourceColors = { direct: '#6366f1', directory: '#10b981', invite_link: '#f59e0b', qr_code: '#06b6d4' }
                          return entries.map(([source, count]) => {
                            const pct = Math.round((count / total) * 100)
                            return (
                              <div key={source}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm font-bold capitalize ${tc.text}`}>{source.replace(/_/g, ' ')}</span>
                                  <span className="text-xs font-bold" style={{ color: sourceColors[source] || accent.primary }}>{count} ({pct}%)</span>
                                </div>
                                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)' }}>
                                  <div className="h-full rounded-full fnl-bar" style={{ '--target-w': `${pct}%`, width: `${pct}%`, background: sourceColors[source] || accent.primary }} />
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Payment Completion Breakdown */}
                  <div className="p-6 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.15s' }}>
                    <h2 className={`fnl-heading text-lg font-bold mb-1 ${tc.text}`}>PAYMENT STATUS</h2>
                    <p className={`text-xs mb-5 ${tc.textMuted}`}>Breakdown of payment completion</p>

                    {metrics.totalRegistrations === 0 ? (
                      <div className="py-8 text-center">
                        <span className="text-4xl">💳</span>
                        <p className={`mt-3 text-sm ${tc.textMuted}`}>No registration data yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[
                          { label: 'Fully Paid', count: metrics.paid, color: '#06b6d4' },
                          { label: 'Partially Paid', count: metrics.partialPaid, color: '#8b5cf6' },
                          { label: 'Approved, Unpaid', count: metrics.pipeline.filter(r => r.pipe_status === 'unpaid').length, color: '#ef4444' },
                          { label: 'Pending Approval', count: metrics.pending, color: '#f59e0b' },
                        ].filter(s => s.count > 0).map(s => {
                          const pct = Math.round((s.count / metrics.totalRegistrations) * 100)
                          return (
                            <div key={s.label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${tc.text}`}>{s.label}</span>
                                <span className="text-xs font-bold" style={{ color: s.color }}>{s.count} ({pct}%)</span>
                              </div>
                              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)' }}>
                                <div className="h-full rounded-full fnl-bar" style={{ '--target-w': `${pct}%`, width: `${pct}%`, background: s.color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Season Comparison */}
                {seasons.length > 1 && (
                  <div className="p-6 rounded-xl fnl-au" style={{ ...gc, animationDelay: '.2s' }}>
                    <h2 className={`fnl-heading text-lg font-bold mb-1 ${tc.text}`}>SEASON COMPARISON</h2>
                    <p className={`text-xs mb-5 ${tc.textMuted}`}>Registration counts across seasons (selected season highlighted)</p>

                    <SeasonComparisonChart
                      seasons={seasons}
                      selectedSeasonId={selectedSeasonId}
                      orgId={organization?.id}
                      isDark={isDark}
                      accent={accent}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ═══════ SEASON COMPARISON SUB-COMPONENT ═══════
function SeasonComparisonChart({ seasons, selectedSeasonId, orgId, isDark, accent }) {
  const tc = useThemeClasses()
  const [seasonCounts, setSeasonCounts] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadCounts()
  }, [orgId])

  async function loadCounts() {
    const counts = {}
    for (const s of seasons.slice(0, 6)) {
      const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('season_id', s.id)
      counts[s.id] = count || 0
    }
    setSeasonCounts(counts)
    setLoaded(true)
  }

  if (!loaded) return <div className="py-6 text-center"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} /></div>

  const maxCount = Math.max(...Object.values(seasonCounts), 1)

  return (
    <div className="space-y-2">
      {seasons.slice(0, 6).map(s => {
        const count = seasonCounts[s.id] || 0
        const pct = (count / maxCount) * 100
        const isSelected = s.id === selectedSeasonId
        return (
          <div key={s.id} className="flex items-center gap-3">
            <span className={`text-[11px] w-32 text-right flex-shrink-0 truncate ${isSelected ? 'font-bold' : tc.textMuted}`} style={isSelected ? { color: accent.primary } : undefined}>{s.name}</span>
            <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)' }}>
              <div className="h-full rounded-md fnl-bar" style={{ '--target-w': `${Math.max(pct, 3)}%`, width: `${Math.max(pct, 3)}%`, background: isSelected ? accent.primary : isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)' }} />
            </div>
            <span className={`text-xs font-bold tabular-nums w-8 ${isSelected ? '' : tc.text}`} style={isSelected ? { color: accent.primary } : undefined}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export { RegistrationFunnelPage }
