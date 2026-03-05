// DashboardFilterCard — Season/sport/team filters for admin dashboard
// Reads from sharedProps: selectedSeason, seasons, allSeasons, sports, teamsData
// Calls callbacks to update parent filter state

import { useTheme } from '../../contexts/ThemeContext'
import { Filter, ChevronDown } from 'lucide-react'

export default function DashboardFilterCard({
  selectedSeason, seasons = [], allSeasons = [], sports = [], teamsData = [],
  onSeasonChange, onSportChange, onTeamChange,
  selectedSport, filterTeam = 'all',
}) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  const selectClass = `appearance-none rounded-lg px-2 pr-6 py-1 text-xs font-medium cursor-pointer transition-colors w-full ${
    isDark
      ? 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1]'
      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
  }`

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Filter className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Filters
        </h3>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {/* Season */}
        <div className="relative">
          <select
            value={selectedSeason?.id || ''}
            onChange={(e) => {
              const season = [...(seasons || []), ...(allSeasons || [])].find(s => s.id === e.target.value)
              if (season) onSeasonChange?.(season)
            }}
            className={selectClass}
          >
            {(allSeasons.length > 0 ? allSeasons : seasons).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>

        {/* Sport */}
        <div className="relative">
          <select
            value={selectedSport?.id || ''}
            onChange={(e) => {
              const sport = sports.find(s => s.id === e.target.value) || null
              onSportChange?.(sport)
            }}
            className={selectClass}
          >
            <option value="">All Sports</option>
            {sports.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>

        {/* Team */}
        <div className="relative">
          <select
            value={filterTeam}
            onChange={(e) => onTeamChange?.(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Teams</option>
            {teamsData.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        </div>
      </div>
    </div>
  )
}
