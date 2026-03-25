import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, User, Edit, Shirt, Clock, Package, CheckCircle2,
  AlertTriangle, Sparkles, UserPlus, HelpCircle, BarChart3, Check,
  ChevronRight, X, Bell
} from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import InnerStatRow from '../../components/pages/InnerStatRow'
import JerseyActionPanel from './JerseyActionPanel'

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
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
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

  // Helper: get season IDs filtered by sport (for "All Seasons" + sport filter)
  function getSportSeasonIds() {
    if (!selectedSport?.id) return null
    return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  }

  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
      checkUnrosteredRegistrations()
    }
  }, [selectedSeason?.id, selectedSport?.id])

  useEffect(() => {
    loadPlayers()
  }, [selectedTeam?.id, selectedSeason?.id, selectedSport?.id])

  async function checkUnrosteredRegistrations() {
    try {
      const sportIds = getSportSeasonIds()
      // If sport is selected but has no seasons, no data to show
      if (sportIds && sportIds.length === 0) {
        setUnrosteredCount(0)
        return
      }
      let regQuery = supabase
        .from('registrations')
        .select('player_id')
        .eq('status', 'approved')
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        regQuery = regQuery.eq('season_id', selectedSeason.id)
      } else if (sportIds && sportIds.length > 0) {
        regQuery = regQuery.in('season_id', sportIds)
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setUnrosteredCount(0)
          return
        }
        regQuery = regQuery.in('season_id', orgSeasonIds)
      }
      const { data: registrations } = await regQuery

      if (!registrations || registrations.length === 0) {
        setUnrosteredCount(0)
        return
      }

      const approvedPlayerIds = registrations.map(r => r.player_id)

      let seasonTeamsQuery = supabase.from('teams').select('id')
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        seasonTeamsQuery = seasonTeamsQuery.eq('season_id', selectedSeason.id)
      } else if (sportIds && sportIds.length > 0) {
        seasonTeamsQuery = seasonTeamsQuery.in('season_id', sportIds)
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setUnrosteredCount(0)
          return
        }
        seasonTeamsQuery = seasonTeamsQuery.in('season_id', orgSeasonIds)
      }
      const { data: seasonTeams } = await seasonTeamsQuery

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
      const sportIds = getSportSeasonIds()
      // If sport is selected but has no seasons, no data to show
      if (sportIds && sportIds.length === 0) {
        setTeams([])
        setLoading(false)
        return
      }
      let query = supabase.from('teams').select('id, name, color')
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        query = query.eq('season_id', selectedSeason.id)
      } else if (sportIds && sportIds.length > 0) {
        query = query.in('season_id', sportIds)
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setTeams([])
          setLoading(false)
          return
        }
        query = query.in('season_id', orgSeasonIds)
      }
      const { data } = await query.order('name')
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
      const sportIds = getSportSeasonIds()
      // If sport is selected but has no seasons, no data to show
      if (sportIds && sportIds.length === 0) {
        setPlayers([])
        setAllPlayersAllTeams([])
        setLoading(false)
        return
      }
      let teamsQuery = supabase.from('teams').select('id, name, color, season_id')
      if (!isAllSeasons(selectedSeason)) {
        teamsQuery = teamsQuery.eq('season_id', selectedSeason.id)
      } else if (sportIds && sportIds.length > 0) {
        teamsQuery = teamsQuery.in('season_id', sportIds)
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setPlayers([])
          setAllPlayersAllTeams([])
          setLoading(false)
          return
        }
        teamsQuery = teamsQuery.in('season_id', orgSeasonIds)
      }
      const { data: seasonTeams } = await teamsQuery

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

  // New UI state for accordion + action panel
  const [expandedTeams, setExpandedTeams] = useState(new Set())
  const [teamStageFilters, setTeamStageFilters] = useState({})
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set())

  function toggleTeamExpand(teamId) {
    setExpandedTeams(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  function setTeamStageFilter(teamId, stage) {
    setTeamStageFilters(prev => ({ ...prev, [teamId]: stage }))
  }

  function toggleBulkPlayer(playerId) {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  function toggleBulkTeam(teamPlayerIds) {
    setSelectedPlayerIds(prev => {
      const next = new Set(prev)
      const allSelected = teamPlayerIds.every(id => next.has(id))
      if (allSelected) {
        teamPlayerIds.forEach(id => next.delete(id))
      } else {
        teamPlayerIds.forEach(id => next.add(id))
      }
      return next
    })
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

  // Pipeline stage classifier for each player
  function getPlayerStage(p) {
    if (p.isOrdered) return 'ordered'
    if (!p.jersey_number) return 'needs_number'
    if (!p.player?.uniform_size_jersey) return 'needs_size'
    return 'ready'
  }

  // Group all players by team
  const playersByTeam = {}
  players.forEach(p => {
    const tid = p.team_id
    if (!playersByTeam[tid]) playersByTeam[tid] = []
    playersByTeam[tid].push(p)
  })

  // Compute team stats for accordion headers
  function getTeamPipelineStats(teamId) {
    const tp = playersByTeam[teamId] || []
    const needsNum = tp.filter(p => !p.jersey_number).length
    const needsSize = tp.filter(p => p.jersey_number && !p.player?.uniform_size_jersey).length
    const ready = tp.filter(p => p.jersey_number && p.player?.uniform_size_jersey && !p.isOrdered).length
    const orderedCount = tp.filter(p => p.isOrdered).length
    return { total: tp.length, needsNum, needsSize, ready, ordered: orderedCount }
  }

  // Club-wide readiness: players with number + size assigned (or ordered)
  const readyPlayers = players.filter(p => p.jersey_number && p.player?.uniform_size_jersey)
  const readyPercent = players.length > 0 ? Math.round((readyPlayers.length / players.length) * 100) : 0
  const conflictCount = (() => {
    let conflicts = 0
    const teamPrefs = {}
    players.forEach(p => {
      if (!p.player) return
      const tid = p.team_id
      if (!teamPrefs[tid]) teamPrefs[tid] = {}
      const prefs = [p.player.jersey_pref_1, p.player.jersey_pref_2, p.player.jersey_pref_3].filter(Boolean)
      prefs.forEach(pref => {
        if (!teamPrefs[tid][pref]) teamPrefs[tid][pref] = 0
        teamPrefs[tid][pref]++
      })
    })
    Object.values(teamPrefs).forEach(prefMap => {
      Object.values(prefMap).forEach(count => {
        if (count > 1) conflicts++
      })
    })
    return conflicts
  })()
  const pendingSizeCount = players.filter(p => !p.player?.uniform_size_jersey).length

  // Pipeline stages config
  const PIPELINE_STAGES = [
    { key: 'all', label: 'All' },
    { key: 'needs_number', label: 'Needs #', color: 'text-red-500' },
    { key: 'needs_size', label: 'Needs Size', color: 'text-amber-500' },
    { key: 'ready', label: 'Ready', color: 'text-[#4BB9EC]' },
    { key: 'ordered', label: 'Ordered', color: 'text-[#22C55E]' },
  ]

  // Status badge renderer
  function StatusBadge({ stage }) {
    const badges = {
      needs_number: { label: 'NEEDS NUMBER', cls: 'bg-red-500/15 text-red-500' },
      needs_size: { label: 'NEEDS SIZE', cls: 'bg-amber-500/15 text-amber-500' },
      ready: { label: 'READY TO ORDER', cls: 'bg-[#4BB9EC]/15 text-[#4BB9EC]' },
      ordered: { label: 'ORDERED', cls: 'bg-[#22C55E]/15 text-[#22C55E]' },
    }
    const b = badges[stage] || badges.needs_number
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${b.cls}`}>
        {b.label}
      </span>
    )
  }

  // Determine visible teams (filter by selectedTeam if set)
  const visibleTeams = selectedTeam ? teams.filter(t => t.id === selectedTeam.id) : teams

  return (
    <PageShell
      breadcrumb="Jersey Management"
      title="Jersey Management"
      subtitle={`${selectedSeason?.name || 'Season'}`}
      actions={
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowOrderHistory(true)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${tc.cardBg} border ${tc.border} ${tc.text} ${tc.hoverBg}`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <Clock className="w-4 h-4" /> History
          </button>
          <button
            onClick={() => setShowFullReport(true)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${tc.cardBg} border ${tc.border} ${tc.text} ${tc.hoverBg}`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <BarChart3 className="w-4 h-4" /> Full League Report
          </button>
          {needsJersey.length > 0 && (
            <button
              onClick={handleAutoAssign}
              disabled={autoAssigning}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-sm flex items-center gap-2 ${
                autoAssigning ? 'bg-slate-400 cursor-wait' : 'bg-[#4BB9EC] hover:brightness-110'
              }`}
              style={{ fontFamily: 'var(--v2-font)' }}
            >
              {autoAssigning ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Assigning...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Auto-Assign ({needsJersey.length})</>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <SeasonFilterBar />

        {/* Team Filter Pills (kept for quick filtering) */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTeam(null)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-medium ${
              !selectedTeam
                ? 'bg-lynx-navy-subtle text-white shadow-lg'
                : `${tc.cardBg} border ${tc.border} ${tc.textSecondary} ${tc.hoverBg}`
            }`}
          >
            All Teams
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
          <div className={`rounded-[14px] p-5 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50/80 border border-amber-200'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                  {unrosteredCount} Approved Registration{unrosteredCount !== 1 ? 's' : ''} Not Yet Rostered
                </h3>
                <p className={isDark ? 'text-amber-400/70 mt-1' : 'text-amber-700 mt-1'}>
                  Go to <strong>Teams & Rosters</strong> to add them to teams before managing jerseys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── CLUB READINESS STATUS BAR ── */}
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`}
                style={{ fontFamily: 'var(--v2-font)' }}>
                Club Readiness Status
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {organization?.name || 'Organization'} · {selectedSeason?.name}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-black italic ${
                readyPercent > 90 ? 'text-[#22C55E]' : readyPercent > 60 ? 'text-[#4BB9EC]' : 'text-amber-500'
              }`}>
                {readyPercent}%
              </span>
              <div className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Ready to Order
              </div>
            </div>
          </div>
          {/* Full-width progress bar */}
          <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-[#4BB9EC] to-[#22C55E] transition-all"
              style={{ width: `${readyPercent}%` }} />
          </div>
          {/* Summary dots */}
          <div className={`flex items-center gap-6 mt-3 text-xs font-bold flex-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> {readyPlayers.length} Players Validated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {conflictCount} Conflicts Found
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> {pendingSizeCount} Pending Sizes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4BB9EC]" /> {needsJersey.length} Need Numbers
            </span>
          </div>
        </div>

        {/* ── 2-COLUMN: TEAM ACCORDIONS + ACTION PANEL ── */}
        <div className="flex gap-6 items-start">
          {/* Left: Team Accordions */}
          <div className="flex-1 min-w-0 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto" />
              </div>
            ) : visibleTeams.length === 0 ? (
              <div className="text-center py-12">
                <Shirt className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <h3 className={`text-lg font-semibold ${tc.text} mt-4`}>No Teams Found</h3>
                <p className={tc.textMuted}>Create teams and add players to start managing jerseys.</p>
              </div>
            ) : (
              visibleTeams.map(team => {
                const isExpanded = expandedTeams.has(team.id)
                const tStats = getTeamPipelineStats(team.id)
                const teamReady = tStats.ready + tStats.ordered
                const teamTotal = tStats.total
                const teamReadyPercent = teamTotal > 0 ? Math.round((teamReady / teamTotal) * 100) : 0
                const isComplete = teamReady === teamTotal && teamTotal > 0
                const activeStage = teamStageFilters[team.id] || 'all'
                const teamPlayersList = playersByTeam[team.id] || []

                // Filter players by active pipeline stage
                const filteredPlayers = activeStage === 'all'
                  ? teamPlayersList
                  : teamPlayersList.filter(p => getPlayerStage(p) === activeStage)

                const teamPlayerIds = teamPlayersList.map(p => p.id)
                const allTeamSelected = teamPlayerIds.length > 0 && teamPlayerIds.every(id => selectedPlayerIds.has(id))

                return (
                  <div key={team.id} className={`rounded-[14px] overflow-hidden ${
                    isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2] shadow-sm'
                  }`}>
                    {/* Accordion header */}
                    <button
                      onClick={() => toggleTeamExpand(team.id)}
                      className={`w-full px-5 py-4 flex items-center gap-4 transition ${
                        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform shrink-0 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      } ${isExpanded ? 'rotate-90' : ''}`} />
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color || '#888' }} />
                      <div className="text-left flex-1 min-w-0">
                        <div className={`font-extrabold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}
                          style={{ fontFamily: 'var(--v2-font)' }}>
                          {team.name}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {tStats.total} Player{tStats.total !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {/* Pipeline mini-counts */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {tStats.needsNum > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-500">
                            {tStats.needsNum} Need #
                          </span>
                        )}
                        {tStats.needsSize > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500">
                            {tStats.needsSize} Need Size
                          </span>
                        )}
                        {tStats.ready > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#4BB9EC]/15 text-[#4BB9EC]">
                            {tStats.ready} Ready
                          </span>
                        )}
                      </div>
                      {/* Readiness badge */}
                      <span className={`text-sm font-black shrink-0 ${isComplete ? 'text-[#22C55E]' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {teamTotal === 0 ? '—' : isComplete ? '100%' : `${teamReady}/${teamTotal}`}
                      </span>
                      {/* Mini progress bar */}
                      <div className={`w-20 h-1.5 rounded-full overflow-hidden shrink-0 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                        <div className={`h-full rounded-full transition-all ${isComplete ? 'bg-[#22C55E]' : 'bg-[#4BB9EC]'}`}
                          style={{ width: `${teamReadyPercent}%` }} />
                      </div>
                    </button>

                    {/* Expanded content: pipeline stages + player rows */}
                    {isExpanded && (
                      <div className={`border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                        {/* Pipeline stage bar */}
                        <div className={`flex items-center gap-1 px-5 py-3 overflow-x-auto ${
                          isDark ? 'bg-white/[0.02]' : 'bg-[#F5F6F8]'
                        }`}>
                          {PIPELINE_STAGES.map(stage => {
                            const count = stage.key === 'all' ? teamPlayersList.length
                              : stage.key === 'needs_number' ? tStats.needsNum
                              : stage.key === 'needs_size' ? tStats.needsSize
                              : stage.key === 'ready' ? tStats.ready
                              : tStats.ordered
                            return (
                              <button key={stage.key}
                                onClick={() => setTeamStageFilter(team.id, stage.key)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition ${
                                  activeStage === stage.key
                                    ? 'bg-lynx-navy-subtle text-white'
                                    : isDark
                                      ? 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                                      : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                                }`}>
                                {stage.label} ({count})
                              </button>
                            )
                          })}
                        </div>

                        {/* Player rows table */}
                        {filteredPlayers.length === 0 ? (
                          <div className={`text-center py-8 ${tc.textMuted}`}>
                            <p className="text-sm">No players in this stage</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  <th className="w-10 px-3 py-2">
                                    <input type="checkbox" checked={allTeamSelected}
                                      onChange={() => toggleBulkTeam(teamPlayerIds)}
                                      className="rounded" />
                                  </th>
                                  <th className="text-left px-3 py-2">Player</th>
                                  <th className="text-left px-3 py-2 hidden md:table-cell">Preferred</th>
                                  <th className="text-left px-3 py-2">Assigned</th>
                                  <th className="text-left px-3 py-2 hidden sm:table-cell">Size</th>
                                  <th className="text-left px-3 py-2">Status</th>
                                  <th className="text-left px-3 py-2">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPlayers.map((p, idx) => {
                                  const player = p.player
                                  if (!player) return null
                                  const stage = getPlayerStage(p)
                                  const prefs = [player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean)
                                  const isRowSelected = selectedPlayer?.id === p.id
                                  const isBulkSelected = selectedPlayerIds.has(p.id)
                                  const teamTakenSet = new Set(
                                    teamPlayersList.filter(x => x.jersey_number && x.id !== p.id).map(x => x.jersey_number)
                                  )

                                  return (
                                    <tr key={p.id}
                                      onClick={() => setSelectedPlayer(isRowSelected ? null : p)}
                                      className={`transition cursor-pointer ${
                                        isRowSelected
                                          ? isDark ? 'bg-[#4BB9EC]/10' : 'bg-[#4BB9EC]/[0.06]'
                                          : idx % 2 === 1
                                            ? isDark ? 'bg-white/[0.02]' : 'bg-slate-50/50'
                                            : ''
                                      } ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}
                                    >
                                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" checked={isBulkSelected}
                                          onChange={() => toggleBulkPlayer(p.id)}
                                          className="rounded" />
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2.5 min-w-[140px]">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                                            style={{ backgroundColor: `${team.color || '#888'}25`, color: team.color || '#888' }}>
                                            {player.photo_url ? (
                                              <img src={player.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                              `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`
                                            )}
                                          </div>
                                          <span className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                                            {player.first_name} {player.last_name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 hidden md:table-cell">
                                        <div className="flex items-center gap-1">
                                          {prefs.length > 0 ? prefs.map((n, i) => {
                                            const taken = teamTakenSet.has(n)
                                            return (
                                              <span key={i} className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                                taken ? 'bg-red-500/15 text-red-500 line-through' : 'bg-[#22C55E]/15 text-[#22C55E]'
                                              }`}>#{n}</span>
                                            )
                                          }) : (
                                            <span className={`text-xs italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>None</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {p.jersey_number ? (
                                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white`}
                                            style={{ backgroundColor: team.color || '#10284C' }}>
                                            {p.jersey_number}
                                          </span>
                                        ) : (
                                          <span className={`text-sm ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 hidden sm:table-cell">
                                        {player.uniform_size_jersey ? (
                                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                            isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                                          }`}>{player.uniform_size_jersey}</span>
                                        ) : (
                                          <span className="text-xs px-2 py-0.5 rounded font-medium bg-red-500/15 text-red-500 flex items-center gap-1 w-fit">
                                            <AlertTriangle className="w-3 h-3" /> No size
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <StatusBadge stage={stage} />
                                      </td>
                                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                          {stage === 'needs_number' && (
                                            <button onClick={() => setAssigningPlayer(p)}
                                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#4BB9EC]/15 text-[#4BB9EC] hover:bg-[#4BB9EC]/25 transition">
                                              Assign
                                            </button>
                                          )}
                                          {(stage === 'ready' || stage === 'needs_size') && (
                                            <button onClick={() => setEditingPlayer(p)}
                                              className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-white/[0.06] text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                                              title="Edit">
                                              <Edit className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {stage === 'needs_size' && (
                                            <button onClick={() => {
                                              const msg = `Hi, we need ${player.first_name}'s jersey size to place the order. Please update it in the app.`
                                              navigator.clipboard?.writeText(msg)
                                              showToast?.(`Message copied for ${player.first_name}'s parent`, 'success')
                                            }}
                                              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition"
                                              title="Copy size request message">
                                              <Bell className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Right: Action Panel */}
          <div className="hidden xl:block w-[340px] shrink-0">
            <JerseyActionPanel
              selectedPlayer={selectedPlayer}
              allPlayers={players}
              conflicts={conflictCount}
              onAssign={(playerId, teamPlayerId, teamId, number, prefResult) => assignJersey(playerId, teamPlayerId, teamId, number, prefResult)}
              onUpdateSize={(playerId, size) => updateJerseySize(playerId, size)}
              onAutoAssign={handleAutoAssign}
              onClose={() => setSelectedPlayer(null)}
              showToast={showToast}
              autoAssigning={autoAssigning}
            />
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedPlayerIds.size > 0 && (
          <div className={`sticky bottom-4 z-30 rounded-2xl px-6 py-3 flex items-center justify-between shadow-xl ${
            isDark ? 'bg-lynx-navy-subtle border border-white/[0.1]' : 'bg-lynx-navy-subtle'
          }`}>
            <span className="text-white text-sm font-bold">
              {selectedPlayerIds.size} Player{selectedPlayerIds.size !== 1 ? 's' : ''} Selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const unassigned = players.filter(p => selectedPlayerIds.has(p.id) && !p.jersey_number)
                  if (unassigned.length === 0) {
                    showToast('All selected players already have numbers', 'info')
                    return
                  }
                  handleAutoAssign()
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4BB9EC] text-white hover:brightness-110 transition flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Bulk Assign Numbers
              </button>
              <button
                onClick={() => setSelectedPlayerIds(new Set())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.1] text-white hover:bg-white/[0.15] transition">
                Clear
              </button>
            </div>
          </div>
        )}
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
    </PageShell>
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
function NeedsJerseyList({ players, totalRostered, unrosteredCount, takenNumbers, selectedTeam, onAssign, onAutoAssign, autoAssigning, showToast, tc, isDark }) {
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

      {/* Individual Players — 3-col compact cards, same size, red bg for missing info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {players.map(p => {
          const player = p.player
          if (!player) return null

          const prefs = [player.jersey_pref_1, player.jersey_pref_2, player.jersey_pref_3].filter(Boolean)
          const teamTaken = new Set(
            players.filter(x => x.team_id === p.team_id && x.jersey_number).map(x => x.jersey_number)
          )
          const hasMissing = !player.uniform_size_jersey

          return (
            <div
              key={p.id}
              className={`rounded-[14px] border p-4 transition hover:shadow-md ${
                hasMissing ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: `${p.team?.color || '#888'}30`, color: p.team?.color || '#888' }}>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    `${player.first_name?.[0]}${player.last_name?.[0]}`
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{player.first_name} {player.last_name}</h4>
                  {!selectedTeam && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700">
                      {p.team?.name}
                    </span>
                  )}
                </div>
                {hasMissing && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0" title="Missing jersey size">!</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                {player.uniform_size_jersey ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {player.uniform_size_jersey}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> No size
                  </span>
                )}
                {prefs.length > 0 ? (
                  prefs.map((n, i) => (
                    <span key={i} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      teamTaken.has(n) ? 'bg-red-100 text-red-500 line-through' : 'bg-emerald-100 text-emerald-700'
                    }`}>#{n}</span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No prefs</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onAssign(p)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold bg-lynx-sky/10 text-lynx-sky hover:bg-lynx-sky/20 transition"
                >
                  Assign
                </button>
                {hasMissing && (
                  <button
                    onClick={() => {
                      const msg = `Hi, we need ${player.first_name}'s jersey size to place the order. Please update it in the app.`
                      navigator.clipboard?.writeText(msg)
                      showToast?.(`Message copied for ${player.first_name}'s parent`, 'success')
                    }}
                    className="px-3 py-2 rounded-xl text-sm bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                    title="Ask Parent for size"
                  >
                    📩
                  </button>
                )}
              </div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {players.map(p => {
        const player = p.player
        if (!player) return null

        return (
          <div key={p.id} className="bg-white border border-slate-200 rounded-[14px] p-4 transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ backgroundColor: p.team?.color || 'var(--accent-primary)' }}
              >
                {p.jersey_number}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-slate-900 text-sm truncate">{player.first_name} {player.last_name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {!selectedTeam && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700">
                      {p.team?.name}
                    </span>
                  )}
                  {player.uniform_size_jersey ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{player.uniform_size_jersey}</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-600 font-medium">No size</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                {showCheck && <span className="text-emerald-500"><Check className="w-4 h-4" /></span>}
              </div>
            </div>
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
                  {orderedPlayers.map((p, idx) => (
                    <tr key={p.id} className={`border-b ${tc.border} last:border-b-0 ${idx % 2 === 1 ? tc.zebraRow : ''}`}>
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
