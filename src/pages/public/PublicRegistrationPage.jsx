import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getRegistrationPrefillData } from '../../lib/registration-prefill'

// Light theme colors (always used for public registration)
const lightColors = {
  bg: '#F5F5F7',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#1D1D1F',
  textSecondary: '#515154',
  textMuted: '#86868B',
}

function PublicRegistrationPage({ orgIdOrSlug, seasonId }) {
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
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)

  // Get org accent color or default
  const accentColor = organization?.primary_color || '#F97316'
  const accentColorDark = organization?.primary_color ? adjustColor(organization.primary_color, -20) : '#EA580C'

  // Darken/lighten color utility
  function adjustColor(color, amount) {
    const hex = color.replace('#', '')
    const num = parseInt(hex, 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
  }

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
          organization_id: organization.id,
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

  // Calculate fee breakdown
  function getFeeBreakdown() {
    if (!season) return { items: [], total: 0 }
    
    const items = []
    const seasonStart = season.start_date ? new Date(season.start_date) : new Date()
    const registrationFee = parseFloat(season.fee_registration) || 0
    const uniformFee = parseFloat(season.fee_uniform) || 0
    const monthlyFee = parseFloat(season.fee_monthly) || 0
    const monthsInSeason = parseInt(season.months_in_season) || 0
    const earlyBirdDiscount = parseFloat(season.early_bird_discount) || 0
    const earlyBirdDeadline = season.early_bird_deadline ? new Date(season.early_bird_deadline) : null
    const isEarlyBird = earlyBirdDeadline && new Date() < earlyBirdDeadline

    // Registration fee
    if (registrationFee > 0) {
      items.push({
        name: 'Registration Fee',
        amount: registrationFee,
        dueDate: 'Due upon approval',
        icon: '📋'
      })
    }

    // Uniform fee
    if (uniformFee > 0) {
      const uniformDue = new Date(seasonStart)
      uniformDue.setDate(uniformDue.getDate() - 14) // 2 weeks before season
      items.push({
        name: 'Uniform Fee',
        amount: uniformFee,
        dueDate: `Due by ${uniformDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        icon: '👕'
      })
    }

    // Monthly dues
    if (monthlyFee > 0 && monthsInSeason > 0) {
      for (let i = 0; i < monthsInSeason; i++) {
        const dueDate = new Date(seasonStart)
        dueDate.setMonth(dueDate.getMonth() + i)
        dueDate.setDate(1) // 1st of month
        
        const monthName = dueDate.toLocaleDateString('en-US', { month: 'long' })
        items.push({
          name: `${monthName} Dues`,
          amount: monthlyFee,
          dueDate: `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          icon: '📅'
        })
      }
    }

    // Early bird discount
    if (isEarlyBird && earlyBirdDiscount > 0) {
      items.push({
        name: 'Early Bird Discount',
        amount: -earlyBirdDiscount,
        dueDate: `Register by ${earlyBirdDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        icon: '🎉',
        isDiscount: true
      })
    }

    const total = items.reduce((sum, item) => sum + item.amount, 0)
    return { items, total }
  }

  const feeBreakdown = getFeeBreakdown()

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: lightColors.bg }}>
        <div 
          className="w-10 h-10 border-4 rounded-full animate-spin" 
          style={{ borderColor: lightColors.border, borderTopColor: accentColor }} 
        />
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: lightColors.bg }}>
        <div className="rounded-2xl p-8 max-w-md text-center shadow-lg" style={{ backgroundColor: lightColors.card }}>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: lightColors.text }}>Registration Submitted!</h1>
          <p className="mt-2" style={{ color: lightColors.textSecondary }}>
            Thank you for registering <strong>{form.first_name}</strong> for {season?.name}!
          </p>
          <p className="text-sm mt-4" style={{ color: lightColors.textMuted }}>
            You'll receive a confirmation email at <strong>{form.parent_email}</strong> once your registration is reviewed.
          </p>
          
          {feeBreakdown.total > 0 && (
            <div className="mt-6 p-4 rounded-xl text-left" style={{ backgroundColor: lightColors.cardAlt }}>
              <p className="text-sm font-medium mb-3" style={{ color: lightColors.textSecondary }}>Payment Summary</p>
              {feeBreakdown.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: lightColors.border }}>
                  <div>
                    <span className="mr-2">{item.icon}</span>
                    <span style={{ color: item.isDiscount ? '#10B981' : lightColors.text }}>{item.name}</span>
                  </div>
                  <span className="font-medium" style={{ color: item.isDiscount ? '#10B981' : lightColors.text }}>
                    {item.isDiscount ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-2 border-t-2" style={{ borderColor: accentColor }}>
                <span className="font-bold" style={{ color: lightColors.text }}>Total</span>
                <span className="text-xl font-bold" style={{ color: accentColor }}>${feeBreakdown.total.toFixed(2)}</span>
              </div>
              <p className="text-xs mt-3" style={{ color: lightColors.textMuted }}>
                Payment details will be sent after your registration is approved.
              </p>
            </div>
          )}

          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 font-semibold rounded-xl transition hover:brightness-110"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  // Error state (no season/org found)
  if (error && !season) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: lightColors.bg }}>
        <div className="rounded-2xl p-8 max-w-md text-center shadow-lg" style={{ backgroundColor: lightColors.card }}>
          <span className="text-6xl">😕</span>
          <h1 className="text-2xl font-bold mt-4" style={{ color: lightColors.text }}>Registration Not Found</h1>
          <p className="mt-2" style={{ color: lightColors.textSecondary }}>{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 font-semibold rounded-xl"
            style={{ backgroundColor: lightColors.cardAlt, color: lightColors.text }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: lightColors.bg }}>
      <div className="max-w-2xl mx-auto">
        {/* Header with org branding */}
        <div className="text-center mb-8">
          {organization?.logo_url ? (
            <img 
              src={organization.logo_url} 
              alt={organization.name} 
              className="w-20 h-20 mx-auto rounded-xl mb-4 object-cover shadow-md" 
            />
          ) : (
            <div 
              className="w-20 h-20 mx-auto rounded-xl mb-4 flex items-center justify-center shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <span className="text-3xl text-white">{organization?.name?.charAt(0) || '⚽'}</span>
            </div>
          )}
          <h1 className="text-3xl font-bold" style={{ color: lightColors.text }}>
            {organization?.name || 'Registration'}
          </h1>
          <p className="mt-2 text-lg" style={{ color: lightColors.textSecondary }}>
            {season?.sports?.icon} {season?.name}
          </p>
          {season?.start_date && (
            <p className="text-sm mt-1" style={{ color: lightColors.textMuted }}>
              Season starts {new Date(season.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Fee Breakdown Card */}
        {feeBreakdown.total > 0 && (
          <div 
            className="mb-6 rounded-2xl overflow-hidden shadow-md" 
            style={{ backgroundColor: lightColors.card }}
          >
            {/* Total header */}
            <div 
              className="p-4 text-center cursor-pointer"
              style={{ backgroundColor: `${accentColor}10` }}
              onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
            >
              <p className="text-sm font-medium" style={{ color: lightColors.textSecondary }}>
                Total Registration Cost
              </p>
              <p className="text-4xl font-bold mt-1" style={{ color: accentColor }}>
                ${feeBreakdown.total.toFixed(2)}
              </p>
              <button 
                className="mt-2 text-sm flex items-center justify-center mx-auto gap-1"
                style={{ color: accentColor }}
              >
                {showFeeBreakdown ? 'Hide' : 'View'} payment breakdown
                <span className={`transition-transform ${showFeeBreakdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
            </div>
            
            {/* Breakdown details */}
            {showFeeBreakdown && (
              <div className="p-4 border-t" style={{ borderColor: lightColors.border }}>
                {feeBreakdown.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex justify-between items-start py-3 ${idx > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: lightColors.border }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p 
                          className="font-medium"
                          style={{ color: item.isDiscount ? '#10B981' : lightColors.text }}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs" style={{ color: lightColors.textMuted }}>
                          {item.dueDate}
                        </p>
                      </div>
                    </div>
                    <span 
                      className="font-semibold"
                      style={{ color: item.isDiscount ? '#10B981' : lightColors.text }}
                    >
                      {item.isDiscount ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pre-fill Notice */}
        {prefillNotice && (
          <div 
            className="mb-6 p-4 rounded-xl"
            style={{ 
              backgroundColor: prefillNotice.type === 'reregister' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${prefillNotice.type === 'reregister' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
            }}
          >
            <p style={{ color: prefillNotice.type === 'reregister' ? '#059669' : '#2563EB' }}>
              ✨ {prefillNotice.message}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div 
            className="mb-6 p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <p style={{ color: '#DC2626' }}>⚠️ {error}</p>
          </div>
        )}

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="rounded-2xl p-6 space-y-6 shadow-md"
          style={{ backgroundColor: lightColors.card }}
        >
          {/* Player Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: lightColors.text }}>
              Player Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  First Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm({...form, first_name: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text,
                    '--tw-ring-color': accentColor
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Last Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm({...form, last_name: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.birth_date}
                  onChange={e => setForm({...form, birth_date: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Grade
                </label>
                <select
                  value={form.grade}
                  onChange={e => setForm({...form, grade: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                >
                  <option value="">Select grade</option>
                  {['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                    <option key={g} value={g}>{g === 'K' ? 'Kindergarten' : `Grade ${g}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={e => setForm({...form, gender: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  School
                </label>
                <input
                  type="text"
                  value={form.school}
                  onChange={e => setForm({...form, school: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: lightColors.text }}>
              Parent/Guardian Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Parent/Guardian Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.parent_name}
                  onChange={e => setForm({...form, parent_name: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.parent_phone}
                  onChange={e => setForm({...form, parent_phone: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Email Address <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.parent_email}
                  onChange={e => setForm({...form, parent_email: e.target.value})}
                  required
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: lightColors.text }}>
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={form.emergency_contact}
                  onChange={e => setForm({...form, emergency_contact: e.target.value})}
                  placeholder="Someone other than parent"
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.emergency_phone}
                  onChange={e => setForm({...form, emergency_phone: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `1px solid ${lightColors.border}`, 
                    color: lightColors.text 
                  }}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                Medical Notes / Allergies
              </label>
              <textarea
                value={form.medical_notes}
                onChange={e => setForm({...form, medical_notes: e.target.value})}
                rows={3}
                placeholder="Any medical conditions, allergies, or special needs we should know about..."
                className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: lightColors.cardAlt, 
                  border: `1px solid ${lightColors.border}`, 
                  color: lightColors.text 
                }}
              />
            </div>
          </div>

          {/* Waivers */}
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: lightColors.text }}>
              Waivers & Agreements
            </h2>
            <div className="space-y-3">
              <label 
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:shadow-sm"
                style={{ backgroundColor: lightColors.cardAlt, border: `1px solid ${lightColors.border}` }}
              >
                <input
                  type="checkbox"
                  checked={form.waiver_liability}
                  onChange={e => setForm({...form, waiver_liability: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded"
                  style={{ accentColor: accentColor }}
                />
                <div>
                  <p className="font-medium" style={{ color: lightColors.text }}>Liability Waiver</p>
                  <p className="text-sm" style={{ color: lightColors.textSecondary }}>
                    I understand and accept the risks associated with participation in athletic activities.
                  </p>
                </div>
              </label>
              
              <label 
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:shadow-sm"
                style={{ backgroundColor: lightColors.cardAlt, border: `1px solid ${lightColors.border}` }}
              >
                <input
                  type="checkbox"
                  checked={form.waiver_photo}
                  onChange={e => setForm({...form, waiver_photo: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded"
                  style={{ accentColor: accentColor }}
                />
                <div>
                  <p className="font-medium" style={{ color: lightColors.text }}>Photo/Video Release</p>
                  <p className="text-sm" style={{ color: lightColors.textSecondary }}>
                    I consent to photos and videos being taken and used for promotional purposes.
                  </p>
                </div>
              </label>
              
              <label 
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition hover:shadow-sm"
                style={{ backgroundColor: lightColors.cardAlt, border: `1px solid ${lightColors.border}` }}
              >
                <input
                  type="checkbox"
                  checked={form.waiver_conduct}
                  onChange={e => setForm({...form, waiver_conduct: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded"
                  style={{ accentColor: accentColor }}
                />
                <div>
                  <p className="font-medium" style={{ color: lightColors.text }}>Code of Conduct</p>
                  <p className="text-sm" style={{ color: lightColors.textSecondary }}>
                    I agree to follow the organization's code of conduct and sportsmanship guidelines.
                  </p>
                </div>
              </label>
            </div>
            
            {(form.waiver_liability || form.waiver_photo || form.waiver_conduct) && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: lightColors.textSecondary }}>
                  Electronic Signature (type your full legal name)
                </label>
                <input
                  type="text"
                  value={form.waiver_signed_by}
                  onChange={e => setForm({...form, waiver_signed_by: e.target.value})}
                  placeholder="Type your full name to sign"
                  className="w-full rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: lightColors.cardAlt, 
                    border: `2px dashed ${lightColors.border}`, 
                    color: lightColors.text,
                    fontStyle: 'italic'
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 font-bold rounded-xl transition hover:brightness-110 disabled:opacity-50 shadow-md"
            style={{ backgroundColor: accentColor, color: '#fff' }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Registration'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: lightColors.textMuted }}>
          Powered by VolleyBrain
        </p>
      </div>
    </div>
  )
}

export { PublicRegistrationPage }
