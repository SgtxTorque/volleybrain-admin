import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useJourney } from '../../contexts/JourneyContext'
import { supabase } from '../../lib/supabase'
import {
  Building2, Users, DollarSign, FileText, Settings, ChevronDown, ChevronUp,
  Check, X, Plus, Trash2, Edit, Globe, Mail, Phone, MapPin, Save,
  CreditCard, Calendar, Clock, Shield, Shirt, Bell, Heart, Palette, Image, Upload, Eye, Camera
} from '../../constants/icons'
import { SetupSectionCard } from './SetupSectionCard'

function OrganizationPage({ showToast }) {
  const navigate = useNavigate()
  const { organization, setOrganization } = useAuth()
  const tc = useThemeClasses()
  const { accent } = useTheme()
  const journey = useJourney()
  
  // Track which sections are expanded
  const [expandedSection, setExpandedSection] = useState(null)
  const [saving, setSaving] = useState(false)
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
        .from('waivers')
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
        brandingEmailHeaderColor: branding.email_header_color || '',
        brandingEmailHeaderLogo: branding.email_header_logo || '',
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
              selected_waivers: data.selectedWaivers,
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
                email_header_color: data.brandingEmailHeaderColor,
                email_header_logo: data.brandingEmailHeaderLogo,
                background: data.background || null,
              },
            }
          }
          break
        default:
          updatePayload = { settings: { ...currentSettings, ...data } }
      }

      await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
      
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
  function getSectionStatus(sectionKey) {
    if (!setupData) return { status: 'loading', progress: 0, total: 1 }
    
    const checks = {
      identity: [
        setupData.name,
        setupData.shortName,
        setupData.logoUrl,
        setupData.primaryColor,
      ],
      contact: [
        setupData.contactName,
        setupData.email,
        setupData.phone,
        setupData.city,
        setupData.state,
      ],
      sports: [
        (setupData.enabledSports || []).length > 0,
      ],
      online: [
        setupData.website || setupData.facebook || setupData.instagram,
      ],
      legal: [
        setupData.legalName || setupData.name,
        waivers.length >= 3,
      ],
      payments: [
        Object.values(setupData.paymentMethods || {}).some(m => m?.enabled),
      ],
      fees: [
        setupData.defaultRegistrationFee > 0,
      ],
      facilities: [
        venues.length > 0,
      ],
      staff: [
        adminUsers.length > 0,
      ],
      coaches: [
        true, // Settings are optional
      ],
      registration: [
        true, // Has defaults
      ],
      registrationForm: [
        (setupData.registrationFields?.player?.first_name?.visible),
        (setupData.registrationFields?.parent?.parent1_name?.visible),
      ],
      jerseys: [
        true, // Has defaults
      ],
      notifications: [
        true, // Has defaults
      ],
      volunteers: [
        true, // Optional
      ],
      branding: [
        setupData.brandingPrimaryColor,
        setupData.logoUrl,
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
      title: 'Legal & Waivers',
      icon: '⚖️',
      estTime: '10-15 min',
      description: 'Waivers, insurance, and compliance',
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
      required: true,
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

  // Calculate overall progress
  const overallProgress = sections.reduce((acc, section) => {
    const status = getSectionStatus(section.key)
    if (status.status === 'complete') return acc + 1
    if (status.status === 'partial') return acc + 0.5
    return acc
  }, 0)
  const overallPercent = Math.round((overallProgress / sections.length) * 100)

  // Group sections by category
  const foundationSections = sections.filter(s => s.category === 'foundation')
  const operationalSections = sections.filter(s => s.category === 'operational')
  const configSections = sections.filter(s => s.category === 'configuration')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}></div>
          <span className={tc.textSecondary}>Loading organization setup...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${tc.text}`}>Organization Setup</h1>
        <p className={`${tc.textMuted} mt-1`}>Configure your organization before creating seasons and opening registration</p>
      </div>

      {/* Overall Progress Card */}
      <div className={`p-6 rounded-xl border ${tc.card}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: accent.primary + '20' }}>
              🏢
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${tc.text}`}>{organization?.name || 'Your Organization'}</h2>
              <p className={tc.textMuted}>Setup Progress</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: accent.primary }}>{overallPercent}%</p>
            <p className={`text-sm ${tc.textMuted}`}>{Math.round(overallProgress)} of {sections.length} sections</p>
          </div>
        </div>
        <div className={`h-3 rounded-full ${tc.cardBgAlt}`}>
          <div 
            className="h-full rounded-full transition-all duration-500" 
            style={{ width: `${overallPercent}%`, backgroundColor: accent.primary }}
          />
        </div>
        {overallPercent < 100 && (
          <p className={`text-sm ${tc.textMuted} mt-3`}>
            💡 Complete the <span className="font-medium" style={{ color: accent.primary }}>Foundation</span> sections first to unlock registration
          </p>
        )}
      </div>

      {/* Foundation Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">🏗️</span>
          <h3 className={`font-semibold ${tc.text}`}>Foundation</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tc.cardBgAlt} ${tc.textMuted}`}>Required before registration</span>
        </div>
        {foundationSections.map(section => (
          <SetupSectionCard 
            key={section.key}
            section={section}
            status={getSectionStatus(section.key)}
            expanded={expandedSection === section.key}
            onToggle={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
            setupData={setupData}
            setSetupData={setSetupData}
            onSave={(data) => saveSection(section.key, data)}
            saving={saving}
            showToast={showToast}
            organization={organization}
            waivers={waivers}
            setWaivers={setWaivers}
            venues={venues}
            setVenues={setVenues}
            tc={tc}
            accent={accent}
          />
        ))}
      </div>

      {/* Operational Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-lg">⚡</span>
          <h3 className={`font-semibold ${tc.text}`}>Operational</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tc.cardBgAlt} ${tc.textMuted}`}>Required for day-to-day</span>
        </div>
        {operationalSections.map(section => (
          <SetupSectionCard 
            key={section.key}
            section={section}
            status={getSectionStatus(section.key)}
            expanded={expandedSection === section.key}
            onToggle={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
            setupData={setupData}
            setSetupData={setSetupData}
            onSave={(data) => saveSection(section.key, data)}
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
          />
        ))}
      </div>

      {/* Configuration Sections */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-5 h-5 text-slate-400" />
          <h3 className={`font-semibold ${tc.text}`}>Configuration</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tc.cardBgAlt} ${tc.textMuted}`}>Optional customization</span>
        </div>
        {configSections.map(section => (
          <SetupSectionCard 
            key={section.key}
            section={section}
            status={getSectionStatus(section.key)}
            expanded={expandedSection === section.key}
            onToggle={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
            setupData={setupData}
            setSetupData={setSetupData}
            onSave={(data) => saveSection(section.key, data)}
            saving={saving}
            showToast={showToast}
            organization={organization}
            tc={tc}
            accent={accent}
          />
        ))}
      </div>
    </div>
  )
}

// SetupSectionCard and SetupSectionContent extracted to separate files


export { OrganizationPage }
