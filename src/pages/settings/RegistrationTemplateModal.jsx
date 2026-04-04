import { ChevronDown, ChevronUp, Eye, EyeOff, X } from 'lucide-react'

// Sport-specific position options
export const SPORT_POSITIONS = {
  volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite/Right Side', 'Libero/DS', 'No Preference'],
  basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center', 'No Preference'],
  soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'No Preference'],
  baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield', 'No Preference'],
  softball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield', 'No Preference'],
  football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Defensive Back', 'Kicker', 'No Preference'],
  'flag football': ['Quarterback', 'Running Back', 'Wide Receiver', 'Center', 'Rusher', 'Defensive Back', 'No Preference'],
  hockey: ['Goalie', 'Defense', 'Center', 'Wing', 'No Preference'],
  lacrosse: ['Goalie', 'Defense', 'Midfield', 'Attack', 'No Preference'],
}

// Default template configuration
export const DEFAULT_CONFIG = {
  player_fields: {
    first_name: { enabled: true, required: true, label: 'First Name' },
    last_name: { enabled: true, required: true, label: 'Last Name' },
    birth_date: { enabled: true, required: true, label: 'Date of Birth' },
    gender: { enabled: true, required: false, label: 'Gender' },
    grade: { enabled: true, required: false, label: 'Grade' },
    school: { enabled: true, required: false, label: 'School' },
    shirt_size: { enabled: false, required: false, label: 'T-Shirt Size', type: 'select', options: ['Youth Small (YS)', 'Youth Medium (YM)', 'Youth Large (YL)', 'Adult Small (AS)', 'Adult Medium (AM)', 'Adult Large (AL)', 'Adult XL (AXL)', 'Adult 2XL (A2XL)'] },
    jersey_size: { enabled: false, required: false, label: 'Jersey Size', type: 'select', options: ['Youth Small (YS)', 'Youth Medium (YM)', 'Youth Large (YL)', 'Adult Small (AS)', 'Adult Medium (AM)', 'Adult Large (AL)', 'Adult XL (AXL)', 'Adult 2XL (A2XL)'] },
    shorts_size: { enabled: false, required: false, label: 'Shorts Size', type: 'select', options: ['Youth Small (YS)', 'Youth Medium (YM)', 'Youth Large (YL)', 'Adult Small (AS)', 'Adult Medium (AM)', 'Adult Large (AL)', 'Adult XL (AXL)', 'Adult 2XL (A2XL)'] },
    preferred_number: { enabled: false, required: false, label: 'Preferred Jersey Number' },
    position_preference: { enabled: false, required: false, label: 'Position Preference', type: 'select', options: [] },
    experience_level: { enabled: false, required: false, label: 'Experience Level', type: 'select', options: ['Beginner', 'Some Experience', 'Intermediate', 'Advanced', 'Club/Travel'] },
    previous_teams: { enabled: false, required: false, label: 'Previous Teams/Clubs', type: 'textarea' },
    height: { enabled: false, required: false, label: 'Height' },
    weight: { enabled: false, required: false, label: 'Weight' },
  },
  parent_fields: {
    parent1_name: { enabled: true, required: true, label: 'Parent/Guardian Name' },
    parent1_email: { enabled: true, required: true, label: 'Email' },
    parent1_phone: { enabled: true, required: true, label: 'Phone' },
    parent2_name: { enabled: false, required: false, label: 'Second Parent/Guardian' },
    parent2_email: { enabled: false, required: false, label: 'Second Parent Email' },
    parent2_phone: { enabled: false, required: false, label: 'Second Parent Phone' },
    address: { enabled: false, required: false, label: 'Street Address' },
    city: { enabled: false, required: false, label: 'City' },
    state: { enabled: false, required: false, label: 'State' },
    zip: { enabled: false, required: false, label: 'ZIP Code' },
  },
  emergency_fields: {
    emergency_name: { enabled: true, required: true, label: 'Emergency Contact Name' },
    emergency_phone: { enabled: true, required: true, label: 'Emergency Phone' },
    emergency_relation: { enabled: true, required: false, label: 'Relationship' },
    emergency2_name: { enabled: false, required: false, label: 'Second Emergency Contact' },
    emergency2_phone: { enabled: false, required: false, label: 'Second Emergency Phone' },
  },
  medical_fields: {
    medical_conditions: { enabled: true, required: false, label: 'Medical Conditions', type: 'textarea' },
    allergies: { enabled: true, required: false, label: 'Allergies' },
    medications: { enabled: false, required: false, label: 'Current Medications', type: 'textarea' },
    doctor_name: { enabled: false, required: false, label: 'Doctor Name' },
    doctor_phone: { enabled: false, required: false, label: 'Doctor Phone' },
    insurance_provider: { enabled: false, required: false, label: 'Insurance Provider' },
    insurance_policy: { enabled: false, required: false, label: 'Policy Number' },
  },
  waivers: {
    liability: { enabled: true, required: true, title: 'Liability Waiver', text: 'I understand and accept the risks associated with participation in athletic activities.' },
    photo_release: { enabled: true, required: false, title: 'Photo/Video Release', text: 'I consent to photos and videos being taken and used for promotional purposes.' },
    code_of_conduct: { enabled: true, required: false, title: 'Code of Conduct', text: 'I agree to follow the organization\'s code of conduct and sportsmanship guidelines.' },
    medical_release: { enabled: false, required: false, title: 'Medical Release', text: 'I authorize emergency medical treatment if necessary.' },
  },
  custom_questions: []
}

