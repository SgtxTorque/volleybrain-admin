import { useTheme, useThemeClasses } from '../../../../contexts/ThemeContext'
import { FORMATION_PHASES, PHASE_CONFIG } from '../../../../constants/formationPhases'

const ROLE_COLORS = {
  OH: '#EF4444', S: '#10B981', MB: '#F59E0B', OPP: '#6366F1',
  L: '#FFEAA7', DS: '#DDA0DD', H: '#EF4444',
  PG: '#3B82F6', SG: '#10B981', SF: '#F59E0B', PF: '#EF4444', C: '#8B5CF6',
  GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444',
}

function PlayerSlot({ position, player, playerRole, isServing, isSubbedIn, phaseSlot, courtPhase, isDark, tc, onDrop, onDragOver, onDragStart, onDragEnd, onRemove }) {
  // For filled cards, use the player's assigned role; for empty slots, use the position's role
  const displayRole = player ? (playerRole || position.role) : position.role
  const roleColor = ROLE_COLORS[displayRole] || '#64748B'
  const phaseColor = courtPhase ? (PHASE_CONFIG[courtPhase]?.color || '#64748B') : null

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all cursor-default select-none ${
        player
          ? courtPhase ? 'shadow-lg' : 'border-transparent shadow-lg'
          : isDark ? 'border-dashed border-lynx-border-dark bg-lynx-charcoal/50' : 'border-dashed border-lynx-silver bg-lynx-frost/50'
      }`}
      style={{
        width: 'clamp(160px, 14vw, 210px)',
        height: 'clamp(200px, 18vw, 270px)',
        borderColor: courtPhase && player ? phaseColor + '60' : undefined,
      }}
      draggable={!!player}
      onDragStart={player ? (e) => onDragStart(e, player) : undefined}
      onDragEnd={player ? onDragEnd : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {player ? (
        <>
          {/* Full photo background */}
          {player.photo_url ? (
            <img
              src={player.photo_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className={`absolute inset-0 ${
              isDark
                ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
                : 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400'
            }`}>
              <span className={`absolute inset-0 flex items-center justify-center text-6xl font-black ${
                isDark ? 'text-white/20' : 'text-slate-500/30'
              }`}>
                #{player.jersey_number}
              </span>
            </div>
          )}

          {/* Dark gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <div className="flex items-end justify-between gap-1">
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none">#{player.jersey_number}</div>
                <div className="text-sm font-medium leading-tight truncate mt-0.5 text-white/90">
                  {player.first_name}
                </div>
              </div>
              <span
                className="px-2 py-0.5 text-[10px] font-bold rounded-md text-white flex-shrink-0"
                style={{ backgroundColor: roleColor }}
              >
                {displayRole}
              </span>
            </div>
          </div>

          {/* Remove button (appears on hover) */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
            style={{ opacity: undefined }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            ×
          </button>

          {/* Serving indicator */}
          {isServing && (
            <span className="absolute top-1.5 left-1.5 text-base drop-shadow-md">🏐</span>
          )}

          {/* Substitution badge */}
          {isSubbedIn && (
            <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-md">
              SUB
            </div>
          )}

          {/* Phase role target badge */}
          {phaseSlot && courtPhase && (
            <div
              className="absolute bottom-[52px] right-2 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold shadow-md"
              style={{ backgroundColor: phaseColor || '#64748B' }}
            >
              {phaseSlot.label}
            </div>
          )}
        </>
      ) : (
        /* Empty slot */
        <div className="flex flex-col items-center justify-center h-full gap-1.5">
          <span className={`text-5xl font-black ${isDark ? 'text-white/[0.06]' : 'text-lynx-navy/[0.06]'}`}>
            {position.id}
          </span>
          <span className={`text-xs font-semibold ${tc.textMuted}`}>{position.name}</span>
          <span
            className="px-2 py-0.5 text-[9px] font-bold rounded-md text-white"
            style={{ backgroundColor: roleColor }}
          >
            {position.role}
          </span>
          <span className={`text-[10px] ${tc.textMuted}`}>Drop here</span>
        </div>
      )}
    </div>
  )
}

export default function VolleyballCourt({
  positions, lineup, roster, currentRotation,
  liberoId, sportConfig, playerRoles,
  courtPhase, courtPhaseRotation, formation,
  getPlayerAtPosition, isPositionSubbed, onDrop, onRemovePlayer,
  onDragStart, onDragEnd,
  // Action buttons (moved from ControlBar)
  onAutoFill, onClearLineup, onCopyToAllSets, isComplete, starterCount, maxStarters
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
    const player = roster.find(p => p.id === playerId) || null
    return player
  }

  function getPlayerRole(positionId) {
    const playerId = getPlayerAtPosition(positionId)
    if (!playerId || !playerRoles) return null
    return playerRoles[playerId] || null
  }

  // Get phase slot info for a position when viewing a formation phase
  function getPhaseSlot(positionId) {
    if (!courtPhase || !courtPhaseRotation || !formation) return null
    const phaseData = FORMATION_PHASES[formation]?.[courtPhase]?.[courtPhaseRotation]
    if (!phaseData) return null

    // Map position IDs to phase position names
    // P4=front-left, P3=front-center, P2=front-right
    // P5=back-left, P6=back-center, P1=back-right
    const posToPhase = { 4: 'front-left', 3: 'front-center', 2: 'front-right', 5: 'back-left', 6: 'back-center', 1: 'back-right' }
    const phasePos = posToPhase[positionId]
    return phaseData.slots.find(s => s.position === phasePos) || null
  }

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
    <div className={`flex-1 flex flex-col items-center justify-center p-4 relative min-h-0 ${
      isDark ? 'bg-lynx-charcoal' : 'bg-white'
    }`}>
      {/* Action buttons — centered above court */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <button
          onClick={onCopyToAllSets}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Copy to all sets
        </button>
        <button
          onClick={onAutoFill}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Auto-Fill
        </button>
        <button
          onClick={onClearLineup}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-400 ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Clear
        </button>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
          isComplete
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {isComplete ? 'Lineup Valid ✓' : `Incomplete ${starterCount}/${maxStarters}`}
        </span>
      </div>

      {/* NET label */}
      <div className={`w-full max-w-[700px] text-center text-xs font-bold tracking-widest uppercase mb-4 flex-shrink-0 ${tc.textMuted}`}>
        <div className={`border-t-2 ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} pt-1`}>
          NET
        </div>
      </div>

      {/* Front row */}
      <div className="flex gap-5 mb-4 flex-shrink-0">
        {frontRow.map(pos => (
          <PlayerSlot
            key={pos.id}
            position={pos}
            player={getPlayer(pos.id)}
            playerRole={getPlayerRole(pos.id)}
            isServing={pos.id === 1}
            isSubbedIn={isPositionSubbed?.(pos.id)}
            phaseSlot={getPhaseSlot(pos.id)}
            courtPhase={courtPhase}
            isDark={isDark}
            tc={tc}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSlot(e, pos.id)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onRemove={() => onRemovePlayer(pos.id)}
          />
        ))}
      </div>

      {/* Attack line */}
      <div className={`w-full max-w-[700px] text-center text-[10px] font-semibold tracking-widest uppercase mb-4 flex-shrink-0 ${tc.textMuted}`}>
        <div className={`border-t border-dashed ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} pt-1`}>
          ATTACK LINE
        </div>
      </div>

      {/* Back row */}
      <div className="flex gap-5 flex-shrink-0">
        {backRow.map(pos => (
          <PlayerSlot
            key={pos.id}
            position={pos}
            player={getPlayer(pos.id)}
            playerRole={getPlayerRole(pos.id)}
            isServing={pos.id === 1}
            isSubbedIn={isPositionSubbed?.(pos.id)}
            phaseSlot={getPhaseSlot(pos.id)}
            courtPhase={courtPhase}
            isDark={isDark}
            tc={tc}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSlot(e, pos.id)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onRemove={() => onRemovePlayer(pos.id)}
          />
        ))}
      </div>

      {/* Libero indicator */}
      {liberoId && (
        <div className={`mt-4 flex items-center gap-2 text-xs ${tc.textMuted} flex-shrink-0`}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: '#FFEAA7', color: '#000' }}>L</span>
          Libero: {roster.find(p => p.id === liberoId)?.first_name || 'Assigned'}
        </div>
      )}
    </div>
  )
}
