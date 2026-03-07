// ============================================
// AVAILABILITY HELPERS
// Constants + pure utility functions for CoachAvailabilityPage
// ============================================

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const REASONS = [
  { value: 'vacation', label: 'Vacation', icon: '🏖️' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'personal', label: 'Personal', icon: '🏠' },
  { value: 'injury', label: 'Injury', icon: '🩹' },
  { value: 'other', label: 'Other', icon: '📝' },
]

export function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

export function toDateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

export function todayStr() {
  const t = new Date()
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate())
}

export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const days = []

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    days.push({ date: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, dateStr: toDateStr(year, month, d), isCurrentMonth: true })
  }
  // Next month padding
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    days.push({ date: d, dateStr: toDateStr(y, m, d), isCurrentMonth: false })
  }
  return days
}

export function formatDateNice(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    return (h % 12 || 12) + ':' + minutes + ' ' + (h >= 12 ? 'PM' : 'AM')
  } catch { return timeStr }
}

export function getDatesBetween(start, end) {
  const dates = []
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const [from, to] = s <= e ? [s, e] : [e, s]
  const cur = new Date(from)
  while (cur <= to) {
    dates.push(toDateStr(cur.getFullYear(), cur.getMonth(), cur.getDate()))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}
