// ============================================
// INPUT VALIDATION UTILITIES
// ============================================

// Sanitize text input - strip HTML tags to prevent XSS
export function sanitizeText(input) {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, '')   // Strip HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

// Validate email format
export function isValidEmail(email) {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// Validate phone number (basic US format)
export function isValidPhone(phone) {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

// Validate required field
export function isRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !isNaN(value)
  return value != null
}

// Validate max length
export function isMaxLength(value, max) {
  if (!value) return true
  return String(value).length <= max
}

// Validate a form object, returns { valid: boolean, errors: { [field]: string } }
export function validateForm(fields) {
  const errors = {}

  for (const [fieldName, rules] of Object.entries(fields)) {
    for (const rule of rules) {
      if (rule.required && !isRequired(rule.value)) {
        errors[fieldName] = rule.message || `${fieldName} is required`
        break
      }
      if (rule.maxLength && !isMaxLength(rule.value, rule.maxLength)) {
        errors[fieldName] = rule.message || `${fieldName} must be ${rule.maxLength} characters or less`
        break
      }
      if (rule.email && rule.value && !isValidEmail(rule.value)) {
        errors[fieldName] = rule.message || 'Invalid email address'
        break
      }
      if (rule.custom && !rule.custom(rule.value)) {
        errors[fieldName] = rule.message || `${fieldName} is invalid`
        break
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
