import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'
import { getSportConfig } from '../../components/games/GameComponents'

function LineupBuilder({ event, team, onClose, showToast, onSave, sport = 'volleyball' }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [roster, setRoster] = useState([])
  const [lineup, setLineup] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [liberoId, setLiberoId] = useState(null)

  // Get sport-specific configuration
  const sportConfig = getSportConfig(sport)
  const positions = sportConfig.positions
  const starterCount = sportConfig.starterCount
  const hasLibero = sportConfig.hasLibero

  useEffect(() => {
    loadData()
  }, [event.id, team.id])

  async function loadData() {
    setLoading(true)

    // Load team roster
    const { data: players } = await supabase
      .from('team_players')
      .select('*, players(*)')
      .eq('team_id', team.id)

    const rosterData = (players || []).map(tp => tp.players).filter(Boolean)
    setRoster(rosterData)

    // Load existing lineup for this event
    const { data: existingLineup } = await supabase
      .from('game_lineups')
      .select('*')
      .eq('event_id', event.id)

    if (existingLineup?.length > 0) {
      setLineup(existingLineup)
      const libero = existingLineup.find(l => l.is_libero)
      if (libero) setLiberoId(libero.player_id)
    }

    setLoading(false)
  }

  function getPlayerInPosition(positionNum) {
    const entry = lineup.find(l => l.rotation_order === positionNum && l.is_starter)
    if (!entry) return null
    return roster.find(p => p.id === entry.player_id)
  }

  function assignPosition(positionNum, playerId) {
    // Remove player from any existing position
    let newLineup = lineup.filter(l => l.player_id !== playerId)

    // Remove any player currently in this position
    newLineup = newLineup.filter(l => !(l.rotation_order === positionNum && l.is_starter))

    // Add player to new position
    if (playerId) {
      newLineup.push({
        event_id: event.id,
        player_id: playerId,
        rotation_order: positionNum,
        is_starter: true,
        is_libero: playerId === liberoId
      })
    }

    setLineup(newLineup)
  }

  function toggleLibero(playerId) {
    if (liberoId === playerId) {
      setLiberoId(null)
      setLineup(lineup.map(l => ({ ...l, is_libero: false })))
    } else {
      setLiberoId(playerId)
      setLineup(lineup.map(l => ({ ...l, is_libero: l.player_id === playerId })))
    }
  }

  function isPlayerAssigned(playerId) {
    return lineup.some(l => l.player_id === playerId && l.is_starter)
  }

  async function saveLineup() {
    setSaving(true)

    // Delete existing lineup
    await supabase.from('game_lineups').delete().eq('event_id', event.id)

    // Insert new lineup
    if (lineup.length > 0) {
      const { error } = await supabase.from('game_lineups').insert(
        lineup.map(l => ({
          event_id: event.id,
          player_id: l.player_id,
          rotation_order: l.rotation_order,
          is_starter: l.is_starter,
          is_libero: l.is_libero || false
        }))
      )

      if (error) {
        showToast?.('Error saving lineup', 'error')
        setSaving(false)
        return
      }
    }

    showToast?.('Lineup saved!', 'success')
    onSave?.()
    setSaving(false)
    onClose()
  }

  const starters = lineup.filter(l => l.is_starter)
  const availablePlayers = roster.filter(p => !isPlayerAssigned(p.id))

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`${tc.cardBg} rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-xl font-bold ${tc.text}`}>{sportConfig.icon} Lineup Builder</h2>
            <p className={tc.textMuted}>{team.name} vs {event.opponent_name || 'TBD'} • {sport}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            {/* Position Slots - Generic for all sports */}
            <div>
              <h3 className={`font-semibold ${tc.text} mb-4`}>Starting Lineup ({starters.length}/{starterCount})</h3>

              {/* Position Grid - Adaptive based on number of positions */}
              <div className={`grid gap-3 ${
                positions.length <= 6 ? 'grid-cols-3' :
                positions.length <= 9 ? 'grid-cols-3' :
                'grid-cols-4'
              }`}>
                {positions.map(pos => {
                  const player = getPlayerInPosition(pos.id)
                  return (
                    <div
                      key={pos.id}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                        player ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]' : isDark ? 'bg-slate-900 border-slate-600 hover:border-slate-400' : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                      }`}
                      onClick={() => {
                        if (player) assignPosition(pos.id, null)
                      }}
                    >
                      {player ? (
                        <>
                          <span className={`font-bold ${tc.text} text-lg`}>#{player.jersey_number || '?'}</span>
                          <span className={`text-xs ${tc.textMuted} truncate w-full text-center px-1`}>{player.first_name}</span>
                          {hasLibero && player.id === liberoId && <span className="text-[10px] text-amber-400">LIBERO</span>}
                        </>
                      ) : (
                        <>
                          <span className="text-slate-400 font-semibold">{pos.name}</span>
                          <span className="text-[10px] text-slate-500 text-center px-1">{pos.label}</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className={`text-xs ${tc.textMuted} mt-3`}>Click a filled position to remove player</p>

              {/* Starters count */}
              <div className={`mt-4 p-3 rounded-xl ${tc.cardBgAlt} flex items-center justify-between`}>
                <span className={tc.text}>Starters: {starters.length}/{starterCount}</span>
                {starters.length >= starterCount && <span className="text-emerald-400 text-sm">✓ Lineup complete</span>}
              </div>
            </div>

            {/* Available Players */}
            <div>
              <h3 className={`font-semibold ${tc.text} mb-4`}>Available Players ({availablePlayers.length})</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {roster.map(player => {
                  const assigned = isPlayerAssigned(player.id)
                  const isLibero = player.id === liberoId

                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-xl flex items-center justify-between transition ${
                        assigned
                          ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                          : isDark ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <img src={player.photo_url} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                            {player.jersey_number || '?'}
                          </div>
                        )}
                        <div>
                          <p className={`font-medium ${tc.text}`}>
                            {player.first_name} {player.last_name}
                            {isLibero && <span className="ml-2 text-xs text-amber-400 bg-amber-400/20 px-1.5 py-0.5 rounded">LIBERO</span>}
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>
                            #{player.jersey_number} • {player.position || 'No position'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Libero toggle - only for sports that have it */}
                        {hasLibero && (
                          <button
                            onClick={() => toggleLibero(player.id)}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${
                              isLibero ? 'bg-amber-500 text-black' : `${tc.cardBg} ${tc.textMuted} hover:text-amber-400`
                            }`}
                            title="Toggle Libero"
                          >
                            L
                          </button>
                        )}

                        {/* Position assignment dropdown */}
                        {!assigned && (
                          <select
                            onChange={e => {
                              if (e.target.value) assignPosition(parseInt(e.target.value), player.id)
                            }}
                            className={`px-2 py-1 rounded text-sm ${tc.input}`}
                            defaultValue=""
                          >
                            <option value="">Assign...</option>
                            {positions.map(pos => (
                              <option key={pos.id} value={pos.id} disabled={!!getPlayerInPosition(pos.id)}>
                                {pos.name} {getPlayerInPosition(pos.id) ? '(filled)' : ''}
                              </option>
                            ))}
                          </select>
                        )}

                        {assigned && (
                          <span className="text-xs text-[var(--accent-primary)]">
                            {positions.find(p => p.id === lineup.find(l => l.player_id === player.id)?.rotation_order)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {roster.length === 0 && (
                  <p className={`text-center py-8 ${tc.textMuted}`}>No players on roster</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`p-4 border-t ${tc.border} flex justify-between`}>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text}`}>
            Cancel
          </button>
          <button
            onClick={saveLineup}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Lineup'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LineupBuilder
