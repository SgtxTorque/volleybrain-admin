// =============================================================================
// CoachStatMiniCards — 2x2 grid: Roster, RSVP'd, Due Evals, Stats to enter
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, UserCheck, Target, BarChart3 } from 'lucide-react'

function MiniCard({ icon: Icon, label, value, color, isDark }) {
  return (
    <div className={`rounded-xl p-3 flex items-center gap-3 ${
      isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-slate-50 border border-brand-border'
    }`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className={`text-lg font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      </div>
    </div>
  )
}

export default function CoachStatMiniCards({ rosterCount = 0, rsvpCount = 0, dueEvals = 0, pendingStats = 0 }) {
  const { isDark } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-2">
      <MiniCard icon={Users} label="Roster" value={rosterCount} color="#4BB9EC" isDark={isDark} />
      <MiniCard icon={UserCheck} label="RSVP'd Today" value={rsvpCount} color="#22C55E" isDark={isDark} />
      <MiniCard icon={Target} label="Due Evaluations" value={dueEvals} color="#F59E0B" isDark={isDark} />
      <MiniCard icon={BarChart3} label="Stats to Enter" value={pendingStats} color="#8B5CF6" isDark={isDark} />
    </div>
  )
}
