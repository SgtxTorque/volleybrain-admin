import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { calculateHealthScore, getScoreColor, RISK_LABELS, RISK_COLORS } from '../../lib/healthScoreCalculator'
import {
  ArrowLeft, Building2, Users, Shield, Calendar, DollarSign,
  Activity, AlertTriangle, Trash2, Lock, Unlock, Clock, CheckCircle2,
  XCircle, RefreshCw, FileText, BarChart3, ChevronRight, User, Loader2
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM ORG DETAIL PAGE — Full-page org detail view
// Refactored from OrgDetailSlideOver in PlatformAdminPage.jsx
// ═══════════════════════════════════════════════════════════

const TAB_LIST = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'teams', label: 'Teams', icon: Shield },
  { id: 'seasons', label: 'Seasons', icon: Calendar },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'activity', label: 'Activity Log', icon: Activity },
  { id: 'lifecycle', label: 'Lifecycle', icon: Clock },
]

// ═══════ INLINE CONFIRM MODAL ═══════
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, destructive, requireTyping }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (isOpen) setTyped('') }, [isOpen])

  if (!isOpen) return null

  const canConfirm = requireTyping ? typed === 'DELETE' : true

  async function handleConfirm() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className={`w-full max-w-md rounded-[14px] p-6 shadow-xl ${isDark ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destructive ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className={`text-lg font-bold ${tc.text}`}>{title}</h3>
        </div>
        <p className={`text-sm ${tc.textSecondary} mb-4 leading-relaxed`}>{message}</p>
        {requireTyping && (
          <div className="mb-4">
            <label className={`text-xs font-medium uppercase tracking-wide ${tc.textMuted} block mb-1.5`}>Type DELETE to confirm</label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/40 ${tc.input}`}
            />
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium text-white transition ${
              destructive
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/40'
                : 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/40'
            } disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════ KPI CARD ═══════
