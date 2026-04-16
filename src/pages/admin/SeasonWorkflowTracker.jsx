// =============================================================================
// SeasonWorkflowTracker — Horizontal stepped progress bar for season lifecycle
// Shows 10 steps with completion status, clickable to jump to step content.
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Check } from 'lucide-react'

// The 10 season lifecycle steps
export const WORKFLOW_STEPS = [
  { id: 'create', label: 'Create Season', shortLabel: 'Create' },
  { id: 'registration', label: 'Open Registration', shortLabel: 'Registration' },
  { id: 'manage-regs', label: 'Manage Registrations', shortLabel: 'Manage' },
  { id: 'payments', label: 'Collect Payments', shortLabel: 'Payments' },
  { id: 'assign-teams', label: 'Assign Players to Teams', shortLabel: 'Teams' },
  { id: 'assign-coaches', label: 'Assign Coaches', shortLabel: 'Coaches' },
  { id: 'positions', label: 'Set Positions', shortLabel: 'Positions' },
  { id: 'schedule', label: 'Create Schedule', shortLabel: 'Schedule' },
  { id: 'uniforms', label: 'Uniforms / Jerseys', shortLabel: 'Uniforms' },
  { id: 'verify', label: 'Verify & Launch', shortLabel: 'Launch' },
]

export default function SeasonWorkflowTracker({ stepCompletion = {}, activeStep, onStepClick }) {
  const { isDark } = useTheme()

  // Overall progress
  const completedSteps = WORKFLOW_STEPS.filter(s => (stepCompletion[s.id] || 0) >= 100).length
  const overallPct = Math.round((completedSteps / WORKFLOW_STEPS.length) * 100)

  // Find current step (first incomplete)
  const currentStepIdx = WORKFLOW_STEPS.findIndex(s => (stepCompletion[s.id] || 0) < 100)
  const activeIdx = activeStep ? WORKFLOW_STEPS.findIndex(s => s.id === activeStep) : currentStepIdx

  return (
    <div className={`rounded-2xl p-6 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
      {/* Overall progress bar */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full bg-lynx-sky transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <span className={`text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {overallPct}%
        </span>
      </div>

      {/* Current step hint */}
      {currentStepIdx >= 0 && currentStepIdx < WORKFLOW_STEPS.length && (
        <p className={`text-lg mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Next: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{WORKFLOW_STEPS[currentStepIdx].label}</span>
        </p>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {WORKFLOW_STEPS.map((step, idx) => {
          const pct = stepCompletion[step.id] || 0
          const isComplete = pct >= 100
          const isActive = idx === activeIdx
          const isFuture = idx > currentStepIdx && !isComplete

          return (
            <div key={step.id} className="flex-1 flex flex-col items-center gap-2">
              {/* Connector + Circle */}
              <div className="flex items-center w-full">
                {idx > 0 && (
                  <div className={`flex-1 h-0.5 ${
                    isComplete || idx <= currentStepIdx
                      ? 'bg-lynx-sky'
                      : isDark ? 'bg-white/[0.08]' : 'bg-slate-200'
                  }`} />
                )}
                <button
                  onClick={() => onStepClick?.(step.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-all ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-lynx-sky text-white shadow-[0_0_12px_rgba(75,185,236,0.4)]'
                        : isFuture
                          ? isDark ? 'border-2 border-white/10 text-slate-600' : 'border-2 border-slate-200 text-slate-400'
                          : isDark ? 'bg-white/[0.08] text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : idx + 1}
                </button>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    isComplete
                      ? 'bg-lynx-sky'
                      : isDark ? 'bg-white/[0.08]' : 'bg-slate-200'
                  }`} />
                )}
              </div>

              {/* Label */}
              <span className={`text-xs font-medium text-center leading-tight ${
                isComplete || isActive
                  ? isDark ? 'text-white' : 'text-slate-900'
                  : isDark ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {step.shortLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
