// =============================================================================
// PracticeHeroCard — Practice event hero with sport-specific background
// =============================================================================

import { Calendar, MapPin, Clock, ChevronRight, Users } from 'lucide-react'

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

export default function PracticeHeroCard({ event, selectedTeam, rsvpCount = 0, rosterSize = 0, onNavigate }) {
  if (!event) return null
  const heroImage = '/images/volleyball-practice.jpg'

  return (
    <div className="relative rounded-2xl overflow-hidden h-full">
      <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-lynx-navy/90 via-lynx-navy/75 to-lynx-navy/60" />

      <div className="relative z-10 p-5 flex flex-col justify-between h-full">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-r-xs font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Clock className="w-3 h-3" />
            PRACTICE
          </span>

          <p className="text-r-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            {selectedTeam?.name}
          </p>

          <h2 className="text-2xl font-black text-white tracking-wide mb-2 leading-tight">
            {event.title || 'Practice'}
          </h2>

          <div className="flex flex-col gap-1 text-r-sm text-slate-400 mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {formatDateShort(event.event_date)}
              {event.event_time ? ` · ${formatTime12(event.event_time)}` : ''}
            </span>
            {event.venue_name && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{event.venue_name}</span>
              </span>
            )}
          </div>

          {rosterSize > 0 && (
            <div className="flex items-center gap-1.5 text-r-sm text-slate-300 mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>{rsvpCount} / {rosterSize} confirmed</span>
            </div>
          )}

          <button
            onClick={() => onNavigate?.('schedule')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:brightness-110 text-white text-r-sm font-bold transition"
          >
            Open Practice Plan
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
