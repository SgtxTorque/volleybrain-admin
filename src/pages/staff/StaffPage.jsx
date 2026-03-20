// =============================================================================
// StaffPage — Staff & Volunteers management
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Search, Plus, MoreVertical, Edit, Trash2, X, Check, Mail, Phone, Shield
} from 'lucide-react'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

const STAFF_ROLES = [
  'Board Member', 'Team Parent', 'Scorekeeper', 'Line Judge',
  'Athletic Trainer', 'Photographer/Videographer', 'Event Coordinator', 'Other'
]

const bgCheckLabels = {
  not_started: { label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '⏳' },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '🔄' },
  cleared: { label: 'Cleared', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '✅' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20', icon: '❌' },
  expired: { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '⚠️' }
}

export function StaffPage({ showToast }) {
  const { organization } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const [staff, setStaff] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)

  useEffect(() => {
    if (selectedSeason?.id && organization?.id) {
      loadStaff()
      loadTeams()
    }
  }, [selectedSeason?.id, organization?.id])

  async function loadStaff() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*, teams(id, name, color)')
        .eq('organization_id', organization.id)
        .eq('season_id', selectedSeason.id)
        .order('last_name')
      if (error) throw error
      setStaff(data || [])
    } catch (err) {
      console.error('Error loading staff:', err)
      // Table may not exist yet — show empty state gracefully
      setStaff([])
    }
    setLoading(false)
  }

  async function loadTeams() {
    const { data } = await supabase.from('teams').select('id, name, color').eq('season_id', selectedSeason.id)
    setTeams(data || [])
  }

  async function saveStaff(formData) {
    try {
      if (editingStaff) {
        const { error } = await supabase.from('staff_members').update(formData).eq('id', editingStaff.id)
        if (error) throw error
        showToast('Staff member updated', 'success')
      } else {
        const { error } = await supabase.from('staff_members').insert({
          ...formData,
          organization_id: organization.id,
          season_id: selectedSeason.id,
        })
        if (error) throw error
        showToast('Staff member added', 'success')
      }
      setShowAddModal(false)
      setEditingStaff(null)
      loadStaff()
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  async function deleteStaffMember(member) {
    if (!confirm(`Remove ${member.first_name} ${member.last_name}?`)) return
    try {
      await supabase.from('staff_members').delete().eq('id', member.id)
      showToast('Staff member removed', 'success')
      loadStaff()
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error')
    }
  }

  async function toggleStatus(member) {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    await supabase.from('staff_members').update({ status: newStatus }).eq('id', member.id)
    showToast(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success')
    loadStaff()
  }

  const filteredStaff = staff.filter(s => {
    if (filterRole && s.role !== filterRole) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    }
    return true
  })

  const activeCount = staff.filter(s => s.status === 'active').length
  const bgCleared = staff.filter(s => s.background_check_status === 'cleared').length

  if (!selectedSeason) {
    return (
      <PageShell title="Staff & Volunteers" subtitle="Select a season" breadcrumb="Club Management">
        <div className={`${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-lynx-silver'} border rounded-[14px] p-12 text-center`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Please select a season to manage staff</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Staff & Volunteers"
      subtitle={`Manage staff, volunteers, and support roles · ${selectedSeason.name}`}
      breadcrumb="Club Management"
      actions={
        <button onClick={() => { setEditingStaff(null); setShowAddModal(true) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110 transition text-r-sm">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      }
    >
      <SeasonFilterBar />
      <InnerStatRow stats={[
        { value: staff.length, label: 'TOTAL STAFF', icon: '👥' },
        { value: activeCount, label: 'ACTIVE', icon: '✅' },
        { value: `${bgCleared}/${staff.length}`, label: 'BG CHECKS', icon: '🛡️', color: bgCleared === staff.length && staff.length > 0 ? 'text-emerald-500' : 'text-amber-500' },
      ]} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search staff..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${
              isDark ? 'border-white/[0.06] bg-lynx-charcoal text-white' : 'border-lynx-silver bg-white text-slate-700'
            }`} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${
            isDark ? 'border-white/[0.06] bg-lynx-charcoal text-white' : 'border-lynx-silver bg-white text-slate-700'
          }`}>
          <option value="">All Roles</option>
          {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className={`text-r-xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
            {searchTerm ? 'No staff match your search' : 'No staff members yet'}
          </h3>
          <p className={`text-r-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {searchTerm ? 'Try a different search term' : 'Add board members, team parents, scorekeepers, and more'}
          </p>
          {!searchTerm && (
            <button onClick={() => setShowAddModal(true)} className="mt-4 px-6 py-2.5 bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110 transition text-r-sm">
              Add First Staff Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map(member => (
            <StaffCard key={member.id} member={member} isDark={isDark}
              onEdit={() => { setEditingStaff(member); setShowAddModal(true) }}
              onToggleStatus={() => toggleStatus(member)}
              onDelete={() => deleteStaffMember(member)} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <StaffFormModal
          staff={editingStaff}
          teams={teams}
          isDark={isDark}
          onSave={saveStaff}
          onClose={() => { setShowAddModal(false); setEditingStaff(null) }}
        />
      )}
    </PageShell>
  )
}

// ============================================
// STAFF CARD
// ============================================
function StaffCard({ member, isDark, onEdit, onToggleStatus, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const bgCheck = bgCheckLabels[member.background_check_status] || bgCheckLabels.not_started

  return (
    <div className={`${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-lynx-silver'} border rounded-[14px] overflow-hidden transition hover:shadow-lg ${
      member.status !== 'active' ? 'opacity-60' : ''
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          {member.photo_url ? (
            <img src={member.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-r-sm font-bold text-white shrink-0 bg-lynx-navy">
              {member.first_name?.[0]}{member.last_name?.[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className={`text-r-base font-bold truncate ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
              {member.first_name} {member.last_name}
            </p>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-r-xs font-semibold ${
              isDark ? 'bg-lynx-sky/15 text-lynx-sky' : 'bg-sky-50 text-sky-600'
            }`}>
              {member.role === 'Other' && member.custom_role ? member.custom_role : member.role}
            </span>
          </div>

          {/* Kebab menu */}
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-lynx-frost text-slate-400'
              }`}>
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className={`absolute right-0 top-9 z-20 rounded-xl shadow-lg border py-1.5 min-w-[160px] ${
                  isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-lynx-silver'
                }`}>
                  <button onClick={() => { onEdit?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}>
                    <Edit className="w-4 h-4 opacity-60" /> Edit
                  </button>
                  <button onClick={() => { onToggleStatus?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-amber-400 hover:bg-white/[0.04]' : 'text-amber-600 hover:bg-amber-50'}`}>
                    {member.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {member.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`} />
                  <button onClick={() => { onDelete?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className={`flex flex-col gap-1 mt-3 text-r-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {member.email && (
            <a href={`mailto:${member.email}`} className="hover:text-lynx-sky flex items-center gap-1.5 truncate transition">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {member.email}
            </a>
          )}
          {member.phone && (
            <a href={`tel:${member.phone}`} className="hover:text-lynx-sky flex items-center gap-1.5 transition">
              <Phone className="w-3.5 h-3.5 shrink-0" /> {member.phone}
            </a>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className={`px-2 py-0.5 rounded-full text-r-xs font-semibold ${bgCheck.bg} ${bgCheck.color}`}>
            {bgCheck.icon} BG: {bgCheck.label}
          </span>
          {member.teams && (
            <span className="px-2 py-0.5 rounded-full text-r-xs font-semibold"
              style={{
                backgroundColor: isDark ? `${member.teams.color || '#888'}20` : `${member.teams.color || '#888'}15`,
                color: member.teams.color || '#888'
              }}>
              {member.teams.name}
            </span>
          )}
        </div>

        {member.notes && (
          <p className={`text-r-xs mt-2 line-clamp-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{member.notes}</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// STAFF FORM MODAL
// ============================================
function StaffFormModal({ staff, teams, isDark, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: staff?.first_name || '',
    last_name: staff?.last_name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'Volunteer',
    custom_role: staff?.custom_role || '',
    team_id: staff?.team_id || '',
    background_check_status: staff?.background_check_status || 'not_started',
    notes: staff?.notes || '',
    status: staff?.status || 'active',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const ic = `w-full rounded-lg px-4 py-3 text-r-sm ${isDark ? 'bg-white/[0.06] border border-white/[0.06] text-white' : 'bg-white border border-lynx-silver text-lynx-navy'}`
  const lc = `block text-r-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-1.5 uppercase tracking-wider`

  function handleSubmit() {
    if (!form.first_name || !form.last_name) return
    onSave({
      ...form,
      team_id: form.team_id || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-lynx-silver'} rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex items-center justify-between`}>
          <h2 className={`text-r-xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
            {staff ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/[0.04] text-slate-400' : 'hover:bg-lynx-frost text-slate-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>First Name *</label><input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} className={ic} placeholder="Jane" /></div>
            <div><label className={lc}>Last Name *</label><input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} className={ic} placeholder="Doe" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={ic} placeholder="jane@email.com" /></div>
            <div><label className={lc}>Phone</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={ic} placeholder="(555) 555-5555" /></div>
          </div>
          <div>
            <label className={lc}>Role *</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className={ic}>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {form.role === 'Other' && (
            <div><label className={lc}>Custom Role</label><input type="text" value={form.custom_role} onChange={e => set('custom_role', e.target.value)} className={ic} placeholder="e.g., Social Media Manager" /></div>
          )}
          <div>
            <label className={lc}>Assigned Team (optional)</label>
            <select value={form.team_id} onChange={e => set('team_id', e.target.value)} className={ic}>
              <option value="">Org-level (no team)</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lc}>Background Check Status</label>
            <select value={form.background_check_status} onChange={e => set('background_check_status', e.target.value)} className={ic}>
              <option value="not_started">Not Started</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className={lc}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              className={`${ic} h-20 resize-none`} placeholder="Internal notes..." />
          </div>
        </div>

        <div className={`px-5 py-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'} flex justify-end gap-3`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-lg font-medium ${isDark ? 'bg-white/[0.06] text-white' : 'bg-lynx-frost text-lynx-navy'}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!form.first_name || !form.last_name}
            className="px-6 py-2 rounded-lg bg-lynx-navy text-white font-bold disabled:opacity-50 hover:brightness-110 transition">
            {staff ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  )
}
