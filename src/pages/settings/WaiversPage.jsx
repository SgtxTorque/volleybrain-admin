import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import PageShell from '../../components/pages/PageShell'
import { WaiverEditor } from './WaiverEditor'
import { CreateWaiverModal, SendAdhocModal } from './WaiverModals'
import { WaiverPreviewModal } from './WaiverPreviewModal'
import { SignaturesView, SendHistoryView } from './WaiverViews'

// -- Constants (shared across split files) --
const ALL_SPORTS = [
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' }, { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'soccer', name: 'Soccer', icon: '⚽' }, { id: 'baseball', name: 'Baseball', icon: '⚾' },
  { id: 'softball', name: 'Softball', icon: '🥎' }, { id: 'football', name: 'Flag Football', icon: '🏈' },
  { id: 'swimming', name: 'Swimming', icon: '🏊' }, { id: 'track', name: 'Track & Field', icon: '🏃' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' }, { id: 'golf', name: 'Golf', icon: '⛳' },
  { id: 'cheer', name: 'Cheerleading', icon: '📣' }, { id: 'gymnastics', name: 'Gymnastics', icon: '🤸' },
]
const TYPE_META = {
  standard: { icon: '📋', label: 'Standard', color: 'blue' },
  sport_specific: { icon: '🏆', label: 'Sport-Specific', color: 'purple' },
  adhoc: { icon: '📨', label: 'Ad-Hoc', color: 'amber' },
}
const VIEW_TABS = [
  { id: 'templates', label: 'Templates', icon: '📋' },
  { id: 'signatures', label: 'Signatures', icon: '✍️' },
  { id: 'sends', label: 'Send History', icon: '📨' },
]

export function getSportById(id) { return ALL_SPORTS.find(s => s.id === id) || null }
export function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  if (s < 604800) return Math.floor(s / 86400) + 'd ago'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
export function fullDate(d) {
  if (!d) return '--'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// -- Main Page Component --
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
  const [filterType, setFilterType] = useState('all')
  const [filterSport, setFilterSport] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const enabledSports = (organization?.settings?.enabled_sports || ['volleyball']).map(id => getSportById(id)).filter(Boolean)
  const selectCls = `w-full text-xs px-2 py-1.5 rounded-lg border ${tc.border} ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`

  useEffect(() => { if (organization?.id) loadTemplates() }, [organization?.id])
  useEffect(() => {
    if (selectedTemplate?.id && !selectedTemplate._legacy) {
      loadEditHistory(selectedTemplate.id)
      loadSignatureStats(selectedTemplate.id)
    }
  }, [selectedTemplate?.id])

  async function loadTemplates() {
    setLoading(true)
    const { data, error } = await supabase.from('waiver_templates').select('*')
      .eq('organization_id', organization.id).order('sort_order', { ascending: true })
    if (error) {
      setDbReady(false)
      const legacyWaivers = organization?.settings?.waivers || {}
      const fallback = Object.entries(legacyWaivers).filter(([_, v]) => v).map(([key, content], i) => ({
        id: `legacy-${key}`, content, type: 'standard', is_required: true, is_active: true, sort_order: i, version: 1, _legacy: true,
        name: key === 'liability' ? 'Liability Waiver' : key === 'photo' ? 'Photo/Video Release' : 'Code of Conduct',
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
    const { data: sigs } = await supabase.from('waiver_signatures').select('id, status').eq('waiver_template_id', templateId)
    const signed = (sigs || []).filter(s => s.status === 'signed').length
    setSignatureStats({ signed, total: sigs?.length || 0 })
  }
  async function createTemplate(templateData) {
    const { data, error } = await supabase.from('waiver_templates').insert({
      organization_id: organization.id, ...templateData, last_edited_by: profile?.id, sort_order: templates.length,
    }).select().single()
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    await supabase.from('waiver_edit_history').insert({
      waiver_template_id: data.id, edited_by: profile?.id,
      edited_by_name: profile?.full_name || profile?.email || 'Admin', version: 1, change_summary: 'Created waiver template',
    })
    showToast('Waiver created!', 'success')
    setShowCreateModal(false); loadTemplates(); setSelectedTemplate(data)
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
    showToast('Waiver deleted', 'success'); setSelectedTemplate(null); loadTemplates()
  }
  async function duplicateTemplate(t) {
    await createTemplate({ name: t.name + ' (Copy)', description: t.description, content: t.content,
      type: t.type, is_required: t.is_required, requires_signature: t.requires_signature, sport_id: t.sport_id })
  }
  async function moveTemplate(index, direction) {
    const arr = [...templates]; const swap = index + direction
    if (swap < 0 || swap >= arr.length) return
    ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
    setTemplates(arr)
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]._legacy) await supabase.from('waiver_templates').update({ sort_order: i }).eq('id', arr[i].id)
    }
  }

  const filtered = templates.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterSport !== 'all' && t.sport_id !== filterSport) return false
    if (filterStatus === 'active' && !t.is_active) return false
    if (filterStatus === 'inactive' && t.is_active) return false
    return true
  })

  return (
    <PageShell
      title="Waiver Management"
      subtitle={`Create, edit, and manage waivers for ${organization?.name || 'your organization'}`}
      breadcrumb="Setup > Waivers"
      actions={<div className="flex items-center gap-3">
        {dbReady && (<button onClick={() => setShowSendModal(true)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium text-r-sm hover:bg-slate-100 transition">Send Ad-Hoc</button>)}
        <button onClick={() => dbReady ? setShowCreateModal(true) : showToast('Run the migration first', 'error')}
          className="bg-lynx-navy text-white font-bold px-4 py-2.5 rounded-lg text-r-sm hover:brightness-110">+ New Waiver</button>
      </div>}
    >
      {/* DB Warning */}
      {!dbReady && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-[14px] mb-6 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <span className="text-xl">⚠️</span>
          <div>
            <p className={`font-semibold text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Migration Required</p>
            <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>
              Run <code className="font-mono">migration-waiver-system.sql</code> in Supabase.
            </p>
          </div>
        </div>
      )}

      {/* View Tabs (pill style) */}
      {dbReady && (
        <div className="flex items-center gap-1 rounded-xl p-1 border border-slate-200 w-fit mb-6">
          {VIEW_TABS.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-lg text-r-sm font-medium transition ${
                view === tab.id ? 'bg-lynx-sky/20 text-lynx-sky' : 'text-slate-500 hover:bg-slate-100'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Templates View */}
      {view === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT: Filters + List */}
          <div className="space-y-3">
            {templates.length > 3 && (
              <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] p-3 space-y-2`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${tc.textMuted}`}>Filters</p>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
                  <option value="all">All Types</option><option value="standard">Standard</option>
                  <option value="sport_specific">Sport-Specific</option><option value="adhoc">Ad-Hoc</option>
                </select>
                {enabledSports.length > 1 && (
                  <select value={filterSport} onChange={e => setFilterSport(e.target.value)} className={selectCls}>
                    <option value="all">All Sports</option>
                    {enabledSports.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                )}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
                  <option value="all">Active & Inactive</option><option value="active">Active Only</option><option value="inactive">Inactive Only</option>
                </select>
              </div>
            )}

            {loading ? (
              <div className={`p-8 text-center ${tc.textMuted}`}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div className={`${tc.cardBg} border border-slate-200 rounded-[14px] p-6 text-center`}>
                <p className="text-4xl mb-3">📋</p>
                <p className={`font-semibold ${tc.text}`}>{templates.length === 0 ? 'No waivers yet' : 'No matches'}</p>
                {templates.length === 0 && (
                  <button onClick={() => setShowCreateModal(true)} className="mt-4 px-4 py-2 rounded-[14px] bg-lynx-navy text-white text-sm font-medium">+ Create Waiver</button>
                )}
              </div>
            ) : filtered.map((t, idx) => {
              const sport = getSportById(t.sport_id)
              const typeMeta = TYPE_META[t.type] || TYPE_META.standard
              const isSelected = selectedTemplate?.id === t.id
              return (
                <div key={t.id} onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left p-3 rounded-[14px] border transition cursor-pointer group ${
                    isSelected ? 'bg-lynx-sky/10 border-lynx-sky/50' : `${tc.cardBg} border-slate-200 hover:border-lynx-sky/30`}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium text-sm truncate ${isSelected ? tc.text : tc.textSecondary}`}>{t.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {typeMeta.icon} {typeMeta.label}
                        </span>
                        {sport && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>{sport.icon} {sport.name}</span>}
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
            })}
          </div>

          {/* RIGHT: Editor */}
          {selectedTemplate ? (
            <WaiverEditor selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
              signatureStats={signatureStats} editHistory={editHistory} saving={saving}
              onSave={saveTemplate} onDelete={deleteTemplate} onDuplicate={duplicateTemplate}
              onPreview={() => setShowPreview(true)} showToast={showToast} />
          ) : templates.length > 0 ? (
            <div className={`lg:col-span-3 ${tc.cardBg} border border-slate-200 rounded-[14px] p-10 text-center`}>
              <p className="text-4xl mb-3">👈</p>
              <p className={`font-medium ${tc.text}`}>Select a waiver to edit</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Signatures & Send History Views */}
      {view === 'signatures' && <SignaturesView tc={tc} isDark={isDark} organization={organization} selectedSeason={selectedSeason} />}
      {view === 'sends' && <SendHistoryView tc={tc} isDark={isDark} organization={organization} />}

      {/* Modals */}
      {showCreateModal && <CreateWaiverModal tc={tc} isDark={isDark} onClose={() => setShowCreateModal(false)} onCreate={createTemplate} enabledSports={enabledSports} />}
      {showSendModal && <SendAdhocModal tc={tc} isDark={isDark} organization={organization} templates={templates.filter(t => t.is_active && !t._legacy)} showToast={showToast} onClose={() => setShowSendModal(false)} />}
      {showPreview && selectedTemplate && <WaiverPreviewModal tc={tc} isDark={isDark} template={selectedTemplate} organization={organization} onClose={() => setShowPreview(false)} />}
    </PageShell>
  )
}

export { WaiversPage }
