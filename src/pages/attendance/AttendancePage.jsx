import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Calendar, X } from '../../constants/icons'
import { PlayerCardExpanded } from '../../components/players'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'
import InnerStatRow from '../../components/pages/InnerStatRow'
import EventCard from '../../components/pages/EventCard'

function formatTime12(timeStr) {
  if (!timeStr) return ''
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`
  } catch { return timeStr }
}

function AttendancePage({ showToast }) {
  const { organization, user } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const { isDark } = useTheme()
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedEventId, setExpandedEventId] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [teamPlayers, setTeamPlayers] = useState([])
  const [viewMode, setViewMode] = useState('upcoming')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState(null)
  const [availableParents, setAvailableParents] = useState([])
  const [volunteerAssignModal, setVolunteerAssignModal] = useState(null)

  // Helper: get season IDs filtered by sport (for "All Seasons" + sport filter)
  function getSportSeasonIds() {
    if (!selectedSport?.id) return null
    return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  }

  useEffect(() => {
    if (selectedSeason?.id) { loadTeams(); loadEvents() }
  }, [selectedSeason?.id, selectedTeam, viewMode, selectedSport?.id])

  async function loadTeams() {
    let query = supabase.from('teams').select('id, name, color')
    if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
      query = query.eq('season_id', selectedSeason.id)
    } else {
      const sportIds = getSportSeasonIds()
      if (sportIds && sportIds.length > 0) {
        query = query.in('season_id', sportIds)
      } else if (sportIds && sportIds.length === 0) {
        setTeams([])
        return
      } else {
        // All Seasons + no sport → filter by ALL org season IDs
        const orgSeasonIds = (allSeasons || []).map(s => s.id)
        if (orgSeasonIds.length === 0) {
          setTeams([])
          return
        }
        query = query.in('season_id', orgSeasonIds)
      }
    }
    const { data } = await query.order('name')
    setTeams(data || [])
  }

  async function loadEvents() {
    setLoading(true)
    try {
      let query = supabase.from('schedule_events')
        .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
      if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
        query = query.eq('season_id', selectedSeason.id)
      } else {
        const sportIds = getSportSeasonIds()
        if (sportIds && sportIds.length > 0) {
          query = query.in('season_id', sportIds)
        } else if (sportIds && sportIds.length === 0) {
          setEvents([])
          setLoading(false)
          return
        } else {
          // All Seasons + no sport → filter by ALL org season IDs
          const orgSeasonIds = (allSeasons || []).map(s => s.id)
          if (orgSeasonIds.length === 0) {
            setEvents([])
            setLoading(false)
            return
          }
          query = query.in('season_id', orgSeasonIds)
        }
      }
      query = query.order('event_date', { ascending: viewMode !== 'past' })
        .order('event_time', { ascending: true })

      if (selectedTeam !== 'all') query = query.eq('team_id', selectedTeam)

      const today = new Date().toISOString().split('T')[0]
      if (viewMode === 'upcoming') query = query.gte('event_date', today)
      else if (viewMode === 'past') query = query.lt('event_date', today)

      const { data, error } = await query.limit(50)
      if (error) throw error

      const eventsWithCounts = await Promise.all((data || []).map(async (event) => {
        let counts = { yes: 0, no: 0, maybe: 0 }
        let volunteerInfo = null
        try {
          const { data: rsvpData } = await supabase.from('event_rsvps')
            .select('status').eq('event_id', event.id)
          rsvpData?.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
        } catch (err) { console.log('Could not load RSVPs for event:', event.id) }

        if (event.event_type === 'game') {
          try {
            const { data: volData } = await supabase.from('event_volunteers')
              .select('role, position').eq('event_id', event.id)
            volunteerInfo = {
              line_judge: volData?.find(v => v.role === 'line_judge' && v.position === 'primary'),
              scorekeeper: volData?.find(v => v.role === 'scorekeeper' && v.position === 'primary')
            }
          } catch (err) { console.log('Could not load volunteers for event:', event.id) }
        }
        return { ...event, rsvp_counts_raw: counts, volunteer_info: volunteerInfo }
      }))
      setEvents(eventsWithCounts)
    } catch (err) {
      console.error('Error loading events:', err)
      showToast('Error loading events', 'error')
    }
    setLoading(false)
  }

  async function toggleEventExpand(event) {
    if (expandedEventId === event.id) {
      setExpandedEventId(null)
      return
    }
    setExpandedEventId(event.id)
    setLoadingDetail(true)

    try {
      const [rsvpRes, volRes, playersRes, parentsRes] = await Promise.all([
        supabase.from('event_rsvps').select('*, players(id, first_name, last_name, jersey_number)').eq('event_id', event.id).then(r => r.data || []).catch(() => []),
        supabase.from('event_volunteers').select('*, profiles(id, full_name)').eq('event_id', event.id).order('role').order('position').then(r => r.data || []).catch(() => []),
        event.team_id ? supabase.from('team_players').select('*, players(id, first_name, last_name, jersey_number, photo_url, position)').eq('team_id', event.team_id).then(r => r.data || []).catch(() => []) : Promise.resolve([]),
        supabase.from('profiles').select('id, full_name, email').eq('organization_id', organization?.id).order('full_name').then(r => r.data || []).catch(() => [])
      ])
      setRsvps(rsvpRes)
      setVolunteers(volRes)
      setTeamPlayers(playersRes)
      setAvailableParents(parentsRes)
    } catch (err) {
      console.error('Error loading event details:', err)
    }
    setLoadingDetail(false)
  }

  async function updateRsvp(playerId, status) {
    const event = events.find(e => e.id === expandedEventId)
    if (!event) return
    try {
      const existingRsvp = rsvps.find(r => r.player_id === playerId)
      if (existingRsvp) {
        await supabase.from('event_rsvps').update({ status, updated_at: new Date().toISOString() }).eq('id', existingRsvp.id)
      } else {
        await supabase.from('event_rsvps').insert({ event_id: event.id, player_id: playerId, status, responded_by: user?.id })
      }
      showToast('RSVP updated', 'success')
      toggleEventExpand(event) // re-opens to reload
      setExpandedEventId(event.id)
      loadEvents()
    } catch (err) { showToast('Error updating RSVP', 'error') }
  }

  async function assignVolunteer(role, position, profileId) {
    const event = events.find(e => e.id === expandedEventId)
    if (!event) return
    try {
      const existing = volunteers.find(v => v.role === role && v.position === position)
      if (existing) { showToast('This slot is already filled', 'error'); return }
      await supabase.from('event_volunteers').insert({ event_id: event.id, profile_id: profileId, role, position })
      showToast('Volunteer assigned!', 'success')
      toggleEventExpand(event)
      setExpandedEventId(event.id)
      loadEvents()
    } catch (err) { showToast('Error assigning volunteer', 'error') }
  }

  async function removeVolunteer(volunteerId) {
    if (!confirm('Remove this volunteer?')) return
    const event = events.find(e => e.id === expandedEventId)
    try {
      await supabase.from('event_volunteers').delete().eq('id', volunteerId)
      showToast('Volunteer removed', 'success')
      if (event) { toggleEventExpand(event); setExpandedEventId(event.id) }
      loadEvents()
    } catch (err) { showToast('Error removing volunteer', 'error') }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Stats
  const stats = [
    { icon: '📋', value: events.length, label: 'Total Events', color: 'text-slate-900' },
    { icon: '🏐', value: events.filter(e => e.event_type === 'game').length, label: 'Games', color: 'text-amber-600' },
    { icon: '⚡', value: events.filter(e => e.event_type === 'practice').length, label: 'Practices', color: 'text-emerald-600' },
    { icon: '⚠️', value: events.filter(e => e.event_type === 'game' && (!e.volunteer_info?.line_judge || !e.volunteer_info?.scorekeeper)).length, label: 'Need Volunteers', color: 'text-red-600' },
  ]

  return (
    <PageShell
      breadcrumb="Attendance & RSVP"
      title="Attendance & RSVP"
      subtitle={`Track RSVPs and manage volunteers${selectedSeason?.name ? ` · ${selectedSeason.name}` : ''}`}
    >
      <SeasonFilterBar />
      <InnerStatRow stats={stats} />

      {/* Filters */}
      <div className="flex gap-3 items-center mb-5 flex-wrap">
        <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
          className={`px-4 py-2.5 rounded-xl border text-sm font-medium outline-none focus:border-[#4BB9EC] focus:ring-2 focus:ring-[#4BB9EC]/10 ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-white border-[#E8ECF2] text-[#10284C]'}`}>
          <option value="all">All Teams</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/[0.04]' : 'bg-[#F5F6F8]'}`}>
          {['upcoming', 'past', 'all'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                viewMode === mode ? 'bg-[#4BB9EC]/15 text-[#4BB9EC]' : `text-slate-400 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100'}`
              }`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Event List with Inline Expand */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className={`${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-[#E8ECF2]'} rounded-[14px] p-12 text-center`}>
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#10284C]'}`} style={{ fontFamily: 'var(--v2-font)' }}>No Events Found</h3>
          <p className="text-sm text-slate-400">No {viewMode} events match your filters</p>
        </div>
      ) : (
        <div>
          {events.map(event => {
            const isExpanded = expandedEventId === event.id
            const needsVol = event.event_type === 'game' && (!event.volunteer_info?.line_judge || !event.volunteer_info?.scorekeeper)

            return (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  event_type: event.event_type,
                  title: event.title,
                  date_display: formatDate(event.event_date),
                  time_display: formatTime12(event.event_time),
                  venue: event.venue_name || '',
                  team_name: event.teams?.name || '',
                  needs_volunteers: needsVol,
                  rsvp_counts: {
                    going: event.rsvp_counts_raw?.yes || 0,
                    no: event.rsvp_counts_raw?.no || 0,
                    maybe: event.rsvp_counts_raw?.maybe || 0,
                  }
                }}
                onClick={() => toggleEventExpand(event)}
                expandable
                expanded={isExpanded}
              >
                {/* Expanded inline detail */}
                {loadingDetail ? (
                  <div className="text-center py-6 text-slate-400">Loading details...</div>
                ) : (
                  <div className="space-y-5">
                    {/* RSVP Summary Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Going', count: rsvps.filter(r => r.status === 'yes').length, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                        { label: "Can't Go", count: rsvps.filter(r => r.status === 'no').length, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
                        { label: 'Maybe', count: rsvps.filter(r => r.status === 'maybe').length, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                        { label: 'Pending', count: teamPlayers.length - rsvps.length, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
                      ].map(s => (
                        <div key={s.label} className={`${s.bg} ${s.border} border rounded-xl p-3 text-center`}>
                          <div className={`text-2xl font-extrabold ${s.text}`}>{Math.max(0, s.count)}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Player Roster with RSVP Buttons */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Player RSVPs</h4>
                      <div className="space-y-1">
                        {teamPlayers.map((tp, idx) => {
                          const player = tp.players
                          if (!player) return null
                          const rsvp = rsvps.find(r => r.player_id === player.id)
                          const status = rsvp?.status

                          return (
                            <div key={tp.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                              <div className="flex items-center gap-2">
                                {tp.jersey_number && (
                                  <span className="w-6 h-6 rounded bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">
                                    {tp.jersey_number}
                                  </span>
                                )}
                                <span
                                  className="text-sm font-medium text-slate-800 cursor-pointer hover:text-lynx-sky hover:underline"
                                  onClick={(e) => { e.stopPropagation(); setSelectedPlayerForCard(player) }}
                                >
                                  {player.first_name} {player.last_name}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {[
                                  { s: 'yes', label: '✓', active: 'bg-emerald-500 text-white', inactive: 'bg-slate-200 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600' },
                                  { s: 'no', label: '✕', active: 'bg-red-500 text-white', inactive: 'bg-slate-200 text-slate-400 hover:bg-red-100 hover:text-red-600' },
                                  { s: 'maybe', label: '?', active: 'bg-amber-500 text-white', inactive: 'bg-slate-200 text-slate-400 hover:bg-amber-100 hover:text-amber-600' },
                                ].map(btn => (
                                  <button key={btn.s}
                                    onClick={(e) => { e.stopPropagation(); updateRsvp(player.id, btn.s) }}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${status === btn.s ? btn.active : btn.inactive}`}>
                                    {btn.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {teamPlayers.length === 0 && (
                          <p className="text-center text-slate-400 text-sm py-4">No players on this team</p>
                        )}
                      </div>
                    </div>

                    {/* Volunteers Section (Games Only) */}
                    {event.event_type === 'game' && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Volunteers</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['line_judge', 'scorekeeper'].map(role => (
                            <div key={role} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span>{role === 'line_judge' ? '🚩' : '📋'}</span>
                                <span className="text-sm font-semibold text-slate-800">{role === 'line_judge' ? 'Line Judge' : 'Scorekeeper'}</span>
                              </div>
                              {['primary', 'backup_1', 'backup_2'].map(position => {
                                const vol = volunteers.find(v => v.role === role && v.position === position)
                                const isAssigning = volunteerAssignModal?.role === role && volunteerAssignModal?.position === position
                                return (
                                  <div key={position} className="flex items-center justify-between py-1.5 border-t border-slate-200">
                                    <span className="text-xs text-slate-400 w-16">
                                      {position === 'primary' ? 'Primary' : position === 'backup_1' ? 'Backup 1' : 'Backup 2'}
                                    </span>
                                    {vol ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-700">{vol.profiles?.full_name || 'Assigned'}</span>
                                        <button onClick={(e) => { e.stopPropagation(); removeVolunteer(vol.id) }}
                                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                      </div>
                                    ) : isAssigning ? (
                                      <div className="flex items-center gap-1">
                                        <select autoFocus
                                          onClick={e => e.stopPropagation()}
                                          onChange={(e) => { if (e.target.value) assignVolunteer(role, position, e.target.value); setVolunteerAssignModal(null) }}
                                          onBlur={() => setVolunteerAssignModal(null)}
                                          className="rounded px-2 py-1 text-xs border border-slate-200 bg-white text-slate-700 max-w-[140px]">
                                          <option value="">Select parent...</option>
                                          {availableParents.filter(p => !volunteers.some(v => v.profile_id === p.id))
                                            .map(parent => <option key={parent.id} value={parent.id}>{parent.full_name || 'Parent'}</option>)}
                                        </select>
                                      </div>
                                    ) : (
                                      <button onClick={(e) => { e.stopPropagation(); setVolunteerAssignModal({ role, position }) }}
                                        className={`text-sm hover:underline ${position === 'primary' ? 'text-lynx-sky font-semibold' : 'text-slate-400 hover:text-lynx-sky'}`}>
                                        {position === 'primary' ? '+ Assign' : '+ Add'}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Send Reminders Button */}
                    <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
                      <button onClick={(e) => { e.stopPropagation(); showToast('Reminder sent to pending players', 'success') }}
                        className="bg-lynx-navy-subtle text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:brightness-110 transition">
                        📩 Send RSVP Reminders
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setExpandedEventId(null) }}
                        className="text-sm text-slate-400 hover:text-[#4BB9EC] font-bold transition">
                        Collapse ▲
                      </button>
                    </div>
                  </div>
                )}
              </EventCard>
            )
          })}
        </div>
      )}

      {/* Player Card Modal */}
      {selectedPlayerForCard && (
        <PlayerCardExpanded
          player={selectedPlayerForCard}
          visible={!!selectedPlayerForCard}
          onClose={() => setSelectedPlayerForCard(null)}
          context="attendance"
        />
      )}
    </PageShell>
  )
}

export { AttendancePage }
