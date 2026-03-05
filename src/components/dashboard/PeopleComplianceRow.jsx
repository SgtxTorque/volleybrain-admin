// =============================================================================
// PeopleComplianceRow — 4 compact role cards fitting within 12×6 grid slot
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, UserCheck, Shield, Building2 } from 'lucide-react'

function ComplianceCard({ icon: Icon, title, items, iconColor, isDark }) {
  return (
    <div className={`rounded-xl p-2.5 ${
      isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-slate-50 border border-slate-100'
    }`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: iconColor }} />
        <h4 className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</span>
              <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {item.value}/{item.total}
              </span>
            </div>
            <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.total > 0 ? Math.min(100, Math.round((item.value / item.total) * 100)) : 0}%`,
                  backgroundColor: iconColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PeopleComplianceRow({ stats = {}, onNavigate }) {
  const { isDark } = useTheme()

  const totalPlayers = stats.totalRegistrations || 0
  const rosteredPlayers = stats.rosteredPlayers || 0
  const waiversSigned = Math.max(0, totalPlayers - (stats.unsignedWaivers || 0))
  const coachTotal = stats.teams || 0
  const coachAssigned = stats.teamsWithCoach || 0

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full`}>
      <h3 className={`text-xs font-bold uppercase tracking-[1.2px] mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        People & Compliance
      </h3>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        <ComplianceCard
          icon={Users}
          title="Players"
          iconColor="#4BB9EC"
          isDark={isDark}
          items={[
            { label: 'Registered', value: totalPlayers, total: stats.capacity || totalPlayers },
            { label: 'Rostered', value: rosteredPlayers, total: totalPlayers },
          ]}
        />
        <ComplianceCard
          icon={Users}
          title="Parents"
          iconColor="#8B5CF6"
          isDark={isDark}
          items={[
            { label: 'Waivers', value: waiversSigned, total: totalPlayers },
            { label: 'Payments', value: Math.max(0, totalPlayers - (stats.pastDue > 0 ? Math.ceil(stats.pastDue / 100) : 0)), total: totalPlayers },
          ]}
        />
        <ComplianceCard
          icon={UserCheck}
          title="Coaches"
          iconColor="#22C55E"
          isDark={isDark}
          items={[
            { label: 'Assigned', value: coachAssigned, total: coachTotal },
            { label: 'Bg Checks', value: stats.coachCount || 0, total: stats.coachCount || 0 },
          ]}
        />
        <ComplianceCard
          icon={Building2}
          title="Org"
          iconColor="#F59E0B"
          isDark={isDark}
          items={[
            { label: 'Season', value: 1, total: 1 },
            { label: 'Payments', value: 1, total: 1 },
          ]}
        />
      </div>
    </div>
  )
}
