// =============================================================================
// GameDayJourneyCard — Numbered step tracker for game day workflow
// Steps derived from GameDayCommandCenter phases: RSVPs → Lineup → Attendance →
// Scoring → Stats → Report
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight } from 'lucide-react'

const STEPS = [
  { id: 'rsvps', label: 'RSVPs', num: 1 },
  { id: 'lineup', label: 'Lineup', num: 2 },
  { id: 'attendance', label: 'Attendance', num: 3 },
  { id: 'scoring', label: 'Scoring', num: 4 },
  { id: 'stats', label: 'Stats', num: 5 },
  { id: 'report', label: 'Report', num: 6 },
]

export default function GameDayJourneyCard({ activeStep = 0, onStepClick, onNavigate }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Game Day Journey
          </h3>
          <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Pre-game to post-game workflow
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('gameprep')}
          className="flex items-center gap-1 text-xs font-semibold text-lynx-sky hover:brightness-110 transition"
        >
          Open Game Day <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Step tracker */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeStep
          const isCurrent = idx === activeStep
          const isUpcoming = idx > activeStep

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <button
                onClick={() => onStepClick?.(idx)}
                className="flex flex-col items-center gap-1.5 group/step"
                title={step.label}
              >
                <div className={`
                  w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold
                  transition-colors cursor-pointer
                  ${isCompleted
                    ? 'bg-lynx-sky/15 border-lynx-sky text-lynx-sky'
                    : isCurrent
                      ? 'bg-lynx-sky border-lynx-sky text-white'
                      : 'border-slate-300 text-slate-400'
                  }
                  ${isUpcoming ? '' : 'group-hover/step:brightness-110'}
                `}>
                  {step.num}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${
                  isCompleted || isCurrent
                    ? (isDark ? 'text-slate-300' : 'text-slate-600')
                    : (isDark ? 'text-slate-600' : 'text-slate-400')
                }`}>
                  {step.label}
                </span>
              </button>

              {/* Connecting line (except after last step) */}
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1.5 mt-[-18px] ${
                  idx < activeStep ? 'bg-lynx-sky' : (isDark ? 'bg-white/[0.08]' : 'bg-slate-200')
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
