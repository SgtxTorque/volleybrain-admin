// =============================================================================
// UpcomingEventsCard — Event rows matching v0 upcoming-events.tsx
// =============================================================================

import React from 'react'
import { ArrowRight, Calendar } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const EVENT_COLORS = ['#0d9488', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function UpcomingEventsCard({ events, onNavigate }) {
  const { isDark } = useTheme()

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
          Upcoming Events
        </h3>
        <button
          onClick={() => onNavigate('schedule')}
          className="flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: isDark ? '#5eead4' : '#0d9488' }}
        >
          Full Calendar
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className={`overflow-hidden rounded-xl shadow-sm ${isDark ? 'bg-slate-800 border border-white/[0.06]' : 'bg-white'}`}>
        {events && events.length > 0 ? (
          events.slice(0, 5).map((event, i) => {
            const teamColor = event.teams?.color || EVENT_COLORS[i % EVENT_COLORS.length]
            const teamName = event.teams?.name || event.title || 'Event'
            const opponent = event.opponent_name || event.opponent

            return (
              <div
                key={event.id || i}
                className={`flex items-center gap-4 px-6 py-4 transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                } ${i > 0 ? (isDark ? 'border-t border-white/[0.06]' : 'border-t border-slate-100') : ''}`}
                onClick={() => onNavigate('schedule')}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: teamColor + '18' }}
                >
                  <Calendar className="h-5 w-5" style={{ color: teamColor }} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {teamName}
                    {opponent && (
                      <>
                        {' '}
                        <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'} style={{ fontWeight: 'normal' }}>vs</span>{' '}
                        <span className="text-amber-500">{opponent}</span>
                      </>
                    )}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{event.location || ''}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDate(event.event_date)}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{formatTime(event.event_time)}</p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-6 py-8 text-center">
            <Calendar className={`h-10 w-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>No upcoming events</p>
          </div>
        )}
      </div>
    </section>
  )
}
