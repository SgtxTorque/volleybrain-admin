import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  TrendingUp, Users, DollarSign, ClipboardList,
  RefreshCw, ArrowRight, ChevronDown, ChevronUp, Building2
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM REGISTRATION FUNNEL — Cross-Org Conversion Analytics
// P3-3: Platform-wide view of registration conversion
// ═══════════════════════════════════════════════════════════

const FUNNEL_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes growWidth{from{width:0}to{width:var(--target-w,100%)}}
  .fn-au{animation:fadeUp .4s ease-out both}
  .fn-glass{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
  .fn-light .fn-glass{background:#fff;border-color:#E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .fn-hbar{animation:growWidth .6s ease-out both}
`

const FUNNEL_COLORS = ['#3B82F6', '#8B5CF6', '#EAB308', '#10B981', '#06B6D4']

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return (n || 0).toString()
}

function getMonthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ═══════ FUNNEL STAGE VISUAL ═══════
function FunnelStage({ label, count, prevCount, color, isDark, index, isLast }) {
  const convRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 100
  const dropOff = prevCount > 0 ? prevCount - count : 0

  return (
    <div className="flex items-center gap-2 fn-au" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(count)}</span>
            {index > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                convRate >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                convRate >= 50 ? 'bg-amber-500/15 text-amber-400' :
                'bg-red-500/15 text-red-400'
              }`}>
                {convRate}%
              </span>
            )}
          </div>
        </div>
        <div className={`h-8 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'} overflow-hidden`}>
          <div
            className="h-full rounded-lg fn-hbar transition-all"
            style={{
              '--target-w': `${Math.max((count / (prevCount || count || 1)) * 100, 3)}%`,
              width: `${Math.max((count / (prevCount || count || 1)) * 100, 3)}%`,
              background: `linear-gradient(to right, ${color}, ${color}90)`,
              animationDelay: `${index * 100}ms`,
            }}
          />
        </div>
        {index > 0 && dropOff > 0 && (
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-red-400/60' : 'text-red-500/60'}`}>
            -{formatNumber(dropOff)} drop-off
          </p>
        )}
      </div>
      {!isLast && (
        <ArrowRight className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
      )}
    </div>
  )
}

