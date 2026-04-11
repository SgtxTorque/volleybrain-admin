import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

/**
 * SportGridSelector — grid of sport tiles for program creation
 *
 * Props:
 * @param {string|null} selectedSportId - currently selected sport UUID
 * @param {function} onSelect - callback with (sportId, sportName, sportIcon) or (null, null, null) for custom
 * @param {Set} usedSportIds - sport IDs that already have programs (greyed out)
 * @param {boolean} showCustomTile - whether to show the "Custom" tile (default: true)
 * @param {string|null} editingSportId - if editing an existing program, don't grey out its own sport
 */
export default function SportGridSelector({
  selectedSportId,
  onSelect,
  usedSportIds = new Set(),
  showCustomTile = true,
  editingSportId = null
}) {
  const { sports } = useSport()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {(sports || []).map(sport => {
        const isUsed = usedSportIds.has(sport.id) && sport.id !== editingSportId
        const isSelected = selectedSportId === sport.id

        return (
          <button
            key={sport.id}
            type="button"
            disabled={isUsed}
            onClick={() => !isUsed && onSelect(sport.id, sport.name, sport.icon)}
            className={`
              relative p-3 rounded-[14px] text-center transition-all border-2
              ${isSelected
                ? 'border-lynx-sky bg-lynx-sky/10'
                : isUsed
                  ? `${tc.border} opacity-50 cursor-not-allowed ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`
                  : `${tc.border} ${isDark ? 'hover:border-slate-600 bg-white/[0.03]' : 'hover:border-slate-300 bg-white'} cursor-pointer`
              }
            `}
            title={isUsed ? `${sport.name} program already exists` : sport.name}
          >
            {/* Checkmark overlay for used sports */}
            {isUsed && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-400/60 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}

            <span className="text-2xl block mb-1">{sport.icon || '🏅'}</span>
            <span className={`text-xs font-medium block truncate ${isUsed ? 'text-slate-400' : isSelected ? tc.text : tc.textMuted}`}>
              {sport.name}
            </span>
          </button>
        )
      })}

      {/* Custom tile */}
      {showCustomTile && (
        <button
          type="button"
          onClick={() => onSelect(null, '', null)}
          className={`
            p-3 rounded-[14px] text-center transition-all border-2 border-dashed
            ${selectedSportId === null && selectedSportId !== undefined
              ? 'border-lynx-sky bg-lynx-sky/10'
              : `border-slate-300 ${isDark ? 'bg-white/[0.03] hover:border-slate-500' : 'bg-white hover:border-slate-400 hover:bg-slate-50'} cursor-pointer`
            }
          `}
        >
          <span className="text-2xl block mb-1">✨</span>
          <span className={`text-xs font-medium block ${tc.textMuted}`}>Custom</span>
        </button>
      )}
    </div>
  )
}
