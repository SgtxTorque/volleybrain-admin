import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Settings } from '../../constants/icons'
import { SetupSectionContent } from './SetupSectionContent'
import PageShell from '../../components/pages/PageShell'

const CATEGORY_META = {
  foundation: { label: 'Foundation', desc: 'Required before registration' },
  operational: { label: 'Operational', desc: 'Required for day-to-day' },
  configuration: { label: 'Configuration', desc: 'Optional customization' },
}

function OrganizationPage({ showToast }) {
  const { organization, setOrganization } = useAuth()
  const tc = useThemeClasses()
  const { accent, isDark } = useTheme()
  
  // Track which sections are expanded
  const [expandedSection, setExpandedSection] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sectionHasChanges, setSectionHasChanges] = useState(false)
  const saveRef = useRef(null)
  const [setupData, setSetupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [waivers, setWaivers] = useState([])
  const [venues, setVenues] = useState([])
  const [adminUsers, setAdminUsers] = useState([])

  // Load all setup data on mount
  useEffect(() => {
    if (organization?.id) loadSetupData()
  }, [organization?.id])

  async function loadSetupData() {
    setLoading(true)
    try {
      // Load waivers
      const { data: waiverData } = await supabase
        .from('waiver_templates')
        .select('*')
        .eq('organization_id', organization.id)
      setWaivers(waiverData || [])

      // Load venues
      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('organization_id', organization.id)
      setVenues(venueData || [])

      // Load admin users
      const { data: userData } = await supabase
        .from('user_roles')
        .select('*, profiles(id, full_name, email)')
        .eq('organization_id', organization.id)
        .in('role', ['league_admin', 'admin', 'assistant_admin', 'registrar', 'treasurer'])
      setAdminUsers(userData || [])

      // Build setup data from organization settings
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
        
        // Online Presence
        website: settings.website || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        registrationSlug: organization.slug || '',
        
        // Sports & Programs
        enabledSports: settings.enabled_sports || ['volleyball'],
        programTypes: settings.program_types || ['league'],
        ageSystem: settings.age_system || 'grade', // 'grade' or 'age'
        ageCutoffDate: settings.age_cutoff_date || '08-01', // MM-DD
        skillLevels: settings.skill_levels || ['recreational', 'competitive'],
        genderOptions: settings.gender_options || ['girls', 'boys', 'coed'],
        
        // Legal
        legalName: settings.legal_name || '',
        entityType: settings.entity_type || '',
        ein: settings.ein || '',
        insuranceProvider: settings.insurance_provider || '',
        insurancePolicyNumber: settings.insurance_policy_number || '',
        insuranceExpiration: settings.insurance_expiration || '',
        
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
        
        // Registration Settings
        autoApproveRegistrations: settings.auto_approve_registrations ?? false,
        requirePaymentToComplete: settings.require_payment_to_complete ?? false,
        allowWaitlist: settings.allow_waitlist ?? true,
        maxPlayersPerRegistration: settings.max_players_per_registration || 5,
        
        // Registration Form Fields
        registrationFields: settings.registration_fields || {
          player: {
            first_name: { visible: true, required: true, label: 'First Name' },
            last_name: { visible: true, required: true, label: 'Last Name' },
            dob: { visible: true, required: true, label: 'Date of Birth' },
            gender: { visible: true, required: true, label: 'Gender' },
            grade: { visible: true, required: true, label: 'Grade' },
            school: { visible: true, required: false, label: 'School' },
            jersey_size: { visible: true, required: true, label: 'Jersey Size' },
            shorts_size: { visible: true, required: false, label: 'Shorts Size' },
            jersey_pref_1: { visible: true, required: false, label: 'Jersey Preference 1' },
            jersey_pref_2: { visible: true, required: false, label: 'Jersey Preference 2' },
            jersey_pref_3: { visible: true, required: false, label: 'Jersey Preference 3' },
            position_preference: { visible: false, required: false, label: 'Position Preference' },
            years_experience: { visible: false, required: false, label: 'Years of Experience' },
            previous_team: { visible: false, required: false, label: 'Previous Team/Club' },
            photo: { visible: false, required: false, label: 'Player Photo' },
          },
          parent: {
            parent1_name: { visible: true, required: true, label: 'Parent/Guardian 1 Name' },
            parent1_email: { visible: true, required: true, label: 'Parent/Guardian 1 Email' },
            parent1_phone: { visible: true, required: true, label: 'Parent/Guardian 1 Phone' },
            parent1_relation: { visible: false, required: false, label: 'Relationship to Player' },
            parent2_name: { visible: true, required: false, label: 'Parent/Guardian 2 Name' },
            parent2_email: { visible: true, required: false, label: 'Parent/Guardian 2 Email' },
            parent2_phone: { visible: true, required: false, label: 'Parent/Guardian 2 Phone' },
            address: { visible: true, required: false, label: 'Home Address' },
            city: { visible: true, required: false, label: 'City' },
            state: { visible: true, required: false, label: 'State' },
            zip: { visible: true, required: false, label: 'ZIP Code' },
          },
          emergency: {
            name: { visible: true, required: true, label: 'Emergency Contact Name' },
            phone: { visible: true, required: true, label: 'Emergency Contact Phone' },
            relation: { visible: true, required: true, label: 'Relationship' },
            authorized_pickup: { visible: true, required: false, label: 'Authorized for Pickup' },
          },
          medical: {
            allergies: { visible: true, required: false, label: 'Allergies' },
            medical_conditions: { visible: true, required: false, label: 'Medical Conditions' },
            medications: { visible: true, required: false, label: 'Current Medications' },
            insurance_provider: { visible: false, required: false, label: 'Insurance Provider' },
            insurance_policy: { visible: false, required: false, label: 'Policy Number' },
            physician_name: { visible: false, required: false, label: 'Physician Name' },
            physician_phone: { visible: false, required: false, label: 'Physician Phone' },
          },
        },
        customQuestions: settings.custom_questions || [],
        selectedWaivers: settings.selected_waivers || [],
        
        // Jersey Settings
        jerseyVendor: settings.jersey_vendor || '',
        jerseyLeadTime: settings.jersey_lead_time || 3,
        jerseyNumberStart: settings.jersey_number_start || 1,
        jerseyNumberEnd: settings.jersey_number_end || 99,
        restrictedNumbers: settings.restricted_numbers || [],
        
        // Notification Settings
        gameReminderHours: settings.game_reminder_hours || 24,
        practiceReminderHours: settings.practice_reminder_hours || 24,
        paymentReminderDays: settings.payment_reminder_days || 7,
        
        // Coach Requirements
        requireBackgroundCheck: settings.require_background_check ?? true,
        requireSafeSport: settings.require_safesport ?? false,
        requireCPR: settings.require_cpr ?? false,
        coachMinAge: settings.coach_min_age || 18,
        
        // Volunteer Settings
        requireVolunteerHours: settings.require_volunteer_hours ?? false,
        volunteerHoursRequired: settings.volunteer_hours_required || 4,
        volunteerBuyoutAmount: settings.volunteer_buyout_amount || 100,

        // Branding Settings
        brandingPrimaryColor: branding.primary_color || settings.primary_color || accent.primary,
        brandingSecondaryColor: branding.secondary_color || settings.secondary_color || '',
        brandingBannerUrl: branding.banner_url || '',
        brandingTagline: branding.tagline || settings.tagline || '',
        background: branding.background || null,
      })
    } catch (err) {
      console.error('Error loading setup data:', err)
    }
    setLoading(false)
  }

  // Save a section's data
  async function saveSection(sectionKey, data) {
    setSaving(true)
    try {
      const currentSettings = organization.settings || {}
      let updatePayload = {}

      // Handle different section saves
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
            }
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
            }
          }
          break
        case 'online':
          updatePayload = {
            settings: {
              ...currentSettings,
              website: data.website,
              facebook: data.facebook,
              instagram: data.instagram,
              twitter: data.twitter,
            }
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
            }
          }
          break
        case 'legal':
          updatePayload = {
            settings: {
              ...currentSettings,
              legal_name: data.legalName,
              entity_type: data.entityType,
              ein: data.ein,
              insurance_provider: data.insuranceProvider,
              insurance_policy_number: data.insurancePolicyNumber,
              insurance_expiration: data.insuranceExpiration,
            }
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
            }
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
            }
          }
          break
        case 'registration':
          updatePayload = {
            settings: {
              ...currentSettings,
              auto_approve_registrations: data.autoApproveRegistrations,
              require_payment_to_complete: data.requirePaymentToComplete,
              allow_waitlist: data.allowWaitlist,
              max_players_per_registration: data.maxPlayersPerRegistration,
            }
          }
          break
        case 'registrationForm':
          updatePayload = {
            settings: {
              ...currentSettings,
              registration_fields: data.registrationFields,
              custom_questions: data.customQuestions,
            }
          }
          break
        case 'jerseys':
          updatePayload = {
            settings: {
              ...currentSettings,
              jersey_vendor: data.jerseyVendor,
              jersey_lead_time: data.jerseyLeadTime,
              jersey_number_start: data.jerseyNumberStart,
              jersey_number_end: data.jerseyNumberEnd,
              restricted_numbers: data.restrictedNumbers,
            }
          }
          break
        case 'notifications':
          updatePayload = {
            settings: {
              ...currentSettings,
              email_notifications_enabled: data.emailNotificationsEnabled ?? true,
              email_on_registration: data.emailOnRegistration ?? true,
              email_on_approval: data.emailOnApproval ?? true,
              email_on_waitlist: data.emailOnWaitlist ?? true,
              email_on_team_assignment: data.emailOnTeamAssignment ?? true,
              email_on_payment_due: data.emailOnPaymentDue ?? true,
              game_reminder_hours: data.gameReminderHours,
              practice_reminder_hours: data.practiceReminderHours,
              payment_reminder_days: data.paymentReminderDays,
            }
          }
          break
        case 'coaches':
          updatePayload = {
            settings: {
              ...currentSettings,
              require_background_check: data.requireBackgroundCheck,
              require_safesport: data.requireSafeSport,
              require_cpr: data.requireCPR,
              coach_min_age: data.coachMinAge,
            }
          }
          break
        case 'volunteers':
          updatePayload = {
            settings: {
              ...currentSettings,
              require_volunteer_hours: data.requireVolunteerHours,
              volunteer_hours_required: data.volunteerHoursRequired,
              volunteer_buyout_amount: data.volunteerBuyoutAmount,
            }
          }
          break
        case 'branding':
          updatePayload = {
            logo_url: data.logoUrl,
            settings: {
              ...currentSettings,
              branding: {
                ...(currentSettings.branding || {}),
                primary_color: data.brandingPrimaryColor,
                secondary_color: data.brandingSecondaryColor,
                banner_url: data.brandingBannerUrl,
                tagline: data.brandingTagline,
                background: data.background || null,
              },
            }
          }
          break
        default:
          updatePayload = { settings: { ...currentSettings, ...data } }
      }

      const { error } = await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
      if (error) {
        console.error('Failed to save organization settings:', error)
        showToast('Failed to save. Please try again.', 'error')
        setSaving(false)
        return
      }

      // Update local state
      setOrganization({ ...organization, ...updatePayload, settings: { ...currentSettings, ...updatePayload.settings } })
      setSetupData(prev => ({ ...prev, ...data }))

      showToast('Saved!', 'success')
    } catch (err) {
      console.error('Save error:', err)
      showToast('Error saving', 'error')
    }
    setSaving(false)
  }

  // Calculate section completion status
  // IMPORTANT: Checks read from raw DB values (organization.settings), NOT from
  // setupData which has client-side defaults baked in. A brand-new org should
  // show 0%, not 69%.
  function getSectionStatus(sectionKey) {
    if (!setupData) return { status: 'loading', progress: 0, total: 1 }

    const rawSettings = organization?.settings || {}
    const rawBranding = rawSettings?.branding || {}

    const checks = {
      identity: [
        organization?.name,
        rawSettings.short_name,
        rawSettings.primary_color,
        // logo_url removed — optional for identity completion (checked in branding section instead)
      ],
      contact: [
        rawSettings.contact_name,
        organization?.contact_email,
        rawSettings.phone,
        rawSettings.city,
        rawSettings.state,
      ],
      sports: [
        // Only count if the user explicitly saved sports (not the default ['volleyball'])
        Array.isArray(rawSettings.enabled_sports) && rawSettings.enabled_sports.length > 0,
      ],
      online: [
        rawSettings.website || rawSettings.facebook || rawSettings.instagram,
      ],
      legal: [
        // Only count if legal name was explicitly set (not defaulted to org name)
        Boolean(rawSettings.legal_name),
      ],
      payments: [
        Object.values(rawSettings.payment_methods || {}).some(m => m?.enabled),
      ],
      fees: [
        // Only count if fee was explicitly saved (not defaulted to 150)
        Boolean(rawSettings.default_registration_fee > 0),
      ],
      facilities: [
        venues.length > 0,
      ],
      staff: [
        // Staff is optional — complete only if an additional admin exists beyond the creator
        adminUsers.length > 1,
      ],
      coaches: [
        // Optional — complete only when coach requirement settings were explicitly saved
        'require_background_check' in rawSettings,
      ],
      registration: [
        // Optional — complete only when registration settings were explicitly saved
        'auto_approve_registrations' in rawSettings,
      ],
      registrationForm: [
        // Only count if form fields were explicitly saved or a template is assigned
        Boolean(rawSettings.registration_fields) ||
        Boolean(organization?.registration_template_id),
      ],
      jerseys: [
        // Optional — complete only when jersey config was explicitly saved
        Boolean(rawSettings.jersey_vendor) || 'jersey_number_start' in rawSettings,
      ],
      notifications: [
        // Optional — complete only when notification settings were explicitly saved
        'email_notifications_enabled' in rawSettings || 'game_reminder_hours' in rawSettings,
      ],
      volunteers: [
        // Optional — complete only when volunteer settings were explicitly saved
        'require_volunteer_hours' in rawSettings,
      ],
      branding: [
        rawBranding.primary_color,
        organization?.logo_url,
      ],
    }

    const sectionChecks = checks[sectionKey] || []
    const completed = sectionChecks.filter(Boolean).length
    const total = sectionChecks.length

    if (completed === 0) return { status: 'not_started', progress: 0, total }
    if (completed < total) return { status: 'partial', progress: completed, total }
    return { status: 'complete', progress: completed, total }
  }

  // Section definitions with metadata
  const sections = [
    {
      key: 'identity',
      title: 'Identity & Branding',
      icon: '🎨',
      estTime: '3-5 min',
      description: 'Organization name, logo, and brand colors',
      required: true,
      category: 'foundation',
    },
    {
      key: 'contact',
      title: 'Contact Information',
      icon: '📞',
      estTime: '2-3 min',
      description: 'Email, phone, and address details',
      required: true,
      category: 'foundation',
    },
    {
      key: 'sports',
      title: 'Sports & Programs',
      icon: 'volleyball',
      estTime: '2-3 min',
      description: 'Configure which sports and program types you offer',
      required: true,
      category: 'foundation',
    },
    {
      key: 'online',
      title: 'Online Presence',
      icon: '🌐',
      estTime: '1-2 min',
      description: 'Website and social media links',
      required: false,
      category: 'foundation',
    },
    {
      key: 'legal',
      title: 'Legal & Compliance',
      icon: '⚖️',
      estTime: '5-10 min',
      description: 'Entity info, insurance, and compliance',
      required: true,
      category: 'foundation',
    },
    {
      key: 'payments',
      title: 'Payment Methods',
      icon: 'credit-card',
      estTime: '3-5 min',
      description: 'Configure how you accept payments',
      required: true,
      category: 'operational',
    },
    {
      key: 'fees',
      title: 'Fee Structure',
      icon: 'dollar',
      estTime: '3-5 min',
      description: 'Default fees and discounts',
      required: true,
      category: 'operational',
    },
    {
      key: 'facilities',
      title: 'Facilities & Venues',
      icon: '📍',
      estTime: '5-10 min',
      description: 'Where you practice and play',
      required: true,
      category: 'operational',
    },
    {
      key: 'staff',
      title: 'Staff & Permissions',
      icon: 'users',
      estTime: '5-10 min',
      description: 'Admin users and their roles',
      required: false,
      category: 'operational',
    },
    {
      key: 'coaches',
      title: 'Coach Requirements',
      icon: 'user-cog',
      estTime: '2-3 min',
      description: 'Background checks and certifications',
      required: false,
      category: 'operational',
    },
    {
      key: 'registration',
      title: 'Registration Settings',
      icon: 'settings',
      estTime: '2-3 min',
      description: 'Auto-approve, waitlist, and payment settings',
      required: false,
      category: 'configuration',
    },
    {
      key: 'registrationForm',
      title: 'Registration Form Builder',
      icon: 'clipboard',
      estTime: '10-15 min',
      description: 'Customize what info you collect from families',
      required: false,
      category: 'configuration',
    },
    {
      key: 'jerseys',
      title: 'Jersey Configuration',
      icon: 'shirt',
      estTime: '2-3 min',
      description: 'Uniform and number settings',
      required: false,
      category: 'configuration',
    },
    {
      key: 'notifications',
      title: 'Notification Settings',
      icon: '🔔',
      estTime: '2-3 min',
      description: 'Reminder timing defaults',
      required: false,
      category: 'configuration',
    },
    {
      key: 'volunteers',
      title: 'Volunteer Requirements',
      icon: '🤝',
      estTime: '2-3 min',
      description: 'Volunteer hours and buyout',
      required: false,
      category: 'configuration',
    },
    {
      key: 'branding',
      title: 'Branding & White-Label',
      icon: '🎨',
      estTime: '5-10 min',
      description: 'Custom colors, logo, banner for parent-facing pages',
      required: false,
      category: 'configuration',
    },
  ]

  // Calculate overall progress — only REQUIRED sections count toward the percentage.
  // Optional sections still display in the list, but they don't inflate the number.
  const requiredSections = sections.filter(s => s.required)
  const overallProgress = requiredSections.reduce((acc, section) => {
    const status = getSectionStatus(section.key)
    if (status.status === 'complete') return acc + 1
    if (status.status === 'partial') return acc + 0.5
    return acc
  }, 0)
  const overallPercent = requiredSections.length > 0
    ? Math.round((overallProgress / requiredSections.length) * 100)
    : 0

  // Group sections by category
  const foundationSections = sections.filter(s => s.category === 'foundation')
  const operationalSections = sections.filter(s => s.category === 'operational')
  const configSections = sections.filter(s => s.category === 'configuration')

  // Ref for right panel scroll-to-top on section change
  const rightPanelRef = useRef(null)

  // Keyboard navigation ref
  const navRef = useRef(null)

  // Auto-select first incomplete section on mount / return from waivers
  useEffect(() => {
    const returnSection = localStorage.getItem('returnToOrgSetup')
    if (returnSection) {
      setExpandedSection(returnSection)
      localStorage.removeItem('returnToOrgSetup')
      return
    }
    if (!expandedSection && setupData) {
      const firstIncomplete = sections.find(s => getSectionStatus(s.key).status !== 'complete')
      setExpandedSection(firstIncomplete ? firstIncomplete.key : sections[0]?.key)
    }
  }, [setupData])

  // Scroll right panel to top when section changes
  useEffect(() => {
    if (rightPanelRef.current) rightPanelRef.current.scrollTop = 0
  }, [expandedSection])

  // Keyboard navigation for left nav panel
  const handleNavKeyDown = useCallback((e) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) return
    e.preventDefault()
    const allKeys = sections.map(s => s.key)
    const currentIdx = allKeys.indexOf(expandedSection)
    if (e.key === 'ArrowDown') {
      const next = currentIdx < allKeys.length - 1 ? currentIdx + 1 : 0
      setExpandedSection(allKeys[next])
      // Focus the next button
      navRef.current?.querySelectorAll('[data-nav-section]')?.[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      const prev = currentIdx > 0 ? currentIdx - 1 : allKeys.length - 1
      setExpandedSection(allKeys[prev])
      navRef.current?.querySelectorAll('[data-nav-section]')?.[prev]?.focus()
    }
    // Enter and Space already handled by <button> default behavior (onClick)
  }, [expandedSection, sections])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin"></div>
          <span className={tc.textSecondary}>Loading organization setup...</span>
        </div>
      </div>
    )
  }

  // Check whether a section's data has ever been explicitly written to the DB.
  // Used to decide whether to show "✓ Saved" or "Save" on the button.
  function sectionSavedToDB(sectionKey) {
    const raw = organization?.settings || {}
    switch (sectionKey) {
      case 'identity': return Boolean(raw.short_name || raw.primary_color)
      case 'contact': return Boolean(raw.contact_name || raw.phone)
      case 'sports': return Array.isArray(raw.enabled_sports) && raw.enabled_sports.length > 0
      case 'online': return Boolean(raw.website || raw.facebook || raw.instagram)
      case 'legal': return Boolean(raw.legal_name)
      case 'payments': return Boolean(raw.payment_methods && Object.keys(raw.payment_methods).length > 0)
      case 'fees': return 'default_registration_fee' in raw
      case 'facilities': return venues.length > 0
      case 'registration': return 'auto_approve_registrations' in raw
      case 'registrationForm': return Boolean(raw.registration_fields) || Boolean(organization?.registration_template_id)
      case 'coaches': return 'require_background_check' in raw
      case 'jerseys': return Boolean(raw.jersey_vendor) || 'jersey_number_start' in raw
      case 'notifications': return 'email_notifications_enabled' in raw || 'game_reminder_hours' in raw
      case 'volunteers': return 'require_volunteer_hours' in raw
      case 'branding': return Boolean(raw.branding?.primary_color)
      case 'staff': return false // staff is checked by adminUsers count, not settings
      default: return false
    }
  }

  // Complete Setup handler — sets setup_complete flag
  async function handleCompleteSetup() {
    const currentSettings = organization?.settings || {}
    const { error } = await supabase
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          setup_complete: true,
          setup_completed_at: new Date().toISOString(),
        }
      })
      .eq('id', organization.id)

    if (!error) {
      setOrganization({
        ...organization,
        settings: {
          ...currentSettings,
          setup_complete: true,
          setup_completed_at: new Date().toISOString(),
        }
      })
      showToast?.('Setup complete! All features are now unlocked.', 'success')
    }
  }

  // Count statuses — drive the copy under the progress bar from required sections only
  const completedCount = requiredSections.filter(s => getSectionStatus(s.key).status === 'complete').length
  const inProgressCount = requiredSections.filter(s => getSectionStatus(s.key).status === 'partial').length
  const notStartedCount = requiredSections.filter(s => getSectionStatus(s.key).status === 'not_started').length

  // Active section metadata
  const activeSection = sections.find(s => s.key === expandedSection)
  const activeSectionStatus = expandedSection ? getSectionStatus(expandedSection) : null

  // Category groupings for the left nav
  const categories = [
    { name: 'Foundation', sections: foundationSections },
    { name: 'Operational', sections: operationalSections },
    { name: 'Configuration', sections: configSections },
  ]

  // Left nav section button renderer
  function renderNavSection(section) {
    const status = getSectionStatus(section.key)
    const isActive = expandedSection === section.key
    return (
      <button
        key={section.key}
        data-nav-section={section.key}
        onClick={() => setExpandedSection(section.key)}
        onKeyDown={handleNavKeyDown}
        className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-all rounded-lg ${
          isActive
            ? isDark ? 'bg-[#4BB9EC]/[0.12] border-l-[3px] border-l-[#4BB9EC]' : 'bg-[#4BB9EC]/[0.08] border-l-[3px] border-l-[#10284C]'
            : isDark ? 'hover:bg-white/[0.04] border-l-[3px] border-l-transparent' : 'hover:bg-[#F5F6F8] border-l-[3px] border-l-transparent'
        }`}
      >
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
          status.status === 'complete' ? 'bg-[#22C55E] text-white' :
          status.status === 'partial' ? 'bg-amber-500 text-white' :
          isDark ? 'bg-white/10 text-slate-500' : 'bg-slate-200 text-slate-400'
        }`}>
          {status.status === 'complete' ? '\u2713' : status.status === 'partial' ? '!' : ''}
        </span>
        <span className={`text-xs font-bold truncate flex-1 ${
          isActive ? (isDark ? 'text-white' : 'text-[#10284C]') : (isDark ? 'text-slate-400' : 'text-slate-600')
        }`}>
          {section.title}
        </span>
        {section.required && (
          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0">
            Req
          </span>
        )}
      </button>
    )
  }

  return (
    <PageShell title="Organization Setup" subtitle="Configure your organization before creating seasons and opening registration" breadcrumb="Setup > Organization">
     <div>
      {/* Navy Progress Header */}
      <div className="bg-[#10284C] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--v2-font)' }}>
              Organization Setup
            </h2>
            <p className="text-sm text-white/50">Configure your organization before creating seasons</p>
          </div>
          <div className="text-right">
            <span className={`text-4xl font-black italic ${overallPercent === 100 ? 'text-[#22C55E]' : 'text-[#4BB9EC]'}`}>
              {overallPercent}%
            </span>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Complete</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4BB9EC] to-[#22C55E] transition-all duration-500"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
        <div className="mt-3">
          {overallPercent === 0 ? (
            <p className="text-sm text-white/70">
              Fresh start! Let's get your club dialed in. {'\ud83d\udc3e'}
            </p>
          ) : overallPercent < 50 ? (
            <p className="text-sm text-white/70">
              Nice progress — {completedCount} of {requiredSections.length} essentials done.
            </p>
          ) : overallPercent < 100 ? (
            <p className="text-sm text-white/70">
              Almost there — {requiredSections.length - completedCount} {requiredSections.length - completedCount === 1 ? 'essential' : 'essentials'} left.
            </p>
          ) : (
            <p className="text-sm text-white/70">
              All set! Your club is ready to rock. {'\ud83c\udf89'}
            </p>
          )}
          {organization?.settings?.setup_complete && (
            <div className="flex items-center gap-2 text-[#22C55E] text-sm font-medium mt-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Setup complete — all features unlocked
            </div>
          )}
        </div>
        {overallPercent === 100 && !organization?.settings?.setup_complete && (
          <div className="mt-4 p-4 bg-white/10 rounded-[14px] text-center">
            <p className="text-sm font-medium text-white/80 mb-3">
              All essentials are complete! Finish setup to unlock all features.
            </p>
            <button
              onClick={handleCompleteSetup}
              className="px-6 py-3 bg-[#22C55E] text-white font-bold rounded-[14px] hover:bg-[#16A34A] transition-colors"
            >
              Complete Organization Setup
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Layout — desktop */}
      <div className="hidden md:flex gap-0" style={{ minHeight: 'calc(100vh - 300px)' }}>
        {/* LEFT NAV PANEL */}
        <div ref={navRef} role="listbox" aria-label="Setup sections" className={`w-[260px] shrink-0 rounded-l-[14px] overflow-y-auto py-3 ${
          isDark ? 'bg-white/[0.02] border-r border-white/[0.06]' : 'bg-white border-r border-[#E8ECF2]'
        }`} style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {categories.map(cat => (
            <div key={cat.name}>
              <div className={`text-[9px] font-black uppercase tracking-[0.15em] px-4 pt-4 pb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {cat.name}
              </div>
              {cat.sections.map(section => renderNavSection(section))}
            </div>
          ))}
        </div>

        {/* RIGHT FORM PANEL */}
        <div
          ref={rightPanelRef}
          className={`flex-1 min-w-0 overflow-y-auto rounded-r-[14px] px-8 py-6 ${
            isDark ? 'bg-white/[0.01]' : 'bg-[#FAFBFC]'
          }`}
          style={{ maxHeight: 'calc(100vh - 300px)' }}
        >
          {activeSection ? (
            <>
              {/* Section header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{activeSection.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>
                        {activeSection.title}
                      </h2>
                      {activeSection.required && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/15 text-red-500">Required</span>
                      )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{activeSection.description}</p>
                  </div>
                  {/* Save Button — always visible */}
                  <button
                    onClick={() => sectionHasChanges && saveRef.current?.()}
                    disabled={!sectionHasChanges || saving}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition shrink-0 ${
                      saving
                        ? 'bg-[#4BB9EC] text-white cursor-wait'
                        : sectionHasChanges
                          ? 'bg-[#10284C] text-white hover:brightness-110 cursor-pointer'
                          : isDark ? 'bg-white/[0.06] text-slate-500 cursor-default' : 'bg-[#F0F1F3] text-slate-400 cursor-default'
                    }`}
                  >
                    {saving ? 'Saving...' : sectionHasChanges ? 'Save Changes' : sectionSavedToDB(expandedSection) ? '\u2713 Saved' : 'Save'}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Est. time: {activeSection.estTime}</span>
                  <span className={`font-bold ${
                    activeSectionStatus?.status === 'complete' ? 'text-[#22C55E]' :
                    activeSectionStatus?.status === 'partial' ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {activeSectionStatus?.status === 'complete' ? '\u2705 Complete' : activeSectionStatus?.status === 'partial' ? '\u26A0\uFE0F In Progress' : '\u25CB Not Started'}
                  </span>
                </div>
              </div>

              {/* Section form content */}
              <SetupSectionContent
                sectionKey={expandedSection}
                setupData={setupData}
                setSetupData={setSetupData}
                onSave={(data) => saveSection(expandedSection, data)}
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
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">{'\uD83C\uDFE2'}</div>
              <h2 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Select a Section to Configure</h2>
              <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Start with the Foundation sections — they're required before you can create seasons</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout — single column with horizontal nav strip */}
      <div className="md:hidden">
        {/* Horizontal scrollable section strip */}
        <div className={`flex gap-2 overflow-x-auto pb-3 mb-4 -mx-2 px-2 ${isDark ? '' : ''}`} style={{ scrollbarWidth: 'none' }}>
          {sections.map(section => {
            const status = getSectionStatus(section.key)
            const isActive = expandedSection === section.key
            return (
              <button
                key={section.key}
                onClick={() => setExpandedSection(section.key)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? isDark ? 'bg-[#4BB9EC]/20 text-white' : 'bg-[#10284C] text-white'
                    : isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-white text-slate-600 border border-[#E8ECF2]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                  status.status === 'complete' ? 'bg-[#22C55E] text-white' :
                  status.status === 'partial' ? 'bg-amber-500 text-white' :
                  'bg-slate-300 text-slate-500'
                }`}>
                  {status.status === 'complete' ? '\u2713' : ''}
                </span>
                {section.title}
              </button>
            )
          })}
        </div>

        {/* Mobile form content */}
        {activeSection && (
          <div className={`rounded-[14px] p-5 ${isDark ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{activeSection.icon}</span>
                <h2 className={`text-lg font-extrabold flex-1 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{activeSection.title}</h2>
                {activeSection.required && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-500">Req</span>
                )}
                {/* Mobile Save Button */}
                <button
                  onClick={() => sectionHasChanges && saveRef.current?.()}
                  disabled={!sectionHasChanges || saving}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                    saving
                      ? 'bg-[#4BB9EC] text-white cursor-wait'
                      : sectionHasChanges
                        ? 'bg-[#10284C] text-white hover:brightness-110'
                        : isDark ? 'bg-white/[0.06] text-slate-500' : 'bg-[#F0F1F3] text-slate-400'
                  }`}
                >
                  {saving ? 'Saving...' : sectionHasChanges ? 'Save' : sectionSavedToDB(expandedSection) ? '\u2713 Saved' : 'Save'}
                </button>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{activeSection.description}</p>
            </div>
            <SetupSectionContent
              sectionKey={expandedSection}
              setupData={setupData}
              setSetupData={setSetupData}
              onSave={(data) => saveSection(expandedSection, data)}
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
        )}
      </div>
     </div>
    </PageShell>
  )
}

// SetupSectionCard and SetupSectionContent extracted to separate files


export { OrganizationPage }
