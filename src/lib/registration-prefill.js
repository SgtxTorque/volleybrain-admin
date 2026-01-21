/**
 * Registration Pre-fill Utilities
 * Supports re-registration and sibling registration flows
 * 
 * URL formats:
 * - Re-registration: /register/{org}/{season}?prefill=reregister&first_name=...&parent_email=...
 * - Sibling: /register/{org}/{season}?prefill=sibling
 */

/**
 * Get registration pre-fill data from URL parameters
 * @returns {Object|null} Parsed registration data or null
 */
export function getRegistrationPrefillData() {
  const params = new URLSearchParams(window.location.search)
  const prefillType = params.get('prefill')
  
  if (!prefillType) return null
  
  const data = {
    prefillType, // 'reregister' or 'sibling'
    // Player info
    first_name: params.get('first_name') || '',
    last_name: params.get('last_name') || '',
    birth_date: params.get('birth_date') || '',
    grade: params.get('grade') || '',
    gender: params.get('gender') || '',
    school: params.get('school') || '',
    // Parent info
    parent_name: params.get('parent_name') || '',
    parent_email: params.get('parent_email') || '',
    parent_phone: params.get('parent_phone') || '',
    // Tracking
    source_player_id: params.get('source_player_id') || null
  }
  
  return data
}

/**
 * Set registration pre-fill data (for generating URLs)
 * @param {Object} data - Registration data to encode
 * @param {string} baseUrl - Base registration URL
 * @returns {string} URL with prefill parameters
 */
export function setRegistrationPrefillData(data, baseUrl) {
  const params = new URLSearchParams()
  
  Object.entries(data).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Check if the current page is a registration page with pre-fill params
 */
export function hasRegistrationPrefill() {
  const params = new URLSearchParams(window.location.search)
  return params.has('prefill')
}

/**
 * Apply pre-fill data to a registration form state
 * @param {Object} prefillData - Data from getRegistrationPrefillData()
 * @param {Object} formState - Current form state
 * @param {Function} setFormState - State setter function
 */
export function applyRegistrationPrefill(prefillData, formState, setFormState) {
  if (!prefillData) return
  
  const updates = {}
  
  // For re-registration, we fill in player info
  if (prefillData.prefillType === 'reregister') {
    // Player details
    if (prefillData.first_name) updates.first_name = prefillData.first_name
    if (prefillData.last_name) updates.last_name = prefillData.last_name
    if (prefillData.birth_date) updates.birth_date = prefillData.birth_date
    if (prefillData.grade) updates.grade = prefillData.grade
    if (prefillData.gender) updates.gender = prefillData.gender
    if (prefillData.school) updates.school = prefillData.school
  }
  
  // For both re-registration and sibling, fill parent info
  if (prefillData.parent_name) updates.parent_name = prefillData.parent_name
  if (prefillData.parent_email) updates.parent_email = prefillData.parent_email
  if (prefillData.parent_phone) updates.parent_phone = prefillData.parent_phone
  
  // Track source player for analytics
  if (prefillData.source_player_id) updates.prefilled_from_player_id = prefillData.source_player_id
  
  if (Object.keys(updates).length > 0) {
    setFormState({ ...formState, ...updates })
  }
}
