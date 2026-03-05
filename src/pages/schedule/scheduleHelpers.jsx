// ============================================
// SCHEDULE HELPERS — Shared utilities
// ============================================

export function getEventColor(type) {
  const colors = {
    practice: '#10B981',
    game: '#F59E0B',
    tournament: '#8B5CF6',
    team_event: '#3B82F6',
    other: '#6B7280'
  }
  return colors[type] || colors.other
}

export function formatTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatTime12(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

// Short display helpers for game strips / stat rows
export function formatGameDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.getTime() === today.getTime()) return 'TODAY'
  if (d.getTime() === tomorrow.getTime()) return 'TOMORROW'
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

export function formatGameDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatGameTime(timeStr) {
  if (!timeStr) return 'TBD'
  const [h,m] = timeStr.split(':'); const hr = parseInt(h)
  return `${hr>12?hr-12:hr===0?12:hr}:${m} ${hr>=12?'PM':'AM'}`
}

// Generate iCal (.ics) file export
export function exportEventsToICal(filteredEvents, seasonName, showToast) {
  const icsEvents = filteredEvents.map(event => {
    const start = new Date(event.start_time)
    const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 60 * 60 * 1000)
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    return `BEGIN:VEVENT\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:${event.title || event.event_type}\nDESCRIPTION:${event.description || ''}\nLOCATION:${event.venue_name || ''} ${event.venue_address || ''}\nEND:VEVENT`
  }).join('\n')

  const ical = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VolleyBrain//Schedule//EN\n${icsEvents}\nEND:VCALENDAR`
  const blob = new Blob([ical], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `volleybrain-schedule-${seasonName || 'calendar'}.ics`
  a.click()
  URL.revokeObjectURL(url)
  showToast('Calendar exported!', 'success')
}

// Volleyball icon component
export function VolleyballIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
      <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4" />
      <path d="M2 12a15.3 15.3 0 0 0 10 4 15.3 15.3 0 0 0 10-4" />
    </svg>
  )
}
