import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

export default function ControlBar({
  currentRotation, sportConfig, formation, formations,
  lineup, currentSet,
  onNextRotation, onPrevRotation, onResetRotation,
  onFormationChange, onAutoFill, onClearLineup, onCopyToAllSets
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const rotationCount = sportConfig?.rotationCount || 6
  const starterCount = Object.keys(lineup).length
  const maxStarters = sportConfig?.starterCount || 6
  const isComplete = starterCount >= maxStarters

  return (
    <div
      className={`flex items-center justify-between px-4 flex-shrink-0 ${
        isDark ? 'bg-lynx-charcoal border-t border-lynx-border-dark' : 'bg-white border-t border-lynx-silver'
      }`}
      style={{ height: 56 }}
    >
      {/* Left: Rotation Navigation */}
      <div className="flex items-center gap-1">
        {sportConfig?.hasRotations && (
          <>
            <button
              onClick={onPrevRotation}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${tc.textSecondary} ${tc.hoverBg}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: rotationCount }, (_, i) => i).map(rot => (
              <button
                key={rot}
                onClick={() => onResetRotation(rot)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  currentRotation === rot
                    ? 'text-white'
                    : `${tc.textMuted} ${tc.hoverBg}`
                }`}
                style={currentRotation === rot ? { backgroundColor: 'var(--accent-primary)' } : {}}
              >
                {rot + 1}
              </button>
            ))}
            <button
              onClick={onNextRotation}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${tc.textSecondary} ${tc.hoverBg}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Center: Formation Selector */}
      <div className="flex items-center gap-2">
        <select
          value={formation}
          onChange={e => onFormationChange(e.target.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none ${
            isDark
              ? 'bg-lynx-graphite border-lynx-border-dark text-white'
              : 'bg-lynx-frost border-lynx-silver text-lynx-navy'
          }`}
        >
          {Object.entries(formations || {}).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
      </div>

      {/* Right: Actions + Status */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCopyToAllSets}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Copy to all sets
        </button>
        <button
          onClick={onAutoFill}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Auto-Fill
        </button>
        <button
          onClick={onClearLineup}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold text-red-400 ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Clear
        </button>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          isComplete
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {isComplete ? 'Lineup Valid ✓' : `Incomplete ${starterCount}/${maxStarters}`}
        </span>
      </div>
    </div>
  )
}
