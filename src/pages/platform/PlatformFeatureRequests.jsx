import { useState, useEffect, useMemo } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Plus, Search, X, Loader2, ChevronDown, ChevronRight, ChevronUp,
  ArrowLeft, RefreshCw, Filter, Grid, List, Lightbulb,
  Tag, Building2, User, Clock, CheckCircle2, AlertTriangle, Trash2
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM FEATURE REQUESTS — Kanban + List view
// ═══════════════════════════════════════════════════════════

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'payments', label: 'Payments' },
  { id: 'communication', label: 'Communication' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'registration', label: 'Registration' },
]

const STATUSES = [
  { id: 'under_review', label: 'Under Review', color: 'bg-blue-500', lightBg: 'bg-blue-500/10', text: 'text-blue-500' },
  { id: 'planned', label: 'Planned', color: 'bg-purple-500', lightBg: 'bg-purple-500/10', text: 'text-purple-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-amber-500', lightBg: 'bg-amber-500/10', text: 'text-amber-500' },
  { id: 'shipped', label: 'Shipped', color: 'bg-emerald-500', lightBg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  { id: 'declined', label: 'Declined', color: 'bg-slate-500', lightBg: 'bg-slate-500/10', text: 'text-slate-400' },
]

const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
]

const PRIORITY_COLORS = {
  low: 'text-slate-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays < 1) return 'today'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// ═══════ CREATE/EDIT MODAL ═══════
function FeatureModal({ feature, isDark, tc, showToast, onSaved, onClose, orgs }) {
  const { user } = useAuth()
  const [title, setTitle] = useState(feature?.title || '')
  const [description, setDescription] = useState(feature?.description || '')
  const [category, setCategory] = useState(feature?.category || 'general')
  const [priority, setPriority] = useState(feature?.priority || 'medium')
  const [status, setStatus] = useState(feature?.status || 'under_review')
  const [adminNotes, setAdminNotes] = useState(feature?.admin_notes || '')
  const [shippedVersion, setShippedVersion] = useState(feature?.shipped_version || '')
  const [submittedOrgId, setSubmittedOrgId] = useState(feature?.submitted_org_id || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) { showToast?.('Title is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        status,
        admin_notes: adminNotes.trim() || null,
        shipped_version: status === 'shipped' ? shippedVersion.trim() || null : null,
        submitted_org_id: submittedOrgId || null,
        updated_at: new Date().toISOString(),
      }
      if (!feature?.id) payload.submitted_by = user?.id

      let result
      if (feature?.id) {
        result = await supabase.from('platform_feature_requests').update(payload).eq('id', feature.id).select().single()
      } else {
        result = await supabase.from('platform_feature_requests').insert(payload).select().single()
      }
      if (result.error) throw result.error

      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: feature?.id ? 'update_feature_request' : 'create_feature_request',
        target_type: 'feature_request',
        target_id: result.data.id,
        details: { title: title.trim(), status },
        user_agent: navigator.userAgent,
      })

      showToast?.(`Feature request ${feature?.id ? 'updated' : 'created'}`, 'success')
      onSaved?.()
    } catch (err) {
      console.error('Error saving feature request:', err)
      showToast?.('Failed to save', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 mx-4 ${
        isDark ? 'bg-lynx-midnight border-white/[0.08]' : 'bg-white border-slate-200'
      }`} style={{ animation: 'fadeScaleIn .2s ease-out' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${tc.text}`}>{feature?.id ? 'Edit Request' : 'New Feature Request'}</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`text-sm font-semibold ${tc.text} block mb-1`}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Feature title..."
              className={`w-full px-3 py-2 rounded-xl text-sm ${tc.input} border`} />
          </div>

          <div>
            <label className={`text-sm font-semibold ${tc.text} block mb-1`}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the feature..."
              rows={3} className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${tc.input} border`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className={`w-full px-2 py-2 rounded-xl text-sm ${tc.input} border`}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className={`w-full px-2 py-2 rounded-xl text-sm ${tc.input} border`}>
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className={`w-full px-2 py-2 rounded-xl text-sm ${tc.input} border`}>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Submitted org */}
          <div>
            <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Submitted by Org (optional)</label>
            <select value={submittedOrgId} onChange={e => setSubmittedOrgId(e.target.value)}
              className={`w-full px-2 py-2 rounded-xl text-sm ${tc.input} border`}>
              <option value="">No specific org</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div>
            <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Admin Notes (internal)</label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..."
              rows={2} className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${tc.input} border`} />
          </div>

          {status === 'shipped' && (
            <div>
              <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Shipped Version</label>
              <input value={shippedVersion} onChange={e => setShippedVersion(e.target.value)} placeholder="e.g. v1.2.0"
                className={`w-full px-3 py-2 rounded-xl text-sm ${tc.input} border`} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : feature?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
function PlatformFeatureRequests({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const { user } = useAuth()

  const [features, setFeatures] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [viewMode, setViewMode] = useState('kanban') // kanban | list
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null)

  useEffect(() => { loadFeatures(); loadOrgs() }, [])

  async function loadOrgs() {
    const { data } = await supabase.from('organizations').select('id, name').order('name').limit(200)
    setOrgs(data || [])
  }

  async function loadFeatures() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from('platform_feature_requests')
        .select('*, organizations:submitted_org_id(name), profiles:submitted_by(full_name)')
        .order('vote_count', { ascending: false })
        .limit(500)
      if (error) throw error
      setFeatures(data || [])
    } catch (err) {
      console.error('Error loading feature requests:', err)
      if (err.message?.includes('relation') || err.code === '42P01') setLoadError('table_missing')
      else setLoadError('generic')
      setFeatures([])
    }
    setLoading(false)
  }

  async function handleVote(featureId, delta) {
    const f = features.find(x => x.id === featureId)
    if (!f) return
    const newCount = Math.max(0, (f.vote_count || 0) + delta)
    try {
      await supabase.from('platform_feature_requests').update({ vote_count: newCount }).eq('id', featureId)
      setFeatures(prev => prev.map(x => x.id === featureId ? { ...x, vote_count: newCount } : x))
    } catch (err) {
      showToast?.('Failed to update vote', 'error')
    }
  }

  async function handleStatusChange(featureId, newStatus) {
    try {
      await supabase.from('platform_feature_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', featureId)
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'update_feature_status',
        target_type: 'feature_request',
        target_id: featureId,
        details: { new_status: newStatus },
        user_agent: navigator.userAgent,
      })
      loadFeatures()
    } catch (err) {
      showToast?.('Failed to update status', 'error')
    }
  }

  async function handleDelete(featureId) {
    try {
      await supabase.from('platform_feature_requests').delete().eq('id', featureId)
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'delete_feature_request',
        target_type: 'feature_request',
        target_id: featureId,
        details: {},
        user_agent: navigator.userAgent,
      })
      showToast?.('Feature request deleted', 'success')
      loadFeatures()
    } catch (err) {
      showToast?.('Failed to delete', 'error')
    }
  }

  const filtered = features.filter(f => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!f.title?.toLowerCase().includes(q) && !f.description?.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Metrics
  const metrics = useMemo(() => ({
    total: features.length,
    under_review: features.filter(f => f.status === 'under_review').length,
    planned: features.filter(f => f.status === 'planned').length,
    in_progress: features.filter(f => f.status === 'in_progress').length,
    shipped_month: features.filter(f => {
      if (f.status !== 'shipped') return false
      const d = new Date(f.updated_at)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length,
  }), [features])

  return (
    <div className={`min-h-screen ${tc.pageBg}`}>
      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${tc.text}`}>Feature Requests</h1>
            <p className={`text-sm ${tc.textMuted} mt-1`}>Track, prioritize, and ship features</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex rounded-xl border ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <button onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 rounded-l-xl text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-[var(--accent-primary)] text-white' : isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-r-xl text-sm font-medium transition ${viewMode === 'list' ? 'bg-[var(--accent-primary)] text-white' : isDark ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={loadFeatures} disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/[0.08]' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setEditingFeature(null); setModalOpen(true) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition">
              <Plus className="w-4 h-4" /> New Request
            </button>
          </div>
        </div>

        {/* Metrics strip */}
        {!loading && !loadError && features.length > 0 && (
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Total Requests', value: metrics.total },
              { label: 'Under Review', value: metrics.under_review },
              { label: 'Planned', value: metrics.planned },
              { label: 'In Progress', value: metrics.in_progress },
              { label: 'Shipped This Month', value: metrics.shipped_month },
            ].map(m => (
              <div key={m.label} className={`rounded-[14px] p-4 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
                <span className={`text-xs font-medium ${tc.textMuted}`}>{m.label}</span>
                <p className={`text-xl font-bold ${tc.text} mt-1`}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search requests..."
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm ${tc.input} border`} />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className={`px-3 py-2.5 rounded-xl text-sm ${tc.input} border`}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
            <p className={`text-sm ${tc.textMuted}`}>Loading feature requests...</p>
          </div>
        ) : loadError === 'table_missing' ? (
          <div className="py-20 text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-lynx-charcoal/60' : 'bg-slate-100'}`}>
              <Lightbulb className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-lg font-bold ${tc.text} mb-1`}>Feature board not set up yet</h3>
            <p className={`text-sm ${tc.textMuted} max-w-md mx-auto`}>Run the migration to create the feature requests table.</p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="grid grid-cols-5 gap-4 overflow-x-auto">
            {STATUSES.map(s => {
              const columnFeatures = filtered.filter(f => f.status === s.id).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
              return (
                <div key={s.id} className="min-w-[220px]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className={`text-sm font-bold ${tc.text}`}>{s.label}</span>
                    <span className={`text-xs font-medium ${tc.textMuted}`}>{columnFeatures.length}</span>
                  </div>
                  <div className="space-y-2">
                    {columnFeatures.map(f => {
                      const catLabel = CATEGORIES.find(c => c.id === f.category)?.label || f.category
                      return (
                        <div key={f.id}
                          onClick={() => { setEditingFeature(f); setModalOpen(true) }}
                          className={`cursor-pointer rounded-[14px] p-3 border shadow-sm transition-all hover:shadow-md ${
                            isDark ? 'bg-[#1E293B] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}>
                          <h4 className={`text-sm font-semibold ${tc.text} mb-1.5 line-clamp-2`}>{f.title}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.lightBg} ${s.text}`}>{catLabel}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button onClick={e => { e.stopPropagation(); handleVote(f.id, 1) }}
                                className={`p-0.5 rounded hover:bg-emerald-500/10 transition ${isDark ? 'text-slate-500 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-500'}`}>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <span className={`text-xs font-bold ${tc.text}`}>{f.vote_count || 0}</span>
                              <button onClick={e => { e.stopPropagation(); handleVote(f.id, -1) }}
                                className={`p-0.5 rounded hover:bg-red-500/10 transition ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {f.organizations?.name && (
                              <span className={`text-[10px] ${tc.textMuted} flex items-center gap-1 truncate max-w-[100px]`}>
                                <Building2 className="w-3 h-3 flex-shrink-0" />
                                {f.organizations.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {columnFeatures.length === 0 && (
                      <div className={`text-center py-8 text-xs ${tc.textMuted}`}>No items</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className={`rounded-[14px] border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  {['Title', 'Category', 'Status', 'Priority', 'Votes', 'Org', 'Date', ''].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold ${tc.textMuted}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => {
                  const statusInfo = STATUSES.find(s => s.id === f.status)
                  return (
                    <tr key={f.id} onClick={() => { setEditingFeature(f); setModalOpen(true) }}
                      className={`cursor-pointer border-t transition ${isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className={`px-4 py-3 text-sm font-medium ${tc.text} max-w-[300px] truncate`}>{f.title}</td>
                      <td className={`px-4 py-3 text-xs ${tc.textMuted}`}>{CATEGORIES.find(c => c.id === f.category)?.label}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo?.lightBg} ${statusInfo?.text}`}>{statusInfo?.label}</span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium ${PRIORITY_COLORS[f.priority]}`}>{f.priority}</td>
                      <td className={`px-4 py-3 text-sm font-bold ${tc.text}`}>{f.vote_count || 0}</td>
                      <td className={`px-4 py-3 text-xs ${tc.textMuted} truncate max-w-[120px]`}>{f.organizations?.name || '—'}</td>
                      <td className={`px-4 py-3 text-xs ${tc.textMuted}`}>{timeAgo(f.created_at)}</td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); handleDelete(f.id) }}
                          className="p-1 rounded hover:bg-red-500/10 text-red-400 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className={`text-sm ${tc.textMuted}`}>No feature requests found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <FeatureModal
          feature={editingFeature}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          orgs={orgs}
          onSaved={() => { setModalOpen(false); loadFeatures() }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

export { PlatformFeatureRequests }
export default PlatformFeatureRequests
