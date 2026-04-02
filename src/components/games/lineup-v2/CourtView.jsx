import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

const ROLE_COLORS = {
  OH: '#EF4444', S: '#10B981', MB: '#F59E0B', OPP: '#6366F1',
  L: '#FFEAA7', DS: '#DDA0DD', H: '#EF4444',
  PG: '#3B82F6', SG: '#10B981', SF: '#F59E0B', PF: '#EF4444', C: '#8B5CF6',
  GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444',
}

function PlayerSlot({ position, player, isServing, isDark, tc, onDrop, onDragOver, onRemove }) {
  const roleColor = ROLE_COLORS[position.role] || '#64748B'

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 transition-all ${
        player
          ? isDark ? 'bg-lynx-graphite border-lynx-border-dark' : 'bg-lynx-frost border-lynx-silver'
          : isDark ? 'border-dashed border-lynx-border-dark bg-lynx-charcoal/50' : 'border-dashed border-lynx-silver bg-lynx-frost/50'
      }`}
      style={{ width: 120, height: 120, borderRadius: 'var(--v2-radius)' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Zone number watermark */}
      <span className={`absolute inset-0 flex items-center justify-center text-4xl font-black pointer-events-none select-none ${
        isDark ? 'text-white/[0.04]' : 'text-lynx-navy/[0.04]'
      }`}>
        {position.id}
      </span>

      {player ? (
        <>
          {/* Player photo */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-600/30 mb-1 relative">
            {player.photo_url ? (
              <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-base font-bold ${tc.textMuted}`}>
                {player.first_name?.[0]}{player.last_name?.[0]}
              </div>
            )}
          </div>
          {/* Jersey + Name */}
          <span className={`text-xs font-bold ${tc.text} leading-tight`}>
            #{player.jersey_number}
          </span>
          <span className={`text-[10px] ${tc.textMuted} leading-tight truncate max-w-[100px]`}>
            {player.first_name}
          </span>
          {/* Role badge */}
          <span
            className="mt-0.5 px-1.5 py-0 text-[9px] font-bold rounded-full text-white"
            style={{ backgroundColor: roleColor }}
          >
            {position.role}
          </span>
          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </>
      ) : (
        <>
          <span className={`text-xs font-medium ${tc.textMuted} mb-1`}>{position.name}</span>
          <span
            className="px-1.5 py-0 text-[9px] font-bold rounded-full text-white"
            style={{ backgroundColor: roleColor }}
          >
            {position.role}
          </span>
          <span className={`text-[9px] ${tc.textMuted} mt-1`}>Drop here</span>
        </>
      )}

      {/* Serving indicator */}
      {isServing && (
        <span className="absolute -top-2 -left-2 text-sm">🏐</span>
      )}
    </div>
  )
}

export default function CourtView({
  positions, lineup, roster, currentRotation,
  liberoId, sportConfig,
  getPlayerAtPosition, onDrop, onRemovePlayer
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Separate front and back row positions
  const frontRow = positions.filter(p => p.row === 'front').sort((a, b) => {
    const order = { 4: 0, 3: 1, 2: 2 }
    return (order[a.id] ?? a.id) - (order[b.id] ?? b.id)
  })
  const backRow = positions.filter(p => p.row === 'back').sort((a, b) => {
    const order = { 5: 0, 6: 1, 1: 2 }
    return (order[a.id] ?? a.id) - (order[b.id] ?? b.id)
  })

  function getPlayer(positionId) {
    const playerId = getPlayerAtPosition(positionId)
    if (!playerId) return null
    return roster.find(p => p.id === playerId) || null
  }

  // Which visual position is serving? P1 is always the server in rotation 0.
  // After N rotations, the serving visual position shifts.
  const rotationOrder = [1, 2, 3, 4, 5, 6]
  const servingVisualIndex = (rotationOrder.indexOf(1) - currentRotation + 6) % 6
  const servingVisualPosId = rotationOrder[servingVisualIndex]

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDropOnSlot(e, positionId) {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    if (playerId) onDrop(positionId, playerId)
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-6 relative ${
      isDark ? 'bg-lynx-charcoal' : 'bg-white'
    }`}>
      {/* NET label */}
      <div className={`w-full max-w-[420px] text-center text-xs font-bold tracking-widest uppercase mb-3 ${tc.textMuted}`}>
        <div className={`border-t-2 ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} pt-1`}>
          NET
        </div>
      </div>

      {/* Front row */}
      <div className="flex gap-3 mb-4">
        {frontRow.map(pos => (
          <PlayerSlot
            key={pos.id}
            position={pos}
            player={getPlayer(pos.id)}
            isServing={pos.id === servingVisualPosId}
            isDark={isDark}
            tc={tc}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSlot(e, pos.id)}
            onRemove={() => onRemovePlayer(pos.id)}
          />
        ))}
      </div>

      {/* Attack line */}
      <div className={`w-full max-w-[420px] text-center text-[10px] font-semibold tracking-widest uppercase mb-4 ${tc.textMuted}`}>
        <div className={`border-t border-dashed ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} pt-1`}>
          ATTACK LINE
        </div>
      </div>

      {/* Back row */}
      <div className="flex gap-3">
        {backRow.map(pos => (
          <PlayerSlot
            key={pos.id}
            position={pos}
            player={getPlayer(pos.id)}
            isServing={pos.id === servingVisualPosId}
            isDark={isDark}
            tc={tc}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSlot(e, pos.id)}
            onRemove={() => onRemovePlayer(pos.id)}
          />
        ))}
      </div>

      {/* Libero indicator */}
      {liberoId && (
        <div className={`mt-4 flex items-center gap-2 text-xs ${tc.textMuted}`}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#FFEAA7', color: '#000' }}>L</span>
          Libero: {roster.find(p => p.id === liberoId)?.first_name || 'Assigned'}
        </div>
      )}
    </div>
  )
}
