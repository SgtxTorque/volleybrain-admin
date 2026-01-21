import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { 
  Users, Calendar, Clock, Check, X, AlertTriangle, ChevronDown, ChevronUp
} from '../../constants/icons'
import { PlayerCard, PlayerCardExpanded } from '../../components/players'

// Helper - format time to 12hr
function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  } catch {
    return timeStr
  }
}

// Clickable player name component
function ClickablePlayerName({ player, onPlayerSelect, className = '' }) {
  if (!player) return null
  return (
    <span 
      className={`cursor-pointer hover:text-[var(--accent-primary)] hover:underline ${className}`}
      onClick={(e) => {
        e.stopPropagation()
        onPlayerSelect?.(player)
      }}
    >
      {player.first_name} {player.last_name}
    </span>
  )
}

function AttendancePage({ showToast }) {
  const { organization, user } = useAuth()
  const { selectedSeason } = useSeason()
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [teamPlayers, setTeamPlayers] = useState([])
  const [viewMode, setViewMode] = useState('upcoming') // 'upcoming', 'past', 'all'
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState(null)
  const [availableParents, setAvailableParents] = useState([])
  const [volunteerAssignModal, setVolunteerAssignModal] = useState(null) // { role: 'line_judge', position: 'primary' }

  useEffect(() => {
    if (selectedSeason?.id) {
      loadTeams()
      loadEvents()
    }
  }, [selectedSeason?.id, selectedTeam, viewMode])

  async function loadTeams() {
    const { data } = await supabase
      .from('teams')
      .select('id, name, color')
      .eq('season_id', selectedSeason.id)
      .order('name')
    setTeams(data || [])
  }

  async function loadEvents() {
    setLoading(true)
    try {
      let query = supabase
        .from('schedule_events')
        .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
        .eq('season_id', selectedSeason.id)
        .order('event_date', { ascending: viewMode !== 'past' })
        .order('event_time', { ascending: true })

      if (selectedTeam !== 'all') {
        query = query.eq('team_id', selectedTeam)
      }

      const today = new Date().toISOString().split('T')[0]
      if (viewMode === 'upcoming') {
        query = query.gte('event_date', today)
      } else if (viewMode === 'past') {
        query = query.lt('event_date', today)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error

      // Load RSVP counts for each event
      const eventsWithCounts = await Promise.all((data || []).map(async (event) => {
        let counts = { yes: 0, no: 0, maybe: 0 }
        let volunteerInfo = null

        try {
          const { data: rsvpData } = await supabase
            .from('event_rsvps')
            .select('status')
            .eq('event_id', event.id)

          rsvpData?.forEach(r => {
            if (counts[r.status] !== undefined) counts[r.status]++
          })
        } catch (err) {
          console.log('Could not load RSVPs for event:', event.id)
        }

        // For games, also check volunteers
        if (event.event_type === 'game') {
          try {
            const { data: volData } = await supabase
              .from('event_volunteers')
              .select('role, position')
              .eq('event_id', event.id)

            volunteerInfo = {
              line_judge: volData?.find(v => v.role === 'line_judge' && v.position === 'primary'),
              scorekeeper: volData?.find(v => v.role === 'scorekeeper' && v.position === 'primary')
            }
          } catch (err) {
            console.log('Could not load volunteers for event:', event.id)
          }
        }

        return { ...event, rsvp_counts: counts, volunteer_info: volunteerInfo }
      }))

      setEvents(eventsWithCounts)
    } catch (err) {
      console.error('Error loading events:', err)
      showToast('Error loading events', 'error')
    }
    setLoading(false)
  }

  async function loadEventDetails(event) {
    setLoadingDetail(true)
    setSelectedEvent(event)

    try {
      // Load RSVPs with player info
      try {
        const { data: rsvpData } = await supabase
          .from('event_rsvps')
          .select('*, players(id, first_name, last_name, jersey_number)')
          .eq('event_id', event.id)
        setRsvps(rsvpData || [])
      } catch (err) {
        console.log('Could not load RSVPs:', err)
        setRsvps([])
      }

      // Load volunteers with profile info
      try {
        const { data: volData } = await supabase
          .from('event_volunteers')
          .select('*, profiles(id, full_name)')
          .eq('event_id', event.id)
          .order('role')
          .order('position')
        setVolunteers(volData || [])
      } catch (err) {
        console.log('Could not load volunteers:', err)
        setVolunteers([])
      }

      // Load team players for RSVP tracking
      if (event.team_id) {
        try {
          const { data: playersData } = await supabase
            .from('team_players')
            .select('*, players(id, first_name, last_name, jersey_number, photo_url, position)')
            .eq('team_id', event.team_id)
          setTeamPlayers(playersData || [])
        } catch (err) {
          console.log('Could not load team players:', err)
          setTeamPlayers([])
        }
      }

      // Load available parents for volunteer assignment
      try {
        const { data: parentsData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name')
        setAvailableParents(parentsData || [])
      } catch (err) {
        console.log('Could not load parents:', err)
        setAvailableParents([])
      }
    } catch (err) {
      console.error('Error loading event details:', err)
    }
    setLoadingDetail(false)
  }

  async function updateRsvp(playerId, status) {
    if (!selectedEvent) return

    try {
      const existingRsvp = rsvps.find(r => r.player_id === playerId)

      if (existingRsvp) {
        await supabase
          .from('event_rsvps')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existingRsvp.id)
      } else {
        await supabase
          .from('event_rsvps')
          .insert({
            event_id: selectedEvent.id,
            player_id: playerId,
            status,
            responded_by: user?.id
          })
      }

      showToast('RSVP updated', 'success')
      loadEventDetails(selectedEvent)
      loadEvents()
    } catch (err) {
      showToast('Error updating RSVP', 'error')
    }
  }

  async function assignVolunteer(role, position, profileId) {
    if (!selectedEvent) return

    try {
      // Check if slot is taken
      const existing = volunteers.find(v => v.role === role && v.position === position)
      if (existing) {
        showToast('This slot is already filled', 'error')
        return
      }

      await supabase
        .from('event_volunteers')
        .insert({
          event_id: selectedEvent.id,
          profile_id: profileId,
          role,
          position
        })

      showToast('Volunteer assigned!', 'success')
      loadEventDetails(selectedEvent)
      loadEvents()
    } catch (err) {
      showToast('Error assigning volunteer', 'error')
    }
  }

  async function removeVolunteer(volunteerId) {
    if (!confirm('Remove this volunteer?')) return

    try {
      await supabase.from('event_volunteers').delete().eq('id', volunteerId)
      showToast('Volunteer removed', 'success')
      loadEventDetails(selectedEvent)
      loadEvents()
    } catch (err) {
      showToast('Error removing volunteer', 'error')
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const eventTypeColors = {
    game: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Game' },
    practice: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Practice' },
    event: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Event' },
    tournament: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Tournament' }
  }

  // Stats
  const stats = {
    totalEvents: events.length,
    games: events.filter(e => e.event_type === 'game').length,
    practices: events.filter(e => e.event_type === 'practice').length,
    needsVolunteers: events.filter(e => e.event_type === 'game' && (!e.volunteer_info?.line_judge || !e.volunteer_info?.scorekeeper)).length
  }

  if (!selectedSeason) {
    return (
      <div className="p-8 text-center">
        <Check className="w-16 h-16 text-emerald-500 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No Season Selected</h2>
        <p className="text-slate-400">Please select a season to manage attendance</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Attendance & RSVP</h1>
          <p className="text-slate-400 mt-1">Track RSVPs and manage volunteers • {selectedSeason.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalEvents}</div>
          <div className="text-xs text-slate-400">Total Events</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.games}</div>
          <div className="text-xs text-slate-400">Games</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.practices}</div>
          <div className="text-xs text-slate-400">Practices</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[var(--accent-primary)]">{stats.needsVolunteers}</div>
          <div className="text-xs text-slate-400">Need Volunteers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white"
        >
          <option value="all">All Teams</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>

        <div className="flex bg-slate-800 rounded-xl p-1">
          {['upcoming', 'past', 'all'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === mode ? 'bg-[var(--accent-primary)] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Events List */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white mb-4">Events</h2>
          
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : events.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
              <Calendar className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-slate-400">No {viewMode} events match your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(event => {
                const typeConfig = eventTypeColors[event.event_type] || eventTypeColors.event
                const isSelected = selectedEvent?.id === event.id
                const needsVol = event.event_type === 'game' && (!event.volunteer_info?.line_judge || !event.volunteer_info?.scorekeeper)

                return (
                  <button
                    key={event.id}
                    onClick={() => loadEventDetails(event)}
                    className={`w-full text-left bg-slate-800 border rounded-xl p-4 transition ${
                      isSelected ? 'border-[var(--accent-primary)]' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
                            {typeConfig.label}
                          </span>
                          {event.teams && (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: `${event.teams.color}20`, color: event.teams.color }}
                            >
                              {event.teams.name}
                            </span>
                          )}
                          {needsVol && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                              ⚠️ Needs Volunteers
                            </span>
                          )}
                        </div>
                        <div className="text-white font-semibold">{event.title}</div>
                        <div className="text-sm text-slate-400">
                          {formatDate(event.event_date)} • {formatTime(event.event_time)}
                          {event.venue_name && ` • ${event.venue_name}`}
                        </div>
                      </div>
                      
                      {/* RSVP Summary */}
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-400">{event.rsvp_counts?.yes || 0} ✓</span>
                        <span className="text-red-400">{event.rsvp_counts?.no || 0} ✗</span>
                        <span className="text-[var(--accent-primary)]">{event.rsvp_counts?.maybe || 0} ?</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Event Details Panel */}
        <div className="w-96">
          {selectedEvent ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl sticky top-8">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{selectedEvent.title}</h2>
                  <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-sm text-slate-400">{formatDate(selectedEvent.event_date)} • {formatTime(selectedEvent.event_time)}</p>
              </div>

              {loadingDetail ? (
                <div className="p-8 text-center text-slate-400">Loading...</div>
              ) : (
                <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {/* RSVP Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">RSVPs</h3>
                    
                    {/* RSVP Summary */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-emerald-500/10 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-emerald-400">{rsvps.filter(r => r.status === 'yes').length}</div>
                        <div className="text-xs text-emerald-400">Going</div>
                      </div>
                      <div className="flex-1 bg-red-500/10 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-red-400">{rsvps.filter(r => r.status === 'no').length}</div>
                        <div className="text-xs text-red-400">Can't Go</div>
                      </div>
                      <div className="flex-1 bg-[var(--accent-primary)]/10 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-[var(--accent-primary)]">{rsvps.filter(r => r.status === 'maybe').length}</div>
                        <div className="text-xs text-[var(--accent-primary)]">Maybe</div>
                      </div>
                    </div>

                    {/* Player List */}
                    <div className="space-y-2">
                      {teamPlayers.map(tp => {
                        const player = tp.players
                        if (!player) return null
                        const rsvp = rsvps.find(r => r.player_id === player.id)
                        const status = rsvp?.status

                        return (
                          <div key={tp.id} className="flex items-center justify-between bg-slate-900 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              {tp.jersey_number && (
                                <span className="w-6 h-6 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-bold flex items-center justify-center">
                                  {tp.jersey_number}
                                </span>
                              )}
                              <ClickablePlayerName 
                                player={player}
                                onPlayerSelect={setSelectedPlayerForCard}
                                className="text-white text-sm"
                              />
                            </div>
                            <div className="flex gap-1">
                              {['yes', 'no', 'maybe'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateRsvp(player.id, s)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                    status === s
                                      ? s === 'yes' ? 'bg-emerald-500 text-white' 
                                        : s === 'no' ? 'bg-red-500 text-white' 
                                        : 'bg-yellow-500 text-black'
                                      : 'bg-slate-700 text-slate-500 hover:text-white'
                                  }`}
                                >
                                  {s === 'yes' ? '✓' : s === 'no' ? '✗' : '?'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}

                      {teamPlayers.length === 0 && (
                        <p className="text-center text-slate-500 text-sm py-4">No players on this team</p>
                      )}
                    </div>
                  </div>

                  {/* Volunteers Section (Games Only) */}
                  {selectedEvent.event_type === 'game' && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Volunteers</h3>
                      
                      {/* Line Judge */}
                      <div className="bg-slate-900 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span>🚩</span>
                          <span className="text-white font-medium">Line Judge</span>
                        </div>
                        {['primary', 'backup_1', 'backup_2'].map(position => {
                          const vol = volunteers.find(v => v.role === 'line_judge' && v.position === position)
                          const isAssigning = volunteerAssignModal?.role === 'line_judge' && volunteerAssignModal?.position === position
                          return (
                            <div key={position} className="flex items-center justify-between py-1.5 border-t border-[#1a1a1a]">
                              <span className="text-xs text-slate-500 w-20">
                                {position === 'primary' ? 'Primary' : position === 'backup_1' ? 'Backup 1' : 'Backup 2'}
                              </span>
                              {vol ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm">
                                    {vol.profiles?.full_name || 'Assigned'}
                                  </span>
                                  <button
                                    onClick={() => removeVolunteer(vol.id)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : isAssigning ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    autoFocus
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        assignVolunteer('line_judge', position, e.target.value)
                                      }
                                      setVolunteerAssignModal(null)
                                    }}
                                    onBlur={() => setVolunteerAssignModal(null)}
                                    className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-xs max-w-[140px]"
                                  >
                                    <option value="">Select parent...</option>
                                    {availableParents
                                      .filter(p => !volunteers.some(v => v.profile_id === p.id))
                                      .map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                          {parent.full_name || 'Parent'}
                                        </option>
                                      ))
                                    }
                                  </select>
                                  <button
                                    onClick={() => setVolunteerAssignModal(null)}
                                    className="text-slate-500 hover:text-white text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setVolunteerAssignModal({ role: 'line_judge', position })}
                                  className={`text-sm hover:underline ${position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500 hover:text-[var(--accent-primary)]'}`}
                                >
                                  {position === 'primary' ? '+ Assign' : '+ Add'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Scorekeeper */}
                      <div className="bg-slate-900 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span>📋</span>
                          <span className="text-white font-medium">Scorekeeper</span>
                        </div>
                        {['primary', 'backup_1', 'backup_2'].map(position => {
                          const vol = volunteers.find(v => v.role === 'scorekeeper' && v.position === position)
                          const isAssigning = volunteerAssignModal?.role === 'scorekeeper' && volunteerAssignModal?.position === position
                          return (
                            <div key={position} className="flex items-center justify-between py-1.5 border-t border-[#1a1a1a]">
                              <span className="text-xs text-slate-500 w-20">
                                {position === 'primary' ? 'Primary' : position === 'backup_1' ? 'Backup 1' : 'Backup 2'}
                              </span>
                              {vol ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm">
                                    {vol.profiles?.full_name || 'Assigned'}
                                  </span>
                                  <button
                                    onClick={() => removeVolunteer(vol.id)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : isAssigning ? (
                                <div className="flex items-center gap-1">
                                  <select
                                    autoFocus
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        assignVolunteer('scorekeeper', position, e.target.value)
                                      }
                                      setVolunteerAssignModal(null)
                                    }}
                                    onBlur={() => setVolunteerAssignModal(null)}
                                    className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-xs max-w-[140px]"
                                  >
                                    <option value="">Select parent...</option>
                                    {availableParents
                                      .filter(p => !volunteers.some(v => v.profile_id === p.id))
                                      .map(parent => (
                                        <option key={parent.id} value={parent.id}>
                                          {parent.full_name || 'Parent'}
                                        </option>
                                      ))
                                    }
                                  </select>
                                  <button
                                    onClick={() => setVolunteerAssignModal(null)}
                                    className="text-slate-500 hover:text-white text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setVolunteerAssignModal({ role: 'scorekeeper', position })}
                                  className={`text-sm hover:underline ${position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500 hover:text-[var(--accent-primary)]'}`}
                                >
                                  {position === 'primary' ? '+ Assign' : '+ Add'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">👈</div>
              <p className="text-slate-400">Select an event to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Player Card Modal */}
      {selectedPlayerForCard && (
        <PlayerCardExpanded
          player={selectedPlayerForCard}
          visible={!!selectedPlayerForCard}
          onClose={() => setSelectedPlayerForCard(null)}
          context="attendance"
        />
      )}
    </div>
  )
}


export { AttendancePage }
