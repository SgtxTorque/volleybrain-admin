// =============================================================================
// CoachSeasonJourneyCard — Season preparation step tracker for coaches
// Checks REAL database state for each step's completion
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { ChevronRight, Check } from 'lucide-react'

const STEPS = [
  { id: 'roster', label: 'Review Roster', nav: 'teams', num: 1 },
  { id: 'evaluations', label: 'Evaluations', nav: 'teams', num: 2 },
  { id: 'positions', label: 'Set Positions', nav: 'teams', num: 3 },
  { id: 'jerseys', label: 'Assign Jerseys', nav: 'jerseys', num: 4 },
  { id: 'chat', label: 'Team Chat', nav: 'chats', num: 5 },
  { id: 'lineup', label: 'Build Lineup', nav: 'gameprep', num: 6 },
  { id: 'practice', label: 'Practice Plan', nav: 'schedule', num: 7 },
  { id: 'schedule', label: 'Confirm Schedule', nav: 'schedule', num: 8 },
]

export default function CoachSeasonJourneyCard({ onNavigate, teamId, seasonId, roster }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [stepStatus, setStepStatus] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || !teamId) {
      setLoading(false)
      return
    }
    checkAllSteps()
  }, [user?.id, teamId, seasonId])

  async function checkAllSteps() {
    setLoading(true)
    const status = {}

    try {
      // Step 1: Review Roster — check if team has players assigned
      try {
        const { data: players } = await supabase
          .from('team_players')
          .select('id')
          .eq('team_id', teamId)
          .limit(1)

        status.roster = (players?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: roster check failed:', err.message)
        status.roster = false
      }

      // Step 2: Evaluations — check if any player_skills or evaluations exist
      try {
        const { data: evals } = await supabase
          .from('player_skills')
          .select('id')
          .eq('team_id', teamId)
          .limit(1)

        status.evaluations = (evals?.length || 0) > 0
      } catch (err) {
        // Table may not exist — treat as incomplete
        console.warn('CoachJourney: evaluations check failed:', err.message)
        status.evaluations = false
      }

      // Step 3: Positions — check if players have positions set
      try {
        const { data: positioned } = await supabase
          .from('team_players')
          .select('id, position')
          .eq('team_id', teamId)
          .not('position', 'is', null)
          .limit(1)

        status.positions = (positioned?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: positions check failed:', err.message)
        status.positions = false
      }

      // Step 4: Jerseys — check if jersey assignments exist
      try {
        const { data: jerseys } = await supabase
          .from('jersey_assignments')
          .select('id')
          .eq('team_id', teamId)
          .limit(1)

        status.jerseys = (jerseys?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: jerseys check failed:', err.message)
        status.jerseys = false
      }

      // Step 5: Team Chat — check if coach sent at least one message
      try {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('sender_id', user.id)
          .limit(1)

        status.chat = (msgs?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: chat check failed:', err.message)
        status.chat = false
      }

      // Step 6: Build Lineup — check if any game_lineups exist for this team
      try {
        const { data: lineups } = await supabase
          .from('game_lineups')
          .select('id')
          .eq('team_id', teamId)
          .limit(1)

        status.lineup = (lineups?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: lineup check failed:', err.message)
        status.lineup = false
      }

      // Step 7: Practice Plan — check if any practice events exist
      try {
        let query = supabase
          .from('schedule_events')
          .select('id')
          .eq('team_id', teamId)
          .eq('event_type', 'practice')
          .limit(1)

        if (seasonId) query = query.eq('season_id', seasonId)

        const { data: practices } = await query
        status.practice = (practices?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: practice check failed:', err.message)
        status.practice = false
      }

      // Step 8: Confirm Schedule — check if schedule events exist for team
      try {
        let query = supabase
          .from('schedule_events')
          .select('id')
          .eq('team_id', teamId)
          .limit(1)

        if (seasonId) query = query.eq('season_id', seasonId)

        const { data: events } = await query
        status.schedule = (events?.length || 0) > 0
      } catch (err) {
        console.warn('CoachJourney: schedule check failed:', err.message)
        status.schedule = false
      }
    } catch (err) {
      console.warn('CoachJourney: overall check failed:', err.message)
    }

    setStepStatus(status)
    setLoading(false)
  }

  const completedCount = STEPS.filter(s => stepStatus[s.id]).length
  const allDone = completedCount === STEPS.length
  const nextStep = STEPS.find(s => !stepStatus[s.id])

  // Don't render if all done (progressive disclosure)
  if (allDone && !loading) return null
  if (loading) return null

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-r-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Season Prep
          </h3>
          <p className={`text-r-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {completedCount}/{STEPS.length} complete
          </p>
        </div>
        {nextStep && (
          <button
            onClick={() => onNavigate?.(nextStep.nav)}
            className="flex items-center gap-1 text-r-sm font-semibold text-lynx-sky hover:brightness-110 transition"
          >
            Handle <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Step tracker */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = stepStatus[step.id]
          const isCurrent = !isCompleted && step.id === nextStep?.id
          const isUpcoming = !isCompleted && !isCurrent

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => onNavigate?.(step.nav)}
                className="flex flex-col items-center gap-1.5 group/step"
                title={step.label}
              >
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-r-xs font-bold
                  transition-all cursor-pointer
                  ${isCompleted
                    ? 'bg-green-500/15 border-green-500 text-green-500'
                    : isCurrent
                      ? 'bg-lynx-sky border-lynx-sky text-white animate-pulse'
                      : 'border-slate-300 text-slate-400'
                  }
                  ${isUpcoming ? '' : 'group-hover/step:brightness-110'}
                `}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  isCompleted || isCurrent
                    ? (isDark ? 'text-slate-300' : 'text-slate-600')
                    : (isDark ? 'text-slate-600' : 'text-slate-400')
                }`}>
                  {step.label}
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1 mt-[-18px] ${
                  isCompleted ? 'bg-green-500' : (isDark ? 'bg-white/[0.08]' : 'bg-slate-200')
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
