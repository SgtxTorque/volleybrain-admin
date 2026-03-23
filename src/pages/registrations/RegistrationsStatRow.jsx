// =============================================================================
// RegistrationsStatRow — 4 stat cards for registration overview
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ClipboardList, Clock, FileCheck, UserCheck } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, pill, iconColor, valueColor }) {
  const { isDark } = useTheme()

  return (
    <div className={`rounded-[14px] p-5 transition-all duration-200 ${
      isDark ? 'bg-[#132240] border border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border border-[#E8ECF2] hover:shadow-[0_2px_8px_rgba(16,40,76,0.06),0_8px_24px_rgba(16,40,76,0.05)]'
    }`} style={{ fontFamily: 'var(--v2-font)' }}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/[0.06]' : ''}`}
          style={{ backgroundColor: isDark ? undefined : `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-extrabold tabular-nums leading-none ${valueColor || (isDark ? 'text-white' : 'text-[#10284C]')}`}
            style={{ letterSpacing: '-0.03em' }}>
            {value}
          </p>
          <p className={`text-[10.5px] font-bold uppercase tracking-[0.08em] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </p>
          {(sub || pill) && (
            <div className="flex items-center gap-2 mt-1.5">
              {sub && <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{sub}</span>}
              {pill && <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegistrationsStatRow({ statusCounts = {}, waiverStats = {}, returningCount = 0, newCount = 0, compact = false }) {
  const pendingPill = statusCounts.pending > 0
    ? { label: 'Needs review', className: 'bg-amber-500/12 text-amber-500' }
    : null

  const waiverPct = waiverStats.total > 0 ? Math.round((waiverStats.signed / waiverStats.total) * 100) : 0
  const waiverColor = waiverPct >= 80 ? 'text-emerald-500' : waiverPct >= 50 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className={compact ? 'space-y-3' : 'grid grid-cols-2 lg:grid-cols-4 gap-3'}>
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
