import { useTheme, useThemeClasses } from '../../../../contexts/ThemeContext'

const ROLE_COLORS = {
  P: '#EF4444',
  C: '#8B5CF6',
  '1B': '#3B82F6',
  '2B': '#10B981',
  SS: '#06B6D4',
  '3B': '#F59E0B',
  LF: '#84CC16',
  CF: '#22C55E',
  RF: '#14B8A6',
}

// Standard baseball diamond positions with pixel coordinates over the SVG
// The SVG viewBox is 600x500; these are percentage-based positions for overlay
const POSITION_COORDS = {
  P:    { x: 50,   y: 52,   label: 'Pitcher' },
  C:    { x: 50,   y: 82,   label: 'Catcher' },
  '1B': { x: 72,   y: 52,   label: 'First Base' },
  '2B': { x: 62,   y: 36,   label: 'Second Base' },
  SS:   { x: 38,   y: 36,   label: 'Shortstop' },
  '3B': { x: 28,   y: 52,   label: 'Third Base' },
  LF:   { x: 18,   y: 22,   label: 'Left Field' },
  CF:   { x: 50,   y: 10,   label: 'Center Field' },
  RF:   { x: 82,   y: 22,   label: 'Right Field' },
}

function DiamondSVG({ isDark }) {
  // Colors based on theme
  const grassColor = isDark ? '#166534' : '#22c55e'
  const grassDarkColor = isDark ? '#14532d' : '#16a34a'
  const dirtColor = isDark ? '#92702a' : '#d4a853'
  const dirtDarkColor = isDark ? '#7a5c1f' : '#b8923e'
  const chalkColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.95)'
  const baseColor = isDark ? '#e2e8f0' : '#ffffff'
  const moundColor = isDark ? '#a0844a' : '#c9a54e'

  // Diamond geometry (viewed from above/behind home plate)
  // Home plate at bottom center, second base at top center
  const homeX = 300, homeY = 400
  const firstX = 430, firstY = 270
  const secondX = 300, secondY = 140
  const thirdX = 170, thirdY = 270
  const moundX = 300, moundY = 275

  return (
    <svg viewBox="0 0 600 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="grassGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={grassColor} />
          <stop offset="100%" stopColor={grassDarkColor} />
        </radialGradient>
        <radialGradient id="dirtGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={dirtColor} />
          <stop offset="100%" stopColor={dirtDarkColor} />
        </radialGradient>
      </defs>

      {/* Background / outfield grass */}
      <rect x="0" y="0" width="600" height="500" fill={isDark ? '#0f1a0f' : '#1a7a3a'} />

      {/* Outfield grass arc */}
      <path
        d={`M 30 460 Q 30 20 300 20 Q 570 20 570 460 Z`}
        fill="url(#grassGrad)"
        opacity="0.9"
      />

      {/* Grass stripes (mowing pattern) */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <line
          key={`stripe-${i}`}
          x1={100 + i * 65}
          y1="20"
          x2={100 + i * 65}
          y2="460"
          stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'}
          strokeWidth="30"
        />
      ))}

      {/* Infield dirt diamond */}
      <polygon
        points={`${homeX},${homeY + 20} ${firstX + 20},${firstY} ${secondX},${secondY - 20} ${thirdX - 20},${thirdY}`}
        fill="url(#dirtGrad)"
      />

      {/* Infield grass (inside the basepaths) */}
      <polygon
        points={`${homeX},${homeY - 15} ${firstX - 10},${firstY + 5} ${secondX},${secondY + 20} ${thirdX + 10},${thirdY + 5}`}
        fill={isDark ? '#1a5c2e' : '#2ead5a'}
        opacity="0.7"
      />

      {/* Foul lines extending from home plate */}
      <line
        x1={homeX} y1={homeY}
        x2={30} y2={homeY - (homeY - 30) * (homeX - 30) / homeX}
        stroke={chalkColor}
        strokeWidth="2"
      />
      <line
        x1={homeX} y1={homeY}
        x2={570} y2={homeY - (homeY - 30) * (homeX - 30) / homeX}
        stroke={chalkColor}
        strokeWidth="2"
      />

      {/* Basepaths (chalk lines connecting bases) */}
      <line x1={homeX} y1={homeY} x2={firstX} y2={firstY} stroke={chalkColor} strokeWidth="2.5" />
      <line x1={firstX} y1={firstY} x2={secondX} y2={secondY} stroke={chalkColor} strokeWidth="2.5" />
      <line x1={secondX} y1={secondY} x2={thirdX} y2={thirdY} stroke={chalkColor} strokeWidth="2.5" />
      <line x1={thirdX} y1={thirdY} x2={homeX} y2={homeY} stroke={chalkColor} strokeWidth="2.5" />

      {/* Outfield warning track arc */}
      <path
        d={`M 45 450 Q 45 35 300 35 Q 555 35 555 450`}
        fill="none"
        stroke={isDark ? '#5c4a1e' : '#c9a54e'}
        strokeWidth="12"
        opacity="0.3"
      />

      {/* Pitcher's mound dirt circle */}
      <circle cx={moundX} cy={moundY} r="22" fill={dirtColor} />
      <circle cx={moundX} cy={moundY} r="18" fill={moundColor} opacity="0.6" />

      {/* Pitcher's rubber */}
      <rect x={moundX - 8} y={moundY - 2} width="16" height="4" fill={baseColor} rx="1" />

      {/* Bases */}
      {/* First base */}
      <rect
        x={firstX - 7} y={firstY - 7} width="14" height="14"
        fill={baseColor}
        transform={`rotate(45 ${firstX} ${firstY})`}
      />
      {/* Second base */}
      <rect
        x={secondX - 7} y={secondY - 7} width="14" height="14"
        fill={baseColor}
        transform={`rotate(45 ${secondX} ${secondY})`}
      />
      {/* Third base */}
      <rect
        x={thirdX - 7} y={thirdY - 7} width="14" height="14"
        fill={baseColor}
        transform={`rotate(45 ${thirdX} ${thirdY})`}
      />

      {/* Home plate (pentagon) */}
      <polygon
        points={`${homeX},${homeY + 10} ${homeX - 8},${homeY + 4} ${homeX - 8},${homeY - 5} ${homeX + 8},${homeY - 5} ${homeX + 8},${homeY + 4}`}
        fill={baseColor}
      />

      {/* Batter's boxes */}
      <rect x={homeX - 26} y={homeY - 15} width="14" height="30" fill="none" stroke={chalkColor} strokeWidth="1.5" rx="1" />
      <rect x={homeX + 12} y={homeY - 15} width="14" height="30" fill="none" stroke={chalkColor} strokeWidth="1.5" rx="1" />

      {/* Catcher's box */}
      <rect x={homeX - 16} y={homeY + 14} width="32" height="20" fill="none" stroke={chalkColor} strokeWidth="1" opacity="0.5" rx="1" />

      {/* On-deck circles */}
      <circle cx={homeX - 80} cy={homeY + 30} r="10" fill="none" stroke={chalkColor} strokeWidth="1" opacity="0.4" />
      <circle cx={homeX + 80} cy={homeY + 30} r="10" fill="none" stroke={chalkColor} strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

