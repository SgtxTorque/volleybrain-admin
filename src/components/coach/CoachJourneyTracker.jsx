// =============================================================================
// CoachJourneyTracker — Single-sport journey tracker for coach dashboard
// Same pattern as SeasonJourneyRow but scoped to coach's team/sport
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Check, ChevronRight, Circle } from 'lucide-react'

const STEPS = [
  { id: 'profile', label: 'Profile' },
  { id: 'roster', label: 'Roster' },
  { id: 'lineup', label: 'Lineup' },
  { id: 'practice', label: 'Practice' },
  { id: 'gameday', label: 'Game Day' },
  { id: 'stats', label: 'Stats' },
]

function getActiveStep(rosterSize, hasPractice) {
  if (rosterSize === 0) return 1
  if (!hasPractice) return 3
  return 4
}

export default function CoachJourneyTracker({ rosterSize = 0, hasPractice = false, selectedSeason, onNavigate }) {
  const { isDark } = useTheme()
  const activeIdx = getActiveStep(rosterSize, hasPractice)
  const progressPct = Math.round(((activeIdx + 1) / STEPS.length) * 100)
  const sportColor = '#4BB9EC'

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl overflow-hidden shadow-sm`}>
      <div className="h-1" style={{ backgroundColor: sportColor }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Season Journey</p>
            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedSeason?.name || 'Current Season'}</p>
          </div>
          <span className="text-lg font-black tabular-nums" style={{ color: sportColor }}>{progressPct}%</span>
        </div>

        <div className={`h-1.5 rounded-full overflow-hidden mb-3 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: sportColor }} />
        </div>

        <div className="flex items-center justify-between mb-3">
          {STEPS.map((step, idx) => {
            const isDone = idx < activeIdx
            const isActive = idx === activeIdx
            return (
              <div key={step.id} className="flex flex-col items-center gap-1">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: sportColor }}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center bg-[#0B1628]" style={{ borderColor: sportColor, boxShadow: `0 0 8px ${sportColor}40` }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sportColor }} />
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
                )}
                <span className={`text-[8px] font-medium ${isDone || isActive ? (isDark ? 'text-slate-300' : 'text-slate-600') : (isDark ? 'text-slate-600' : 'text-slate-300')}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => onNavigate?.('seasons')}
          className="flex items-center gap-1 text-xs font-semibold ml-auto"
          style={{ color: sportColor }}
        >
          Continue <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
