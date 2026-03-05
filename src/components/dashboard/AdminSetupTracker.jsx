// =============================================================================
// AdminSetupTracker — Conditional setup wizard. Returns null when all done.
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Settings } from 'lucide-react'

const SETUP_STEPS = [
  { id: 'org-profile',   label: 'Create organization profile', time: '5 min' },
  { id: 'first-season',  label: 'Set up first season',         time: '5 min' },
  { id: 'open-reg',      label: 'Open registration',           time: '10 min' },
  { id: 'first-team',    label: 'Add first team',              time: '3 min' },
  { id: 'first-coach',   label: 'Assign first coach',          time: '3 min' },
  { id: 'first-event',   label: 'Create first schedule event', time: '5 min' },
]

export default function AdminSetupTracker({
  hasOrgProfile = false,
  hasSeason = false,
  hasRegistration = false,
  hasTeam = false,
  hasCoach = false,
  hasEvent = false,
}) {
  const { isDark } = useTheme()

  const completion = {
    'org-profile':  hasOrgProfile,
    'first-season': hasSeason,
    'open-reg':     hasRegistration,
    'first-team':   hasTeam,
    'first-coach':  hasCoach,
    'first-event':  hasEvent,
  }

  const completedCount = SETUP_STEPS.filter(s => completion[s.id]).length
  const totalSteps = SETUP_STEPS.length

  // All done → don't render at all
  if (completedCount >= totalSteps) return null

  const pct = Math.round((completedCount / totalSteps) * 100)
  const nextStep = SETUP_STEPS.find(s => !completion[s.id])

  return (
    <div className={`rounded-2xl p-3 h-full ${
      isDark
        ? 'bg-lynx-charcoal border border-white/[0.06]'
        : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <Settings className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Setup Tracker
        </h3>
        <span className={`ml-auto text-xs font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {completedCount}/{totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className={`h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
        <div
          className="h-full rounded-full bg-lynx-sky transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Next step */}
      {nextStep && (
        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Next: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{nextStep.label}</span>
        </p>
      )}
    </div>
  )
}
