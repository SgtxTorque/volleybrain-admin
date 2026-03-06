// =============================================================================
// QuickLinksCard — Navigation shortcuts for parents
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Calendar, CreditCard, Users, ChevronRight } from 'lucide-react'

const LINKS = [
  { icon: Calendar, emoji: '📅', label: 'View Full Schedule', page: 'schedule' },
  { icon: CreditCard, emoji: '💳', label: 'Payment History', page: 'payments' },
  { icon: Users, emoji: '🏠', label: 'Team Roster', page: 'teams' },
]

export default function QuickLinksCard({ onNavigate }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col overflow-hidden`}>
      <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Quick Links
      </h3>

      <div className="flex-1 flex flex-col justify-center overflow-y-auto">
        {LINKS.map((link, idx) => (
          <button
            key={link.page}
            onClick={() => onNavigate?.(link.page)}
            className={`flex items-center gap-2 px-2 py-2 rounded-lg transition ${
              isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
            } ${idx > 0 ? (isDark ? 'border-t border-white/[0.04]' : 'border-t border-slate-100') : ''}`}
          >
            <span className="text-sm flex-shrink-0">{link.emoji}</span>
            <span className={`flex-1 text-r-sm font-semibold text-left truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {link.label}
            </span>
            <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
