// =============================================================================
// AllTeamsTable — Table with team name, sport, record, player count, health, status
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight } from 'lucide-react'

function HealthBar({ percent, isDark }) {
  const color = percent >= 80 ? '#22C55E' : percent >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
      />
    </div>
  )
}

function StatusChip({ status, isDark }) {
  const statusConfig = {
    good: { label: 'Good', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    warning: { label: 'Check', bg: 'bg-amber-500/10', text: 'text-amber-500' },
    critical: { label: 'Critical', bg: 'bg-red-500/10', text: 'text-red-500' },
  }
  const cfg = statusConfig[status] || statusConfig.good
  return (
    <span className={`px-2 py-0.5 rounded-full text-lg font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default function AllTeamsTable({ teams = [], teamStats = {}, onNavigate }) {
  const { isDark } = useTheme()

  if (teams.length === 0) return null

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm overflow-hidden`}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <h3 className={`text-lg font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          All Teams
        </h3>
        <button
          onClick={() => onNavigate?.('teams')}
          className="text-base text-lynx-sky font-medium flex items-center gap-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-lg">
          <thead>
            <tr className={isDark ? 'text-slate-500' : 'text-slate-400'}>
              <th className="text-left text-lg font-semibold uppercase tracking-wider px-4 py-2">Team</th>
              <th className="text-center text-lg font-semibold uppercase tracking-wider px-2 py-2">Record</th>
              <th className="text-center text-lg font-semibold uppercase tracking-wider px-2 py-2">Players</th>
              <th className="text-center text-lg font-semibold uppercase tracking-wider px-2 py-2">Health</th>
              <th className="text-center text-lg font-semibold uppercase tracking-wider px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => {
              const ts = teamStats[team.id] || { playerCount: 0, record: '0W-0L' }
              const maxP = team.max_players || 12
              const healthPct = maxP > 0 ? Math.round((ts.playerCount / maxP) * 100) : 0
              const status = healthPct >= 80 ? 'good' : healthPct >= 50 ? 'warning' : 'critical'

              return (
                <tr
                  key={team.id}
                  onClick={() => onNavigate?.('teams')}
                  className={`cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: team.color || '#4BB9EC' }}
                      />
                      <span className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {team.name}
                      </span>
                    </div>
                  </td>
                  <td className={`text-center px-2 py-2.5 tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {ts.record}
                  </td>
                  <td className={`text-center px-2 py-2.5 tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {ts.playerCount}/{maxP}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex justify-center">
                      <HealthBar percent={healthPct} isDark={isDark} />
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <StatusChip status={status} isDark={isDark} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
