import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { 
  Building2, MapPin, Palette, CreditCard, FileText,
  ChevronRight, ChevronLeft, Check, Loader2, Upload,
  AlertCircle, CheckCircle2
} from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Organization Info', icon: Building2 },
  { id: 2, title: 'Branding', icon: Palette },
  { id: 3, title: 'Default Waivers', icon: FileText },
  { id: 4, title: 'Review', icon: Check },
]

export default function OrganizationSetupWizard() {
  const { user, setOrganization } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Organization Info
    name: '',
    slug: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    
    // Step 2: Branding
    primaryColor: '#FFD700',
    logoUrl: '',
    
    // Step 3: Waivers
    waiverLiability: `I, the undersigned parent/guardian, hereby release and hold harmless [ORGANIZATION_NAME], its coaches, volunteers, and staff from any and all liability for injuries that may occur during practices, games, tournaments, or any related activities.

I understand that sports activities involve inherent risks and I accept full responsibility for any injuries sustained by my child while participating in [ORGANIZATION_NAME] programs.

I confirm that my child is physically able to participate in athletic activities and has no medical conditions that would prevent safe participation, or I have disclosed such conditions to the organization.`,

    waiverPhoto: `I grant permission to [ORGANIZATION_NAME] to use photographs, videos, and other media featuring my child for promotional purposes including but not limited to:
• Social media posts and stories
• Website content
• Marketing materials and flyers
• News coverage and press releases

I understand that my child's first name may be used alongside these images. I waive any right to compensation for such use.`,

    waiverConduct: `I agree that my child and our family will:
• Demonstrate good sportsmanship at all times
• Respect coaches, officials, opponents, and teammates
• Follow all rules and guidelines set by [ORGANIZATION_NAME]
• Communicate concerns through proper channels
• Support a positive team environment

I understand that violations of this code may result in disciplinary action including suspension or removal from the program.`,
  })

  function updateForm(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          slug: formData.slug,
          settings: {
            location: formData.location,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            primaryColor: formData.primaryColor,
            logoUrl: formData.logoUrl,
            waivers: {
              liability: formData.waiverLiability,
              photo: formData.waiverPhoto,
              conduct: formData.waiverConduct,
            }
          }
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Assign current user as league_admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'league_admin',
          is_active: true
        })

      if (roleError) throw roleError

      // Update context
      setOrganization(org)
      
    } catch (err) {
      console.error('Error creating organization:', err)
      setError(err.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Organization Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="input"
                placeholder="Black Hornets Volleyball"
                required
              />
            </div>

            <div>
              <label className="label">URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">volleybrain.app/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateForm('slug', e.target.value)}
                  className="input flex-1"
                  placeholder="black-hornets"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">This will be used in your registration links</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  className="input"
                  placeholder="Dallas, TX"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  className="input"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className="input"
                  placeholder="admin@blackhornets.com"
                />
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateForm('website', e.target.value)}
                  className="input"
                  placeholder="https://blackhornets.com"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Primary Brand Color</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => updateForm('primaryColor', e.target.value)}
                  className="w-16 h-16 rounded-xl cursor-pointer border-2 border-dark-border"
                />
                <div>
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => updateForm('primaryColor', e.target.value)}
                    className="input w-32 font-mono"
                    placeholder="#FFD700"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for buttons, accents, and highlights</p>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Logo URL (optional)</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => updateForm('logoUrl', e.target.value)}
                className="input"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a URL to your logo image, or leave blank to use default</p>
            </div>

            {/* Preview */}
            <div className="p-6 bg-dark rounded-xl border border-dark-border">
              <p className="text-sm text-gray-400 mb-4">Preview</p>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: formData.primaryColor + '20', borderColor: formData.primaryColor, borderWidth: 2 }}
                >
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    '🏐'
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{formData.name || 'Your Organization'}</h3>
                  <p className="text-gray-400">{formData.location || 'Location'}</p>
                </div>
              </div>
              <button 
                className="mt-4 px-6 py-2 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: formData.primaryColor, color: '#000' }}
              >
                Sample Button
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium">Customize Your Waivers</p>
                <p className="text-sm text-gray-400 mt-1">
                  Edit the default waiver text below. [ORGANIZATION_NAME] will be automatically replaced with your organization name.
                </p>
              </div>
            </div>

            <div>
              <label className="label">Liability Waiver *</label>
              <textarea
                value={formData.waiverLiability}
                onChange={(e) => updateForm('waiverLiability', e.target.value)}
                className="textarea h-40"
                placeholder="Enter your liability waiver text..."
              />
            </div>

            <div>
              <label className="label">Photo/Video Release</label>
              <textarea
                value={formData.waiverPhoto}
                onChange={(e) => updateForm('waiverPhoto', e.target.value)}
                className="textarea h-32"
                placeholder="Enter your photo release text..."
              />
            </div>

            <div>
              <label className="label">Code of Conduct *</label>
              <textarea
                value={formData.waiverConduct}
                onChange={(e) => updateForm('waiverConduct', e.target.value)}
                className="textarea h-32"
                placeholder="Enter your code of conduct text..."
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-medium">Ready to Create</p>
                <p className="text-sm text-gray-400 mt-1">
                  Review your settings below and click "Create Organization" to get started.
                </p>
              </div>
            </div>

            {/* Review Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-dark rounded-xl">
                <h4 className="text-sm text-gray-400 mb-2">Organization</h4>
                <p className="text-xl font-bold text-white">{formData.name}</p>
                <p className="text-gray-400">{formData.location}</p>
                {formData.email && <p className="text-gray-400 text-sm">{formData.email}</p>}
              </div>

              <div className="p-4 bg-dark rounded-xl">
                <h4 className="text-sm text-gray-400 mb-2">Brand Color</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <span className="font-mono text-white">{formData.primaryColor}</span>
                </div>
              </div>

              <div className="p-4 bg-dark rounded-xl">
                <h4 className="text-sm text-gray-400 mb-2">Waivers</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Liability Waiver</span>
                    <span className="text-xs text-gray-500">({formData.waiverLiability.length} chars)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Photo Release</span>
                    <span className="text-xs text-gray-500">({formData.waiverPhoto.length} chars)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Code of Conduct</span>
                    <span className="text-xs text-gray-500">({formData.waiverConduct.length} chars)</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 3
      case 2:
        return true
      case 3:
        return formData.waiverLiability.trim().length > 0 && formData.waiverConduct.trim().length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-darker">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gold/10 border border-gold/30 mb-4">
            <span className="text-4xl">🏐</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Set Up Your League</h1>
          <p className="text-gray-400 mt-2">Let's get your organization ready to go</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center">
                <div className="wizard-step">
                  <div className={`wizard-step-number ${isActive ? 'active' : isCompleted ? 'completed' : 'inactive'}`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-sm hidden md:block ${isActive ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-dark-border'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Content Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">
            {STEPS[currentStep - 1].title}
          </h2>

          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-border">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="btn-primary flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Organization
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
