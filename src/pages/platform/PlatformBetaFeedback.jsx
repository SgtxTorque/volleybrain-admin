import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// ═══════════════════════════════════════════════════════════
// PLATFORM ADMIN — Beta Feedback Dashboard
// View all feedback from web + mobile beta testers
// ═══════════════════════════════════════════════════════════

const TYPE_BADGES = {
  reaction: { label: 'Reaction', bg: 'bg-sky-100', text: 'text-sky-700' },
  comment: { label: 'Comment', bg: 'bg-purple-100', text: 'text-purple-700' },
  bug: { label: 'Bug', bg: 'bg-red-100', text: 'text-red-700' },
}

const STATUS_BADGES = {
  new: { label: 'New', bg: 'bg-amber-100', text: 'text-amber-700' },
  reviewed: { label: 'Reviewed', bg: 'bg-blue-100', text: 'text-blue-700' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  dismissed: { label: 'Dismissed', bg: 'bg-slate-100', text: 'text-slate-500' },
}

const SENTIMENT_EMOJIS = {
  love: '\u{1F60D}',
  like: '\u{1F44D}',
  confused: '\u{1F615}',
  frustrated: '\u{1F624}',
  broken: '\u{1F41B}',
}

const ROLE_BADGES = {
  admin: { label: 'Admin', color: 'text-indigo-600' },
  coach: { label: 'Coach', color: 'text-emerald-600' },
  parent: { label: 'Parent', color: 'text-sky-600' },
  player: { label: 'Player', color: 'text-amber-600' },
  team_manager: { label: 'Team Mgr', color: 'text-purple-600' },
  anonymous: { label: 'Anonymous', color: 'text-slate-400' },
  unknown: { label: 'Unknown', color: 'text-slate-400' },
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const PAGE_SIZE = 25

export default function PlatformBetaFeedback({ showToast }) {
  const { isDark } = useTheme()
  const { user } = useAuth()

  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Pagination
  const [page, setPage] = useState(0)

  // Inline notes
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteText, setNoteText] = useState('')

  // Expanded device info
  const [expandedId, setExpandedId] = useState(null)

  // Stats
  const [stats, setStats] = useState({ total: 0, new: 0, bugs: 0, thisWeek: 0 })

  // ── Load stats ──
  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const now = new Date()
    const weekAgo = new Date(now - 7 * 86400000).toISOString()

    const [totalRes, newRes, bugRes, weekRes] = await Promise.all([
      supabase.from('beta_feedback').select('*', { count: 'exact', head: true }),
      supabase.from('beta_feedback').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('beta_feedback').select('*', { count: 'exact', head: true }).eq('feedback_type', 'bug'),
      supabase.from('beta_feedback').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    ])

    setStats({
      total: totalRes.count || 0,
      new: newRes.count || 0,
      bugs: bugRes.count || 0,
      thisWeek: weekRes.count || 0,
    })
  }

  // ── Load feedback ──
  useEffect(() => {
    loadFeedback()
  }, [typeFilter, statusFilter, roleFilter, platformFilter, dateFilter, page])

  async function loadFeedback() {
    setLoading(true)
    let query = supabase
      .from('beta_feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (typeFilter !== 'all') query = query.eq('feedback_type', typeFilter)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (roleFilter !== 'all') query = query.eq('user_role', roleFilter)
    if (platformFilter !== 'all') query = query.eq('platform', platformFilter)

    if (dateFilter === '7days') {
      query = query.gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
    } else if (dateFilter === '30days') {
      query = query.gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
    }

    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    const { data, count, error } = await query
    if (error) {
      console.error('Failed to load feedback:', error)
      showToast?.('Failed to load feedback', 'error')
    }
    setFeedback(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }

  // ── Status update ──
  async function updateStatus(id, newStatus) {
    const updates = {
      status: newStatus,
      resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      resolved_by: newStatus === 'resolved' ? user?.id : null,
    }
    const { error } = await supabase.from('beta_feedback').update(updates).eq('id', id)
    if (error) {
      showToast?.('Failed to update status', 'error')
      return
    }
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
    loadStats()
    showToast?.(`Marked as ${newStatus}`, 'success')
  }

  // ── Save note ──
  async function saveNote(id) {
    const { error } = await supabase.from('beta_feedback').update({ admin_notes: noteText.trim() || null }).eq('id', id)
    if (error) {
      showToast?.('Failed to save note', 'error')
      return
    }
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, admin_notes: noteText.trim() || null } : f))
    setEditingNoteId(null)
    setNoteText('')
    showToast?.('Note saved', 'success')
  }

  // ── Theme helpers ──
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white'
  const cardBorder = isDark ? 'border-white/[0.06]' : 'border-slate-200'
  const textPrimary = isDark ? 'text-slate-200' : 'text-slate-800'
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500'
  const inputBg = isDark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-200 text-slate-700'

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Beta Feedback</h1>
        <p className={`text-sm ${textSecondary} mt-1`}>All feedback from web and mobile beta testers</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-600' },
          { label: 'New', value: stats.new, color: 'text-amber-600' },
          { label: 'Bugs', value: stats.bugs, color: 'text-red-600' },
          { label: 'This Week', value: stats.thisWeek, color: 'text-sky-600' },
        ].map(s => (
          <div key={s.label} className={`${cardBg} border ${cardBorder} rounded-[14px] p-4`}>
            <p className={`text-sm ${textSecondary}`}>{s.label}</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Type tabs */}
        <div className="flex rounded-[14px] border border-slate-200 overflow-hidden text-sm">
          {['all', 'reaction', 'comment', 'bug'].map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(0) }}
              className={`px-3 py-1.5 capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-[#4BB9EC] text-white font-semibold'
                  : `${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`
              }`}
            >
              {t === 'all' ? 'All' : t === 'reaction' ? 'Reactions' : t === 'comment' ? 'Comments' : 'Bugs'}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className={`text-sm rounded-[14px] px-3 py-1.5 border ${inputBg}`}>
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        {/* Role dropdown */}
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(0) }}
          className={`text-sm rounded-[14px] px-3 py-1.5 border ${inputBg}`}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="coach">Coach</option>
          <option value="parent">Parent</option>
          <option value="player">Player</option>
          <option value="team_manager">Team Manager</option>
          <option value="anonymous">Anonymous</option>
        </select>

        {/* Platform dropdown */}
        <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setPage(0) }}
          className={`text-sm rounded-[14px] px-3 py-1.5 border ${inputBg}`}>
          <option value="all">All Platforms</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile</option>
        </select>

        {/* Date dropdown */}
        <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(0) }}
          className={`text-sm rounded-[14px] px-3 py-1.5 border ${inputBg}`}>
          <option value="all">All Time</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>

        <span className={`text-xs ${textSecondary} ml-auto`}>{totalCount} result{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Feedback list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 rounded-full animate-spin border-slate-300 border-t-[#4BB9EC]" />
        </div>
      ) : feedback.length === 0 ? (
        <div className={`${cardBg} border ${cardBorder} rounded-[14px] p-12 text-center`}>
          <p className="text-4xl mb-3">{'\u{1F3A4}'}</p>
          <p className={`text-lg font-semibold ${textPrimary} mb-1`}>No feedback yet</p>
          <p className={`text-sm ${textSecondary}`}>
            Beta testers haven't submitted any feedback. Once they start using the app, their reactions, comments, and bug reports will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map(item => {
            const typeBadge = TYPE_BADGES[item.feedback_type] || TYPE_BADGES.comment
            const statusBadge = STATUS_BADGES[item.status] || STATUS_BADGES.new
            const roleBadge = ROLE_BADGES[item.user_role] || ROLE_BADGES.unknown
            const sentimentEmoji = item.sentiment ? SENTIMENT_EMOJIS[item.sentiment] : null
            const isBug = item.feedback_type === 'bug'
            const isNew = item.status === 'new'

            return (
              <div
                key={item.id}
                className={`${cardBg} border ${cardBorder} rounded-[14px] p-4 transition-colors
                  ${isBug ? 'border-l-4 border-l-red-400' : ''}
                  ${isNew && !isBug ? 'border-l-4 border-l-amber-400' : ''}`}
              >
                {/* Row 1: Type + Sentiment + Status */}
                <div className="flex items-center gap-2 mb-2">
                  {sentimentEmoji && <span className="text-2xl">{sentimentEmoji}</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge.bg} ${typeBadge.text}`}>
                    {typeBadge.label}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text} ml-auto`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Message */}
                {item.message && (
                  <p className={`text-sm ${isNew ? `font-semibold ${textPrimary}` : textSecondary} mb-2 whitespace-pre-wrap`}>
                    {item.message}
                  </p>
                )}

                {/* Admin notes */}
                {item.admin_notes && editingNoteId !== item.id && (
                  <div className={`text-xs px-3 py-2 rounded-lg mb-2 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} ${textSecondary}`}>
                    <span className="font-semibold">Note:</span> {item.admin_notes}
                  </div>
                )}

                {/* Meta line */}
                <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${textSecondary}`}>
                  <span className={`font-medium ${roleBadge.color}`}>{item.user_name || 'Anonymous'}</span>
                  <span>{'\u00B7'}</span>
                  <span className={roleBadge.color}>{roleBadge.label}</span>
                  {item.screen_name && (
                    <>
                      <span>{'\u00B7'}</span>
                      <span>{item.screen_name}</span>
                    </>
                  )}
                  <span>{'\u00B7'}</span>
                  <span className="uppercase">{item.platform}</span>
                  <span>{'\u00B7'}</span>
                  <span>{timeAgo(item.created_at)}</span>
                  {item.user_email && (
                    <>
                      <span>{'\u00B7'}</span>
                      <span className="text-slate-400">{item.user_email}</span>
                    </>
                  )}
                </div>

                {/* Device info toggle */}
                {item.device_info && Object.keys(item.device_info).length > 0 && (
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className={`text-xs mt-1 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
                  >
                    {expandedId === item.id ? 'Hide device info' : 'Show device info'}
                  </button>
                )}
                {expandedId === item.id && item.device_info && (
                  <pre className={`text-xs mt-1 p-2 rounded-lg overflow-x-auto ${isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                    {JSON.stringify(item.device_info, null, 2)}
                  </pre>
                )}

                {/* Inline note editor */}
                {editingNoteId === item.id && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                      className={`flex-1 text-sm px-3 py-1.5 rounded-[14px] border ${inputBg} outline-none focus:border-[#4BB9EC]`}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveNote(item.id); if (e.key === 'Escape') setEditingNoteId(null) }}
                    />
                    <button onClick={() => saveNote(item.id)} className="px-3 py-1.5 rounded-[14px] bg-[#4BB9EC] text-white text-sm font-semibold">Save</button>
                    <button onClick={() => setEditingNoteId(null)} className={`px-3 py-1.5 rounded-[14px] text-sm ${textSecondary} hover:bg-slate-100`}>Cancel</button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.status !== 'reviewed' && (
                    <button onClick={() => updateStatus(item.id, 'reviewed')}
                      className={`text-xs px-2.5 py-1 rounded-full border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-colors`}>
                      Mark Reviewed
                    </button>
                  )}
                  {item.status !== 'resolved' && (
                    <button onClick={() => updateStatus(item.id, 'resolved')}
                      className="text-xs px-2.5 py-1 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors">
                      Resolve
                    </button>
                  )}
                  {item.status !== 'dismissed' && (
                    <button onClick={() => updateStatus(item.id, 'dismissed')}
                      className={`text-xs px-2.5 py-1 rounded-full border ${isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-200 text-slate-400 hover:bg-slate-50'} transition-colors`}>
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingNoteId(item.id); setNoteText(item.admin_notes || '') }}
                    className={`text-xs px-2.5 py-1 rounded-full border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} transition-colors`}>
                    {item.admin_notes ? 'Edit Note' : 'Add Note'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`text-sm px-3 py-1.5 rounded-[14px] border ${inputBg} disabled:opacity-40`}
          >
            Previous
          </button>
          <span className={`text-sm ${textSecondary}`}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={`text-sm px-3 py-1.5 rounded-[14px] border ${inputBg} disabled:opacity-40`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
