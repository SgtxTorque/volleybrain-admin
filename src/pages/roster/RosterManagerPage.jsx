// =============================================================================
// RosterManagerPage — Orchestrator
// Preserves all Supabase queries, evaluation save logic, team loading
// =============================================================================

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Users, ChevronDown, Check, ClipboardList } from 'lucide-react'

import RosterStatRow from './RosterStatRow'
import RosterTable from './RosterTable'
import RosterEvalMode from './RosterEvalMode'
import PlayerDevelopmentCard from './PlayerDevelopmentCard'
import SeasonSetupWizard from './SeasonSetupWizard'

export default function RosterManagerPage({ showToast, roleContext, onNavigate }) {
  const { user, organization } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [roster, setRoster] = useState([])
  const [viewMode, setViewMode] = useState('overview')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [rosterHealth, setRosterHealth] = useState({ total: 0, missingJersey: 0, missingPosition: 0, unsignedWaivers: 0, newPlayers: 0, needsEval: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState('jersey_number')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editingJersey, setEditingJersey] = useState(null)
  const [editingPosition, setEditingPosition] = useState(null)
  const [showTeamDropdown, setShowTeamDropdown] = useState(false)

  // Evaluation state
  const [evalStep, setEvalStep] = useState('setup')
  const [evalType, setEvalType] = useState('mid_season')
  const [evalPlayerScope, setEvalPlayerScope] = useState('all')
  const [evalSkills, setEvalSkills] = useState(['serving', 'passing', 'setting', 'attacking', 'blocking', 'defense', 'hustle', 'coachability', 'teamwork'])
  const [evalPlayers, setEvalPlayers] = useState([])
  const [evalCurrentIndex, setEvalCurrentIndex] = useState(0)
  const [evalRatings, setEvalRatings] = useState({})
  const [evalNotes, setEvalNotes] = useState('')
  const [evalPrevious, setEvalPrevious] = useState(null)
  const [evalSaving, setEvalSaving] = useState(false)

  const cardBg = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
  const coachTeamAssignments = roleContext?.coachInfo?.team_coaches || []

  useEffect(() => { loadTeams() }, [coachTeamAssignments?.length, selectedSeason?.id, user?.id])
  useEffect(() => { if (selectedTeam) loadRoster(selectedTeam) }, [selectedTeam?.id])

  // ========== DATA LOADING ==========

  async function loadTeams() {
    if (!user?.id) { setLoading(false); return }
    try {
      let teamIds = coachTeamAssignments.map(tc => tc.team_id).filter(Boolean)
      if (teamIds.length === 0) {
        const { data: coachRecord } = await supabase.from('coaches').select('id, team_coaches(team_id, role)').eq('profile_id', user.id).maybeSingle()
        teamIds = (coachRecord?.team_coaches || []).map(tc => tc.team_id).filter(Boolean)
        if (teamIds.length === 0) { setTeams([]); setLoading(false); return }
      }
      const { data: teamData } = await supabase.from('teams').select('id, name, color, season_id, seasons(id, name)').in('id', teamIds)
      let filtered = teamData || []
      if (selectedSeason?.id) filtered = filtered.filter(t => t.season_id === selectedSeason.id)
      const teamsWithRole = filtered.map(t => ({ ...t, coachRole: coachTeamAssignments.find(tc => tc.team_id === t.id)?.role || 'coach' }))
      setTeams(teamsWithRole)
      if (teamsWithRole.length > 0 && !selectedTeam) setSelectedTeam(teamsWithRole[0])
      else if (teamsWithRole.length > 0 && selectedTeam && !teamsWithRole.find(t => t.id === selectedTeam.id)) setSelectedTeam(teamsWithRole[0])
    } catch (err) { console.error('loadTeams error:', err) }
    setLoading(false)
  }

  async function loadRoster(team) {
    setLoading(true)
    try {
      const { data: teamPlayers, error: tpError } = await supabase
        .from('team_players')
        .select('*, players(id, first_name, last_name, photo_url, position, grade, birth_date, jersey_number, jersey_pref_1, jersey_pref_2, jersey_pref_3, parent_name, parent_email, status)')
        .eq('team_id', team.id)
      if (tpError) { showToast?.('Failed to load roster', 'error'); setLoading(false); return }

      const playerIds = (teamPlayers || []).map(tp => tp.player_id).filter(Boolean)
      let skillRatings = {}, evalCounts = {}, waiverStatus = {}, positionData = {}

      if (playerIds.length > 0 && selectedSeason?.id) {
        try {
          const { data: ratings } = await supabase.from('player_skill_ratings').select('*').in('player_id', playerIds).eq('season_id', selectedSeason.id).order('rated_at', { ascending: false })
          for (const r of (ratings || [])) { if (!skillRatings[r.player_id]) skillRatings[r.player_id] = r }
        } catch (e) { console.warn('skill_ratings error:', e) }
        try {
          const { data: evals } = await supabase.from('player_evaluations').select('player_id').in('player_id', playerIds).eq('season_id', selectedSeason.id)
          for (const e of (evals || [])) { evalCounts[e.player_id] = (evalCounts[e.player_id] || 0) + 1 }
        } catch (e) { console.warn('player_evaluations error:', e) }
        try {
          const { data: waivers } = await supabase.from('waiver_signatures').select('player_id, status').in('player_id', playerIds).eq('season_id', selectedSeason.id)
          for (const w of (waivers || [])) { if (w.status === 'signed' || w.status === 'active') waiverStatus[w.player_id] = true }
        } catch (e) { console.warn('waiver_signatures error:', e) }
      }
      if (playerIds.length > 0) {
        try {
          const { data: positions } = await supabase.from('player_positions').select('player_id, primary_position, secondary_position, is_captain, is_co_captain').in('player_id', playerIds)
          for (const pos of (positions || [])) { positionData[pos.player_id] = pos }
        } catch (e) { console.warn('player_positions error:', e) }
      }

      const enriched = (teamPlayers || []).map(tp => ({
        ...tp, player: tp.players, skills: skillRatings[tp.player_id] || null,
        evalCount: evalCounts[tp.player_id] || 0, waiverSigned: !!waiverStatus[tp.player_id],
        positions: positionData[tp.player_id] || null,
        isNew: tp.joined_at && (new Date() - new Date(tp.joined_at)) < 14 * 24 * 60 * 60 * 1000,
      }))
      setRoster(enriched)
      setRosterHealth({
        total: enriched.length, missingJersey: enriched.filter(p => !p.jersey_number && !p.player?.jersey_number).length,
        missingPosition: enriched.filter(p => !p.player?.position && !p.positions?.primary_position).length,
        unsignedWaivers: enriched.filter(p => !p.waiverSigned).length,
        newPlayers: enriched.filter(p => p.isNew).length, needsEval: enriched.filter(p => p.evalCount === 0).length,
      })
    } catch (err) { console.error('loadRoster error:', err); showToast?.('Failed to load roster', 'error') }
    setLoading(false)
  }

  // ========== FILTERED + SORTED ==========

  const filteredRoster = useMemo(() => {
    let list = [...roster]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p => `${p.player?.first_name || ''} ${p.player?.last_name || ''}`.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      let aVal, bVal
      switch (sortKey) {
        case 'jersey_number':
          aVal = a.jersey_number ?? a.player?.jersey_number ?? 9999
          bVal = b.jersey_number ?? b.player?.jersey_number ?? 9999; break
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
          bVal = b.skills?.overall_rating ?? -1; break
        default: aVal = 0; bVal = 0
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
    return list
  }, [roster, searchQuery, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function toggleSelect(playerId) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(playerId) ? n.delete(playerId) : n.add(playerId); return n })
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.size === filteredRoster.length ? new Set() : new Set(filteredRoster.map(p => p.player_id)))
  }

  // ========== INLINE EDIT ==========

  async function saveJersey(teamPlayerId, playerId, newNumber) {
    const num = newNumber.trim() === '' ? null : parseInt(newNumber)
    try {
      await supabase.from('team_players').update({ jersey_number: num }).eq('id', teamPlayerId)
      setRoster(prev => prev.map(p => p.id === teamPlayerId ? { ...p, jersey_number: num } : p))
      const name = roster.find(p => p.id === teamPlayerId)?.player
      showToast?.(`Jersey #${num || '—'} assigned to ${name?.first_name || 'player'}`, 'success')
    } catch (err) { showToast?.('Failed to update jersey number', 'error') }
    setEditingJersey(null)
  }

  async function savePosition(playerId, newPosition) {
    try {
      await supabase.from('players').update({ position: newPosition }).eq('id', playerId)
      setRoster(prev => prev.map(p => p.player_id === playerId ? { ...p, player: { ...p.player, position: newPosition } } : p))
      showToast?.(`Position updated`, 'success')
    } catch (err) { showToast?.('Failed to update position', 'error') }
    setEditingPosition(null)
  }

  // ========== EVALUATION FUNCTIONS ==========

  function startEvaluation() {
    let source = evalPlayerScope === 'selected' && selectedIds.size > 0
      ? roster.filter(p => selectedIds.has(p.player_id))
      : roster

    const players = source.filter(tp => tp.player_id && (tp.players || tp.player)).map(tp => {
      const p = tp.players || tp.player
      return {
        id: tp.player_id, player_id: tp.player_id,
        first_name: p?.first_name || 'Unknown', last_name: p?.last_name || '',
        photo_url: p?.photo_url || null, position: p?.position || tp.positions?.primary_position || null,
        grade: p?.grade || null, jersey_number: tp.jersey_number ?? p?.jersey_number ?? null,
        skills: tp.skills, evalCount: tp.evalCount || 0,
      }
    })

    if (players.length === 0) { showToast?.('No players found to evaluate', 'error'); return }
    setEvalPlayers(players); setEvalCurrentIndex(0); setEvalRatings({}); setEvalNotes(''); setEvalPrevious(null); setEvalStep('rating')
    loadPreviousEval(players[0].player_id)
  }

  async function loadPreviousEval(playerId) {
    if (!playerId || !selectedSeason?.id) { setEvalPrevious(null); return }
    try {
      const { data } = await supabase.from('player_evaluations').select('*').eq('player_id', playerId).eq('season_id', selectedSeason.id).order('evaluation_date', { ascending: false }).limit(1).maybeSingle()
      setEvalPrevious(data || null)
    } catch { setEvalPrevious(null) }
  }

  async function saveEvaluation(playerId, ratings, notes, evalTypeVal) {
    setEvalSaving(true)
    try {
      const ratedSkills = Object.values(ratings).filter(v => v > 0)
      const overallScore = ratedSkills.length > 0 ? Math.round(ratedSkills.reduce((s, v) => s + v, 0) / ratedSkills.length * 10) / 10 : 0
      const skillsJson = JSON.stringify(ratings)

      await supabase.from('player_evaluations').insert({
        player_id: playerId, season_id: selectedSeason.id, evaluated_by: user.id,
        evaluation_type: evalTypeVal, evaluation_date: new Date().toISOString().split('T')[0],
        overall_score: Math.round(overallScore), skills: skillsJson, notes: notes || null,
        is_initial: evalTypeVal === 'tryout' || evalTypeVal === 'pre_season',
      })

      const ratingRow = {
        player_id: playerId, team_id: selectedTeam.id, season_id: selectedSeason.id,
        overall_rating: Math.round(overallScore),
        serving_rating: ratings.serving || null, passing_rating: ratings.passing || null,
        setting_rating: ratings.setting || null, attacking_rating: ratings.attacking || null,
        blocking_rating: ratings.blocking || null, defense_rating: ratings.defense || null,
        hustle_rating: ratings.hustle || null, coachability_rating: ratings.coachability || null,
        teamwork_rating: ratings.teamwork || null, coach_notes: notes || null,
        rated_by: user.id, rated_at: new Date().toISOString(),
      }
      const { data: existing } = await supabase.from('player_skill_ratings').select('id').eq('player_id', playerId).eq('team_id', selectedTeam.id).eq('season_id', selectedSeason.id).limit(1).maybeSingle()
      if (existing) await supabase.from('player_skill_ratings').update(ratingRow).eq('id', existing.id)
      else await supabase.from('player_skill_ratings').insert(ratingRow)

      const skillsRow = {
        player_id: playerId, season_id: selectedSeason.id, sport: 'volleyball',
        passing: ratings.passing || null, serving: ratings.serving || null,
        hitting: ratings.attacking || null, blocking: ratings.blocking || null,
        setting: ratings.setting || null, defense: ratings.defense || null,
        skills_data: skillsJson, updated_at: new Date().toISOString(),
      }
      const { data: existingSkills } = await supabase.from('player_skills').select('id').eq('player_id', playerId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (existingSkills) await supabase.from('player_skills').update(skillsRow).eq('id', existingSkills.id)
      else await supabase.from('player_skills').insert({ ...skillsRow, created_at: new Date().toISOString() })

      if (notes?.trim()) {
        await supabase.from('player_coach_notes').insert({
          player_id: playerId, coach_id: user.id, season_id: selectedSeason.id,
          note_type: 'skill', content: notes.trim(), is_private: true,
        })
      }
      showToast?.(`Evaluation saved`, 'success')
    } catch (err) { showToast?.('Failed to save evaluation', 'error') }
    setEvalSaving(false)
  }

  async function handleSaveAndNext() {
    const current = evalPlayers[evalCurrentIndex]
    if (!current) return
    await saveEvaluation(current.player_id, evalRatings, evalNotes, evalType)
    if (evalCurrentIndex < evalPlayers.length - 1) {
      const next = evalCurrentIndex + 1
      setEvalCurrentIndex(next); setEvalRatings({}); setEvalNotes(''); loadPreviousEval(evalPlayers[next].player_id)
    } else {
      setEvalStep('setup'); setViewMode('overview'); loadRoster(selectedTeam); showToast?.('All evaluations completed!', 'success')
    }
  }

  function handleSkipPlayer() {
    if (evalCurrentIndex < evalPlayers.length - 1) {
      const next = evalCurrentIndex + 1
      setEvalCurrentIndex(next); setEvalRatings({}); setEvalNotes(''); loadPreviousEval(evalPlayers[next].player_id)
    } else { setEvalStep('setup'); setViewMode('overview'); loadRoster(selectedTeam) }
  }

  // ========== COMPUTED ==========

  const waiverPct = rosterHealth.total > 0
    ? Math.round(((rosterHealth.total - rosterHealth.unsignedWaivers) / rosterHealth.total) * 100) : 0

  // ========== SKELETON ==========

  if (loading && roster.length === 0) {
    return (
      <div className="w-full px-6 py-6 space-y-4">
        <div className={`${cardBg} rounded-[14px] p-6 animate-pulse`}>
          <div className={`h-6 w-48 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          <div className={`h-4 w-32 rounded mt-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
        </div>
      </div>
    )
  }

  // ========== RENDER ==========

  return (
    <div className="w-full px-6 py-6 space-y-5">
      {/* Click-outside overlay */}
      {showTeamDropdown && <div className="fixed inset-0 z-20" onClick={() => setShowTeamDropdown(false)} />}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Roster Manager</h1>
          <p className="text-slate-400 text-sm mt-0.5">{selectedSeason?.name || 'No season selected'}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Team Selector */}
          {teams.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                {selectedTeam && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedTeam.color || '#4BB9EC' }} />}
                {selectedTeam?.name || 'Select Team'} <ChevronDown className="w-4 h-4" />
              </button>
              {showTeamDropdown && (
                <div className={`absolute right-0 top-full mt-1 w-56 rounded-xl shadow-lg z-30 border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
                  {teams.map(t => (
                    <button key={t.id} onClick={() => { setSelectedTeam(t); setShowTeamDropdown(false); setSelectedIds(new Set()) }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition first:rounded-t-xl last:rounded-b-xl ${isDark ? 'hover:bg-white/[0.06] text-white' : 'hover:bg-slate-50 text-slate-900'} ${selectedTeam?.id === t.id ? (isDark ? 'bg-white/[0.06]' : 'bg-slate-50') : ''}`}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || '#4BB9EC' }} />
                      {t.name} {t.coachRole === 'head' && <span className="text-xs text-amber-500">HC</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode Tabs */}
          {selectedTeam && (
            <div className={`flex rounded-xl p-1 ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'evaluate', label: 'Evaluate' },
                { id: 'setup', label: 'Setup' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setViewMode(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === tab.id ? 'bg-lynx-sky text-lynx-navy' : 'text-slate-400 hover:text-slate-300'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stat Row */}
      {selectedTeam && viewMode === 'overview' && (
        <RosterStatRow rosterHealth={rosterHealth} waiverPct={waiverPct} needsEvalCount={rosterHealth.needsEval} />
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && viewMode === 'overview' && (
        <div className={`${cardBg} rounded-[14px] p-4 flex items-center gap-3`}>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Check className="w-4 h-4 inline mr-1 text-lynx-sky" /> {selectedIds.size} selected
          </span>
          <button onClick={() => setViewMode('evaluate')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-lynx-sky text-lynx-navy hover:bg-lynx-sky/80">
            <ClipboardList className="w-3.5 h-3.5 inline mr-1" /> Bulk Evaluate
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/[0.04]">
            Clear
          </button>
        </div>
      )}

      {/* Overview: Roster Table */}
      {viewMode === 'overview' && selectedTeam && (
        <RosterTable
          filteredRoster={filteredRoster} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          sortKey={sortKey} sortDir={sortDir} toggleSort={toggleSort}
          selectedIds={selectedIds} toggleSelectAll={toggleSelectAll} toggleSelect={toggleSelect}
          editingJersey={editingJersey} setEditingJersey={setEditingJersey}
          editingPosition={editingPosition} setEditingPosition={setEditingPosition}
          saveJersey={saveJersey} savePosition={savePosition}
          onPlayerSelect={setSelectedPlayer} onEvaluate={() => setViewMode('evaluate')} loading={loading}
        />
      )}

      {/* Evaluate Mode */}
      {viewMode === 'evaluate' && selectedTeam && (
        <RosterEvalMode
          evalStep={evalStep} evalType={evalType} setEvalType={setEvalType}
          evalPlayerScope={evalPlayerScope} setEvalPlayerScope={setEvalPlayerScope}
          evalSkills={evalSkills} setEvalSkills={setEvalSkills}
          evalPlayers={evalPlayers} evalCurrentIndex={evalCurrentIndex}
          evalRatings={evalRatings} setEvalRatings={setEvalRatings}
          evalNotes={evalNotes} setEvalNotes={setEvalNotes}
          evalPrevious={evalPrevious} evalSaving={evalSaving}
          rosterLength={roster.length} selectedIdsSize={selectedIds.size}
          onStartEvaluation={startEvaluation} onSaveAndNext={handleSaveAndNext}
          onSkipPlayer={handleSkipPlayer} onBackToSetup={() => setEvalStep('setup')}
        />
      )}

      {/* Season Setup Wizard */}
      {viewMode === 'setup' && selectedTeam && (
        <SeasonSetupWizard roster={roster} teamId={selectedTeam.id} seasonId={selectedSeason?.id}
          onComplete={() => setViewMode('overview')}
          onStartEvaluation={() => { setViewMode('evaluate'); setEvalType('pre_season') }}
          onReloadRoster={() => loadRoster(selectedTeam)} showToast={showToast} />
      )}

      {/* No Team */}
      {!selectedTeam && !loading && (
        <div className={`${cardBg} rounded-[14px] p-12 text-center`}>
          <Users className={`w-12 h-12 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-bold mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>No teams found</h3>
          <p className="text-slate-400 mt-1 text-sm">You need to be assigned as a coach to use Roster Manager.</p>
        </div>
      )}

      {/* Player Development Card slide-out */}
      {selectedPlayer && (
        <PlayerDevelopmentCard player={selectedPlayer} teamId={selectedTeam?.id} seasonId={selectedSeason?.id}
          onClose={() => setSelectedPlayer(null)} showToast={showToast} />
      )}
    </div>
  )
}
