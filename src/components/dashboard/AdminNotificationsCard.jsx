// =============================================================================
// AdminNotificationsCard — Auto-cycling single-line org-wide notifications
// Shows one notification at a time, fading between them every 4.5 seconds
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { Bell } from 'lucide-react'

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

// Generate org-wide notification items from live data
function buildOrgNotifications(stats, events) {
  const items = []
  const now = new Date()

  if (stats.pending > 0) {
    items.push({ emoji: '📋', text: `${stats.pending} pending registration${stats.pending > 1 ? 's' : ''} awaiting approval`, time: now.toISOString() })
  }
  if (stats.pastDue > 0) {
    const count = Math.ceil(stats.pastDue / 100)
    items.push({ emoji: '💰', text: `${count} overdue payment${count > 1 ? 's' : ''} need attention`, time: now.toISOString() })
  }
  if (events.length > 0) {
    const next = events[0]
    items.push({ emoji: '📅', text: `Next event: ${next.title || next.event_type} on ${next.event_date}`, time: now.toISOString() })
  }
  if (stats.coachCount > 0) {
    items.push({ emoji: '🏐', text: `${stats.coachCount} active coach${stats.coachCount > 1 ? 'es' : ''} across ${stats.teams || 0} teams`, time: now.toISOString() })
  }
  if (stats.totalRegistrations > 0) {
    items.push({ emoji: '📊', text: `${stats.totalRegistrations} total registrations this season`, time: now.toISOString() })
  }

  // Always have at least one item
  if (items.length === 0) {
    items.push({ emoji: '✅', text: 'All systems running smoothly', time: now.toISOString() })
  }

  return items
}

export default function AdminNotificationsCard({ stats = {}, events = [], onNavigate }) {
  const { isDark } = useTheme()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  const notifications = useMemo(() => buildOrgNotifications(stats, events), [stats, events])

  // Auto-cycle with fade transition
  useEffect(() => {
    if (notifications.length <= 1) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % notifications.length)
        setVisible(true)
      }, 400)
    }, 4500)
    return () => clearInterval(interval)
  }, [notifications.length])

  const current = notifications[currentIndex] || notifications[0]

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-3 h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Bell className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-xs font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Notifications
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {notifications.map((_, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${
              idx === currentIndex ? 'bg-lynx-sky' : isDark ? 'bg-white/10' : 'bg-slate-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Single notification line with fade */}
      <div className="flex-1 flex items-center min-h-0">
        {current && (
          <p className={`text-sm leading-relaxed transition-opacity duration-400 ${
            visible ? 'opacity-100' : 'opacity-0'
          } ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="mr-1.5">{current.emoji}</span>
            {current.text}
            <span className={`ml-2 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {timeAgo(current.time)}
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
