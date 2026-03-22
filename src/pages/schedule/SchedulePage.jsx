import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason, isAllSeasons } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useParentTutorial } from '../../contexts/ParentTutorialContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, ChevronRight, BarChart3, Share2 } from '../../constants/icons'
import { SkeletonSchedulePage } from '../../components/ui'
import SchedulePosterModal from './SchedulePosterModal'
import GameDayShareModal from './GameDayShareModal'
import { getEventColor, formatTime, formatTime12, VolleyballIcon, exportEventsToICal } from './scheduleHelpers'
import { MonthView, WeekView, DayView, ListView } from './CalendarViews'
import ScheduleStatRow from './ScheduleStatRow'
import ScheduleUpcomingStrip from './ScheduleUpcomingStrip'
import LineupBuilder from './LineupBuilder'
import GameCompletionModal from './GameCompletionModal'
import AddEventModal from './AddEventModal'
import BulkPracticeModal from './BulkPracticeModal'
import BulkGamesModal from './BulkGamesModal'
import BulkEventWizard from './BulkEventWizard'
import VenueManagerModal from './VenueManagerModal'
import AvailabilitySurveyModal from './AvailabilitySurveyModal'
import EventDetailModal from './EventDetailModal'
import PageShell from '../../components/pages/PageShell'
import SeasonFilterBar from '../../components/pages/SeasonFilterBar'

