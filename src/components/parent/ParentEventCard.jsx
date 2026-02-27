import { Calendar } from '../../constants/icons'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return hour12 + ':' + minutes + ' ' + ampm
}

/**
 * ParentEventCard — upcoming event with background image
 * Uses volleyball-game.jpg or volleyball-practice.jpg based on event type
 */
export default function ParentEventCard({ event, onClick }) {
  if (!event) return null

  const eventDate = new Date(event.event_date)
  const eventType = event.event_type?.toLowerCase() || ''
  const isGame = eventType === 'game' || eventType === 'match' || eventType === 'game_day'
  const isPractice = eventType === 'practice' || eventType === 'training'
  const badgeLabel = isGame ? 'Game Day' : isPractice ? 'Practice' : 'Tournament'
  const badgeColor = isGame ? 'bg-red-500' : isPractice ? 'bg-cyan-500' : 'bg-purple-500'
  const bgImage = isPractice ? '/images/volleyball-practice.jpg' : '/images/volleyball-game.jpg'

  return (
    <div
      onClick={() => onClick?.(event)}
      className="relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow shadow-md"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '130px',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <span className={`inline-block px-2 py-0.5 ${badgeColor} text-white text-[10px] font-bold uppercase rounded w-fit`}>
          {badgeLabel}
        </span>
        <div>
          <p className="text-white font-bold text-base leading-snug">
            {event.opponent_name ? `vs ${event.opponent_name}` : event.title || badgeLabel}
          </p>
          <p className="text-white/80 text-xs mt-0.5">
            {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {event.event_time && ` · ${formatTime12(event.event_time)}`}
          </p>
          {event.venue_name && <p className="text-white/60 text-xs truncate">{event.venue_name}</p>}
        </div>
      </div>
    </div>
  )
}
