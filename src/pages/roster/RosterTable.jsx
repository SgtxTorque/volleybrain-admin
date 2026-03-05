// =============================================================================
// RosterTable — filter bar + roster table with position badges, eval XP bars
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Search, ArrowUpDown, ChevronUp, ChevronDown, MoreHorizontal, Users } from 'lucide-react'

const POSITIONS = ['OH', 'S', 'MB', 'OPP', 'L', 'DS', 'RS']

const POSITION_COLORS = {
  'OH': { bg: 'bg-sky-500/15', text: 'text-sky-500' },
  'S':  { bg: 'bg-amber-500/15', text: 'text-amber-500' },
  'MB': { bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
  'OPP': { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  'L':  { bg: 'bg-purple-500/15', text: 'text-purple-500' },
  'DS': { bg: 'bg-red-500/15', text: 'text-red-500' },
  'RS': { bg: 'bg-amber-500/15', text: 'text-amber-500' },
}

function PositionBadge({ position }) {
  if (!position) return <span className="text-sm text-slate-400">—</span>
  const colors = POSITION_COLORS[position] || { bg: 'bg-slate-500/15', text: 'text-slate-400' }
  return (
    <span className={`w-7 h-7 rounded-md text-sm font-extrabold inline-flex items-center justify-center ${colors.bg} ${colors.text}`}>
      {position}
    </span>
  )
}

function EvalBar({ rating }) {
  if (!rating) return <span className="text-sm text-slate-400">—</span>
  const pct = Math.min((rating / 10) * 100, 100)
  const barColor = rating >= 8 ? 'bg-emerald-500' : rating >= 5 ? 'bg-lynx-sky' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[5px] rounded-full bg-slate-700/30">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold tabular-nums w-6 text-right">{rating}</span>
    </div>
  )
}

function OverflowMenu({ onView, onEvaluate }) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-8 z-20 w-40 rounded-xl shadow-lg border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => { onView(); setOpen(false) }} className={`w-full text-left px-4 py-2.5 text-base ${isDark ? 'text-white hover:bg-white/[0.04]' : 'text-slate-900 hover:bg-slate-50'} rounded-t-xl`}>
              View Profile
            </button>
            <button onClick={() => { onEvaluate(); setOpen(false) }} className={`w-full text-left px-4 py-2.5 text-base ${isDark ? 'text-white hover:bg-white/[0.04]' : 'text-slate-900 hover:bg-slate-50'} rounded-b-xl`}>
              Evaluate
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function RosterTable({
  filteredRoster,
  searchQuery,
  setSearchQuery,
  sortKey,
  sortDir,
  toggleSort,
  selectedIds,
  toggleSelectAll,
  toggleSelect,
  editingJersey,
  setEditingJersey,
  editingPosition,
  setEditingPosition,
  saveJersey,
  savePosition,
  onPlayerSelect,
  onEvaluate,
  loading,
}) {
  const { isDark } = useTheme()
  const [posFilter, setPosFilter] = useState('All')

  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  // Apply position filter
  const displayRoster = posFilter === 'All'
    ? filteredRoster
    : filteredRoster.filter(p => {
        const pos = p.player?.position || p.positions?.primary_position
        return pos === posFilter
      })

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className={`${cardBg} rounded-[14px] overflow-hidden`}>
      {/* Filter bar */}
      <div className={`px-5 py-3 flex items-center gap-3 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} border-b ${borderColor}`}>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-base border ${isDark ? 'bg-lynx-midnight border-white/[0.06] text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
          />
        </div>
        <div className="flex gap-1.5">
          {['All', ...POSITIONS].map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              className={`px-2.5 py-1.5 rounded-lg text-sm font-bold transition ${
                posFilter === pos
                  ? 'bg-lynx-sky text-lynx-navy'
                  : isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {displayRoster.length === 0 && !loading ? (
        <div className="p-12 text-center">
          <Users className={`w-12 h-12 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {searchQuery || posFilter !== 'All' ? 'No players match' : 'No players assigned'}
          </h3>
          <p className="text-slate-400 mt-1 text-base">
            {searchQuery ? 'Try a different search' : posFilter !== 'All' ? 'Try a different position' : 'Ask your admin to assign players'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderColor} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={selectedIds.size === displayRoster.length && displayRoster.length > 0}
                    onChange={toggleSelectAll} className="w-4 h-4 rounded cursor-pointer" />
                </th>
                <th className="text-center px-2 py-3 w-14">
                  <button onClick={() => toggleSort('jersey_number')} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                    # <SortIcon column="jersey_number" />
                  </button>
                </th>
                <th className="text-left px-3 py-3">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                    Player <SortIcon column="name" />
                  </button>
                </th>
                <th className="text-center px-3 py-3 w-16">
                  <button onClick={() => toggleSort('position')} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                    Pos <SortIcon column="position" />
                  </button>
                </th>
                <th className="text-center px-3 py-3 w-14 text-sm font-bold uppercase tracking-wider text-slate-400">Gr</th>
                <th className="text-center px-3 py-3 w-16 text-sm font-bold uppercase tracking-wider text-slate-400">Waiver</th>
                <th className="text-left px-3 py-3 w-32">
                  <button onClick={() => toggleSort('rating')} className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-slate-400">
                    Eval <SortIcon column="rating" />
                  </button>
                </th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayRoster.map(p => {
                const jerseyNum = p.jersey_number ?? p.player?.jersey_number
                const position = p.player?.position || p.positions?.primary_position
                const overallRating = p.skills?.overall_rating
                const isCaptain = p.positions?.is_captain || p.positions?.is_co_captain

                return (
                  <tr key={p.id} className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'} transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.player_id)} onChange={() => toggleSelect(p.player_id)} className="w-4 h-4 rounded cursor-pointer" />
                    </td>

                    {/* Jersey # — large + inline editable */}
                    <td className="px-2 py-3 text-center">
                      {editingJersey === p.id ? (
                        <input
                          type="text" autoFocus defaultValue={jerseyNum || ''}
                          className={`w-12 text-center text-base rounded border px-1 py-0.5 ${isDark ? 'bg-white/[0.06] border-lynx-sky text-white' : 'bg-white border-lynx-sky text-slate-900'}`}
                          onBlur={e => saveJersey(p.id, p.player_id, e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveJersey(p.id, p.player_id, e.target.value); if (e.key === 'Escape') setEditingJersey(null) }}
                        />
                      ) : (
                        <button onClick={() => setEditingJersey(p.id)}
                          className={`text-4xl font-extrabold hover:text-lynx-sky transition tabular-nums ${jerseyNum ? 'text-slate-400' : 'text-amber-500'}`}>
                          {jerseyNum || '—'}
                        </button>
                      )}
                    </td>

                    {/* Player */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {p.player?.photo_url ? (
                          <img src={p.player.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {p.player?.first_name?.[0]}{p.player?.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <button onClick={() => onPlayerSelect(p)} className={`text-base font-semibold text-left hover:text-lynx-sky transition ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {p.player?.first_name} {p.player?.last_name}
                            {isCaptain && <span className="ml-1 text-amber-500">C</span>}
                          </button>
                          <p className="text-sm text-slate-400">{p.player?.parent_email || ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Position — color-coded badge + inline editable */}
                    <td className="px-3 py-3 text-center">
                      {editingPosition === p.player_id ? (
                        <select autoFocus defaultValue={position || ''}
                          onChange={e => savePosition(p.player_id, e.target.value)}
                          onBlur={() => setEditingPosition(null)}
                          className={`text-sm rounded border px-1 py-0.5 ${isDark ? 'bg-lynx-charcoal border-lynx-sky text-white' : 'bg-white border-lynx-sky text-slate-900'}`}>
                          <option value="">—</option>
                          {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditingPosition(p.player_id)} className="hover:opacity-80 transition">
                          <PositionBadge position={position} />
                        </button>
                      )}
                    </td>

                    {/* Grade */}
                    <td className="px-3 py-3 text-center text-sm text-slate-400">{p.player?.grade || '—'}</td>

                    {/* Waiver */}
                    <td className="px-3 py-3 text-center">
                      {p.waiverSigned ? (
                        <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">Signed</span>
                      ) : (
                        <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-red-500/12 text-red-500">Missing</span>
                      )}
                    </td>

                    {/* Eval XP Bar */}
                    <td className="px-3 py-3">
                      <EvalBar rating={overallRating} />
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3">
                      <OverflowMenu onView={() => onPlayerSelect(p)} onEvaluate={onEvaluate} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
