// =============================================================================
// FirstRunSetupPage — Dedicated guided setup flow for new org directors
// 5 sequential steps (identity, contact, sports, payments, fees) with Back/Next,
// progress bar, per-step celebration, and a final "Open for Business" moment.
//
// Reuses SetupSectionContent.jsx (same forms as /settings/organization) so we
// don't duplicate the 16 section forms. Same data shape, same save logic.
// The existing /settings/organization stays untouched — this is a NEW surface
// for first-run, not a replacement.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useCoachMarks } from '../../contexts/CoachMarkContext'
import { supabase } from '../../lib/supabase'
import { SetupSectionContent } from '../settings/SetupSectionContent'
import { awardXP } from '../../lib/xp-award-service'
import { XP_BY_SOURCE } from '../../lib/engagement-constants'

// ─── The 5 setup steps (Lynx voice — warm, encouraging, honest) ───
const SETUP_STEPS = [
  {
    key: 'identity',
    title: 'Your Club',
    subtitle: "First things first — let's make it yours.",
    icon: '🏢',
    fields: 'Name, logo, colors',
  },
  {
    key: 'contact',
    title: 'Contact Info',
    subtitle: 'How should families reach you?',
    icon: '📧',
    fields: 'Email, phone, address',
  },
  {
    key: 'sports',
    title: 'Sports & Programs',
    subtitle: 'What does your club play?',
    icon: '🏆',
    fields: 'Sports, age groups',
  },
  {
    key: 'payments',
    title: 'Money Stuff',
    subtitle: 'How do you want to get paid?',
    icon: '💰',
    fields: 'Payment methods',
  },
  {
    key: 'fees',
    title: 'Fee Structure',
    subtitle: 'Set your prices — discounts included.',
    icon: '🏷️',
    fields: 'Registration, uniforms, monthly dues',
  },
]

