import { useTheme, useThemeClasses } from '../../../../contexts/ThemeContext'

const ROLE_COLORS = {
  PG: '#3B82F6',
  SG: '#10B981',
  SF: '#F59E0B',
  PF: '#EF4444',
  C: '#8B5CF6',
}

// Position layout on the half-court (percentage-based for responsive positioning)
// Basket is at bottom-center, center court line at top
const POSITION_LAYOUT = {
  1: { top: '12%',  left: '50%',  label: 'PG' },   // PG — top of key
  2: { top: '30%',  left: '82%',  label: 'SG' },   // SG — right wing
  3: { top: '68%',  left: '82%',  label: 'SF' },   // SF — right corner
  4: { top: '30%',  left: '18%',  label: 'PF' },   // PF — left elbow
  5: { top: '55%',  left: '50%',  label: 'C'  },   // C  — paint area
}

function PlayerSlot({ position, player, playerRole, isDark, tc, onDrop, onDragOver, onDragStart, onDragEnd, onRemove }) {
  const displayRole = player ? (playerRole || position.role) : position.role
  const roleColor = ROLE_COLORS[displayRole] || '#64748B'

  return (
    <div
      className={`absolute rounded-2xl border-2 transition-all cursor-default select-none ${
        player
          ? 'border-transparent shadow-lg'
          : isDark ? 'border-dashed border-lynx-border-dark bg-lynx-charcoal/50' : 'border-dashed border-lynx-silver bg-lynx-frost/50'
      }`}
      style={{
        width: 'clamp(130px, 12vw, 180px)',
        height: 'clamp(170px, 15vw, 230px)',
        top: POSITION_LAYOUT[position.id]?.top,
        left: POSITION_LAYOUT[position.id]?.left,
        transform: 'translate(-50%, -50%)',
        overflow: 'hidden',
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
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-opacity backdrop-blur-sm"
            style={{ opacity: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            x
          </button>
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

export default function BasketballCourt({
  positions, lineup, roster, currentRotation,
  sportConfig, playerRoles,
  getPlayerAtPosition, isPositionSubbed, onDrop, onRemovePlayer,
  onDragStart, onDragEnd,
  onAutoFill, onClearLineup, onCopyToAllSets, isComplete, starterCount, maxStarters
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Court colors
  const floorColor = isDark ? '#2d1f0e' : '#c4893b'
  const floorColorDarker = isDark ? '#231808' : '#a87530'
  const lineColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)'
  const lineWidth = isDark ? 2 : 2.5

  function getPlayer(positionId) {
    const playerId = getPlayerAtPosition(positionId)
    if (!playerId) return null
    return roster.find(p => p.id === playerId) || null
  }

  function getPlayerRole(positionId) {
    const playerId = getPlayerAtPosition(positionId)
    if (!playerId || !playerRoles) return null
    return playerRoles[playerId] || null
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
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <button
          onClick={onCopyToAllSets}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Copy to all periods
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
          {isComplete ? 'Lineup Valid' : `Incomplete ${starterCount}/${maxStarters}`}
        </span>
      </div>

      {/* Court container */}
      <div className="relative flex-1 w-full max-w-[720px] flex items-center justify-center min-h-0">
        <div className="relative w-full" style={{ maxWidth: 600, aspectRatio: '600 / 400' }}>
          {/* SVG Half-Court */}
          <svg
            viewBox="0 0 600 400"
            className="w-full h-full block"
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            {/* Floor background */}
            <rect x="0" y="0" width="600" height="400" fill={floorColor} rx="12" />

            {/* Hardwood plank lines — subtle horizontal stripes */}
            {Array.from({ length: 20 }, (_, i) => (
              <line
                key={`plank-${i}`}
                x1="0"
                y1={i * 20}
                x2="600"
                y2={i * 20}
                stroke={floorColorDarker}
                strokeWidth="0.5"
                opacity="0.3"
              />
            ))}

            {/* Court boundary */}
            <rect
              x="20" y="10" width="560" height="380"
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
              rx="4"
            />

            {/* Center court line (top edge = half-court line) */}
            <line
              x1="20" y1="10"
              x2="580" y2="10"
              stroke={lineColor}
              strokeWidth={lineWidth + 1}
            />

            {/* Center circle (at top, along half-court line) */}
            <path
              d={`M ${300 - 60} 10 A 60 60 0 0 1 ${300 + 60} 10`}
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
            />

            {/* Free throw lane / paint (rectangular area near basket) */}
            <rect
              x="220" y="260" width="160" height="130"
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
              rx="2"
            />

            {/* Free throw circle (at top of lane) */}
            <circle
              cx="300" cy="260"
              r="60"
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
              strokeDasharray="6 4"
            />
            {/* Solid half of free throw circle (bottom half, inside lane) */}
            <path
              d={`M ${300 - 60} 260 A 60 60 0 0 1 ${300 + 60} 260`}
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
            />

            {/* 3-point arc */}
            <path
              d={`
                M 60 390
                L 60 280
                A 170 170 0 0 1 540 280
                L 540 390
              `}
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
            />

            {/* Restricted area arc (small semicircle around basket) */}
            <path
              d={`M ${300 - 40} 390 A 40 40 0 0 1 ${300 + 40} 390`}
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
            />

            {/* Basket — rim circle */}
            <circle
              cx="300" cy="372"
              r="9"
              fill="none"
              stroke="#FF6B35"
              strokeWidth="2.5"
            />

            {/* Backboard */}
            <line
              x1="270" y1="385"
              x2="330" y2="385"
              stroke={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.9)'}
              strokeWidth="3"
            />

            {/* Connector from backboard to rim */}
            <line
              x1="300" y1="381"
              x2="300" y2="385"
              stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)'}
              strokeWidth="1.5"
            />

            {/* Lane hash marks (tick marks on paint sides) */}
            {[280, 300, 320, 340, 360].map((y, i) => (
              <g key={`hash-${i}`}>
                <line x1="210" y1={y} x2="220" y2={y} stroke={lineColor} strokeWidth={lineWidth * 0.6} />
                <line x1="380" y1={y} x2="390" y2={y} stroke={lineColor} strokeWidth={lineWidth * 0.6} />
              </g>
            ))}
          </svg>

          {/* Position drop zones — absolutely positioned over the SVG */}
          {positions.map(pos => {
            const layout = POSITION_LAYOUT[pos.id]
            if (!layout) return null

            return (
              <PlayerSlot
                key={pos.id}
                position={pos}
                player={getPlayer(pos.id)}
                playerRole={getPlayerRole(pos.id)}
                isDark={isDark}
                tc={tc}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSlot(e, pos.id)}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onRemove={() => onRemovePlayer(pos.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
