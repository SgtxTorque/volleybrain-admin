// =============================================================================
// CoachLifecycleTracker — Getting-started card for CoachDashboard
// Data-driven: ALL completion checks use props from CoachDashboard state.
// View steps (roster, schedule) tracked via localStorage per team.
// Zero internal Supabase queries.
// =============================================================================

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
import { Check, Lock, ChevronRight, X } from 'lucide-react'

// ---------- Step definitions ----------
const COACH_STEPS = [
  {
    id: 'review_roster',
    title: 'Review your roster',
    getDescription: (d) => d.rosterCount > 0
      ? `${d.rosterCount} player${d.rosterCount !== 1 ? 's' : ''} waiting to meet you.`
      : 'Check who\'s on your team.',
    completionCheck: (d) => d.rosterViewed,
    ctaLabel: 'View Roster',
    tabTarget: 'roster',
  },
  {
    id: 'check_schedule',
    title: 'Check the schedule',
    getDescription: (d) => d.eventsCount > 0
      ? `${d.eventsCount} upcoming event${d.eventsCount !== 1 ? 's' : ''} this season. Take a look.`
      : 'See what\'s coming up for your team.',
    completionCheck: (d) => d.scheduleViewed,
    ctaLabel: 'View Schedule',
    tabTarget: 'schedule',
  },
  {
    id: 'set_lineup',
    title: 'Set your lineup',
    description: 'Build a starting lineup for your next game.',
    completionCheck: (d) => d.lineupSet,
    ctaLabel: 'Build Lineup',
    tabTarget: 'gameprep',
  },
  {
    id: 'take_attendance',
    title: 'Take attendance at your first event',
    description: 'One tap per player. Families get notified automatically.',
    completionCheck: (d) => d.attendanceTaken,
    ctaLabel: 'Take Attendance',
    tabTarget: 'roster',
    blockedUntil: 'check_schedule',
    blockedMessage: 'Unlocks at your next scheduled event',
  },
  {
    id: 'send_shoutout',
    title: 'Send your first shoutout',
    description: 'Recognize a player\'s effort — they earn XP and a badge!',
    completionCheck: (d) => d.shoutoutsSent > 0,
    ctaLabel: 'Give Shoutout',
    action: 'openShoutout',
    milestone: 'First shoutout!',
  },
]

// ---------- localStorage helpers ----------
function getTrackerKey(teamId) {
  return `lynx-coach-tracker-${teamId}`
}

function getTrackerState(teamId) {
  try {
    const raw = localStorage.getItem(getTrackerKey(teamId))
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function setTrackerState(teamId, state) {
  try {
    localStorage.setItem(getTrackerKey(teamId), JSON.stringify(state))
  } catch { /* ignore */ }
}

function isDismissed(teamId) {
  try {
    return localStorage.getItem(`lynx-coach-tracker-dismissed-${teamId}`) === 'true'
  } catch { return false }
}

function setDismissed(teamId) {
  try {
    localStorage.setItem(`lynx-coach-tracker-dismissed-${teamId}`, 'true')
  } catch { /* ignore */ }
}

// ---------- Milestone badge ----------
function MilestoneBadge({ label }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        background: 'rgba(255,215,0,0.12)',
        color: '#D97706',
        border: '1px solid rgba(255,215,0,0.25)',
      }}
    >
      <span>🌟</span> {label}
    </span>
  )
}

