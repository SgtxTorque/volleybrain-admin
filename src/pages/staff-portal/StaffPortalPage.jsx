import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/csv-export'
import {
  Users, Search, Plus, Download, Mail, UserPlus, Grid, List,
  ChevronDown, X
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import PersonCard from './PersonCard'
import PersonDetailPanel from './PersonDetailPanel'
import EmailCoachesModal from '../coaches/EmailCoachesModal'
import InviteCoachModal from '../coaches/InviteCoachModal'
import CoachFormModal from './modals/CoachFormModal'
import AssignTeamsModal from './modals/AssignTeamsModal'
import CoachDetailModal from './modals/CoachDetailModal'
import StaffFormModal from './modals/StaffFormModal'

const STAFF_ROLES = [
  'Board Member', 'Team Parent', 'Scorekeeper', 'Line Judge',
  'Athletic Trainer', 'Photographer/Videographer', 'Event Coordinator', 'Other'
]

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'head_coach', label: 'Head Coaches' },
  { key: 'assistant', label: 'Assistants' },
  { key: 'staff', label: 'Staff' },
  { key: 'volunteer', label: 'Volunteers' },
]

// ============================================
// STAFF PORTAL PAGE — Unified Coaches + Staff
// ============================================
export function StaffPortalPage({ showToast }) {
  const { organization, profile } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const { isDark } = useTheme()

  // Data state
  const [coaches, setCoaches] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  // Selection & detail
  const [selectedPerson, setSelectedPerson] = useState(null)

  // Modals
  const [showCoachForm, setShowCoachForm] = useState(false)
  const [editingCoach, setEditingCoach] = useState(null)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [assigningCoach, setAssigningCoach] = useState(null)
  const [showCoachDetail, setShowCoachDetail] = useState(null)
  const [showEmailBlast, setShowEmailBlast] = useState(false)
  const [showInviteCoach, setShowInviteCoach] = useState(false)
  const [showAddDropdown, setShowAddDropdown] = useState(false)

  // Helper: get season IDs filtered by sport
  function getSportSeasonIds() {
    if (!selectedSport?.id) return null
    return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  }

  useEffect(() => {
    if (selectedSeason?.id) {
      loadAll()
    }
  }, [selectedSeason?.id, selectedSport?.id])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCoaches(), loadStaffMembers(), loadTeams()])
    setLoading(false)
  }

  async function loadCoaches() {
    try {
      let coachQuery = supabase.from('coaches').select('*').eq('organization_id', organization.id)
      if (!isAllSeasons(selectedSeason)) {
        coachQuery = coachQuery.eq('season_id', selectedSeason.id)
      } else if (selectedSport?.id) {
        const sportSeasonIds = (allSeasons || [])
          .filter(s => s.sport_id === selectedSport.id)
          .map(s => s.id)
        if (sportSeasonIds.length === 0) { setCoaches([]); return }
        coachQuery = coachQuery.in('season_id', sportSeasonIds)
      }
      const { data: coachesData, error } = await coachQuery.order('last_name', { ascending: true })
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
      setCoaches([])
    }
  }

  async function loadStaffMembers() {
    try {
      let query = supabase.from('staff_members').select('*, teams(id, name, color)')
      if (organization?.id) query = query.eq('organization_id', organization.id)
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        query = query.eq('season_id', selectedSeason.id)
      } else {
        const sportIds = getSportSeasonIds()
        if (sportIds && sportIds.length > 0) {
          query = query.in('season_id', sportIds)
        } else if (sportIds && sportIds.length === 0) {
          setStaffMembers([]); return
        }
      }
      const { data, error } = await query.order('last_name')
      if (error) throw error
      setStaffMembers(data || [])
    } catch (err) {
      console.error('Error loading staff:', err)
      setStaffMembers([])
    }
  }

  async function loadTeams() {
    let query = supabase.from('teams').select('id, name, color').eq('organization_id', organization.id)
    if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
      query = query.eq('season_id', selectedSeason.id)
    } else {
      const sportIds = getSportSeasonIds()
      if (sportIds && sportIds.length > 0) {
        query = query.in('season_id', sportIds)
      }
    }
    const { data } = await query
    setTeams(data || [])
  }

  // ── Data operations ──
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
      }
      setShowCoachForm(false); setEditingCoach(null); loadAll()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  async function deleteCoach(coach) {
    if (!confirm(`Remove ${coach.first_name} ${coach.last_name}?`)) return
    try {
      const { error } = await supabase.from('coaches').delete().eq('id', coach.id)
      if (error) throw error
      showToast('Coach removed', 'success')
      if (selectedPerson?.id === coach.id) setSelectedPerson(null)
      loadAll()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  async function toggleCoachStatus(coach) {
    const newStatus = coach.status === 'active' ? 'inactive' : 'active'
    await supabase.from('coaches').update({ status: newStatus }).eq('id', coach.id)
    showToast(`Coach ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success')
    loadAll()
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
      setAssigningCoach(null); loadAll()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
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
      setShowStaffForm(false); setEditingStaff(null); loadAll()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  async function deleteStaffMember(member) {
    if (!confirm(`Remove ${member.first_name} ${member.last_name}?`)) return
    try {
      await supabase.from('staff_members').delete().eq('id', member.id)
      showToast('Staff member removed', 'success')
      if (selectedPerson?.id === member.id) setSelectedPerson(null)
      loadAll()
    } catch (err) { showToast(`Error: ${err.message}`, 'error') }
  }

  async function toggleStaffStatus(member) {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    await supabase.from('staff_members').update({ status: newStatus }).eq('id', member.id)
    showToast(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success')
    loadAll()
  }

  // ── Normalize data into unified people array ──
  function normalizePeople() {
    const coachPeople = coaches.map(c => ({
      id: c.id,
      source: 'coach',
      firstName: c.first_name,
      lastName: c.last_name,
      fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: c.email,
      phone: c.phone,
      role: c.assignments?.some(a => a.role === 'head') ? 'Head Coach'
        : c.assignments?.some(a => a.role === 'assistant') ? 'Assistant Coach'
        : c.assignments?.some(a => a.role === 'manager') ? 'Manager'
        : 'Coach',
      roleCategory: c.assignments?.some(a => a.role === 'head') ? 'head_coach'
        : c.assignments?.some(a => a.role === 'assistant') ? 'assistant'
        : c.assignments?.some(a => a.role === 'manager') ? 'staff'
        : 'assistant',
      status: c.status || 'active',
      teams: (c.assignments || []).map(a => ({ id: a.teams?.id, name: a.teams?.name, color: a.teams?.color })),
      backgroundCheck: c.background_check_status || 'not_started',
      photoUrl: c.photo_url || null,
      _raw: c,
    }))

    const staffPeople = staffMembers.map(s => {
      const roleName = s.role === 'Other' && s.custom_role ? s.custom_role : s.role
      const isVolunteer = s.role === 'Volunteer' || s.role === 'Other'
      return {
        id: s.id,
        source: 'staff',
        firstName: s.first_name,
        lastName: s.last_name,
        fullName: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        email: s.email,
        phone: s.phone,
        role: roleName,
        roleCategory: isVolunteer ? 'volunteer' : 'staff',
        status: s.status || 'active',
        teams: s.teams ? [{ id: s.teams.id, name: s.teams.name, color: s.teams.color }] : [],
        backgroundCheck: s.background_check_status || 'not_started',
        photoUrl: s.photo_url || null,
        _raw: s,
      }
    })

    return [...coachPeople, ...staffPeople]
  }

  const allPeople = normalizePeople()

  // ── Filter ──
  const filteredPeople = allPeople.filter(p => {
    // Tab filter
    if (activeTab !== 'all' && p.roleCategory !== activeTab) return false
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return p.fullName.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.role?.toLowerCase().includes(q)
    }
    return true
  })

  // ── Stats ──
  const totalActive = allPeople.filter(p => p.status === 'active').length
  const headCoachCount = allPeople.filter(p => p.roleCategory === 'head_coach').length
  const assistantCount = allPeople.filter(p => p.roleCategory === 'assistant').length
  const staffCount = allPeople.filter(p => p.roleCategory === 'staff').length
  const volunteerCount = allPeople.filter(p => p.roleCategory === 'volunteer').length
  const assignedCount = allPeople.filter(p => p.teams.length > 0).length
  const bgClearedCount = allPeople.filter(p => p.backgroundCheck === 'cleared').length

  const overviewStats = [
    { value: totalActive, label: 'ACTIVE' },
    { value: headCoachCount, label: 'HEAD COACHES' },
    { value: assistantCount, label: 'ASSISTANTS' },
    { value: staffCount + volunteerCount, label: 'STAFF/VOL' },
    { value: assignedCount, label: 'ASSIGNED' },
    { value: `${bgClearedCount}/${allPeople.length}`, label: 'BG CLEARED' },
  ]

  // ── CSV Export ──
  function exportCombinedCSV() {
    const csvColumns = [
      { label: 'First Name', accessor: p => p.firstName },
      { label: 'Last Name', accessor: p => p.lastName },
      { label: 'Email', accessor: p => p.email },
      { label: 'Phone', accessor: p => p.phone },
      { label: 'Type', accessor: p => p.source === 'coach' ? 'Coach' : 'Staff' },
      { label: 'Role', accessor: p => p.role },
      { label: 'Status', accessor: p => p.status },
      { label: 'Teams', accessor: p => p.teams.map(t => t.name).join(', ') || 'None' },
      { label: 'BG Check', accessor: p => p.backgroundCheck },
    ]
    exportToCSV(filteredPeople, 'staff-portal', csvColumns)
  }

  // ── Person action handlers ──
  function handleEdit(person) {
    if (person.source === 'coach') {
      setEditingCoach(person._raw)
      setShowCoachForm(true)
    } else {
      setEditingStaff(person._raw)
      setShowStaffForm(true)
    }
  }

  function handleDelete(person) {
    if (person.source === 'coach') deleteCoach(person._raw)
    else deleteStaffMember(person._raw)
  }

  function handleToggleStatus(person) {
    if (person.source === 'coach') toggleCoachStatus(person._raw)
    else toggleStaffStatus(person._raw)
  }

  function handleAssign(person) {
    if (person.source === 'coach') setAssigningCoach(person._raw)
  }

  function handleDetail(person) {
    if (person.source === 'coach') setShowCoachDetail(person._raw)
  }

  if (!selectedSeason) {
    return (
      <PageShell title="Staff Portal" subtitle="Select a season to manage staff" breadcrumb="Club Management">
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
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
      title="Staff Portal"
      subtitle={`Manage coaches, staff & volunteers — ${selectedSeason.name}`}
      breadcrumb="Club Management"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportCombinedCSV}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              isDark
                ? 'bg-white/[0.06] border-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 hover:shadow-sm'
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowEmailBlast(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              isDark
                ? 'bg-white/[0.06] border-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 hover:shadow-sm'
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <Mail className="w-4 h-4" /> Email All
          </button>
          <button
            onClick={() => setShowInviteCoach(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              isDark
                ? 'bg-white/[0.06] border-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 hover:shadow-sm'
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <UserPlus className="w-4 h-4" /> Invite
          </button>
          {/* Add Person dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#10284C] text-white font-semibold rounded-xl hover:bg-[#1a3a6b] shadow-sm transition-all text-sm"
              style={{ fontFamily: 'var(--v2-font)' }}
            >
              <Plus className="w-4 h-4" /> Add Person <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {showAddDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddDropdown(false)} />
                <div className={`absolute right-0 top-12 z-20 rounded-xl shadow-lg border py-1.5 min-w-[180px] ${
                  isDark ? 'bg-[#1a2744] border-white/[0.06]' : 'bg-white border-slate-200'
                }`}>
                  <button
                    onClick={() => { setEditingCoach(null); setShowCoachForm(true); setShowAddDropdown(false) }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 font-medium ${
                      isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 opacity-60" /> Add Coach
                  </button>
                  <button
                    onClick={() => { setEditingStaff(null); setShowStaffForm(true); setShowAddDropdown(false) }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5 font-medium ${
                      isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 opacity-60" /> Add Staff Member
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      <SeasonFilterBar />

      {/* Navy Overview Header */}
      <div className="bg-[#10284C] rounded-2xl p-6 mb-6 flex items-center gap-8 flex-wrap" style={{ fontFamily: 'var(--v2-font)' }}>
        {overviewStats.map(stat => (
          <div key={stat.label} className="text-center min-w-[70px]">
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter row: search + type tabs + view toggle */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC]/20 ${
              isDark
                ? 'border-white/[0.06] bg-white/[0.04] text-white placeholder-slate-500'
                : 'border-slate-200 bg-white text-slate-700 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Type tabs */}
        <div className={`flex items-center gap-0.5 p-1 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'}`}>
          {TYPE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? isDark
                    ? 'bg-white/[0.1] text-white shadow-sm'
                    : 'bg-white text-[#10284C] shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'}`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'grid'
                ? isDark ? 'bg-white/[0.1] text-white' : 'bg-white text-[#10284C] shadow-sm'
                : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition ${
              viewMode === 'list'
                ? isDark ? 'bg-white/[0.1] text-white' : 'bg-white text-[#10284C] shadow-sm'
                : isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex gap-5">
        {/* Left: grid or list */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-[#4BB9EC] border-t-transparent rounded-full" />
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {searchTerm ? 'No matches found' : 'No staff members yet'}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Add coaches and staff to get started'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPeople.map(person => (
                <PersonCard
                  key={`${person.source}-${person.id}`}
                  person={person}
                  isDark={isDark}
                  isSelected={selectedPerson?.id === person.id && selectedPerson?.source === person.source}
                  onClick={() => setSelectedPerson(
                    selectedPerson?.id === person.id && selectedPerson?.source === person.source ? null : person
                  )}
                  onEdit={() => handleEdit(person)}
                  onAssign={() => handleAssign(person)}
                  onToggleStatus={() => handleToggleStatus(person)}
                  onDelete={() => handleDelete(person)}
                  onDetail={() => handleDetail(person)}
                />
              ))}
              {/* Add new card */}
              <button
                onClick={() => setShowAddDropdown(true)}
                className={`flex flex-col items-center justify-center gap-2 p-8 rounded-[14px] border-2 border-dashed transition-all ${
                  isDark
                    ? 'border-white/[0.08] hover:border-white/[0.15] text-slate-500 hover:text-slate-300'
                    : 'border-slate-200 hover:border-[#4BB9EC]/40 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-semibold">Add Staff Member</span>
              </button>
            </div>
          ) : (
            /* List view */
            <div className={`rounded-[14px] overflow-hidden border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
              {/* Table header */}
              <div className={`grid grid-cols-[1fr_140px_140px_120px_100px_40px] gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider ${
                isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-50 text-slate-400'
              }`}>
                <span>Name</span>
                <span>Role</span>
                <span>Team</span>
                <span>Contact</span>
                <span>BG Check</span>
                <span></span>
              </div>
              {filteredPeople.map(person => (
                <ListRow
                  key={`${person.source}-${person.id}`}
                  person={person}
                  isDark={isDark}
                  isSelected={selectedPerson?.id === person.id && selectedPerson?.source === person.source}
                  onClick={() => setSelectedPerson(
                    selectedPerson?.id === person.id && selectedPerson?.source === person.source ? null : person
                  )}
                  onEdit={() => handleEdit(person)}
                  onAssign={() => handleAssign(person)}
                  onToggleStatus={() => handleToggleStatus(person)}
                  onDelete={() => handleDelete(person)}
                  onDetail={() => handleDetail(person)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        {selectedPerson && (
          <PersonDetailPanel
            person={selectedPerson}
            isDark={isDark}
            onClose={() => setSelectedPerson(null)}
            onEdit={() => handleEdit(selectedPerson)}
            onAssign={() => handleAssign(selectedPerson)}
            onToggleStatus={() => handleToggleStatus(selectedPerson)}
            onDelete={() => handleDelete(selectedPerson)}
            onDetail={() => handleDetail(selectedPerson)}
            onEmail={selectedPerson.email ? () => window.open(`mailto:${selectedPerson.email}`, '_blank') : undefined}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {showCoachForm && (
        <CoachFormModal
          coach={editingCoach}
          onSave={saveCoach}
          onClose={() => { setShowCoachForm(false); setEditingCoach(null) }}
          showToast={showToast}
        />
      )}
      {showStaffForm && (
        <StaffFormModal
          staff={editingStaff}
          teams={teams}
          isDark={isDark}
          onSave={saveStaff}
          onClose={() => { setShowStaffForm(false); setEditingStaff(null) }}
        />
      )}
      {assigningCoach && (
        <AssignTeamsModal
          coach={assigningCoach}
          teams={teams}
          onSave={(a) => saveAssignments(assigningCoach.id, a)}
          onClose={() => setAssigningCoach(null)}
        />
      )}
      {showCoachDetail && (
        <CoachDetailModal
          coach={showCoachDetail}
          onClose={() => setShowCoachDetail(null)}
          onEdit={() => {
            setShowCoachDetail(null)
            setEditingCoach(showCoachDetail)
            setShowCoachForm(true)
          }}
        />
      )}
      {showEmailBlast && (
        <EmailCoachesModal
          coaches={coaches.filter(c => c.email)}
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
// LIST ROW — Compact table row for list view
// ============================================
const bgCheckLabels = {
  not_started: { label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  cleared: { label: 'Cleared', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20' },
  expired: { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-500/20' },
}

function ListRow({ person, isDark, isSelected, onClick, onEdit, onAssign, onToggleStatus, onDelete, onDetail }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const bgCheck = bgCheckLabels[person.backgroundCheck] || bgCheckLabels.not_started

  return (
    <div
      onClick={onClick}
      className={`grid grid-cols-[1fr_140px_140px_120px_100px_40px] gap-3 px-4 py-3 cursor-pointer transition border-t ${
        isSelected
          ? isDark ? 'bg-[#4BB9EC]/10 border-[#4BB9EC]/20' : 'bg-sky-50 border-sky-200'
          : isDark ? 'hover:bg-white/[0.02] border-white/[0.04]' : 'hover:bg-slate-50 border-slate-100'
      } ${person.status !== 'active' ? 'opacity-60' : ''}`}
    >
      {/* Name + avatar */}
      <div className="flex items-center gap-3 min-w-0">
        {person.photoUrl ? (
          <img src={person.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 bg-[#10284C]">
            {person.firstName?.[0]}{person.lastName?.[0]}
          </div>
        )}
        <span className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
          {person.fullName}
        </span>
      </div>

      {/* Role */}
      <div className="flex items-center">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          person.source === 'coach'
            ? isDark ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : 'bg-sky-50 text-sky-600'
            : isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'
        }`}>
          {person.role}
        </span>
      </div>

      {/* Team */}
      <div className="flex items-center gap-1 overflow-hidden">
        {person.teams.length > 0 ? person.teams.slice(0, 2).map(t => (
          <span key={t.id} className="px-2 py-0.5 rounded text-xs font-medium truncate" style={{
            backgroundColor: isDark ? `${t.color || '#888'}20` : `${t.color || '#888'}15`,
            color: t.color || '#888'
          }}>
            {t.name}
          </span>
        )) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Contact */}
      <div className="flex items-center">
        {person.email ? (
          <a href={`mailto:${person.email}`} onClick={e => e.stopPropagation()} className={`text-xs truncate ${isDark ? 'text-slate-400 hover:text-[#4BB9EC]' : 'text-slate-500 hover:text-sky-600'}`}>
            {person.email}
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* BG Check */}
      <div className="flex items-center">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bgCheck.bg} ${bgCheck.color}`}>
          {bgCheck.label}
        </span>
      </div>

      {/* 3-dot menu */}
      <div className="flex items-center justify-center relative">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
            isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-slate-100 text-slate-400'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setMenuOpen(false) }} />
            <div className={`absolute right-0 top-8 z-20 rounded-xl shadow-lg border py-1.5 min-w-[160px] ${
              isDark ? 'bg-[#1a2744] border-white/[0.06]' : 'bg-white border-slate-200'
            }`}>
              {person.source === 'coach' && (
                <button onClick={e => { e.stopPropagation(); onDetail?.(); setMenuOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                  View Profile
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); onEdit?.(); setMenuOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                Edit
              </button>
              {person.source === 'coach' && (
                <button onClick={e => { e.stopPropagation(); onAssign?.(); setMenuOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Assign Teams
                </button>
              )}
              <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
              <button onClick={e => { e.stopPropagation(); onToggleStatus?.(); setMenuOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm ${isDark ? 'text-amber-400 hover:bg-white/[0.04]' : 'text-amber-600 hover:bg-amber-50'}`}>
                {person.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete?.(); setMenuOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

