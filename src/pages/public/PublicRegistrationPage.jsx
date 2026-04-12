// PublicRegistrationPage — orchestrator for public season registration
// Sub-components in RegistrationFormSteps.jsx, constants in registrationConstants.jsx

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { parseLocalDate } from '../../lib/date-helpers'
import { EmailService } from '../../lib/email-service'
import { createInvitation, checkExistingAccount } from '../../lib/invite-utils'
import { AlertCircle, Info } from '../../constants/icons'
import { DEFAULT_CONFIG, PLAYER_FIELD_MAP, SHARED_FIELD_MAP, calculateFeePerChild } from './registrationConstants'
import { previewFeesForPlayer, getFeeSummary } from '../../lib/fee-calculator'
import {
  ChildrenListCard, PlayerInfoCard, AddChildButton,
  SharedInfoCard, CustomQuestionsCard
} from './RegistrationFormSteps'
import {
  WaiversCard, FeePreviewCard, SuccessScreen, LoadingScreen, ErrorScreen
} from './RegistrationScreens'

function PublicRegistrationPage({ orgIdOrSlug: propOrgId, seasonId: propSeasonId, preloadedSeason, preloadedOrganization }) {
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
  const [registrationIds, setRegistrationIds] = useState([])
  const [parentInviteUrl, setParentInviteUrl] = useState(null)
  const [capacityInfo, setCapacityInfo] = useState(null)

  // Draft restore state
  const [showDraftRestore, setShowDraftRestore] = useState(false)
  const [savedDraft, setSavedDraft] = useState(null)

  // Preview mode — blocks real submissions
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true'

  // ─── Auto-save draft key ────────────────────────────────────────────────
  const DRAFT_KEY = `lynx-registration-draft-${seasonId || 'unknown'}`

  // ─── Auto-save form state to sessionStorage (scoped to browser tab) ───
  useEffect(() => {
    if (children.length === 0 && !currentChild?.first_name) return
    const draft = {
      children,
      currentChild,
      sharedInfo,
      customAnswers,
      savedAt: new Date().toISOString()
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch (e) { /* sessionStorage full or unavailable */ }
  }, [children, currentChild, sharedInfo, customAnswers])

  // ─── Restore draft on page load ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft = JSON.parse(raw)
        const savedAt = new Date(draft.savedAt)
        const daysSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince < 7) {
          setSavedDraft(draft)
          setShowDraftRestore(true)
        } else {
          sessionStorage.removeItem(DRAFT_KEY)
        }
      }
    } catch (e) {
      sessionStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  function restoreDraft() {
    if (savedDraft) {
      setChildren(savedDraft.children || [])
      setCurrentChild(savedDraft.currentChild || {})
      setSharedInfo(savedDraft.sharedInfo || {})
      setCustomAnswers(savedDraft.customAnswers || {})
    }
    setShowDraftRestore(false)
  }

  function discardDraft() {
    sessionStorage.removeItem(DRAFT_KEY)
    setShowDraftRestore(false)
  }

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
    if (isPreview) return
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
  useEffect(() => { loadSeasonData() }, [orgIdOrSlug, seasonId, preloadedSeason, preloadedOrganization])

  async function loadSeasonData() {
    // If preloaded data provided (template preview), skip Supabase queries
    if (preloadedSeason && preloadedOrganization) {
      setOrganization(preloadedOrganization)
      setSeason(preloadedSeason)
      await loadSeasonConfig(preloadedSeason)
      setLoading(false)
      return
    }

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

      // ─── Registration date enforcement ─────────────────────────────────
      const today = new Date().toISOString().split('T')[0]

      if (seasonData.registration_opens && today < seasonData.registration_opens) {
        const opensDate = parseLocalDate(seasonData.registration_opens).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        })
        setError(`Registration opens on ${opensDate}. Check back then!`)
        setLoading(false)
        return
      }

      if (seasonData.registration_closes && today > seasonData.registration_closes) {
        setError('Registration for this season has closed.')
        setLoading(false)
        return
      }

      // ─── Capacity info ──────────────────────────────────────────────────
      if (seasonData.capacity) {
        const { count } = await supabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('season_id', seasonData.id)
          .not('status', 'eq', 'denied')

        const filled = count || 0
        const remaining = seasonData.capacity - filled
        setCapacityInfo({
          total: seasonData.capacity,
          filled,
          remaining,
          waitlistEnabled: seasonData.waitlist_enabled || false,
          waitlistCapacity: seasonData.waitlist_capacity || 0,
        })

        // Block registration if full and no waitlist
        if (remaining <= 0 && !seasonData.waitlist_enabled) {
          setError('This season is currently full. Registration is not available.')
          setLoading(false)
          return
        }
      }

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

  // ─── Fee calculation (full engine with discounts) ──────────────────────
  const feePerChild = calculateFeePerChild(season)
  const allChildrenForFee = [...children, ...(currentChild?.first_name ? [currentChild] : [])]
  const childCountForFee = Math.max(allChildrenForFee.length, 1)

  const feeBreakdowns = allChildrenForFee.length > 0
    ? allChildrenForFee.map((child, index) => {
        const fees = previewFeesForPlayer(
          { ...child, parent_email: sharedInfo.parent1_email },
          season || {},
          index  // siblingIndex: 0 = first child, 1 = second child, etc.
        )
        return { fees, summary: getFeeSummary(fees) }
      })
    : season ? [{ fees: previewFeesForPlayer({ parent_email: sharedInfo.parent1_email }, season, 0), summary: getFeeSummary(previewFeesForPlayer({ parent_email: sharedInfo.parent1_email }, season, 0)) }] : []

  const totalFee = feeBreakdowns.reduce((sum, fb) => sum + fb.summary.total, 0)
  const totalDiscounts = feeBreakdowns.reduce((sum, fb) => {
    // Calculate discount as diff between base fee and actual charged fee
    const baseFee = calculateFeePerChild(season)
    return sum + Math.max(0, baseFee - fb.summary.total)
  }, 0)
  const hasDiscounts = feeBreakdowns.some(fb => fb.summary.hasEarlyBird || fb.summary.hasSiblingDiscount)

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

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Registration is taking longer than expected. Please check your connection and try again.')), 30000)
    )

    const submitRegistration = async () => {
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

      // ─── Capacity enforcement before submission ──────────────────────
      if (season?.capacity) {
        const { count: existingCount } = await supabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('season_id', season.id)
          .not('status', 'eq', 'denied')

        const spotsRemaining = season.capacity - (existingCount || 0)

        if (allChildren.length > spotsRemaining) {
          if (spotsRemaining <= 0) {
            if (!season.waitlist_enabled) {
              throw new Error('This season is currently full. Registration is not available.')
            }
            // Waitlist enabled — will set status to 'waitlisted' in the loop below
          } else {
            throw new Error(`Only ${spotsRemaining} spot${spotsRemaining > 1 ? 's' : ''} remaining. You are trying to register ${allChildren.length} child${allChildren.length > 1 ? 'ren' : ''}.`)
          }
        }
      }

      // Determine registration status based on capacity
      const isWaitlisted = season?.capacity && capacityInfo && capacityInfo.remaining <= 0 && season.waitlist_enabled
      const registrationStatus = isWaitlisted ? 'waitlisted' : 'new'

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

      // ─── Find or create family record ─────────────────────────────────
      let familyId = null
      let familyIsNew = false
      const parentEmail = sharedInfo.parent1_email?.trim().toLowerCase()

      if (parentEmail) {
        // Check if family already exists for this email
        const { data: existingFamily } = await supabase
          .from('families')
          .select('id')
          .eq('primary_email', parentEmail)
          .maybeSingle()

        if (existingFamily) {
          familyId = existingFamily.id
          // Update family record with latest info
          await supabase
            .from('families')
            .update({
              name: sharedInfo.parent1_name ? `${sharedInfo.parent1_name} Family` : null,
              primary_contact_name: sharedInfo.parent1_name || null,
              primary_contact_phone: sharedInfo.parent1_phone || null,
              primary_contact_email: parentEmail,
              secondary_contact_name: sharedInfo.parent2_name || null,
              secondary_contact_phone: sharedInfo.parent2_phone || null,
              secondary_contact_email: sharedInfo.parent2_email?.trim().toLowerCase() || null,
              address: sharedInfo.address || null,
              emergency_contact_name: sharedInfo.emergency_name || null,
              emergency_contact_phone: sharedInfo.emergency_phone || null,
              emergency_contact_relation: sharedInfo.emergency_relation || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingFamily.id)
        } else {
          // Create new family record
          const { data: newFamily, error: familyError } = await supabase
            .from('families')
            .insert({
              name: sharedInfo.parent1_name ? `${sharedInfo.parent1_name} Family` : 'Family',
              primary_email: parentEmail,
              primary_phone: sharedInfo.parent1_phone || null,
              primary_contact_name: sharedInfo.parent1_name || null,
              primary_contact_phone: sharedInfo.parent1_phone || null,
              primary_contact_email: parentEmail,
              secondary_contact_name: sharedInfo.parent2_name || null,
              secondary_contact_phone: sharedInfo.parent2_phone || null,
              secondary_contact_email: sharedInfo.parent2_email?.trim().toLowerCase() || null,
              address: sharedInfo.address || null,
              emergency_contact_name: sharedInfo.emergency_name || null,
              emergency_contact_phone: sharedInfo.emergency_phone || null,
              emergency_contact_relation: sharedInfo.emergency_relation || null,
            })
            .select('id')
            .single()

          if (!familyError && newFamily) {
            familyId = newFamily.id
            familyIsNew = true
          }
          // If family creation fails, continue without — registration should still work
        }
      }

      for (const child of allChildren) {
        const gradeValue = child.grade ? (child.grade === 'K' ? 0 : parseInt(child.grade)) : null

        // Build consolidated medical_notes from all medical fields
        const medicalNotesParts = [
          sharedInfo.medical_conditions,
          sharedInfo.allergies ? `Allergies: ${sharedInfo.allergies}` : null,
          sharedInfo.medications ? `Medications: ${sharedInfo.medications}` : null,
        ].filter(Boolean)

        // Map waiver booleans — check waiver keys dynamically since template keys may vary
        const waiverEntries = Object.entries(waiverState || {})
        const waiverLiability = waiverEntries.some(([k, v]) => v === true && (k.includes('liability') || k === 'waiver_liability'))
        const waiverPhoto = waiverEntries.some(([k, v]) => v === true && (k.includes('photo') || k === 'photo_release'))
        const waiverConduct = waiverEntries.some(([k, v]) => v === true && (k.includes('conduct') || k === 'code_of_conduct'))
        const waiverAnySigned = Object.values(waiverState || {}).some(v => v === true)

        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            // Player info
            first_name: child.first_name,
            last_name: child.last_name,
            birth_date: child.birth_date || null,
            grade: gradeValue,
            gender: child.gender || null,
            school: child.school || null,
            jersey_size: child.jersey_size || null,
            jersey_pref_1: child.preferred_number ? parseInt(child.preferred_number) : null,
            position: child.position_preference || null,
            experience_level: child.experience_level || null,
            experience_details: child.previous_teams || null,

            // Parent 1
            parent_name: sharedInfo.parent1_name || null,
            parent_email: sharedInfo.parent1_email || null,
            parent_phone: sharedInfo.parent1_phone || null,

            // Parent 2 (both column variants exist in schema)
            parent_2_name: sharedInfo.parent2_name || null,
            parent_2_email: sharedInfo.parent2_email || null,
            parent_2_phone: sharedInfo.parent2_phone || null,
            parent2_name: sharedInfo.parent2_name || null,
            parent2_email: sharedInfo.parent2_email || null,
            parent2_phone: sharedInfo.parent2_phone || null,

            // Address
            address: sharedInfo.address || null,
            city: sharedInfo.city || null,
            state: sharedInfo.state || null,
            zip: sharedInfo.zip || null,

            // Emergency contact
            emergency_contact_name: sharedInfo.emergency_name || null,
            emergency_contact_phone: sharedInfo.emergency_phone || null,
            emergency_contact_relation: sharedInfo.emergency_relation || null,

            // Medical
            medical_conditions: sharedInfo.medical_conditions || null,
            allergies: sharedInfo.allergies || null,
            medications: sharedInfo.medications || null,
            medical_notes: medicalNotesParts.join('; ') || null,

            // Waiver booleans (so admin views can read them)
            waiver_liability: waiverLiability,
            waiver_photo: waiverPhoto,
            waiver_conduct: waiverConduct,
            waiver_signed: waiverAnySigned,
            waiver_signed_by: signature?.trim() || null,
            waiver_signed_date: signature?.trim() ? new Date().toISOString() : null,

            // Family link
            family_id: familyId,

            // Status and metadata
            status: registrationStatus,
            season_id: season?.id || seasonId,
            registration_date: new Date().toISOString(),
            registration_source: 'public_form',
            sport_id: season?.sport_id || null,
          })
          .select().single()

        if (playerError) {
          console.error('Player insert error:', playerError)
          if (playerError.code === '23505') throw new Error(`${child.first_name} ${child.last_name} may already be registered for this season.`)
          throw new Error(`Failed to register ${child.first_name}`)
        }
        createdPlayerIds.push(player.id)

        // Check for existing registration before inserting
        const { data: existingReg } = await supabase
          .from('registrations')
          .select('id')
          .eq('player_id', player.id)
          .eq('season_id', season?.id || seasonId)
          .maybeSingle()

        if (existingReg) {
          console.warn('Duplicate registration detected for player:', child.first_name)
          setError(`${child.first_name} is already registered for this season.`)
          continue
        }

        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .insert({
            player_id: player.id, season_id: season?.id || seasonId, status: registrationStatus,
            family_id: familyId,
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
          if (regError.code === '23505') {
            // Registration already exists — inform user instead of silently swallowing
            console.warn('Duplicate registration detected for player:', child.first_name)
            setError(`${child.first_name} is already registered for this season.`)
          } else {
            throw new Error(`Failed to create registration for ${child.first_name}`)
          }
        } else if (registration) {
          createdRegistrationIds.push(registration.id)
        }
      }

      trackFunnelEvent('form_submitted', null, { children_count: allChildren.length })
      setRegistrationIds(createdRegistrationIds)

      // Create parent invite + send registration confirmation email
      if (sharedInfo.parent1_email) {
        let inviteUrl = null
        try {
          const parentEmail = sharedInfo.parent1_email.trim().toLowerCase()
          const existingProfile = await checkExistingAccount(parentEmail)

          // If parent already has an account, sync emergency contact to their profile
          if (existingProfile?.id && (sharedInfo.emergency_name || sharedInfo.emergency_phone)) {
            try {
              await supabase.from('profiles').update({
                emergency_contact_name: sharedInfo.emergency_name || null,
                emergency_contact_phone: sharedInfo.emergency_phone || null,
                emergency_contact_relation: sharedInfo.emergency_relation || null,
              }).eq('id', existingProfile.id)
            } catch { /* non-critical — data is already on player records */ }
          }

          if (!existingProfile && organization?.id) {
            const invite = await createInvitation({
              organizationId: organization.id,
              email: parentEmail,
              inviteType: 'parent',
              role: 'parent',
              invitedBy: null,  // self-initiated via registration
              metadata: {
                playerIds: createdPlayerIds,
                registrationIds: createdRegistrationIds,
                seasonId: season?.id,
                source: 'registration',
              },
              expiresInHours: 168,  // 7 days for parent invites
            })
            inviteUrl = `${window.location.origin}/invite/parent/${invite.invite_code}`
            setParentInviteUrl(inviteUrl)
          }
        } catch (inviteErr) {
          console.error('Failed to create parent invite:', inviteErr)
          // Don't block registration success if invite creation fails
        }

        for (const child of allChildren) {
          try {
            await EmailService.sendRegistrationConfirmation({
              recipientEmail: sharedInfo.parent1_email,
              recipientName: sharedInfo.parent1_name || sharedInfo.parent1_email,
              playerName: `${child.first_name} ${child.last_name}`,
              seasonName: season?.name || '',
              organizationId: organization?.id,
              organizationName: organization?.name || '',
              inviteUrl,
            })
          } catch (emailErr) {
            console.error('Failed to send confirmation email:', emailErr)
          }
        }
      }

      sessionStorage.removeItem(DRAFT_KEY)
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
      // Only delete the family if we just created it AND all children were rolled back
      if (familyId && familyIsNew) {
        console.log('Rolling back newly created family:', familyId)
        await supabase.from('families').delete().eq('id', familyId)
      }
      setError(err.message || 'Registration failed. Please try again.')
    }
    }

    try {
      await Promise.race([submitRegistration(), timeout])
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
          registrationIds={registrationIds}
          inviteUrl={parentInviteUrl}
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
                {s.start_date && <p className="text-xs text-slate-400 mt-1">Starts {parseLocalDate(s.start_date).toLocaleDateString()}</p>}
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
              Starts {parseLocalDate(season.start_date).toLocaleDateString()}
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
      <div className="px-4 py-6 pb-24 max-w-2xl mx-auto">
        {/* Fee Preview */}
        <FeePreviewCard
          season={season}
          feePerChild={feePerChild}
          childrenCount={childCountForFee}
          totalFee={totalFee}
          hasDiscounts={hasDiscounts}
          totalDiscounts={totalDiscounts}
          feeBreakdowns={feeBreakdowns}
          showBreakdown={showFeeBreakdown}
          onToggleBreakdown={() => setShowFeeBreakdown(!showFeeBreakdown)}
          accentColor={accentColor}
        />

        {/* Capacity indicator */}
        {capacityInfo && (
          <div className={`mb-4 p-4 rounded-[14px] border flex items-center gap-3 ${
            capacityInfo.remaining <= 0
              ? 'bg-red-50 border-red-200'
              : capacityInfo.remaining <= Math.ceil(capacityInfo.total * 0.2)
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex-1">
              <p className={`text-r-sm font-semibold ${
                capacityInfo.remaining <= 0 ? 'text-red-700' : capacityInfo.remaining <= Math.ceil(capacityInfo.total * 0.2) ? 'text-amber-700' : 'text-blue-700'
              }`}>
                {capacityInfo.remaining <= 0
                  ? (capacityInfo.waitlistEnabled ? 'Season is full — waitlist available' : 'Season is full')
                  : `${capacityInfo.filled} of ${capacityInfo.total} spots filled`
                }
              </p>
              {capacityInfo.remaining > 0 && (
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capacityInfo.remaining <= Math.ceil(capacityInfo.total * 0.2) ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (capacityInfo.filled / capacityInfo.total) * 100)}%` }}
                  />
                </div>
              )}
              {capacityInfo.remaining > 0 && capacityInfo.remaining <= Math.ceil(capacityInfo.total * 0.2) && (
                <p className="text-r-xs text-amber-600 mt-1">
                  Only {capacityInfo.remaining} spot{capacityInfo.remaining > 1 ? 's' : ''} remaining — register now!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Registration closing soon banner */}
        {season?.registration_closes && (() => {
          const today = new Date()
          const closes = parseLocalDate(season.registration_closes)
          const daysUntilClose = Math.ceil((closes - today) / (1000 * 60 * 60 * 24))
          if (daysUntilClose > 0 && daysUntilClose <= 7) {
            return (
              <div className="mb-4 p-4 rounded-[14px] bg-amber-50 border border-amber-200">
                <p className="text-r-sm font-semibold text-amber-700">
                  Registration closes on {closes.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — don't miss out!
                </p>
              </div>
            )
          }
          return null
        })()}

        {/* Draft restore prompt */}
        {showDraftRestore && (
          <div className="mb-6 p-4 rounded-[14px] bg-sky-50 border border-sky-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-sky-600 shrink-0" />
              <p className="text-sm text-sky-800">
                You have an unfinished registration. Would you like to continue where you left off?
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3 py-1.5 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-3 py-1.5 text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

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
            onClick={() => {
              setCurrentChild({ last_name: children[0]?.last_name || '' })
              setShowAddChildForm(true)
            }}
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
