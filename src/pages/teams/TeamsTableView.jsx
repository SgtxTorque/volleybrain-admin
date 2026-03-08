// =============================================================================
// TeamsTableView — Table with health bars, avatar groups, status chips
// Design system: bg-slate-50 header, border-b rows, hover states
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Search, Trash2, MoreVertical, ExternalLink } from 'lucide-react'

function AvatarGroup({ players = [], teamColor, max = 5 }) {
  const { isDark } = useTheme()
  const shown = players.slice(0, max)
  const overflow = players.length - max

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          p.photo_url ? (
            <img key={p.id || i} src={p.photo_url} alt="" className="w-7 h-7 rounded-lg object-cover border-2 border-white dark:border-lynx-charcoal" />
          ) : (
            <div key={p.id || i}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
                isDark ? 'border-lynx-charcoal bg-white/[0.06] text-slate-300' : 'border-white bg-slate-100 text-slate-600'
              }`}
            >
              {(p.first_name || '?').charAt(0)}{(p.last_name || '').charAt(0)}
            </div>
          )
        ))}
        {overflow > 0 && (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
            isDark ? 'border-lynx-charcoal bg-white/[0.08] text-slate-400' : 'border-white bg-slate-200 text-slate-600'
          }`}>
            +{overflow}
          </div>
        )}
      </div>
      <span className={`ml-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {players.length}
      </span>
    </div>
  )
}

function HealthBar({ current, max }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  // Brand gradient: sky-to-green for healthy, amber-to-red for critical
  const barStyle = pct >= 75
    ? 'bg-gradient-to-r from-lynx-sky to-emerald-500'
    : pct >= 40
      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
      : 'bg-gradient-to-r from-red-400 to-red-500'
  const textColor = pct >= 75 ? 'text-emerald-500' : pct >= 40 ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-[6px] rounded-full bg-slate-200 dark:bg-white/[0.08]">
        <div className={`h-full rounded-full ${barStyle} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  )
}

function StatusChip({ roster_open, playerCount, maxRoster }) {
  if (playerCount >= maxRoster) {
    return <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-red-500/12 text-red-500">Full</span>
  }
  if (roster_open) {
    return <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-500">Open</span>
  }
  return <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-500">Closed</span>
}

export default function TeamsTableView({
  teams = [],
  search,
  onSearchChange,
  onDeleteTeam,
  onNavigateToWall,
  unrosteredPlayers = [],
  onAddPlayer,
}) {
  const { isDark } = useTheme()
  const [menuOpen, setMenuOpen] = useState(null)

  const filtered = teams.filter(t => {
    if (!search) return true
    return t.name.toLowerCase().includes(search.toLowerCase())
  })

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-slate-200'

  return (
    <div className={`${cardBg} rounded-[14px] overflow-hidden`}>
      {/* Filter bar */}
      <div className={`px-5 py-3 flex items-center gap-3 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search teams..."
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-base ${
              isDark
                ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500'
                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {filtered.length} team{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}>
              {['Team', 'Roster', 'Health', 'Type', 'Status', 'Wall', ''].map(h => (
                <th key={h} className={`px-5 py-3 text-left text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((team, idx) => {
              const players = (team.team_players || []).map(tp => tp.players).filter(Boolean)
              const playerCount = players.length
              const maxRoster = team.max_roster_size || 12

              return (
                <tr key={team.id}
                  className={`${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'} transition ${
                    idx < filtered.length - 1 ? `border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}` : ''
                  }`}
                >
                  {/* Team name + color dot */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color || '#888' }} />
                      <div className="min-w-0">
                        <p className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {team.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {team.age_group || ''}{team.gender && team.gender !== 'coed' ? ` · ${team.gender}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Roster avatars */}
                  <td className="px-5 py-3">
                    {playerCount > 0 ? (
                      <AvatarGroup players={players} teamColor={team.color} />
                    ) : (
                      <span className={`text-sm ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>Empty</span>
                    )}
                  </td>

                  {/* Health bar */}
                  <td className="px-5 py-3">
                    <HealthBar current={playerCount} max={maxRoster} />
                  </td>

                  {/* Type */}
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                      team.team_type === 'competitive'
                        ? 'bg-lynx-sky/15 text-lynx-sky'
                        : team.team_type === 'travel'
                          ? 'bg-purple-500/12 text-purple-500'
                          : isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {(team.team_type || 'rec').charAt(0).toUpperCase() + (team.team_type || 'rec').slice(1)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3">
                    <StatusChip roster_open={team.roster_open} playerCount={playerCount} maxRoster={maxRoster} />
                  </td>

                  {/* Wall link */}
                  <td className="px-5 py-3">
                    <button
                      onClick={() => onNavigateToWall?.(team.id)}
                      className="text-sm font-semibold text-lynx-sky hover:brightness-110 flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(menuOpen === team.id ? null : team.id)
                        }}
                        className={`w-[30px] h-[30px] rounded-lg border flex items-center justify-center ${
                          isDark ? 'border-white/[0.06] text-slate-400 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpen === team.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                          <div className={`absolute right-0 top-full mt-1 z-50 rounded-lg shadow-xl border py-1 min-w-[140px] ${
                            isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
                          }`}
                            style={{ position: 'fixed', transform: 'translateX(-100px)' }}
                            ref={el => {
                              if (el) {
                                const btn = el.previousElementSibling?.previousElementSibling
                                if (btn) {
                                  const rect = btn.getBoundingClientRect()
                                  el.style.top = `${rect.bottom + 4}px`
                                  el.style.left = `${rect.right - 140}px`
                                  el.style.transform = 'none'
                                }
                              }
                            }}
                          >
                            <button
                              onClick={() => { onDeleteTeam(team.id); setMenuOpen(null) }}
                              className={`w-full px-4 py-2 text-left text-base flex items-center gap-2 text-red-500 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-red-50'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Team
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={`text-center py-8 text-base ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No teams match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
