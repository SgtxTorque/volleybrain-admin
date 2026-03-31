import { useState, useEffect, useMemo } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/csv-export'
import {
  XCircle, CheckCircle2, Trash2, UserMinus, UserCheck, Shield,
  Clock, FileText, Download, Filter, ChevronDown, ChevronUp,
  RefreshCw, Activity, Search, Settings, Loader2
} from '../../constants/icons'
import { ShieldOff } from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// PLATFORM AUDIT LOG — Refactored from PlatformAdminPage
// Clean professional card design, no glassmorphism
// ═══════════════════════════════════════════════════════════

const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: 'Last 7 days' },
  { id: '30days', label: 'Last 30 days' },
  { id: 'all', label: 'All Time' },
]

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'suspend_org', label: 'Suspend Organization' },
  { value: 'activate_org', label: 'Activate Organization' },
  { value: 'delete_org', label: 'Delete Organization' },
  { value: 'suspend_user', label: 'Suspend User' },
  { value: 'activate_user', label: 'Activate User' },
  { value: 'grant_super_admin', label: 'Grant Super-Admin' },
  { value: 'revoke_super_admin', label: 'Revoke Super-Admin' },
  { value: 'update_setting', label: 'Update Setting' },
]

const ACTION_ICON_MAP = {
  suspend_org: { icon: XCircle, color: '#F59E0B', bg: '#F59E0B' },
  activate_org: { icon: CheckCircle2, color: '#10B981', bg: '#10B981' },
  delete_org: { icon: Trash2, color: '#EF4444', bg: '#EF4444' },
  suspend_user: { icon: UserMinus, color: '#F59E0B', bg: '#F59E0B' },
  activate_user: { icon: UserCheck, color: '#10B981', bg: '#10B981' },
  grant_super_admin: { icon: Shield, color: '#8B5CF6', bg: '#8B5CF6' },
  revoke_super_admin: { icon: ShieldOff, color: '#EF4444', bg: '#EF4444' },
  update_setting: { icon: Settings, color: '#6366F1', bg: '#6366F1' },
}

const DEFAULT_ACTION_ICON = { icon: Activity, color: '#6B7280', bg: '#6B7280' }

function getActionMeta(actionType) {
  return ACTION_ICON_MAP[actionType] || DEFAULT_ACTION_ICON
}

function formatActionLabel(type) {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getDateRangeStart(rangeId) {
  const now = new Date()
  switch (rangeId) {
    case 'today': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return start.toISOString()
    }
    case '7days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return start.toISOString()
    }
    case '30days': {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return start.toISOString()
    }
    case 'all':
    default:
      return null
  }
}

function getTargetName(log) {
  if (log.details?.org_name) return log.details.org_name
  if (log.details?.user_name) return log.details.user_name
  if (log.details?.email) return log.details.email
  return log.target_id ? `ID: ${log.target_id.slice(0, 8)}...` : '--'
}

function getTargetType(log) {
  if (log.target_type === 'organization') return 'Organization'
  if (log.target_type === 'user') return 'User'
  return log.target_type || '--'
}

