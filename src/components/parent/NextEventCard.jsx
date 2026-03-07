// =============================================================================
// NextEventCard — Dark navy hero card for the next upcoming event
// Pulsing green dot, RSVP + Directions buttons, mobile-parity tone
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { MapPin, ChevronRight } from 'lucide-react'

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

export default function NextEventCard({ event, onNavigate, onRsvp }) {
  const { isDark } = useTheme()

  if (!event) return null

  const isGame = event.event_type === 'game'
  const title = isGame
    ? `Game vs ${event.opponent_name || 'TBD'}`
    : (event.title || event.event_type?.charAt(0).toUpperCase() + event.event_type?.slice(1) || 'Practice')
  const dateLabel = formatEventDate(event.event_date)
  const timeLabel = formatTime12(event.event_time || event.start_time)
  const venue = event.venue_name || event.location || ''

  return (
    <div
      className="rounded-2xl overflow-hidden h-full"
      style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3560 60%, #0D1B3E 100%)' }}
    >
      <div className="relative p-4 h-full flex flex-col">
        {/* Volleyball decoration */}
        <div className="absolute top-3 right-4 text-3xl opacity-[0.08]">🏐</div>

        {/* Tag row — pulsing dot + label */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-dot-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-emerald-400">
            {dateLabel === 'Today' ? 'TODAY' : 'NEXT EVENT'}
          </span>
          {timeLabel && (
            <span className="text-[10px] font-medium text-white/50">· {timeLabel}</span>
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
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5 text-white/50" />
            <span className="text-sm text-white/60 truncate">{venue}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onRsvp?.(event)}
            className="flex-1 py-2.5 rounded-xl bg-lynx-sky text-white text-sm font-bold hover:brightness-110 transition"
          >
            RSVP
          </button>
          {venue && (
            <button
              onClick={() => {
                const q = encodeURIComponent(event.venue_address || venue)
                window.open(`https://maps.google.com/?q=${q}`, '_blank')
              }}
              className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/80 text-sm font-bold hover:bg-white/10 transition"
            >
              Directions
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
