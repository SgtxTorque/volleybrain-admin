// =============================================================================
// TeamReadinessCard — 4 health bars: Attendance, Eligibility, Waivers, RSVP
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Shield } from 'lucide-react'

function ReadinessBar({ label, value, total, isDark }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const color = pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
        <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-700'}`}>{pct}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function TeamReadinessCard({ rosterSize = 0, rsvpCount = 0, attendanceRate = 100, waiversSigned = 0 }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center gap-1.5 mb-3">
        <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Team Readiness
        </h3>
      </div>
      <div className="space-y-3">
        <ReadinessBar label="Attendance" value={attendanceRate} total={100} isDark={isDark} />
        <ReadinessBar label="Eligibility" value={rosterSize} total={rosterSize} isDark={isDark} />
        <ReadinessBar label="Waivers" value={waiversSigned} total={rosterSize} isDark={isDark} />
        <ReadinessBar label="RSVP" value={rsvpCount} total={rosterSize} isDark={isDark} />
      </div>
    </div>
  )
}
