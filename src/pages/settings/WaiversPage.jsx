import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'

// ═════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════
const ALL_SPORTS = [
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
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

const TYPE_META = {
  standard: { icon: '📋', label: 'Standard', color: 'blue' },
  sport_specific: { icon: '🏆', label: 'Sport-Specific', color: 'purple' },
  adhoc: { icon: '📨', label: 'Ad-Hoc', color: 'amber' },
}

function getSportById(id) {
  return ALL_SPORTS.find(s => s.id === id) || null
}

function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  if (s < 604800) return Math.floor(s / 86400) + 'd ago'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ═════════════════════════════════════════════
// WAIVER MANAGER PAGE
// ═════════════════════════════════════════════
function WaiversPage({ showToast }) {
  const { organization, profile } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editHistory, setEditHistory] = useState([])
  const [signatureStats, setSignatureStats] = useState({})
  const [view, setView] = useState('templates')
  const [dbReady, setDbReady] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Filters
  const [filterType, setFilterType] = useState('all')
  const [filterSport, setFilterSport] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Org sports
  const enabledSports = (organization?.settings?.enabled_sports || ['volleyball']).map(id => getSportById(id)).filter(Boolean)

  useEffect(() => {
    if (organization?.id) loadTemplates()
  }, [organization?.id])

  useEffect(() => {
    if (selectedTemplate?.id && !selectedTemplate._legacy) {
      loadEditHistory(selectedTemplate.id)
      loadSignatureStats(selectedTemplate.id)
    }
  }, [selectedTemplate?.id])

  // ── Data Loading ──────────────────────────
  async function loadTemplates() {
    setLoading(true)
    const { data, error } = await supabase
      .from('waiver_templates')
      .select('*')
      .eq('organization_id', organization.id)
      .order('sort_order', { ascending: true })
    
    if (error) {
      setDbReady(false)
      const legacyWaivers = organization?.settings?.waivers || {}
      const fallback = Object.entries(legacyWaivers).filter(([_, v]) => v).map(([key, content], i) => ({
        id: `legacy-${key}`,
        name: key === 'liability' ? 'Liability Waiver' : key === 'photo' ? 'Photo/Video Release' : 'Code of Conduct',
        content, type: 'standard', is_required: true, is_active: true, sort_order: i, version: 1, _legacy: true,
      }))
      setTemplates(fallback)
      if (fallback.length > 0) setSelectedTemplate(fallback[0])
    } else {
      setDbReady(true)
      setTemplates(data || [])
      if (data?.length > 0 && !selectedTemplate) setSelectedTemplate(data[0])
    }
    setLoading(false)
  }

  async function loadEditHistory(templateId) {
    const { data } = await supabase.from('waiver_edit_history').select('*')
      .eq('waiver_template_id', templateId).order('created_at', { ascending: false }).limit(20)
    setEditHistory(data || [])
  }

  async function loadSignatureStats(templateId) {
    const { data: sigs } = await supabase.from('waiver_signatures').select('id, status')
      .eq('waiver_template_id', templateId)
    const signed = (sigs || []).filter(s => s.status === 'signed').length
    setSignatureStats({ signed, total: sigs?.length || 0 })
  }

  // ── CRUD ──────────────────────────────────
  async function createTemplate(templateData) {
    const { data, error } = await supabase.from('waiver_templates').insert({
      organization_id: organization.id, ...templateData,
      last_edited_by: profile?.id, sort_order: templates.length,
    }).select().single()
    
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    
    // Log creation in history
    await supabase.from('waiver_edit_history').insert({
      waiver_template_id: data.id, edited_by: profile?.id,
      edited_by_name: profile?.full_name || profile?.email || 'Admin',
      version: 1, change_summary: 'Created waiver template',
    })
    
    showToast('Waiver created!', 'success')
    setShowCreateModal(false)
    loadTemplates()
    setSelectedTemplate(data)
  }

  async function saveTemplate() {
    if (!selectedTemplate || selectedTemplate._legacy) return
    setSaving(true)
    
    const newVersion = (selectedTemplate.version || 1) + 1
    await supabase.from('waiver_edit_history').insert({
      waiver_template_id: selectedTemplate.id, edited_by: profile?.id,
      edited_by_name: profile?.full_name || profile?.email || 'Admin',
      version: selectedTemplate.version || 1, change_summary: 'Updated waiver content',
    })

    const { error } = await supabase.from('waiver_templates').update({
      name: selectedTemplate.name, description: selectedTemplate.description,
      content: selectedTemplate.content, pdf_url: selectedTemplate.pdf_url,
      type: selectedTemplate.type, is_required: selectedTemplate.is_required,
      is_active: selectedTemplate.is_active, requires_signature: selectedTemplate.requires_signature,
      sport_id: selectedTemplate.sport_id || null, season_id: selectedTemplate.season_id || null,
      org_logo_on_waiver: selectedTemplate.org_logo_on_waiver !== false,
      version: newVersion, last_edited_by: profile?.id,
      last_edited_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', selectedTemplate.id)
    
    if (error) { showToast('Error: ' + error.message, 'error') }
    else {
      showToast('Waiver saved!', 'success')
      setSelectedTemplate({ ...selectedTemplate, version: newVersion, last_edited_at: new Date().toISOString() })
      loadEditHistory(selectedTemplate.id)
    }
    setSaving(false)
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this waiver template? This cannot be undone.')) return
    await supabase.from('waiver_templates').delete().eq('id', id)
    showToast('Waiver deleted', 'success')
    setSelectedTemplate(null)
    loadTemplates()
  }

  async function duplicateTemplate(t) {
    await createTemplate({ name: t.name + ' (Copy)', description: t.description, content: t.content,
      type: t.type, is_required: t.is_required, requires_signature: t.requires_signature, sport_id: t.sport_id })
  }

  // ── File Upload ───────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                     'application/msword', 'image/png', 'image/jpeg']
    if (!allowed.includes(file.type)) {
      showToast('Supported formats: PDF, DOCX, DOC, PNG, JPG', 'error'); return
    }
    if (file.size > 10 * 1024 * 1024) { showToast('Max 10MB', 'error'); return }
    
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${organization.id}/${selectedTemplate?.id || 'new'}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('waivers').upload(fileName, file, { upsert: true })
    if (error) { showToast('Upload failed: ' + error.message, 'error'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('waivers').getPublicUrl(fileName)
    
    if (selectedTemplate) {
      setSelectedTemplate({ ...selectedTemplate, pdf_url: urlData.publicUrl })
    }
    showToast(`${ext.toUpperCase()} uploaded! Remember to save.`, 'success')
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Reorder ───────────────────────────────
  async function moveTemplate(index, direction) {
    const arr = [...templates]; const swap = index + direction
    if (swap < 0 || swap >= arr.length) return
    ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
    setTemplates(arr)
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]._legacy) await supabase.from('waiver_templates').update({ sort_order: i }).eq('id', arr[i].id)
    }
  }

  // ── Filter templates ──────────────────────
  const filtered = templates.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterSport !== 'all' && t.sport_id !== filterSport) return false
    if (filterStatus === 'active' && !t.is_active) return false
    if (filterStatus === 'inactive' && t.is_active) return false
    return true
  })

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* DB Warning */}
      {!dbReady && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <span className="text-xl">⚠️</span>
          <div>
            <p className={`font-semibold text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Migration Required</p>
            <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>Run <code className="font-mono">migration-waiver-system.sql</code> in Supabase.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tc.text}`}>Waiver Management</h1>
          <p className={`${tc.textMuted} mt-1 text-sm`}>Create, edit, and manage waivers • {organization?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {dbReady && (
            <button onClick={() => setShowSendModal(true)}
              className={`px-4 py-2.5 rounded-xl border ${tc.border} ${tc.text} font-medium text-sm hover:opacity-80 transition`}>
              📨 Send Ad-Hoc
            </button>
          )}
          <button onClick={() => dbReady ? setShowCreateModal(true) : showToast('Run the migration first', 'error')}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm">
            + New Waiver
          </button>
        </div>
      </div>

      {/* View Tabs */}
      {dbReady && (
        <div className="flex items-center gap-1">
          {[{ id: 'templates', label: 'Templates', icon: '📋' }, { id: 'signatures', label: 'Signatures', icon: '✍️' }, { id: 'sends', label: 'Send History', icon: '📨' }].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === tab.id ? 'bg-[var(--accent-primary)] text-white' : `${tc.textSecondary} ${tc.hoverBg}`}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ═══ TEMPLATES VIEW ═══ */}
      {view === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT: Filters + List */}
          <div className="space-y-3">
            {/* Filters */}
            {templates.length > 3 && (
              <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-3 space-y-2`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${tc.textMuted}`}>Filters</p>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className={`w-full text-xs px-2 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                  <option value="all">All Types</option>
                  <option value="standard">Standard</option>
                  <option value="sport_specific">Sport-Specific</option>
                  <option value="adhoc">Ad-Hoc</option>
                </select>
                {enabledSports.length > 1 && (
                  <select value={filterSport} onChange={e => setFilterSport(e.target.value)}
                    className={`w-full text-xs px-2 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                    <option value="all">All Sports</option>
                    {enabledSports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                )}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className={`w-full text-xs px-2 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                  <option value="all">Active & Inactive</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            )}

            {/* Template List */}
            {loading ? (
              <div className={`p-8 text-center ${tc.textMuted}`}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6 text-center`}>
                <p className="text-4xl mb-3">📋</p>
                <p className={`font-semibold ${tc.text}`}>{templates.length === 0 ? 'No waivers yet' : 'No matches'}</p>
                {templates.length === 0 && (
                  <button onClick={() => setShowCreateModal(true)} className="mt-4 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium">+ Create Waiver</button>
                )}
              </div>
            ) : (
              filtered.map((t, idx) => {
                const sport = getSportById(t.sport_id)
                const typeMeta = TYPE_META[t.type] || TYPE_META.standard
                return (
                  <div key={t.id} onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer group ${
                      selectedTemplate?.id === t.id
                        ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50'
                        : `${tc.cardBg} ${tc.border} hover:border-[var(--accent-primary)]/30`
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm truncate ${selectedTemplate?.id === t.id ? tc.text : tc.textSecondary}`}>{t.name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {/* Type badge */}
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>{typeMeta.icon} {typeMeta.label}</span>
                          {/* Sport badge */}
                          {sport && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'
                            }`}>{sport.icon} {sport.name}</span>
                          )}
                          {/* Required badge */}
                          {t.is_required && <span className="text-[9px] font-bold uppercase text-red-500">Required</span>}
                          {!t.is_active && <span className="text-[9px] font-bold uppercase text-amber-500">Inactive</span>}
                          {t._legacy && <span className="text-[9px] font-bold uppercase text-orange-500">Legacy</span>}
                          {t.pdf_url && <span className="text-[9px]">📎</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        {idx > 0 && <button onClick={e => { e.stopPropagation(); moveTemplate(idx, -1) }} className={`text-xs ${tc.textMuted}`}>▲</button>}
                        {idx < filtered.length - 1 && <button onClick={e => { e.stopPropagation(); moveTemplate(idx, 1) }} className={`text-xs ${tc.textMuted}`}>▼</button>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* RIGHT: Editor */}
          {selectedTemplate ? (
            <div className="lg:col-span-3 space-y-4">
              {/* Header Card */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <input value={selectedTemplate.name || ''}
                      onChange={e => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      className={`text-xl font-bold ${tc.text} bg-transparent border-none outline-none w-full`}
                      placeholder="Waiver name" disabled={selectedTemplate._legacy} />
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`text-xs ${tc.textMuted}`}>v{selectedTemplate.version || 1}</span>
                      {signatureStats.signed !== undefined && !selectedTemplate._legacy && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                          {signatureStats.signed} signed
                        </span>
                      )}
                    </div>
                    {/* ── Edit Fingerprint ── */}
                    {selectedTemplate.last_edited_at && (
                      <div className={`mt-2 flex items-center gap-2 text-xs ${tc.textMuted}`}>
                        <span>✏️</span>
                        <span>
                          Last edited {editHistory[0]?.edited_by_name ? `by ${editHistory[0].edited_by_name}` : ''} on {fullDate(selectedTemplate.last_edited_at)}
                        </span>
                      </div>
                    )}
                    {!selectedTemplate.last_edited_at && selectedTemplate.created_at && (
                      <div className={`mt-2 flex items-center gap-2 text-xs ${tc.textMuted}`}>
                        <span>📅</span>
                        <span>Created {fullDate(selectedTemplate.created_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!selectedTemplate._legacy && (
                      <>
                        <button onClick={() => setShowPreview(true)}
                          className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} text-sm`} title="Preview">👁️</button>
                        <button onClick={() => duplicateTemplate(selectedTemplate)}
                          className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} text-sm`} title="Duplicate">📄</button>
                        <button onClick={() => deleteTemplate(selectedTemplate.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm" title="Delete">🗑️</button>
                      </>
                    )}
                    <button onClick={saveTemplate} disabled={saving || selectedTemplate._legacy}
                      className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm disabled:opacity-50">
                      {saving ? 'Saving...' : '💾 Save'}
                    </button>
                  </div>
                </div>

                {/* Settings Row */}
                {!selectedTemplate._legacy && (
                  <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-dashed" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                    {[
                      { key: 'is_required', label: 'Required' },
                      { key: 'is_active', label: 'Active' },
                      { key: 'requires_signature', label: 'Requires Signature' },
                      { key: 'org_logo_on_waiver', label: 'Branded' },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedTemplate[opt.key] !== false}
                          onChange={e => setSelectedTemplate({ ...selectedTemplate, [opt.key]: e.target.checked })}
                          className="w-4 h-4 rounded accent-[var(--accent-primary)]" />
                        <span className={`text-sm ${tc.text}`}>{opt.label}</span>
                      </label>
                    ))}
                    
                    <div className="ml-auto flex items-center gap-3">
                      {/* Type selector */}
                      <select value={selectedTemplate.type || 'standard'}
                        onChange={e => setSelectedTemplate({ ...selectedTemplate, type: e.target.value, sport_id: e.target.value !== 'sport_specific' ? null : selectedTemplate.sport_id })}
                        className={`text-sm px-3 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                        <option value="standard">📋 Standard</option>
                        <option value="sport_specific">🏆 Sport-Specific</option>
                        <option value="adhoc">📨 Ad-Hoc</option>
                      </select>
                      {/* Sport selector - only when sport_specific */}
                      {selectedTemplate.type === 'sport_specific' && (
                        <select value={selectedTemplate.sport_id || ''}
                          onChange={e => setSelectedTemplate({ ...selectedTemplate, sport_id: e.target.value || null })}
                          className={`text-sm px-3 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                          <option value="">Select sport...</option>
                          {enabledSports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Content: Text Editor + File Upload side by side */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${tc.text}`}>Waiver Content</h3>
                  <span className={`text-xs ${tc.textMuted}`}>Type text below, upload a file, or both</span>
                </div>

                {/* File Upload Zone */}
                <div className={`mb-4 border-2 border-dashed ${tc.border} rounded-xl p-4 ${selectedTemplate.pdf_url ? '' : 'cursor-pointer hover:border-[var(--accent-primary)]/50'} transition`}
                  onClick={() => !selectedTemplate.pdf_url && !selectedTemplate._legacy && fileInputRef.current?.click()}>
                  {selectedTemplate.pdf_url ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📎</span>
                        <div>
                          <p className={`font-medium text-sm ${tc.text}`}>File Attached</p>
                          <a href={selectedTemplate.pdf_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[var(--accent-primary)] hover:underline">
                            View uploaded file →
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                          className={`text-xs px-3 py-1 rounded-lg border ${tc.border} ${tc.text}`}>Replace</button>
                        <button onClick={e => { e.stopPropagation(); setSelectedTemplate({ ...selectedTemplate, pdf_url: null }) }}
                          className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-500/10">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      {uploading ? (
                        <p className={`text-sm ${tc.textMuted}`}>Uploading...</p>
                      ) : (
                        <>
                          <p className={`text-sm font-medium ${tc.textSecondary}`}>📤 Click to upload a file</p>
                          <p className={`text-xs ${tc.textMuted} mt-1`}>PDF, DOCX, DOC, PNG, JPG • Max 10MB</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />

                {/* Text Content */}
                <textarea value={selectedTemplate.content || ''}
                  onChange={e => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                  className={`w-full min-h-[350px] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-3 resize-y text-sm leading-relaxed`}
                  placeholder="Enter waiver text here...&#10;&#10;This text will be displayed to parents during registration and when signing waivers."
                  disabled={selectedTemplate._legacy} />
              </div>

              {/* Admin Notes */}
              {!selectedTemplate._legacy && (
                <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>Admin Notes (internal only)</label>
                  <input value={selectedTemplate.description || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`}
                    placeholder="e.g. Updated liability language for 2026 spring season" />
                </div>
              )}

              {/* Edit History Timeline */}
              {editHistory.length > 0 && (
                <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                  <h3 className={`text-sm font-bold ${tc.text} mb-3`}>📜 Edit History</h3>
                  <div className="space-y-3 relative">
                    {/* Timeline line */}
                    <div className={`absolute left-[7px] top-2 bottom-2 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    {editHistory.map(h => (
                      <div key={h.id} className="flex items-start gap-3 relative">
                        <div className={`w-[15px] h-[15px] rounded-full border-2 shrink-0 z-10 ${
                          isDark ? 'bg-slate-900 border-slate-600' : 'bg-white border-slate-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${tc.text}`}>
                            <span className="font-medium">{h.edited_by_name || 'Admin'}</span>
                            <span className={` ${tc.textMuted}`}> — {h.change_summary || 'Updated content'}</span>
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>v{h.version} • {fullDate(h.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : templates.length > 0 ? (
            <div className={`lg:col-span-3 ${tc.cardBg} border ${tc.border} rounded-2xl p-10 text-center`}>
              <p className="text-4xl mb-3">👈</p>
              <p className={`font-medium ${tc.text}`}>Select a waiver to edit</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ═══ SIGNATURES VIEW ═══ */}
      {view === 'signatures' && <SignaturesView tc={tc} isDark={isDark} organization={organization} selectedSeason={selectedSeason} />}
      {view === 'sends' && <SendHistoryView tc={tc} isDark={isDark} organization={organization} />}

      {/* MODALS */}
      {showCreateModal && <CreateWaiverModal tc={tc} isDark={isDark} onClose={() => setShowCreateModal(false)} onCreate={createTemplate} enabledSports={enabledSports} />}
      {showSendModal && <SendAdhocModal tc={tc} isDark={isDark} organization={organization} templates={templates.filter(t => t.is_active && !t._legacy)} showToast={showToast} onClose={() => setShowSendModal(false)} />}
      {showPreview && selectedTemplate && <WaiverPreviewModal tc={tc} isDark={isDark} template={selectedTemplate} organization={organization} onClose={() => setShowPreview(false)} />}
    </div>
  )
}

// ═════════════════════════════════════════════
// BRANDED WAIVER PREVIEW MODAL (Letterhead)
// ═════════════════════════════════════════════
function WaiverPreviewModal({ tc, isDark, template, organization, onClose }) {
  const sport = getSportById(template.sport_id)
  const showLogo = template.org_logo_on_waiver !== false
  const isPdf = template.pdf_url?.toLowerCase().endsWith('.pdf')
  const isImage = template.pdf_url && /\.(png|jpg|jpeg|gif|webp)$/i.test(template.pdf_url)
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#f97316'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Preview Admin Bar */}
        <div className={`px-5 py-2.5 flex items-center justify-between ${tc.cardBg} rounded-t-2xl`}>
          <span className="text-xs font-medium text-slate-300">👁️ Preview — How parents will see this waiver</span>
          <button onClick={onClose} className="text-lg text-slate-400 hover:text-white">×</button>
        </div>

        {/* ═══ LETTERHEAD TOP BAR ═══ */}
        <div style={{ background: accent }} className="h-2" />
        
        {/* Letterhead Header */}
        <div className="px-8 pt-6 pb-5" style={{ borderBottom: `3px solid ${accent}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showLogo && organization?.logo_url && (
                <img src={organization.logo_url} alt="" className="h-14 w-14 object-contain" />
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                  {organization?.name || 'Organization'}
                </h1>
                {sport && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: accent }}>
                    {sport.icon} {sport.name} Program
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Official Document</p>
              <p className="text-xs text-slate-500 mt-0.5">v{template.version || 1} • {dateStr}</p>
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="px-8 py-6" style={{ fontFamily: 'Georgia, serif' }}>
          {/* Waiver Title */}
          <h2 className="text-lg font-bold text-center text-slate-800 mb-1">{template.name}</h2>
          {template.is_required && (
            <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: accent }}>
              — Required —
            </p>
          )}
          {!template.is_required && <div className="mb-6" />}

          {/* Embedded Document — PDF viewer or image inline */}
          {template.pdf_url && isPdf && (
            <div className="mb-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${accent}30` }}>
              <iframe src={template.pdf_url} className="w-full" style={{ height: '500px' }} title="Waiver Document" />
            </div>
          )}
          {template.pdf_url && isImage && (
            <div className="mb-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${accent}30` }}>
              <img src={template.pdf_url} alt="Waiver Document" className="w-full object-contain" />
            </div>
          )}
          {template.pdf_url && !isPdf && !isImage && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">📎 Attached document: <a href={template.pdf_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: accent }}>Download</a></p>
            </div>
          )}

          {/* Waiver Text Content */}
          {template.content && (
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm mb-8">
              {template.content}
            </div>
          )}
          {!template.content && !template.pdf_url && (
            <div className="text-slate-400 italic text-center text-sm mb-8">(No content yet)</div>
          )}

          {/* ═══ ELECTRONIC SIGNATURE SECTION ═══ */}
          {template.requires_signature !== false && (
            <div className="mt-8">
              <div className="h-px bg-slate-200 mb-6" />
              
              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3 mb-5 p-4 rounded-lg" style={{ backgroundColor: `${accent}08`, border: `1px solid ${accent}20` }}>
                <div className="w-5 h-5 mt-0.5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  I, the undersigned parent/guardian, have read and agree to the terms outlined above. 
                  By checking this box, I am providing my electronic signature, which is legally equivalent to a handwritten signature.
                </p>
              </div>

              {/* Signature Fields */}
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: accent }}>Parent / Guardian</p>
                  <div className="pb-2 h-8 flex items-end" style={{ borderBottom: `2px solid ${accent}40` }}>
                    <span className="text-sm text-slate-400 italic">Jane Smith</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: accent }}>Signature</p>
                  <div className="pb-2 h-8 flex items-end" style={{ borderBottom: `2px solid ${accent}40` }}>
                    <span className="text-sm italic text-slate-400" style={{ fontFamily: 'cursive' }}>Jane Smith</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: accent }}>Date</p>
                  <div className="pb-2 h-8 flex items-end" style={{ borderBottom: `2px solid ${accent}40` }}>
                    <span className="text-sm text-slate-400">{dateStr}</span>
                  </div>
                </div>
              </div>

              {/* Electronic Fingerprint */}
              <div className="mt-5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-[10px] text-emerald-700 font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  ✅ Electronically signed by Jane Smith on {dateStr} at {timeStr} • IP: 192.168.x.x • {organization?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ═══ LETTERHEAD FOOTER ═══ */}
        <div className="px-8 py-3 flex items-center justify-between" style={{ borderTop: `3px solid ${accent}`, backgroundColor: '#fafafa' }}>
          <p className="text-[10px] text-slate-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {organization?.name} • {template.is_required ? 'Required Document' : 'Optional Document'}
          </p>
          <p className="text-[10px] text-slate-400" style={{ fontFamily: 'system-ui, sans-serif' }}>
            v{template.version || 1} • Powered by Lynx
          </p>
        </div>
        <div style={{ background: accent }} className="h-2 rounded-b-2xl" />
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════
// CREATE WAIVER MODAL (with file upload)
// ═════════════════════════════════════════════
function CreateWaiverModal({ tc, isDark, onClose, onCreate, enabledSports }) {
  const { organization } = useAuth()
  const [form, setForm] = useState({ name: '', type: 'standard', is_required: true, requires_signature: true, content: '', sport_id: null, pdf_url: null })
  const [uploading, setUploading] = useState(false)
  const [contentMode, setContentMode] = useState('text') // 'text' | 'upload'
  const createFileRef = useRef(null)

  const presets = [
    { name: 'Liability Waiver', content: 'I understand that participation in sports activities involves inherent risks including but not limited to injury, illness, or property damage. I voluntarily assume all risks associated with participation and release the organization, its officers, coaches, and volunteers from any and all claims arising from participation.\n\nI acknowledge that my child is physically fit to participate and has no medical conditions that would prevent safe participation unless otherwise disclosed.\n\nBy signing below, I agree to these terms and conditions.' },
    { name: 'Photo/Media Release', content: 'I grant permission for the organization to photograph, video record, and use the likeness of my child in connection with team activities, events, marketing materials, social media, and website content.\n\nI understand that these images may be used for promotional purposes and I waive any right to inspect or approve the use of these materials.' },
    { name: 'Code of Conduct', content: 'Players and parents/guardians agree to:\n\n• Treat all players, coaches, officials, and spectators with respect\n• Follow all rules and guidelines set by coaches and league administrators\n• Demonstrate good sportsmanship at all times\n• Refrain from using abusive or inappropriate language\n• Support and encourage all team members\n• Respect facility rules and property\n\nViolation of this code may result in suspension or removal from the program.' },
    { name: 'Medical Authorization', content: 'In the event of a medical emergency, I authorize the coaches and staff to seek and obtain emergency medical treatment for my child.\n\nI understand that every effort will be made to contact me before treatment, but in the event that I cannot be reached, I give consent for necessary medical procedures.\n\nI agree to be financially responsible for any medical treatment provided.' },
    { name: 'Concussion Protocol', content: 'I have been provided information about the signs and symptoms of concussions and head injuries.\n\nI understand that if my child shows any signs of a concussion during practice or competition, they will be immediately removed from play and will not be allowed to return until cleared by a licensed healthcare provider.' },
  ]

  async function handleCreateUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/png', 'image/jpeg']
    if (!allowed.includes(file.type)) return
    if (file.size > 10 * 1024 * 1024) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${organization.id}/new-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('waivers').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('waivers').getPublicUrl(fileName)
      setForm({ ...form, pdf_url: urlData.publicUrl })
    }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${tc.text}`}>Create Waiver Template</h2>
          <button onClick={onClose} className={`${tc.textMuted} text-xl`}>×</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Presets */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>Quick Start Templates</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button key={p.name} onClick={() => { setForm({ ...form, name: p.name, content: p.content }); setContentMode('text') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${tc.border} ${tc.text} hover:bg-[var(--accent-primary)]/10 transition`}>{p.name}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Waiver Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`} placeholder="e.g. Liability Waiver" />
          </div>

          {/* Type + Sport + Required */}
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[140px]">
              <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, sport_id: e.target.value !== 'sport_specific' ? null : form.sport_id })}
                className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`}>
                <option value="standard">📋 Standard</option>
                <option value="sport_specific">🏆 Sport-Specific</option>
                <option value="adhoc">📨 Ad-Hoc</option>
              </select>
            </div>
            {form.type === 'sport_specific' && (
              <div className="flex-1 min-w-[140px]">
                <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Sport</label>
                <select value={form.sport_id || ''} onChange={e => setForm({ ...form, sport_id: e.target.value || null })}
                  className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`}>
                  <option value="">Select sport...</option>
                  {enabledSports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <input type="checkbox" checked={form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })} className="w-4 h-4 accent-[var(--accent-primary)]" />
              <span className={`text-sm ${tc.text}`}>Required</span>
            </label>
          </div>

          {/* Content Mode Toggle */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <button onClick={() => setContentMode('text')}
                className={`text-sm font-medium pb-1 border-b-2 transition ${contentMode === 'text' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : `border-transparent ${tc.textMuted}`}`}>
                ✏️ Type Content
              </button>
              <button onClick={() => setContentMode('upload')}
                className={`text-sm font-medium pb-1 border-b-2 transition ${contentMode === 'upload' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : `border-transparent ${tc.textMuted}`}`}>
                📤 Upload File
              </button>
            </div>
            
            {contentMode === 'text' ? (
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                className={`w-full min-h-[200px] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-3 text-sm resize-y`}
                placeholder="Enter waiver text..." />
            ) : (
              <div>
                {form.pdf_url ? (
                  <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'} rounded-xl p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <p className={`font-medium text-sm ${tc.text}`}>File Uploaded</p>
                        <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent-primary)] hover:underline">View →</a>
                      </div>
                    </div>
                    <button onClick={() => setForm({ ...form, pdf_url: null })} className="text-xs text-red-500">Remove</button>
                  </div>
                ) : (
                  <div onClick={() => createFileRef.current?.click()}
                    className={`border-2 border-dashed ${tc.border} rounded-xl p-8 text-center cursor-pointer hover:border-[var(--accent-primary)]/50 transition`}>
                    {uploading ? <p className={`text-sm ${tc.textMuted}`}>Uploading...</p> : (
                      <>
                        <p className="text-3xl mb-2">📤</p>
                        <p className={`text-sm font-medium ${tc.textSecondary}`}>Click to upload</p>
                        <p className={`text-xs ${tc.textMuted} mt-1`}>PDF, DOCX, DOC, PNG, JPG • Max 10MB</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={createFileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" onChange={handleCreateUpload} className="hidden" />
              </div>
            )}
          </div>
        </div>
        <div className={`p-5 border-t ${tc.border} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-xl border ${tc.border} ${tc.text} font-medium text-sm`}>Cancel</button>
          <button onClick={() => onCreate(form)} disabled={!form.name}
            className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm disabled:opacity-50">Create Waiver</button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════
// SIGNATURES VIEW
// ═════════════════════════════════════════════
function SignaturesView({ tc, isDark, organization, selectedSeason }) {
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { loadSigs() }, [organization?.id, selectedSeason?.id])
  async function loadSigs() {
    setLoading(true)
    let q = supabase.from('waiver_signatures')
      .select('*, waiver_templates(name, type), players(first_name, last_name, parent_name)')
      .eq('organization_id', organization.id).order('signed_at', { ascending: false }).limit(100)
    if (selectedSeason?.id) q = q.eq('season_id', selectedSeason.id)
    const { data } = await q
    setSignatures(data || [])
    setLoading(false)
  }
  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
      <div className={`p-5 border-b ${tc.border}`}>
        <h3 className={`font-bold ${tc.text}`}>✍️ Signed Waivers</h3>
        <p className={`text-sm ${tc.textMuted}`}>{signatures.length} signatures</p>
      </div>
      {loading ? <div className={`p-10 text-center ${tc.textMuted}`}>Loading...</div>
       : signatures.length === 0 ? (
        <div className={`p-10 text-center ${tc.textMuted}`}><p className="text-3xl mb-2">✍️</p><p>No signatures yet.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
              {['Player', 'Waiver', 'Signed By', 'Date', 'Status'].map(h => (
                <th key={h} className={`text-left px-4 py-3 font-semibold ${tc.textMuted} text-xs uppercase`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {signatures.map(sig => (
                <tr key={sig.id} className={`border-t ${tc.border} ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                  <td className={`px-4 py-3 ${tc.text} font-medium`}>{sig.players?.first_name} {sig.players?.last_name}</td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>{sig.waiver_templates?.name || '—'}</td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>{sig.signed_by_name}{sig.signed_by_relation && <span className={`text-xs ${tc.textMuted} ml-1`}>({sig.signed_by_relation})</span>}</td>
                  <td className={`px-4 py-3 ${tc.textMuted} text-xs`}>{sig.signed_at ? new Date(sig.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sig.status === 'signed' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-500'}`}>{sig.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════
// SEND HISTORY VIEW
// ═════════════════════════════════════════════
function SendHistoryView({ tc, isDark, organization }) {
  const [sends, setSends] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { load() }, [organization?.id])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('waiver_sends')
      .select('*, waiver_templates(name), players(first_name, last_name)')
      .eq('organization_id', organization.id).order('sent_at', { ascending: false }).limit(50)
    setSends(data || [])
    setLoading(false)
  }
  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
      <div className={`p-5 border-b ${tc.border}`}><h3 className={`font-bold ${tc.text}`}>📨 Send History</h3></div>
      {loading ? <div className={`p-10 text-center ${tc.textMuted}`}>Loading...</div>
       : sends.length === 0 ? (
        <div className={`p-10 text-center ${tc.textMuted}`}><p className="text-3xl mb-2">📨</p><p>No ad-hoc waivers sent yet.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
              {['Waiver', 'Sent To', 'Sent', 'Status'].map(h => (
                <th key={h} className={`text-left px-4 py-3 font-semibold ${tc.textMuted} text-xs uppercase`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sends.map(s => (
                <tr key={s.id} className={`border-t ${tc.border}`}>
                  <td className={`px-4 py-3 ${tc.text}`}>{s.waiver_templates?.name || '—'}</td>
                  <td className={`px-4 py-3 ${tc.textSecondary}`}>{s.players ? `${s.players.first_name} ${s.players.last_name}` : s.sent_to_name}</td>
                  <td className={`px-4 py-3 ${tc.textMuted} text-xs`}>{s.sent_at ? new Date(s.sent_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    s.status === 'signed' ? 'bg-emerald-500/20 text-emerald-600' : s.status === 'opened' ? 'bg-blue-500/20 text-blue-600' : 'bg-amber-500/20 text-amber-600'
                  }`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════
// SEND AD-HOC MODAL
// ═════════════════════════════════════════════
function SendAdhocModal({ tc, isDark, organization, templates, showToast, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [players, setPlayers] = useState([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  useEffect(() => {
    supabase.from('players').select('id, first_name, last_name, parent_email, parent_name')
      .eq('organization_id', organization.id).order('last_name').then(({ data }) => setPlayers(data || []))
  }, [])
  async function handleSend() {
    if (!selectedTemplateId || selectedPlayerIds.length === 0) return
    setSending(true)
    const sends = selectedPlayerIds.map(pid => {
      const p = players.find(x => x.id === pid)
      return { waiver_template_id: selectedTemplateId, organization_id: organization.id, player_id: pid, sent_to_email: p?.parent_email, sent_to_name: p?.parent_name, status: 'sent' }
    })
    const { error } = await supabase.from('waiver_sends').insert(sends)
    if (error) showToast('Error: ' + error.message, 'error')
    else { showToast(`Sent to ${selectedPlayerIds.length} player(s)!`, 'success'); onClose() }
    setSending(false)
  }
  const filtered = players.filter(p => `${p.first_name} ${p.last_name} ${p.parent_name || ''}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${tc.border}`}>
          <h2 className={`text-lg font-bold ${tc.text}`}>📨 Send Ad-Hoc Waiver</h2>
          <p className={`text-sm ${tc.textMuted} mt-1`}>Send a waiver to specific players for signature</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Select Waiver</label>
            <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}
              className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`}>
              <option value="">Choose...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Players ({selectedPlayerIds.length})</label>
            <input value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm mb-2`} placeholder="Search..." />
            <div className={`max-h-[250px] overflow-y-auto border ${tc.border} rounded-xl`}>
              {filtered.map(p => (
                <label key={p.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b last:border-b-0 ${tc.border} ${selectedPlayerIds.includes(p.id) ? (isDark ? 'bg-slate-800' : 'bg-blue-50') : ''} hover:bg-[var(--accent-primary)]/5`}>
                  <input type="checkbox" checked={selectedPlayerIds.includes(p.id)}
                    onChange={() => setSelectedPlayerIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="w-4 h-4 accent-[var(--accent-primary)]" />
                  <div>
                    <p className={`text-sm font-medium ${tc.text}`}>{p.first_name} {p.last_name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{p.parent_name || p.parent_email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className={`p-5 border-t ${tc.border} flex justify-between items-center`}>
          <button onClick={() => setSelectedPlayerIds(filtered.map(p => p.id))} className={`text-xs ${tc.textMuted} hover:text-[var(--accent-primary)]`}>Select All</button>
          <div className="flex gap-3">
            <button onClick={onClose} className={`px-5 py-2 rounded-xl border ${tc.border} ${tc.text} font-medium text-sm`}>Cancel</button>
            <button onClick={handleSend} disabled={!selectedTemplateId || selectedPlayerIds.length === 0 || sending}
              className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm disabled:opacity-50">
              {sending ? 'Sending...' : `Send to ${selectedPlayerIds.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { WaiversPage }
