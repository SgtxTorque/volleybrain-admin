import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, User, Edit, Shirt, Clock, Package, CheckCircle2, 
  AlertTriangle, Sparkles, UserPlus, HelpCircle, BarChart3, Check
} from '../../constants/icons'

// Standard jersey sizes
const JERSEY_SIZES = [
  { value: 'YXS', label: 'Youth XS', category: 'Youth' },
  { value: 'YS', label: 'Youth S', category: 'Youth' },
  { value: 'YM', label: 'Youth M', category: 'Youth' },
  { value: 'YL', label: 'Youth L', category: 'Youth' },
  { value: 'YXL', label: 'Youth XL', category: 'Youth' },
  { value: 'AS', label: 'Adult S', category: 'Adult' },
  { value: 'AM', label: 'Adult M', category: 'Adult' },
  { value: 'AL', label: 'Adult L', category: 'Adult' },
  { value: 'AXL', label: 'Adult XL', category: 'Adult' },
  { value: 'A2XL', label: 'Adult 2XL', category: 'Adult' },
  { value: 'A3XL', label: 'Adult 3XL', category: 'Adult' },
]

// Helper to get jersey tasks count (for nav badge)
export async function getJerseyTasksCount(seasonId) {
  if (!seasonId) return 0
  try {
    const { count: needsJersey } = await supabase
      .from('team_players')
      .select('*, teams!inner(season_id)', { count: 'exact', head: true })
      .eq('teams.season_id', seasonId)
      .is('jersey_number', null)
    return needsJersey || 0
  } catch (err) {
    console.error('Error getting jersey tasks count:', err)
    return 0
  }
}

