// =============================================================================
// RegistrationsStatRow — 4 stat cards for registration overview
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ClipboardList, Clock, FileCheck, UserCheck } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`relative overflow-hidden rounded-xl px-4 py-3 border ${
      isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'
    }`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className={`w-5 h-5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-300'}`} style={{ color: iconColor }} />
        )}
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black tracking-tighter ${valueColor || (isDark ? 'text-white' : 'text-[#10284C]')}`}>{value}</span>
            {sub && <span className={`text-[10px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</span>}
            {pill && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationsStatRow({ statusCounts = {}, waiverStats = {}, returningCount = 0, newCount = 0 }) {
  const pendingPill = statusCounts.pending > 0
    ? { label: 'Needs review', className: 'bg-amber-500/12 text-amber-500' }
    : null

  const waiverPct = waiverStats.total > 0 ? Math.round((waiverStats.signed / waiverStats.total) * 100) : 0
  const waiverColor = waiverPct >= 80 ? 'text-emerald-500' : waiverPct >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={ClipboardList}
        label="Total Registered"
        value={statusCounts.all || 0}
        sub="This season"
        iconColor="#4BB9EC"
      />
      <StatCard
        icon={Clock}
        label="Pending Approval"
        value={statusCounts.pending || 0}
        valueColor={statusCounts.pending > 0 ? 'text-amber-500' : undefined}
        pill={pendingPill}
        iconColor="#F59E0B"
      />
      <StatCard
        icon={FileCheck}
        label="Waivers Signed"
        value={waiverStats.signed || 0}
        sub={waiverStats.total > 0 ? `${waiverPct}% complete` : null}
        valueColor={waiverColor}
        iconColor="#22C55E"
      />
      <StatCard
        icon={UserCheck}
        label="Returning Players"
        value={returningCount}
        sub={newCount > 0 ? `${newCount} new this season` : null}
        iconColor="#8B5CF6"
      />
    </div>
  )
}
