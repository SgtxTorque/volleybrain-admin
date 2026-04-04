// PublicRegistrationPage — orchestrator for public season registration
// Sub-components in RegistrationFormSteps.jsx, constants in registrationConstants.jsx

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { EmailService } from '../../lib/email-service'
import { AlertCircle } from '../../constants/icons'
import { DEFAULT_CONFIG, PLAYER_FIELD_MAP, SHARED_FIELD_MAP, calculateFeePerChild } from './registrationConstants'
import {
  ChildrenListCard, PlayerInfoCard, AddChildButton,
  SharedInfoCard, CustomQuestionsCard
} from './RegistrationFormSteps'
import {
  WaiversCard, FeePreviewCard, SuccessScreen, LoadingScreen, ErrorScreen
} from './RegistrationScreens'

function PublicRegistrationPage({ orgIdOrSlug: propOrgId, seasonId: propSeasonId }) {
  const params = useParams()
  const orgIdOrSlug = propOrgId || params.orgIdOrSlug
  const seasonId = propSeasonId || params.seasonId

  // Multi-child state
  const [children, setChildren] = useState([])
  const [currentChild, setCurrentChild] = useState({})
  const [editingChildIndex, setEditingChildIndex] = useState(null)
  const [showAddChildForm, setShowAddChildForm] = useState(false)

  // Shared info (parent, emergency, medical)
  const [sharedInfo, setSharedInfo] = useState({})
  const [waiverState, setWaiverState] = useState({})
  const [customAnswers, setCustomAnswers] = useState({})
  const [signature, setSignature] = useState('')

  // App state
  const [season, setSeason] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)
  const [prefillApplied, setPrefillApplied] = useState(false)
  const [formStartTracked, setFormStartTracked] = useState(false)
  const [availableSeasons, setAvailableSeasons] = useState(null)

  // Preview mode — blocks real submissions
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true'

  // ─── Funnel tracking (fire-and-forget) ─────────────────────────────────
  function getSessionId() {
    let sid = sessionStorage.getItem('vb_session')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('vb_session', sid)
    }
    return sid
  }

  async function trackFunnelEvent(eventType, stepName = null, metadata = {}) {
    try {
      await supabase.from('registration_funnel_events').insert({
        organization_id: organization?.id || null,
        season_id: season?.id || seasonId || null,
        event_type: eventType,
        step_name: stepName,
        session_id: getSessionId(),
        source: new URLSearchParams(window.location.search).get('src') || 'direct',
        metadata
      })
    } catch (e) { /* silent fail */ }
  }

  function trackFormStart() {
    if (!formStartTracked) {
      setFormStartTracked(true)
      trackFunnelEvent('form_started')
    }
  }

  // ─── URL prefill ───────────────────────────────────────────────────────
  useEffect(() => {
    if (prefillApplied) return
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('prefill') !== 'true') return

    const playerPrefill = {}
    const sharedPrefill = {}

    for (const [urlKey, formKey] of Object.entries(PLAYER_FIELD_MAP)) {
      const value = urlParams.get(urlKey)
      if (value) playerPrefill[formKey] = value
    }
    for (const [urlKey, formKey] of Object.entries(SHARED_FIELD_MAP)) {
      const value = urlParams.get(urlKey)
      if (value) sharedPrefill[formKey] = value
    }

    if (Object.keys(playerPrefill).length > 0) {
      setCurrentChild(prev => ({ ...prev, ...playerPrefill }))
    }
    if (Object.keys(sharedPrefill).length > 0) {
      setSharedInfo(prev => ({ ...prev, ...sharedPrefill }))
    }
    if (playerPrefill.first_name || playerPrefill.last_name) {
      setShowAddChildForm(true)
    }

    setPrefillApplied(true)
    console.log('Prefill applied:', { playerPrefill, sharedPrefill })
  }, [prefillApplied])

  // ─── Force light theme on public route ─────────────────────────────────
  useEffect(() => {
    document.body.classList.add('public-route')
    return () => document.body.classList.remove('public-route')
  }, [])

  // ─── Scroll to top on mount ────────────────────────────────────────────
  useEffect(() => { window.scrollTo({ top: 0 }) }, [])

  // ─── Load season data ──────────────────────────────────────────────────
  useEffect(() => { loadSeasonData() }, [orgIdOrSlug, seasonId])

  async function loadSeasonData() {
    try {
      let orgQuery = supabase.from('organizations').select('*')
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgIdOrSlug)
      orgQuery = isUUID ? orgQuery.eq('id', orgIdOrSlug) : orgQuery.eq('slug', orgIdOrSlug)
      const { data: orgData } = await orgQuery.single()

      if (!orgData) { setError('Organization not found'); setLoading(false); return }
      setOrganization(orgData)

      let seasonData = null

      if (seasonId) {
        // Season ID provided in URL — look it up directly
        const { data } = await supabase
          .from('seasons')
          .select('*, sports(name, icon)')
          .eq('id', seasonId)
          .eq('organization_id', orgData.id)
          .single()
        seasonData = data
        if (!seasonData) { setError('Season not found'); setLoading(false); return }
      } else {
        // No seasonId in URL — auto-select active season
        const { data: seasons } = await supabase
          .from('seasons')
          .select('*, sports(name, icon)')
          .eq('organization_id', orgData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (seasons?.length === 1) {
          seasonData = seasons[0]
        } else if (seasons?.length > 1) {
          setAvailableSeasons(seasons)
          setLoading(false)
          return
        } else {
          setError('Registration is not currently open.')
          setLoading(false)
          return
        }
      }

      setSeason(seasonData)
      await loadSeasonConfig(seasonData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Could not load registration information')
    }
    setLoading(false)
  }

  async function loadSeasonConfig(seasonData) {
    // Merge saved config with defaults — if a section is missing or empty, use DEFAULT_CONFIG
    let raw = seasonData.registration_config

    const hasFields = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0 &&
      Object.values(obj).some(v => v && typeof v === 'object' && 'enabled' in v)

    // Check if raw config actually has meaningful field data (not just {} or null)
    const rawHasContent = raw && typeof raw === 'object' &&
      ['player_fields', 'parent_fields', 'emergency_fields', 'medical_fields'].some(k => hasFields(raw[k]))

    // If no usable config on the season, try to load from the linked template
    if (!rawHasContent && seasonData.registration_template_id) {
      const { data: template } = await supabase
        .from('registration_templates')
        .select('player_fields, parent_fields, emergency_fields, medical_fields, waivers, custom_questions')
        .eq('id', seasonData.registration_template_id)
        .single()
      if (template) {
        raw = {
          player_fields: template.player_fields,
          parent_fields: template.parent_fields,
          emergency_fields: template.emergency_fields,
          medical_fields: template.medical_fields,
          waivers: template.waivers,
          custom_questions: template.custom_questions,
        }
      }
    }

    // If STILL no usable config (no template linked either), try the org's default template
    if (!rawHasContent && !hasFields(raw?.player_fields)) {
      const { data: defaultTemplate } = await supabase
        .from('registration_templates')
        .select('player_fields, parent_fields, emergency_fields, medical_fields, waivers, custom_questions')
        .eq('organization_id', seasonData.organization_id)
        .eq('is_default', true)
        .maybeSingle()
      if (defaultTemplate) {
        raw = {
          player_fields: defaultTemplate.player_fields,
          parent_fields: defaultTemplate.parent_fields,
          emergency_fields: defaultTemplate.emergency_fields,
          medical_fields: defaultTemplate.medical_fields,
          waivers: defaultTemplate.waivers,
          custom_questions: defaultTemplate.custom_questions,
        }
      }
    }
    const resolved = (raw && typeof raw === 'object') ? {
      player_fields: hasFields(raw.player_fields) ? raw.player_fields : DEFAULT_CONFIG.player_fields,
      parent_fields: hasFields(raw.parent_fields) ? raw.parent_fields : DEFAULT_CONFIG.parent_fields,
      emergency_fields: hasFields(raw.emergency_fields) ? raw.emergency_fields : DEFAULT_CONFIG.emergency_fields,
      medical_fields: hasFields(raw.medical_fields) ? raw.medical_fields : DEFAULT_CONFIG.medical_fields,
      waivers: hasFields(raw.waivers) ? raw.waivers : DEFAULT_CONFIG.waivers,
      custom_questions: Array.isArray(raw.custom_questions) && raw.custom_questions.length > 0
        ? raw.custom_questions : DEFAULT_CONFIG.custom_questions,
    } : DEFAULT_CONFIG
    // Inject sport-specific position options if position_preference has empty options
    if (resolved.player_fields?.position_preference &&
        (!resolved.player_fields.position_preference.options || resolved.player_fields.position_preference.options.length === 0)) {
      const sportName = (seasonData?.sports?.name || 'volleyball').toLowerCase()
      const SPORT_POSITIONS = {
        volleyball: ['Setter (S)', 'Outside Hitter (OH)', 'Middle Blocker (MB)', 'Opposite (OPP)', 'Libero (L)', 'Defensive Specialist (DS)', 'Right Side Hitter (RS)', 'Utility'],
        basketball: ['Point Guard (PG)', 'Shooting Guard (SG)', 'Small Forward (SF)', 'Power Forward (PF)', 'Center (C)'],
        soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'No Preference'],
        baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield', 'No Preference'],
        softball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield', 'No Preference'],
        football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Defensive Back', 'Kicker', 'No Preference'],
      }
      const positions = SPORT_POSITIONS[sportName] || SPORT_POSITIONS.volleyball
      resolved.player_fields.position_preference.options = positions
    }

    setConfig(resolved)

    trackFunnelEvent('page_view', null, { season_name: seasonData.name })

    // Initialize waiver state from resolved config
    const waiverConfig = resolved.waivers
    const waiverInit = {}
    Object.keys(waiverConfig).forEach(key => {
      if (waiverConfig[key]?.enabled) waiverInit[key] = false
    })
    setWaiverState(waiverInit)

    // Initialize custom answers
    const customQs = resolved.custom_questions || []
    const customInit = {}
    customQs.forEach(q => { customInit[q.id] = q.type === 'checkbox' ? false : '' })
    setCustomAnswers(customInit)
  }

  // ─── Parent email pre-fill (returning families) ──────────────────────
  useEffect(() => {
    const email = sharedInfo.parent1_email?.trim()?.toLowerCase()
    if (!email || !email.includes('@') || !organization?.id) return

    const timer = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from('players')
          .select('parent_name, parent_phone, emergency_contact_name, emergency_contact_phone, medical_notes')
          .eq('parent_email', email)
          .order('created_at', { ascending: false })
          .limit(1)

        if (existing?.[0]) {
          const prev = existing[0]
          setSharedInfo(si => ({
            ...si,
            // Only fill empty fields — don't overwrite user edits
            parent1_name: si.parent1_name || prev.parent_name || '',
            parent1_phone: si.parent1_phone || prev.parent_phone || '',
            emergency_name: si.emergency_name || prev.emergency_contact_name || '',
            emergency_phone: si.emergency_phone || prev.emergency_contact_phone || '',
            medical_conditions: si.medical_conditions || prev.medical_notes || '',
          }))
        }
      } catch (e) { /* silent — prefill is best-effort */ }
    }, 600) // debounce 600ms

    return () => clearTimeout(timer)
  }, [sharedInfo.parent1_email, organization?.id])

  // ─── Fee calculation ───────────────────────────────────────────────────
  const feePerChild = calculateFeePerChild(season)
  const totalFee = feePerChild * Math.max(children.length, 1)

  // ─── Child validation / management ─────────────────────────────────────
  function validateCurrentChild() {
    const playerFields = config.player_fields || {}
    for (const [key, field] of Object.entries(playerFields)) {
      if (field.enabled && field.required && !currentChild[key]) {
        return `${field.label} is required for this child`
      }
    }
    return null
  }

  function addChild() {
    const validationError = validateCurrentChild()
    if (validationError) { setError(validationError); return }

    if (editingChildIndex !== null) {
      const updated = [...children]
      updated[editingChildIndex] = { ...currentChild }
      setChildren(updated)
      setEditingChildIndex(null)
    } else {
      setChildren([...children, { ...currentChild }])
    }

    trackFunnelEvent('step_completed', 'player_info', { child_count: children.length + 1 })
    setCurrentChild({})
    setShowAddChildForm(false)
    setError(null)
  }

  function editChild(index) {
    setCurrentChild({ ...children[index] })
    setEditingChildIndex(index)
    setShowAddChildForm(true)
  }

  function removeChild(index) {
    setChildren(children.filter((_, i) => i !== index))
    if (editingChildIndex === index) {
      setCurrentChild({})
      setEditingChildIndex(null)
    }
  }

  function cancelChildEdit() {
    setCurrentChild({})
    setEditingChildIndex(null)
    setShowAddChildForm(false)
    setError(null)
  }

  // ─── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (isPreview) {
      setSubmitted(true)
      return
    }
    setSubmitting(true)
    setError(null)

    const createdPlayerIds = []
    const createdRegistrationIds = []

    try {
      let allChildren = [...children]
      if (Object.keys(currentChild).length > 0 && currentChild.first_name) {
        const validationError = validateCurrentChild()
        if (validationError) throw new Error(validationError)
        allChildren = [...children, currentChild]
      }
      if (allChildren.length === 0) throw new Error('Please add at least one child to register')

      // Validate shared info
      const parentFields = config.parent_fields || {}
      const emergencyFields = config.emergency_fields || {}
      const waivers = config.waivers || {}

      for (const [key, field] of Object.entries(parentFields)) {
        if (field.enabled && field.required && !sharedInfo[key]) throw new Error(`${field.label} is required`)
      }
      for (const [key, field] of Object.entries(emergencyFields)) {
        if (field.enabled && field.required && !sharedInfo[key]) throw new Error(`${field.label} is required`)
      }
      for (const [key, waiver] of Object.entries(waivers)) {
        if (waiver.enabled && waiver.required && !waiverState[key]) throw new Error(`${waiver.title} must be accepted`)
      }

      const hasEnabledWaivers = Object.values(waivers).some(w => w?.enabled)
      if (hasEnabledWaivers && !signature.trim()) throw new Error('Please sign by typing your full name')

      const signatureDate = new Date().toISOString()

      for (const child of allChildren) {
        const gradeValue = child.grade ? (child.grade === 'K' ? 0 : parseInt(child.grade)) : null

        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            first_name: child.first_name, last_name: child.last_name,
            birth_date: child.birth_date || null, grade: gradeValue,
            gender: child.gender || null, school: child.school || null,
            parent_name: sharedInfo.parent1_name || null,
            parent_email: sharedInfo.parent1_email || null,
            parent_phone: sharedInfo.parent1_phone || null,
            emergency_contact_name: sharedInfo.emergency_name || null,
            emergency_contact_phone: sharedInfo.emergency_phone || null,
            medical_notes: sharedInfo.medical_conditions || null,
            status: 'new', season_id: season?.id || seasonId
          })
          .select().single()

        if (playerError) {
          console.error('Player insert error:', playerError)
          if (playerError.code === '23505') throw new Error(`${child.first_name} ${child.last_name} may already be registered for this season.`)
          throw new Error(`Failed to register ${child.first_name}`)
        }
        createdPlayerIds.push(player.id)

        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .insert({
            player_id: player.id, season_id: season?.id || seasonId, status: 'new',
            submitted_at: new Date().toISOString(),
            waivers_accepted: waiverState, custom_answers: customAnswers,
            signature_name: signature.trim() || null, signature_date: signatureDate,
            registration_data: {
              player: child, shared: sharedInfo, waivers: waiverState,
              custom_questions: customAnswers,
              signature: { name: signature.trim(), date: signatureDate }
            }
          })
          .select().single()

        if (regError) {
          console.error('Registration insert error:', regError)
          if (regError.code !== '23505') throw new Error(`Failed to create registration for ${child.first_name}`)
        } else if (registration) {
          createdRegistrationIds.push(registration.id)
        }
      }

      trackFunnelEvent('form_submitted', null, { children_count: allChildren.length })

      // Send registration confirmation email for each child
      if (sharedInfo.parent1_email) {
        for (const child of allChildren) {
          try {
            await EmailService.sendRegistrationConfirmation({
              recipientEmail: sharedInfo.parent1_email,
              recipientName: sharedInfo.parent1_name || sharedInfo.parent1_email,
              playerName: `${child.first_name} ${child.last_name}`,
              seasonName: season?.name || '',
              organizationId: organization?.id,
              organizationName: organization?.name || '',
            })
          } catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr)
            // Don't block registration success on email failure
          }
        }
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Registration error:', err)
      if (createdRegistrationIds.length > 0) {
        console.log('Rolling back registrations:', createdRegistrationIds)
        await supabase.from('registrations').delete().in('id', createdRegistrationIds)
      }
      if (createdPlayerIds.length > 0) {
        console.log('Rolling back players:', createdPlayerIds)
        await supabase.from('players').delete().in('id', createdPlayerIds)
      }
      setError(err.message || 'Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  // ─── Early-return screens ──────────────────────────────────────────────
  if (loading) return <LoadingScreen />
  if (submitted) {
    return (
      <>
        {isPreview && (
          <div className="bg-amber-500 text-white text-center py-2 font-bold text-r-sm">
            PREVIEW MODE — No data was submitted
          </div>
        )}
        <SuccessScreen
          childrenCount={children.length}
          seasonName={season?.name}
          totalFee={totalFee}
          currentChildName={currentChild.first_name}
          organization={organization}
        />
      </>
    )
  }
  if (error && !season) return <ErrorScreen message={error} />

  // Season selector when multiple active seasons and no seasonId in URL
  if (availableSeasons) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {organization?.logo_url && (
            <img src={organization.logo_url} alt={organization.name}
              className="w-16 h-16 mx-auto rounded-2xl mb-4 object-cover border-2 border-white/20 shadow-lg" />
          )}
          <h2 className="text-xl font-bold text-[#10284C] text-center mb-2" style={{ fontFamily: 'var(--v2-font)' }}>
            {organization?.name}
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">Select a season to register for:</p>
          <div className="space-y-3">
            {availableSeasons.map(s => (
              <button key={s.id} onClick={() => { setSeason(s); setAvailableSeasons(null); loadSeasonConfig(s) }}
                className="w-full p-4 bg-white rounded-xl border border-slate-200 text-left hover:border-[#4BB9EC] hover:shadow-md transition-all">
                <p className="font-semibold text-[#10284C]">{s.sports?.icon} {s.name}</p>
                {s.start_date && <p className="text-xs text-slate-400 mt-1">Starts {new Date(s.start_date).toLocaleDateString()}</p>}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Org branding ──────────────────────────────────────────────────────
  const orgSettings = organization?.settings || {}
  const orgBranding = orgSettings.branding || {}
  const accentColor = orgBranding.primary_color || orgSettings.primary_color || '#4BB9EC'
  const orgTagline = orgBranding.tagline || orgSettings.tagline || ''

  // ─── Main render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Branded header */}
      <div className="bg-lynx-navy">
        <div className="px-4 py-10 text-center max-w-2xl mx-auto">
          {organization?.logo_url && (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="w-20 h-20 mx-auto rounded-2xl mb-4 object-cover border-2 border-white/20 shadow-lg"
            />
          )}
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--v2-font)' }}>
            {organization?.name || 'Join the Den'}
          </h1>
          {orgTagline && (
            <p className="text-r-xs text-white/60 mt-1">{orgTagline}</p>
          )}
          <p className="mt-3 text-r-sm text-white/80">
            {season?.sports?.icon} {season?.name}
          </p>
          {season?.start_date && (
            <p className="text-r-xs text-white/50 mt-1">
              Starts {new Date(season.start_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Preview mode banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white text-center py-2 font-bold text-r-sm">
          PREVIEW MODE — This form will NOT submit real data
        </div>
      )}

      {/* Form body */}
      <div className="px-4 py-8 max-w-2xl mx-auto">
        {/* Fee Preview */}
        <FeePreviewCard
          season={season}
          feePerChild={feePerChild}
          childrenCount={children.length}
          showBreakdown={showFeeBreakdown}
          onToggleBreakdown={() => setShowFeeBreakdown(!showFeeBreakdown)}
          accentColor={accentColor}
        />

        {/* Inline error */}
        {error && (
          <div className="mb-6 p-4 rounded-[14px] bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-r-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Saved children list */}
          <ChildrenListCard children={children} onEdit={editChild} onRemove={removeChild} />

          {/* Player info form */}
          <PlayerInfoCard
            config={config}
            currentChild={currentChild}
            setCurrentChild={setCurrentChild}
            editingChildIndex={editingChildIndex}
            childrenCount={children.length}
            showAddChildForm={showAddChildForm}
            onSaveChild={addChild}
            onCancel={cancelChildEdit}
            trackFormStart={trackFormStart}
          />

          {/* Add another child */}
          <AddChildButton
            visible={children.length > 0 && !showAddChildForm && editingChildIndex === null}
            onClick={() => setShowAddChildForm(true)}
          />

          {/* Shared info: parent, emergency, medical */}
          <SharedInfoCard
            config={config}
            sharedInfo={sharedInfo}
            setSharedInfo={setSharedInfo}
            trackFormStart={trackFormStart}
          />

          {/* Custom questions */}
          <CustomQuestionsCard
            config={config}
            customAnswers={customAnswers}
            setCustomAnswers={setCustomAnswers}
          />

          {/* Waivers and signature */}
          <WaiversCard
            config={config}
            waiverState={waiverState}
            setWaiverState={setWaiverState}
            signature={signature}
            setSignature={setSignature}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || (children.length === 0 && !currentChild.first_name)}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-[#10284C] text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            {submitting ? 'Submitting...' : `Let's Get Started${children.length > 1 ? ` (${children.length} children)` : ''}`}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-r-xs text-slate-400 mt-8 pb-4">
          Powered by Lynx
        </p>
      </div>
    </div>
  )
}

export { PublicRegistrationPage }
