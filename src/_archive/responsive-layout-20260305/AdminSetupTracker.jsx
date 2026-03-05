// =============================================================================
// AdminSetupTracker — Conditional setup wizard banner below welcome header
// Shows progress bar + next step hint. Disappears when all steps complete.
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'

const SETUP_STEPS = [
  { id: 'org-profile',   label: 'Create organization profile', time: '5 min' },
  { id: 'first-season',  label: 'Set up first season',         time: '5 min' },
  { id: 'open-reg',      label: 'Open registration',           time: '10 min' },
  { id: 'first-team',    label: 'Add first team',              time: '3 min' },
  { id: 'first-coach',   label: 'Assign first coach',          time: '3 min' },
  { id: 'first-event',   label: 'Create first schedule event', time: '5 min' },
]

/**
 * @param {Object} props
 * @param {boolean} props.hasOrgProfile   - organization record exists with name
 * @param {boolean} props.hasSeason       - at least one season exists
 * @param {boolean} props.hasRegistration - registration template/form exists or season is 'open'
 * @param {boolean} props.hasTeam         - at least one team exists
 * @param {boolean} props.hasCoach        - at least one coach assigned to a team
 * @param {boolean} props.hasEvent        - at least one schedule event exists
 */
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

  // Progressive disclosure: all done → don't render
  if (completedCount >= totalSteps) return null

  const pct = Math.round((completedCount / totalSteps) * 100)
  const nextStep = SETUP_STEPS.find(s => !completion[s.id])

  return (
    <div className={`rounded-2xl px-6 py-4 ${
      isDark
        ? 'bg-lynx-charcoal/60 border border-white/[0.06]'
        : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-center gap-5">
        {/* Progress bar */}
        <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
          <div
            className="h-full rounded-full bg-lynx-sky transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step count */}
        <span className={`text-lg font-bold tabular-nums shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {completedCount}/{totalSteps}
        </span>
      </div>

      {/* Next step hint */}
      {nextStep && (
        <p className={`text-lg mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Next: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{nextStep.label}</span>
          <span className={`ml-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>&middot; ~{nextStep.time}</span>
        </p>
      )}
    </div>
  )
}
