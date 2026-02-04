import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Edit, Save, X, Shirt, Check, ChevronLeft, User, Phone, Mail, 
  AlertTriangle, FileText, Heart, Shield
} from '../../constants/icons'

function PlayerProfilePage({ playerId, roleContext, showToast, onNavigate }) {
  const { organization } = useAuth()
  const tc = useThemeClasses()
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
  const [jerseyPrefs, setJerseyPrefs] = useState({ pref1: '', pref2: '', pref3: '', size: '' })
  const [medicalForm, setMedicalForm] = useState({ conditions: '', allergies: '' })
  const [emergencyForm, setEmergencyForm] = useState({ name: '', phone: '', relation: '' })

  // Season history
  const [seasonHistory, setSeasonHistory] = useState([])

  useEffect(() => {
    loadPlayerData()
  }, [playerId])

  async function loadPlayerData() {
    setLoading(true)
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (playerError || !playerData) {
        console.error('Player query error:', playerError)
        setLoading(false)
        return
      }

      // Get team_players with team + season info
      const { data: teamPlayersData } = await supabase
        .from('team_players')
        .select('id, team_id, jersey_number, teams (id, name, color, season_id, seasons(id, name, start_date, end_date, sports(name, icon)))')
        .eq('player_id', playerId)

      // Get season info
      let seasonData = null
      if (playerData.season_id) {
        const { data: season } = await supabase
          .from('seasons')
          .select('id, name, start_date, end_date, sports(name, icon)')
          .eq('id', playerData.season_id)
          .single()
        seasonData = season
      }

      const enrichedPlayer = {
        ...playerData,
        seasons: seasonData,
        team_players: teamPlayersData || []
      }

      setPlayer(enrichedPlayer)
      setTeams((teamPlayersData || []).map(tp => ({ ...tp.teams, jersey_number: tp.jersey_number })).filter(Boolean))
      
      // Initialize form states
      setInfoForm({
        first_name: playerData.first_name || '',
        last_name: playerData.last_name || '',
        date_of_birth: playerData.date_of_birth || '',
        grade: playerData.grade || '',
        school: playerData.school || '',
        position: playerData.position || '',
        experience_level: playerData.experience_level || playerData.experience || '',
        parent_name: playerData.parent_name || '',
        parent_email: playerData.parent_email || '',
        parent_phone: playerData.parent_phone || '',
      })
      setJerseyPrefs({
        pref1: playerData.jersey_pref_1 || '',
        pref2: playerData.jersey_pref_2 || '',
        pref3: playerData.jersey_pref_3 || '',
        size: playerData.uniform_size_jersey || ''
      })
      setMedicalForm({
        conditions: playerData.medical_conditions || playerData.medical_notes || '',
        allergies: playerData.allergies || ''
      })
      setEmergencyForm({
        name: playerData.emergency_contact_name || playerData.emergency_name || '',
        phone: playerData.emergency_contact_phone || playerData.emergency_phone || '',
        relation: playerData.emergency_contact_relation || playerData.emergency_relation || ''
      })

      // Build season history from team_players
      const history = (teamPlayersData || []).map(tp => ({
        seasonName: tp.teams?.seasons?.name || 'Unknown Season',
        teamName: tp.teams?.name || 'Unknown Team',
        teamColor: tp.teams?.color || '#666',
        sportIcon: tp.teams?.seasons?.sports?.icon || '🏐',
        sportName: tp.teams?.seasons?.sports?.name || 'Volleyball',
        jerseyNumber: tp.jersey_number,
        startDate: tp.teams?.seasons?.start_date,
        endDate: tp.teams?.seasons?.end_date,
      }))
      setSeasonHistory(history)

    } catch (err) {
      console.error('Error loading player:', err)
    }
    setLoading(false)
  }

  // Save handlers
  async function savePlayerInfo() {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          first_name: infoForm.first_name,
          last_name: infoForm.last_name,
          date_of_birth: infoForm.date_of_birth || null,
          grade: infoForm.grade || null,
          school: infoForm.school || null,
          position: infoForm.position || null,
          experience_level: infoForm.experience_level || null,
          parent_name: infoForm.parent_name || null,
          parent_email: infoForm.parent_email || null,
          parent_phone: infoForm.parent_phone || null,
        })
        .eq('id', playerId)
      if (error) throw error
      showToast('Player info updated!', 'success')
      setEditingInfo(false)
      loadPlayerData()
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error')
    }
  }

  async function saveJerseyPreferences() {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          jersey_pref_1: jerseyPrefs.pref1 ? parseInt(jerseyPrefs.pref1) : null,
          jersey_pref_2: jerseyPrefs.pref2 ? parseInt(jerseyPrefs.pref2) : null,
          jersey_pref_3: jerseyPrefs.pref3 ? parseInt(jerseyPrefs.pref3) : null,
          uniform_size_jersey: jerseyPrefs.size || null
        })
        .eq('id', playerId)
      if (error) throw error
      showToast('Jersey preferences saved!', 'success')
      setEditingJersey(false)
      loadPlayerData()
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error')
    }
  }

  async function saveMedicalInfo() {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          medical_conditions: medicalForm.conditions || null,
          allergies: medicalForm.allergies || null,
        })
        .eq('id', playerId)
      if (error) throw error
      showToast('Medical info updated!', 'success')
      setEditingMedical(false)
      loadPlayerData()
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error')
    }
  }

  async function saveEmergencyContact() {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          emergency_contact_name: emergencyForm.name || null,
          emergency_contact_phone: emergencyForm.phone || null,
          emergency_contact_relation: emergencyForm.relation || null,
        })
        .eq('id', playerId)
      if (error) throw error
      showToast('Emergency contact updated!', 'success')
      setEditingEmergency(false)
      loadPlayerData()
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl">😕</span>
        <h2 className={`text-xl font-bold ${tc.text} mt-4`}>Player Not Found</h2>
      </div>
    )
  }

  const primaryTeamPlayer = player.team_players?.[0]
  const primaryTeam = teams[0]
  const teamColor = primaryTeam?.color || '#EAB308'
  const assignedJersey = primaryTeamPlayer?.jersey_number

  // Helper for info rows
  const InfoRow = ({ label, value, icon }) => (
    <div className={`flex items-center gap-3 py-3 border-b last:border-b-0 ${tc.border}`}>
      {icon && <span className={`text-sm ${tc.textMuted}`}>{icon}</span>}
      <span className={`text-sm ${tc.textMuted} w-32 flex-shrink-0`}>{label}</span>
      <span className={`text-sm font-medium ${tc.text}`}>{value || '—'}</span>
    </div>
  )

  const EditBtn = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition">
      <Edit className="w-3.5 h-3.5" /> Edit
    </button>
  )

  const SaveCancelBtns = ({ onSave, onCancel }) => (
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className={`flex-1 py-2.5 rounded-xl ${tc.cardBg} border ${tc.border} ${tc.text} font-medium text-sm hover:opacity-80 transition`}>
        Cancel
      </button>
      <button onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold text-sm hover:opacity-90 transition">
        Save Changes
      </button>
    </div>
  )

  const FormField = ({ label, value, onChange, type = 'text', placeholder, options }) => (
    <div>
      <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-sm`}>
          <option value="">Select...</option>
          {options.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full px-3 py-2.5 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-sm`} />
      )}
    </div>
  )

  const tabs = [
    { id: 'info', label: 'Registration', icon: '📋' },
    { id: 'jersey', label: 'Jersey', icon: '👕' },
    { id: 'medical', label: 'Medical & Emergency', icon: '🏥' },
    { id: 'waivers', label: 'Waivers', icon: '📄' },
    { id: 'history', label: 'Season History', icon: '📅' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Compact Header */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
        <div className="flex items-center gap-5 p-5">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.first_name} className="w-20 h-20 rounded-2xl object-cover border-2 shadow-md" style={{ borderColor: teamColor }} />
          ) : (
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 shadow-md" style={{ backgroundColor: `${teamColor}20`, borderColor: teamColor, color: teamColor }}>
              {player.first_name?.[0]}{player.last_name?.[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${tc.text}`}>{player.first_name} {player.last_name}</h1>
            <div className={`flex items-center gap-2 mt-1 ${tc.textMuted} text-sm`}>
              {primaryTeam && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: teamColor }}>
                  {primaryTeam.name}
                </span>
              )}
              {player.position && <span>• {player.position}</span>}
              {assignedJersey && <span>• #{assignedJersey}</span>}
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
            player.status === 'active' 
              ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200') 
              : (isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200')
          }`}>
            <span className={`w-2 h-2 rounded-full ${player.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {player.status === 'active' ? 'Active' : player.status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl overflow-hidden`}>
        <div className={`flex border-b ${tc.border} overflow-x-auto`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
                  : `border-transparent ${tc.textMuted} hover:${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`
              }`}
              style={activeTab === tab.id ? { borderColor: teamColor, color: teamColor } : {}}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ══════ REGISTRATION INFO ══════ */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>👤 Player Information</h3>
                  {!editingInfo && <EditBtn onClick={() => setEditingInfo(true)} />}
                </div>

                {editingInfo ? (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5 space-y-4`}>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="First Name" value={infoForm.first_name} onChange={v => setInfoForm({ ...infoForm, first_name: v })} />
                      <FormField label="Last Name" value={infoForm.last_name} onChange={v => setInfoForm({ ...infoForm, last_name: v })} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField label="Date of Birth" value={infoForm.date_of_birth} onChange={v => setInfoForm({ ...infoForm, date_of_birth: v })} type="date" />
                      <FormField label="Grade" value={infoForm.grade} onChange={v => setInfoForm({ ...infoForm, grade: v })} 
                        options={['K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']} />
                      <FormField label="School" value={infoForm.school} onChange={v => setInfoForm({ ...infoForm, school: v })} placeholder="School name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Position" value={infoForm.position} onChange={v => setInfoForm({ ...infoForm, position: v })} 
                        options={[
                          { value: 'Outside Hitter', label: 'Outside Hitter' },
                          { value: 'Middle Blocker', label: 'Middle Blocker' },
                          { value: 'Setter', label: 'Setter' },
                          { value: 'Libero', label: 'Libero' },
                          { value: 'Opposite', label: 'Opposite' },
                          { value: 'Defensive Specialist', label: 'Defensive Specialist' },
                        ]} />
                      <FormField label="Experience Level" value={infoForm.experience_level} onChange={v => setInfoForm({ ...infoForm, experience_level: v })}
                        options={['Beginner', 'Intermediate', 'Advanced', 'Club/Travel']} />
                    </div>
                    <SaveCancelBtns onSave={savePlayerInfo} onCancel={() => setEditingInfo(false)} />
                  </div>
                ) : (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl px-5`}>
                    <InfoRow label="Full Name" value={`${player.first_name} ${player.last_name}`} icon="👤" />
                    <InfoRow label="Date of Birth" value={player.date_of_birth ? new Date(player.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} icon="🎂" />
                    <InfoRow label="Grade" value={player.grade} icon="🎓" />
                    <InfoRow label="School" value={player.school} icon="🏫" />
                    <InfoRow label="Position" value={player.position} icon="🏐" />
                    <InfoRow label="Experience" value={player.experience_level || player.experience} icon="📊" />
                    <InfoRow label="Registered" value={player.created_at ? new Date(player.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} icon="📅" />
                  </div>
                )}
              </div>

              {/* Parent / Guardian Info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>👨‍👩‍👧 Parent / Guardian</h3>
                  {!editingInfo && <EditBtn onClick={() => setEditingInfo(true)} />}
                </div>
                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl px-5`}>
                  <InfoRow label="Parent Name" value={player.parent_name} icon="👤" />
                  <InfoRow label="Email" value={player.parent_email} icon="✉️" />
                  <InfoRow label="Phone" value={player.parent_phone} icon="📱" />
                </div>
              </div>
            </div>
          )}

          {/* ══════ JERSEY ══════ */}
          {activeTab === 'jersey' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2 mb-4`}>👕 Current Jersey</h3>
                <div className="flex items-center gap-6">
                  <div className="w-28 h-32 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden shadow-lg" style={{ backgroundColor: teamColor }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 rounded-b-full" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }} />
                    <span className="text-5xl font-black mt-2">{assignedJersey || '?'}</span>
                    <span className="text-xs opacity-80 mt-1 font-medium">{primaryTeam?.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-sm ${tc.text}`}><span className="font-semibold">Number:</span> {assignedJersey ? `#${assignedJersey}` : 'Not assigned yet'}</div>
                    <div className={`text-sm ${tc.text}`}><span className="font-semibold">Size:</span> {player.uniform_size_jersey || 'Not set'}</div>
                    <div className={`text-xs ${tc.textMuted}`}>
                      {assignedJersey ? '✅ Assigned by admin' : '⏳ Waiting for admin to assign'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>⭐ Your Preferences</h3>
                  {!editingJersey && <EditBtn onClick={() => setEditingJersey(true)} />}
                </div>

                {editingJersey ? (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5 space-y-4`}>
                    <p className={`text-sm ${tc.textMuted}`}>Set your preferred jersey numbers. The admin will try to honor your choices!</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>1st Choice</label>
                        <input type="number" min="1" max="99" value={jerseyPrefs.pref1} onChange={e => setJerseyPrefs({ ...jerseyPrefs, pref1: e.target.value })} placeholder="1-99"
                          className={`w-full px-3 py-3 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-center text-2xl font-bold`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>2nd Choice</label>
                        <input type="number" min="1" max="99" value={jerseyPrefs.pref2} onChange={e => setJerseyPrefs({ ...jerseyPrefs, pref2: e.target.value })} placeholder="1-99"
                          className={`w-full px-3 py-3 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-center text-2xl font-bold`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>3rd Choice</label>
                        <input type="number" min="1" max="99" value={jerseyPrefs.pref3} onChange={e => setJerseyPrefs({ ...jerseyPrefs, pref3: e.target.value })} placeholder="1-99"
                          className={`w-full px-3 py-3 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-center text-2xl font-bold`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>Jersey Size</label>
                      <select value={jerseyPrefs.size} onChange={e => setJerseyPrefs({ ...jerseyPrefs, size: e.target.value })}
                        className={`w-full px-3 py-2.5 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-sm`}>
                        <option value="">Select size...</option>
                        <optgroup label="Youth">
                          <option value="YXS">Youth XS</option><option value="YS">Youth S</option><option value="YM">Youth M</option>
                          <option value="YL">Youth L</option><option value="YXL">Youth XL</option>
                        </optgroup>
                        <optgroup label="Adult">
                          <option value="AS">Adult S</option><option value="AM">Adult M</option><option value="AL">Adult L</option>
                          <option value="AXL">Adult XL</option><option value="A2XL">Adult 2XL</option>
                        </optgroup>
                      </select>
                    </div>
                    <SaveCancelBtns onSave={saveJerseyPreferences} onCancel={() => setEditingJersey(false)} />
                  </div>
                ) : (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5`}>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className={`text-xs font-semibold ${tc.textMuted} mb-1`}>1st Choice</p>
                        <p className={`text-3xl font-black ${tc.text}`}>{player.jersey_pref_1 || '—'}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${tc.textMuted} mb-1`}>2nd Choice</p>
                        <p className={`text-3xl font-black ${tc.text}`}>{player.jersey_pref_2 || '—'}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${tc.textMuted} mb-1`}>3rd Choice</p>
                        <p className={`text-3xl font-black ${tc.text}`}>{player.jersey_pref_3 || '—'}</p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${tc.textMuted} mb-1`}>Size</p>
                        <p className={`text-3xl font-black ${tc.text}`}>{player.uniform_size_jersey || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════ MEDICAL & EMERGENCY ══════ */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>🚨 Emergency Contact</h3>
                  {!editingEmergency && <EditBtn onClick={() => setEditingEmergency(true)} />}
                </div>

                {editingEmergency ? (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5 space-y-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label="Contact Name" value={emergencyForm.name} onChange={v => setEmergencyForm({ ...emergencyForm, name: v })} placeholder="Full name" />
                      <FormField label="Phone Number" value={emergencyForm.phone} onChange={v => setEmergencyForm({ ...emergencyForm, phone: v })} type="tel" placeholder="(555) 123-4567" />
                      <FormField label="Relationship" value={emergencyForm.relation} onChange={v => setEmergencyForm({ ...emergencyForm, relation: v })}
                        options={['Mother', 'Father', 'Grandparent', 'Aunt/Uncle', 'Sibling', 'Other']} />
                    </div>
                    <SaveCancelBtns onSave={saveEmergencyContact} onCancel={() => setEditingEmergency(false)} />
                  </div>
                ) : (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl px-5`}>
                    <InfoRow label="Name" value={player.emergency_contact_name || player.emergency_name} icon="👤" />
                    <InfoRow label="Phone" value={player.emergency_contact_phone || player.emergency_phone} icon="📱" />
                    <InfoRow label="Relationship" value={player.emergency_contact_relation || player.emergency_relation} icon="🤝" />
                  </div>
                )}

                {!(player.emergency_contact_name || player.emergency_name) && !editingEmergency && (
                  <div className={`mt-3 flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                    <span className="text-amber-500 text-sm">⚠️</span>
                    <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>No emergency contact on file. Please add one for your child's safety.</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>🏥 Medical Information</h3>
                  {!editingMedical && <EditBtn onClick={() => setEditingMedical(true)} />}
                </div>

                {editingMedical ? (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5 space-y-4`}>
                    <div>
                      <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>Medical Conditions</label>
                      <textarea value={medicalForm.conditions} onChange={e => setMedicalForm({ ...medicalForm, conditions: e.target.value })}
                        placeholder="Asthma, diabetes, seizures, etc. (or 'None')"
                        rows={3} className={`w-full px-3 py-2.5 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-sm resize-none`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold ${tc.textMuted} mb-1.5`}>Allergies</label>
                      <textarea value={medicalForm.allergies} onChange={e => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                        placeholder="Food, medication, or environmental allergies (or 'None')"
                        rows={3} className={`w-full px-3 py-2.5 rounded-xl border ${tc.border} ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} text-sm resize-none`} />
                    </div>
                    <SaveCancelBtns onSave={saveMedicalInfo} onCancel={() => setEditingMedical(false)} />
                  </div>
                ) : (
                  <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl px-5`}>
                    <InfoRow label="Conditions" value={player.medical_conditions || player.medical_notes || 'None reported'} icon="💊" />
                    <InfoRow label="Allergies" value={player.allergies || 'None reported'} icon="⚠️" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════ WAIVERS ══════ */}
          {activeTab === 'waivers' && (
            <div className="space-y-6">
              <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>📄 Waiver Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Liability Waiver', signed: player.waiver_liability, icon: '🛡️' },
                  { label: 'Photo Release', signed: player.waiver_photo, icon: '📸' },
                  { label: 'Code of Conduct', signed: player.waiver_conduct, icon: '🤝' },
                ].map(waiver => (
                  <div key={waiver.label} className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5 text-center`}>
                    <span className="text-3xl">{waiver.icon}</span>
                    <p className={`font-semibold ${tc.text} mt-2`}>{waiver.label}</p>
                    <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                      waiver.signed 
                        ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') 
                        : (isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600')
                    }`}>
                      {waiver.signed ? '✅ Signed' : '❌ Not Signed'}
                    </div>
                  </div>
                ))}
              </div>

              {player.waiver_signed && (
                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5`}>
                  <div className={`text-sm ${tc.textMuted}`}>
                    <p>✍️ <strong>Signed by:</strong> {player.waiver_signed_by || 'N/A'}</p>
                    {player.waiver_signed_date && (
                      <p className="mt-1">📅 <strong>Date:</strong> {new Date(player.waiver_signed_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    )}
                  </div>
                </div>
              )}

              {!player.waiver_signed && (
                <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Waivers incomplete</p>
                    <p className={`text-sm ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>Please contact the league admin to complete required waivers.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════ SEASON HISTORY ══════ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className={`text-base font-bold ${tc.text} flex items-center gap-2`}>📅 Season History</h3>
              
              {seasonHistory.length > 0 ? (
                <div className="space-y-3">
                  {seasonHistory.map((season, i) => (
                    <div key={i} className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-5 flex items-center gap-4`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-white font-bold shadow-md" style={{ backgroundColor: season.teamColor }}>
                        {season.sportIcon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${tc.text}`}>{season.seasonName}</div>
                        <div className={`text-sm ${tc.textMuted}`}>
                          {season.teamName}
                          {season.jerseyNumber ? ` • #${season.jerseyNumber}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${tc.textMuted}`}>
                          {season.startDate ? new Date(season.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                          {season.endDate ? ` – ${new Date(season.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' – Present'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-2xl p-8 text-center`}>
                  <span className="text-5xl">📋</span>
                  <p className={`${tc.textSecondary} mt-3 font-medium`}>No season history yet</p>
                  <p className={`text-sm ${tc.textMuted} mt-1`}>Past seasons will appear here once completed.</p>
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
