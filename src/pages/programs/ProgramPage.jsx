import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProgram } from '../../contexts/ProgramContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { parseLocalDate } from '../../lib/date-helpers'
import {
  HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  V2DashboardLayout,
} from '../../components/v2'
import SeasonCarousel from '../../components/v2/admin/SeasonCarousel'
import LifecycleTracker from '../../components/v2/admin/LifecycleTracker'
import AdminTeamsTab from '../../components/v2/admin/AdminTeamsTab'
import { EmptyState } from '../../components/ui/EmptyState'
import { SeasonFormModal } from '../settings/SeasonFormModal'
import NewTeamModal from '../teams/NewTeamModal'
import RegLinkModal from '../../components/ui/RegLinkModal'
import {
  Calendar, CalendarPlus, Users, Megaphone, BarChart3,
  ClipboardList, AlertTriangle, RefreshCw, ArrowLeft, Layers, Link2,
} from 'lucide-react'

// ============================================================================
// ProgramPage — Sport/Program Home at /programs/:programId
// ============================================================================
// The "department dashboard" — everything about one program.
// Fetches all data, passes computed props to existing V2 widgets.
// ============================================================================

// ---------- Dynamic Greeting ----------
function getProgramGreeting(program, stats) {
  const { pendingRegs, overduePayments, activeSeasons, totalPlayers, upcomingEvents } = stats

  if (overduePayments > 5)
    return `${overduePayments} families have overdue payments`
  if (pendingRegs > 0)
    return `${pendingRegs} registration${pendingRegs > 1 ? 's' : ''} waiting for approval`
  if (upcomingEvents > 0 && upcomingEvents <= 3)
    return `${upcomingEvents} event${upcomingEvents > 1 ? 's' : ''} coming up this week`
  if (totalPlayers > 0 && activeSeasons > 0)
    return `${totalPlayers} athletes across ${activeSeasons} active season${activeSeasons > 1 ? 's' : ''}`
  if (totalPlayers === 0)
    return "Let's build your roster"
  return `Your ${program.name} program at a glance`
}

