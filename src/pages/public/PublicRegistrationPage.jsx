import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, Users } from 'lucide-react'

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

// Light theme colors
const colors = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  accent: '#EAB308'
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

function PublicRegistrationPage({ orgIdOrSlug, seasonId }) {
  // Multi-child state
  const [children, setChildren] = useState([]) // Array of saved children
  const [currentChild, setCurrentChild] = useState({}) // Current child being edited
  const [editingChildIndex, setEditingChildIndex] = useState(null) // null = adding new, number = editing existing
  
  // Shared info (parent, emergency, medical)
  const [sharedInfo, setSharedInfo] = useState({})
  const [waiverState, setWaiverState] = useState({})
  const [customAnswers, setCustomAnswers] = useState({})
  
  // App state
  const [season, setSeason] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)

  useEffect(() => {
    loadSeasonData()
  }, [orgIdOrSlug, seasonId])

  async function loadSeasonData() {
    try {
      let orgQuery = supabase.from('organizations').select('*')
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug)
      if (isUUID) {
        orgQuery = orgQuery.eq('id', orgIdOrSlug)
      } else {
        orgQuery = orgQuery.eq('slug', orgIdOrSlug)
      }
      
      const { data: orgData } = await orgQuery.single()
      
      if (orgData) {
        setOrganization(orgData)
        
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('*, sports(name, icon)')
          .eq('id', seasonId)
          .eq('organization_id', orgData.id)
          .single()
        
        if (seasonData) {
          setSeason(seasonData)
          
          if (seasonData.registration_config) {
            setConfig(seasonData.registration_config)
          }
          
          // Initialize waiver state
          const waiverInit = {}
          const waiverConfig = seasonData.registration_config?.waivers || DEFAULT_CONFIG.waivers
          Object.keys(waiverConfig).forEach(key => {
            if (waiverConfig[key]?.enabled) {
              waiverInit[key] = false
            }
          })
          setWaiverState(waiverInit)
          
          // Initialize custom answers
          const customInit = {}
          const customQs = seasonData.registration_config?.custom_questions || []
          customQs.forEach(q => {
            customInit[q.id] = q.type === 'checkbox' ? false : ''
          })
          setCustomAnswers(customInit)
          
        } else {
          setError('Season not found')
        }
      } else {
        setError('Organization not found')
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Could not load registration information')
    }
    setLoading(false)
  }

  // Calculate total fee (per child * number of children)
  const feePerChild = season ? (
    (season.fee_registration || 0) + 
    (season.fee_uniform || 0) + 
    ((season.fee_monthly || 0) * (season.months_in_season || 1))
  ) : 0
  
  const totalChildren = children.length + (Object.keys(currentChild).length > 0 ? 1 : 0)
  const totalFee = feePerChild * Math.max(children.length, 1)

  // Validate player fields for current child
  function validateCurrentChild() {
    const playerFields = config.player_fields || {}
    for (const [key, field] of Object.entries(playerFields)) {
      if (field.enabled && field.required && !currentChild[key]) {
        return `${field.label} is required for this child`
      }
    }
    return null
  }

  // Add current child to list
  function addChild() {
    const validationError = validateCurrentChild()
    if (validationError) {
      setError(validationError)
      return
    }
    
    if (editingChildIndex !== null) {
      // Update existing child
      const updated = [...children]
      updated[editingChildIndex] = { ...currentChild }
      setChildren(updated)
      setEditingChildIndex(null)
    } else {
      // Add new child
      setChildren([...children, { ...currentChild }])
    }
    
    setCurrentChild({})
    setError(null)
  }

  // Edit a child from the list
  function editChild(index) {
    setCurrentChild({ ...children[index] })
    setEditingChildIndex(index)
  }

  // Remove a child from the list
  function removeChild(index) {
    const updated = children.filter((_, i) => i !== index)
    setChildren(updated)
    if (editingChildIndex === index) {
      setCurrentChild({})
      setEditingChildIndex(null)
    }
  }

  // Cancel editing
  function cancelEdit() {
    setCurrentChild({})
    setEditingChildIndex(null)
    setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // If there's a current child being edited, add them first
      let allChildren = [...children]
      if (Object.keys(currentChild).length > 0 && currentChild.first_name) {
        const validationError = validateCurrentChild()
        if (validationError) {
          throw new Error(validationError)
        }
        allChildren = [...children, currentChild]
      }

      if (allChildren.length === 0) {
        throw new Error('Please add at least one child to register')
      }

      // Validate shared info
      const parentFields = config.parent_fields || {}
      const emergencyFields = config.emergency_fields || {}
      const waivers = config.waivers || {}

      for (const [key, field] of Object.entries(parentFields)) {
        if (field.enabled && field.required && !sharedInfo[key]) {
          throw new Error(`${field.label} is required`)
        }
      }

      for (const [key, field] of Object.entries(emergencyFields)) {
        if (field.enabled && field.required && !sharedInfo[key]) {
          throw new Error(`${field.label} is required`)
        }
      }

      for (const [key, waiver] of Object.entries(waivers)) {
        if (waiver.enabled && waiver.required && !waiverState[key]) {
          throw new Error(`${waiver.title} must be accepted`)
        }
      }

      // Create player and registration records for each child
      for (const child of allChildren) {
        const gradeValue = child.grade ? (child.grade === 'K' ? 0 : parseInt(child.grade)) : null

        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            first_name: child.first_name,
            last_name: child.last_name,
            birth_date: child.birth_date || null,
            grade: gradeValue,
            gender: child.gender || null,
            school: child.school || null,
            parent_name: sharedInfo.parent1_name || null,
            parent_email: sharedInfo.parent1_email || null,
            parent_phone: sharedInfo.parent1_phone || null,
            emergency_name: sharedInfo.emergency_name || null,
            emergency_phone: sharedInfo.emergency_phone || null,
            medical_notes: sharedInfo.medical_conditions || null,
            status: 'new',
            season_id: seasonId
          })
          .select()
          .single()

        if (playerError) {
          console.error('Player insert error:', playerError)
          if (playerError.code === '23505') {
            throw new Error(`${child.first_name} may already be registered for this season.`)
          }
          throw new Error(`Failed to register ${child.first_name}`)
        }

        const { error: regError } = await supabase
          .from('registrations')
          .insert({
            player_id: player.id,
            season_id: seasonId,
            status: 'new',
            submitted_at: new Date().toISOString(),
            waivers_accepted: waiverState,
            custom_answers: customAnswers,
            registration_data: {
              player: child,
              shared: sharedInfo,
              waivers: waiverState,
              custom_questions: customAnswers
            }
          })

        if (regError) {
          console.error('Registration insert error:', regError)
          if (regError.code !== '23505') {
            throw new Error(`Failed to create registration for ${child.first_name}`)
          }
        }
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  // Helper to render a field
  function renderField(key, fieldConfig, formState, setFormState) {
    if (!fieldConfig?.enabled) return null
    
    const isRequired = fieldConfig.required
    const label = fieldConfig.label || key

    if (key === 'grade') {
      return (
        <div key={key}>
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formState[key] || ''}
            onChange={e => setFormState({...formState, [key]: e.target.value})}
            required={isRequired}
            className="w-full rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          >
            <option value="">Select grade</option>
            {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
              <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>
            ))}
          </select>
        </div>
      )
    }

    if (key === 'gender') {
      return (
        <div key={key}>
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formState[key] || ''}
            onChange={e => setFormState({...formState, [key]: e.target.value})}
            required={isRequired}
            className="w-full rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      )
    }

    if (key === 'birth_date') {
      return (
        <div key={key}>
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            value={formState[key] || ''}
            onChange={e => setFormState({...formState, [key]: e.target.value})}
            required={isRequired}
            className="w-full rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          />
        </div>
      )
    }

    if (fieldConfig.type === 'select' && fieldConfig.options?.length > 0) {
      return (
        <div key={key}>
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formState[key] || ''}
            onChange={e => setFormState({...formState, [key]: e.target.value})}
            required={isRequired}
            className="w-full rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          >
            <option value="">Select...</option>
            {fieldConfig.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    if (fieldConfig.type === 'textarea' || key.includes('medical') || key.includes('notes') || key.includes('conditions')) {
      return (
        <div key={key} className="col-span-2">
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={formState[key] || ''}
            onChange={e => setFormState({...formState, [key]: e.target.value})}
            required={isRequired}
            rows={3}
            className="w-full rounded-xl px-4 py-3 resize-none"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          />
        </div>
      )
    }

    const inputType = key.includes('email') ? 'email' : key.includes('phone') ? 'tel' : 'text'
    
    return (
      <div key={key}>
        <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type={inputType}
          value={formState[key] || ''}
          onChange={e => setFormState({...formState, [key]: e.target.value})}
          required={isRequired}
          className="w-full rounded-xl px-4 py-3"
          style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
        />
      </div>
    )
  }

  function renderSection(title, fields, icon, sectionKey, formState, setFormState) {
    if (!fields) return null
    const enabledFields = Object.entries(fields).filter(([_, f]) => f?.enabled)
    if (enabledFields.length === 0) return null

    const order = FIELD_ORDER[sectionKey] || []
    const sortedFields = [...enabledFields].sort((a, b) => {
      const indexA = order.indexOf(a[0])
      const indexB = order.indexOf(b[0])
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    return (
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
          <span>{icon}</span> {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedFields.map(([key, fieldConfig]) => renderField(key, fieldConfig, formState, setFormState))}
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <div className="rounded-2xl p-8 max-w-md text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          <span className="text-6xl">🎉</span>
          <h1 className="text-2xl font-bold mt-4" style={{ color: colors.text }}>Registration Submitted!</h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            Thank you for registering {children.length + (currentChild.first_name ? 1 : 0)} {children.length === 1 ? 'child' : 'children'} for {season?.name}!
          </p>
          <p className="text-sm mt-4" style={{ color: colors.textMuted }}>
            You'll receive a confirmation email once your registration is reviewed.
          </p>
          {totalFee > 0 && (
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.cardAlt }}>
              <p style={{ color: colors.textSecondary }}>Estimated total fees</p>
              <p className="text-2xl font-bold" style={{ color: colors.accent }}>${totalFee.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Payment details will be sent after approval</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Error state (no season found)
  if (error && !season) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <div className="rounded-2xl p-8 max-w-md text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          <span className="text-6xl">😕</span>
          <h1 className="text-2xl font-bold mt-4" style={{ color: colors.text }}>Registration Not Found</h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>{error}</p>
        </div>
      </div>
    )
  }

  const accentColor = organization?.primary_color || colors.accent

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {organization?.logo_url && (
            <img src={organization.logo_url} alt={organization.name} className="w-20 h-20 mx-auto rounded-xl mb-4 object-cover" />
          )}
          <h1 className="text-3xl font-bold" style={{ color: colors.text }}>{organization?.name || 'Registration'}</h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>
            {season?.sports?.icon} {season?.name}
          </p>
          {season?.start_date && (
            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
              Starts {new Date(season.start_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Fee Preview */}
        {feePerChild > 0 && (
          <div className="mb-6 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
            >
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {children.length > 0 ? `Total for ${children.length} ${children.length === 1 ? 'child' : 'children'}` : 'Fee per child'}
                </p>
                <p className="text-3xl font-bold" style={{ color: accentColor }}>
                  ${(feePerChild * Math.max(children.length, 1)).toFixed(2)}
                </p>
              </div>
              <button className="p-2 rounded-lg" style={{ backgroundColor: colors.cardAlt }}>
                {showFeeBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            
            {showFeeBreakdown && (
              <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${colors.border}` }}>
                <div className="pt-3">
                  <p className="text-sm font-medium mb-2" style={{ color: colors.text }}>Per child:</p>
                  {season?.fee_registration > 0 && (
                    <div className="flex justify-between py-1">
                      <span style={{ color: colors.textSecondary }}>Registration Fee</span>
                      <span style={{ color: colors.text }}>${season.fee_registration}</span>
                    </div>
                  )}
                  {season?.fee_uniform > 0 && (
                    <div className="flex justify-between py-1">
                      <span style={{ color: colors.textSecondary }}>Uniform Fee</span>
                      <span style={{ color: colors.text }}>${season.fee_uniform}</span>
                    </div>
                  )}
                  {season?.fee_monthly > 0 && (
                    <div className="flex justify-between py-1">
                      <span style={{ color: colors.textSecondary }}>Monthly Dues ({season.months_in_season || 1} months)</span>
                      <span style={{ color: colors.text }}>${season.fee_monthly * (season.months_in_season || 1)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs pt-2" style={{ color: colors.textMuted }}>
                  Payment due after registration is approved
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: '#EF4444' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Children List */}
          {children.length > 0 && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
                <Users className="w-5 h-5" /> Children to Register ({children.length})
              </h2>
              <div className="space-y-3">
                {children.map((child, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: colors.cardAlt }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: colors.text }}>
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        {child.grade && `Grade ${child.grade}`} {child.birth_date && `• ${new Date(child.birth_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editChild(index)}
                        className="p-2 rounded-lg hover:bg-white/50 transition"
                      >
                        <Edit2 className="w-4 h-4" style={{ color: colors.textSecondary }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChild(index)}
                        className="p-2 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Child Form */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: colors.text }}>
                👤 {editingChildIndex !== null ? 'Edit Child' : children.length > 0 ? 'Add Another Child' : 'Child Information'}
              </h2>
              {editingChildIndex !== null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-sm px-3 py-1 rounded-lg"
                  style={{ backgroundColor: colors.cardAlt, color: colors.textSecondary }}
                >
                  Cancel
                </button>
              )}
            </div>
            
            {renderSection(null, config.player_fields, null, 'player_fields', currentChild, setCurrentChild)}
            
            {/* Add Child Button */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={addChild}
                className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition hover:brightness-110"
                style={{ backgroundColor: colors.cardAlt, color: colors.text, border: `2px solid ${accentColor}` }}
              >
                {editingChildIndex !== null ? (
                  <>
                    <Check className="w-5 h-5" /> Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" /> {children.length > 0 ? 'Add This Child' : 'Save & Add Another Child'}
                  </>
                )}
              </button>
            </div>
            {children.length === 0 && (
              <p className="text-center text-sm mt-2" style={{ color: colors.textMuted }}>
                Or continue below to register just this child
              </p>
            )}
          </div>

          {/* Shared Information */}
          <div className="rounded-2xl p-6 mb-6 space-y-8" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            {renderSection('Parent/Guardian', config.parent_fields, '👨‍👩‍👧', 'parent_fields', sharedInfo, setSharedInfo)}
            {renderSection('Emergency Contact', config.emergency_fields, '🚨', 'emergency_fields', sharedInfo, setSharedInfo)}
            {renderSection('Medical Information', config.medical_fields, '🏥', 'medical_fields', sharedInfo, setSharedInfo)}
          </div>

          {/* Custom Questions */}
          {config.custom_questions?.length > 0 && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
                <span>❓</span> Additional Questions
              </h2>
              <div className="space-y-4">
                {config.custom_questions.map(q => (
                  <div key={q.id}>
                    <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
                      {q.question} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    {q.type === 'textarea' ? (
                      <textarea
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})}
                        required={q.required}
                        rows={3}
                        className="w-full rounded-xl px-4 py-3 resize-none"
                        style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                      />
                    ) : q.type === 'select' ? (
                      <select
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})}
                        required={q.required}
                        className="w-full rounded-xl px-4 py-3"
                        style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                      >
                        <option value="">Select...</option>
                        {q.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : q.type === 'checkbox' ? (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customAnswers[q.id] || false}
                          onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.checked})}
                          className="w-5 h-5 rounded"
                        />
                        <span style={{ color: colors.text }}>Yes</span>
                      </label>
                    ) : (
                      <input
                        type="text"
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})}
                        required={q.required}
                        className="w-full rounded-xl px-4 py-3"
                        style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waivers */}
          {config.waivers && Object.entries(config.waivers).some(([_, w]) => w?.enabled) && (
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
                <span>📝</span> Waivers & Agreements
              </h2>
              <div className="space-y-4">
                {Object.entries(config.waivers).map(([key, waiver]) => {
                  if (!waiver?.enabled) return null
                  return (
                    <div 
                      key={key} 
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}` }}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverState[key] || false}
                          onChange={e => setWaiverState({...waiverState, [key]: e.target.checked})}
                          className="w-5 h-5 rounded mt-0.5"
                          style={{ accentColor: accentColor }}
                        />
                        <div>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {waiver.title} {waiver.required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                            {waiver.text}
                          </p>
                        </div>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || (children.length === 0 && !currentChild.first_name)}
            className="w-full py-4 rounded-xl font-semibold text-lg transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: accentColor, color: '#000' }}
          >
            {submitting ? 'Submitting...' : `Submit Registration${children.length > 1 ? ` (${children.length} children)` : ''}`}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: colors.textMuted }}>
          Powered by VolleyBrain
        </p>
      </div>
    </div>
  )
}

export { PublicRegistrationPage }
