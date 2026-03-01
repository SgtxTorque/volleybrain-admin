import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Search, ChevronDown, MoreVertical, Check, X,
  AlertTriangle, Shield, ClipboardList, ChevronUp, ArrowUpDown
} from 'lucide-react'

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

  const cardBg = isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
  const primaryText = isDark ? 'text-white' : 'text-lynx-navy'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'
  const tableBorder = isDark ? 'border-white/[0.06]' : 'border-lynx-silver'

  // Load coach's teams
  useEffect(() => { loadTeams() }, [selectedSeason?.id])

  // Load roster when team changes
  useEffect(() => { if (selectedTeam) loadRoster(selectedTeam) }, [selectedTeam?.id])

  async function loadTeams() {
    if (!user?.id || !selectedSeason?.id) { setLoading(false); return }
    try {
      const { data: coachTeams } = await supabase
        .from('team_coaches')
        .select('team_id, role, teams(id, name, color, season_id)')
        .eq('coach_id', user.id)

      const seasonTeams = (coachTeams || [])
        .filter(tc => tc.teams?.season_id === selectedSeason.id)
        .map(tc => ({ ...tc.teams, coachRole: tc.role }))

      setTeams(seasonTeams)
      if (seasonTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(seasonTeams[0])
      }
    } catch (err) {
      console.error('loadTeams error:', err)
    }
    setLoading(false)
  }

  async function loadRoster(team) {
    setLoading(true)
    try {
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('*, players(id, first_name, last_name, photo_url, position, grade, birth_date, jersey_number, jersey_pref_1, jersey_pref_2, jersey_pref_3, parent_name, parent_email, status)')
        .eq('team_id', team.id)
        .order('jersey_number', { ascending: true, nullsFirst: false })

      const playerIds = (teamPlayers || []).map(tp => tp.player_id).filter(Boolean)

      let skillRatings = {}
      if (playerIds.length > 0) {
        const { data: ratings } = await supabase
          .from('player_skill_ratings')
          .select('*')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason?.id)
          .order('rated_at', { ascending: false })
        for (const r of (ratings || [])) {
          if (!skillRatings[r.player_id]) skillRatings[r.player_id] = r
        }
      }

      let evalCounts = {}
      if (playerIds.length > 0) {
        const { data: evals } = await supabase
          .from('player_evaluations')
          .select('player_id')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason?.id)
        for (const e of (evals || [])) {
          evalCounts[e.player_id] = (evalCounts[e.player_id] || 0) + 1
        }
      }

      let waiverStatus = {}
      if (playerIds.length > 0) {
        const { data: waivers } = await supabase
          .from('waiver_signatures')
          .select('player_id, status')
          .in('player_id', playerIds)
          .eq('season_id', selectedSeason?.id)
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
            <div className="flex items-center justify-between mt-4">
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
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${secondaryText}`} />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-3 py-1.5 rounded-[10px] text-sm border w-48 ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-lynx-cloud border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`}
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

        {/* ═══ EVALUATE MODE PLACEHOLDER ═══ */}
        {viewMode === 'evaluate' && selectedTeam && (
          <div className={`${cardBg} border rounded-xl p-8 text-center`}>
            <div className={`w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <ClipboardList className="w-8 h-8 text-lynx-sky" />
            </div>
            <p className={`text-sm font-semibold ${primaryText}`}>Evaluation Mode</p>
            <p className={`text-xs mt-1 ${secondaryText}`}>Coming in Phase 3</p>
          </div>
        )}

        {/* ═══ SEASON SETUP PLACEHOLDER ═══ */}
        {viewMode === 'setup' && selectedTeam && (
          <div className={`${cardBg} border rounded-xl p-8 text-center`}>
            <div className={`w-16 h-16 rounded-xl mx-auto flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <Shield className="w-8 h-8 text-lynx-sky" />
            </div>
            <p className={`text-sm font-semibold ${primaryText}`}>Season Setup Wizard</p>
            <p className={`text-xs mt-1 ${secondaryText}`}>Coming in Phase 6</p>
          </div>
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
    </div>
  )
}
