import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Users, X, Upload, Mail, Palette, Image, Eye
} from '../../constants/icons'

// ============================================
// SETUP SECTION CONTENT - Renders each section's form
// ============================================

function SetupSectionContent({
  sectionKey,
  setupData,
  setSetupData,
  onSave,
  saving,
  showToast,
  organization,
  waivers,
  setWaivers,
  venues,
  setVenues,
  adminUsers,
  tc,
  accent
}) {
  const navigate = useNavigate()
  // Local form state for this section
  const [localData, setLocalData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize local data when section opens
  useEffect(() => {
    if (setupData) {
      setLocalData({ ...setupData })
      setHasChanges(false)
    }
  }, [sectionKey, setupData])

  const updateField = (key, value) => {
    setLocalData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(localData)
    setHasChanges(false)
  }

  // Input component helper
  const Input = ({ label, field, type = 'text', placeholder = '', required = false, helpText = '' }) => (
    <div>
      <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={localData[field] || ''}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border ${tc.input} focus:ring-2 focus:ring-offset-0 transition`}
        style={{ focusRing: accent.primary }}
      />
      {helpText && <p className={`text-xs ${tc.textMuted} mt-1`}>{helpText}</p>}
    </div>
  )

  const Toggle = ({ label, field, helpText = '' }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className={`font-medium ${tc.text}`}>{label}</p>
        {helpText && <p className={`text-sm ${tc.textMuted}`}>{helpText}</p>}
      </div>
      <button
        onClick={() => updateField(field, !localData[field])}
        className={`w-12 h-6 rounded-full transition-colors ${localData[field] ? '' : 'bg-slate-600'}`}
        style={{ backgroundColor: localData[field] ? accent.primary : undefined }}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${localData[field] ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )

  const Select = ({ label, field, options, required = false }) => (
    <div>
      <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={localData[field] || ''}
        onChange={(e) => updateField(field, e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border ${tc.input}`}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  const NumberInput = ({ label, field, min = 0, max = 9999, prefix = '', suffix = '' }) => (
    <div>
      <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>{label}</label>
      <div className="relative">
        {prefix && <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${tc.textMuted}`}>{prefix}</span>}
        <input
          type="number"
          value={localData[field] || ''}
          onChange={(e) => updateField(field, parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          className={`w-full px-4 py-2.5 rounded-xl border ${tc.input} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${tc.textMuted}`}>{suffix}</span>}
      </div>
    </div>
  )

  // Render content based on section
  const renderContent = () => {
    switch (sectionKey) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Organization Name" field="name" placeholder="Black Hornets Volleyball Club" required />
              <Input label="Short Name / Abbreviation" field="shortName" placeholder="BHVC" helpText="Used on jerseys and reports" />
            </div>
            <Input label="Tagline / Slogan" field="tagline" placeholder="Building Champions On & Off the Court" />
            <Input label="Logo URL" field="logoUrl" placeholder="https://..." helpText="Paste a link to your logo image" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>Primary Brand Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localData.primaryColor || '#F97316'}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={localData.primaryColor || ''}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    placeholder="#F97316"
                    className={`flex-1 px-4 py-2 rounded-xl border ${tc.input}`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localData.secondaryColor || '#1E293B'}
                    onChange={(e) => updateField('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={localData.secondaryColor || ''}
                    onChange={(e) => updateField('secondaryColor', e.target.value)}
                    placeholder="#1E293B"
                    className={`flex-1 px-4 py-2 rounded-xl border ${tc.input}`}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Organization Type"
                field="orgType"
                options={[
                  { value: 'club', label: 'Club / League' },
                  { value: 'recreation', label: 'Recreation Department' },
                  { value: 'school', label: 'School / District' },
                  { value: 'travel', label: 'Travel / Competitive' },
                  { value: 'camp', label: 'Camp / Clinic' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Input label="Founded Year" field="foundedYear" type="number" placeholder="2015" />
            </div>
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>Mission Statement</label>
              <textarea
                value={localData.mission || ''}
                onChange={(e) => updateField('mission', e.target.value)}
                placeholder="Our mission is to provide youth athletes with..."
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border ${tc.input} resize-none`}
              />
            </div>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Primary Contact Name" field="contactName" placeholder="John Smith" required />
              <Input label="Title" field="contactTitle" placeholder="League Director" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Primary Email" field="email" type="email" placeholder="info@blackhornets.com" required />
              <Input label="Secondary Email" field="secondaryEmail" type="email" placeholder="backup@blackhornets.com" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Primary Phone" field="phone" type="tel" placeholder="(555) 123-4567" required />
              <Input label="Secondary Phone" field="secondaryPhone" type="tel" placeholder="(555) 987-6543" />
            </div>
            <Input label="Street Address" field="address" placeholder="123 Main Street" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Input label="City" field="city" placeholder="Dallas" required />
              </div>
              <Select
                label="State"
                field="state"
                required
                options={[
                  { value: 'TX', label: 'Texas' },
                  { value: 'CA', label: 'California' },
                  { value: 'FL', label: 'Florida' },
                  { value: 'NY', label: 'New York' },
                  // Add more states as needed
                ]}
              />
              <Input label="ZIP" field="zip" placeholder="75001" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Time Zone"
                field="timezone"
                options={[
                  { value: 'America/New_York', label: 'Eastern Time' },
                  { value: 'America/Chicago', label: 'Central Time' },
                  { value: 'America/Denver', label: 'Mountain Time' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time' },
                ]}
              />
              <Input label="Office Hours" field="officeHours" placeholder="Mon-Fri 9am-5pm" />
            </div>
          </div>
        )

      case 'online':
        return (
          <div className="space-y-6">
            <Input label="Website URL" field="website" placeholder="https://www.blackhornets.com" />
            <Input label="Facebook Page" field="facebook" placeholder="https://facebook.com/blackhornetsVB" />
            <Input label="Instagram Handle" field="instagram" placeholder="@blackhornetsVB" helpText="Just the handle, no URL needed" />
            <Input label="Twitter / X Handle" field="twitter" placeholder="@blackhornetsVB" />
            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm font-medium ${tc.text} mb-1`}>📎 Your Registration Link</p>
              <p className={`text-sm ${tc.textMuted} mb-2`}>Share this link for parents to register:</p>
              <div className="flex gap-2">
                <code className={`flex-1 px-3 py-2 rounded-lg text-sm ${tc.input}`}>
                  volleybrain.com/register/{organization?.slug || 'your-org'}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://volleybrain.com/register/${organization?.slug}`)
                    showToast('Link copied!', 'success')
                  }}
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: accent.primary }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )

      case 'sports':
        const allSports = [
          { id: 'volleyball', name: 'Volleyball', icon: 'volleyball' },
          { id: 'basketball', name: 'Basketball', icon: '🏀' },
          { id: 'soccer', name: 'Soccer', icon: '⚽' },
          { id: 'baseball', name: 'Baseball', icon: '⚾' },
          { id: 'softball', name: 'Softball', icon: '🥎' },
          { id: 'football', name: 'Flag Football', icon: '🏈' },
          { id: 'swimming', name: 'Swimming', icon: '🏊' },
          { id: 'track', name: 'Track & Field', icon: '🏃' },
          { id: 'tennis', name: 'Tennis', icon: '🎾' },
          { id: 'golf', name: 'Golf', icon: '⛳' },
          { id: 'cheer', name: 'Cheerleading', icon: '📣' },
          { id: 'gymnastics', name: 'Gymnastics', icon: '🤸' },
        ]
        const allPrograms = [
          { id: 'league', name: 'Leagues / Seasons', icon: 'trophy', desc: 'Multi-week competitive or recreational programs' },
          { id: 'camp', name: 'Camps', icon: '🏕️', desc: 'Short-term intensive programs (usually 1 week)' },
          { id: 'clinic', name: 'Clinics', icon: 'clipboard', desc: 'Skills-focused training sessions' },
          { id: 'tournament', name: 'Tournaments', icon: '🥇', desc: 'Competition events' },
          { id: 'tryout', name: 'Tryouts', icon: 'target', desc: 'Player evaluation sessions' },
          { id: 'training', name: 'Private Training', icon: '🏋️', desc: 'Individual or small group sessions' },
        ]
        const allSkillLevels = [
          { id: 'recreational', name: 'Recreational', desc: 'Fun and learning focused' },
          { id: 'intermediate', name: 'Intermediate', desc: 'Some experience required' },
          { id: 'competitive', name: 'Competitive', desc: 'Experienced players, tryouts' },
          { id: 'elite', name: 'Elite / Travel', desc: 'Tournament-level teams' },
        ]
        const allGenders = [
          { id: 'girls', name: 'Girls' },
          { id: 'boys', name: 'Boys' },
          { id: 'coed', name: 'Coed' },
        ]

        const toggleArrayItem = (field, item) => {
          const current = localData[field] || []
          const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item]
          updateField(field, updated)
        }

        return (
          <div className="space-y-6">
            {/* Sports Selection */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-3`}>
                Which sports does your organization offer? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allSports.map(sport => {
                  const isEnabled = (localData.enabledSports || []).includes(sport.id)
                  return (
                    <button
                      key={sport.id}
                      onClick={() => toggleArrayItem('enabledSports', sport.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : `${tc.border} ${tc.hoverBg}`
                      }`}
                    >
                      <span className="text-2xl">{sport.icon}</span>
                      <p className={`text-sm font-medium mt-1 ${isEnabled ? tc.text : tc.textMuted}`}>{sport.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Program Types */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-3`}>
                What types of programs do you offer?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPrograms.map(program => {
                  const isEnabled = (localData.programTypes || []).includes(program.id)
                  return (
                    <button
                      key={program.id}
                      onClick={() => toggleArrayItem('programTypes', program.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : `${tc.border} ${tc.hoverBg}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{program.icon}</span>
                        <div>
                          <p className={`font-medium ${isEnabled ? tc.text : tc.textMuted}`}>{program.name}</p>
                          <p className={`text-xs ${tc.textMuted}`}>{program.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Age System */}
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-3`}>
                How do you organize age divisions?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateField('ageSystem', 'grade')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    localData.ageSystem === 'grade'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                      : `${tc.border}`
                  }`}
                >
                  <p className={`font-medium ${tc.text}`}>📚 Grade-Based</p>
                  <p className={`text-sm ${tc.textMuted} mt-1`}>3rd-4th, 5th-6th, etc.</p>
                </button>
                <button
                  onClick={() => updateField('ageSystem', 'age')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    localData.ageSystem === 'age'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                      : `${tc.border}`
                  }`}
                >
                  <p className={`font-medium ${tc.text}`}>🎂 Age-Based</p>
                  <p className={`text-sm ${tc.textMuted} mt-1`}>10U, 12U, 14U, etc.</p>
                </button>
              </div>
              {localData.ageSystem === 'age' && (
                <div className="mt-4">
                  <label className={`block text-sm ${tc.textMuted} mb-2`}>Age cutoff date (MM-DD)</label>
                  <input
                    type="text"
                    value={localData.ageCutoffDate || '08-01'}
                    onChange={(e) => updateField('ageCutoffDate', e.target.value)}
                    placeholder="08-01"
                    className={`w-32 px-3 py-2 rounded-lg border ${tc.input}`}
                  />
                  <p className={`text-xs ${tc.textMuted} mt-1`}>Player's age on this date determines their division</p>
                </div>
              )}
            </div>

            {/* Skill Levels */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-3`}>
                What skill levels do you offer?
              </label>
              <div className="flex flex-wrap gap-2">
                {allSkillLevels.map(level => {
                  const isEnabled = (localData.skillLevels || []).includes(level.id)
                  return (
                    <button
                      key={level.id}
                      onClick={() => toggleArrayItem('skillLevels', level.id)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                          : `${tc.border} ${tc.textMuted}`
                      }`}
                    >
                      {level.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Gender Options */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-3`}>
                What gender divisions do you offer?
              </label>
              <div className="flex gap-3">
                {allGenders.map(gender => {
                  const isEnabled = (localData.genderOptions || []).includes(gender.id)
                  return (
                    <button
                      key={gender.id}
                      onClick={() => toggleArrayItem('genderOptions', gender.id)}
                      className={`px-6 py-3 rounded-xl border-2 transition-all ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium'
                          : `${tc.border} ${tc.textMuted}`
                      }`}
                    >
                      {gender.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'legal':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Legal Entity Name" field="legalName" placeholder="Black Hornets Volleyball LLC" helpText="If different from org name" />
              <Select
                label="Entity Type"
                field="entityType"
                options={[
                  { value: 'llc', label: 'LLC' },
                  { value: '501c3', label: '501(c)(3) Nonprofit' },
                  { value: '501c4', label: '501(c)(4) Nonprofit' },
                  { value: 'sole_prop', label: 'Sole Proprietorship' },
                  { value: 'corp', label: 'Corporation' },
                  { value: 'other', label: 'Other / Unincorporated' },
                ]}
              />
            </div>
            <Input label="EIN / Tax ID" field="ein" placeholder="XX-XXXXXXX" helpText="For tax purposes and payment processing" />

            <div className={`p-4 rounded-xl border ${tc.border} ${tc.cardBgAlt}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className={`font-medium ${tc.text}`}>📋 Waivers</p>
                  <p className={`text-sm ${tc.textMuted}`}>{waivers?.length || 0} waivers configured</p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: accent.primary }}
                  onClick={() => {
                    // Navigate to waivers - use window location since we may not have navigate
                    navigate('/settings/waivers')
                  }}
                >
                  Manage Waivers →
                </button>
              </div>
              <div className="space-y-2">
                {['Liability Waiver', 'Photo/Media Release', 'Medical Authorization', 'Code of Conduct', 'Concussion Protocol'].map(waiver => {
                  const exists = waivers?.some(w => w.name?.toLowerCase().includes(waiver.toLowerCase().split(' ')[0]))
                  return (
                    <div key={waiver} className="flex items-center gap-2">
                      <span>{exists ? '✅' : '⬜'}</span>
                      <span className={`text-sm ${exists ? tc.text : tc.textMuted}`}>{waiver}</span>
                      {!exists && <span className="text-xs text-amber-500">(Recommended)</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <p className={`font-medium ${tc.text} mb-3`}>Insurance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Insurance Provider" field="insuranceProvider" placeholder="State Farm, USAV, etc." />
                <Input label="Policy Number" field="insurancePolicyNumber" placeholder="POL-123456" />
              </div>
              <div className="mt-4">
                <Input label="Expiration Date" field="insuranceExpiration" type="date" />
              </div>
            </div>
          </div>
        )

      case 'payments':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Configure how you accept payments from families. Enable at least one method.</p>

            {[
              { key: 'venmo', label: 'Venmo', icon: '💜', placeholder: '@YourVenmoHandle' },
              { key: 'zelle', label: 'Zelle', icon: '💚', placeholder: 'email@example.com or phone' },
              { key: 'cashapp', label: 'Cash App', icon: '💵', placeholder: '$YourCashTag' },
              { key: 'paypal', label: 'PayPal', icon: '💙', placeholder: 'email@example.com' },
              { key: 'check', label: 'Check', icon: '📝', placeholder: 'Payable to: Your Org Name' },
              { key: 'cash', label: 'Cash', icon: 'dollar', placeholder: 'In-person only' },
            ].map(method => {
              const methodData = localData.paymentMethods?.[method.key] || {}
              return (
                <div key={method.key} className={`p-4 rounded-xl border ${tc.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{method.icon}</span>
                      <span className={`font-medium ${tc.text}`}>{method.label}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newMethods = { ...localData.paymentMethods }
                        newMethods[method.key] = { ...methodData, enabled: !methodData.enabled }
                        updateField('paymentMethods', newMethods)
                      }}
                      className={`w-12 h-6 rounded-full transition-colors ${methodData.enabled ? '' : 'bg-slate-600'}`}
                      style={{ backgroundColor: methodData.enabled ? accent.primary : undefined }}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${methodData.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {methodData.enabled && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={methodData.account || ''}
                        onChange={(e) => {
                          const newMethods = { ...localData.paymentMethods }
                          newMethods[method.key] = { ...methodData, account: e.target.value }
                          updateField('paymentMethods', newMethods)
                        }}
                        placeholder={method.placeholder}
                        className={`w-full px-4 py-2 rounded-lg border ${tc.input}`}
                      />
                      <textarea
                        value={methodData.instructions || ''}
                        onChange={(e) => {
                          const newMethods = { ...localData.paymentMethods }
                          newMethods[method.key] = { ...methodData, instructions: e.target.value }
                          updateField('paymentMethods', newMethods)
                        }}
                        placeholder="Payment instructions (e.g., 'Include player name in memo')"
                        rows={2}
                        className={`w-full px-4 py-2 rounded-lg border ${tc.input} text-sm resize-none`}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <p className={`font-medium ${tc.text} mb-4`}>⚙️ Payment Settings</p>
              <div className="space-y-4">
                <Toggle
                  label="Allow Payment Plans"
                  field="allowPaymentPlans"
                  helpText="Let families split payments into installments"
                />
                {localData.allowPaymentPlans && (
                  <div className="pl-4 border-l-2 border-slate-600 space-y-4">
                    <NumberInput label="Number of Installments" field="paymentPlanInstallments" min={2} max={6} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Late Fee Amount" field="lateFeeAmount" prefix="$" />
                  <NumberInput label="Grace Period" field="gracePeriodDays" suffix="days" />
                </div>
              </div>
            </div>
          </div>
        )

      case 'fees':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Set default fees for new seasons. These can be overridden per season.</p>

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <p className={`font-medium ${tc.text} mb-4`}>💵 Default Fees</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberInput label="Registration Fee" field="defaultRegistrationFee" prefix="$" />
                <NumberInput label="Uniform Fee" field="defaultUniformFee" prefix="$" />
                <NumberInput label="Monthly Fee" field="defaultMonthlyFee" prefix="$" />
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <p className={`font-medium ${tc.text} mb-4`}>🎁 Discounts</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NumberInput label="Early Bird Discount" field="earlyBirdDiscount" prefix="$" />
                <NumberInput label="Sibling Discount" field="siblingDiscount" suffix="%" />
                <NumberInput label="Multi-Sport Discount" field="multiSportDiscount" suffix="%" />
              </div>
            </div>

            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm ${tc.text}`}>
                💡 <strong>Example:</strong> With these defaults, a family with 2 kids registering early would pay:
              </p>
              <p className={`text-lg font-semibold mt-2`} style={{ color: accent.primary }}>
                ${((localData.defaultRegistrationFee || 150) * 2) - (localData.earlyBirdDiscount || 25) - ((localData.defaultRegistrationFee || 150) * (localData.siblingDiscount || 10) / 100)}
                <span className={`text-sm font-normal ${tc.textMuted}`}> (instead of ${(localData.defaultRegistrationFee || 150) * 2})</span>
              </p>
            </div>
          </div>
        )

      case 'facilities':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className={`text-sm ${tc.textMuted}`}>Add your practice and game locations.</p>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: accent.primary }}
                onClick={() => showToast('Venue manager coming soon!', 'info')}
              >
                ➕ Add Venue
              </button>
            </div>

            {venues?.length > 0 ? (
              <div className="space-y-3">
                {venues.map(venue => (
                  <div key={venue.id} className={`p-4 rounded-xl border ${tc.border}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${tc.text}`}>{venue.name}</p>
                        <p className={`text-sm ${tc.textMuted}`}>{venue.address}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        {venue.is_home ? 'Home' : 'Away'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 rounded-xl border-2 border-dashed ${tc.border} text-center`}>
                <span className="text-4xl">📍</span>
                <p className={`${tc.text} font-medium mt-3`}>No venues added yet</p>
                <p className={`text-sm ${tc.textMuted} mt-1`}>Add at least one venue for your schedule</p>
              </div>
            )}
          </div>
        )

      case 'staff':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className={`text-sm ${tc.textMuted}`}>Manage who has admin access to your organization.</p>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: accent.primary }}
                onClick={() => showToast('Invite admin coming soon!', 'info')}
              >
                ➕ Invite Admin
              </button>
            </div>

            <div className="space-y-3">
              {adminUsers?.map(user => (
                <div key={user.id} className={`p-4 rounded-xl border ${tc.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium">
                      {user.profiles?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className={`font-medium ${tc.text}`}>{user.profiles?.full_name || 'Unknown'}</p>
                      <p className={`text-sm ${tc.textMuted}`}>{user.profiles?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 capitalize">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            {adminUsers?.length <= 1 && (
              <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/30`}>
                <p className="text-sm text-amber-400">
                  ⚠️ <strong>Tip:</strong> Consider adding a backup admin in case you're unavailable.
                </p>
              </div>
            )}
          </div>
        )

      case 'coaches':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Set requirements for coaches before they can be assigned to teams.</p>

            <div className={`space-y-1 divide-y ${tc.border}`}>
              <Toggle label="Require Background Check" field="requireBackgroundCheck" helpText="Must complete before coaching" />
              <Toggle label="Require SafeSport Certification" field="requireSafeSport" helpText="USAV/USA Sports requirement" />
              <Toggle label="Require CPR/First Aid" field="requireCPR" helpText="Current certification" />
            </div>

            <NumberInput label="Minimum Coach Age" field="coachMinAge" suffix="years" />
          </div>
        )

      case 'registration':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Control how the registration process works.</p>

            <div className={`space-y-1 divide-y ${tc.border}`}>
              <Toggle label="Auto-Approve Registrations" field="autoApproveRegistrations" helpText="Skip manual review step" />
              <Toggle label="Require Payment to Complete" field="requirePaymentToComplete" helpText="Must pay before registration is confirmed" />
              <Toggle label="Allow Waitlist" field="allowWaitlist" helpText="When teams/seasons are full" />
            </div>

            <NumberInput label="Max Players per Registration" field="maxPlayersPerRegistration" helpText="Siblings in one form" />
          </div>
        )

      case 'registrationForm':
        // Field toggle component
        const FieldToggle = ({ category, fieldKey, field }) => {
          const fields = localData.registrationFields || {}
          const categoryFields = fields[category] || {}
          const fieldData = categoryFields[fieldKey] || field

          const toggleVisible = () => {
            const updated = {
              ...localData.registrationFields,
              [category]: {
                ...categoryFields,
                [fieldKey]: { ...fieldData, visible: !fieldData.visible }
              }
            }
            updateField('registrationFields', updated)
          }

          const toggleRequired = () => {
            const updated = {
              ...localData.registrationFields,
              [category]: {
                ...categoryFields,
                [fieldKey]: { ...fieldData, required: !fieldData.required }
              }
            }
            updateField('registrationFields', updated)
          }

          return (
            <div className={`flex items-center justify-between py-3 ${fieldData.visible ? '' : 'opacity-50'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleVisible}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                    fieldData.visible
                      ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                      : `${tc.border} ${tc.cardBgAlt}`
                  }`}
                >
                  {fieldData.visible && <span className="text-xs">✓</span>}
                </button>
                <span className={`${fieldData.visible ? tc.text : tc.textMuted}`}>{fieldData.label || fieldKey}</span>
              </div>
              {fieldData.visible && (
                <button
                  onClick={toggleRequired}
                  className={`text-xs px-2 py-1 rounded-full transition ${
                    fieldData.required
                      ? 'bg-red-500/20 text-red-400'
                      : `${tc.cardBgAlt} ${tc.textMuted}`
                  }`}
                >
                  {fieldData.required ? 'Required' : 'Optional'}
                </button>
              )}
            </div>
          )
        }

        // Custom question component
        const CustomQuestionItem = ({ question, index, onUpdate, onDelete }) => (
          <div className={`p-4 rounded-xl border ${tc.border} space-y-3`}>
            <div className="flex items-start justify-between">
              <input
                type="text"
                value={question.label}
                onChange={(e) => onUpdate(index, { ...question, label: e.target.value })}
                placeholder="Question text"
                className={`flex-1 px-3 py-2 rounded-lg border ${tc.input} text-sm`}
              />
              <button
                onClick={() => onDelete(index)}
                className="ml-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                🗑️
              </button>
            </div>
            <div className="flex gap-3">
              <select
                value={question.type}
                onChange={(e) => onUpdate(index, { ...question, type: e.target.value })}
                className={`px-3 py-2 rounded-lg border ${tc.input} text-sm`}
              >
                <option value="text">Text</option>
                <option value="textarea">Long Text</option>
                <option value="dropdown">Dropdown</option>
                <option value="yesno">Yes/No</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => onUpdate(index, { ...question, required: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className={tc.textMuted}>Required</span>
              </label>
            </div>
            {question.type === 'dropdown' && (
              <input
                type="text"
                value={question.options?.join(', ') || ''}
                onChange={(e) => onUpdate(index, { ...question, options: e.target.value.split(',').map(o => o.trim()) })}
                placeholder="Options (comma separated): Option 1, Option 2, Option 3"
                className={`w-full px-3 py-2 rounded-lg border ${tc.input} text-sm`}
              />
            )}
          </div>
        )

        const addCustomQuestion = () => {
          const questions = localData.customQuestions || []
          const newQuestion = {
            id: `q_${Date.now()}`,
            label: '',
            type: 'text',
            required: false,
            options: []
          }
          updateField('customQuestions', [...questions, newQuestion])
        }

        const updateCustomQuestion = (index, question) => {
          const questions = [...(localData.customQuestions || [])]
          questions[index] = question
          updateField('customQuestions', questions)
        }

        const deleteCustomQuestion = (index) => {
          const questions = [...(localData.customQuestions || [])]
          questions.splice(index, 1)
          updateField('customQuestions', questions)
        }

        const fields = localData.registrationFields || {}

        return (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm ${tc.textMuted}`}>
                📋 Customize what information you collect during registration. Toggle fields on/off and mark them as required or optional.
              </p>
            </div>

            {/* Player Information */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">👤</span>
                <h3 className={`font-semibold ${tc.text}`}>Player Information</h3>
              </div>
              <div className={`divide-y ${tc.border}`}>
                {Object.entries(fields.player || {}).map(([key, field]) => (
                  <FieldToggle key={key} category="player" fieldKey={key} field={field} />
                ))}
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                <h3 className={`font-semibold ${tc.text}`}>Parent/Guardian Information</h3>
              </div>
              <div className={`divide-y ${tc.border}`}>
                {Object.entries(fields.parent || {}).map(([key, field]) => (
                  <FieldToggle key={key} category="parent" fieldKey={key} field={field} />
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚨</span>
                <h3 className={`font-semibold ${tc.text}`}>Emergency Contact</h3>
              </div>
              <div className={`divide-y ${tc.border}`}>
                {Object.entries(fields.emergency || {}).map(([key, field]) => (
                  <FieldToggle key={key} category="emergency" fieldKey={key} field={field} />
                ))}
              </div>
            </div>

            {/* Medical Information */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏥</span>
                <h3 className={`font-semibold ${tc.text}`}>Medical Information</h3>
              </div>
              <div className={`divide-y ${tc.border}`}>
                {Object.entries(fields.medical || {}).map(([key, field]) => (
                  <FieldToggle key={key} category="medical" fieldKey={key} field={field} />
                ))}
              </div>
            </div>

            {/* Custom Questions */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❓</span>
                  <h3 className={`font-semibold ${tc.text}`}>Custom Questions</h3>
                </div>
                <button
                  onClick={addCustomQuestion}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: accent.primary, color: 'white' }}
                >
                  ➕ Add Question
                </button>
              </div>

              {(localData.customQuestions || []).length === 0 ? (
                <p className={`text-sm ${tc.textMuted} text-center py-4`}>
                  No custom questions yet. Add questions like "How did you hear about us?" or "Interested in volunteering?"
                </p>
              ) : (
                <div className="space-y-3">
                  {(localData.customQuestions || []).map((q, i) => (
                    <CustomQuestionItem
                      key={q.id}
                      question={q}
                      index={i}
                      onUpdate={updateCustomQuestion}
                      onDelete={deleteCustomQuestion}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Waivers Selection */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📜</span>
                <h3 className={`font-semibold ${tc.text}`}>Waivers to Include</h3>
              </div>
              <p className={`text-sm ${tc.textMuted} mb-4`}>
                Select which waivers families must sign during registration. Configure waivers in the Legal & Waivers section.
              </p>
              {waivers && waivers.length > 0 ? (
                <div className="space-y-2">
                  {waivers.map(waiver => {
                    const isSelected = (localData.selectedWaivers || []).includes(waiver.id)
                    return (
                      <button
                        key={waiver.id}
                        onClick={() => {
                          const current = localData.selectedWaivers || []
                          const updated = isSelected
                            ? current.filter(id => id !== waiver.id)
                            : [...current, waiver.id]
                          updateField('selectedWaivers', updated)
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-left transition ${
                          isSelected
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                            : `${tc.border} hover:border-slate-500`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' : tc.border
                          }`}>
                            {isSelected && <span className="text-xs">✓</span>}
                          </span>
                          <span className={isSelected ? tc.text : tc.textMuted}>{waiver.name}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className={`text-center py-6 ${tc.cardBgAlt} rounded-xl`}>
                  <p className={tc.textMuted}>No waivers configured yet.</p>
                  <p className={`text-sm ${tc.textMuted} mt-1`}>Go to Legal & Waivers to add waivers.</p>
                </div>
              )}
            </div>

            {/* Preview Summary */}
            <div className={`p-5 rounded-xl ${tc.cardBgAlt}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">👁️</span>
                <h3 className={`font-semibold ${tc.text}`}>Form Preview Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold" style={{ color: accent.primary }}>
                    {Object.values(fields.player || {}).filter(f => f.visible).length}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>Player Fields</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: accent.primary }}>
                    {Object.values(fields.parent || {}).filter(f => f.visible).length}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>Parent Fields</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: accent.primary }}>
                    {(localData.customQuestions || []).length}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>Custom Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: accent.primary }}>
                    {(localData.selectedWaivers || []).length}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>Waivers</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'jerseys':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Configure jersey/uniform settings.</p>

            <Input label="Jersey Vendor" field="jerseyVendor" placeholder="Company name" />
            <NumberInput label="Order Lead Time" field="jerseyLeadTime" suffix="weeks" helpText="How long before season to order" />

            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Number Range Start" field="jerseyNumberStart" min={0} max={99} />
              <NumberInput label="Number Range End" field="jerseyNumberEnd" min={1} max={99} />
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Configure reminders and email notifications.</p>

            {/* Email Notifications Section */}
            <div className={`p-4 rounded-xl ${tc.cardAlt} border ${tc.border}`}>
              <h4 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                <span>📧</span> Email Notifications
              </h4>

              <Toggle
                label="Enable Email Notifications"
                field="emailNotificationsEnabled"
                helpText="Send automated emails for registration events"
              />

              {localData.emailNotificationsEnabled && (
                <div className="pl-4 border-l-2 border-slate-600 space-y-4 mt-4">
                  <Toggle label="Registration Confirmation" field="emailOnRegistration" helpText="Email when registration is submitted" />
                  <Toggle label="Approval Notification" field="emailOnApproval" helpText="Email when registration is approved" />
                  <Toggle label="Waitlist Updates" field="emailOnWaitlist" helpText="Email when waitlist spot opens" />
                  <Toggle label="Team Assignment" field="emailOnTeamAssignment" helpText="Email when player is assigned to team" />
                  <Toggle label="Payment Reminders" field="emailOnPaymentDue" helpText="Email for outstanding balances" />
                </div>
              )}
            </div>

            {/* Reminder Timing Section */}
            <div className={`p-4 rounded-xl ${tc.cardAlt} border ${tc.border}`}>
              <h4 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                <span>⏰</span> Reminder Timing
              </h4>
              <div className="space-y-4">
                <NumberInput label="Game Reminder" field="gameReminderHours" suffix="hours before" />
                <NumberInput label="Practice Reminder" field="practiceReminderHours" suffix="hours before" />
                <NumberInput label="Payment Reminder" field="paymentReminderDays" suffix="days before due" />
              </div>
            </div>

            {/* Email Preview Link */}
            {localData.emailNotificationsEnabled && (
              <div className={`p-4 rounded-xl bg-blue-500/10 border border-blue-500/30`}>
                <p className="text-blue-400 text-sm flex items-center gap-2">
                  <span>💡</span>
                  <span>Emails are queued in your database and sent via Supabase Edge Functions. <a href="https://supabase.com/docs/guides/functions" target="_blank" rel="noopener noreferrer" className="underline">Learn more →</a></span>
                </p>
              </div>
            )}
          </div>
        )

      case 'volunteers':
        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>Configure volunteer requirements for families.</p>

            <Toggle label="Require Volunteer Hours" field="requireVolunteerHours" helpText="Families must volunteer or pay buyout" />

            {localData.requireVolunteerHours && (
              <div className="pl-4 border-l-2 border-slate-600 space-y-4">
                <NumberInput label="Hours Required per Family" field="volunteerHoursRequired" suffix="hours" />
                <NumberInput label="Buyout Amount" field="volunteerBuyoutAmount" prefix="$" helpText="Pay this instead of volunteering" />
              </div>
            )}
          </div>
        )

      case 'branding':
        const SWATCH_COLORS = ['#EAB308','#F97316','#EF4444','#EC4899','#A855F7','#6366F1','#3B82F6','#06B6D4','#10B981','#22C55E','#78716C','#1E293B']

        async function handleBrandingUpload(e, field) {
          const file = e.target.files?.[0]
          if (!file) return
          try {
            const ext = file.name.split('.').pop()
            const path = `org-branding/${organization.id}_${field}_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('media').upload(path, file)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
            updateField(field, publicUrl)
            showToast('Image uploaded', 'success')
          } catch (err) {
            showToast(`Upload failed: ${err.message}`, 'error')
          }
        }

        return (
          <div className="space-y-6">
            <p className={`text-sm ${tc.textMuted}`}>
              Customize how your organization appears on parent-facing and public pages. These colors and images show on registration forms, team walls, and parent dashboards.
            </p>

            {/* Logo Upload */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>Organization Logo</label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden border-2"
                  style={{
                    background: localData.logoUrl ? 'transparent' : (localData.brandingPrimaryColor || accent.primary),
                    borderColor: localData.brandingPrimaryColor || accent.primary,
                    color: '#000',
                  }}
                >
                  {localData.logoUrl ? (
                    <img src={localData.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    organization?.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1">
                  <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition ${tc.card} border ${tc.border} ${tc.hoverBg}`}>
                    <Upload className="w-4 h-4" />
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBrandingUpload(e, 'logoUrl')} />
                  </label>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>Square image recommended (200x200+)</p>
                </div>
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>Primary Brand Color</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {SWATCH_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateField('brandingPrimaryColor', c)}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${localData.brandingPrimaryColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localData.brandingPrimaryColor || '#EAB308'}
                  onChange={(e) => updateField('brandingPrimaryColor', e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={localData.brandingPrimaryColor || ''}
                  onChange={(e) => updateField('brandingPrimaryColor', e.target.value)}
                  placeholder="#EAB308"
                  className={`flex-1 px-4 py-2 rounded-xl border ${tc.input}`}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>Secondary Color (optional)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localData.brandingSecondaryColor || '#1E293B'}
                  onChange={(e) => updateField('brandingSecondaryColor', e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={localData.brandingSecondaryColor || ''}
                  onChange={(e) => updateField('brandingSecondaryColor', e.target.value)}
                  placeholder="#1E293B"
                  className={`flex-1 px-4 py-2 rounded-xl border ${tc.input}`}
                />
              </div>
            </div>

            {/* Tagline */}
            <Input label="Tagline / Motto" field="brandingTagline" placeholder="Building Champions On & Off the Court" helpText="Shown on registration pages and parent views" />

            {/* Banner Image */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>Banner / Hero Image (optional)</label>
              {localData.brandingBannerUrl && (
                <div className="relative mb-2 rounded-xl overflow-hidden" style={{ maxHeight: 160 }}>
                  <img src={localData.brandingBannerUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateField('brandingBannerUrl', '')}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition ${tc.card} border ${tc.border} ${tc.hoverBg}`}>
                <Image className="w-4 h-4" />
                {localData.brandingBannerUrl ? 'Replace Banner' : 'Upload Banner'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBrandingUpload(e, 'brandingBannerUrl')} />
              </label>
              <p className={`text-xs ${tc.textMuted} mt-1`}>Wide image recommended (1200x400+). Shows on team wall and registration.</p>
            </div>

            {/* App Background */}
            <div className={`p-4 rounded-xl ${tc.cardAlt} border ${tc.border}`}>
              <h4 className={`font-semibold ${tc.text} mb-3 flex items-center gap-2`}>
                <Palette className="w-4 h-4" /> App Background
              </h4>
              <p className={`text-xs ${tc.textMuted} mb-3`}>
                Set the default background for your organization. Members can override with personal preferences.
              </p>

              {/* Background Type Selector */}
              <div className="flex gap-2 mb-4">
                {['none', 'solid', 'gradient', 'pattern'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === 'none') {
                        updateField('background', null)
                      } else {
                        const current = localData.background || {}
                        updateField('background', { ...current, type, value: current.value || '', opacity: current.opacity || 0.08 })
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                      (type === 'none' && !localData.background?.type) || localData.background?.type === type
                        ? 'text-white'
                        : `${tc.textMuted} ${tc.card} border ${tc.border}`
                    }`}
                    style={(type === 'none' && !localData.background?.type) || localData.background?.type === type
                      ? { backgroundColor: accent.primary }
                      : {}}
                  >
                    {type === 'none' ? 'Default' : type}
                  </button>
                ))}
              </div>

              {/* Solid Options */}
              {localData.background?.type === 'solid' && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { key: 'midnight', color: '#0F172A' }, { key: 'slate', color: '#1E293B' },
                    { key: 'navy', color: '#1E3A5F' }, { key: 'charcoal', color: '#374151' },
                    { key: 'white', color: '#FFFFFF' }, { key: 'cream', color: '#FFFBEB' },
                    { key: 'ice', color: '#F0F9FF' }, { key: 'mist', color: '#F1F5F9' },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => updateField('background', { ...localData.background, value: s.key })}
                      className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 border ${
                        localData.background?.value === s.key ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'border-slate-600'
                      }`}
                      style={{ background: s.color }}
                      title={s.key}
                    />
                  ))}
                </div>
              )}

              {/* Gradient Options */}
              {localData.background?.type === 'gradient' && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { key: 'ocean', colors: ['#0F172A', '#1E3A5F'] },
                    { key: 'sunset', colors: ['#1E293B', '#7C3AED', '#EC4899'] },
                    { key: 'aurora', colors: ['#0F172A', '#059669', '#0EA5E9'] },
                    { key: 'cotton-candy', colors: ['#F0F9FF', '#FCE7F3'] },
                    { key: 'fire', colors: ['#1E293B', '#DC2626', '#F97316'] },
                    { key: 'royal', colors: ['#1E293B', '#4F46E5', '#7C3AED'] },
                    { key: 'lavender', colors: ['#F5F3FF', '#DDD6FE'] },
                    { key: 'mint', colors: ['#ECFDF5', '#A7F3D0'] },
                  ].map(g => (
                    <button
                      key={g.key}
                      onClick={() => updateField('background', { ...localData.background, value: g.key })}
                      className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                        localData.background?.value === g.key ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''
                      }`}
                      style={{ background: `linear-gradient(135deg, ${g.colors.join(', ')})` }}
                      title={g.key}
                    />
                  ))}
                </div>
              )}

              {/* Pattern Options */}
              {localData.background?.type === 'pattern' && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {['volleyball', 'hexagons', 'court-lines', 'diagonal-stripes', 'triangles', 'dots'].map(p => (
                    <button
                      key={p}
                      onClick={() => updateField('background', { ...localData.background, value: p })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition ${
                        localData.background?.value === p
                          ? 'text-white'
                          : `${tc.textMuted} ${tc.card} border ${tc.border}`
                      }`}
                      style={localData.background?.value === p ? { backgroundColor: accent.primary } : {}}
                    >
                      {p.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {/* Opacity Slider */}
              {localData.background?.type && localData.background.type !== 'solid' && (
                <div className="mt-2">
                  <label className={`block text-xs ${tc.textMuted} mb-1`}>
                    Opacity: {Math.round((localData.background?.opacity || 0.08) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={Math.round((localData.background?.opacity || 0.08) * 100)}
                    onChange={(e) => updateField('background', { ...localData.background, opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-orange-500"
                  />
                </div>
              )}
            </div>

            {/* Email Branding */}
            <div className={`p-4 rounded-xl ${tc.cardAlt} border ${tc.border}`}>
              <h4 className={`font-semibold ${tc.text} mb-3 flex items-center gap-2`}>
                <Mail className="w-4 h-4" /> Email Branding (Future)
              </h4>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${tc.textSecondary} mb-1.5`}>Email Header Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={localData.brandingEmailHeaderColor || localData.brandingPrimaryColor || '#EAB308'}
                      onChange={(e) => updateField('brandingEmailHeaderColor', e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={localData.brandingEmailHeaderColor || ''}
                      onChange={(e) => updateField('brandingEmailHeaderColor', e.target.value)}
                      placeholder="Same as primary"
                      className={`flex-1 px-4 py-2 rounded-xl border ${tc.input}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <h4 className={`font-semibold ${tc.text} mb-3 flex items-center gap-2`}>
                <Eye className="w-4 h-4" /> Preview
              </h4>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: localData.brandingPrimaryColor || accent.primary }}>
                {/* Preview Header */}
                {localData.brandingBannerUrl && (
                  <div className="h-24 overflow-hidden">
                    <img src={localData.brandingBannerUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 text-center" style={{ background: `linear-gradient(135deg, ${localData.brandingPrimaryColor || accent.primary}15, transparent)` }}>
                  <div className="flex justify-center mb-3">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold overflow-hidden"
                      style={{
                        background: localData.logoUrl ? 'transparent' : (localData.brandingPrimaryColor || accent.primary),
                        color: '#000',
                      }}
                    >
                      {localData.logoUrl ? (
                        <img src={localData.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        organization?.name?.charAt(0) || '?'
                      )}
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${tc.text}`}>{organization?.name || 'Your Organization'}</p>
                  {localData.brandingTagline && (
                    <p className={`text-sm ${tc.textMuted} mt-1`}>{localData.brandingTagline}</p>
                  )}
                  <button
                    className="mt-3 px-5 py-2 rounded-xl text-sm font-bold text-black"
                    style={{ background: localData.brandingPrimaryColor || accent.primary }}
                    disabled
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <p className={tc.textMuted}>Section content coming soon...</p>
    }
  }

  return (
    <div className="space-y-6">
      {renderContent()}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <p className={`text-sm ${hasChanges ? 'text-amber-400' : tc.textMuted}`}>
          {hasChanges ? '⚠️ You have unsaved changes' : '✓ All changes saved'}
        </p>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`px-6 py-2.5 rounded-xl font-semibold transition ${hasChanges ? 'text-white' : 'opacity-50 cursor-not-allowed'}`}
          style={{ backgroundColor: hasChanges ? accent.primary : 'gray' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

export { SetupSectionContent }
