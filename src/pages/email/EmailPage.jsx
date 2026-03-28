import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { EmailService } from '../../lib/email-service'
import { buildLynxEmail, resolveOrgBranding } from '../../lib/email-html-builder'
import PageShell from '../../components/pages/PageShell'
import EmailStatusBadge from '../../components/email/EmailStatusBadge'
import { Mail, Send, FileText, Search, ChevronDown, Settings } from '../../constants/icons'

const EmailComposer = lazy(() => import('../../components/email/EmailComposer'))
const EmailPreviewModal = lazy(() => import('../../components/email/EmailPreviewModal'))
const RecipientPicker = lazy(() => import('../../components/email/RecipientPicker'))

export default function EmailPage({ showToast, activeView }) {
  const { organization, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('log')
  const isAdmin = activeView === 'admin'

  const tabs = [
    { id: 'log', label: 'Email Log', icon: Mail },
    { id: 'compose', label: 'Compose', icon: Send },
    ...(isAdmin ? [
      { id: 'templates', label: 'Templates', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ] : []),
  ]

  return (
    <PageShell title="Email" breadcrumb="Communication" subtitle="Send, track, and manage email communications">
      {/* Tab Bar */}
      <div className="flex gap-1 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              activeTab === tab.id
                ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                : `${isDark ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-[#F5F6F8]'}`
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'log' && <EmailLogTab isAdmin={isAdmin} showToast={showToast} />}
      {activeTab === 'compose' && (
        <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading composer...</div>}>
          <EmailComposeTab showToast={showToast} />
        </Suspense>
      )}
      {activeTab === 'templates' && isAdmin && <EmailTemplatesTab showToast={showToast} />}
      {activeTab === 'settings' && isAdmin && <EmailSettingsTab showToast={showToast} />}
    </PageShell>
  )
}

