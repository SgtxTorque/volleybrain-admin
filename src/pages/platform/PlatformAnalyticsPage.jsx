import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Shield, Building2, Users, DollarSign, TrendingUp, Calendar, Activity,
  BarChart3, PieChart, Clock, ChevronDown, RefreshCw, AlertTriangle,
  Star, Target, LineChart
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM ANALYTICS PAGE — Deep Metrics for Super-Admins
// Glassmorphism Design — CSS-only charts (no recharts)
// ═══════════════════════════════════════════════════════════

const AN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes growWidth{from{width:0}to{width:var(--target-w,100%)}}
  @keyframes growHeight{from{height:0}to{height:var(--target-h,100%)}}
  .an-au{animation:fadeUp .4s ease-out both}
  .an-ai{animation:fadeIn .3s ease-out both}
  .an-as{animation:scaleIn .25s ease-out both}
  .an-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .an-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .an-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .an-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .an-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .an-light .an-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .an-light .an-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
  .an-bar{animation:growHeight .6s ease-out both}
  .an-hbar{animation:growWidth .6s ease-out both}
`

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: '90d', label: 'Last 90 Days', days: 90 },
  { id: 'year', label: 'This Year', days: null },
  { id: 'all', label: 'All Time', days: null },
]

const CHART_COLORS = ['#EAB308','#3B82F6','#10B981','#F97316','#A855F7','#EF4444','#06B6D4','#EC4899','#22C55E','#78716C']

function getDateRange(rangeId) {
  const now = new Date()
  if (rangeId === 'all') return null
  if (rangeId === 'year') {
    return new Date(now.getFullYear(), 0, 1).toISOString()
  }
  const range = DATE_RANGES.find(r => r.id === rangeId)
  if (range?.days) {
    const d = new Date()
    d.setDate(d.getDate() - range.days)
    return d.toISOString()
  }
  return null
}

function formatCurrency(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return (n || 0).toString()
}

function getMonthLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function groupByMonth(items, dateField = 'created_at') {
  const map = {}
  for (const item of items) {
    const d = new Date(item[dateField])
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map[key]) map[key] = { key, label: getMonthLabel(item[dateField]), items: [] }
    map[key].items.push(item)
  }
  return Object.values(map).sort((a, b) => a.key.localeCompare(b.key))
}

// ═══════ MINI LOADING ═══════
function MiniLoader({ isDark }) {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#EAB308', borderTopColor: 'transparent' }} />
    </div>
  )
}

// ═══════ KPI CARD ═══════
function KpiCard({ label, value, trend, trendLabel, icon: Icon, color, isDark, index }) {
  return (
    <div className="an-glass rounded-2xl p-5 an-au" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
            trend > 0 ? 'bg-emerald-500/15 text-emerald-400' :
            trend < 0 ? 'bg-red-500/15 text-red-400' :
            isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}
            {trend !== 0 && <span>{Math.abs(trend)}</span>}
          </div>
        )}
      </div>
      <p className={`an-display text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`an-label text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>{label}</p>
      {trendLabel && (
        <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'} mt-0.5`}>{trendLabel}</p>
      )}
    </div>
  )
}

