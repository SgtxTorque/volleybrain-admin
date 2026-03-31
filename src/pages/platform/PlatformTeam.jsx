import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Shield, UserPlus, X, Check, Clock, Eye, RefreshCw,
  AlertTriangle, Search, Mail, Key, Edit, Star, Settings
} from '../../constants/icons'

// ================================================================
// PLATFORM TEAM — Internal Team Management for Platform Super-Admins
// Manage platform admins, roles, permissions, and activity
// ================================================================

const PT_STYLES = `
  @keyframes pt-fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pt-fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes pt-scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .pt-au{animation:pt-fadeUp .4s ease-out both}
  .pt-ai{animation:pt-fadeIn .3s ease-out both}
  .pt-as{animation:pt-scaleIn .25s ease-out both}
`

// ================================================================
// ROLE TEMPLATES
// ================================================================
const ROLE_TEMPLATES = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full access to everything (Carlos only)',
    color: '#EF4444',
    permissions: {
      overview: 'full', organizations: 'full', users: 'full', subscriptions: 'full',
      analytics: 'full', engagement: 'full', funnel: 'full', support: 'full',
      notifications: 'full', email: 'full', features: 'full', compliance: 'full',
      audit: 'full', content: 'full', system: 'full', database: 'full',
      team: 'full', settings: 'full'
    }
  },
  admin: {
    label: 'Admin',
    description: 'Full access except settings and team management',
    color: '#8B5CF6',
    permissions: {
      overview: 'full', organizations: 'full', users: 'full', subscriptions: 'full',
      analytics: 'full', engagement: 'full', funnel: 'full', support: 'full',
      notifications: 'full', email: 'full', features: 'full', compliance: 'full',
      audit: 'full', content: 'full', system: 'read', database: 'read',
      team: 'none', settings: 'none'
    }
  },
  support: {
    label: 'Support Agent',
    description: 'Support inbox + read-only on users and orgs',
    color: '#3B82F6',
    permissions: {
      overview: 'read', organizations: 'read', users: 'read', subscriptions: 'none',
      analytics: 'none', engagement: 'none', funnel: 'none', support: 'full',
      notifications: 'read', email: 'none', features: 'read', compliance: 'none',
      audit: 'read', content: 'none', system: 'none', database: 'none',
      team: 'none', settings: 'none'
    }
  },
  analyst: {
    label: 'Analyst',
    description: 'Analytics and reports (read-only)',
    color: '#10B981',
    permissions: {
      overview: 'read', organizations: 'read', users: 'read', subscriptions: 'read',
      analytics: 'read', engagement: 'read', funnel: 'read', support: 'none',
      notifications: 'none', email: 'none', features: 'read', compliance: 'read',
      audit: 'read', content: 'read', system: 'read', database: 'read',
      team: 'none', settings: 'none'
    }
  },
  billing: {
    label: 'Billing Manager',
    description: 'Subscriptions and payments',
    color: '#F59E0B',
    permissions: {
      overview: 'read', organizations: 'read', users: 'none', subscriptions: 'full',
      analytics: 'read', engagement: 'none', funnel: 'none', support: 'read',
      notifications: 'none', email: 'none', features: 'none', compliance: 'read',
      audit: 'read', content: 'none', system: 'none', database: 'none',
      team: 'none', settings: 'none'
    }
  },
}

const PERMISSION_SECTIONS = [
  'overview', 'organizations', 'users', 'subscriptions', 'analytics',
  'engagement', 'funnel', 'support', 'notifications', 'email',
  'features', 'compliance', 'audit', 'content', 'system', 'database',
  'team', 'settings'
]

const SECTION_LABELS = {
  overview: 'Overview',
  organizations: 'Organizations',
  users: 'Users',
  subscriptions: 'Subscriptions',
  analytics: 'Analytics',
  engagement: 'Engagement',
  funnel: 'Reg. Funnel',
  support: 'Support',
  notifications: 'Notifications',
  email: 'Email Center',
  features: 'Features',
  compliance: 'Compliance',
  audit: 'Audit Log',
  content: 'Content',
  system: 'System',
  database: 'Database',
  team: 'Team',
  settings: 'Settings'
}

