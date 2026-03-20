// =============================================================================
// ManageRosterModal — Manage a team's roster: view current players, add/remove
// Props: { team, unrosteredPlayers, onClose, onAddPlayer, onRemovePlayer, showToast }
// =============================================================================

import { useState, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { X, Search, UserPlus, Trash2 } from 'lucide-react'

export default function ManageRosterModal({
  team,
  unrosteredPlayers = [],
  onClose,
  onAddPlayer,
  onRemovePlayer,
  showToast,
}) {
  const { isDark } = useTheme()
  const [rosterSearch, setRosterSearch] = useState('')
  const [availableSearch, setAvailableSearch] = useState('')

  // --- Derived data ---
  const rosterPlayers = useMemo(() => {
    return (team?.team_players || [])
      .map(tp => tp.players)
      .filter(Boolean)
  }, [team?.team_players])

  const maxRoster = team?.max_roster_size || 12
  const rosterCount = rosterPlayers.length
  const isFull = rosterCount >= maxRoster

  // --- Filtered lists ---
  const filteredRoster = useMemo(() => {
    if (!rosterSearch.trim()) return rosterPlayers
    const q = rosterSearch.toLowerCase()
    return rosterPlayers.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.position || '').toLowerCase().includes(q) ||
      String(p.jersey_number || '').includes(q)
    )
  }, [rosterPlayers, rosterSearch])

  const filteredAvailable = useMemo(() => {
    if (!availableSearch.trim()) return unrosteredPlayers
    const q = availableSearch.toLowerCase()
    return unrosteredPlayers.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.position || '').toLowerCase().includes(q)
    )
  }, [unrosteredPlayers, availableSearch])

  // --- Styles ---
  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-lynx-silver'

  const sectionBg = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-slate-50 border border-lynx-silver'

  const inputClass = isDark
    ? 'bg-white/[0.06] border border-white/[0.06] text-white placeholder-slate-500'
    : 'bg-white border border-lynx-silver text-lynx-navy placeholder-slate-400'

  const primaryText = isDark ? 'text-white' : 'text-lynx-navy'
  const secondaryText = isDark ? 'text-slate-400' : 'text-slate-500'
  const mutedText = isDark ? 'text-slate-500' : 'text-slate-400'

  function handleAdd(playerId) {
    if (isFull) {
      showToast?.('Roster is full', 'error')
      return
    }
    onAddPlayer?.(team.id, playerId)
  }

  function handleRemove(playerId) {
    onRemovePlayer?.(team.id, playerId)
  }

  function PlayerAvatar({ player, size = 'md' }) {
    const dim = size === 'sm' ? 'w-8 h-8 text-r-xs' : 'w-10 h-10 text-r-sm'
    if (player.photo_url) {
      return (
        <img
          src={player.photo_url}
          alt={`${player.first_name} ${player.last_name}`}
          className={`${dim} rounded-lg object-cover`}
        />
      )
    }
    return (
      <div className={`${dim} rounded-lg flex items-center justify-center font-bold ${
        isDark ? 'bg-white/[0.08] text-slate-300' : 'bg-slate-100 text-slate-600'
      }`}>
        {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className={`${cardBg} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-r-lg font-bold ${primaryText}`}>
              Manage Roster — {team?.name || 'Team'}
            </h2>
            <p className={`text-r-sm mt-0.5 ${secondaryText}`}>
              {rosterCount} / {maxRoster} players
              {isFull && <span className="ml-2 text-red-500 font-semibold">(Full)</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-lynx-frost text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ======================== CURRENT ROSTER ======================== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-r-base font-bold ${primaryText}`}>Current Roster</h3>
              <span className={`text-r-xs font-medium ${mutedText}`}>
                {filteredRoster.length} player{filteredRoster.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Roster search */}
            {rosterPlayers.length > 4 && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Search roster..."
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-r-sm ${inputClass}`}
                />
              </div>
            )}

            <div className={`${sectionBg} rounded-[14px] overflow-hidden`}>
              {filteredRoster.length === 0 ? (
                <div className={`px-5 py-8 text-center text-r-sm ${mutedText}`}>
                  {rosterPlayers.length === 0
                    ? 'No players on this roster yet'
                    : 'No roster players match your search'}
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.06]">
                  {filteredRoster.map(player => (
                    <li
                      key={player.id}
                      className={`px-4 py-3 flex items-center gap-3 transition ${
                        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-lynx-frost'
                      }`}
                    >
                      <PlayerAvatar player={player} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-r-sm font-semibold truncate ${primaryText}`}>
                          {player.first_name} {player.last_name}
                        </p>
                        <div className={`flex items-center gap-2 text-r-xs ${secondaryText}`}>
                          {player.jersey_number != null && (
                            <span className="font-mono font-bold">#{player.jersey_number}</span>
                          )}
                          {player.position && (
                            <>
                              {player.jersey_number != null && <span className="opacity-40">|</span>}
                              <span>{player.position}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(player.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-r-xs font-semibold text-red-500 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ======================== ADD PLAYERS ======================== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-r-base font-bold ${primaryText}`}>Add Players</h3>
              <span className={`text-r-xs font-medium ${mutedText}`}>
                {unrosteredPlayers.length} available
              </span>
            </div>

            {/* Available search */}
            {unrosteredPlayers.length > 4 && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={availableSearch}
                  onChange={e => setAvailableSearch(e.target.value)}
                  placeholder="Search available players..."
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-r-sm ${inputClass}`}
                />
              </div>
            )}

            <div className={`${sectionBg} rounded-[14px] overflow-hidden`}>
              {unrosteredPlayers.length === 0 ? (
                <div className={`px-5 py-8 text-center text-r-sm ${mutedText}`}>
                  All players are rostered
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className={`px-5 py-8 text-center text-r-sm ${mutedText}`}>
                  No available players match your search
                </div>
              ) : (
                <ul className={`divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-lynx-silver'}`}>
                  {filteredAvailable.map(player => (
                    <li
                      key={player.id}
                      className={`px-4 py-3 flex items-center gap-3 transition ${
                        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-lynx-frost'
                      }`}
                    >
                      <PlayerAvatar player={player} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-r-sm font-semibold truncate ${primaryText}`}>
                          {player.first_name} {player.last_name}
                        </p>
                        {player.position && (
                          <p className={`text-r-xs ${secondaryText}`}>{player.position}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdd(player.id)}
                        disabled={isFull}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-r-xs font-bold transition ${
                          isFull
                            ? 'opacity-40 cursor-not-allowed bg-slate-300 text-slate-500'
                            : 'bg-lynx-sky text-lynx-navy hover:brightness-110'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-5 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex items-center justify-between`}>
          <p className={`text-r-xs ${mutedText}`}>
            {rosterCount} of {maxRoster} roster spots filled
          </p>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-lg text-r-sm font-medium transition ${
              isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.08]' : 'bg-slate-100 text-lynx-navy hover:bg-slate-200'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
