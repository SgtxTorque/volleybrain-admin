import { useState, useEffect, useRef } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  AlertCircle, Lightbulb, CreditCard, HelpCircle, MessageSquare,
  Search, X, Filter, Clock, Send, ChevronDown, ChevronRight,
  RefreshCw, Loader2, MoreVertical, ArrowLeft, User, Building2,
  CheckCircle2, AlertTriangle, Tag, Mail
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM SUPPORT INBOX — Clean professional support page
// ═══════════════════════════════════════════════════════════

const STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
]

const STATUS_COLORS = {
  open: { bg: 'bg-blue-500/15', text: 'text-blue-500', dot: 'bg-blue-500' },
  in_progress: { bg: 'bg-amber-500/15', text: 'text-amber-500', dot: 'bg-amber-500' },
  resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  closed: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
}

const PRIORITY_OPTIONS = [
  { id: 'all', label: 'All Priorities' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'normal', label: 'Normal' },
  { id: 'low', label: 'Low' },
]

const PRIORITY_COLORS = {
  urgent: { bg: 'bg-red-500/15', text: 'text-red-500', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-500', dot: 'bg-orange-500' },
  normal: { bg: 'bg-blue-500/15', text: 'text-blue-500', dot: 'bg-blue-500' },
  low: { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400' },
}

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'bug', label: 'Bug Report' },
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'billing', label: 'Billing' },
  { id: 'setup_help', label: 'Setup Help' },
  { id: 'general', label: 'General' },
]

const CATEGORY_ICONS = {
  bug: AlertCircle,
  feature_request: Lightbulb,
  billing: CreditCard,
  setup_help: HelpCircle,
  general: MessageSquare,
}

const CATEGORY_COLORS = {
  bug: 'text-red-400',
  feature_request: 'text-amber-400',
  billing: 'text-emerald-400',
  setup_help: 'text-blue-400',
  general: 'text-slate-400',
}

// ═══════ TIME AGO HELPER ═══════
function timeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// ═══════ STATUS BADGE ═══════
function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.open
  const label = status === 'in_progress' ? 'In Progress' : status?.charAt(0).toUpperCase() + status?.slice(1)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  )
}

// ═══════ PRIORITY BADGE ═══════
function PriorityBadge({ priority }) {
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal
  const label = priority?.charAt(0).toUpperCase() + priority?.slice(1)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  )
}

// ═══════ CATEGORY ICON ═══════
function CategoryIcon({ category, size = 'w-4 h-4' }) {
  const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.general
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.general
  return <Icon className={`${size} ${color}`} />
}