const SECTION_INFO = {
  player_fields: { icon: '\u{1F464}', title: 'Player Information' },
  parent_fields: { icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}', title: 'Parent/Guardian' },
  emergency_fields: { icon: '\u{1F6A8}', title: 'Emergency Contact' },
  medical_fields: { icon: '\u{1F3E5}', title: 'Medical Information' },
  waivers: { icon: '\u{1F4DD}', title: 'Waivers & Agreements' },
}

export function RegistrationTemplateModal({
  showModal,
  setShowModal,
  editingTemplate,
  form,
  setForm,
  handleSave,
  saving,
  expandedSections,
  toggleSection,
  toggleField,
  updateFieldLabel,
  updateWaiver,
  addCustomQuestion,
  updateCustomQuestion,
  removeCustomQuestion,
  handleSportChange,
  sports,
  tc,
  isDark,
}) {
  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div
        className={`rounded-[14px] shadow-2xl w-full max-w-4xl my-8 ${tc.cardBg} border ${tc.border}`}
      >
        {/* Modal Header */}
        <div
          className={`p-6 flex items-center justify-between sticky top-0 z-10 rounded-t-[14px] ${tc.cardBg} border-b ${tc.border}`}
        >
          <div>
            <h2 className={`text-xl font-semibold ${tc.text}`}>
              {editingTemplate ? 'Edit Template' : 'New Registration Template'}
            </h2>
            <p className={tc.textMuted}>Configure which fields appear on the registration form</p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className={`p-2 rounded-lg hover:bg-white/10 transition ${tc.textMuted}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${tc.textMuted}`}>
                Template Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Volleyball Rec League"
                className={`w-full px-4 py-3 rounded-xl ${tc.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${tc.textMuted}`}>
                Sport (optional)
              </label>
              <select
                value={form.sport_id || ''}
                onChange={e => handleSportChange(e.target.value || null)}
                className={`w-full px-4 py-3 rounded-xl ${tc.input}`}
              >
                <option value="">All Sports</option>
                {sports.map(sport => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${tc.textMuted}`}>
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of when to use this template"
                className={`w-full px-4 py-3 rounded-xl ${tc.input}`}
              />
            </div>
          </div>

          {/* Field Sections */}
          {['player_fields', 'parent_fields', 'emergency_fields', 'medical_fields'].map(sectionKey => {
            const section = SECTION_INFO[sectionKey]
            const fields = form[sectionKey] || {}
            const isExpanded = expandedSections.includes(sectionKey)
            const enabledCount = Object.values(fields).filter(f => f.enabled).length

            return (
              <div
                key={sectionKey}
                className={`rounded-[14px] overflow-hidden border ${tc.border}`}
              >
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className={`w-full px-4 py-3 flex items-center justify-between transition ${tc.cardBgAlt}`}
                >
                  <span className={`font-medium flex items-center gap-2 ${tc.text}`}>
                    <span>{section.icon}</span> {section.title}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} ${tc.textMuted}`}>
                      {enabledCount} fields
                    </span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className={`w-5 h-5 ${tc.textMuted}`} />
                  ) : (
                    <ChevronDown className={`w-5 h-5 ${tc.textMuted}`} />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {Object.entries(fields).map(([fieldKey, field]) => (
                      <div
                        key={fieldKey}
                        className={`flex items-center justify-between p-3 rounded-lg ${tc.cardBgAlt}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleField(sectionKey, fieldKey, 'enabled')}
                            className={`p-1 rounded transition ${field.enabled ? 'text-emerald-400' : tc.textMuted}`}
                          >
                            {field.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateFieldLabel(sectionKey, fieldKey, e.target.value)}
                            className={`bg-transparent flex-1 text-sm ${field.enabled ? tc.text : tc.textMuted}`}
                          />
                        </div>

                        {field.enabled && (
                          <label className="flex items-center gap-2 cursor-pointer ml-4">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={() => toggleField(sectionKey, fieldKey, 'required')}
                              className="w-4 h-4 rounded accent-lynx-sky"
                            />
                            <span className={`text-sm ${tc.textMuted}`}>Required</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Waivers Section */}
          <div
            className={`rounded-[14px] overflow-hidden border ${tc.border}`}
          >
            <button
              onClick={() => toggleSection('waivers')}
              className={`w-full px-4 py-3 flex items-center justify-between transition ${tc.cardBgAlt}`}
            >
              <span className={`font-medium flex items-center gap-2 ${tc.text}`}>
                <span>{SECTION_INFO.waivers.icon}</span> Waivers & Agreements
              </span>
              {expandedSections.includes('waivers') ? (
                <ChevronUp className={`w-5 h-5 ${tc.textMuted}`} />
              ) : (
                <ChevronDown className={`w-5 h-5 ${tc.textMuted}`} />
              )}
            </button>

            {expandedSections.includes('waivers') && (
              <div className="p-4 space-y-4">
                {Object.entries(form.waivers).map(([key, waiver]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg space-y-3 ${tc.cardBgAlt}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateWaiver(key, { enabled: !waiver.enabled })}
                          className={`p-1 rounded transition ${waiver.enabled ? 'text-emerald-400' : tc.textMuted}`}
                        >
                          {waiver.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                        <input
                          type="text"
                          value={waiver.title}
                          onChange={e => updateWaiver(key, { title: e.target.value })}
                          className={`bg-transparent font-medium ${waiver.enabled ? tc.text : tc.textMuted}`}
                        />
                      </div>

                      {waiver.enabled && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={waiver.required}
                            onChange={() => updateWaiver(key, { required: !waiver.required })}
                            className="w-4 h-4 rounded accent-lynx-sky"
                          />
                          <span className={`text-sm ${tc.textMuted}`}>Required</span>
                        </label>
                      )}
                    </div>

                    {waiver.enabled && (
                      <textarea
                        value={waiver.text}
                        onChange={e => updateWaiver(key, { text: e.target.value })}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${tc.cardBg} border ${tc.border} ${tc.text}`}
                        placeholder="Waiver text..."
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Custom Questions Section */}
          <div
            className={`rounded-[14px] overflow-hidden border ${tc.border}`}
          >
            <div
              className={`px-4 py-3 flex items-center justify-between ${tc.cardBgAlt}`}
            >
              <span className={`font-medium flex items-center gap-2 ${tc.text}`}>
                <span>{'\u2753'}</span> Custom Questions
              </span>
              <button
                onClick={addCustomQuestion}
                className="text-sm text-lynx-sky hover:text-lynx-sky/80 transition"
              >
                + Add Question
              </button>
            </div>

            {form.custom_questions.length > 0 && (
              <div className="p-4 space-y-3">
                {form.custom_questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg space-y-3 ${tc.cardBgAlt}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="text"
                        value={q.question}
                        onChange={e => updateCustomQuestion(idx, { question: e.target.value })}
                        placeholder="Enter your question..."
                        className={`flex-1 px-3 py-2 rounded-lg ${tc.cardBg} border ${tc.border} ${tc.text}`}
                      />
                      <select
                        value={q.type}
                        onChange={e => updateCustomQuestion(idx, { type: e.target.value })}
                        className={`px-3 py-2 rounded-lg ${tc.cardBg} border ${tc.border} ${tc.text}`}
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                      <button
                        onClick={() => removeCustomQuestion(idx)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {q.type === 'select' && (
                      <input
                        type="text"
                        value={(q.options || []).join(', ')}
                        onChange={e => updateCustomQuestion(idx, {
                          options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                        })}
                        placeholder="Options (comma separated): Option 1, Option 2, Option 3"
                        className={`w-full px-3 py-2 rounded-lg text-sm ${tc.cardBg} border ${tc.border} ${tc.text}`}
                      />
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={e => updateCustomQuestion(idx, { required: e.target.checked })}
                        className="w-4 h-4 rounded accent-lynx-sky"
                      />
                      <span className={`text-sm ${tc.textMuted}`}>Required</span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {form.custom_questions.length === 0 && (
              <div className={`p-4 text-center text-sm ${tc.textMuted}`}>
                No custom questions. Click "Add Question" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-6 flex items-center justify-between sticky bottom-0 rounded-b-[14px] ${tc.cardBg} border-t ${tc.border}`}
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              className="w-4 h-4 rounded accent-lynx-sky"
            />
            <span className={tc.textMuted}>Set as default template</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(false)}
              className={`px-4 py-2 rounded-xl transition ${tc.cardBgAlt} ${tc.text}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-lynx-navy text-white font-medium hover:brightness-110 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
