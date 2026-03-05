// =============================================================================
// AlsoThisWeekCard — Flat text card showing upcoming events this week
// Auto-cycles through events, no card background/shadow/border
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

function formatEventLine(event) {
  const d = new Date(event.event_date + 'T00:00:00')
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
  const typeEmoji = event.event_type === 'game' ? '🏐' : event.event_type === 'practice' ? '⚡' : '📅'
  const timePart = event.event_time
    ? (() => {
        const [h, m] = event.event_time.split(':').map(Number)
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
      })()
    : ''

  const title = event.event_type === 'game' && event.opponent_name
    ? `Game vs ${event.opponent_name}`
    : event.title || event.event_type

  return `${typeEmoji} ${dayName} — ${title}${timePart ? ` at ${timePart}` : ''}`
}

export default function AlsoThisWeekCard({ events = [] }) {
  const { isDark } = useTheme()
  const [currentIdx, setCurrentIdx] = useState(0)

  // Filter to this week's remaining events
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()))

  const thisWeekEvents = events.filter(e => {
    const d = new Date(e.event_date + 'T00:00:00')
    return d >= now && d <= endOfWeek
  })

  // Auto-cycle every 5 seconds
  useEffect(() => {
    if (thisWeekEvents.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % thisWeekEvents.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [thisWeekEvents.length])

  if (thisWeekEvents.length === 0) return null

  // Show up to 3 stacked, or cycle if more
  const displayEvents = thisWeekEvents.length <= 3
    ? thisWeekEvents
    : [thisWeekEvents[currentIdx]]

  return (
    <div className="py-2">
      <p className={`text-r-sm font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Also this week
      </p>
      <div className="space-y-1">
        {displayEvents.map((event, i) => (
          <p
            key={event.id || i}
            className={`text-r-lg font-medium transition-opacity duration-500 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
          >
            {formatEventLine(event)}
          </p>
        ))}
      </div>
      {thisWeekEvents.length > 3 && (
        <p className={`text-r-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          +{thisWeekEvents.length - 1} more this week
        </p>
      )}
    </div>
  )
}