// ============================================
// JERSEYS PAGE
// ============================================
export function JerseysPage({ showToast }) {
  const { organization, user } = useAuth()
  const { selectedSeason } = useSeason()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  // Data State
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [allPlayersAllTeams, setAllPlayersAllTeams] = useState([])
  const [unrosteredCount, setUnrosteredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [activeTab, setActiveTab] = useState('needs')
  const [assigningPlayer, setAssigningPlayer] = useState(null)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showFullReport, setShowFullReport] = useState(false)
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
      checkUnrosteredRegistrations()
    }
  }, [selectedSeason?.id])

  useEffect(() => {
    loadPlayers()
  }, [selectedTeam?.id, selectedSeason?.id])

  async function checkUnrosteredRegistrations() {
    try {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('player_id')
        .eq('season_id', selectedSeason.id)
        .eq('status', 'approved')

      if (!registrations || registrations.length === 0) {
        setUnrosteredCount(0)
        return
      }

      const approvedPlayerIds = registrations.map(r => r.player_id)

      const { data: seasonTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('season_id', selectedSeason.id)
      
      const seasonTeamIds = seasonTeams?.map(t => t.id) || []

      const { data: rosteredPlayers } = await supabase
        .from('team_players')
        .select('player_id')
        .in('team_id', seasonTeamIds)
        .in('player_id', approvedPlayerIds)

      const rosteredIds = new Set(rosteredPlayers?.map(rp => rp.player_id) || [])
      const unrostered = approvedPlayerIds.filter(id => !rosteredIds.has(id))
      setUnrosteredCount(unrostered.length)
    } catch (err) {
      console.error('Error checking unrostered:', err)
    }
  }

  async function loadTeams() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('season_id', selectedSeason.id)
        .order('name')
      setTeams(data || [])
    } catch (err) {
      console.error('Error loading teams:', err)
    }
    setLoading(false)
  }

  async function loadPlayers() {
    if (!selectedSeason?.id) return
    setLoading(true)
    
    try {
      const { data: seasonTeams } = await supabase
        .from('teams')
        .select('id, name, color, season_id')
        .eq('season_id', selectedSeason.id)
      
      if (!seasonTeams || seasonTeams.length === 0) {
        setPlayers([])
        setLoading(false)
        return
      }

      const seasonTeamIds = seasonTeams.map(t => t.id)
      const teamsMap = {}
      seasonTeams.forEach(t => { teamsMap[t.id] = t })

      const teamFilter = selectedTeam ? [selectedTeam.id] : seasonTeamIds
      const { data: teamPlayers, error: tpError } = await supabase
        .from('team_players')
        .select('id, team_id, player_id, jersey_number')
        .in('team_id', teamFilter)

      if (tpError || !teamPlayers || teamPlayers.length === 0) {
        setPlayers([])
        setLoading(false)
        return
      }

      const playerIds = [...new Set(teamPlayers.map(tp => tp.player_id))]
      const { data: playerDetails } = await supabase
        .from('players')
        .select('id, first_name, last_name, photo_url, jersey_pref_1, jersey_pref_2, jersey_pref_3, uniform_size_jersey, uniform_size_shorts, parent_email, parent_phone')
        .in('id', playerIds)

      const playersMap = {}
      playerDetails?.forEach(p => { playersMap[p.id] = p })

      const enrichedPlayers = teamPlayers.map(tp => {
        const team = teamsMap[tp.team_id]
        const player = playersMap[tp.player_id]
        const hasJersey = !!tp.jersey_number
        
        return {
          ...tp,
          team,
          player,
          teams: team,
          players: player,
          needsJersey: !hasJersey,
          needsOrder: hasJersey,
          isOrdered: false
        }
      }).filter(tp => tp.player)

      setPlayers(enrichedPlayers)
      if (!selectedTeam) setAllPlayersAllTeams(enrichedPlayers)
    } catch (err) {
      console.error('Error loading players:', err)
    }
    setLoading(false)
  }

  // Auto-assign jerseys
  async function handleAutoAssign() {
    if (autoAssigning) return
    setAutoAssigning(true)
    
    const playersToAssign = players.filter(p => !p.jersey_number)
    if (playersToAssign.length === 0) {
      showToast('All players have jerseys assigned', 'info')
      setAutoAssigning(false)
      return
    }

    // Group by team
    const byTeam = {}
    playersToAssign.forEach(p => {
      if (!byTeam[p.team_id]) byTeam[p.team_id] = []
      byTeam[p.team_id].push(p)
    })

    let totalAssigned = 0
    const prefCounts = { '1st': 0, '2nd': 0, '3rd': 0, 'auto': 0 }

    for (const [teamId, teamPlayers] of Object.entries(byTeam)) {
      const teamTaken = new Set(
        players.filter(p => p.team_id === teamId && p.jersey_number).map(p => p.jersey_number)
      )

      // Sort: players with preferences first
      const sorted = [...teamPlayers].sort((a, b) => {
        const aHasPrefs = a.player?.jersey_pref_1 ? 1 : 0
        const bHasPrefs = b.player?.jersey_pref_1 ? 1 : 0
        return bHasPrefs - aHasPrefs
      })

      for (const tp of sorted) {
        const player = tp.player
        if (!player) continue

        const prefs = [player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean)
        let assignedNumber = null
        let assignmentNote = 'auto'

        // Try preferences first
        for (let i = 0; i < prefs.length && !assignedNumber; i++) {
          if (!teamTaken.has(prefs[i])) {
            assignedNumber = prefs[i]
            assignmentNote = ['1st', '2nd', '3rd'][i]
          }
        }

        // Auto-assign if no preference available
        if (!assignedNumber) {
          for (let num = 1; num <= 99 && !assignedNumber; num++) {
            if (!teamTaken.has(num)) assignedNumber = num
          }
        }

        if (assignedNumber) {
          teamTaken.add(assignedNumber)
          
          try {
            await supabase
              .from('team_players')
              .update({ jersey_number: assignedNumber })
              .eq('id', tp.id)
            
            totalAssigned++
            prefCounts[assignmentNote]++
          } catch (err) {
            console.error('Error assigning jersey:', err)
          }
        }
      }
    }

    const summary = []
    if (prefCounts['1st']) summary.push(`${prefCounts['1st']} got 1st choice`)
    if (prefCounts['2nd']) summary.push(`${prefCounts['2nd']} got 2nd choice`)
    if (prefCounts['3rd']) summary.push(`${prefCounts['3rd']} got 3rd choice`)
    if (prefCounts['auto']) summary.push(`${prefCounts['auto']} auto-assigned`)

    if (totalAssigned > 0) {
      showToast(`Assigned ${totalAssigned} jerseys! ${summary.join(', ')}`, 'success')
    } else {
      showToast('No jerseys were assigned', 'warning')
    }
    
    await loadPlayers()
    setAutoAssigning(false)
  }

  // Assign single jersey
  async function assignJersey(playerId, teamPlayerId, teamId, number, prefResult = 'manual') {
    const teamTaken = players
      .filter(p => p.team_id === teamId && p.jersey_number)
      .map(p => p.jersey_number)
    
    if (teamTaken.includes(number)) {
      showToast(`#${number} is already taken on this team`, 'error')
      return false
    }

    try {
      const { error: updateError } = await supabase
        .from('team_players')
        .update({ jersey_number: number })
        .eq('id', teamPlayerId)

      if (updateError) throw updateError

      showToast(`Assigned #${number}${prefResult !== 'manual' ? ` (${prefResult} choice)` : ''}`, 'success')
      setAssigningPlayer(null)
      await loadPlayers()
      return true
    } catch (err) {
      console.error('Assignment error:', err)
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  // Unassign jersey
  async function unassignJersey(teamPlayerId) {
    try {
      await supabase
        .from('team_players')
        .update({ jersey_number: null })
        .eq('id', teamPlayerId)

      showToast('Jersey unassigned', 'success')
      setEditingPlayer(null)
      loadPlayers()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
  }

  // Update jersey number
  async function updateJerseyNumber(teamPlayerId, playerId, teamId, newNumber) {
    const teamTaken = players
      .filter(p => p.team_id === teamId && p.jersey_number && p.id !== teamPlayerId)
      .map(p => p.jersey_number)
    
    if (teamTaken.includes(newNumber)) {
      showToast(`#${newNumber} is already taken`, 'error')
      return false
    }

    try {
      await supabase
        .from('team_players')
        .update({ jersey_number: newNumber })
        .eq('id', teamPlayerId)

      showToast(`Changed to #${newNumber}`, 'success')
      setEditingPlayer(null)
      loadPlayers()
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  // Update jersey size
  async function updateJerseySize(playerId, newSize) {
    try {
      await supabase
        .from('players')
        .update({ uniform_size_jersey: newSize })
        .eq('id', playerId)

      showToast(`Size updated to ${newSize}`, 'success')
      loadPlayers()
      return true
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
      return false
    }
  }

  // Computed values
  const needsJersey = players.filter(p => p.needsJersey)
  const needsOrder = players.filter(p => p.needsOrder)
  const ordered = players.filter(p => p.isOrdered)
  const takenNumbers = new Set(players.filter(p => p.jersey_number).map(p => p.jersey_number))
  
  const stats = {
    total: players.length,
    needsJersey: needsJersey.length,
    needsOrder: needsOrder.length,
    ordered: ordered.length,
    missingSize: players.filter(p => !p.player?.uniform_size_jersey).length
  }

  const leagueStats = {
    needsOrder: allPlayersAllTeams.filter(p => p.needsOrder).length
  }

  if (!selectedSeason) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shirt className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h2 className={`text-xl font-medium ${tc.text} mt-4`}>No Season Selected</h2>
          <p className={tc.textMuted}>Select a season to manage jerseys</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${tc.text}`}>Jersey Management</h1>
          <p className={tc.textSecondary}>
            {selectedTeam ? selectedTeam.name : 'All Teams'} • {selectedSeason.name}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowOrderHistory(true)}
            className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${tc.cardBg} border ${tc.border} ${tc.text} ${tc.hoverBg}`}
          >
            <Clock className="w-4 h-4" /> History
          </button>
          
          <button
            onClick={() => setShowFullReport(true)}
            className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${tc.cardBg} border ${tc.border} ${tc.text} ${tc.hoverBg}`}
          >
            <BarChart3 className="w-4 h-4" /> Full League Report
          </button>
          
          {needsJersey.length > 0 && (
            <button
              onClick={handleAutoAssign}
              disabled={autoAssigning}
              className={`px-4 py-2.5 rounded-xl font-semibold text-white transition flex items-center gap-2 ${
                autoAssigning 
                  ? 'bg-slate-400 cursor-wait' 
                  : 'bg-[var(--accent-primary)] hover:brightness-110'
              }`}
            >
              {autoAssigning ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Assigning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Auto-Assign ({needsJersey.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Team Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedTeam(null)}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-medium ${
            !selectedTeam
              ? 'bg-[var(--accent-primary)] text-white shadow-lg'
              : `${tc.cardBg} border ${tc.border} ${tc.textSecondary} ${tc.hoverBg}`
          }`}
        >
          🏆 All Teams
        </button>
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeam(team)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-medium ${
              selectedTeam?.id === team.id
                ? 'text-white shadow-lg'
                : `${tc.cardBg} border ${tc.border} ${tc.textSecondary} ${tc.hoverBg}`
            }`}
            style={selectedTeam?.id === team.id ? { backgroundColor: team.color || 'var(--accent-primary)' } : {}}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color || '#888' }} />
            {team.name}
          </button>
        ))}
      </div>

      {/* Unrostered Alert */}
      {unrosteredCount > 0 && (
        <div className={`${isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border-2 rounded-xl p-5`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                {unrosteredCount} Approved Registration{unrosteredCount !== 1 ? 's' : ''} Not Yet Rostered
              </h3>
              <p className={`mt-1 ${isDark ? 'text-blue-300/80' : 'text-blue-600'}`}>
                Go to <strong>Teams & Rosters</strong> to add them to teams before managing jerseys.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="users" value={stats.total} label="Total Rostered" onClick={() => {}} tc={tc} isDark={isDark} />
        <StatCard icon="help-circle" value={stats.needsJersey} label="Needs Jersey" color={stats.needsJersey > 0 ? 'red' : null} onClick={() => setActiveTab('needs')} tc={tc} isDark={isDark} />
        <StatCard icon="package" value={stats.needsOrder} label="Ready to Order" color={stats.needsOrder > 0 ? 'amber' : null} onClick={() => setActiveTab('assigned')} tc={tc} isDark={isDark} />
        <StatCard icon="check" value={stats.ordered} label="Ordered" color="emerald" onClick={() => setActiveTab('ordered')} tc={tc} isDark={isDark} />
      </div>

      {/* Tabs */}
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl overflow-hidden`}>
        <div className={`flex border-b ${tc.border}`}>
          {[
            { id: 'needs', label: 'Needs Jersey', count: stats.needsJersey, color: 'red' },
            { id: 'assigned', label: 'Ready to Order', count: stats.needsOrder, color: 'amber' },
            { id: 'ordered', label: 'Ordered', count: stats.ordered, color: 'emerald' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-4 font-medium transition flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? `border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]`
                  : `${tc.textMuted} ${tc.hoverBg}`
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  tab.color === 'red' ? 'bg-red-500/20 text-red-500' :
                  tab.color === 'amber' ? 'bg-amber-500/20 text-amber-500' :
                  'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : activeTab === 'needs' ? (
            <NeedsJerseyList
              players={needsJersey}
              totalRostered={players.length}
              unrosteredCount={unrosteredCount}
              takenNumbers={takenNumbers}
              selectedTeam={selectedTeam}
              onAssign={(player) => setAssigningPlayer(player)}
              onAutoAssign={handleAutoAssign}
              autoAssigning={autoAssigning}
              tc={tc}
              isDark={isDark}
            />
          ) : activeTab === 'assigned' ? (
            <PlayerList
              players={needsOrder}
              selectedTeam={selectedTeam}
              onEdit={(player) => setEditingPlayer(player)}
              emptyIcon={<Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />}
              emptyTitle="Nothing to Order"
              emptyText="All assigned jerseys have been ordered."
              tc={tc}
              isDark={isDark}
            />
          ) : (
            <PlayerList
              players={ordered}
              selectedTeam={selectedTeam}
              onEdit={(player) => setEditingPlayer(player)}
              emptyIcon={<CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />}
              emptyTitle="No Ordered Jerseys"
              emptyText="Mark jerseys as ordered to see them here."
              showCheck
              tc={tc}
              isDark={isDark}
            />
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {assigningPlayer && (
        <JerseyAssignmentModal
          player={assigningPlayer}
          takenNumbers={new Set(
            players
              .filter(p => p.team_id === assigningPlayer.team_id && p.jersey_number)
              .map(p => p.jersey_number)
          )}
          teamColor={assigningPlayer.team?.color}
          onAssign={(number, prefResult) => assignJersey(
            assigningPlayer.player.id,
            assigningPlayer.id,
            assigningPlayer.team_id,
            number,
            prefResult || 'manual'
          )}
          onClose={() => setAssigningPlayer(null)}
          tc={tc}
          isDark={isDark}
        />
      )}

      {/* Edit Modal */}
      {editingPlayer && (
        <JerseyEditModal
          player={editingPlayer}
          takenNumbers={new Set(
            players
              .filter(p => p.team_id === editingPlayer.team_id && p.jersey_number && p.id !== editingPlayer.id)
              .map(p => p.jersey_number)
          )}
          onUpdateNumber={(num) => updateJerseyNumber(editingPlayer.id, editingPlayer.player.id, editingPlayer.team_id, num)}
          onUpdateSize={(size) => updateJerseySize(editingPlayer.player.id, size)}
          onUnassign={() => unassignJersey(editingPlayer.id)}
          onClose={() => setEditingPlayer(null)}
          tc={tc}
          isDark={isDark}
        />
      )}

      {/* Full League Report Modal */}
      {showFullReport && (
        <FullLeagueReportModal
          allPlayers={allPlayersAllTeams}
          teams={teams}
          seasonName={selectedSeason?.name}
          onClose={() => setShowFullReport(false)}
          tc={tc}
          isDark={isDark}
        />
      )}

      {/* Order History Modal */}
      {showOrderHistory && (
        <OrderHistoryModal
          orderedPlayers={ordered}
          teams={teams}
          seasonName={selectedSeason?.name}
          onClose={() => setShowOrderHistory(false)}
          tc={tc}
          isDark={isDark}
        />
      )}
    </div>
  )
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ icon, value, label, color, onClick, tc, isDark }) {
  const colorClasses = {
    red: 'bg-red-500/20 text-red-500',
    amber: 'bg-amber-500/20 text-amber-500',
    emerald: 'bg-emerald-500/20 text-emerald-500',
  }

  const iconMap = {
    users: Users,
    shirt: Shirt,
    'help-circle': HelpCircle,
    package: Package,
    check: CheckCircle2,
  }
  const IconComponent = iconMap[icon] || Users

  return (
    <div
      onClick={onClick}
      className={`${tc.cardBg} border ${tc.border} rounded-xl p-5 cursor-pointer transition hover:shadow-lg`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          color ? colorClasses[color] : isDark ? 'bg-slate-700' : 'bg-slate-100'
        }`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <p className={`text-2xl font-bold ${color ? colorClasses[color].split(' ')[1] : tc.text}`}>
            {value}
          </p>
          <p className={tc.textMuted}>{label}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// NEEDS JERSEY LIST
// ============================================
function NeedsJerseyList({ players, totalRostered, unrosteredCount, takenNumbers, selectedTeam, onAssign, onAutoAssign, autoAssigning, tc, isDark }) {
  if (players.length === 0) {
    if (totalRostered > 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
          <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>All Players Have Jerseys!</h3>
          <p className={tc.textMuted}>Everyone on the roster has been assigned a number.</p>
        </div>
      )
    } else if (unrosteredCount > 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>No Players on Team Rosters Yet</h3>
          <p className={tc.textMuted}>
            You have <strong>{unrosteredCount} approved registration{unrosteredCount !== 1 ? 's' : ''}</strong> waiting to be added to teams.
          </p>
        </div>
      )
    } else {
      return (
        <div className="text-center py-12">
          <Shirt className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>No Players to Manage</h3>
          <p className={tc.textMuted}>Add players to team rosters to start managing jerseys.</p>
        </div>
      )
    }
  }

  const withPrefs = players.filter(p => p.player?.jersey_pref_1).length
  const withoutPrefs = players.length - withPrefs

  return (
    <div className="space-y-4">
      {/* Bulk Auto-Assign Section */}
      <div className={`${isDark ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30' : 'bg-purple-50 border-purple-200'} border-2 border-dashed rounded-xl p-6`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-[var(--accent-primary)]/20' : 'bg-purple-100'}`}>
              <Sparkles className="w-7 h-7 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${tc.text}`}>
                {players.length} Player{players.length !== 1 ? 's' : ''} Need{players.length === 1 ? 's' : ''} Jersey Numbers
              </h3>
              <p className={tc.textMuted}>
                {withPrefs > 0 && `${withPrefs} with preferences`}
                {withPrefs > 0 && withoutPrefs > 0 && ' • '}
                {withoutPrefs > 0 && `${withoutPrefs} without preferences`}
              </p>
            </div>
          </div>
          
          <button
            onClick={onAutoAssign}
            disabled={autoAssigning}
            className={`px-6 py-3 rounded-xl font-bold text-white transition flex items-center gap-2 shadow-lg ${
              autoAssigning 
                ? 'bg-slate-400 cursor-wait' 
                : 'bg-[var(--accent-primary)] hover:brightness-110 hover:shadow-xl'
            }`}
          >
            {autoAssigning ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Assigning...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Auto-Assign All ({players.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Individual Players */}
      <div className="space-y-3">
        {players.map(p => {
          const player = p.player
          if (!player) return null

          const prefs = [player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean)
          const teamTaken = new Set(
            players.filter(x => x.team_id === p.team_id && x.jersey_number).map(x => x.jersey_number)
          )
          const availablePrefs = prefs.filter(n => !teamTaken.has(n))

          return (
            <div
              key={p.id}
              className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4 flex items-center gap-4 transition hover:shadow-md`}
            >
              <div className="w-1 h-12 rounded-full" style={{ backgroundColor: p.team?.color || '#888' }} />

              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `${p.team?.color || '#888'}30`, color: p.team?.color || '#888' }}>
                {player.photo_url ? (
                  <img src={player.photo_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  `${player.first_name?.[0]}${player.last_name?.[0]}`
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`font-semibold ${tc.text}`}>{player.first_name} {player.last_name}</h4>
                  {!selectedTeam && (
                    <span className="text-xs px-2 py-0.5 rounded-full" 
                      style={{ backgroundColor: `${p.team?.color || '#888'}20`, color: p.team?.color || '#888' }}>
                      {p.team?.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {player.uniform_size_jersey ? (
                    <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} ${tc.textMuted}`}>
                      {player.uniform_size_jersey}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> No size
                    </span>
                  )}
                  {prefs.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs ${tc.textMuted}`}>Wants:</span>
                      {prefs.map((n, i) => (
                        <span
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            teamTaken.has(n)
                              ? 'bg-red-500/20 text-red-500 line-through'
                              : 'bg-emerald-500/20 text-emerald-500'
                          }`}
                        >
                          #{n}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={`text-xs ${tc.textMuted} italic`}>No preferences set</span>
                  )}
                </div>
              </div>

              {availablePrefs.length > 0 && (
                <div className="hidden md:flex gap-2">
                  {availablePrefs.slice(0, 3).map(num => (
                    <button
                      key={num}
                      onClick={() => onAssign({ ...p, quickAssign: num })}
                      className="w-10 h-10 rounded-lg font-bold text-white transition hover:scale-105"
                      style={{ backgroundColor: p.team?.color || 'var(--accent-primary)' }}
                      title={`Assign #${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => onAssign(p)}
                className="px-4 py-2 rounded-xl font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition"
              >
                Assign
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// PLAYER LIST (for Assigned/Ordered tabs)
// ============================================
function PlayerList({ players, selectedTeam, onEdit, emptyIcon, emptyTitle, emptyText, showCheck, tc, isDark }) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        {emptyIcon}
        <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>{emptyTitle}</h3>
        <p className={tc.textMuted}>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {players.map(p => {
        const player = p.player
        if (!player) return null

        return (
          <div key={p.id} className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4 flex items-center gap-4`}>
            <div className="w-1 h-12 rounded-full" style={{ backgroundColor: p.team?.color || '#888' }} />

            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: p.team?.color || 'var(--accent-primary)' }}
            >
              {p.jersey_number}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${tc.text}`}>{player.first_name} {player.last_name}</h4>
                {!selectedTeam && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${p.team?.color || '#888'}20`, color: p.team?.color || '#888' }}>
                    {p.team?.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                {player.uniform_size_jersey ? (
                  <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'} ${tc.textMuted}`}>
                    {player.uniform_size_jersey}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">No size</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onEdit(p)}
              className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted} transition`}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            {showCheck && <span className="text-emerald-500"><Check className="w-4 h-4" /></span>}
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// JERSEY ASSIGNMENT MODAL
// ============================================
function JerseyAssignmentModal({ player, takenNumbers, teamColor, onAssign, onClose, tc, isDark }) {
  const [selectedNumber, setSelectedNumber] = useState(player.quickAssign || null)
  const playerData = player.player

  const pref1 = playerData?.jersey_pref_1
  const pref2 = playerData?.jersey_pref_2
  const pref3 = playerData?.jersey_pref_3
  const hasPrefs = pref1 || pref2 || pref3

  const suggestions = []
  for (let i = 1; i <= 99 && suggestions.length < 20; i++) {
    if (!takenNumbers.has(i)) suggestions.push(i)
  }

  const getPreferenceResult = (num) => {
    if (num === pref1) return '1st'
    if (num === pref2) return '2nd'
    if (num === pref3) return '3rd'
    return 'manual'
  }

  const handleAssign = () => {
    if (selectedNumber && !takenNumbers.has(selectedNumber)) {
      onAssign(selectedNumber, getPreferenceResult(selectedNumber))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border} sticky top-0 ${tc.cardBg}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${tc.text}`}>Assign Jersey</h2>
            <button onClick={onClose} className={`${tc.textMuted} hover:${tc.text} text-2xl`}>×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Player Info */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: `${teamColor}30`, color: teamColor }}>
              {playerData?.first_name?.[0]}{playerData?.last_name?.[0]}
            </div>
            <h3 className={`text-lg font-semibold ${tc.text} mt-3`}>{playerData?.first_name} {playerData?.last_name}</h3>
            <p className={tc.textMuted}>{player.team?.name}</p>
            {playerData?.uniform_size_jersey && (
              <p className={tc.textMuted}>Size: {playerData.uniform_size_jersey}</p>
            )}
          </div>

          {/* Preferences */}
          <div>
            <label className={`block text-sm font-medium ${tc.textMuted} mb-2`}>
              Player's Preferences {!hasPrefs && <span className="text-amber-500">(None set)</span>}
            </label>
            <div className="flex gap-2">
              {[pref1, pref2, pref3].map((pref, i) => {
                const isTaken = pref && takenNumbers.has(pref)
                const isSelected = selectedNumber === pref

                return (
                  <button
                    key={i}
                    onClick={() => !isTaken && pref && setSelectedNumber(pref)}
                    disabled={isTaken || !pref}
                    className={`flex-1 py-3 rounded-xl text-center transition ${
                      isSelected
                        ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/20'
                        : isTaken
                          ? `${tc.cardBgAlt} border ${tc.border} opacity-50 cursor-not-allowed`
                          : pref
                            ? `${tc.cardBgAlt} border ${tc.border} hover:border-[var(--accent-primary)] cursor-pointer`
                            : `${tc.cardBgAlt} border ${tc.border} opacity-30`
                    }`}
                  >
                    <div className={`text-xs ${tc.textMuted}`}>{['1st', '2nd', '3rd'][i]}</div>
                    <div className={`text-lg font-bold ${isTaken ? 'line-through text-red-500' : tc.text}`}>
                      {pref || '—'}
                    </div>
                    {isTaken && <div className="text-[10px] text-red-500">Taken</div>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Number Grid */}
          <div>
            <label className={`block text-sm font-medium ${tc.textMuted} mb-2`}>Available Numbers</label>
            <div className="grid grid-cols-5 gap-2">
              {suggestions.map(num => {
                const isPref = num === pref1 || num === pref2 || num === pref3
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(num)}
                    className={`h-11 rounded-lg font-semibold transition ${
                      selectedNumber === num
                        ? 'text-white'
                        : isPref
                          ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600'
                          : `${tc.cardBgAlt} border ${tc.border} ${tc.text} hover:border-[var(--accent-primary)]`
                    }`}
                    style={selectedNumber === num ? { backgroundColor: teamColor || 'var(--accent-primary)' } : {}}
                  >
                    {num}
                    {isPref && selectedNumber !== num && <span className="text-[8px] block -mt-1">★</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div>
            <label className={`block text-sm font-medium ${tc.textMuted} mb-2`}>Or Enter Number (1-99)</label>
            <input
              type="number"
              min="1"
              max="99"
              value={selectedNumber || ''}
              onChange={e => {
                const val = parseInt(e.target.value)
                if (!isNaN(val) && val >= 1 && val <= 99) setSelectedNumber(val)
                else if (e.target.value === '') setSelectedNumber(null)
              }}
              placeholder="1-99"
              className={`w-full px-4 py-3 rounded-xl text-2xl font-bold text-center border-2 ${tc.input} focus:border-[var(--accent-primary)] outline-none`}
            />
            {selectedNumber && takenNumbers.has(selectedNumber) && (
              <p className="text-red-500 text-sm mt-2 text-center">⚠️ #{selectedNumber} is already taken</p>
            )}
            {selectedNumber && !takenNumbers.has(selectedNumber) && getPreferenceResult(selectedNumber) !== 'manual' && (
              <p className="text-emerald-500 text-sm mt-2 text-center">✓ This is their {getPreferenceResult(selectedNumber)} choice!</p>
            )}
          </div>
        </div>

        <div className={`p-4 border-t ${tc.border} flex gap-3 sticky bottom-0 ${tc.cardBg}`}>
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg} transition`}>
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedNumber || takenNumbers.has(selectedNumber)}
            className="flex-1 py-3 rounded-xl font-semibold text-white bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-50 transition"
          >
            Assign #{selectedNumber || '?'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// JERSEY EDIT MODAL
// ============================================
function JerseyEditModal({ player, takenNumbers, onUpdateNumber, onUpdateSize, onUnassign, onClose, tc, isDark }) {
  const [newNumber, setNewNumber] = useState(player.jersey_number || '')
  const [newSize, setNewSize] = useState(player.player?.uniform_size_jersey || '')
  const playerData = player.player

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-md`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${tc.text}`}>Edit Jersey</h2>
            <button onClick={onClose} className={`${tc.textMuted} text-2xl`}>×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Player Info */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: player.team?.color || 'var(--accent-primary)' }}
            >
              {player.jersey_number || '?'}
            </div>
            <div>
              <h3 className={`font-semibold ${tc.text}`}>{playerData?.first_name} {playerData?.last_name}</h3>
              <p className={tc.textMuted}>{player.team?.name}</p>
            </div>
          </div>

          {/* Jersey Number */}
          <div>
            <label className={`block text-sm font-medium ${tc.textMuted} mb-2`}>Jersey Number</label>
            <input
              type="number"
              min="1"
              max="99"
              value={newNumber}
              onChange={e => setNewNumber(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-xl font-bold text-center border ${tc.input} focus:border-[var(--accent-primary)] outline-none`}
            />
            {newNumber && takenNumbers.has(parseInt(newNumber)) && parseInt(newNumber) !== player.jersey_number && (
              <p className="text-red-500 text-sm mt-1">⚠️ Already taken</p>
            )}
            {parseInt(newNumber) !== player.jersey_number && newNumber && !takenNumbers.has(parseInt(newNumber)) && (
              <button
                onClick={() => onUpdateNumber(parseInt(newNumber))}
                className="mt-2 w-full py-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium hover:bg-[var(--accent-primary)]/20 transition"
              >
                Update to #{newNumber}
              </button>
            )}
          </div>

          {/* Jersey Size */}
          <div>
            <label className={`block text-sm font-medium ${tc.textMuted} mb-2`}>Jersey Size</label>
            <select
              value={newSize}
              onChange={e => setNewSize(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${tc.input} cursor-pointer`}
            >
              <option value="">Select size...</option>
              <optgroup label="Youth">
                {JERSEY_SIZES.filter(s => s.category === 'Youth').map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </optgroup>
              <optgroup label="Adult">
                {JERSEY_SIZES.filter(s => s.category === 'Adult').map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </optgroup>
            </select>
            {newSize !== player.player?.uniform_size_jersey && newSize && (
              <button
                onClick={() => onUpdateSize(newSize)}
                className="mt-2 w-full py-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium hover:bg-[var(--accent-primary)]/20 transition"
              >
                Update Size to {newSize}
              </button>
            )}
          </div>

          {/* Unassign */}
          <div className={`pt-4 border-t ${tc.border}`}>
            <button
              onClick={() => {
                if (confirm(`Unassign #${player.jersey_number} from ${playerData?.first_name}?`)) {
                  onUnassign()
                }
              }}
              className="w-full py-3 rounded-xl font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
            >
              🗑️ Unassign Jersey
            </button>
          </div>
        </div>

        <div className={`p-4 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg} transition`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// FULL LEAGUE REPORT MODAL
// ============================================
function FullLeagueReportModal({ allPlayers, teams, seasonName, onClose, tc, isDark }) {
  const toOrder = allPlayers.filter(p => p.needsOrder)

  const byTeam = {}
  toOrder.forEach(p => {
    const teamName = p.team?.name || 'Unknown Team'
    if (!byTeam[teamName]) byTeam[teamName] = { color: p.team?.color, players: [] }
    byTeam[teamName].players.push(p)
  })

  const sizeSummary = {}
  toOrder.forEach(p => {
    const size = p.player?.uniform_size_jersey || '⚠️ Unknown'
    sizeSummary[size] = (sizeSummary[size] || 0) + 1
  })

  const missingSize = toOrder.filter(p => !p.player?.uniform_size_jersey).length

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${tc.text}`}>Full League Jersey Report</h2>
              <p className={tc.textMuted}>{seasonName} • {toOrder.length} jerseys to order</p>
            </div>
            <button onClick={onClose} className={`${tc.textMuted} text-2xl`}>×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4 text-center`}>
              <p className="text-3xl font-bold text-[var(--accent-primary)]">{toOrder.length}</p>
              <p className={tc.textMuted}>To Order</p>
            </div>
            <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4 text-center`}>
              <p className="text-3xl font-bold">{Object.keys(byTeam).length}</p>
              <p className={tc.textMuted}>Teams</p>
            </div>
            <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${missingSize > 0 ? 'text-red-500' : tc.text}`}>{missingSize}</p>
              <p className={tc.textMuted}>Missing Size</p>
            </div>
            <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4 text-center`}>
              <p className="text-3xl font-bold text-emerald-500">{Object.keys(sizeSummary).length}</p>
              <p className={tc.textMuted}>Size Variations</p>
            </div>
          </div>

          {/* Size Breakdown */}
          <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl p-4`}>
            <h3 className={`font-semibold ${tc.text} mb-3`}>Order Summary by Size</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(sizeSummary).sort().map(([size, count]) => (
                <div key={size} className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <span className={`font-bold ${size.includes('⚠️') ? 'text-red-500' : tc.text}`}>{size}</span>
                  <span className={`ml-2 ${tc.textMuted}`}>×{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Team */}
          {Object.entries(byTeam).sort().map(([teamName, teamData]) => (
            <div key={teamName} className={`${tc.cardBgAlt} border ${tc.border} rounded-xl overflow-hidden`}>
              <div className="p-4 flex items-center gap-3" style={{ backgroundColor: `${teamData.color}20` }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: teamData.color }} />
                <h3 className={`font-semibold ${tc.text}`}>{teamName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                  {teamData.players.length} jerseys
                </span>
              </div>
              <div className="p-4 space-y-2">
                {teamData.players.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                      style={{ backgroundColor: teamData.color }}
                    >
                      {p.jersey_number}
                    </div>
                    <span className={tc.text}>{p.player?.first_name} {p.player?.last_name}</span>
                    <span className={`text-sm ${!p.player?.uniform_size_jersey ? 'text-red-500' : tc.textMuted}`}>
                      {p.player?.uniform_size_jersey || '⚠️ No size'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {toOrder.length === 0 && (
            <div className="text-center py-12">
              <span className="text-5xl">🎉</span>
              <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>All Jerseys Ordered!</h3>
              <p className={tc.textMuted}>Nothing left to order for this season.</p>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${tc.border}`}>
          <button onClick={onClose} className={`w-full py-3 rounded-xl ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg} transition`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ORDER HISTORY MODAL
// ============================================
function OrderHistoryModal({ orderedPlayers, teams, seasonName, onClose, tc, isDark }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className={`p-6 border-b ${tc.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${tc.text}`}>Jersey Order History</h2>
              <p className={tc.textMuted}>{seasonName} • {orderedPlayers.length} ordered</p>
            </div>
            <button onClick={onClose} className={`${tc.textMuted} hover:${tc.text} text-2xl`}>×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {orderedPlayers.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className={`text-lg font-semibold ${tc.text}`}>No Orders Yet</h3>
              <p className={tc.textMuted}>Once jerseys are marked as ordered, they'll appear here.</p>
            </div>
          ) : (
            <div className={`${tc.cardBgAlt} border ${tc.border} rounded-xl overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className={`text-left text-sm ${tc.textMuted} border-b ${tc.border}`}>
                    <th className="p-3">#</th>
                    <th className="p-3">Player</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedPlayers.map(p => (
                    <tr key={p.id} className={`border-b ${tc.border} last:border-b-0`}>
                      <td className="p-3">
                        <span 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-white text-sm"
                          style={{ backgroundColor: p.team?.color || '#888' }}
                        >
                          {p.jersey_number}
                        </span>
                      </td>
                      <td className={`p-3 ${tc.text}`}>
                        {p.player?.first_name} {p.player?.last_name}
                      </td>
                      <td className={`p-3 ${tc.textMuted}`}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.team?.color || '#888' }} />
                          {p.team?.name}
                        </span>
                      </td>
                      <td className={`p-3 ${tc.textMuted}`}>
                        {p.player?.uniform_size_jersey || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${tc.border}`}>
          <button 
            onClick={onClose}
            className={`w-full py-3 rounded-xl ${tc.cardBgAlt} ${tc.text} ${tc.hoverBg} transition`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
