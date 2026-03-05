// =============================================================================
// CoachNotifications — Enhanced notifications card with full sentences,
// emoji + event + time ago, 5+ items, two tabbed views
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Bell, Megaphone } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function CoachNotifications({ items = [], blasts = [] }) {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('recent')

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  // Default items if none provided
  const recentItems = items.length > 0 ? items : []
  const blastItems = blasts.length > 0 ? blasts : []

  const activeItems = activeTab === 'recent' ? recentItems : blastItems
  const isEmpty = activeItems.length === 0

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4 max-h-card-sm overflow-y-auto`}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Bell className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-r-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Notifications
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-2.5 py-1 rounded-lg text-r-xs font-bold transition-colors ${
              activeTab === 'recent'
                ? 'bg-lynx-sky/15 text-lynx-sky'
                : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('blasts')}
            className={`px-2.5 py-1 rounded-lg text-r-xs font-bold transition-colors flex items-center gap-1 ${
              activeTab === 'blasts'
                ? 'bg-lynx-sky/15 text-lynx-sky'
                : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Megaphone className="w-3 h-3" />
            Blasts
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="space-y-1.5">
        {isEmpty ? (
          <p className={`text-r-base py-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Nothing new — your team is quietly crushing it 🤙
          </p>
        ) : (
          activeItems.slice(0, 5).map((n, idx) => (
            <div
              key={n.id || idx}
              className={`flex items-start gap-2.5 p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
            >
              {n.unread && <div className="w-2 h-2 rounded-full bg-lynx-sky mt-2 shrink-0" />}
              {!n.unread && <div className="w-2 h-2 mt-2 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className={`text-r-base leading-relaxed ${
                  n.unread
                    ? (isDark ? 'text-white font-medium' : 'text-slate-900 font-medium')
                    : (isDark ? 'text-slate-400' : 'text-slate-500')
                }`}>
                  {n.emoji ? `${n.emoji} ` : ''}{n.text}
                </p>
                {n.time && (
                  <p className={`text-r-sm mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {timeAgo(n.time)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
