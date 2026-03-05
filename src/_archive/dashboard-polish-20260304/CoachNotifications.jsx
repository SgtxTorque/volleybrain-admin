// =============================================================================
// CoachNotifications — Notifications card with unread dots
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Bell } from 'lucide-react'

export default function CoachNotifications({ items = [] }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  // Default items if none provided
  const notifications = items.length > 0 ? items : [
    { id: 1, text: 'No new notifications', unread: false },
  ]

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center gap-1.5 mb-3">
        <Bell className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Notifications
        </h3>
      </div>
      <div className="space-y-1.5">
        {notifications.slice(0, 4).map((n, idx) => (
          <div key={n.id || idx} className={`flex items-start gap-2.5 p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
            {n.unread && <div className="w-2 h-2 rounded-full bg-lynx-sky mt-1.5 shrink-0" />}
            {!n.unread && <div className="w-2 h-2 rounded-full bg-transparent mt-1.5 shrink-0" />}
            <p className={`text-xs leading-relaxed ${n.unread ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
              {n.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
