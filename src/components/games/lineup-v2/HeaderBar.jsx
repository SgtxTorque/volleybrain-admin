import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

export default function HeaderBar({
  team, event, formation, formations,
  currentSet, totalSets, lineup, sportConfig,
  liberoId, saving,
  onSetChange, onAddSet, onSave, onClose
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const starterCount = Object.keys(lineup).length
  const maxStarters = sportConfig?.starterCount || 6
  const isComplete = starterCount >= maxStarters
  const formationName = formations?.[formation]?.name || formation

  return (
    <div
      className={`flex items-center justify-between px-4 flex-shrink-0 ${
        isDark ? 'bg-lynx-charcoal border-b border-lynx-border-dark' : 'bg-white border-b border-lynx-silver'
      }`}
      style={{ height: 56 }}
    >
      {/* Left: Close + Team vs Opponent */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.hoverBg} ${tc.textSecondary}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="min-w-0">
          <span className={`font-bold text-sm ${tc.text} truncate`}>{team?.name}</span>
          {event?.opponent_name && (
            <span className={`text-sm ${tc.textMuted} ml-2`}>vs {event.opponent_name}</span>
          )}
        </div>
      </div>

      {/* Center: Set Tabs */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNum => (
          <button
            key={setNum}
            onClick={() => onSetChange(setNum)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              currentSet === setNum
                ? 'text-white'
                : `${tc.textSecondary} ${tc.hoverBg}`
            }`}
            style={currentSet === setNum ? { backgroundColor: 'var(--accent-primary)' } : {}}
          >
            Set {setNum}
          </button>
        ))}
        {totalSets < (sportConfig?.maxSets || 5) && (
          <button
            onClick={onAddSet}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${tc.textMuted} ${tc.hoverBg}`}
          >
            +
          </button>
        )}
      </div>

      {/* Right: Starters + Formation + Save */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${tc.textMuted}`}>
          {starterCount}/{maxStarters}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost'
          } ${tc.textSecondary}`}
        >
          {formationName}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isComplete
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {isComplete ? '✓ Valid' : `${starterCount}/${maxStarters}`}
        </span>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {saving ? 'Saving...' : 'Save Lineup'}
        </button>
      </div>
    </div>
  )
}
