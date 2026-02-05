import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'

// ============================================
// WAIVER MANAGER PAGE
// ============================================
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
  const [editHistory, setEditHistory] = useState([])
  const [signatureStats, setSignatureStats] = useState({})
  const [view, setView] = useState('templates')
  const [dbReady, setDbReady] = useState(true)
  const fileInputRef = useRef(null)

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
      console.warn('waiver_templates table may not exist yet:', error.message)
      setDbReady(false)
      // Fallback: load from legacy org settings
      const legacyWaivers = organization?.settings?.waivers || {}
      const fallback = Object.entries(legacyWaivers)
        .filter(([_, v]) => v)
        .map(([key, content], i) => ({
          id: `legacy-${key}`,
          name: key === 'liability' ? 'Liability Waiver' : key === 'photo' ? 'Photo/Video Release' : 'Code of Conduct',
          content,
          type: 'standard',
          is_required: true,
          is_active: true,
          sort_order: i,
          version: 1,
          _legacy: true,
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
    const { data } = await supabase
      .from('waiver_edit_history')
      .select('*')
      .eq('waiver_template_id', templateId)
      .order('created_at', { ascending: false })
      .limit(10)
    setEditHistory(data || [])
  }

  async function loadSignatureStats(templateId) {
    const { data: sigs } = await supabase
      .from('waiver_signatures')
      .select('id, status')
      .eq('waiver_template_id', templateId)
    const signed = (sigs || []).filter(s => s.status === 'signed').length
    setSignatureStats({ signed, total: sigs?.length || 0 })
  }

  // ── Template CRUD ─────────────────────────
  async function createTemplate(templateData) {
    const { data, error } = await supabase
      .from('waiver_templates')
      .insert({
        organization_id: organization.id,
        ...templateData,
        last_edited_by: profile?.id,
        sort_order: templates.length,
      })
      .select()
      .single()
    
    if (error) {
      showToast('Error creating waiver: ' + error.message, 'error')
      return
    }
    showToast('Waiver template created!', 'success')
    setShowCreateModal(false)
    loadTemplates()
    setSelectedTemplate(data)
  }

  async function saveTemplate() {
    if (!selectedTemplate || selectedTemplate._legacy) return
    setSaving(true)
    
    try {
      await supabase.from('waiver_edit_history').insert({
        waiver_template_id: selectedTemplate.id,
        edited_by: profile?.id,
        edited_by_name: profile?.full_name || profile?.email || 'Admin',
        version: selectedTemplate.version || 1,
        change_summary: 'Updated waiver content',
      })
    } catch (e) { /* non-critical */ }

    const { error } = await supabase
      .from('waiver_templates')
      .update({
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        content: selectedTemplate.content,
        pdf_url: selectedTemplate.pdf_url,
        type: selectedTemplate.type,
        is_required: selectedTemplate.is_required,
        is_active: selectedTemplate.is_active,
        requires_signature: selectedTemplate.requires_signature,
        sport_id: selectedTemplate.sport_id || null,
        season_id: selectedTemplate.season_id || null,
        org_logo_on_waiver: selectedTemplate.org_logo_on_waiver !== false,
        version: (selectedTemplate.version || 1) + 1,
        last_edited_by: profile?.id,
        last_edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTemplate.id)
    
    if (error) {
      showToast('Error saving: ' + error.message, 'error')
    } else {
      showToast('Waiver saved!', 'success')
      setSelectedTemplate({ ...selectedTemplate, version: (selectedTemplate.version || 1) + 1 })
      loadEditHistory(selectedTemplate.id)
    }
    setSaving(false)
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this waiver template? This cannot be undone.')) return
    const { error } = await supabase.from('waiver_templates').delete().eq('id', id)
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast('Waiver deleted', 'success')
      setSelectedTemplate(null)
      loadTemplates()
    }
  }

  async function duplicateTemplate(t) {
    await createTemplate({
      name: t.name + ' (Copy)',
      description: t.description,
      content: t.content,
      type: t.type,
      is_required: t.is_required,
      requires_signature: t.requires_signature,
    })
  }

  // ── PDF Upload ────────────────────────────
  async function handlePdfUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { showToast('Please upload a PDF', 'error'); return }
    if (file.size > 10 * 1024 * 1024) { showToast('Max 10MB', 'error'); return }
    const fileName = `${organization.id}/${selectedTemplate.id}-${Date.now()}.pdf`
    const { error } = await supabase.storage.from('waivers').upload(fileName, file, { upsert: true })
    if (error) { showToast('Upload failed: ' + error.message, 'error'); return }
    const { data: urlData } = supabase.storage.from('waivers').getPublicUrl(fileName)
    setSelectedTemplate({ ...selectedTemplate, pdf_url: urlData.publicUrl })
    showToast('PDF uploaded! Remember to save.', 'success')
  }

  // ── Reorder ───────────────────────────────
  async function moveTemplate(index, direction) {
    const arr = [...templates]
    const swap = index + direction
    if (swap < 0 || swap >= arr.length) return
    ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
    setTemplates(arr)
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]._legacy) await supabase.from('waiver_templates').update({ sort_order: i }).eq('id', arr[i].id)
    }
  }

  const typeIcons = { standard: '📋', sport_specific: '🏆', adhoc: '📨' }
  const typeLabels = { standard: 'Standard', sport_specific: 'Sport-Specific', adhoc: 'Ad-Hoc' }
  function timeAgo(d) {
    if (!d) return ''
    const s = Math.floor((Date.now() - new Date(d)) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return Math.floor(s / 60) + 'm ago'
    if (s < 86400) return Math.floor(s / 3600) + 'h ago'
    if (s < 604800) return Math.floor(s / 86400) + 'd ago'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

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
            <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
              Run the <code className="font-mono">migration-waiver-system.sql</code> in Supabase to enable full waiver management. Showing legacy waivers from org settings.
            </p>
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
              className={`px-4 py-2.5 rounded-xl border ${tc.border} ${tc.text} font-medium text-sm hover:opacity-80 transition flex items-center gap-2`}>
              📨 Send Ad-Hoc
            </button>
          )}
          <button onClick={() => dbReady ? setShowCreateModal(true) : showToast('Run the migration first', 'error')}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:opacity-90 transition">
            + New Waiver
          </button>
        </div>
      </div>

      {/* View Tabs */}
      {dbReady && (
        <div className="flex items-center gap-1">
          {[
            { id: 'templates', label: 'Templates', icon: '📋' },
            { id: 'signatures', label: 'Signatures', icon: '✍️' },
            { id: 'sends', label: 'Send History', icon: '📨' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === tab.id ? 'bg-[var(--accent-primary)] text-white' : `${tc.textSecondary} ${tc.hoverBg}`
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* TEMPLATES VIEW */}
      {view === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT: Template List */}
          <div className="space-y-2">
            {loading ? (
              <div className={`p-8 text-center ${tc.textMuted}`}>Loading...</div>
            ) : templates.length === 0 ? (
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-6 text-center`}>
                <p className="text-4xl mb-3">📋</p>
                <p className={`font-semibold ${tc.text}`}>No waivers yet</p>
                <p className={`text-sm ${tc.textMuted} mt-1`}>Create your first waiver template</p>
                <button onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium">
                  + Create Waiver
                </button>
              </div>
            ) : (
              templates.map((t, idx) => (
                <div key={t.id} onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left p-4 rounded-xl border transition cursor-pointer group ${
                    selectedTemplate?.id === t.id
                      ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50'
                      : `${tc.cardBg} ${tc.border} hover:border-[var(--accent-primary)]/30`
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{typeIcons[t.type] || '📋'}</span>
                      <div className="min-w-0">
                        <p className={`font-medium text-sm truncate ${selectedTemplate?.id === t.id ? tc.text : tc.textSecondary}`}>{t.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.is_required && <span className="text-[10px] font-bold uppercase text-red-500">Required</span>}
                          {t.sports?.name && <span className={`text-[10px] ${tc.textMuted}`}>{t.sports.icon} {t.sports.name}</span>}
                          {!t.is_active && <span className="text-[10px] font-bold uppercase text-amber-500">Inactive</span>}
                          {t._legacy && <span className="text-[10px] font-bold uppercase text-orange-500">Legacy</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      {idx > 0 && <button onClick={e => { e.stopPropagation(); moveTemplate(idx, -1) }} className={`text-xs ${tc.textMuted}`}>▲</button>}
                      {idx < templates.length - 1 && <button onClick={e => { e.stopPropagation(); moveTemplate(idx, 1) }} className={`text-xs ${tc.textMuted}`}>▼</button>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Template Editor */}
          {selectedTemplate ? (
            <div className="lg:col-span-3 space-y-4">
              {/* Editor Header */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 mr-4">
                    <input value={selectedTemplate.name || ''}
                      onChange={e => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      className={`text-xl font-bold ${tc.text} bg-transparent border-none outline-none w-full`}
                      placeholder="Waiver name" disabled={selectedTemplate._legacy} />
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`text-xs ${tc.textMuted}`}>v{selectedTemplate.version || 1} • {typeLabels[selectedTemplate.type] || 'Standard'}</span>
                      {selectedTemplate.last_edited_at && (
                        <span className={`text-xs ${tc.textMuted}`}>Edited {timeAgo(selectedTemplate.last_edited_at)}</span>
                      )}
                      {signatureStats.signed !== undefined && !selectedTemplate._legacy && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                          {signatureStats.signed} signed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedTemplate._legacy && (
                      <>
                        <button onClick={() => duplicateTemplate(selectedTemplate)} className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} text-sm`} title="Duplicate">📄</button>
                        <button onClick={() => deleteTemplate(selectedTemplate.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm" title="Delete">🗑️</button>
                      </>
                    )}
                    <button onClick={saveTemplate} disabled={saving || selectedTemplate._legacy}
                      className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm disabled:opacity-50">
                      {saving ? 'Saving...' : '💾 Save'}
                    </button>
                  </div>
                </div>

                {/* Settings */}
                {!selectedTemplate._legacy && (
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-dashed" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                    {[
                      { key: 'is_required', label: 'Required' },
                      { key: 'is_active', label: 'Active' },
                      { key: 'requires_signature', label: 'Requires Signature' },
                      { key: 'org_logo_on_waiver', label: 'Show Org Logo' },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={selectedTemplate[opt.key] !== false}
                          onChange={e => setSelectedTemplate({ ...selectedTemplate, [opt.key]: e.target.checked })}
                          className="w-4 h-4 rounded accent-[var(--accent-primary)]" />
                        <span className={`text-sm ${tc.text}`}>{opt.label}</span>
                      </label>
                    ))}
                    <select value={selectedTemplate.type || 'standard'}
                      onChange={e => setSelectedTemplate({ ...selectedTemplate, type: e.target.value })}
                      className={`text-sm px-3 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} ml-auto`}>
                      <option value="standard">Standard</option>
                      <option value="sport_specific">Sport-Specific</option>
                      <option value="adhoc">Ad-Hoc</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Content Editor */}
              <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-4 mb-4">
                  <button onClick={() => setSelectedTemplate({ ...selectedTemplate, _editMode: 'text' })}
                    className={`text-sm font-medium pb-1 border-b-2 transition ${
                      selectedTemplate._editMode !== 'pdf' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : `border-transparent ${tc.textMuted}`
                    }`}>✏️ Text Editor</button>
                  {!selectedTemplate._legacy && (
                    <button onClick={() => setSelectedTemplate({ ...selectedTemplate, _editMode: 'pdf' })}
                      className={`text-sm font-medium pb-1 border-b-2 transition ${
                        selectedTemplate._editMode === 'pdf' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : `border-transparent ${tc.textMuted}`
                      }`}>📎 PDF Upload</button>
                  )}
                </div>

                {selectedTemplate._editMode === 'pdf' ? (
                  <div className="space-y-4">
                    {selectedTemplate.pdf_url ? (
                      <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'} rounded-xl p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">📄</span>
                          <div>
                            <p className={`font-medium ${tc.text}`}>PDF Uploaded</p>
                            <a href={selectedTemplate.pdf_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm text-[var(--accent-primary)] hover:underline">View PDF →</a>
                          </div>
                        </div>
                        <button onClick={() => setSelectedTemplate({ ...selectedTemplate, pdf_url: null })}
                          className="text-sm text-red-500 hover:text-red-400">Remove</button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed ${tc.border} rounded-xl p-10 text-center cursor-pointer hover:border-[var(--accent-primary)]/50 transition`}>
                        <p className="text-4xl mb-3">📤</p>
                        <p className={`font-medium ${tc.text}`}>Click to upload a PDF</p>
                        <p className={`text-sm ${tc.textMuted} mt-1`}>Max 10MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </div>
                ) : (
                  <textarea value={selectedTemplate.content || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                    className={`w-full min-h-[400px] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-3 resize-y text-sm leading-relaxed`}
                    placeholder="Enter waiver text..." disabled={selectedTemplate._legacy} />
                )}
              </div>

              {/* Description */}
              {!selectedTemplate._legacy && (
                <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>Admin Notes (internal)</label>
                  <input value={selectedTemplate.description || ''}
                    onChange={e => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`}
                    placeholder="e.g. Updated liability language for 2026" />
                </div>
              )}

              {/* Edit History */}
              {editHistory.length > 0 && (
                <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
                  <h3 className={`text-sm font-bold ${tc.text} mb-3`}>📜 Edit History</h3>
                  <div className="space-y-2">
                    {editHistory.map(h => (
                      <div key={h.id} className={`flex items-center justify-between text-sm ${tc.textMuted}`}>
                        <span>v{h.version} — {h.change_summary || 'Content updated'}</span>
                        <span className="text-xs">{h.edited_by_name} • {timeAgo(h.created_at)}</span>
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

      {/* SIGNATURES VIEW */}
      {view === 'signatures' && <SignaturesView tc={tc} isDark={isDark} organization={organization} selectedSeason={selectedSeason} />}

      {/* SEND HISTORY VIEW */}
      {view === 'sends' && <SendHistoryView tc={tc} isDark={isDark} organization={organization} />}

      {/* MODALS */}
      {showCreateModal && <CreateWaiverModal tc={tc} isDark={isDark} onClose={() => setShowCreateModal(false)} onCreate={createTemplate} />}
      {showSendModal && <SendAdhocModal tc={tc} isDark={isDark} organization={organization} templates={templates.filter(t => t.is_active && !t._legacy)} showToast={showToast} onClose={() => setShowSendModal(false)} />}
    </div>
  )
}

// ============================================
// SIGNATURES VIEW
// ============================================
function SignaturesView({ tc, isDark, organization, selectedSeason }) {
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSignatures() }, [organization?.id, selectedSeason?.id])

  async function loadSignatures() {
    setLoading(true)
    let q = supabase.from('waiver_signatures')
      .select('*, waiver_templates(name, type), players(first_name, last_name, parent_name)')
      .eq('organization_id', organization.id)
      .order('signed_at', { ascending: false })
      .limit(100)
    if (selectedSeason?.id) q = q.eq('season_id', selectedSeason.id)
    const { data, error } = await q
    if (error) console.error('Error:', error)
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
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    sig.status === 'signed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-500'
                  }`}>{sig.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================
// SEND HISTORY VIEW
// ============================================
function SendHistoryView({ tc, isDark, organization }) {
  const [sends, setSends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSends() }, [organization?.id])

  async function loadSends() {
    setLoading(true)
    const { data } = await supabase.from('waiver_sends')
      .select('*, waiver_templates(name), players(first_name, last_name)')
      .eq('organization_id', organization.id)
      .order('sent_at', { ascending: false }).limit(50)
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
                    s.status === 'signed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                    s.status === 'opened' ? 'bg-blue-500/20 text-blue-600' :
                    'bg-amber-500/20 text-amber-600 dark:text-amber-400'
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

// ============================================
// CREATE WAIVER MODAL
// ============================================
function CreateWaiverModal({ tc, isDark, onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', type: 'standard', is_required: true, requires_signature: true, content: '' })

  const presets = [
    { name: 'Liability Waiver', content: 'I understand that participation in sports activities involves inherent risks including but not limited to injury, illness, or property damage. I voluntarily assume all risks associated with participation and release the organization, its officers, coaches, and volunteers from any and all claims arising from participation.\n\nI acknowledge that my child is physically fit to participate and has no medical conditions that would prevent safe participation unless otherwise disclosed.\n\nBy signing below, I agree to these terms and conditions.' },
    { name: 'Photo/Media Release', content: 'I grant permission for the organization to photograph, video record, and use the likeness of my child in connection with team activities, events, marketing materials, social media, and website content.\n\nI understand that these images may be used for promotional purposes and I waive any right to inspect or approve the use of these materials.' },
    { name: 'Code of Conduct', content: 'Players and parents/guardians agree to:\n\n• Treat all players, coaches, officials, and spectators with respect\n• Follow all rules and guidelines set by coaches and league administrators\n• Demonstrate good sportsmanship at all times\n• Refrain from using abusive or inappropriate language\n• Support and encourage all team members\n• Respect facility rules and property\n\nViolation of this code may result in suspension or removal from the program.' },
    { name: 'Medical Authorization', content: 'In the event of a medical emergency, I authorize the coaches and staff to seek and obtain emergency medical treatment for my child.\n\nI understand that every effort will be made to contact me before treatment, but in the event that I cannot be reached, I give consent for necessary medical procedures.\n\nI agree to be financially responsible for any medical treatment provided.' },
    { name: 'Concussion Protocol', content: 'I have been provided information about the signs and symptoms of concussions and head injuries.\n\nI understand that if my child shows any signs of a concussion during practice or competition, they will be immediately removed from play and will not be allowed to return until cleared by a licensed healthcare provider.' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${tc.text}`}>Create Waiver Template</h2>
          <button onClick={onClose} className={`${tc.textMuted} text-xl`}>×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-2`}>Quick Start Templates</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button key={p.name} onClick={() => setForm({ ...form, name: p.name, content: p.content })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${tc.border} ${tc.text} hover:bg-[var(--accent-primary)]/10 transition`}>{p.name}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Waiver Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`} placeholder="e.g. Liability Waiver" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className={`w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-2.5 text-sm`}>
                <option value="standard">Standard</option>
                <option value="sport_specific">Sport-Specific</option>
                <option value="adhoc">Ad-Hoc</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input type="checkbox" checked={form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })} className="w-4 h-4 accent-[var(--accent-primary)]" />
              <span className={`text-sm ${tc.text}`}>Required</span>
            </label>
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Content</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              className={`w-full min-h-[200px] ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'} border ${tc.border} rounded-xl px-4 py-3 text-sm resize-y`} placeholder="Enter waiver text..." />
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

// ============================================
// SEND AD-HOC MODAL
// ============================================
function SendAdhocModal({ tc, isDark, organization, templates, showToast, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [players, setPlayers] = useState([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('players').select('id, first_name, last_name, parent_email, parent_name')
        .eq('organization_id', organization.id).order('last_name')
      setPlayers(data || [])
    }
    load()
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
              <option value="">Choose a waiver...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>Select Players ({selectedPlayerIds.length})</label>
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