// ═══════ MAIN PAGE ═══════
export default function PlatformRegistrationFunnel({ showToast }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Funnel data
  const [funnelStages, setFunnelStages] = useState([])
  const [orgFunnels, setOrgFunnels] = useState([])
  const [monthlyComparison, setMonthlyComparison] = useState({ thisMonth: [], lastMonth: [] })
  const [sortBy, setSortBy] = useState('conversion') // 'conversion' | 'registered' | 'name'
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([
        loadPlatformFunnel(),
        loadOrgFunnels(),
        loadMonthlyComparison(),
      ])
    } catch (err) {
      console.error('Registration funnel load error:', err)
    }
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
    showToast?.('Funnel data refreshed', 'success')
  }

  // ── Platform-Wide Funnel ──
  async function loadPlatformFunnel() {
    const [
      { count: registered },
      { count: approved },
      { count: waiverSigned },
      { count: paid },
      { count: rostered },
    ] = await Promise.all([
      supabase.from('registrations').select('*', { count: 'exact', head: true }),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('waiver_signatures').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('paid', true),
      supabase.from('team_players').select('*', { count: 'exact', head: true }),
    ])

    setFunnelStages([
      { id: 'registered', label: 'Registered', count: registered || 0 },
      { id: 'approved', label: 'Approved', count: approved || 0 },
      { id: 'waiver_signed', label: 'Waiver Signed', count: waiverSigned || 0 },
      { id: 'paid', label: 'Paid', count: paid || 0 },
      { id: 'rostered', label: 'Rostered', count: rostered || 0 },
    ])
  }

  // ── Per-Org Funnel ──
  async function loadOrgFunnels() {
    const { data: orgs } = await supabase.from('organizations')
      .select('id, name')
      .eq('is_active', true)
      .limit(500)

    if (!orgs || orgs.length === 0) { setOrgFunnels([]); return }

    const { data: seasons } = await supabase.from('seasons').select('id, organization_id').limit(10000)
    const seasonOrgMap = {}
    const orgSeasons = {}
    for (const s of (seasons || [])) {
      seasonOrgMap[s.id] = s.organization_id
      if (!orgSeasons[s.organization_id]) orgSeasons[s.organization_id] = []
      orgSeasons[s.organization_id].push(s.id)
    }

    // Get counts per org
    const { data: regs } = await supabase.from('registrations').select('season_id, status').limit(50000)
    const { data: payments } = await supabase.from('payments').select('season_id, paid').limit(50000)
    const { data: teamPlayers } = await supabase.from('team_players').select('team_id').limit(50000)
    const { data: teams } = await supabase.from('teams').select('id, season_id').limit(50000)

    const teamSeasonMap = {}
    for (const t of (teams || [])) teamSeasonMap[t.id] = t.season_id

    // Aggregate per org
    const orgData = {}
    for (const org of orgs) {
      orgData[org.id] = { id: org.id, name: org.name, registered: 0, approved: 0, paid: 0, rostered: 0 }
    }

    for (const r of (regs || [])) {
      const orgId = seasonOrgMap[r.season_id]
      if (orgId && orgData[orgId]) {
        orgData[orgId].registered++
        if (r.status === 'approved') orgData[orgId].approved++
      }
    }

    for (const p of (payments || [])) {
      const orgId = seasonOrgMap[p.season_id]
      if (orgId && orgData[orgId] && p.paid) {
        orgData[orgId].paid++
      }
    }

    for (const tp of (teamPlayers || [])) {
      const seasonId = teamSeasonMap[tp.team_id]
      const orgId = seasonOrgMap[seasonId]
      if (orgId && orgData[orgId]) {
        orgData[orgId].rostered++
      }
    }

    // Compute conversion rate
    const funnels = Object.values(orgData)
      .filter(o => o.registered > 0)
      .map(o => ({
        ...o,
        conversion: o.registered > 0 ? Math.round((o.rostered / o.registered) * 100) : 0,
      }))

    setOrgFunnels(funnels)
  }

  // ── Monthly Comparison ──
  async function loadMonthlyComparison() {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastMonthEnd = thisMonthStart

    const [
      { count: thisReg },
      { count: thisApproved },
      { count: thisPaid },
      { count: thisRostered },
      { count: lastReg },
      { count: lastApproved },
      { count: lastPaid },
      { count: lastRostered },
    ] = await Promise.all([
      supabase.from('registrations').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', thisMonthStart),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('paid', true).gte('created_at', thisMonthStart),
      supabase.from('team_players').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('paid', true).gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
      supabase.from('team_players').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    ])

    setMonthlyComparison({
      thisMonth: [
        { label: 'Registered', count: thisReg || 0 },
        { label: 'Approved', count: thisApproved || 0 },
        { label: 'Paid', count: thisPaid || 0 },
        { label: 'Rostered', count: thisRostered || 0 },
      ],
      lastMonth: [
        { label: 'Registered', count: lastReg || 0 },
        { label: 'Approved', count: lastApproved || 0 },
        { label: 'Paid', count: lastPaid || 0 },
        { label: 'Rostered', count: lastRostered || 0 },
      ],
    })
  }

  // Sorted org funnels
  const sortedOrgFunnels = [...orgFunnels].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'name') return dir * a.name.localeCompare(b.name)
    if (sortBy === 'registered') return dir * (a.registered - b.registered)
    return dir * (a.conversion - b.conversion)
  })

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const SortIcon = sortDir === 'asc' ? ChevronUp : ChevronDown

  return (
    <div className={`${isDark ? '' : 'fn-light'}`}>
      <style>{FUNNEL_STYLES}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 fn-au">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Registration Funnel</h2>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Platform-wide registration conversion analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`p-2.5 rounded-xl transition ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-500'} border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 fn-au">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
          <p className={tc.textMuted}>Loading funnel data...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ═══ PLATFORM-WIDE FUNNEL ═══ */}
          <div className="fn-glass rounded-xl p-6 fn-au">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4" style={{ color: '#3B82F6' }} />
              <h3 className={`text-sm uppercase ${tc.textMuted}`}>Platform-Wide Funnel</h3>
              {funnelStages.length >= 2 && (
                <span className={`text-[10px] ml-auto font-bold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
                }`}>
                  Overall: {funnelStages[0].count > 0
                    ? Math.round((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100)
                    : 0}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {funnelStages.map((stage, i) => (
                <FunnelStage
                  key={stage.id}
                  label={stage.label}
                  count={stage.count}
                  prevCount={i === 0 ? stage.count : funnelStages[0].count}
                  color={FUNNEL_COLORS[i]}
                  isDark={isDark}
                  index={i}
                  isLast={i === funnelStages.length - 1}
                />
              ))}
            </div>
          </div>

          {/* ═══ MONTHLY COMPARISON ═══ */}
          <div className="fn-glass rounded-xl p-6 fn-au" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList className="w-4 h-4" style={{ color: '#A855F7' }} />
              <h3 className={`text-sm uppercase ${tc.textMuted}`}>Monthly Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={`text-[10px] uppercase text-left pb-3 pr-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Stage</th>
                    <th className={`text-[10px] uppercase text-center pb-3 px-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>This Month</th>
                    <th className={`text-[10px] uppercase text-center pb-3 px-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Last Month</th>
                    <th className={`text-[10px] uppercase text-center pb-3 pl-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyComparison.thisMonth.map((stage, i) => {
                    const lastVal = monthlyComparison.lastMonth[i]?.count || 0
                    const diff = stage.count - lastVal
                    return (
                      <tr key={i} className={`${isDark ? 'border-white/[0.03]' : 'border-slate-100'} border-t`}>
                        <td className={`py-2.5 pr-4 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{stage.label}</td>
                        <td className={`py-2.5 text-center font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(stage.count)}</td>
                        <td className={`py-2.5 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatNumber(lastVal)}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs font-bold ${
                            diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : (isDark ? 'text-slate-500' : 'text-slate-400')
                          }`}>
                            {diff > 0 ? `\u2191${diff}` : diff < 0 ? `\u2193${Math.abs(diff)}` : '\u2014'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ PER-ORG FUNNEL BREAKDOWN ═══ */}
          <div className="fn-glass rounded-xl p-6 fn-au" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4" style={{ color: '#10B981' }} />
              <h3 className={`text-sm uppercase ${tc.textMuted}`}>Funnel by Organization</h3>
              <span className={`text-[10px] ml-auto ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                {orgFunnels.length} orgs with registrations
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th
                      className={`text-[10px] uppercase text-left pb-3 pr-4 cursor-pointer hover:text-sky-400 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}
                      onClick={() => toggleSort('name')}
                    >
                      Organization {sortBy === 'name' && <SortIcon className="w-3 h-3 inline" />}
                    </th>
                    <th
                      className={`text-[10px] uppercase text-center pb-3 px-2 cursor-pointer hover:text-sky-400 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}
                      onClick={() => toggleSort('registered')}
                    >
                      Registered {sortBy === 'registered' && <SortIcon className="w-3 h-3 inline" />}
                    </th>
                    <th className={`text-[10px] uppercase text-center pb-3 px-2 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Approved</th>
                    <th className={`text-[10px] uppercase text-center pb-3 px-2 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Paid</th>
                    <th className={`text-[10px] uppercase text-center pb-3 px-2 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Rostered</th>
                    <th
                      className={`text-[10px] uppercase text-center pb-3 pl-2 cursor-pointer hover:text-sky-400 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}
                      onClick={() => toggleSort('conversion')}
                    >
                      Conv % {sortBy === 'conversion' && <SortIcon className="w-3 h-3 inline" />}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrgFunnels.length === 0 ? (
                    <tr><td colSpan={6} className={`py-6 text-center text-xs ${isDark ? 'text-slate-600' : 'text-lynx-slate'}`}>No registration data</td></tr>
                  ) : sortedOrgFunnels.map((org, i) => (
                    <tr key={org.id} className={`${isDark ? 'border-white/[0.03]' : 'border-slate-100'} border-t`}>
                      <td className={`py-2.5 pr-4 font-medium truncate max-w-[200px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{org.name}</td>
                      <td className={`py-2.5 text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{org.registered}</td>
                      <td className={`py-2.5 text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{org.approved}</td>
                      <td className={`py-2.5 text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{org.paid}</td>
                      <td className={`py-2.5 text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{org.rostered}</td>
                      <td className="py-2.5 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          org.conversion >= 75 ? 'bg-emerald-500/15 text-emerald-400' :
                          org.conversion >= 50 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {org.conversion}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