// ═══════ BAR CHART (Vertical) ═══════
function BarChart({ data, maxVal, color, isDark, valuePrefix = '', labelKey = 'label', valueKey = 'value' }) {
  const max = maxVal || Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-1.5" style={{ height: 160 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {valuePrefix}{formatNumber(d[valueKey])}
            </span>
            <div
              className="w-full rounded-t-md an-bar"
              style={{
                '--target-h': `${Math.max(pct, 2)}%`,
                height: `${Math.max(pct, 2)}%`,
                background: `linear-gradient(to top, ${color}, ${color}90)`,
                animationDelay: `${i * 40}ms`,
                minHeight: 4,
              }}
            />
            <span className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'} truncate w-full text-center`}>
              {d[labelKey]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ═══════ HORIZONTAL BAR CHART ═══════
function HBarChart({ data, isDark, colorFn }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} truncate max-w-[60%]`}>{d.label}</span>
            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.display || d.value}</span>
          </div>
          <div className={`h-2.5 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
            <div
              className="h-full rounded-full an-hbar"
              style={{
                '--target-w': `${(d.value / max) * 100}%`,
                width: `${(d.value / max) * 100}%`,
                background: colorFn ? colorFn(i) : CHART_COLORS[i % CHART_COLORS.length],
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════ DONUT CHART (SVG) ═══════
function DonutChart({ data, isDark, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = size / 2 - 10
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} strokeWidth="16" />
        {data.map((d, i) => {
          const pct = d.value / total
          const dash = circ * pct
          const gap = circ - dash
          const currentOffset = offset
          offset += pct * circ
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          )
        })}
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="an-display" style={{ fontSize: 24, fill: isDark ? '#fff' : '#1e293b' }}>
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" style={{ fontSize: 9, fill: isDark ? '#64748b' : '#94a3b8', fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: '.05em' }}>
          TOTAL
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} truncate`}>{d.label}</span>
            <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} ml-auto shrink-0`}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════ SPARK LINE (SVG) ═══════
function SparkLine({ data, color, isDark, height = 120 }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const min = 0
  const width = 400
  const padY = 10
  const usableH = height - padY * 2

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
    const y = padY + usableH - ((d.value - min) / (max - min || 1)) * usableH
    return { x, y, ...d }
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = line + ` L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke={isDark ? '#0f172a' : '#f8fafc'} strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className={`text-[8px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

// ═══════ DATA TABLE ═══════
function DataTable({ columns, rows, isDark, emptyMessage = 'No data' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`an-label text-[10px] uppercase text-left pb-3 pr-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} style={col.style}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className={`py-6 text-center text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{emptyMessage}</td></tr>
          ) : rows.map((row, ri) => (
            <tr key={ri} className={`${isDark ? 'border-white/[0.03]' : 'border-slate-100'} border-t`}>
              {columns.map((col, ci) => (
                <td key={ci} className={`py-2.5 pr-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={col.style}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════ MAIN PAGE ═══════
function PlatformAnalyticsPage({ showToast }) {
  const { isPlatformAdmin } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  const [dateRange, setDateRange] = useState('30d')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data
  const [kpis, setKpis] = useState({})
  const [userGrowth, setUserGrowth] = useState([])
  const [revenueByMonth, setRevenueByMonth] = useState([])
  const [orgTypes, setOrgTypes] = useState([])
  const [sportDist, setSportDist] = useState([])
  const [topOrgsByMembers, setTopOrgsByMembers] = useState([])
  const [topOrgsByRevenue, setTopOrgsByRevenue] = useState([])
  const [recentOrgs, setRecentOrgs] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [inactiveOrgs, setInactiveOrgs] = useState([])
  const [registrationsByMonth, setRegistrationsByMonth] = useState([])

  useEffect(() => { if (isPlatformAdmin) loadAll() }, [dateRange])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([
        loadKPIs(),
        loadUserGrowth(),
        loadRevenue(),
        loadOrgBreakdowns(),
        loadTables(),
        loadRegistrations(),
      ])
    } catch (err) {
      console.error('Analytics load error:', err)
    }
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
    showToast?.('Data refreshed', 'success')
  }

  const rangeDate = getDateRange(dateRange)

  // ── KPIs ──
  async function loadKPIs() {
    const [
      { count: orgCount },
      { count: userCount },
      { count: seasonCount },
      { count: teamCount },
      { data: payments },
    ] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('seasons').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, paid, created_at'),
    ])

    const totalRevenue = (payments || []).filter(p => p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

    // Trends: new this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const [
      { count: newOrgsThisMonth },
      { count: newUsersThisMonth },
    ] = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    ])

    // Revenue this month vs last month
    const thisMonthPayments = (payments || []).filter(p => p.paid && p.created_at >= monthStart)
    const lastMonthPayments = (payments || []).filter(p => p.paid && p.created_at >= lastMonthStart && p.created_at < monthStart)
    const thisMonthRev = thisMonthPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    const lastMonthRev = lastMonthPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
    const revTrend = thisMonthRev - lastMonthRev

    setKpis({
      orgCount: orgCount || 0,
      userCount: userCount || 0,
      seasonCount: seasonCount || 0,
      teamCount: teamCount || 0,
      totalRevenue,
      avgUsersPerOrg: orgCount ? Math.round((userCount || 0) / orgCount) : 0,
      newOrgsThisMonth: newOrgsThisMonth || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      thisMonthRev,
      revTrend: Math.round(revTrend),
    })
  }

  // ── User Growth ──
  async function loadUserGrowth() {
    let query = supabase.from('profiles').select('created_at').order('created_at')
    if (rangeDate) query = query.gte('created_at', rangeDate)
    const { data } = await query
    const grouped = groupByMonth(data || [])
    setUserGrowth(grouped.map(g => ({ label: g.label, value: g.items.length })))
  }

  // ── Revenue ──
  async function loadRevenue() {
    let query = supabase.from('payments').select('amount, paid, created_at').eq('paid', true).order('created_at')
    if (rangeDate) query = query.gte('created_at', rangeDate)
    const { data } = await query
    const grouped = groupByMonth(data || [])
    setRevenueByMonth(grouped.map(g => ({
      label: g.label,
      value: g.items.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
    })))
  }

  // ── Org Breakdowns ──
  async function loadOrgBreakdowns() {
    const { data: orgs } = await supabase.from('organizations').select('id, name, settings, is_active, created_at')

    // Org types from settings.org_type
    const typeMap = {}
    const sportMap = {}
    for (const org of (orgs || [])) {
      const s = org.settings || {}
      const t = s.org_type || 'unknown'
      typeMap[t] = (typeMap[t] || 0) + 1
      const sports = s.sports || s.enabled_sports || []
      for (const sp of (Array.isArray(sports) ? sports : [])) {
        sportMap[sp] = (sportMap[sp] || 0) + 1
      }
    }
    setOrgTypes(Object.entries(typeMap).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v })).sort((a, b) => b.value - a.value))
    setSportDist(Object.entries(sportMap).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), value: v })).sort((a, b) => b.value - a.value))

    // Top orgs by member count
    const { data: roles } = await supabase.from('user_roles').select('organization_id').eq('is_active', true)
    const memberMap = {}
    for (const r of (roles || [])) {
      memberMap[r.organization_id] = (memberMap[r.organization_id] || 0) + 1
    }
    const orgNameMap = {}
    for (const org of (orgs || [])) orgNameMap[org.id] = org.name

    setTopOrgsByMembers(
      Object.entries(memberMap)
        .map(([id, count]) => ({ label: orgNameMap[id] || 'Unknown', value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    )

    // Top orgs by revenue — need season→org mapping
    const { data: seasons } = await supabase.from('seasons').select('id, organization_id')
    const seasonToOrg = {}
    for (const s of (seasons || [])) seasonToOrg[s.id] = s.organization_id

    let payQuery = supabase.from('payments').select('amount, paid, season_id')
    if (rangeDate) payQuery = payQuery.gte('created_at', rangeDate)
    const { data: allPayments } = await payQuery

    const orgRevMap = {}
    for (const p of (allPayments || [])) {
      if (!p.paid) continue
      const orgId = seasonToOrg[p.season_id]
      if (orgId) orgRevMap[orgId] = (orgRevMap[orgId] || 0) + (parseFloat(p.amount) || 0)
    }

    setTopOrgsByRevenue(
      Object.entries(orgRevMap)
        .map(([id, rev]) => ({ label: orgNameMap[id] || 'Unknown', value: rev, display: formatCurrency(rev) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    )
  }

  // ── Tables ──
  async function loadTables() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoff = thirtyDaysAgo.toISOString()

    const [
      { data: newOrgs },
      { data: newUsers },
    ] = await Promise.all([
      supabase.from('organizations').select('id, name, settings, created_at, is_active').order('created_at', { ascending: false }).limit(15),
      supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(15),
    ])

    setRecentOrgs((newOrgs || []).filter(o => o.created_at >= cutoff))
    setRecentUsers((newUsers || []).filter(u => u.created_at >= cutoff))

    // Inactive orgs: active orgs with 0 teams
    const { data: allOrgs } = await supabase.from('organizations').select('id, name, created_at, is_active').eq('is_active', true)
    const { data: allSeasons } = await supabase.from('seasons').select('organization_id')
    const orgsWithSeasons = new Set((allSeasons || []).map(s => s.organization_id))
    setInactiveOrgs((allOrgs || []).filter(o => !orgsWithSeasons.has(o.id)))
  }

  // ── Registrations ──
  async function loadRegistrations() {
    let query = supabase.from('registrations').select('created_at, status').order('created_at')
    if (rangeDate) query = query.gte('created_at', rangeDate)
    const { data, error } = await query
    if (error) { setRegistrationsByMonth([]); return }
    const grouped = groupByMonth(data || [])
    setRegistrationsByMonth(grouped.map(g => ({ label: g.label, value: g.items.length })))
  }

  // ── Access Gate ──
  if (!isPlatformAdmin) {
    return (
      <div className={`${isDark ? '' : 'an-light'}`}>
        <style>{AN_STYLES}</style>
        <div className="flex flex-col items-center justify-center py-20 an-au">
          <Shield className="w-16 h-16 text-red-400 mb-4" />
          <h1 className={`an-display text-3xl ${tc.text} mb-2`}>Access Denied</h1>
          <p className={tc.textMuted}>Platform super-admin access required.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isDark ? '' : 'an-light'}`}>
      <style>{AN_STYLES}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 an-au">
        <div>
          <h1 className={`an-display text-4xl ${tc.text} flex items-center gap-3`}>
            <BarChart3 className="w-8 h-8" style={{ color: accent.primary }} />
            Platform Analytics
          </h1>
          <p className={`an-label text-sm uppercase ${tc.textMuted} mt-1`}>Deep insights across all organizations</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'} border focus:outline-none cursor-pointer`}
            >
              {DATE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2.5 rounded-xl transition ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-500'} border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 an-au">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
          <p className={tc.textMuted}>Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ═══ KPI CARDS ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard label="Organizations" value={formatNumber(kpis.orgCount)} trend={kpis.newOrgsThisMonth} trendLabel="new this month" icon={Building2} color="#3B82F6" isDark={isDark} index={0} />
            <KpiCard label="Total Users" value={formatNumber(kpis.userCount)} trend={kpis.newUsersThisMonth} trendLabel="new this month" icon={Users} color="#10B981" isDark={isDark} index={1} />
            <KpiCard label="Revenue" value={formatCurrency(kpis.totalRevenue)} trend={kpis.revTrend} trendLabel={`${formatCurrency(kpis.thisMonthRev)} this month`} icon={DollarSign} color="#EAB308" isDark={isDark} index={2} />
            <KpiCard label="Active Seasons" value={formatNumber(kpis.seasonCount)} icon={Calendar} color="#A855F7" isDark={isDark} index={3} />
            <KpiCard label="Total Teams" value={formatNumber(kpis.teamCount)} icon={Target} color="#F97316" isDark={isDark} index={4} />
            <KpiCard label="Avg Users / Org" value={kpis.avgUsersPerOrg} icon={Activity} color="#06B6D4" isDark={isDark} index={5} />
          </div>

          {/* ═══ CHARTS ROW 1 ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <LineChart className="w-4 h-4" style={{ color: '#10B981' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>User Signups</h3>
              </div>
              {userGrowth.length > 0 ? (
                <SparkLine data={userGrowth} color="#10B981" isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No data in range</p>
              )}
            </div>

            {/* Revenue */}
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <DollarSign className="w-4 h-4" style={{ color: '#EAB308' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Monthly Revenue</h3>
              </div>
              {revenueByMonth.length > 0 ? (
                <BarChart data={revenueByMonth} color="#EAB308" isDark={isDark} valuePrefix="$" />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No revenue in range</p>
              )}
            </div>
          </div>

          {/* ═══ CHARTS ROW 2 ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Org Types */}
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <PieChart className="w-4 h-4" style={{ color: '#A855F7' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Organizations by Type</h3>
              </div>
              {orgTypes.length > 0 ? (
                <DonutChart data={orgTypes} isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No data</p>
              )}
            </div>

            {/* Sport Distribution */}
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '350ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-4 h-4" style={{ color: '#F97316' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Sport Distribution</h3>
              </div>
              {sportDist.length > 0 ? (
                <DonutChart data={sportDist} isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No data</p>
              )}
            </div>
          </div>

          {/* ═══ CHARTS ROW 3 ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Orgs by Members */}
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Top Orgs by Members</h3>
              </div>
              {topOrgsByMembers.length > 0 ? (
                <HBarChart data={topOrgsByMembers} isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No data</p>
              )}
            </div>

            {/* Registrations over time */}
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '450ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4" style={{ color: '#06B6D4' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Registrations Over Time</h3>
              </div>
              {registrationsByMonth.length > 0 ? (
                <SparkLine data={registrationsByMonth} color="#06B6D4" isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No registration data in range</p>
              )}
            </div>
          </div>

          {/* ═══ TABLES ═══ */}

          {/* Top Orgs by Revenue */}
          <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-4 h-4" style={{ color: '#EAB308' }} />
              <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Top Organizations by Revenue</h3>
            </div>
            <DataTable
              isDark={isDark}
              emptyMessage="No revenue data"
              columns={[
                { label: '#', key: 'rank', style: { width: 32 }, render: (_, i) => <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{topOrgsByRevenue.indexOf(_) + 1}</span> },
                { label: 'Organization', key: 'label', render: r => <span className="font-medium">{r.label}</span> },
                { label: 'Revenue', key: 'display', style: { textAlign: 'right' }, render: r => <span className="font-bold" style={{ color: '#EAB308' }}>{r.display}</span> },
              ]}
              rows={topOrgsByRevenue}
            />
          </div>

          {/* Recent Organizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '550ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Recently Created Orgs (30d)</h3>
              </div>
              <DataTable
                isDark={isDark}
                emptyMessage="No new orgs in last 30 days"
                columns={[
                  { label: 'Name', key: 'name', render: r => <span className="font-medium">{r.name}</span> },
                  { label: 'Type', key: 'type', render: r => <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{(r.settings?.org_type || 'unknown')}</span> },
                  { label: 'Created', key: 'created_at', render: r => <span className="text-xs">{new Date(r.created_at).toLocaleDateString()}</span> },
                ]}
                rows={recentOrgs}
              />
            </div>

            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-4 h-4" style={{ color: '#10B981' }} />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Recently Joined Users (30d)</h3>
              </div>
              <DataTable
                isDark={isDark}
                emptyMessage="No new users in last 30 days"
                columns={[
                  { label: 'Name', key: 'full_name', render: r => <span className="font-medium">{r.full_name || 'Unnamed'}</span> },
                  { label: 'Email', key: 'email', render: r => <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.email}</span> },
                  { label: 'Joined', key: 'created_at', render: r => <span className="text-xs">{new Date(r.created_at).toLocaleDateString()}</span> },
                ]}
                rows={recentUsers}
              />
            </div>
          </div>

          {/* Inactive Orgs */}
          {inactiveOrgs.length > 0 && (
            <div className="an-glass rounded-2xl p-6 an-au" style={{ animationDelay: '650ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className={`an-heading text-sm uppercase ${tc.textMuted}`}>Orgs With No Seasons (May Need Attention)</h3>
              </div>
              <DataTable
                isDark={isDark}
                emptyMessage="All orgs have activity"
                columns={[
                  { label: 'Name', key: 'name', render: r => <span className="font-medium">{r.name}</span> },
                  { label: 'Created', key: 'created_at', render: r => <span className="text-xs">{new Date(r.created_at).toLocaleDateString()}</span> },
                  { label: 'Status', key: 'is_active', render: r => (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_active === false ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {r.is_active === false ? 'Suspended' : 'No Seasons'}
                    </span>
                  )},
                ]}
                rows={inactiveOrgs}
              />
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export { PlatformAnalyticsPage }
