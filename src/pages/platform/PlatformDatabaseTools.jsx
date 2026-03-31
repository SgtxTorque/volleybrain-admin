import { useState, useEffect, useMemo } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Activity, Shield, AlertTriangle, RefreshCw, Search, Filter,
  ChevronDown, Check, Eye, BarChart3, Building2, Users,
  CreditCard, Zap, Clock, CheckCircle2, Loader2
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM DATABASE TOOLS — Read-Only Database Inspector
// Table overview, orphan detection, data integrity checks
// ⚠️ READ-ONLY — No write operations performed
// ═══════════════════════════════════════════════════════════

const TABS = [
  { id: 'overview', label: 'Table Overview', icon: BarChart3 },
  { id: 'orphans', label: 'Orphan Detection', icon: Search },
  { id: 'integrity', label: 'Data Integrity', icon: Shield },
]

const TRACKED_TABLES = [
  { name: 'organizations', category: 'Core' },
  { name: 'profiles', category: 'Core' },
  { name: 'user_roles', category: 'Core' },
  { name: 'seasons', category: 'Core' },
  { name: 'teams', category: 'Core' },
  { name: 'players', category: 'Core' },
  { name: 'team_players', category: 'Core' },
  { name: 'payments', category: 'Financial' },
  { name: 'registrations', category: 'Core' },
  { name: 'schedule_events', category: 'Core' },
  { name: 'chat_messages', category: 'Communication' },
  { name: 'email_notifications', category: 'Communication' },
  { name: 'shoutouts', category: 'Engagement' },
  { name: 'xp_ledger', category: 'Engagement' },
  { name: 'platform_admin_actions', category: 'Platform' },
  { name: 'platform_support_tickets', category: 'Platform' },
  { name: 'platform_org_health_scores', category: 'Platform' },
  { name: 'platform_subscriptions', category: 'Platform' },
  { name: 'platform_error_log', category: 'Platform' },
  { name: 'platform_team_members', category: 'Platform' },
]

const CATEGORY_COLORS = {
  Core: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  Platform: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400' },
  Engagement: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  Communication: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400' },
  Financial: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
}

const CATEGORY_COLORS_LIGHT = {
  Core: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  Platform: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  Engagement: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Communication: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  Financial: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
}

// ── Table Overview Tab ──────────────────────────────────────