function PositionSlot({ posId, player, playerRole, isDark, tc, onDrop, onDragOver, onDragStart, onDragEnd, onRemove }) {
  const roleColor = ROLE_COLORS[posId] || '#64748B'
  const displayRole = player ? (playerRole || posId) : posId
  const displayRoleColor = ROLE_COLORS[displayRole] || roleColor
  const coords = POSITION_COORDS[posId]

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${coords.x}%`,
        top: `${coords.y}%`,
        zIndex: 10,
      }}
    >
      <div
        className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-default select-none ${
          player
            ? 'border-transparent shadow-lg'
            : isDark
              ? 'border-dashed border-lynx-border-dark bg-lynx-charcoal/80 backdrop-blur-sm'
              : 'border-dashed border-lynx-silver bg-white/80 backdrop-blur-sm'
        }`}
        style={{
          width: 'clamp(80px, 9vw, 120px)',
          height: 'clamp(95px, 11vw, 145px)',
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
                <span className={`absolute inset-0 flex items-center justify-center text-4xl font-black ${
                  isDark ? 'text-white/20' : 'text-slate-500/30'
                }`}>
                  #{player.jersey_number}
                </span>
              </div>
            )}

            {/* Dark gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-1.5 text-white">
              <div className="flex items-end justify-between gap-0.5">
                <div className="min-w-0">
                  <div className="text-lg font-black leading-none">#{player.jersey_number}</div>
                  <div className="text-[10px] font-medium leading-tight truncate mt-0.5 text-white/90">
                    {player.first_name}
                  </div>
                </div>
                <span
                  className="px-1.5 py-0.5 text-[8px] font-bold rounded-md text-white flex-shrink-0"
                  style={{ backgroundColor: displayRoleColor }}
                >
                  {displayRole}
                </span>
              </div>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 transition-opacity backdrop-blur-sm"
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              x
            </button>
          </>
        ) : (
          /* Empty slot */
          <div className="flex flex-col items-center justify-center h-full gap-1 px-1">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: roleColor }}
            >
              {posId}
            </span>
            <span className={`text-[9px] font-semibold text-center leading-tight ${tc.textMuted}`}>
              {coords.label}
            </span>
            <span className={`text-[8px] ${tc.textMuted}`}>Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BaseballDiamond({
  positions,
  lineup,
  roster,
  sportConfig,
  playerRoles,
  getPlayerAtPosition,
  isPositionSubbed,
  onDrop,
  onRemovePlayer,
  onDragStart,
  onDragEnd,
  onAutoFill,
  onClearLineup,
  onCopyToAllSets,
  isComplete,
  starterCount,
  maxStarters,
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Map position IDs from the positions array to our known baseball position keys
  // positions may come as objects with id/name/role or we derive from sportConfig
  const baseballPositions = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF']

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
    <div className={`flex-1 flex flex-col items-center justify-start p-4 relative min-h-0 ${
      isDark ? 'bg-lynx-charcoal' : 'bg-white'
    }`}>
      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap justify-center">
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
          {isComplete ? 'Lineup Complete' : `${starterCount}/${maxStarters} filled`}
        </span>
      </div>

      {/* Diamond field container */}
      <div className="relative w-full flex-1 min-h-0" style={{ maxWidth: '720px', maxHeight: '580px' }}>
        {/* SVG Field */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg">
          <DiamondSVG isDark={isDark} />
        </div>

        {/* Position drop zones overlaid on the field */}
        {baseballPositions.map(posId => {
          const posObj = positions.find(p => p.id === posId || p.role === posId) || { id: posId, name: POSITION_COORDS[posId]?.label || posId, role: posId }

          return (
            <PositionSlot
              key={posId}
              posId={posId}
              player={getPlayer(posObj.id)}
              playerRole={getPlayerRole(posObj.id)}
              isDark={isDark}
              tc={tc}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnSlot(e, posObj.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onRemove={() => onRemovePlayer(posObj.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
