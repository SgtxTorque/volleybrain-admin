import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Bell, Plus, X, Check, Clock, AlertTriangle, Rocket, FileText, Eye,
  Users, Building2, Send, Save, Trash2, ChevronDown, RefreshCw, Search
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM NOTIFICATIONS — Announcements & Changelog
// ═══════════════════════════════════════════════════════════

const PN_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .pn-au{animation:fadeUp .4s ease-out both}
  .pn-as{animation:scaleIn .25s ease-out both}
`

const TYPE_CONFIG = {
  info:        { label: 'Info',        color: '#3B82F6', icon: Bell },
  warning:     { label: 'Warning',     color: '#F59E0B', icon: AlertTriangle },
  maintenance: { label: 'Maintenance', color: '#EF4444', icon: Clock },
  feature:     { label: 'Feature',     color: '#10B981', icon: Rocket },
  changelog:   { label: 'Changelog',   color: '#8B5CF6', icon: FileText },
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'admins', label: 'Admins Only' },
  { value: 'coaches', label: 'Coaches Only' },
  { value: 'parents', label: 'Parents Only' },
  { value: 'specific_orgs', label: 'Specific Orgs' },
]

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ═══════════════════════════════════════════════════════════

function PlatformNotifications({ showToast }) {
  const { user } = useAuth()
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const accentColor = accent?.primary || '#EAB308'

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [orgs, setOrgs] = useState([])

  // View tab
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'changelog'

  // Create/Edit modal
  const [editModal, setEditModal] = useState(null) // null or announcement obj (empty for create)
  const [form, setForm] = useState({ title: '', body: '', type: 'info', target_audience: 'all', target_org_ids: [], is_banner: false, expires_at: '' })
  const [saving, setSaving] = useState(false)

  // Read counts
  const [readCounts, setReadCounts] = useState({})

  // Search
  const [search, setSearch] = useState('')

  // ═══════ LOAD ═══════

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [annRes, orgsRes, readsRes] = await Promise.all([
        supabase.from('platform_announcements').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('organizations').select('id, name').order('name'),
        supabase.from('platform_announcement_reads').select('announcement_id'),
      ])
      setAnnouncements(annRes.data || [])
      setOrgs(orgsRes.data || [])

      // Count reads per announcement
      const counts = {}
      ;(readsRes.data || []).forEach(r => {
        counts[r.announcement_id] = (counts[r.announcement_id] || 0) + 1
      })
      setReadCounts(counts)
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  // ═══════ METRICS ═══════

  const metrics = useMemo(() => {
    const now = new Date()
    const published = announcements.filter(a => a.is_published).length
    const drafts = announcements.filter(a => !a.is_published).length
    const activeBanners = announcements.filter(a => a.is_published && a.is_banner && (!a.expires_at || new Date(a.expires_at) > now)).length
    return { published, drafts, activeBanners }
  }, [announcements])

  // ═══════ FILTERED ═══════

  const filtered = useMemo(() => {
    let items = announcements
    if (activeTab === 'changelog') {
      items = items.filter(a => a.type === 'changelog')
    }
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q))
    }
    return items
  }, [announcements, activeTab, search])

  // ═══════ CREATE / EDIT ═══════

  function openCreate() {
    setEditModal({})
    setForm({ title: '', body: '', type: 'info', target_audience: 'all', target_org_ids: [], is_banner: false, expires_at: '' })
  }

  function openEdit(ann) {
    setEditModal(ann)
    setForm({
      title: ann.title || '',
      body: ann.body || '',
      type: ann.type || 'info',
      target_audience: ann.target_audience || 'all',
      target_org_ids: ann.target_org_ids || [],
      is_banner: ann.is_banner || false,
      expires_at: ann.expires_at ? ann.expires_at.split('T')[0] : '',
    })
  }

  async function handleSave(publish) {
    if (!form.title.trim()) return showToast('Title is required', 'error')
    if (!form.body.trim()) return showToast('Body is required', 'error')
    setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        target_audience: form.target_audience,
        target_org_ids: form.target_audience === 'specific_orgs' ? form.target_org_ids : [],
        is_banner: form.is_banner,
        expires_at: form.expires_at || null,
        updated_at: new Date().toISOString(),
      }

      if (publish) {
        payload.is_published = true
        payload.published_at = new Date().toISOString()
      }

      if (editModal?.id) {
        // Update existing
        const { error } = await supabase.from('platform_announcements').update(payload).eq('id', editModal.id)
        if (error) throw error

        await supabase.from('platform_admin_actions').insert({
          admin_id: user?.id,
          action_type: publish ? 'publish_announcement' : 'edit_announcement',
          target_type: 'announcement',
          target_id: editModal.id,
          details: { title: payload.title, type: payload.type },
        })
        showToast(publish ? 'Announcement published' : 'Announcement updated', 'success')
      } else {
        // Create new
        payload.created_by = user?.id
        if (!publish) payload.is_published = false
        const { data: newAnn, error } = await supabase.from('platform_announcements').insert(payload).select('id').single()
        if (error) throw error

        await supabase.from('platform_admin_actions').insert({
          admin_id: user?.id,
          action_type: publish ? 'publish_announcement' : 'create_announcement',
          target_type: 'announcement',
          target_id: newAnn?.id,
          details: { title: payload.title, type: payload.type },
        })
        showToast(publish ? 'Announcement published' : 'Draft saved', 'success')
      }

      setEditModal(null)
      await loadData()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  async function handleUnpublish(ann) {
    const { error } = await supabase.from('platform_announcements').update({ is_published: false, published_at: null }).eq('id', ann.id)
    if (error) return showToast('Error: ' + error.message, 'error')

    await supabase.from('platform_admin_actions').insert({
      admin_id: user?.id,
      action_type: 'unpublish_announcement',
      target_type: 'announcement',
      target_id: ann.id,
      details: { title: ann.title },
    })
    showToast('Announcement unpublished', 'success')
    await loadData()
  }

  async function handleDelete(ann) {
    if (!window.confirm(`Delete "${ann.title}"? This cannot be undone.`)) return

    const { error } = await supabase.from('platform_announcements').delete().eq('id', ann.id)
    if (error) return showToast('Error: ' + error.message, 'error')

    await supabase.from('platform_admin_actions').insert({
      admin_id: user?.id,
      action_type: 'delete_announcement',
      target_type: 'announcement',
      target_id: ann.id,
      details: { title: ann.title },
    })
    showToast('Announcement deleted', 'success')
    await loadData()
  }

  // ═══════ LOADING ═══════
  if (loading) {
    return (
      <>
        <style>{PN_STYLES}</style>
        <div className="space-y-6 w-full">
          <div className="pn-au"><div className={`h-10 w-80 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} /></div>
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className={`h-24 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>
      </>
    )
  }

  // ═══════ RENDER ═══════
  return (
    <>
      <style>{PN_STYLES}</style>
      <div className="space-y-6 w-full">

        {/* Controls */}
        <div className="flex items-center justify-between pn-au" style={{ animationDelay: '.05s' }}>
          <div className="flex items-center gap-1">
            {['all', 'changelog'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm transition ${
                  activeTab === tab
                    ? 'text-white'
                    : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
                style={activeTab === tab ? { backgroundColor: accentColor } : {}}
              >
                {tab === 'all' ? 'All Announcements' : 'Changelog'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-3 gap-4 pn-au" style={{ animationDelay: '.1s' }}>
          {[
            { label: 'Published', value: metrics.published, color: '#10B981', icon: Check },
            { label: 'Drafts', value: metrics.drafts, color: '#F59E0B', icon: FileText },
            { label: 'Active Banners', value: metrics.activeBanners, color: '#3B82F6', icon: Bell },
          ].map((m, i) => (
            <div key={i} className={`rounded-[14px] p-4 border shadow-sm ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
                <span className={`text-xs ${tc.textMuted}`}>{m.label}</span>
              </div>
              <p className={`text-2xl ${tc.text}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="pn-au" style={{ animationDelay: '.15s' }}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <Search className="w-4 h-4" style={{ color: `${accentColor}80` }} />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`bg-transparent text-sm outline-none w-full ${tc.text}`}
            />
            {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400" /></button>}
          </div>
        </div>

        {/* ANNOUNCEMENTS LIST */}
        <div className="pn-au space-y-3" style={{ animationDelay: '.2s' }}>
          {filtered.length === 0 ? (
            <div className={`rounded-[14px] p-12 text-center border shadow-sm ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
              <Bell className={`w-8 h-8 mx-auto mb-2 ${tc.textMuted}`} />
              <p className={`text-sm ${tc.textMuted}`}>No announcements found</p>
            </div>
          ) : (
            filtered.map(ann => {
              const typeCfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info
              const TypeIcon = typeCfg.icon
              const now = new Date()
              const isExpired = ann.expires_at && new Date(ann.expires_at) < now
              const statusLabel = !ann.is_published ? 'Draft' : isExpired ? 'Expired' : 'Published'
              const statusColor = !ann.is_published ? '#F59E0B' : isExpired ? '#64748B' : '#10B981'

              return (
                <div key={ann.id} className={`rounded-[14px] p-4 border shadow-sm ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    {/* Type badge */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${typeCfg.color}15` }}>
                      <TypeIcon className="w-4 h-4" style={{ color: typeCfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${tc.text}`}>{ann.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: `${typeCfg.color}15`, color: typeCfg.color }}>
                          {typeCfg.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                          {statusLabel}
                        </span>
                        {ann.is_banner && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                            Banner
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${tc.textMuted} line-clamp-2`}>{ann.body}</p>
                      <div className={`flex items-center gap-3 mt-2 text-xs ${tc.textMuted}`}>
                        <span>Target: {AUDIENCE_OPTIONS.find(o => o.value === ann.target_audience)?.label || ann.target_audience}</span>
                        {ann.published_at && <span>Published: {fmtDate(ann.published_at)}</span>}
                        {ann.expires_at && <span>Expires: {fmtDate(ann.expires_at)}</span>}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {readCounts[ann.id] || 0} reads
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(ann)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                      >
                        Edit
                      </button>
                      {ann.is_published && !isExpired && (
                        <button
                          onClick={() => handleUnpublish(ann)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] transition ${isDark ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' : 'bg-amber-50 hover:bg-amber-100 text-amber-600'}`}
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ann)}
                        className={`p-1.5 rounded-lg text-[11px] transition text-red-400 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* CREATE/EDIT MODAL */}
        {editModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)} />
            <div className={`relative w-full max-w-2xl rounded-xl p-6 pn-as max-h-[90vh] overflow-y-auto ${isDark ? 'bg-lynx-charcoal border border-white/10' : 'bg-white border border-slate-200'} shadow-2xl`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`text-lg ${tc.text}`}>{editModal?.id ? 'Edit Announcement' : 'New Announcement'}</h3>
                <button onClick={() => setEditModal(null)} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`text-xs ${tc.textMuted} block mb-1`}>TITLE</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Announcement title..."
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className={`text-xs ${tc.textMuted} block mb-1`}>BODY</label>
                  <textarea
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                    placeholder="Write announcement content..."
                    rows={6}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border resize-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Type */}
                  <div>
                    <label className={`text-xs ${tc.textMuted} block mb-1`}>TYPE</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                    >
                      {Object.entries(TYPE_CONFIG).map(([id, cfg]) => (
                        <option key={id} value={id}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className={`text-xs ${tc.textMuted} block mb-1`}>TARGET AUDIENCE</label>
                    <select
                      value={form.target_audience}
                      onChange={e => setForm({ ...form, target_audience: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                    >
                      {AUDIENCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specific orgs picker */}
                {form.target_audience === 'specific_orgs' && (
                  <div>
                    <label className={`text-xs ${tc.textMuted} block mb-1`}>SELECT ORGANIZATIONS</label>
                    <div className={`max-h-40 overflow-y-auto rounded-xl border p-2 space-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                      {orgs.map(org => {
                        const selected = form.target_org_ids.includes(org.id)
                        return (
                          <button
                            key={org.id}
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                target_org_ids: selected
                                  ? prev.target_org_ids.filter(id => id !== org.id)
                                  : [...prev.target_org_ids, org.id]
                              }))
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition ${
                              selected
                                ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                                : isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5" />}
                            <Building2 className="w-3.5 h-3.5" style={{ color: selected ? '#10B981' : '#94A3B8' }} />
                            <span>{org.name}</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className={`text-xs mt-1 ${tc.textMuted}`}>{form.target_org_ids.length} org{form.target_org_ids.length !== 1 ? 's' : ''} selected</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Banner toggle */}
                  <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/[.03] border-white/[.06]' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${tc.text}`}>Show as Banner</p>
                        <p className={`text-[10px] ${tc.textMuted}`}>Dismissible banner in dashboards</p>
                      </div>
                      <button
                        onClick={() => setForm({ ...form, is_banner: !form.is_banner })}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_banner ? 'bg-emerald-500' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_banner ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className={`text-xs ${tc.textMuted} block mb-1`}>EXPIRES (optional)</label>
                    <input
                      type="date"
                      value={form.expires_at}
                      onChange={e => setForm({ ...form, expires_at: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-50 ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  <Send className="w-4 h-4" />
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
                <button
                  onClick={() => setEditModal(null)}
                  className={`px-5 py-2.5 rounded-xl text-sm transition ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}

export { PlatformNotifications }
export default PlatformNotifications