// ═══════ MAIN COMPONENT ═══════
function PlatformAuditLog({ showToast }) {
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [dateRange, setDateRange] = useState('30days')
  const [actionFilter, setActionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showFilters, setShowFilters] = useState(true)
  // Export date range
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')

  useEffect(() => { loadLogs() }, [dateRange, actionFilter])

  async function loadLogs(offset = 0, append = false) {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    try {
      let query = supabase
        .from('platform_admin_actions')
        .select('*, profiles:admin_id(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + 99)

      const rangeStart = getDateRangeStart(dateRange)
      if (rangeStart) {
        query = query.gte('created_at', rangeStart)
      }

      if (actionFilter) {
        query = query.eq('action_type', actionFilter)
      }

      const { data, error, count } = await query
      if (error) throw error
      if (append) {
        setLogs(prev => [...prev, ...(data || [])])
      } else {
        setLogs(data || [])
      }
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Audit log error:', err)
      if (showToast) showToast('Failed to load audit log', 'error')
    }
    setLoading(false)
    setLoadingMore(false)
  }

  function handleLoadMore() {
    loadLogs(logs.length, true)
  }

  // Client-side search filter
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs
    const q = searchQuery.toLowerCase()
    return logs.filter(log =>
      formatActionLabel(log.action_type).toLowerCase().includes(q) ||
      getTargetName(log).toLowerCase().includes(q) ||
      log.profiles?.full_name?.toLowerCase().includes(q) ||
      log.profiles?.email?.toLowerCase().includes(q) ||
      log.target_type?.toLowerCase().includes(q)
    )
  }, [logs, searchQuery])

  function getExportData() {
    let data = filteredLogs
    if (exportFrom) {
      data = data.filter(l => l.created_at >= exportFrom)
    }
    if (exportTo) {
      const toDate = new Date(exportTo)
      toDate.setDate(toDate.getDate() + 1)
      data = data.filter(l => l.created_at < toDate.toISOString())
    }
    return data
  }

  function handleExportCSV() {
    const data = getExportData()
    if (data.length === 0) {
      if (showToast) showToast('No data to export', 'error')
      return
    }

    const columns = [
      { label: 'Timestamp', accessor: row => new Date(row.created_at).toLocaleString() },
      { label: 'Action', accessor: row => formatActionLabel(row.action_type) },
      { label: 'Action Type (raw)', accessor: row => row.action_type || '' },
      { label: 'Target Type', accessor: row => getTargetType(row) },
      { label: 'Target Name', accessor: row => getTargetName(row) },
      { label: 'Target ID', accessor: row => row.target_id || '' },
      { label: 'Performed By', accessor: row => row.profiles?.full_name || row.profiles?.email || 'Unknown' },
      { label: 'IP Address', accessor: row => row.ip_address || '' },
      { label: 'User Agent', accessor: row => row.user_agent || '' },
      { label: 'Old Values', accessor: row => row.old_values ? JSON.stringify(row.old_values) : '' },
      { label: 'New Values', accessor: row => row.new_values ? JSON.stringify(row.new_values) : '' },
      { label: 'Details', accessor: row => row.details ? JSON.stringify(row.details) : '' },
    ]

    exportToCSV(data, 'platform_audit_log', columns)
    if (showToast) showToast('Audit log exported', 'success')
  }

  function handleExportJSON() {
    const data = getExportData()
    if (data.length === 0) {
      if (showToast) showToast('No data to export', 'error')
      return
    }
    const rows = data.map(row => ({
      timestamp: row.created_at,
      action: row.action_type,
      target_type: row.target_type,
      target_name: getTargetName(row),
      target_id: row.target_id,
      performed_by: row.profiles?.full_name || row.profiles?.email || 'Unknown',
      ip_address: row.ip_address || null,
      user_agent: row.user_agent || null,
      old_values: row.old_values || null,
      new_values: row.new_values || null,
      details: row.details || null,
    }))
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `platform_audit_log_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    if (showToast) showToast('Audit log exported as JSON', 'success')
  }

  // Card base classes (no glassmorphism)
  const cardCls = `rounded-[14px] shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${tc.text} flex items-center gap-2`}>
            <FileText className="w-5 h-5" style={{ color: accent.primary }} />
            Audit Log
          </h2>
          <p className={`text-sm ${tc.textMuted} mt-0.5`}>
            {filteredLogs.length} entr{filteredLogs.length === 1 ? 'y' : 'ies'}
            {dateRange !== 'all' && ` \u00B7 ${DATE_RANGES.find(r => r.id === dateRange)?.label}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium border transition ${
              isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={loadLogs}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium border transition ${
              isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: accent.primary }}
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-sm font-medium border transition ${
              isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className={`${cardCls} p-4`}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by action, target, or admin..."
                className={`w-full pl-10 pr-4 py-2 rounded-[10px] text-sm border focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
                style={{ '--tw-ring-color': `${accent.primary}50` }}
              />
            </div>

            {/* Date range pills */}
            <div className="flex items-center gap-1">
              {DATE_RANGES.map(range => {
                const active = dateRange === range.id
                return (
                  <button
                    key={range.id}
                    onClick={() => setDateRange(range.id)}
                    className={`px-3 py-2 rounded-[10px] text-sm font-medium transition whitespace-nowrap ${
                      active
                        ? 'text-white shadow-sm'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    style={active ? { background: accent.primary } : {}}
                  >
                    {range.label}
                  </button>
                )
              })}
            </div>

            {/* Action type dropdown */}
            <div className="relative">
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className={`appearance-none w-full sm:w-48 pl-3 pr-8 py-2 rounded-[10px] text-sm border focus:outline-none focus:ring-2 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
                style={{ '--tw-ring-color': `${accent.primary}50` }}
              >
                {ACTION_TYPES.map(at => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${tc.textMuted}`} />
            </div>
          </div>

          {/* Export date range */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <span className={`text-xs font-medium ${tc.textMuted} whitespace-nowrap`}>Export range:</span>
            <input
              type="date"
              value={exportFrom}
              onChange={e => setExportFrom(e.target.value)}
              className={`px-2 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
            <span className={`text-xs ${tc.textMuted}`}>to</span>
            <input
              type="date"
              value={exportTo}
              onChange={e => setExportTo(e.target.value)}
              className={`px-2 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
            {(exportFrom || exportTo) && (
              <button
                onClick={() => { setExportFrom(''); setExportTo('') }}
                className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'} transition`}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
          />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className={`${cardCls} p-10 text-center`}>
          <FileText className={`w-12 h-12 mx-auto mb-3 ${tc.textMuted}`} />
          <p className={`text-base font-medium ${tc.text} mb-1`}>No audit entries found</p>
          <p className={`text-sm ${tc.textMuted}`}>
            {searchQuery || actionFilter
              ? 'Try adjusting your filters or search query.'
              : 'Actions performed on the platform will appear here.'}
          </p>
        </div>
      ) : (
        <div className={`${cardCls} overflow-hidden`}>
          {/* Table header */}
          <div className={`hidden lg:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_40px] gap-4 px-5 py-3 border-b ${
            isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
          }`}>
            <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>Action</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>Target</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>Performed By</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted}`}>When</span>
            <span />
          </div>

          {/* Log rows */}
          <div className={`divide-y ${isDark ? 'divide-slate-700/60' : 'divide-slate-100'}`}>
            {filteredLogs.map(log => {
              const { icon: ActionIcon, color } = getActionMeta(log.action_type)
              const isExpanded = expandedId === log.id
              const targetName = getTargetName(log)
              const targetType = getTargetType(log)
              const performedBy = log.profiles?.full_name || log.profiles?.email || 'Unknown admin'

              return (
                <div key={log.id}>
                  {/* Main row */}
                  <div
                    className={`px-5 py-3.5 flex items-center gap-4 cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {/* Action icon + label */}
                    <div className="flex items-center gap-3 flex-1 min-w-0 lg:flex-[2]">
                      <div
                        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <ActionIcon className="w-4.5 h-4.5" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${tc.text} truncate`}>
                          {formatActionLabel(log.action_type)}
                        </p>
                        <p className={`text-xs ${tc.textMuted} lg:hidden mt-0.5`}>
                          {targetType}: {targetName}
                        </p>
                      </div>
                    </div>

                    {/* Target (desktop only) */}
                    <div className="hidden lg:block flex-[1.5] min-w-0">
                      <p className={`text-sm ${tc.text} truncate`}>{targetName}</p>
                      <p className={`text-xs ${tc.textMuted}`}>{targetType}</p>
                    </div>

                    {/* Performed by (desktop only) */}
                    <div className="hidden lg:block flex-[1.5] min-w-0">
                      <p className={`text-sm ${tc.textSecondary} truncate`}>{performedBy}</p>
                    </div>

                    {/* Timestamp */}
                    <div className="hidden lg:flex items-center gap-1.5 flex-1 shrink-0">
                      <Clock className={`w-3.5 h-3.5 ${tc.textMuted} shrink-0`} />
                      <span className={`text-xs ${tc.textMuted} whitespace-nowrap`}>
                        {timeAgo(log.created_at)}
                      </span>
                    </div>

                    {/* Mobile timestamp + expand chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${tc.textMuted} lg:hidden whitespace-nowrap`}>
                        {timeAgo(log.created_at)}
                      </span>
                      <div className="w-5 flex items-center justify-center">
                        {isExpanded
                          ? <ChevronUp className={`w-4 h-4 ${tc.textMuted}`} />
                          : <ChevronDown className={`w-4 h-4 ${tc.textMuted}`} />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className={`px-5 pb-4 pt-1 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/60'}`}>
                      <div className={`rounded-[10px] p-4 border ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                      }`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Action Type</span>
                            <p className={`${tc.text} mt-0.5`}>{log.action_type}</p>
                          </div>
                          <div>
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Target Type</span>
                            <p className={`${tc.text} mt-0.5`}>{targetType}</p>
                          </div>
                          <div>
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Target ID</span>
                            <p className={`${tc.text} mt-0.5 font-mono text-xs break-all`}>{log.target_id || '--'}</p>
                          </div>
                          <div>
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Admin ID</span>
                            <p className={`${tc.text} mt-0.5 font-mono text-xs break-all`}>{log.admin_id || '--'}</p>
                          </div>
                          <div>
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Performed By</span>
                            <p className={`${tc.text} mt-0.5`}>{performedBy}</p>
                            {log.profiles?.email && log.profiles?.full_name && (
                              <p className={`${tc.textMuted} text-xs`}>{log.profiles.email}</p>
                            )}
                          </div>
                          <div>
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Timestamp</span>
                            <p className={`${tc.text} mt-0.5`}>
                              {new Date(log.created_at).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </p>
                          </div>
                          {log.ip_address && (
                            <div>
                              <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>IP Address</span>
                              <p className={`${tc.text} mt-0.5 font-mono text-xs`}>{log.ip_address}</p>
                            </div>
                          )}
                          {log.user_agent && (
                            <div className="sm:col-span-2">
                              <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>User Agent</span>
                              <p className={`${tc.textSecondary} mt-0.5 text-xs break-all`}>{log.user_agent}</p>
                            </div>
                          )}
                        </div>

                        {/* Diff display for changes */}
                        {(log.old_values !== null && log.old_values !== undefined) || (log.new_values !== null && log.new_values !== undefined) ? (
                          <div className="mt-4">
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Changes</span>
                            <div className={`mt-1.5 rounded-lg overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                              {(() => {
                                const oldV = log.old_values
                                const newV = log.new_values
                                const isOldObj = typeof oldV === 'object' && oldV !== null
                                const isNewObj = typeof newV === 'object' && newV !== null
                                if (isOldObj || isNewObj) {
                                  const oldObj = isOldObj ? oldV : {}
                                  const newObj = isNewObj ? newV : {}
                                  const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])]
                                  return allKeys.map(k => (
                                    <div key={k} className={`flex items-stretch text-xs font-mono border-b last:border-b-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                      <div className={`w-28 shrink-0 px-3 py-2 font-semibold ${tc.textMuted} ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                        {k}
                                      </div>
                                      <div className={`flex-1 px-3 py-2 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                                        {oldObj[k] !== undefined ? String(oldObj[k]) : '\u2014'}
                                      </div>
                                      <div className={`w-8 flex items-center justify-center ${tc.textMuted} ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>\u2192</div>
                                      <div className={`flex-1 px-3 py-2 ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                        {newObj[k] !== undefined ? String(newObj[k]) : '\u2014'}
                                      </div>
                                    </div>
                                  ))
                                }
                                return (
                                  <div className="flex items-stretch text-xs font-mono">
                                    <div className={`flex-1 px-3 py-2 ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                                      {oldV !== null && oldV !== undefined ? String(oldV) : '\u2014'}
                                    </div>
                                    <div className={`w-8 flex items-center justify-center ${tc.textMuted} ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>\u2192</div>
                                    <div className={`flex-1 px-3 py-2 ${isDark ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                      {newV !== null && newV !== undefined ? String(newV) : '\u2014'}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        ) : null}

                        {/* Details JSON */}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-4">
                            <span className={`text-xs font-semibold uppercase ${tc.textMuted}`}>Details</span>
                            <div className={`mt-1.5 rounded-lg p-3 font-mono text-xs overflow-x-auto ${
                              isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex gap-2 py-0.5">
                                  <span className={tc.textMuted}>{key}:</span>
                                  <span className={tc.text}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className={`px-5 py-3 border-t flex flex-col items-center gap-2 ${
            isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
          }`}>
            <p className={`text-xs ${tc.textMuted}`}>
              Showing {logs.length} of {totalCount} entr{totalCount === 1 ? 'y' : 'ies'}
              {searchQuery && ` (${filteredLogs.length} matching filter)`}
            </p>
            {logs.length < totalCount && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] text-sm font-medium border transition ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${totalCount - logs.length} remaining)`
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export { PlatformAuditLog }
export default PlatformAuditLog
