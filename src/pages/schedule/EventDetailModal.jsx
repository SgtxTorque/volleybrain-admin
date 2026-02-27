import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Users, Edit, X, Check, CheckSquare, ClipboardList, User, Star, Share2
} from '../../constants/icons'
import { PlayerCard, PlayerCardExpanded } from '../../components/players'
import { ClickableCoachName, CoachDetailModal } from '../../pages/coaches/CoachesPage'
import { getEventColor, formatTime12 } from './scheduleHelpers'
import LineupBuilder from './LineupBuilder'
import GameCompletionModal from './GameCompletionModal'

function EventDetailModal({ event, teams, venues, onClose, onUpdate, onDelete, activeView, showToast, selectedSeason, parentChildIds = [], onShareGameDay, parentTutorial }) {
  const { isAdmin: hasAdminRole, profile, user } = useAuth()
  // Use activeView if provided, otherwise fall back to admin role check
  const isAdminView = activeView ? (activeView === 'admin' || activeView === 'coach') : hasAdminRole
  const isCoachView = activeView === 'coach'
  const isParentView = activeView === 'parent'
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLineupBuilder, setShowLineupBuilder] = useState(false)
  const [showGameCompletion, setShowGameCompletion] = useState(false)
  const [lineupCount, setLineupCount] = useState(0)
  
  // Rich data
  const [roster, setRoster] = useState([])
  const [rsvps, setRsvps] = useState({})
  const [volunteers, setVolunteers] = useState([])
  const [coaches, setCoaches] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [selectedCoach, setSelectedCoach] = useState(null)
  
  // View controls
  const [showPhotos, setShowPhotos] = useState(true)
  const [availableParents, setAvailableParents] = useState([])
  const [volunteerAssignModal, setVolunteerAssignModal] = useState(null)
  
  const [form, setForm] = useState({
    team_id: event.team_id || '',
    event_type: event.event_type || 'practice',
    title: event.title || '',
    description: event.description || '',
    start_date: event.event_date || (event.start_time ? new Date(event.start_time).toISOString().split('T')[0] : ''),
    start_time: event.event_time || (event.start_time ? new Date(event.start_time).toTimeString().slice(0, 5) : ''),
    end_time: event.end_time || '',
    venue_name: event.venue_name || '',
    venue_address: event.venue_address || '',
    court_number: event.court_number || '',
    location_type: event.location_type || 'home',
    opponent_name: event.opponent_name || ''
  })

  useEffect(() => {
    if (event?.id) loadEventData()
  }, [event?.id])

  async function loadEventData() {
    setLoading(true)
    try {
      // Load team roster if team is assigned
      if (event.team_id) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('*, players(id, first_name, last_name, jersey_number, position, photo_url, grade, status)')
          .eq('team_id', event.team_id)
        setRoster(teamPlayers?.map(tp => tp.players).filter(Boolean) || [])

        // Load coaches for this team
        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('*, coaches(id, first_name, last_name, email, phone)')
          .eq('team_id', event.team_id)
        // Merge coach data with role from team_coaches join table
        setCoaches(teamCoaches?.map(tc => tc.coaches ? { ...tc.coaches, role: tc.role } : null).filter(Boolean) || [])
      }

      // Load RSVPs for this event
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', event.id)
      
      const rsvpMap = {}
      rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
      setRsvps(rsvpMap)

      // Load volunteers for this event
      const { data: volunteerData } = await supabase
        .from('event_volunteers')
        .select('*, profiles(id, full_name, email)')
        .eq('event_id', event.id)
      setVolunteers(volunteerData || [])

      // Load lineup count for games
      if (event.event_type === 'game') {
        const { count } = await supabase
          .from('game_lineups')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('is_starter', true)
        setLineupCount(count || 0)
      }

      // Load available parents for volunteer assignment
      const { data: parentsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, email')
        .order('first_name')
      setAvailableParents(parentsData || [])

    } catch (err) {
      console.error('Error loading event data:', err)
    }
    setLoading(false)
  }

  async function updateRsvp(playerId, status) {
    const existing = rsvps[playerId]
    
    if (existing) {
      await supabase.from('event_rsvps')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('event_rsvps').insert({
        event_id: event.id,
        player_id: playerId,
        status,
        responded_at: new Date().toISOString()
      })
    }
    
    // Refresh RSVPs
    const { data: rsvpData } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', event.id)
    
    const rsvpMap = {}
    rsvpData?.forEach(r => { rsvpMap[r.player_id] = r })
    setRsvps(rsvpMap)
    
    // Complete parent journey step for first RSVP
    if (activeView === 'parent') {
      parentTutorial?.completeStep?.('first_rsvp')
    }
  }

  async function removeVolunteer(volunteerId) {
    await supabase.from('event_volunteers').delete().eq('id', volunteerId)
    setVolunteers(volunteers.filter(v => v.id !== volunteerId))
  }

  async function assignVolunteer(role, position, profileId) {
    // Check if slot is taken
    const existing = volunteers.find(v => v.role === role && v.position === position)
    if (existing) return

    const { data, error } = await supabase
      .from('event_volunteers')
      .insert({
        event_id: event.id,
        profile_id: profileId,
        role,
        position
      })
      .select('*, profiles(id, full_name, email)')
      .single()

    if (!error && data) {
      setVolunteers([...volunteers, data])
    }
  }

  async function handleSave() {
    const success = await onUpdate(event.id, {
      team_id: form.team_id || null,
      event_type: form.event_type,
      title: form.title,
      description: form.description,
      event_date: form.start_date,
      event_time: form.start_time,
      end_time: form.end_time,
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      court_number: form.court_number || null,
      location_type: form.location_type,
      opponent_name: form.opponent_name
    })
    if (success) {
      setIsEditing(false)
      loadEventData()
    }
  }

  // RSVP counts
  const rsvpCounts = {
    yes: Object.values(rsvps).filter(r => r.status === 'yes').length,
    no: Object.values(rsvps).filter(r => r.status === 'no').length,
    maybe: Object.values(rsvps).filter(r => r.status === 'maybe').length,
    pending: roster.length - Object.keys(rsvps).length
  }

  // Volunteer helpers
  const getVolunteer = (role, position) => volunteers.find(v => v.role === role && v.position === position)
  const isGame = event.event_type === 'game'

  const tabs = [
    { id: 'details', label: 'Details', icon: 'clipboard' },
    { id: 'roster', label: `Roster (${roster.length})`, icon: 'users' },
    { id: 'rsvp', label: `RSVPs`, icon: '✓', badge: rsvpCounts.pending > 0 ? rsvpCounts.pending : null },
    ...(isGame ? [{ id: 'volunteers', label: 'Volunteers', icon: '🙋' }] : []),
    { id: 'coaches', label: `Coaches (${coaches.length})`, icon: 'user-cog' },
    ...(isGame && isAdminView ? [{ id: 'gameprep', label: 'Game Prep', icon: 'volleyball' }] : [])
  ]

  const teamColor = event.teams?.color || '#EAB308'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between" style={{ borderLeftColor: teamColor, borderLeftWidth: 4 }}>
          <div className="flex items-center gap-4">
            <span className="text-3xl">{event.event_type === 'game' ? '🏐' : event.event_type === 'practice' ? '🏃' : event.event_type === 'tournament' ? '🏆' : '📅'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{event.title || (event.event_type === 'game' ? `vs ${event.opponent_name || 'TBD'}` : event.event_type)}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: getEventColor(event.event_type) + '30', color: getEventColor(event.event_type) }}>
                  {event.event_type}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
                {event.event_time && ` • ${formatTime12(event.event_time)}`}
                {event.teams?.name && ` • ${event.teams.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Share Game Day Card — for games/tournaments */}
            {(event.event_type === 'game' || event.event_type === 'tournament') && onShareGameDay && (
              <button
                onClick={() => onShareGameDay(event)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/30 transition text-xs font-bold"
                title="Share Game Day Card"
              >
                🏟️ Share
              </button>
            )}
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className={`p-2 rounded-lg transition ${showPhotos ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              title={showPhotos ? 'Hide Photos' : 'Show Photos'}
            >
              📷
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl p-2">×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' 
                  : 'text-slate-500 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading event details...</div>
          ) : (
            <>
              {/* Details Tab */}
              {activeTab === 'details' && (
                isEditing ? (
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Event Type</label>
                        <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                          <option value="practice">Practice</option>
                          <option value="game">Game</option>
                          <option value="tournament">Tournament</option>
                          <option value="team_event">Team Event</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Team</label>
                        <select value={form.team_id} onChange={e => setForm({...form, team_id: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                          <option value="">All Teams</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Title</label>
                      <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                        placeholder="e.g., Week 3 Practice"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Date</label>
                        <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Start Time</label>
                        <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">End Time</label>
                        <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Venue</label>
                        <input type="text" value={form.venue_name} onChange={e => setForm({...form, venue_name: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Address</label>
                        <input type="text" value={form.venue_address} onChange={e => setForm({...form, venue_address: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Court / Field #</label>
                      <input type="text" value={form.court_number} onChange={e => setForm({...form, court_number: e.target.value})}
                        placeholder="e.g., Court 3, Field A"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                    </div>

                    {form.event_type === 'game' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Opponent</label>
                          <input type="text" value={form.opponent_name} onChange={e => setForm({...form, opponent_name: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Location Type</label>
                          <select value={form.location_type} onChange={e => setForm({...form, location_type: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white">
                            <option value="home">Home</option>
                            <option value="away">Away</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Notes</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white min-h-[80px]" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Event Info */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-400 uppercase">Event Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <DetailItem label="Date" value={event.event_date ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'} />
                          <DetailItem label="Time" value={event.event_time ? `${formatTime12(event.event_time)}${event.end_time ? ` - ${formatTime12(event.end_time)}` : ''}` : 'TBD'} />
                        </div>
                        {event.venue_name && <DetailItem label="Venue" value={event.venue_name} />}
                        {event.venue_address && <DetailItem label="Address" value={event.venue_address} />}
                        {event.court_number && <DetailItem label="Court / Field" value={event.court_number} />}
                        {event.teams?.name && <DetailItem label="Team" value={event.teams.name} highlight={teamColor} />}
                        {event.opponent_name && <DetailItem label="Opponent" value={event.opponent_name} />}
                        {event.location_type && isGame && <DetailItem label="Location" value={event.location_type.charAt(0).toUpperCase() + event.location_type.slice(1)} />}
                      </div>

                      {event.description && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">Notes</h4>
                          <p className="text-white text-sm">{event.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Quick Stats */}
                    <div className="space-y-4">
                      {/* RSVP Summary */}
                      <div className="bg-slate-900 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase">RSVP Summary</h4>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-xs text-[var(--accent-primary)] hover:underline"
                          >
                            View All →
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-emerald-400">{rsvpCounts.yes}</div>
                            <div className="text-xs text-emerald-400">Going</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-red-400">{rsvpCounts.no}</div>
                            <div className="text-xs text-red-400">No</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-[var(--accent-primary)]">{rsvpCounts.maybe}</div>
                            <div className="text-xs text-[var(--accent-primary)]">Maybe</div>
                          </button>
                          <button 
                            onClick={() => setActiveTab('rsvp')}
                            className="text-center p-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 transition cursor-pointer"
                          >
                            <div className="text-xl font-bold text-slate-400">{rsvpCounts.pending}</div>
                            <div className="text-xs text-slate-400">Pending</div>
                          </button>
                        </div>
                      </div>

                      {/* Volunteers Summary (Games only) */}
                      {isGame && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Volunteers</h4>
                          <div className="space-y-2">
                            <VolunteerSlot 
                              role="Line Judge" 
                              volunteer={getVolunteer('line_judge', 'primary')} 
                              icon="🚩"
                              onClick={() => setActiveTab('volunteers')}
                            />
                            <VolunteerSlot 
                              role="Scorekeeper" 
                              volunteer={getVolunteer('scorekeeper', 'primary')} 
                              icon="clipboard"
                              onClick={() => setActiveTab('volunteers')}
                            />
                          </div>
                        </div>
                      )}

                      {/* Coaches */}
                      {coaches.length > 0 && (
                        <div className="bg-slate-900 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">Coaches</h4>
                          <div className="space-y-2">
                            {coaches.map(coach => (
                              <div key={coach.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800">
                                {showPhotos && coach.photo_url ? (
                                  <img src={coach.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">Coach</div>
                                )}
                                <div>
                                  <ClickableCoachName 
                                    coach={coach}
                                    onCoachSelect={setSelectedCoach}
                                    className="text-white text-sm"
                                  />
                                  <div className="text-xs text-slate-500">{coach.role || 'Coach'}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Roster Tab */}
              {activeTab === 'roster' && (
                <div>
                  {roster.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10" />
                      <p className="text-slate-400 mt-4">No players on roster</p>
                      {!event.team_id && <p className="text-slate-500 text-sm mt-2">Assign a team to see roster</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {roster.map(player => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          context="attendance"
                          teamColor={teamColor}
                          showPhoto={showPhotos}
                          size="small"
                          onClick={() => setSelectedPlayer(player)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RSVP Tab */}
              {activeTab === 'rsvp' && (
                <div>
                  {/* RSVP Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-400">{rsvpCounts.yes}</div>
                      <div className="text-sm text-emerald-400">Going</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-red-400">{rsvpCounts.no}</div>
                      <div className="text-sm text-red-400">Can't Go</div>
                    </div>
                    <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-[var(--accent-primary)]">{rsvpCounts.maybe}</div>
                      <div className="text-sm text-[var(--accent-primary)]">Maybe</div>
                    </div>
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-slate-400">{rsvpCounts.pending}</div>
                      <div className="text-sm text-slate-400">Pending</div>
                    </div>
                  </div>

                  {/* Player RSVP List */}
                  {roster.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      {!event.team_id ? 'Assign a team to manage RSVPs' : 'No players on roster'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roster.map(player => {
                        const rsvp = rsvps[player.id]
                        // Parents can only RSVP for their own children
                        const canRsvp = !isParentView || parentChildIds.includes(player.id)
                        const isOwnChild = parentChildIds.includes(player.id)
                        
                        return (
                          <div key={player.id} className={`bg-slate-900 rounded-xl p-3 flex items-center justify-between ${isParentView && isOwnChild ? 'ring-2 ring-[var(--accent-primary)]/50' : ''}`}>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                              {showPhotos && (
                                player.photo_url ? (
                                  <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-500"><User className="w-6 h-6" /></div>
                                )
                              )}
                              {player.jersey_number && (
                                <span className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold" style={{ backgroundColor: teamColor + '30', color: teamColor }}>
                                  {player.jersey_number}
                                </span>
                              )}
                              <div>
                                <div className="text-white font-medium">
                                  {player.first_name} {player.last_name}
                                  {isParentView && isOwnChild && <span className="ml-2 text-xs text-[var(--accent-primary)]">(Your child)</span>}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {player.position && <span className="mr-2">{player.position}</span>}
                                  {player.grade && <span>Grade {player.grade}</span>}
                                </div>
                              </div>
                            </div>
                            {canRsvp ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateRsvp(player.id, 'yes')}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    rsvp?.status === 'yes' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                                  }`}
                                >
                                  ✓ Yes
                                </button>
                                <button
                                  onClick={() => updateRsvp(player.id, 'no')}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    rsvp?.status === 'no' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                                  }`}
                                >
                                  ✗ No
                                </button>
                                <button
                                  onClick={() => updateRsvp(player.id, 'maybe')}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    rsvp?.status === 'maybe' ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)]'
                                  }`}
                                >
                                  ? Maybe
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                  rsvp?.status === 'yes' ? 'bg-emerald-500/20 text-emerald-400' :
                                  rsvp?.status === 'no' ? 'bg-red-500/20 text-red-400' :
                                  rsvp?.status === 'maybe' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-slate-700/50 text-slate-500'
                                }`}>
                                  {rsvp?.status === 'yes' ? '✓ Going' :
                                   rsvp?.status === 'no' ? '✗ Not Going' :
                                   rsvp?.status === 'maybe' ? '? Maybe' :
                                   'Pending'}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Volunteers Tab */}
              {activeTab === 'volunteers' && isGame && (
                <div className="space-y-6">
                  {/* Current user's volunteer status */}
                  {!isAdminView && user?.id && (
                    <div className={`p-4 rounded-xl ${volunteers.some(v => v.profile_id === user.id) ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'}`}>
                      {volunteers.some(v => v.profile_id === user.id) ? (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-6 h-6" />
                          <div>
                            <p className="text-emerald-400 font-medium">You're signed up!</p>
                            <p className="text-emerald-400/70 text-sm">
                              {volunteers.find(v => v.profile_id === user.id)?.role === 'line_judge' ? 'Line Judge' : 'Scorekeeper'}
                              {' - '}
                              {volunteers.find(v => v.profile_id === user.id)?.position === 'primary' ? 'Primary' : 'Backup'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🙋</span>
                          <div>
                            <p className="text-[var(--accent-primary)] font-medium">Volunteers needed!</p>
                            <p className="text-[var(--accent-primary)]/70 text-sm">Click a slot below to sign up</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Line Judge */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>🚩</span> Line Judge
                    </h4>
                    <div className="space-y-2">
                      {['primary', 'backup_1', 'backup_2'].map(position => {
                        const volunteer = getVolunteer('line_judge', position)
                        const isAssigning = volunteerAssignModal?.role === 'line_judge' && volunteerAssignModal?.position === position
                        const isCurrentUser = volunteer?.profile_id === user?.id
                        const userAlreadyVolunteering = volunteers.some(v => v.profile_id === user?.id)
                        
                        return (
                          <div key={position} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <span className={position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500'}>
                                {position === 'primary' ? <Star className="w-4 h-4" /> : ''}
                              </span>
                              <span className="text-slate-400 text-sm w-20">{position === 'primary' ? 'Primary' : position.replace('_', ' ').replace('backup', 'Backup')}</span>
                              {volunteer ? (
                                <span className={isCurrentUser ? 'text-emerald-400 font-medium' : 'text-white'}>
                                  {isCurrentUser ? 'You' : (volunteer.profiles?.full_name || 'Volunteer')}
                                </span>
                              ) : isAdminView ? (
                                isAssigning ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      autoFocus
                                      onChange={(e) => {
                                        if (e.target.value) assignVolunteer('line_judge', position, e.target.value)
                                        setVolunteerAssignModal(null)
                                      }}
                                      onBlur={() => setVolunteerAssignModal(null)}
                                      className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                    >
                                      <option value="">Select parent...</option>
                                      {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id)).map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name || `${parent.first_name} ${parent.last_name}`}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => setVolunteerAssignModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setVolunteerAssignModal({ role: 'line_judge', position })} className="text-[var(--accent-primary)] hover:underline text-sm">+ Assign</button>
                                )
                              ) : (
                                <button
                                  onClick={() => assignVolunteer('line_judge', position, user?.id)}
                                  disabled={userAlreadyVolunteering}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${userAlreadyVolunteering ? 'bg-gray-500/20 text-slate-500 cursor-not-allowed' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-yellow-400/30'}`}
                                >
                                  {userAlreadyVolunteering ? 'Open' : '🙋 Sign Up'}
                                </button>
                              )}
                            </div>
                            {volunteer && (isAdminView || isCurrentUser) && (
                              <button onClick={() => removeVolunteer(volunteer.id)} className="text-red-400 hover:text-red-300 text-sm">
                                {isCurrentUser ? 'Cancel' : 'Remove'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Scorekeeper */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5" /> Scorekeeper
                    </h4>
                    <div className="space-y-2">
                      {['primary', 'backup_1', 'backup_2'].map(position => {
                        const volunteer = getVolunteer('scorekeeper', position)
                        const isAssigning = volunteerAssignModal?.role === 'scorekeeper' && volunteerAssignModal?.position === position
                        const isCurrentUser = volunteer?.profile_id === user?.id
                        const userAlreadyVolunteering = volunteers.some(v => v.profile_id === user?.id)
                        
                        return (
                          <div key={position} className={`flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                            <div className="flex items-center gap-3">
                              <span className={position === 'primary' ? 'text-[var(--accent-primary)]' : 'text-slate-500'}>
                                {position === 'primary' ? <Star className="w-4 h-4" /> : ''}
                              </span>
                              <span className="text-slate-400 text-sm w-20">{position === 'primary' ? 'Primary' : position.replace('_', ' ').replace('backup', 'Backup')}</span>
                              {volunteer ? (
                                <span className={isCurrentUser ? 'text-emerald-400 font-medium' : 'text-white'}>
                                  {isCurrentUser ? 'You' : (volunteer.profiles?.full_name || 'Volunteer')}
                                </span>
                              ) : isAdminView ? (
                                isAssigning ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      autoFocus
                                      onChange={(e) => {
                                        if (e.target.value) assignVolunteer('scorekeeper', position, e.target.value)
                                        setVolunteerAssignModal(null)
                                      }}
                                      onBlur={() => setVolunteerAssignModal(null)}
                                      className="bg-slate-700 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                                    >
                                      <option value="">Select parent...</option>
                                      {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id)).map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.full_name || `${parent.first_name} ${parent.last_name}`}</option>
                                      ))}
                                    </select>
                                    <button onClick={() => setVolunteerAssignModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => setVolunteerAssignModal({ role: 'scorekeeper', position })} className="text-[var(--accent-primary)] hover:underline text-sm">+ Assign</button>
                                )
                              ) : (
                                <button
                                  onClick={() => assignVolunteer('scorekeeper', position, user?.id)}
                                  disabled={userAlreadyVolunteering}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${userAlreadyVolunteering ? 'bg-gray-500/20 text-slate-500 cursor-not-allowed' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-yellow-400/30'}`}
                                >
                                  {userAlreadyVolunteering ? 'Open' : '🙋 Sign Up'}
                                </button>
                              )}
                            </div>
                            {volunteer && (isAdminView || isCurrentUser) && (
                              <button onClick={() => removeVolunteer(volunteer.id)} className="text-red-400 hover:text-red-300 text-sm">
                                {isCurrentUser ? 'Cancel' : 'Remove'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm text-center">
                    {isAdminView ? 'Assign parents to volunteer slots above.' : 'Thank you for volunteering! Your help makes our league possible.'}
                  </p>
                </div>
              )}

              {/* Coaches Tab */}
              {activeTab === 'coaches' && (
                <div>
                  {coaches.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-4xl">Coach</span>
                      <p className="text-slate-400 mt-4">No coaches assigned</p>
                      {!event.team_id && <p className="text-slate-500 text-sm mt-2">Assign a team to see coaches</p>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coaches.map(coach => (
                        <div key={coach.id} className="bg-slate-900 rounded-xl p-4 flex items-center gap-4">
                          {showPhotos && coach.photo_url ? (
                            <img src={coach.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">Coach</div>
                          )}
                          <div className="flex-1">
                            <ClickableCoachName 
                              coach={coach}
                              onCoachSelect={setSelectedCoach}
                              className="text-white font-semibold text-lg"
                            />
                            <div className="text-slate-400 text-sm">{coach.role || 'Coach'}</div>
                            <div className="flex gap-4 mt-2">
                              {coach.email && (
                                <a href={`mailto:${coach.email}`} className="text-[var(--accent-primary)] hover:underline text-sm">Email</a>
                              )}
                              {coach.phone && (
                                <a href={`tel:${coach.phone}`} className="text-[var(--accent-primary)] hover:underline text-sm">Call</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Game Prep Tab - For coaches/admins on games */}
              {activeTab === 'gameprep' && isGame && (
                <div className="space-y-4">
                  {/* Game Status Banner */}
                  {event.game_status === 'completed' ? (
                    <div className={`p-4 rounded-xl ${
                      event.game_result === 'win' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                      event.game_result === 'loss' ? 'bg-red-500/20 border border-red-500/30' :
                      'bg-yellow-500/20 border border-yellow-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl mr-2">
                            {event.game_result === 'win' ? '🏆' : event.game_result === 'loss' ? '📊' : '🤝'}
                          </span>
                          <span className={`text-lg font-bold ${
                            event.game_result === 'win' ? 'text-emerald-400' :
                            event.game_result === 'loss' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {event.game_result === 'win' ? 'VICTORY' : event.game_result === 'loss' ? 'DEFEAT' : 'TIE'}
                          </span>
                        </div>
                        <div className="text-right">
                          {/* Set-based scoring (volleyball) */}
                          {event.set_scores && event.our_sets_won !== undefined ? (
                            <>
                              <p className="text-3xl font-bold text-white">
                                {event.our_sets_won} - {event.opponent_sets_won}
                              </p>
                              <p className="text-sm text-slate-300">
                                {event.set_scores
                                  .filter(s => s && (s.our > 0 || s.their > 0))
                                  .map((s, i) => `${s.our}-${s.their}`)
                                  .join(', ')}
                              </p>
                              <p className="text-xs text-slate-400">{event.our_score} total pts</p>
                            </>
                          ) : (
                            <>
                              <p className="text-3xl font-bold text-white">
                                {event.our_score} - {event.opponent_score}
                              </p>
                              <p className="text-xs text-slate-400">Final Score</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⏰</span>
                          <div>
                            <p className="text-amber-400 font-semibold">Game Scheduled</p>
                            <p className="text-slate-400 text-sm">Ready for game day</p>
                          </div>
                        </div>
                        {isAdminView && (
                          <button
                            onClick={() => setShowGameCompletion(true)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
                          >
                            🏁 Complete Game
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Actions for Game Day */}
                  {event.game_status !== 'completed' && (
                    <div className="bg-slate-900 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase mb-4">Game Day Prep</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setShowLineupBuilder(true)}
                          className={`flex items-center gap-3 p-4 rounded-xl transition text-left ${
                            lineupCount >= 6 
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30' 
                              : 'bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30'
                          }`}
                        >
                          <ClipboardList className="w-7 h-7" />
                          <div>
                            <p className="text-white font-semibold">Set Lineup</p>
                            <p className="text-slate-400 text-xs">
                              {lineupCount >= 6 ? `✓ ${lineupCount} starters set` : `${lineupCount}/6 positions filled`}
                            </p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('rsvp')}
                          className="flex items-center gap-3 p-4 bg-emerald-500/20 rounded-xl hover:bg-emerald-500/30 transition text-left"
                        >
                          <span className="text-2xl">✓</span>
                          <div>
                            <p className="text-white font-semibold">Check Attendance</p>
                            <p className="text-slate-400 text-xs">{rsvpCounts.yes} confirmed, {rsvpCounts.pending} pending</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('roster')}
                          className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition text-left"
                        >
                          <Users className="w-7 h-7" />
                          <div>
                            <p className="text-white font-semibold">View Roster</p>
                            <p className="text-slate-400 text-xs">{roster.length} players</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('volunteers')}
                          className="flex items-center gap-3 p-4 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition text-left"
                        >
                          <span className="text-2xl">🙋</span>
                          <div>
                            <p className="text-white font-semibold">Volunteers</p>
                            <p className="text-slate-400 text-xs">{volunteers.length} assigned</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Game Info Summary */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-3">📍 Game Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-xs">Opponent</p>
                        <p className="text-white font-semibold text-lg">{event.opponent_name || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Location</p>
                        <p className="text-white font-semibold">{event.location_type === 'home' ? '🏠 Home' : event.location_type === 'away' ? '✈️ Away' : '🏟️ Neutral'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Venue</p>
                        <p className="text-white">{event.venue_name || 'TBD'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Time</p>
                        <p className="text-white">{event.event_time ? formatTime12(event.event_time) : 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coach Notes */}
                  <div className="bg-slate-900 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase mb-2">📝 Game Notes</h4>
                    <p className="text-slate-300 text-sm">{event.description || event.notes || 'No notes added'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex justify-between">
          <button onClick={() => onDelete(event.id)} className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl">
            🗑️ Delete Event
          </button>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-[var(--accent-primary)] text-white font-semibold">Save Changes</button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="px-6 py-2 rounded-xl border border-slate-700 text-white">Close</button>
                <button onClick={() => setIsEditing(true)} className="px-6 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"><Edit className="w-4 h-4 inline mr-1" />Edit Event</button>
              </>
            )}
          </div>
        </div>
      </div>

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

      {/* Coach Detail Modal */}
      {selectedCoach && (
        <CoachDetailModal
          coach={selectedCoach}
          onClose={() => setSelectedCoach(null)}
        />
      )}

      {/* Lineup Builder Modal */}
      {showLineupBuilder && event.team_id && (
        <LineupBuilder
          event={event}
          team={teams?.find(t => t.id === event.team_id) || { id: event.team_id, name: event.teams?.name }}
          onClose={() => setShowLineupBuilder(false)}
          showToast={showToast}
          sport={selectedSeason?.sport || selectedSeason?.sports?.name || 'volleyball'}
          onSave={async () => {
            // Refresh lineup count
            const { count } = await supabase
              .from('game_lineups')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('is_starter', true)
            setLineupCount(count || 0)
          }}
        />
      )}
      
      {/* Game Completion Modal */}
      {showGameCompletion && event.team_id && (
        <GameCompletionModal
          event={event}
          team={teams?.find(t => t.id === event.team_id) || { id: event.team_id, name: event.teams?.name }}
          roster={roster}
          onClose={() => setShowGameCompletion(false)}
          onComplete={() => {
            onUpdate?.(event.id, { game_status: 'completed' })
            onClose()
          }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// Helper components for Rich Event Modal
function DetailItem({ label, value, highlight }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-white font-medium" style={highlight ? { color: highlight } : {}}>{value || '—'}</div>
    </div>
  )
}

function VolunteerSlot({ role, volunteer, icon, onClick }) {
  return (
    <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-slate-400 text-sm">{role}</span>
      </div>
      {volunteer ? (
        <span className="text-emerald-400 text-sm">{volunteer.profiles?.full_name || 'Assigned'}</span>
      ) : (
        <button 
          onClick={onClick}
          className="text-[var(--accent-primary)] text-sm hover:underline"
        >
          Need Volunteer →
        </button>
      )}
    </div>
  )
}

export default EventDetailModal
