import { useState } from 'react'
import { useJourney, JOURNEY_STEPS } from '../contexts/JourneyContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { X, ChevronRight, CheckCircle2, Circle } from '../constants/icons'

const STEP_ROUTES = {
  create_org: 'organization',
  create_season: 'seasons',
  add_teams: 'teams',
  add_coaches: 'coaches',
  register_players: 'registrations',
  create_schedule: 'schedule',
  first_game: 'gameprep',
  join_create_team: 'teams',
  add_roster: 'roster',
  assign_coach: 'coaches',
  first_practice: 'schedule',
  complete_profile: 'profile',
  view_roster: 'roster',
  create_lineup: 'gameprep',
  plan_practice: 'schedule',
  game_prep: 'gameprep',
  track_stats: 'gameprep',
  complete_registration: 'parent-register',
  sign_waivers: 'parent-register',
  make_payment: 'payments',
  view_player_card: 'dashboard',
  add_player_photo: 'dashboard',
  view_schedule: 'schedule',
  first_rsvp: 'schedule',
  join_team_chat: 'chats',
  volunteer: 'dashboard',
}

const TIME_ESTIMATES = {
  create_org: '~1 min',
  create_season: '~3 min',
  add_teams: '~2 min',
  add_coaches: '~2 min',
  register_players: '~5 min',
  create_schedule: '~5 min',
  first_game: '~10 min',
}

export default function SetupHelper({ onNavigate, onPanelToggle }) {
  const [isOpen, setIsOpen] = useState(false)

  // Notify parent when panel open/close state changes
  const togglePanel = (open) => {
    setIsOpen(open)
    onPanelToggle?.(open)
  }
  const journey = useJourney()
  const { profile } = useAuth()
  const { isDark } = useTheme()

  if (!journey || !profile) return null

  const role = journey.journeyData?.currentRole || profile?.onboarding_data?.role || 'org_director'
  const steps = JOURNEY_STEPS[role] || []
  const completedSteps = journey.journeyData?.completedSteps || profile?.onboarding_data?.completed_steps || []
  const remaining = steps.filter(s => !completedSteps.includes(s.id))

  // Hide when all done
  if (remaining.length === 0) return null

  const totalSteps = steps.length
  const doneCount = completedSteps.length
  const pct = Math.round((doneCount / totalSteps) * 100)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => togglePanel(true)}
        className="fixed z-40 flex items-center justify-center group"
        style={{ bottom: 96, right: 24, width: 52, height: 52 }}
        title={remaining.length > 0
          ? `${remaining.length} setup step${remaining.length === 1 ? '' : 's'} remaining — click to see your roadmap`
          : 'All set! Your club is ready.'}
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-white shadow-lg border-2 border-sky-300 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
            <img src="/images/Meet-Lynx.png" alt="" className="w-10 h-10 object-contain" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-sky-400 animate-ping opacity-30" />
          {/* Badge count */}
          {remaining.length > 0 && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
              title={`${remaining.length} step${remaining.length === 1 ? '' : 's'} to go`}
            >
              {remaining.length}
            </div>
          )}
        </div>
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => togglePanel(false)}
          />
          {/* Panel */}
          <div
            className={`fixed top-0 right-0 z-50 h-full w-[360px] max-w-[90vw] shadow-2xl flex flex-col ${
              isDark ? 'bg-lynx-navy' : 'bg-white'
            }`}
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="bg-lynx-navy-h px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-white font-bold text-base">Your Setup Checklist</h3>
                <p className="text-slate-400 text-xs mt-0.5">{doneCount} of {totalSteps} complete</p>
              </div>
              <button
                onClick={() => togglePanel(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-3 pb-2 shrink-0">
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Steps list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {steps.map((step) => {
                const isDone = completedSteps.includes(step.id)
                const route = STEP_ROUTES[step.id]
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      isDone
                        ? isDark ? 'bg-teal-500/10' : 'bg-emerald-50'
                        : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDone ? 'line-through opacity-50' : ''} ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {step.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {step.description}
                      </p>
                    </div>
                    {!isDone && route && (
                      <button
                        onClick={() => {
                          togglePanel(false)
                          onNavigate?.(STEP_ROUTES[step.id])
                        }}
                        className="text-xs font-bold text-sky-500 hover:text-sky-400 whitespace-nowrap flex items-center gap-1"
                      >
                        Go <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    {!isDone && TIME_ESTIMATES[step.id] && (
                      <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'} whitespace-nowrap`}>
                        {TIME_ESTIMATES[step.id]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer mascot */}
            <div className={`px-5 py-4 text-center border-t shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <img src="/images/Meet-Lynx.png" alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {remaining.length === 1 ? 'Almost there! One more step.' : `${remaining.length} steps to go — you've got this!`}
              </p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
