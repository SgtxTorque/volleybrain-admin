import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Building2, Users, Calendar, Shield, DollarSign, CreditCard,
  TrendingUp, ArrowRight, Clock, CheckCircle2, AlertCircle, ChevronRight,
  AlertTriangle, MessageSquare, Percent, ChevronDown, Filter
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM OVERVIEW — Command Center Dashboard
// SaaS metrics, attention strip, enhanced org health + activity
// ═══════════════════════════════════════════════════════════

function PlatformOverview({ showToast }) {
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    orgs: 0,
    users: 0,
    activeSeasons: 0,
    teams: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
  })
  // SaaS metrics
  const [saasMetrics, setSaasMetrics] = useState({
    mrr: 0,
    arr: 0,
    churnRate: null,
    openTickets: 0,
  })
  // Attention items
  const [attentionItems, setAttentionItems] = useState([])
  const [orgHealth, setOrgHealth] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  // Org health sorting
  const [healthSort, setHealthSort] = useState('status')
  // Activity type filter
  const [activityFilter, setActivityFilter] = useState('all')
  // Onboarding health
  const [onboardingOrgs, setOnboardingOrgs] = useState([])

  useEffect(() => {
    loadOverviewData()
  }, [])

  async function loadOverviewData() {
    setLoading(true)
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        orgsRes,
        usersRes,
        activeSeasonsRes,
        teamsRes,
        monthlyPaymentsRes,
        subscriptionsRes,
        allOrgsRes,
        recentActivityRes,
        // New: all subscriptions for MRR/churn
        allSubsRes,
        // New: open tickets count
        openTicketsRes,
        // New: failed payments this month
        failedPaymentsRes,
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('seasons').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', startOfMonth).limit(50000),
        supabase.from('platform_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('organizations').select('id, name, slug, is_active, created_at').order('name').limit(10000),
        supabase
          .from('platform_admin_actions')
          .select('*, profiles:admin_id(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(20),
        // All subscriptions for MRR/ARR/churn
        supabase.from('platform_subscriptions').select('id, organization_id, plan_tier, billing_cycle, price_cents, status, trial_ends_at, updated_at').limit(10000),
        // Open tickets
        supabase.from('platform_support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        // Failed payments this month
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', startOfMonth),
      ])

      // Calculate monthly revenue
      const monthlyRevenue = (monthlyPaymentsRes.data || []).reduce(
        (sum, p) => sum + (parseFloat(p.amount) || 0),
        0
      )

      setStats({
        orgs: orgsRes.count || 0,
        users: usersRes.count || 0,
        activeSeasons: activeSeasonsRes.count || 0,
        teams: teamsRes.count || 0,
        monthlyRevenue,
        activeSubscriptions: subscriptionsRes.count || 0,
      })

      // ── SaaS Metrics ──
      const allSubs = allSubsRes.data || []
      let mrr = 0
      const activeSubs = allSubs.filter(s => s.status === 'active' || s.status === 'trialing')
      activeSubs.forEach(s => {
        const monthly = s.billing_cycle === 'annual' ? Math.round((s.price_cents || 0) / 12) : (s.price_cents || 0)
        mrr += monthly
      })

      // Churn: cancelled this month / active at start
      const cancelledThisMonth = allSubs.filter(s =>
        s.status === 'cancelled' && s.updated_at && new Date(s.updated_at) >= new Date(startOfMonth)
      ).length
      const activeAtStart = activeSubs.length + cancelledThisMonth
      const churnRate = activeAtStart > 0 ? (cancelledThisMonth / activeAtStart) * 100 : null

      setSaasMetrics({
        mrr,
        arr: mrr * 12,
        churnRate,
        openTickets: openTicketsRes.count || 0,
      })

      // ── Attention items ──
      const items = []
      const openTicketCount = openTicketsRes.count || 0
      if (openTicketCount > 0) {
        items.push({
          icon: MessageSquare,
          label: `${openTicketCount} open support ticket${openTicketCount !== 1 ? 's' : ''}`,
          color: '#3B82F6',
          path: '/platform/support',
        })
      }
      const failedCount = failedPaymentsRes.count || 0
      if (failedCount > 0) {
        items.push({
          icon: AlertTriangle,
          label: `${failedCount} failed payment${failedCount !== 1 ? 's' : ''} this month`,
          color: '#EF4444',
          path: '/platform/subscriptions',
        })
      }

      // Build org health data
      const orgs = allOrgsRes.data || []
      let healthData = []
      if (orgs.length > 0) {
        const orgIds = orgs.map(o => o.id)

        const { data: allSeasons } = await supabase
          .from('seasons')
          .select('id, organization_id')
          .in('organization_id', orgIds)
          .limit(50000)

        const { data: allMembers } = await supabase
          .from('user_roles')
          .select('organization_id')
          .in('organization_id', orgIds)
          .eq('is_active', true)
          .limit(50000)

        const seasonIds = (allSeasons || []).map(s => s.id)
        let allTeams = []
        if (seasonIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, season_id')
            .in('season_id', seasonIds)
            .limit(50000)
          allTeams = teamsData || []
        }

        const seasonToOrg = {}
        ;(allSeasons || []).forEach(s => {
          seasonToOrg[s.id] = s.organization_id
        })

        healthData = orgs.map(org => {
          const orgSeasons = (allSeasons || []).filter(s => s.organization_id === org.id)
          const orgMembers = (allMembers || []).filter(m => m.organization_id === org.id)
          const orgTeams = allTeams.filter(t => seasonToOrg[t.season_id] === org.id)

          let status = 'green'
          if (org.is_active === false) {
            status = 'red'
          } else if (orgSeasons.length === 0 || orgTeams.length === 0 || orgMembers.length === 0) {
            status = 'yellow'
          }

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            status,
            seasonCount: orgSeasons.length,
            teamCount: orgTeams.length,
            memberCount: orgMembers.length,
            isSuspended: org.is_active === false,
          }
        })

        setOrgHealth(healthData)
      }

      // Add incomplete-setup orgs to attention
      const incompleteCount = healthData.filter(o => o.status === 'yellow').length
      if (incompleteCount > 0) {
        items.push({
          icon: AlertCircle,
          label: `${incompleteCount} org${incompleteCount !== 1 ? 's' : ''} with incomplete setup`,
          color: '#F59E0B',
          path: '/platform/organizations',
        })
      }

      // ── Onboarding Health — orgs created in last 30 days ──
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
      const newOrgs = orgs.filter(o => o.created_at && new Date(o.created_at) >= new Date(thirtyDaysAgo))
      if (newOrgs.length > 0) {
        const newOrgIds = newOrgs.map(o => o.id)
        const [rolesRes, seasonsRes2, teamsRes2, coachesRes, eventsRes, regRes] = await Promise.all([
          supabase.from('user_roles').select('organization_id, role').in('organization_id', newOrgIds).limit(10000),
          supabase.from('seasons').select('id, organization_id').in('organization_id', newOrgIds).limit(5000),
          supabase.from('teams').select('id, season_id').limit(10000),
          supabase.from('team_coaches').select('id, team_id').limit(10000),
          supabase.from('schedule_events').select('id, org_id').in('org_id', newOrgIds).limit(5000),
          supabase.from('registration_templates').select('id, org_id').in('org_id', newOrgIds).limit(5000),
        ])

        const roles = rolesRes.data || []
        const seasons2 = seasonsRes2.data || []
        const teams2 = teamsRes2.data || []
        const coaches = coachesRes.data || []
        const events = eventsRes.data || []
        const regs = regRes.data || []

        // Map season -> org for team lookup
        const seasonOrgMap = {}
        seasons2.forEach(s => { seasonOrgMap[s.id] = s.organization_id })

        // Get team_players count per org
        const newOrgSeasonIds = seasons2.map(s => s.id)
        const orgTeams = teams2.filter(t => newOrgSeasonIds.includes(t.season_id))
        const orgTeamIds = orgTeams.map(t => t.id)
        const { data: playerData } = await supabase.from('team_players').select('id, team_id').in('team_id', orgTeamIds.slice(0, 5000)).limit(10000)
        const players = playerData || []

        const onboarding = newOrgs.map(org => {
          const orgRoles = roles.filter(r => r.organization_id === org.id)
          const orgSeasons = seasons2.filter(s => s.organization_id === org.id)
          const orgSeasonIds = orgSeasons.map(s => s.id)
          const orgTeamList = orgTeams.filter(t => orgSeasonIds.includes(seasonOrgMap[t.season_id] === org.id ? t.season_id : null) || orgSeasonIds.includes(t.season_id))
          const orgTeamIdSet = new Set(orgTeamList.map(t => t.id))
          const orgPlayers = players.filter(p => orgTeamIdSet.has(p.team_id))
          const orgCoaches = coaches.filter(c => orgTeamIdSet.has(c.team_id))
          const orgEvents = events.filter(e => e.org_id === org.id)
          const orgRegs = regs.filter(r => r.org_id === org.id)

          const milestones = [
            { id: 'admin', label: 'Admin user', done: orgRoles.some(r => r.role === 'admin' || r.role === 'league_admin') },
            { id: 'season', label: 'First season', done: orgSeasons.length > 0 },
            { id: 'team', label: 'First team', done: orgTeamList.length > 0 },
            { id: 'player', label: 'First player', done: orgPlayers.length > 0 },
            { id: 'coach', label: 'Coach assigned', done: orgCoaches.length > 0 },
            { id: 'event', label: 'First event', done: orgEvents.length > 0 },
            { id: 'registration', label: 'Reg template', done: orgRegs.length > 0 },
          ]
          const completed = milestones.filter(m => m.done).length
          const daysAgo = Math.floor((now - new Date(org.created_at)) / 86400000)
          let stallStatus = null
          if (daysAgo >= 14 && completed < 3) stallStatus = 'critical'
          else if (daysAgo >= 7 && completed < 4) stallStatus = 'stalled'

          return { ...org, milestones, completed, total: 7, daysAgo, stallStatus }
        })

        setOnboardingOrgs(onboarding.sort((a, b) => a.completed - b.completed))

        // Add stalled orgs to attention
        const stalledCount = onboarding.filter(o => o.stallStatus).length
        if (stalledCount > 0) {
          items.push({
            icon: Clock,
            label: `${stalledCount} org${stalledCount !== 1 ? 's' : ''} with stalled onboarding`,
            color: '#EF4444',
            path: '/platform/organizations',
          })
        }
      }

      setAttentionItems(items)
      setRecentActivity(recentActivityRes.data || [])
    } catch (err) {
      console.error('Platform overview load error:', err)
    }
    setLoading(false)
  }

  // --- Helpers ---

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const mins = Math.floor((now - date) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  function formatAction(type) {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  function fmtCents(cents) {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // --- Sorted org health ---
  const sortedOrgHealth = useMemo(() => {
    const arr = [...orgHealth]
    switch (healthSort) {
      case 'name': return arr.sort((a, b) => a.name.localeCompare(b.name))
      case 'members': return arr.sort((a, b) => b.memberCount - a.memberCount)
      case 'teams': return arr.sort((a, b) => b.teamCount - a.teamCount)
      case 'status':
      default: {
        const order = { red: 0, yellow: 1, green: 2 }
        return arr.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
      }
    }
  }, [orgHealth, healthSort])

  // --- Filtered activity ---
  const activityTypes = useMemo(() => {
    const types = new Set(recentActivity.map(a => a.action_type))
    return ['all', ...Array.from(types)]
  }, [recentActivity])

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return recentActivity
    return recentActivity.filter(a => a.action_type === activityFilter)
  }, [recentActivity, activityFilter])

  // --- Card style helper ---
  const cardClass = isDark
    ? 'bg-[#1E293B] border border-slate-700 shadow-sm rounded-[14px]'
    : 'bg-white border border-slate-200 shadow-sm rounded-[14px]'

  // --- SaaS Metric cards (new — above existing KPIs) ---
  const saasCards = [
    {
      label: 'MRR',
      value: fmtCents(saasMetrics.mrr),
      icon: DollarSign,
      color: '#10B981',
    },
    {
      label: 'ARR',
      value: fmtCents(saasMetrics.arr),
      icon: TrendingUp,
      color: '#3B82F6',
    },
    {
      label: 'Churn Rate',
      value: saasMetrics.churnRate !== null ? `${saasMetrics.churnRate.toFixed(1)}%` : 'N/A',
      icon: Percent,
      color: saasMetrics.churnRate !== null && saasMetrics.churnRate > 5 ? '#EF4444' : '#10B981',
    },
    {
      label: 'Open Tickets',
      value: saasMetrics.openTickets,
      icon: MessageSquare,
      color: saasMetrics.openTickets > 0 ? '#F59E0B' : '#10B981',
    },
  ]

  // --- KPI card definitions ---
  const kpiCards = [
    { label: 'Total Organizations', value: stats.orgs, icon: Building2, color: '#3B82F6' },
    { label: 'Total Users', value: stats.users, icon: Users, color: '#8B5CF6' },
    { label: 'Active Seasons', value: stats.activeSeasons, icon: Calendar, color: '#10B981' },
    { label: 'Total Teams', value: stats.teams, icon: Shield, color: '#F59E0B' },
    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: '#EF4444' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: '#06B6D4' },
  ]

  // --- Quick actions ---
  const quickActions = [
    { label: 'View All Orgs', path: '/platform/organizations', icon: Building2 },
    { label: 'Manage Subscriptions', path: '/platform/subscriptions', icon: CreditCard },
    { label: 'Support Inbox', path: '/platform/support', icon: AlertCircle },
    { label: 'Review Audit', path: '/platform/audit', icon: Shield },
  ]

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Attention Required Strip ── */}
      {attentionItems.length > 0 && (
        <div className={`${cardClass} p-4`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className={`text-xs font-semibold uppercase tracking-wide text-amber-500`}>
              Attention Required
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {attentionItems.map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-slate-700'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                <span className={`${tc.text} font-medium`}>{item.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${tc.textMuted}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SaaS Metrics Row (4 cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {saasCards.map((card) => (
          <div key={card.label} className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}20` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${tc.text}`}>{card.value}</p>
            <p className={`text-xs uppercase tracking-wide mt-1 ${tc.textMuted}`}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Platform KPI Cards (6 cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}20` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${tc.text}`}>{card.value}</p>
            <p className={`text-xs uppercase tracking-wide mt-1 ${tc.textMuted}`}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Org Health + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Org Health List */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted}`}>
              Org Health
            </h3>
            <select
              value={healthSort}
              onChange={e => setHealthSort(e.target.value)}
              className={`text-xs px-2 py-1 rounded-lg border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <option value="status">Sort: Status</option>
              <option value="name">Sort: Name</option>
              <option value="members">Sort: Members</option>
              <option value="teams">Sort: Teams</option>
            </select>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {sortedOrgHealth.length === 0 ? (
              <p className={`text-sm ${tc.textMuted} py-4 text-center`}>
                No organizations found
              </p>
            ) : (
              sortedOrgHealth.map((org) => (
                <button
                  key={org.id}
                  onClick={() => navigate(`/platform/organizations/${org.id}`)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      org.status === 'green'
                        ? 'bg-emerald-500'
                        : org.status === 'yellow'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${tc.text}`}>{org.name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {org.isSuspended
                        ? 'Suspended'
                        : `${org.seasonCount} season${org.seasonCount !== 1 ? 's' : ''}, ${org.teamCount} team${org.teamCount !== 1 ? 's' : ''}, ${org.memberCount} member${org.memberCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      org.status === 'green'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : org.status === 'yellow'
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    {org.status === 'green' ? 'Healthy' : org.status === 'yellow' ? 'Incomplete' : 'Suspended'}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${tc.textMuted} shrink-0`} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted}`}>
              Recent Activity
            </h3>
            <select
              value={activityFilter}
              onChange={e => setActivityFilter(e.target.value)}
              className={`text-xs px-2 py-1 rounded-lg border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {activityTypes.map(t => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Activity' : formatAction(t)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {filteredActivity.length === 0 ? (
              <p className={`text-sm ${tc.textMuted} py-4 text-center`}>
                No recent activity
              </p>
            ) : (
              filteredActivity.map((activity) => {
                const isOrgAction = activity.details?.org_name || activity.target_type === 'organization'
                return (
                  <button
                    key={activity.id}
                    onClick={isOrgAction && activity.target_id ? () => navigate(`/platform/organizations/${activity.target_id}`) : undefined}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    } ${isOrgAction ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${accent.primary}20` }}
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: accent.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${tc.text}`}>
                        {formatAction(activity.action_type)}
                      </p>
                      <p className={`text-xs ${tc.textMuted} mt-0.5`}>
                        {activity.profiles?.full_name || activity.profiles?.email || 'System'}
                        {activity.details?.org_name && ` — ${activity.details.org_name}`}
                        {activity.details?.user_name && ` — ${activity.details.user_name}`}
                      </p>
                    </div>
                    <span className={`text-xs ${tc.textMuted} shrink-0 mt-0.5`}>
                      {timeAgo(activity.created_at)}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Onboarding Health ── */}
      {onboardingOrgs.length > 0 && (
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted}`}>
              Onboarding Health (Last 30 Days)
            </h3>
            <span className={`text-xs ${tc.textMuted}`}>{onboardingOrgs.length} new org{onboardingOrgs.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {onboardingOrgs.map(org => (
              <button
                key={org.id}
                onClick={() => navigate(`/platform/organizations/${org.id}`)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${tc.text}`}>{org.name}</p>
                    {org.stallStatus === 'critical' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">Critical</span>
                    )}
                    {org.stallStatus === 'stalled' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">Stalled</span>
                    )}
                  </div>
                  <p className={`text-xs ${tc.textMuted}`}>Created {org.daysAgo}d ago</p>
                </div>
                {/* Progress bar */}
                <div className="w-28 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(org.completed / org.total) * 100}%`,
                          background: org.stallStatus === 'critical' ? '#EF4444' : org.stallStatus === 'stalled' ? '#F59E0B' : '#10B981',
                        }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${tc.text}`}>{org.completed}/{org.total}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${tc.textMuted} shrink-0`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className={`${cardClass} p-5`}>
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted} mb-4`}>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accent.primary}20` }}
              >
                <action.icon className="w-4 h-4" style={{ color: accent.primary }} />
              </div>
              <span className={`text-sm font-medium flex-1 ${tc.text}`}>{action.label}</span>
              <ArrowRight className={`w-4 h-4 ${tc.textMuted}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { PlatformOverview }
export default PlatformOverview
