// =============================================================================
// PlayerProfilePage - Two-column layout: photo gallery left, name banner + tabs right
// Preserves ALL Supabase queries and save handlers from the original
// =============================================================================

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Camera } from 'lucide-react'
import { getUniformConfig } from './PlayerProfileConstants'
import WaiversTab from './PlayerProfileWaivers'
import PlayerProfileInfoTab from './PlayerProfileInfoTab'
import PlayerProfileUniformTab from './PlayerProfileUniformTab'
import PlayerProfileMedicalTab from './PlayerProfileMedicalTab'
import PlayerProfileHistoryTab from './PlayerProfileHistoryTab'
import PlayerProfileDevelopmentTab from './PlayerProfileDevelopmentTab'

function PlayerProfilePage({ playerId, roleContext, showToast, onNavigate, activeView }) {
  const { organization } = useAuth()
  const { isDark } = useTheme()

  const [player, setPlayer] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [uploading, setUploading] = useState(false)

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
  const [sportName, setSportName] = useState('')
  const [registrationData, setRegistrationData] = useState(null)

  const fileInputRef = useRef(null)

  // === DATA LOADING (preserved exactly) ===
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
        teamColor: tp.teams?.color || '#666', sportIcon: tp.teams?.seasons?.sports?.icon || '',
        sportName: tp.teams?.seasons?.sports?.name || 'Volleyball', jerseyNumber: tp.jersey_number,
        startDate: tp.teams?.seasons?.start_date, endDate: tp.teams?.seasons?.end_date,
      }))
      setSeasonHistory(history)
      setSportName(teamPlayersData?.[0]?.teams?.seasons?.sports?.name || seasonData?.sports?.name || '')
    } catch (err) { console.error('Error loading player:', err) }
    setLoading(false)
  }

  // === SAVE HANDLERS (preserved exactly) ===
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

  // === PHOTO UPLOAD ===
  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `player-photos/${playerId}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      await supabase.from('players').update({ photo_url: publicUrl }).eq('id', playerId)
      showToast?.('Photo updated!', 'success')
      loadPlayerData()
    } catch (err) {
      showToast?.(`Upload failed: ${err.message}`, 'error')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // === LOADING / ERROR ===
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--v2-topbar-height, 56px))' }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!player) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - var(--v2-topbar-height, 56px))' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">?</span>
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Player Not Found</h2>
        </div>
      </div>
    )
  }

  // === DERIVED ===
  const primaryTeamPlayer = player.team_players?.[0]
  const primaryTeam = teams[0]
  const teamColor = primaryTeam?.color || '#EAB308'
  const assignedJersey = primaryTeamPlayer?.jersey_number

  const tabs = [
    { id: 'info', label: 'Registration', icon: '' },
    { id: 'jersey', label: 'Uniform', icon: '' },
    { id: 'medical', label: 'Medical', icon: '' },
    { id: 'waivers', label: 'Waivers', icon: '' },
    { id: 'development', label: 'Development', icon: '' },
    { id: 'history', label: 'History', icon: '' },
  ]

  // === RENDER — Two-column layout ===
  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - var(--v2-topbar-height, 56px))', fontFamily: 'var(--v2-font, inherit)' }}>

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* LEFT COLUMN — Photo Gallery */}
      <div className="w-[460px] flex-shrink-0 flex flex-col p-5 gap-4">

        {/* Primary Photo */}
        <div
          className={`flex-1 relative rounded-[14px] overflow-hidden group cursor-pointer ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.first_name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                <Camera className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Add a player photo</p>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {uploading ? 'Uploading...' : player.photo_url ? 'Change Photo' : 'Upload Photo'}
            </span>
          </div>
        </div>

        {/* Gallery Slots (placeholder — gallery_photos column doesn't exist yet) */}
        <div className="flex gap-3">
          {[0, 1, 2].map(idx => (
            <div
              key={idx}
              className={`flex-1 aspect-square rounded-[10px] overflow-hidden cursor-pointer group relative ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}
              onClick={() => showToast?.('Gallery photos coming soon!', 'info')}
            >
              <div className="flex items-center justify-center h-full">
                <span className={`text-2xl ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>+</span>
              </div>
            </div>
          ))}
        </div>

        <p className={`text-xs text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Click photo to change</p>
      </div>

      {/* RIGHT COLUMN — Name Banner + Tabs */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Name Banner — navy gradient */}
        <div className="rounded-[14px] m-5 mb-0 p-6 overflow-hidden relative" style={{ background: 'linear-gradient(90deg, #0B1628, #162D50)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4BB9EC]">{primaryTeam?.name || 'No Team'}</p>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mt-1" style={{ letterSpacing: '-0.03em' }}>
              {player.first_name?.toUpperCase()}
            </h1>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none" style={{ letterSpacing: '-0.03em' }}>
              {player.last_name?.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {assignedJersey && <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/70">#{assignedJersey}</span>}
              {player.position && <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/70">{player.position}</span>}
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                player.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>{player.status === 'active' ? 'Active' : player.status || 'Pending'}</span>
              <button
                onClick={() => onNavigate?.(`player-${playerId}`)}
                className="ml-auto px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
              >
                View Player Card &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className={`mx-5 mt-4 flex border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id ? 'border-[#4BB9EC] text-[#4BB9EC]' : 'border-transparent text-slate-400 hover:text-slate-500'
              }`}>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content — scrollable within this container */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'info' && (
            <PlayerProfileInfoTab
              player={player} infoForm={infoForm} setInfoForm={setInfoForm}
              editingInfo={editingInfo} setEditingInfo={setEditingInfo}
              savePlayerInfo={savePlayerInfo} sportName={sportName}
              seasonHistory={seasonHistory} isDark={isDark}
              emergencyForm={emergencyForm} setEmergencyForm={setEmergencyForm}
              editingEmergency={editingEmergency} setEditingEmergency={setEditingEmergency}
              saveEmergencyContact={saveEmergencyContact}
            />
          )}

          {activeTab === 'jersey' && (
            <PlayerProfileUniformTab
              player={player} jerseyPrefs={jerseyPrefs} setJerseyPrefs={setJerseyPrefs}
              editingJersey={editingJersey} setEditingJersey={setEditingJersey}
              saveJerseyPreferences={saveJerseyPreferences} sportName={sportName}
              primaryTeam={primaryTeam} assignedJersey={assignedJersey}
              teamColor={teamColor} isDark={isDark}
            />
          )}

          {activeTab === 'medical' && (
            <PlayerProfileMedicalTab
              player={player} medicalForm={medicalForm} setMedicalForm={setMedicalForm}
              editingMedical={editingMedical} setEditingMedical={setEditingMedical}
              saveMedicalInfo={saveMedicalInfo} isDark={isDark}
            />
          )}

          {activeTab === 'waivers' && (
            <WaiversTab player={player} organization={organization} isDark={isDark} showToast={showToast} teamColor={teamColor} />
          )}

          {activeTab === 'development' && (
            <PlayerProfileDevelopmentTab player={player} isDark={isDark} showToast={showToast} activeView={activeView} />
          )}

          {activeTab === 'history' && (
            <PlayerProfileHistoryTab seasonHistory={seasonHistory} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  )
}

export { PlayerProfilePage }
