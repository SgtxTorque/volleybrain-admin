import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  Users, X, Upload, Palette, Image, Eye
} from '../../constants/icons'

// ============================================
// FORM HELPER COMPONENTS (defined outside to prevent remount on re-render)
// ============================================
function SectionInput({ label, field, type = 'text', placeholder = '', required = false, helpText = '', localData, updateField, tc, accent }) {
  return (
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
}

function SectionToggle({ label, field, helpText = '', localData, updateField, tc, accent }) {
  return (
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
}

function SectionSelect({ label, field, options, required = false, localData, updateField, tc }) {
  return (
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
}

function SectionNumberInput({ label, field, min = 0, max = 9999, prefix = '', suffix = '', localData, updateField, tc }) {
  return (
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
}

function SectionFieldToggle({ category, fieldKey, field, localData, updateField, tc, accent }) {
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
          {fieldData.visible && <span className="text-xs">{'\u2713'}</span>}
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

function SectionCustomQuestionItem({ question, index, onUpdate, onDelete, tc }) {
  return (
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
          {'\uD83D\uDDD1\uFE0F'}
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
}

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
  accent,
  onChangeStatus,
  saveRef
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

  // Report changes status to parent for header save button
  useEffect(() => {
    onChangeStatus?.(hasChanges, saving)
  }, [hasChanges, saving])

  const updateField = (key, value) => {
    setLocalData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(localData)
    setHasChanges(false)
  }

  // Expose handleSave to parent via ref for header save button
  useEffect(() => {
    if (saveRef) saveRef.current = handleSave
  })

  // Auto-save before navigating away from org settings
  function navigateWithSave(destination, localStorageKey, localStorageValue) {
    if (hasChanges) {
      onSave(localData)
      setHasChanges(false)
      showToast?.('Changes saved', 'success')
    }
    if (localStorageKey) localStorage.setItem(localStorageKey, localStorageValue)
    navigate(destination)
  }

  // Warn about unsaved changes on browser-level navigation (refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Shared props passed to all extracted form components
  const fp = { localData, updateField, tc, accent }

  // Render content based on section
  const renderContent = () => {
    switch (sectionKey) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionInput {...fp} label="Organization Name" field="name" placeholder="Black Hornets Volleyball Club" required />
              <SectionInput {...fp} label="Short Name / Abbreviation" field="shortName" placeholder="BHVC" helpText="Used on jerseys and reports" />
            </div>
            <SectionInput {...fp} label="Tagline / Slogan" field="tagline" placeholder="Building Champions On & Off the Court" />
            <SectionInput {...fp} label="Logo URL" field="logoUrl" placeholder="https://..." helpText="Paste a link to your logo image" />
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
              <SectionSelect {...fp}
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
              <SectionInput {...fp} label="Founded Year" field="foundedYear" type="number" placeholder="2015" />
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
              <SectionInput {...fp} label="Primary Contact Name" field="contactName" placeholder="John Smith" required />
              <SectionInput {...fp} label="Title" field="contactTitle" placeholder="League Director" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionInput {...fp} label="Primary Email" field="email" type="email" placeholder="info@blackhornets.com" required />
              <SectionInput {...fp} label="Secondary Email" field="secondaryEmail" type="email" placeholder="backup@blackhornets.com" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionInput {...fp} label="Primary Phone" field="phone" type="tel" placeholder="(555) 123-4567" required />
              <SectionInput {...fp} label="Secondary Phone" field="secondaryPhone" type="tel" placeholder="(555) 987-6543" />
            </div>
            <SectionInput {...fp} label="Street Address" field="address" placeholder="123 Main Street" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <SectionInput {...fp} label="City" field="city" placeholder="Dallas" required />
              </div>
              <SectionSelect {...fp}
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
              <SectionInput {...fp} label="ZIP" field="zip" placeholder="75001" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionSelect {...fp}
                label="Time Zone"
                field="timezone"
                options={[
                  { value: 'America/New_York', label: 'Eastern Time' },
                  { value: 'America/Chicago', label: 'Central Time' },
                  { value: 'America/Denver', label: 'Mountain Time' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time' },
                ]}
              />
              <SectionInput {...fp} label="Office Hours" field="officeHours" placeholder="Mon-Fri 9am-5pm" />
            </div>
          </div>
        )

      case 'online':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionInput {...fp} label="Website URL" field="website" placeholder="https://www.blackhornets.com" />
              <SectionInput {...fp} label="Facebook Page" field="facebook" placeholder="https://facebook.com/blackhornetsVB" />
              <SectionInput {...fp} label="Instagram Handle" field="instagram" placeholder="@blackhornetsVB" helpText="Just the handle, no URL needed" />
              <SectionInput {...fp} label="Twitter / X Handle" field="twitter" placeholder="@blackhornetsVB" />
            </div>
            <div className={`p-3 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm font-medium ${tc.text} mb-1`}>📎 Your Registration Link</p>
              <div className="flex gap-2 items-center">
                <code className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${tc.input}`}>
                  thelynxapp.com/register/{organization?.slug || 'your-org'}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://thelynxapp.com/register/${organization?.slug}`)
                    showToast('Link copied!', 'success')
                  }}
                  className="px-3 py-1.5 rounded-lg text-white font-medium text-sm"
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
          <div className="space-y-5">
            {/* Sports Selection */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>
                Which sports does your organization offer? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {allSports.map(sport => {
                  const isEnabled = (localData.enabledSports || []).includes(sport.id)
                  return (
                    <button
                      key={sport.id}
                      onClick={() => toggleArrayItem('enabledSports', sport.id)}
                      className={`px-2 py-2 rounded-xl border-2 transition-all text-center ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : `${tc.border} ${tc.hoverBg}`
                      }`}
                    >
                      <span className="text-lg">{sport.icon}</span>
                      <p className={`text-xs font-medium mt-0.5 ${isEnabled ? tc.text : tc.textMuted}`}>{sport.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Program Types */}
            <div>
              <label className={`block text-sm font-medium ${tc.textSecondary} mb-2`}>
                What types of programs do you offer?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allPrograms.map(program => {
                  const isEnabled = (localData.programTypes || []).includes(program.id)
                  return (
                    <button
                      key={program.id}
                      onClick={() => toggleArrayItem('programTypes', program.id)}
                      className={`px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                          : `${tc.border} ${tc.hoverBg}`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{program.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${isEnabled ? tc.text : tc.textMuted}`}>{program.name}</p>
                          <p className={`text-[10px] ${tc.textMuted}`}>{program.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Age, Skill, Gender in a 2-col grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Age System */}
              <div className={`p-3 rounded-xl border ${tc.border}`}>
                <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>
                  Age Divisions
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateField('ageSystem', 'grade')}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-center transition-all text-sm ${
                      localData.ageSystem === 'grade'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-medium'
                        : `${tc.border}`
                    }`}
                  >
                    📚 Grade-Based
                  </button>
                  <button
                    onClick={() => updateField('ageSystem', 'age')}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-center transition-all text-sm ${
                      localData.ageSystem === 'age'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-medium'
                        : `${tc.border}`
                    }`}
                  >
                    🎂 Age-Based
                  </button>
                </div>
                {localData.ageSystem === 'age' && (
                  <div className="mt-2">
                    <label className={`block text-xs ${tc.textMuted} mb-1`}>Age cutoff (MM-DD)</label>
                    <input
                      type="text"
                      value={localData.ageCutoffDate || '08-01'}
                      onChange={(e) => updateField('ageCutoffDate', e.target.value)}
                      placeholder="08-01"
                      className={`w-24 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                    />
                  </div>
                )}
              </div>

              {/* Skill Levels + Gender */}
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>
                    Skill Levels
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {allSkillLevels.map(level => {
                      const isEnabled = (localData.skillLevels || []).includes(level.id)
                      return (
                        <button
                          key={level.id}
                          onClick={() => toggleArrayItem('skillLevels', level.id)}
                          className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
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
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>
                    Gender Divisions
                  </label>
                  <div className="flex gap-2">
                    {allGenders.map(gender => {
                      const isEnabled = (localData.genderOptions || []).includes(gender.id)
                      return (
                        <button
                          key={gender.id}
                          onClick={() => toggleArrayItem('genderOptions', gender.id)}
                          className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            isEnabled
                              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
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
            </div>
          </div>
        )

      case 'legal':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionInput {...fp} label="Legal Entity Name" field="legalName" placeholder="Black Hornets Volleyball LLC" helpText="If different from org name" />
              <SectionSelect {...fp}
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
            <SectionInput {...fp} label="EIN / Tax ID" field="ein" placeholder="XX-XXXXXXX" helpText="For tax purposes and payment processing" />

            <div className={`p-4 rounded-xl border ${tc.border} ${tc.cardBgAlt}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className={`font-medium ${tc.text}`}>Waivers</p>
                    <p className={`text-sm ${tc.textMuted}`}>
                      {waivers?.filter(w => w.is_active).length || 0} active
                      {' · '}
                      {waivers?.filter(w => w.is_required).length || 0} required
                      {' · '}
                      {waivers?.length || 0} total
                    </p>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: accent.primary }}
                  onClick={() => navigateWithSave('/settings/waivers', 'returnToOrgSetup', 'legal')}
                >
                  Manage Waivers →
                </button>
              </div>
              {(!waivers || waivers.length === 0) && (
                <p className={`text-sm mt-3 ${tc.textMuted}`}>
                  No waivers created yet. Add your liability waiver, code of conduct, and other documents families need to sign.
                </p>
              )}
              {waivers && waivers.filter(w => w.is_active).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {waivers.filter(w => w.is_active).map(w => (
                    <span
                      key={w.id}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        w.is_required
                          ? 'bg-red-500/10 text-red-500'
                          : tc.cardBgAlt + ' ' + tc.textMuted
                      }`}
                    >
                      {w.name}
                      {w.is_required && ' · Required'}
                      {w.sport_id && ' · Sport-specific'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <p className={`font-medium ${tc.text} mb-3`}>Insurance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SectionInput {...fp} label="Insurance Provider" field="insuranceProvider" placeholder="State Farm, USAV, etc." />
                <SectionInput {...fp} label="Policy Number" field="insurancePolicyNumber" placeholder="POL-123456" />
              </div>
              <div className="mt-4">
                <SectionInput {...fp} label="Expiration Date" field="insuranceExpiration" type="date" />
              </div>
            </div>
          </div>
        )

      case 'payments':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Configure how you accept payments from families. Enable at least one method.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] lg:grid-rows-[auto_1fr] gap-4">

              {/* TOP-LEFT: Online Payments (Stripe) */}
              <div className={`p-4 rounded-xl border-2 ${
                organization?.stripe_enabled
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : `${tc.border}`
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${tc.text}`}>Online Payments</p>
                    <p className={`text-xs ${tc.textMuted}`}>
                      {organization?.stripe_enabled
                        ? <>Stripe is <span className="text-emerald-500 font-semibold">enabled</span> ({organization?.stripe_mode === 'live' ? 'Live' : 'Test'} mode)</>
                        : 'Credit/debit cards via Stripe'
                      }
                    </p>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-white font-medium text-xs flex-shrink-0"
                    style={{ backgroundColor: accent.primary }}
                    onClick={() => navigateWithSave('/settings/payment-setup', 'returnToOrgSetup', 'payments')}
                  >
                    {organization?.stripe_enabled ? 'Manage →' : 'Set Up →'}
                  </button>
                </div>
              </div>

              {/* TOP-RIGHT: Payment Plans */}
              <div className={`p-4 rounded-xl border ${tc.border}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateField('allowPaymentPlans', !localData.allowPaymentPlans)}
                    className={`w-9 h-[18px] rounded-full transition-colors flex-shrink-0 ${localData.allowPaymentPlans ? '' : 'bg-slate-600'}`}
                    style={{ backgroundColor: localData.allowPaymentPlans ? accent.primary : undefined }}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${localData.allowPaymentPlans ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                  <div>
                    <p className={`text-sm font-semibold ${tc.text}`}>Allow Payment Plans</p>
                    <p className={`text-xs ${tc.textMuted}`}>Split payments into installments</p>
                  </div>
                </div>
                {localData.allowPaymentPlans && (
                  <div className="mt-3 pl-12">
                    <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Installments</label>
                    <input
                      type="number"
                      value={localData.paymentPlanInstallments || ''}
                      onChange={(e) => updateField('paymentPlanInstallments', parseFloat(e.target.value) || 0)}
                      min={2} max={6}
                      className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                    />
                  </div>
                )}
              </div>

              {/* BOTTOM-LEFT: Manual Methods */}
              <div className={`rounded-xl border ${tc.border}`}>
                <div className="px-4 py-2">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${tc.textMuted}`}>Manual Methods</p>
                </div>
                <div className={`divide-y ${tc.border}`}>
                  {[
                    { key: 'venmo', label: 'Venmo', icon: '💜', placeholder: '@YourVenmoHandle' },
                    { key: 'zelle', label: 'Zelle', icon: '💚', placeholder: 'email@example.com or phone' },
                    { key: 'cashapp', label: 'Cash App', icon: '💵', placeholder: '$YourCashTag' },
                    { key: 'paypal', label: 'PayPal', icon: '💙', placeholder: 'email@example.com' },
                    { key: 'check', label: 'Check', icon: '📝', placeholder: 'Payable to: Your Org Name' },
                    { key: 'cash', label: 'Cash', icon: '💰', placeholder: 'In-person only' },
                  ].map(method => {
                    const methodData = localData.paymentMethods?.[method.key] || {}
                    return (
                      <div key={method.key} className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm w-5 text-center">{method.icon}</span>
                          <span className={`font-medium text-sm ${tc.text} w-20`}>{method.label}</span>
                          <button
                            onClick={() => {
                              const newMethods = { ...localData.paymentMethods }
                              newMethods[method.key] = { ...methodData, enabled: !methodData.enabled }
                              updateField('paymentMethods', newMethods)
                            }}
                            className={`w-9 h-[18px] rounded-full transition-colors flex-shrink-0 ${methodData.enabled ? '' : 'bg-slate-600'}`}
                            style={{ backgroundColor: methodData.enabled ? accent.primary : undefined }}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${methodData.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                          </button>
                          {methodData.enabled && (
                            <input
                              type="text"
                              value={methodData.account || ''}
                              onChange={(e) => {
                                const newMethods = { ...localData.paymentMethods }
                                newMethods[method.key] = { ...methodData, account: e.target.value }
                                updateField('paymentMethods', newMethods)
                              }}
                              placeholder={method.placeholder}
                              className={`flex-1 px-2.5 py-1 rounded-lg border text-sm ${tc.input}`}
                            />
                          )}
                        </div>
                        {methodData.enabled && (
                          <div className="mt-1.5 pl-[7.5rem]">
                            <input
                              type="text"
                              value={methodData.instructions || ''}
                              onChange={(e) => {
                                const newMethods = { ...localData.paymentMethods }
                                newMethods[method.key] = { ...methodData, instructions: e.target.value }
                                updateField('paymentMethods', newMethods)
                              }}
                              placeholder="Instructions (optional)"
                              className={`w-full px-2.5 py-1 rounded-lg border text-xs ${tc.input}`}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* BOTTOM-RIGHT: Fees & Grace Period */}
              <div className={`p-4 rounded-xl border ${tc.border} self-start`}>
                <p className={`font-semibold text-sm ${tc.text} mb-3`}>Fees & Grace Period</p>
                <div className="flex gap-4">
                  <div>
                    <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Late Fee</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input
                        type="number"
                        value={localData.lateFeeAmount || ''}
                        onChange={(e) => updateField('lateFeeAmount', parseFloat(e.target.value) || 0)}
                        className={`w-24 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Grace Period</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={localData.gracePeriodDays || ''}
                        onChange={(e) => updateField('gracePeriodDays', parseFloat(e.target.value) || 0)}
                        className={`w-24 pr-12 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>days</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )

      case 'fees':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Set default fees for new seasons. These can be overridden per season.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Default Fees */}
              <div className={`p-4 rounded-xl border ${tc.border}`}>
                <p className={`font-semibold text-sm ${tc.text} mb-3`}>💵 Default Fees</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Registration</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.defaultRegistrationFee || ''} onChange={(e) => updateField('defaultRegistrationFee', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Uniform</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.defaultUniformFee || ''} onChange={(e) => updateField('defaultUniformFee', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Monthly</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.defaultMonthlyFee || ''} onChange={(e) => updateField('defaultMonthlyFee', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discounts */}
              <div className={`p-4 rounded-xl border ${tc.border}`}>
                <p className={`font-semibold text-sm ${tc.text} mb-3`}>🎁 Discounts</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Early Bird</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                      <input type="number" value={localData.earlyBirdDiscount || ''} onChange={(e) => updateField('earlyBirdDiscount', parseFloat(e.target.value) || 0)}
                        className={`w-28 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Sibling</label>
                    <div className="relative">
                      <input type="number" value={localData.siblingDiscount || ''} onChange={(e) => updateField('siblingDiscount', parseFloat(e.target.value) || 0)}
                        className={`w-28 pr-8 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className={`text-sm ${tc.text} w-32`}>Multi-Sport</label>
                    <div className="relative">
                      <input type="number" value={localData.multiSportDiscount || ''} onChange={(e) => updateField('multiSportDiscount', parseFloat(e.target.value) || 0)}
                        className={`w-28 pr-8 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl ${tc.cardBgAlt}`}>
              <p className={`text-sm ${tc.text}`}>
                💡 <strong>Example:</strong> 2 kids registering early =
                <span className="font-semibold ml-1" style={{ color: accent.primary }}>
                  ${((localData.defaultRegistrationFee || 150) * 2) - (localData.earlyBirdDiscount || 25) - ((localData.defaultRegistrationFee || 150) * (localData.siblingDiscount || 10) / 100)}
                </span>
                <span className={`${tc.textMuted}`}> (instead of ${(localData.defaultRegistrationFee || 150) * 2})</span>
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
                onClick={() => navigateWithSave('/settings/venues', 'returnToOrgSetup', 'facilities')}
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
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Set requirements for coaches before they can be assigned to teams.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
              <div className={`space-y-1 divide-y ${tc.border}`}>
                <SectionToggle {...fp} label="Require Background Check" field="requireBackgroundCheck" helpText="Must complete before coaching" />
                <SectionToggle {...fp} label="Require SafeSport Certification" field="requireSafeSport" helpText="USAV/USA Sports requirement" />
                <SectionToggle {...fp} label="Require CPR/First Aid" field="requireCPR" helpText="Current certification" />
              </div>
              <div className={`p-4 rounded-xl border ${tc.border} self-start`}>
                <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Min Coach Age</label>
                <div className="relative">
                  <input type="number" value={localData.coachMinAge || ''} onChange={(e) => updateField('coachMinAge', parseFloat(e.target.value) || 0)}
                    className={`w-24 pr-12 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>years</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'registration':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Control how the registration process works.</p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
              <div className={`space-y-1 divide-y ${tc.border}`}>
                <SectionToggle {...fp} label="Auto-Approve Registrations" field="autoApproveRegistrations" helpText="Skip manual review step" />
                <SectionToggle {...fp} label="Require Payment to Complete" field="requirePaymentToComplete" helpText="Must pay before registration is confirmed" />
                <SectionToggle {...fp} label="Allow Waitlist" field="allowWaitlist" helpText="When teams/seasons are full" />
              </div>
              <div className={`p-4 rounded-xl border ${tc.border} self-start`}>
                <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Max Players per Reg</label>
                <input type="number" value={localData.maxPlayersPerRegistration || ''} onChange={(e) => updateField('maxPlayersPerRegistration', parseFloat(e.target.value) || 0)}
                  className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                <p className={`text-[10px] ${tc.textMuted} mt-1`}>Siblings in one form</p>
              </div>
            </div>
          </div>
        )

      case 'registrationForm':

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
                  <SectionFieldToggle {...fp} key={key} category="player" fieldKey={key} field={field} />
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
                  <SectionFieldToggle {...fp} key={key} category="parent" fieldKey={key} field={field} />
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
                  <SectionFieldToggle {...fp} key={key} category="emergency" fieldKey={key} field={field} />
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
                  <SectionFieldToggle {...fp} key={key} category="medical" fieldKey={key} field={field} />
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
                    <SectionCustomQuestionItem
                      key={q.id}
                      question={q}
                      index={i}
                      onUpdate={updateCustomQuestion}
                      onDelete={deleteCustomQuestion}
                      tc={tc}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Waivers Summary (managed via Waiver Manager) */}
            <div className={`p-5 rounded-xl border ${tc.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <h3 className={`font-semibold ${tc.text}`}>Waivers</h3>
                </div>
                <button
                  className="text-sm font-medium transition"
                  style={{ color: accent.primary }}
                  onClick={() => navigateWithSave('/settings/waivers', 'returnToOrgSetup', 'registrationForm')}
                >
                  Manage Waivers →
                </button>
              </div>
              <p className={`text-sm ${tc.textMuted} mb-3`}>
                All active waivers are automatically included during registration. Manage them in the Waiver Manager.
              </p>
              {waivers && waivers.filter(w => w.is_active).length > 0 ? (
                <div className="space-y-1.5">
                  {waivers.filter(w => w.is_active).map(w => (
                    <div key={w.id} className={`flex items-center gap-2 text-sm ${tc.text}`}>
                      <span className="text-green-500">✓</span>
                      <span>{w.name}</span>
                      {w.is_required && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">Required</span>
                      )}
                      {w.sport_id && (
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${tc.cardBgAlt} ${tc.textMuted}`}>Sport-specific</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-4 ${tc.cardBgAlt} rounded-xl`}>
                  <p className={tc.textMuted}>No active waivers.</p>
                  <p className={`text-sm ${tc.textMuted} mt-1`}>Create and activate waivers in the Waiver Manager.</p>
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
                    {waivers?.filter(w => w.is_active).length || 0}
                  </p>
                  <p className={`text-xs ${tc.textMuted}`}>Active Waivers</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'jerseys':
        return (
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Configure jersey/uniform settings.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Jersey Vendor</label>
                  <input type="text" value={localData.jerseyVendor || ''} onChange={(e) => updateField('jerseyVendor', e.target.value)}
                    placeholder="Company name" className={`w-full max-w-xs px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Order Lead Time</label>
                  <div className="relative w-32">
                    <input type="number" value={localData.jerseyLeadTime || ''} onChange={(e) => updateField('jerseyLeadTime', parseFloat(e.target.value) || 0)}
                      className={`w-full pr-14 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>weeks</span>
                  </div>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Number Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={localData.jerseyNumberStart || ''} onChange={(e) => updateField('jerseyNumberStart', parseFloat(e.target.value) || 0)}
                    min={0} max={99} placeholder="1" className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                  <span className={`text-sm ${tc.textMuted}`}>to</span>
                  <input type="number" value={localData.jerseyNumberEnd || ''} onChange={(e) => updateField('jerseyNumberEnd', parseFloat(e.target.value) || 0)}
                    min={1} max={99} placeholder="99" className={`w-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                </div>
              </div>
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

              <SectionToggle {...fp}
                label="Enable Email Notifications"
                field="emailNotificationsEnabled"
                helpText="Send automated emails for registration events"
              />

              {localData.emailNotificationsEnabled && (
                <div className="pl-4 border-l-2 border-slate-600 space-y-4 mt-4">
                  <SectionToggle {...fp} label="Registration Confirmation" field="emailOnRegistration" helpText="Email when registration is submitted" />
                  <SectionToggle {...fp} label="Approval Notification" field="emailOnApproval" helpText="Email when registration is approved" />
                  <SectionToggle {...fp} label="Waitlist Updates" field="emailOnWaitlist" helpText="Email when waitlist spot opens" />
                  <SectionToggle {...fp} label="Team Assignment" field="emailOnTeamAssignment" helpText="Email when player is assigned to team" />
                  <SectionToggle {...fp} label="Payment Reminders" field="emailOnPaymentDue" helpText="Email for outstanding balances" />
                </div>
              )}
            </div>

            {/* Reminder Timing Section */}
            <div className={`p-4 rounded-xl ${tc.cardAlt} border ${tc.border}`}>
              <h4 className={`font-semibold ${tc.text} mb-4 flex items-center gap-2`}>
                <span>⏰</span> Reminder Timing
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className={`text-sm ${tc.text} w-36`}>Game Reminder</label>
                  <div className="relative">
                    <input type="number" value={localData.gameReminderHours || ''} onChange={(e) => updateField('gameReminderHours', parseFloat(e.target.value) || 0)}
                      className={`w-28 pr-16 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${tc.textMuted}`}>hrs before</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-sm ${tc.text} w-36`}>Practice Reminder</label>
                  <div className="relative">
                    <input type="number" value={localData.practiceReminderHours || ''} onChange={(e) => updateField('practiceReminderHours', parseFloat(e.target.value) || 0)}
                      className={`w-28 pr-16 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${tc.textMuted}`}>hrs before</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`text-sm ${tc.text} w-36`}>Payment Reminder</label>
                  <div className="relative">
                    <input type="number" value={localData.paymentReminderDays || ''} onChange={(e) => updateField('paymentReminderDays', parseFloat(e.target.value) || 0)}
                      className={`w-28 pr-20 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${tc.textMuted}`}>days before</span>
                  </div>
                </div>
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
          <div className="space-y-4">
            <p className={`text-sm ${tc.textMuted}`}>Configure volunteer requirements for families.</p>

            <SectionToggle {...fp} label="Require Volunteer Hours" field="requireVolunteerHours" helpText="Families must volunteer or pay buyout" />

            {localData.requireVolunteerHours && (
              <div className="pl-4 border-l-2 border-slate-600 flex gap-6">
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Hours Required</label>
                  <div className="relative">
                    <input type="number" value={localData.volunteerHoursRequired || ''} onChange={(e) => updateField('volunteerHoursRequired', parseFloat(e.target.value) || 0)}
                      className={`w-24 pr-12 px-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${tc.textMuted}`}>hrs</span>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-medium ${tc.textSecondary} mb-1`}>Buyout Amount</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${tc.textMuted}`}>$</span>
                    <input type="number" value={localData.volunteerBuyoutAmount || ''} onChange={(e) => updateField('volunteerBuyoutAmount', parseFloat(e.target.value) || 0)}
                      className={`w-24 pl-7 pr-3 py-1.5 rounded-lg border text-sm ${tc.input}`} />
                  </div>
                  <p className={`text-[10px] ${tc.textMuted} mt-1`}>Pay instead of volunteering</p>
                </div>
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
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold overflow-hidden border-2"
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
            <SectionInput {...fp} label="Tagline / Motto" field="brandingTagline" placeholder="Building Champions On & Off the Court" helpText="Shown on registration pages and parent views" />

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
                    className="w-full accent-[#4BB9EC]"
                  />
                </div>
              )}
            </div>

            {/* Live Preview */}
            <div>
              <h4 className={`font-semibold ${tc.text} mb-3 flex items-center gap-2`}>
                <Eye className="w-4 h-4" /> Preview
              </h4>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: localData.brandingPrimaryColor || accent.primary }}>
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
    </div>
  )
}

export { SetupSectionContent }
