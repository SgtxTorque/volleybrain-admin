// =============================================================================
// SeasonManagementPage — One-stop shop for managing a single season
// Guided workflow: 10 steps from create to launch, auto-filtered content.
// Route: /admin/seasons (with season selector)
// =============================================================================

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import DashboardContainer from '../../components/layout/DashboardContainer'
import SeasonWorkflowTracker, { WORKFLOW_STEPS } from './SeasonWorkflowTracker'
import {
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle,
  Users, DollarSign, Calendar, Shield, UserCheck, FileText, Shirt, Rocket
} from 'lucide-react'

// Step icon mapping
const STEP_ICONS = {
  'create': Rocket,
  'registration': FileText,
  'manage-regs': Users,
  'payments': DollarSign,
  'assign-teams': Shield,
  'assign-coaches': UserCheck,
  'positions': Users,
  'schedule': Calendar,
  'uniforms': Shirt,
  'verify': CheckCircle2,
}

// =============================================================================
// Step Content Section — renders inline content for the active step
// =============================================================================
function StepContent({ stepId, seasonId, seasonName, stats, onNavigate, isDark }) {
  const Icon = STEP_ICONS[stepId] || CheckCircle2
  const step = WORKFLOW_STEPS.find(s => s.id === stepId)
  const pct = stats[stepId] || 0
  const isComplete = pct >= 100

  // Step-specific descriptions and action prompts
  const stepInfo = {
    'create': {
      description: 'Season created with name, sport, dates, and age groups.',
      action: 'Edit Season Settings',
      page: 'seasons',
    },
    'registration': {
      description: 'Set registration window, fees, forms, and waivers for this season.',
      action: 'Configure Registration',
      page: 'templates',
    },
    'manage-regs': {
      description: `Review and approve player registrations. ${stats.pendingRegs || 0} pending.`,
      action: 'Review Registrations',
      page: 'registrations',
    },
    'payments': {
      description: `Track payments, send reminders, handle overdue. $${(stats.outstanding || 0).toLocaleString()} outstanding.`,
      action: 'Manage Payments',
      page: 'payments',
    },
    'assign-teams': {
      description: `Create teams and assign players. ${stats.unrostered || 0} players need teams.`,
      action: 'Assign Players to Teams',
      page: 'teams',
    },
    'assign-coaches': {
      description: `Assign coaches to teams. ${stats.teamsWithoutCoach || 0} team${stats.teamsWithoutCoach !== 1 ? 's' : ''} need a coach.`,
      action: 'Assign Coaches',
      page: 'coaches',
    },
    'positions': {
      description: 'Ensure coaches have set player positions for game-day readiness.',
      action: 'View Rosters',
      page: 'teams',
    },
    'schedule': {
      description: `Create games, practices, and events. ${stats.teamsWithoutSchedule || 0} teams need events.`,
      action: 'Create Schedule',
      page: 'schedule',
    },
    'uniforms': {
      description: `Assign jersey numbers to all players. ${stats.playersWithoutJersey || 0} need assignments.`,
      action: 'Manage Jerseys',
      page: 'jerseys',
    },
    'verify': {
      description: 'Final check — review all steps and confirm everything is ready for first practice.',
      action: 'Review All Steps',
      page: null,
    },
  }

  const info = stepInfo[stepId] || { description: '', action: 'View', page: 'dashboard' }

  // Find next incomplete step for the "handle next" prompt
  const nextStep = WORKFLOW_STEPS.find(s => s.id !== stepId && (stats[s.id] || 0) < 100)

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-2xl p-6`}>
      {/* Step header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isComplete ? 'bg-emerald-500/15' : 'bg-lynx-sky/15'
        }`}>
          <Icon className={`w-6 h-6 ${isComplete ? 'text-emerald-500' : 'text-lynx-sky'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {step?.label || 'Step'}
          </h2>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {info.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-3xl font-extrabold tabular-nums ${
            isComplete ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500'
          }`}>
            {pct}%
          </span>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-2.5 rounded-full overflow-hidden mb-5 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? 'bg-emerald-500' : 'bg-lynx-sky'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Action button */}
      {info.page && (
        <button
          onClick={() => onNavigate?.(info.page)}
          className="px-6 py-3 rounded-xl bg-lynx-sky text-white text-lg font-bold hover:brightness-110 transition flex items-center gap-2"
        >
          {info.action}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Verify step — summary of all steps */}
      {stepId === 'verify' && (
        <div className="mt-4 space-y-2">
          {WORKFLOW_STEPS.filter(s => s.id !== 'verify').map(s => {
            const sPct = stats[s.id] || 0
            const done = sPct >= 100
            return (
              <div key={s.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                isDark ? 'bg-white/[0.02]' : 'bg-slate-50'
              }`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className={`w-5 h-5 shrink-0 ${sPct >= 50 ? 'text-amber-500' : 'text-red-500'}`} />
                )}
                <span className={`text-lg flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.label}</span>
                <span className={`text-lg font-bold tabular-nums ${done ? 'text-emerald-500' : 'text-slate-400'}`}>{sPct}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* "Want to handle X next?" prompt */}
      {nextStep && stepId !== 'verify' && (
        <div className={`mt-5 pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Want to handle <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{nextStep.label}</span> next?
            <button
              onClick={() => onNavigate?.('season-management', { step: nextStep.id })}
              className="ml-2 text-lynx-sky font-bold"
            >
              Go there &rarr;
            </button>
          </p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================
export default function SeasonManagementPage({ onNavigate, showToast }) {
  const { organization } = useAuth()
  const { seasons, allSeasons, selectedSeason, selectSeason } = useSeason()
  const { sports } = useSport()
  const { isDark } = useTheme()
  const { seasonId: routeSeasonId } = useParams()
  const [activeStep, setActiveStep] = useState(null)
  const [stepStats, setStepStats] = useState({})
  const [loading, setLoading] = useState(true)

  const availableSeasons = allSeasons || seasons || []
  const season = selectedSeason

  // Auto-select season from route param on mount
  useEffect(() => {
    if (routeSeasonId && availableSeasons.length > 0) {
      const match = availableSeasons.find(s => s.id === routeSeasonId)
      if (match && match.id !== selectedSeason?.id) {
        selectSeason(match)
        setActiveStep(null)
      }
    }
  }, [routeSeasonId, availableSeasons.length])

  // Load step completion data when season changes
  useEffect(() => {
    if (season?.id) {
      loadStepCompletion(season.id)
    }
  }, [season?.id])

  async function loadStepCompletion(seasonId) {
    setLoading(true)
    try {
      const orgId = season?.organization_id || organization?.id

      // Fetch teams for this season
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .eq('season_id', seasonId)
      const teamIds = teams?.map(t => t.id) || []

      // Fetch players for this season
      const { data: players } = await supabase
        .from('players')
        .select('id, registrations(status)')
        .eq('season_id', seasonId)
      const totalPlayers = players?.length || 0

      // Pending registrations
      const pendingRegs = players?.filter(p => {
        const status = p.registrations?.[0]?.status
        return ['pending', 'submitted', 'new'].includes(status)
      }).length || 0

      // Rostered players
      let rosteredCount = 0
      if (teamIds.length > 0) {
        const { data: tp } = await supabase
          .from('team_players')
          .select('player_id')
          .in('team_id', teamIds)
        rosteredCount = new Set(tp?.map(x => x.player_id) || []).size
      }

      // Coach assignments
      let teamsWithCoach = 0
      if (teamIds.length > 0) {
        const { data: tc } = await supabase
          .from('team_coaches')
          .select('team_id')
          .in('team_id', teamIds)
        teamsWithCoach = new Set(tc?.map(x => x.team_id) || []).size
      }

      // Payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid')
        .eq('season_id', seasonId)
      const totalExpected = payments?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0
      const totalCollected = payments?.filter(p => p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0

      // Schedule events
      const { data: events } = await supabase
        .from('schedule_events')
        .select('team_id')
        .eq('season_id', seasonId)
      const teamsWithEvents = new Set(events?.map(e => e.team_id).filter(Boolean) || []).size

      // Waivers
      let unsignedWaivers = 0
      try {
        const { count: activeW } = await supabase.from('waivers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true)
        const { count: signed } = await supabase.from('waiver_signatures').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
        const expected = (activeW || 0) * totalPlayers
        unsignedWaivers = Math.max(0, expected - (signed || 0))
      } catch {}

      // Compute step completions (0-100)
      const totalTeams = teamIds.length
      const unrostered = Math.max(0, totalPlayers - rosteredCount)
      const teamsWithoutCoach = Math.max(0, totalTeams - teamsWithCoach)
      const teamsWithoutSchedule = Math.max(0, totalTeams - teamsWithEvents)
      const outstanding = Math.max(0, totalExpected - totalCollected)

      const completion = {
        'create': 100, // Season exists
        'registration': season?.registration_open || totalPlayers > 0 ? 100 : 0,
        'manage-regs': totalPlayers > 0 ? Math.min(100, Math.round(((totalPlayers - pendingRegs) / totalPlayers) * 100)) : 0,
        'payments': totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 100,
        'assign-teams': totalPlayers > 0 ? Math.min(100, Math.round((rosteredCount / totalPlayers) * 100)) : 0,
        'assign-coaches': totalTeams > 0 ? Math.min(100, Math.round((teamsWithCoach / totalTeams) * 100)) : 0,
        'positions': 100, // Default — no position tracking in web yet
        'schedule': totalTeams > 0 ? Math.min(100, Math.round((teamsWithEvents / totalTeams) * 100)) : 0,
        'uniforms': 100, // Default — jersey tracking separate
        'verify': 0, // Manual step

        // Extra stats for StepContent descriptions
        pendingRegs,
        outstanding,
        unrostered,
        teamsWithoutCoach,
        teamsWithoutSchedule,
        playersWithoutJersey: 0,
      }

      // Verify = all other steps complete
      const nonVerifySteps = WORKFLOW_STEPS.filter(s => s.id !== 'verify')
      const allComplete = nonVerifySteps.every(s => (completion[s.id] || 0) >= 100)
      completion.verify = allComplete ? 100 : Math.round(nonVerifySteps.reduce((sum, s) => sum + (completion[s.id] || 0), 0) / nonVerifySteps.length)

      setStepStats(completion)

      // Auto-select first incomplete step
      if (!activeStep) {
        const firstIncomplete = WORKFLOW_STEPS.find(s => (completion[s.id] || 0) < 100)
        setActiveStep(firstIncomplete?.id || 'verify')
      }
    } catch (err) {
      console.error('Season management load error:', err)
    }
    setLoading(false)
  }

  // Sport info
  const sport = sports.find(s => s.id === season?.sport_id)
  const sportName = sport?.name || 'Sport'

  // Date range
  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={`h-[calc(100vh)] overflow-hidden ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>
      <div className="w-full h-full overflow-y-auto">
        <DashboardContainer className="space-y-5">

          {/* Header: Season name + sport + date range + season selector */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {season?.name || 'Season Management'}
              </h1>
              <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {sportName}
                {season?.start_date && ` \u00B7 ${formatDate(season.start_date)}`}
                {season?.end_date && ` \u2013 ${formatDate(season.end_date)}`}
              </p>
            </div>

            {/* Season selector */}
            {availableSeasons.length > 1 && (
              <div className="relative">
                <select
                  value={season?.id || ''}
                  onChange={(e) => {
                    const s = availableSeasons.find(x => x.id === e.target.value)
                    if (s) { selectSeason(s); setActiveStep(null) }
                  }}
                  className={`appearance-none rounded-xl px-4 pr-10 py-2.5 text-lg font-medium cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1]'
                      : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {availableSeasons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
            )}
          </div>

          {/* Workflow Tracker */}
          <SeasonWorkflowTracker
            stepCompletion={stepStats}
            activeStep={activeStep}
            onStepClick={(stepId) => setActiveStep(stepId)}
          />

          {/* Active Step Content */}
          {activeStep && (
            <StepContent
              stepId={activeStep}
              seasonId={season?.id}
              seasonName={season?.name}
              stats={stepStats}
              onNavigate={onNavigate}
              isDark={isDark}
            />
          )}

          {/* Back to dashboard link */}
          <div className="text-center pb-6">
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="text-lg text-lynx-sky font-medium"
            >
              &larr; Back to Dashboard
            </button>
          </div>
        </DashboardContainer>
      </div>
    </div>
  )
}
