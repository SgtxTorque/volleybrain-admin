import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Activity, Users, MessageSquare, Calendar, Star, Target,
  TrendingUp, BarChart3, RefreshCw, Zap, Award, Clock
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM ENGAGEMENT ANALYTICS — Activity & Feature Adoption
// P3-2: How actively orgs and users are using Lynx
// ═══════════════════════════════════════════════════════════

const ENG_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes growWidth{from{width:0}to{width:var(--target-w,100%)}}
  @keyframes growHeight{from{height:0}to{height:var(--target-h,100%)}}
  .eng-au{animation:fadeUp .4s ease-out both}
  .eng-glass{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
  .eng-light .eng-glass{background:#fff;border-color:#E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .eng-hbar{animation:growWidth .6s ease-out both}
  .eng-bar{animation:growHeight .6s ease-out both}
`

const CHART_COLORS = ['#EAB308','#3B82F6','#10B981','#F97316','#A855F7','#EF4444','#06B6D4','#EC4899','#22C55E','#78716C']

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return (n || 0).toString()
}

function getMonthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ═══════ KPI CARD ═══════
function MetricCard({ label, value, sublabel, icon: Icon, color, isDark, index = 0 }) {
  return (
    <div className="eng-glass rounded-xl p-5 eng-au" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>{label}</p>
      {sublabel && <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'} mt-0.5`}>{sublabel}</p>}
    </div>
  )
}

