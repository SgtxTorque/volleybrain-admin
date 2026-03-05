// =============================================================================
// PeopleComplianceRow — 4 role cards with completion rows
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Users, UserCheck, Shield, Building2 } from 'lucide-react'

function ComplianceCard({ icon: Icon, title, items, iconColor, isDark }) {
  return (
    <div className={`rounded-2xl shadow-sm p-4 ${
      isDark
        ? 'bg-lynx-charcoal border border-white/[0.06]'
        : 'bg-white border border-brand-border'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
      </div>
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</span>
              <span className={`text-base font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-700'}`}>
                {item.value}/{item.total}
              </span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
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
          { label: 'Waivers Signed', value: waiversSigned, total: totalPlayers },
          { label: 'Payments Current', value: Math.max(0, totalPlayers - (stats.pastDue > 0 ? Math.ceil(stats.pastDue / 100) : 0)), total: totalPlayers },
        ]}
      />
      <ComplianceCard
        icon={UserCheck}
        title="Coaches"
        iconColor="#22C55E"
        isDark={isDark}
        items={[
          { label: 'Teams Assigned', value: coachAssigned, total: coachTotal },
          { label: 'Background Checks', value: stats.coachCount || 0, total: stats.coachCount || 0 },
        ]}
      />
      <ComplianceCard
        icon={Building2}
        title="Organization"
        iconColor="#F59E0B"
        isDark={isDark}
        items={[
          { label: 'Season Setup', value: 1, total: 1 },
          { label: 'Payment Config', value: 1, total: 1 },
        ]}
      />
    </div>
  )
}
