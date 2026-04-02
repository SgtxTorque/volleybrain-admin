import { useTheme, useThemeClasses } from '../../../../contexts/ThemeContext'

const ROLE_COLORS = {
  // Offense
  QB: '#EF4444',
  RB: '#F59E0B',
  FB: '#F59E0B',
  WR: '#3B82F6',
  TE: '#10B981',
  OL: '#6B7280',
  OT: '#6B7280',
  OG: '#6B7280',
  C: '#8B5CF6',
  // Defense
  DL: '#EF4444',
  DE: '#EF4444',
  DT: '#EF4444',
  LB: '#F59E0B',
  MLB: '#F59E0B',
  OLB: '#F59E0B',
  DB: '#3B82F6',
  CB: '#3B82F6',
  S: '#3B82F6',
  FS: '#3B82F6',
  SS: '#3B82F6',
  // Special teams
  K: '#8B5CF6',
  P: '#8B5CF6',
  LS: '#8B5CF6',
  H: '#8B5CF6',
  KR: '#3B82F6',
  PR: '#3B82F6',
}

// Zone-to-coordinate mapping (percentage-based, relative to the field container).
// The field is oriented with the offense at the bottom and the defensive/deep zones toward the top.
const ZONE_COORDS = {
  // Offensive line — horizontal row at ~62% from top (near line of scrimmage)
  'line-left-tackle':   { top: '62%', left: '25%' },
  'line-left-guard':    { top: '62%', left: '35%' },
  'line-center':        { top: '62%', left: '50%' },
  'line-right-guard':   { top: '62%', left: '65%' },
  'line-right-tackle':  { top: '62%', left: '75%' },
  'line-right-end':     { top: '62%', left: '85%' },

  // Backfield — behind the offensive line
  'backfield-center':   { top: '78%', left: '50%' },
  'backfield-left':     { top: '78%', left: '32%' },
  'backfield-right':    { top: '78%', left: '68%' },

  // Split receivers — wide, on the line of scrimmage
  'split-left':         { top: '62%', left: '8%' },
  'split-right':        { top: '62%', left: '92%' },

  // Defensive line — just above the line of scrimmage
  'dline-left':         { top: '48%', left: '30%' },
  'dline-left-center':  { top: '48%', left: '43%' },
  'dline-right-center': { top: '48%', left: '57%' },
  'dline-right':        { top: '48%', left: '70%' },

  // Linebackers — behind d-line
  'lb-left':            { top: '35%', left: '28%' },
  'lb-center':          { top: '35%', left: '50%' },
  'lb-right':           { top: '35%', left: '72%' },

  // Secondary — deep field
  'secondary-left':       { top: '22%', left: '20%' },
  'secondary-right':      { top: '22%', left: '80%' },
  'secondary-deep-left':  { top: '10%', left: '35%' },
  'secondary-deep-right': { top: '10%', left: '65%' },

  // Special teams — various field positions
  'kicker':       { top: '88%', left: '50%' },
  'punter':       { top: '88%', left: '50%' },
  'snapper':      { top: '62%', left: '50%' },
  'holder':       { top: '78%', left: '60%' },
  'returner':     { top: '10%', left: '50%' },
  'punt-returner': { top: '10%', left: '50%' },
}

