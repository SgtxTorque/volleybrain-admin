import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, User, Mail, Phone, Edit, Trash2, X, Check, Star, UserCog,
  Camera, Shield, FileText, Calendar, ChevronDown, ChevronRight,
  Award, AlertTriangle, Search, Filter, Upload, Eye
} from '../../constants/icons'

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
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const [coaches, setCoaches] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCoach, setEditingCoach] = useState(null)
  const [assigningCoach, setAssigningCoach] = useState(null)
  const [selectedCoachForDetail, setSelectedCoachForDetail] = useState(null)

  useEffect(() => {
    if (selectedSeason?.id) { loadCoaches(); loadTeams() }
  }, [selectedSeason?.id])

  async function loadCoaches() {
    setLoading(true)
    try {
      const { data: coachesData, error } = await supabase
        .from('coaches').select('*')
        .eq('season_id', selectedSeason.id)
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
    const { data } = await supabase.from('teams').select('id, name, color').eq('season_id', selectedSeason.id)
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
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-12 text-center`}>
        <UserCog className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className={tc.textMuted}>Please select a season to manage coaches</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Coach Management</h1>
          <p className={tc.textMuted}>Manage coaches, credentials, and team assignments • {selectedSeason.name}</p>
        </div>
        <button onClick={() => { setEditingCoach(null); setShowAddModal(true) }}
          className="px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-xl hover:brightness-110 transition flex items-center gap-2">
          <span className="text-xl">+</span> Add Coach
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input type="text" placeholder="Search coaches..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl ${tc.cardBg} border ${tc.border} ${tc.text}`} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-4 py-3 rounded-xl ${tc.cardBg} border ${tc.border} ${tc.text}`}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Active" value={coaches.filter(c => c.status === 'active').length} icon="👨‍🏫" tc={tc} />
        <StatCard label="Head Coaches" value={coaches.filter(c => c.assignments?.some(a => a.role === 'head')).length} icon="⭐" tc={tc} />
        <StatCard label="BG Checks" value={`${bgCheckCleared}/${coaches.length}`} icon="🛡️" color={bgCheckCleared === coaches.length && coaches.length > 0 ? 'text-emerald-400' : 'text-amber-400'} tc={tc} />
        <StatCard label="Waivers" value={`${waiversSigned}/${coaches.length}`} icon="📋" color={waiversSigned === coaches.length && coaches.length > 0 ? 'text-emerald-400' : 'text-amber-400'} tc={tc} />
        <StatCard label="Code of Conduct" value={`${conductSigned}/${coaches.length}`} icon="✅" color={conductSigned === coaches.length && coaches.length > 0 ? 'text-emerald-400' : 'text-amber-400'} tc={tc} />
      </div>

      {/* Coach Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full" />
        </div>
      ) : filteredCoaches.length === 0 ? (
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-12 text-center`}>
          <UserCog className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className={`text-xl font-semibold ${tc.text} mb-2`}>No coaches found</h3>
          <p className={`${tc.textMuted} mb-6`}>{searchTerm ? 'Try a different search term' : 'Add your first coach to get started'}</p>
          {!searchTerm && (
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-xl">Add First Coach</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoaches.map(coach => (
            <CoachCard key={coach.id} coach={coach} tc={tc}
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
    </div>
  )
}

function StatCard({ label, value, icon, color, tc }) {
  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs ${tc.textMuted} uppercase tracking-wider`}>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color || tc.text}`}>{value}</div>
    </div>
  )
}

// ============================================
// COACH CARD
// ============================================
function CoachCard({ coach, tc, onDetail, onEdit, onAssign, onToggleStatus, onDelete }) {
  const bgCheck = bgCheckLabels[coach.background_check_status] || bgCheckLabels.not_started
  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl overflow-hidden transition hover:shadow-lg ${coach.status !== 'active' ? 'opacity-60' : ''}`}>
      <div className="relative h-24 bg-gradient-to-r from-blue-600/30 to-purple-600/30">
        <div className="absolute -bottom-8 left-4">
          {coach.photo_url ? (
            <img src={coach.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-slate-800 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white border-3 border-slate-800 shadow-lg">
              {coach.first_name?.[0]}{coach.last_name?.[0]}
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          {coach.background_check_status === 'cleared' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/30 text-emerald-300">🛡️</span>}
          {coach.waiver_signed && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/30 text-blue-300">📋</span>}
          {coach.status !== 'active' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/30 text-red-300">Inactive</span>}
        </div>
      </div>

      <div className="pt-10 px-4 pb-4">
        <button onClick={onDetail} className={`text-lg font-bold ${tc.text} hover:text-blue-400 transition text-left`}>
          {coach.first_name} {coach.last_name}
        </button>
        {coach.coaching_level && <p className="text-xs text-purple-400 font-medium mt-0.5">{coach.coaching_level}</p>}

        <div className={`flex flex-col gap-1 mt-2 text-sm ${tc.textMuted}`}>
          {coach.email && <a href={`mailto:${coach.email}`} className="hover:text-blue-400 flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {coach.email}</a>}
          {coach.phone && <a href={`tel:${coach.phone}`} className="hover:text-blue-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {coach.phone}</a>}
        </div>

        {coach.experience_years && <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">{coach.experience_years} yrs experience</span>}

        {coach.assignments?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {coach.assignments.map(a => (
              <span key={a.id} className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1" style={{ backgroundColor: `${a.teams?.color}20`, color: a.teams?.color || '#888' }}>
                {a.role === 'head' && <Star className="w-3 h-3" />} {a.teams?.name}
              </span>
            ))}
          </div>
        )}

        {coach.bio && <p className={`text-xs ${tc.textMuted} mt-2 line-clamp-2`}>{coach.bio}</p>}

        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={onDetail} className={`p-2 rounded-lg ${tc.hoverBg} transition`} title="View"><Eye className="w-4 h-4 opacity-60" /></button>
          <button onClick={onAssign} className={`p-2 rounded-lg ${tc.hoverBg} transition`} title="Teams"><Users className="w-4 h-4 opacity-60" /></button>
          <button onClick={onEdit} className={`p-2 rounded-lg ${tc.hoverBg} transition`} title="Edit"><Edit className="w-4 h-4 opacity-60" /></button>
          <div className="flex-1" />
          <button onClick={onToggleStatus} className={`p-2 rounded-lg ${tc.hoverBg} transition`} title={coach.status === 'active' ? 'Deactivate' : 'Activate'}>
            {coach.status === 'active' ? <X className="w-4 h-4 text-amber-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-500/10 transition" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
        </div>
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
