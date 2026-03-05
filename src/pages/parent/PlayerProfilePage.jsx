// =============================================================================
// PlayerProfilePage — player profile with tabs (Registration, Uniform, Medical, Waivers, History)
// Preserves ALL Supabase queries and save handlers from the original
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Edit, Save, X } from '../../constants/icons'
import { SPORT_POSITIONS, getSizeOptionsForPiece, getUniformConfig } from './PlayerProfileConstants'
import WaiversTab from './PlayerProfileWaivers'

function PlayerProfilePage({ playerId, roleContext, showToast, onNavigate }) {
  const { organization } = useAuth()
  const { isDark } = useTheme()

  const [player, setPlayer] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  // Edit states
  const [editingInfo, setEditingInfo] = useState(false)
  const [editingJersey, setEditingJersey] = useState(false)
  const [editingMedical, setEditingMedical] = useState(false)
  const [editingEmergency, setEditingEmergency] = useState(false)

  // Form states
  const [infoForm, setInfoForm] = useState({})
  const [jerseyPrefs, setJerseyPrefs] = useState({ pref1: '', pref2: '', pref3: '', size: '', bottomSize: '', extras: {} })
  const [medicalForm, setMedicalForm] = useState({ conditions: '', allergies: '' })
  const [emergencyForm, setEmergencyForm] = useState({ name: '', phone: '', relation: '' })

  const [seasonHistory, setSeasonHistory] = useState([])
  const [sportName, setSportName] = useState('volleyball')
  const [registrationData, setRegistrationData] = useState(null)

  // ═══ DATA LOADING (preserved exactly) ═══
  useEffect(() => { loadPlayerData() }, [playerId])

  async function loadPlayerData() {
    setLoading(true)
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players').select('*').eq('id', playerId).single()
      if (playerError || !playerData) { setLoading(false); return }

      const { data: teamPlayersData } = await supabase
        .from('team_players')
        .select('id, team_id, jersey_number, teams (id, name, color, season_id, seasons(id, name, start_date, end_date, sports(name, icon)))')
        .eq('player_id', playerId)

      const { data: regData } = await supabase
        .from('registrations')
        .select('id, registration_data, waivers_accepted, signature_name, signature_date, custom_answers, status, submitted_at')
        .eq('player_id', playerId).order('submitted_at', { ascending: false }).limit(1).maybeSingle()
      setRegistrationData(regData || null)

      let seasonData = null
      if (playerData.season_id) {
        const { data: season } = await supabase
          .from('seasons').select('id, name, start_date, end_date, sports(name, icon)')
          .eq('id', playerData.season_id).single()
        seasonData = season
      }

      const enrichedPlayer = { ...playerData, seasons: seasonData, team_players: teamPlayersData || [] }
      setPlayer(enrichedPlayer)
      setTeams((teamPlayersData || []).map(tp => ({ ...tp.teams, jersey_number: tp.jersey_number })).filter(Boolean))

      const rd = regData?.registration_data || {}
      const shared = rd.shared || {}
      const childData = rd.player || {}

      setInfoForm({
        first_name: playerData.first_name || '', last_name: playerData.last_name || '',
        date_of_birth: playerData.date_of_birth || playerData.birth_date || '',
        gender: playerData.gender || childData.gender || '',
        grade: playerData.grade || '', school: playerData.school || '',
        position: playerData.position || childData.position_preference || '',
        experience_level: playerData.experience_level || playerData.experience || childData.experience_level || '',
        height: playerData.height || childData.height || '', weight: playerData.weight || childData.weight || '',
        parent_name: playerData.parent_name || shared.parent1_name || '',
        parent_email: playerData.parent_email || shared.parent1_email || '',
        parent_phone: playerData.parent_phone || shared.parent1_phone || '',
        parent2_name: playerData.parent2_name || shared.parent2_name || '',
        parent2_email: playerData.parent2_email || shared.parent2_email || '',
        parent2_phone: playerData.parent2_phone || shared.parent2_phone || '',
        address: playerData.address || shared.address || '', city: playerData.city || shared.city || '',
        state: playerData.state || shared.state || '', zip: playerData.zip || shared.zip || '',
      })
      setJerseyPrefs({
        pref1: playerData.jersey_pref_1 || '', pref2: playerData.jersey_pref_2 || '',
        pref3: playerData.jersey_pref_3 || '', size: playerData.uniform_size_jersey || '',
        bottomSize: playerData.uniform_size_shorts || '', extras: playerData.uniform_sizes_extra || {},
      })
      setMedicalForm({ conditions: playerData.medical_conditions || playerData.medical_notes || '', allergies: playerData.allergies || '' })
      setEmergencyForm({
        name: playerData.emergency_contact_name || playerData.emergency_name || '',
        phone: playerData.emergency_contact_phone || playerData.emergency_phone || '',
        relation: playerData.emergency_contact_relation || playerData.emergency_relation || '',
      })

      const history = (teamPlayersData || []).map(tp => ({
        seasonName: tp.teams?.seasons?.name || 'Unknown Season', teamName: tp.teams?.name || 'Unknown Team',
        teamColor: tp.teams?.color || '#666', sportIcon: tp.teams?.seasons?.sports?.icon || '🏐',
        sportName: tp.teams?.seasons?.sports?.name || 'Volleyball', jerseyNumber: tp.jersey_number,
        startDate: tp.teams?.seasons?.start_date, endDate: tp.teams?.seasons?.end_date,
      }))
      setSeasonHistory(history)
      setSportName(teamPlayersData?.[0]?.teams?.seasons?.sports?.name || seasonData?.sports?.name || 'volleyball')
    } catch (err) { console.error('Error loading player:', err) }
    setLoading(false)
  }

  // ═══ SAVE HANDLERS (preserved exactly) ═══
  async function savePlayerInfo() {
    try {
      const playerUpdate = {
        first_name: infoForm.first_name, last_name: infoForm.last_name,
        date_of_birth: infoForm.date_of_birth || null, gender: infoForm.gender || null,
        grade: infoForm.grade || null, school: infoForm.school || null,
        position: infoForm.position || null, experience_level: infoForm.experience_level || null,
        parent_name: infoForm.parent_name || null, parent_email: infoForm.parent_email || null,
        parent_phone: infoForm.parent_phone || null,
      }
      const extendedFields = {
        address: infoForm.address || null, city: infoForm.city || null,
        state: infoForm.state || null, zip: infoForm.zip || null,
        parent2_name: infoForm.parent2_name || null, parent2_email: infoForm.parent2_email || null,
        parent2_phone: infoForm.parent2_phone || null,
      }
      const { error } = await supabase.from('players').update({ ...playerUpdate, ...extendedFields }).eq('id', playerId)
      if (error) {
        console.warn('Extended fields may not exist, trying core only:', error.message)
        const { error: coreError } = await supabase.from('players').update(playerUpdate).eq('id', playerId)
        if (coreError) throw coreError
        if (registrationData?.id) {
          const existingRD = registrationData.registration_data || {}
          await supabase.from('registrations').update({
            registration_data: { ...existingRD, shared: { ...(existingRD.shared || {}),
              address: infoForm.address, city: infoForm.city, state: infoForm.state, zip: infoForm.zip,
              parent2_name: infoForm.parent2_name, parent2_email: infoForm.parent2_email, parent2_phone: infoForm.parent2_phone,
            }}
          }).eq('id', registrationData.id)
        }
      }
      showToast('Player info updated!', 'success')
      setEditingInfo(false); loadPlayerData()
    } catch (err) { showToast('Error saving: ' + err.message, 'error') }
  }

  async function saveJerseyPreferences() {
    try {
      const uniformConfig = getUniformConfig(sportName)
      const updates = {
        jersey_pref_1: jerseyPrefs.pref1 ? parseInt(jerseyPrefs.pref1) : null,
        jersey_pref_2: jerseyPrefs.pref2 ? parseInt(jerseyPrefs.pref2) : null,
        jersey_pref_3: jerseyPrefs.pref3 ? parseInt(jerseyPrefs.pref3) : null,
        uniform_size_jersey: jerseyPrefs.size || null, uniform_size_shorts: jerseyPrefs.bottomSize || null,
        uniform_sizes_extra: Object.keys(jerseyPrefs.extras || {}).length > 0 ? jerseyPrefs.extras : null,
      }
      const changes = []
      if ((player.jersey_pref_1 || '') != (jerseyPrefs.pref1 || '') ||
          (player.jersey_pref_2 || '') != (jerseyPrefs.pref2 || '') ||
          (player.jersey_pref_3 || '') != (jerseyPrefs.pref3 || '')) {
        changes.push(`Number prefs: ${[jerseyPrefs.pref1, jerseyPrefs.pref2, jerseyPrefs.pref3].filter(Boolean).join(', ') || 'cleared'}`)
      }
      if ((player.uniform_size_jersey || '') !== (jerseyPrefs.size || '')) changes.push(`${uniformConfig.top} size: ${jerseyPrefs.size || 'cleared'}`)
      if (uniformConfig.bottom && (player.uniform_size_shorts || '') !== (jerseyPrefs.bottomSize || '')) changes.push(`${uniformConfig.bottom} size: ${jerseyPrefs.bottomSize || 'cleared'}`)
      const oldExtras = player.uniform_sizes_extra || {}
      for (const extra of uniformConfig.extras) {
        const key = extra.toLowerCase().replace(/\s+/g, '_')
        if ((oldExtras[key] || '') !== (jerseyPrefs.extras?.[key] || '')) changes.push(`${extra} size: ${jerseyPrefs.extras?.[key] || 'cleared'}`)
      }
      const { error } = await supabase.from('players').update(updates).eq('id', playerId)
      if (error) throw error
      if (changes.length > 0) {
        const parentName = roleContext?.children ? `${player.first_name} ${player.last_name}'s parent` : 'A parent'
        try {
          await supabase.from('admin_notifications').insert({
            organization_id: organization?.id || player.organization_id, type: 'jersey_change',
            title: `Uniform update: ${player.first_name} ${player.last_name}`,
            message: `${parentName} updated uniform preferences: ${changes.join(' | ')}`,
            player_id: playerId, team_id: primaryTeam?.id || null, is_read: false,
            metadata: { player_name: `${player.first_name} ${player.last_name}`, sport: sportName, changes,
              jersey_prefs: [jerseyPrefs.pref1, jerseyPrefs.pref2, jerseyPrefs.pref3].filter(Boolean),
              top_size: jerseyPrefs.size, bottom_size: jerseyPrefs.bottomSize, extras: jerseyPrefs.extras },
          })
        } catch (notifErr) { console.warn('Could not create admin notification:', notifErr) }
      }
      showToast('Uniform preferences saved!', 'success')
      setEditingJersey(false); loadPlayerData()
    } catch (err) { showToast('Error saving: ' + err.message, 'error') }
  }

  async function saveMedicalInfo() {
    try {
      const { error } = await supabase.from('players')
        .update({ medical_conditions: medicalForm.conditions || null, allergies: medicalForm.allergies || null })
        .eq('id', playerId)
      if (error) throw error
      showToast('Medical info updated!', 'success'); setEditingMedical(false); loadPlayerData()
    } catch (err) { showToast('Error saving: ' + err.message, 'error') }
  }

  async function saveEmergencyContact() {
    try {
      const { error } = await supabase.from('players')
        .update({ emergency_contact_name: emergencyForm.name || null, emergency_contact_phone: emergencyForm.phone || null,
          emergency_contact_relation: emergencyForm.relation || null })
        .eq('id', playerId)
      if (error) throw error
      showToast('Emergency contact updated!', 'success'); setEditingEmergency(false); loadPlayerData()
    } catch (err) { showToast('Error saving: ' + err.message, 'error') }
  }

  // ═══ LOADING / ERROR ═══
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!player) {
    return (
      <div className={`text-center py-12 ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>
        <span className="text-6xl">😕</span>
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-4`}>Player Not Found</h2>
      </div>
    )
  }

  // ═══ DERIVED ═══
  const primaryTeamPlayer = player.team_players?.[0]
  const primaryTeam = teams[0]
  const teamColor = primaryTeam?.color || '#EAB308'
  const assignedJersey = primaryTeamPlayer?.jersey_number

  // ═══ REUSABLE UI ═══
  const cardCls = isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const mutedCls = isDark ? 'text-slate-400' : 'text-slate-500'
  const borderCls = isDark ? 'border-white/[0.06]' : 'border-slate-200'
  const inputCls = `w-full px-3 py-2.5 rounded-xl border ${borderCls} ${isDark ? 'bg-white/[0.04] text-white' : 'bg-white text-slate-900'} text-sm`

  const InfoRow = ({ label, value, icon }) => (
    <div className={`flex items-center gap-3 py-3 border-b last:border-b-0 ${borderCls}`}>
      {icon && <span className={`text-lg ${mutedCls}`}>{icon}</span>}
      <span className={`text-sm ${mutedCls} w-32 flex-shrink-0`}>{label}</span>
      <span className={`text-sm font-medium ${textCls}`}>{value || '—'}</span>
    </div>
  )
  const EditBtn = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-lynx-sky/10 text-lynx-sky hover:bg-lynx-sky/20 transition">
      <Edit className="w-3.5 h-3.5" /> Edit
    </button>
  )
  const SaveCancelBtns = ({ onSave, onCancel }) => (
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className={`flex-1 py-2.5 rounded-xl border ${borderCls} ${textCls} font-medium text-sm hover:opacity-80 transition`}>Cancel</button>
      <button onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-lynx-sky text-lynx-navy font-bold text-sm hover:brightness-110 transition">Save Changes</button>
    </div>
  )
  const FormField = ({ label, value, onChange, type = 'text', placeholder, options }) => (
    <div>
      <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">Select...</option>
          {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      )}
    </div>
  )

  const tabs = [
    { id: 'info', label: 'Registration', icon: '📋' },
    { id: 'jersey', label: 'Uniform', icon: '👕' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'waivers', label: 'Waivers', icon: '📄' },
    { id: 'history', label: 'History', icon: '📅' },
  ]

  // ═══ RENDER ═══
  return (
    <div className={`w-full px-6 py-6 space-y-5 ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>

      {/* Trading Card Hero */}
      <div className="relative overflow-hidden rounded-[14px]" style={{ background: `linear-gradient(135deg, #0B1628 0%, ${teamColor}30 100%)` }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative flex items-center gap-5 p-6">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.first_name} className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-black text-4xl border-2 border-white/10"
              style={{ backgroundColor: teamColor }}>{player.first_name?.[0]}{player.last_name?.[0]}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-lynx-sky">{primaryTeam?.name || 'No Team'}</p>
            <h1 className="text-[28px] font-extrabold text-white truncate">{player.first_name} {player.last_name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {assignedJersey && <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">#{assignedJersey}</span>}
              {player.position && <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">{player.position}</span>}
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                player.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>{player.status === 'active' ? 'Active' : player.status || 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className={`${cardCls} border rounded-[14px] overflow-hidden`}>
        <div className={`flex border-b ${borderCls} overflow-x-auto`}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id ? 'border-lynx-sky text-lynx-sky' : `border-transparent ${mutedCls} hover:${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`
              }`}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ══════ REGISTRATION INFO ══════ */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${textCls}`}>Player Information</h3>
                  {!editingInfo && <EditBtn onClick={() => setEditingInfo(true)} />}
                </div>
                {editingInfo ? (
                  <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="First Name" value={infoForm.first_name} onChange={v => setInfoForm({ ...infoForm, first_name: v })} />
                      <FormField label="Last Name" value={infoForm.last_name} onChange={v => setInfoForm({ ...infoForm, last_name: v })} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField label="Date of Birth" value={infoForm.date_of_birth} onChange={v => setInfoForm({ ...infoForm, date_of_birth: v })} type="date" />
                      <FormField label="Gender" value={infoForm.gender} onChange={v => setInfoForm({ ...infoForm, gender: v })}
                        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'non-binary', label: 'Non-binary' }, { value: 'prefer_not_to_say', label: 'Prefer not to say' }]} />
                      <FormField label="Grade" value={infoForm.grade} onChange={v => setInfoForm({ ...infoForm, grade: v })}
                        options={['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField label="School" value={infoForm.school} onChange={v => setInfoForm({ ...infoForm, school: v })} placeholder="School name" />
                      <FormField label="Position" value={infoForm.position} onChange={v => setInfoForm({ ...infoForm, position: v })}
                        options={(SPORT_POSITIONS[sportName.toLowerCase()] || SPORT_POSITIONS.volleyball).map(p => ({ value: p, label: p }))} />
                      <FormField label="Experience" value={infoForm.experience_level} onChange={v => setInfoForm({ ...infoForm, experience_level: v })}
                        options={['Beginner', 'Intermediate', 'Advanced', 'Club/Travel']} />
                    </div>
                    <SaveCancelBtns onSave={savePlayerInfo} onCancel={() => setEditingInfo(false)} />
                  </div>
                ) : (
                  <div className={`${altBg} rounded-xl px-5`}>
                    <InfoRow label="Full Name" value={`${player.first_name} ${player.last_name}`} icon="👤" />
                    <InfoRow label="Date of Birth" value={player.date_of_birth ? new Date(player.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} icon="🎂" />
                    <InfoRow label="Gender" value={infoForm.gender ? infoForm.gender.charAt(0).toUpperCase() + infoForm.gender.slice(1).replace(/_/g, ' ') : null} icon="⚧" />
                    <InfoRow label="Grade" value={player.grade} icon="🎓" />
                    <InfoRow label="School" value={player.school} icon="🏫" />
                    <InfoRow label="Position" value={player.position} icon={seasonHistory[0]?.sportIcon || '🏐'} />
                    <InfoRow label="Experience" value={player.experience_level || player.experience} icon="📊" />
                  </div>
                )}
              </div>
              {/* Address */}
              {(infoForm.address || infoForm.city) && !editingInfo && (
                <div>
                  <h3 className={`text-lg font-bold ${textCls} mb-4`}>Address</h3>
                  <div className={`${altBg} rounded-xl px-5`}>
                    {infoForm.address && <InfoRow label="Street" value={infoForm.address} icon="📍" />}
                    <InfoRow label="City/State/Zip" value={[infoForm.city, infoForm.state, infoForm.zip].filter(Boolean).join(', ') || null} icon="🌐" />
                  </div>
                </div>
              )}
              {editingInfo && (
                <div>
                  <h3 className={`text-lg font-bold ${textCls} mb-4`}>Address</h3>
                  <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                    <FormField label="Street Address" value={infoForm.address} onChange={v => setInfoForm({ ...infoForm, address: v })} placeholder="123 Main St" />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField label="City" value={infoForm.city} onChange={v => setInfoForm({ ...infoForm, city: v })} placeholder="City" />
                      <FormField label="State" value={infoForm.state} onChange={v => setInfoForm({ ...infoForm, state: v })} placeholder="TX" />
                      <FormField label="Zip" value={infoForm.zip} onChange={v => setInfoForm({ ...infoForm, zip: v })} placeholder="75068" />
                    </div>
                  </div>
                </div>
              )}
              {/* Parent/Guardian */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${textCls}`}>Parent / Guardian</h3>
                  {!editingInfo && <EditBtn onClick={() => setEditingInfo(true)} />}
                </div>
                {editingInfo ? (
                  <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                    <FormField label="Parent Name" value={infoForm.parent_name} onChange={v => setInfoForm({ ...infoForm, parent_name: v })} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Email" value={infoForm.parent_email} onChange={v => setInfoForm({ ...infoForm, parent_email: v })} type="email" />
                      <FormField label="Phone" value={infoForm.parent_phone} onChange={v => setInfoForm({ ...infoForm, parent_phone: v })} type="tel" />
                    </div>
                  </div>
                ) : (
                  <div className={`${altBg} rounded-xl px-5`}>
                    <InfoRow label="Parent Name" value={infoForm.parent_name} icon="👤" />
                    <InfoRow label="Email" value={infoForm.parent_email} icon="✉️" />
                    <InfoRow label="Phone" value={infoForm.parent_phone} icon="📱" />
                  </div>
                )}
              </div>
              {(infoForm.parent2_name || infoForm.parent2_email || editingInfo) && (
                <div>
                  <h3 className={`text-lg font-bold ${textCls} mb-4`}>Parent / Guardian 2</h3>
                  {editingInfo ? (
                    <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                      <FormField label="Parent 2 Name" value={infoForm.parent2_name} onChange={v => setInfoForm({ ...infoForm, parent2_name: v })} placeholder="Optional" />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label="Email" value={infoForm.parent2_email} onChange={v => setInfoForm({ ...infoForm, parent2_email: v })} type="email" placeholder="Optional" />
                        <FormField label="Phone" value={infoForm.parent2_phone} onChange={v => setInfoForm({ ...infoForm, parent2_phone: v })} type="tel" placeholder="Optional" />
                      </div>
                    </div>
                  ) : (
                    <div className={`${altBg} rounded-xl px-5`}>
                      <InfoRow label="Parent 2 Name" value={infoForm.parent2_name} icon="👤" />
                      <InfoRow label="Email" value={infoForm.parent2_email} icon="✉️" />
                      <InfoRow label="Phone" value={infoForm.parent2_phone} icon="📱" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══════ UNIFORM ══════ */}
          {activeTab === 'jersey' && (() => {
            const uniformConfig = getUniformConfig(sportName)
            const topLabel = uniformConfig.top
            const bottomLabel = uniformConfig.bottom
            const extras = uniformConfig.extras || []
            const sizePieces = [{ label: topLabel, value: player.uniform_size_jersey }]
            if (bottomLabel) sizePieces.push({ label: bottomLabel, value: player.uniform_size_shorts })
            extras.forEach(extra => { const key = extra.toLowerCase().replace(/\s+/g, '_'); sizePieces.push({ label: extra, value: player.uniform_sizes_extra?.[key] }) })
            const gridCols = (3 + sizePieces.length) <= 4 ? 'grid-cols-4' : (3 + sizePieces.length) <= 5 ? 'grid-cols-5' : 'grid-cols-4'

            return (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-bold ${textCls} mb-4`}>Current {topLabel}</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-28 h-32 rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden shadow-lg" style={{ backgroundColor: teamColor }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 rounded-b-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
                      <span className="text-5xl font-black mt-2">{assignedJersey || '?'}</span>
                      <span className="text-xs opacity-80 mt-1 font-medium">{primaryTeam?.name}</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`text-sm ${textCls}`}><span className="font-semibold">Number:</span> {assignedJersey ? `#${assignedJersey}` : 'Not assigned yet'}</div>
                      {sizePieces.map(piece => (
                        <div key={piece.label} className={`text-sm ${textCls}`}><span className="font-semibold">{piece.label} Size:</span> {piece.value || 'Not set'}</div>
                      ))}
                      <div className={`text-xs ${mutedCls}`}>{assignedJersey ? 'Assigned by admin' : 'Waiting for admin to assign'}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${textCls}`}>Your Preferences</h3>
                    {!editingJersey && <EditBtn onClick={() => setEditingJersey(true)} />}
                  </div>
                  {editingJersey ? (
                    <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                      <p className={`text-sm ${mutedCls}`}>Set your preferred numbers and uniform sizes.</p>
                      <div className="grid grid-cols-3 gap-4">
                        {[{ key: 'pref1', label: '1st Choice' }, { key: 'pref2', label: '2nd Choice' }, { key: 'pref3', label: '3rd Choice' }].map(({ key, label }) => (
                          <div key={key}>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{label}</label>
                            <input type="number" min="0" max="99" value={jerseyPrefs[key]}
                              onChange={e => setJerseyPrefs({ ...jerseyPrefs, [key]: e.target.value })} placeholder="0-99"
                              className={`${inputCls} text-center text-3xl font-bold`} />
                          </div>
                        ))}
                      </div>
                      <div className={`grid ${bottomLabel ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <div>
                          <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{topLabel} Size</label>
                          <select value={jerseyPrefs.size} onChange={e => setJerseyPrefs({ ...jerseyPrefs, size: e.target.value })} className={inputCls}>
                            <option value="">Select size...</option>
                            {getSizeOptionsForPiece(topLabel).map(group => (
                              <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                            ))}
                          </select>
                        </div>
                        {bottomLabel && (
                          <div>
                            <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{bottomLabel} Size</label>
                            <select value={jerseyPrefs.bottomSize} onChange={e => setJerseyPrefs({ ...jerseyPrefs, bottomSize: e.target.value })} className={inputCls}>
                              <option value="">Select size...</option>
                              {getSizeOptionsForPiece(bottomLabel).map(group => (
                                <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      {extras.length > 0 && (
                        <div className={`grid ${extras.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                          {extras.map(extra => { const key = extra.toLowerCase().replace(/\s+/g, '_'); return (
                            <div key={key}>
                              <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>{extra} Size</label>
                              <select value={jerseyPrefs.extras?.[key] || ''} onChange={e => setJerseyPrefs({ ...jerseyPrefs, extras: { ...jerseyPrefs.extras, [key]: e.target.value } })} className={inputCls}>
                                <option value="">Select size...</option>
                                {getSizeOptionsForPiece(extra).map(group => (
                                  <optgroup key={group.group} label={group.group}>{group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</optgroup>
                                ))}
                              </select>
                            </div>
                          )})}
                        </div>
                      )}
                      <SaveCancelBtns onSave={saveJerseyPreferences} onCancel={() => setEditingJersey(false)} />
                    </div>
                  ) : (
                    <div className={`${altBg} rounded-xl p-5`}>
                      <div className={`grid ${gridCols} gap-4 text-center`}>
                        {['1st Choice', '2nd Choice', '3rd Choice'].map((label, i) => (
                          <div key={label}>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{label}</p>
                            <p className={`text-4xl font-black ${textCls}`}>{[player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3][i] || '—'}</p>
                          </div>
                        ))}
                        {sizePieces.map(piece => (
                          <div key={piece.label}>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1`}>{piece.label}</p>
                            <p className={`text-2xl font-black ${textCls}`}>{piece.value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ══════ MEDICAL & EMERGENCY ══════ */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${textCls}`}>Emergency Contact</h3>
                  {!editingEmergency && <EditBtn onClick={() => setEditingEmergency(true)} />}
                </div>
                {editingEmergency ? (
                  <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label="Contact Name" value={emergencyForm.name} onChange={v => setEmergencyForm({ ...emergencyForm, name: v })} placeholder="Full name" />
                      <FormField label="Phone Number" value={emergencyForm.phone} onChange={v => setEmergencyForm({ ...emergencyForm, phone: v })} type="tel" placeholder="(555) 123-4567" />
                      <FormField label="Relationship" value={emergencyForm.relation} onChange={v => setEmergencyForm({ ...emergencyForm, relation: v })}
                        options={['Mother', 'Father', 'Grandparent', 'Aunt/Uncle', 'Sibling', 'Other']} />
                    </div>
                    <SaveCancelBtns onSave={saveEmergencyContact} onCancel={() => setEditingEmergency(false)} />
                  </div>
                ) : (
                  <div className={`${altBg} rounded-xl px-5`}>
                    <InfoRow label="Name" value={player.emergency_contact_name || player.emergency_name} icon="👤" />
                    <InfoRow label="Phone" value={player.emergency_contact_phone || player.emergency_phone} icon="📱" />
                    <InfoRow label="Relationship" value={player.emergency_contact_relation || player.emergency_relation} icon="🤝" />
                  </div>
                )}
                {!(player.emergency_contact_name || player.emergency_name) && !editingEmergency && (
                  <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                    <span className="text-amber-500 text-sm">⚠️</span>
                    <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>No emergency contact on file. Please add one.</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${textCls}`}>Medical Information</h3>
                  {!editingMedical && <EditBtn onClick={() => setEditingMedical(true)} />}
                </div>
                {editingMedical ? (
                  <div className={`${altBg} rounded-xl p-5 space-y-4`}>
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>Medical Conditions</label>
                      <textarea value={medicalForm.conditions} onChange={e => setMedicalForm({ ...medicalForm, conditions: e.target.value })}
                        placeholder="Asthma, diabetes, seizures, etc. (or 'None')"
                        rows={3} className={`${inputCls} resize-none`} />
                    </div>
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider ${mutedCls} mb-1.5`}>Allergies</label>
                      <textarea value={medicalForm.allergies} onChange={e => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                        placeholder="Food, medication, or environmental allergies (or 'None')"
                        rows={3} className={`${inputCls} resize-none`} />
                    </div>
                    <SaveCancelBtns onSave={saveMedicalInfo} onCancel={() => setEditingMedical(false)} />
                  </div>
                ) : (
                  <div className={`${altBg} rounded-xl px-5`}>
                    <InfoRow label="Conditions" value={player.medical_conditions || player.medical_notes || 'None reported'} icon="💊" />
                    <InfoRow label="Allergies" value={player.allergies || 'None reported'} icon="⚠️" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════ WAIVERS ══════ */}
          {activeTab === 'waivers' && (
            <WaiversTab player={player} organization={organization} isDark={isDark} showToast={showToast} teamColor={teamColor} />
          )}

          {/* ══════ SEASON HISTORY ══════ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className={`text-lg font-bold ${textCls}`}>Season History</h3>
              {seasonHistory.length > 0 ? (
                <div className="space-y-3">
                  {seasonHistory.map((season, i) => (
                    <div key={i} className={`${altBg} rounded-xl p-5 flex items-center gap-4`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-white font-bold shadow-md" style={{ backgroundColor: season.teamColor }}>
                        {season.sportIcon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${textCls}`}>{season.seasonName}</div>
                        <div className={`text-sm ${mutedCls}`}>{season.teamName}{season.jerseyNumber ? ` • #${season.jerseyNumber}` : ''}</div>
                      </div>
                      <div className={`text-xs ${mutedCls} text-right`}>
                        {season.startDate ? new Date(season.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                        {season.endDate ? ` – ${new Date(season.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' – Present'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${altBg} rounded-xl p-8 text-center`}>
                  <span className="text-5xl">📋</span>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} mt-3 font-medium`}>No season history yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { PlayerProfilePage }
