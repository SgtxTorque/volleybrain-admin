import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, User, Mail, Phone, Edit, Trash2, X, Check, Star, UserCog
} from '../../constants/icons'

// ============================================
// COACHES PAGE
// ============================================
export function CoachesPage({ showToast }) {
  const journey = useJourney()
  const { organization } = useAuth()
  const { selectedSeason } = useSeason()
  const [coaches, setCoaches] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('active') // 'active', 'inactive', 'all'
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCoach, setEditingCoach] = useState(null)
  const [assigningCoach, setAssigningCoach] = useState(null)
  const [selectedCoachForDetail, setSelectedCoachForDetail] = useState(null)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadCoaches()
      loadTeams()
    }
  }, [selectedSeason?.id])

  async function loadCoaches() {
    setLoading(true)
    try {
      // Load coaches for the current season
      const { data: coachesData, error: coachesError } = await supabase
        .from('coaches')
        .select('*')
        .eq('season_id', selectedSeason.id)
        .order('last_name', { ascending: true })

      if (coachesError) throw coachesError

      // Load team assignments using team_coaches table
      const { data: assignmentsData } = await supabase
        .from('team_coaches')
        .select('*, teams(id, name, color)')
        .in('coach_id', (coachesData || []).map(c => c.id))

      // Attach assignments to coaches
      const coachesWithAssignments = (coachesData || []).map(coach => ({
        ...coach,
        assignments: (assignmentsData || []).filter(a => a.coach_id === coach.id)
      }))
      setCoaches(coachesWithAssignments)
    } catch (err) {
      console.error('Error loading coaches:', err)
      showToast('Error loading coaches', 'error')
    }
    setLoading(false)
  }

  async function loadTeams() {
    if (!selectedSeason?.id) return
    const { data } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('season_id', selectedSeason.id)
      .order('name')
    setTeams(data || [])
  }

  async function saveCoach(coachData) {
    try {
      if (editingCoach) {
        const { error } = await supabase
          .from('coaches')
          .update({ ...coachData, updated_at: new Date().toISOString() })
          .eq('id', editingCoach.id)
        if (error) throw error
        showToast('Coach updated!', 'success')
      } else {
        const { error } = await supabase
          .from('coaches')
          .insert({ ...coachData, season_id: selectedSeason.id })
        if (error) throw error
        showToast('Coach added!', 'success')
        // Complete journey step when adding NEW coach
        journey?.completeStep('add_coaches')
      }
      setEditingCoach(null)
      setShowAddModal(false)
      loadCoaches()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function deleteCoach(coach) {
    if (!confirm(`Delete ${coach.first_name} ${coach.last_name}? This will also remove all team assignments.`)) return
    try {
      const { error } = await supabase.from('coaches').delete().eq('id', coach.id)
      if (error) throw error
      showToast('Coach deleted', 'success')
      loadCoaches()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function toggleCoachStatus(coach) {
    const newStatus = coach.status === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('coaches')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', coach.id)
      if (error) throw error
      showToast(newStatus === 'active' ? 'Coach activated' : 'Coach deactivated', 'success')
      loadCoaches()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  async function saveAssignments(coachId, assignments) {
    try {
      // Get current assignments for this coach
      const { data: existingAssignments } = await supabase
        .from('team_coaches')
        .select('id, team_id')
        .eq('coach_id', coachId)

      const existingTeamIds = (existingAssignments || []).map(a => a.team_id)
      const newTeamIds = assignments.map(a => a.team_id)

      // Delete removed assignments
      const toDelete = (existingAssignments || []).filter(a => !newTeamIds.includes(a.team_id))
      for (const del of toDelete) {
        await supabase.from('team_coaches').delete().eq('id', del.id)
        // Also remove from chat channels
        await removeCoachFromTeamChannels(coachId, del.team_id)
      }

      // Insert new assignments
      const toInsert = assignments.filter(a => !existingTeamIds.includes(a.team_id))
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('team_coaches')
          .insert(toInsert.map(a => ({
            coach_id: coachId,
            team_id: a.team_id,
            role: a.role
          })))
        if (error) throw error
        
        // Auto-add coach to chat channels for new teams
        for (const assignment of toInsert) {
          await autoAddCoachToTeamChannels(coachId, assignment.team_id)
        }
      }

      // Update existing assignments (role changes)
      const toUpdate = assignments.filter(a => existingTeamIds.includes(a.team_id))
      for (const upd of toUpdate) {
        const existing = existingAssignments.find(e => e.team_id === upd.team_id)
        if (existing) {
          await supabase.from('team_coaches').update({ role: upd.role }).eq('id', existing.id)
        }
      }

      showToast('Team assignments saved!', 'success')
      setAssigningCoach(null)
      loadCoaches()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }
  
  // Helper: Auto-add coach to team chat channels
  async function autoAddCoachToTeamChannels(coachId, teamId) {
    try {
      // Get coach info
      const { data: coach } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, user_id')
        .eq('id', coachId)
        .single()
      
      if (!coach || !coach.user_id) return // Coach needs a user account
      
      // Get team channels
      const { data: channels } = await supabase
        .from('chat_channels')
        .select('id, channel_type')
        .eq('team_id', teamId)
        .in('channel_type', ['team_chat', 'player_chat'])
      
      if (!channels || channels.length === 0) return
      
      // Add coach to both team_chat and player_chat
      for (const channel of channels) {
        const { data: existing } = await supabase
          .from('channel_members')
          .select('id')
          .eq('channel_id', channel.id)
          .eq('user_id', coach.user_id)
          .maybeSingle()
        
        if (!existing) {
          await supabase.from('channel_members').insert({
            channel_id: channel.id,
            user_id: coach.user_id,
            display_name: `Coach ${coach.first_name}`,
            member_role: 'coach',
            can_post: true,
            can_moderate: true // Coaches can delete messages
          })
        }
      }
    } catch (err) {
      console.error('Error auto-adding coach to channels:', err)
    }
  }
  
  // Helper: Remove coach from team chat channels
  async function removeCoachFromTeamChannels(coachId, teamId) {
    try {
      const { data: coach } = await supabase
        .from('coaches')
        .select('user_id')
        .eq('id', coachId)
        .single()
      
      if (!coach?.user_id) return
      
      const { data: channels } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('team_id', teamId)
      
      if (channels) {
        for (const channel of channels) {
          await supabase
            .from('channel_members')
            .delete()
            .eq('channel_id', channel.id)
            .eq('user_id', coach.user_id)
        }
      }
    } catch (err) {
      console.error('Error removing coach from channels:', err)
    }
  }

  // Filter coaches
  const filteredCoaches = coaches.filter(c => {
    // Status filter
    if (filterStatus === 'active' && c.status !== 'active') return false
    if (filterStatus === 'inactive' && c.status === 'active') return false
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
      const email = (c.email || '').toLowerCase()
      if (!fullName.includes(search) && !email.includes(search)) return false
    }
    
    return true
  })

  const roleLabels = {
    head: 'Head Coach',
    assistant: 'Assistant Coach',
    manager: 'Team Manager',
    volunteer: 'Volunteer'
  }

  if (!selectedSeason) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🧑‍🏫</div>
        <h2 className="text-xl font-semibold text-white mb-2">No Season Selected</h2>
        <p className="text-slate-400">Please select a season to manage coaches</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Coaches</h1>
          <p className="text-slate-400 mt-1">Manage coaches and team assignments • {selectedSeason.name}</p>
        </div>
        <button
          onClick={() => { setEditingCoach(null); setShowAddModal(true) }}
          className="px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-xl hover:brightness-110 transition flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add Coach
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search coaches..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
        >
          <option value="active">Active Coaches</option>
          <option value="inactive">Inactive Coaches</option>
          <option value="all">All Coaches</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{coaches.filter(c => c.status === 'active').length}</div>
          <div className="text-sm text-slate-400">Active Coaches</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{coaches.length}</div>
          <div className="text-sm text-slate-400">Total Coaches</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">
            {coaches.filter(c => c.assignments?.some(a => a.role === 'head')).length}
          </div>
          <div className="text-sm text-slate-400">Head Coaches</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">
            {coaches.reduce((sum, c) => sum + (c.assignments?.length || 0), 0)}
          </div>
          <div className="text-sm text-slate-400">Team Assignments</div>
        </div>
      </div>

      {/* Coaches List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading coaches...</div>
      ) : filteredCoaches.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
          <UserCog className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl font-semibold text-white mb-2">No coaches found</h3>
          <p className="text-slate-400 mb-6">
            {searchTerm ? 'Try a different search term' : 'Add your first coach to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-xl"
            >
              Add First Coach
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCoaches.map(coach => (
            <div
              key={coach.id}
              className={`bg-slate-800 border border-slate-700 rounded-xl p-5 ${coach.status !== 'active' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-bold text-black">
                    {coach.first_name?.[0]}{coach.last_name?.[0]}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-3">
                      <ClickableCoachName 
                        coach={coach}
                        onCoachSelect={setSelectedCoachForDetail}
                        className="text-lg font-semibold text-white"
                      />
                      {coach.experience_years && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                          {coach.experience_years} yrs exp
                        </span>
                      )}
                      {coach.status !== 'active' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {/* Contact */}
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      {coach.email && (
                        <a href={`mailto:${coach.email}`} className="hover:text-white flex items-center gap-1">
                          <Mail className="w-4 h-4" /> {coach.email}
                        </a>
                      )}
                      {coach.phone && (
                        <a href={`tel:${coach.phone}`} className="hover:text-white flex items-center gap-1">
                          <Phone className="w-4 h-4" /> {coach.phone}
                        </a>
                      )}
                    </div>

                    {/* Specialties */}
                    {coach.specialties && (
                      <div className="text-sm text-slate-500 mt-1">
                        Specialties: {coach.specialties}
                      </div>
                    )}

                    {/* Team Assignments */}
                    {coach.assignments?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {coach.assignments.map(a => (
                          <span
                            key={a.id}
                            className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
                            style={{ backgroundColor: `${a.teams?.color}20`, color: a.teams?.color || '#888' }}
                          >
                            {a.role === 'head' && <Star className="w-3 h-3" />} {a.teams?.name}
                            <span className="opacity-60">({roleLabels[a.role] || a.role})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Emergency Contact & Actions */}
                <div className="flex items-start gap-4">
                  {/* Emergency Contact */}
                  {coach.emergency_contact_name && (
                    <div className="text-right text-sm">
                      <div className="text-slate-500">Emergency Contact</div>
                      <div className="text-slate-400">{coach.emergency_contact_name}</div>
                      {coach.emergency_contact_phone && (
                        <a href={`tel:${coach.emergency_contact_phone}`} className="text-slate-400 hover:text-white">
                          {coach.emergency_contact_phone}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssigningCoach(coach)}
                      className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Assign to Teams"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingCoach(coach); setShowAddModal(true) }}
                      className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleCoachStatus(coach)}
                      className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      title={coach.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {coach.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteCoach(coach)}
                      className="p-2 rounded-lg bg-slate-900 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Coach Modal */}
      {showAddModal && (
        <CoachFormModal
          coach={editingCoach}
          onSave={saveCoach}
          onClose={() => { setShowAddModal(false); setEditingCoach(null) }}
        />
      )}

      {/* Assign Teams Modal */}
      {assigningCoach && (
        <AssignTeamsModal
          coach={assigningCoach}
          teams={teams}
          onSave={(assignments) => saveAssignments(assigningCoach.id, assignments)}
          onClose={() => setAssigningCoach(null)}
        />
      )}

      {/* Coach Detail Modal */}
      {selectedCoachForDetail && (
        <CoachDetailModal
          coach={selectedCoachForDetail}
          onClose={() => setSelectedCoachForDetail(null)}
        />
      )}
    </div>
  )
}

// ============================================
// CLICKABLE COACH NAME
// ============================================
export function ClickableCoachName({ coach, className = '', children, onCoachSelect }) {
  if (!coach) return <span className={className}>{children || 'Unknown'}</span>
  
  const displayName = children || `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Unknown'
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onCoachSelect?.(coach)
      }}
      className={`${className} hover:text-blue-400 hover:underline cursor-pointer transition-colors text-left`}
    >
      {displayName}
    </button>
  )
}

// ============================================
// CLICKABLE TEAM NAME
// ============================================
export function ClickableTeamName({ team, className = '', children, onTeamSelect, color }) {
  if (!team) return <span className={className}>{children || 'Unknown'}</span>
  
  const displayName = children || team.name || 'Unknown'
  const teamColor = color || team.color || '#EAB308'
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onTeamSelect?.(team)
      }}
      className={`${className} hover:underline cursor-pointer transition-colors text-left`}
      style={{ color: teamColor }}
    >
      {displayName}
    </button>
  )
}

// ============================================
// COACH DETAIL MODAL
// ============================================
export function CoachDetailModal({ coach, onClose }) {
  const tc = useThemeClasses()
  
  if (!coach) return null
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className={`${tc.cardBg} border ${tc.border} rounded-2xl w-full max-w-md overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-500/30 bg-blue-500/10">
          <div className="flex items-center gap-4">
            {coach.photo_url ? (
              <img src={coach.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-blue-500" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-3xl border-2 border-blue-500/50">
                🧑‍🏫
              </div>
            )}
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>{coach.first_name} {coach.last_name}</h2>
              <p className="text-blue-400 text-sm">{coach.role || 'Coach'}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {coach.email && (
            <div className="flex items-center justify-between">
              <span className={tc.textSecondary}>Email</span>
              <a href={`mailto:${coach.email}`} className="text-[var(--accent-primary)] hover:underline">{coach.email}</a>
            </div>
          )}
          {coach.phone && (
            <div className="flex items-center justify-between">
              <span className={tc.textSecondary}>📞 Phone</span>
              <a href={`tel:${coach.phone}`} className="text-[var(--accent-primary)] hover:underline">{coach.phone}</a>
            </div>
          )}
          {coach.certification && (
            <div className="flex items-center justify-between">
              <span className={tc.textSecondary}>📜 Certification</span>
              <span className={tc.text}>{coach.certification}</span>
            </div>
          )}
          {coach.experience_years && (
            <div className="flex items-center justify-between">
              <span className={tc.textSecondary}>⏱️ Experience</span>
              <span className={tc.text}>{coach.experience_years} years</span>
            </div>
          )}
          {coach.bio && (
            <div>
              <p className={`${tc.textSecondary} mb-2`}>📝 Bio</p>
              <p className={`${tc.text} text-sm`}>{coach.bio}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${tc.border} flex justify-end`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text} ${tc.hoverBgAlt}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COACH FORM MODAL
// ============================================
function CoachFormModal({ coach, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: coach?.first_name || '',
    last_name: coach?.last_name || '',
    email: coach?.email || '',
    phone: coach?.phone || '',
    address: coach?.address || '',
    experience_years: coach?.experience_years || '',
    experience_details: coach?.experience_details || '',
    specialties: coach?.specialties || '',
    emergency_contact_name: coach?.emergency_contact_name || '',
    emergency_contact_phone: coach?.emergency_contact_phone || '',
    emergency_contact_relation: coach?.emergency_contact_relation || '',
    status: coach?.status || 'active',
    notes: coach?.notes || ''
  })

  function handleSubmit() {
    if (!form.first_name || !form.last_name) {
      alert('Please enter first and last name')
      return
    }
    onSave({
      ...form,
      experience_years: form.experience_years ? parseInt(form.experience_years) : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <h2 className="text-xl font-semibold text-white">{coach ? 'Edit Coach' : 'Add Coach'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">First Name *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Last Name *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                placeholder="coach@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
              placeholder="123 Main St, City, State"
            />
          </div>

          {/* Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Years of Experience</label>
              <input
                type="number"
                value={form.experience_years}
                onChange={e => setForm({ ...form, experience_years: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                placeholder="5"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Specialties</label>
              <input
                type="text"
                value={form.specialties}
                onChange={e => setForm({ ...form, specialties: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                placeholder="Setting, Defense"
              />
            </div>
          </div>

          {/* Experience Details */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Experience Details</label>
            <textarea
              value={form.experience_details}
              onChange={e => setForm({ ...form, experience_details: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white h-20 resize-none"
              placeholder="Previous coaching experience, certifications, etc."
            />
          </div>

          {/* Emergency Contact */}
          <div className="bg-slate-900 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.emergency_contact_name}
                  onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.emergency_contact_phone}
                  onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="(555) 555-5555"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Relationship</label>
                <input
                  type="text"
                  value={form.emergency_contact_relation}
                  onChange={e => setForm({ ...form, emergency_contact_relation: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Spouse"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white h-24 resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">
            {coach ? 'Save Changes' : 'Add Coach'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ASSIGN TEAMS MODAL
// ============================================
function AssignTeamsModal({ coach, teams, onSave, onClose }) {
  const [assignments, setAssignments] = useState(
    coach.assignments?.map(a => ({
      team_id: a.team_id,
      role: a.role
    })) || []
  )

  function toggleTeam(teamId) {
    const existing = assignments.find(a => a.team_id === teamId)
    if (existing) {
      setAssignments(assignments.filter(a => a.team_id !== teamId))
    } else {
      setAssignments([...assignments, { team_id: teamId, role: 'assistant' }])
    }
  }

  function updateRole(teamId, role) {
    setAssignments(assignments.map(a =>
      a.team_id === teamId ? { ...a, role } : a
    ))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Assign Teams</h2>
            <p className="text-sm text-slate-400">{coach.first_name} {coach.last_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6">
          {teams.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>No teams in current season</p>
              <p className="text-sm mt-1">Create teams first to assign coaches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map(team => {
                const assignment = assignments.find(a => a.team_id === team.id)
                const isAssigned = !!assignment
                
                return (
                  <div
                    key={team.id}
                    className={`p-4 rounded-xl border transition ${
                      isAssigned
                        ? 'border-[var(--accent-primary)]/50 bg-yellow-400/5'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleTeam(team.id)}
                        className="w-5 h-5 rounded"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color || '#888' }}
                      />
                      <span className="text-white font-medium">{team.name}</span>
                    </label>
                    
                    {isAssigned && (
                      <div className="mt-3 ml-8">
                        <select
                          value={assignment.role}
                          onChange={e => updateRole(team.id, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        >
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
        <div className="p-6 border-t border-slate-700 flex justify-between items-center sticky bottom-0 bg-slate-800">
          <span className="text-sm text-slate-400">
            {assignments.length} team{assignments.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">
              Cancel
            </button>
            <button
              onClick={() => onSave(assignments)}
              className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold"
            >
              Save Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
