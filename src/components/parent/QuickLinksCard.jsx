// =============================================================================
// QuickLinksCard — 2×6 navigation grid for parents (12 shortcuts)
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'

const LINKS = [
  { emoji: '📅', label: 'Full Schedule', page: 'schedule' },
  { emoji: '💳', label: 'Payments', page: 'payments' },
  { emoji: '👥', label: 'Team Hub', page: 'team-hub' },
  { emoji: '📊', label: 'Leaderboards', page: 'leaderboards' },
  { emoji: '💬', label: 'Team Chat', page: 'chats' },
  { emoji: '📋', label: 'My Stuff', page: 'my-stuff' },
  { emoji: '🏆', label: 'Achievements', page: 'achievements' },
  { emoji: '🏐', label: 'Standings', page: 'standings' },
  { emoji: '📚', label: 'Archives', page: 'season-archives' },
  { emoji: '🏢', label: 'Directory', page: 'org-directory' },
  { emoji: '📧', label: 'Contact Coach', page: 'chats' },
  { emoji: '📍', label: 'Directions', page: null },
]

export default function QuickLinksCard({ onNavigate }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  const handleClick = (link) => {
    if (link.page) {
      onNavigate?.(link.page)
    } else {
      // Directions — open maps with a generic search
      window.open('https://maps.google.com', '_blank')
    }
  }

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col overflow-hidden`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Quick Links
      </h3>

      <div className="grid grid-cols-2 gap-1.5 flex-1 overflow-y-auto">
        {LINKS.map(link => (
          <button
            key={link.label}
            onClick={() => handleClick(link)}
            className={`flex items-center gap-1.5 px-2 py-2 rounded-lg transition-colors text-left ${
              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-base flex-shrink-0">{link.emoji}</span>
            <span className={`text-r-xs font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {link.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
