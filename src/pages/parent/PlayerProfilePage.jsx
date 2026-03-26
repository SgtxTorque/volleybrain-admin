// =============================================================================
// PlayerProfilePage - Player profile with tabs (Registration, Uniform, Medical, Waivers, History)
// Preserves ALL Supabase queries and save handlers from the original
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import PageShell from '../../components/pages/PageShell'
import { getUniformConfig } from './PlayerProfileConstants'
import WaiversTab from './PlayerProfileWaivers'
import PlayerProfileInfoTab from './PlayerProfileInfoTab'
import PlayerProfileUniformTab from './PlayerProfileUniformTab'
import PlayerProfileMedicalTab from './PlayerProfileMedicalTab'
import PlayerProfileHistoryTab from './PlayerProfileHistoryTab'

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
  const [sportName, setSportName] = useState('')
  const [registrationData, setRegistrationData] = useState(null)

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
        teamColor: tp.teams?.color || '#666', sportIcon: tp.teams?.seasons?.sports?.icon || '🏐',
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

  // === LOADING / ERROR ===
  if (loading) {
    return (
      <PageShell title="Player Profile" breadcrumb="My Players" subtitle="Loading player data...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-[#4BB9EC] border-t-transparent rounded-full" />
        </div>
      </PageShell>
    )
  }
  if (!player) {
    return (
      <PageShell title="Player Not Found" breadcrumb="My Players" subtitle="Could not locate this player">
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-r-2xl">😕</span>
          </div>
          <h2 className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mt-4`}>Player Not Found</h2>
        </div>
      </PageShell>
    )
  }

  // === DERIVED ===
  const primaryTeamPlayer = player.team_players?.[0]
  const primaryTeam = teams[0]
  const teamColor = primaryTeam?.color || '#EAB308'
  const assignedJersey = primaryTeamPlayer?.jersey_number

  const mutedCls = 'text-slate-400'
  const textCls = isDark ? 'text-white' : 'text-slate-900'

  const tabs = [
    { id: 'info', label: 'Registration', icon: '📋' },
    { id: 'jersey', label: 'Uniform', icon: '👕' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'waivers', label: 'Waivers', icon: '📄' },
    { id: 'history', label: 'History', icon: '📅' },
  ]

  // === RENDER ===
  return (
    <PageShell
      title={`${player.first_name} ${player.last_name}`}
      breadcrumb="My Players"
      subtitle={primaryTeam?.name ? `${primaryTeam.name} - Player Profile` : 'Player Profile'}
    >
      <div className="space-y-5">
        {/* Trading Card Hero */}
        <div className="relative overflow-hidden rounded-[14px]" style={{ background: `linear-gradient(135deg, #0B1628 0%, ${teamColor}30 100%)` }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative flex items-center gap-5 p-6">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.first_name} className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10" />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-black text-r-3xl border-2 border-white/10"
                style={{ backgroundColor: teamColor }}>{player.first_name?.[0]}{player.last_name?.[0]}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-r-xs font-bold uppercase tracking-wider text-[#4BB9EC]">{primaryTeam?.name || 'No Team'}</p>
              <h1 className="text-r-3xl font-extrabold text-white truncate">{player.first_name} {player.last_name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {assignedJersey && <span className="text-r-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">#{assignedJersey}</span>}
                {player.position && <span className="text-r-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">{player.position}</span>}
                <span className={`text-r-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  player.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>{player.status === 'active' ? 'Active' : player.status || 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px] overflow-hidden`}>
          <div className={`flex border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} overflow-x-auto`}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-r-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id ? 'border-[#4BB9EC] text-[#4BB9EC]' : `border-transparent ${mutedCls} hover:${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`
                }`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <PlayerProfileInfoTab
                player={player} infoForm={infoForm} setInfoForm={setInfoForm}
                editingInfo={editingInfo} setEditingInfo={setEditingInfo}
                savePlayerInfo={savePlayerInfo} sportName={sportName}
                seasonHistory={seasonHistory} isDark={isDark}
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
                emergencyForm={emergencyForm} setEmergencyForm={setEmergencyForm}
                editingMedical={editingMedical} setEditingMedical={setEditingMedical}
                editingEmergency={editingEmergency} setEditingEmergency={setEditingEmergency}
                saveMedicalInfo={saveMedicalInfo} saveEmergencyContact={saveEmergencyContact}
                isDark={isDark}
              />
            )}

            {activeTab === 'waivers' && (
              <WaiversTab player={player} organization={organization} isDark={isDark} showToast={showToast} teamColor={teamColor} />
            )}

            {activeTab === 'history' && (
              <PlayerProfileHistoryTab seasonHistory={seasonHistory} isDark={isDark} />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export { PlayerProfilePage }
