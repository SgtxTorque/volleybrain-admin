import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function RosterManagerPage({ showToast, roleContext, onNavigate }) {
  const { user, organization } = useAuth()
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [roster, setRoster] = useState([])
  const [viewMode, setViewMode] = useState('overview') // 'overview' | 'evaluate' | 'setup'
  const [selectedPlayer, setSelectedPlayer] = useState(null) // opens dev card
  const [rosterHealth, setRosterHealth] = useState({ total: 0, missingJersey: 0, missingPosition: 0, unsignedWaivers: 0, newPlayers: 0, needsEval: 0 })

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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page header placeholder — Phase 2 */}
        <div className={`${isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'} border rounded-xl p-6`}>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Roster Manager</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            {selectedTeam ? `${selectedTeam.name} · ${roster.length} players` : 'Select a team to manage'}
          </p>
        </div>
      </div>
    </div>
  )
}
