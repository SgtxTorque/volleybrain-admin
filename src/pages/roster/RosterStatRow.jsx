// =============================================================================
// RosterStatRow — 4 stat cards for coach roster overview
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, FileCheck, CalendarCheck, ClipboardList } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-[14px] p-5 ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[32px] font-extrabold tabular-nums leading-none ${valueColor || (isDark ? 'text-white' : 'text-slate-900')}`}>
            {value}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider mt-1 text-slate-400">
            {label}
          </p>
          {(sub || pill) && (
            <div className="flex items-center gap-2 mt-1.5">
              {sub && <span className="text-xs text-slate-500">{sub}</span>}
              {pill && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RosterStatRow({ rosterHealth = {}, waiverPct = 0, needsEvalCount = 0 }) {
  const waiverColor = waiverPct >= 80 ? 'text-emerald-500' : waiverPct >= 50 ? 'text-amber-500' : 'text-red-500'
  const evalPill = needsEvalCount > 0
    ? { label: 'Due this week', className: 'bg-amber-500/12 text-amber-500' }
    : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Users}
        label="Roster Size"
        value={rosterHealth.total || 0}
        sub={rosterHealth.newPlayers > 0 ? `${rosterHealth.newPlayers} new this season` : null}
        iconColor="#4BB9EC"
      />
      <StatCard
        icon={FileCheck}
        label="Waivers Signed"
        value={Math.max((rosterHealth.total || 0) - (rosterHealth.unsignedWaivers || 0), 0)}
        sub={rosterHealth.total > 0 ? `${waiverPct}% complete` : null}
        valueColor={waiverColor}
        iconColor="#22C55E"
      />
      <StatCard
        icon={CalendarCheck}
        label="Missing Jersey #"
        value={rosterHealth.missingJersey || 0}
        sub={rosterHealth.missingPosition > 0 ? `${rosterHealth.missingPosition} need position` : null}
        valueColor={rosterHealth.missingJersey > 0 ? 'text-amber-500' : undefined}
        iconColor="#F59E0B"
      />
      <StatCard
        icon={ClipboardList}
        label="Need Evaluation"
        value={needsEvalCount}
        pill={evalPill}
        valueColor={needsEvalCount > 0 ? 'text-amber-500' : undefined}
        iconColor="#8B5CF6"
      />
    </div>
  )
}
