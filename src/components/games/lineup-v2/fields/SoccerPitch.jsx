import { useTheme, useThemeClasses } from '../../../../contexts/ThemeContext'

// ============================================
// ROLE COLORS — Soccer positions
// ============================================
const ROLE_COLORS = {
  GK: '#F59E0B',
  DEF: '#3B82F6',
  MID: '#10B981',
  FWD: '#EF4444',
}

// ============================================
// ZONE-TO-COORDINATE MAPPING
// ============================================
// Returns { x, y } as percentages of the SVG viewBox (500 x 600).
// The pitch is oriented with the goal at the BOTTOM, so y increases downward.
//   y ~95%  = goal / bottom
//   y ~5%   = top of pitch (center circle area)

function zoneToCoords(zone) {
  const map = {
    // Goal — bottom center
    'goal':                  { x: 50, y: 92 },

    // Defense line — ~25% up from bottom => y ~78%
    'defense-left':          { x: 12, y: 78 },
    'defense-center-left':   { x: 32, y: 78 },
    'defense-center':        { x: 50, y: 78 },
    'defense-center-right':  { x: 68, y: 78 },
    'defense-right':         { x: 88, y: 78 },

    // Holding midfield — ~38% up => y ~65%
    'holding-left':          { x: 30, y: 65 },
    'holding-right':         { x: 70, y: 65 },

    // Midfield line — ~50% up => y ~52%
    'midfield-far-left':     { x: 5,  y: 52 },
    'midfield-left':         { x: 18, y: 52 },
    'midfield-center-left':  { x: 36, y: 52 },
    'midfield-center':       { x: 50, y: 52 },
    'midfield-center-right': { x: 64, y: 52 },
    'midfield-right':        { x: 82, y: 52 },
    'midfield-far-right':    { x: 95, y: 52 },

    // Attacking midfield — ~65% up => y ~38%
    'attacking-left':        { x: 20, y: 38 },
    'attacking-center':      { x: 50, y: 38 },
    'attacking-right':       { x: 80, y: 38 },

    // Attack / forward line — ~80% up => y ~22%
    'attack-left':           { x: 22, y: 22 },
    'attack-center':         { x: 50, y: 22 },
    'attack-right':          { x: 78, y: 22 },
  }
  return map[zone] || { x: 50, y: 50 }
}

