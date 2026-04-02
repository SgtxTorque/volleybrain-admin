import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { supabase } from '../../lib/supabase'
import { SkeletonDashboard } from '../../components/ui'
import {
  HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  WeeklyLoad, OrgHealthCard, ThePlaybook, MilestoneCard, MascotNudge,
  V2DashboardLayout,
} from '../../components/v2'
import SeasonCarousel from '../../components/v2/admin/SeasonCarousel'
import SeasonStepper from '../../components/v2/admin/SeasonStepper'
import AdminTeamsTab from '../../components/v2/admin/AdminTeamsTab'
import AdminRegistrationsTab from '../../components/v2/admin/AdminRegistrationsTab'
import AdminPaymentsTab from '../../components/v2/admin/AdminPaymentsTab'
import AdminScheduleTab from '../../components/v2/admin/AdminScheduleTab'
import EngagementLevelCard from '../../components/engagement/EngagementLevelCard'
import EngagementActivityCard from '../../components/engagement/EngagementActivityCard'
import EngagementBadgesCard from '../../components/engagement/EngagementBadgesCard'
import EngagementTeamPulseCard from '../../components/engagement/EngagementTeamPulseCard'
import { getLevelFromXP, getLevelTier } from '../../lib/engagement-constants'

// Old inline widgets (DashCard, CardHeader, DonutChart, SeasonCard, etc.) removed in v2 swap

// ============================================
// GETTING STARTED GUIDE (No Season)
// ============================================
// ============================================
// EMPTY STATE CTA CARD (reusable for onboarding)
// ============================================
function EmptyStateCTA({ emoji, title, description, buttonLabel, onClick, isDark }) {
  return (
    <div className={`rounded-[14px] border-2 border-dashed border-[#4BB9EC]/30 p-8 text-center ${isDark ? 'bg-[#132240]/50' : 'bg-[#4BB9EC]/[0.03]'}`}>
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-extrabold text-lg mb-1" style={{ color: 'var(--v2-text-primary)' }}>{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      <button onClick={onClick}
        className="px-6 py-2.5 bg-lynx-navy-subtle text-white font-bold rounded-xl hover:brightness-110 transition">
        {buttonLabel}
      </button>
    </div>
  )
}

