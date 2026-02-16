import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Shield, ShieldCheck, Building2, Users, DollarSign, Search, X, Trash2,
  ChevronRight, ChevronDown, ChevronLeft, AlertTriangle, Eye, Lock, Unlock,
  UserX, UserCheck, Clock, Activity, RefreshCw, BarChart3, FileText
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// PLATFORM SUPER-ADMIN PAGE — Glassmorphism Design
// ═══════════════════════════════════════════════════════════

const PA_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .pa-au{animation:fadeUp .4s ease-out both}
  .pa-ai{animation:fadeIn .3s ease-out both}
  .pa-as{animation:scaleIn .25s ease-out both}
  .pa-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .pa-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .pa-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .pa-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .pa-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .pa-nos::-webkit-scrollbar{display:none}.pa-nos{-ms-overflow-style:none;scrollbar-width:none}
  .pa-light .pa-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .pa-light .pa-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
`

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'audit', label: 'Audit Log', icon: FileText },
]

// ═══════ CONFIRM MODAL ═══════
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, destructive, requireTyping }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
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
      <div className={`pa-as w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-slate-800 border border-white/[0.08]' : 'bg-white border border-slate-200/60'} shadow-2xl`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destructive ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <h3 className={`text-lg font-bold ${tc.text}`}>{title}</h3>
        </div>
        <p className={`text-sm ${tc.textSecondary} mb-4`}>{message}</p>
        {requireTyping && (
          <div className="mb-4">
            <label className={`pa-label text-xs uppercase ${tc.textMuted} block mb-1`}>Type DELETE to confirm</label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              className={`w-full px-3 py-2 rounded-lg text-sm ${tc.input} border focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition`}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition ${
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

// ═══════ ORG DETAIL SLIDE-OVER ═══════
function OrgDetailSlideOver({ org, isOpen, onClose, isDark, tc, accent, onAction }) {
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && org?.id) loadOrgDetails()
  }, [isOpen, org?.id])

  async function loadOrgDetails() {
    setLoading(true)
    try {
      const [membersRes, seasonsRes] = await Promise.all([
        supabase.from('user_roles').select('*, profiles(id, full_name, email)').eq('organization_id', org.id).eq('is_active', true),
        supabase.from('seasons').select('*, sports(name, icon)').eq('organization_id', org.id).order('created_at', { ascending: false }),
      ])
      setMembers(membersRes.data || [])
      setSeasons(seasonsRes.data || [])

      // Teams are linked via season_id, not organization_id
      const seasonIds = (seasonsRes.data || []).map(s => s.id)
      if (seasonIds.length > 0) {
        const { data: teamsData } = await supabase.from('teams').select('*').in('season_id', seasonIds).order('created_at', { ascending: false })
        setTeams(teamsData || [])
      } else {
        setTeams([])
      }
    } catch (err) { console.error('Error loading org details:', err) }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-lg pa-ai ${isDark ? 'bg-slate-900 border-l border-white/[0.08]' : 'bg-white border-l border-slate-200'} shadow-2xl overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 p-5 border-b ${isDark ? 'bg-slate-900/95 border-white/[0.08]' : 'bg-white/95 border-slate-200'} backdrop-blur-xl`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className={`text-xl font-bold ${tc.text}`}>{org?.name}</h2>
            <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className={`text-sm ${tc.textMuted}`}>{org?.slug} &bull; Created {new Date(org?.created_at).toLocaleDateString()}</p>
          <div className="flex gap-2 mt-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              org?.status === 'suspended'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {org?.status === 'suspended' ? 'Suspended' : 'Active'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Members Section */}
            <div>
              <h3 className={`pa-heading text-sm uppercase ${tc.textMuted} mb-3`}>Members ({members.length})</h3>
              <div className="space-y-2">
                {members.length === 0 ? (
                  <p className={`text-sm ${tc.textMuted}`}>No members found</p>
                ) : members.map(m => (
                  <div key={m.id} className={`pa-glass rounded-xl p-3 flex items-center justify-between`}>
                    <div>
                      <p className={`text-sm font-medium ${tc.text}`}>{m.profiles?.full_name || 'Unknown'}</p>
                      <p className={`text-xs ${tc.textMuted}`}>{m.profiles?.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full`} style={{ background: `${accent.primary}20`, color: accent.primary }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Teams Section */}
            <div>
              <h3 className={`pa-heading text-sm uppercase ${tc.textMuted} mb-3`}>Teams ({teams.length})</h3>
              <div className="space-y-2">
                {teams.length === 0 ? (
                  <p className={`text-sm ${tc.textMuted}`}>No teams found</p>
                ) : teams.map(t => (
                  <div key={t.id} className={`pa-glass rounded-xl p-3 flex items-center gap-3`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: t.color || accent.primary }}>
                      {t.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${tc.text}`}>{t.name}</p>
                      <p className={`text-xs ${tc.textMuted}`}>{t.division || 'No division'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasons Section */}
            <div>
              <h3 className={`pa-heading text-sm uppercase ${tc.textMuted} mb-3`}>Seasons ({seasons.length})</h3>
              <div className="space-y-2">
                {seasons.length === 0 ? (
                  <p className={`text-sm ${tc.textMuted}`}>No seasons found</p>
                ) : seasons.map(s => (
                  <div key={s.id} className={`pa-glass rounded-xl p-3`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${tc.text}`}>{s.sports?.icon} {s.name}</p>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        s.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    {s.start_date && <p className={`text-xs ${tc.textMuted} mt-1`}>{new Date(s.start_date).toLocaleDateString()} - {s.end_date ? new Date(s.end_date).toLocaleDateString() : 'Ongoing'}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className={`border-t ${tc.border} pt-4`}>
              <h3 className={`pa-heading text-sm uppercase ${tc.textMuted} mb-3`}>Actions</h3>
              <div className="space-y-2">
                {org?.status === 'suspended' ? (
                  <button
                    onClick={() => onAction('activate', org)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition text-sm font-medium"
                  >
                    <Unlock className="w-4 h-4" /> Reactivate Organization
                  </button>
                ) : (
                  <button
                    onClick={() => onAction('suspend', org)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition text-sm font-medium"
                  >
                    <Lock className="w-4 h-4" /> Suspend Organization
                  </button>
                )}
                <button
                  onClick={() => onAction('delete', org)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete Organization
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════ OVERVIEW TAB ═══════
function OverviewTab({ isDark, tc, accent }) {
  const [stats, setStats] = useState({ orgs: 0, users: 0, teams: 0, revenue: 0 })
  const [recentOrgs, setRecentOrgs] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOverview() }, [])

  async function loadOverview() {
    setLoading(true)
    try {
      const [orgsRes, usersRes, teamsRes, paymentsRes, recentOrgsRes, recentUsersRes] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, paid'),
        supabase.from('organizations').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      const paidPayments = (paymentsRes.data || []).filter(p => p.paid)
      const totalRevenue = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

      setStats({
        orgs: orgsRes.count || 0,
        users: usersRes.count || 0,
        teams: teamsRes.count || 0,
        revenue: totalRevenue,
      })
      setRecentOrgs(recentOrgsRes.data || [])
      setRecentUsers(recentUsersRes.data || [])
    } catch (err) { console.error('Overview error:', err) }
    setLoading(false)
  }

  const statCards = [
    { label: 'Organizations', value: stats.orgs, icon: Building2, color: '#3B82F6' },
    { label: 'Users', value: stats.users, icon: Users, color: '#8B5CF6' },
    { label: 'Teams', value: stats.teams, icon: Shield, color: '#10B981' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: '#F59E0B' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pa-au">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} className="pa-glass rounded-2xl p-5 pa-au" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
            <p className={`pa-display text-3xl ${tc.text}`}>{card.value}</p>
            <p className={`pa-label text-xs uppercase ${tc.textMuted} mt-1`}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="pa-glass rounded-2xl p-5 pa-au" style={{ animationDelay: '240ms' }}>
          <h3 className={`pa-heading text-sm uppercase ${tc.textMuted} mb-4`}>Recent Organizations</h3>
          <div className="space-y-3">
            {recentOrgs.map(org => (
              <div key={org.id} className={`flex items-center justify-between py-2 border-b ${tc.border} last:border-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: accent.primary }}>
                    {org.name?.charAt(0)}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${tc.text}`}>{org.name}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{org.slug}</p>
                  </div>
                </div>
                <span className={`text-xs ${tc.textMuted}`}>{new Date(org.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="pa-glass rounded-2xl p-5 pa-au" style={{ animationDelay: '300ms' }}>
          <h3 className={`pa-heading text-sm uppercase ${tc.textMuted} mb-4`}>Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.map(u => (
              <div key={u.id} className={`flex items-center justify-between py-2 border-b ${tc.border} last:border-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${accent.primary}30`, color: accent.primary }}>
                    {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${tc.text}`}>{u.full_name || 'Unnamed'}</p>
                    <p className={`text-xs ${tc.textMuted}`}>{u.email}</p>
                  </div>
                </div>
                <span className={`text-xs ${tc.textMuted}`}>{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════ ORGANIZATIONS TAB ═══════
function OrganizationsTab({ isDark, tc, accent, user, showToast }) {
  const [orgs, setOrgs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false })

  useEffect(() => { loadOrgs() }, [])

  async function loadOrgs() {
    setLoading(true)
    try {
      const { data } = await supabase.from('organizations').select('*, user_roles(count)').order('created_at', { ascending: false })
      setOrgs(data || [])
    } catch (err) { console.error('Orgs error:', err) }
    setLoading(false)
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

  async function handleOrgAction(action, org) {
    if (action === 'suspend') {
      setConfirmModal({
        open: true,
        title: 'Suspend Organization',
        message: `Are you sure you want to suspend "${org.name}"? All members will lose access until reactivated.`,
        destructive: false,
        onConfirm: async () => {
          await supabase.from('organizations').update({ status: 'suspended' }).eq('id', org.id)
          await logAction('suspend_org', 'organization', org.id, { org_name: org.name })
          showToast(`${org.name} suspended`, 'success')
          loadOrgs()
          setSelectedOrg(null)
        }
      })
    } else if (action === 'activate') {
      setConfirmModal({
        open: true,
        title: 'Reactivate Organization',
        message: `Are you sure you want to reactivate "${org.name}"?`,
        destructive: false,
        onConfirm: async () => {
          await supabase.from('organizations').update({ status: 'active' }).eq('id', org.id)
          await logAction('activate_org', 'organization', org.id, { org_name: org.name })
          showToast(`${org.name} reactivated`, 'success')
          loadOrgs()
          setSelectedOrg(null)
        }
      })
    } else if (action === 'delete') {
      setConfirmModal({
        open: true,
        title: 'Permanently Delete Organization',
        message: `This will PERMANENTLY delete "${org.name}" and all its data (teams, seasons, players, payments). This cannot be undone.`,
        destructive: true,
        requireTyping: true,
        onConfirm: async () => {
          await logAction('delete_org', 'organization', org.id, { org_name: org.name })
          await supabase.from('organizations').delete().eq('id', org.id)
          showToast(`${org.name} deleted`, 'success')
          loadOrgs()
          setSelectedOrg(null)
        }
      })
    }
  }

  const filtered = orgs.filter(o =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.slug?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 pa-au">
      {/* Search */}
      <div className="pa-glass rounded-2xl p-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>
      </div>

      {/* Orgs List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="pa-glass rounded-2xl p-8 text-center">
          <Building2 className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
          <p className={`text-sm ${tc.textMuted}`}>{search ? 'No organizations match your search' : 'No organizations found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((org, i) => (
            <div
              key={org.id}
              className={`pa-glass rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.005] pa-au`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => setSelectedOrg(org)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: accent.primary }}>
                    {org.name?.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-semibold ${tc.text}`}>{org.name}</p>
                    <p className={`text-sm ${tc.textMuted}`}>{org.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    org.status === 'suspended'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {org.status === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                  <span className={`text-xs ${tc.textMuted}`}>{new Date(org.created_at).toLocaleDateString()}</span>
                  <ChevronRight className={`w-4 h-4 ${tc.textMuted}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <OrgDetailSlideOver
        org={selectedOrg}
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        isDark={isDark}
        tc={tc}
        accent={accent}
        onAction={handleOrgAction}
      />

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

// ═══════ USERS TAB ═══════
function UsersTab({ isDark, tc, accent, user, showToast }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState({ open: false })

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
    } catch (err) { console.error('Users error:', err) }
    setLoading(false)
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

  async function handleSuspend(u) {
    const isSuspended = u.is_suspended
    setConfirmModal({
      open: true,
      title: isSuspended ? 'Reactivate User' : 'Suspend User',
      message: isSuspended
        ? `Reactivate "${u.full_name || u.email}"? They will regain access to their account.`
        : `Suspend "${u.full_name || u.email}"? They will be locked out of VolleyBrain.`,
      destructive: !isSuspended,
      onConfirm: async () => {
        await supabase.from('profiles').update({ is_suspended: !isSuspended }).eq('id', u.id)
        await logAction(isSuspended ? 'activate_user' : 'suspend_user', 'user', u.id, { user_name: u.full_name, email: u.email })
        showToast(`${u.full_name || u.email} ${isSuspended ? 'reactivated' : 'suspended'}`, 'success')
        loadUsers()
      }
    })
  }

  async function handleToggleSuperAdmin(u) {
    const isAlready = u.is_platform_admin
    setConfirmModal({
      open: true,
      title: isAlready ? 'Revoke Super-Admin' : 'Grant Super-Admin',
      message: isAlready
        ? `Remove super-admin access from "${u.full_name || u.email}"?`
        : `Grant full platform super-admin access to "${u.full_name || u.email}"? They will be able to manage ALL organizations and users.`,
      destructive: isAlready,
      onConfirm: async () => {
        await supabase.from('profiles').update({ is_platform_admin: !isAlready }).eq('id', u.id)
        await logAction(isAlready ? 'revoke_super_admin' : 'grant_super_admin', 'user', u.id, { user_name: u.full_name, email: u.email })
        showToast(`Super-admin ${isAlready ? 'revoked from' : 'granted to'} ${u.full_name || u.email}`, 'success')
        loadUsers()
      }
    })
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4 pa-au">
      {/* Search */}
      <div className="pa-glass rounded-2xl p-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm ${tc.input} border focus:outline-none focus:ring-2`}
            style={{ '--tw-ring-color': `${accent.primary}50` }}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="pa-glass rounded-2xl p-8 text-center">
          <Users className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
          <p className={`text-sm ${tc.textMuted}`}>{search ? 'No users match your search' : 'No users found'}</p>
        </div>
      ) : (
        <div className="pa-glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tc.border}`}>
                  <th className={`pa-label text-xs uppercase ${tc.textMuted} text-left px-4 py-3`}>User</th>
                  <th className={`pa-label text-xs uppercase ${tc.textMuted} text-left px-4 py-3`}>Email</th>
                  <th className={`pa-label text-xs uppercase ${tc.textMuted} text-left px-4 py-3`}>Joined</th>
                  <th className={`pa-label text-xs uppercase ${tc.textMuted} text-center px-4 py-3`}>Status</th>
                  <th className={`pa-label text-xs uppercase ${tc.textMuted} text-center px-4 py-3`}>Super-Admin</th>
                  <th className={`pa-label text-xs uppercase ${tc.textMuted} text-right px-4 py-3`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className={`border-b ${tc.border} last:border-0 pa-au`} style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${accent.primary}30`, color: accent.primary }}>
                          {u.full_name?.charAt(0) || '?'}
                        </div>
                        <span className={`text-sm font-medium ${tc.text}`}>{u.full_name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${tc.textSecondary}`}>{u.email}</td>
                    <td className={`px-4 py-3 text-sm ${tc.textMuted}`}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        u.is_suspended ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {u.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.is_platform_admin && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                          Super-Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSuspend(u)}
                          title={u.is_suspended ? 'Reactivate' : 'Suspend'}
                          className={`p-1.5 rounded-lg transition ${u.is_suspended ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}
                        >
                          {u.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleSuperAdmin(u)}
                          title={u.is_platform_admin ? 'Revoke super-admin' : 'Grant super-admin'}
                          className={`p-1.5 rounded-lg transition ${u.is_platform_admin ? 'text-purple-400 hover:bg-purple-500/10' : 'text-slate-400 hover:bg-slate-500/10'}`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

// ═══════ AUDIT LOG TAB ═══════
function AuditLogTab({ isDark, tc, accent }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('platform_admin_actions')
        .select('*, profiles:admin_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100)
      setLogs(data || [])
    } catch (err) { console.error('Audit log error:', err) }
    setLoading(false)
  }

  function getActionIcon(type) {
    switch (type) {
      case 'suspend_org': return { icon: Lock, color: '#F59E0B' }
      case 'activate_org': return { icon: Unlock, color: '#10B981' }
      case 'delete_org': return { icon: Trash2, color: '#EF4444' }
      case 'suspend_user': return { icon: UserX, color: '#F59E0B' }
      case 'activate_user': return { icon: UserCheck, color: '#10B981' }
      case 'grant_super_admin': return { icon: ShieldCheck, color: '#8B5CF6' }
      case 'revoke_super_admin': return { icon: Shield, color: '#EF4444' }
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4 pa-au">
      {logs.length === 0 ? (
        <div className="pa-glass rounded-2xl p-8 text-center">
          <FileText className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
          <p className={`text-sm ${tc.textMuted}`}>No audit log entries yet</p>
        </div>
      ) : (
        <div className="pa-glass rounded-2xl divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>
          {logs.map((log, i) => {
            const { icon: ActionIcon, color } = getActionIcon(log.action_type)
            return (
              <div key={log.id} className={`px-5 py-4 flex items-start gap-4 pa-au`} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                  <ActionIcon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${tc.text}`}>{formatAction(log.action_type)}</p>
                  <p className={`text-xs ${tc.textMuted} mt-0.5`}>
                    by {log.profiles?.full_name || log.profiles?.email || 'Unknown admin'}
                    {log.details?.org_name && ` — ${log.details.org_name}`}
                    {log.details?.user_name && ` — ${log.details.user_name}`}
                    {log.details?.email && !log.details?.user_name && ` — ${log.details.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className={`w-3 h-3 ${tc.textMuted}`} />
                  <span className={`text-xs ${tc.textMuted}`}>{timeAgo(log.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════ MAIN PAGE ═══════
function PlatformAdminPage({ showToast }) {
  const { user, isPlatformAdmin } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')

  // Access gate
  if (!isPlatformAdmin) {
    return (
      <div className={`${isDark ? '' : 'pa-light'}`}>
        <style>{PA_STYLES}</style>
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500/20 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className={`pa-display text-3xl ${tc.text} mb-2`}>Access Denied</h1>
          <p className={`text-sm ${tc.textMuted}`}>You do not have platform administrator privileges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isDark ? '' : 'pa-light'}`}>
      <style>{PA_STYLES}</style>

      {/* Security Warning Banner */}
      <div className="pa-au mb-6 rounded-2xl p-4 flex items-center gap-3" style={{ background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          <span className="font-semibold">Platform Admin Mode</span> — All actions are logged and audited. Use with care.
        </p>
      </div>

      {/* Header */}
      <div className="pa-au mb-6">
        <h1 className={`pa-display text-4xl ${tc.text} flex items-center gap-3`}>
          <Shield className="w-8 h-8" style={{ color: accent.primary }} />
          Platform Administration
        </h1>
        <p className={`pa-label text-sm uppercase ${tc.textMuted} mt-1`}>Super-Admin Control Panel</p>
      </div>

      {/* Tabs */}
      <div className="pa-glass rounded-2xl p-1.5 mb-6 inline-flex gap-1 pa-au" style={{ animationDelay: '100ms' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white shadow-lg'
                  : `${tc.textSecondary} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`
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
      {activeTab === 'overview' && <OverviewTab isDark={isDark} tc={tc} accent={accent} />}
      {activeTab === 'organizations' && <OrganizationsTab isDark={isDark} tc={tc} accent={accent} user={user} showToast={showToast} />}
      {activeTab === 'users' && <UsersTab isDark={isDark} tc={tc} accent={accent} user={user} showToast={showToast} />}
      {activeTab === 'audit' && <AuditLogTab isDark={isDark} tc={tc} accent={accent} />}
    </div>
  )
}

export { PlatformAdminPage }
