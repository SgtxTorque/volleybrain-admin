// =============================================================================
// OrgUpcomingEvents — Org-wide schedule with multi-team event grouping
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { Calendar, MapPin, ChevronRight } from 'lucide-react'

function formatEventDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function EventTypeChip({ type }) {
  const config = {
    game: { label: 'Game', bg: 'bg-red-500/10', text: 'text-red-500' },
    practice: { label: 'Practice', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    tournament: { label: 'Tournament', bg: 'bg-purple-500/10', text: 'text-purple-500' },
    meeting: { label: 'Meeting', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  }
  const cfg = config[type] || { label: type || 'Event', bg: 'bg-slate-500/10', text: 'text-slate-500' }
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default function OrgUpcomingEvents({ events = [], onNavigate }) {
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
            Upcoming Events
          </h3>
        </div>
        <button
          onClick={() => onNavigate?.('schedule')}
          className="text-xs text-lynx-sky font-medium flex items-center gap-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-4">
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No upcoming events</p>
          <button
            onClick={() => onNavigate?.('schedule')}
            className="text-xs text-lynx-sky font-semibold mt-1"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.slice(0, 5).map(event => (
            <div
              key={event.id}
              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`text-center min-w-[44px] shrink-0 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <p className="text-xs font-bold">{formatEventDate(event.event_date).split(', ')[0]}</p>
                <p className="text-[10px]">{formatEventDate(event.event_date).split(', ')[1]}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {event.opponent_name
                      ? `vs ${event.opponent_name}`
                      : event.title || (event.event_type?.charAt(0).toUpperCase() + event.event_type?.slice(1))}
                  </p>
                  <EventTypeChip type={event.event_type} />
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {event.teams?.name && (
                    <span style={{ color: event.teams?.color || '#4BB9EC' }} className="font-semibold">
                      {event.teams.name}
                    </span>
                  )}
                  {event.event_time && (
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                      {formatTime12(event.event_time)}
                    </span>
                  )}
                  {event.venue_name && (
                    <span className={`flex items-center gap-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <MapPin className="w-3 h-3" />
                      {event.venue_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
