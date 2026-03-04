// =============================================================================
// OrgKpiRow — 4 stat cards: Players, Families, Coaches, Teams
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, UserCheck, Shield } from 'lucide-react'

function KpiCard({ icon: Icon, label, value, sub, iconColor, isDark }) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm ${
      isDark
        ? 'bg-lynx-charcoal border border-white/[0.06]'
        : 'bg-white border border-brand-border'
    }`}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-4xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        </div>
      </div>
      {sub && (
        <p className={`text-[10px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>
      )}
    </div>
  )
}

export default function OrgKpiRow({ stats = {}, isDark: _isDark }) {
  const { isDark } = useTheme()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        sub={stats.teamsWithCoach ? `${stats.teamsWithCoach} teams covered` : null}
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
  )
}