// ============================================
// GETTING STARTED GUIDE (No Season)
// ============================================
export function GettingStartedGuide({ onNavigate }) {
  const { organization, profile } = useAuth()
  const { isDark } = useTheme()
  const { sports } = useSport()
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Admin'

  // Org setup completion detection
  const orgSetupDone = Boolean(
    organization?.name &&
    organization?.contact_email &&
    sports?.length > 0
  )
  const paymentSetupDone = Boolean(
    organization?.stripe_enabled ||
    organization?.payment_venmo ||
    organization?.payment_zelle ||
    organization?.payment_cashapp
  )
  const foundationDone = orgSetupDone && paymentSetupDone

  const setupSteps = [
    { label: 'Org Profile', page: 'organization', done: orgSetupDone },
    { label: 'Payment Setup', page: 'payment-setup', done: paymentSetupDone },
    { label: 'Create Season', page: 'seasons', done: false },
    { label: 'Add Teams', page: 'teams', done: false },
    { label: 'Add Coaches', page: 'coaches', done: false },
    { label: 'Create Schedule', page: 'schedule', done: false },
    { label: 'Open Registration', page: 'registration-templates', done: false },
  ]

  // Greeting changes based on foundation readiness
  const greeting = !foundationDone
    ? `Welcome to Lynx, ${firstName}! Let's set up your club.`
    : `Great start, ${firstName}. Now let's create your first season.`

  return (
    <div style={{ padding: '32px 32px 80px', fontFamily: 'var(--v2-font)', maxWidth: 900, margin: '0 auto' }}>
      {/* Greeting */}
      <div className="text-center mb-8">
        <img src="/images/mascots/waving.png" alt="" className="w-24 h-24 mx-auto mb-4 object-contain" onError={e => { e.target.style.display = 'none' }} />
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--v2-text-primary)' }}>
          {greeting}
        </h1>
        <p className="text-sm" style={{ color: 'var(--v2-text-muted)' }}>
          {!foundationDone
            ? 'Complete your organization setup first — it feeds into seasons, registration, and payments.'
            : 'Follow the steps below to launch your organization. Your dashboard will come alive as data flows in.'}
        </p>
      </div>

      {/* Setup Journey Stepper */}
      <div className={`rounded-[14px] p-6 mb-8 ${isDark ? 'bg-[#132240]/80 border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`} style={{ boxShadow: 'var(--v2-card-shadow)' }}>
        <h2 className="text-sm font-extrabold uppercase tracking-widest mb-4" style={{ color: 'var(--v2-text-muted)' }}>Setup Progress</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {setupSteps.map((step, i) => {
            const isCurrent = !step.done && setupSteps.slice(0, i).every(s => s.done)
            // Steps beyond prerequisites are grayed out and not clickable
            const prerequisitesMet = setupSteps.slice(0, i).every(s => s.done)
            const isLocked = !step.done && !isCurrent && !prerequisitesMet
            return (
              <button key={step.label}
                onClick={() => !isLocked && onNavigate?.(step.page)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition hover:brightness-95"
                style={{
                  background: step.done ? '#22C55E20' : isCurrent ? '#4BB9EC20' : isDark ? 'rgba(255,255,255,0.04)' : '#F5F6F8',
                  border: isCurrent ? '2px solid #4BB9EC' : '2px solid transparent',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.4 : 1,
                }}>
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: step.done ? '#22C55E' : isCurrent ? '#4BB9EC' : isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1',
                    color: step.done || isCurrent ? '#FFFFFF' : 'var(--v2-text-muted)',
                  }}>
                  {step.done ? '✓' : i + 1}
                </span>
                <span className="text-xs font-bold" style={{ color: step.done ? '#22C55E' : isCurrent ? '#4BB9EC' : 'var(--v2-text-muted)' }}>
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Primary CTA: Org Setup when foundation not ready */}
      {!foundationDone && (
        <div className={`rounded-2xl border-2 border-dashed border-[#4BB9EC]/40 p-8 mb-6 text-center ${isDark ? 'bg-[#4BB9EC]/[0.04]' : 'bg-[#4BB9EC]/[0.03]'}`}>
          <div className="text-4xl mb-3">{'\uD83C\uDFE2'}</div>
          <h3 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
            Complete Your Organization Setup
          </h3>
          <p className={`text-sm mb-4 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Set up your club's identity, contact info, sports, payment methods, and fees. This information feeds into seasons, registration, and payments.
          </p>
          <button onClick={() => onNavigate?.('organization')}
            className="px-8 py-3 bg-lynx-navy-subtle text-white font-bold rounded-xl hover:brightness-110 transition text-sm">
            Start Organization Setup {'\u2192'}
          </button>
          <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Takes about 5-10 minutes to complete the essentials
          </p>
        </div>
      )}

      {/* When foundation is NOT ready, show grayed-out preview of upcoming steps */}
      {!foundationDone && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className={`rounded-[14px] border border-dashed p-4 text-center ${isDark ? 'border-white/10' : 'border-slate-200'}`} style={{ opacity: 0.5 }}>
            <div className="text-xl mb-1">{'\uD83D\uDCC5'}</div>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create Season</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>After org setup</p>
          </div>
          <div className={`rounded-[14px] border border-dashed p-4 text-center ${isDark ? 'border-white/10' : 'border-slate-200'}`} style={{ opacity: 0.5 }}>
            <div className="text-xl mb-1">{'\uD83D\uDC65'}</div>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Add Teams</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>After creating a season</p>
          </div>
          <div className={`rounded-[14px] border border-dashed p-4 text-center ${isDark ? 'border-white/10' : 'border-slate-200'}`} style={{ opacity: 0.5 }}>
            <div className="text-xl mb-1">{'\uD83D\uDCCB'}</div>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Open Registration</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>After adding teams</p>
          </div>
        </div>
      )}

      {/* When foundation IS ready, show full CTA grid */}
      {foundationDone && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EmptyStateCTA emoji={'\uD83D\uDCC5'} title="Create Your First Season"
            description="Define your season dates, fees, and registration windows"
            buttonLabel="+ Create Season" onClick={() => onNavigate?.('seasons')} isDark={isDark} />
          <EmptyStateCTA emoji={'\uD83D\uDC65'} title="Add Your First Team"
            description="Create teams and start building your rosters"
            buttonLabel="+ Create Team" onClick={() => onNavigate?.('teams')} isDark={isDark} />
          <EmptyStateCTA emoji={'\uD83D\uDCCB'} title="Open Registration"
            description="Create a season first, then open registration for families"
            buttonLabel="Set Up Registration" onClick={() => onNavigate?.('registration-templates')} isDark={isDark} />
          <EmptyStateCTA emoji={'\uD83D\uDCC6'} title="Create Schedule"
            description="Add practices, games, and events for your teams"
            buttonLabel="Go to Schedule" onClick={() => onNavigate?.('schedule')} isDark={isDark} />
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function DashboardPage({ onNavigate, activeView, availableViews = [], onSwitchRole }) {
  const { organization, profile, user } = useAuth()
  const { seasons, allSeasons, selectedSeason, selectSeason, loading: seasonLoading } = useSeason()
  const { sports, selectedSport, selectSport } = useSport()
  const { isDark, accent, toggleTheme } = useTheme()
  const { orgName, orgLogo } = useOrgBranding()
  const [filterTeam, setFilterTeam] = useState('all')
  const [stats, setStats] = useState({
    // Season stats
    teams: 0,
    rosteredPlayers: 0,
    totalCapacity: 0,
    nextGame: null,

    // Financial stats
    totalCollected: 0,
    pastDue: 0,
    paidOnline: 0,
    paidManual: 0,
    overdueFees: 0,
    overdueStripe: 0,

    // Registration stats
    totalRegistrations: 0,
    approved: 0,
    pending: 0,
    waitlisted: 0,
    denied: 0,
    capacity: 0,
    passTypeName: 'Season Pass',
    coachCount: 0,
    unsignedWaivers: 0,
    totalExpected: 0,
  })
  const [registrationPlayers, setRegistrationPlayers] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [monthlyPayments, setMonthlyPayments] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [teamsData, setTeamsData] = useState([])
  const [teamStats, setTeamStats] = useState({})
  const [recentPaymentsNamed, setRecentPaymentsNamed] = useState([])
  const [paymentFamilies, setPaymentFamilies] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [coachesData, setCoachesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('teams')
  const [perSeasonTeamCounts, setPerSeasonTeamCounts] = useState({})
  const [perSeasonPlayerCounts, setPerSeasonPlayerCounts] = useState({})
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [attentionExpanded, setAttentionExpanded] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Engagement column state
  const [adminBadges, setAdminBadges] = useState([])
  const [totalAchievements, setTotalAchievements] = useState(0)
  const [adminPulseData, setAdminPulseData] = useState({ active: 0, drifting: 0, inactive: 0 })
  const [weeklyBlasts, setWeeklyBlasts] = useState(0)
  const [weeklyRegs, setWeeklyRegs] = useState(0)
  const [weeklyRevenue, setWeeklyRevenue] = useState(0)
  const [nextBadgeProgress, setNextBadgeProgress] = useState(null)

  // ── Org setup completion detection (onboarding priority) ──
  const orgSetupComplete = Boolean(
    organization?.name &&
    organization?.contact_email &&
    sports?.length > 0
  )
  const paymentSetupComplete = Boolean(
    organization?.stripe_enabled ||
    organization?.payment_venmo ||
    organization?.payment_zelle ||
    organization?.payment_cashapp
  )
  const foundationReady = orgSetupComplete && paymentSetupComplete
  const [perSeasonActionCounts, setPerSeasonActionCounts] = useState({})
  const [perSeasonActionDetails, setPerSeasonActionDetails] = useState({})
  const [globalStats, setGlobalStats] = useState({
    totalCollected: 0,
    totalExpected: 0,
    pastDue: 0,
    coachCount: 0,
    actionCount: 0,
    paymentsByType: null,
  })
  // Stable random seed for contextual message rotation (one pick per mount)
  const msgSeed = useMemo(() => Math.random(), [])

  // Fetch per-season counts + global stats (re-runs when sport filter changes)
  useEffect(() => {
    let seasonList = allSeasons || seasons || []
    if (seasonList.length === 0) return
    // Filter seasons by sport if a sport is selected
    if (selectedSport?.id) {
      seasonList = seasonList.filter(s => s.sport_id === selectedSport.id)
      if (seasonList.length === 0) {
        // Sport has no seasons — clear all stats so stale data doesn't show
        setPerSeasonTeamCounts({})
        setPerSeasonPlayerCounts({})
        setPerSeasonActionCounts({})
        setPerSeasonActionDetails({})
        setGlobalStats({
          totalCollected: 0,
          totalExpected: 0,
          pastDue: 0,
          coachCount: 0,
          actionCount: 0,
          paymentsByType: null,
        })
        return
      }
    }
    const seasonIds = seasonList.map(s => s.id)
    ;(async () => {
      try {
        // Teams per season
        const { data: allTeams } = await supabase
          .from('teams')
          .select('id, season_id')
          .in('season_id', seasonIds)
        const tMap = {}
        ;(allTeams || []).forEach(t => { tMap[t.season_id] = (tMap[t.season_id] || 0) + 1 })
        setPerSeasonTeamCounts(tMap)

        // Players per season (include registration status for action counts)
        const { data: allPlayers } = await supabase
          .from('players')
          .select('id, season_id, registrations(status)')
          .in('season_id', seasonIds)
        const pMap = {}
        const pendingRegsBySeason = {}
        ;(allPlayers || []).forEach(p => {
          pMap[p.season_id] = (pMap[p.season_id] || 0) + 1
          const status = p.registrations?.[0]?.status
          if (['pending', 'submitted', 'new'].includes(status)) {
            pendingRegsBySeason[p.season_id] = (pendingRegsBySeason[p.season_id] || 0) + 1
          }
        })
        setPerSeasonPlayerCounts(pMap)

        // All payments across all seasons (for global financial + per-season action counts)
        const { data: globalPaymentsRaw } = await supabase
          .from('payments')
          .select('id, season_id, amount, paid, fee_type')
          .in('season_id', seasonIds)

        const gPaid = (globalPaymentsRaw || []).filter(p => p.paid)
        const gUnpaid = (globalPaymentsRaw || []).filter(p => !p.paid)
        const globalCollected = gPaid.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const globalOutstanding = gUnpaid.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        const globalExpected = globalCollected + globalOutstanding

        // Per-season unpaid payment counts
        const unpaidBySeason = {}
        gUnpaid.forEach(p => {
          unpaidBySeason[p.season_id] = (unpaidBySeason[p.season_id] || 0) + 1
        })

        // Per-season action item counts + details (pending regs + unpaid payments)
        // Note: Action Items tab also includes waivers, unrostered players, and
        // teams without schedule, but those require per-season queries that are
        // only loaded for the currently selected season.
        const actionMap = {}
        const detailsMap = {}
        let totalGlobalActions = 0
        seasonIds.forEach(sid => {
          const pending = pendingRegsBySeason[sid] || 0
          const unpaid = unpaidBySeason[sid] || 0
          const count = pending + unpaid
          if (count > 0) {
            actionMap[sid] = count
            const details = []
            if (pending > 0) details.push({ label: 'Pending Registrations', count: pending })
            if (unpaid > 0) details.push({ label: 'Overdue Payments', count: unpaid })
            detailsMap[sid] = details
          }
          totalGlobalActions += count
        })
        setPerSeasonActionCounts(actionMap)
        setPerSeasonActionDetails(detailsMap)

        // Global payment breakdown by type
        const globalPaymentsByType = {
          registration: (globalPaymentsRaw || []).filter(p => p.fee_type === 'registration'),
          uniform: (globalPaymentsRaw || []).filter(p => p.fee_type === 'uniform'),
          monthly: (globalPaymentsRaw || []).filter(p => p.fee_type === 'monthly'),
          other: (globalPaymentsRaw || []).filter(p => !['registration', 'uniform', 'monthly'].includes(p.fee_type)),
        }

        // Global coach count
        const allTeamIds = (allTeams || []).map(t => t.id)
        let globalCoachCount = 0
        if (allTeamIds.length > 0) {
          const { data: allTc } = await supabase
            .from('team_coaches')
            .select('coach_id')
            .in('team_id', allTeamIds)
          globalCoachCount = new Set((allTc || []).map(tc => tc.coach_id)).size
        }

        setGlobalStats({
          totalCollected: globalCollected,
          totalExpected: globalExpected,
          pastDue: globalOutstanding,
          coachCount: globalCoachCount,
          actionCount: totalGlobalActions,
          paymentsByType: globalPaymentsByType,
        })
      } catch (err) {
        console.error('Per-season counts error:', err)
      }
    })()
  }, [allSeasons, seasons, selectedSport?.id])

  // Reset team filter when season changes
  useEffect(() => {
    setFilterTeam('all')
  }, [selectedSeason?.id])

  // Immediately show loading state when season changes (prevents stale data flash)
  useEffect(() => {
    if (selectedSeason?.id && !isAllSeasons(selectedSeason)) {
      setLoading(true)
    }
  }, [selectedSeason?.id])

  useEffect(() => {
    // Don't load per-season data when "All Seasons" is active — use globalStats instead
    if (isAllSeasons(selectedSeason)) {
      setLoading(false)
      setInitialLoadComplete(true)
      return
    }
    if (selectedSeason?.id) {
      loadDashboardData()
    }
  }, [selectedSeason?.id, seasonLoading, filterTeam])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const seasonId = selectedSeason.id
      const orgId = selectedSeason.organization_id

      // Fetch teams for this season (include color + max_players for roster health)
      const { data: teams, count: teamCount } = await supabase
        .from('teams')
        .select('id, name, color, max_players', { count: 'exact' })
        .eq('season_id', seasonId)

      // Apply team filter — use all teams for teamsData display, but filter stats
      const allTeamIds = teams?.map(t => t.id) || []
      const teamIds = filterTeam !== 'all' ? [filterTeam] : allTeamIds
      let actualRosteredCount = 0
      if (teamIds.length > 0) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('player_id')
          .in('team_id', teamIds)
        actualRosteredCount = new Set(teamPlayers?.map(tp => tp.player_id) || []).size
      }

      // Fetch ALL players with registrations for this season (matching RegistrationsPage query)
      const { data: players } = await supabase
        .from('players')
        .select('*, registrations(*)')
        .eq('season_id', seasonId)

      // If filtering by team, get that team's player IDs to scope stats
      let teamPlayerIds = null
      if (filterTeam !== 'all' && teamIds.length > 0) {
        const { data: filteredTp } = await supabase
          .from('team_players')
          .select('player_id')
          .in('team_id', teamIds)
        teamPlayerIds = new Set(filteredTp?.map(tp => tp.player_id) || [])
      }

      // Filter players if team is selected
      const scopedPlayers = teamPlayerIds
        ? (players || []).filter(p => teamPlayerIds.has(p.id))
        : players || []

      // Get registration status from the joined registrations
      const registrations = scopedPlayers.map(p => ({
        id: p.registrations?.[0]?.id,
        status: p.registrations?.[0]?.status,
        first_name: p.first_name,
        last_name: p.last_name,
        created_at: p.registrations?.[0]?.created_at || p.created_at,
        player_id: p.id
      })) || []

      // Store player data for registration list
      setRegistrationPlayers(scopedPlayers)

      // Calculate registration stats correctly (include 'active' as rostered)
      const regStats = {
        total: registrations.length,
        pending: registrations.filter(r => ['pending', 'submitted', 'new'].includes(r.status)).length,
        approved: registrations.filter(r => r.status === 'approved').length,
        rostered: actualRosteredCount, // Use actual team_players count
        registrationRostered: registrations.filter(r => ['rostered', 'active'].includes(r.status)).length,
        waitlisted: registrations.filter(r => r.status === 'waitlisted').length,
        denied: registrations.filter(r => r.status === 'withdrawn').length,
        withdrawn: registrations.filter(r => r.status === 'withdrawn').length,
      }

      // Unrostered = approved/active but not on a team
      regStats.unrostered = regStats.total - regStats.rostered - regStats.pending - regStats.waitlisted - regStats.denied

      // Calculate capacity from season settings or default per team
      const seasonCapacity = selectedSeason.capacity || selectedSeason.registration_capacity || 0
      const totalCapacity = seasonCapacity || (teamCount || 0) * 12

      // Fetch payments for this season (with player + parent info for family rollup)
      const { data: allPayments } = await supabase
        .from('payments')
        .select('id, amount, paid, payment_method, fee_type, created_at, due_date, paid_at, player_id, players(id, first_name, last_name, parent_name, parent_phone, parent_email)')
        .eq('season_id', seasonId)

      // Scope payments to team's players if filtered
      const payments = teamPlayerIds
        ? (allPayments || []).filter(p => teamPlayerIds.has(p.player_id))
        : allPayments || []

      const paidPayments = payments.filter(p => p.paid)
      const unpaidPayments = payments.filter(p => !p.paid)

      const totalCollected = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const totalExpected = payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
      const pastDue = unpaidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const paidOnline = paidPayments.filter(p => p.payment_method === 'stripe').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const paidManual = paidPayments.filter(p => p.payment_method !== 'stripe').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

      // Per-source breakdowns
      const paidBySource = {
        stripe: paidOnline,
        zelle: paidPayments.filter(p => p.payment_method === 'zelle').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        cashapp: paidPayments.filter(p => p.payment_method === 'cashapp').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        venmo: paidPayments.filter(p => p.payment_method === 'venmo').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        cash_check: paidPayments.filter(p => ['cash', 'check', 'cash_check'].includes(p.payment_method)).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      }

      // Group payments by fee type for breakdown
      const paymentsByType = {
        registration: payments?.filter(p => p.fee_type === 'registration') || [],
        uniform: payments?.filter(p => p.fee_type === 'uniform') || [],
        monthly: payments?.filter(p => p.fee_type === 'monthly') || [],
        other: payments?.filter(p => !['registration', 'uniform', 'monthly'].includes(p.fee_type)) || [],
      }

      // Fetch upcoming events - include org-wide (null team_id) AND season-specific teams
      const today = new Date().toISOString().split('T')[0]
      // teamIds already declared above when fetching rostered count

      let eventsQuery = supabase
        .from('schedule_events')
        .select('*, teams(name, color)')
        .eq('season_id', seasonId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      // Filter by specific team if selected, otherwise show all season events
      if (filterTeam !== 'all') {
        eventsQuery = eventsQuery.or(`team_id.eq.${filterTeam},team_id.is.null`)
      }

      const { data: events } = await eventsQuery

      // Get next game from schedule_events (not games table which doesn't exist)
      const nextGameEvent = events?.find(e => e.event_type === 'game')
      let nextGame = null
      if (nextGameEvent) {
        const gameDate = new Date(nextGameEvent.event_date)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const time = nextGameEvent.event_time ?
          new Date(`2000-01-01T${nextGameEvent.event_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
        nextGame = `${days[gameDate.getDay()]}, ${time}`
      }

      // Fetch top 10 players by total points for leaderboard
      const { data: leaderboardData } = await supabase
        .from('player_season_stats')
        .select('*, player:players(id, first_name, last_name, jersey_number, photo_url, position), team:teams(id, name, color)')
        .eq('season_id', seasonId)
        .gt('games_played', 0)
        .order('total_points', { ascending: false })
        .limit(10)
      setTopPlayers(leaderboardData || [])

      // Fetch recent activity (real data from multiple sources)
      const recentActivity = []

      // Recent registrations
      const recentRegs = registrations
        ?.filter(r => r.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3) || []

      recentRegs.forEach(r => {
        recentActivity.push({
          type: 'registration',
          name: `${r.first_name} ${r.last_name}`,
          initials: `${r.first_name?.[0] || ''}${r.last_name?.[0] || ''}`,
          action: r.status === 'pending' ? 'Registration submitted' : `Registration ${r.status}`,
          timestamp: r.created_at,
        })
      })

      // Recent payments
      const recentPays = paidPayments
        .filter(p => p.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 2)

      recentPays.forEach(p => {
        recentActivity.push({
          type: 'payment',
          name: '',
          initials: '$',
          action: 'Payment received',
          highlight: `$${parseFloat(p.amount).toFixed(0)}`,
          timestamp: p.created_at,
        })
      })

      // Fetch coach count for this season's teams + track which teams have a coach
      let coachCount = 0
      let teamsWithCoachCount = 0
      if (teamIds.length > 0) {
        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('coach_id, team_id')
          .in('team_id', teamIds)
        coachCount = new Set(teamCoaches?.map(tc => tc.coach_id) || []).size
        teamsWithCoachCount = new Set(teamCoaches?.map(tc => tc.team_id) || []).size

        // Load coach profiles for Coach Section
        const uniqueCoachIds = [...new Set(teamCoaches?.map(tc => tc.coach_id) || [])]
        if (uniqueCoachIds.length > 0) {
          try {
            const { data: coachProfiles } = await supabase
              .from('coaches')
              .select('id, profile_id, profiles:profile_id(first_name, last_name)')
              .in('id', uniqueCoachIds)
            setCoachesData((coachProfiles || []).map(c => ({
              id: c.id,
              name: c.profiles ? `${c.profiles.first_name} ${c.profiles.last_name}` : 'Unknown',
              teams: (teamCoaches || []).filter(tc => tc.coach_id === c.id).map(tc => {
                const team = teams?.find(t => t.id === tc.team_id)
                return team?.name || ''
              }).filter(Boolean)
            })))
          } catch { setCoachesData([]) }
        } else {
          setCoachesData([])
        }
      }

      // Fetch unsigned waivers count
      let unsignedWaivers = 0
      try {
        const { count: activeWaivers } = await supabase
          .from('waiver_templates')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true)

        const { count: signedCount } = await supabase
          .from('waiver_signatures')
          .select('id', { count: 'exact', head: true })

        // Approximate: unsigned = (active waivers * total players) - signed
        // Simplified: just show waivers that need attention
        const expectedSigs = (activeWaivers || 0) * (regStats.total || 0)
        unsignedWaivers = Math.max(0, expectedSigs - (signedCount || 0))
      } catch {
        // Waivers table may not have org_id column — gracefully degrade
      }

      // Build per-team stats for TeamSnapshot
      const perTeamStats = {}
      if (teamIds.length > 0) {
        const { data: allTeamPlayers } = await supabase
          .from('team_players')
          .select('team_id, player_id')
          .in('team_id', teamIds)

        teamIds.forEach(tid => {
          const count = allTeamPlayers?.filter(tp => tp.team_id === tid).length || 0
          perTeamStats[tid] = { playerCount: count, record: '0W-0L' }
        })

        // Try to get game records per team
        try {
          const { data: gameResults } = await supabase
            .from('games')
            .select('home_team_id, away_team_id, home_score, away_score, status')
            .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
            .eq('status', 'completed')

          if (gameResults) {
            teamIds.forEach(tid => {
              let wins = 0, losses = 0
              gameResults.forEach(g => {
                if (g.home_team_id === tid && g.home_score > g.away_score) wins++
                else if (g.home_team_id === tid && g.home_score < g.away_score) losses++
                else if (g.away_team_id === tid && g.away_score > g.home_score) wins++
                else if (g.away_team_id === tid && g.away_score < g.home_score) losses++
              })
              perTeamStats[tid].record = `${wins}W-${losses}L`
            })
          }
        } catch {
          // games table may not exist — gracefully degrade
        }
      }
      // Count open spots (max_players - current players) across filtered teams
      let openSpots = 0
      if (teams?.length > 0) {
        teams.forEach(t => {
          if (!teamIds.includes(t.id)) return
          const maxP = t.max_players || 12
          const current = perTeamStats[t.id]?.playerCount || 0
          openSpots += Math.max(0, maxP - current)
        })
      }

      setTeamsData(teams || [])
      setTeamStats(perTeamStats)

      // Build recent payments with player names for PaymentSummaryCard
      try {
        let recentQuery = supabase
          .from('payments')
          .select('amount, created_at, fee_type, player_id, players(first_name, last_name)')
          .eq('season_id', seasonId)
          .eq('paid', true)
          .order('created_at', { ascending: false })
          .limit(teamPlayerIds ? 50 : 5)

        const { data: namedPayments } = await recentQuery

        // Filter by team players if needed, then take 5
        const scopedRecent = teamPlayerIds
          ? (namedPayments || []).filter(p => teamPlayerIds.has(p.player_id)).slice(0, 5)
          : (namedPayments || []).slice(0, 5)

        setRecentPaymentsNamed(
          scopedRecent.map(p => {
            const d = new Date(p.created_at)
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            const yy = String(d.getFullYear()).slice(-2)
            return {
              name: p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown',
              date: `${mm}/${dd}/${yy}`,
              lineItem: p.fee_type ? p.fee_type.charAt(0).toUpperCase() + p.fee_type.slice(1) : '—',
              amount: `$${parseFloat(p.amount).toLocaleString()}`,
            }
          })
        )
      } catch {
        setRecentPaymentsNamed([])
      }

      setUpcomingEvents(events || [])
      setRecentActivity(recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5))

      setStats({
        teams: teamIds.length,
        rosteredPlayers: regStats.rostered,
        approvedPlayers: regStats.approved,
        pendingPlayers: regStats.pending,
        totalCapacity,
        nextGame,
        totalCollected,
        totalExpected,
        pastDue,
        paidOnline,
        paidManual,
        overdueFees: pastDue,
        overdueStripe: 0,
        totalRegistrations: regStats.total,
        ...regStats,
        capacity: totalCapacity,
        passTypeName: selectedSeason?.name || 'Season Pass',
        paymentsByType,
        paidBySource,
        coachCount,
        unsignedWaivers,
        teamsWithCoach: teamsWithCoachCount,
        openSpots,
        unpaidCount: unpaidPayments.length,
      })

      // Generate monthly payment data for chart (real data based on payments)
      const now = new Date()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = []

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const monthPayments = paidPayments.filter(p => {
          const payDate = new Date(p.created_at)
          return payDate >= monthDate && payDate <= monthEnd
        })

        monthlyData.push({
          label: monthNames[monthDate.getMonth()],
          value: monthPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        })
      }

      setMonthlyPayments(monthlyData)

      // Build family-level payment rollups for collections worklist
      try {
        const familyMap = {}
        for (const payment of payments) {
          const parentKey = payment.players?.parent_name || payment.players?.parent_email || `player-${payment.player_id}`
          const parentName = payment.players?.parent_name || 'Unknown'

          if (!familyMap[parentKey]) {
            familyMap[parentKey] = {
              parentKey,
              parentName,
              parentEmail: payment.players?.parent_email || '',
              parentPhone: payment.players?.parent_phone || '',
              children: [],
              lineItems: [],
              totalDue: 0,
              totalPaid: 0,
              earliestDueDate: null,
              lastPaymentDate: null,
              needsApproval: false,
            }
          }

          const family = familyMap[parentKey]

          // Track children
          const childName = payment.players ? `${payment.players.first_name || ''} ${payment.players.last_name || ''}`.trim() : ''
          if (childName && !family.children.includes(childName)) {
            family.children.push(childName)
          }

          // Track line items
          family.lineItems.push({
            id: payment.id,
            feeType: payment.fee_type || 'Other',
            amount: parseFloat(payment.amount) || 0,
            paid: payment.paid,
            method: payment.payment_method,
            dueDate: payment.due_date,
            paidAt: payment.paid_at,
          })

          // Aggregate totals
          if (payment.paid) {
            family.totalPaid += (parseFloat(payment.amount) || 0)
            if (payment.paid_at) {
              const paidDate = new Date(payment.paid_at)
              if (!family.lastPaymentDate || paidDate > new Date(family.lastPaymentDate)) {
                family.lastPaymentDate = payment.paid_at
              }
            }
          } else {
            family.totalDue += (parseFloat(payment.amount) || 0)
            if (payment.due_date) {
              const dueDate = new Date(payment.due_date)
              if (!family.earliestDueDate || dueDate < new Date(family.earliestDueDate)) {
                family.earliestDueDate = payment.due_date
              }
            }
          }

          // Check for manual payments needing approval
          if (payment.payment_method === 'manual' && !payment.paid) {
            family.needsApproval = true
          }
        }

        // Filter and sort families
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000)
        const families = Object.values(familyMap)
          .filter(family => {
            if (family.totalDue > 0) return true
            if (family.needsApproval) return true
            // Keep recently-paid Stripe for 24h
            const recentStripe = family.lineItems.some(item =>
              item.method === 'stripe' && item.paidAt && new Date(item.paidAt) > twentyFourHoursAgo
            )
            if (recentStripe) return true
            return false
          })
          .sort((a, b) => {
            const aOverdue = a.earliestDueDate && new Date(a.earliestDueDate) < now
            const bOverdue = b.earliestDueDate && new Date(b.earliestDueDate) < now
            if (aOverdue && !bOverdue) return -1
            if (!aOverdue && bOverdue) return 1
            if (a.needsApproval && !b.needsApproval) return -1
            if (!a.needsApproval && b.needsApproval) return 1
            return (b.totalDue || 0) - (a.totalDue || 0)
          })

        setPaymentFamilies(families)
      } catch (err) {
        console.warn('Payment family rollup failed:', err)
        setPaymentFamilies([])
      }

      // ── Engagement column queries ──
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString()

      // E1. Admin badges
      try {
        const { data: badgeData } = await supabase
          .from('player_achievements')
          .select('id, earned_at, achievement:achievement_id(id, name, icon, icon_url, badge_image_url, rarity)')
          .eq('player_id', user?.id)
          .order('earned_at', { ascending: false })
          .limit(10)
        setAdminBadges((badgeData || []).map(b => ({ name: b.achievement?.name || 'Badge', icon: b.achievement?.icon || '🏅', badge_image_url: b.achievement?.badge_image_url, rarity: b.achievement?.rarity })))
      } catch { setAdminBadges([]) }

      // E2. Total active achievements
      try {
        const { count: totalAch } = await supabase
          .from('achievements')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        setTotalAchievements(totalAch || 0)
      } catch { setTotalAchievements(0) }

      // E3. Blasts sent this week
      try {
        const { count: blastCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user?.id)
          .gte('created_at', weekAgoStr)
        setWeeklyBlasts(blastCount || 0)
      } catch { setWeeklyBlasts(0) }

      // E4. Registrations this week
      try {
        const { count: regCount } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('created_at', weekAgoStr)
        setWeeklyRegs(regCount || 0)
      } catch { setWeeklyRegs(0) }

      // E5. Revenue collected this week
      try {
        const { data: weekPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('organization_id', orgId)
          .eq('paid', true)
          .gte('paid_date', weekAgo.toISOString().split('T')[0])
        const total = (weekPayments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
        setWeeklyRevenue(Math.round(total))
      } catch { setWeeklyRevenue(0) }

      // E6. Org-wide player pulse (active/drifting/inactive based on XP activity)
      try {
        const allTeamIds2 = teams?.map(t => t.id) || []
        if (allTeamIds2.length > 0) {
          const { data: allPlayers } = await supabase
            .from('team_players')
            .select('player_id')
            .in('team_id', allTeamIds2)
          const playerIds = [...new Set((allPlayers || []).map(p => p.player_id))]
          if (playerIds.length > 0) {
            const { data: xpActivity } = await supabase
              .from('xp_ledger')
              .select('player_id, created_at')
              .in('player_id', playerIds)
              .order('created_at', { ascending: false })
            const now = new Date()
            const latestByPlayer = {}
            for (const entry of (xpActivity || [])) {
              if (!latestByPlayer[entry.player_id]) latestByPlayer[entry.player_id] = entry.created_at
            }
            let active = 0, drifting = 0, inactive = 0
            for (const pid of playerIds) {
              const last = latestByPlayer[pid]
              if (!last) { inactive++; continue }
              const days = Math.floor((now - new Date(last)) / (1000 * 60 * 60 * 24))
              if (days <= 7) active++
              else if (days <= 21) drifting++
              else inactive++
            }
            setAdminPulseData({ active, drifting, inactive })
          } else { setAdminPulseData({ active: 0, drifting: 0, inactive: 0 }) }
        } else { setAdminPulseData({ active: 0, drifting: 0, inactive: 0 }) }
      } catch { setAdminPulseData({ active: 0, drifting: 0, inactive: 0 }) }

      // E7. Next badge hint
      try {
        const { data: progressData } = await supabase
          .from('player_achievement_progress')
          .select('achievement_id, current_value, target_value, achievements(id, name, stat_key, threshold)')
          .eq('player_id', user?.id)
        if (progressData && progressData.length > 0) {
          let best = null
          for (const p of progressData) {
            if (!p.target_value || p.target_value <= 0) continue
            const ratio = (p.current_value || 0) / p.target_value
            if (ratio >= 1) continue
            if (!best || ratio > best.ratio) {
              best = { ratio, remaining: Math.ceil(p.target_value - (p.current_value || 0)), action: p.achievements?.stat_key || 'actions', badgeName: p.achievements?.name || 'next badge' }
            }
          }
          setNextBadgeProgress(best)
        } else { setNextBadgeProgress(null) }
      } catch { setNextBadgeProgress(null) }

    } catch (err) {
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
    setInitialLoadComplete(true)
  }

  // Calculate season week
  const getSeasonWeek = () => {
    if (!selectedSeason?.start_date) return null
    const start = new Date(selectedSeason.start_date)
    const now = new Date()
    const diffMs = now - start
    const weekNum = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)))
    if (selectedSeason.end_date) {
      const end = new Date(selectedSeason.end_date)
      const totalWeeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000))
      return { current: Math.min(weekNum, totalWeeks), total: totalWeeks }
    }
    return { current: weekNum, total: null }
  }
  const seasonWeek = getSeasonWeek()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const orgInitials = (orgName || organization?.name || '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  // ── Pre-compute derived data for widgets ──
  const totalPlayers = stats.totalRegistrations || 0
  const totalTeams = stats.teams || 0
  const regPct = totalPlayers > 0 ? Math.min(100, Math.round(((totalPlayers - (stats.pending || 0)) / totalPlayers) * 100)) : 100
  const paymentPct = (stats.totalExpected || 0) > 0 ? Math.min(100, Math.round(((stats.totalCollected || 0) / stats.totalExpected) * 100)) : 100
  const waiverTotal = (stats.unsignedWaivers || 0) + totalPlayers
  const waiverPct = waiverTotal > 0 ? Math.round(((waiverTotal - (stats.unsignedWaivers || 0)) / waiverTotal) * 100) : 100
  const rosterPct = totalPlayers > 0 ? Math.min(100, Math.round(((stats.rosteredPlayers || 0) / totalPlayers) * 100)) : 100
  const teamsWithSchedule = upcomingEvents.length > 0 ? Math.min(totalTeams, new Set(upcomingEvents.map(e => e.team_id).filter(Boolean)).size) : 0
  const schedulePct = totalTeams > 0 ? Math.min(100, Math.round((teamsWithSchedule / totalTeams) * 100)) : 100
  const coachPct = totalTeams > 0 ? Math.round(((stats.teamsWithCoach || 0) / totalTeams) * 100) : 100
  const healthScore = Math.round(regPct * 0.15 + paymentPct * 0.20 + waiverPct * 0.15 + rosterPct * 0.10 + schedulePct * 0.10 + 100 * 0.10 + 100 * 0.05 + coachPct * 0.05 + 100 * 0.10)
  const nowDate = new Date()
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0)
  const eventsThisMonth = upcomingEvents.filter(e => { const d = new Date(e.event_date); return d >= monthStart && d <= monthEnd }).length
  const overdueCount = stats.unpaidCount || 0
  const unrosteredCount = Math.max(0, totalPlayers - (stats.rosteredPlayers || 0))
  const teamsNoSchedule = Math.max(0, totalTeams - teamsWithSchedule)

  // (Old adminWidgets grid array removed — v2 uses fixed layout)

  if (!seasonLoading && !selectedSeason) {
    return <GettingStartedGuide onNavigate={onNavigate} />
  }

  if ((seasonLoading || loading) && !initialLoadComplete) {
    return <SkeletonDashboard />
  }

  // ── Engagement column computed values ──
  const adminXp = profile?.total_xp || 0
  const adminLevelInfo = getLevelFromXP(adminXp)
  const adminTier = getLevelTier(adminLevelInfo.level)

  const adminActivities = [
    { icon: '📢', label: 'Blasts sent', count: weeklyBlasts, bg: '#FAEEDA', color: '#B45309' },
    { icon: '📋', label: 'Registrations', count: weeklyRegs, bg: '#EEEDFE', color: '#7C3AED' },
    { icon: '💰', label: 'Revenue', count: `$${weeklyRevenue.toLocaleString()}`, bg: '#E6F1FB', color: '#2563EB' },
    { icon: '👥', label: 'Teams managed', count: stats.teams || 0, bg: '#E1F5EE', color: '#059669' },
  ]

  const adminNextBadgeHint = nextBadgeProgress
    ? `${nextBadgeProgress.remaining} more ${nextBadgeProgress.action} for ${nextBadgeProgress.badgeName}`
    : null

  // Build stepper steps from setup tracker logic (7 steps with org setup priority)
  const setupSteps = [
    { label: 'Org Profile', page: 'organization', status: orgSetupComplete ? 'done' : 'upcoming' },
    { label: 'Payment Setup', page: 'payment-setup', status: paymentSetupComplete ? 'done' : 'upcoming' },
    { label: 'Create Season', page: 'seasons', status: selectedSeason ? 'done' : 'upcoming' },
    { label: 'Add Teams', page: 'teams', status: (stats.teams || 0) > 0 ? 'done' : 'upcoming' },
    { label: 'Add Coaches', page: 'coaches', status: (stats.coachCount || 0) > 0 ? 'done' : 'upcoming' },
    { label: 'Create Schedule', page: 'schedule', status: upcomingEvents.length > 0 ? 'done' : 'upcoming' },
    { label: 'Open Registration', page: 'registration-templates', status: (stats.totalRegistrations || 0) > 0 ? 'done' : 'upcoming' },
  ]
  // Mark the first non-done step as current
  const firstNonDone = setupSteps.findIndex(s => s.status !== 'done')
  if (firstNonDone >= 0 && setupSteps[firstNonDone].status === 'upcoming') setupSteps[firstNonDone].status = 'current'
  const setupComplete = setupSteps.filter(s => s.status === 'done').length

  // Compute categorized items for attention strip
  const isAll = isAllSeasons(selectedSeason)
  const attentionItems = []
  if (isAll) {
    // In "All Seasons" mode, use aggregated perSeasonActionDetails
    const allDetails = Object.values(perSeasonActionDetails || {}).flat()
    const grouped = {}
    allDetails.forEach(d => {
      grouped[d.label] = (grouped[d.label] || 0) + d.count
    })
    if (grouped['Pending Registrations'] > 0) {
      attentionItems.push({ category: 'Pending Registrations', count: grouped['Pending Registrations'], icon: '\uD83D\uDCCB', onClick: () => onNavigate?.('registrations') })
    }
    if (grouped['Overdue Payments'] > 0) {
      attentionItems.push({ category: 'Overdue Payments', count: grouped['Overdue Payments'], icon: '\uD83D\uDCB0', onClick: () => onNavigate?.('payments') })
    }
  } else {
    if (overdueCount > 0) {
      attentionItems.push({ category: 'Overdue Payments', count: overdueCount, icon: '\uD83D\uDCB0', onClick: () => onNavigate?.('payments') })
    }
    if ((stats.pending || 0) > 0) {
      attentionItems.push({ category: 'Pending Registrations', count: stats.pending, icon: '\uD83D\uDCCB', onClick: () => onNavigate?.('registrations') })
    }
    if ((stats.unsignedWaivers || 0) > 0) {
      attentionItems.push({ category: 'Unsigned Waivers', count: stats.unsignedWaivers, icon: '\uD83D\uDCDD', onClick: () => onNavigate?.('waivers') })
    }
    if (unrosteredCount > 0) {
      attentionItems.push({ category: 'Unrostered Players', count: unrosteredCount, icon: '\uD83D\uDC65', onClick: () => onNavigate?.('teams') })
    }
    if (teamsNoSchedule > 0) {
      attentionItems.push({ category: 'Teams Without Schedule', count: teamsNoSchedule, icon: '\uD83D\uDCC5', onClick: () => onNavigate?.('schedule') })
    }
  }
  const actionCount = isAll
    ? Object.values(perSeasonActionCounts || {}).reduce((sum, n) => sum + n, 0)
    : attentionItems.reduce((sum, item) => sum + item.count, 0)

  // Dynamic contextual messages — rotates per session (Tweak 1)
  const globalTotalTeams = Object.values(perSeasonTeamCounts || {}).reduce((s, c) => s + c, 0)
  const globalTotalPlayers = Object.values(perSeasonPlayerCounts || {}).reduce((s, c) => s + c, 0)
  const contextMessages = (() => {
    const msgs = []
    if (globalStats.actionCount > 0) {
      msgs.push(`${globalStats.actionCount} item${globalStats.actionCount !== 1 ? 's' : ''} need your attention.`)
      msgs.push(`You've got ${globalStats.actionCount} to knock out.`)
    }
    if (globalStats.actionCount === 0) {
      msgs.push("Everything's looking good.")
      msgs.push("All systems running smooth.")
      msgs.push("Your club is humming.")
    }
    if (upcomingEvents.length > 0) {
      msgs.push(`${upcomingEvents.length} event${upcomingEvents.length !== 1 ? 's' : ''} coming up.`)
    }
    if (globalTotalPlayers > 0 && globalTotalTeams > 0) {
      msgs.push(`${globalTotalPlayers} players across ${globalTotalTeams} team${globalTotalTeams !== 1 ? 's' : ''}.`)
    }
    return msgs.length > 0 ? msgs : ["Let's see how things are going."]
  })()
  const ctxMsg = contextMessages[Math.floor(msgSeed * contextMessages.length)] || "Let's see how things are going."

  return (
    <>
      {/* ─── Empty state for brand new orgs ──── */}
      {totalTeams === 0 && !selectedSeason && (
        <div style={{ padding: '64px 32px', textAlign: 'center', fontFamily: 'var(--v2-font)' }}>
          <img src="/images/laptoplynx.png" alt="Lynx" style={{ width: 128, height: 128, margin: '0 auto 24px', opacity: 0.8 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--v2-text-primary)', marginBottom: 8 }}>Your dashboard is waiting!</h3>
          <p style={{ color: 'var(--v2-text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
            Start by setting up your season, creating teams, and opening registration. Your dashboard will come alive as data flows in.
          </p>
          <button
            onClick={() => onNavigate?.('seasons')}
            style={{
              background: 'var(--v2-sky)', color: '#FFFFFF',
              fontWeight: 700, padding: '12px 24px', borderRadius: 12,
              border: 'none', cursor: 'pointer', fontSize: 14,
            }}
          >
            Set Up Your First Season
          </button>
        </div>
      )}

      {/* ─── V2 Dashboard Layout ──── */}
      {(totalTeams > 0 || selectedSeason) && (
        <V2DashboardLayout
          mainContent={
            <>
              {/* HERO CARD — org-wide stats */}
              <HeroCard
                orgLine={orgName || organization?.name || 'Your Organization'}
                greeting={
                  !foundationReady
                    ? `Welcome to Lynx, ${profile?.first_name || 'Admin'}! Let's set up your club.`
                    : (allSeasons || seasons || []).length === 0
                      ? `Great start, ${profile?.first_name || 'Admin'}. Now let's create your first season.`
                      : `${getGreeting()}, ${profile?.first_name || 'Admin'}. ${ctxMsg}`
                }
                subLine={`${(allSeasons || seasons || []).filter(s => s.status === 'active' || s.status === 'open').length || 1} active season${((allSeasons || seasons || []).filter(s => s.status === 'active' || s.status === 'open').length || 1) !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
                stats={[
                  { value: globalTotalTeams || stats.teams || 0, label: 'Teams', onClick: () => onNavigate?.('teams') },
                  { value: globalTotalPlayers || totalPlayers, label: 'Players', onClick: () => onNavigate?.('registrations') },
                  { value: globalStats.coachCount || stats.coachCount || 0, label: 'Coaches', onClick: () => onNavigate?.('coaches') },
                  { value: (allSeasons || seasons || []).length, label: 'Seasons', onClick: () => onNavigate?.('seasons') },
                  { value: globalStats.totalCollected ? `$${(globalStats.totalCollected / 1000).toFixed(1)}k` : '$0', label: 'Collected', color: 'green', onClick: () => onNavigate?.('payments') },
                  { value: globalStats.actionCount || 0, label: 'Action Items', color: globalStats.actionCount > 0 ? 'red' : undefined, onClick: () => setActiveTab('action-items') },
                ]}
              />

              {/* MASCOT NUDGE */}
              {(stats.unsignedWaivers || 0) > 0 && !nudgeDismissed && (
                <MascotNudge
                  message={<>Hey {profile?.first_name || 'there'}! I noticed <strong>{stats.unsignedWaivers} player{stats.unsignedWaivers !== 1 ? 's' : ''}</strong> haven&apos;t turned in their forms. Want me to ping their parents?</>}
                  primaryAction={{ label: 'Yes, send reminders', onClick: () => onNavigate?.('waivers') }}
                  secondaryAction={{ label: 'Not now', onClick: () => setNudgeDismissed(true) }}
                />
              )}

              {/* ATTENTION STRIP */}
              {actionCount > 0 && (
                <AttentionStrip
                  message={`${actionCount} item${actionCount !== 1 ? 's' : ''} need${actionCount === 1 ? 's' : ''} action`}
                  ctaLabel={attentionExpanded ? 'COLLAPSE' : 'REVIEW NOW →'}
                  onClick={() => { setAttentionExpanded(!attentionExpanded); setActiveTab('action-items') }}
                  isExpanded={attentionExpanded}
                  expandedContent={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {attentionItems.map((item, i) => (
                        <div
                          key={i}
                          onClick={(e) => { e.stopPropagation(); item.onClick() }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.6)', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                            <span>{item.icon}</span> {item.category}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-red)' }}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  }
                />
              )}

              {/* SEASON CAROUSEL */}
              <SeasonCarousel
                seasons={allSeasons || seasons || []}
                perSeasonTeamCounts={perSeasonTeamCounts}
                perSeasonPlayerCounts={perSeasonPlayerCounts}
                perSeasonActionCounts={perSeasonActionCounts}
                perSeasonActionDetails={perSeasonActionDetails}
                selectedSeasonId={isAll ? null : selectedSeason?.id}
                onSeasonSelect={(id) => {
                  const season = (allSeasons || seasons || []).find(s => s.id === id)
                  if (season) selectSeason(season)
                }}
                onViewAll={() => onNavigate?.('season-management')}
              />

              {/* SEASON STEPPER — hidden in "All Seasons" mode */}
              {!isAll && setupComplete < 7 && (
                <SeasonStepper
                  seasonName={selectedSeason?.name || ''}
                  steps={setupSteps}
                  completedCount={setupComplete}
                  totalCount={7}
                  onNavigate={onNavigate}
                />
              )}

              {/* INNER FLEX: Tabs + Engagement Column side by side */}
              <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
              <BodyTabs
                tabs={[
                  { id: 'action-items', label: 'Action Items', badge: actionCount || 0 },
                  { id: 'teams', label: 'Teams & Health' },
                  { id: 'registrations', label: 'Registrations', badge: stats.pending || 0 },
                  { id: 'payments', label: 'Payments' },
                  { id: 'schedules', label: 'Schedules' },
                ]}
                activeTabId={activeTab}
                onTabChange={setActiveTab}
                footerLink={activeTab === 'teams' ? { label: `View all ${teamsData?.length || 0} teams →`, onClick: () => onNavigate?.('teams') } : undefined}
              >
                {activeTab === 'action-items' && (
                  <div style={{ padding: 24, fontFamily: 'var(--v2-font)' }}>
                    {attentionItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--v2-text-primary)', marginBottom: 4 }}>All clear!</div>
                        <div style={{ fontSize: 13, color: 'var(--v2-text-muted)' }}>No items need your attention right now.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {attentionItems.map((item, idx) => {
                          const severity = item.category.includes('Overdue') ? 'critical'
                            : item.category.includes('Pending') ? 'warning' : 'info'
                          const detail = item.category.includes('Overdue') ? `$${(stats.pastDue || 0).toLocaleString()} outstanding`
                            : item.category.includes('Pending') ? 'Review and approve or deny'
                            : item.category.includes('Waiver') ? 'Send reminders to parents'
                            : item.category.includes('Unrostered') ? 'Assign players to teams'
                            : item.category.includes('Schedule') ? 'Create events for these teams'
                            : ''
                          return (
                            <button
                              key={idx}
                              onClick={item.onClick}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                transition: 'background 0.15s ease', fontFamily: 'var(--v2-font)',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--v2-surface)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{
                                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                background: severity === 'critical' ? '#EF4444'
                                  : severity === 'warning' ? '#F59E0B' : '#3B82F6',
                              }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                                  {item.icon} {item.count} {item.category.toLowerCase()}
                                </div>
                                {detail && (
                                  <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 2 }}>
                                    {detail}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: 16, color: 'var(--v2-text-muted)', flexShrink: 0 }}>›</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'teams' && (
                  (teamsData || []).length === 0
                    ? <div style={{ padding: 24 }}><EmptyStateCTA emoji="👥" title="Add Your First Team" description="Create teams and start building your rosters" buttonLabel="+ Create Team" onClick={() => onNavigate?.('teams')} isDark={isDark} /></div>
                    : <AdminTeamsTab teamsData={teamsData} teamStats={teamStats} onTeamClick={(teamId) => onNavigate?.('teamwall', { teamId })} onViewAll={() => onNavigate?.('teams')} />
                )}
                {activeTab === 'registrations' && (
                  (stats.totalRegistrations || 0) === 0
                    ? <div style={{ padding: 24 }}><EmptyStateCTA emoji="📋" title="Open Registration" description="Create a season first, then open registration for families" buttonLabel="Set Up Registration" onClick={() => onNavigate?.('registration-templates')} isDark={isDark} /></div>
                    : <AdminRegistrationsTab stats={stats} registrationPlayers={registrationPlayers} onNavigate={onNavigate} />
                )}
                {activeTab === 'payments' && (
                  (stats.totalExpected || 0) === 0
                    ? <div style={{ padding: 24 }}><EmptyStateCTA emoji="💳" title="Set Up Payments" description="Configure Stripe or manual payment methods" buttonLabel="Configure Payments" onClick={() => onNavigate?.('payment-setup')} isDark={isDark} /></div>
                    : <AdminPaymentsTab stats={stats} monthlyPayments={monthlyPayments} paymentFamilies={paymentFamilies} onNavigate={onNavigate} />
                )}
                {activeTab === 'schedules' && (
                  (upcomingEvents || []).length === 0
                    ? <div className="p-8 text-center">
                        <div className="text-3xl mb-3">{'\uD83D\uDCC5'}</div>
                        <h3 className="font-extrabold text-lg mb-1" style={{ color: 'var(--v2-text-primary)' }}>No Upcoming Events</h3>
                        <p className="text-sm text-slate-400 mb-4">Add practices, games, and events to your schedule</p>
                        <button onClick={() => onNavigate?.('schedule')}
                          className="px-6 py-2.5 bg-lynx-navy-subtle text-white font-bold rounded-xl hover:brightness-110 transition">
                          Go to Schedule {'\u2192'}
                        </button>
                      </div>
                    : <AdminScheduleTab events={upcomingEvents} onNavigate={onNavigate} />
                )}
              </BodyTabs>
              </div>

              {/* ENGAGEMENT COLUMN — 280px fixed, real data */}
              <div
                className="admin-engagement-column"
                style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <EngagementLevelCard
                  levelInfo={adminLevelInfo}
                  tierName={adminTier.name}
                  xp={adminXp}
                  onNavigateAchievements={() => onNavigate?.('achievements')}
                />
                <EngagementActivityCard
                  activities={adminActivities}
                  nextBadgeHint={adminNextBadgeHint}
                />
                <EngagementBadgesCard
                  earnedCount={adminBadges.length}
                  totalCount={totalAchievements}
                  badges={adminBadges}
                  onNavigateAchievements={() => onNavigate?.('achievements')}
                />
                <EngagementTeamPulseCard
                  active={adminPulseData.active}
                  drifting={adminPulseData.drifting}
                  inactive={adminPulseData.inactive}
                  title="Org Pulse"
                />
              </div>
              </div>

              {/* Responsive: hide engagement column on narrow screens */}
              <style>{`
                @media (max-width: 1200px) {
                  .admin-engagement-column { display: none !important; }
                }
              `}</style>
            </>
          }

          sideContent={
            <>
              {/* FINANCIAL SNAPSHOT */}
              <FinancialSnapshot
                overline="Financial Snapshot"
                heading="All Seasons"
                headingSub="Organization Revenue"
                projectedRevenue={globalStats.totalExpected || null}
                collectedPct={globalStats.totalExpected ? Math.round((globalStats.totalCollected / globalStats.totalExpected) * 100) : 0}
                receivedAmount={`$${(globalStats.totalCollected || 0).toLocaleString()}`}
                receivedLabel="Received"
                outstandingAmount={`$${(globalStats.pastDue || 0).toLocaleString()}`}
                outstandingLabel="Outstanding"
                breakdown={globalStats.paymentsByType ? (() => {
                  const byType = globalStats.paymentsByType
                  const calcType = (arr) => {
                    const total = (arr || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
                    const collected = (arr || []).filter(p => p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
                    return { collected, total }
                  }
                  const reg = calcType(byType.registration)
                  const uni = calcType(byType.uniform)
                  const mo = calcType(byType.monthly)
                  const oth = calcType(byType.other)
                  return [
                    { label: 'Registration', collected: reg.collected, total: reg.total, color: 'var(--v2-green)' },
                    { label: 'Uniforms', collected: uni.collected, total: uni.total, color: 'var(--v2-sky)' },
                    { label: 'Monthly Dues', collected: mo.collected, total: mo.total, color: 'var(--v2-purple)' },
                    { label: 'Other', collected: oth.collected, total: oth.total, color: 'var(--v2-amber)' },
                  ]
                })() : null}
                primaryAction={{ label: 'Send Reminders', onClick: () => onNavigate?.('payments'), variant: 'danger' }}
                secondaryAction={{ label: 'View Ledger', onClick: () => onNavigate?.('payments') }}
              />

              {/* WEEKLY LOAD */}
              {(upcomingEvents || []).length === 0 ? (
                <div className={`rounded-[14px] p-5 text-center ${isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`} style={{ boxShadow: 'var(--v2-card-shadow)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Weekly Load</div>
                  <div className="text-2xl mb-2">{'\uD83D\uDCC5'}</div>
                  <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>No Events This Week</p>
                  <p className="text-xs text-slate-400 mb-3">Create practices and games for your teams</p>
                  <button onClick={() => onNavigate?.('schedule')}
                    className="w-full py-2 bg-lynx-navy-subtle text-white font-bold rounded-lg text-xs hover:brightness-110 transition">
                    + Create Event
                  </button>
                </div>
              ) : (
                <WeeklyLoad
                  title="Weekly Load"
                  dateRange="This Week"
                  events={(upcomingEvents || []).slice(0, 5).map(evt => ({
                    dayName: new Date(evt.event_date).toLocaleDateString('en-US', { weekday: 'short' }),
                    dayNum: new Date(evt.event_date).getDate(),
                    isToday: new Date(evt.event_date).toDateString() === new Date().toDateString(),
                    title: evt.title || evt.event_type || 'Event',
                    meta: `${evt.location || 'TBD'} · ${evt.event_time || evt.start_time || ''}`,
                  }))}
                />
              )}

              {/* ORG HEALTH */}
              <OrgHealthCard
                subtitle={`Season: ${selectedSeason?.name || 'Current'}`}
                metrics={[
                  { label: 'Roster Fill', value: `${stats.rosteredPlayers || 0}/${totalPlayers}`, percentage: rosterPct, color: 'sky' },
                  { label: 'Payments', value: `${paymentPct}%`, percentage: paymentPct, color: 'green' },
                  { label: 'Overdue', value: String(overdueCount), percentage: Math.min(overdueCount * 5, 100), color: 'red', isAlert: overdueCount > 0 },
                  { label: 'Registrations', value: String(stats.pending || 0), percentage: Math.min((stats.pending || 0) * 10, 100), color: 'purple' },
                  { label: 'Teams Active', value: String(stats.teams || 0), percentage: Math.min((stats.teams || 0) * 10, 100), color: 'amber' },
                ]}
              />

              {/* THE PLAYBOOK */}
              <ThePlaybook
                actions={[
                  { emoji: '📅', label: 'Create Event', onClick: () => onNavigate?.('schedule'), isPrimary: true },
                  { emoji: '📢', label: 'Send Blast', onClick: () => onNavigate?.('blasts') },
                  { emoji: '👤', label: 'Add Player', onClick: () => onNavigate?.('registrations') },
                  { emoji: '✅', label: 'Approve Regs', onClick: () => onNavigate?.('registrations') },
                  { emoji: '📊', label: 'Reports', onClick: () => onNavigate?.('reports') },
                  { emoji: '🔗', label: 'Reg Link', onClick: () => onNavigate?.('templates') },
                ]}
              />

              {/* MilestoneCard removed — replaced by engagement column */}
            </>
          }
        />
      )}
    </>
  )
}
