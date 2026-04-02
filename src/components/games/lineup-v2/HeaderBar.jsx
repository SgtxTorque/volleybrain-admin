import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

export default function HeaderBar({
  team, event, formation, formations,
  currentSet, totalSets, lineup, sportConfig,
  liberoId, saving,
  onSetChange, onAddSet, onSave, onClose,
  onSaveTemplate, onLoadTemplate, onFormationChange
}) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const starterCount = Object.keys(lineup).length
  const maxStarters = sportConfig?.starterCount || 6
  const isComplete = starterCount >= maxStarters

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
          {event?.opponent_name ? (
            <span className={`text-sm ${tc.textMuted} ml-2`}>vs {event.opponent_name}</span>
          ) : !event?.id ? (
            <span className={`text-sm ${tc.textMuted} ml-2`}>— Practice Lineup</span>
          ) : null}
        </div>
      </div>

      {/* Center: Set Tabs + Formation Selector */}
      <div className="flex items-center gap-2">
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
            {sportConfig?.timePeriod?.abbrev || 'Set'}{setNum}
          </button>
        ))}
        {totalSets < (sportConfig?.timePeriod?.max || sportConfig?.maxSets || 5) && (
          <button
            onClick={onAddSet}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${tc.textMuted} ${tc.hoverBg}`}
          >
            +
          </button>
        )}
        {/* Formation selector — moved from control bar */}
        <div className={`w-px h-5 mx-1 ${isDark ? 'bg-lynx-border-dark' : 'bg-lynx-silver'}`} />
        <select
          value={formation}
          onChange={e => onFormationChange(e.target.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
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

      {/* Right: Status + Templates + Save */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isComplete
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {isComplete ? `✓ ${starterCount}/${maxStarters}` : `${starterCount}/${maxStarters}`}
        </span>
        <button
          onClick={onLoadTemplate}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Load
        </button>
        <button
          onClick={onSaveTemplate}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${tc.textMuted} ${tc.hoverBg} border ${
            isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'
          }`}
        >
          Save As
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {saving ? 'Saving...' : event?.id ? 'Save Lineup' : 'Save Template'}
        </button>
      </div>
    </div>
  )
}
