import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { supabase } from '../../lib/supabase'
import { SkeletonDashboard } from '../../components/ui'
import {
  TopBar, HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  WeeklyLoad, OrgHealthCard, ThePlaybook, MilestoneCard, MascotNudge,
  V2DashboardLayout,
} from '../../components/v2'
import SeasonCarousel from '../../components/v2/admin/SeasonCarousel'
import SeasonStepper from '../../components/v2/admin/SeasonStepper'
import AdminTeamsTab from '../../components/v2/admin/AdminTeamsTab'
import AdminRegistrationsTab from '../../components/v2/admin/AdminRegistrationsTab'
import AdminPaymentsTab from '../../components/v2/admin/AdminPaymentsTab'
import AdminScheduleTab from '../../components/v2/admin/AdminScheduleTab'

// Old inline widgets (DashCard, CardHeader, DonutChart, SeasonCard, etc.) removed in v2 swap

// ============================================
// GETTING STARTED GUIDE (No Season)
// ============================================
export function GettingStartedGuide({ onNavigate }) {
  const { organization } = useAuth()
  const { isDark, accent } = useTheme()

  return (
    <div className="py-12 text-center">
      <div
        className="w-20 h-20 rounded-full mx-auto mb-r-4 flex items-center justify-center"
        style={{ backgroundColor: accent.primary + '20' }}
      >
        <span className="text-r-4xl">🎉</span>
      </div>
      <h1 className={`text-r-4xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-800"}`}>
        Welcome to {organization?.name || 'Lynx'}!
      </h1>
      <p className={`mb-8 ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>
        Let's get your organization set up. Start by creating your first season.
      </p>
      <button
        onClick={() => onNavigate('seasons')}
        className="px-6 py-3 text-white font-semibold rounded-2xl transition hover:brightness-110"
        style={{ backgroundColor: accent.primary }}
      >
        Create Your First Season
      </button>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function DashboardPage({ onNavigate, activeView, availableViews = [], onSwitchRole }) {
  const { organization, profile } = useAuth()
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
          .from('waivers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true)

        const { count: signedCount } = await supabase
          .from('waiver_signatures')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)

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

  // Build stepper steps from setup tracker logic
  const setupSteps = [
    { label: 'Org Profile', page: 'organization', status: organization?.name ? 'done' : 'upcoming' },
    { label: 'Season', page: 'seasons', status: selectedSeason ? 'done' : 'upcoming' },
    { label: 'Open Reg', page: 'registrations', status: (selectedSeason?.status === 'open' || (stats.totalRegistrations || 0) > 0) ? 'done' : (selectedSeason ? 'current' : 'upcoming') },
    { label: 'Teams', page: 'teams', status: (stats.teams || 0) > 0 ? 'done' : (selectedSeason ? 'current' : 'upcoming') },
    { label: 'Coaches', page: 'coaches', status: (stats.coachCount || 0) > 0 ? 'done' : 'upcoming' },
    { label: 'Schedule', page: 'schedule', status: upcomingEvents.length > 0 ? 'done' : 'upcoming' },
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
      {/* ─── TopBar ──── */}
      <TopBar
        roleLabel="Lynx Admin"
        navLinks={[
          { label: 'Dashboard', pageId: 'dashboard', isActive: true, onClick: () => onNavigate?.('dashboard') },
          { label: 'Schedule', pageId: 'schedule', onClick: () => onNavigate?.('schedule') },
          { label: 'Registrations', pageId: 'registrations', onClick: () => onNavigate?.('registrations') },
          { label: 'Payments', pageId: 'payments', onClick: () => onNavigate?.('payments') },
        ]}
        searchPlaceholder="Search roster, teams..."
        onSearchClick={() => document.dispatchEvent(new CustomEvent('command-palette-open'))}
        hasNotifications={actionCount > 0}
        notificationCount={actionCount}
        onNotificationClick={() => onNavigate?.('notifications')}
        avatarInitials={`${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`}
        onSettingsClick={() => onNavigate?.('organization')}
        onThemeToggle={toggleTheme}
        isDark={isDark}
        availableRoles={availableViews.map(v => ({ id: v.id, label: `Lynx ${v.label}`, subtitle: v.description }))}
        activeRoleId={activeView}
        onRoleSwitch={onSwitchRole}
      />

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
                greeting={`${getGreeting()}, ${profile?.first_name || 'Admin'}. ${ctxMsg}`}
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
              {!isAll && setupComplete < 6 && (
                <SeasonStepper
                  seasonName={selectedSeason?.name || ''}
                  steps={setupSteps}
                  completedCount={setupComplete}
                  totalCount={6}
                  onNavigate={onNavigate}
                />
              )}

              {/* BODY TABS */}
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
                  <AdminTeamsTab teamsData={teamsData} teamStats={teamStats} onTeamClick={(teamId) => onNavigate?.('teamwall', { teamId })} onViewAll={() => onNavigate?.('teams')} />
                )}
                {activeTab === 'registrations' && (
                  <AdminRegistrationsTab stats={stats} registrationPlayers={registrationPlayers} onNavigate={onNavigate} />
                )}
                {activeTab === 'payments' && (
                  <AdminPaymentsTab stats={stats} monthlyPayments={monthlyPayments} paymentFamilies={paymentFamilies} onNavigate={onNavigate} />
                )}
                {activeTab === 'schedules' && (
                  <AdminScheduleTab events={upcomingEvents} onNavigate={onNavigate} />
                )}
              </BodyTabs>

              {/* MASCOT NUDGE */}
              {(stats.unsignedWaivers || 0) > 0 && !nudgeDismissed && (
                <MascotNudge
                  message={<>Hey {profile?.first_name || 'there'}! I noticed <strong>{stats.unsignedWaivers} player{stats.unsignedWaivers !== 1 ? 's' : ''}</strong> haven&apos;t turned in their forms. Want me to ping their parents?</>}
                  primaryAction={{ label: 'Yes, send reminders', onClick: () => onNavigate?.('waivers') }}
                  secondaryAction={{ label: 'Not now', onClick: () => setNudgeDismissed(true) }}
                />
              )}
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

              {/* MILESTONE — placeholder data (TODO: wire to admin gamification) */}
              <MilestoneCard
                trophy="🏆"
                title={`Season Admin · ${selectedSeason?.name || ''}`}
                subtitle={`Health Score: ${healthScore}%`}
                xpCurrent={healthScore * 50}
                xpTarget={5200}
                variant="gold"
                onClick={() => onNavigate?.('achievements')}
              />
            </>
          }
        />
      )}
    </>
  )
}
