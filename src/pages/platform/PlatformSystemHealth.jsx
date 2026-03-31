import { useState, useEffect, useCallback } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Activity, Shield, AlertTriangle, RefreshCw, Search, Filter,
  ChevronDown, ExternalLink, Clock, Zap, BarChart3, X, Check,
  Eye, Mail, Loader2, CheckCircle2, AlertCircle, ChevronUp
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM SYSTEM HEALTH — Application monitoring dashboard
// Health checks, edge functions, table stats, error log
// ═══════════════════════════════════════════════════════════

// ═══════ CONSTANTS ═══════

const HEALTH_CHECKS = [
  { name: 'User Activity', table: 'profiles', column: 'updated_at', description: 'Last user profile update' },
  { name: 'Chat Activity', table: 'chat_messages', column: 'created_at', description: 'Last chat message' },
  { name: 'Schedule Activity', table: 'schedule_events', column: 'created_at', description: 'Last event created' },
  { name: 'Payment Activity', table: 'payments', column: 'created_at', description: 'Last payment processed' },
  { name: 'Email Activity', table: 'email_notifications', column: 'created_at', description: 'Last email queued' },
  { name: 'Admin Activity', table: 'platform_admin_actions', column: 'created_at', description: 'Last PA action' },
  { name: 'Registration', table: 'registrations', column: 'created_at', description: 'Last registration' },
  { name: 'XP/Engagement', table: 'xp_ledger', column: 'created_at', description: 'Last XP award' },
]

const EDGE_FUNCTIONS = [
  { name: 'send-payment-reminder', purpose: 'Email queue processor (runs every 2min via pg_cron)', critical: true },
  { name: 'stripe-webhook', purpose: 'Handles Stripe payment events', critical: true },
  { name: 'stripe-create-checkout', purpose: 'Creates Stripe checkout sessions', critical: true },
  { name: 'stripe-create-payment-intent', purpose: 'Creates payment intents', critical: false },
  { name: 'stripe-test-connection', purpose: 'Tests Stripe API credentials', critical: false },
  { name: 'resend-webhooks', purpose: 'Tracks email delivery status', critical: true },
  { name: 'push', purpose: 'Sends mobile push notifications', critical: false },
  { name: 'notification-cron', purpose: 'Scheduled notification checks', critical: false },
]

const TRACKED_TABLES = [
  'organizations', 'profiles', 'user_roles', 'seasons', 'teams',
  'players', 'team_players', 'payments', 'registrations', 'schedule_events',
  'chat_messages', 'email_notifications', 'shoutouts', 'xp_ledger',
  'platform_admin_actions', 'platform_support_tickets', 'platform_org_health_scores',
]

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
]

const ERROR_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'js_error', label: 'JS Error' },
  { value: 'api_error', label: 'API Error' },
  { value: 'edge_function_error', label: 'Edge Function Error' },
]

// ═══════ HELPERS ═══════

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  if (diffMs < 0) return 'just now'
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

