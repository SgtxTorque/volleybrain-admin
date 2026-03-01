import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Search, ChevronDown, MoreVertical, Check, X,
  AlertTriangle, Shield, ClipboardList, ChevronUp, ArrowUpDown,
  ChevronLeft, ChevronRight, Save
} from 'lucide-react'
import PlayerDevelopmentCard from './PlayerDevelopmentCard'
import SeasonSetupWizard from './SeasonSetupWizard'

// Volleyball positions
const POSITIONS = ['OH', 'S', 'MB', 'OPP', 'L', 'DS', 'RS']
const POSITION_NAMES = {
  'OH': 'Outside Hitter', 'S': 'Setter', 'MB': 'Middle Blocker',
  'OPP': 'Opposite', 'L': 'Libero', 'DS': 'Defensive Specialist', 'RS': 'Right Side',
}

export default function RosterManagerPage({ showToast, roleContext, onNavigate }) {
  const { user, organization } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [roster, setRoster] = useState([])
  const [viewMode, setViewMode] = useState('overview') // 'overview' | 'evaluate' | 'setup'
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [rosterHealth, setRosterHealth] = useState({ total: 0, missingJersey: 0, missingPosition: 0, unsignedWaivers: 0, newPlayers: 0, needsEval: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('jersey_number')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editingJersey, setEditingJersey] = useState(null) // player_id being edited
  const [editingPosition, setEditingPosition] = useState(null)
  const [jerseyDraft, setJerseyDraft] = useState('')
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(null)

  // Evaluation mode state
  const [evalStep, setEvalStep] = useState('setup') // 'setup' | 'rating'
  const [evalType, setEvalType] = useState('mid_season')
  const [evalPlayerScope, setEvalPlayerScope] = useState('all') // 'all' | 'selected' | 'single'
  const [evalSkills, setEvalSkills] = useState(['serving', 'passing', 'setting', 'attacking', 'blocking', 'defense', 'hustle', 'coachability', 'teamwork'])
  const [evalPlayers, setEvalPlayers] = useState([])
  const [evalCurrentIndex, setEvalCurrentIndex] = useState(0)
  const [evalRatings, setEvalRatings] = useState({})
  const [evalNotes, setEvalNotes] = useState('')
  const [evalPrevious, setEvalPrevious] = useState(null)
  const [evalSaving, setEvalSaving] = useState(false)

  const cardBg = isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
  const primaryText = isDark ? 'text-white' : 'text-lynx-navy'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'
  const tableBorder = isDark ? 'border-white/[0.06]' : 'border-lynx-silver'

  // Load coach's teams — mirrors CoachDashboard pattern (which works)
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

  useEffect(() => { loadTeams() }, [coachTeamAssignments?.length, selectedSeason?.id, user?.id])

  // Load roster when team changes
  useEffect(() => { if (selectedTeam) loadRoster(selectedTeam) }, [selectedTeam?.id])

  async function loadTeams() {
    if (!user?.id) { setLoading(false); return }

    try {
      let teamIds = coachTeamAssignments.map(tc => tc.team_id).filter(Boolean)

      // If roleContext isn't populated yet, query directly
      if (teamIds.length === 0) {
        const { data: coachRecord, error: coachErr } = await supabase
          .from('coaches')
          .select('id, team_coaches(team_id, role)')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (coachErr) console.error('coaches query error:', coachErr)
        const assignments = coachRecord?.team_coaches || []
        teamIds = assignments.map(tc => tc.team_id).filter(Boolean)

        if (teamIds.length === 0) {
          setTeams([])
          setLoading(false)
          return
        }
      }

      // Fetch full team data (same as CoachDashboard line 304)
      const { data: teamData, error: teamErr } = await supabase
        .from('teams')
        .select('id, name, color, season_id, seasons(id, name)')
        .in('id', teamIds)

      if (teamErr) console.error('teams query error:', teamErr)

      // Filter to current season if one is selected, otherwise show all
      let filteredTeams = teamData || []
      if (selectedSeason?.id) {
        filteredTeams = filteredTeams.filter(t => t.season_id === selectedSeason.id)
      }

      const teamsWithRole = filteredTeams.map(t => {
        const assignment = coachTeamAssignments.find(tc => tc.team_id === t.id)
        return { ...t, coachRole: assignment?.role || 'coach' }
      })

      setTeams(teamsWithRole)
      if (teamsWithRole.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsWithRole[0])
      } else if (teamsWithRole.length > 0 && selectedTeam) {
        // If selectedTeam no longer in list (season changed), switch to first
        const stillValid = teamsWithRole.find(t => t.id === selectedTeam.id)
        if (!stillValid) setSelectedTeam(teamsWithRole[0])
      }
    } catch (err) {
      console.error('loadTeams error:', err)
    }
    setLoading(false)
  }

  async function loadRoster(team) {
    setLoading(true)
    try {
      // Match the CoachDashboard query pattern exactly (line 329 of CoachDashboard.jsx)
      const { data: teamPlayers, error: tpError } = await supabase
        .from('team_players')
        .select('*, players(id, first_name, last_name, photo_url, position, grade, birth_date, jersey_number, jersey_pref_1, jersey_pref_2, jersey_pref_3, parent_name, parent_email, status)')
        .eq('team_id', team.id)

      if (tpError) {
        console.error('team_players query error:', tpError)
        showToast?.('Failed to load roster', 'error')
        setLoading(false)
        return
      }

      const playerIds = (teamPlayers || []).map(tp => tp.player_id).filter(Boolean)

      // Enrichment queries — each is independent, failures shouldn't block roster display
      let skillRatings = {}
      if (playerIds.length > 0 && selectedSeason?.id) {
        const { data: ratings } = await supabase
          .from('player_skill_ratings')
          .select('*')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason.id)
          .order('rated_at', { ascending: false })
        for (const r of (ratings || [])) {
          if (!skillRatings[r.player_id]) skillRatings[r.player_id] = r
        }
      }

      let evalCounts = {}
      if (playerIds.length > 0 && selectedSeason?.id) {
        const { data: evals } = await supabase
          .from('player_evaluations')
          .select('player_id')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason.id)
        for (const e of (evals || [])) {
          evalCounts[e.player_id] = (evalCounts[e.player_id] || 0) + 1
        }
      }

      let waiverStatus = {}
      if (playerIds.length > 0 && selectedSeason?.id) {
        const { data: waivers } = await supabase
          .from('waiver_signatures')
          .select('player_id, status')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason.id)
        for (const w of (waivers || [])) {
          if (w.status === 'signed' || w.status === 'active') waiverStatus[w.player_id] = true
        }
      }

      let positionData = {}
      if (playerIds.length > 0) {
        const { data: positions } = await supabase
          .from('player_positions')
          .select('player_id, primary_position, secondary_position, is_captain, is_co_captain')
          .in('player_id', playerIds)
        for (const pos of (positions || [])) {
          positionData[pos.player_id] = pos
        }
      }

      const enriched = (teamPlayers || []).map(tp => ({
        ...tp,
        player: tp.players,
        skills: skillRatings[tp.player_id] || null,
        evalCount: evalCounts[tp.player_id] || 0,
        waiverSigned: !!waiverStatus[tp.player_id],
        positions: positionData[tp.player_id] || null,
        isNew: tp.joined_at && (new Date() - new Date(tp.joined_at)) < 14 * 24 * 60 * 60 * 1000,
      }))

      setRoster(enriched)

      setRosterHealth({
        total: enriched.length,
        missingJersey: enriched.filter(p => !p.jersey_number && !p.player?.jersey_number).length,
        missingPosition: enriched.filter(p => !p.player?.position && !p.positions?.primary_position).length,
        unsignedWaivers: enriched.filter(p => !p.waiverSigned).length,
        newPlayers: enriched.filter(p => p.isNew).length,
        needsEval: enriched.filter(p => p.evalCount === 0).length,
      })
    } catch (err) {
      console.error('loadRoster error:', err)
      showToast?.('Failed to load roster', 'error')
    }
    setLoading(false)
  }

  // Filtered + sorted roster
  const filteredRoster = useMemo(() => {
    let list = [...roster]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => {
        const name = `${p.player?.first_name || ''} ${p.player?.last_name || ''}`.toLowerCase()
        return name.includes(q)
      })
    }
    list.sort((a, b) => {
      let aVal, bVal
      switch (sortKey) {
        case 'jersey_number':
          aVal = a.jersey_number ?? a.player?.jersey_number ?? 9999
          bVal = b.jersey_number ?? b.player?.jersey_number ?? 9999
          break
        case 'name':
          aVal = `${a.player?.last_name || ''} ${a.player?.first_name || ''}`.toLowerCase()
          bVal = `${b.player?.last_name || ''} ${b.player?.first_name || ''}`.toLowerCase()
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        case 'position':
          aVal = a.player?.position || a.positions?.primary_position || 'ZZZ'
          bVal = b.player?.position || b.positions?.primary_position || 'ZZZ'
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        case 'rating':
          aVal = a.skills?.overall_rating ?? -1
          bVal = b.skills?.overall_rating ?? -1
          break
        default:
          aVal = 0; bVal = 0
      }
      if (typeof aVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
    return list
  }, [roster, searchQuery, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function toggleSelect(playerId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRoster.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRoster.map(p => p.player_id)))
    }
  }

  // Inline edit: save jersey number
  async function saveJersey(teamPlayerId, playerId, newNumber) {
    const num = newNumber.trim() === '' ? null : parseInt(newNumber)
    try {
      await supabase.from('team_players').update({ jersey_number: num }).eq('id', teamPlayerId)
      setRoster(prev => prev.map(p => p.id === teamPlayerId ? { ...p, jersey_number: num } : p))
      const playerName = roster.find(p => p.id === teamPlayerId)?.player
      showToast?.(`Jersey #${num || '—'} assigned to ${playerName?.first_name || 'player'}`, 'success')
    } catch (err) {
      console.error('saveJersey error:', err)
      showToast?.('Failed to update jersey number', 'error')
    }
    setEditingJersey(null)
  }

  // Inline edit: save position
  async function savePosition(playerId, newPosition) {
    try {
      await supabase.from('players').update({ position: newPosition }).eq('id', playerId)
      setRoster(prev => prev.map(p => {
        if (p.player_id === playerId) {
          return { ...p, player: { ...p.player, position: newPosition } }
        }
        return p
      }))
      const playerName = roster.find(p => p.player_id === playerId)?.player
      showToast?.(`Position updated for ${playerName?.first_name || 'player'}`, 'success')
    } catch (err) {
      console.error('savePosition error:', err)
      showToast?.('Failed to update position', 'error')
    }
    setEditingPosition(null)
  }

  // Health tile status
  function healthStatus(value, thresholds) {
    if (value === 0) return { color: isDark ? 'text-emerald-400' : 'text-emerald-600', dot: 'bg-emerald-500', label: 'OK' }
    if (value >= thresholds.bad) return { color: isDark ? 'text-red-400' : 'text-red-600', dot: 'bg-red-500', label: 'Issue' }
    return { color: isDark ? 'text-amber-400' : 'text-amber-600', dot: 'bg-amber-500', label: 'Action' }
  }

  // ═══ EVALUATION FUNCTIONS ═══

  const ALL_EVAL_SKILLS = [
    { key: 'serving', label: 'Serving' },
    { key: 'passing', label: 'Passing' },
    { key: 'setting', label: 'Setting' },
    { key: 'attacking', label: 'Attacking' },
    { key: 'blocking', label: 'Blocking' },
    { key: 'defense', label: 'Defense' },
    { key: 'hustle', label: 'Hustle' },
    { key: 'coachability', label: 'Coachability' },
    { key: 'teamwork', label: 'Teamwork' },
  ]

  function startEvaluation() {
    let players = []
    if (evalPlayerScope === 'all') {
      players = roster.map(p => p)
    } else if (evalPlayerScope === 'selected' && selectedIds.size > 0) {
      players = roster.filter(p => selectedIds.has(p.player_id))
    } else if (evalPlayerScope === 'single' && selectedPlayer) {
      players = [selectedPlayer]
    } else {
      players = roster.map(p => p)
    }
    setEvalPlayers(players)
    setEvalCurrentIndex(0)
    setEvalRatings({})
    setEvalNotes('')
    setEvalPrevious(null)
    setEvalStep('rating')
    if (players.length > 0) loadPreviousEval(players[0].player_id)
  }

  async function loadPreviousEval(playerId) {
    try {
      const { data } = await supabase
        .from('player_evaluations')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', selectedSeason?.id)
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .single()
      setEvalPrevious(data || null)
    } catch {
      setEvalPrevious(null)
    }
  }

  async function saveEvaluation(playerId, ratings, notes, evalTypeVal) {
    setEvalSaving(true)
    try {
      const ratedSkills = Object.values(ratings).filter(v => v > 0)
      const overallScore = ratedSkills.length > 0
        ? Math.round(ratedSkills.reduce((s, v) => s + v, 0) / ratedSkills.length * 10) / 10
        : 0

      // 1. Save to player_evaluations
      const skillsJson = JSON.stringify(ratings)
      await supabase.from('player_evaluations').insert({
        player_id: playerId,
        season_id: selectedSeason.id,
        evaluated_by: user.id,
        evaluation_type: evalTypeVal,
        evaluation_date: new Date().toISOString().split('T')[0],
        overall_score: Math.round(overallScore),
        skills: skillsJson,
        notes: notes || null,
        is_initial: evalTypeVal === 'tryout' || evalTypeVal === 'pre_season',
      })

      // 2. Save/update player_skill_ratings
      const ratingRow = {
        player_id: playerId,
        team_id: selectedTeam.id,
        season_id: selectedSeason.id,
        overall_rating: Math.round(overallScore),
        serving_rating: ratings.serving || null,
        passing_rating: ratings.passing || null,
        setting_rating: ratings.setting || null,
        attacking_rating: ratings.attacking || null,
        blocking_rating: ratings.blocking || null,
        defense_rating: ratings.defense || null,
        hustle_rating: ratings.hustle || null,
        coachability_rating: ratings.coachability || null,
        teamwork_rating: ratings.teamwork || null,
        coach_notes: notes || null,
        rated_by: user.id,
        rated_at: new Date().toISOString(),
      }

      const { data: existing } = await supabase
        .from('player_skill_ratings')
        .select('id')
        .eq('player_id', playerId)
        .eq('team_id', selectedTeam.id)
        .eq('season_id', selectedSeason.id)
        .limit(1)
        .single()

      if (existing) {
        await supabase.from('player_skill_ratings').update(ratingRow).eq('id', existing.id)
      } else {
        await supabase.from('player_skill_ratings').insert(ratingRow)
      }

      // 3. Update player_skills for parent/player view compatibility
      const skillsRow = {
        player_id: playerId,
        season_id: selectedSeason.id,
        sport: 'volleyball',
        passing: ratings.passing || null,
        serving: ratings.serving || null,
        hitting: ratings.attacking || null,
        blocking: ratings.blocking || null,
        setting: ratings.setting || null,
        defense: ratings.defense || null,
        skills_data: skillsJson,
      }

      const { data: existingSkills } = await supabase
        .from('player_skills')
        .select('id')
        .eq('player_id', playerId)
        .eq('season_id', selectedSeason.id)
        .limit(1)
        .single()

      if (existingSkills) {
        await supabase.from('player_skills').update({ ...skillsRow, updated_at: new Date().toISOString() }).eq('id', existingSkills.id)
      } else {
        await supabase.from('player_skills').insert(skillsRow)
      }

      // 4. Save coach note
      if (notes && notes.trim()) {
        await supabase.from('player_coach_notes').insert({
          player_id: playerId,
          coach_id: user.id,
          season_id: selectedSeason.id,
          note_type: 'skill',
          content: notes.trim(),
          is_private: true,
        })
      }

      const playerName = roster.find(p => p.player_id === playerId)?.player
      showToast?.(`Evaluation saved for ${playerName?.first_name || 'player'}`, 'success')
    } catch (err) {
      console.error('saveEvaluation error:', err)
      showToast?.('Failed to save evaluation', 'error')
    }
    setEvalSaving(false)
  }

  async function handleSaveAndNext() {
    const currentPlayer = evalPlayers[evalCurrentIndex]
    if (!currentPlayer) return
    await saveEvaluation(currentPlayer.player_id, evalRatings, evalNotes, evalType)

    if (evalCurrentIndex < evalPlayers.length - 1) {
      const nextIndex = evalCurrentIndex + 1
      setEvalCurrentIndex(nextIndex)
      setEvalRatings({})
      setEvalNotes('')
      loadPreviousEval(evalPlayers[nextIndex].player_id)
    } else {
      // Done with all players
      setEvalStep('setup')
      setViewMode('overview')
      loadRoster(selectedTeam)
      showToast?.('All evaluations completed!', 'success')
    }
  }

  function handleSkipPlayer() {
    if (evalCurrentIndex < evalPlayers.length - 1) {
      const nextIndex = evalCurrentIndex + 1
      setEvalCurrentIndex(nextIndex)
      setEvalRatings({})
      setEvalNotes('')
      loadPreviousEval(evalPlayers[nextIndex].player_id)
    } else {
      setEvalStep('setup')
      setViewMode('overview')
      loadRoster(selectedTeam)
    }
  }

  const SortIcon = ({ column }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 opacity-30" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  // Skeleton loading
  if (loading && roster.length === 0) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <div className={`${cardBg} border rounded-xl p-6 animate-pulse`}>
            <div className={`h-6 w-48 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <div className={`h-4 w-32 rounded mt-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          </div>
          <div className={`${cardBg} border rounded-xl p-4 animate-pulse`}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex items-center gap-4 py-3 ${i < 4 ? `border-b ${tableBorder}` : ''}`}>
                <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <div className={`h-3 w-20 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* ═══ PAGE HEADER ═══ */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lynx-sky/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-lynx-sky" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${primaryText}`}>Roster Manager</h1>
                <p className={`text-sm ${secondaryText}`}>{selectedSeason?.name || 'No season selected'}</p>
              </div>
            </div>

            {/* Team Selector */}
            {teams.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[10px] border text-sm font-semibold transition ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/10' : 'bg-lynx-cloud border-lynx-silver text-lynx-navy hover:bg-slate-100'}`}
                >
                  {selectedTeam && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTeam.color || '#4BB9EC' }} />
                  )}
                  {selectedTeam?.name || 'Select Team'}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showTeamDropdown && (
                  <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl shadow-lg z-30 border ${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'}`}>
                    {teams.map(t => (
                      <button key={t.id} onClick={() => { setSelectedTeam(t); setShowTeamDropdown(false); setSelectedIds(new Set()) }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition first:rounded-t-xl last:rounded-b-xl ${isDark ? 'hover:bg-white/[0.06] text-white' : 'hover:bg-lynx-cloud text-lynx-navy'} ${selectedTeam?.id === t.id ? (isDark ? 'bg-white/[0.06]' : 'bg-lynx-ice') : ''}`}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || '#4BB9EC' }} />
                        {t.name}
                        {t.coachRole === 'head' && <span className="text-xs">⭐</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ ROSTER HEALTH BAR ═══ */}
          {selectedTeam && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Players', value: rosterHealth.total, status: { color: isDark ? 'text-lynx-sky' : 'text-lynx-deep', dot: 'bg-lynx-sky', label: 'Total' } },
                { label: 'Need Jersey #', value: rosterHealth.missingJersey, status: healthStatus(rosterHealth.missingJersey, { bad: 3 }) },
                { label: 'Waiver Unsigned', value: rosterHealth.unsignedWaivers, status: healthStatus(rosterHealth.unsignedWaivers, { bad: 3 }) },
                { label: 'New Players', value: rosterHealth.newPlayers, status: { color: isDark ? 'text-lynx-sky' : 'text-lynx-deep', dot: 'bg-lynx-sky', label: 'Info' } },
                { label: 'Need Eval', value: rosterHealth.needsEval, status: healthStatus(rosterHealth.needsEval, { bad: 3 }) },
              ].map(tile => (
                <div key={tile.label} className={`rounded-xl px-3 py-2 text-center ${isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud'}`}>
                  <p className={`text-lg font-bold ${primaryText}`}>{tile.value}</p>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${secondaryText}`}>{tile.label}</p>
                  <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase ${tile.status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tile.status.dot}`} />
                    {tile.status.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ═══ MODE TABS + SEARCH ═══ */}
          {selectedTeam && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
              <div className="flex gap-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'evaluate', label: 'Evaluate' },
                  { id: 'setup', label: 'Season Setup' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setViewMode(tab.id)}
                    className={`px-4 py-1.5 rounded-[10px] text-sm font-semibold transition ${viewMode === tab.id
                      ? 'bg-lynx-sky text-white'
                      : isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-lynx-slate hover:bg-lynx-cloud'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${secondaryText}`} />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-3 py-1.5 rounded-[10px] text-sm border w-full sm:w-48 ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-lynx-cloud border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══ BULK ACTIONS BAR ═══ */}
        {selectedIds.size > 0 && (
          <div className={`${cardBg} border rounded-xl px-4 py-2.5 flex items-center gap-3`}>
            <span className={`text-sm font-semibold ${primaryText}`}>
              <Check className="w-4 h-4 inline mr-1 text-lynx-sky" />
              {selectedIds.size} selected
            </span>
            <button onClick={() => { setViewMode('evaluate'); }}
              className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-lynx-sky text-white hover:bg-lynx-deep transition">
              <ClipboardList className="w-3.5 h-3.5 inline mr-1" />
              Bulk Evaluate
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-lynx-slate hover:bg-lynx-cloud'}`}>
              Clear
            </button>
          </div>
        )}

        {/* ═══ ROSTER TABLE (Overview Mode) ═══ */}
        {viewMode === 'overview' && selectedTeam && (
          <div className={`${cardBg} border rounded-xl overflow-hidden`}>
            {filteredRoster.length === 0 && !loading ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                  <Users className="w-8 h-8 text-lynx-sky" />
                </div>
                <p className={`text-sm font-semibold ${primaryText}`}>
                  {searchQuery ? 'No players match your search' : 'No players assigned yet'}
                </p>
                <p className={`text-xs mt-1 ${secondaryText}`}>
                  {searchQuery ? 'Try a different search term' : 'Ask your admin to assign players to this team'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${tableBorder}`}>
                      <th className="w-10 px-3 py-3">
                        <input type="checkbox" checked={selectedIds.size === filteredRoster.length && filteredRoster.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-400 text-lynx-sky focus:ring-lynx-sky" />
                      </th>
                      <th className="w-12 px-2 py-3" />
                      <th className="text-left px-3 py-3">
                        <button onClick={() => toggleSort('name')} className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>
                          Player <SortIcon column="name" />
                        </button>
                      </th>
                      <th className="text-center px-3 py-3 w-16">
                        <button onClick={() => toggleSort('jersey_number')} className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>
                          # <SortIcon column="jersey_number" />
                        </button>
                      </th>
                      <th className="text-center px-3 py-3 w-20">
                        <button onClick={() => toggleSort('position')} className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>
                          Pos <SortIcon column="position" />
                        </button>
                      </th>
                      <th className="text-center px-3 py-3 w-28">
                        <button onClick={() => toggleSort('rating')} className={`flex items-center gap-1 text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>
                          Skills <SortIcon column="rating" />
                        </button>
                      </th>
                      <th className={`text-center px-3 py-3 w-16 text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>Waiver</th>
                      <th className={`text-center px-3 py-3 w-20 text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>Status</th>
                      <th className="w-10 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.map(p => {
                      const jerseyNum = p.jersey_number ?? p.player?.jersey_number
                      const position = p.player?.position || p.positions?.primary_position
                      const overallRating = p.skills?.overall_rating
                      const ratingPct = overallRating ? Math.min((overallRating / 5) * 100, 100) : 0
                      const isCaptain = p.positions?.is_captain || p.positions?.is_co_captain

                      return (
                        <tr key={p.id} className={`border-b ${tableBorder} transition ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-lynx-cloud/50'}`}>
                          {/* Checkbox */}
                          <td className="px-3 py-3">
                            <input type="checkbox" checked={selectedIds.has(p.player_id)}
                              onChange={() => toggleSelect(p.player_id)}
                              className="rounded border-slate-400 text-lynx-sky focus:ring-lynx-sky" />
                          </td>

                          {/* Photo */}
                          <td className="px-2 py-3">
                            {p.player?.photo_url ? (
                              <img src={p.player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-lynx-sky/20 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>
                                {p.player?.first_name?.[0]}{p.player?.last_name?.[0]}
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-3 py-3">
                            <button onClick={() => setSelectedPlayer(p)} className={`text-sm font-semibold text-left hover:text-lynx-sky transition ${primaryText}`}>
                              {p.player?.first_name} {p.player?.last_name}
                            </button>
                            <p className={`text-xs ${secondaryText}`}>
                              {p.player?.grade ? `${p.player.grade}` : ''}
                              {p.isNew && <span className="ml-1">🆕</span>}
                              {isCaptain && <span className="ml-1">🏆</span>}
                            </p>
                          </td>

                          {/* Jersey # — inline editable */}
                          <td className="px-3 py-3 text-center">
                            {editingJersey === p.id ? (
                              <input
                                type="text"
                                autoFocus
                                defaultValue={jerseyNum || ''}
                                className={`w-12 text-center text-sm rounded border px-1 py-0.5 ${isDark ? 'bg-white/[0.06] border-lynx-sky text-white' : 'bg-white border-lynx-sky text-lynx-navy'}`}
                                onBlur={e => saveJersey(p.id, p.player_id, e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveJersey(p.id, p.player_id, e.target.value); if (e.key === 'Escape') setEditingJersey(null) }}
                              />
                            ) : (
                              <button onClick={() => setEditingJersey(p.id)}
                                className={`text-sm font-semibold hover:text-lynx-sky transition ${jerseyNum ? primaryText : 'text-amber-500'}`}>
                                {jerseyNum || '—'}
                              </button>
                            )}
                          </td>

                          {/* Position — inline editable */}
                          <td className="px-3 py-3 text-center">
                            {editingPosition === p.player_id ? (
                              <select
                                autoFocus
                                defaultValue={position || ''}
                                onChange={e => savePosition(p.player_id, e.target.value)}
                                onBlur={() => setEditingPosition(null)}
                                className={`text-xs rounded border px-1 py-0.5 ${isDark ? 'bg-lynx-charcoal border-lynx-sky text-white' : 'bg-white border-lynx-sky text-lynx-navy'}`}
                              >
                                <option value="">—</option>
                                {POSITIONS.map(pos => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                            ) : (
                              <button onClick={() => setEditingPosition(p.player_id)}
                                className={`text-xs font-semibold hover:text-lynx-sky transition ${position ? primaryText : 'text-amber-500'}`}>
                                {position || '—'}
                              </button>
                            )}
                          </td>

                          {/* Skills */}
                          <td className="px-3 py-3">
                            {overallRating ? (
                              <div className="flex items-center gap-2">
                                <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                  <div className="h-full rounded-full bg-lynx-sky transition-all" style={{ width: `${ratingPct}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${primaryText}`}>{overallRating}/5</span>
                              </div>
                            ) : (
                              <span className={`text-xs ${secondaryText}`}>No eval</span>
                            )}
                          </td>

                          {/* Waiver */}
                          <td className="px-3 py-3 text-center">
                            {p.waiverSigned ? (
                              <span className="text-emerald-500 text-sm">✅</span>
                            ) : (
                              <span className="text-amber-500 text-sm">⚠️</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 text-center">
                            <span className={`text-xs font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Active</span>
                          </td>

                          {/* Actions */}
                          <td className="px-2 py-3 relative">
                            <button onClick={() => setShowActionMenu(showActionMenu === p.id ? null : p.id)}
                              className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'}`}>
                              <MoreVertical className={`w-4 h-4 ${secondaryText}`} />
                            </button>
                            {showActionMenu === p.id && (
                              <div className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-lg z-30 border ${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'}`}>
                                {[
                                  { label: 'View Profile', action: () => { setSelectedPlayer(p); setShowActionMenu(null) } },
                                  { label: 'Evaluate', action: () => { setViewMode('evaluate'); setShowActionMenu(null) } },
                                  { label: 'Add Note', action: () => { setSelectedPlayer(p); setShowActionMenu(null) } },
                                ].map(item => (
                                  <button key={item.label} onClick={item.action}
                                    className={`w-full text-left px-4 py-2 text-sm transition first:rounded-t-xl last:rounded-b-xl ${isDark ? 'hover:bg-white/[0.06] text-white' : 'hover:bg-lynx-cloud text-lynx-navy'}`}>
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
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

        {/* ═══ EVALUATE MODE ═══ */}
        {viewMode === 'evaluate' && selectedTeam && evalStep === 'setup' && (
          <div className={`${cardBg} border rounded-xl p-6`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                <ClipboardList className="w-5 h-5 text-lynx-sky" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${primaryText}`}>Start Evaluation</h2>
                <p className={`text-xs ${secondaryText}`}>Evaluate your players' skills</p>
              </div>
            </div>

            {/* Eval Type */}
            <div className="mb-5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${secondaryText}`}>Evaluation Type</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { id: 'tryout', label: 'Tryout' },
                  { id: 'pre_season', label: 'Pre-Season' },
                  { id: 'mid_season', label: 'Mid-Season' },
                  { id: 'end_season', label: 'End-Season' },
                  { id: 'ad_hoc', label: 'Ad Hoc' },
                ].map(t => (
                  <button key={t.id} onClick={() => setEvalType(t.id)}
                    className={`px-3 py-1.5 rounded-[10px] text-sm font-semibold transition ${evalType === t.id
                      ? 'bg-lynx-sky text-white'
                      : isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/10' : 'bg-lynx-cloud text-lynx-navy hover:bg-slate-200'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Scope */}
            <div className="mb-5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${secondaryText}`}>Players</label>
              <div className="flex gap-3 mt-2">
                {[
                  { id: 'all', label: `All roster (${roster.length})` },
                  { id: 'selected', label: `Selected (${selectedIds.size})`, disabled: selectedIds.size === 0 },
                ].map(s => (
                  <label key={s.id} className={`flex items-center gap-2 text-sm ${s.disabled ? 'opacity-40' : ''} ${primaryText}`}>
                    <input type="radio" name="evalScope" value={s.id} checked={evalPlayerScope === s.id}
                      onChange={() => setEvalPlayerScope(s.id)} disabled={s.disabled}
                      className="text-lynx-sky focus:ring-lynx-sky" />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Skills to Rate */}
            <div className="mb-6">
              <label className={`text-xs font-semibold uppercase tracking-wider ${secondaryText}`}>Skills to Rate</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_EVAL_SKILLS.map(skill => (
                  <label key={skill.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm cursor-pointer transition ${evalSkills.includes(skill.key)
                    ? 'bg-lynx-sky/10 text-lynx-sky border border-lynx-sky/30'
                    : isDark ? 'bg-white/[0.04] text-slate-400 border border-white/[0.06]' : 'bg-lynx-cloud text-lynx-slate border border-lynx-silver'
                  }`}>
                    <input type="checkbox" checked={evalSkills.includes(skill.key)}
                      onChange={e => {
                        if (e.target.checked) setEvalSkills(prev => [...prev, skill.key])
                        else setEvalSkills(prev => prev.filter(s => s !== skill.key))
                      }}
                      className="hidden" />
                    {evalSkills.includes(skill.key) ? <Check className="w-3.5 h-3.5" /> : null}
                    {skill.label}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={startEvaluation} disabled={evalSkills.length === 0}
              className="px-6 py-2.5 rounded-[10px] bg-lynx-sky text-white font-semibold hover:bg-lynx-deep transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              Start Evaluation
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══ EVALUATION RATING CARD ═══ */}
        {viewMode === 'evaluate' && selectedTeam && evalStep === 'rating' && evalPlayers.length > 0 && (() => {
          const cp = evalPlayers[evalCurrentIndex]
          if (!cp) return null
          const p = cp.player
          const jerseyNum = cp.jersey_number ?? p?.jersey_number
          const position = p?.position || cp.positions?.primary_position
          const prevSkills = evalPrevious?.skills ? (typeof evalPrevious.skills === 'string' ? JSON.parse(evalPrevious.skills) : evalPrevious.skills) : null
          const rated = Object.values(evalRatings).filter(v => v > 0)
          const overall = rated.length > 0 ? (rated.reduce((s, v) => s + v, 0) / rated.length).toFixed(1) : '—'

          return (
            <div className={`${cardBg} border rounded-xl p-6`}>
              {/* Nav bar */}
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => { setEvalStep('setup') }}
                  className={`flex items-center gap-1 text-sm font-semibold ${isDark ? 'text-slate-400 hover:text-white' : 'text-lynx-slate hover:text-lynx-navy'} transition`}>
                  <ChevronLeft className="w-4 h-4" /> Back to Setup
                </button>
                <span className={`text-sm font-semibold ${secondaryText}`}>
                  Player {evalCurrentIndex + 1} of {evalPlayers.length}
                </span>
                <button onClick={handleSkipPlayer}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold ${isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-lynx-slate hover:bg-lynx-cloud'} transition`}>
                  Skip
                </button>
              </div>

              {/* Player Info */}
              <div className="flex items-center gap-4 mb-5">
                {p?.photo_url ? (
                  <img src={p.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-lynx-sky/20 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>
                    {p?.first_name?.[0]}{p?.last_name?.[0]}
                  </div>
                )}
                <div>
                  <h3 className={`text-lg font-bold ${primaryText}`}>{p?.first_name} {p?.last_name}</h3>
                  <p className={`text-sm ${secondaryText}`}>
                    {jerseyNum ? `#${jerseyNum}` : ''}{jerseyNum && position ? ' · ' : ''}{position ? POSITION_NAMES[position] || position : ''}
                    {p?.grade ? ` · ${p.grade}` : ''}
                  </p>
                </div>
              </div>

              {/* Previous Eval */}
              {evalPrevious && (
                <div className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-white/[0.04] border border-white/[0.06]' : 'bg-lynx-cloud border border-lynx-silver'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${secondaryText}`}>
                    Previous: {evalPrevious.evaluation_type?.replace(/_/g, ' ')} · {evalPrevious.evaluation_date} · Overall: {evalPrevious.overall_score}/5
                  </p>
                  {prevSkills && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(prevSkills).map(([k, v]) => (
                        <span key={k} className={`text-xs ${secondaryText}`}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}: <strong className={primaryText}>{v}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {evalPrevious.notes && <p className={`text-xs mt-2 italic ${secondaryText}`}>"{evalPrevious.notes}"</p>}
                </div>
              )}

              {/* Skill Ratings */}
              <div className="space-y-3 mb-5">
                <p className={`text-xs font-semibold uppercase tracking-wider ${secondaryText}`}>Current Evaluation</p>
                {evalSkills.map(skillKey => {
                  const skillLabel = ALL_EVAL_SKILLS.find(s => s.key === skillKey)?.label || skillKey
                  const currentVal = evalRatings[skillKey] || 0
                  const prevVal = prevSkills?.[skillKey]

                  return (
                    <div key={skillKey} className="flex items-center gap-3">
                      <span className={`w-28 text-sm font-medium ${primaryText}`}>{skillLabel}</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setEvalRatings(prev => ({ ...prev, [skillKey]: n }))}
                            className={`w-9 h-9 rounded-full text-sm font-bold transition ${n <= currentVal
                              ? 'bg-lynx-sky text-white'
                              : isDark ? 'bg-white/[0.06] text-slate-500 hover:bg-white/10' : 'bg-lynx-cloud text-lynx-slate hover:bg-slate-200'
                            }`}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <span className={`text-sm font-bold w-8 text-center ${currentVal > 0 ? 'text-lynx-sky' : secondaryText}`}>
                        {currentVal > 0 ? currentVal : '—'}
                      </span>
                      {prevVal != null && currentVal > 0 && (
                        <span className={`text-xs ${currentVal > prevVal ? 'text-emerald-500' : currentVal < prevVal ? 'text-red-400' : secondaryText}`}>
                          {currentVal > prevVal ? '↑' : currentVal < prevVal ? '↓' : '→'} was {prevVal}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Overall Score */}
              <div className={`rounded-xl p-3 mb-5 ${isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud'}`}>
                <p className={`text-sm ${secondaryText}`}>
                  Overall: <span className={`text-lg font-bold ${primaryText}`}>{overall}</span>{overall !== '—' && ' / 5'}
                </p>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className={`text-xs font-semibold uppercase tracking-wider ${secondaryText}`}>Notes</label>
                <textarea
                  value={evalNotes}
                  onChange={e => setEvalNotes(e.target.value)}
                  rows={3}
                  placeholder="Add evaluation notes..."
                  className={`w-full mt-2 px-3 py-2 rounded-[10px] border text-sm resize-none ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`}
                />
              </div>

              {/* Save & Next */}
              <button onClick={handleSaveAndNext} disabled={evalSaving || rated.length === 0}
                className="px-6 py-2.5 rounded-[10px] bg-lynx-sky text-white font-semibold hover:bg-lynx-deep transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                {evalSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {evalCurrentIndex < evalPlayers.length - 1 ? 'Save & Next' : 'Save & Finish'}
              </button>
            </div>
          )
        })()}

        {/* ═══ SEASON SETUP WIZARD ═══ */}
        {viewMode === 'setup' && selectedTeam && (
          <SeasonSetupWizard
            roster={roster}
            teamId={selectedTeam.id}
            seasonId={selectedSeason?.id}
            onComplete={() => setViewMode('overview')}
            onStartEvaluation={() => {
              setViewMode('evaluate')
              setEvalType('pre_season')
            }}
            onReloadRoster={() => loadRoster(selectedTeam)}
            showToast={showToast}
          />
        )}

        {/* No team selected */}
        {!selectedTeam && !loading && (
          <div className={`${cardBg} border rounded-xl p-12 text-center`}>
            <div className={`w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <Users className="w-8 h-8 text-lynx-sky" />
            </div>
            <p className={`text-sm font-semibold ${primaryText}`}>No teams found</p>
            <p className={`text-xs mt-1 ${secondaryText}`}>You need to be assigned as a coach to a team to use the Roster Manager.</p>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showTeamDropdown || showActionMenu) && (
        <div className="fixed inset-0 z-20" onClick={() => { setShowTeamDropdown(false); setShowActionMenu(null) }} />
      )}

      {/* Player Development Card slide-out */}
      {selectedPlayer && (
        <PlayerDevelopmentCard
          player={selectedPlayer}
          teamId={selectedTeam?.id}
          seasonId={selectedSeason?.id}
          onClose={() => setSelectedPlayer(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
