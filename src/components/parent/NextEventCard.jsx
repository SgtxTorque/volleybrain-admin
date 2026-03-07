// =============================================================================
// NextEventCard — Hero card with sport-specific background images
// Auto-rotates between next game and next practice with dot indicators
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { MapPin, Calendar } from 'lucide-react'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return (hour % 12 || 12) + ':' + minutes + ' ' + ampm
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function getEventBackground(eventType) {
  const isPractice = (eventType || '').toLowerCase().includes('practice')
  return isPractice ? '/images/volleyball-practice.jpg' : '/images/volleyball-game.jpg'
}

export default function NextEventCard({ event, events = [], onNavigate, onRsvp }) {
  const { isDark } = useTheme()
  const [activeEventIndex, setActiveEventIndex] = useState(0)
  const [fading, setFading] = useState(false)

  // Gather upcoming events — next game + next practice (deduplicated)
  const upcomingEvents = useMemo(() => {
    const allEvents = events.length > 0 ? events : (event ? [event] : [])
    if (allEvents.length === 0) return []

    let nextGame = null
    let nextPractice = null

    for (const evt of allEvents) {
      const type = (evt.event_type || '').toLowerCase()
      if (type === 'game' && !nextGame) nextGame = { ...evt, _type: 'game' }
      else if ((type === 'practice' || type === 'training') && !nextPractice) nextPractice = { ...evt, _type: 'practice' }
      if (nextGame && nextPractice) break
    }

    const result = []
    if (nextGame) result.push(nextGame)
    if (nextPractice) result.push(nextPractice)
    // If neither matched, just show the first event
    if (result.length === 0 && allEvents.length > 0) result.push({ ...allEvents[0], _type: allEvents[0].event_type })
    return result
  }, [events, event])

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (upcomingEvents.length <= 1) return
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActiveEventIndex(prev => (prev + 1) % upcomingEvents.length)
        setFading(false)
      }, 300)
    }, 8000)
    return () => clearInterval(interval)
  }, [upcomingEvents.length])

  // No events — calm empty state
  if (upcomingEvents.length === 0) {
    return (
      <div
        className="rounded-2xl overflow-hidden h-full relative"
        style={{
          backgroundImage: `url('/images/SleepLynx.png')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3560 60%, #0D1B3E 100%)',
        }}
      >
        <div className="relative p-4 h-full flex flex-col items-center justify-center text-center">
          <Calendar className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-r-lg font-bold text-white">No upcoming events</p>
          <p className="text-r-sm text-white/60 mt-1">The schedule is clear — enjoy the downtime!</p>
          <button
            onClick={() => onNavigate?.('schedule')}
            className="mt-4 px-6 py-2 rounded-xl bg-lynx-sky text-white text-sm font-bold hover:brightness-110 transition"
          >
            View Full Schedule
          </button>
        </div>
      </div>
    )
  }

  const currentEvent = upcomingEvents[activeEventIndex] || upcomingEvents[0]
  const bgImage = getEventBackground(currentEvent.event_type || currentEvent._type)

  const isGame = (currentEvent.event_type || '').toLowerCase() === 'game'
  const title = isGame
    ? `Game vs ${currentEvent.opponent_name || 'TBD'}`
    : (currentEvent.title || currentEvent.event_type?.charAt(0).toUpperCase() + currentEvent.event_type?.slice(1) || 'Practice')
  const dateLabel = formatEventDate(currentEvent.event_date)
  const timeLabel = formatTime12(currentEvent.event_time || currentEvent.start_time)
  const venue = currentEvent.venue_name || currentEvent.location || ''

  return (
    <div
      className="relative rounded-2xl overflow-hidden h-full"
      style={{
        backgroundImage: `url('${bgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-lynx-navy/90 via-lynx-navy/70 to-lynx-navy/50" />

      <div className={`relative z-10 p-4 h-full flex flex-col transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Tag row — pulsing dot + label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-dot-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-emerald-400">
            {dateLabel === 'Today' ? 'TODAY' : 'NEXT EVENT'}
          </span>
          {timeLabel && (
            <span className="text-[10px] font-medium text-white/60">· {timeLabel}</span>
          )}
        </div>

        {/* Event title */}
        <h3 className="text-r-xl font-extrabold text-white mb-2 leading-tight line-clamp-2">
          {title}
        </h3>

        {/* Date + Location */}
        {dateLabel !== 'Today' && (
          <p className="text-sm text-white/70 mb-1">
            {dateLabel}{timeLabel ? ` at ${timeLabel}` : ''}
          </p>
        )}
        {venue && (
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 text-white/60" />
            <span className="text-sm text-white/60 truncate">{venue}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onRsvp?.(currentEvent)}
            className="flex-1 py-2.5 rounded-xl bg-lynx-sky text-white text-sm font-bold hover:brightness-110 transition"
          >
            RSVP
          </button>
          {venue && (
            <button
              onClick={() => {
                const q = encodeURIComponent(currentEvent.venue_address || venue)
                window.open(`https://maps.google.com/?q=${q}`, '_blank')
              }}
              className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/80 text-sm font-bold hover:bg-white/10 transition"
            >
              Directions
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {upcomingEvents.length > 1 && (
          <div className="flex gap-2 justify-center mt-3">
            {upcomingEvents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFading(true)
                  setTimeout(() => {
                    setActiveEventIndex(idx)
                    setFading(false)
                  }, 300)
                }}
                className={`rounded-full transition-all ${
                  idx === activeEventIndex
                    ? 'w-2.5 h-2.5 bg-white'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
