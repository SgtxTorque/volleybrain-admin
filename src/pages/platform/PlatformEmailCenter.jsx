import { useState, useEffect, useMemo } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import EmailComposer from '../../components/email/EmailComposer'
import {
  Mail, Plus, Search, X, Loader2, Send, Save, Copy, Trash2,
  ChevronRight, Users, Building2, Clock, CheckCircle2, AlertTriangle,
  ArrowLeft, Eye, BarChart3, RefreshCw
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM EMAIL CENTER — Campaign management
// ═══════════════════════════════════════════════════════════

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'sending', label: 'Sending' },
]

const STATUS_COLORS = {
  draft: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
  sending: { bg: 'bg-amber-500/15', text: 'text-amber-500' },
  sent: { bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
}

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'All Users' },
  { id: 'admins', label: 'All Admins' },
  { id: 'coaches', label: 'All Coaches' },
  { id: 'parents', label: 'All Parents' },
  { id: 'specific_orgs', label: 'Specific Organizations' },
]

function timeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// ═══════ CAMPAIGN EDITOR ═══════
function CampaignEditor({ campaign, isDark, tc, showToast, onSaved, onClose }) {
  const { user } = useAuth()
  const [subject, setSubject] = useState(campaign?.subject || '')
  const [bodyHtml, setBodyHtml] = useState(campaign?.body_html || '')
  const [audience, setAudience] = useState(campaign?.target_audience || 'all')
  const [selectedOrgs, setSelectedOrgs] = useState(campaign?.target_org_ids || [])
  const [orgs, setOrgs] = useState([])
  const [orgSearch, setOrgSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [recipientCount, setRecipientCount] = useState(0)
  const [loadingCount, setLoadingCount] = useState(false)

  useEffect(() => {
    loadOrgs()
  }, [])

  useEffect(() => {
    computeRecipientCount()
  }, [audience, selectedOrgs])

  async function loadOrgs() {
    const { data } = await supabase.from('organizations').select('id, name').order('name').limit(200)
    setOrgs(data || [])
  }

  async function computeRecipientCount() {
    setLoadingCount(true)
    try {
      let query = supabase.from('profiles').select('id', { count: 'exact', head: true })
      if (audience === 'admins') {
        const { count } = await supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'league_admin')
        setRecipientCount(count || 0)
        setLoadingCount(false)
        return
      }
      if (audience === 'coaches') {
        const { count } = await supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'coach')
        setRecipientCount(count || 0)
        setLoadingCount(false)
        return
      }
      if (audience === 'parents') {
        const { count } = await supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role', 'parent')
        setRecipientCount(count || 0)
        setLoadingCount(false)
        return
      }
      if (audience === 'specific_orgs' && selectedOrgs.length > 0) {
        const { count } = await supabase.from('user_roles').select('user_id', { count: 'exact', head: true }).in('org_id', selectedOrgs)
        setRecipientCount(count || 0)
        setLoadingCount(false)
        return
      }
      // All users
      const { count } = await query
      setRecipientCount(count || 0)
    } catch {
      setRecipientCount(0)
    }
    setLoadingCount(false)
  }

  async function handleSave() {
    if (!subject.trim()) { showToast?.('Subject is required', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        subject: subject.trim(),
        body_html: bodyHtml,
        target_audience: audience,
        target_org_ids: audience === 'specific_orgs' ? selectedOrgs : [],
        status: 'draft',
        created_by: user?.id,
      }
      let result
      if (campaign?.id) {
        result = await supabase.from('platform_email_campaigns').update(payload).eq('id', campaign.id).select().single()
      } else {
        result = await supabase.from('platform_email_campaigns').insert(payload).select().single()
      }
      if (result.error) throw result.error

      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: campaign?.id ? 'update_email_campaign' : 'create_email_campaign',
        target_type: 'email_campaign',
        target_id: result.data.id,
        details: { subject: subject.trim() },
        user_agent: navigator.userAgent,
      })

      showToast?.('Campaign saved', 'success')
      onSaved?.()
    } catch (err) {
      console.error('Error saving campaign:', err)
      showToast?.('Failed to save campaign', 'error')
    }
    setSaving(false)
  }

  async function handleSendTest() {
    if (!subject.trim() || !bodyHtml) { showToast?.('Subject and body required', 'error'); return }
    setSendingTest(true)
    try {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user?.id).single()
      if (!profile?.email) { showToast?.('No email found for your account', 'error'); setSendingTest(false); return }

      await supabase.from('email_notifications').insert({
        recipient_email: profile.email,
        subject: `[TEST] ${subject.trim()}`,
        body_html: bodyHtml,
        status: 'pending',
      })
      showToast?.(`Test email queued to ${profile.email}`, 'success')
    } catch (err) {
      console.error('Error sending test:', err)
      showToast?.('Failed to send test email', 'error')
    }
    setSendingTest(false)
  }

  async function handleSendNow() {
    if (!subject.trim() || !bodyHtml) { showToast?.('Subject and body required', 'error'); return }
    if (recipientCount === 0) { showToast?.('No recipients to send to', 'error'); return }
    setSending(true)
    try {
      // Save/update campaign first
      const payload = {
        subject: subject.trim(),
        body_html: bodyHtml,
        target_audience: audience,
        target_org_ids: audience === 'specific_orgs' ? selectedOrgs : [],
        status: 'sending',
        sent_at: new Date().toISOString(),
        total_recipients: recipientCount,
        created_by: user?.id,
      }

      let campaignId = campaign?.id
      if (campaignId) {
        await supabase.from('platform_email_campaigns').update(payload).eq('id', campaignId)
      } else {
        const { data } = await supabase.from('platform_email_campaigns').insert(payload).select().single()
        campaignId = data?.id
      }

      // Get recipient emails
      let recipientQuery
      if (audience === 'admins') {
        const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'league_admin').limit(5000)
        const userIds = [...new Set((roles || []).map(r => r.user_id))]
        const { data: profiles } = await supabase.from('profiles').select('email').in('id', userIds).not('email', 'is', null)
        recipientQuery = profiles || []
      } else if (audience === 'coaches') {
        const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'coach').limit(5000)
        const userIds = [...new Set((roles || []).map(r => r.user_id))]
        const { data: profiles } = await supabase.from('profiles').select('email').in('id', userIds).not('email', 'is', null)
        recipientQuery = profiles || []
      } else if (audience === 'parents') {
        const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'parent').limit(5000)
        const userIds = [...new Set((roles || []).map(r => r.user_id))]
        const { data: profiles } = await supabase.from('profiles').select('email').in('id', userIds).not('email', 'is', null)
        recipientQuery = profiles || []
      } else if (audience === 'specific_orgs' && selectedOrgs.length > 0) {
        const { data: roles } = await supabase.from('user_roles').select('user_id').in('org_id', selectedOrgs).limit(5000)
        const userIds = [...new Set((roles || []).map(r => r.user_id))]
        const { data: profiles } = await supabase.from('profiles').select('email').in('id', userIds).not('email', 'is', null)
        recipientQuery = profiles || []
      } else {
        const { data: profiles } = await supabase.from('profiles').select('email').not('email', 'is', null).limit(5000)
        recipientQuery = profiles || []
      }

      // Filter out unsubscribed
      const { data: unsubs } = await supabase.from('email_unsubscribes').select('email').limit(10000)
      const unsubSet = new Set((unsubs || []).map(u => u.email?.toLowerCase()))
      const recipients = recipientQuery.filter(p => p.email && !unsubSet.has(p.email.toLowerCase()))

      // Insert email notifications
      if (recipients.length > 0) {
        const rows = recipients.map(r => ({
          recipient_email: r.email,
          subject: subject.trim(),
          body_html: bodyHtml,
          status: 'pending',
        }))
        // Insert in batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          await supabase.from('email_notifications').insert(rows.slice(i, i + 500))
        }
      }

      // Update campaign status
      await supabase.from('platform_email_campaigns').update({
        status: 'sent',
        total_recipients: recipients.length,
      }).eq('id', campaignId)

      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'send_email_campaign',
        target_type: 'email_campaign',
        target_id: campaignId,
        details: { subject: subject.trim(), recipients: recipients.length },
        user_agent: navigator.userAgent,
      })

      showToast?.(`Campaign sent to ${recipients.length} recipients`, 'success')
      onSaved?.()
    } catch (err) {
      console.error('Error sending campaign:', err)
      showToast?.('Failed to send campaign', 'error')
    }
    setSending(false)
  }

  const filteredOrgs = orgs.filter(o => !orgSearch || o.name?.toLowerCase().includes(orgSearch.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full max-w-3xl flex flex-col ${
          isDark ? 'bg-lynx-midnight border-l border-white/[0.08]' : 'bg-white border-l border-slate-200'
        } shadow-2xl`}
        style={{ animation: 'slideInRight .25s ease-out' }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 p-5 border-b ${isDark ? 'bg-slate-900/95 border-white/[0.08]' : 'bg-white/95 border-slate-200'} backdrop-blur-xl`}>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className={`text-lg font-bold ${tc.text}`}>{campaign?.id ? 'Edit Campaign' : 'New Campaign'}</h2>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Subject */}
          <div>
            <label className={`text-sm font-semibold ${tc.text} block mb-1.5`}>Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject line..."
              className={`w-full px-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50`}
            />
          </div>

          {/* Body */}
          <div>
            <label className={`text-sm font-semibold ${tc.text} block mb-1.5`}>Body</label>
            <EmailComposer content={bodyHtml} onChange={setBodyHtml} placeholder="Compose your email..." minHeight={250} />
          </div>

          {/* Audience */}
          <div>
            <label className={`text-sm font-semibold ${tc.text} block mb-1.5`}>Audience</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAudience(a.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    audience === a.id
                      ? 'bg-[var(--accent-primary)] text-white'
                      : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/[0.06]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Org multi-select */}
            {audience === 'specific_orgs' && (
              <div className="mt-3">
                <input
                  value={orgSearch}
                  onChange={e => setOrgSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className={`w-full px-3 py-2 rounded-xl text-sm mb-2 ${tc.input} border`}
                />
                <div className={`max-h-40 overflow-y-auto rounded-xl border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                  {filteredOrgs.slice(0, 50).map(org => (
                    <label key={org.id} className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} ${tc.text}`}>
                      <input
                        type="checkbox"
                        checked={selectedOrgs.includes(org.id)}
                        onChange={e => {
                          setSelectedOrgs(prev => e.target.checked ? [...prev, org.id] : prev.filter(id => id !== org.id))
                        }}
                        className="rounded"
                      />
                      {org.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Recipient count */}
            <div className={`mt-2 flex items-center gap-2 text-xs ${tc.textMuted}`}>
              <Users className="w-3.5 h-3.5" />
              {loadingCount ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}</span>}
              <span>(excluding unsubscribed)</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className={`border-t p-4 flex items-center gap-3 ${isDark ? 'bg-slate-900/80 border-white/[0.08]' : 'bg-slate-50 border-slate-200'}`}>
          <button
            onClick={handleSendTest}
            disabled={sendingTest || !subject.trim()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${
              isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            } disabled:opacity-40`}
          >
            {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Send Test
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !subject.trim()}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition border ${
              isDark ? 'border-white/[0.08] text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            } disabled:opacity-40`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={handleSendNow}
            disabled={sending || !subject.trim() || recipientCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT: PlatformEmailCenter
// ═══════════════════════════════════════════════════════════
function PlatformEmailCenter({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const { user } = useAuth()

  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from('platform_email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setCampaigns(data || [])
    } catch (err) {
      console.error('Error loading campaigns:', err)
      if (err.message?.includes('relation') || err.code === '42P01') {
        setLoadError('table_missing')
      } else {
        setLoadError('generic')
      }
      setCampaigns([])
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    try {
      await supabase.from('platform_email_campaigns').delete().eq('id', id)
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'delete_email_campaign',
        target_type: 'email_campaign',
        target_id: id,
        details: {},
        user_agent: navigator.userAgent,
      })
      showToast?.('Campaign deleted', 'success')
      loadCampaigns()
    } catch (err) {
      console.error('Error deleting campaign:', err)
      showToast?.('Failed to delete', 'error')
    }
  }

  async function handleDuplicate(campaign) {
    try {
      await supabase.from('platform_email_campaigns').insert({
        subject: `Copy of ${campaign.subject}`,
        body_html: campaign.body_html,
        target_audience: campaign.target_audience,
        target_org_ids: campaign.target_org_ids,
        status: 'draft',
        created_by: user?.id,
      })
      showToast?.('Campaign duplicated', 'success')
      loadCampaigns()
    } catch (err) {
      showToast?.('Failed to duplicate', 'error')
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!c.subject?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const statusCounts = {
    all: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    sending: campaigns.filter(c => c.status === 'sending').length,
  }

  return (
    <div className={`min-h-screen ${tc.pageBg}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${tc.text}`}>Email Center</h1>
            <p className={`text-sm ${tc.textMuted} mt-1`}>Create and send email campaigns to platform users</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadCampaigns} disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/[0.08]' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => { setEditingCampaign(null); setEditorOpen(true) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition">
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setStatusFilter(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === s.id
                  ? 'bg-[var(--accent-primary)] text-white shadow-md'
                  : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/[0.06]' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
              }`}>
              {s.label}
              <span className={`text-xs font-bold ${statusFilter === s.id ? 'text-white/80' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {statusCounts[s.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-5">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search campaigns..."
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50`} />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} /></button>}
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
            <p className={`text-sm ${tc.textMuted}`}>Loading campaigns...</p>
          </div>
        ) : loadError === 'table_missing' ? (
          <div className="py-20 text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-lynx-charcoal/60' : 'bg-slate-100'}`}>
              <Mail className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-lg font-bold ${tc.text} mb-1`}>Email Center not set up yet</h3>
            <p className={`text-sm ${tc.textMuted} max-w-md mx-auto`}>The platform_email_campaigns table has not been created. Run the migration to enable the Email Center.</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-lynx-charcoal/60' : 'bg-slate-100'}`}>
              <Mail className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-lg font-bold ${tc.text} mb-1`}>No email campaigns yet</h3>
            <p className={`text-sm ${tc.textMuted} max-w-md mx-auto mb-4`}>Create your first campaign to start reaching platform users.</p>
            <button onClick={() => { setEditingCampaign(null); setEditorOpen(true) }}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:brightness-110 transition">
              Create Campaign
            </button>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center">
            <Search className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <h3 className={`text-base font-bold ${tc.text} mb-1`}>No campaigns match your filters</h3>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-xs font-medium ${tc.textMuted} mb-2`}>{filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}</p>
            {filteredCampaigns.map(c => {
              const colors = STATUS_COLORS[c.status] || STATUS_COLORS.draft
              return (
                <div key={c.id} className={`rounded-[14px] p-4 border shadow-sm transition-all hover:shadow-md ${
                  isDark ? 'bg-[#1E293B] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <Mail className={`w-4.5 h-4.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-semibold ${tc.text} truncate`}>{c.subject}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                          <Users className="w-3 h-3" />
                          {AUDIENCE_OPTIONS.find(a => a.id === c.target_audience)?.label || c.target_audience}
                        </span>
                        <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {c.sent_at ? `Sent ${timeAgo(c.sent_at)}` : timeAgo(c.created_at)}
                        </span>
                        {c.status === 'sent' && (
                          <span className={`text-xs ${tc.textMuted}`}>
                            {c.total_recipients} sent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                        {c.status?.charAt(0).toUpperCase() + c.status?.slice(1)}
                      </span>
                      {c.status === 'draft' && (
                        <button onClick={() => { setEditingCampaign(c); setEditorOpen(true) }}
                          className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Edit">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDuplicate(c)}
                        className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      {c.status === 'draft' && (
                        <button onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg transition hover:bg-red-500/10 text-red-400" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Campaign editor slide-over */}
      {editorOpen && (
        <CampaignEditor
          campaign={editingCampaign}
          isDark={isDark}
          tc={tc}
          showToast={showToast}
          onSaved={() => { setEditorOpen(false); loadCampaigns() }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}

export { PlatformEmailCenter }
export default PlatformEmailCenter