function SchedulePage({ showToast, activeView, roleContext }) {
  const journey = useJourney()
  const parentTutorial = useParentTutorial()
  const { organization } = useAuth()
  const { selectedSeason, allSeasons } = useSeason()
  const { selectedSport } = useSport()
  const { isDark } = useTheme()
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedEventType, setSelectedEventType] = useState('all')

  const isParentView = activeView === 'parent'
  const isPlayerView = activeView === 'player'
  const parentChildIds = roleContext?.children?.map(c => c.id) || []

  useEffect(() => {
    if (isParentView) parentTutorial?.completeStep?.('view_schedule')
  }, [isParentView])

  // Modals
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showBulkPractice, setShowBulkPractice] = useState(false)
  const [showBulkGames, setShowBulkGames] = useState(false)
  const [showBulkWizard, setShowBulkWizard] = useState(false)
  const [showVenueManager, setShowVenueManager] = useState(false)
  const [showAvailabilitySurvey, setShowAvailabilitySurvey] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showPosterModal, setShowPosterModal] = useState(false)
  const [showGameDayCard, setShowGameDayCard] = useState(null)
  const [allUpcomingGames, setAllUpcomingGames] = useState([])

  // Helper: get season IDs filtered by sport (for "All Seasons" + sport filter)
  function getSportSeasonIds() {
    if (!selectedSport?.id) return null
    return (allSeasons || []).filter(s => s.sport_id === selectedSport.id).map(s => s.id)
  }

  useEffect(() => {
    if (selectedSeason?.id) { loadEvents(); loadTeams(); loadVenues() }
  }, [selectedSeason?.id, currentDate, selectedSport?.id])

  async function loadEvents() {
    if (!selectedSeason?.id) return
    setLoading(true)
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = startOfMonth.toISOString().split('T')[0]
    const endDate = endOfMonth.toISOString().split('T')[0]

    let query = supabase
      .from('schedule_events')
      .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')
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
      }
    }
    const { data, error } = await query
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })

    if (error) console.error('Error loading events:', error)

    // Filter events to user's teams for parent/player roles
    let filteredData = data || []
    if (activeView === 'parent' && roleContext?.children?.length > 0) {
      const childTeamIds = new Set()
      roleContext.children.forEach(child => {
        child.team_players?.forEach(tp => { if (tp.team_id) childTeamIds.add(tp.team_id) })
      })
      if (childTeamIds.size > 0) {
        filteredData = filteredData.filter(event => !event.team_id || childTeamIds.has(event.team_id))
      }
    }
    if (activeView === 'player' && roleContext?.playerInfo?.team_players?.length > 0) {
      const playerTeamIds = new Set(roleContext.playerInfo.team_players.map(tp => tp.team_id).filter(Boolean))
      if (playerTeamIds.size > 0) {
        filteredData = filteredData.filter(event => !event.team_id || playerTeamIds.has(event.team_id))
      }
    }

    const transformedData = filteredData.map(event => ({
      ...event,
      start_time: event.event_date && event.event_time
        ? `${event.event_date}T${event.event_time}` : event.event_date,
      end_time_full: event.event_date && event.end_time
        ? `${event.event_date}T${event.end_time}` : null
    }))
    setEvents(transformedData)
    setLoading(false)
  }

  async function loadTeams() {
    if (!selectedSeason?.id) return
    let query = supabase.from('teams').select('id, name, color, logo_url')
    if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
      query = query.eq('season_id', selectedSeason.id)
    } else {
      const sportIds = getSportSeasonIds()
      if (sportIds && sportIds.length > 0) {
        query = query.in('season_id', sportIds)
      } else if (sportIds && sportIds.length === 0) {
        setTeams([])
        return
      }
    }
    const { data } = await query.order('name')
    setTeams(data || [])
  }

  async function loadVenues() {
    if (!organization?.id) return
    setVenues(organization.settings?.venues || [])
  }

  async function saveVenues(newVenues) {
    const newSettings = { ...organization.settings, venues: newVenues }
    await supabase.from('organizations').update({ settings: newSettings }).eq('id', organization.id)
    setVenues(newVenues)
    showToast('Venues saved!', 'success')
  }

  async function createEvent(eventData) {
    try {
      const { error } = await supabase.from('schedule_events').insert({
        ...eventData, season_id: selectedSeason.id, created_at: new Date().toISOString()
      })
      if (error) throw error
      showToast('Event created!', 'success')
      journey?.completeStep('create_schedule')
      loadEvents()
      return true
    } catch (err) { showToast('Error: ' + err.message, 'error'); return false }
  }

  async function createBulkEvents(eventsData) {
    try {
      const evts = eventsData.map(e => ({ ...e, season_id: selectedSeason.id, created_at: new Date().toISOString() }))
      const { error } = await supabase.from('schedule_events').insert(evts)
      // If series_id column doesn't exist yet, retry without it
      if (error && error.message?.includes('series_id')) {
        const evtsNoSeries = evts.map(({ series_id, ...rest }) => rest)
        const { error: retryError } = await supabase.from('schedule_events').insert(evtsNoSeries)
        if (retryError) throw retryError
      } else if (error) {
        throw error
      }
      showToast(`${evts.length} events created!`, 'success')
      journey?.completeStep('create_schedule')
      loadEvents()
      return true
    } catch (err) { showToast('Error: ' + err.message, 'error'); return false }
  }

  async function updateEvent(eventId, eventData) {
    try {
      const { error } = await supabase.from('schedule_events')
        .update({ ...eventData, updated_at: new Date().toISOString() }).eq('id', eventId)
      if (error) throw error
      showToast('Event updated!', 'success')
      loadEvents()
      return true
    } catch (err) { showToast('Error: ' + err.message, 'error'); return false }
  }

  async function deleteEvent(eventId) {
    if (!confirm('Delete this event?')) return
    try {
      const { error } = await supabase.from('schedule_events').delete().eq('id', eventId)
      if (error) throw error
      showToast('Event deleted', 'success')
      setSelectedEvent(null)
      loadEvents()
    } catch (err) { showToast('Error: ' + err.message, 'error') }
  }

  async function updateSeriesEvents(seriesId, eventData) {
    try {
      const { error } = await supabase.from('schedule_events')
        .update({ ...eventData, updated_at: new Date().toISOString() })
        .eq('series_id', seriesId)
      if (error) throw error
      showToast('All events in series updated!', 'success')
      loadEvents()
      return true
    } catch (err) { showToast('Error: ' + err.message, 'error'); return false }
  }

  async function deleteSeriesEvents(seriesId, futureOnly, currentEventDate) {
    const msg = futureOnly
      ? 'Delete all future events in this series?'
      : 'Delete ALL events in this series?'
    if (!confirm(msg)) return
    try {
      let query = supabase.from('schedule_events').delete().eq('series_id', seriesId)
      if (futureOnly && currentEventDate) {
        query = query.gte('event_date', currentEventDate)
      }
      const { error } = await query
      if (error) throw error
      showToast('Series events deleted', 'success')
      setSelectedEvent(null)
      loadEvents()
    } catch (err) { showToast('Error: ' + err.message, 'error') }
  }

  // Filtering
  const filteredEvents = events.filter(e => {
    if (selectedTeam === 'all') {
      if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false
      return true
    }
    if (e.team_id !== selectedTeam && e.team_id !== null) return false
    if (selectedEventType !== 'all' && e.event_type !== selectedEventType) return false
    return true
  })

  function prevMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)) }
  function goToToday() { setCurrentDate(new Date()) }

  // Load upcoming games for the strip
  useEffect(() => {
    if (selectedSeason?.id) loadAllUpcoming()
  }, [selectedSeason?.id, selectedTeam])

  async function loadAllUpcoming() {
    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('schedule_events')
      .select('*, teams!schedule_events_team_id_fkey(id, name, color, logo_url)')
    if (!isAllSeasons(selectedSeason) && selectedSeason?.id) {
      query = query.eq('season_id', selectedSeason.id)
    }
    const { data } = await query
      .eq('event_type', 'game')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
      .limit(6)
    setAllUpcomingGames(data || [])
  }

  const upcomingGames = filteredEvents.filter(e => e.event_type === 'game' && new Date(e.event_date) >= new Date())
  const dropdownCls = isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'
  const dropdownItemCls = isDark ? 'text-white hover:bg-white/[0.04]' : 'text-slate-800 hover:bg-slate-50'

  return (
    <PageShell
      breadcrumb="Schedule"
      title="Schedule"
      subtitle={`${selectedSeason?.name || 'Schedule'} · ${filteredEvents.length} events`}
      actions={
        <div className="flex gap-2">
          {/* Share & Export */}
          <div className="relative">
            <button onClick={() => setShowShareMenu(!showShareMenu)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-semibold border transition ${
                isDark ? 'bg-lynx-charcoal border-white/[0.06] text-slate-300 hover:bg-white/[0.04]' : 'bg-white border-slate-200 text-slate-500 hover:border-lynx-sky hover:text-lynx-sky'
              }`}>
              <Share2 className="w-4 h-4" /> Share & Export ▾
            </button>
            {showShareMenu && (
              <div className={`absolute right-0 mt-2 w-64 rounded-[14px] shadow-2xl z-30 border overflow-hidden ${dropdownCls}`}>
                <div className={`px-4 py-2 text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-500 bg-white/[0.02]' : 'text-slate-400 bg-slate-50'}`}>Generate</div>
                <button onClick={() => { setShowPosterModal(true); setShowShareMenu(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${dropdownItemCls}`}>
                  <span className="text-xl">📋</span>
                  <div><div className="font-semibold text-base">Season Poster</div><div className="text-sm text-slate-400">Branded schedule graphic</div></div>
                </button>
                {upcomingGames.length > 0 && (
                  <button onClick={() => { setShowGameDayCard(upcomingGames[0]); setShowShareMenu(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${dropdownItemCls}`}>
                    <span className="text-xl">🏟️</span>
                    <div><div className="font-semibold text-base">Game Day Card</div><div className="text-sm text-slate-400">Share next game on social</div></div>
                  </button>
                )}
                <div className={`px-4 py-2 text-sm font-bold uppercase tracking-wider border-t ${isDark ? 'text-slate-500 bg-white/[0.02] border-white/[0.06]' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>Export</div>
                <button onClick={() => { exportEventsToICal(filteredEvents, selectedSeason?.name, showToast); setShowShareMenu(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${dropdownItemCls}`}>
                  <span className="text-xl">📅</span>
                  <div><div className="font-semibold text-base">Export to Calendar</div><div className="text-sm text-slate-400">iCal (.ics) for Google/Apple</div></div>
                </button>
                <button onClick={() => { window.print(); setShowShareMenu(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${dropdownItemCls}`}>
                  <span className="text-xl">🖨️</span>
                  <div><div className="font-semibold text-base">Print Schedule</div><div className="text-sm text-slate-400">Print or save as PDF</div></div>
                </button>
              </div>
            )}
          </div>
          {/* Add Events — admin/coach only */}
          {!isParentView && !isPlayerView && (
            <div className="relative">
              <button onClick={() => setShowQuickActions(!showQuickActions)}
                className="bg-lynx-sky text-lynx-navy font-bold px-4 py-2.5 rounded-xl hover:bg-lynx-sky/80 flex items-center gap-2 text-base transition">
                ➕ Add Events ▾
              </button>
              {showQuickActions && (
                <div className={`absolute right-0 mt-2 w-56 rounded-[14px] shadow-2xl z-30 border overflow-hidden ${dropdownCls}`}>
                  <button onClick={() => { setShowAddEvent(true); setShowQuickActions(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 ${dropdownItemCls}`}><span>📝</span> Single Event</button>
                  <button onClick={() => { setShowBulkWizard(true); setShowQuickActions(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 ${dropdownItemCls}`}><span>📋</span> Create Event Series</button>
                  <button onClick={() => { setShowVenueManager(true); setShowQuickActions(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 ${dropdownItemCls}`}><span>📍</span> Manage Venues</button>
                  <button onClick={() => { setShowAvailabilitySurvey(true); setShowQuickActions(false) }} className={`w-full text-left px-4 py-3 flex items-center gap-3 ${dropdownItemCls}`}><BarChart3 className="w-5 h-5" /> Availability Survey</button>
                </div>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-5">
      <SeasonFilterBar />
      <ScheduleStatRow events={events} activeView={activeView} />

      <ScheduleUpcomingStrip
        allUpcomingGames={allUpcomingGames}
        upcomingGames={upcomingGames}
        teams={teams}
        onSelectEvent={setSelectedEvent}
        onShareGame={setShowGameDayCard}
      />

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
            className={`rounded-xl px-4 py-2.5 text-base font-medium border ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <option value="all">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)}
            className={`rounded-xl px-4 py-2.5 text-base font-medium border ${isDark ? 'bg-lynx-charcoal border-white/[0.06] text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <option value="all">All Types</option>
            <option value="practice">Practices</option>
            <option value="game">Games</option>
            <option value="tournament">Tournaments</option>
            <option value="team_event">Team Events</option>
            <option value="other">Other</option>
          </select>
          <div className="hidden sm:flex items-center gap-3 ml-2">
            {[{ type: 'practice', label: 'Practice', color: '#10B981' }, { type: 'game', label: 'Game', color: '#F59E0B' }, { type: 'tournament', label: 'Tourney', color: '#8B5CF6' }].map(t => (
              <div key={t.type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-sm font-medium text-slate-400">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
          {['list', 'month', 'week', 'day'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                view === v ? 'bg-lynx-sky text-lynx-navy' : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
              }`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className={`flex items-center justify-between rounded-[14px] p-3 border ${isDark ? 'bg-lynx-charcoal border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <button onClick={prevMonth} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToToday} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Today
          </button>
        </div>
        <button onClick={nextMonth} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-white/[0.04] text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar View */}
      {loading ? <SkeletonSchedulePage /> : view === 'month' ? (
        <MonthView events={filteredEvents} currentDate={currentDate} onSelectEvent={setSelectedEvent} onSelectDate={(date) => { setCurrentDate(date); setView('day') }} teams={teams} />
      ) : view === 'week' ? (
        <WeekView events={filteredEvents} currentDate={currentDate} onSelectEvent={setSelectedEvent} teams={teams} />
      ) : view === 'day' ? (
        <DayView events={filteredEvents} currentDate={currentDate} onSelectEvent={setSelectedEvent} teams={teams} />
      ) : (
        <ListView events={filteredEvents} onSelectEvent={setSelectedEvent} teams={teams} />
      )}

      <div className="text-center text-base text-slate-400">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} this month
      </div>

      {/* Modals */}
      {showAddEvent && <AddEventModal teams={teams} venues={venues} onClose={() => setShowAddEvent(false)} onCreate={createEvent} />}
      {showBulkPractice && <BulkPracticeModal teams={teams} venues={venues} onClose={() => setShowBulkPractice(false)} onCreate={createBulkEvents} />}
      {showBulkGames && <BulkGamesModal teams={teams} venues={venues} onClose={() => setShowBulkGames(false)} onCreate={createBulkEvents} />}
      {showBulkWizard && <BulkEventWizard teams={teams} venues={venues} onClose={() => setShowBulkWizard(false)} onCreate={createBulkEvents} showToast={showToast} />}
      {showVenueManager && <VenueManagerModal venues={venues} onClose={() => setShowVenueManager(false)} onSave={saveVenues} />}
      {showAvailabilitySurvey && <AvailabilitySurveyModal teams={teams} organization={organization} onClose={() => setShowAvailabilitySurvey(false)} showToast={showToast} />}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} teams={teams} venues={venues} onClose={() => setSelectedEvent(null)} onUpdate={updateEvent} onDelete={deleteEvent}
          onUpdateSeries={updateSeriesEvents} onDeleteSeries={deleteSeriesEvents}
          activeView={activeView} selectedSeason={selectedSeason} parentChildIds={parentChildIds} showToast={showToast}
          onShareGameDay={(evt) => { setSelectedEvent(null); setShowGameDayCard(evt) }} parentTutorial={parentTutorial} />
      )}
      {showPosterModal && (
        <SchedulePosterModal season={selectedSeason} team={selectedTeam !== 'all' ? teams.find(t => t.id === selectedTeam) : teams[0]}
          organization={organization} events={events} onClose={() => setShowPosterModal(false)} showToast={showToast} />
      )}
      {showGameDayCard && (
        <GameDayShareModal event={showGameDayCard} team={teams.find(t => t.id === showGameDayCard.team_id) || teams[0]}
          organization={organization} season={selectedSeason} onClose={() => setShowGameDayCard(null)} showToast={showToast} />
      )}

      {(showQuickActions || showShareMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowQuickActions(false); setShowShareMenu(false) }} />
      )}
      </div>
    </PageShell>
  )
}

export { SchedulePage, getEventColor, formatTime, formatTime12 }