function KpiCard({ label, value, icon: Icon, color, isDark }) {
  return (
    <div className={`rounded-[14px] p-5 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-xs uppercase tracking-wide mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}

// ═══════ ONBOARDING CHECKLIST (Enhanced 7-milestone system) ═══════
function OnboardingChecklist({ org, members, teams, seasons, isDark, tc, showToast }) {
  const [extraData, setExtraData] = useState({ coaches: 0, events: 0, regTemplates: 0, players: 0 })
  const [sendingReminder, setSendingReminder] = useState(false)

  useEffect(() => {
    if (org?.id) loadExtraData()
  }, [org?.id])

  async function loadExtraData() {
    try {
      const teamIds = teams.map(t => t.id)
      const [coachesRes, eventsRes, regsRes, playersRes] = await Promise.all([
        teamIds.length > 0 ? supabase.from('team_coaches').select('id', { count: 'exact', head: true }).in('team_id', teamIds) : { count: 0 },
        supabase.from('schedule_events').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
        supabase.from('registration_templates').select('id', { count: 'exact', head: true }).eq('org_id', org.id),
        teamIds.length > 0 ? supabase.from('team_players').select('id', { count: 'exact', head: true }).in('team_id', teamIds) : { count: 0 },
      ])
      setExtraData({
        coaches: coachesRes.count || 0,
        events: eventsRes.count || 0,
        regTemplates: regsRes.count || 0,
        players: playersRes.count || 0,
      })
    } catch (err) {
      console.error('Error loading onboarding extra data:', err)
    }
  }

  const checks = [
    { label: 'Admin user', done: members.some(m => m.role === 'admin' || m.role === 'league_admin') },
    { label: 'First season', done: seasons.length > 0 },
    { label: 'First team', done: teams.length > 0 },
    { label: 'First player', done: extraData.players > 0 },
    { label: 'Coach assigned', done: extraData.coaches > 0 },
    { label: 'First event', done: extraData.events > 0 },
    { label: 'Registration template', done: extraData.regTemplates > 0 },
  ]
  const completed = checks.filter(c => c.done).length
  const daysActive = org?.created_at ? Math.floor((new Date() - new Date(org.created_at)) / 86400000) : 0

  async function handleSendReminder() {
    setSendingReminder(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('platform_org_events').insert({
        organization_id: org.id,
        event_type: 'setup_reminder_sent',
        details: { sent_by: user?.id, milestones_completed: completed },
        created_by: user?.id,
      })
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'send_setup_reminder',
        target_type: 'organization',
        target_id: org.id,
        details: { org_name: org.name, milestones: completed },
        user_agent: navigator.userAgent,
      })
      showToast?.('Setup reminder sent', 'success')
    } catch (err) {
      console.error('Error sending reminder:', err)
      showToast?.('Failed to send reminder', 'error')
    }
    setSendingReminder(false)
  }

  return (
    <div className={`rounded-[14px] p-5 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted}`}>Onboarding Checklist</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${completed === checks.length ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
          {completed}/{checks.length}
        </span>
      </div>
      {/* Progress bar */}
      <div className={`h-2 rounded-full mb-3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${(completed / checks.length) * 100}%`, background: completed === checks.length ? '#10B981' : 'var(--accent-primary)' }} />
      </div>
      {/* Time to value */}
      <p className={`text-xs ${tc.textMuted} mb-3`}>
        Active for {daysActive} day{daysActive !== 1 ? 's' : ''} | {completed}/{checks.length} milestones
      </p>
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-3">
            {check.done ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            ) : (
              <div className={`w-4.5 h-4.5 rounded-full border-2 shrink-0 ${isDark ? 'border-slate-600' : 'border-slate-300'}`} />
            )}
            <span className={`text-sm ${check.done ? (isDark ? 'text-slate-300' : 'text-slate-700') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
      {completed < checks.length && (
        <button
          onClick={handleSendReminder}
          disabled={sendingReminder}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            isDark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          {sendingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          Send Setup Reminder
        </button>
      )}
    </div>
  )
}

// ═══════ OVERVIEW TAB ═══════
function OverviewTab({ org, members, teams, seasons, payments, isDark, tc, showToast, healthScoreData, onRecalculate }) {
  const paidPayments = payments.filter(p => p.paid)
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const adminCount = members.filter(m => m.role === 'admin' || m.role === 'league_admin').length
  const coachCount = members.filter(m => m.role === 'coach').length
  const parentCount = members.filter(m => m.role === 'parent').length

  const kpis = [
    { label: 'Total Members', value: members.length, icon: Users, color: '#3B82F6' },
    { label: 'Teams', value: teams.length, icon: Shield, color: '#8B5CF6' },
    { label: 'Seasons', value: seasons.length, icon: Calendar, color: '#10B981' },
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#F59E0B' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <KpiCard key={kpi.label} {...kpi} isDark={isDark} />
        ))}
      </div>

      {/* Health Score Section */}
      {healthScoreData && (
        <div className={`rounded-[14px] p-5 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted}`}>Health Score</h3>
            <div className="flex items-center gap-2">
              {/* Churn risk badge */}
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${RISK_COLORS[healthScoreData.churn_risk]?.bg} ${RISK_COLORS[healthScoreData.churn_risk]?.text}`}>
                {RISK_COLORS[healthScoreData.churn_risk]?.label}
              </span>
              <button
                onClick={onRecalculate}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recalculate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall Score - Circular Indicator */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32">
                {/* Background circle */}
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" strokeWidth="10" className={isDark ? 'stroke-slate-700' : 'stroke-slate-200'} />
                  <circle
                    cx="64" cy="64" r="56" fill="none" strokeWidth="10"
                    strokeLinecap="round"
                    stroke={getScoreColor(healthScoreData.overall_score)}
                    strokeDasharray={`${(healthScoreData.overall_score / 100) * 351.86} 351.86`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${tc.text}`}>{healthScoreData.overall_score}</span>
                  <span className={`text-xs ${tc.textMuted}`}>/ 100</span>
                </div>
              </div>
              <p className={`text-xs font-medium mt-2 ${tc.textMuted}`}>Overall Score</p>
            </div>

            {/* Sub-scores - Horizontal Bars */}
            <div className="lg:col-span-2 space-y-3">
              {[
                { key: 'activity_score', label: 'Activity', weight: '25%' },
                { key: 'payment_score', label: 'Payment', weight: '25%' },
                { key: 'engagement_score', label: 'Engagement', weight: '20%' },
                { key: 'growth_score', label: 'Growth', weight: '15%' },
                { key: 'setup_score', label: 'Setup', weight: '15%' },
              ].map(sub => {
                const val = healthScoreData[sub.key] || 0
                return (
                  <div key={sub.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${tc.textSecondary}`}>{sub.label} <span className={tc.textMuted}>({sub.weight})</span></span>
                      <span className={`text-xs font-semibold ${tc.text}`}>{val}/100</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${val}%`, background: getScoreColor(val) }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Risk Factors */}
          {healthScoreData.risk_factors.length > 0 && (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: isDark ? 'rgb(51 65 85 / 0.5)' : 'rgb(226 232 240)' }}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${tc.textMuted} mb-2`}>Risk Factors</p>
              <div className="flex flex-wrap gap-2">
                {healthScoreData.risk_factors.map(rf => (
                  <span
                    key={rf}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                      isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {RISK_LABELS[rf] || rf}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Breakdown */}
        <div className={`rounded-[14px] p-5 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${tc.textMuted} mb-4`}>Role Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Admins', count: adminCount, color: '#EF4444' },
              { label: 'Coaches', count: coachCount, color: '#3B82F6' },
              { label: 'Parents', count: parentCount, color: '#10B981' },
              { label: 'Other', count: members.length - adminCount - coachCount - parentCount, color: '#6B7280' },
            ].map(role => (
              <div key={role.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: role.color }} />
                  <span className={`text-sm ${tc.textSecondary}`}>{role.label}</span>
                </div>
                <span className={`text-sm font-semibold ${tc.text}`}>{role.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist org={org} members={members} teams={teams} seasons={seasons} isDark={isDark} tc={tc} showToast={showToast} />
      </div>
    </div>
  )
}

// ═══════ MEMBERS TAB ═══════
function MembersTab({ members, isDark, tc }) {
  const [search, setSearch] = useState('')

  const filtered = members.filter(m =>
    m.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  )

  function getRoleBadge(role) {
    const styles = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      coach: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      parent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      player: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    }
    return styles[role] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members by name, email, or role..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-[10px] text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${tc.input}`}
        />
        <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
      </div>

      {/* Members Table */}
      {filtered.length === 0 ? (
        <div className={`rounded-[14px] p-8 text-center shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <Users className={`w-10 h-10 mx-auto ${tc.textMuted} mb-3`} />
          <p className={`text-sm ${tc.textMuted}`}>{search ? 'No members match your search' : 'No members found'}</p>
        </div>
      ) : (
        <div className={`rounded-[14px] shadow-sm border overflow-hidden ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <th className={`text-xs font-semibold uppercase tracking-wide text-left px-4 py-3 ${tc.textMuted}`}>Name</th>
                  <th className={`text-xs font-semibold uppercase tracking-wide text-left px-4 py-3 ${tc.textMuted}`}>Email</th>
                  <th className={`text-xs font-semibold uppercase tracking-wide text-left px-4 py-3 ${tc.textMuted}`}>Role</th>
                  <th className={`text-xs font-semibold uppercase tracking-wide text-left px-4 py-3 ${tc.textMuted}`}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className={`border-b last:border-0 ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {m.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <span className={`text-sm font-medium ${tc.text}`}>{m.profiles?.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${tc.textSecondary}`}>{m.profiles?.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${isDark ? '' : ''} ${getRoleBadge(m.role)}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${tc.textMuted}`}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════ TEAMS TAB ═══════
function TeamsTab({ teams, isDark, tc, accent }) {
  if (teams.length === 0) {
    return (
      <div className={`rounded-[14px] p-8 text-center shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        <Shield className={`w-10 h-10 mx-auto ${tc.textMuted} mb-3`} />
        <p className={`text-sm ${tc.textMuted}`}>No teams found for this organization</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map(team => (
        <div key={team.id} className={`rounded-[14px] p-4 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: team.color || accent.primary }}
            >
              {team.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${tc.text}`}>{team.name}</p>
              <p className={`text-xs ${tc.textMuted}`}>{team.division || 'No division'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className={`w-3.5 h-3.5 ${tc.textMuted}`} />
              <span className={`text-xs ${tc.textMuted}`}>{team.player_count ?? '?'} players</span>
            </div>
            <span className={`text-xs ${tc.textMuted}`}>
              {team.created_at ? new Date(team.created_at).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════ SEASONS TAB ═══════
function SeasonsTab({ seasons, isDark, tc }) {
  if (seasons.length === 0) {
    return (
      <div className={`rounded-[14px] p-8 text-center shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        <Calendar className={`w-10 h-10 mx-auto ${tc.textMuted} mb-3`} />
        <p className={`text-sm ${tc.textMuted}`}>No seasons found for this organization</p>
      </div>
    )
  }

  function getStatusStyle(status) {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
      case 'upcoming': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
      case 'completed': return 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
      case 'archived': return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-3">
      {seasons.map(season => (
        <div key={season.id} className={`rounded-[14px] p-4 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {season.sports?.icon && <span className="text-lg">{season.sports.icon}</span>}
              <p className={`text-sm font-semibold ${tc.text}`}>{season.name}</p>
            </div>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(season.status)}`}>
              {season.status || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${tc.textMuted}`} />
              <span className={`text-xs ${tc.textMuted}`}>
                {season.start_date ? new Date(season.start_date).toLocaleDateString() : 'No start date'}
                {' - '}
                {season.end_date ? new Date(season.end_date).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
            {season.sports?.name && (
              <span className={`text-xs ${tc.textMuted}`}>{season.sports.name}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════ PAYMENTS TAB ═══════
function PaymentsTab({ payments, isDark, tc }) {
  const [search, setSearch] = useState('')

  const filtered = payments.filter(p =>
    p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.status?.toLowerCase().includes(search.toLowerCase())
  )

  if (payments.length === 0) {
    return (
      <div className={`rounded-[14px] p-8 text-center shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        <DollarSign className={`w-10 h-10 mx-auto ${tc.textMuted} mb-3`} />
        <p className={`text-sm ${tc.textMuted}`}>No payments found for this organization</p>
      </div>
    )
  }

  function getPaymentStatusStyle(payment) {
    if (payment.paid) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    if (payment.status === 'overdue') return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
  }

  function getPaymentStatusLabel(payment) {
    if (payment.paid) return 'Paid'
    if (payment.status === 'overdue') return 'Overdue'
    return payment.status || 'Pending'
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search payments by player name or status..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-[10px] text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${tc.input}`}
        />
        <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
      </div>

      {/* Payments Table */}
      <div className={`rounded-[14px] shadow-sm border overflow-hidden ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`text-xs font-semibold uppercase tracking-wide text-left px-4 py-3 ${tc.textMuted}`}>Player</th>
                <th className={`text-xs font-semibold uppercase tracking-wide text-right px-4 py-3 ${tc.textMuted}`}>Amount</th>
                <th className={`text-xs font-semibold uppercase tracking-wide text-center px-4 py-3 ${tc.textMuted}`}>Status</th>
                <th className={`text-xs font-semibold uppercase tracking-wide text-left px-4 py-3 ${tc.textMuted}`}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(payment => (
                <tr key={payment.id} className={`border-b last:border-0 ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${tc.text}`}>
                      {payment.profiles?.full_name || payment.player_name || 'Unknown'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${tc.text}`}>
                    ${parseFloat(payment.amount || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusStyle(payment)}`}>
                      {getPaymentStatusLabel(payment)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${tc.textMuted}`}>
                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════ ACTIVITY LOG TAB ═══════
function ActivityLogTab({ orgId, isDark, tc, accent }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [orgId])

  async function loadLogs() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('platform_admin_actions')
        .select('*, profiles:admin_id(full_name, email)')
        .eq('target_id', orgId)
        .eq('target_type', 'organization')
        .order('created_at', { ascending: false })
        .limit(50)
      setLogs(data || [])
    } catch (err) {
      console.error('Activity log error:', err)
    }
    setLoading(false)
  }

  function getActionIcon(type) {
    switch (type) {
      case 'suspend_org': return { icon: Lock, color: '#F59E0B' }
      case 'activate_org': return { icon: Unlock, color: '#10B981' }
      case 'delete_org': return { icon: Trash2, color: '#EF4444' }
      default: return { icon: Activity, color: '#6B7280' }
    }
  }

  function formatAction(type) {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const mins = Math.floor((now - date) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className={`rounded-[14px] p-8 text-center shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        <FileText className={`w-10 h-10 mx-auto ${tc.textMuted} mb-3`} />
        <p className={`text-sm ${tc.textMuted}`}>No activity log entries for this organization</p>
      </div>
    )
  }

  return (
    <div className={`rounded-[14px] shadow-sm border overflow-hidden divide-y ${isDark ? 'bg-[#1E293B] border-slate-700 divide-slate-700/50' : 'bg-white border-slate-200 divide-slate-100'}`}>
      {logs.map(log => {
        const { icon: ActionIcon, color } = getActionIcon(log.action_type)
        return (
          <div key={log.id} className="px-5 py-4 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
              <ActionIcon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${tc.text}`}>{formatAction(log.action_type)}</p>
              <p className={`text-xs ${tc.textMuted} mt-0.5`}>
                by {log.profiles?.full_name || log.profiles?.email || 'Unknown admin'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock className={`w-3 h-3 ${tc.textMuted}`} />
              <span className={`text-xs ${tc.textMuted}`}>{timeAgo(log.created_at)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════ NOTE MODAL (LIFECYCLE) ═══════
function OrgNoteModal({ isOpen, onClose, orgId, orgName, user, isDark, tc, showToast, onSaved }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  async function handleSave() {
    if (!note.trim()) return
    setSaving(true)
    try {
      await supabase.from('platform_org_events').insert({
        organization_id: orgId,
        event_type: 'note_added',
        details: { note: note.trim() },
        performed_by: user?.id,
      })
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'add_note',
        target_type: 'organization',
        target_id: orgId,
        details: { org_name: orgName, note: note.trim() },
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
      <div className={`w-full max-w-md rounded-[14px] p-6 shadow-2xl ${
        isDark ? 'bg-[#1E293B] border border-white/[0.08]' : 'bg-white border border-slate-200/60'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/20">
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Note</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{orgName}</p>
          </div>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Type your note..."
          rows={4}
          className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 resize-none transition ${tc.input}`}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
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

// ═══════ EXTEND TRIAL MODAL ═══════
function ExtendTrialModal({ isOpen, onClose, orgId, orgName, currentTrialEnd, user, isDark, tc, accent, showToast, onSaved }) {
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && currentTrialEnd) {
      const d = new Date(currentTrialEnd)
      d.setDate(d.getDate() + 14)
      setNewDate(d.toISOString().split('T')[0])
    }
  }, [isOpen, currentTrialEnd])

  if (!isOpen) return null

  async function handleSave() {
    if (!newDate) return
    setSaving(true)
    try {
      await supabase.from('platform_subscriptions')
        .update({ trial_ends_at: newDate })
        .eq('organization_id', orgId)
        .eq('status', 'trialing')
      await supabase.from('platform_org_events').insert({
        organization_id: orgId,
        event_type: 'trial_extended',
        details: { old_end: currentTrialEnd, new_end: newDate, reason: reason.trim() || null },
        performed_by: user?.id,
      })
      await supabase.from('platform_admin_actions').insert({
        admin_id: user?.id,
        action_type: 'extend_trial',
        target_type: 'organization',
        target_id: orgId,
        details: { org_name: orgName, old_end: currentTrialEnd, new_end: newDate, reason: reason.trim() || null },
      })
      showToast?.('Trial extended', 'success')
      setReason('')
      onSaved?.()
      onClose()
    } catch (err) {
      console.error('Failed to extend trial:', err)
      showToast?.('Failed to extend trial', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className={`w-full max-w-md rounded-[14px] p-6 shadow-2xl ${
        isDark ? 'bg-[#1E293B] border border-white/[0.08]' : 'bg-white border border-slate-200/60'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Extend Trial</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{orgName}</p>
          </div>
        </div>
        {currentTrialEnd && (
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-3`}>
            Current trial ends: <span className="font-medium">{new Date(currentTrialEnd).toLocaleDateString()}</span>
          </p>
        )}
        <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-1.5`}>New End Date</label>
        <input
          type="date"
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
          className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition mb-3 ${tc.input}`}
        />
        <label className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-1.5`}>Reason (optional)</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Why are you extending this trial?"
          rows={2}
          className={`w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 resize-none transition ${tc.input}`}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!newDate || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/40 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Extending...' : 'Extend Trial'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════ LIFECYCLE TAB ═══════
function LifecycleTab({ orgId, orgName, user, subscription, isDark, tc, accent, showToast, onRefresh }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteModal, setNoteModal] = useState(false)
  const [extendTrialModal, setExtendTrialModal] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [orgId])

  async function loadEvents() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('platform_org_events')
        .select('*, profiles:performed_by(full_name, email)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50)
      setEvents(data || [])
    } catch (err) {
      console.error('Lifecycle events error:', err)
    }
    setLoading(false)
  }

  function getEventIcon(type) {
    switch (type) {
      case 'trial_started': return { icon: Clock, color: '#3B82F6' }
      case 'trial_extended': return { icon: Clock, color: '#F59E0B' }
      case 'upgraded': return { icon: Activity, color: '#10B981' }
      case 'downgraded': return { icon: Activity, color: '#F59E0B' }
      case 'suspended': return { icon: Lock, color: '#EF4444' }
      case 'reactivated': return { icon: Unlock, color: '#10B981' }
      case 'deleted': return { icon: Trash2, color: '#EF4444' }
      case 'note_added': return { icon: FileText, color: '#6366F1' }
      case 'setup_reminder_sent': return { icon: AlertTriangle, color: '#F59E0B' }
      default: return { icon: Activity, color: '#6B7280' }
    }
  }

  function formatEventType(type) {
    return (type || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const mins = Math.floor((now - date) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isTrialing = subscription?.status === 'trialing'
  const trialEndsAt = subscription?.trial_ends_at
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / 86400000)) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trial Status + Actions */}
      {isTrialing && (
        <div className={`rounded-[14px] p-5 shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Trial Status</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                {trialDaysLeft !== null ? (
                  trialDaysLeft > 0
                    ? <><span className="font-semibold text-amber-500">{trialDaysLeft} days</span> remaining (ends {new Date(trialEndsAt).toLocaleDateString()})</>
                    : <span className="text-red-500 font-semibold">Trial expired</span>
                ) : 'No trial end date set'}
              </p>
            </div>
            <button
              onClick={() => setExtendTrialModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isDark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Extend Trial
            </button>
          </div>
        </div>
      )}

      {/* Add Note Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setNoteModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: accent.primary }}
        >
          <FileText className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className={`rounded-[14px] p-8 text-center shadow-sm border ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <Clock className={`w-10 h-10 mx-auto ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`} />
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No lifecycle events yet</p>
        </div>
      ) : (
        <div className={`rounded-[14px] shadow-sm border overflow-hidden ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
            {events.map(evt => {
              const { icon: EvtIcon, color } = getEventIcon(evt.event_type)
              return (
                <div key={evt.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <EvtIcon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatEventType(evt.event_type)}</p>
                    {evt.details?.note && (
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1 line-clamp-2`}>{evt.details.note}</p>
                    )}
                    {evt.details?.reason && !evt.details?.note && (
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1`}>{evt.details.reason}</p>
                    )}
                    {evt.details?.new_end && (
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} mt-1`}>
                        Extended to {new Date(evt.details.new_end).toLocaleDateString()}
                      </p>
                    )}
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                      by {evt.profiles?.full_name || evt.profiles?.email || 'System'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(evt.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Note Modal */}
      <OrgNoteModal
        isOpen={noteModal}
        onClose={() => setNoteModal(false)}
        orgId={orgId}
        orgName={orgName}
        user={user}
        isDark={isDark}
        tc={tc}
        showToast={showToast}
        onSaved={loadEvents}
      />

      {/* Extend Trial Modal */}
      <ExtendTrialModal
        isOpen={extendTrialModal}
        onClose={() => setExtendTrialModal(false)}
        orgId={orgId}
        orgName={orgName}
        currentTrialEnd={trialEndsAt}
        user={user}
        isDark={isDark}
        tc={tc}
        accent={accent}
        showToast={showToast}
        onSaved={() => { loadEvents(); onRefresh?.() }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════
function PlatformOrgDetail({ showToast }) {
  const { orgId } = useParams()
  const navigate = useNavigate()
  const { user, isPlatformAdmin } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  const [org, setOrg] = useState(null)
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [seasons, setSeasons] = useState([])
  const [payments, setPayments] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [confirmModal, setConfirmModal] = useState({ open: false })
  const [healthScoreData, setHealthScoreData] = useState(null)

  useEffect(() => {
    if (orgId) loadOrgData()
  }, [orgId])

  async function loadOrgData() {
    setLoading(true)
    try {
      // Fetch org
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (orgError || !orgData) {
        console.error('Org fetch error:', orgError)
        setLoading(false)
        return
      }
      setOrg(orgData)

      // Load subscription
      const { data: subData } = await supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle()
      setSubscription(subData)

      // Fetch members, seasons in parallel
      const [membersRes, seasonsRes] = await Promise.all([
        supabase.from('user_roles')
          .select('*, profiles!user_roles_user_id_fkey(id, full_name, email)')
          .eq('organization_id', orgId)
          .eq('is_active', true),
        supabase.from('seasons')
          .select('*, sports(name, icon)')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false }),
      ])

      setMembers(membersRes.data || [])
      setSeasons(seasonsRes.data || [])

      // Teams and payments are linked via season_id, not organization_id
      const seasonIds = (seasonsRes.data || []).map(s => s.id)

      // Payments: scope through seasons (payments lacks organization_id)
      if (seasonIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*, profiles:player_id(full_name)')
          .in('season_id', seasonIds)
          .order('created_at', { ascending: false })
          .limit(100)
        setPayments(paymentsData || [])
      } else {
        setPayments([])
      }
      let teamsWithCounts = []
      if (seasonIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*, team_players(count)')
          .in('season_id', seasonIds)
          .order('created_at', { ascending: false })

        // Map player counts
        teamsWithCounts = (teamsData || []).map(t => ({
          ...t,
          player_count: t.team_players?.[0]?.count ?? 0,
        }))
        setTeams(teamsWithCounts)
      } else {
        setTeams([])
      }
      // Compute enhanced health score
      await computeEnhancedHealthScore(orgData, seasonsRes.data || [], membersRes.data || [], teamsWithCounts, subData)
    } catch (err) {
      console.error('Error loading org details:', err)
    }
    setLoading(false)
  }

  async function computeEnhancedHealthScore(orgData, seasonsData, membersData, teamsData, subData) {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const cutoff = thirtyDaysAgo.toISOString()

      const teamIds = teamsData.map(t => t.id)

      // Gather data for the calculator in parallel
      const [eventsRes, chatRes, attendanceRes] = await Promise.all([
        // Recent events (schedule_events in last 30 days)
        supabase
          .from('schedule_events')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgData.id)
          .gte('created_at', cutoff),
        // Recent chat messages
        supabase
          .from('chat_messages')
          .select('id, chat_channels!inner(org_id)', { count: 'exact', head: true })
          .eq('chat_channels.org_id', orgData.id)
          .gte('created_at', cutoff),
        // Recent attendance (event_rsvps)
        teamIds.length > 0
          ? supabase
              .from('event_rsvps')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', cutoff)
          : Promise.resolve({ count: 0 }),
      ])

      // Features used: count distinct feature areas with data
      let featuresUsed = 0
      if ((eventsRes.count || 0) > 0) featuresUsed++                     // Schedule
      if ((chatRes.count || 0) > 0) featuresUsed++                       // Chat
      if (teamsData.length > 0) featuresUsed++                           // Teams
      if (membersData.some(m => m.role === 'coach')) featuresUsed++       // Coaches
      const totalPlayers = teamsData.reduce((s, t) => s + (t.player_count || 0), 0)
      if (totalPlayers > 0) featuresUsed++                               // Players/Registration

      // Milestones (same logic as OnboardingChecklist)
      const seasonIds = seasonsData.map(s => s.id)
      let coachAssigned = false
      let hasRegTemplate = false
      if (teamIds.length > 0) {
        const { count: coachCount } = await supabase
          .from('team_coaches')
          .select('id', { count: 'exact', head: true })
          .in('team_id', teamIds)
        coachAssigned = (coachCount || 0) > 0
      }
      const { count: regCount } = await supabase
        .from('registration_templates')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgData.id)
      hasRegTemplate = (regCount || 0) > 0

      let milestonesComplete = 0
      if (membersData.some(m => m.role === 'admin' || m.role === 'league_admin')) milestonesComplete++
      if (seasonsData.length > 0) milestonesComplete++
      if (teamsData.length > 0) milestonesComplete++
      if (totalPlayers > 0) milestonesComplete++
      if (coachAssigned) milestonesComplete++
      if ((eventsRes.count || 0) > 0) milestonesComplete++
      if (hasRegTemplate) milestonesComplete++

      const result = calculateHealthScore(orgData, {
        recentEventCount: eventsRes.count || 0,
        recentChatCount: chatRes.count || 0,
        recentAttendanceCount: attendanceRes.count || 0,
        subscriptionStatus: subData?.status || 'none',
        failedPaymentCount: 0,
        featuresUsed,
        playerCountThisMonth: totalPlayers,
        playerCountLastMonth: totalPlayers, // no historical comparison available
        milestonesComplete,
      })

      setHealthScoreData(result)
    } catch (err) {
      console.error('Error computing enhanced health score:', err)
    }
  }

  async function logAction(actionType, targetType, targetId, details) {
    await supabase.from('platform_admin_actions').insert({
      admin_id: user.id,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details,
    })
  }

  function handleSuspendToggle() {
    if (!org) return
    const isSuspended = org.is_active === false

    setConfirmModal({
      open: true,
      title: isSuspended ? 'Reactivate Organization' : 'Suspend Organization',
      message: isSuspended
        ? `Are you sure you want to reactivate "${org.name}"?`
        : `Are you sure you want to suspend "${org.name}"? All members will lose access until reactivated.`,
      destructive: !isSuspended,
      onConfirm: async () => {
        const newActive = isSuspended ? true : false
        await supabase.from('organizations').update({ is_active: newActive }).eq('id', orgId)
        await logAction(isSuspended ? 'activate_org' : 'suspend_org', 'organization', orgId, { org_name: org.name })
        await supabase.from('platform_org_events').insert({
          organization_id: orgId,
          event_type: isSuspended ? 'reactivated' : 'suspended',
          details: { reason: isSuspended ? 'Reactivated by platform admin' : 'Suspended by platform admin' },
          performed_by: user.id,
        })
        showToast?.(`${org.name} ${isSuspended ? 'reactivated' : 'suspended'}`, 'success')
        loadOrgData()
      },
    })
  }

  function handleDelete() {
    if (!org) return
    setConfirmModal({
      open: true,
      title: 'Permanently Delete Organization',
      message: `This will PERMANENTLY delete "${org.name}" and all its data (teams, seasons, players, payments). This action cannot be undone.`,
      destructive: true,
      requireTyping: true,
      onConfirm: async () => {
        await logAction('delete_org', 'organization', orgId, { org_name: org.name })
        const { error } = await supabase.rpc('delete_organization_cascade', { p_org_id: orgId })
        if (error) throw error
        showToast?.(`${org.name} deleted`, 'success')
        navigate('/platform/organizations')
      },
    })
  }

  // Health score: simple heuristic based on org completeness
  function computeHealthScore() {
    let score = 0
    if (org) score += 20
    if (members.length > 0) score += 20
    if (members.some(m => m.role === 'admin' || m.role === 'league_admin')) score += 10
    if (seasons.length > 0) score += 20
    if (seasons.some(s => s.status === 'active')) score += 10
    if (teams.length > 0) score += 20
    return score
  }

  // Access gate
  if (!isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-500/10 mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h1 className={`text-2xl font-bold ${tc.text} mb-2`}>Access Denied</h1>
        <p className={`text-sm ${tc.textMuted}`}>You do not have platform administrator privileges.</p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // Org not found
  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Building2 className={`w-12 h-12 ${tc.textMuted} mb-4`} />
        <h2 className={`text-xl font-bold ${tc.text} mb-2`}>Organization Not Found</h2>
        <p className={`text-sm ${tc.textMuted} mb-6`}>The organization you are looking for does not exist or has been deleted.</p>
        <button
          onClick={() => navigate('/platform/organizations')}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: accent.primary }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Platform Admin
        </button>
      </div>
    )
  }

  const healthScore = healthScoreData ? healthScoreData.overall_score : computeHealthScore()
  const isSuspended = org.is_active === false

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/platform/organizations')}
        className={`flex items-center gap-1.5 text-sm font-medium mb-5 transition ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Platform Admin
      </button>

      {/* Header Card */}
      <div className={`rounded-[14px] p-6 shadow-sm border mb-6 ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left: Org info */}
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: accent.primary }}
            >
              {org.name?.charAt(0)}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${tc.text}`}>{org.name}</h1>
              <p className={`text-sm ${tc.textMuted} mt-0.5`}>{org.slug}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {/* Status badge */}
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  isSuspended
                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                }`}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
                {/* Subscription tier */}
                {org.subscription_tier && (
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400`}>
                    {org.subscription_tier}
                  </span>
                )}
                {/* Health score */}
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  healthScore >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  healthScore >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                  healthScore >= 40 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                  'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                }`}>
                  Health: {healthScore}%
                </span>
                {healthScoreData && (
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${RISK_COLORS[healthScoreData.churn_risk]?.bg} ${RISK_COLORS[healthScoreData.churn_risk]?.text}`}>
                    {RISK_COLORS[healthScoreData.churn_risk]?.label}
                  </span>
                )}
                {/* Created date */}
                <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  Created {new Date(org.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadOrgData()}
              className={`p-2 rounded-[10px] transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSuspendToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium transition ${
                isSuspended
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20'
              }`}
            >
              {isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isSuspended ? 'Activate' : 'Suspend'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`rounded-[14px] shadow-sm border p-1.5 mb-6 inline-flex flex-wrap gap-1 ${isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200'}`}>
        {TAB_LIST.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-medium transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : `${tc.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`
              }`}
              style={isActive ? { background: accent.primary } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab org={org} members={members} teams={teams} seasons={seasons} payments={payments} isDark={isDark} tc={tc} showToast={showToast} healthScoreData={healthScoreData} onRecalculate={loadOrgData} />
        )}
        {activeTab === 'members' && (
          <MembersTab members={members} isDark={isDark} tc={tc} />
        )}
        {activeTab === 'teams' && (
          <TeamsTab teams={teams} isDark={isDark} tc={tc} accent={accent} />
        )}
        {activeTab === 'seasons' && (
          <SeasonsTab seasons={seasons} isDark={isDark} tc={tc} />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab payments={payments} isDark={isDark} tc={tc} />
        )}
        {activeTab === 'activity' && (
          <ActivityLogTab orgId={orgId} isDark={isDark} tc={tc} accent={accent} />
        )}
        {activeTab === 'lifecycle' && (
          <LifecycleTab
            orgId={orgId}
            orgName={org.name}
            user={user}
            subscription={subscription}
            isDark={isDark}
            tc={tc}
            accent={accent}
            showToast={showToast}
            onRefresh={loadOrgData}
          />
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title || ''}
        message={confirmModal.message || ''}
        destructive={confirmModal.destructive}
        requireTyping={confirmModal.requireTyping}
      />
    </div>
  )
}

export { PlatformOrgDetail }
export default PlatformOrgDetail
