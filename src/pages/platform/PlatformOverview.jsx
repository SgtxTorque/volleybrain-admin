import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Building2, Users, Calendar, Shield, DollarSign, CreditCard,
  TrendingUp, ArrowRight, Clock, CheckCircle2, AlertCircle, ChevronRight
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM OVERVIEW — Refactored standalone page component
// Clean professional cards, no glassmorphism / backdrop-blur
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
  const [orgHealth, setOrgHealth] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    loadOverviewData()
  }, [])

  async function loadOverviewData() {
    setLoading(true)
    try {
      // KPI queries
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
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('seasons').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'paid').gte('created_at', startOfMonth),
        supabase.from('platform_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        // Org health: fetch all orgs with their seasons, teams (via seasons), and member counts
        supabase.from('organizations').select('id, name, slug, is_active, created_at').order('name'),
        // Recent activity from audit log
        supabase
          .from('platform_admin_actions')
          .select('*, profiles:admin_id(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(10),
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

      // Build org health data
      const orgs = allOrgsRes.data || []
      if (orgs.length > 0) {
        const orgIds = orgs.map(o => o.id)

        // Fetch seasons per org
        const { data: allSeasons } = await supabase
          .from('seasons')
          .select('id, organization_id')
          .in('organization_id', orgIds)

        // Fetch members (user_roles) per org
        const { data: allMembers } = await supabase
          .from('user_roles')
          .select('organization_id')
          .in('organization_id', orgIds)
          .eq('is_active', true)

        // Fetch teams via season_ids
        const seasonIds = (allSeasons || []).map(s => s.id)
        let allTeams = []
        if (seasonIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, season_id')
            .in('season_id', seasonIds)
          allTeams = teamsData || []
        }

        // Build a map: season_id -> org_id
        const seasonToOrg = {}
        ;(allSeasons || []).forEach(s => {
          seasonToOrg[s.id] = s.organization_id
        })

        // Build health for each org
        const healthData = orgs.map(org => {
          const orgSeasons = (allSeasons || []).filter(s => s.organization_id === org.id)
          const orgMembers = (allMembers || []).filter(m => m.organization_id === org.id)
          const orgTeams = allTeams.filter(t => seasonToOrg[t.season_id] === org.id)

          let status = 'green' // has all
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

      // Recent activity
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

  // --- Card style helper (no glassmorphism) ---
  const cardClass = isDark
    ? 'bg-[#1E293B] border border-slate-700 shadow-sm rounded-[14px]'
    : 'bg-white border border-slate-200 shadow-sm rounded-[14px]'

  // --- KPI card definitions ---
  const kpiCards = [
    {
      label: 'Total Organizations',
      value: stats.orgs,
      icon: Building2,
      color: '#3B82F6',
    },
    {
      label: 'Total Users',
      value: stats.users,
      icon: Users,
      color: '#8B5CF6',
    },
    {
      label: 'Active Seasons',
      value: stats.activeSeasons,
      icon: Calendar,
      color: '#10B981',
    },
    {
      label: 'Total Teams',
      value: stats.teams,
      icon: Shield,
      color: '#F59E0B',
    },
    {
      label: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: '#EF4444',
    },
    {
      label: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: '#06B6D4',
    },
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
      {/* ── Top Row: 6 KPI Cards ── */}
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

      {/* ── Second Row: Org Health + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Org Health List */}
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted}`}>
              Org Health
            </h3>
            <TrendingUp className={`w-4 h-4 ${tc.textMuted}`} />
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {orgHealth.length === 0 ? (
              <p className={`text-sm ${tc.textMuted} py-4 text-center`}>
                No organizations found
              </p>
            ) : (
              orgHealth.map((org) => (
                <div
                  key={org.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Status indicator */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      org.status === 'green'
                        ? 'bg-emerald-500'
                        : org.status === 'yellow'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  {/* Org info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${tc.text}`}>{org.name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {org.isSuspended
                        ? 'Suspended'
                        : `${org.seasonCount} season${org.seasonCount !== 1 ? 's' : ''}, ${org.teamCount} team${org.teamCount !== 1 ? 's' : ''}, ${org.memberCount} member${org.memberCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      org.status === 'green'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : org.status === 'yellow'
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    {org.status === 'green'
                      ? 'Healthy'
                      : org.status === 'yellow'
                      ? 'Incomplete'
                      : 'Suspended'}
                  </span>
                </div>
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
            <Clock className={`w-4 h-4 ${tc.textMuted}`} />
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className={`text-sm ${tc.textMuted} py-4 text-center`}>
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
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
                      {activity.details?.org_name && ` -- ${activity.details.org_name}`}
                      {activity.details?.user_name && ` -- ${activity.details.user_name}`}
                    </p>
                  </div>
                  <span className={`text-xs ${tc.textMuted} shrink-0 mt-0.5`}>
                    {timeAgo(activity.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Third Row: Quick Actions ── */}
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
