import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, Copy, ChevronDown, ChevronUp, Eye, EyeOff, X, GripVertical } from 'lucide-react'

// Sport-specific position options
const SPORT_POSITIONS = {
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
const DEFAULT_CONFIG = {
  player_fields: {
    first_name: { enabled: true, required: true, label: 'First Name' },
    last_name: { enabled: true, required: true, label: 'Last Name' },
    birth_date: { enabled: true, required: true, label: 'Date of Birth' },
    gender: { enabled: true, required: false, label: 'Gender' },
    grade: { enabled: true, required: false, label: 'Grade' },
    school: { enabled: true, required: false, label: 'School' },
    shirt_size: { enabled: false, required: false, label: 'T-Shirt Size', type: 'select', options: ['YS', 'YM', 'YL', 'AS', 'AM', 'AL', 'AXL', 'A2XL'] },
    jersey_size: { enabled: false, required: false, label: 'Jersey Size', type: 'select', options: ['YS', 'YM', 'YL', 'AS', 'AM', 'AL', 'AXL', 'A2XL'] },
    shorts_size: { enabled: false, required: false, label: 'Shorts Size', type: 'select', options: ['YS', 'YM', 'YL', 'AS', 'AM', 'AL', 'AXL', 'A2XL'] },
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
  player_fields: { icon: '👤', title: 'Player Information' },
  parent_fields: { icon: '👨‍👩‍👧', title: 'Parent/Guardian' },
  emergency_fields: { icon: '🚨', title: 'Emergency Contact' },
  medical_fields: { icon: '🏥', title: 'Medical Information' },
  waivers: { icon: '📝', title: 'Waivers & Agreements' },
}

function RegistrationTemplatesPage({ showToast }) {
  const { organization } = useAuth()
  const { colors } = useTheme()
  
  const [templates, setTemplates] = useState([])
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [expandedSections, setExpandedSections] = useState(['player_fields'])
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    sport_id: null,
    is_default: false,
    ...JSON.parse(JSON.stringify(DEFAULT_CONFIG))
  })

  useEffect(() => {
    if (organization?.id) {
      loadTemplates()
      loadSports()
    }
  }, [organization?.id])

  async function loadTemplates() {
    setLoading(true)
    const { data, error } = await supabase
      .from('registration_templates')
      .select('*, sports(id, name, icon)')
      .eq('organization_id', organization.id)
      .order('is_default', { ascending: false })
      .order('name')
    
    if (error) {
      console.error('Error loading templates:', error)
      showToast?.('Failed to load templates', 'error')
    }
    setTemplates(data || [])
    setLoading(false)
  }

  async function loadSports() {
    const { data } = await supabase
      .from('sports')
      .select('*')
      .order('name')
    setSports(data || [])
  }

  function openNew() {
    setEditingTemplate(null)
    setForm({
      name: '',
      description: '',
      sport_id: null,
      is_default: false,
      ...JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    })
    setExpandedSections(['player_fields'])
    setShowModal(true)
  }

  function openEdit(template) {
    setEditingTemplate(template)
    setForm({
      name: template.name || '',
      description: template.description || '',
      sport_id: template.sport_id || null,
      is_default: template.is_default || false,
      player_fields: template.player_fields || DEFAULT_CONFIG.player_fields,
      parent_fields: template.parent_fields || DEFAULT_CONFIG.parent_fields,
      emergency_fields: template.emergency_fields || DEFAULT_CONFIG.emergency_fields,
      medical_fields: template.medical_fields || DEFAULT_CONFIG.medical_fields,
      waivers: template.waivers || DEFAULT_CONFIG.waivers,
      custom_questions: template.custom_questions || [],
    })
    setExpandedSections(['player_fields'])
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast?.('Please enter a template name', 'error')
      return
    }

    setSaving(true)
    
    const payload = {
      organization_id: organization.id,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      sport_id: form.sport_id || null,
      is_default: form.is_default,
      player_fields: form.player_fields,
      parent_fields: form.parent_fields,
      emergency_fields: form.emergency_fields,
      medical_fields: form.medical_fields,
      waivers: form.waivers,
      custom_questions: form.custom_questions,
    }

    let error
    if (editingTemplate) {
      const result = await supabase
        .from('registration_templates')
        .update(payload)
        .eq('id', editingTemplate.id)
      error = result.error
    } else {
      const result = await supabase
        .from('registration_templates')
        .insert(payload)
      error = result.error
    }

    setSaving(false)

    if (error) {
      console.error('Save error:', error)
      showToast?.(editingTemplate ? 'Failed to update template' : 'Failed to create template', 'error')
      return
    }

    showToast?.(editingTemplate ? 'Template updated!' : 'Template created!', 'success')
    setShowModal(false)
    loadTemplates()
  }

  async function handleDelete(template) {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return
    
    const { error } = await supabase
      .from('registration_templates')
      .delete()
      .eq('id', template.id)
    
    if (error) {
      showToast?.('Failed to delete template', 'error')
      return
    }
    showToast?.('Template deleted', 'success')
    loadTemplates()
  }

  async function handleDuplicate(template) {
    const newName = `${template.name} (Copy)`
    
    const { error } = await supabase
      .from('registration_templates')
      .insert({
        organization_id: organization.id,
        name: newName,
        description: template.description,
        sport_id: template.sport_id,
        is_default: false,
        player_fields: template.player_fields,
        parent_fields: template.parent_fields,
        emergency_fields: template.emergency_fields,
        medical_fields: template.medical_fields,
        waivers: template.waivers,
        custom_questions: template.custom_questions,
      })
    
    if (error) {
      showToast?.('Failed to duplicate template', 'error')
      return
    }
    showToast?.('Template duplicated!', 'success')
    loadTemplates()
  }

  function toggleSection(section) {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  function toggleField(section, fieldKey, property) {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [fieldKey]: {
          ...prev[section][fieldKey],
          [property]: !prev[section][fieldKey][property]
        }
      }
    }))
  }

  function updateFieldLabel(section, fieldKey, newLabel) {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [fieldKey]: {
          ...prev[section][fieldKey],
          label: newLabel
        }
      }
    }))
  }

  function updateWaiver(key, updates) {
    setForm(prev => ({
      ...prev,
      waivers: {
        ...prev.waivers,
        [key]: { ...prev.waivers[key], ...updates }
      }
    }))
  }

  function addCustomQuestion() {
    setForm(prev => ({
      ...prev,
      custom_questions: [
        ...prev.custom_questions,
        { id: `q_${Date.now()}`, question: '', type: 'text', required: false, options: [] }
      ]
    }))
  }

  function updateCustomQuestion(index, updates) {
    setForm(prev => ({
      ...prev,
      custom_questions: prev.custom_questions.map((q, i) => 
        i === index ? { ...q, ...updates } : q
      )
    }))
  }

  function removeCustomQuestion(index) {
    setForm(prev => ({
      ...prev,
      custom_questions: prev.custom_questions.filter((_, i) => i !== index)
    }))
  }

  // Update position options when sport changes
  function handleSportChange(sportId) {
    const sport = sports.find(s => s.id === sportId)
    const sportName = sport?.name?.toLowerCase() || ''
    const positions = SPORT_POSITIONS[sportName] || ['No Preference']
    
    setForm(prev => ({
      ...prev,
      sport_id: sportId || null,
      player_fields: {
        ...prev.player_fields,
        position_preference: {
          ...prev.player_fields.position_preference,
          options: positions
        }
      }
    }))
  }

  // Count enabled fields
  function countFields(template) {
    let count = 0
    const sections = ['player_fields', 'parent_fields', 'emergency_fields', 'medical_fields']
    sections.forEach(section => {
      if (template[section]) {
        Object.values(template[section]).forEach(field => {
          if (field.enabled) count++
        })
      }
    })
    return count
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>Registration Templates</h1>
          <p style={{ color: colors.textMuted }}>Create reusable registration forms for different sports and programs</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold" style={{ color: colors.text }}>No templates yet</h3>
          <p className="mb-4" style={{ color: colors.textMuted }}>Create your first registration template to customize what information you collect</p>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div 
              key={template.id} 
              className="rounded-2xl p-5 hover:shadow-lg transition"
              style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {template.sports?.icon && <span className="text-2xl">{template.sports.icon}</span>}
                  <div>
                    <h3 className="font-semibold" style={{ color: colors.text }}>{template.name}</h3>
                    {template.sports?.name && (
                      <p className="text-xs" style={{ color: colors.textMuted }}>{template.sports.name}</p>
                    )}
                  </div>
                </div>
                {template.is_default && (
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500 font-medium">
                    Default
                  </span>
                )}
              </div>
              
              {template.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.textMuted }}>{template.description}</p>
              )}
              
              {/* Field count */}
              <div className="text-xs mb-4" style={{ color: colors.textMuted }}>
                {countFields(template)} fields • {Object.values(template.waivers || {}).filter(w => w.enabled).length} waivers
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(template)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition"
                  style={{ backgroundColor: colors.cardAlt, color: colors.text }}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 rounded-lg transition"
                  style={{ backgroundColor: colors.cardAlt, color: colors.textMuted }}
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => handleDelete(template)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div 
            className="rounded-2xl w-full max-w-4xl my-8"
            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
          >
            {/* Modal Header */}
            <div 
              className="p-6 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl"
              style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}` }}
            >
              <div>
                <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
                  {editingTemplate ? 'Edit Template' : 'New Registration Template'}
                </h2>
                <p style={{ color: colors.textMuted }}>Configure which fields appear on the registration form</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 rounded-lg hover:bg-white/10 transition"
                style={{ color: colors.textMuted }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    Template Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Volleyball Rec League"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    Sport (optional)
                  </label>
                  <select
                    value={form.sport_id || ''}
                    onChange={e => handleSportChange(e.target.value || null)}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
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
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of when to use this template"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ backgroundColor: colors.cardAlt, border: `1px solid ${colors.border}`, color: colors.text }}
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
                    className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${colors.border}` }}
                  >
                    <button
                      onClick={() => toggleSection(sectionKey)}
                      className="w-full px-4 py-3 flex items-center justify-between transition"
                      style={{ backgroundColor: colors.cardAlt }}
                    >
                      <span className="font-medium flex items-center gap-2" style={{ color: colors.text }}>
                        <span>{section.icon}</span> {section.title}
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.border, color: colors.textMuted }}>
                          {enabledCount} fields
                        </span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" style={{ color: colors.textMuted }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: colors.textMuted }} />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {Object.entries(fields).map(([fieldKey, field]) => (
                          <div 
                            key={fieldKey}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ backgroundColor: colors.cardAlt }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleField(sectionKey, fieldKey, 'enabled')}
                                className={`p-1 rounded transition ${field.enabled ? 'text-emerald-400' : ''}`}
                                style={{ color: field.enabled ? undefined : colors.textMuted }}
                              >
                                {field.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                              </button>
                              <input
                                type="text"
                                value={field.label}
                                onChange={e => updateFieldLabel(sectionKey, fieldKey, e.target.value)}
                                className="bg-transparent flex-1 text-sm"
                                style={{ color: field.enabled ? colors.text : colors.textMuted }}
                              />
                            </div>
                            
                            {field.enabled && (
                              <label className="flex items-center gap-2 cursor-pointer ml-4">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={() => toggleField(sectionKey, fieldKey, 'required')}
                                  className="w-4 h-4 rounded accent-yellow-500"
                                />
                                <span className="text-sm" style={{ color: colors.textMuted }}>Required</span>
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
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.border}` }}
              >
                <button
                  onClick={() => toggleSection('waivers')}
                  className="w-full px-4 py-3 flex items-center justify-between transition"
                  style={{ backgroundColor: colors.cardAlt }}
                >
                  <span className="font-medium flex items-center gap-2" style={{ color: colors.text }}>
                    <span>📝</span> Waivers & Agreements
                  </span>
                  {expandedSections.includes('waivers') ? (
                    <ChevronUp className="w-5 h-5" style={{ color: colors.textMuted }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: colors.textMuted }} />
                  )}
                </button>
                
                {expandedSections.includes('waivers') && (
                  <div className="p-4 space-y-4">
                    {Object.entries(form.waivers).map(([key, waiver]) => (
                      <div 
                        key={key} 
                        className="p-4 rounded-lg space-y-3"
                        style={{ backgroundColor: colors.cardAlt }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateWaiver(key, { enabled: !waiver.enabled })}
                              className={`p-1 rounded transition ${waiver.enabled ? 'text-emerald-400' : ''}`}
                              style={{ color: waiver.enabled ? undefined : colors.textMuted }}
                            >
                              {waiver.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                            <input
                              type="text"
                              value={waiver.title}
                              onChange={e => updateWaiver(key, { title: e.target.value })}
                              className="bg-transparent font-medium"
                              style={{ color: waiver.enabled ? colors.text : colors.textMuted }}
                            />
                          </div>
                          
                          {waiver.enabled && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={waiver.required}
                                onChange={() => updateWaiver(key, { required: !waiver.required })}
                                className="w-4 h-4 rounded accent-yellow-500"
                              />
                              <span className="text-sm" style={{ color: colors.textMuted }}>Required</span>
                            </label>
                          )}
                        </div>
                        
                        {waiver.enabled && (
                          <textarea
                            value={waiver.text}
                            onChange={e => updateWaiver(key, { text: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }}
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
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.border}` }}
              >
                <div 
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: colors.cardAlt }}
                >
                  <span className="font-medium flex items-center gap-2" style={{ color: colors.text }}>
                    <span>❓</span> Custom Questions
                  </span>
                  <button
                    onClick={addCustomQuestion}
                    className="text-sm text-yellow-500 hover:text-yellow-400 transition"
                  >
                    + Add Question
                  </button>
                </div>
                
                {form.custom_questions.length > 0 && (
                  <div className="p-4 space-y-3">
                    {form.custom_questions.map((q, idx) => (
                      <div 
                        key={q.id} 
                        className="p-4 rounded-lg space-y-3"
                        style={{ backgroundColor: colors.cardAlt }}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="text"
                            value={q.question}
                            onChange={e => updateCustomQuestion(idx, { question: e.target.value })}
                            placeholder="Enter your question..."
                            className="flex-1 px-3 py-2 rounded-lg"
                            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }}
                          />
                          <select
                            value={q.type}
                            onChange={e => updateCustomQuestion(idx, { type: e.target.value })}
                            className="px-3 py-2 rounded-lg"
                            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }}
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
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }}
                          />
                        )}
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={e => updateCustomQuestion(idx, { required: e.target.checked })}
                            className="w-4 h-4 rounded accent-yellow-500"
                          />
                          <span className="text-sm" style={{ color: colors.textMuted }}>Required</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {form.custom_questions.length === 0 && (
                  <div className="p-4 text-center text-sm" style={{ color: colors.textMuted }}>
                    No custom questions. Click "Add Question" to create one.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div 
              className="p-6 flex items-center justify-between sticky bottom-0 rounded-b-2xl"
              style={{ backgroundColor: colors.card, borderTop: `1px solid ${colors.border}` }}
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={e => setForm({ ...form, is_default: e.target.checked })}
                  className="w-4 h-4 rounded accent-yellow-500"
                />
                <span style={{ color: colors.textSecondary }}>Set as default template</span>
              </label>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl transition"
                  style={{ backgroundColor: colors.cardAlt, color: colors.text }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegistrationTemplatesPage
