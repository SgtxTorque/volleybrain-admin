// =============================================================================
// CoachScheduleCard — Upcoming 3-4 events with RSVP counts
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Calendar, ChevronRight, MapPin } from 'lucide-react'

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
}

function formatTime12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default function CoachScheduleCard({ events = [], rsvpCounts = {}, rosterSize = 0, onNavigate, onEventSelect }) {
  const { isDark } = useTheme()

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Upcoming
          </h3>
        </div>
        <button onClick={() => onNavigate?.('schedule')} className="text-xs text-lynx-sky font-medium flex items-center gap-1">
          Full Schedule <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {events.length === 0 ? (
        <p className={`text-sm text-center py-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 4).map(event => {
            const rsvp = rsvpCounts[event.id]
            const rsvpPct = rosterSize > 0 && rsvp ? Math.round(((rsvp.going || rsvp.total || 0) / rosterSize) * 100) : 0

            return (
              <button
                key={event.id}
                onClick={() => onEventSelect?.(event)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
              >
                <div className="text-center min-w-[40px]">
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatDateShort(event.event_date).split(' ')[0]}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {formatDateShort(event.event_date).split(' ')[1]}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {event.opponent_name ? `vs ${event.opponent_name}` : event.title || event.event_type}
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {event.event_time ? formatTime12(event.event_time) : ''}
                    {event.venue_name ? ` · ${event.venue_name}` : ''}
                  </p>
                </div>
                {rosterSize > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    rsvpPct >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
                    rsvpPct >= 50 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {rsvpPct}%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
