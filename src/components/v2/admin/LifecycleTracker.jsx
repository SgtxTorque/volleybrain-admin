// =============================================================================
// LifecycleTracker — Season Setup checklist tab for ProgramPage
// Data-driven: ALL completion checks use props from ProgramPage state.
// Zero internal Supabase queries.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'
import { Check, Lock, ChevronRight } from 'lucide-react'

// ---------- Step definitions ----------
const ADMIN_STEPS = [
  {
    id: 'create_season',
    title: 'Create your season',
    description: 'Set dates, name, and sport for this season.',
    completionCheck: () => true, // Always done — we're on the season's program page
    ctaLabel: null,
    navigateTo: null,
  },
  {
    id: 'create_teams',
    title: 'Create your teams',
    description: 'Add at least one team with age group and roster size.',
    completionCheck: (d) => d.teamsCount > 0,
    ctaLabel: 'Create Team',
    navigateTo: '/teams',
  },
  {
    id: 'assign_coaches',
    title: 'Assign coaches to teams',
    description: 'Give each team a head coach so they can see their roster.',
    completionCheck: (d) => d.coachesAssignedCount > 0,
    ctaLabel: 'Go to Staff Portal',
    navigateTo: '/coaches',
    milestone: 'Key step',
    blockedUntil: 'create_teams',
    blockedMessage: 'Create at least one team first',
  },
  {
    id: 'open_registration',
    title: 'Open registration & share link',
    description: 'Share your registration link with families via email, QR code, or social.',
    completionCheck: (d) => d.registrationsCount > 0 || d.playersCount > 0,
    ctaLabel: 'Share Registration',
    navigateTo: null,
    action: 'openRegLink',
    milestone: 'Go live!',
  },
  {
    id: 'build_schedule',
    title: 'Build the schedule',
    description: 'Add practices and games so everyone knows when to show up.',
    completionCheck: (d) => d.eventsCount > 0,
    ctaLabel: 'Add Events',
    navigateTo: '/schedule',
  },
  {
    id: 'process_registrations',
    title: 'Process registrations',
    description: 'Review and approve incoming registrations. Assign players to teams.',
    completionCheck: (d) => d.approvedRegsCount > 0,
    ctaLabel: 'Review Registrations',
    navigateTo: '/registrations',
    blockedUntil: 'open_registration',
    blockedMessage: 'Share your registration link first',
  },
  {
    id: 'send_announcement',
    title: 'Send your first announcement',
    description: 'Welcome families to the season — let them know you\'re ready!',
    completionCheck: (d) => d.playersCount > 0 && d.eventsCount > 0 && d.approvedRegsCount > 0,
    ctaLabel: 'Send Announcement',
    navigateTo: '/blasts',
    milestone: 'Launch!',
  },
]

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
      <span>🏅</span> {label}
    </span>
  )
}

