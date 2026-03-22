import { useSeason, ALL_SEASONS, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { Search } from 'lucide-react'

export default function SeasonFilterBar({ role: roleProp }) {
  const { seasons, allSeasons, selectedSeason, selectSeason } = useSeason()
  const { sports, selectedSport, selectSport } = useSport()
  const { isDark } = useTheme()
  const { profile } = useAuth()
  const role = roleProp || profile?.role

  // Only render for admin and coach
  if (role && role !== 'admin' && role !== 'coach') return null

  const selectCls = isDark
    ? 'px-3 py-2 rounded-lg border border-white/10 text-r-sm font-medium bg-lynx-charcoal text-slate-200 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'
    : 'px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20'

  return (
    <div className="flex gap-3 items-center mb-5 flex-wrap">
      <select
        value={isAllSeasons(selectedSeason) ? 'all' : (selectedSeason?.id || '')}
        onChange={e => {
          const value = e.target.value
          if (value === 'all') {
            selectSeason(ALL_SEASONS)
            return
          }
          const season = allSeasons.find(s => s.id === value)
          selectSeason(season || null)
        }}
        className={selectCls}
      >
        {role === 'admin' && <option value="all">All Seasons</option>}
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

      <button
        onClick={() => document.dispatchEvent(new CustomEvent('open-global-search'))}
        className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg border text-r-sm transition-colors ${
          isDark
            ? 'border-white/10 text-slate-400 hover:border-sky-500/30 hover:text-slate-200 bg-lynx-charcoal'
            : 'border-slate-200 text-slate-400 hover:border-sky-300 hover:text-slate-600 bg-white'
        }`}
        title="Search (⌘K)"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className={`hidden sm:inline text-[10px] font-bold px-1 py-0.5 rounded border ${
          isDark ? 'border-white/10 text-slate-600' : 'border-slate-200 text-slate-300'
        }`}>⌘K</kbd>
      </button>
    </div>
  )
}
