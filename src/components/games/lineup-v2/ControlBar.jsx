import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

export default function ControlBar({
  currentRotation, sportConfig, lineup, roster,
  getPlayerAtPosition,
  onNextRotation, onPrevRotation, onResetRotation,
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const rotationCount = sportConfig?.rotationCount || 6

  // Calculate next rotation preview
  const nextRot = (currentRotation + 1) % rotationCount
  const rotationOrder = [1, 2, 3, 4, 5, 6]

  function getPlayerAtRot(positionId, rot) {
    const posIndex = rotationOrder.indexOf(positionId)
    const sourceIndex = (posIndex + rot) % 6
    const sourcePosition = rotationOrder[sourceIndex]
    const playerId = lineup[sourcePosition]
    return playerId ? roster?.find(p => p.id === playerId) : null
  }

  return (
    <div
      className={`flex items-center justify-between px-6 flex-shrink-0 ${
        isDark ? 'bg-lynx-charcoal border-t border-lynx-border-dark' : 'bg-white border-t border-lynx-silver'
      }`}
      style={{ height: 64 }}
    >
      {/* Left: Rotation Navigation */}
      <div className="flex items-center gap-2">
        {sportConfig?.hasRotations && (
          <>
            <span className={`text-[10px] font-bold uppercase tracking-widest mr-1 ${tc.textMuted}`}>Rotation</span>
            <button
              onClick={onPrevRotation}
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${tc.textSecondary} ${tc.hoverBg} border ${
                isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: rotationCount }, (_, i) => i).map(rot => (
              <button
                key={rot}
                onClick={() => onResetRotation(rot)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                  currentRotation === rot
                    ? 'text-white shadow-sm'
                    : `${tc.textMuted} ${tc.hoverBg}`
                }`}
                style={currentRotation === rot ? { backgroundColor: 'var(--accent-primary)' } : {}}
              >
                {rot + 1}
              </button>
            ))}
            <button
              onClick={onNextRotation}
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${tc.textSecondary} ${tc.hoverBg} border ${
                isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Center: Next Rotation Preview */}
      {sportConfig?.hasRotations && (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold ${tc.textMuted}`}>Next:</span>
          <div className="flex gap-0.5">
            {/* Mini preview: P4 P3 P2 | P5 P6 P1 */}
            {[4, 3, 2, 5, 6, 1].map((posId, i) => {
              const player = getPlayerAtRot(posId, nextRot)
              return (
                <div key={posId} className="flex items-center">
                  {i === 3 && <div className={`w-px h-5 mx-0.5 ${isDark ? 'bg-lynx-border-dark' : 'bg-lynx-silver'}`} />}
                  <div
                    className={`w-7 h-7 rounded text-[8px] font-bold flex items-center justify-center ${
                      player
                        ? isDark ? 'bg-lynx-graphite text-white' : 'bg-lynx-frost text-lynx-navy'
                        : isDark ? 'bg-lynx-graphite/50 text-slate-600' : 'bg-lynx-frost/50 text-slate-300'
                    }`}
                  >
                    {player ? `#${player.jersey_number}` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Right: Current rotation server info */}
      <div className="flex items-center gap-3">
        {sportConfig?.hasRotations && (() => {
          const serverPlayer = getPlayerAtRot(1, currentRotation)
          return serverPlayer ? (
            <div className={`flex items-center gap-2 text-xs ${tc.textMuted}`}>
              <span>🏐</span>
              <span className="font-semibold">Server: #{serverPlayer.jersey_number} {serverPlayer.first_name}</span>
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
}