// ---------- Main component ----------
export default function LifecycleTracker({
  seasonName,
  seasonId,
  programId,
  teamsCount = 0,
  coachesAssignedCount = 0,
  playersCount = 0,
  eventsCount = 0,
  registrationsCount = 0,
  approvedRegsCount = 0,
  paymentsCollected = 0,
  paymentsExpected = 0,
  showToast,
  navigate,
  onOpenRegLink,
}) {
  const { isDark } = useTheme()
  const prevCompleted = useRef(new Set())
  const [showCelebration, setShowCelebration] = useState(false)

  // Compute step completion from props
  const data = {
    teamsCount,
    coachesAssignedCount,
    playersCount,
    eventsCount,
    registrationsCount,
    approvedRegsCount,
    paymentsCollected,
    paymentsExpected,
  }

  const steps = ADMIN_STEPS.map(step => {
    const done = step.completionCheck(data)
    const blockedBy = step.blockedUntil
      ? ADMIN_STEPS.find(s => s.id === step.blockedUntil)
      : null
    const blocked = blockedBy ? !blockedBy.completionCheck(data) : false
    return { ...step, done, blocked }
  })

  const completedCount = steps.filter(s => s.done).length
  const totalCount = steps.length
  const allDone = completedCount === totalCount
  const currentStep = steps.find(s => !s.done && !s.blocked) || null
  const pct = Math.round((completedCount / totalCount) * 100)

  // Gradient for progress bar
  const barGradient = allDone
    ? 'linear-gradient(90deg, #10B981, #22C55E)'
    : 'linear-gradient(90deg, #4BB9EC, #10B981)'

  // Toast on step completion
  useEffect(() => {
    const currentCompleted = new Set(steps.filter(s => s.done).map(s => s.id))

    // Skip on initial mount
    if (prevCompleted.current.size > 0) {
      const newlyCompleted = [...currentCompleted].filter(id => !prevCompleted.current.has(id))
      if (newlyCompleted.length > 0) {
        const step = ADMIN_STEPS.find(s => s.id === newlyCompleted[0])
        if (step) {
          showToast?.(`\u2705 ${step.title} — done!`, 'success')
        }
      }
      // Trigger celebration when all done
      if (currentCompleted.size === totalCount && prevCompleted.current.size < totalCount) {
        setShowCelebration(true)
      }
    }

    prevCompleted.current = currentCompleted
  }, [completedCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // CTA click handler
  const handleCTA = (step) => {
    if (step.action === 'openRegLink') {
      onOpenRegLink?.()
      return
    }
    if (step.navigateTo && navigate) {
      const params = new URLSearchParams({
        from: 'tracker',
        returnTo: `/programs/${programId}`,
        season: seasonName || '',
        step: String(steps.indexOf(step) + 1),
        total: String(totalCount),
      })
      navigate(`${step.navigateTo}?${params.toString()}`)
    }
  }

  // Card/text colors
  const cardBg = isDark ? 'bg-[#132240]/80 border border-white/[0.06]' : 'bg-white border border-slate-200'
  const textPrimary = isDark ? 'text-white' : 'text-[#10284C]'
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="space-y-0">
      {/* ─── Hero Header ─── */}
      <div
        className="rounded-t-[14px] px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #10284C 0%, #1a3a5c 100%)' }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: mascot + title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#4BB9EC]/15 flex items-center justify-center text-xl shrink-0">
              🐾
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-extrabold text-base leading-tight truncate">
                Setting up <span className="text-[#4BB9EC]">{seasonName || 'your season'}</span>
              </h3>
              <p className="text-white/50 text-xs mt-0.5">
                {allDone ? 'All set — you\'re game-ready!' : `${completedCount} of ${totalCount} steps complete`}
              </p>
            </div>
          </div>

          {/* Right: progress bar */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-32 h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: barGradient }}
              />
            </div>
            <span className="text-white font-bold text-sm tabular-nums w-10 text-right">
              {pct}%
            </span>
          </div>
        </div>
      </div>

      {/* ─── Celebration Overlay ─── */}
      {allDone && showCelebration && (
        <div
          className="rounded-b-[14px] px-6 py-10 text-center"
          style={{ background: 'linear-gradient(135deg, #10284C 0%, #1a3a5c 100%)' }}
        >
          <div className="text-5xl mb-3">🏆</div>
          <h3 className="text-white font-extrabold text-xl mb-2">
            {seasonName || 'Your season'} is game-ready!
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Every step is complete. Your families and coaches have what they need.
          </p>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#4BB9EC]/20 text-[#4BB9EC] text-sm font-bold">
            +500 XP earned
          </span>
          <div className="mt-4">
            <button
              onClick={() => setShowCelebration(false)}
              className="text-white/40 text-xs hover:text-white/70 transition-colors"
            >
              View completed steps
            </button>
          </div>
        </div>
      )}

      {/* ─── Steps List ─── */}
      {(!allDone || !showCelebration) && (
        <div className={`rounded-b-[14px] divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'} ${cardBg}`}>
          {steps.map((step, i) => {
            const isCurrent = currentStep?.id === step.id
            const isBlocked = step.blocked

            return (
              <div
                key={step.id}
                className={`px-5 py-4 flex items-start gap-4 transition-colors ${
                  isCurrent
                    ? isDark ? 'bg-[#4BB9EC]/[0.06] border-l-[3px] border-l-[#4BB9EC]' : 'bg-[#e8f6fd] border-l-[3px] border-l-[#4BB9EC]'
                    : 'border-l-[3px] border-l-transparent'
                } ${isBlocked ? 'opacity-50' : ''}`}
              >
                {/* Number circle */}
                <div className="shrink-0 mt-0.5">
                  {step.done ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  ) : isBlocked ? (
                    <div className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center ${isDark ? 'border-amber-500/40' : 'border-amber-400/50'}`}>
                      <Lock className="w-3 h-3 text-amber-500/60" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-full bg-[#4BB9EC] flex items-center justify-center shadow-[0_0_10px_rgba(75,185,236,0.35)]">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                  ) : (
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isDark ? 'border-white/15' : 'border-slate-200'}`}>
                      <span className={`text-xs font-bold ${isDark ? 'text-white/30' : 'text-slate-300'}`}>{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-bold leading-tight ${
                      step.done
                        ? isDark ? 'text-white/40 line-through' : 'text-slate-400 line-through'
                        : isCurrent ? textPrimary : textMuted
                    }`}>
                      {step.title}
                    </h4>
                    {step.milestone && !step.done && <MilestoneBadge label={step.milestone} />}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    isBlocked ? 'text-amber-500/70' : step.done ? (isDark ? 'text-white/20' : 'text-slate-300') : textMuted
                  }`}>
                    {isBlocked ? step.blockedMessage : step.description}
                  </p>
                </div>

                {/* CTA / Status */}
                <div className="shrink-0 mt-0.5">
                  {step.done ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                      <Check className="w-3 h-3" strokeWidth={3} /> Done
                    </span>
                  ) : isCurrent && step.ctaLabel ? (
                    <button
                      onClick={() => handleCTA(step)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4BB9EC] text-white text-xs font-bold hover:brightness-110 transition shadow-sm"
                    >
                      {step.ctaLabel} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : !isBlocked && step.ctaLabel ? (
                    <button
                      onClick={() => handleCTA(step)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isDark
                          ? 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/70'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                      }`}
                    >
                      {step.ctaLabel} <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
