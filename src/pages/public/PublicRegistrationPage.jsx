// PublicRegistrationPage — orchestrator for public season registration
// Sub-components in RegistrationFormSteps.jsx, constants in registrationConstants.jsx

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
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
        season_id: seasonId || null,
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

      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*, sports(name, icon)')
        .eq('id', seasonId)
        .eq('organization_id', orgData.id)
        .single()

      if (!seasonData) { setError('Season not found'); setLoading(false); return }
      setSeason(seasonData)

      // Merge saved config with defaults — if a section is missing or empty, use DEFAULT_CONFIG
      const raw = seasonData.registration_config
      const hasFields = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length > 0 &&
        Object.values(obj).some(v => v && typeof v === 'object' && 'enabled' in v)
      const resolved = (raw && typeof raw === 'object') ? {
        player_fields: hasFields(raw.player_fields) ? raw.player_fields : DEFAULT_CONFIG.player_fields,
        parent_fields: hasFields(raw.parent_fields) ? raw.parent_fields : DEFAULT_CONFIG.parent_fields,
        emergency_fields: hasFields(raw.emergency_fields) ? raw.emergency_fields : DEFAULT_CONFIG.emergency_fields,
        medical_fields: hasFields(raw.medical_fields) ? raw.medical_fields : DEFAULT_CONFIG.medical_fields,
        waivers: hasFields(raw.waivers) ? raw.waivers : DEFAULT_CONFIG.waivers,
        custom_questions: Array.isArray(raw.custom_questions) && raw.custom_questions.length > 0
          ? raw.custom_questions : DEFAULT_CONFIG.custom_questions,
      } : DEFAULT_CONFIG
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
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Could not load registration information')
    }
    setLoading(false)
  }

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
            emergency_name: sharedInfo.emergency_name || null,
            emergency_phone: sharedInfo.emergency_phone || null,
            medical_notes: sharedInfo.medical_conditions || null,
            status: 'new', season_id: seasonId
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
            player_id: player.id, season_id: seasonId, status: 'new',
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

  // ─── Org branding ──────────────────────────────────────────────────────
  const orgSettings = organization?.settings || {}
  const orgBranding = orgSettings.branding || {}
  const accentColor = orgBranding.primary_color || orgSettings.primary_color || '#4BB9EC'
  const orgTagline = orgBranding.tagline || orgSettings.tagline || ''

  // ─── Main render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-lynx-cloud">
      {/* Branded header */}
      <div className="bg-lynx-navy">
        <div className="px-4 py-8 text-center">
          {organization?.logo_url && (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="w-20 h-20 mx-auto rounded-xl mb-4 object-cover border-2 border-white/20 shadow-soft-md"
            />
          )}
          <h1 className="text-r-2xl font-bold text-white">
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
      <div className="px-4 py-8">
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
            className="w-full py-4 rounded-lg font-bold text-r-lg transition-all bg-lynx-navy text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-sm"
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