function TableOverviewTab({ isDark, tc, showToast }) {
  const [tableCounts, setTableCounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('count') // count | name | category
  const [groupByCategory, setGroupByCategory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTableCounts()
  }, [])

  async function loadTableCounts() {
    setLoading(true)
    const counts = {}
    const promises = TRACKED_TABLES.map(async (t) => {
      try {
        const { count, error } = await supabase
          .from(t.name)
          .select('*', { count: 'exact', head: true })
        if (error) {
          counts[t.name] = { count: null, error: true }
        } else {
          counts[t.name] = { count: count || 0, error: false }
        }
      } catch {
        counts[t.name] = { count: null, error: true }
      }
    })
    await Promise.all(promises)
    setTableCounts(counts)
    setLoading(false)
  }

  const totalRows = useMemo(() => {
    return Object.values(tableCounts).reduce((sum, v) => sum + (v.count || 0), 0)
  }, [tableCounts])

  const accessibleCount = useMemo(() => {
    return Object.values(tableCounts).filter(v => !v.error).length
  }, [tableCounts])

  const filteredTables = useMemo(() => {
    let tables = TRACKED_TABLES.map(t => ({
      ...t,
      count: tableCounts[t.name]?.count,
      error: tableCounts[t.name]?.error || false,
    }))

    if (searchTerm) {
      tables = tables.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    tables.sort((a, b) => {
      if (sortBy === 'count') return (b.count || 0) - (a.count || 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      return 0
    })

    return tables
  }, [tableCounts, sortBy, searchTerm])

  const groupedTables = useMemo(() => {
    if (!groupByCategory) return null
    const groups = {}
    filteredTables.forEach(t => {
      if (!groups[t.category]) groups[t.category] = []
      groups[t.category].push(t)
    })
    return groups
  }, [filteredTables, groupByCategory])

  const catColors = isDark ? CATEGORY_COLORS : CATEGORY_COLORS_LIGHT

  return (
    <div className="space-y-6">
      {/* KPI Card */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-[#0B1628] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Rows Across All Tables</p>
            <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {loading ? '...' : totalRows.toLocaleString()}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {accessibleCount} of {TRACKED_TABLES.length} tables accessible
            </p>
          </div>
          <button
            onClick={loadTableCounts}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}
              disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border ${tc.input}`}
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className={`appearance-none pl-3 pr-8 py-2 rounded-lg text-sm border cursor-pointer ${tc.input}`}
          >
            <option value="count">Sort by Count</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
          </select>
          <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>

        {/* Group toggle */}
        <button
          onClick={() => setGroupByCategory(!groupByCategory)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition
            ${groupByCategory
              ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
              : isDark ? 'border-white/[0.06] text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
        >
          <Filter className="w-4 h-4" />
          Group
        </button>
      </div>

      {/* Table list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <span className={`ml-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Querying tables...</span>
        </div>
      ) : groupByCategory && groupedTables ? (
        Object.entries(groupedTables)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, tables]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${catColors[category]?.dot || 'bg-slate-400'}`} />
                <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {category}
                </h3>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  ({tables.length} table{tables.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                {tables.map((t, idx) => (
                  <TableRow key={t.name} table={t} isDark={isDark} catColors={catColors} isLast={idx === tables.length - 1} />
                ))}
              </div>
            </div>
          ))
      ) : (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          {filteredTables.map((t, idx) => (
            <TableRow key={t.name} table={t} isDark={isDark} catColors={catColors} isLast={idx === filteredTables.length - 1} />
          ))}
          {filteredTables.length === 0 && (
            <div className={`p-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No tables match your search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TableRow({ table, isDark, catColors, isLast }) {
  const cc = catColors[table.category] || catColors.Core
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${
      !isLast ? (isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100') : ''
    } ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} transition`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cc.bg} ${cc.text} ${cc.border}`}>
          {table.category}
        </span>
        <span className={`text-sm font-mono truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {table.name}
        </span>
      </div>
      <div className="flex-shrink-0 ml-4">
        {table.error ? (
          <span className="text-xs text-red-400 font-medium">Access denied</span>
        ) : (
          <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {(table.count ?? 0).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Orphan Record Detection Tab ─────────────────────────────

const ORPHAN_CHECKS = [
  {
    id: 'players_no_team',
    name: 'Players not on any team',
    description: 'Player records that have no entry in team_players — they exist but are unassigned.',
  },
  {
    id: 'teams_no_players',
    name: 'Teams with no players',
    description: 'Teams that have zero roster members in team_players.',
  },
  {
    id: 'seasons_no_teams',
    name: 'Seasons with no teams',
    description: 'Seasons that have no teams created under them.',
  },
  {
    id: 'roles_inactive_orgs',
    name: 'Active user roles for inactive orgs',
    description: 'User roles marked is_active=true belonging to organizations that are deactivated.',
  },
  {
    id: 'deletion_requested',
    name: 'Profiles requesting deletion',
    description: 'User profiles that have deletion_requested=true and are awaiting processing.',
  },
]

function OrphanDetectionTab({ isDark, tc, showToast }) {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})

  async function runAllChecks() {
    setLoading(true)
    setResults({})
    const newResults = {}

    try {
      // 1. Players not on any team
      const [{ data: allPlayers }, { data: allTeamPlayers }] = await Promise.all([
        supabase.from('players').select('id, first_name, last_name, created_at').limit(10000),
        supabase.from('team_players').select('player_id').limit(10000),
      ])
      const teamPlayerIds = new Set((allTeamPlayers || []).map(tp => tp.player_id))
      const orphanPlayers = (allPlayers || []).filter(p => !teamPlayerIds.has(p.id))
      newResults.players_no_team = {
        count: orphanPlayers.length,
        records: orphanPlayers.slice(0, 20),
        status: orphanPlayers.length === 0 ? 'pass' : 'warning',
      }

      // 2. Teams with no players
      const [{ data: allTeams }, { data: tpForTeams }] = await Promise.all([
        supabase.from('teams').select('id, name, created_at').limit(10000),
        supabase.from('team_players').select('team_id').limit(10000),
      ])
      const teamsWithPlayers = new Set((tpForTeams || []).map(tp => tp.team_id))
      const emptyTeams = (allTeams || []).filter(t => !teamsWithPlayers.has(t.id))
      newResults.teams_no_players = {
        count: emptyTeams.length,
        records: emptyTeams.slice(0, 20),
        status: emptyTeams.length === 0 ? 'pass' : 'warning',
      }

      // 3. Seasons with no teams
      const [{ data: allSeasons }, { data: teamsForSeasons }] = await Promise.all([
        supabase.from('seasons').select('id, name, status, created_at').limit(10000),
        supabase.from('teams').select('season_id').limit(10000),
      ])
      const seasonsWithTeams = new Set((teamsForSeasons || []).map(t => t.season_id))
      const emptySeasons = (allSeasons || []).filter(s => !seasonsWithTeams.has(s.id))
      newResults.seasons_no_teams = {
        count: emptySeasons.length,
        records: emptySeasons.slice(0, 20),
        status: emptySeasons.length === 0 ? 'pass' : 'warning',
      }

      // 4. Active user roles for inactive orgs
      const { data: inactiveOrgs } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('is_active', false)
        .limit(10000)
      const inactiveOrgIds = (inactiveOrgs || []).map(o => o.id)
      let staleRoles = []
      if (inactiveOrgIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('id, user_id, organization_id, role, is_active')
          .eq('is_active', true)
          .in('organization_id', inactiveOrgIds)
          .limit(10000)
        staleRoles = roles || []
      }
      newResults.roles_inactive_orgs = {
        count: staleRoles.length,
        records: staleRoles.slice(0, 20),
        status: staleRoles.length === 0 ? 'pass' : 'warning',
      }

      // 5. Profiles requesting deletion
      const { data: deletionProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, deletion_requested')
        .eq('deletion_requested', true)
        .limit(10000)
      const delProfiles = deletionProfiles || []
      newResults.deletion_requested = {
        count: delProfiles.length,
        records: delProfiles.slice(0, 20),
        status: delProfiles.length === 0 ? 'pass' : 'warning',
      }
    } catch (err) {
      console.error('Orphan detection error:', err)
      showToast?.('Error running orphan checks', 'error')
    }

    setResults(newResults)
    setLoading(false)
  }

  const hasResults = Object.keys(results).length > 0

  return (
    <div className="space-y-6">
      {/* Header + Run button */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-[#0B1628] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Orphan Record Detection</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Find records that reference missing or disconnected data. Read-only — no modifications are made.
            </p>
          </div>
          <button
            onClick={runAllChecks}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition
              bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Running checks...' : 'Run All Checks'}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasResults && (
        <div className="space-y-3">
          {ORPHAN_CHECKS.map(check => {
            const result = results[check.id]
            if (!result) return null
            const isPass = result.status === 'pass'
            const isExpanded = expanded[check.id]

            return (
              <div key={check.id} className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition
                    ${isDark ? 'bg-[#0B1628] hover:bg-white/[0.02]' : 'bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPass ? 'bg-green-500/10' : 'bg-amber-500/10'
                    }`}>
                      {isPass
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <AlertTriangle className="w-4 h-4 text-amber-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{check.name}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{check.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isPass
                        ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
                        : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700')
                    }`}>
                      {result.count} found
                    </span>
                    {result.count > 0 && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      } ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    )}
                  </div>
                </button>

                {/* Expanded records */}
                {isExpanded && result.count > 0 && (
                  <div className={`border-t ${isDark ? 'border-white/[0.06] bg-[#0a1220]' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="px-5 py-3">
                      <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Showing first {Math.min(result.records.length, 20)} of {result.count} records
                      </p>
                      <div className="space-y-1">
                        {result.records.map((rec, idx) => (
                          <div key={rec.id || idx} className={`text-xs font-mono px-3 py-1.5 rounded ${
                            isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-white text-slate-600'
                          }`}>
                            {formatOrphanRecord(rec)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!hasResults && !loading && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-[#0B1628] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          <Search className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Click "Run All Checks" to scan for orphan records.
          </p>
        </div>
      )}
    </div>
  )
}

function formatOrphanRecord(rec) {
  const parts = []
  if (rec.id) parts.push(`id: ${rec.id}`)
  if (rec.name) parts.push(`name: ${rec.name}`)
  if (rec.full_name) parts.push(`name: ${rec.full_name}`)
  if (rec.first_name || rec.last_name) parts.push(`name: ${rec.first_name || ''} ${rec.last_name || ''}`.trim())
  if (rec.email) parts.push(`email: ${rec.email}`)
  if (rec.role) parts.push(`role: ${rec.role}`)
  if (rec.status) parts.push(`status: ${rec.status}`)
  if (rec.organization_id) parts.push(`org: ${rec.organization_id.slice(0, 8)}...`)
  return parts.join('  |  ') || JSON.stringify(rec)
}

// ── Data Integrity Checks Tab ───────────────────────────────

const INTEGRITY_CHECKS = [
  {
    id: 'orgs_no_admin',
    name: 'Organizations with no admin users',
    description: 'Active organizations that have no user_roles with admin or league_admin role.',
  },
  {
    id: 'subs_no_org',
    name: 'Subscriptions without organizations',
    description: 'Platform subscriptions pointing to organization IDs that do not exist.',
  },
  {
    id: 'duplicate_emails',
    name: 'Duplicate email addresses',
    description: 'Profiles sharing the same email address (case-insensitive comparison).',
  },
  {
    id: 'stale_health_scores',
    name: 'Stale health scores',
    description: 'Organization health scores not recomputed in the last 7 days.',
  },
]

function DataIntegrityTab({ isDark, tc, showToast }) {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState({})

  async function runAllChecks() {
    setLoading(true)
    setResults({})
    const newResults = {}

    try {
      // 1. Active orgs with no admin user_roles
      const [{ data: activeOrgs }, { data: adminRoles }] = await Promise.all([
        supabase.from('organizations').select('id, name').eq('is_active', true).limit(10000),
        supabase.from('user_roles').select('organization_id, role').in('role', ['admin', 'league_admin']).eq('is_active', true).limit(10000),
      ])
      const orgsWithAdmins = new Set((adminRoles || []).map(r => r.organization_id))
      const orgsNoAdmin = (activeOrgs || []).filter(o => !orgsWithAdmins.has(o.id))
      newResults.orgs_no_admin = {
        count: orgsNoAdmin.length,
        records: orgsNoAdmin.slice(0, 20),
        status: orgsNoAdmin.length === 0 ? 'pass' : 'warning',
      }

      // 2. Subscriptions pointing to non-existent orgs
      const [{ data: allSubs }, { data: allOrgs }] = await Promise.all([
        supabase.from('platform_subscriptions').select('id, organization_id, plan_tier, status').limit(10000),
        supabase.from('organizations').select('id').limit(10000),
      ])
      const orgIdSet = new Set((allOrgs || []).map(o => o.id))
      const orphanSubs = (allSubs || []).filter(s => s.organization_id && !orgIdSet.has(s.organization_id))
      newResults.subs_no_org = {
        count: orphanSubs.length,
        records: orphanSubs.slice(0, 20).map(s => ({
          id: s.id,
          name: `Subscription ${s.plan_tier || 'unknown'} (${s.status})`,
          organization_id: s.organization_id,
        })),
        status: orphanSubs.length === 0 ? 'pass' : 'warning',
      }

      // 3. Duplicate email addresses (case-insensitive)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(10000)
      const emailMap = {}
      ;(allProfiles || []).forEach(p => {
        const lowerEmail = (p.email || '').toLowerCase().trim()
        if (!lowerEmail) return
        if (!emailMap[lowerEmail]) emailMap[lowerEmail] = []
        emailMap[lowerEmail].push(p)
      })
      const duplicates = Object.entries(emailMap)
        .filter(([, profiles]) => profiles.length > 1)
        .map(([email, profiles]) => ({
          id: email,
          name: `${email} (${profiles.length} profiles)`,
          email,
          profiles: profiles.map(p => p.full_name || p.id).join(', '),
        }))
      newResults.duplicate_emails = {
        count: duplicates.length,
        records: duplicates.slice(0, 20),
        status: duplicates.length === 0 ? 'pass' : 'warning',
      }

      // 4. Stale health scores (computed_at older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: staleScores } = await supabase
        .from('platform_org_health_scores')
        .select('id, organization_id, overall_score, computed_at')
        .lt('computed_at', sevenDaysAgo)
        .limit(10000)
      const stale = staleScores || []
      newResults.stale_health_scores = {
        count: stale.length,
        records: stale.slice(0, 20).map(s => ({
          id: s.id,
          name: `Score ${s.overall_score ?? '?'} — computed ${new Date(s.computed_at).toLocaleDateString()}`,
          organization_id: s.organization_id,
        })),
        status: stale.length === 0 ? 'pass' : 'warning',
      }
    } catch (err) {
      console.error('Integrity check error:', err)
      showToast?.('Error running integrity checks', 'error')
    }

    setResults(newResults)
    setLoading(false)
  }

  const hasResults = Object.keys(results).length > 0

  return (
    <div className="space-y-6">
      {/* Header + Run button */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-[#0B1628] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Data Integrity Checks</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Validate referential integrity and data consistency. Read-only — no modifications are made.
            </p>
          </div>
          <button
            onClick={runAllChecks}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition
              bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? 'Running checks...' : 'Run All Checks'}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasResults && (
        <div className="space-y-3">
          {INTEGRITY_CHECKS.map(check => {
            const result = results[check.id]
            if (!result) return null
            const isPass = result.status === 'pass'
            const isExpanded = expanded[check.id]

            return (
              <div key={check.id} className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [check.id]: !prev[check.id] }))}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition
                    ${isDark ? 'bg-[#0B1628] hover:bg-white/[0.02]' : 'bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPass ? 'bg-green-500/10' : 'bg-amber-500/10'
                    }`}>
                      {isPass
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : <AlertTriangle className="w-4 h-4 text-amber-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{check.name}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{check.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isPass
                        ? (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
                        : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700')
                    }`}>
                      {result.count} found
                    </span>
                    {result.count > 0 && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      } ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    )}
                  </div>
                </button>

                {/* Expanded records */}
                {isExpanded && result.count > 0 && (
                  <div className={`border-t ${isDark ? 'border-white/[0.06] bg-[#0a1220]' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="px-5 py-3">
                      <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Showing first {Math.min(result.records.length, 20)} of {result.count} records
                      </p>
                      <div className="space-y-1">
                        {result.records.map((rec, idx) => (
                          <div key={rec.id || idx} className={`text-xs font-mono px-3 py-1.5 rounded ${
                            isDark ? 'bg-white/[0.03] text-slate-300' : 'bg-white text-slate-600'
                          }`}>
                            {formatIntegrityRecord(rec)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!hasResults && !loading && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'bg-[#0B1628] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          <Shield className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Click "Run All Checks" to validate data integrity.
          </p>
        </div>
      )}
    </div>
  )
}

function formatIntegrityRecord(rec) {
  const parts = []
  if (rec.id) parts.push(`id: ${rec.id}`)
  if (rec.name) parts.push(`name: ${rec.name}`)
  if (rec.email) parts.push(`email: ${rec.email}`)
  if (rec.profiles) parts.push(`profiles: ${rec.profiles}`)
  if (rec.organization_id) parts.push(`org: ${rec.organization_id.slice(0, 8)}...`)
  return parts.join('  |  ') || JSON.stringify(rec)
}

// ── Main Component ──────────────────────────────────────────

export default function PlatformDatabaseTools({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className={`min-h-screen ${tc.pageBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--accent-primary)]/5'
            }`}>
              <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Database Tools
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Read-only database inspector and health checks
              </p>
            </div>
          </div>
          {/* Read-only badge */}
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <Eye className="w-3 h-3" />
              READ-ONLY — No write operations
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex items-center gap-1 mb-6 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : `border-transparent ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <TableOverviewTab isDark={isDark} tc={tc} showToast={showToast} />}
        {activeTab === 'orphans' && <OrphanDetectionTab isDark={isDark} tc={tc} showToast={showToast} />}
        {activeTab === 'integrity' && <DataIntegrityTab isDark={isDark} tc={tc} showToast={showToast} />}
      </div>
    </div>
  )
}