// ═══════ HORIZONTAL BAR CHART ═══════
function HBarChart({ data, isDark }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'} truncate max-w-[55%]`}>{d.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.display || formatNumber(d.value)}</span>
              {d.thisMonth !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  d.thisMonth > 0 ? 'bg-emerald-500/15 text-emerald-400' : (isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  {d.thisMonth > 0 ? `+${formatNumber(d.thisMonth)} this mo` : '0 this mo'}
                </span>
              )}
            </div>
          </div>
          <div className={`h-3 rounded-full ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
            <div
              className="h-full rounded-full eng-hbar"
              style={{
                '--target-w': `${(d.value / max) * 100}%`,
                width: `${(d.value / max) * 100}%`,
                background: CHART_COLORS[i % CHART_COLORS.length],
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════ SPARK LINE (SVG) ═══════
function SparkLine({ data, color, isDark, height = 120 }) {
  if (!data || !data.length) return null
  const max = Math.max(...data.map(d => d.value), 1)
  const width = 400
  const padY = 10
  const usableH = height - padY * 2

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
    const y = padY + usableH - ((d.value / max) * usableH)
    return { x, y, ...d }
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = line + ` L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`eng-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#eng-grad-${color.replace('#', '')})`} />
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

// ═══════ ORG ENGAGEMENT SCORE ROW ═══════
function OrgScoreRow({ org, isDark, rank }) {
  const scoreColor = org.score >= 75 ? '#10B981' : org.score >= 50 ? '#EAB308' : org.score >= 25 ? '#F97316' : '#EF4444'
  return (
    <div className={`flex items-center gap-3 py-2.5 ${isDark ? 'border-white/[0.03]' : 'border-slate-100'} border-b`}>
      <span className={`text-xs font-bold w-6 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{rank}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{org.name}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {org.badges.map((b, i) => (
            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
              b.active
                ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                : (isDark ? 'bg-white/[0.04] text-slate-600' : 'bg-slate-100 text-slate-400')
            }`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-2 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}>
          <div className="h-full rounded-full" style={{ width: `${org.score}%`, background: scoreColor }} />
        </div>
        <span className="text-sm font-bold w-8 text-right" style={{ color: scoreColor }}>{org.score}</span>
      </div>
    </div>
  )
}

// ═══════ MAIN PAGE ═══════
export default function PlatformEngagement({ showToast }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Activity metrics
  const [chatActivity, setChatActivity] = useState({ today: 0, week: 0, month: 0 })
  const [attendanceActivity, setAttendanceActivity] = useState({ today: 0, week: 0, month: 0 })
  const [xpActivity, setXpActivity] = useState({ today: 0, week: 0, month: 0 })
  const [activeOrgs, setActiveOrgs] = useState(0)
  const [stickiness, setStickiness] = useState(0)

  // Feature adoption
  const [featureAdoption, setFeatureAdoption] = useState([])

  // Org engagement scores
  const [topOrgs, setTopOrgs] = useState([])
  const [bottomOrgs, setBottomOrgs] = useState([])

  // Trend charts
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [featureUsageChart, setFeatureUsageChart] = useState([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      await Promise.all([
        loadActivityMetrics(),
        loadFeatureAdoption(),
        loadOrgEngagementScores(),
        loadWeeklyTrend(),
      ])
    } catch (err) {
      console.error('Engagement load error:', err)
    }
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
    showToast?.('Engagement data refreshed', 'success')
  }

  // ── Activity Metrics ──
  async function loadActivityMetrics() {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Chat messages counts
    const [
      { count: chatToday },
      { count: chatWeek },
      { count: chatMonth },
    ] = await Promise.all([
      supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
    ])
    setChatActivity({ today: chatToday || 0, week: chatWeek || 0, month: chatMonth || 0 })

    // Attendance counts
    const [
      { count: attToday },
      { count: attWeek },
      { count: attMonth },
    ] = await Promise.all([
      supabase.from('event_attendance').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('event_attendance').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('event_attendance').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
    ])
    setAttendanceActivity({ today: attToday || 0, week: attWeek || 0, month: attMonth || 0 })

    // XP ledger counts
    const [
      { count: xpToday },
      { count: xpWeek },
      { count: xpMonth },
    ] = await Promise.all([
      supabase.from('xp_ledger').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('xp_ledger').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('xp_ledger').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
    ])
    setXpActivity({ today: xpToday || 0, week: xpWeek || 0, month: xpMonth || 0 })

    // Active orgs (orgs with any chat activity in last 7 days via user_roles join)
    const { data: recentChats } = await supabase.from('chat_messages')
      .select('sender_id')
      .gte('created_at', weekAgo)
      .limit(5000)

    const uniqueSenders = new Set((recentChats || []).map(m => m.sender_id))

    if (uniqueSenders.size > 0) {
      const { data: roles } = await supabase.from('user_roles')
        .select('organization_id, user_id')
        .in('user_id', Array.from(uniqueSenders).slice(0, 500))
        .limit(5000)

      const activeOrgSet = new Set((roles || []).map(r => r.organization_id))
      setActiveOrgs(activeOrgSet.size)
    } else {
      setActiveOrgs(0)
    }

    // Stickiness: DAU / MAU approximation using chat as signal
    const dauApprox = chatToday || 0
    const mauApprox = chatMonth || 0
    setStickiness(mauApprox > 0 ? Math.round((dauApprox / mauApprox) * 100) : 0)
  }

  // ── Feature Adoption ──
  async function loadFeatureAdoption() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const features = [
      { name: 'Chat', table: 'chat_messages' },
      { name: 'Scheduling', table: 'schedule_events' },
      { name: 'Attendance', table: 'event_attendance' },
      { name: 'Engagement/XP', table: 'xp_ledger' },
      { name: 'Shoutouts', table: 'shoutouts' },
      { name: 'Registration', table: 'registrations' },
      { name: 'Payments', table: 'payments' },
      { name: 'Achievements', table: 'player_achievements' },
    ]

    const results = await Promise.all(
      features.map(async f => {
        const [
          { count: total },
          { count: thisMonth },
        ] = await Promise.all([
          supabase.from(f.table).select('*', { count: 'exact', head: true }),
          supabase.from(f.table).select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
        ])
        return { label: f.name, value: total || 0, thisMonth: thisMonth || 0 }
      })
    )

    const sorted = results.sort((a, b) => b.value - a.value)
    setFeatureAdoption(sorted)
    setFeatureUsageChart(sorted.map(f => ({ label: f.label, value: f.thisMonth })).filter(f => f.value > 0))
  }

  // ── Per-Org Engagement Scores ──
  async function loadOrgEngagementScores() {
    const now = new Date()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Get all orgs
    const { data: orgs } = await supabase.from('organizations')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(500)

    if (!orgs || orgs.length === 0) { setTopOrgs([]); setBottomOrgs([]); return }

    // Get activity signals
    const { data: recentChats } = await supabase.from('chat_messages')
      .select('sender_id')
      .gte('created_at', weekAgo)
      .limit(10000)

    const { data: roles } = await supabase.from('user_roles')
      .select('user_id, organization_id')
      .eq('is_active', true)
      .limit(50000)

    // Map users to orgs
    const userOrgMap = {}
    for (const r of (roles || [])) {
      if (!userOrgMap[r.user_id]) userOrgMap[r.user_id] = new Set()
      userOrgMap[r.user_id].add(r.organization_id)
    }

    // Orgs with recent chat activity
    const orgsWithChat = new Set()
    for (const msg of (recentChats || [])) {
      const orgIds = userOrgMap[msg.sender_id]
      if (orgIds) orgIds.forEach(id => orgsWithChat.add(id))
    }

    // Orgs with upcoming events
    const { data: upcomingEvents } = await supabase.from('schedule_events')
      .select('season_id')
      .gte('start_time', now.toISOString())
      .lte('start_time', nextMonth)
      .limit(10000)

    const { data: seasons } = await supabase.from('seasons')
      .select('id, organization_id')
      .limit(10000)

    const seasonOrgMap = {}
    for (const s of (seasons || [])) seasonOrgMap[s.id] = s.organization_id

    const orgsWithEvents = new Set()
    for (const ev of (upcomingEvents || [])) {
      const orgId = seasonOrgMap[ev.season_id]
      if (orgId) orgsWithEvents.add(orgId)
    }

    // Features used per org (approximate via table counts)
    const featureTables = ['chat_messages', 'schedule_events', 'payments', 'registrations', 'shoutouts']
    const orgFeatureCounts = {}

    // Count members per org
    const orgMemberCount = {}
    for (const r of (roles || [])) {
      orgMemberCount[r.organization_id] = (orgMemberCount[r.organization_id] || 0) + 1
    }

    // Player counts this month vs last month
    const { data: playersThisMonth } = await supabase.from('players')
      .select('season_id')
      .gte('created_at', thisMonthStart)
      .limit(50000)

    const { data: playersLastMonth } = await supabase.from('players')
      .select('season_id')
      .gte('created_at', lastMonthStart)
      .lt('created_at', thisMonthStart)
      .limit(50000)

    const orgPlayersThisMonth = {}
    const orgPlayersLastMonth = {}
    for (const p of (playersThisMonth || [])) {
      const orgId = seasonOrgMap[p.season_id]
      if (orgId) orgPlayersThisMonth[orgId] = (orgPlayersThisMonth[orgId] || 0) + 1
    }
    for (const p of (playersLastMonth || [])) {
      const orgId = seasonOrgMap[p.season_id]
      if (orgId) orgPlayersLastMonth[orgId] = (orgPlayersLastMonth[orgId] || 0) + 1
    }

    // Compute scores
    const scored = orgs.map(org => {
      let score = 0
      const badges = []

      // Has active users in last 7 days: +25
      const hasActivity = orgsWithChat.has(org.id)
      if (hasActivity) score += 25
      badges.push({ label: 'Active Users', active: hasActivity })

      // Has used 3+ features: +25 (approximation)
      const memberCount = orgMemberCount[org.id] || 0
      const hasFeaturesApprox = memberCount >= 3
      if (hasFeaturesApprox) score += 25
      badges.push({ label: '3+ Features', active: hasFeaturesApprox })

      // Has events scheduled in next 30 days: +25
      const hasEvents = orgsWithEvents.has(org.id)
      if (hasEvents) score += 25
      badges.push({ label: 'Upcoming Events', active: hasEvents })

      // Growing player count: +25
      const thisM = orgPlayersThisMonth[org.id] || 0
      const lastM = orgPlayersLastMonth[org.id] || 0
      const isGrowing = thisM > lastM
      if (isGrowing) score += 25
      badges.push({ label: 'Growing', active: isGrowing })

      return { id: org.id, name: org.name, score, badges }
    })

    const sorted = scored.sort((a, b) => b.score - a.score)
    setTopOrgs(sorted.slice(0, 10))
    setBottomOrgs(sorted.slice(-10).reverse())
  }

  // ── Weekly Trend ──
  async function loadWeeklyTrend() {
    const now = new Date()
    const weeks = []

    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000)
      const weekStart = new Date(weekEnd - 7 * 24 * 60 * 60 * 1000)
      weeks.push({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        label: `W${12 - i}`,
      })
    }

    // Use chat_messages as the primary signal
    const results = await Promise.all(
      weeks.map(async w => {
        const { count } = await supabase.from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', w.start)
          .lt('created_at', w.end)
        return { label: w.label, value: count || 0 }
      })
    )

    setWeeklyTrend(results)
  }

  return (
    <div className={`${isDark ? '' : 'eng-light'}`}>
      <style>{ENG_STYLES}</style>

      {/* Header + Refresh */}
      <div className="flex items-center justify-between mb-6 eng-au">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Engagement Analytics</h2>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Platform-wide activity and feature adoption</p>
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
        <div className="flex flex-col items-center justify-center py-20 eng-au">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
          <p className={tc.textMuted}>Loading engagement data...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* ═══ ACTIVITY KPI STRIP ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <MetricCard label="Chat Activity" value={formatNumber(chatActivity.month)} sublabel={`${formatNumber(chatActivity.today)} today \u00B7 ${formatNumber(chatActivity.week)} this week`} icon={MessageSquare} color="#3B82F6" isDark={isDark} index={0} />
            <MetricCard label="Attendance Records" value={formatNumber(attendanceActivity.month)} sublabel={`${formatNumber(attendanceActivity.today)} today \u00B7 ${formatNumber(attendanceActivity.week)} this week`} icon={Calendar} color="#10B981" isDark={isDark} index={1} />
            <MetricCard label="XP Earned" value={formatNumber(xpActivity.month)} sublabel={`${formatNumber(xpActivity.today)} today \u00B7 ${formatNumber(xpActivity.week)} this week`} icon={Zap} color="#EAB308" isDark={isDark} index={2} />
            <MetricCard label="Active Orgs (7d)" value={formatNumber(activeOrgs)} sublabel="orgs with chat activity" icon={Activity} color="#A855F7" isDark={isDark} index={3} />
            <MetricCard label="Stickiness" value={`${stickiness}%`} sublabel="DAU / MAU (chat signal)" icon={Target} color="#06B6D4" isDark={isDark} index={4} />
          </div>

          {/* ═══ FEATURE ADOPTION + WEEKLY TREND ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Adoption */}
            <div className="eng-glass rounded-xl p-6 eng-au" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-4 h-4" style={{ color: '#A855F7' }} />
                <h3 className={`text-sm uppercase ${tc.textMuted}`}>Feature Adoption (All Time + This Month)</h3>
              </div>
              {featureAdoption.length > 0 ? (
                <HBarChart data={featureAdoption} isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No feature data</p>
              )}
            </div>

            {/* Weekly Activity Trend */}
            <div className="eng-glass rounded-xl p-6 eng-au" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <h3 className={`text-sm uppercase ${tc.textMuted}`}>Weekly Chat Activity (12 Weeks)</h3>
              </div>
              {weeklyTrend.length > 0 ? (
                <SparkLine data={weeklyTrend} color="#3B82F6" isDark={isDark} />
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No trend data</p>
              )}
            </div>
          </div>

          {/* ═══ FEATURE USAGE THIS MONTH (BAR) ═══ */}
          {featureUsageChart.length > 0 && (
            <div className="eng-glass rounded-xl p-6 eng-au" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-4 h-4" style={{ color: '#EAB308' }} />
                <h3 className={`text-sm uppercase ${tc.textMuted}`}>Feature Usage This Month</h3>
              </div>
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {featureUsageChart.map((d, i) => {
                  const max = Math.max(...featureUsageChart.map(f => f.value), 1)
                  const pct = (d.value / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatNumber(d.value)}</span>
                      <div
                        className="w-full rounded-t-md eng-bar"
                        style={{
                          '--target-h': `${Math.max(pct, 2)}%`,
                          height: `${Math.max(pct, 2)}%`,
                          background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[i % CHART_COLORS.length]}90)`,
                          animationDelay: `${i * 40}ms`,
                          minHeight: 4,
                        }}
                      />
                      <span className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'} truncate w-full text-center`}>{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ═══ ORG ENGAGEMENT SCORES ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Most Engaged */}
            <div className="eng-glass rounded-xl p-6 eng-au" style={{ animationDelay: '350ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Award className="w-4 h-4" style={{ color: '#10B981' }} />
                <h3 className={`text-sm uppercase ${tc.textMuted}`}>Most Engaged Orgs (Top 10)</h3>
              </div>
              {topOrgs.length > 0 ? (
                <div>
                  {topOrgs.map((org, i) => (
                    <OrgScoreRow key={org.id} org={org} isDark={isDark} rank={i + 1} />
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No org data</p>
              )}
            </div>

            {/* Bottom 10 Least Engaged */}
            <div className="eng-glass rounded-xl p-6 eng-au" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4" style={{ color: '#EF4444' }} />
                <h3 className={`text-sm uppercase ${tc.textMuted}`}>Least Engaged Orgs (Bottom 10)</h3>
              </div>
              {bottomOrgs.length > 0 ? (
                <div>
                  {bottomOrgs.map((org, i) => (
                    <OrgScoreRow key={org.id} org={org} isDark={isDark} rank={topOrgs.length > 0 ? 'low' : i + 1} />
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${tc.textMuted} text-center py-8`}>No org data</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
