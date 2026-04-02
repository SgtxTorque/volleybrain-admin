import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Search, X, Building2, Users, Shield, Calendar, CreditCard,
  ChevronRight, AlertTriangle, Eye, Lock, Unlock, Clock, Activity,
  RefreshCw, ArrowLeft, Filter, SortAsc, CheckCircle2, TrendingUp,
  Layers, CalendarCheck, MapPin, FileText, List, Grid
} from '../../constants/icons'
import { getScoreColor, RISK_COLORS } from '../../lib/healthScoreCalculator'

// ═══════════════════════════════════════════════════════════
// PLATFORM ORGANIZATIONS — Standalone Page
// Clean professional cards, no glassmorphism
// ═══════════════════════════════════════════════════════════

const PAGE_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .po-au{animation:fadeUp .4s ease-out both}
  .po-ai{animation:fadeIn .3s ease-out both}
  .po-as{animation:scaleIn .25s ease-out both}
`

// ── Filter / Sort constants ──────────────────────────────
const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'trialing', label: 'Trialing' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'needs_setup', label: 'Needs Setup' },
  { id: 'at_risk', label: 'At Risk' },
]

const SORT_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'created_at', label: 'Created Date' },
  { id: 'member_count', label: 'Member Count' },
  { id: 'health_score', label: 'Health Score' },
]

// ── Setup steps for onboarding health ────────────────────
const SETUP_STEPS = [
  { key: 'has_season', label: 'Season created' },
  { key: 'has_team', label: 'Team created' },
  { key: 'has_members', label: 'Members added' },
  { key: 'has_registration', label: 'Registration set up' },
  { key: 'has_payment_setup', label: 'Payment configured' },
  { key: 'has_events', label: 'Events scheduled' },
  { key: 'has_coaches', label: 'Coaches assigned' },
]

function getHealthColor(completedCount) {
  if (completedCount >= 6) return 'emerald'
  if (completedCount >= 3) return 'amber'
  return 'red'
}

function getHealthLabel(completedCount) {
  if (completedCount >= 6) return 'Healthy'
  if (completedCount >= 3) return 'Partial'
  return 'Needs Setup'
}

// ── Inline Confirm Modal ─────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, destructive }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } catch (err) {
      console.error('ConfirmModal action error:', err)
    }
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className={`po-as w-full max-w-md rounded-[14px] p-6 shadow-2xl ${
        isDark
          ? 'bg-[#1E293B] border border-white/[0.08]'
          : 'bg-white border border-slate-200/60'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            destructive ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <h3 className={`text-lg font-bold ${tc.text}`}>{title}</h3>
        </div>
        <p className={`text-sm ${tc.textSecondary} mb-6 leading-relaxed`}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              isDark
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition ${
              destructive
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/40'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/40'
            } disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Note Modal ──────────────────────────────────────────
function NoteModal({ isOpen, onClose, org, user, showToast, onSaved }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen || !org) return null

  async function handleSave() {
    if (!note.trim()) return
    setSaving(true)
    try {
      await supabase.from('platform_org_events').insert({
        organization_id: org.id,
        event_type: 'note_added',
        details: { note: note.trim() },
        performed_by: user?.id,
      })
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'add_note',
        target_type: 'organization',
        target_id: org.id,
        details: { org_name: org.name, note: note.trim() },
      })
      showToast?.('Note added', 'success')
      setNote('')
      onSaved?.()
      onClose()
    } catch (err) {
      console.error('Failed to save note:', err)
      showToast?.('Failed to save note', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className={`po-as w-full max-w-md rounded-[14px] p-6 shadow-2xl ${
        isDark
          ? 'bg-[#1E293B] border border-white/[0.08]'
          : 'bg-white border border-slate-200/60'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/20">
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${tc.text}`}>Add Note</h3>
            <p className={`text-xs ${tc.textMuted}`}>{org.name}</p>
          </div>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Type your note here..."
          rows={4}
          className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 resize-none transition ${tc.input}`}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              isDark
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim() || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-600/40 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Org Card ─────────────────────────────────────────────
function OrgCard({ org, isDark, tc, onClick, onAction, onAddNote }) {
  const memberCount = org._memberCount || 0
  const teamCount = org._teamCount || 0
  const seasonCount = org._activeSeasonCount || 0
  const setupHealth = org._setupHealth || { completed: 0, total: 7 }
  const healthColor = getHealthColor(setupHealth.completed)
  const healthLabel = getHealthLabel(setupHealth.completed)
  const lastActivity = org._lastActivity

  const healthDotColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }

  const healthBadgeStyles = {
    emerald: isDark
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: isDark
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
      : 'bg-amber-50 text-amber-700 border-amber-200',
    red: isDark
      ? 'bg-red-500/15 text-red-400 border-red-500/20'
      : 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div
      className={`rounded-[14px] border shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isDark
          ? 'bg-[#1E293B] border-white/[0.08] hover:border-white/[0.14]'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
      onClick={onClick}
    >
      <div className="p-5">
        {/* Top row: avatar + name + status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}
              style={{ background: org.primary_color || '#4BB9EC' }}
            >
              {org.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h3 className={`font-semibold truncate ${tc.text}`}>{org.name}</h3>
              <p className={`text-xs truncate ${tc.textMuted}`}>{org.slug || 'no-slug'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onAddNote?.(org) }}
              title="Add note"
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'hover:bg-white/10 text-slate-400 hover:text-sky-400' : 'hover:bg-slate-100 text-slate-400 hover:text-sky-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
              org.is_active === false
                ? isDark
                  ? 'bg-red-500/15 text-red-400 border-red-500/20'
                  : 'bg-red-50 text-red-700 border-red-200'
                : isDark
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {org.is_active === false ? 'Suspended' : 'Active'}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`flex items-center gap-2 text-sm ${tc.textSecondary}`}>
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${tc.textSecondary}`}>
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>{teamCount} team{teamCount !== 1 ? 's' : ''}</span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${tc.textSecondary}`}>
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{seasonCount} season{seasonCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Health + subscription row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Health indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${healthBadgeStyles[healthColor]}`}>
              <div className={`w-2 h-2 rounded-full ${healthDotColors[healthColor]}`} />
              {setupHealth.completed}/{setupHealth.total} setup
            </div>

            {/* Health score badge */}
            {org._healthScore != null && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
                style={{ color: getScoreColor(org._healthScore) }}
              >
                <Activity className="w-3 h-3" />
                {org._healthScore}
              </div>
            )}

            {/* Subscription tier */}
            {org.subscription_tier && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                isDark
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                {org.subscription_tier}
              </span>
            )}
          </div>

          {/* Last activity */}
          {lastActivity && (
            <div className={`flex items-center gap-1 text-xs ${tc.textMuted}`}>
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(lastActivity)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className={`flex items-center border-t px-5 py-3 ${
        isDark ? 'border-white/[0.06]' : 'border-slate-100'
      }`}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className={`flex items-center gap-1.5 text-xs font-medium transition ${
            isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </button>
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAction(org.is_active === false ? 'activate' : 'suspend', org)
          }}
          className={`flex items-center gap-1.5 text-xs font-medium transition ${
            org.is_active === false
              ? isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
              : isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
          }`}
        >
          {org.is_active === false ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              Activate
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              Suspend
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Org List Row (table view) ─────────────────────────────
function OrgListRow({ org, isDark, tc, onClick, onAction, onAddNote }) {
  const memberCount = org._memberCount || 0
  const teamCount = org._teamCount || 0
  const seasonCount = org._activeSeasonCount || 0
  const setupHealth = org._setupHealth || { completed: 0, total: 7 }
  const healthColor = getHealthColor(setupHealth.completed)
  const lastActivity = org._lastActivity

  const healthBadgeCls = {
    emerald: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
    amber: isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-700',
    red: isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700',
  }

  return (
    <tr
      className={`cursor-pointer transition ${
        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      {/* Org name + slug */}
      <td className={`px-4 py-3 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: org.primary_color || '#4BB9EC' }}
          >
            {org.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${tc.text}`}>{org.name}</p>
            <p className={`text-xs truncate ${tc.textMuted}`}>{org.slug || 'no-slug'}</p>
          </div>
        </div>
      </td>
      {/* Status */}
      <td className={`px-4 py-3 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          org.is_active === false
            ? isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-700'
            : isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {org.is_active === false ? 'Suspended' : 'Active'}
        </span>
      </td>
      {/* Members */}
      <td className={`px-4 py-3 text-sm text-center ${tc.textSecondary} ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        {memberCount}
      </td>
      {/* Teams */}
      <td className={`px-4 py-3 text-sm text-center ${tc.textSecondary} ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        {teamCount}
      </td>
      {/* Seasons */}
      <td className={`px-4 py-3 text-sm text-center ${tc.textSecondary} ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        {seasonCount}
      </td>
      {/* Health Score */}
      <td className={`px-4 py-3 text-center ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        {org._healthScore != null && (
          <span className="text-sm font-semibold" style={{ color: getScoreColor(org._healthScore) }}>
            {org._healthScore}
          </span>
        )}
      </td>
      {/* Setup */}
      <td className={`px-4 py-3 text-center ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${healthBadgeCls[healthColor]}`}>
          {setupHealth.completed}/7
        </span>
      </td>
      {/* Last Active */}
      <td className={`px-4 py-3 text-xs ${tc.textMuted} ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        {lastActivity ? formatTimeAgo(lastActivity) : 'Never'}
      </td>
      {/* Actions */}
      <td className={`px-4 py-3 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-100'}`}>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onClick()}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              isDark ? 'text-sky-400 hover:bg-sky-500/10' : 'text-sky-600 hover:bg-sky-50'
            }`}
          >
            View
          </button>
          <button
            onClick={() => onAction(org.is_active === false ? 'activate' : 'suspend', org)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              org.is_active === false
                ? isDark ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'
                : isDark ? 'text-amber-400 hover:bg-amber-500/10' : 'text-amber-600 hover:bg-amber-50'
            }`}
          >
            {org.is_active === false ? 'Activate' : 'Suspend'}
          </button>
          <button
            onClick={() => onAddNote?.(org)}
            title="Add note"
            className={`p-1 rounded-lg transition ${
              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Helpers ──────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const now = new Date()
  const date = new Date(dateStr)
  const mins = Math.floor((now - date) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return date.toLocaleDateString()
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
function PlatformOrganizations({ showToast }) {
  const { user, isPlatformAdmin } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────
  const [orgs, setOrgs] = useState([])
  const [orgMeta, setOrgMeta] = useState({})  // { orgId: { memberCount, teamCount, seasonCount, ... } }
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'grid'
  const [confirmModal, setConfirmModal] = useState({ open: false })
  const [noteModal, setNoteModal] = useState({ open: false, org: null })

  // ── Load data ──────────────────────────────────────────
  useEffect(() => {
    loadOrgs()
  }, [])

  const loadOrgs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Fetch all organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError
      const orgList = orgsData || []
      setOrgs(orgList)

      // Fetch metadata for each org in parallel
      const orgIds = orgList.map(o => o.id)
      if (orgIds.length === 0) {
        setOrgMeta({})
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Batch queries for counts
      const [
        userRolesRes,
        seasonsRes,
        regTemplatesRes,
        subsRes,
      ] = await Promise.all([
        // Members: user_roles grouped by org
        supabase.from('user_roles').select('organization_id, id').in('organization_id', orgIds),
        // Seasons by org
        supabase.from('seasons').select('id, organization_id, status, updated_at').in('organization_id', orgIds),
        // Registration templates
        supabase.from('registration_templates').select('id, organization_id').in('organization_id', orgIds),
        // Subscriptions for trialing filter
        supabase.from('platform_subscriptions').select('organization_id, status').in('organization_id', orgIds).limit(10000),
      ])

      const members = userRolesRes.data || []
      const seasons = seasonsRes.data || []
      const regTemplates = regTemplatesRes.data || []
      const subs = subsRes?.data || []

      // Get season IDs to query teams and events
      const allSeasonIds = seasons.map(s => s.id)
      let teams = []
      let events = []
      let coaches = []

      if (allSeasonIds.length > 0) {
        const [teamsRes, eventsResActual, coachesResActual] = await Promise.all([
          supabase.from('teams').select('id, season_id').in('season_id', allSeasonIds),
          supabase.from('schedule_events').select('id, season_id').in('season_id', allSeasonIds),
          supabase.from('team_coaches').select('id, team_id').limit(5000),
        ])
        teams = teamsRes.data || []
        events = eventsResActual.data || []
        coaches = coachesResActual.data || []
      }

      // Build a lookup of season_id -> organization_id
      const seasonToOrg = {}
      seasons.forEach(s => { seasonToOrg[s.id] = s.organization_id })

      // Build metadata per org
      const meta = {}
      orgIds.forEach(orgId => {
        const orgMembers = members.filter(m => m.organization_id === orgId)
        const orgSeasons = seasons.filter(s => s.organization_id === orgId)
        const orgSeasonIds = orgSeasons.map(s => s.id)
        const orgTeams = teams.filter(t => orgSeasonIds.includes(t.season_id))
        const orgTeamIds = orgTeams.map(t => t.id)
        const orgEvents = events.filter(e => orgSeasonIds.includes(e.season_id))
        const orgRegTemplates = regTemplates.filter(r => r.organization_id === orgId)
        const orgCoaches = coaches.filter(c => orgTeamIds.includes(c.team_id))
        const activeSeasons = orgSeasons.filter(s => s.status === 'active')

        // Find the org object for payment_setup check
        const orgObj = orgList.find(o => o.id === orgId)
        const hasPaymentSetup = !!(orgObj?.stripe_account_id || orgObj?.payment_enabled)

        // Setup health calculation
        const setupChecks = {
          has_season: orgSeasons.length > 0,
          has_team: orgTeams.length > 0,
          has_members: orgMembers.length > 1, // more than just the admin
          has_registration: orgRegTemplates.length > 0,
          has_payment_setup: hasPaymentSetup,
          has_events: orgEvents.length > 0,
          has_coaches: orgCoaches.length > 0,
        }
        const completed = Object.values(setupChecks).filter(Boolean).length

        // Last activity: most recent season updated_at
        let lastActivity = null
        if (orgSeasons.length > 0) {
          const sortedSeasons = [...orgSeasons].sort((a, b) =>
            new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
          )
          lastActivity = sortedSeasons[0]?.updated_at || sortedSeasons[0]?.created_at || null
        }
        if (!lastActivity) {
          lastActivity = orgObj?.updated_at || orgObj?.created_at || null
        }

        const orgSub = subs.find(s => s.organization_id === orgId)

        meta[orgId] = {
          memberCount: orgMembers.length,
          teamCount: orgTeams.length,
          activeSeasonCount: activeSeasons.length,
          setupHealth: { completed, total: 7, checks: setupChecks },
          lastActivity,
          subStatus: orgSub?.status || null,
        }
      })

      setOrgMeta(meta)
    } catch (err) {
      console.error('Error loading organizations:', err)
      showToast?.('Failed to load organizations', 'error')
    }

    setLoading(false)
    setRefreshing(false)
  }, [showToast])

  // ── Enrich orgs with meta ──────────────────────────────
  const enrichedOrgs = useMemo(() => {
    return orgs.map(org => {
      const meta = orgMeta[org.id]
      const setupHealth = meta?.setupHealth || { completed: 0, total: 7 }
      // Derive a 0-100 health score from available metadata
      const setupPct = Math.round((setupHealth.completed / 7) * 100)
      const memberSignal = Math.min(100, (meta?.memberCount || 0) * 10)
      const activitySignal = meta?.lastActivity
        ? (Date.now() - new Date(meta.lastActivity).getTime() < 7 * 86400000 ? 100 : 40)
        : 0
      const healthScore = Math.round(setupPct * 0.5 + memberSignal * 0.25 + activitySignal * 0.25)
      return {
        ...org,
        _memberCount: meta?.memberCount || 0,
        _teamCount: meta?.teamCount || 0,
        _activeSeasonCount: meta?.activeSeasonCount || 0,
        _setupHealth: setupHealth,
        _lastActivity: meta?.lastActivity || null,
        _subStatus: meta?.subStatus || null,
        _healthScore: healthScore,
      }
    })
  }, [orgs, orgMeta])

  // ── Filter ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = enrichedOrgs

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(o =>
        o.name?.toLowerCase().includes(q) ||
        o.slug?.toLowerCase().includes(q)
      )
    }

    // Filter pills
    if (activeFilter === 'active') {
      result = result.filter(o => o.is_active !== false && o._subStatus !== 'trialing')
    } else if (activeFilter === 'trialing') {
      result = result.filter(o => o._subStatus === 'trialing')
    } else if (activeFilter === 'suspended') {
      result = result.filter(o => o.is_active === false)
    } else if (activeFilter === 'needs_setup') {
      result = result.filter(o => (o._setupHealth?.completed || 0) < 3)
    } else if (activeFilter === 'at_risk') {
      result = result.filter(o => (o._healthScore || 0) < 50)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = (a.name || '').localeCompare(b.name || '')
      } else if (sortBy === 'created_at') {
        cmp = new Date(a.created_at || 0) - new Date(b.created_at || 0)
      } else if (sortBy === 'member_count') {
        cmp = (a._memberCount || 0) - (b._memberCount || 0)
      } else if (sortBy === 'health_score') {
        cmp = (a._healthScore || 0) - (b._healthScore || 0)
      }
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [enrichedOrgs, search, activeFilter, sortBy, sortAsc])

  // ── Admin actions ──────────────────────────────────────
  async function logAction(actionType, targetType, targetId, details) {
    try {
      await supabase.from('platform_admin_actions').insert({
        admin_id: user.id,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        details,
      })
    } catch (err) {
      console.error('Failed to log admin action:', err)
    }
  }

  function handleOrgAction(action, org) {
    if (action === 'suspend') {
      setConfirmModal({
        open: true,
        title: 'Suspend Organization',
        message: `Are you sure you want to suspend "${org.name}"? All members will lose access until reactivated.`,
        destructive: true,
        onConfirm: async () => {
          const { error } = await supabase
            .from('organizations')
            .update({ is_active: false })
            .eq('id', org.id)
          if (error) {
            showToast?.('Failed to suspend organization', 'error')
            return
          }
          await logAction('suspend_org', 'organization', org.id, { org_name: org.name })
          await supabase.from('platform_org_events').insert({
            organization_id: org.id,
            event_type: 'suspended',
            details: { reason: 'Suspended by platform admin' },
            performed_by: user.id,
          })
          showToast?.(`${org.name} has been suspended`, 'success')
          loadOrgs(true)
        },
      })
    } else if (action === 'activate') {
      setConfirmModal({
        open: true,
        title: 'Reactivate Organization',
        message: `Are you sure you want to reactivate "${org.name}"? Members will regain access.`,
        destructive: false,
        onConfirm: async () => {
          const { error } = await supabase
            .from('organizations')
            .update({ is_active: true })
            .eq('id', org.id)
          if (error) {
            showToast?.('Failed to reactivate organization', 'error')
            return
          }
          await logAction('activate_org', 'organization', org.id, { org_name: org.name })
          await supabase.from('platform_org_events').insert({
            organization_id: org.id,
            event_type: 'reactivated',
            details: { reason: 'Reactivated by platform admin' },
            performed_by: user.id,
          })
          showToast?.(`${org.name} has been reactivated`, 'success')
          loadOrgs(true)
        },
      })
    }
  }

  function handleCardClick(org) {
    navigate(`/platform/organizations/${org.id}`)
  }

  // ── Sort toggle ────────────────────────────────────────
  function handleSortChange(newSort) {
    if (sortBy === newSort) {
      setSortAsc(prev => !prev)
    } else {
      setSortBy(newSort)
      setSortAsc(true)
    }
  }

  // ── Access gate ────────────────────────────────────────
  if (!isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <style>{PAGE_STYLES}</style>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-500/20 mb-4">
          <Shield className="w-8 h-8 text-red-400" />
        </div>
        <h1 className={`text-3xl font-bold ${tc.text} mb-2`}>Access Denied</h1>
        <p className={`text-sm ${tc.textMuted}`}>You do not have platform administrator privileges.</p>
      </div>
    )
  }

  // ── Counts for filter pills ────────────────────────────
  const filterCounts = {
    all: enrichedOrgs.length,
    active: enrichedOrgs.filter(o => o.is_active !== false && o._subStatus !== 'trialing').length,
    trialing: enrichedOrgs.filter(o => o._subStatus === 'trialing').length,
    suspended: enrichedOrgs.filter(o => o.is_active === false).length,
    needs_setup: enrichedOrgs.filter(o => (o._setupHealth?.completed || 0) < 3).length,
    at_risk: enrichedOrgs.filter(o => (o._healthScore || 0) < 50).length,
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div>
      <style>{PAGE_STYLES}</style>

      {/* Header */}
      <div className="po-au mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/platform')}
            className={`p-2 rounded-xl transition ${
              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${tc.text} flex items-center gap-3`}>
              <Building2 className="w-7 h-7" style={{ color: accent.primary }} />
              Organizations
            </h1>
            <p className={`text-sm ${tc.textMuted} mt-0.5 ml-10`}>
              {enrichedOrgs.length} organization{enrichedOrgs.length !== 1 ? 's' : ''} on platform
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className={`rounded-[14px] border shadow-sm p-4 mb-4 po-au ${
        isDark
          ? 'bg-[#1E293B] border-white/[0.08]'
          : 'bg-white border-slate-200'
      }`} style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by organization name or slug..."
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition ${tc.input}`}
              style={{ '--tw-ring-color': `${accent.primary}50` }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition ${
                  isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-400'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => loadOrgs(true)}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border transition ${
              isDark
                ? 'border-white/[0.08] hover:bg-white/10 text-slate-400'
                : 'border-slate-200 hover:bg-slate-50 text-slate-500'
            } ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter pills + Sort */}
      <div className={`flex flex-wrap items-center justify-between gap-3 mb-5 po-au`} style={{ animationDelay: '120ms' }}>
        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map(opt => {
            const isActive = activeFilter === opt.id
            const count = filterCounts[opt.id] || 0
            return (
              <button
                key={opt.id}
                onClick={() => setActiveFilter(opt.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isActive
                    ? 'text-white border-transparent shadow-sm'
                    : isDark
                      ? 'text-slate-400 border-white/[0.08] hover:border-white/[0.14] hover:text-slate-300'
                      : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                }`}
                style={isActive ? { background: accent.primary } : {}}
              >
                {opt.label}
                <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : ''}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* View toggle + Sort */}
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className={`flex rounded-lg p-0.5 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]'
                  : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
          <span className={`text-xs ${tc.textMuted} mr-1`}>Sort:</span>
          {SORT_OPTIONS.map(opt => {
            const isActive = sortBy === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleSortChange(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-100 text-slate-800'
                    : isDark
                      ? 'text-slate-500 hover:text-slate-300'
                      : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {opt.label}
                {isActive && (
                  <span className="ml-1">{sortAsc ? '\u2191' : '\u2193'}</span>
                )}
              </button>
            )
          })}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`rounded-[14px] border shadow-sm p-12 text-center po-au ${
          isDark
            ? 'bg-[#1E293B] border-white/[0.08]'
            : 'bg-white border-slate-200'
        }`}>
          <Building2 className={`w-12 h-12 mx-auto mb-3 ${tc.textMuted}`} />
          <p className={`text-sm font-medium ${tc.text} mb-1`}>
            {search ? 'No organizations match your search' : 'No organizations found'}
          </p>
          <p className={`text-xs ${tc.textMuted}`}>
            {search
              ? 'Try adjusting your search terms or filters.'
              : 'Organizations will appear here once created.'
            }
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((org, i) => (
              <div key={org.id} className="po-au" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                <OrgCard
                  org={org}
                  isDark={isDark}
                  tc={tc}
                  onClick={() => handleCardClick(org)}
                  onAction={handleOrgAction}
                  onAddNote={(o) => setNoteModal({ open: true, org: o })}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}>
                  {['Organization', 'Status', 'Members', 'Teams', 'Seasons', 'Health', 'Setup', 'Last Active', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left ${tc.textMuted} ${
                      isDark ? 'border-b border-white/[0.06]' : 'border-b border-slate-200'
                    } ${['Members', 'Teams', 'Seasons', 'Health', 'Setup'].includes(h) ? 'text-center' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(org => (
                  <OrgListRow
                    key={org.id}
                    org={org}
                    isDark={isDark}
                    tc={tc}
                    onClick={() => handleCardClick(org)}
                    onAction={handleOrgAction}
                    onAddNote={(o) => setNoteModal({ open: true, org: o })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Results summary */}
      {!loading && filtered.length > 0 && (
        <div className={`text-center mt-6 text-xs ${tc.textMuted} po-au`} style={{ animationDelay: '200ms' }}>
          Showing {filtered.length} of {enrichedOrgs.length} organization{enrichedOrgs.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title || ''}
        message={confirmModal.message || ''}
        destructive={confirmModal.destructive}
      />

      {/* Note Modal */}
      <NoteModal
        isOpen={noteModal.open}
        onClose={() => setNoteModal({ open: false, org: null })}
        org={noteModal.org}
        user={user}
        showToast={showToast}
        onSaved={() => loadOrgs(true)}
      />
    </div>
  )
}

export { PlatformOrganizations }
export default PlatformOrganizations
