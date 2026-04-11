const CURATED_ICONS = [
  { emoji: '🏆', label: 'Trophy' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🏅', label: 'Medal' },
  { emoji: '🏋️', label: 'Weightlifting' },
  { emoji: '🤼', label: 'Wrestling' },
  { emoji: '🏊', label: 'Swimming' },
  { emoji: '🎾', label: 'Tennis' },
  { emoji: '⛳', label: 'Golf' },
  { emoji: '📣', label: 'Cheer' },
  { emoji: '🤸', label: 'Gymnastics' },
  { emoji: '🏒', label: 'Hockey' },
  { emoji: '🥊', label: 'Boxing' },
  { emoji: '🏄', label: 'Surfing' },
  { emoji: '🎪', label: 'Circus' },
  { emoji: '🦁', label: 'Lynx' },
]

/**
 * CuratedIconPicker — simple 4x4 emoji grid for custom program icons
 *
 * @param {string|null} selectedIcon - currently selected emoji
 * @param {function} onSelect - callback with emoji string
 * @param {object} tc - theme classes from useThemeClasses()
 * @param {boolean} isDark - dark mode flag
 */
export default function CuratedIconPicker({ selectedIcon, onSelect, tc, isDark }) {
  return (
    <div>
      <label className={`block text-sm ${tc?.textMuted || 'text-slate-600'} mb-2`}>
        Choose an icon
      </label>
      <div className="grid grid-cols-8 gap-1">
        {CURATED_ICONS.map(({ emoji, label }) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            title={label}
            className={`
              w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all
              ${selectedIcon === emoji
                ? 'bg-lynx-sky/20 ring-2 ring-lynx-sky'
                : isDark
                  ? 'bg-white/[0.05] hover:bg-white/10'
                  : 'bg-slate-50 hover:bg-slate-100'
              }
            `}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