// ============================================
// POSITION CARD (compact, for up to 11 players)
// ============================================
function PositionCard({
  position,
  player,
  playerRole,
  isSubbedIn,
  isDark,
  tc,
  onDrop,
  onDragOver,
  onDragStart,
  onDragEnd,
  onRemove,
}) {
  const displayRole = player ? (playerRole || position.role) : position.role
  const roleColor = ROLE_COLORS[displayRole] || '#64748B'

  return (
    <foreignObject
      x={-40}
      y={-30}
      width={80}
      height={60}
      style={{ overflow: 'visible' }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={`relative rounded-lg border transition-all cursor-default select-none ${
          player
            ? 'shadow-md border-transparent'
            : isDark
              ? 'border-dashed border-slate-500 bg-slate-800/70'
              : 'border-dashed border-slate-400 bg-white/70'
        }`}
        style={{
          width: 80,
          height: 60,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        draggable={!!player}
        onDragStart={player ? (e) => onDragStart(e, player) : undefined}
        onDragEnd={player ? onDragEnd : undefined}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {player ? (
          <>
            {/* Filled card — colored top strip + jersey + name */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-lg"
              style={{ backgroundColor: roleColor }}
            />
            <div className="flex flex-col items-center justify-center h-full px-1 pt-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-white leading-none">
                  #{player.jersey_number}
                </span>
                <span
                  className="px-1 py-0 text-[8px] font-bold rounded text-white leading-tight"
                  style={{ backgroundColor: roleColor }}
                >
                  {displayRole}
                </span>
              </div>
              <span className="text-[10px] font-medium text-white/80 truncate max-w-[72px] leading-tight mt-0.5">
                {player.first_name}
              </span>
            </div>

            {/* Substitution badge */}
            {isSubbedIn && (
              <div className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white text-[7px] px-1 py-0 rounded font-bold shadow">
                SUB
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center text-[10px] leading-none opacity-0 hover:opacity-100 transition-opacity"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
            >
              x
            </button>
          </>
        ) : (
          /* Empty slot */
          <div className="flex flex-col items-center justify-center h-full gap-0.5 px-1">
            <span
              className="px-1.5 py-0 text-[8px] font-bold rounded text-white"
              style={{ backgroundColor: roleColor }}
            >
              {position.role}
            </span>
            <span className={`text-[9px] font-semibold leading-tight text-center ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {position.name}
            </span>
            <span className={`text-[7px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Drop here
            </span>
          </div>
        )}
      </div>
    </foreignObject>
  )
}

// ============================================
// SOCCER PITCH SVG — half-pitch, goal at bottom
// ============================================
function PitchSVG({ isDark }) {
  const grassLight = isDark ? '#0f5132' : '#16a34a'
  const grassDark = isDark ? '#0a3d26' : '#15803d'
  const lineColor = '#ffffff'
  const lineOpacity = isDark ? 0.45 : 0.85

  // Stripe width — 8 alternating horizontal stripes
  const stripeH = 600 / 8

  return (
    <>
      {/* Grass stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={0}
          y={i * stripeH}
          width={500}
          height={stripeH}
          fill={i % 2 === 0 ? grassLight : grassDark}
        />
      ))}

      {/* Pitch outline */}
      <rect
        x={10}
        y={10}
        width={480}
        height={580}
        rx={4}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeOpacity={lineOpacity}
      />

      {/* Center line (at top, since this is half-pitch with goal at bottom) */}
      <line
        x1={10}
        y1={10}
        x2={490}
        y2={10}
        stroke={lineColor}
        strokeWidth={2.5}
        strokeOpacity={lineOpacity}
      />

      {/* Center circle (half circle at top) */}
      <path
        d={`M ${250 - 70} 10 A 70 70 0 0 1 ${250 + 70} 10`}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeOpacity={lineOpacity}
      />

      {/* Center dot */}
      <circle
        cx={250}
        cy={10}
        r={4}
        fill={lineColor}
        fillOpacity={lineOpacity}
      />

      {/* Penalty area (large box at bottom) */}
      <rect
        x={100}
        y={460}
        width={300}
        height={130}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeOpacity={lineOpacity}
      />

      {/* Goal area (small box at bottom) */}
      <rect
        x={175}
        y={530}
        width={150}
        height={60}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeOpacity={lineOpacity}
      />

      {/* Penalty arc (curved line above penalty area) */}
      <path
        d={`M 180 460 A 60 60 0 0 0 320 460`}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeOpacity={lineOpacity}
      />

      {/* Penalty spot */}
      <circle
        cx={250}
        cy={490}
        r={3}
        fill={lineColor}
        fillOpacity={lineOpacity}
      />

      {/* Goal line markers (small goal net representation) */}
      <rect
        x={200}
        y={590}
        width={100}
        height={8}
        rx={2}
        fill={lineColor}
        fillOpacity={isDark ? 0.15 : 0.25}
        stroke={lineColor}
        strokeWidth={1.5}
        strokeOpacity={lineOpacity}
      />

      {/* Corner arcs */}
      <path
        d={`M 10 580 A 12 12 0 0 0 22 590`}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeOpacity={lineOpacity}
      />
      <path
        d={`M 478 590 A 12 12 0 0 0 490 580`}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeOpacity={lineOpacity}
      />
    </>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SoccerPitch({
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

  // ------------------------------------------
  // Helpers
  // ------------------------------------------
  function getPlayer(positionId) {
    const playerId = getPlayerAtPosition(positionId)
    if (!playerId) return null
    return roster.find((p) => p.id === playerId) || null
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

  // ------------------------------------------
  // Render
  // ------------------------------------------
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center p-4 relative min-h-0 ${
        isDark ? 'bg-lynx-charcoal' : 'bg-white'
      }`}
    >
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
        <span
          className={`text-[11px] font-bold px-3 py-1 rounded-full ${
            isComplete
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {isComplete ? 'Lineup Valid' : `Incomplete ${starterCount}/${maxStarters}`}
        </span>
      </div>

      {/* Soccer Pitch SVG */}
      <div className="w-full flex-1 flex items-center justify-center min-h-0">
        <svg
          viewBox="0 0 500 600"
          className="w-full h-full max-w-[540px] max-h-[640px]"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Pitch background + lines */}
          <PitchSVG isDark={isDark} />

          {/* Player position cards */}
          {positions.map((pos) => {
            const coords = zoneToCoords(pos.zone)
            const px = (coords.x / 100) * 500
            const py = (coords.y / 100) * 600
            const player = getPlayer(pos.id)
            const role = getPlayerRole(pos.id)

            return (
              <g key={pos.id} transform={`translate(${px}, ${py})`}>
                <PositionCard
                  position={pos}
                  player={player}
                  playerRole={role}
                  isSubbedIn={isPositionSubbed?.(pos.id)}
                  isDark={isDark}
                  tc={tc}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSlot(e, pos.id)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onRemove={() => onRemovePlayer(pos.id)}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
