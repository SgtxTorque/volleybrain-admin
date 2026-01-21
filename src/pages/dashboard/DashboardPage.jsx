import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, ClipboardList, DollarSign, Settings, Bell, Calendar,
  VolleyballIcon 
} from '../../constants/icons'
import { JourneyTimeline } from '../../components/journey/JourneyTimeline'

// ============================================
// GETTING STARTED GUIDE (No Season Selected)
// ============================================
export function GettingStartedGuide({ onNavigate }) {
  const { organization, profile } = useAuth()
  const { seasons } = useSeason()
  const tc = useThemeClasses()
  const { accent, colors } = useTheme()
  const [setupStatus, setSetupStatus] = useState({
    hasSeason: false,
    hasTeams: false,
    hasPlayers: false,
    hasSchedule: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSetupStatus()
  }, [organization?.id])

  async function checkSetupStatus() {
    if (!organization?.id) {
      setLoading(false)
      return
    }

    try {
      const { count: seasonCount } = await supabase
        .from('seasons')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)

      const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)

      const { count: playerCount } = await supabase
        .from('players')
        .select('*, seasons!inner(organization_id)', { count: 'exact', head: true })
        .eq('seasons.organization_id', organization.id)

      const { count: eventCount } = await supabase
        .from('schedule_events')
        .select('*, seasons!inner(organization_id)', { count: 'exact', head: true })
        .eq('seasons.organization_id', organization.id)

      setSetupStatus({
        hasSeason: (seasonCount || 0) > 0,
        hasTeams: (teamCount || 0) > 0,
        hasPlayers: (playerCount || 0) > 0,
        hasSchedule: (eventCount || 0) > 0,
      })
    } catch (err) {
      console.error('Setup status check error:', err)
    }
    setLoading(false)
  }

  const steps = [
    {
      id: 'season',
      number: 1,
      title: 'Create Your First Season',
      description: 'Set up a season with start/end dates and registration fees.',
      icon: 'calendar',
      completed: setupStatus.hasSeason,
      action: () => onNavigate('seasons'),
      actionLabel: 'Go to Seasons',
    },
    {
      id: 'teams',
      number: 2,
      title: 'Add Teams',
      description: 'Create teams and assign age groups or divisions.',
      icon: 'users',
      completed: setupStatus.hasTeams,
      action: () => onNavigate('teams'),
      actionLabel: 'Manage Teams',
    },
    {
      id: 'players',
      number: 3,
      title: 'Register Players',
      description: 'Add players manually or share a registration link.',
      icon: 'volleyball',
      completed: setupStatus.hasPlayers,
      action: () => onNavigate('registrations'),
      actionLabel: 'Add Players',
    },
    {
      id: 'schedule',
      number: 4,
      title: 'Create Schedule',
      description: 'Add practices, games, and events to your calendar.',
      icon: 'calendar',
      completed: setupStatus.hasSchedule,
      action: () => onNavigate('schedule'),
      actionLabel: 'Build Schedule',
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = (completedCount / steps.length) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}></div>
          <span className={tc.textSecondary}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <JourneyTimeline onNavigate={onNavigate} />
      
      {/* Welcome Header */}
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl" style={{ backgroundColor: accent.primary + '20' }}>
          🎉
        </div>
        <h1 className={`text-3xl font-bold ${tc.text} mb-2`}>
          Welcome to {organization?.name || 'VolleyBrain'}!
        </h1>
        <p className={`${tc.textMuted} max-w-md mx-auto`}>
          Let's get your organization set up. Follow these steps to start managing your teams.
        </p>
      </div>

      {/* Progress Bar */}
      <div className={`max-w-2xl mx-auto p-6 rounded-2xl border ${tc.card}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${tc.text}`}>Setup Progress</span>
          <span className={`text-sm font-semibold`} style={{ color: accent.primary }}>
            {completedCount} of {steps.length} complete
          </span>
        </div>
        <div className={`h-3 rounded-full ${tc.cardBgAlt}`}>
          <div 
            className="h-full rounded-full transition-all duration-500" 
            style={{ width: `${progressPercent}%`, backgroundColor: accent.primary }}
          />
        </div>
      </div>

      {/* Setup Steps */}
      <div className="max-w-2xl mx-auto space-y-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`p-5 rounded-2xl border transition-all ${
              step.completed 
                ? `${tc.card} opacity-75` 
                : `${tc.card} hover:shadow-lg`
            }`}
          >
            <div className="flex items-start gap-4">
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                  step.completed ? 'text-white' : tc.text
                }`}
                style={{ 
                  backgroundColor: step.completed ? accent.primary : (tc.cardBgAlt || '#f1f5f9')
                }}
              >
                {step.completed ? '✓' : step.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${tc.text} ${step.completed ? 'line-through opacity-60' : ''}`}>
                    {step.title}
                  </h3>
                  {step.completed && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accent.primary }}>
                      Done
                    </span>
                  )}
                </div>
                <p className={`text-sm ${tc.textMuted}`}>{step.description}</p>
              </div>

              {!step.completed && (
                <button
                  onClick={step.action}
                  className="px-4 py-2 rounded-xl text-white font-medium text-sm shrink-0 transition hover:brightness-110"
                  style={{ backgroundColor: accent.primary }}
                >
                  {step.actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="max-w-2xl mx-auto">
        <h2 className={`text-lg font-semibold ${tc.text} mb-4`}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate('seasons')}
            className={`p-4 rounded-xl border ${tc.card} hover:shadow-md transition text-center`}
          >
            <Calendar className="w-8 h-8 mb-2" />
            <span className={`text-sm font-medium ${tc.text}`}>Seasons</span>
          </button>
          <button 
            onClick={() => onNavigate('coaches')}
            className={`p-4 rounded-xl border ${tc.card} hover:shadow-md transition text-center`}
          >
            <span className="text-2xl mb-2 block">🏆</span>
            <span className={`text-sm font-medium ${tc.text}`}>Add Coaches</span>
          </button>
          <button 
            onClick={() => onNavigate('registrations')}
            className={`p-4 rounded-xl border ${tc.card} hover:shadow-md transition text-center`}
          >
            <ClipboardList className="w-8 h-8 mb-2" />
            <span className={`text-sm font-medium ${tc.text}`}>Registrations</span>
          </button>
          <button 
            onClick={() => onNavigate('organization')}
            className={`p-4 rounded-xl border ${tc.card} hover:shadow-md transition text-center`}
          >
            <Settings className="w-8 h-8 mb-2" />
            <span className={`text-sm font-medium ${tc.text}`}>Settings</span>
          </button>
        </div>
      </div>

      {/* Tip Box */}
      <div className="max-w-2xl mx-auto p-5 rounded-2xl border" style={{ borderColor: accent.primary + '40', backgroundColor: accent.primary + '10' }}>
        <div className="flex gap-4">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className={`font-semibold ${tc.text} mb-1`}>Pro Tip</h3>
            <p className={`text-sm ${tc.textMuted}`}>
              Start by creating a season, then add teams. Once you have teams, you can register players 
              and they'll automatically be assigned to teams during registration or manually by you.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function DashboardPage({ onNavigate }) {
  const { organization, profile } = useAuth()
  const { selectedSeason, loading: seasonLoading } = useSeason()
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const [stats, setStats] = useState({ 
    players: 0, 
    pendingRegs: 0, 
    unpaidCount: 0, 
    unpaidAmount: 0,
    teams: 0,
    missingJerseys: 0,
    missingEmergency: 0
  })
  const [todayEvents, setTodayEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadStats()
    } else if (!seasonLoading) {
      setLoading(false)
    }
  }, [selectedSeason?.id, seasonLoading])

  async function loadStats() {
    setLoading(true)
    try {
      const { count: players } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('season_id', selectedSeason.id)
      const { count: pendingRegs } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('season_id', selectedSeason.id).in('status', ['pending', 'submitted'])
      const { count: teams } = await supabase.from('teams').select('*', { count: 'exact', head: true }).eq('season_id', selectedSeason.id)
      
      const { data: unpaidPayments } = await supabase.from('payments').select('amount').eq('season_id', selectedSeason.id).eq('paid', false)
      const unpaidCount = unpaidPayments?.length || 0
      const unpaidAmount = unpaidPayments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
      
      const { count: missingJerseys } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('season_id', selectedSeason.id).is('jersey_number', null)
      const { count: missingEmergency } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('season_id', selectedSeason.id).is('emergency_contact_name', null)

      const today = new Date().toISOString().split('T')[0]
      const { data: events } = await supabase
        .from('schedule_events')
        .select('*, teams(name, color)')
        .eq('event_date', today)
        .order('event_time', { ascending: true })
        .limit(5)
      
      setTodayEvents(events || [])
      setStats({ 
        players: players || 0, 
        pendingRegs: pendingRegs || 0, 
        unpaidCount: unpaidCount,
        unpaidAmount: unpaidAmount,
        teams: teams || 0,
        missingJerseys: missingJerseys || 0,
        missingEmergency: missingEmergency || 0
      })
    } catch (err) {
      console.error('Stats error:', err)
    }
    setLoading(false)
  }

  const getSeasonProgress = () => {
    if (!selectedSeason?.start_date || !selectedSeason?.end_date) return { progress: 85, weeksElapsed: 11, totalWeeks: 14 }
    const start = new Date(selectedSeason.start_date)
    const end = new Date(selectedSeason.end_date)
    const now = new Date()
    const totalDays = (end - start) / (1000 * 60 * 60 * 24)
    const elapsedDays = Math.max(0, (now - start) / (1000 * 60 * 60 * 24))
    const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
    const totalWeeks = Math.ceil(totalDays / 7)
    const weeksElapsed = Math.ceil(elapsedDays / 7)
    return { progress, weeksElapsed, totalWeeks }
  }

  const seasonProgress = getSeasonProgress()

  const attentionItems = []
  if (stats.unpaidCount > 0) {
    attentionItems.push({
      title: 'Outstanding balances',
      description: `${stats.unpaidCount} players have unpaid fees totaling $${stats.unpaidAmount.toLocaleString()}`,
      priority: 'high',
      time: '2 days',
      action: () => onNavigate('payments')
    })
  }
  if (stats.missingJerseys > 0) {
    attentionItems.push({
      title: 'Jersey assignments',
      description: `${stats.missingJerseys} players need jersey numbers assigned`,
      priority: 'medium',
      action: () => onNavigate('jerseys')
    })
  }
  if (stats.missingEmergency > 0) {
    attentionItems.push({
      title: 'Emergency contacts',
      description: `${stats.missingEmergency} players missing emergency contact info`,
      priority: 'medium',
      action: () => onNavigate('registrations')
    })
  }
  if (stats.pendingRegs > 0) {
    attentionItems.push({
      title: 'Pending registrations',
      description: `${stats.pendingRegs} registrations awaiting approval`,
      priority: 'high',
      action: () => onNavigate('registrations')
    })
  }

  if (!seasonLoading && !selectedSeason) {
    return <GettingStartedGuide onNavigate={onNavigate} />
  }

  if (loading || seasonLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}></div>
          <span className={tc.textSecondary}>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Dashboard</h1>
          <p className={tc.textSecondary}>Welcome back, {profile?.full_name}! Here's what's happening with your league.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`relative ${tc.cardBg} border ${tc.border} rounded-xl px-4 py-2 flex items-center gap-2`}>
            <span className={tc.textMuted}>🔍</span>
            <input 
              type="text" 
              placeholder="Search..." 
              className={`bg-transparent border-none outline-none ${tc.text} w-32`}
            />
            <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-100'} ${tc.textMuted}`}>⌘K</span>
          </div>
          <button className={`p-2.5 rounded-xl ${tc.hoverBg} ${tc.textMuted}`}><Settings className="w-5 h-5" /></button>
          <button className={`p-2.5 rounded-xl ${tc.hoverBg} ${tc.textMuted} relative`}>
            <Bell className="w-5 h-5" />
            {attentionItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white" style={{ backgroundColor: accent.primary }}>
                {attentionItems.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => onNavigate('registrations')}
            className="px-4 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 transition hover:brightness-110"
            style={{ backgroundColor: accent.primary }}
          >
            <span>+</span> Add Player
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Players */}
            <div 
              onClick={() => onNavigate('registrations')}
              className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${tc.card}`}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent.primary }}></div>
              <div className="flex justify-between items-start pt-1">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>Total Players</p>
                  <p className={`text-4xl font-bold ${tc.text} mt-1`}>{stats.players}</p>
                  <p className="text-sm mt-1" style={{ color: accent.primary }}>All registered</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent.primary}20` }}>
                  <Users className="w-5 h-5" style={{ color: accent.primary }} />
                </div>
              </div>
              <p className="text-xs mt-3 flex items-center gap-1" style={{ color: accent.primary }}>
                View details <span>↗</span>
              </p>
            </div>

            {/* Pending */}
            <div 
              onClick={() => onNavigate('registrations')}
              className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${tc.card}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${stats.pendingRegs > 0 ? 'bg-amber-500' : 'bg-transparent'}`}></div>
              <div className="flex justify-between items-start pt-1">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>Pending</p>
                  <p className={`text-4xl font-bold ${tc.text} mt-1`}>{stats.pendingRegs}</p>
                  <p className={`text-sm mt-1 ${tc.textMuted}`}>Registrations</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <ClipboardList className={`w-6 h-6 ${tc.textMuted}`} />
                </div>
              </div>
              <p className="text-xs mt-3 flex items-center gap-1" style={{ color: accent.primary }}>
                View details <span>↗</span>
              </p>
            </div>

            {/* Outstanding */}
            <div 
              onClick={() => onNavigate('payments')}
              className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${tc.card}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${stats.unpaidCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
              <div className="flex justify-between items-start pt-1">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>Outstanding</p>
                  <p className={`text-4xl font-bold ${tc.text} mt-1`}>${stats.unpaidAmount.toLocaleString()}</p>
                  <p className={`text-sm mt-1 ${stats.unpaidCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{stats.unpaidCount} players</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.unpaidCount > 0 ? (isDark ? 'bg-amber-500/20' : 'bg-amber-50') : (isDark ? 'bg-emerald-500/20' : 'bg-emerald-50')}`}>
                  <DollarSign className={`w-6 h-6 ${stats.unpaidCount > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                </div>
              </div>
              <p className="text-xs mt-3 flex items-center gap-1" style={{ color: accent.primary }}>
                View details <span>↗</span>
              </p>
            </div>

            {/* Teams */}
            <div 
              onClick={() => onNavigate('teams')}
              className={`relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${tc.card}`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500"></div>
              <div className="flex justify-between items-start pt-1">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>Teams</p>
                  <p className={`text-4xl font-bold ${tc.text} mt-1`}>{stats.teams}</p>
                  <p className={`text-sm mt-1 ${tc.textMuted}`}>Active rosters</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-sky-500/20' : 'bg-sky-50'}`}>
                  <VolleyballIcon className="w-5 h-5 text-sky-500" />
                </div>
              </div>
              <p className="text-xs mt-3 flex items-center gap-1" style={{ color: accent.primary }}>
                View details <span>↗</span>
              </p>
            </div>
          </div>

          {/* Needs Attention */}
          {attentionItems.length > 0 && (
            <div className={`${tc.cardBg} border ${tc.border} rounded-2xl`}>
              <div className={`px-6 py-4 border-b ${tc.border} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <h2 className={`font-semibold ${tc.text}`}>Needs Attention</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-500">
                    {attentionItems.length} items
                  </span>
                </div>
                <button className="text-sm flex items-center gap-1" style={{ color: accent.primary }}>
                  View all <span>›</span>
                </button>
              </div>
              <div className="py-2">
                {attentionItems.map((item, i) => (
                  <div
                    key={i}
                    onClick={item.action}
                    className={`flex items-center gap-4 py-4 cursor-pointer transition-colors ${tc.hoverBg} px-6`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.priority === 'high' ? 'bg-amber-500' : 
                      item.priority === 'medium' ? 'bg-sky-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${tc.text}`}>{item.title}</p>
                      <p className={`text-sm ${tc.textMuted} truncate`}>{item.description}</p>
                    </div>
                    {item.time && (
                      <div className={`flex items-center gap-1 text-xs ${tc.textMuted}`}>
                        <span>🕐</span>
                        <span>{item.time}</span>
                      </div>
                    )}
                    <span className={`text-sm ${tc.textMuted}`}>›</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className={`font-semibold ${tc.text} mb-4`}>Quick Actions</h2>
            <div className="grid grid-cols-3 gap-4">
              <div
                onClick={() => onNavigate('registrations')}
                className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 min-h-[140px]`}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = accent.primary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${accent.primary}20` }}>
                  <ClipboardList className="w-6 h-6" style={{ color: accent.primary }} />
                </div>
                <p className={`font-semibold ${tc.text} mb-1`}>Registrations</p>
                <p className={`text-sm ${tc.textMuted}`}>View and manage all player registrations</p>
              </div>

              <div
                onClick={() => onNavigate('payments')}
                className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 min-h-[140px]`}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F59E0B'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                  <DollarSign className="w-6 h-6 text-amber-500" />
                </div>
                <p className={`font-semibold ${tc.text} mb-1`}>Payments</p>
                <p className={`text-sm ${tc.textMuted}`}>Track finances and collect fees</p>
              </div>

              <div
                onClick={() => onNavigate('teams')}
                className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 min-h-[140px]`}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0EA5E9'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-sky-500/20' : 'bg-sky-50'}`}>
                  <VolleyballIcon className="w-6 h-6 text-sky-500" />
                </div>
                <p className={`font-semibold ${tc.text} mb-1`}>Teams</p>
                <p className={`text-sm ${tc.textMuted}`}>Manage rosters and assignments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 4 cols */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Season Progress */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-semibold ${tc.text}`}>Season Progress</h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-500">Active</span>
            </div>
            
            <div className={`flex items-center gap-5 p-5 rounded-xl ${tc.cardBgAlt}`}>
              {/* Progress Ring */}
              <div className="relative" style={{ width: 64, height: 64 }}>
                <svg className="w-full h-full -rotate-90">
                  <circle 
                    cx="32" cy="32" r="29" 
                    stroke={isDark ? '#334155' : '#E2E8F0'} 
                    strokeWidth="6" 
                    fill="none" 
                  />
                  <circle 
                    cx="32" cy="32" r="29" 
                    stroke={accent.primary} 
                    strokeWidth="6" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={182}
                    strokeDashoffset={182 - (182 * seasonProgress.progress / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${tc.text}`}>
                  {seasonProgress.progress}%
                </span>
              </div>
              <div>
                <p className={`font-semibold ${tc.text}`}>{selectedSeason?.name || 'Spring 2026'}</p>
                <p className={`text-sm ${tc.textMuted}`}>Week {seasonProgress.weeksElapsed} of {seasonProgress.totalWeeks}</p>
              </div>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className={`flex justify-between py-2 border-b ${tc.border}`}>
                <span className={`text-sm ${tc.textMuted}`}>Registration Fee</span>
                <span className={`text-sm font-semibold ${tc.text}`}>${selectedSeason?.fee_registration || selectedSeason?.registration_fee || 150}</span>
              </div>
              <div className={`flex justify-between py-2 border-b ${tc.border}`}>
                <span className={`text-sm ${tc.textMuted}`}>Games Played</span>
                <span className={`text-sm font-semibold ${tc.text}`}>18 of 24</span>
              </div>
              <div className={`flex justify-between py-2`}>
                <span className={`text-sm ${tc.textMuted}`}>Season Ends</span>
                <span className={`text-sm font-semibold ${tc.text}`}>{selectedSeason?.end_date ? new Date(selectedSeason.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Mar 28, 2026'}</span>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-semibold ${tc.text}`}>Today's Schedule</h3>
              <span className={`text-sm ${tc.textMuted}`}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            
            {todayEvents.length === 0 ? (
              <div className={`text-center py-8 ${tc.textMuted}`}>
                <Calendar className="w-10 h-10 mb-2" />
                <p>No events scheduled today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayEvents.map(event => (
                  <div key={event.id} className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
                    <div className="flex items-start gap-4">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${tc.text}`}>
                          {event.event_time ? new Date(`2000-01-01T${event.event_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0] : '—'}
                        </p>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {event.event_time ? new Date(`2000-01-01T${event.event_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[1] : ''}
                        </p>
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
                          event.event_type === 'game' ? 'bg-emerald-500/20 text-emerald-500' :
                          event.event_type === 'practice' ? 'bg-sky-500/20 text-sky-500' :
                          'bg-purple-500/20 text-purple-500'
                        }`}>
                          {event.event_type}
                        </span>
                        <p className={`font-semibold ${tc.text} mt-1`}>
                          {event.title || (event.event_type === 'game' ? `${event.teams?.name || 'Team'} vs ${event.opponent_name || 'Opponent'}` : `${event.teams?.name || 'Team'} Practice`)}
                        </p>
                        <p className={`text-sm ${tc.textMuted} flex items-center gap-1 mt-1`}>
                          <span>📍</span> {event.venue_name || 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => onNavigate('schedule')}
              className={`w-full mt-4 py-3 rounded-xl border ${tc.border} ${tc.text} font-medium ${tc.hoverBg} transition flex items-center justify-center gap-2`}
            >
              <Calendar className="w-5 h-5" /> View Full Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
