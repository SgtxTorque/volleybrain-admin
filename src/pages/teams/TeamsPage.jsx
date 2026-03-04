// =============================================================================
// TeamsPage — Orchestrator: data fetching, stat row, table/card views, modals
// Sub-components: TeamsStatRow, TeamsTableView, UnrosteredAlert, NewTeamModal
// =============================================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/csv-export'
import {
  Users, Calendar, Download, Plus, Shield
} from 'lucide-react'
import { PlayerCardExpanded } from '../../components/players'
import { SkeletonTeamsPage } from '../../components/ui'
import TeamsStatRow from './TeamsStatRow'
import TeamsTableView from './TeamsTableView'
import UnrosteredAlert from './UnrosteredAlert'
import NewTeamModal from './NewTeamModal'

// ============================================
// TEAMS PAGE
// ============================================
export function TeamsPage({ showToast, navigateToTeamWall, onNavigate }) {
  const journey = useJourney()
  const { selectedSeason, seasons, loading: seasonLoading, selectSeason } = useSeason()
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [unrosteredPlayers, setUnrosteredPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
      loadUnrosteredPlayers()
    }
  }, [selectedSeason?.id])

  // ------ Supabase queries (preserved from original) ------

  async function loadTeams() {
    if (!selectedSeason?.id) return
    setLoading(true)
    const { data } = await supabase
      .from('teams')
      .select('*, team_players(*, players(id, first_name, last_name, jersey_number, position, photo_url, grade, status, uniform_size_jersey))')
      .eq('season_id', selectedSeason.id)
      .order('name')
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
    const { data: allPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, position, jersey_number, photo_url, grade, registrations(status)')
      .eq('season_id', selectedSeason.id)
    const approvedPlayers = (allPlayers || []).filter(p => {
      const status = p.registrations?.[0]?.status
      return ['approved', 'rostered', 'active'].includes(status)
    })
    const { data: rostered } = await supabase
      .from('team_players')
      .select('player_id, teams!inner(season_id)')
      .eq('teams.season_id', selectedSeason.id)
    const rosteredIds = new Set(rostered?.map(r => r.player_id) || [])
    setUnrosteredPlayers(approvedPlayers.filter(p => !rosteredIds.has(p.id)))
  }

  async function createTeam(formData) {
    try {
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert({
          season_id: selectedSeason.id,
          name: formData.name,
          abbreviation: formData.abbreviation || null,
          color: formData.color,
          logo_url: formData.logo_url || null,
          age_group: formData.age_group,
          age_group_type: formData.age_group_type,
          team_type: formData.team_type,
          skill_level: formData.skill_level,
          gender: formData.gender,
          max_roster_size: formData.max_roster_size,
          min_roster_size: formData.min_roster_size,
          roster_open: formData.roster_open,
          description: formData.description || null,
          internal_notes: formData.internal_notes || null
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
        const { error: chatError } = await supabase.from('chat_channels').insert({
          season_id: selectedSeason.id,
          team_id: newTeam.id,
          name: `${formData.name} - Team Chat`,
          description: 'Chat for parents and coaches',
          channel_type: 'team_chat',
          created_by: user?.id
        })
        if (!chatError) createdItems.push('team chat')
      }

      if (formData.create_player_chat) {
        const { error: playerChatError } = await supabase.from('chat_channels').insert({
          season_id: selectedSeason.id,
          team_id: newTeam.id,
          name: `${formData.name} - Player Chat`,
          description: 'Chat for players and coaches',
          channel_type: 'player_chat',
          created_by: user?.id
        })
        if (!playerChatError) createdItems.push('player chat')
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

  // ------ CSV export ------
  const csvColumns = [
    { label: 'Team', accessor: t => t.name },
    { label: 'Color', accessor: t => t.color },
    { label: 'Player Count', accessor: t => t.team_players?.length || 0 },
  ]

  // ------ Derived stats ------
  const totalRegistered = teams.reduce((sum, t) => sum + (t.team_players?.length || 0), 0) + unrosteredPlayers.length

  // ------ Season guards ------
  if (!selectedSeason) {
    if (seasonLoading) return <SkeletonTeamsPage />
    if (!seasons || seasons.length === 0) {
      return (
        <div className="w-full px-6 py-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Your First Season</h2>
            <p className="text-slate-400 mb-6">Before you can create teams, you need to set up a season.</p>
            <button onClick={() => onNavigate?.('seasons')} className="bg-lynx-sky text-lynx-navy font-bold px-6 py-3 rounded-lg hover:brightness-110 transition">
              Create First Season
            </button>
          </div>
        </div>
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
        <p className="text-slate-400">Please select a season from the sidebar</p>
      </div>
    )
  }

  // ------ Main render ------
  return (
    <div className="w-full px-6 py-6 space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Teams & Roster
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {selectedSeason.name} · {teams.length} team{teams.length !== 1 ? 's' : ''} · {totalRegistered} player{totalRegistered !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(teams, 'teams', csvColumns)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:border-lynx-sky hover:text-lynx-sky'
                : 'bg-white border-slate-200 text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
            }`}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowNewTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-lynx-sky text-lynx-navy font-bold hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" /> New Team
          </button>
        </div>
      </div>

      {/* Stat row */}
      <TeamsStatRow
        teams={teams}
        unrosteredCount={unrosteredPlayers.length}
        totalRegistered={totalRegistered}
      />

      {/* Unrostered alert (progressive disclosure) */}
      <UnrosteredAlert
        players={unrosteredPlayers}
        teams={teams}
        onAssign={addPlayerToTeam}
      />

      {/* Main content */}
      {loading ? (
        <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className={`rounded-[14px] p-12 text-center ${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'}`}>
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No teams yet</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Create your first team to start building rosters</p>
          <button onClick={() => setShowNewTeamModal(true)} className="mt-4 bg-lynx-sky text-lynx-navy font-bold px-6 py-2 rounded-lg hover:brightness-110 transition">
            Create Team
          </button>
        </div>
      ) : (
        <TeamsTableView
          teams={teams}
          search={search}
          onSearchChange={setSearch}
          onDeleteTeam={deleteTeam}
          onNavigateToWall={navigateToTeamWall}
          unrosteredPlayers={unrosteredPlayers}
          onAddPlayer={addPlayerToTeam}
        />
      )}

      {/* Modals */}
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
          sport={selectedSeason?.sport || 'volleyball'}
          isOwnChild={false}
        />
      )}
    </div>
  )
}