// ── EMAIL LOG TAB ─────────────────────────────────────────────────────────────
function EmailLogTab({ isAdmin, showToast }) {
  const { organization, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedEmail, setSelectedEmail] = useState(null)

  useEffect(() => { loadEmails() }, [])

  async function loadEmails() {
    setLoading(true)
    try {
      let query = supabase
        .from('email_notifications')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(200)

      // Coach only sees own sends
      if (!isAdmin) {
        query = query.eq('sent_by', user.id)
      }

      const { data } = await query
      setEmails(data || [])
    } catch (err) {
      console.error('Error loading emails:', err)
    }
    setLoading(false)
  }

  const filtered = emails.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    if (search) {
      const q = search.toLowerCase()
      return (e.recipient_name?.toLowerCase().includes(q) ||
              e.recipient_email?.toLowerCase().includes(q) ||
              e.subject?.toLowerCase().includes(q))
    }
    return true
  })

  // Group by batch
  const batches = {}
  const standalone = []
  filtered.forEach(e => {
    if (e.broadcast_batch_id) {
      if (!batches[e.broadcast_batch_id]) batches[e.broadcast_batch_id] = []
      batches[e.broadcast_batch_id].push(e)
    } else {
      standalone.push(e)
    }
  })

  const typeBadge = (type) => {
    const colors = {
      registration_confirmation: 'bg-emerald-500/12 text-emerald-500',
      registration_approved: 'bg-emerald-500/12 text-emerald-500',
      payment_receipt: 'bg-[#4BB9EC]/15 text-[#4BB9EC]',
      payment_reminder: 'bg-amber-500/12 text-amber-500',
      blast_announcement: 'bg-purple-500/12 text-purple-500',
      team_assignment: 'bg-blue-500/12 text-blue-500',
    }
    const labels = {
      registration_confirmation: 'Registration',
      registration_approved: 'Approval',
      payment_receipt: 'Receipt',
      payment_reminder: 'Reminder',
      blast_announcement: 'Announcement',
      team_assignment: 'Team',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[type] || 'bg-slate-500/12 text-slate-500'}`}>
        {labels[type] || type}
      </span>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipients..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border`}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="bounced">Bounced</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border`}
        >
          <option value="all">All Types</option>
          <option value="transactional">Transactional</option>
          <option value="broadcast">Broadcast</option>
        </select>
      </div>

      {/* Batch summaries */}
      {Object.entries(batches).map(([batchId, batchEmails]) => {
        const sent = batchEmails.filter(e => ['sent', 'delivered', 'opened', 'clicked'].includes(e.status)).length
        const opened = batchEmails.filter(e => ['opened', 'clicked'].includes(e.status)).length
        const first = batchEmails[0]
        return (
          <BatchRow
            key={batchId}
            subject={first?.subject || 'Announcement'}
            total={batchEmails.length}
            sent={sent}
            opened={opened}
            date={first?.created_at}
            emails={batchEmails}
            onSelect={setSelectedEmail}
          />
        )
      })}

      {/* Standalone emails */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#4BB9EC] border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-400 mt-4 text-sm">Loading email log...</p>
        </div>
      ) : standalone.length === 0 && Object.keys(batches).length === 0 ? (
        <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-12 text-center`}>
          <Mail className={`w-10 h-10 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-bold mt-4 ${tc.text}`}>No emails sent yet</h3>
          <p className="text-slate-400 mt-1 text-sm">Once you start sending, you'll see everything here.</p>
        </div>
      ) : (
        <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] overflow-hidden`}>
          {/* Header */}
          <div className={`grid grid-cols-[1fr_120px_120px_100px_80px] gap-4 px-4 py-3 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500 border-b border-white/[0.06]' : 'text-slate-400 border-b border-[#E8ECF2]'}`}>
            <span>Recipient</span>
            <span>Subject</span>
            <span>Type</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          {standalone.map(email => (
            <div
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`grid grid-cols-[1fr_120px_120px_100px_80px] gap-4 px-4 py-3 cursor-pointer transition ${isDark ? 'hover:bg-white/[0.02] border-b border-white/[0.03]' : 'hover:bg-[#FAFBFC] border-b border-[#F5F6F8]'}`}
            >
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${tc.text}`}>{email.recipient_name || 'Unknown'}</p>
                <p className="text-xs text-slate-400 truncate">{email.recipient_email}</p>
              </div>
              <p className={`text-sm truncate ${tc.text}`}>{email.subject || '-'}</p>
              <div>{typeBadge(email.type)}</div>
              <p className="text-xs text-slate-400">
                {new Date(email.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <EmailStatusBadge status={email.status} />
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedEmail && (
        <EmailDetailPanel email={selectedEmail} onClose={() => setSelectedEmail(null)} />
      )}
    </div>
  )
}

// ── BATCH ROW ─────────────────────────────────────────────────────────────────
function BatchRow({ subject, total, sent, opened, date, emails, onSelect }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] mb-3 overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-4 p-4 text-left transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#FAFBFC]'}`}
      >
        <span className="text-2xl">📢</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold ${tc.text}`}>{subject}</p>
          <p className="text-xs text-slate-400">
            {total} sent &middot; {sent} delivered &middot; {opened} opened &middot;{' '}
            {date && new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          {emails.map(e => (
            <div
              key={e.id}
              onClick={() => onSelect(e)}
              className={`flex items-center gap-4 px-4 py-2.5 cursor-pointer text-sm ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#FAFBFC]'}`}
            >
              <span className={`flex-1 ${tc.text} truncate`}>{e.recipient_name} ({e.recipient_email})</span>
              <EmailStatusBadge status={e.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── EMAIL DETAIL PANEL ────────────────────────────────────────────────────────
function EmailDetailPanel({ email, onClose }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const timeline = [
    { label: 'Queued', time: email.created_at },
    { label: 'Sent', time: email.sent_at },
    { label: 'Delivered', time: email.delivered_at },
    { label: 'Opened', time: email.opened_at },
    { label: 'Clicked', time: email.clicked_at },
    { label: 'Bounced', time: email.bounced_at },
  ].filter(t => t.time)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-[#0B1D35] border-white/[0.08]' : 'bg-white border-[#E8ECF2]'} border rounded-[14px] w-full max-w-lg max-h-[80vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-5 border-b ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-bold ${tc.text}`}>Email Details</h3>
            <button onClick={onClose} className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Close</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Status</span>
              <EmailStatusBadge status={email.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">To</span>
              <span className={`text-sm ${tc.text}`}>{email.recipient_name} &lt;{email.recipient_email}&gt;</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Subject</span>
              <span className={`text-sm ${tc.text} truncate max-w-[300px]`}>{email.subject || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Type</span>
              <span className={`text-sm ${tc.text}`}>{email.type}</span>
            </div>
            {email.external_id && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Resend ID</span>
                <span className="text-xs font-mono text-slate-400">{email.external_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Delivery Timeline</p>
          <div className="space-y-3">
            {timeline.map((t, i) => (
              <div key={t.label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  t.label === 'Bounced' ? 'bg-red-500' : 'bg-emerald-500'
                }`} />
                <span className={`text-sm font-medium ${tc.text}`}>{t.label}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {new Date(t.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── COMPOSE TAB ───────────────────────────────────────────────────────────────
function EmailComposeTab({ showToast }) {
  const { organization, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [recipients, setRecipients] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  function getPreviewHtml() {
    const branding = resolveOrgBranding(organization)
    return buildLynxEmail({
      ...branding,
      heading: subject,
      body: body || '<p>Preview content</p>',
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
    })
  }

  async function handleSend() {
    if (recipients.length === 0) {
      showToast?.('Please add at least one recipient', 'error')
      return
    }
    if (!subject.trim()) {
      showToast?.('Please add a subject line', 'error')
      return
    }
    if (!body || body === '<p></p>') {
      showToast?.('Please write a message', 'error')
      return
    }

    setSending(true)
    try {
      const batchId = crypto.randomUUID()
      for (const r of recipients) {
        await EmailService.sendBlastEmail({
          recipientEmail: r.email,
          recipientName: r.name,
          recipientUserId: r.id,
          subject,
          heading: subject,
          body,
          ctaText: ctaText || null,
          ctaUrl: ctaUrl || null,
          organizationId: organization.id,
          organizationName: organization.email_sender_name || organization.name,
          sentBy: user.id,
          sentByRole: 'admin',
          broadcastBatchId: batchId,
          audienceType: 'custom',
        })
      }
      showToast?.(`${recipients.length} email(s) queued!`, 'success')
      setRecipients([])
      setSubject('')
      setBody('')
      setCtaText('')
      setCtaUrl('')
    } catch (err) {
      console.error('Send error:', err)
      showToast?.('Error sending emails', 'error')
    }
    setSending(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: compose form */}
      <div className="space-y-4">
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Recipients</label>
          <Suspense fallback={<div className="h-10" />}>
            <RecipientPicker selected={recipients} onChange={setRecipients} />
          </Suspense>
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line..."
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border focus:border-[#4BB9EC] outline-none`}
          />
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Message</label>
          <Suspense fallback={<div className="h-48 rounded-xl border" />}>
            <EmailComposer content={body} onChange={setBody} placeholder="Write your email..." minHeight={200} />
          </Suspense>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>CTA Button Text</label>
            <input
              type="text"
              value={ctaText}
              onChange={e => setCtaText(e.target.value)}
              placeholder="Optional"
              className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none`}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>CTA URL</label>
            <input
              type="url"
              value={ctaUrl}
              onChange={e => setCtaUrl(e.target.value)}
              placeholder="https://..."
              className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none`}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className={`px-5 py-2.5 rounded-xl border ${isDark ? 'border-white/[0.08] text-[#4BB9EC]' : 'border-[#E8ECF2] text-[#4BB9EC]'} font-bold text-sm`}
          >
            Preview
          </button>
          <button
            onClick={handleSend}
            disabled={sending || recipients.length === 0 || !subject.trim()}
            className="flex-1 py-2.5 rounded-xl bg-lynx-navy-subtle text-white font-bold hover:brightness-110 transition disabled:opacity-50 text-sm"
          >
            {sending ? 'Sending...' : `Send to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Right: live preview */}
      <div className="hidden lg:block">
        <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>Live Preview</label>
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`} style={{ height: 600 }}>
          <iframe
            srcDoc={getPreviewHtml()}
            title="Email Preview"
            style={{ width: '100%', height: '100%', border: 'none', background: '#F2F4F7' }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>

      {showPreview && (
        <Suspense fallback={null}>
          <EmailPreviewModal html={getPreviewHtml()} onClose={() => setShowPreview(false)} />
        </Suspense>
      )}
    </div>
  )
}

// ── TEMPLATES TAB ─────────────────────────────────────────────────────────────
function EmailTemplatesTab({ showToast }) {
  const { organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState(null)

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('organization_id', organization.id)
        .in('channel', ['email', 'both'])
        .order('type')
      setTemplates(data || [])
    } catch (err) {
      console.error('Error loading templates:', err)
    }
    setLoading(false)
  }

  const typeLabels = {
    registration_confirmation: 'Registration Confirmation',
    payment_receipt: 'Payment Receipt',
    blast_announcement: 'Announcement Email',
    registration_approved: 'Registration Approved',
    payment_reminder: 'Payment Reminder',
    team_assignment: 'Team Assignment',
    waitlist_spot_available: 'Waitlist Notification',
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#4BB9EC] border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  if (editingTemplate) {
    return (
      <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading editor...</div>}>
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={() => { loadTemplates(); setEditingTemplate(null) }}
          showToast={showToast}
        />
      </Suspense>
    )
  }

  return (
    <div>
      {templates.length === 0 ? (
        <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-12 text-center`}>
          <FileText className={`w-10 h-10 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-bold mt-4 ${tc.text}`}>No email templates yet</h3>
          <p className="text-slate-400 mt-1 text-sm">Run the database migration to seed default templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-5 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#4BB9EC]/15 text-[#4BB9EC]">
                  {t.email_category || 'transactional'}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`} title={t.is_active ? 'Active' : 'Inactive'} />
              </div>
              <h3 className={`text-base font-bold ${tc.text} mb-1`}>{typeLabels[t.type] || t.title || t.type}</h3>
              <p className="text-xs text-slate-400 mb-4 flex-1">{t.description || 'No description'}</p>
              <button
                onClick={() => setEditingTemplate(t)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${isDark ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-[#EDEEF1]'}`}
              >
                Edit Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TEMPLATE EDITOR ───────────────────────────────────────────────────────────
function TemplateEditor({ template, onClose, onSave, showToast }) {
  const { organization, user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [subject, setSubject] = useState(template.email_subject_template || '')
  const [heading, setHeading] = useState(template.email_heading || '')
  const [body, setBody] = useState(template.email_body_template || '')
  const [ctaText, setCtaText] = useState(template.email_cta_text || '')
  const [ctaUrl, setCtaUrl] = useState(template.email_cta_url || '')
  const [active, setActive] = useState(template.is_active !== false)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(600)

  const variables = template.variable_reference || []

  function getPreviewHtml() {
    const branding = resolveOrgBranding(organization)
    return buildLynxEmail({
      ...branding,
      heading: heading || 'Email Heading',
      body: body || '<p>Template body content</p>',
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await supabase
        .from('notification_templates')
        .update({
          email_subject_template: subject,
          email_heading: heading,
          email_body_template: body,
          email_cta_text: ctaText || null,
          email_cta_url: ctaUrl || null,
          is_active: active,
        })
        .eq('id', template.id)
      showToast?.('Template saved!', 'success')
      onSave?.()
    } catch (err) {
      console.error('Save error:', err)
      showToast?.('Error saving template', 'error')
    }
    setSaving(false)
  }

  async function handleSendTest() {
    setSendingTest(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      if (!profile?.email) {
        showToast?.('No email found for your profile', 'error')
        setSendingTest(false)
        return
      }

      await EmailService.queueEmail('test_preview', profile.email, profile.full_name || 'Admin', {
        html_body: getPreviewHtml(),
        subject: subject || 'Template Preview',
        org_name: organization.name,
      }, organization.id, {
        subject: `[TEST] ${subject || 'Template Preview'}`,
        category: 'transactional',
        sentBy: user.id,
        sentByRole: 'admin',
        templateType: template.type,
      })
      showToast?.('Test email queued to ' + profile.email, 'success')
    } catch (err) {
      console.error('Test email error:', err)
      showToast?.('Error sending test email', 'error')
    }
    setSendingTest(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className={`text-sm font-bold ${isDark ? 'text-[#4BB9EC]' : 'text-[#4BB9EC]'}`}>
          &larr; Back to Templates
        </button>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className={tc.textMuted}>Active</span>
            <button
              onClick={() => setActive(!active)}
              className={`w-10 h-5 rounded-full transition ${active ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>
          <button
            onClick={handleSendTest}
            disabled={sendingTest}
            className={`px-4 py-2 rounded-xl border text-sm font-bold transition disabled:opacity-50 ${isDark ? 'border-white/[0.08] text-[#4BB9EC]' : 'border-[#E8ECF2] text-[#4BB9EC]'}`}
          >
            {sendingTest ? 'Sending...' : 'Send Test'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-lynx-navy-subtle text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div className="space-y-4">
          {/* Variables helper */}
          {variables.length > 0 && (
            <div className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-[#F5F6F8] border border-[#E8ECF2]'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Available Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {variables.map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-lg text-xs font-mono bg-[#4BB9EC]/10 text-[#4BB9EC]">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>Heading</label>
            <input
              type="text"
              value={heading}
              onChange={e => setHeading(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>Body</label>
            <EmailComposer content={body} onChange={setBody} placeholder="Template body..." minHeight={250} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>CTA Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
                placeholder="e.g. Open Lynx"
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none`}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold ${tc.textMuted} mb-1`}>CTA URL</label>
              <input
                type="text"
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
                placeholder="{{app_url}}"
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Live Preview</label>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewWidth(600)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${previewWidth === 600 ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : 'text-slate-400'}`}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewWidth(375)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${previewWidth === 375 ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : 'text-slate-400'}`}
              >
                Mobile
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`} style={{ width: previewWidth, maxWidth: '100%' }}>
              <iframe
                srcDoc={getPreviewHtml()}
                title="Template Preview"
                style={{ width: '100%', height: 600, border: 'none', background: '#F2F4F7' }}
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── EMAIL SETTINGS TAB ───────────────────────────────────────────────────────
function EmailSettingsTab({ showToast }) {
  const { organization, setOrganization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()

  const [senderName, setSenderName] = useState(organization?.email_sender_name || '')
  const [replyTo, setReplyTo] = useState(organization?.email_reply_to || '')
  const [headerColor, setHeaderColor] = useState(organization?.settings?.branding?.email_header_color || organization?.primary_color || '#10284C')
  const [accentColor, setAccentColor] = useState(organization?.secondary_color || '#5BCBFA')
  const [footerText, setFooterText] = useState(organization?.email_footer_text || '')
  const [socialInstagram, setSocialInstagram] = useState(organization?.email_social_instagram || '')
  const [socialFacebook, setSocialFacebook] = useState(organization?.email_social_facebook || '')
  const [socialTwitter, setSocialTwitter] = useState(organization?.email_social_twitter || '')
  const [website, setWebsite] = useState(organization?.website || '')
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(organization?.email_include_unsubscribe !== false)
  const [headerImage, setHeaderImage] = useState(organization?.email_header_image || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleHeaderImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast?.('Image must be under 2MB', 'error')
      return
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      showToast?.('Only PNG and JPG files accepted', 'error')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${organization.id}/email-header.${ext}`
      const { error } = await supabase.storage.from('email-attachments').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('email-attachments').getPublicUrl(path)
      if (urlData?.publicUrl) {
        setHeaderImage(urlData.publicUrl)
        showToast?.('Header banner uploaded', 'success')
      }
    } catch (err) {
      console.error('Header image upload error:', err)
      showToast?.('Failed to upload image', 'error')
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const currentSettings = organization.settings || {}
      const updatePayload = {
        email_sender_name: senderName || null,
        email_reply_to: replyTo || null,
        email_footer_text: footerText || null,
        email_social_facebook: socialFacebook || null,
        email_social_instagram: socialInstagram || null,
        email_social_twitter: socialTwitter || null,
        email_include_unsubscribe: includeUnsubscribe,
        email_header_image: headerImage || null,
        secondary_color: accentColor || null,
        website: website || null,
        settings: {
          ...currentSettings,
          branding: {
            ...(currentSettings.branding || {}),
            email_header_color: headerColor,
          },
        },
      }
      const { error } = await supabase.from('organizations').update(updatePayload).eq('id', organization.id)
      if (error) throw error
      setOrganization?.({ ...organization, ...updatePayload, settings: { ...currentSettings, ...updatePayload.settings } })
      showToast?.('Email settings saved!', 'success')
    } catch (err) {
      console.error('Save error:', err)
      showToast?.('Error saving settings', 'error')
    }
    setSaving(false)
  }

  function getPreviewHtml() {
    return buildLynxEmail({
      headerColor,
      headerLogo: organization?.logo_url || null,
      headerImage: headerImage || null,
      accentColor,
      senderName: senderName || organization?.name || 'Lynx',
      heading: 'Sample Email Heading',
      body: '<p>This is how your emails will look to recipients. Customize the settings on the left to see changes in real time.</p>',
      ctaText: 'Open Lynx',
      ctaUrl: '#',
      footerText: footerText || null,
      socialLinks: { website, instagram: socialInstagram, facebook: socialFacebook, twitter: socialTwitter },
      showUnsubscribe: includeUnsubscribe,
      unsubscribeUrl: '#unsubscribe',
    })
  }

  const inputCls = `w-full px-4 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-[#F5F6F8] border-[#E8ECF2] text-[#10284C]'} border outline-none focus:border-[#4BB9EC]`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Settings Form */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-bold ${tc.text}`}>Email Branding</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-lynx-navy-subtle text-white font-bold text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Header Banner Image */}
        <div className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'}`}>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
            Header Banner (600 x 200px recommended)
          </label>
          {headerImage ? (
            <div className="relative rounded-xl overflow-hidden mb-2">
              <img src={headerImage} alt="Email header" className="w-full h-auto max-h-48 object-cover" />
              <button
                onClick={() => setHeaderImage('')}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80"
              >
                &times;
              </button>
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${isDark ? 'border-white/[0.08]' : 'border-[#E8ECF2]'}`}>
              <Mail className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className="text-xs text-slate-400">PNG or JPG, max 2MB</p>
            </div>
          )}
          <label className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition ${isDark ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-[#EDEEF1]'}`}>
            {uploading ? 'Uploading...' : headerImage ? 'Replace Banner' : 'Upload Banner'}
            <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleHeaderImageUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* Sender & Reply */}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Sender Name</label>
          <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder={organization?.name || 'Your org name'} className={inputCls} />
          <p className="text-xs text-slate-400 mt-1">Appears as the "From" name in recipients' inboxes</p>
        </div>
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Reply-To Email</label>
          <input type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder={organization?.contact_email || 'info@yourclub.com'} className={inputCls} />
          <p className="text-xs text-slate-400 mt-1">Where replies go. Defaults to your contact email.</p>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Header Color</label>
            <div className="flex gap-2">
              <input type="color" value={headerColor} onChange={e => setHeaderColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
              <input type="text" value={headerColor} onChange={e => setHeaderColor(e.target.value)} className={`flex-1 ${inputCls}`} />
            </div>
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Button Color</label>
            <div className="flex gap-2">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
              <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} className={`flex-1 ${inputCls}`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Footer Text</label>
          <textarea value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="e.g. Black Hornets Volleyball Club · Dallas, TX" rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Social Links */}
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>Social Links</label>
          <div className="grid grid-cols-2 gap-3">
            <input type="url" value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} placeholder="Instagram URL" className={inputCls} />
            <input type="url" value={socialFacebook} onChange={e => setSocialFacebook(e.target.value)} placeholder="Facebook URL" className={inputCls} />
            <input type="url" value={socialTwitter} onChange={e => setSocialTwitter(e.target.value)} placeholder="X (Twitter) URL" className={inputCls} />
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website URL" className={inputCls} />
          </div>
        </div>

        {/* Unsubscribe Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${tc.text}`}>Include unsubscribe link</p>
            <p className="text-xs text-slate-400">Added to broadcast emails (recommended)</p>
          </div>
          <button
            onClick={() => setIncludeUnsubscribe(!includeUnsubscribe)}
            className={`w-11 h-6 rounded-full transition-colors ${includeUnsubscribe ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${includeUnsubscribe ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div>
        <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-2`}>Live Preview</label>
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
          <iframe
            srcDoc={getPreviewHtml()}
            title="Email Settings Preview"
            style={{ width: '100%', height: 650, border: 'none', background: '#F2F4F7' }}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  )
}
