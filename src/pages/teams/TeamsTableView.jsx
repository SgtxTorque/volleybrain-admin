// =============================================================================
// TeamsTableView — Sport-grouped table with fill bars, health index, selected state
// Design system: v2 tokens, sport section headers, roster fill bars, health index
// =============================================================================

import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Search, Trash2, MoreVertical, ExternalLink, Edit, Users, UserCog, Shield, TrendingUp, TrendingDown } from 'lucide-react'

function StatusChip({ roster_open, playerCount, maxRoster }) {
  if (playerCount >= maxRoster) {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/12 text-red-500">FULL</span>
  }
  if (roster_open) {
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-500">OPEN</span>
  }
  return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/12 text-amber-500">CLOSED</span>
}

export default function TeamsTableView({
  teams = [],
  search,
  onSearchChange,
  onDeleteTeam,
  onNavigateToWall,
  onEditTeam,
  onManageRoster,
  onAssignCoaches,
  onToggleRosterOpen,
  onViewTeamDetail,
  selectedTeamId,
  unrosteredPlayers = [],
  onAddPlayer,
}) {
  const { isDark } = useTheme()
  const [menuOpen, setMenuOpen] = useState(null)

  const filtered = teams.filter(t => {
    if (!search) return true
    return t.name.toLowerCase().includes(search.toLowerCase())
  })

  // Group teams by team_type for sport section headers
  const grouped = (() => {
    const groups = {}
    filtered.forEach(t => {
      const type = (t.team_type || 'recreational')
      if (!groups[type]) groups[type] = []
      groups[type].push(t)
    })
    // Sort groups: competitive first, then travel, then recreational
    const order = ['competitive', 'travel', 'recreational', 'rec']
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  })()

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
                <th key={h} className={`px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                  style={{ fontFamily: 'var(--v2-font)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map(([groupType, groupTeams]) => (
              <>
                {/* Sport section header */}
                {grouped.length > 1 && (
                  <tr key={`header-${groupType}`}>
                    <td colSpan={7}>
                      <div className="flex items-center gap-2 px-5 py-2 mt-2 first:mt-0">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                          style={{ fontFamily: 'var(--v2-font)' }}>
                          {groupType.charAt(0).toUpperCase() + groupType.slice(1)} · {groupTeams.length} team{groupTeams.length !== 1 ? 's' : ''}
                        </span>
                        <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />
                      </div>
                    </td>
                  </tr>
                )}

                {groupTeams.map((team) => {
                  const players = (team.team_players || []).map(tp => tp.players).filter(Boolean)
                  const playerCount = players.length
                  const maxRoster = team.max_roster_size || 12
                  const fillPercent = maxRoster > 0 ? Math.round((playerCount / maxRoster) * 100) : 0
                  const health = Math.min(fillPercent, 100)
                  const isSelected = team.id === selectedTeamId

                  return (
                    <tr key={team.id}
                      onClick={() => onViewTeamDetail?.(team)}
                      className={`cursor-pointer transition-all border-l-[3px] ${
                        isSelected
                          ? (isDark ? 'bg-[#4BB9EC]/10 border-l-[#10284C]' : 'bg-[#4BB9EC]/[0.06] border-l-[#10284C]')
                          : `border-l-transparent ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`
                      } border-b ${isDark ? 'border-b-white/[0.04]' : 'border-b-slate-100'}`}
                    >
                      {/* Team name + color dot */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color || '#888' }} />
                          <div className="min-w-0">
                            <span className={`text-sm font-bold truncate block ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                              {team.name}
                            </span>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {team.age_group || ''}{team.gender && team.gender !== 'coed' ? ` · ${team.gender}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Roster fill bar */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${
                            fillPercent >= 100 ? 'text-[#22C55E]' : fillPercent < 50 ? 'text-red-500' : isDark ? 'text-white' : 'text-[#10284C]'
                          }`}>
                            {playerCount}/{maxRoster}
                          </span>
                          <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200'}`}>
                            <div className={`h-full rounded-full transition-all ${
                              fillPercent >= 100 ? 'bg-[#22C55E]' : fillPercent < 50 ? 'bg-red-500' : 'bg-[#4BB9EC]'
                            }`} style={{ width: `${Math.min(fillPercent, 100)}%` }} />
                          </div>
                          <span className={`text-xs tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{fillPercent}%</span>
                        </div>
                      </td>

                      {/* Health index */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <span className={`text-lg font-black tabular-nums ${
                            health > 80 ? 'text-[#22C55E]' : health > 50 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {health}
                          </span>
                          {health > 80 && <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />}
                          {health <= 50 && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
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
                          onClick={(e) => { e.stopPropagation(); onNavigateToWall?.(team.id) }}
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
                              <div className={`absolute right-0 top-full mt-1 z-50 rounded-xl shadow-lg border py-1.5 min-w-[200px] ${
                                isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-lynx-silver'
                              }`}
                                style={{ position: 'fixed', transform: 'translateX(-160px)' }}
                                ref={el => {
                                  if (el) {
                                    const btn = el.previousElementSibling?.previousElementSibling
                                    if (btn) {
                                      const rect = btn.getBoundingClientRect()
                                      el.style.top = `${rect.bottom + 4}px`
                                      el.style.left = `${rect.right - 200}px`
                                      el.style.transform = 'none'
                                    }
                                  }
                                }}
                              >
                                {/* View & Edit */}
                                <button
                                  onClick={() => { onNavigateToWall?.(team.id); setMenuOpen(null) }}
                                  className={`w-full px-4 py-2.5 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}
                                >
                                  <ExternalLink className="w-4 h-4 opacity-60" /> View Team Wall
                                </button>
                                <button
                                  onClick={() => { onEditTeam?.(team); setMenuOpen(null) }}
                                  className={`w-full px-4 py-2.5 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}
                                >
                                  <Edit className="w-4 h-4 opacity-60" /> Edit Team Settings
                                </button>

                                {/* Roster */}
                                <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`} />
                                <button
                                  onClick={() => { onManageRoster?.(team); setMenuOpen(null) }}
                                  className={`w-full px-4 py-2.5 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}
                                >
                                  <Users className="w-4 h-4 opacity-60" /> Manage Roster
                                </button>
                                <button
                                  onClick={() => { onAssignCoaches?.(team); setMenuOpen(null) }}
                                  className={`w-full px-4 py-2.5 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}
                                >
                                  <UserCog className="w-4 h-4 opacity-60" /> Assign Coaches
                                </button>

                                {/* Roster Status Toggle */}
                                <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`} />
                                <button
                                  onClick={() => { onToggleRosterOpen?.(team); setMenuOpen(null) }}
                                  className={`w-full px-4 py-2.5 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}
                                >
                                  <Shield className="w-4 h-4 opacity-60" /> {team.roster_open ? 'Close Roster' : 'Open Roster'}
                                </button>

                                {/* Danger zone */}
                                <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`} />
                                <button
                                  onClick={() => { onDeleteTeam(team.id); setMenuOpen(null) }}
                                  className={`w-full px-4 py-2.5 text-left text-r-sm flex items-center gap-2.5 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                                >
                                  <Trash2 className="w-4 h-4" /> Delete Team
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </>
            ))}

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
