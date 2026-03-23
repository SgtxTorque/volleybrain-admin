// =============================================================================
// TeamsStatRow — 4 stat cards: Total Teams, Rostered Players, Open Spots, Avg Health
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Shield, Users, UserCheck } from 'lucide-react'

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
              {sub && (
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{sub}</span>
              )}
              {pill && (
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${pill.className}`}>
                  {pill.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamsStatRow({ teams = [], unrosteredCount = 0, totalRegistered = 0 }) {
  const totalTeams = teams.length
  const rosteredPlayers = teams.reduce((sum, t) => sum + (t.team_players?.length || 0), 0)
  const totalMaxRoster = teams.reduce((sum, t) => sum + (t.max_roster_size || 12), 0)
  const openSpots = Math.max(0, totalMaxRoster - rosteredPlayers)

  const avgHealth = totalTeams > 0
    ? Math.round(teams.reduce((sum, t) => {
        const max = t.max_roster_size || 12
        const current = t.team_players?.length || 0
        return sum + (current / max) * 100
      }, 0) / totalTeams)
    : 0

  const healthColor = avgHealth >= 75 ? 'text-emerald-500' : avgHealth >= 40 ? 'text-amber-500' : 'text-red-500'
  const healthPill = avgHealth >= 75
    ? { label: 'Healthy', className: 'bg-emerald-500/12 text-emerald-500' }
    : avgHealth >= 40
      ? { label: 'Needs Attention', className: 'bg-amber-500/12 text-amber-500' }
      : { label: 'Critical', className: 'bg-red-500/12 text-red-500' }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Shield}
        label="Total Teams"
        value={totalTeams}
        sub="This season"
        iconColor="#4BB9EC"
      />
      <StatCard
        icon={Users}
        label="Rostered Players"
        value={rosteredPlayers}
        sub={totalRegistered > 0 ? `of ${totalRegistered} registered` : null}
        pill={unrosteredCount > 0 ? { label: `${unrosteredCount} unrostered`, className: 'bg-amber-500/12 text-amber-500' } : null}
        iconColor="#22C55E"
      />
      <StatCard
        icon={UserCheck}
        label="Open Spots"
        value={openSpots}
        sub="Across all teams"
        iconColor="#8B5CF6"
      />
      <StatCard
        icon={Shield}
        label="Avg Team Health"
        value={`${avgHealth}%`}
        valueColor={healthColor}
        pill={healthPill}
        iconColor={avgHealth >= 75 ? '#22C55E' : avgHealth >= 40 ? '#F59E0B' : '#EF4444'}
      />
    </div>
  )
}
