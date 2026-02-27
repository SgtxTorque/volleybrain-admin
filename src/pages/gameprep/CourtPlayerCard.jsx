// ============================================
// PLAYER CARD ON COURT
// ============================================

// Position colors used by court player cards
const positionColors = {
  'OH': '#FF6B6B', 'S': '#4ECDC4', 'MB': '#45B7D1', 'OPP': '#96CEB4',
  'L': '#FFEAA7', 'DS': '#DDA0DD', 'RS': '#FF9F43', 'H': '#FF6B6B',
}

function PulseRing({ color = '#F59E0B', size = 48 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="absolute rounded-full animate-ping opacity-30"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          animationDuration: '1.5s'
        }}
      />
    </div>
  )
}

function CourtPlayerCard({
  player,
  position,
  isServing,
  isLibero,
  isSelected,
  stats = {},
  onTap,
  onDrop,
  isDragging,
  showStats = false,
  theme,
}) {
  const posColor = positionColors[player?.position || player?.team_position] || '#6366F1'
  const totalPoints = (stats.kills || 0) + (stats.aces || 0) + (stats.blocks || 0)
  const isHot = totalPoints >= 5

  if (!player) {
    return (
      <div
        className="relative aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
        style={{
          backgroundColor: theme?.emptySlotBg || 'rgba(30, 41, 59, 0.3)',
          borderColor: theme?.emptySlotBorder || '#475569',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: `${posColor}30`, color: posColor }}
        >
          {position?.name}
        </div>
        <span className="text-xs" style={{ color: theme?.textMuted || '#64748b' }}>{position?.label}</span>
        {isServing && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-xs">🏐</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all
                  ${isSelected ? 'ring-4 ring-amber-400 scale-105' : 'hover:scale-102'}
                  ${isDragging ? 'opacity-50' : ''}`}
      style={{
        background: theme?.isDark
          ? `linear-gradient(135deg, ${posColor}40 0%, ${posColor}10 100%)`
          : `linear-gradient(135deg, ${posColor}30 0%, ${posColor}05 100%)`,
        boxShadow: isHot ? `0 0 30px ${posColor}40` : theme?.isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
      }}
      onClick={() => onTap?.(player)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Hot player indicator */}
      {isHot && <PulseRing color={posColor} />}

      {/* Position badge */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg"
          style={{ backgroundColor: posColor }}
        >
          {player.position || player.team_position || position?.name}
        </div>
      </div>

      {/* Jersey number - top right */}
      <div className="absolute top-2 right-2 z-10">
        <span
          className="text-2xl font-black"
          style={{ color: theme?.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' }}
        >
          #{player.jersey_number || '?'}
        </span>
      </div>

      {/* Serving indicator */}
      {isServing && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="px-2 py-1 bg-amber-500 rounded-full text-xs font-bold text-black flex items-center gap-1">
            <span>🏐</span> SERVE
          </div>
        </div>
      )}

      {/* Player photo or placeholder */}
      <div className="absolute inset-0 flex items-center justify-center pt-8">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.first_name}
            className="w-full h-full object-cover"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 70%, transparent 100%)'
            }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme?.isDark ? '#334155' : '#e2e8f0' }}
          >
            <span
              className="text-2xl font-bold"
              style={{ color: theme?.textMuted || '#64748b' }}
            >
              {player.first_name?.[0]}{player.last_name?.[0]}
            </span>
          </div>
        )}
      </div>

      {/* Name bar at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 p-3 pt-8"
        style={{ background: theme?.playerCardGradient || 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7), transparent)' }}
      >
        <p className="text-amber-400 font-bold text-sm leading-tight">{player.first_name}</p>
        <p className="text-white font-black text-base leading-tight truncate">{player.last_name?.toUpperCase()}</p>

        {/* Live stats row */}
        {showStats && (
          <div className="flex gap-3 mt-2 pt-2 border-t border-white/10">
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{stats.kills || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Kills</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.aces || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Aces</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-400">{stats.digs || 0}</p>
              <p className="text-[9px] text-slate-400 uppercase">Digs</p>
            </div>
          </div>
        )}
      </div>

      {/* Libero indicator */}
      {isLibero && (
        <div className="absolute top-12 left-2">
          <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-bold rounded">L</span>
        </div>
      )}
    </div>
  )
}

export default CourtPlayerCard
export { positionColors }
