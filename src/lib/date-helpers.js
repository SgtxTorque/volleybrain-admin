/**
 * Shared date/time formatting helpers used across coach dashboard components.
 */

/**
 * Parse a date-only string (YYYY-MM-DD) as local midnight, not UTC midnight.
 * This avoids the off-by-one-day bug where "2026-04-01" shows as "March 31"
 * in US timezones. Full ISO timestamps (containing 'T') are passed through as-is.
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null
  if (typeof dateStr !== 'string') return new Date(dateStr)
  // If it already has a time component, parse as-is
  if (dateStr.includes('T')) return new Date(dateStr)
  // Date-only: append T00:00:00 to force local timezone interpretation
  return new Date(dateStr + 'T00:00:00')
}

export function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return hour12 + ':' + minutes + ' ' + ampm
  } catch {
    return timeStr
  }
}

export function countdownText(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const target = new Date(dateStr + 'T00:00:00')
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'TODAY'
  if (diff === 1) return 'TOMORROW'
  if (diff < 0) return `${Math.abs(diff)}d ago`
  if (diff <= 7) return `${diff}d`
  return `${Math.ceil(diff / 7)}w`
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateLong(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = parseLocalDate(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
