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
