import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Shield, ShieldCheck, Users, Search, X, AlertTriangle, Trash2,
  ChevronDown, ChevronRight, UserX, UserCheck, Clock, Activity,
  Filter, Download, RefreshCw, Mail, Building2, Calendar, Eye
} from '../../constants/icons'

// ================================================================
// PLATFORM USERS PAGE — Refactored from UsersTab in PlatformAdminPage
// Full standalone user management for platform super-admins
// ================================================================

const PU_STYLES = `
  @keyframes pu-fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pu-fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pu-scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes pu-slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
  @keyframes pu-slideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(100%)}}
  .pu-au{animation:pu-fadeUp .4s ease-out both}
  .pu-ai{animation:pu-fadeIn .3s ease-out both}
  .pu-as{animation:pu-scaleIn .25s ease-out both}
  .pu-slide-in{animation:pu-slideIn .3s ease-out both}
`

// ================================================================
// CONFIRM MODAL
// ================================================================
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, destructive }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className={`pu-as w-full max-w-md rounded-xl p-6 shadow-2xl ${
        isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            destructive ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className={`text-lg font-bold ${tc.text}`}>{title}</h3>
        </div>
        <p className={`text-sm leading-relaxed ${tc.textSecondary} mb-6`}>{message}</p>
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
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
              destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// USER DETAIL SLIDE-OVER
// ================================================================
function UserDetailSlideOver({ user: selectedUser, isOpen, onClose, onAction, showToast, onDataChange }) {
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()
  const { user: adminUser } = useAuth()
  const [orgMemberships, setOrgMemberships] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [xpEntries, setXpEntries] = useState([])
  const [shoutoutsReceived, setShoutoutsReceived] = useState([])
  const [loading, setLoading] = useState(true)
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, membership: null })

  useEffect(() => {
    if (isOpen && selectedUser?.id) {
      loadUserDetails()
    }
  }, [isOpen, selectedUser?.id])

  async function loadUserDetails() {
    setLoading(true)
    try {
      const [rolesRes, actionsOnRes, actionsByRes, xpRes, shoutoutsRes] = await Promise.all([
        supabase.from('user_roles')
          .select('*, organizations(id, name, slug, is_active)')
          .eq('user_id', selectedUser.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('platform_admin_actions')
          .select('*, profiles:admin_id(full_name)')
          .eq('target_id', selectedUser.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('platform_admin_actions')
          .select('*, profiles:admin_id(full_name)')
          .eq('admin_id', selectedUser.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('xp_ledger')
          .select('amount, reason, created_at')
          .eq('user_id', selectedUser.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('shoutouts')
          .select('id, message, created_at, category')
          .eq('recipient_id', selectedUser.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setOrgMemberships(rolesRes.data || [])

      // Combine actions on user and actions by user into unified timeline
      const combined = [
        ...(actionsOnRes.data || []).map(a => ({ ...a, _direction: 'on_user' })),
        ...(actionsByRes.data || []).map(a => ({ ...a, _direction: 'by_user' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20)
      setRecentActivity(combined)
      setXpEntries(xpRes.data || [])
      setShoutoutsReceived(shoutoutsRes.data || [])
    } catch (err) {
      console.error('Error loading user details:', err)
    }
    setLoading(false)
  }

  async function handleRemoveFromOrg(membership) {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', membership.id)
      if (error) throw error
      await supabase.from('platform_admin_actions').insert({
        admin_id: adminUser?.id,
        action_type: 'remove_user_from_org',
        target_type: 'user',
        target_id: selectedUser.id,
        details: {
          user_name: selectedUser.full_name,
          email: selectedUser.email,
          org_name: membership.organizations?.name,
          org_id: membership.organization_id,
          role: membership.role,
        },
      })
      showToast?.(`Removed from ${membership.organizations?.name || 'organization'}`, 'success')
      setRemoveConfirm({ open: false, membership: null })
      loadUserDetails()
      onDataChange?.()
    } catch (err) {
      console.error('Error removing user from org:', err)
      showToast?.('Failed to remove user from organization', 'error')
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return 'N/A'
    const now = new Date()
    const date = new Date(dateStr)
    const mins = Math.floor((now - date) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen || !selectedUser) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-lg pu-slide-in overflow-y-auto shadow-2xl ${
        isDark
          ? 'bg-lynx-midnight border-l border-lynx-border-dark'
          : 'bg-white border-l border-lynx-silver'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 p-5 border-b backdrop-blur-xl ${
          isDark ? 'bg-lynx-midnight/95 border-lynx-border-dark' : 'bg-white/95 border-lynx-silver'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-xl font-bold ${tc.text}`}>User Profile</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* User identity */}
          <div className="flex items-center gap-4">
            {selectedUser.avatar_url ? (
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.full_name || ''}
                className="w-14 h-14 rounded-full object-cover border-2"
                style={{ borderColor: accent.primary }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ background: accent.primary }}
              >
                {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-semibold ${tc.text} truncate`}>
                {selectedUser.full_name || 'Unnamed User'}
              </p>
              <p className={`text-sm ${tc.textMuted} truncate`}>{selectedUser.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  selectedUser.is_suspended
                    ? 'bg-red-500/15 text-red-500'
                    : 'bg-emerald-500/15 text-emerald-500'
                }`}>
                  {selectedUser.is_suspended ? 'Suspended' : 'Active'}
                </span>
                {selectedUser.is_platform_admin && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/15 text-purple-500">
                    Super-Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Profile Details */}
            <section>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} mb-3`}>
                Details
              </h3>
              <div className={`rounded-xl border ${tc.border} overflow-hidden`}>
                {[
                  { label: 'Full Name', value: selectedUser.full_name || 'Not set' },
                  { label: 'Email', value: selectedUser.email || 'N/A' },
                  { label: 'Phone', value: selectedUser.phone || 'Not set' },
                  { label: 'Joined', value: selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                  { label: 'Last Sign In', value: selectedUser.last_sign_in_at ? timeAgo(selectedUser.last_sign_in_at) : 'Never' },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i > 0 ? `border-t ${tc.border}` : ''
                    }`}
                  >
                    <span className={`text-sm ${tc.textMuted}`}>{item.label}</span>
                    <span className={`text-sm font-medium ${tc.text}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Organization Memberships */}
            <section>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} mb-3`}>
                Organizations ({orgMemberships.length})
              </h3>
              {orgMemberships.length === 0 ? (
                <div className={`rounded-xl border ${tc.border} p-6 text-center`}>
                  <Building2 className={`w-8 h-8 mx-auto ${tc.textMuted} mb-2`} />
                  <p className={`text-sm ${tc.textMuted}`}>No organization memberships</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orgMemberships.map(m => (
                    <div
                      key={m.id}
                      className={`rounded-xl border ${tc.border} p-3 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: accent.primary }}
                        >
                          {m.organizations?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${tc.text}`}>
                            {m.organizations?.name || 'Unknown Org'}
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>{m.organizations?.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{ background: `${accent.primary}15`, color: accent.primary }}
                        >
                          {m.role}
                        </span>
                        {m.organizations?.is_active === false && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/15 text-red-500">
                            Org Suspended
                          </span>
                        )}
                        <button
                          onClick={() => setRemoveConfirm({ open: true, membership: m })}
                          title="Remove from organization"
                          className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Activity */}
            <section>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} mb-3`}>
                Recent Admin Actions
              </h3>
              {recentActivity.length === 0 ? (
                <div className={`rounded-xl border ${tc.border} p-6 text-center`}>
                  <Activity className={`w-8 h-8 mx-auto ${tc.textMuted} mb-2`} />
                  <p className={`text-sm ${tc.textMuted}`}>No admin actions recorded for this user</p>
                </div>
              ) : (
                <div className={`rounded-xl border ${tc.border} overflow-hidden divide-y ${tc.border}`}>
                  {recentActivity.map((log, i) => (
                    <div key={`${log.id}-${log._direction || i}`} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        log._direction === 'by_user' ? 'bg-blue-500/10' : 'bg-slate-500/10'
                      }`}>
                        <Activity className={`w-3.5 h-3.5 ${log._direction === 'by_user' ? 'text-blue-400' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${tc.text}`}>
                          {log.action_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {log._direction === 'by_user' ? 'performed' : `by ${log.profiles?.full_name || 'Unknown'}`} · {timeAgo(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Engagement Data */}
            {(xpEntries.length > 0 || shoutoutsReceived.length > 0) && (
              <section>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} mb-3`}>
                  Engagement
                </h3>
                {xpEntries.length > 0 && (
                  <div className={`rounded-xl border ${tc.border} overflow-hidden mb-3`}>
                    <div className={`px-4 py-2 border-b ${tc.border} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-semibold ${tc.textMuted}`}>Recent XP</p>
                    </div>
                    {xpEntries.map((xp, i) => (
                      <div key={i} className={`px-4 py-2.5 flex items-center justify-between ${i > 0 ? `border-t ${tc.border}` : ''}`}>
                        <span className={`text-sm ${tc.textSecondary}`}>{xp.reason || 'XP earned'}</span>
                        <span className="text-sm font-semibold text-amber-500">+{xp.amount} XP</span>
                      </div>
                    ))}
                  </div>
                )}
                {shoutoutsReceived.length > 0 && (
                  <div className={`rounded-xl border ${tc.border} overflow-hidden`}>
                    <div className={`px-4 py-2 border-b ${tc.border} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-semibold ${tc.textMuted}`}>Shoutouts Received</p>
                    </div>
                    {shoutoutsReceived.map((s, i) => (
                      <div key={s.id} className={`px-4 py-2.5 ${i > 0 ? `border-t ${tc.border}` : ''}`}>
                        <p className={`text-sm ${tc.text}`}>{s.message || s.category || 'Shoutout'}</p>
                        <p className={`text-xs ${tc.textMuted}`}>{timeAgo(s.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Actions */}
            <section className={`border-t ${tc.border} pt-5`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} mb-3`}>
                Actions
              </h3>
              <div className="space-y-2">
                {selectedUser.is_suspended ? (
                  <button
                    onClick={() => onAction('activate', selectedUser)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition text-sm font-medium"
                  >
                    <UserCheck className="w-4 h-4" /> Reactivate User
                  </button>
                ) : (
                  <button
                    onClick={() => onAction('suspend', selectedUser)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition text-sm font-medium"
                  >
                    <UserX className="w-4 h-4" /> Suspend User
                  </button>
                )}
                {selectedUser.is_platform_admin ? (
                  <button
                    onClick={() => onAction('revoke_admin', selectedUser)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-sm font-medium"
                  >
                    <Shield className="w-4 h-4" /> Revoke Super-Admin
                  </button>
                ) : (
                  <button
                    onClick={() => onAction('grant_admin', selectedUser)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition text-sm font-medium"
                  >
                    <ShieldCheck className="w-4 h-4" /> Grant Super-Admin
                  </button>
                )}
              </div>
            </section>

            {/* Danger Zone */}
            <section className={`border-t ${tc.border} pt-4 mt-4`}>
              <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">Danger Zone</p>
              <button
                onClick={() => onAction('delete', selectedUser)}
                disabled={selectedUser.is_platform_admin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors w-full disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Permanently Delete User
              </button>
              {selectedUser.is_platform_admin && (
                <p className={`text-xs ${tc.textMuted} mt-1`}>Platform admins cannot be deleted</p>
              )}
            </section>
          </div>
        )}

        {/* Remove from Org Confirmation */}
        {removeConfirm.open && removeConfirm.membership && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[75] p-4">
            <div className={`w-full max-w-sm rounded-xl p-5 shadow-2xl ${
              isDark ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/15">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
                <h4 className={`text-base font-bold ${tc.text}`}>Remove from Organization</h4>
              </div>
              <p className={`text-sm ${tc.textSecondary} mb-4`}>
                Remove <strong>{selectedUser.full_name || selectedUser.email}</strong> from <strong>{removeConfirm.membership.organizations?.name}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRemoveConfirm({ open: false, membership: null })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveFromOrg(removeConfirm.membership)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ================================================================
// FILTER DROPDOWN
// ================================================================
function FilterDropdown({ label, value, onChange, options, isDark, tc }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-medium border transition cursor-pointer ${
          isDark
            ? 'bg-lynx-graphite border-lynx-border-dark text-white'
            : 'bg-white border-lynx-silver text-lynx-navy'
        } focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${tc.textMuted}`} />
    </div>
  )
}

// ================================================================
// MAIN COMPONENT — PlatformUsersPage
// ================================================================
function PlatformUsersPage({ showToast }) {
  const { user, isPlatformAdmin } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  // Data state
  const [users, setUsers] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [userRolesMap, setUserRolesMap] = useState({})
  const [loading, setLoading] = useState(true)

  // Filter state
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // UI state
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false })
  const [duplicates, setDuplicates] = useState([])
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [loadingDuplicates, setLoadingDuplicates] = useState(false)
  const [sortField, setSortField] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)

  const searchRef = useRef(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [usersRes, orgsRes, rolesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('organizations')
          .select('id, name, slug')
          .order('name'),
        supabase
          .from('user_roles')
          .select('user_id, role, organization_id, organizations(id, name)')
          .eq('is_active', true),
      ])

      setUsers(usersRes.data || [])
      setOrganizations(orgsRes.data || [])

      // Build a map: userId -> [{ role, orgName, orgId }]
      const rMap = {}
      for (const r of (rolesRes.data || [])) {
        if (!rMap[r.user_id]) rMap[r.user_id] = []
        rMap[r.user_id].push({
          role: r.role,
          orgId: r.organization_id,
          orgName: r.organizations?.name || 'Unknown',
        })
      }
      setUserRolesMap(rMap)
    } catch (err) {
      console.error('Error loading platform users:', err)
    }
    setLoading(false)
  }

  // Log admin action
  async function logAction(actionType, targetId, details) {
    try {
      await supabase.from('platform_admin_actions').insert({
        admin_id: user.id,
        action_type: actionType,
        target_type: 'user',
        target_id: targetId,
        details,
      })
    } catch (err) {
      console.error('Error logging admin action:', err)
    }
  }

  // Suspend / Activate user
  function handleSuspendActivate(action, targetUser) {
    const isSuspend = action === 'suspend'
    setConfirmModal({
      open: true,
      title: isSuspend ? 'Suspend User' : 'Reactivate User',
      message: isSuspend
        ? `Are you sure you want to suspend "${targetUser.full_name || targetUser.email}"? They will be locked out of the platform.`
        : `Are you sure you want to reactivate "${targetUser.full_name || targetUser.email}"? They will regain access to their account.`,
      destructive: isSuspend,
      onConfirm: async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ is_suspended: isSuspend })
          .eq('id', targetUser.id)
        if (error) {
          showToast?.(`Failed to ${isSuspend ? 'suspend' : 'activate'} user`, 'error')
          return
        }
        await logAction(
          isSuspend ? 'suspend_user' : 'activate_user',
          targetUser.id,
          { user_name: targetUser.full_name, email: targetUser.email }
        )
        showToast?.(
          `${targetUser.full_name || targetUser.email} ${isSuspend ? 'suspended' : 'reactivated'}`,
          'success'
        )
        loadData()
        setSelectedUser(null)
      },
    })
  }

  // Grant / Revoke super-admin
  function handleToggleSuperAdmin(action, targetUser) {
    const isGrant = action === 'grant_admin'
    setConfirmModal({
      open: true,
      title: isGrant ? 'Grant Super-Admin' : 'Revoke Super-Admin',
      message: isGrant
        ? `Grant full platform super-admin access to "${targetUser.full_name || targetUser.email}"? They will be able to manage ALL organizations and users.`
        : `Remove super-admin access from "${targetUser.full_name || targetUser.email}"?`,
      destructive: !isGrant,
      onConfirm: async () => {
        const { error } = await supabase
          .from('profiles')
          .update({ is_platform_admin: isGrant })
          .eq('id', targetUser.id)
        if (error) {
          showToast?.(`Failed to ${isGrant ? 'grant' : 'revoke'} super-admin`, 'error')
          return
        }
        await logAction(
          isGrant ? 'grant_super_admin' : 'revoke_super_admin',
          targetUser.id,
          { user_name: targetUser.full_name, email: targetUser.email }
        )
        showToast?.(
          `Super-admin ${isGrant ? 'granted to' : 'revoked from'} ${targetUser.full_name || targetUser.email}`,
          'success'
        )
        loadData()
        setSelectedUser(null)
      },
    })
  }

  // Duplicate detection
  function checkForDuplicates() {
    setLoadingDuplicates(true)
    const nameGroups = {}
    users.forEach(u => {
      if (!u.full_name) return
      const key = u.full_name.toLowerCase().trim()
      if (!nameGroups[key]) nameGroups[key] = []
      nameGroups[key].push(u)
    })
    const dupes = Object.entries(nameGroups)
      .filter(([_, group]) => group.length > 1)
      .map(([name, group]) => ({ type: 'name', key: name, users: group }))
    setDuplicates(dupes)
    setShowDuplicates(true)
    setLoadingDuplicates(false)
  }

  // Delete user
  function handleDeleteUser(targetUser) {
    setConfirmModal({
      open: true,
      title: 'Permanently Delete User',
      message: `This will permanently delete "${targetUser.full_name || targetUser.email}" and remove all their data, org memberships, and references. This action cannot be undone.`,
      destructive: true,
      onConfirm: async () => {
        try {
          await logAction('delete_user', targetUser.id, {
            user_name: targetUser.full_name,
            email: targetUser.email,
          })
          const { error } = await supabase.rpc('delete_profile_cascade', { p_profile_id: targetUser.id })
          if (error) throw error
          showToast?.(`${targetUser.full_name || targetUser.email} deleted`, 'success')
          setSelectedUser(null)
          loadData()
        } catch (err) {
          console.error('Delete user error:', err)
          showToast?.(`Failed to delete user: ${err.message}`, 'error')
        }
      },
    })
  }

  // Route slide-over actions
  function handleSlideOverAction(action, targetUser) {
    if (action === 'suspend' || action === 'activate') {
      handleSuspendActivate(action, targetUser)
    } else if (action === 'grant_admin' || action === 'revoke_admin') {
      handleToggleSuperAdmin(action, targetUser)
    } else if (action === 'delete') {
      handleDeleteUser(targetUser)
    }
  }

  // Sort handler
  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Filter + sort users
  const filteredUsers = users
    .filter(u => {
      // Search filter
      if (search) {
        const q = search.toLowerCase()
        const matchName = u.full_name?.toLowerCase().includes(q)
        const matchEmail = u.email?.toLowerCase().includes(q)
        if (!matchName && !matchEmail) return false
      }
      // Status filter
      if (statusFilter === 'active' && u.is_suspended) return false
      if (statusFilter === 'suspended' && !u.is_suspended) return false
      if (statusFilter === 'platform_admin' && !u.is_platform_admin) return false
      // Org filter
      if (orgFilter !== 'all') {
        const roles = userRolesMap[u.id] || []
        if (!roles.some(r => r.orgId === orgFilter)) return false
      }
      // Role filter
      if (roleFilter !== 'all') {
        const roles = userRolesMap[u.id] || []
        if (!roles.some(r => r.role === roleFilter)) return false
      }
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date()
        let cutoff
        if (dateFilter === 'this_week') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        else if (dateFilter === 'this_month') cutoff = new Date(now.getFullYear(), now.getMonth(), 1)
        else if (dateFilter === 'this_quarter') cutoff = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        else if (dateFilter === 'this_year') cutoff = new Date(now.getFullYear(), 0, 1)
        if (cutoff && (!u.created_at || new Date(u.created_at) < cutoff)) return false
      }
      return true
    })
    .sort((a, b) => {
      let valA, valB
      switch (sortField) {
        case 'full_name':
          valA = (a.full_name || '').toLowerCase()
          valB = (b.full_name || '').toLowerCase()
          break
        case 'email':
          valA = (a.email || '').toLowerCase()
          valB = (b.email || '').toLowerCase()
          break
        case 'created_at':
        default:
          valA = a.created_at || ''
          valB = b.created_at || ''
          break
      }
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })

  // Org dropdown options
  const orgOptions = [
    { value: 'all', label: 'All Organizations' },
    ...organizations.map(o => ({ value: o.id, label: o.name })),
  ]

  // Role dropdown options
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'coach', label: 'Coach' },
    { value: 'parent', label: 'Parent' },
    { value: 'player', label: 'Player' },
  ]

  // Status dropdown options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'platform_admin', label: 'Platform Admins' },
  ]

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
  ]

  const hasActiveFilters = orgFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || search !== ''

  // Access gate
  if (!isPlatformAdmin) {
    return (
      <div>
        <style>{PU_STYLES}</style>
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-500/15 mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className={`text-3xl font-bold ${tc.text} mb-2`}>Access Denied</h1>
          <p className={`text-sm ${tc.textMuted}`}>You do not have platform administrator privileges.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <style>{PU_STYLES}</style>

      {/* Page Header */}
      <div className="pu-au mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${tc.text} flex items-center gap-3`}>
              <Users className="w-7 h-7" style={{ color: accent.primary }} />
              Platform Users
            </h1>
            <p className={`text-sm ${tc.textMuted} mt-1`}>
              {users.length} total users across all organizations
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
              isDark
                ? 'border-lynx-border-dark text-slate-300 hover:bg-lynx-graphite'
                : 'border-lynx-silver text-lynx-slate hover:bg-lynx-frost'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className={`pu-au rounded-xl border p-4 mb-5 ${
        isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
      }`} style={{ animationDelay: '60ms' }}>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm border transition ${tc.input} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30`}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus() }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className={`w-4 h-4 ${tc.textMuted} hidden lg:block`} />
            <FilterDropdown
              label="Organization"
              value={orgFilter}
              onChange={setOrgFilter}
              options={orgOptions}
              isDark={isDark}
              tc={tc}
            />
            <FilterDropdown
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={roleOptions}
              isDark={isDark}
              tc={tc}
            />
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              isDark={isDark}
              tc={tc}
            />
            <FilterDropdown
              label="Joined"
              value={dateFilter}
              onChange={setDateFilter}
              options={dateOptions}
              isDark={isDark}
              tc={tc}
            />
            {hasActiveFilters && (
              <button
                onClick={() => { setSearch(''); setOrgFilter('all'); setRoleFilter('all'); setStatusFilter('all'); setDateFilter('all') }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div className={`mt-3 pt-3 border-t ${tc.border} flex items-center justify-between`}>
            <p className={`text-xs ${tc.textMuted}`}>
              Showing {filteredUsers.length} of {users.length} users
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}
          />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={`pu-au rounded-xl border p-12 text-center ${
          isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
        }`}>
          <Users className={`w-12 h-12 mx-auto mb-3 ${tc.textMuted}`} />
          <h3 className={`text-lg font-bold ${tc.text} mb-1`}>No users found</h3>
          <p className={`text-sm ${tc.textMuted}`}>
            {hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'No users exist on the platform yet.'}
          </p>
        </div>
      ) : (
        <div className={`pu-au rounded-xl border overflow-hidden ${
          isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
        }`} style={{ animationDelay: '120ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${tc.border} ${isDark ? 'bg-lynx-graphite/50' : 'bg-lynx-frost/50'}`}>
                  <th
                    className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-left px-4 py-3 cursor-pointer select-none hover:text-[var(--accent-primary)] transition`}
                    onClick={() => handleSort('full_name')}
                  >
                    <div className="flex items-center gap-1">
                      User
                      {sortField === 'full_name' && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th
                    className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-left px-4 py-3 cursor-pointer select-none hover:text-[var(--accent-primary)] transition`}
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === 'email' && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-left px-4 py-3`}>
                    Organization(s)
                  </th>
                  <th className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-left px-4 py-3`}>
                    Role(s)
                  </th>
                  <th
                    className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-left px-4 py-3 cursor-pointer select-none hover:text-[var(--accent-primary)] transition`}
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      {sortField === 'created_at' && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? '' : 'rotate-180'}`} />
                      )}
                    </div>
                  </th>
                  <th className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-center px-4 py-3`}>
                    Status
                  </th>
                  <th className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted} text-right px-4 py-3`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const roles = userRolesMap[u.id] || []
                  const uniqueOrgs = [...new Map(roles.map(r => [r.orgId, r.orgName])).entries()]
                  const uniqueRoles = [...new Set(roles.map(r => r.role))]

                  return (
                    <tr
                      key={u.id}
                      className={`border-b ${tc.border} last:border-0 cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-lynx-graphite/60' : 'hover:bg-lynx-frost/70'
                      } pu-au`}
                      style={{ animationDelay: `${Math.min(i * 25, 500)}ms` }}
                      onClick={() => setSelectedUser(u)}
                    >
                      {/* Avatar + Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: accent.primary }}
                            >
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${tc.text} truncate`}>
                              {u.full_name || 'Unnamed'}
                            </p>
                            {u.is_platform_admin && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-500/15 text-purple-500 mt-0.5">
                                <Shield className="w-2.5 h-2.5" /> PLATFORM ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className={`px-4 py-3 text-sm ${tc.textSecondary} max-w-[200px] truncate`}>
                        {u.email}
                      </td>

                      {/* Organization(s) */}
                      <td className="px-4 py-3">
                        {uniqueOrgs.length === 0 ? (
                          <span className={`text-xs ${tc.textMuted}`}>--</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {uniqueOrgs.slice(0, 2).map(([orgId, orgName]) => (
                              <span
                                key={orgId}
                                className={`px-2 py-0.5 text-xs rounded-full truncate max-w-[140px] ${
                                  isDark
                                    ? 'bg-slate-700/60 text-slate-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {orgName}
                              </span>
                            ))}
                            {uniqueOrgs.length > 2 && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                isDark ? 'bg-slate-700/60 text-slate-400' : 'bg-slate-100 text-slate-500'
                              }`}>
                                +{uniqueOrgs.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Role(s) */}
                      <td className="px-4 py-3">
                        {uniqueRoles.length === 0 ? (
                          <span className={`text-xs ${tc.textMuted}`}>--</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {uniqueRoles.map(role => (
                              <span
                                key={role}
                                className="px-2 py-0.5 text-xs font-medium rounded-full"
                                style={{ background: `${accent.primary}15`, color: accent.primary }}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Joined */}
                      <td className={`px-4 py-3 text-sm ${tc.textMuted} whitespace-nowrap`}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          u.is_suspended
                            ? 'bg-red-500/15 text-red-500'
                            : 'bg-emerald-500/15 text-emerald-500'
                        }`}>
                          {u.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedUser(u)}
                            title="View details"
                            className={`p-1.5 rounded-lg transition ${
                              isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSuspendActivate(u.is_suspended ? 'activate' : 'suspend', u)}
                            title={u.is_suspended ? 'Reactivate' : 'Suspend'}
                            className={`p-1.5 rounded-lg transition ${
                              u.is_suspended
                                ? 'text-emerald-500 hover:bg-emerald-500/10'
                                : 'text-amber-500 hover:bg-amber-500/10'
                            }`}
                          >
                            {u.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleSuperAdmin(u.is_platform_admin ? 'revoke_admin' : 'grant_admin', u)}
                            title={u.is_platform_admin ? 'Revoke super-admin' : 'Grant super-admin'}
                            className={`p-1.5 rounded-lg transition ${
                              u.is_platform_admin
                                ? 'text-purple-500 hover:bg-purple-500/10'
                                : isDark
                                  ? 'text-slate-400 hover:bg-white/10'
                                  : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Duplicate Detection */}
      {!loading && users.length > 0 && (
        <div className={`pu-au mt-5 rounded-xl border p-4 ${
          isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
        }`} style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${tc.textMuted}`} />
              <h3 className={`text-sm font-semibold ${tc.text}`}>Duplicate Detection</h3>
            </div>
            <button
              onClick={showDuplicates ? () => setShowDuplicates(false) : checkForDuplicates}
              disabled={loadingDuplicates}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${loadingDuplicates ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingDuplicates ? 'Checking...' : showDuplicates ? 'Hide' : 'Check for Duplicates'}
            </button>
          </div>
          {showDuplicates && (
            <div className="mt-4 space-y-3">
              {duplicates.length === 0 ? (
                <p className={`text-sm ${tc.textMuted} text-center py-4`}>No duplicate names detected.</p>
              ) : (
                <>
                  <p className={`text-xs ${tc.textMuted}`}>{duplicates.length} potential duplicate group{duplicates.length !== 1 ? 's' : ''} found</p>
                  {duplicates.map((group, gi) => (
                    <div key={gi} className={`rounded-lg border ${tc.border} overflow-hidden`}>
                      <div className={`px-3 py-2 text-xs font-semibold ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                        "{group.key}" — {group.users.length} profiles
                      </div>
                      <div className={`divide-y ${tc.border}`}>
                        {group.users.map(u => (
                          <div key={u.id} className="px-3 py-2 flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${tc.text}`}>{u.full_name}</p>
                              <p className={`text-xs ${tc.textMuted}`}>{u.email}</p>
                            </div>
                            <button
                              onClick={() => setSelectedUser(u)}
                              className={`text-xs font-medium transition ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'}`}
                            >
                              Review
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Detail Slide-Over */}
      <UserDetailSlideOver
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onAction={handleSlideOverAction}
        showToast={showToast}
        onDataChange={loadData}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title || ''}
        message={confirmModal.message || ''}
        destructive={confirmModal.destructive}
      />
    </div>
  )
}

export { PlatformUsersPage }
export default PlatformUsersPage
