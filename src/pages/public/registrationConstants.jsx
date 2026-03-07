// Registration form constants, field ordering, and helper utilities
// Extracted from PublicRegistrationPage for the file-split refactor

// Default field configuration (fallback if no template selected)
const DEFAULT_CONFIG = {
  player_fields: {
    first_name: { enabled: true, required: true, label: 'First Name' },
    last_name: { enabled: true, required: true, label: 'Last Name' },
    birth_date: { enabled: true, required: true, label: 'Date of Birth' },
    gender: { enabled: true, required: false, label: 'Gender' },
    grade: { enabled: true, required: false, label: 'Grade' },
    school: { enabled: true, required: false, label: 'School' },
  },
  parent_fields: {
    parent1_name: { enabled: true, required: true, label: 'Parent/Guardian Name' },
    parent1_email: { enabled: true, required: true, label: 'Email' },
    parent1_phone: { enabled: true, required: true, label: 'Phone' },
  },
  emergency_fields: {
    emergency_name: { enabled: true, required: true, label: 'Emergency Contact Name' },
    emergency_phone: { enabled: true, required: true, label: 'Emergency Phone' },
    emergency_relation: { enabled: true, required: false, label: 'Relationship' },
  },
  medical_fields: {
    medical_conditions: { enabled: true, required: false, label: 'Medical Conditions/Allergies' },
  },
  waivers: {
    liability: { enabled: true, required: true, title: 'Liability Waiver', text: 'I understand and accept the risks associated with participation in athletic activities.' },
    photo_release: { enabled: true, required: false, title: 'Photo/Video Release', text: 'I consent to photos and videos being taken and used for promotional purposes.' },
    code_of_conduct: { enabled: true, required: false, title: 'Code of Conduct', text: 'I agree to follow the organization\'s code of conduct and sportsmanship guidelines.' },
  },
  custom_questions: []
}

// Define field order for each section
const FIELD_ORDER = {
  player_fields: [
    'first_name', 'last_name', 'birth_date', 'gender', 'grade', 'school',
    'shirt_size', 'jersey_size', 'shorts_size', 'preferred_number',
    'position_preference', 'experience_level', 'previous_teams', 'height', 'weight'
  ],
  parent_fields: [
    'parent1_name', 'parent1_email', 'parent1_phone',
    'parent2_name', 'parent2_email', 'parent2_phone',
    'address', 'city', 'state', 'zip'
  ],
  emergency_fields: [
    'emergency_name', 'emergency_phone', 'emergency_relation',
    'emergency2_name', 'emergency2_phone'
  ],
  medical_fields: [
    'medical_conditions', 'allergies', 'medications',
    'doctor_name', 'doctor_phone', 'insurance_provider', 'insurance_policy'
  ]
}

// Player fields URL param mapping for prefill
const PLAYER_FIELD_MAP = {
  'first_name': 'first_name',
  'last_name': 'last_name',
  'dob': 'birth_date',
  'birth_date': 'birth_date',
  'grade': 'grade',
  'gender': 'gender',
  'school': 'school',
  'shirt_size': 'shirt_size',
  'jersey_size': 'jersey_size',
  'shorts_size': 'shorts_size',
  'preferred_number': 'preferred_number',
  'position_preference': 'position_preference',
  'experience_level': 'experience_level',
  'previous_teams': 'previous_teams',
  'height': 'height',
  'weight': 'weight',
}

// Parent/shared fields URL param mapping for prefill
const SHARED_FIELD_MAP = {
  'parent_name': 'parent1_name',
  'parent1_name': 'parent1_name',
  'parent_email': 'parent1_email',
  'parent1_email': 'parent1_email',
  'parent_phone': 'parent1_phone',
  'parent1_phone': 'parent1_phone',
  'parent2_name': 'parent2_name',
  'parent2_email': 'parent2_email',
  'parent2_phone': 'parent2_phone',
  'address': 'address',
  'city': 'city',
  'state': 'state',
  'zip': 'zip',
  'emergency_name': 'emergency_name',
  'emergency_phone': 'emergency_phone',
  'emergency_relation': 'emergency_relation',
  'medical_conditions': 'medical_conditions',
  'allergies': 'allergies',
  'medications': 'medications',
}

// Sort fields by defined order, unknowns go to end
function sortFieldsByOrder(enabledFields, sectionKey) {
  const order = FIELD_ORDER[sectionKey] || []
  return [...enabledFields].sort((a, b) => {
    const indexA = order.indexOf(a[0])
    const indexB = order.indexOf(b[0])
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
}

// Calculate per-child fee from season data
function calculateFeePerChild(season) {
  if (!season) return 0
  return (
    (season.fee_registration || 0) +
    (season.fee_uniform || 0) +
    ((season.fee_monthly || 0) * (season.months_in_season || 1))
  )
}

export {
  DEFAULT_CONFIG,
  FIELD_ORDER,
  PLAYER_FIELD_MAP,
  SHARED_FIELD_MAP,
  sortFieldsByOrder,
  calculateFeePerChild
}
