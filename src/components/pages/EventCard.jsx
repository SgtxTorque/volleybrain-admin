/**
 * Event card with full brand treatment.
 *
 * Game cards: amber background tint, amber accent, bold opponent name
 * Practice cards: teal/green background tint, green accent
 * Tournament cards: purple background tint, purple accent
 *
 * NOT just a thin left border — the entire card has a subtle background color
 * that makes the event type immediately obvious at a glance.
 */
export default function EventCard({
  event, onClick, selected, expandable, expanded, children
}) {
  const typeStyles = {
    game: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      selectedBorder: 'border-amber-400 shadow-amber-100',
      accent: 'bg-amber-500',
      chip: 'bg-amber-100 text-amber-700',
      icon: '🏐',
    },
    practice: {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-200',
      selectedBorder: 'border-emerald-400 shadow-emerald-100',
      accent: 'bg-emerald-500',
      chip: 'bg-emerald-100 text-emerald-700',
      icon: '⚡',
    },
    tournament: {
      bg: 'bg-purple-50/50',
      border: 'border-purple-200',
      selectedBorder: 'border-purple-400 shadow-purple-100',
      accent: 'bg-purple-500',
      chip: 'bg-purple-100 text-purple-700',
      icon: '🏆',
    },
  };

  const type = (event.event_type || event.type || 'practice').toLowerCase();
  const style = typeStyles[type] || typeStyles.practice;

  return (
    <div
      className={`rounded-[14px] border overflow-hidden mb-3 transition-all
        ${onClick ? 'cursor-pointer' : ''}
        ${style.bg} ${selected ? style.selectedBorder + ' shadow-md' : style.border}
        hover:shadow-md`}
      onClick={onClick}
    >
      {/* Top accent bar — 3px colored bar across the top */}
      <div className={`h-[3px] ${style.accent}`} />

      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Type icon circle */}
          <div className={`w-10 h-10 rounded-xl ${style.chip} flex items-center justify-center text-lg flex-shrink-0`}>
            {style.icon}
          </div>
          <div>
            {/* Chips row */}
            <div className="flex gap-2 items-center mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${style.chip}`}>
                {type}
              </span>
              {event.team_name && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
                  {event.team_name}
                </span>
              )}
              {event.needs_volunteers && (
                <span className="text-[10px] font-bold text-red-500">⚠️ Needs Volunteers</span>
              )}
            </div>
            {/* Event name */}
            <div className="text-r-lg font-bold text-slate-900">
              {event.title || event.name || event.event_name || 'Untitled Event'}
            </div>
            {/* Meta */}
            <div className="text-r-sm text-slate-500 mt-0.5">
              {event.date_display || event.date || ''}{event.time_display ? ` · ${event.time_display}` : (event.start_time ? ` · ${event.start_time}` : '')}{event.venue ? ` · ${event.venue}` : (event.location ? ` · ${event.location}` : '')}
            </div>
          </div>
        </div>

        {/* Right side — RSVP counts or actions */}
        <div className="flex items-center gap-3">
          {event.rsvp_counts && (
            <div className="flex gap-1.5">
              <span className="px-2.5 py-1 rounded-lg text-r-xs font-bold bg-emerald-100 text-emerald-700">
                {event.rsvp_counts.going} ✓
              </span>
              <span className="px-2.5 py-1 rounded-lg text-r-xs font-bold bg-red-100 text-red-700">
                {event.rsvp_counts.no} ✕
              </span>
              <span className="px-2.5 py-1 rounded-lg text-r-xs font-bold bg-slate-100 text-slate-500">
                {event.rsvp_counts.maybe} ?
              </span>
            </div>
          )}
          {expandable && (
            <span className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
          )}
        </div>
      </div>

      {/* Expandable detail section (dropdown) */}
      {expanded && children && (
        <div className="border-t border-slate-200/50 bg-white px-5 py-4 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  );
}