// ================================================================
// HELPER: Log admin action
// ================================================================
async function logAction(userId, actionType, targetId, details) {
  await supabase.from('platform_admin_actions').insert({
    admin_id: userId,
    action_type: actionType,
    target_type: 'platform_team_member',
    target_id: targetId,
    details,
    ip_address: null,
    user_agent: navigator.userAgent
  })
}

// ================================================================
// HELPER: Format relative time
// ================================================================
function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ================================================================
// INVITE MEMBER MODAL
// ================================================================
function InviteMemberModal({ isOpen, onClose, onInvited, userId, isDark, tc, showToast }) {
  const [emailSearch, setEmailSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundProfile, setFoundProfile] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [selectedRole, setSelectedRole] = useState('support')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setEmailSearch('')
      setFoundProfile(null)
      setNotFound(false)
      setSelectedRole('support')
    }
  }, [isOpen])

  async function handleSearch() {
    if (!emailSearch.trim()) return
    setSearching(true)
    setFoundProfile(null)
    setNotFound(false)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, photo_url')
      .ilike('email', emailSearch.trim())
      .maybeSingle()

    setSearching(false)

    if (error || !data) {
      setNotFound(true)
      return
    }

    setFoundProfile(data)
  }

  async function handleInvite() {
    if (!foundProfile) return
    setInviting(true)

    try {
      // Set is_platform_admin on profile
      await supabase
        .from('profiles')
        .update({ is_platform_admin: true })
        .eq('id', foundProfile.id)

      // Insert into platform_team_members
      const { error } = await supabase
        .from('platform_team_members')
        .upsert({
          profile_id: foundProfile.id,
          role: selectedRole,
          permissions: ROLE_TEMPLATES[selectedRole].permissions,
          is_active: true,
          invited_by: userId,
        }, { onConflict: 'profile_id' })

      if (error) throw error

      // Log action
      await logAction(userId, 'team_member_invite', foundProfile.id, {
        invited_email: foundProfile.email,
        invited_name: foundProfile.full_name,
        assigned_role: selectedRole
      })

      showToast?.(`${foundProfile.full_name || foundProfile.email} invited as ${ROLE_TEMPLATES[selectedRole].label}`, 'success')
      onInvited?.()
      onClose()
    } catch (err) {
      console.error('Invite error:', err)
      showToast?.('Failed to invite team member', 'error')
    } finally {
      setInviting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className={`pt-as w-full max-w-lg rounded-xl p-6 shadow-2xl ${
        isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4BB9EC]/15 text-[#4BB9EC] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className={`text-lg font-bold ${tc.text}`}>Invite Team Member</h3>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${tc.hoverBg} ${tc.textSecondary}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email search */}
        <label className={`text-sm font-medium ${tc.textSecondary} block mb-2`}>Search by email</label>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
            <input
              type="email"
              value={emailSearch}
              onChange={e => setEmailSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="user@example.com"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition ${tc.input}`}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !emailSearch.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#4BB9EC] text-white text-sm font-medium hover:bg-[#2A9BD4] transition disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Not found message */}
        {notFound && (
          <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${
            isDark ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              This user must create a Lynx account first.
            </p>
          </div>
        )}

        {/* Found profile */}
        {foundProfile && (
          <div className={`p-4 rounded-xl border mb-4 ${tc.card}`}>
            <div className="flex items-center gap-3 mb-4">
              {foundProfile.photo_url ? (
                <img src={foundProfile.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#4BB9EC]/15 text-[#4BB9EC] flex items-center justify-center text-sm font-bold">
                  {(foundProfile.full_name || foundProfile.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className={`text-sm font-semibold ${tc.text}`}>{foundProfile.full_name || 'No Name'}</p>
                <p className={`text-xs ${tc.textSecondary}`}>{foundProfile.email}</p>
              </div>
              <Check className="w-5 h-5 text-emerald-500 ml-auto" />
            </div>

            {/* Role select */}
            <label className={`text-sm font-medium ${tc.textSecondary} block mb-2`}>Assign Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition ${tc.input}`}
            >
              {Object.entries(ROLE_TEMPLATES).map(([key, tpl]) => (
                <option key={key} value={key}>{tpl.label} — {tpl.description}</option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={!foundProfile || inviting}
            className="flex-1 py-2.5 rounded-xl bg-[#4BB9EC] text-white text-sm font-medium hover:bg-[#2A9BD4] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? 'Inviting...' : 'Invite Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// EDIT ROLE MODAL
// ================================================================
function EditRoleModal({ isOpen, onClose, member, onUpdated, userId, isDark, tc, showToast }) {
  const [selectedRole, setSelectedRole] = useState(member?.role || 'support')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (member) setSelectedRole(member.role)
  }, [member])

  async function handleSave() {
    if (!member || selectedRole === member.role) {
      onClose()
      return
    }
    setSaving(true)

    try {
      const { error } = await supabase
        .from('platform_team_members')
        .update({
          role: selectedRole,
          permissions: ROLE_TEMPLATES[selectedRole].permissions
        })
        .eq('id', member.id)

      if (error) throw error

      // Log action
      await logAction(userId, 'team_member_update', member.profile_id, {
        action: 'role_change',
        previous_role: member.role,
        new_role: selectedRole,
        member_name: member.profiles?.full_name || member.profiles?.email
      })

      showToast?.(`Role updated to ${ROLE_TEMPLATES[selectedRole].label}`, 'success')
      onUpdated?.()
      onClose()
    } catch (err) {
      console.error('Role update error:', err)
      showToast?.('Failed to update role', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
      <div className={`pt-as w-full max-w-md rounded-xl p-6 shadow-2xl ${
        isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${tc.text}`}>Edit Role</h3>
            <p className={`text-sm ${tc.textSecondary}`}>{member.profiles?.full_name || member.profiles?.email}</p>
          </div>
        </div>

        <label className={`text-sm font-medium ${tc.textSecondary} block mb-2`}>Role</label>
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm transition mb-2 ${tc.input}`}
        >
          {Object.entries(ROLE_TEMPLATES).map(([key, tpl]) => (
            <option key={key} value={key}>{tpl.label}</option>
          ))}
        </select>
        <p className={`text-xs mb-6 ${tc.textMuted}`}>
          {ROLE_TEMPLATES[selectedRole].description}
        </p>

        {/* Preview permissions */}
        <div className={`p-3 rounded-xl border mb-6 ${tc.card}`}>
          <p className={`text-xs font-semibold mb-2 ${tc.textSecondary}`}>Permission preview</p>
          <div className="flex flex-wrap gap-1.5">
            {PERMISSION_SECTIONS.map(sec => {
              const level = ROLE_TEMPLATES[selectedRole].permissions[sec]
              if (level === 'none') return null
              return (
                <span key={sec} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  level === 'full'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-sky-500/15 text-sky-500'
                }`}>
                  {SECTION_LABELS[sec]} ({level})
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
              isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#4BB9EC] text-white text-sm font-medium hover:bg-[#2A9BD4] transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================================================
// PERMISSION MATRIX
// ================================================================
function PermissionMatrix({ isDark, tc }) {
  const roles = Object.keys(ROLE_TEMPLATES)

  return (
    <div className={`rounded-xl border overflow-hidden ${tc.card}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={isDark ? 'bg-lynx-graphite' : 'bg-slate-50'}>
              <th className={`text-left px-4 py-3 font-semibold ${tc.text} sticky left-0 z-10 ${
                isDark ? 'bg-lynx-graphite' : 'bg-slate-50'
              }`}>
                Section
              </th>
              {roles.map(role => (
                <th key={role} className="px-3 py-3 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: ROLE_TEMPLATES[role].color }}
                  >
                    {ROLE_TEMPLATES[role].label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_SECTIONS.map((sec, idx) => (
              <tr
                key={sec}
                className={idx % 2 === 0
                  ? ''
                  : (isDark ? 'bg-lynx-graphite/50' : 'bg-slate-50/50')
                }
              >
                <td className={`px-4 py-2.5 font-medium ${tc.text} sticky left-0 z-10 ${
                  idx % 2 === 0
                    ? (isDark ? 'bg-lynx-charcoal' : 'bg-white')
                    : (isDark ? 'bg-lynx-graphite/50' : 'bg-slate-50/50')
                }`}>
                  {SECTION_LABELS[sec]}
                </td>
                {roles.map(role => {
                  const level = ROLE_TEMPLATES[role].permissions[sec]
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
                      {level === 'full' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-medium">
                          <Check className="w-3 h-3" /> Full
                        </span>
                      )}
                      {level === 'read' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-500 text-xs font-medium">
                          <Eye className="w-3 h-3" /> Read
                        </span>
                      )}
                      {level === 'none' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 text-xs font-medium">
                          <X className="w-3 h-3" /> None
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function PlatformTeam({ showToast }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const [members, setMembers] = useState([])
  const [memberActivity, setMemberActivity] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('members') // 'members' | 'permissions'
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Fetch team members ──
  const fetchMembers = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('platform_team_members')
      .select('*, profiles(id, full_name, email, photo_url)')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching team members:', error)
      return
    }

    // Auto-seed: if no members exist, insert the current user as super_admin
    if ((!data || data.length === 0) && user) {
      await supabase.from('platform_team_members').upsert({
        profile_id: user.id,
        role: 'super_admin',
        permissions: ROLE_TEMPLATES.super_admin.permissions,
        is_active: true,
        invited_by: user.id,
      }, { onConflict: 'profile_id' })

      // Re-fetch after seed
      const { data: seeded } = await supabase
        .from('platform_team_members')
        .select('*, profiles(id, full_name, email, photo_url)')
        .order('created_at', { ascending: true })

      setMembers(seeded || [])
    } else {
      setMembers(data || [])
    }
  }, [user])

  // ── Fetch activity counts per member ──
  const fetchActivity = useCallback(async () => {
    if (!members.length) return

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const activityMap = {}

    for (const member of members) {
      const { data, error } = await supabase
        .from('platform_admin_actions')
        .select('id, created_at')
        .eq('admin_id', member.profile_id)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })

      if (!error && data) {
        activityMap[member.profile_id] = {
          weekCount: data.length,
          lastAction: data.length > 0 ? data[0].created_at : null
        }
      }
    }

    setMemberActivity(activityMap)
  }, [members])

  useEffect(() => {
    setLoading(true)
    fetchMembers().finally(() => setLoading(false))
  }, [fetchMembers])

  useEffect(() => {
    if (members.length > 0) {
      fetchActivity()
    }
  }, [members, fetchActivity])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchMembers()
    setRefreshing(false)
  }

  // ── Toggle active status ──
  async function handleToggleActive(member) {
    const newStatus = !member.is_active

    try {
      const { error } = await supabase
        .from('platform_team_members')
        .update({ is_active: newStatus })
        .eq('id', member.id)

      if (error) throw error

      // If deactivating, also clear is_platform_admin
      if (!newStatus) {
        await supabase
          .from('profiles')
          .update({ is_platform_admin: false })
          .eq('id', member.profile_id)
      } else {
        await supabase
          .from('profiles')
          .update({ is_platform_admin: true })
          .eq('id', member.profile_id)
      }

      // Log action
      await logAction(user.id, 'team_member_update', member.profile_id, {
        action: newStatus ? 'reactivate' : 'deactivate',
        member_name: member.profiles?.full_name || member.profiles?.email
      })

      showToast?.(
        `${member.profiles?.full_name || 'Member'} ${newStatus ? 'reactivated' : 'deactivated'}`,
        newStatus ? 'success' : 'info'
      )
      fetchMembers()
    } catch (err) {
      console.error('Toggle active error:', err)
      showToast?.('Failed to update member status', 'error')
    }
  }

  // ── Filter members ──
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const q = searchQuery.toLowerCase()
    return members.filter(m =>
      (m.profiles?.full_name || '').toLowerCase().includes(q) ||
      (m.profiles?.email || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q)
    )
  }, [members, searchQuery])

  // ── Stats ──
  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.is_active).length,
    inactive: members.filter(m => !m.is_active).length,
    roles: Object.keys(ROLE_TEMPLATES).reduce((acc, role) => {
      acc[role] = members.filter(m => m.role === role).length
      return acc
    }, {})
  }), [members])

  const TABS = [
    { id: 'members', label: 'Team Members', icon: Users },
    { id: 'permissions', label: 'Permission Matrix', icon: Key },
  ]

  return (
    <div className={`min-h-screen ${tc.pageBg}`}>
      <style>{PT_STYLES}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="pt-au flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${tc.text}`}>Platform Team</h1>
            <p className={`text-sm mt-1 ${tc.textSecondary}`}>
              Manage internal team members, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border transition ${tc.card} ${tc.hoverBg} ${tc.textSecondary}`}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4BB9EC] text-white text-sm font-medium hover:bg-[#2A9BD4] transition"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="pt-au grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" style={{ animationDelay: '0.05s' }}>
          {[
            { label: 'Total Members', value: stats.total, color: '#4BB9EC' },
            { label: 'Active', value: stats.active, color: '#10B981' },
            { label: 'Inactive', value: stats.inactive, color: '#EF4444' },
            { label: 'Roles Used', value: Object.values(stats.roles).filter(c => c > 0).length, color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-xl border ${tc.card}`}>
              <p className={`text-xs ${tc.textMuted} mb-1`}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="pt-au flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{
          animationDelay: '0.1s',
          backgroundColor: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,1)'
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? (isDark ? 'bg-lynx-charcoal text-white shadow-sm' : 'bg-white text-lynx-navy shadow-sm')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Members Tab ── */}
        {activeTab === 'members' && (
          <div className="pt-ai">
            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tc.textMuted}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition ${tc.input}`}
                />
              </div>
            </div>

            {loading ? (
              <div className={`p-12 rounded-xl border text-center ${tc.card}`}>
                <RefreshCw className={`w-6 h-6 mx-auto mb-3 animate-spin ${tc.textMuted}`} />
                <p className={`text-sm ${tc.textMuted}`}>Loading team members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className={`p-12 rounded-xl border text-center ${tc.card}`}>
                <Users className={`w-10 h-10 mx-auto mb-3 ${tc.textMuted}`} />
                <p className={`text-sm font-medium ${tc.text}`}>No team members found</p>
                <p className={`text-xs mt-1 ${tc.textMuted}`}>
                  {searchQuery ? 'Try a different search query' : 'Invite your first team member'}
                </p>
              </div>
            ) : (
              <div className={`rounded-xl border overflow-hidden ${tc.card}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={isDark ? 'bg-lynx-graphite' : 'bg-slate-50'}>
                        <th className={`text-left px-4 py-3 font-semibold ${tc.text}`}>Member</th>
                        <th className={`text-left px-4 py-3 font-semibold ${tc.text}`}>Role</th>
                        <th className={`text-left px-4 py-3 font-semibold ${tc.text} hidden sm:table-cell`}>Status</th>
                        <th className={`text-left px-4 py-3 font-semibold ${tc.text} hidden md:table-cell`}>Activity</th>
                        <th className={`text-left px-4 py-3 font-semibold ${tc.text} hidden lg:table-cell`}>Joined</th>
                        <th className={`text-right px-4 py-3 font-semibold ${tc.text}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member, idx) => {
                        const profile = member.profiles || {}
                        const roleTemplate = ROLE_TEMPLATES[member.role] || ROLE_TEMPLATES.support
                        const activity = memberActivity[member.profile_id] || {}
                        const initials = (profile.full_name || profile.email || '?')
                          .split(' ')
                          .map(w => w[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)

                        return (
                          <tr
                            key={member.id}
                            className={`transition ${tc.hoverBg} ${
                              idx % 2 === 0 ? '' : tc.zebraRow
                            } ${!member.is_active ? 'opacity-50' : ''}`}
                          >
                            {/* Member info */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {profile.photo_url ? (
                                  <img
                                    src={profile.photo_url}
                                    alt=""
                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: roleTemplate.color }}
                                  >
                                    {initials}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className={`text-sm font-semibold truncate ${tc.text}`}>
                                    {profile.full_name || 'No Name'}
                                  </p>
                                  <p className={`text-xs truncate ${tc.textMuted}`}>
                                    {profile.email || 'No email'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role badge */}
                            <td className="px-4 py-3">
                              <span
                                className="inline-block px-2.5 py-1 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: roleTemplate.color }}
                              >
                                {roleTemplate.label}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 hidden sm:table-cell">
                              {member.is_active ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                                  <X className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </td>

                            {/* Activity */}
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div>
                                <p className={`text-xs font-medium ${tc.text}`}>
                                  {activity.weekCount != null ? `${activity.weekCount} actions this week` : '--'}
                                </p>
                                <p className={`text-[11px] ${tc.textMuted}`}>
                                  Last: {activity.lastAction ? timeAgo(activity.lastAction) : 'No activity'}
                                </p>
                              </div>
                            </td>

                            {/* Joined */}
                            <td className={`px-4 py-3 hidden lg:table-cell text-xs ${tc.textSecondary}`}>
                              {member.created_at
                                ? new Date(member.created_at).toLocaleDateString()
                                : '--'}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingMember(member)}
                                  className={`p-1.5 rounded-lg transition ${tc.hoverBg}`}
                                  title="Edit Role"
                                >
                                  <Edit className={`w-4 h-4 ${tc.textSecondary}`} />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(member)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                    member.is_active
                                      ? (isDark
                                          ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                          : 'bg-red-50 text-red-600 hover:bg-red-100')
                                      : (isDark
                                          ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'
                                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')
                                  }`}
                                >
                                  {member.is_active ? 'Deactivate' : 'Reactivate'}
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

            {/* Role legend */}
            <div className={`mt-6 p-4 rounded-xl border ${tc.card}`}>
              <h3 className={`text-sm font-semibold mb-3 ${tc.text}`}>Role Reference</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(ROLE_TEMPLATES).map(([key, tpl]) => (
                  <div key={key} className={`flex items-start gap-3 p-3 rounded-xl ${
                    isDark ? 'bg-lynx-graphite/50' : 'bg-slate-50'
                  }`}>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: tpl.color + '20', color: tpl.color }}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${tc.text}`}>{tpl.label}</p>
                      <p className={`text-xs ${tc.textMuted}`}>{tpl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Permissions Tab ── */}
        {activeTab === 'permissions' && (
          <div className="pt-ai">
            <div className="mb-4">
              <p className={`text-sm ${tc.textSecondary}`}>
                Read-only view of permissions assigned to each role. To change a member's access, edit their role.
              </p>
            </div>
            <PermissionMatrix isDark={isDark} tc={tc} />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvited={fetchMembers}
        userId={user?.id}
        isDark={isDark}
        tc={tc}
        showToast={showToast}
      />

      <EditRoleModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onUpdated={fetchMembers}
        userId={user?.id}
        isDark={isDark}
        tc={tc}
        showToast={showToast}
      />
    </div>
  )
}
