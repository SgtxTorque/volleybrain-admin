// =============================================================================
// UnrosteredAlert — Amber-bordered alert card for unrostered players
// Only renders when unrostered players exist (progressive disclosure)
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { AlertTriangle, Search, ChevronDown, ChevronUp } from 'lucide-react'

export default function UnrosteredAlert({ players = [], teams = [], onAssign }) {
  const { isDark } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  if (players.length === 0) return null

  const filtered = players.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) ||
           p.position?.toLowerCase().includes(s)
  })

  return (
    <div className={`rounded-[14px] border-l-[3px] border-l-amber-500 ${
      isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span className={`text-base font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {players.length} Player{players.length > 1 ? 's' : ''} Unrostered
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <div className="flex -space-x-1.5">
              {players.slice(0, 4).map(p => (
                <div key={p.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isDark ? 'border-lynx-charcoal bg-white/[0.06] text-slate-300' : 'border-white bg-slate-100 text-slate-600'
                }`}>
                  {(p.first_name || '?').charAt(0)}{(p.last_name || '').charAt(0)}
                </div>
              ))}
              {players.length > 4 && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isDark ? 'border-lynx-charcoal bg-amber-500/20 text-amber-400' : 'border-white bg-amber-50 text-amber-600'
                }`}>
                  +{players.length - 4}
                </div>
              )}
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className={`px-5 pb-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          {/* Search */}
          <div className="relative mt-3 mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg text-base ${
                isDark
                  ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Player list */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {filtered.map(player => (
              <div key={player.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
              }`}>
                {/* Avatar */}
                {player.photo_url ? (
                  <img src={player.photo_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {player.first_name} {player.last_name}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {player.position || 'No position'}{player.grade ? ` · ${player.grade}` : ''}
                  </p>
                </div>

                {/* Assign dropdown */}
                <select
                  onChange={e => { if (e.target.value) onAssign?.(e.target.value, player.id); e.target.value = '' }}
                  defaultValue=""
                  className={`text-sm font-semibold px-3 py-1.5 rounded-lg cursor-pointer ${
                    isDark
                      ? 'bg-lynx-sky/10 border border-lynx-sky/20 text-lynx-sky'
                      : 'bg-lynx-sky/10 border border-lynx-sky/20 text-lynx-sky'
                  }`}
                >
                  <option value="">Assign →</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className={`text-base text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No players match search
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
