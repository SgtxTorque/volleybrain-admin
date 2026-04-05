import { useSeason, ALL_SEASONS, isAllSeasons } from '../../contexts/SeasonContext'
import { useProgram } from '../../contexts/ProgramContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { Search, ChevronDown } from 'lucide-react'

export default function SeasonFilterBar({ role: roleProp }) {
  const { seasons, allSeasons, selectedSeason, selectSeason } = useSeason()
  const { programs, selectedProgram, selectProgram } = useProgram()
  const { isDark } = useTheme()
  const { isAdmin } = useAuth()

  // Only hide when an explicit role prop is passed that isn't admin/coach
  if (roleProp && roleProp !== 'admin' && roleProp !== 'coach') return null

  const selectCls = isDark
    ? 'appearance-none rounded-lg px-4 pr-8 py-2 text-sm font-semibold cursor-pointer transition-all bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1] focus:outline-none focus:border-[#4BB9EC]/40 focus:ring-2 focus:ring-[#4BB9EC]/10'
    : 'appearance-none rounded-lg px-4 pr-8 py-2 text-sm font-semibold cursor-pointer transition-all bg-white border border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 focus:outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10'

  return (
    <div className="flex gap-3 items-center mb-5 flex-wrap" style={{ fontFamily: 'var(--v2-font)' }}>
      <div className="relative">
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
          style={{ fontFamily: 'var(--v2-font)' }}
        >
          {isAdmin && <option value="all">All Seasons</option>}
          {(seasons || []).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
      </div>

      {programs?.length > 1 && (
        <div className="relative">
          <select
            value={selectedProgram?.id || ''}
            onChange={e => {
              const program = programs.find(p => p.id === e.target.value) || null
              selectProgram(program)
            }}
            className={selectCls}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <option value="">All Programs</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.icon || p.sport?.icon || '📋'} {p.name}</option>
            ))}
          </select>
          <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
        </div>
      )}

      <button
        onClick={() => document.dispatchEvent(new CustomEvent('open-global-search'))}
        className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
          isDark
            ? 'border-white/[0.06] text-slate-400 hover:border-[#4BB9EC]/30 hover:text-slate-200 bg-white/[0.06]'
            : 'border-[#E8ECF2] text-slate-400 hover:border-[#4BB9EC]/30 hover:text-slate-600 bg-white'
        }`}
        style={{ fontFamily: 'var(--v2-font)' }}
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