function PlayerSlot({ position, player, playerRole, isDark, tc, coords, onDrop, onDragOver, onDragStart, onDragEnd, onRemove }) {
  const displayRole = player ? (playerRole || position.role) : position.role
  const roleColor = ROLE_COLORS[displayRole] || '#64748B'

  if (!coords) return null

  return (
    <div
      className={`absolute rounded-lg border-2 transition-all cursor-default select-none overflow-hidden ${
        player
          ? 'border-transparent shadow-lg'
          : isDark ? 'border-dashed border-white/20 bg-black/30' : 'border-dashed border-white/40 bg-white/20'
      }`}
      style={{
        width: 130,
        height: 75,
        top: coords.top,
        left: coords.left,
        transform: 'translate(-50%, -50%)',
      }}
      draggable={!!player}
      onDragStart={player ? (e) => onDragStart(e, player) : undefined}
      onDragEnd={player ? onDragEnd : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {player ? (
        <>
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black leading-none">#{player.jersey_number}</span>
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold rounded text-white flex-shrink-0"
                style={{ backgroundColor: roleColor }}
              >
                {displayRole}
              </span>
            </div>
            <div className="text-xs font-medium leading-tight truncate mt-0.5 text-white/80 max-w-full px-1">
              {player.first_name}
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute top-0 right-0 w-5 h-5 rounded-bl bg-black/60 hover:bg-red-500 text-white flex items-center justify-center text-xs transition-opacity backdrop-blur-sm"
            style={{ opacity: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            x
          </button>
        </>
      ) : (
        /* Empty slot */
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded text-white"
            style={{ backgroundColor: roleColor }}
          >
            {position.role}
          </span>
          <span className="text-[11px] font-medium text-white/60 leading-tight mt-0.5 text-center px-1 truncate max-w-full">
            {position.name}
          </span>
        </div>
      )}
    </div>
  )
}

export default function FootballField({
  positions, lineup, roster, sportConfig, playerRoles,
  getPlayerAtPosition, isPositionSubbed, onDrop, onRemovePlayer,
  onDragStart, onDragEnd,
  onAutoFill, onClearLineup, onCopyToAllSets, isComplete, starterCount, maxStarters
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Field colors
  const fieldColor = isDark ? '#0f5132' : '#16a34a'
  const fieldColorDarker = isDark ? '#0a3d25' : '#15803d'
  const lineColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.85)'
  const lineWidth = isDark ? 1.5 : 2
  const endZoneColor = isDark ? '#0a3d25' : '#15803d'

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

  // Resolve coordinates for a position based on its zone field
  function getCoords(position) {
    if (position.zone && ZONE_COORDS[position.zone]) {
      return ZONE_COORDS[position.zone]
    }
    // Fallback: try to match by position id or name
    return null
  }

  // Yard line Y positions (field runs from y=10 at top to y=390 at bottom in the SVG,
  // with the end zone at bottom). We show yard lines at roughly 20% intervals.
  // Field is ~380 units tall. Line of scrimmage at ~57% from top.
  const yardLineYPositions = [
    { y: 90,  label: '40' },
    { y: 160, label: '30' },
    { y: 230, label: '20' },
    { y: 300, label: '10' },
  ]

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
          Copy to all quarters
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

      {/* Field container */}
      <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
        <div className="relative w-full" style={{ maxWidth: 960, aspectRatio: '600 / 450' }}>
          {/* SVG Football Field */}
          <svg
            viewBox="0 0 600 450"
            className="w-full h-full block"
            style={{ borderRadius: 16, overflow: 'hidden' }}
          >
            {/* Field background */}
            <rect x="0" y="0" width="600" height="450" fill={fieldColor} rx="12" />

            {/* Subtle grass stripe pattern */}
            {Array.from({ length: 15 }, (_, i) => (
              <rect
                key={`stripe-${i}`}
                x="0"
                y={i * 30}
                width="600"
                height="15"
                fill={fieldColorDarker}
                opacity="0.2"
              />
            ))}

            {/* End zone at bottom */}
            <rect
              x="15" y="370" width="570" height="70"
              fill={endZoneColor}
              stroke={lineColor}
              strokeWidth={lineWidth}
              rx="4"
            />
            {/* END ZONE text */}
            <text
              x="300" y="410"
              textAnchor="middle"
              fill={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)'}
              fontSize="28"
              fontWeight="900"
              letterSpacing="12"
              fontFamily="system-ui, sans-serif"
            >
              END ZONE
            </text>

            {/* Field boundary */}
            <rect
              x="15" y="10" width="570" height="430"
              fill="none"
              stroke={lineColor}
              strokeWidth={lineWidth}
              rx="4"
            />

            {/* Sideline labels */}
            <text
              x="8" y="230"
              textAnchor="middle"
              fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)'}
              fontSize="10"
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
              transform="rotate(-90, 8, 230)"
            >
              SIDELINE
            </text>
            <text
              x="592" y="230"
              textAnchor="middle"
              fill={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.25)'}
              fontSize="10"
              fontWeight="700"
              fontFamily="system-ui, sans-serif"
              transform="rotate(90, 592, 230)"
            >
              SIDELINE
            </text>

            {/* Yard lines */}
            {yardLineYPositions.map(({ y, label }) => (
              <g key={`yard-${y}`}>
                <line
                  x1="15" y1={y}
                  x2="585" y2={y}
                  stroke={lineColor}
                  strokeWidth={lineWidth * 0.8}
                />
                {/* Yard number — left side */}
                <text
                  x="40" y={y + 4}
                  textAnchor="middle"
                  fill={isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.45)'}
                  fontSize="14"
                  fontWeight="800"
                  fontFamily="system-ui, sans-serif"
                >
                  {label}
                </text>
                {/* Yard number — right side */}
                <text
                  x="560" y={y + 4}
                  textAnchor="middle"
                  fill={isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.45)'}
                  fontSize="14"
                  fontWeight="800"
                  fontFamily="system-ui, sans-serif"
                >
                  {label}
                </text>
              </g>
            ))}

            {/* Hash marks along each yard line area */}
            {Array.from({ length: 12 }, (_, i) => {
              const y = 55 + i * 28
              if (y > 365) return null
              return (
                <g key={`hash-${i}`}>
                  {/* Left hash */}
                  <line
                    x1="195" y1={y}
                    x2="195" y2={y + 6}
                    stroke={lineColor}
                    strokeWidth={lineWidth * 0.5}
                  />
                  {/* Right hash */}
                  <line
                    x1="405" y1={y}
                    x2="405" y2={y + 6}
                    stroke={lineColor}
                    strokeWidth={lineWidth * 0.5}
                  />
                  {/* Left sideline hash */}
                  <line
                    x1="30" y1={y}
                    x2="30" y2={y + 6}
                    stroke={lineColor}
                    strokeWidth={lineWidth * 0.5}
                  />
                  {/* Right sideline hash */}
                  <line
                    x1="570" y1={y}
                    x2="570" y2={y + 6}
                    stroke={lineColor}
                    strokeWidth={lineWidth * 0.5}
                  />
                </g>
              )
            })}

            {/* Line of scrimmage — prominent dashed line */}
            <line
              x1="15" y1="345"
              x2="585" y2="345"
              stroke={isDark ? '#60a5fa' : '#3b82f6'}
              strokeWidth="2.5"
              strokeDasharray="8 4"
              opacity="0.7"
            />
            {/* LOS label */}
            <text
              x="300" y="340"
              textAnchor="middle"
              fill={isDark ? '#60a5fa' : '#3b82f6'}
              fontSize="9"
              fontWeight="700"
              opacity="0.6"
              fontFamily="system-ui, sans-serif"
            >
              LINE OF SCRIMMAGE
            </text>

            {/* 50-yard line at top of visible field */}
            <line
              x1="15" y1="25"
              x2="585" y2="25"
              stroke={lineColor}
              strokeWidth={lineWidth * 1.2}
            />
            <text
              x="300" y="20"
              textAnchor="middle"
              fill={isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.45)'}
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              50
            </text>
          </svg>

          {/* Position drop zones — absolutely positioned over the SVG */}
          {positions.map(pos => {
            const coords = getCoords(pos)
            if (!coords) return null

            return (
              <PlayerSlot
                key={pos.id}
                position={pos}
                player={getPlayer(pos.id)}
                playerRole={getPlayerRole(pos.id)}
                isDark={isDark}
                tc={tc}
                coords={coords}
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
