import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { getRegistrationPrefillData } from '../../lib/registration-prefill'
import { Check, X, AlertTriangle } from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'

function PublicRegistrationPage({ orgIdOrSlug, seasonId }) {
  const { colors } = useTheme()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    grade: '',
    gender: '',
    school: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_notes: '',
    waiver_liability: false,
    waiver_photo: false,
    waiver_conduct: false,
    waiver_signed_by: '',
    prefilled_from_player_id: null
  })
  
  const [season, setSeason] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [prefillNotice, setPrefillNotice] = useState(null)

  // Load season and org info
  useEffect(() => {
    loadSeasonData()
    applyPrefillData()
  }, [orgIdOrSlug, seasonId])

  function applyPrefillData() {
    const prefillData = getRegistrationPrefillData()
    if (!prefillData) return
    
    const updates = {}
    
    if (prefillData.prefillType === 'reregister') {
      Object.keys(prefillData).forEach(key => {
        if (prefillData[key] && key !== 'prefillType' && key !== 'source_player_id') {
          updates[key] = prefillData[key]
        }
      })
      setPrefillNotice({
        type: 'reregister',
        playerName: prefillData.first_name,
        message: `Welcome back! We've pre-filled ${prefillData.first_name}'s information.`
      })
    } else if (prefillData.prefillType === 'sibling') {
      if (prefillData.parent_name) updates.parent_name = prefillData.parent_name
      if (prefillData.parent_email) updates.parent_email = prefillData.parent_email
      if (prefillData.parent_phone) updates.parent_phone = prefillData.parent_phone
      setPrefillNotice({
        type: 'sibling',
        message: `Adding a sibling? We've pre-filled your contact information.`
      })
    }
    
    if (prefillData.source_player_id) {
      updates.prefilled_from_player_id = prefillData.source_player_id
    }
    
    if (Object.keys(updates).length > 0) {
      setForm(prev => ({ ...prev, ...updates }))
    }
  }

  async function loadSeasonData() {
    try {
      // Try to find org by ID or slug
      let orgQuery = supabase.from('organizations').select('*')
      
      // Check if it's a UUID or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug)
      if (isUUID) {
        orgQuery = orgQuery.eq('id', orgIdOrSlug)
      } else {
        orgQuery = orgQuery.eq('slug', orgIdOrSlug)
      }
      
      const { data: orgData } = await orgQuery.single()
      
      if (orgData) {
        setOrganization(orgData)
        
        // Load season
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('*, sports(name, icon)')
          .eq('id', seasonId)
          .eq('organization_id', orgData.id)
          .single()
        
        if (seasonData) {
          setSeason(seasonData)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!form.first_name || !form.last_name || !form.parent_email) {
        throw new Error('Please fill in all required fields')
      }

      // Create player record
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.birth_date || null,
          grade: form.grade || null,
          gender: form.gender || null,
          school: form.school || null,
          parent_name: form.parent_name,
          parent_email: form.parent_email,
          parent_phone: form.parent_phone || null,
          emergency_contact: form.emergency_contact || null,
          emergency_phone: form.emergency_phone || null,
          medical_notes: form.medical_notes || null,
          waiver_liability: form.waiver_liability,
          waiver_photo: form.waiver_photo,
          waiver_conduct: form.waiver_conduct,
          waiver_signed_by: form.waiver_signed_by || null,
          waiver_signed_date: (form.waiver_liability || form.waiver_photo || form.waiver_conduct) 
            ? new Date().toISOString() 
            : null,
          prefilled_from_player_id: form.prefilled_from_player_id,
          season_id: seasonId,
          status: 'active'
        })
        .select()
        .single()

      if (playerError) throw playerError

      // Create registration record
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          player_id: player.id,
          season_id: seasonId,
          status: 'pending',
          registration_type: form.prefilled_from_player_id ? 're-registration' : 'new'
        })

      if (regError) throw regError

      setSubmitted(true)
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  // Calculate fees for display
  const totalFee = season ? (
    (parseFloat(season.fee_registration) || 0) + 
    (parseFloat(season.fee_uniform) || 0) + 
    ((parseFloat(season.fee_monthly) || 0) * (parseInt(season.months_in_season) || 0))
  ) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: colors.border, borderTopColor: '#EAB308' }} />
      </div>
    )
  }

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
            You'll receive a confirmation email at {form.parent_email} once your registration is reviewed.
          </p>
          {totalFee > 0 && (
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: colors.cardAlt }}>
              <p style={{ color: colors.textSecondary }}>Estimated fees</p>
              <p className="text-2xl font-bold" style={{ color: '#EAB308' }}>${totalFee.toFixed(2)}</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Payment details will be sent after approval</p>
            </div>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 font-semibold rounded-xl transition hover:brightness-110"
            style={{ backgroundColor: '#EAB308', color: '#000' }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  if (error && !season) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.bg }}>
        <div className="rounded-2xl p-8 max-w-md text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          <span className="text-6xl">😕</span>
          <h1 className="text-2xl font-bold mt-4" style={{ color: colors.text }}>Registration Not Found</h1>
          <p className="mt-2" style={{ color: colors.textSecondary }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 font-semibold rounded-xl"
            style={{ backgroundColor: colors.cardAlt, color: colors.text }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

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
          <div className="mb-6 p-4 rounded-xl text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Registration Fee</p>
            <p className="text-3xl font-bold" style={{ color: '#EAB308' }}>${totalFee.toFixed(2)}</p>
            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Due after registration is approved</p>
          </div>
        )}

        {/* Pre-fill Notice */}
        {prefillNotice && (
          <div className="mb-6 p-4 rounded-xl" style={{ 
            backgroundColor: prefillNotice.type === 'reregister' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${prefillNotice.type === 'reregister' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
          }}>
            <p style={{ color: prefillNotice.type === 'reregister' ? '#10B981' : '#3B82F6' }}>
              ✨ {prefillNotice.message}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: '#EF4444' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          {/* Player Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Player Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>First Name *</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm({...form, first_name: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Last Name *</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm({...form, last_name: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Date of Birth</label>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={e => setForm({...form, birth_date: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Grade</label>
                <select
                  value={form.grade}
                  onChange={e => setForm({...form, grade: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                >
                  <option value="">Select grade</option>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                    <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({...form, gender: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>School</label>
                <input
                  type="text"
                  value={form.school}
                  onChange={e => setForm({...form, school: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Parent/Guardian Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Parent Name *</label>
                <input
                  type="text"
                  value={form.parent_name}
                  onChange={e => setForm({...form, parent_name: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Parent Phone</label>
                <input
                  type="tel"
                  value={form.parent_phone}
                  onChange={e => setForm({...form, parent_phone: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Parent Email *</label>
                <input
                  type="email"
                  value={form.parent_email}
                  onChange={e => setForm({...form, parent_email: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Emergency Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Emergency Contact Name</label>
                <input
                  type="text"
                  value={form.emergency_contact}
                  onChange={e => setForm({...form, emergency_contact: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Emergency Phone</label>
                <input
                  type="tel"
                  value={form.emergency_phone}
                  onChange={e => setForm({...form, emergency_phone: e.target.value})}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Medical Notes / Allergies</label>
              <textarea
                value={form.medical_notes}
                onChange={e => setForm({...form, medical_notes: e.target.value})}
                rows={3}
                placeholder="Any medical conditions, allergies, or special needs..."
                className="w-full rounded-xl px-4 py-3"
                style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
              />
            </div>
          </div>

          {/* Waivers */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>Waivers & Agreements</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:opacity-80" style={{ backgroundColor: colors.cardAlt }}>
                <input
                  type="checkbox"
                  checked={form.waiver_liability}
                  onChange={e => setForm({...form, waiver_liability: e.target.checked})}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium" style={{ color: colors.text }}>Liability Waiver</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>I understand and accept the risks associated with participation.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:opacity-80" style={{ backgroundColor: colors.cardAlt }}>
                <input
                  type="checkbox"
                  checked={form.waiver_photo}
                  onChange={e => setForm({...form, waiver_photo: e.target.checked})}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium" style={{ color: colors.text }}>Photo Release</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>I consent to photos/videos being taken and used for promotional purposes.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:opacity-80" style={{ backgroundColor: colors.cardAlt }}>
                <input
                  type="checkbox"
                  checked={form.waiver_conduct}
                  onChange={e => setForm({...form, waiver_conduct: e.target.checked})}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium" style={{ color: colors.text }}>Code of Conduct</p>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>I agree to follow the organization's code of conduct and sportsmanship guidelines.</p>
                </div>
              </label>
            </div>
            {(form.waiver_liability || form.waiver_photo || form.waiver_conduct) && (
              <div className="mt-4">
                <label className="block text-sm mb-2" style={{ color: colors.textSecondary }}>Parent/Guardian Signature (type full name)</label>
                <input
                  type="text"
                  value={form.waiver_signed_by}
                  onChange={e => setForm({...form, waiver_signed_by: e.target.value})}
                  placeholder="Type your full name to sign"
                  className="w-full rounded-xl px-4 py-3"
                  style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 font-bold rounded-xl transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: '#EAB308', color: '#000' }}
          >
            {submitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: colors.textMuted }}>
          Powered by VolleyBrain
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <JourneyProvider>
          <AppContent />
        </JourneyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}


export { PublicRegistrationPage }