function getHealthColor(dateStr) {
  if (!dateStr) return { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400', label: 'No Data' }
  const now = new Date()
  const date = new Date(dateStr)
  const diffHours = (now - date) / (1000 * 60 * 60)
  if (diffHours < 24) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Healthy' }
  if (diffHours < 72) return { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Stale' }
  return { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400', label: 'Inactive' }
}

function formatNumber(num) {
  if (num == null) return '—'
  return num.toLocaleString()
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ═══════ COMPONENT ═══════

export default function PlatformSystemHealth({ showToast }) {
  const { isDark, accent } = useTheme()
  const tc = useThemeClasses()
  const { user } = useAuth()

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [healthResults, setHealthResults] = useState({})
  const [tableStats, setTableStats] = useState({})
  const [tableSortDir, setTableSortDir] = useState('desc') // sort by count
  const [tableSortField, setTableSortField] = useState('count') // 'name' or 'count'
  const [errorLogs, setErrorLogs] = useState([])
  const [errorLogsLoading, setErrorLogsLoading] = useState(false)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [errorTypeFilter, setErrorTypeFilter] = useState('all')
  const [expandedErrors, setExpandedErrors] = useState({})
  const [testingFunction, setTestingFunction] = useState(null)

  // ═══════ DATA LOADING ═══════

  const loadHealthChecks = useCallback(async () => {
    const results = {}
    await Promise.all(
      HEALTH_CHECKS.map(async (check) => {
        try {
          const { data, error } = await supabase
            .from(check.table)
            .select(check.column)
            .order(check.column, { ascending: false })
            .limit(1)
            .single()
          if (error) {
            results[check.name] = { value: null, error: error.message }
          } else {
            results[check.name] = { value: data?.[check.column] || null, error: null }
          }
        } catch (err) {
          results[check.name] = { value: null, error: err.message }
        }
      })
    )
    setHealthResults(results)
  }, [])

  const loadTableStats = useCallback(async () => {
    const stats = {}
    await Promise.all(
      TRACKED_TABLES.map(async (table) => {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
          if (error) {
            stats[table] = { count: null, error: 'Access denied' }
          } else {
            stats[table] = { count: count ?? 0, error: null }
          }
        } catch (err) {
          stats[table] = { count: null, error: 'Access denied' }
        }
      })
    )
    setTableStats(stats)
  }, [])

  const loadErrorLogs = useCallback(async () => {
    setErrorLogsLoading(true)
    try {
      let query = supabase
        .from('platform_error_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter)
      }
      if (errorTypeFilter !== 'all') {
        query = query.eq('error_type', errorTypeFilter)
      }

      const { data, error } = await query
      if (error) {
        // Table might not exist yet
        setErrorLogs([])
      } else {
        setErrorLogs(data || [])
      }
    } catch {
      setErrorLogs([])
    }
    setErrorLogsLoading(false)
  }, [severityFilter, errorTypeFilter])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      loadHealthChecks(),
      loadTableStats(),
      loadErrorLogs(),
    ])
    setLoading(false)
  }, [loadHealthChecks, loadTableStats, loadErrorLogs])

  useEffect(() => {
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload error logs when filters change
  useEffect(() => {
    if (!loading) {
      loadErrorLogs()
    }
  }, [severityFilter, errorTypeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRefreshAll() {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
    showToast?.('All health checks refreshed', 'success')
  }

  async function handleTestStripeConnection() {
    setTestingFunction('stripe-test-connection')
    try {
      const { data, error } = await supabase.functions.invoke('stripe-test-connection')
      if (error) {
        showToast?.(`Stripe test failed: ${error.message}`, 'error')
      } else {
        showToast?.('Stripe connection test passed', 'success')
      }
    } catch (err) {
      showToast?.(`Stripe test error: ${err.message}`, 'error')
    }
    setTestingFunction(null)
  }

  function toggleErrorExpanded(id) {
    setExpandedErrors(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleTableSort(field) {
    if (tableSortField === field) {
      setTableSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setTableSortField(field)
      setTableSortDir(field === 'count' ? 'desc' : 'asc')
    }
  }

  // ═══════ DERIVED DATA ═══════

  const sortedTables = [...TRACKED_TABLES].sort((a, b) => {
    const aVal = tableSortField === 'count' ? (tableStats[a]?.count ?? -1) : a
    const bVal = tableSortField === 'count' ? (tableStats[b]?.count ?? -1) : b
    if (tableSortField === 'name') {
      return tableSortDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    }
    return tableSortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const healthySystems = Object.values(healthResults).filter(r => {
    if (!r.value) return false
    const hours = (new Date() - new Date(r.value)) / (1000 * 60 * 60)
    return hours < 24
  }).length

  const totalSystems = HEALTH_CHECKS.length

  // ═══════ RENDER ═══════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <span className="text-sm text-slate-400">Loading system health data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7" style={{ color: accent }} />
            System Health
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {healthySystems}/{totalSystems} systems healthy
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            bg-white/[0.06] border border-white/[0.06] text-slate-200 hover:bg-white/[0.1]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {/* ═══════ SECTION 1: APPLICATION HEALTH PULSE ═══════ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Application Health Pulse
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {HEALTH_CHECKS.map((check) => {
            const result = healthResults[check.name] || {}
            const health = getHealthColor(result.value)
            return (
              <div
                key={check.name}
                className="rounded-xl p-4 bg-[#0B1628] border border-white/[0.06] transition-all hover:border-white/[0.12]"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-200">{check.name}</h3>
                  <span className={`w-2.5 h-2.5 rounded-full ${health.dot} flex-shrink-0 mt-1`} />
                </div>
                <p className="text-xs text-slate-500 mb-3">{check.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${health.text}`}>
                    {timeAgo(result.value)}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${health.bg} ${health.text}`}>
                    {health.label}
                  </span>
                </div>
                {result.error && !result.value && (
                  <p className="text-[10px] text-red-400/70 mt-1 truncate" title={result.error}>
                    {result.error}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════ SECTION 2: EDGE FUNCTION REGISTRY ═══════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            Edge Function Registry
          </h2>
          <a
            href="https://supabase.com/dashboard/project/uqpjvbiuokwpldjvxiby/functions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Supabase Dashboard
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="rounded-xl overflow-hidden bg-[#0B1628] border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Function</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Purpose</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {EDGE_FUNCTIONS.map((fn, idx) => (
                <tr
                  key={fn.name}
                  className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors`}
                >
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-slate-200 bg-white/[0.06] px-2 py-0.5 rounded">
                      {fn.name}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{fn.purpose}</td>
                  <td className="px-4 py-3 text-center">
                    {fn.critical ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400">
                        <Shield className="w-3 h-3" />
                        Critical
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-400">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fn.name === 'stripe-test-connection' ? (
                      <button
                        onClick={handleTestStripeConnection}
                        disabled={testingFunction === 'stripe-test-connection'}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium
                          bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testingFunction === 'stripe-test-connection' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        Test
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══════ SECTION 3: DATABASE TABLE STATS ═══════ */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Database Table Stats
        </h2>
        <div className="rounded-xl overflow-hidden bg-[#0B1628] border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                  onClick={() => toggleTableSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Table Name
                    {tableSortField === 'name' && (
                      tableSortDir === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-200 transition-colors"
                  onClick={() => toggleTableSort('count')}
                >
                  <span className="flex items-center gap-1 justify-end">
                    Row Count
                    {tableSortField === 'count' && (
                      tableSortDir === 'asc'
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTables.map((table) => {
                const stat = tableStats[table] || {}
                return (
                  <tr
                    key={table}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <code className="text-xs font-mono text-slate-200">{table}</code>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {stat.error ? (
                        <span className="text-xs text-red-400/70 italic">{stat.error}</span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-200 tabular-nums">
                          {formatNumber(stat.count)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══════ SECTION 4: ERROR LOG ═══════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Error Log
          </h2>
          <div className="flex items-center gap-2">
            {/* Severity Filter */}
            <div className="relative">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="appearance-none text-xs px-3 py-1.5 pr-7 rounded-lg bg-white/[0.06] border border-white/[0.06] text-slate-200
                  focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
              >
                {SEVERITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#0B1628] text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {/* Error Type Filter */}
            <div className="relative">
              <select
                value={errorTypeFilter}
                onChange={(e) => setErrorTypeFilter(e.target.value)}
                className="appearance-none text-xs px-3 py-1.5 pr-7 rounded-lg bg-white/[0.06] border border-white/[0.06] text-slate-200
                  focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
              >
                {ERROR_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-[#0B1628] text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden bg-[#0B1628] border border-white/[0.06]">
          {errorLogsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-400">Loading error logs...</span>
            </div>
          ) : errorLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/50" />
              <p className="text-sm font-medium text-slate-400">No errors found</p>
              <p className="text-xs text-slate-500 mt-1">
                {severityFilter !== 'all' || errorTypeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'System is running clean'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {errorLogs.map((log) => {
                const isExpanded = expandedErrors[log.id]
                return (
                  <div key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-3 px-4 py-3">
                      {/* Severity Badge */}
                      <SeverityBadge severity={log.severity} />
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-slate-200 break-words">{log.message || 'No message'}</p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
                            {timeAgo(log.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {log.error_type && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 font-mono">
                              {log.error_type}
                            </span>
                          )}
                          {log.component && (
                            <span className="text-[10px] text-slate-500">
                              in <span className="font-mono text-slate-400">{log.component}</span>
                            </span>
                          )}
                        </div>
                        {/* Expandable stack trace */}
                        {(log.stack_trace || log.details) && (
                          <>
                            <button
                              onClick={() => toggleErrorExpanded(log.id)}
                              className="flex items-center gap-1 mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              {isExpanded ? 'Hide Details' : 'Show Details'}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 p-3 rounded-lg bg-black/30 border border-white/[0.04] overflow-x-auto">
                                <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap break-words">
                                  {log.stack_trace || JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ═══════ SUB-COMPONENTS ═══════

function SeverityBadge({ severity }) {
  const config = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertCircle },
    error: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertTriangle },
    warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
    info: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Activity },
  }
  const c = config[severity] || config.info
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {severity || 'info'}
    </span>
  )
}
