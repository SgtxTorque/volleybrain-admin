// =============================================================================
// LineupPanel — court view, rotation, bench, libero selector
// =============================================================================

import CourtPlayerCard, { positionColors } from './CourtPlayerCard'
import { VOLLEYBALL_POSITIONS, GAME_MODES, Icons } from './GameDayHelpers'

// ═══ BENCH PLAYER CARD ═══
function BenchPlayerCard({ player, rsvpStatus, onDragStart, onDragEnd, onClick, theme }) {
  const posColor = positionColors[player?.position || player?.team_position] || '#6366F1'
  const rsvpStyles = { yes: 'border-l-emerald-500', attending: 'border-l-emerald-500', maybe: 'border-l-amber-500', no: 'border-l-red-500' }

  return (
    <div draggable
      onDragStart={(e) => { e.dataTransfer.setData('playerId', player.id); onDragStart?.(player) }}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(player)}
      className={`flex items-center gap-3 p-3 rounded-xl border-l-4 ${rsvpStyles[rsvpStatus] || 'border-l-slate-600'} cursor-grab active:cursor-grabbing transition-all`}
      style={{ backgroundColor: theme?.cardBg }}>
      {player.photo_url ? (
        <img src={player.photo_url} className="w-12 h-12 rounded-lg object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: posColor }}>
          {player.jersey_number || '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-lg truncate" style={{ color: theme?.textPrimary }}>{player.first_name} {player.last_name?.[0]}.</p>
        <p className="text-base" style={{ color: theme?.textMuted }}>#{player.jersey_number} • {player.position || player.team_position || '—'}</p>
      </div>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold text-white" style={{ backgroundColor: `${posColor}80` }}>
        {player.position || player.team_position || '?'}
      </div>
    </div>
  )
}

export default function LineupPanel({
  roster, lineup, liberoId, rotation, rsvps, mode,
  draggedPlayer, stats, theme,
  getPlayerAtPosition, handleDrop, setDraggedPlayer,
  setSelectedPlayer, setLiberoId,
}) {
  const benchPlayers = roster.filter(p => !Object.values(lineup).includes(p.id) && p.id !== liberoId)

  function renderCourtRow(positions) {
    return positions.map(posId => {
      const pos = VOLLEYBALL_POSITIONS.find(p => p.id === posId)
      const playerId = getPlayerAtPosition(posId)
      const player = roster.find(p => p.id === playerId)
      return (
        <CourtPlayerCard key={posId} player={player} position={pos}
          isServing={posId === 1} isLibero={player?.id === liberoId}
          stats={stats[player?.id]}
          onTap={mode === GAME_MODES.LIVE ? setSelectedPlayer : undefined}
          onDrop={handleDrop(posId)}
          isDragging={draggedPlayer?.id === player?.id}
          showStats={mode === GAME_MODES.LIVE} theme={theme} />
      )
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Court area */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-7">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Rotation indicator */}
          {(mode === GAME_MODES.PRE_GAME || mode === GAME_MODES.LIVE) && (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => {/* handled by parent */}} className="p-2 rounded-xl transition" style={{ backgroundColor: theme.buttonBg }}>
                <Icons.ChevronLeft className="w-5 h-5" style={{ color: theme.textMuted }} />
              </button>
              <div className="px-6 py-2 rounded-xl" style={{ backgroundColor: theme.buttonBg }}>
                <span className="text-amber-400 font-bold">Rotation {rotation + 1}</span>
                <span className="ml-2" style={{ color: theme.textMuted }}>/ 6</span>
              </div>
              <button onClick={() => {/* handled by parent */}} className="p-2 rounded-xl transition" style={{ backgroundColor: theme.buttonBg }}>
                <Icons.ChevronRight className="w-5 h-5" style={{ color: theme.textMuted }} />
              </button>
            </div>
          )}

          {/* Court */}
          <div className="rounded-3xl p-4 lg:p-6" style={{ backgroundColor: theme.courtBg, border: `1px solid ${theme.courtBorder}` }}>
            {/* Net */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-lg" style={{ background: theme.netBg }}>
                <div className="w-8 h-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <span className="text-base font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>NET</span>
                <div className="w-8 h-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>
            {/* Front Row */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-3">{renderCourtRow([4, 3, 2])}</div>
            {/* Attack Line */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: theme.attackLine }} />
              <span className="text-sm text-orange-400 font-bold tracking-wider">ATTACK LINE</span>
              <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: theme.attackLine }} />
            </div>
            {/* Back Row */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4">{renderCourtRow([5, 6, 1])}</div>
          </div>
        </div>
      </div>

      {/* Sidebar — bench + libero */}
      <div className="w-full border-t" style={{ borderColor: theme.border, backgroundColor: theme.sidebarBg }}>
        <div className="p-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: theme.textPrimary }}>
            <Icons.Users className="w-4 h-4" style={{ color: theme.textMuted }} />
            {mode === GAME_MODES.LIVE ? 'Bench' : 'Available Players'}
          </h3>
          <p className="text-base mt-1" style={{ color: theme.textMuted }}>
            {mode === GAME_MODES.PRE_GAME ? 'Drag players to court positions' : `${benchPlayers.length} on bench`}
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto p-5 space-y-3">
          {benchPlayers.length === 0 ? (
            <div className="text-center py-4">
              <Icons.Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-medium" style={{ color: theme.textMuted }}>All players assigned!</p>
            </div>
          ) : benchPlayers.map(player => (
            <BenchPlayerCard key={player.id} player={player} rsvpStatus={rsvps[player.id]}
              onDragStart={setDraggedPlayer} onDragEnd={() => setDraggedPlayer(null)}
              onClick={mode === GAME_MODES.LIVE ? setSelectedPlayer : undefined} theme={theme} />
          ))}
        </div>

        {/* Libero selector */}
        {mode === GAME_MODES.PRE_GAME && roster.some(p => p.position === 'L' || p.team_position === 'L') && (
          <div className="p-5" style={{ borderTop: `1px solid ${theme.border}` }}>
            <label className="text-base font-medium mb-2 block" style={{ color: theme.textMuted }}>Libero</label>
            <select value={liberoId || ''} onChange={(e) => setLiberoId(e.target.value || null)}
              className="w-full px-4 py-3 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ backgroundColor: theme.buttonBg, border: `1px solid ${theme.border}`, color: theme.textPrimary }}>
              <option value="">Select Libero</option>
              {roster.filter(p => p.position === 'L' || p.team_position === 'L').map(p => (
                <option key={p.id} value={p.id}>#{p.jersey_number} {p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
