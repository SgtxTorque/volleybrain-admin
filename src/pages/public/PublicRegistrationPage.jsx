import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronDown, ChevronUp } from 'lucide-react'

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

// Light theme colors (hardcoded for public form)
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

function PublicRegistrationPage({ orgIdOrSlug, seasonId }) {
  const [form, setForm] = useState({})
  const [waiverState, setWaiverState] = useState({})
  const [customAnswers, setCustomAnswers] = useState({})
  
  const [season, setSeason] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)

  // Load season and org info
  useEffect(() => {
    loadSeasonData()
  }, [orgIdOrSlug, seasonId])

  async function loadSeasonData() {
    try {
      // Find org by ID or slug
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
        
        // Load season with registration_config
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('*, sports(name, icon)')
          .eq('id', seasonId)
          .eq('organization_id', orgData.id)
          .single()
        
        if (seasonData) {
          setSeason(seasonData)
          
          // Use season's registration_config or fall back to default
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
          
          // Initialize custom questions answers
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

  // Calculate total fee
  const totalFee = season ? (
    (season.fee_registration || 0) + 
    (season.fee_uniform || 0) + 
    ((season.fee_monthly || 0) * (season.months_in_season || 1))
  ) : 0

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      const playerFields = config.player_fields || {}
      const parentFields = config.parent_fields || {}
      const emergencyFields = config.emergency_fields || {}
      const waivers = config.waivers || {}
      const customQs = config.custom_questions || []

      // Check required player fields
      for (const [key, field] of Object.entries(playerFields)) {
        if (field.enabled && field.required && !form[key]) {
          throw new Error(`${field.label} is required`)
        }
      }

      // Check required parent fields
      for (const [key, field] of Object.entries(parentFields)) {
        if (field.enabled && field.required && !form[key]) {
          throw new Error(`${field.label} is required`)
        }
      }

      // Check required emergency fields
      for (const [key, field] of Object.entries(emergencyFields)) {
        if (field.enabled && field.required && !form[key]) {
          throw new Error(`${field.label} is required`)
        }
      }

      // Check required waivers
      for (const [key, waiver] of Object.entries(waivers)) {
        if (waiver.enabled && waiver.required && !waiverState[key]) {
          throw new Error(`${waiver.title} must be accepted`)
        }
      }

      // Check required custom questions
      for (const q of customQs) {
        if (q.required && !customAnswers[q.id]) {
          throw new Error(`"${q.question}" is required`)
        }
      }

      // Map form fields to database columns
      const gradeValue = form.grade ? (form.grade === 'K' ? 0 : parseInt(form.grade)) : null

      // Create player record
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.birth_date || null,
          grade: gradeValue,
          gender: form.gender || null,
          school: form.school || null,
          parent_name: form.parent1_name || null,
          parent_email: form.parent1_email || null,
          parent_phone: form.parent1_phone || null,
          emergency_name: form.emergency_name || null,
          emergency_phone: form.emergency_phone || null,
          medical_notes: form.medical_conditions || null,
          status: 'new',
          season_id: seasonId
        })
        .select()
        .single()

      if (playerError) {
        console.error('Player insert error:', playerError)
        if (playerError.code === '23505') {
          throw new Error('This player may already be registered for this season.')
        }
        throw new Error('Failed to create player record')
      }

      // Create registration record
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
            ...form,
            waivers: waiverState,
            custom_questions: customAnswers
          }
        })

      if (regError) {
        console.error('Registration insert error:', regError)
        if (regError.code === '23505') {
          // Already registered - show success anyway
          setSubmitted(true)
          return
        }
        throw new Error('Failed to create registration')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  // Helper to render a field
  function renderField(key, fieldConfig, type = 'text') {
    if (!fieldConfig?.enabled) return null
    
    const isRequired = fieldConfig.required
    const label = fieldConfig.label || key

    // Special handling for certain field types
    if (key === 'grade') {
      return (
        <div key={key}>
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            value={form[key] || ''}
            onChange={e => setForm({...form, [key]: e.target.value})}
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
            value={form[key] || ''}
            onChange={e => setForm({...form, [key]: e.target.value})}
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
            value={form[key] || ''}
            onChange={e => setForm({...form, [key]: e.target.value})}
            required={isRequired}
            className="w-full rounded-xl px-4 py-3"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          />
        </div>
      )
    }

    // Select type fields
    if (fieldConfig.type === 'select' && fieldConfig.options?.length > 0) {
      return (
        <div key={key}>
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            value={form[key] || ''}
            onChange={e => setForm({...form, [key]: e.target.value})}
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

    // Textarea fields
    if (fieldConfig.type === 'textarea' || key.includes('medical') || key.includes('notes') || key.includes('conditions')) {
      return (
        <div key={key} className="col-span-2">
          <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={form[key] || ''}
            onChange={e => setForm({...form, [key]: e.target.value})}
            required={isRequired}
            rows={3}
            className="w-full rounded-xl px-4 py-3 resize-none"
            style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
          />
        </div>
      )
    }

    // Default text/email/tel input
    const inputType = key.includes('email') ? 'email' : key.includes('phone') ? 'tel' : type
    
    return (
      <div key={key}>
        <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type={inputType}
          value={form[key] || ''}
          onChange={e => setForm({...form, [key]: e.target.value})}
          required={isRequired}
          className="w-full rounded-xl px-4 py-3"
          style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
        />
      </div>
    )
  }

  // Render section if it has any enabled fields
  function renderSection(title, fields, icon) {
    if (!fields) return null
    const enabledFields = Object.entries(fields).filter(([_, f]) => f?.enabled)
    if (enabledFields.length === 0) return null

    return (
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
          <span>{icon}</span> {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enabledFields.map(([key, fieldConfig]) => renderField(key, fieldConfig))}
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
            Thank you for registering {form.first_name} for {season?.name}!
          </p>
          <p className="text-sm mt-4" style={{ color: colors.textMuted }}>
            You'll receive a confirmation email once your registration is reviewed.
          </p>
          {totalFee > 0 && (
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.cardAlt }}>
              <p style={{ color: colors.textSecondary }}>Estimated fees</p>
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
        {totalFee > 0 && (
          <div className="mb-6 rounded-xl overflow-hidden" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
            >
              <div>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Total Registration Fee</p>
                <p className="text-3xl font-bold" style={{ color: accentColor }}>${totalFee.toFixed(2)}</p>
              </div>
              <button className="p-2 rounded-lg" style={{ backgroundColor: colors.cardAlt }}>
                {showFeeBreakdown ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
            
            {showFeeBreakdown && (
              <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${colors.border}` }}>
                <div className="pt-3">
                  {season?.fee_registration > 0 && (
                    <div className="flex justify-between py-2">
                      <span style={{ color: colors.textSecondary }}>Registration Fee</span>
                      <span style={{ color: colors.text }}>${season.fee_registration}</span>
                    </div>
                  )}
                  {season?.fee_uniform > 0 && (
                    <div className="flex justify-between py-2">
                      <span style={{ color: colors.textSecondary }}>Uniform Fee</span>
                      <span style={{ color: colors.text }}>${season.fee_uniform}</span>
                    </div>
                  )}
                  {season?.fee_monthly > 0 && (
                    <div className="flex justify-between py-2">
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
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-8" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          
          {/* Player Information */}
          {renderSection('Player Information', config.player_fields, '👤')}

          {/* Parent/Guardian Information */}
          {renderSection('Parent/Guardian', config.parent_fields, '👨‍👩‍👧')}

          {/* Emergency Contact */}
          {renderSection('Emergency Contact', config.emergency_fields, '🚨')}

          {/* Medical Information */}
          {renderSection('Medical Information', config.medical_fields, '🏥')}

          {/* Custom Questions */}
          {config.custom_questions?.length > 0 && (
            <div>
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
            <div>
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
            disabled={submitting}
            className="w-full py-4 rounded-xl font-semibold text-lg transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: accentColor, color: '#000' }}
          >
            {submitting ? 'Submitting...' : 'Submit Registration'}
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

export default PublicRegistrationPage
export { PublicRegistrationPage }
