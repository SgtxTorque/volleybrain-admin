import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'

export default function SeasonFilterBar({ role }) {
  const { seasons, allSeasons, selectedSeason, selectSeason } = useSeason()
  const { sports, selectedSport, selectSport } = useSport()
  const { isDark } = useTheme()

  // Only render for admin and coach
  if (role && role !== 'admin' && role !== 'coach') return null

  const selectCls = isDark
    ? 'px-3 py-2 rounded-lg border border-white/10 text-r-sm font-medium bg-lynx-charcoal text-slate-200 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'

  return (
    <div className="flex gap-3 items-center mb-5 flex-wrap">
      <select
        value={selectedSeason?.id || ''}
        onChange={e => {
          const season = allSeasons.find(s => s.id === e.target.value) || null
          selectSeason(season)
        }}
        className={selectCls}
      >
        <option value="">All Seasons</option>
        {(seasons || []).map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {sports?.length > 1 && (
        <select
          value={selectedSport?.id || ''}
          onChange={e => {
            const sport = sports.find(s => s.id === e.target.value) || null
            selectSport(sport)
          }}
          className={selectCls}
        >
          <option value="">All Sports</option>
          {sports.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
