import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

/**
 * Full sport catalog — the canonical list of sports Lynx supports.
 * Matches the org settings picker in SetupSectionContent.
 */
const ALL_SPORTS = [
  { code: 'volleyball',      name: 'Volleyball',    emoji: '🏐', color: '#FFB800' },
  { code: 'basketball',      name: 'Basketball',    emoji: '🏀', color: '#EF6C00' },
  { code: 'soccer',          name: 'Soccer',        emoji: '⚽', color: '#2E7D32' },
  { code: 'baseball',        name: 'Baseball',      emoji: '⚾', color: '#C62828' },
  { code: 'softball',        name: 'Softball',      emoji: '🥎', color: '#E91E63' },
  { code: 'flag_football',   name: 'Flag Football', emoji: '🏈', color: '#6A1B9A' },
  { code: 'swimming',        name: 'Swimming',      emoji: '🏊', color: '#0288D1' },
  { code: 'track_and_field', name: 'Track & Field', emoji: '🏃', color: '#FF6D00' },
  { code: 'tennis',          name: 'Tennis',         emoji: '🎾', color: '#558B2F' },
  { code: 'golf',            name: 'Golf',           emoji: '⛳', color: '#2E7D32' },
  { code: 'cheerleading',    name: 'Cheerleading',  emoji: '📣', color: '#E91E63' },
  { code: 'gymnastics',      name: 'Gymnastics',    emoji: '🤸', color: '#7B1FA2' },
]

/**
 * SportGridSelector — 12-sport catalog grid for program creation.
 *
 * Shows the full sport catalog (not limited to DB records).
 * When a sport is selected, it returns the code, name, and emoji.
 * The parent component is responsible for creating the sport record
 * in the DB if it doesn't already exist.
 *
 * Props:
 * @param {string|null} selectedCode - currently selected sport code (e.g. 'volleyball')
 * @param {function} onSelect - callback: (code, name, emoji) or (null, '', null) for custom
 * @param {Set} usedCodes - sport codes that already have programs (greyed out)
 * @param {boolean} showCustomTile - whether to show the "Custom" tile (default: true)
 * @param {string|null} editingCode - if editing an existing program, don't grey out its own sport
 *
 * Legacy prop support (for existing callers using sport IDs):
 * @param {string|null} selectedSportId - falls back to code-based matching via DB sports
 * @param {Set} usedSportIds - falls back to code-based matching via DB sports
 * @param {string|null} editingSportId - falls back to code-based matching via DB sports
 */
export default function SportGridSelector({
  selectedCode,
  onSelect,
  usedCodes = new Set(),
  showCustomTile = true,
  editingCode = null,
  // Legacy props — support callers still using sport UUIDs
  selectedSportId,
  usedSportIds,
  editingSportId,
}) {
  const { sports: dbSports } = useSport()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Build a lookup from DB sport records: code → id, id → code
  const codeToId = {}
  const idToCode = {}
  for (const s of dbSports || []) {
    const c = s.code?.toLowerCase() || s.name?.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (c) {
      codeToId[c] = s.id
      idToCode[s.id] = c
    }
  }

  // Resolve legacy UUID-based props to code-based
  const resolvedSelected = selectedCode
    || (selectedSportId ? idToCode[selectedSportId] : undefined)
  const resolvedUsed = usedCodes.size > 0
    ? usedCodes
    : new Set(
        [...(usedSportIds || [])].map(id => idToCode[id]).filter(Boolean)
      )
  const resolvedEditing = editingCode
    || (editingSportId ? idToCode[editingSportId] : null)

  const handleSelect = (sport) => {
    if (sport === null) {
      // Custom tile
      onSelect(null, '', null)
      return
    }
    // For legacy callers expecting (sportId, sportName, sportIcon):
    // pass the DB sport ID if it exists, otherwise pass the code as a temporary identifier
    const dbId = codeToId[sport.code] || `__code:${sport.code}`
    onSelect(dbId, sport.name, sport.emoji)
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {ALL_SPORTS.map(sport => {
        const isUsed = resolvedUsed.has(sport.code) && sport.code !== resolvedEditing
        const isSelected = resolvedSelected === sport.code
          || (selectedSportId && codeToId[sport.code] === selectedSportId)

        return (
          <button
            key={sport.code}
            type="button"
            disabled={isUsed}
            onClick={() => !isUsed && handleSelect(sport)}
            className={`
              relative px-2 py-2 rounded-xl text-center transition-all border-2
              ${isSelected
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                : isUsed
                  ? `${tc.border} opacity-50 cursor-not-allowed ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`
                  : `${tc.border} ${isDark ? 'hover:border-slate-600 bg-white/[0.03]' : 'hover:border-slate-300 bg-white'} cursor-pointer`
              }
            `}
            title={isUsed ? `${sport.name} program already exists` : sport.name}
          >
            {isUsed && (
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-400/60 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}

            <span className="text-lg block">{sport.emoji}</span>
            <p className={`text-xs font-medium mt-0.5 truncate ${isUsed ? 'text-slate-400' : isSelected ? tc.text : tc.textMuted}`}>
              {sport.name}
            </p>
          </button>
        )
      })}

      {/* Custom tile */}
      {showCustomTile && (
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`
            px-2 py-2 rounded-xl text-center transition-all border-2 border-dashed
            ${selectedSportId === null && selectedSportId !== undefined
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
              : `border-slate-300 ${isDark ? 'bg-white/[0.03] hover:border-slate-500' : 'bg-white hover:border-slate-400 hover:bg-slate-50'} cursor-pointer`
            }
          `}
        >
          <span className="text-lg block">✨</span>
          <p className={`text-xs font-medium mt-0.5 ${tc.textMuted}`}>Custom</p>
        </button>
      )}
    </div>
  )
}

export { ALL_SPORTS }