// ---------- Loading Skeleton ----------
function ProgramPageSkeleton() {
  const { isDark } = useTheme()
  const shimmer = isDark ? 'bg-white/[0.04]' : 'bg-slate-200/60'
  const anim = 'animate-pulse'
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
      <div className={`h-40 rounded-2xl ${shimmer} ${anim}`} />
      <div className={`h-14 rounded-xl ${shimmer} ${anim}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className={`h-40 rounded-2xl ${shimmer} ${anim}`} />
          <div className={`h-64 rounded-2xl ${shimmer} ${anim}`} />
        </div>
        <div className="space-y-6">
          <div className={`h-56 rounded-2xl ${shimmer} ${anim}`} />
          <div className={`h-48 rounded-2xl ${shimmer} ${anim}`} />
        </div>
      </div>
    </div>
  )
}

// ---------- Error State ----------
function ProgramError({ message, onRetry, onBack }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-20 text-center">
      <div className={`mx-auto mb-4 w-20 h-20 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <h2 className={`text-xl font-bold mb-2 ${tc.text}`} style={{ fontFamily: 'var(--v2-font)' }}>
        {message || 'Something went wrong'}
      </h2>
      <p className={`text-sm ${tc.textMuted} mb-6`}>
        We couldn't load this program's data. Please try again.
      </p>
      <div className="flex gap-3 justify-center">
        {onBack && (
          <button onClick={onBack} className={`px-5 py-2.5 rounded-xl border font-bold text-sm ${isDark ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <ArrowLeft className="w-4 h-4 inline mr-1.5" /> Back to Dashboard
          </button>
        )}
        {onRetry && (
          <button onClick={onRetry} className="px-5 py-2.5 rounded-xl bg-[#10284C] text-white font-bold text-sm hover:brightness-110">
            <RefreshCw className="w-4 h-4 inline mr-1.5" /> Retry
          </button>
        )}
      </div>
    </div>
  )
}

// ---------- Program Empty State (no seasons) ----------
function ProgramEmptyState({ program, onCreateSeason }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const icon = program.icon || program.sport?.icon || '📋'
  const sportName = program.sport?.name

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className={`rounded-2xl border-2 border-dashed p-10 text-center ${isDark ? 'border-[#4BB9EC]/20 bg-[#132240]/40' : 'border-[#4BB9EC]/30 bg-[#4BB9EC]/[0.02]'}`}>
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className={`text-xl font-extrabold mb-2 ${tc.text}`} style={{ fontFamily: 'var(--v2-font)' }}>
          No seasons yet
        </h2>
        <p className={`text-sm ${tc.textMuted} mb-6 max-w-md mx-auto`}>
          Create your first {sportName ? sportName.toLowerCase() + ' ' : ''}season to start managing teams, registrations, and schedules.
        </p>
        <button
          onClick={onCreateSeason}
          className="px-6 py-3 rounded-xl bg-[#10284C] text-white font-bold text-sm hover:brightness-110 transition inline-flex items-center gap-2"
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          <CalendarPlus className="w-4 h-4" /> Create First Season
        </button>

        <div className={`mt-8 text-left max-w-sm mx-auto space-y-3 ${tc.textMuted}`}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-60">What happens next</p>
          {[
            'Create a season (Spring 2026, Summer Camp...)',
            'Open registration for families',
            'Build your teams and assign coaches',
            'Set up your schedule',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isDark ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : 'bg-[#10284C]/10 text-[#10284C]'}`}>
                {i + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Main Component
// ============================================================================
export default function ProgramPage({ showToast }) {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { user, organization, isAdmin } = useAuth()
  const { programs, selectedProgram, selectProgram, refreshPrograms } = useProgram()
  const { allSeasons, selectedSeason, selectSeason, refreshSeasons } = useSeason()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // --- State ---
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timedOut, setTimedOut] = useState(false)
  // Default to 'setup' tab when setup is incomplete, else 'teams'
  const [activeTab, setActiveTab] = useState('teams')
  const [setupTabInitialized, setSetupTabInitialized] = useState(false)

  // Data
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [payments, setPayments] = useState([])
  const [events, setEvents] = useState([])
  const [waiverSignatures, setWaiverSignatures] = useState([])

  // Selected season in carousel (null = show all program seasons)
  const [selectedProgramSeason, setSelectedProgramSeason] = useState(null)

  // Modals
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showRegLinkModal, setShowRegLinkModal] = useState(false)
  const [seasonForm, setSeasonForm] = useState({
    name: '', sport_id: null, status: 'draft', start_date: '', end_date: '',
    registration_open: false, capacity: null, description: '',
    fee_registration: 0, fee_uniform: 0, fee_monthly: 0, months_in_season: 1,
    program_id: null,
  })
  const [seasonModalTab, setSeasonModalTab] = useState('basic')

  // Timeout ref
  const timeoutRef = useRef(null)

  // --- Find program from context ---
  const program = programs.find(p => p.id === programId)

  // Select program in context when page loads
  useEffect(() => {
    if (program && selectedProgram?.id !== program.id) {
      selectProgram(program)
    }
  }, [program?.id])

  // --- Data Fetching ---
  const loadProgramData = useCallback(async () => {
    if (!programId || !organization?.id) return

    setLoading(true)
    setError(null)
    setTimedOut(false)

    // 8-second timeout
    timeoutRef.current = setTimeout(() => setTimedOut(true), 8000)

    try {
      // Get season IDs for this program
      const programSeasons = (allSeasons || []).filter(s => s.program_id === programId)
      const programSeasonIds = programSeasons.map(s => s.id)

      if (programSeasonIds.length === 0) {
        setTeams([])
        setPlayers([])
        setRegistrations([])
        setPayments([])
        setEvents([])
        setWaiverSignatures([])
        setLoading(false)
        clearTimeout(timeoutRef.current)
        return
      }

      const [teamsRes, playersRes, regsRes, paymentsRes, eventsRes, waiversRes] = await Promise.all([
        supabase.from('teams')
          .select('*, team_players(count), season:seasons(id, name, sport:sports(id, name, icon))')
          .in('season_id', programSeasonIds)
          .order('name'),

        supabase.from('players')
          .select('id, first_name, last_name, status, season_id, birth_date, grade, jersey_number, position, photo_url')
          .in('season_id', programSeasonIds),

        supabase.from('registrations')
          .select('id, status, season_id, created_at, player_id, players(id, first_name, last_name, birth_date, grade, parent_name, parent_email, parent_phone)')
          .in('season_id', programSeasonIds),

        supabase.from('payments')
          .select('id, amount, paid, status, fee_type, season_id, due_date, created_at, player_id, players(id, first_name, last_name, parent_name, parent_email)')
          .in('season_id', programSeasonIds),

        supabase.from('schedule_events')
          .select('*, teams:team_id(name)')
          .in('season_id', programSeasonIds)
          .gte('event_date', new Date().toISOString().split('T')[0])
          .order('event_date', { ascending: true })
          .limit(20),

        supabase.from('waiver_signatures')
          .select('id, status, season_id')
          .in('season_id', programSeasonIds),
      ])

      const allResults = [
        { name: 'teams', res: teamsRes },
        { name: 'players', res: playersRes },
        { name: 'registrations', res: regsRes },
        { name: 'payments', res: paymentsRes },
        { name: 'events', res: eventsRes },
        { name: 'waivers', res: waiversRes }
      ]
      const errors = allResults.filter(r => r.res.error)
      if (errors.length > 0) {
        errors.forEach(e => console.error(`ProgramPage ${e.name} query error:`, e.res.error))
        throw new Error(`Failed to load program data: ${errors.map(e => e.name).join(', ')}`)
      }

      setTeams(teamsRes.data || [])
      setPlayers(playersRes.data || [])
      setRegistrations(regsRes.data || [])
      setPayments(paymentsRes.data || [])
      setEvents(eventsRes.data || [])
      setWaiverSignatures(waiversRes.data || [])
    } catch (err) {
      console.error('ProgramPage load error:', err)
      setError(err.message || 'Failed to load program data')
    } finally {
      setLoading(false)
      clearTimeout(timeoutRef.current)
    }
  }, [programId, organization?.id, allSeasons])

  useEffect(() => {
    if (program) loadProgramData()
  }, [program?.id, loadProgramData])

  // Cleanup timeout
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // --- Computed Values ---
  const programSeasons = (allSeasons || []).filter(s => s.program_id === programId)
  const activeSeasons = programSeasons.filter(s => s.status === 'active').length
  const totalTeams = teams.length
  const totalPlayers = players.length

  // Registrations
  const pendingRegs = registrations.filter(r => ['pending', 'submitted', 'new'].includes(r.status)).length
  const approvedRegs = registrations.filter(r => r.status === 'approved').length
  const rosteredRegs = registrations.filter(r => r.status === 'rostered').length
  const waitlistedRegs = registrations.filter(r => r.status === 'waitlisted').length
  const deniedRegs = registrations.filter(r => r.status === 'denied').length

  // Payments
  const totalExpected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalCollected = payments.filter(p => p.paid).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalOutstanding = totalExpected - totalCollected
  const collectedPct = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
  const overduePayments = payments.filter(p => !p.paid && p.due_date && new Date(p.due_date) < new Date()).length

  // Waivers
  const totalWaivers = waiverSignatures.length
  const signedWaivers = waiverSignatures.filter(w => w.status === 'signed').length
  // Roster capacity
  const totalRosterSpots = teams.reduce((sum, t) => sum + (t.max_roster_size || t.max_players || 12), 0)

  // Upcoming events this week
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const upcomingThisWeek = events.filter(e => {
    const d = parseLocalDate ? parseLocalDate(e.event_date) : new Date(e.event_date)
    return d >= now && d <= weekEnd
  }).length

  // Action item count
  const unsignedWaivers = totalWaivers - signedWaivers
  const actionItemCount = pendingRegs + overduePayments + unsignedWaivers

  // Per-season counts for carousel
  const perSeasonTeamCounts = {}
  const perSeasonPlayerCounts = {}
  const perSeasonActionCounts = {}
  teams.forEach(t => {
    const sid = t.season_id
    perSeasonTeamCounts[sid] = (perSeasonTeamCounts[sid] || 0) + 1
  })
  players.forEach(p => {
    const sid = p.season_id
    perSeasonPlayerCounts[sid] = (perSeasonPlayerCounts[sid] || 0) + 1
  })
  registrations.filter(r => r.status === 'pending').forEach(r => {
    const sid = r.season_id
    perSeasonActionCounts[sid] = (perSeasonActionCounts[sid] || 0) + 1
  })

  // Team stats for AdminTeamsTab
  const teamStats = {}
  teams.forEach(t => {
    const count = t.team_players?.[0]?.count || 0
    teamStats[t.id] = { playerCount: count }
  })

  // Registration stats for AdminRegistrationsTab
  const regStats = {
    totalRegistrations: registrations.length,
    pending: pendingRegs,
    approved: approvedRegs,
    rostered: rosteredRegs,
    waitlisted: waitlistedRegs,
    denied: deniedRegs,
    capacity: totalRosterSpots,
  }

  // Registration players for AdminRegistrationsTab
  const registrationPlayers = registrations.map(r => ({
    id: r.player_id,
    first_name: r.players?.first_name || '',
    last_name: r.players?.last_name || '',
    date_of_birth: r.players?.birth_date,
    grade: r.players?.grade,
    parent_name: r.players?.parent_name || '',
    parent_phone: r.players?.parent_phone || '',
    parent_email: r.players?.parent_email || '',
    registrations: [r],
  }))

  // Payment stats for AdminPaymentsTab
  const payStats = {
    totalCollected,
    pastDue: overduePayments,
    totalExpected,
  }

  // Monthly payments chart data
  const monthlyPayments = (() => {
    const months = {}
    payments.filter(p => p.paid).forEach(p => {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = (months[key] || 0) + (Number(p.amount) || 0)
    })
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([label, value]) => ({ label, value }))
  })()

  // Payment families for AdminPaymentsTab
  const paymentFamilies = (() => {
    const fams = {}
    payments.forEach(p => {
      const key = p.player_id || 'unknown'
      if (!fams[key]) {
        fams[key] = {
          parentKey: key,
          parentName: p.players?.parent_name || p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown',
          parentEmail: p.players?.parent_email || '',
          children: [],
          totalDue: 0,
          totalPaid: 0,
          lineItems: [],
        }
      }
      fams[key].totalDue += Number(p.amount) || 0
      if (p.paid) fams[key].totalPaid += Number(p.amount) || 0
      fams[key].lineItems.push(p)
    })
    return Object.values(fams)
  })()

  // Financial breakdown per season
  const financialBreakdown = programSeasons.map(s => {
    const seasonPayments = payments.filter(p => p.season_id === s.id)
    const collected = seasonPayments.filter(p => p.paid).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const total = seasonPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    return {
      label: s.name,
      color: s.status === 'active' ? '#10B981' : '#94A3B8',
      collected,
      total,
    }
  }).filter(b => b.total > 0)

  // --- Greeting ---
  const greetingStats = {
    pendingRegs, overduePayments, activeSeasons, totalPlayers,
    upcomingEvents: upcomingThisWeek,
  }

  // --- Quick Actions (admin-only where needed) ---
  const quickActions = []
  if (isAdmin) {
    quickActions.push(
      { label: 'New Season', icon: CalendarPlus, onClick: () => openSeasonModal() },
      { label: 'New Team', icon: Users, onClick: () => setShowTeamModal(true) },
    )
  }
  quickActions.push(
    { label: 'View Schedule', icon: Calendar, onClick: () => navigate('/schedule') },
    { label: 'Send Blast', icon: Megaphone, onClick: () => navigate('/blasts') },
    { label: 'View Reports', icon: BarChart3, onClick: () => navigate('/reports') },
    { label: 'Registrations', icon: ClipboardList, onClick: () => navigate('/registrations') },
    { label: 'Registration Link', icon: Link2, onClick: () => {
      setShowRegLinkModal(true)
    }},
  )

  // --- Season Journey Stepper (scoped to selected season) ---
  const seasonSetupSteps = (() => {
    const steps = [
      { label: 'Add Teams', page: 'teams', status: teams.length > 0 ? 'done' : 'upcoming' },
      { label: 'Add Players', page: 'registrations', status: totalPlayers > 0 ? 'done' : 'upcoming' },
      { label: 'Create Schedule', page: 'schedule', status: events.length > 0 ? 'done' : 'upcoming' },
      { label: 'Open Registration', page: 'registration-templates', status: registrations.length > 0 ? 'done' : 'upcoming' },
      { label: 'Set Up Payments', page: 'payment-setup', status: payments.length > 0 ? 'done' : 'upcoming' },
    ]
    const first = steps.findIndex(s => s.status !== 'done')
    if (first >= 0) steps[first].status = 'current'
    return steps
  })()
  const setupComplete = seasonSetupSteps.filter(s => s.status === 'done').length
  const setupTotal = seasonSetupSteps.length
  const setupIncomplete = isAdmin && setupComplete < setupTotal

  // Auto-switch to setup tab on first load when setup is incomplete
  useEffect(() => {
    if (!loading && !setupTabInitialized && setupIncomplete) {
      setActiveTab('setup')
      setSetupTabInitialized(true)
    } else if (!loading && !setupTabInitialized) {
      setSetupTabInitialized(true)
    }
  }, [loading, setupTabInitialized, setupIncomplete])

  // --- Season Modal Helpers ---
  function openSeasonModal() {
    setSeasonForm({
      name: '', sport_id: program?.sport_id || null, status: 'upcoming',
      start_date: '', end_date: '', registration_open: false,
      capacity: null, description: '',
      fee_registration: 0, fee_uniform: 0, fee_monthly: 0, months_in_season: 1,
      program_id: program?.id || null,
    })
    setSeasonModalTab('basic')
    setShowSeasonModal(true)
  }

  async function handleSeasonSave() {
    // Guard: program must be loaded before we can insert (program_id is NOT NULL)
    if (!program?.id) {
      showToast?.('Cannot create season: program data is not loaded. Please refresh and try again.', 'error')
      return
    }

    // Delegate to SeasonsPage pattern — insert season
    const cleaned = {
      name: seasonForm.name?.trim(),
      sport_id: seasonForm.sport_id || program?.sport_id || null,
      status: seasonForm.status || 'upcoming',
      start_date: seasonForm.start_date || null,
      end_date: seasonForm.end_date || null,
      registration_open: seasonForm.registration_open || false,
      capacity: seasonForm.capacity || null,
      description: seasonForm.description?.trim() || null,
      organization_id: organization.id,
      program_id: program.id,
    }

    if (!cleaned.name) {
      showToast?.('Season name is required', 'error')
      return
    }

    const { error: insertErr } = await supabase.from('seasons').insert(cleaned)
    if (insertErr) {
      showToast?.(`Error creating season: ${insertErr.message}`, 'error')
      return
    }

    showToast?.('Season created!', 'success')
    setShowSeasonModal(false)
    refreshSeasons?.()
    refreshPrograms?.()
    // Re-fetch data after a short delay to let context update
    setTimeout(() => loadProgramData(), 500)
  }

  async function handleTeamCreate(teamData) {
    // Determine the season to create the team in
    const seasonId = selectedProgramSeason?.id || programSeasons?.[0]?.id
    if (!seasonId) {
      showToast?.('No season selected. Create a season first.', 'error')
      return
    }

    try {
      const clean = (v) => (v === '' || v === undefined) ? null : v

      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          season_id: seasonId,
          name: teamData.name,
          abbreviation: clean(teamData.abbreviation),
          color: teamData.color || '#4BB9EC',
          logo_url: clean(teamData.logo_url),
          age_group: clean(teamData.age_group),
          age_group_type: clean(teamData.age_group_type),
          team_type: clean(teamData.team_type),
          skill_level: clean(teamData.skill_level),
          gender: clean(teamData.gender),
          max_roster_size: teamData.max_roster_size,
          min_roster_size: teamData.min_roster_size,
          roster_open: teamData.roster_open,
          description: clean(teamData.description),
          internal_notes: clean(teamData.internal_notes),
        })
        .select()
        .single()

      if (error) {
        showToast?.('Error creating team: ' + error.message, 'error')
        return
      }

      const createdItems = ['team']

      // Always create team chat channel (ensures every team has a chat)
      if (teamData.create_team_chat !== false) {
        try {
          const { data: chatData, error: chatErr } = await supabase.from('chat_channels').insert({
            season_id: seasonId,
            team_id: newTeam.id,
            name: `${teamData.name} - Team Chat`,
            description: 'Chat for parents and coaches',
            channel_type: 'team_chat',
            created_by: user?.id,
          }).select().single()
          if (!chatErr && chatData && user?.id) {
            createdItems.push('team chat')
            await supabase.from('channel_members').insert({
              channel_id: chatData.id, user_id: user.id,
              member_role: 'admin', display_name: 'Admin',
              can_post: true, can_moderate: true,
            })
          }
        } catch (_) { /* non-critical */ }
      }

      if (teamData.create_player_chat) {
        try {
          const { data: pChatData, error: pChatErr } = await supabase.from('chat_channels').insert({
            season_id: seasonId,
            team_id: newTeam.id,
            name: `${teamData.name} - Player Chat`,
            description: 'Chat for players and coaches',
            channel_type: 'player_chat',
            created_by: user?.id,
          }).select().single()
          if (!pChatErr && pChatData && user?.id) {
            createdItems.push('player chat')
            await supabase.from('channel_members').insert({
              channel_id: pChatData.id, user_id: user.id,
              member_role: 'admin', display_name: 'Admin',
              can_post: true, can_moderate: true,
            })
          }
        } catch (_) { /* non-critical */ }
      }

      setShowTeamModal(false)
      showToast?.(`Created: ${createdItems.join(', ')}!`, 'success')
      refreshSeasons?.()
      refreshPrograms?.()
      setTimeout(() => loadProgramData(), 500)
    } catch (err) {
      console.error('Team creation failed:', err)
      showToast?.(`Failed to create team: ${err.message}`, 'error')
    }
  }

  // --- Season selection in carousel ---
  function handleSeasonSelect(seasonId) {
    if (selectedProgramSeason?.id === seasonId) {
      setSelectedProgramSeason(null) // deselect — show all
    } else {
      const season = programSeasons.find(s => s.id === seasonId)
      setSelectedProgramSeason(season || null)
      if (season) selectSeason(season)
    }
  }

  // --- Render ---

  // Program not found
  if (!loading && !program && programs.length > 0) {
    return (
      <ProgramError
        message="Program not found"
        onBack={() => navigate('/dashboard')}
      />
    )
  }

  // Loading
  if (loading && !program) {
    return <ProgramPageSkeleton />
  }

  // Fetch error
  if (error) {
    return (
      <ProgramError
        message={error}
        onRetry={loadProgramData}
        onBack={() => navigate('/dashboard')}
      />
    )
  }

  if (!program) return <ProgramPageSkeleton />

  const programIcon = program.icon || program.sport?.icon || '📋'
  const sportName = program.sport?.name
  const isSportProgram = !!program.sport_id

  // Empty state — program with zero seasons
  const hasSeasons = programSeasons.length > 0

  // Format currency
  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`

  // Hero stats
  const heroStats = [
    { value: programSeasons.length, label: 'Seasons', color: '#4BB9EC' },
    { value: totalTeams, label: 'Teams', color: '#4BB9EC' },
    { value: totalPlayers, label: 'Players', color: '#4BB9EC' },
    { value: fmt(totalCollected), label: 'Collected', color: '#10B981' },
    { value: actionItemCount, label: 'Action Items', color: actionItemCount > 0 ? '#F59E0B' : '#4BB9EC' },
  ]

  // Filtered data for tabs (scoped to selected season or all program seasons)
  const tabSeasonIds = selectedProgramSeason
    ? [selectedProgramSeason.id]
    : programSeasons.map(s => s.id)
  const tabTeams = teams.filter(t => tabSeasonIds.includes(t.season_id))
  const tabPlayers = players.filter(p => tabSeasonIds.includes(p.season_id))
  const tabRegistrations = registrations.filter(r => tabSeasonIds.includes(r.season_id))
  const tabPayments = payments.filter(p => tabSeasonIds.includes(p.season_id))
  const tabEvents = events.filter(e => tabSeasonIds.includes(e.season_id))

  const tabPendingRegs = tabRegistrations.filter(r => ['pending', 'submitted', 'new'].includes(r.status)).length
  const tabOverduePayments = tabPayments.filter(p => !p.paid && p.due_date && new Date(p.due_date) < new Date()).length

  // Filtered stats for tabs
  const tabRegStats = {
    totalRegistrations: tabRegistrations.length,
    pending: tabPendingRegs,
    approved: tabRegistrations.filter(r => r.status === 'approved').length,
    rostered: tabRegistrations.filter(r => r.status === 'rostered').length,
    waitlisted: tabRegistrations.filter(r => r.status === 'waitlisted').length,
    denied: tabRegistrations.filter(r => r.status === 'denied').length,
    capacity: tabTeams.reduce((sum, t) => sum + (t.max_roster_size || t.max_players || 12), 0),
  }
  const tabRegistrationPlayers = tabRegistrations.map(r => ({
    id: r.player_id,
    first_name: r.players?.first_name || '',
    last_name: r.players?.last_name || '',
    date_of_birth: r.players?.birth_date,
    grade: r.players?.grade,
    parent_name: r.players?.parent_name || '',
    parent_phone: r.players?.parent_phone || '',
    parent_email: r.players?.parent_email || '',
    registrations: [r],
  }))
  // Waiver stats (filtered by tab season)
  const tabWaivers = waiverSignatures.filter(w => tabSeasonIds.includes(w.season_id))
  const tabSignedWaivers = tabWaivers.filter(w => w.status === 'signed').length
  const tabTotalWaivers = tabWaivers.length
  const tabWaiverPct = tabTotalWaivers > 0 ? Math.round((tabSignedWaivers / tabTotalWaivers) * 100) : 0

  const tabCollected = tabPayments.filter(p => p.paid).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const tabExpected = tabPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const tabPayStats = { totalCollected: tabCollected, pastDue: tabOverduePayments, totalExpected: tabExpected }
  const tabMonthlyPayments = (() => {
    const months = {}
    tabPayments.filter(p => p.paid).forEach(p => {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = (months[key] || 0) + (Number(p.amount) || 0)
    })
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([label, value]) => ({ label, value }))
  })()
  const tabPaymentFamilies = (() => {
    const fams = {}
    tabPayments.forEach(p => {
      const key = p.player_id || 'unknown'
      if (!fams[key]) {
        fams[key] = { parentKey: key, parentName: p.players?.parent_name || (p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown'), parentEmail: p.players?.parent_email || '', children: [], totalDue: 0, totalPaid: 0, lineItems: [] }
      }
      fams[key].totalDue += Number(p.amount) || 0
      if (p.paid) fams[key].totalPaid += Number(p.amount) || 0
      fams[key].lineItems.push(p)
    })
    return Object.values(fams)
  })()

  // Tabs configuration (badges reflect filtered data)
  const tabs = [
    // Season Setup tab — admin only, shows when setup is incomplete
    ...(isAdmin ? [{
      id: 'setup',
      label: 'Season Setup',
      badge: setupIncomplete ? `${setupComplete}/${setupTotal}` : undefined,
      badgeColor: setupIncomplete ? '#4BB9EC' : '#10B981',
      badgeIcon: !setupIncomplete ? '✓' : undefined,
    }] : []),
    { id: 'teams', label: 'Teams', badge: tabTeams.length > 0 ? tabTeams.length : undefined },
    { id: 'registrations', label: 'Registrations', badge: tabPendingRegs > 0 ? tabPendingRegs : undefined },
    { id: 'payments', label: 'Payments', badge: tabOverduePayments > 0 ? tabOverduePayments : undefined },
    { id: 'schedule', label: 'Schedule', badge: tabEvents.length > 0 ? tabEvents.length : undefined },
  ]

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
      {/* ---- HERO ---- */}
      <HeroCard
        orgLine={`${programIcon} ${program.name}`}
        greeting={loading ? 'Loading...' : getProgramGreeting(program, greetingStats)}
        subLine={sportName || 'General Program'}
        mascotEmoji={programIcon}
        stats={heroStats}
        variant="light"
      />

      {/* ---- LOADING SKELETON OVERLAY ---- */}
      {loading && hasSeasons && (
        <div className="mt-6">
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--v2-text-muted)' }}>
            <div className="w-5 h-5 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
            {timedOut ? 'Taking longer than usual...' : 'Loading program data...'}
            {timedOut && (
              <button onClick={loadProgramData} className="text-[#4BB9EC] font-bold hover:underline">
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---- EMPTY STATE ---- */}
      {!loading && !hasSeasons && (
        <div className="mt-6">
          <ProgramEmptyState program={program} onCreateSeason={openSeasonModal} />
        </div>
      )}

      {/* ---- MAIN CONTENT (only when seasons exist) ---- */}
      {!loading && hasSeasons && (
        <div className="mt-6">
          <V2DashboardLayout
            mainContent={
              <div className="space-y-6">
                {/* Attention Strip */}
                {actionItemCount > 0 && (
                  <AttentionStrip
                    message={`${actionItemCount} item${actionItemCount !== 1 ? 's' : ''} need attention across your ${program.name} program`}
                    ctaLabel="Review Now"
                    variant={actionItemCount > 5 ? 'urgent' : 'warning'}
                    onClick={() => {
                      if (pendingRegs > 0) setActiveTab('registrations')
                      else if (overduePayments > 0) setActiveTab('payments')
                    }}
                  />
                )}

                {/* Quick Actions Bar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={action.onClick}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        fontSize: 13, fontWeight: 500,
                        border: '1px solid var(--color-border-secondary, #E2E8F0)',
                        background: 'var(--color-background-primary, #FFFFFF)',
                        color: 'var(--color-text-primary, #334155)',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-background-secondary, #F1F5F9)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-background-primary, #FFFFFF)' }}
                    >
                      {action.icon && <action.icon style={{ width: 14, height: 14, color: 'var(--color-text-primary, #334155)' }} />}
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Season Carousel */}
                <SeasonCarousel
                  seasons={programSeasons}
                  perSeasonTeamCounts={perSeasonTeamCounts}
                  perSeasonPlayerCounts={perSeasonPlayerCounts}
                  perSeasonActionCounts={perSeasonActionCounts}
                  selectedSeasonId={selectedProgramSeason?.id}
                  onSeasonSelect={handleSeasonSelect}
                  onViewAll={() => navigate('/settings/seasons')}
                />

                {/* Body Tabs */}
                <BodyTabs
                  tabs={tabs}
                  activeTabId={activeTab}
                  onTabChange={setActiveTab}
                >
                  {activeTab === 'setup' && (
                    <LifecycleTracker
                      seasonName={selectedProgramSeason?.name || selectedSeason?.name || programSeasons[0]?.name || ''}
                      seasonId={selectedProgramSeason?.id || selectedSeason?.id || programSeasons[0]?.id || ''}
                      programId={programId}
                      teamsCount={tabTeams.length}
                      playersCount={tabPlayers?.length || 0}
                      eventsCount={tabEvents.length}
                      registrationsCount={tabRegistrations.length}
                      approvedRegsCount={tabRegistrations.filter(r => r.status === 'approved' || r.status === 'rostered').length}
                      paymentsCollected={tabPayments.filter(p => p.paid).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)}
                      paymentsExpected={tabPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)}
                      showToast={showToast}
                      navigate={navigate}
                      onOpenRegLink={() => setShowRegLinkModal(true)}
                    />
                  )}
                  {activeTab === 'teams' && (
                    <AdminTeamsTab
                      teamsData={tabTeams}
                      teamStats={teamStats}
                      onTeamClick={(teamId) => navigate(`/teams/${teamId}`)}
                      onViewAll={() => navigate('/teams')}
                    />
                  )}
                  {activeTab === 'registrations' && (
                    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
                      {/* Inline stat strip */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 16,
                        padding: '10px 14px',
                        background: 'var(--v2-surface)',
                        borderRadius: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}>
                        {[
                          { value: tabRegStats.totalRegistrations, label: 'total', color: 'var(--v2-text-primary)' },
                          { value: tabRegStats.pending, label: 'pending', color: '#FF9800' },
                          { value: tabRegStats.approved, label: 'approved', color: '#4CAF50' },
                          { value: tabRegStats.rostered, label: 'rostered', color: '#2196F3' },
                          { value: tabRegStats.waitlisted, label: 'waitlist', color: '#FF9800' },
                          { value: tabRegStats.denied, label: 'denied', color: '#F44336' },
                        ].map((stat, i) => (
                          <span key={stat.label} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                            {i > 0 && <span style={{ color: 'var(--v2-border-subtle, rgba(148,163,184,0.3))', marginRight: 12 }}>|</span>}
                            <span style={{ fontSize: 20, fontWeight: 600, color: stat.color }}>{stat.value}</span>
                            <span style={{ fontSize: 10, color: 'var(--v2-text-muted)' }}>{stat.label}</span>
                          </span>
                        ))}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: 10, color: 'var(--v2-text-muted)' }}>Capacity</span>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{tabRegStats.totalRegistrations}/{tabRegStats.capacity || 96}</span>
                        </div>
                      </div>

                      {/* Two thin bars side by side */}
                      <div style={{ display: 'flex', gap: 8, padding: '0 2px', marginBottom: 14 }}>
                        {/* Funnel bar */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--v2-surface)' }}>
                            {tabRegStats.totalRegistrations > 0 && (
                              <>
                                <div style={{ width: `${((tabRegStats.totalRegistrations - tabRegStats.approved - tabRegStats.rostered) / Math.max(tabRegStats.totalRegistrations, 1)) * 100}%`, background: '#10284C' }} />
                                <div style={{ width: `${(tabRegStats.approved / Math.max(tabRegStats.totalRegistrations, 1)) * 100}%`, background: '#4CAF50' }} />
                                <div style={{ width: `${(tabRegStats.rostered / Math.max(tabRegStats.totalRegistrations, 1)) * 100}%`, background: '#4BB9EC' }} />
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                            <span style={{ fontSize: 7, color: 'var(--v2-text-muted)' }}>Submitted</span>
                            <span style={{ fontSize: 7, color: 'var(--v2-text-muted)' }}>Approved</span>
                            <span style={{ fontSize: 7, color: 'var(--v2-text-muted)' }}>Rostered</span>
                          </div>
                        </div>
                        {/* Waiver bar */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--v2-surface)' }}>
                            <div style={{ width: `${tabWaiverPct}%`, background: '#10284C' }} />
                            {(100 - tabWaiverPct) > 0 && <div style={{ width: `${100 - tabWaiverPct}%`, background: '#F44336' }} />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
                            <span style={{ fontSize: 7, color: 'var(--v2-text-muted)' }}>Waivers signed</span>
                            <span style={{ fontSize: 7, color: 'var(--v2-text-muted)' }}>Not signed</span>
                          </div>
                        </div>
                      </div>

                      {/* Player registration list */}
                      {tabRegistrationPlayers.length > 0 && (() => {
                        const statusOrder = { pending: 0, submitted: 0, new: 0, approved: 1, waitlisted: 2, withdrawn: 3, denied: 3, rostered: 4, active: 4 }
                        const sorted = [...tabRegistrationPlayers].sort((a, b) => {
                          const sa = a.registrations?.[0]?.status || ''
                          const sb = b.registrations?.[0]?.status || ''
                          return (statusOrder[sa] ?? 9) - (statusOrder[sb] ?? 9)
                        }).slice(0, 10)
                        const statusBadge = (status) => {
                          const map = {
                            pending: { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
                            submitted: { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
                            new: { label: 'New', bg: 'rgba(245,158,11,0.1)', color: '#D97706' },
                            approved: { label: 'Approved', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
                            rostered: { label: 'Rostered', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
                            active: { label: 'Rostered', bg: 'rgba(16,185,129,0.1)', color: '#059669' },
                            waitlisted: { label: 'Waitlisted', bg: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
                            denied: { label: 'Denied', bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
                            withdrawn: { label: 'Withdrawn', bg: 'rgba(239,68,68,0.1)', color: '#DC2626' },
                          }
                          const s = map[status] || { label: status || '—', bg: 'var(--v2-surface)', color: 'var(--v2-text-muted)' }
                          return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                        }
                        return (
                          <div style={{ marginBottom: 14 }}>
                            {/* Table header */}
                            <div style={{
                              display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px',
                              gap: 8, padding: '10px 12px',
                              background: 'var(--v2-surface)', borderRadius: '10px 10px 0 0',
                              borderBottom: '1px solid var(--v2-border-subtle)',
                            }}>
                              {['Player', 'Parent', 'Contact', 'Status'].map(h => (
                                <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', letterSpacing: '0.05em' }}>{h}</span>
                              ))}
                            </div>
                            {sorted.map((p, i) => {
                              const status = p.registrations?.[0]?.status
                              return (
                                <div key={p.id || i} style={{
                                  display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px',
                                  gap: 8, padding: '10px 12px', alignItems: 'center',
                                  borderBottom: i < sorted.length - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                                }}>
                                  <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)' }}>{p.first_name} {p.last_name}</div>
                                  </div>
                                  <div style={{ fontSize: 13, color: 'var(--v2-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parent_name || '—'}</div>
                                  <div style={{ fontSize: 12, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.parent_phone || p.parent_email || '—'}</div>
                                  <div>{statusBadge(status)}</div>
                                </div>
                              )
                            })}
                            {tabRegistrationPlayers.length > 10 && (
                              <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>+{tabRegistrationPlayers.length - 10} more</span>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Action */}
                      <button
                        onClick={() => navigate('/registrations')}
                        style={{
                          width: '100%', padding: 10, borderRadius: 10,
                          fontSize: 12, fontWeight: 700,
                          background: 'var(--v2-navy)', color: '#FFFFFF',
                          border: 'none', cursor: 'pointer',
                        }}
                      >
                        View All Registrations &rarr;
                      </button>
                    </div>
                  )}
                  {activeTab === 'payments' && (() => {
                    const collected = tabCollected
                    const outstanding = tabExpected - tabCollected
                    const collectionPct = tabExpected > 0 ? Math.round((tabCollected / tabExpected) * 100) : 0
                    const overdue = tabOverduePayments

                    const getPayStatus = (fam) => {
                      if (fam.totalDue === 0 && fam.totalPaid > 0) return { label: 'Paid', bg: 'rgba(16,185,129,0.1)', color: '#059669' }
                      if (fam.totalPaid > 0 && fam.totalDue > fam.totalPaid) return { label: 'Partial', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' }
                      return { label: 'Pending', bg: 'rgba(245,158,11,0.1)', color: '#D97706' }
                    }

                    return (
                      <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
                        {/* 4-stat single row */}
                        <div style={{
                          display: 'flex',
                          border: '0.5px solid var(--v2-border-subtle, rgba(148,163,184,0.2))',
                          borderRadius: 10,
                          overflow: 'hidden',
                          marginBottom: 14,
                        }}>
                          {[
                            { value: `$${collected.toLocaleString()}`, label: 'COLLECTED', color: '#4CAF50' },
                            { value: `$${outstanding.toLocaleString()}`, label: 'OUTSTANDING', color: outstanding > 0 ? '#F44336' : 'var(--v2-text-primary)' },
                            { value: `${collectionPct}%`, label: 'COLLECTION RATE', color: collectionPct >= 75 ? '#4CAF50' : collectionPct >= 50 ? '#FF9800' : '#F44336' },
                            { value: overdue, label: 'OVERDUE', color: overdue > 0 ? '#F44336' : 'var(--v2-text-primary)' },
                          ].map((stat, i) => (
                            <div key={stat.label} style={{
                              flex: 1, textAlign: 'center', padding: '14px 8px',
                              borderRight: i < 3 ? '0.5px solid var(--v2-border-subtle, rgba(148,163,184,0.2))' : 'none',
                            }}>
                              <p style={{ fontSize: 20, fontWeight: 600, margin: 0, color: stat.color }}>{stat.value}</p>
                              <p style={{ fontSize: 9, color: 'var(--v2-text-muted)', margin: '2px 0 0', letterSpacing: '0.5px' }}>{stat.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Family payment list */}
                        {tabPaymentFamilies.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{
                              display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px',
                              gap: 8, padding: '10px 12px',
                              background: 'var(--v2-surface)', borderRadius: '10px 10px 0 0',
                              borderBottom: '1px solid var(--v2-border-subtle)',
                            }}>
                              {['Family', 'Players', 'Amount Due', 'Status'].map(h => (
                                <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)', letterSpacing: '0.05em' }}>{h}</span>
                              ))}
                            </div>
                            {tabPaymentFamilies.slice(0, 10).map((fam, i) => {
                              const st = getPayStatus(fam)
                              return (
                                <div key={fam.parentKey || i} style={{
                                  display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px',
                                  gap: 8, padding: '10px 12px', alignItems: 'center',
                                  borderBottom: i < Math.min(tabPaymentFamilies.length, 10) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                                }}>
                                  <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--v2-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fam.parentName}</div>
                                    {fam.parentEmail && <div style={{ fontSize: 11, color: 'var(--v2-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fam.parentEmail}</div>}
                                  </div>
                                  <div style={{ fontSize: 12.5, color: 'var(--v2-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fam.children?.join(', ') || '—'}</div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: fam.totalDue > fam.totalPaid ? 'var(--v2-text-primary)' : 'var(--v2-green)' }}>${fam.totalDue.toLocaleString()}</div>
                                  <div><span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span></div>
                                </div>
                              )
                            })}
                            {tabPaymentFamilies.length > 10 && (
                              <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>+{tabPaymentFamilies.length - 10} more families</span>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => navigate('/payments')}
                          style={{
                            width: '100%', padding: 10, borderRadius: 10,
                            fontSize: 12, fontWeight: 700,
                            background: 'var(--v2-navy)', color: '#FFFFFF',
                            border: 'none', cursor: 'pointer',
                          }}
                        >
                          View All Payments &rarr;
                        </button>
                      </div>
                    )
                  })()}
                  {activeTab === 'schedule' && (() => {
                    const formatTime12 = (timeStr) => {
                      if (!timeStr) return ''
                      const [hours, minutes] = timeStr.split(':')
                      const h = parseInt(hours)
                      return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`
                    }
                    const typeColors = {
                      game: { bg: '#FFEBEE', text: '#C62828', label: 'GAME' },
                      practice: { bg: '#E8F5E9', text: '#2E7D32', label: 'PRACTICE' },
                      tournament: { bg: '#E3F2FD', text: '#1565C0', label: 'TOURNAMENT' },
                    }
                    const defaultTypeStyle = (evtType) => ({ bg: 'var(--v2-surface)', text: 'var(--v2-text-muted)', label: evtType?.toUpperCase() || 'EVENT' })

                    return (
                      <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
                        {tabEvents.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--v2-text-muted)' }}>
                            <p style={{ fontSize: 14, margin: '0 0 4px' }}>No upcoming events</p>
                            <p style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>Create events from the schedule page</p>
                          </div>
                        ) : (
                          <div>
                            {tabEvents.slice(0, 8).map((evt, i) => {
                              const eventDate = parseLocalDate(evt.event_date)
                              const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
                              const dayNum = eventDate.getDate()
                              const monthName = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                              const time = evt.event_time || evt.start_time
                              const typeStyle = typeColors[evt.event_type?.toLowerCase()] || defaultTypeStyle(evt.event_type)

                              return (
                                <div key={evt.id || i} style={{
                                  display: 'flex', alignItems: 'center', padding: '12px 0',
                                  borderBottom: '0.5px solid var(--v2-border-subtle, rgba(148,163,184,0.2))',
                                  gap: 16, cursor: 'pointer',
                                }}
                                onClick={() => navigate('/schedule')}
                                >
                                  {/* Date column */}
                                  <div style={{ width: 45, textAlign: 'center', flexShrink: 0 }}>
                                    <p style={{ fontSize: 10, color: 'var(--v2-text-muted)', margin: 0 }}>{dayName}</p>
                                    <p style={{ fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1, color: 'var(--v2-text-primary)' }}>{dayNum}</p>
                                    <p style={{ fontSize: 10, color: 'var(--v2-text-muted)', margin: 0 }}>{monthName}</p>
                                  </div>

                                  {/* Event details */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: 'var(--v2-text-primary)' }}>
                                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: typeStyle.text, display: 'inline-block', marginRight: 6 }} />
                                      {evt.title || evt.opponent_name || 'Event'}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--v2-text-muted)', margin: 0 }}>
                                      {evt.teams?.name || ''}{time ? ` · ${formatTime12(time)}` : ''}{evt.location ? ` · ${evt.location}` : ''}
                                    </p>
                                  </div>

                                  {/* Type badge */}
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '3px 10px',
                                    borderRadius: 6, background: typeStyle.bg, color: typeStyle.text,
                                    letterSpacing: '0.3px', flexShrink: 0,
                                  }}>
                                    {typeStyle.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div style={{ marginTop: 12 }}>
                          <div onClick={() => navigate('/schedule')} style={{
                            background: '#10284C', color: 'white', textAlign: 'center',
                            padding: 10, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          }}>
                            View Full Schedule &rarr;
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </BodyTabs>

                {/* Season Journey Stepper replaced by LifecycleTracker tab */}
              </div>
            }
            sideContent={
              <div className="space-y-6">
                <FinancialSnapshot
                  overline={program.name}
                  heading={fmt(totalExpected)}
                  headingSub="Total Expected Revenue"
                  projectedRevenue={totalExpected}
                  collectedPct={collectedPct}
                  receivedAmount={fmt(totalCollected)}
                  receivedLabel="Collected"
                  outstandingAmount={fmt(totalOutstanding)}
                  outstandingLabel="Outstanding"
                  breakdown={financialBreakdown}
                  primaryAction={isAdmin ? { label: 'View All Payments', onClick: () => navigate('/payments') } : undefined}
                />

              </div>
            }
          />
        </div>
      )}

      {/* ---- MODALS ---- */}
      {showSeasonModal && (
        <SeasonFormModal
          showModal={showSeasonModal}
          setShowModal={setShowSeasonModal}
          editingSeason={null}
          form={seasonForm}
          setForm={setSeasonForm}
          handleSave={handleSeasonSave}
          modalTab={seasonModalTab}
          setModalTab={setSeasonModalTab}
          sports={program.sport ? [program.sport] : []}
          templates={[]}
          tc={tc}
          isDark={isDark}
          selectedProgram={program}
        />
      )}

      {showTeamModal && (
        <NewTeamModal
          onClose={() => setShowTeamModal(false)}
          onCreate={handleTeamCreate}
        />
      )}

      <RegLinkModal
        isOpen={showRegLinkModal}
        onClose={() => setShowRegLinkModal(false)}
        organization={organization}
        seasons={programSeasons}
        defaultSeasonId={selectedProgramSeason?.id || null}
        showToast={showToast}
      />
    </div>
  )
}
