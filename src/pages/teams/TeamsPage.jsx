// =============================================================================
// TeamsPage — Orchestrator: data fetching, stat row, table/card views, modals
// Sub-components: TeamsStatRow, TeamsTableView, UnrosteredAlert, NewTeamModal
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/csv-export'
import {
  Users, Calendar, Download, Plus, Shield, TrendingUp
} from 'lucide-react'
import { PlayerCardExpanded } from '../../components/players'
import { SkeletonTeamsPage } from '../../components/ui'
import TeamsStatRow from './TeamsStatRow'
import TeamsTableView from './TeamsTableView'
import UnrosteredAlert from './UnrosteredAlert'
import NewTeamModal from './NewTeamModal'
import EditTeamModal from './EditTeamModal'
import ManageRosterModal from './ManageRosterModal'
import AssignCoachesModal from './AssignCoachesModal'
import TeamDetailPanel from './TeamDetailPanel'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

// ============================================
// TEAMS PAGE
// ============================================
export function TeamsPage({ showToast, navigateToTeamWall, onNavigate, onRefreshRoles }) {
  const journey = useJourney()
  const { selectedSeason, allSeasons, seasons, loading: seasonLoading, selectSeason } = useSeason()
  const { selectedSport } = useSport()
  const { user, organization, profile } = useAuth()
  const { isDark } = useTheme()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [unrosteredPlayers, setUnrosteredPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('')
  const [editingTeam, setEditingTeam] = useState(null)
  const [rosterTeam, setRosterTeam] = useState(null)
  const [coachAssignTeam, setCoachAssignTeam] = useState(null)
  const [detailTeam, setDetailTeam] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [activeSportFilter, setActiveSportFilter] = useState('all')

  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
      loadUnrosteredPlayers()
      loadCoaches()
    }
  }, [selectedSeason?.id, selectedSport?.id])

  // ------ Supabase queries (preserved from original) ------

  async function loadTeams() {
    if (!selectedSeason?.id) return
    setLoading(true)
    let query = supabase
      .from('teams')
      .select('*, team_players(*, players(id, first_name, last_name, jersey_number, position, photo_url, grade, status, uniform_size_jersey)), season:seasons(id, name, sport:sports(id, name, icon))')
    if (!isAllSeasons(selectedSeason)) {
      query = query.eq('season_id', selectedSeason.id)
    } else if (selectedSport?.id) {
      const sportSeasonIds = (allSeasons || [])
        .filter(s => s.sport_id === selectedSport.id)
        .map(s => s.id)
      if (sportSeasonIds.length === 0) {
        setTeams([])
        setLoading(false)
        return
      }
      query = query.in('season_id', sportSeasonIds)
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
    setLoading(false)
    await syncRosteredStatus(data || [])
  }

  async function syncRosteredStatus(teamsData) {
    try {
      const rosteredPlayerIds = []
      teamsData.forEach(team => {
        team.team_players?.forEach(tp => {
          if (tp.player_id) rosteredPlayerIds.push(tp.player_id)
        })
      })
      if (rosteredPlayerIds.length === 0) return
      const { data: regs } = await supabase
        .from('registrations')
        .select('id, player_id, status')
        .in('player_id', rosteredPlayerIds)
        .neq('status', 'rostered')
      if (!regs || regs.length === 0) return
      const regIds = regs.map(r => r.id)
      await supabase
        .from('registrations')
        .update({ status: 'rostered', updated_at: new Date().toISOString() })
        .in('id', regIds)
    } catch (err) {
      console.error('Error syncing rostered status:', err)
    }
  }

  async function loadUnrosteredPlayers() {
    if (!selectedSeason?.id) return
    const sportSeasonIds = (isAllSeasons(selectedSeason) && selectedSport?.id)
      ? (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
      : null
    let playersQuery = supabase
      .from('players')
      .select('id, first_name, last_name, position, jersey_number, photo_url, grade, registrations(status)')
    if (!isAllSeasons(selectedSeason)) {
      playersQuery = playersQuery.eq('season_id', selectedSeason.id)
    } else if (sportSeasonIds && sportSeasonIds.length === 0) {
      setUnrosteredPlayers([])
      return
    } else if (sportSeasonIds) {
      playersQuery = playersQuery.in('season_id', sportSeasonIds)
    } else {
      // All Seasons + no sport → filter by ALL org season IDs
      const orgSeasonIds = (allSeasons || []).map(s => s.id)
      if (orgSeasonIds.length === 0) {
        setUnrosteredPlayers([])
        return
      }
      playersQuery = playersQuery.in('season_id', orgSeasonIds)
    }
    const { data: allPlayers } = await playersQuery
    const approvedPlayers = (allPlayers || []).filter(p => {
      const status = p.registrations?.[0]?.status
      return ['approved', 'rostered', 'active'].includes(status)
    })
    let rosteredQuery = supabase
      .from('team_players')
      .select('player_id, teams!inner(season_id)')
    if (!isAllSeasons(selectedSeason)) {
      rosteredQuery = rosteredQuery.eq('teams.season_id', selectedSeason.id)
    }
    const { data: rostered } = await rosteredQuery
    const rosteredIds = new Set(rostered?.map(r => r.player_id) || [])
    setUnrosteredPlayers(approvedPlayers.filter(p => !rosteredIds.has(p.id)))
  }

  async function createTeam(formData) {
    // Guard: require a selected season before creating a team
    if (!selectedSeason?.id) {
      showToast('Please select or create a season before adding teams.', 'error')
      return
    }

    try {
      // Clean empty strings to null for nullable Postgres columns
      const clean = (v) => (v === '' || v === undefined) ? null : v

      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          season_id: selectedSeason.id,
          name: formData.name,
          abbreviation: clean(formData.abbreviation),
          color: formData.color,
          logo_url: clean(formData.logo_url),
          age_group: clean(formData.age_group),
          age_group_type: clean(formData.age_group_type),
          team_type: clean(formData.team_type),
          skill_level: clean(formData.skill_level),
          gender: clean(formData.gender),
          max_roster_size: formData.max_roster_size,
          min_roster_size: formData.min_roster_size,
          roster_open: formData.roster_open,
          description: clean(formData.description),
          internal_notes: clean(formData.internal_notes)
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating team:', error)
        showToast('Error creating team: ' + error.message, 'error')
        return
      }

      const createdItems = ['team']

      if (formData.create_team_chat) {
        const { data: teamChatData, error: chatError } = await supabase.from('chat_channels').insert({
          season_id: selectedSeason.id,
          team_id: newTeam.id,
          name: `${formData.name} - Team Chat`,
          description: 'Chat for parents and coaches',
          channel_type: 'team_chat',
          created_by: user?.id
        }).select().single()
        if (!chatError && teamChatData) {
          createdItems.push('team chat')
          // Add creating admin as channel member
          await supabase.from('channel_members').insert({
            channel_id: teamChatData.id, user_id: user?.id,
            member_role: 'admin', display_name: profile?.full_name || 'Admin',
            can_post: true, can_moderate: true
          })
        }
      }

      if (formData.create_player_chat) {
        const { data: playerChatData, error: playerChatError } = await supabase.from('chat_channels').insert({
          season_id: selectedSeason.id,
          team_id: newTeam.id,
          name: `${formData.name} - Player Chat`,
          description: 'Chat for players and coaches',
          channel_type: 'player_chat',
          created_by: user?.id
        }).select().single()
        if (!playerChatError && playerChatData) {
          createdItems.push('player chat')
          // Add creating admin as channel member
          await supabase.from('channel_members').insert({
            channel_id: playerChatData.id, user_id: user?.id,
            member_role: 'admin', display_name: profile?.full_name || 'Admin',
            can_post: true, can_moderate: true
          })
        }
      }

      if (formData.create_team_wall) createdItems.push('team wall')

      showToast(`Created: ${createdItems.join(', ')}!`, 'success')
      journey?.completeStep('add_teams')
      setShowNewTeamModal(false)
      loadTeams()
    } catch (err) {
      console.error('Unexpected error creating team:', err)
      showToast('Unexpected error creating team', 'error')
      setShowNewTeamModal(false)
    }
  }

  async function deleteTeam(teamId) {
    if (!confirm('Delete this team? Players will be unrostered.')) return
    await supabase.from('team_players').delete().eq('team_id', teamId)
    await supabase.from('teams').delete().eq('id', teamId)
    showToast('Team deleted', 'success')
    loadTeams()
    loadUnrosteredPlayers()
  }

  async function addPlayerToTeam(teamId, playerId) {
    await supabase.from('team_players').insert({ team_id: teamId, player_id: playerId })
    const { data: reg } = await supabase
      .from('registrations')
      .select('id')
      .eq('player_id', playerId)
      .maybeSingle()
    if (reg) {
      await supabase.from('registrations').update({
        status: 'rostered',
        updated_at: new Date().toISOString()
      }).eq('id', reg.id)
    }
    await autoAddMemberToTeamChannels(teamId, playerId)
    showToast('Player added to team and rostered', 'success')
    journey?.completeStep('register_players')
    journey?.completeStep('add_roster')
    loadTeams()
    loadUnrosteredPlayers()
  }

  async function autoAddMemberToTeamChannels(teamId, playerId) {
    try {
      const { data: player } = await supabase
        .from('players')
        .select('id, first_name, last_name, parent_account_id')
        .eq('id', playerId)
        .single()
      if (!player) return
      const { data: channels } = await supabase
        .from('chat_channels')
        .select('id, channel_type')
        .eq('team_id', teamId)
        .in('channel_type', ['team_chat', 'player_chat'])
      if (!channels || channels.length === 0) return

      if (player.parent_account_id) {
        const teamChat = channels.find(c => c.channel_type === 'team_chat')
        if (teamChat) {
          const { data: existing } = await supabase
            .from('channel_members')
            .select('id')
            .eq('channel_id', teamChat.id)
            .eq('user_id', player.parent_account_id)
            .maybeSingle()
          if (!existing) {
            await supabase.from('channel_members').insert({
              channel_id: teamChat.id,
              user_id: player.parent_account_id,
              display_name: `${player.first_name}'s Parent`,
              member_role: 'parent',
              can_post: true
            })
          }
        }
        const playerChat = channels.find(c => c.channel_type === 'player_chat')
        if (playerChat) {
          const { data: existing } = await supabase
            .from('channel_members')
            .select('id')
            .eq('channel_id', playerChat.id)
            .eq('user_id', player.parent_account_id)
            .maybeSingle()
          if (!existing) {
            await supabase.from('channel_members').insert({
              channel_id: playerChat.id,
              user_id: player.parent_account_id,
              display_name: `${player.first_name}'s Parent`,
              member_role: 'parent',
              can_post: false
            })
          }
        }
      }
    } catch (err) {
      console.error('Error auto-adding member to channels:', err)
    }
  }

  async function loadCoaches() {
    if (!selectedSeason?.id) return
    let query = supabase
      .from('coaches')
      .select('*, team_coaches(*, teams(id, name))')
      .eq('status', 'active')
    if (!isAllSeasons(selectedSeason)) {
      query = query.eq('season_id', selectedSeason.id)
    } else if (selectedSport?.id) {
      const sportSeasonIds = (allSeasons || [])
        .filter(s => s.sport_id === selectedSport.id)
        .map(s => s.id)
      if (sportSeasonIds.length === 0) {
        setCoaches([])
        return
      }
      query = query.in('season_id', sportSeasonIds)
    } else {
      // All Seasons + no sport → filter by ALL org season IDs
      const orgSeasonIds = (allSeasons || []).map(s => s.id)
      if (orgSeasonIds.length === 0) {
        setCoaches([])
        return
      }
      query = query.in('season_id', orgSeasonIds)
    }
    const { data } = await query
    setCoaches(data || [])
  }

  async function toggleRosterOpen(team) {
    await supabase.from('teams').update({ roster_open: !team.roster_open }).eq('id', team.id)
    showToast(`Roster ${team.roster_open ? 'closed' : 'opened'} for ${team.name}`, 'success')
    loadTeams()
  }

  // ------ CSV export ------
  const csvColumns = [
    { label: 'Team', accessor: t => t.name },
    { label: 'Color', accessor: t => t.color },
    { label: 'Player Count', accessor: t => t.team_players?.length || 0 },
  ]

  // ------ Derived stats ------
  const totalRegistered = teams.reduce((sum, t) => sum + (t.team_players?.length || 0), 0) + unrosteredPlayers.length
  const rosteredPlayers = teams.reduce((sum, t) => sum + (t.team_players?.length || 0), 0)
  const totalMaxRoster = teams.reduce((sum, t) => sum + (t.max_roster_size || 12), 0)
  const avgHealth = teams.length > 0
    ? Math.round(teams.reduce((sum, t) => {
        const max = t.max_roster_size || 12
        const current = t.team_players?.length || 0
        return sum + (current / max) * 100
      }, 0) / teams.length)
    : 0
  const regRate = totalRegistered > 0 ? Math.round((rosteredPlayers / totalRegistered) * 100) : 0

  // Alert data
  const teamsNeedingCoaches = teams.filter(t => {
    // A team needs coaches if it has no coach assignments loaded
    // We don't have coach assignments on team objects directly, so check if team has players but no coaches
    return (t.team_players?.length || 0) > 0
  }).length // Placeholder — will refine with actual coach data
  const teamsOverCap = teams.filter(t => (t.team_players?.length || 0) > (t.max_roster_size || 12)).length

  // Sport quick filters
  const sportFilters = (() => {
    const types = {}
    teams.forEach(t => {
      const type = (t.team_type || 'rec')
      types[type] = (types[type] || 0) + 1
    })
    return [
      { key: 'all', label: 'All Teams', count: teams.length },
      ...Object.entries(types).map(([k, v]) => ({
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        count: v,
      }))
    ]
  })()
  const sportFilteredTeams = activeSportFilter === 'all'
    ? teams
    : teams.filter(t => (t.team_type || 'rec') === activeSportFilter)

  // ------ Season guards ------
  if (!selectedSeason) {
    if (seasonLoading) return <SkeletonTeamsPage />
    if (!seasons || seasons.length === 0) {
      return (
        <PageShell breadcrumb="Club Management" title="Team Management">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center max-w-md">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                <Calendar className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Your First Season</h2>
              <p className="text-slate-400 mb-6">Before you can create teams, you need to set up a season.</p>
              <button onClick={() => onNavigate?.('seasons')} className="bg-lynx-sky text-lynx-navy font-bold px-6 py-3 rounded-lg hover:brightness-110 transition">
                Create First Season
              </button>
            </div>
          </div>
        </PageShell>
      )
    }
    if (seasons.length > 0) {
      const activeSeason = seasons.find(s => s.status === 'active') || seasons[0]
      if (activeSeason) selectSeason(activeSeason)
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Selecting season...</p>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Please select a season to manage teams.</p>
      </div>
    )
  }

  // ------ Main render ------
  return (
    <PageShell
      breadcrumb="Club Management"
      title="Team Management"
      subtitle={`${selectedSeason.name} · ${teams.length} team${teams.length !== 1 ? 's' : ''} · ${totalRegistered} player${totalRegistered !== 1 ? 's' : ''}`}
      actions={
        <>
          <button
            onClick={() => exportToCSV(teams, 'teams', csvColumns)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              isDark
                ? 'bg-white/[0.06] border-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                : 'bg-white border-[#E8ECF2] text-[#10284C] hover:border-[#4BB9EC]/30 hover:shadow-sm'
            }`}
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowNewTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-lynx-navy-subtle text-white font-semibold hover:brightness-110 shadow-sm transition-all"
            style={{ fontFamily: 'var(--v2-font)' }}
          >
            <Plus className="w-4 h-4" /> New Team
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Season + age group filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <SeasonFilterBar />
          {(() => {
            const ageGroups = [...new Set(teams.map(t => t.age_group).filter(Boolean))].sort()
            if (ageGroups.length <= 1) return null
            return (
              <select
                value={selectedAgeGroup}
                onChange={e => setSelectedAgeGroup(e.target.value)}
                className={`px-3 py-2 rounded-lg border text-r-sm font-medium focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20 ${isDark ? 'border-white/10 bg-lynx-charcoal text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                <option value="">All Age Groups</option>
                {ageGroups.map(ag => <option key={ag} value={ag}>{ag}</option>)}
              </select>
            )
          })()}
        </div>

        {/* Alert Pills Row */}
        {(() => {
          const alerts = [
            unrosteredPlayers.length > 0 && { label: `${unrosteredPlayers.length} unrostered players`, color: 'amber', icon: '👥' },
            teamsOverCap > 0 && { label: `${teamsOverCap} teams over cap`, color: 'red', icon: '⚠️' },
          ].filter(Boolean)
          if (alerts.length === 0) return null
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {alerts.map((alert, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    alert.color === 'red'
                      ? isDark ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
                      : isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}
                  style={{ fontFamily: 'var(--v2-font)' }}
                >
                  <span>{alert.icon}</span> {alert.label}
                </span>
              ))}
            </div>
          )
        })()}

        {/* Sport Quick Filter Pills */}
        {sportFilters.length > 2 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Quick Filter:</span>
            {sportFilters.map(sf => (
              <button
                key={sf.key}
                onClick={() => setActiveSportFilter(sf.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeSportFilter === sf.key
                    ? 'bg-lynx-navy-subtle text-white shadow-sm'
                    : isDark
                      ? 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white'
                      : 'bg-white border border-[#E8ECF2] text-slate-500 hover:border-[#4BB9EC]/30'
                }`}
                style={{ fontFamily: 'var(--v2-font)' }}
              >
                {sf.label} <span className="ml-1 opacity-60">{sf.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main content — 2-column layout */}
        {loading ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No teams yet</h3>
            <p className={`text-base mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create your first team to start building rosters</p>
            <button onClick={() => setShowNewTeamModal(true)} className="mt-4 bg-lynx-navy text-white font-bold px-6 py-2 rounded-lg hover:brightness-110 transition">
              Create Team
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Left: Team Table */}
            <div className="flex-1 min-w-0">
              <TeamsTableView
                teams={selectedAgeGroup ? sportFilteredTeams.filter(t => t.age_group === selectedAgeGroup) : sportFilteredTeams}
                search={search}
                onSearchChange={setSearch}
                onDeleteTeam={deleteTeam}
                onNavigateToWall={navigateToTeamWall}
                onEditTeam={(team) => setEditingTeam(team)}
                onManageRoster={(team) => setRosterTeam(team)}
                onAssignCoaches={(team) => setCoachAssignTeam(team)}
                onToggleRosterOpen={toggleRosterOpen}
                onViewTeamDetail={(team) => setDetailTeam(detailTeam?.id === team.id ? null : team)}
                selectedTeamId={detailTeam?.id}
                unrosteredPlayers={unrosteredPlayers}
                onAddPlayer={addPlayerToTeam}
              />
            </div>
            {/* Right: Inline Detail Panel */}
            {detailTeam && (
              <div className="w-[360px] shrink-0 hidden xl:block">
                <TeamDetailPanel
                  team={detailTeam}
                  onClose={() => setDetailTeam(null)}
                  onEditTeam={(team) => { setDetailTeam(null); setEditingTeam(team) }}
                  onManageRoster={(team) => { setDetailTeam(null); setRosterTeam(team) }}
                  onAssignCoaches={(team) => { setDetailTeam(null); setCoachAssignTeam(team) }}
                  onToggleRosterOpen={(team) => { toggleRosterOpen(team); setDetailTeam(null) }}
                  onNavigateToWall={(teamId) => navigateToTeamWall(teamId)}
                  onDeleteTeam={(teamId) => { setDetailTeam(null); deleteTeam(teamId) }}
                  inline
                />
              </div>
            )}
          </div>
        )}

        {/* Footer Stats Strip */}
        {teams.length > 0 && (
          <div className={`flex items-center gap-8 p-5 rounded-2xl flex-wrap ${
            isDark ? 'bg-[#132240] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'
          }`} style={{ fontFamily: 'var(--v2-font)' }}>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Players</span>
              <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{rosteredPlayers}</div>
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Registration Rate</span>
              <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{regRate}%</div>
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Club Health</span>
              <div className={`text-2xl font-black ${avgHealth >= 75 ? 'text-emerald-500' : avgHealth >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{avgHealth}%</div>
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Open Spots</span>
              <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{Math.max(0, totalMaxRoster - rosteredPlayers)}</div>
            </div>
          </div>
        )}

        {/* Unrostered Queue Strip */}
        {unrosteredPlayers.length > 0 && (
          <div className={`flex items-center gap-4 p-4 rounded-xl ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            <span className={`font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              Unrostered Queue: {unrosteredPlayers.length} athlete{unrosteredPlayers.length !== 1 ? 's' : ''} pending
            </span>
            <div className="flex -space-x-1.5">
              {unrosteredPlayers.slice(0, 5).map(p => (
                <div key={p.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                  isDark ? 'border-[#132240] bg-white/[0.06] text-slate-300' : 'border-white bg-slate-100 text-slate-600'
                }`}>
                  {(p.first_name || '?').charAt(0)}{(p.last_name || '').charAt(0)}
                </div>
              ))}
              {unrosteredPlayers.length > 5 && (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                  isDark ? 'border-[#132240] bg-amber-500/20 text-amber-400' : 'border-white bg-amber-100 text-amber-600'
                }`}>
                  +{unrosteredPlayers.length - 5}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigate?.('registrations')}
              className="ml-auto text-xs font-bold text-[#4BB9EC] hover:underline"
            >
              Manage All →
            </button>
          </div>
        )}
      </div>

      {/* Modals — overlay detail panel for smaller screens */}
      {detailTeam && (
        <div className="xl:hidden">
          <TeamDetailPanel
            team={detailTeam}
            onClose={() => setDetailTeam(null)}
            onEditTeam={(team) => { setDetailTeam(null); setEditingTeam(team) }}
            onManageRoster={(team) => { setDetailTeam(null); setRosterTeam(team) }}
            onAssignCoaches={(team) => { setDetailTeam(null); setCoachAssignTeam(team) }}
            onToggleRosterOpen={(team) => { toggleRosterOpen(team); setDetailTeam(null) }}
            onNavigateToWall={(teamId) => navigateToTeamWall(teamId)}
            onDeleteTeam={(teamId) => { setDetailTeam(null); deleteTeam(teamId) }}
          />
        </div>
      )}
      {showNewTeamModal && (
        <NewTeamModal
          onClose={() => setShowNewTeamModal(false)}
          onCreate={createTeam}
        />
      )}

      {selectedPlayer && (
        <PlayerCardExpanded
          player={selectedPlayer}
          visible={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          context="roster"
          viewerRole="admin"
          seasonId={selectedSeason?.id}
          sport={selectedSeason?.sports?.name || 'volleyball'}
          isOwnChild={false}
        />
      )}

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSave={() => { setEditingTeam(null); loadTeams() }}
          showToast={showToast}
        />
      )}

      {rosterTeam && (
        <ManageRosterModal
          team={rosterTeam}
          unrosteredPlayers={unrosteredPlayers}
          onClose={() => setRosterTeam(null)}
          onAddPlayer={async (teamId, playerId) => {
            await addPlayerToTeam(teamId, playerId)
            // Refresh roster team with fresh data
            const { data: fresh } = await supabase.from('teams').select('*, team_players(*, players(*))').eq('id', teamId).single()
            if (fresh) setRosterTeam(fresh)
          }}
          onRemovePlayer={async (teamId, playerId) => {
            await supabase.from('team_players').delete().eq('team_id', teamId).eq('player_id', playerId)
            showToast('Player removed from team', 'success')
            loadTeams()
            loadUnrosteredPlayers()
            // Refresh roster team with fresh data
            const { data: fresh } = await supabase.from('teams').select('*, team_players(*, players(*))').eq('id', teamId).single()
            if (fresh) setRosterTeam(fresh)
          }}
          showToast={showToast}
        />
      )}

      {coachAssignTeam && (
        <AssignCoachesModal
          team={coachAssignTeam}
          coaches={coaches}
          onClose={() => setCoachAssignTeam(null)}
          onSave={async (teamId, assignments) => {
            const { data: existing } = await supabase
              .from('team_coaches').select('id, coach_id').eq('team_id', teamId)
            for (const ex of (existing || [])) {
              if (!assignments.find(a => a.coach_id === ex.coach_id)) {
                await supabase.from('team_coaches').delete().eq('id', ex.id)
              }
            }
            for (const a of assignments) {
              const ex = (existing || []).find(e => e.coach_id === a.coach_id)
              if (ex) await supabase.from('team_coaches').update({ role: a.role }).eq('id', ex.id)
              else await supabase.from('team_coaches').insert({ team_id: teamId, coach_id: a.coach_id, role: a.role })
            }
            showToast('Coach assignments saved', 'success')
            setCoachAssignTeam(null)
            loadTeams()
            loadCoaches()
            onRefreshRoles?.()
          }}
          showToast={showToast}
        />
      )}

    </PageShell>
  )
}
