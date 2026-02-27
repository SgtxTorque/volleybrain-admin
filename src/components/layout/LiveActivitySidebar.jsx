// =============================================================================
// LiveActivitySidebar — Real-time activity feed + upcoming events preview
// =============================================================================

import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Activity, ClipboardList, DollarSign, Calendar,
  Users, Clock, MapPin, ChevronRight
} from 'lucide-react'
import { VolleyballIcon } from '../../constants/icons'

// =============================================================================
// Activity Item
// =============================================================================
function ActivityItem({ item, isDark }) {
  const iconMap = {
    registration: { Icon: ClipboardList, color: '#3B82F6' },
    payment: { Icon: DollarSign, color: '#10B981' },
    event: { Icon: Calendar, color: '#4BB9EC' },
    team: { Icon: Users, color: '#8B5CF6' },
  }

  const { Icon, color } = iconMap[item.type] || iconMap.registration

  const timeAgo = (timestamp) => {
    if (!timestamp) return ''
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="flex items-start gap-3 py-2.5">
      {/* Avatar / Icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: color + '15', color }}
      >
        {item.initials || <Icon className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {item.action}
          {item.highlight && (
            <span>{' '}&mdash; {item.highlight}</span>
          )}
        </p>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {item.name && <span>{item.name}</span>}
          {item.name && item.timestamp && ' · '}
          {item.timestamp && <span>{timeAgo(item.timestamp)}</span>}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Event Preview Card
// =============================================================================
function EventPreview({ event, isDark, onNavigate }) {
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
  }

  return (
    <button
      onClick={() => onNavigate('schedule')}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition
        ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'}`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: event.teams?.color || '#3B82F6' }}
      >
        <VolleyballIcon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {event.teams?.name || event.title}
        </p>
        <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <Clock className="w-3 h-3" />
          <span>{formatDate(event.event_date)}</span>
          {event.event_time && <span>· {formatTime(event.event_time)}</span>}
        </p>
      </div>
    </button>
  )
}

// =============================================================================
// Component
// =============================================================================
export default function LiveActivitySidebar({ activities, upcomingEvents, onNavigate }) {
  const { isDark } = useTheme()

  const cardClass = isDark
    ? 'bg-lynx-charcoal/90 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
    : 'bg-white/90 backdrop-blur-xl border border-lynx-silver/50 shadow-[0_2px_20px_rgba(0,0,0,0.08)]'

  return (
    <>
      {/* Live Activity Feed */}
      <div className={`rounded-xl overflow-hidden ${cardClass}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Live Activity
              </h4>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
            {activities && activities.length > 0 ? (
              activities.slice(0, 8).map((item, i) => (
                <ActivityItem key={i} item={item} isDark={isDark} />
              ))
            ) : (
              <div className="py-6 text-center">
                <Activity className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No recent activity
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events Preview */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className={`rounded-xl overflow-hidden ${cardClass}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lynx-sky" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Coming Up
                </h4>
              </div>
              <button
                onClick={() => onNavigate('schedule')}
                className={`text-xs font-medium transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                View All
              </button>
            </div>

            <div className="space-y-1">
              {upcomingEvents.slice(0, 4).map((event, i) => (
                <EventPreview key={i} event={event} isDark={isDark} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