export default function FirstRunSetupPage({ showToast }) {
  const navigate = useNavigate()
  const { organization, setOrganization, profile } = useAuth()
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const journey = useJourney()
  const coachMarks = useCoachMarks()

  // Fire setup-flow coach-mark on first visit to /setup
  useEffect(() => {
    if (!coachMarks) return
    if (!coachMarks.hasUnseenMarks('admin', 'setup_first_load')) return
    const t = setTimeout(() => coachMarks.showMarks('admin', 'setup_first_load'), 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachMarks])

  // Step state
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(() => new Set())
  const [showCelebration, setShowCelebration] = useState(false)
  const prefilledSteps = useRef(new Set()) // steps that were done before the user started

  // Section form state (mirrors OrganizationPage's structure)
  const [setupData, setSetupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sectionHasChanges, setSectionHasChanges] = useState(false)
  const saveRef = useRef(null)

  // Companion data (waivers/venues/admins) — required by SetupSectionContent
  // even though identity/contact/sports/payments/fees don't use them
  const [waivers, setWaivers] = useState([])
  const [venues, setVenues] = useState([])
  const [adminUsers, setAdminUsers] = useState([])

  // ─── Load existing data on mount (mirrors OrganizationPage.loadSetupData) ───
  useEffect(() => {
    if (organization?.id) loadSetupData()
  }, [organization?.id])

  async function loadSetupData() {
    setLoading(true)
    try {
      const settings = organization.settings || {}
      const branding = settings.branding || {}

      setSetupData({
        // Identity
        name: organization.name || '',
        shortName: settings.short_name || '',
        tagline: settings.tagline || '',
        logoUrl: organization.logo_url || '',
        primaryColor: settings.primary_color || accent.primary,
        secondaryColor: settings.secondary_color || '',
        orgType: settings.org_type || 'club',
        foundedYear: settings.founded_year || '',
        mission: settings.mission || '',

        // Contact
        contactName: settings.contact_name || '',
        contactTitle: settings.contact_title || '',
        email: organization.contact_email || '',
        secondaryEmail: settings.secondary_email || '',
        phone: settings.phone || '',
        secondaryPhone: settings.secondary_phone || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        zip: settings.zip || '',
        timezone: settings.timezone || 'America/Chicago',
        officeHours: settings.office_hours || '',

        // Online (kept for SetupSectionContent compatibility)
        website: settings.website || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        registrationSlug: organization.slug || '',

        // Sports & Programs
        enabledSports: settings.enabled_sports || ['volleyball'],
        programTypes: settings.program_types || ['league'],
        ageSystem: settings.age_system || 'grade',
        ageCutoffDate: settings.age_cutoff_date || '08-01',
        skillLevels: settings.skill_levels || ['recreational', 'competitive'],
        genderOptions: settings.gender_options || ['girls', 'boys', 'coed'],

        // Payment Settings
        paymentMethods: settings.payment_methods || {},
        allowPaymentPlans: settings.allow_payment_plans || false,
        paymentPlanInstallments: settings.payment_plan_installments || 3,
        lateFeeAmount: settings.late_fee_amount || 15,
        gracePeriodDays: settings.grace_period_days || 7,

        // Fee Defaults
        defaultRegistrationFee: settings.default_registration_fee || 150,
        defaultUniformFee: settings.default_uniform_fee || 45,
        defaultMonthlyFee: settings.default_monthly_fee || 50,
        earlyBirdDiscount: settings.early_bird_discount || 25,
        siblingDiscount: settings.sibling_discount || 10,
        multiSportDiscount: settings.multi_sport_discount || 15,

        // Branding (used by identity section indirectly)
        brandingPrimaryColor: branding.primary_color || settings.primary_color || accent.primary,
        brandingSecondaryColor: branding.secondary_color || settings.secondary_color || '',
        brandingBannerUrl: branding.banner_url || '',
        brandingTagline: branding.tagline || settings.tagline || '',
        background: branding.background || null,
      })

      // Pre-compute which steps already look done (so wizard data doesn't get re-asked)
      const done = new Set()
      if (organization?.name && (organization?.logo_url || settings.short_name)) done.add('identity')
      if (organization?.contact_email && (settings.phone || settings.city)) done.add('contact')
      if (Array.isArray(settings.enabled_sports) && settings.enabled_sports.length > 0) done.add('sports')
      if (Object.values(settings.payment_methods || {}).some(m => m?.enabled)) done.add('payments')
      if (settings.default_registration_fee != null && settings.default_registration_fee > 0
          && 'default_registration_fee' in settings) done.add('fees')
      setCompletedSteps(done)
      prefilledSteps.current = new Set(done) // snapshot — these were done before the wizard

      // Auto-skip to first incomplete step
      const firstIncomplete = SETUP_STEPS.findIndex(s => !done.has(s.key))
      if (firstIncomplete > 0) setCurrentStep(firstIncomplete)
    } catch (err) {
      console.error('Error loading setup data:', err)
    }
    setLoading(false)
  }

  // ─── Save the current section (mirrors OrganizationPage.saveSection switch) ───
  async function saveSection(sectionKey, data) {
    setSaving(true)
    try {
      const currentSettings = organization.settings || {}
      let updatePayload = {}

      switch (sectionKey) {
        case 'identity':
          updatePayload = {
            name: data.name,
            logo_url: data.logoUrl,
            settings: {
              ...currentSettings,
              short_name: data.shortName,
              tagline: data.tagline,
              primary_color: data.primaryColor,
              secondary_color: data.secondaryColor,
              org_type: data.orgType,
              founded_year: data.foundedYear,
              mission: data.mission,
            },
          }
          break
        case 'contact':
          updatePayload = {
            contact_email: data.email,
            settings: {
              ...currentSettings,
              contact_name: data.contactName,
              contact_title: data.contactTitle,
              secondary_email: data.secondaryEmail,
              phone: data.phone,
              secondary_phone: data.secondaryPhone,
              address: data.address,
              city: data.city,
              state: data.state,
              zip: data.zip,
              timezone: data.timezone,
              office_hours: data.officeHours,
            },
          }
          break
        case 'sports':
          updatePayload = {
            settings: {
              ...currentSettings,
              enabled_sports: data.enabledSports,
              program_types: data.programTypes,
              age_system: data.ageSystem,
              age_cutoff_date: data.ageCutoffDate,
              skill_levels: data.skillLevels,
              gender_options: data.genderOptions,
            },
          }
          break
        case 'payments':
          updatePayload = {
            settings: {
              ...currentSettings,
              payment_methods: data.paymentMethods,
              allow_payment_plans: data.allowPaymentPlans,
              payment_plan_installments: data.paymentPlanInstallments,
              late_fee_amount: data.lateFeeAmount,
              grace_period_days: data.gracePeriodDays,
            },
          }
          break
        case 'fees':
          updatePayload = {
            settings: {
              ...currentSettings,
              default_registration_fee: data.defaultRegistrationFee,
              default_uniform_fee: data.defaultUniformFee,
              default_monthly_fee: data.defaultMonthlyFee,
              early_bird_discount: data.earlyBirdDiscount,
              sibling_discount: data.siblingDiscount,
              multi_sport_discount: data.multiSportDiscount,
            },
          }
          break
        default:
          updatePayload = { settings: { ...currentSettings, ...data } }
      }

      await supabase.from('organizations').update(updatePayload).eq('id', organization.id)

      // Update local context so pages reading from organization see the change immediately
      setOrganization({
        ...organization,
        ...updatePayload,
        settings: { ...currentSettings, ...(updatePayload.settings || {}) },
      })
      setSetupData(prev => ({ ...prev, ...data }))

      // ── Auto-create programs for each enabled sport (only on sports step) ──
      if (sectionKey === 'sports' && Array.isArray(data.enabledSports)) {
        const SPORT_META = {
          volleyball:  { code: 'volleyball',  icon: '🏐', color: '#FFB800' },
          basketball:  { code: 'basketball',  icon: '🏀', color: '#EF6C00' },
          soccer:      { code: 'soccer',      icon: '⚽', color: '#2E7D32' },
          baseball:    { code: 'baseball',    icon: '⚾', color: '#C62828' },
          softball:    { code: 'softball',    icon: '🥎', color: '#E91E63' },
          football:    { code: 'football',    icon: '🏈', color: '#6A1B9A' },
          lacrosse:    { code: 'lacrosse',    icon: '🥍', color: '#00838F' },
        }

        try {
          const { data: existingPrograms } = await supabase
            .from('programs')
            .select('id, name, sport_id')
            .eq('organization_id', organization.id)

          const existingNames = new Set(
            (existingPrograms || []).map(p => p.name.toLowerCase())
          )

          // Query org-scoped sport records (not global)
          const { data: orgSportRecords } = await supabase
            .from('sports')
            .select('id, name, code')
            .eq('organization_id', organization.id)

          const sportMap = Object.fromEntries(
            (orgSportRecords || []).map(s => [s.code?.toLowerCase() || s.name.toLowerCase(), s])
          )

          const sportsToCreate = data.enabledSports.filter(
            sportName => !existingNames.has(sportName.toLowerCase())
          )

          for (const sportName of sportsToCreate) {
            const sportCode = sportName.toLowerCase().replace(/[^a-z0-9]/g, '')
            let sportRecord = sportMap[sportCode]

            // Create org-scoped sport record if it doesn't exist
            if (!sportRecord) {
              const meta = SPORT_META[sportCode] || {}
              const displayName = sportName.charAt(0).toUpperCase() + sportName.slice(1)
              const { data: newSport } = await supabase
                .from('sports')
                .insert({
                  organization_id: organization.id,
                  code: meta.code || sportCode,
                  name: displayName,
                  icon: meta.icon || '🎯',
                  color_primary: meta.color || '#546E7A',
                  is_active: true,
                  sort_order: sportsToCreate.indexOf(sportName),
                })
                .select('id, name, code')
                .single()
              sportRecord = newSport
            }

            const programName = sportRecord?.name
              || sportName.charAt(0).toUpperCase() + sportName.slice(1)

            await supabase.from('programs').insert({
              organization_id: organization.id,
              name: programName,
              sport_id: sportRecord?.id || null,
              is_active: true,
              display_order: (existingPrograms?.length || 0) + sportsToCreate.indexOf(sportName),
            })
          }
        } catch (err) {
          console.error('Auto-create programs failed (non-blocking):', err)
        }
      }

      return true
    } catch (err) {
      console.error('Save error:', err)
      showToast?.("Couldn't save — try again", 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  // ─── Step navigation ───
  function advance() {
    setSectionHasChanges(false)
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSetupComplete()
    }
  }

  async function handleSaveAndContinue() {
    const stepKey = SETUP_STEPS[currentStep].key
    // Trigger the section's internal save (it calls our saveSection via onSave)
    if (sectionHasChanges && saveRef.current) {
      await saveRef.current()
    }
    // Mark as complete and celebrate
    setCompletedSteps(prev => new Set([...prev, stepKey]))
    showToast?.(`${SETUP_STEPS[currentStep].title} — done! 🎉`, 'success')
    advance()
  }

  function handleSkip() {
    advance()
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setSectionHasChanges(false)
    }
  }

  async function handleSetupComplete() {
    try {
      const currentSettings = organization?.settings || {}
      await supabase.from('organizations').update({
        settings: {
          ...currentSettings,
          setup_complete: true,
          setup_completed_at: new Date().toISOString(),
        },
      }).eq('id', organization.id)

      setOrganization({
        ...organization,
        settings: {
          ...currentSettings,
          setup_complete: true,
          setup_completed_at: new Date().toISOString(),
        },
      })

      // Award the "Open for Business" milestone via journey
      if (journey?.completeStep) journey.completeStep('org_setup')

      // Admin XP — completing setup is a big deal
      if (profile?.id) {
        try {
          await awardXP({
            profileId: profile.id,
            baseAmount: XP_BY_SOURCE.org_setup_complete,
            sourceType: 'org_setup_complete',
            organizationId: organization?.id || null,
            description: 'Completed organization setup',
          })
        } catch (_) { /* non-critical */ }
      }
    } catch (err) {
      console.error('Error marking setup complete:', err)
    }
    setShowCelebration(true)
  }

  // ─── Render ───
  if (loading || !setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDark ? '#0B1628' : '#F5F6F8' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin"></div>
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loading your setup...</span>
        </div>
      </div>
    )
  }

  // ─── Celebration screen ───
  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: isDark ? '#0B1628' : '#F5F6F8' }}>
        <div className={`max-w-xl w-full text-center rounded-2xl p-10 ${isDark ? 'bg-[#132240]/80 border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`} style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <div className="text-6xl mb-4">{'\uD83C\uDF89'}</div>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--v2-text-primary)' }}>
            Your doors are open!
          </h1>
          <p className="text-lg mb-2" style={{ color: 'var(--v2-text-muted)' }}>
            {organization?.name} is set up and ready for action.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--v2-text-muted)' }}>
            Next up: create your first season, set up teams, and invite your coaches.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={async () => {
                try {
                  const { data: firstProgram } = await supabase
                    .from('programs')
                    .select('id')
                    .eq('organization_id', organization.id)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle()
                  if (firstProgram) {
                    navigate(`/programs/${firstProgram.id}`)
                  } else {
                    navigate('/dashboard')
                  }
                } catch (_) {
                  navigate('/dashboard')
                }
              }}
              className="bg-[#10284C] text-white font-bold px-8 py-3 rounded-xl hover:brightness-110 transition"
            >
              Set Up Your First Season →
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="font-semibold px-8 py-3"
              style={{ color: 'var(--v2-text-muted)' }}
            >
              Go to Dashboard
            </button>
          </div>

          <p className="text-xs mt-6" style={{ color: 'var(--v2-text-muted)' }}>
            You can always edit these settings later in Settings → Organization.
          </p>
        </div>
      </div>
    )
  }

  // ─── Main flow ───
  const step = SETUP_STEPS[currentStep]
  const progressPct = Math.round(((currentStep + 1) / SETUP_STEPS.length) * 100)
  const isLastStep = currentStep === SETUP_STEPS.length - 1

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8" style={{ background: isDark ? '#0B1628' : '#F5F6F8' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🐾</span>
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--v2-text-primary)' }}>
              Setting up {organization?.name || 'your club'}
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--v2-text-muted)' }}>
            Step {currentStep + 1} of {SETUP_STEPS.length} — {step.title}
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#E8ECF2' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #4BB9EC, #22C55E)' }}
            />
          </div>
          {/* Step pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SETUP_STEPS.map((s, i) => {
              const isDone = completedSteps.has(s.key)
              const isCurrent = i === currentStep
              const isPrefilled = isDone && prefilledSteps.current.has(s.key)
              return (
                <button
                  key={s.key}
                  onClick={() => setCurrentStep(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                  style={{
                    background: isCurrent ? '#4BB9EC15' : isDone ? '#22C55E15' : isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    border: isCurrent ? '1.5px solid #4BB9EC' : isDone ? '1.5px solid #22C55E40' : isDark ? '1.5px solid rgba(255,255,255,0.06)' : '1.5px solid #E8ECF2',
                    color: isCurrent ? '#4BB9EC' : isDone ? '#22C55E' : 'var(--v2-text-muted)',
                  }}
                  title={isPrefilled ? 'Prefilled from signup — tap to review' : undefined}
                >
                  <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{
                      background: isDone ? '#22C55E' : isCurrent ? '#4BB9EC' : isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                      color: isDone || isCurrent ? '#FFFFFF' : 'var(--v2-text-muted)',
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </span>
                  {s.title}
                  {isPrefilled && (
                    <span className="text-[10px] font-medium opacity-70 ml-0.5">Prefilled</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Card with section form */}
        <div
          data-coachmark="setup-step"
          className={`rounded-2xl p-6 sm:p-8 mb-6 ${isDark ? 'bg-[#132240]/80 border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}
          style={{ boxShadow: 'var(--v2-card-shadow, 0 4px 24px rgba(0,0,0,0.06))' }}
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{step.icon}</span>
              <h2 className="text-xl font-extrabold" style={{ color: 'var(--v2-text-primary)' }}>
                {step.subtitle}
              </h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--v2-text-muted)' }}>
              {step.fields}
            </p>
          </div>

          {/* Reused section form — same component used by /settings/organization */}
          <SetupSectionContent
            sectionKey={step.key}
            setupData={setupData}
            setSetupData={setSetupData}
            onSave={(data) => saveSection(step.key, data)}
            saving={saving}
            showToast={showToast}
            organization={organization}
            waivers={waivers}
            setWaivers={setWaivers}
            venues={venues}
            setVenues={setVenues}
            adminUsers={adminUsers}
            tc={tc}
            accent={accent}
            onChangeStatus={(changes) => setSectionHasChanges(changes)}
            saveRef={saveRef}
          />
        </div>

        {/* Navigation footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 text-sm font-semibold transition disabled:opacity-30"
            style={{ color: 'var(--v2-text-muted)' }}
          >
            ← Back
          </button>

          <button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="bg-[#10284C] text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition disabled:opacity-50 order-first sm:order-none"
          >
            {saving ? 'Saving...' : isLastStep ? 'Finish Setup 🎉' : 'Save & Continue →'}
          </button>

          <button
            onClick={handleSkip}
            className="text-sm font-semibold hover:underline transition px-4 py-2 rounded-lg hover:bg-white/5"
            style={{ color: 'var(--v2-text-secondary)' }}
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  )
}

export { FirstRunSetupPage }
