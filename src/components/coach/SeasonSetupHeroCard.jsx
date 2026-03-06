// =============================================================================
// SeasonSetupHeroCard — Coach setup task tracker hero card
// =============================================================================

import { Check, ChevronRight } from 'lucide-react'

const COACH_SETUP_TASKS = [
  { id: 'verify-roster', label: 'Verify roster', check: (d) => (d.rosterSize || 0) > 0 },
  { id: 'evaluations', label: 'Complete evaluations', check: () => false },
  { id: 'positions', label: 'Set all positions', check: (d) => d.rosterSize > 0 && d.missingPositions === 0 },
  { id: 'jerseys', label: 'Assign jersey numbers', check: (d) => d.rosterSize > 0 && d.missingJerseys === 0 },
  { id: 'team-chat', label: 'Introduce in team chat', check: () => false },
  { id: 'first-lineup', label: 'Build first lineup', check: (d) => (d.lineupsSet || 0) > 0 },
  { id: 'practice-plan', label: 'Create practice plan', check: () => false },
  { id: 'review-schedule', label: 'Review schedule', check: (d) => (d.eventsCount || 0) > 0 },
]

export default function SeasonSetupHeroCard({ setupData = {}, selectedTeam, onNavigate }) {
  const results = COACH_SETUP_TASKS.map(task => ({
    ...task,
    done: task.check(setupData),
  }))

  const completedCount = results.filter(t => t.done).length
  const totalTasks = results.length
  const pct = Math.round((completedCount / totalTasks) * 100)
  const nextTask = results.find(t => !t.done)

  return (
    <div className="relative rounded-2xl overflow-hidden h-full">
      <img src="/images/laptoplynx.png" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-r from-lynx-navy/95 via-lynx-navy/85 to-lynx-navy/70" />

      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-r-xs font-bold uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-2">
            SEASON SETUP
          </span>

          <p className="text-r-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            {selectedTeam?.name}
          </p>

          <h2 className="text-xl font-black text-white mb-2 leading-tight">
            Get Your Team Ready
          </h2>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-r-sm text-slate-300 font-bold">{completedCount} of {totalTasks} tasks</span>
              <span className="text-r-sm text-slate-400 font-bold">{pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Next task */}
          {nextTask && (
            <p className="text-r-sm text-amber-400 font-semibold mb-3">
              Next: {nextTask.label}
            </p>
          )}

          <button
            onClick={() => onNavigate?.('teams')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 hover:brightness-110 text-white text-r-sm font-bold transition"
          >
            Continue Setup
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact task checklist */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 pt-3 border-t border-white/[0.08]">
          {results.map(task => (
            <div key={task.id} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                task.done ? 'bg-emerald-500/20' : 'bg-white/[0.06]'
              }`}>
                {task.done ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                )}
              </div>
              <span className={`text-[10px] truncate ${task.done ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
