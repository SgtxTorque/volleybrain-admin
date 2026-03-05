// =============================================================================
// OrgKpiRow — 4 stat cards: Players, Families, Coaches, Teams
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, UserCheck, Shield, BarChart3 } from 'lucide-react'

function KpiCard({ icon: Icon, label, value, sub, iconColor, isDark }) {
  return (
    <div className={`rounded-xl p-3 ${
      isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-slate-100'
    }`}>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        </div>
      </div>
      {sub && (
        <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>
      )}
    </div>
  )
}

export default function OrgKpiRow({ stats = {} }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full`}>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          KPI Stats
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <KpiCard
          icon={Users}
          label="Players"
          value={stats.totalRegistrations || 0}
          sub={stats.rosteredPlayers ? `${stats.rosteredPlayers} rostered` : null}
          iconColor="#4BB9EC"
          isDark={isDark}
        />
        <KpiCard
          icon={Users}
          label="Families"
          value={Math.ceil((stats.totalRegistrations || 0) * 0.7)}
          iconColor="#8B5CF6"
          isDark={isDark}
        />
        <KpiCard
          icon={UserCheck}
          label="Coaches"
          value={stats.coachCount || 0}
          sub={stats.teamsWithCoach ? `${stats.teamsWithCoach} covered` : null}
          iconColor="#22C55E"
          isDark={isDark}
        />
        <KpiCard
          icon={Shield}
          label="Teams"
          value={stats.teams || 0}
          sub={stats.openSpots ? `${stats.openSpots} open spots` : null}
          iconColor="#F59E0B"
          isDark={isDark}
        />
      </div>
    </div>
  )
}
