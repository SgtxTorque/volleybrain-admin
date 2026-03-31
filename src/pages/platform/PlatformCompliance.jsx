import { useState, useEffect, useMemo } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Shield, Users, Clock, CheckCircle2, AlertTriangle, Plus, Search, X,
  Loader2, RefreshCw, Building2, User, Mail, Trash2, ArrowLeft,
  FileText, Lock, ChevronRight
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM COMPLIANCE CENTER — COPPA, Data Requests, Waivers, ToS
// ═══════════════════════════════════════════════════════════

const TABS = [
  { id: 'coppa', label: 'COPPA Dashboard' },
  { id: 'data_requests', label: 'Data Requests' },
  { id: 'waivers', label: 'Waiver Compliance' },
  { id: 'tos', label: 'Terms of Service' },
]

const REQUEST_TYPES = [
  { id: 'deletion', label: 'Data Deletion' },
  { id: 'export', label: 'Data Export' },
  { id: 'correction', label: 'Data Correction' },
  { id: 'access', label: 'Data Access' },
]

const REQUEST_STATUS_COLORS = {
  pending: { bg: 'bg-amber-500/15', text: 'text-amber-500' },
  in_progress: { bg: 'bg-blue-500/15', text: 'text-blue-500' },
  completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400' },
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  const days = Math.floor((new Date() - d) / 86400000)
  if (days < 1) return 'today'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

// ═══════ TAB: COPPA DASHBOARD ═══════
function CoppaTab({ isDark, tc }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalParents: 0, consentGiven: 0, recentConsents: [] })

  useEffect(() => { loadCoppaData() }, [])

  async function loadCoppaData() {
    setLoading(true)
    try {
      // Count parent profiles
      const { count: totalParents } = await supabase.from('profiles')
        .select('id', { count: 'exact', head: true })

      // Count with COPPA consent
      const { count: consentGiven } = await supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('coppa_consent_given', true)

      // Recent consents
      const { data: recentConsents } = await supabase.from('profiles')
        .select('id, full_name, email, coppa_consent_date')
        .eq('coppa_consent_given', true)
        .order('coppa_consent_date', { ascending: false })
        .limit(10)

      setStats({
        totalParents: totalParents || 0,
        consentGiven: consentGiven || 0,
        recentConsents: recentConsents || [],
      })
    } catch (err) {
      console.error('Error loading COPPA data:', err)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="py-16 text-center">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--accent-primary)' }} />
      <p className={`text-sm ${tc.textMuted}`}>Loading COPPA data...</p>
    </div>
  )

  const consentRate = stats.totalParents > 0 ? Math.round((stats.consentGiven / stats.totalParents) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-[14px] p-5 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className={`text-sm font-medium ${tc.textMuted}`}>COPPA Consent Rate</span>
          </div>
          <p className={`text-3xl font-bold ${tc.text}`}>{consentRate}%</p>
          <p className={`text-xs ${tc.textMuted} mt-1`}>{stats.consentGiven} of {stats.totalParents} users</p>
        </div>
        <div className={`rounded-[14px] p-5 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className={`text-sm font-medium ${tc.textMuted}`}>Total Users</span>
          </div>
          <p className={`text-3xl font-bold ${tc.text}`}>{stats.totalParents}</p>
        </div>
        <div className={`rounded-[14px] p-5 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className={`text-sm font-medium ${tc.textMuted}`}>Consents Given</span>
          </div>
          <p className={`text-3xl font-bold ${tc.text}`}>{stats.consentGiven}</p>
        </div>
      </div>

      {/* Info panel */}
      <div className={`rounded-[14px] p-5 border ${isDark ? 'bg-sky-500/5 border-sky-500/20' : 'bg-sky-50 border-sky-200'}`}>
        <h3 className={`text-sm font-bold ${tc.text} mb-2`}>COPPA Compliance — What Lynx Collects from Minors</h3>
        <ul className={`text-sm ${tc.textSecondary} space-y-1`}>
          <li>Chat messages within team channels (parent-approved accounts only)</li>
          <li>Team membership and roster data</li>
          <li>Game stats and performance data</li>
          <li>Parent/guardian consent is required before any minor account is activated</li>
          <li>Data deletion requests must be fulfilled within 30 days</li>
        </ul>
      </div>

      {/* Recent consents */}
      <div>
        <h3 className={`text-sm font-bold ${tc.text} mb-3`}>Recent Consent Activity</h3>
        {stats.recentConsents.length === 0 ? (
          <p className={`text-sm ${tc.textMuted}`}>No consent records found. This field may not exist in the profiles table yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.recentConsents.map(p => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                isDark ? 'bg-[#1E293B] border-white/[0.06]' : 'bg-white border-slate-200'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${tc.text}`}>{p.full_name || 'Unknown'}</span>
                  <span className={`text-xs ${tc.textMuted} ml-2`}>{p.email}</span>
                </div>
                <span className={`text-xs ${tc.textMuted}`}>{p.coppa_consent_date ? timeAgo(p.coppa_consent_date) : '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════ TAB: DATA REQUESTS ═══════
function DataRequestsTab({ isDark, tc, showToast }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)

  // Form state
  const [requestType, setRequestType] = useState('deletion')
  const [requestorEmail, setRequestorEmail] = useState('')
  const [reason, setReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadRequests() }, [])

  async function loadRequests() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from('platform_data_requests')
        .select('*, profiles:requestor_id(full_name, email), target_profile:target_user_id(full_name, email), organizations:target_org_id(name)')
        .order('deadline', { ascending: true })
        .limit(200)
      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      if (err.message?.includes('relation') || err.code === '42P01') setLoadError('table_missing')
      else setLoadError('generic')
      setRequests([])
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!requestorEmail.trim()) { showToast?.('Email is required', 'error'); return }
    setSaving(true)
    try {
      const deadline = new Date(Date.now() + 30 * 86400000).toISOString() // 30 days
      const { data, error } = await supabase.from('platform_data_requests').insert({
        request_type: requestType,
        requestor_email: requestorEmail.trim(),
        reason: reason.trim() || null,
        admin_notes: adminNotes.trim() || null,
        deadline,
        status: 'pending',
      }).select().single()
      if (error) throw error

      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'create_data_request',
        target_type: 'data_request',
        target_id: data.id,
        details: { type: requestType, email: requestorEmail.trim() },
        user_agent: navigator.userAgent,
      })

      showToast?.('Data request created', 'success')
      setModalOpen(false)
      setRequestorEmail('')
      setReason('')
      setAdminNotes('')
      loadRequests()
    } catch (err) {
      console.error('Error creating request:', err)
      showToast?.('Failed to create request', 'error')
    }
    setSaving(false)
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const updateData = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.completed_by = user?.id
      }
      await supabase.from('platform_data_requests').update(updateData).eq('id', id)
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'update_data_request_status',
        target_type: 'data_request',
        target_id: id,
        details: { new_status: newStatus },
        user_agent: navigator.userAgent,
      })
      showToast?.(`Status updated to ${newStatus}`, 'success')
      loadRequests()
    } catch (err) {
      showToast?.('Failed to update', 'error')
    }
  }

  const metrics = useMemo(() => {
    const open = requests.filter(r => r.status === 'pending' || r.status === 'in_progress').length
    const overdue = requests.filter(r => r.deadline && new Date(r.deadline) < new Date() && r.status !== 'completed' && r.status !== 'rejected').length
    const completed = requests.filter(r => r.status === 'completed')
    const avgDays = completed.length > 0
      ? Math.round(completed.reduce((s, r) => s + (new Date(r.completed_at) - new Date(r.created_at)) / 86400000, 0) / completed.length)
      : '—'
    return { open, overdue, avgDays }
  }, [requests])

  if (loading) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--accent-primary)' }} /></div>
  if (loadError === 'table_missing') return (
    <div className="py-16 text-center">
      <Lock className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
      <h3 className={`text-lg font-bold ${tc.text} mb-1`}>Data requests table not set up</h3>
      <p className={`text-sm ${tc.textMuted}`}>Run the compliance migration to enable this feature.</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-[14px] p-4 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <span className={`text-xs font-medium ${tc.textMuted}`}>Open Requests</span>
          <p className={`text-2xl font-bold ${tc.text}`}>{metrics.open}</p>
        </div>
        <div className={`rounded-[14px] p-4 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <span className={`text-xs font-medium ${tc.textMuted}`}>Overdue</span>
          <p className={`text-2xl font-bold ${metrics.overdue > 0 ? 'text-red-500' : tc.text}`}>{metrics.overdue}</p>
        </div>
        <div className={`rounded-[14px] p-4 border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <span className={`text-xs font-medium ${tc.textMuted}`}>Avg Resolution (days)</span>
          <p className={`text-2xl font-bold ${tc.text}`}>{metrics.avgDays}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Request list */}
      <div className="space-y-2">
        {requests.length === 0 ? (
          <div className="py-12 text-center"><p className={`text-sm ${tc.textMuted}`}>No data requests yet</p></div>
        ) : requests.map(r => {
          const isOverdue = r.deadline && new Date(r.deadline) < new Date() && r.status !== 'completed' && r.status !== 'rejected'
          const colors = REQUEST_STATUS_COLORS[r.status] || REQUEST_STATUS_COLORS.pending
          return (
            <div key={r.id} className={`rounded-[14px] p-4 border shadow-sm ${
              isOverdue ? isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'
                : isDark ? 'bg-[#1E293B] border-white/[0.06]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${tc.text}`}>
                      {REQUEST_TYPES.find(t => t.id === r.request_type)?.label || r.request_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                    {isOverdue && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">Overdue</span>}
                  </div>
                  <div className={`flex items-center gap-3 text-xs ${tc.textMuted}`}>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.requestor_email || r.profiles?.email || '—'}</span>
                    {r.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Deadline: {new Date(r.deadline).toLocaleDateString()}</span>}
                  </div>
                  {r.reason && <p className={`text-xs ${tc.textSecondary} mt-1`}>{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'pending' && (
                    <button onClick={() => handleStatusChange(r.id, 'in_progress')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition`}>
                      Start
                    </button>
                  )}
                  {r.status === 'in_progress' && (
                    <button onClick={() => handleStatusChange(r.id, 'completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} transition`}>
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 mx-4 ${isDark ? 'bg-lynx-midnight border-white/[0.08]' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg font-bold ${tc.text} mb-4`}>New Data Request</h2>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Type</label>
                <select value={requestType} onChange={e => setRequestType(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm ${tc.input} border`}>
                  {REQUEST_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Requestor Email *</label>
                <input value={requestorEmail} onChange={e => setRequestorEmail(e.target.value)} placeholder="email@example.com"
                  className={`w-full px-3 py-2 rounded-xl text-sm ${tc.input} border`} />
              </div>
              <div>
                <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                  className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${tc.input} border`} />
              </div>
              <div>
                <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Admin Notes</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2}
                  className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${tc.input} border`} />
              </div>
              <p className={`text-xs ${tc.textMuted}`}>Deadline auto-set to 30 days from creation</p>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cancel</button>
              <button onClick={handleCreate} disabled={saving || !requestorEmail.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════ TAB: WAIVER COMPLIANCE ═══════
function WaiverTab({ isDark, tc }) {
  const [loading, setLoading] = useState(true)
  const [waiverData, setWaiverData] = useState([])

  useEffect(() => { loadWaiverData() }, [])

  async function loadWaiverData() {
    setLoading(true)
    try {
      // Get organizations with their waiver counts
      const { data: orgs } = await supabase.from('organizations').select('id, name').order('name').limit(200)
      if (!orgs || orgs.length === 0) { setWaiverData([]); setLoading(false); return }

      const orgIds = orgs.map(o => o.id)
      const { data: waivers } = await supabase.from('waivers').select('id, org_id, title').in('org_id', orgIds).limit(2000)
      const { data: signatures } = await supabase.from('waiver_signatures').select('waiver_id').limit(10000)

      const sigCountByWaiver = {}
      ;(signatures || []).forEach(s => {
        sigCountByWaiver[s.waiver_id] = (sigCountByWaiver[s.waiver_id] || 0) + 1
      })

      // Group by org
      const orgMap = {}
      orgs.forEach(o => { orgMap[o.id] = { ...o, waivers: 0, signed: 0 } })
      ;(waivers || []).forEach(w => {
        if (orgMap[w.org_id]) {
          orgMap[w.org_id].waivers++
          orgMap[w.org_id].signed += sigCountByWaiver[w.id] || 0
        }
      })

      setWaiverData(Object.values(orgMap).filter(o => o.waivers > 0).sort((a, b) => b.waivers - a.waivers))
    } catch (err) {
      console.error('Error loading waiver data:', err)
      setWaiverData([])
    }
    setLoading(false)
  }

  if (loading) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--accent-primary)' }} /></div>

  return (
    <div className="space-y-4">
      <h3 className={`text-sm font-bold ${tc.text}`}>Cross-Org Waiver Status</h3>
      {waiverData.length === 0 ? (
        <p className={`text-sm ${tc.textMuted}`}>No organizations with active waivers found.</p>
      ) : (
        <div className={`rounded-[14px] border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className={`text-left px-4 py-3 text-xs font-semibold ${tc.textMuted}`}>Organization</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold ${tc.textMuted}`}>Active Waivers</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold ${tc.textMuted}`}>Signatures</th>
                <th className={`text-left px-4 py-3 text-xs font-semibold ${tc.textMuted}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {waiverData.map(o => {
                const pct = o.waivers > 0 ? Math.round((o.signed / (o.waivers * 10)) * 100) : 0 // rough estimate
                let statusColor = 'text-emerald-500'
                let statusLabel = 'Good'
                if (pct < 50) { statusColor = 'text-red-500'; statusLabel = 'Critical' }
                else if (pct < 80) { statusColor = 'text-amber-500'; statusLabel = 'Needs Attention' }
                return (
                  <tr key={o.id} className={`border-t ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                    <td className={`px-4 py-3 text-sm font-medium ${tc.text}`}>{o.name}</td>
                    <td className={`px-4 py-3 text-sm ${tc.textSecondary}`}>{o.waivers}</td>
                    <td className={`px-4 py-3 text-sm ${tc.textSecondary}`}>{o.signed}</td>
                    <td className={`px-4 py-3 text-xs font-bold ${statusColor}`}>{statusLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ═══════ TAB: TERMS OF SERVICE ═══════
function TosTab({ isDark, tc, showToast }) {
  const { user } = useAuth()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadVersions() }, [])

  async function loadVersions() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase.from('platform_tos_versions').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      setVersions(data || [])
    } catch (err) {
      if (err.message?.includes('relation') || err.code === '42P01') setLoadError('table_missing')
      setVersions([])
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!version.trim() || !title.trim() || !content.trim()) { showToast?.('All fields required', 'error'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('platform_tos_versions').insert({
        version: version.trim(),
        title: title.trim(),
        content: content.trim(),
        created_by: user?.id,
      }).select().single()
      if (error) throw error

      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id, action_type: 'create_tos_version', target_type: 'tos_version', target_id: data.id,
        details: { version: version.trim() }, user_agent: navigator.userAgent,
      })

      showToast?.('ToS version created', 'success')
      setModalOpen(false)
      setVersion(''); setTitle(''); setContent('')
      loadVersions()
    } catch (err) {
      showToast?.('Failed to create', 'error')
    }
    setSaving(false)
  }

  async function handlePublish(id) {
    try {
      // Unpublish all first
      await supabase.from('platform_tos_versions').update({ is_current: false }).eq('is_current', true)
      // Publish this one
      await supabase.from('platform_tos_versions').update({ is_current: true, published_at: new Date().toISOString() }).eq('id', id)
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id, action_type: 'publish_tos_version', target_type: 'tos_version', target_id: id,
        details: {}, user_agent: navigator.userAgent,
      })
      showToast?.('Terms published', 'success')
      loadVersions()
    } catch (err) {
      showToast?.('Failed to publish', 'error')
    }
  }

  if (loading) return <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--accent-primary)' }} /></div>
  if (loadError === 'table_missing') return (
    <div className="py-16 text-center">
      <FileText className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
      <h3 className={`text-lg font-bold ${tc.text} mb-1`}>ToS table not set up</h3>
      <p className={`text-sm ${tc.textMuted}`}>Run the compliance migration.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`text-sm font-bold ${tc.text}`}>Terms of Service Versions</h3>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition">
          <Plus className="w-4 h-4" /> New Version
        </button>
      </div>

      {versions.length === 0 ? (
        <p className={`text-sm ${tc.textMuted}`}>No ToS versions created yet.</p>
      ) : (
        <div className="space-y-2">
          {versions.map(v => (
            <div key={v.id} className={`rounded-[14px] p-4 border shadow-sm ${
              v.is_current ? isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                : isDark ? 'bg-[#1E293B] border-white/[0.06]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${tc.text}`}>{v.title}</span>
                    <span className={`text-xs font-mono ${tc.textMuted}`}>v{v.version}</span>
                    {v.is_current && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500">Current</span>}
                  </div>
                  <p className={`text-xs ${tc.textMuted} mt-1`}>
                    Created {timeAgo(v.created_at)}
                    {v.published_at && ` | Published ${timeAgo(v.published_at)}`}
                  </p>
                </div>
                {!v.is_current && (
                  <button onClick={() => handlePublish(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} transition`}>
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border p-6 mx-4 ${isDark ? 'bg-lynx-midnight border-white/[0.08]' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg font-bold ${tc.text} mb-4`}>New ToS Version</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Version *</label>
                  <input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" className={`w-full px-3 py-2 rounded-xl text-sm ${tc.input} border`} />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Terms of Service" className={`w-full px-3 py-2 rounded-xl text-sm ${tc.input} border`} />
                </div>
              </div>
              <div>
                <label className={`text-xs font-semibold ${tc.textMuted} block mb-1`}>Content *</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} placeholder="Terms content..."
                  className={`w-full px-3 py-2 rounded-xl text-sm resize-none ${tc.input} border`} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModalOpen(false)} className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
function PlatformCompliance({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('coppa')

  return (
    <div className={`min-h-screen ${tc.pageBg}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${tc.text}`}>Compliance Center</h1>
          <p className={`text-sm ${tc.textMuted} mt-1`}>COPPA compliance, data requests, waivers, and terms of service</p>
        </div>

        {/* Tabs */}
        <div className={`flex items-center gap-1 mb-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : `border-transparent ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'coppa' && <CoppaTab isDark={isDark} tc={tc} />}
        {activeTab === 'data_requests' && <DataRequestsTab isDark={isDark} tc={tc} showToast={showToast} />}
        {activeTab === 'waivers' && <WaiverTab isDark={isDark} tc={tc} />}
        {activeTab === 'tos' && <TosTab isDark={isDark} tc={tc} showToast={showToast} />}
      </div>
    </div>
  )
}

export { PlatformCompliance }
export default PlatformCompliance
