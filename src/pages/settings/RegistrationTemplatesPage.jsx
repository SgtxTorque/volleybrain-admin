import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'
import PageShell from '../../components/pages/PageShell'
import { RegistrationTemplateModal, SPORT_POSITIONS, DEFAULT_CONFIG } from './RegistrationTemplateModal'

function RegistrationTemplatesPage({ showToast }) {
  const { organization } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

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
        <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageShell
      title="Registration Templates"
      subtitle="Create reusable registration forms for different sports and programs"
      breadcrumb="Setup › Registration Templates"
      actions={
        <button
          onClick={openNew}
          className="bg-lynx-navy text-white font-bold px-4 py-2.5 rounded-lg hover:brightness-110 flex items-center gap-2 text-r-sm"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      }
    >
      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="rounded-[14px] p-12 text-center bg-white border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{'\u{1F4CB}'}</span>
          </div>
          <h3 className="text-r-lg font-semibold text-slate-900">No templates yet</h3>
          <p className="text-r-sm text-slate-500 mb-4">Create your first registration template to customize what information you collect</p>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-lg bg-lynx-navy text-white font-medium hover:brightness-110 transition"
          >
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className={`rounded-[14px] p-5 hover:shadow-lg transition ${tc.cardBg} border ${tc.border}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {template.sports?.icon && <span className="text-2xl">{template.sports.icon}</span>}
                  <div>
                    <h3 className={`font-semibold ${tc.text}`}>{template.name}</h3>
                    {template.sports?.name && (
                      <p className={`text-xs ${tc.textMuted}`}>{template.sports.name}</p>
                    )}
                  </div>
                </div>
                {template.is_default && (
                  <span className="px-2 py-1 text-xs rounded-full bg-lynx-sky/20 text-lynx-sky font-medium">
                    Default
                  </span>
                )}
              </div>

              {template.description && (
                <p className={`text-sm mb-3 line-clamp-2 ${tc.textMuted}`}>{template.description}</p>
              )}

              {/* Field count */}
              <div className={`text-xs mb-4 ${tc.textMuted}`}>
                {countFields(template)} fields {'\u2022'} {Object.values(template.waivers || {}).filter(w => w.enabled).length} waivers
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(template)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition ${tc.cardBgAlt} ${tc.text}`}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className={`p-2 rounded-lg transition ${tc.cardBgAlt} ${tc.textMuted}`}
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
      <RegistrationTemplateModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingTemplate={editingTemplate}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        saving={saving}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        toggleField={toggleField}
        updateFieldLabel={updateFieldLabel}
        updateWaiver={updateWaiver}
        addCustomQuestion={addCustomQuestion}
        updateCustomQuestion={updateCustomQuestion}
        removeCustomQuestion={removeCustomQuestion}
        handleSportChange={handleSportChange}
        sports={sports}
        tc={tc}
        isDark={isDark}
      />
    </PageShell>
  )
}

export default RegistrationTemplatesPage
