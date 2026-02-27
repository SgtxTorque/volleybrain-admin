import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { exportToCSV } from '../../lib/csv-export'
import { 
  Users, User, Calendar, Trash2, X, MessageCircle, ClipboardList
} from '../../constants/icons'
import { PlayerCard, PlayerCardExpanded, positionColors } from '../../components/players'
import { SkeletonTeamsPage } from '../../components/ui'
import { ClickablePlayerName } from '../registrations/RegistrationsPage'

// ============================================
// TEAMS PAGE
// ============================================
export function TeamsPage({ showToast, navigateToTeamWall, onNavigate }) {
  const journey = useJourney()
  const { selectedSeason, seasons, loading: seasonLoading, selectSeason } = useSeason()
  const { user } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewTeamModal, setShowNewTeamModal] = useState(false)
  const [unrosteredPlayers, setUnrosteredPlayers] = useState([])
  const [showUnrosteredPanel, setShowUnrosteredPanel] = useState(false)
  const [unrosteredSearch, setUnrosteredSearch] = useState('')
  
  // Filter unrostered players by search
  const filteredUnrostered = unrosteredPlayers.filter(p => {
    if (!unrosteredSearch) return true
    const search = unrosteredSearch.toLowerCase()
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(search) ||
           p.position?.toLowerCase().includes(search)
  })
  
  // View controls
  const [viewMode, setViewMode] = useState('list') // 'list', 'cards', 'compact'
  const [showPhotos, setShowPhotos] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [expandedTeam, setExpandedTeam] = useState(null)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
      loadUnrosteredPlayers()
    }
  }, [selectedSeason?.id])

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
    
    // Auto-sync rostered status for players on teams
    await syncRosteredStatus(data || [])
  }

  // Sync registration status to 'rostered' for all players currently on teams
  async function syncRosteredStatus(teamsData) {
    try {
      // Get all player IDs currently on teams
      const rosteredPlayerIds = []
      teamsData.forEach(team => {
        team.team_players?.forEach(tp => {
          if (tp.player_id) rosteredPlayerIds.push(tp.player_id)
        })
      })
      
      if (rosteredPlayerIds.length === 0) return
      
      // Get registrations for these players that aren't already 'rostered'
      const { data: regs } = await supabase
        .from('registrations')
        .select('id, player_id, status')
        .in('player_id', rosteredPlayerIds)
        .neq('status', 'rostered')
      
      if (!regs || regs.length === 0) return
      
      // Update them to rostered
      const regIds = regs.map(r => r.id)
      await supabase
        .from('registrations')
        .update({ status: 'rostered', updated_at: new Date().toISOString() })
        .in('id', regIds)
      
      console.log(`Synced ${regs.length} players to rostered status`)
    } catch (err) {
      console.error('Error syncing rostered status:', err)
    }
  }

  async function loadUnrosteredPlayers() {
    if (!selectedSeason?.id) return
    
    // Get all players with their registration status
    const { data: allPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, position, jersey_number, photo_url, grade, registrations(status)')
      .eq('season_id', selectedSeason.id)
    
    // Filter to only APPROVED players (not pending, denied, waitlisted, etc.)
    // These are players ready to be rostered
    const approvedPlayers = (allPlayers || []).filter(p => {
      const status = p.registrations?.[0]?.status
      return ['approved', 'rostered', 'active'].includes(status)
    })
    
    // Get players already on teams
    const { data: rostered } = await supabase
      .from('team_players')
      .select('player_id, teams!inner(season_id)')
      .eq('teams.season_id', selectedSeason.id)
    
    const rosteredIds = new Set(rostered?.map(r => r.player_id) || [])
    
    // Unrostered = approved but not on a team yet
    setUnrosteredPlayers(approvedPlayers.filter(p => !rosteredIds.has(p.id)))
  }

  async function createTeam(formData) {
    try {
      // Create the team with all the new fields
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
      
      // Auto-create team chat channel (if enabled)
      if (formData.create_team_chat) {
        const { error: chatError } = await supabase.from('chat_channels').insert({
          season_id: selectedSeason.id,
          team_id: newTeam.id,
          name: `${formData.name} - Team Chat`,
          description: 'Chat for parents and coaches',
          channel_type: 'team_chat',
          created_by: user?.id
        })
        if (chatError) {
          console.error('Error creating team chat:', chatError)
        } else {
          createdItems.push('team chat')
        }
      }
      
      // Auto-create player chat channel (if enabled)
      if (formData.create_player_chat) {
        const { error: playerChatError } = await supabase.from('chat_channels').insert({
          season_id: selectedSeason.id,
          team_id: newTeam.id,
          name: `${formData.name} - Player Chat`,
          description: 'Chat for players and coaches',
          channel_type: 'player_chat',
          created_by: user?.id
        })
        if (playerChatError) {
          console.error('Error creating player chat:', playerChatError)
        } else {
          createdItems.push('player chat')
        }
      }
      
      if (formData.create_team_wall) {
        createdItems.push('team wall')
      }
      
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
    
    // Update registration status to 'rostered'
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
    
    // Auto-add player and parent to appropriate chat channels
    await autoAddMemberToTeamChannels(teamId, playerId)
    
    showToast('Player added to team and rostered', 'success')
    journey?.completeStep('register_players')  // org_director journey
    journey?.completeStep('add_roster')        // team_manager journey
    loadTeams()
    loadUnrosteredPlayers()
  }
  
  // Helper function to auto-add members to team chat channels
  async function autoAddMemberToTeamChannels(teamId, playerId) {
    try {
      // Get the player info to find parent
      const { data: player } = await supabase
        .from('players')
        .select('id, first_name, last_name, parent_account_id')
        .eq('id', playerId)
        .single()
      
      if (!player) return
      
      // Get team channels
      const { data: channels } = await supabase
        .from('chat_channels')
        .select('id, channel_type')
        .eq('team_id', teamId)
        .in('channel_type', ['team_chat', 'player_chat'])
      
      if (!channels || channels.length === 0) return
      
      // Add parent to team_chat channel (if they have an account)
      if (player.parent_account_id) {
        const teamChat = channels.find(c => c.channel_type === 'team_chat')
        if (teamChat) {
          // Check if already a member
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
        
        // Add parent to player_chat as view-only
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
              can_post: false // Parents can't post in player chat
            })
          }
        }
      }
    } catch (err) {
      console.error('Error auto-adding member to channels:', err)
    }
  }

  async function removePlayerFromTeam(teamPlayerId) {
    // Get the player_id before deleting
    const { data: teamPlayer } = await supabase
      .from('team_players')
      .select('player_id')
      .eq('id', teamPlayerId)
      .single()
    
    await supabase.from('team_players').delete().eq('id', teamPlayerId)
    
    // Update registration status back to 'approved' (no longer on a team)
    if (teamPlayer?.player_id) {
      const { data: reg } = await supabase
        .from('registrations')
        .select('id')
        .eq('player_id', teamPlayer.player_id)
        .maybeSingle()
      
      if (reg) {
        await supabase.from('registrations').update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        }).eq('id', reg.id)
      }
    }
    
    showToast('Player removed from team', 'success')
    loadTeams()
    loadUnrosteredPlayers()
  }

  const csvColumns = [
    { label: 'Team', accessor: t => t.name },
    { label: 'Color', accessor: t => t.color },
    { label: 'Player Count', accessor: t => t.team_players?.length || 0 },
  ]

  // If no season selected, show helpful state
  if (!selectedSeason) {
    // Still loading
    if (seasonLoading) {
      return <SkeletonTeamsPage />
    }

    // No seasons exist at all
    if (!seasons || seasons.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className={`w-20 h-20 rounded-full ${tc.cardBgAlt} flex items-center justify-center mx-auto mb-6`}>
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Create Your First Season</h2>
            <p className="text-slate-400 mb-6">
              Before you can create teams, you need to set up a season. Seasons help you organize your teams, players, and schedules.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('seasons')}
              className="bg-[var(--accent-primary)] text-white font-semibold px-6 py-3 rounded-xl hover:brightness-110 transition"
            >
              ➕ Create First Season
            </button>
          </div>
        </div>
      )
    }

    // Seasons exist but none selected - auto-select the first one
    if (seasons.length > 0) {
      // Auto-select the first available season
      const activeSeason = seasons.find(s => s.status === 'active') || seasons[0]
      if (activeSeason) {
        selectSeason(activeSeason)
      }
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Selecting season...</p>
            <select 
              value=""
              onChange={(e) => {
                const s = seasons.find(s => s.id === e.target.value)
                if (s) selectSeason(s)
              }}
              className={`${tc.input} rounded-xl px-4 py-2`}
            >
              <option value="">Choose a season...</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Please select a season from the sidebar</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Teams & Rosters</h1>
          <p className="text-slate-400 mt-1">Manage teams and assign players • {selectedSeason.name}</p>
        </div>
        <div className="flex gap-3">
          {/* View Controls */}
          <div className={`flex ${tc.cardBgAlt} rounded-xl p-1`}>
            {[
              { id: 'list', icon: '☰', label: 'List' },
              { id: 'cards', icon: '▦', label: 'Cards' },
              { id: 'compact', icon: '▤', label: 'Compact' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  viewMode === v.id ? 'bg-[var(--accent-primary)] text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title={v.label}
              >
                {v.icon}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPhotos(!showPhotos)}
            className={`px-3 py-2 rounded-xl text-sm transition ${
              showPhotos ? (isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm') : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-transparent text-slate-500')
            }`}
            title={showPhotos ? 'Hide Photos' : 'Show Photos'}
          >
            📷
          </button>
          <button 
            onClick={() => exportToCSV(teams, 'teams', csvColumns)}
            className={`${tc.cardBgAlt} ${tc.text} px-4 py-2 rounded-xl ${isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-200'} flex items-center gap-2`}
          >
            📥 Export
          </button>
          <button onClick={() => setShowNewTeamModal(true)} className="bg-[var(--accent-primary)] text-white font-semibold px-4 py-2 rounded-xl hover:brightness-110">
            ➕ New Team
          </button>
        </div>
      </div>

      {/* Unrostered Players Alert - Collapsible Quick-Assign Panel */}
      {unrosteredPlayers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
          {/* Header - Always visible */}
          <button 
            onClick={() => setShowUnrosteredPanel(!showUnrosteredPanel)}
            className="w-full p-4 flex items-center justify-between hover:bg-amber-500/5 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="text-left">
                <p className="text-amber-500 font-semibold">
                  {unrosteredPlayers.length} Unrostered Player{unrosteredPlayers.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-slate-400">
                  {showUnrosteredPanel ? 'Click to collapse' : 'Click to assign to teams'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!showUnrosteredPanel && unrosteredPlayers.length <= 5 && (
                <div className="hidden sm:flex gap-1">
                  {unrosteredPlayers.map(p => (
                    <span key={p.id} className="px-2 py-1 bg-amber-500/20 rounded text-xs text-amber-400">
                      {p.first_name} {p.last_name?.[0]}.
                    </span>
                  ))}
                </div>
              )}
              <span className={`text-amber-500 transition-transform ${showUnrosteredPanel ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>
          
          {/* Expanded Panel - Quick Assign Interface */}
          {showUnrosteredPanel && (
            <div className={`border-t border-amber-500/20 p-4 ${tc.cardBgAlt}`}>
              {/* Search/Filter */}
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search unrostered players..."
                  value={unrosteredSearch}
                  onChange={e => setUnrosteredSearch(e.target.value)}
                  className={`flex-1 px-3 py-2 ${tc.input} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
                <span className="text-sm text-slate-400 self-center">
                  {filteredUnrostered.length} player{filteredUnrostered.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Player List with Quick-Assign */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredUnrostered.map(player => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-3 ${tc.cardBgAlt} rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-medium">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          player.first_name?.[0]
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{player.first_name} {player.last_name}</p>
                        <p className="text-xs text-slate-400">
                          {player.position && <span className="mr-2">{player.position}</span>}
                          {player.grade && <span>Gr {player.grade}</span>}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick-Assign Dropdown */}
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          addPlayerToTeam(e.target.value, player.id)
                          e.target.value = ''
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      defaultValue=""
                    >
                      <option value="" disabled>Assign to...</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
                
                {filteredUnrostered.length === 0 && (
                  <p className="text-center text-slate-400 py-4">No players match your search</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-12 text-center`}>
          <Users className="w-12 h-12 mx-auto text-slate-500" />
          <h3 className="text-lg font-medium text-white mt-4">No teams yet</h3>
          <p className="text-slate-400 mt-2">Create your first team to start building rosters</p>
          <button onClick={() => setShowNewTeamModal(true)} className="mt-4 bg-[var(--accent-primary)] text-white font-semibold px-6 py-2 rounded-xl">
            Create Team
          </button>
        </div>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'compact' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {teams.map(team => (
            <div key={team.id} className={`${tc.cardBg} border ${tc.border} rounded-xl overflow-hidden`}>
              <div 
                className={`p-4 border-b ${tc.border} flex items-center justify-between cursor-pointer`}
                style={{ borderLeftColor: team.color, borderLeftWidth: 4 }}
                onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
              >
                <div>
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  <p className="text-xs text-slate-500">{team.team_players?.length || 0} players</p>
                </div>
                <div className="flex gap-1 items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigateToTeamWall(team.id); }} 
                    className="px-2 py-1 rounded-lg text-xs font-medium transition"
                    style={{ background: `${team.color}20`, color: team.color }}
                    title="View Team Wall"
                  >
                    🏠 Wall
                  </button>
                  <span className="text-slate-500 text-sm mx-2">{expandedTeam === team.id ? '▼' : '▶'}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              {(expandedTeam === team.id || viewMode !== 'compact') && (
                <div className={`p-4 ${viewMode === 'compact' ? '' : 'max-h-80'} overflow-y-auto`}>
                  {team.team_players?.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No players assigned</p>
                  ) : viewMode === 'cards' ? (
                    /* Card View */
                    <div className="flex flex-wrap gap-3 justify-center">
                      {team.team_players?.map(tp => (
                        <PlayerCard
                          key={tp.id}
                          player={tp.players}
                          context="roster"
                          teamColor={team.color}
                          showPhoto={showPhotos}
                          size="small"
                          onClick={() => setSelectedPlayer(tp.players)}
                        />
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="space-y-2">
                      {team.team_players?.map((tp, idx) => (
                        <div
                          key={tp.id}
                          className={`flex items-center justify-between p-2 ${idx % 2 === 1 ? tc.zebraRow : tc.cardBgAlt} rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} transition`}
                        >
                          <div className="flex items-center gap-3">
                            {showPhotos && (
                              tp.players?.photo_url ? (
                                <img src={tp.players.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center ${tc.textMuted}`}><User className="w-5 h-5" /></div>
                              )
                            )}
                            {tp.players?.jersey_number && (
                              <span className="w-6 h-6 rounded text-xs flex items-center justify-center font-bold" style={{ backgroundColor: team.color + '30', color: team.color }}>
                                {tp.players.jersey_number}
                              </span>
                            )}
                            <div>
                              <ClickablePlayerName 
                                player={tp.players}
                                onPlayerSelect={setSelectedPlayer}
                                className="text-white text-sm"
                              />
                              {tp.players?.position && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: positionColors[tp.players.position] || '#666', color: '#000' }}>
                                  {tp.players.position}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {tp.players?.grade && <span className="text-xs text-slate-500">Gr {tp.players.grade}</span>}
                            <button onClick={(e) => { e.stopPropagation(); removePlayerFromTeam(tp.id); }} className="text-slate-500 hover:text-red-400 text-xs p-1"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {unrosteredPlayers.length > 0 && (expandedTeam === team.id || viewMode !== 'compact') && (
                <div className={`p-4 border-t ${tc.border}`}>
                  <select onChange={e => { if (e.target.value) addPlayerToTeam(team.id, e.target.value); e.target.value = '' }}
                    className={`w-full ${tc.input} rounded-lg px-3 py-2 text-sm`}>
                    <option value="">+ Add player...</option>
                    {unrosteredPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewTeamModal && <NewTeamModal onClose={() => setShowNewTeamModal(false)} onCreate={createTeam} />}
      
      {/* Player Card Expanded Modal */}
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

// ============================================
// NEW TEAM MODAL
// ============================================
function NewTeamModal({ onClose, onCreate }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    color: '#FFD700',
    logo_url: '',
    age_group_type: 'age', // 'age' or 'grade'
    age_group: '',
    team_type: 'recreational',
    skill_level: 'all',
    gender: 'coed',
    max_roster_size: 12,
    min_roster_size: 6,
    roster_open: true,
    description: '',
    internal_notes: '',
    create_team_chat: true,
    create_player_chat: true,
    create_team_wall: true
  })
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic') // basic, classification, roster, settings
  const [creating, setCreating] = useState(false)

  const ageOptions = [
    '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U', 'Adult'
  ]
  
  const gradeOptions = [
    { value: '3rd', label: '3rd Grade' },
    { value: '4th', label: '4th Grade' },
    { value: '5th', label: '5th Grade' },
    { value: '6th', label: '6th Grade' },
    { value: '7th', label: '7th Grade' },
    { value: '8th', label: '8th Grade' },
    { value: '9th', label: '9th Grade (Freshman)' },
    { value: '10th', label: '10th Grade (Sophomore)' },
    { value: '11th', label: '11th Grade (Junior)' },
    { value: '12th', label: '12th Grade (Senior)' },
  ]

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `team-logo-${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('team-assets')
        .upload(fileName, file)
      
      if (error) {
        console.error('Upload error:', error)
        // If bucket doesn't exist, just store locally for now
        const reader = new FileReader()
        reader.onload = (e) => setForm({ ...form, logo_url: e.target.result })
        reader.readAsDataURL(file)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('team-assets')
          .getPublicUrl(fileName)
        setForm({ ...form, logo_url: publicUrl })
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
    setUploading(false)
  }

  async function handleCreate() {
    if (!form.name.trim() || creating) return
    setCreating(true)
    try {
      await onCreate(form)
    } catch (err) {
      console.error('Error creating team:', err)
    }
    setCreating(false)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '🏐' },
    { id: 'classification', label: 'Classification', icon: '📋' },
    { id: 'roster', label: 'Roster', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  const isValid = form.name.trim() && form.age_group

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className={`${tc.cardBg} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${tc.border} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${tc.text}`}>Create New Team</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${tc.hoverBg} ${tc.textMuted}`}><X className="w-4 h-4" /></button>
        </div>
        
        {/* Tabs */}
        <div className={`flex border-b ${tc.border}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? `${tc.text} border-b-2 border-[var(--accent-primary)]`
                  : `${tc.textMuted} hover:${tc.text}`
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              {/* Team Name */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Team Name *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g., Black Hornets Elite"
                  className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text}`} 
                />
              </div>
              
              {/* Abbreviation */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Abbreviation</label>
                <input 
                  type="text" 
                  value={form.abbreviation} 
                  onChange={e => setForm({...form, abbreviation: e.target.value.toUpperCase().slice(0, 5)})} 
                  placeholder="e.g., BHE"
                  maxLength={5}
                  className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} uppercase`} 
                />
                <p className={`text-xs ${tc.textMuted} mt-1`}>Short code for scoreboards & schedules (max 5 chars)</p>
              </div>
              
              {/* Team Color */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Team Color</label>
                <div className="flex gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl border-2 border-white/20 cursor-pointer overflow-hidden"
                    style={{ backgroundColor: form.color }}
                  >
                    <input 
                      type="color" 
                      value={form.color} 
                      onChange={e => setForm({...form, color: e.target.value})} 
                      className="w-full h-full cursor-pointer opacity-0" 
                    />
                  </div>
                  <input 
                    type="text" 
                    value={form.color} 
                    onChange={e => setForm({...form, color: e.target.value})}
                    className={`flex-1 ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} font-mono`} 
                  />
                </div>
                {/* Quick color picks */}
                <div className="flex gap-2 mt-2">
                  {['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'].map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({...form, color: c})}
                      className={`w-8 h-8 rounded-lg border-2 transition ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Team Logo */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Team Logo</label>
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <div className="relative">
                      <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                      <button
                        onClick={() => setForm({...form, logo_url: ''})}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                      >×</button>
                    </div>
                  ) : (
                    <label className={`w-20 h-20 rounded-xl ${tc.cardBgAlt} border-2 border-dashed ${tc.border} flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition`}>
                      <span className="text-2xl">📷</span>
                      <span className={`text-xs ${tc.textMuted}`}>Upload</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                  <div className={`text-sm ${tc.textMuted}`}>
                    <p>Recommended: 200x200px</p>
                    <p>PNG or JPG</p>
                    {uploading && <p className="text-[var(--accent-primary)]">Uploading...</p>}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Description</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Team bio, goals, or info for parents..."
                  rows={3}
                  className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} resize-none`} 
                />
              </div>
            </div>
          )}
          
          {/* Classification Tab */}
          {activeTab === 'classification' && (
            <div className="space-y-5">
              {/* Age Group Type Toggle */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Division Type *</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({...form, age_group_type: 'age', age_group: ''})}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                      form.age_group_type === 'age'
                        ? 'bg-[var(--accent-primary)] text-white'
                        : `${tc.cardBgAlt} ${tc.text}`
                    }`}
                  >
                    By Age (8U, 10U, etc.)
                  </button>
                  <button
                    onClick={() => setForm({...form, age_group_type: 'grade', age_group: ''})}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                      form.age_group_type === 'grade'
                        ? 'bg-[var(--accent-primary)] text-white'
                        : `${tc.cardBgAlt} ${tc.text}`
                    }`}
                  >
                    By Grade Level
                  </button>
                </div>
              </div>
              
              {/* Age Group Selection */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>
                  {form.age_group_type === 'age' ? 'Age Group *' : 'Grade Level *'}
                </label>
                {form.age_group_type === 'age' ? (
                  <div className="grid grid-cols-4 gap-2">
                    {ageOptions.map(age => (
                      <button
                        key={age}
                        onClick={() => setForm({...form, age_group: age})}
                        className={`px-4 py-3 rounded-xl font-medium transition ${
                          form.age_group === age
                            ? 'bg-[var(--accent-primary)] text-white'
                            : `${tc.cardBgAlt} ${tc.text} ${tc.hoverBg}`
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {gradeOptions.map(grade => (
                      <button
                        key={grade.value}
                        onClick={() => setForm({...form, age_group: grade.value})}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                          form.age_group === grade.value
                            ? 'bg-[var(--accent-primary)] text-white'
                            : `${tc.cardBgAlt} ${tc.text} ${tc.hoverBg}`
                        }`}
                      >
                        {grade.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Team Type */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Team Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm({...form, team_type: 'recreational'})}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      form.team_type === 'recreational'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : `border-transparent ${tc.cardBgAlt}`
                    }`}
                  >
                    <span className="text-3xl">🎉</span>
                    <p className={`font-semibold ${tc.text} mt-2`}>Recreational</p>
                    <p className={`text-xs ${tc.textMuted}`}>Fun, learning & development</p>
                  </button>
                  <button
                    onClick={() => setForm({...form, team_type: 'competitive'})}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      form.team_type === 'competitive'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : `border-transparent ${tc.cardBgAlt}`
                    }`}
                  >
                    <span className="text-3xl">🏆</span>
                    <p className={`font-semibold ${tc.text} mt-2`}>Competitive</p>
                    <p className={`text-xs ${tc.textMuted}`}>Travel, tournaments & leagues</p>
                  </button>
                </div>
              </div>
              
              {/* Gender */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Gender</label>
                <div className="flex gap-2">
                  {[
                    { value: 'girls', label: '♀ Girls' },
                    { value: 'boys', label: '♂ Boys' },
                    { value: 'coed', label: '👫 Coed' },
                  ].map(g => (
                    <button
                      key={g.value}
                      onClick={() => setForm({...form, gender: g.value})}
                      className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${
                        form.gender === g.value
                          ? 'bg-[var(--accent-primary)] text-white'
                          : `${tc.cardBgAlt} ${tc.text}`
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Skill Level */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Skill Level</label>
                <div className="flex gap-2">
                  {[
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                    { value: 'all', label: 'All Levels' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setForm({...form, skill_level: s.value})}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                        form.skill_level === s.value
                          ? 'bg-[var(--accent-primary)] text-white'
                          : `${tc.cardBgAlt} ${tc.text}`
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Roster Tab */}
          {activeTab === 'roster' && (
            <div className="space-y-5">
              {/* Max Roster Size */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>
                  Maximum Roster Size: <span className="text-[var(--accent-primary)] font-bold text-lg">{form.max_roster_size}</span>
                </label>
                <input
                  type="range"
                  min="6"
                  max="16"
                  value={form.max_roster_size}
                  onChange={e => setForm({...form, max_roster_size: parseInt(e.target.value)})}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-[var(--accent-primary)]"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((form.max_roster_size - 6) / 10) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} ${((form.max_roster_size - 6) / 10) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} 100%)`
                  }}
                />
                <div className={`flex justify-between text-xs ${tc.textMuted} mt-2`}>
                  <span>6</span>
                  <span>10</span>
                  <span className="font-medium">12 (default)</span>
                  <span>14</span>
                  <span>16</span>
                </div>
              </div>
              
              {/* Min Roster Size */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>
                  Minimum Roster Size: <span className="text-[var(--accent-primary)] font-bold text-lg">{form.min_roster_size}</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max={form.max_roster_size}
                  value={form.min_roster_size}
                  onChange={e => setForm({...form, min_roster_size: parseInt(e.target.value)})}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-[var(--accent-primary)]"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((form.min_roster_size - 4) / (form.max_roster_size - 4)) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} ${((form.min_roster_size - 4) / (form.max_roster_size - 4)) * 100}%, ${isDark ? '#334155' : '#E2E8F0'} 100%)`
                  }}
                />
                <p className={`text-xs ${tc.textMuted} mt-2`}>Minimum players needed to field a team</p>
              </div>
              
              {/* Roster Status */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Roster Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm({...form, roster_open: true})}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      form.roster_open
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : `border-transparent ${tc.cardBgAlt}`
                    }`}
                  >
                    <span className="text-2xl">🟢</span>
                    <p className={`font-semibold ${tc.text} mt-2`}>Open</p>
                    <p className={`text-xs ${tc.textMuted}`}>Accepting new players</p>
                  </button>
                  <button
                    onClick={() => setForm({...form, roster_open: false})}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      !form.roster_open
                        ? 'border-red-500 bg-red-500/10'
                        : `border-transparent ${tc.cardBgAlt}`
                    }`}
                  >
                    <span className="text-2xl">🔴</span>
                    <p className={`font-semibold ${tc.text} mt-2`}>Closed</p>
                    <p className={`text-xs ${tc.textMuted}`}>Roster is full/locked</p>
                  </button>
                </div>
              </div>
              
              {/* Roster Preview */}
              <div className={`${tc.cardBgAlt} rounded-xl p-4`}>
                <p className={`text-sm ${tc.textMuted} mb-2`}>Roster Preview</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(form.max_roster_size, 8) }).map((_, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full ${tc.cardBg} border-2 ${tc.border} flex items-center justify-center text-xs ${tc.textMuted}`}>
                        {i + 1}
                      </div>
                    ))}
                    {form.max_roster_size > 8 && (
                      <div className={`w-8 h-8 rounded-full ${tc.cardBg} border-2 ${tc.border} flex items-center justify-center text-xs ${tc.textMuted}`}>
                        +{form.max_roster_size - 8}
                      </div>
                    )}
                  </div>
                  <span className={tc.text}>{form.min_roster_size} - {form.max_roster_size} players</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Auto-create options */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-3`}>Auto-Create on Team Creation</label>
                <div className="space-y-3">
                  <label className={`flex items-center justify-between p-4 rounded-xl ${tc.cardBgAlt} cursor-pointer`}>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-7 h-7" />
                      <div>
                        <p className={`font-medium ${tc.text}`}>Team Chat</p>
                        <p className={`text-xs ${tc.textMuted}`}>Parents & coaches can message</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={form.create_team_chat} 
                      onChange={e => setForm({...form, create_team_chat: e.target.checked})}
                      className="w-5 h-5 rounded accent-[var(--accent-primary)]"
                    />
                  </label>
                  
                  <label className={`flex items-center justify-between p-4 rounded-xl ${tc.cardBgAlt} cursor-pointer`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧒</span>
                      <div>
                        <p className={`font-medium ${tc.text}`}>Player Chat</p>
                        <p className={`text-xs ${tc.textMuted}`}>Players & coaches (parents view-only)</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={form.create_player_chat} 
                      onChange={e => setForm({...form, create_player_chat: e.target.checked})}
                      className="w-5 h-5 rounded accent-[var(--accent-primary)]"
                    />
                  </label>
                  
                  <label className={`flex items-center justify-between p-4 rounded-xl ${tc.cardBgAlt} cursor-pointer`}>
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-7 h-7" />
                      <div>
                        <p className={`font-medium ${tc.text}`}>Team Wall/Page</p>
                        <p className={`text-xs ${tc.textMuted}`}>Team announcements, events & posts</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={form.create_team_wall} 
                      onChange={e => setForm({...form, create_team_wall: e.target.checked})}
                      className="w-5 h-5 rounded accent-[var(--accent-primary)]"
                    />
                  </label>
                </div>
              </div>
              
              {/* Internal Notes */}
              <div>
                <label className={`block text-sm font-medium ${tc.text} mb-2`}>Internal Notes (Admin Only)</label>
                <textarea 
                  value={form.internal_notes} 
                  onChange={e => setForm({...form, internal_notes: e.target.value})} 
                  placeholder="Notes for coaches/admins only (not visible to parents)..."
                  rows={3}
                  className={`w-full ${tc.inputBg} border ${tc.border} rounded-xl px-4 py-3 ${tc.text} resize-none`} 
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t ${tc.border} flex items-center justify-between`}>
          <div className={`text-sm ${tc.textMuted}`}>
            {!form.name && <span className="text-amber-500">⚠ Team name required</span>}
            {form.name && !form.age_group && <span className="text-amber-500">⚠ Age group required</span>}
            {form.name && form.age_group && !creating && <span className="text-emerald-500">✓ Ready to create</span>}
            {creating && <span className="text-[var(--accent-primary)]">Creating team...</span>}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={creating}
              className={`px-6 py-2 rounded-xl ${tc.cardBgAlt} ${tc.text} font-medium disabled:opacity-50`}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate} 
              disabled={!isValid || creating}
              className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
              {creating ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