// ---------- Main component ----------
export default function CoachLifecycleTracker({
  coachName = 'Coach',
  teamName = '',
  teamId = '',
  rosterCount = 0,
  eventsCount = 0,
  lineupSet = false,
  attendanceTaken = false,
  shoutoutsSent = 0,
  showToast,
  onSwitchTab,
  onOpenShoutout,
}) {
  const { isDark } = useTheme()
  const prevCompleted = useRef(new Set())
  const [localState, setLocalState] = useState(() => getTrackerState(teamId))
  const [dismissed, setDismissedState] = useState(() => isDismissed(teamId))

  // Sync localStorage state when team changes
  useEffect(() => {
    setLocalState(getTrackerState(teamId))
    setDismissedState(isDismissed(teamId))
  }, [teamId])

  // Build data object for completion checks
  const data = {
    rosterCount,
    eventsCount,
    lineupSet,
    attendanceTaken,
    shoutoutsSent,
    rosterViewed: localState.rosterViewed || false,
    scheduleViewed: localState.scheduleViewed || false,
  }

  // Compute step states
  const steps = COACH_STEPS.map(step => {
    const done = step.completionCheck(data)
    const blockedBy = step.blockedUntil
      ? COACH_STEPS.find(s => s.id === step.blockedUntil)
      : null
    const blocked = blockedBy ? !blockedBy.completionCheck(data) : false
    return { ...step, done, blocked }
  })

  const completedCount = steps.filter(s => s.done).length
  const totalCount = steps.length
  const allDone = completedCount === totalCount
  const currentStep = steps.find(s => !s.done && !s.blocked) || null
  const pct = Math.round((completedCount / totalCount) * 100)

  // Toast on step completion
  useEffect(() => {
    const currentCompleted = new Set(steps.filter(s => s.done).map(s => s.id))
    if (prevCompleted.current.size > 0) {
      const newlyCompleted = [...currentCompleted].filter(id => !prevCompleted.current.has(id))
      if (newlyCompleted.length > 0) {
        const step = COACH_STEPS.find(s => s.id === newlyCompleted[0])
        if (step) {
          showToast?.(`\u2705 ${step.title} — done!`, 'success')
        }
      }
    }
    prevCompleted.current = currentCompleted
  }, [completedCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle CTA click
  const handleCTA = (step) => {
    // Mark view steps as completed in localStorage
    if (step.id === 'review_roster') {
      const newState = { ...localState, rosterViewed: true }
      setLocalState(newState)
      setTrackerState(teamId, newState)
    }
    if (step.id === 'check_schedule') {
      const newState = { ...localState, scheduleViewed: true }
      setLocalState(newState)
      setTrackerState(teamId, newState)
    }

    // Switch tab or open modal
    if (step.action === 'openShoutout') {
      onOpenShoutout?.()
      return
    }
    if (step.tabTarget) {
      onSwitchTab?.(step.tabTarget)
    }
  }

  // Handle dismiss
  const handleDismiss = () => {
    setDismissed(teamId)
    setDismissedState(true)
  }

  // Don't render if dismissed or all done
  if (dismissed || allDone) return null

  const barGradient = 'linear-gradient(90deg, #4BB9EC, #10B981)'
  const textPrimary = isDark ? 'text-white' : 'text-[#10284C]'
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="space-y-0">
      {/* ─── Hero Header ─── */}
      <div
        className="rounded-t-[14px] px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #10284C 0%, #1a3a5c 100%)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#4BB9EC]/15 flex items-center justify-center text-lg shrink-0">
              🐾
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-extrabold text-sm leading-tight truncate">
                Welcome to the team, <span className="text-[#4BB9EC]">Coach {coachName}!</span>
              </h3>
              <p className="text-white/50 text-xs mt-0.5">
                {teamName ? `${teamName} — ` : ''}{completedCount} of {totalCount} steps complete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Progress bar */}
            <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: barGradient }}
              />
            </div>
            <span className="text-white font-bold text-xs tabular-nums">
              {pct}%
            </span>
            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="text-white/30 hover:text-white/70 transition-colors"
              title="I know what I'm doing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Steps List ─── */}
      <div className={`rounded-b-[14px] divide-y ${isDark ? 'divide-white/[0.06] bg-[#132240]/80 border border-white/[0.06] border-t-0' : 'divide-slate-100 bg-white border border-slate-200 border-t-0'}`}>
        {steps.map((step, i) => {
          const isCurrent = currentStep?.id === step.id
          const isBlocked = step.blocked

          return (
            <div
              key={step.id}
              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                isCurrent
                  ? isDark ? 'bg-[#4BB9EC]/[0.06] border-l-[3px] border-l-[#4BB9EC]' : 'bg-[#e8f6fd] border-l-[3px] border-l-[#4BB9EC]'
                  : 'border-l-[3px] border-l-transparent'
              } ${isBlocked ? 'opacity-50' : ''}`}
            >
              {/* Circle */}
              <div className="shrink-0">
                {step.done ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                ) : isBlocked ? (
                  <div className={`w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center ${isDark ? 'border-amber-500/40' : 'border-amber-400/50'}`}>
                    <Lock className="w-2.5 h-2.5 text-amber-500/60" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-[#4BB9EC] flex items-center justify-center shadow-[0_0_8px_rgba(75,185,236,0.35)]">
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                ) : (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isDark ? 'border-white/15' : 'border-slate-200'}`}>
                    <span className={`text-[10px] font-bold ${isDark ? 'text-white/30' : 'text-slate-300'}`}>{i + 1}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-xs font-bold leading-tight ${
                    step.done
                      ? isDark ? 'text-white/40 line-through' : 'text-slate-400 line-through'
                      : isCurrent ? textPrimary : textMuted
                  }`}>
                    {step.title}
                  </h4>
                  {step.milestone && !step.done && <MilestoneBadge label={step.milestone} />}
                </div>
                <p className={`text-[11px] mt-0.5 ${
                  isBlocked ? 'text-amber-500/70' : step.done ? (isDark ? 'text-white/20' : 'text-slate-300') : textMuted
                }`}>
                  {isBlocked ? step.blockedMessage : (step.getDescription ? step.getDescription(data) : step.description)}
                </p>
              </div>

              {/* CTA */}
              <div className="shrink-0">
                {step.done ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} /> Done
                  </span>
                ) : isCurrent && step.ctaLabel ? (
                  <button
                    onClick={() => handleCTA(step)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4BB9EC] text-white text-[11px] font-bold hover:brightness-110 transition shadow-sm"
                  >
                    {step.ctaLabel} <ChevronRight className="w-3 h-3" />
                  </button>
                ) : !isBlocked && step.ctaLabel ? (
                  <button
                    onClick={() => handleCTA(step)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                      isDark
                        ? 'bg-white/[0.06] text-white/50 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {step.ctaLabel} <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
