import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { fetchReflectionTemplates, createReflectionTemplate, updateReflectionTemplate, deleteReflectionTemplate } from '../../lib/development-service'
import { X, Plus, GripVertical, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'

const ANSWER_TYPES = [
  { value: 'rating_scale', label: 'Rating (1-5)' },
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Single Select' },
  { value: 'multi_select', label: 'Multi Select' },
]

const DEFAULT_PRE_PRACTICE = {
  title: 'Pre-Practice Check-In',
  reflection_type: 'pre_practice',
  is_default: true,
  questions: [
    { key: 'readiness', prompt: 'How ready do you feel for practice?', answer_type: 'rating_scale', min: 1, max: 5, required: true },
    { key: 'energy', prompt: 'How is your energy level?', answer_type: 'rating_scale', min: 1, max: 5, required: true },
    { key: 'focus_area', prompt: "What's your focus for today?", answer_type: 'text', required: false },
    { key: 'mindset', prompt: 'How is your mindset?', answer_type: 'select', required: true, options: ['Confident', 'Nervous', 'Excited', 'Tired', 'Focused'] },
  ],
}

const DEFAULT_POST_PRACTICE = {
  title: 'Post-Practice Reflection',
  reflection_type: 'post_practice',
  is_default: true,
  questions: [
    { key: 'effort', prompt: 'Rate your effort today', answer_type: 'rating_scale', min: 1, max: 5, required: true },
    { key: 'improvement', prompt: 'What did you improve on?', answer_type: 'text', required: false },
    { key: 'struggle', prompt: 'What was challenging?', answer_type: 'text', required: false },
    { key: 'highlight', prompt: 'Best moment of practice?', answer_type: 'text', required: false },
  ],
}

export default function ReflectionTemplateEditor({ showToast }) {
  const { user, organization } = useAuth()
  const { isDark } = useTheme()
  const orgId = organization?.id

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState(false)

  // Editing state
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('pre_practice')
  const [editQuestions, setEditQuestions] = useState([])

  useEffect(() => {
    if (orgId) loadTemplates()
  }, [orgId])

  async function loadTemplates() {
    setLoading(true)
    const { data } = await fetchReflectionTemplates(orgId)
    setTemplates(data || [])
    setLoading(false)
  }

  async function seedDefaults() {
    setSaving(true)
    for (const defaults of [DEFAULT_PRE_PRACTICE, DEFAULT_POST_PRACTICE]) {
      await createReflectionTemplate({
        org_id: orgId,
        created_by: user.id,
        ...defaults,
      })
    }
    await loadTemplates()
    showToast?.('Default templates created', 'success')
    setSaving(false)
  }

  function startEdit(template) {
    setEditingTemplate(template)
    setEditTitle(template.title)
    setEditType(template.reflection_type)
    setEditQuestions(template.questions || [])
    setExpandedId(template.id)
  }

  function startNew() {
    setEditingTemplate({ id: 'new' })
    setEditTitle('')
    setEditType('pre_practice')
    setEditQuestions([])
    setExpandedId('new')
  }

  function cancelEdit() {
    setEditingTemplate(null)
    setExpandedId(null)
  }

  function addQuestion() {
    setEditQuestions(prev => [...prev, {
      key: `q_${Date.now()}`,
      prompt: '',
      answer_type: 'text',
      required: false,
      options: [],
    }])
  }

  function updateQuestion(index, field, value) {
    setEditQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q))
  }

  function removeQuestion(index) {
    setEditQuestions(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!editTitle.trim()) return
    setSaving(true)

    const payload = {
      title: editTitle.trim(),
      reflection_type: editType,
      questions: editQuestions,
    }

    if (editingTemplate.id === 'new') {
      payload.org_id = orgId
      payload.created_by = user.id
      const { error } = await createReflectionTemplate(payload)
      if (error) { showToast?.('Failed to create template', 'error'); setSaving(false); return }
      showToast?.('Template created', 'success')
    } else {
      const { error } = await updateReflectionTemplate(editingTemplate.id, payload)
      if (error) { showToast?.('Failed to update template', 'error'); setSaving(false); return }
      showToast?.('Template updated', 'success')
    }

    cancelEdit()
    await loadTemplates()
    setSaving(false)
  }

  async function handleDelete(templateId) {
    if (!confirm('Delete this reflection template?')) return
    const { error } = await deleteReflectionTemplate(templateId)
    if (error) { showToast?.('Failed to delete', 'error'); return }
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    if (expandedId === templateId) cancelEdit()
    showToast?.('Template deleted', 'success')
  }

  const textColor = isDark ? 'white' : '#10284C'
  const mutedColor = isDark ? '#64748B' : '#94A3B8'
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#E8ECF2'
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textColor }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>Reflection Templates</h3>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <button onClick={seedDefaults} disabled={saving}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isDark ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.06]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              Load Defaults
            </button>
          )}
          <button onClick={startNew}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition hover:opacity-90"
            style={{ background: 'var(--accent-primary)' }}>
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>
      </div>

      {/* Template list */}
      {templates.length === 0 && !editingTemplate ? (
        <div className={`text-center py-8 rounded-[14px] border-2 border-dashed ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            No reflection templates yet. Load defaults or create a new one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(template => {
            const isEditing = editingTemplate?.id === template.id
            const isExpanded = expandedId === template.id
            return (
              <div key={template.id} className={`rounded-[14px] border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => isEditing ? null : (isExpanded ? setExpandedId(null) : setExpandedId(template.id))}>
                  <div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{template.title}</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {template.reflection_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · {(template.questions || []).length} questions
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isEditing && (
                      <button onClick={e => { e.stopPropagation(); startEdit(template) }}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                          isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-slate-50'
                        }`}>Edit</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); handleDelete(template.id) }}
                      className="p-1 rounded-md transition hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: mutedColor }} /> : <ChevronDown className="w-4 h-4" style={{ color: mutedColor }} />}
                  </div>
                </div>

                {isExpanded && !isEditing && (
                  <div className="px-4 pb-4 space-y-2">
                    {(template.questions || []).map((q, i) => (
                      <div key={q.key || i} className={`px-3 py-2 rounded-lg text-xs ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{i + 1}. {q.prompt}</span>
                        <span className={`ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({q.answer_type.replace(/_/g, ' ')})</span>
                        {q.required && <span className="ml-1 text-red-400">*</span>}
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${border}` }}>
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div>
                        <label className="text-[10px] font-bold mb-1 block" style={{ color: mutedColor }}>Title</label>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold mb-1 block" style={{ color: mutedColor }}>Type</label>
                        <select value={editType} onChange={e => setEditType(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                          <option value="pre_practice">Pre-Practice</option>
                          <option value="post_practice">Post-Practice</option>
                        </select>
                      </div>
                    </div>

                    {editQuestions.map((q, i) => (
                      <div key={q.key || i} className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Q{i + 1}</span>
                          <input type="text" value={q.prompt} onChange={e => updateQuestion(i, 'prompt', e.target.value)}
                            placeholder="Question text..." className="flex-1 px-2 py-1.5 rounded-md text-xs outline-none" style={inputStyle} />
                          <select value={q.answer_type} onChange={e => updateQuestion(i, 'answer_type', e.target.value)}
                            className="px-2 py-1.5 rounded-md text-[10px] outline-none" style={inputStyle}>
                            {ANSWER_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: mutedColor }}>
                            <input type="checkbox" checked={q.required} onChange={e => updateQuestion(i, 'required', e.target.checked)} />
                            Req
                          </label>
                          <button onClick={() => removeQuestion(i)} className="p-1 hover:bg-red-500/10 rounded">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                        {(q.answer_type === 'select' || q.answer_type === 'multi_select') && (
                          <input type="text" value={(q.options || []).join(', ')}
                            onChange={e => updateQuestion(i, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="Options (comma-separated)"
                            className="w-full px-2 py-1.5 rounded-md text-[10px] outline-none" style={inputStyle} />
                        )}
                      </div>
                    ))}

                    <button onClick={addQuestion}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                      <Plus className="w-3 h-3" /> Add Question
                    </button>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button onClick={cancelEdit}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Cancel
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--accent-primary)' }}>
                        {saving ? 'Saving...' : <><Save className="w-3 h-3" /> Save</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* New template form */}
          {editingTemplate?.id === 'new' && (
            <div className={`rounded-[14px] border p-4 space-y-3 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: mutedColor }}>Title</label>
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    placeholder="Template title" className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: mutedColor }}>Type</label>
                  <select value={editType} onChange={e => setEditType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                    <option value="pre_practice">Pre-Practice</option>
                    <option value="post_practice">Post-Practice</option>
                  </select>
                </div>
              </div>

              {editQuestions.map((q, i) => (
                <div key={q.key || i} className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Q{i + 1}</span>
                    <input type="text" value={q.prompt} onChange={e => updateQuestion(i, 'prompt', e.target.value)}
                      placeholder="Question text..." className="flex-1 px-2 py-1.5 rounded-md text-xs outline-none" style={inputStyle} />
                    <select value={q.answer_type} onChange={e => updateQuestion(i, 'answer_type', e.target.value)}
                      className="px-2 py-1.5 rounded-md text-[10px] outline-none" style={inputStyle}>
                      {ANSWER_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                    </select>
                    <button onClick={() => removeQuestion(i)} className="p-1 hover:bg-red-500/10 rounded">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={addQuestion}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                <Plus className="w-3 h-3" /> Add Question
              </button>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={cancelEdit} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--accent-primary)' }}>
                  {saving ? 'Saving...' : <><Save className="w-3 h-3" /> Create</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
