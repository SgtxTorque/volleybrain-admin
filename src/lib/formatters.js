// =============================================================================
// formatters.js — Display formatting utilities
// =============================================================================

/**
 * Format a phone number for display.
 * Input: raw digits "5125557184", "15125557184", or already formatted "(512) 555-7184"
 * Output: "(512) 555-7184" for US numbers, as-is for non-standard, "—" for empty
 */
export function formatPhone(value) {
  if (!value) return '—'
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') {
    const d = digits.slice(1)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return String(value) // return as-is if not standard US format
}
