import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useThemeClasses, useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/csv-export'
import {
  Users, User, Mail, Phone, Edit, Trash2, X, Check, Star, UserCog,
  Camera, Shield, FileText, Calendar, ChevronDown, ChevronRight,
  Award, AlertTriangle, Search, Filter, Upload, Eye, Plus,
  MoreVertical, Download, UserPlus
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import EmailCoachesModal from './EmailCoachesModal'
import InviteCoachModal from './InviteCoachModal'

const roleLabels = { head: 'Head Coach', assistant: 'Assistant', manager: 'Manager', volunteer: 'Volunteer' }
const bgCheckLabels = {
  not_started: { label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/20', icon: '⏳' },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '🔄' },
  cleared: { label: 'Cleared', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '✅' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20', icon: '❌' },
  expired: { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '⚠️' }
}

// ============================================
// COACHES PAGE - Main Component
// ============================================
export function CoachesPage({ showToast }) {
  const journey = useJourney()
  const { organization, profile } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [coaches, setCoaches] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCoach, setEditingCoach] = useState(null)
  const [assigningCoach, setAssigningCoach] = useState(null)
  const [selectedCoachForDetail, setSelectedCoachForDetail] = useState(null)
  const [showEmailBlast, setShowEmailBlast] = useState(false)
  const [showInviteCoach, setShowInviteCoach] = useState(false)

  useEffect(() => {
    if (selectedSeason?.id) { loadCoaches(); loadTeams() }
  }, [selectedSeason?.id, selectedSport?.id])

  async function loadCoaches() {
    setLoading(true)
    try {
      let coachQuery = supabase.from('coaches').select('*')
      if (!isAllSeasons(selectedSeason)) {
        coachQuery = coachQuery.eq('season_id', selectedSeason.id)
      } else if (selectedSport?.id) {
        const sportSeasonIds = (allSeasons || [])
          .filter(s => s.sport_id === selectedSport.id)
          .map(s => s.id)
        if (sportSeasonIds.length > 0) {
          coachQuery = coachQuery.in('season_id', sportSeasonIds)
        }
      }
      const { data: coachesData, error } = await coachQuery
        .order('last_name', { ascending: true })
      if (error) throw error

      const { data: assignmentsData } = await supabase
        .from('team_coaches').select('*, teams(id, name, color)')
        .in('coach_id', (coachesData || []).map(c => c.id))

      setCoaches((coachesData || []).map(coach => ({
        ...coach,
        assignments: (assignmentsData || []).filter(a => a.coach_id === coach.id)
      })))
    } catch (err) {
      console.error('Error loading coaches:', err)
      showToast('Error loading coaches', 'error')
    }
    setLoading(false)
  }

  async function loadTeams() {
    let query = supabase.from('teams').select('id, name, color')
    if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
      query = query.eq('season_id', selectedSeason.id)
    }
    const { data } = await query
    setTeams(data || [])
  }

  async function saveCoach(formData) {
    try {
      if (editingCoach) {
        const { error } = await supabase.from('coaches').update(formData).eq('id', editingCoach.id)
        if (error) throw error
        showToast('Coach updated', 'success')
      } else {
        const { error } = await supabase.from('coaches').insert({ ...formData, season_id: selectedSeason.id })
        if (error) throw error
        showToast('Coach added', 'success')
        journey?.completeStep('add_coaches')
      }
      setShowAddModal(false); setEditingCoach(null); loadCoaches()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  async function deleteCoach(coach) {
    if (!confirm(`Remove ${coach.first_name} ${coach.last_name}?`)) return
    try {
      const { error } = await supabase.from('coaches').delete().eq('id', coach.id)
      if (error) throw error
      showToast('Coach removed', 'success'); loadCoaches()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  async function toggleCoachStatus(coach) {
    const newStatus = coach.status === 'active' ? 'inactive' : 'active'
    await supabase.from('coaches').update({ status: newStatus }).eq('id', coach.id)
    showToast(`Coach ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success')
    loadCoaches()
  }

  async function saveAssignments(coachId, assignments) {
    try {
      const { data: existing } = await supabase.from('team_coaches').select('id, team_id').eq('coach_id', coachId)
      for (const ex of (existing || [])) {
        if (!assignments.find(a => a.team_id === ex.team_id)) {
          await supabase.from('team_coaches').delete().eq('id', ex.id)
        }
      }
      for (const a of assignments) {
        const ex = (existing || []).find(e => e.team_id === a.team_id)
        if (ex) await supabase.from('team_coaches').update({ role: a.role }).eq('id', ex.id)
        else await supabase.from('team_coaches').insert({ coach_id: coachId, team_id: a.team_id, role: a.role })
      }
      showToast('Team assignments saved', 'success')
      setAssigningCoach(null); loadCoaches()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  function exportCoachesCSV() {
    const csvColumns = [
      { label: 'First Name', accessor: c => c.first_name },
      { label: 'Last Name', accessor: c => c.last_name },
      { label: 'Email', accessor: c => c.email },
      { label: 'Phone', accessor: c => c.phone },
      { label: 'Status', accessor: c => c.status },
      { label: 'Role', accessor: c => c.assignments?.map(a => `${a.teams?.name} (${a.role})`).join(', ') || 'Unassigned' },
      { label: 'BG Check', accessor: c => c.background_check_status },
      { label: 'Waiver', accessor: c => c.waiver_signed ? 'Yes' : 'No' },
    ]
    exportToCSV(filteredCoaches, 'coaches', csvColumns)
  }

  const filteredCoaches = coaches.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.specialties?.toLowerCase().includes(q)
    }
    return true
  })

  const bgCheckCleared = coaches.filter(c => c.background_check_status === 'cleared').length
  const waiversSigned = coaches.filter(c => c.waiver_signed).length
  const conductSigned = coaches.filter(c => c.code_of_conduct_signed).length

  if (!selectedSeason) {
    return (
      <PageShell title="Coach Directory" subtitle="Select a season to manage coaches" breadcrumb="Club Management">
        <div className="bg-white rounded-[14px] border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Please select a season to manage coaches</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Coach Directory"
      subtitle={`Manage coaches, credentials, and team assignments -- ${selectedSeason.name}`}
      breadcrumb="Club Management"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCoachesCSV()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-medium border transition ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
                : 'bg-white border-lynx-silver text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
            }`}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowEmailBlast(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-medium border transition ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
                : 'bg-white border-lynx-silver text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
            }`}
          >
            <Mail className="w-4 h-4" /> Email All
          </button>
          <button
            onClick={() => setShowInviteCoach(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-r-sm font-medium border transition ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
                : 'bg-white border-lynx-silver text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Invite
          </button>
          <button onClick={() => { setEditingCoach(null); setShowAddModal(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110 transition text-r-sm">
            <Plus className="w-4 h-4" /> Add Coach
          </button>
        </div>
      }
    >
      <SeasonFilterBar />
      <InnerStatRow stats={[
        { value: coaches.filter(c => c.status === 'active').length, label: 'ACTIVE', icon: '👨‍🏫' },
        { value: coaches.filter(c => c.assignments?.some(a => a.role === 'head')).length, label: 'HEAD COACHES', icon: '⭐' },
        { value: `${bgCheckCleared}/${coaches.length}`, label: 'BG CHECKS', icon: '🛡️', color: bgCheckCleared === coaches.length && coaches.length > 0 ? 'text-emerald-500' : 'text-amber-500' },
        { value: `${waiversSigned}/${coaches.length}`, label: 'WAIVERS', icon: '📋', color: waiversSigned === coaches.length && coaches.length > 0 ? 'text-emerald-500' : 'text-amber-500' },
        { value: `${conductSigned}/${coaches.length}`, label: 'CONDUCT', icon: '✅', color: conductSigned === coaches.length && coaches.length > 0 ? 'text-emerald-500' : 'text-amber-500' },
      ]} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search coaches..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Coach Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className="bg-white rounded-[14px] border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No coaches found</h3>
          <p className="text-slate-500 mb-6">{searchTerm ? 'Try a different search term' : 'Add your first coach to get started'}</p>
          {!searchTerm && (
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-lynx-navy text-white font-bold rounded-lg hover:brightness-110 transition">Add First Coach</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoaches.map(coach => (
            <CoachCard key={coach.id} coach={coach} tc={tc} isDark={isDark}
              onDetail={() => setSelectedCoachForDetail(coach)}
              onEdit={() => { setEditingCoach(coach); setShowAddModal(true) }}
              onAssign={() => setAssigningCoach(coach)}
              onToggleStatus={() => toggleCoachStatus(coach)}
              onDelete={() => deleteCoach(coach)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && <CoachFormModal coach={editingCoach} onSave={saveCoach} onClose={() => { setShowAddModal(false); setEditingCoach(null) }} showToast={showToast} tc={tc} />}
      {assigningCoach && <AssignTeamsModal coach={assigningCoach} teams={teams} onSave={(a) => saveAssignments(assigningCoach.id, a)} onClose={() => setAssigningCoach(null)} tc={tc} />}
      {selectedCoachForDetail && <CoachDetailModal coach={selectedCoachForDetail} onClose={() => setSelectedCoachForDetail(null)} onEdit={() => { setSelectedCoachForDetail(null); setEditingCoach(selectedCoachForDetail); setShowAddModal(true) }} tc={tc} />}
      {showEmailBlast && (
        <EmailCoachesModal
          coaches={filteredCoaches.filter(c => c.email)}
          onClose={() => setShowEmailBlast(false)}
          showToast={showToast}
        />
      )}
      {showInviteCoach && (
        <InviteCoachModal
          orgName={organization?.name || 'My Club'}
          orgId={organization?.id}
          onClose={() => setShowInviteCoach(false)}
          showToast={showToast}
        />
      )}
    </PageShell>
  )
}

// ============================================
// COACH CARD — Redesigned (no gradient banner, kebab menu, compact layout)
// ============================================
function CoachCard({ coach, tc, isDark, onDetail, onEdit, onAssign, onToggleStatus, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const bgCheck = bgCheckLabels[coach.background_check_status] || bgCheckLabels.not_started

  return (
    <div
      className={`${tc.cardBg} border ${tc.border} rounded-[14px] overflow-hidden transition hover:shadow-lg ${
        coach.status !== 'active' ? 'opacity-60' : ''
      }`}
    >
      <div className="p-5">
        {/* Top row: avatar + name + kebab */}
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          {coach.photo_url ? (
            <img
              src={coach.photo_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-r-sm font-bold text-white shrink-0 bg-lynx-navy"
            >
              {coach.first_name?.[0]}{coach.last_name?.[0]}
            </div>
          )}

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <button
              onClick={onDetail}
              className={`text-r-base font-bold ${
                isDark ? 'text-white hover:text-lynx-sky' : 'text-lynx-navy hover:text-lynx-sky'
              } transition text-left truncate block w-full`}
            >
              {coach.first_name} {coach.last_name}
            </button>
            {coach.coaching_level && (
              <p className={`text-r-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {coach.coaching_level}
              </p>
            )}
          </div>

          {/* Kebab menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                isDark
                  ? 'hover:bg-white/[0.06] text-slate-400'
                  : 'hover:bg-lynx-frost text-slate-400'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className={`absolute right-0 top-9 z-20 rounded-xl shadow-lg border py-1.5 min-w-[180px] ${
                  isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-lynx-silver'
                }`}>
                  <button onClick={() => { onDetail?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}>
                    <Eye className="w-4 h-4 opacity-60" /> View Profile
                  </button>
                  <button onClick={() => { onEdit?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}>
                    <Edit className="w-4 h-4 opacity-60" /> Edit Coach
                  </button>
                  <button onClick={() => { onAssign?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}>
                    <Shield className="w-4 h-4 opacity-60" /> Assign Teams
                  </button>
                  {coach.email && (
                    <a href={`mailto:${coach.email}`}
                      className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-lynx-frost'}`}>
                      <Mail className="w-4 h-4 opacity-60" /> Send Email
                    </a>
                  )}
                  <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`} />
                  <button onClick={() => { onToggleStatus?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 ${isDark ? 'text-amber-400 hover:bg-white/[0.04]' : 'text-amber-600 hover:bg-amber-50'}`}>
                    {coach.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {coach.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { onDelete?.(); setMenuOpen(false) }}
                    className={`w-full px-4 py-2 text-left text-r-sm flex items-center gap-2.5 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                    <Trash2 className="w-4 h-4" /> Remove Coach
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className={`flex flex-col gap-1 mt-3 text-r-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {coach.email && (
            <a href={`mailto:${coach.email}`} className="hover:text-lynx-sky flex items-center gap-1.5 truncate transition">
              <Mail className="w-3.5 h-3.5 shrink-0" /> {coach.email}
            </a>
          )}
          {coach.phone && (
            <a href={`tel:${coach.phone}`} className="hover:text-lynx-sky flex items-center gap-1.5 transition">
              <Phone className="w-3.5 h-3.5 shrink-0" /> {coach.phone}
            </a>
          )}
        </div>

        {/* Badges row: experience + bg check + waiver */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {coach.experience_years && (
            <span className={`px-2 py-0.5 rounded-full text-r-xs font-semibold ${
              isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {coach.experience_years} yrs
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-r-xs font-semibold ${bgCheck.bg} ${bgCheck.color}`}>
            {bgCheck.icon} BG: {bgCheck.label}
          </span>
          {coach.waiver_signed && (
            <span className={`px-2 py-0.5 rounded-full text-r-xs font-semibold ${
              isDark ? 'bg-lynx-sky/15 text-lynx-sky' : 'bg-sky-50 text-sky-600'
            }`}>
              Waiver ✓
            </span>
          )}
          {coach.code_of_conduct_signed && (
            <span className={`px-2 py-0.5 rounded-full text-r-xs font-semibold ${
              isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              Conduct ✓
            </span>
          )}
        </div>

        {/* Team assignments */}
        {coach.assignments?.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
            {coach.assignments.map(a => (
              <span
                key={a.id}
                className="px-2.5 py-1 rounded-lg text-r-xs font-semibold flex items-center gap-1"
                style={{
                  backgroundColor: isDark ? `${a.teams?.color || '#888'}20` : `${a.teams?.color || '#888'}15`,
                  color: a.teams?.color || '#888'
                }}
              >
                {a.role === 'head' && <Star className="w-3 h-3" />} {a.teams?.name}
              </span>
            ))}
          </div>
        )}
        {(!coach.assignments || coach.assignments.length === 0) && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
            <button
              onClick={onAssign}
              className={`text-r-xs font-medium flex items-center gap-1.5 transition ${
                isDark ? 'text-slate-500 hover:text-lynx-sky' : 'text-slate-400 hover:text-lynx-sky'
              }`}
            >
              <Plus className="w-3 h-3" /> Assign to team
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// COACH DETAIL MODAL
// ============================================
export function CoachDetailModal({ coach, onClose, onEdit, tc }) {
  if (!coach) return null
  const bgCheck = bgCheckLabels[coach.background_check_status] || bgCheckLabels.not_started
  const certs = Array.isArray(coach.certifications) ? coach.certifications : []

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="relative h-32 bg-gradient-to-r from-blue-600/30 to-purple-600/30">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/30 text-white hover:bg-black/50"><X className="w-5 h-5" /></button>
          <div className="absolute -bottom-10 left-6">
            {coach.photo_url ? (
              <img src={coach.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-slate-800 shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white border-4 border-slate-800 shadow-lg">
                {coach.first_name?.[0]}{coach.last_name?.[0]}
              </div>
            )}
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>{coach.first_name} {coach.last_name}</h2>
              {coach.coaching_level && <p className="text-sm text-purple-400">{coach.coaching_level}</p>}
            </div>
            {onEdit && <button onClick={onEdit} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition">Edit</button>}
          </div>

          {coach.bio && <p className={`${tc.textMuted} text-sm mt-3`}>{coach.bio}</p>}

          <div className="mt-4 space-y-2 text-sm">
            {coach.email && <DRow label="Email" value={coach.email} link={`mailto:${coach.email}`} tc={tc} />}
            {coach.phone && <DRow label="Phone" value={coach.phone} link={`tel:${coach.phone}`} tc={tc} />}
            {coach.address && <DRow label="Address" value={coach.address} tc={tc} />}
            {coach.date_of_birth && <DRow label="DOB" value={new Date(coach.date_of_birth).toLocaleDateString()} tc={tc} />}
          </div>

          <SHead label="Experience & Credentials" tc={tc} />
          <div className="space-y-2 text-sm">
            {coach.experience_years && <DRow label="Years" value={`${coach.experience_years} years`} tc={tc} />}
            {coach.specialties && <DRow label="Specialties" value={coach.specialties} tc={tc} />}
            {coach.coaching_license && <DRow label="License" value={coach.coaching_license} tc={tc} />}
            {coach.experience_details && <p className={`${tc.textMuted} text-xs mt-1`}>{coach.experience_details}</p>}
          </div>

          {certs.length > 0 && (
            <>
              <SHead label="Certifications" tc={tc} />
              <div className="space-y-2">
                {certs.map((cert, i) => (
                  <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${tc.border}`}>
                    <div>
                      <p className={`text-sm font-medium ${tc.text}`}>{cert.name}</p>
                      {cert.issuer && <p className={`text-xs ${tc.textMuted}`}>{cert.issuer}</p>}
                    </div>
                    <div className="text-right">
                      {cert.expires && <p className={`text-xs ${tc.textMuted}`}>Exp: {cert.expires}</p>}
                      {cert.verified && <span className="text-xs text-emerald-400">✓ Verified</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <SHead label="Compliance" tc={tc} />
          <div className="grid grid-cols-3 gap-2">
            <CBadge label="Background" status={bgCheck.label} icon={bgCheck.icon} color={bgCheck.color} bg={bgCheck.bg} />
            <CBadge label="Waiver" status={coach.waiver_signed ? 'Signed' : 'Not Signed'} icon={coach.waiver_signed ? '✅' : '⏳'} color={coach.waiver_signed ? 'text-emerald-400' : 'text-amber-400'} bg={coach.waiver_signed ? 'bg-emerald-500/20' : 'bg-amber-500/20'} />
            <CBadge label="Conduct" status={coach.code_of_conduct_signed ? 'Signed' : 'Not Signed'} icon={coach.code_of_conduct_signed ? '✅' : '⏳'} color={coach.code_of_conduct_signed ? 'text-emerald-400' : 'text-amber-400'} bg={coach.code_of_conduct_signed ? 'bg-emerald-500/20' : 'bg-amber-500/20'} />
          </div>

          {coach.emergency_contact_name && (
            <>
              <SHead label="Emergency Contact" tc={tc} />
              <div className="text-sm space-y-1">
                <DRow label="Name" value={coach.emergency_contact_name} tc={tc} />
                {coach.emergency_contact_phone && <DRow label="Phone" value={coach.emergency_contact_phone} link={`tel:${coach.emergency_contact_phone}`} tc={tc} />}
                {coach.emergency_contact_relation && <DRow label="Relation" value={coach.emergency_contact_relation} tc={tc} />}
              </div>
            </>
          )}

          {coach.assignments?.length > 0 && (
            <>
              <SHead label="Team Assignments" tc={tc} />
              <div className="flex flex-wrap gap-2">
                {coach.assignments.map(a => (
                  <span key={a.id} className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1" style={{ backgroundColor: `${a.teams?.color}20`, color: a.teams?.color }}>
                    {a.role === 'head' && <Star className="w-3 h-3" />} {a.teams?.name} <span className="opacity-60">({roleLabels[a.role] || a.role})</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DRow({ label, value, link, tc }) {
  return (
    <div className="flex items-center justify-between">
      <span className={tc.textMuted}>{label}</span>
      {link ? <a href={link} className="text-[var(--accent-primary)] hover:underline">{value}</a> : <span className={tc.text}>{value}</span>}
    </div>
  )
}
function SHead({ label, tc }) {
  return <h4 className={`text-xs font-bold ${tc.textMuted} uppercase tracking-wider mt-5 mb-2 border-t ${tc.border} pt-4`}>{label}</h4>
}
function CBadge({ label, status, icon, color, bg }) {
  return (
    <div className={`${bg} rounded-lg p-2 text-center`}>
      <span className="text-lg">{icon}</span>
      <p className={`text-xs font-bold ${color} mt-1`}>{status}</p>
      <p className="text-xs opacity-60">{label}</p>
    </div>
  )
}

// ============================================
// CLICKABLE EXPORTS (used by other pages)
// ============================================
export function ClickableCoachName({ coach, className = '', children, onCoachSelect }) {
  if (!coach) return <span className={className}>{children || 'Unknown'}</span>
  const displayName = children || `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Unknown'
  return (
    <button onClick={(e) => { e.stopPropagation(); onCoachSelect?.(coach) }}
      className={`${className} hover:text-blue-400 hover:underline cursor-pointer transition-colors text-left`}>
      {displayName}
    </button>
  )
}

export function ClickableTeamName({ team, className = '', children, onTeamSelect, color }) {
  if (!team) return <span className={className}>{children || 'Unknown'}</span>
  const displayName = children || team.name || 'Unknown'
  const teamColor = color || team.color || '#EAB308'
  return (
    <button onClick={(e) => { e.stopPropagation(); onTeamSelect?.(team) }}
      className={`${className} hover:underline cursor-pointer transition-colors text-left`} style={{ color: teamColor }}>
      {displayName}
    </button>
  )
}

// ============================================
// COACH FORM MODAL (Multi-step)
// ============================================
function CoachFormModal({ coach, onSave, onClose, showToast, tc }) {
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [certInput, setCertInput] = useState({ name: '', issuer: '', expires: '', verified: false })

  const [form, setForm] = useState({
    first_name: coach?.first_name || '', last_name: coach?.last_name || '',
    email: coach?.email || '', phone: coach?.phone || '',
    secondary_phone: coach?.secondary_phone || '', preferred_contact: coach?.preferred_contact || 'email',
    address: coach?.address || '', date_of_birth: coach?.date_of_birth || '',
    gender: coach?.gender || '', shirt_size: coach?.shirt_size || '',
    photo_url: coach?.photo_url || '', bio: coach?.bio || '',
    experience_years: coach?.experience_years || '', experience_details: coach?.experience_details || '',
    specialties: coach?.specialties || '', coaching_license: coach?.coaching_license || '',
    coaching_level: coach?.coaching_level || '',
    preferred_sports: coach?.preferred_sports || ['volleyball'],
    preferred_age_groups: coach?.preferred_age_groups || [],
    availability: coach?.availability || '',
    certifications: coach?.certifications || [],
    background_check_status: coach?.background_check_status || 'not_started',
    background_check_date: coach?.background_check_date || '',
    background_check_expiry: coach?.background_check_expiry || '',
    waiver_signed: coach?.waiver_signed || false,
    waiver_signed_at: coach?.waiver_signed_at || null,
    waiver_signer_name: coach?.waiver_signer_name || '',
    code_of_conduct_signed: coach?.code_of_conduct_signed || false,
    code_of_conduct_signed_at: coach?.code_of_conduct_signed_at || null,
    emergency_contact_name: coach?.emergency_contact_name || '',
    emergency_contact_phone: coach?.emergency_contact_phone || '',
    emergency_contact_relation: coach?.emergency_contact_relation || '',
    status: coach?.status || 'active', notes: coach?.notes || ''
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `coach-photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      set('photo_url', publicUrl)
      showToast?.('Photo uploaded', 'success')
    } catch (err) {
      showToast?.(`Upload failed: ${err.message}`, 'error')
    }
    setUploading(false)
  }

  function addCert() {
    if (!certInput.name) return
    set('certifications', [...form.certifications, { ...certInput }])
    setCertInput({ name: '', issuer: '', expires: '', verified: false })
  }
  function removeCert(idx) { set('certifications', form.certifications.filter((_, i) => i !== idx)) }

  function handleSubmit() {
    if (!form.first_name || !form.last_name) { showToast?.('First and last name required', 'error'); return }
    onSave({
      ...form,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null,
      waiver_signed_at: form.waiver_signed && !coach?.waiver_signed ? new Date().toISOString() : form.waiver_signed_at,
      code_of_conduct_signed_at: form.code_of_conduct_signed && !coach?.code_of_conduct_signed ? new Date().toISOString() : form.code_of_conduct_signed_at,
    })
  }

  const steps = [
    { id: 1, label: 'Personal', icon: '👤' },
    { id: 2, label: 'Experience', icon: '🏆' },
    { id: 3, label: 'Compliance', icon: '🛡️' },
    { id: 4, label: 'Emergency', icon: '🚨' },
  ]
  const ic = `w-full rounded-xl px-4 py-3 text-sm ${tc.cardBg} border ${tc.border} ${tc.text}`
  const lc = `block text-xs font-medium ${tc.textMuted} mb-1.5 uppercase tracking-wider`

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-5 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>{coach ? 'Edit Coach' : 'Add Coach'}</h2>
          <button onClick={onClose} className={`${tc.textMuted} text-2xl`}>×</button>
        </div>

        {/* Steps */}
        <div className={`flex border-b ${tc.border}`}>
          {steps.map(s => (
            <button key={s.id} onClick={() => setStep(s.id)}
              className={`flex-1 py-3 text-xs font-medium text-center transition ${step === s.id ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : tc.textMuted}`}>
              <span className="text-base mr-1">{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 1: Personal Info */}
          {step === 1 && (<>
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                    {form.first_name?.[0] || '?'}{form.last_name?.[0] || ''}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-lg hover:brightness-110">
                  {uploading ? <span className="animate-spin text-xs">⏳</span> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div><p className={`text-sm font-medium ${tc.text}`}>Coach Photo</p><p className={`text-xs ${tc.textMuted}`}>Click the camera to upload</p></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>First Name *</label><input type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} className={ic} placeholder="John" /></div>
              <div><label className={lc}>Last Name *</label><input type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} className={ic} placeholder="Smith" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={ic} placeholder="coach@email.com" /></div>
              <div><label className={lc}>Phone</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={ic} placeholder="(555) 555-5555" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={lc}>Secondary Phone</label><input type="tel" value={form.secondary_phone} onChange={e => set('secondary_phone', e.target.value)} className={ic} /></div>
              <div><label className={lc}>Preferred Contact</label>
                <select value={form.preferred_contact} onChange={e => set('preferred_contact', e.target.value)} className={ic}>
                  <option value="email">Email</option><option value="phone">Phone Call</option><option value="text">Text Message</option>
                </select>
              </div>
              <div><label className={lc}>Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)} className={ic}>
                  <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="non-binary">Non-Binary</option><option value="prefer_not_to_say">Prefer Not to Say</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={lc}>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={ic} /></div>
              <div><label className={lc}>Shirt Size</label>
                <select value={form.shirt_size} onChange={e => set('shirt_size', e.target.value)} className={ic}>
                  <option value="">—</option>{['XS','S','M','L','XL','2XL','3XL','4XL'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={lc}>Address</label><input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={ic} placeholder="123 Main St" /></div>
            </div>
            <div><label className={lc}>Bio</label><textarea value={form.bio} onChange={e => set('bio', e.target.value)} className={`${ic} h-24 resize-none`} placeholder="Tell parents and players about yourself..." /></div>
          </>)}

          {/* STEP 2: Experience */}
          {step === 2 && (<>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>Years of Experience</label><input type="number" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} className={ic} min="0" /></div>
              <div><label className={lc}>Coaching Level</label><input type="text" value={form.coaching_level} onChange={e => set('coaching_level', e.target.value)} className={ic} placeholder="e.g., USAV CAP Level 2" /></div>
            </div>
            <div><label className={lc}>Specialties</label><input type="text" value={form.specialties} onChange={e => set('specialties', e.target.value)} className={ic} placeholder="Setting, Defense, Serving" /></div>
            <div><label className={lc}>Coaching License</label><input type="text" value={form.coaching_license} onChange={e => set('coaching_license', e.target.value)} className={ic} placeholder="License # or cert ID" /></div>
            <div><label className={lc}>Experience Details</label><textarea value={form.experience_details} onChange={e => set('experience_details', e.target.value)} className={`${ic} h-24 resize-none`} placeholder="Previous teams, leagues, accomplishments..." /></div>
            <div><label className={lc}>Availability</label>
              <select value={form.availability} onChange={e => set('availability', e.target.value)} className={ic}>
                <option value="">—</option><option value="all">All (Weekdays & Weekends)</option><option value="weekdays">Weekdays Only</option><option value="weekends">Weekends Only</option><option value="evenings">Evenings Only</option>
              </select>
            </div>

            {/* Certifications */}
            <div>
              <label className={lc}>Certifications</label>
              {form.certifications?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {form.certifications.map((cert, i) => (
                    <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${tc.border}`}>
                      <div><p className={`text-sm ${tc.text}`}>{cert.name}{cert.issuer ? ` (${cert.issuer})` : ''}</p>{cert.expires && <p className={`text-xs ${tc.textMuted}`}>Exp: {cert.expires}</p>}</div>
                      <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-300 p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                <input type="text" value={certInput.name} onChange={e => setCertInput(p => ({...p, name: e.target.value}))} className={ic} placeholder="Cert name" />
                <input type="text" value={certInput.issuer} onChange={e => setCertInput(p => ({...p, issuer: e.target.value}))} className={ic} placeholder="Issuer" />
                <input type="date" value={certInput.expires} onChange={e => setCertInput(p => ({...p, expires: e.target.value}))} className={ic} />
                <button onClick={addCert} className="px-3 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium">+ Add</button>
              </div>
            </div>
          </>)}

          {/* STEP 3: Compliance */}
          {step === 3 && (<>
            {/* Background Check */}
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3 flex items-center gap-2`}><Shield className="w-4 h-4" /> Background Check</h4>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={lc}>Status</label>
                  <select value={form.background_check_status} onChange={e => set('background_check_status', e.target.value)} className={ic}>
                    <option value="not_started">Not Started</option><option value="pending">Pending</option><option value="cleared">Cleared</option><option value="failed">Failed</option><option value="expired">Expired</option>
                  </select>
                </div>
                <div><label className={lc}>Completed Date</label><input type="date" value={form.background_check_date} onChange={e => set('background_check_date', e.target.value)} className={ic} /></div>
                <div><label className={lc}>Expiry Date</label><input type="date" value={form.background_check_expiry} onChange={e => set('background_check_expiry', e.target.value)} className={ic} /></div>
              </div>
            </div>

            {/* Waiver */}
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3 flex items-center gap-2`}><FileText className="w-4 h-4" /> Liability Waiver</h4>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={form.waiver_signed} onChange={e => set('waiver_signed', e.target.checked)} className="w-5 h-5 rounded" />
                <span className={tc.text}>Waiver signed</span>
              </label>
              {form.waiver_signed && (
                <div><label className={lc}>Signer Name</label><input type="text" value={form.waiver_signer_name} onChange={e => set('waiver_signer_name', e.target.value)} className={ic} placeholder="Full legal name" /></div>
              )}
            </div>

            {/* Code of Conduct */}
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3 flex items-center gap-2`}><Award className="w-4 h-4" /> Code of Conduct</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.code_of_conduct_signed} onChange={e => set('code_of_conduct_signed', e.target.checked)} className="w-5 h-5 rounded" />
                <span className={tc.text}>Code of conduct acknowledged</span>
              </label>
            </div>

            {/* Status & Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lc}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={ic}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div><label className={lc}>Admin Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={`${ic} h-24 resize-none`} placeholder="Internal notes (not visible to coaches)..." /></div>
          </>)}

          {/* STEP 4: Emergency */}
          {step === 4 && (<>
            <div className={`p-4 rounded-xl border ${tc.border}`}>
              <h4 className={`text-sm font-bold ${tc.text} mb-3`}>🚨 Emergency Contact</h4>
              <div className="space-y-3">
                <div><label className={lc}>Contact Name</label><input type="text" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} className={ic} placeholder="Jane Doe" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lc}>Phone</label><input type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} className={ic} placeholder="(555) 555-5555" /></div>
                  <div><label className={lc}>Relationship</label><input type="text" value={form.emergency_contact_relation} onChange={e => set('emergency_contact_relation', e.target.value)} className={ic} placeholder="Spouse" /></div>
                </div>
              </div>
            </div>
          </>)}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t ${tc.border} flex items-center justify-between`}>
          <div className="flex gap-2">
            {step > 1 && <button onClick={() => setStep(step - 1)} className={`px-4 py-2 rounded-xl border ${tc.border} ${tc.text} text-sm`}>← Back</button>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className={`px-4 py-2 rounded-xl border ${tc.border} ${tc.text} text-sm`}>Cancel</button>
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm">Next →</button>
            ) : (
              <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm">{coach ? 'Save Changes' : 'Add Coach'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ASSIGN TEAMS MODAL
// ============================================
function AssignTeamsModal({ coach, teams, onSave, onClose, tc }) {
  const [assignments, setAssignments] = useState(
    coach.assignments?.map(a => ({ team_id: a.team_id, role: a.role })) || []
  )

  function toggleTeam(teamId) {
    const existing = assignments.find(a => a.team_id === teamId)
    if (existing) setAssignments(assignments.filter(a => a.team_id !== teamId))
    else setAssignments([...assignments, { team_id: teamId, role: 'assistant' }])
  }

  function updateRole(teamId, role) {
    setAssignments(assignments.map(a => a.team_id === teamId ? { ...a, role } : a))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${tc.border} flex items-center justify-between sticky top-0 ${tc.cardBg}`}>
          <div>
            <h2 className={`text-xl font-semibold ${tc.text}`}>Assign Teams</h2>
            <p className={`text-sm ${tc.textMuted}`}>{coach.first_name} {coach.last_name}</p>
          </div>
          <button onClick={onClose} className={`${tc.textMuted} text-2xl`}>×</button>
        </div>
        <div className="p-6">
          {teams.length === 0 ? (
            <div className={`text-center py-8 ${tc.textMuted}`}>
              <p>No teams in current season</p>
              <p className="text-sm mt-1">Create teams first to assign coaches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map(team => {
                const assignment = assignments.find(a => a.team_id === team.id)
                const isAssigned = !!assignment
                return (
                  <div key={team.id} className={`p-4 rounded-xl border transition ${isAssigned ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5' : `${tc.border}`}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={isAssigned} onChange={() => toggleTeam(team.id)} className="w-5 h-5 rounded" />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color || '#888' }} />
                      <span className={`${tc.text} font-medium`}>{team.name}</span>
                    </label>
                    {isAssigned && (
                      <div className="mt-3 ml-8">
                        <select value={assignment.role} onChange={e => updateRole(team.id, e.target.value)}
                          className={`w-full rounded-lg px-3 py-2 text-sm ${tc.cardBg} border ${tc.border} ${tc.text}`}>
                          <option value="head">Head Coach</option>
                          <option value="assistant">Assistant Coach</option>
                          <option value="manager">Team Manager</option>
                          <option value="volunteer">Volunteer</option>
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className={`p-6 border-t ${tc.border} flex justify-between items-center sticky bottom-0 ${tc.cardBg}`}>
          <span className={`text-sm ${tc.textMuted}`}>{assignments.length} team{assignments.length !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} className={`px-6 py-2 rounded-xl border ${tc.border} ${tc.text}`}>Cancel</button>
            <button onClick={() => onSave(assignments)} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