// ═══════ TICKET DETAIL SLIDE-OVER ═══════
function TicketDetailSlideOver({ ticket, isOpen, onClose, isDark, tc, showToast, onTicketUpdated }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && ticket?.id) loadMessages()
  }, [isOpen, ticket?.id])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('platform_support_messages')
        .select('*, profiles!sender_id(full_name, email)')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Error loading messages:', err)
      setMessages([])
    }
    setLoading(false)
  }

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('platform_support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          message: replyText.trim(),
          is_internal_note: isInternalNote,
        })

      if (error) throw error

      setReplyText('')
      setIsInternalNote(false)
      await loadMessages()
      showToast?.('Reply sent', 'success')
    } catch (err) {
      console.error('Error sending reply:', err)
      showToast?.('Failed to send reply', 'error')
    }
    setSending(false)
  }

  async function handleStatusChange(newStatus) {
    setUpdatingStatus(true)
    setShowStatusMenu(false)
    try {
      const { error } = await supabase
        .from('platform_support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (error) throw error
      showToast?.(`Status updated to ${newStatus.replace('_', ' ')}`, 'success')
      onTicketUpdated?.()
    } catch (err) {
      console.error('Error updating status:', err)
      showToast?.('Failed to update status', 'error')
    }
    setUpdatingStatus(false)
  }

  async function handlePriorityChange(newPriority) {
    setUpdatingPriority(true)
    setShowPriorityMenu(false)
    try {
      const { error } = await supabase
        .from('platform_support_tickets')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (error) throw error
      showToast?.(`Priority updated to ${newPriority}`, 'success')
      onTicketUpdated?.()
    } catch (err) {
      console.error('Error updating priority:', err)
      showToast?.('Failed to update priority', 'error')
    }
    setUpdatingPriority(false)
  }

  if (!isOpen || !ticket) return null

  const CatIcon = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS.general

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full max-w-2xl flex flex-col ${
          isDark
            ? 'bg-lynx-midnight border-l border-white/[0.08]'
            : 'bg-white border-l border-lynx-silver'
        } shadow-2xl`}
        style={{ animation: 'slideInRight .25s ease-out' }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 p-5 border-b ${
          isDark ? 'bg-slate-900/95 border-white/[0.08]' : 'bg-white/95 border-lynx-silver'
        } backdrop-blur-xl`}>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-bold ${tc.text} truncate`}>{ticket.subject}</h2>
              <div className="flex items-center gap-2 mt-1">
                <CatIcon className={`w-3.5 h-3.5 ${CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS.general}`} />
                <span className={`text-xs ${tc.textMuted}`}>
                  {CATEGORY_OPTIONS.find(c => c.id === ticket.category)?.label || ticket.category}
                </span>
                <span className={`text-xs ${tc.textMuted}`}>
                  &bull; Opened {timeAgo(ticket.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Status & Priority controls */}
          <div className="flex items-center gap-3">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowStatusMenu(!showStatusMenu); setShowPriorityMenu(false) }}
                disabled={updatingStatus}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  isDark
                    ? 'border-white/[0.08] hover:bg-white/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <StatusBadge status={ticket.status} />
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </button>
              {showStatusMenu && (
                <div className={`absolute top-full left-0 mt-1 w-44 rounded-xl border shadow-xl z-20 py-1 ${
                  isDark ? 'bg-lynx-charcoal border-white/[0.08]' : 'bg-white border-slate-200'
                }`}>
                  {STATUS_OPTIONS.filter(s => s.id !== 'all').map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleStatusChange(s.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                        ticket.status === s.id
                          ? isDark ? 'bg-white/10' : 'bg-slate-100'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                      } ${tc.text}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s.id]?.dot}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowStatusMenu(false) }}
                disabled={updatingPriority}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  isDark
                    ? 'border-white/[0.08] hover:bg-white/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PriorityBadge priority={ticket.priority} />
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </button>
              {showPriorityMenu && (
                <div className={`absolute top-full left-0 mt-1 w-40 rounded-xl border shadow-xl z-20 py-1 ${
                  isDark ? 'bg-lynx-charcoal border-white/[0.08]' : 'bg-white border-slate-200'
                }`}>
                  {PRIORITY_OPTIONS.filter(p => p.id !== 'all').map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePriorityChange(p.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                        ticket.priority === p.id
                          ? isDark ? 'bg-white/10' : 'bg-slate-100'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                      } ${tc.text}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[p.id]?.dot}`} />
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket meta */}
          <div className={`flex items-center gap-4 mt-3 text-xs ${tc.textMuted}`}>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {ticket.organizations?.name || 'Unknown Org'}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {ticket.profiles?.full_name || 'Unknown User'}
            </span>
            {ticket.profiles?.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {ticket.profiles.email}
              </span>
            )}
          </div>
        </div>

        {/* Messages thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Original ticket description */}
          {ticket.description && (
            <div className={`rounded-[14px] p-4 border ${
              isDark ? 'bg-[#1E293B] border-white/[0.06]' : 'bg-white border-slate-200'
            } shadow-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {(ticket.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className={`text-sm font-semibold ${tc.text}`}>
                    {ticket.profiles?.full_name || 'Unknown'}
                  </span>
                  <span className={`text-xs ${tc.textMuted} ml-2`}>{timeAgo(ticket.created_at)}</span>
                </div>
              </div>
              <p className={`text-sm ${tc.textSecondary} whitespace-pre-wrap`}>{ticket.description}</p>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--accent-primary)' }} />
              <p className={`text-sm ${tc.textMuted}`}>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-sm ${tc.textMuted}`}>No replies yet. Send the first response below.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-[14px] p-4 border shadow-sm ${
                  msg.is_internal_note
                    ? isDark
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-amber-50 border-amber-200'
                    : isDark
                      ? 'bg-[#1E293B] border-white/[0.06]'
                      : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    msg.is_internal_note ? 'bg-amber-500' : ''
                  }`}
                    style={msg.is_internal_note ? {} : { background: 'var(--accent-primary)' }}
                  >
                    {(msg.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${tc.text}`}>
                      {msg.profiles?.full_name || 'Unknown'}
                    </span>
                    {msg.is_internal_note && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                        Internal Note
                      </span>
                    )}
                    <span className={`text-xs ${tc.textMuted}`}>{timeAgo(msg.created_at)}</span>
                  </div>
                </div>
                <p className={`text-sm ${tc.textSecondary} whitespace-pre-wrap`}>{msg.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply composer */}
        <div className={`border-t p-4 ${
          isDark ? 'bg-slate-900/80 border-white/[0.08]' : 'bg-slate-50 border-slate-200'
        }`}>
          {/* Internal note toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsInternalNote(false)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                !isInternalNote
                  ? 'bg-[var(--accent-primary)] text-white'
                  : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Reply
            </button>
            <button
              onClick={() => setIsInternalNote(true)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                isInternalNote
                  ? 'bg-amber-500 text-white'
                  : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Internal Note
            </button>
          </div>

          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={isInternalNote ? 'Write an internal note (only visible to staff)...' : 'Type your reply...'}
              rows={2}
              className={`flex-1 px-3 py-2 rounded-xl text-sm resize-none ${tc.input} border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50`}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply()
              }}
            />
            <button
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className="self-end p-2.5 rounded-xl bg-[var(--accent-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className={`text-xs ${tc.textMuted} mt-1.5`}>Ctrl+Enter to send</p>
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
// MAIN COMPONENT: PlatformSupport
// ═══════════════════════════════════════════════════════════
function PlatformSupport({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  // Data state
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail state
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Dropdown visibility
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    setLoading(true)
    setLoadError(null)
    try {
      const { data, error } = await supabase
        .from('platform_support_tickets')
        .select('*, organizations(name), profiles!submitted_by(full_name, email)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      console.error('Error loading support tickets:', err)
      // Gracefully handle missing table
      if (err.message?.includes('relation') || err.code === '42P01' || err.message?.includes('does not exist')) {
        setLoadError('table_missing')
      } else {
        setLoadError('generic')
      }
      setTickets([])
    }
    setLoading(false)
  }

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchSubject = t.subject?.toLowerCase().includes(q)
      const matchOrg = t.organizations?.name?.toLowerCase().includes(q)
      const matchUser = t.profiles?.full_name?.toLowerCase().includes(q)
      const matchEmail = t.profiles?.email?.toLowerCase().includes(q)
      if (!matchSubject && !matchOrg && !matchUser && !matchEmail) return false
    }
    return true
  })

  // Counts for status pills
  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }

  function handleTicketClick(ticket) {
    setSelectedTicket(ticket)
    setDetailOpen(true)
  }

  function handleDetailClose() {
    setDetailOpen(false)
    setTimeout(() => setSelectedTicket(null), 300)
  }

  function handleTicketUpdated() {
    loadTickets()
  }

  // ── RENDER ──
  return (
    <div className={`min-h-screen ${tc.pageBg}`}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${tc.text}`}>Support Inbox</h1>
            <p className={`text-sm ${tc.textMuted} mt-1`}>
              Manage support tickets from organizations across the platform
            </p>
          </div>
          <button
            onClick={loadTickets}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/[0.08]'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {STATUS_OPTIONS.map(s => {
            const isActive = statusFilter === s.id
            const count = statusCounts[s.id]
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                    : isDark
                      ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/[0.06]'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {s.label}
                <span className={`text-xs font-bold ${
                  isActive ? 'text-white/80' : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tickets, orgs, users..."
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>
            )}
          </div>

          {/* Priority filter dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowPriorityDropdown(!showPriorityDropdown); setShowCategoryDropdown(false) }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                priorityFilter !== 'all'
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                  : isDark
                    ? 'bg-white/5 text-slate-400 hover:bg-white/10 border-white/[0.08]'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              {PRIORITY_OPTIONS.find(p => p.id === priorityFilter)?.label}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showPriorityDropdown && (
              <div className={`absolute top-full left-0 mt-1 w-44 rounded-xl border shadow-xl z-30 py-1 ${
                isDark ? 'bg-lynx-charcoal border-white/[0.08]' : 'bg-white border-slate-200'
              }`}>
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setPriorityFilter(p.id); setShowPriorityDropdown(false) }}
                    className={`w-full text-left px-3 py-2 text-sm transition ${
                      priorityFilter === p.id
                        ? isDark ? 'bg-white/10' : 'bg-slate-100'
                        : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                    } ${tc.text}`}
                  >
                    {p.id !== 'all' && (
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${PRIORITY_COLORS[p.id]?.dot}`} />
                    )}
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category filter dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowPriorityDropdown(false) }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition ${
                categoryFilter !== 'all'
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
                  : isDark
                    ? 'bg-white/5 text-slate-400 hover:bg-white/10 border-white/[0.08]'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              {CATEGORY_OPTIONS.find(c => c.id === categoryFilter)?.label}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showCategoryDropdown && (
              <div className={`absolute top-full left-0 mt-1 w-48 rounded-xl border shadow-xl z-30 py-1 ${
                isDark ? 'bg-lynx-charcoal border-white/[0.08]' : 'bg-white border-slate-200'
              }`}>
                {CATEGORY_OPTIONS.map(c => {
                  const CIcon = CATEGORY_ICONS[c.id]
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setCategoryFilter(c.id); setShowCategoryDropdown(false) }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                        categoryFilter === c.id
                          ? isDark ? 'bg-white/10' : 'bg-slate-100'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                      } ${tc.text}`}
                    >
                      {CIcon && <CIcon className={`w-4 h-4 ${CATEGORY_COLORS[c.id] || ''}`} />}
                      {c.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active filter clear */}
          {(priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => { setPriorityFilter('all'); setCategoryFilter('all'); setSearchQuery('') }}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
            <p className={`text-sm ${tc.textMuted}`}>Loading support tickets...</p>
          </div>
        ) : loadError === 'table_missing' ? (
          // Table doesn't exist yet — friendly empty state
          <div className="py-20 text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-lynx-charcoal/60' : 'bg-slate-100'
            }`}>
              <HelpCircle className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-lg font-bold ${tc.text} mb-1`}>Support system not set up yet</h3>
            <p className={`text-sm ${tc.textMuted} max-w-md mx-auto`}>
              The platform_support_tickets table has not been created in the database.
              Run the migration to enable the support inbox.
            </p>
          </div>
        ) : loadError === 'generic' ? (
          <div className="py-20 text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-red-500/10' : 'bg-red-50'
            }`}>
              <AlertTriangle className={`w-10 h-10 text-red-400`} />
            </div>
            <h3 className={`text-lg font-bold ${tc.text} mb-1`}>Failed to load tickets</h3>
            <p className={`text-sm ${tc.textMuted} max-w-md mx-auto mb-4`}>
              Something went wrong while fetching support tickets. Please try again.
            </p>
            <button
              onClick={loadTickets}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:brightness-110 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredTickets.length === 0 && tickets.length === 0 ? (
          // No tickets at all
          <div className="py-20 text-center">
            <div className={`mx-auto mb-4 w-20 h-20 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-lynx-charcoal/60' : 'bg-slate-100'
            }`}>
              <MessageSquare className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-lg font-bold ${tc.text} mb-1`}>No support tickets yet</h3>
            <p className={`text-sm ${tc.textMuted} max-w-md mx-auto`}>
              When organizations submit support requests, they will appear here.
              You will be able to track, reply, and resolve each ticket.
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          // Filters returned nothing
          <div className="py-16 text-center">
            <Search className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <h3 className={`text-base font-bold ${tc.text} mb-1`}>No tickets match your filters</h3>
            <p className={`text-sm ${tc.textMuted}`}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); setSearchQuery('') }}
              className={`mt-3 text-sm font-medium hover:underline`}
              style={{ color: 'var(--accent-primary)' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Results count */}
            <p className={`text-xs font-medium ${tc.textMuted} mb-2`}>
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery
                ? ` (filtered from ${tickets.length})`
                : ''
              }
            </p>

            {filteredTickets.map(ticket => {
              const CatIcon = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS.general
              return (
                <button
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className={`w-full text-left rounded-[14px] p-4 border shadow-sm transition-all hover:shadow-md group ${
                    isDark
                      ? 'bg-[#1E293B] border-white/[0.06] hover:border-white/[0.12]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category icon */}
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-white/5' : 'bg-slate-100'
                    }`}>
                      <CatIcon className={`w-4.5 h-4.5 ${CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS.general}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-semibold ${tc.text} truncate`}>
                          {ticket.subject}
                        </h3>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`} />
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Org name */}
                        <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                          <Building2 className="w-3 h-3" />
                          {ticket.organizations?.name || 'Unknown Org'}
                        </span>

                        {/* Submitted by */}
                        <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                          <User className="w-3 h-3" />
                          {ticket.profiles?.full_name || 'Unknown'}
                        </span>

                        {/* Time */}
                        <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                          <Clock className="w-3 h-3" />
                          {timeAgo(ticket.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Close dropdowns on outside click */}
      {(showPriorityDropdown || showCategoryDropdown) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => { setShowPriorityDropdown(false); setShowCategoryDropdown(false) }}
        />
      )}

      {/* Ticket detail slide-over */}
      <TicketDetailSlideOver
        ticket={selectedTicket}
        isOpen={detailOpen}
        onClose={handleDetailClose}
        isDark={isDark}
        tc={tc}
        showToast={showToast}
        onTicketUpdated={handleTicketUpdated}
      />
    </div>
  )
}

export { PlatformSupport }
export default PlatformSupport
